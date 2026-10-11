'use strict';
/* CPU boundary regressions, never native pixels or earned prerequisites.
 * Actual installed Core/Motion/App frame code executes against a labelled
 * synthetic prior-paid world. The GPU fixture exercises the real probe JS;
 * its pixel values certify only snapshot/call ordering and refusal behavior. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const DRIVER=path.resolve(process.env.FIRSTLIGHT_WILD_SIGNS_DRIVER||path.join(ROOT,'tools/earth_wild_signs_browser.py'));
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js'));
const X=require(path.join(ROOT,'src/earth-expedition.js')),CD=require(path.join(ROOT,'src/earth-consignment-data.js'));
const D=require(path.join(ROOT,'src/earth-wild-signs-data.js')),O=require(path.join(ROOT,'src/earth-grazer-motion.js'));
const E=require(path.join(ROOT,'src/engine.js')),CH=require(path.join(ROOT,'src/characters.js'));
const R=require(path.join(ROOT,'src/earth-roadkeeper-motion.js'));
const copy=v=>JSON.parse(JSON.stringify(v));
const app=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8');
function section(begin,end){const a=app.indexOf(begin),b=app.indexOf(end,a);assert.ok(a>=0&&b>a);return app.slice(a,b);}
function appFixture(){
 const raw=C.fresh();raw.adventure.started=true;raw.player={x:W.GATE.x,z:W.GATE.z,yaw:0};
 raw.earthExpedition={version:1,story:{accepted:true,branch:'stormfall-recovery',steps:X.definition.steps.map(s=>s.id),claimed:true},patrol:{lastClaim:0,active:null}};
 raw.localLife.records[CD.ID]={accepted:true,choice:'south-stormfall',steps:CD.required('south-stormfall').slice(),claimed:true};
 raw.earthWildSigns={...D.fresh(),accepted:true,evidence:['timber-gouge','feeding-track']};
 const saved=new Map([[CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:C.validate(raw)}]})]]);
 const store=new CH.Store({getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)}),loaded=store.load();assert.equal(loaded.status,'loaded');store.writer=true;
 const sim=new C.Simulation(loaded.state),base=()=>({sim,active:store.active,revision:store.revision});
 const trip=W.preview(base(),'earthlands');assert.ok(trip.ok,trip.error);assert.ok(W.enter(trip.ticket,base(),{save:v=>store.save(v),build(){}}).ok);
 sim.state.player={x:D.overlook.x,z:D.overlook.z,yaw:0};sim.grazerOwnerLease=Object.freeze({});sim.wildSignsOwnerLease=Object.freeze({});
 const context=()=>({...base(),ownerLease:sim.grazerOwnerLease});assert.ok(O.begin(context()).ok);
 for(let n=0;n<500&&O.current(context()).phase!=='walk';n++){sim.tick(.1);assert.ok(O.tick(context(),.1).ok);}
 assert.equal(O.current(context()).phase,'walk');
 let inspectCalls=0,renderCalls=0;const queued=[];
 const h={sim,characterStore:store,RealmEarthWildSignsData:D,RealmEarthGrazerMotion:O,RealmEarthRoadkeeperMotion:R,RealmEarthConsignmentData:CD,
  RealmEarthGrazerVisibility:{inspect(){inspectCalls++;throw Error('Paused App must never inspect or issue a witness');}},
  grazerContext:context,grazerMenusOpen:()=>false,G_CAPTURE:false,document:{hidden:false,querySelector:()=>null},panel:null,
  engine:{_contextLost:false,render(){renderCalls++;}},camera:{preset:'adventure',yaw:0},
  art:{update(){}},keys:new Set(),target:null,experience:null,sandbox:null,adventure:null,arsenal:null,rpg:null,
  lastFrame:0,frames:0,fpsStart:0,fps:0,elapsed:0,lastSave:0,lastUi:200,
  grazerLastInspect:-Infinity,grazerLastVisibility:{visible:true,phase:'walk',lower:0,at:100,parts:31,samples:4,span:{width:100,height:80},blocked:[]},
  bindWildSignsClearance(){},tickConsignment(){},switchScene(){},updateCamera(){},syncFieldcraftOwner(){},consignmentPresentation(){},
  updateLabels(){},audio:{tick(){}},requestAnimationFrame:f=>queued.push(f),refreshUI(){},save(){throw Error('No CPU host autosave expected');}};
 // The actual new RAF dependencies share native Core/Motion lease identity.
 const start='// BEGIN EARTH ROADKEEPER APP HOOKS',end='// END EARTH ROADKEEPER APP HOOKS';
 const a=app.indexOf(start),b=app.indexOf(end,a);assert.ok(a>=0&&b>a,'actual installed roadkeeper hook block');
 assert.equal(app.indexOf(start,a+1),-1);assert.equal(app.indexOf(end,b+1),-1);
 Object.assign(h,vm.compileFunction(app.slice(a+start.length,b)+'\nreturn {roadkeeperContext,tickRoadkeeper,roadkeeperPresentation,prepareRoadkeeperDiagnostics,roadkeeperDiagnostics};',[],{contextExtensions:[h]})());
 const refused=R.begin(h.roadkeeperContext());assert.equal(refused.ok,false);assert.match(refused.error,/already claimed canonical account/);
 vm.createContext(h);
 vm.runInContext(section('function grazerPresentation(){','function grazerMenusOpen(){')+
  section('function acknowledgeOrdinaryGrazer(now){','function wildSignsNativeEvent(')+
  section('let wildSignsDiagnosticFrame=null;','function worldContext(){')+
  section('function frame(now){','// Keep a read-only-ish diagnostics surface'),h);
 h.grazerPresentation();h.prepareWildSignsDiagnostics();
 const sample=()=>({elapsed:sim.state.adventure.elapsed,paused:sim.paused,scene:sim.room,signs:copy(sim.state.earthWildSigns),
  view:copy(h.wildSignsDiagnostics().view),visibility:copy(h.wildSignsDiagnostics().visibility),player:copy(sim.state.player)});
 return{h,sim,sample,queued,counts:()=>({inspectCalls,renderCalls})};
}
test('native pause before the next actual App RAF changes only prepared walking/paused diagnostics',()=>{
 const f=appFixture();f.sim.paused=true;const before=f.sample(),world=JSON.stringify(f.sim.state);
 assert.equal(before.paused,true);assert.equal(before.view.paused,false);assert.equal(before.view.walking,true);
 f.h.frame(200);const after=f.sample();assert.notDeepEqual(after,before);
 assert.deepEqual({...after,view:{...after.view,paused:false,walking:true}},before);
 assert.equal(f.h.roadkeeperDiagnostics(),null,'unclaimed account never gains a roadkeeper from the real RAF');
 assert.equal(JSON.stringify(f.sim.state),world);assert.equal(after.view.paused,true);assert.equal(after.view.walking,false);
 assert.equal(after.view.observedBehavior,false);assert.equal(after.view.observationReady,false);assert.equal(f.sim.grazerPresentedFrame,undefined);
 assert.deepEqual(f.counts(),{inspectCalls:0,renderCalls:1});assert.equal(f.queued.length,1);
});
const py="import importlib.util,json,sys; s=importlib.util.spec_from_file_location('probe',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(json.dumps(m.PIXELS_JS))";
const out=cp.spawnSync('python',['-B','-c',py,DRIVER],{encoding:'utf8',windowsHide:true});assert.equal(out.status,0,out.stderr);
const probeJS=JSON.parse(out.stdout);
function pixelFixture(change){
 const state={adventure:{elapsed:10,coins:4},hour:14,weather:'dry',earthWildSigns:{...D.fresh(),accepted:true,evidence:['timber-gouge','feeding-track']},player:{x:0,z:0,yaw:0}};
 const diagnostics={adventure:{paused:true,player:state.player},scene:D.ROOM,wildSigns:{view:{paused:false,walking:true,observedBehavior:false,observationReady:false},visibility:{visible:true,at:20}}};
 let renders=0;const e=Object.create(E.Engine.prototype);
 const gl={ARRAY_BUFFER:1,DYNAMIC_DRAW:2,STATIC_DRAW:3,FRAMEBUFFER:4,RGBA:5,UNSIGNED_BYTE:6,
  bindBuffer(){},bufferData(){},bindFramebuffer(){},getError:()=>0,
  readPixels(x,y,w,h,format,type,b){let n=0;for(const batch of e.dynamic)for(const item of batch.items)if(item.grazerActor===O.ID)n++;b.fill(n*50);}};
 Object.assign(e,{gl,canvas:{clientWidth:1440,clientHeight:960},mainF:{w:10,h:10,f:{}},dynamic:[],
  project:(x,y,z)=>({x:720+x*100,y:480-y*100,visible:true}),
  render(){renders++;for(const b of this.dynamic)this.updateBatch(b);if(renders===5&&change)change(state,diagnostics);}});
 const batch={kind:'box',dynamic:true,buffer:{},items:[{p:[0,0,0],s:[.5,.5,.5],color:[1,1,1],grazerActor:O.ID,grazerPart:'long-body'},
  {p:[.3,.5,0],s:[.3,.3,.3],color:[1,1,1],grazerActor:O.ID,grazerPart:'slender-head'}]};
 e.dynamic.push(batch);e.updateBatch(batch);const realm={state,diagnostics},h={window:{__flArt:{e}},Realm:realm,RealmEngine:E,
  document:{querySelector:()=>({getBoundingClientRect:()=>({top:900})})}};
 vm.createContext(h);const result=vm.runInContext('('+probeJS+')',h)(O.ID);
 return{result,realm,renders,batch};
}
test('manual probe returns exact complete world and sample snapshots from one synchronous evaluation',()=>{
 const {result,realm,renders}=pixelFixture();assert.equal(renders,5);assert.equal(result.stateUnchanged,true);
 assert.ok(result.probeBefore&&result.probeAfter,'Full snapshots must bracket the manual renderer including its finally render');
 assert.deepEqual(copy(result.probeBefore.world),realm.state);assert.deepEqual(copy(result.probeAfter),copy(result.probeBefore));
 assert.equal(result.probeBefore.sample.view.paused,false,'An old prepared projection must be compared without an artificial refresh');
 assert.equal(result.probeBefore.sample.paused,true);assert.equal(result.probeAfter.sample.view.observedBehavior,false);
});
test('mutation in the final restoration render fails complete world equality',()=>{
 const {result}=pixelFixture(state=>state.adventure.coins++);assert.ok(result.probeBefore&&result.probeAfter);
 assert.equal(result.stateUnchanged,false);assert.notDeepEqual(copy(result.probeBefore.world),copy(result.probeAfter.world));
 assert.equal(result.probeBefore.world.adventure.coins,4);assert.equal(result.probeAfter.world.adventure.coins,5);
});
test('witness promotion in final restoration render fails the full sample even with unchanged saved world',()=>{
 const {result}=pixelFixture((_,d)=>{d.wildSigns.view.observedBehavior=true;d.wildSigns.view.observationReady=true;});
 assert.ok(result.probeBefore&&result.probeAfter);assert.equal(result.stateUnchanged,true);
 assert.deepEqual(copy(result.probeBefore.world),copy(result.probeAfter.world));assert.notDeepEqual(copy(result.probeBefore.sample),copy(result.probeAfter.sample));
 assert.equal(result.probeBefore.sample.view.observedBehavior,false);assert.equal(result.probeAfter.sample.view.observedBehavior,true);
});
