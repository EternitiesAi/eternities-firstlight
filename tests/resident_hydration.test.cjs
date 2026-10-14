'use strict';
// Actual Core/Characters/App functions. Storage/DOM/audio/lock interfaces are
// explicitly synthetic CPU boundaries; no browser, RAF, renderer or personal save.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js'),CH=require('../src/characters.js'),X=require('../src/creative.js');
const app=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
const copy=v=>JSON.parse(JSON.stringify(v));
function memory(entries=[]){const data=new Map(entries);return{data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
function warmed(){const s=new C.Simulation();s.state.settings.timeFlow=false;s.tick(0);return s.snapshot();}
function view(sim){return [...sim.runs].map(([id,r])=>({id,goal:r.goal,cue:r.cue,path:copy(r.path),walking:r.walking,inside:r.inside}));}
function validPaths(sim){for(const [id,run] of sim.runs){let p=sim.state.residents.find(v=>v.id===id);for(const q of run.path){assert.ok(C.segment(p,q),id+' supported route');p=q;}}}
function outsideHistory(world){const {journal,nextEvent,...rest}=world;return rest;}
function functionSource(name){
 const at=app.indexOf('function '+name+'(');assert.ok(at>=0,name+' actual App function');const start=app.indexOf('{',at);let end=start+1,depth=1;
 for(;depth&&end<app.length;end++){if(app[end]==='{')depth++;else if(app[end]==='}')depth--;}
 assert.equal(depth,0);return app.slice(app.slice(at-6,at)==='async '?at-6:at,end);
}
function boot(store){
 const start=app.indexOf('let loaded=characterStore.load()'),end=app.indexOf(';let camera=',start);assert.ok(start>=0&&end>start);
 return vm.compileFunction(app.slice(start,end)+';return {loaded,sim};',[],{filename:'actual-App-startup',contextExtensions:[{C,characterStore:store,performance:{now:()=>0}}]})();
}
function host(store,state){
 const calls=[],env={C,RealmBriarOuting:require('../src/briar-outing.js'),gateHost:null,briarOwner:null,characterStore:store,characterLock:{},sim:new C.Simulation(state),engine:null,keys:new Set(['w']),pointers:new Map([[1,{}]]),gesture:{},rpg:null,adventure:null,sandbox:null,experience:null,arsenal:null,
  document:{body:{classList:{remove:x=>calls.push('remove:'+x),toggle:x=>calls.push('toggle:'+x)}}},audio:{disable:()=>calls.push('audio.disable')},camera:{ready:true,preset:'adventure',fov:60},scene:null,selected:null,follow:null,lastSave:0,elapsed:7,preserveExisting:true,saveState:'new',
  closePanel:()=>calls.push('closePanel'),resize:()=>calls.push('resize'),switchScene:()=>calls.push('switchScene'),renderStatus:()=>calls.push('renderStatus'),toast:s=>calls.push('toast:'+s),rememberCamera:()=>calls.push('rememberCamera'),confirm:()=>true,
  acquireCharacterWriter:async()=>{store.writer=true;return true;}};
 for(const name of ['syncRoadkeeperOwner','clearGrazerFocus','syncConsignmentOwner','syncFieldcraftOwner','syncWildSignsOwner'])env[name]=()=>calls.push(name);
 let callback;env.ui={body:{addEventListener:(event,fn)=>{assert.equal(event,'click');callback=fn;}}};
 const clickLine=app.split('\n').find(l=>l.startsWith("ui.body.addEventListener('click',"));assert.ok(clickLine);
 const source=['briarSaveGuard','applyWorld','replaceLegacyWorld','characterAction'].map(functionSource).join('\n')+'\n'+clickLine+'\nreturn {applyWorld,replaceLegacyWorld,characterAction};';
 const api=vm.compileFunction(source,[],{filename:'actual-App-owned-world-functions',contextExtensions:[env]})();
 return{env,calls,...api,reset(){callback({target:{closest:s=>{assert.equal(s,'[data-action]');return{dataset:{action:'reset'}};}}});}};
}

test('loaded same-clock hydration initializes exact real routes without repeating routine history',()=>{
 const state=warmed(),ordinary=new C.Simulation(state);ordinary.tick(0);
 const loaded=new C.Simulation(state,{hydrated:true});assert.deepEqual(loaded.snapshot(),state);loaded.tick(0);
 assert.deepEqual(loaded.snapshot(),state,'no repeated routine bodies or sequence allocation');assert.deepEqual(view(loaded),view(ordinary));validPaths(loaded);
 assert.deepEqual(outsideHistory(loaded.snapshot()),outsideHistory(ordinary.snapshot()));assert.equal(ordinary.state.nextEvent,state.nextEvent+3,'default constructor remains fresh-compatible');
});
test('loaded empty history stays empty while explicitly fresh nonempty history still gets first cues',()=>{
 const empty=C.fresh();empty.settings.timeFlow=false;
 const loaded=new C.Simulation(empty,{hydrated:true});loaded.tick(0);assert.equal(loaded.state.journal.length,0);assert.equal(loaded.state.nextEvent,1);validPaths(loaded);
 const fresh=new C.Simulation(empty,{hydrated:false});assert.ok(fresh.act('early-note','note',{text:'A fresh world can already have a note.'}).ok);fresh.tick(0);
 assert.equal(fresh.state.journal.length,4);assert.equal(fresh.state.journal[0].kind,'note');assert.ok(fresh.state.journal.slice(1).every(e=>e.kind==='routine'));assert.equal(fresh.state.nextEvent,5);
});
test('sixty-seven loaded rebuilds preserve full bounded synthetic history notes and every world field',()=>{
 const s=new C.Simulation(warmed());s.tick(0);assert.ok(s.act('real-note','note',{text:'Keep this notebook entry.'}).ok);
 for(let i=0;i<200;i++)s.event('note','CPU-owned history marker '+i);
 const original=s.snapshot();let state=original;
 for(let i=0;i<67;i++){const loaded=new C.Simulation(state,{hydrated:true});loaded.tick(0);state=loaded.snapshot();}
 assert.deepEqual(state,original);assert.equal(state.journal.length,200);assert.equal(state.notes[0].text,'Keep this notebook entry.');assert.ok(C.validate(state));
});
test('hydrated live supper and gathering transitions still announce and move on supported paths',()=>{
 const s=new C.Simulation(warmed(),{hydrated:true});s.tick(0);const start=s.state.nextEvent;s.setTime(19);s.tick(0);
 assert.equal(s.state.nextEvent,start+3);assert.ok(s.state.journal.slice(-3).every(e=>e.kind==='routine'&&e.text.endsWith('family house.')));validPaths(s);
 const same=s.snapshot();s.tick(0);assert.deepEqual(s.snapshot(),same);
 for(let i=0;i<3000;i++)s.tick(.05);assert.ok([...s.runs.values()].every(r=>r.goal==='home'&&r.inside));
 // Authored stage point in a CPU-owned canonical fixture, not native movement.
 const raw=C.fresh();raw.player={x:0,z:-11.6,yaw:0};raw.settings.timeFlow=false;const g=new C.Simulation(raw,{hydrated:true});g.tick(0);
 assert.ok(g.act('invite','gather').ok);const invited=g.state.nextEvent;g.tick(0);assert.equal(g.state.nextEvent,invited+3);assert.ok([...g.runs.values()].every(r=>r.goal==='stage'&&r.cue));validPaths(g);
 const stable=g.snapshot();g.tick(0);assert.deepEqual(g.snapshot(),stable);assert.ok(g.act('finish','end-gathering').ok);const ended=g.state.nextEvent;g.tick(0);assert.equal(g.state.nextEvent,ended+3);assert.ok([...g.runs.values()].every(r=>r.cue===false));validPaths(g);
});
test('pause and strict hydration intent do not add saved fields or bypass canonical validation',()=>{
 const state=warmed(),s=new C.Simulation(state,{hydrated:true});s.paused=true;const before=s.snapshot();s.tick(.1);assert.deepEqual(s.snapshot(),before);s.paused=false;s.tick(0);assert.deepEqual(s.snapshot(),before);
 assert.deepEqual(Object.keys(s.snapshot()),Object.keys(state));assert.equal(s.snapshot().version,C.VERSION);
 for(const hydrated of ['loaded',1,null])assert.throws(()=>new C.Simulation(state,{hydrated}));
 const invalid=copy(state);invalid.player.x=900;assert.throws(()=>new C.Simulation(invalid,{hydrated:true}),/Invalid save/);
});
test('actual App startup uses Store load status for new loaded migrated and blocked worlds',()=>{
 for(const kind of ['new','loaded','migrated','managed','blocked']){
  const state=kind==='managed'?warmed():C.fresh();state.settings.timeFlow=false;
  const entries=kind==='new'?[]:kind==='managed'?[[CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:state}]})]]:kind==='blocked'?[[C.KEY,'{bad']]:[[kind==='migrated'?C.LEGACY_KEY:C.KEY,JSON.stringify(state)]];
  const storage=memory(entries),store=new CH.Store(storage),initial=copy([...storage.data]);const {loaded,sim}=boot(store);const before=sim.snapshot();sim.tick(0);
  assert.equal(sim.state.nextEvent,before.nextEvent+(kind==='new'?3:0),kind);assert.equal(loaded.status,kind==='managed'?'loaded':kind==='blocked'?'unavailable-or-corrupt':kind);assert.deepEqual([...storage.data],initial,'startup cannot write storage');
  if(kind==='blocked')assert.equal(store.blocked,true);
 }
});
test('actual App explicit create is fresh and character return and empty-world import hydrate',async()=>{
 const storage=memory(),store=new CH.Store(storage);const loaded=store.load();store.writer=true;const h=host(store,loaded.state);
 assert.ok((await h.characterAction('create',{visitor:X.freshVisitor()},0)).ok);h.env.sim.tick(0);assert.equal(h.env.sim.state.journal.length,3);const created=h.env.sim.snapshot();
 assert.ok((await h.characterAction('switch',{id:'character-1'},store.revision)).ok);h.env.sim.tick(0);assert.equal(h.env.sim.state.journal.length,0,'empty existing owner is still a load');
 assert.ok((await h.characterAction('switch',{id:'character-2'},store.revision)).ok);h.env.sim.tick(0);assert.deepEqual(h.env.sim.snapshot(),created,'full actual library owner return preserves history');
 const untouched=C.fresh();assert.ok((await h.characterAction('import',{world:untouched},store.revision)).ok);h.env.sim.tick(0);assert.equal(h.env.sim.state.journal.length,0,'empty imported history is not fresh intent');assert.equal(store.active,'character-3');assert.ok(CH.validate(JSON.parse(storage.getItem(CH.KEY))));
 assert.equal(h.env.keys.size,0);assert.equal(h.env.pointers.size,0);assert.equal(h.calls.filter(c=>c==='audio.disable').length,4);assert.equal(h.calls.filter(c=>c==='switchScene').length,4);
});
test('actual single-world UI reset starts fresh while ordinary legacy import hydrates',async()=>{
 const storage=memory(),store=new CH.Store(storage);store.load();store.writer=true;const h=host(store,warmed());
 await h.replaceLegacyWorld(C.fresh());h.env.sim.tick(0);assert.equal(h.env.sim.state.journal.length,0,'portable empty import has loaded intent');
 h.reset();h.env.sim.tick(0);assert.equal(h.env.sim.state.journal.length,3,'explicit reset is fresh');assert.equal(h.env.sim.state.nextEvent,4);assert.equal(store.managed,false);assert.ok(C.validate(JSON.parse(storage.getItem(C.KEY))));
});

