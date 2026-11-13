'use strict';
/* The Regent is drawn in every finale phase at his own position, through the story art's figure, under his own name; the
 * valley's envoy is kept off the spring for as long as the finale is on. Uses the same earned late world as the owner tests. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test');
const ROOT = path.resolve(process.env.FIRSTLIGHT_ROOT || path.join(__dirname, '..'));
const C = require(path.join(ROOT, 'src/core.js')), SG = require(path.join(ROOT, 'src/saga.js'));
require(path.join(ROOT, 'src/story-art.js'));
const EH = require(path.join(ROOT, 'src/earth-homecoming.js')), ART = require(path.join(ROOT, 'src/earth-homecoming-art.js')), FIN = require(path.join(ROOT, 'src/finale.js'));
const AD = () => globalThis.RealmAdventure;
const LATE = 'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
const clone = o => JSON.parse(JSON.stringify(o));
function world() {
 const raw = JSON.parse(fs.readFileSync(path.join(ROOT, LATE), 'utf8')); delete raw.saga;
 const w = C.validate(raw), b = { state: 'returned', habit: {}, takenDay: 10, returnedDay: 12, homeDay: null, falseTrusted: false };
 w.saga = { ...SG.infer(w), beats: { night: { day: 10 } }, briar: b };
 return C.validate(clone(w));
}
function sim(w, x = 0, z = 6) { const s = new C.Simulation(w); s.earthHomecomingSave = () => ({ ok: true }); s.state.player.x = x; s.state.player.z = z; return s; }
const run = (s, seconds) => { for (let t = 0; t < seconds - 1e-9; t += .1) s.tick(.1); };
const phase = s => s.state.saga.finale.phase;
const runUntil = (s, want, max = 60) => { for (let t = 0; t < max; t += .1) { s.tick(.1); if (phase(s) === want) { s.tick(.1); return true; } } return false; };
const bodyOf = s => AD().runtime(s).enemies.find(e => e.finaleRole === 'regent' && e.finalePhase === phase(s));
// draws the body and records the story art's calls, so the test can see the figure is the story's and sits where the body stands.
function drawn(s, body) {
 const G = globalThis, orig = G.RealmStoryArt.regent, calls = [];
 G.RealmStoryArt.regent = (...a) => { calls.push(a); return orig(...a); };
 try { const out = { box: [], octa: [] }; const ok = ART.drawEnemy(out, s, body, .3); return { ok, count: out.box.length + out.octa.length, calls }; }
 finally { G.RealmStoryArt.regent = orig; }
}

test('the Regent is drawn in phase one at his own spot, with the story art figure and his own name', () => {
 const s = sim(world()); run(s, .2);
 assert.equal(phase(s), 1);
 const body = bodyOf(s);
 assert.equal(body.name, 'The Regent of Ash', 'his own name, for his own label');
 const r = drawn(s, body);
 assert.equal(r.ok, true); assert.ok(r.count > 0, 'instances are added for him');
 assert.equal(r.calls.length, 1, 'the story art draws the figure');
 assert.equal(r.calls[0][0], body.x); assert.equal(r.calls[0][2], body.z, 'at his position');
});

test('the Regent is drawn in phase two and in phase three, each at the body that stands', () => {
 const s = sim(world()); run(s, .2); assert.ok(runUntil(s, 2));
 const second = bodyOf(s), r2 = drawn(s, second);
 assert.equal(r2.ok, true); assert.equal(r2.calls[0][0], second.x); assert.equal(r2.calls[0][2], second.z);
 AD().damageEnemy(s, second, 100000); run(s, .1);
 assert.equal(phase(s), 3);
 const third = bodyOf(s), r3 = drawn(s, third);
 assert.equal(r3.ok, true); assert.equal(r3.calls[0][0], third.x); assert.equal(r3.calls[0][2], third.z);
});

test('the finale is on from the first chain to the last hit; the envoy steps off the spring for that time only', () => {
 const before = world();
 assert.equal(FIN.fighting(before), false, 'before the finale, the envoy stays where he stands');
 const s = sim(before); run(s, .2);
 assert.equal(FIN.fighting(s.state), true, 'the finale is on in phase one');
 assert.ok(runUntil(s, 2));
 assert.equal(FIN.fighting(s.state), true, 'and through phase two');
 assert.equal(EH.definition.room, null, 'the finale is in the valley');
});
