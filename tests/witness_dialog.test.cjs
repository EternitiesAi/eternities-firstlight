'use strict';
/* The story dialog for the witness (scratch/STORY-AUDIT.md 1, 2, 3): the script's prompt and option labels on the
 * atlantis and cosmos choices, the guardian cards, Avar's cards, the nearshore results as a dialog rather than a toast,
 * and the advance a bot uses. Stubbed DOM; the real modules and the real script. */
const path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.join(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),RT=require(path.join(ROOT,'src/realm-trails.js'));
require(path.join(ROOT,'src/atlantis-campaign.js'));require(path.join(ROOT,'src/cosmos-campaign.js'));
require(path.join(ROOT,'src/atlantis-campaign-ui.js'));require(path.join(ROOT,'src/cosmos-campaign-ui.js'));require(path.join(ROOT,'src/nearshore-ui.js'));
const SCRIPT=require(path.join(ROOT,'src/story-script.js')),W=require('./witness_prereq.cjs');
const BEFORE_LINK=['read-local-cost','material-inspect','material-fit','living-inspect','living-fit','test-service-route','challenge-reclaimer','reclaimer-settled','isolate-service-feed','challenge-guardian','release-west-feed','release-east-feed','guardian-settled'];
function cosmosState(steps){
 const raw=C.fresh();raw.adventure.started=true;
 const d=RT.definition('cosmos-split-bearing-v1'),rec=raw.realmTrails.records[d.id];
 rec.accepted=true;rec.claimed=true;rec.steps=d.steps.map(s=>s.id);
 for(const s of d.steps)if(s.instrument)rec.settings[s.id]=s.instrument.target;
 raw.cosmosCampaign={version:1,accepted:true,steps,choice:null,opened:false,claimed:false};
 return C.validate(W.heavenFinished(raw));
}
// A stubbed DOM: every id or selector is an element; the story dialog records open and close, and its buttons.
function makeDom(){
 const els=new Map();
 const el=id=>{if(!els.has(id))els.set(id,{id,textContent:'',hidden:false,open:false,children:[],showModal(){this.open=true;},close(){this.open=false;},replaceChildren(){this.children=[];},appendChild(c){this.children.push(c);}});return els.get(id);};
 return{els,getElementById:el,querySelector:el,createElement:tag=>({tagName:tag,textContent:'',onclick:null})};
}
const cardsOf=(owner,step,state={})=>SCRIPT.forStep(owner,step,state).lines.map(l=>({speaker:l.speaker,text:l.text}));

test('the atlantis choice shows the script prompt and option labels, not "Read ... terms"',()=>{
 const AU=globalThis.RealmAtlantisCampaignUI;
 const act=(label,type,id)=>'<b data-id="'+id+'">'+label+'</b>';
 const choices=[{id:'publish',name:'Publish'},{id:'limited',name:'Limited'},{id:'license',name:'License'}];
 const html=AU.choiceControls('disposition',choices,act,{});
 const sc=SCRIPT.forStep('atlantis','disposition',{});
 assert.ok(sc.choice.prompt&&html.includes(sc.choice.prompt),'the script prompt');
 for(const o of sc.choice.options)assert.ok(html.includes(o.label),'option label: '+o.label);
 assert.ok(!/Read Publish terms/.test(html));
});

test('the cosmos choice shows Anik\'s labels for the accountability choice',()=>{
 const CU=globalThis.RealmCosmosCampaignUI;
 const act=(label,type,id)=>'<b data-id="'+id+'">'+label+'</b>';
 const html=CU.choiceControls('accountability',[{id:'public-record',name:'Public mechanical account'},{id:'bounded-account',name:'Public facts with bounded testimony'}],act,{});
 const sc=SCRIPT.forStep('cosmos','accountability',{});
 for(const o of sc.choice.options)assert.ok(html.includes(o.label),'option label: '+o.label);
 assert.ok(!html.includes('Public mechanical account</b>'),'the term name is replaced by the script label');
});

test('the guardian: the cards open once the Custodian falls, and the bot moves them on',()=>{
 const dom=makeDom();globalThis.document=dom;
 const AU=globalThis.RealmAtlantisCampaignUI;
 const cs=cardsOf('atlantis','bearing-exposed');
 const sim={state:{atlantisCampaign:{accepted:false}},atlantisGuardianCards:cs};
 const ui=new AU.AtlantisCampaignUI({sim,quest:'story',paint(){}});
 ui.tick();
 assert.equal(dom.els.get('story-dialog').open,true,'the guardian cards open');
 assert.equal(dom.els.get('story-body').textContent,cs[0].text);
 assert.equal(sim.atlantisGuardianCards,undefined,'shown once');
 if(cs.length>1){AU.advanceCards();assert.equal(dom.els.get('story-body').textContent,cs[1].text,'the bot advances the card');}
});

test('Avar frames the accountability choice once it is open (witness.avar cards)',()=>{
 const dom=makeDom();globalThis.document=dom;
 const CU=globalThis.RealmCosmosCampaignUI;
 const sim=new C.Simulation(cosmosState(BEFORE_LINK.concat(['disable-central-link'])));
 sim.room=require(path.join(ROOT,'src/cosmos-campaign.js')).definition.room;sim.returnPos={x:2.5,z:6,yaw:0};
 const ui=new CU.CosmosCampaignUI({sim,tab:'cosmos-campaign',quest:'cosmos-campaign',paint(){},open(){},close(){},api:{worldContext:()=>({sim,active:'t'}),toast(){},walkLocal(){},cosmosCampaignCommand(){return{ok:false,error:'x'};}}});
 ui.tick();
 const avar=cardsOf('cosmos','accountability',sim.state);
 assert.equal(dom.els.get('story-dialog').open,true,'Avar speaks');
 assert.equal(dom.els.get('story-body').textContent,avar[0].text);
 assert.equal(ui.avarShown,true);
});

test('the nearshore results open the story dialog as cards, not as a toast',()=>{
 const dom=makeDom();globalThis.document=dom;
 const toasts=[];
 const rpg={sim:{state:{adventure:{revision:3}}},paint(){},api:{worldContext:()=>({active:'t'}),toast:t=>toasts.push(t),
  nearshoreCommand:()=>({ok:true,text:'I kept her for you.',cards:[{speaker:'The Regent of Ash',text:'I kept her for you.'}]})}};
 const ui=new (globalThis.RealmNearshoreUI.NearshoreUI)(rpg);
 ui.run('arrive');
 assert.equal(dom.els.get('story-dialog').open,true,'the dialog opens');
 assert.equal(dom.els.get('story-speaker').textContent,'THE REGENT OF ASH');
 assert.equal(toasts.length,0,'no toast for a scene');
});
