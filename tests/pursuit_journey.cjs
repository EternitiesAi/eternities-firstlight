/* Command-earned local gear pursuit. Accelerated tactics are not a human pacing test. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),A=require('../src/adventure.js'),Q=require('../src/starter.js'),H=require('../src/pursuit.js'),AR=require('../src/arsenal.js'),S=require('../src/sandbox.js'),T=require('../src/combat.js');
const ROOT=path.join(__dirname,'../evidence10/pursuit');
function journey({bow=false,veteran=false,earth=false}={}){
 const E=require('../src/earth.js');
 const variant=veteran?'veteran':bow?'fresh-bow':'fresh-blade',out=path.join(ROOT,earth?'earth-'+variant:variant);fs.mkdirSync(out,{recursive:true});
 const source=path.resolve(__dirname,'../evidence10/starter/veteran/03_TEMPER_EQUIPPED_RELOADED.json');
 if(veteran&&!fs.existsSync(source))require('node:child_process').execFileSync(process.execPath,['tests/starter_veteran.cjs'],{cwd:path.join(__dirname,'..')});
 const raw=veteran?JSON.parse(fs.readFileSync(source,'utf8')):null;let sim=new C.Simulation(raw||undefined),serial=0;
 const actions=[],transactions=[],claims=[],combats=[],previews=[];const id=veteran?'dawn_edge':bow?'copper_bow':'copper_blade';
 const balances=()=>Object.fromEntries(['ore','coins','fiber','wood','stone','plank'].map(k=>[k,k==='ore'||k==='coins'?sim.state.adventure[k]:sim.state.sandbox.inventory[k]]));
 const initial=balances(),legacy=sim.snapshot();
 const cmd=(type,p={})=>{const before=balances(),r=sim.adventureCommand('earned-pursuit-'+variant+'-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);actions.push({type,p});const after=balances();if(JSON.stringify(before)!==JSON.stringify(after))transactions.push({type,p,before,after});return r;};
 const sandbox=(type,p)=>{const before=balances(),r=sim.sandboxCommand('earned-gather-'+variant+'-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);actions.push({sandbox:type,p});const after=balances();if(JSON.stringify(before)!==JSON.stringify(after))transactions.push({type,p,before,after});};
 const tick=seconds=>{for(let i=0;i<Math.ceil(seconds/.05);i++)sim.tick(.05);};
 const walk=(x,z)=>{const r=sim.moveTo(x,z);assert.ok(r.ok,'walk '+x+','+z+': '+r.error);for(let i=0;i<7000&&sim.playerPath.length;i++)tick(.05);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.25,'arrived '+x+','+z);assert.ok(sim.state.adventure.hp>0,'alive walking');actions.push({walk:[x,z]});};
 const snap=name=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(sim.snapshot(),null,2));
 const reload=()=>{const saved=sim.snapshot();sim=new C.Simulation(saved);assert.deepEqual(sim.snapshot(),saved);actions.push({reload:true});};
 const travel=()=>{const ctx={sim,active:'character-1',revision:1},p=E.preview(ctx);assert.ok(p.ok,p.error);assert.ok(E.enter(p.ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);actions.push({crossing:sim.room});};
 const enter=()=>{if(!earth){walk(15,7);cmd('starter-enter');return;}walk(0,23);travel();walk(0,10);walk(-13,4);travel();assert.equal(sim.room,'riverbank');assert.deepEqual(sim.snapshot().player,{x:0,z:23,yaw:sim.returnPos.yaw});};
 const home=()=>{walk(0,12);cmd('starter-leave');if(earth){assert.equal(sim.room,E.ROOM);walk(0,10);walk(0,24);assert.ok(E.leave(sim).ok);}walk(11,9);};
 function fight(objective){
  let e=A.runtime(sim).enemies.find(e=>e.objective===objective);assert.ok(e);const enemyId=e.id;
  cmd('target-select',{id:enemyId});if(!T.runtime(sim).auto)cmd('auto-toggle');let guards=0,ticks=0;const phases={};
  for(;ticks<4000&&!sim.state.adventure.pursuit.active.defeated.includes(objective);ticks++){
   e=A.runtime(sim).enemies.find(e=>e.id===enemyId);const a=sim.state.adventure,r=A.runtime(sim),t=T.runtime(sim),p=sim.state.player,w=AR.weapon(a);assert.ok(a.hp>0,'survived '+enemyId);
   if(a.hp<48&&a.tonics&&a.elapsed>=r.cooldowns.heal)cmd('heal');
   const cue=T.threat(sim);if(cue){assert.equal(cue.phase,e.mode);assert.equal(cue.remaining,e.timer);phases[cue.phase]??={kind:cue.kind,remaining:cue.remaining,enemyHP:e.hp,playerHP:a.hp,readiness:T.readiness(sim)};}
   if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){cmd('guard');guards++;}
   if(!sim.playerPath.length&&(Math.hypot(p.x-e.x,p.z-e.z)>=w.reach-.2||!A.visible(sim,p,e))){
    const radius=w.style==='bow'?5:1.6;let moved=false;
    for(let j=0;j<16;j++){const q={x:e.x+Math.sin(j*Math.PI/8)*radius,z:e.z+Math.cos(j*Math.PI/8)*radius};if(Q.walkable(q.x,q.z)&&A.visible(sim,q,e)&&sim.moveTo(q.x,q.z).ok){actions.push({walk:[q.x,q.z],combat:true});moved=true;break;}}assert.ok(moved,'legal approach '+enemyId);
   }tick(.1);
  }
  assert.ok(sim.state.adventure.pursuit.active.defeated.includes(objective),'cleared '+enemyId);assert.equal(T.threat(sim),null,'defeated foe leaves no stale cue');combats.push({id:enemyId,ticks,guards,hp:sim.state.adventure.hp,phases});cmd('target-clear');assert.equal(T.threat(sim),null);
 }
 function gather(id){const n=S.NODES.find(n=>n.id===id);walk(n.x+1.1,n.z);let node=sim.state.sandbox.nodes.find(q=>q.id===id);while(node.hp){if(node.readyAt>sim.state.sandbox.elapsed)tick(node.readyAt-sim.state.sandbox.elapsed+.1);sandbox('gather',{node:id});tick(1);}}
 function practice(){enter();walk(-5,AR.weapon(sim.state.adventure).style==='bow'?6:11.5);cmd('target-select',{id:'river-practice'});cmd('auto-toggle');tick(1.5);const damage=A.runtime(sim).training?.lastDamage;assert.ok(damage>0,'confirmed practice impact');cmd('target-clear');home();return damage;}
 function preview(label,weapon){const before=JSON.stringify(sim.snapshot()),p=H.nextStep(sim.state.adventure,weapon);assert.ok(p,label);assert.equal(JSON.stringify(sim.snapshot()),before,'pure preview '+label);previews.push({label,project:weapon,...p});return p;}
 function applyPreview(p){const old=sim.state.adventure.equipment.weapon;cmd(p.recipe.type,p.recipe.payload);assert.equal(sim.state.adventure.equipment.weapon,old,'craft/fit never auto-equips');const equipped=structuredClone(sim.state.adventure);equipped.equipment.weapon=p.weapon;assert.deepEqual(A.stats(equipped),p.after);assert.deepEqual(AR.weapon(equipped),p.afterWeapon);}
 walk(11,9);if(!veteran)cmd('start');if(earth&&(bow||veteran))cmd('class-choose',{id:bow?'magician':'hunter',confirm:true});cmd('pursuit-pin',{weapon:id});snap('01_KIT_PINNED');
 if(!veteran){const p=preview('Unowned longbow project','copper_bow');assert.equal(p.weapon,'trail_bow');assert.equal(p.after.attack,13);assert.equal(H.compare(sim.state.adventure,'copper_bow').selected.attack,21);}
 if(bow&&!veteran){for(const n of ['timber-1','timber-2','fibre-1','fibre-2','stone-1','stone-2'])gather(n);walk(11,9);snap('02_PREREQUISITE_READY');applyPreview(preview('Ashwood prerequisite','copper_bow'));cmd('equip',{id:'trail_bow'});sandbox('craft',{recipe:'plank'});}
 const beforeDamage=practice();assert.equal(beforeDamage,veteran?44:bow?13:16);snap('02_SOURCE_READY');
 const runs=veteran?3:5;
 for(let run=1;run<=runs;run++){
  walk(0,3);cmd('rest');walk(11,9);const after=sim.state.adventure.pursuit.claimed;cmd('pursuit-start',{after});const runId=sim.state.adventure.pursuit.active.id;snap('run'+run+'_01_STARTED');
  enter();walk(-7,3);fight('west');walk(-7,3);cmd('pursuit-sample',{run:runId,id:'west-sample'});snap('run'+run+'_02_PARTIAL');
  if(run===1){reload();assert.deepEqual(sim.state.adventure.pursuit.active.defeated,['west']);enter();}
  walk(5,-3);fight('east');walk(5,-11);cmd('pursuit-sample',{run:runId,id:'east-sample'});home();snap('run'+run+'_03_OBJECTIVES');
  reload();const before=balances();cmd('pursuit-claim',{run:runId});const paid=balances();assert.equal(paid.ore-before.ore,3);assert.equal(paid.coins-before.coins,4);assert.equal(paid.fiber-before.fiber,2);claims.push({run:runId,before,after:paid});
  const saved=JSON.stringify(sim.snapshot());assert.equal(sim.adventureCommand('new-request-'+variant+'-'+run,'pursuit-claim',{run:runId}).ok,false);assert.equal(JSON.stringify(sim.snapshot()),saved);
  assert.equal(sim.adventureCommand('stale-start-'+variant+'-'+run,'pursuit-start',{after}).ok,false);assert.equal(JSON.stringify(sim.snapshot()),saved);snap('run'+run+'_04_CLAIMED');
 }
 if(!veteran)applyPreview(preview('Base weapon craft',id));
 snap('03_BASE_CRAFTED');applyPreview(preview('Finite fitting I',id));snap('04_FITTING_1');reload();snap('05_READY_FINAL_FITTING');applyPreview(preview('Finite fitting II',id));assert.equal(H.nextStep(sim.state.adventure,id),null,'no invented third fitting');cmd('equip',{id});snap('06_EQUIPPED');reload();
 const afterDamage=practice();assert.equal(afterDamage,veteran?48:bow?25:27);snap('07_PRACTICE_PERSISTED');const final=sim.snapshot();
 assert.equal(final.adventure.xp,legacy.adventure.xp);assert.deepEqual(final.adventure.defeated,legacy.adventure.defeated);assert.deepEqual(final.adventure.starter,legacy.adventure.starter);
 for(const k of ['road','beacon','crossing','companion'])assert.deepEqual(final.adventure[k],legacy.adventure[k],k);
 for(const k of ['notes','score','scoreRevision','retreat','visitor','flowers'])assert.deepEqual(final[k],legacy[k],k);
 if(veteran){assert.deepEqual(final.adventure.arsenal,legacy.adventure.arsenal);assert.deepEqual(final.adventure.equipment,legacy.adventure.equipment);}
 const end=balances(),net={};for(const k of Object.keys(initial)){net[k]=transactions.reduce((n,t)=>n+t.after[k]-t.before[k],0);assert.equal(initial[k]+net[k],end[k],'accounting '+k);}
 if(!veteran){assert.equal(end.ore,2);assert.equal(end.coins,bow?2:4);assert.equal(end.fiber,bow?6:4);}
 const report={status:'passed',variant,earthRoute:earth,classPath:final.adventure.classPath.choice,commands:serial,positionEdits:0,inventoryGrants:0,plantedDefeats:0,acceleratedTick:true,source:veteran?{path:source,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')}:null,claimed:final.adventure.pursuit.claimed,beforeDamage,afterDamage,equipped:final.adventure.equipment.weapon,stats:A.stats(final.adventure),xp:final.adventure.xp,economy:{initial,end,net,surveys:{count:runs,ore:runs*3,coins:runs*4,fiber:runs*2},transactions},claims,combats,previews,actions};
 fs.writeFileSync(path.join(out,'PURSUIT_JOURNEY_REPORT.json'),JSON.stringify(report,null,2));return report;
}
if(require.main===module){const r=journey({bow:process.argv.includes('--bow'),veteran:process.argv.includes('--veteran'),earth:process.argv.includes('--earth')});console.log(JSON.stringify({...r,actions:undefined,economy:{...r.economy,transactions:undefined},claims:undefined,combats:undefined},null,2));}
module.exports={journey};
