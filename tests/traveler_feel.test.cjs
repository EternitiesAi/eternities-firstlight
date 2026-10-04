'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),Combat=require('../src/combat.js');
const E=require('../src/engine.js'),T=require('../src/traveler-art.js'),Gear=require('../src/traveler-equipment-art.js');
const empty=()=>({box:[],round:[],octa:[],disc:[]}),items=out=>Object.values(out).flat();
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const near=(a,b,label,tolerance=2e-6)=>assert.ok(distance(Array.from(a),Array.from(b))<tolerance,`${label}: ${distance(Array.from(a),Array.from(b))}`);
// Actual submitted box bases, with conservative box bounds for the round head.
function overlaps(a,b){
 const dot=(x,y)=>x.reduce((n,v,i)=>n+v*y[i],0),cross=(x,y)=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
 const edges=p=>[0,4,8].map(i=>[p.m[i],p.m[i+1],p.m[i+2]].map(n=>n*(i===4&&p.weaponPart==='blade-tip'?.65:.5))),aa=edges(a),bb=edges(b),delta=a.p.map((v,i)=>v-b.p[i]);
 for(const raw of [...aa,...bb,...aa.flatMap(x=>bb.map(y=>cross(x,y)))]){
  const length=Math.hypot(...raw);if(length<1e-8)continue;const axis=raw.map(n=>n/length),radius=[...aa,...bb].reduce((n,v)=>n+Math.abs(dot(axis,v)),0);
  if(Math.abs(dot(axis,delta))>radius+1e-6)return false;
 }return true;
}
const sample=(style,combatPhase,combatProgress,options={})=>T.pose({style,combatScene:true,combatPhase,combatProgress,...options});
const feet=['leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle','leftFoot','rightFoot','hip','pelvis'];
let serial=0;
function command(sim,type,p={}){const result=sim.adventureCommand('traveler-feel-'+(++serial),type,p);assert.ok(result.ok,result.error);return result;}
function walk(sim,x,z){assert.ok(sim.moveTo(x,z).ok);for(let i=0;i<6000&&sim.playerPath.length;i++)sim.tick(.02);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.25);}
function earnedBlade(){const sim=new C.Simulation();walk(sim,11,9);command(sim,'start');return sim;}
function rendered(sim,pose,yaw=.6){const out=empty(),frame=T.draw(out,{x:2,z:8,base:1.57,yaw},pose);Gear.draw(out,sim,frame);return {out,frame,parts:items(out)};}

test('queued release joins the actual full windup pose, including submitted blade axis',()=>{
 const sim=earnedBlade();
 for(const style of ['blade','bow'])for(const reducedMotion of [false,true]){
  const options={reducedMotion},before=sample(style,'anticipate',1,options),after=sample(style,'recover',0,options);
  for(const key of Object.keys(before.joints))near(after.joints[key],before.joints[key],style+' '+key+' release boundary');
  assert.equal(after.releaseOrigin,'queued');
  if(style==='blade'){
   near(after.bladeAxis,before.bladeAxis,'blade axis boundary');
   const a=rendered(sim,before).parts.filter(p=>p.travelerPart==='equipment'),b=rendered(sim,after).parts.filter(p=>p.travelerPart==='equipment');
   assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)near(a[i].m,b[i].m,a[i].weaponPart+' submitted boundary');
  }
 }
});

test('direct accepted strikes start at ready and never fabricate a prior windup',()=>{
 for(const style of ['blade','bow'])for(const reducedMotion of [false,true]){
  const ready=sample(style,'idle',0,{reducedMotion}),release=sample(style,'recover',0,{reducedMotion,releaseOrigin:'ready'});
  for(const key of Object.keys(ready.joints))near(release.joints[key],ready.joints[key],style+' direct '+key);
  assert.equal(release.releaseOrigin,'ready');
  if(style==='blade')near(release.bladeAxis,ready.bladeAxis,'direct blade axis');
  const completed=sample(style,'recover',1,{reducedMotion,releaseOrigin:'ready'});
  for(const key of Object.keys(ready.joints))near(completed.joints[key],ready.joints[key],style+' recovered '+key);
 }
 assert.equal(sample('blade','recover',.1,{releaseOrigin:'invalid'}).releaseOrigin,'queued');
});

