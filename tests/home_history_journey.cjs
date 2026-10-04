/* Actual local-work routes, renewable gathering, finite crafting and retreat
 * placement. Accelerated production ticks; in-memory saver, not native proof. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {journey:localLife}=require('./local_life_journey.cjs'),{createHarness}=require('./realm_trails_journey.cjs');
const H=require('../src/home-history.js'),S=require('../src/sandbox.js'),C=require('../src/core.js');
const ROOT=path.resolve(__dirname,'..'),copy=structuredClone,sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function journey({bow=false,veteran=false,output=null,seedOnly=false}={}){
 const variant=veteran?'returning-strongest':bow?'fresh-bow':'fresh-blade',out=output||fs.mkdtempSync(path.join(require('node:os').tmpdir(),'firstlight-home-'));
 const earlier=localLife({bow,veteran,output:path.join(out,'earned-local-work')});assert.equal(earlier.status,'passed');assert.equal(earlier.sourceDrift,false);
 const seed=JSON.parse(fs.readFileSync(path.join(out,'earned-local-work',variant,'FINAL_WORLD.json'),'utf8')),h=createHarness(seed),start=h.sim.snapshot(),events=[];
 const folder=path.join(out,variant);fs.mkdirSync(folder,{recursive:true});const snapshot=name=>fs.writeFileSync(path.join(folder,name+'.json'),JSON.stringify(h.sim.snapshot(),null,2)+'\n');snapshot('00_EARNED_HOME_SEED');
 if(seedOnly)return{status:'passed',variant,seed:path.join(folder,'00_EARNED_HOME_SEED.json'),localClaims:earlier.claims.length};
 const hashes=()=>Object.fromEntries(Object.keys(require.cache).filter(p=>p.startsWith(ROOT+path.sep)).sort().map(p=>[path.relative(ROOT,p).split(path.sep).join('/'),sha(p)])),beforeHashes=hashes();
 function homeCommand(type,payload){const result=H.command(h.context(),type,{expectedRevision:H.layoutAction(type)?h.sim.state.retreat.revision:h.sim.state.homeHistory.revision,...payload},{save:h.save});assert.ok(result.ok,result.error);events.push({type,payload,result});return result;}
 function gather(kind){const node=S.NODES.find(n=>n.kind===kind&&!n.wild);h.walk(node.x,node.z+1.7);let strikes=0,old=h.sim.state.sandbox.inventory[kind];while(h.sim.state.sandbox.inventory[kind]===old&&strikes++<8){const r=h.sim.sandboxCommand('home-gather-'+kind+'-'+strikes,'gather',{node:node.id});assert.ok(r.ok,r.error);for(let i=0;i<10;i++)h.sim.tick(.05);}assert.ok(h.sim.state.sandbox.inventory[kind]>old);events.push({type:'actual-renewable-gather',kind,node:node.id,strikes});}
 const combined={};for(const d of H.definitions.filter(d=>d.source!=='bridgeCommunity'))for(const[k,n]of Object.entries(d.cost))combined[k]=(combined[k]||0)+n;
 for(const[k,n]of Object.entries(combined))while(h.sim.state.sandbox.inventory[k]<n)gather(k);
 h.walk(12,9);
 for(const d of H.definitions.filter(d=>d.source!=='bridgeCommunity')){assert.ok(H.unlocked(h.sim.state,d));homeCommand('pin',{kind:d.id});const before=h.sim.snapshot();homeCommand('craft',{kind:d.id});for(const[k,n]of Object.entries(d.cost))assert.equal(h.sim.state.sandbox.inventory[k],before.sandbox.inventory[k]-n);assert.deepEqual(h.sim.state.adventure,before.adventure);assert.deepEqual(h.sim.state.retreat,before.retreat);const made=h.sim.snapshot();assert.equal(homeCommand('craft',{kind:d.id,request:'another'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),made);snapshot(d.id+'_MADE');h.reload();}
 snapshot('01_FOUR_MADE_UNPLACED');h.walk(37,0);assert.ok(h.sim.enter('retreat').ok);assert.equal(h.sim.room,'retreat');
 for(const[i,d]of H.definitions.filter(d=>d.source!=='bridgeCommunity').entries()){const home=copy(h.sim.state.retreat),slot=['n','sw','se','w'][i];home.items=home.items.filter(i=>i.slot!==slot);home.items.push({slot,kind:d.id,rotation:i});homeCommand('decorate',{home});assert.equal(h.sim.state.retreat.items.filter(i=>i.kind===d.id).length,1);}
 const placed=h.sim.snapshot();homeCommand('layout-undo',{});homeCommand('layout-redo',{});assert.deepEqual(h.sim.state.retreat.items,placed.retreat.items);snapshot('02_FOUR_PLACED');assert.ok(h.sim.leave().ok);h.reload();assert.equal(h.sim.state.homeHistory.owned.length,4);
 /* Normal walking advances the existing adventure clock. Its other fields,
  * including all claims, balances and equipment, remain exact. */
 assert.ok(h.sim.state.adventure.elapsed>start.adventure.elapsed);
 for(const k of Object.keys(start.adventure).filter(k=>k!=='elapsed'))assert.deepEqual(h.sim.state.adventure[k],start.adventure[k],k+' preserved');
 for(const k of Object.keys(start).filter(k=>!['adventure','homeHistory','sandbox','retreat','journal','nextEvent','player','residents','visited','hour','day'].includes(k)))assert.deepEqual(h.sim.state[k],start[k],k+' preserved');
 snapshot('FINAL_WORLD');const afterHashes=hashes(),report={status:'passed',variant,localClaims:earlier.claims,method:'command-earned four local commissions followed by production renewable gathering, walking, home pin/craft/place/undo/redo and cold simulation reconstruction',manualPositions:0,inventoryGrants:0,automaticPlacement:false,nativePersistence:false,humanPacing:false,events,routes:h.routes,saves:h.checkpoints.length,sourceHashes:beforeHashes,sourceDrift:JSON.stringify(beforeHashes)!==JSON.stringify(afterHashes),html_sha256:sha(path.join(ROOT,'index.html')),worldVersion:9,adventureVersion:12,homeHistoryVersion:1};assert.equal(report.sourceDrift,false);fs.writeFileSync(path.join(folder,'HOME_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const i=process.argv.indexOf('--output'),r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),seedOnly:process.argv.includes('--seed-only'),output:i>=0?path.resolve(process.argv[i+1]):null});console.log(JSON.stringify({status:r.status,variant:r.variant,localClaims:r.localClaims?.length??r.localClaims,homeActions:r.events?.length,walks:r.routes?.length,saves:r.saves,sourceDrift:r.sourceDrift},null,2));}
module.exports={journey};
