/* Focused pure rig/production mesh checks. No WebGL or combat simulation. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const A=require('../src/skitter-art.js'),E=require('../src/engine.js');
const source=fs.readFileSync(require.resolve('../src/skitter-art.js'),'utf8');
const input=(o={})=>({x:0,z:0,time:0,scene:'starter',paused:false,reducedMotion:false,...o});
const at=(o={})=>({x:0,z:0,base:1.57,yaw:0,named:false,bodyColor:0x7e8670,flash:false,...o});
const empty=()=>({box:[],round:[],octa:[]});
const near=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<=eps,`${a} != ${b}`);
const vnear=(a,b,eps=1e-7)=>a.forEach((v,i)=>near(v,b[i],eps));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const world=(p,v)=>{const f=p.named?1.32:1;return [p.x+(p.recoil?.x||0)+f*(v[0]*Math.cos(p.yaw)+v[2]*Math.sin(p.yaw)),p.base+v[1]*f,p.z+(p.recoil?.z||0)+f*(-v[0]*Math.sin(p.yaw)+v[2]*Math.cos(p.yaw))];};
function vertices(p){const mesh=E.geometry(p.kind),vs=[];for(let i=0;i<mesh.length;i+=6)vs.push(E.M.transform(p.m,mesh.slice(i,i+3)));return vs;}
function local(p,q){return [0,4,8].map(i=>{const c=p.m.slice(i,i+3);return E.dot(c,q.map((v,j)=>v-p.m[12+j]))/E.dot(c,c);});}
function walk(n,d=.48,t=.3){let p=A.motion(null,input());for(let i=1;i<=n;i++)p=A.motion(p,input({z:d*i/n,time:t*i/n}));return p;}
function freeze(o){if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
function roundInradius(){
 const mesh=E.geometry('round'),values=[];
 for(let i=0;i<mesh.length;i+=18){const a=Array.from(mesh.slice(i,i+3)),b=Array.from(mesh.slice(i+6,i+9)),c=Array.from(mesh.slice(i+12,i+15));const n=E.cross(b.map((v,j)=>v-a[j]),c.map((v,j)=>v-a[j]));if(Math.hypot(...n)>1e-9)values.push(Math.abs(E.dot(a,n))/Math.hypot(...n));}
 return Math.min(...values);
}
test('isolated browser and CommonJS export only the pure four-function API',()=>{
 const sandbox={module:{exports:{}},sentinel:7};vm.runInNewContext(source,sandbox);
 assert.equal(sandbox.module.exports,sandbox.RealmSkitterArt);assert.equal(sandbox.sentinel,7);assert.equal(Object.keys(sandbox).length,3);
 assert.deepEqual(Object.keys(A),['motion','pose','parts','draw']);assert.ok(Object.isFrozen(A));assert.equal(global.RealmSkitterArt,A);
});
test('actual displacement drives stride independently of subdivision, speed and chase intent',()=>{
 const coarse=walk(6),fine=walk(30),slow=walk(30,.48,.6);
 near(coarse.phase,.48/.8*Math.PI*2,1e-12);near(coarse.phase,fine.phase,1e-12);near(slow.phase,fine.phase,1e-12);near(coarse.blend,fine.blend,1e-12);
 let p=A.motion(null,input({walking:true}));for(let i=1;i<50;i++)p=A.motion(p,input({time:i*.02,walking:true}));
 assert.equal(p.phase,0);assert.equal(p.blend,0);assert.equal(p.moving,false);
 const a=A.pose({...p,mode:'chase',time:1}),b=A.pose({...p,mode:'chase',time:100});assert.deepEqual(a,b);
});
test('stopping holds phase, settles legs, and repeated samples do not fabricate motion',()=>{
 let p=walk(15),phase=p.phase;assert.deepEqual(A.motion(p,input({z:p.lastZ,time:p.lastTime})),p);
 const rounded=A.motion(p,input({z:.48,time:.3}));near(rounded.phase,p.phase);near(rounded.blend,p.blend);near(rounded.time,p.time);
 for(let i=1;i<=15;i++)p=A.motion(p,input({z:.48,time:.3+i*.04,walking:true}));
 assert.equal(p.phase,phase);assert.equal(p.blend,0);assert.equal(p.moving,false);
});
test('long pauses freeze the full drawable pose and consume skipped placement',()=>{
 const p=walk(15),paused=A.motion(p,input({z:.48,time:100,paused:true}));
 near(paused.phase,p.phase);near(paused.blend,p.blend);near(paused.time,p.time);
 const opts={mode:'windup',timer:.4,windup:.75,named:false};
 assert.deepEqual(A.parts(at(),A.pose({...p,...opts})),A.parts(at(),A.pose({...paused,...opts})));
 const displaced=A.motion(p,input({z:12,time:100,paused:true})),resumed=A.motion(displaced,input({z:12,time:100.04}));
 near(resumed.phase,p.phase);assert.ok(resumed.blend<p.blend);
});
test('scene/teleport/clock resets are isolated from source samples',()=>{
 const p=freeze(walk(15)),before=JSON.stringify(p);
 for(const extra of [{scene:'mine'},{z:20},{time:.1},{time:10},{z:.6,time:.3}]){
  const next=A.motion(p,input({z:.48,time:.34,...extra}));assert.equal(next.phase,0);assert.equal(next.blend,0);
 }
 assert.equal(JSON.stringify(p),before);
});
test('only actual windup with finite authoritative duration produces the crouched tell',()=>{
 for(const mode of ['idle','chase','recover','pursue','unknown'])assert.equal(A.pose({mode,timer:0,windup:.75,blend:1}).crouch,0);
 const start=A.pose({mode:'windup',timer:.75,windup:.75}),half=A.pose({mode:'windup',timer:.375,windup:.75}),end=A.pose({mode:'windup',timer:0,windup:.75});
 near(start.anticipation,0);near(half.anticipation,.5);near(end.anticipation,1);near(end.crouch,.09);
 assert.ok(start.bodyY>half.bodyY&&half.bodyY>end.bodyY);
 for(const invalid of [{windup:0},{windup:NaN},{timer:NaN},{}])assert.equal(A.pose({mode:'windup',timer:0,...invalid}).crouch,0);
 const full=A.pose({mode:'windup',timer:0,windup:.75,blend:1,phase:.8}),rest=A.pose({mode:'windup',timer:0,windup:.75,blend:0,phase:9});
 assert.deepEqual(full.legs,rest.legs,'a real tell plants all six feet regardless of prior chase animation');
});
test('recovery uses actual remaining duration to settle the head without implying success',()=>{
 const a=A.pose({mode:'recover',timer:1.1,recoverDuration:1.1}),b=A.pose({mode:'recover',timer:0,recoverDuration:1.1});
 near(a.recovery,1);near(b.recovery,0);assert.ok(a.headPitch>b.headPitch);assert.equal(a.crouch,0);assert.equal(b.crouch,0);
 near(A.pose({mode:'recover',timer:.9,recoverDuration:1.8,named:true}).recovery,.5);
 assert.equal(A.pose({mode:'idle',timer:1.1,recoverDuration:1.1}).recovery,0);
 assert.equal(A.pose({mode:'recover',timer:1.1}).recovery,0);
});
test('reduced motion keeps six-leg gait and authoritative tell but suppresses bob',()=>{
 const p=A.pose({mode:'chase',phase:.8,blend:1,reducedMotion:true,time:1}),q=A.pose({mode:'chase',phase:.8,blend:1,reducedMotion:true,time:100});
 assert.deepEqual(p,q);assert.equal(p.bob,0);assert.notDeepEqual(p.legs,A.pose({mode:'chase',phase:1.8,blend:1,reducedMotion:true}).legs);
 const tell=A.pose({mode:'windup',timer:0,windup:1.25,reducedMotion:true,named:true});near(tell.crouch,.09);
});
test('six jointed legs use tripod phases, fixed bone lengths and visible swing clearance',()=>{
 let lift=0;
 for(const mode of ['idle','chase','windup','recover'])for(let i=0;i<48;i++){
  const p=A.pose({mode,phase:i*Math.PI/24,blend:1,timer:.3,windup:.75,recoverDuration:1.1});assert.equal(Object.keys(p.legs).length,6);
  for(const l of Object.values(p.legs)){near(distance(l.hip,l.knee),.20);near(distance(l.knee,l.foot),.27);lift=Math.max(lift,l.foot[1]-.045);}
  near(p.legs.leftFront.foot[1],p.legs.leftRear.foot[1]);near(p.legs.leftFront.foot[1],p.legs.rightMiddle.foot[1]);
  near(p.legs.rightFront.foot[1],p.legs.rightRear.foot[1]);near(p.legs.rightFront.foot[1],p.legs.leftMiddle.foot[1]);
 }
 assert.ok(lift>.06);
});
test('actual emitted meshes remain above supplied ground, finite, positive and bounded',()=>{
 for(const named of [true,false])for(const reducedMotion of [true,false])for(const mode of ['idle','chase','windup','recover'])for(let i=0;i<12;i++){
  const p=A.pose({named,reducedMotion,mode,phase:i*Math.PI/6,blend:1,timer:mode==='windup'?0:.6,windup:.75,recoverDuration:1.1});
  const place=at({named,yaw:.8,base:4.77,x:3,z:-8,bodyColor:named?0x866747:0x7e8670}),parts=A.parts(place,p),f=named?1.32:1;
  assert.equal(parts.length,named?31:26);assert.ok(parts.length<=40);
  for(const part of parts){
   assert.ok(['box','round','octa'].includes(part.kind));assert.ok(part.p.every(Number.isFinite));assert.ok(part.s.every(n=>Number.isFinite(n)&&n>0));assert.ok(part.m.every(Number.isFinite));
   const columns=[0,4,8].map(n=>part.m.slice(n,n+3));assert.ok(E.dot(columns[0],E.cross(columns[1],columns[2]))>0);columns.forEach((v,j)=>near(Math.hypot(...v),part.s[j]));
   assert.equal(part.cameraSolid,false);assert.equal(part.cutaway,false);assert.equal(E.solidBounds(part.kind,part),null);
   for(const v of vertices(part)){assert.ok(v[1]>=place.base-2e-6,part.skitterPart+' penetrates ground');assert.ok(v[1]<place.base+1.22*f);assert.ok(Math.hypot(v[0]-place.x,v[2]-place.z)<.82*f);}
  }
 }
});
test('all actual leg skins meet shared anchors at ordinary/named scales and floor/yaw changes',()=>{
 for(const named of [false,true])for(const yaw of [0,.7,Math.PI])for(const base of [1.31,1.57,4.77])for(let i=0;i<12;i++){
  const place=at({named,yaw,base,x:9,z:-4}),p=A.pose({named,mode:'chase',phase:i*Math.PI/6,blend:1}),parts=A.parts(place,p);
  for(const [id,l] of Object.entries(p.legs)){
   const upper=parts.find(v=>v.skitterPart===id+'-upper'),lower=parts.find(v=>v.skitterPart===id+'-lower'),foot=parts.find(v=>v.skitterPart===id+'-foot');
   vnear(E.M.transform(upper.m,[0,-.5,0]),world(place,l.hip));vnear(E.M.transform(upper.m,[0,.5,0]),world(place,l.knee));
   vnear(E.M.transform(lower.m,[0,-.5,0]),world(place,l.knee));vnear(E.M.transform(lower.m,[0,.5,0]),world(place,l.foot));vnear(foot.p,world(place,l.foot));
   vnear(upper.anchorTo,lower.anchorFrom);
  }
 }
});
test('hips, plates and named spine roots attach inside the actual convex carapace',()=>{
 const radius=roundInradius();
 for(const mode of ['idle','chase','windup','recover']){
  const place=at({named:true,yaw:.6}),p=A.pose({named:true,mode,blend:1,phase:.8,timer:0,windup:1.25,recoverDuration:1.8}),parts=A.parts(place,p),shell=parts.find(v=>v.skitterPart==='carapace');
  for(const l of Object.values(p.legs))assert.ok(Math.hypot(...local(shell,world(place,l.hip)))<radius);
  for(const plate of parts.filter(v=>v.skitterPart.startsWith('carapace-plate')))assert.ok(Math.hypot(...local(shell,plate.p))<radius);
  const spines=parts.filter(v=>v.skitterPart.startsWith('river-spine'));assert.equal(spines.length,5);
  for(const spine of spines){
   vnear(E.M.transform(spine.m,[0,-.65,0]),spine.anchorFrom);vnear(E.M.transform(spine.m,[0,.65,0]),spine.anchorTo);
   assert.ok(Math.hypot(...local(shell,spine.anchorFrom))<radius,'spine has an embedded root');assert.equal(spine.c,0xcbb47e);
  }
 }
});
test('named scale occurs exactly once and unchanged original body envelope is preserved',()=>{
 const ordinary=A.parts(at(),A.pose({mode:'idle'})),named=A.parts(at({named:true}),A.pose({named:true,mode:'idle'}));
 const shell=ordinary.find(p=>p.skitterPart==='carapace');vnear(shell.p,[0,1.57+.52,0]);vnear(shell.s,[.95,.84,1.22]);
 for(const part of ordinary){
  const other=named.find(p=>p.skitterPart===part.skitterPart);assert.ok(other);
  vnear(other.p,[part.p[0]*1.32,1.57+(part.p[1]-1.57)*1.32,part.p[2]*1.32]);vnear(other.s,part.s.map(v=>v*1.32));
 }
 assert.equal(ordinary.filter(p=>p.skitterPart.startsWith('river-spine')).length,0);
});
test('confirmed flash color and recoil come only from caller feedback, leaving joints and rules untouched',()=>{
 const pose=A.pose({mode:'windup',timer:0,windup:.75}),a=A.parts(at(),pose),b=A.parts(at({bodyColor:0xf8e4b9,flash:true,recoil:{x:.12,z:-.06}}),pose);
 for(let i=0;i<a.length;i++){
  vnear(b[i].p,[a[i].p[0]+.12,a[i].p[1],a[i].p[2]-.06]);assert.equal(b[i].confirmedFlash,true);
  assert.equal(b[i].c,a[i].skitterPart.startsWith('carapace')?0xf8e4b9:a[i].c);
 }
 assert.equal(A.parts(at(),A.pose({mode:'windup',timer:0,windup:.75})).some(p=>p.confirmedFlash),false,'windup does not fabricate a confirmed hit');
});
test('fresh motion/pose/parts and draw preserve all input and existing output records',()=>{
 const motion=freeze(walk(15)),place=freeze(at()),p=freeze(A.pose({...motion,mode:'chase'})),before=JSON.stringify({motion,place,p});
 const out=empty(),prior={sentinel:7};out.box.push(prior);assert.equal(A.draw(out,place,p),26);assert.equal(out.box[0],prior);
 assert.equal(JSON.stringify({motion,place,p}),before);assert.deepEqual(prior,{sentinel:7});
 const a=A.parts(place,p);a[0].p[0]=100;assert.notEqual(A.parts(place,p)[0].p[0],100);assert.equal(new Set(a.map(v=>v.skitterPart)).size,a.length);
});
test('malformed placement, recoil or mismatched named pose refuses before output mutation',()=>{
 for(const invalid of [at({base:NaN}),at({yaw:Infinity}),at({named:true}),at({bodyColor:-1}),at({recoil:{x:NaN,z:0}}),{}]){
  const out=empty();assert.throws(()=>A.draw(out,invalid,A.pose({named:false})),TypeError);assert.equal(Object.values(out).flat().length,0);
 }
 const out=empty();assert.throws(()=>A.draw(out,at(),{...A.pose(),legs:{}}),TypeError);assert.equal(Object.values(out).flat().length,0);
 assert.throws(()=>A.draw({box:[]},at(),A.pose()),TypeError);
});