test('a bounded cut has intermediate poses and settles without a phase-boundary jump',()=>{
 const ready=sample('blade','idle',0);
 for(const releaseOrigin of ['ready','queued']){
  let previous=sample('blade','recover',0,{releaseOrigin}),maxStep=0,maxHandDistance=0;
  for(let i=1;i<=84;i++){
   const current=sample('blade','recover',i/84,{releaseOrigin});
   maxStep=Math.max(maxStep,distance(previous.joints.rightHand,current.joints.rightHand));
   maxHandDistance=Math.max(maxHandDistance,distance(ready.joints.rightHand,current.joints.rightHand));
   assert.ok(Object.values(current.joints).flat().every(Number.isFinite));
   assert.ok(current.bladeAxis.every(Number.isFinite));
   previous=current;
  }
  assert.ok(maxStep<.05,'sampled 3.33ms hand travel stays continuous: '+maxStep);
  assert.ok(maxHandDistance>.12,'a real accepted blade release has a readable cut');
  near(previous.joints.rightHand,ready.joints.rightHand,'final hand');near(previous.bladeAxis,ready.bladeAxis,'final blade axis');
 }
});

test('submitted blade basis has no arbitrary roll flips during its complete cut and settle',()=>{
 const sim=earnedBlade(),basis=(p,index)=>[p.m[index],p.m[index+1],p.m[index+2]].map(n=>n/Math.hypot(p.m[index],p.m[index+1],p.m[index+2]));
 for(const releaseOrigin of ['ready','queued'])for(const yaw of [0,.6,1.7]){
  let prior=null;
  for(let i=0;i<=84;i++){
   const p=sample('blade','recover',i/84,{releaseOrigin}),blade=rendered(sim,p,yaw).parts.find(p=>p.weaponPart==='blade');
   const current=[0,4,8].map(index=>basis(blade,index));
   if(prior)for(let axis=0;axis<3;axis++)assert.ok(current[axis].reduce((n,v,k)=>n+v*prior[axis][k],0)>.94,'actual rendered blade basis must not flip between 3.33ms samples');
   prior=current;
  }
 }
});

test('actual blade and tip volumes clear the conservative head bounds through the whole attack',()=>{
 const sim=earnedBlade();
 // Catalogue ownership below is a labelled synthetic geometry specimen, never an earned reward.
 for(const id of ['trail_blade','copper_blade','oren_sunblade','dawn_edge']){
  if(!sim.state.adventure.owned.includes(id))sim.state.adventure.owned.push(id);sim.state.adventure.equipment.weapon=id;
  for(const reducedMotion of [false,true])for(const releaseOrigin of ['ready','queued'])for(const combatPhase of ['anticipate','recover'])for(let i=0;i<=100;i++){
   const p=sample('blade',combatPhase,i/100,{releaseOrigin,reducedMotion}),r=rendered(sim,p),head=r.out.round.find(p=>p.travelerPart==='head');
   for(const part of r.parts.filter(p=>['blade','blade-tip'].includes(p.weaponPart)))assert.equal(overlaps(part,head),false,`${id} ${releaseOrigin} ${combatPhase} ${i/100} ${part.weaponPart} crosses the head`);
  }
 }
});

