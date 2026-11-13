'use strict';
/* The witness story in the UI (BRANCHES 3.7, 5): the six-second hold prompt at the central link, the hear-or-cut
 * prompt at the confluence sighting, and the script lines as story cards. Stubbed DOM; the real owners and the real
 * UI modules, with commands going through the real campaign command. */
const path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.join(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),RT=require(path.join(ROOT,'src/realm-trails.js')),CC=require(path.join(ROOT,'src/cosmos-campaign.js'));
require(path.join(ROOT,'src/atlantis-campaign.js'));require(path.join(ROOT,'src/cosmos-campaign-ui.js'));require(path.join(ROOT,'src/atlantis-campaign-ui.js'));
const W=require('./witness_prereq.cjs');
const STEPS=['read-local-cost','material-inspect','material-fit','living-inspect','living-fit','test-service-route','challenge-reclaimer','reclaimer-settled','isolate-service-feed','challenge-guardian','release-west-feed','release-east-feed','guardian-settled'];
function cosmosState(){
 const raw=C.fresh();raw.adventure.started=true;
 const d=RT.definition('cosmos-split-bearing-v1'),rec=raw.realmTrails.records[d.id];
 rec.accepted=true;rec.claimed=true;rec.steps=d.steps.map(s=>s.id);
 for(const s of d.steps)if(s.instrument)rec.settings[s.id]=s.instrument.target;
 raw.cosmosCampaign={version:1,accepted:true,steps:STEPS.slice(),choice:null,opened:false,claimed:false};
 return C.validate(W.heavenFinished(raw));
}
// A stubbed DOM: every id or selector is an element; the story dialog records open and close and its buttons.
function makeDom(){
 const els=new Map();
 const el=id=>{if(!els.has(id))els.set(id,{id,textContent:'',hidden:false,open:false,children:[],showModal(){this.open=true;},close(){this.open=false;},replaceChildren(){this.children=[];},appendChild(c){this.children.push(c);}});return els.get(id);};
 return{els,getElementById:el,querySelector:el,createElement:tag=>({tagName:tag,textContent:'',onclick:null})};
}
function rpgFor(sim,calls){
 const ctx={sim,active:'witness-ui-test'};
 return{sim,tab:'cosmos-campaign',quest:'cosmos-campaign',paint(){calls.push({kind:'paint'});},open(){},close(){},
  api:{worldContext:()=>ctx,toast:text=>calls.push({kind:'toast',text}),walkLocal(){},
   cosmosCampaignCommand:(type,payload)=>{calls.push({kind:'cosmos',type,payload});return CC.command(ctx,type,payload,{save:()=>({ok:true})});}}};
}
const lastButtons=dom=>dom.els.get('story-buttons').children;

test('the hold prompt: E near a set anchor starts it; six seconds send the central-link command',()=>{
 const dom=makeDom();globalThis.document=dom;
 const sim=new C.Simulation(cosmosState());sim.room=CC.definition.room;sim.returnPos={x:2.5,z:6,yaw:0};
 const calls=[],ui=new (globalThis.RealmCosmosCampaignUI.CosmosCampaignUI)(rpgFor(sim,calls));
 sim.state.player={x:22,z:-46,yaw:0};
 assert.equal(ui.interact(),true,'E starts the hold at the anchor');
 assert.ok(calls.some(c=>c.kind==='toast'&&/Hold here/.test(c.text)));
 for(let t=0;t<6.2;t+=.05){sim.elapsed+=.05;ui.tick();}
 const sent=calls.filter(c=>c.kind==='cosmos');
 assert.equal(sent.length,1,'the central-link command is sent once');
 assert.equal(sent[0].type,'configure');assert.equal(sent[0].payload.step,'disable-central-link');
 assert.equal(sim.state.cosmosCampaign.steps.includes('disable-central-link'),true,'the link is disconnected');
});

test('the hold resets when you leave the anchor, and no command is sent',()=>{
 const dom=makeDom();globalThis.document=dom;
 const sim=new C.Simulation(cosmosState());sim.room=CC.definition.room;sim.returnPos={x:2.5,z:6,yaw:0};
 const calls=[],ui=new (globalThis.RealmCosmosCampaignUI.CosmosCampaignUI)(rpgFor(sim,calls));
 sim.state.player={x:22,z:-46,yaw:0};ui.interact();
 for(let t=0;t<3;t+=.05){sim.elapsed+=.05;ui.tick();}
 assert.match(dom.els.get('#cosmos-hold-readout').textContent,/Holding: 3\.0 of 6 seconds/);
 sim.state.player={x:40,z:-50,yaw:0};
 for(let t=0;t<7;t+=.05){sim.elapsed+=.05;ui.tick();}
 assert.equal(calls.filter(c=>c.kind==='cosmos').length,0,'leaving resets the hold');
 assert.equal(sim.cosmosCampaignRuntime?.hold,undefined);
});

test('the sighting prompt: the story cards, then hear or cut as two buttons that send heard through the one save',()=>{
 const dom=makeDom();globalThis.document=dom;
 const sim=new C.Simulation(cosmosState());sim.room=CC.definition.room;sim.returnPos={x:2.5,z:6,yaw:0};
 const calls=[],ui=new (globalThis.RealmCosmosCampaignUI.CosmosCampaignUI)(rpgFor(sim,calls));
 const result={ok:true,text:'open',lines:['Where the branches meet, the roads show their undersides.'],cards:[{speaker:'',text:'Where the branches meet, the roads show their undersides.'}],
  choice:{id:'confluence',prompt:'Did you hear him out?',options:[{id:'hear',label:'Then say it. I am listening'},{id:'cut',label:'You have had your hearings'}]}};
 ui.showResult(result);
 assert.equal(dom.els.get('story-dialog').open,true,'the story dialog opens');
 assert.equal(dom.els.get('story-body').textContent,'Where the branches meet, the roads show their undersides.');
 lastButtons(dom)[0].onclick();
 assert.equal(dom.els.get('story-dialog').open,true,'the prompt replaces the card');
 assert.equal(dom.els.get('story-title').textContent,'Did you hear him out?');
 assert.deepEqual(lastButtons(dom).map(b=>b.textContent),['Then say it. I am listening','You have had your hearings']);
 lastButtons(dom)[1].onclick();
 const sighting=calls.find(c=>c.kind==='cosmos'&&c.type==='sighting');
 assert.equal(sighting.payload.heard,false,'cut sends heard false');
 assert.equal(sighting.payload.quest,CC.definition.id);
});

test('the atlantis story cards: one card per line, Next, then Continue closes the dialog',()=>{
 const dom=makeDom();globalThis.document=dom;
 const AU=globalThis.RealmAtlantisCampaignUI;const ui=new AU.AtlantisCampaignUI({});
 ui.showResult({ok:true,lines:['The harbour wall.','Ilyra reads the receipt.'],cards:[{speaker:'Ilyra',text:'The harbour wall.'},{speaker:'Ilyra',text:'Ilyra reads the receipt.'}]});
 assert.equal(dom.els.get('story-body').textContent,'The harbour wall.');
 assert.equal(dom.els.get('story-speaker').textContent,'ILYRA');
 lastButtons(dom)[0].onclick();
 assert.equal(dom.els.get('story-body').textContent,'Ilyra reads the receipt.');
 lastButtons(dom)[0].onclick();
 assert.equal(dom.els.get('story-dialog').open,false,'Continue closes the dialog');
});
