'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../src/app.js'),'utf8');
const C=require('../src/core.js');require('../src/creative.js');
const E=require('../src/engine.js');require('../src/world.js');
function fixture(){
 const art=Object.create(global.RealmArt.WorldArt.prototype);art.map={};
 art.building(-11,-6,7.1,5.5,0x875662);
 const engine=Object.create(E.Engine.prototype);engine.cameraSolids=Object.entries(art.map).flatMap(([kind,items])=>items.map(item=>E.solidBounds(kind,item)).filter(Boolean));engine.dynamic=[];
 return engine;
}
function resolve(e,focus,yaw=Math.PI,previous=yaw){return e.resolveCameraOrbit(focus,yaw,.28,7.5,previous);}
function eye(focus,result){const ce=Math.cos(.28);return focus.map((v,i)=>v+[Math.sin(result.yaw)*ce,Math.sin(.28),Math.cos(result.yaw)*ce][i]*result.distance);}
function appFixture(){
 const sim=new C.Simulation();sim.state.player={x:-11,z:-1.6,yaw:0};
 const engine=fixture();engine.canvas={clientWidth:1440,clientHeight:960};
 const camera={preset:'adventure',yaw:Math.PI,elevation:.28,distance:7.5,actualDistance:7.5,center:[-11,2.8,-1.6],fov:60,half:17};
 const at=source.indexOf('function cameraHeading('),end=source.indexOf('function cameraPreset(',at);
 const host={sim,engine,camera,follow:null,sceneHeight:()=>1.3,grazerFocus:()=>null,carrierFocus:()=>null,fieldcraftFocus:()=>null,innerWidth:1440,innerHeight:960};
 vm.createContext(host);vm.runInContext(source.slice(at,end),host);return {...host,update:host.updateCamera,heading:host.cameraHeading};
}

test('actual App resolves the house camera without rewriting orbit preference or any world state',()=>{
 const f=appFixture(),before=JSON.stringify(f.sim.snapshot());
 for(let i=0;i<90;i++)f.update(1/60);
 assert.ok(f.camera.actualDistance>=3.4,'the live caller must not keep the old face-filling boom');
 assert.equal(f.camera.yaw,Math.PI);assert.equal(f.camera.distance,7.5);assert.equal(f.camera.elevation,.28);
 assert.equal(JSON.stringify(f.sim.snapshot()),before);
});
test('every eased camera frame is rechecked against the actual wall, including return to the requested orbit',()=>{
 const f=appFixture();
 for(let i=0;i<180;i++){
  if(i===90){f.sim.state.player.z=4;}
  f.update(1/60);
  assert.ok(f.engine.clearCameraDistance(f.camera.center,f.engine.camera.eye)>=f.camera.actualDistance-.03,'interpolation must not cut a corner through solids');
 }
 assert.ok(Math.abs(f.camera.actualYaw-f.camera.yaw)<.04,'clear space restores requested orientation');
});
test('reduced motion resolves immediately and camera-relative controls use only the displayed perspective heading',()=>{
 const f=appFixture();f.sim.state.settings.reducedMotion=true;f.update(1/60);
 assert.ok(f.camera.actualDistance>=3.4);assert.notEqual(f.camera.actualYaw,f.camera.yaw);
 const at=source.indexOf('function cameraHeading('),end=source.indexOf('function updateCamera(',at);
 const host={camera:f.camera,clearGrazerFocus(){}};vm.createContext(host);vm.runInContext(source.slice(at,end),host);
 assert.equal(host.cameraHeading(),f.camera.actualYaw);
 f.camera.preset='follow';assert.equal(host.cameraHeading(),Math.PI,'orthographic heading ignores prior correction');
 f.camera.preset='adventure';f.camera.tour=true;assert.equal(host.cameraHeading(),Math.PI,'tour uses its own orientation');
});
test('first real pointer drag begins at the visible corrected orbit and keeps subsequent deltas intentional',()=>{
 const camera={preset:'adventure',yaw:Math.PI,actualYaw:1.5,elevation:.28};
 const host={camera,pointers:new Map([[1,{x:0,y:0}]]),gesture:{x:0,y:0,moved:false,pinch:false},sandbox:null,engine:null,clearGrazerFocus(){}};
 vm.createContext(host);
 for(const [name,next] of[['cameraHeading','rotateCamera'],['pointerMove','pointerUp']]){
  const at=source.indexOf('function '+name+'('),end=source.indexOf('function '+next+'(',at);vm.runInContext(source.slice(at,end),host);
 }
 host.pointerMove({pointerId:1,clientX:10,clientY:0});assert.ok(Math.abs(camera.yaw-1.43)<1e-9);
 camera.actualYaw=2;host.pointerMove({pointerId:1,clientX:20,clientY:0});assert.ok(Math.abs(camera.yaw-1.36)<1e-9,'do not reanchor halfway through the same drag');
});
test('leaving an actual tour keeps the displayed heading for movement and drag, not a stale perspective correction',()=>{
 const f=appFixture();f.camera.actualYaw=-2;f.camera.tour=true;f.update(1);
 const shown=Math.atan2(f.engine.camera.eye[0]-f.engine.camera.target[0],f.engine.camera.eye[2]-f.engine.camera.target[2]);
 f.camera.tour=false;
 assert.ok(Math.abs(Math.atan2(Math.sin(f.heading()-shown),Math.cos(f.heading()-shown)))<1e-9);
});
test('clear endpoints around a side wall do not allow a one-frame close-up on the intervening orbit arc',()=>{
 const f=appFixture();Object.assign(f.sim.state.player,{x:0,z:0});Object.assign(f.camera,{center:[0,2.8,0],actualYaw:Math.PI,yaw:0});
 f.engine.cameraSolids=[{min:[1,0,-.4],max:[2,6,.4]}];
 for(let i=0;i<90;i++){
  f.update(1/60);assert.ok(f.camera.actualDistance>=3.4,`readable endpoint must avoid collapsed intermediate frame ${i}`);
  assert.ok(f.engine.clearCameraDistance(f.camera.center,f.engine.camera.eye)>=f.camera.actualDistance-.03);
 }
});

