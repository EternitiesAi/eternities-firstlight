/* Legitimate kit/gear and production walking/commands. Accelerated ticks and an
 * in-memory candidate saver are distinct from native persistence and footage. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs');
const B=require('../src/bridge-community.js'),H=require('../src/home-history.js'),A=require('../src/adventure.js');
const ROOT=path.resolve(__dirname,'..'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function journey({bow=false,veteran=false,choice=bow?'river-lookout':'shelter',output=path.join(ROOT,'evidence10/bridge-community-earned'),seedOnly=false}={}){
 const variant=veteran?'returning-strongest':bow?'fresh-bow':'fresh-blade',folder=path.join(output,variant);fs.mkdirSync(folder,{recursive:true});
 const source=veteran?path.join(ROOT,'docs/evidence/world-production-2026-10-03/captures/returning-fit-final-01/FINAL_WORLD.json'):null;
 const h=createHarness(source?JSON.parse(fs.readFileSync(source,'utf8')):undefined);if(!veteran)earnedKit(h,bow);else h.walk(18,6);
 const sources=Object.keys(require.cache).filter(p=>p.startsWith(ROOT+path.sep)).sort(),hashes=()=>Object.fromEntries(sources.map(p=>[path.relative(ROOT,p).replaceAll('\\','/'),sha(p)])),beforeHashes=hashes(),events=[];
 const snapshot=name=>fs.writeFileSync(path.join(folder,name+'.json'),JSON.stringify(h.sim.snapshot(),null,2)+'\n');snapshot('00_EARNED_SEED');
 if(seedOnly)return{status:'passed',variant,seed:path.join(folder,'00_EARNED_SEED.json'),source};
 const before=h.sim.snapshot();
 const act=(type,payload={})=>{const r=B.command(h.context(),type,payload,{save:h.save});assert.ok(r.ok,type+': '+r.error);events.push({type,payload,result:r});return r;};
 const settlement=()=>{h.walk(0,16);h.walk(14,-34);h.walk(4,-41);h.walk(-6,-68);};
 h.enter('earthlands');settlement();act('accept');snapshot('01_ACCEPTED');h.reload('earthlands');settlement();
 h.walk(14,-34);h.walk(0,16);h.walk(0,96);h.walk(-7,97);act('fittings');snapshot('02_CARRIED');h.reload('earthlands');
 if(choice==='shelter'){settlement();h.walk(-9,-63.5);}else{h.walk(0,16);h.walk(14,-19);h.walk(30,-20);}
 act('fit',{choice,assembly:'matched'});snapshot('03_FITTED');h.reload('earthlands');if(choice==='shelter'){settlement();h.walk(-9,-63.5);}else{h.walk(0,16);h.walk(14,-19);h.walk(30,-20);}assert.deepEqual(h.sim.state.bridgeCommunity.steps,['fittings','fit']);act('inspect');snapshot('04_COMPLETE_UNPAID');h.reload('earthlands');settlement();
 act('claim');snapshot('05_PAID');const paid=h.sim.snapshot();assert.equal(act('claim',{request:'new-request'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);
 assert.equal(paid.adventure.coins-before.adventure.coins,10);assert.equal(paid.adventure.xp,before.adventure.xp);assert.equal(paid.sandbox.inventory.wood-before.sandbox.inventory.wood,2);assert.equal(paid.sandbox.inventory.fiber-before.sandbox.inventory.fiber,4);
 for(const k of['journeys','realmTrails','earthExpedition','localLife','homeHistory','retreat','notes','score','flowers'])assert.deepEqual(paid[k],before[k],k+' retained');
 for(const k of['owned','equipment','arsenal','pursuit','realmCraft','earthBinding','companion','xp','starter','crossing','classPath','defeated','drops'])assert.deepEqual(paid.adventure[k],before.adventure[k],k+' retained');
 h.reload();assert.deepEqual(h.sim.state.bridgeCommunity,paid.bridgeCommunity);h.walk(12,9);let result=H.command(h.context(),'pin',{kind:'memory-crossing',expectedRevision:h.sim.state.homeHistory.revision},{save:h.save});assert.ok(result.ok,result.error);
 result=H.command(h.context(),'craft',{kind:'memory-crossing',expectedRevision:h.sim.state.homeHistory.revision},{save:h.save});assert.ok(result.ok,result.error);snapshot('06_BOARD_MADE');
 h.walk(37,0);assert.ok(h.sim.enter('retreat').ok);const home=structuredClone(h.sim.state.retreat);home.items=home.items.filter(i=>i.slot!=='w');home.items.push({slot:'w',kind:'memory-crossing',rotation:0});
 result=H.command(h.context(),'decorate',{home,expectedRevision:home.revision},{save:h.save});assert.ok(result.ok,result.error);snapshot('07_BOARD_PLACED');assert.ok(h.sim.leave().ok);h.reload();snapshot('FINAL_WORLD');
 const final=h.sim.snapshot();assert.equal(final.bridgeCommunity.claimed,true);assert.equal(final.homeHistory.owned.filter(i=>i==='memory-crossing').length,1);assert.equal(final.retreat.items.filter(i=>i.kind==='memory-crossing').length,1);
 const report={status:'passed',variant,choice,method:'command-earned kit/returning campaign ownership; real bridge/road movement, five durable checkpoints, one fee, explicit home pin/craft/place',events,routes:h.routes,sourceHashes:beforeHashes,sourceDrift:JSON.stringify(beforeHashes)!==JSON.stringify(hashes()),html_sha256:sha(path.join(ROOT,'index.html')),manualPositions:0,inventoryGrants:0,nativePersistence:false,humanPacing:false,attack:A.stats(final.adventure).attack,saveVersions:{world:9,adventure:12,bridgeCommunity:1,homeHistory:1}};
 assert.equal(report.sourceDrift,false);fs.writeFileSync(path.join(folder,'BRIDGE_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const i=process.argv.indexOf('--output'),j=process.argv.indexOf('--choice'),r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),seedOnly:process.argv.includes('--seed-only'),...(i>=0?{output:path.resolve(process.argv[i+1])}:{}),...(j>=0?{choice:process.argv[j+1]}:{})});console.log(JSON.stringify({status:r.status,variant:r.variant,choice:r.choice,walks:r.routes?.length,sourceDrift:r.sourceDrift,seed:r.seed},null,2));}
module.exports={journey};
