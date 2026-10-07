/* Command-earned civic work, actual paths/swimming and prior regional claims.
 * Accelerated simulation ticks and an in-memory saver are not native storage,
 * normal-time footage or human pacing. No positions/gear/HP are injected. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs');
const L=require('../src/local-life.js'),W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js'),A=require('../src/adventure.js');
const T=require('../src/combat.js'),AR=require('../src/arsenal.js');
// These fixed-step regressions retain the exact original four commissions.
// The supplied carrier has separate physical-authority tests and stays fresh here.
const D=require('../src/earth-consignment-data.js');
const OLD_IDS=Object.freeze(['heaven-propagation-bed-v1','hell-refuge-water-v1','atlantis-bellglass-lamp-v1','cosmos-drawing-shelf-v1']);
assert.deepEqual(D.OLD_IDS,OLD_IDS,'canonical legacy membership cannot drift');
assert.deepEqual(L.definitions.map(d=>d.id),[...OLD_IDS,D.ID],'five-job catalogue is exact');
const LEGACY_DEFINITIONS=Object.freeze(OLD_IDS.map(id=>{const d=L.definition(id);assert.ok(d,'missing original commission '+id);return d;}));
const assertFreshConsignment=state=>assert.deepEqual(state.localLife.records[D.ID],D.freshRecord(),'legacy coverage leaves the separate supplied commission fresh');
const ROOT=path.resolve(__dirname,'..'),copy=structuredClone,sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function journey({bow=false,veteran=false,output=null,seedOnly=false}={}){
 const variant=veteran?'returning-strongest':bow?'fresh-bow':'fresh-blade',source=veteran?path.join(ROOT,'docs/evidence/world-production-2026-10-03/captures/returning-fit-final-01/FINAL_WORLD.json'):null;
 const h=createHarness(source?JSON.parse(fs.readFileSync(source,'utf8')):undefined),events=[],claims=[],swims=[];
 if(!veteran)earnedKit(h,bow);else{assert.equal(h.sim.state.adventure.equipment.weapon,'dawn_edge');assert.equal(A.stats(h.sim.state.adventure).attack,51);h.walk(W.GATE.x,W.GATE.z);}
 const loaded=Object.keys(require.cache).filter(p=>p.startsWith(ROOT+path.sep)).sort(),hashes=()=>Object.fromEntries(loaded.map(p=>[path.relative(ROOT,p).split(path.sep).join('/'),sha(p)])),beforeHashes=hashes();
 const snapshot=name=>{if(output){const folder=path.join(output,variant);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,name+'.json'),JSON.stringify(h.sim.snapshot(),null,2)+'\n');}};
 function local(type,d,payload={}){const result=L.command(h.context(),type,{quest:d.id,...payload},{save:h.save});assert.ok(result.ok,type+': '+result.error);events.push({type,quest:d.id,payload,result});return result;}
 function work(d,id){const s=d.steps.find(s=>s.id===id);return local('step',d,{step:id,assembly:s.assembly?.correct});}
 function veteranFight(d){
  let enemy=A.runtime(h.sim).enemies.find(e=>e.id===d.enemy.id);assert.ok(enemy);
  const balances=()=>copy({xp:h.sim.state.adventure.xp,coins:h.sim.state.adventure.coins,ore:h.sim.state.adventure.ore,drops:h.sim.state.adventure.drops,defeated:h.sim.state.adventure.defeated}),before=balances();
  const home={...enemy.home},radius=AR.weapon(h.sim.state.adventure).style==='bow'?4:1.1;
  h.walk(home.x,home.z+12);h.walk(home.x,home.z+radius);h.command('target-select',{id:enemy.id});h.command('auto-toggle');
  let frames=0,impacts=0,hp=enemy.hp;
  while(!h.sim.state.realmTrails.records[d.id].steps.includes(d.enemy.defeatStep)&&frames++<2400){
   const a=h.sim.state.adventure,t=T.runtime(h.sim),cue=T.threat(h.sim);
   assert.ok(a.hp>0,'returning traveler survives');
   if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard)h.command('guard');
   if(Math.hypot(h.sim.state.player.x-enemy.x,h.sim.state.player.z-enemy.z)>=AR.weapon(a).reach-.2&&!h.sim.playerPath.length)assert.ok(h.sim.moveTo(enemy.x,enemy.z+radius).ok);
   h.sim.tick(.05);enemy=A.runtime(h.sim).enemies.find(e=>e.id===d.enemy.id)||enemy;
   if(enemy.hp<hp){impacts++;hp=enemy.hp;if(d.realm==='heaven')assert.equal(enemy.mode,'recover');}
  }
  assert.ok(frames<2400&&enemy.hp===0&&impacts>0,'actual veteran weapon damage earns defeat');
  assert.deepEqual(balances(),before,'no replayed legacy combat payout');assert.equal(R.defeat(h.sim,enemy),true);assert.deepEqual(balances(),before);
  h.command('target-clear');events.push({type:'veteran-prerequisite-combat',quest:d.id,frames,impacts,attack:A.stats(h.sim.state.adventure).attack,enemyMaximum:enemy.maxHp,method:'actual targeting/autoattack/guard; no fresh-kit minimum impact count imposed on stronger equipment'});
 }
 function earnNorth(realm){
  const d=R.definitions().find(d=>d.realm===realm);if(h.sim.state.realmTrails.records[d.id].claimed)return;
  h.enter(realm);h.walk(d.giver.x,d.giver.z);h.trail('accept',d);
  for(const id of d.enemy.spawnAfter){const s=d.steps.find(s=>s.id===id);h.walk(s.x,s.z);h.trail('step',d,{step:id});}
  if(d.enemy.openingBonusStep){const s=d.steps.find(s=>s.id===d.enemy.openingBonusStep);h.walk(s.x,s.z);h.trail('step',d,{step:s.id});}
  if(veteran)veteranFight(d);else h.fight(d);
  if(d.escort){const s=d.steps.find(s=>s.id===d.escort.startStep);h.walk(s.x,s.z);h.trail('step',d,{step:s.id});h.escortWalk(d);}
  else{const s=d.steps.find(s=>s.id==='garden-repair');h.walk(s.x,s.z);h.trail('step',d,{step:s.id});}
  h.walk(d.giver.x,d.giver.z);h.trail('claim',d);h.home();h.walk(W.GATE.x,W.GATE.z);
 }
 /* Legitimate prior work opens the two continuing north commissions. */
 earnNorth('heaven');earnNorth('hell');
 const starting=h.sim.snapshot();assertFreshConsignment(starting);snapshot('00_EARNED_REGIONAL_HISTORY');
 if(seedOnly)return{status:'passed',variant,claims:[],routes:h.routes,saveCount:h.checkpoints.length,swims:[],sourceDrift:JSON.stringify(beforeHashes)!==JSON.stringify(hashes())};
 function swim(target){
  let frames=0;
  for(;frames<2400;frames++){
   const p=h.sim.state.player,y=W.playerHeight(h.sim),dx=target[0]-p.x,dz=target[2]-p.z,dy=target[1]-y,dist=Math.hypot(dx,dz);
   if(dist<.015&&Math.abs(dy)<.015)break;
   const dt=dist>.005?Math.min(.05,dist/2.6):Math.min(.05,Math.abs(dy)/2.6),step=dt*2.6;
   W.swim(h.sim,dist>.005?dx:0,dist>.005?dz:0,step?dy/step:0,dt);
   assert.ok(W.swimClear(W.definition('atlantis').dive,h.sim.state.player.x,W.playerHeight(h.sim),h.sim.state.player.z),'whole body fits the actual gallery');
  }
  assert.ok(frames<2400,'actual swimming reaches '+target);swims.push({target,frames,body:W.divingStatus(h.sim).body});
 }
 for(const d of LEGACY_DEFINITIONS){
  const choice=d.choices[bow||veteran?1:0];h.enter(d.realm);h.walk(d.giver.x,d.giver.z);const old=h.sim.snapshot();
  local('accept',d,{choice:choice.id});snapshot(d.realm+'_01_ACCEPTED');h.reload(d.realm);assert.equal(h.sim.state.localLife.records[d.id].choice,choice.id);
  for(const original of d.steps){
   const s=L.stepSite(d,original,choice.id);
   if(d.realm==='atlantis'&&s.medium==='water'){
    const entry=W.definition('atlantis').points.find(p=>p.id==='tide-steps');h.walk(entry.x,entry.z);assert.ok(W.diveEnter(h.sim).ok);
    swim([8,-.5,-19.5]);swim([8,s.y,-22]);
   }else if(d.realm==='atlantis'&&s.medium==='court'){
    for(const p of[[8,-1.8,-26],[8,-2.7,-29.5],[8,-2.7,-32],[s.x,s.y,s.z]])swim(p);
   }else h.walk(s.x,s.z);
   assert.ok(L.at(h.sim,s),'actual production body reaches '+d.id+':'+s.id);
   const pre=h.sim.snapshot();
   if(s.assembly){const bad=L.command(h.context(),'step',{quest:d.id,step:s.id,assembly:'unsupported'},{save:h.save});assert.equal(bad.ok,false);assert.deepEqual(h.sim.snapshot(),pre);}
   work(d,s.id);assert.deepEqual(h.sim.state.sandbox.inventory,old.sandbox.inventory,'supplied work does not consume or grant ordinary materials');
   snapshot(d.realm+'_WORK_'+s.id);
   if(s.id===d.steps[0].id){h.reload(d.realm);assert.ok(h.sim.state.localLife.records[d.id].steps.includes(s.id),'partial work and supplies survive cold simulation reload');}
  }
  if(h.sim.worldDive){for(const p of[[8,-2.7,-32],[8,-2.7,-29.5],[8,-1.8,-29],[12,-1.8,-29],[12,-1.4,-39.3]])swim(p);assert.ok(W.diveExit(h.sim).ok);}
  const receiver=d.returner||d.giver;h.walk(receiver.x,receiver.z);snapshot(d.realm+'_02_READY_UNPAID');h.reload(d.realm);h.walk(receiver.x,receiver.z);
  const before=h.sim.snapshot(),result=local('claim',d);assert.deepEqual(result.reward,d.reward);
  for(const k of['xp','coins','ore'])assert.equal(h.sim.state.adventure[k]-before.adventure[k],d.reward[k]);
  for(const[k,n]of Object.entries(d.reward.materials||{}))assert.equal(h.sim.state.sandbox.inventory[k]-before.sandbox.inventory[k],n);
  const paid=h.sim.snapshot();assert.equal(local('claim',d,{request:'another'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);snapshot(d.realm+'_03_PAID');
  claims.push({quest:d.id,choice:choice.id,reward:copy(result.reward)});h.reload(d.realm);h.walk(receiver.x,receiver.z);const reloaded=h.sim.snapshot();assert.equal(local('claim',d,{request:'after-cold-reload'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),reloaded);
  h.home();h.walk(W.GATE.x,W.GATE.z);
 }
 const final=h.sim.snapshot();assertFreshConsignment(final);assert.deepEqual(claims.map(c=>c.quest),OLD_IDS,'all four original journeys still claimed');snapshot('FINAL_WORLD');
 for(const k of['realmTrails','journeys','earthExpedition','notes','score','scoreRevision','retreat','visitor','flowers'])assert.deepEqual(final[k],starting[k],k+' preserved');
 for(const k of['owned','equipment','arsenal','companion','realmCraft','earthBinding','starter','pursuit','classPath','road','beacon','crossing','earthStory','earthNotes','earthGathering','defeated','drops','reward'])assert.deepEqual(final.adventure[k],starting.adventure[k],k+' preserved');
 assert.equal(final.adventure.xp-starting.adventure.xp,92);assert.equal(final.adventure.coins-starting.adventure.coins,33);assert.equal(final.adventure.ore-starting.adventure.ore,2);
 for(const [k,n]of Object.entries({wood:4,fiber:5,crystal:1}))assert.equal(final.sandbox.inventory[k]-starting.sandbox.inventory[k],n);
 const report={status:'passed',variant,source:source?{path:path.relative(ROOT,source),sha256:sha(source),label:'command-earned fully fitted returning capture snapshot'}:{label:'fresh command-earned kit and actual prior northern stories'},method:'production movement, combat prerequisites, full-body gallery swimming, local commands and cold simulation reload; accelerated ticks and in-memory durable holder',positionEdits:0,inventoryGrants:0,plantedDefeats:0,manualDamage:0,humanPacing:false,browserPersistence:false,claims,events,routes:h.routes,swims,saveCount:h.checkpoints.length,sourceHashes:beforeHashes,sourceDrift:JSON.stringify(beforeHashes)!==JSON.stringify(hashes()),canonicalPreservation:true,worldVersion:final.version,adventureVersion:final.adventure.version,harnessSha256:sha(__filename),html_sha256:sha(path.join(ROOT,'index.html'))};
 if(output)fs.writeFileSync(path.join(output,variant,'LOCAL_LIFE_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const i=process.argv.indexOf('--output'),output=i>=0?path.resolve(process.argv[i+1]):null;const r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),seedOnly:process.argv.includes('--seed-only'),output});console.log(JSON.stringify({status:r.status,variant:r.variant,claims:r.claims,walkedLegs:r.routes.length,saves:r.saveCount,swimLegs:r.swims.length,sourceDrift:r.sourceDrift},null,2));}
module.exports={journey};
