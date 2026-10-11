/* Data/actual emitted geometry checks only. No personal saves or browser/GPU;
 * shared travel, physics and persistence callers have their own integration gates. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
require('../src/coastward-settlement-art.js');
require('../src/coastward-woodland-art.js');
const W=require('../src/world-atlantis-earth.js');
const E=require('../src/engine.js');
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
 const sandbox={module:{exports:{}},sentinel:{value:7},RealmElderwealdWorld:require('../src/elderweald-world.js')};
 for(const key of ['fetch','localStorage','document','RealmCore','RealmAdventure'])Object.defineProperty(sandbox,key,{get(){throw Error(`unexpected ${key}`);}});
 vm.runInNewContext(source,sandbox,{timeout:1000});
 assert.deepEqual(Object.keys(sandbox).sort(),['RealmElderwealdWorld','RealmWorldAtlantisEarth','module','sentinel']);
 assert.equal(sandbox.module.exports,sandbox.RealmWorldAtlantisEarth);assert.equal(sandbox.sentinel.value,7);
});

test('every entry and interaction anchor has full actor clearance on bounded dry ground',()=>{
 for(const d of W.realms)for(const p of [d.entry,...d.points]){
  assert.ok(p.x>=d.bounds.minX&&p.x<=d.bounds.maxX&&p.z>=d.bounds.minZ&&p.z<=d.bounds.maxZ,`${d.id}:${p.id}`);
  assert.ok(walkable(d,p.x,p.z),`${d.id}:${p.id} is reachable dry ground`);
 }
 assert.ok(walkable(earth,0,55));assert.equal(walkable(earth,12,55),false,'bridge side is water, not an invisible shelf');
 assert.equal(walkable(earth,0,-20),true,'the authored woodland floor now physically joins both retained approaches');
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
 const kinds=new Set(['box','cylinder','cone','roof','round','octa','leaf','ring','mountain-ridge','country-ridge','timber-panel']);
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
   assert.equal(p.p[0],s.x);assert.equal(p.p[2],s.z);
   if(p.opt.settlementPart==='roof-shell'){
    assert.equal(def.id,'earthlands');assert.ok(['west-house','east-house','field-store'].includes(s.id));
    assert.equal(p.s[0],s.w+.56);assert.equal(p.s[2],s.d+.5);assert.equal(p.p[1],G+s.h+.03);
    assert.equal(p.s[1],s.h*.28);assert.equal(p.opt.appearanceOnly,true);
   }else {assert.equal(p.s[0],s.w);assert.equal(p.s[2],s.d);assert.equal(p.p[1],G+s.h);}
  }
  for(const p of parts.filter(p=>p.kind==='box'&&p.opt.solidId)){
   const s=def.solids.find(s=>s.id===p.opt.solidId);assert.ok(s,p.opt.solidId);
   // Face trim is allowed a small projection. Large arbitrary walls are not.
   const projection=p.opt.settlementPart?.16:.12;
   assert.ok(Math.abs(p.p[0]-s.x)+p.s[0]/2<=s.w/2+projection,`${s.id} X footprint`);
   assert.ok(Math.abs(p.p[2]-s.z)+p.s[2]/2<=s.d/2+projection,`${s.id} Z footprint`);
  }
 }
 const canopy=record(sea).find(p=>p.opt.structureId==='farwake-civic-canopy');assert.ok(canopy.p[1]-canopy.s[1]/2>G+BODY);
 const gallery=sea.dive.volume;
 for(const p of record(sea).filter(p=>p.p[1]<G&&p.kind==='round'))assert.equal(inside(p.p[0],p.p[2],gallery,-Math.max(p.s[0],p.s[2])/2),false,'scenic opaque rocks stay outside the navigable gallery');
});

test('civic side support physically meets the canopy underside across its full length',()=>{
 const parts=record(sea),roof=parts.find(p=>p.opt.structureId==='farwake-civic-canopy'),underside=roof.p[1]-roof.s[1]/2;
 for(const id of ['farwake-court-west','farwake-court-east']){
  const s=sea.solids.find(s=>s.id===id);assert.ok(G+s.h>=underside-eps,`${id} physical support is too short`);
  const cap=parts.find(p=>p.kind==='box'&&p.opt.supportCap===id);assert.ok(cap,`${id} has an aligned cap`);
  assert.ok(Math.abs(cap.p[1]+cap.s[1]/2-underside)<eps,'cap touches rather than floats below the roof');
  const columns=parts.filter(p=>p.opt.supportColumn===id);assert.equal(columns.length,3);
  for(const p of columns)assert.ok(Math.abs(p.p[1]+p.s[1]/2-underside)<eps,'visible columns reach the same support plane');
 }
});

test('the real Farwake civic canopy participates in the existing preference-controlled shelter reveal',()=>{
 const before=JSON.stringify(sea),parts=record(sea),canopies=parts.filter(p=>p.opt.structureId==='farwake-civic-canopy');
 assert.equal(canopies.length,1);const p=canopies[0];
 assert.equal(p.opt.worldRoof,'farwake-civic-canopy','a nearby public record must not remain outside the narrow traveller aperture under an untagged roof');
 assert.equal(p.opt.cutaway,true);assert.equal(p.opt.cameraSolid,false);
 assert.deepEqual(p.p,[0,G+4.1,-12]);assert.deepEqual(p.s,[27,.2,19.7]);
 assert.equal(JSON.stringify(sea),before,'view metadata never changes support, walls, controls, history or collision');
});

test('bridge timber skins use the real UV mesh, clear every retained joint and stay above only existing deck',()=>{
 const parts=record(earth),skins=parts.filter(p=>p.opt.bridgeSkin),joints=parts.filter(p=>p.opt.bridgeJoint),bridge=earth.patches.find(p=>p.id==='channel-bridge');
 assert.equal(skins.length,51);assert.equal(joints.length,50);
 const mesh=E.geometry('timber-panel');assert.equal(mesh.length,36*8,'existing timber-panel is the box with UVs');
 assert.ok(Array.from(mesh).every(Number.isFinite));
 const uv=Array.from({length:mesh.length/8},(_,i)=>[mesh[i*8+6],mesh[i*8+7]]);
 assert.ok(uv.every(([u,v])=>u>=.1-1e-6&&u<=.2+1e-6&&v>=0&&v<=1),'existing one-board strip UV range is preserved');
 assert.ok(new Set(uv.map(p=>p[0])).size>1&&new Set(uv.map(p=>p[1])).size>1,'both UV dimensions vary; a plain fallback box would not carry this material mapping');
 for(let i=0;i<skins.length;i++){
  const p=skins[i],lo=p.p[2]-p.s[2]/2,hi=p.p[2]+p.s[2]/2;
  assert.equal(p.kind,'timber-panel');assert.ok(p.p[1]-p.s[1]/2>bridge.y,'no coplanar duplicate of the generic deck');
  assert.ok(p.p[1]+p.s[1]/2<=bridge.y+.03+eps);assert.ok(Math.abs(p.p[0])+p.s[0]/2<3.495,'skin stays inside the unchanged rail inner faces');
  assert.ok(lo>=bridge.z-bridge.d/2-eps&&hi<=bridge.z+bridge.d/2+eps);
  for(const j of joints)assert.ok(hi<=j.p[2]-j.s[2]/2+eps||lo>=j.p[2]+j.s[2]/2-eps,'plank gap joint remains uncovered');
  if(i)assert.ok(skins[i-1].p[2]+skins[i-1].s[2]/2<lo,'adjacent skin faces do not overlap');
 }
 for(const j of joints){assert.equal(j.s[0],6.7);assert.equal(j.s[1],.025);assert.equal(j.s[2],.045);assert.equal(j.p[1],G+.018);}
});

test('narrow field path geometry lies wholly on supported clear ground and door faces remain closed decoration',()=>{
 const parts=record(earth),seams=parts.filter(p=>p.opt.pathSeam),doors=parts.filter(p=>p.opt.closedDoor);
 assert.ok(seams.length>=4&&seams.length<15,'a small authored path, not bulk floor regeneration');
 for(const p of seams){
  assert.ok(p.s[0]<=.12&&p.s[1]<=.014);assert.ok(p.p[1]+p.s[1]/2<=G+.03);
  const m=E.M.compose(...p.p,...p.s,...p.opt.r),mesh=E.geometry('box');
  for(let i=0;i<mesh.length;i+=6){const [x,,z]=E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]);assert.ok(walkable(earth,x,z),'every actual rotated path vertex remains on clear existing ground');}
 }
 assert.deepEqual(doors.map(p=>p.opt.solidId).sort(),['east-house','field-store','west-house']);
 for(const p of doors){
  const s=earth.solids.find(s=>s.id===p.opt.solidId);assert.equal(p.kind,'timber-panel');assert.equal(p.p[0],s.x);
  const m=p.opt.m||E.M.compose(...p.p,...p.s,...p.opt.r),mesh=E.geometry(p.kind),ys=[];
  for(let i=0;i<mesh.length;i+=8){const [x,y,z]=E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]);ys.push(y);assert.ok(x>=s.x-s.w/2&&x<=s.x+s.w/2);assert.ok(z>=s.z+s.d/2&&z<s.z+s.d/2+.12);}
  assert.ok(Math.abs(Math.min(...ys)-(G+.12))<1e-6,'vertical-grain door meets the authored supported sill');
 }
 assert.equal(earth.points.filter(p=>/door|house entrance/i.test(p.id)).length,0,'closed facade does not advertise an unimplemented interior');
});

test('distant ridges use the actual mountain mesh and remain outside Earth rather than becoming false paths',()=>{
 const ridges=record(earth).filter(p=>p.kind==='mountain-ridge');assert.equal(ridges.length,10);
 for(const p of ridges){
  const mesh=E.geometry(p.kind),ys=[];for(let i=1;i<mesh.length;i+=6)ys.push(mesh[i]);
  assert.ok(new Set(ys.map(y=>y.toFixed(4))).size>20,'real asymmetric ridge heights; unknown kinds silently fall back to a cylinder');
  assert.ok(p.p[0]+p.s[0]/2<earth.bounds.minX||p.p[0]-p.s[0]/2>earth.bounds.maxX||p.p[2]+p.s[2]/2<earth.bounds.minZ||p.p[2]-p.s[2]/2>earth.bounds.maxZ);
  assert.equal(p.opt.cameraSolid,false);assert.equal(p.opt.cutaway,false);assert.equal(E.solidBounds(p.kind,{p:p.p,s:p.s,...p.opt}),null);
  const m=E.M.compose(...p.p,...p.s,...(p.opt.r||[0,0,0]));
  for(let i=0;i<mesh.length;i+=6){const[x,,z]=E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]);assert.ok(x<earth.bounds.minX||x>earth.bounds.maxX||z<earth.bounds.minZ||z>earth.bounds.maxZ,'every rotated vista vertex stays outside physical country');}
 }
 assert.ok(ridges.some(p=>p.p[0]>earth.bounds.maxX&&p.p[2]>17&&p.p[2]<93),'channel side view has distant mountains across the water');
 assert.equal(record(earth).some(p=>p.kind==='mountain'),false,'unsupported fallback kind is gone');
 const channel=ridges.filter(p=>p.opt.vista==='channel-east');assert.equal(channel.length,8);
 assert.deepEqual([0,1,2].map(layer=>channel.filter(p=>p.opt.vistaLayer===layer).length),[3,3,2]);
 assert.equal(new Set(channel.map(p=>p.color)).size,3);assert.ok(channel.every(p=>p.opt.skyImage));
 assert.equal(ridges.reduce((n,p)=>n+E.geometry(p.kind).length/18,0),3360,'bounded existing mesh budget across all passes');
});

/* Western skyline source/geometry/transport checks. Synthetic GL records CPU
 * submissions only; these checks do not compile shaders or prove a GPU image. */
