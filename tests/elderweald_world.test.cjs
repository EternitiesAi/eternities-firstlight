/* CPU production-data and submitted-mesh qualification. No WebGL or save edits. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const X=require('../src/elderweald-world.js'),South=require('../src/world-atlantis-earth.js'),E=require('../src/engine.js');
const F=1.57,R=.31,BODY=1.7,EPS=2e-5,ext=X.extension;
const source=fs.readFileSync(require.resolve('../src/elderweald-world.js'),'utf8');
const installed=South.realms[0],collections=['patches','solids','points','routes'];
const extensionIds=Object.fromEntries(collections.map(k=>[k,new Set(ext[k].map(p=>p.id))]));
// Source-only and installed production runs share the same fixture. Remove only
// this extension's IDs before composing once; raw installed data is independently
// checked below so missing/duplicated/changed installed geometry cannot be hidden.
const installedContainsExtension=collections.some(k=>installed[k]?.some(p=>extensionIds[k].has(p.id)));
const original={...installed,...Object.fromEntries(collections.map(k=>[k,installed[k].filter(p=>!extensionIds[k].has(p.id))]))},earth={...original,
 bounds:{minX:Math.min(original.bounds.minX,ext.bounds.minX),maxX:Math.max(original.bounds.maxX,ext.bounds.maxX),minZ:Math.min(original.bounds.minZ,ext.bounds.minZ),maxZ:Math.max(original.bounds.maxZ,ext.bounds.maxZ)},
 patches:[...original.patches,...ext.patches],solids:[...original.solids,...ext.solids],points:[...original.points,...ext.points],routes:[...original.routes,...ext.routes]};
// The actual production functions receive a composed catalogue in an isolated
// VM. This is a data-composition fixture, not a played or progressed character.
const sandbox={RealmWorldAtlantisEarth:{realms:[earth,South.realms[1]]},
 RealmWorldHeavenHell:require('../src/world-heaven-hell.js'),RealmCosmos:require('../src/cosmos.js'),module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/world-foundations.js'),'utf8'),sandbox);
const W=sandbox.module.exports;
const InstalledW=installedContainsExtension?require('../src/world-foundations.js'):null;
const matrix=p=>p.opt.m||E.M.compose(...p.p,...p.s);
function vertices(p){const data=E.geometry(p.kind),stride=E.meshStride(p.kind),m=matrix(p),out=[];for(let i=0;i<data.length;i+=stride)out.push(E.M.transform(m,data.slice(i,i+3)));return out;}
function bounds(p,wind=true){const vs=vertices(p),min=[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),max=[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])));if(wind&&p.opt.wind===2){min[0]-=.095;max[0]+=.095;min[1]-=.05;max[1]+=.05;}return{min,max};}
function interval(a,b,lo,hi){let first=0,last=1;for(let i=0;i<3;i++){const d=b[i]-a[i];if(Math.abs(d)<1e-9){if(a[i]<lo[i]||a[i]>hi[i])return null;}else{const x=(lo[i]-a[i])/d,y=(hi[i]-a[i])/d;first=Math.max(first,Math.min(x,y));last=Math.min(last,Math.max(x,y));if(first>last)return null;}}return[first,last];}
const near=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<EPS,`${v} != ${b[i]}`));
function deeplyFrozen(o){if(o&&typeof o==='object'){assert.ok(Object.isFrozen(o));Object.values(o).forEach(deeplyFrozen);}}
const allAnchors=[...ext.points,...ext.landmarks,...ext.encounterClearings];
function bodyClearBounds(a,b,bb){return interval([a[0],F+.03,a[1]],[b[0],F+.03,b[1]],
 [bb.min[0]-R,bb.min[1]-BODY,bb.min[2]-R],[bb.max[0]+R,bb.max[1],bb.max[2]+R])===null;}
function bodyClear(a,b,p){return bodyClearBounds(a,b,bounds(p));}
function local(p,q){const m=matrix(p);return[0,4,8].map(i=>{const c=Array.from(m.slice(i,i+3));return E.dot(c,q.map((v,j)=>v-m[12+j]))/E.dot(c,c);});}
function inside(p,q){const [x,y,z]=local(p,q);if(p.kind==='octa')return Math.abs(x)/.5+Math.abs(y)/.65+Math.abs(z)/.5<=1+1e-6;if(p.kind==='round')return x*x+y*y+z*z<=.25+1e-6;return[x,y,z].every(n=>Math.abs(n)<=.5+1e-6);}

test('Rill native diorama approach clears the former foreground canopy with a detecting old-placement control',()=>{
 const eye=[-32.889606,59.975416,29.422589],rill=[-67,2.44,-4];
 for(const quality of ['low','balanced','high']){
  const tree=X.parts({quality}).filter(p=>['elderweald-trunk-2','elderweald-trunk-5'].includes(p.opt.solidId));
  assert.ok(tree.length>5);
  for(const p of tree){const b=bounds(p);assert.equal(interval(eye,rill,b.min,b.max),null,quality+' foreground '+p.opt.elderwealdPart);}
  const crown=tree.find(p=>p.opt.solidId==='elderweald-trunk-5'&&p.opt.elderwealdPart==='upper-crown');
  const old={...crown,p:[-63,crown.p[1],-1]};
  const t=(old.p[1]-eye[1])/(rill[1]-eye[1]),hit=eye.map((v,i)=>v+t*(rill[i]-v));
  assert.ok(t>0&&t<1);assert.ok(inside(old,hit),'previous placement must reproduce the actual opaque crown intersection');
 }
});

test('camp low diorama ray clears the moved stands and detects the intermediate blocking placement',()=>{
 const eye=[-13.129816598862178,21.45106878114634,24.063575556933962],camp=[-76,2.1700273892347073,-12];
 const hits=p=>{const a=local(p,eye),b=local(p,camp),d=b.map((v,i)=>v-a[i]);
  if(p.kind==='octa'){const ts=[0,1,...a.map((v,i)=>d[i]===0?-1:-v/d[i]).filter(t=>t>=0&&t<=1)];return ts.some(t=>inside(p,eye.map((v,i)=>v+t*(camp[i]-v))));}
  if(p.kind==='round'){const t=Math.max(0,Math.min(1,-E.dot(a,d)/E.dot(d,d)));return inside(p,eye.map((v,i)=>v+t*(camp[i]-v)));}
  return interval(a,b,[-.5,-.5,-.5],[.5,.5,.5])!==null;};
 for(const quality of ['low','balanced','high']){
  const trees=X.parts({quality}).filter(p=>['elderweald-trunk-2','elderweald-trunk-5'].includes(p.opt.solidId));
  for(const p of trees)assert.equal(hits(p),false,quality+' packing ray '+p.opt.elderwealdPart+' '+p.opt.solidId);
  const crown=trees.find(p=>p.opt.solidId==='elderweald-trunk-5'&&p.opt.elderwealdPart==='upper-crown');
  assert.equal(hits({...crown,p:[-55,crown.p[1],-4]}),true,'intermediate keeper fix must reproduce the packing-area obstruction');
 }
});

test('isolated global/CommonJS expose only the pure API and recursively frozen authority data',()=>{
 const box={module:{exports:{}},sentinel:5};vm.runInNewContext(source,box);
 assert.equal(box.module.exports,box.RealmElderwealdWorld);assert.equal(box.sentinel,5);assert.equal(Object.keys(box).length,3);
 assert.deepEqual(Object.keys(X),['extension','parts']);assert.ok(Object.isFrozen(X));deeplyFrozen(ext);
 assert.equal(ext.realm,'earthlands');assert.equal(ext.room,'world-earthlands');assert.equal(ext.groundY,F);
 const ids=[...ext.patches,...ext.solids,...ext.points,...ext.landmarks,...ext.routes,...ext.encounterClearings].map(v=>v.id);
 assert.equal(new Set(ids).size,ids.length);ids.forEach(id=>assert.match(id,/^elderweald-[-a-z0-9]+$/));
 for(const a of ['patches','solids','points'])assert.ok(ext[a].every(p=>!original[a].some(q=>q.id===p.id)));
 for(const forbidden of ['quest','reward','enemies','state','save','dispatch'])assert.equal(ext[forbidden],undefined);
});
test('extension IDs appear exactly once and installed production retains the physical contract',()=>{
 const same=(d)=>{
  for(const key of collections)for(const expected of ext[key]){
   const matches=d[key].filter(p=>p.id===expected.id);assert.equal(matches.length,1,key+' '+expected.id+' must occur exactly once');assert.deepEqual(matches[0],expected,key+' '+expected.id+' changed');
  }
  for(const key of collections)assert.equal(new Set(d[key].map(p=>p.id)).size,d[key].length,key+' global duplicate ID');
  for(const key of ['minX','minZ'])assert.ok(d.bounds[key]<=ext.bounds[key]);for(const key of ['maxX','maxZ'])assert.ok(d.bounds[key]>=ext.bounds[key]);
 };
 same(earth);const fixture=W.definition('earthlands');assert.equal(fixture,earth);same(fixture);
 if(installedContainsExtension){
  same(installed);const actual=InstalledW.definition('earthlands');assert.equal(actual,installed,'production world catalogue must use the installed Earth definition');same(actual);
  for(const route of ext.routes)for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];assert.ok(InstalledW.segment(actual.room,{x:a[0],z:a[1]},{x:b[0],z:b[1]},R),route.id+' installed leg '+i);}
  for(const p of allAnchors)assert.ok(InstalledW.walkable(actual.room,p.x,p.z,R),p.id+' installed anchor');
 }
});
test('broad connected floor footprint and all solids are finite, bounded and supported',()=>{
 assert.equal(ext.patches.length,10);assert.equal(ext.solids.length,40);
 assert.ok(ext.patches.filter(p=>p.w>=40&&p.d>=28).length>=6);
 for(const p of ext.patches){for(const k of ['x','z','w','d','y'])assert.ok(Number.isFinite(p[k]));assert.ok(p.w>0&&p.d>0);assert.equal(p.y,F);
  assert.ok(p.x-p.w/2>=ext.bounds.minX&&p.x+p.w/2<=ext.bounds.maxX&&p.z-p.d/2>=ext.bounds.minZ&&p.z+p.d/2<=ext.bounds.maxZ);}
 for(const s of ext.solids){for(const k of ['x','z','w','d','h'])assert.ok(Number.isFinite(s[k]));assert.ok(s.w>0&&s.d>0&&s.h>0);
  for(const dx of [-s.w/2,s.w/2])for(const dz of [-s.d/2,s.d/2])assert.ok(W.land(earth.room,s.x+dx,s.z+dz,0),s.id+' footprint unsupported');}
});
test('all intended legs and old routes use the actual production full-radius support/solid rules',()=>{
 let legs=0;for(const route of [...ext.routes,...original.routes])for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i];assert.ok(W.segment(earth.room,{x:a[0],z:a[1]},{x:b[0],z:b[1]},R),route.id+' leg '+i);if(ext.routes.includes(route))legs++;}
 assert.equal(legs,31);for(const p of allAnchors){assert.equal(p.y,F);assert.ok(W.walkable(earth.room,p.x,p.z,R),p.id);}
 const main=ext.routes[0].points,close=ext.routes.at(-1).points;
 assert.deepEqual(main[0],close.at(-1));assert.deepEqual(main.at(-1),close[0]);
 const loop=[...main,...close.slice(1)],length=loop.slice(1).reduce((s,b,i)=>s+Math.hypot(b[0]-loop[i][0],b[1]-loop[i][1]),0);
 assert.ok(length>=370&&length<=470,'bounded continuous loop length '+length);
});
test('bridge crosses a real four-metre river gap with open centered approaches',()=>{
 assert.equal(W.land(earth.room,-119,-49,0),false);assert.equal(W.land(earth.room,-131,-49,0),false);
 assert.equal(W.walkable(earth.room,-125,-49,R),true);assert.equal(W.segment(earth.room,{x:-125,z:-44},{x:-125,z:-54},R),true);
 assert.equal(W.segment(earth.room,{x:-109,z:-28},{x:-125,z:-49},R),false,'old diagonal correctly hits the east rail');
 for(const p of X.parts().filter(p=>p.opt.elderwealdPart==='bridge-plank')){const b=bounds(p,false);assert.ok(b.min[1]>=F-EPS&&b.max[1]<=F+.03+EPS);assert.ok(b.min[0]>=-127.51&&b.max[0]<=-122.49);assert.ok(b.min[2]>=-53&&b.max[2]<=-45);}
 const planks=X.parts().filter(p=>p.opt.elderwealdPart==='bridge-plank');for(let i=1;i<planks.length;i++)assert.ok(bounds(planks[i-1],false).max[2]<bounds(planks[i],false).min[2],'intentional plank joints have no coplanar overlap');
});
test('root passage and enemy side pockets preserve free return routes and supported reading/support anchors',()=>{
 const west=ext.solids.find(s=>s.id==='elderweald-root-west-wall'),east=ext.solids.find(s=>s.id==='elderweald-root-east-wall');
 assert.ok(Math.abs((east.x-east.w/2)-(west.x+west.w/2)-6.6)<EPS);
 assert.ok(W.segment(earth.room,{x:-148,z:-66},{x:-148,z:-86},R));assert.ok(W.walkable(earth.room,-145,-84,R));
 for(const p of X.parts().filter(p=>['root-arch','root-keystone','masonry-cap'].includes(p.opt.elderwealdPart)))assert.ok(bounds(p).min[1]>F+BODY+.25,p.opt.elderwealdPart+' clears standing actor');
 assert.ok(Math.hypot(-119+125,-44+49)>6);assert.ok(Math.abs(-134+148)>10);
});
test('deterministic bounded tier geometry never changes frozen physical data or accesses state',()=>{
 const before=JSON.stringify(ext),options={quality:'balanced',height:()=>F};Object.defineProperty(options,'sim',{get(){throw Error('No simulation access');}});
 const counts={low:287,balanced:419,high:515};for(const quality of Object.keys(counts)){
  const a=X.parts({quality}),b=X.parts({quality});assert.deepEqual(a,b);assert.equal(a.length,counts[quality]);assert.ok(a.length<=ext.artBudget);assert.notEqual(a,b);assert.notEqual(a[0].p,b[0].p);}
 assert.deepEqual(X.parts(options),X.parts());assert.equal(JSON.stringify(ext),before);
 const a=X.parts();a[0].p[0]=999;a[0].opt.anchorFrom[0]=999;assert.notEqual(X.parts()[0].p[0],999);assert.notEqual(X.parts()[0].opt.anchorFrom[0],999);
 assert.throws(()=>X.parts({quality:'ultra'}),RangeError);assert.throws(()=>X.parts({height:()=>NaN}),RangeError);assert.throws(()=>X.parts({height:()=>3}),RangeError);assert.throws(()=>X.parts({height:3}),TypeError);assert.throws(()=>X.parts(null),TypeError);
});
test('actual submitted mesh transforms are finite, positive, orthogonal and supported-kind compatible',()=>{
 for(const quality of ['low','balanced','high'])for(const p of X.parts({quality})){
  assert.ok(['box','round','octa','timber-panel','elderweald-root-arch'].includes(p.kind));assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));assert.ok(Number.isInteger(p.c));
  const m=matrix(p),cols=[0,4,8].map(i=>Array.from(m.slice(i,i+3)));assert.ok(E.dot(cols[0],E.cross(cols[1],cols[2]))>0);
  cols.forEach((v,i)=>assert.ok(Math.abs(Math.hypot(...v)-p.s[i])<EPS));for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.abs(E.dot(cols[i],cols[j]))<EPS);
  assert.ok(vertices(p).flat().every(Number.isFinite));assert.ok(bounds(p,false).min[1]>=F-EPS,p.opt.elderwealdPart+' below ground');
  assert.equal(p.opt.cameraSolid,false);assert.equal(p.opt.appearanceOnly,true);assert.equal(p.opt.worldSolid,undefined);assert.equal(p.opt.worldRoof,undefined);
  assert.equal(E.solidBounds(p.kind,{p:p.p,s:p.s,...p.opt}),null);if(p.opt.solidId){assert.ok(ext.solids.some(s=>s.id===p.opt.solidId));assert.equal(p.opt.solidId,p.opt.worldSolidId);}
 }
});
test('every ground-detail vertex rests on actual land and low roots remain within parent clearance',()=>{
 for(const p of X.parts({quality:'high'})){
  const bb=bounds(p,false);if(bb.min[1]<F+BODY+.15)for(const v of vertices(p))assert.ok(W.land(earth.room,v[0],v[2],0),p.opt.elderwealdPart+' unsupported ground detail');
  if(p.opt.lowRoot){const t=ext.solids.find(t=>t.id===p.opt.solidId);assert.ok(bb.min[0]>=t.x-t.w/2-.15-EPS&&bb.max[0]<=t.x+t.w/2+.15+EPS);assert.ok(bb.min[2]>=t.z-t.d/2-.15-EPS&&bb.max[2]<=t.z+t.d/2+.15+EPS);assert.ok(bb.max[1]<F+.27);}
 }
});
test('actual opaque mesh envelopes clear every full-body route and task/NPC/encounter anchor',()=>{
 for(const quality of ['low','balanced','high']){
  // Reuse only within this immutable quality specimen. Lazy calculation keeps
  // the original assertion order; negative controls still take fresh bounds.
  const parts=X.parts({quality}),bb=new Map(),of=p=>{if(!bb.has(p))bb.set(p,bounds(p));return bb.get(p);};
  for(const r of ext.routes)for(let i=1;i<r.points.length;i++)for(const p of parts)assert.ok(bodyClearBounds(r.points[i-1],r.points[i],of(p)),quality+' '+r.id+' '+p.opt.elderwealdPart+' '+p.opt.solidId);
  for(const a of allAnchors)for(const p of parts)assert.ok(bodyClearBounds([a.x,a.z],[a.x,a.z],of(p)),quality+' '+a.id+' '+p.opt.elderwealdPart);
 }
});
test('branches intersect their parent and actual crown volume, with a bounded existing shader envelope',()=>{
 const text=fs.readFileSync(require.resolve('../src/engine.js'),'utf8');assert.ok(text.includes('w.x+=sin(uTime*.8+w.z*.4)*.095;w.y+=cos(uTime+w.x*.4)*.05;'));
 for(const quality of ['low','balanced','high']){
  const parts=X.parts({quality});for(const p of parts.filter(p=>p.opt.elderwealdPart==='crown-branch')){
   const s=ext.solids.find(s=>s.id===p.opt.solidId),a=p.opt.anchorFrom,b=p.opt.anchorTo;
   assert.ok(Math.abs(a[0]-s.x)<=s.w/2&&Math.abs(a[2]-s.z)<=s.d/2&&a[1]<=F+s.h);
   near(E.M.transform(matrix(p),[-.5,0,0]),a);near(E.M.transform(matrix(p),[.5,0,0]),b);
   const crown=parts.find(q=>q.opt.solidId===s.id&&q.opt.elderwealdPart==='crown-lobe'&&q.opt.branchIndex===p.opt.branchIndex);
   for(const dx of [-.095,.095])for(const dy of [-.05,.05])assert.ok(inside(crown,[b[0]-dx,b[1]-dy,b[2]]),'branch reserves volumetric overlap within existing shader envelope');
  }
 }
});
test('overlapping opaque crowns form connected rest silhouettes instead of detached floating clusters',()=>{
 for(const quality of ['low','balanced','high']){
  const parts=X.parts({quality});for(const upper of parts.filter(p=>p.opt.elderwealdPart==='upper-crown')){
   const lobes=parts.filter(p=>p.opt.solidId===upper.opt.solidId&&p.opt.elderwealdPart==='crown-lobe');
   for(const lobe of lobes){const shared=lobe.p.map((v,i)=>(v+upper.p[i])/2);assert.ok(inside(upper,shared)&&inside(lobe,shared),'actual opaque rest volumes overlap');}
  }
 }
 const ps=X.parts(),roof=ps.filter(p=>p.opt.elderwealdPart==='camp-roof');assert.equal(roof.length,2);
 for(const p of roof){assert.ok(Math.abs(p.opt.anchorFrom[1]-F-3.12)<EPS);assert.ok(Math.abs(p.opt.anchorTo[1]-F-2.5)<EPS);assert.ok(p.opt.anchorFrom[0]===-74);assert.ok(bounds(p).min[1]>F+BODY+.25);}
});
test('overhead crown and shelter parts follow cutaway while collision/camera authority is unchanged',()=>{
 for(const p of X.parts()){
  if(['crown-branch','crown-lobe','upper-crown','camp-roof','camp-rafter','camp-tie-beam','root-arch','root-keystone'].includes(p.opt.elderwealdPart))assert.equal(p.opt.cutaway,true);
  else assert.equal(p.opt.cutaway,false);
  if(p.opt.foliage)assert.equal(p.opt.wind,2);else assert.equal(p.opt.wind,undefined);
 }
 for(const quality of ['low','balanced','high']){
  const ps=X.parts({quality}),vertexWork=ps.reduce((n,p)=>n+E.geometry(p.kind).length/E.meshStride(p.kind),0);
  assert.ok(vertexWork<85000,'bounded CPU mesh vertices per render pass '+vertexWork);
 }
});

/* North-root prototype: actual installed geometry/modules, CPU submission
 * collectors only. No shader compilation, native witness or gameplay award. */
