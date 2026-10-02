/* Read-only application review. Writes only its new heavy PROBES.json receipt.
 * Position/capacity/socket cases below are explicitly synthetic. No browser,
 * native storage, GPU, full suite, personal profile or repository mutation. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT='D:/07-GAMES/Firstlight/authoring/bridge-moment';
const files=['src/realm-trails.js','src/realm-craft.js','src/realm-trails-ui.js','src/realm-trails-art.js','src/realm-trails-cosmos.js','src/realm-trails-north.js','src/realm-trails-south.js','src/adventure.js','src/core.js','src/app.js','src/characters.js','src/rpg-ui.js','src/world-foundations-ui.js','src/world.js','src/traveler-equipment-art.js','src/arsenal.js','build.py','src/shell.html','tests/realm_trails.test.cjs','tests/realm_trails_instrument_rules.test.cjs','tests/realm_trails_north_rules.test.cjs','tests/realm_trails_browser.py','tests/realm_trails_cosmos_browser.py','index.html'];
const hashes=()=>Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex')]));
const report={startedUtc:new Date().toISOString(),method:'Bounded production Node calls with explicitly synthetic position, capacity, socket and DOM-host fixtures; in-memory saves only.',sourceHashesBefore:hashes(),groups:[]};
const C=require(ROOT+'/src/core.js'),A=require(ROOT+'/src/adventure.js'),R=require(ROOT+'/src/realm-trails.js'),RC=require(ROOT+'/src/realm-craft.js'),W=require(ROOT+'/src/world-foundations.js'),Characters=require(ROOT+'/src/characters.js'),S=require(ROOT+'/src/sandbox.js');
const {createHarness,earnedKit}=require(ROOT+'/tests/realm_trails_journey.cjs');
require(ROOT+'/src/realm-trails-ui.js');const Art=require(ROOT+'/src/realm-trails-art.js');
const clone=structuredClone,io={save:()=>({ok:true})};
function group(name,run){try{const evidence=run();report.groups.push({name,status:'passed',evidence});}catch(e){report.groups.push({name,status:'failed',error:e.stack});process.exitCode=1;}}
function setup(realm){const h=createHarness();earnedKit(h,false);h.enter(realm);const d=R.definitions().find(d=>d.realm===realm);h.walk(d.giver.x,d.giver.z);h.trail('accept',d);return{h,d};}
function pose(sim,p){sim.state.player={x:p.x,z:p.z,yaw:0};sim.playerPath=[];if(p.medium==='water'||p.medium==='court')sim.worldDive={y:p.y,hold:true,surface:{x:8,z:-16,yaw:0}};else delete sim.worldDive;}
function act(sim,d,type,payload={},save=io.save){return R.command({sim,active:'synthetic-review-character',revision:0},type,{quest:d.id,...payload},{save});}
function readyEarth(){const u=setup('earthlands');for(const s of u.d.steps){pose(u.h.sim,s);assert.ok(act(u.h.sim,u.d,'step',{step:s.id}).ok);}pose(u.h.sim,{...u.d.giver,medium:'dry'});return u;}

group('accepted Atlantis work is inspected at local, home, cold-home and other-realm locations',()=>{
 const {h,d}=setup('atlantis'),host={get sim(){return h.sim;},dialog:{addEventListener(){}},worlds:{local(){return false;}}},ui=new global.RealmTrailsUI.TrailsUI(host),observations=[];
 function inspect(label){try{const html=ui.page('atlantis');observations.push({label,room:h.sim.room,threw:false,htmlBytes:Buffer.byteLength(html)});}catch(e){observations.push({label,room:h.sim.room,threw:true,error:e.message,stack:e.stack.split('\n').slice(0,4)});}}
 inspect('local accepted');h.home();inspect('free home after acceptance');h.reload();inspect('cold home with unpaid acceptance');h.enter('earthlands');inspect('inspect Atlantis from Coastward');
 assert.equal(observations[0].threw,false);return{fixture:'Kit, invitation, travel, giver acceptance and free home are production commands; UI host is a minimal non-rendering stub.',observations,defectReproduced:observations.some(v=>v.threw),quest:d.id};
});

group('published adventure-10 worlds migrate without kit, fee or XP changes and source mutation',()=>{
 const h=createHarness();earnedKit(h,false);const evidence=[];
 for(const xp of[0,29,30,79,80,149,150,259,260,9999]){
  const raw=h.sim.snapshot();raw.adventure.version=10;delete raw.adventure.realmCraft;delete raw.realmTrails;raw.adventure.xp=xp;const before=clone(raw),out=C.validate(raw);
  assert.deepEqual(raw,before);assert.deepEqual(out.realmTrails,R.fresh());assert.deepEqual(out.adventure.realmCraft,RC.fresh());
  const old=clone(before.adventure),now=clone(out.adventure);delete old.version;delete now.version;delete now.realmCraft;assert.deepEqual(now,old);
  evidence.push({xp,level:A.level(out.adventure)});
 }
 return{fixture:'Only published schema and XP boundary values are synthetic; kit is command earned.',boundaries:evidence,trailRecords:Object.keys(R.fresh().records).length};
});

group('southern depth, court choice and body medium reject false completion without payment',()=>{
 const {h,d}=setup('atlantis'),sim=h.sim,gauge=d.steps[0],chart=d.steps.find(s=>s.correctChoice),checks=[];
 pose(sim,{...gauge,medium:'dry'});let before=clone(sim.state);assert.equal(act(sim,d,'step',{step:gauge.id}).ok,false);assert.deepEqual(sim.state,before);checks.push('dry deck cannot record submerged gauge');
 pose(sim,{...gauge,y:gauge.y+.5});before=clone(sim.state);assert.equal(act(sim,d,'step',{step:gauge.id}).ok,false);assert.deepEqual(sim.state,before);checks.push('wrong foot depth refused');
 for(const s of d.steps.slice(0,2)){pose(sim,s);assert.ok(act(sim,d,'step',{step:s.id}).ok);}
 pose(sim,chart);assert.equal(W.medium(sim,[sim.state.player.x,sim.worldDive.y+.85,sim.state.player.z]),'air');before=clone(sim.state);
 assert.equal(act(sim,d,'step',{step:chart.id,choice:'one-flat-line'}).ok,false);assert.deepEqual(sim.state,before);checks.push('wrong court chart leaves history and balances unchanged');
 assert.ok(act(sim,d,'step',{step:chart.id,choice:chart.correctChoice}).ok);checks.push('correct court chart records without early reward');
 assert.equal(sim.state.adventure.xp,0);assert.equal(sim.state.realmTrails.records[d.id].claimed,false);
 return{fixture:'XYZ/depth placement is synthetic; medium, collision, choice, prerequisite and persistence rules are production.',checks};
});

group('complete material claim is capacity and save atomic with live owner identity retained',()=>{
 const {h,d}=readyEarth(),sim=h.sim,before=clone(sim.state),adv=sim.state.adventure,sandbox=sim.state.sandbox;
 sim.state.sandbox.inventory.wood=S.MAX;let saturated=clone(sim.state);assert.equal(act(sim,d,'claim').ok,false);assert.deepEqual(sim.state,saturated);sim.state.sandbox.inventory=clone(before.sandbox.inventory);
 for(const saver of[()=>({ok:false,error:'synthetic quota refusal'}),()=>{throw Error('synthetic quota throw');}]){const prior=clone(sim.state);assert.equal(act(sim,d,'claim',{},saver).ok,false);assert.deepEqual(sim.state,prior);}
 let persisted;assert.ok(act(sim,d,'claim',{},candidate=>{assert.deepEqual(sim.state,before);assert.equal(candidate.realmTrails.records[d.id].claimed,true);persisted=clone(candidate);return{ok:true};}).ok);
 assert.strictEqual(sim.state.adventure,adv);assert.strictEqual(sim.state.sandbox,sandbox);assert.deepEqual(sim.state.realmTrails,persisted.realmTrails);
 for(const[k,n]of Object.entries(d.reward.materials))assert.equal(sim.state.sandbox.inventory[k]-before.sandbox.inventory[k],n);
 const paid=clone(sim.state);assert.equal(act(sim,d,'claim').duplicate,true);assert.deepEqual(sim.state,paid);
 return{fixture:'Supply/giver placements and full-pouch boundary are synthetic; accepted actions, claim and refusal handling are actual commands.',reward:d.reward,saveBeforeLiveAdoption:true,ownerIdentityPreserved:true,duplicateInert:true};
});

group('Cosmos numeric settings are physical transient previews with strict committed calibration',()=>{
 const {h,d}=setup('cosmos'),s=d.steps[0];h.walk(s.x,s.z);const before=h.sim.snapshot();
 for(const value of[NaN,Infinity,-Infinity,-.1,90.1,'64',null])assert.equal(R.adjust(h.context(),d.id,s.id,value).ok,false);
 assert.equal(act(h.sim,d,'step',{step:s.id,setting:s.instrument.target}).ok,false);
 assert.ok(R.adjust(h.context(),d.id,s.id,s.instrument.target).ok);assert.deepEqual(h.sim.snapshot(),before);
 assert.equal(act(h.sim,d,'step',{step:s.id,setting:s.instrument.target},()=>({ok:false,error:'synthetic quota'})).ok,false);assert.deepEqual(h.sim.snapshot(),before);
 assert.ok(act(h.sim,d,'step',{step:s.id,setting:s.instrument.target}).ok);const record=clone(h.sim.state.realmTrails.records[d.id]);h.reload('cosmos');assert.deepEqual(h.sim.state.realmTrails.records[d.id],record);
 const bad=h.sim.snapshot();bad.realmTrails.records[d.id].settings[s.id]=91;assert.throws(()=>C.validate(bad),/realm trails/);
 return{fixture:'Comparator approach uses production pathfinding/movement; malformed numeric values/save refusal are synthetic.',acceptedSetting:record.settings[s.id],invalidValuesRefused:7,explicitTurnRequired:true,refusedSaveRetryable:true,reloadRetainsAcceptedSetting:true};
});

group('one finite fitting preserves actual crafted bow and labelled prior socket without auto-equip',()=>{
 const {h,d}=readyEarth(),sim=h.sim;assert.ok(act(sim,d,'claim').ok);h.home();h.walk(11,9);h.command('arsenal-craft',{id:'trail_bow'});
 sim.state.adventure.arsenal.gems.amber=1;h.command('socket',{weapon:'trail_bow',gem:'amber'});sim.state.adventure.ore=3;sim.state.adventure.coins=8;C.validate(sim.snapshot());
 const before=clone(sim.state),blade=sim.state.adventure.equipment.weapon;assert.equal(blade,'trail_blade');
 assert.ok(RC.command(h.context(),'trail_bow',{save:h.save}).ok);assert.equal(sim.state.adventure.equipment.weapon,blade);
 for(const k of['owned','equipment','arsenal','starter','pursuit'])assert.deepEqual(sim.state.adventure[k],before.adventure[k]);
 assert.equal(sim.state.adventure.ore,0);assert.equal(sim.state.adventure.coins,0);assert.equal(sim.state.adventure.realmCraft.weapon,'trail_bow');
 const fitted=clone(sim.state);assert.equal(RC.command(h.context(),'trail_blade',{save:h.save}).ok,false);assert.deepEqual(sim.state,fitted);
 const equip=clone(before.adventure),after=clone(sim.state.adventure);equip.equipment.weapon='trail_bow';after.equipment.weapon='trail_bow';assert.equal(A.stats(after).attack-A.stats(equip).attack,3);
 return{fixture:'Material claim and bow craft are production commands; amber entitlement and exact cost balance are synthetic returning-state inputs.',cost:{ore:3,coins:8},selectedWeapon:'trail_bow',equippedWeaponRetained:blade,attackDifference:3,socketRetained:'amber',secondFittingRefused:true};
});

group('in-memory character library keeps earned and fresh world records separate',()=>{
 const {h,d}=readyEarth();assert.ok(act(h.sim,d,'claim').ok);h.home();const earned=h.sim.snapshot(),data=new Map([[C.KEY,JSON.stringify(earned)]]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},store=new Characters.Store(storage);store.load();store.writer=true;
 const visitor=clone(earned.visitor);visitor.name='Review second character';let result=store.command('create',{visitor},earned,store.revision);assert.ok(result.ok);assert.equal(Object.values(result.state.realmTrails.records).some(r=>r.accepted||r.claimed),false);
 result=store.command('switch',{id:'character-1'},result.state,store.revision);assert.ok(result.ok);assert.deepEqual(result.state.realmTrails,earned.realmTrails);assert.deepEqual(result.state.adventure,earned.adventure);assert.deepEqual(result.state.sandbox,earned.sandbox);
 return{fixture:'In-memory Store and synthetic second-character name; no native lock or personal save.',paidRecordsRetained:true,newCharacterEmpty:true,returnedEquipmentAndMaterialsRetained:true};
});

group('actual Cosmos work art follows transient dial changes without authoring state or ground',()=>{
 const {h,d}=setup('cosmos'),s=d.steps[0];h.walk(s.x,s.z);const before=clone(h.sim.state),captures=[];
 for(const value of[30,60]){assert.ok(R.adjust(h.context(),d.id,s.id,value).ok);const out={box:[],disc:[],octa:[]};Art.draw(out,h.sim,0,{person(){throw Error('unexpected duplicate Cosmos person');}});const arms=out.box.filter(p=>p.trailPart==='comparator-arm');assert.equal(arms.length,2);assert.equal(arms[0].setting,value);assert.ok(Object.values(out).flat().every(p=>p.cameraSolid===false&&p.cutaway===false));captures.push({setting:value,westArmYaw:arms[0].r[1],parts:Object.values(out).flat().length});}
 assert.notEqual(captures[0].westArmYaw,captures[1].westArmYaw);assert.deepEqual(h.sim.state,before);
 return{fixture:'CPU art inventory, no rendered visibility or engine camera proof.',captures,noDuplicatePeople:true,noGroundOrCollisionAuthority:true};
});

report.sourceHashesAfter=hashes();report.sourceChangedDuringProbes=files.filter(file=>report.sourceHashesBefore[file]!==report.sourceHashesAfter[file]);report.finishedUtc=new Date().toISOString();
report.probeGroups=report.groups.length;report.failedGroups=report.groups.filter(v=>v.status!=='passed').length;
report.conclusion=report.groups[0].evidence?.defectReproduced?'An off-realm Atlantis journal exception is recorded as a finding, not hidden by the probe-group pass count. Other bounded probes do not certify the whole runtime.':'The current off-realm Atlantis page no longer throws in the bounded stub. The original exception and its prior source identity remain separately recorded; these probes do not certify the whole runtime.';
fs.writeFileSync(path.join(__dirname,'PROBES.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({groups:report.probeGroups,failedGroups:report.failedGroups,sourceChangedDuringProbes:report.sourceChangedDuringProbes,findings:report.groups[0].evidence,report:path.join(__dirname,'PROBES.json')},null,2));
