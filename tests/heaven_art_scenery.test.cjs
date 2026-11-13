/* The heaven scenery: it sets the grade, adds only non-solid art in known kinds, is the same from the same seed, and
 * drifts its motes in the heaven room only (holding still under reduced motion or pause). Node only; the look is
 * checked on the box with hardware frames. */
'use strict';
const assert = require('node:assert/strict'), { test } = require('node:test');
const scenery = require('../src/heaven-art-scenery.js');

function recorder() {
  const items = [];
  return { e: {}, items, add(kind, x, y, z, sx, sy, sz, c, o) { items.push({ kind, x, y, z, sx, sy, sz, c, o }); } };
}

test('the scenery sets the grade and adds only non-solid art in known kinds', () => {
  const art = recorder();
  const def = { id: 'heaven' };
  scenery.decorate(art, def, { height: () => 1.57, rng: () => 0.5 });
  assert.equal(typeof art.e.worldAtmosphere.top, 'number');
  assert.equal(art.e.ambientOverride, 0.3);
  assert.ok(art.items.length > 500, 'dense: ' + art.items.length);
  for (const it of art.items) {
    assert.ok(['box', 'cylinder', 'octa', 'round'].includes(it.kind), it.kind);
    assert.equal(it.o.cameraSolid, false, it.kind);
    assert.equal(it.o.cutaway, false, it.kind);
    for (const v of [it.x, it.y, it.z, it.sx, it.sy, it.sz]) assert.ok(Number.isFinite(v), 'finite ' + it.kind);
  }
  assert.deepEqual(def, { id: 'heaven' }, 'the definition is left alone');
});

test('the same seed gives the same scenery', () => {
  const a = recorder(), b = recorder();
  scenery.decorate(a, { id: 'heaven' }, { height: () => 1.57, rng: () => 0.25 });
  scenery.decorate(b, { id: 'heaven' }, { height: () => 1.57, rng: () => 0.25 });
  assert.deepEqual(a.items, b.items);
});

test('the motes drift in the heaven room and hold still under reduced motion or pause', () => {
  const M = { compose: (...a) => a, mul: (p) => p, transform: (m, p) => p };
  const prev = globalThis.RealmEngine;
  globalThis.RealmEngine = { M };
  try {
    const frame = (sim, time) => {
      const out = { octa: [] };
      scenery.draw(out, sim, time);
      return out.octa.map((o) => o.p.join(','));
    };
    const live = { room: 'world-heaven', paused: false, state: { settings: { reducedMotion: false } } };
    const early = frame(live, 3), later = frame(live, 9);
    assert.ok(early.length > 50, 'motes: ' + early.length);
    assert.notDeepEqual(later, early, 'the motes move between frames');
    const still = { ...live, state: { settings: { reducedMotion: true } } };
    assert.deepEqual(frame(still, 3), frame(still, 9), 'reduced motion holds them');
    const paused = { ...live, paused: true };
    assert.deepEqual(frame(paused, 3), frame(paused, 9), 'a pause holds them');
    assert.deepEqual(frame({ ...live, room: 'world-hell' }, 3), [], 'other rooms get no motes');
  } finally {
    globalThis.RealmEngine = prev;
  }
});