const ROOT_KIND='elderweald-root-arch',ROOT_MARK='root refinement ';
const rootHash=raw=>require('node:crypto').createHash('sha256').update(Buffer.from(raw.buffer,raw.byteOffset,raw.byteLength)).digest('hex');
function previousRootParts(){
 // Exact previous root painter, reconstructed by removing only the three
 // deliberate kind-selection seams. No baseline authority or transform edits.
 const edits=[
  ["extra={},reference=[0,1,0],kind='timber-panel')=>{","extra={},reference=[0,1,0])=>{"],
  ["add(kind,p,s,c,role,parent,{m,anchorFrom:a,anchorTo:b,...extra});","add('timber-panel',p,s,c,role,parent,{m,anchorFrom:a,anchorTo:b,...extra});"],
  [".42,.52,0x5b4d39,'root-arch',id,{cutaway:true},[0,1,0],quality!=='low'&&z===-70?'elderweald-root-arch':'timber-panel');",".42,.52,0x5b4d39,'root-arch',id,{cutaway:true});"]
 ];let old=source;
 for(const [a,b]of edits){assert.equal(old.split(a).length,2,'One exact current root selection seam');old=old.replace(a,b);}
 const box={module:{exports:{}}};vm.runInNewContext(old,box);return box.module.exports;
}
function rootFacets(kind=ROOT_KIND,m=E.M.identity()){
 const raw=E.geometry(kind),stride=E.meshStride(kind),faces=[];
 for(let i=0;i<raw.length;i+=stride*3){const p=[0,1,2].map(j=>E.M.transform(m,raw.slice(i+j*stride,i+j*stride+3))),n=E.norm(E.cross(E.sub(p[1],p[0]),E.sub(p[2],p[0])));faces.push({p,n});}
 return faces;
}
const strictMesh=(faces,q,margin=2e-5)=>faces.every(f=>E.dot(f.n,E.sub(q,f.p[0]))<-margin);
function overlapCube(root,other,localCenter){
 // Eight corners inside the actual closed convex triangle surfaces prove a
 // positive-volume connection, rather than intersecting bounding boxes.
 const center=E.M.transform(new Float32Array(matrix(root)),localCenter),half=.003,
  roots=rootFacets(root.kind,new Float32Array(matrix(root))),supports=rootFacets(other.kind,new Float32Array(matrix(other)));
 for(const dx of[-half,half])for(const dy of[-half,half])for(const dz of[-half,half]){
  const q=center.map((v,i)=>v+[dx,dy,dz][i]);assert.ok(strictMesh(roots,q),'Cube corner must be inside the actual root mesh');assert.ok(strictMesh(supports,q),'Cube corner must be inside actual support geometry');
 }return{center,half,volume:Math.pow(2*half,3)};
}
function rootCpuEngine(){
 const calls=[];let id=0;
 const gl=new Proxy({ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,FLOAT:4,TRIANGLES:5,TEXTURE0:6,TEXTURE_2D:7,TEXTURE3:8,TEXTURE4:9},
  {get(o,k){if(k in o)return o[k];if(k==='createBuffer'||k==='createVertexArray')return()=>({id:++id});return(...args)=>calls.push([k,...args]);}});
 const e=Object.create(E.Engine.prototype);Object.assign(e,{gl,meshes:new Map(),batches:[],dynamic:[],cameraSolids:[],calls:0,
  canvas:{clientWidth:1440,clientHeight:960},camera:{eye:[-148,4,-66],target:[-148,3,-75],projection:'perspective'},
  lightVP:E.M.identity(),theme:'earth',quality:'balanced',surfaceMaterialInfo:{ready:true},shadowSize:2048,
  _surfaceTextures:{color:{id:'existing-timber-color'},roughness:{id:'existing-timber-roughness'}}});
 return{e,calls};
}
const rootItems=parts=>parts.map(({kind,...p})=>({p:p.p,s:p.s,c:p.c,...p.opt}));

