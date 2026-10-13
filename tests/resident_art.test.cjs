'use strict';
// Actual Core routes, WorldArt caller, shared rig and mesh matrices. CPU evidence;
// native screenshots/video separately establish screen appearance and visibility.
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/engine.js'),C=require('../src/core.js');require('../src/creative.js');
const T=require('../src/traveler-art.js'),R=require('../src/resident-art.js');require('../src/traveler-equipment-art.js');require('../src/combat.js');require('../src/arsenal.js');require('../src/pursuit.js');require('../src/starter.js');require('../src/realm-craft.js');require('../src/world.js');
const W=globalThis.RealmArt.WorldArt,ids=['ilan','mara','oren'];
const empty=()=>({box:[],round:[],octa:[],disc:[],'traveler-cloth':[]});
const parts=o=>Object.entries(o).flatMap(([kind,v])=>v.map(p=>({kind,...p})));
const copy=v=>JSON.parse(JSON.stringify(v));
const near=(a,b,t=2e-6)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<t,`${a} != ${b}`));
const owner=s=>JSON.stringify({world:s.snapshot(),runs:[...s.runs],path:s.playerPath});
function render(id,motion={},input={}){const out=empty(),posed=R.pose(id,motion),frame=R.draw(out,{id,x:3,z:-2,base:1.2,yaw:.7,...input},posed);return{posed,frame,parts:parts(out)};}
function artist(room=null){
 const e={camera:{eye:[37,32,37],projection:'perspective'},clear(){},batch(kind,items){return{kind,items};}};
 const art=Object.create(W.prototype);art.e=e;art.begin(room);art.commit();return art;
}
function snapshot(art,sim){globalThis.RealmArsenal.runtime(sim);const before=owner(sim);art.update(sim,999,null);assert.equal(owner(sim),before,'actual update preserves every saved field and Core run');return art.familySnapshot(sim);}
function settle(sim,art){for(let i=0;i<2400;i++){sim.tick(.05);snapshot(art,sim);if([...sim.runs.values()].every(r=>!r.walking)){for(let j=0;j<12;j++){sim.tick(.05);snapshot(art,sim);}return;}}throw new Error('Core routes did not settle');}
function verts(p){const data=E.geometry(p.kind),out=[];for(let i=0;i<data.length;i+=6)out.push(E.M.transform(p.m,[data[i],data[i+1],data[i+2]]));return out;}

test('only the three existing identities use distinct original appearance and supported props',()=>{
 assert.equal(R.pose('unknown'),null);const out=empty();assert.equal(R.draw(out,{id:'unknown'}),null);assert.equal(parts(out).length,0);
 const hair=[0x6c5241,0xc9c5ad,0x55493c],props=['instrument-body','notebook-pages','work-apron'];
 for(let i=0;i<ids.length;i++){
  const r=render(ids[i]);assert.ok(r.parts.some(p=>p.residentPart===props[i]));
  assert.deepEqual(r.parts.find(p=>p.residentPart==='hair-crown').c,E.hex(hair[i]));
  assert.deepEqual(r.parts.find(p=>p.residentPart==='head').c,E.hex(0xc4a58d));
  assert.ok(!r.parts.some(p=>p.travelerPart||p.residentPart.startsWith('cloak-')||p.residentPart==='ground-marker'));
  assert.equal(new Set(r.parts.map(p=>p.residentPart)).size,r.parts.length);assert.ok(r.parts.length<=60);
 }
});

test('submitted body vertices stay finite and grounded; solved limb endpoints connect in every facing',()=>{
 for(const id of ids)for(const yaw of [-2,.7,2.7])for(const reducedMotion of [false,true])for(let i=0;i<24;i++){
  const r=render(id,{phase:i*Math.PI/12,blend:i?1:0,time:i*.11,reducedMotion},{yaw});
  for(const p of r.parts){assert.ok(Array.from(p.m).every(Number.isFinite));assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);
   for(const v of verts(p)){assert.ok(v.every(Number.isFinite));assert.ok(v[1]>=1.2-2e-6&&v[1]<2.85,p.residentPart+' support/height');}
   if(p.residentJoints){near(E.M.transform(p.m,[0,-.5,0]),p.residentJoints[0]);near(E.M.transform(p.m,[0,.5,0]),p.residentJoints[1]);}
  }
  for(const side of ['left','right'])near(r.parts.find(p=>p.residentPart===side+'-hand').p,E.M.transform(r.frame.root,r.frame.joints[side+'Hand']));
  if(i===0)for(const side of ['left','right'])assert.ok(Math.abs(Math.min(...verts(r.parts.find(p=>p.residentPart===side+'-sole')).map(v=>v[1]))-1.2)<2e-6);
 }
});

