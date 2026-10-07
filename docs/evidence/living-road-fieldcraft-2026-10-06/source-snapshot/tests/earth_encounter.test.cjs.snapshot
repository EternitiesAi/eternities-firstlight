require('../src/earth-fieldcraft.js');require('../src/earth-fieldcraft-art.js');
/* Synthetic geometry/authority boundaries. Complete earned runs are separate. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),E=require('../src/earth-expedition.js'),T=require('../src/combat.js');
const Art=require('../src/earth-expedition-art.js'),B=require('../src/earth-expedition-beast-art.js');
let serial=0;
function fixture(){
 const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('sweep-kit-'+(++serial),'start').ok);
 sim.returnPos={...sim.state.player};sim.room='world-earthlands';const r=sim.state.earthExpedition.story;r.accepted=true;r.branch='managed-coppice';r.steps=E.definition.steps.slice(0,5).map(s=>s.id);
 sim.state.player={x:-134,z:-68,yaw:Math.PI};sim.earthExpeditionSave=raw=>{C.validate(raw);return{ok:true};};A.syncScene(sim);
 const e=A.runtime(sim).enemies.find(e=>e.defeatStep==='clear-root-pests');assert.ok(e);sim.state.adventure.elapsed=3;return{sim,e};
}
function tick(sim,n){for(let i=0;i<n;i++)sim.tick(.05);}
test('the grounded brute pursues outside its short physical sweep instead of striking remotely',()=>{
 const {sim,e}=fixture();sim.state.player.z=-65;tick(sim,1);assert.equal(e.mode,'pursue');assert.equal(e.aim,null);
});
test('warning locks the physical lane; turning and moving later cannot chase the target',()=>{
 const {sim,e}=fixture();tick(sim,1);assert.equal(e.mode,'windup');assert.deepEqual(e.strike,{x:-134,z:-70,yaw:0});
 sim.state.player={x:-132.2,z:-68,yaw:0};const hp=sim.state.adventure.hp;tick(sim,28);assert.equal(e.mode,'recover');assert.equal(sim.state.adventure.hp,hp);assert.equal(e.yaw,0);assert.deepEqual(e.strike,{x:-134,z:-70,yaw:0});
});
test('contact hits inside the locked lane exactly once, Brace halves actual damage',()=>{
 const losses=[];
 for(const guard of[false,true]){const {sim,e}=fixture();tick(sim,1);const hp=sim.state.adventure.hp;
  if(guard)assert.ok(sim.adventureCommand('sweep-guard-'+(++serial),'guard').ok);tick(sim,28);
  losses.push(hp-sim.state.adventure.hp);assert.equal(e.mode,'recover');assert.equal(e.contactHit,true);const after=sim.state.adventure.hp;tick(sim,25);assert.equal(sim.state.adventure.hp,after,'recovery never applies another contact');
 }assert.ok(losses[0]>0);assert.equal(losses[1],Math.ceil(losses[0]/2));
});
test('the full warning has no early contact and the full recovery remains an attack-free opening',()=>{
 const {sim,e}=fixture();tick(sim,1);const hp=sim.state.adventure.hp;tick(sim,24);assert.equal(e.mode,'windup');assert.equal(sim.state.adventure.hp,hp);assert.equal(e.contactAt,undefined);
 tick(sim,4);assert.equal(e.mode,'recover');assert.ok(sim.state.adventure.hp<hp);const after=sim.state.adventure.hp;tick(sim,43);assert.equal(e.mode,'recover');assert.equal(sim.state.adventure.hp,after);
});
test('footprint rotates in world space, includes body edge and excludes sides/rear/far',()=>{
 const {e}=fixture();e.strike={x:0,z:0,yaw:Math.PI/2};
 for(const[p,want]of[[{x:2,z:0},true],[{x:2,z:-1.2},true],[{x:2,z:-1.25},false],[{x:-.3,z:0},false],[{x:3.35,z:0},false],[{x:2,z:1.8},false]])assert.equal(E.strikeContains(e,p),want,JSON.stringify(p));
 e.strike.yaw=NaN;assert.equal(E.strikeContains(e,{x:2,z:0}),false);
});
test('only exact accepted encounter identities use a bank sweep, generic sentinels keep their owner',()=>{
 const {e}=fixture();assert.equal(E.encounter(e).kind,'bank-sweep');
 for(const patch of[{id:'sentinel'},{expeditionQuest:'other'},{expeditionRun:1},{defeatStep:'clear-crossing'},{kind:'boss'}])assert.equal(E.encounter({...e,...patch}),null);
 const p={...e,id:'earth-living-road-patrol-v1-run-7-root',expeditionQuest:E.patrol.id,expeditionRun:7};assert.equal(E.encounter(p).kind,'bank-sweep');
 p.id='earth-living-road-patrol-v1-run-6-root';assert.equal(E.encounter(p),null);
});
test('pause freezes warning and damage; returning/free-home removes transient strike',()=>{
 const {sim,e}=fixture();tick(sim,1);sim.paused=true;const timer=e.timer,hp=sim.state.adventure.hp;tick(sim,60);assert.equal(e.timer,timer);assert.equal(sim.state.adventure.hp,hp);
 sim.paused=false;sim.room=null;A.syncScene(sim);assert.equal(A.runtime(sim).enemies.length,0);assert.equal(T.threat(sim),null);
});
test('selected threat names the actual sweep and recovery without writing progression',()=>{
 const {sim,e}=fixture();assert.ok(sim.adventureCommand('sweep-target-'+(++serial),'target-select',{id:e.id}).ok);tick(sim,1);
 const before=JSON.stringify(sim.state.earthExpedition);assert.equal(T.threat(sim).kind,'bank-sweep');assert.equal(JSON.stringify(sim.state.earthExpedition),before);tick(sim,28);assert.equal(T.threat(sim).phase,'recover');assert.equal(sim.state.earthExpedition.story.steps.includes('clear-root-pests'),false);
});
test('a real wall blocks contact even when the player body lies within the sweep',()=>{
 const {sim,e}=fixture();Object.assign(e,{x:-142,z:-75,mode:'windup',timer:.01,yaw:-Math.PI/2,strike:{x:-142,z:-75,yaw:-Math.PI/2}});sim.state.player={x:-145.25,z:-75,yaw:0};
 assert.ok(E.strikeContains(e,sim.state.player));assert.equal(A.visible(sim,e,sim.state.player),false);const hp=sim.state.adventure.hp;tick(sim,1);assert.equal(sim.state.adventure.hp,hp);assert.equal(e.contactHit,false);
});
test('visible warning follows locked frame; reduced motion keeps the complete rectangle and no moving deadline',()=>{
 for(const reducedMotion of[false,true]){const q={frame:{x:8,z:4,yaw:Math.PI/2},length:3.1,halfWidth:1,base:1.57,mode:'windup',timer:.7,windup:1.35,reducedMotion};
  const parts=B.warningParts(q),sides=parts.filter(p=>p.bankSweepPart==='lane-side'),ends=parts.filter(p=>p.bankSweepPart==='lane-end');assert.equal(sides.length,2);assert.equal(ends.length,2);
  assert.ok(Math.abs(sides[0].p[0]-9.55)<1e-8);assert.deepEqual(sides.map(p=>Math.round(p.p[2])).sort(),[3,5]);assert.ok(Math.abs(ends[1].p[0]-11.1)<1e-8);assert.equal(parts.filter(p=>p.bankSweepPart==='lane-deadline').length,reducedMotion?0:1);assert.ok(parts.every(p=>p.appearanceOnly&&p.cameraSolid===false));assert.deepEqual(B.warningParts({...q,mode:'recover'}),[]);
 }
});
test('saved clearance stages only the first brace; a new patrol does not inherit a cleared inspection tag',()=>{
 const {sim}=fixture(),r=sim.state.earthExpedition,has=(role)=>Art.parts(r).some(p=>p.opt.expeditionPart===role);
 assert.equal(has('supplied-section'),false);r.story.steps.push('clear-root-pests');assert.equal(has('supplied-section'),true);
 r.story.steps.push('brace-root-channel');assert.equal(has('supplied-section'),false);assert.equal(has('installed-section'),true);
 r.story.steps.push('deliver-allocation');r.story.claimed=true;r.patrol.active={run:1,steps:['inspect-water','clear-crossing','inspect-root']};assert.equal(has('patrol-clear-tag'),false);assert.equal(has('patrol-check-tag'),true);
 r.patrol.active.steps.push('clear-root-pests');assert.equal(has('patrol-clear-tag'),true);assert.equal(has('supplied-section'),false);assert.equal(has('installed-section'),true);
 const before=JSON.stringify(r);Art.parts(r);assert.equal(JSON.stringify(r),before);
});
test('refused actual defeat saves leave no clearance or supplied kit and can be retried',()=>{
 const {sim,e}=fixture(),before=JSON.stringify(sim.state.earthExpedition);sim.earthExpeditionSave=()=>({ok:false,error:'labelled storage refusal'});A.damageEnemy(sim,e,e.hp,'weapon');
 assert.equal(e.hp,1);assert.equal(JSON.stringify(sim.state.earthExpedition),before);assert.equal(Art.parts(sim.state.earthExpedition).some(p=>p.opt.expeditionPart==='supplied-section'),false);
 sim.earthExpeditionSave=raw=>{C.validate(raw);return{ok:true};};A.damageEnemy(sim,e,1,'weapon');assert.equal(e.hp,0);assert.ok(sim.state.earthExpedition.story.steps.includes('clear-root-pests'));assert.ok(Art.parts(sim.state.earthExpedition).some(p=>p.opt.expeditionPart==='supplied-section'));
});
