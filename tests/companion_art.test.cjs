/* Pure CPU pose/actual production mesh checks, not WebGL or behavior tests. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const A=require('../src/companion-art.js'),E=require('../src/engine.js');
const source=fs.readFileSync(require.resolve('../src/companion-art.js'),'utf8');
const sample=(overrides={})=>({x:0,z:0,time:0,scene:'valley',walking:false,paused:false,reducedMotion:false,...overrides});
const placement=(overrides={})=>({x:0,z:0,base:1.57,yaw:0,bonded:true,...overrides});
const empty=()=>({box:[],round:[],octa:[]});
const near=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<=eps,`${a} != ${b}`);
const vnear=(a,b,eps=1e-7)=>a.forEach((v,i)=>near(v,b[i],eps));
const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const world=(p,v)=>[p.x+v[0]*Math.cos(p.yaw)+v[2]*Math.sin(p.yaw),p.base+v[1],p.z-v[0]*Math.sin(p.yaw)+v[2]*Math.cos(p.yaw)];
function vertices(p){const data=E.geometry(p.kind),out=[];for(let i=0;i<data.length;i+=6)out.push(E.M.transform(p.m,data.slice(i,i+3)));return out;}
function local(p,q){return [0,4,8].map(i=>{
 const c=[p.m[i],p.m[i+1],p.m[i+2]],d=q.map((v,j)=>v-p.m[12+j]);return E.dot(c,d)/E.dot(c,c);
});}
function walk(n,distance=.91,duration=.28){
 let state=A.motion(null,sample());
 for(let i=1;i<=n;i++)state=A.motion(state,sample({z:distance*i/n,time:duration*i/n,walking:true}));
 return state;
}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}

test('isolated browser global and CommonJS expose the same bounded pure API',()=>{
 const sandbox={module:{exports:{}},sentinel:{unchanged:7}};vm.runInNewContext(source,sandbox);
 assert.equal(sandbox.module.exports,sandbox.RealmCompanionArt);assert.equal(sandbox.sentinel.unchanged,7);
 assert.deepEqual(Object.keys(sandbox.module.exports),['motion','pose','parts','draw']);assert.equal(Object.keys(sandbox).length,3);
 assert.ok(Object.isFrozen(sandbox.module.exports));assert.equal(global.RealmCompanionArt,A);
});
test('gait phase follows actual displacement and is independent of sampling subdivision/speed',()=>{
 const coarse=walk(7),fine=walk(56),slow=walk(56,.91,.56);
 near(coarse.phase,.91/1.05*Math.PI*2,1e-12);near(coarse.phase,fine.phase,1e-12);near(slow.phase,fine.phase,1e-12);
 near(coarse.blend,fine.blend,1e-12);
 const noIntent=A.motion(A.motion(null,sample()),sample({z:.1,time:.04,walking:false}));
 assert.ok(noIntent.phase>0,'actual accepted displacement, not requested intent, drives gait');
});
test('stationary blocked intent cannot trot and stopping settles without advancing stride',()=>{
 let s=A.motion(null,sample({walking:true}));
 for(let i=1;i<=40;i++)s=A.motion(s,sample({time:i*.025,walking:true}));
 assert.equal(s.phase,0);assert.equal(s.blend,0);assert.equal(s.moving,false);
 const a=A.pose({...s,bonded:true,time:1}),b=A.pose({...s,bonded:true,time:9});assert.deepEqual(a.legs,b.legs);
 s=walk(14);const phase=s.phase;
 for(let i=1;i<=15;i++)s=A.motion(s,sample({z:.91,time:.28+i*.04,walking:true}));
 assert.equal(s.phase,phase);assert.equal(s.blend,0);assert.equal(s.moving,false);
});
test('repeated samples and long pauses preserve the full pose; paused travel is consumed',()=>{
 const old=walk(14),same=A.motion(old,sample({z:.91,time:.28,walking:true}));assert.deepEqual(same,old);
 const paused=A.motion(old,sample({z:.91,time:90,paused:true,walking:true}));
 assert.equal(paused.phase,old.phase);assert.equal(paused.blend,old.blend);assert.equal(paused.time,old.time);
 assert.deepEqual(A.pose({...paused,bonded:true}),A.pose({...old,bonded:true}));
 assert.deepEqual(A.parts(placement(),A.pose({...paused,bonded:true})),A.parts(placement(),A.pose({...old,bonded:true})));
 const shifted=A.motion(old,sample({z:8,time:.4,paused:true}));
 const resumed=A.motion(shifted,sample({z:8,time:.44}));assert.equal(resumed.phase,old.phase);
 assert.ok(resumed.blend<old.blend,'resume consumes paused displacement without a new stride');
});
test('scene, teleport and clock discontinuities reset gait without mutating previous samples',()=>{
 const old=freeze(walk(14)),before=JSON.stringify(old);
 for(const override of [{scene:'world-cosmos'},{z:40},{time:.1},{time:2},{time:.28,z:1.1}]){
  const next=A.motion(old,sample({z:.91,time:.32,...override}));assert.equal(next.phase,0);assert.equal(next.blend,0);
 }
 assert.equal(JSON.stringify(old),before);
 const normal=A.motion(old,sample({z:1,time:.32}));assert.ok(normal.phase>old.phase);
});
test('injured unbonded Briar is completely still and has no bond collar',()=>{
 const a=A.pose({bonded:false,time:0,phase:0,blend:0}),b=A.pose({bonded:false,time:900,phase:99,blend:1});
 assert.deepEqual(a,b);assert.equal(a.blend,0);assert.equal(a.bob,0);
 assert.equal(A.parts(placement({bonded:false}),a).length,30);
 assert.equal(A.parts(placement({bonded:false}),a).filter(p=>p.companionPart.startsWith('bond-collar')).length,0);
 assert.ok(a.bodyY<A.pose({bonded:true}).bodyY,'injured rest is lower without pretending to walk');
});
test('reduced motion retains all four essential legs while suppressing time-driven secondary drift',()=>{
 const opts={bonded:true,reducedMotion:true,phase:.8,blend:1};
 const a=A.pose({...opts,time:1}),b=A.pose({...opts,time:900});assert.deepEqual(a,b);
 assert.equal(a.bob,0);assert.equal(a.headYaw,0);assert.equal(a.headPitch,0);assert.deepEqual(a.earAngles,[0,0]);
 assert.notDeepEqual(a.legs,A.pose({...opts,phase:1.4}).legs);
 const full=A.pose({...opts,reducedMotion:false,time:1});assert.notDeepEqual(full.tail,a.tail);
});
test('diagonal trot has visible clearance, fixed leg lengths and no paw below supplied ground',()=>{
 let maxLift=0;
 for(const bonded of [true,false])for(const reducedMotion of [true,false])for(let i=0;i<64;i++){
  const p=A.pose({bonded,reducedMotion,phase:i*Math.PI/32,blend:1,time:i*.02});
  for(const l of Object.values(p.legs)){near(length(l.hip,l.knee),.24);near(length(l.knee,l.foot),.24);assert.ok(l.foot[1]>=.055-1e-8);maxLift=Math.max(maxLift,l.foot[1]-.055);}
  near(p.legs.leftFront.foot[1],p.legs.rightHind.foot[1]);near(p.legs.rightFront.foot[1],p.legs.leftHind.foot[1]);
  for(const part of A.parts(placement({bonded}),p))for(const v of vertices(part))assert.ok(v[1]>=1.57-2e-6,part.companionPart+' sinks below ground');
 }
 assert.ok(maxLift>.08);
});
test('actual bone transforms meet shared joints through every authored pose and placement',()=>{
 for(const yaw of [0,.7,Math.PI])for(const base of [1.31,1.57,4.77])for(let i=0;i<24;i++){
  const at=placement({x:7,z:-13,base,yaw}),p=A.pose({bonded:true,phase:i*Math.PI/12,blend:1,time:i*.03}),parts=A.parts(at,p);
  for(const [id,l] of Object.entries(p.legs)){
   const upper=parts.find(v=>v.companionPart===id+'-upper'),lower=parts.find(v=>v.companionPart===id+'-stocking'),paw=parts.find(v=>v.companionPart===id+'-paw');
   vnear(E.M.transform(upper.m,[0,-.5,0]),world(at,l.hip));vnear(E.M.transform(upper.m,[0,.5,0]),world(at,l.knee));
   vnear(E.M.transform(lower.m,[0,-.5,0]),world(at,l.knee));vnear(E.M.transform(lower.m,[0,.5,0]),world(at,l.foot));
   vnear(paw.p,world(at,l.foot));vnear(upper.anchorTo,lower.anchorFrom);
  }
  const neck=parts.find(v=>v.companionPart==='neck');vnear(neck.anchorTo,world(at,p.headAnchor));
 }
});
test('tail segments overlap at shared anchors and cream tip remains attached',()=>{
 for(let i=0;i<48;i++){
  const at=placement({yaw:.6}),p=A.pose({bonded:true,blend:i%2,phase:i*.2,time:i*.1}),parts=A.parts(at,p);
  const tails=[0,1,2].map(n=>parts.find(v=>v.companionPart==='tail-'+n));
  assert.equal(tails[2].c,0xf0e2bb);
  for(let j=1;j<tails.length;j++){
   const anchor=world(at,p.tail[j]);vnear(tails[j-1].anchorTo,tails[j].anchorFrom);
   for(const t of [tails[j-1],tails[j]])assert.ok(local(t,anchor).reduce((n,v)=>n+v*v,0)<.24,'joint is inside both ellipsoids, not point-connected');
  }
 }
});
test('familiar teal collar touches the neck and head details stay in a shared articulated frame',()=>{
 const at=placement({x:-2,z:11,yaw:.9}),p=A.pose({bonded:true,time:2}),parts=A.parts(at,p);
 const neck=parts.find(v=>v.companionPart==='neck'),collars=parts.filter(v=>v.companionPart.startsWith('bond-collar'));
 // The neck is a convex production round mesh. Its minimum face-plane
 // distance defines a guaranteed interior sphere in local mesh coordinates.
 const mesh=E.geometry('round'),inradii=[];
 for(let i=0;i<mesh.length;i+=18){
  const a=Array.from(mesh.slice(i,i+3)),b=Array.from(mesh.slice(i+6,i+9)),c=Array.from(mesh.slice(i+12,i+15));
  const n=E.cross(b.map((v,j)=>v-a[j]),c.map((v,j)=>v-a[j]));
  if(Math.hypot(...n)>1e-9)inradii.push(Math.abs(E.dot(a,n))/Math.hypot(...n));
 }
 const interior=Math.min(...inradii);
 assert.equal(collars.length,3);
 for(const collar of collars){
  assert.equal(collar.c,0x648e89);
  const faceCenters=[[-.5,0,0],[.5,0,0],[0,-.5,0],[0,.5,0],[0,0,-.5],[0,0,.5]].map(v=>E.M.transform(collar.m,v));
  assert.ok(faceCenters.some(v=>Math.hypot(...local(neck,v))<interior),
   'a real collar face enters the guaranteed interior of the actual neck mesh');
 }
 const nose=parts.find(v=>v.companionPart==='nose'),muzzle=parts.find(v=>v.companionPart==='muzzle');
 assert.ok(length(nose.p,muzzle.p)<.18);
 assert.ok(parts.some(v=>v.companionPart==='cream-bib'&&v.c===0xeee0ba));
});
test('inner ear patches stay on and within the actual outer-ear front facets',()=>{
 for(const yaw of [0,.7,Math.PI])for(const time of [0,2,8]){
  const parts=A.parts(placement({yaw}),A.pose({bonded:true,time}));
  for(const side of [-1,1]){
   const id=side<0?'left':'right',ear=parts.find(p=>p.companionPart===id+'-ear'),patch=parts.find(p=>p.companionPart===id+'-ear-inner');
   const [a,b,c]=[[0,0,.5],[0,.65,0],[side*.5,0,0]].map(v=>E.M.transform(ear.m,v));
   const v0=b.map((v,i)=>v-a[i]),v1=c.map((v,i)=>v-a[i]),normal=E.norm(E.cross(v0,v1));
   const d00=E.dot(v0,v0),d11=E.dot(v1,v1),d01=E.dot(v0,v1),denom=d00*d11-d01*d01;
   for(const q of vertices(patch)){
    const delta=q.map((v,i)=>v-a[i]),distance=E.dot(delta,normal);
    assert.ok(Math.abs(distance)<.009,'patch stays against the actual ear plane');
    const projected=delta.map((v,i)=>v-normal[i]*distance),d20=E.dot(projected,v0),d21=E.dot(projected,v1);
    const u=(d11*d20-d01*d21)/denom,v=(d00*d21-d01*d20)/denom;
    assert.ok(u>=-1e-6&&v>=-1e-6&&u+v<=1+1e-6,'patch remains inside the outer triangle');
   }
  }
 }
});
test('all actual mesh transforms are finite, positive and bounded for all part kinds',()=>{
 for(const bonded of [true,false])for(let i=0;i<24;i++){
  const at=placement({bonded,yaw:i*.2}),posed=A.pose({bonded,phase:i*.3,time:i*.1,blend:1}),parts=A.parts(at,posed);
  assert.ok(parts.length<=48);assert.equal(parts.length,bonded?33:30);
  assert.equal(new Set(parts.map(p=>p.companionPart)).size,parts.length);
  for(const p of parts){
   assert.ok(['box','round','octa'].includes(p.kind));assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(v=>Number.isFinite(v)&&v>0));assert.ok(p.m.every(Number.isFinite));
   const c=[0,4,8].map(n=>p.m.slice(n,n+3));assert.ok(E.dot(c[0],E.cross(c[1],c[2]))>0);
   for(let j=0;j<3;j++)near(Math.hypot(...c[j]),p.s[j]);
   assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.appearanceOnly,true);assert.equal(E.solidBounds(p.kind,p),null);
   for(const v of vertices(p)){assert.ok(Math.hypot(v[0]-at.x,v[2]-at.z)<1.55,'bounded animal silhouette');assert.ok(v[1]<at.base+1.4);}
  }
 }
});
test('pure pose/draw never changes placement, motion, supplied state or existing output entries',()=>{
 const state=freeze(walk(14)),at=freeze(placement()),p=freeze(A.pose({...state,bonded:true}));
 const before=JSON.stringify({state,at,p}),out=empty(),prior={sentinel:7};out.box.push(prior);
 assert.equal(A.draw(out,at,p),33);assert.equal(out.box[0],prior);assert.deepEqual(prior,{sentinel:7});
 assert.equal(JSON.stringify({state,at,p}),before);
 const first=A.parts(at,p);first[0].p[0]=999;assert.notEqual(A.parts(at,p)[0].p[0],999);
 assert.equal(Object.values(out).flat().length,34);
});
test('invalid or mismatched actual placement refuses before any partial draw',()=>{
 const posed=A.pose({bonded:true});
 for(const bad of [placement({base:NaN}),placement({x:Infinity}),placement({bonded:false}),{}]){
  const out=empty();assert.throws(()=>A.draw(out,bad,posed),TypeError);assert.equal(Object.values(out).flat().length,0);
 }
 const out=empty();assert.throws(()=>A.draw(out,placement(),{...posed,tail:[0,1,2,3]}),TypeError);assert.equal(Object.values(out).flat().length,0);
 assert.throws(()=>A.draw({box:[],round:[]},placement(),posed),TypeError);
});
