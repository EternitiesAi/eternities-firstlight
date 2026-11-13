/* Earned Chapter III -> Chapter IV. Accepted commands and timed walking only.
 * No position assignment, inventory grants, planted kills, or assigned quest flags.
 * This automated tactical test is not a human pacing or balance study. */
'use strict';const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),X=require('../src/crossing.js'),T=require('../src/combat.js'),AR=require('../src/arsenal.js'),S=require('../src/sandbox.js');
function journey(options={}){const out=options.out||path.join(__dirname,'../evidence10/journey'),source=options.source||path.join(__dirname,'../examples/REALM10_CHAPTER_III_BASE_EARNED.json');fs.mkdirSync(out,{recursive:true});const initial=JSON.parse(fs.readFileSync(source)),sim=new C.Simulation(initial),log=[],tells=[];let seq=0;
 const cmd=(type,p={})=>{const r=sim.adventureCommand('ch4-'+(++seq),type,p);assert.ok(r.ok,type+': '+r.error);log.push({type,p});return r;};
 const sb=(type,p={})=>{const r=sim.sandboxCommand('ch4sb-'+(++seq),type,p);assert.ok(r.ok,type+': '+r.text);log.push({sandbox:type,p});return r;};
 const step=t=>{for(let i=0;i<Math.ceil(t/.05);i++)sim.tick(.05);};
 function walk(x,z){let res=sim.moveTo(x,z);assert.ok(res.ok,'path '+x+','+z+' '+res.error);log.push({walk:[x,z]});for(let i=0;i<6000&&sim.playerPath.length;i++)step(.05);assert.ok(sim.state.adventure.hp>0,'alive walking');assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.2,'arrived '+x+','+z);}
 const place=id=>{let q=X.PLACES.find(q=>q.id===id);walk(q.x,q.z);};
 const save=name=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(sim.snapshot(),null,2));
 function harvest(id){const q=S.NODES.find(q=>q.id===id);assert.ok(q,id);walk(q.x+1.1,q.z);for(let i=0;i<30;i++){const v=sim.state.sandbox.nodes.find(n=>n.id===id);if(v.hp===0)break;if(v.readyAt>sim.state.sandbox.elapsed)step(v.readyAt-sim.state.sandbox.elapsed+.1);sb('gather',{node:id});step(1);}}
 walk(0,3);cmd('rest');
 if(options.bow){harvest('timber-1');harvest('fibre-1');harvest('fibre-2');harvest('stone-1');walk(11,9);cmd('arsenal-craft',{id:'trail_bow'});cmd('equip',{id:'trail_bow'});walk(0,3);}
 save('CROSSING_READY_EARNED');cmd('waystone-travel',{id:'sunward'});walk(0,-27);cmd('cross-enter');{const sight=sim.sagaCommand('journey-sight-crossing','feather-use',{});assert.ok(sight.ok,sight.error);assert.ok(require('../src/feather-sight.js').roadsFor(sim).some(q=>q.id==='bellweather-severing'),'the severing line shows in the sight');}place('waystone');cmd('cross-attune');place('keeper');cmd('cross-meet');place('inscription');cmd('cross-inspect');save('TOWN_MET_EARNED');
 function fight(id){let started=sim.state.adventure.elapsed;let lastTell='';cmd('target-select',{id});cmd('auto-toggle');
 for(let i=0;i<1800;i++){const a=sim.state.adventure,r=A.runtime(sim),t=T.runtime(sim),e=r.enemies.find(e=>e.id===id);if(e.hp<=0)break;const p=sim.state.player,d=Math.hypot(p.x-e.x,p.z-e.z),w=AR.weapon(a);assert.ok(a.hp>0,'alive in '+id);
 if(a.hp<A.stats(a).maxHP-40&&a.tonics&&a.elapsed>=r.cooldowns.heal)cmd('heal');
 let escape=false;
 if(e.mode==='windup'&&e.aim){if(e.custom==='bell'){if(e.ringMode!==lastTell){tells.push(e.ringMode);lastTell=e.ringMode;}
 if(X.inImpact(e,p)){let q=e.ringMode==='outer'?{...e.aim}:{x:e.aim.x+(p.x<e.aim.x?-1:1)*3.4,z:e.aim.z};if(X.walkable(q.x,q.z)&&C.pathfind(p,q,sim.navRoom)){sim.moveTo(q.x,q.z);escape=true;}}
 }else if(e.timer<.45&&Math.hypot(p.x-e.aim.x,p.z-e.aim.z)<1.55&&a.stamina>=22&&a.elapsed>=r.cooldowns.dodge){cmd('dodge',{dx:Math.cos(e.yaw),dz:-Math.sin(e.yaw)});escape=true;}}
 if(!escape&&!sim.playerPath.length&&(d>w.reach-.35||!A.visible(sim,p,e))){const opts=Array.from({length:16},(_,i)=>({x:e.x+Math.sin(i*Math.PI/8)*(w.style==='bow'?6:1.6),z:e.z+Math.cos(i*Math.PI/8)*(w.style==='bow'?6:1.6)})).sort((q,v)=>Math.hypot(q.x-p.x,q.z-p.z)-Math.hypot(v.x-p.x,v.z-p.z));for(const q of opts)if(X.walkable(q.x,q.z)&&A.visible(sim,q,e)&&sim.moveTo(q.x,q.z).ok)break;}
 if(d>.04&&d<(w.style==='bow'?10:3.3)&&a.stamina>=60&&a.elapsed>=r.cooldowns.pulse&&A.visible(sim,p,e))cmd('pulse',{target:id});
 if(e.mode==='windup'&&a.stamina>=45&&a.elapsed>=t.cooldowns.guard)cmd('guard');
 step(.1);
 }
 assert.ok(sim.state.adventure.defeated.includes(id),'defeated '+id);cmd('target-clear');sim.playerPath=[];const home=X.ENEMIES.find(e=>e.id===id);walk(home.x,home.z);cmd('loot',{id});log.push({fight:id,seconds:sim.state.adventure.elapsed-started,health:sim.state.adventure.hp});
 }
 place('thicket');cmd('cross-seek');for(let i=0;i<300&&!sim.state.adventure.crossing.clapperRevealed;i++)step(.05);assert.equal(sim.state.adventure.crossing.clapperRevealed,true);fight('cross-thorn');walk(X.CLAPPER.x,X.CLAPPER.z);cmd('cross-clapper');
 walk(0,-11);fight('cross-prism');place('inn');cmd('cross-rest');walk(0,-15);save('KEEPER_APPROACH_EARNED');fight('cross-warden');place('court');cmd('cross-repair');save('BELLS_REPAIRED_EARNED');
 for(const b of X.BELLS){walk(b.x,b.z);step(.7);cmd('cross-ring',{id:b.id});}assert.equal(sim.state.adventure.crossing.complete,true);place('keeper');cmd('cross-reward');cmd('equip',{id:'chime_clasp'});place('shop');cmd('cross-trade',{offer:'coat'});cmd('equip',{id:'keeper_coat'});cmd('cross-trade',{offer:'copper'});place('inn');cmd('cross-rest');place('workbench');assert.equal(AR.atBench(sim),true);
 save('CHAPTER_IV_COMPLETE_EARNED');place('waystone');cmd('waystone-travel',{id:'commons'});assert.equal(sim.room,null);save('HOME_AFTER_BELL_EARNED');
 assert.deepEqual(new C.Simulation(sim.snapshot()).snapshot(),sim.snapshot());for(const k of['score','retreat','notes','flowers','visitor'])assert.deepEqual(sim.snapshot()[k],initial[k],k+' preserved');assert.deepEqual(sim.state.adventure.beacon.soul,initial.adventure.beacon.soul,'soul choices preserved');
 const report={status:'passed',edition:'10.0.0',source:path.relative(path.join(__dirname,'..'),source),weapon:options.bow?'bow':'blade',commands:seq,positionEdits:0,inventoryGrants:0,plantedDefeats:0,automated:true,tells,final:A.stats(sim.state.adventure),chapter:sim.state.adventure.crossing,actions:log};fs.writeFileSync(path.join(out,'CROSSING_JOURNEY.json'),JSON.stringify(report,null,2));return report;
}
if(require.main===module){const r=journey({bow:process.argv.includes('--bow'),out:process.argv.includes('--bow')?path.join(__dirname,'../evidence10/journey-bow'):undefined});console.log(JSON.stringify({...r,actions:undefined},null,2));}module.exports={journey};
