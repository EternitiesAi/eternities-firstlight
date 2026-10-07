/* Focused integrated CPU rules checks. Histories, positions, leases and storage
 * are labelled synthetic fixtures. Real production E.command/F/Core/Store run;
 * command-earned journeys and browser persistence are separate evidence. */
'use strict';
const path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test');
const ROOT=path.resolve(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),E=require(path.join(ROOT,'src/earth-expedition.js'));
const W=require(path.join(ROOT,'src/world-foundations.js')),CH=require(path.join(ROOT,'src/characters.js')),F=require('../src/earth-fieldcraft.js');
const copy=o=>JSON.parse(JSON.stringify(o)),rad=n=>n*Math.PI/180,STEP='brace-root-channel';
function fixture({steps=E.definition.steps.slice(0,6).map(s=>s.id),claimed=false,branch='stormfall-recovery'}={}){
 const sim=new C.Simulation();
 sim.state.adventure.started=true;sim.state.adventure.owned=['trail_blade','travel_coat'];sim.state.adventure.equipment.weapon='trail_blade';sim.state.adventure.equipment.armor='travel_coat';
 sim.state.earthExpedition.story={accepted:true,branch,steps:[...steps],claimed};
 sim.returnPos={...sim.state.player};sim.room='world-earthlands';sim.state.player={x:-145,z:-84,yaw:0};
 const f={sim,active:'synthetic-fieldcraft-owner',revision:7,ownerLease:Object.freeze({}),allowSave:true,saved:null,saveCalls:0};
 sim.worldTrip={active:f.active,realm:'earthlands',home:copy(sim.returnPos)};
 sim.fieldcraftOwnerLease=f.ownerLease;
 f.ctx=()=>({sim:f.sim,active:f.active,revision:f.revision,ownerLease:f.ownerLease});
 f.save=candidate=>{f.saveCalls++;if(!f.allowSave)return{ok:false,error:'labelled synthetic storage refusal'};f.saved=C.validate(candidate);return{ok:true};};
 C.validate(sim.snapshot());return f;
}
function managedFixture(){
 const f=fixture(),data=new Map(),storage={data,failWrite:false,getItem:k=>data.get(k)??null,setItem(k,v){if(this.failWrite)throw Error('labelled synthetic quota refusal');data.set(k,v);}};
 const library={version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:f.sim.snapshot()}]};
 storage.setItem(CH.KEY,JSON.stringify(library));const store=new CH.Store(storage);store.load();store.writer=true;
 f.storage=storage;f.store=store;f.active=store.active;f.sim.worldTrip.active=f.active;
 f.ctx=()=>({sim:f.sim,active:store.active,revision:store.revision,ownerLease:f.ownerLease});
 f.save=value=>{f.saveCalls++;const r=store.save(value);if(r.ok)f.saved=C.validate(value);return r;};return f;
}
const durable=f=>JSON.stringify(f.sim.snapshot());
function begin(f){const r=F.begin(f.ctx());assert.ok(r.ok,r.error);assert.ok(r.plan);return r.plan;}
function fit(f,plan=begin(f),{yaw=0,pitch=rad(14)}={}){
 let ticket;
 for(let i=0;i<4;i++){
  assert.ok(F.inspect(f.ctx(),plan).ok);
  assert.ok(F.adjust(f.ctx(),plan,{sectionId:'brace-'+(i+1),yaw,pitch}).ok);
  const r=F.seat(f.ctx(),plan);assert.ok(r.ok,r.error);if(i<3)assert.equal(r.ticket,undefined);else ticket=r.ticket;
 }
 assert.ok(F.validate(f.ctx(),ticket).ok);return{plan,ticket};
}
// Call the integrated command's own proof gate, saver and consumption directly.
function finalize(f,ticket){
 return E.command(f.ctx(),'step',{quest:E.definition.id,step:STEP,fittingTicket:ticket},{save:f.save});
}

