'use strict';
/* Actual decorator/mesh/scene dispatch with synthetic authoring interfaces and
 * Core worlds. No GL, native progress or rendered/performance acceptance. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const H=require('../src/world-heaven-hell.js'),E=require('../src/engine.js'),C=require('../src/core.js'),W=require('../src/world-foundations.js'),Art=require('../src/world-foundations-art.js');
const FLOOR=1.57,START='  // Nine stationary flowers connect the existing lower garden without a new bed.\n',END='  // End authored lower-garden planting.\n';
function previous(){const file=require.resolve('../src/world-heaven-hell.js'),raw=fs.readFileSync(file,'utf8');if(!raw.includes(START))return H;
 assert.equal(raw.split(START).length,2);assert.equal(raw.split(END).length,2);const begin=raw.indexOf(START),end=raw.indexOf(END)+END.length,m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(raw.slice(0,begin)+raw.slice(end),file);globalThis.RealmWorldHeavenHell=H;return m.exports;}
const old=previous(),added=p=>typeof p.gardenPlanting==='string';
function world(quality,reduced=false){const s=new C.Simulation(C.fresh(),{hydrated:true});s.state.settings.quality=quality;s.state.settings.reducedMotion=reduced;return s;}
function scene(api,realm,quality,reduced=false){const sim=world(quality,reduced),before=sim.snapshot(),out=[],def=api.realms.find(r=>r.id===realm);
 const report=api.decorate({add(kind,x,y,z,sx,sy,sz,c,opt){out.push({kind,p:[x,y,z],s:[sx,sy,sz],c,...opt});}},def,{height:()=>FLOOR,sim});assert.deepEqual(sim.snapshot(),before);return{out,report};}
function vertices(p){const g=E.geometry(p.kind),stride=E.meshStride(p.kind),m=E.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),out=[];assert.equal(stride,6);
 for(let i=0;i<g.length;i+=stride){const v=Array.from(g.slice(i,i+stride));assert.ok(v.every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...v.slice(3))-1)<1e-6);out.push(E.M.transform(m,v.slice(0,3)));}return out;}
// Independently listed original route centre lines, not the decorator's helper.
const routes=[[[0,31],[0,17],[6,2],[6,-13],[0,-20],[0,-79],[0,-99]],[[0,17],[-14,5],[-24,5],[-35,-10],[-35,-52],[-24,-76],[0,-89]],[[0,17],[25,5],[29,-26],[27,-66],[0,-89]]];
function distance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
function clearance(p){const def=H.realms[0];for(const v of vertices(p)){
 assert.ok(v[1]>=FLOOR-1e-6&&v[1]<=FLOOR+.45+1e-6,'Low rooted detail envelope');assert.ok(W.land(def.room,v[0],v[2],0));
 for(const line of routes)for(let i=1;i<line.length;i++)assert.ok(distance(v[0],v[2],line[i-1],line[i])>3,'Original route strip remains open');
 for(const q of def.points)assert.ok(Math.hypot(v[0]-q.x,v[2]-q.z)>4,'Original work/NPC/return marker remains readable');
 for(const s of def.solids)assert.ok(Math.abs(v[0]-s.x)>s.w/2+.31||Math.abs(v[2]-s.z)>s.d/2+.31,'Original physical furniture envelope untouched');
}}
test('Garden planting: nine owned flowers add only63 ordered static parts at Balanced/High',()=>{
 assert.deepEqual(H.realms,old.realms);for(const q of ['balanced','high'])for(const reduced of [false,true]){
 const a=scene(H,'heaven',q,reduced),b=scene(old,'heaven',q,reduced),parts=a.out.filter(added);assert.equal(parts.length,63);assert.deepEqual(a.out.filter(p=>!added(p)),b.out,'Every original ordered decoration remains exact');
 assert.deepEqual(a.report,{...b.report,instances:b.report.instances+63,localInstances:b.report.localInstances+63});assert.deepEqual(new Set(a.out.map(p=>p.kind)),new Set(b.out.map(p=>p.kind)),'No new static kind/bucket');
 assert.equal(new Set(parts.map(p=>p.gardenDetailId)).size,63);assert.equal(new Set(parts.map(p=>p.gardenPlant)).size,9);assert.deepEqual(new Set(parts.map(p=>p.gardenPlanting)),new Set(['instrument-edge','east-garden','tree-east']));
 assert.equal(parts.filter(p=>p.gardenPart==='heart').length,9);assert.equal(parts.filter(p=>p.gardenPart.startsWith('leaf-')).length,18);assert.equal(parts.filter(p=>p.gardenPart.startsWith('petal-')).length,27);
 assert.equal(parts.reduce((n,p)=>n+E.geometry(p.kind).length/(E.meshStride(p.kind)*3),0),738);
 }});
test('Garden planting: actual primitive vertices stay low, rooted and clear with stationary material ownership',()=>{
 const parts=scene(H,'heaven','balanced').out.filter(added);assert.equal(parts.length,63);
 assert.deepEqual(new Set(parts.filter(p=>p.gardenPart.startsWith('petal-')).map(p=>p.c)),new Set([0xf0e6cf,0x8f1538]));
 for(const p of parts){assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.wind,0);assert.equal(p.foliage,true);assert.equal(p.rough,.98);assert.ok(p.s.every(v=>Number.isFinite(v)&&v>0));
  for(const key of ['worldSolid','worldSolidId','worldGround','terrain','markerId','actor','surveyRecord','overhead','skyImage','gardenInstrument','gardenBand'])assert.equal(p[key],undefined);clearance(p);}
 const heart=parts.find(p=>p.gardenPart==='heart');assert.throws(()=>clearance({...heart,p:[0,FLOOR+.3,17]}),'Independent displaced-route counterexample must reject');
});
test('Garden planting: Low and other realms are exact; the actual WorldArt scene dispatch commits the same owned detail',()=>{
 for(const q of ['low',undefined,'unsupported'])for(const reduced of [false,true])assert.deepEqual(scene(H,'heaven',q,reduced),scene(old,'heaven',q,reduced));
 for(const q of ['low','balanced','high'])for(const reduced of [false,true])assert.deepEqual(scene(H,'hell',q,reduced),scene(old,'hell',q,reduced));
 function make(api,q){const sim=world(q);sim.room='world-heaven';const before=sim.snapshot(),out=[];let commits=0,begins=0;const add=(kind,x,y,z,sx,sy,sz,c,opt)=>out.push({kind,p:[x,y,z],s:[sx,sy,sz],c,...opt});
  const a={e:{},begin(id){assert.equal(id,'world-heaven');begins++;},add,box(...args){add('box',...args);},commit(){commits++;}};
  globalThis.RealmWorldHeavenHell=api;try{Art.make(a,sim);}finally{globalThis.RealmWorldHeavenHell=H;}assert.equal(begins,1);assert.equal(commits,1);assert.deepEqual(sim.snapshot(),before);return out;}
 const current=make(H,'high'),prior=make(old,'high');assert.equal(current.filter(added).length,63);assert.deepEqual(current.filter(p=>!added(p)),prior);assert.deepEqual(make(H,'low'),make(old,'low'));
});
