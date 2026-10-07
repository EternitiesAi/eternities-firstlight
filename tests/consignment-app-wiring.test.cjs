'use strict';
/* The exact installed parent fragment, no DOM/global app replacement. Boundaries
 * use actual Sim objects; roster edge specimens are explicit negative controls. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..'),C=require(path.join(ROOT,'src/core.js'));
function owner(){const sim=new C.Simulation(),resets=[],context={sim,rpg:null,characterStore:{active:'one',revision:0},RealmEarthConsignmentMotion:{reset(s,why){resets.push({s,why});},current(){return null;}},RealmEarthConsignmentArt:{reset(){}},RealmEarthConsignmentData:{ID:'earth-first-load-through-v1',ROOM:'world-earthlands',definition:Object.freeze({})},worldContext(){return{sim:context.sim,active:context.characterStore.active,revision:context.characterStore.revision};}};
 vm.createContext(context);vm.runInContext(require('./helpers/consignment-app-fragment.cjs')()+'\nglobalThis.API={syncConsignmentOwner,consignmentThreat,consignmentContext,consignmentControl,tickConsignment};',context);return{context,sim,api:context.API,resets};}
test('ordinary clock, camera, Store revision and menu pauses retain the exact app motion lease',()=>{
 const h=owner(),lease=h.api.syncConsignmentOwner();assert.ok(Object.isFrozen(lease));h.sim.state.settings.cameraMode='follow';h.sim.state.hour=9;h.context.characterStore.revision++;h.sim.paused=true;assert.equal(h.api.syncConsignmentOwner(),lease);assert.equal(h.resets.length,0);assert.equal(h.api.consignmentContext().revision,1);
});
test('real Sim, slot, trip, room and death owner changes revoke outgoing lease before adopting a new one',()=>{
 for(const change of[h=>h.context.sim=new C.Simulation(),h=>h.context.characterStore.active='two',h=>h.sim.worldTrip={active:'one',realm:'earthlands'},h=>h.sim.room='world-earthlands',h=>h.sim.state.adventure.deaths++]){const h=owner(),lease=h.api.syncConsignmentOwner();change(h);const next=h.api.syncConsignmentOwner();assert.notEqual(next,lease);assert.notEqual(h.sim.consignmentOwnerLease,lease);assert.equal(h.resets.length,1);assert.equal(h.resets[0].s,h.sim);}
});
test('explicit pre-import reset also revokes same-object runtime and stamps an empty opaque lease',()=>{
 const h=owner(),lease=h.api.syncConsignmentOwner();const next=h.api.syncConsignmentOwner(true);assert.notEqual(next,lease);assert.equal(Reflect.ownKeys(next).length,0);assert.equal(h.resets.length,1);
});
test('parent threat source requires the current actual roster and uses the full proposed motion segment',()=>{
 const h=owner(),q={from:{x:0,z:0},to:{x:20,z:0}};assert.equal(h.api.consignmentThreat(q).clear,false);h.sim.adventureRuntime={room:h.sim.room,enemies:[]};assert.equal(h.api.consignmentThreat(q).clear,true);
 h.sim.adventureRuntime.enemies=[{id:'negative-roster-edge',name:'test prowler',x:10,z:8.4,hp:2,kind:'skitter'}];assert.equal(h.api.consignmentThreat(q).clear,false);h.sim.adventureRuntime.enemies[0].z=8.6;assert.equal(h.api.consignmentThreat(q).clear,true);h.sim.adventureRuntime.enemies[0].z=0;h.sim.adventureRuntime.enemies[0].hp=0;assert.equal(h.api.consignmentThreat(q).clear,true);
 h.sim.adventureRuntime.enemies[0].hp=2;h.sim.adventureRuntime.enemies[0].hidden=true;assert.equal(h.api.consignmentThreat(q).clear,true);h.sim.adventureRuntime.room='other';assert.equal(h.api.consignmentThreat(q).clear,false);
});
test('bad query/actual living coordinates fail closed and unknown controls have no motion effect',()=>{
 const h=owner();h.sim.adventureRuntime={room:h.sim.room,enemies:[{hp:2,x:NaN,z:0}]};assert.equal(h.api.consignmentThreat({from:{x:0,z:0},to:{x:1,z:1}}).clear,false);assert.equal(h.api.consignmentThreat(null).clear,false);assert.equal(h.api.consignmentThreat({from:{x:0,z:NaN},to:{x:1,z:1}}).clear,false);assert.equal(h.api.consignmentControl('claim').ok,false);
});
test('expected death/dive skips motion and real owner reset clears its controller notice',()=>{
 const h=owner();let cleared=0;h.context.rpg={civic:{carrier:{reset(reason){assert.equal(reason,'owner');cleared++;}}}};h.sim.room='world-earthlands';h.sim.state.localLife.records['earth-first-load-through-v1']={accepted:true,claimed:false};h.api.syncConsignmentOwner();h.sim.state.adventure.hp=0;assert.doesNotThrow(()=>h.api.tickConsignment(.1));h.sim.worldDive={y:-1};h.api.tickConsignment(.1);assert.equal(cleared,1);
});
