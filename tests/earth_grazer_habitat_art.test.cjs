'use strict';
/* Installed-module CPU primitive/support tests. No native event, render acknowledgement,
 * shader/GPU, pixels or earned quest fact. The omitted-habitat baseline is an explicit
 * art-provider control only; all positive scenes use the real installed module. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js')),E=require(path.join(ROOT,'src/engine.js'));
const D=require(path.join(ROOT,'src/earth-wild-signs-data.js')),O=require(path.join(ROOT,'src/earth-grazer-motion.js')),Art=require(path.join(ROOT,'src/earth-grazer-art.js')),V=require(path.join(ROOT,'src/earth-grazer-visibility.js'));
for(const name of['creative','coastward-settlement-art','coastward-woodland-art','elderweald-trail-art','earth-road','earth-road-art'])require(path.join(ROOT,'src',name+'.js'));
require(path.join(ROOT,'src/world.js'));const Foundation=require(path.join(ROOT,'src/world-foundations-art.js')),H=require(path.join(ROOT,'src/earth-grazer-habitat-art.js'));
const copy=v=>JSON.parse(JSON.stringify(v)),text=v=>JSON.stringify(v),all=e=>e.batches.flatMap(b=>b.items.map(item=>({kind:b.kind,...item}))),hab=e=>all(e).filter(p=>p.habitatPart);
function engine(){let id=0;const uploads=[];const gl={ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,FLOAT:4,createBuffer:()=>({id:++id}),createVertexArray:()=>({id:++id}),bindBuffer(){},bindVertexArray(){},enableVertexAttribArray(){},vertexAttribPointer(){},vertexAttribDivisor(){},deleteBuffer(){},deleteVertexArray(){},bufferData(target,data,mode){uploads.push({target,mode,bytes:data.byteLength});}};
 const e=Object.create(E.Engine.prototype);Object.assign(e,{gl,meshes:new Map(),batches:[],dynamic:[],quality:'balanced',uploads});return e;}
function scene(quality='balanced',dressing=true){
 const sim={room:D.ROOM,state:C.fresh()},e=engine();sim.state.settings.quality=quality;e.quality=quality;
 const a=Object.create(globalThis.RealmArt.WorldArt.prototype);a.e=e;a.room=null;a.map={};const before=text(sim);
 // Explicit negative appearance baseline: only omit this new provider; no world/validator rewrite.
 const liveHabitat=globalThis.RealmEarthGrazerHabitatArt;try{
  if(!dressing)globalThis.RealmEarthGrazerHabitatArt=Object.freeze({...liveHabitat,make(){return 0;}});
  Foundation.make(a,sim);
 }finally{globalThis.RealmEarthGrazerHabitatArt=liveHabitat;}
 assert.equal(text(sim),before);return{sim,a,e};
}
const meshes=new Map();
function vertices(p,matrix=p.m||E.M.compose(...p.p,...p.s,...(p.r||[0,0,0]))){if(!meshes.has(p.kind)){const raw=E.geometry(p.kind),stride=p.kind==='timber-panel'?8:6,vs=[];for(let i=0;i<raw.length;i+=stride)vs.push(Array.from(raw.slice(i,i+3)));meshes.set(p.kind,vs);}return meshes.get(p.kind).map(v=>E.M.transform(matrix,v));}
const routeDistance=(p,a,b)=>{const vx=b.x-a.x,vz=b.z-a.z,n=vx*vx+vz*vz,t=n?Math.max(0,Math.min(1,((p[0]-a.x)*vx+(p[2]-a.z)*vz)/n)):0;return Math.hypot(p[0]-a.x-t*vx,p[2]-a.z-t*vz);};
function floorSafe(p){return vertices(p).every(v=>W.walkable(D.ROOM,v[0],v[2],0)&&v[1]>=W.height(D.ROOM,v[0],v[2])+.0119&&v[1]<=W.height(D.ROOM,v[0],v[2])+.23);}
function clearRoutes(p){return vertices(p).every(v=>O.PATH.points.every((a,i)=>routeDistance(v,a,O.PATH.points[(i+1)%O.PATH.points.length])>1.4)&&D.bypass.slice(1).every((b,i)=>routeDistance(v,D.bypass[i],b)>.65)&&Math.hypot(v[0]-D.overlook.x,v[2]-D.overlook.z)>2.8&&D.evidence.every(q=>Math.hypot(v[0]-q.x,v[2]-q.z)>1.8));}
const cameraSource=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8');
assert.equal(cameraSource.split('function fitGrazerLook(){').length,2,'One actual installed camera fit');
assert.equal(cameraSource.split('function applyGrazerLookFit(').length,2,'One actual installed fit caller');
const fitStart=cameraSource.indexOf('function fitGrazerLook(){'),fitEnd=cameraSource.indexOf('function applyGrazerLookFit(');assert.ok(fitEnd>fitStart);
const fitSource=cameraSource.slice(fitStart,fitEnd);
function setLook(e,width,height,mode,fov){e.canvas={clientWidth:width,clientHeight:height};const focus=[-163.5,2.32,-78.5];
 const fit=vm.runInNewContext('('+fitSource+')()',{engine:e,camera:{preset:mode,fov},innerWidth:width,innerHeight:height,GRAZER_LOOK_POINT:focus,RealmEarthGrazerMotion:O});
 const direction=[Math.cos(fit.elevation),Math.sin(fit.elevation),0],eye=focus.map((n,i)=>n+direction[i]*fit.distance);
 E.Engine.prototype.setCamera.call(e,{eye,target:focus,projection:mode==='adventure'?'perspective':'orthographic',half:6,aspect:width/height,fov});
 return fit;
}
function actor(e,pose,quality){const out={box:[],round:[],octa:[]};for(const {kind,...item}of Art.shape(pose,{quality,reducedMotion:true}))out[kind].push(item);Art.foliage(out);
 for(const b of e.dynamic){b.items=out[b.kind]||[];e.updateBatch(b);}
}
test('stable static perimeter groups retain64Low/128Balanced-High and exact source definitions',()=>{
 assert.equal(H.MAX,128);assert.equal(H.PER_GROUP,16);assert.equal(H.GROUPS.length,8);assert.ok(Object.isFrozen(H.GROUPS)&&H.GROUPS.every(Object.isFrozen));
 const low=H.parts(D.ROOM,{quality:'low'}),balanced=H.parts(D.ROOM,{quality:'balanced'}),high=H.parts(D.ROOM,{quality:'high'});
 assert.equal(low.length,64);assert.equal(balanced.length,128);assert.equal(text(high),text(balanced));assert.equal(new Set(low.map(p=>p.habitatGroup)).size,4);
 for(const p of low)assert.equal(text(p),text(balanced.find(q=>q.habitatId===p.habitatId)));
 assert.equal(new Set(balanced.map(p=>p.habitatId)).size,128);assert.equal(text(H.parts(D.ROOM,{quality:'balanced',time:999,reducedMotion:true})),text(balanced));
 assert.deepEqual(H.parts('world-heaven'),[]);assert.throws(()=>H.parts(D.ROOM,{quality:'ultra'}));
});
test('actual packed primitive vertices remain above real support, inside height cap and outside living spaces',t=>{
 const h=scene(),ps=hab(h.e);assert.equal(ps.length,128);let min=Infinity,max=0,loop=Infinity,bypass=Infinity,overlook=Infinity,verticesCount=0;
 for(const b of h.e.batches)for(let i=0;i<b.items.length;i++){
  const p=b.items[i];if(!p.habitatPart)continue;assert.ok(['box','octa'].includes(b.kind));assert.equal(p.appearanceOnly,true);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.wind,0);assert.equal(p.em,0);assert.equal(E.solidBounds(b.kind,p),null);
  assert.ok(!p.grazerActor&&!p.wildSignsPart&&!p.enemy&&!p.resource&&!p.terrain&&!p.worldSolid);
  assert.deepEqual(Array.from(b.data.slice(i*24,i*24+16)),Array.from(p.m));assert.equal(b.data[i*24+22],0);const vs=vertices({kind:b.kind,...p},b.data.slice(i*24,i*24+16));verticesCount+=vs.length;
  for(const v of vs){assert.ok(W.walkable(D.ROOM,v[0],v[2],0));const y=v[1]-W.height(D.ROOM,v[0],v[2]);min=Math.min(min,y);max=Math.max(max,y);assert.ok(y>.0119&&y<.23);
   for(let j=0;j<O.PATH.points.length;j++)loop=Math.min(loop,routeDistance(v,O.PATH.points[j],O.PATH.points[(j+1)%O.PATH.points.length]));
   for(let j=1;j<D.bypass.length;j++)bypass=Math.min(bypass,routeDistance(v,D.bypass[j-1],D.bypass[j]));overlook=Math.min(overlook,Math.hypot(v[0]-D.overlook.x,v[2]-D.overlook.z));
   assert.ok(D.evidence.every(q=>Math.hypot(v[0]-q.x,v[2]-q.z)>1.8));assert.ok(W.definition(D.ROOM).points.every(q=>Math.hypot(v[0]-q.x,v[2]-q.z)>3));
  }
 }
 assert.ok(loop>1.4&&bypass>.65&&overlook>2.8);assert.equal(ps.filter(p=>p.habitatPart==='tuft').length,48);assert.equal(ps.filter(p=>p.habitatPart==='litter').length,64);assert.equal(ps.filter(p=>p.habitatPart==='stone').length,16);
 assert.equal(verticesCount,3840);t.diagnostic(JSON.stringify({instances:ps.length,triangles:verticesCount/3,minGroundGap:min,maxAboveGround:max,minLoopCenterDistance:loop,minBypassCenterDistance:bypass,minOverlookDistance:overlook,packedBytes:ps.length*24*4}));
});
test('low-profile3D litter has no intersecting same-group footprints or coplanar terrain sheets',()=>{
 const ps=H.parts(D.ROOM);for(const p of ps){assert.ok(floorSafe(p));assert.ok(clearRoutes(p));assert.ok(p.s[1]>=.015&&p.s[1]<=.15);}
 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)if(ps[i].habitatGroup===ps[j].habitatGroup){const a=vertices(ps[i]),b=vertices(ps[j]),ra=Math.max(...a.map(v=>Math.hypot(v[0]-ps[i].p[0],v[2]-ps[i].p[2]))),rb=Math.max(...b.map(v=>Math.hypot(v[0]-ps[j].p[0],v[2]-ps[j].p[2])));assert.ok(Math.hypot(ps[i].p[0]-ps[j].p[0],ps[i].p[2]-ps[j].p[2])>ra+rb);}
});
test('actual WorldFoundations make appends once before static commit and preserves all older static owners',()=>{
 for(const quality of['low','balanced']){const old=scene(quality,false),now=scene(quality),before=all(old.e),after=all(now.e);assert.equal(hab(now.e).length,quality==='low'?64:128);assert.equal(text(after.filter(p=>!p.habitatPart)),text(before));
  assert.deepEqual(now.e.cameraSolids,old.e.cameraSolids);assert.ok(now.e.batches.filter(b=>b.items.some(p=>p.habitatPart)).every(b=>!b.dynamic));assert.ok(now.e.uploads.length>0);
  Foundation.make(now.a,now.sim);assert.equal(hab(now.e).length,quality==='low'?64:128,'actual rebuild clears previous static submissions');}
});
test('quest/claims/clock/input/reducedMotion have no influence or mutation; invalid support refuses before append',()=>{
 const h=scene(),before=text(h.sim),ps=text(H.parts(D.ROOM,{quality:'balanced'}));for(const stage of['fresh','accepted','observed','claimed']){const state=copy(h.sim.state);state.earthWildSigns={...D.fresh(),accepted:stage!=='fresh',observed:stage==='observed',claimed:stage==='claimed'};const sim={room:D.ROOM,state},preserved=text(sim);const writes=[];H.make({add(...args){writes.push(args);}},sim);assert.equal(writes.length,128);assert.equal(text(sim),preserved);assert.equal(text(H.parts(D.ROOM,{quality:'balanced'})),ps);}
 assert.equal(text(h.sim),before);assert.equal(H.make({add(){throw Error('unexpected append');}},{room:'world-heaven'}),0);
 const height=W.height,writes=[];try{W.height=()=>NaN;assert.throws(()=>H.make({add(...args){writes.push(args);}},h.sim),/supported living space/);assert.deepEqual(writes,[]);}finally{W.height=height;}
});
test('support/reserve oracles detect sunk, remote, loop and observation intrusions',()=>{
 const p=H.parts(D.ROOM)[0],sunken={...p,m:new Float32Array(p.m)};sunken.m[13]-=.05;assert.equal(floorSafe(sunken),false);
 const remote={...p,m:new Float32Array(p.m)};remote.m[12]+=400;assert.equal(floorSafe(remote),false);
 const loop={...p,m:new Float32Array(p.m)};loop.m[12]=O.PATH.points[0].x;loop.m[14]=O.PATH.points[0].z;assert.equal(clearRoutes(loop),false);
 const overlook={...p,m:new Float32Array(p.m)};overlook.m[12]=D.overlook.x;overlook.m[14]=D.overlook.z;assert.equal(clearRoutes(overlook),false);
});
test('actual corrected-profile head/muzzle rays remain clear in32 explicitLook packed-scene cases',t=>{
 const rows=[],first=O.PATH.points[0],yaw=Math.atan2(O.PATH.browseToward.x-first.x,O.PATH.browseToward.z-first.z);
 for(const quality of['low','balanced']){const base=scene(quality,false),withHabitat=scene(quality);for(const [width,height]of[[1440,960],[390,844]])for(const mode of['adventure','follow'])for(const fov of[45,80])for(const lower of[.4,1]){
  for(const h of[base,withHabitat]){setLook(h.e,width,height,mode,fov);actor(h.e,{x:first.x,z:first.z,base:W.height(D.ROOM,first.x,first.z),yaw,lower,gait:0,phase:'CPU-habitat-pose',walking:false},quality);}
  const before=V.inspect(base.e,O.ID),after=V.inspect(withHabitat.e,O.ID);assert.equal(before.visible,true,JSON.stringify({quality,width,mode,fov,lower,before}));assert.equal(after.visible,true,JSON.stringify({quality,width,mode,fov,lower,after}));rows.push({quality,width,height,mode,fov,lower,visible:after.visible,span:after.span});
 }}assert.equal(rows.length,32);t.diagnostic(JSON.stringify({scope:'Actual Engine matrices/packed triangles and external cue rays, no pixels or private witness',rows}));
});
test('installed build/shell order declares one habitat module and missing runtime owner refuses',()=>{
 const shell=fs.readFileSync(path.join(ROOT,'src/shell.html'),'utf8'),build=fs.readFileSync(path.join(ROOT,'build.py'),'utf8');
 const token='/*__EARTH_GRAZER_HABITAT_ART__*/';assert.equal(shell.split(token).length-1,1);
 for(const key of['ENGINE','WORLD_FOUNDATIONS','EARTH_WILD_SIGNS_DATA','EARTH_GRAZER_MOTION','EARTH_WILD_SIGNS_ART']){
  const dependency='/*__'+key+'__*/';assert.equal(shell.split(dependency).length-1,1);assert.ok(shell.indexOf(dependency)<shell.indexOf(token),'Actual dependency precedes habitat: '+key);
 }
 assert.ok(shell.indexOf(token)<shell.indexOf('/*__APP__*/'));
 assert.equal(build.split("('earth-grazer-habitat-art.js','EARTH_GRAZER_HABITAT_ART')").length-1,1);
 const dependency=globalThis.RealmEarthGrazerHabitatArt;try{globalThis.RealmEarthGrazerHabitatArt=undefined;assert.throws(()=>scene(),/make/);}finally{globalThis.RealmEarthGrazerHabitatArt=dependency;}
});

