/* Actual staged Engine vertices, not pixels. Pose enumeration is synthetic. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../src/engine.js'),B=require('../src/earth-grazer-motion.js'),Art=require('../src/earth-grazer-art.js');
const pose={x:0,z:0,base:0,yaw:0,lower:0,gait:0,walking:false,phase:'CPU-authoring'};
const triangles=parts=>parts.reduce((sum,p)=>sum+E.geometry(p.kind).length/E.meshStride(p.kind)/3,0);
const endpoint=(part,v)=>E.M.transform(part.m,[0,v,0]);

test('connected body and every articulated part fit unchanged support and path reserves across240 poses',()=>{
 let poses=0;
 for(const quality of['low','balanced','high'])for(const lower of[0,.25,.5,.75,1])for(const gait of[0,Math.PI/2,Math.PI,Math.PI*1.5])for(const yaw of[0,.63,Math.PI,5.4]){
  poses++;
  for(const part of Art.shape({...pose,lower,gait,yaw,walking:true},{quality})){
   const raw=E.geometry(part.kind),stride=E.meshStride(part.kind);
   for(let i=0;i<raw.length;i+=stride){const p=E.M.transform(part.m,Array.from(raw.slice(i,i+3)));
    assert.ok(p.every(Number.isFinite));assert.ok(p[1]>=-1e-6,part.grazerPart+' penetrates ground');
    assert.ok(p[1]<=B.LIMITS.height+1e-6,part.grazerPart+' exceeds declared height');
    assert.ok(Math.hypot(p[0],p[2])<=B.LIMITS.radius+1e-6,part.grazerPart+' leaves existing path reserve');
   }
  }
 }assert.equal(poses,240);
});
test('one connected torso replaces four volumes while preserving observation cues and bent connected legs',()=>{
 for(const quality of['low','balanced','high']){
  const parts=Art.shape(pose,{quality}),priorBudget=quality==='low'?{parts:29,triangles:4344}:{parts:31,triangles:4360};
  assert.equal(parts.length,priorBudget.parts-3);assert.ok(triangles(parts)<priorBudget.triangles);
  for(const cue of['long-body','slender-head','feeding-muzzle','soft-nose'])assert.equal(parts.filter(p=>p.grazerPart===cue).length,1,cue);
  assert.equal(parts.find(p=>p.grazerPart==='long-body').kind,'earth-grazer-body-v1');
  for(const item of parts){assert.equal(item.cameraSolid,false);assert.equal(item.cutaway,false);assert.equal(item.appearanceOnly,true);assert.equal(item.grazerActor,B.ID);}
  for(const side of['left','right'])for(const end of['front','rear']){
   const id=side+'-'+end,upper=parts.find(p=>p.grazerPart===id+'-upper'),lower=parts.find(p=>p.grazerPart===id+'-lower');
   const hip=endpoint(upper,-.5),knee=endpoint(upper,.5),ankle=endpoint(lower,.5);
   assert.ok(Math.hypot(...endpoint(lower,-.5).map((v,i)=>v-knee[i]))<1e-6,'connected knee '+id);
   const axis=ankle.map((v,i)=>v-hip[i]),offset=knee.map((v,i)=>v-hip[i]),t=E.dot(axis,offset)/E.dot(axis,axis);
   assert.ok(Math.hypot(...offset.map((v,i)=>v-t*axis[i]))>=.055,'readable bend '+id);
  }
 }
});
test('quiet-motion anatomy retains feeding meaning and never changes the input pose',()=>{
 const p=Object.freeze({...pose,walking:true,reducedMotion:true}),raw=JSON.stringify(p);
 assert.deepEqual(Art.shape({...p,gait:0}),Art.shape({...p,gait:2}));assert.equal(JSON.stringify(p),raw);
 const head=lower=>Art.shape({...p,lower}).find(v=>v.grazerPart==='feeding-muzzle');
 assert.ok(head(1).p[1]<head(0).p[1]-.2);
});
