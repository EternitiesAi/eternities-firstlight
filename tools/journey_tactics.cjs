'use strict';
/* Bot tactics for the title-to-credits journey. install() wraps Simulation.tick once, so every producer's step loop runs
 * the same fight step: when a locked shape's warning covers the player, step out of it, then return to the spot the
 * producer was standing on (the anchor) so its scripted attacks are still in reach. Also: drink a tonic under 35% health,
 * wear the best owned gear of each style, and meter every boss (fight time, player hits, hp lost, tonics used).
 * Every change is a real command or a real movement; nothing here plants a defeat, a position or a stat. Errors are not
 * swallowed: a broken tactic stops the bot. */
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'src/core.js'));
const A = require(path.join(ROOT, 'src/adventure.js'));
const T = require(path.join(ROOT, 'src/combat.js'));
const HEAL_BELOW = .35, MARGIN = .3, DODGE = true;
const G = globalThis;
let installed = false, seq = 0;
const meter = new Map(), finished = [];
const fight = { anchor: null, target: null };
let stepsOut = 0; // every time the shared step leaves a warned spot; the bot prints the total.
// a producer's walk owns the player until it arrives and asserts it; a dodge inside that frame would undo the arrival.
const WALKING = /\bat (walk|walkTo|goTo|go|travel)\b/;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// the boss a row is metered under. campaign bosses are metered by their enemy id; the Regent by body; the chains as one fight.
function bossKey(e) {
 if (e.finaleRole === 'regent') return 'regent body ' + e.finalePhase;
 if (e.finaleRole === 'chain') return 'chains';
 return ({ hart: 'hart', 'road-ram': 'ram', 'siege-herald': 'herald', 'cross-warden': 'keeper',
  'hell-foundry-warden-v1': 'foundry warden', 'heaven-relay-seraph-v1': 'relay seraph',
  'atlantis-breakwater-custodian-v1': 'witness guardian' })[e.id] || null;
}

// a zone is a predicate over a point: true when the point is inside the strike the enemy has locked.
function zoneOf(e) {
 if (e.mode !== 'windup' && e.mode !== 'charge') return null;
 const owners = [['earthHomecoming', 'RealmEarthHomecoming'], ['cosmosCampaign', 'RealmCosmosCampaign'],
  ['atlantisCampaign', 'RealmAtlantisCampaign'], ['heavenCampaign', 'RealmHeavenCampaign'],
  ['hellCampaign', 'RealmHellCampaign'], ['expeditionQuest', 'RealmEarthExpedition']];
 for (const [flag, mod] of owners) if (e[flag] && G[mod] && typeof G[mod].strikeContains === 'function') return q => !!G[mod].strikeContains(e, q);
 if (e.mode === 'charge' && e.chargeDir) {
  const len = Math.max(0, e.chargeLeft || 0);
  return q => { const dx = q.x - e.x, dz = q.z - e.z, u = Math.max(0, Math.min(len, dx * e.chargeDir.x + dz * e.chargeDir.z));
   return Math.hypot(q.x - (e.x + e.chargeDir.x * u), q.z - (e.z + e.chargeDir.z * u)) < .6 + MARGIN; };
 }
 if (e.omen) {
  const t = e.omen;
  if (t.kind === 'line' || t.kind === 'bait') return q => T.inLine({ ...t, half: (t.half || 0) + MARGIN }, q);
  if (t.kind === 'double') { const r = (t.stage === 2 ? t.r2 : Math.max(t.r1, t.r2)) + MARGIN; return q => T.inRing({ x: t.x, z: t.z }, r, q); }
  return null;
 }
 if (e.custom === 'bell' && e.aim) return q => G.RealmCrossing.inImpact({ ...e, aim: e.aim }, q);
 if (e.aim && Number.isFinite(e.aim.x)) {
  const r = (e.telegraphRadius ?? (e.kind === 'boss' || e.kind === 'siegeboss' ? 2.4 : e.kind === 'sentinel' ? 1.2 : 1.05)) + MARGIN;
  return q => Math.hypot(q.x - e.aim.x, q.z - e.aim.z) < r + .24;
 }
 return null;
}
const activeZones = sim => A.runtime(sim).enemies.filter(e => e.hp > 0 && !e.hidden).map(zoneOf).filter(Boolean);

