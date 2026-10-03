'use strict';
require('../src/skitter-art.js');
require('../src/companion-art.js');
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),Q=require('../src/starter.js');
const AR=require('../src/arsenal.js');require('../src/engine.js');
const Traveler=require('../src/traveler-art.js'),Equipment=require('../src/traveler-equipment-art.js');
require('../src/adventure-art.js');require('../src/arsenal-art.js');require('../src/starter-art.js');
const empty=()=>({box:[],octa:[],round:[],disc:[]});
function sim(){const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};s.adventureCommand('start','start');s.adventureCommand('accept','starter-accept');s.state.player={x:15,z:7,yaw:0};s.adventureCommand('enter','starter-enter');return s;}
test('reward blade and bow use actual equipment material in world geometry',()=>{
 // Synthetic catalogue ownership exercises material projection, not reward earning.
 // Held equipment now belongs to the traveller; encounter art keeps its own effects.
 for(const id of Object.keys(Q.GEAR)){
  const s=sim();s.state.adventure.owned.push(id);s.state.adventure.equipment.weapon=id;
  const before=s.snapshot(),out=empty(),style=AR.weapon(s.state.adventure).style;
  const pose=Traveler.pose({style,combatScene:true});
  const frame=Traveler.draw(out,{x:15,z:7,yaw:0,base:1.57},pose);
  const summary=Equipment.draw(out,s,frame);
  assert.equal(summary.weaponId,id);assert.equal(summary.style,style);assert.equal(summary.mode,'held');
  assert.ok(Object.values(out).flat().some(b=>b.weaponId===id&&b.c===0x82beb0),id);
  assert.deepEqual(s.snapshot(),before,'rendering grants nothing');
 }
});
test('named warning geometry includes the exact rule-defined strike radius',()=>{
 const s=sim(),e=A.runtime(s).enemies.find(e=>e.id==='river-old-bristle');e.mode='windup';e.aim={x:-4,z:-14};e.timer=1.25;const out=empty();global.RealmAdventureArt.draw(out,s,0);const ring=out.box.filter(b=>b.c===0xd098c8);assert.ok(ring.length>0);assert.ok(Math.abs(Math.max(...ring.map(b=>Math.hypot(b.p[0]-e.aim.x,b.p[2]-e.aim.z)))-e.telegraphRadius)<1e-8);
});
test('riverbank rendering enables existing outdoor water and matches collision obstacles',()=>{
 const s=sim(),calls=[],art={e:{},begin(){},box(){},add(...p){calls.push(p);},tree(){},lamp(){},commit(){}};global.RealmStarterArt.make(art);assert.equal(art.e.isInterior,false);for(const o of Q.OBSTACLES)assert.ok(calls.some(p=>p[0]==='round'&&p[1]===o.x&&p[3]===o.z&&p[4]===o.r*2));
});
