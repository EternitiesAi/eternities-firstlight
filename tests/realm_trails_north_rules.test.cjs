/* Focused rules tests. Unit proximity/invalid-save setups below are labelled
 * synthetic fixtures; they are not evidence of earned story claims. The
 * separate realm_trails_journey uses no position, HP, inventory or death edits. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),T=require('../src/combat.js');
const W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js'),RC=require('../src/realm-craft.js');
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs');
const copy=o=>JSON.parse(JSON.stringify(o)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const kitCache=new Map();
function kit(bow=false){if(!kitCache.has(bow)){const h=createHarness();earnedKit(h,bow);kitCache.set(bow,h.sim.snapshot());}return copy(kitCache.get(bow));}
function unit(realm='hell',bow=false){
 const h=createHarness(kit(bow));h.enter(realm);const d=R.definitions().find(d=>d.realm===realm);
 const place=p=>{assert.ok(W.walkable(h.sim.room,p.x,p.z),'synthetic unit proximity uses physically supported coordinates');h.sim.state.player={x:p.x,z:p.z,yaw:0};h.sim.playerPath=[];};
 const act=(type,p={},save=h.save)=>R.command(h.context(),type,{quest:d.id,...p},{save});
 const step=id=>{const s=d.steps.find(s=>s.id===id);place(s);const result=act('step',{step:id});assert.ok(result.ok,result.error);return result;};
 const accept=()=>{place(d.giver);assert.ok(act('accept').ok);};
 const prepare=()=>{accept();for(const id of d.enemy.spawnAfter)step(id);return A.runtime(h.sim).enemies.find(e=>e.id===d.enemy.id);};
 const defeat=()=>{
  const e=A.runtime(h.sim).enemies.find(e=>e.id===d.enemy.id);assert.ok(e);place({x:e.x,z:e.z+1.1});
  let frames=0;while(!h.sim.state.realmTrails.records[d.id].steps.includes(d.enemy.defeatStep)&&frames++<500){
   if(h.sim.state.adventure.elapsed>=A.runtime(h.sim).cooldowns.attack&&(d.realm!=='heaven'||e.mode==='recover'&&e.timer>0))h.command('attack',{target:e.id});h.tick(.05);
  }
  assert.ok(frames<500&&e.hp===0,'actual production weapon damage disables the unit-fixture enemy');return e;
 };
 return {h,d,place,act,step,accept,prepare,defeat,record:()=>h.sim.state.realmTrails.records[d.id]};
}
function until(h,predicate,max=600){let frames=0;while(!predicate()&&frames++<max)h.tick(.05);assert.ok(frames<max,'bounded production ticks satisfy condition');return frames;}
function escortReady(){const u=unit();u.prepare();u.defeat();u.step(u.d.escort.startStep);return u;}

test('acceptance needs the correct realm, initial kit and physical giver; inspecting/failed actions remain inert',()=>{
 const u=unit('heaven'),{h,d}=u,before=h.sim.snapshot();
 assert.equal(u.act('accept').ok,false);assert.deepEqual(h.sim.snapshot(),before);
 assert.equal(u.act('step',{step:'relay-west'}).ok,false);assert.deepEqual(h.sim.snapshot(),before);
 assert.equal(R.command(h.context(),'accept',{quest:'hell-open-cage-v1'},{save:h.save}).ok,false);
 assert.deepEqual(h.sim.snapshot(),before);u.accept();const accepted=h.sim.snapshot();
 assert.equal(u.act('accept').duplicate,true);assert.deepEqual(h.sim.snapshot(),accepted);
 const raw=C.fresh(),fresh=new C.Simulation(raw);fresh.room='world-heaven';fresh.returnPos=raw.player;fresh.state.player={...d.giver,yaw:0};
 assert.equal(R.command({sim:fresh},'accept',{quest:d.id},{save:()=>({ok:true})}).ok,false,'no unearned initial gear access');
});

test('interactions require actual proximity and all DAG preparations; combat/escort steps cannot be clicked complete',()=>{
 const u=unit();u.accept();const accepted=u.h.sim.snapshot();
 assert.equal(u.act('step',{step:'contact-neris'}).ok,false);assert.deepEqual(u.h.sim.snapshot(),accepted);
 u.place(u.d.steps.find(s=>s.id==='cooling'));const remote=u.h.sim.snapshot();
 assert.equal(u.act('step',{step:'cooling'}).ok,false);assert.deepEqual(u.h.sim.snapshot(),remote);
 for(const id of['disable-reeve','refuge-arrival','unknown-step'])assert.equal(u.act('step',{step:id}).ok,false);
 u.step('contact-neris');assert.equal(A.runtime(u.h.sim).enemies.some(e=>e.trailQuest===u.d.id),false);
 u.step('cooling');u.step('clamp-west');assert.equal(R.enemies(u.h.sim).length,0);
 u.step('clamp-east');assert.equal(R.enemies(u.h.sim).filter(e=>e.id===u.d.enemy.id).length,1);
});

test('strict escort history rejects impossible arrival/checkpoint records while legacy saves migrate without trail credit',()=>{
 const raw=kit(),d=R.definition('hell-open-cage-v1'),record=raw.realmTrails.records[d.id];
 record.accepted=true;record.steps=[...d.enemy.spawnAfter,d.enemy.defeatStep,d.escort.startStep];
 for(const edit of[q=>{q.checkpoint=d.escort.route.length-1;},q=>{q.steps.push(d.escort.arrivalStep);},q=>{q.checkpoint=1;q.steps=q.steps.filter(id=>id!==d.escort.startStep);},q=>{q.assisted=true;}]){
  const bad=copy(raw);edit(bad.realmTrails.records[d.id]);assert.throws(()=>C.validate(bad),/realm trails/);
 }
 const valid=copy(raw);valid.realmTrails.records[d.id].checkpoint=1;assert.doesNotThrow(()=>C.validate(valid));
 const legacy=kit();delete legacy.realmTrails;legacy.adventure.version=10;delete legacy.adventure.realmCraft;
 const migrated=C.validate(legacy);assert.equal(migrated.adventure.version,11);assert.deepEqual(migrated.realmTrails,R.fresh());
 assert.deepEqual(migrated.adventure.realmCraft,RC.fresh());
 for(const key of['xp','coins','ore','owned','equipment','arsenal','pursuit','starter','defeated','drops'])assert.deepEqual(migrated.adventure[key],legacy.adventure[key]);
});

test('story death accepts only the current actual zero-HP actor; replay has no legacy loot or payout',()=>{
 const u=unit(),e=u.prepare(),before=copy(u.record());
 assert.equal(R.defeat(u.h.sim,{...e,hp:0}),false,'detached forged actor cannot record defeat');
 assert.equal(R.defeat(u.h.sim,e),false,'living actor cannot record defeat');assert.deepEqual(u.record(),before);
 const old=copy({xp:u.h.sim.state.adventure.xp,coins:u.h.sim.state.adventure.coins,ore:u.h.sim.state.adventure.ore,defeated:u.h.sim.state.adventure.defeated,drops:u.h.sim.state.adventure.drops});
 u.defeat();const snapshot=u.h.sim.snapshot();assert.equal(R.defeat(u.h.sim,e),false,'removed actor cannot issue another current-runtime death');assert.deepEqual(u.h.sim.snapshot(),snapshot);
 assert.deepEqual({xp:u.h.sim.state.adventure.xp,coins:u.h.sim.state.adventure.coins,ore:u.h.sim.state.adventure.ore,defeated:u.h.sim.state.adventure.defeated,drops:u.h.sim.state.adventure.drops},old);
 u.h.reload('hell');assert.ok(!A.runtime(u.h.sim).enemies.some(enemy=>enemy.id===e.id),'cold reload retains the local story dead record');
});

test('Heaven closed bearing records no hit; actual pulse recovery is 1.8 and preparation changes a later real opening to 2.6',()=>{
 const u=unit('heaven'),e=u.prepare();u.place({x:e.x,z:e.z+1.1});
 const hp=e.hp,hits=T.runtime(u.h.sim).hits.length;u.h.command('attack',{target:e.id});assert.equal(e.hp,hp);assert.equal(T.runtime(u.h.sim).hits.length,hits);
 u.h.tick(.6);assert.equal(e.mode,'windup');u.h.command('attack',{target:e.id});assert.equal(e.hp,hp);assert.equal(T.runtime(u.h.sim).hits.length,hits);
 until(u.h,()=>e.mode==='recover');assert.equal(e.timer,1.8,'actual AI pulse starts default recovery');
 u.h.command('attack',{target:e.id});assert.ok(e.hp<hp);assert.ok(T.runtime(u.h.sim).hits.length>hits);
 const partial=e.hp,mode=e.mode,timer=e.timer;u.step('spillway');
 assert.strictEqual(A.runtime(u.h.sim).enemies.find(enemy=>enemy.id===e.id),e);assert.equal(e.hp,partial);assert.equal(e.mode,mode);assert.equal(e.timer,timer);
 assert.equal(e.recovery,2.6);u.place({x:e.x,z:e.z+1.1});
 until(u.h,()=>e.mode==='windup');until(u.h,()=>e.mode==='recover');assert.equal(e.timer,2.6,'a later actual pulse starts the longer opening');
});

test('same-room story roster update preserves current enemy HP/intent, real arrow, companion, effects and invincibility',()=>{
 const u=unit('hell',true);u.accept();for(const id of u.d.enemy.spawnAfter.slice(0,-1))u.step(id);
 const runtime=A.runtime(u.h.sim),old=runtime.enemies.find(e=>e.id==='hell-salvage-sentinel');u.place({x:old.x,z:old.z+4});
 u.h.command('attack',{target:old.id});u.h.tick(1);assert.ok(old.hp>0&&old.hp<old.maxHP,'real arrow creates partial ordinary enemy HP');
 u.h.command('dodge',{dx:0,dz:1});u.h.command('attack',{target:old.id});assert.ok(AR.runtime(u.h.sim).arrows.length>0,'actual second arrow is in flight');
 const saved={enemy:old,hp:old.hp,mode:old.mode,timer:old.timer,aim:copy(old.aim),arrows:runtime.arrows,fx:runtime.fx,companion:runtime.companion,invincible:runtime.invincible};
 u.step(u.d.enemy.spawnAfter.at(-1));
 assert.strictEqual(runtime.enemies.find(e=>e.id===old.id),saved.enemy);assert.equal(old.hp,saved.hp);assert.equal(old.mode,saved.mode);assert.equal(old.timer,saved.timer);assert.deepEqual(old.aim,saved.aim);
 assert.strictEqual(runtime.arrows,saved.arrows);assert.ok(runtime.arrows.length>0);assert.strictEqual(runtime.fx,saved.fx);
 assert.strictEqual(runtime.companion,saved.companion);assert.equal(runtime.invincible,saved.invincible);
});

test('missing or refused durable combat saver cannot manufacture a defeat; successful retry records it once',()=>{
 for(const missing of[true,false]){
  const u=unit(),e=u.prepare(),history=copy(u.record());u.place({x:e.x,z:e.z+1.1});
  if(missing)delete u.h.sim.realmTrailSave;else u.h.sim.realmTrailSave=()=>({ok:false,error:'labelled refused memory saver'});
  until(u.h,()=>{if(u.h.sim.state.adventure.elapsed>=A.runtime(u.h.sim).cooldowns.attack)u.h.command('attack',{target:e.id});return e.hp===1;},300);
  assert.deepEqual(u.record(),history,'uncommitted death checkpoint is not adopted');assert.equal(e.hp,1,'actor remains alive and retryable');
  u.h.sim.realmTrailSave=u.h.save;until(u.h,()=>{if(u.h.sim.state.adventure.elapsed>=A.runtime(u.h.sim).cooldowns.attack)u.h.command('attack',{target:e.id});return e.hp===0;},40);
  assert.ok(u.record().steps.includes(u.d.enemy.defeatStep));
 }
});

test('real Neris waits for distance and explicit wait/follow; player-only arrival cannot finish rescue',()=>{
 const u=escortReady(),actor=R.escort(u.h.sim),start=copy(actor);assert.strictEqual(R.escort(u.h.sim),actor,'same transient live ally identity');
 u.place(u.d.escort.route.at(-1));u.h.tick(.3);assert.equal(distance(R.escort(u.h.sim),start),0);assert.match(actor.status,/Waiting for you/);
 assert.equal(u.record().steps.includes(u.d.escort.arrivalStep),false,'player at Refuge grants no arrival');
 u.place(actor);assert.ok(u.act('escort-wait').ok);u.h.tick(.3);assert.equal(distance(R.escort(u.h.sim),start),0);
 assert.ok(u.act('escort-follow').ok);u.h.tick(.2);assert.ok(distance(R.escort(u.h.sim),start)>0,'actual ally resumes physical advance');
 u.h.escortWalk(u.d);assert.ok(u.record().steps.includes(u.d.escort.arrivalStep));assert.equal(u.record().assisted,false);
 assert.ok(distance(R.escort(u.h.sim),u.d.escort.route.at(-1))<.3);
});

test('actual ordinary sentinel death stops escort; cold reload/revive resumes durable safe checkpoint and owns a fresh actor',()=>{
 const u=escortReady(),oldActor=R.escort(u.h.sim);u.h.tick(.3);
 const oldDeaths=u.h.sim.state.adventure.deaths,possessions=copy({owned:u.h.sim.state.adventure.owned,equipment:u.h.sim.state.adventure.equipment,arsenal:u.h.sim.state.adventure.arsenal,pursuit:u.h.sim.state.adventure.pursuit,defeated:u.h.sim.state.adventure.defeated,drops:u.h.sim.state.adventure.drops});
 const ordinary=A.runtime(u.h.sim).enemies.find(e=>e.id==='hell-salvage-sentinel');u.h.walk(ordinary.home.x,ordinary.home.z+1.1);
 until(u.h,()=>u.h.sim.state.adventure.hp===0,2200);const stopped=copy(R.escort(u.h.sim)),ledger=copy(u.record());u.h.tick(.5);
 assert.equal(u.h.sim.state.adventure.deaths,oldDeaths+1,'real incoming hits record exactly one fall');
 assert.equal(distance(R.escort(u.h.sim),stopped),0,'actual fall stops ally advancement');
 u.h.reload();assert.equal(u.h.sim.state.adventure.hp,0);u.h.command('revive');u.h.walk(W.GATE.x,W.GATE.z);u.h.enter('hell');
 assert.deepEqual({owned:u.h.sim.state.adventure.owned,equipment:u.h.sim.state.adventure.equipment,arsenal:u.h.sim.state.adventure.arsenal,pursuit:u.h.sim.state.adventure.pursuit,defeated:u.h.sim.state.adventure.defeated,drops:u.h.sim.state.adventure.drops},possessions,'death/reload/revive preserves identity, sockets, prior fittings and reward ownership');
 assert.deepEqual(u.record(),ledger);const resumed=R.escort(u.h.sim);assert.notStrictEqual(resumed,oldActor,'new simulation owns its own transient actor');
 assert.equal(distance(resumed,u.d.escort.route[ledger.checkpoint]),0,'reload reconstructs the saved safe checkpoint');
 assert.ok(!A.runtime(u.h.sim).enemies.some(e=>e.id===u.d.enemy.id),'resolved route Reeve stays disabled after death/reload');
});

test('refused checkpoint save stays retryable; actual arrival can only be adopted after saver accepts',()=>{
 const u=escortReady();u.h.sim.realmTrailSave=()=>({ok:false,error:'labelled checkpoint refusal'});
 const next=u.d.escort.route[1];u.h.walk(next.x,next.z);
 // Stay on the supported path near the actual actor to let it reach next.
 u.place(R.escort(u.h.sim));until(u.h,()=>/save refused/.test(R.escort(u.h.sim).status),700);
 assert.equal(u.record().checkpoint,0);assert.equal(u.record().steps.includes(u.d.escort.arrivalStep),false);
 u.h.sim.realmTrailSave=u.h.save;until(u.h,()=>u.record().checkpoint===1,50);
 assert.equal(distance(R.escort(u.h.sim),u.d.escort.route[1]),0);
});

test('explicit assisted extraction is distinct, actual Refuge placement and save-atomic; completion survives unpaid reload',()=>{
 const u=escortReady(),before=u.h.sim.snapshot(),actor=copy(R.escort(u.h.sim));
 assert.equal(u.act('assist',{},()=>({ok:false,error:'labelled extraction refusal'})).ok,false);
 assert.deepEqual(u.h.sim.snapshot(),before);assert.equal(distance(actor,R.escort(u.h.sim)),0);
 assert.ok(u.act('assist').ok);assert.equal(u.record().assisted,true);assert.ok(u.record().steps.includes(u.d.escort.arrivalStep));
 assert.equal(distance(R.escort(u.h.sim),u.d.escort.route.at(-1)),0,'explicit extraction visibly projects actual ally at Refuge');
 const ready=copy(u.record());u.h.reload('hell');assert.deepEqual(u.record(),ready);assert.equal(u.record().claimed,false);
});

test('ready claim is physical, atomic, once-only and retained on capacity/save refusal and cold replay',()=>{
 const u=escortReady();assert.ok(u.act('assist').ok);let before=u.h.sim.snapshot();
 assert.equal(u.act('claim').ok,false);assert.deepEqual(u.h.sim.snapshot(),before);u.place(u.d.giver);before=u.h.sim.snapshot();
 assert.equal(u.act('claim',{},()=>({ok:false,error:'labelled claim refusal'})).ok,false);assert.deepEqual(u.h.sim.snapshot(),before);
 const a=u.h.sim.state.adventure,balance=copy({xp:a.xp,coins:a.coins,ore:a.ore});assert.ok(u.act('claim').ok);
 for(const key of['xp','coins','ore'])assert.equal(u.h.sim.state.adventure[key]-balance[key],u.d.reward[key]);
 const paid=u.h.sim.snapshot();assert.equal(u.act('claim').duplicate,true);assert.deepEqual(u.h.sim.snapshot(),paid);
 u.h.reload('hell');u.place(u.d.giver);const cold=u.h.sim.snapshot();assert.equal(u.act('claim').duplicate,true);assert.deepEqual(u.h.sim.snapshot(),cold);
 const cap=escortReady();assert.ok(cap.act('assist').ok);cap.place(cap.d.giver);cap.h.sim.state.adventure.coins=9999;const saturated=cap.h.sim.snapshot();
 assert.equal(cap.act('claim').ok,false);assert.deepEqual(cap.h.sim.snapshot(),saturated,'labelled capacity fixture retains ready unpaid work');
});

test('finite fitting preserves selected identity, actual prior socket, validated prior pursuit bonus and global once limit',()=>{
 const u=unit('hell',true);u.prepare();u.defeat();u.step(u.d.escort.startStep);assert.ok(u.act('assist').ok);u.place(u.d.giver);assert.ok(u.act('claim').ok);u.h.home();u.h.walk(11,9);
 // Labelled valid prior-work fixture tests preservation, not how that older
 // pursuit reward was earned. The bow/socket themselves were command-earned.
 u.h.sim.state.adventure.pursuit={version:1,pinned:'trail_bow',claimed:2,active:null,fittings:{trail_bow:2}};C.validate(u.h.sim.snapshot());
 const before=u.h.sim.snapshot(),stats=A.stats(before.adventure),weapon=before.adventure.equipment.weapon;
 assert.equal(before.adventure.arsenal.sockets[weapon],'amber');
 assert.ok(RC.command(u.h.context(),weapon,{save:u.h.save}).ok);const after=u.h.sim.snapshot();
 assert.equal(A.stats(after.adventure).attack-stats.attack,3);assert.equal(before.adventure.coins-after.adventure.coins,8);assert.equal(before.adventure.ore-after.adventure.ore,3);
 for(const key of['equipment','owned','arsenal','pursuit','starter'])assert.deepEqual(after.adventure[key],before.adventure[key]);
 assert.equal(after.adventure.realmCraft.weapon,weapon);assert.equal(RC.command(u.h.context(),'trail_blade',{save:u.h.save}).ok,false);
 assert.deepEqual(u.h.sim.snapshot(),after,'second selected weapon cannot receive another realm fitting');
 u.h.reload();assert.equal(A.stats(u.h.sim.state.adventure).attack-stats.attack,3);
});