test(ROOT_MARK+'mesh is closed convex finite outward timber geometry inside the old beam with exact UV mapping',()=>{
 assert.equal(typeof E.meshStride,'function');assert.equal(E.meshStride(ROOT_KIND),8);assert.equal(E.meshStride('timber-panel'),8);
 const raw=E.geometry(ROOT_KIND);assert.equal(raw.length,32*3*8);assert.equal(raw.byteLength,3072);assert.ok(Array.from(raw).every(Number.isFinite));
 assert.notDeepEqual(raw,E.geometry('timber-panel'),'The old box cannot satisfy the original root geometry');
 const key=p=>p.join(','),points=new Map(),edges=new Map(),faces=rootFacets();let signedVolume=0;
 const edge=(a,b)=>{const u=key(a),v=key(b),k=[u,v].sort().join('|');if(!edges.has(k))edges.set(k,[]);edges.get(k).push([u,v]);};
 for(let i=0;i<raw.length;i+=24){const p=[0,1,2].map(j=>Array.from(raw.slice(i+j*8,i+j*8+3))),n=Array.from(raw.slice(i+3,i+6)),cross=E.cross(E.sub(p[1],p[0]),E.sub(p[2],p[0]));
  assert.ok(Math.hypot(...cross)>1e-6);assert.ok(Math.abs(Math.hypot(...n)-1)<1e-6);assert.ok(E.dot(E.norm(cross),n)>.999999);
  assert.ok(E.dot(n,p[0])>0,'Outward faces enclose the local origin');signedVolume+=E.dot(p[0],E.cross(p[1],p[2]))/6;
  for(let j=0;j<3;j++){const q=p[j];points.set(key(q),q);assert.ok(q.every(v=>Math.abs(v)<=.5),'Every vertex stays inside the original beam envelope');
   const along=Math.abs(n[0])>.5?q[2]:q[0],across=Math.abs(n[1])>.5?q[2]:q[1];
   assert.ok(Math.abs(raw[i+j*8+6]-(.1+(across+.5)*.1))<2e-8);assert.ok(Math.abs(raw[i+j*8+7]-(along+.5))<4e-8,'Existing position-derived grain UV remains real');
  }edge(p[0],p[1]);edge(p[1],p[2]);edge(p[2],p[0]);
 }
 assert.equal(points.size,18);assert.equal(edges.size,48);assert.ok(signedVolume>.25&&signedVolume<.5);
 for(const rows of edges.values()){assert.equal(rows.length,2);assert.deepEqual(rows[0],rows[1].slice().reverse());}
 for(const p of points.values())assert.ok(faces.every(f=>E.dot(f.n,E.sub(p,f.p[0]))<2e-7),'Actual mesh is convex; triangle planes certify the full enclosed surface');
 assert.deepEqual([...new Set([...points.values()].map(p=>p[0]))],[-.5,0,.5]);
 const middle=[...points.values()].filter(p=>p[0]===0);assert.ok(Math.abs(middle.reduce((s,p)=>s+p[1],0)/6-.055)<1e-8,'Authored center bend');
 assert.equal(rootHash(E.geometry('timber-panel')),'fdf35cfbd333eefd0d88a5b6c69d0e21c0bb0ed6984aaf6185fcfb77c35122c8','Original timber mesh remains byte-identical');
});

