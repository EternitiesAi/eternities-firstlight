'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/engine.js'),T=require('../src/traveler-art.js'),B=require('../src/earth-expedition-beast-art.js'),C=require('../src/core.js');
const Gear=require('../src/traveler-equipment-art.js');
const empty=()=>({box:[],round:[],octa:[],disc:[]});
test('a brute with real displacement has alternating lifted and planted hooves',()=>{
 const a=B.pose({mode:'chase',phase:0,blend:1}),b=B.pose({mode:'chase',phase:Math.PI/2,blend:1});assert.notDeepEqual(a.legs.leftFront.foot,b.legs.leftFront.foot);
 assert.equal(a.legs.leftFront.foot[1],.065);assert.ok(a.legs.rightFront.foot[1]>.065);assert.equal(a.legs.rightRear.foot[1],.065);
 const fixed=B.pose({mode:'chase',phase:2,blend:0});assert.equal(fixed.legs.leftFront.foot[1],.065);assert.equal(fixed.legs.rightFront.foot[1],.065);
 for(const mode of['windup','recover'])assert.equal(B.pose({mode,phase:1,blend:1,timer:.4}).legs.rightFront.foot[1],.065);
});
test('brute hooves follow the actual animated leg endpoints without changing its world',()=>{
 for(const phase of[0,.7,1.4,3.1]){const p=B.pose({mode:'chase',phase,blend:1}),parts=B.parts({x:0,z:0,base:1.57,yaw:0,mode:'chase',phase,blend:1});for(const[id,l]of Object.entries(p.legs)){const hoof=parts.find(p=>p.expeditionBeastPart===id+'-hoof');assert.ok(Math.abs(hoof.p[1]-(1.57+l.foot[1]-.02))<1e-7);}}
});
test('traveler cloth, skin and leather retain distinct physical material responses',()=>{
 const out=empty();T.draw(out,{x:0,z:0,base:1.57,yaw:0},T.pose());const all=Object.values(out).flat(),head=all.find(p=>p.travelerPart==='head'),boot=all.find(p=>p.travelerPart==='left-boot'),coat=all.find(p=>p.travelerPart==='jacket-chest');assert.ok(head.rough<boot.rough&&boot.rough<coat.rough);assert.equal(all.length,49);assert.ok(out.round.some(p=>p.travelerPart==='left-forearm'));
});
test('only real bow anticipation carries a visible nocked shaft, removed on release',()=>{
 const sim=new C.Simulation();sim.state.adventure.started=true;sim.state.adventure.owned.push('trail_bow');sim.state.adventure.equipment.weapon='trail_bow';const before=sim.snapshot();
 for(const phase of['idle','anticipate','recover']){const out=empty(),pose=T.pose({style:'bow',combatScene:true,combatPhase:phase,combatProgress:.8}),frame=T.draw(out,{x:0,z:0,base:1.57,yaw:0},pose);Gear.draw(out,sim,frame);const nocks=Object.values(out).flat().filter(p=>p.weaponPart==='nocked-shaft');assert.equal(nocks.length,phase==='anticipate'?1:0);assert.deepEqual(sim.snapshot(),before);if(nocks.length){const p=nocks[0];assert.ok(p.s[1]>.4);assert.equal(p.decorative,true);}}
});
test('bow grip, string nock and anticipated shaft face the actual root shot direction',()=>{
 const sim=new C.Simulation();sim.state.adventure.started=true;sim.state.adventure.owned.push('trail_bow');sim.state.adventure.equipment.weapon='trail_bow';
 for(const guarded of[false,true])for(const reducedMotion of[false,true])for(const progress of[0,.25,.5,.75,1])for(const yaw of[0,.7,Math.PI]){
  const out=empty(),pose=T.pose({style:'bow',combatScene:true,combatPhase:'anticipate',combatProgress:progress,reducedMotion,guarded}),frame=T.draw(out,{x:4,z:9,base:1.57,yaw},pose);Gear.draw(out,sim,frame);
  const shaft=Object.values(out).flat().find(p=>p.weaponPart==='nocked-shaft'),a=E.M.transform(shaft.m,[0,-.5,0]),b=E.M.transform(shaft.m,[0,.5,0]);
  const nock=E.M.transform(frame.root,frame.joints.rightHand);assert.ok(Math.hypot(...a.map((n,i)=>n-nock[i]))<1e-5);
  const dx=b[0]-a[0],dz=b[2]-a[2],forward=[Math.sin(yaw),Math.cos(yaw)];assert.ok((dx*forward[0]+dz*forward[1])/Math.hypot(dx,dz)>Math.cos(.10),'shaft agrees with shot within six degrees');
  assert.ok(Math.abs(pose.joints.leftHand[0]-pose.joints.rightHand[0])<.04);assert.ok(pose.joints.leftHand[2]>pose.joints.rightHand[2]);
 }
});
test('the bow draw sleeve centers clear the fitted torso through anticipation and guard',()=>{
 for(const guarded of[false,true])for(const progress of[0,.2,.5,.8,1]){const out=empty();T.draw(out,{},T.pose({style:'bow',combatScene:true,combatPhase:'anticipate',combatProgress:progress,guarded}));const ps=Object.values(out).flat(),coat=ps.find(p=>p.travelerPart==='jacket-chest');for(const name of['right-upper-arm','right-forearm']){const p=ps.find(p=>p.travelerPart===name),delta=p.p.map((n,i)=>n-coat.p[i]),local=[0,1,2].map(k=>{const col=[coat.m[k*4],coat.m[k*4+1],coat.m[k*4+2]],length2=col.reduce((a,n)=>a+n*n,0);return delta.reduce((a,n,i)=>a+n*col[i],0)/length2;});assert.ok(local.reduce((a,n)=>a+(n*2)**2,0)>1.02,'sleeve center outside the actual chest ellipsoid');}}
});
