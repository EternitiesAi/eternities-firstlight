'use strict';
/* Installed-module CPU regressions. Prior paid road/load facts, initial work
 * poses and owned input/frame issuers are labelled synthetic boundary fixtures.
 * Core/World/CharacterStore, physical ticks and private Motion/Art execute the
 * actual loaded modules. No native event, pixels or earned prerequisite claim.
 * Ported from frozen proposal test71d8ed41; no positive validator facade. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js'));
const E=require(path.join(ROOT,'src/earth-expedition.js')),CD=require(path.join(ROOT,'src/earth-consignment-data.js'));
const D=require(path.join(ROOT,'src/earth-wild-signs-data.js')),R=require(path.join(ROOT,'src/earth-wild-signs.js'));
require(path.join(ROOT,'src/engine.js'));
const O=require(path.join(ROOT,'src/earth-grazer-motion.js')),Art=require(path.join(ROOT,'src/earth-grazer-art.js'));
const CH=require(path.join(ROOT,'src/characters.js')),A=globalThis.RealmAdventure;
const copy=o=>JSON.parse(JSON.stringify(o)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// A missing actual Core owner must fail instead of receiving an adapted validator.
assert.ok(Object.hasOwn(C.fresh(),'earthWildSigns'),'Install the actual Core signs owner.');
function syntheticPaidWorld(){
 const raw=C.fresh();raw.adventure.started=true;raw.player={x:W.GATE.x,z:W.GATE.z,yaw:0};
 raw.earthExpedition={version:1,story:{accepted:true,branch:'stormfall-recovery',steps:E.definition.steps.map(s=>s.id),claimed:true},patrol:{lastClaim:0,active:null}};
 raw.localLife.records[CD.ID]={accepted:true,choice:'south-stormfall',steps:CD.required('south-stormfall').slice(),claimed:true};
 raw.earthWildSigns=D.fresh();return C.validate(raw);
}
function fixture(options={}){
 const raw=syntheticPaidWorld();raw.earthWildSigns=copy(options.record||D.fresh());
 if(options.coins!==undefined)raw.adventure.coins=options.coins;if(options.fiber!==undefined)raw.sandbox.inventory.fiber=options.fiber;
 const map=new Map([[CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:C.validate(raw)}]})]]);
 const storage={failWrite:false,getItem:k=>map.has(k)?map.get(k):null,setItem(k,v){if(this.failWrite)throw Error('Labelled CPU quota refusal');map.set(k,v);}};
 const store=new CH.Store(storage),loaded=store.load();assert.equal(loaded.status,'loaded');store.writer=true;
 const sim=new C.Simulation(loaded.state);
 const base=()=>({sim,active:store.active,revision:store.revision});
 const trip=W.preview(base(),'earthlands');assert.ok(trip.ok,trip.error);assert.ok(W.enter(trip.ticket,base(),{save:v=>store.save(v),build(){}}).ok);
 // Initial work-point placement is a synthetic boundary pose. Whole-walk
 // composition below uses real moveTo/Core.tick for subsequent approaches.
 sim.state.player={x:D.giver.x,z:D.giver.z,yaw:0};sim.wildSignsOwnerLease=Object.freeze({});sim.grazerOwnerLease=Object.freeze({});
 const f={sim,store,storage,calls:0};
 f.gc=extra=>({...base(),ownerLease:sim.grazerOwnerLease,path:O.PATH,hidden:false,...extra});
 f.ctx=()=>({...base(),definition:D.definition,ownerLease:sim.wildSignsOwnerLease,grazerContext:()=>f.gc(),sceneSignature:A.runtime(sim).trailSignature});
 f.save=v=>{f.calls++;return store.save(v);};f.io={save:f.save,sync(){}};
 f.run=(type,payload={},io=f.io)=>R.command(f.ctx(),type,{quest:D.ID,...payload},io);
 f.raw=()=>storage.getItem(CH.KEY);f.state=()=>JSON.stringify(sim.state);
 f.pose=p=>{assert.ok(W.walkable(D.ROOM,p.x,p.z,.31));sim.state.player={x:p.x,z:p.z,yaw:0};};
 f.tick=(dt=.1)=>{sim.tick(dt);return O.current(f.gc())?O.tick(f.gc(),dt):null;};
 return f;
}
function refused(f,run,saveAttempt=false){const state=f.state(),raw=f.raw(),calls=f.calls,result=run();assert.equal(result.ok,false,result.text);assert.equal(f.state(),state);assert.equal(f.raw(),raw);if(!saveAttempt)assert.equal(f.calls,calls);return result;}
function accept(f){const r=f.run('accept');assert.ok(r.ok,r.error);return r;}
function readPair(f,reverse=false){accept(f);for(const p of reverse?D.evidence.slice(0,2).reverse():D.evidence.slice(0,2)){f.pose(p);const r=f.run('read',{evidence:p.id});assert.ok(r.ok,r.error);}f.pose(D.overlook);}
function tickPresented(f,visible=true){
 const step=f.tick();assert.ok(step?.ok,step?.error);const gc=f.gc(),view=O.current(gc);assert.ok(view);
 const out={box:[],round:[],octa:[]},submission=Art.draw(out,view,gc,{quality:'low'});assert.ok(submission);
 f.sim.grazerPresentedFrame=Object.freeze({});
 const ack=O.acknowledge(f.gc({presentedFrame:f.sim.grazerPresentedFrame,visible,menuOpen:false,camera:'adventure'}),submission);
 return{ack,view};
}
function witnessedTicket(f){
 assert.ok(O.begin(f.gc()).ok);
 for(let n=0;n<500;n++){const {ack}=tickPresented(f);assert.ok(ack.ok,ack.error);if(ack.observedBehavior){f.sim.grazerNativeIntent=Object.freeze({});const ticket=O.observationTicket(f.gc({inputStamp:f.sim.grazerNativeIntent}));assert.ok(ticket);return ticket;}}
 assert.fail('Actual staged browse phases did not produce the labelled CPU witness');
}
function observed(f){readPair(f);const ticket=witnessedTicket(f),r=f.run('observe',{observationTicket:ticket});assert.ok(r.ok,r.error);assert.equal(r.warning,undefined);return ticket;}
function compared(f){observed(f);f.pose(D.evidence[2]);assert.ok(f.run('read',{evidence:'pest-scrape'}).ok);}
function chosenRecord(resolution='signed-loop'){return{version:1,accepted:true,evidence:['timber-gouge','feeding-track','pest-scrape'],observed:true,resolution,cleared:false,claimed:false};}
function canonicalDeadEntry(f){
 // Rules-only dead-state boundary: obtain the actual installed canonical roster
 // entry, then set its HP to zero. Combat tests separately earn genuine damage.
 A.syncScene(f.sim);const rt=A.runtime(f.sim),entries=rt.enemies.filter(e=>e.id===D.enemy.id);
 if(!entries.length){
  // Signed-loop negative deliberately supplies a non-roster lookalike; it must
  // fail before saving and is never inserted or used as a positive death fact.
  assert.equal(f.sim.state.earthWildSigns.resolution,'signed-loop');
  return{...copy(D.enemy),hp:0,maxHP:D.enemy.hp,originX:D.enemy.x,originZ:D.enemy.z,home:{x:D.enemy.x,z:D.enemy.z},wildSignsQuest:D.ID,wildSignsOwnerLease:f.sim.wildSignsOwnerLease};
 }
 assert.equal(entries.length,1);const e=entries[0];e.hp=0;return e;
}
function protectedFacts(f){const s=copy(f.sim.state);delete s.earthWildSigns;delete s.journal;delete s.nextEvent;delete s.adventure.revision;delete s.adventure.coins;delete s.sandbox.inventory.fiber;return s;}

test('optional owner migration is literal fresh and independent; data/geometry/fee are immutable',()=>{
 const a=D.validate(undefined),b=D.fresh();assert.deepEqual(a,{version:1,accepted:false,evidence:[],observed:false,resolution:null,cleared:false,claimed:false});a.evidence.push('changed');assert.deepEqual(b.evidence,[]);
 assert.deepEqual(D.definition.reward,{xp:0,coins:4,ore:0,materials:{fiber:3}});assert.equal(Object.isFrozen(D.evidence[0]),true);assert.equal(Object.isFrozen(D.bypass[1]),true);assert.equal(globalThis.RealmLocalLife.definitions.length,5);
});
test('exact owner refuses unknown/future/null/partial/sparse/symbol histories',()=>{
 for(const value of [null,{}, {...D.fresh(),version:2},{...D.fresh(),future:true},{...D.fresh(),accepted:1},{...D.fresh(),evidence:Array(1)},{...D.fresh(),evidence:['future']}])assert.throws(()=>D.validate(value));
 const symbol=D.fresh();symbol[Symbol('future')]=true;assert.throws(()=>D.validate(symbol));const extra=D.fresh();extra.evidence.extra=true;assert.throws(()=>D.validate(extra));
});
test('first two evidence reads allow either order; observation/scrape/resolution/payment prerequisites are strict',()=>{
 for(const ids of [['timber-gouge','feeding-track'],['feeding-track','timber-gouge']])assert.deepEqual(D.validate({...D.fresh(),accepted:true,evidence:ids,observed:true}).evidence,ids);
 for(const value of [{...D.fresh(),observed:true},{...D.fresh(),accepted:true,evidence:['timber-gouge'],observed:true},{...D.fresh(),accepted:true,evidence:['pest-scrape']}, {...chosenRecord(),evidence:['pest-scrape','timber-gouge','feeding-track']},{...chosenRecord(),cleared:true},{...chosenRecord('cleared-pocket'),claimed:true},{...chosenRecord(),resolution:'future'}])assert.throws(()=>D.validate(value));
 assert.ok(D.ready(chosenRecord()));assert.equal(D.ready(chosenRecord('cleared-pocket')),false);assert.ok(D.ready({...chosenRecord('cleared-pocket'),cleared:true}));
});
test('invitation requires the separately claimed fifth load, including immutable original branch provenance',()=>{
 const s=syntheticPaidWorld();assert.ok(D.eligible(s));s.localLife.records[CD.ID].claimed=false;assert.equal(D.eligible(s),false);assert.throws(()=>D.crossValidate({...D.fresh(),accepted:true},s));
 s.localLife.records[CD.ID].claimed=true;s.earthExpedition.story.branch='managed-coppice';assert.equal(D.eligible(s),false);
});
test('accept saves only its new owner/revision/journal and preserves mutable ordinary events',()=>{
 const f=fixture(),old=protectedFacts(f),inv=copy(f.sim.state.sandbox.inventory),a=copy(f.sim.state.adventure),home=copy(f.sim.returnPos);accept(f);
 assert.deepEqual(protectedFacts(f),old);assert.deepEqual(f.sim.state.sandbox.inventory,inv);assert.equal(f.sim.state.adventure.coins,a.coins);assert.equal(f.sim.state.adventure.xp,a.xp);assert.equal(f.sim.state.adventure.revision,a.revision+1);assert.deepEqual(f.sim.returnPos,home);
 assert.equal(Object.isFrozen(f.sim.state.journal),false);assert.doesNotThrow(()=>f.sim.event('cpu-check','Labelled ordinary event after adoption.'));const calls=f.calls;assert.ok(f.run('accept').duplicate);assert.equal(f.calls,calls);
});
test('remote invitation and malformed owner/trip/death/module contexts fail without a writer call',()=>{
 const f=fixture();f.pose(D.overlook);refused(f,()=>f.run('accept'));f.pose(D.giver);
 for(const extra of [{ownerLease:Object.freeze({})},{ownerLease:undefined},{active:'other'},{revision:-1},{definition:{id:D.ID}}])refused(f,()=>R.command({...f.ctx(),...extra},'accept',{quest:D.ID},f.io));
 const hp=f.sim.state.adventure.hp;f.sim.state.adventure.hp=0;refused(f,()=>f.run('accept'));f.sim.state.adventure.hp=hp;
 const trip=f.sim.worldTrip;f.sim.worldTrip={...trip,home:{...trip.home,x:trip.home.x+1}};refused(f,()=>f.run('accept'));f.sim.worldTrip=trip;
 const real=globalThis.RealmCore;try{globalThis.RealmCore={};refused(f,()=>f.run('accept'));}finally{globalThis.RealmCore=real;}
});
test('bare generic work, unknown marks and early pest comparison cannot advance either order',()=>{
 for(const reverse of [false,true]){const f=fixture();readPair(f,reverse);assert.deepEqual(f.sim.state.earthWildSigns.evidence,reverse?['feeding-track','timber-gouge']:['timber-gouge','feeding-track']);
  refused(f,()=>f.run('step',{evidence:'pest-scrape'}));refused(f,()=>f.run('read',{evidence:'unknown'}));f.pose(D.evidence[2]);refused(f,()=>f.run('read',{evidence:'pest-scrape'}));}
});
test('wrong proximity and blocked signed-loop support refuse instead of stamping remote work',()=>{
 const f=fixture();accept(f);refused(f,()=>f.run('read',{evidence:'timber-gouge'}));
 const g=fixture({record:chosenRecord()});g.sim.state.earthWildSigns.resolution=null;g.pose(D.evidence[2]);const real=globalThis.RealmWorldFoundations;
 try{globalThis.RealmWorldFoundations={...real,segment(room,a,b,r){return r===.65?false:real.segment(room,a,b,r);}};refused(g,()=>g.run('choose',{resolution:'signed-loop'}));}finally{globalThis.RealmWorldFoundations=real;}
});
test('lossy real snapshot or Core result refuses before durable save',()=>{
 const f=fixture(),snapshot=f.sim.snapshot;f.sim.snapshot=()=>{const s=snapshot();delete s.earthWildSigns;return s;};refused(f,()=>f.run('accept'));f.sim.snapshot=snapshot;
 const current=C.validate;try{C.validate=raw=>{const s=current(raw);s.earthExpedition.story.claimed=false;return s;};refused(f,()=>f.run('accept'));}finally{C.validate=current;}
});
test('boolean, clone, public projection and unused shape cannot become observation proof',()=>{
 const f=fixture();readPair(f);assert.ok(O.begin(f.gc()).ok);
 for(const observationTicket of [true,{},Object.freeze({}),O.current(f.gc())])refused(f,()=>f.run('observe',{observationTicket}));
 const ticket=witnessedTicket(f);refused(f,()=>f.run('observe',{observationTicket:copy(ticket)}));assert.ok(O.validateObservation(f.gc(),ticket).ok);
});
test('menu time and invisible submissions never manufacture a witness',()=>{
 const f=fixture();readPair(f);assert.ok(O.begin(f.gc()).ok);f.sim.paused=true;
 for(let n=0;n<10;n++){f.sim.tick(.1);assert.ok(O.tick(f.gc(),.1).ok);}f.sim.grazerNativeIntent=Object.freeze({});assert.equal(O.observationTicket(f.gc({inputStamp:f.sim.grazerNativeIntent})),null);
 f.sim.paused=false;for(let n=0;n<120;n++)assert.equal(tickPresented(f,false).ack.ok,false);
 f.sim.grazerNativeIntent=Object.freeze({});assert.equal(O.observationTicket(f.gc({inputStamp:f.sim.grazerNativeIntent})),null);
});
test('genuine CPU-branded visible browse saves once, consumes after adoption and precedes scene sync',()=>{
 const f=fixture();readPair(f);const ticket=witnessedTicket(f),events=[],real=globalThis.RealmEarthGrazerMotion,old=protectedFacts(f);
 globalThis.RealmEarthGrazerMotion={...real,consumeObservation(gc,t){events.push('consume');assert.equal(gc.sim.state.earthWildSigns.observed,true);return real.consumeObservation(gc,t);}};
 try{const r=f.run('observe',{observationTicket:ticket},{save(v){events.push('save');return f.save(v);},sync(){events.push('sync');}});assert.ok(r.ok,r.error);assert.equal(r.warning,undefined);}finally{globalThis.RealmEarthGrazerMotion=real;}
 assert.deepEqual(events,['save','consume','sync']);assert.deepEqual(protectedFacts(f),old);assert.equal(O.validateObservation(f.gc(),ticket).ok,false);const raw=f.raw(),calls=f.calls;assert.ok(f.run('observe',{observationTicket:ticket}).duplicate);assert.equal(f.raw(),raw);assert.equal(f.calls,calls);
});
test('actual Store quota refusal retains ready observation for a paused same-owner retry',()=>{
 const f=fixture();readPair(f);const ticket=witnessedTicket(f);f.sim.paused=true;f.storage.failWrite=true;refused(f,()=>f.run('observe',{observationTicket:ticket}),true);assert.ok(O.validateObservation(f.gc(),ticket).ok);
 f.storage.failWrite=false;assert.ok(f.run('observe',{observationTicket:ticket}).ok);assert.equal(O.validateObservation(f.gc(),ticket).ok,false);assert.equal(f.sim.state.earthWildSigns.observed,true);
});
test('actual Store clock and both camera saves preserve a real ready ticket and distinct leases',()=>{
 const f=fixture();readPair(f);const ticket=witnessedTicket(f),wild=f.sim.wildSignsOwnerLease,grazer=f.sim.grazerOwnerLease,rev=f.store.revision;
 for(const mode of ['follow','adventure']){f.sim.state.settings.cameraMode=mode;assert.ok(f.store.save(f.sim.snapshot()).ok);}f.sim.state.hour+=.1;assert.ok(f.store.save(f.sim.snapshot()).ok);
 assert.ok(f.store.revision>rev);assert.strictEqual(f.sim.wildSignsOwnerLease,wild);assert.strictEqual(f.sim.grazerOwnerLease,grazer);assert.ok(O.validateObservation(f.gc(),ticket).ok);assert.ok(f.run('observe',{observationTicket:ticket}).ok);
});
test('stale actual writer source and missing writer refuse without consuming a ready proof',()=>{
 const f=fixture();readPair(f);const ticket=witnessedTicket(f);f.store.writer=false;refused(f,()=>f.run('observe',{observationTicket:ticket}),true);assert.ok(O.validateObservation(f.gc(),ticket).ok);f.store.writer=true;
 const external=JSON.parse(f.raw());external.revision++;f.storage.setItem(CH.KEY,JSON.stringify(external));refused(f,()=>f.run('observe',{observationTicket:ticket}),true);assert.equal(f.store.blocked,true);assert.ok(O.validateObservation(f.gc(),ticket).ok);
});
test('missing observation owner, stale/copied grazer lease, import/travel/death fences reject ready proof',()=>{
 for(const mode of ['missing','factory-copy','import','travel','dead','lease']){const f=fixture();readPair(f);const ticket=witnessedTicket(f),real=globalThis.RealmEarthGrazerMotion;
  try{let ctx=f.ctx();if(mode==='missing')globalThis.RealmEarthGrazerMotion=undefined;
   if(mode==='factory-copy')ctx.grazerContext=()=>f.gc({ownerLease:Object.freeze({})});if(mode==='import')f.sim.state=copy(f.sim.state);if(mode==='travel')f.sim.room=null;if(mode==='dead')f.sim.state.adventure.hp=0;if(mode==='lease')f.sim.grazerOwnerLease=Object.freeze({});
   refused(f,()=>R.command(ctx,'observe',{quest:D.ID,observationTicket:ticket},f.io));
  }finally{globalThis.RealmEarthGrazerMotion=real;}}
});
test('async/throwing/mutating saver and record limits leave the real ready ticket unconsumed',()=>{
 const f=fixture();readPair(f);const ticket=witnessedTicket(f);
 for(const save of [async()=>({ok:true}),()=>Promise.resolve({ok:true}),()=>{throw Error('labelled saver throw');},v=>{v.earthWildSigns.observed=false;return{ok:true};}]){refused(f,()=>f.run('observe',{observationTicket:ticket},{save}));assert.ok(O.validateObservation(f.gc(),ticket).ok);}
 f.sim.state.adventure.revision=1e9;refused(f,()=>f.run('observe',{observationTicket:ticket}));assert.ok(O.validateObservation(f.gc(),ticket).ok);
});
test('durable observation cleanup/sync failures warn saved truth and cannot grant another fee',()=>{
 for(const mode of ['consume','sync']){const f=fixture();readPair(f);const ticket=witnessedTicket(f),real=globalThis.RealmEarthGrazerMotion;
  try{if(mode==='consume')globalThis.RealmEarthGrazerMotion={...real,consumeObservation(){throw Error('labelled cleanup fault');}};
   const r=f.run('observe',{observationTicket:ticket},{save:f.save,sync(){if(mode==='sync')throw Error('labelled sync fault');}});assert.ok(r.ok);assert.equal(r.error,undefined);assert.match(r.warning,/saved/);
  }finally{globalThis.RealmEarthGrazerMotion=real;}
  assert.equal(JSON.parse(f.raw()).slots[0].world.earthWildSigns.observed,true);assert.equal(f.sim.state.earthWildSigns.observed,true);const calls=f.calls;assert.ok(f.run('observe',{observationTicket:ticket}).duplicate);assert.equal(f.calls,calls);
 }
});
test('explicit resolution is immutable; signed-loop is ready without any enemy or generic defeat',()=>{
 const f=fixture();compared(f);assert.ok(f.run('choose',{resolution:'signed-loop'}).ok);assert.equal(D.ready(f.sim.state.earthWildSigns),true);assert.equal(f.sim.state.earthWildSigns.cleared,false);const state=f.state(),raw=f.raw();assert.ok(f.run('choose',{resolution:'signed-loop'}).duplicate);assert.equal(f.state(),state);assert.equal(f.raw(),raw);refused(f,()=>f.run('choose',{resolution:'cleared-pocket'}));
});
test('clearance refuses boolean/old/cloned/foreign/signed/alive/duplicate-scene entries',()=>{
 const f=fixture({record:chosenRecord('cleared-pocket')}),e=canonicalDeadEntry(f);f.pose(D.enemy);
 for(const wrong of [true,{},copy(e),{...e,id:'earthlands-coppice-skitter'},{...e,wildSignsOwnerLease:Object.freeze({})}])refused(f,()=>R.recordClearance(f.ctx(),wrong,f.io));
 e.hp=1;refused(f,()=>R.recordClearance(f.ctx(),e,f.io));e.hp=0;
 const rt=A.runtime(f.sim);rt.enemies.push({...e});refused(f,()=>R.recordClearance(f.ctx(),e,f.io));rt.enemies.pop();
 const g=fixture({record:chosenRecord()}),other=canonicalDeadEntry(g);g.pose(D.enemy);refused(g,()=>R.recordClearance(g.ctx(),other,g.io));
});
test('canonical scene and zero-reward metadata must all match before actual dead-entry clearance',()=>{
 for(const [key,bad]of [['radius',.8],['damage',99],['maxHP',99],['xp',1],['coins',1],['ore',1],['originX',-165],['wildSignsQuest','old-owner']]){const f=fixture({record:chosenRecord('cleared-pocket')}),e=canonicalDeadEntry(f);e[key]=bad;refused(f,()=>R.recordClearance(f.ctx(),e,f.io));}
 const f=fixture({record:chosenRecord('cleared-pocket')}),e=canonicalDeadEntry(f);refused(f,()=>R.recordClearance({...f.ctx(),sceneSignature:'old'},e,f.io));A.runtime(f.sim).trailSignature='old';refused(f,()=>R.recordClearance(f.ctx(),e,f.io));
});
test('pending real roster identity survives actual Store refusal; retreat/paused retry saves only clearance',()=>{
 const f=fixture({record:chosenRecord('cleared-pocket')}),e=canonicalDeadEntry(f),old=protectedFacts(f),ad=copy(f.sim.state.adventure),inv=copy(f.sim.state.sandbox.inventory);
 f.storage.failWrite=true;refused(f,()=>R.recordClearance(f.ctx(),e,f.io),true);assert.equal(e.hp,0);assert.ok(A.runtime(f.sim).enemies.includes(e));
 f.storage.failWrite=false;f.sim.paused=true;f.pose(D.giver);assert.ok(distance(f.sim.state.player,e)>22);
 const r=R.recordClearance(f.ctx(),e,f.io);assert.ok(r.ok,r.error);assert.equal(f.sim.state.earthWildSigns.cleared,true);assert.deepEqual(protectedFacts(f),old);assert.equal(f.sim.state.adventure.xp,ad.xp);assert.equal(f.sim.state.adventure.coins,ad.coins);assert.deepEqual(f.sim.state.sandbox.inventory,inv);
});
test('pending death cannot survive owner replacement, changed account or death before durable adoption',()=>{
 for(const mode of ['lease','state','account','death']){const f=fixture({record:chosenRecord('cleared-pocket')}),e=canonicalDeadEntry(f);f.storage.failWrite=true;refused(f,()=>R.recordClearance(f.ctx(),e,f.io),true);f.storage.failWrite=false;
  if(mode==='lease')f.sim.wildSignsOwnerLease=Object.freeze({});if(mode==='state')f.sim.state=copy(f.sim.state);if(mode==='account')f.sim.state.earthWildSigns.evidence.reverse();if(mode==='death')f.sim.state.adventure.hp=0;
  refused(f,()=>R.recordClearance(f.ctx(),e,f.io));
 }
});
test('whole payment capacity refuses coins/fibre atomically; exact limit pays once with zero XP/ore',()=>{
 for(const options of [{coins:9996},{fiber:997}]){const f=fixture({record:chosenRecord(),...options});refused(f,()=>f.run('claim'));assert.equal(f.sim.state.earthWildSigns.claimed,false);}
 const f=fixture({record:chosenRecord(),coins:9995,fiber:996}),old=protectedFacts(f),a=copy(f.sim.state.adventure);const r=f.run('claim');assert.ok(r.ok,r.error);assert.deepEqual(r.reward,D.definition.reward);assert.equal(f.sim.state.adventure.coins,9999);assert.equal(f.sim.state.sandbox.inventory.fiber,999);assert.equal(f.sim.state.adventure.xp,a.xp);assert.equal(f.sim.state.adventure.ore,a.ore);assert.deepEqual(protectedFacts(f),old);const raw=f.raw(),calls=f.calls;assert.ok(f.run('claim').duplicate);assert.equal(f.raw(),raw);assert.equal(f.calls,calls);
});
test('actual payment quota retry and cold paid duplicate preserve all original accounts and proof independence',()=>{
 const f=fixture({record:{...chosenRecord('cleared-pocket'),cleared:true}});f.storage.failWrite=true;refused(f,()=>f.run('claim'),true);f.storage.failWrite=false;assert.ok(f.run('claim').ok);const before=f.raw(),world=JSON.parse(before).slots[0].world,old=protectedFacts(f);
 const g=fixture({record:world.earthWildSigns,coins:world.adventure.coins,fiber:world.sandbox.inventory.fiber});const OReal=globalThis.RealmEarthGrazerMotion;
 try{globalThis.RealmEarthGrazerMotion=undefined;const calls=g.calls;assert.ok(g.run('claim').duplicate);assert.equal(g.calls,calls);}finally{globalThis.RealmEarthGrazerMotion=OReal;}
 assert.deepEqual(protectedFacts(f),old);assert.equal(f.raw(),before);
});
test('post-save owner change never applies outgoing completion to a different simulation state',()=>{
 const f=fixture(),original=f.sim.state;const r=f.run('accept',{}, {save(v){const saved=f.save(v);f.sim.state=copy(f.sim.state);return saved;}});
 assert.ok(r.ok);assert.equal(r.adopted,false);assert.match(r.warning,/saved/);assert.equal(original.earthWildSigns.accepted,false);assert.equal(f.sim.state.earthWildSigns.accepted,false);assert.equal(JSON.parse(f.raw()).slots[0].world.earthWildSigns.accepted,true);
});
test('actual Core movement composition reaches both marks, witnesses browse, signs bypass and returns for one fee',()=>{
 const f=fixture(),old=protectedFacts(f),xp=f.sim.state.adventure.xp,startElapsed=f.sim.elapsed;accept(f);
 const walk=p=>{assert.ok(f.sim.moveTo(p.x,p.z).ok);for(let n=0;n<2000&&distance(f.sim.state.player,p)>1e-8;n++)f.sim.tick(.1);assert.ok(distance(f.sim.state.player,p)<1e-8,'actual supported Core movement reached '+p.id);};
 for(const p of D.evidence.slice(0,2)){walk(p);assert.ok(f.run('read',{evidence:p.id}).ok);}walk(D.overlook);const ticket=witnessedTicket(f);assert.ok(f.run('observe',{observationTicket:ticket}).ok);walk(D.evidence[2]);assert.ok(f.run('read',{evidence:'pest-scrape'}).ok);assert.ok(f.run('choose',{resolution:'signed-loop'}).ok);walk(D.giver);assert.ok(f.run('claim').ok);
 // Clock/routine progress is expected from real walking. Every independent
 // ledger, gear, companion, XP account and materials except the fee stay exact.
 const after=protectedFacts(f),elapsed=f.sim.elapsed-startElapsed;assert.ok(elapsed>0);for(const clock of ['adventure','sandbox']){assert.ok(Math.abs(after[clock].elapsed-old[clock].elapsed-elapsed)<1e-8,'actual '+clock+' clock advances by the Core tick duration');delete old[clock].elapsed;delete after[clock].elapsed;}for(const k of ['hour','day','weather','residents','player'])delete old[k],delete after[k];assert.deepEqual(after,old);assert.equal(f.sim.state.adventure.xp,xp);assert.equal(f.sim.state.earthWildSigns.claimed,true);
});
