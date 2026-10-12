/* Production geometry submission checks. No screenshot or GPU claims. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/world-foundations.js'),E=require('../src/engine.js');
require('../src/coastward-settlement-art.js');
require('../src/coastward-woodland-art.js');
require('../src/earth-grazer-motion.js');require('../src/earth-grazer-habitat-art.js');
const Art=require('../src/world-foundations-art.js');
const KINDS=new Set(['box','timber-panel','bridge-vault','bank-slope','coast-bank','mountain-ridge','round','ring','roof','leaf','octa','cone','disc','cylinder']);
assert.equal(E.geometry('country-ridge').length,6048,'actual finite 336-triangle ridge ownership, not unknown cylinder fallback');
assert.deepEqual(E.geometry('country-ridge'),E.geometry('mountain-ridge'),'explicit alias uses the original production mesh');
KINDS.add('country-ridge');
assert.equal(E.geometry('overlook-stone').length,864,'explicit original 48-triangle stone mesh, not unknown cylinder fallback');
KINDS.add('overlook-stone');
assert.equal(E.geometry('woodland-canopy').length,2304,'exact original 128-triangle crown mesh, not unknown cylinder fallback');
KINDS.add('woodland-canopy');
KINDS.add('heaven-workbench');
assert.equal(E.geometry('elderweald-root-arch').length,32*3*8,'explicit original 32-triangle timber root mesh');
KINDS.add('elderweald-root-arch');
for(const [kind,count] of [['coastward-shore-apron',52],['coastward-shore-bank',60]]){
 assert.equal(E.geometry(kind).length,count*18,'exact original authored shoreline mesh');KINDS.add(kind);
}
function submission(id,quality='balanced'){const d=W.definition(id),items=[],writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,depth,color,opt={}){items.push({kind,p:[x,y,z],s:[w,h,depth],color,...opt});},box(x,y,z,w,h,depth,color,opt){this.add('box',x,y,z,w,h,depth,color,opt);}},sim=new C.Simulation();sim.room=d.room;sim.state.player={...d.entry};if(quality===null)delete sim.state.settings.quality;else sim.state.settings.quality=quality;const before=JSON.stringify(sim.state),catalogue=JSON.stringify(d);Art.make(writer,sim);return{d,items,writer,sim,before,catalogue};}
function bounds(it){const m=E.M.compose(...it.p,...it.s,...(it.r||[0,0,0])),mesh=E.geometry(it.kind),stride=E.meshStride(it.kind),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.length;i+=stride){const p=E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]);for(let j=0;j<3;j++){min[j]=Math.min(min[j],p[j]);max[j]=Math.max(max[j],p[j]);}}return{min,max};}
test('all new static scenery uses supported finite meshes instead of silent cylinder fallback',()=>{for(const id of W.IDS.filter(id=>id!=='cosmos')){const {d,items}=submission(id);assert.ok(items.length>40&&items.length<4000,'bounded original scene');
 const countryWest=items.filter(p=>p.kind==='country-ridge');assert.equal(countryWest.length,id==='earthlands'?3:0,'exact separately owned western skyline');
 if(id==='earthlands'){assert.deepEqual(countryWest.map(p=>p.vistaLayer),[0,1,2]);assert.equal(countryWest.reduce((n,p)=>n+E.geometry(p.kind).length/18,0),1008);}
 const shore=items.filter(p=>p.shorelineGround||p.shorelineBank);assert.equal(shore.length,id==='earthlands'?2:0);
 for(const p of shore){assert.equal(p.shorelineGround||p.shorelineBank,'shore-overlook');assert.deepEqual(p.p,[0,0,0]);assert.deepEqual(p.s,[1,1,1]);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(E.solidBounds(p.kind,p),null);}
 for(const p of countryWest){assert.equal(p.vista,'country-west');assert.equal(p.appearanceOnly,true);assert.equal(p.skyImage,true);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.worldSolid,undefined);assert.equal(E.solidBounds(p.kind,p),null);assert.ok(bounds(p).max[0]<d.bounds.minX,'full rotated mesh is outside western country');}
for(const it of items){assert.ok(KINDS.has(it.kind),id+' unknown mesh '+it.kind);assert.ok([...it.p,...it.s].every(Number.isFinite));assert.ok(it.s.every(n=>n>0));assert.ok([...E.geometry(it.kind)].every(Number.isFinite));}}});
test('visible solid boxes match canonical body collision footprints and heights',()=>{for(const id of W.IDS.filter(id=>id!=='cosmos')){const {d,items}=submission(id);for(const p of [...d.solids,...(d.dive?.solids||[])]){const boxes=items.filter(it=>it.worldSolid&&it.worldSolidId===p.id);assert.equal(boxes.length,1,p.id+' one authoritative visible solid');const it=boxes[0],base=p.y??W.height(d.room,p.x,p.z);assert.deepEqual(it.p,[p.x,base+p.h/2,p.z]);assert.deepEqual(it.s,[p.w,p.h,p.d]);assert.equal(it.cameraSolid,true);}}});
test('submitted opaque geometry leaves the actual 3D gallery body route clear',()=>{const {d,items}=submission('atlantis'),path=d.dive.routes[0].points,near=items.map(it=>({...it,b:bounds(it)})).filter(it=>it.b.max[0]>=3&&it.b.min[0]<=13&&it.b.max[2]>=-41&&it.b.min[2]<=-18&&it.b.max[1]>-2.7+.061&&it.b.min[1]<1.45-.061);for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(...a.map((v,j)=>b[j]-v))*20);for(let k=0;k<=n;k++){const p=a.map((v,j)=>v+(b[j]-v)*k/n);assert.ok(W.swimClear(d.dive,p[0],p[1],p[2]),'canonical 3D route body fits');for(const it of near){const q=it.b,overlap=q.min[0]<p[0]+.31&&q.max[0]>p[0]-.31&&q.min[2]<p[2]+.31&&q.max[2]>p[2]-.31&&q.min[1]<p[1]+1.7-.061&&q.max[1]>p[1]+.061;assert.equal(overlap,false,'opaque '+it.kind+' at '+it.p+' intrudes above cosmetic surface tolerance at '+p);}}}});
test('wet volume under the civic deck retains actual head clearance',()=>{const {items,d}=submission('atlantis'),upper=items.filter(it=>it.worldGround&&it.p[0]>=3&&it.p[0]<=13&&it.p[2]>=-40&&it.p[2]<=-18);assert.ok(upper.length>0);for(const it of upper)assert.ok(it.p[1]-it.s[1]/2>d.dive.maxY+1.7,'deck underside clears the highest permitted body');});

test('only the two exact Atlantis shelter roofs receive preference-controlled roof reveal',()=>{
 const {items,d}=submission('atlantis'),roofs=items.filter(it=>it.worldRoof);
 assert.equal(roofs.length,2);assert.deepEqual(roofs.map(p=>p.worldRoof).sort(),['atlantis-air-court','farwake-civic-canopy']);const roof=roofs.find(p=>p.worldRoof==='atlantis-air-court'),solid=d.dive.solids.find(p=>p.id==='bellglass-ceiling');
 assert.equal(roof.worldRoof,'atlantis-air-court');assert.equal(roof.worldSolidId,solid.id);
 assert.equal(roof.worldSolid,true);assert.equal(roof.cameraSolid,true);assert.equal(roof.cutaway,true);
 assert.deepEqual(roof.p,[solid.x,solid.y+solid.h/2,solid.z]);assert.deepEqual(roof.s,[solid.w,solid.h,solid.d]);
 const canopy=roofs.find(p=>p.worldRoof==='farwake-civic-canopy');assert.equal(canopy.structureId,'farwake-civic-canopy');assert.equal(canopy.cutaway,true);assert.equal(canopy.cameraSolid,false);assert.deepEqual(canopy.p,[0,W.height(d.room,0,-12)+4.1,-12]);assert.deepEqual(canopy.s,[27,.2,19.7]);
 for(const id of ['earthlands','heaven'])assert.equal(submission(id).items.some(it=>it.worldRoof),false);
});


test('overlook stone is a closed finite faceted mesh with outward unit normals and the original centered envelope',()=>{
 const mesh=E.geometry('overlook-stone'),edges=new Map(),points=new Set(),facets=new Set(),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 assert.equal(mesh.length/18,48);assert.equal(mesh.byteLength,3456);assert.ok([...mesh].every(Number.isFinite));
 const key=p=>p.join(','),edge=(a,b)=>{const u=key(a),v=key(b),k=[u,v].sort().join('|');if(!edges.has(k))edges.set(k,[]);edges.get(k).push([u,v]);};
 for(let i=0;i<mesh.length;i+=18){
  const p=[0,6,12].map(n=>Array.from(mesh.slice(i+n,i+n+3))),n=Array.from(mesh.slice(i+3,i+6)),cross=E.cross(E.sub(p[1],p[0]),E.sub(p[2],p[0]));
  assert.ok(Math.hypot(...cross)>1e-6,'nondegenerate original facet');assert.ok(Math.abs(Math.hypot(...n)-1)<1e-6);
  assert.ok(E.dot(E.norm(cross),n)>.999999,'normal follows winding');
  assert.ok(E.dot(n,[0,1,2].map(j=>(p[0][j]+p[1][j]+p[2][j])/3))>0,'facet faces out from enclosed core');
  for(const q of p){points.add(key(q));q.forEach((v,j)=>{lo[j]=Math.min(lo[j],v);hi[j]=Math.max(hi[j],v);});}
  facets.add(n.map(v=>Math.round(v*10000)).join(','));edge(p[0],p[1]);edge(p[1],p[2]);edge(p[2],p[0]);
 }
 assert.deepEqual(lo,[-.5,-.5,-.5]);assert.deepEqual(hi,[.5,.5,.5]);assert.equal(points.size,26);assert.equal(edges.size,72);assert.ok(facets.size>20,'irregular stone facets replace six planar box faces');
 for(const rows of edges.values()){assert.equal(rows.length,2,'closed two-face edge');assert.deepEqual(rows[0],rows[1].slice().reverse(),'consistent surface winding');}
 const box=E.geometry('box');assert.equal(require('node:crypto').createHash('sha256').update(Buffer.from(box.buffer,box.byteOffset,box.byteLength)).digest('hex'),'e8d0b82261a50b117086e715e953b7d62d49a4ae176177f501fd16ef318dd48d','every other box keeps its exact original mesh');
});

test('only the canonical Earth stone and two Heaven worktables change kind with original solid ownership',()=>{
 for(const id of W.IDS.filter(id=>id!=='cosmos')){
  const {d,items}=submission(id),landmarks=items.filter(p=>p.kind==='overlook-stone');assert.equal(landmarks.length,id==='earthlands'?1:0);
  for(const item of items.filter(p=>p.worldSolid))assert.equal(item.kind,id==='earthlands'&&item.worldSolidId==='overlook-stone'?'overlook-stone':id==='heaven'&&['heaven-rielle-bench','heaven-yselle-table'].includes(item.worldSolidId)?'heaven-workbench':'box');
  if(id!=='earthlands')continue;
  const stone=d.solids.find(p=>p.id==='overlook-stone'),item=landmarks[0],base=W.height(d.room,stone.x,stone.z);
  assert.deepEqual([stone.x,stone.z,stone.w,stone.d,stone.h,stone.color],[35,-23,2.8,2.5,1.8,0x8d9589]);assert.equal(base,1.57);
  assert.deepEqual(item.p,[35,2.47,-23]);assert.deepEqual(item.s,[2.8,1.8,2.5]);assert.equal(item.color,stone.color);assert.equal(item.rough,.96);
  assert.equal(item.worldSolid,true);assert.equal(item.worldSolidId,stone.id);assert.equal(item.cameraSolid,true);assert.equal(item.cutaway,true);assert.equal(item.terrain,undefined);assert.equal(item.wind,undefined);
  const envelope=E.solidBounds('box',item),actual=E.solidBounds(item.kind,item),meshBounds=bounds(item);assert.deepEqual(actual,envelope);
  for(const axis of [0,1,2]){assert.ok(meshBounds.min[axis]>=envelope.min[axis]-1e-6);assert.ok(meshBounds.max[axis]<=envelope.max[axis]+1e-6);assert.ok(Math.abs(meshBounds.min[axis]-envelope.min[axis])<1e-6);assert.ok(Math.abs(meshBounds.max[axis]-envelope.max[axis])<1e-6);}
  assert.equal(W.land(d.room,35,-23,.31),true);assert.equal(W.walkable(d.room,35,-23,.31),false,'canonical stone stays solid');
  assert.equal(W.walkable(d.room,30,-20,.31),true);assert.equal(W.segment(d.room,{x:22,z:-19},{x:30,z:-20},.31),true,'original shore spur remains supported');
 }
});

test('actual WorldArt add and commit keep one static stone batch and preserve the original simulation',()=>{
 require('../src/world.js');
 // Explicit CPU batch transport, never a renderer/GPU or native acceptance.
 const calls=[],engine={clear(){calls.length=0;},batch(kind,items,dynamic=false,opt={}){const b={kind,items,dynamic,opt};calls.push(b);return b;}};
 const art=Object.create(globalThis.RealmArt.WorldArt.prototype);art.e=engine;
 const sim=new C.Simulation();sim.room='world-earthlands';const before=JSON.stringify(sim.state);Art.make(art,sim);
 const batches=calls.filter(b=>b.kind==='overlook-stone');assert.equal(batches.length,1);assert.equal(batches[0].dynamic,false);assert.equal(batches[0].items.length,1);
 assert.equal(batches[0].items[0].worldSolidId,'overlook-stone');assert.equal(batches[0].items[0].cameraSolid,true);
 assert.equal(calls.filter(b=>b.kind==='box').flatMap(b=>b.items).filter(p=>p.worldSolidId==='overlook-stone').length,0,'no duplicate opaque box');
 assert.deepEqual(engine.worldFog,{clear:30,span:130});assert.equal(JSON.stringify(sim.state),before);
});

// Before-stream digests were captured from 0d83144 before the worktable change.
// Only the two intentional base-mesh names may normalize; no field, order,
// instance, foreign scene or quality-dependent dressing is filtered out.
const TABLE_IDS=['heaven-rielle-bench','heaven-yselle-table'];
const streamHash=items=>require('node:crypto').createHash('sha256').update(JSON.stringify(items)).digest('hex');
test('worktables: exact old ordered streams survive except two explicit mesh names at Balanced/High',()=>{
 const expected={heaven:{low:'d6267d810d406249bf383cb9ddf9c0fdfa43b26042ccd2c037b314c2dd2c07a2',balanced:'824039be3083a6796ac7aa7f8890819d34790833a2f5107359f7086505c66b88',high:'824039be3083a6796ac7aa7f8890819d34790833a2f5107359f7086505c66b88'},hell:{low:'790c23ecdb1e118d8eca04748b8e19a83db1d3c5f299745f0fc880dcb4c14b09',balanced:'790c23ecdb1e118d8eca04748b8e19a83db1d3c5f299745f0fc880dcb4c14b09',high:'790c23ecdb1e118d8eca04748b8e19a83db1d3c5f299745f0fc880dcb4c14b09'},earthlands:{low:'57bbe0070459fed3d1293902ab913d3e055b498d13759b437aa16544ef1c7061',balanced:'8cd34a4db2cd76f0676337e6c30c1c4eb61dc9fcd30bc8c475252daaab5d321a',high:'e9757b86a05746da09b890e32fcde1697a710add6dd914061a9e2a80f88157cd'},atlantis:{low:'f4989e57b1f9964a85f5f0f4d41f29a74230e095b5eba87c0d525cb83b55ff5b',balanced:'f4989e57b1f9964a85f5f0f4d41f29a74230e095b5eba87c0d525cb83b55ff5b',high:'f4989e57b1f9964a85f5f0f4d41f29a74230e095b5eba87c0d525cb83b55ff5b'}};
 for(const id of Object.keys(expected))for(const quality of ['low','balanced','high']){
  const{items}=submission(id,quality),crafted=items.filter(p=>p.kind==='heaven-workbench');
  assert.equal(crafted.length,id==='heaven'&&quality!=='low'?2:0);
  for(const p of crafted)assert.ok(p.worldSolid&&TABLE_IDS.includes(p.worldSolidId));
  assert.equal(streamHash(items.map(p=>p.kind==='heaven-workbench'?{...p,kind:'box'}:p)),expected[id][quality]);
 }
 for(const quality of [null,'unsupported']){
  assert.equal(streamHash(submission('heaven',quality).items),expected.heaven.low);
  assert.equal(streamHash(submission('hell',quality).items),expected.hell.low);
 }
});
function rayHits(mesh,origin,direction){let hits=0;for(let i=0;i<mesh.length;i+=18){const a=Array.from(mesh.slice(i,i+3)),b=Array.from(mesh.slice(i+6,i+9)),c=Array.from(mesh.slice(i+12,i+15)),e1=E.sub(b,a),e2=E.sub(c,a),h=E.cross(direction,e2),det=E.dot(e1,h);if(Math.abs(det)<1e-8)continue;const s=E.sub(origin,a),u=E.dot(s,h)/det;if(u<0||u>1)continue;const q=E.cross(s,e1),v=E.dot(direction,q)/det;if(v<0||u+v>1)continue;if(E.dot(e2,q)/det>1e-8)hits++;}return hits;}
test('worktables: actual mesh has finite correctly wound closed members and a genuinely open underside',()=>{
 const mesh=E.geometry('heaven-workbench');assert.equal(E.meshStride('heaven-workbench'),6);assert.equal(mesh.length/18,84);assert.equal(mesh.byteLength,6048);
 assert.ok([...mesh].every(Number.isFinite));const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<mesh.length;i+=18){const p=[0,6,12].map(n=>Array.from(mesh.slice(i+n,i+n+3))),n=Array.from(mesh.slice(i+3,i+6)),cross=E.cross(E.sub(p[1],p[0]),E.sub(p[2],p[0]));assert.ok(Math.hypot(...cross)>1e-7);assert.ok(Math.abs(Math.hypot(...n)-1)<1e-7);assert.ok(E.dot(E.norm(cross),n)>.999999);for(const q of p)q.forEach((v,j)=>{lo[j]=Math.min(lo[j],v);hi[j]=Math.max(hi[j],v);});}
 assert.deepEqual(lo,[-.5,-.5,-.5]);assert.deepEqual(hi,[.5,.5,.5]);
 for(let part=0;part<7;part++){const edges=new Map(),key=p=>p.join(',');for(let i=part*216;i<(part+1)*216;i+=18){const ps=[0,6,12].map(n=>Array.from(mesh.slice(i+n,i+n+3)));for(let j=0;j<3;j++){const a=key(ps[j]),b=key(ps[(j+1)%3]),k=[a,b].sort().join('|');if(!edges.has(k))edges.set(k,[]);edges.get(k).push([a,b]);}}for(const rows of edges.values()){assert.equal(rows.length,2);assert.deepEqual(rows[0],rows[1].slice().reverse());}}
 assert.equal(rayHits(mesh,[0,.01,2],[0,0,-1]),0,'the old full block must be absent below the top');assert.ok(rayHits(E.geometry('box'),[0,.01,2],[0,0,-1])>0);
 assert.ok(rayHits(mesh,[.013,.425,2],[0,0,-1])>=2,'solid plank top');assert.ok(rayHits(mesh,[.418,.01,2],[0,0,-1])>=4,'front and back feet');
});
test('worktables: transforms, camera proxies, body blocking, inlays and paid survey record remain original',()=>{
 for(const quality of ['balanced','high']){const{d,items,sim,before,catalogue}=submission('heaven',quality);
  for(const id of TABLE_IDS){const s=d.solids.find(p=>p.id===id),matches=items.filter(p=>p.worldSolid&&p.worldSolidId===id);assert.equal(matches.length,1);const item=matches[0];assert.equal(item.kind,'heaven-workbench');assert.deepEqual(item.p,[s.x,1.57+s.h/2,s.z]);assert.deepEqual(item.s,[s.w,s.h,s.d]);assert.equal(item.color,0xbd9d6a);assert.equal(item.rough,.96);assert.equal(item.cameraSolid,true);assert.equal(item.cutaway,true);assert.equal(item.wind,undefined);assert.deepEqual(E.solidBounds(item.kind,item),E.solidBounds('box',item));const b=bounds(item),proxy=E.solidBounds('box',item);for(let axis=0;axis<3;axis++){assert.ok(Math.abs(b.min[axis]-proxy.min[axis])<1e-6);assert.ok(Math.abs(b.max[axis]-proxy.max[axis])<1e-6);}assert.equal(W.walkable(d.room,s.x,s.z,.31),false);assert.equal(items.filter(p=>p.worldSolidId===id&&!p.worldSolid).length,5,'old top and four inlays remain');}
  assert.equal(JSON.stringify(sim.state),before);assert.equal(JSON.stringify(d),catalogue);
  // Real kit/travel/accept/observe/claim rules; positions and save transport are
  // explicitly synthetic. No earned movement, native play or personal save.
  const out=[],fresh=new C.Simulation();fresh.state.player={x:11,z:9,yaw:0};assert.ok(fresh.adventureCommand('worktable-fixture-kit-'+quality,'start').ok);fresh.state.player={...W.GATE,yaw:0};
  const ctx={sim:fresh,active:'labelled-worktable-character',revision:0},io={save:()=>({ok:true}),build:()=>{}},ticket=W.preview(ctx,'heaven');assert.ok(ticket.ok);assert.ok(W.enter(ticket.ticket,ctx,io).ok);fresh.state.settings.quality=quality;
  const pose=id=>{const p=d.points.find(p=>p.id===id);assert.ok(p);assert.ok(W.walkable(d.room,p.x,p.z));fresh.state.player={x:p.x,z:p.z,yaw:0};};
  pose(d.quest.giverId);assert.ok(W.command(ctx,'accept',{realm:'heaven'},io).ok);const run=fresh.state.journeys.realms.heaven.active.run;
  for(const o of d.quest.objectives){pose(o.pointId);assert.ok(W.command(ctx,'observe',{realm:'heaven',run,objective:o.id},io).ok);}pose(d.quest.giverId);assert.ok(W.command(ctx,'claim',{realm:'heaven',run},io).ok);
  assert.deepEqual(fresh.state.journeys.realms.heaven,{counter:run,lastClaim:run,firstClaimed:true,active:null,defeated:[]});const snapshot=fresh.snapshot();Art.make({e:{},begin(){},commit(){},add(kind,...args){out.push({kind,args});},box(...args){this.add('box',...args);}},fresh);
  assert.equal(out.filter(p=>p.args[7]?.surveyRecord).length,1);assert.deepEqual(fresh.snapshot(),snapshot);
 }
});
test('worktables: actual static Engine packing reuses one mesh and retains the original camera bounds',()=>{
 const items=submission('heaven','high').items.filter(p=>p.kind==='heaven-workbench').map(({kind,color,...p})=>({...p,c:color})),uploads=[],attributes=[];
 const gl={ARRAY_BUFFER:34962,STATIC_DRAW:35044,DYNAMIC_DRAW:35048,FLOAT:5126,createBuffer:()=>({}),createVertexArray:()=>({}),bindBuffer(){},bindVertexArray(){},enableVertexAttribArray(){},vertexAttribDivisor(){},vertexAttribPointer(...args){attributes.push(args);},bufferData(target,data,usage){uploads.push({target,data:new Float32Array(data),usage});}};
 const engine=Object.create(E.Engine.prototype);Object.assign(engine,{gl,meshes:new Map(),batches:[],dynamic:[],cameraSolids:[]});
 const b=engine.batch('heaven-workbench',items);assert.equal(b.geom.count,252);assert.equal(b.geom.stride,6);assert.equal(b.count,2);assert.equal(b.dynamic,false);assert.deepEqual(uploads[0].data,E.geometry('heaven-workbench'));assert.equal(uploads[1].data.length,48);assert.equal(uploads[1].data.byteLength,192);assert.deepEqual(engine.cameraSolids,items.map(p=>E.solidBounds('box',p)));assert.ok(attributes.some(a=>a[0]===0&&a[4]===24));
 const before=uploads.length;engine.batch('heaven-workbench',items);assert.equal(uploads.length,before+1,'only instance data uploads after cached mesh');assert.equal(engine.meshes.size,1);
});
test('worktables: actual quality control rebuilds the same WorldArt owner in both directions without changing camera or history',()=>{
 require('../src/world.js');const fs=require('node:fs'),vm=require('node:vm'),app=fs.readFileSync(require('node:path').join(__dirname,'../src/app.js'),'utf8'),begin=app.indexOf('function graphicsQuality(value){'),end=app.indexOf('function updateCamera(dt){',begin);assert.ok(begin>=0&&end>begin);
 for(const [from,to]of [['high','low'],['low','high'],['low','balanced']]){
  const sim=new C.Simulation();sim.room='world-heaven';sim.state.settings.quality=from;const batches=[],engine={quality:from,clear(){batches.length=0;},batch(kind,items,dynamic=false){const b={kind,items,dynamic};batches.push(b);return b;}},art=Object.create(globalThis.RealmArt.WorldArt.prototype);art.e=engine;Art.make(art,sim);
  assert.equal(batches.filter(b=>b.kind==='heaven-workbench').flatMap(b=>b.items).length,from==='low'?0:2);const camera={preset:'adventure',yaw:.22},leases={travel:'retained',encounter:'retained'},counts={make:0,resize:0,save:0},before=sim.snapshot();
  const host={sim,engine,art,camera,leases,RealmEarthWildSignsData:{ROOM:'world-earthlands'},RealmWorldFoundationsArt:{make(a,s){assert.equal(a,art);assert.equal(s,sim);counts.make++;Art.make(a,s);}},resize(){counts.resize++;},save(){counts.save++;return{ok:true};}};vm.runInNewContext(app.slice(begin,end)+'\nthis.changeQuality=graphicsQuality;',host);
  assert.equal(host.changeQuality(to).ok,true);assert.deepEqual(counts,{make:1,resize:1,save:1});assert.equal(batches.filter(b=>b.kind==='heaven-workbench').flatMap(b=>b.items).length,to==='low'?0:2);assert.deepEqual(sim.snapshot(),{...before,settings:{...before.settings,quality:to}});assert.deepEqual(camera,{preset:'adventure',yaw:.22});assert.deepEqual(leases,{travel:'retained',encounter:'retained'});
 }
});