test(ROOT_MARK+'only two north beams change kind with Low and all physical owners endpoints matrices and material metadata exact',()=>{
 const old=previousRootParts();assert.equal(JSON.stringify(old.extension),JSON.stringify(ext));
 for(const quality of['low','balanced','high']){
  const a=X.parts({quality}),b=old.parts({quality});assert.equal(a.length,b.length);
  const selected=a.filter(p=>p.kind===ROOT_KIND);assert.equal(selected.length,quality==='low'?0:2);
  const expected=b.filter(p=>p.opt.elderwealdPart==='root-arch'&&p.p[2]===-70);assert.equal(expected.length,2);
  if(quality==='low')assert.equal(JSON.stringify(a),JSON.stringify(b),'Every Low record remains byte-exact serialized');
  else for(let i=0;i<a.length;i++)assert.equal(JSON.stringify(a[i]),JSON.stringify({...b[i],kind:b[i].opt.elderwealdPart==='root-arch'&&b[i].p[2]===-70?ROOT_KIND:b[i].kind}));
  for(const p of selected){assert.equal(p.opt.cutaway,true);assert.equal(p.opt.cameraSolid,false);assert.equal(p.opt.appearanceOnly,true);assert.equal(p.opt.rough,.96);assert.equal(p.c,0x5b4d39);
   near(E.M.transform(matrix(p),[-.5,0,0]),p.opt.anchorFrom);near(E.M.transform(matrix(p),[.5,0,0]),p.opt.anchorTo);assert.equal(p.opt.wind,undefined);assert.equal(p.opt.terrain,undefined);
  }
 }
});

