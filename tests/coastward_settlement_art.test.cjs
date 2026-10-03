/* Focused CPU geometry checks. These do not certify rendered camera comfort. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const A=require('../src/coastward-settlement-art.js');
const W=require('../src/world-atlantis-earth.js');
const E=require('../src/engine.js');
const earth=W.realms[0],G=1.57,R=.31,BODY=1.7,EPS=1e-8;
const ids=['west-house','east-house','field-store'];
const source=fs.readFileSync(require.resolve('../src/coastward-settlement-art.js'),'utf8');
const matrix=p=>p.opt.m||E.M.compose(...p.p,...p.s);
function vertices(p){
 const data=E.geometry(p.kind),stride=p.kind==='timber-panel'?8:6,m=matrix(p),out=[];
 for(let i=0;i<data.length;i+=stride) out.push(E.M.transform(m,data.slice(i,i+3)));
 return out;
}
function bounds(p){
 const vs=vertices(p);
 return {min:[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),max:[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])))};
}
function near(a,b,label){a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<2e-6,`${label}[${i}]`));}
function interval(a,b,lo,hi){
 let first=0,last=1;
 for(let i=0;i<a.length;i++){
  const d=b[i]-a[i];
  if(Math.abs(d)<EPS){if(a[i]<lo[i]||a[i]>hi[i])return null;}
  else {const p=(lo[i]-a[i])/d,q=(hi[i]-a[i])/d;first=Math.max(first,Math.min(p,q));last=Math.min(last,Math.max(p,q));if(first>last)return null;}
 }
 return [first,last];
}
test('browser and CommonJS expose the same pure interface without foreign global mutation',()=>{
 const sandbox={sentinel:{value:7},module:{exports:{}}};vm.runInNewContext(source,sandbox);
 assert.equal(sandbox.module.exports,sandbox.RealmCoastwardSettlementArt);
 assert.deepEqual(Object.keys(sandbox.module.exports).sort(),['decorate','parts']);
 assert.equal(sandbox.sentinel.value,7);assert.equal(Object.keys(sandbox).length,3);
 assert.ok(Object.isFrozen(sandbox.module.exports));
});
test('all three canonical buildings have bounded deterministic original exterior parts',()=>{
 const parts=A.parts(earth);
 assert.equal(parts.length,177);assert.ok(parts.length<=180);
 assert.deepEqual(parts,A.parts(earth));
 assert.deepEqual(Object.fromEntries(ids.map(id=>[id,parts.filter(p=>p.opt.solidId===id).length])),
  {'west-house':57,'east-house':57,'field-store':63});
 for(const p of parts){
  assert.ok(['box','roof','timber-panel'].includes(p.kind));
  assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));
  assert.ok(Number.isInteger(p.c));assert.ok(vertices(p).flat().every(Number.isFinite));
 }
 assert.equal(parts.filter(p=>p.kind==='roof').length,3);
 assert.equal(parts.filter(p=>p.opt.closedDoor).length,3);
 assert.equal(parts.filter(p=>p.opt.closedShutter).length,12);
 assert.equal(parts.filter(p=>p.opt.settlementPart==='packed-board').length,4);
});
test('roof shells and framing follow actual parent extents and meet the roof profile',()=>{
 const parts=A.parts(earth);
 for(const id of ids){
  const s=earth.solids.find(s=>s.id===id),pp=parts.filter(p=>p.opt.solidId===id);
  const roof=pp.find(p=>p.kind==='roof');
  near(roof.p,[s.x,G+s.h+.03,s.z],'roof base');near(roof.s,[s.w+.56,s.h*.28,s.d+.5],'roof size');
  for(const p of pp.filter(p=>p.opt.settlementPart==='gable-barge')){
   const a=p.opt.beamFrom,b=p.opt.beamTo;
   assert.ok(Math.abs(Math.abs(a[0]-s.x)-(s.w+.56)/2)<EPS);
   assert.ok(Math.abs(a[1]-(G+s.h+.055))<EPS);
   near(b,[s.x,G+s.h+.055+s.h*.28,a[2]],'gable ridge attachment');
  }
  for(const p of pp.filter(p=>p.opt.settlementPart==='rafter-tail')){
   for(const q of [p.opt.beamFrom,p.opt.beamTo])
    assert.ok(Math.abs(q[1]+.055-(roof.p[1]+roof.s[1]*(1-Math.abs(q[0]-s.x)/(roof.s[0]/2))))<EPS);
  }
  const ridge=pp.find(p=>p.opt.settlementPart==='roof-ridge');
  assert.ok(bounds(ridge).min[1]<=G+s.h+.03+s.h*.28,'ridge cap touches the roof');
 }
});
test('timber matrices are positive orthonormal and local grain meets declared endpoints',()=>{
 for(const p of A.parts(earth).filter(p=>p.kind==='timber-panel')){
  const m=matrix(p),columns=[0,4,8].map(i=>[m[i],m[i+1],m[i+2]]);
  columns.forEach((v,i)=>assert.ok(Math.abs(Math.hypot(...v)-p.s[i])<EPS));
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.abs(E.dot(columns[i],columns[j]))<EPS);
  assert.ok(E.dot(columns[0],E.cross(columns[1],columns[2]))>0);
  near(E.M.transform(m,[-.5,0,0]),p.opt.beamFrom,'beam start');
  near(E.M.transform(m,[.5,0,0]),p.opt.beamTo,'beam end');
 }
 // A vertical facade board must span X, not stick its broad face into Z.
 const door=A.parts(earth).find(p=>p.opt.closedDoor),bb=bounds(door);
 assert.ok(Math.abs(bb.max[0]-bb.min[0]-1.16)<EPS);
 assert.ok(Math.abs(bb.max[2]-bb.min[2]-.055)<EPS);
});
test('body-height facade stays within existing collision clearance, eaves remain overhead',()=>{
 for(const p of A.parts(earth)){
  const s=earth.solids.find(s=>s.id===p.opt.solidId),bb=bounds(p);
  const expansion=bb.min[1]<G+BODY?.16:.42;
  assert.ok(bb.min[0]>=s.x-s.w/2-expansion-EPS&&bb.max[0]<=s.x+s.w/2+expansion+EPS,p.opt.settlementPart+' X');
  assert.ok(bb.min[2]>=s.z-s.d/2-expansion-EPS&&bb.max[2]<=s.z+s.d/2+expansion+EPS,p.opt.settlementPart+' Z');
  assert.ok(bb.min[1]>=G-EPS,'no buried or unsupported prop');
  for(const q of vertices(p)){
   const outside=Math.abs(q[0]-s.x)>s.w/2+R || Math.abs(q[2]-s.z)>s.d/2+R;
   if(outside) assert.ok(q[1]>G+BODY+.5,'large overhang must clear the whole actor');
  }
 }
});
test('actual emitted geometry leaves all authored public routes and task actors clear',()=>{
 const parts=A.parts(earth),routes=earth.routes.flatMap(r=>r.points.slice(1).map((p,i)=>[r.points[i],p]));
 for(const [a,b] of routes)for(const p of parts){
  const bb=bounds(p);
  assert.equal(interval([a[0],G+.02,a[1]],[b[0],G+.02,b[1]],
   [bb.min[0]-R,bb.min[1]-BODY,bb.min[2]-R],[bb.max[0]+R,bb.max[1],bb.max[2]+R]),null,
   `${p.opt.solidId} ${p.opt.settlementPart} enters a public body route`);
 }
 for(const point of earth.points)for(const p of parts){
  const bb=bounds(p);
  assert.equal(interval([point.x,G+.02,point.z],[point.x,G+.02,point.z],
   [bb.min[0]-R,bb.min[1]-BODY,bb.min[2]-R],[bb.max[0]+R,bb.max[1],bb.max[2]+R]),null,
   `${point.id} occupied by ${p.opt.settlementPart}`);
 }
});
test('all opaque dressing inherits house cutaway tags without camera or body authority',()=>{
 const parts=A.parts(earth);
 for(const p of parts){
  assert.equal(p.opt.cameraSolid,false);assert.equal(p.opt.cutaway,true);
  assert.equal(p.opt.solidId,p.opt.structureId);assert.equal(p.opt.worldSolidId,p.opt.solidId);
  assert.ok(ids.includes(p.opt.solidId));assert.equal(p.opt.appearanceOnly,true);
  assert.equal(p.opt.worldSolid,undefined);assert.equal(p.opt.worldRoof,undefined);
  assert.equal(E.solidBounds(p.kind,{p:p.p,s:p.s,...p.opt}),null);
 }
 // Exercise the actual production instance encoder with a synthetic GL sink.
 // No rendering: this detects a facade/roof accidentally encoded as opaque.
 const sink={ARRAY_BUFFER:1,STATIC_DRAW:2,bindBuffer(){},bufferData(){}};
 const batch={items:parts.map(p=>({p:p.p,s:p.s,c:p.c,...p.opt})),kind:'box'};
 E.Engine.prototype.updateBatch.call({gl:sink},batch);
 for(let i=0;i<parts.length;i++)assert.equal(batch.data[i*24+19],0,'production cutaway marker');
});
test('changed parent positions and supplied floor heights move dressing rather than hard-code geography',()=>{
 const moved=structuredClone(earth);
 for(const s of moved.solids){s.x+=11;s.z-=17;}
 const a=A.parts(earth),b=A.parts(moved,{height:()=>3.07});
 for(let i=0;i<a.length;i++)near(b[i].p,a[i].p.map((v,j)=>v+[11,1.5,-17][j]),'derived placement');
 assert.equal(A.parts(W.realms[1]).length,0);
});
test('decoration writes only computed geometry and leaves definitions and simulation untouched',()=>{
 const before=JSON.stringify(earth),sim={state:{sentinel:7}};
 const written=[],writer={add:(kind,...args)=>written.push({kind,p:args.slice(0,3),s:args.slice(3,6),c:args[6],opt:args[7]})};
 assert.equal(A.decorate(writer,earth,{height:()=>G,sim}),177);
 assert.deepEqual(written,A.parts(earth));assert.equal(JSON.stringify(earth),before);
 assert.deepEqual(sim,{state:{sentinel:7}});
 written[0].p[0]=0;assert.notEqual(A.parts(earth)[0].p[0],0,'no shared mutable geometry cache');
});
test('malformed parents or height refuse before any writer mutation',()=>{
 for(const change of [d=>d.solids=d.solids.filter(s=>s.id!=='field-store'),
  d=>d.solids.push({...d.solids.find(s=>s.id==='west-house')}),
  d=>d.solids.find(s=>s.id==='east-house').w=Infinity,
  d=>d.solids.find(s=>s.id==='east-house').h=1]){
  const d=structuredClone(earth);change(d);let writes=0;
  assert.throws(()=>A.decorate({add(){writes++;}},d),TypeError);assert.equal(writes,0);
 }
 let writes=0;assert.throws(()=>A.decorate({add(){writes++;}},earth,{height:()=>NaN}),TypeError);
 assert.equal(writes,0);assert.throws(()=>A.decorate({},earth),TypeError);
});
