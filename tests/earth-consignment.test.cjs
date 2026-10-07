'use strict';
/* Installed source boundary tests. Original history is an existing repository-earned fixture;
 * new owner, positions and storage are explicitly synthetic. No native browser proof. */
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),test=require('node:test');
const ROOT=path.resolve(__dirname,'..');
const E=require(path.join(ROOT,'src/earth-expedition.js')),Base=require(path.join(ROOT,'src/local-life.js'));
const oldValidate=require('./helpers/legacy-local-life-validator.cjs');
const optional=file=>{try{return require(file);}catch(e){if(e.code==='MODULE_NOT_FOUND'&&e.message.includes(file))return null;throw e;}};
const D=optional('../src/earth-consignment-data.js');
const need=()=>assert.ok(D,'canonical data proposal is not implemented yet');
const source=()=>JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json')));
test('new accepted-empty record locates the supplied load at its declared glade',()=>{
 assert.ok(D,'canonical data proposal is not implemented yet');
 const r={accepted:true,choice:'south-stormfall',steps:[],claimed:false};
 assert.deepEqual(D.validateRecord(r),r);assert.deepEqual(D.checkpoint(r),{id:'load-glade',x:-106,z:-105});
});
test('both frozen route/content choices retain their own contiguous arrival totals',()=>{
 need();assert.equal(D.required('south-stormfall').length,5);assert.equal(D.required('north-stormfall').length,12);
 assert.equal(D.choice('south-stormfall').cargo.quantity,4);assert.equal(D.choice('north-coppice').cargo.quantity,3);
 assert.equal(D.required('north-coppice')[0],'arrive-root-south-stop');assert.equal(D.required('south-coppice')[4],'arrive-merren-receiving-bay');
 assert.equal(Object.isFrozen(D.routes['northern-root'][1]),true);assert.equal(Object.isFrozen(D.required('north-coppice')),true);
});
test('structural record refuses skipped/reordered/duplicate arrivals and early payment',()=>{
 need();const r={accepted:true,choice:'south-stormfall',steps:['arrive-meadow-stop'],claimed:false};assert.deepEqual(D.validateRecord(r),r);
 for(const steps of [['arrive-field-return-stop'],['arrive-meadow-stop','arrive-meadow-stop'],['arrive-meadow-stop','arrive-field-gate-stop']])assert.throws(()=>D.validateRecord({...r,steps}));
 assert.throws(()=>D.validateRecord({...r,claimed:true}));assert.throws(()=>D.validateRecord({...r,choice:'north-unknown'}));assert.throws(()=>D.validateRecord({...r,extra:1}));
 assert.throws(()=>D.validateRecord({...r,steps:Array(1)}),'sparse arrays cannot manufacture declared progress');
});
test('migration preserves validated raw step order and refuses partial/unknown/future catalogues',()=>{
 need();const L=require('../src/local-life.js'),raw=copy(source().localLife);raw.records['cosmos-drawing-shelf-v1'].steps.reverse();oldValidate(raw);
 const value=L.validate(raw,source().earthExpedition);for(const id of D.OLD_IDS)assert.deepEqual(value.records[id],raw.records[id]);
 const partial=copy(raw);delete partial.records[D.OLD_IDS[0]];
 for(const invalid of [null,{...raw,version:2},partial,{...raw,records:{...raw.records,future: D.freshRecord()}},{...raw,records:{...raw.records,[D.ID]:undefined}}])assert.throws(()=>L.validate(invalid,source().earthExpedition));
});
test('actual Core source eligibility refuses a mismatched fifth-record branch',()=>{
 const f=fixture();accept(f);const candidate=f.sim.snapshot();candidate.earthExpedition.story.branch=candidate.earthExpedition.story.branch==='stormfall-recovery'?'managed-coppice':'stormfall-recovery';assert.throws(()=>f.C.validate(candidate));
});
test('northern partial progress cannot inherit the southern five-step ready/claim rule',()=>{
 const branch=source().earthExpedition.story.branch,choice=branch==='stormfall-recovery'?'north-stormfall':'north-coppice';
 const record={accepted:true,choice,steps:D.required(choice).slice(0,5),claimed:false},f=fixture({record});
 assert.equal(f.L.ready(f.sim.state,D.definition),false);assert.equal(f.L.available(f.sim.state,D.definition)[0].id,'arrive-camp-stop');assert.equal(f.L.carrying(f.sim.state,D.definition),false);
 f.sim.state.player={x:-6,z:-68,yaw:0};unchanged(f,()=>f.run('claim'));
});
test('missing motion module/consume gate refuses and old saved arrivals remain safe duplicates',()=>{
 const f=fixture();accept(f);const ticket=arrive(f),M=globalThis.RealmEarthConsignmentMotion;
 try{for(const broken of [undefined,{DEFINITION:D.definition,validateArrival:M.validateArrival}]){globalThis.RealmEarthConsignmentMotion=broken;unchanged(f,()=>f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket}));}}finally{globalThis.RealmEarthConsignmentMotion=M;}
 assert.ok(f.M.validateArrival(f.ctx(),ticket,'arrive-meadow-stop').ok);assert.ok(f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket}).ok);
 try{globalThis.RealmEarthConsignmentMotion=undefined;const state=f.state(),raw=f.raw();assert.ok(f.run('step',{step:'arrive-meadow-stop'}).duplicate);assert.equal(f.state(),state);assert.equal(f.raw(),raw);}finally{globalThis.RealmEarthConsignmentMotion=M;}
});
test('lossy Core candidate refuses before saver or consuming a real arrival authority',()=>{
 const f=fixture();accept(f);const ticket=arrive(f),C=globalThis.RealmCore;
 try{
  // Negative control only: real Core validation followed by deliberate loss,
  // representing a lagging owner hook. Successful tests never replace Core.
  globalThis.RealmCore={...C,validate(value){const checked=C.validate(value);delete checked.localLife.records[D.ID];return checked;}};
  unchanged(f,()=>f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket}));
 }finally{globalThis.RealmCore=C;}
 assert.ok(f.M.validateArrival(f.ctx(),ticket,'arrive-meadow-stop').ok);
});
test('throwing/promise savers and record limit preserve a real ready ticket',()=>{
 const f=fixture();accept(f);const ticket=arrive(f),state=f.state(),raw=f.raw();
 for(const save of [()=>{throw Error('labelled saver refusal');},()=>Promise.resolve({ok:true}),async()=>({ok:true})]){
  assert.equal(f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket},{save}).ok,false);assert.equal(f.state(),state);assert.equal(f.raw(),raw);assert.ok(f.M.validateArrival(f.ctx(),ticket,'arrive-meadow-stop').ok);
 }
 f.sim.state.adventure.revision=1e9;unchanged(f,()=>f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket}));assert.ok(f.M.validateArrival(f.ctx(),ticket,'arrive-meadow-stop').ok);
});
test('stale replaced lease and actual missing Store writer refuse incomplete arrival',()=>{
 const f=fixture();accept(f);const ticket=arrive(f),state=f.state(),raw=f.raw();f.sim.consignmentOwnerLease=Object.freeze({});
 assert.equal(f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket}).ok,false);assert.equal(f.state(),state);assert.equal(f.raw(),raw);
 const other=fixture();accept(other);const t=arrive(other);other.store.writer=false;
 assert.equal(other.run('step',{step:'arrive-meadow-stop',motionTicket:t}).ok,false);assert.ok(other.M.validateArrival(other.ctx(),t,'arrive-meadow-stop').ok);
 other.store.writer=true;assert.ok(other.run('step',{step:'arrive-meadow-stop',motionTicket:t}).ok);
});
test('postcommit consume or synchronization failure warns without rolling back saved arrival',()=>{
 for(const mode of ['consume-throw','consume-false','sync-throw','sync-false']){
  const f=fixture();accept(f);const ticket=arrive(f),M=globalThis.RealmEarthConsignmentMotion,revision=f.store.revision;
  const sync=mode==='sync-throw'?()=>{throw Error('labelled scene failure');}:mode==='sync-false'?()=>({ok:false,error:'labelled scene failure'}):()=>{};
  try{
   if(mode.startsWith('consume'))globalThis.RealmEarthConsignmentMotion={...M,consume:mode==='consume-throw'?()=>{throw Error('labelled cleanup failure');}:()=>({ok:false,error:'labelled cleanup failure'})};
   const result=f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket},{save:f.save,sync});assert.equal(result.ok,true);assert.equal(result.error,undefined);assert.match(result.warning,/saved/);
  }finally{globalThis.RealmEarthConsignmentMotion=M;}
  assert.equal(f.store.revision,revision+1);assert.deepEqual(f.store.record.slots[0].world.localLife.records[D.ID].steps,['arrive-meadow-stop']);assert.deepEqual(f.sim.state.localLife.records[D.ID].steps,['arrive-meadow-stop']);
  const raw=f.raw(),calls=f.saveCalls;assert.ok(f.run('step',{step:'arrive-meadow-stop'}).duplicate);assert.equal(f.raw(),raw);assert.equal(f.saveCalls,calls);
 }
});
test('absent or incomplete Core/World dependencies refuse instead of throwing or saving',()=>{
 const f=fixture(),C=globalThis.RealmCore,W=globalThis.RealmWorldFoundations;
 try{
  for(const broken of [undefined,{}, {Simulation:C.Simulation}]){globalThis.RealmCore=broken;unchanged(f,()=>f.run('accept',{choice:pick(f)}));}
  globalThis.RealmCore=C;for(const broken of [undefined,{}]){globalThis.RealmWorldFoundations=broken;unchanged(f,()=>f.run('accept',{choice:pick(f)}));}
 }finally{globalThis.RealmCore=C;globalThis.RealmWorldFoundations=W;}
});
test('the four existing commissions execute original acceptance and safe retained duplicates',()=>{
 const f=fixture(),W=globalThis.RealmWorldFoundations;
 for(const id of D.OLD_IDS){
  const d=f.L.definition(id);f.sim.room=W.definition(d.realm).room;f.sim.state.player={x:d.giver.x,z:d.giver.z,yaw:0};const newRecord=copy(f.sim.state.localLife.records[D.ID]);
  const accepted=f.L.command({sim:f.sim},'accept',{quest:id,choice:d.choices[0].id},{save:f.save});assert.ok(accepted.ok,accepted.error);assert.deepEqual(f.sim.state.localLife.records[D.ID],newRecord);
  const state=f.state(),saved=f.raw(),calls=f.saveCalls,result=f.L.command({sim:f.sim},'accept',{quest:id,choice:'ignored-past-arrangement'},{save:f.save});assert.ok(result.ok&&result.duplicate);assert.equal(f.state(),state);assert.equal(f.raw(),saved);assert.equal(f.saveCalls,calls);
 }
});
test('unaccepted records cannot retain supplied-load progress and defaults are independent',()=>{
 need();const a=D.freshRecord(),b=D.freshRecord();a.steps.push('forged');assert.deepEqual(b,{accepted:false,choice:null,steps:[],claimed:false});
 assert.throws(()=>D.validateRecord({...b,choice:'south-stormfall'}));assert.throws(()=>D.validateRecord({...b,claimed:true}));
});
test('cross-validation requires actual paid original history and matching frozen content',()=>{
 need();const ee=source().earthExpedition,valid=ee.story.branch==='stormfall-recovery'?'south-stormfall':'south-coppice';
 assert.equal(D.crossValidate({accepted:true,choice:valid,steps:[],claimed:false},ee).choice,valid);
 assert.throws(()=>D.crossValidate({accepted:true,choice:valid,steps:[],claimed:false},E.fresh()));
 assert.throws(()=>D.crossValidate({accepted:true,choice:valid==='south-stormfall'?'south-coppice':'south-stormfall',steps:[],claimed:false},ee));
});
test('old installed validator refuses a declared fifth record rather than silently dropping it',()=>{
 need();const raw=source().localLife;assert.throws(()=>oldValidate({...raw,records:{...raw.records,[D.ID]:D.freshRecord()}}));
});
test('every new-job command delegates fail-closed before generic local-work behavior',()=>{
 need();const L=require('../src/local-life.js'),R=optional('../src/earth-consignment.js');assert.ok(R,'actual consignment command proposal is not implemented yet');
 const C=require(path.join(ROOT,'src/core.js')),sim=new C.Simulation();
 assert.equal(L.command({sim},'step',{quest:D.ID,step:'arrive-meadow-stop'},{}).ok,false);
});
test('installed owner adds only the new record and keeps all four raw histories unchanged',()=>{
 need();const L=optional('../src/local-life.js');assert.ok(L,'fifth-catalogue owner is not implemented yet');const raw=source().localLife;
 const migrated=L.validate(raw,source().earthExpedition);assert.equal(Object.keys(migrated.records).length,5);
 for(const id of D.OLD_IDS)assert.deepEqual(migrated.records[id],raw.records[id]);assert.deepEqual(migrated.records[D.ID],D.freshRecord());
 assert.equal(L.definitions.filter(d=>d.realm==='earthlands').length,1);
});

