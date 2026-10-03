'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
// Reuse the renderer's actual matrix conventions without constructing WebGL.
const E=require('../src/engine.js'),X=require('../src/creative.js');
const T=require('../src/traveler-art.js');
const empty=()=>({box:[],round:[],octa:[],disc:[]});
const all=out=>Object.values(out).flat();
const close=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const vclose=(a,b,tolerance=1e-6)=>a.forEach((n,i)=>close(n,b[i],tolerance));
const sample=(overrides={})=>({x:0,z:0,scene:'earth',time:0,walking:false,paused:false,reducedMotion:false,...overrides});
function freeze(o){Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);return o;}
function walk(parts,distance=1.08,duration=.36){
 let previous=T.motion(null,sample());
 for(let i=1;i<=parts;i++)previous=T.motion(previous,sample({x:distance*i/parts,time:duration*i/parts,walking:true}));
 return previous;
}

test('CommonJS and browser globals expose the same bounded rig API',()=>{
 assert.equal(global.RealmTravelerArt,T);assert.deepEqual(Object.keys(T),['motion','pose','draw']);
});
test('gallery stroke keeps limbs connected and reduced motion settles the arms',()=>{
 const poses=[T.pose({swimming:true,time:0,blend:1,phase:1}),T.pose({swimming:true,time:1,blend:1,phase:2})];
 assert.notDeepEqual(poses[0].joints.leftHand,poses[1].joints.leftHand);
 for(const p of poses)for(const side of ['left','right']){
  close(Math.hypot(...p.joints[side+'Elbow'].map((v,i)=>v-p.joints[side+'Shoulder'][i])),.305,1e-6);
  close(Math.hypot(...p.joints[side+'Hand'].map((v,i)=>v-p.joints[side+'Elbow'][i])),.285,1e-6);
  assert.ok(Object.values(p.joints).flat().every(Number.isFinite));
 }
 const a=T.pose({swimming:true,reducedMotion:true,time:0}),b=T.pose({swimming:true,reducedMotion:true,time:100});
 assert.deepEqual(a.joints,b.joints);assert.equal(a.combatScene,false);
});
test('gait phase follows accepted distance and survives frame subdivision',()=>{
 const coarse=walk(6),fine=walk(36);
 close(coarse.phase,fine.phase,1e-12);close(coarse.blend,fine.blend,1e-12);
 close(coarse.phase,1.08/1.35*Math.PI*2,1e-12);
 const slower=walk(36,1.08,.72);close(slower.phase,fine.phase,1e-12);
 assert.notEqual(slower.blend,fine.blend,'easing may follow elapsed time, stride may not');
});
test('stationary walking intent never drives foot shuffling',()=>{
 let previous=T.motion(null,sample({walking:true}));
 for(let i=1;i<=40;i++)previous=T.motion(previous,sample({time:i*.025,walking:true}));
 assert.equal(previous.phase,0);assert.equal(previous.blend,0);
 const a=T.pose({phase:previous.phase,blend:previous.blend,time:1});
 const b=T.pose({phase:previous.phase,blend:previous.blend,time:9});
 vclose(a.joints.leftFoot,b.joints.leftFoot);vclose(a.joints.rightFoot,b.joints.rightFoot);
});
test('stopping holds phase and eases the feet into a settled stance',()=>{
 let previous=walk(12),phase=previous.phase,oldBlend=previous.blend;
 for(let i=1;i<=12;i++)previous=T.motion(previous,sample({x:1.08,time:.36+i*.04}));
 assert.equal(previous.phase,phase);assert.ok(previous.blend<oldBlend);assert.equal(previous.blend,0);
 const posed=T.pose({...previous,blend:previous.blend});
 close(posed.joints.leftAnkle[2],0);close(posed.joints.rightAnkle[2],0);
});
test('repeated samples and long pauses preserve the complete drawable pose',()=>{
 const moving=walk(12),same=T.motion(moving,sample({x:1.08,time:moving.lastTime,walking:true}));
 assert.deepEqual(same,moving);
 const rounded=T.motion(moving,sample({x:1.08,time:.36,walking:true}));
 assert.equal(rounded.phase,moving.phase);assert.equal(rounded.blend,moving.blend);assert.equal(rounded.time,moving.time);
 const paused=T.motion(moving,sample({x:1.08,time:90,walking:true,paused:true}));
 assert.equal(paused.phase,moving.phase);assert.equal(paused.blend,moving.blend);assert.equal(paused.time,moving.time);
 const poseA=T.pose({phase:moving.phase,blend:moving.blend,time:moving.time});
 const poseB=T.pose({phase:paused.phase,blend:paused.blend,time:paused.time});
 assert.deepEqual(poseB,poseA);
 const outA=empty(),outB=empty();T.draw(outA,{},poseA);T.draw(outB,{},poseB);assert.deepEqual(outB,outA);
 const resumed=T.motion(paused,sample({x:1.08,time:90.04}));
 assert.equal(resumed.phase,moving.phase);assert.ok(resumed.time-moving.time<=.100001);
});
test('paused coordinates are consumed without turning skipped travel into steps',()=>{
 const moving=walk(12),paused=T.motion(moving,sample({x:1.3,time:.5,walking:true,paused:true}));
 const resumed=T.motion(paused,sample({x:1.3,time:.54,walking:true}));
 assert.equal(resumed.phase,moving.phase);assert.ok(resumed.blend<moving.blend);
});
test('scene changes, teleports and clock discontinuities reset the stance',()=>{
 const previous=walk(12);
 for(const change of [{scene:'cosmos'},{x:40},{time:.2},{time:4},{time:.36,x:1.4}]){
  const next=T.motion(previous,sample({x:1.08,time:.40,walking:true,...change}));
  assert.equal(next.phase,0,JSON.stringify(change));assert.equal(next.blend,0);
 }
 const next=T.motion(previous,sample({x:1.14,time:.66,walking:true}));
 close(next.time-previous.time,.1);assert.ok(next.phase>previous.phase,'a capped interval still accepts legitimate distance');
});
test('reduced motion keeps essential gait and weapon alignment without secondary drift',()=>{
 const input={phase:.9,blend:1,reducedMotion:true,style:'bow',combatScene:true,combatPhase:'anticipate',combatProgress:.7};
 const a=T.pose({...input,time:1}),b=T.pose({...input,time:999});
 assert.deepEqual(a.joints,b.joints);assert.equal(a.bob,0);assert.equal(a.cloakSwing,0);
 const idle=T.pose({...input,combatProgress:0});
 assert.ok(a.joints.rightHand[2]<idle.joints.rightHand[2],'the drawing hand still follows the actual bow draw');
 const recovered=T.pose({...input,combatPhase:'recover',combatProgress:0});
 const fullyDrawn=T.pose({...input,combatProgress:1});
 vclose(recovered.joints.rightHand,fullyDrawn.joints.rightHand,1e-10);
 vclose(T.pose({...input,combatPhase:'recover',combatProgress:1}).joints.rightHand,idle.joints.rightHand,1e-10);
 vclose(T.pose({...input,combatPhase:'recover',combatProgress:0,releaseOrigin:'ready'}).joints.rightHand,idle.joints.rightHand,1e-10);
 const stepped=T.motion(T.motion(null,sample()),sample({x:.08,time:.04,walking:true,reducedMotion:true}));
 assert.ok(stepped.phase>0);
 const quiet=T.pose({...input,combatScene:false}),full=T.pose({...input,reducedMotion:false,combatScene:false,time:1});
 assert.ok(Math.abs(quiet.joints.leftAnkle[2])<Math.abs(full.joints.leftAnkle[2]));
});
test('walking has visible foot clearance and preserves fixed limb lengths',()=>{
 let maxLift=0;
 for(let i=0;i<48;i++){
  const posed=T.pose({phase:i*Math.PI/24,blend:1,time:i*.01});
  maxLift=Math.max(maxLift,posed.joints.leftAnkle[1]-.115,posed.joints.rightAnkle[1]-.115);
  for(const side of ['left','right']){
   const j=posed.joints,dist=(a,b)=>Math.hypot(...a.map((n,k)=>n-b[k]));
   close(dist(j[side+'Hip'],j[side+'Knee']),.41,1e-10);
   close(dist(j[side+'Knee'],j[side+'Ankle']),.41,1e-10);
   close(dist(j[side+'Shoulder'],j[side+'Elbow']),.305,1e-10);
   close(dist(j[side+'Elbow'],j[side+'Hand']),.285,1e-10);
  }
 }
 assert.ok(maxLift>=.10&&maxLift<=.11);
});
test('blade/bow anticipation, recovery and guard are connected and distinct',()=>{
 for(const style of ['blade','bow']){
  const ready=T.pose({style,combatScene:true});
  const anticipate=T.pose({style,combatScene:true,combatPhase:'anticipate',combatProgress:1});
  const recover=T.pose({style,combatScene:true,combatPhase:'recover',combatProgress:0});
  const recovered=T.pose({style,combatScene:true,combatPhase:'recover',combatProgress:1});
  const guarded=T.pose({style,combatScene:true,guarded:true});
  assert.notDeepEqual(anticipate.joints.rightHand,ready.joints.rightHand);
  assert.notDeepEqual(recover.joints.rightHand,ready.joints.rightHand);
  vclose(recovered.joints.rightHand,ready.joints.rightHand,1e-10);
  assert.notDeepEqual(guarded.joints.rightHand,ready.joints.rightHand);
  assert.equal(guarded.guarded,true);
  for(const p of [ready,anticipate,recover,recovered,guarded])for(const side of ['left','right']){
   const j=p.joints,dist=(a,b)=>Math.hypot(...a.map((n,k)=>n-b[k]));
   close(dist(j[side+'Shoulder'],j[side+'Elbow']),.305,1e-10);
   close(dist(j[side+'Elbow'],j[side+'Hand']),.285,1e-10);
  }
 }
 const stowed=T.pose({style:'bow',combatPhase:'anticipate',combatProgress:1,guarded:true});
 assert.equal(stowed.combatPhase,'idle');assert.equal(stowed.guarded,false);assert.equal(stowed.combatScene,false);
});
test('draw segments actually connect the named joints under root translation and yaw',()=>{
 const rootInput={x:8,z:-3,base:2.7,yaw:Math.PI/2};
 for(const style of ['none','blade','bow'])for(const combatPhase of ['idle','anticipate','recover']){
  const posed=T.pose({phase:1.7,blend:.8,time:4,style,combatScene:true,combatPhase,combatProgress:.66});
  const out=empty(),frame=T.draw(out,rootInput,posed);
  const pairs={thigh:['Hip','Knee'],shin:['Knee','Ankle'],'upper-arm':['Shoulder','Elbow'],forearm:['Elbow','Hand']};
  for(const side of ['left','right'])for(const [part,[a,b]]of Object.entries(pairs)){
   const item=out.box.find(it=>it.travelerPart===side+'-'+part);
   vclose(E.M.transform(item.m,[0,-.5,0]),E.M.transform(frame.root,posed.joints[side+a]),1e-6);
   vclose(E.M.transform(item.m,[0,.5,0]),E.M.transform(frame.root,posed.joints[side+b]),1e-6);
  }
  const hand=out.round.find(it=>it.travelerPart==='right-hand');
  vclose(hand.p,E.M.transform(frame.root,frame.joints.rightHand));
  vclose(frame.joints.rightHand,posed.joints.rightHand);
  vclose(E.M.transform(frame.root,[0,0,1]),[9,2.7,-3]);
 }
});
test('palette choices and explicitly supplied armor colour are retained',()=>{
 for(let i=0;i<X.SKINS.length;i++){
  const out=empty();T.draw(out,{profile:{skin:i,hair:i,cloak:i}});
  assert.deepEqual(out.round.find(it=>it.travelerPart==='head').c,E.hex(X.SKINS[i]));
  assert.deepEqual(out.box.find(it=>it.travelerPart==='hair-crown').c,E.hex(X.HAIR[i]));
  assert.deepEqual(out.box.find(it=>it.travelerPart==='cloak-left').c,E.hex(X.CLOAKS[i]));
 }
 const out=empty();T.draw(out,{armorColor:'#8bad91',color:'#955e73',profile:{cloak:3}});
 assert.deepEqual(out.box.find(it=>it.travelerPart==='jacket-chest').c,E.hex('#8bad91'));
 assert.deepEqual(out.box.find(it=>it.travelerPart==='cloak-left').c,E.hex(X.CLOAKS[3]));
});
test('all transforms stay finite, actor geometry has no camera authority, and budget stays bounded',()=>{
 for(const reducedMotion of [false,true])for(const style of ['none','blade','bow'])for(let i=0;i<20;i++){
  const posed=T.pose({phase:i*.91,blend:i/19,time:i,style,combatScene:true,reducedMotion,
   combatPhase:i%2?'anticipate':'recover',combatProgress:i/19,guarded:i%5===0});
  const out=empty();T.draw(out,{x:3,z:2,base:1.5,yaw:i*.33},posed);
  assert.equal(all(out).length,49);assert.ok(all(out).length<65);
  for(const item of all(out)){
   assert.ok([...item.m,...item.p,...item.s,...E.hex(item.c)].every(Number.isFinite));
   assert.ok(item.s.every(n=>n>0));assert.equal(item.cameraSolid,false);assert.equal(item.cutaway,false);
   assert.ok(item.travelerPart);
  }
  for(const j of Object.values(posed.joints))assert.ok(j.every(Number.isFinite)&&Math.hypot(j[0],j[2])<.9&&j[1]>0&&j[1]<1.8);
  const localOut=empty();T.draw(localOut,{},posed);
  for(const [kind,items]of Object.entries(localOut))for(const item of items){
   const halfY=kind==='octa'?.65:kind==='disc'?0:.5;
   for(const cx of [-.5,.5])for(const cy of [-halfY,halfY])for(const cz of [-.5,.5]){
    const corner=E.M.transform(item.m,[cx,cy,cz]);
    assert.ok(Math.abs(corner[0])<.9&&Math.abs(corner[2])<.9&&corner[1]>-.02&&corner[1]<1.80,
     item.travelerPart+' exceeded the local traveller envelope');
   }
  }
 }
 const posed=T.pose(),out=empty();T.draw(out,{},posed);
 const head=out.round.find(it=>it.travelerPart==='head');
 close(head.p[1]+head.s[1]/2,1.745,.004);
 assert.ok(head.s[0]<.26);assert.ok(head.s[1]<.29);
 const cloak=out.box.filter(it=>it.travelerPart.startsWith('cloak-')&&it.travelerPart!=='cloak-clasp');
 assert.ok(cloak.every(it=>it.p[1]-it.s[1]/2>.75),'the practical cloak finishes above the knee');
});
test('malformed numerical motion inputs cannot poison matrices',()=>{
 const m=T.motion({phase:NaN},sample({x:NaN,z:Infinity,time:NaN}));
 assert.ok([m.phase,m.blend,m.lastX,m.lastZ,m.lastTime,m.time].every(Number.isFinite));
 const p=T.pose({phase:NaN,blend:Infinity,time:NaN,combatProgress:NaN,style:'unknown'}),out=empty();
 const frame=T.draw(out,{x:NaN,z:Infinity,yaw:NaN,base:NaN},p);
 assert.ok(Array.from(frame.root).every(Number.isFinite));assert.ok(all(out).every(it=>Array.from(it.m).every(Number.isFinite)));
});
test('sampling, posing and drawing leave input rules, motion and profiles immutable',()=>{
 const prior=freeze(walk(12)),input=freeze(sample({x:1.12,time:.4,walking:true}));
 const before=JSON.stringify({prior,input});T.motion(prior,input);assert.equal(JSON.stringify({prior,input}),before);
 const options=freeze({phase:.4,blend:.7,time:5,style:'bow',combatScene:true,combatPhase:'anticipate',combatProgress:.8});
 const posed=freeze(T.pose(options));
 const drawInput=freeze({x:4,z:2,yaw:.7,base:1.3,profile:{skin:2,hair:3,cloak:1},color:'#995e74',armorColor:'#756b61'});
 const untouched=JSON.stringify({options,posed,drawInput}),frame=T.draw(empty(),drawInput,posed);
 assert.equal(JSON.stringify({options,posed,drawInput}),untouched);
 frame.joints.rightHand[0]+=4;assert.notDeepEqual(frame.joints.rightHand,posed.joints.rightHand,'frame owns copies of anchors');
});
