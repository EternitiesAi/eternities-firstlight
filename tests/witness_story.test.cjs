'use strict';
/* The Cosmos story hooks (BRANCHES 3.6-3.7, 5): the scenes the script resolves for the recognition, the confluence
 * prompt, the sighting and the meridian hold, and the six-second anchor hold that gates the central link. */
const path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.join(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),RT=require(path.join(ROOT,'src/realm-trails.js')),CC=require(path.join(ROOT,'src/cosmos-campaign.js'));
const SCRIPT=require(path.join(ROOT,'src/story-script.js')),W=require('./witness_prereq.cjs');
// The steps before the central link, in the order the campaign accepts them: two anchors set, both feeds released.
const STEPS=['read-local-cost','material-inspect','material-fit','living-inspect','living-fit','test-service-route','challenge-reclaimer','reclaimer-settled','isolate-service-feed','challenge-guardian','release-west-feed','release-east-feed','guardian-settled'];
function cosmosState(steps=STEPS){
 const raw=C.fresh();raw.adventure.started=true;
 const d=RT.definition('cosmos-split-bearing-v1'),rec=raw.realmTrails.records[d.id];
 rec.accepted=true;rec.claimed=true;rec.steps=d.steps.map(s=>s.id);
 for(const s of d.steps)if(s.instrument)rec.settings[s.id]=s.instrument.target;
 raw.cosmosCampaign={version:1,accepted:true,steps,choice:null,opened:false,claimed:false};
 return C.validate(W.heavenFinished(raw));
}
const ctx=sim=>({sim,active:'cosmos-story-test'});
const pay=(sim,p)=>({quest:CC.definition.id,expectedActive:'cosmos-story-test',expectedRevision:sim.state.adventure.revision,...p});
const saves={save:()=>({ok:true})};
const lines=(step,state)=>SCRIPT.forStep('cosmos',step,state).lines.map(l=>l.text);

test('the script resolves the cosmos hooks: recognition, the confluence prompt, the sighting and the meridian hold',()=>{
 assert.ok(lines('recognition',{}).length>0,'recognition lines');
 const conf=SCRIPT.forStep('cosmos','open-confluence',{});
 assert.ok(conf.lines.length>0);
 assert.deepEqual(conf.choice.options.map(o=>o.id),['hear','cut'],'hear or cut at the open confluence');
 assert.ok(lines('sighting',{}).length>0,'sighting lines');
 assert.ok(lines('disable-central-link',{}).length>0,'the meridian plays over the hold');
});

test('the script resolves the atlantis hooks: the harbour, the record and the three dispositions',()=>{
 assert.ok(SCRIPT.forStep('atlantis','receipt-conflict',{}).lines.length>0,'harbour lines');
 assert.ok(SCRIPT.forStep('atlantis','custodian-stable',{}),'record scene');
 assert.deepEqual(SCRIPT.forStep('atlantis','disposition',{}).choice.options.map(o=>o.id),['publish','limited','license']);
});

test('the six-second hold at an anchor you set is what lets the central link answer',()=>{
 const sim=new C.Simulation(cosmosState());
 sim.state.player={x:22,z:-46,yaw:0};
 assert.equal(CC.holdStart(sim).ok,true,'standing at the material anchor starts the hold');
 for(let t=0;t<5.8;t+=.05){sim.elapsed+=.05;CC.holdTick(sim);}
 assert.equal(CC.heldComplete(sim),false,'not yet six seconds');
 for(let t=0;t<.6;t+=.05){sim.elapsed+=.05;CC.holdTick(sim);}
 assert.equal(CC.heldComplete(sim),true,'six seconds at the anchor');
});

test('leaving the anchor resets the hold, and standing between anchors cannot start it',()=>{
 const sim=new C.Simulation(cosmosState());
 sim.state.player={x:24,z:-40,yaw:0};
 assert.match(CC.holdStart(sim).error,/Stand at one of the anchors/);
 sim.state.player={x:22,z:-46,yaw:0};
 assert.equal(CC.holdStart(sim).ok,true);
 sim.state.player={x:40,z:-50,yaw:0};
 for(let t=0;t<7;t+=.05){sim.elapsed+=.05;CC.holdTick(sim);}
 assert.equal(CC.heldComplete(sim),false,'leaving resets it');
 assert.equal(sim.cosmosCampaignRuntime?.hold,undefined);
});

test('the central link answers only after the hold; without it the step is refused',()=>{
 const sim=new C.Simulation(cosmosState());
 sim.room=CC.definition.room;
 sim.returnPos={x:2.5,z:6,yaw:0};
 sim.state.player={x:34,z:-40,yaw:0};
 const refused=CC.command(ctx(sim),'configure',pay(sim,{step:'disable-central-link',setting:'disconnect-central-synchronization'}),saves);
 assert.equal(refused.ok,false);assert.match(refused.error,/Hold at one of the anchors/);
 sim.state.player={x:22,z:-46,yaw:0};
 assert.equal(CC.holdStart(sim).ok,true);
 for(let t=0;t<6.2;t+=.05){sim.elapsed+=.05;CC.holdTick(sim);}
 const done=CC.command(ctx(sim),'configure',pay(sim,{step:'disable-central-link',setting:'disconnect-central-synchronization'}),saves);
 assert.equal(done.ok,true,done.error);
 assert.equal(sim.state.cosmosCampaign.steps.includes('disable-central-link'),true);
});
