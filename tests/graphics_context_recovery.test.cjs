'use strict';
// Actual production Engine/WorldArt/Core/Store/App fragments, with an explicitly
// synthetic CPU GL/DOM/event host. No GLSL, browser, native event or pixels.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=process.env.FIRSTLIGHT_ROOT||path.resolve(__dirname,'..');
const SOURCE=process.env.GRAPHICS_SOURCE_ROOT||ROOT;
const app=fs.readFileSync(path.join(SOURCE,'src/app.js'),'utf8'),source=fs.readFileSync(path.join(SOURCE,'src/engine.js'),'utf8');
const C=require(path.join(ROOT,'src/core.js')),X=require(path.join(ROOT,'src/creative.js')),CH=require(path.join(ROOT,'src/characters.js'));
require(path.join(ROOT,'src/engine.js'));
const W=require(path.join(ROOT,'src/world-foundations.js'));
require(path.join(ROOT,'src/coastward-settlement-art.js'));require(path.join(ROOT,'src/coastward-woodland-art.js'));
require(path.join(ROOT,'src/earth-grazer-motion.js'));require(path.join(ROOT,'src/earth-grazer-habitat-art.js'));
require(path.join(ROOT,'src/world-foundations-art.js'));
require(path.join(ROOT,'src/home-history-art.js'));
const fixtureSource=fs.readFileSync(path.join(ROOT,'tests/timber_engine.test.cjs'),'utf8');
let fixture=fixtureSource.slice(fixtureSource.indexOf('function assets(){'),fixtureSource.indexOf('const item='));
fixture=fixture.replace('const uploads=[],deleted=[],draws=[],buffers=new Map(),pointers=[];', 'const uploads=[],deleted=[],draws=[],buffers=new Map(),pointers=[],created=[],freed=[];');
fixture=fixture.replace('deleteTexture(v){deleted.push(v);}', "deleteTexture(v){deleted.push(v);freed.push({method:'deleteTexture',resource:v});}");
fixture=fixture.replace("return ()=>({resource:k,id:++sequence});", "return ()=>{const r={resource:k,id:++sequence};created.push(r);return r;};");
fixture=fixture.replace("if(k.toUpperCase()===k)return k;", "if(k.startsWith('delete'))return r=>freed.push({method:k,resource:r});if(k.toUpperCase()===k)return k;");
fixture=fixture.replace("addEventListener:(name,f)=>listeners.set(name,f)", "addEventListener(name,f){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(f);},removeEventListener(name,f){listeners.get(name)?.delete(f);}");
fixture=fixture.replace('uniforms,canvas};','uniforms,canvas,context,created,freed};');
const harness=vm.compileFunction(fixture+'\nreturn harness;',[],{contextExtensions:[{vm,Buffer,source,console}]})();
const copy=x=>JSON.parse(JSON.stringify(x));
function fragment(name,next){const a=app.indexOf('function '+name+'('),b=app.indexOf(next,a);assert.ok(a>=0&&b>a,name);return app.slice(a,b);}
function lifecycle(){
 const h=harness(),nodes=new Map(),writes=[];
 for(const [k,v]of Object.entries(globalThis))if(k.startsWith('Realm'))h.context[k]=v;
 // Retain the exact candidate Engine realm rather than the CommonJS baseline.
 vm.runInContext(source,h.context);h.context.RealmCore=C;h.context.RealmCreative=X;
 vm.runInContext(fs.readFileSync(path.join(ROOT,'src/world.js'),'utf8'),h.context);
 const ActualArt=h.context.RealmArt.WorldArt;
 const disk=new Map(),storage={getItem:k=>disk.get(k)??null,setItem:(k,v)=>{writes.push([k,v]);disk.set(k,v);}};
 const store=new CH.Store(storage),loaded=store.load(),sim=new C.Simulation(loaded.state);store.writer=true;
 const node=k=>{if(!nodes.has(k))nodes.set(k,{style:{},textContent:'',children:[],replaceChildren(){this.children=[];},appendChild(n){this.children.push(n);}});return nodes.get(k);};
 const env={engine:h.e,art:new ActualArt(h.e),sim,characterStore:store,
  ui:{canvas:h.canvas,map:{style:{}}},camera:{ready:true,preset:'adventure',yaw:.73,elevation:.28,half:17,distance:8.4,actualDistance:8.4,fov:58,center:[3,2.8,2],overview:false,zoom:1,baseHalf:17},
  follow:null,target:{x:4,z:3},scene:sim.room,keys:new Set(['w']),pointers:new Map([[2,{x:3,y:4}]]),gesture:{moved:true},
  errors:[],document:{getElementById:k=>node('#'+k),createElement:()=>({style:{}})},$:node,innerWidth:960,innerHeight:640,devicePixelRatio:1,
  RealmEngine:h.context.RealmEngine,RealmArt:h.context.RealmArt,RealmWorldFoundations:W,
  RealmWorldFoundationsArt:globalThis.RealmWorldFoundationsArt,RealmEarth:{ROOM:'earth'},RealmCosmos:{ROOM:'cosmos'},
  RealmEarthArt:{},RealmCosmosArt:{},RealmStarterArt:{},RealmCrossingArt:{},RealmArsenalArt:{},RealmRoadArt:{},RealmAdventureArt:{},
  C,carrierFrame:null,carrierInspectionView:null,grazerFocus:()=>null,fieldcraftFocus:()=>null,cameraHalf:()=>17,fitCameraHalf:(b,z)=>b*z,
  toast:s=>env.toasts.push(s),toasts:[],rpg:{dialog:{open:true}},audio:{identity:'original-audio',ctx:{state:'running'}},labelNodes:[],
 };
 const start=app.indexOf('// BEGIN GRAPHICS CONTEXT RECOVERY'),end=app.indexOf('// END GRAPHICS CONTEXT RECOVERY');
 assert.ok(start>=0&&end>start,'actual recovery functions must exist');
 const body=app.slice(start,end)+'\n'+fragment('resize','function graphicsQuality')+'\n'+fragment('carrierFocus','function frameCarrier')+'\n'+fragment('updateCamera','function cameraPreset')+'\n'+fragment('sceneHeight','function earthHomecomingWriter')+'\n'+fragment('labelsRebuild','function mapDraw');
 const api=vm.compileFunction(body+'\nreturn {fallback,graphicsContextLost,restoreGraphics,buildGraphicsScene,get lost(){return graphicsLost;}};',[],{contextExtensions:[env]})();
 const event=()=>({isTrusted:true,target:h.canvas});
 const facts=()=>({state:JSON.stringify(env.sim.snapshot()),sim:env.sim,commands:env.sim.commands,path:env.sim.playerPath,store,revision:store.revision,active:store.active,writer:store.writer,camera:env.camera,cameraBytes:JSON.stringify(env.camera),target:env.target,follow:env.follow,scene:env.scene,audio:env.audio,dialog:env.rpg.dialog,writes:writes.length});
 return {h,env,api,event,facts,writes,ActualArt,nodes};
}
const item={p:[0,1,0],s:[1,1,1],c:0x987654};
test('full Engine retirement frees exact owned GL objects once and removes decoder/listener ownership',()=>{
 const h=harness();h.e.batch('box',[item]);h.e.batch('round',[item],true);h.images.forEach(i=>i.load());
 const callbacks=h.images.map(i=>i.onload).filter(Boolean),resources=h.created.slice();
 assert.equal(h.e._singleBuffers.length,2);assert.equal(h.listeners.get('webglcontextlost').size,1);
 h.e.dispose();assert.equal(h.listeners.get('webglcontextlost').size,0);assert.equal(h.e._surfaceLoads.length,0);
 for(const r of resources)assert.equal(h.freed.filter(v=>v.resource===r).length,1,r.resource+' '+r.id);
 const count=h.freed.length,uploads=h.uploads.length;h.e.dispose();callbacks.forEach(f=>f());h.e.render(1,16,false);
 assert.equal(h.freed.length,count);assert.equal(h.uploads.length,uploads);assert.equal(h.draws.length,0);
});
test('lost Engine retirement performs no invalid-context GL deletions and fences retained completions',()=>{
 const h=harness(),callbacks=h.images.map(i=>i.onload),before=h.freed.length;
 h.gl.lost=true;[...h.listeners.get('webglcontextlost')].forEach(f=>f());h.e.dispose();callbacks.forEach(f=>f());
 assert.equal(h.freed.length,before);assert.equal(h.uploads.length,0);assert.equal(h.listeners.get('webglcontextlost').size,0);
 assert.equal(h.e.batches.length,0);assert.equal(h.e.meshes.size,0);assert.equal(h.e._surfaceLoads.length,0);
});
test('a false loss signal cannot retire an alive renderer or invalidate pending timber decodes',()=>{
 const h=harness(),callbacks=h.images.map(i=>i.onload);[...h.listeners.get('webglcontextlost')].forEach(f=>f());
 assert.equal(h.e._contextLost,false);assert.equal(h.e.surfaceMaterialInfo.status,'loading');assert.equal(h.images[0].onload,callbacks[0]);
 h.images.forEach(i=>i.load());assert.equal(h.e.surfaceMaterialInfo.ready,true);assert.equal(h.uploads.length,2);
 const f=lifecycle(),before=f.facts(),e=f.env.engine,a=f.env.art;assert.equal(f.api.graphicsContextLost(),false);
 assert.equal(f.env.engine,e);assert.equal(f.env.art,a);for(const k of Object.keys(before))assert.equal(f.facts()[k],before[k],k);
});
test('trusted restore rebuilds actual current scene resources and preserves Simulation/store/camera/UI/audio ownership',()=>{
 const f=lifecycle(),e=f.env.engine,a=f.env.art;f.h.gl.lost=true;f.api.graphicsContextLost();
 assert.equal(f.env.engine,null);assert.equal(f.env.art,null);assert.equal(f.env.keys.size,0);assert.equal(f.env.pointers.size,0);assert.equal(f.env.gesture,null);
 assert.equal(f.env.ui.map.style.display,'block');assert.match(f.nodes.get('#fallback-banner').textContent,/local state is intact/);
 const before=f.facts();f.h.gl.lost=false;assert.equal(f.api.restoreGraphics(f.event()),true);const after=f.facts();
 for(const k of Object.keys(before))assert.equal(after[k],before[k],k);
 assert.notEqual(f.env.engine,e);assert.notEqual(f.env.art,a);assert.equal(f.env.art.e,f.env.engine);assert.equal(f.env.art.room,f.env.sim.room);
 assert.ok(f.env.engine.batches.length>0);assert.ok(f.env.engine.dynamic.length>0);assert.ok(f.env.engine.camera.eye.every(Number.isFinite));
 assert.equal(f.env.engine.quality,f.env.sim.state.settings.quality);assert.equal(f.env.engine.reducedMotion,f.env.sim.state.settings.reducedMotion);
 assert.equal(f.env.ui.canvas.style.display,'block');assert.equal(f.env.ui.map.style.display,'none');assert.equal(f.h.listeners.get('webglcontextlost').size,1);
});
test('restore uses latest real current room and scene dispatch without logical scene/camera re-entry',()=>{
 for(const room of ['retreat',W.definition('earthlands').room]){
  const f=lifecycle();f.h.gl.lost=true;f.api.graphicsContextLost();
  // Explicit CPU fixture: actual map consumers may change rooms while 3D is lost.
  f.env.sim.room=room;f.env.scene=room;f.env.camera.preset='follow';f.env.sim.state.settings.reducedMotion=true;
  const before=f.facts();f.h.gl.lost=false;assert.equal(f.api.restoreGraphics(f.event()),true,f.env.errors.join('; '));
  assert.equal(f.env.art.room,room);if(room==='retreat')assert.equal(f.env.art.layoutRevision,f.env.sim.state.retreat.revision);
  for(const k of Object.keys(before))assert.equal(f.facts()[k],before[k],k);
  assert.equal(f.env.engine.reducedMotion,true);
 }
});
test('real Store character changes on the map are retained and restored resources belong to the current Simulation',()=>{
 const f=lifecycle(),store=f.env.characterStore;f.h.gl.lost=true;f.api.graphicsContextLost();
 const created=store.command('create',{visitor:C.fresh().visitor},f.env.sim.snapshot(),store.revision);assert.ok(created.ok,created.error);
 f.env.sim=new C.Simulation(created.state);const second=f.env.sim;
 const switched=store.command('switch',{id:'character-1'},second.snapshot(),store.revision);assert.ok(switched.ok,switched.error);
 f.env.sim=new C.Simulation(switched.state);f.env.scene=f.env.sim.room;
 const before=f.facts();assert.equal(before.active,'character-1');assert.equal(before.revision,2);f.h.gl.lost=false;
 assert.equal(f.api.restoreGraphics(f.event()),true,f.env.errors.join('; '));for(const k of Object.keys(before))assert.equal(f.facts()[k],before[k],k);
 assert.notEqual(f.env.sim,second);assert.equal(f.env.art.room,f.env.sim.room);assert.equal(f.writes.length,2);
});
test('untrusted, wrong-canvas, pre-loss and duplicate restores cannot allocate; repeated true cycles do not accumulate listeners',()=>{
 const f=lifecycle();let created=f.h.created.length;assert.equal(f.api.restoreGraphics(f.event()),false);assert.equal(f.h.created.length,created);
 for(let cycle=0;cycle<3;cycle++){
  f.h.gl.lost=true;const callbacks=f.h.images.slice(-2).map(i=>i.onload);f.api.graphicsContextLost();created=f.h.created.length;
  for(const e of [{target:f.h.canvas,isTrusted:false},{target:{},isTrusted:true}])assert.equal(f.api.restoreGraphics(e),false);
  assert.equal(f.h.created.length,created);f.h.gl.lost=false;assert.equal(f.api.restoreGraphics(f.event()),true);
  callbacks.filter(Boolean).forEach(fn=>fn());assert.equal(f.h.listeners.get('webglcontextlost').size,1);
  created=f.h.created.length;assert.equal(f.api.restoreGraphics(f.event()),false);assert.equal(f.h.created.length,created);
 }
});
test('failed post-Engine scene allocation retires all newly allocated handles/listeners and keeps map/export facts',()=>{
 const f=lifecycle();f.h.gl.lost=true;f.api.graphicsContextLost();f.h.gl.lost=false;
 const before=f.facts(),first=f.h.created.length;
 f.env.RealmArt={WorldArt:class{constructor(e){new f.ActualArt(e);throw new Error('Synthetic scene allocation failure');}}};
 assert.equal(f.api.restoreGraphics(f.event()),false);assert.equal(f.env.engine,null);assert.equal(f.env.art,null);
 assert.equal(f.h.listeners.get('webglcontextlost').size,0);assert.equal(f.env.ui.map.style.display,'block');assert.match(f.nodes.get('#fallback-banner').textContent,/could not be restored/);
 for(const r of f.h.created.slice(first))assert.equal(f.h.freed.filter(v=>v.resource===r).length,1,r.resource+' '+r.id);
 for(const k of Object.keys(before))assert.equal(f.facts()[k],before[k],k);
 const count=f.h.created.length;assert.equal(f.api.restoreGraphics(f.event()),false);assert.equal(f.h.created.length,count);
});
test('restored render dispatch remains exact original and loss handler/restore never acquire authority or create loops',()=>{
 const line=app.split('\n').find(l=>l.startsWith('function switchScene(')),a=line.indexOf('if(engine){'),b=line.indexOf('camera.center=',a),original=line.slice(a,b);
 assert.ok(app.includes('function buildGraphicsScene(){const scene=sim.room;'+original+'}'));
 const block=app.slice(app.indexOf('// BEGIN GRAPHICS CONTEXT RECOVERY'),app.indexOf('// END GRAPHICS CONTEXT RECOVERY'));
 for(const forbidden of ['new C.Simulation','requestAnimationFrame(', 'setTimeout(', 'acquireCharacterWriter(', 'characterStore.command(', 'audio.', 'cameraPreset(', 'switchScene(', 'save('])assert.ok(!block.includes(forbidden),forbidden);
 assert.equal(app.split("addEventListener('webglcontextrestored',restoreGraphics)").length-1,1);
 assert.equal(app.split("addEventListener('webglcontextlost',e=>{e.preventDefault();graphicsContextLost();})").length-1,1);
 const oldBrowser=fs.readFileSync(path.join(ROOT,'tests/timber_browser.py'),'utf8');
 assert.ok(oldBrowser.includes("production context loss preserves export and local save"));assert.ok(oldBrowser.includes('production context loss displays the usable map fallback'));
});
function runFrame(kind){
 const f=lifecycle(),rule=new Error('Synthetic rule failure'),render=new Error('Synthetic render failure'),calls=[];
 const sim=f.env.sim,originalTick=sim.tick.bind(sim);sim.tick=dt=>{calls.push('sim');if(kind==='rule')throw rule;originalTick(dt);};
 f.env.art.update=()=>{calls.push('art');if(kind==='lost'||kind==='render'){f.h.gl.lost=kind==='lost';throw render;}};
 Object.assign(f.env,{lastFrame:0,frames:0,fps:0,fpsStart:0,elapsed:0,lastUi:0,lastSave:0,G_CAPTURE:false,performance:{now:()=>1},document:{...f.env.document,hidden:false},
  bindWildSignsClearance:()=>calls.push('rules'),tickRoadkeeper:()=>{},tickConsignment:()=>{},tickGrazer:()=>{},switchScene:()=>{},updateCamera:()=>{},experience:null,sandbox:null,adventure:null,arsenal:null,
  rpg:{tick:()=>{}},syncFieldcraftOwner:()=>{},consignmentPresentation:()=>{},grazerPresentation:()=>{},prepareWildSignsDiagnostics:()=>{},roadkeeperPresentation:()=>{},prepareRoadkeeperDiagnostics:()=>{},
  acknowledgeOrdinaryGrazer:()=>{},updateLabels:()=>{},mapDraw:()=>calls.push('map'),audio:{tick:()=>calls.push('audio')},refreshUI:()=>calls.push('ui'),save:()=>calls.push('save'),requestAnimationFrame:()=>calls.push('raf')});
 const frameApp=process.env.GRAPHICS_FRAME_SOURCE?fs.readFileSync(process.env.GRAPHICS_FRAME_SOURCE,'utf8'):app;
 const frame=frameApp.split('\n').find(l=>l.startsWith('function frame(now)'));
 const invoke=vm.compileFunction(frame+'\nreturn frame;',[],{contextExtensions:[f.env,{graphicsContextLost:f.api.graphicsContextLost}]})();
 let thrown;try{invoke(1000);}catch(e){thrown=e;}return{f,calls,thrown,rule,render};
}
test('pre-event lost renderer alone falls back and continues exactly one ordinary RAF/audio/UI tail',()=>{
 const r=runFrame('lost');assert.equal(r.thrown,undefined);assert.equal(r.f.env.engine,null);
 assert.deepEqual(r.calls,['rules','sim','art','map','audio','ui','raf']);
});
test('non-loss render and rule exceptions retain identity and historical no-reschedule behavior',()=>{
 for(const kind of ['render','rule']){const r=runFrame(kind);assert.equal(r.thrown,kind==='rule'?r.rule:r.render);assert.ok(!r.calls.includes('raf'));assert.ok(!r.calls.includes('audio'));assert.ok(!r.calls.includes('map'));assert.ok(r.f.env.engine);}
});
