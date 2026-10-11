'use strict';
// Portable product tests. Actual installed sources and canonical owners;
// static scene and GPU-upload collector only, no rendered/native claim.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const H=require('./helpers/woodland-scene.cjs'),{C,E,W,EW,selected}=H,def=W.definition('world-earthlands'),F=1.57;
const A=()=>H.modules().A;
const matrix=p=>p.opt.m||E.M.compose(...p.p,...p.s,...(p.opt.r||[0,0,0]));
function vertices(p){const raw=E.geometry(p.kind),vs=[];for(let i=0;i<raw.length;i+=H.stride(p.kind))vs.push(E.M.transform(matrix(p),Array.from(raw.slice(i,i+3))));return vs;}
function bounds(ps){const vs=ps.flatMap(p=>vertices(p).flatMap(v=>p.opt.wind===2?[[-.095,-.05],[.095,.05]].map(([x,y])=>[v[0]+x,v[1]+y,v[2]]):[v]));return{min:[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),max:[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])))};}
function toSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}

test('installed browser/CommonJS registration is pure, frozen and refuses an absent canonical host',()=>{
 const box={module:{exports:{}},sentinel:7};vm.runInNewContext(H.read('src/woodland-shapes.js').toString('utf8'),box);
 assert.equal(box.RealmWoodlandShapes,box.module.exports);assert.equal(box.sentinel,7);assert.deepEqual(Object.keys(box).sort(),['RealmWoodlandShapes','module','sentinel']);
 assert.ok(Object.isFrozen(box.module.exports));assert.ok(Object.isFrozen(box.module.exports.IDS));assert.throws(()=>box.module.exports.parts(def));
});
test('exact authored anchors and installed dependencies give deterministic tier counts and existing material/mesh variation',()=>{
 const a=A();assert.deepEqual(a.IDS,selected);assert.equal(a.SEED,23171007);
 for(const quality of ['low','balanced','high']){
  const ps=a.parts(def,{quality});assert.deepEqual(ps,a.parts(def,{quality}));assert.equal(ps.length,quality==='low'?8:20);
  assert.equal(ps.filter(p=>p.opt.foliage).length,quality==='low'?4:12);assert.ok(ps.every(p=>(quality==='low'?['round','cylinder']:['woodland-canopy','cylinder']).includes(p.kind)));
  assert.ok(new Set(ps.map(p=>p.c)).size>=4);assert.ok(new Set(ps.map(p=>p.opt.rough)).size>=3);
  assert.ok(ps.every(p=>p.opt.appearanceOnly&&p.opt.cameraSolid===false&&p.opt.cutaway===true&&p.opt.rough>=.84&&p.opt.rough<=1));
 }
 assert.deepEqual(a.parts(def),a.parts(def,{quality:'balanced'}));
 assert.throws(()=>a.parts(def,{quality:'unknown'}));assert.throws(()=>a.parts({...def}));assert.throws(()=>a.parts(def,{seed:42}));
});
test('actual transformed Engine geometry and shader wind fit old envelopes and supported ground projection',()=>{
 const a=A();assert.match(H.read('src/engine.js').toString('utf8'),/\.095;w\.y\+=cos\(uTime\+w\.x\*\.4\)\*\.05/,'Bounds use the actual current shader wind');
 for(const quality of ['low','balanced','high']){
  const old=EW.parts({quality,height:(x,z)=>W.height(def.room,x,z)}),ps=a.parts(def,{quality});
  for(const id of selected){const prior=bounds(old.filter(p=>H.replaced(p)&&p.opt.solidId===id)),now=bounds(ps.filter(p=>p.opt.solidId===id));
   for(let i=0;i<3;i++){assert.ok(now.min[i]>=prior.min[i]-3e-5,id+' lower '+i);assert.ok(now.max[i]<=prior.max[i]+3e-5,id+' upper '+i);}
  }
  for(const p of ps)for(const v of vertices(p)){assert.ok(v.every(Number.isFinite));assert.ok(v[1]-(p.opt.wind? .05:0)>F+2.2);for(const x of [v[0]-.095,v[0]+.095])assert.equal(W.height(def.room,x,v[2]),F);}
 }
});
test('complete canopy columns clear actual grazer, clue, enemy, service, roadkeeper and authored walking reserves',()=>{
 const {A:a,O}=H.modules(),D=globalThis.RealmEarthWildSignsData,G=globalThis.RealmEarthGrazerMotion,EE=globalThis.RealmEarthExpedition;
 assert.equal(O.ROOM,def.room);assert.ok(Object.isFrozen(O.ROUTES));
 const routes=[...Object.values(O.ROUTES).map(points=>({points,r:1+O.LIMITS.radius})),
  {points:[...G.PATH.points,G.PATH.points[0]],r:G.PATH.radius+.2},{points:D.bypass,r:1.6},
  {points:[D.evidence[2],{x:-158,z:-90},{x:-160,z:-92.5}],r:1.6},
  ...def.routes.map(route=>({points:route.points.map(([x,z])=>({x,z})),r:.6}))];
 const segments=routes.flatMap(route=>route.points.slice(1).map((b,i)=>({a:route.points[i],b,r:route.r})));
 const circles=[...D.evidence.map(p=>({...p,r:1.8})),{...D.overlook,r:2.8},...def.points.map(p=>({...p,r:3})),
  ...[...EE.definition.enemies,...def.enemies,D.enemy].map(p=>({...p,r:O.LIMITS.enemyReserve+O.LIMITS.radius}))];
 for(const quality of ['low','balanced','high'])for(const id of selected){const t=def.solids.find(p=>p.id===id),vs=a.parts(def,{quality}).filter(p=>p.opt.solidId===id).flatMap(vertices),radius=Math.max(...vs.map(v=>Math.hypot(v[0]-t.x,v[2]-t.z)))+.095;
  for(const s of segments)assert.ok(toSegment(t,s.a,s.b)-s.r-radius>=.015,id+' route reserve');
  for(const p of circles)assert.ok(Math.hypot(t.x-p.x,t.z-p.z)-p.r-radius>=.015,id+' circle reserve '+p.id);
 }
});
test('replacement keeps exact other parts, trunk solids, navigation and complete real roster/Simulation authority',()=>{
 const a=A(),data=JSON.stringify(def),nav=Object.values(H.modules().O.ROUTES).map(points=>points.slice(1).map((b,i)=>W.segment(def.room,points[i],b,.6)));
 assert.ok(nav.flat().every(Boolean),'Real installed roadkeeper routes remain supported');
 for(const quality of ['low','balanced','high']){
  const old=EW.parts({quality,height:(x,z)=>W.height(def.room,x,z)}),kept=old.filter(p=>!H.replaced(p)),ps=a.replace(old,def,{quality});
  assert.deepEqual(ps.slice(0,kept.length),kept);kept.forEach((p,i)=>assert.equal(ps[i],p));assert.equal(ps.filter(H.replaced).length,0);
  assert.equal(JSON.stringify(def),data);assert.deepEqual(ps.filter(p=>p.opt.elderwealdPart==='bark-face'),old.filter(p=>p.opt.elderwealdPart==='bark-face'));
  const scene=H.scene(quality),roster=scene.sim.adventureRuntime;assert.ok(Object.hasOwn(scene.sim,'adventureRuntime')&&roster?.room===def.room&&Array.isArray(roster.enemies)&&roster.enemies.length>0,'Actual Core established its real current-room roster');
  for(const id of selected){const t=def.solids.find(p=>p.id===id),actual=scene.art.map.box.find(p=>p.worldSolid&&p.worldSolidId===id);assert.ok(actual);assert.deepEqual(actual.p,[t.x,F+t.h/2,t.z]);assert.deepEqual(actual.s,[t.w,t.h,t.d]);assert.deepEqual(E.solidBounds('box',actual),E.solidBounds('box',{...actual}));assert.equal(W.walkable(def.room,t.x,t.z,.31),false);}
 }
 assert.equal(JSON.stringify(def),data);assert.deepEqual(Object.values(H.modules().O.ROUTES).map(points=>points.slice(1).map((b,i)=>W.segment(def.room,points[i],b,.6))),nav);
 assert.throws(()=>a.replace(EW.parts({quality:'balanced'}).filter(p=>!H.replaced(p)),def));
});
test('actual installed painter/WorldArt scene differs from private old-crown comparison only at declared crowns',()=>{
 const current=globalThis.RealmWorldAtlantisEarth.decorate;
 for(const quality of ['low','balanced','high']){const r=H.compare(quality);assert.ok(r.realCurrentPainterExecuted&&r.exactOtherMetadata&&r.exactOtherPackedBytes&&r.exactWorldSolids&&r.exactCompleteSimulation);assert.equal(r.delta.instances,quality==='low'?-12:-8);assert.ok(r.delta.trianglePercent<6);}
 assert.equal(globalThis.RealmWorldAtlantisEarth.decorate,current);
});
test('actual Engine triangle/instance budgets and the declared one extra crown kind hold at Low, Balanced and High',()=>{
 const a=A();for(const quality of ['low','balanced','high']){
  const removed=H.tally(EW.parts({quality}).filter(H.replaced)),next=H.tally(a.parts(def,{quality})),r=H.compare(quality);
  // Previous canopy reconstruction changes only the twelve declared mesh kinds.
  const previous=H.tally(a.parts(def,{quality}).map(p=>p.kind==='woodland-canopy'?{...p,kind:'round'}:p));
  assert.equal(previous.triangles,quality==='low'?1536:4352);
  assert.equal(previous.triangles-removed.triangles,quality==='low'?1344:2832);
  assert.equal(next.instances,quality==='low'?8:20);assert.equal(next.triangles,quality==='low'?1536:2048);
  assert.equal(next.triangles-removed.triangles,quality==='low'?1344:528);assert.equal(r.delta.triangles,next.triangles-removed.triangles);
  assert.ok(r.delta.trianglePercent<6);assert.ok(next.instances<removed.instances);for(const kind of Object.keys(next.byKind))assert.ok(kind in r.before.byKind||quality!=='low'&&kind==='woodland-canopy');
 }
});
test('actual installed offline builder embeds the module once before App without game-tree writes',()=>{
 const source=H.read('src/app.js').toString('utf8');assert.ok(source.includes('RealmWorldFoundationsArt.make(art,sim)'),'Actual App uses the same real scene owner');
 const result=H.buildRAM();assert.equal(result.actualBuilderExecuted,true);assert.equal(result.moduleEmbeddedOnce,true);assert.equal(result.gameTreeWrites,0);assert.deepEqual(result.outputs['index.html'],result.outputs['FIRSTLIGHT_VALLEY.html']);
});


