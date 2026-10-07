'use strict';
// Historical, command-earned returning characters, not fresh-player pacing.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),hashes={blade:'3b8e39f119e5eda83211f036b13f982961a96830d24235a1a86065ee32c99a93',bow:'ea92d097b01b1d9610a25e02300b07a629c257a58d1a57e09e67de27648f657f'};
const family=variant=>variant==='fresh-bow'||variant==='bow'?'bow':variant==='fresh-blade'||variant==='blade'?'blade':assert.fail('Declared fixture family only');
const file=variant=>path.join(root,'tests/fixtures/earth-homecoming-prerequisites',family(variant),'ALL_TWELVE_PREREQUISITES_EARNED.json');
function load(variant){const b=fs.readFileSync(file(variant));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),hashes[family(variant)]);return JSON.parse(b);}
module.exports={file,load};
