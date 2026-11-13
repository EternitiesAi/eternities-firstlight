'use strict';
/* The journey bot in its fast mode: one fresh character through all fourteen beats, to the credits. The bot is importable
 * (tools/firstlight_journey.cjs run). Each test runs the whole chain once, so the two tests share no state. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { run, BEATS } = require('../tools/firstlight_journey.cjs');
const fresh = () => run({ quiet: true });

test('a fresh character plays all fourteen beats through real producer and owner commands, none blocked', () => {
 const r = fresh();
 assert.equal(BEATS.length, 14);
 for (const beat of BEATS) {
  const row = r.rows.find(x => x.beat === beat);
  assert.ok(row, 'the table has the beat ' + beat);
  assert.equal(row.status, 'ran', beat + ': ' + (row.why || row.status));
 }
 assert.ok(r.rows.filter(x => x.status === 'ran' && x.secs !== null).every(x => x.secs >= 0), 'simulated times are not negative');
 assert.ok(r.totals.simulatedSeconds > 0, 'the chain advances the simulated clock');
});

test('the bot rolls the credits from a fresh character', () => {
 const r = fresh();
 assert.equal(r.creditsRolled, true, 'the bot stopped before the credits at ' + r.stoppedAt);
});
