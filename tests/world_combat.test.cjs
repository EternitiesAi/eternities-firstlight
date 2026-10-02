/* Command-earned combat through production movement, targeting and ticks.
 * Synthetic fresh worlds only; accelerated time is not a human feel test.
 * No player-position edits, health/gear grants, planted defeats or art authority.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js');
const T=require('../src/combat.js'),S=require('../src/sandbox.js'),W=require('../src/world-foundations.js');
let serial=0;
const earned=new Map(),copy=o=>JSON.parse(JSON.stringify(o));
const command=(sim,type,payload={})=>{
 const result=sim.adventureCommand('world-combat-'+(++serial),type,payload);
 assert.ok(result.ok,type+': '+result.error);return result;
};
function tick(sim,seconds){for(let i=0;i<Math.ceil(seconds/.05);i++)sim.tick(.05);}
function until(sim,predicate,seconds,label){
 for(let i=0;i<Math.ceil(seconds/.05)&&!predicate();i++)sim.tick(.05);
 assert.ok(predicate(),label);assert.ok(sim.state.adventure.hp>0,'traveller survives '+label);
}
function walk(sim,x,z){
 const route=sim.moveTo(x,z);assert.ok(route.ok,'walk '+x+','+z+': '+route.error);
 for(let i=0;sim.playerPath.length&&i<10000;i++){
  const from={...sim.state.player};sim.tick(.05);
  if(W.handles(sim.room))assert.ok(W.segment(sim.room,from,sim.state.player),'actual movement segment remains supported');
  assert.ok(sim.state.adventure.hp>0,'walking never relies on a dead traveller');
 }
 assert.equal(sim.playerPath.length,0,'route finishes');
 assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.25,'arrived at '+x+','+z);
}
function fixture(style){
 if(!earned.has(style)){
  const sim=new C.Simulation();walk(sim,11,9);command(sim,'start');
  assert.equal(sim.state.adventure.equipment.weapon,'trail_blade');
  if(style==='bow'){
   // Same gathering/recipe path as starter_journey; this fixture earns it again.
   for(const id of ['timber-1','timber-2','fibre-1','fibre-2','stone-1','stone-2']){
    const node=S.NODES.find(n=>n.id===id);walk(sim,node.x+1.1,node.z);
    const state=sim.state.sandbox.nodes.find(n=>n.id===id);
    while(state.hp){
     tick(sim,.45);
     const result=sim.sandboxCommand('world-combat-gather-'+(++serial),'gather',{node:id});
     assert.ok(result.ok,id+': '+result.error);
    }
   }
   walk(sim,11,9);const before=copy(sim.state.sandbox.inventory);
   command(sim,'arsenal-craft',{id:'trail_bow'});command(sim,'equip',{id:'trail_bow'});
   for(const [kind,n] of Object.entries(AR.RECIPES.trail_bow.materials))assert.equal(before[kind]-sim.state.sandbox.inventory[kind],n,'declared crafting cost '+kind);
   assert.ok(sim.state.sandbox.stats.gathered>=20,'bow material came from real gathering');
  }
  assert.equal(AR.weapon(sim.state.adventure).style,style);
  walk(sim,W.GATE.x,W.GATE.z);earned.set(style,sim.snapshot());
 }
 return new C.Simulation(earned.get(style));
}
function enter(sim,id){
 const context={sim,active:'synthetic-world-combat',revision:1},preview=W.preview(context,id);
 assert.ok(preview.ok,preview.error);
 const result=W.enter(preview.ticket,context,{save:candidate=>{C.validate(candidate);return{ok:true};},build:()=>{}});
 assert.ok(result.ok,result.error);assert.equal(sim.room,W.definition(id).room);
}
function legacy(sim){
 const a=sim.state.adventure;
 return copy(Object.fromEntries(['xp','coins','ore','drops','defeated','owned','equipment','arsenal','starter','pursuit','classPath','reward','relic','angelSeen','road','beacon','crossing','companion'].map(k=>[k,a[k]])));
}
function approach(sim,enemy,style){
 const home=enemy.home;walk(sim,home.x,home.z+12);
 const point={x:home.x,z:home.z+(style==='bow'?4:1.1)};
 assert.ok(W.walkable(sim.room,point.x,point.z),'supported battle position');
 walk(sim,point.x,point.z);command(sim,'target-select',{id:enemy.id});
 assert.equal(T.selected(sim),enemy,'selected canonical runtime enemy');
}
function braceAgainstRealTell(sim,enemy){
 until(sim,()=>enemy.mode==='windup'&&Math.hypot(enemy.aim.x-sim.state.player.x,enemy.aim.z-sim.state.player.z)<.1,6,'actual locked enemy tell');
 const hp=sim.state.adventure.hp,stamina=sim.state.adventure.stamina,at=sim.state.adventure.elapsed,aim={...enemy.aim},windupRemaining=enemy.timer;
 command(sim,'guard');assert.equal(stamina-sim.state.adventure.stamina,T.skills.guard.cost);
 until(sim,()=>sim.state.adventure.hp<hp,2,'actual guarded incoming hit');
 const damage=Math.max(1,enemy.damage-A.stats(sim.state.adventure).defense);
 assert.equal(hp-sim.state.adventure.hp,Math.max(1,Math.ceil(damage*.5)),'Brace mitigates actual encounter damage');
 return {at,aim,windupRemaining,hitAfter:sim.state.adventure.elapsed-at,healthBefore:hp,healthAfter:sim.state.adventure.hp,recoveryRemaining:enemy.timer};
}
function autoUntil(sim,enemy,style,done,label){
 command(sim,'auto-toggle');assert.equal(T.runtime(sim).auto,true);
 const position={...sim.state.player},hp=enemy.hp;
 let arrowBeforeImpact=false,hits=0,lastHit=0,lastHP=hp,firstArrowAfter=null;
 const at=sim.state.adventure.elapsed,impacts=[];
 for(let i=0;i<400&&!done();i++){
  sim.tick(.05);
  if(AR.runtime(sim).arrows.some(a=>a.room===sim.room)&&enemy.hp===hp){arrowBeforeImpact=true;firstArrowAfter??=sim.state.adventure.elapsed-at;}
  if(enemy.hp<lastHP){impacts.push({after:sim.state.adventure.elapsed-at,before:lastHP,hp:enemy.hp});lastHP=enemy.hp;}
  const hit=T.runtime(sim).hits.at(-1);if(hit&&hit.id!==lastHit){hits++;lastHit=hit.id;}
  assert.equal(sim.state.player.x,position.x,'stationary autoattack does not walk');
  assert.equal(sim.state.player.z,position.z,'stationary autoattack does not walk');
  assert.ok(sim.state.adventure.hp>0,'survives '+label);
 }
 assert.ok(done(),label);assert.ok(enemy.hp<hp,'production attacks lower real HP');
 assert.ok(hits>0,'confirmed production hit feedback');
 if(style==='bow')assert.ok(arrowBeforeImpact,'real projectile exists before the confirmed impact');
 return {hits,hp,firstArrowAfter,impacts};
}
function freeHome(sim,home){
 assert.ok(W.leave(sim).ok);assert.equal(sim.room,null);
 assert.deepEqual(sim.state.player,home,'free home return preserves the saved home anchor');
 assert.equal(sim.worldTrip,undefined);assert.equal(sim.returnPos,null);
 assert.equal(T.runtime(sim).target,null);assert.equal(T.runtime(sim).auto,false);
}

test('every accepted objective has a validated production path back to its own giver',()=>{
 for(const id of W.IDS){
  const d=W.definition(id),giver=d.points.find(p=>p.id===d.quest.giverId),room={id:d.room};
  for(const objective of d.quest.objectives){
   const point=d.points.find(p=>p.id===objective.pointId),path=C.pathfind(point,giver,room);
   assert.ok(path,id+' '+point.id+' -> '+giver.id);
   let from=point;for(const to of path){assert.ok(C.segment(from,to,room),id+' return segment');from=to;}
   assert.ok(Math.hypot(from.x-giver.x,from.z-giver.z)<.001);
  }
 }
});

for(const [realm,style] of [['hell','blade'],['earthlands','bow']])test(style+' falls in '+realm+' and revives at home with accepted work and belongings retained',()=>{
 const sim=fixture(style),before=legacy(sim),d=W.definition(realm),giver=d.points.find(p=>p.id===d.quest.giverId),objective=d.quest.objectives[0],point=d.points.find(p=>p.id===objective.pointId);
 enter(sim,realm);walk(sim,giver.x,giver.z);
 const ctx={sim,active:'synthetic-world-death',revision:1},save=candidate=>{C.validate(candidate);return{ok:true};};
 assert.ok(W.command(ctx,'accept',{realm},{save}).ok);walk(sim,point.x,point.z);
 assert.ok(W.command(ctx,'observe',{realm,run:1,objective:objective.id},{save}).ok);
 const accepted=copy(sim.state.journeys),deaths=sim.state.adventure.deaths,enemy=A.runtime(sim).enemies.find(e=>e.id===d.enemies[0].id);
 approach(sim,enemy,'blade');
 for(let i=0;i<3600&&sim.state.adventure.hp>0;i++)sim.tick(.05);
 assert.equal(sim.state.adventure.hp,0,'actual unguarded enemy hits cause the fall');
 assert.equal(sim.state.adventure.deaths,deaths+1);assert.equal(enemy.hp,enemy.maxHP,'no attack or planted defeat earned anything');
 assert.equal(sim.moveTo(giver.x,giver.z).ok,false,'dead movement stays disabled');
 const fallen=sim.snapshot();assert.equal(W.command(ctx,'claim',{realm,run:1},{save}).ok,false);assert.deepEqual(sim.snapshot(),fallen,'dead turn-in cannot mutate completed history');
 command(sim,'revive');assert.equal(sim.room,null);assert.equal(sim.worldTrip,undefined);assert.equal(sim.worldDive,undefined);assert.equal(sim.returnPos,null);
 assert.deepEqual(sim.state.player,{x:2.5,z:6,yaw:0});assert.equal(sim.state.adventure.hp,A.stats(sim.state.adventure).maxHP);assert.equal(sim.state.adventure.stamina,100);
 assert.deepEqual(sim.state.journeys,accepted,'the partial accepted outing survives the fall and return');assert.deepEqual(legacy(sim),before,'gear, sockets, choices and legacy rewards remain');
 const reopened=new C.Simulation(sim.snapshot());assert.equal(reopened.room,null);assert.deepEqual(reopened.state.journeys,accepted);assert.deepEqual(legacy(reopened),before);
});

for(const realm of ['hell','earthlands'])for(const style of ['blade','bow'])test(style+' earns '+realm+' defeat, guarded combat, retreat and free return without legacy rewards',t=>{
 let sim=fixture(style);const d=W.definition(realm),home={...sim.state.player},before=legacy(sim);
 enter(sim,realm);let enemy=A.runtime(sim).enemies.find(e=>e.id===d.enemies[0].id);
 assert.ok(enemy,'canonical optional encounter');assert.equal(sim.state.adventure.companion.bonded,false,'only the traveller deals combat damage');
 approach(sim,enemy,style);const firstBrace=braceAgainstRealTell(sim,enemy);
 const initialHP=enemy.hp,firstAttack=autoUntil(sim,enemy,style,()=>enemy.hp<initialHP,'first actual weapon hit');
 assert.ok(enemy.hp>0,'retreat starts before defeat');assert.equal(AR.runtime(sim).arrows.length,0,'the first arrow resolved before retreat');
 command(sim,'auto-toggle');command(sim,'target-clear');const partialHP=enemy.hp,position={...sim.state.player};
 for(let i=0;i<10;i++){const from={...sim.state.player};sim.manual(0,1,.05);assert.ok(W.segment(sim.room,from,sim.state.player));sim.tick(.05);}
 assert.ok(Math.hypot(sim.state.player.x-position.x,sim.state.player.z-position.z)>.25,'real manual movement retreats');
 const refuge=realm==='hell'?{x:44,z:-60}:{x:0,z:23};walk(sim,refuge.x,refuge.z);
 until(sim,()=>Math.hypot(enemy.x-enemy.home.x,enemy.z-enemy.home.z)<.8&&!['windup','pursue'].includes(enemy.mode),20,'optional enemy returns to its own pocket');
 assert.equal(enemy.hp,partialHP,'retreat does not invent further attacks');
 assert.deepEqual(sim.state.journeys.realms[realm].defeated,[],'living threat is not recorded dead');
 assert.deepEqual(legacy(sim),before,'retreat never creates legacy rewards');freeHome(sim,home);
 walk(sim,0,3);command(sim,'rest');walk(sim,home.x,home.z);const secondHome={...sim.state.player};enter(sim,realm);
 enemy=A.runtime(sim).enemies.find(e=>e.id===d.enemies[0].id);assert.equal(enemy.hp,d.enemies[0].hp,'unresolved encounter returns with its declared health');
 approach(sim,enemy,style);const secondBrace=braceAgainstRealTell(sim,enemy);
 const battle=autoUntil(sim,enemy,style,()=>enemy.hp===0,'actual optional enemy defeat');
 assert.ok(battle.hits>=2,'several confirmed attacks earn the defeat');
 assert.deepEqual(sim.state.journeys.realms[realm].defeated,[enemy.id]);
 assert.deepEqual(legacy(sim),before,'local defeat awards no old XP, coins, ore, loot, gear or story progress');
 assert.equal(sim.adventureCommand('world-combat-dead-target-'+(++serial),'target-select',{id:enemy.id}).ok,false);
 assert.equal(sim.adventureCommand('world-combat-no-loot-'+(++serial),'loot',{id:enemy.id}).ok,false);
 assert.deepEqual(legacy(sim),before,'dead target and loot commands cannot replay a legacy payout');
 const saved=sim.snapshot();sim=new C.Simulation(saved);
 assert.equal(sim.room,null,'cold reload uses the home checkpoint');assert.deepEqual(sim.state.player,secondHome);
 assert.deepEqual(sim.state.journeys.realms[realm].defeated,[enemy.id],'earned local dead record survives cold reload');
 assert.deepEqual(legacy(sim),before);enter(sim,realm);
 assert.equal(A.runtime(sim).enemies.some(e=>e.id===enemy.id),false,'dead local enemy is absent after re-entry');
 assert.equal(T.candidates(sim).some(e=>e.id===enemy.id),false,'targeting cannot replay the encounter');
 assert.deepEqual(legacy(sim),before);freeHome(sim,secondHome);
 assert.deepEqual(sim.state.journeys.realms[realm],{counter:0,lastClaim:0,firstClaimed:false,active:null,defeated:[enemy.id]},'combat does not accept or pay a survey');
 t.diagnostic(JSON.stringify({realm,style,weapon:before.equipment.weapon,entry:d.entry,stage:{x:d.enemies[0].x,z:d.enemies[0].z+12},battle:{x:d.enemies[0].x,z:d.enemies[0].z+(style==='bow'?4:1.1)},refuge,firstBrace,firstAttack,secondBrace,battleResult:battle,tickSeconds:.05}));
});
