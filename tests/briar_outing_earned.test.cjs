/* Early access and actual App hook coverage, earned in this test invocation. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),J=require('./briar_outing_journey.cjs');
const earned=J.earlyRescue();
for(const name of ['blade','bow'])test('earned early '+name+' keeps both explicit moments through actual App writer and Store readback',()=>{
 const input=earned[name].world,r=J.outing(input);assert.equal(r.status,'passed');assert.equal(r.weaponStyle,name);assert.equal(r.currentAppOwnershipFunctions,true);assert.ok(r.acceptedSupportedTickSegments>100);assert.equal(input.adventure.relic,false);assert.equal(input.adventure.angelSeen,false);assert.equal(input.adventure.reward,null);assert.deepEqual(r.final.briarMoments.moments,['briar-cloth-home-v1','briar-commons-rest-v1']);assert.equal(r.final.adventure.equipment.weapon,input.adventure.equipment.weapon);
});
test('later journey preservation oracles cannot silently erase completed companion history',()=>{
 const r=J.outing(earned.blade.world),P=require('../tools/earth-homecoming-journey/earned_common.cjs'),Q=require('../tools/earth-homecoming-journey/connected_support.cjs');
 P.preserved(r.final,r.final);Q.preserve(r.final,r.final);const erased=structuredClone(r.final);erased.briarMoments={version:1,revision:0,moments:[]};
 assert.throws(()=>P.preserved(erased,r.final),/briarMoments/);assert.throws(()=>Q.preserve(erased,r.final),/briarMoments/);
});
