/* Installed inherited-character CPU caller; native/ordinary-time qualification is separate. */
'use strict';
/* Legitimate kit, gear, Open Cage rescue and campaign. Accelerated production
 * movement/combat and an in-memory saver are not native-browser or human play. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createHarness,earnedKit}=require(require('./connected_support.cjs').ROOT+'/tests/realm_trails_journey.cjs');
const C=require(require('./connected_support.cjs').sourcePath('core')),A=require(require('./connected_support.cjs').sourcePath('adventure')),T=require(require('./connected_support.cjs').sourcePath('combat')),AR=require(require('./connected_support.cjs').sourcePath('arsenal')),R=require(require('./connected_support.cjs').sourcePath('realm-trails')),H=require(require('./connected_support.cjs').sourcePath('hell-campaign'));
const ROOT=require('./connected_support.cjs').ROOT,sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function returningRescueFight(h,d){
 // A stronger returning character may clear the early Reeve before another
 // tell. Do not change its stats to satisfy the starter-only helper's pacing.
 let e=A.runtime(h.sim).enemies.find(e=>e.id===d.enemy.id);assert.ok(e);h.walk(e.x,e.z+1.1);h.command('target-select',{id:e.id});h.command('auto-toggle');let frames=0,damageSeen=false,last=e.hp;
 while(!h.sim.state.realmTrails.records[d.id].steps.includes(d.enemy.defeatStep)&&frames++<2400){const a=h.sim.state.adventure,t=T.runtime(h.sim),cue=T.threat(h.sim);assert.ok(a.hp>0);if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard)h.command('guard');h.tick(.05);damageSeen ||=e.hp<last;last=e.hp;}
 assert.ok(frames<2400&&e.hp===0&&damageSeen,'returning owned weapon/companion actually resolve early rescue');T.stop(h.sim,true);
}
function journey({bow=false,veteran=false,choice=bow?'divert':veteran?'license':'unbind',output=path.join(ROOT,'evidence10/hell-campaign-earned'),seedOnly=false,inheritedWorld,connectedVariant}={}){
 assert.ok(inheritedWorld&&!veteran&&!seedOnly,'inherited connected input only; no fixture/seed-only fallback');
 const variant=connectedVariant,folder=path.join(output,variant);assert.equal(fs.existsSync(folder),false,'refuse existing connected output');fs.mkdirSync(folder,{recursive:true});
 const source=inheritedWorld;
 const h=require('./connected_support.cjs').createInherited(source,bow);h.walk(18,6);
 const snap=name=>fs.writeFileSync(path.join(folder,name+'.json'),JSON.stringify(h.sim.snapshot(),null,2)+'\n',{flag:'wx'});
 const beforeHashes=Object.fromEntries(fs.readdirSync(path.join(ROOT,'src')).filter(p=>p.endsWith('.js')).map(p=>[p,sha(path.join(ROOT,'src',p))]));
 const rescue=R.definition(H.definition.prerequisite);h.enter('hell');
 if(!h.sim.state.realmTrails.records[rescue.id].claimed){h.walk(rescue.giver.x,rescue.giver.z);h.trail('accept',rescue);for(const id of rescue.enemy.spawnAfter){const s=rescue.steps.find(s=>s.id===id);h.walk(s.x,s.z);h.trail('step',rescue,{step:id});}require('./connected_support.cjs').fight(h,rescue.enemy,()=>h.sim.state.realmTrails.records[rescue.id].steps.includes(rescue.enemy.defeatStep));const invite=rescue.steps.find(s=>s.id===rescue.escort.startStep);h.walk(invite.x,invite.z);h.trail('step',rescue,{step:invite.id});h.escortWalk(rescue);h.walk(rescue.giver.x,rescue.giver.z);h.trail('claim',rescue);}
 h.home();h.walk(0,3);h.command('rest');h.walk(18,6);snap('00_EARNED_SEED');
 if(seedOnly)return{status:'passed',variant,seed:path.join(folder,'00_EARNED_SEED.json'),source};
 const baseline=h.sim.snapshot(),events=[],fights=[];
 const hook=()=>{h.sim.hellCampaignSave=h.save;};
 const act=(type,p={})=>{const ctx=h.context();hook();const result=H.command(ctx,type,{quest:H.definition.id,expectedRevision:h.sim.state.adventure.revision,expectedActive:ctx.active,...p},{save:h.save});assert.ok(result.ok,type+': '+result.error);events.push({type,payload:p,result});return result;};
 const reload=()=>{h.reload('hell');hook();};
 h.enter('hell');hook();h.walk(H.definition.giver.x,H.definition.giver.z);act('accept');snap('01_ACCEPTED');reload();
 for(const id of['witness-record','tovan-account','read-service-writ','west-shunt','east-brace','challenge-veyr']){const s=H.definition.steps.find(s=>s.id===id);h.walk(s.x,s.z);act('step',{step:id});if(id==='read-service-writ'){snap('02_RECORDS');reload();}}
 snap('03_PREPARED');reload();fights.push(require('./connected_support.cjs').fight(h,H.definition.enemy,()=>h.sim.state.hellCampaign.steps.includes('warden-resolved'),{closed:true}));snap('04_WARDEN_RESOLVED');reload();assert.equal(H.enemies(h.sim).length,0);
 for(const id of['stabilize-service-engine','disposition','verify-route']){const s=H.definition.steps.find(s=>s.id===id);h.walk(s.x,s.z);act(id==='disposition'?'choose':'step',id==='disposition'?{choice}:{step:id});snap(id==='disposition'?'05_CHOICE':'CHECKPOINT_'+id);reload();}
 assert.equal(H.ready(h.sim.state),true);snap('06_COMPLETE_UNPAID');h.walk(H.definition.giver.x,H.definition.giver.z);const balances=h.sim.snapshot();act('claim');const paid=h.sim.snapshot();for(const k of['xp','coins','ore'])assert.equal(paid.adventure[k]-balances.adventure[k],Math.min(H.definition.reward[k],9999-balances.adventure[k]),k+' whole exact fee');for(const[k,n]of Object.entries(H.definition.reward.materials))assert.equal(paid.sandbox.inventory[k]-balances.sandbox.inventory[k],n);assert.equal(act('claim',{request:'fresh-request'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);reload();assert.equal(h.sim.state.hellCampaign.choice,choice);assert.equal(h.sim.state.hellCampaign.claimed,true);h.home();snap('FINAL_WORLD');
 const final=h.sim.snapshot();for(const k of['journeys','realmTrails','earthExpedition','bridgeCommunity','localLife','homeHistory','notes','score','retreat','visitor','flowers'])assert.deepEqual(final[k],baseline[k],k+' retained');for(const k of['owned','equipment','arsenal','pursuit','realmCraft','earthBinding','classPath','companion','beacon','crossing','defeated','drops'])assert.deepEqual(final.adventure[k],baseline.adventure[k],k+' retained');
 const hashes=Object.fromEntries(Object.keys(beforeHashes).map(p=>[p,sha(path.join(ROOT,'src',p))]));assert.deepEqual(hashes,beforeHashes,'source frozen throughout earned journey');
 const report={status:'passed',variant,choice,source,method:'inherited continuous character; actual Open Cage rescue/escort and Writ campaign; production movement/combat/actions, accelerated ticks, in-memory saver',positionEdits:0,inventoryGrants:0,manualDamage:0,plantedDefeats:0,nativePersistence:false,humanPacing:false,events,fights,routes:h.routes,sourceHashes:beforeHashes,html_sha256:sha(path.join(ROOT,'index.html')),saveVersions:{world:9,adventure:12,hellCampaign:1}};fs.writeFileSync(path.join(folder,'HELL_CAMPAIGN_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const i=process.argv.indexOf('--output'),j=process.argv.indexOf('--choice');const r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),seedOnly:process.argv.includes('--seed-only'),...(i>=0?{output:path.resolve(process.argv[i+1])}:{}),...(j>=0?{choice:process.argv[j+1]}:{})});console.log(JSON.stringify({status:r.status,variant:r.variant,choice:r.choice,seed:r.seed,fights:r.fights?.length},null,2));}
module.exports={journey};
