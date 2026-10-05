'use strict';
/* One fresh character continues through the existing authored draft. CPU only. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const args=process.argv.slice(2),value=n=>{const i=args.indexOf(n);return i<0?null:args[i+1];};
for(let i=0;i<args.length;i+=2){assert.ok(['--root','--output'].includes(args[i]),'known whole-draft argument');assert.ok(args[i+1]&&!args[i+1].startsWith('--'),'explicit argument value');}
const ROOT=fs.realpathSync(value('--root')||process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
process.env.FIRSTLIGHT_ROOT=ROOT;
const output=path.resolve(value('--output')||path.join(ROOT,'evidence10/whole-draft-earned'));
if(process.platform==='win32')assert.match(output,/^D:[\\/]/i);
assert.equal(fs.existsSync(output),false,'preserve all earlier attempts');
const selected=['blade','blade-to-bow'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=[],walk=(dir,prefix)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+'/'+e.name,p=path.join(dir,e.name);if(e.isDirectory())walk(p,rel);else files.push(rel);}};
walk(path.join(ROOT,'src'),'src');walk(path.join(ROOT,'tools/earth-homecoming-journey'),'tools/earth-homecoming-journey');
files.push('build.py','index.html','FIRSTLIGHT_VALLEY.html','tools/earth_homecoming_journey.cjs','tests/earth_homecoming_earned.test.cjs',
    'tools/whole_draft_readback.cjs','tests/whole_draft_earned.test.cjs',
    'tests/chapter_journey.cjs','tests/road_journey.cjs','tests/beacon_journey.cjs','tests/crossing_journey.cjs',
    'tests/realm_trails_journey.cjs','tests/realm_trails_cosmos_journey.cjs','tests/hell_campaign_journey.cjs',
    'tests/heaven_campaign_journey.cjs','tests/atlantis_campaign_journey.cjs','tests/cosmos_campaign_journey.cjs',
    'tests/earth_story_journey.cjs','tests/earth_expedition_journey.cjs','tests/world_foundations_journey.cjs');
const sourceHashes=Object.fromEntries([...new Set(files)].sort().map(p=>[p,sha(path.join(ROOT,p))]));
sourceHashes['tools/whole_draft_journey.cjs']=sha(__filename);
const callers={'tools/whole_draft_journey.cjs':sha(__filename),'tools/earth-homecoming-journey/connected_cosmos.cjs':sha(path.join(ROOT,'tools/earth-homecoming-journey/connected_cosmos.cjs'))};
const epochFile=output+'.SOURCE_EPOCH.json';assert.equal(fs.existsSync(epochFile),false);fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(epochFile,JSON.stringify({scope:'installed Earth source freeze',root:ROOT,sourceHashes,freshDraftInputs:true},null,2)+'\n',{flag:'wx'});
const P=require(path.join(ROOT,'tools/earth-homecoming-journey/earned_common.cjs'));
P.installedEpoch(epochFile,sha(epochFile));P.initialize();const epoch=P.epoch();
const sourceFrozen=()=>{assert.deepEqual(P.epoch(),epoch);for(const[p,h]of Object.entries(callers))assert.equal(sha(path.join(ROOT,p)),h);};
const link=p=>({path:p,bytes:fs.statSync(p).size,sha256:sha(p)}),read=p=>JSON.parse(fs.readFileSync(p));
fs.mkdirSync(output);const results=[];let current=null;
try{
 for(const variant of selected){
  const bow=variant==='blade-to-bow',base=path.join(output,variant);fs.mkdirSync(base);const edges=[];
  const stage=(name,input,final,report)=>{if(input)assert.deepEqual(read(input),read(edges.at(-1).output.path),'each full world continues from the previous exact result');
   edges.push({chapter:name,input:input?link(input):null,output:link(final),report:link(report)});sourceFrozen();console.log(JSON.stringify({variant,chapter:name,status:'passed',outputSha256:sha(final)}));return final;};
  current={variant,chapter:'original-I'};
  const first=path.join(base,'original-I');require(path.join(ROOT,'tests/chapter_journey.cjs')).journey({out:first,reward:'warden_stone'});
  let input=stage('original-I',null,path.join(first,'CHAPTER_COMPLETED.json'),path.join(first,'CHAPTER_JOURNEY_REPORT.json'));
  current.chapter='original-II';const road=path.join(base,'original-II');require(path.join(ROOT,'tests/road_journey.cjs')).journey({out:road,start:read(input)});
  input=stage('original-II',input,path.join(road,'CHAPTER_II_COMPLETE_EARNED.json'),path.join(road,'ROAD_JOURNEY_REPORT.json'));
  current.chapter='original-III';const beacon=path.join(base,'original-III');require(path.join(ROOT,'tests/beacon_journey.cjs')).journey({out:beacon,source:input});
  input=stage('original-III',input,path.join(beacon,'CHAPTER_III_COMPLETE_EARNED.json'),path.join(beacon,'BEACON_JOURNEY.json'));
  current.chapter='original-IV';const crossing=path.join(base,'original-IV');require(path.join(ROOT,'tests/crossing_journey.cjs')).journey({out:crossing,source:input,bow});
  input=stage('original-IV',input,path.join(crossing,'HOME_AFTER_BELL_EARNED.json'),path.join(crossing,'CROSSING_JOURNEY.json'));
  current.chapter='local-Earth';const early=path.join(base,'local-Earth');const er=require(path.join(ROOT,'tools/earth-homecoming-journey/early_realms.cjs')).run({input,bow,folder:early});
  input=stage('local-Earth',input,er.final,path.join(early,'EARLY_REALMS_REPORT.json'));
  for(const realm of ['hell','heaven','atlantis','cosmos']){
   current.chapter=realm;const out=path.join(base,realm),family='connected-'+variant;
   const caller=realm==='cosmos'?path.join(ROOT,'tools/earth-homecoming-journey/connected_cosmos.cjs'):path.join(ROOT,'tools/earth-homecoming-journey/connected_'+realm+'.cjs');
   const r=require(caller).journey({root:ROOT,inheritedWorld:input,connectedVariant:family,bow,output:out});assert.equal(r.status,'passed');
   input=stage(realm,input,path.join(out,family,'FINAL_WORLD.json'),path.join(out,family,realm.toUpperCase()+'_CAMPAIGN_JOURNEY_REPORT.json'));
  }
  current.chapter='Earth-homecoming';const world=read(input),H=P.load('earth-homecoming');assert.deepEqual(H.missing(world),[],'all twelve preceding claims belong to this fresh continuous character');
  assert.deepEqual(world.earthHomecoming,H.fresh(),'the final arc was not silently accepted');
  const before=link(input),r=require(path.join(ROOT,'tools/earth-homecoming-journey/earned_earth_homecoming.cjs')).journey({input,expectedSha:before.sha256,folder:path.join(base,'Earth-homecoming'),variant:bow?'bow':'blade',choice:bow?'reviewed-custody':'public-watch',prepared:bow});
  assert.equal(r.status,'passed');input=stage('Earth-homecoming',input,r.final.path,path.join(base,'Earth-homecoming/EARTH_HOMECOMING_JOURNEY_REPORT.json'));
  const final=read(input);assert.equal(final.earthHomecoming.claimed,true);assert.equal(final.earthHomecoming.choice,bow?'reviewed-custody':'public-watch');assert.equal(final.earthHomecoming.steps.includes('home-return'),true);
  assert.equal(P.load('arsenal').weapon(final.adventure).style,bow?'bow':'blade');assert.deepEqual(H.missing(final),[]);
  results.push({variant,status:'passed',chapters:edges,final:link(input),finalStats:P.load('adventure').stats(final.adventure),finalWeapon:final.adventure.equipment.weapon,all12PrerequisitesEarned:true,
   note:bow?'This fresh character uses a blade in I–III and explicitly crafts/equips a bow before IV, then keeps that bow through all later arcs. No fresh-bow-I or strongest-fresh claim.':'One fresh blade character earns all original chapters and subsequent realm arcs, then comes home.',
   historicalFixtureInputs:0,...P.ZERO});
 }
 sourceFrozen();let bytes=0,count=0;const tally=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())tally(p);else{bytes+=fs.statSync(p).size;count++;}}};tally(output);assert.ok(bytes<40*1024*1024,'bounded two-character JSON evidence');
 const report={status:'passed',scope:'Current-source fresh beginning-to-provisional-Earth-ending CPU journey; ordinary UI/native persistence/human play remain separately qualified.',root:ROOT,sourceEpoch:epoch,callerHashes:callers,sourceFrozen:true,results,filesBeforeReport:count,bytesBeforeReport:bytes,
  historicalFixtureInputs:0,acceleratedTicks:true,inMemorySaves:true,browserExecuted:false,nativePersistence:false,normalRAF:false,humanPacing:false,...P.ZERO};
 const reportFile=path.join(output,'WHOLE_DRAFT_JOURNEY_REPORT.json');fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 const cp=require('node:child_process'),result=cp.spawnSync(process.execPath,['--test','--test-reporter=tap',path.join(ROOT,'tests/whole_draft_earned.test.cjs')],{cwd:ROOT,env:{...process.env,WHOLE_DRAFT_REPORT:reportFile},encoding:'utf8'});process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');assert.equal(result.status,0,'explicit whole-draft readback passes');
 console.log(JSON.stringify({status:'passed',variants:results.length,bytesBeforeReport:bytes,output}));
}catch(error){fs.writeFileSync(path.join(output,'FAILURE.json'),JSON.stringify({status:'failed',current,error:error.stack,results,sourceEpoch:epoch,callerHashes:callers,...P.ZERO},null,2)+'\n',{flag:'wx'});throw error;}