function countryCpuGL(){
 const calls=[];let id=0;
 const gl=new Proxy({ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,FLOAT:4,TRIANGLES:5,
  TEXTURE0:6,TEXTURE_2D:7,TEXTURE3:8,TEXTURE4:9}, {get(o,k){
  if(k in o)return o[k];
  if(k==='createBuffer'||k==='createVertexArray')return()=>({id:++id});
  return(...args)=>calls.push([k,...args]);
 }});
 const host=Object.create(E.Engine.prototype);
 Object.assign(host,{gl,meshes:new Map(),batches:[],dynamic:[],cameraSolids:[],calls:0,
  canvas:{clientWidth:1440,clientHeight:960},camera:{eye:[-150,5,-78.5],target:[-157.5,2.17,-78.5]},
  lightVP:E.M.identity(),theme:'earth',quality:'balanced',surfaceMaterialInfo:{ready:false},shadowSize:2048});
 return{host,calls};
}
const countryItems=parts=>parts.map(p=>({p:p.p,s:p.s,c:p.color,...p.opt}));

test('actual geometry shader keeps world fog for country sky images without extending positive-X mountain haze',()=>{
 const source=fs.readFileSync(require.resolve('../src/engine.js'),'utf8'),shader=source.match(/const FS=`([\s\S]*?)`;/)[1];
 assert.ok(shader.includes('uniform float uCutaway,uCountryRidge,uMountainHaze,uRailCutaway'));
 assert.ok(shader.includes('if(vParams.z>2.5&&uCountryRidge<.5)fog=0.;'),'country sky-image branch must retain its world fog');
 assert.ok(shader.includes('length(vPos.xz-uWorldFog.xy)-uWorldFog.z'),'existing ground-focus distance remains the only country haze coordinate');
 assert.ok(shader.includes('if(uMountainHaze>.5)'),'positive-X authored haze still belongs to original mountain submissions only');
 assert.equal((shader.match(/texture\(/g)||[]).length,3,'no additional material or atmosphere texture samples');
});

test('western country skyline adds exactly three scenic actual ridge meshes outside every rotated country bound',()=>{
 const expectedColors=new Set([0x65796c,0x83938a,0xa1aba2]);
 for(const claimed of [false,true]){
  const all=record(earth,claimed),parts=all.filter(p=>p.kind==='country-ridge');
  assert.equal(parts.length,3);assert.equal(all.filter(p=>p.kind==='mountain-ridge').length,10);
  assert.deepEqual(parts.map(p=>p.opt.vistaLayer),[0,1,2]);
  assert.equal(parts.reduce((n,p)=>n+E.geometry(p.kind).length/18,0),1008);
  for(const p of parts){
   assert.deepEqual(E.geometry(p.kind),E.geometry('mountain-ridge'),'explicit alias cannot use the unknown-kind cylinder fallback');
   assert.equal(p.opt.appearanceOnly,true);assert.equal(p.opt.skyImage,true);assert.equal(p.opt.vista,'country-west');
   assert.equal(p.opt.cameraSolid,false);assert.equal(p.opt.cutaway,false);assert.ok(expectedColors.has(p.color));
   assert.equal(E.solidBounds(p.kind,{p:p.p,s:p.s,...p.opt}),null);
   const mesh=E.geometry(p.kind),m=E.M.compose(...p.p,...p.s,...p.opt.r);
   for(let i=0;i<mesh.length;i+=6){
    const v=E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]);
    assert.ok(v.every(Number.isFinite));assert.ok(v[0]<earth.bounds.minX,'all transformed vertices remain strictly west of supported terrain');
    assert.ok(v[0]<=-171+1e-5,'at least one metre of visual boundary clearance');
    assert.ok(Math.abs(Math.hypot(mesh[i+3],mesh[i+4],mesh[i+5])-1)<1e-5,'finite unit face normals');
   }
  }
  assert.deepEqual(parts,record(earth,!claimed).filter(p=>p.kind==='country-ridge'),'appearance has no claimed reward dependency');
 }
 assert.equal(record(sea).filter(p=>p.kind==='country-ridge').length,0,'no Atlantis scene change');
 assert.throws(()=>W.decorate({add(){},box(){}},{...earth}),/canonical|authored|Unknown/,'cloned definitions still refuse');
});

