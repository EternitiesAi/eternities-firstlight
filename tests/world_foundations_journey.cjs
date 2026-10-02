/* Command-earned realm work: production walking and commands, accelerated ticks.
 * No personal saves; not a human pacing or enjoyment measurement. */
'use strict';const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),A=require('../src/adventure.js'),W=require('../src/world-foundations.js'),AR=require('../src/arsenal.js');require('../src/combat.js');
const ROOT=path.resolve(__dirname,'..');
function journey({bow=false,veteran=false}={}){
 const variant=veteran?'veteran':bow?'fresh-bow':'fresh-blade',out=path.join(ROOT,'evidence10/world-foundations/journey',variant);fs.mkdirSync(out,{recursive:true});
 const source=variant==='fresh-blade'?null:path.join(ROOT,'evidence10/pursuit',variant,bow?'02_SOURCE_READY.json':'07_PRACTICE_PERSISTED.json');
 if(source&&!fs.existsSync(source))require('node:child_process').execFileSync(process.execPath,['tests/pursuit_journey.cjs',bow?'--bow':'--veteran'],{cwd:ROOT,stdio:'inherit'});
 let sim=new C.Simulation(source?JSON.parse(fs.readFileSync(source,'utf8')):undefined),serial=0,saved=null;const events=[],claims=[],routes=[];
 const context=()=>({sim,active:'earned-world-'+variant,revision:++serial});
 const walk=(x,z)=>{const r=sim.moveTo(x,z);assert.ok(r.ok,'walk '+x+','+z+': '+r.error);let ticks=0;while(sim.playerPath.length&&ticks++<12000){const before={...sim.state.player};sim.tick(.05);if(W.handles(sim.room))assert.ok(W.segment(sim.room,before,sim.state.player),'every accepted movement segment has support');}assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.25,'arrived '+x+','+z);assert.ok(sim.state.adventure.hp>0,'ordinary outing did not kill the traveler');routes.push({room:sim.room||'valley',x,z,ticks});};
 const save=candidate=>{saved=C.validate(candidate);return{ok:true};};
 const enter=id=>{const c=context(),p=W.preview(c,id);assert.ok(p.ok,p.error);assert.ok(W.enter(p.ticket,c,{save,build:()=>{}}).ok);events.push({enter:id});};
 const command=(type,p)=>{const r=W.command(context(),type,p,{save});assert.ok(r.ok,type+': '+r.error);events.push({type,p,result:r});return r;};
 const snapshot=name=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(sim.snapshot(),null,2)+'\n');
 const reload=id=>{const expected=sim.snapshot();sim=new C.Simulation(saved||expected);assert.deepEqual(sim.snapshot(),expected);assert.equal(sim.room,null);events.push({reload:id});enter(id);};
 walk(11,9);if(!sim.state.adventure.started)assert.ok(sim.adventureCommand('earned-world-kit','start').ok);walk(W.GATE.x,W.GATE.z);snapshot('00_INITIAL_KIT');
 const before=sim.snapshot(),oldWeapon=before.adventure.equipment.weapon;
 for(const id of W.IDS){enter(id);const d=W.definition(id),giver=d.points.find(p=>p.id===d.quest.giverId);walk(giver.x,giver.z);
  const unpaid=JSON.stringify(sim.snapshot());assert.equal(W.command(context(),'observe',{realm:id,run:1,objective:'first'},{save}).ok,false);assert.equal(JSON.stringify(sim.snapshot()),unpaid);
  command('accept',{realm:id});let run=sim.state.journeys.realms[id].active.run;snapshot(id+'_01_ACCEPTED');reload(id);
  for(const[index,o]of d.quest.objectives.entries()){const p=d.points.find(p=>p.id===o.pointId);walk(p.x,p.z);command('observe',{realm:id,run,objective:o.id});snapshot(id+'_0'+(index+2)+'_OBJECTIVE');if(index===0){reload(id);assert.deepEqual(sim.state.journeys.realms[id].active.observed,['first']);}}
  walk(giver.x,giver.z);const ready=sim.snapshot();snapshot(id+'_05_READY');const balance=ready.adventure.coins,r=command('claim',{realm:id,run});assert.equal(sim.state.adventure.coins-balance,d.quest.reward.coins);claims.push({realm:id,run,reward:r.reward});snapshot(id+'_06_CLAIMED');
  const paid=JSON.stringify(sim.snapshot());assert.equal(W.command(context(),'claim',{realm:id,run,request:'different-id'},{save}).duplicate,true);assert.equal(JSON.stringify(sim.snapshot()),paid);reload(id);walk(giver.x,giver.z);assert.equal(W.command(context(),'claim',{realm:id,run},{save}).duplicate,true);
  command('accept',{realm:id});run=sim.state.journeys.realms[id].active.run;assert.equal(run,2);for(const o of d.quest.objectives){const p=d.points.find(p=>p.id===o.pointId);walk(p.x,p.z);command('observe',{realm:id,run,objective:o.id});}walk(giver.x,giver.z);const coins=sim.state.adventure.coins,repeat=command('claim',{realm:id,run});assert.deepEqual(repeat.reward,{xp:5,coins:2,ore:0});assert.equal(sim.state.adventure.coins-coins,2);claims.push({realm:id,run,reward:repeat.reward});snapshot(id+'_07_REPEAT_PAID');
  assert.ok(W.leave(sim).ok);assert.equal(sim.room,null);assert.equal(sim.state.adventure.equipment.weapon,oldWeapon);walk(W.GATE.x,W.GATE.z);
 }
 const after=sim.snapshot();for(const k of ['owned','equipment','arsenal','pursuit','starter','classPath','reward','road','crossing','beacon','companion','defeated','drops'])assert.deepEqual(after.adventure[k],before.adventure[k],k+' retained');for(const k of ['notes','score','scoreRevision','retreat','visitor'])assert.deepEqual(after[k],before[k],k+' retained');assert.equal(A.level(after.adventure)<=5,true);assert.equal(AR.weapon(after.adventure).style,bow?'bow':'blade');
 const report={status:'passed',method:'actual production rules and walking; accelerated ticks; memory save boundary',variant,source:source?path.relative(ROOT,source):'fresh production character plus command-earned initial kit',sourceSha256:source?crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'):null,worldVersion:C.VERSION,adventureVersion:A.VERSION,journeysVersion:after.journeys.version,claims,events,routes,gearAndStoryPreserved:true,noPersonalSaves:true,humanPacing:false};fs.writeFileSync(path.join(out,'WORLD_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran')});console.log(JSON.stringify({status:r.status,variant:r.variant,claims:r.claims.length,acceptedCommands:r.events.filter(e=>e.type).length,walkedLegs:r.routes.length},null,2));}
module.exports={journey};
