'use strict';
/* A producer's skill command waits for the skill's real cooldown; it never assumes a fixed step count. The cooldown is
 * the combat runtime's own (cooldowns[key] is the elapsed time at which the skill is ready again). */
const T = require('../../src/combat.js');
function untilReady(sim, key, step, max = 30) {
 for (let i = 0; i < max * 20; i++) {
  if (sim.state.adventure.elapsed >= T.runtime(sim).cooldowns[key]) return;
  step(.05);
 }
 throw Error(key + ' did not recover within ' + max + 's');
}
module.exports = { untilReady };
