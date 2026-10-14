/* Command-earned local exhibition: no pose, gear, score, material or damage
 * grants. Accepted accelerated .05s ticks and a labelled in-memory saver.
 * Existing Chapter IV earned fixture is an optional separately hashed source. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),E=require('../src/earth.js'),R=require('../src/earth-tournament.js'),B=require('../src/sandbox.js'),T=require('../src/combat.js');
function run({bow=false,veteran=false,source,output}={}){
 const variant=veteran?'veteran':bow?'bow':'blade',out=path.resolve(output||process.env.FIRSTLIGHT_TOURNAMENT_OUTPUT||'evidence10/tournament-journey',variant);fs.mkdirSync(out,{recursive:true});
 const sourceFile=veteran?path.resolve(source||path.join(__dirname,'../evidence10/veteran-source/CHAPTER_IV_COMPLETE_EARNED.json')):null,sourceBytes=sourceFile?fs.readFileSync(sourceFile):null;
 let sim=new C.Simulation(sourceBytes?JSON.parse(sourceBytes):undefined),serial=0,stored=null;const actions=[],active='earned-tournament-'+variant;
 if(veteran){assert.ok(sim.state.adventure.crossing.complete);assert.ok(sim.state.adventure.reward);assert.equal(sim.state.adventure.earthTournament.issued,0);}
 const save=world=>{stored=JSON.stringify(C.validate(world));return{ok:true};};
 const command=(type,p={})=>{const r=sim.adventureCommand('tournament-earned-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);actions.push({command:type,p});return r;};
 const walk=p=>{const r=sim.moveTo(p.x,p.z);assert.ok(r.ok,r.error);let ticks=0;while(sim.playerPath.length&&ticks++<12000)sim.tick(.05);assert.ok(Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<.3,'walk '+JSON.stringify(p));actions.push({walk:[p.x,p.z],room:sim.room,ticks});};
 const event=(type,extra={})=>{const r=R.command({sim,active,current:()=>true},type,{quest:R.definition.id,expectedActive:active,expectedRevision:sim.state.adventure.revision,family:AR.weapon(sim.state.adventure).style,...extra},{save});assert.ok(r.ok,type+': '+r.error);actions.push({event:type});return r;};
 const gather=id=>{const n=B.NODES.find(n=>n.id===id);walk({x:n.x+1.1,z:n.z});while(sim.state.sandbox.nodes.find(n=>n.id===id).hp){const r=sim.sandboxCommand('rain-gather-'+(++serial),'gather',{node:id});assert.ok(r.ok,r.error);for(let i=0;i<21;i++)sim.tick(.05);}actions.push({gather:id});};
 const reload=()=>{const expected=C.validate(JSON.parse(stored));sim=new C.Simulation(expected);assert.deepEqual(sim.snapshot(),expected);actions.push({reload:true});};
 const travel=()=>{walk(E.GATE);const ctx={sim,active,revision:1},p=E.preview(ctx);assert.ok(p.ok,p.error);assert.ok(E.enter(p.ticket,ctx,{save,build:()=>{}}).ok);walk({x:0,z:10});walk(R.definition.giver);};
 const until=condition=>{for(let i=0;i<900&&!condition();i++)sim.tick(.05);assert.ok(condition(),'phase bound');};
 if(!veteran){walk({x:11,z:9});command('start');}
 if(bow){for(const id of ['timber-1','timber-2','fibre-1','fibre-2','stone-1'])gather(id);walk({x:11,z:9});command('arsenal-craft',{id:'trail_bow'});command('equip',{id:'trail_bow'});}
 const initial=sim.snapshot();fs.writeFileSync(path.join(out,'01_EARNED_ENTRY.json'),JSON.stringify(initial,null,2)+'\n');
 travel();event('enter');reload();assert.equal(R.view(sim),null);event('withdraw');assert.equal(sim.state.adventure.earthTournament.closed,1);
 travel();event('enter');walk({x:5,z:-29.2});command('target-cycle');const family=AR.weapon(sim.state.adventure).style;
 for(let index=0;index<3;index++){
  until(()=>R.view(sim).index===index&&R.view(sim).phase==='tell');command('guard');until(()=>R.view(sim).phase==='opening');command('attack',{target:T.selected(sim).id});until(()=>R.view(sim).rounds[index].reply);
 }
 until(()=>R.view(sim).complete);assert.equal(R.view(sim).score,6);walk(R.definition.giver);event('record');const recorded=sim.snapshot();
 assert.equal(recorded.adventure.earthTournament.best[family],6);assert.equal(recorded.adventure.earthTournament.finished[family],1);reload();
 // An intentional second real outing is admitted, but no repeated record call
 // can manufacture another completion. Purely defensive replay retains gold.
 travel();event('enter');walk({x:5,z:-29.2});
 for(let index=0;index<3;index++){until(()=>R.view(sim).index===index&&R.view(sim).phase==='tell');command('guard');until(()=>R.view(sim).phase==='rest');}
 until(()=>R.view(sim).complete);assert.equal(R.view(sim).score,3);walk(R.definition.giver);event('record');
 const beforeRetry=sim.snapshot();for(let i=0;i<3;i++){const r=R.command({sim,active,current:()=>true},'record',{quest:R.definition.id,expectedActive:active,expectedRevision:sim.state.adventure.revision,requestId:'retry-'+i},{save});assert.equal(r.ok,false);assert.deepEqual(sim.snapshot(),beforeRetry);}
 reload();const final=sim.snapshot();assert.equal(final.adventure.earthTournament.best[family],6);assert.equal(final.adventure.earthTournament.finished[family],2);assert.equal(final.adventure.earthTournament.issued,3);assert.equal(final.adventure.earthTournament.closed,3);
 for(const k of ['xp','hp','owned','equipment','arsenal','starter','pursuit','realmCraft','earthBinding','earthMasterwork','classPath','road','beacon','crossing','companion','reward','defeated','drops','coins','ore','tonics'])assert.deepEqual(final.adventure[k],initial.adventure[k],k+' preserved');assert.deepEqual(final.sandbox.inventory,initial.sandbox.inventory);
 fs.writeFileSync(path.join(out,'02_EARNED_RECORDED.json'),JSON.stringify(final,null,2)+'\n');
 const report={status:'passed',variant,family,source:sourceFile,sourceSha256:sourceBytes?crypto.createHash('sha256').update(sourceBytes).digest('hex'):null,commands:serial,positionEdits:0,inventoryGrants:0,scoreGrants:0,damageGrants:0,acceleratedTicks:true,durableStore:'labelled in-memory synchronous canonical writer',nativeBrowser:false,record:final.adventure.earthTournament,actions};fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const r=run({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran')});console.log(JSON.stringify({...r,actions:r.actions.length},null,2));}module.exports={run};
