'use strict';
/* Actual installed-source journey, accelerated ticks and in-memory save holder.
 * No staged rule/geometry fallback, missing-integration facade or fixture
 * generation on import. Native persistence/RAF/feel require separate evidence. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const copy=o=>JSON.parse(JSON.stringify(o)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const QUEST='cosmos-open-confluence-v1',PRIOR='cosmos-split-bearing-v1';
const VARIANTS=['fresh-blade','fresh-bow','returning-strongest'],LEADS=['material','living','observation'],MODES=['ordinary','supplied'],CHOICES=['public-record','bounded-account'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function selectPlan({bow=false,veteran=false,supports,choice}={}){
 const variant=veteran?'returning-strongest':bow?'fresh-bow':'fresh-blade';
 assert.ok(!(veteran&&bow),'the canonical returning fixture retains its actual blade');
 const defaults=veteran?[['material','supplied'],['observation','ordinary']]:bow?[['living','ordinary'],['observation','supplied']]:[['material','ordinary'],['living','supplied']];
 const selected=supports===undefined?defaults:typeof supports==='string'?supports.split(',').map(s=>s.split(':')):supports.map(s=>Array.isArray(s)?s:[s.id,s.mode]);
 assert.ok(selected.length>=2&&selected.length<=3,'choose any two or three distinct supports');
 assert.equal(new Set(selected.map(s=>s[0])).size,selected.length,'a support cannot count twice');
 for(const pair of selected)assert.ok(pair.length===2&&LEADS.includes(pair[0])&&MODES.includes(pair[1]),'support must be material/living/observation:ordinary/supplied');
 choice ||= bow?'bounded-account':'public-record';assert.ok(CHOICES.includes(choice),'known bounded local account');
 return{variant,bow,veteran,choice,supports:selected.map(([id,mode])=>({id,mode}))};
}
function sourceRoot(requested){
 const root=fs.realpathSync(path.resolve(requested||process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..')));
 assert.ok(fs.existsSync(path.join(root,'src/core.js'))&&fs.existsSync(path.join(root,'tests/realm_trails_journey.cjs')),'FIRSTLIGHT_ROOT must identify the actual game repository');return root;
}
function sourceEpoch(root){
 const files=fs.readdirSync(path.join(root,'src')).filter(p=>fs.statSync(path.join(root,'src',p)).isFile()).sort().map(p=>'src/'+p);
 for(const p of ['build.py','index.html','tests/realm_trails_journey.cjs','tests/realm_trails_cosmos_journey.cjs','tests/atlantis_campaign_journey.cjs','tests/heaven_campaign_journey.cjs'])assert.ok(fs.existsSync(path.join(root,p)),'required current source '+p);
 files.push('build.py','index.html','tests/realm_trails_journey.cjs','tests/realm_trails_cosmos_journey.cjs','tests/atlantis_campaign_journey.cjs','tests/heaven_campaign_journey.cjs');
 return Object.fromEntries(files.map(p=>[p,sha(path.join(root,p))]));
}
function defaultOutput(root,file=__filename){return path.dirname(path.resolve(file))===path.join(root,'tests')?path.join(root,'evidence10/cosmos-campaign-earned'):path.join(path.dirname(path.resolve(file)),'outputs');}
function combatStand(terms,style,liveReleases=false){return style==='bow'?(terms.pattern==='reclaimer'?3.5:liveReleases?3:4):1.1;}
function folderFor(root,output,variant){
 assert.ok(VARIANTS.includes(variant));const base=path.resolve(output);assert.notEqual(base,path.parse(base).root,'bounded output directory required');
 const canonical=path.join(root,'evidence10/cosmos-campaign-earned'),scratch=base.toLowerCase()===canonical.toLowerCase(),within=(a,b)=>{const r=path.relative(a,b);return !path.isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+path.sep);};
 let ancestor=base;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);const actual=fs.realpathSync(ancestor);
 if(process.platform==='win32'){if(scratch)assert.ok(within(root,actual),'canonical small JSON scratch must resolve inside ROOT');else{assert.match(base,/^D:[\\/]/i,'explicit outside source receipts belong on D');assert.match(actual,/^D:[\\/]/i,'actual ancestor must remain on D');}}
 assert.ok(scratch||!within(root,base),'explicit output cannot write arbitrary game-checkout files');
 const folder=path.join(base,variant);assert.equal(fs.existsSync(folder),false,'refuse existing variant output');fs.mkdirSync(folder,{recursive:true});
 const final=fs.realpathSync(folder);if(process.platform==='win32'){if(scratch)assert.ok(within(root,final));else assert.match(final,/^D:[\\/]/i);}return final;
}
function preserved(final,before){
 for(const k of ['journeys','realmTrails','earthExpedition','hellCampaign','heavenCampaign','atlantisCampaign','bridgeCommunity','localLife','homeHistory','notes','score','scoreRevision','retreat','visitor','flowers','settings'])assert.deepEqual(final[k],before[k],k+' retains prior owner/history');
 for(const k of ['owned','equipment','arsenal','starter','pursuit','realmCraft','earthBinding','classPath','companion','beacon','crossing','road','earthStory','earthNotes','earthGathering','defeated','drops','reward','relic','angelSeen'])assert.deepEqual(final.adventure[k],before.adventure[k],k+' retains prior identity/history');
 for(const k of ['bridge','nextId','stats','milestones','recentCommands','cooldownUntil'])assert.deepEqual(final.sandbox[k],before.sandbox[k],'prior sandbox '+k);
 assert.deepEqual(final.sandbox.placed.map(p=>({...p,crop:null})),before.sandbox.placed.map(p=>({...p,crop:null})),'construction identities/positions remain');
 for(const prior of before.sandbox.placed)if(prior.crop){const now=final.sandbox.placed.find(p=>p.id===prior.id).crop;assert.ok(now);assert.equal(now.plantedAt,prior.crop.plantedAt);assert.equal(now.readyAt,prior.crop.readyAt);assert.ok(now.stage===prior.crop.stage||prior.crop.stage==='watered'&&now.stage==='ripe','only ordinary crop maturation is permitted');}
}
function journey(options={}){
 const plan=selectPlan(options),root=sourceRoot(options.root),epoch=sourceEpoch(root),harnessHash=sha(__filename);
 const output=options.output||defaultOutput(root),folder=folderFor(root,output,plan.variant);
 const load=name=>require(path.join(root,'src',name+'.js'));
 // Actual source only. The helper's imported owners must be the identical
 // production modules; never mix a staged/synthetic owner into the simulation.
 const {createHarness,earnedKit}=require(path.join(root,'tests/realm_trails_journey.cjs'));
 const C=load('core'),A=load('adventure'),T=load('combat'),AR=load('arsenal'),W=load('world-foundations'),R=load('realm-trails'),N=load('cosmos');
 assert.strictEqual(global.RealmCore,C);assert.strictEqual(global.RealmAdventure,A);
 const fixture=plan.veteran?path.join(root,'docs/evidence/world-production-2026-10-03/captures/returning-fit-final-01/FINAL_WORLD.json'):null,fixtureHash=fixture?sha(fixture):null;
 const h=createHarness(fixture?JSON.parse(fs.readFileSync(fixture,'utf8')):undefined),campaignEvents=[],fights=[],readings=[],checkpoints=[],checkpointHashes={};
 const zero={positionEdits:0,actorPositionEdits:0,inventoryGrants:0,healthGrants:0,manualDamage:0,plantedDefeats:0,plantedQuestFacts:0,forcedModes:0,forcedCycles:0};
 let stage='initial-kit',H=null,D=null,beforeTick=null;
 const write=(name,value)=>{const file=path.join(folder,name+'.json');fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});return file;};
 const snap=name=>{const file=write(name,h.sim.snapshot());checkpoints.push(name);checkpointHashes[name]=sha(file);};
 const balance=()=>({xp:h.sim.state.adventure.xp,coins:h.sim.state.adventure.coins,ore:h.sim.state.adventure.ore,inventory:copy(h.sim.state.sandbox.inventory)});
 const physical=(a,b,r=.31)=>h.sim.room===N.ROOM?N.segment(a,b,r):W.handles(h.sim.room)?W.segment(h.sim.room,a,b,r):C.segment(a,b,h.sim.navRoom);
 h.walk=function(x,z){
  const sim=h.sim,start={...sim.state.player},result=sim.moveTo(x,z);assert.ok(result.ok,'actual moveTo '+x+','+z+': '+result.error);
  let p=start;for(const q of sim.playerPath){assert.ok(physical(p,q),'complete production path has supported player body');p=q;}
  let frames=0;while(sim.playerPath.length&&frames++<18000){beforeTick?.();const prior={...sim.state.player};sim.tick(.05);assert.ok(physical(prior,sim.state.player),'actual tick remains on whole support');assert.ok(sim.state.adventure.hp>0,'survive actual walking');}
  assert.ok(frames<18000&&distance(sim.state.player,{x,z})<.25,'arrive through actual path');h.routes.push({room:sim.room||'valley',start,x,z,frames});
 };
 const hook=()=>{if(H)h.sim.cosmosCampaignSave=h.save;};
 const act=(type,payload={},io={save:h.save},expect=true)=>{
  const ctx=h.context();hook();const sent={quest:QUEST,expectedActive:ctx.active,expectedRevision:h.sim.state.adventure.revision,...payload},result=H.command(ctx,type,sent,io);
  campaignEvents.push({type,payload:sent,result});assert.equal(result.ok,expect,type+': '+(result.error||result.text));return result;
 };
 const reload=()=>{const prior=copy(h.sim.state.cosmosCampaign);h.reload('cosmos');hook();assert.deepEqual(h.sim.state.cosmosCampaign,prior,'campaign order/account/open/paid survives actual validation/reentry');};
 const step=id=>{const s=D.steps.find(s=>s.id===id);assert.ok(s,'catalogue action '+id);return s;};
 const perform=id=>{const s=step(id);assert.ok(s.kind==='interact'||s.kind==='configure','never record a defeat or choice through step');h.walk(s.x,s.z);return act(s.kind==='configure'?'configure':'step',{step:id,...(s.kind==='configure'?{setting:s.setting}:{})});};
 function finish(status,extra={}){
  const finalHashes=sourceEpoch(root),sourceDrift=JSON.stringify(finalHashes)!==JSON.stringify(epoch)||sha(__filename)!==harnessHash;
  if(fixture)assert.equal(sha(fixture),fixtureHash,'canonical fixture bytes unchanged');
  const report={status:sourceDrift?'source-drift':status,variant:plan.variant,plan,stage,root,sourceHashes:epoch,finalHashes,sourceDrift,harnessSha256:harnessHash,
   source:fixture?{kind:'labelled canonical strongest fixture; historic kit not re-earned in this run',path:fixture,sha256:fixtureHash}:{kind:'fresh character; actual start/crafting/range/socket commands'},
   prerequisite:PRIOR,prerequisiteClaimed:!!h.sim.state.realmTrails.records[PRIOR]?.claimed,method:'actual production moveTo/ticks/target/Brace/weapon/projectile/physical campaign commands; accelerated simulation time and in-memory candidate save holder',
   nativePersistence:false,humanPacing:false,...zero,checkpoints,checkpointHashes,readings,fights,campaignEvents,events:h.events,walks:h.routes,saveCount:h.checkpoints.length,...extra};
  write('COSMOS_CAMPAIGN_JOURNEY_REPORT',report);assert.equal(sourceDrift,false,'source drift: retained report is not qualified; rerun frozen in a new folder');return report;
 }
 function fight(terms,{liveReleases=false}={}){
  const sim=h.sim,e=A.runtime(sim).enemies.find(e=>e.id===terms.id);assert.ok(e&&H.owned(sim,e)&&H.canDamage(sim,e),'actual roster-owned machine spawned');
  const economic={...balance(),defeated:copy(sim.state.adventure.defeated),drops:copy(sim.state.adventure.drops)},style=AR.weapon(sim.state.adventure).style;
  const impacts=[],weapons=[],frames=[],contacts=[],seen=new WeakSet();let guards=0,arrows=false,ticks=0,lastHP=e.hp;
  const start=sim.state.adventure.elapsed,originalCommand=sim.adventureCommand,originalDamage=A.damageEnemy;
  sim.adventureCommand=function(id,type,payload){const hp=e.hp,mode=e.mode,result=originalCommand.call(this,id,type,payload);if(this===sim&&['attack','pulse'].includes(type)&&style==='blade'&&result.ok&&e.hp<hp)weapons.push({caller:'production blade command',type,mode,before:hp,hp:e.hp,at:sim.state.adventure.elapsed-start});return result;};
  A.damageEnemy=function(current,enemy,n,source){const hp=enemy?.hp,mode=enemy?.mode,result=originalDamage.apply(this,arguments);if(current===sim&&enemy===e&&source==='weapon'&&enemy.hp<hp)weapons.push({caller:'production projectile impact',n,mode,before:hp,hp:enemy.hp,at:sim.state.adventure.elapsed-start});return result;};
  function defend(){const a=sim.state.adventure,t=T.runtime(sim),cue=T.threat(sim);assert.ok(a.hp>0,'survive actual '+terms.name);
   if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){h.command('guard');guards++;}
   if(a.hp<45&&a.tonics&&a.elapsed>=A.runtime(sim).cooldowns.heal)h.command('heal');
  }
  function sample(){
   if(e.strike&&e.mode==='windup'&&!seen.has(e.strike)){assert.ok(Object.isFrozen(e.strike));if(e.strike.arms){assert.ok(Object.isFrozen(e.strike.arms));assert.ok(e.strike.arms.every(Object.isFrozen));}seen.add(e.strike);frames.push({at:sim.state.adventure.elapsed-start,frame:copy(e.strike),west:sim.state.cosmosCampaign.steps.includes('release-west-feed'),east:sim.state.cosmosCampaign.steps.includes('release-east-feed')});}
   arrows ||= AR.runtime(sim).arrows.length>0;assert.equal(e.x,terms.x);assert.equal(e.z,terms.z);assert.equal(e.maxHP,terms.hp);assert.equal(e.damage,terms.damage);assert.ok(N.walkable(e.x,e.z,terms.radius));
   if(e.hp<lastHP){impacts.push({at:sim.state.adventure.elapsed-start,mode:e.mode,before:lastHP,hp:e.hp});lastHP=e.hp;}
  }
  function tick(){defend();sample();const locked=e.mode==='windup'?e.strike:null,at=e.contactAt,player={...sim.state.player};h.tick(.05);ticks++;assert.ok(physical(player,sim.state.player));
   if(locked)assert.strictEqual(e.strike,locked,'same actual warning/contact frame');if(e.contactAt!==at)contacts.push({at:e.contactAt-start,hit:e.contactHit,frame:copy(e.strike)});sample();}
  const stand=combatStand(terms,style,liveReleases);
  try{
   // Existing target control selects the actual actor; no pose, cycle or AI
   // phase is set by this observer. All health changes belong to production.
   h.walk(e.x,e.z+stand);h.command('target-select',{id:e.id});assert.strictEqual(T.selected(sim),e);
   beforeTick=()=>{defend();sample();};
   if(liveReleases){
    let pre=0;while(!(frames.some(f=>f.frame.kind==='annulus'&&!f.east)&&frames.some(f=>f.frame.kind==='cross'&&!f.west)&&contacts.length>=2)&&pre++<600)tick();
    assert.ok(pre<600,'actual unreleased annulus/cross/contact observed');
    h.walk(47,-47);h.walk(49,-49);act('configure',{step:'release-west-feed',setting:step('release-west-feed').setting});snap('CHECKPOINT_RELEASE_WEST_LIVE');
    h.walk(54,-48);h.walk(61,-48);h.walk(61,-39);h.walk(59,-39);act('configure',{step:'release-east-feed',setting:step('release-east-feed').setting});snap('CHECKPOINT_RELEASE_EAST_LIVE');
    h.walk(e.x,e.z+stand);let post=0;while(!(frames.some(f=>f.frame.kind==='annulus'&&f.east)&&frames.some(f=>f.frame.kind==='cross'&&f.west))&&post++<600)tick();
    assert.ok(post<600,'actual subsequent released warnings observed');
    const ring=frames.find(f=>f.frame.kind==='annulus'&&f.east).frame,cross=frames.find(f=>f.frame.kind==='cross'&&f.west).frame;
    assert.equal(ring.outerRadius,H.patterns.guardian.ring.afterEastRelease.outerRadius);assert.equal(ring.innerRadius,H.patterns.guardian.ring.innerRadius);assert.equal(cross.arms.length,1);
   }
   if(!T.runtime(sim).auto)h.command('auto-toggle');
   while(!sim.state.cosmosCampaign.steps.includes(terms.defeatStep)&&ticks<4000){tick();if(distance(sim.state.player,e)>AR.weapon(sim.state.adventure).reach-.1&&!sim.playerPath.length)assert.ok(sim.moveTo(e.x,e.z+stand).ok);}
   assert.ok(ticks<4000&&e.hp===0&&sim.state.cosmosCampaign.steps.includes(terms.defeatStep),'actual weapon/contact loop earns zero-HP-owned exhaustion');
   assert.ok(weapons.length>0,'confirmed weapon contribution distinct from Briar');if(style==='bow')assert.ok(arrows&&weapons.some(w=>w.caller==='production projectile impact'),'actual flight then actual collision');
   if(!plan.veteran)assert.ok(impacts.length>1,'ordinary kit requires multiple confirmed hits');
   assert.deepEqual({...balance(),defeated:sim.state.adventure.defeated,drops:sim.state.adventure.drops},economic,'settling grants no independent or legacy fee');
   h.command('target-clear');return{enemy:terms.id,style,seconds:sim.state.adventure.elapsed-start,ticks,guards,arrows,weapons,impacts,frames,contacts,liveReleases,healthAfter:sim.state.adventure.hp};
  }finally{beforeTick=null;sim.adventureCommand=originalCommand;A.damageEnemy=originalDamage;}
 }
 try{
  if(plan.veteran){assert.equal(A.level(h.sim.state.adventure),5);assert.equal(h.sim.state.adventure.equipment.weapon,'dawn_edge');assert.equal(AR.weapon(h.sim.state.adventure).style,'blade');h.walk(W.GATE.x,W.GATE.z);}else earnedKit(h,plan.bow);
  stage='earned-comparator';const comparator=R.definition(PRIOR);assert.ok(comparator);h.enter('cosmos');
  if(!h.sim.state.realmTrails.records[PRIOR].claimed){
   h.walk(comparator.giver.x,comparator.giver.z);h.trail('accept',comparator);
   for(const s of comparator.steps){h.walk(s.x,s.z);if(s.instrument){const adjusted=R.adjust(h.context(),PRIOR,s.id,s.instrument.target);assert.ok(adjusted.ok&&adjusted.aligned);readings.push({station:s.id,setting:adjusted.setting,target:s.instrument.target});}
    h.trail('step',comparator,{step:s.id,...(s.instrument?{setting:R.setting(h.sim,PRIOR,s.id)}:{})});}
   h.walk(comparator.giver.x,comparator.giver.z);const before=balance();h.trail('claim',comparator);for(const k of ['xp','coins','ore'])assert.equal(balance()[k]-before[k],k==='xp'?Math.min(comparator.reward[k],9999-before[k]):comparator.reward[k]);
  }
  assert.equal(h.sim.state.realmTrails.records[PRIOR].claimed,true);h.home();h.walk(0,3);h.command('rest');h.walk(W.GATE.x,W.GATE.z);snap('00_EARNED_SEED');
  write('SEED_PROVENANCE',{variant:plan.variant,seedSha256:checkpointHashes['00_EARNED_SEED'],prerequisite:PRIOR,prerequisiteClaimed:true,fixture,fixtureHash,...zero,sourceHashes:epoch,harnessSha256:harnessHash,completeCampaignJourney:false});
  const baseline=h.sim.snapshot();stage='campaign-owner-load';const file=path.join(root,'src/cosmos-campaign.js');
  if(!fs.existsSync(file))return finish('not-integrated',{campaignComplete:false,negative:{kind:'missing-installed-rule-owner',path:file,attemptedCampaignCommands:0},earnedSeed:path.join(folder,'00_EARNED_SEED.json')});
  H=load('cosmos-campaign');D=H.definition;assert.equal(D.id,QUEST);assert.equal(D.prerequisite,PRIOR);assert.strictEqual(global.RealmCosmosCampaign,H);
  for(const p of plan.supports)assert.ok(H.supports.some(s=>s.id===p.id),'installed support contract');
  h.enter('cosmos');hook();h.walk(D.giver.x,D.giver.z);stage='accept';
  const ctx=h.context(),initial=h.sim.snapshot(),first=H.command(ctx,'accept',{quest:QUEST,expectedActive:ctx.active,expectedRevision:h.sim.state.adventure.revision},{save:h.save});campaignEvents.push({type:'accept',result:first});
  if(!first.ok&&!Object.hasOwn(initial,'cosmosCampaign')){assert.deepEqual(h.sim.snapshot(),initial,'missing integration refuses without mutation');return finish('not-integrated',{campaignComplete:false,negative:{kind:'actual-first-command-refused-by-unintegrated-state-owner',result:first},earnedSeed:path.join(folder,'00_EARNED_SEED.json')});}
  assert.ok(first.ok,first.error);snap('01_ACCEPTED');reload();
  stage='distinct-supplied-or-ordinary-supports';perform('read-local-cost');
  for(const p of plan.supports){const lead=H.supports.find(s=>s.id===p.id);if(p.mode==='ordinary'){perform(lead.inspect);perform(lead.complete);}else perform(lead.assistance);}
  assert.equal(new Set(global.RealmCosmosCampaignData.completedSupports(h.sim.state.cosmosCampaign.steps)).size,plan.supports.length);snap('02_DISTINCT_SUPPORTS');reload();perform('test-service-route');
  stage='actual-optical-reclaimer';perform('challenge-reclaimer');fights.push(fight(D.enemies.find(e=>e.pattern==='reclaimer')));snap('03_ACTUAL_RECLAIMER_SETTLED');reload();assert.ok(!H.enemies(h.sim).some(e=>e.pattern==='reclaimer'));perform('isolate-service-feed');
  stage='actual-still-meridian';perform('challenge-guardian');snap('04_ACTUAL_GUARDIAN_READY');fights.push(fight(D.enemies.find(e=>e.pattern==='guardian'),{liveReleases:!plan.veteran}));snap('05_ACTUAL_GUARDIAN_SETTLED');reload();assert.equal(H.enemies(h.sim).length,0);
  for(const id of ['release-west-feed','release-east-feed'])if(!h.sim.state.cosmosCampaign.steps.includes(id)){perform(id);snap('CHECKPOINT_'+id);}
  stage='physical-disable-accountability';perform('disable-central-link');snap('06_CENTRAL_LINK_DISABLED');reload();h.walk(step('accountability').x,step('accountability').z);act('choose',{choice:plan.choice});
  const chosen=h.sim.snapshot();act('choose',{choice:CHOICES.find(c=>c!==plan.choice)},undefined,false);assert.deepEqual(h.sim.snapshot(),chosen,'saved accountability cannot be overwritten');snap('07_DELIBERATE_ACCOUNT');reload();
  stage='physical-independent-reconfiguration';for(const p of plan.supports)perform(H.supports.find(s=>s.id===p.id).configure);snap('08_INDEPENDENT_SUPPORT_SETTINGS');reload();perform('open-confluence');assert.equal(h.sim.state.cosmosCampaign.opened,true);snap('09_LOCAL_APPARATUS_OPEN');reload();perform('verify-open-bearings');assert.ok(H.ready(h.sim.state));snap('10_VERIFIED_UNPAID');reload();
  stage='whole-fixed-fee-once';h.walk(D.giver.x,D.giver.z);const unpaid=h.sim.snapshot();act('claim',{}, {save:()=>({ok:false,error:'labelled in-memory fee save refusal'})},false);assert.deepEqual(h.sim.snapshot(),unpaid);
  const result=act('claim'),paid=h.sim.snapshot(),xp=Math.min(D.reward.xp,9999-unpaid.adventure.xp);assert.deepEqual(result.reward,{...copy(D.reward),xp});
  assert.equal(paid.adventure.xp-unpaid.adventure.xp,xp);for(const k of ['coins','ore'])assert.equal(paid.adventure[k]-unpaid.adventure[k],D.reward[k]);for(const[k,n]of Object.entries(D.reward.materials))assert.equal(paid.sandbox.inventory[k]-unpaid.sandbox.inventory[k],n);
  for(const k of ['hp','stamina','tonics'])assert.equal(paid.adventure[k],unpaid.adventure[k],'fee never refills '+k);assert.equal(act('claim',{request:'different-request'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);snap('11_PAID_ONCE');reload();h.walk(D.giver.x,D.giver.z);const cold=h.sim.snapshot();assert.equal(act('claim',{request:'cold-retry'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),cold);
  h.home();snap('FINAL_WORLD');h.reload();assert.equal(h.sim.room,null);const final=h.sim.snapshot();preserved(final,baseline);
  assert.equal(final.adventure.xp-baseline.adventure.xp,Math.min(D.reward.xp,9999-baseline.adventure.xp));for(const k of ['coins','ore'])assert.equal(final.adventure[k]-baseline.adventure[k],D.reward[k]);for(const[k,n]of Object.entries(D.reward.materials))assert.equal(final.sandbox.inventory[k]-baseline.sandbox.inventory[k],n);
  assert.equal(final.cosmosCampaign.opened,true);assert.equal(final.cosmosCampaign.claimed,true);assert.equal(final.cosmosCampaign.choice,plan.choice);stage='complete';
  return finish('passed',{campaignComplete:true,canonicalPreservation:true,reward:result.reward,baselineStats:A.stats(baseline.adventure),saveVersions:{world:C.VERSION,adventure:A.VERSION,cosmosCampaign:1}});
 }catch(error){
  write('FAILURE',{status:'failed',variant:plan.variant,stage,error:error.stack,...zero,sourceHashes:epoch,finalHashes:sourceEpoch(root),harnessSha256:harnessHash,checkpoints,checkpointHashes,events:h.events,campaignEvents,walks:h.routes,fights});throw error;
 }
}
function parseCLI(args){
 const out={};for(let i=0;i<args.length;i++){
  const a=args[i];if(a==='--bow')out.bow=true;else if(a==='--veteran')out.veteran=true;
  else if(['--root','--output','--supports','--choice'].includes(a)){assert.ok(args[i+1]&&!args[i+1].startsWith('--'),'value required for '+a);out[a.slice(2)]=args[++i];}
  else throw Error('Unknown Cosmos journey argument '+a);
 }selectPlan(out);return out;
}
if(require.main===module){try{const r=journey(parseCLI(process.argv.slice(2)));console.log(JSON.stringify({status:r.status,variant:r.variant,stage:r.stage,campaignComplete:r.campaignComplete,sourceDrift:r.sourceDrift,checkpointCount:r.checkpoints.length,negative:r.negative}));if(r.status!=='passed')process.exitCode=2;}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={journey,selectPlan,parseCLI,sourceRoot,sourceEpoch,defaultOutput,combatStand,folderFor,preserved};
