'use strict';
/* The valley after the Regent: which changes are on for each ending, what the art draws for them, the valley-only rule,
 * the credits read through the ending, and the table's bounds. Changes and their lines come from the table and the script,
 * so the story can swap them without touching this file. */
const path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test');
const ROOT = path.resolve(process.env.FIRSTLIGHT_ROOT || path.join(__dirname, '..'));
const E = require(path.join(ROOT, 'src/epilogue.js')), ART = require(path.join(ROOT, 'src/epilogue-art.js')), DATA = require(path.join(ROOT, 'src/epilogue-data.js'));
const won = (briar = 'returned', ending) => ({ saga: { finale: { won: true, phase: 3, ending }, briar: { state: briar }, credits: false } });
const shot = (world, room = null) => ({ room, state: world });
const ids = list => list.map(c => c.id).sort();

test('nothing changes in the valley until the last hit', () => {
 assert.deepEqual(E.changes({ saga: { finale: { won: false, phase: 3 }, briar: { state: 'returned' } } }), []);
 assert.deepEqual(E.changes(undefined), []);
});

test('the open road shows ten changes with Briar home and nine without; each names its place and its line', () => {
 const home = E.changes(won('returned', 'open')), away = E.changes(won('taken', 'open'));
 assert.equal(home.length, 10); assert.equal(away.length, 9);
 assert.ok(away.length >= 5, 'the valley changes in more than five places even without Briar');
 assert.ok(home.some(c => c.id === 'briar-curled' && c.place === 'the workshop'));
 assert.ok(!home.some(c => c.id === 'briar-waiting' || c.id === 'keeper'), 'the kept and answered rows stay out of the open road');
 for (const c of home) assert.ok(c.place && c.text, c.id + ' has a place and a script line');
});

test('the answered ending adds the keeper and keeps the lanterns; the kept ending drops them and adds Briar waiting', () => {
 const answered = ids(E.changes(won('returned', 'answered'))), kept = ids(E.changes(won('returned', 'kept')));
 assert.ok(answered.includes('keeper') && answered.includes('lanterns') && !answered.includes('briar-waiting'));
 assert.ok(kept.includes('briar-waiting') && !kept.includes('lanterns') && !kept.includes('keeper') && !kept.includes('briar-curled'));
 assert.ok(kept.length >= 5, 'the kept valley still changes in five or more places');
});

test('the art draws every change that is on, and returns the ids it drew', () => {
 const out = { box: [], octa: [] };
 const drawn = ART.draw(out, shot(won('returned', 'open')), 1.25);
 assert.deepEqual([...drawn].sort(), ids(E.changes(won('returned', 'open'))));
 assert.ok(out.box.length >= 20 && out.octa.length >= 15, 'the changes add real instances: ' + out.box.length + ' boxes, ' + out.octa.length + ' octas');
 for (const i of [...out.box, ...out.octa]) assert.ok(i.p.every(Number.isFinite) && i.s.every(v => Number.isFinite(v) && v > 0), 'finite and sized');
});

test('the kept ending draws the grey over every road, not only the counterfeit ones', () => {
 const open = { box: [], octa: [] }, kept = { box: [], octa: [] };
 ART.draw(open, shot(won('returned', 'open')), 0); ART.draw(kept, shot(won('returned', 'kept')), 0);
 const greyOpen = open.box.filter(i => i.c === 0x6f6e6a).length, greyKept = kept.box.filter(i => i.c === 0x6f6e6a).length;
 assert.equal(greyOpen, DATA.ROADS.counterfeitRoads.length);
 assert.equal(greyKept, DATA.ROADS.counterfeitRoads.length + DATA.ROADS.trueRoads.length);
});

test('the valley-only rule keeps the changes out of the realms and the dive', () => {
 const out = { box: [], octa: [] };
 assert.deepEqual(ART.draw(out, shot(won('returned', 'open'), 'hell'), 0), []);
 assert.equal(out.box.length + out.octa.length, 0);
});

test('every change kind in the table has a drawing; a kind the art does not know is never counted', () => {
 assert.ok(ART.KIND.includes('stage-play') && ART.KIND.includes('curled-fox') && ART.KIND.includes('engine') && ART.KIND.includes('stair'));
 for (const c of DATA.CHANGES) assert.ok(ART.KIND.includes(c.kind), 'every table kind has a drawing: ' + c.kind);
});

test('the credits read through the ending: three cards, the first from the script, and the postgame card kept', () => {
 const cards = E.credits(won('returned', 'kept'));
 assert.equal(cards.length, 3);
 assert.equal(cards[0].title, 'Firstlight');
 assert.ok(cards.some(c => c.title === 'Postgame' && c.lines.length === 1));
});

test('every change sits inside the valley and every road segment is on the map', () => {
 for (const c of DATA.CHANGES) if (c.at) assert.ok(Math.abs(c.at.x) <= 50 && Math.abs(c.at.z) <= 50, c.id);
 for (const r of [...DATA.ROADS.trueRoads, ...DATA.ROADS.counterfeitRoads]) for (const p of [r.a, r.b]) assert.ok(Math.abs(p.x) <= 50 && Math.abs(p.z) <= 50);
});