test('country ridge batch retains a semantic kind while sharing the original cached ridge buffer and no camera solids',()=>{
 const {host,calls}=countryCpuGL(),old=host.batch('mountain-ridge',countryItems(record(earth).filter(p=>p.kind==='mountain-ridge'))),
  ridge=host.batch('country-ridge',countryItems(record(earth).filter(p=>p.kind==='country-ridge')));
 assert.equal(old.kind,'mountain-ridge');assert.equal(ridge.kind,'country-ridge');
 assert.equal(ridge.geom,old.geom);assert.equal(host.meshes.size,1);assert.equal(host.meshes.get('mountain-ridge'),old.geom);
 assert.equal(ridge.geom.count,1008);assert.equal(ridge.count,3);assert.equal(ridge.data.byteLength,288);
 assert.equal(calls.filter(c=>c[0]==='bufferData'&&c[2].length===6048).length,1,'one original 24,192-byte ridge mesh upload');
 assert.deepEqual(host.cameraSolids,[]);
 for(let i=0;i<3;i++)assert.equal(ridge.data[i*24+22],3,'original still sky-image/no-shadow encoding retained');
});

test('actual geometry pass gives western country ridges ordinary world fog and preserves positive-X mountain haze',()=>{
 for(const quality of ['low','balanced','high'])for(const projection of ['perspective','orthographic'])for(const ref of [false,true]){
  const {host}=countryCpuGL(),uniforms=[];
  host.quality=quality;host.camera.projection=projection;host.worldFog={clear:30,span:130};host.worldFogCenter=[-157.5,-78.5];
  host.uni=(p,n,k,v)=>uniforms.push([n,k,Array.isArray(v)||ArrayBuffer.isView(v)?Array.from(v):v]);
  host.batch('country-ridge',countryItems(record(earth).filter(p=>p.kind==='country-ridge')));
  host.batch('mountain-ridge',countryItems(record(earth).filter(p=>p.kind==='mountain-ridge')));
  host.geometryPass({},E.M.identity(),host.palette(17.2,0),12,ref?[-150,-4.98,-78.5]:[-150,5,-78.5],ref,false);
  assert.deepEqual(uniforms.filter(u=>u[0]==='uCountryRidge').map(u=>u[2]),[1,0],'flag resets before the unchanged mountain batch');
  assert.deepEqual(uniforms.filter(u=>u[0]==='uMountainHaze').map(u=>u[2]),[0,1]);
  assert.deepEqual(uniforms.find(u=>u[0]==='uWorldFog'),['uWorldFog','4',[-157.5,-78.5,30,130]],'ground focus is independent of camera projection/reflected eye');
  assert.deepEqual(uniforms.filter(u=>u[0]==='uMountainDepth').map(u=>u[2]),[[62,138],[62,138]]);
  uniforms.length=0;host.theme='atlantis';host.geometryPass({},E.M.identity(),host.palette(17.2,0),12,host.camera.eye,false,false);
  assert.deepEqual(uniforms.filter(u=>u[0]==='uMountainHaze').map(u=>u[2]),[0,0]);
  uniforms.length=0;host.geometryPass({},E.M.identity(),host.palette(17.2,0),12,host.camera.eye,false,true);
  assert.equal(uniforms.some(u=>u[0]==='uCountryRidge'||u[0]==='uMountainHaze'),false,'no extra depth-pass material branch');
 }
});

