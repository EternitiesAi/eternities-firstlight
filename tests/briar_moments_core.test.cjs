/* Synthetic save boundaries only; completed histories below are planted,
 * not command-earned outings or personal saves. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),B=require('../src/briar-moments.js'),copy=o=>JSON.parse(JSON.stringify(o));
test('the real world factory retains an empty distinct Briar owner',()=>{
 const s=C.fresh();assert.deepEqual(s.briarMoments,B.fresh());assert.equal(s.version,9);assert.equal(s.adventure.version,14);
});
test('real Core accepts a missing legacy owner without shared-history backfill',()=>{
 const old=C.fresh();delete old.briarMoments;const kept=C.validate(old);assert.deepEqual(kept.briarMoments,B.fresh());
 delete kept.briarMoments;assert.deepEqual(kept,old);
});
test('Core and actual snapshot retain earned prerequisites and only valid moments',()=>{
 const raw=C.fresh();raw.adventure.started=true;raw.adventure.companion.bonded=true;
 raw.briarMoments={version:1,revision:2,moments:[B.CLOTH_HOME,B.COMMONS_REST]};
 assert.deepEqual(C.validate(raw),raw);const sim=new C.Simulation(raw);assert.deepEqual(sim.snapshot(),raw);
 const bad=copy(raw);bad.adventure.companion.bonded=false;assert.throws(()=>C.validate(bad),/Briar/);
});
test('raw own undefined and inherited owners refuse through Core, including legacy migration',()=>{
 const raw=C.fresh();raw.briarMoments=undefined;assert.throws(()=>C.validate(raw),/Briar/);
 for(const version of [9,8]){const source=C.fresh();delete source.briarMoments;source.version=version;
  const inherited=Object.assign(Object.create({briarMoments:B.fresh()}),source);assert.throws(()=>C.validate(inherited),/Briar/);
 }
});
