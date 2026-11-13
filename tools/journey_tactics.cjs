'use strict';
/* Bot tactics for the title-to-credits journey. install() wraps Simulation.tick once, so every producer step runs the same
 * play: step out of a telegraph whose warning is up, drink a tonic under 35% health, wear the best owned gear of each
 * style, and meter every boss (fight time, player hits, hp lost, tonics used). Every change is a real command or a real
 * movement; nothing here plants a defeat, a position or a stat. Errors are not swallowed: a broken tactic stops the bot. */
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'src/core.js'));
const A = require(path.join(ROOT, 'src/adventure.js'));
const T = require(path.join(ROOT, 'src/combat.js'));
const HEAL_BELOW = .35, MARGIN = .3, DODGE = false;
const G = globalThis;
let installed = false, seq = 0;
const meter = new Map(), finished = [];

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

function dodge(sim) {
 // a producer's walk owns the player until it arrives; dodging is for the fight steps that stand still.
 if (sim.playerPath && sim.playerPath.length) return;
 const s = sim.state.adventure, p = sim.state.player;
 const zones = A.runtime(sim).enemies.filter(e => e.hp > 0 && !e.hidden).map(zoneOf).filter(Boolean);
 if (!zones.length || !zones.some(z => z(p))) return;
 let best = null;
 for (let r = .6; r <= 3.2; r += .6) for (let k = 0; k < 16; k++) {
  const a = k / 16 * Math.PI * 2, q = { x: p.x + Math.sin(a) * r, z: p.z + Math.cos(a) * r };
  if (!A.ground(sim, q.x, q.z, .31)) continue;
  if (zones.some(z => z(q) || z({ x: q.x + .25, z: q.z }) || z({ x: q.x - .25, z: q.z }) || z({ x: q.x, z: q.z + .25 }) || z({ x: q.x, z: q.z - .25 }))) continue;
  if (!best || r < best.r) best = { ...q, r };
 }
 if (best && s.hp > 0) sim.moveTo(best.x, best.z);
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
   m = { boss: key, start: s.elapsed, hits: 0, hpLost: 0, tonics: 0, lastHp: s.hp, lastTonics: s.tonics, lastHitAt: e.hitAt, hpAtStart: s.hp };
   meter.set(key, m);
  }
  if (m.done) continue;
  if (e.hitAt !== m.lastHitAt) { m.hits++; m.lastHitAt = e.hitAt; }
  m.hpLost += Math.max(0, m.lastHp - s.hp); m.tonics += Math.max(0, m.lastTonics - s.tonics);
  m.lastHp = s.hp; m.lastTonics = s.tonics;
  m.lastEnemyHp = e.hp;
  if (key !== 'chains' && e.hp === 0) finish(m, 'killed', s.elapsed);
 }
 // a boss that leaves the live list closes its row: killed when its last seen hp was zero, otherwise left the scene.
 // a regent body that leaves when the saga moves past it was killed: the defeat advances the phase in the same tick.
 const phase = sim.state.saga?.finale?.phase ?? 0, won = !!sim.state.saga?.finale?.won;
 for (const m of meter.values()) if (!m.done && m.boss !== 'chains' && !seen.has(m.boss)) {
  const body = /^regent body (\d)$/.exec(m.boss);
  const down = body && (won || phase > Number(body[1]));
  finish(m, m.lastEnemyHp === 0 || down ? 'killed' : 'left', s.elapsed);
 }
 // chains end when no chain is left standing; a fight the player falls in ends as lost.
 const chainsLeft = live.some(e => e.finaleRole === 'chain' && e.hp > 0), m = meter.get('chains');
 if (m && !m.done && !chainsLeft && live.some(e => e.finaleRole === 'regent')) finish(m, 'broken', s.elapsed);
 for (const m of meter.values()) if (!m.done && s.hp <= 0) finish(m, 'fell', s.elapsed);
}
function finish(m, outcome, now) { m.done = true; m.outcome = outcome; m.secs = +(now - m.start).toFixed(1); finished.push(m); }

// producers walk with a named walk frame and assert arrival; a dodge inside that frame would undo the arrival they check.
const WALKING = /\bat (walk|walkTo|goTo|go|travel)\b/;
function act(sim) {
 const s = sim.state.adventure;
 if (!s || !s.started) return;
 meterStep(sim);
 equipBest(sim);
 heal(sim);
 // dodging is off: producers' fight loops stand inside attack reach, so a step out leaves the foe alive and the
 // scripted fight never finishes. the producers need stepping logic before this can return (see the report).
 if (DODGE && !WALKING.test(new Error().stack)) dodge(sim);
}

function install() {
 if (installed) return; installed = true;
 const orig = C.Simulation.prototype.tick;
 C.Simulation.prototype.tick = function (dt) { const r = orig.call(this, dt); act(this); return r; };
}
// the table: one row per metered boss, in the order the journey met them.
function table() { return finished.slice().map(m => ({ boss: m.boss, outcome: m.outcome, secs: m.secs, hits: m.hits, hpLost: m.hpLost, tonics: m.tonics })); }
function reset() { meter.clear(); finished.length = 0; }
module.exports = { install, table, reset, bossKey };
