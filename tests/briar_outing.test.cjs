/* Synthetic boundary fixtures. Core navigation/ticks and Adventure's real
 * actor execute; these are not earned campaigns or personal saves. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),M=require('../src/briar-moments.js');
let B=null;try{B=require('../src/briar-outing.js');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
const copy=o=>JSON.parse(JSON.stringify(o));
function fixture(){
 assert.equal(typeof B?.command,'function','The physical Briar outing owner must exist');
 const sim=new C.Simulation();sim.state.adventure.started=true;sim.state.adventure.companion.bonded=true;
 sim.state.player={x:B.definition.home.x,z:B.definition.home.z,yaw:0};A.syncScene(sim);
 const f={sim,active:'synthetic-briar-character',revision:1,lease:Object.freeze({}),writes:0,allow:true};
 sim.briarOwnerLease=f.lease;
 f.ctx=()=>({sim:f.sim,active:f.active,revision:f.revision,ownerLease:f.lease,definition:B.definition,current:()=>f.ctx()});
 sim.briarContext=f.ctx;
 f.save=candidate=>{f.writes++;if(!f.allow)return{ok:false,error:'synthetic quota refusal'};f.saved=C.validate(candidate);f.revision++;return{ok:true};};
 f.run=(type,payload={})=>B.command(f.ctx(),type,payload,{save:f.save});return f;
}
function accompany(f,phase){
 for(let i=0;i<1800;i++){
  const v=B.current(f.ctx());if(v?.phase===phase)return v;
  assert.ok(v,'Actual current outing was lost before '+phase);
  const c=A.runtime(f.sim).companion,prior={x:c.x,z:c.z};
  if(i%6===0)assert.equal(f.sim.moveTo(c.x,c.z).ok,true);
  f.sim.tick(.05);
  assert.ok(C.segment(prior,c,f.sim.navRoom,.31),'Every actual fox displacement has supported clearance');
 }
 assert.fail('Physical outing failed to reach '+phase);
}
function returned(f){assert.ok(f.run('start').ok);accompany(f,'await-take');}
test('defined outing points and whole routes are actually supported',()=>{
 const f=fixture();for(const q of [B.definition.cloth,B.definition.home,B.definition.rest]){
  assert.ok(C.walkable(q.x,q.z,f.sim.navRoom,.31));assert.ok(C.pathfind(f.sim.state.player,q,f.sim.navRoom));
 }
});
test('acceptance creates only an intent and refuses injected terms or repeated starts',()=>{
 const f=fixture(),before=JSON.stringify(f.sim.snapshot());assert.equal(f.run('start',{x:99}).ok,false);
 assert.ok(f.run('start').ok);assert.equal(JSON.stringify(f.sim.snapshot()),before);assert.equal(f.writes,0);
 assert.equal(f.run('take').ok,false);assert.equal(f.run('start').ok,false);
});
test('actual outbound/carry/return and explicit save produce one useful shared fact',()=>{
 const f=fixture(),before=f.sim.snapshot();returned(f);const view=B.current(f.ctx()),beforeTake=f.sim.snapshot();
 assert.ok(view.carrying);assert.ok(view.distanceTravelled>1);assert.deepEqual(f.sim.state.briarMoments,M.fresh());
 assert.ok(f.run('take').ok);assert.deepEqual(f.sim.state.briarMoments.moments,[M.CLOTH_HOME]);assert.equal(f.writes,1);
 assert.ok(f.run('take').duplicate);assert.equal(f.writes,1);
 const kept=f.sim.snapshot();for(const k of Object.keys(beforeTake))if(!['adventure','briarMoments','journal','nextEvent'].includes(k))assert.deepEqual(kept[k],beforeTake[k],k);
 const expectedAdventure=copy(beforeTake.adventure);expectedAdventure.revision++;assert.deepEqual(kept.adventure,expectedAdventure);
 assert.equal(kept.adventure.xp,before.adventure.xp);assert.equal(kept.adventure.coins,before.adventure.coins);assert.deepEqual(kept.adventure.road,before.adventure.road);
});
test('refused turn-in is unchanged and retryable; cold completed load cannot duplicate',()=>{
 const f=fixture();returned(f);const before=JSON.stringify(f.sim.snapshot());f.allow=false;
 assert.equal(f.run('take').ok,false);assert.equal(JSON.stringify(f.sim.snapshot()),before);assert.equal(B.current(f.ctx()).phase,'await-take');
 f.allow=true;assert.ok(f.run('take').ok);f.sim=new C.Simulation(copy(f.saved));f.sim.briarOwnerLease=f.lease;f.sim.briarContext=f.ctx;A.syncScene(f.sim);
 const writes=f.writes;assert.ok(f.run('take').duplicate);assert.equal(f.writes,writes);assert.equal(f.sim.state.briarMoments.revision,1);
});
test('rest requires the returned cloth and actual arrival before remembering',()=>{
 const f=fixture();assert.equal(f.run('rest').ok,false);returned(f);assert.ok(f.run('take').ok);
 assert.ok(f.run('rest').ok);assert.equal(f.run('remember').ok,false);accompany(f,'settled');
 assert.ok(B.current(f.ctx()).resting);assert.ok(f.run('remember').ok);assert.equal(f.sim.state.briarMoments.revision,2);
 const writes=f.writes;assert.ok(f.run('remember').duplicate);assert.equal(f.writes,writes);
});
test('revisiting the recorded doorstep rests again without suggesting or writing a second moment',()=>{
 const f=fixture();returned(f);assert.ok(f.run('take').ok);assert.ok(f.run('rest').ok);accompany(f,'settled');assert.ok(f.run('remember').ok);
 const writes=f.writes,record=copy(f.sim.state.briarMoments);assert.ok(f.run('cancel').ok);
 assert.ok(f.sim.moveTo(B.definition.home.x,B.definition.home.z).ok);
 for(let i=0;i<1800&&f.sim.playerPath.length;i++)f.sim.tick(.05);
 for(let i=0;i<100;i++)f.sim.tick(.05);
 assert.ok(f.run('rest').ok);const v=accompany(f,'rested');
 assert.ok(v.resting);assert.match(v.status,/Follow whenever/);assert.doesNotMatch(v.status,/Remember/);
 assert.deepEqual(f.sim.state.briarMoments,record);assert.equal(f.writes,writes);
});
test('Follow, Stay, travel, death, lease changes and forged displacement cancel unfinished intent',()=>{
 for(const fault of ['follow','stay','room','death','lease','teleport']){
  const f=fixture();assert.ok(f.run('start').ok);
  if(fault==='follow'||fault==='stay')assert.ok(f.sim.adventureCommand('explicit-'+fault,'companion-mode',{mode:fault}).ok);
  else if(fault==='room')f.sim.room='road';else if(fault==='death')f.sim.state.adventure.hp=0;
  else if(fault==='lease')f.sim.briarOwnerLease=Object.freeze({});else A.runtime(f.sim).companion.z+=3;
  f.sim.tick(.05);assert.equal(B.current(f.ctx()),null,fault);assert.deepEqual(f.sim.state.briarMoments,M.fresh());assert.equal(f.writes,0);
 }
});
test('reload and copied actor diagnostics never establish a physical return',()=>{
 const f=fixture();assert.ok(f.run('start').ok);const actor=A.runtime(f.sim).companion;
 f.sim.adventureRuntime.companion={...actor};f.sim.tick(.05);assert.equal(B.current(f.ctx()),null);
 f.sim=new C.Simulation(f.sim.snapshot());f.sim.briarOwnerLease=f.lease;f.sim.briarContext=f.ctx;
 assert.equal(f.run('take').ok,false);assert.equal(f.writes,0);
});
test('a successful outgoing save is never adopted into a replacement character',()=>{
 const f=fixture();returned(f);const outgoing=f.sim;
 f.save=candidate=>{f.saved=C.validate(candidate);f.sim=new C.Simulation();f.active='replacement';return{ok:true};};
 const r=f.run('take');assert.equal(r.ok,true);assert.equal(r.adopted,false);
 assert.deepEqual(outgoing.state.briarMoments,M.fresh());assert.deepEqual(f.sim.state.briarMoments,M.fresh());assert.deepEqual(f.saved.briarMoments.moments,[M.CLOTH_HOME]);
});
test('a known saved moment with a changed same-simulation owner blocks older local snapshots until readback',()=>{
 for(const fault of ['state','lease','receipt']){
  const f=fixture();returned(f);f.save=candidate=>{f.saved=C.validate(candidate);if(fault==='state')f.sim.state=copy(f.sim.state);else if(fault==='lease')f.sim.briarOwnerLease=Object.freeze({});return{ok:true,adopted:fault==='receipt'?false:true};};
  const r=f.run('take');assert.equal(r.ok,true);assert.equal(r.adopted,false);assert.match(r.warning,/saved|Reload/);
  assert.equal(B.saveAllowed(f.sim),false,fault);assert.deepEqual(f.sim.state.briarMoments,M.fresh());assert.deepEqual(f.saved.briarMoments.moments,[M.CLOTH_HOME]);
  assert.match(B.availability(f.ctx()).error,/saved.*not adopted/i,'Known successful storage must not be mislabeled an unknown result');
 }
});
test('an asynchronous or uncertain saver cannot trigger blind replay',()=>{
 const f=fixture();returned(f);let calls=0;f.save=()=>{calls++;return Promise.resolve({ok:true});};
 const r=f.run('take');assert.equal(r.ok,false);assert.match(r.error,/uncertain|asynchronous/i);assert.equal(f.run('take').ok,false);assert.equal(calls,1);
 assert.deepEqual(f.sim.state.briarMoments,M.fresh());
});
test('uncertain resting save preserves the real settled pose and cannot invent a carried cloth',()=>{
 const f=fixture();returned(f);assert.ok(f.run('take').ok);assert.ok(f.run('rest').ok);accompany(f,'settled');
 f.save=()=>Promise.resolve({ok:true});assert.equal(f.run('remember').ok,false);
 const v=B.current(f.ctx());assert.equal(v.resting,true);assert.equal(v.carrying,false);assert.equal(v.uncertain,true);
});
test('uncertain saves stay quarantined through cancellation, Follow and scene changes',()=>{
 const f=fixture();returned(f);let calls=0;f.save=()=>{calls++;return Promise.resolve({ok:true});};assert.equal(f.run('take').ok,false);
 assert.ok(f.run('cancel').ok);assert.equal(f.run('start').ok,false);assert.equal(B.saveAllowed(f.sim),false);
 assert.ok(f.sim.adventureCommand('release-uncertain','companion-mode',{mode:'follow'}).ok);f.sim.room='road';f.sim.tick(.05);f.sim.room=null;A.syncScene(f.sim);
 assert.equal(f.run('start').ok,false);assert.equal(B.saveAllowed(f.sim),false);assert.equal(calls,1);
});
test('a post-write throw is unknown until saved-state readback, never a retryable refusal',()=>{
 const f=fixture();returned(f);let calls=0;f.save=candidate=>{calls++;f.saved=C.validate(candidate);throw Error('synthetic failure after persisting');};
 const r=f.run('take');assert.equal(r.ok,false);assert.match(r.error,/unknown|uncertain/i);assert.equal(B.saveAllowed(f.sim),false);assert.equal(f.run('take').ok,false);assert.equal(calls,1);
 const outgoing=f.sim;f.sim=new C.Simulation(f.saved);f.sim.briarOwnerLease=f.lease;f.sim.briarContext=f.ctx;A.syncScene(f.sim);
 assert.equal(B.saveAllowed(f.sim),true);assert.ok(f.run('take').duplicate);assert.equal(B.saveAllowed(outgoing),false);
});