test(ROOT_MARK+'actual packed end volumes connect to both masonry and north keystone while the standing passage stays clear',t=>{
 const parts=X.parts(),roots=parts.filter(p=>p.kind===ROOT_KIND),keystone=parts.find(p=>p.opt.elderwealdPart==='root-keystone'&&p.p[2]===-70),rows=[];assert.equal(roots.length,2);
 for(const p of roots){
  const s=ext.solids.find(s=>s.id===p.opt.solidId),wall={kind:'box',p:[s.x,F+s.h/2,s.z],s:[s.w,s.h,s.d],opt:{}},
   cap=parts.find(q=>q.opt.elderwealdPart==='masonry-cap'&&q.opt.solidId===s.id&&q.p[2]===(s.x<-148?-69:-71));assert.ok(cap);
  rows.push({parent:s.id,wall:overlapCube(p,wall,[-.48,0,0]),cap:overlapCube(p,cap,[-.43,.01,.15]),keystone:overlapCube(p,keystone,[.48,0,0])});
  for(const v of vertices(p))assert.ok(v[1]>F+BODY+.25,'Actual north mesh retains original full standing clearance');
  assert.equal(bodyClear([-148,-66],[-148,-86],p),true);
  const moved={...p,opt:{...p.opt,m:matrix(p).slice()}};moved.opt.m[13]-=2;assert.equal(bodyClear([-148,-66],[-148,-86],moved),false,'Detect a lowered center-passage envelope intrusion');
 }
 assert.equal(W.walkable(earth.room,-145,-84,R),true);assert.equal(W.segment(earth.room,{x:-148,z:-66},{x:-148,z:-86},R),true);
 const disconnected={...keystone,opt:{...keystone.opt,m:matrix(keystone).slice()}};disconnected.opt.m[14]+=4;
 assert.throws(()=>overlapCube(roots[0],disconnected,[.48,0,0]),/actual support/,'A disconnected actual matrix cannot pass an AABB-only endpoint assertion');
 t.diagnostic(JSON.stringify({scope:'Positive-volume actual packed convex mesh overlap, not pixels or structural authority',rows}));
});

