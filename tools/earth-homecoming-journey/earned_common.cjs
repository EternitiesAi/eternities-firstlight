'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const ROOT=fs.realpathSync(process.env.FIRSTLIGHT_ROOT||path.resolve(__dirname,'../..'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),copy=structuredClone,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const ZERO=Object.freeze({positionEdits:0,actorPositionEdits:0,inventoryGrants:0,healthGrants:0,manualDamage:0,plantedDefeats:0,plantedQuestFacts:0,forcedModes:0,forcedCycles:0});
let installed=null;
function installedEpoch(file,expected){assert.ok(file&&expected,'explicit installed epoch and SHA required');file=fs.realpathSync(file);assert.equal(sha(file),expected,'exact new installed epoch manifest');const m=JSON.parse(fs.readFileSync(file));assert.equal(fs.realpathSync(m.root),ROOT);assert.equal(m.scope,'installed Earth source freeze');installed={file,sha256:expected,manifest:m};}
function preflight(){
 assert.ok(installed,'the installed source epoch is required; no overlay or fixture fallback');
 for(const[p,h]of Object.entries(installed.manifest.sourceHashes))assert.equal(sha(path.join(ROOT,p)),h,'frozen installed input '+p);
 return{mode:'installed source, explicit switch from historical d3 overlay base',installedManifest:{path:installed.file,sha256:installed.sha256}};
}
let overlay=null;
function initialize(){preflight();overlay={read:name=>fs.readFileSync(path.join(ROOT,'src',name),'utf8')};load('core');return overlay;}
const load=name=>require(path.join(ROOT,'src',name+'.js'));
function epoch(){
 preflight();const files=Object.keys(installed.manifest.sourceHashes).sort();
 const actual=Object.fromEntries(files.map(p=>[p,sha(path.join(ROOT,p))])),stages={};
 for(const name of fs.readdirSync(__dirname).filter(n=>/\.(cjs|py)$/.test(n)))stages['caller/'+name]=sha(path.join(__dirname,name));
 return{actual,stages,manifests:preflight()};
}
function write(folder,name,value){const p=path.join(folder,name+'.json');fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n',{flag:'wx'});return{path:p,bytes:fs.statSync(p).size,sha256:sha(p)};}
function assertMigrationPreserved(migrated,raw){
 const expected=copy(raw),catalogue=expected.localLife;
 if(!('earthWildSigns' in raw))expected.earthWildSigns={version:1,accepted:false,evidence:[],observed:false,resolution:null,cleared:false,claimed:false};
 const ids=['heaven-propagation-bed-v1','hell-refuge-water-v1','atlantis-bellglass-lamp-v1','cosmos-drawing-shelf-v1'].sort();
 let catalogueMigration=null;
 if(catalogue&&catalogue.version===1&&Object.keys(catalogue).length===2&&Object.hasOwn(catalogue,'version')&&Object.hasOwn(catalogue,'records')&&catalogue.records&&Object.keys(catalogue.records).length===ids.length&&ids.every(id=>Object.hasOwn(catalogue.records,id))){
  catalogue.records['earth-first-load-through-v1']={accepted:false,choice:null,steps:[],claimed:false};
  catalogueMigration='exact-old-four-to-fresh-first-load';
 }
 const old=copy(migrated);delete old.earthHomecoming;
 assert.deepEqual(old,expected,'actual optional defaults preserve EVERY prior field and add only declared literal fresh defaults');
 return catalogueMigration;
}
function migration(file,expected,folder){
 assert.equal(sha(file),expected,'byte-bound real earned checkpoint');const raw=JSON.parse(fs.readFileSync(file)),C=load('core'),H=load('earth-homecoming'),migrated=C.validate(raw);
 assert.deepEqual(migrated.earthHomecoming,H.fresh());const catalogueMigration=assertMigrationPreserved(migrated,raw);assert.equal(sha(file),expected,'original earned input bytes unchanged');
 const world=write(folder,'MIGRATED_WORLD',migrated),receipt={source:{path:file,bytes:fs.statSync(file).size,sha256:expected},output:world,newOwner:copy(migrated.earthHomecoming),localLifeCatalogueMigration:catalogueMigration,earthWildSignsMigration:!('earthWildSigns' in raw)?'missing-to-fresh-earth-wild-signs-v1':null,oldWorldUnchanged:true,method:'actual installed Core.validate; missing empty Earth owner, exact old-four to fresh-fifth catalogue and missing-only literal fresh WildSigns; no historical claims transplanted'};
 write(folder,'MIGRATION_RECEIPT',receipt);return receipt;
}
function preserved(final,before){
 for(const k of['journeys','realmTrails','earthExpedition','hellCampaign','heavenCampaign','atlantisCampaign','cosmosCampaign','bridgeCommunity','localLife','earthWildSigns','homeHistory','notes','score','scoreRevision','retreat','visitor','flowers','settings'])assert.deepEqual(final[k],before[k],k+' retains its original owner');
 for(const k of['owned','equipment','arsenal','starter','pursuit','realmCraft','earthBinding','classPath','companion','beacon','crossing','road','earthStory','earthNotes','earthGathering','defeated','drops','reward','relic','angelSeen'])assert.deepEqual(final.adventure[k],before.adventure[k],k+' unchanged except documented reversible companion command');
 for(const k of['bridge','nextId','stats','milestones','recentCommands','cooldownUntil'])assert.deepEqual(final.sandbox[k],before.sandbox[k]);
 assert.deepEqual(final.sandbox.placed.map(p=>({...p,crop:null})),before.sandbox.placed.map(p=>({...p,crop:null})));for(const prior of before.sandbox.placed)if(prior.crop){const now=final.sandbox.placed.find(p=>p.id===prior.id).crop;assert.equal(now.plantedAt,prior.crop.plantedAt);assert.equal(now.readyAt,prior.crop.readyAt);assert.ok(now.stage===prior.crop.stage||prior.crop.stage==='watered'&&now.stage==='ripe');}
 for(const old of before.journal){const current=final.journal.find(j=>j.seq===old.seq);if(current)assert.deepEqual(current,old);else assert.ok(final.journal.length===200&&old.seq<final.journal[0].seq);}
}
function profile(raw){
 const C=load('core'),CS=load('characters'),values=new Map([[CS.KEY,JSON.stringify({version:1,revision:1,nextId:3,active:'character-2',slots:[{id:'character-1',world:C.fresh()},{id:'character-2',world:raw}]})]]);
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},store=new CS.Store(storage);const state=store.load().state;store.writer=true;return{values,storage,store,state};
}
function productionApp(sim,store){
 // Exact installed application functions are executed in a minimal CPU host. The
 // status-render sink cannot mutate progress; real Core, Store and EH own it.
 // Keep App-created opaque leases in the installed modules' JavaScript realm.
 // A separate VM realm makes their real prototype/ownership checks refuse.
 const app=overlay.read('app.js'),extract=(a,b)=>{const i=app.indexOf('function '+a+'('),j=app.indexOf('function '+b+'(',i);assert.ok(i>=0&&j>i,'exact application function boundaries');return app.slice(i,j);};
 load('engine');
 const scope={sim,characterStore:store,rpg:null,preserveExisting:false,saveState:'loaded',RealmEarthHomecoming:load('earth-homecoming'),RealmEarthGrazerMotion:load('earth-grazer-motion'),RealmEarthGrazerArt:load('earth-grazer-art'),RealmEarthWildSignsData:load('earth-wild-signs-data'),RealmEarthWildSigns:load('earth-wild-signs'),renderStatus:()=>{}};
 const body=extract('earthHomecomingWriter','worldTravel')+'\n'+extract('worldSave','worldCommand')+'\n'+extract('earthHomecomingCommand','hellCampaignCommand');
 Object.assign(scope,vm.compileFunction(body+'\nreturn {earthHomecomingWriter,worldContext,worldSave,earthHomecomingCommand,syncWildSignsOwner,grazerContext,wildSignsContext};',[],{contextExtensions:[scope],filename:path.join(ROOT,'src/app.js')})());
 return{scope,context:()=>scope.worldContext(),command:(type,p)=>scope.earthHomecomingCommand(type,p),save:s=>scope.worldSave(s)};
}
function callerAudit(){
 const files=['earned_common.cjs','earned_earth_homecoming.cjs'],patterns=[/\.state\.player\s*=(?!=)/,/\.hp\s*=(?!=)/,/\.mode\s*=(?!=)/,/\.steps\.(?:push|splice)\(/,/\.inventory\.[\w]+\s*(?:\+?=(?!=)|\+\+)/,/\.claimed\s*=(?!=)/,/\.earthHomecoming\s*=(?!=)/];
 for(const f of files){const text=fs.readFileSync(path.join(__dirname,f),'utf8');for(const p of patterns)assert.equal(p.test(text),false,'no injection caller spelling '+f+' '+p);}
 return{kind:'pinned staged-caller inspection, not independent runtime telemetry',files,...ZERO};
}
module.exports={ROOT,ZERO,sha,copy,dist,installedEpoch,preflight,initialize,load,epoch,write,migration,assertMigrationPreserved,preserved,profile,productionApp,callerAudit};