test('hydrated first live frames preserve appearance and natural clock and gathering expiry transitions',()=>{
 for(const hour of [0,5.9,6,10,17.2,18.9,19,23.9]){
  const state=C.fresh();state.hour=hour;state.settings.timeFlow=false;
  const ordinary=new C.Simulation(state),loaded=new C.Simulation(state,{hydrated:true});
  assert.deepEqual(loaded.snapshot(),state,'construction cannot turn or move residents');
  ordinary.tick(.05);loaded.tick(.05);assert.deepEqual(outsideHistory(loaded.snapshot()),outsideHistory(ordinary.snapshot()));assert.deepEqual(view(loaded),view(ordinary));assert.equal(ordinary.state.nextEvent,loaded.state.nextEvent+3);validPaths(loaded);
 }
 const transition=C.fresh();transition.hour=18.39999;transition.settings.timeFlow=true;
 const ordinary=new C.Simulation(transition),loaded=new C.Simulation(transition,{hydrated:true});ordinary.tick(.05);loaded.tick(.05);
 assert.deepEqual(loaded.snapshot(),ordinary.snapshot(),'a real first-frame supper boundary is still announced');assert.equal(loaded.state.nextEvent,transition.nextEvent+3);validPaths(loaded);
 const raw=C.fresh();raw.player={x:0,z:-11.6,yaw:0};raw.settings.timeFlow=false;
 const g=new C.Simulation(raw,{hydrated:true});assert.ok(g.act('expiry-invite','gather').ok);g.tick(0);const start=g.state.nextEvent;
 for(let i=0;i<1801;i++)g.tick(.1);
 assert.equal(g.gathering,null);assert.equal(g.state.nextEvent,start+4,'one genuine expiry and three genuine ordinary route cues');assert.equal(g.state.journal.slice(-4)[0].kind,'gathering');assert.ok(g.state.journal.slice(-3).every(e=>e.kind==='routine'));assert.ok([...g.runs.values()].every(r=>r.cue===false));validPaths(g);
});
