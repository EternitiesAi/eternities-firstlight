/* Pure CPU mesh qualification. Combat poses and saved encounter histories are
 * labelled synthetic fixtures; no simulation commands or earned kills here. */
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const B=require('../src/earth-expedition-beast-art.js'),E=require('../src/engine.js');
const C=require('../src/core.js'),EE=require('../src/earth-expedition.js'),W=require('../src/world-foundations.js');
const source=fs.readFileSync(require.resolve('../src/earth-expedition-beast-art.js'),'utf8');
const at=(extra={})=>({x:-134,z:-70,base:1.57,yaw:0,mode:'idle',timer:0,windup:1.35,recovery:2.3,time:0,paused:false,reducedMotion:false,flash:false,...extra});
const empty=()=>({box:[],round:[],octa:[]}),near=(a,b,e=2e-6)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const vnear=(a,b,e)=>a.forEach((n,i)=>near(n,b[i],e));
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const meshes=new Map();function mesh(kind){if(!meshes.has(kind)){const raw=E.geometry(kind),vs=[];for(let i=0;i<raw.length;i+=6)vs.push(Array.from(raw.slice(i,i+3)));meshes.set(kind,vs);}return meshes.get(kind);}
const vertices=p=>mesh(p.kind).map(v=>E.M.transform(p.m,v));
const world=(a,v)=>[a.x+v[0]*Math.cos(a.yaw)+v[2]*Math.sin(a.yaw),a.base+v[1],a.z-v[0]*Math.sin(a.yaw)+v[2]*Math.cos(a.yaw)];
function inside(p,q){const vs=vertices(p);for(let i=0;i<vs.length;i+=3){const a=vs[i],b=vs[i+1],c=vs[i+2],n=E.cross(b.map((v,j)=>v-a[j]),c.map((v,j)=>v-a[j]));if(Math.hypot(...n)<1e-9)continue;const center=E.dot(n,p.p.map((v,j)=>v-a[j])),probe=E.dot(n,q.map((v,j)=>v-a[j]));if(center*probe<-1e-11)return false;}return true;}
const shape=parts=>parts.map(({kind,p,s,m,expeditionBeastPart})=>({kind,p,s,m,expeditionBeastPart}));
const by=(ps,id)=>ps.find(p=>p.expeditionBeastPart===id);