test('actual WorldArt and Core retain canonical scene/save ownership while admitting the small country ridge batch',()=>{
 const Ccountry=require('../src/core.js');require('../src/earth-grazer-motion.js');require('../src/earth-grazer-habitat-art.js');
 require('../src/world.js');require('../src/world-foundations-art.js');
 const factory=globalThis.RealmWorldFoundationsArt,WorldArt=globalThis.RealmArt.WorldArt;
 for(const quality of ['low','balanced','high']){
  const state=Ccountry.fresh();state.settings.quality=quality;
  const sim=new Ccountry.Simulation(state);sim.room=earth.room;
  const before=JSON.stringify(sim.snapshot()),{host}=countryCpuGL(),a=Object.create(WorldArt.prototype);
  Object.assign(a,{e:host,map:{},room:null,time:0});factory.make(a,sim);
  assert.equal(JSON.stringify(sim.snapshot()),before,'real scene factory never earns progress or modifies saves');
  assert.deepEqual(host.worldFog,{clear:30,span:130});assert.equal(host.theme,'earth');
  const b=host.batches.filter(b=>b.kind==='country-ridge');assert.equal(b.length,1);assert.equal(b[0].count,3);
  assert.equal(host.batches.filter(b=>b.kind==='mountain-ridge')[0].count,10);
  assert.ok(host.cameraSolids.length>0,'actual authored structural camera authorities remain installed');
  assert.equal(host.cameraSolids.some(s=>s.max[0]<-170),false,'scenic ridges do not become structural camera blockers');
 }
});

