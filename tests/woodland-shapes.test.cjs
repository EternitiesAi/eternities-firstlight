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
  assert.equal(ps.filter(p=>p.opt.foliage).length,quality==='low'?4:12);assert.ok(ps.every(p=>['round','cylinder'].includes(p.kind)));
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
test('actual Engine triangle/instance budgets and existing draw kinds hold at Low, Balanced and High',()=>{
 const a=A();for(const quality of ['low','balanced','high']){
  const removed=H.tally(EW.parts({quality}).filter(H.replaced)),next=H.tally(a.parts(def,{quality})),r=H.compare(quality);
  assert.equal(next.instances,quality==='low'?8:20);assert.equal(next.triangles,quality==='low'?1536:4352);
  assert.equal(next.triangles-removed.triangles,quality==='low'?1344:2832);assert.equal(r.delta.triangles,next.triangles-removed.triangles);
  assert.ok(r.delta.trianglePercent<6);assert.ok(next.instances<removed.instances);for(const kind of Object.keys(next.byKind))assert.ok(kind in r.before.byKind);
 }
});
test('actual installed offline builder embeds the module once before App without game-tree writes',()=>{
 const source=H.read('src/app.js').toString('utf8');assert.ok(source.includes('RealmWorldFoundationsArt.make(art,sim)'),'Actual App uses the same real scene owner');
 const result=H.buildRAM();assert.equal(result.actualBuilderExecuted,true);assert.equal(result.moduleEmbeddedOnce,true);assert.equal(result.gameTreeWrites,0);assert.deepEqual(result.outputs['index.html'],result.outputs['FIRSTLIGHT_VALLEY.html']);
});
