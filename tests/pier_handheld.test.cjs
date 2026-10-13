'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/engine.js'),X=require('../src/creative.js');
const T=require('../src/traveler-art.js'),F=require('../src/pier-fishing.js'),Art=require('../src/pier-fishing-art.js');
const empty=()=>({box:[],round:[],octa:[],disc:[]}),distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const near=(a,b)=>assert.ok(distance(a,b)<2e-6,JSON.stringify([a,b]));
function owner(){
 const sim=new C.Simulation();sim.state.player={x:0,z:27,yaw:0};
 const ctx={sim,active:'synthetic-handheld',current:()=>({sim,active:'synthetic-handheld'})};
 const step=(n=1)=>{for(let i=0;i<n;i++){sim.tick(.05);F.tick(ctx);}};
 return{sim,ctx,step,view:()=>F.current(ctx),act:t=>F.command(ctx,t)};
}
function rendered(view,options={}){
 assert.equal(typeof Art.pose,'function','Actual fishing pose sampler required');
 const h=owner(),out=empty();h.sim.presentation={fishing:view};
 h.sim.state.settings.reducedMotion=!!options.reducedMotion;
 const fishing=Art.pose(view,!!options.reducedMotion),pose=T.pose({fishing,...options});
 const before=JSON.stringify({fishing,pose,view}),frame=T.draw(out,{x:0,z:27,base:1.3,yaw:options.yaw??.64},pose);
 Art.draw(out,h.sim,frame);assert.equal(JSON.stringify({fishing,pose,view}),before);return{out,frame,pose,parts:Object.values(out).flat()};
}
const view=(patch={})=>({phase:'playing',time:5,fightTime:1,reelTime:.2,tension:.4,progress:.2,reeling:true,pulling:true,...patch});

test('accepted reel time advances only on actual reeling ticks and survives no pause catch-up',()=>{
 const h=owner();h.act('cast');h.step(80);h.act('hook');
 assert.equal(h.view().reelTime,0);h.step(10);assert.equal(h.view().reelTime,0);
 h.act('reel');h.step(10);assert.ok(Math.abs(h.view().reelTime-.5)<1e-9);
 h.act('ease');const hold=h.view().reelTime;h.step(10);assert.equal(h.view().reelTime,hold);
 h.act('reel');h.sim.paused=true;h.step(10);assert.equal(h.view().reelTime,hold);
 h.sim.paused=false;h.sim.elapsed+=60;F.tick(h.ctx);assert.equal(h.view().reelTime,hold);
 h.act('cancel');assert.equal(h.view(),null);h.act('cast');assert.equal(h.view().reelTime,0);
});

test('hand-held cast and reel share actual solved arm anchors and never mutate a pose',()=>{
 for(const phase of ['waiting','bite','playing','caught','lost'])for(const reducedMotion of [false,true])for(const time of [0,.15,.3,.6,.85,5]){
  const r=rendered(view({phase,time,reelTime:time}),{reducedMotion});
  const grip=r.parts.find(p=>p.fishingPart==='rod-grip');assert.ok(grip,'Rod must be in hand, not a holder');
  assert.ok(!r.parts.some(p=>p.fishingPart==='rod-holder'));
  near(grip.p,E.M.transform(r.frame.root,r.frame.joints.rightHand));
  const handle=r.parts.find(p=>p.fishingPart==='reel-handle');assert.ok(handle);
  near(handle.p,E.M.transform(r.frame.root,r.frame.joints.leftHand));
  for(const side of ['left','right']){
   assert.ok(Math.abs(distance(r.pose.joints[side+'Shoulder'],r.pose.joints[side+'Elbow'])-.305)<1e-6);
   assert.ok(Math.abs(distance(r.pose.joints[side+'Elbow'],r.pose.joints[side+'Hand'])-.285)<1e-6);
  }
  for(const p of r.parts){assert.ok(p.p.every(Number.isFinite));if(p.m)assert.ok(Array.from(p.m).every(Number.isFinite));}
 }
});