test(ROOT_MARK+'actual Engine stride attribute8 cached buffer and ready timber texture calls bind for the new kind',()=>{
 const {e,calls}=rootCpuEngine(),items=rootItems(X.parts().filter(p=>p.kind===ROOT_KIND)),b=e.batch(ROOT_KIND,items);
 assert.equal(b.geom.stride,8);assert.equal(b.geom.count,96);assert.equal(b.count,2);assert.equal(b.data.byteLength,192);assert.deepEqual(e.cameraSolids,[]);
 assert.equal(calls.filter(c=>c[0]==='bufferData'&&c[2].byteLength===3072).length,1);assert.ok(calls.some(c=>c[0]==='vertexAttribPointer'&&c[1]===8&&c[2]===2&&c[5]===32&&c[6]===24));
 const second=e.batch(ROOT_KIND,[],true);assert.equal(second.geom,b.geom);assert.equal(e.meshes.size,1);assert.equal(calls.filter(c=>c[0]==='bufferData'&&c[2].byteLength===3072).length,1);
 const old=e.batch('timber-panel',[items[0]]);assert.equal(old.geom.stride,8);assert.equal(old.geom.count,36);assert.equal(e.meshes.size,2);
 for(const ready of[false,true])for(const enabled of[false,true])for(const ref of[false,true]){
  const uniforms=[];e.surfaceMaterialInfo.ready=ready;e.surfaceMaterialsEnabled=enabled;e.calls=0;e.texturedCalls=0;e.texturedInstances=0;
  e.uni=(p,n,k,v)=>uniforms.push([n,k,v]);e.geometryPass({},E.M.identity(),e.palette(16,0),4,e.camera.eye,ref,false);
  assert.deepEqual(uniforms.filter(u=>u[0]==='uTimberOn').map(u=>u[2]),Array(3).fill(ready&&enabled?1:0));
  assert.equal(e.texturedCalls,ready&&enabled?2:0);assert.equal(e.texturedInstances,ready&&enabled&&!ref?3:0);
  assert.ok(calls.some(c=>c[0]==='activeTexture'&&c[1]===e.gl.TEXTURE3));assert.ok(calls.some(c=>c[0]==='bindTexture'&&c[2]===e._surfaceTextures.color));
  assert.ok(calls.some(c=>c[0]==='activeTexture'&&c[1]===e.gl.TEXTURE4));assert.ok(calls.some(c=>c[0]==='bindTexture'&&c[2]===e._surfaceTextures.roughness));
  assert.deepEqual(uniforms.find(u=>u[0]==='uTimberColor'),['uTimberColor','i',3]);assert.deepEqual(uniforms.find(u=>u[0]==='uTimberRoughness'),['uTimberRoughness','i',4]);
  uniforms.length=0;e.geometryPass({},E.M.identity(),e.palette(16,0),4,e.camera.eye,false,true);assert.equal(uniforms.some(u=>u[0]==='uTimberOn'),false,'Original depth pass has no surface texture branch');
 }
 e.clear();assert.equal(e.batches.length,0);assert.equal(e.dynamic.length,0);assert.equal(calls.filter(c=>c[0]==='deleteVertexArray').length,3,'Owned original clear disposes all three CPU instance VAOs');
});

