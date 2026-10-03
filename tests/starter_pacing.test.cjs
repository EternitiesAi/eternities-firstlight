/* Actual accepted combat/timers with labelled synthetic initial placements and
 * bow craft materials. The optionality-predicate case also resolves the named
 * foe synthetically; it is not an earned named fight. Separate journeys and
 * normal-RAF films earn their inputs and outcomes. */
'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),T=require('../src/combat.js'),Q=require('../src/starter.js');
const fs=require('node:fs');
let id=0;
function cmd(s,type,p={}){const r=s.adventureCommand('pacing-'+(++id),type,p);assert.ok(r.ok,type+': '+r.error);return r;}
function kit(bow=false){
 const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};cmd(s,'start');
 if(bow){Object.assign(s.state.sandbox.inventory,{wood:6,fiber:4,stone:2});cmd(s,'arsenal-craft',{id:'trail_bow'});cmd(s,'equip',{id:'trail_bow'});}
 cmd(s,'starter-accept');s.state.player={x:15,z:7,yaw:0};cmd(s,'starter-enter');
 const e=A.runtime(s).enemies.find(e=>e.id==='river-skitter-west');s.state.player={x:e.x,z:e.z+1.2,yaw:Math.PI};A.runtime(s).invincible=0;
 cmd(s,'target-select',{id:e.id});return{s,e};
}
function fight(bow,guard){
 const{s,e}=kit(bow),start=s.state.adventure.hp;cmd(s,'auto-toggle');let tell=false,braced=false,firstLoss=null,hits=0,oldHP=e.hp;
 for(let n=0;n<300&&e.hp>0;n++){
  if(e.mode==='windup'){tell=true;const cue=T.threat(s);assert.equal(cue?.phase,'windup');assert.ok(cue.remaining>0);if(guard&&!braced){cmd(s,'guard');braced=true;}}
  s.tick(.025);if(e.hp<oldHP){hits++;oldHP=e.hp;}if(firstLoss===null&&s.state.adventure.hp<start)firstLoss=start-s.state.adventure.hp;
 }
 assert.equal(e.hp,0);assert.ok(s.state.adventure.defeated.includes(e.id));assert.equal(s.state.adventure.xp,8);assert.equal(s.state.adventure.drops.filter(id=>id===e.id).length,1);
 assert.ok(tell,'actual selected-enemy tell remains available before ordinary autoattack finishes');
 return{firstLoss,hits,elapsed:s.state.adventure.elapsed,braced};
}
for(const bow of[false,true])test((bow?'fresh bow':'kit blade')+' sees the actual ordinary tell and Brace halves its resolved hit',()=>{
 const plain=fight(bow,false),guard=fight(bow,true);assert.equal(plain.hits,bow?4:3);assert.equal(guard.hits,plain.hits);assert.equal(plain.firstLoss,7);assert.equal(guard.firstLoss,4);assert.ok(guard.braced);assert.ok(plain.elapsed<4,'bounded ordinary encounter, not a large health pool');
});
test('movement away from the locked ordinary aim avoids its actual impact with the kit',()=>{
 const{s,e}=kit();s.tick(.025);assert.equal(e.mode,'windup');const aim={...e.aim},hp=s.state.adventure.hp;
 assert.ok(s.moveTo(e.x+1.6,e.z+1.8).ok);for(let n=0;n<34;n++)s.tick(.025);
 assert.equal(e.mode,'recover');assert.deepEqual(e.aim,aim);assert.equal(s.state.adventure.hp,hp);assert.ok(Math.hypot(s.state.player.x-aim.x,s.state.player.z-aim.z)>1.29);
});
test('fixed ordinary health stays easy for stronger gear without scaling or changing banked XP',()=>{
 const s=new C.Simulation(JSON.parse(fs.readFileSync(require.resolve('../examples/REALM10_CROSSING_READY_EARNED.json'))));
 const a=s.state.adventure;a.xp=9999; // Explicit banked-XP boundary on real earned gear/history.
 s.state.player={x:11,z:9,yaw:0};cmd(s,'starter-accept');s.state.player={x:15,z:7,yaw:0};cmd(s,'starter-enter');
 const e=A.runtime(s).enemies.find(e=>e.id==='river-skitter-west');s.state.player={x:e.x,z:e.z+1.2,yaw:Math.PI};
 assert.equal(e.maxHP,40);assert.equal(A.stats(a).attack,35);cmd(s,'attack',{target:e.id});assert.equal(e.hp,5);
 for(let n=0;n<22;n++)s.tick(.025);cmd(s,'attack',{target:e.id});assert.equal(e.hp,0);assert.equal(a.xp,9999);
 const completed=new C.Simulation(s.snapshot());completed.state.player={x:15,z:7,yaw:0};cmd(completed,'starter-enter');assert.equal(A.runtime(completed).enemies.some(v=>v.id===e.id),false,'saved prior defeated identity stays resolved');
});
test('ordinary fights stay optional and named threat, rewards, cooldown and weapon distinctions retain their rules',()=>{
 const{s}=kit(),a=s.state.adventure;for(const b of Q.BUNDLES){s.state.player={...b,yaw:0};cmd(s,'starter-pickup',{id:b.id});}
 const named=A.runtime(s).enemies.find(e=>e.id==='river-old-bristle');assert.equal(named.maxHP,90);assert.equal(named.windup,1.25);assert.equal(named.recovery,1.8);A.damageEnemy(s,named,named.hp);
 assert.ok(Q.complete(a));assert.equal(a.defeated.some(id=>id==='river-skitter-west'||id==='river-skitter-east'),false);
 assert.deepEqual(Q.ENEMIES.slice(0,2).map(e=>[e.damage,e.xp,e.coins,e.ore]),[[8,8,2,1],[8,8,2,1]]);
 assert.equal(AR.weapon(a).cooldown,.52);assert.equal(AR.weapon(a).reach,2.65);assert.equal(A.VERSION,12);assert.equal(C.VERSION,9);
});
