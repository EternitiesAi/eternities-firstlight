'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/engine.js'),A=require('../src/quarry-art.js'),Earth=require('../src/earth.js');
const close=(a,b,e=1e-5)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`),vclose=(a,b)=>a.forEach((n,i)=>close(n,b[i]));
const states=[{accepted:false,steps:[]},{accepted:true,steps:[]},{accepted:true,steps:['quarry-reserve']},{accepted:true,steps:['quarry-reserve','quarry-grade']}];
function sample(state=states[0],time=0,reducedMotion=false){const out={box:[],round:[],octa:[]},actor=A.draw(out,{state,time,reducedMotion,ground:Earth.height}),works=A.works(out,{state,ground:Earth.height});return{actor,works,parts:Object.entries(out).flatMap(([kind,items])=>items.map(p=>({kind,...p})))};}
const bounds=p=>{const points=[];for(const x of[-.5,.5])for(const y of p.kind==='octa'?[-.65,.65]:[-.5,.5])for(const z of[-.5,.5])points.push(p.m?E.M.transform(p.m,[x,y,z]):[p.p[0]+x*p.s[0],p.p[1]+y*p.s[1],p.p[2]+z*p.s[2]]);return[0,1,2].map(i=>[Math.min(...points.map(v=>v[i])),Math.max(...points.map(v=>v[i]))]);};
test('Darric remains at the supported existing anchor beside the real collection approach',()=>{
 assert.deepEqual(A.ANCHOR,{x:14.3,z:-26,yaw:-.8});assert.ok(Earth.walkable(14.3,-26));
 assert.ok(Earth.segment({x:14,z:-13},{x:14,z:-26},.31));assert.ok(Earth.segment({x:14,z:-26},{x:12,z:-26},.31));
 assert.ok(Earth.line({x:12,z:-26},A.ANCHOR));
});
test('complete actor and actual tool matrices remain finite positive and bounded across every stage',()=>{
 for(const state of states)for(let time=0;time<30;time+=.3){const s=sample(state,time),actor=s.parts.filter(p=>p.stoneworkerPart);
  assert.equal(actor.length,s.actor.partCount);assert.ok(actor.length<=64);
  for(const p of actor){assert.ok([...p.p,...p.s,...p.m].every(Number.isFinite));assert.ok(p.s.every(n=>n>0));vclose(Array.from(p.m.slice(12,15)),p.p);
   const m=p.m;assert.ok(m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5])>0);}
  assert.ok(s.parts.every(p=>p.cameraSolid===false&&p.cutaway===false));
 }
});
test('both gloved hands meet the real resting handle through every pose and stage',()=>{
 for(const state of states)for(const time of[0,1,4,9,18,28]){const s=sample(state,time),j=s.actor.joints;
  for(const [name,grip]of[['left',-.20],['right',.055]]){
   const actual=E.M.transform(s.actor.toolRoot,[grip,0,0]);vclose(actual,E.M.transform(s.actor.root,j[name+'Hand']));
   vclose(actual,s.parts.find(p=>p.stoneworkerPart===name+'-glove').p);
   close(Math.hypot(...j[name+'Shoulder'].map((v,i)=>v-j[name+'Elbow'][i])),.34);
   close(Math.hypot(...j[name+'Elbow'].map((v,i)=>v-j[name+'Hand'][i])),.32);
  }
  assert.equal(s.parts.filter(p=>p.stoneworkerPart?.startsWith('mallet-')).length,2);
 }
});
test('full 3D limb bases connect submitted endpoints instead of rotating only in one plane',()=>{
 for(const state of states){const s=sample(state,7);for(const p of s.parts.filter(p=>p.stoneworkerJoints)){
  const ends=[-1,1].map(sign=>[0,1,2].map(k=>p.m[12+k]+sign*p.m[4+k]/2));
  for(const joint of p.stoneworkerJoints){const target=E.M.transform(s.actor.root,joint);assert.ok(Math.min(...ends.map(e=>Math.hypot(...e.map((v,i)=>v-target[i]))))<1e-5);}
 }}
});
test('transformed soles meet canonical shallow ground within six millimetres',()=>{
 const s=sample();for(const p of s.parts.filter(p=>p.stoneworkerPart?.endsWith('-sole'))){const b=bounds(p);close(b[1][0],s.actor.anchor.base);close(b[1][0],Earth.height(p.p[0],p.p[2]),.006);}
});
test('actual actor and mallet volumes clear collection stance sign and reserved blocks at pose extremes',()=>{
 const sign=[[10.85,13.15],[Earth.height(12,-26)+1.175,Earth.height(12,-26)+1.925],[-26.06,-25.94]],stance=[[11.65,12.35],[Earth.height(12,-26),Earth.height(12,-26)+1.8],[-26.35,-25.65]];
 const overlap=(a,b)=>a.every((v,i)=>Math.min(v[1],b[i][1])-Math.max(v[0],b[i][0])>1e-5);
 for(const state of states)for(let time=0;time<30;time+=.5){const s=sample(state,time),blocks=s.parts.filter(p=>p.quarryPart==='reserved-block').map(bounds);
  for(const p of s.parts.filter(p=>p.stoneworkerPart)){const b=bounds(p);assert.ok(!overlap(b,sign),p.stoneworkerPart+' overlaps sign');assert.ok(!overlap(b,stance),p.stoneworkerPart+' overlaps collection stance');assert.ok(blocks.every(block=>!overlap(b,block)),p.stoneworkerPart+' overlaps public stone');}
 }
});
test('actual mallet head clears body boxes and conservative round bounds through the full posing cycle',()=>{
 const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const obb=p=>{const m=p.m,columns=[0,4,8].map(k=>Array.from(m.slice(k,k+3))),lengths=columns.map(v=>Math.hypot(...v));return{center:Array.from(m.slice(12,15)),r:lengths.map(n=>n/2),axes:columns.map((v,i)=>v.map(n=>n/lengths[i]))};};
 const overlap=(a,b)=>{const delta=b.center.map((v,i)=>v-a.center[i]);return[...a.axes,...b.axes,...a.axes.flatMap(u=>b.axes.map(v=>cross(u,v)))].filter(n=>Math.hypot(...n)>1e-7).every(axis=>{const length=Math.hypot(...axis),n=axis.map(v=>v/length),radius=o=>o.axes.reduce((r,v,i)=>r+o.r[i]*Math.abs(dot(v,n)),0);return Math.abs(dot(delta,n))<radius(a)+radius(b)-1e-5;});};
 for(const state of states)for(let time=0;time<30;time+=.1){const s=sample(state,time),head=obb(s.parts.find(p=>p.stoneworkerPart==='mallet-head'));
  for(const p of s.parts.filter(p=>['box','round'].includes(p.kind)&&p.stoneworkerPart&&!p.stoneworkerPart.startsWith('mallet-')))assert.ok(!overlap(head,obb(p)),`${p.stoneworkerPart} intersects head bound at ${time}`);
 }
});
test('three stable individually tallied blocks project release only and twelve flush stones project packing only',()=>{
 for(const [i,state]of states.entries()){const s=sample(state),before=structuredClone(state);
  assert.equal(s.works.blockIds.length,i<2?3:0);assert.equal(s.works.gradeIds.length,i===3?12:0);
  assert.equal(new Set(s.works.blockIds).size,s.works.blockIds.length);assert.equal(new Set(s.works.gradeIds).size,s.works.gradeIds.length);
  for(const [k,id]of s.works.blockIds.entries())assert.equal(s.parts.filter(p=>p.quarryId===id&&p.quarryPart==='chalk-tally').length,k+1);
  for(const p of s.parts.filter(p=>p.quarryPart==='packed-grade'))close(p.p[1]+p.s[1]/2,Earth.height(p.p[0],p.p[2])+.035);
  assert.deepEqual(state,before);assert.deepEqual(s,sample({...state,dispatch:'mill',arrived:true,claimed:true}));
 }
});
test('pure pose uses only supplied simulation time and reduced motion freezes each complete stage',()=>{
 for(const state of states){const before=structuredClone(state);assert.deepEqual(sample(state,2),sample(state,2));assert.notDeepEqual(sample(state,2),sample(state,3));assert.deepEqual(sample(state,2,true),sample(state,300,true));assert.deepEqual(sample(state,NaN),sample(state,0));assert.deepEqual(state,before);}
});
