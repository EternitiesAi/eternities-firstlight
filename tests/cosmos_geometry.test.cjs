'use strict';
/* Portable installed physical/CPU submission checks; not earned play, pixels
 * or device proof. Live uses actual installed modules. Only the historical
 * comparison selects three byte-pinned original fixtures. No browser/GPU. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const test=require('node:test'),assert=require('node:assert/strict');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const DATA=path.join(ROOT,'src/cosmos-campaign-data.js'),PREIMAGE=path.join(ROOT,'tests/fixtures/cosmos-original');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),plain=o=>JSON.parse(JSON.stringify(o));
const expected={
 'cosmos.js':'dc646ba254ad4c482685c58d342e50c696832f479c8a13526faeed089fe4d3c5',
 'cosmos-art.js':'f95fe5cbbb5b49609606f15249e127af70af4f76e39839449fd279db91c632b1',
 'world-foundations.js':'97f445690fccea753c860e96bf54d4e33a3c8551e8738a31d3d947ce30d1465d'
};
const dependencies=new Map(),read=p=>{const bytes=fs.readFileSync(p),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 if(dependencies.has(p))assert.equal(hash,dependencies.get(p),'source changed during staged checks: '+p);else dependencies.set(p,hash);return bytes.toString('utf8');};
function world(installed=true){
 const context=vm.createContext({console,Float32Array,Uint32Array,Uint16Array,Uint8Array,ArrayBuffer,performance}),cache=new Map();
 function load(request,from=path.join(ROOT,'src/__entry__.js')){
  if(!request.startsWith('.')&&!path.isAbsolute(request))return require(request);
  const source=path.resolve(path.dirname(from),request);
  let file=source;
  if(!installed&&path.dirname(source)===path.join(ROOT,'src')&&Object.hasOwn(expected,path.basename(source)))file=path.join(PREIMAGE,path.basename(source));
  if(cache.has(source))return cache.get(source).exports;
  const module={exports:{}};cache.set(source,module);
  const run=vm.runInContext('(function(require,module,exports,__filename,__dirname){'+read(file)+'\n})',context,{filename:file});
  run(r=>load(r,source),module,module.exports,file,path.dirname(file));return module.exports;
 }
 const N=load('./cosmos.js'),W=load('./world-foundations.js'),C=load('./core.js'),E=load('./engine.js');
 load('./world.js');const Art=load('./cosmos-art.js');
 return{context,load,N,W,C,E,Art:installed?Art:context.RealmCosmosArt};
}
const old=world(false),live=world(),{N,W,C,E,Art}=live,D=live.context.RealmCosmosCampaignData,g=D.geometry;
function submission(w){
 // Real WorldArt begin/add/box/bench/commit, real procedural meshes and camera
 // bounds. The engine sink records submission; no WebGL context is allocated.
 const e={batches:[],dynamic:[],cameraSolids:[],clear(){this.batches=[];this.dynamic=[];this.cameraSolids=[];},
  batch(kind,items,dynamic=false){const b={kind,items,dynamic};(dynamic?this.dynamic:this.batches).push(b);
   if(!dynamic)this.cameraSolids.push(...items.map(it=>w.E.solidBounds(kind,it)).filter(Boolean));return b;}};
 const a=Object.create(w.context.RealmArt.WorldArt.prototype);a.e=e;a.map={};w.Art.make(a);
 const items=e.batches.flatMap(b=>b.items.map(it=>({...it,kind:b.kind})));return{e,a,items};
}
const original=submission(old),updated=submission(live),extension=updated.items.filter(i=>i.cosmosExtension),eps=2e-5;
function vertices(it){const m=it.m||E.M.compose(...it.p,...it.s,...(it.r||[0,0,0])),mesh=E.geometry(it.kind),stride=it.kind==='timber-panel'?8:6,out=[];
 for(let i=0;i<mesh.length;i+=stride)out.push(E.M.transform(m,Array.from(mesh.slice(i,i+3))));return out;}
const inRect=(x,z,p,epsilon=0)=>Math.abs(x-p.x)<=p.w/2+epsilon&&Math.abs(z-p.z)<=p.d/2+epsilon;
const pointDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
function cellDistance(a,b,c){
 let lo=0,hi=1;for(const[k,min,max]of[['x',c.minX,c.maxX],['z',c.minZ,c.maxZ]]){const v=b[k]-a[k];if(Math.abs(v)<1e-12){if(a[k]<min||a[k]>max){lo=2;break;}}else{let u=(min-a[k])/v,t=(max-a[k])/v;if(u>t)[u,t]=[t,u];lo=Math.max(lo,u);hi=Math.min(hi,t);}}
 if(lo<=hi)return 0;
 const rectDistance=p=>Math.hypot(Math.max(c.minX-p.x,0,p.x-c.maxX),Math.max(c.minZ-p.z,0,p.z-c.maxZ));
 return Math.min(rectDistance(a),rectDistance(b),...[[c.minX,c.minZ],[c.minX,c.maxZ],[c.maxX,c.minZ],[c.maxX,c.maxZ]].map(([x,z])=>pointDistance({x,z},a,b)));
}
function capsuleSupported(a,b,r){
 // Independent continuous swept-disc check against uncovered arrangement
 // cells. This is deliberately different from production exposed-edge math.
 const minX=Math.min(a.x,b.x)-r,maxX=Math.max(a.x,b.x)+r,minZ=Math.min(a.z,b.z)-r,maxZ=Math.max(a.z,b.z)+r;
 const xs=[minX,maxX],zs=[minZ,maxZ];for(const p of N.PATCHES){for(const x of[p.x-p.w/2,p.x+p.w/2])if(x>minX&&x<maxX)xs.push(x);for(const z of[p.z-p.d/2,p.z+p.d/2])if(z>minZ&&z<maxZ)zs.push(z);}
 const unique=a=>[...new Set(a)].sort((a,b)=>a-b),xx=unique(xs),zz=unique(zs);
 for(let i=1;i<xx.length;i++)for(let j=1;j<zz.length;j++){const c={minX:xx[i-1],maxX:xx[i],minZ:zz[j-1],maxZ:zz[j]},x=(c.minX+c.maxX)/2,z=(c.minZ+c.maxZ)/2;
  if(!N.PATCHES.some(p=>inRect(x,z,p))&&cellDistance(a,b,c)<r-1e-8)return false;
 }return true;
}

test('exact original source fixtures and installed catalogue match the declared freeze',()=>{
 for(const[name,hash]of Object.entries(expected))assert.equal(sha(path.join(PREIMAGE,name)),hash,name);
 assert.equal(sha(DATA),'64e2605486bd499e5aafcf953f2f0e985896ad0c00343efe33e9c15f52e34069');
});
test('original geometry rejects the new reach; installed owner adds only seven patches/eight solids',()=>{
 assert.equal(old.N.walkable(54,-44,.95),false);assert.equal(old.N.pick([54,15,-44],[0,-1,0]),null);
 assert.equal(old.N.height(26,-27)===4.77,false);
 assert.equal(N.walkable(54,-44,.95),true);assert.equal(N.height(26,-27),4.77);
 assert.equal(N.PATCHES.length-old.N.PATCHES.length,7);assert.equal(N.SOLIDS.length-old.N.SOLIDS.length,8);
 assert.deepEqual(plain(N.PATCHES.slice(-7)),plain(g.patches));assert.deepEqual(plain(N.SOLIDS.slice(-8)),plain(g.solids));
 assert.equal(N.EXTENSION.dynamicCollision,false);assert.equal(W.definition(N.ROOM).bounds,N.BOUNDS);
});
test('existing entry, slopes, actors, instrument and all legacy geometry remain exact',()=>{
 for(const field of['GATE','ENTRY'])assert.deepEqual(plain(N[field]),plain(old.N[field]));
 for(const[field,base]of[['PATCHES','BASE_PATCHES'],['SOLIDS','BASE_SOLIDS'],['POINTS','BASE_POINTS']])assert.deepEqual(plain(N[base]),plain(old.N[field]));
 for(const p of old.N.POINTS)assert.equal(N.height(p.x,p.z),old.N.height(p.x,p.z));
 for(let z=-31;z<=22;z+=.1)for(const x of[-15,0,12])assert.equal(N.height(x,z),old.N.height(x,z));
 assert.deepEqual(plain(W.definition(N.ROOM).quest),plain(old.W.definition(old.N.ROOM).quest));
});
test('every declared route is accepted by both real physical owners with full body/capsule clearance',()=>{
 for(const route of g.routes)for(let i=0;i<route.points.length;i++){
  const p=route.points[i];assert.ok(N.walkable(p.x,p.z,route.radius),route.id+' body');assert.ok(W.walkable(N.ROOM,p.x,p.z,route.radius));
  assert.ok(capsuleSupported(p,p,route.radius),route.id+' continuous disc');
  if(i){const a=route.points[i-1];assert.ok(N.segment(a,p,route.radius),route.id+' segment');assert.ok(W.segment(N.ROOM,a,p,route.radius));assert.ok(capsuleSupported(a,p,route.radius),route.id+' capsule');}
 }
});
test('all action/witness anchors and full ring/cross court footprints fit actual fixed-height support',()=>{
 for(const p of [...D.definition.steps,...D.definition.witnesses]){assert.ok(N.walkable(p.x,p.z,.31),p.id);assert.ok(capsuleSupported(p,p,.31));assert.ok(Math.abs(N.height(p.x,p.z)-4.77)<1e-12);}
 for(const e of D.definition.enemies){assert.ok(N.walkable(e.x,e.z,e.radius),e.id);assert.ok(capsuleSupported(e,e,e.radius));}
 const e=D.definition.enemies.find(e=>e.id.includes('guardian'));
 for(let a=0;a<Math.PI*2;a+=Math.PI/120)assert.ok(N.land(e.x+4.6*Math.cos(a),e.z+4.6*Math.sin(a),.31));
 for(const axis of D.patterns.guardian.cross.axes)for(let d=-6.5;d<=6.5;d+=.2)assert.ok(N.land(e.x+Math.sin(axis)*d,e.z+Math.cos(axis)*d,.55));
});
test('public loop remains physical regardless of any proposed saved campaign choice/open state',()=>{
 const sim=new C.Simulation(),before=JSON.stringify({patches:N.PATCHES,solids:N.SOLIDS});
 for(const saved of[undefined,{accepted:false,opened:false},{accepted:true,opened:false,choice:'public-record'},{accepted:true,opened:true,choice:'bounded-account'}]){
  sim.state.cosmosCampaign=saved;for(const r of g.routes)for(let i=1;i<r.points.length;i++)assert.ok(N.segment(r.points[i-1],r.points[i],r.radius));
  assert.equal(JSON.stringify({patches:N.PATCHES,solids:N.SOLIDS}),before);
 }
});
test('exact body support rejects compass-sample holes and unsupported patch shortcuts',()=>{
 // Concave corner at garden x33 and loop z-33. The unsupported bay lies
 // between south/east compass samples: every old sample fits, the disc does not.
 const p={x:32.83,z:-32.75},r=.31;
 const compass=[[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]];
 assert.ok(compass.every(([dx,dz])=>N.PATCHES.some(q=>inRect(p.x+dx,p.z+dz,q))),'nine-point check would incorrectly accept this real corner');
 assert.equal(capsuleSupported(p,p,r),false);assert.equal(N.land(p.x,p.z,r),false);assert.equal(W.land(N.ROOM,p.x,p.z,r),false);
 assert.equal(N.segment({x:30,z:-47},{x:42,z:-29},.31),false);
 assert.equal(N.walkable(42,-49,.31),false);assert.equal(N.pick([42,20,-49],[0,-1,0]),null);
 for(const bad of[NaN,Infinity,-1,2.01]){assert.equal(N.land(22,-40,bad),false);assert.equal(N.segment({x:22,z:-40},{x:30,z:-40},bad),false);}
});
test('each real blocker refuses body, sight and first-hit pick while the declared detour stays clear',()=>{
 for(const s of g.solids){assert.equal(N.walkable(s.x,s.z),false,s.id);assert.equal(N.pick([s.x,25,s.z],[0,-1,0]),null,s.id);
  const a={x:s.x-s.w/2-1,z:s.z},b={x:s.x+s.w/2+1,z:s.z};assert.equal(N.line(a,b),false,s.id+' LOS');}
 assert.equal(N.segment({x:47,z:-44},{x:54,z:-44},.95),false);
 assert.ok(N.segment({x:47,z:-47},{x:54,z:-47},.95));
 assert.ok(N.line({x:47,z:-42},{x:54,z:-42}));
});
test('real height-aware picks see garden/road/court, and camera blocker bounds match all eight solids',()=>{
 for(const p of [{x:14,z:-40},{x:26,z:-27},{x:30,z:-48},{x:44,z:-29},{x:54,z:-54.4},{x:54,z:-44}]){
  const q=N.pick([p.x,20,p.z],[0,-1,0]);assert.ok(q,JSON.stringify(p));assert.ok(Math.hypot(q.x-p.x,q.z-p.z)<1e-9);assert.equal(N.height(q.x,q.z),4.77);
 }
 for(const s of g.solids){const it=extension.find(i=>i.worldSolidId===s.id),b=E.solidBounds(it.kind,it);assert.ok(b,'camera '+s.id);assert.ok(updated.e.cameraSolids.some(q=>JSON.stringify(q)===JSON.stringify(b)),'real submitted camera envelope '+s.id);}
});
test('actual production Core routes from Anik to every new anchor and back around the permanent public loop',()=>{
 const room={id:N.ROOM},from={x:3,z:-43};
 for(const p of [...N.POINTS.slice(old.N.POINTS.length),...D.definition.steps]){
  const route=C.pathfind(from,p,room);assert.ok(route,p.id);let a=from;for(const b of route){assert.ok(N.segment(a,b,.31),p.id+' actual smoothed segment');assert.ok(capsuleSupported(a,b,.31),p.id+' capsule');a=b;}
 }
});
test('real movement and ordinary return preserve the empty installed campaign and fee balances',()=>{
 const sim=new C.Simulation(),ctx={sim,active:'synthetic-geometry-visitor',revision:3};
 // Labelled CPU travel boundary fixture, not an earned campaign journey.
 sim.state.player={x:14,z:-5,yaw:0};const saved=sim.snapshot();
 assert.ok(N.enter(N.preview(ctx).ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);
 let ticks=0;for(const p of [{x:3,z:-43},{x:22,z:-40},{x:47,z:-44},{x:47,z:-29},{x:26,z:-29},{x:22,z:-40}]){
  assert.ok(sim.moveTo(p.x,p.z).ok);while(sim.playerPath.length&&ticks<12000){const a={...sim.state.player};sim.tick(.1);assert.ok(N.segment(a,sim.state.player,.31));ticks++;}
  assert.equal(sim.playerPath.length,0);assert.ok(Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<.1);
 }
 assert.ok(N.leave(sim).ok);const after=plain(sim.snapshot().adventure),prior=plain(saved.adventure);assert.ok(after.elapsed>prior.elapsed,'ordinary live time progressed');after.elapsed=prior.elapsed;
 assert.deepEqual(after,prior);assert.deepEqual(plain(sim.snapshot().realmTrails),plain(saved.realmTrails));
 assert.deepEqual(plain(sim.state.player),plain(saved.player));assert.deepEqual(plain(sim.state.cosmosCampaign),plain(C.fresh().cosmosCampaign));
});
test('new geometry art uses actual WorldArt and real mesh transforms; exact opaque envelope metadata survives submission',()=>{
 for(const s of g.solids){const models=extension.filter(i=>i.worldSolidId===s.id);assert.equal(models.length,1,s.id);const it=models[0];
  assert.equal(it.kind,'box');assert.equal(it.cameraSolid,true);assert.equal(it.cutaway,false);assert.deepEqual(plain(it.p),[s.x,4.77+s.h/2,s.z]);assert.deepEqual(plain(it.s),[s.w,s.h,s.d]);
  const vv=vertices(it);for(const v of vv){assert.ok(inRect(v[0],v[2],s,eps));assert.ok(v[1]>=4.77-eps&&v[1]<=4.77+s.h+eps);}
 }
 for(const i of extension){assert.ok(vertices(i).every(p=>p.every(Number.isFinite)));assert.ok(i.s.every(n=>n>0));}
});
test('new floor partition is an exact nonoverlapping rectangle union excluding the original ground',()=>{
 const tiles=Art.serviceTiles(),xs=[...new Set([...N.PATCHES.flatMap(p=>[p.x-p.w/2,p.x+p.w/2]),...tiles.flatMap(t=>[t.lo,t.hi])])].sort((a,b)=>a-b),zs=[...new Set([...N.PATCHES.flatMap(p=>[p.z-p.d/2,p.z+p.d/2]),...tiles.flatMap(t=>[t.minZ,t.maxZ])])].sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){const x=(xs[i-1]+xs[i])/2,z=(zs[j-1]+zs[j])/2,wanted=g.patches.some(p=>inRect(x,z,p))&&!N.BASE_PATCHES.some(p=>inRect(x,z,p)),found=tiles.filter(t=>x>t.lo&&x<t.hi&&z>t.minZ&&z<t.maxZ);
  assert.equal(found.length,wanted?1:0,'partition '+x+','+z);}
 const ground=extension.filter(i=>i.cosmosExtensionGround);assert.equal(ground.length,tiles.length);
 for(const i of ground){assert.equal(i.p[1]+i.s[1]/2,4.77);const vv=vertices(i);assert.ok(vv.some(v=>Math.abs(v[1]-4.77)<eps),'actual transformed top reaches physical floor');
  for(const v of vv){assert.ok(g.patches.some(p=>inRect(v[0],v[2],p,eps)));assert.ok(v[1]<=4.77+eps);}
 }
 assert.ok(ground.some(i=>i.p[2]-i.s[2]/2===-55),'court beyond old -53 strip is actually rendered');
});
test('old sloping floor/vegetation, observatory and sky submissions stay byte-equivalent; new slabs never flatten them',()=>{
 assert.deepEqual(plain(updated.items.filter(i=>!i.cosmosExtension)),plain(original.items));
 const oldFloor=updated.items.filter(i=>!i.cosmosExtension&&i.terrain);assert.ok(oldFloor.some(i=>Math.abs(i.r?.[0]||0)>.05),'actual slope still rendered');
 for(const it of oldFloor)for(const v of vertices(it))if(Math.abs(v[1]-old.N.height(v[0],v[2]))<.025)assert.ok(Math.abs(v[1]-N.height(v[0],v[2]))<.025);
 const mixed=Art.serviceTiles([{id:'flat',x:2,z:0,w:4,d:4,y:4.77}],[{id:'old-slope',x:0,z:0,w:2,d:4}]);
 assert.ok(mixed.length);assert.ok(mixed.every(t=>t.lo>=1&&t.y===4.77),'adjacent mixed plane owners do not merge');
});
test('paint/work/plant details stay on genuine supported surfaces and create no extra opaque blocker',()=>{
 const details=extension.filter(i=>!i.cosmosExtensionGround&&!i.cosmosExtensionMass&&!i.worldSolid);
 for(const it of details){assert.equal(it.cameraSolid,false);assert.equal(E.solidBounds(it.kind,it),null);
  for(const v of vertices(it))assert.ok(g.patches.some(p=>inRect(v[0],v[2],p,eps)),'unsupported ornament '+it.p);
 }
 assert.equal(extension.filter(i=>E.solidBounds(i.kind,i)).length,8);
 const paint=details.filter(i=>i.cosmosExtensionPaint);assert.ok(paint.length>100);for(const it of paint)for(const v of vertices(it))assert.ok(N.walkable(v[0],v[2],0),'paint must not enlarge ground or paint over cover');
});
test('new static geometry stays bounded and art import/make/draw grant no campaign or economic facts',t=>{
 const triangles=extension.reduce((n,i)=>n+E.geometry(i.kind).length/(i.kind==='timber-panel'?24:18),0),sim=new C.Simulation(),before=plain(sim.snapshot());
 assert.ok(extension.length<700);assert.ok(triangles<12000);assert.equal(updated.e.noWater,true);assert.equal(updated.e.theme,'cosmos');
 const out={box:[],round:[],octa:[],disc:[]};sim.room=N.ROOM;const state=JSON.stringify(sim.state);Art.draw(out,sim,0,updated.a);assert.equal(JSON.stringify(sim.state),state);
 assert.deepEqual(plain(C.validate(before)),before);assert.deepEqual(plain(sim.state.cosmosCampaign),plain(C.fresh().cosmosCampaign));
 t.diagnostic(extension.length+' added static instances / '+triangles+' actual procedural triangles / '+updated.e.batches.length+' shared static batches');
});
test('actual repaired Core keeps the large-body cover detour and map frames the full supported reach',()=>{
 const a={x:47,z:-42.9},b={x:51,z:-42.9},r=.95,p=C.pathfind(a,b,{id:N.ROOM},false,r);
 assert.ok(p);assert.equal(N.segment(a,b,.31),true);assert.equal(N.segment(a,b,r),false);
 assert.ok(p.every((q,i)=>N.segment(i?p[i-1]:a,q,r)),'every actual large-body path link clears permanent cover');
 assert.ok(p.every((q,i)=>capsuleSupported(i?p[i-1]:a,q,r)),'every detour has independent whole-capsule support');
 live.load('./cosmos-ui.js');const projection=live.context.RealmCosmosUI.projection(420,530);
 for(const x of[N.BOUNDS.minX,N.BOUNDS.maxX])for(const z of[N.BOUNDS.minZ,N.BOUNDS.maxZ]){
  const px=projection.x+x*projection.scale,pz=projection.y+z*projection.scale;assert.ok(px>=0&&px<=420&&pz>=0&&pz<=530,'all physical bound corners fit the actual map projection');
 }
});
// Existing eight source regressions also execute against the installed
// physical owner with actual Core/Adventure/Combat/validation dependencies.
live.load('../tests/cosmos.test.cjs');
test('all source dependencies remained byte-frozen throughout the focused run',()=>{
 for(const[file,hash]of dependencies)assert.equal(sha(file),hash,file);
 console.log('INSTALLED_GEOMETRY_INPUT_FILES '+dependencies.size);
});
