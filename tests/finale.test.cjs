'use strict';
/* The finale owner on the real simulation: the nearshore gate, chains against the echo ledger, freed allies, the three
 * bodies, the answered offer, the win, the rise, credits and postgame, and a reload in the middle of a fight. The late
 * world is an earned fixture; the saga is set to the nearshore through the saga's own validator. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test');
const ROOT = path.resolve(process.env.FIRSTLIGHT_ROOT || path.join(__dirname, '..'));
const C = require(path.join(ROOT, 'src/core.js')), SG = require(path.join(ROOT, 'src/saga.js'));
const EH = require(path.join(ROOT, 'src/earth-homecoming.js')), FIN = require(path.join(ROOT, 'src/finale.js'));
const AD = () => globalThis.RealmAdventure;
const LATE = 'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
const clone = o => JSON.parse(JSON.stringify(o));
function legacy(edit) { const raw = JSON.parse(fs.readFileSync(path.join(ROOT, LATE), 'utf8')); delete raw.saga; if (edit) edit(raw); return raw; }
// a late world whose saga stands at the nearshore: briar home, the night marked. the echo is the fixture's own choices.
function world(briar = { state: 'returned', habit: {}, takenDay: 10, returnedDay: 10 }, edit) { const w = C.validate(legacy(edit)); w.saga = { ...SG.infer(w), beats: { night: { day: 10 } }, briar }; return C.validate(clone(w)); }
function sim(w, x = 0, z = 6) { const s = new C.Simulation(w); s.saved = null; s.earthHomecomingSave = io => { s.saved = clone(io); return { ok: true }; }; s.state.player.x = x; s.state.player.z = z; return s; }
const run = (s, seconds) => { for (let t = 0; t < seconds - 1e-9; t += .1) s.tick(.1); };
const phase = s => s.state.saga.finale.phase;
// the adventure rebuilds its roster on the tick after a phase moves, so read the roster one tick later.
const runUntil = (s, want, max = 60) => { for (let t = 0; t < max; t += .1) { s.tick(.1); if (phase(s) === want) { s.tick(.1); return true; } } return false; };
const bodyOf = s => AD().runtime(s).enemies.find(e => e.finaleRole === 'regent' && e.finalePhase === phase(s));
const chainsOf = s => AD().runtime(s).enemies.filter(e => e.finaleRole === 'chain');

test('the finale waits for the nearshore and begins only when the player stands at the spring', () => {
 const early = sim(world({ state: 'taken', habit: {}, takenDay: 10 }), 0, 6);
 run(early, 1); assert.equal(phase(early), 0, 'briar is still taken, so the nearshore is not done');
 const late = sim(world(), 0, 30);
 run(late, 1); assert.equal(phase(late), 0, 'a player far from the spring does not start the finale');
 late.state.player.z = 6; run(late, .2);
 assert.equal(phase(late), 1); assert.equal(late.saved.saga.finale.phase, 1, 'the start is saved');
});

test('chains are one per coercive echo entry and share the first body budget', () => {
 const three = { coercive: [{ id: 'hell-divert', line: 'a' }, { id: 'atlantis-license', line: 'b' }, { id: 'beacon-cinder', line: 'c' }], freeing: [] };
 const p = FIN.plan(three);
 assert.equal(p.chains.length, 3);
 assert.equal(p.chains.reduce((n, c) => n + c.hp, 0), FIN.phases()[0].hp, 'the chains share the phase budget exactly');
 assert.ok(p.chains[0].appearAt < p.chains[1].appearAt && p.chains[1].appearAt < p.chains[2].appearAt, 'chains appear one after another');
 assert.deepEqual(p.chains.map(c => c.echo), ['hell-divert', 'atlantis-license', 'beacon-cinder']);
 const none = FIN.plan({ coercive: [], freeing: [] });
 assert.equal(none.chains.length, 1); assert.equal(none.chains[0].id, 'chain-spring'); assert.equal(none.chains[0].hp, FIN.phases()[0].hp);
});

test('a freed entry brings one ally who breaks the chain in its place, and only once there is a chain to break', () => {
 const p = FIN.plan({ coercive: [{ id: 'hell-divert', line: 'a' }], freeing: [{ id: 'heaven-assist', ally: 'Rielle', line: 'x' }, { id: 'beacon-sealed', ally: 'Tessa', line: 'y' }] });
 assert.equal(p.allies.length, 2);
 assert.equal(p.allies[0].ally, 'Rielle'); assert.equal(p.allies[0].breaks, 'chain-hell-divert');
 assert.equal(p.allies[1].ally, 'Tessa'); assert.equal(p.allies[1].breaks, null, 'with no chain left the second ally only arrives');
 assert.ok(p.allies[0].arriveAt > p.chains[0].appearAt, 'an ally arrives after the chain it breaks appears');
});

test('the freed default chain falls to Neris, the chains are saved at the break, and the second body takes the valley', () => {
 const s = sim(world()); run(s, .2);
 assert.ok(runUntil(s, 2), 'the last chain falls and the finale moves to phase two');
 assert.deepEqual(s.saved.earthHomecoming.finale.broken, ['chain-spring'], 'the break is saved');
 assert.equal(s.saved.saga.finale.phase, 2);
 assert.equal(chainsOf(s).length, 0);
 assert.equal(bodyOf(s).finalePhase, 2); assert.equal(bodyOf(s).hp, FIN.phases()[1].hp);
 assert.equal(EH.canDamage(s, bodyOf(s)), true, 'the second body can be struck while it runs');
});

test('the third body waits for an answer; refusing is saved, and the last hit ends the story and rolls the credits', () => {
 const s = sim(world()); run(s, .2); assert.ok(runUntil(s, 2));
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 assert.equal(phase(s), 3, 'the second body going down opens the offer');
 assert.equal(s.state.earthHomecoming.finale.offer, null);
 assert.equal(bodyOf(s).hp, FIN.phases()[2].hp);
 assert.equal(EH.canStrike(s, bodyOf(s)), false, 'no strikes while the offer waits');
 assert.equal(EH.canDamage(s, bodyOf(s)), false, 'no hits while the offer waits');
 const ctx = { sim: s, active: 'slot-a' };
 const refused = EH.command(ctx, 'offer', { quest: EH.definition.id, expectedActive: 'slot-a', expectedRevision: s.state.adventure.revision, choice: 'refuse' }, { save: x => { s.saved = clone(x); return { ok: true }; } });
 assert.equal(refused.ok, true, refused.error);
 assert.equal(s.saved.earthHomecoming.finale.offer, 'refused');
 run(s, .1); assert.equal(EH.canDamage(s, bodyOf(s)), true, 'after refusing, the last fight is open');
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 assert.equal(s.state.saga.finale.won, true);
 assert.notEqual(EH.view(s), null, 'the camera rise runs after the last hit');
 run(s, 8.2);
 assert.equal(s.state.saga.credits, true); assert.equal(s.state.saga.postgame, true);
 assert.equal(s.earthHomecomingRuntime.credits, true, 'the credits are due');
 s.earthHomecomingRuntime.creditsDone = true; assert.equal(EH.view(s), null, 'the rise ends with the credits');
});

test('taking the gift keeps the Regent striking and lands nothing on the player', () => {
 const s = sim(world()); run(s, .2); assert.ok(runUntil(s, 2));
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 const ctx = { sim: s, active: 'slot-b' };
 const taken = EH.command(ctx, 'offer', { quest: EH.definition.id, expectedActive: 'slot-b', expectedRevision: s.state.adventure.revision, choice: 'take' }, { save: x => { s.saved = clone(x); return { ok: true }; } });
 assert.equal(taken.ok, true, taken.error); assert.equal(s.saved.earthHomecoming.finale.offer, 'taken');
 // two paces in front of the body at the spring: the adventure's own loop locks a strike on the player.
 s.state.player.x = 0; s.state.player.z = 5.2;
 run(s, .5);
 const e = bodyOf(s), player = s.state.player;
 assert.ok(e.strike, 'the body has locked a strike while the player stands in reach');
 assert.equal(EH.strikeContains(e, player), false, 'with the gift, the locked strike touches nothing');
 // the same locked geometry, with the answer changed in the live state, is a hit: the gift is the only difference.
 s.state.earthHomecoming.finale.offer = 'refused';
 assert.equal(EH.strikeContains(e, player), true, 'refused, the same strike lands');
 s.state.earthHomecoming.finale.offer = 'taken';
});

test('a reload in the middle of a fight keeps the phase, the broken chains and the answer given', () => {
 const s = sim(world()); run(s, .2); assert.ok(runUntil(s, 2));
 const back = new C.Simulation(C.validate(clone(s.saved)));
 assert.equal(back.state.saga.finale.phase, 2);
 assert.deepEqual(back.state.earthHomecoming.finale.broken, ['chain-spring']);
 back.earthHomecomingSave = () => ({ ok: true }); back.state.player.x = 0; back.state.player.z = 6; run(back, .1);
 assert.equal(bodyOf(back).finalePhase, 2); assert.equal(chainsOf(back).length, 0, 'the broken chain does not come back');
 AD().damageEnemy(back, bodyOf(back), 100000); run(back, .1);
 const ctx = { sim: back, active: 'slot-c' };
 EH.command(ctx, 'offer', { quest: EH.definition.id, expectedActive: 'slot-c', expectedRevision: back.state.adventure.revision, choice: 'refuse' }, { save: x => { back.saved = clone(x); return { ok: true }; } });
 const again = new C.Simulation(C.validate(clone(back.saved)));
 again.earthHomecomingSave = () => ({ ok: true }); again.state.player.x = 0; again.state.player.z = 6; run(again, .1);
 assert.equal(again.state.saga.finale.phase, 3); assert.equal(again.state.earthHomecoming.finale.offer, 'refused');
 assert.equal(EH.canDamage(again, bodyOf(again)), true, 'the answered offer holds through the reload');
});

test('a refused save puts the story back, so the record and the saga never disagree', () => {
 const s = sim(world()); s.earthHomecomingSave = () => ({ ok: false, error: 'the store is full' });
 run(s, .2); assert.equal(phase(s), 0); assert.equal(s.state.earthHomecoming.finale, undefined);
});

test('old homecoming records still load, and an aftermath chosen before the finale still feeds the echo', () => {
 const w = world(undefined, raw => { raw.earthHomecoming = { version: 1, accepted: true, steps: ['bridge-record', 'aftermath'], choice: 'reviewed-custody', claimed: true }; });
 assert.equal(w.earthHomecoming.choice, 'reviewed-custody');
 const coercive = SG.echoLedger(w).coercive.map(e => e.id);
 assert.ok(coercive.includes('earth-custody'), 'the old aftermath is an echo entry');
});

test('a malformed finale record is refused by name', () => {
 assert.throws(() => EH.validate({ version: 1, accepted: true, steps: [], choice: null, claimed: false, finale: { broken: ['nope'], offer: null } }), /Invalid Earth homecoming: finale/);
 assert.throws(() => EH.validate({ version: 1, accepted: true, steps: [], choice: null, claimed: false, finale: { broken: [], offer: 'maybe' } }), /Invalid Earth homecoming: finale/);
});

test('the finale text carries no compliance or developer words on the player path', () => {
 // the player-facing strings are the tables' values; identifiers such as claim-lane never reach the screen.
 const D = require(path.join(ROOT, 'src/finale-data.js')), E = require(path.join(ROOT, 'src/epilogue-data.js'));
 const shown = [...Object.values(D.LINES), ...Object.values(D.ALLY_CARDS).map(c => c.line), ...Object.values(D.ALLY_CARDS).map(c => c.name),
  ...E.CHANGES.flatMap(c => [c.place, c.text]), ...E.CREDITS.flatMap(s => [s.title, ...s.lines]), ...Object.values(D.SITES).map(s => s.label)].join('\n');
 assert.doesNotMatch(shown, /\b(fee|fees|claim|provisional|prototype|epoch|luna|realm 10)\b/i);
 assert.ok(D.LINES.won.length > 0 && D.LINES.credits.length > 0, 'the table holds the lines it reads');
});
