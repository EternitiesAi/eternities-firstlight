/* Installed inherited-character CPU caller; native/ordinary-time qualification is separate. */
'use strict';
/* Command-earned continuation through real movement, AI, projectiles, physical
 * courier arrival and an explicit in-memory durable candidate holder. These
 * accelerated ticks do not establish native persistence or human pacing. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=require('./connected_support.cjs').ROOT,DEFAULT_OUTPUT=path.join(ROOT,'evidence10/heaven-campaign-earned'),copy=structuredClone,distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function sourceEpoch(){
 const files=fs.readdirSync(path.join(ROOT,'src')).filter(file=>fs.statSync(path.join(ROOT,'src',file)).isFile()).sort().map(file=>'src/'+file);
 files.push('build.py','index.html','tests/heaven_campaign_journey.cjs','tests/realm_trails_journey.cjs');
 return Object.fromEntries(files.map(file=>[file,sha(path.join(ROOT,file))]));
}
// Capture bytes before loading production modules, not only after earning work.
const loadedHashes=sourceEpoch();
const {createHarness,earnedKit}=require(require('./connected_support.cjs').ROOT+'/tests/realm_trails_journey.cjs');
const C=require(require('./connected_support.cjs').sourcePath('core')),A=require(require('./connected_support.cjs').sourcePath('adventure')),T=require(require('./connected_support.cjs').sourcePath('combat')),AR=require(require('./connected_support.cjs').sourcePath('arsenal'));
const W=require(require('./connected_support.cjs').sourcePath('world-foundations')),R=require(require('./connected_support.cjs').sourcePath('realm-trails')),H=require(require('./connected_support.cjs').sourcePath('heaven-campaign')),D=H.definition;
const step=id=>D.steps.find(s=>s.id===id),balances=sim=>({xp:sim.state.adventure.xp,coins:sim.state.adventure.coins,ore:sim.state.adventure.ore,inventory:copy(sim.state.sandbox.inventory)});

function outputFolder(output,variant){
 const base=path.resolve(output);assert.notEqual(base,path.parse(base).root,'name a bounded evidence directory');
 const sourceScratch=base.toLowerCase()===DEFAULT_OUTPUT.toLowerCase(),resolvedRoot=fs.realpathSync(ROOT);
 const withinRoot=p=>{const relative=path.relative(resolvedRoot,p);return !path.isAbsolute(relative)&&relative!=='..'&&!relative.startsWith('..'+path.sep);};
 if(process.platform==='win32'){
  // Only this exact canonical default may use small JSON source scratch on C.
  // Explicit outside outputs remain D-only; this harness never writes profiles.
  if(!sourceScratch)assert.match(base,/^D:[\\/]/i,'outside evidence belongs on D');
  let ancestor=base;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
  const resolved=fs.realpathSync(ancestor);
  if(sourceScratch)assert.ok(withinRoot(resolved),'canonical JSON scratch ancestor must resolve inside source ROOT');
  else assert.match(resolved,/^D:[\\/]/i,'existing outside evidence ancestor must resolve on D');
 }
 const folder=path.join(base,variant);assert.equal(fs.existsSync(folder),false,'refuse to overwrite an existing journey variant: '+folder);
 fs.mkdirSync(base,{recursive:true});fs.mkdirSync(folder);
 if(process.platform==='win32'){
  if(sourceScratch)assert.ok(withinRoot(fs.realpathSync(folder)),'canonical JSON scratch must resolve inside source ROOT');
  else assert.match(fs.realpathSync(folder),/^D:[\\/]/i);
 }
 return folder;
}

// Observe actual production callers without changing their arguments, return
// values, health or timing. Blade damage is lexical inside Adventure.command;
// bow impacts call the exported damage function from the real projectile loop.
function observeWeapons(sim,enemy,observations){
 const originalCommand=sim.adventureCommand,originalDamage=A.damageEnemy;
 sim.adventureCommand=function(id,type,payload={}){
  const before=enemy.hp,mode=enemy.mode,result=originalCommand.call(this,id,type,payload);
  if(this===sim&&['attack','pulse'].includes(type)&&AR.weapon(sim.state.adventure).style==='blade'&&result.ok&&enemy.hp<before)
   observations.push({caller:'production blade command',command:id,type,at:sim.state.adventure.elapsed,mode,before,hp:enemy.hp});
  return result;
 };
 A.damageEnemy=function(current,e,n,source){
  const before=e?.hp,mode=e?.mode,result=originalDamage.apply(this,arguments);
  if(current===sim&&e===enemy&&source==='weapon'&&e.hp<before)
   observations.push({caller:'production projectile impact',source,n,at:sim.state.adventure.elapsed,mode,before,hp:e.hp});
  return result;
 };
 return()=>{sim.adventureCommand=originalCommand;A.damageEnemy=originalDamage;};
}

function fight(h,terms,{trail=null,veteran=false,inheritedWorld=null}={}){
 const resolved=()=>trail?h.sim.state.realmTrails.records[trail.id].steps.includes(terms.defeatStep):h.sim.state.heavenCampaign.steps.includes(terms.defeatStep);
 const enemy=A.runtime(h.sim).enemies.find(e=>e.id===terms.id);assert.ok(enemy,'actual authored enemy '+terms.id);
 const initial={...balances(h.sim),defeated:copy(h.sim.state.adventure.defeated),drops:copy(h.sim.state.adventure.drops)};
 const style=AR.weapon(h.sim.state.adventure).style,radius=style==='bow'?4:1.1;
 h.walk(enemy.x,enemy.z+radius);h.command('target-select',{id:enemy.id});assert.strictEqual(T.selected(h.sim),enemy);
 const start=h.sim.state.adventure.elapsed,impacts=[],phases=[],contacts=[],weaponImpacts=[],restore=observeWeapons(h.sim,enemy,weaponImpacts);
 let frames=0,guards=0,arrows=false,lastHP=enemy.hp;
 try{
  h.command('auto-toggle');
  while(!resolved()&&frames++<4000){
   const sim=h.sim,a=sim.state.adventure,t=T.runtime(sim),cue=T.threat(sim);assert.ok(a.hp>0,'survive actual '+terms.id);
   if(cue&&!phases.some(p=>p.kind===cue.kind&&p.phase===cue.phase))phases.push({at:a.elapsed-start,...cue});
   if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){h.command('guard');guards++;}
   if(a.hp<45&&a.tonics&&a.elapsed>=A.runtime(sim).cooldowns.heal)h.command('heal');
   if(distance(sim.state.player,enemy)>=AR.weapon(a).reach-.2&&!sim.playerPath.length)
    assert.ok(sim.moveTo(enemy.x,enemy.z+radius).ok,'ordinary combat approach');
   const before={x:enemy.x,z:enemy.z},locked=enemy.mode==='windup'?enemy.strike:null,contactAt=enemy.contactAt;
   h.tick(.05);arrows ||= AR.runtime(sim).arrows.length>0;
   if(terms.radius)assert.ok(W.segment(sim.room,before,enemy,terms.radius),'actual enemy movement fits its declared body');
   if(locked){assert.ok(Object.isFrozen(locked),'actual attack is locked');assert.strictEqual(enemy.strike,locked,'same warning/contact keeps its frame');}
   if(enemy.contactAt!==contactAt)contacts.push({at:enemy.contactAt-start,hit:enemy.contactHit,strike:copy(enemy.strike)});
   if(enemy.hp<lastHP){impacts.push({at:a.elapsed-start,mode:enemy.mode,before:lastHP,hp:enemy.hp});if(trail)assert.equal(enemy.mode,'recover','old Choir bearing retains recovery-only damage');lastHP=enemy.hp;}
  }
 }finally{restore();}
 assert.ok(frames<4000&&enemy.hp===0&&resolved(),'actual combat earns '+terms.defeatStep);
 assert.ok(weaponImpacts.length>0,'confirmed production weapon contribution, separate from Briar');
 if(style==='bow')assert.ok(arrows&&weaponImpacts.some(p=>p.caller==='production projectile impact'),'real arrows precede confirmed impacts');
 if(!veteran&&!inheritedWorld)assert.ok(guards>0&&impacts.length>1,'ordinary starter survives with several impacts and Brace');
 assert.deepEqual({...balances(h.sim),defeated:h.sim.state.adventure.defeated,drops:h.sim.state.adventure.drops},initial,'no independent enemy payout or legacy defeat/drop');
 h.command('target-clear');
 return{enemy:terms.id,style,frames,seconds:h.sim.state.adventure.elapsed-start,guards,arrows,phases,contacts,impacts,weaponImpacts,healthAfter:h.sim.state.adventure.hp};
}

function walkEscort(h,{refuseArrival=false}={}){
 const record=()=>h.sim.state.heavenCampaign,route=D.escort.route,reached=[0],trace=[];
 const before=balances(h.sim);let refusals=0;
 if(refuseArrival)h.sim.heavenCampaignSave=()=>{refusals++;return{ok:false,error:'journey-controlled in-memory arrival save refusal'};};
 let frames=0,pauses=0;
 while(!record().steps.includes(D.escort.arrivalStep)&&H.runtime(h.sim).escort.phase!=='awaiting-save'&&frames++<5000){
  const sim=h.sim,e=H.runtime(sim).escort,target=route[e.routeIndex]||route.at(-1);assert.ok(e&&target);
  if(distance(sim.state.player,e)>6){assert.ok(sim.moveTo(sim.state.player.x,sim.state.player.z).ok,'ordinary stop and wait');pauses++;}
  else if(!sim.playerPath.length&&distance(sim.state.player,target)>.2)assert.ok(sim.moveTo(target.x,target.z).ok,'real service-loop leg');
  const player={...sim.state.player},old=copy(e);h.tick(.05);
  assert.strictEqual(H.runtime(sim).escort,e,'one owned courier throughout a visit');
  assert.ok(W.segment(sim.room,player,sim.state.player,.31),'player movement stays supported');
  assert.ok(W.segment(sim.room,old,e,D.escort.radius),'actual courier movement fits its full body');
  assert.ok(e.routeIndex===old.routeIndex||e.routeIndex===old.routeIndex+1,'one physical route waypoint at a time');
  if(e.routeIndex>old.routeIndex){assert.ok(distance(e,route[old.routeIndex])<.001);reached.push(old.routeIndex);trace.push({frame:frames,waypoint:old.routeIndex,x:e.x,z:e.z});}
  assert.ok(sim.state.adventure.hp>0);
 }
 assert.ok(frames<5000,'courier completes the actual route within a bounded simulation');
 let e=H.runtime(h.sim).escort;assert.equal(e.routeIndex,route.length);assert.ok(distance(e,route.at(-1))<.001);
 assert.deepEqual(reached,route.map((_,i)=>i),'every whole authored service segment was actually completed');
 if(refuseArrival){
  assert.ok(refusals>0);assert.equal(e.phase,'awaiting-save');assert.equal(record().steps.includes(D.escort.arrivalStep),false);assert.equal(H.ready(h.sim.state),false);
  assert.deepEqual(balances(h.sim),before,'refused arrival grants no reward');
  h.sim.heavenCampaignSave=h.save;
  // The actual rule owner spaces refused-save retries one second apart.
  // Keep real time and position; never invoke or manufacture arrival directly.
  let retryFrames=0;while(e.phase==='awaiting-save'&&retryFrames++<30){h.tick(.05);assert.strictEqual(H.runtime(h.sim).escort,e);assert.ok(distance(e,route.at(-1))<.001);}
  assert.ok(retryFrames<30,'actual bounded arrival callback retries after saving becomes available');
 }
 assert.equal(e.phase,'arrived');assert.ok(record().steps.includes(D.escort.arrivalStep));assert.ok(distance(h.sim.state.player,e)<=D.escort.arrivalRadius);
 assert.deepEqual(h.saved.heavenCampaign,record(),'only actual arrival saved the owned deed');
 assert.deepEqual(balances(h.sim),before,'courier arrival grants no independent reward');
 return{frames,pauses,reached,trace,refusals,actor:copy(e)};
}

function journey({bow=false,veteran=false,choice=bow?'broadened-activation':'accessible-assist',output=DEFAULT_OUTPUT,seedOnly=false,inheritedWorld,connectedVariant}={}){
 assert.ok(inheritedWorld&&!veteran&&!seedOnly,'inherited connected input only');
 assert.ok(D.choices.some(c=>c.id===choice),'known deliberate local arrangement');
 const variant=connectedVariant,folder=outputFolder(output,variant);
 const source=inheritedWorld;
 const fixtureHash=source?sha(source):null,h=require('./connected_support.cjs').createInherited(source,bow);
 const campaignEvents=[],fights=[],checkpoints=[],activations=[];let stage='initial-kit';
 const write=(name,value)=>fs.writeFileSync(path.join(folder,name+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 const snap=name=>{write(name,h.sim.snapshot());checkpoints.push(name);};
 const hook=()=>{h.sim.heavenCampaignSave=h.save;};
 const act=(type,p={},io={save:h.save},expect=true)=>{
  const ctx=h.context();hook();const result=H.command(ctx,type,{quest:D.id,expectedRevision:h.sim.state.adventure.revision,expectedActive:ctx.active,...p},io);
  campaignEvents.push({type,payload:p,result});assert.equal(result.ok,expect,type+': '+(result.error||result.text));return result;
 };
 const reload=()=>{const record=copy(h.sim.state.heavenCampaign);h.reload('heaven');hook();assert.deepEqual(h.sim.state.heavenCampaign,record);assert.equal(H.runtime(h.sim).activation,null);};
 try{
  h.walk(18,6);
  const choir=R.definition(D.prerequisite);h.enter('heaven');
  if(!h.sim.state.realmTrails.records[choir.id].claimed){
   stage='broken-choir';h.walk(choir.giver.x,choir.giver.z);h.trail('accept',choir);
   for(const id of['spillway',...choir.enemy.spawnAfter]){const s=choir.steps.find(s=>s.id===id);h.walk(s.x,s.z);h.trail('step',choir,{step:id});}
   fights.push(fight(h,choir.enemy,{trail:choir,veteran,inheritedWorld}));
   const repair=choir.steps.find(s=>s.id==='garden-repair');h.walk(repair.x,repair.z);h.trail('step',choir,{step:repair.id});
   h.walk(choir.giver.x,choir.giver.z);const before=balances(h.sim);h.trail('claim',choir);
   for(const k of['xp','coins','ore'])assert.equal(balances(h.sim)[k]-before[k],Math.min(choir.reward[k],9999-before[k]));
  }
  assert.equal(h.sim.state.realmTrails.records[D.prerequisite].claimed,true);
  h.home();h.walk(0,3);h.command('rest');h.walk(18,6);snap('00_EARNED_SEED');
  const seedPath=path.join(folder,'00_EARNED_SEED.json');
  write('SEED_PROVENANCE',{variant,seed:seedPath,seedSha256:sha(seedPath),source,fixtureHash,method:'inherited connected original-four-chapter character; no kit or equipment replay; actual Broken Choir acceptance, relay operations, combat, repair and claim; ordinary rest at the home spring',priorClaimed:D.prerequisite,campaign:h.sim.state.heavenCampaign,sourceHashes:loadedHashes,positionEdits:0,inventoryGrants:0,manualDamage:0,forcedModes:0,plantedDefeats:0});
  if(seedOnly){const finalHashes=sourceEpoch();assert.deepEqual(finalHashes,loadedHashes,'source bytes frozen through earned seed');return{status:'passed',variant,seed:path.join(folder,'00_EARNED_SEED.json'),source,fixtureHash,sourceHashes:loadedHashes};}
  const baseline=h.sim.snapshot();stage='accept';h.enter('heaven');hook();h.walk(D.giver.x,D.giver.z);act('accept');
  const waiting=H.runtime(h.sim).escort;assert.equal(waiting.phase,'idle');assert.deepEqual([waiting.x,waiting.z],[D.escort.x,D.escort.z]);snap('01_ACCEPTED');reload();
  stage='investigation';for(const id of['witness-account','compare-arrival-marks','inspect-false-relay']){const s=step(id);h.walk(s.x,s.z);act('step',{step:id});}
  snap('02_PRESERVED_ACCOUNT');reload();
  const prepared=bow||veteran;if(prepared){const s=step('ground-mirror');h.walk(s.x,s.z);act('step',{step:s.id});}
  const watch=step('begin-watch');h.walk(watch.x,watch.z);act('step',{step:watch.id});snap('03_FALSE_SIGNAL_WATCH');
  for(const terms of D.enemies){stage=terms.defeatStep;fights.push(fight(h,terms,{veteran,inheritedWorld}));snap('CHECKPOINT_'+terms.defeatStep);reload();assert.equal(H.enemies(h.sim).some(e=>e.id===terms.id),false);}
  const beam=fights.find(f=>f.enemy===D.enemies[0].id);if(!veteran&&!inheritedWorld)assert.ok(beam.weaponImpacts.some(p=>p.mode!=='recover'),'ordinary Heaven weapon damage is confirmed outside recovery');
  assert.equal(h.sim.state.heavenCampaign.steps.includes('ground-mirror'),prepared);
  stage='secure-service-route';const secure=step('secure-service-route');h.walk(secure.x,secure.z);act('step',{step:secure.id});
  const invite=step(D.escort.startStep);h.walk(invite.x,invite.z);const beforeInvite=balances(h.sim);act('escort-invite');assert.deepEqual(balances(h.sim),beforeInvite);
  // Actually walk ahead, causing the owned slower courier to wait out of range.
  h.walk(7,17);const lagging=H.runtime(h.sim).escort,stopped=copy(lagging);assert.equal(lagging.phase,'lagging');assert.ok(distance(h.sim.state.player,lagging)>D.escort.followRange);
  h.tick(.5);assert.deepEqual([lagging.x,lagging.z,lagging.routeIndex],[stopped.x,stopped.z,stopped.routeIndex]);assert.equal(h.sim.state.heavenCampaign.steps.includes(D.escort.arrivalStep),false);snap('04_INVITED_AND_WAITING');
  stage='escort-reset';const invitation=copy(h.sim.state.heavenCampaign);reload();assert.deepEqual(h.sim.state.heavenCampaign,invitation);
  assert.equal(H.escortStatus(h.sim).phase,'reset');assert.deepEqual([H.runtime(h.sim).escort.x,H.runtime(h.sim).escort.z],[D.escort.x,D.escort.z]);
  h.walk(invite.x,invite.z);const beforeRetry=balances(h.sim),count=h.sim.state.heavenCampaign.steps.length;act('escort-invite');assert.equal(h.sim.state.heavenCampaign.steps.length,count);assert.deepEqual(balances(h.sim),beforeRetry,'deliberate reinvitation grants no second fee');
  stage='actual-courier-arrival';const escort=walkEscort(h,{refuseArrival:bow});snap('05_ACTUAL_COURIER_ARRIVAL');reload();
  assert.equal(H.runtime(h.sim).escort.phase,'arrived');assert.ok(distance(H.runtime(h.sim).escort,D.escort.route.at(-1))<.001);
  stage='welcome-arrangement';for(const id of['fit-arrival-assist','arrangement']){const s=step(id);h.walk(s.x,s.z);act(id==='arrangement'?'choose':'step',id==='arrangement'?{choice}:{step:id});}
  const permanent=h.sim.snapshot();act('choose',{choice:D.choices.find(c=>c.id!==choice).id},{save:h.save},false);assert.deepEqual(h.sim.snapshot(),permanent,'the deliberate fitting cannot be overwritten');
  const activationBefore=h.sim.snapshot();act('activate');assert.deepEqual(h.sim.snapshot(),activationBefore,'instrument activation grants no deed, currency or gear');activations.push(copy(H.runtime(h.sim).activation));
  act('activate',{}, {save:h.save},false);assert.deepEqual(h.sim.snapshot(),activationBefore);h.tick(1.3);assert.equal(H.runtime(h.sim).activation.active,false);snap('06_CHOICE_AND_QUIET_INSTRUMENT');reload();
  const verify=step('verify-welcome');h.walk(verify.x,verify.z);act('step',{step:verify.id});assert.equal(H.ready(h.sim.state),true);snap('07_COMPLETE_UNPAID');reload();
  stage='whole-once-only-fee';h.walk(D.giver.x,D.giver.z);const unpaid=h.sim.snapshot();act('claim',{}, {save:()=>({ok:false,error:'journey-controlled in-memory whole-claim save refusal'})},false);assert.deepEqual(h.sim.snapshot(),unpaid,'refused save keeps the whole earned fee unpaid');
  const result=act('claim'),paid=h.sim.snapshot();assert.deepEqual(result.reward,{...copy(D.reward),xp:Math.min(D.reward.xp,9999-unpaid.adventure.xp)});
  assert.equal(paid.adventure.xp-unpaid.adventure.xp,Math.min(D.reward.xp,9999-unpaid.adventure.xp));for(const k of['coins','ore'])assert.equal(paid.adventure[k]-unpaid.adventure[k],D.reward[k]);
  for(const[k,n]of Object.entries(D.reward.materials))assert.equal(paid.sandbox.inventory[k]-unpaid.sandbox.inventory[k],n);
  assert.equal(paid.adventure.hp,unpaid.adventure.hp);assert.equal(paid.adventure.stamina,unpaid.adventure.stamina);assert.equal(paid.adventure.tonics,unpaid.adventure.tonics);
  assert.equal(act('claim',{request:'different-command-identity'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);snap('08_PAID_ONCE');reload();
  h.walk(D.giver.x,D.giver.z);const reloadedPaid=h.sim.snapshot();assert.equal(act('claim',{request:'after-cold-reload'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),reloadedPaid);
  h.walk(step('fit-arrival-assist').x,step('fit-arrival-assist').z);const afterClaim=h.sim.snapshot();act('activate');activations.push(copy(H.runtime(h.sim).activation));assert.deepEqual(h.sim.snapshot(),afterClaim,'claimed instrument activation pays nothing again');
  h.home();assert.equal(H.runtime(h.sim).escort,null);assert.equal(H.runtime(h.sim).activation,null);snap('FINAL_WORLD');
  stage='preservation-and-frozen-source';const final=h.sim.snapshot();
  for(const k of['journeys','realmTrails','earthExpedition','hellCampaign','bridgeCommunity','localLife','homeHistory','notes','score','scoreRevision','retreat','visitor','flowers','settings'])assert.deepEqual(final[k],baseline[k],k+' retained');
  for(const k of['owned','equipment','arsenal','starter','pursuit','realmCraft','earthBinding','classPath','companion','beacon','crossing','road','earthStory','earthNotes','earthGathering','defeated','drops','reward','relic','angelSeen'])assert.deepEqual(final.adventure[k],baseline.adventure[k],k+' retained');
  for(const prior of baseline.journal){const retained=final.journal.find(e=>e.seq===prior.seq);if(retained)assert.deepEqual(retained,prior,'prior retained journal entries are never rewritten');else assert.ok(final.journal.length===200&&prior.seq<final.journal[0].seq,'only existing bounded journal trimming can omit an oldest entry');}
  assert.equal(final.adventure.xp-baseline.adventure.xp,Math.min(D.reward.xp,9999-baseline.adventure.xp));assert.equal(final.adventure.coins-baseline.adventure.coins,D.reward.coins);assert.equal(final.adventure.ore-baseline.adventure.ore,D.reward.ore);
  for(const[k,n]of Object.entries(D.reward.materials))assert.equal(final.sandbox.inventory[k]-baseline.sandbox.inventory[k],n);
  const finalHashes=sourceEpoch(),sourceDrift=JSON.stringify(finalHashes)!==JSON.stringify(loadedHashes);if(source)assert.equal(sha(source),fixtureHash,'returning fixture bytes remain untouched');
  const report={status:sourceDrift?'source-drift':'passed',variant,choice,prepared,source,fixtureHash,method:'production kit, Broken Choir commands and combat, Heaven commands/AI/projectiles, complete owned escort route, deliberate fitting and exact once-only fee; accelerated ticks with in-memory durable holder',acceleratedTicks:true,nativePersistence:false,humanPacing:false,positionEdits:0,inventoryGrants:0,manualDamage:0,forcedModes:0,plantedDefeats:0,sourceHashes:loadedHashes,finalHashes,sourceDrift,harnessSha256:sha(__filename),saveVersions:{world:C.VERSION,adventure:A.VERSION,heavenCampaign:1},baselineStats:A.stats(baseline.adventure),priorJournalEntries:baseline.journal.length,retainedPriorJournalEntries:baseline.journal.filter(e=>final.journal.some(f=>f.seq===e.seq)).length,checkpoints,events:[...h.events,...campaignEvents],fights,escort,wait:{actor:stopped,seconds:.5},activations,walkedRoutes:h.routes,saveCount:h.checkpoints.length,canonicalPreservation:true};
  write('HEAVEN_CAMPAIGN_JOURNEY_REPORT',report);assert.equal(sourceDrift,false,'source changed during journey; preserve this receipt and rerun after freeze in a new output');return report;
 }catch(error){write('FAILURE',{status:'failed',variant,stage,error:error.stack,source,fixtureHash,sourceHashes:loadedHashes,finalHashes:sourceEpoch(),checkpoints,events:[...h.events,...campaignEvents],fights,routes:h.routes});throw error;}
}
if(require.main===module){
 const i=process.argv.indexOf('--output'),j=process.argv.indexOf('--choice');
 const report=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),seedOnly:process.argv.includes('--seed-only'),...(i>=0?{output:path.resolve(process.argv[i+1])}:{}),...(j>=0?{choice:process.argv[j+1]}:{})});
 console.log(JSON.stringify({status:report.status,variant:report.variant,choice:report.choice,seed:report.seed,fights:report.fights?.length,escortFrames:report.escort?.frames,sourceDrift:report.sourceDrift},null,2));
}
module.exports={journey};
