'use strict';
/* The three endings, each from a fresh character through the bot: the open road (the default), the answered ending (all
 * three sightings heard, then the first page), and the kept ending (the offer signed). Each must roll the credits, and the
 * saga must record the ending the bot chose. Each run is the whole chain; the runs share no state. */
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { run } = require('../tools/firstlight_journey.cjs');

for (const ending of ['open', 'answered', 'kept']) {
 test('the ' + ending + ' ending rolls the credits from a fresh character, and the saga records it', () => {
  const r = run({ quiet: true, ending });
  assert.equal(r.creditsRolled, true, ending + ': the bot stopped at ' + r.stoppedAt);
  assert.ok(r.finalWorld, 'the final save is kept');
  const saga = JSON.parse(fs.readFileSync(r.finalWorld, 'utf8')).saga;
  assert.equal(saga.finale.ending, ending, 'the saga records the ending');
  assert.equal(saga.credits, true); assert.equal(saga.postgame, true);
 });
}
