/* Data/actual emitted geometry checks only. No personal saves or browser/GPU;
 * shared travel, physics and persistence callers have their own integration gates. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const W=require('../src/world-atlantis-earth.js');
const [earth,sea]=W.realms,R=.31,BODY=1.7,G=1.57;
const eps=1e-8;
const inside=(x,z,p,r=0)=>Math.abs(x-p.x)<=p.w/2-r+eps&&Math.abs(z-p.z)<=p.d/2-r+eps;
const offsets=[[0,0],[R,0],[-R,0],[0,R],[0,-R],[R/Math.sqrt(2),R/Math.sqrt(2)],[-R/Math.sqrt(2),R/Math.sqrt(2)],[R/Math.sqrt(2),-R/Math.sqrt(2)],[-R/Math.sqrt(2),-R/Math.sqrt(2)]];
const walkable=(d,x,z)=>offsets.every(([dx,dz])=>d.patches.some(p=>inside(x+dx,z+dz,p)))&&!d.solids.some(s=>inside(x,z,s,-R));
function unique(records,label){assert.equal(new Set(records.map(r=>r.id)).size,records.length,label);}
function interval(a,b,lo,hi){
 let start=0,end=1;
 for(let i=0;i<a.length;i++){
  const delta=b[i]-a[i];
  if(Math.abs(delta)<eps){if(a[i]<lo[i]-eps||a[i]>hi[i]+eps)return null;}
  else {const p=(lo[i]-a[i])/delta,q=(hi[i]-a[i])/delta;start=Math.max(start,Math.min(p,q));end=Math.min(end,Math.max(p,q));if(start>end+eps)return null;}
 }
 return [start,end];
}
function drySegment(d,a,b){
 for(const s of d.solids){
  assert.equal(interval(a,b,[s.x-s.w/2-R,s.z-s.d/2-R],[s.x+s.w/2+R,s.z+s.d/2+R]),null,`solid blocks route: ${s.id}`);
 }
 for(const [dx,dz] of offsets){
  const spans=d.patches.map(p=>interval([a[0]+dx,a[1]+dz],[b[0]+dx,b[1]+dz],[p.x-p.w/2,p.z-p.d/2],[p.x+p.w/2,p.z+p.d/2])).filter(Boolean).sort((a,b)=>a[0]-b[0]);
  let end=0;
  for(const [lo,hi] of spans){assert.ok(lo<=end+eps,`unsupported segment before ${lo}`);end=Math.max(end,hi);}
  assert.ok(end>=1-eps,'complete radius-offset segment has supported ground');
 }
}
function deepFrozen(o){if(o&&typeof o==='object'){assert.ok(Object.isFrozen(o));Object.values(o).forEach(deepFrozen);}}
function frozen(o){if(o&&typeof o==='object'){Object.values(o).forEach(frozen);Object.freeze(o);}return o;}
function record(def,claimed=false){
 const parts=[],sim=frozen({room:def.room,state:{journeys:{version:1,realms:{[def.id]:{firstClaimed:claimed}}},player:{x:def.entry.x,z:def.entry.z,yaw:def.entry.yaw},adventure:{xp:123,inventory:{ore:7}},settings:{reducedMotion:true}}});
 const before=JSON.stringify(sim),height=(x,z)=>{assert.ok(Number.isFinite(x)&&Number.isFinite(z));return G;};
 const add=(kind,x,y,z,w,h,d,color,opt={})=>parts.push({kind,p:[x,y,z],s:[w,h,d],color,opt});
 const art=new Proxy({add,box:(...args)=>add('box',...args)}, {
  get(target,key){if(key==='begin'||key==='commit'||key==='dispatch'||key==='e')throw Error('art has no scene/save authority');return target[key];},
  set(){throw Error('decoration cannot reconfigure its caller');}
 });
 const result=W.decorate(art,def,{height,sim,rng:()=>{throw Error('unbudgeted nondeterminism');}});
 assert.equal(JSON.stringify(sim),before);assert.equal(result.instances,parts.length);
 return parts;
}

test('exact two canonical realms have finite, unique, immutable data and stable work identities',()=>{
 assert.deepEqual(W.realms.map(d=>[d.id,d.room]),[['earthlands','world-earthlands'],['atlantis','world-atlantis']]);
 assert.equal(globalThis.RealmWorldAtlantisEarth,W);deepFrozen(W.realms);
 for(const d of W.realms){
  for(const collection of [d.patches,d.solids,d.points,d.routes,d.enemies||[],d.dive?.solids||[],d.dive?.dryCourts||[]])unique(collection,d.id);
  const finite=o=>{for(const [k,v] of Object.entries(o)){if(typeof v==='number')assert.ok(Number.isFinite(v),`${d.id}:${k}`);else if(v&&typeof v==='object')finite(v);}};finite(d);
  for(const p of [...d.patches,...d.solids,...(d.dive?.solids||[])])assert.ok(p.w>0&&p.d>0&&(!('h' in p)||p.h>0));
  assert.equal(d.quest.id,`${d.id}-opening-v1`);assert.deepEqual(d.quest.objectives.map(o=>o.id),['first','second','third']);
  assert.equal(d.points.find(p=>p.id===d.quest.giverId)?.kind,'person');
  for(const o of d.quest.objectives){assert.equal(o.kind,'interact');assert.equal(d.points.find(p=>p.id===o.pointId)?.kind,'objective');}
  for(const n of Object.values(d.quest.reward))assert.ok(Number.isSafeInteger(n)&&n>=0&&n<100);
 }
 assert.match(earth.sourceNotes,/provisional/);assert.match(sea.sourceNotes,/campaign remains unresolved/);
});

test('module load publishes only its declared API and never reads a simulation or host service',()=>{
 const source=fs.readFileSync(require.resolve('../src/world-atlantis-earth.js'),'utf8');
 const sandbox={module:{exports:{}},sentinel:{value:7}};
 for(const key of ['fetch','localStorage','document','RealmCore','RealmAdventure'])Object.defineProperty(sandbox,key,{get(){throw Error(`unexpected ${key}`);}});
 vm.runInNewContext(source,sandbox,{timeout:1000});
 assert.deepEqual(Object.keys(sandbox).sort(),['RealmWorldAtlantisEarth','module','sentinel']);
 assert.equal(sandbox.module.exports,sandbox.RealmWorldAtlantisEarth);assert.equal(sandbox.sentinel.value,7);
});

test('every entry and interaction anchor has full actor clearance on bounded dry ground',()=>{
 for(const d of W.realms)for(const p of [d.entry,...d.points]){
  assert.ok(p.x>=d.bounds.minX&&p.x<=d.bounds.maxX&&p.z>=d.bounds.minZ&&p.z<=d.bounds.maxZ,`${d.id}:${p.id}`);
  assert.ok(walkable(d,p.x,p.z),`${d.id}:${p.id} is reachable dry ground`);
 }
 assert.ok(walkable(earth,0,55));assert.equal(walkable(earth,12,55),false,'bridge side is water, not an invisible shelf');
 assert.equal(walkable(earth,0,-20),false,'two woodland approaches remain geographically distinct');
 assert.equal(walkable(sea,8,-29),false,'scenic gallery is not a dry walking patch');
});

test('both Earth approaches, work loop and optional side routes have analytically continuous ground',()=>{
 for(const r of earth.routes)for(let i=1;i<r.points.length;i++)drySegment(earth,r.points[i-1],r.points[i]);
 assert.throws(()=>drySegment(earth,[0,19],[-10,15]),/bridge-west-rail/,'turning through a rail is detected');
 assert.ok(earth.routes.find(r=>r.id==='west-road').points.some(p=>p[0]===-10));
 assert.ok(earth.routes.find(r=>r.id==='east-road').points.some(p=>p[0]===14));
 const bridge=earth.patches.find(p=>p.id==='channel-bridge');assert.equal(bridge.d,76);assert.equal(bridge.y,G);
 const enemy=earth.enemies[0];assert.ok(walkable(earth,enemy.x,enemy.z));
 assert.equal(enemy.xp+enemy.ore+enemy.coins,0,'ordinary encounter does not invent an extra reward stream');
 assert.ok(Math.abs(enemy.x+10)>18,'optional coppice threat lies off the free main road');
});

test('Farwake work and the far landing remain connected without diving or a closed civic back wall',()=>{
 for(const r of sea.routes)for(let i=1;i<r.points.length;i++)drySegment(sea,r.points[i-1],r.points[i]);
 assert.ok(walkable(sea,-3,-21.8),'physical opening in civic back wall');
 assert.equal(walkable(sea,7,-21.8),false,'the remainder of the back wall remains actual cover');
 for(const o of sea.quest.objectives){const p=sea.points.find(p=>p.id===o.pointId);assert.ok(walkable(sea,p.x,p.z));assert.equal(p.kind,'objective');}
 assert.equal(sea.enemies,undefined,'gallery foundation does not pretend to implement submerged encounters');
});

test('bounded gallery route clears physical walls and full body depth, including the real court doorway',()=>{
 const d=sea.dive;
 assert.equal(d.surfaceY,.01);assert.equal(d.minY,-2.7);assert.equal(d.maxY,-.25);
 assert.ok(d.maxY+BODY<1.46,'full body stays below shared dry-deck underside');
 assert.ok(sea.patches.every(p=>p.y===G),'lower bed and court are separate supported physics, not a false dry patch');
 for(const c of d.dryCourts){assert.equal(c.floorY,c.minY);assert.ok(c.maxY-c.floorY>BODY);assert.ok(inside(c.x,c.z,d.volume));}
 const entry=d.entry;assert.ok(inside(entry.x,entry.z,d.volume,R));
 for(const r of d.routes)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i];
  for(const p of [a,b]){assert.ok(inside(p[0],p[2],d.volume,R));assert.ok(p[1]>=d.minY&&p[1]<=d.maxY);}
  for(const s of d.solids){
   const hit=interval(a,b,[s.x-s.w/2-R,s.y-BODY+eps,s.z-s.d/2-R],[s.x+s.w/2+R,s.y+s.h-eps,s.z+s.d/2+R]);
   assert.equal(hit,null,`${s.id} blocks the full body`);
  }
 }
 assert.ok(inside(8,-32,d.dryCourts[0],R),'route actually enters the lower court');
 const left=d.solids.find(s=>s.id==='bellglass-entry-west'),right=d.solids.find(s=>s.id==='bellglass-entry-east');
 assert.ok(right.x-right.w/2-(left.x+left.w/2)>R*2+2,'the doorway is a real wide opening');
 assert.notEqual(interval([4.62,-2.7,-32],[4.62,-2.7,-36],[4.62-.12-R,-2.7-BODY,-37.5-R],[4.62+.12+R,.5,-30.5+R]),null,'crossing a real court wall is detected');
});

test('dive entry and wet exit anchors agree with reachable transfer destinations',()=>{
 const d=sea.dive,entry=sea.points.find(p=>p.id===d.entryId),exit=sea.points.find(p=>p.id===d.exitId);
 assert.equal(entry.kind,'dive');assert.equal(exit.kind,'dive');assert.ok(walkable(sea,entry.x,entry.z));assert.ok(walkable(sea,exit.x,exit.z));
 assert.ok(walkable(sea,d.exit.x,d.exit.z),'exit transfer is qualified dry ground');
 const last=d.routes[0].points.at(-1);
 assert.ok(Math.hypot(last[0]-exit.x,last[2]-exit.z)<2.6,'wet exit is within ordinary interaction reach');
 assert.ok(Math.hypot(last[0]-d.exit.x,last[2]-d.exit.z)>2.6,'separate landing anchor is necessary');
});

test('actual decoration is finite, deterministic, bounded and pure across claimed/unclaimed worlds',()=>{
 const kinds=new Set(['box','cylinder','cone','roof','round','leaf','ring','mountain']);
 for(const def of W.realms)for(const claimed of [false,true]){
  const parts=record(def,claimed);assert.ok(parts.length<1500);assert.deepEqual(parts,record(def,claimed));
  for(const p of parts){assert.ok(kinds.has(p.kind));assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));assert.ok(Number.isInteger(p.color));assert.equal(p.opt.cameraSolid,false);if(p.opt.skyImage)assert.equal(p.opt.cutaway,false);}
  assert.equal(parts.filter(p=>p.kind==='person').length,0,'canonical dynamic people belong to the shared caller');
 }
 assert.notDeepEqual(record(earth,false),record(earth,true),'claimed local visual detail follows durable caller state');
 assert.notDeepEqual(record(sea,false),record(sea,true),'claimed instrument detail follows durable caller state');
});

test('roofs and important structural decoration agree with the canonical solid footprints',()=>{
 for(const def of W.realms){
  const parts=record(def);
  for(const p of parts.filter(p=>p.kind==='roof')){
   const s=def.solids.find(s=>s.id===p.opt.structureId);assert.ok(s);
   assert.equal(p.p[0],s.x);assert.equal(p.p[2],s.z);assert.equal(p.s[0],s.w);assert.equal(p.s[2],s.d);assert.equal(p.p[1],G+s.h);
  }
  for(const p of parts.filter(p=>p.kind==='box'&&p.opt.solidId)){
   const s=def.solids.find(s=>s.id===p.opt.solidId);assert.ok(s,p.opt.solidId);
   // Face trim is allowed a small projection. Large arbitrary walls are not.
   assert.ok(Math.abs(p.p[0]-s.x)+p.s[0]/2<=s.w/2+.12,`${s.id} X footprint`);
   assert.ok(Math.abs(p.p[2]-s.z)+p.s[2]/2<=s.d/2+.12,`${s.id} Z footprint`);
  }
 }
 const canopy=record(sea).find(p=>p.opt.structureId==='farwake-civic-canopy');assert.ok(canopy.p[1]-canopy.s[1]/2>G+BODY);
 const gallery=sea.dive.volume;
 for(const p of record(sea).filter(p=>p.p[1]<G&&p.kind==='round'))assert.equal(inside(p.p[0],p.p[2],gallery,-Math.max(p.s[0],p.s[2])/2),false,'scenic opaque rocks stay outside the navigable gallery');
});
