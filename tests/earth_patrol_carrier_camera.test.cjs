/* CPU host-protocol checks compile unchanged App functions. Real Core/kit
 * authority runs; renderer, DOM and saver are explicit observers. This does
 * not qualify native pixels, camera comfort or persistent profile writes. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),E=require('../src/earth-expedition.js');require('../src/engine.js');
const P=require('../src/earth-patrol-carrier.js'),source=fs.readFileSync(require.resolve('../src/app.js'),'utf8');
function actual(name){const start=source.indexOf('\nfunction '+name+'(')+1;assert.ok(start>0,name);const end=source.indexOf('\nfunction ',start);return source.slice(start,end<0?source.length:end);}
function fixture(preset='adventure',fov=70){
 const sim=new C.Simulation();sim.state.adventure.started=true;
 sim.state.earthExpedition.story={accepted:true,branch:'managed-coppice',steps:E.definition.steps.map(s=>s.id),claimed:true};
 sim.state.earthExpedition.patrol.active={run:1,steps:E.patrol.steps.slice(0,4).map(s=>s.id)};
 sim.returnPos={...sim.state.player};sim.room='world-earthlands';sim.state.player={x:-106,z:-105,yaw:0};
 sim.worldTrip={active:'synthetic-camera-owner',realm:'earthlands',home:{...sim.returnPos}};
 const camera={preset,fov,baseHalf:17,zoom:1,half:17,distance:9,actualDistance:9,yaw:.4,elevation:.3,center:[0,0,0],tour:true,overview:true};
 const observed={renders:0,saves:0,resets:[],grazerClears:0},store={active:'synthetic-camera-owner',revision:4};
 // Same JS realm preserves the opaque plain-object lease. These observers
 // replace only the host transport, never fitting or projection authority.
 const host=vm.compileFunction(`
 let sim=initial,engine={},fieldcraftOwner=null,fieldcraftFrame={},carrierFrame=null,follow='old';
 const characterStore=store,rpg={expedition:{reset:r=>observed.resets.push(r)},cameraPaint:()=>{}},$=()=>null;
 const worldContext=()=>({sim,active:store.active,revision:store.revision});
 const clearGrazerFocus=()=>{observed.grazerClears++;};
 const updateCamera=()=>{observed.renders++;};
 const save=()=>{observed.saves++;return{ok:true};};
 const rememberCamera=()=>{},cameraHalf=()=>17;
 ${['syncFieldcraftOwner','fieldcraftContext','carrierFocus','frameCarrier','fitCameraHalf','cameraPreset'].map(actual).join('\n')}
 return {context:fieldcraftContext,focus:carrierFocus,frame:frameCarrier,preset:cameraPreset,
 forceOwner:()=>syncFieldcraftOwner(true),disableEngine:()=>{engine=null;},
 frameState:()=>carrierFrame,replaceSim:s=>{sim=s;}};
 `,['initial','camera','store','observed'],{contextExtensions:[{RealmEarthPatrolCarrier:P,RealmEarthExpedition:E}]})(sim,camera,store,observed);
 const ctx=host.context(),opened=P.begin(ctx);assert.ok(opened.ok,opened.error);
 return{sim,camera,observed,store,host,plan:opened.plan,view:opened.view};
}
test('actual App Look retains chosen preset and FOV and frames the authorized tray',()=>{
 for(const preset of['follow','adventure'])for(const fov of[45,70,80]){
  const f=fixture(preset,fov),before=JSON.stringify(f.sim.snapshot());
  assert.ok(f.host.frame(f.view).ok);assert.equal(f.camera.preset,preset);assert.equal(f.camera.fov,fov);
  assert.deepEqual(f.camera.center,[-104.8,2.24,-104.2]);assert.deepEqual(f.host.focus(),f.camera.center);
  assert.equal(f.camera.tour,false);assert.equal(f.camera.overview,false);assert.equal(f.observed.saves,1);assert.equal(f.observed.renders,1);
  assert.equal(JSON.stringify(f.sim.snapshot()),before);assert.equal(P.current(f.sim).status,'fitting');
  if(preset==='follow')assert.equal(f.camera.half,6);else assert.equal(f.camera.distance,4);
 }
});
test('copied foreign out-of-range and engine-less Look refuses before any host mutation',()=>{
 for(const condition of['copied','foreign','range','engine']){
  const f=fixture(),other=fixture(),view=condition==='copied'?JSON.parse(JSON.stringify(f.view)):condition==='foreign'?other.view:f.view;
  if(condition==='range')f.sim.state.player.x+=12;if(condition==='engine')f.host.disableEngine();
  const before=JSON.stringify(f.camera);assert.equal(f.host.frame(view).ok,false);
  assert.equal(JSON.stringify(f.camera),before);assert.equal(f.observed.saves,0);assert.equal(f.observed.renders,0);assert.equal(f.host.frameState(),null);
 }
});
test('movement orbit and elevation release actual App focus without cancelling transient fitting',()=>{
 for(const change of[f=>f.sim.state.player.x+=.16,f=>f.camera.yaw+=.01,f=>f.camera.elevation+=.01]){
  const f=fixture();assert.ok(f.host.frame(f.view).ok);change(f);assert.equal(f.host.focus(),null);assert.equal(f.host.frameState(),null);assert.ok(P.current(f.sim));
 }
});
test('actual view control clears focus and uses the selected saved camera profile',()=>{
 const f=fixture();assert.ok(f.host.frame(f.view).ok);f.sim.state.settings.cameraViews.profiles.follow={yaw:.9,elevation:.7,zoom:1.5};
 f.host.preset('follow');assert.equal(f.host.focus(),null);assert.equal(f.host.frameState(),null);assert.equal(f.camera.preset,'follow');assert.equal(f.camera.yaw,.9);assert.equal(f.camera.half,25.5);assert.ok(P.current(f.sim));
});
test('actual owner refresh, death, travel and character changes revoke camera and private kit',()=>{
 for(const change of[f=>f.host.forceOwner(),f=>f.sim.state.adventure.deaths++,f=>f.sim.room='world-atlantis',f=>f.store.active='another-owner']){
  const f=fixture();assert.ok(f.host.frame(f.view).ok);change(f);assert.equal(f.host.focus(),null);assert.equal(f.host.frameState(),null);assert.equal(P.current(f.sim),null);assert.ok(f.observed.resets.length>=2);
 }
});
test('recorded kit remains frameable at glade but paid kit refuses an old tray Look',()=>{
 const f=fixture();let view=f.view,ticket;
 while(view.activePiece){const p=view.activePiece,r=view.receivers.find(r=>r.pieceId===p);assert.ok(P.inspect(f.host.context(),f.plan,p,r.id).ok);assert.ok(P.adjust(f.host.context(),f.plan,{pieceId:p,receiverId:r.id,...r.target}).ok);const result=P.seat(f.host.context(),f.plan,p);assert.ok(result.ok);view=result.view;ticket=result.ticket;}
 const save=()=>({ok:true});assert.ok(E.command(f.host.context(),'patrol-step',{quest:E.patrol.id,run:1,priorClaim:0,step:'inspect-glade',carrierTicket:ticket},{save}).ok);
 assert.ok(f.host.frame(P.current(f.sim)).ok);f.sim.state.player={x:E.patrol.giver.x,z:E.patrol.giver.z,yaw:0};
 assert.ok(E.command(f.host.context(),'patrol-claim',{quest:E.patrol.id,run:1,priorClaim:0},{save}).ok);const paid=P.current(f.sim);assert.equal(paid.status,'paid');
 f.sim.state.player={x:-106,z:-105,yaw:0};const before=JSON.stringify(f.camera),writes=f.observed.saves;assert.equal(f.host.frame(paid).ok,false);assert.equal(JSON.stringify(f.camera),before);assert.equal(f.observed.saves,writes);
});