// Removing orbit resolution must restore the actual wall-induced face close-up.
test('supported doorstep and near-wall edge keep a readable, collision-safe perspective distance',()=>{
 const e=fixture();
 for(const z of[-1,-1.6,-2,-2.4,-2.48]){
  assert.ok(C.walkable(-11,z,null,.31));const focus=[-11,2.8,z],r=resolve(e,focus);
  assert.ok(r.distance>=3.4,`doorstep z=${z}: ${JSON.stringify(r)}`);
  assert.ok(e.clearCameraDistance(focus,eye(focus,r))>=r.distance-.03,'resolved ray remains outside padded solids');
 }
});
test('an unobstructed requested view remains exact and returns after leaving the wall',()=>{
 const e=fixture(),focus=[-11,2.8,3],r=resolve(e,focus,0,Math.PI/2);
 assert.equal(r.yaw,0);assert.ok(Math.abs(r.distance-7.5)<1e-9);
});
test('retains the current clear side under small doorway movements instead of alternating orbit sides',()=>{
 const e=fixture(),first=resolve(e,[-11,2.8,-1.6]);
 for(const x of[-11.02,-10.98,-11.01]){
  const r=resolve(e,[x,2.8,-1.6],Math.PI,first.yaw);
  assert.equal(r.yaw,first.yaw);assert.ok(r.distance>=3.4);
 }
});
test('an enclosed focus retains the inherited short fallback and never claims readable clearance',()=>{
 const e=fixture();e.cameraSolids=[{min:[-2,0,-2],max:[2,6,2]}];
 const r=resolve(e,[0,2,0],.4);
 assert.equal(r.yaw,.4);assert.equal(r.distance,.45);
});
test('opted-in dynamic walls take part in the same camera correction',()=>{
 const e=fixture();e.cameraSolids=[];e.dynamic=[{cameraSolids:[{min:[-4,0,1],max:[4,6,2]}]}];
 const r=resolve(e,[0,2.8,0],0);
 assert.ok(r.distance>=3.4);assert.notEqual(r.yaw,0);
});