test('actual Graphics change refreshes64/128 static pieces immediately without replacing saved owners or camera',()=>{
 const h=scene('balanced'),before=copy(h.sim.state),camera={preset:'follow',yaw:.9,half:6},lease=Object.freeze({});
 h.sim.grazerOwnerLease=lease;h.sim.wildSignsOwnerLease=Object.freeze({});h.sim.worldTrip={active:'CPU-quality-owner',realm:'earthlands',home:{x:1,z:2}};
 const trip=h.sim.worldTrip,wildLease=h.sim.wildSignsOwnerLease;let saves=0,resizes=0;
 const start=cameraSource.indexOf('function graphicsQuality('),end=cameraSource.indexOf('function updateCamera(',start);assert.ok(start>=0&&end>start);
 const context={sim:h.sim,engine:h.e,art:h.a,camera,RealmEarthWildSignsData:D,RealmWorldFoundationsArt:Foundation,
  resize(){resizes++;},save(){C.validate(h.sim.state);saves++;return{ok:true};}};
 vm.createContext(context);vm.runInContext(cameraSource.slice(start,end),context);
 for(const [quality,count]of[['low',64],['balanced',128],['high',128],['low',64]]){
  const result=context.graphicsQuality(quality);assert.equal(result.ok,true);assert.equal(hab(h.e).length,count);
  assert.equal(h.e.quality,quality);assert.deepEqual(copy(h.sim.state),{...before,settings:{...before.settings,quality}});
  assert.strictEqual(h.sim.grazerOwnerLease,lease);assert.strictEqual(h.sim.wildSignsOwnerLease,wildLease);assert.strictEqual(h.sim.worldTrip,trip);
  assert.deepEqual(camera,{preset:'follow',yaw:.9,half:6});
 }
 assert.equal(saves,4);assert.equal(resizes,4);
 const batches=h.e.batches;assert.equal(context.graphicsQuality('low').ok,true);assert.strictEqual(h.e.batches,batches,'unchanged quality does not rebuild');
 const state=copy(h.sim.state);assert.equal(context.graphicsQuality('unbounded').ok,false);assert.deepEqual(copy(h.sim.state),state);assert.equal(saves,5);
 assert.ok(cameraSource.includes("if(e.target.id==='quality')graphicsQuality(e.target.value);"),'actual settings change invokes this owner');
});
