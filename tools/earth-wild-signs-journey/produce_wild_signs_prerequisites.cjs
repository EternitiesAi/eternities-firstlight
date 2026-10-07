'use strict';
// Command-earned CPU prerequisites only. No native visibility or observation is issued.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),copy=v=>JSON.parse(JSON.stringify(v));
const PRODUCER='tools/earth-wild-signs-journey/produce_wild_signs_prerequisites.cjs';
function produce({root,originalCohort,output,helper}){
 root=path.resolve(root);originalCohort=path.resolve(originalCohort);output=path.resolve(output);
 assert.ok(!fs.existsSync(output),'Use a fresh bounded output directory; no overwrite.');
 const actualProducer=path.join(root,PRODUCER);assert.equal(hash(fs.readFileSync(actualProducer)),hash(fs.readFileSync(__filename)),'Only the installed exact producer can bind current-head outputs.');
 process.env.FIRSTLIGHT_ROOT=root;process.env.WILD_SIGNS_COHORT=originalCohort;process.env.WILD_SIGNS_USE_INSTALLED='1';
 const H=require(helper||path.join(root,'tools/earth-wild-signs-journey/earned_wild_signs.cjs'));
 assert.equal(H.ROOT,root);assert.equal(H.COHORT,originalCohort);
 const head=cp.execFileSync('git',['-c','core.longpaths=true','-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const runtimeSources=Object.fromEntries(fs.readdirSync(path.join(root,'src')).sort().filter(n=>fs.statSync(path.join(root,'src',n)).isFile()).map(n=>['src/'+n,hash(fs.readFileSync(path.join(root,'src',n)))]));
 const html=fs.readFileSync(path.join(root,'index.html'));assert.ok(html.equals(fs.readFileSync(path.join(root,'FIRSTLIGHT_VALLEY.html'))),'Identical checked-in outputs.');
 const original=JSON.parse(fs.readFileSync(originalCohort));assert.equal(original.epoch.head,head);assert.deepEqual(runtimeSources,original.epoch.runtimeSources);
 const producerSha256=hash(fs.readFileSync(actualProducer)),pending=[],variants={};
 for(const variant of ['blade','bow','veteran']){
  const run=H.create(variant,variant==='veteran'?'north':'south');
  const initial=copy(run.source.raw),beforeReceipts=copy(initial.adventure.receipts),facts=H.protectedFacts(initial);
  const earned=run.earnLoad(),world=run.cold(),m=copy(run.metrics);
  assert.deepEqual(world.earthWildSigns,H.D.fresh(),'No new investigation progress is backfilled.');
  assert.deepEqual(H.protectedFacts(world),facts,'All independent canonical records remain.');
  assert.deepEqual(world.adventure.receipts,beforeReceipts,'Prerequisite transport issues no Adventure commands.');
  assert.deepEqual(world.localLife.records[H.CD.ID],{accepted:true,choice:earned.choice,steps:H.CD.required(earned.choice),claimed:true});
  const economy=H.economy(initial);economy.coins+=4;economy.inventory.wood+=2;economy.inventory.fiber+=2;
  assert.deepEqual(H.economy(world),economy,'Exactly the existing fifth-load fee.');
  assert.equal(m.observationFrames,0);assert.equal(m.clearanceCalls,0);assert.equal(m.combatCommands,0);
  assert.equal(m.claims.length,1);assert.equal(m.claims[0].owner,H.CD.ID);assert.ok(m.workerFrames>0&&m.workerDistance>0&&m.coldLoads===1);
  const injections={positionEdits:m.positionEdits,inventoryGrants:m.inventoryGrants,hpEdits:m.hpEdits,manualDamage:0,plantedDefeats:m.plantedDefeats};assert.ok(Object.values(injections).every(n=>n===0));
  const receipt={schema:'wild-signs-native-prerequisites-v1',status:'passed',variant,sourceHead:head,producerSha256,sourceHashes:runtimeSources,
   originalSourceSha256:original.variants[variant].source.sha256,originalJourneySha256:original.variants[variant].journey.sha256,
   originalCohortSha256:hash(fs.readFileSync(originalCohort)),helperSha256:hash(fs.readFileSync(helper||path.join(root,'tools/earth-wild-signs-journey/earned_wild_signs.cjs'))),
   coldSavedEquality:true,canonicalPreservation:true,priorReceiptsPreserved:true,injections,
   load:{choice:earned.choice,arrivalIds:m.arrivalIds,claimed:true,motionFrames:m.workerFrames,physicalDistance:m.workerDistance},metrics:m,
   browserPersistence:false,humanPacing:false,scope:'Installed real Core/LocalLife/Motion/CharacterStore commands and accelerated physical ticks. App owner leases/storage writer are isolated CPU hosts. No WildSigns observation/input/render fixture is called; ordinary native qualification remains separate.'};
  for(const [kind,value]of [['source',world],['journey',receipt]]){const relative=variant+'/'+(kind==='source'?'00_CLAIMED_LOAD_FRESH_SIGNS.json':'WILD_SIGNS_PREREQUISITES.json'),bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');pending.push([relative,bytes]);(variants[variant]??={})[kind]={path:relative,sha256:hash(bytes)};}
 }
 const binding=H.binding();assert.equal(binding.mode,'installed-current-modules');assert.equal(binding.sourceHead,head);assert.equal(binding.sourceHeadAfter,head);assert.equal(binding.inputsUnchanged,true);
 for(const [leaf,sha]of Object.entries(runtimeSources))assert.equal(hash(fs.readFileSync(path.join(root,leaf))),sha,'Source stays fixed during earning.');
 assert.equal(hash(fs.readFileSync(actualProducer)),producerSha256);assert.equal(hash(fs.readFileSync(path.join(root,'index.html'))),hash(html));
 const manifest={schema:'wild-signs-native-cohort-v1',epoch:{mode:'current-command-earned',head,htmlSha256:hash(html),runtimeSources,producer:{path:PRODUCER,sha256:producerSha256}},variants,
  originalCohortSha256:hash(fs.readFileSync(originalCohort)),binding,scope:'Only the existing fifth supplied load was command-earned and explicitly claimed. WildSigns remains fresh. CPU prerequisite records are separate from native input, rendering, persistence and human acceptance.'};
 fs.mkdirSync(output);for(const [relative,bytes]of pending){const file=path.join(output,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes,{flag:'wx'});}
 fs.writeFileSync(path.join(output,'WILD_SIGNS_COHORT.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 return{status:'passed',head,variants:Object.keys(variants),runtimeLeaves:Object.keys(runtimeSources).length,cohortSha256:hash(fs.readFileSync(path.join(output,'WILD_SIGNS_COHORT.json')))};
}
module.exports=Object.freeze({produce,PRODUCER});
if(require.main===module){const a=process.argv.slice(2),at=k=>a.indexOf(k),get=k=>{const i=at(k);assert.ok(i>=0&&a[i+1]&&!a[i+1].startsWith('--'),'Supply '+k);return a[i+1];};assert.equal(a.length,6,'Use exactly --root --original-cohort --output.');console.log(JSON.stringify(produce({root:get('--root'),originalCohort:get('--original-cohort'),output:get('--output')}),null,2));}