test(ROOT_MARK+'actual WorldArt commit submits one static pair preserves complete real Simulation and bounded pass cost',()=>{
 const H=require('./helpers/woodland-scene.cjs');
 for(const quality of['low','balanced','high']){
  const h=H.scene(quality),roots=h.batches.filter(b=>b.kind===ROOT_KIND);assert.equal(roots.length,quality==='low'?0:1);
  if(roots.length){assert.equal(roots[0].dynamic,false);assert.equal(roots[0].items.length,2);const raw=H.packed(roots[0].items);assert.equal(raw.length,192);
   for(let i=0;i<2;i++){const a=roots[0].items[i],p=X.parts({quality}).find(p=>p.kind===ROOT_KIND&&p.opt.solidId===a.solidId);assert.deepEqual(a,{p:p.p,s:p.s,c:p.c,...p.opt});}
  }
  assert.ok(h.batches.some(b=>b.kind==='timber-panel'&&b.items.length>2),'The existing shared timber buffer remains in use');
  const parts=X.parts({quality}),work=parts.reduce((n,p)=>n+E.geometry(p.kind).length/E.meshStride(p.kind)/3,0),oldWork=previousRootParts().parts({quality}).reduce((n,p)=>n+E.geometry(p.kind).length/E.meshStride(p.kind)/3,0);
  assert.equal(work-oldWork,quality==='low'?0:40);assert.equal(parts.length,quality==='low'?287:quality==='balanced'?419:515);
 }
});

