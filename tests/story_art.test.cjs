'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
// Pure CPU checks: instance shapes, budgets, determinism and geometry, no WebGL.
const E=require('../src/engine.js');require('../src/creative.js');
require('../src/traveler-art.js');require('../src/companion-art.js');
const S=require('../src/story-art.js');
const C=global.RealmCompanionArt;
// traveler-cloth is the rig's own coat batch, which the world already submits.
const KINDS=new Set(['box','round','octa','disc','ring','capsule','traveler-cloth',...global.RealmBodyMeshes.kinds]);
const BUDGET=120;
const plain=v=>JSON.parse(JSON.stringify(v,(k,x)=>ArrayBuffer.isView(x)?Array.from(x):x));
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const builders={
 regent:t=>S.regent(3,0,-2,.6,t),
 envoy:t=>S.envoy(3,0,-2,.6,t),
 briarFalse:t=>S.briarFalse(3,0,-2,.6,t),
 severingDevice:t=>S.severingDevice(3,0,-2,.6,t),
 chain:t=>S.chain(3,1.2,-2,.6,t,[-3,1.2,4]),
};

test('capsule is a closed smooth-normal limb whose tips meet the box faces',()=>{
 const d=E.geometry('capsule'),edges=new Map(),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 assert.equal(d.length%18,0,'whole triangles');
 const key=p=>p.map(n=>n.toFixed(6)).join(',');
 for(let i=0;i<d.length;i+=18){
  const v=[0,6,12].map(j=>({p:[d[i+j],d[i+j+1],d[i+j+2]],n:[d[i+j+3],d[i+j+4],d[i+j+5]]}));
  const cross=E.cross(E.sub(v[1].p,v[0].p),E.sub(v[2].p,v[0].p));
  assert.ok(Math.hypot(...cross)>1e-9,'nondegenerate triangle');
  for(const q of v){
   assert.ok([...q.p,...q.n].every(Number.isFinite));
   assert.ok(Math.abs(Math.hypot(...q.n)-1)<1e-5,'unit normal');
   assert.ok(E.dot(q.p,q.n)>0,'outward normal on a convex body about the origin');
   for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],q.p[j]);hi[j]=Math.max(hi[j],q.p[j]);}
  }
  for(let j=0;j<3;j++){
   const a=v[j],b=v[(j+1)%3],k=[key(a.p),key(b.p)].sort().join('|'),e=edges.get(k)||{count:0,orientation:0};
   e.count++;e.orientation+=key(a.p)<key(b.p)?1:-1;edges.set(k,e);
  }
 }
 for(const e of edges.values()){assert.equal(e.count,2,'closed manifold edge');assert.equal(e.orientation,0,'opposite edge winding');}
 for(let j=0;j<3;j++){assert.ok(Math.abs(lo[j]+.5)<1e-6&&Math.abs(hi[j]-.5)<1e-6,'unit envelope on axis '+j);}
});

test('every story builder returns finite, named instances inside the budget',()=>{
 for(const [name,build] of Object.entries(builders))for(const t of [0,.37,2.9]){
  const parts=build(t);
  assert.ok(Array.isArray(parts)&&parts.length>=4&&parts.length<=BUDGET,name+' budget '+parts.length);
  for(const it of parts){
   assert.ok(KINDS.has(it.kind),name+' kind '+it.kind);
   assert.ok(it.kind==='body-hidden'||(E.geometry(it.kind).length>0&&E.geometry(it.kind).length%6===0),name+' geometry '+it.kind);
   assert.ok(it.p.length===3&&it.p.every(Number.isFinite),name+' p '+it.storyPart);
   assert.ok(it.s.length===3&&it.s.every(n=>Number.isFinite(n)&&n>0),name+' s '+it.storyPart);
   assert.equal(it.m.length,16);assert.ok(Array.from(it.m).every(Number.isFinite),name+' m '+it.storyPart);
   assert.ok(E.hex(it.c).every(n=>Number.isFinite(n)&&n>=0&&n<=1),name+' colour '+it.storyPart);
   assert.ok(it.rough>=0&&it.rough<=1,name+' rough '+it.storyPart);
   assert.ok(it.em>=0&&it.em<=1,name+' em '+it.storyPart);
   assert.equal(it.cameraSolid,false);assert.equal(it.cutaway,false);
   assert.ok(typeof it.storyPart==='string'&&it.storyPart.length>0,name+' named');
  }
 }
});

test('a frame is a pure function of its inputs, and t moves each figure only subtly',()=>{
 for(const [name,build] of Object.entries(builders)){
  const a=build(1.25),b=build(1.25),c=build(2.75);
  assert.deepEqual(plain(a),plain(b),name+' is deterministic');
  assert.notDeepEqual(plain(a),plain(c),name+' animates');
  assert.equal(a.length,c.length,name+' keeps its parts across t');
  const worst=Math.max(...a.map((it,i)=>dist(it.p,c[i].p)));
  assert.ok(worst<.8,name+' largest move '+worst.toFixed(3)+' m');
 }
});

