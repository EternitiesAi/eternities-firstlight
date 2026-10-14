'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/earth-gate-model.js');
const fresh=()=>({version:1,accepted:false,evidence:[],plan:null,prepared:false,checkpoint:'camp',outcome:null,claimed:false});
const copy=v=>JSON.parse(JSON.stringify(v));
function apply(q,type,p={}){const before=JSON.stringify(q),r=M.transition(q,type,p);assert.equal(JSON.stringify(q),before,'model never mutates its input');assert.equal(r.ok,true,r.error);return r;}
function prepared(plan){let q=apply(fresh(),'accept').state;for(const evidence of ['sealed-waybill','arrival-register','shelter-screen'])q=apply(q,'read',{evidence}).state;q=apply(q,'choose',{plan}).state;return apply(q,'prepare').state;}

test('literal fresh record, independent arrays and strict schema boundaries',()=>{
 assert.deepEqual(M.fresh(),fresh());const a=M.fresh();a.evidence.push('arrival-register');assert.deepEqual(M.fresh(),fresh());
 for(const raw of[null,undefined,[],{}, {...fresh(),version:2},{...fresh(),claimed:true},{...fresh(),plan:'inspection-lane'},
  {...fresh(),evidence:['sealed-waybill']},{...fresh(),prepared:true},{...fresh(),checkpoint:'north-gate'},
  {...fresh(),outcome:'admitted'},{...fresh(),extra:true},Object.assign(Object.create({x:1}),fresh())])assert.throws(()=>M.validate(raw));
 const inherited=copy(fresh());delete inherited.accepted;Object.setPrototypeOf(inherited,{accepted:false});assert.throws(()=>M.validate(inherited));
 const hidden=copy(fresh());Object.defineProperty(hidden,'accepted',{value:false,enumerable:false});assert.throws(()=>M.validate(hidden));
});

test('acceptance is explicit; readings are unique and retain discovery order',()=>{
 assert.equal(M.transition(fresh(),'read',{evidence:'sealed-waybill'}).ok,false);
 let q=apply(fresh(),'accept').state;assert.equal(apply(q,'accept').duplicate,true);
 q=apply(q,'read',{evidence:'sealed-waybill'}).state;q=apply(q,'read',{evidence:'arrival-register'}).state;
 assert.deepEqual(q.evidence,['sealed-waybill','arrival-register']);assert.equal(apply(q,'read',{evidence:'sealed-waybill'}).duplicate,true);
 assert.equal(M.transition(q,'read',{evidence:'rumour-is-proof'}).ok,false);
 assert.equal(M.transition(q,'choose',{plan:'inspection-lane'}).ok,false);
 assert.throws(()=>M.validate({...q,evidence:['sealed-waybill','sealed-waybill']}));
});

test('complete evidence permits an explicit plan change only before preparation',()=>{
 let q=apply(fresh(),'accept').state;for(const evidence of ['arrival-register','sealed-waybill','shelter-screen'])q=apply(q,'read',{evidence}).state;
 q=apply(q,'choose',{plan:'inspection-lane'}).state;assert.equal(apply(q,'choose',{plan:'inspection-lane'}).duplicate,true);
 q=apply(q,'choose',{plan:'temporary-shelter'}).state;const p=apply(q,'prepare');
 assert.deepEqual(p.cost,{wood:4,fiber:2});q=p.state;
 assert.equal(M.transition(q,'choose',{plan:'inspection-lane'}).ok,false);
 const retry=apply(q,'prepare');assert.equal(retry.duplicate,true);assert.equal(retry.cost,undefined);
 assert.deepEqual(apply({...q,prepared:false},'choose',{plan:'inspection-lane'}).state.plan,'inspection-lane');
});

