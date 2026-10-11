'use strict';
// CPU actual-caller composition: synthetic already-paid worlds, storage,
// document/menu controls; real Core/World/Characters/Engine/Motion/Art and exact
// unmodified App hooks execute in one realm. No native DOM/RAF/pixels are claimed.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=process.env.FIRSTLIGHT_ROOT||path.resolve(__dirname,'..');
const hookFile=process.env.ROAD_ACCOUNT_PARENT_HOOKS;
const visual=process.env.ROADKEEPER_STAGE||ROOT;
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js')),
 EE=require(path.join(ROOT,'src/earth-expedition.js')),CD=require(path.join(ROOT,'src/earth-consignment-data.js')),
 D=require(path.join(ROOT,'src/earth-wild-signs-data.js')),CH=require(path.join(ROOT,'src/characters.js')),
 E=require(path.join(ROOT,'src/engine.js')),O=require(path.join(visual,'src/earth-roadkeeper-motion.js')),
 Art=require(path.join(visual,'src/earth-roadkeeper-art.js'));
const app=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8');
const START='// BEGIN EARTH ROADKEEPER APP HOOKS',END='// END EARTH ROADKEEPER APP HOOKS';
function extract(source){
 const a=source.indexOf(START),b=source.indexOf(END);
 assert.ok(a>=0&&b>a,'installed App must retain unique hook extraction markers');
 assert.equal(source.indexOf(START,a+1),-1);assert.equal(source.indexOf(END,b+1),-1);
 return source.slice(a+START.length,b);
}
const hooks=hookFile?fs.readFileSync(hookFile,'utf8'):extract(app);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),copy=s=>JSON.parse(JSON.stringify(s));
test('selected production hook source is read without rewriting its functions',()=>{
 assert.ok(hooks.includes('function tickRoadkeeper(dt)'));assert.ok(hooks.includes('function roadkeeperDiagnostics()'));
 if(!hookFile)assert.equal(sha(hooks),sha(extract(app)));
});
function raw(resolution){
 const s=C.fresh();s.adventure.started=true;s.player={x:W.GATE.x,z:W.GATE.z,yaw:0};
 s.earthExpedition={version:1,story:{accepted:true,branch:'stormfall-recovery',steps:EE.definition.steps.map(p=>p.id),claimed:true},patrol:{lastClaim:0,active:null}};
 s.localLife.records[CD.ID]={accepted:true,choice:'south-stormfall',steps:CD.required('south-stormfall').slice(),claimed:true};
 s.earthWildSigns={version:1,accepted:true,evidence:D.evidence.map(p=>p.id),observed:true,resolution,cleared:resolution==='cleared-pocket',claimed:true};return C.validate(s);
}
function world(resolution='signed-loop'){
 const map=new Map([[CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:raw(resolution)}]})]]);
 let writes=0;const storage={getItem:k=>map.get(k)??null,setItem(k,v){writes++;map.set(k,v);}};
 const store=new CH.Store(storage),loaded=store.load();assert.equal(loaded.status,'loaded');store.writer=true;
 const sim=new C.Simulation(loaded.state),ctx=()=>({sim,active:store.active,revision:store.revision});
 const p=W.preview(ctx(),'earthlands');assert.ok(p.ok,p.error);assert.ok(W.enter(p.ticket,ctx(),{save:s=>store.save(s),build(){}}).ok);
 // Explicit synthetic pose near Sela; actual travel and current-room Core roster.
 sim.state.player={x:D.giver.x,z:D.giver.z,yaw:0};sim.state.settings.timeFlow=false;sim.tick(0);
 return{sim,store,map,storage,writes:()=>writes};
}
function fixture(resolution){
 const w=world(resolution),holder={sim:w.sim,store:w.store,panel:null,hidden:false,dialog:false};
 const doc={get hidden(){return holder.hidden;},querySelector(selector){assert.equal(selector,'dialog[open]');return holder.dialog?{cpuSyntheticDialog:true}:null;}};
 const environment={get sim(){return holder.sim;},get characterStore(){return holder.store;},get panel(){return holder.panel;},document:doc,RealmEarthRoadkeeperMotion:O};
 const api=vm.compileFunction(hooks+'\nreturn {syncRoadkeeperOwner,roadkeeperContext,roadkeeperPresentation,tickRoadkeeper,prepareRoadkeeperDiagnostics,roadkeeperDiagnostics};',[],{filename:hookFile||path.join(ROOT,'src/app.js')+':hook-block',contextExtensions:[environment]})();
 const f={...w,holder,api,get sim(){return holder.sim;},get store(){return holder.store;},view:()=>holder.sim.roadkeeperPresentation,
  frame(dt=.1){holder.sim.tick(dt);api.tickRoadkeeper(dt);api.roadkeeperPresentation();api.prepareRoadkeeperDiagnostics();return this.view();},
  render(){api.roadkeeperPresentation();api.prepareRoadkeeperDiagnostics();const out={box:[],round:[],octa:[]};return{view:this.view(),out,count:Art.draw(out,this.view(),holder.sim.roadkeeperPresentationContext)};},
  start(){api.tickRoadkeeper(0);api.prepareRoadkeeperDiagnostics();assert.ok(this.view());return this.view();},
  forward(n=70){for(let i=0;i<n;i++)this.frame();assert.ok(this.view());return this.view();}};
 return f;
}
const pose=v=>({x:v.x,z:v.z,phase:v.phase,phaseTime:v.phaseTime,gait:v.gait,cycle:v.cycle});
// Preserve the actual App's intentional context.sim cycle in read-only byte
// comparisons as one named reference; this does not change any runtime object.
const simBytes=sim=>JSON.stringify(sim,(key,value)=>key==='sim'&&value===sim?'CPU current Simulation reference':value);
const persisted=f=>JSON.stringify({state:f.sim.state,home:f.sim.returnPos,trip:f.sim.worldTrip,runtime:f.sim.adventureRuntime,commands:[...f.sim.commands],path:f.sim.playerPath});
function walking(){const f=fixture();f.start();f.forward();assert.equal(f.view().walking,true);return f;}
for(const resolution of ['signed-loop','cleared-pocket'])test(resolution+' uses actual Core ticks and hooks through a supported full trip without extra state/reward/storage changes',()=>{
 const f=fixture(resolution),control=world(resolution);f.start();const disk=f.map.get(CH.KEY),writes=f.writes(),lease=f.sim.roadkeeperOwnerLease,home=copy(f.sim.returnPos);
 let inspect=false,returning=false,v;for(let n=0;n<5600;n++){
  control.sim.tick(.1);v=f.frame();assert.ok(v);assert.ok(W.walkable(O.ROOM,v.x,v.z,O.LIMITS.radius));
  inspect||=v.phase==='inspect';returning||=v.phase==='return';assert.equal(persisted(f),persisted(control));
  assert.equal(f.sim.roadkeeperOwnerLease,lease);if(v.cycle===1)break;
 }
 assert.equal(v.cycle,1);assert.ok(inspect&&returning);assert.deepEqual({x:v.x,z:v.z},O.HOME);
 assert.deepEqual(f.sim.returnPos,home);assert.equal(f.writes(),writes);assert.equal(f.map.get(CH.KEY),disk);
});
test('render preparation and real Engine primitive composition cannot advance Core or Motion',()=>{
 const f=walking(),before=persisted(f),view=pose(f.view()),lease=f.sim.roadkeeperOwnerLease,writes=f.writes();
 for(let n=0;n<12;n++){
  const r=f.render();assert.equal(r.count,19);assert.deepEqual(pose(r.view),view);
  for(const kind of ['box','round','octa'])for(const part of r.out[kind]){
   const vertices=E.geometry(kind);for(let i=0;i<vertices.length;i+=6){const p=E.M.transform(part.m,Array.from(vertices.slice(i,i+3)));
    assert.ok(Math.hypot(p[0]-r.view.x,p[2]-r.view.z)<=O.LIMITS.radius+1e-5);assert.ok(p[1]>=r.view.base-1e-5&&p[1]<=r.view.base+O.LIMITS.height+1e-5);
   }
  }
 }
 assert.equal(persisted(f),before);assert.equal(f.sim.roadkeeperOwnerLease,lease);assert.equal(f.writes(),writes);
});
test('panel, open dialog, pause and hidden suspend actual hooks without catch-up or lease renewal',()=>{
 for(const reason of ['panel','dialog','paused','hidden']){
  const f=walking(),v=pose(f.view()),lease=f.sim.roadkeeperOwnerLease;
  if(reason==='panel')f.holder.panel={cpuSyntheticPanel:true};if(reason==='dialog')f.holder.dialog=true;
  if(reason==='paused')f.sim.paused=true;if(reason==='hidden')f.holder.hidden=true;
  for(let n=0;n<20;n++){const now=f.frame();assert.deepEqual(pose(now),v);assert.equal(now.walking,false);assert.equal(now.suspended,reason==='panel'||reason==='dialog'?'menu':reason);}
  if(reason==='hidden')assert.equal(f.render().count,0);
  assert.equal(f.sim.roadkeeperOwnerLease,lease);f.holder.panel=null;f.holder.dialog=false;f.holder.hidden=false;f.sim.paused=false;
  const now=f.frame();assert.ok(Math.hypot(now.x-v.x,now.z-v.z)<=.115+1e-8);
 }
});
test('both camera modes, graphics qualities and reduced-motion refresh retain same App owner and route cursor',()=>{
 const f=walking(),v=pose(f.view()),lease=f.sim.roadkeeperOwnerLease;
 for(const cameraMode of ['adventure','follow'])for(const quality of ['low','balanced','high'])for(const reducedMotion of [false,true]){
  Object.assign(f.sim.state.settings,{cameraMode,quality,reducedMotion});const r=f.render();
  assert.equal(f.sim.roadkeeperOwnerLease,lease);assert.deepEqual(pose(r.view),v);assert.equal(r.view.reducedMotion,reducedMotion);assert.equal(r.count,19);
 }
 f.frame();assert.ok(Math.hypot(f.view().x-v.x,f.view().z-v.z)>0);
});
test('actual Simulation/state/adventure/Store/trip/earthTrip/death/account identity transitions discard outgoing pose and restart at home',()=>{
 const mutations=[f=>{const w=world();f.holder.sim=w.sim;},f=>{f.sim.state=copy(f.sim.state);},f=>{f.sim.state.adventure=copy(f.sim.state.adventure);},
  f=>{f.holder.store=new CH.Store(f.storage);assert.equal(f.store.load().status,'loaded');f.store.writer=true;},
  f=>{f.sim.worldTrip={...f.sim.worldTrip};},f=>{f.sim.earthTrip={cpuSyntheticTrip:true};},f=>{f.sim.state.adventure.deaths++;},
  f=>{f.sim.state.earthWildSigns.resolution='cleared-pocket';f.sim.state.earthWildSigns.cleared=true;}];
 for(const mutate of mutations){const f=walking(),outgoing=f.sim,old=f.view(),lease=f.sim.roadkeeperOwnerLease;mutate(f);
  assert.equal(f.api.roadkeeperDiagnostics(),null);f.api.syncRoadkeeperOwner();assert.notEqual(f.sim.roadkeeperOwnerLease,lease);
  assert.equal(O.isProjection(old,outgoing.roadkeeperPresentationContext||{sim:outgoing,active:'character-1',revision:1,ownerLease:lease,hidden:false,menuOpen:false}),false);
  assert.equal(Object.hasOwn(outgoing,'roadkeeperPresentation'),false);f.api.tickRoadkeeper(0);assert.ok(f.view());assert.deepEqual({x:f.view().x,z:f.view().z},O.HOME);
 }
});
test('actual home change, room return, diving and HP death invalidate owner and refuse unavailable routine',()=>{
 for(const mutate of [f=>{f.sim.returnPos={...f.sim.returnPos,x:f.sim.returnPos.x+1};},f=>{assert.ok(W.leave(f.sim).ok);},
  f=>{f.sim.worldDive={cpuSyntheticDive:true};},f=>{f.sim.state.adventure.hp=0;}]){
  const f=walking(),old=f.view();mutate(f);f.api.syncRoadkeeperOwner();assert.doesNotThrow(()=>f.api.tickRoadkeeper(0));assert.equal(f.view(),null);
  assert.equal(O.isProjection(old,f.api.roadkeeperContext()),false);assert.equal(f.render().count,0);
 }
});
test('actual CharacterStore import/switch and explicit applyWorld force reset outgoing Simulation without routine save',()=>{
 const f=walking(),outgoing=f.sim,old=f.view(),lease=f.sim.roadkeeperOwnerLease;
 const imported=f.store.command('import',{world:raw('cleared-pocket')},f.sim.snapshot(),f.store.revision);assert.ok(imported.ok,imported.error);
 const writes=f.writes();f.api.syncRoadkeeperOwner(true);assert.notEqual(outgoing.roadkeeperOwnerLease,lease);assert.equal(Object.hasOwn(outgoing,'roadkeeperPresentation'),false);
 f.holder.sim=new C.Simulation(imported.state);f.api.syncRoadkeeperOwner();assert.equal(f.api.roadkeeperDiagnostics(),null);
 const ctx=()=>({sim:f.sim,active:f.store.active,revision:f.store.revision}),p=W.preview(ctx(),'earthlands');assert.ok(p.ok);
 assert.ok(W.enter(p.ticket,ctx(),{save:s=>f.store.save(s),build(){}}).ok);f.sim.state.player={x:D.giver.x,z:D.giver.z,yaw:0};f.sim.tick(0);f.api.tickRoadkeeper(0);
 assert.equal(f.view().resolution,'cleared-pocket');assert.deepEqual({x:f.view().x,z:f.view().z},O.HOME);assert.equal(f.writes(),writes);
 assert.equal(O.isProjection(old,{sim:outgoing,active:'character-1',revision:f.store.revision,ownerLease:lease,hidden:false,menuOpen:false}),false);
 const switched=f.store.command('switch',{id:'character-1'},f.sim.snapshot(),f.store.revision);assert.ok(switched.ok,switched.error);
 f.api.syncRoadkeeperOwner(true);f.holder.sim=new C.Simulation(switched.state);f.api.syncRoadkeeperOwner();f.api.tickRoadkeeper(0);assert.equal(f.view(),null);
});
test('ordinary save revision increments preserve lease and pose while actual Motion observes latest revision',()=>{
 const f=walking(),old=f.view(),lease=f.sim.roadkeeperOwnerLease,revision=f.store.revision;
 f.sim.state.hour+=.01;assert.ok(f.store.save(f.sim.snapshot()).ok);assert.ok(f.store.revision>revision);
 f.api.roadkeeperPresentation();f.api.prepareRoadkeeperDiagnostics();assert.equal(f.sim.roadkeeperOwnerLease,lease);assert.deepEqual(pose(f.view()),pose(old));
 assert.equal(O.isProjection(old,f.sim.roadkeeperPresentationContext),false);assert.ok(f.api.roadkeeperDiagnostics());
});
test('review negative: equal-valued replacement of actual claimed account owner renews App lease and discards outgoing pose',()=>{
 const f=walking(),lease=f.sim.roadkeeperOwnerLease,old=f.view();f.sim.state.earthWildSigns=copy(f.sim.state.earthWildSigns);
 assert.equal(f.api.roadkeeperDiagnostics(),null,'equal values do not preserve the identity of the actual claimed account owner');
 f.api.syncRoadkeeperOwner();assert.notEqual(f.sim.roadkeeperOwnerLease,lease);assert.equal(O.isProjection(old,f.api.roadkeeperContext()),false);
 f.api.tickRoadkeeper(0);assert.deepEqual({x:f.view().x,z:f.view().z},O.HOME);
});
test('diagnostic getter is a pure bounded copy with no Core/Motion advancement, opaque handles or writers',()=>{
 const f=walking(),before=simBytes(f.sim),store=JSON.stringify(f.store.record),writes=f.writes(),view=pose(f.view()),lease=f.sim.roadkeeperOwnerLease;
 const allowed=['actor','resolution','x','z','base','yaw','phase','phaseTime','gait','cycle','walking','paused','suspended','hidden','menuOpen','reducedMotion','radius','height'];
 for(let n=0;n<25;n++){
  const d=f.api.roadkeeperDiagnostics();assert.ok(d);assert.deepEqual(Object.keys(d).sort(),allowed.sort());
  assert.ok(Object.values(d).every(v=>v===null||['number','string','boolean'].includes(typeof v)));d.x=999;d.ownerLease=lease;
  assert.notEqual(f.api.roadkeeperDiagnostics().x,999);assert.equal(Object.hasOwn(f.api.roadkeeperDiagnostics(),'ownerLease'),false);
 }
 assert.equal(simBytes(f.sim),before);assert.equal(JSON.stringify(f.store.record),store);assert.deepEqual(pose(f.view()),view);assert.equal(f.sim.roadkeeperOwnerLease,lease);assert.equal(f.writes(),writes);
});
test('review negative: cached diagnostics withdraw after current character revision changes before a prepared frame',()=>{
 const f=walking(),priorContext={...f.sim.roadkeeperPresentationContext};assert.ok(f.api.roadkeeperDiagnostics());f.sim.state.hour+=.01;assert.ok(f.store.save(f.sim.snapshot()).ok);
 const before=simBytes(f.sim),writes=f.writes();assert.equal(f.api.roadkeeperDiagnostics(),null,'cached context predates actual Store revision');assert.equal(simBytes(f.sim),before);assert.equal(f.writes(),writes);
 assert.ok(O.current(priorContext),'getter must not observe a newer revision through Motion');
});
for(const[name,alter]of Object.entries({paused:f=>{f.sim.paused=true;},hidden:f=>{f.holder.hidden=true;},panel:f=>{f.holder.panel={cpuSyntheticPanel:true};},dialog:f=>{f.holder.dialog=true;},reducedMotion:f=>{f.sim.state.settings.reducedMotion=true;}}))
 test('review negative: cached diagnostics withdraw immediately after '+name+' changes',()=>{
  const f=walking();assert.equal(f.api.roadkeeperDiagnostics().walking,true);alter(f);const before=simBytes(f.sim);
  assert.equal(f.api.roadkeeperDiagnostics(),null,'cached pose flags no longer describe current presentation');assert.equal(simBytes(f.sim),before);
});
for(const[name,alter]of Object.entries({missingThreat:f=>{delete f.sim.adventureRuntime;},replacedThreat:f=>{f.sim.adventureRuntime={...f.sim.adventureRuntime};},
 nonfiniteThreat:f=>{f.sim.adventureRuntime.enemies[0].x=NaN;},nearThreat:f=>{const e=f.sim.adventureRuntime.enemies[0],v=f.view();e.x=v.x;e.z=v.z;},
 hpDead:f=>{f.sim.state.adventure.hp=0;},paidLoadInvalid:f=>{f.sim.state.localLife.records[CD.ID].claimed=false;}}))
 test('review negative: cached diagnostics withdraw on '+name,()=>{
  const f=walking();assert.ok(f.api.roadkeeperDiagnostics());alter(f);const before=simBytes(f.sim);
  assert.equal(f.api.roadkeeperDiagnostics(),null,'cached pose has no current threat ownership');assert.equal(simBytes(f.sim),before);
});
test('structured optional Motion refusals cannot throw or change ordinary Core state, rewards or storage',()=>{
 const f=walking(),control=world();control.sim.tick(0);for(let n=0;n<70;n++)control.sim.tick(.1);
 const writes=f.writes();assert.doesNotThrow(()=>f.api.tickRoadkeeper(.1));assert.equal(f.view(),null);assert.equal(persisted(f),persisted(control));assert.equal(f.writes(),writes);
 f.sim.tick(.1);control.sim.tick(.1);assert.doesNotThrow(()=>f.api.tickRoadkeeper(.1));assert.ok(f.view());assert.deepEqual({x:f.view().x,z:f.view().z},O.HOME);
 // Real Core had initialized roster. Deleting/invalidating it is a bounded
 // explicit CPU threat negative after that caller, not a normal runtime claim.
 for(const bad of [()=>{delete f.sim.adventureRuntime;},()=>{f.sim.adventureRuntime.enemies[0].x=NaN;}]){
  f.sim.tick(.1);bad();const before=simBytes(f.sim),rt=f.sim.adventureRuntime;
  assert.doesNotThrow(()=>f.api.tickRoadkeeper(.1));assert.equal(f.view(),null);assert.equal(f.sim.adventureRuntime,rt);
  delete f.sim.roadkeeperPresentation;delete f.sim.roadkeeperPresentationContext;
  const expected=JSON.parse(before);delete expected.roadkeeperPresentation;delete expected.roadkeeperPresentationContext;
  assert.deepEqual(JSON.parse(simBytes(f.sim)),expected);assert.equal(f.writes(),writes);
 }
});
test('primitive lease, inherited prerequisite and unclaimed accounts refuse optional frame without main-state repair or storage',()=>{
 for(const alter of [f=>{f.sim.roadkeeperOwnerLease=7;},f=>{f.sim.state.localLife.records=Object.create(f.sim.state.localLife.records);},
  f=>{f.sim.state.earthWildSigns.claimed=false;}]){
  const f=walking();alter(f);const before=persisted(f),writes=f.writes();assert.doesNotThrow(()=>f.api.tickRoadkeeper(.1));
  assert.equal(f.view(),null);assert.equal(persisted(f),before);assert.equal(f.writes(),writes);
 }
});
test('installed App seams retain Core-first ordinary/test ticks, prep before every art submission, scene sync and outgoing force reset', {skip:hookFile?'staged hooks only; actual installed App pipeline is parent-owned and not yet integrated':false},()=>{
 for(const site of ['sim.tick(dt);tickRoadkeeper(dt);','sim.tick(.05);tickRoadkeeper(.05);'])assert.ok(app.includes(site),site);
 assert.match(app,/function switchScene\(\)\{syncRoadkeeperOwner\(\);/);
 const apply=app.slice(app.indexOf('function applyWorld(state)'),app.indexOf('function applyWorld(state)')+1500);
 assert.ok(apply.indexOf('syncRoadkeeperOwner(true)')>=0&&apply.indexOf('syncRoadkeeperOwner(true)')<apply.indexOf('sim=new C.Simulation(state)'));
 for(const m of app.matchAll(/art\.update\(sim,elapsed,target\)/g)){
  const before=app.slice(Math.max(0,m.index-220),m.index);assert.match(before,/roadkeeperPresentation\(\);prepareRoadkeeperDiagnostics\(\);/);
 }
 assert.ok(app.includes('roadkeeper:roadkeeperDiagnostics()'));
});