test('the reel hand moves with accepted turns, holds while eased, and reduces to a stable stance',()=>{
 const a=rendered(view({reelTime:0})),b=rendered(view({reelTime:.22}));
 assert.ok(distance(a.frame.joints.leftHand,b.frame.joints.leftHand)>.035);
 near(a.frame.joints.rightHand,b.frame.joints.rightHand);
 const hold=rendered(view({reeling:false,reelTime:.22}));near(b.frame.joints.leftHand,hold.frame.joints.leftHand);
 const reducedA=rendered(view({time:5,reelTime:0}),{reducedMotion:true}),reducedB=rendered(view({time:99,reelTime:20}),{reducedMotion:true});
 near(reducedA.frame.joints.leftHand,reducedB.frame.joints.leftHand);
 near(reducedA.frame.joints.rightHand,reducedB.frame.joints.rightHand);
});

test('cast anticipation visibly changes the rod, lands the float outboard, and leaves feet anchored',()=>{
 const samples=[0,.25,.55,.85].map(time=>rendered(view({phase:'waiting',time})));
 assert.ok(distance(samples[1].frame.fishing.axis,samples[3].frame.fishing.axis)>.5);
 for(const s of samples)for(const name of ['leftFoot','rightFoot','leftHip','rightHip'])near(s.frame.joints[name],samples[0].frame.joints[name]);
 const float=samples[3].parts.find(p=>p.fishingPart==='float');assert.ok(float.p[0]>2.5);
 assert.equal(C.walkable(float.p[0],float.p[2],null,.31),false);
});

test('combat and swimming retain arms and cannot draw a borrowed rod from stale presentation',()=>{
 for(const options of [{combatScene:true,style:'blade'},{combatScene:true,style:'bow'},{swimming:true}]){
  const r=rendered(view(),options),expected=T.pose(options);
  assert.equal(r.frame.fishing,null);near(r.pose.joints.leftHand,expected.joints.leftHand);near(r.pose.joints.rightHand,expected.joints.rightHand);
  assert.ok(!r.parts.some(p=>p.fishingPart));
 }
});

test('the entire intermediate cast keeps its rod outside the head in every facing',()=>{
 for(const yaw of [0,.8,1.6,2.4,-2.4,-1.6,-.8])for(let i=0;i<=100;i++){
  const r=rendered(view({phase:'waiting',time:i*.0085}),{yaw}),head=E.M.transform(r.frame.root,r.frame.joints.head);
  for(const p of r.parts.filter(p=>['rod-grip','rod-lower','rod-tip'].includes(p.fishingPart))){
   const [a,b]=p.segment,d=b.map((n,j)=>n-a[j]),u=Math.max(0,Math.min(1,d.reduce((n,x,j)=>n+x*(head[j]-a[j]),0)/d.reduce((n,x)=>n+x*x,0)));
   assert.ok(distance(head,a.map((n,j)=>n+d[j]*u))>.19+Math.SQRT2*p.s[0]/2,'Head sphere and rod radius must stay separated at '+i);
  }
 }
});

test('both authored hand targets remain reachable throughout casting and every crank phase',()=>{
 for(let i=0;i<=100;i++)for(const phase of ['waiting','playing']){
  const f=Art.pose(view({phase,time:i*.0085,reelTime:i*Math.PI/350})),p=T.pose({fishing:f});
  near(p.joints.rightHand,f.right);near(p.joints.leftHand,f.left);
 }
});

test('grip acquisition keeps the lower rod beside the body rather than sweeping a low full-length pole',()=>{
 const f=Art.pose(view({phase:'waiting',time:0,reelTime:0}));
 assert.ok(f.axis[1]>.9,'The acquired rod is upright before turning toward water');
 for(let n=0;n<=100;n++){
  const p=f.right.map((v,i)=>v+f.axis[i]*1.95*n/100);
  if(p[1]<1.4)assert.ok(Math.hypot(p[0],p[2])<.65,'Low rod stays inside the immediate body envelope');
 }
});