for(const plan of ['inspection-lane','temporary-shelter'])test(plan+' requires consecutive physical checkpoint proposals and one fee',()=>{
 let q=prepared(plan);const route=M.route(plan);assert.equal(q.checkpoint,'camp');
 assert.equal(M.transition(q,'claim').ok,false);
 assert.equal(M.transition(q,'checkpoint',{checkpoint:route.at(-1).id}).ok,false);
 assert.equal(M.transition(q,'checkpoint',{checkpoint:'invented'}).ok,false);
 for(const point of route.slice(1)){
  const prior=copy(q);q=apply(q,'checkpoint',{checkpoint:point.id}).state;
  assert.equal(apply(q,'checkpoint',{checkpoint:point.id}).duplicate,true);
  assert.equal(M.transition(q,'checkpoint',{checkpoint:prior.checkpoint}).ok,false);
  assert.deepEqual(M.validate(copy(q)),q,'all partial records survive serialization');
 }
 assert.equal(q.outcome,plan==='inspection-lane'?'admitted':'sheltered');
 const payment=apply(q,'claim');assert.deepEqual(payment.reward,{xp:15,coins:8});q=payment.state;
 assert.equal(q.claimed,true);assert.equal(apply(q,'claim').duplicate,true);assert.equal(apply(q,'claim').reward,undefined);
 assert.deepEqual(M.validate(copy(q)),q);
 assert.throws(()=>M.validate({...q,outcome:null}));
 assert.throws(()=>M.validate({...q,prepared:false}));
 assert.throws(()=>M.validate({...q,checkpoint:'camp'}));
 assert.throws(()=>M.validate({...q,outcome:q.outcome==='admitted'?'sheltered':'admitted'}));
});

test('checkpoint proposals require preparation and cannot authorize a world mutation themselves',()=>{
 let q=apply(fresh(),'accept').state;
 assert.equal(M.transition(q,'prepare').ok,false);assert.equal(M.transition(q,'checkpoint',{checkpoint:'orchard-turn'}).ok,false);
 assert.equal(M.transition(q,'claim').ok,false);assert.equal(M.transition(q,'invented').ok,false);
 for(const payload of [null,[],true,42])assert.equal(M.transition(q,'read',payload).ok,false);
 assert.equal(M.transition({...q,extra:true},'accept').ok,false);
 const proposed=apply(prepared('inspection-lane'),'checkpoint',{checkpoint:'orchard-turn'});
 assert.equal(proposed.state.checkpoint,'orchard-turn');assert.equal(proposed.world,undefined);
 assert.equal(proposed.ticket,undefined,'pure proposed state is not live escort authority');
});

test('immutable definitions retain stable identities and exact costs/outcomes',()=>{
 assert.equal(M.definition.id,'earth-gate-captains-choice-v1');assert.equal(M.definition.group,'hearthwater-east-road-arrivals-v1');
 assert.equal(new Set(M.definition.actors.map(a=>a.id)).size,3);
 assert.deepEqual(M.definition.actors.map(a=>a.offset),[-.75,0,.75]);
 assert.deepEqual(M.definition.plans['inspection-lane'].cost,{});
 assert.deepEqual(M.definition.plans['temporary-shelter'].cost,{wood:4,fiber:2});
 assert.throws(()=>{M.route('inspection-lane')[1].x=999;});assert.throws(()=>M.route('constructor'));
 assert.throws(()=>{M.definition.reward.coins=999;});
 assert.throws(()=>{M.definition.actors.push({id:'fake-online'});});
});

test('all three actual body paths fit complete supported Earth segments',()=>{
 require('../src/core.js');const E=globalThis.RealmEarth,C=globalThis.RealmCore,nav={id:E.ROOM};
 assert.equal(M.definition.room,E.ROOM);assert.ok(E.walkable(M.definition.giver.x,M.definition.giver.z,.31));
 for(const e of M.definition.evidence)assert.ok(E.walkable(e.x,e.z,.31));
 for(const plan of ['inspection-lane','temporary-shelter']){
  const route=M.route(plan);assert.equal(new Set(route.map(p=>p.id)).size,route.length);
  for(const actor of M.definition.actors){
   const path=route.map(p=>({x:p.x+actor.offset,z:p.z}));
   assert.ok(path.every(p=>E.walkable(p.x,p.z,M.definition.radius)));
   for(let i=1;i<path.length;i++)assert.ok(E.segment(path[i-1],path[i],M.definition.radius),'complete actor segment '+plan+'/'+actor.id+'/'+route[i].id);
   assert.ok(path.every(p=>C.walkable(p.x,p.z,nav)),'actual player/Core scene dispatch retains these destinations');
   for(let i=1;i<path.length;i++)assert.ok(C.segment(path[i-1],path[i],nav,M.definition.radius),'actual Core dispatch retains the entire segment');
  }
 }
 assert.ok(C.pathfind(E.ENTRY,M.definition.giver,nav),'current player navigation reaches the captain from the actual Earth entry');
});
