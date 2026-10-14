/* Real rule/App hooks and real memory Store. Synthetic bond boundaries,
 * supported navigation and ticks; no native keyboard/pixel qualification. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),A=require('../src/adventure.js'),B=require('../src/briar-outing.js');
const CS=require('../src/characters.js');
const {appHost}=require('./briar_outing_journey.cjs');
const source=fs.readFileSync(require.resolve('../src/app.js'),'utf8');
const line=name=>source.split(/\r?\n/).find(s=>s.startsWith('function '+name+'('));
function fixture(){
 const world=C.fresh();world.adventure.started=true;world.adventure.companion.bonded=true;
 const h=appHost(world),legacy=[];
 const env={get sim(){return h.sim;},briarInteract:()=>h.app.interact(),
  rpg:{interact(){legacy.push('rpg');return false;}},adventure:{interact(){legacy.push('adventure');return false;}},
  sandbox:{interact(){legacy.push('sandbox');return false;}},closest:()=>C.LANDMARKS.find(l=>l.id==='home'),
  action:id=>{legacy.push(id);assert.ok(h.sim.enter(id).ok);},switchScene(){},save(){},toast(){}};
 vm.createContext(env);vm.runInContext(line('interact'),env);
 env.RealmBriarOuting=B;env.briarContext=h.app.context;
 env.rpg.open=tab=>legacy.push('open:'+tab);
 vm.runInContext(source.slice(source.indexOf('function contextInteract('),source.indexOf('// Parent app owns this transient lease independently',source.indexOf('function contextInteract('))),env);
 const ready=()=>{h.walk(B.definition.home);h.command('start');h.accompany('await-take');h.walk(B.definition.home);h.command('take');h.walk(B.definition.home);h.command('rest');h.accompany('settled');h.walk(C.LANDMARKS.find(q=>q.id==='home'));};
 return{h,legacy,env,ready};
}
test('context button click opens the current account for guidance and executes only current arrival',()=>{
 const f=fixture();f.h.walk(B.definition.home);f.h.command('start');const before=f.h.sim.snapshot();
 f.env.contextInteract();assert.equal(f.legacy.at(-1),'open:companion');assert.deepEqual(f.h.sim.snapshot(),before);
 f.h.accompany('await-take');f.h.walk(B.definition.home);const writes=f.h.writes;
 f.env.contextInteract();assert.equal(f.h.writes,writes+1);assert.equal(f.h.sim.state.briarMoments.revision,1);
 assert.equal(B.prompt(f.h.app.context()),null); // No reminder inferred from historical cloth alone.
});
test('actual App keyboard callback protects dialogs, typed text and repeated E before contextual writing',()=>{
 const f=fixture();f.ready();let callback,dialog=false;
 f.env.window={addEventListener(name,fn){assert.equal(name,'keydown');callback=fn;}};
 f.env.document={querySelector:()=>dialog?{}:null};f.env.panel=null;
 f.env.rpg.key=()=>false;f.env.adventure.key=()=>false;f.env.sandbox.key=()=>false;
 vm.runInContext(source.slice(source.indexOf("window.addEventListener('keydown',e=>{"),source.indexOf("window.addEventListener('keyup'")),f.env);
 const key=(tagName='CANVAS',repeat=false)=>({key:'e',target:{tagName},repeat,preventDefault(){}});
 const before=f.h.sim.snapshot(),writes=f.h.writes;
 for(const tag of ['INPUT','TEXTAREA','SELECT'])callback(key(tag));
 dialog=true;callback(key());dialog=false;callback(key('CANVAS',true));
 assert.deepEqual(f.h.sim.snapshot(),before);assert.equal(f.h.writes,writes);assert.deepEqual(f.legacy,[]);
 callback(key());assert.equal(f.h.sim.room,null);assert.equal(f.h.sim.state.briarMoments.revision,2);assert.equal(f.h.writes,writes+1);
});
test('actual HUD projection shows live guidance, then E arrival and resets its badge after cancel',()=>{
 const f=fixture(),nodes=new Map(),el=selector=>{if(!nodes.has(selector))nodes.set(selector,{style:{},setAttribute(){}});return nodes.get(selector);};
 f.env.document={querySelector:el};f.env.$=el;f.env.camera={tour:false};f.env.formatHour=String;
 Object.assign(f.env,{C,RealmAdventure:A,RealmWorldFoundations:global.RealmWorldFoundations,
  RealmEarth:global.RealmEarth,RealmCosmos:global.RealmCosmos,RealmBeacon:global.RealmBeacon,
  engine:null,fps:0,mapDraw(){},renderStatus(){}});
 for(const name of ['worlds','earth','cosmos','starter','crossing','masterwork','tournament','gate'])f.env.rpg[name]={context:()=>null};
 f.env.adventure.context=()=>null;f.env.sandbox.context=()=>null;
 vm.runInContext(line('refreshUI'),f.env);
 f.h.walk(B.definition.home);f.h.command('start');f.env.refreshUI();
 assert.equal(el('#context').style.display,'flex');assert.equal(el('#context kbd').hidden,true);
 assert.match(el('#context-text').textContent,/Walk beside Briar/);
 f.h.accompany('await-take');f.h.walk(B.definition.home);const before=f.h.sim.snapshot();f.env.refreshUI();
 assert.equal(el('#context kbd').hidden,false);assert.equal(el('#context kbd').textContent,'E');
 assert.match(el('#context-text').textContent,/Take the cloth/);assert.deepEqual(f.h.sim.snapshot(),before);
 f.h.command('cancel');f.env.refreshUI();assert.equal(el('#context kbd').hidden,false);
 assert.equal(el('#context-text').textContent,C.LANDMARKS.find(l=>l.id==='home').action);
});
test('E at the arrived doorstep records the moment instead of entering the overlapping house',()=>{
 const f=fixture();f.ready();const writes=f.h.writes;
 f.env.interact();assert.equal(f.h.sim.room,null);assert.deepEqual(f.legacy,[]);
 assert.deepEqual(f.h.sim.state.briarMoments.moments,['briar-cloth-home-v1','briar-commons-rest-v1']);
 assert.equal(f.h.writes,writes+1);assert.equal(B.current(f.h.app.context()).phase,'rested');
 f.env.interact();assert.equal(f.h.sim.room,null);assert.equal(f.h.writes,writes+1);
 assert.equal(B.current(f.h.app.context()),null);
 f.env.interact();assert.equal(f.h.sim.room,'home');assert.equal(f.legacy.at(-1),'home');
});
test('out-of-range E gives current guidance, preserves arrival, and cannot enter the house',()=>{
 const f=fixture();f.ready();f.h.walk({x:B.definition.rest.x,z:B.definition.rest.z+3.1});
 const before=JSON.stringify(f.h.sim.snapshot()),writes=f.h.writes;
 const p=B.prompt(f.h.app.context());assert.equal(p.action,null);assert.match(p.text,/beside|closer/);
 f.env.interact();assert.equal(JSON.stringify(f.h.sim.snapshot()),before);assert.equal(f.h.writes,writes);
 assert.equal(f.h.sim.room,null);assert.deepEqual(f.legacy,[]);
 f.h.walk(C.LANDMARKS.find(q=>q.id==='home'));assert.equal(B.prompt(f.h.app.context()).action,'remember');
});
test('waiting and paused guidance have no implicit action, save, tracker or camera change',()=>{
 const f=fixture();f.h.walk(B.definition.home);f.h.command('start');f.h.walk({x:20,z:8});
 assert.equal(B.current(f.h.app.context()).waiting,true);const before=f.h.sim.snapshot(),writes=f.h.writes;
 assert.match(B.prompt(f.h.app.context()).text,/waiting/i);f.env.interact();
 assert.deepEqual(f.h.sim.snapshot(),before);assert.equal(f.h.writes,writes);assert.deepEqual(f.legacy,[]);
 f.h.sim.paused=true;assert.equal(B.prompt(f.h.app.context()).action,null);f.env.interact();
 assert.equal(f.h.sim.paused,true);assert.equal(f.h.writes,writes);
});
test('a known refused contextual save remains arrived and explicitly retryable',()=>{
 const f=fixture();f.ready();const before=f.h.sim.snapshot(),writes=f.h.writes;
 f.h.store.writer=false;f.env.interact();assert.deepEqual(f.h.sim.snapshot(),before);
 assert.equal(f.h.writes,writes);assert.equal(B.current(f.h.app.context()).phase,'settled');
 f.h.store.writer=true;f.env.interact();assert.equal(f.h.writes,writes+1);assert.equal(f.h.sim.state.briarMoments.revision,2);
});
test('post-write uncertainty shows readback guidance and consumes E without another write or entry',()=>{
 const f=fixture();f.ready();const store=f.h.store,save=store.save.bind(store);
 store.save=world=>{assert.ok(save(world).ok);throw Error('SYNTHETIC throw after actual memory Store write');};
 f.env.interact();assert.equal(B.saveAllowed(f.h.sim),false);const writes=f.h.writes;
 assert.equal(B.prompt(f.h.app.context()).action,null);assert.match(B.prompt(f.h.app.context()).text,/reload|saved/i);
 f.env.interact();assert.equal(f.h.writes,writes);assert.equal(f.h.sim.room,null);assert.deepEqual(f.legacy,[]);
 assert.equal(f.h.sim.state.briarMoments.revision,1);assert.equal(store.record.slots.find(s=>s.id===store.active).world.briarMoments.revision,2);
});
test('changed owner after a contextual Store write leaves the saved fact and blocks its older local snapshot',()=>{
 const f=fixture();f.ready();const original=f.h.store,save=original.save.bind(original);
 original.save=world=>{const result=save(world);const replacement=new CS.Store({getItem:()=>null,setItem(){throw Error('No write to replacement owner');}});replacement.load();f.h.env.characterStore=replacement;return result;};
 f.env.interact();assert.equal(f.h.sim.room,null);assert.equal(f.h.sim.state.briarMoments.revision,1);
 assert.equal(original.record.slots.find(s=>s.id===original.active).world.briarMoments.revision,2);
 assert.equal(B.saveAllowed(f.h.sim),false);const writes=f.h.writes;
 const refused=f.h.app.save(f.h.sim.snapshot());assert.equal(refused.ok,false);assert.match(refused.error,/not adopted|not.*adopted|changed local owner/);
 assert.equal(f.h.writes,writes);assert.equal(B.prompt(f.h.app.context()),null);
});
test('completed history alone, cancel, reload and changed owner cannot invent a live contextual action',()=>{
 const f=fixture();f.ready();f.env.interact();assert.equal(B.prompt(f.h.app.context()).action,'cancel');
 f.h.command('cancel');assert.equal(B.prompt(f.h.app.context()),null);f.h.reload();assert.equal(B.prompt(f.h.app.context()),null);
 f.h.walk(B.definition.home);f.h.command('rest');assert.ok(B.prompt(f.h.app.context()));
 const otherStore=new CS.Store({getItem:()=>null,setItem(){}});otherStore.load();
 f.h.env.characterStore=otherStore;assert.equal(B.prompt(f.h.app.context()),null);
});