test('isolated global-script/CommonJS export a dependency-free frozen appearance API only',()=>{
 const sandbox={module:{exports:{}},sentinel:17};vm.runInNewContext(source,sandbox);assert.equal(sandbox.RealmEarthExpeditionBeastArt,sandbox.module.exports);assert.equal(sandbox.sentinel,17);assert.equal(Object.keys(sandbox).length,3);
 assert.deepEqual(Object.keys(B),['pose','parts','draw']);assert.ok(Object.isFrozen(B));assert.equal(global.RealmEarthExpeditionBeastArt,B);
 assert.equal(sandbox.module.exports.parts(at()).length,41,'no simulation/DOM/engine dependency needed to emit parts');
});
test('only actual windup and recovery timers produce the grounded combat posture',()=>{
 const start=B.pose(at({mode:'windup',timer:1.35})),middle=B.pose(at({mode:'windup',timer:.675})),end=B.pose(at({mode:'windup',timer:0}));
 near(start.anticipation,0);near(middle.anticipation,.5);near(end.anticipation,1);assert.ok(start.bodyY>middle.bodyY&&middle.bodyY>end.bodyY);assert.ok(start.headPitch<middle.headPitch&&middle.headPitch<end.headPitch);
 const recovery=B.pose(at({mode:'recover',timer:2.3})),half=B.pose(at({mode:'recover',timer:1.15})),settled=B.pose(at({mode:'recover',timer:0}));near(recovery.recovery,1);near(half.recovery,.5);near(settled.recovery,0);
 assert.deepEqual(shape(B.parts(at({mode:'windup',timer:0}))),shape(B.parts(at({mode:'recover',timer:2.3}))),'last anticipation and first recovery meet continuously');assert.deepEqual(shape(B.parts(at({mode:'recover',timer:0}))),shape(B.parts(at())));
 for(const mode of ['idle','chase','pursue','return']){const p=B.pose(at({mode,timer:0}));assert.equal(p.anticipation,0);assert.equal(p.recovery,0);assert.equal(p.crouch,0);}
 assert.equal(B.pose(at({mode:'pursue'})).mode,'chase');assert.equal(B.pose(at({mode:'return'})).mode,'chase');
 near(B.pose(at({mode:'windup',windup:2,timer:1})).anticipation,.5);near(B.pose(at({mode:'recover',recovery:4,timer:2})).recovery,.5);
});
test('stationary chase intent, pause and elapsed time never fabricate trot, attack results or recoil',()=>{
 for(const mode of ['idle','chase','windup','recover'])for(const paused of [false,true])for(const reducedMotion of [false,true]){
  const a=at({mode,timer:.4,paused,reducedMotion,time:1}),b={...a,time:100};assert.deepEqual(B.parts(a),B.parts(b));
  assert.deepEqual(shape(B.parts(a)),shape(B.parts({...a,reducedMotion:!reducedMotion})), 'essential planted posture stays; no cosmetic sway');
 }
 const args=at({hitAt:0,hitFrom:{x:-133,z:-70},time:.05,aim:{x:-125,z:-49}});assert.deepEqual(B.parts(args),B.parts(at()),'unknown hit metadata and aim do not move or rotate the body');
});
test('actual triangle bounds stay grounded, finite, compact and inside the existing tell radius',()=>{
 let specimens=0,top=0,radius=0;
 for(const mode of ['idle','chase','windup','recover'])for(const phase of [0,.25,.5,.75,1])for(const yaw of [0,.73,Math.PI*1.5])for(const base of [1.57,4.77])for(const reducedMotion of [false,true]){
  const options=at({mode,timer:(mode==='windup'?1.35:2.3)*phase,yaw,base,reducedMotion}),ps=B.parts(options);assert.equal(ps.length,41);assert.ok(ps.length<65);const ids=new Set();
  for(const p of ps){assert.ok(['box','round','octa'].includes(p.kind));assert.ok(!ids.has(p.expeditionBeastPart));ids.add(p.expeditionBeastPart);assert.ok([...p.p,...p.s,...p.m].every(Number.isFinite));assert.ok(p.s.every(n=>n>0));vnear(p.m.slice(12,15),p.p);
   const axes=[0,4,8].map(i=>p.m.slice(i,i+3));axes.forEach((a,i)=>near(Math.hypot(...a),p.s[i]));assert.ok(E.dot(axes[0],E.cross(axes[1],axes[2]))>0);for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)near(E.dot(axes[i],axes[j]),0);
   assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.appearanceOnly,true);assert.equal(E.solidBounds(p.kind,p),null);assert.equal(p.poseMode,B.pose(options).mode);
   for(const v of vertices(p)){assert.ok(v[1]>=base-2e-6,p.expeditionBeastPart+' below supplied support');top=Math.max(top,v[1]-base);radius=Math.max(radius,Math.hypot(v[0]-options.x,v[2]-options.z));assert.ok(v[1]<base+1.05);assert.ok(Math.hypot(v[0]-options.x,v[2]-options.z)<1.2);}
  }
  for(const id of ['leftFront','rightFront','leftRear','rightRear'])near(Math.min(...vertices(by(ps,id+'-hoof')).map(v=>v[1])),base);
  const bellyMin=Math.min(...vertices(by(ps,'body')).map(v=>v[1]));const hoofTop=Math.max(...vertices(by(ps,'leftFront-hoof')).map(v=>v[1]));assert.ok(bellyMin-hoofTop>.10,'short legs still leave a real body/ground gap');specimens++;
 }
 assert.equal(specimens,240);assert.ok(top>.85&&top<.95);assert.ok(radius>.65&&radius<.8);
});
test('four articulated legs connect actual body, knee meshes and grounded hooves',()=>{
 for(const mode of ['idle','chase','windup','recover'])for(const timer of [0,.4,1.35,2.3]){
  const a=at({mode,timer,yaw:.7}),p=B.pose(a),ps=B.parts(a),body=by(ps,'body');assert.equal(Object.keys(p.legs).length,4);
  for(const[id,l]of Object.entries(p.legs)){
   const upper=by(ps,id+'-upper'),lower=by(ps,id+'-lower'),joint=by(ps,id+'-joint'),hoof=by(ps,id+'-hoof');
   vnear(upper.anchorFrom,world(a,l.hip));vnear(upper.anchorTo,lower.anchorFrom);vnear(lower.anchorTo,world(a,l.foot));
   assert.ok(inside(body,upper.anchorFrom),id+' hip floats outside actual convex body');assert.ok(inside(joint,upper.anchorTo));assert.ok(inside(joint,lower.anchorFrom));assert.ok(inside(hoof,lower.anchorTo));
   for(const beam of [upper,lower]){const m=beam.m,v=m.slice(4,7);vnear(m.slice(12,15).map((n,i)=>n-v[i]/2),beam.anchorFrom);vnear(m.slice(12,15).map((n,i)=>n+v[i]/2),beam.anchorTo);}
  }
 }
});
test('head, muzzle, tusks, ridge and tail have actual attached mesh anchors',()=>{
 for(const mode of ['idle','windup','recover'])for(const timer of [0,.675,1.35,2.3]){
  const ps=B.parts(at({mode,timer,yaw:.9})),head=by(ps,'head'),muzzle=by(ps,'muzzle'),body=by(ps,'body');
  assert.ok(inside(body,head.p),'head center attaches inside actual shoulder/body');assert.ok(vertices(muzzle).some(v=>inside(head,v)),'muzzle intersects actual head');
  for(const side of ['left','right']){const a=by(ps,side+'-tusk-base'),b=by(ps,side+'-tusk-tip');assert.ok(inside(muzzle,a.anchorFrom));vnear(a.anchorTo,b.anchorFrom);
   for(const q of [a,b]){const m=q.m,v=m.slice(4,7);vnear(m.slice(12,15).map((n,i)=>n-v[i]*.65),q.anchorFrom);vnear(m.slice(12,15).map((n,i)=>n+v[i]*.65),q.anchorTo);}
   assert.ok(vertices(by(ps,side+'-ear')).some(v=>inside(head,v)),side+' ear floats');assert.ok(vertices(by(ps,side+'-eye')).some(v=>inside(head,v)),side+' eye floats');assert.ok(vertices(by(ps,side+'-nostril')).some(v=>inside(by(ps,'nose'),v)));
  }
  for(let i=0;i<4;i++)assert.ok(vertices(by(ps,'ridge-'+i)).some(v=>inside(body,v)),'ridge attaches to carapace');
  const a=by(ps,'tail-base'),b=by(ps,'tail-tip');assert.ok(inside(body,a.anchorFrom));vnear(a.anchorTo,b.anchorFrom);assert.ok(inside(by(ps,'tail-tuft'),b.anchorTo));
 }
});
test('world root applies translation, supplied support and actual yaw exactly once',()=>{
 const a=at({x:0,z:0,base:0,mode:'windup',timer:.4}),b=at({x:-134,z:-70,base:1.57,yaw:1.1,mode:'windup',timer:.4}),local=B.parts(a),placed=B.parts(b);
 for(let i=0;i<local.length;i++){vnear(placed[i].p,world(b,local[i].p));const av=vertices(local[i]),bv=vertices(placed[i]);for(let j=0;j<av.length;j++)vnear(bv[j],world(b,av[j]));if(local[i].anchorFrom){vnear(placed[i].anchorFrom,world(b,local[i].anchorFrom));vnear(placed[i].anchorTo,world(b,local[i].anchorTo));}}
 const nose=by(B.parts(at({x:0,z:0,base:0,yaw:Math.PI/2})),'nose');assert.ok(nose.p[0]>.6);near(nose.p[2],0);
});
test('confirmed flash changes colors only, and all records are fresh read-only projections',()=>{
 const args=freeze(at({mode:'windup',timer:.6,aim:{x:-130,z:-69}})),before=JSON.stringify(args),ps=B.parts(args),flashed=B.parts({...args,flash:true});assert.equal(JSON.stringify(args),before);assert.deepEqual(shape(ps),shape(flashed));assert.ok(flashed.every(p=>p.c===0xf8e4b9&&p.confirmedFlash));assert.ok(ps.every(p=>!p.confirmedFlash));
 ps[0].m[12]=900;ps[0].p[0]=900;ps[0].s[0]=900;assert.deepEqual(B.parts(args),B.parts(args));assert.notEqual(B.parts(args)[0].m[12],900);
 const p=B.pose(args);p.legs.leftFront.hip[0]=900;assert.notEqual(B.pose(args).legs.leftFront.hip[0],900);
});
test('invalid placements/durations/modes and unwritable outputs refuse before partial emission',()=>{
 for(const extra of [{x:NaN},{z:Infinity},{base:'1.57'},{yaw:null},{timer:NaN},{windup:0},{recovery:Infinity},{mode:'attack-success'},{aim:{x:0,z:NaN}},{time:NaN}]){const out=empty(),before=JSON.stringify(out);assert.throws(()=>B.draw(out,at(extra)));assert.equal(JSON.stringify(out),before);}
 for(const bad of [{box:[],round:[],octa:null},{box:[],round:Object.freeze([]),octa:[]}]){const before=JSON.stringify(bad);assert.throws(()=>B.draw(bad,at()));assert.equal(JSON.stringify(bad),before);}
 const out=empty(),n=B.draw(out,at());assert.equal(n,41);assert.deepEqual(Object.entries(out).flatMap(([kind,ps])=>ps.map(p=>({kind,...p}))).sort((a,b)=>a.expeditionBeastPart.localeCompare(b.expeditionBeastPart)),B.parts(at()).sort((a,b)=>a.expeditionBeastPart.localeCompare(b.expeditionBeastPart)));
});
test('actual expedition root encounters retain exact rules and physical anchors after pure art projection',()=>{
 const sim=new C.Simulation();sim.room='world-earthlands';const r=EE.fresh();r.story.accepted=true;r.story.branch='managed-coppice';r.story.steps=EE.definition.steps.slice(0,5).map(s=>s.id);sim.state.earthExpedition=EE.validate(r);
 const before=JSON.stringify(sim.state),foe=EE.enemies(sim).find(e=>e.defeatStep==='clear-root-pests');assert.ok(foe);assert.equal(foe.kind,'sentinel');assert.equal(foe.hp,136);assert.equal(foe.damage,11);assert.equal(foe.windup,1.35);assert.equal(foe.recovery,2.3);assert.deepEqual([foe.x,foe.z],[-134,-70]);
 const terms=JSON.stringify(foe),ps=B.parts(at({...foe,base:W.height(sim.room,foe.x,foe.z),yaw:.5,mode:'windup',timer:.8}));assert.equal(JSON.stringify(foe),terms);assert.equal(JSON.stringify(sim.state),before);assert.ok(W.walkable(sim.room,foe.x,foe.z,.31));
 for(const p of ps)for(const v of vertices(p))assert.ok(W.land(sim.room,v[0],v[2],0),'actual accepted root-bank pocket supports '+p.expeditionBeastPart);
 const patrol=EE.patrol.enemies.find(e=>e.defeatStep==='clear-root-pests');assert.deepEqual([patrol.kind,patrol.x,patrol.z,patrol.hp,patrol.damage],['sentinel',-134,-70,136,11]);
});
