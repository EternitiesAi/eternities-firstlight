/* Synthetic ownership boundaries; actual Core navigation/Adventure ticks.
 * This catches centre-follow overlap and unsupported proximity repairs. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),B=require('../src/briar-outing.js');
const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function fixture(x=2,z=8,yaw=0){
 const sim=new C.Simulation();sim.state.player={x,z,yaw};
 sim.state.adventure.started=true;sim.state.adventure.companion.bonded=true;
 A.syncScene(sim);return sim;
}
function ticks(sim,n=60){
 const fox=A.runtime(sim).companion;
 for(let i=0;i<n;i++){
  const before={x:fox.x,z:fox.z};sim.tick(.05);
  assert.ok(C.segment(before,fox,sim.navRoom,.31),'Each accepted fox step stays supported');
  assert.ok(gap(before,fox)<=.170001,'No teleport or unchecked multi-waypoint movement');
 }
 return fox;
}
test('peaceful following steps out of the player centre and settles beside them',()=>{
 const sim=fixture(),before=JSON.stringify(sim.state.adventure.companion),fox=ticks(sim);
 assert.ok(gap(fox,sim.state.player)>=1.05,'A stopped player should not stand on Briar');
 assert.ok(gap(fox,sim.state.player)<2.1);const p={x:fox.x,z:fox.z};ticks(sim,80);
 assert.equal(gap(p,fox),0,'No endless circling at rest');
 assert.equal(JSON.stringify(sim.state.adventure.companion),before);
 assert.equal(sim.state.adventure.xp,0);assert.equal(sim.state.briarMoments.revision,0);
});
test('the narrow pier uses a supported alternative when a shoulder points into water',()=>{
 const sim=fixture(0,25.4,Math.PI/2),fox=ticks(sim);
 assert.ok(gap(fox,sim.state.player)>=1.05);assert.ok(Math.abs(fox.x)<1.4);
});
test('following catches up through actual waypoints and keeps room at a new destination',()=>{
 const sim=fixture();ticks(sim);assert.ok(sim.moveTo(2,15).ok);
 const fox=ticks(sim,150);assert.ok(!sim.playerPath.length);
 assert.ok(gap(fox,sim.state.player)>=1.05&&gap(fox,sim.state.player)<2.4);
});
test('Stay and pause never become permission to move a crowded companion',()=>{
 const sim=fixture(),fox=A.runtime(sim).companion,p={x:fox.x,z:fox.z};
 assert.ok(sim.adventureCommand('presence-stay','companion-mode',{mode:'stay'}).ok);
 ticks(sim);assert.equal(gap(p,fox),0);
 assert.ok(sim.adventureCommand('presence-follow','companion-mode',{mode:'follow'}).ok);
 sim.paused=true;ticks(sim);assert.equal(gap(p,fox),0);
});
test('a stale follow path cannot move an already crowded fox farther into the player',()=>{
 const sim=fixture(),fox=A.runtime(sim).companion;fox.x+=.45;
 fox.path=[{...sim.state.player}];fox.nextPath=999;
 for(let i=0;i<40;i++){const before=gap(fox,sim.state.player);sim.tick(.05);
  if(before<1.05)assert.ok(gap(fox,sim.state.player)>=before-1e-8,'Crowded movement must yield outward');}
 assert.ok(gap(fox,sim.state.player)>=1.05);
});
test('the authored doorstep rest leaves the ordinary house approach clear',()=>{
 const sim=fixture(),door=C.LANDMARKS.find(q=>q.id==='home');
 assert.ok(gap(B.definition.rest,door)>1.3,'Fox rests beside the door, outside the player approach');
 assert.ok(gap(B.definition.rest,door)<2.8);
 assert.ok(C.walkable(B.definition.rest.x,B.definition.rest.z,sim.navRoom,.31));
 assert.ok(C.segment(door,B.definition.rest,sim.navRoom,.31));
});
test('crowding a resting Briar yields through real steps and requires actual re-arrival',()=>{
 const {appHost}=require('./briar_outing_journey.cjs'),world=C.fresh();
 world.adventure.started=true;world.adventure.companion.bonded=true;
 world.briarMoments={version:1,revision:1,moments:['briar-cloth-home-v1']};
 const h=appHost(world);h.walk(B.definition.home);h.command('rest');h.accompany('settled');
 h.walk(B.definition.rest);const fox=A.runtime(h.sim).companion,writes=h.writes;
 assert.ok(gap(fox,h.sim.state.player)>=1.05,'Crowded fox physically steps aside');
 assert.equal(B.current(h.app.context()).resting,false);
 assert.notEqual(B.prompt(h.app.context())?.action,'remember');
 assert.equal(B.command(h.app.context(),'remember',{}, {save:()=>{throw Error('Not arrived');}}).ok,false);
 h.walk(C.LANDMARKS.find(q=>q.id==='home'));
 assert.ok(gap(fox,B.definition.rest)<=.55,'Fox actually returns to the resting place');
 assert.equal(B.current(h.app.context()).resting,true);assert.equal(h.writes,writes);
 h.command('remember');assert.equal(h.writes,writes+1);
});

test('the first crowded arrival cannot record a doorstep moment before a yielding tick',()=>{
 const {appHost}=require('./briar_outing_journey.cjs'),world=C.fresh();
 world.adventure.started=true;world.adventure.companion.bonded=true;
 world.briarMoments={version:1,revision:1,moments:['briar-cloth-home-v1']};
 const h=appHost(world);h.walk(B.definition.home);h.command('rest');h.accompany('settled');
 const fox=A.runtime(h.sim).companion;h.sim.state.player.x=fox.x;h.sim.state.player.z=fox.z; // labelled synthetic crowding boundary
 assert.equal(B.current(h.app.context()).resting,false);assert.equal(B.current(h.app.context()).readyToRemember,false);
 assert.notEqual(B.prompt(h.app.context())?.action,'remember');let writes=0;
 assert.equal(B.command(h.app.context(),'remember',{}, {save:()=>{writes++;return{ok:true};}}).ok,false);
 h.tick();assert.equal(B.command(h.app.context(),'remember',{}, {save:()=>{writes++;return{ok:true};}}).ok,false);
 assert.equal(writes,0);
});
