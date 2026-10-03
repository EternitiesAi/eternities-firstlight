/* CPU actual-mesh/rest-pose checks with conservative existing wind envelopes.
 * These do not render WebGL or certify perceived woodland/camera comfort. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const A=require('../src/coastward-woodland-art.js'),W=require('../src/world-atlantis-earth.js'),E=require('../src/engine.js');
const South=require('../src/realm-trails-south.js');
const earth=W.realms[0],G=1.57,R=.31,BODY=1.7,EPS=2e-6;
const source=fs.readFileSync(require.resolve('../src/coastward-woodland-art.js'),'utf8');
const ids=Array.from({length:10},(_,i)=>'woodland-trunk-'+i);
const matrix=p=>p.opt.m||E.M.compose(...p.p,...p.s);
function vertices(p){const data=E.geometry(p.kind),stride=p.kind==='timber-panel'?8:6,vs=[];for(let i=0;i<data.length;i+=stride)vs.push(E.M.transform(matrix(p),data.slice(i,i+3)));return vs;}
function bounds(p,wind=false){const vs=vertices(p),min=[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),max=[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])));if(wind&&p.opt.wind===2){min[0]-=.095;max[0]+=.095;min[1]-=.05;max[1]+=.05;}return {min,max};}
function local(p,q){const m=matrix(p);return [0,4,8].map(i=>{const c=Array.from(m.slice(i,i+3));return E.dot(c,q.map((v,j)=>v-m[12+j]))/E.dot(c,c);});}
const meshPlanes=new Map();
function insideMesh(p,q){
 if(!meshPlanes.has(p.kind)){
  const data=E.geometry(p.kind),planes=[];
  for(let i=0;i<data.length;i+=18){const a=Array.from(data.slice(i,i+3)),b=Array.from(data.slice(i+6,i+9)),c=Array.from(data.slice(i+12,i+15));let normal=E.cross(b.map((v,j)=>v-a[j]),c.map((v,j)=>v-a[j]));const length=Math.hypot(...normal);if(length<1e-8)continue;normal=normal.map(v=>v/length);let offset=E.dot(normal,a);if(offset<0){normal=normal.map(v=>-v);offset=-offset;}planes.push({normal,offset});}
  meshPlanes.set(p.kind,planes);
 }
 const at=local(p,q);return meshPlanes.get(p.kind).every(({normal,offset})=>E.dot(normal,at)<=offset+1e-7);
}
function interval(a,b,lo,hi){let first=0,last=1;for(let i=0;i<a.length;i++){const d=b[i]-a[i];if(Math.abs(d)<1e-9){if(a[i]<lo[i]||a[i]>hi[i])return null;}else{const x=(lo[i]-a[i])/d,y=(hi[i]-a[i])/d;first=Math.max(first,Math.min(x,y));last=Math.min(last,Math.max(x,y));if(first>last)return null;}}return [first,last];}
const near=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<EPS,`${v} != ${b[i]}`));

test('isolated global/CommonJS expose only the frozen pure woodland API',()=>{
 const sandbox={module:{exports:{}},sentinel:7};vm.runInNewContext(source,sandbox);
 assert.equal(sandbox.module.exports,sandbox.RealmCoastwardWoodlandArt);assert.equal(sandbox.sentinel,7);assert.equal(Object.keys(sandbox).length,3);
 assert.deepEqual(Object.keys(A),['parts','decorate']);assert.ok(Object.isFrozen(A));assert.equal(global.RealmCoastwardWoodlandArt,A);
});
test('ten actual parents receive deterministic mixed canopy within the total budget',()=>{
 const parts=A.parts(earth);assert.equal(parts.length,140);assert.ok(parts.length<=220);assert.deepEqual(parts,A.parts(earth));
 assert.equal(parts.filter(p=>p.opt.foliage).length,40);assert.equal(parts.filter(p=>p.opt.lowRoot).length,30);
 assert.equal(parts.filter(p=>p.opt.woodlandPart==='rising-branch').length,30);assert.equal(parts.filter(p=>p.opt.woodlandPart==='bark-face').length,40);
 assert.ok(parts.some(p=>p.kind==='round'));assert.ok(parts.some(p=>p.kind==='octa'));assert.equal(parts.filter(p=>p.kind==='cone').length,0);
 for(const id of ids)assert.equal(parts.filter(p=>p.opt.solidId===id).length,14);
 assert.equal(new Set(parts.map(p=>p.opt.canopyProfile)).size,3);
});
test('every actual mesh/basis is finite, positive and parent-tagged without new camera/body authority',()=>{
 for(const p of A.parts(earth)){
  assert.ok(['timber-panel','round','octa'].includes(p.kind));assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));assert.ok(Number.isInteger(p.c));
  const m=matrix(p),c=[0,4,8].map(i=>Array.from(m.slice(i,i+3)));assert.ok(E.dot(c[0],E.cross(c[1],c[2]))>0);
  c.forEach((v,i)=>assert.ok(Math.abs(Math.hypot(...v)-p.s[i])<EPS));for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.abs(E.dot(c[i],c[j]))<EPS);
  assert.ok(vertices(p).flat().every(Number.isFinite));assert.equal(p.opt.cameraSolid,false);assert.equal(p.opt.cutaway,false);assert.equal(p.opt.appearanceOnly,true);
  assert.equal(p.opt.solidId,p.opt.worldSolidId);assert.equal(p.opt.solidId,p.opt.structureId);assert.ok(ids.includes(p.opt.solidId));assert.equal(p.opt.worldSolid,undefined);
  assert.equal(E.solidBounds(p.kind,{p:p.p,s:p.s,...p.opt}),null);
 }
});
test('actual bark faces intersect the unchanged trunk while low roots stay supported and close',()=>{
 for(const p of A.parts(earth).filter(p=>['bark-face','buttress-root'].includes(p.opt.woodlandPart))){
  const s=earth.solids.find(s=>s.id===p.opt.solidId),bb=bounds(p);
  assert.ok(bb.min[0]>=s.x-s.w/2-.15-EPS&&bb.max[0]<=s.x+s.w/2+.15+EPS);
  assert.ok(bb.min[2]>=s.z-s.d/2-.15-EPS&&bb.max[2]<=s.z+s.d/2+.15+EPS);assert.ok(bb.min[1]>=G-EPS);
  if(p.opt.lowRoot){assert.ok(bb.max[1]<G+.27);for(const v of vertices(p))assert.ok(earth.patches.some(q=>Math.abs(v[0]-q.x)<=q.w/2+EPS&&Math.abs(v[2]-q.z)<=q.d/2+EPS),'actual root lies on supplied supported ground');}
  else {
   assert.ok(vertices(p).some(v=>Math.abs(v[0]-s.x)<=s.w/2+EPS&&Math.abs(v[2]-s.z)<=s.d/2+EPS),'bark face intersects parent rather than floats');
   assert.ok(bb.max[1]<=G+s.h+EPS);
  }
 }
});
test('rising branches meet the trunk, timber grain endpoints and opaque crown volumes',()=>{
 const parts=A.parts(earth);
 for(const p of parts.filter(p=>p.opt.woodlandPart==='rising-branch')){
  const s=earth.solids.find(s=>s.id===p.opt.solidId),a=p.opt.anchorFrom,b=p.opt.anchorTo;
  assert.ok(Math.abs(a[0]-s.x)<=s.w/2&&Math.abs(a[2]-s.z)<=s.d/2&&a[1]<=G+s.h);
  near(E.M.transform(matrix(p),[-.5,0,0]),a);near(E.M.transform(matrix(p),[.5,0,0]),b);
  const crown=parts.find(q=>q.opt.solidId===s.id&&q.opt.woodlandPart==='crown-lobe'&&q.opt.branchIndex===p.opt.branchIndex);
  assert.ok(insideMesh(crown,b),'branch endpoint is inside the actual opaque lobe in its rest pose');
  // Analytic bounded translations only; this is not a rendered rigid joint.
  for(const dx of [-.095,.095])for(const dy of [-.05,.05])assert.ok(insideMesh(crown,[b[0]-dx,b[1]-dy,b[2]]),'reserved shader envelope retains volumetric overlap');
 }
});
test('upper and lower crown meshes overlap into coherent crowns at the CPU rest pose',()=>{
 const parts=A.parts(earth);
 for(const id of ids){
  const upper=parts.find(p=>p.opt.solidId===id&&p.opt.woodlandPart==='upper-crown');
  for(const lobe of parts.filter(p=>p.opt.solidId===id&&p.opt.woodlandPart==='crown-lobe')){
   const shared=upper.p.map((v,i)=>(v+lobe.p[i])/2);assert.ok(insideMesh(upper,shared)&&insideMesh(lobe,shared),'actual opaque crown parts share volume');
  }
 }
});
test('all route full-body envelopes stay clear including conservative crown wind bounds',()=>{
 const parts=A.parts(earth).map(p=>({p,bb:bounds(p,true)}));
 for(const route of earth.routes)for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i];
  for(const {p,bb} of parts)assert.equal(interval([a[0],G+.02,a[1]],[b[0],G+.02,b[1]],
   [bb.min[0]-R,bb.min[1]-BODY,bb.min[2]-R],[bb.max[0]+R,bb.max[1],bb.max[2]+R]),null,`${route.id} blocked by ${p.opt.solidId} ${p.opt.woodlandPart}`);
 }
 const trail=South.definitions.find(d=>d.realm==='earthlands'),anchors=[...earth.points,...earth.enemies,trail.giver,...trail.steps];
 for(const point of anchors)for(const {p,bb} of parts)assert.equal(interval([point.x,G+.02,point.z],[point.x,G+.02,point.z],
  [bb.min[0]-R,bb.min[1]-BODY,bb.min[2]-R],[bb.max[0]+R,bb.max[1],bb.max[2]+R]),null,`${point.id} occupied by ${p.opt.solidId}`);
});
test('high opaque art clears a full actor and canopy spread stays bounded by actual parents',()=>{
 for(const p of A.parts(earth)){
  const s=earth.solids.find(s=>s.id===p.opt.solidId),bb=bounds(p,true),spread=(.88+(Number(s.id.split('-').at(-1))%3)*.1)*Math.max(.85,Math.min(1.15,Math.sqrt(s.w*s.d)/.65));
  if(p.opt.woodlandPart==='rising-branch'||p.opt.foliage)assert.ok(bb.min[1]>G+BODY+.2,'opaque branch/foliage clears actual actor head');
  assert.ok(bb.min[0]>=s.x-2*spread-.1-EPS&&bb.max[0]<=s.x+2*spread+.1+EPS);
  assert.ok(bb.min[2]>=s.z-2*spread-EPS&&bb.max[2]<=s.z+2*spread+EPS);assert.ok(bb.max[1]<G+s.h*2);
 }
});
test('reserved wind envelope matches current source path and only foliage opts in',()=>{
 const shader=fs.readFileSync(require.resolve('../src/engine.js'),'utf8');
 assert.ok(shader.includes('w.x+=sin(uTime*.8+w.z*.4)*.095;w.y+=cos(uTime+w.x*.4)*.05;'),'engine wind2 amplitude changed: reassess proof envelope');
 for(const p of A.parts(earth)){if(p.opt.foliage)assert.equal(p.opt.wind,2);else assert.equal(p.opt.wind,undefined);}
});
test('parent and supplied-height changes move every part without hard-coded coordinates',()=>{
 const moved=structuredClone(earth);for(const s of moved.solids){s.x+=5;s.z-=9;}
 const a=A.parts(earth),b=A.parts(moved,{height:()=>3.07});
 for(let i=0;i<a.length;i++)near(b[i].p,a[i].p.map((v,j)=>v+[5,1.5,-9][j]));
 assert.deepEqual(A.parts(W.realms[1]),[]);
});
test('decorate appends only fresh geometry and never reads simulation/progression',()=>{
 const before=JSON.stringify(earth),context={height:()=>G};Object.defineProperty(context,'sim',{get(){throw new Error('Art must not access simulation');}});
 const written=[],writer={add:(kind,...a)=>written.push({kind,p:a.slice(0,3),s:a.slice(3,6),c:a[6],opt:a[7]})};
 assert.equal(A.decorate(writer,earth,context),140);assert.deepEqual(written,A.parts(earth));assert.equal(JSON.stringify(earth),before);
 written[0].p[0]=999;assert.notEqual(A.parts(earth)[0].p[0],999);
});
test('missing/duplicate/malformed parents or unsupported heights refuse before writer mutation',()=>{
 for(const change of [d=>d.solids=d.solids.filter(s=>s.id!=='woodland-trunk-9'),d=>d.solids.push({...d.solids.find(s=>s.id==='woodland-trunk-0')}),d=>d.solids.find(s=>s.id==='woodland-trunk-0').h=1,d=>d.solids.find(s=>s.id==='woodland-trunk-0').w=NaN]){
  const d=structuredClone(earth);change(d);let writes=0;assert.throws(()=>A.decorate({add(){writes++;}},d),TypeError);assert.equal(writes,0);
 }
 let writes=0;assert.throws(()=>A.decorate({add(){writes++;}},earth,{height:()=>NaN}),TypeError);assert.equal(writes,0);assert.throws(()=>A.decorate({},earth),TypeError);
});