// the nearest walkable point outside every zone, with a little clearance from each zone's edge.
function safeSpot(sim, zones) {
 const p = sim.state.player; let best = null;
 for (let r = .6; r <= 3.2; r += .6) for (let k = 0; k < 16; k++) {
  const a = k / 16 * Math.PI * 2, q = { x: p.x + Math.sin(a) * r, z: p.z + Math.cos(a) * r };
  if (!A.ground(sim, q.x, q.z, .31)) continue;
  if (zones.some(z => z(q) || z({ x: q.x + .25, z: q.z }) || z({ x: q.x - .25, z: q.z }) || z({ x: q.x, z: q.z + .25 }) || z({ x: q.x, z: q.z - .25 }))) continue;
  if (!best || r < best.r) best = { ...q, r };
 }
 return best;
}

// a safe spot that still reaches the selected foe, so the producer's next scripted attack lands from where we stand.
function reachSpot(sim, zones, sel, reach) {
 const p = sim.state.player; let best = null;
 for (let r = .3; r <= 3.2; r += .4) for (let k = 0; k < 16; k++) {
  const a = k / 16 * Math.PI * 2, q = { x: p.x + Math.sin(a) * r, z: p.z + Math.cos(a) * r };
  if (!A.ground(sim, q.x, q.z, .31) || zones.some(z => z(q))) continue;
  if (sel && dist(q, sel) > reach - .35) continue;
  if (!best || r < best.r) best = { ...q, r };
 }
 return best;
}

// the shared fight step. the anchor is where the producer stood when the first warning reached it; the step leaves a
// warned spot, and once every warning is clear it walks back to the anchor so the producer's next attack is in reach.
function fightStep(sim) {
 if (WALKING.test(new Error().stack)) { fight.anchor = null; fight.target = null; return; }
 const p = sim.state.player, zones = activeZones(sim), danger = q => zones.some(z => z(q));
 // no foe left near us: the fight is over, so no return walk (the producer's next loot or walk owns the player now).
 if (!A.runtime(sim).enemies.some(e => e.hp > 0 && !e.hidden && e.kind !== 'practice' && dist(e, p) < 12)) { fight.anchor = null; fight.target = null; return; }
 if (!fight.anchor) {
  if (!zones.length || !danger(p)) return;
  fight.anchor = { x: p.x, z: p.z }; fight.target = null;
 }
 const anchor = fight.anchor, sel = G.RealmCombat.selected(sim), reach = G.RealmArsenal.weapon(sim.state.adventure).reach;
 if (danger(p)) {
  const q = safeSpot(sim, zones);
  if (!q) return;
  if (fight.target && dist(fight.target, q) < .3 && sim.playerPath.length) return;
  if (!(fight.target && sim.playerPath.length)) stepsOut++;
  fight.target = q; sim.moveTo(q.x, q.z);
  return;
 }
 if (danger(anchor)) return;                       // the anchor is still under a warning: wait out of it
 if (dist(p, anchor) <= .3) { fight.anchor = null; fight.target = null; return; }
 if (!sim.playerPath.length) { fight.target = anchor; sim.moveTo(anchor.x, anchor.z); }
}

function equipBest(sim) {
 const s = sim.state.adventure, GEAR = A.GEAR;
 for (const slot of ['weapon', 'armor', 'charm']) {
  const cur = s.equipment[slot], style = cur && GEAR[cur] ? (GEAR[cur].style || 'blade') : null;
  const score = id => GEAR[id].attack * 2 + GEAR[id].defense * 3 + GEAR[id].hp * .5;
  const pool = s.owned.filter(id => GEAR[id] && GEAR[id].slot === slot && (slot !== 'weapon' || (GEAR[id].style || 'blade') === (style || 'blade')));
  if (!pool.length) continue;
  const best = pool.reduce((b, id) => (score(id) > score(b) ? id : b), pool[0]);
  if (best !== cur && (!cur || !GEAR[cur] || score(best) > score(cur))) {
   const r = sim.adventureCommand('tactic-equip-' + (++seq), 'equip', { id: best });
   if (!r.ok) throw Error('tactic equip refused: ' + best + ' ' + r.error);
  }
 }
}

