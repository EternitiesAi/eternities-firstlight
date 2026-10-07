'use strict';
/* Explicit negative preservation fixture, never a gameplay or earned receipt. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=fs.realpathSync(process.env.FIRSTLIGHT_ROOT||path.resolve(__dirname,'..')),P=require(process.env.EARTH_HOST_COMMON||path.join(ROOT,'tools/earth-homecoming-journey/earned_common.cjs')),C=P.load('core');
test('old homecoming preservation refuses any mutation of the separate WildSigns owner',()=>{
 const before=C.fresh(),changed=structuredClone(before);changed.earthWildSigns.accepted=true;
 assert.doesNotThrow(()=>P.preserved(structuredClone(before),before));
 assert.throws(()=>P.preserved(changed,before),/earthWildSigns/);
});
