/* The story tour's realm hook: the gate that mounts Realm.tour, and the built pages that carry it. Normal play, the flag
 * alone and the harness global alone must leave the hook unmounted; the harness global with exactly ?tour=1 mounts it.
 * Node only. The same gate is checked in a real page by tour_gate in tools/story_tour.py, on the box. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test');
const ROOT = path.resolve(__dirname, '..');
const gate = require('../src/tour-hook.js');

test('the gate mounts only with the harness global and exactly one tour flag valued 1', () => {
  const harness = { __ETERNITIES_TEST_MODE: true };
  assert.equal(gate.enabled(harness, '?tour=1'), true);
  assert.equal(gate.enabled(harness, 'tour=1'), true);
  for (const search of ['', '?', '?tour=', '?tour=0', '?tour=10', '?tour=true', '?tour=1x', '?TOUR=1', '?test=1', '?tour=1&tour=1', '?tour=%31%78']) {
    assert.equal(gate.enabled(harness, search), false, 'query ' + JSON.stringify(search));
  }
});

test('without the harness global the flag alone mounts nothing', () => {
  for (const win of [undefined, null, {}, { __ETERNITIES_TEST_MODE: false }, { __ETERNITIES_TEST_MODE: 0 }, { __ETERNITIES_CAPTURE_MODE: true }]) {
    assert.equal(gate.enabled(win, '?tour=1'), false, 'window ' + JSON.stringify(win));
  }
});

test('each built page mounts the hook once, behind the gate, names only the tour realms, and carries the gate once', () => {
  for (const name of ['FIRSTLIGHT_VALLEY.html', 'index.html']) {
    const html = fs.readFileSync(path.join(ROOT, name), 'utf8');
    assert.equal(html.split('window.Realm.tour=').length - 1, 1, name + ': one mount point');
    assert.equal(html.split('if(RealmTourHook.enabled(window,location.search))window.Realm.tour=').length - 1, 1, name + ': the mount sits behind the gate');
    assert.equal(html.split("['hell','heaven','atlantis'].includes(id)").length - 1, 1, name + ': the realm names are fixed');
    assert.equal(html.split('G.RealmTourHook=Object.freeze({enabled});').length - 1, 1, name + ': the gate module is present once');
  }
});
