/* Command-earned north stories through production movement/combat and an
 * explicit in-memory durable candidate holder. Accelerated ticks are not
 * normal-RAF footage, browser persistence, human pacing or enjoyment. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const sources=['core.js','adventure.js','combat.js','arsenal.js','realm-trails.js','realm-trails-north.js','realm-trails-south.js','realm-trails-cosmos.js','realm-craft.js','world-foundations.js'];
const hashes=()=>Object.fromEntries(sources.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'src',file))).digest('hex')]));
const loadedHashes=hashes();
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),T=require('../src/combat.js');
const W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js'),RC=require('../src/realm-craft.js'),S=require('../src/sandbox.js');
const copy=o=>JSON.parse(JSON.stringify(o)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
let harnessSerial=0;
function createHarness(raw){
 let sim=new C.Simulation(raw),saved=null,serial=0;
 const namespace='earned-north-'+(++harnessSerial)+'-'+sim.state.adventure.revision;
 const events=[],routes=[],combats=[],claims=[],checkpoints=[];
 const save=candidate=>{saved=C.validate(candidate);checkpoints.push({revision:saved.adventure.revision,elapsed:saved.adventure.elapsed,records:copy(saved.realmTrails.records)});return{ok:true};};
 const hook=()=>{sim.realmTrailSave=save;};hook();
 const context=()=>({sim,active:'command-earned-north',revision:++serial});
 function tick(seconds=.05){for(let i=0;i<Math.ceil(seconds/.05);i++)sim.tick(.05);}
 function command(type,payload={}){
  const id=namespace+'-'+(++serial),result=sim.adventureCommand(id,type,payload);
  assert.ok(result.ok,type+': '+result.error);events.push({owner:'adventure',id,type,payload,result});return result;
 }
 function walk(x,z){
  const start={...sim.state.player},result=sim.moveTo(x,z);assert.ok(result.ok,'walk '+x+','+z+': '+result.error);
  let frames=0;
  while(sim.playerPath.length&&frames++<18000){const old={...sim.state.player};sim.tick(.05);if(W.handles(sim.room))assert.ok(W.segment(sim.room,old,sim.state.player),'incremental player movement fits physical ground/solids');assert.ok(sim.state.adventure.hp>0,'traveler remains alive during walk');}
  assert.ok(frames<18000&&distance(sim.state.player,{x,z})<.25,'arrive '+x+','+z);
  routes.push({room:sim.room||'valley',start,x,z,frames});
 }
 function enter(realm){
  const ctx=context(),preview=W.preview(ctx,realm);assert.ok(preview.ok,preview.error);
  const result=W.enter(preview.ticket,ctx,{save,build:()=>{}});assert.ok(result.ok,result.error);events.push({owner:'travel',enter:realm});
 }
 function trail(type,d,payload={}){
  const result=R.command(context(),type,{quest:d.id,...payload},{save});assert.ok(result.ok,type+': '+result.error);
  events.push({owner:'trail',type,quest:d.id,payload,result});return result;
 }
 function reload(realm){
  const snapshot=sim.snapshot();save(snapshot);sim=new C.Simulation(saved);hook();
  assert.deepEqual(sim.snapshot(),snapshot,'cold simulation resumes canonical saved history');assert.equal(sim.room,null);
  events.push({owner:'reload',realm});if(realm)enter(realm);
 }
 function home(){
  const expected={...sim.returnPos};assert.ok(W.leave(sim).ok);assert.equal(sim.room,null);assert.deepEqual(sim.state.player,expected);
  assert.equal(T.runtime(sim).target,null);assert.equal(T.runtime(sim).auto,false);events.push({owner:'travel',freeHome:true});save(sim.snapshot());
 }
 function fight(d){
  let enemy=A.runtime(sim).enemies.find(e=>e.id===d.enemy.id);assert.ok(enemy,'canonical accepted story enemy spawned');
  const initial=copy({xp:sim.state.adventure.xp,coins:sim.state.adventure.coins,ore:sim.state.adventure.ore,drops:sim.state.adventure.drops,defeated:sim.state.adventure.defeated});
  const style=AR.weapon(sim.state.adventure).style,home={...enemy.home},radius=style==='bow'?4:1.1;
  walk(home.x,home.z+12);walk(home.x,home.z+radius);command('target-select',{id:enemy.id});
  assert.strictEqual(T.selected(sim),enemy,'production target selection owns actual runtime entity');
  const start=sim.state.adventure.elapsed,phases=[],impacts=[],closedShots=[];
  let frames=0,lastHP=enemy.hp,guarded=0,arrowSeen=false;
  command('auto-toggle');
  while(!sim.state.realmTrails.records[d.id].steps.includes(d.enemy.defeatStep)&&frames++<2400){
   enemy=A.runtime(sim).enemies.find(e=>e.id===d.enemy.id)||enemy;
   const a=sim.state.adventure,run=A.runtime(sim),t=T.runtime(sim),cue=T.threat(sim);
   assert.ok(a.hp>0,'survive actual '+d.enemy.id);
   if(cue&&!phases.some(p=>p.phase===cue.phase))phases.push({at:a.elapsed-start,...cue,hp:enemy.hp});
   if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){command('guard');guarded++;}
   if(a.hp<45&&a.tonics&&a.elapsed>=run.cooldowns.heal)command('heal');
   if(distance(sim.state.player,enemy)>=AR.weapon(a).reach-.2&&!sim.playerPath.length){
    const point={x:enemy.x,z:enemy.z+radius};assert.ok(sim.moveTo(point.x,point.z).ok,'real combat approach');
   }
   const mode=enemy.mode,hp=enemy.hp,hitCount=T.runtime(sim).hits.length;
   sim.tick(.05);arrowSeen ||= AR.runtime(sim).arrows.length>0;
   if(d.realm==='heaven'&&mode!=='recover'&&enemy.mode!=='recover'&&enemy.hp===hp&&T.runtime(sim).hits.length===hitCount)closedShots.push({mode,at:sim.state.adventure.elapsed-start});
   if(enemy.hp<lastHP){impacts.push({after:sim.state.adventure.elapsed-start,mode:enemy.mode,before:lastHP,hp:enemy.hp});if(d.realm==='heaven')assert.equal(enemy.mode,'recover','confirmed core damage occurs during actual recovery');lastHP=enemy.hp;}
  }
  assert.ok(frames<2400&&enemy.hp===0,'actual weapon impacts earn story defeat');
  assert.ok(impacts.length>=2&&guarded>0,'several weapon impacts and actual Brace commands');
  assert.ok(phases.some(p=>p.phase==='windup')&&phases.some(p=>p.phase==='recover'),'real warning and recovery phases observed');
  if(style==='bow')assert.ok(arrowSeen,'real in-flight projectiles precede impact');
  if(d.realm==='heaven')assert.ok(closedShots.length>0,'closed core phases observed with no confirmed hit');
  assert.deepEqual({xp:sim.state.adventure.xp,coins:sim.state.adventure.coins,ore:sim.state.adventure.ore,drops:sim.state.adventure.drops,defeated:sim.state.adventure.defeated},initial,'story defeat pays no legacy XP, currency or loot');
  assert.equal(R.defeat(sim,enemy),true,'repeat death notification recognizes the existing recorded defeat');
  assert.deepEqual({xp:sim.state.adventure.xp,coins:sim.state.adventure.coins,ore:sim.state.adventure.ore,drops:sim.state.adventure.drops,defeated:sim.state.adventure.defeated},initial);
  command('target-clear');combats.push({quest:d.id,style,frames,seconds:sim.state.adventure.elapsed-start,guarded,arrowSeen,phases,impacts,closedObservations:closedShots.length,healthAfter:sim.state.adventure.hp});
 }
 function escortWalk(d){
  const record=()=>sim.state.realmTrails.records[d.id];
  assert.ok(record().steps.includes(d.escort.startStep));
  // Demonstrate the ordinary wait/follow choices near the actual ally.
  trail('escort-wait',d);const stopped=copy(R.escort(sim));tick(.4);assert.equal(distance(stopped,R.escort(sim)),0);
  trail('escort-follow',d);
  let frames=0,pauses=0;
  while(!record().steps.includes(d.escort.arrivalStep)&&frames++<5000){
   const actor=R.escort(sim),next=d.escort.route[record().checkpoint+1];assert.ok(actor&&next);
   if(distance(sim.state.player,actor)>6){
    assert.ok(sim.moveTo(sim.state.player.x,sim.state.player.z).ok,'ordinary stop-and-wait movement');pauses++;
    for(let j=0;j<300&&distance(sim.state.player,R.escort(sim))>3;j++){sim.tick(.05);frames++;assert.ok(sim.state.adventure.hp>0);}
   }
   if(!sim.playerPath.length&&distance(sim.state.player,next)>.2)assert.ok(sim.moveTo(next.x,next.z).ok,'actual escorted macro-leg path');
   const before={...sim.state.player},ally={...R.escort(sim)};sim.tick(.05);
   assert.ok(W.segment(sim.room,before,sim.state.player),'player fits escort route');
   const after=R.escort(sim);assert.ok(W.walkable(sim.room,after.x,after.z),'actual ally remains on supported clear ground');
   if(record().checkpoint===ally.checkpoint)assert.ok(W.segment(sim.room,ally,after),'actual ally incremental movement fits physical route');
  }
  assert.ok(frames<5000,'actual ally reaches Refuge within a bounded simulation');
  const actor=R.escort(sim);assert.ok(distance(actor,d.escort.route.at(-1))<.3,'actual ally is at safe Refuge endpoint');
  assert.equal(record().checkpoint,d.escort.route.length-1);assert.equal(record().assisted,false,'walked arrival is distinct from extraction');
  events.push({owner:'escort',walked:true,frames,pauses,actor:copy(actor)});
 }
 return {get sim(){return sim;},get saved(){return saved;},events,routes,combats,claims,checkpoints,save,context,tick,command,walk,enter,trail,reload,home,fight,escortWalk};
}
function earnedKit(h,bow){
 h.walk(11,9);h.command('start');
 if(bow){
  for(const id of['timber-1','timber-2','fibre-1','fibre-2','stone-1','stone-2']){
   const node=S.NODES.find(n=>n.id===id);h.walk(node.x+1.1,node.z);
   while(h.sim.state.sandbox.nodes.find(n=>n.id===id).hp){h.tick(.5);const result=h.sim.sandboxCommand('earned-north-gather-'+h.events.length+'-'+h.sim.state.sandbox.elapsed,'gather',{node:id});assert.ok(result.ok,result.error);h.events.push({owner:'sandbox',type:'gather',node:id});}
  }
  h.walk(11,9);h.command('arsenal-craft',{id:'trail_bow'});h.command('equip',{id:'trail_bow'});
  // A real first range medal earns the socket material; no gem is injected.
  h.command('range-enter');h.walk(0,-3);h.command('range-start');
  for(const target of AR.RANGE.targets){let frames=0;while((AR.runtime(h.sim).range.hits[target.id]||0)<2&&frames++<80){if(h.sim.state.adventure.elapsed>=A.runtime(h.sim).cooldowns.attack)h.command('attack',{target:target.id});h.tick(.2);}assert.ok(frames<80,'real arrows hit '+target.id+' twice');}
  assert.equal(h.sim.state.adventure.arsenal.rangeMedal,true,'actual arrows earn first range medal');
  h.walk(0,9);h.command('range-leave');h.command('socket',{weapon:'trail_bow',gem:'amber'});
  assert.equal(h.sim.state.adventure.arsenal.sockets.trail_bow,'amber','prior socket is command-earned');
 }
 assert.equal(AR.weapon(h.sim.state.adventure).style,bow?'bow':'blade');h.walk(W.GATE.x,W.GATE.z);
}
function journey({bow=false,output=null}={}){
 const variant=bow?'fresh-bow':'fresh-blade',h=createHarness();earnedKit(h,bow);
 const before=h.sim.snapshot(),claims=[];
 const snap=name=>{if(output){fs.mkdirSync(path.join(output,variant),{recursive:true});fs.writeFileSync(path.join(output,variant,name+'.json'),JSON.stringify(h.sim.snapshot(),null,2)+'\n');}};
 snap('00_COMMAND_EARNED_KIT');
 for(const realm of['heaven','hell']){
  const d=R.definitions().find(d=>d.realm===realm);h.enter(realm);h.walk(d.giver.x,d.giver.z);h.trail('accept',d);snap(realm+'_01_ACCEPTED');h.reload(realm);
  for(const id of d.enemy.spawnAfter){
   const step=d.steps.find(s=>s.id===id);h.walk(step.x,step.z);h.trail('step',d,{step:id});
   if(id===d.enemy.spawnAfter[0]){snap(realm+'_02_PARTIAL');h.reload(realm);}
  }
  if(realm==='heaven'){
   const step=d.steps.find(s=>s.id===d.enemy.openingBonusStep);h.walk(step.x,step.z);h.trail('step',d,{step:step.id});
   assert.equal(A.runtime(h.sim).enemies.find(e=>e.id===d.enemy.id).recovery,2.6);
  }
  h.fight(d);snap(realm+'_03_DISABLED');h.reload(realm);
  assert.ok(!A.runtime(h.sim).enemies.some(e=>e.id===d.enemy.id),'recorded story machine stays disabled after cold reload');
  if(d.escort){const start=d.steps.find(s=>s.id===d.escort.startStep);h.walk(start.x,start.z);h.trail('step',d,{step:start.id});h.escortWalk(d);}
  else{const repair=d.steps.find(s=>s.id==='garden-repair');h.walk(repair.x,repair.z);h.trail('step',d,{step:repair.id});}
  snap(realm+'_04_READY_UNPAID');h.reload(realm);h.walk(d.giver.x,d.giver.z);
  const balance=copy({xp:h.sim.state.adventure.xp,coins:h.sim.state.adventure.coins,ore:h.sim.state.adventure.ore});
  h.trail('claim',d);for(const key of['xp','coins','ore'])assert.equal(h.sim.state.adventure[key]-balance[key],d.reward[key],'exact once-only '+key);
  const paid=h.sim.snapshot();assert.equal(h.trail('claim',d).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid,'duplicate claim makes no change');claims.push({quest:d.id,reward:d.reward,before:balance});
  snap(realm+'_05_PAID');h.reload(realm);h.walk(d.giver.x,d.giver.z);assert.equal(h.trail('claim',d).duplicate,true);h.home();h.walk(W.GATE.x,W.GATE.z);
 }
 h.walk(11,9);const old=h.sim.snapshot(),weapon=old.adventure.equipment.weapon,stats=A.stats(old.adventure);
 const fit=RC.command(h.context(),weapon,{save:h.save});assert.ok(fit.ok,fit.error);
 assert.equal(old.adventure.coins-h.sim.state.adventure.coins,8);assert.equal(old.adventure.ore-h.sim.state.adventure.ore,3);
 assert.equal(A.stats(h.sim.state.adventure).attack-stats.attack,3);assert.deepEqual(h.sim.state.adventure.equipment,old.adventure.equipment);
 assert.deepEqual(h.sim.state.adventure.arsenal,old.adventure.arsenal,'earlier command-earned socket and medal survive fitting');
 const fitted=h.sim.snapshot();assert.equal(RC.command(h.context(),weapon,{save:h.save}).ok,false);assert.deepEqual(h.sim.snapshot(),fitted,'one global fitting cannot repeat');
 h.reload();assert.equal(A.stats(h.sim.state.adventure).attack-stats.attack,3);snap('FINAL_FITTED_RELOADED');
 const after=h.sim.snapshot();
 for(const key of['owned','equipment','arsenal','pursuit','starter','classPath','road','beacon','crossing','earthStory','earthNotes','earthGathering','companion','defeated','drops','reward','relic','angelSeen'])assert.deepEqual(after.adventure[key],before.adventure[key],key+' retained');
 for(const key of['notes','score','scoreRevision','retreat','visitor','flowers','journeys'])assert.deepEqual(after[key],before[key],key+' retained');
 assert.equal(after.adventure.xp-before.adventure.xp,65);assert.equal(after.adventure.coins-before.adventure.coins,18);assert.equal(after.adventure.ore-before.adventure.ore,2);
 const finalHashes=hashes();
 const report={status:'passed',variant,method:'production commands/moveTo/ticks/targeting/Brace/autoattack/projectiles; explicit in-memory durable candidate holder',acceleratedTicks:true,browserPersistence:false,humanPacing:false,positionEdits:0,inventoryGrants:0,manualDamage:0,plantedDefeats:0,source:'fresh production character; initial kit and optional bow/range/socket all command-earned',harnessSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),sourceHashes:loadedHashes,sourceDrift:JSON.stringify(finalHashes)!==JSON.stringify(loadedHashes),finalHashes,worldVersion:C.VERSION,adventureVersion:A.VERSION,claims,combats:h.combats,events:h.events,routes:h.routes,saveCount:h.checkpoints.length,fitting:{weapon,attackBefore:stats.attack,attackAfter:A.stats(after.adventure).attack,cost:RC.COST},canonicalPreservation:true};
 if(output)fs.writeFileSync(path.join(output,variant,'REALM_TRAILS_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){
 const index=process.argv.indexOf('--output'),output=index>=0?path.resolve(process.argv[index+1]):null;
 if(output&&process.platform==='win32')assert.match(output,/^D:[\\/]/i,'heavy evidence must stay on D');
 const report=journey({bow:process.argv.includes('--bow'),output});
 console.log(JSON.stringify({status:report.status,variant:report.variant,claims:report.claims.length,combats:report.combats.length,commands:report.events.filter(e=>e.type).length,walkedLegs:report.routes.length,saves:report.saveCount,sourceDrift:report.sourceDrift},null,2));
}
module.exports={journey,createHarness,earnedKit};