// Original bounded canopy mesh checks; actual modules and a CPU upload collector.
// No GL context, renderer, input, simulation clock or rendered appearance proof.
const canopyMesh=()=>E.geometry('woodland-canopy');
const key=p=>p.map(v=>Object.is(v,-0)?0:v).join(',');
function roundPlanes(){const mesh=E.geometry('round'),planes=[];for(let i=0;i<mesh.length;i+=18){
 const a=Array.from(mesh.slice(i,i+3)),b=Array.from(mesh.slice(i+6,i+9)),c=Array.from(mesh.slice(i+12,i+15)),n=E.cross(b.map((v,k)=>v-a[k]),c.map((v,k)=>v-a[k])),l=Math.hypot(...n);
 if(l<1e-9)continue;let normal=n.map(v=>v/l),offset=E.dot(normal,a);if(offset<0){normal=normal.map(v=>-v);offset=-offset;}planes.push({normal,offset});
}assert.equal(planes.length,288);return planes;}
function insideOriginalRound(mesh){const planes=roundPlanes();for(let i=0;i<mesh.length;i+=6){const v=Array.from(mesh.slice(i,i+3));for(const p of planes)assert.ok(E.dot(p.normal,v)<=p.offset+1e-7,'every crown point lies in every original round convex plane');}}
function crownTopology(mesh){
 assert.equal(mesh.length,2304);assert.equal(mesh.byteLength,9216);assert.ok([...mesh].every(Number.isFinite));
 const edges=new Map(),normals=new Map(),points=new Set();let volume=0;
 for(let i=0;i<mesh.length;i+=18){const p=[0,6,12].map(k=>Array.from(mesh.slice(i+k,i+k+3))),n=E.cross(p[1].map((v,k)=>v-p[0][k]),p[2].map((v,k)=>v-p[0][k]));
  assert.ok(Math.hypot(...n)>1e-6,'nonzero triangle');assert.ok(E.dot(n,p[0])>0,'outward winding');volume+=E.dot(p[0],E.cross(p[1],p[2]))/6;
  for(let k=0;k<3;k++){const at=i+k*6,norm=Array.from(mesh.slice(at+3,at+6)),a=key(p[k]),b=key(p[(k+1)%3]);assert.ok(Math.abs(Math.hypot(...norm)-1)<2e-6,'unit normals');assert.ok(E.dot(norm,n)>0,'outward smooth normals');
   if(normals.has(a))assert.deepEqual(norm,normals.get(a),'same welded point has the same shared normal');else normals.set(a,norm);
   points.add(a);const id=[a,b].sort().join('|'),row=edges.get(id)||[];row.push([a,b]);edges.set(id,row);
  }
 }
 assert.equal(points.size,66);assert.equal(edges.size,192);assert.equal(points.size-edges.size+128,2);assert.ok(volume>0);
 for(const list of edges.values()){assert.equal(list.length,2,'closed two-sided edge ownership');assert.deepEqual(list[0],list[1].slice().reverse(),'opposed winding across every edge');}
 return {triangles:128,vertices:384,weldedVertices:66,edges:192,volume};
}
test('canopy refinement is a closed nondegenerate smooth-normal original mesh inside the actual old convex round',()=>{
 const mesh=canopyMesh();crownTopology(mesh);insideOriginalRound(mesh);
 const displaced=new Float32Array(mesh);displaced[0]=.7;assert.throws(()=>insideOriginalRound(displaced),'outside-point counterexample');
 const flipped=new Float32Array(mesh);for(let i=0;i<flipped.length;i+=6)for(let k=3;k<6;k++)flipped[i+k]*=-1;assert.throws(()=>crownTopology(flipped),'inverted-normal counterexample');
 assert.throws(()=>crownTopology(E.geometry('cylinder')),'unknown-kind cylinder fallback counterexample');
});
test('canopy refinement has a softly irregular broadleaf contour instead of another round sphere',()=>{
 const mesh=canopyMesh(),points=new Map();for(let i=0;i<mesh.length;i+=6){const p=Array.from(mesh.slice(i,i+3));points.set(key(p),p);}
 const vs=[...points.values()],r=vs.filter(p=>Math.hypot(p[0],p[2])>.1).map(p=>Math.hypot(...p));
 assert.ok(Math.max(...r)-Math.min(...r)>.06);assert.ok(Math.max(...r)<.5);assert.ok(Math.max(...vs.map(p=>p[1]))>.48);assert.ok(Math.min(...vs.map(p=>p[1]))<-.46);
 assert.notDeepEqual(mesh,E.geometry('round'));assert.equal(mesh.length/18,128);
});
test('canopy refinement actual emitter keeps Low bytes and changes only twelve declared Balanced High mesh kinds',()=>{
 const source=H.read('src/woodland-shapes.js').toString('utf8');assert.equal(source.split("emit('woodland-canopy',").length,3);
 const box={module:{exports:{}},RealmEarthRoadkeeperMotion:H.modules().O,require:name=>H.load(name.replace('./',''))};vm.runInNewContext(source.replaceAll("emit('woodland-canopy',","emit('round',"),box);const previous=box.module.exports,a=A();
 const canon=JSON.stringify(def);for(const quality of ['low','balanced','high']){const old=previous.parts(def,{quality}),next=a.parts(def,{quality});assert.equal(next.length,quality==='low'?8:20);
  if(quality==='low'){assert.equal(JSON.stringify(next),JSON.stringify(old),'Low is byte-identical to previous actual emitter');assert.equal(next.some(p=>p.kind==='woodland-canopy'),false);}
  else{assert.equal(next.filter(p=>p.kind==='woodland-canopy').length,12);assert.equal(JSON.stringify(next.map(p=>p.kind==='woodland-canopy'?{...p,kind:'round'}:p)),JSON.stringify(old),'all exact transforms/IDs/metadata/materials/wind unchanged across VM realms');}
  for(const p of next){assert.equal(p.opt.appearanceOnly,true);assert.equal(p.opt.cameraSolid,false);assert.equal(E.solidBounds(p.kind,{...p.opt,p:p.p,s:p.s,r:p.opt.r}),null);if(p.opt.foliage)assert.equal(p.opt.wind,2);}
 }
 assert.equal(JSON.stringify(def),canon);
});
test('canopy refinement actual packed emitter matrices material flags and wind remain exact at all tiers',()=>{
 const a=A();for(const quality of ['low','balanced','high']){const next=a.parts(def,{quality}),prior=next.map(p=>p.kind==='woodland-canopy'?{...p,kind:'round'}:p),flatten=ps=>ps.map(p=>({p:p.p,s:p.s,c:p.c,...p.opt}));
  assert.deepEqual(H.packed(flatten(next)),H.packed(flatten(prior)),'actual Engine 24-float instance bytes unchanged');
  for(const p of next.filter(p=>p.opt.foliage)){const raw=H.packed(flatten([p])),f=new Float32Array(raw.buffer,raw.byteOffset,24);assert.equal(f[22],2);assert.equal(f[19],0);assert.equal(f[23],0);assert.equal(f[20],Math.fround(p.opt.rough));}
 }
});
test('canopy refinement original registry shares one owned mesh and uses unchanged instance packing and buffer release',()=>{
 const created=[],deleted=[],uploads=[];let binding=null;const gl={ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,FLOAT:4,
  createBuffer(){const b={kind:'synthetic-cpu-buffer',id:created.length};created.push(b);return b;},bindBuffer(t,b){assert.equal(t,1);binding=b;},bufferData(t,d,u){uploads.push({buffer:binding,bytes:d.byteLength,usage:u});},
  createVertexArray(){return{};},bindVertexArray(){},enableVertexAttribArray(){},vertexAttribPointer(){},vertexAttribDivisor(){},deleteBuffer(b){deleted.push(b);},deleteVertexArray(){}};
 const e={gl,meshes:new Map(),batches:[],dynamic:[],updateBatch:E.Engine.prototype.updateBatch},items=A().parts(def,{quality:'balanced'}).filter(p=>p.kind==='woodland-canopy').map(p=>({p:p.p,s:p.s,c:p.c,...p.opt}));
 const first=E.Engine.prototype.batch.call(e,'woodland-canopy',items),second=E.Engine.prototype.batch.call(e,'woodland-canopy',[],false);assert.equal(e.meshes.size,1);assert.equal(first.geom,second.geom);assert.equal(first.geom.stride,6);assert.equal(first.geom.count,384);assert.equal(first.count,12);assert.equal(first.data.byteLength,1152);assert.deepEqual(e.cameraSolids,[]);
 assert.equal(uploads.filter(p=>p.bytes===9216).length,1,'one shared canopy mesh upload');assert.equal(created.length,3,'one shared vertex buffer and two isolated synthetic instance buffers');
 E.Engine.prototype.clear.call(e);assert.deepEqual(new Set(deleted),new Set([first.buf,second.buf]));assert.equal(deleted.includes(first.geom.buffer),false,'ordinary scene clear preserves the shared geometry cache');assert.equal(e.meshes.size,1);
});
test('canopy refinement actual WorldArt submission is limited to current western anchors and retains both camera envelopes',()=>{
 const a=A();for(const quality of ['low','balanced','high']){const scene=H.scene(quality),all=H.flatten(scene),crowns=all.filter(p=>p.kind==='woodland-canopy');assert.equal(crowns.length,quality==='low'?0:12);assert.deepEqual([...new Set(crowns.map(p=>p.worldSolidId))].sort(),quality==='low'?[]:[...selected].sort());
  for(const p of a.parts(def,{quality}).filter(p=>p.kind==='woodland-canopy')){const m=matrix(p),old={...p,kind:'round'},prior=bounds([old]),next=bounds([p]);for(let k=0;k<3;k++){assert.ok(next.min[k]>=prior.min[k]-2e-5);assert.ok(next.max[k]<=prior.max[k]+2e-5);}
   // Convex local containment survives each actual affine transform and the
   // identical world shader displacement; both camera-solid lists are empty.
   insideOriginalRound(E.geometry(p.kind));assert.equal(E.solidBounds(p.kind,{p:p.p,s:p.s,...p.opt}),null);assert.ok([...m].every(Number.isFinite));
  }
  assert.equal(crowns.reduce((n,p)=>n+E.geometry(p.kind).length/18,0),quality==='low'?0:1536);
 }
});