const copy=v=>JSON.parse(JSON.stringify(v));
function components(){
 need();const L=require('../src/local-life.js'),R=optional('../src/earth-consignment.js');assert.ok(R,'actual consignment command proposal is not implemented yet');
 const C=require(path.join(ROOT,'src/core.js')),CH=require(path.join(ROOT,'src/characters.js'));
 const M=require('../src/earth-consignment-motion.js');return{L,R,C,CH,M};
}
function fixture(options={}){
 const {L,R,C,CH,M}=components(),sim=new C.Simulation(source());
 if(options.record)sim.state.localLife.records[D.ID]=copy(options.record);
 if(options.coins!==undefined)sim.state.adventure.coins=options.coins;
 Object.assign(sim.state.sandbox.inventory,options.inventory||{});
 const home=copy(sim.state.player),lease=Object.freeze({});sim.returnPos=home;sim.room=D.ROOM;
 sim.worldTrip={active:'character-1',realm:'earthlands',home:copy(home)};sim.consignmentOwnerLease=lease;
 sim.state.player={x:-106,z:-105,yaw:0};
 const data=new Map(),storage={failWrite:false,getItem:k=>data.get(k)??null,setItem(k,v){if(this.failWrite)throw Error('labelled synchronous quota refusal');data.set(k,v);}};
 storage.setItem(CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:sim.snapshot()}]}));
 const store=new CH.Store(storage);store.load();store.writer=true;
 const f={L,R,C,CH,M,sim,store,storage,lease,saveCalls:0};
 f.ctx=()=>({sim,active:store.active,revision:store.revision,ownerLease:lease,definition:D.definition,threat:()=>({clear:true})});
 f.save=value=>{f.saveCalls++;return store.save(value);};
 f.run=(type,payload={},io={save:f.save})=>L.command(f.ctx(),type,{quest:D.ID,...payload},io);
 f.state=()=>JSON.stringify(sim.state);f.raw=()=>storage.getItem(CH.KEY);return f;
}
const pick=(f,side='south')=>side+'-'+(f.sim.state.earthExpedition.story.branch==='stormfall-recovery'?'stormfall':'coppice');
function accept(f){const r=f.run('accept',{choice:pick(f)});assert.ok(r.ok,r.error);return r;}
function readyRecord(){const branch=source().earthExpedition.story.branch,choice=branch==='stormfall-recovery'?'south-stormfall':'south-coppice';return{accepted:true,choice,steps:['arrive-meadow-stop','arrive-field-return-stop','arrive-field-gate-stop','arrive-settlement-approach','arrive-merren-receiving-bay'],claimed:false};}
function oldOwners(sim){return copy({earthExpedition:sim.state.earthExpedition,bridgeCommunity:sim.state.bridgeCommunity,homeHistory:sim.state.homeHistory,realmTrails:sim.state.realmTrails,journeys:sim.state.journeys,records:Object.fromEntries(D.OLD_IDS.map(id=>[id,sim.state.localLife.records[id]]))});}
function unchanged(f,run){const state=f.state(),raw=f.raw(),calls=f.saveCalls,r=run();assert.equal(r.ok,false);assert.equal(f.state(),state);assert.equal(f.raw(),raw);assert.equal(f.saveCalls,calls);return r;}
function arrive(f){
 assert.ok(f.M.continue(f.ctx()).ok);
 // Player placement/owner/clear-threat predicate are synthetic. The carrier
 // advances only through real Core ticks and the installed motion solver.
 for(let n=0;n<1000;n++){
  const view=f.M.current(f.ctx());assert.ok(view);if(view.ready){const t=f.M.arrivalTicket(f.ctx());assert.ok(t.ok);return t.ticket;}
  f.sim.state.player={x:view.x,z:view.z,yaw:view.yaw};f.sim.tick(.1);const result=f.M.update(f.ctx(),.1);assert.ok(result.ok,result.error);
 }
 assert.fail('real first leg did not physically arrive within its finite bound');
}
test('glade acceptance saves fresh supplier-owned cargo without inventory/source payment',()=>{
 const f=fixture(),old=oldOwners(f.sim),a=copy(f.sim.state.adventure),inv=copy(f.sim.state.sandbox.inventory),lease=f.lease;
 accept(f);assert.equal(f.store.revision,2);assert.equal(f.saveCalls,1);assert.strictEqual(f.sim.consignmentOwnerLease,lease);
 assert.deepEqual(f.sim.state.localLife.records[D.ID],{accepted:true,choice:pick(f),steps:[],claimed:false});
 assert.equal(f.sim.state.adventure.revision,a.revision+1);assert.equal(f.sim.state.adventure.coins,a.coins);assert.equal(f.sim.state.adventure.xp,a.xp);assert.deepEqual(f.sim.state.sandbox.inventory,inv);assert.deepEqual(oldOwners(f.sim),old);
 const before=f.raw();assert.ok(f.run('accept',{choice:'unknown'}).duplicate);assert.equal(f.raw(),before);assert.equal(f.saveCalls,1);
});
test('accept refuses remote/camp, source mismatch and copied or missing actual owner',()=>{
 const f=fixture();f.sim.state.player={x:-67,z:-4,yaw:0};unchanged(f,()=>f.run('accept',{choice:pick(f)}));f.sim.state.player={x:-106,z:-105,yaw:0};
 unchanged(f,()=>f.run('accept',{choice:pick(f)==='south-stormfall'?'south-coppice':'south-stormfall'}));
 for(const extra of [{ownerLease:undefined},{ownerLease:Object.freeze({})},{active:'wrong-owner'},{revision:-1},{definition:{id:D.ID}}])unchanged(f,()=>f.L.command({...f.ctx(),...extra},'accept',{quest:D.ID,choice:pick(f)},{save:f.save}));
});
test('bare arrival, forged/copy/projection proof and wrong next stop cannot become progress',()=>{
 const f=fixture();accept(f);f.sim.state.player={x:-68,z:-99,yaw:0};
 for(const motionTicket of [undefined,{},Object.freeze({kind:'earth-consignment-arrival-v1'})])unchanged(f,()=>f.run('step',{step:'arrive-meadow-stop',motionTicket}));
 f.sim.state.player={x:-106,z:-105,yaw:0};const ticket=arrive(f);
 for(const motionTicket of [copy(ticket),f.M.current(f.ctx())])unchanged(f,()=>f.run('step',{step:'arrive-meadow-stop',motionTicket}));
 unchanged(f,()=>f.run('step',{step:'arrive-field-return-stop',motionTicket:ticket}));assert.ok(f.M.validateArrival(f.ctx(),ticket,'arrive-meadow-stop').ok);
});
test('actual physically earned first arrival saves once then consumes its opaque proof',()=>{
 const f=fixture();accept(f);const old=oldOwners(f.sim),ticket=arrive(f),a=copy(f.sim.state.adventure),inv=copy(f.sim.state.sandbox.inventory),events=[];
 const save=value=>{events.push('save');return f.save(value);},M=globalThis.RealmEarthConsignmentMotion;
 globalThis.RealmEarthConsignmentMotion={...M,consume(ctx,t){events.push('consume');return M.consume(ctx,t);}};
 try{const result=f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket},{save,sync(){events.push('sync');}});assert.ok(result.ok,result.error);assert.equal(result.warning,undefined);}finally{globalThis.RealmEarthConsignmentMotion=M;}
 assert.deepEqual(events,['save','consume','sync']);assert.equal(f.store.revision,3);assert.deepEqual(f.sim.state.localLife.records[D.ID].steps,['arrive-meadow-stop']);
 assert.equal(f.M.validateArrival(f.ctx(),ticket,'arrive-meadow-stop').ok,false);assert.equal(f.sim.state.adventure.revision,a.revision+1);assert.equal(f.sim.state.adventure.coins,a.coins);assert.equal(f.sim.state.adventure.xp,a.xp);assert.deepEqual(f.sim.state.sandbox.inventory,inv);assert.deepEqual(oldOwners(f.sim),old);
 const state=f.state(),raw=f.raw(),calls=f.saveCalls;const duplicate=f.run('step',{step:'arrive-meadow-stop'});assert.ok(duplicate.ok&&duplicate.duplicate);assert.equal(f.state(),state);assert.equal(f.raw(),raw);assert.equal(f.saveCalls,calls);
});
test('actual Store quota refusal leaves a real arrived ticket usable for one retry',()=>{
 const f=fixture();accept(f);const ticket=arrive(f),state=f.state(),raw=f.raw(),revision=f.store.revision;
 f.storage.failWrite=true;const refusal=f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket});assert.equal(refusal.ok,false);assert.equal(f.state(),state);assert.equal(f.raw(),raw);assert.equal(f.store.revision,revision);assert.ok(f.M.validateArrival(f.ctx(),ticket,'arrive-meadow-stop').ok);
 f.storage.failWrite=false;assert.ok(f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket}).ok);assert.equal(f.store.revision,revision+1);
});
test('ordinary real Store revisions preserve actual motion authority while stale writers refuse',()=>{
 const f=fixture();accept(f);const ticket=arrive(f),lease=f.lease;f.sim.state.settings.cameraMode='follow';assert.ok(f.store.save(f.sim.snapshot()).ok);f.sim.state.hour+=.1;assert.ok(f.store.save(f.sim.snapshot()).ok);
 assert.equal(f.store.revision,4);assert.strictEqual(f.sim.consignmentOwnerLease,lease);assert.ok(f.M.validateArrival(f.ctx(),ticket,'arrive-meadow-stop').ok);
 const external=JSON.parse(f.raw());external.revision++;f.storage.setItem(f.CH.KEY,JSON.stringify(external));const state=f.state(),raw=f.raw();assert.equal(f.run('step',{step:'arrive-meadow-stop',motionTicket:ticket}).ok,false);assert.equal(f.state(),state);assert.equal(f.raw(),raw);assert.equal(f.store.blocked,true);
});
test('claim capacity is atomic for every declared fee and keeps completed work unpaid',()=>{
 for(const options of [{coins:9996},{inventory:{wood:998}},{inventory:{fiber:998}}]){
  const f=fixture({...options,record:readyRecord()});f.sim.state.player={x:-6,z:-68,yaw:0};unchanged(f,()=>f.run('claim'));assert.equal(f.sim.state.localLife.records[D.ID].claimed,false);
 }
});
test('declared completed synthetic history pays exact fee once and preserves XP/ore/history',()=>{
 const f=fixture({record:readyRecord(),coins:9995,inventory:{wood:997,fiber:997}});f.sim.state.player={x:-6,z:-68,yaw:0};const a=copy(f.sim.state.adventure),old=oldOwners(f.sim);
 const result=f.run('claim');assert.ok(result.ok,result.error);assert.deepEqual(result.reward,{xp:0,coins:4,ore:0,materials:{wood:2,fiber:2}});
 assert.equal(f.sim.state.adventure.coins,9999);assert.equal(f.sim.state.sandbox.inventory.wood,999);assert.equal(f.sim.state.sandbox.inventory.fiber,999);assert.equal(f.sim.state.adventure.xp,a.xp);assert.equal(f.sim.state.adventure.ore,a.ore);assert.deepEqual(oldOwners(f.sim),old);
 const state=f.state(),raw=f.raw(),calls=f.saveCalls;assert.ok(f.run('claim').duplicate);assert.equal(f.state(),state);assert.equal(f.raw(),raw);assert.equal(f.saveCalls,calls);
 const reloaded=new f.C.Simulation(JSON.parse(raw).slots[0].world);assert.equal(reloaded.state.localLife.records[D.ID].claimed,true);assert.deepEqual(D.checkpoint(reloaded.state.localLife.records[D.ID]),{id:'merren-receiving-bay',x:5.8,z:-69});
});
test('actual Store payment save refusal rolls back all candidate fee changes and retry pays once',()=>{
 const f=fixture({record:readyRecord()});f.sim.state.player={x:-6,z:-68,yaw:0};const state=f.state(),raw=f.raw(),a=copy(f.sim.state.adventure),inv=copy(f.sim.state.sandbox.inventory),revision=f.store.revision;
 f.storage.failWrite=true;const refusal=f.run('claim');assert.equal(refusal.ok,false);assert.equal(f.state(),state);assert.equal(f.raw(),raw);assert.equal(f.store.revision,revision);assert.equal(f.sim.state.localLife.records[D.ID].claimed,false);
 f.storage.failWrite=false;assert.ok(f.run('claim').ok);assert.equal(f.sim.state.adventure.coins,a.coins+4);assert.equal(f.sim.state.sandbox.inventory.wood,inv.wood+2);assert.equal(f.sim.state.sandbox.inventory.fiber,inv.fiber+2);assert.equal(f.store.revision,revision+1);
 const paid=f.raw(),calls=f.saveCalls;assert.ok(f.run('claim').duplicate);assert.equal(f.raw(),paid);assert.equal(f.saveCalls,calls);
});
test('cold loaded complete-paid record duplicates even when motion is unavailable',()=>{
 const f=fixture({record:{...readyRecord(),claimed:true}}),M=globalThis.RealmEarthConsignmentMotion,state=f.state(),raw=f.raw();
 try{globalThis.RealmEarthConsignmentMotion=undefined;assert.ok(f.run('claim').duplicate);assert.ok(f.run('step',{step:'arrive-meadow-stop'}).duplicate);}finally{globalThis.RealmEarthConsignmentMotion=M;}
 assert.equal(f.state(),state);assert.equal(f.raw(),raw);assert.equal(f.saveCalls,0);
});
