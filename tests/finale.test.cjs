'use strict';
/* The finale owner on the real simulation: the nearshore gate, chains against the echo ledger, freed allies, the three
 * bodies, the offer (refuse, or sign: the kept ending with no third fight), the last answer, the win, the rise, credits
 * and postgame, a refused save, and a reload in the middle of a fight. The late world is an earned fixture; the saga is set
 * to the nearshore through the saga's own validator. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test');
const ROOT = path.resolve(process.env.FIRSTLIGHT_ROOT || path.join(__dirname, '..'));
const C = require(path.join(ROOT, 'src/core.js')), SG = require(path.join(ROOT, 'src/saga.js'));
const EH = require(path.join(ROOT, 'src/earth-homecoming.js')), FIN = require(path.join(ROOT, 'src/finale.js'));
const AD = () => globalThis.RealmAdventure;
const LATE = 'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
const clone = o => JSON.parse(JSON.stringify(o));
function legacy(edit) { const raw = JSON.parse(fs.readFileSync(path.join(ROOT, LATE), 'utf8')); delete raw.saga; if (edit) edit(raw); return raw; }
// a late world whose saga stands at the nearshore: briar home, the night marked. the echo is the fixture's own choices.
function world(briar = { state: 'returned' }, edit) {
 const w = C.validate(legacy(edit));
 const b = { state: 'with', habit: {}, takenDay: null, returnedDay: null, homeDay: null, falseTrusted: false, ...briar };
 if (b.state !== 'with') b.takenDay = b.takenDay ?? 10;
 if (b.state === 'returned') b.returnedDay = b.returnedDay ?? 12;
 w.saga = { ...SG.infer(w), beats: { night: { day: 10 } }, briar: b };
 return C.validate(clone(w));
}
function sim(w, x = 0, z = 6) { const s = new C.Simulation(w); s.saved = null; s.earthHomecomingSave = io => { s.saved = clone(io); return { ok: true }; }; s.state.player.x = x; s.state.player.z = z; return s; }
const run = (s, seconds) => { for (let t = 0; t < seconds - 1e-9; t += .1) s.tick(.1); };
const phase = s => s.state.saga.finale.phase;
// the adventure rebuilds its roster on the tick after a phase moves, so read the roster one tick later.
const runUntil = (s, want, max = 60) => { for (let t = 0; t < max; t += .1) { s.tick(.1); if (phase(s) === want) { s.tick(.1); return true; } } return false; };
const bodyOf = s => AD().runtime(s).enemies.find(e => e.finaleRole === 'regent' && e.finalePhase === phase(s));
const chainsOf = s => AD().runtime(s).enemies.filter(e => e.finaleRole === 'chain');
// the chains hold real hp now: the player's hits do most of it. cut each standing chain down to a few points, then let
// the freed ally (Neris, at allyDps) finish it, so the break still lands in the ally's name.
function chainsDown(s) { for (let t = 0; t < 8 && !chainsOf(s).length; t += .1) s.tick(.1); for (const c of chainsOf(s)) AD().damageEnemy(s, c, c.hp - 3); return runUntil(s, 2); }
const ctxOf = (s, active) => ({ sim: s, active });
const answer = (s, active, type, choice) => EH.command(ctxOf(s, active), type, { quest: EH.definition.id, expectedActive: active, expectedRevision: s.state.adventure.revision, choice }, { save: x => { s.saved = clone(x); return { ok: true }; } });

test('the finale waits for the nearshore and begins only when the player stands at the spring', () => {
 const early = sim(world({ state: 'taken' }), 0, 6);
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
 assert.equal(p.allies[1].ally, 'Mara', 'the beacon card names Mara in the finale table'); assert.equal(p.allies[1].breaks, null, 'with no chain left the second ally only arrives');
 assert.ok(p.allies[0].arriveAt > p.chains[0].appearAt, 'an ally arrives after the chain it breaks appears');
});

test('the freed default chain falls to Neris, the chains are saved at the break, and the second body takes the valley', () => {
 const s = sim(world()); run(s, .2);
 assert.ok(chainsDown(s), 'the last chain falls and the finale moves to phase two');
 assert.ok(s.state.journal.some(j => /Neris/.test(j.text)), 'the last few points fell to Neris');
 assert.deepEqual(s.saved.earthHomecoming.finale.broken, ['chain-spring'], 'the break is saved');
 assert.equal(s.saved.saga.finale.phase, 2);
 assert.equal(chainsOf(s).length, 0);
 assert.equal(bodyOf(s).finalePhase, 2); assert.equal(bodyOf(s).hp, FIN.phases()[1].hp);
 assert.equal(EH.canDamage(s, bodyOf(s)), true, 'the second body can be struck while it runs');
});

test('the third body waits for an answer; refusing is saved; the last answer ends the story and rolls the credits', () => {
 const s = sim(world()); run(s, .2); assert.ok(chainsDown(s));
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 assert.equal(phase(s), 3, 'the second body going down opens the offer');
 assert.equal(s.state.earthHomecoming.finale.offer, null);
 assert.equal(bodyOf(s).hp, FIN.phases()[2].hp);
 assert.equal(EH.canStrike(s, bodyOf(s)), false, 'no strikes while the offer waits');
 assert.equal(EH.canDamage(s, bodyOf(s)), false, 'no hits while the offer waits');
 const refused = answer(s, 'slot-a', 'offer', 'refuse');
 assert.equal(refused.ok, true, refused.error);
 assert.equal(s.saved.earthHomecoming.finale.offer, 'refused');
 run(s, .1); assert.equal(EH.canDamage(s, bodyOf(s)), true, 'after refusing, the last fight is open');
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 assert.equal(EH.runtime(s).lastOpen, true, 'the last body fell and asks for the last answer');
 assert.equal(s.state.saga.finale.won, false, 'the story is not over until the answer');
 assert.ok(EH.lastChoices(s).some(c => c.id === 'open'), 'the open answer is offered');
 const last = answer(s, 'slot-a', 'last', 'open');
 assert.equal(last.ok, true, last.error);
 assert.equal(s.state.saga.finale.won, true); assert.equal(s.state.saga.finale.ending, 'open');
 assert.notEqual(EH.view(s), null, 'the camera rise runs after the answer');
 run(s, 8.2);
 assert.equal(s.state.saga.credits, true); assert.equal(s.state.saga.postgame, true);
 assert.equal(s.earthHomecomingRuntime.credits, true, 'the credits are due');
 s.earthHomecomingRuntime.creditsDone = true; assert.equal(EH.view(s), null, 'the rise ends with the credits');
});

test('signing the offer ends the valley as the kept ending, with no third fight', () => {
 const s = sim(world()); run(s, .2); assert.ok(chainsDown(s));
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1);
 const signed = answer(s, 'slot-b', 'offer', 'take');
 assert.equal(signed.ok, true, signed.error);
 assert.equal(s.saved.earthHomecoming.finale.offer, 'taken');
 assert.equal(s.state.saga.finale.won, true, 'the story is won at the signing');
 assert.equal(s.state.saga.finale.ending, 'kept');
 assert.equal(EH.runtime(s).lastOpen, false, 'no last answer is asked after a signed offer');
 run(s, 8.2);
 assert.equal(s.state.saga.credits, true, 'the credits roll for the kept ending');
});

test('a reload in the middle of a fight keeps the phase, the broken chains and the answer given', () => {
 const s = sim(world()); run(s, .2); assert.ok(chainsDown(s));
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
 // the player-facing strings are the interface words and the table's names; the story lines are the script's and are checked there.
 const D = require(path.join(ROOT, 'src/finale-data.js')), E = require(path.join(ROOT, 'src/epilogue-data.js'));
 const shown = [...Object.values(D.LINES), ...Object.values(D.ALLY_CARDS).map(c => c.name), ...E.CHANGES.map(c => c.place),
  ...E.CREDITS.flatMap(s => [s.title, ...(s.lines || [])]), ...Object.values(D.SITES).map(s => s.label)].join('\n');
 assert.doesNotMatch(shown, /\b(fee|fees|claim|provisional|prototype|epoch|luna|realm 10)\b/i);
 assert.ok(D.LINES.wonDetail.length > 0, 'the table holds the interface words it reads');
});

// the regent rebalance (lead, 1.0): real chain hp, allies that work instead of breaking, and patterns one sidestep cannot answer.
const AT = s => s.earthHomecomingRuntime, P = EH.patterns, T = () => FIN.timing();
test('a chain holds its hp in the owner: an ally only takes allyDps a second, and a rebuilt roster never heals a cut chain', () => {
 const s = sim(world()); run(s, .2); for (let t = 0; t < 8 && !chainsOf(s).length; t += .1) s.tick(.1);
 const c = chainsOf(s)[0], full = c.maxHP; assert.equal(full, FIN.phases()[0].hp, 'one chain carries the whole first body');
 AD().damageEnemy(s, c, 500); run(s, .1); assert.equal(AT(s).chainHP[c.chainId], c.hp);
 const before = c.hp; run(s, 6); const after = chainsOf(s)[0];
 assert.ok(after.hp < before && before - after.hp <= T().allyDps * 6.2, 'Neris cuts at most allyDps a second (' + (before - after.hp) + ')');
 assert.equal(phase(s), 1, 'the ally alone does not break it in seconds');
 AD().runtime(s).trailSignature = undefined; AD().syncScene(s); run(s, .1);
 assert.ok(chainsOf(s)[0].hp <= after.hp && chainsOf(s)[0].hp < full, 'a rebuilt roster reads the owner hp, not a fresh chain');
});
test('the bands pick by share of the body, a ring hands to the fast follow-up, and standing still near him earns the stamp', () => {
 const s = sim(world()); run(s, .2); assert.ok(chainsDown(s)); const e = bodyOf(s);
 s.state.player.x = e.x; s.state.player.z = e.z + 2.4;
 e.hp = e.maxHP; assert.equal(EH.pattern(e, s).phase, 'flight'); e.hp = Math.floor(e.maxHP * .4); assert.equal(EH.pattern(e, s).phase, 'cornered');
 e.followUp = true; assert.equal(EH.pattern(e, s).id, 'ash-follow'); e.followUp = false;
 assert.ok(P['closing-ring'].recovery < 1 && P['ash-follow'].windup < 1, 'the ring recovers fast and the follow-up lands fast');
 AT(s).still.t = T().stillSeconds; assert.equal(EH.pattern(e, s).id, 'ash-stamp', 'standing still near him earns the stamp');
 AT(s).still.t = 0; assert.notEqual(EH.pattern(e, s).id, 'ash-stamp');
 // lock after a ring sets the follow-up, and the follow-up carries its share of the body damage
 e.mode = 'idle'; e.followUp = false; e.homecomingCycle = 0; e.hp = Math.floor(e.maxHP * .4); const ring = EH.lock(s, e);
 assert.ok(ring && ring.pattern === 'closing-ring'); assert.equal(e.followUp, true);
 e.mode = 'idle'; const follow = EH.lock(s, e); assert.equal(follow.pattern, 'ash-follow'); assert.equal(e.followUp, false);
 assert.equal(e.damage, Math.round(e.baseDamage * P['ash-follow'].share));
});
test('a strike is a warning only while it winds up', () => {
 const s = sim(world()); run(s, .2); assert.ok(chainsDown(s)); const e = bodyOf(s);
 s.state.player.x = e.x; s.state.player.z = e.z + 2; e.mode = 'idle'; const frame = EH.lock(s, e); assert.ok(frame);
 e.mode = 'windup'; assert.equal(EH.strikeContains(e, s.state.player), true);
 e.mode = 'recover'; assert.equal(EH.strikeContains(e, s.state.player), false, 'once landed, the shape is spent');
});
test('the second body turns on you inside the chase distance; the third pursues you anywhere', () => {
 const s = sim(world()); run(s, .2); assert.ok(chainsDown(s)); const e = bodyOf(s); e.mode = 'idle';
 s.state.player.x = e.x + 6; s.state.player.z = e.z; const d0 = Math.hypot(s.state.player.x - e.x, s.state.player.z - e.z);
 EH.tick(s, .5); assert.ok(Math.hypot(s.state.player.x - e.x, s.state.player.z - e.z) < d0, 'he closes on you');
 AD().damageEnemy(s, bodyOf(s), 100000); run(s, .1); s.state.player.x = 0; s.state.player.z = 6;
 const answered = EH.command({ sim: s, active: 'slot-p' }, 'offer', { quest: EH.definition.id, expectedActive: 'slot-p', expectedRevision: s.state.adventure.revision, choice: 'refuse' }, { save: x => { s.saved = clone(x); return { ok: true }; } });
 assert.equal(answered.ok, true, answered.error); run(s, .1); const last = bodyOf(s); last.mode = 'idle'; s.state.player.x = last.x + 8; s.state.player.z = last.z; const d1 = Math.hypot(s.state.player.x - last.x, s.state.player.z - last.z);
 EH.tick(s, .5); assert.ok(Math.hypot(s.state.player.x - last.x, s.state.player.z - last.z) < d1, 'the third body does not wait at the spring');
});

test('every chain site stands on open ground, where an arrow can reach it', () => {
 const F = require(path.join(ROOT, 'src/finale-data.js'));
 for (const [id, s] of Object.entries(F.SITES)) {
  assert.equal(C.walkable(s.x, s.z, null, .9), true, id + ' stands on open ground');
 }
});
