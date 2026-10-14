/* Command-earned kits, materials and actual Core travel. Accelerated accepted
 * ticks and an explicit in-memory canonical saver, not native or human pacing. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/earth.js'),B=require('../src/sandbox.js'),R=require('../src/earth-gate.js'),{GateHost}=require('../src/earth-gate-host.js');
function run({bow=false,veteran=false,source,output}={}){
 const variant=veteran?'veteran':bow?'bow':'blade',plan=bow||veteran?'temporary-shelter':'inspection-lane',active='earned-gate-'+variant,out=path.resolve(output||process.env.FIRSTLIGHT_GATE_OUTPUT||'evidence10/gate-captain-journey',variant);fs.mkdirSync(out,{recursive:true});
 const sourceFile=veteran?path.resolve(source||path.join(__dirname,'../evidence10/veteran-source/CHAPTER_IV_COMPLETE_EARNED.json')):null,sourceBytes=sourceFile?fs.readFileSync(sourceFile):null;
 let sim=new C.Simulation(sourceBytes?JSON.parse(sourceBytes):undefined),stored=null,serial=0,checkpoints=0;const actions=[];
 if(veteran){assert.ok(sim.state.adventure.crossing.complete);assert.ok(sim.state.adventure.reward);}
 const save=w=>{stored=JSON.stringify(C.validate(w));return{ok:true};},host=new GateHost({context:()=>{const s=sim,state=s.state;return{sim:s,active,current:()=>sim===s&&s.state===state};},save});
 const tick=()=>{sim.tick(.05);host.tick(.05);};
 const command=(type,p={})=>{const r=sim.adventureCommand('gate-earned-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);actions.push({command:type,p});return r;};
 const walk=p=>{const r=sim.moveTo(p.x,p.z);assert.ok(r.ok,r.error);let n=0;while(sim.playerPath.length&&n++<12000)tick();assert.ok(Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<.3,'walk '+JSON.stringify(p));actions.push({walk:[p.x,p.z],room:sim.room,ticks:n});};
 const quest=(type,p={})=>{const r=host.command(type,{quest:R.definition.id,expectedActive:active,expectedRevision:sim.state.adventure.revision,...p});assert.ok(r.ok,type+': '+r.error);actions.push({quest:type,...p});return r;};
 const gather=id=>{const n=B.NODES.find(n=>n.id===id);walk({x:n.x+1.1,z:n.z});while(sim.state.sandbox.nodes.find(n=>n.id===id).hp){const r=sim.sandboxCommand('gate-gather-'+(++serial),'gather',{node:id});assert.ok(r.ok,r.error);for(let i=0;i<21;i++)tick();}actions.push({gather:id});};
 const snap=name=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(sim.snapshot(),null,2)+'\n');
 const reload=()=>{assert.ok(stored);const expected=C.validate(JSON.parse(stored));host.reset('cold-reload');sim=new C.Simulation(expected);assert.deepEqual(sim.snapshot(),expected);actions.push({coldReload:true});};
 const travel=()=>{walk(E.GATE);const ctx={sim,active,revision:1},p=E.preview(ctx);assert.ok(p.ok,p.error);assert.ok(E.enter(p.ticket,ctx,{save,build:()=>{}}).ok);walk({x:0,z:10});};
 if(!veteran){walk({x:11,z:9});command('start');}
 if(bow){for(const id of['timber-1','timber-2','fibre-1','fibre-2','stone-1'])gather(id);walk({x:11,z:9});command('arsenal-craft',{id:'trail_bow'});command('equip',{id:'trail_bow'});}
 if(plan==='temporary-shelter')for(const[key,prefix,needed]of[['wood','timber',4],['fiber','fibre',2]]){for(const n of B.NODES.filter(n=>n.id.startsWith(prefix))){if(sim.state.sandbox.inventory[key]>=needed)break;if(sim.state.sandbox.nodes.find(v=>v.id===n.id).hp)gather(n.id);}assert.ok(sim.state.sandbox.inventory[key]>=needed,'command-earned shelter materials');}
 const initial=sim.snapshot();snap('01_EARNED_ENTRY');travel();walk(R.definition.giver);quest('accept');snap('02_ACCEPTED');
 for(const p of R.definition.evidence){walk(p);quest('read',{evidence:p.id});}quest('choose',{plan});walk(R.definition.plans[plan].prepare);quest('prepare');snap('03_PREPARED');reload();travel();
 const lead=()=>{const a=host.status().view.actors[1];walk(a);assert.ok(host.control('lead').ok);};lead();
 let ticks=0,reloaded=false;
 while(!sim.state.adventure.earthGate.outcome&&ticks++<4000){const v=host.status().view,a=v.actors[1],p=sim.state.player,before=sim.state.adventure.earthGate.checkpoint;
  if(Math.hypot(p.x-a.x,p.z-a.z)>2.2){if(E.segment(p,a,.31))sim.manual(a.x-p.x,a.z-p.z,.05);else assert.ok(sim.moveTo(a.x,a.z).ok);}
  tick();assert.equal(host.status().error,null);
  if(sim.state.adventure.earthGate.checkpoint!==before){checkpoints++;actions.push({checkpoint:sim.state.adventure.earthGate.checkpoint,actors:host.status().view.actors.map(a=>({id:a.id,x:a.x,z:a.z}))});
   if(!reloaded){snap('04_PARTIAL_CHECKPOINT');reload();travel();assert.equal(host.status().view.leading,false);lead();reloaded=true;}
  }
 }
 assert.ok(ticks<4000,'bounded real escort');assert.equal(checkpoints,R.definition.plans[plan].route.length-1);assert.equal(host.status().view.arrived,true);snap('05_ARRIVED_UNPAID');reload();travel();assert.equal(host.status().view.arrived,true);walk(R.definition.giver);quest('claim');snap('06_PAID');reload();
 const final=sim.snapshot();assert.equal(final.adventure.coins,initial.adventure.coins+8);assert.equal(final.adventure.xp,Math.min(9999,initial.adventure.xp+15));
 for(const k of['owned','equipment','arsenal','starter','pursuit','realmCraft','earthBinding','earthMasterwork','earthTournament','classPath','road','beacon','crossing','companion','reward','defeated','drops','ore','tonics'])assert.deepEqual(final.adventure[k],initial.adventure[k],k+' preserved');
 for(const k of['notes','score','retreat','visitor','flowers','localLife','earthExpedition','earthHomecoming','briarMoments'])assert.deepEqual(final[k],initial[k],k+' preserved');
 const expectedInventory={...initial.sandbox.inventory};for(const[k,n]of Object.entries(R.definition.plans[plan].cost))expectedInventory[k]-=n;assert.deepEqual(final.sandbox.inventory,expectedInventory);
 travel();walk(R.definition.giver);const before=sim.snapshot();for(let i=0;i<3;i++)assert.equal(quest('claim',{requestId:'retry-'+i}).duplicate,true);assert.deepEqual(sim.snapshot(),before);
 const report={status:'passed',variant,plan,source:sourceFile,sourceSha256:sourceBytes?crypto.createHash('sha256').update(sourceBytes).digest('hex'):null,positionEdits:0,actorPositionEdits:0,inventoryGrants:0,plantedObjectives:0,acceleratedTicks:true,nativeBrowser:false,durableStore:'labelled in-memory synchronous canonical writer',commands:serial,checkpoints,record:final.adventure.earthGate,actions};fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const r=run({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran')});console.log(JSON.stringify({...r,actions:r.actions.length},null,2));}module.exports={run};
