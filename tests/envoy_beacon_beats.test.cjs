'use strict';
/* The spring and the beacon, through real commands only. At the spring the envoy speaks the prophecy, then teaches
 * the feather; the sight is used there. At the beacon the stranger is heard before the defense can begin, and the
 * sight shows his counterfeit spur. Walking is accepted movement with 50 ms steps, as in the chapter journeys. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),SG=require(path.join(ROOT,'src/saga.js')),F=require(path.join(ROOT,'src/feather-sight.js')),B=require(path.join(ROOT,'src/beacon.js'));
const load=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
let serial=0;
function harness(sim){
 const adv=(type,p={})=>{const r=sim.adventureCommand('beats-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);return r;};
 const refused=(type,p={})=>{const r=sim.adventureCommand('beats-'+(++serial),type,p);assert.equal(r.ok,false,type+' should be refused');return r;};
 const step=t=>{for(let i=0;i<Math.ceil(t/.05);i++)sim.tick(.05);};
 const walk=(x,z)=>{const r=sim.moveTo(x,z);assert.ok(r.ok,'walk '+x+','+z+': '+r.error);for(let i=0;sim.playerPath.length&&i<6000;i++)step(.05);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.15,'arrived '+x+','+z);};
 return{adv,refused,step,walk};
}

test('the spring: the envoy speaks the prophecy, then teaches the feather, and the sight is used there',()=>{
 // The chapter-one save with the envoy not yet heard: the relic is found, the reward is not taken.
 const raw=load('examples/CHAPTER_COMPLETED_EARNED.json');delete raw.saga;
 const a=raw.adventure,gift=a.reward;a.angelSeen=false;a.reward=null;a.owned=a.owned.filter(x=>x!==gift);for(const k in a.equipment)if(a.equipment[k]===gift)a.equipment[k]=null;
 const sim=new C.Simulation(raw),h=harness(sim),st=()=>sim.state;
 h.walk(0,3);
 h.refused('envoy-prophecy');
 h.refused('envoy-feather');
 h.adv('reveal');
 h.refused('envoy-feather');
 assert.equal(SG.done(st(),'envoy'),false);
 assert.equal(F.unlocked(sim),false);
 h.adv('envoy-prophecy');
 assert.deepEqual(st().saga.prophecy,['spring']);
 assert.equal(SG.done(st(),'envoy'),true);
 assert.ok(st().journal.some(e=>e.text.includes('rise from below')),'the prophecy is in the chronicle');
 h.adv('envoy-feather');
 assert.equal(st().saga.feather.unlocked,true);
 assert.equal(SG.done(st(),'feather'),true);
 // The first try, at the spring: holding the sight is a use of the feather, and the valley is read as true roads.
 try{
  assert.equal(F.hold(sim,true),true);
  assert.equal(st().saga.feather.uses,1);
  assert.ok(F.roadsFor(sim).every(r=>r.truth==='true'));
 }finally{F.hold(sim,false);}
 // Hearing the envoy again changes nothing; the story goes on to the gift.
 h.adv('envoy-prophecy');
 h.adv('envoy-feather');
 assert.equal(st().saga.feather.uses,1);
 h.adv('reward',{id:'warden_stone'});
 assert.equal(SG.current(st()).id,'road');
});

test('the beacon: the stranger is heard before the defense, and the sight shows his counterfeit spur',()=>{
 const sim=new C.Simulation(load('examples/CHAPTER_II_COMPLETE_EARNED.json')),h=harness(sim),st=()=>sim.state;
 h.walk(0,3);h.adv('rest');h.walk(44,6);h.adv('road-enter');h.walk(2,3.4);h.walk(2,-4);h.walk(0,-24);
 h.adv('beacon-answer');
 assert.equal(B.sightingPending(sim),true,'the stranger waits at the beacon once it has answered');
 h.step(18);
 assert.equal(B.runtime(sim).phase,'ready');
 assert.equal(B.sightingReady(sim),true);
 assert.match(h.refused('beacon-defend').error,/stranger/);
 h.adv('beacon-sighting');
 assert.ok(st().saga.regent.includes('beacon'));
 assert.equal(B.sightingPending(sim),false);
 h.adv('beacon-sighting');
 assert.deepEqual(st().saga.regent,['beacon'],'the same stranger heard again is not a second sighting');
 assert.equal(SG.done(st(),'beacon'),false,'the beacon is not done until the defense holds');
 try{
  assert.equal(F.hold(sim,true),true);
  assert.equal(st().saga.feather.uses,1);
  assert.equal(F.roadsFor(sim).find(r=>r.id==='sunward-spur').truth,'counterfeit');
 }finally{F.hold(sim,false);}
 h.adv('beacon-defend');
 assert.equal(B.runtime(sim).phase,'assault');
});
