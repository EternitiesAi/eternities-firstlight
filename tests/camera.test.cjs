'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Engine,M,reflectionVP,solidBounds}=require('../src/engine.js');
const C=require('../src/core.js');
const near=(a,b,eps=1e-4)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
function camera(yaw=.5,fov=60,aspect=16/9,projection='perspective'){
 const e=Object.create(Engine.prototype);e.canvas={clientWidth:960*aspect,clientHeight:960};
 e.setCamera({eye:[Math.sin(yaw)*8,4.5,Math.cos(yaw)*8],target:[0,2.4,0],projection,fov,half:17,aspect});return e;
}
test('perspective has depth and the requested vertical field of view',()=>{
 const p=M.perspective(60*Math.PI/180,16/9,.1,420);
 near(M.transform(p,[0,Math.tan(Math.PI/6)*10,-10])[1],1);
 near(M.transform(p,[2,0,-5])[0]/M.transform(p,[2,0,-10])[0],2);
 near(M.transform(p,[0,0,-.1])[2],-1);near(M.transform(p,[0,0,-420])[2],1);
});
test('production picking inverts ground projection across orbit, FOV and aspect',()=>{
 for(const mode of ['perspective','orthographic'])for(const yaw of [0,.7,2.3,5.8])for(const fov of [45,60,80])for(const aspect of [9/16,16/9,21/9]){
  const e=camera(yaw,fov,aspect,mode);
  for(const q of [[0,1.3,0],[2,1.3,-1],[-2,1.58,-2]]){const s=e.project(...q),p=e.groundAt(s.x,s.y,q[1]);assert.ok(p);near(p.x,q[0]);near(p.z,q[2]);}
 }
});
test('perspective sky and behind-camera points never become movement destinations',()=>{
 const e=camera(0);assert.equal(e.groundAt(800,0,1.3),null);assert.equal(e.project(0,6,20).visible,false);
 for(const input of [[NaN,2],[2,Infinity]])assert.equal(e.groundAt(...input),null);
});
test('obstruction sweep pulls in before a wall, ignores a clear ray and handles a grazing near plane',()=>{
 const e=camera(0);e.cameraSolids=[{min:[-.6,0,3],max:[.6,8,4]}];
 near(e.clearCameraDistance([0,2,0],[0,2,8]),2.68);
 near(e.clearCameraDistance([2,2,0],[2,2,8]),8);
 assert.ok(e.clearCameraDistance([.85,2,0],[.85,2,8])<3);
 e.cameraSolids=[];near(e.clearCameraDistance([0,2,0],[0,2,8]),8);
});
test('perspective water reflection retains contact UV and actual world mirror',()=>{
 const e=camera(.8);for(const p of [[-2,.01,0],[2,.01,-8]])M.transform(reflectionVP(e.vp),p).forEach((v,i)=>near(v,M.transform(e.vp,p)[i]));
 const p=[1,3,-5];M.transform(reflectionVP(e.vp),p).forEach((v,i)=>near(v,M.transform(e.vp,[1,.02-3,-5])[i]));
});
test('presentation preferences roundtrip without modifying old progression or creative state',()=>{
 const s=C.fresh();s.settings.cameraMode='tactical';s.settings.cameraFov=78;
 const after=C.validate(s);assert.deepEqual(after,s);
 delete s.settings.cameraMode;delete s.settings.cameraFov;
 const migrated=C.validate(s);assert.equal(migrated.settings.cameraMode,'adventure');assert.equal(migrated.settings.cameraFov,60);
 delete migrated.settings.cameraMode;delete migrated.settings.cameraFov;assert.deepEqual(migrated,s);
 for(const f of [null,'70',0,Infinity,81]){s.settings.cameraFov=f;s.settings.cameraMode='bad';const v=C.validate(s);assert.equal(v.settings.cameraFov,60);assert.equal(v.settings.cameraMode,'adventure');}
});
test('clearance bounds preserve rotated wall extents and explicitly exclude foliage and low ground',()=>{
 const item={p:[3,2,5],s:[4,2,.2],r:[0,Math.PI/2,0]};const b=solidBounds('box',item);
 near(b.min[0],2.9);near(b.max[0],3.1);near(b.min[2],3);near(b.max[2],7);
 assert.equal(solidBounds('box',{...item,cameraSolid:false}),null);
 assert.equal(solidBounds('round',{...item,wind:2}),null);
 assert.equal(solidBounds('box',{p:[0,.5,0],s:[100,1,100]}),null);
});
test('clearance sees opted-in dynamic construction and keeps actor batches out',()=>{
 const e=camera(0);e.cameraSolids=[];e.dynamic=[{cameraSolids:[solidBounds('box',{p:[0,2,4],s:[2,3,.2],cameraSolid:true})]}];
 assert.ok(e.clearCameraDistance([0,2,0],[0,2,8])<3.9);
 e.dynamic=[{items:[{p:[0,2,1],s:[.5,1.5,.5]}]}];near(e.clearCameraDistance([0,2,0],[0,2,8]),8);
});
test('explicit realm walls keep camera clearance below the legacy floor cutoff',()=>{
 const wall={p:[8,-1.1,-37.38],s:[7,3.2,.24],cameraSolid:true,worldSolid:true};
 const bounds=solidBounds('box',wall);assert.ok(bounds);near(bounds.min[1],-2.7);near(bounds.max[1],.5);
 const e=camera(0);e.cameraSolids=[bounds];e.dynamic=[];
 assert.ok(e.clearCameraDistance([8,-1.2,-34],[8,-1.2,-40])<3.1,'underwater wall limits the actual camera ray');
 assert.equal(solidBounds('box',{...wall,worldSolid:false}),null,'legacy low decoration keeps its existing contract');
});