test('body balance is visible above fixed physical feet and quiet in reduced motion',()=>{
 for(const style of ['none','blade','bow'])for(const walking of [false,true])for(const reducedMotion of [false,true]){
  const options={phase:1.1,blend:walking?.8:0,time:0,reducedMotion},ready=sample(style,'idle',0,options);
  for(const releaseOrigin of ['ready','queued'])for(const combatPhase of ['anticipate','recover'])for(let i=0;i<=20;i++){
   const p=sample(style,combatPhase,i/20,{...options,releaseOrigin});
   for(const key of feet)near(p.joints[key],ready.joints[key],key+' is independent of attack presentation');
   assert.ok(Math.abs(p.upperBody.yaw)<=.20&&Math.abs(p.upperBody.lean)<=.08);
   if(reducedMotion||style==='none')assert.deepEqual(p.upperBody,ready.upperBody);
  }
 }
 const ready=sample('blade','idle',0),prepared=sample('blade','anticipate',1);
 const shoulderLine=p=>p.joints.rightShoulder.map((v,i)=>v-p.joints.leftShoulder[i]);
 assert.ok(distance(shoulderLine(ready),shoulderLine(prepared))>.05,'shoulder line actually loads the strike');
 const a=empty(),b=empty();T.draw(a,{},ready);T.draw(b,{},prepared);
 assert.notDeepEqual(a.round.find(p=>p.travelerPart==='jacket-chest').m,b.round.find(p=>p.travelerPart==='jacket-chest').m,'rendered coat follows the joint body balance');
});

test('reduced motion bounds the blade hand cue and suppresses secondary equipment/body sweep',()=>{
 const ready=sample('blade','idle',0,{reducedMotion:true});
 for(const releaseOrigin of ['ready','queued'])for(const combatPhase of ['anticipate','recover'])for(let i=0;i<=50;i++){
  const p=sample('blade',combatPhase,i/50,{releaseOrigin,reducedMotion:true});
  assert.ok(distance(p.joints.rightHand,ready.joints.rightHand)<=.12,'reduced-motion blade cue is modest');
  near(p.bladeAxis,ready.bladeAxis,'quiet blade direction');
  assert.deepEqual(p.upperBody,ready.upperBody);
 }
 const drawn=sample('bow','anticipate',1,{reducedMotion:true}),released=sample('bow','recover',0,{reducedMotion:true});
 near(drawn.joints.rightHand,released.joints.rightHand,'essential bow draw joins its release');
 assert.ok(drawn.joints.rightHand[2]<ready.joints.rightHand[2],'the actual drawing hand remains legible');
});

test('guard and swim override both release origins without adding a second attack pose',()=>{
 for(const style of ['blade','bow','none'])for(const reducedMotion of [false,true])for(const override of [{guarded:true},{swimming:true}]){
  const ready=sample(style,'idle',0,{...override,reducedMotion,time:.7});
  for(const releaseOrigin of ['ready','queued'])for(const combatPhase of ['anticipate','recover'])for(const combatProgress of [0,.4,1]){
   const p=sample(style,combatPhase,combatProgress,{...override,reducedMotion,time:.7,releaseOrigin});
   assert.deepEqual(p.joints,ready.joints);assert.deepEqual(p.upperBody,ready.upperBody);
   if(style==='blade')near(p.bladeAxis,ready.bladeAxis,'override blade axis');
  }
 }
});

test('rendered palms, balanced torso and canonical gear share one frame through actual world yaw',()=>{
 const sim=earnedBlade(),saved=JSON.stringify(sim.snapshot());
 for(const releaseOrigin of ['ready','queued'])for(const yaw of [0,.6,1.7,Math.PI])for(const combatPhase of ['anticipate','recover'])for(const combatProgress of [0,.2,.4,.7,1]){
  const p=sample('blade',combatPhase,combatProgress,{releaseOrigin}),{out,frame,parts}=rendered(sim,p,yaw);
  near(frame.bladeAxis,p.bladeAxis,'copied equipment axis');assert.equal(frame.releaseOrigin,releaseOrigin);
  const grip=parts.find(p=>p.weaponPart==='grip');near(grip.p,E.M.transform(frame.root,p.joints.rightHand),'rendered grip at actual palm');
  const head=out.round.find(p=>p.travelerPart==='head');near(head.p,E.M.transform(frame.root,p.joints.head),'submitted head follows upper body');
  assert.equal(out.box.some(p=>p.travelerPart==='ground-marker'),false);near(out.disc.find(p=>p.travelerPart==='ground-marker').p,[2,1.583,8],'physical ground marker');
  assert.equal(parts.filter(p=>p.travelerPart!=='equipment').length,49);assert.ok(parts.filter(p=>p.travelerPart==='equipment').length<40);
  for(const part of parts)assert.ok(Array.from(part.m).every(Number.isFinite));
 }
 assert.equal(JSON.stringify(sim.snapshot()),saved,'presentation cannot change canonical progression');
});

