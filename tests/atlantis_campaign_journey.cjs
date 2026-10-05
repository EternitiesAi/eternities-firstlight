'use strict';
/* Actual command-earned Bellglass and harbour repair, swimming/current, owned
 * combat and one fixed fee. Accelerated production ticks and in-memory saves
 * are separate from native persistence, ordinary footage and human enjoyment. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),DEFAULT=path.join(ROOT,'evidence10/atlantis-campaign-earned'),copy=structuredClone;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sourceEpoch=()=>Object.fromEntries([...fs.readdirSync(path.join(ROOT,'src')).filter(p=>fs.statSync(path.join(ROOT,'src',p)).isFile()).sort().map(p=>'src/'+p),'build.py','index.html','tests/atlantis_campaign_journey.cjs','tests/realm_trails_journey.cjs'].map(p=>[p,sha(path.join(ROOT,p))]));
const loadedHashes=sourceEpoch();
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs');
const C=require('../src/core.js'),A=require('../src/adventure.js'),T=require('../src/combat.js'),AR=require('../src/arsenal.js');
const W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js'),H=require('../src/atlantis-campaign.js'),D=H.definition;
const step=id=>D.steps.find(s=>s.id===id),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const balances=sim=>({xp:sim.state.adventure.xp,coins:sim.state.adventure.coins,ore:sim.state.adventure.ore,inventory:copy(sim.state.sandbox.inventory)});
const gallery=[[8,-.5,-19.5],[8,-1.05,-22],[8,-2.55,-28],[8,-2.7,-29.5],[8,-2.7,-32],[8,-2.7,-35],[8,-2.7,-32],[8,-2.7,-29.5],[8,-1.8,-29],[12,-1.8,-29],[12,-1.4,-38.4],[12,-1.4,-39.3]];
function folderFor(output,variant){
 const base=path.resolve(output);assert.notEqual(base,path.parse(base).root);const scratch=base.toLowerCase()===DEFAULT.toLowerCase();
 let ancestor=base;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
 if(process.platform==='win32'){
  if(!scratch)assert.match(base,/^D:[\\/]/i,'outside evidence belongs on D');
  const actual=fs.realpathSync(ancestor),relative=path.relative(fs.realpathSync(ROOT),actual);
  if(scratch)assert.ok(!path.isAbsolute(relative)&&relative!=='..'&&!relative.startsWith('..'+path.sep),'source scratch stays inside ROOT');
  else assert.match(actual,/^D:[\\/]/i,'actual outside output belongs on D');
 }
 const folder=path.join(base,variant);assert.equal(fs.existsSync(folder),false,'refuse existing journey output');fs.mkdirSync(folder,{recursive:true});return folder;
}
function swim(h,target,trace){
 const sim=h.sim,d=W.definition('atlantis').dive;assert.ok(sim.worldDive,'swim only in actual dive mode');let frames=0;
 for(;frames<4000;frames++){
  const p=sim.state.player,y=W.playerHeight(sim),dx=target[0]-p.x,dz=target[2]-p.z,dy=target[1]-y,n=Math.hypot(dx,dz);
  if(n<.08&&Math.abs(dy)<.015)break;
  const dt=n>.005?Math.min(.05,n/2.6):Math.min(.05,Math.abs(dy)/2.6),amount=dt*2.6;
  W.swim(sim,n>.005?dx:0,n>.005?dz:0,amount?dy/amount:0,dt);sim.tick(dt);
  assert.ok(W.swimClear(d,p.x,W.playerHeight(sim),p.z),'real body remains in supported gallery volume');assert.ok(sim.state.adventure.hp>0);
 }
 assert.ok(frames<4000,'actual swim reaches '+JSON.stringify(target));trace.push({target,frames,actual:{...sim.state.player,y:W.playerHeight(sim)},body:W.divingStatus(sim).body});
}
function earnBellglass(h,trace){
 const d=R.definition(D.prerequisite);h.enter('atlantis');
 if(!h.sim.state.realmTrails.records[d.id].claimed){
  h.walk(d.giver.x,d.giver.z);h.trail('accept',d);const landing=W.definition('atlantis').points.find(p=>p.id==='tide-steps');h.walk(landing.x,landing.z);assert.ok(W.diveEnter(h.sim).ok);
  for(const target of gallery){
   swim(h,target,trace);const r=h.sim.state.realmTrails.records[d.id],s=d.steps.find(s=>s.x===target[0]&&s.y===target[1]&&s.z===target[2]&&!r.steps.includes(s.id));
   if(s){assert.ok(R.at(h.sim,s));h.trail('step',d,{step:s.id,choice:s.correctChoice});}
  }
  assert.ok(W.diveExit(h.sim).ok);h.walk(d.giver.x,d.giver.z);h.trail('claim',d);
 }
 assert.equal(h.sim.state.realmTrails.records[d.id].claimed,true);h.home();h.walk(0,3);h.command('rest');h.walk(18,6);
}
function fight(h,veteran){
 const sim=h.sim,e=A.runtime(sim).enemies.find(e=>e.id===D.enemy.id);assert.ok(e&&H.canDamage(sim,e));
 const before={...balances(sim),defeated:copy(sim.state.adventure.defeated),drops:copy(sim.state.adventure.drops)},style=AR.weapon(sim.state.adventure).style,stand=style==='bow'?4:1.1;
 h.walk(e.x,e.z+stand);h.command('target-select',{id:e.id});assert.strictEqual(T.selected(sim),e);h.command('auto-toggle');
 const originalDamage=A.damageEnemy,originalCommand=sim.adventureCommand,weaponImpacts=[],impacts=[],phases=[],contacts=[];
 sim.adventureCommand=function(id,type,payload){const hp=e.hp,mode=e.mode,result=originalCommand.call(this,id,type,payload);if(this===sim&&['attack','pulse'].includes(type)&&style==='blade'&&result.ok&&e.hp<hp)weaponImpacts.push({caller:'production blade command',type,mode,before:hp,after:e.hp});return result;};
 A.damageEnemy=function(current,enemy,n,source){const hp=enemy?.hp,mode=enemy?.mode,result=originalDamage.apply(this,arguments);if(current===sim&&enemy===e&&source==='weapon'&&enemy.hp<hp)weaponImpacts.push({caller:'production projectile impact',mode,before:hp,after:enemy.hp});return result;};
 let frames=0,guarded=0,arrows=false,lastHP=e.hp;const start=sim.state.adventure.elapsed;
 try{
  while(!sim.state.atlantisCampaign.steps.includes(D.enemy.defeatStep)&&frames++<4000){
   const a=sim.state.adventure,cue=T.threat(sim),t=T.runtime(sim);assert.ok(a.hp>0,'survive actual Custodian');
   if(cue&&!phases.some(p=>p.phase===cue.phase&&p.kind===cue.kind))phases.push({at:a.elapsed-start,...cue});
   if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){h.command('guard');guarded++;}
   if(a.hp<45&&a.tonics&&a.elapsed>=A.runtime(sim).cooldowns.heal)h.command('heal');
   if(distance(sim.state.player,e)>=AR.weapon(a).reach-.2&&!sim.playerPath.length)assert.ok(sim.moveTo(e.x,e.z+stand).ok,'ordinary approach remains supported');
   const origin={x:e.x,z:e.z},oldFrame=['windup','intake'].includes(e.mode)?e.strike:null,contactAt=e.contactAt;
   h.tick(.05);arrows ||= AR.runtime(sim).arrows.length>0;assert.ok(W.segment(D.room,origin,e,D.enemy.radius),'whole Custodian body stays supported');
   if(oldFrame){assert.ok(Object.isFrozen(oldFrame));assert.strictEqual(e.strike,oldFrame,'actual contact retains locked warning');}
   if(contactAt!==e.contactAt)contacts.push({at:e.contactAt-start,hit:e.contactHit,frame:copy(e.strike)});
   if(e.hp<lastHP){impacts.push({at:a.elapsed-start,mode:e.mode,before:lastHP,hp:e.hp});lastHP=e.hp;}
  }
 }finally{A.damageEnemy=originalDamage;sim.adventureCommand=originalCommand;}
 assert.ok(frames<4000&&e.hp===0&&sim.state.atlantisCampaign.steps.includes(D.enemy.defeatStep));assert.ok(weaponImpacts.length>0,'attributed actual weapon contribution');
 if(style==='bow')assert.ok(arrows&&weaponImpacts.some(p=>p.caller==='production projectile impact'),'actual bow flight/collision');
 if(!veteran)assert.ok(guarded>0&&impacts.length>1,'ordinary kit needs several actual hits and can Brace');
 assert.deepEqual({...balances(sim),defeated:sim.state.adventure.defeated,drops:sim.state.adventure.drops},before,'bearing exhaustion grants no legacy reward');
 h.command('target-clear');return{enemy:e.id,style,frames,seconds:sim.state.adventure.elapsed-start,guarded,arrows,weaponImpacts,impacts,phases,contacts,pullDistance:H.runtime(sim).pullDistance,healthAfter:sim.state.adventure.hp};
}
function journey({bow=false,veteran=false,output=DEFAULT,seedOnly=false,approach=bow?'lower':'upper',choice=veteran?'license':bow?'limited':'publish'}={}){
 assert.ok(D.approaches.some(a=>a.id===approach)&&D.choices.some(c=>c.id===choice));
 const variant=veteran?'returning-strongest':bow?'fresh-bow':'fresh-blade',folder=folderFor(output,variant),fixture=veteran?path.join(ROOT,'docs/evidence/world-production-2026-10-03/captures/returning-fit-final-01/FINAL_WORLD.json'):null,fixtureHash=fixture?sha(fixture):null;
 const h=createHarness(fixture?JSON.parse(fs.readFileSync(fixture,'utf-8')):undefined),events=[],swims=[],checkpoints=[],checkpointHashes={};let stage='kit';
 const write=(name,value)=>fs.writeFileSync(path.join(folder,name+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx'}),snap=name=>{write(name,h.sim.snapshot());checkpoints.push(name);checkpointHashes[name]=sha(path.join(folder,name+".json"));};
 const hook=()=>{h.sim.atlantisCampaignSave=h.save;};
 const act=(type,p={},io={save:h.save},expect=true)=>{const ctx=h.context();hook();const result=H.command(ctx,type,{quest:D.id,expectedActive:ctx.active,expectedRevision:h.sim.state.adventure.revision,...p},io);events.push({type,p,result});assert.equal(result.ok,expect,type+': '+(result.error||result.text));return result;};
 const reload=()=>{const before=copy(h.sim.state.atlantisCampaign);h.reload('atlantis');hook();assert.deepEqual(h.sim.state.atlantisCampaign,before);assert.equal(h.sim.worldDive,undefined);};
 const dive=()=>{const p=W.definition('atlantis').points.find(p=>p.id==='tide-steps');h.walk(p.x,p.z);assert.ok(W.diveEnter(h.sim).ok);};
 try{
  if(veteran){assert.equal(A.level(h.sim.state.adventure),5);assert.equal(h.sim.state.adventure.equipment.weapon,'dawn_edge');h.walk(18,6);}else earnedKit(h,bow);
  stage='earned-bellglass';earnBellglass(h,swims);snap('00_EARNED_SEED');write('SEED_PROVENANCE',{variant,fixture,fixtureHash,seedSha256:sha(path.join(folder,'00_EARNED_SEED.json')),prerequisite:D.prerequisite,positionEdits:0,inventoryGrants:0,manualDamage:0,plantedDefeats:0,forcedModes:0,sourceHashes:loadedHashes});
  if(seedOnly){assert.deepEqual(sourceEpoch(),loadedHashes);return{status:'passed',variant,seed:path.join(folder,'00_EARNED_SEED.json')};}
  const baseline=h.sim.snapshot();h.enter('atlantis');hook();h.walk(D.giver.x,D.giver.z);stage='accept';act('accept');snap('01_ACCEPTED');reload();
  h.walk(step('receipt-conflict').x,step('receipt-conflict').z);act('step',{step:'receipt-conflict'});h.walk(D.giver.x,D.giver.z);act('approach',{approach});snap('02_RETAINED_APPROACH');reload();
  stage='actual-depth-and-flow';dive();swim(h,[8,-.5,-19.5],swims);swim(h,[8,-1.05,-22],swims);
  if(approach==='upper')act('step',{step:'upper-reading'});
  swim(h,[8,-1.05,-25],swims);const flowing={...h.sim.state.player},depth=W.playerHeight(h.sim);h.tick(.5);assert.ok(h.sim.state.player.z<flowing.z-.3,'actual accepted shallow current moves player');assert.equal(W.playerHeight(h.sim),depth);assert.equal(h.sim.state.player.x,flowing.x);
  swim(h,[8,-2.55,-28],swims);const quiet={...h.sim.state.player};h.tick(.5);assert.deepEqual(h.sim.state.player,quiet,'lower band is quiet');if(approach==='lower')act('step',{step:'lower-reading'});else act('step',{step:'lower-reading'});
  swim(h,[8,-2.7,-29.5],swims);swim(h,[8,-2.7,-32],swims);swim(h,[8,-2.7,-35],swims);assert.equal(W.divingStatus(h.sim).body,'air');act('step',{step:'diagnose-flow'});snap('03_DIAGNOSED_AT_REAL_DEPTH');
  stage='ordered-pressure';swim(h,[8,-2.7,-32],swims);swim(h,[8,-2.7,-29.5],swims);swim(h,[8,-1.8,-29],swims);swim(h,[12,-1.8,-29],swims);
  if(bow){act('pressure',{step:'manual-bypass',setting:'open-bypass'});assert.equal(H.currentStatus(h.sim).active,false);snap('04_MANUAL_BYPASS');}
  swim(h,[8,-1.8,-29],swims);swim(h,[8,-2.55,-28],swims);swim(h,[8,-1.05,-22],swims);const before=h.sim.snapshot();act('pressure',{step:'inlet-set',setting:'wrong-setting'},undefined,false);assert.deepEqual(h.sim.snapshot(),before);
  act('pressure',{step:'inlet-set',setting:'isolate-redirect'});snap('CHECKPOINT_INLET');
  for(const p of [[8,-2.55,-28],[8,-2.7,-29.5],[8,-2.7,-32],[8,-2.7,-35]])swim(h,p,swims);
  act('pressure',{step:'equalizer-set',setting:'match-depth-bands'});snap('CHECKPOINT_EQUALIZER');
  for(const p of [[8,-2.7,-32],[8,-2.7,-29.5],[8,-1.8,-29],[12,-1.8,-29],[12,-1.4,-38.4]])swim(h,p,swims);
  act('pressure',{step:'outlet-set',setting:'chosen-destination'});assert.equal(H.currentStatus(h.sim).active,false);snap('05_CORRECTED_OUTLET');swim(h,[12,-1.4,-39.3],swims);assert.ok(W.diveExit(h.sim).ok);
  h.walk(step('secure-carrier').x,step('secure-carrier').z);act('step',{step:'secure-carrier'});h.walk(step('challenge-custodian').x,step('challenge-custodian').z);act('step',{step:'challenge-custodian'});snap('06_ACTUAL_CUSTODIAN_READY');
  stage='actual-custodian-combat';const combat=fight(h,veteran);snap('07_ACTUAL_BEARING_EXPOSED');reload();assert.equal(H.enemies(h.sim).length,0);
  for(const [id,setting]of [['release-west','stabilize-west'],['release-east','stabilize-east']]){h.walk(step(id).x,step(id).z);act('pressure',{step:id,setting});snap('CHECKPOINT_'+id);}
  h.walk(step('custodian-stable').x,step('custodian-stable').z);act('step',{step:'custodian-stable'});snap('08_INDEPENDENT_SAFETY');reload();
  stage='explicit-disposition';h.walk(step('disposition').x,step('disposition').z);act('choose',{choice});snap('09_SELECTED_DISPOSITION');reload();h.walk(step('verify-passage').x,step('verify-passage').z);act('step',{step:'verify-passage'});assert.ok(H.ready(h.sim.state));snap('10_VERIFIED_UNPAID');reload();
  stage='whole-once-only-fee';h.walk(D.giver.x,D.giver.z);const unpaid=h.sim.snapshot();act('claim',{}, {save:()=>({ok:false,error:'journey-labelled synchronous claim refusal'})},false);assert.deepEqual(h.sim.snapshot(),unpaid);
  const result=act('claim'),paid=h.sim.snapshot();assert.deepEqual(result.reward,{...copy(D.reward),xp:Math.min(D.reward.xp,9999-unpaid.adventure.xp)});
  for(const k of['coins','ore'])assert.equal(paid.adventure[k]-unpaid.adventure[k],D.reward[k]);for(const[k,n]of Object.entries(D.reward.materials))assert.equal(paid.sandbox.inventory[k]-unpaid.sandbox.inventory[k],n);
  for(const k of['hp','stamina','tonics'])assert.equal(paid.adventure[k],unpaid.adventure[k]);assert.equal(act('claim',{request:'changed-identity'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);snap('11_PAID_ONCE');reload();h.walk(D.giver.x,D.giver.z);const cold=h.sim.snapshot();assert.equal(act('claim',{request:'cold-retry'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),cold);
  h.home();snap('FINAL_WORLD');stage='preserved-history';const final=h.sim.snapshot();
  for(const k of['journeys','realmTrails','earthExpedition','hellCampaign','heavenCampaign','bridgeCommunity','localLife','homeHistory','notes','score','scoreRevision','retreat','visitor','flowers','settings'])assert.deepEqual(final[k],baseline[k],k+' retained');
  for(const k of['owned','equipment','arsenal','starter','pursuit','realmCraft','earthBinding','classPath','companion','beacon','crossing','road','earthStory','earthNotes','earthGathering','defeated','drops','reward','relic','angelSeen'])assert.deepEqual(final.adventure[k],baseline.adventure[k],k+' retained');
  assert.equal(final.adventure.xp-baseline.adventure.xp,Math.min(D.reward.xp,9999-baseline.adventure.xp));
  const finalHashes=sourceEpoch(),drift=JSON.stringify(finalHashes)!==JSON.stringify(loadedHashes);if(fixture)assert.equal(sha(fixture),fixtureHash);
  const report={status:drift?'source-drift':'passed',variant,approach,choice,fixture,fixtureHash,sourceHashes:loadedHashes,finalHashes,sourceDrift:drift,saveVersions:{world:C.VERSION,adventure:A.VERSION,atlantisCampaign:1},method:'command-earned kit/Bellglass, real swimming/current/depth/pressure, actual Adventure AI and weapon collisions, explicit disposition and fixed fee; accelerated ticks with in-memory holder',nativePersistence:false,humanPacing:false,positionEdits:0,inventoryGrants:0,manualDamage:0,plantedDefeats:0,forcedModes:0,checkpoints,checkpointHashes,events:[...h.events,...events],swims,combat,walks:h.routes,saveCount:h.checkpoints.length,baselineStats:A.stats(baseline.adventure),canonicalPreservation:true};write('ATLANTIS_CAMPAIGN_JOURNEY_REPORT',report);assert.equal(drift,false,'source changed during journey; retain evidence and rerun frozen in a new output');return report;
 }catch(error){write('FAILURE',{status:'failed',variant,stage,error:error.stack,sourceHashes:loadedHashes,finalHashes:sourceEpoch(),events:[...h.events,...events],swims,checkpoints,walks:h.routes});throw error;}
}
if(require.main===module){const i=process.argv.indexOf('--output'),a=process.argv.indexOf('--approach'),c=process.argv.indexOf('--choice');const r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),seedOnly:process.argv.includes('--seed-only'),...(i>=0?{output:path.resolve(process.argv[i+1])}:{}),...(a>=0?{approach:process.argv[a+1]}:{}),...(c>=0?{choice:process.argv[c+1]}:{})});console.log(JSON.stringify({status:r.status,variant:r.variant,seed:r.seed,combat:r.combat?.seconds,swims:r.swims?.length,sourceDrift:r.sourceDrift}));}
module.exports={journey};
