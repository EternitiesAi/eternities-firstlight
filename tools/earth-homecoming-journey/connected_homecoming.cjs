'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const P=require('./earned_common.cjs');
const VARIANTS=['blade','bow','strongest'];
function plan(variant='all'){assert.ok(variant==='all'||VARIANTS.includes(variant));return variant==='all'?VARIANTS.slice():[variant];}
function link(p){assert.match(p.sha256,/^[a-f0-9]{64}$/);assert.equal(P.sha(p.path),p.sha256,'exact linked bytes '+p.path);if(p.bytes!==undefined)assert.equal(fs.statSync(p.path).size,p.bytes);return p;}
function inputFor(variant,meta=JSON.parse(fs.readFileSync(path.join(P.ROOT,'tests/fixtures/earth-homecoming-prerequisites/PROVENANCE.json')))){
 const expected={blade:['blade/ALL_TWELVE_PREREQUISITES_EARNED.json','3b8e39f119e5eda83211f036b13f982961a96830d24235a1a86065ee32c99a93'],bow:['bow/ALL_TWELVE_PREREQUISITES_EARNED.json','ea92d097b01b1d9610a25e02300b07a629c257a58d1a57e09e67de27648f657f'],strongest:['strongest/FINAL_WORLD.json','1cc37eafe2f1a10943ee11e8eba6423f3ca51be6f15d359bf9928e0fe5cb53e6']};
 assert.ok(expected[variant],'only declared fixture families');const r=meta.records[variant];assert.ok(r);assert.equal(r.path,'tests/fixtures/earth-homecoming-prerequisites/'+expected[variant][0],'only the declared repository fixture path');assert.equal(r.sha256,expected[variant][1],'byte-bound fixture receipt');
 const input=link({path:path.join(P.ROOT,r.path),sha256:r.sha256});return{input,sourceHashes:r.sourceHashes,provenance:{...r.origin,portableInputScope:meta.scope,originalReportsReplayed:false}};
}
function sourceDelta(old,current){const entries=[];for(const[p,hash]of Object.entries(old)){const now=current.actual[p];if(now!==hash)entries.push({path:p,historicalSha256:hash,currentActualSha256:now||null});}return entries;}
function remainingStrongest(input,base){
 const lineage=[];let current=input;
 const add=(chapter,output,report)=>{const edge={chapter,input:current,output:link({path:output,sha256:P.sha(output)}),report:link({path:report,sha256:P.sha(report)})};lineage.push(edge);current=edge.output;};
 const early=require('./early_realms.cjs').run({input:current.path,bow:false,folder:path.join(base,'missing-earth')});add('actual missing Fenna/Living Road/Coastward',early.final,path.join(base,'missing-earth/EARLY_REALMS_REPORT.json'));
 for(const [name,choice]of[['hell','license'],['heaven','accessible-assist'],['atlantis','limited']]){
  const folder=path.join(base,'missing-'+name),variant='fixture-origin-strongest';const r=require('./connected_'+name+'.cjs').journey({root:P.ROOT,inheritedWorld:current.path,connectedVariant:variant,bow:false,output:folder,choice});assert.equal(r.status,'passed');
  add('actual missing '+name+' prerequisite and new campaign',path.join(folder,variant,'FINAL_WORLD.json'),path.join(folder,variant,name.toUpperCase()+'_CAMPAIGN_JOURNEY_REPORT.json'));
 }
 assert.ok(P.load('earth-homecoming').eligible(JSON.parse(fs.readFileSync(current.path))));return{final:current,lineage};
}
function run({output,variant='all',epochFile,epochSha}={}){
 assert.ok(output);output=path.resolve(output);if(process.platform==='win32')assert.match(output,/^D:[\\/]/i,'heavy journey output stays on D');assert.equal(fs.existsSync(output),false,'refuse every previous output');
 P.installedEpoch(epochFile,epochSha);P.initialize();const frozen=P.epoch(),audit=P.callerAudit(),variants=plan(variant);fs.mkdirSync(output,{recursive:true});const results=[];let current=null;
 try{
  for(const v of variants){current={variant:v,stage:'historical input'};const base=path.join(output,v);fs.mkdirSync(base);const original=inputFor(v),migration=P.migration(original.input.path,original.input.sha256,base);const sourceDeltas=sourceDelta(original.sourceHashes,frozen);assert.ok(sourceDeltas.length,'new source epoch is explicitly different from historical input');
   let input=migration.output,prerequisiteLineage=[];
   if(v==='strongest'){current.stage='earn missing owners';const earned=remainingStrongest(input,base);input=earned.final;prerequisiteLineage=earned.lineage;}
   assert.ok(P.load('earth-homecoming').eligible(JSON.parse(fs.readFileSync(input.path))));current.stage='actual Earth continuation';
   const result=require('./earned_earth_homecoming.cjs').journey({input:input.path,expectedSha:input.sha256,folder:path.join(base,'earth'),variant:v,choice:v==='bow'?'reviewed-custody':'public-watch',prepared:v!=='blade'});
   assert.equal(result.status,'passed');results.push({variant:v,origin:original.provenance,historicalSourceHashes:original.sourceHashes,sourceDeltas,migration,prerequisiteLineage,earthReport:{path:path.join(base,'earth/EARTH_HOMECOMING_JOURNEY_REPORT.json'),sha256:P.sha(path.join(base,'earth/EARTH_HOMECOMING_JOURNEY_REPORT.json'))},final:result.final});assert.deepEqual(P.epoch(),frozen);
  }
  let bytes=0;const count=dir=>{for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())count(p);else bytes+=fs.statSync(p).size;}};count(output);assert.ok(bytes<20*1024*1024,'bounded JSON only');
  const report={status:'passed',scope:'actual installed-owner CPU earned continuation; native/browser/RAF/human qualification remains separate',variants:results.length,results,sourceEpoch:frozen,sourceFrozen:true,callerAudit:audit,...P.ZERO,evidenceBytesBeforeReport:bytes};P.write(output,'CONNECTED_EARTH_HOMECOMING_REPORT',report);return report;
 }catch(error){P.write(output,'FAILURE',{status:'failed',current,error:error.stack,completed:results,initialEpoch:frozen,finalEpoch:P.epoch(),...P.ZERO});throw error;}
}
if(require.main===module){const args=process.argv.slice(2),value=n=>{const i=args.indexOf(n);return i<0?undefined:args[i+1];};try{const r=run({output:value('--output'),variant:value('--variant')||'all',epochFile:value('--installed-epoch'),epochSha:value('--epoch-sha')});console.log(JSON.stringify({status:r.status,variants:r.variants,bytes:r.evidenceBytesBeforeReport}));}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={run,plan,inputFor,sourceDelta,link};
