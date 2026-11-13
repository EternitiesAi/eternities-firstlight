'use strict';
/* The valley after the Regent: which changes are on, what the art draws for them, the valley-only rule, the credits
 * table, and the table's bounds. The changes are read from the saga and the table, so the story script can swap them. */
const path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test');
const ROOT = path.resolve(process.env.FIRSTLIGHT_ROOT || path.join(__dirname, '..'));
const E = require(path.join(ROOT, 'src/epilogue.js')), ART = require(path.join(ROOT, 'src/epilogue-art.js')), DATA = require(path.join(ROOT, 'src/epilogue-data.js'));
const won = (briar = 'returned') => ({ saga: { finale: { won: true, phase: 3 }, briar: { state: briar }, credits: false } });
const shot = world => ({ room: null, state: world });

test('nothing changes in the valley until the last hit', () => {
 assert.deepEqual(E.changes({ saga: { finale: { won: false, phase: 3 }, briar: { state: 'returned' } } }), []);
 assert.deepEqual(E.changes(undefined), []);
});

test('six changes are on when Briar is home, and five when she is not; each names its place and its line', () => {
 const home = E.changes(won('returned')), away = E.changes(won('taken'));
 assert.equal(home.length, 6); assert.equal(away.length, 5);
 assert.ok(away.length >= 5, 'the valley changes in five places even without Briar');
 assert.ok(home.some(c => c.id === 'briar-curled' && c.place === 'the workshop'));
 for (const c of home) { assert.ok(c.place && c.text, c.id); assert.equal(new Set(home.map(x => x.id)).size, home.length); }
});

test('the art draws every change that is on, and returns the ids it drew', () => {
 const out = { box: [], octa: [] };
 const drawn = ART.draw(out, shot(won('returned')), 1.25);
 assert.deepEqual([...drawn].sort(), E.changes(won('returned')).map(c => c.id).sort());
 assert.ok(out.box.length >= 20 && out.octa.length >= 15, 'the six changes add real instances: ' + out.box.length + ' boxes, ' + out.octa.length + ' octas');
 for (const i of [...out.box, ...out.octa]) { assert.ok(i.p.every(Number.isFinite) && i.s.every(v => Number.isFinite(v) && v > 0), 'finite and sized'); }
});

test('the valley-only rule keeps the changes out of the realms and the dive', () => {
 const out = { box: [], octa: [] };
 assert.deepEqual(ART.draw(out, { room: 'hell', state: won('returned') }, 0), []);
 assert.equal(out.box.length + out.octa.length, 0);
});

test('a change kind the art does not know is not drawn and not counted', () => {
 assert.ok(ART.KIND.includes('stage-play') && ART.KIND.includes('curled-fox'));
 for (const c of DATA.CHANGES) assert.ok(ART.KIND.includes(c.kind), 'every table kind has a drawing: ' + c.kind);
});

test('the credits table names the maker and keeps the roads open afterwards', () => {
 const lines = E.credits().flatMap(s => s.lines);
 assert.ok(lines.includes('made by Dom (Eternities) with Claude'));
 assert.ok(E.credits().some(s => s.title === 'Postgame'));
});

test('every change sits inside the valley and every road segment is on the map', () => {
 for (const c of DATA.CHANGES) if (c.at) assert.ok(Math.abs(c.at.x) <= 30 && Math.abs(c.at.z) <= 30, c.id);
 for (const r of [...DATA.ROADS.trueRoads, ...DATA.ROADS.counterfeitRoads]) for (const p of [r.a, r.b]) assert.ok(Math.abs(p.x) <= 30 && Math.abs(p.z) <= 30);
});
