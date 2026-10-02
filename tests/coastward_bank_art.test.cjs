/* Actual submitted coast mesh contracts; these checks do not establish taste. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/engine.js'),W=require('../src/world-foundations.js');
const A=require('../src/world-foundations-art.js');
const d=W.definition('earthlands'),cells=A.partitions(d),parts=A.coastBanks(cells);
const contains=(x,z)=>cells.some(p=>x>=p.x-p.w/2&&x<=p.x+p.w/2&&z>=p.z-p.d/2&&z<=p.z+p.d/2);
function matrix(p){return E.M.compose(...p.p,...p.s,...p.r);}
function vertices(p){const mesh=E.geometry(p.kind),m=matrix(p),out=[];for(let i=0;i<mesh.length;i+=6)out.push(E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]));return out;}
function submission(id){const sim=new C.Simulation(),def=W.definition(id),before=JSON.stringify(sim.state),items=[],writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,depth,c,opt={}){items.push({kind,p:[x,y,z],s:[w,h,depth],c,...opt});},box(...args){this.add('box',...args);}};sim.room=def.room;A.make(writer,sim);assert.equal(JSON.stringify(sim.state),before);return items;}

test('Coastward skirts are bounded deterministic static instances in one existing mesh kind',()=>{
 assert.ok(parts.length>15&&parts.length<=64,parts.length+' continuous bank instances');assert.deepEqual(A.coastBanks(cells),parts);
 for(const p of parts){assert.equal(p.kind,'coast-bank');assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.terrain,undefined);assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));assert.equal(E.geometry(p.kind).length/18,136);}
 assert.ok(new Set(parts.map(p=>p.id)).size===parts.length);
});
test('every actual upper seam meets rendered grass underside on a real exposed union boundary',()=>{
 for(const p of parts){const e=p.seam,m=matrix(p);
  // A closed endpoint may meet a perpendicular land edge. Its exact height
  // still welds; the outward half-plane belongs to the open edge interval.
  for(const t of [-.5,.5])assert.ok(Math.abs(E.M.transform(m,[0,1,t])[1]-e.seamY)<1e-6);
  for(let i=0;i<=20;i++){const v=E.M.transform(m,[0,1,.0001+i/20*.9998-.5]);assert.ok(Math.abs(v[1]-e.seamY)<1e-6);assert.ok(contains(v[0]-e.nx*.001,v[2]-e.nz*.001),'land behind '+p.id);assert.equal(contains(v[0]+e.nx*.001,v[2]+e.nz*.001),false,'no internal bank '+p.id);}
 }
});
test('actual skirt triangles remain below every supported foot plane and sink all lower edge vertices',()=>{
 const mesh=E.geometry('coast-bank');
 for(const p of parts){const m=matrix(p);for(let i=0;i<mesh.length;i+=6){const v=E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]);assert.ok(v[1]<=p.seam.seamY+1e-6,'no raised ledge');assert.ok(v[1]<Math.min(...d.patches.map(p=>p.y)));if(mesh[i+1]<=0)assert.ok(v[1]<E.WATER_HEIGHT-.12,'submerged foot');}}
});
test('all exposed surface normals retain their positive outward and upward orientation after transformation',()=>{
 const mesh=E.geometry('coast-bank');
 for(const p of parts){const m=matrix(p);for(let i=0;i<128*18;i+=18){const a=E.M.transform(m,mesh.slice(i,i+3)),b=E.M.transform(m,mesh.slice(i+6,i+9)),c=E.M.transform(m,mesh.slice(i+12,i+15)),u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]),cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];assert.ok(cross[0]*p.seam.nx+cross[2]*p.seam.nz>0,'outward '+p.id);assert.ok(cross[1]>0,'upward '+p.id);}}
});
test('bridge sides remain open and all actual full-body routes stay above decorative geometry',()=>{
 for(const p of parts){const vs=vertices(p);assert.equal(vs.some(v=>Math.abs(v[0])<3.5&&v[2]>33&&v[2]<90),false,'no bank in channel span');}
 const actual=parts.map(p=>vertices(p));
 for(const route of d.routes)for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*4);for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n,y=W.height(d.room,x,z);assert.equal(y,1.57);for(const vs of actual)for(const v of vs)if(Math.abs(v[0]-x)<.35&&Math.abs(v[2]-z)<.35)assert.ok(v[1]<y-.10);}}
});
test('normal submission adds skirts only to Coastward and never changes canonical definitions or saves',()=>{
 const before=JSON.stringify(d),built=submission('earthlands');assert.equal(built.filter(p=>p.coastBank).length,parts.length);
 assert.equal(JSON.stringify(d),before);for(const id of ['heaven','hell','atlantis'])assert.equal(submission(id).some(p=>p.coastBank),false,id+' untouched');
 const bridge=built.filter(p=>p.worldGround&&p.worldGround==='channel-bridge');assert.ok(bridge.length>0);for(const p of bridge)assert.ok(p.s[0]<=8);
});
test('joining and subdividing equal-height source cells introduces no interior skirt or duplicate seam',()=>{
 const sample=[{x:-1,z:0,w:2,d:4,y:1.57,source:'land'},{x:1,z:0,w:2,d:4,y:1.57,source:'land'}],joined=A.coastBanks(sample);
 assert.equal(joined.length,4);assert.equal(joined.some(p=>p.seam.axis==='z'&&p.seam.at===0),false);
 assert.equal(A.coastBanks([{...sample[0],source:'channel-bridge'}]).length,0);
 assert.deepEqual(A.coastBanks([]),[]);
});
test('the new woodland floor is actual traversable ground linking both original lanes',()=>{
 for(const [x,z]of[[0,0],[0,-15],[0,-28],[8,-12],[-2,-20]]){assert.equal(W.height(d.room,x,z),1.57);assert.ok(W.walkable(d.room,x,z));}
 for(const z of [14,0,-15,-30])assert.ok(W.segment(d.room,{x:-10,z},{x:14,z}),'real cross-country route '+z);
 assert.deepEqual(d.entry,{x:0,z:104,yaw:Math.PI});assert.equal(d.enemies[0].id,'earthlands-coppice-skitter');
});
test('smooth bank surface vertices share normals across triangle joins without changing the old rock mesh',()=>{
 const mesh=E.geometry('coast-bank'),seen=new Map();for(let i=0;i<128*18;i+=6){const key=Array.from(mesh.slice(i,i+3)).join(','),n=Array.from(mesh.slice(i+3,i+6));if(seen.has(key))assert.deepEqual(n,seen.get(key));else seen.set(key,n);assert.ok(Math.abs(Math.hypot(...n)-1)<1e-6);assert.ok(n[0]>=0&&n[1]>0);}
 assert.equal(E.geometry('bank-slope').length/18,72);
});