test('original ordinary App camera math projects the country skyline from grazer and Sela without a camera-source change',()=>{
 const Ccountry=require('../src/core.js'),foundation=require('../src/world-foundations.js'),
  source=fs.readFileSync(require.resolve('../src/app.js'),'utf8'),
  cameraSource=source.slice(source.indexOf('function updateCamera(dt){'),source.indexOf('function cameraPreset(')),
  parts=record(earth).filter(p=>p.kind==='country-ridge');
 assert.ok(cameraSource.includes('function updateOrthographicCamera(dt)'));
 const projected=(x,z,preset,elevation=.28,half=17)=>{
  const sim=new Ccountry.Simulation(Ccountry.fresh());sim.room=earth.room;sim.state.player.x=x;sim.state.player.z=z;
  const {host}=countryCpuGL(),center=[x,G+(preset==='adventure'?1.5:.6),z],camera={preset,tour:false,overview:false,yaw:Math.PI/2,elevation,
   distance:7.5,actualDistance:7.5,fov:60,half,center:center.slice()};
  sim.state.settings.reducedMotion=true;
  vm.runInNewContext(cameraSource+'\nupdateCamera(1);',{engine:host,camera,sim,follow:null,innerWidth:1440,innerHeight:960,
   grazerFocus:()=>null,fieldcraftFocus:()=>null,sceneHeight:()=>G,RealmWorldFoundations:foundation});
  return parts.map(p=>{const m=E.M.compose(...p.p,...p.s,...p.opt.r),mesh=E.geometry(p.kind);let visible=0;
   for(let i=0;i<mesh.length;i+=6){const v=E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]),point=host.project(...v);
    if(point.visible&&point.x>=0&&point.x<=1440&&point.y>=0&&point.y<=960)visible++;
   }return visible;});
 };
 for(const [x,z]of[[-157.5,-78.5],[-103,-23]])assert.ok(projected(x,z,'adventure').every(n=>n>=500),'west-facing ordinary orbit admits each silhouette');
 assert.ok(projected(-157.5,-78.5,'follow',.88)[0]>0,'nearest ridge reaches the grazer normal Diorama viewport');
 assert.deepEqual(projected(-103,-23,'follow',.88),[0,0,0],'tight Sela Diorama limit is retained honestly');
 assert.ok(projected(-103,-23,'follow',.39,34)[0]>0,'ordinary lower orbit/wider zoom can reach nearest skyline');
});
