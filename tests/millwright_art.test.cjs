'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/engine.js'),A=require('../src/millwright-art.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
const vclose=(a,b)=>a.forEach((n,i)=>close(n,b[i]));
function sample(time=0,reducedMotion=false){const out={box:[],round:[],octa:[]};const frame=A.draw(out,{base:1.7678346,time,reducedMotion});return{frame,parts:Object.values(out).flat()};}
test('Ansel keeps the exact Earth resident anchor and excludes navigation/camera ownership',()=>{
 const s=sample();assert.deepEqual(A.ANCHOR,{x:8.7,z:-6.6,yaw:-1});
 assert.ok(s.parts.every(i=>i.cameraSolid===false&&i.cutaway===false));
 assert.ok(s.parts.some(i=>i.millwrightPart==='apron-bib')&&s.parts.some(i=>i.millwrightPart==='cap-brim'));
});
test('bounded body and tool transforms remain finite and positive through the full work cycle',()=>{
 for(let time=0;time<30;time+=.2){const s=sample(time);assert.ok(s.parts.length<=64);assert.equal(s.parts.length,s.frame.partCount);
  for(const i of s.parts){assert.ok([...i.p,...i.s,...i.m].every(Number.isFinite));assert.ok(i.s.every(n=>n>0));vclose(Array.from(i.m.slice(12,15)),i.p);
   const m=i.m,det=m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5]);assert.ok(det>0);}
 }
});
test('both hands belong to the actual square frame throughout inspection',()=>{
 for(const time of[0,1,4,9,15,26]){const s=sample(time);for(const [hand,side]of[['left',-1],['right',1]]){
  const world=E.M.transform(s.frame.root,s.frame.joints[hand+'Hand']);
  vclose(world,E.M.transform(s.frame.toolRoot,[side*.23,0,0]));
  vclose(s.parts.find(i=>i.millwrightPart===hand+'-hand').p,world);
 }assert.equal(s.parts.filter(i=>i.millwrightPart.startsWith('square-')).length,2);}
});
test('proper 3D segments connect both elbows, hands and legs without cross-body gaps',()=>{
 const s=sample(7);for(const i of s.parts.filter(i=>i.millwrightJoints)){
  const [a,b]=i.millwrightJoints.map(p=>E.M.transform(s.frame.root,p));
  const endpoints=[-1,1].map(sign=>[0,1,2].map(k=>i.m[12+k]+sign*i.m[4+k]/2));
  assert.ok(Math.min(...endpoints.map(p=>Math.hypot(...p.map((v,k)=>v-a[k]))))<1e-5);
  assert.ok(Math.min(...endpoints.map(p=>Math.hypot(...p.map((v,k)=>v-b[k]))))<1e-5);
 }
 for(const name of['left','right']){const j=s.frame.joints;close(Math.hypot(...j[name+'Shoulder'].map((v,i)=>v-j[name+'Elbow'][i])),.315);close(Math.hypot(...j[name+'Elbow'].map((v,i)=>v-j[name+'Hand'][i])),.285);}
});
test('feet meet the supplied ground and the square has a real right angle',()=>{
 const s=sample();for(const p of s.parts.filter(i=>i.millwrightPart.endsWith('-sole')))close(p.p[1]-p.s[1]/2,s.frame.anchor.base);
 const stock=s.parts.find(i=>i.millwrightPart==='square-stock'),blade=s.parts.find(i=>i.millwrightPart==='square-blade');
 close(stock.m[4]*blade.m[0]+stock.m[5]*blade.m[1]+stock.m[6]*blade.m[2],0);
});
test('pure sampling changes only with supplied time and reduced motion keeps one complete stance',()=>{
 assert.deepEqual(sample(2),sample(2));assert.notDeepEqual(sample(2),sample(3));
 assert.deepEqual(sample(2,true),sample(300,true));assert.deepEqual(sample(NaN),sample(0));
});
