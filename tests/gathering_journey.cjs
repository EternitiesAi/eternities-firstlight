/* Command-earned hospitality after Fenna's delivery. Actual navigation and saves;
 * accelerated ticks cover travel, not human pacing or device performance. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),E=require('../src/earth.js'),Q=require('../src/gathering.js');
const ROOT=path.resolve(__dirname,'..');
function run({bow=false,veteran=false}={}){
 const variant=veteran?'veteran-mill':bow?'fresh-bow-quarry':'fresh-blade-detour',verse=veteran?'mill':bow?'quarry':'detour',out=path.join(ROOT,'evidence10/gathering/journey',variant);fs.mkdirSync(out,{recursive:true});
 if(!process.argv.includes('--sources-ready'))require('./earth_story_journey.cjs').run({bow,veteran});
 const source=path.join(ROOT,'evidence10/earth-story/journey',variant,'05_ARRIVED_UNPAID.json');let sim=new C.Simulation(JSON.parse(fs.readFileSync(source,'utf8'))),serial=0,actions=[];
 const command=(type,p={})=>{const r=sim.adventureCommand('earned-table-'+variant+'-'+(++serial),'gathering-'+type,p);assert.ok(r.ok,type+': '+r.error);actions.push({type,p});};
 const walk=(x,z)=>{const r=sim.moveTo(x,z);assert.ok(r.ok,r.error);for(let i=0;i<9000&&sim.playerPath.length;i++)sim.tick(.05);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.3);actions.push({walk:[x,z]});};
 const snap=name=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(sim.snapshot(),null,2)+'\n');
 function enter(){if(sim.room===E.ROOM)return;walk(0,23);const ctx={sim,active:'character-1',revision:1},p=E.preview(ctx);assert.ok(p.ok,p.error);assert.ok(E.enter(p.ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);}
 function reload(){const saved=sim.snapshot();sim=new C.Simulation(saved);assert.deepEqual(sim.snapshot(),saved);assert.equal(sim.room,null);actions.push({reload:true});enter();}
 const before=sim.snapshot();snap('01_SOURCE');enter();walk(Q.TABLE.x,Q.TABLE.z);command('accept');snap('02_ACCEPTED');reload();
 for(const [i,p]of Q.TASKS.entries()){walk(p.x,p.z);command('prepare',{id:p.id});snap('03_PREPARATION_'+(i+1));reload();}
 walk(Q.TABLE.x,Q.TABLE.z);const unchosen=sim.snapshot();assert.equal(sim.adventureCommand('share-before-choice','gathering-share').ok,false);assert.deepEqual(sim.snapshot(),unchosen);command('verse',{verse});snap('04_ARRANGEMENT');reload();walk(Q.TABLE.x,Q.TABLE.z);command('share');snap('05_SHARED');reload();
 const after=sim.snapshot();for(const k of ['xp','ore','coins','equipment','owned','arsenal','starter','pursuit','classPath','earthStory','earthNotes','road','beacon','crossing','companion','defeated','drops','reward'])assert.deepEqual(after.adventure[k],before.adventure[k],k);for(const k of ['notes','score','retreat','visitor','flowers'])assert.deepEqual(after[k],before[k],k);for(const k of ['inventory','placed','bridge','stats','milestones'])assert.deepEqual(after.sandbox[k],before.sandbox[k],k);assert.equal(after.adventure.earthStory.claimed,false);
 walk(Q.TABLE.x,Q.TABLE.z);const shared=sim.snapshot();assert.equal(sim.adventureCommand('new-share-request','gathering-share').ok,false);assert.deepEqual(sim.snapshot(),shared);
 const report={variant,status:'passed',commands:serial,positionEdits:0,inventoryGrants:0,plantedObjectives:0,acceleratedTicks:true,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),gathering:after.adventure.earthGathering,weapon:after.adventure.equipment.weapon,xp:after.adventure.xp,deliveryStillUnpaid:true,actions};fs.writeFileSync(path.join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module)console.log(JSON.stringify(run({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran')}),null,2));
module.exports={run};
