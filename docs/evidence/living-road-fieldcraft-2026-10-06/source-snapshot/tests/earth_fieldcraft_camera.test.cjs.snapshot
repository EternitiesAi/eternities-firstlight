/* Actual app framing and renderer collision math against canonical scene
 * submission. Prefix histories/DOM/GL callbacks are labelled CPU fixtures;
 * real pixel/control/native-profile checks remain in the browser suite. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),W=require('../src/world-foundations.js'),E=require('../src/earth-expedition.js'),Engine=require('../src/engine.js');
require('../src/coastward-settlement-art.js');require('../src/coastward-woodland-art.js');require('../src/elderweald-trail-art.js');require('../src/earth-road.js');require('../src/earth-road-art.js');
const Art=require('../src/world-foundations-art.js');
const source=fs.readFileSync(require.resolve('../src/app.js'),'utf8');
function literal(name,next){const start=source.indexOf('function '+name+'('),end=source.indexOf('function '+next+'(',start);assert.ok(start>=0&&end>start);return source.slice(start,end);}
function fixture(mode='adventure',width=1440,height=960){
 const sim=new C.Simulation(),home={...sim.state.player},a=sim.state.adventure;a.started=true;
 sim.room='world-earthlands';sim.returnPos=home;sim.worldTrip={active:'cpu-character',realm:'earthlands',home:{...home}};sim.state.player={x:-145,z:-84,yaw:0};
 sim.state.earthExpedition.story={accepted:true,branch:'managed-coppice',steps:E.definition.steps.slice(0,6).map(s=>s.id),claimed:false};
 const models=[],writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,d,c,opt={}){models.push({kind,p:[x,y,z],s:[w,h,d],c,...opt});},box(...args){this.add('box',...args);}};Art.make(writer,sim);
 const cameraSolids=models.map(p=>Engine.solidBounds(p.kind,p)).filter(Boolean),engine={cameraSolids,dynamic:[],clearCameraDistance:Engine.Engine.prototype.clearCameraDistance};
 const context={sim,characterStore:{active:'cpu-character',revision:1},rpg:{expedition:{reset(){} }},RealmCore:C,RealmWorldFoundations:W,RealmEarthExpedition:E,
  innerWidth:width,innerHeight:height,engine,camera:{preset:mode,ready:true,baseHalf:mode==='wide'?140:17,tour:false,yaw:0,elevation:.8,distance:7.5,actualDistance:7.5,half:17,fov:60},follow:null,
  worldSave:()=>({ok:false,error:'CPU fixture never writes disk'}),earthHomecomingWriter:()=>()=>({ok:false}),save(){context.characterStore.revision++;},
  updateCamera(){const c=context.camera,ce=Math.cos(c.elevation),wanted=c.center.map((v,i)=>v+[Math.sin(c.yaw)*ce,Math.sin(c.elevation),Math.cos(c.yaw)*ce][i]*c.distance);c.actualDistance=engine.clearCameraDistance(c.center,wanted);}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../src/earth-fieldcraft.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(require.resolve('../src/earth-fieldcraft-art.js'),'utf8'),context);
 vm.runInContext(source.slice(source.indexOf('let fieldcraftOwner='),source.indexOf('function worldTravel('))+'\n'+literal('fitCameraHalf','rememberCamera'),context);
 context.ctx=context.fieldcraftContext();const begun=context.RealmEarthFieldcraft.begin(context.ctx);assert.ok(begun.ok,begun.error);
 return{...context,context,models,plan:begun.plan};
}
test('actual third-person Look clears canonical padded wall/cap and preserves current branded view',()=>{
 const f=fixture(),F=f.context.RealmEarthFieldcraft,view=F.projection(f.plan),before=f.sim.snapshot();
 assert.notStrictEqual(view,F.current(f.sim),'current makes a fresh branded projection; object equality is not authority');
 const result=f.context.frameFieldcraft(view);assert.ok(result.ok,result.error);assert.equal(f.camera.preset,'adventure');assert.equal(f.camera.distance,10);assert.ok(Math.abs(f.camera.actualDistance-10)<1e-9);
 assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.context.fieldcraftFocus()[0],-142.294);
 const bad=[-143.144,2.765,-75],eye=[bad[0]+Math.cos(.3)*10,bad[1]+Math.sin(.3)*10,bad[2]];
 assert.equal(f.engine.clearCameraDistance(bad,eye),.45,'original near-wall focus is a real negative collision control');
 const raw=C.fresh();raw.settings.cameraViews={version:1,lastDiorama:'follow',profiles:{adventure:{yaw:f.camera.yaw,elevation:f.camera.elevation,distance:f.camera.distance}}};assert.ok(C.validate(raw).settings.cameraViews.profiles.adventure);
});
test('diorama and wide framing stay inside actual saved camera-profile bounds',()=>{
 for(const mode of ['follow','tactical','wide']){const f=fixture(mode),F=f.context.RealmEarthFieldcraft;assert.ok(f.context.frameFieldcraft(F.projection(f.plan)).ok);assert.equal(f.camera.preset,mode);assert.ok(f.camera.half>=6);
  const profiles={version:1,lastDiorama:mode,profiles:{[mode]:{yaw:f.camera.yaw,elevation:f.camera.elevation,zoom:f.camera.zoom}}},raw=C.fresh();raw.settings.cameraViews=profiles;assert.deepEqual(JSON.parse(JSON.stringify(C.validate(raw).settings.cameraViews.profiles[mode])),profiles.profiles[mode],'actual validator retains deliberate frame');
 }
});
test('desktop and portrait framing contain actual member corners and five receiving sockets',()=>{
 for(const [width,height] of [[1440,960],[390,844]])for(const mode of ['adventure','follow'])for(const fov of [45,60,80]){
  const f=fixture(mode,width,height),F=f.context.RealmEarthFieldcraft;
  f.camera.fov=fov;
  for(const pose of [{yaw:.21,pitch:0},{yaw:F.GEOMETRY.targetYaw,pitch:F.GEOMETRY.targetPitch}]){
   assert.ok(F.adjust(f.context.fieldcraftContext(),f.plan,pose).ok);const view=F.projection(f.plan);assert.ok(f.context.frameFieldcraft(view).ok);
   const c=f.camera,ce=Math.cos(c.elevation),eye=c.center.map((v,i)=>v+[Math.sin(c.yaw)*ce,Math.sin(c.elevation),Math.cos(c.yaw)*ce][i]*c.actualDistance);
   const renderer={camera:{},canvas:{clientWidth:width,clientHeight:height}};
   Engine.Engine.prototype.setCamera.call(renderer,{eye,target:c.center,projection:mode==='adventure'?'perspective':'orthographic',fov:c.fov,half:c.half,aspect:width/height});
   const points=F.GEOMETRY.receivers.map(r=>r.point.slice());
   for(const part of f.context.RealmEarthFieldcraftArt.parts(f.sim.state.earthExpedition,view).filter(p=>p.opt.fieldcraftPart==='preview-section')){
    const m=part.opt.m;for(const x of[-.5,.5])for(const y of[-.5,.5])for(const z of[-.5,.5])points.push([m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]]);
   }
   for(const p of points){const q=Engine.Engine.prototype.project.call(renderer,...p);assert.ok(q.visible&&q.x>8&&q.x<width-8&&q.y>8&&q.y<height-120,`${mode} ${width} ${JSON.stringify(q)}`);}
   assert.ok(c.actualDistance>=3.5&&c.actualDistance<=20);assert.equal(c.fov,fov,'framing preserves the chosen FOV');
  }
 }
});
test('actual framing rejects cloned/expired authority and unrelated recorded-looking characters',()=>{
 const f=fixture(),F=f.context.RealmEarthFieldcraft,view=F.projection(f.plan),before=JSON.stringify(f.camera);assert.equal(f.context.frameFieldcraft(JSON.parse(JSON.stringify(view))).ok,false);assert.equal(JSON.stringify(f.camera),before);
 f.context.syncFieldcraftOwner(true);assert.equal(f.context.frameFieldcraft(view).ok,false);assert.equal(f.context.frameFieldcraft(null).ok,false);
});
test('actual movement/owner synchronization releases framing while synthetic raw revision observations preserve it',()=>{
 const f=fixture(),F=f.context.RealmEarthFieldcraft;assert.ok(f.context.frameFieldcraft(F.projection(f.plan)).ok);const lease=f.sim.fieldcraftOwnerLease;f.context.characterStore.revision+=5;assert.equal(f.context.fieldcraftContext().ownerLease,lease);assert.ok(f.context.fieldcraftFocus());
 f.sim.state.player.x+=.2;assert.equal(f.context.fieldcraftFocus(),null);assert.ok(F.current(f.sim),'walking within support does not fabricate an ownership change');
 f.context.syncFieldcraftOwner(true);assert.equal(F.current(f.sim),null,'actual lifecycle invalidates even identical world bytes');
});
