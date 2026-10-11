/* Actual module/mesh CPU checks only; no WebGL or rendered-appearance claim. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const E=require('../src/engine.js'),T=require('../src/traveler-art.js'),C=require('../src/core.js'),X=require('../src/creative.js'),Gear=require('../src/traveler-equipment-art.js');
require('../src/combat.js');require('../src/arsenal.js');require('../src/pursuit.js');require('../src/starter.js');require('../src/realm-craft.js');require('../src/world.js');
const W=globalThis.RealmArt.WorldArt,cloth=['jacket-waist','jacket-left-hem','jacket-right-hem'];
const empty=()=>({box:[],round:[],octa:[],disc:[],'traveler-cloth':[]}),all=o=>Object.entries(o).flatMap(([kind,items])=>items.map(it=>({kind,...it}))),plain=v=>JSON.parse(JSON.stringify(v));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
let oldSource=fs.readFileSync(path.join(__dirname,'../src/traveler-art.js'),'utf8').replace("\n out['traveler-cloth']||=([]);",'');
for(const p of cloth)oldSource=oldSource.replace("'traveler-cloth','"+p+"'","'box','"+p+"'");
assert.equal(hash(oldSource),'028ef71f9efeb491e23ac26e2e10490fcd1ba1d535c6333c4488fdf0eac61d0a','Exact old rig bytes reconstructed; no invented baseline');
const oldHost={RealmEngine:E,RealmCreative:X};vm.runInNewContext(oldSource,oldHost);const Old=oldHost.RealmTravelerArt;
const draw=(owner,opts,input={})=>{const out=empty(),frame=owner.draw(out,{x:2,z:-1,base:1.3,yaw:.3,profile:{skin:1,hair:2,cloak:3},...input},owner.pose(opts));return{out,parts:all(out),frame};};
function vertices(kind){const d=E.geometry(kind),v=[];for(let i=0;i<d.length;i+=6)v.push([d[i],d[i+1],d[i+2]]);return v;}
function meshContract(d){
 assert.equal(d.length,64*18,'explicit cloth mesh, not a geometry fallback');
 const edge=new Map(),directions=new Set(),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 const key=p=>p.map(n=>Object.is(n,-0)?'0':n.toFixed(7)).join(',');
 for(let i=0;i<d.length;i+=18){
  const p=[0,6,12].map(j=>[d[i+j],d[i+j+1],d[i+j+2]]),n=[d[i+3],d[i+4],d[i+5]],cross=E.cross(E.sub(p[1],p[0]),E.sub(p[2],p[0]));
  assert.ok([...p.flat(),...n].every(Number.isFinite));assert.ok(Math.hypot(...cross)>1e-7,'nondegenerate triangle');
  assert.ok(Math.abs(Math.hypot(...n)-1)<2e-7,'unit normal');assert.ok(E.dot(E.norm(cross),n)>1-2e-7,'normal follows winding');
  assert.ok(E.dot(p[0].map((v,j)=>(v+p[1][j]+p[2][j])/3),n)>0,'outward convex surface');
  directions.add(key(n));
  for(const v of p)for(let j=0;j<3;j++){assert.ok(v[j]>=-.5&&v[j]<=.5,'old box containment');lo[j]=Math.min(lo[j],v[j]);hi[j]=Math.max(hi[j],v[j]);}
  for(let j=0;j<3;j++){const a=key(p[j]),b=key(p[(j+1)%3]),k=[a,b].sort().join('|'),q=edge.get(k)||{count:0,orientation:0};q.count++;q.orientation+=a<b?1:-1;edge.set(k,q);}
 }
 assert.deepEqual(lo,[-.5,-.5,-.5]);assert.deepEqual(hi,[.5,.5,.5]);assert.ok(directions.size>6,'bevel planes instead of six box faces');
 for(const e of edge.values()){assert.equal(e.count,2,'closed manifold edge');assert.equal(e.orientation,0,'opposite edge winding');}
 return{triangles:d.length/18,vertices:d.length/6,bytes:d.byteLength,normalDirections:directions.size,edges:edge.size};
}
test('original centered cloth geometry has finite closed outward bevels inside the old box',()=>{
 meshContract(E.geometry('traveler-cloth'));
 for(const kind of ['box','round','octa','disc'])assert.notDeepEqual(E.geometry('traveler-cloth'),E.geometry(kind),'not a renamed old primitive');
});
test('only three coat pieces change mesh; all 49 parts, matrices, materials and pose functions remain exact',()=>{
 assert.equal(T.motion.toString(),Old.motion.toString());assert.equal(T.pose.toString(),Old.pose.toString());
 for(const style of ['none','blade','bow'])for(const phase of ['idle','anticipate','recover','withdraw'])for(const reducedMotion of [false,true]){
  const opts={style,combatScene:true,combatPhase:phase,combatProgress:.45,withdrawFrom:.85,phase:.9,blend:.7,time:2,reducedMotion};
  const a=draw(Old,opts),b=draw(T,opts);assert.deepEqual(plain(a.frame),plain(b.frame));assert.equal(a.parts.length,49);assert.equal(b.parts.length,49);
  assert.deepEqual(b.out['traveler-cloth'].map(p=>p.travelerPart),cloth);
  const before=new Map(a.parts.map(p=>[p.travelerPart,p]));
  for(const part of b.parts){const old=before.get(part.travelerPart);assert.ok(old);assert.equal(part.cameraSolid,false);assert.equal(E.solidBounds(part.kind,part),null);assert.equal(part.cutaway,false);assert.deepEqual(plain({...part,kind:old.kind}),plain(old),'only kind changes: '+part.travelerPart);}
 }
});
test('actual production camera projection contains every new coat vertex in its original projected box',()=>{
 const engine=Object.create(E.Engine.prototype);engine.canvas={clientWidth:1440,clientHeight:960};
 const hull=points=>{const s=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),side=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),lo=[],hi=[];for(const p of s){while(lo.length>1&&side(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of s.toReversed()){while(hi.length>1&&side(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));};
 let samples=0;
 for(const projection of ['perspective','orthographic'])for(let yaw=0;yaw<8;yaw++)for(const combatPhase of ['idle','anticipate','recover','withdraw']){
  const body=draw(T,{style:'blade',combatScene:true,combatPhase,combatProgress:.5,withdrawFrom:.9,time:1},{yaw:yaw*Math.PI/4}),target=[2,2.4,-1];
  engine.setCamera({projection,eye:[6,4.8,7],target,aspect:1.5,half:7,fov:60});
  for(const p of body.out['traveler-cloth']){
   const box=vertices('box').map(v=>E.M.transform(p.m,v)).map(v=>engine.project(...v)),h=hull(box);
   for(const v of vertices('traveler-cloth')){const q=engine.project(...E.M.transform(p.m,v));assert.ok(q.visible,'normal camera sees cloth specimen');for(let i=0;i<h.length;i++){const a=h[i],b=h[(i+1)%h.length];assert.ok((b.x-a.x)*(q.y-a.y)-(b.y-a.y)*(q.x-a.x)>=-1e-4,'projected old box hull containment');}samples++;}
  }
 }
 assert.equal(samples,2*8*4*3*192);
});
test('real WorldArt commits one ordinary cloth batch and retains traveler owner/snapshot dispatch',()=>{
 const batches=[],host={camera:{eye:[37,32,37],projection:'perspective'},batch(kind,items,dynamic,options){const b={kind,items,dynamic,options};batches.push(b);return b;}};
 const art=Object.create(W.prototype);Object.assign(art,{e:host,room:'probe-owned-cpu-room',map:{}});art.commit();
 assert.equal(batches.filter(b=>b.kind==='traveler-cloth').length,1);assert.equal(art.dynamicTravelerCloth.dynamic,true);
 const sim=new C.Simulation();globalThis.RealmArsenal.runtime(sim);const saved=JSON.stringify(sim.snapshot()),out=empty();art.room=null;art.time=0;art.traveler(out,sim);
 assert.equal(JSON.stringify(sim.snapshot()),saved,'actual rules/store state untouched');const snap=art.travelerSnapshot();
 assert.equal(snap.parts.length,49);assert.equal(snap.parts.filter(p=>p.kind==='traveler-cloth').length,3);assert.equal(snap.frame.combatPhase,'idle');
 art.update(sim,0,null);assert.deepEqual(art.dynamicTravelerCloth.items.map(p=>p.travelerPart),cloth,'actual ordinary update submits exactly three cloth instances');assert.equal(JSON.stringify(sim.snapshot()),saved);
});
test('actual Engine batch packs the same three transforms in one supported 6-float mesh',()=>{
 // Synthetic GL interface records uploads; the actual batch/update methods run.
 let next=0,bound=null;const uploads=new Map(),g={ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,FLOAT:4,createBuffer:()=>({buffer:++next}),createVertexArray:()=>({vao:++next}),bindBuffer:(target,b)=>{bound=b;},bufferData:(target,data,usage)=>uploads.set(bound,{data:data.slice(),usage}),bindVertexArray(){},enableVertexAttribArray(){},vertexAttribPointer(){},vertexAttribDivisor(){}};
 const engine=Object.create(E.Engine.prototype);Object.assign(engine,{gl:g,meshes:new Map(),batches:[],dynamic:[]});
 const parts=draw(T,{time:1}).out['traveler-cloth'],batch=engine.batch('traveler-cloth',parts,true);
 assert.equal(batch.kind,'traveler-cloth');assert.equal(batch.geom.stride,6);assert.equal(batch.geom.count,192);assert.equal(batch.count,3);assert.equal(next,3);
 assert.equal(engine.meshes.size,1);assert.deepEqual(uploads.get(batch.geom.buffer).data,E.geometry('traveler-cloth'));assert.equal(uploads.get(batch.buf).data.byteLength,3*96);
 for(let i=0;i<3;i++)assert.deepEqual(Array.from(batch.data.slice(i*24,i*24+16)),Array.from(parts[i].m));
 assert.deepEqual(batch.cameraSolids,[]);assert.equal(engine.dynamic.length,1);
});
test('every canonical weapon and finite marker remains byte-identical with the same original attachment frame',()=>{
 const A=globalThis.RealmAdventure,AR=globalThis.RealmArsenal,sim=new C.Simulation();let max=0,variants=0;
 for(const [id,gear] of Object.entries(A.GEAR).filter(([,g])=>g.slot==='weapon'))for(const combatScene of [false,true]){
  // Catalogue/marker coverage is explicitly synthetic ownership, not command-earned progress.
  const a=sim.state.adventure;a.started=true;if(!a.owned.includes(id))a.owned.push(id);a.equipment.weapon=id;
  a.arsenal.sockets[id]='moonstone';a.pursuit.fittings[id]=2;a.starter.accepted=true;a.starter.bundles=globalThis.RealmStarter.BUNDLES.map(b=>b.id);a.starter.reward={choice:'temper',weapon:id};if(!a.defeated.includes('river-old-bristle'))a.defeated.push('river-old-bristle');
  const opts={style:AR.weapon(a).style,combatScene,combatPhase:'withdraw',combatProgress:.3,withdrawFrom:.8,time:2},old=draw(Old,opts),now=draw(T,opts),oa=empty(),ob=empty(),before=JSON.stringify(sim.snapshot());
  const sa=Gear.draw(oa,sim,old.frame),sb=Gear.draw(ob,sim,now.frame);assert.deepEqual(plain(sa),plain(sb));assert.deepEqual(plain(oa),plain(ob));assert.equal(JSON.stringify(sim.snapshot()),before);
  assert.ok(all(ob).length<=40);max=Math.max(max,all(ob).length);variants++;
 }
 assert.equal(variants,14);assert.ok(max>0);
});
test('envelope, normal, topology and unsupported-mesh counterexamples fail the meaningful mesh guards',()=>{
 const d=E.geometry('traveler-cloth'),escape=d.slice();escape[0]=.51;assert.throws(()=>meshContract(escape));
 const wrong=d.slice();wrong[3]=0;wrong[4]=0;wrong[5]=0;assert.throws(()=>meshContract(wrong));
 assert.throws(()=>meshContract(d.slice(18)));assert.throws(()=>meshContract(E.geometry('missing-traveler-cloth')));
});
