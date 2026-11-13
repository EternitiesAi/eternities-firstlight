/* The finale, from a live save after the nearshore: walk to the spring junction, break the chains, run down the second body
 * across the valley, refuse the offer, win the last fight, and let the rise and the credits roll. Real commands only, and
 * the owners' own rules decide every hit. Tactics: step out of a locked strike's shape, heal below 35% hp with a tonic,
 * equip the best owned gear first, attack what is in reach, pulse when stamina allows. Reports each fight's numbers. */
'use strict';
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const C = require('../src/core.js'), AD = require('../src/adventure.js'), EH = require('../src/earth-homecoming.js');
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function journey(options = {}) {
 const out = options.out || fs.mkdtempSync(path.join(os.tmpdir(), 'finale-journey-'));
 fs.mkdirSync(out, { recursive: true });
 const start = typeof options.source === 'string' ? JSON.parse(fs.readFileSync(options.source, 'utf8')) : options.source;
 assert.ok(start, 'a live save is required (source)');
 const sim = new C.Simulation(C.validate(start));
 let seq = 0, commands = 0, saved = null;
 // the ending the bot takes: open (refuse, then "End it"), answered (refuse, hear all three, then the first page), kept (sign)
 const ending = options.ending || 'open';
 assert.ok(['open', 'answered', 'kept'].includes(ending), 'a known ending');
 sim.earthHomecomingSave = io => { saved = JSON.parse(JSON.stringify(io)); return { ok: true }; };
 const a = () => sim.state.adventure, rt = () => AD.runtime(sim), ph = () => sim.state.saga.finale.phase;
 const cmd = (type, p = {}) => { const r = sim.adventureCommand('finale-j-' + (++seq), type, p); commands++; return r; };
 const step = t => { for (let i = 0; i < Math.round(t / .1); i++) sim.tick(.1); };
 const walk = (x, z) => { sim.moveTo(x, z); for (let i = 0; i < 4000 && sim.playerPath.length; i++) step(.1); return dist(sim.state.player, { x, z }) < 1.6; };
 const threatened = q => rt().enemies.some(e => e.finaleRole === 'regent' && e.strike && EH.strikeContains(e, q));
 const foes = () => rt().enemies.filter(e => e.hp > 0 && e.finaleRole && (e.finaleRole === 'chain' ? ph() === 1 : e.finalePhase === ph()));
 const safeSpot = () => { const p = sim.state.player; for (let k = 0; k < 16; k++) { const t = k / 16 * Math.PI * 2, q = { x: p.x + Math.cos(t) * 2.6, z: p.z + Math.sin(t) * 2.6 }; if (C.walkable(q.x, q.z, sim.navRoom, .31) && !threatened(q)) return q; } return null; };

 // the best owned gear for each slot, judged by the table's own numbers
 function equipBest() {
  const owned = (a().owned || []).filter(id => AD.GEAR[id]);
  for (const slot of [...new Set(owned.map(id => AD.GEAR[id].slot))]) {
   const score = id => AD.GEAR[id].attack + AD.GEAR[id].defense + AD.GEAR[id].hp, best = owned.filter(id => AD.GEAR[id].slot === slot).sort((x, y) => score(y) - score(x))[0];
   if (a().equipment[slot] !== best) { const r = cmd('equip', { id: best }); if (!r.ok) throw new Error('equip ' + best + ': ' + r.error); }
  }
 }

 // one fight: step by step, until the owner's phase moves on; returns the numbers for the report
 function fight(label, until, limit = 3000) {
  const t0 = a().elapsed, hp0 = a().hp, hits = { n: 0 }, seen = new Set(), dodge = { n: 0, heals: 0 }; let lost = 0, last = a().hp;
  for (let i = 0; i < limit && !until(); i++) {
   const s = a(), p = sim.state.player, stats = AD.stats(s);
   for (const e of rt().enemies) if (e.finaleRole === 'regent' && e.strike && !seen.has(e.strike)) seen.add(e.strike);
   if (s.hp < stats.maxHP * .35 && s.tonics > 0 && s.elapsed >= rt().cooldowns.heal) { if (cmd('heal').ok) dodge.heals++; }
   if (threatened(p)) { dodge.n++; const q = safeSpot(); if (q) sim.moveTo(q.x, q.z); }
   const list = foes().sort((x, y) => dist(x, p) - dist(y, p)), t = list[0];
   if (t) {
    if (dist(t, p) <= 2.4 && s.elapsed >= rt().cooldowns.attack && !threatened(p)) { const r = cmd('attack', { target: t.id }); if (r.ok) hits.n++; }
    if (dist(t, p) <= 2.6 && s.stamina >= 30 && s.elapsed >= rt().cooldowns.pulse) cmd('pulse');
    if (dist(t, p) > 2.2 && !sim.playerPath.length) { const d = Math.max(.01, dist(t, p)), k = 1.8 / d; sim.moveTo(t.x + (p.x - t.x) * k, t.z + (p.z - t.z) * k); }
   }
   step(.1);
   if (a().hp < last) lost += last - a().hp; last = a().hp;
  }
  return { label, seconds: +(a().elapsed - t0).toFixed(1), hits: hits.n, strikesLocked: seen.size, dodgeSteps: dodge.n, heals: dodge.heals, hpLost: Math.round(lost), hpStart: hp0, hpEnd: a().hp + '/' + AD.stats(a()).maxHP, bodiesLeft: foes().map(e => e.id + ':' + Math.round(e.hp)).join(',') || 'none' };
 }

 // the bot does not win by planting anything: it walks to the spring, equips, and fights the owner's bodies.
 const fights = [];
 assert.ok(walk(0, 8), 'walked to the spring junction');
 equipBest();
 fights.push(fight('chains', () => ph() >= 2));
 assert.ok(ph() >= 2, 'the chains are broken; the second body runs the valley');
 fights.push(fight('second body', () => ph() >= 3));
 assert.ok(ph() >= 3, 'the second body fell; the offer waits at the spring');
 assert.ok(walk(0, 7), 'walked back to the spring for the offer');
 const ectx = { sim, active: 'finale-journey' }, eio = { save: io => { saved = JSON.parse(JSON.stringify(io)); return { ok: true }; } };
 const eq = choice => ({ quest: EH.definition.id, expectedActive: 'finale-journey', expectedRevision: a().revision, choice });
 // answered needs all three sightings heard, through the saga's own sighting commands, before the last answer
 if (ending === 'answered') for (const id of ['beacon', 'foundry', 'confluence']) {
  const said = sim.sagaCommand('heard-' + id, 'regent', { id }); const heard = sim.sagaCommand('heard-' + id + '-answer', 'regent-heard', { id, heard: true });
  assert.ok(heard.ok, 'heard the sighting ' + id + ': ' + (heard.error || said.error));
 }
 if (ending === 'kept') {
  // the offer is signed: the valley ends now, with no third fight
  const signed = EH.command(ectx, 'offer', eq('take'), eio); commands++;
  assert.ok(signed.ok, 'signed the offer: ' + signed.error);
 } else {
  const offer = EH.command(ectx, 'offer', eq('refuse'), eio); commands++;
  assert.ok(offer.ok, 'refused the gift: ' + offer.error);
  fights.push(fight('last body', () => EH.runtime(sim).lastOpen === true));
  assert.ok(EH.runtime(sim).lastOpen === true, 'the last body fell and the last answer is open');
  const answer = EH.command(ectx, 'last', eq(ending), eio); commands++;
  assert.ok(answer.ok, 'the last answer ' + ending + ': ' + answer.error);
 }
 assert.ok(sim.state.saga.finale.won === true, 'the story is won');
 step(8.5);
 const credits = sim.state.saga.credits === true;
 const final = JSON.parse(JSON.stringify(sim.snapshot()));
 C.validate(final);
 fs.writeFileSync(path.join(out, 'FINALE_COMPLETE.json'), JSON.stringify(final, null, 2));
 return { ending, status: credits ? 'passed' : 'failed', creditsRolled: credits, postgame: sim.state.saga.postgame === true, commands, fights, final: path.join(out, 'FINALE_COMPLETE.json') };
}

module.exports = { journey };
if (require.main === module) console.log(JSON.stringify(journey({ source: process.argv[2], out: process.argv[3] }), null, 2));
