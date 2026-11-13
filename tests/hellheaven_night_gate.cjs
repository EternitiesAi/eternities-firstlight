'use strict';
/* Documented test helper, loaded by the synthetic and journey cases that open Hell or Heaven.
 * The night beat belongs to the night lane and bellweather to the crossing. Neither is in this worktree,
 * so a synthetic case cannot earn the saga's hell or heaven gate honestly. This helper opens only those two
 * doors for cases that test what happens behind them. The real gate is tested without it in
 * tests/hellheaven_gates.test.cjs, and the saga's own rules stay untouched for every other gate. */
const path=require('node:path');
const SAGA=require(path.join(__dirname,'../src/saga.js'));
globalThis.RealmSaga=Object.freeze({...SAGA,allowed:(world,gate)=>gate==='hell'||gate==='heaven'?true:SAGA.allowed(world,gate)});
module.exports={SAGA};
