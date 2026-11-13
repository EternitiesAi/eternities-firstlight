'use strict';
/* The story hooks of wave d: hell's arrival and foundry sighting (with its hear or cut answer, saved by the saga's
 * regent-heard after the sighting), and heaven's arrival keyed to accepting the road. Spoken lines come from the story
 * script; the choice ids feed the echo ledger; heaven's first area holds no hostile on its opening walk. */
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),SS=require('../src/story-script.js'),SG=require('../src/saga.js'),W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js');
const A=require('../src/adventure.js');
const H=require('../src/hell-campaign.js'),V=require('../src/heaven-campaign.js');
const HD=H.definition,VD=V.definition;
const world=room=>{const sim=new C.Simulation(C.fresh());sim.room=room;return sim;};
const HELL_TO_PATTERN=['witness-record','tovan-account','read-service-writ','challenge-veyr','warden-resolved'];

test('hell arrival is the arrive hook: its scene speaks, and it is keyed to the accepted road',()=>{
 const sc=SS.forStep('hell','arrive',C.fresh());
 assert.equal(sc.id,'hell.arrival');assert.ok(sc.lines.length>0,'the arrival has lines');assert.ok(sc.lines.some(l=>l.speaker==='Istra'));
});

test('the foundry sighting is the sighting hook, and its prompt is the stabilize step’s hear or cut choice',()=>{
 assert.equal(SS.forStep('hell','sighting',C.fresh()).id,'hell.regent');
 const pattern=SS.forStep('hell','stabilize-service-engine',C.fresh());
 assert.equal(pattern.id,'hell.pattern');assert.equal(pattern.choice.id,'listen-foundry');
 assert.deepEqual(pattern.choice.options.map(o=>o.id),['hear','cut']);
 assert.deepEqual(pattern.choice.options.map(o=>o.sets),[{'saga.heard.foundry':true},{'saga.heard.foundry':false}]);
});

test('the hell and heaven choice ids are the ledger ids, unchanged by the script',()=>{
 assert.deepEqual(SS.forStep('hell','disposition',C.fresh()).choice.options.map(o=>o.id),HD.choices.map(c=>c.id));
 assert.deepEqual(SS.forStep('heaven','arrangement',C.fresh()).choice.options.map(o=>o.id),VD.choices.map(c=>c.id));
 assert.deepEqual(HD.choices.map(c=>c.id),['unbind','divert','license']);
 assert.deepEqual(VD.choices.map(c=>c.id),['accessible-assist','broadened-activation']);
});

test('heaven arrival is the arrive hook, and heaven’s first area holds no hostile for its opening walk',()=>{
 const sc=SS.forStep('heaven','arrive',C.fresh());
 assert.equal(sc.id,'heaven.arrival');assert.ok(sc.lines.length>0,'the arrival has lines');
 const sim=world('world-heaven');
 sim.state.heavenCampaign=V.validate({version:1,accepted:true,steps:[],choice:null,claimed:false});
 assert.deepEqual(V.enemies(sim),[],'no campaign hostile before the watch');
 assert.deepEqual(R.enemies(sim),[],'no trail hostile on the opening walk');
 assert.deepEqual(W.enemies(sim),[],'no world hostile on the opening walk');
});

test('the saga answer is kept with the sighting: refused before the regent is seen, kept once given',()=>{
 const sim=world(null);sim.state.hellCampaign.accepted=true;
 assert.equal(SG.regentHeard(sim,'foundry',true).ok,false,'no answer before the regent is seen');
 assert.equal(SG.regentSeen(sim,'foundry').ok,true);
 assert.equal(SG.regentHeard(sim,'foundry',false).ok,true);
 assert.equal(sim.state.saga.heard.foundry,false);
 assert.equal(SG.regentHeard(sim,'foundry',true).ok,false,'the answer stays once given');
});

test('the stabilize step needs the hear or cut answer and writes it with the sighting, in one save',()=>{
 const sim=world('world-hell');
 sim.state.adventure.started=true;
 // the Open Cage rescue is the road's way in; the save validator needs it claimed with every required step.
 const trail=R.definition('hell-open-cage-v1'),tr=sim.state.realmTrails.records[trail.id];
 Object.assign(tr,{accepted:true,steps:R.required(trail),checkpoint:trail.escort.route.length-1,claimed:true});
 sim.state.hellCampaign=H.validate({version:1,accepted:true,steps:HELL_TO_PATTERN,choice:null,claimed:false});
 // the save records the valley position it returns to; the step is judged at the engine itself.
 const home={...sim.state.player};sim.state.player={x:0,z:-105,yaw:0};sim.returnPos=home;
 const ctx={sim,active:'hook-test'},io={save:()=>({ok:true})},base={quest:HD.id,expectedActive:'hook-test',expectedRevision:sim.state.adventure.revision,step:'stabilize-service-engine'};
 const refused=H.command(ctx,'step',{...base},io);
 assert.equal(refused.ok,false,'the step waits for the answer');
 assert.match(refused.error,/waiting for your answer/);
 assert.equal(sim.state.saga.heard.foundry,null,'nothing is written before the answer');
 const done=H.command(ctx,'step',{...base,heard:false},io);
 assert.equal(done.ok,true,done.error);
 assert.equal(sim.state.saga.heard.foundry,false,'the cut is kept');
 assert.ok(sim.state.saga.regent.includes('foundry'),'the sighting came first');
 assert.ok(sim.state.hellCampaign.steps.includes('stabilize-service-engine'));
});

test('the arrival shows on a new road and leaves after its first step; hear and cut are offered at the engine',()=>{
 require('../src/hell-campaign-ui.js');
 const sim=world('world-hell');sim.state.adventure.started=true;
 const trail=R.definition('hell-open-cage-v1'),tr=sim.state.realmTrails.records[trail.id];
 Object.assign(tr,{accepted:true,steps:R.required(trail),checkpoint:trail.escort.route.length-1,claimed:true});
 sim.returnPos={...sim.state.player};
 const page=()=>new globalThis.RealmHellCampaignUI.HellCampaignUI({sim,quest:'hell-campaign',tab:'hell-campaign',api:{worldContext:()=>({sim,active:'hook-test',revision:sim.state.adventure.revision})}}).page('hell-campaign').html;
 sim.state.hellCampaign=H.validate({version:1,accepted:true,steps:[],choice:null,claimed:false});
 assert.ok(page().includes('hell-campaign-arrival'),'the arrival speaks on a new road');
 sim.state.hellCampaign=H.validate({version:1,accepted:true,steps:HELL_TO_PATTERN,choice:null,claimed:false});
 sim.state.player={x:0,z:-105,yaw:0};
 const at=page();
 assert.ok(!at.includes('hell-campaign-arrival'),'the arrival leaves once the road has steps');
 assert.ok(at.includes('data-heard="true"')&&at.includes('data-heard="false"'),'hear and cut are offered at the engine');
 assert.ok(at.includes('Let him talk')&&at.includes('I am not here to listen'));
});
