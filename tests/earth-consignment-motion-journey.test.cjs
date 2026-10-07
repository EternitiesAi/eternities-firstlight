'use strict';
/* Actual Core movement + installed data/LL/command composition + real Store on a
 * labelled isolated in-memory storage adapter. No production edits or browser claim.
 * The prior paid expedition bytes are earned; this new job is accepted through
 * the staged command. Every new arrival is physically reached, never planted. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');const F=require('./helpers/consignment-fixtures.cjs');
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js')),E=require(path.join(ROOT,'src/earth-expedition.js')),A=require(path.join(ROOT,'src/adventure.js')),CH=require(path.join(ROOT,'src/characters.js')),S=require(path.join(ROOT,'src/sandbox.js'));
const D=require('../src/earth-consignment-data.js'),L=require('../src/local-life.js'),M=require('../src/earth-consignment-motion.js'),R=require('../src/earth-consignment.js');
const copy=o=>JSON.parse(JSON.stringify(o)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
class MemoryStorage{constructor(entries=[]){this.entries=new Map(entries);this.refuse=false;this.writes=0;}getItem(k){return this.entries.get(k)??null;}setItem(k,v){if(this.refuse)throw Error('Synthetic adapter quota refusal');this.entries.set(k,String(v));this.writes++;}}
function nearSegment(a,b,p){const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function realRosterThreat(sim,q){
 const runtime=sim.adventureRuntime;
 if(!runtime||runtime.room!==sim.room||!Array.isArray(runtime.enemies))return{clear:false,reason:'Actual hostile roster is unavailable.'};
 const foe=runtime.enemies.find(e=>e.hp>0&&!e.hidden&&nearSegment(q.from,q.to,e)<(e.kind==='charger'?10:e.kind==='boss'?7:8.5));
 return foe?{clear:false,reason:'Living hostile: '+foe.id}:{clear:true};
}
function harness(choice){
 const variant=choice.endsWith('coppice')?'fresh-bow':'fresh-blade',sourcePath=F.file(variant),raw=F.load(variant);
 assert.ok(E.validate(raw.earthExpedition).story.claimed);const storage=new MemoryStorage([[C.KEY,JSON.stringify(raw)]]);let store=new CH.Store(storage);store.load();store.writer=true;
 const imported=store.command('import',{world:raw},raw,store.revision);assert.ok(imported.ok,imported.error);let sim=new C.Simulation(imported.state),lease;
 function stamp(){lease=Object.freeze({});sim.consignmentOwnerLease=lease;}
 stamp();const ctx=()=>({sim,active:store.active,revision:store.revision,ownerLease:lease,definition:D.definition,threat:q=>realRosterThreat(sim,q)}),save=candidate=>store.save(candidate);
 const metrics={choice,sourcePath,sourceSha256:sha(sourcePath),ticks:0,motionFrames:0,manualFrames:0,solverWalks:0,arrivalCommits:0,motionDistance:0,maxMovement:0,arrivalIds:[],savedWrites:0,scope:'CPU installed-command/Core/Store composition; isolated memory storage, accelerated ticks; no browser or human acceptance'};
 function tick(dt=.1){sim.tick(dt);const before=JSON.stringify(sim.state),elapsed=sim.elapsed,result=M.update(ctx(),dt);assert.equal(JSON.stringify(sim.state),before,'M does not mutate any durable state/HP/inventory/elapsed');assert.equal(sim.elapsed,elapsed);metrics.ticks++;assert.ok(sim.state.adventure.hp>0,'actual traveller stays alive');return result;}
 function walk(x,z){assert.ok(sim.moveTo(x,z).ok,'actual Core navigation to '+x+','+z);metrics.solverWalks++;let frames=0;while(sim.playerPath.length&&frames++<12000){const previous={...sim.state.player};sim.tick(.1);assert.ok(W.segment(sim.room,previous,sim.state.player,.31),'actual complete player segment');assert.ok(sim.state.adventure.hp>0);}assert.ok(frames<12000&&distance(sim.state.player,{x,z})<.25);}
 function enter(){const c=ctx(),preview=W.preview(c,'earthlands');assert.ok(preview.ok,preview.error);assert.ok(W.enter(preview.ticket,c,{save,build:()=>{}}).ok);stamp();}
 function command(type,payload={}){return L.command(ctx(),type,{quest:D.ID,...payload},{save});}
 function follow(){const worker=M.current(ctx());assert.ok(worker);const player=sim.state.player;if(distance(player,worker)>.5){const from={...player};if(W.segment(sim.room,player,worker,.31)){sim.manual(worker.x-player.x,worker.z-player.z,Math.min(.1,distance(player,worker)/3.2));metrics.manualFrames++;}else{assert.ok(sim.moveTo(worker.x,worker.z).ok);metrics.solverWalks++;}assert.ok(W.segment(sim.room,from,sim.state.player,.31));}}
 function leg(){
  const start=M.current(ctx());assert.ok(start&&!start.arrived);assert.ok(M.continue(ctx()).ok);let view=M.current(ctx()),frames=0;
  const priorPrefix=copy(sim.state.localLife.records[D.ID].steps),writes=storage.writes;
  while(!view.ready&&view.status!=='blocked'&&frames++<10000){follow();const from=view,result=tick();assert.ok(result.ok,result.error);view=result.view;const length=distance(from,view);assert.ok(length<=.160000001,'physical speed bound');assert.ok(W.segment(D.ROOM,from,view,.65),'actual load segment');metrics.maxMovement=Math.max(metrics.maxMovement,length);metrics.motionDistance+=length;metrics.motionFrames++;assert.deepEqual(sim.state.localLife.records[D.ID].steps,priorPrefix,'no per-frame durable arrival');assert.equal(storage.writes,writes,'no per-frame writes');}
  assert.ok(frames<10000);return view;
 }
 function arrive(){const view=leg();assert.ok(view.ready,view.reason+': '+view.detail);const ticket=M.arrivalTicket(ctx()).ticket,step=D.required(choice)[sim.state.localLife.records[D.ID].steps.length];assert.equal(command('step',{step}).ok,false,'bare step refused at the actual supported receiving point');assert.equal(command('step',{step,motionTicket:copy(ticket)}).ok,false,'cloned proof refused by actual command');const result=command('step',{step,motionTicket:ticket});assert.ok(result.ok,result.error);assert.equal(result.warning,undefined,'normal postcommit consume and sync succeeds');metrics.arrivalIds.push(step);metrics.arrivalCommits++;assert.equal(M.validateArrival(ctx(),ticket,step).ok,false,'proof is consumed only once');return{ticket,step,result};}
 function reload(){const outgoing=sim;M.reset(outgoing,'cold-owner-reload');outgoing.consignmentOwnerLease=Object.freeze({});store=new CH.Store(storage);const loaded=store.load();assert.ok(!store.blocked);store.writer=true;sim=new C.Simulation(loaded.state);stamp();enter();return sim;}
 enter();walk(-106,-105);const accepted=command('accept',{choice});assert.ok(accepted.ok,accepted.error);assert.equal(M.current(ctx()).checkpointIndex,0);assert.equal(M.current(ctx()).x,-106);
 return{get sim(){return sim;},get store(){return store;},storage,ctx,save,tick,walk,follow,leg,arrive,command,reload,enter,metrics};
}
const independentHistories=s=>copy({earthExpedition:s.earthExpedition,realmTrails:s.realmTrails,bridgeCommunity:s.bridgeCommunity,journeys:s.journeys,homeHistory:s.homeHistory,earthHomecoming:s.earthHomecoming,cosmosCampaign:s.cosmosCampaign,atlantisCampaign:s.atlantisCampaign,heavenCampaign:s.heavenCampaign,hellCampaign:s.hellCampaign,oldRecords:Object.fromEntries(D.OLD_IDS.map(id=>[id,s.localLife.records[id]])),gear:s.adventure.equipment,sockets:s.adventure.arsenal,craft:s.adventure.realmCraft,binding:s.adventure.earthBinding,companion:s.adventure.companion,balances:{xp:s.adventure.xp,coins:s.adventure.coins,ore:s.adventure.ore,inventory:s.sandbox.inventory},defeated:s.adventure.defeated,drops:s.adventure.drops});
for(const choice of D.choices.map(c=>c.id))test(choice+' travels every physical arrival through installed commands and Store',()=>{
 const h=harness(choice),before=independentHistories(h.sim.state),home=copy(h.sim.returnPos),initialWrites=h.storage.writes;
 assert.equal(h.command('step',{step:D.required(choice)[0]}).ok,false,'bare generic step cannot manufacture motion');
 for(const step of D.required(choice)){const r=h.arrive();assert.equal(r.step,step);assert.deepEqual(h.sim.returnPos,home);assert.deepEqual(h.sim.worldTrip.home,home);assert.deepEqual(independentHistories(h.sim.state),before,'all existing ledgers, balances and gear retained');}
 const v=M.current(h.ctx());assert.ok(v.arrived&&!v.ready&&v.loaded);assert.equal(v.x,5.8);assert.equal(v.z,-69);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,D.required(choice));assert.equal(h.sim.state.localLife.records[D.ID].claimed,false);assert.equal(h.storage.writes-initialWrites,D.required(choice).length,'only checkpoint commits write');
 assert.equal(M.arrivalTicket(h.ctx()).ok,false);h.metrics.savedWrites=h.storage.writes-initialWrites;console.log('MOTION_JOURNEY '+JSON.stringify(h.metrics));
});
test('actual player-only travel cannot satisfy a bare worker-arrival command',()=>{
 const h=harness('south-stormfall'),next=D.routes['southern-meadow'][1];h.walk(next.x,next.z);assert.equal(h.command('step',{step:D.required('south-stormfall')[0]}).ok,false);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);assert.equal(M.current(h.ctx()).x,-106);assert.equal(M.current(h.ctx()).z,-105);assert.equal(M.arrivalTicket(h.ctx()).ok,false);
});
test('actual Store quota refusal keeps ready physical proof and permits exactly one retry',()=>{
 const h=harness('south-stormfall'),view=h.leg();assert.ok(view.ready);const ticket=M.arrivalTicket(h.ctx()).ticket,step=D.required('south-stormfall')[0],before=JSON.stringify(h.sim.state),bytes=h.storage.getItem(CH.KEY);h.storage.refuse=true;
 const refused=h.command('step',{step,motionTicket:ticket});assert.equal(refused.ok,false);assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.storage.getItem(CH.KEY),bytes);assert.equal(M.arrivalTicket(h.ctx()).ticket,ticket);assert.ok(M.isProjection(view));h.storage.refuse=false;
 assert.ok(h.command('step',{step,motionTicket:ticket}).ok);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[step]);assert.equal(M.validateArrival(h.ctx(),ticket,step).ok,false);
});
test('real Store clock and both camera saves retain motion lease and ready-ticket authority',()=>{
 const h=harness('south-stormfall');assert.ok(M.continue(h.ctx()).ok);h.follow();const view=h.tick().view,lease=h.sim.consignmentOwnerLease;
 for(const mode of['follow','tactical']){const revision=h.store.revision;h.sim.setTime(9);h.sim.state.settings.cameraMode=mode;h.sim.state.settings.cameraFov=mode==='follow'?45:80;assert.ok(h.save(h.sim.snapshot()).ok);assert.ok(h.store.revision>revision,'actual managed Store revision changes');assert.equal(h.sim.consignmentOwnerLease,lease);assert.ok(M.isProjection(view,h.ctx()));}
 const ready=h.leg();assert.ok(ready.ready);const ticket=M.arrivalTicket(h.ctx()).ticket,revision=h.store.revision;h.sim.setTime(17);assert.ok(h.save(h.sim.snapshot()).ok);assert.ok(h.store.revision>revision);assert.ok(M.validateArrival(h.ctx(),ticket,D.required('south-stormfall')[0]).ok);assert.ok(h.command('step',{step:D.required('south-stormfall')[0],motionTicket:ticket}).ok);
});
test('cold reload restarts at last actual saved checkpoint, discards unsaved ready proof',()=>{
 const h=harness('south-stormfall');h.arrive();const ready=h.leg();assert.ok(ready.ready);const ticket=M.arrivalTicket(h.ctx()).ticket,oldView=M.current(h.ctx()),stored=JSON.parse(h.storage.getItem(CH.KEY));assert.deepEqual(stored.slots.find(s=>s.id===h.store.active).world.localLife.records[D.ID].steps,['arrive-meadow-stop']);
 h.reload();assert.equal(M.isProjection(oldView),false);assert.equal(M.validateArrival(h.ctx(),ticket,'arrive-field-return-stop').ok,false);const v=M.current(h.ctx());assert.equal(v.status,'waiting');assert.equal(v.x,-68);assert.equal(v.z,-99);assert.equal(v.checkpointIndex,1);assert.equal(v.distanceTraveled,0);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,['arrive-meadow-stop']);assert.equal(M.arrivalTicket(h.ctx()).ok,false);
});
test('actual Store stale-source and writer refusal preserve unpaid ready state',()=>{
 const h=harness('south-stormfall');assert.ok(h.leg().ready);const ticket=M.arrivalTicket(h.ctx()).ticket,step=D.required('south-stormfall')[0],before=JSON.stringify(h.sim.state);h.store.writer=false;assert.equal(h.command('step',{step,motionTicket:ticket}).ok,false);assert.equal(JSON.stringify(h.sim.state),before);assert.equal(M.arrivalTicket(h.ctx()).ticket,ticket);h.store.writer=true;
 const external=JSON.parse(h.storage.getItem(CH.KEY));external.revision++;h.storage.setItem(CH.KEY,JSON.stringify(external));assert.equal(h.command('step',{step,motionTicket:ticket}).ok,false);assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.store.blocked,true);assert.equal(M.arrivalTicket(h.ctx()).ticket,ticket);
 h.reload();assert.equal(M.validateArrival(h.ctx(),ticket,step).ok,false);assert.equal(M.current(h.ctx()).checkpointIndex,0);
});
test('actual free home and re-entry retain independent home and last durable worker checkpoint',()=>{
 const h=harness('south-stormfall');h.arrive();assert.ok(M.continue(h.ctx()).ok);for(let i=0;i<20;i++){h.follow();h.tick();}const view=M.current(h.ctx()),home=copy(h.sim.returnPos),record=copy(h.sim.state.localLife.records[D.ID]);assert.ok(view.distanceTraveled>0);assert.ok(W.leave(h.sim).ok);assert.equal(M.isProjection(view),false);assert.equal(M.current(h.ctx()),null);assert.deepEqual(h.sim.state.player,home);assert.equal(h.sim.room,null);assert.deepEqual(h.sim.state.localLife.records[D.ID],record);assert.ok(h.save(h.sim.snapshot()).ok);h.enter();const resumed=M.current(h.ctx());assert.equal(resumed.checkpointIndex,1);assert.equal(resumed.x,-68);assert.equal(resumed.z,-99);assert.equal(resumed.status,'waiting');assert.equal(resumed.distanceTraveled,0);assert.deepEqual(h.sim.returnPos,home);
});
test('actual character switch saves only prefix and expires outgoing transient projection',()=>{
 const h=harness('south-stormfall');h.arrive();assert.ok(M.continue(h.ctx()).ok);h.follow();h.tick();const oldView=M.current(h.ctx()),outgoing=h.store.active,oldRecord=copy(h.sim.state.localLife.records[D.ID]);M.reset(h.sim,'actual-character-switch');const switched=h.store.command('switch',{id:'character-1'},h.sim.snapshot(),h.store.revision);assert.ok(switched.ok,switched.error);assert.equal(M.isProjection(oldView),false);assert.equal(M.current(h.ctx()),null,'old Sim cannot impersonate new active slot');const newSim=new C.Simulation(switched.state);assert.deepEqual(newSim.state.localLife.records[D.ID],D.freshRecord(),'other slot retains its unaccepted commission');assert.deepEqual(h.store.record.slots.find(s=>s.id===outgoing).world.localLife.records[D.ID],oldRecord);assert.deepEqual(h.store.record.slots.find(s=>s.id===outgoing).world.player,h.sim.returnPos);
});
test('real later-patrol hostile roster blocks northern motion without killing or granting',()=>{
 const h=harness('north-stormfall');h.walk(-67,-4);const priorClaim=h.sim.state.earthExpedition.patrol.lastClaim,run=priorClaim+1,accepted=E.command(h.ctx(),'patrol-accept',{quest:E.patrol.id,run,priorClaim},{save:h.save});assert.ok(accepted.ok,accepted.error);
 const water=E.patrol.steps[0];h.walk(water.x,water.z);const inspected=E.command(h.ctx(),'patrol-step',{quest:E.patrol.id,run,priorClaim,step:water.id},{save:h.save});assert.ok(inspected.ok,inspected.error);assert.ok(h.sim.adventureRuntime.enemies.some(e=>e.expeditionQuest===E.patrol.id&&e.hp>0),'actual patrol prerequisite spawns the living threat');h.walk(-67,-4);h.walk(-54,-65);h.walk(-68,-99);h.walk(-106,-105);
 const before=copy(h.sim.state.earthExpedition),balances=independentHistories(h.sim.state).balances;let blocked;
 for(let i=0;i<8;i++){const v=h.leg();if(v.status==='blocked'){blocked=v;break;}assert.ok(v.ready);const ticket=M.arrivalTicket(h.ctx()).ticket,step=D.required('north-stormfall')[h.sim.state.localLife.records[D.ID].steps.length];assert.ok(h.command('step',{step,motionTicket:ticket}).ok);}
 assert.ok(blocked,'actual accepted patrol, not a static spawn proxy, blocks this course');assert.equal(blocked.reason,'threat');assert.match(blocked.detail,/Living hostile:/);assert.equal(M.arrivalTicket(h.ctx()).ok,false);assert.deepEqual(h.sim.state.earthExpedition,before);assert.deepEqual(independentHistories(h.sim.state).balances,balances);assert.ok(h.sim.adventureRuntime.enemies.some(e=>e.expeditionQuest===E.patrol.id&&e.hp>0));
});
test('real final payment capacity refusal preserves physically earned arrivals and retries once',()=>{
 const h=harness('south-coppice');for(const step of D.required('south-coppice'))h.arrive();h.walk(D.definition.returner.x,D.definition.returner.z);
 // Explicit capacity-boundary fixture edit after physical earning, not a grant
 // made by motion or fabricated delivery. The command still uses real Store.
 h.sim.state.adventure.coins=9999;h.sim.state.sandbox.inventory.wood=S.MAX;assert.ok(h.save(h.sim.snapshot()).ok);const before=JSON.stringify(h.sim.state),bytes=h.storage.getItem(CH.KEY);assert.equal(h.command('claim').ok,false);assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.storage.getItem(CH.KEY),bytes);assert.ok(M.current(h.ctx()).arrived);
 h.sim.state.adventure.coins=9995;h.sim.state.sandbox.inventory.wood=S.MAX-2;h.sim.state.sandbox.inventory.fiber=Math.min(h.sim.state.sandbox.inventory.fiber,S.MAX-2);const balances=independentHistories(h.sim.state).balances;assert.ok(h.command('claim').ok);assert.equal(h.sim.state.adventure.coins,9999);assert.equal(h.sim.state.adventure.xp,balances.xp);assert.equal(h.sim.state.adventure.ore,balances.ore);assert.equal(h.sim.state.sandbox.inventory.wood,S.MAX);const paid=JSON.stringify(h.sim.state);assert.ok(h.command('claim').ok);assert.equal(JSON.stringify(h.sim.state),paid);assert.equal(M.current(h.ctx()),null);
});