test('carried props remain at actual hand contact throughout gait and carry-height settling',()=>{
 for(const id of ids)for(let i=0;i<=40;i++){
  const r=render(id,{phase:i*.21,blend:i/40,time:i*.06});
  const hand=side=>E.M.transform(r.frame.root,r.frame.joints[side+'Hand']);
  if(id==='mara'){
   const cover=r.parts.find(p=>p.residentPart==='notebook-front');
   // Real cover edge (not a second declared grip point) contacts each hand.
   near(E.M.transform(cover.m,[-.475,0,-.031/.012]),hand('left'));
   near(E.M.transform(cover.m,[.475,0,-.031/.012]),hand('right'));
  }else if(id==='oren')near(r.parts.find(p=>p.residentPart==='folding-rule').p,hand('left'));
  else{
   const neck=r.parts.find(p=>p.residentPart==='instrument-neck');
   near(E.M.transform(neck.m,[0,1/1.30-.5,0]),hand('left'));
   const body=r.parts.find(p=>p.residentPart==='instrument-body');
   near(E.M.transform(body.m,[0,.045/.40,.06/.12]),hand('right'));
  }
  // Independently require exact authored targets to be reachable by real bones.
  const target=id==='ilan'?[-.29,1.17,.27]:id==='mara'?[-.19,1.20-.2*i/40,.31-.06*i/40]:[-.26,1.02,.21];
  near(r.frame.joints.leftHand,target.map((v,k)=>v+(k===1?r.posed.bob:0)),1e-10);
 }
});

test('real WorldArt caller preserves outdoor and indoor membership, bases and exact state owners',()=>{
 const sim=new C.Simulation(),art=artist();sim.state.settings.timeFlow=false;sim.setTime(21.5);sim.tick(.05);
 let snap=snapshot(art,sim);assert.deepEqual(snap.residents.filter(r=>r.visible).map(r=>r.id),ids);
 for(const r of snap.residents)near(r.frame.anchor,[r.core.x,1.2,r.core.z]);
 art.begin('atelier');art.commit();snap=snapshot(art,sim);assert.deepEqual(snap.residents.filter(r=>r.visible).map(r=>r.id),[]);
 sim.setTime(10);sim.tick(.05);snap=snapshot(art,sim);assert.deepEqual(snap.residents.filter(r=>r.visible).map(r=>r.id),['ilan']);near(snap.residents[0].frame.anchor,[2.5,1.57,1.1]);
 art.begin('observatory');art.commit();snap=snapshot(art,sim);assert.deepEqual(snap.residents.filter(r=>r.visible).map(r=>r.id),['mara']);
 assert.equal(snap.residents[1].motion.blend,0,'indoor fixed display anchor never walks saved outdoor routes');
 art.begin(null);art.commit();sim.setTime(19);settle(sim,art);assert.ok(snapshot(art,sim).residents.every(r=>!r.visible));assert.equal(art.familyMotion.size,0);
 art.begin('home');art.commit();snap=snapshot(art,sim);assert.deepEqual(snap.residents.filter(r=>r.visible).map(r=>r.id),ids);
 [[-3.1,1.57,1.1],[3.2,1.57,1.1],[2,1.57,3.2]].forEach((p,i)=>near(snap.residents[i].frame.anchor,p));
 assert.ok(snap.residents.every(r=>r.motion.blend===0));
 const clone=copy(snap);snap.residents[0].frame.joints.head[0]=999;assert.deepEqual(art.familySnapshot(sim),clone,'observation hook cannot alter submission');
});

test('actual accepted routes drive separate gait and settle; pause and repeated renders stay exact',()=>{
 const sim=new C.Simulation(),art=artist();sim.state.settings.timeFlow=false;sim.setTime(19);settle(sim,art);
 sim.setTime(21.5);sim.tick(.05);snapshot(art,sim);let previous=art.familySnapshot(sim);
 let moved=0;for(let i=0;i<20;i++){
  sim.tick(.05);const next=snapshot(art,sim);
  for(const r of next.residents){const old=previous.residents.find(v=>v.id===r.id);if(r.visible&&old.visible&&r.run.walking){const d=Math.hypot(r.core.x-old.core.x,r.core.z-old.core.z);if(d>1e-7){assert.ok(r.motion.blend>0);assert.ok(r.motion.phase!==old.motion.phase);moved++;}}}
  previous=next;
 }
 assert.ok(moved>=40);sim.paused=true;const stopped=snapshot(art,sim);sim.tick(.1);assert.deepEqual(snapshot(art,sim),stopped);assert.deepEqual(snapshot(art,sim),stopped);
 sim.paused=false;settle(sim,art);const a=snapshot(art,sim);sim.tick(.1);const b=snapshot(art,sim);
 for(const r of b.residents){assert.equal(r.motion.phase,a.residents.find(v=>v.id===r.id).motion.phase);assert.equal(r.motion.blend,0);}
});