test(ROOT_MARK+'production visibility parses actual submitted roots and still detects an actual root obstruction without mutating facts',()=>{
 const Motion=require('../src/earth-grazer-motion.js'),Grazer=require('../src/earth-grazer-art.js'),V=require('../src/earth-grazer-visibility.js'),H=require('./helpers/woodland-scene.cjs'),h=H.scene('balanced'),before=JSON.stringify(h.sim),{e}=rootCpuEngine();
 e.batch(ROOT_KIND,rootItems(X.parts().filter(p=>p.kind===ROOT_KIND)));
 const p=Motion.PATH.points[0],focus=[p.x,p.z],pose={x:focus[0],z:focus[1],base:F,yaw:0,lower:.4,gait:0,walking:false,phase:'explicit-CPU-shape-fixture'};
 const groups={};for(const {kind,...item}of Grazer.shape(pose,{quality:'balanced'}))(groups[kind]??=[]).push(item);
 for(const [kind,items]of Object.entries(groups))e.batch(kind,items,true);
 E.Engine.prototype.setCamera.call(e,{eye:[p.x+7.5,5,p.z],target:[p.x,F+.8,p.z],projection:'perspective',fov:60,aspect:1.5});
 const clear=V.inspect(e,Motion.ID);assert.equal(clear.visible,true,JSON.stringify(clear));assert.equal(clear.reason,'clear-actual-mesh-samples');
 const obstacle=e.batches[0],base=obstacle.items[0],copy={...base,m:Array.from(E.M.compose(p.x+3.4,3.2,p.z,1,3,3)),p:[p.x+3.4,3.2,p.z],s:[1,3,3]};obstacle.items=[copy];e.updateBatch(obstacle);
 const blocked=V.inspect(e,Motion.ID);assert.equal(blocked.visible,false);assert.equal(blocked.reason,'actual-mesh-obstructed',JSON.stringify(blocked));assert.ok(blocked.blocked.some(b=>b.kind===ROOT_KIND));
 assert.equal(JSON.stringify(h.sim),before,'Mesh inspection never mutates actual Core/roster/save facts');
 // These submitted shape fixtures exercise the public geometric consumer only;
 // they are not branded live projections, tickets, ordinary RAF or native proof.
});
