/* Real accepted comparator work, finite fitting and source-pinned veteran gear.
 * Production movement/commands use accelerated ticks and an in-memory saver.
 * This is neither native persistence nor human pacing or real-GPU footage. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs');
const R=require('../src/realm-trails.js'),RC=require('../src/realm-craft.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js');
const ROOT=path.resolve(__dirname,'..'),sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function journey({bow=false,veteran=false,output=null}={}){
 const variant=veteran?'veteran':bow?'fresh-bow':'fresh-blade',source=veteran?path.join(ROOT,'evidence10/pursuit/veteran/07_PRACTICE_PERSISTED.json'):null;
 const raw=source?JSON.parse(fs.readFileSync(source,'utf8')):undefined,h=createHarness(raw),sourceHash=source&&sha(source);
 function practice(){h.walk(15,7);h.command('starter-enter');h.walk(-5,11.5);h.command('target-select',{id:'river-practice'});h.command('auto-toggle');h.tick(1.5);const damage=A.runtime(h.sim).training?.lastDamage;assert.ok(damage>0,'confirmed practice hit');h.command('target-clear');h.walk(0,12);h.command('starter-leave');return damage;}
 if(veteran){assert.equal(h.sim.state.adventure.equipment.weapon,'dawn_edge');assert.equal(h.sim.state.adventure.starter.reward.choice,'temper');assert.equal(h.sim.state.adventure.pursuit.fittings.dawn_edge,2);h.walk(18,6);}else earnedKit(h,bow);
 const measuredBefore=veteran?practice():null;if(veteran)h.walk(18,6);
 const d=R.definitions().find(d=>d.realm==='cosmos'),before=h.sim.snapshot(),readings=[];
 const snap=name=>{if(output){fs.mkdirSync(path.join(output,variant),{recursive:true});fs.writeFileSync(path.join(output,variant,name+'.json'),JSON.stringify(h.sim.snapshot(),null,2)+'\n');}};
 snap('00_SOURCE_READY');h.enter('cosmos');h.walk(d.giver.x,d.giver.z);h.trail('accept',d);snap('01_ACCEPTED');h.reload('cosmos');
 for(const s of d.steps){h.walk(s.x,s.z);if(s.instrument){const result=R.adjust(h.context(),d.id,s.id,s.instrument.target);assert.ok(result.ok&&result.aligned);readings.push({station:s.id,setting:result.setting,target:s.instrument.target,relativeAuthoredImage:true});}h.trail('step',d,{step:s.id,...(s.instrument?{setting:R.setting(h.sim,d.id,s.id)}:{})});snap('02_'+s.id);h.reload('cosmos');}
 h.walk(d.giver.x,d.giver.z);const balance=h.sim.snapshot();h.trail('claim',d);for(const k of ['xp','coins','ore'])assert.equal(h.sim.state.adventure[k]-balance.adventure[k],d.reward[k]);
 const paid=h.sim.snapshot();assert.equal(h.trail('claim',d,{request:'changed-request'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);snap('03_PAID');h.home();
 let fitting=null;
 // The returning strongest earned weapon uses a useful fixed fitting, retaining
 // the prior temper, two River fittings and all identity/history. Fresh paths
 // remain honest: one Cosmos fee grants only 2 of its 3 required ore.
 if(veteran){h.walk(11,9);const old=h.sim.snapshot(),weapon=old.adventure.equipment.weapon,stats=A.stats(old.adventure),behavior=AR.weapon(old.adventure);const result=RC.command(h.context(),weapon,{save:h.save});assert.ok(result.ok,result.error);assert.equal(A.stats(h.sim.state.adventure).attack,stats.attack+3);
  for(const k of ['equipment','owned','arsenal','starter','pursuit','classPath','reward','road','beacon','crossing','earthStory','earthNotes','earthGathering','companion'])assert.deepEqual(h.sim.state.adventure[k],old.adventure[k],k);
  assert.deepEqual(AR.weapon(h.sim.state.adventure),behavior);assert.equal(old.adventure.ore-h.sim.state.adventure.ore,3);assert.equal(old.adventure.coins-h.sim.state.adventure.coins,8);fitting={weapon,attackBefore:stats.attack,attackAfter:A.stats(h.sim.state.adventure).attack,behavior,cost:RC.COST};h.reload();snap('04_FITTED_RELOADED');
 }
 if(veteran){const measured=practice();assert.equal(measured,fitting.attackAfter);fitting.measuredPracticeAfter=measured;fitting.measuredPracticeBefore=measuredBefore;assert.equal(measured,measuredBefore+3);snap('05_ACTUAL_PRACTICE_HIT');}
 const final=h.sim.snapshot();for(const k of ['notes','score','scoreRevision','retreat','visitor','journeys'])assert.deepEqual(final[k],before[k]);
 for(const k of ['owned','equipment','arsenal','starter','pursuit','classPath','reward','road','beacon','crossing','earthStory','earthNotes','earthGathering','companion','defeated','drops'])assert.deepEqual(final.adventure[k],before.adventure[k]);
 if(source)assert.equal(sha(source),sourceHash);
 const report={status:'passed',variant,method:'production accepted commands, actual navigation, comparator preview owner and deliberate recorded readings; accelerated ticks and in-memory persistence',humanPacing:false,browserPersistence:false,positionEdits:0,inventoryGrants:0,manualDamage:0,plantedDefeats:0,source:source&&{path:path.relative(ROOT,source),sha256:sourceHash},readings,reward:d.reward,fitting,walkedLegs:h.routes.length,saveCount:h.checkpoints.length,events:h.events,routes:h.routes,canonicalPreservation:true};
 if(output)fs.writeFileSync(path.join(output,variant,'COSMOS_TRAIL_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const i=process.argv.indexOf('--output'),output=i>=0?path.resolve(process.argv[i+1]):null;if(output&&process.platform==='win32')assert.match(output,/^D:[\\/]/i);const r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),output});console.log(JSON.stringify({...r,events:undefined,routes:undefined},null,2));}
module.exports={journey};
