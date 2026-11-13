'use strict';
/* The journey bot in its fast mode: a fresh character through the wired producers, and the credits. The bot is
 * importable (tools/firstlight_journey.cjs run). The credits test is expected to fail until every beat has a producer;
 * its message names the beat where the bot stops. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { run } = require('../tools/firstlight_journey.cjs');
const fresh = () => run({ out: fs.mkdtempSync(path.join(os.tmpdir(), 'firstlight-journey-test-')), quiet: true });

test('a fresh character plays every wired beat through real producer commands, with no blocked beat', () => {
 const r = fresh();
 const wired = ['kit', 'hart', 'envoy', 'road', 'beacon', 'bellweather', 'night', 'hell'];
 for (const beat of wired) {
  const row = r.rows.find(x => x.beat === beat);
  assert.ok(row, 'the table has the beat ' + beat);
  assert.equal(row.status, 'ran', beat + ': ' + (row.why || row.status));
 }
 // heaven is the first blocked beat for now; the credits test shows the whole gap.
 assert.equal(r.stoppedAt, 'heaven', 'the chain stops at heaven, the first beat without a passing helper');
 assert.ok(r.rows.filter(x => x.status === 'ran' && x.secs !== null).every(x => x.secs >= 0), 'simulated times are not negative');
 assert.ok(r.totals.simulatedSeconds > 0, 'the chain advances the simulated clock');
});

test('the bot rolls the credits from a fresh character', () => {
 const r = fresh();
 assert.equal(r.creditsRolled, true, 'the bot stopped before the credits at ' + r.stoppedAt);
});
