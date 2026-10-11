'use strict';
// Actual Core/Combat/WorldArt/rig/equipment CPU composition; physical anchors and
// bow ownership are labelled synthetic test boundaries. No RAF/GPU/save claim.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const ART=path.resolve(process.env.COMBAT_WITHDRAWAL_STAGE||ROOT);
const load=n=>require(path.join(ROOT,'src',n));
const C=load('core.js'),A=load('adventure.js'),T=load('combat.js'),E=load('engine.js');
load('creative.js');load('world-foundations.js');
const Rig=require(path.join(ART,'src/traveler-art.js'));load('traveler-equipment-art.js');
vm.runInThisContext(fs.readFileSync(path.join(ART,'src/world.js'),'utf8'),{filename:path.join(ART,'src/world.js')});
const World=globalThis.RealmArt.WorldArt,empty=()=>({box:[],round:[],octa:[],disc:[]});
let serial=0;
const act=(s,t,p={})=>{const result=s.adventureCommand('withdraw-'+(++serial),t,p);assert.ok(result.ok,result.error);return result;};
function setup(bow=false){
 const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};act(sim,'start');
 if(bow){sim.state.adventure.owned.push('trail_bow');act(sim,'equip',{id:'trail_bow'});}
 sim.state.player={x:15,z:7,yaw:0};act(sim,'starter-enter');sim.state.player={x:-5,z:11.5,yaw:0};
 act(sim,'target-select',{id:'river-practice'});act(sim,'auto-toggle');
 const art=Object.create(World.prototype);art.room=sim.room;
 return {sim,art,enemy:A.runtime(sim).enemies.find(e=>e.id==='river-practice')};
}
function draw(f){const out=empty();f.art.traveler(out,f.sim);return{frame:f.art.travelerFrame,parts:Object.values(out).flat()};}
function observe(f){for(let i=0;i<10;i++){f.sim.tick(.01);draw(f);}assert.equal(T.pose(f.sim).phase,'anticipate');return draw(f);}
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const footKeys=['hip','pelvis','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle','leftFoot','rightFoot'];
for(const bow of [false,true])test((bow?'bow':'blade')+' cancelled actual windup lowers continuously without a release or confirmed hit',t=>{
 const f=setup(bow),before=observe(f),p={...f.sim.state.player};
 act(f.sim,'auto-toggle');const bytes=JSON.stringify(f.sim.snapshot()),tactics=JSON.stringify(T.runtime(f.sim)),after=draw(f);
 t.diagnostic(JSON.stringify({style:bow?'bow':'blade',cancelledHandDisplacement:distance(after.frame.joints.rightHand,before.frame.joints.rightHand),hits:T.runtime(f.sim).hits.length}));
 assert.equal(T.pose(f.sim).phase,'idle');assert.equal(after.frame.combatPhase,'withdraw');
 assert.ok(distance(after.frame.joints.rightHand,before.frame.joints.rightHand)<1e-6,'cancel hand must not snap to ready');
 assert.equal(JSON.stringify(f.sim.snapshot()),bytes);assert.equal(JSON.stringify(T.runtime(f.sim)),tactics);
 assert.equal(T.runtime(f.sim).hits.length,0);assert.equal(T.runtime(f.sim).motion,undefined);assert.equal(f.enemy.hitAt,undefined);
 assert.ok(!after.parts.some(p=>p.weaponPart==='nocked-shaft'),'withdrawal is not an armed shot');
 const start=after.frame;let previous=start,maximumStep=0;
 for(let i=0;i<11;i++){f.sim.tick(.01);const current=draw(f).frame;maximumStep=Math.max(maximumStep,distance(current.joints.rightHand,previous.joints.rightHand));previous=current;assert.equal(T.runtime(f.sim).hits.length,0);}
 assert.equal(previous.combatPhase,'idle');assert.ok(maximumStep<.09,'bounded lowering step: '+maximumStep);
 assert.equal(f.sim.state.player.x,p.x);assert.equal(f.sim.state.player.z,p.z);assert.equal(f.sim.state.player.yaw,p.yaw);
 assert.equal(A.runtime(f.sim).cooldowns.attack,0);assert.equal(T.runtime(f.sim).windup,null);
 for(const key of footKeys)assert.ok(distance(start.joints[key],previous.joints[key])<.001,'feet must stay in their existing stance');
});
test('real out-of-range cancellation lowers, while a never-observed blocked attempt creates no pose or success feedback',()=>{
 const f=setup();observe(f);f.sim.state.player.x=7;f.sim.tick(.01);
 assert.equal(T.runtime(f.sim).windup,null);assert.equal(draw(f).frame.combatPhase,'withdraw');assert.equal(T.runtime(f.sim).hits.length,0);
 const blocked=setup(true);T.stop(blocked.sim);blocked.sim.state.player={x:-1,z:3,yaw:Math.PI};blocked.enemy.x=-1;blocked.enemy.z=-2;
 const result=blocked.sim.adventureCommand('withdraw-blocked-'+(++serial),'attack',{target:blocked.enemy.id});
 assert.equal(result.ok,false);assert.equal(draw(blocked).frame.combatPhase,'idle');
 assert.equal(T.runtime(blocked.sim).hits.length,0);assert.equal(blocked.enemy.hitAt,undefined);
});
test('accepted shot which later misses keeps ordinary release and never borrows cancellation or hit feedback',()=>{
 const f=setup(true);T.stop(f.sim);f.sim.state.player.z=14;
 act(f.sim,'attack',{target:f.enemy.id});const released=draw(f);
 assert.equal(released.frame.combatPhase,'recover');assert.equal(released.frame.releaseOrigin,'ready');
 f.enemy.x=-8;for(let i=0;i<100;i++)f.sim.tick(.01);
 assert.equal(T.runtime(f.sim).hits.length,0);assert.equal(f.enemy.hitAt,undefined);assert.equal(draw(f).frame.combatPhase,'idle');
});
test('actual accepted queued impact takes priority and preserves original recovery/confirmed event ownership',()=>{
 const f=setup();observe(f);for(let i=0;i<4;i++){f.sim.tick(.01);draw(f);}
 assert.equal(T.pose(f.sim).phase,'recover');assert.equal(draw(f).frame.combatPhase,'recover');
 assert.equal(T.runtime(f.sim).hits.length,1);assert.equal(f.enemy.hitAt,T.runtime(f.sim).hits[0].at);
 assert.equal(f.art.travelerPoseOwner.withdrawal,null);
});
test('pause/repeated draws freeze an existing withdrawal; reduced motion, guard and death suppress it',()=>{
 const f=setup();observe(f);act(f.sim,'auto-toggle');f.sim.tick(.02);draw(f);f.sim.paused=true;
 const before=draw(f),snapshot=JSON.stringify(f.sim.snapshot());for(let i=0;i<4;i++)f.sim.tick(.05);
 assert.deepEqual(draw(f),before);assert.equal(JSON.stringify(f.sim.snapshot()),snapshot);
 for(const boundary of ['reduced','guard','death']){
  const f=setup();observe(f);
  if(boundary==='reduced')f.sim.state.settings.reducedMotion=true;
  if(boundary==='guard')act(f.sim,'guard');
  if(boundary==='death')f.sim.state.adventure.hp=0;
  T.stop(f.sim);assert.notEqual(draw(f).frame.combatPhase,'withdraw',boundary);
  assert.equal(T.runtime(f.sim).hits.length,0);
 }
});
test('simulation, scene, equipment epoch and stale clocks cannot replay a prior preparation',()=>{
 for(const boundary of ['simulation','scene','equip','clock-back','clock-gap']){
  const f=setup();observe(f);act(f.sim,'auto-toggle');
  if(boundary==='simulation'){const other=setup();T.stop(other.sim);f.sim=other.sim;}
  if(boundary==='scene'){f.art.room='mine';f.sim.room='mine';A.syncScene(f.sim);}
  if(boundary==='equip')act(f.sim,'equip',{id:'trail_blade'});
  if(boundary==='clock-back')f.sim.state.adventure.elapsed-=.05;
  if(boundary==='clock-gap')f.sim.state.adventure.elapsed+=.2;
  assert.notEqual(draw(f).frame.combatPhase,'withdraw',boundary);
 }
});
test('pure withdrawal retraces only anticipation with unchanged feet, attachments and geometry budget in both camera-independent roots',()=>{
 for(const style of ['blade','bow'])for(const from of [0,.25,.7,1])for(const progress of [0,.25,.6,1]){
  const pose=Rig.pose({style,combatScene:true,combatPhase:'withdraw',withdrawFrom:from,combatProgress:progress,reducedMotion:false});
  const sim=setup(style==='bow').sim;
  const reverse=from*(1-progress*progress*(3-2*progress));
  const prior=Rig.pose({style,combatScene:true,combatPhase:'anticipate',combatProgress:reverse});
  assert.deepEqual(pose.joints,prior.joints);assert.deepEqual(pose.bladeAxis,prior.bladeAxis);
  for(const yaw of [0,.8,Math.PI]){
   const out=empty(),frame=Rig.draw(out,{x:0,z:0,base:1.57,yaw},pose);
   globalThis.RealmTravelerEquipmentArt.draw(out,sim,frame);
   const parts=Object.values(out).flat();assert.ok(parts.length<=79);
   // Actual dynamic batches opt in to camera solids. Standalone solidBounds
   // defaults to static geometry, so test the real updateBatch consumer.
   for(const p of parts){assert.notEqual(p.cameraSolid,true);if(p.m)assert.ok(Array.from(p.m).every(Number.isFinite));}
   const transport={gl:{ARRAY_BUFFER:1,DYNAMIC_DRAW:2,bindBuffer(){},bufferData(){}}};
   for(const [kind,items] of Object.entries(out)){
    const batch={kind,items,dynamic:true,buf:null};
    E.Engine.prototype.updateBatch.call(transport,batch);
    assert.deepEqual(batch.cameraSolids,[]);
   }
  }
 }
});