test('figures stand on their base, reach their height and face the way they yaw',()=>{
 for(const [name,height] of [['regent',2.1],['envoy',1.9]]){
  const parts=builders[name](0),feet=Math.min(...parts.map(it=>it.p[1])),top=Math.max(...parts.map(it=>it.p[1]));
  assert.ok(feet>-.05&&feet<.25,name+' feet '+feet.toFixed(3));
  assert.ok(top>=height,name+' top '+top.toFixed(3));
  const nose=parts.find(it=>it.storyPart==='nose'),head=parts.find(it=>it.storyPart==='head');
  const ahead=[nose.p[0]-head.p[0],nose.p[2]-head.p[2]];
  assert.ok(ahead[0]*Math.sin(.6)+ahead[1]*Math.cos(.6)>0,name+' faces its yaw');
 }
});

test('the regent carries the coat, the cinder crown, the seams and the smile',()=>{
 const parts=builders.regent(0);
 assert.equal(parts.filter(it=>/^ember-/.test(it.storyPart)).length,7,'seven small ember points on the circlet');
 assert.equal(parts.filter(it=>/^seam-/.test(it.storyPart)&&it.em>.2).length,2,'two ember-lit placket seams');
 assert.equal(parts.filter(it=>it.storyPart==='coat').length,1,'one baked coat shell from the chest to below the knee');
 assert.ok(parts.some(it=>it.storyPart==='circlet'),'a circlet on the brow, not a spiked crown');
 assert.ok(parts.some(it=>/^smile-/.test(it.storyPart)),'a smile');
 assert.ok(!parts.some(it=>it.storyPart==='mouth'),'the rig mouth gives way to the smile');
});

test('the envoy carries folded wings of light, a halo and motes',()=>{
 const parts=builders.envoy(0);
 assert.equal(parts.filter(it=>/^feather-/.test(it.storyPart)).length,12,'six layered feathers a side');
 assert.equal(parts.filter(it=>it.storyPart==='halo').length,1);
 assert.equal(parts.filter(it=>/^mote-/.test(it.storyPart)).length,6);
 assert.ok(parts.filter(it=>/^feather-/.test(it.storyPart)).every(it=>it.em>=.7),'the feathers glow');
});

test('briarFalse is the real Briar with a cleaner coat, a cold glow and no wear',()=>{
 const real=C.parts({x:3,z:-2,base:0,yaw:.6,bonded:true},C.pose({bonded:true,time:1.25,phase:0,blend:0}));
 const fake=S.briarFalse(3,0,-2,.6,1.25),body=fake.filter(it=>it.storyPart!=='cold-glow');
 assert.equal(body.length,real.length,'the same silhouette, part for part');
 assert.deepEqual(body.map(it=>it.storyPart),real.map(it=>it.companionPart));
 real.forEach((r,i)=>{assert.deepEqual(body[i].p,r.p);assert.deepEqual(body[i].s,r.s);});
 const lum=c=>(c>>16&255)+(c>>8&255)+(c&255);
 const bodyReal=real.find(it=>it.companionPart==='body').c,bodyFake=body.find(it=>it.storyPart==='body').c;
 assert.ok(lum(bodyFake)>lum(bodyReal),'a brighter coat');
 assert.ok(fake.find(it=>it.storyPart==='cold-glow').em>0,'a cold glow on the ground');
 assert.ok(body.filter(it=>/eye/.test(it.storyPart)).every(it=>it.em>0),'cold-lit eyes');
});

test('the severing device turns its ring and keeps its ember hot',()=>{
 const parts=builders.severingDevice(0);
 assert.equal(parts.filter(it=>/^tooth-/.test(it.storyPart)).length,6);
 assert.ok(parts.find(it=>it.storyPart==='ember-core').em>.85,'a hot core');
 assert.equal(parts.filter(it=>it.kind==='ring').length,1,'one ring');
});

test('the chain runs between its two points with glowing anchors',()=>{
 const A=[0,1.4,0],B=[4,.9,-3],links=S.chain(0,1.4,0,0,0,B);
 const near=q=>Math.min(...links.map(it=>dist(it.p,q)));
 assert.ok(near(A)<.02&&near(B)<.02,'both ends are linked');
 assert.ok(links.length>=6&&links.length<=57,'link count '+links.length);
 assert.ok(links[0].em>0&&links.at(-1).em>0&&links.slice(1,-1).every(it=>it.em===0),'only the anchors glow');
 const deep=S.chain(0,2,0,0,0,[0,.5,0]);
 assert.ok(deep.every(it=>Array.from(it.m).every(Number.isFinite)),'a vertical chain stays finite');
});

test('draw files each instance under its own kind and reports the count',()=>{
 const out={box:[]},parts=builders.severingDevice(0);
 assert.equal(S.draw(out,parts),parts.length);
 assert.equal(Object.values(out).flat().length,parts.length);
 assert.ok(out.capsule.length>0&&out.ring.length>0&&out.box.length>0);
});