function heal(sim) {
 const s = sim.state.adventure, r = A.runtime(sim), max = A.stats(s).maxHP;
 if (!s.started || s.hp <= 0 || s.hp >= max * HEAL_BELOW || s.tonics <= 0 || s.elapsed < r.cooldowns.heal) return;
 const res = sim.adventureCommand('tactic-heal-' + (++seq), 'heal', {});
 if (!res.ok) throw Error('tactic heal refused: ' + res.error);
}

// meter: a fight starts at the boss's first damage or first locked strike, and ends at its death or the player's.
function meterStep(sim) {
 const s = sim.state.adventure, live = A.runtime(sim).enemies;
 const seen = new Set();
 for (const e of live) {
  const key = bossKey(e); if (!key) continue;
  seen.add(key);
  let m = meter.get(key);
  if (!m) {
   if (!(e.hp < e.maxHP || e.mode === 'windup' || e.mode === 'charge' || key === 'chains')) continue;
   m = { boss: key, start: s.elapsed, hits: 0, hpLost: 0, tonics: 0, lastHp: s.hp, lastTonics: s.tonics, lastHitAt: e.hitAt };
   meter.set(key, m);
  }
  if (m.done) continue;
  if (e.hitAt !== m.lastHitAt) { m.hits++; m.lastHitAt = e.hitAt; }
  m.hpLost += Math.max(0, m.lastHp - s.hp); m.tonics += Math.max(0, m.lastTonics - s.tonics);
  m.lastHp = s.hp; m.lastTonics = s.tonics;
  m.lastEnemyHp = e.hp;
  if (key !== 'chains' && e.hp === 0) finish(m, 'killed', s.elapsed);
 }
 // chains end when no chain is left standing; a fight the player falls in ends as lost.
 const chainsLeft = live.some(e => e.finaleRole === 'chain' && e.hp > 0), m = meter.get('chains');
 if (m && !m.done && !chainsLeft && live.some(e => e.finaleRole === 'regent')) finish(m, 'broken', s.elapsed);
 // a boss that leaves the live list closes its row: killed when its last seen hp was zero, otherwise left the scene.
 // a regent body that leaves when the saga moves past it was killed: the defeat advances the phase in the same tick.
 const phase = sim.state.saga?.finale?.phase ?? 0, won = !!sim.state.saga?.finale?.won;
 for (const m of meter.values()) if (!m.done && m.boss !== 'chains' && !seen.has(m.boss)) {
  const body = /^regent body (\d)$/.exec(m.boss);
  const down = body && (won || phase > Number(body[1]));
  finish(m, m.lastEnemyHp === 0 || down ? 'killed' : 'left', s.elapsed);
 }
 for (const m of meter.values()) if (!m.done && s.hp <= 0) finish(m, 'fell', s.elapsed);
}
function finish(m, outcome, now) { m.done = true; m.outcome = outcome; m.secs = +(now - m.start).toFixed(1); finished.push(m); }

function act(sim) {
 const s = sim.state.adventure;
 if (!s || !s.started) return;
 meterStep(sim);
 equipBest(sim);
 heal(sim);
 if (dodging) fightStep(sim);
}
// the bot turns the step off for stages whose scripted fight braces and stands (the connected realm helpers), where the
// step stalls their auto-attack; everywhere else the step is on.
let dodging = DODGE;
function setDodge(on) { dodging = !!on; if (!on) { fight.anchor = null; fight.target = null; } }

function install() {
 if (installed) return; installed = true;
 const orig = C.Simulation.prototype.tick;
 C.Simulation.prototype.tick = function (dt) { const r = orig.call(this, dt); act(this); return r; };
}
// the table: one row per metered boss, in the order the journey met them.
// a fight still open when the journey stops is printed as open, with what it had cost so far.
function table() {
 const rows = finished.slice().map(m => ({ boss: m.boss, outcome: m.outcome, secs: m.secs, hits: m.hits, hpLost: m.hpLost, tonics: m.tonics }));
 for (const m of meter.values()) if (!m.done) rows.push({ boss: m.boss, outcome: 'open', secs: null, hits: m.hits, hpLost: m.hpLost, tonics: m.tonics });
 return rows;
}
function reset() { meter.clear(); finished.length = 0; fight.anchor = null; fight.target = null; stepsOut = 0; }
function dodges() { return stepsOut; }
module.exports = { install, table, reset, bossKey, fightStep, setDodge, dodges };
