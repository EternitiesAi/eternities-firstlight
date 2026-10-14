/* Fresh command-earned commission. Accelerated accepted ticks, not human pacing.
 * No position/state/equipment grants. Explicit temporary in-memory durable store. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),E=require('../src/earth.js'),A=require('../src/adventure.js'),M=require('../src/earth-masterwork.js'),B=require('../src/sandbox.js'),T=require('../src/combat.js');
function run({bow=false,veteran=false,source,output}={}){
 const out=path.resolve(output||process.env.FIRSTLIGHT_MASTERWORK_OUTPUT||'evidence10/masterwork-journey',veteran?'veteran':bow?'bow':'blade');fs.mkdirSync(out,{recursive:true});
 const sourceFile=veteran?path.resolve(source||path.join(__dirname,'../evidence10/veteran-source/CHAPTER_IV_COMPLETE_EARNED.json')):null,sourceBytes=sourceFile?fs.readFileSync(sourceFile):null;
 let sim=new C.Simulation(sourceBytes?JSON.parse(sourceBytes):undefined),serial=0,stored=null,actions=[];const variant=veteran?'veteran-private':bow?'bow-public':'blade-private';
 if(veteran){assert.ok(sim.state.adventure.crossing.complete);assert.ok(sim.state.adventure.reward);assert.equal(sim.state.adventure.earthMasterwork.accepted,false);}
 const save=candidate=>{stored=JSON.stringify(C.validate(candidate));return{ok:true};};
 const command=(type,p={})=>{const r=sim.adventureCommand('masterwork-earned-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);actions.push({type,p});return r;};
 const walk=p=>{const r=sim.moveTo(p.x,p.z);assert.ok(r.ok,r.error);let ticks=0;while(sim.playerPath.length&&ticks++<12000)sim.tick(.05);assert.ok(Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<.3,'walk '+JSON.stringify(p));actions.push({walk:[p.x,p.z],room:sim.room,ticks});};
 const quest=(type,more={})=>{const r=M.command({sim,active:'earned-'+variant,current:()=>true},type,{quest:M.definition.id,expectedActive:'earned-'+variant,expectedRevision:sim.state.adventure.revision,...more},{save});assert.ok(r.ok,type+': '+r.error);actions.push({quest:type,...more});return r;};
 const snapshot=name=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(sim.snapshot(),null,2)+'\n');
 const reload=()=>{assert.ok(stored);const old=C.validate(JSON.parse(stored));sim=new C.Simulation(old);assert.deepEqual(sim.snapshot(),old);actions.push({coldReload:true});};
 const gather=id=>{const n=B.NODES.find(n=>n.id===id);walk({x:n.x+1.1,z:n.z});while(sim.state.sandbox.nodes.find(n=>n.id===id).hp){const r=sim.sandboxCommand('masterwork-gather-'+(++serial),'gather',{node:id});assert.ok(r.ok,r.error);for(let i=0;i<21;i++)sim.tick(.05);}actions.push({gather:id});};
 if(!veteran){walk({x:11,z:9});command('start');}
 if(bow){for(const id of['timber-1','timber-2','fibre-1','fibre-2','stone-1'])gather(id);walk({x:11,z:9});command('arsenal-craft',{id:'trail_bow'});command('equip',{id:'trail_bow'});}
 const initial=sim.snapshot();snapshot(veteran?'01_EARNED_VETERAN':'01_EARNED_KIT');walk(M.definition.giver);quest('accept');snapshot('02_ACCEPTED');reload();
 walk(M.definition.evidence[0]);quest('inspect',{evidence:'tool-sample'});snapshot('03_SAMPLE');reload();
 walk(E.GATE);const ctx={sim,active:'earned-'+variant,revision:1},travel=E.preview(ctx);assert.ok(travel.ok,travel.error);assert.ok(E.enter(travel.ticket,ctx,{save,build:()=>{}}).ok);walk({x:0,z:10});
 for(const p of M.definition.evidence.slice(1)){walk(p);quest('inspect',{evidence:p.id});snapshot('04_'+p.id.toUpperCase().replaceAll('-','_'));}
 walk(E.ENTRY);assert.ok(E.leave(sim).ok);walk(M.definition.giver);quest('compare',{finding:'maker-before-stamp'});quest('participation',{participation:bow?'coauthor':'private'});quest('resolve',{resolution:bow?'public-correction':'private-correction'});snapshot('05_RESOLVED');reload();
 walk(M.definition.giver);const weapon=veteran?initial.adventure.equipment.weapon:bow?'trail_bow':'trail_blade';quest('learn',{weapon});assert.equal(M.status(sim).enabled,false);snapshot('06_LEARNED_DISABLED');reload();quest('enable',{enabled:true});snapshot('07_ENABLED');reload();
 const beforePractice=sim.snapshot();for(const k of['xp','owned','equipment','arsenal','starter','pursuit','realmCraft','earthBinding','classPath','road','beacon','crossing','companion','reward','defeated','drops'])assert.deepEqual(beforePractice.adventure[k],initial.adventure[k],k+' preserved');assert.deepEqual(beforePractice.sandbox.inventory,initial.sandbox.inventory);
 walk({x:15,z:7});command('starter-enter');walk({x:-5,z:11.5});command('target-select',{id:'river-practice'});const hits=T.runtime(sim).hits.length;command('pulse',{target:'river-practice'});for(let i=0;i<12;i++)sim.tick(.05);assert.ok(T.runtime(sim).hits.length>hits,'actual practice contact');
 const learned=M.status(sim);quest('enable',{enabled:false});assert.equal(A.runtime(sim).cooldowns.pulse>sim.state.adventure.elapsed,true,'shared cooldown survived selection');const refused=sim.adventureCommand('too-soon-'+(++serial),'pulse',{target:'river-practice'});assert.equal(refused.ok,false);for(let i=0;i<70;i++)sim.tick(.05);command('pulse',{target:'river-practice'});for(let i=0;i<12;i++)sim.tick(.05);assert.equal(sim.state.adventure.xp,initial.adventure.xp);save(sim.snapshot());reload();snapshot('08_PRACTICED_RELOADED');
 const report={variant,source:sourceFile,sourceSha256:sourceBytes?crypto.createHash('sha256').update(sourceBytes).digest('hex'):null,status:'passed',positionEdits:0,inventoryGrants:0,plantedObjectives:0,acceleratedTicks:true,durableStore:'labelled in-memory canonical synchronous store',commands:serial,record:M.status(sim),weapon,xp:sim.state.adventure.xp,htmlQualification:false,actions};fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module)console.log(JSON.stringify(run({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran')}),null,2));module.exports={run};
