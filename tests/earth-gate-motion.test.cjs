/* Synthetic owner/position boundaries; movement advances only after real Core
 * ticks. No viewport, persistence or human pacing is certified by these tests. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./helpers/earth-gate-fixture.cjs'),{Gate,copy,context,place,fixture,readAll,prepared,lead,reach,call}=H;
const M=Gate.motion;
function step(s,dt=.1){s.tick(dt);const before=JSON.stringify(s.state),r=M.tick(context(s),dt);assert.equal(JSON.stringify(s.state),before);return r;}

test('supported accepted group can be seen before preparation but cannot move',()=>{
 const s=readAll(fixture()),v=M.current(context(s));assert.equal(v.status,'unprepared');assert.equal(v.actors.length,3);
 assert.equal(M.begin(context(s)).ok,false);assert.equal(M.arrivalTicket(context(s)).ok,false);const before=copy(v.actors);
 for(let i=0;i<10;i++)assert.ok(step(s).ok);assert.deepEqual(M.current(context(s)).actors,before);
});
test('every body has bounded actual displacement and reused elapsed time refuses',()=>{
 const s=prepared();lead(s);let v=M.current(context(s));
 assert.equal(M.tick(context(s),.1).ok,false);assert.deepEqual(M.current(context(s)).actors,v.actors);
 for(const dt of [-1,.1001,Infinity,NaN,'0.1'])assert.equal(M.tick(context(s),dt).ok,false);
 for(let i=0;i<20;i++){
  const next=step(s).view;for(let k=0;k<3;k++){const a=v.actors[k],b=next.actors[k],d=Math.hypot(a.x-b.x,a.z-b.z);assert.ok(d>0&&d<=.18000001);assert.ok(Math.abs((b.distance-a.distance)-d)<1e-9);}
  assert.equal(M.isProjection(v,context(s)),false);assert.ok(M.isProjection(next,context(s)));v=next;
  const before=copy(v.actors);assert.equal(M.tick(context(s),.1).ok,false);assert.deepEqual(M.current(context(s)).actors,before);
 }
 assert.throws(()=>{v.actors[0].x=999;});assert.equal(M.arrivalTicket(context(s)).ok,false);
});
test('menu pause and explicit wait stop all three, then actual leading resumes',()=>{
 const s=prepared();lead(s);step(s);let before=copy(M.current(context(s)).actors);s.paused=true;
 for(let i=0;i<20;i++){assert.ok(step(s).ok);assert.equal(M.current(context(s)).status,'paused');}
 assert.deepEqual(M.current(context(s)).actors,before);s.paused=false;assert.ok(step(s).ok);assert.notDeepEqual(M.current(context(s)).actors,before);
 assert.ok(M.wait(context(s)).ok);before=copy(M.current(context(s)).actors);for(let i=0;i<10;i++)assert.ok(step(s).ok);assert.deepEqual(M.current(context(s)).actors,before);
 const p=M.current(context(s)).actors[1];place(s,{x:p.x,z:p.z+2});assert.ok(M.begin(context(s)).ok);assert.ok(step(s).view.moving);
});
test('a distant player causes a visible wait without checkpoint progress; coming back resumes',()=>{
 const s=prepared();lead(s);step(s);const before=copy(M.current(context(s)).actors),q=copy(s.state.adventure.earthGate);
 place(s,{x:0,z:24});assert.ok(step(s).ok);assert.equal(M.current(context(s)).status,'waiting-far');assert.deepEqual(M.current(context(s)).actors,before);assert.deepEqual(s.state.adventure.earthGate,q);
 const p=before[1];place(s,{x:p.x,z:p.z+2});assert.ok(step(s).view.moving);assert.notDeepEqual(M.current(context(s)).actors,before);
});
test('a forged definition, lease, projection or arrival object cannot supply authority',()=>{
 const s=prepared(),c=context(s);assert.equal(M.current({...c,definition:copy(Gate.definition)}),null);
 assert.equal(M.current({...c,ownerLease:Object.freeze({})}),null);assert.equal(M.current({...c,current:()=>false}),null);
 lead(s);const v=M.current(context(s));assert.equal(M.isProjection(copy(v),context(s)),false);
 assert.equal(M.validateArrival(context(s),{}).ok,false);assert.equal(M.consume(context(s),{kind:'earth-gate-arrival-v1'}).ok,false);
});
test('arrival authority is not consumable before the exact saved checkpoint',()=>{
 const s=prepared();lead(s);const ticket=reach(s),before=s.snapshot();assert.equal(M.consume(context(s),ticket).ok,false);assert.deepEqual(s.snapshot(),before);
 assert.ok(M.validateArrival(context(s),ticket).ok);assert.equal(M.consume(context(s),ticket).ok,false);assert.deepEqual(s.snapshot(),before);
 assert.ok(call(s,'checkpoint',{ticket}).ok);assert.equal(M.consume(context(s),ticket).ok,false);assert.equal(M.validateArrival(context(s),ticket).ok,false);
});
for(const reason of ['lease','active','scene','death','trip','clock','world'])test(reason+' invalidates the old live arrival without changing saved progress',()=>{
 const s=prepared();lead(s);const ticket=reach(s),q=copy(s.state.adventure.earthGate);let ctx=context(s);
 if(reason==='lease')s.gateEscortOwnerLease=Object.freeze({});
 if(reason==='active')ctx={...ctx,active:'other-owner'};
 if(reason==='scene')s.room=null;
 if(reason==='death')s.state.adventure.deaths++;
 if(reason==='trip')s.earthTrip={...s.earthTrip};
 if(reason==='clock')s.elapsed-=1;
 if(reason==='world')s.state=copy(s.state);
 assert.equal(M.validateArrival(ctx,ticket).ok,false);assert.deepEqual(s.state.adventure.earthGate,q);
});
test('reset discards only unsaved motion and restores all actors at the recorded checkpoint',()=>{
 const s=prepared();lead(s);assert.ok(call(s,'checkpoint',{ticket:reach(s)}).ok);for(let i=0;i<10;i++)assert.ok(step(s).ok);
 const q=copy(s.state.adventure.earthGate),old=M.current(context(s));assert.equal(q.checkpoint,'orchard-turn');
 assert.ok(M.reset(s,'reload').ok);const restored=M.current(context(s));assert.equal(restored.status,'waiting');assert.equal(restored.checkpoint,'orchard-turn');assert.deepEqual(s.state.adventure.earthGate,q);
 assert.deepEqual(restored.actors.map(a=>[a.x,a.z]),[[-13.75,6],[-13,6],[-12.25,6]]);assert.equal(M.isProjection(old,context(s)),false);
});
