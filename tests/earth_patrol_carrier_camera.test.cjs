/* CPU host-protocol checks compile unchanged App functions. Real Core/kit
 * authority runs; renderer, DOM and saver are explicit observers. This does
 * not qualify native pixels, camera comfort or persistent profile writes. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),E=require('../src/earth-expedition.js'),Engine=require('../src/engine.js');
const P=require('../src/earth-patrol-carrier.js'),ART=require('../src/earth-patrol-carrier-art.js'),source=fs.readFileSync(require.resolve('../src/app.js'),'utf8');
const A=require('../src/adventure.js'),Combat=require('../src/combat.js'),CombatView=require('../src/combat-view.js');
function actual(name){const start=source.indexOf('\nfunction '+name+'(')+1;assert.ok(start>0,name);const end=source.indexOf('\nfunction ',start);return source.slice(start,end<0?source.length:end);}
const zoomStart=source.indexOf('function zoom('),zoomSource=source.slice(zoomStart,source.indexOf('\n',zoomStart));assert.ok(zoomStart>0);
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
 let sim=initial,engine={cameraSolids:[],dynamic:[],clearCameraDistance:Engine.Engine.prototype.clearCameraDistance},fieldcraftOwner=null,fieldcraftFrame={},carrierFrame=null,carrierInspectionView=null,follow='old',innerWidth=1440,innerHeight=960;
 const characterStore=store,rpg={expedition:{reset:r=>observed.resets.push(r)},cameraPaint:()=>{}},$=()=>null;
 const worldContext=()=>({sim,active:store.active,revision:store.revision});
 const clearGrazerFocus=()=>{observed.grazerClears++;};
 const updateCamera=()=>{observed.renders++;};
 const save=()=>{observed.saves++;return{ok:true};};
 const cameraHalf=()=>17;
 ${['syncFieldcraftOwner','fieldcraftContext','clearCarrierFocus','fitCarrierReceiving','carrierFocus','frameCarrier','fitCameraHalf','rememberCamera','cameraPreset','frameFoe'].map(actual).join('\n')}
 ${zoomSource}
 return {context:fieldcraftContext,focus:carrierFocus,frame:frameCarrier,preset:cameraPreset,
 forceOwner:()=>syncFieldcraftOwner(true),disableEngine:()=>{engine=null;},
 frameState:()=>carrierFrame,replaceSim:s=>{sim=s;},remember:rememberCamera,zoom,foe:frameFoe,
 viewport:(w,h)=>{innerWidth=w;innerHeight=h;},solids:boxes=>{engine.cameraSolids=boxes;},obstruct:()=>{engine.cameraSolids=[{min:[-70,1,-6],max:[-67,4,-3]}];}};
 `,['initial','camera','store','observed'],{contextExtensions:[{RealmEarthPatrolCarrier:P,RealmEarthPatrolCarrierArt:ART,RealmEarthExpedition:E,RealmCombat:Combat,RealmCombatView:CombatView,Engine,C}]})(sim,camera,store,observed);
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

function paidFixture(preset='adventure',fov=70){
 const f=fixture(preset,fov);let view=f.view,ticket;
 while(view.activePiece){const r=view.receivers.find(r=>r.pieceId===view.activePiece);assert.ok(P.inspect(f.host.context(),f.plan,r.pieceId,r.id).ok);assert.ok(P.adjust(f.host.context(),f.plan,{pieceId:r.pieceId,receiverId:r.id,...r.target}).ok);const n=P.seat(f.host.context(),f.plan,r.pieceId);assert.ok(n.ok);view=n.view;ticket=n.ticket;}
 const save=()=>({ok:true});assert.ok(E.command(f.host.context(),'patrol-step',{quest:E.patrol.id,run:1,priorClaim:0,step:'inspect-glade',carrierTicket:ticket},{save}).ok);
 f.sim.state.player={x:-67,z:-4,yaw:0};assert.ok(E.command(f.host.context(),'patrol-claim',{quest:E.patrol.id,run:1,priorClaim:0},{save}).ok);return f;
}
test('distinct receiving Look frames paid bodies in both views without changing profile or payment',()=>{
 for(const preset of['follow','adventure'])for(const fov of[45,70,80]){
  const f=paidFixture(preset,fov),before=f.sim.snapshot(),initial={...f.camera};
  assert.ok(f.host.frame(P.current(f.sim),'receiving').ok);assert.equal(f.camera.preset,preset);assert.equal(f.camera.fov,fov);assert.deepEqual(f.camera.center,[-68.65,2.03,-4.85]);
  assert.deepEqual(f.host.focus(),f.camera.center);assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.observed.saves,0);
  if(preset==='follow'){assert.ok(f.camera.half<3);assert.equal(f.camera.zoom,initial.zoom);}else assert.ok(f.camera.distance>=3.5&&f.camera.distance<4);
  f.sim.state.player.x+=.16;assert.equal(f.host.focus(),null);assert.equal(f.camera.half,initial.half);assert.equal(f.camera.distance,initial.distance);assert.equal(P.current(f.sim).status,'paid');
 }
});

test('actual renderer projection contains all receiving corners on desktop/portrait and FOV bounds',()=>{
 for(const [width,height]of[[1440,960],[390,844]])for(const preset of['follow','adventure'])for(const fov of[45,60,80]){
  const f=paidFixture(preset,fov);f.host.viewport(width,height);assert.ok(f.host.frame(P.current(f.sim),'receiving').ok);
  const c=f.camera,ce=Math.cos(c.elevation),d=preset==='adventure'?c.actualDistance:75,eye=c.center.map((v,i)=>v+[Math.sin(c.yaw)*ce,Math.sin(c.elevation),Math.cos(c.yaw)*ce][i]*d);
  const renderer={camera:{},canvas:{clientWidth:width,clientHeight:height}};Engine.Engine.prototype.setCamera.call(renderer,{eye,target:c.center,projection:preset==='adventure'?'perspective':'orthographic',fov,half:c.half,aspect:width/height});
  const corners=ART.receivingFrame(f.sim.state.earthExpedition,P.current(f.sim)).corners,points=corners.map(p=>Engine.Engine.prototype.project.call(renderer,...p));
  assert.ok(points.every(p=>p.visible&&p.x>width*.12&&p.x<width*.88&&p.y>height*.17&&p.y<height*.83),JSON.stringify({preset,fov,width,points}));
  assert.ok(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))>90,'actual kit readable span, not a distant group pixel count');
 }
});
test('receiving refusals are atomic and releases preserve private payment and user camera edits',()=>{
 for(const condition of['copy','foreign','range','water','death','engine','obstruction','width','fov']){
  const f=paidFixture(),other=paidFixture(),view=condition==='copy'?JSON.parse(JSON.stringify(P.current(f.sim))):condition==='foreign'?P.current(other.sim):P.current(f.sim);
  if(condition==='range')f.sim.state.player.x+=5;if(condition==='water')f.sim.worldDive={};if(condition==='death')f.sim.state.adventure.hp=0;if(condition==='engine')f.host.disableEngine();if(condition==='obstruction')f.host.obstruct();if(condition==='width')f.host.viewport(0,960);if(condition==='fov')f.camera.fov=NaN;
  const before=JSON.stringify(f.camera),world=f.sim.snapshot();assert.equal(f.host.frame(view,'receiving').ok,false,condition);assert.equal(JSON.stringify(f.camera),before);assert.deepEqual(f.sim.snapshot(),world);assert.equal(f.observed.renders,0);assert.equal(f.observed.saves,0);
 }
 for(const condition of['orbit','elevation','viewport','fov','new-run','owner','view']){
  const f=paidFixture('follow');f.camera.ready=true;f.camera.tour=false;const before={...f.camera};assert.ok(f.host.frame(P.current(f.sim),'receiving').ok);f.host.remember();
  assert.deepEqual(f.sim.state.settings.cameraViews.profiles.follow,{yaw:((before.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2),elevation:before.elevation,zoom:before.zoom});
  if(condition==='orbit')f.camera.yaw+=.1;if(condition==='elevation')f.camera.elevation+=.1;if(condition==='viewport')f.host.viewport(390,844);if(condition==='fov')f.camera.fov=60;if(condition==='owner')f.host.forceOwner();if(condition==='view')f.host.preset('adventure');
  if(condition==='new-run')assert.ok(E.command(f.host.context(),'patrol-accept',{quest:E.patrol.id,run:2,priorClaim:1},{save:()=>({ok:true})}).ok);
  assert.equal(f.host.focus(),null,condition);if(condition!=='view')assert.equal(f.camera.half,17);if(condition==='orbit')assert.ok(Math.abs(f.camera.yaw-2.2)<1e-9);if(condition==='elevation')assert.ok(Math.abs(f.camera.elevation-.82)<1e-9);
  if(!['owner','new-run'].includes(condition))assert.equal(P.current(f.sim).status,'paid');
 }
});

test('actual wheel/pinch zoom releases receiving inspection before applying ordinary user scale',()=>{
 for(const preset of['follow','adventure']){const f=paidFixture(preset),before=f.sim.snapshot();assert.ok(f.host.frame(P.current(f.sim),'receiving').ok);f.host.zoom(1.1);
  assert.equal(f.host.focus(),null);if(preset==='follow'){assert.ok(Math.abs(f.camera.half-18.7)<1e-9);assert.ok(Math.abs(f.camera.zoom-1.1)<1e-9);}else assert.ok(Math.abs(f.camera.distance-9.9)<1e-9);
  assert.equal(P.current(f.sim).status,'paid');assert.deepEqual(f.sim.snapshot(),before);
 }
});

test('repeated receiving inspection and cold Adventure release retain original valid preferences',()=>{
 for(const preset of['follow','adventure']){const f=paidFixture(preset);if(preset==='adventure'){delete f.camera.baseHalf;delete f.camera.zoom;}const before={...f.camera};
  for(let n=0;n<2;n++)assert.ok(f.host.frame(P.current(f.sim),'receiving').ok);f.sim.state.player.z+=.16;assert.equal(f.host.focus(),null);
  for(const axis of['half','yaw','elevation','distance','zoom','baseHalf'])assert.equal(f.camera[axis],before[axis],axis);assert.ok(Number.isFinite(f.camera.half));assert.equal(P.current(f.sim).status,'paid');
 }
});

test('receiving perspective fit clears actual canonical Earth scenery in desktop and portrait',()=>{
 require('../src/coastward-settlement-art.js');require('../src/coastward-woodland-art.js');require('../src/elderweald-trail-art.js');require('../src/earth-road.js');require('../src/earth-road-art.js');require('../src/earth-grazer-motion.js');require('../src/earth-grazer-habitat-art.js');
 const WorldArt=require('../src/world-foundations-art.js');
 for(const [width,height]of[[1440,960],[390,844]])for(const fov of[45,60,80]){
  const f=paidFixture('adventure',fov),models=[],writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,d,c,opt={}){models.push({kind,p:[x,y,z],s:[w,h,d],c,...opt});},box(...args){this.add('box',...args);}};
  WorldArt.make(writer,f.sim);const solids=models.map(p=>Engine.solidBounds(p.kind,p)).filter(Boolean);assert.ok(solids.length>0,'canonical scenery is present');f.host.solids(solids);f.host.viewport(width,height);
  const before=f.sim.snapshot(),result=f.host.frame(P.current(f.sim),'receiving');assert.ok(result.ok,result.error);assert.deepEqual(f.sim.snapshot(),before);assert.equal(P.current(f.sim).status,'paid');
 }
});

test('actual competing foe frame retains ordinary user distance and refusal retains held inspection',()=>{
 const f=paidFixture();f.camera.distance=f.camera.actualDistance=20;assert.ok(f.host.frame(P.current(f.sim),'receiving').ok);const held=JSON.stringify(f.camera),frame=f.host.frameState();assert.equal(f.host.foe().ok,false);assert.equal(JSON.stringify(f.camera),held);assert.equal(f.host.frameState(),frame);
 // Labelled runtime-only target, selected through actual Combat; no encounter/reward claim.
 const e={id:'synthetic-inspection-camera-target',hp:10,x:f.sim.state.player.x+2,z:f.sim.state.player.z};A.runtime(f.sim).enemies.push(e);Combat.runtime(f.sim).target=e.id;
 const expected=CombatView.plan({preset:'adventure',player:f.sim.state.player,enemy:e,distance:20});assert.ok(expected.ok);assert.ok(f.host.foe().ok);assert.equal(f.camera.distance,expected.view.distance);assert.equal(f.host.focus(),null);assert.equal(P.current(f.sim).status,'paid');
});
