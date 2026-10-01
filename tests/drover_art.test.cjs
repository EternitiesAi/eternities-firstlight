'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/engine.js'),D=require('../src/drover-art.js'),Earth=require('../src/earth.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`),vclose=(a,b)=>a.forEach((v,i)=>close(v,b[i]));
const cases=[{accepted:false,dispatch:null,arrived:false,claimed:false},{accepted:true,dispatch:null,arrived:false,claimed:false},
 {accepted:true,dispatch:'mill',arrived:false,claimed:false},{accepted:true,dispatch:'mill',arrived:true,claimed:false},
 {accepted:true,dispatch:'mill',arrived:true,claimed:true}];
function sample(state=cases[0],time=0,reducedMotion=false){const out={box:[],round:[],octa:[]};const frame=D.draw(out,{state,time,reducedMotion,ground:Earth.height});return{frame,parts:Object.entries(out).flatMap(([kind,items])=>items.map(p=>({kind,...p})))};}
test('Fenna retains exact supported rule-adjacent anchors and does not invent consent',()=>{
 for(const state of cases){const before=structuredClone(state),s=sample(state),a=s.frame.anchor;
  assert.deepEqual(state,before);assert.equal(a.x,state.dispatch?2:8.8);assert.equal(a.z,state.dispatch?-43:5);assert.equal(a.yaw,-.6);
  assert.ok(Earth.walkable(a.x,a.z));assert.ok(Earth.line({x:state.dispatch?0:7,z:state.dispatch?-43:5},a));
  assert.ok(Math.hypot(a.x-(state.dispatch?0:7),a.z-(state.dispatch?-43:5))<=2.3);
  assert.deepEqual({x:s.frame.cart.x,z:s.frame.cart.z},state.dispatch?{x:-3,z:-43}:{x:9.3,z:7});
 }
 assert.equal(sample(cases[0]).frame.phase,'waiting');assert.equal(sample(cases[1]).frame.phase,'accepted');
 assert.equal(sample(cases[2]).frame.phase,'dispatched');assert.equal(sample(cases[3]).frame.phase,'arrived');
});
test('confirmed arrival alone opens the load, and payment cannot redraw or repay it',()=>{
 const wait=sample(cases[0]),accepted=sample(cases[1]),sent=sample(cases[2]),arrived=sample(cases[3]);
 assert.deepEqual(wait.parts,accepted.parts);assert.equal(sent.frame.sackCount,4);assert.equal(sent.frame.appleCount,5);
 assert.equal(arrived.frame.sackCount,2);assert.equal(arrived.frame.appleCount,0);
 assert.equal(arrived.parts.filter(i=>i.droverPart==='flour-sack').length,2);
 assert.ok(arrived.parts.some(i=>i.droverPart==='folded-cover'));assert.ok(!sent.parts.some(i=>i.droverPart==='folded-cover'));
 assert.deepEqual(arrived,sample(cases[4]));
});
test('bounded complete drover and cart transforms remain positive and finite',()=>{
 for(const state of cases)for(let time=0;time<30;time+=.4){const s=sample(state,time);assert.equal(s.parts.length,s.frame.partCount);assert.ok(s.parts.length<=160);
  for(const p of s.parts){assert.ok([...p.p,...p.s,...p.m].every(Number.isFinite));assert.ok(p.s.every(v=>v>0));assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);
   vclose(Array.from(p.m.slice(12,15)),p.p);const m=p.m;
   assert.ok(m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5])>0);}
 }
});
test('rope grasp shares the actual coil frame, with connected upper and lower arms',()=>{
 for(const state of cases)for(const time of[0,1,4,9,18,28]){
  const s=sample(state,time),j=s.frame.joints;
  vclose(E.M.transform(s.frame.root,j.rightHand),E.M.transform(s.frame.coilRoot,[.14,.06,0]));
  vclose(s.parts.find(i=>i.droverPart==='right-hand').p,E.M.transform(s.frame.coilRoot,[.14,.06,0]));
  for(const name of['left','right']){close(Math.hypot(...j[name+'Shoulder'].map((v,i)=>v-j[name+'Elbow'][i])),.315);close(Math.hypot(...j[name+'Elbow'].map((v,i)=>v-j[name+'Hand'][i])),.285);}
  for(const p of s.parts.filter(i=>i.droverJoints)){
   const ends=[-1,1].map(sign=>[0,1,2].map(k=>p.m[12+k]+sign*p.m[4+k]/2));
   for(const target of p.droverJoints)assert.ok(Math.min(...ends.map(e=>Math.hypot(...e.map((v,i)=>v-target[i]))))<1e-5);
  }
 }
});
test('feet and four cart wheel rims meet actual terrain at both existing sites',()=>{
 for(const state of cases){const s=sample(state);for(const p of s.parts.filter(i=>i.droverPart.endsWith('-sole')))close(p.p[1]-p.s[1]/2,s.frame.anchor.base);
  const wheels=s.parts.filter(i=>i.droverPart==='wheel-rim');assert.equal(wheels.length,4);
  for(const p of wheels)close(p.p[1]-p.s[1]/2,Earth.height(p.p[0],p.p[2]));
  assert.equal(s.frame.wheelContacts.length,4);for(const c of s.frame.wheelContacts)close(c.center-c.radius,c.ground);
 }
});
test('short cart shafts stay clear of the established gathering cloth approach',()=>{
 const s=sample(cases[3]);for(const p of s.parts.filter(i=>i.droverPart==='short-shaft'))assert.ok(p.p[2]+p.s[2]/2<-43);
 assert.ok(Earth.walkable(-3,-40.5));
});
test('cart shafts cannot pass through Fenna at either existing waiting or delivered stance',()=>{
 const bounds=p=>{const points=[];for(const x of[-.5,.5])for(const y of p.kind==='octa'?[-.65,.65]:[-.5,.5])for(const z of[-.5,.5])points.push(E.M.transform(p.m,[x,y,z]));return [0,1,2].map(i=>[Math.min(...points.map(v=>v[i])),Math.max(...points.map(v=>v[i]))]);};
 for(const state of cases)for(const time of[0,5,12,23]){
  const s=sample(state,time),actor=s.parts.filter(p=>p.droverGroup==='actor').map(p=>({name:p.droverPart,b:bounds(p)}));
  for(const shaft of s.parts.filter(p=>p.droverPart==='short-shaft')){
   const a=bounds(shaft);for(const {name,b}of actor)assert.ok(!a.every((v,i)=>Math.min(v[1],b[i][1])>Math.max(v[0],b[i][0])),`shaft intersects ${name}`);
  }
 }
});
test('sampling has no hidden clock, and reduced motion holds a connected complete pose',()=>{
 assert.deepEqual(sample(cases[1],2),sample(cases[1],2));assert.notDeepEqual(sample(cases[1],2),sample(cases[1],3));
 for(const s of cases)assert.deepEqual(sample(s,2,true),sample(s,300,true));
 assert.deepEqual(sample(cases[0],NaN),sample(cases[0],0));
});
