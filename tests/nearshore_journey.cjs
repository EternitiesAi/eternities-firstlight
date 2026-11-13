/* The nearshore, as commands: a live save after the witness (atlantis and cosmos) walks out to the lantern pier, arrives
 * there, walks up to the real Briar where she sits at her habit place, and chooses her. The false fox is never chosen.
 * Accepted commands and timed walking only; no state is edited. Automated, not a human pacing study. */
'use strict';
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const C = require('../src/core.js'), N = require('../src/nearshore.js'), SG = require('../src/saga.js');

function journey(options = {}) {
 const out = options.out || fs.mkdtempSync(path.join(os.tmpdir(), 'nearshore-journey-'));
 fs.mkdirSync(out, { recursive: true });
 const start = typeof options.source === 'string' ? JSON.parse(fs.readFileSync(options.source, 'utf8')) : options.source;
 assert.ok(start, 'a live save is required (source)');
 let sim = new C.Simulation(C.validate(start)), commands = 0;
 const saved = { world: null };
 const io = { save: w => { saved.world = JSON.parse(JSON.stringify(w)); return { ok: true }; } };
 const ctx = () => ({ sim, active: 'nearshore-journey' });
 const payload = (extra = {}) => ({ expectedActive: 'nearshore-journey', expectedRevision: sim.state.adventure.revision, ...extra });
 const act = (type, extra) => { const r = N.command(ctx(), type, payload(extra), io); commands++; assert.ok(r.ok, type + ': ' + r.error); return r; };
 const step = t => { for (let i = 0; i < Math.round(t / .05); i++) sim.tick(.05); };
 const walk = (x, z) => {
  const r = sim.moveTo(x, z); assert.ok(r.ok, 'path ' + x + ',' + z + ' ' + r.error);
  for (let i = 0; i < 8000 && sim.playerPath.length; i++) step(.05);
  return Math.hypot(sim.state.player.x - x, sim.state.player.z - z) < 1.6;
 };

 assert.equal(sim.state.saga.briar.state, 'taken', 'the nearshore starts with Briar taken');
 assert.equal(SG.done(sim.state, 'witness'), true, 'the witness is finished first');
 // the lantern pier, then the arrival of the fox on the pier
 const pier = N.PLACE;
 assert.ok(walk(pier.x, pier.z), 'walked out onto the lantern pier');
 act('arrive', {});
 assert.equal(sim.state.saga.briar.state, 'nearshore');
 // walk up to the real Briar where she sits; she keeps moving toward her habit place, so the walk follows her
 const habit = N.habitSpot(sim);
 let reached = false;
 for (let k = 0; k < 60 && !reached; k++) {
  if (N.foxAt(sim) === 'real') { reached = true; break; }
  const v = N.view(sim).real;
  sim.moveTo(v.x, v.z);
  for (let i = 0; i < 400 && sim.playerPath.length && N.foxAt(sim) !== 'real'; i++) step(.1);
  step(.2);
 }
 assert.ok(reached, 'walked up to the real Briar at ' + habit.id);
 // the real fox is chosen; her return is saved, and the home step follows when it is offered
 act('choose', { fox: 'real' });
 assert.equal(sim.state.saga.briar.state, 'returned', 'the real Briar came home');
 assert.equal(SG.done(sim.state, 'nearshore'), true);
 if (sim.state.saga.briar.homeDay === null) { const h = N.command(ctx(), 'home', payload(), io); commands++; assert.ok(h.ok || h.error, 'home answered'); }
 const final = JSON.parse(JSON.stringify(saved.world || sim.snapshot()));
 C.validate(final);
 fs.writeFileSync(path.join(out, 'NEARSHORE_COMPLETE.json'), JSON.stringify(final, null, 2));
 return { status: 'passed', commands, habit: habit.id, briar: final.saga.briar.state, out, final: path.join(out, 'NEARSHORE_COMPLETE.json') };
}

module.exports = { journey };
if (require.main === module) console.log(JSON.stringify(journey({ source: process.argv[2], out: process.argv[3] }), null, 2));