test('carried gear and the held blade sheath remain outside the accepted-release curves',()=>{
 const sim=earnedBlade(),ready=sample('blade','idle',0),base=rendered(sim,ready).parts.filter(p=>p.weaponPart?.startsWith('scabbard')||p.weaponPart==='sheath-hanger');
 for(const releaseOrigin of ['ready','queued'])for(const combatPhase of ['anticipate','recover'])for(const combatProgress of [0,.2,.5,.9,1]){
  const r=rendered(sim,sample('blade',combatPhase,combatProgress,{releaseOrigin}));
  assert.deepEqual(r.parts.filter(p=>p.weaponPart?.startsWith('scabbard')||p.weaponPart==='sheath-hanger'),base,'the hip sheath does not borrow the held blade basis');
 }
 for(const id of ['trail_blade','trail_bow']){
  // Synthetic bow ownership is exhaustive carry projection coverage only.
  if(!sim.state.adventure.owned.includes(id))sim.state.adventure.owned.push(id);sim.state.adventure.equipment.weapon=id;
  const style=id==='trail_bow'?'bow':'blade',rest=rendered(sim,T.pose({style})).parts.filter(p=>p.travelerPart==='equipment');
  for(const combatPhase of ['anticipate','recover'])for(const releaseOrigin of ['ready','queued']){
   const r=rendered(sim,T.pose({style,combatPhase,combatProgress:.5,releaseOrigin}));
   assert.deepEqual(r.parts.filter(p=>p.travelerPart==='equipment'),rest,'travel cannot show a combat release');
  }
 }
});

test('production autoattack still uses its real queued epoch and accepted manual attack has no fake anticipation',()=>{
 const sim=earnedBlade();walk(sim,15,7);command(sim,'starter-enter');walk(sim,-5,11.5);command(sim,'target-select',{id:'river-practice'});command(sim,'auto-toggle');
 const beforePlayer={...sim.state.player},times=[];let last=0,sawWindup=false;
 for(let i=0;i<150;i++){
  sim.tick(.01);const projected=Combat.pose(sim),runtime=Combat.runtime(sim);
  if(projected.phase==='anticipate'){
   sawWindup=true;assert.ok(runtime.windup&&runtime.windup.impactAt>=sim.state.adventure.elapsed);assert.ok(Math.abs(runtime.windup.impactAt-runtime.windup.started-.12)<1e-9);
  }
  const hit=runtime.hits.at(-1);if(hit&&hit.id!==last){times.push(hit.at);last=hit.id;assert.equal(projected.phase,'recover');}
 }
 assert.ok(sawWindup&&times.length>=3);for(let i=1;i<times.length;i++)assert.ok(Math.abs(times[i]-times[i-1]-.52)<.025);
 assert.equal(sim.state.player.x,beforePlayer.x);assert.equal(sim.state.player.z,beforePlayer.z);
 Combat.stop(sim);while(sim.state.adventure.elapsed<A.runtime(sim).cooldowns.attack)sim.tick(.01);
 command(sim,'attack',{target:'river-practice'});assert.equal(Combat.runtime(sim).windup,null);
 const direct=sample('blade','recover',0,{releaseOrigin:'ready'}),ready=sample('blade','idle',0);near(direct.joints.rightHand,ready.joints.rightHand,'direct release pose');
});
