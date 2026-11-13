/* Command-only chapter III journey, starting from a documented earned chapter II save.
 * No position edits, item grants, planted kills or direct objective assignments.
 * Automated tactics and accelerated ticks are not a human pacing/balance trial. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),B=require('../src/beacon.js'),T=require('../src/combat.js'),AR=require('../src/arsenal.js');
function journey(options={}){
 const out=options.out||path.join(__dirname,'../evidence09');fs.mkdirSync(out,{recursive:true});
 const source=options.source||path.join(__dirname,'../examples/CHAPTER_II_COMPLETE_EARNED.json');const initial=JSON.parse(fs.readFileSync(source));
 const sim=new C.Simulation(initial);let serial=0,actions=[],phases=[],beforeSoul;
 function cmd(type,p={}){const r=sim.adventureCommand('journey09-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);actions.push({type,p});return r;}
 function step(t){for(let i=0;i<Math.ceil(t/.05);i++)sim.tick(.05);}
 function walk(x,z){assert.ok(sim.moveTo(x,z).ok,'valid path '+x+','+z);let i=0;while(sim.playerPath.length&&i++<6000)step(.05);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.15,'arrived '+x+','+z);}
 walk(0,3);cmd('rest');walk(44,6);cmd('road-enter');walk(2,3.4);walk(2,-4);walk(0,-24);
 fs.writeFileSync(path.join(out,'BEACON_READY_EARNED.json'),JSON.stringify(sim.snapshot(),null,2));
 cmd('beacon-answer');step(18);assert.equal(B.runtime(sim).phase,'ready');assert.equal(B.runtime(sim).actors.length,3);assert.ok(B.runtime(sim).actors.every(a=>Math.hypot(a.x-a.goal.x,a.z-a.goal.z)<.1));cmd('beacon-sighting');assert.ok(sim.state.saga.regent.includes('beacon'));{const sight=sim.sagaCommand('journey-sight-beacon','feather-use',{});assert.ok(sight.ok,sight.error);}
 if(options.grace!==false)cmd('beacon-grace');cmd('beacon-defend');const startXP=sim.state.adventure.xp,startDrops=JSON.stringify(sim.state.adventure.drops);
 let lastWave=0;const capture=()=>{const a=sim.state.adventure,r=B.runtime(sim);phases.push({wave:r.wave,ward:r.ward,health:a.hp});};
 function fight(){
 for(let i=0;i<6000&&!['won','failed'].includes(B.runtime(sim).phase);i++){
  const a=sim.state.adventure,r=A.runtime(sim),br=B.runtime(sim),t=T.runtime(sim),p=sim.state.player;
  assert.ok(a.hp>0,'player lives through accepted actions');
  if(br.wave!==lastWave){lastWave=br.wave;capture();}
  if(a.hp<A.stats(a).maxHP-40&&a.tonics&&a.elapsed>=r.cooldowns.heal)cmd('heal');
  const near=r.enemies.filter(e=>e.hp>0&&e.eventEnemy).sort((x,y)=>(x.kind==='chanter'?-10:0)-(y.kind==='chanter'?-10:0)||Math.hypot(x.x-p.x,x.z-p.z)-Math.hypot(y.x-p.x,y.z-p.z));
  if(near.some(e=>e.hidden&&Math.hypot(e.x-p.x,e.z-p.z)<13)&&a.elapsed>=t.cooldowns.insight)cmd('insight');
  let e=T.selected(sim);if(!e&&near.some(x=>!x.hidden))cmd('target-select',{id:near.find(x=>!x.hidden).id});e=T.selected(sim);
  if(e){
   if(!t.auto)cmd('auto-toggle');
   const d=Math.hypot(e.x-p.x,e.z-p.z),w=AR.weapon(a);
   if((d>w.reach-.4||!A.visible(sim,p,e))&&!sim.playerPath.length){
    const opts=Array.from({length:16},(_,j)=>({x:e.x+Math.sin(j*Math.PI/8)*(w.style==='bow'?6:1.8),z:e.z+Math.cos(j*Math.PI/8)*(w.style==='bow'?6:1.8)})).sort((x,y)=>Math.hypot(x.x-p.x,x.z-p.z)-Math.hypot(y.x-p.x,y.z-p.z));
    for(const q of opts)if(C.pathfind(p,q,sim.navRoom)){sim.moveTo(q.x,q.z);break;}
   }
   if(d<3.4&&a.stamina>=50&&a.elapsed>=r.cooldowns.pulse)cmd('pulse',{target:e.id});
   if(e.mode==='windup'&&!e.aimWard&&e.timer<.35&&e.aim&&Math.hypot(p.x-e.aim.x,p.z-e.aim.z)<2.6&&a.stamina>=22&&a.elapsed>=r.cooldowns.dodge)cmd('dodge',{dx:Math.cos(e.yaw),dz:-Math.sin(e.yaw)});
   if(e.kind==='siegeboss'&&a.elapsed>=t.cooldowns.guard&&a.stamina>=40)cmd('guard');
   if(a.beacon.soul.equipped==='aegis'&&a.elapsed>=t.cooldowns.spirit&&a.stamina>=45&&a.hp<A.stats(a).maxHP-10)cmd('spirit');
  }
  if(br.ward<60&&B.near(sim)&&br.phase==='assault'&&br.time>=br.playerRepairAt&&a.stamina>=40)cmd('beacon-repair');
  step(.1);
 }
 assert.equal(B.runtime(sim).phase,'won','three breaches repelled: '+JSON.stringify(B.runtime(sim)));capture();assert.equal(require('../src/saga.js').done(sim.state,'beacon'),true,'the defense held and the saga marks the beacon');
 }
 fight();assert.equal(sim.state.adventure.xp,startXP);assert.equal(JSON.stringify(sim.state.adventure.drops),startDrops);
 walk(0,-24);cmd('beacon-reward');beforeSoul=sim.snapshot();fs.writeFileSync(path.join(out,'BEACON_VICTORY_EARNED.json'),JSON.stringify(beforeSoul,null,2));
 cmd('beacon-relic',{choice:'accept'});assert.equal(sim.state.adventure.beacon.soul.corruption,0);cmd('beacon-replay');
 step(1);cmd('target-cycle');assert.ok(T.selected(sim));cmd('spirit');assert.equal(sim.state.adventure.beacon.soul.corruption,1);
 fight();walk(0,-24);cmd('soul-purify');assert.equal(sim.state.adventure.beacon.soul.corruption,0);assert.deepEqual(sim.state.adventure.beacon.soul.scars,['cinder-invoked','cinder-renounced']);cmd('beacon-route',{route:'forest'});
 const saved=sim.snapshot();assert.deepEqual(new C.Simulation(saved).snapshot(),saved);
 for(const k of['score','notes','flowers','retreat','visitor'])assert.deepEqual(saved[k],initial[k],k+' preserved');
 assert.equal(saved.adventure.beacon.attempts,1);assert.equal(saved.adventure.beacon.failures,0);
 const report={status:'passed',method:__filename.split('/').pop(),source:path.relative(path.join(__dirname,'..'),source),commands:actions.length,directPositionEdits:0,inventoryGrants:0,plantedDefeats:0,grace:options.grace!==false,phases,stats:A.stats(saved.adventure),beacon:saved.adventure.beacon,unchanged:['score','notes','flowers','retreat','visitor'],note:'Automated tactics + accelerated 50-ms simulation steps. Not a human balance trial.'};
 fs.writeFileSync(path.join(out,'CHAPTER_III_COMPLETE_EARNED.json'),JSON.stringify(saved,null,2));fs.writeFileSync(path.join(out,'BEACON_JOURNEY.json'),JSON.stringify(report,null,2));return report;
}
if(require.main===module)console.log(JSON.stringify(journey(),null,2));module.exports={journey};
