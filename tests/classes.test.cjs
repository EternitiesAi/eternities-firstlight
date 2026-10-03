'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),T=require('../src/combat.js');
let seq=0;const act=(s,type,p={})=>s.adventureCommand('class-test-'+(++seq),type,p),K=()=>globalThis.RealmClasses;
const snap=s=>JSON.stringify(s.snapshot());
function begun(){const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};assert.equal(act(s,'start').ok,true);return s;}
function chosen(id='hunter'){const s=begun();assert.equal(act(s,'class-choose',{id,confirm:true}).ok,true);return s;}
function river(s){s.state.player={x:15,z:7,yaw:0};assert.equal(act(s,'starter-enter').ok,true);s.state.player={x:-5,z:12,yaw:0};assert.equal(act(s,'target-select',{id:'river-practice'}).ok,true);return s;}
const target=s=>T.selected(s);
// Labelled synthetic boundaries below; classes_journey separately earns progression.
test('version6 migrates to current schema with no inferred class and all banked XP intact',()=>{
 assert.equal(A.VERSION,12);
 for(const xp of [0,29,30,79,80,149,150,259,260,9999]){const w=C.fresh();w.adventure.version=6;delete w.adventure.classPath;w.adventure.xp=xp;w.notes=[{text:'intact',day:1}];const bytes=JSON.stringify(w),out=C.validate(w);assert.deepEqual(out.adventure.classPath,{version:1,choice:null,readyAt:0});assert.equal(out.adventure.xp,xp);assert.equal(A.level(out.adventure),1+[30,80,150,260].filter(n=>xp>=n).length);const prior={...out.adventure};delete prior.classPath;prior.version=6;assert.deepEqual(prior,w.adventure);assert.deepEqual(out.notes,w.notes);assert.equal(JSON.stringify(w),bytes);}
});
test('class choice requires kit, proximity, known ID and explicit confirmation atomically',()=>{
 const raw=new C.Simulation();raw.state.player={x:11,z:9,yaw:0};let before=snap(raw);assert.equal(act(raw,'class-choose',{id:'hunter',confirm:true}).ok,false);assert.equal(snap(raw),before);
 const s=begun();for(const p of [{id:'hunter'},{id:'hunter',confirm:'yes'},{id:'__proto__',confirm:true}]){before=snap(s);assert.equal(act(s,'class-choose',p).ok,false);assert.equal(snap(s),before);}s.state.player={x:0,z:3,yaw:0};before=snap(s);assert.equal(act(s,'class-choose',{id:'hunter',confirm:true}).ok,false);assert.equal(snap(s),before);
});
for(const id of ['hunter','magician'])test(id+' is deliberate, one-time, reloadable and grants no gear/history/XP',()=>{
 const s=begun(),a=s.state.adventure,before=structuredClone(a),world=structuredClone(s.state);s.paused=true;assert.equal(act(s,'class-choose',{id,confirm:true}).ok,true);assert.equal(a.classPath.choice,id);for(const k of ['owned','equipment','starter','pursuit','arsenal','xp','companion','beacon','road','crossing'])assert.deepEqual(a[k],before[k]);for(const k of ['sandbox','score','notes','retreat','visitor'])assert.deepEqual(s.state[k],world[k]);const after=snap(s);assert.equal(act(s,'class-choose',{id,confirm:true}).ok,false);assert.equal(act(s,'class-choose',{id:id==='hunter'?'magician':'hunter',confirm:true}).ok,false);assert.equal(snap(s),after);assert.equal(new C.Simulation(s.snapshot()).state.adventure.classPath.choice,id);
});
test('invalid class state and impossible unstarted class are refused',()=>{
 for(const path of [{version:2,choice:null,readyAt:0},{version:1,choice:'__proto__',readyAt:0},{version:1,choice:null,readyAt:1},{version:1,choice:'hunter',readyAt:-1},{version:1,choice:'hunter',readyAt:Infinity}]){const a=A.fresh();a.classPath=path;assert.throws(()=>A.validate(a),/class/i);}const a=A.fresh();a.classPath.choice='hunter';assert.throws(()=>A.validate(a),/class/i);
});
test('technique refuses unassigned, wrong scene, pause, death and absent target',()=>{
 for(const s of [river(begun()),chosen(),river(chosen())]){if(s.room&&s.state.adventure.classPath.choice)act(s,'target-clear');const before=snap(s);assert.equal(act(s,'class-technique').ok,false);assert.equal(snap(s),before);}
 const s=river(chosen());s.paused=true;let before=snap(s);assert.equal(act(s,'class-technique').ok,false);assert.equal(snap(s),before);s.paused=false;s.state.adventure.hp=0;before=snap(s);assert.equal(act(s,'class-technique').ok,false);assert.equal(snap(s),before);
});
for(const id of ['hunter','magician'])test(id+' validates range, LOS, stamina and durable cooldown before paying',()=>{
 const s=river(chosen(id)),a=s.state.adventure,e=target(s);a.stamina=0;let before=snap(s);assert.equal(act(s,'class-technique').ok,false);assert.equal(snap(s),before);a.stamina=100;e.x=8;e.z=-10;before=snap(s);assert.equal(act(s,'class-technique').ok,false);assert.equal(snap(s),before);
 s.state.player={x:-1,z:3,yaw:0};e.x=-1;e.z=-1;assert.equal(A.visible(s,s.state.player,e),false);before=snap(s);assert.equal(act(s,'class-technique').ok,false);assert.equal(snap(s),before);e.x=-5;e.z=10;s.state.player={x:-5,z:12,yaw:0};assert.equal(act(s,'class-technique').ok,true);const paid=a.classPath.readyAt;before=snap(s);assert.equal(act(s,'class-technique').ok,false);assert.equal(snap(s),before);const cold=new C.Simulation(s.snapshot());river(cold);assert.equal(cold.state.adventure.classPath.readyAt,paid);before=snap(cold);assert.equal(act(cold,'class-technique').ok,false);assert.equal(snap(cold),before);
});
test('hunter marks without a hit and only the next actual blade impact gains bounded damage',()=>{
 const s=river(chosen()),a=s.state.adventure;assert.equal(act(s,'class-technique').ok,true);assert.equal(T.runtime(s).hits.length,0);assert.equal(a.stamina,85);assert.equal(act(s,'attack',{target:target(s).id}).ok,true);assert.equal(A.runtime(s).training.lastDamage,24);assert.equal(K().status(s).markedTarget,null);a.elapsed+=1;assert.equal(act(s,'attack',{target:target(s).id}).ok,true);assert.equal(A.runtime(s).training.lastDamage,16);
});
test('hunter mark is not consumed by another target, companion or soul damage',()=>{
 const s=river(chosen()),e=target(s);act(s,'class-technique');A.damageEnemy(s,e,5);assert.equal(A.runtime(s).training.lastDamage,5);assert.equal(K().status(s).markedTarget,e.id);const other={...e,id:'different'};A.damageEnemy(s,other,16,'weapon');assert.equal(K().status(s).markedTarget,e.id);A.damageEnemy(s,e,100,'weapon');assert.equal(A.runtime(s).training.lastDamage,124);assert.equal(K().status(s).markedTarget,null);
});
test('bow mark follows swept collision, with no payout on a missed arrow',()=>{
 const s=river(chosen()),a=s.state.adventure;a.owned.push('trail_bow');act(s,'equip',{id:'trail_bow'});const e=target(s);act(s,'class-technique');assert.equal(act(s,'attack',{target:e.id}).ok,true);assert.equal(T.runtime(s).hits.length,0);e.x=0;AR.update(s,.2);assert.equal(T.runtime(s).hits.length,0);assert.equal(K().status(s).markedTarget,e.id);A.runtime(s).arrows=[];e.x=-5;a.elapsed+=1;assert.equal(act(s,'attack',{target:e.id}).ok,true);AR.update(s,.15);assert.equal(A.runtime(s).training.lastDamage,20);assert.equal(K().status(s).markedTarget,null);
});
test('an obstructed arrow cannot consume mark or make confirmed-hit feedback',()=>{
 const s=river(chosen()),a=s.state.adventure;a.owned.push('trail_bow');act(s,'equip',{id:'trail_bow'});const e=target(s);act(s,'class-technique');act(s,'attack',{target:e.id});const shot=A.runtime(s).arrows[0];shot.x=-1;shot.z=3;shot.dx=0;shot.dz=-1;e.x=-1;e.z=-1;AR.update(s,.3);assert.equal(T.runtime(s).hits.length,0);assert.equal(K().status(s).markedTarget,e.id);assert.equal(A.runtime(s).fx.some(f=>f.kind==='arrow-hit'),false);
});
test('marks expire and cannot cross scene, run identity or reload',()=>{
 const s=river(chosen());act(s,'class-technique');s.state.adventure.elapsed+=8;assert.equal(K().status(s).markedTarget,null);act(s,'class-technique');s.room='mine';A.syncScene(s);assert.equal(K().status(s).markedTarget,null);s.room='riverbank';A.syncScene(s);assert.equal(K().status(s).markedTarget,null);assert.equal(K().status(new C.Simulation(s.snapshot())).markedTarget,null);
});
test('magician creates one actual damage event, faces target and never spawns an arrow',()=>{
 const s=river(chosen('magician')),a=s.state.adventure;assert.equal(act(s,'class-technique').ok,true);assert.equal(A.runtime(s).training.lastDamage,20);assert.equal(a.stamina,75);assert.equal(T.runtime(s).hits.length,1);assert.equal(A.runtime(s).arrows.length,0);assert.equal(a.classPath.readyAt,10);assert.equal(s.state.player.yaw,Math.PI);assert.equal(A.runtime(s).fx.some(f=>f.kind==='arcane-flare'),true);
});
test('class techniques do not earn the archery medal and leave weapon family free',()=>{
 const s=chosen('magician');assert.equal(act(s,'range-enter').ok,true);const e=A.runtime(s).enemies[0];s.state.player={x:e.x,z:e.z+2,yaw:0};act(s,'target-select',{id:e.id});const before=snap(s);assert.equal(act(s,'class-technique').ok,false);assert.equal(snap(s),before);assert.equal(s.state.adventure.arsenal.rangeMedal,false);
});
