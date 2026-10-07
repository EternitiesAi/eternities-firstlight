/* Integrated actual command regressions. Histories, positions, leases and
 * storage are labelled synthetic fixtures. Production E/F/Core/Store run
 * directly; actual app lifecycle, earned journeys and browser proof are separate. */
'use strict';
const path=require('node:path');
const assert=require('node:assert/strict'),test=require('node:test');
const ROOT=path.resolve(__dirname,'..');
// Core and the command load the actual production expedition module.
const E=require('../src/earth-expedition.js'),C=require(path.join(ROOT,'src/core.js'));
const W=require(path.join(ROOT,'src/world-foundations.js')),CH=require(path.join(ROOT,'src/characters.js'));
const A=globalThis.RealmAdventure,F=require('../src/earth-fieldcraft.js');
const STEP='brace-root-channel',copy=o=>JSON.parse(JSON.stringify(o));
function fixture({steps=E.definition.steps.slice(0,6).map(s=>s.id),claimed=false,branch='stormfall-recovery'}={}){
 const sim=new C.Simulation();
 sim.state.adventure.started=true;sim.state.adventure.owned=['trail_blade','travel_coat'];
 sim.state.adventure.equipment.weapon='trail_blade';sim.state.adventure.equipment.armor='travel_coat';
 sim.state.earthExpedition.story={accepted:true,branch,steps:[...steps],claimed};
 sim.returnPos={...sim.state.player};sim.room='world-earthlands';sim.state.player={x:-145,z:-84,yaw:0};
 const f={sim,active:'synthetic-command-owner',revision:7,ownerLease:Object.freeze({}),saveCalls:0,saved:null};
 sim.worldTrip={active:f.active,realm:'earthlands',home:copy(sim.returnPos)};sim.fieldcraftOwnerLease=f.ownerLease;
 f.ctx=()=>({sim:f.sim,active:f.active,revision:f.revision,ownerLease:f.ownerLease});
 f.save=value=>{f.saveCalls++;f.saved=C.validate(value);return{ok:true};};
 C.validate(sim.snapshot());return f;
}
function managedFixture(options){
 const f=fixture(options),data=new Map(),storage={failWrite:false,getItem:k=>data.get(k)??null,
  setItem(k,v){if(this.failWrite)throw Error('labelled synchronous quota refusal');data.set(k,v);}};
 storage.setItem(CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:f.sim.snapshot()}]}));
 const store=new CH.Store(storage);store.load();store.writer=true;
 f.storage=storage;f.store=store;f.active=store.active;f.sim.worldTrip.active=f.active;
 f.ctx=()=>({sim:f.sim,active:store.active,revision:store.revision,ownerLease:f.ownerLease});
 f.save=value=>{f.saveCalls++;const r=store.save(value);if(r.ok)f.saved=C.validate(value);return r;};return f;
}
const snapshot=f=>JSON.stringify(f.sim.snapshot());
function begin(f){const r=F.begin(f.ctx());assert.ok(r.ok,r.error);return r.plan;}
function fit(f,plan=begin(f)){
 let ticket;
 for(let i=0;i<4;i++){
  assert.ok(F.inspect(f.ctx(),plan).ok);assert.ok(F.adjust(f.ctx(),plan,{yaw:F.GEOMETRY.targetYaw,pitch:F.GEOMETRY.targetPitch,sectionId:'brace-'+(i+1)}).ok);
  const r=F.seat(f.ctx(),plan);assert.ok(r.ok,r.error);ticket=r.ticket;
 }
 assert.ok(F.validate(f.ctx(),ticket).ok);return{plan,ticket};
}
function command(f,ticket,ctx=f.ctx()){
 return E.command(ctx,'step',{quest:E.definition.id,step:STEP,...(ticket===undefined?{}:{fittingTicket:ticket})},{save:f.save});
}
function refusedUnchanged(f,ticket){const before=snapshot(f),calls=f.saveCalls,r=command(f,ticket);assert.equal(r.ok,false);assert.equal(snapshot(f),before);assert.equal(f.saveCalls,calls);return r;}
function withRules(value,fn){const old=globalThis.RealmEarthFieldcraft;globalThis.RealmEarthFieldcraft=value;try{return fn();}finally{globalThis.RealmEarthFieldcraft=old;}}
function withSync(fn,run){const old=A.syncScene;A.syncScene=fn;try{return run();}finally{A.syncScene=old;}}

