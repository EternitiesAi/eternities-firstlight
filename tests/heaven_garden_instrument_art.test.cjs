'use strict';
// Actual decoration and Engine geometry; synthetic art collector, no GL/pixels.
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../src/world-heaven-hell.js'),E=require('../src/engine.js');
const FLOOR=1.57,ID='heaven-garden-instrument',bone=0xe8dfc9,ruby=0x8f1538;
function scene(def=H.realms[0],height=FLOOR,settings={}){
 const out=[],sim={state:{settings,journeys:{realms:{[def.id]:{firstClaimed:false}}}}},before=structuredClone(sim);
 const report=H.decorate({add(kind,...args){const [x,y,z,sx,sy,sz,c,opt]=args;out.push({kind,p:[x,y,z],s:[sx,sy,sz],c,...opt});}},def,{height:()=>height,sim});
 assert.deepEqual(sim,before);return{out,report};
}
function vertices(p){const m=E.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),g=E.geometry(p.kind),stride=E.meshStride(p.kind);assert.equal(stride,6);const out=[];for(let i=0;i<g.length;i+=stride){assert.ok(Array.from(g.slice(i,i+stride)).every(Number.isFinite));out.push(E.M.transform(m,Array.from(g.slice(i,i+3))));}return out;}
test('Garden instrument: six stone collars and ruby finials attach to actual original pipes inside the existing envelope',()=>{
 const {out}=scene(),s=H.realms[0].solids.find(p=>p.id===ID),parts=out.filter(p=>p.gardenInstrument===ID),pipes=out.filter(p=>p.ornament&&p.kind==='cylinder'&&!p.gardenInstrument),ring=out.find(p=>p.kind==='ring'&&p.ornament);
 assert.equal(s.w,4);assert.equal(s.d,3);assert.equal(s.h,1.5);assert.equal(parts.length,12);assert.equal(pipes.length,6);assert.ok(ring);
 const ringTop=Math.max(...vertices(ring).map(v=>v[1]));
 for(let j=0;j<6;j++){
  const pipe=pipes[j],pair=parts.filter(p=>p.gardenChime===j),collar=pair.find(p=>p.gardenPart==='collar'),finial=pair.find(p=>p.gardenPart==='finial'),tip=pipe.p[1]+pipe.s[1];
  assert.equal(pair.length,2);assert.ok(collar&&finial);assert.equal(collar.kind,'cylinder');assert.equal(finial.kind,'octa');assert.equal(collar.c,bone);assert.equal(finial.c,ruby);
  assert.equal(collar.gardenDetailId,`heaven-garden-chime-${j}-collar`);assert.equal(finial.gardenDetailId,`heaven-garden-chime-${j}-finial`);
  for(const p of pair){
   assert.equal(p.p[0],pipe.p[0]);assert.equal(p.p[2],pipe.p[2]);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.ornament,true);assert.equal(p.wind,0);assert.equal(p.rough,.82);
   for(const key of ['worldSolidId','worldSolid','markerId','skyImage','actor','surveyRecord','overhead','foliage'])assert.equal(p[key],undefined);
   const vs=vertices(p);for(const v of vs){assert.ok(v.every(Number.isFinite));assert.ok(Math.abs(v[0]-s.x)<=s.w/2&&Math.abs(v[2]-s.z)<=s.d/2,'actual mesh stays over the physical pedestal, away from routes');assert.ok(v[1]>=FLOOR+s.h&&v[1]<=ringTop,'no larger overall instrument envelope');}
   assert.ok(Math.min(...vs.map(v=>v[1]))<tip&&Math.max(...vs.map(v=>v[1]))>tip,'both details overlap the real pipe tip');
  }
  const cv=vertices(collar),fv=vertices(finial);assert.ok(Math.min(...fv.map(v=>v[1]))<Math.max(...cv.map(v=>v[1]))&&Math.max(...fv.map(v=>v[1]))>Math.min(...cv.map(v=>v[1])),'collar and finial join rather than float');
 }
 assert.equal(new Set(parts.map(p=>p.gardenDetailId)).size,12);
});
test('Garden instrument: twelve stationary details cost exactly 432 triangles and preserve reduced-motion and height ownership',()=>{
 const a=scene(),parts=a.out.filter(p=>p.gardenInstrument===ID),quiet=scene(H.realms[0],FLOOR,{reducedMotion:true,quality:'low'}),high=scene(H.realms[0],FLOOR,{reducedMotion:false,quality:'high'}),raised=scene(H.realms[0],FLOOR+2);
 assert.equal(parts.length,12);assert.equal(parts.reduce((n,p)=>n+E.geometry(p.kind).length/(E.meshStride(p.kind)*3),0),432);
 assert.deepEqual(quiet.out,a.out);assert.deepEqual(high.out.filter(p=>p.gardenInstrument===ID),parts,'instrument-owned stationary detail is identical across quality; crowns have separate full-stream checks');assert.equal(a.report.instances,a.out.length);
 for(let i=0;i<a.out.length;i++)if(!a.out[i].skyImage){assert.equal(raised.out[i].kind,a.out[i].kind);assert.deepEqual(raised.out[i].s,a.out[i].s);assert.ok(Math.abs(raised.out[i].p[1]-a.out[i].p[1]-2)<1e-6);}
 assert.equal(scene(H.realms[1]).out.some(p=>p.gardenInstrument),false,'Hell remains outside this detail owner');
});
test('Garden instrument: original gold pipes, ring and solid-backed pedestal remain exact and the response approach stays clear',()=>{
 const def=H.realms[0],{out}=scene(),s=def.solids.find(p=>p.id===ID),pipes=out.filter(p=>p.ornament&&p.kind==='cylinder'&&!p.gardenInstrument),rings=out.filter(p=>p.kind==='ring'&&p.ornament);
 assert.equal(out.filter(p=>p.gardenInstrument===ID).length,12);
 for(let j=0;j<6;j++)assert.deepEqual(pipes[j],{kind:'cylinder',p:[s.x-1.5+j*.6,FLOOR+s.h,s.z],s:[.18,2.8-(j%3)*.4,.18],c:0xbe914c,cameraSolid:false,cutaway:false,ornament:true});
 assert.deepEqual(rings,[{kind:'ring',p:[s.x,FLOOR+4.3,s.z],s:[3.7,3.7,.18],c:0xbe914c,cameraSolid:false,cutaway:false,ornament:true}]);
 assert.equal(out.filter(p=>p.worldSolidId===ID).length,2);assert.deepEqual(def.points.find(p=>p.id==='heaven-garden-response')?.x,0);assert.equal(def.points.find(p=>p.id==='heaven-garden-response')?.z,-1);
 for(const p of out.filter(p=>p.gardenInstrument===ID))for(const v of vertices(p))assert.ok(Math.hypot(v[0],v[2]+1)>3,'actual adornment remains away from the response anchor');
});
