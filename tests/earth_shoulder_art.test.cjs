'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const R=require('../src/engine.js'),C=require('../src/core.js'),E=require('../src/earth.js'),A=require('../src/earth-shoulder-art.js');
for(const name of ['drover-art','millwright-art','mill-gate-art','quarry-art','bridge-art','earth-art'])require('../src/'+name+'.js');
function scene(){const all=[],a={e:{},map:{},begin(){},commit(){},beam(){},bench(){},box(...v){this.add('box',...v);},add(kind,x,y,z,sx,sy,sz,c,opt={}){const p={kind,p:[x,y,z],s:[sx,sy,sz],c,...opt};all.push(p);(this.map[kind]||(this.map[kind]=[])).push(p);}};globalThis.RealmEarthArt.make(a);return{all,frame:a.earthShoulderFrame,parts:all.filter(p=>p.quarryShoulder),strips:all.filter(p=>p.terrain&&p.p[0]+p.s[0]/2===18&&p.p[2]>=-23.75&&p.p[2]<=-6.25)};}
const matrix=p=>p.m||R.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),at=(p,v)=>R.M.transform(matrix(p),v);
function seamDistance(p,v){const a=at(p,[0,1,-.5]),b=at(p,[0,1,.5]),t=(v[2]-a[2])/(b[2]-a[2]);return Math.hypot(v[0]-a[0],v[1]-a[1]-(b[1]-a[1])*t);}
test('captured terrain, field random sequence, static scenery, camera solids and bridge remain byte-identical to PR33',()=>{
 const source=scene().all.filter(p=>!p.quarryShoulder);assert.equal(source.length,2550);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex'),'417afdc850951c93253b815e6ad8fd56594fac61dd610271ba34a816c9ae07fd');
});
test('nine bounded tapering rock sections dress thirty-six actual grass strips in the existing batch',()=>{
 const s=scene();assert.deepEqual(A.LIMIT,{x:18,from:-24,to:-6});assert.deepEqual(s.parts.map(p=>p.id),Array.from({length:9},(_,i)=>'quarry-east-shoulder-'+(i+1)));assert.ok(s.parts.every(p=>p.sourceStrips===4));assert.equal(s.strips.length,36);
 assert.equal(s.frame.partCount,9);assert.equal(s.frame.triangles,648);assert.ok(s.parts[0].s[0]<=.2&&s.parts[8].s[0]<=.2&&Math.max(...s.parts.map(p=>p.s[0]))===1.35);assert.ok(s.parts.every(p=>p.kind==='bank-slope'&&p.cameraSolid===false&&p.cutaway===false&&!p.terrain&&!p.wind&&!p.mountainPart&&p.rough===1));
 for(const p of s.parts){assert.ok([...p.p,...p.s,...p.m].every(Number.isFinite));assert.ok(p.s.every(v=>v>0));assert.equal(R.solidBounds(p.kind,p),null);}
});
test('upper rock seam matches every transformed grass underside rather than canonical edge height',()=>{
 const s=scene();let canonicalMismatch=0;
 for(const row of s.strips){const p=s.parts.find(p=>Math.abs(p.seam[0][2]-row.p[2])<p.s[2]+.1&&row.p[2]>=p.seam[0][2]&&row.p[2]<=p.seam[1][2]);assert.ok(p);
  for(const z of[-.5,0,.5]){const v=at(row,[.5,-.5,z]);assert.ok(seamDistance(p,v)<2e-6,JSON.stringify(v));canonicalMismatch=Math.max(canonicalMismatch,Math.abs(E.height(v[0],v[2])-.09-v[1]));}
 }
 assert.ok(canonicalMismatch>.01,'test must witness the wrong canonical-height substitution');
 for(let i=1;i<s.parts.length;i++){const join0=at(s.parts[i-1],[0,1,.5]),join1=at(s.parts[i],[0,1,-.5]);assert.ok(join0[2]>=join1[2],'retain source overlap');assert.ok(Math.abs(join0[1]-join1[1])<.004,'retain bounded actual grass merge step');}
});
test('orthogonal positive bases preserve renderer normals without a shear shortcut',()=>{
 for(const p of scene().parts){const cols=[0,4,8].map(i=>Array.from(p.m.slice(i,i+3))),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.abs(dot(cols[i],cols[j]))<1e-6);
  const m=p.m;assert.ok(m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5])>0);
 }
});
test('every actual slope vertex stays outside ground below the lip and within measured endpoint margin',()=>{
 const mesh=R.geometry('bank-slope');assert.equal(mesh.length/18,72);
 for(const p of scene().parts)for(let i=0;i<mesh.length;i+=6){const local=Array.from(mesh.slice(i,i+3)),v=at(p,local);assert.ok(v[0]>=18-1e-6);assert.ok(v[2]>=-24.07&&v[2]<=-5.93);
  const top=at(p,[0,1,(v[2]-p.seam[0][2])/(p.seam[1][2]-p.seam[0][2])-.5]);assert.ok(v[1]<=top[1]+2e-6);assert.equal(E.land(v[0]+1e-4,v[2],0),false);
  if(Math.abs(local[1]+.03)<1e-6)assert.ok(v[1]<R.WATER_HEIGHT-.17,'tilted lower seam must all be submerged');
 }
});
test('actual non-cap faces have outward normals and never create a horizontal walking shelf',()=>{
 const mesh=R.geometry('bank-slope');for(const p of scene().parts)for(let i=0;i<mesh.length;i+=18){const n=Array.from(mesh.slice(i+3,i+6));if(Math.abs(n[2])<.99){
  const [a,b,c]=[0,6,12].map(j=>at(p,Array.from(mesh.slice(i+j,i+j+3)))),u=b.map((v,k)=>v-a[k]),v=c.map((x,k)=>x-a[k]),world=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...world);
  assert.ok(length>0);assert.ok(world[0]>0&&world[1]>0);assert.ok(world[1]/length<.99,'actual pitched world face becomes a horizontal shelf');
 }}
});
test('actual adjacent cap planes retain overlap at every exposed height, not only the top endpoints',()=>{
 const mesh=R.geometry('bank-slope'),s=scene();
 function plane(p,end){for(let i=0;i<mesh.length;i+=18)if(Math.abs(mesh[i+5]-end)<1e-6){const [a,b,c]=[0,6,12].map(j=>at(p,Array.from(mesh.slice(i+j,i+j+3)))),u=b.map((v,k)=>v-a[k]),v=c.map((x,k)=>x-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],d=-n.reduce((sum,x,k)=>sum+x*a[k],0);return y=>-(n[1]*y+d)/n[2];}assert.fail('actual cap face missing');}
 for(let i=1;i<s.parts.length;i++){const left=s.parts[i-1],right=s.parts[i],a=plane(left,1),b=plane(right,-1),top=Math.min(at(left,[0,1,.5])[1],at(right,[0,1,-.5])[1]);for(let j=0;j<=32;j++){const y=R.WATER_HEIGHT+(top-R.WATER_HEIGHT)*j/32;assert.ok(a(y)-b(y)>.0018,'visible cap join opens below its upper seam');}}
});
test('near-edge road movement and old task approaches survive while outside ground and picking stay refused',()=>{
 const sim=new C.Simulation(C.fresh());sim.state.player={x:0,z:23,yaw:0};const ctx={sim,active:'shoulder-fixture',revision:1};assert.ok(E.enter(E.preview(ctx).ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);const before=structuredClone(sim.state.adventure);
 for(const [x,z]of[[0,10],[16,-7],[16.8,-13],[16.8,-22],[14,-26],[12,-26],[14,-13]]){assert.ok(sim.moveTo(x,z).ok);for(let i=0;i<3500&&sim.playerPath.length;i++){const from={...sim.state.player};sim.tick(.05);assert.ok(E.segment(from,sim.state.player));}assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.3);}
 assert.equal(sim.moveTo(18.3,-18).ok,false);assert.equal(E.pick([18.3,20,-18],[0,-1,0]),null);assert.ok(E.pick([16.8,20,-18],[0,-1,0]));
 for(const k of['xp','equipment','owned','arsenal','earthStory','earthGathering','classPath','companion','starter','pursuit'])assert.deepEqual(sim.state.adventure[k],before[k]);
});
test('projection never mutates its source strips and is independent of simulation time or task state',()=>{
 const s=scene(),before=structuredClone(s.strips),first=A.parts(s.strips);assert.deepEqual(s.strips,before);assert.deepEqual(A.parts(s.strips),first);assert.deepEqual(A.parts(s.strips.slice().reverse()),first);assert.deepEqual(A.parts([]),[]);
});
