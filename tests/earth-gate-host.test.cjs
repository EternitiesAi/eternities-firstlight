'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),F=require('./helpers/earth-gate-fixture.cjs');
const {GateHost}=require('../src/earth-gate-host.js'),Menus=require('../src/earth-tournament-ui.js');
function setup(plan='inspection-lane'){let sim=F.prepared(plan),saved=[],notices=[],refuse=false;const host=new GateHost({context:()=>F.context(sim),save:w=>{saved.push(F.copy(w));return refuse?{ok:false,error:'Synthetic quota refusal'}:{ok:true};},notify:t=>notices.push(t)});host.status();return{get sim(){return sim;},set sim(s){sim=s;},host,saved,notices,refuse(v){refuse=v;}};}
function follow(f){const v=f.host.status().view,p=f.sim.state.player,a=v.actors[1];if(Math.hypot(p.x-a.x,p.z-a.z)>2.2){if(F.E.segment(p,a,.31))f.sim.manual(a.x-p.x,a.z-p.z,.1);else assert.ok(f.sim.moveTo(a.x,a.z).ok);}f.sim.tick(.1);f.host.tick(.1);}
function start(f){F.lead(f.sim);}
test('host ticks real bodies, persists each reached stop once and never pays the fee automatically',()=>{const f=setup(),before=f.sim.state.adventure.coins;start(f);let n=0;while(!f.sim.state.adventure.earthGate.outcome&&n++<1600)follow(f);assert.ok(n<1600);assert.equal(f.saved.length,5);assert.deepEqual(f.saved.map(s=>s.adventure.earthGate.checkpoint),['orchard-turn','west-track','shelter-west','shelter-north','inspection-point']);assert.equal(f.host.status().view.arrived,true);assert.equal(f.sim.state.adventure.coins,before);assert.equal(f.sim.state.adventure.earthGate.claimed,false);for(let i=0;i<10;i++)follow(f);assert.equal(f.saved.length,5);});
test('refused automatic checkpoint remains visibly reached without per-frame retries and explicit retry resumes the group',()=>{const f=setup();start(f);f.refuse(true);let n=0;while(!f.host.status().error&&n++<100)follow(f);assert.ok(n<100);assert.equal(f.saved.length,1);assert.equal(f.sim.state.adventure.earthGate.checkpoint,'camp');const p=f.host.status().view.actors;for(let i=0;i<20;i++)follow(f);assert.deepEqual(f.host.status().view.actors,p);assert.equal(f.saved.length,1);assert.equal(f.notices.length,1);f.refuse(false);assert.ok(f.host.control('retry').ok);assert.equal(f.saved.length,2);assert.equal(f.sim.state.adventure.earthGate.checkpoint,'orchard-turn');assert.equal(f.host.status().view.moving,true);assert.equal(f.host.status().error,null);assert.equal(f.host.control('retry').ok,false);});
test('walking back from far wait may save a real stop before a later quota refusal on either route',()=>{
 // Synthetic prepared entry only. All movement after this point uses real
 // Core moveTo/manual ticks and the production host; no browser claim.
 for(const plan of ['inspection-lane','temporary-shelter']){
  const f=setup(plan),walk=(x,z)=>{assert.ok(f.sim.moveTo(x,z).ok);let n=0;while(f.sim.playerPath.length&&n++<12000){f.sim.tick(.05);f.host.tick(.05);}assert.ok(n<12000);assert.ok(Math.hypot(f.sim.state.player.x-x,f.sim.state.player.z-z)<.3);};
  walk(-6,6);assert.ok(f.host.control('lead').ok);walk(5,6);
  assert.equal(f.host.status().view.status,'waiting-far');
  const stopped=F.copy(f.host.status().view.actors);
  for(let i=0;i<20;i++){f.sim.tick(.05);f.host.tick(.05);}
  assert.deepEqual(f.host.status().view.actors,stopped);
  const middle=stopped[1];walk(middle.x,middle.z);
  assert.equal(f.sim.state.adventure.earthGate.checkpoint,'orchard-turn');
  assert.equal(f.saved.length,1,'walking back records the genuinely reached stop once');
  const before=F.copy(f.sim.snapshot()),next=f.host.status().view.next;
  assert.equal(next,plan==='inspection-lane'?'west-track':'shelter-approach');
  f.refuse(true);let n=0;while(!f.host.status().error&&n++<600)follow(f);
  assert.ok(n<600);assert.equal(f.host.status().view.ready,true);
  assert.equal(f.sim.state.adventure.earthGate.checkpoint,before.adventure.earthGate.checkpoint);
  assert.deepEqual(f.sim.state.adventure.earthGate,before.adventure.earthGate);
  assert.deepEqual(f.sim.state.sandbox.inventory,before.sandbox.inventory);
  assert.equal(f.sim.state.adventure.coins,before.adventure.coins);
  assert.equal(f.sim.state.adventure.xp,before.adventure.xp);
  assert.equal(f.saved.length,2,'one successful stop and one refused next stop');
  const arrived=F.copy(f.host.status().view.actors);
  for(let i=0;i<20;i++)follow(f);
  assert.deepEqual(f.host.status().view.actors,arrived);assert.equal(f.saved.length,2);
  f.refuse(false);assert.ok(f.host.control('retry').ok);
  assert.equal(f.sim.state.adventure.earthGate.checkpoint,next);
  assert.equal(f.saved.length,3);assert.equal(f.host.control('retry').ok,false);
  assert.equal(f.sim.state.adventure.earthGate.claimed,false);
 }
});
test('menu pause freezes real movement and checkpoint writes, preserving a deliberate pause after closing',()=>{const f=setup();start(f);follow(f);assert.ok(Menus.holdMenu(f.sim));const before=f.host.status().view.actors;for(let i=0;i<12;i++){f.sim.tick(.1);f.host.tick(.1);}assert.deepEqual(f.host.status().view.actors,before);assert.equal(f.saved.length,0);assert.deepEqual(Menus.togglePause(f.sim),{held:true,paused:true});Menus.releaseMenu(f.sim);assert.equal(f.sim.paused,true);Menus.togglePause(f.sim);follow(f);assert.notDeepEqual(f.host.status().view.actors,before);});
test('host read and art projections do not checkpoint; owner replacement invalidates the outgoing proof',()=>{const f=setup();start(f);const proof=F.reach(f.sim);for(let i=0;i<3;i++)assert.equal(f.host.status().view.ready,true);assert.equal(f.saved.length,0);const old=f.sim,ctx=F.context(old);f.sim=F.enter(new F.C.Simulation(old.snapshot()));f.host.status();assert.equal(F.Gate.motion.validateArrival(ctx,proof).ok,false);assert.equal(old.gatePresentation,null);assert.equal(f.host.status().view.checkpoint,'camp');assert.equal(f.host.status().view.leading,false);});
test('both host outcomes survive the actual canonical save format and reopen waiting for explicit leading',()=>{const f=setup('temporary-shelter');start(f);let n=0;while(f.saved.length<1&&n++<100)follow(f);assert.equal(f.saved.length,1);f.sim=F.enter(new F.C.Simulation(f.saved[0]));assert.equal(f.host.status().view.checkpoint,'orchard-turn');assert.equal(f.host.status().view.leading,false);start(f);while(!f.sim.state.adventure.earthGate.outcome&&n++<1600)follow(f);assert.ok(n<1600);assert.equal(f.sim.state.adventure.earthGate.outcome,'sheltered');assert.equal(f.saved.length,4);});
