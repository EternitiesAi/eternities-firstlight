'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
let B=null;
try{B=require('../src/briar-moments.js');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
const state={adventure:{started:true,companion:{bonded:true}}};
function api(){assert.equal(typeof B?.fresh,'function','The new narrow completed-moment owner must exist');return B;}
test('missing legacy moment data starts empty without inventing shared history',()=>{
 const b=api();assert.deepEqual(b.fresh(),{version:1,revision:0,moments:[]});assert.deepEqual(b.validate(undefined,state),b.fresh());
});
test('only completed chronological moments survive copied validation',()=>{
 const b=api(),r={version:1,revision:2,moments:[b.CLOTH_HOME,b.COMMONS_REST]},before=JSON.stringify(r);
 const copy=b.validate(r,state);assert.deepEqual(copy,r);copy.moments.pop();assert.equal(JSON.stringify(r),before);
 for(const moments of [[b.COMMONS_REST],[b.CLOTH_HOME,b.CLOTH_HOME],[b.COMMONS_REST,b.CLOTH_HOME],['old-cache'],[b.CLOTH_HOME,b.COMMONS_REST,b.CLOTH_HOME]])assert.throws(()=>b.validate({version:1,revision:moments.length,moments},state),/Briar/);
});
test('malformed, future, inherited and unearned history is refused',()=>{
 const b=api();
 for(const raw of [null,[],{version:2,revision:0,moments:[]},{version:1,revision:1,moments:[]},{version:1,revision:0,moments:[],love:99},Object.create({version:1,revision:0,moments:[]}),{version:1,revision:0,moments:[],[Symbol('extra')]:true}])assert.throws(()=>b.validate(raw,state),/Briar/);
 const earned={version:1,revision:1,moments:[b.CLOTH_HOME]};
 for(const s of [{},{adventure:{started:false,companion:{bonded:true}}},{adventure:{started:true,companion:{bonded:false}}}])assert.throws(()=>b.validate(earned,s),/Briar/);
});
test('world-level migration distinguishes absent, own undefined and inherited owners',()=>{
 const b=api();assert.deepEqual(b.fromWorld(state),b.fresh());
 assert.throws(()=>b.fromWorld({...state,briarMoments:undefined}),/Briar/);
 assert.throws(()=>b.fromWorld(Object.assign(Object.create({briarMoments:b.fresh()}),state)),/Briar/);
});
test('sparse or decorated lists cannot invent a completed event',()=>{
 const b=api(),hole=new Array(1);hole.extra=true;
 assert.throws(()=>b.validate({version:1,revision:1,moments:hole},state),/Briar/);
 const decorated=[b.CLOTH_HOME];decorated.extra=true;
 assert.throws(()=>b.validate({version:1,revision:1,moments:decorated},state),/Briar/);
});
test('completed moments require a boolean start and normalized Adventure prerequisites',()=>{
 const b=api(),r={version:1,revision:1,moments:[b.CLOTH_HOME]};
 assert.deepEqual(b.validate(r,state),r);
 for(const started of ['yes',1,{}])assert.throws(()=>b.validate(r,{adventure:{started,companion:{bonded:true}}}),/Briar/);
 assert.deepEqual(b.fromWorld({briarMoments:r},state),r);
 assert.throws(()=>b.fromWorld({...state,briarMoments:r},{adventure:{started:true,companion:{bonded:false}}}),/Briar/);
 assert.throws(()=>b.fromWorld(Object.create({briarMoments:r}),state),/Briar/);
});
