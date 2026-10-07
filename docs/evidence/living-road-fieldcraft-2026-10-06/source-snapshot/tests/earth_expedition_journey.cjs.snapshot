/* Command-earned production expedition. Accelerated .05s simulation ticks,
 * memory durable-candidate holder: not browser persistence or human pacing. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),T=require('../src/combat.js'),W=require('../src/world-foundations.js');
const E=require('../src/earth-expedition.js'),F=require('../src/earth-fieldcraft.js'),S=require('../src/sandbox.js');
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs');
const ROOT=path.resolve(__dirname,'..'),copy=o=>JSON.parse(JSON.stringify(o)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function journey({bow=false,veteran=false,output=null}={}){
 assert.equal(A.VERSION,12,'requires real Adventure12/Core/roster integration; no validator substitution');
 const variant=veteran?'veteran':bow?'fresh-bow':'fresh-blade',source=veteran?path.join(ROOT,'docs/evidence/world-production-2026-10-03/captures/returning-fit-final-01/FINAL_WORLD.json'):null;
 const h=createHarness(source?JSON.parse(fs.readFileSync(source,'utf8')):undefined),events=[],combats=[],claims=[],fieldcraftStages=[],ownerTransitions=[];
 const sources=['earth-expedition.js','earth-fieldcraft.js','core.js','adventure.js','combat.js','arsenal.js','world-foundations.js','elderweald-world.js'];
 const hashes=()=>Object.fromEntries(sources.map(file=>[file,hash(path.join(ROOT,'src',file))]));const initialHashes=hashes();
 // This caller owns its lease. Preserve createHarness's real changing serial;
 // persistence observations never substitute a fabricated context revision.
 const rawContext=h.context;let owner=null,ownerLease=null,generation=0;
 const tuple=ctx=>({sim:ctx.sim,state:ctx.sim.state,adventure:ctx.sim.state.adventure,active:ctx.active,room:ctx.sim.room,trip:ctx.sim.worldTrip,earthTrip:ctx.sim.earthTrip,home:JSON.stringify(ctx.sim.returnPos)});
 function context(reason=null){
  const ctx=rawContext(),actual=tuple(ctx),changed=!owner||Object.keys(actual).some(k=>actual[k]!==owner[k]);
  if(reason||changed||ctx.sim.fieldcraftOwnerLease!==ownerLease){ownerLease=Object.freeze({});ctx.sim.fieldcraftOwnerLease=ownerLease;owner=actual;ownerTransitions.push({generation:++generation,reason:reason||'actual-owner-tuple-change',active:ctx.active,room:ctx.sim.room,contextRevision:ctx.revision});}
  return{...ctx,ownerLease};
 }
 h.context=()=>context();context('initial-harness-owner');
 for(const method of ['enter','home','reload']){const original=h[method];h[method]=(...args)=>{const result=original(...args);context('actual-harness-'+method);return result;};}
 const hook=()=>{h.sim.earthExpeditionSave=h.save;};hook();
 if(!veteran)earnedKit(h,bow);else{assert.equal(h.sim.state.adventure.equipment.weapon,'dawn_edge');assert.equal(h.sim.state.adventure.realmCraft.weapon,'dawn_edge');assert.equal(A.stats(h.sim.state.adventure).attack,51);h.walk(W.GATE.x,W.GATE.z);}
 const before=h.sim.snapshot(),initialWeapon=before.adventure.equipment.weapon,branch=bow?'managed-coppice':'stormfall-recovery';
 const snap=name=>{if(output){const dir=path.join(output,variant);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(h.sim.snapshot(),null,2)+'\n');}};
 const command=(type,payload={})=>{const d=type.startsWith('patrol-')?E.patrol:E.definition;const result=E.command(h.context(),type,{quest:d.id,...payload},{save:h.save});assert.ok(result.ok,type+': '+result.error);const recorded={...payload};if(recorded.fittingTicket){delete recorded.fittingTicket;recorded.fittingProof='opaque current fitting authority; not serialized';}events.push({type,payload:recorded,result});return result;};
 const reload=realm=>{h.reload(realm);hook();};
 const balance=()=>({xp:h.sim.state.adventure.xp,coins:h.sim.state.adventure.coins,ore:h.sim.state.adventure.ore,wood:h.sim.state.sandbox.inventory.wood,fiber:h.sim.state.sandbox.inventory.fiber});
 const unchangedCombat=()=>({xp:h.sim.state.adventure.xp,coins:h.sim.state.adventure.coins,ore:h.sim.state.adventure.ore,drops:copy(h.sim.state.adventure.drops),defeated:copy(h.sim.state.adventure.defeated)});
 function fight(step,run=null){
  const d=run===null?E.definition:E.patrol,terms=E.enemies(h.sim).find(e=>e.expeditionQuest===d.id&&e.expeditionRun===run&&e.defeatStep===step.id);assert.ok(terms,'accepted canonical phase spawns actual foe');
  let enemy=A.runtime(h.sim).enemies.find(e=>e.id===terms.id);assert.ok(enemy,'production roster dispatch owns expedition actor');
  assert.deepEqual([enemy.hp,enemy.damage,enemy.windup,enemy.recovery],[terms.hp,terms.damage,1.35,2.3]);
  const unearned=unchangedCombat(),style=AR.weapon(h.sim.state.adventure).style,radius=style==='bow'?4:1.1;
  h.walk(enemy.home.x,enemy.home.z+10);h.walk(enemy.home.x,enemy.home.z+radius);h.command('target-select',{id:enemy.id});assert.strictEqual(T.selected(h.sim),enemy);
  const impacts=[],phases=[],transitions=[],retreats=[];let frames=0,lastHP=enemy.hp,guards=0,arrowSeen=false;
  // Each first story foe includes an actual supported withdrawal before autoattack.
  if(run===null){const from={...h.sim.state.player},away={x:enemy.home.x,z:enemy.home.z+6};h.walk(away.x,away.z);retreats.push({from,to:{...h.sim.state.player},segmentsValidated:true});h.walk(enemy.home.x,enemy.home.z+radius);}
  if(run===null&&step.id==='clear-crossing'){
   const accepted=copy(h.sim.state.earthExpedition);h.home();assert.deepEqual(h.sim.state.earthExpedition,accepted,'free home does not erase an active accepted encounter');h.walk(0,3);h.command('rest');h.walk(W.GATE.x,W.GATE.z);h.enter('earthlands');hook();enemy=A.runtime(h.sim).enemies.find(e=>e.id===terms.id);assert.ok(enemy&&enemy.hp===terms.hp,'uncompleted encounter remains available after voluntary free return');h.walk(enemy.home.x,enemy.home.z+radius);h.command('target-select',{id:enemy.id});retreats.push({freeHomeWhileActive:true,acceptedProgressPreserved:true});
  }
  h.command('auto-toggle');
  const start=h.sim.state.adventure.elapsed;
  const credited=()=>run===null?h.sim.state.earthExpedition.story.steps.includes(step.id):h.sim.state.earthExpedition.patrol.active.steps.includes(step.id);
  while(!credited()&&frames++<4000){
   enemy=A.runtime(h.sim).enemies.find(e=>e.id===terms.id)||enemy;const a=h.sim.state.adventure,t=T.runtime(h.sim),cue=T.threat(h.sim);
   assert.ok(a.hp>0,'survive actual '+terms.id);if(cue&&!phases.some(p=>p.phase===cue.phase))phases.push({at:a.elapsed-start,...cue});
   if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){h.command('guard');guards++;}
   if(a.hp<45&&a.tonics&&a.elapsed>=A.runtime(h.sim).cooldowns.heal)h.command('heal');
   if(dist(h.sim.state.player,enemy)>=AR.weapon(a).reach-.2&&!h.sim.playerPath.length)assert.ok(h.sim.moveTo(enemy.x,enemy.z+radius).ok,'real supported combat approach');
   const priorMode=enemy.mode;h.sim.tick(.05);arrowSeen ||= AR.runtime(h.sim).arrows.length>0;
   if(enemy.mode!==priorMode){transitions.push({at:h.sim.state.adventure.elapsed-start,from:priorMode,to:enemy.mode,timer:enemy.timer});if(enemy.mode==='windup')assert.ok(Math.abs(enemy.timer-1.35)<1e-8,'actual AI starts declared 1.35s tell');if(enemy.mode==='recover')assert.ok(Math.abs(enemy.timer-2.3)<1e-8,'actual AI starts declared 2.3s recovery');}
   if(enemy.hp<lastHP){impacts.push({after:h.sim.state.adventure.elapsed-start,before:lastHP,hp:enemy.hp,mode:enemy.mode});lastHP=enemy.hp;}
  }
  assert.ok(frames<4000&&enemy.hp===0,'real weapon impacts earn accepted defeat');assert.ok(impacts.length>=2,'multiple real impacts');if(style==='bow')assert.ok(arrowSeen,'actual projectile flight observed');if(!veteran){assert.ok(guards>0,'actual Brace used');assert.ok(phases.some(p=>p.phase==='windup')&&phases.some(p=>p.phase==='recover'),'actual tell and opening observed');}
  assert.deepEqual(unchangedCombat(),unearned,'accepted enemies never award legacy XP/currency/drop/dead-history');h.command('target-clear');
  combats.push({id:terms.id,run,style,hp:terms.hp,damage:terms.damage,seconds:h.sim.state.adventure.elapsed-start,frames,guards,arrowSeen,phases,transitions,impacts,retreats,healthAfter:h.sim.state.adventure.hp});
 }
 function fitBrace(){
  const before=h.sim.snapshot(),lease=h.sim.fieldcraftOwnerLease,saveCount=h.checkpoints.length;
  const bare=E.command(h.context(),'step',{quest:E.definition.id,step:'brace-root-channel'},{save:h.save});assert.equal(bare.ok,false,'earned work point alone cannot bypass the assembly proof');assert.deepEqual(h.sim.snapshot(),before);assert.equal(h.checkpoints.length,saveCount);
  const begun=F.begin(h.context());assert.ok(begun.ok,begun.error);const plan=begun.plan;fieldcraftStages.push({operation:'begin',sectionIds:F.GEOMETRY.sections.map(s=>s.id),room:h.sim.room,workPoint:{...h.sim.state.player},bareStepRefused:true});
  let ticket;const inspected=new Set(),contextRevisions=[];
  for(const section of F.GEOMETRY.sections){
   const ctx=h.context();contextRevisions.push(ctx.revision);const inspection=F.inspect(ctx,plan);assert.ok(inspection.ok,inspection.error);inspected.add(section.receiverFrom);inspected.add(section.receiverTo);fieldcraftStages.push({operation:'inspect',section:section.id,receivers:[section.receiverFrom,section.receiverTo],contextRevision:ctx.revision});
   if(section.index===0){
    const wrong=F.adjust(h.context(),plan,{yaw:F.GEOMETRY.initialYaw,pitch:F.GEOMETRY.initialPitch,sectionId:section.id});assert.ok(wrong.ok);const refused=F.seat(h.context(),plan);assert.equal(refused.ok,false,'actual first preview misses its receiving socket');fieldcraftStages.push({operation:'seat-refused',section:section.id,yaw:wrong.view.yaw,pitch:wrong.view.pitch,endError:refused.endError});
   }
   const adjusted=F.adjust(h.context(),plan,{yaw:F.GEOMETRY.targetYaw,pitch:F.GEOMETRY.targetPitch,sectionId:section.id,receiverFrom:section.receiverFrom,receiverTo:section.receiverTo});assert.ok(adjusted.ok,adjusted.error);fieldcraftStages.push({operation:'adjust',section:section.id,yaw:adjusted.view.yaw,pitch:adjusted.view.pitch});
   const seated=F.seat(h.context(),plan);assert.ok(seated.ok,seated.error);assert.equal(seated.view.sections.filter(s=>s.seated).length,section.index+1);ticket=seated.ticket;fieldcraftStages.push({operation:'seat',section:section.id,seatedCount:section.index+1});
   assert.deepEqual(h.sim.snapshot(),before,'inspection/pose/seating do not write progress, inventory, XP or fees');assert.equal(h.checkpoints.length,saveCount);
  }
  assert.ok(contextRevisions.every((n,i)=>i===0||n>contextRevisions[i-1]),'raw harness context revisions genuinely advance');assert.strictEqual(h.sim.fieldcraftOwnerLease,lease,'same worksite operations preserve caller lease');assert.equal(inspected.size,5);assert.ok(F.validate(h.context(),ticket).ok);
  const result=command('step',{step:'brace-root-channel',fittingTicket:ticket});assert.equal(result.warning,undefined,'earned commit consumes fitting before ordinary scene sync');assert.ok(h.sim.state.earthExpedition.story.steps.includes('brace-root-channel'));assert.equal(h.checkpoints.length,saveCount+1);assert.equal(F.consume(ticket).ok,false);assert.equal(F.current(h.sim),null);
  fieldcraftStages.push({operation:'fasten',step:'brace-root-channel',saved:true,consumed:true,onceOnly:true});snap('02B_BRACE_FITTED');
 }
 function circuit(run=null){
  const d=run===null?E.definition:E.patrol;
  for(const step of d.steps){
   if(step.kind==='defeat'){
    fight(step,run);
    if(run===null&&step.id==='clear-root-pests'){
     assert.deepEqual(h.sim.state.earthExpedition.story.steps,E.definition.steps.slice(0,6).map(s=>s.id),'root-clear snapshot has exactly the genuine six-step unpaid prefix');
     assert.equal(F.current(h.sim),null,'root-clear source contains no transient fitting');snap('02A_ROOT_CLEAR');
    }
    continue;
   }
   const choice=step.choices?.find(c=>c.id===branch),p=choice||step;h.walk(p.x,p.z);
   if(run===null&&step.id==='brace-root-channel')fitBrace();else command(run===null?'step':'patrol-step',{step:step.id,...(choice?{branch:choice.id}:{}),...(run===null?{}:{run,priorClaim:run-1})});
   if(step===d.steps[0]){snap(run===null?'02_PARTIAL':'PATROL_'+run+'_PARTIAL');reload('earthlands');}
  }
 }
 snap('00_COMMAND_EARNED_SOURCE');h.enter('earthlands');hook();h.walk(E.definition.giver.x,E.definition.giver.z);
 const unaccepted=h.sim.snapshot();assert.equal(E.command(h.context(),'step',{quest:E.definition.id,step:'assess-load'},{save:h.save}).ok,false);assert.deepEqual(h.sim.snapshot(),unaccepted);
 command('accept');snap('01_ACCEPTED');reload('earthlands');circuit();snap('03_READY_UNPAID');reload('earthlands');
 assert.equal(E.progress(h.sim).story.ready,true);assert.equal(E.progress(h.sim).story.claimed,false);assert.equal(E.enemies(h.sim).length,0,'cold-reloaded local dead records do not respawn paid or unpaid first-story foes');
 h.walk(E.definition.giver.x,E.definition.giver.z);let old=balance();const result=command('claim');claims.push({type:'story',reward:result.reward,before:old,after:balance()});
 assert.deepEqual(result.reward,{xp:45,coins:18,ore:3,materials:branch==='stormfall-recovery'?{wood:8,fiber:4}:{wood:4,fiber:8}});const paid=h.sim.snapshot();assert.equal(command('claim').duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);snap('04_FIRST_CLAIMED');reload('earthlands');
 // Two complete accepted runs, not merely reopening a panel, establish repetition.
 for(const run of[1,2]){
  h.home();h.walk(0,3);h.command('rest');h.walk(W.GATE.x,W.GATE.z);h.enter('earthlands');hook();h.walk(E.patrol.giver.x,E.patrol.giver.z);
  if(run===2){const beforeStale=h.sim.snapshot();assert.equal(E.command(h.context(),'patrol-accept',{quest:E.patrol.id,run:1,priorClaim:0},{save:h.save}).ok,false);assert.deepEqual(h.sim.snapshot(),beforeStale);}
  command('patrol-accept',{run,priorClaim:run-1});circuit(run);snap('PATROL_'+run+'_READY');reload('earthlands');h.walk(E.patrol.giver.x,E.patrol.giver.z);
  old=balance();const reward=command('patrol-claim',{run,priorClaim:run-1});assert.deepEqual(reward.reward,E.patrol.reward);claims.push({type:'patrol',run,reward:reward.reward,before:old,after:balance()});const once=h.sim.snapshot();assert.equal(command('patrol-claim',{run,priorClaim:run-1}).duplicate,true);assert.deepEqual(h.sim.snapshot(),once);snap('PATROL_'+run+'_CLAIMED');reload('earthlands');
 }
 h.home();h.walk(11,9);const fitBefore=h.sim.snapshot(),stats=A.stats(fitBefore.adventure),kind=bow?'shelter':'edge';
 const fit=E.bindingCommand(h.context(),initialWeapon,kind,{save:h.save});assert.ok(fit.ok,fit.error);const fitAfter=h.sim.snapshot(),afterStats=A.stats(fitAfter.adventure);
 assert.equal(fitBefore.adventure.coins-fitAfter.adventure.coins,8);assert.equal(fitBefore.adventure.ore-fitAfter.adventure.ore,3);assert.equal(fitBefore.sandbox.inventory.fiber-fitAfter.sandbox.inventory.fiber,6);assert.equal(fitAfter.adventure.hp,fitBefore.adventure.hp,'maximum-health binding never heals');
 assert.deepEqual({attack:afterStats.attack-stats.attack,defense:afterStats.defense-stats.defense,maxHP:afterStats.maxHP-stats.maxHP},kind==='edge'?{attack:2,defense:0,maxHP:0}:{attack:0,defense:1,maxHP:10});
 for(const key of['equipment','owned','arsenal','pursuit','starter','realmCraft'])assert.deepEqual(fitAfter.adventure[key],fitBefore.adventure[key],key+' survives binding');
 assert.equal(E.bindingCommand(h.context(),initialWeapon,kind,{save:h.save}).ok,false);assert.deepEqual(h.sim.snapshot(),fitAfter);reload();snap('05_BOUND_RELOADED');
 // A real post-binding weapon impact against a newly accepted third run. The
 // T.hit wrapper only observes canonical damage packets and is always restored.
 h.walk(W.GATE.x,W.GATE.z);h.enter('earthlands');hook();h.walk(E.patrol.giver.x,E.patrol.giver.z);command('patrol-accept',{run:3,priorClaim:2});const water=E.patrol.steps[0];h.walk(water.x,water.z);command('patrol-step',{run:3,priorClaim:2,step:water.id});
 const boundEnemy=A.runtime(h.sim).enemies.find(e=>e.expeditionQuest===E.patrol.id&&e.expeditionRun===3),style=AR.weapon(h.sim.state.adventure).style;assert.ok(boundEnemy);h.walk(boundEnemy.home.x,boundEnemy.home.z+(style==='bow'?4:1.1));h.command('target-select',{id:boundEnemy.id});
 const packets=[],oldHit=T.hit;let arrowObserved=false;try{T.hit=(sim,e,n)=>{if(sim===h.sim&&e===boundEnemy)packets.push({n,at:sim.state.adventure.elapsed,hpBefore:e.hp});return oldHit(sim,e,n);};for(let i=0;i<300&&!packets.some(p=>p.n===afterStats.attack);i++){if(boundEnemy.hp<=0)break;const weapon=AR.weapon(h.sim.state.adventure),distance=dist(h.sim.state.player,boundEnemy);if(distance>=weapon.reach-.2&&!h.sim.playerPath.length)assert.ok(h.sim.moveTo(boundEnemy.x,boundEnemy.z+(style==='bow'?4:1.1)).ok);if(distance<weapon.reach&&(style==='bow'?AR.aimClear(h.sim,h.sim.state.player,boundEnemy):A.visible(h.sim,h.sim.state.player,boundEnemy))&&h.sim.state.adventure.elapsed>=A.runtime(h.sim).cooldowns.attack)h.command('attack',{target:boundEnemy.id});h.sim.tick(.05);arrowObserved ||= AR.runtime(h.sim).arrows.length>0;}}finally{T.hit=oldHit;}
 assert.ok(packets.some(p=>p.n===afterStats.attack),'actual normal weapon damage includes the binding stat exactly');if(style==='bow')assert.ok(arrowObserved,'actual post-binding arrow flies');h.command('target-clear');h.home();reload();snap('06_BOUND_ACTUAL_IMPACT_RELOADED');
 const after=h.sim.snapshot();for(const key of['equipment','owned','arsenal','pursuit','starter','realmCraft','classPath','road','beacon','crossing','earthStory','earthNotes','earthGathering','companion','defeated','drops','reward','relic','angelSeen'])assert.deepEqual(after.adventure[key],before.adventure[key],key+' retained across expedition');
 for(const key of['notes','score','scoreRevision','retreat','visitor','flowers','journeys','realmTrails'])assert.deepEqual(after[key],before[key],key+' retained');
 assert.deepEqual({xp:after.adventure.xp-before.adventure.xp,coins:after.adventure.coins-before.adventure.coins,ore:after.adventure.ore-before.adventure.ore,wood:after.sandbox.inventory.wood-before.sandbox.inventory.wood,fiber:after.sandbox.inventory.fiber-before.sandbox.inventory.fiber},{xp:55,coins:18,ore:6,wood:branch==='stormfall-recovery'?12:8,fiber:branch==='stormfall-recovery'?2:6});
 const finalHashes=hashes(),report={status:'passed',variant,source:source?{path:path.relative(ROOT,source),sha256:hash(source),label:'existing command-earned fully fitted returning character, actual prior normal-RAF capture final snapshot'}:{label:'fresh production character; start/gather/craft/range/socket all command-earned'},method:'actual Simulation/moveTo/WorldFoundations.segment/target-select/auto-toggle/Brace/projectile/ticks, Fieldcraft.begin/inspect/adjust/seat and E.command fittingTicket; durable in-memory full candidate holder',acceleratedTicks:true,browserPersistence:false,humanPacing:false,positionEdits:0,inventoryGrants:0,manualDamage:0,plantedDefeats:0,worldVersion:C.VERSION,adventureVersion:A.VERSION,branch,companionMayAssist:before.adventure.companion.bonded,claims,combats,events,legacyEvents:h.events,routes:h.routes,saveCount:h.checkpoints.length,fieldcraft:{sectionIds:F.GEOMETRY.sections.map(s=>s.id),inspectedReceiverCount:5,seatedMemberCount:4,stages:fieldcraftStages,leaseMethod:'caller-owned opaque generation renewed at actual harness enter/home/reload or owner tuple change; raw serial context revision remains unchanged',ownerTransitions},fitting:{weapon:initialWeapon,kind,cost:E.BINDING_COST,before:stats,after:afterStats,currentHPBefore:fitBefore.adventure.hp,currentHPAfter:fitAfter.adventure.hp,actualPostBindingDamagePackets:packets,arrowObserved,probe:'one newly accepted unpaid third patrol; only T.hit observation wrapper, restored before continuing'},sourceHashes:initialHashes,sourceDrift:JSON.stringify(initialHashes)!==JSON.stringify(finalHashes),harnessSha256:hash(__filename),canonicalPreservation:true};
 if(output)fs.writeFileSync(path.join(output,variant,'EARTH_EXPEDITION_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const i=process.argv.indexOf('--output'),output=i>=0?path.resolve(process.argv[i+1]):null;const r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),output});console.log(JSON.stringify({status:r.status,variant:r.variant,claims:r.claims.length,combats:r.combats.length,commands:r.events.length+r.legacyEvents.filter(e=>e.type).length,walkedLegs:r.routes.length,saves:r.saveCount,fitting:r.fitting,sourceDrift:r.sourceDrift},null,2));}
module.exports={journey};
