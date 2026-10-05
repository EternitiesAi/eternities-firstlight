'use strict';
/* Harness boundary tests. They do not substitute a rule/actor/combat facade
 * and do not claim complete campaign play before actual source integration. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const file=path.join(__dirname,'cosmos_campaign_journey.cjs'),J=require(file),fixture={adventure:{},sandbox:{placed:[]}};
test('import defines helpers without loading game owners or writing/generating a fixture',()=>{
 const result=cp.spawnSync(process.execPath,['-e',"const fs=require('node:fs');fs.writeFileSync=()=>{throw Error('unexpected import write')};fs.mkdirSync=()=>{throw Error('unexpected import mkdir')};require("+JSON.stringify(file)+");if(global.RealmCore||global.RealmCosmosCampaign)throw Error('unexpected game owner import');"],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
test('defaults cover three real kit families, all three lead pairs and both account choices',()=>{
 const blade=J.selectPlan(),bow=J.selectPlan({bow:true}),veteran=J.selectPlan({veteran:true});
 assert.equal(blade.variant,'fresh-blade');assert.equal(bow.variant,'fresh-bow');assert.equal(veteran.variant,'returning-strongest');
 assert.deepEqual(blade.supports,[{id:'material',mode:'ordinary'},{id:'living',mode:'supplied'}]);
 assert.deepEqual(bow.supports,[{id:'living',mode:'ordinary'},{id:'observation',mode:'supplied'}]);
 assert.deepEqual(veteran.supports,[{id:'material',mode:'supplied'},{id:'observation',mode:'ordinary'}]);
 assert.deepEqual(new Set([blade.choice,bow.choice]),new Set(['public-record','bounded-account']));
});
test('every two/three-support ordinary/supplied selection remains explicit and distinct',()=>{
 const ids=['material','living','observation'],selections=[['material','living'],['material','observation'],['living','observation'],ids];let count=0;
 for(const chosen of selections)for(let mask=0;mask<2**chosen.length;mask++)for(const choice of ['public-record','bounded-account']){
  const text=chosen.map((id,i)=>id+':'+(mask&(1<<i)?'supplied':'ordinary')).join(','),p=J.selectPlan({supports:text,choice});
  assert.equal(p.supports.length,chosen.length);assert.equal(new Set(p.supports.map(s=>s.id)).size,chosen.length);assert.equal(p.choice,choice);count++;
 }assert.equal(count,40);
});
test('invalid, duplicated, hidden or incomplete support choices refuse before execution',()=>{
 for(const supports of ['material:ordinary','material:ordinary,material:supplied','material:auto,living:ordinary','material:ordinary,luna:supplied','material:ordinary,living:ordinary,observation:supplied,material:ordinary'])assert.throws(()=>J.selectPlan({supports}));
 assert.throws(()=>J.selectPlan({choice:'cosmic-amnesty'}));assert.throws(()=>J.selectPlan({bow:true,veteran:true}));
});
test('CLI has exact public options and refuses missing values, seed-only success or unsupported switches',()=>{
 const p=J.parseCLI(['--root','D:/source','--output','D:/receipts','--bow','--supports','material:supplied,observation:ordinary','--choice','bounded-account']);
 assert.equal(p.root,'D:/source');assert.equal(p.bow,true);assert.equal(p.choice,'bounded-account');
 for(const args of [['--root'],['--output','--bow'],['--seed-only'],['--fake-combat'],['--supports','material:ordinary']])assert.throws(()=>J.parseCLI(args));
});
test('portable installed default uses exact canonical JSON scratch; staged default stays local',()=>{
 const root=path.resolve(__dirname,'imaginary-game-root');assert.equal(J.defaultOutput(root,path.join(root,'tests/cosmos_campaign_journey.cjs')),path.join(root,'evidence10/cosmos-campaign-earned'));
 assert.equal(J.defaultOutput(root,file),path.join(__dirname,'outputs'));
});
test('new output is bounded, refuses traversal/overwrite and arbitrary checkout writes',()=>{
 const scratch=fs.mkdtempSync(path.join(__dirname,'unit-output-boundaries-')),fakeRoot=path.join(scratch,'game-root');fs.mkdirSync(fakeRoot);
 assert.throws(()=>J.folderFor(fakeRoot,path.join(fakeRoot,'unsafe-output'),'fresh-blade'),/game-checkout/);
 assert.throws(()=>J.folderFor(fakeRoot,scratch,'../../escape'));
 if(process.platform==='win32')assert.throws(()=>J.folderFor(fakeRoot,'C:/cosmos-output-rejection-probe','fresh-blade'),/D/);
 if(process.platform!=='win32'||/^D:[\\/]/i.test(scratch)){const folder=J.folderFor(fakeRoot,path.join(scratch,'receipts'),'fresh-blade');assert.ok(fs.statSync(folder).isDirectory());assert.throws(()=>J.folderFor(fakeRoot,path.join(scratch,'receipts'),'fresh-blade'),/existing/);}
 const canonical=J.folderFor(fakeRoot,path.join(fakeRoot,'evidence10/cosmos-campaign-earned'),'fresh-bow');assert.ok(fs.statSync(canonical).isDirectory());
});
test('bow stand fits the actual installed road body instead of its unsupported centerline edge',()=>{
 const data=require('../src/cosmos-campaign-data.js'),N=require('../src/cosmos.js'),reclaimer=data.definition.enemies.find(e=>e.pattern==='reclaimer'),guardian=data.definition.enemies.find(e=>e.pattern==='guardian');
 assert.equal(N.walkable(reclaimer.x,reclaimer.z+4,.31),false,'4m lands on the real road edge without whole-body support');
 assert.equal(J.combatStand(reclaimer,'bow'),3.5);assert.ok(N.walkable(reclaimer.x,reclaimer.z+J.combatStand(reclaimer,'bow'),.31));
 assert.ok(N.walkable(guardian.x,guardian.z+J.combatStand(guardian,'bow',true),.31));assert.equal(J.combatStand(guardian,'blade'),1.1);
});
test('history checks detect equipment/socket/class/old-campaign/construction changes without freezing legitimate crop time',()=>{
 const baseline={...fixture,notes:['retained'],hellCampaign:{claimed:true},settings:{cameraMode:'adventure'},adventure:{equipment:{weapon:'dawn_edge'},arsenal:{sockets:{dawn_edge:'amber'}},classPath:{choice:'hunter'}},sandbox:{placed:[{id:7,kind:'bed',gx:4,gz:3,rotation:0,crop:{stage:'watered',plantedAt:10,readyAt:40}}],bridge:true,nextId:8,stats:{crafted:2},milestones:['crop'],recentCommands:['old'],cooldownUntil:2}};
 const final=structuredClone(baseline);final.sandbox.placed[0].crop.stage='ripe';J.preserved(final,baseline);
 for(const mutate of [s=>s.adventure.equipment.weapon='new',s=>s.adventure.arsenal.sockets.dawn_edge=null,s=>s.adventure.classPath.choice=null,s=>s.hellCampaign.claimed=false,s=>s.sandbox.placed[0].gx=9,s=>s.sandbox.placed[0].crop.plantedAt=22]){const bad=structuredClone(final);mutate(bad);assert.throws(()=>J.preserved(bad,baseline));}
});
test('runner source contains no actor/health/progress/cycle injection or direct resolution/attack-frame call',()=>{
 const source=fs.readFileSync(file,'utf8');
 for(const pattern of [/\.state\.player(?:\.[xz])?\s*=(?!=)/,/\b(?:e|enemy)\.(?:hp|x|z|mode|timer|cosmosCycle)\s*=(?!=)/,/\.cosmosCampaign\s*=(?!=)/,/\.steps\.push\(/,/\bH\.(?:defeat|lock)\s*\(/,/staging-cosmos-(?:rules|geometry)/])assert.equal(pattern.test(source),false,'forbidden '+pattern);
 assert.match(source,/originalDamage\.apply\(this,arguments\)/,'read-only observer forwards actual arguments');assert.match(source,/sim\.moveTo\(/);assert.match(source,/h\.command\('guard'\)/);assert.match(source,/N\.segment\(/);
 for(const name of ['positionEdits','actorPositionEdits','inventoryGrants','healthGrants','manualDamage','plantedDefeats','plantedQuestFacts','forcedModes','forcedCycles'])assert.match(source,new RegExp(name+':0'));
});