test('canonical four sections conserve the independently measured old span and fixed east face',()=>{
 const g=F.GEOMETRY,total=Math.sqrt(2.03*2.03+7.8*7.8);
 assert.deepEqual(g.from,[-143.294,1.75,-78.9]);assert.deepEqual(g.to,[-143.294,3.78,-71.1]);
 assert.ok(Math.abs(g.length-total)<1e-12);assert.ok(Math.abs(g.sectionLength-total/4)<1e-12);
 assert.equal(g.sections.length,4);assert.equal(g.receivers.length,5);assert.equal(g.width,.16);assert.equal(g.depth,.025);
 for(let i=0;i<4;i++){
  const s=g.sections[i];assert.equal(s.id,'brace-'+(i+1));assert.deepEqual(s.from,g.receivers[i].point);assert.deepEqual(s.to,g.receivers[i+1].point);
  assert.ok(Math.abs(Math.hypot(...s.to.map((n,j)=>n-s.from[j]))-total/4)<1e-12);
 }
 assert.ok(Object.isFrozen(g)&&Object.isFrozen(g.sections[0].from)&&Object.isFrozen(g.receivers[0]));
 assert.throws(()=>{g.sections[0].from[0]=0;},TypeError);
});
test('all preparations are transient and produce no durable write or payout',()=>{
 const f=fixture(),before=durable(f),{plan,ticket}=fit(f);
 assert.equal(durable(f),before);assert.equal(f.saveCalls,0);assert.equal(F.current(f.sim).complete,true);
 assert.ok(F.isProjection(F.projection(plan)));assert.ok(F.validate(f.ctx(),ticket).ok);
 assert.equal(F.consume(ticket).ok,false,'seating is not a saved completed step');assert.equal(durable(f),before);
});
test('root, passage face, drain and substituted section receivers never authorize seating',()=>{
 const f=fixture(),plan=begin(f),before=durable(f);
 for(const id of ['living-root','west-wall','drain','east-joint-9',null,{}])assert.equal(F.inspect(f.ctx(),plan,id).ok,false);
 assert.equal(F.seat(f.ctx(),plan).ok,false);assert.ok(F.inspect(f.ctx(),plan,'east-joint-0').ok);assert.equal(F.seat(f.ctx(),plan).ok,false);
 assert.ok(F.inspect(f.ctx(),plan,'east-joint-1').ok);
 for(const extra of [{sectionId:'brace-2'},{receiverFrom:'east-joint-1'},{receiverTo:'drain'}])assert.equal(F.adjust(f.ctx(),plan,{yaw:0,pitch:rad(14),...extra}).ok,false);
 assert.equal(durable(f),before);
});
test('finite preview bounds, wrong direction and actual endpoint distance are checked',()=>{
 const f=fixture(),plan=begin(f),before=durable(f);assert.ok(F.inspect(f.ctx(),plan).ok);
 for(const pose of [null,[],{yaw:NaN,pitch:0},{yaw:0,pitch:Infinity},{yaw:0,pitch:2},{yaw:30,pitch:0}])assert.equal(F.adjust(f.ctx(),plan,pose).ok,false);
 for(const pose of [{yaw:Math.PI,pitch:rad(14)},{yaw:0,pitch:-rad(14)}])assert.equal(F.adjust(f.ctx(),plan,pose).ok,false);
 assert.ok(F.adjust(f.ctx(),plan,{yaw:rad(2),pitch:rad(14)}).ok);assert.equal(F.seat(f.ctx(),plan).ok,false);
 assert.ok(F.adjust(f.ctx(),plan,{yaw:0,pitch:rad(14)}).ok);assert.ok(F.seat(f.ctx(),plan).ok);assert.equal(durable(f),before);
});
test('bounded numeric yaw/pitch court uses an independent chord-length oracle',()=>{
 const f=fixture(),total=Math.sqrt(2.03**2+7.8**2),L=total/4,p0=Math.atan2(2.03,7.8),before=durable(f);
 let accepted=0,rejected=0;
 for(let yaw=0;yaw<=8;yaw+=.5)for(let offset=-4;offset<=4;offset+=.5){
  const plan=begin(f),y=rad(yaw),p=p0+rad(offset);
  assert.ok(F.inspect(f.ctx(),plan).ok);assert.ok(F.adjust(f.ctx(),plan,{yaw:y,pitch:p}).ok);
  const dot=Math.cos(y)*Math.cos(p)*Math.cos(p0)+Math.sin(p)*Math.sin(p0);
  const chord=L*Math.sqrt(Math.max(0,2*(1-dot)));
  const expected=Math.abs(y)<=rad(2)+1e-12&&Math.abs(p-p0)<=rad(2)+1e-12&&chord<=.055+1e-12;
  assert.equal(F.seat(f.ctx(),plan).ok,expected,JSON.stringify({yaw,offset,chord,expected}));
  if(expected)accepted++;else rejected++;
 }
 assert.ok(accepted>0&&rejected>accepted);assert.equal(durable(f),before);assert.equal(f.saveCalls,0);
});
test('immutable useful preview bounds reject out-of-domain values without silent clamping or epoch changes',()=>{
 assert.strictEqual(F.previewBounds,F.GEOMETRY.previewBounds);assert.ok(Object.isFrozen(F.previewBounds)&&Object.isFrozen(F.previewBounds.yaw)&&Object.isFrozen(F.previewBounds.pitch));
 assert.deepEqual(F.previewBounds,{yaw:{min:0,max:rad(20)},pitch:{min:0,max:rad(35)}});
 const f=fixture(),plan=begin(f),view=F.current(f.sim),before=durable(f);
 for(const pose of [{yaw:-1e-9,pitch:0},{yaw:rad(20)+1e-9,pitch:0},{yaw:0,pitch:-1e-9},{yaw:0,pitch:rad(35)+1e-9}]){
  assert.equal(F.adjust(f.ctx(),plan,pose).ok,false);assert.ok(F.isProjection(view),'rejected adjustment leaves prior epoch usable');assert.deepEqual(F.current(f.sim),view);
 }
 assert.equal(durable(f),before);assert.equal(f.saveCalls,0);
});
test('every legal extreme pose preserves sectional length, rises above soil and points to the east side',()=>{
 const f=fixture(),plan=begin(f),before=durable(f),L=Math.sqrt(2.03**2+7.8**2)/4;
 for(const yaw of [0,rad(20)])for(const pitch of [0,rad(35)]){
  assert.ok(F.adjust(f.ctx(),plan,{yaw,pitch}).ok);const view=F.current(f.sim),s=view.sections.find(s=>s.preview);
  assert.ok(Math.abs(Math.hypot(...s.to.map((n,i)=>n-s.from[i]))-L)<1e-12);assert.ok(s.to[0]>=s.from[0]-1e-12);assert.ok(s.to[1]>=s.from[1]-1e-12);
  assert.ok(Math.min(s.from[1],s.to[1])-(.16+.025)/2>1.57,'independent conservative full-cross-section floor margin');
  const expected=s.from.map((n,i)=>n+[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)][i]*L);
  expected.forEach((n,i)=>assert.ok(Math.abs(n-s.to[i])<1e-12));
 }
 assert.equal(durable(f),before);
});
test('forged plans, cloned tickets and incomplete assembly are rejected',()=>{
 const f=fixture(),plan=begin(f),before=durable(f);
 for(const forged of [{kind:'earth-fieldcraft-v1-plan'},copy(plan),null,1]){
  assert.equal(F.inspect(f.ctx(),forged).ok,false);assert.equal(F.adjust(f.ctx(),forged,{yaw:0,pitch:rad(14)}).ok,false);assert.equal(F.seat(f.ctx(),forged).ok,false);
 }
 assert.equal(F.validate(f.ctx(),{}).ok,false);const {ticket}=fit(f,plan);
 assert.equal(F.validate(f.ctx(),copy(ticket)).ok,false);assert.equal(F.validate(f.ctx(),{...ticket}).ok,false);assert.equal(durable(f),before);
});
test('views are immutable, branded, live and invalidated by subsequent adjustments',()=>{
 const f=fixture(),plan=begin(f),v=F.projection(plan);assert.ok(F.isProjection(v));
 assert.ok(F.isProjection(v,f.sim.state.earthExpedition));assert.equal(F.isProjection(v,copy(f.sim.state.earthExpedition)),false);assert.equal(F.isProjection(v,fixture().sim.state.earthExpedition),false);
 assert.equal(F.isProjection(copy(v)),false);assert.equal(F.isProjection({...v}),false);assert.throws(()=>{v.sections[0].to[0]=0;},TypeError);
 assert.ok(F.adjust(f.ctx(),plan,{yaw:0,pitch:rad(14)}).ok);assert.equal(F.isProjection(v),false);assert.ok(F.isProjection(F.current(f.sim)));
 const live=F.current(f.sim);f.sim.state.player.x=-100;assert.equal(F.current(f.sim),null);assert.equal(F.isProjection(live),false);
});
for(const [name,mutate] of [
 ['different active character',f=>f.active='another-owner'],
 ['invalid roster revision',f=>f.revision=NaN],
 ['missing context lease',f=>f.ownerLease=undefined],
 ['copied context lease',f=>f.ownerLease=Object.freeze(copy(f.ownerLease))],
 ['replaced Simulation lease',f=>f.sim.fieldcraftOwnerLease=Object.freeze({})],
 ['replaced lease on otherwise identical owner',f=>{f.ownerLease=Object.freeze({});f.sim.fieldcraftOwnerLease=f.ownerLease;}],
 ['changed adventure revision',f=>f.sim.state.adventure.revision++],
 ['different Simulation',f=>{const old=f.sim,next=fixture();f.sim=next.sim;f.active=next.active;f.revision=next.revision;assert.notStrictEqual(f.sim,old);}],
 ['in-place imported state',f=>f.sim.state=copy(f.sim.state)],
 ['replaced adventure owner',f=>f.sim.state.adventure=copy(f.sim.state.adventure)],
 ['new trip with identical fields',f=>f.sim.worldTrip=copy(f.sim.worldTrip)],
 ['changed trip contents',f=>f.sim.worldTrip.active='another-owner'],
 ['other Earth travel owner',f=>f.sim.earthTrip={active:f.active}],
 ['wrong room',f=>f.sim.room='earth-hearthwater-approach'],
 ['underwater',f=>f.sim.worldDive=true],
 ['fallen',f=>f.sim.state.adventure.hp=0],
 ['death followed by recovered health',f=>{f.sim.state.adventure.deaths++;f.sim.state.adventure.hp=100;}],
 ['non-finite health',f=>f.sim.state.adventure.hp=NaN],
 ['changed home checkpoint',f=>{f.sim.returnPos.x++;f.sim.worldTrip.home=copy(f.sim.returnPos);}],
 ['outside work range',f=>f.sim.state.player.x=-140],
 ['blocked east wall',f=>f.sim.state.player={x:-144,z:-81,yaw:0}],
 ['changed job branch',f=>f.sim.state.earthExpedition.story.branch='managed-coppice'],
 ['changed prerequisites',f=>f.sim.state.earthExpedition.story.steps.pop()]
])test('stale fitting refuses '+name+' without further durable mutation',()=>{
 const f=fixture(),{plan,ticket}=fit(f);mutate(f);const before=structuredClone(f.sim.state);
 assert.equal(F.validate(f.ctx(),ticket).ok,false);assert.equal(F.inspect(f.ctx(),plan).ok,false);assert.equal(F.adjust(f.ctx(),plan,{yaw:0,pitch:rad(14)}).ok,false);assert.equal(F.seat(f.ctx(),plan).ok,false);
 assert.deepEqual(f.sim.state,before);assert.equal(f.saveCalls,0);
});
test('bad owner, unaccepted or malformed histories cannot begin a fitting',()=>{
 assert.equal(F.begin(null).ok,false);
 const f=fixture();for(const ctx of [{...f.ctx(),active:''},{...f.ctx(),revision:NaN},{...f.ctx(),revision:-1},{...f.ctx(),ownerLease:undefined}])assert.equal(F.begin(ctx).ok,false);
 f.sim.state.earthExpedition=E.fresh();assert.equal(F.begin(f.ctx()).ok,false);
 f.sim.state.earthExpedition.story.steps=['not-a-step'];assert.equal(F.begin(f.ctx()).ok,false);
});
test('only a matching caller-owned frozen opaque lease can begin; rules never stamp or persist it',()=>{
 const f=fixture(),before=durable(f),original=f.sim.fieldcraftOwnerLease;
 for(const lease of [null,{},Object.freeze([]),Object.freeze({id:1}),Object.freeze(new Date()),Object.freeze(function(){})]){
  f.ownerLease=lease;f.sim.fieldcraftOwnerLease=lease;assert.equal(F.begin(f.ctx()).ok,false);assert.strictEqual(f.sim.fieldcraftOwnerLease,lease,'rules never replace a rejected caller stamp');
 }
 f.ownerLease=original;f.sim.fieldcraftOwnerLease=original;assert.ok(F.begin(f.ctx()).ok);assert.equal(durable(f),before);assert.equal(Object.hasOwn(f.sim.snapshot(),'fieldcraftOwnerLease'),false);
});
test('real Store.save time and camera writes change real roster revisions without ending the same fitting',()=>{
 const f=managedFixture(),plan=begin(f),lease=f.ownerLease,initial=f.store.revision;
 assert.ok(F.inspect(f.ctx(),plan).ok);
 f.sim.state.hour+=.1;f.sim.state.adventure.elapsed+=7;assert.ok(f.store.save(f.sim.snapshot()).ok);assert.equal(f.store.revision,initial+1);
 assert.ok(F.adjust(f.ctx(),plan,{yaw:0,pitch:rad(14)}).ok);assert.ok(F.seat(f.ctx(),plan).ok);
 f.sim.state.settings.cameraMode='follow';f.sim.state.settings.cameraFov=65;f.sim.state.settings.cameraViews.profiles.follow={yaw:.9,elevation:.88,zoom:1};
 assert.ok(f.store.save(f.sim.snapshot()).ok);assert.equal(f.store.revision,initial+2);assert.strictEqual(f.sim.fieldcraftOwnerLease,lease);assert.ok(F.isProjection(F.current(f.sim),f.sim.state.earthExpedition));
 let ticket;for(let i=1;i<4;i++){assert.ok(F.inspect(f.ctx(),plan).ok);assert.ok(F.adjust(f.ctx(),plan,{yaw:0,pitch:rad(14)}).ok);const r=F.seat(f.ctx(),plan);assert.ok(r.ok);ticket=r.ticket;}
 f.sim.state.adventure.elapsed+=7;assert.ok(f.store.save(f.sim.snapshot()).ok);assert.equal(f.store.revision,initial+3);assert.ok(F.validate(f.ctx(),ticket).ok);
 assert.ok(finalize(f,ticket).ok);assert.equal(f.store.revision,initial+4);assert.strictEqual(f.sim.fieldcraftOwnerLease,lease);assert.ok(f.store.record.slots[0].world.earthExpedition.story.steps.includes(STEP));
 assert.equal(Object.hasOwn(f.store.record.slots[0].world,'fieldcraftOwnerLease'),false);assert.equal(F.current(f.sim),null);
});
test('lease renewal rejects identical in-place import lifecycle even when durable bytes and references match',()=>{
 const f=managedFixture(),{plan,ticket}=fit(f),view=F.current(f.sim),before=durable(f),state=f.sim.state,trip=f.sim.worldTrip;
 f.ownerLease=Object.freeze({});f.sim.fieldcraftOwnerLease=f.ownerLease;
 assert.strictEqual(f.sim.state,state);assert.strictEqual(f.sim.worldTrip,trip);assert.equal(durable(f),before);
 assert.equal(F.validate(f.ctx(),ticket).ok,false);assert.equal(F.isProjection(view),false);assert.equal(F.current(f.sim),null);assert.equal(F.inspect(f.ctx(),plan).ok,false);assert.ok(F.begin(f.ctx()).ok);
});
test('real Store identical import and switch replace app lease/Simulation; old fitting cannot follow',()=>{
 const f=managedFixture(),{ticket}=fit(f),oldSim=f.sim,world=oldSim.snapshot(),originalActive=f.store.active;
 const imported=f.store.command('import',{world},world,f.store.revision);assert.ok(imported.ok);assert.deepEqual(imported.state,world);assert.notEqual(f.store.active,originalActive);
 f.sim=new C.Simulation(imported.state);f.ownerLease=Object.freeze({});f.sim.fieldcraftOwnerLease=f.ownerLease;
 assert.equal(F.validate(f.ctx(),ticket).ok,false);assert.equal(F.current(f.sim),null);
 const switched=f.store.command('switch',{id:originalActive},f.sim.snapshot(),f.store.revision);assert.ok(switched.ok);f.sim=new C.Simulation(switched.state);f.ownerLease=Object.freeze({});f.sim.fieldcraftOwnerLease=f.ownerLease;
 assert.equal(F.validate(f.ctx(),ticket).ok,false);assert.notStrictEqual(f.sim,oldSim);assert.equal(F.current(f.sim),null);assert.deepEqual(f.sim.state.earthExpedition,world.earthExpedition);
});
test('real Store quota refusal keeps fitted authority usable and retries the existing durable commit once',()=>{
 const f=managedFixture(),{ticket}=fit(f),before=durable(f),bytes=f.storage.getItem(CH.KEY),revision=f.store.revision;
 f.storage.failWrite=true;assert.equal(finalize(f,ticket).ok,false);assert.equal(f.store.revision,revision);assert.equal(f.storage.getItem(CH.KEY),bytes);assert.equal(durable(f),before);assert.ok(F.validate(f.ctx(),ticket).ok);
 f.storage.failWrite=false;assert.ok(finalize(f,ticket).ok);assert.equal(f.store.revision,revision+1);assert.equal(f.saveCalls,2);assert.equal(F.validate(f.ctx(),ticket).ok,false);
});
test('real Store.checkSource rejects a stale writer despite a matching local fitting lease',()=>{
 const f=managedFixture(),{ticket}=fit(f),before=durable(f),external=JSON.parse(f.storage.getItem(CH.KEY));external.revision++;
 const externalBytes=JSON.stringify(external);f.storage.setItem(CH.KEY,externalBytes);
 assert.ok(F.validate(f.ctx(),ticket).ok,'local geometry proof does not replace persistence ownership checks');
 assert.equal(finalize(f,ticket).ok,false);assert.equal(f.store.blocked,true);assert.equal(f.storage.getItem(CH.KEY),externalBytes);assert.equal(durable(f),before);assert.equal(f.sim.state.earthExpedition.story.steps.includes(STEP),false);
});
test('real Store missing editing lock refuses fastening; restored real writer can retry',()=>{
 const f=managedFixture(),{ticket}=fit(f),before=durable(f),bytes=f.storage.getItem(CH.KEY),revision=f.store.revision;f.store.writer=false;
 assert.equal(finalize(f,ticket).ok,false);assert.equal(durable(f),before);assert.equal(f.storage.getItem(CH.KEY),bytes);assert.equal(f.store.revision,revision);assert.ok(F.validate(f.ctx(),ticket).ok);
 f.store.writer=true;assert.ok(finalize(f,ticket).ok);assert.equal(f.store.revision,revision+1);
});
test('save refusal retains usable authority; real commit records once and consumption follows it',()=>{
 const f=fixture(),{plan,ticket}=fit(f),before=durable(f),beforeWorld=f.sim.snapshot();f.allowSave=false;
 assert.equal(finalize(f,ticket).ok,false);assert.equal(durable(f),before);assert.ok(F.validate(f.ctx(),ticket).ok);assert.ok(F.isProjection(F.projection(plan)));assert.equal(F.consume(ticket).ok,false);
 f.allowSave=true;const originalSave=f.save;f.save=value=>{const result=originalSave(value);if(result.ok)f.revision++;return result;};
 const result=finalize(f,ticket);assert.ok(result.ok,result.error);assert.equal(f.saveCalls,2);
 assert.deepEqual(f.sim.state.earthExpedition.story.steps,E.definition.steps.slice(0,7).map(s=>s.id));
 assert.equal(f.sim.state.earthExpedition.story.claimed,false);assert.equal(f.sim.state.adventure.xp,0);assert.equal(f.sim.state.adventure.coins,0);assert.equal(f.sim.state.adventure.ore,0);
 const normalize=s=>{delete s.earthExpedition;delete s.adventure.revision;delete s.journal;delete s.nextEvent;return s;};
 assert.deepEqual(normalize(f.sim.snapshot()),normalize(beforeWorld),'no schema, item, socket, inventory, payout, campaign or consent change');
 assert.equal(F.validate(f.ctx(),ticket).ok,false);assert.equal(F.consume(ticket).ok,false);assert.equal(F.current(f.sim),null);
 const after=durable(f);const duplicate=E.command(f.ctx(),'step',{quest:E.definition.id,step:STEP},{save:f.save});assert.ok(duplicate.ok&&duplicate.duplicate);assert.equal(durable(f),after);assert.equal(f.saveCalls,2);
});
test('throwing saver does not consume the fitted ticket or mutate accepted work',()=>{
 const f=fixture(),{ticket}=fit(f),before=durable(f);f.save=()=>{throw Error('labelled synchronous storage failure');};
 assert.equal(finalize(f,ticket).ok,false);assert.equal(durable(f),before);assert.ok(F.validate(f.ctx(),ticket).ok);
});
test('missing physical east support rejects the otherwise complete fitting',()=>{
 const f=fixture(),{ticket}=fit(f),before=durable(f),original=globalThis.RealmWorldFoundations;
 try{
  globalThis.RealmWorldFoundations={...W,definition:room=>{const d=W.definition(room);return d?{...d,solids:d.solids.filter(s=>s.id!=='elderweald-root-east-wall')}:null;}};
  assert.equal(F.validate(f.ctx(),ticket).ok,false);assert.equal(F.current(f.sim),null);assert.equal(durable(f),before);
 }finally{globalThis.RealmWorldFoundations=original;}
});
test('cancel, superseding plan and cold restart retain accepted work but discard partial fitting',()=>{
 const f=fixture(),before=durable(f),first=begin(f);assert.ok(F.inspect(f.ctx(),first).ok);
 const second=begin(f);assert.equal(F.inspect(f.ctx(),first).ok,false);assert.ok(F.cancel(second).ok);assert.equal(F.current(f.sim),null);assert.equal(F.seat(f.ctx(),second).ok,false);assert.equal(durable(f),before);
 const {plan,ticket}=fit(f);assert.ok(F.cancel(plan).ok);assert.equal(F.validate(f.ctx(),ticket).ok,false);
 const cold=new C.Simulation(f.sim.snapshot());assert.equal(F.current(cold),null);assert.deepEqual(cold.state.earthExpedition,f.sim.state.earthExpedition);
});
test('older completed and paid histories keep existing duplicate ordering, zero writes and exact history',()=>{
 for(const claimed of [false,true]){
  const steps=E.definition.steps.slice(0,claimed?8:7).map(s=>s.id),f=fixture({steps,claimed}),before=durable(f);
  assert.ok(F.begin(f.ctx()).duplicate);f.sim.state.player={x:8,z:106,yaw:0};
  const r=E.command(f.ctx(),'step',{quest:E.definition.id,step:STEP},{save:f.save});assert.ok(r.ok&&r.duplicate);
  assert.equal(durable(f),before);assert.equal(f.saveCalls,0);assert.equal(F.current(f.sim),null);
 }
});
test('integrated generic incomplete brace step refuses without proof and changes no durable state',()=>{
 const f=fixture(),before=durable(f);assert.equal(E.command(f.ctx(),'step',{quest:E.definition.id,step:STEP},{save:f.save}).ok,false);
 assert.equal(durable(f),before);assert.equal(f.saveCalls,0);
});