test('real Core/Adventure/schema owners retain existing versions and transient lease stays outside saves',()=>{
 const f=fixture();assert.equal(C.VERSION,9);assert.equal(A.VERSION,12);assert.strictEqual(globalThis.RealmEarthExpedition,E);
 assert.deepEqual(E.fresh(),{version:1,story:{accepted:false,branch:null,steps:[],claimed:false},patrol:{lastClaim:0,active:null}});
 assert.ok(F.begin(f.ctx()).ok);assert.equal(Object.hasOwn(f.sim.snapshot(),'fieldcraftOwnerLease'),false);
});
test('actual integrated E.command rejects bare incomplete brace step without saving',()=>{
 refusedUnchanged(fixture());
});
test('missing fitting module or consume method fails closed before durable saver',()=>{
 const f=fixture(),{ticket}=fit(f);
 for(const rules of [undefined,{}, {validate:F.validate},{consume:F.consume}])withRules(rules,()=>refusedUnchanged(f,ticket));
 assert.ok(F.validate(f.ctx(),ticket).ok);
});
test('forged, copied and incomplete authorities cannot authorize the command',()=>{
 const f=fixture(),plan=begin(f);assert.ok(F.inspect(f.ctx(),plan).ok);
 assert.ok(F.adjust(f.ctx(),plan,{yaw:0,pitch:F.GEOMETRY.targetPitch}).ok);assert.ok(F.seat(f.ctx(),plan).ok);
 for(const ticket of [null,{},Object.freeze({kind:'earth-fieldcraft-v1-fitting'}),plan,F.projection(plan)])refusedUnchanged(f,ticket);
 const completed=fit(f),copyTicket=copy(completed.ticket);refusedUnchanged(f,copyTicket);assert.ok(F.validate(f.ctx(),completed.ticket).ok);
});
test('wrong root/drain receiving faces and unseated wrong geometry cannot produce command authority',()=>{
 const f=fixture(),plan=begin(f);
 for(const receiver of ['living-root','west-wall','drain'])assert.equal(F.inspect(f.ctx(),plan,receiver).ok,false);
 assert.ok(F.inspect(f.ctx(),plan).ok);assert.ok(F.adjust(f.ctx(),plan,{yaw:F.GEOMETRY.previewBounds.yaw.max,pitch:0}).ok);
 assert.equal(F.seat(f.ctx(),plan).ok,false);refusedUnchanged(f,plan);refusedUnchanged(f,F.projection(plan));
});
test('a real complete ticket from another identical synthetic owner cannot cross simulations',()=>{
 const f=fixture(),other=fixture(),{ticket}=fit(other);refusedUnchanged(f,ticket);assert.ok(F.validate(other.ctx(),ticket).ok);
});
test('existing prerequisite and proximity checks run before the new proof gate',()=>{
 let validationCalls=0;const trap={validate(){validationCalls++;throw Error('must not reach fitting gate');},consume:F.consume};
 withRules(trap,()=>{
  refusedUnchanged(fixture({steps:E.definition.steps.slice(0,5).map(s=>s.id)}),{});
  const far=fixture();far.sim.state.player={x:-148,z:-66,yaw:0};refusedUnchanged(far,{});
 });assert.equal(validationCalls,0);
});
test('throwing or asynchronous validation is refused without mutation',()=>{
 const f=fixture(),{ticket}=fit(f);
 withRules({...F,validate(){throw Error('labelled proof fault');}},()=>assert.match(refusedUnchanged(f,ticket).error,/labelled proof fault/));
 withRules({...F,validate(){return Promise.resolve({ok:true});}},()=>refusedUnchanged(f,ticket));
 assert.ok(F.validate(f.ctx(),ticket).ok);
});
const staleCases=[
 ['Adventure revision',f=>f.sim.state.adventure.revision++],
 ['renewed identical-owner lease',f=>{f.ownerLease=Object.freeze({});f.sim.fieldcraftOwnerLease=f.ownerLease;}],
 ['missing lease',f=>f.ownerLease=undefined],
 ['copied lease',f=>f.ownerLease=Object.freeze(copy(f.ownerLease))],
 ['changed active character',f=>f.active='synthetic-other-owner'],
 ['changed trip identity',f=>f.sim.worldTrip=copy(f.sim.worldTrip)],
 ['changed original checkpoint',f=>{f.sim.returnPos.x++;f.sim.worldTrip.home=copy(f.sim.returnPos);}],
 ['identical imported state identity',f=>f.sim.state=copy(f.sim.state)],
 ['job phase',f=>f.sim.state.earthExpedition.story.branch='managed-coppice'],
 ['death generation',f=>f.sim.state.adventure.deaths++],
 ['dead owner',f=>f.sim.state.adventure.hp=0],
 ['travel away',f=>f.sim.room='valley'],
 ['unsupported work point',f=>f.sim.state.player={x:-143.4,z:-78,yaw:0}]
];
for(const[name,mutate]of staleCases)test('actual command rejects stale fitting: '+name,()=>{
 const f=fixture(),{ticket}=fit(f);mutate(f);refusedUnchanged(f,ticket);
});
test('cancelled ready ticket rejects and beginning again requires another actual fitting',()=>{
 const f=fixture(),{plan,ticket}=fit(f);assert.ok(F.cancel(plan).ok);refusedUnchanged(f,ticket);const next=fit(f);assert.ok(command(f,next.ticket).ok);
});
for(const branch of ['stormfall-recovery','managed-coppice'])test('successful '+branch+' fastening saves once, consumes before sync, and pays nothing',()=>{
 const f=managedFixture({branch}),before=f.sim.snapshot(),{ticket}=fit(f),events=[],save=f.save;
 f.save=candidate=>{events.push('save');assert.equal(f.sim.state.earthExpedition.story.steps.includes(STEP),false);assert.ok(F.validate(f.ctx(),ticket).ok);return save(candidate);};
 const rules={...F,consume(t){events.push('consume');assert.strictEqual(t,ticket);assert.ok(f.store.record.slots[0].world.earthExpedition.story.steps.includes(STEP));const r=F.consume(t);assert.ok(r.ok);return r;}};
 withRules(rules,()=>withSync(sim=>{events.push('sync');assert.equal(F.current(sim),null);assert.equal(F.consume(ticket).ok,false);},()=>{
  const result=command(f,ticket);assert.ok(result.ok,result.error);assert.equal(result.warning,undefined);assert.equal(result.reward,undefined);
 }));assert.deepEqual(events,['save','consume','sync']);assert.equal(f.saveCalls,1);assert.equal(f.store.revision,2);
 const after=f.sim.snapshot();assert.deepEqual(after.adventure,{...before.adventure,revision:before.adventure.revision+1});assert.deepEqual(after.sandbox,before.sandbox);
 const unrelated=copy(after);unrelated.earthExpedition=before.earthExpedition;unrelated.adventure=before.adventure;unrelated.journal=before.journal;unrelated.nextEvent=before.nextEvent;assert.deepEqual(unrelated,before);
 const saved=snapshot(f),duplicate=command(f);assert.ok(duplicate.ok&&duplicate.duplicate);assert.equal(snapshot(f),saved);assert.equal(f.saveCalls,1);
 assert.equal(F.validate(f.ctx(),ticket).ok,false);assert.equal(F.consume(ticket).ok,false);
});
test('synchronous real Store quota refusal keeps same ready ticket and retry commits once',()=>{
 const f=managedFixture(),{ticket}=fit(f),before=snapshot(f),raw=f.storage.getItem(CH.KEY),revision=f.store.revision;
 f.storage.failWrite=true;const refused=command(f,ticket);assert.equal(refused.ok,false);assert.match(refused.error,/quota refusal/);
 assert.equal(snapshot(f),before);assert.equal(f.storage.getItem(CH.KEY),raw);assert.equal(f.store.revision,revision);assert.ok(F.validate(f.ctx(),ticket).ok);
 f.storage.failWrite=false;assert.ok(command(f,ticket).ok);assert.equal(f.store.revision,revision+1);assert.equal(f.saveCalls,2);
 assert.ok(command(f).duplicate);assert.equal(f.saveCalls,2);
});
test('throwing saver and promise saver refuse without consuming a valid ticket',()=>{
 const f=fixture(),{ticket}=fit(f),before=snapshot(f);
 f.save=()=>{throw Error('labelled throwing saver');};const thrown=command(f,ticket);assert.equal(thrown.ok,false);assert.match(thrown.error,/throwing saver/);assert.equal(snapshot(f),before);assert.ok(F.validate(f.ctx(),ticket).ok);
 f.save=()=>Promise.resolve({ok:true});assert.equal(command(f,ticket).ok,false);assert.equal(snapshot(f),before);assert.ok(F.validate(f.ctx(),ticket).ok);
});
test('record capacity refusal leaves the same ticket ready and makes no saver call',()=>{
 const f=fixture();f.sim.state.adventure.revision=1e9;const{ticket}=fit(f);refusedUnchanged(f,ticket);assert.ok(F.validate(f.ctx(),ticket).ok);
});
test('real Store saves of time and both camera preferences advance real revisions without ending fitting',()=>{
 const f=managedFixture(),{ticket}=fit(f),lease=f.ownerLease;
 f.sim.state.hour+=.1;f.sim.state.adventure.elapsed+=7;assert.ok(f.store.save(f.sim.snapshot()).ok);
 f.sim.state.settings.cameraMode='follow';f.sim.state.settings.cameraFov=65;f.sim.state.settings.cameraViews.profiles.follow={yaw:.9,elevation:.88,zoom:1};assert.ok(f.store.save(f.sim.snapshot()).ok);
 f.sim.state.settings.cameraMode='adventure';f.sim.state.settings.cameraViews.profiles.adventure={yaw:.2,elevation:.3,distance:7.5};assert.ok(f.store.save(f.sim.snapshot()).ok);
 assert.equal(f.store.revision,4);assert.strictEqual(f.sim.fieldcraftOwnerLease,lease);assert.ok(F.validate(f.ctx(),ticket).ok);
 assert.ok(command(f,ticket).ok);assert.equal(f.store.revision,5);assert.equal(f.saveCalls,1);
});
test('actual Store source guard rejects a stale writer independently of a valid fitting ticket',()=>{
 const f=managedFixture(),{ticket}=fit(f),before=snapshot(f),external=JSON.parse(f.storage.getItem(CH.KEY));external.revision++;
 const externalRaw=JSON.stringify(external);f.storage.setItem(CH.KEY,externalRaw);assert.ok(F.validate(f.ctx(),ticket).ok);
 assert.equal(command(f,ticket).ok,false);assert.equal(f.store.blocked,true);assert.equal(f.storage.getItem(CH.KEY),externalRaw);assert.equal(snapshot(f),before);assert.ok(F.validate(f.ctx(),ticket).ok);
});
test('actual Store missing writer lock refuses; restored writer retries the same fitted authority',()=>{
 const f=managedFixture(),{ticket}=fit(f),before=snapshot(f),raw=f.storage.getItem(CH.KEY);f.store.writer=false;
 assert.equal(command(f,ticket).ok,false);assert.equal(snapshot(f),before);assert.equal(f.storage.getItem(CH.KEY),raw);assert.ok(F.validate(f.ctx(),ticket).ok);
 f.store.writer=true;assert.ok(command(f,ticket).ok);assert.equal(f.store.revision,2);
});
test('reloaded completed and old paid histories duplicate before fitting availability',()=>{
 for(const claimed of [false,true]){
  const f=fixture({steps:E.definition.steps.slice(0,claimed?8:7).map(s=>s.id),claimed});
  f.sim=new C.Simulation(f.sim.snapshot());f.sim.returnPos={...f.sim.state.player};f.sim.room='world-earthlands';f.sim.state.player={x:-145,z:-84,yaw:0};
  const before=snapshot(f);withRules(undefined,()=>{const r=command(f,{});assert.ok(r.ok&&r.duplicate);});assert.equal(snapshot(f),before);assert.equal(f.saveCalls,0);
  if(claimed){const r=E.command(f.ctx(),'claim',{quest:E.definition.id},{save:f.save});assert.ok(r.ok&&r.duplicate);assert.equal(snapshot(f),before);}
 }
});
test('first-story delivery and once-only fee remain their existing separate actual commands',()=>{
 const f=fixture(),{ticket}=fit(f);assert.ok(command(f,ticket).ok);const before=f.sim.snapshot();
 f.sim.state.player={x:-106,z:-105,yaw:0};assert.ok(E.command(f.ctx(),'step',{quest:E.definition.id,step:'deliver-allocation'},{save:f.save}).ok);
 f.sim.state.player={x:E.definition.giver.x,z:E.definition.giver.z,yaw:0};
 withRules(undefined,()=>{const r=E.command(f.ctx(),'claim',{quest:E.definition.id},{save:f.save});assert.ok(r.ok);assert.equal(r.reward.xp,45);assert.equal(r.reward.coins,18);assert.equal(r.reward.ore,3);});
 assert.equal(f.sim.state.adventure.coins,before.adventure.coins+18);assert.equal(f.sim.state.adventure.ore,before.adventure.ore+3);
 const paid=snapshot(f),calls=f.saveCalls;const duplicate=E.command(f.ctx(),'claim',{quest:E.definition.id},{save:f.save});assert.ok(duplicate.duplicate);assert.equal(snapshot(f),paid);assert.equal(f.saveCalls,calls);
});
test('existing payment capacity refusal retains complete unpaid work with no fitting dependency',()=>{
 const f=fixture({steps:E.definition.steps.map(s=>s.id)});f.sim.state.adventure.coins=9999;f.sim.state.player={x:E.definition.giver.x,z:E.definition.giver.z,yaw:0};
 const before=snapshot(f);withRules(undefined,()=>{const r=E.command(f.ctx(),'claim',{quest:E.definition.id},{save:f.save});assert.equal(r.ok,false);assert.match(r.error,/Make room/);});assert.equal(snapshot(f),before);assert.equal(f.saveCalls,0);
});
test('existing accepted patrol glade inspection and payment remain independent of brace fitting',()=>{
 const f=fixture({steps:E.definition.steps.map(s=>s.id),claimed:true});
 f.sim.state.earthExpedition.patrol.active={run:1,steps:E.patrol.steps.slice(0,4).map(s=>s.id)};f.sim.state.player={x:-106,z:-105,yaw:0};
 const payload={quest:E.patrol.id,run:1,priorClaim:0};withRules(undefined,()=>{
  const r=E.command(f.ctx(),'patrol-step',{...payload,step:'inspect-glade'},{save:f.save});assert.ok(r.ok,r.error);
  f.sim.state.player={x:E.patrol.giver.x,z:E.patrol.giver.z,yaw:0};const paid=E.command(f.ctx(),'patrol-claim',payload,{save:f.save});assert.ok(paid.ok);assert.equal(paid.reward.xp,5);
  const before=snapshot(f),calls=f.saveCalls;assert.ok(E.command(f.ctx(),'patrol-claim',payload,{save:f.save}).duplicate);assert.equal(snapshot(f),before);assert.equal(f.saveCalls,calls);
 });assert.ok(f.sim.state.earthExpedition.story.steps.includes(STEP));
});
for(const failure of ['consume-return','consume-throw','sync-return','sync-throw','both-throw'])test('postcommit '+failure+' preserves actual saved completion and reports a warning',()=>{
 const f=managedFixture(),{ticket}=fit(f),events=[],rules={...F,consume(t){
  events.push('consume');assert.ok(f.store.record.slots[0].world.earthExpedition.story.steps.includes(STEP));
  if(failure==='consume-return')return{ok:false,error:'labelled cleanup refusal'};
  if(failure==='consume-throw'||failure==='both-throw')throw Error('labelled cleanup exception');
  return F.consume(t);
 }};
 withRules(rules,()=>withSync(()=>{
  events.push('sync');if(failure==='sync-return')return{ok:false,error:'labelled scene refusal'};
  if(failure==='sync-throw'||failure==='both-throw')throw Error('labelled scene exception');
 },()=>{
  const result=command(f,ticket);assert.equal(result.ok,true);assert.equal(result.error,undefined);assert.match(result.text,/Alternate brace fitted/);
  assert.match(result.warning,/Brace completion was saved/);assert.match(result.warning,/labelled/);assert.ok(f.sim.state.earthExpedition.story.steps.includes(STEP));
  assert.ok(f.store.record.slots[0].world.earthExpedition.story.steps.includes(STEP));assert.equal(f.saveCalls,1);assert.equal(f.store.revision,2);
  const before=snapshot(f),calls=events.length,duplicate=command(f,ticket);assert.ok(duplicate.ok&&duplicate.duplicate);assert.equal(snapshot(f),before);assert.equal(f.saveCalls,1);assert.equal(events.length,calls);
 }));assert.deepEqual(events,['consume','sync']);
});
