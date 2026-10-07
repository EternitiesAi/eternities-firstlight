'use strict';
/* Portable focused UI feedback checks. Install this candidate in repository
 * tests/. Original history is repository-command-earned; initial work-point
 * placement, saver, lease issuer, threat predicate and DOM-shaped controls are
 * labelled CPU boundary specimens. Retreat/catchup/transport use actual Core
 * manual/tick and Motion.update. No native/rendered or human-feel claim. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js'));
const D=require(path.join(ROOT,'src/earth-consignment-data.js'));
require(path.join(ROOT,'src/local-life.js'));require(path.join(ROOT,'src/earth-consignment.js'));
const M=require(path.join(ROOT,'src/earth-consignment-motion.js')),L=globalThis.RealmLocalLife,U=require(path.join(ROOT,'src/earth-consignment-ui.js'));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),control=kind=>({dataset:{rpg:'consignment-'+kind,job:D.ID,id:''}});
function harness(){
 const source=require(path.join(ROOT,'tests/helpers/consignment-fixtures.cjs')).load('fresh-blade'),sim=new C.Simulation(source),base={sim,active:'tracker-boundary-owner',revision:0};
 const invitation=W.preview(base,'earthlands');assert.ok(invitation.ok);assert.ok(W.enter(invitation.ticket,base,{save:()=>({ok:true}),build:()=>{}}).ok);
 // Same explicitly labelled initial supported work-point specimen as the
 // existing installed UI suite; no saved progress or arrival is manufactured.
 sim.state.player.x=-106;sim.state.player.z=-105;sim.consignmentOwnerLease=Object.freeze({});sim.paused=true;
 let revision=0,writes=0,threat=()=>({clear:true});const ctx=()=>({sim,active:base.active,revision,ownerLease:sim.consignmentOwnerLease,definition:D.definition,threat});
 const rpg={sim,civic:{},close(){sim.paused=false;},paint(){},open(){sim.paused=true;},api:{consignmentContext:ctx,toast(){},localLifeCommand(type,payload){return L.command(ctx(),type,payload,{save(){revision++;writes++;return{ok:true};}});},consignmentControl(type){return M[type==='continue'?'continue':'wait'](ctx());}}};
 const ui=new U.ConsignmentUI(rpg);ui.action({dataset:{rpg:'consignment-accept',job:D.ID,id:'south-stormfall'}});assert.equal(sim.state.localLife.records[D.ID].accepted,true);
 const tick=()=>{sim.tick(.1);const result=M.update(ctx(),.1);assert.ok(result.ok,result.error);return result.view;};
 const move=(dx,dz)=>{sim.manual(dx,dz,.1);return tick();};
 const begin=()=>{ui.action(control('continue'));const v=M.current(ctx());assert.equal(v.status,'moving');return v;};
 function far(){begin();let v=M.current(ctx());for(let i=0;i<80&&v.reason!=='player-far';i++)v=move(-1,0);assert.equal(v.status,'waiting');assert.equal(v.reason,'player-far');assert.ok(distance(sim.state.player,v)>10);assert.ok(v.distanceTraveled>0);return v;}
 function catchup(){let v=M.current(ctx());for(let i=0;i<200&&distance(sim.state.player,v)>1.5;i++)v=move(v.x-sim.state.player.x,v.z-sim.state.player.z);assert.ok(distance(sim.state.player,v)<=1.5);assert.equal(v.status,'waiting');return v;}
 function ready(){begin();let v=M.current(ctx());for(let i=0;i<2000&&!v.ready;i++){if(distance(sim.state.player,v)>.5)sim.manual(v.x-sim.state.player.x,v.z-sim.state.player.z,.1);v=tick();}assert.ok(v.ready,'real first-leg supported transport');return v;}
 return{sim,ctx,ui,tick,begin,far,catchup,ready,get writes(){return writes;},setThreat:f=>{threat=f;}};
}
test('actual moving carrier auto-waits after real retreat; far tracker tells catchup and deliberate Continue',()=>{
 const h=harness(),v=h.far(),record=JSON.stringify(h.sim.state.localLife),writes=h.writes;
 assert.ok(M.isProjection(v,h.ctx()));assert.equal(h.ui.tracker().detail,'Carrier waiting · catch up to the load, then E · deliberately choose Continue');
 assert.equal(JSON.stringify(h.sim.state.localLife),record);assert.equal(h.writes,writes);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);
});
test('actual catchup keeps the carrier waiting and requires the existing deliberate Continue control',()=>{
 const h=harness(),far=h.far(),position={x:far.x,z:far.z},distanceBefore=far.distanceTraveled,writes=h.writes;const near=h.catchup();
 assert.equal(distance(near,position),0);assert.equal(near.distanceTraveled,distanceBefore);assert.equal(near.reason,'player-far');
 assert.equal(h.ui.tracker().detail,'Carrier waiting · E · deliberately choose Continue');h.sim.paused=true;
 assert.equal(h.ui.tracker().detail,'Carrier waiting · E · deliberately choose Continue');h.ui.action(control('continue'));
 assert.equal(M.current(h.ctx()).status,'moving');assert.equal(h.writes,writes);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);
 const later=h.tick();assert.ok(later.distanceTraveled>distanceBefore);
});
test('default waiting, explicit Wait and moving tracker text remain exactly the existing messages',()=>{
 const h=harness();assert.equal(h.ui.tracker().detail,'E · continue at the supplied carrier');h.begin();assert.equal(h.ui.tracker().detail,'Stay nearby · Meadow road');
 h.ui.action(control('wait'));assert.equal(M.current(h.ctx()).reason,'waiting');assert.equal(h.ui.tracker().detail,'E · continue at the supplied carrier');
});
test('actual supported ready proof remains unpaid and keeps the existing record-arrival tracker text',()=>{
 const h=harness(),v=h.ready(),writes=h.writes;assert.ok(M.isProjection(v,h.ctx()));assert.equal(h.ui.tracker().detail,'E · record arrival at Meadow road');
 assert.equal(h.writes,writes);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);assert.equal(h.sim.state.localLife.records[D.ID].claimed,false);
});
test('actual motion threat block keeps the existing truthful blocked message',()=>{
 const h=harness();h.setThreat(()=>({clear:false,reason:'labelled CPU living threat'}));h.ui.action(control('continue'));const v=M.current(h.ctx());assert.equal(v.status,'blocked');
 assert.equal(h.ui.tracker().detail,'Carrier waiting · labelled CPU living threat');assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);
});
test('copied projection cannot display the new far-wait message, and a real new lease invalidates old views',()=>{
 const h=harness(),v=h.far(),real=globalThis.RealmEarthConsignmentMotion;
 try{globalThis.RealmEarthConsignmentMotion={...real,current(ctx){return JSON.parse(JSON.stringify(real.current(ctx)));}};assert.equal(h.ui.live(),null);assert.equal(h.ui.tracker().detail,'E · continue at the supplied carrier');}finally{globalThis.RealmEarthConsignmentMotion=real;}
 h.sim.consignmentOwnerLease=Object.freeze({});assert.equal(M.isProjection(v,h.ctx()),false);assert.equal(h.ui.tracker().detail,'E · continue at the supplied carrier');
});
