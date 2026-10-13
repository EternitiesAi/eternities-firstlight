/* Synthetic fresh/returning fixtures. Actual Core clock and fishing rules;
 * every command/tick is checked against the untouched persistent snapshot. */
'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js');let F;try{F=require('../src/pier-fishing.js');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
function fixture(){
 assert.ok(F,'Fishing must have a real transient rule owner');
 const sim=new C.Simulation();sim.state.player={x:0,z:27,yaw:0};
 const h={sim,active:'synthetic-fisher'};h.ctx=()=>({sim:h.sim,active:h.active,current:()=>({sim:h.sim,active:h.active})});
 h.act=type=>{const before=JSON.stringify(h.sim.snapshot()),r=F.command(h.ctx(),type);assert.equal(JSON.stringify(h.sim.snapshot()),before);return r;};
 h.step=(n=1)=>{for(let i=0;i<n;i++){h.sim.tick(.05);const before=JSON.stringify(h.sim.snapshot());F.tick(h.ctx());assert.equal(JSON.stringify(h.sim.snapshot()),before);}};
 h.view=()=>F.current(h.ctx());return h;
}
test('pier-only explicit cast does not spend, equip, record or duplicate an activity',()=>{
 const h=fixture();assert.ok(h.act('cast').ok);assert.equal(h.act('cast').ok,false);
 assert.equal(h.view().phase,'waiting');assert.equal(h.act('release').ok,false);
 assert.equal(h.act('cancel').ok,true);assert.equal(h.view(),null);
 h.sim.state.player.z=10;assert.equal(h.act('cast').ok,false);
});
test('readable bite, tension decisions, catch and explicit release use actual elapsed time',()=>{
 const h=fixture();h.act('cast');h.step(100);assert.equal(h.view().phase,'bite');
 assert.ok(h.act('hook').ok);let changes=0;
 for(let i=0;i<1600&&h.view().phase==='playing';i++){
  const v=h.view(),reel=v.tension<.35?true:v.tension>.7?false:v.reeling;
  if(reel!==v.reeling){assert.ok(h.act('toggle').ok);changes++;}h.step();
 }
 assert.equal(h.view().phase,'caught');assert.ok(changes>=2,'A successful catch needs meaningful tension decisions');
 h.step(60);assert.equal(h.view().phase,'caught','Catch is held for deliberate release');
 assert.ok(h.act('release').ok);assert.equal(h.view(),null);assert.equal(h.act('release').ok,false);
});
test('holding through a strong pull loses the fish without costing any inventory',()=>{
 const h=fixture();h.act('cast');h.step(100);h.act('hook');h.act('toggle');h.step(300);
 assert.equal(h.view().phase,'lost');assert.match(h.view().message,/line|tension/i);
 assert.ok(h.act('cast').ok,'An intentional new attempt is available');
});
test('pause and long clock gaps cannot advance the float or catch up offline play',()=>{
 const h=fixture();h.act('cast');h.step(20);const before=h.view();
 h.sim.paused=true;h.step(100);assert.deepEqual(h.view(),before);assert.equal(h.act('hook').ok,false);
 h.sim.paused=false;h.sim.elapsed+=90;F.tick(h.ctx());assert.equal(h.view().phase,'waiting');
 assert.equal(h.view().time,before.time);h.step(100);assert.equal(h.view().phase,'bite');
});
test('walking, scene, death, character and world replacement release transient fishing',()=>{
 for(const fault of ['walk','room','death','character','state']){
  const h=fixture();h.act('cast');
  if(fault==='walk')h.sim.state.player.z-=1;else if(fault==='room')h.sim.room='home';
  else if(fault==='death')h.sim.state.adventure.hp=0;else if(fault==='character')h.active='next';else h.sim.state=C.fresh();
  F.tick(h.ctx());assert.equal(h.view(),null,fault);assert.equal(h.act('hook').ok,false);
 }
});
test('commands cannot inject progress and current snapshots cannot alter the owned fish',()=>{
 const h=fixture();assert.equal(F.command(h.ctx(),'cast',{progress:1}).ok,false);h.act('cast');
 const v=h.view();assert.ok(Object.isFrozen(v));assert.throws(()=>{v.phase='caught';});
 assert.equal(h.act('release').ok,false);assert.equal(h.view().phase,'waiting');
});
test('releasing a held input while paused cannot latch reeling on resume',()=>{
 const h=fixture();h.act('cast');h.step(80);h.act('hook');h.act('reel');h.sim.paused=true;
 assert.ok(h.act('ease').ok);assert.equal(h.view().reeling,false);assert.equal(h.act('reel').ok,false);
});

test('a command-earned early blade and crafted bow can fish without advancing story or equipment',()=>{
 const earned=require('./briar_outing_journey.cjs').earlyRescue();
 for(const [label,input] of Object.entries(earned)){
  const sim=new C.Simulation(input.world,{hydrated:true}),ctx={sim,active:label,current:()=>({sim,active:label})};
  assert.ok(sim.moveTo(0,27).ok);for(let i=0;i<1500&&sim.playerPath.length;i++)sim.tick(.05);
  assert.ok(Math.hypot(sim.state.player.x,sim.state.player.z-27)<.15);
  const before=sim.snapshot();assert.ok(F.command(ctx,'cast').ok);
  for(let i=0;i<80;i++){sim.tick(.05);F.tick(ctx);}assert.equal(F.current(ctx).phase,'bite');F.command(ctx,'hook');
  for(let i=0;i<1600&&F.current(ctx).phase==='playing';i++){
   const v=F.current(ctx),reel=v.tension<.35?true:v.tension>.7?false:v.reeling;
   if(reel!==v.reeling)F.command(ctx,'toggle');sim.tick(.05);F.tick(ctx);
  }
  assert.equal(F.current(ctx).phase,'caught');assert.ok(F.command(ctx,'release').ok);
  const after=sim.snapshot();for(const key of ['xp','coins','owned','equipment','arsenal','road','reward','starter','crossing','companion'])assert.deepEqual(after.adventure[key],before.adventure[key],label+':'+key);
  assert.deepEqual(after.briarMoments,before.briarMoments);assert.deepEqual(after.sandbox.inventory,before.sandbox.inventory);
 }
});
test('projected rod, float and catch use finite existing geometry without touching game state',()=>{
 const art=require('../src/pier-fishing-art.js'),engine=require('../src/engine.js');
 const h=fixture();h.act('cast');const sim=h.sim,before=JSON.stringify(sim.snapshot());
 for(const phase of ['waiting','bite','playing','caught','lost']){
  sim.presentation={fishing:{...h.view(),phase}};const out={box:[],round:[],octa:[],disc:[]};art.draw(out,sim);
  for(const [kind,parts] of Object.entries(out)){assert.ok(engine.geometry(kind).length);for(const part of parts){assert.ok(part.p.every(Number.isFinite));assert.ok(part.s.every(n=>Number.isFinite(n)&&n>0));if(part.m)assert.ok(part.m.every(Number.isFinite));assert.equal(part.cameraSolid,false);}}
  assert.equal(out.round.some(p=>p.fishingPart==='silverfin-body'),phase==='caught');assert.equal(JSON.stringify(sim.snapshot()),before);
 }
});
