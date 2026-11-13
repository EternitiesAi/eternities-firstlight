'use strict';
/* The finale's story beats: each queued at its moment and shown once; the allies beat has its caller; the kept ending plays
 * its answer and its ending; the epilogue scenes play once each as the player reaches their change; no dialog opens while the
 * Regent winds up a strike; the headless listener clears the queue; and no rendered line starts with a colon. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test');
const ROOT = path.resolve(process.env.FIRSTLIGHT_ROOT || path.join(__dirname, '..'));
const C = require(path.join(ROOT, 'src/core.js')), SG = require(path.join(ROOT, 'src/saga.js'));
const EH = require(path.join(ROOT, 'src/earth-homecoming.js')), FIN = require(path.join(ROOT, 'src/finale.js'));
require(path.join(ROOT, 'src/story-script.js'));
const AD = () => globalThis.RealmAdventure;
const LATE = 'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
const clone = o => JSON.parse(JSON.stringify(o));
function world() {
 const raw = JSON.parse(fs.readFileSync(path.join(ROOT, LATE), 'utf8')); delete raw.saga;
 const w = C.validate(raw), b = { state: 'returned', habit: {}, takenDay: 10, returnedDay: 12, homeDay: null, falseTrusted: false };
 w.saga = { ...SG.infer(w), beats: { night: { day: 10 } }, briar: b };
 return C.validate(clone(w));
}
// the save keeps the latest checked world, so a reload reads what the last beat wrote.
function sim(w, x = 0, z = 6) { const s = new C.Simulation(w); s.saved = null; s.earthHomecomingSave = io => { s.saved = clone(io); return { ok: true }; }; s.state.player.x = x; s.state.player.z = z; return s; }
const run = (s, seconds) => { for (let t = 0; t < seconds - 1e-9; t += .1) s.tick(.1); };
const phase = s => s.state.saga.finale.phase;
const runUntil = (s, want, max = 60) => { for (let t = 0; t < max; t += .1) { s.tick(.1); if (phase(s) === want) { s.tick(.1); return true; } } return false; };
const bodyOf = s => AD().runtime(s).enemies.find(e => e.finaleRole === 'regent' && e.finalePhase === phase(s));
const steps = s => EH.runtime(s).beats.map(b => b.step);
// the player cuts each standing chain to 3 hp and the freed ally finishes it (the fight lane's rule), as finale.test.cjs does.
const chainsOf = s => AD().runtime(s).enemies.filter(e => e.finaleRole === 'chain');
function chainsDown(s) { for (let t = 0; t < 8 && !chainsOf(s).length; t += .1) s.tick(.1); for (const c of chainsOf(s)) AD().damageEnemy(s, c, c.hp - 3); return runUntil(s, 2); }
const answer = (s, type, choice) => EH.command({ sim: s, active: 'beats' }, type, { quest: EH.definition.id, expectedActive: 'beats', expectedRevision: s.state.adventure.revision, choice }, { save: x => { s.saved = clone(x); return { ok: true }; } });

test('the open road queues each finale beat once, in order, and takes the single last answer without asking', () => {
 const s = sim(world()); run(s, .2);
 assert.ok(steps(s).includes('begin'), 'the rise is a beat');
 run(s, 4.5);
 assert.equal(steps(s).filter(x => x === 'allies').length, 1, 'the allies beat has its caller and plays once, at the first freed person');
 assert.ok(chainsDown(s), 'the chains fall');
 assert.ok(steps(s).includes('runs'), 'the second body runs');
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 assert.ok(steps(s).includes('offer'), 'the offer is a choice beat');
 const refused = answer(s, 'offer', 'refuse');
 assert.equal(refused.ok, true, refused.error);
 assert.ok(!steps(s).includes('offer'), 'answering takes the offer beat away');
 assert.ok(steps(s).includes('refused'), 'the refusal plays its answer');
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 assert.equal(s.state.saga.finale.won, true, 'the open answer is the only one, so the story is won without a prompt');
 assert.ok(!steps(s).includes('last'), 'no last prompt when one answer is open');
 assert.ok(steps(s).includes('won'), 'the ending plays');
});

test('the kept ending plays its answer and its own ending, with no third fight', () => {
 const s = sim(world()); run(s, .2); assert.ok(chainsDown(s));
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 const signed = answer(s, 'offer', 'take');
 assert.equal(signed.ok, true, signed.error);
 assert.equal(s.state.saga.finale.ending, 'kept');
 assert.ok(steps(s).includes('taken'), 'the signing plays its answer');
 assert.ok(steps(s).includes('won'), 'the kept ending plays its own lines');
 assert.ok(!steps(s).includes('last'), 'no third fight, so no last prompt');
});

test('the epilogue scenes play once each, as the player reaches their change, and stay played after a reload', () => {
 const s = sim(world()); run(s, .2); assert.ok(chainsDown(s));
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1); answer(s, 'offer', 'refuse');
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 assert.equal(s.state.saga.finale.won, true);
 s.state.player.x = 0; s.state.player.z = 3; run(s, .2);
 const first = EH.runtime(s).beats.filter(b => b.owner === 'epilogue').map(b => b.step);
 assert.ok(first.includes('windbells'), 'the windbells are the spring change, its scene plays once');
 assert.equal(first.filter(x => x === 'windbells').length, 1);
 assert.ok(!first.includes('spring-arch'), 'the arch shares the spring scene, which has played');
 assert.ok(s.state.earthHomecoming.finale.seen.includes('epilogue.spring'), 'the scene is recorded in the save');
 EH.listen(s); run(s, .5);
 assert.equal(EH.runtime(s).beats.filter(b => b.owner === 'epilogue').length, 0, 'a scene is not replayed on the next tick');
 const back = new C.Simulation(C.validate(clone(s.saved || s.state)));
 assert.ok(back.state.earthHomecoming.finale.seen.includes('epilogue.spring'), 'and it stays played after a reload');
});

test('no dialog opens while the Regent is winding up a strike', () => {
 const s = sim(world()); run(s, .2);
 // the player stands near the spring, so the Regent may already be winding up: the test sets his mode itself.
 const body = AD().runtime(s).enemies.find(e => e.finaleRole === 'regent');
 assert.ok(body, 'the Regent is in the valley');
 body.mode = 'idle';
 assert.equal(EH.windingUp(s), false, 'no strike is being wound up while he idles');
 body.mode = 'windup';
 assert.equal(EH.windingUp(s), true, 'the dialog waits while a strike is wound up');
 body.mode = 'recover';
 assert.equal(EH.windingUp(s), true, 'and while it recovers');
 body.mode = 'idle';
 assert.equal(EH.windingUp(s), false, 'the dialog may open once he idles');
});

test('the headless listener hears every waiting beat and clears the queue', () => {
 const s = sim(world()); run(s, .2);
 const heard = EH.listen(s);
 assert.ok(heard.length >= 1 && heard[0].step === 'begin', 'the rise was waiting');
 assert.equal(EH.nextBeat(s), null, 'nothing waits after listening');
});

test('no rendered line starts with a colon, for any finale or epilogue scene in any ending', () => {
 const s = sim(world()); run(s, .2);
 const ids = ['finale.rise', 'finale.eve', 'finale.allies', 'finale.runs', 'finale.merged.stair', 'finale.merged.road', 'finale.merged.briar', 'finale.offer', 'finale.answer', 'finale.last', 'finale.ending',
  'epilogue.concert', 'epilogue.spring', 'epilogue.bridge', 'epilogue.lookout', 'epilogue.observatory', 'epilogue.pier', 'epilogue.garden', 'epilogue.workshop', 'epilogue.credits'];
 for (const ending of ['open', 'answered', 'kept']) {
  const st = clone(s.state);
  st.saga.finale.ending = ending; st.saga.finale.won = true;
  for (const id of ids) {
   const scene = FIN.scene(id, st);
   if (!scene) continue;
   for (const l of scene.lines) {
    assert.ok(!/^\s*:/.test(l.text), id + ' (' + ending + '): a line starts with a colon');
    assert.ok(l.speaker === undefined || typeof l.speaker === 'string', id + ': a speaker is a name or nothing');
   }
   const shown = EH.lineText(id, st);
   assert.ok(!/^\s*:/.test(shown), id + ' (' + ending + '): the joined line starts with a colon');
  }
 }
});
