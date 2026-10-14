/* Synthetic position/supply boundary cases; actual Core candidate validation. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./helpers/earth-gate-fixture.cjs'),{C,A,E,Gate,copy,context,enter,fixture,place,call,readAll,prepared,lead,reach,finish}=H;
const EMPTY={version:1,accepted:false,evidence:[],plan:null,prepared:false,checkpoint:'camp',outcome:null,claimed:false};

test('Adventure14 migration preserves every old owner and stored XP boundary',()=>{
 for(const xp of [0,29,30,79,80,149,150,259,260,9999]){
  const raw=fixture().snapshot();assert.deepEqual(raw.adventure.earthGate,EMPTY);delete raw.adventure.earthGate;raw.adventure.version=14;raw.adventure.xp=xp;
  const bytes=JSON.stringify(raw),out=C.validate(raw);assert.equal(out.version,9);assert.equal(out.adventure.version,15);assert.deepEqual(out.adventure.earthGate,EMPTY);
  const recovered=copy(out);delete recovered.adventure.earthGate;recovered.adventure.version=14;assert.deepEqual(recovered,raw);assert.equal(JSON.stringify(raw),bytes);
 }
});
test('ambiguous old records and missing/current impossible progress refuse',()=>{
 const raw=fixture().snapshot();raw.adventure.version=14;assert.throws(()=>C.validate(raw),/Ambiguous pre-schema gate/);
 raw.adventure.version=15;delete raw.adventure.earthGate;assert.throws(()=>C.validate(raw),/gate captain/);
 for(const edit of[q=>q.claimed=true,q=>q.prepared=true,q=>q.outcome='admitted',q=>q.checkpoint='inspection-point']){const s=fixture().snapshot();edit(s.adventure.earthGate);assert.throws(()=>C.validate(s));}
 const blank=C.fresh();blank.adventure.earthGate={...EMPTY,accepted:true};assert.throws(()=>C.validate(blank),/kit required/);
});
test('current owner, physical records and explicit acceptance are required',()=>{
 const s=fixture(),before=s.snapshot();assert.equal(call(s,'accept').ok,false);assert.deepEqual(s.snapshot(),before);
 place(s,Gate.definition.evidence[1]);assert.equal(call(s,'read',{evidence:'sealed-waybill'}).ok,false);
 place(s,Gate.definition.giver);for(const p of[{expectedActive:'other'},{expectedRevision:999},{quest:'other'}])assert.equal(call(s,'accept',p).ok,false);
 assert.equal(call(s,'accept',{},()=>({ok:true}),()=>false).ok,false);s.paused=true;assert.equal(call(s,'accept').ok,false);s.paused=false;
 assert.ok(call(s,'accept').ok);const accepted=s.snapshot();assert.ok(call(s,'accept',{requestId:'new-id'}).duplicate);assert.deepEqual(s.snapshot(),accepted);
 assert.equal(call(s,'read',{evidence:'sealed-waybill'}).ok,false);assert.equal(call(s,'choose',{plan:'inspection-lane'}).ok,false);
});
test('shelter preparation spends exactly declared supplies once and preserves all other facts',()=>{
 const s=readAll(fixture());assert.ok(call(s,'choose',{plan:'temporary-shelter'}).ok);place(s,Gate.definition.plans['temporary-shelter'].prepare);
 s.state.sandbox.inventory.wood=3;s.state.sandbox.inventory.fiber=2;const short=s.snapshot();let writes=0;
 assert.equal(call(s,'prepare',{},()=>{writes++;return{ok:true};}).ok,false);assert.equal(writes,0);assert.deepEqual(s.snapshot(),short);
 s.state.sandbox.inventory.wood=4;const before=s.snapshot();let saved;
 const r=call(s,'prepare',{},candidate=>{saved=copy(candidate);return{ok:true};});assert.ok(r.ok,r.error);assert.deepEqual(r.cost,{wood:4,fiber:2});
 assert.equal(s.state.sandbox.inventory.wood,0);assert.equal(s.state.sandbox.inventory.fiber,0);assert.deepEqual(saved,s.snapshot());
 const normalized=copy(saved);normalized.adventure.earthGate=before.adventure.earthGate;normalized.adventure.revision=before.adventure.revision;normalized.sandbox.inventory.wood=4;normalized.sandbox.inventory.fiber=2;normalized.journal=before.journal;normalized.nextEvent=before.nextEvent;assert.deepEqual(normalized,before);
 const after=s.snapshot();assert.ok(call(s,'prepare',{requestId:'another'}).duplicate);assert.deepEqual(s.snapshot(),after);assert.equal(call(s,'choose',{plan:'inspection-lane'}).ok,false);
});
test('thrown, refused, async and mutated writers never adopt preparation or spend supplies',()=>{
 for(const saver of[()=>({ok:false,error:'quota'}),()=>{throw Error('disk');},()=>Promise.resolve({ok:true}),candidate=>{candidate.adventure.coins++;return{ok:true};},()=>({ok:true,adopted:false})]){
  const s=readAll(fixture());assert.ok(call(s,'choose',{plan:'temporary-shelter'}).ok);place(s,Gate.definition.plans['temporary-shelter'].prepare);s.state.sandbox.inventory.wood=4;s.state.sandbox.inventory.fiber=2;const before=s.snapshot();
  assert.equal(call(s,'prepare',{},saver).ok,false);assert.deepEqual(s.snapshot(),before);
 }
});
test('writer owner changes and record ceilings cannot partially adopt',()=>{
 const s=readAll(fixture());assert.ok(call(s,'choose',{plan:'inspection-lane'}).ok);place(s,Gate.definition.giver);let active=true;const before=s.snapshot();
 assert.equal(call(s,'prepare',{},()=>{active=false;return{ok:true};},()=>active).ok,false);assert.deepEqual(s.snapshot(),before);
 s.state.adventure.revision=1e9;let writes=0;assert.equal(call(s,'prepare',{},()=>{writes++;return{ok:true};}).ok,false);assert.equal(writes,0);assert.equal(s.state.adventure.earthGate.prepared,false);
});
for(const plan of ['inspection-lane','temporary-shelter'])test(plan+' requires actual three-body arrival, survives reload, pays once',()=>{
 let s=prepared(plan);const preparedWorld=s.snapshot();s=enter(new C.Simulation(preparedWorld));assert.deepEqual(s.state.adventure.earthGate,preparedWorld.adventure.earthGate);
 assert.equal(call(s,'checkpoint',{ticket:{}}).ok,false);assert.equal(call(s,'claim').ok,false);lead(s);
 const ticket=reach(s),before=s.snapshot();assert.equal(call(s,'checkpoint',{ticket:copy(ticket)}).ok,false);assert.deepEqual(s.snapshot(),before);
 let saved;assert.ok(call(s,'checkpoint',{ticket},world=>{saved=copy(world);return{ok:true};}).ok);assert.equal(call(s,'checkpoint',{ticket}).ok,false);
 const point=s.state.adventure.earthGate.checkpoint;s=enter(new C.Simulation(saved));assert.equal(Gate.motion.current(context(s)).checkpoint,point);finish(s);
 assert.equal(s.state.adventure.earthGate.outcome,plan==='inspection-lane'?'admitted':'sheltered');place(s,Gate.definition.giver);
 const arrived=s.snapshot(),r=call(s,'claim',{},world=>{saved=copy(world);return{ok:true};});assert.ok(r.ok,r.error);assert.deepEqual(r.reward,{xp:15,coins:8});
 assert.equal(s.state.adventure.coins,arrived.adventure.coins+8);assert.equal(s.state.adventure.xp,arrived.adventure.xp+15);
 const after=s.snapshot();assert.deepEqual(saved,after);assert.ok(call(s,'claim',{requestId:'changed-again'}).duplicate);assert.deepEqual(s.snapshot(),after);assert.deepEqual(new C.Simulation(saved).snapshot(),saved);
});
test('quota refusal keeps all reached bodies ready and retries the same physical proof',()=>{
 const s=prepared();lead(s);const ticket=reach(s),before=s.snapshot(),view=Gate.motion.current(context(s));
 assert.equal(call(s,'checkpoint',{ticket},()=>({ok:false,error:'quota'})).ok,false);assert.deepEqual(s.snapshot(),before);assert.deepEqual(Gate.motion.current(context(s)).actors,view.actors);assert.ok(Gate.motion.current(context(s)).ready);
 assert.ok(call(s,'checkpoint',{ticket}).ok);assert.equal(Gate.motion.validateArrival(context(s),ticket).ok,false);
});
test('coin capacity refuses the whole fee; capped veteran XP is retained on retry',()=>{
 const s=finish(prepared());place(s,Gate.definition.giver);s.state.adventure.coins=9999;s.state.adventure.xp=9999;const before=s.snapshot();let writes=0;
 assert.equal(call(s,'claim',{},()=>{writes++;return{ok:true};}).ok,false);assert.equal(writes,0);assert.deepEqual(s.snapshot(),before);
 s.state.adventure.coins=9991;const r=call(s,'claim');assert.ok(r.ok,r.error);assert.deepEqual(r.reward,{xp:0,coins:8});assert.equal(s.state.adventure.xp,9999);assert.equal(s.state.adventure.coins,9999);
});
