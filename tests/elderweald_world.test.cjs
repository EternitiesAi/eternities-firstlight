/* CPU production-data and submitted-mesh qualification. No WebGL or save edits. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const X=require('../src/elderweald-world.js'),South=require('../src/world-atlantis-earth.js'),E=require('../src/engine.js');
const F=1.57,R=.31,BODY=1.7,EPS=2e-5,ext=X.extension;
const source=fs.readFileSync(require.resolve('../src/elderweald-world.js'),'utf8');
const original=South.realms[0],earth={...original,
 bounds:{minX:Math.min(original.bounds.minX,ext.bounds.minX),maxX:Math.max(original.bounds.maxX,ext.bounds.maxX),minZ:Math.min(original.bounds.minZ,ext.bounds.minZ),maxZ:Math.max(original.bounds.maxZ,ext.bounds.maxZ)},
 patches:[...original.patches,...ext.patches],solids:[...original.solids,...ext.solids],points:[...original.points,...ext.points]};
// The actual production functions receive a composed catalogue in an isolated
// VM. This is a data-composition fixture, not a played or progressed character.
const sandbox={RealmWorldAtlantisEarth:{realms:[earth,South.realms[1]]},
 RealmWorldHeavenHell:require('../src/world-heaven-hell.js'),RealmCosmos:require('../src/cosmos.js'),module:{exports:{}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/world-foundations.js'),'utf8'),sandbox);
const W=sandbox.module.exports;
const matrix=p=>p.opt.m||E.M.compose(...p.p,...p.s);
function vertices(p){const data=E.geometry(p.kind),stride=p.kind==='timber-panel'?8:6,out=[];for(let i=0;i<data.length;i+=stride)out.push(E.M.transform(matrix(p),data.slice(i,i+3)));return out;}
function bounds(p,wind=true){const vs=vertices(p),min=[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),max=[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])));if(wind&&p.opt.wind===2){min[0]-=.095;max[0]+=.095;min[1]-=.05;max[1]+=.05;}return{min,max};}
function interval(a,b,lo,hi){let first=0,last=1;for(let i=0;i<3;i++){const d=b[i]-a[i];if(Math.abs(d)<1e-9){if(a[i]<lo[i]||a[i]>hi[i])return null;}else{const x=(lo[i]-a[i])/d,y=(hi[i]-a[i])/d;first=Math.max(first,Math.min(x,y));last=Math.min(last,Math.max(x,y));if(first>last)return null;}}return[first,last];}
const near=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<EPS,`${v} != ${b[i]}`));
function deeplyFrozen(o){if(o&&typeof o==='object'){assert.ok(Object.isFrozen(o));Object.values(o).forEach(deeplyFrozen);}}
const allAnchors=[...ext.points,...ext.landmarks,...ext.encounterClearings];
function bodyClear(a,b,p){const bb=bounds(p);return interval([a[0],F+.03,a[1]],[b[0],F+.03,b[1]],
 [bb.min[0]-R,bb.min[1]-BODY,bb.min[2]-R],[bb.max[0]+R,bb.max[1],bb.max[2]+R])===null;}
function local(p,q){const m=matrix(p);return[0,4,8].map(i=>{const c=Array.from(m.slice(i,i+3));return E.dot(c,q.map((v,j)=>v-m[12+j]))/E.dot(c,c);});}
function inside(p,q){const [x,y,z]=local(p,q);if(p.kind==='octa')return Math.abs(x)/.5+Math.abs(y)/.65+Math.abs(z)/.5<=1+1e-6;if(p.kind==='round')return x*x+y*y+z*z<=.25+1e-6;return[x,y,z].every(n=>Math.abs(n)<=.5+1e-6);}

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
  assert.ok(['box','round','octa','timber-panel'].includes(p.kind));assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));assert.ok(Number.isInteger(p.c));
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
  const parts=X.parts({quality});for(const r of ext.routes)for(let i=1;i<r.points.length;i++)for(const p of parts)assert.ok(bodyClear(r.points[i-1],r.points[i],p),quality+' '+r.id+' '+p.opt.elderwealdPart+' '+p.opt.solidId);
  for(const a of allAnchors)for(const p of parts)assert.ok(bodyClear([a.x,a.z],[a.x,a.z],p),quality+' '+a.id+' '+p.opt.elderwealdPart);
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
  const ps=X.parts({quality}),vertexWork=ps.reduce((n,p)=>n+E.geometry(p.kind).length/(p.kind==='timber-panel'?8:6),0);
  assert.ok(vertexWork<85000,'bounded CPU mesh vertices per render pass '+vertexWork);
 }
});
