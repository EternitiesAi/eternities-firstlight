'use strict';
/* Retained exact-fragment lifecycle composition. Historical repository fixtures
 * supply only the original paid expedition. The new load is accepted through
 * actual LL/R; its carrier and player travel through actual Core/World solvers.
 * Storage is an isolated memory adapter and dialog pause is a labelled boundary;
 * this is not a DOM, native persistence, rendered-camera or human-feel check. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js')),E=require(path.join(ROOT,'src/earth-expedition.js')),CH=require(path.join(ROOT,'src/characters.js')),A=require(path.join(ROOT,'src/adventure.js'));
const D=require('../src/earth-consignment-data.js'),L=require('../src/local-life.js'),M=require('../src/earth-consignment-motion.js');require('../src/earth-consignment.js');
const Art=require('../src/earth-consignment-art.js'),fragment=require('./helpers/consignment-app-fragment.cjs')();
const fixtures={blade:{path:'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json',sha:'3b8e39f119e5eda83211f036b13f982961a96830d24235a1a86065ee32c99a93',choice:'south-stormfall'},bow:{path:'tests/fixtures/earth-homecoming-prerequisites/bow/ALL_TWELVE_PREREQUISITES_EARNED.json',sha:'ea92d097b01b1d9610a25e02300b07a629c257a58d1a57e09e67de27648f657f',choice:'south-coppice'}};
const copy=o=>JSON.parse(JSON.stringify(o)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function earned(variant){const f=fixtures[variant],bytes=fs.readFileSync(path.join(ROOT,f.path));assert.equal(sha(bytes),f.sha,'historical earned source remains byte-bound');const raw=JSON.parse(bytes);assert.ok(E.validate(raw.earthExpedition).story.claimed);return raw;}
const independent=s=>JSON.stringify({earthExpedition:s.earthExpedition,realmTrails:s.realmTrails,journeys:s.journeys,bridgeCommunity:s.bridgeCommunity,homeHistory:s.homeHistory,earthHomecoming:s.earthHomecoming,cosmosCampaign:s.cosmosCampaign,atlantisCampaign:s.atlantisCampaign,heavenCampaign:s.heavenCampaign,hellCampaign:s.hellCampaign,oldRecords:Object.fromEntries(D.OLD_IDS.map(id=>[id,s.localLife.records[id]])),equipment:s.adventure.equipment,arsenal:s.adventure.arsenal,companion:s.adventure.companion,balances:{xp:s.adventure.xp,coins:s.adventure.coins,ore:s.adventure.ore,inventory:s.sandbox.inventory}});
class MemoryStorage{
 constructor(raw){this.values=new Map([[C.KEY,JSON.stringify(raw)]]);this.refuse=false;this.writes=0;}
 getItem(k){return this.values.get(k)??null;}
 setItem(k,v){if(this.refuse)throw Error('Labelled isolated storage quota refusal');this.values.set(k,String(v));this.writes++;}
}
// Execute the real parent-owned fragment in the same JS realm as real M/Core.
// Only its outer app bindings and notice reset sink are supplied by this harness.
const compose=new Function('sim','characterStore','RealmEarthConsignmentMotion','RealmEarthConsignmentArt','RealmEarthConsignmentData','rpg',
 'function worldContext(){return{sim,active:characterStore.active,revision:characterStore.revision};}\n'+fragment+
 '\nreturn{context:consignmentContext,control:consignmentControl,tick:tickConsignment,present:consignmentPresentation,sync:syncConsignmentOwner,adopt(nextSim,nextStore){sim=nextSim;characterStore=nextStore;}};');
function harness(variant='blade'){
 const source=earned(variant),storage=new MemoryStorage(source),store=new CH.Store(storage);store.load();store.writer=true;
 const imported=store.command('import',{world:source},source,store.revision);assert.ok(imported.ok,imported.error);
 let sim=new C.Simulation(imported.state),noticeResets=0;
 const api=compose(sim,store,M,Art,D,{civic:{carrier:{reset(reason){assert.equal(reason,'owner');noticeResets++;}}}}),save=c=>store.save(c);
 const metrics={variant,fixture:fixtures[variant].path,fixtureSha256:fixtures[variant].sha,walkFrames:0,motionFrames:0,maxMovement:0,arrivalCommits:0};
 function tick(dt=.1){sim.tick(dt);const before=JSON.stringify(sim.state),elapsed=sim.elapsed;api.tick(dt);assert.equal(JSON.stringify(sim.state),before,'motion/presentation changes no durable state');assert.equal(sim.elapsed,elapsed,'fragment does not advance the Core clock');assert.ok(sim.state.adventure.hp>0,'ordinary route remains alive');}
 function enter(){const preview=W.preview(api.context(),'earthlands');assert.ok(preview.ok,preview.error);assert.ok(W.enter(preview.ticket,api.context(),{save,build(){}}).ok);api.present();}
 function walk(x,z){assert.ok(sim.moveTo(x,z).ok);let frames=0;while(sim.playerPath.length&&frames++<12000){const previous={...sim.state.player};tick();assert.ok(W.segment(sim.room,previous,sim.state.player,.31));}assert.ok(frames<12000&&distance(sim.state.player,{x,z})<.25);metrics.walkFrames+=frames;}
 function command(type,payload={},extra={}){const result=L.command(api.context(),type,{quest:D.ID,...payload},{save,...extra});api.present();return result;}
 function follow(view){const p=sim.state.player,d=distance(p,view);if(d>.5){const previous={...p};assert.ok(W.segment(D.ROOM,p,view,.31),'player has a supported full approach segment');sim.manual(view.x-p.x,view.z-p.z,Math.min(.1,d/3.2));assert.ok(W.segment(D.ROOM,previous,sim.state.player,.31));}}
 function ready(){assert.ok(api.control('continue').ok);let view=M.current(api.context()),frames=0;const writes=storage.writes,prefix=copy(sim.state.localLife.records[D.ID].steps);
  while(!view.ready&&frames++<6000){follow(view);const previous=view;tick();view=M.current(api.context());assert.ok(view&&view.status==='moving'||view?.ready,view?.detail||view?.reason);const moved=distance(previous,view);assert.ok(moved<=.160000001,'physical movement stays within the actual Core step budget');assert.ok(W.segment(D.ROOM,previous,view,.65));assert.equal(storage.writes,writes,'no per-frame persistence');assert.deepEqual(sim.state.localLife.records[D.ID].steps,prefix,'no per-frame arrival');metrics.maxMovement=Math.max(metrics.maxMovement,moved);metrics.motionFrames++;}
  assert.ok(frames<6000&&view.ready);const next=D.routes[D.choice(fixtures[variant].choice).route][view.checkpointIndex+1];assert.ok(distance(view,next)<=1e-9,'ready proof follows physical travel to the exact next stop');return view;
 }
 function arrival(){const ticket=M.arrivalTicket(api.context()).ticket,step=D.required(fixtures[variant].choice)[sim.state.localLife.records[D.ID].steps.length];assert.ok(ticket);return{ticket,step};}
 function adopt(next){api.adopt(next,store);sim=next;}
 enter();walk(-106,-105);const old=independent(sim.state),accepted=command('accept',{choice:fixtures[variant].choice});assert.ok(accepted.ok,accepted.error);assert.equal(independent(sim.state),old);assert.deepEqual(sim.state.localLife.records[D.ID].steps,[]);
 return{get sim(){return sim;},store,storage,api,save,command,tick,follow,ready,arrival,enter,adopt,metrics,get noticeResets(){return noticeResets;}};
}
function report(h,scenario){console.log('APP_LIFECYCLE '+JSON.stringify({...h.metrics,scenario,scope:'Exact staged fragment + actual M/Core/World/Store/LL/R; historical portable earned prerequisite; isolated memory persistence and explicit pause/settings/death boundary inputs; no browser/DOM/pixels'}));}

test('both repository earned worlds migrate without rewriting original owners or inventing new arrival history',()=>{
 for(const variant of Object.keys(fixtures)){const raw=earned(variant),sim=new C.Simulation(raw);assert.equal(JSON.stringify(sim.state.earthExpedition),JSON.stringify(raw.earthExpedition));for(const id of D.OLD_IDS)assert.deepEqual(sim.state.localLife.records[id],raw.localLife.records[id]);assert.deepEqual(sim.state.localLife.records[D.ID],D.freshRecord());assert.equal(M.current({sim}),null);}
});
test('exact post-Core updater refuses reused elapsed and preserves physical position across paused camera/time Store saves',()=>{
 const h=harness(),lease=h.sim.consignmentOwnerLease;assert.ok(h.api.control('continue').ok);const before=M.current(h.api.context());assert.throws(()=>h.api.tick(.1),/fresh Core simulation tick/);assert.equal(M.current(h.api.context()).x,before.x);h.tick();assert.ok(distance(M.current(h.api.context()),before)>0);
 const moving=M.current(h.api.context()),position={x:moving.x,z:moving.z};h.sim.paused=true;
 for(const cameraMode of['adventure','follow']){const revision=h.store.revision;assert.ok(h.sim.setTime(9));h.sim.state.settings.cameraMode=cameraMode;assert.ok(h.save(h.sim.snapshot()).ok);assert.ok(h.store.revision>revision);const saved=h.store.record.slots.find(s=>s.id===h.store.active).world;assert.equal(saved.settings.cameraMode,cameraMode);assert.equal(saved.hour,9);h.tick();assert.equal(h.api.context().revision,h.store.revision);assert.equal(h.sim.consignmentOwnerLease,lease);const paused=M.current(h.api.context());assert.equal(paused.status,'paused');assert.equal(paused.moving,false);assert.equal(distance(paused,position),0);assert.ok(M.isProjection(moving,h.api.context()));}
 h.sim.paused=false;h.tick();assert.ok(distance(M.current(h.api.context()),position)>0);assert.ok(distance(M.current(h.api.context()),position)<=.160000001);report(h,'post-Core fence and harmless paused observation');
});
for(const variant of Object.keys(fixtures))test(variant+' physical ready ticket survives paused reads and actual quota refusal, then consumes before presentation',()=>{
 const h=harness(variant),old=independent(h.sim.state);h.ready();const {ticket,step}=h.arrival(),lease=h.sim.consignmentOwnerLease;h.sim.paused=true;
 for(let i=0;i<10;i++){h.tick();assert.equal(M.arrivalTicket(h.api.context()).ticket,ticket);assert.equal(h.sim.consignmentOwnerLease,lease);}
 assert.equal(h.command('step',{step}).ok,false);assert.equal(h.command('step',{step,motionTicket:copy(ticket)}).ok,false);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);
 const state=JSON.stringify(h.sim.state),bytes=h.storage.getItem(CH.KEY),writes=h.storage.writes;h.storage.refuse=true;const refused=h.command('step',{step,motionTicket:ticket});assert.equal(refused.ok,false);assert.match(refused.error,/quota refusal/);assert.equal(JSON.stringify(h.sim.state),state);assert.equal(h.storage.getItem(CH.KEY),bytes);assert.equal(M.arrivalTicket(h.api.context()).ticket,ticket);assert.equal(h.sim.paused,true);
 h.storage.refuse=false;let syncSeen=0;const result=h.command('step',{step,motionTicket:ticket},{sync(sim){syncSeen++;assert.equal(M.validateArrival(h.api.context(),ticket,step).ok,false,'consumed before any scene/presentation callback');h.api.present();assert.equal(sim.consignmentPresentation.checkpointIndex,1);assert.equal(sim.consignmentPresentation.status,'waiting');A.syncScene(sim);}});
 assert.ok(result.ok,result.error);assert.equal(result.warning,undefined);assert.equal(syncSeen,1);assert.equal(h.storage.writes,writes+1);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[step]);assert.equal(M.arrivalTicket(h.api.context()).ok,false);assert.equal(independent(h.sim.state),old);h.metrics.arrivalCommits++;
 const paidBytes=h.storage.getItem(CH.KEY);assert.ok(h.command('step',{step,motionTicket:ticket}).duplicate);assert.equal(h.storage.getItem(CH.KEY),paidBytes);assert.equal(h.storage.writes,writes+1);report(h,'paused proof, bare/clone refusal, actual quota retry and consume ordering');
});
test('forced outgoing reset revokes ready proof before actual saved-character import adoption and returns to its durable checkpoint',()=>{
 const h=harness();h.ready();const {ticket,step}=h.arrival(),outgoing=h.sim,view=M.current(h.api.context()),lease=outgoing.consignmentOwnerLease;assert.deepEqual(outgoing.state.localLife.records[D.ID].steps,[]);
 // Actual Store import changes the active slot synchronously. The app then
 // revokes the outgoing Sim before adopting the returned validated world.
 const loaded=h.store.record.slots.find(s=>s.id===h.store.active).world,active=h.store.active,imported=h.store.command('import',{world:loaded},h.sim.snapshot(),h.store.revision);assert.ok(imported.ok,imported.error);assert.notEqual(h.store.active,active);
 h.api.sync(true);assert.notEqual(outgoing.consignmentOwnerLease,lease);assert.equal(M.isProjection(view),false);assert.equal(M.validateArrival(h.api.context(),ticket,step).ok,false);assert.ok(h.noticeResets>0);
 // Actual durable accepted world, no planted checkpoint and no copied ticket.
 h.adopt(new C.Simulation(imported.state));h.enter();const current=M.current(h.api.context());assert.equal(current.checkpointIndex,0);assert.equal(current.status,'waiting');assert.equal(current.x,-106);assert.equal(current.z,-105);assert.equal(current.distanceTraveled,0);assert.equal(M.isProjection(view),false);assert.equal(M.validateArrival(h.api.context(),ticket,step).ok,false);report(h,'outgoing reset before actual Store-import Sim adoption');
});
test('actual adventure damage death invalidates physical ready proof without granting or recording a load',()=>{
 const h=harness('bow');h.ready();const {ticket,step}=h.arrival(),view=M.current(h.api.context()),deaths=h.sim.state.adventure.deaths,old=independent(h.sim.state);assert.ok(A.takeDamage(h.sim,1000000),'actual damage crosses the real death boundary');assert.equal(h.sim.state.adventure.hp,0);assert.equal(h.sim.state.adventure.deaths,deaths+1);
 h.api.tick(.1);assert.equal(h.sim.consignmentPresentation,null);assert.equal(M.isProjection(view),false);assert.equal(M.validateArrival(h.api.context(),ticket,step).ok,false);assert.equal(h.command('step',{step,motionTicket:ticket}).ok,false);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);assert.equal(independent(h.sim.state),old);report(h,'actual death expiry');
});
test('actual free home and re-entry retain original home and last physically earned durable checkpoint, discarding only unsaved readiness',()=>{
 const h=harness(),home=copy(h.sim.returnPos);h.ready();let proof=h.arrival();assert.ok(h.command('step',{step:proof.step,motionTicket:proof.ticket}).ok);h.metrics.arrivalCommits++;h.ready();proof=h.arrival();const view=M.current(h.api.context());assert.equal(view.checkpointIndex,1);assert.ok(view.ready);
 assert.ok(W.leave(h.sim).ok);h.api.present();assert.equal(M.isProjection(view),false);assert.equal(M.validateArrival(h.api.context(),proof.ticket,proof.step).ok,false);assert.deepEqual(h.sim.state.player,home);assert.equal(h.sim.consignmentPresentation,null);assert.ok(h.save(h.sim.snapshot()).ok);h.enter();const resumed=M.current(h.api.context());assert.deepEqual(h.sim.returnPos,home);assert.deepEqual(h.sim.worldTrip.home,home);assert.equal(resumed.checkpointIndex,1);assert.equal(resumed.status,'waiting');assert.equal(resumed.x,-68);assert.equal(resumed.z,-99);assert.equal(resumed.distanceTraveled,0);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,['arrive-meadow-stop']);report(h,'actual free return and original-home re-entry');
});
