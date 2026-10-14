/* Synthetic starting locations; all event controls/contacts run through the
 * real Simulation, Adventure and Arsenal. No damage or score grants. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),T=require('../src/combat.js'),E=require('../src/earth.js'),R=require('../src/earth-tournament.js');
let serial=0;
function cmd(s,type,p={}){return s.adventureCommand('rain-test-'+(++serial),type,p);}
function setup(family='blade'){
 const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};assert.equal(cmd(s,'start').ok,true);
 // Explicit synthetic bow/position boundary. Command-earned bow covered separately.
 if(family==='bow'){s.state.adventure.owned.push('trail_bow');assert.equal(cmd(s,'equip',{id:'trail_bow'}).ok,true);}
 s.room=E.ROOM;s.returnPos={x:0,z:23,yaw:0};s.state.player={x:5,z:-29.2,yaw:Math.PI};A.syncScene(s);return s;
}
function call(s,type){return R.command({sim:s,active:'combat-test',current:()=>true},type,{quest:R.definition.id,expectedActive:'combat-test',expectedRevision:s.state.adventure.revision,family:AR.weapon(s.state.adventure).style},{save:()=>({ok:true})});}
function enter(family){const s=setup(family),r=call(s,'enter');assert.equal(r.ok,true,r.error);A.syncScene(s);return s;}
function until(s,predicate){for(let i=0;i<800&&!predicate();i++)s.tick(.05);assert.ok(predicate(),'bounded phase reached');}
function economy(s){const a=s.state.adventure;return JSON.stringify({owned:a.owned,equipment:a.equipment,arsenal:a.arsenal,pursuit:a.pursuit,xp:a.xp,hp:a.hp,coins:a.coins,ore:a.ore,tonics:a.tonics,defeated:a.defeated,drops:a.drops,beacon:a.beacon,classPath:a.classPath});}
test('peaceful Earth admits a target and projectile clearance only for an owned live bout',()=>{
 const s=setup();assert.equal(A.combatScene(s),false);assert.equal(AR.projectileGround(s,5,-30),false);
 assert.equal(call(s,'enter').ok,true);A.syncScene(s);assert.equal(A.combatScene(s),true);assert.equal(A.runtime(s).enemies.length,1);
 assert.equal(AR.projectileGround(s,5,-30),true);assert.equal(AR.projectileGround(s,-9,-24.6),false);
 assert.equal(cmd(s,'target-cycle').ok,true);assert.ok(T.selected(s)?.rainTournament);
 assert.equal(call(s,'withdraw').ok,true);A.syncScene(s);assert.equal(A.combatScene(s),false);assert.equal(AR.projectileGround(s,5,-30),false);assert.equal(T.selected(s),null);
});
for(const family of ['blade','bow'])test(family+' scores three real primary contacts and guarded responses, with no ordinary payout',()=>{
 const s=enter(family),before=economy(s);assert.equal(cmd(s,'target-cycle').ok,true);
 for(let index=0;index<3;index++){
  until(s,()=>R.view(s).index===index&&R.view(s).phase==='tell');assert.equal(cmd(s,'guard').ok,true);
  until(s,()=>R.view(s).phase==='opening');assert.equal(cmd(s,'attack',{target:T.selected(s).id}).ok,true);
  until(s,()=>R.view(s).rounds[index].reply);assert.equal(A.runtime(s).enemies[0].hp,1);
 }
 until(s,()=>R.view(s).complete);assert.equal(R.view(s).score,6);assert.equal(call(s,'record').ok,true);
 assert.equal(s.state.adventure.earthTournament.best[family],6);assert.equal(economy(s),before);
 assert.equal(T.runtime(s).hits.length,0,'no fictitious damage numbers');
});
test('noncompetitive powers refuse before health, stamina, class or story mutation',()=>{
 const s=enter(),before=JSON.stringify(s.snapshot());
 for(const type of ['pulse','heal','insight','spirit','class-technique','class-choose','soul-equip','arsenal-craft']){
  assert.equal(cmd(s,type,{id:'trail_bow'}).ok,false,type);assert.equal(JSON.stringify(s.snapshot()),before,type);
 }
 assert.equal(T.handle(s,'spirit').ok,false);assert.equal(AR.shoot(s,'pulse').ok,false);assert.equal(JSON.stringify(s.snapshot()),before);
});
test('early actual melee contact fouls once; arbitrary damage and copied targets never score',()=>{
 const s=enter(),e=A.runtime(s).enemies[0];assert.equal(A.damageEnemy(s,e,50,'other'),false);
 assert.equal(cmd(s,'attack',{target:e.id}).ok,true);assert.equal(R.view(s).rounds[0].early,true);assert.equal(e.hp,1);
 until(s,()=>R.view(s).phase==='opening');assert.equal(cmd(s,'attack',{target:e.id}).ok,true);assert.equal(R.view(s).rounds[0].reply,false);
 assert.equal(T.runtime(s).hits.length,0);
});
test('bow geometry chooses the hit, and an actual moving miss cannot create feedback or points',()=>{
 const s=enter('bow');until(s,()=>R.view(s).phase==='opening');const e=A.runtime(s).enemies[0];
 assert.equal(cmd(s,'attack',{target:e.id}).ok,true);const shot=AR.runtime(s).arrows[0];assert.ok(shot);
 // Independent geometry adversary: move the current body off the admitted ray.
 e.x+=2;until(s,()=>AR.runtime(s).arrows.length===0);assert.equal(R.view(s).rounds[0].reply,false);
 assert.equal(A.runtime(s).fx.some(f=>f.kind==='arrow-hit'),false);assert.equal(T.runtime(s).hits.length,0);
});
test('pause freezes the clock and leaving the ring cannot continue scoring',()=>{
 const s=enter(),time=R.view(s).time;s.paused=true;s.tick(.1);assert.equal(R.view(s).time,time);s.paused=false;
 s.manual(1,0,.1);for(let i=0;i<30&&R.fighting(s);i++)s.manual(1,0,.1),s.tick(.1);
 assert.equal(R.view(s).withdrawn,true);assert.equal(A.combatScene(s),false);assert.equal(call(s,'record').ok,false);
});
test('actual walking clears all three locked ribbons and keeps a blade reply in reach',()=>{
 const s=enter(),a=R.definition.arena,before=economy(s);
 const walk=p=>{assert.equal(s.moveTo(p.x,p.z).ok,true);until(s,()=>!s.playerPath.length);};
 walk({x:a.x,z:a.z+1.7});assert.equal(cmd(s,'target-cycle').ok,true);
 for(let index=0;index<3;index++){
  until(s,()=>R.view(s).index===index&&R.view(s).phase==='tell');
  walk({x:a.x+1.65,z:a.z+1.7});until(s,()=>R.view(s).phase==='opening');
  assert.equal(R.view(s).rounds[index].defense,true);assert.equal(T.runtime(s).guardUntil,0);
  assert.equal(cmd(s,'attack',{target:T.selected(s).id}).ok,true);assert.equal(R.view(s).rounds[index].reply,true);
  walk({x:a.x,z:a.z+1.7});
 }
 until(s,()=>R.view(s).complete);assert.equal(R.view(s).score,6);assert.equal(economy(s),before);
});