test('scene generation, owner replacement, hydration and hidden actors cannot inherit stale gait',()=>{
 let sim=new C.Simulation();const art=artist();sim.state.settings.timeFlow=false;sim.setTime(21.5);
 for(let i=0;i<20;i++){sim.tick(.05);snapshot(art,sim);}assert.ok(art.familySnapshot(sim).residents.some(r=>r.motion.blend>0));
 art.begin(null);art.commit();assert.ok(snapshot(art,sim).residents.every(r=>r.motion.blend===0));
 const before=sim.snapshot(),history=copy(before.journal);sim=new C.Simulation(before,{hydrated:true});const owners=owner(sim);snapshot(art,sim);assert.equal(owner(sim),owners);assert.deepEqual(sim.snapshot().journal,history);
 assert.ok(art.familySnapshot(sim).residents.every(r=>r.motion.blend===0));
 for(let i=0;i<5;i++){sim.tick(.05);snapshot(art,sim);}const r=sim.state.residents[0];sim.state.residents[0]={...r};assert.equal(snapshot(art,sim).residents[0].motion.blend,0);
 const saved=JSON.stringify(sim.snapshot());assert.ok(!saved.includes('familyMotion')&&!saved.includes('residentPart'));
 art.begin('unrelated-room');art.commit();assert.ok(snapshot(art,sim).residents.every(r=>!r.visible));assert.equal(art.familyMotion.size,0);
});

test('reduced motion retains essential walking/contact and omits optional drift',()=>{
 for(const id of ids){
  const a=render(id,{phase:1,blend:.8,reducedMotion:true,time:1}),b=render(id,{phase:1,blend:.8,reducedMotion:true,time:99});assert.deepEqual(a.parts,b.parts);
  assert.notDeepEqual(a.frame.joints.leftFoot,render(id,{reducedMotion:true}).frame.joints.leftFoot);
 }
});

test('Mara retains the shared short hem envelope instead of a closed skirt across the stride',()=>{
 for(let i=0;i<24;i++){
  const motion={phase:i*Math.PI/12,blend:1,time:i*.02},r=render('mara',motion),out=empty();
  T.draw(out,{},R.pose('mara',motion));
  for(const name of ['jacket-left-hem','jacket-right-hem']){
   const old=parts(out).find(p=>p.travelerPart===name),now=r.parts.find(p=>p.residentPart===name);
   near(Array.from(now.m),Array.from(E.M.mul(r.frame.root,old.m)));assert.deepEqual(now.s,old.s);
  }
 }
});

test('Oren apron clears actual thigh triangles across the full gait',()=>{
 // Clip each real triangle against the apron bounding box in resident space.
 // This catches a leg emerging through its front even when all vertices are outside.
 const clip=(polygon,axis,value,sign)=>{
  const result=[];for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],da=sign*(a[axis]-value),db=sign*(b[axis]-value);
   if(da>=0)result.push(a);if((da<0)!==(db<0)){const t=da/(da-db);result.push(a.map((v,j)=>v+(b[j]-v)*t));}
  }return result;
 };
 for(const reducedMotion of [false,true])for(let i=0;i<120;i++){
  const r=render('oren',{phase:i*Math.PI/60,blend:1,time:i*.03,reducedMotion},{x:0,z:0,base:0,yaw:0});
  const local=p=>p.map((v,k)=>(v-r.frame.root[12+k])/r.frame.scale[k]);
  const ap=verts(r.parts.find(p=>p.residentPart==='work-apron')).map(local),lo=[0,1,2].map(k=>Math.min(...ap.map(v=>v[k]))),hi=[0,1,2].map(k=>Math.max(...ap.map(v=>v[k])));
  for(const side of ['left','right']){const v=verts(r.parts.find(p=>p.residentPart===side+'-thigh')).map(local);
   for(let j=0;j<v.length;j+=3){let tri=v.slice(j,j+3);for(let k=0;k<3&&tri.length;k++){tri=clip(tri,k,lo[k],1);tri=clip(tri,k,hi[k],-1);}assert.equal(tri.length,0,side+' thigh intersects apron at phase '+i);}
  }
 }
});