test('displayed fishing facing enters and exits continuously on accepted time without stale catch-up',()=>{
 const input={view:view({phase:'waiting',time:0}),yaw:-2.5,x:0,z:27,time:10,paused:false,reducedMotion:false};
 let p=Art.facing(null,input);assert.equal(p.yaw,input.yaw);
 const next=Art.facing(p,{...input,view:{...input.view,time:.05},time:10.05});assert.ok(Math.abs(next.yaw-p.yaw)>.01);assert.ok(Math.abs(next.yaw-p.yaw)<1.5);
 const frozen=Art.facing(next,{...input,view:{...input.view,time:.05},time:20});assert.equal(frozen.yaw,next.yaw,'Menus freeze accepted fish time');
 const paused=Art.facing(next,{...input,view:{...input.view,time:.1},time:10.1,paused:true});assert.equal(paused.yaw,next.yaw);
 const exit=Art.facing(next,{...input,view:null,time:10.05});assert.equal(exit.yaw,next.yaw,'Cancel/release starts from the displayed root');
 const easing=Art.facing(exit,{...input,view:null,time:10.1});assert.ok(Math.abs(easing.yaw-input.yaw)<Math.abs(exit.yaw-input.yaw));
 const gap=Art.facing(easing,{...input,view:null,time:99});assert.equal(gap.yaw,easing.yaw);
 assert.equal(Art.facing(null,{...input,view:null}),null,'New owner inherits no transition');
 assert.ok(Math.abs(Art.facing(p,{...input,reducedMotion:true}).yaw-Math.atan2(3,4.2))<1e-12);
});

test('actual WorldArt submits the held rod once, stows blade/bow, and preserves physical facing and state',()=>{
 require('../src/combat.js');require('../src/arsenal.js');require('../src/pursuit.js');require('../src/starter.js');require('../src/realm-craft.js');require('../src/traveler-equipment-art.js');require('../src/world.js');
 const W=globalThis.RealmArt.WorldArt;
 const earned=require('./briar_outing_journey.cjs').earlyRescue();
 for(const input of Object.values(earned))for(const yaw of [0,.8,2.4,-2]){
  const sim=new C.Simulation(input.world,{hydrated:true}),out=empty(),art=Object.create(W.prototype);art.room=null;
  assert.ok(sim.moveTo(0,27).ok);for(let i=0;i<1500&&sim.playerPath.length;i++)sim.tick(.05);
  // Facing variants are labelled synthetic geometry probes after command-earned progression.
  sim.state.player.yaw=yaw;const ctx={sim,active:'earned-geometry',current:()=>({sim,active:'earned-geometry'})};assert.ok(F.command(ctx,'cast').ok);
  sim.presentation={fishing:F.current(ctx)};const before=JSON.stringify(sim.snapshot());art.traveler(out,sim);
  assert.equal(JSON.stringify(sim.snapshot()),before);const snap=art.travelerSnapshot();
  assert.equal(snap.parts.filter(p=>p.fishingPart==='rod-grip').length,1);assert.equal(snap.frame.fishing.phase,'waiting');
  assert.ok(snap.parts.some(p=>p.weaponPart));assert.equal(snap.frame.combatScene,false);
  near(snap.parts.find(p=>p.fishingPart==='rod-grip').p,E.M.transform(snap.frame.root,snap.frame.joints.rightHand));
  F.command(ctx,'cancel');sim.presentation.fishing=F.current(ctx);art.traveler(empty(),sim);
  assert.equal(art.travelerSnapshot().frame.fishing,null);assert.ok(!art.travelerSnapshot().parts.some(p=>p.fishingPart));
  art.e={clear(){}};art.travelerFishingOwner={sim};art.travelerFishingFacing={yaw:2};art.begin(null);
  assert.equal(art.travelerFishingOwner,null,'Same-scene generation clears prior activity ownership');assert.equal(art.travelerFishingFacing,null);
 }
});
