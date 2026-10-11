'use strict';
// Actual shipped geometry/decorator/Core state; synthetic art interface, no GL.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const H=require('../src/world-heaven-hell.js'),E=require('../src/engine.js'),C=require('../src/core.js');
const FLOOR=1.57,TAU=Math.PI*2,COLORS=[0x8eaa92,0xb5c1a7,0xd7cdbb];
const OLD="   if(isHeaven)for(let j=0;j<5;j++){const a=j*TAU/5;at('round',s.x+Math.cos(a)*1.25,top+.65+(j%2)*.5,s.z+Math.sin(a)*1.25,3.6,2.8,3.6,[0x8eaa92,0xb5c1a7,0xd7cdbb][j%3],{wind:2,foliage:true});}";
const NEW="   if(isHeaven)for(let j=0;j<5;j++){const a=j*TAU/5,kind=['balanced','high'].includes(options.sim?.state?.settings?.quality)?'woodland-canopy':'round';at(kind,s.x+Math.cos(a)*1.25,top+.65+(j%2)*.5,s.z+Math.sin(a)*1.25,3.6,2.8,3.6,[0x8eaa92,0xb5c1a7,0xd7cdbb][j%3],{wind:2,foliage:true});}";
function previous(){
 const filename=require.resolve('../src/world-heaven-hell.js'),raw=fs.readFileSync(filename,'utf8');
 // Stage transport publishes exact current bytes without a second game copy.
 const actual=globalThis.__heavenCrownSource||raw;
 if(actual.includes(NEW)){assert.equal(actual.split(NEW).length,2);const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(actual.replace(NEW,OLD),filename);globalThis.RealmWorldHeavenHell=H;return m.exports;}
 assert.ok(actual.includes(OLD));return H;
}
const previousH=previous();
function scene(api,realm,quality,reduced=false,claimed=false){
 const sim=new C.Simulation(C.fresh(),{hydrated:true});sim.state.settings.quality=quality;sim.state.settings.reducedMotion=reduced;
 // Synthetic canonical completed-art state, not command-earned quest evidence.
 if(claimed)Object.assign(sim.state.journeys.realms[realm],{counter:1,lastClaim:1,firstClaimed:true});
 const before=sim.snapshot(),out=[],def=api.realms.find(p=>p.id===realm);
 const report=api.decorate({add(kind,...args){const[x,y,z,sx,sy,sz,c,opt]=args;out.push({kind,p:[x,y,z],s:[sx,sy,sz],c,...opt});},begin(){assert.fail('no scene ownership');},commit(){assert.fail('no scene ownership');}},def,{height:()=>FLOOR,sim});
 assert.deepEqual(sim.snapshot(),before,'complete real Core state remains exact');return{out,report};
}
function originalCrowns(){return H.realms[0].solids.filter(s=>s.id.startsWith('heaven-tree-')).flatMap(s=>Array.from({length:5},(_,j)=>{const a=j*TAU/5;return{kind:'round',p:[s.x+Math.cos(a)*1.25,FLOOR+s.h+.65+(j%2)*.5,s.z+Math.sin(a)*1.25],s:[3.6,2.8,3.6],c:COLORS[j%3],cameraSolid:false,cutaway:false,wind:2,foliage:true};}));}
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function meshVertices(kind){const g=E.geometry(kind),stride=E.meshStride(kind),out=[];assert.equal(stride,6);for(let i=0;i<g.length;i+=stride)out.push(Array.from(g.slice(i,i+3)));return out;}
function roundPlanes(){const v=meshVertices('round'),out=[];for(let i=0;i<v.length;i+=3){let n=cross(sub(v[i+1],v[i]),sub(v[i+2],v[i])),length=Math.hypot(...n);if(length<1e-10)continue;n=n.map(x=>x/length);if(dot(n,v[i])<0)n=n.map(x=>-x);out.push({n,d:dot(n,v[i])});}assert.ok(out.length>200);return out;}
function contains(v,planes){return planes.every(p=>dot(p.n,v)<=p.d+2e-7);}
test('Heaven crowns: shipped mesh really fits every original convex plane with finite outward normals and closed topology',()=>{
 const g=E.geometry('woodland-canopy');assert.equal(g.length,2304,'128tri, no unknown-kind fallback');assert.equal(E.geometry('round').length,5760,'320tri original');
 const v=meshVertices('woodland-canopy'),planes=roundPlanes(),edges=new Map();
 for(let i=0;i<g.length;i+=6){const p=Array.from(g.slice(i,i+3)),n=Array.from(g.slice(i+3,i+6));assert.ok(p.concat(n).every(Number.isFinite));assert.ok(contains(p,planes),'actual vertex outside original convex crown');assert.ok(Math.abs(Math.hypot(...n)-1)<1e-6&&dot(p,n)>0,'outward unit normal');}
 const key=p=>p.map(x=>Math.round(x*1e7)).join(',');for(let i=0;i<v.length;i+=3){assert.ok(Math.hypot(...cross(sub(v[i+1],v[i]),sub(v[i+2],v[i])))>1e-8);for(let j=0;j<3;j++){const a=key(v[i+j]),b=key(v[i+(j+1)%3]),k=[a,b].sort().join('|');edges.set(k,(edges.get(k)||0)+1);}}
 assert.ok([...edges.values()].every(n=>n===2),'closed triangle manifold');assert.ok(!contains([.48,.48,0],planes),'corner counterexample is inside AABB but outside old convex surface');
});
test('Heaven crowns: exactly twelve canonical anchors and sixty existing masses switch at Balanced/High with all old metadata and remainder exact',()=>{
 assert.deepEqual(H.realms,previousH.realms);assert.deepEqual(H.realms[0].solids.filter(s=>s.id.startsWith('heaven-tree-')).map(s=>s.id),Array.from({length:12},(_,i)=>'heaven-tree-'+i));
 const expected=originalCrowns();assert.equal(expected.length,60);
 for(const quality of ['balanced','high'])for(const reduced of [false,true])for(const claimed of [false,true]){
  const before=scene(previousH,'heaven',quality,reduced,claimed),after=scene(H,'heaven',quality,reduced,claimed),parts=after.out.filter(p=>p.kind==='woodland-canopy');
  assert.equal(parts.length,60);assert.deepEqual(parts.map(p=>({...p,kind:'round'})),expected);
  assert.deepEqual(after.out.map(p=>p.kind==='woodland-canopy'?{...p,kind:'round'}:p),before.out,'entire original ordered stream except selected kind is exact');assert.deepEqual(after.report,before.report);
  assert.equal(after.out.reduce((n,p)=>n+E.geometry(p.kind).length/18,0)-before.out.reduce((n,p)=>n+E.geometry(p.kind).length/18,0),-11520);
  assert.deepEqual(new Set(after.out.map(p=>p.kind)),new Set([...before.out.map(p=>p.kind),'woodland-canopy']),'exact one existing new bucket');
 }
});
test('Heaven crowns: Low unspecified quality and every Hell tier remain byte-exact, while reduced-motion retains original shader ownership',()=>{
 for(const quality of ['low',undefined,'unsupported'])for(const reduced of [false,true])assert.deepEqual(scene(H,'heaven',quality,reduced),scene(previousH,'heaven',quality,reduced));
 for(const quality of ['low','balanced','high'])for(const reduced of [false,true])assert.deepEqual(scene(H,'hell',quality,reduced),scene(previousH,'hell',quality,reduced));
 const normal=scene(H,'heaven','balanced'),quiet=scene(H,'heaven','balanced',true);assert.deepEqual(normal.out,quiet.out);
 assert.equal(normal.out.filter(p=>p.kind==='woodland-canopy').length,60);for(const p of normal.out.filter(p=>p.kind==='woodland-canopy')){assert.equal(p.wind,2);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.foliage,true);assert.equal(p.worldSolidId,undefined);}
});
