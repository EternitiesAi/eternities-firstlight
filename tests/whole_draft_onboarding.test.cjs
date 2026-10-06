'use strict';
/* Real Core, production movement/commands and all UI owner methods. The DOM
 * below is a string/attribute sink, not native rendering or browser proof.
 * A late claimed-history fixture is explicitly separate from the fresh
 * command-earned kit/travel/trail setup. Late-history derivatives are unit
 * setup only; they do not prove earned progression or native persistence. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {test,after}=require('node:test');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),A=global.RealmAdventure,W=global.RealmWorldFoundations,R=global.RealmTrails;
require(path.join(ROOT,'src/characters.js'));require(path.join(ROOT,'src/gathering-music.js'));global.window=global;global.addEventListener=()=>{};
for(const name of ['adventure-ui.js','crossing-ui.js','starter-ui.js','pursuit-ui.js','characters-ui.js','classes-ui.js','cosmos-ui.js','realm-atlas-ui.js','gathering-ui.js','earth-notes-ui.js','earth-story-ui.js','earth-road.js','earth-road-ui.js','earth-ui.js','world-foundations-ui.js','realm-trails-ui.js','hell-campaign-ui.js','heaven-campaign-ui.js','atlantis-campaign-ui.js','cosmos-campaign-ui.js','earth-homecoming-ui.js','bridge-community-ui.js','local-life-ui.js','earth-expedition-ui.js','home-history-ui.js','rpg-ui.js'])require(path.join(ROOT,'src',name));
class Node{
 constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};this.hidden=false;this.textContent='';this.innerHTML='';this.open=false;this.scrollLeft=0;this.classList={add(){},toggle(){},remove(){}};}
 append(...a){this.children.push(...a);}insertBefore(a){this.children.push(a);}replaceChildren(...a){this.children=a;}setAttribute(k,v){this[k]=v;}getAttribute(k){return this[k];}addEventListener(){}focus(){}showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return{left:0,right:1200,height:600,width:1200};}querySelector(){return new Node();}querySelectorAll(){return[];}insertAdjacentHTML(p,s){this.innerHTML=p==='afterbegin'?s+this.innerHTML:this.innerHTML+s;}
}
function fixture(world=C.fresh()){
 const nodes=new Map(),get=id=>{if(id.endsWith('[open]'))return null;if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};const switches=['story','homestead','expedition','local-life','community','hell-campaign','heaven-campaign','atlantis-campaign','cosmos-campaign','earth-homecoming','project'].map(id=>{const n=get('.tracker-switch [data-id="'+id+'"]');n.dataset.id=id;return n;});
 global.document={body:new Node(),addEventListener(){},querySelector:get,querySelectorAll:s=>s==='.tracker-switch [data-rpg=track]'?switches:[],createElement:()=>new Node()};global.ResizeObserver=class{observe(){}};
 let sim=new C.Simulation(world);const calls=[],store={saves:0};sim.state.settings.labels=false;
 const old=Object.create(global.RealmAdventureUI.AdventureUI.prototype);old.sequence=0;old.intent=null;old.api={sim:()=>sim,save:()=>{C.validate(sim.snapshot());store.saves++;},changed(){},toast:s=>calls.push(s),audio:()=>null,panel:()=>null};
 const ctx=()=>({sim,active:'projection-character',revision:1});const api={sim:()=>sim,adventure:()=>old,worldContext:ctx,earthContext:ctx,cosmosContext:ctx,hellCampaignCommand:(type,payload)=>global.RealmHellCampaign.command(ctx(),type,payload,{save}),closePanel(){},endBuild(){},clearKeys(){},focusWorld(){},toast:s=>calls.push(s),panel:()=>null,project:()=>null,canFrameFoe:()=>false,audio:()=>null};
 const rpg=new global.RealmRPGUI.RPGUI(api);rpg.lastPreview=Infinity;
 return{get sim(){return sim;},replace:s=>{sim=s;},rpg,nodes,get,calls,store,ctx};
}
let steps=0,movements=0;function walk(f,p){const result=f.sim.moveTo(p.x,p.z);assert.ok(result.ok,result.error);let n=0;while(f.sim.playerPath.length&&n++<20000){f.sim.tick(.1);steps++;}assert.equal(f.sim.playerPath.length,0,'production path must arrive');movements++;}
function save(candidate){C.validate(candidate);return{ok:true};}
function enter(f,id){walk(f,W.GATE);const p=W.preview(f.ctx(),id);assert.ok(p.ok,p.error);const e=W.enter(p.ticket,f.ctx(),{save,build(){}});assert.ok(e.ok,e.error);}
function kitAndTrail(f){walk(f,{x:11,z:9});const k=A.command(f.sim,'onboarding-kit','start',{});assert.ok(k.ok,k.error);enter(f,'hell');const d=R.definition('hell-open-cage-v1');walk(f,d.giver);const accept=R.command(f.ctx(),'accept',{quest:d.id},{save});assert.ok(accept.ok,accept.error);assert.equal(f.sim.state.realmTrails.records[d.id].accepted,true);return d;}


test('fresh actual Journal prioritizes usable Chapter I and retains all locked requests',()=>{
 const f=fixture(),before=JSON.stringify(f.sim.snapshot());f.rpg.open('journal');const html=f.get('#rpg-content').innerHTML,chapter=html.indexOf('The Feather Beneath Wildwood'),ending=html.indexOf('earth-homecoming-invitation');assert.ok(chapter>=0&&ending>=0);
 {assert.ok(chapter<ending);assert.ok(html.includes('<details class="future-work"><summary>Later requests'));for(const prefix of ['earth-homecoming','cosmos-campaign','atlantis-campaign','heaven-campaign','hell-campaign'])assert.ok(html.includes('data-rpg="'+prefix+'-open"'));}
 assert.equal(JSON.stringify(f.sim.snapshot()),before,'pure reading changes no saved state');
});
test('actual kit, crossing and accepted trail retain manual Homestead',()=>{
 const f=fixture(),d=kitAndTrail(f),before=JSON.stringify(f.sim.snapshot());f.rpg.action({dataset:{rpg:'track',id:'homestead'}});f.rpg.tick();f.rpg.tick();assert.equal(f.rpg.quest,'homestead');assert.equal(f.get('.tracker-switch [data-id="homestead"]').getAttribute('aria-pressed'),'true');
 {assert.equal(f.get('#tracked-chapter').textContent,'FIELD GUIDE · OPTIONAL');assert.notEqual(f.get('#tracked-title').textContent,d.title);}
 assert.equal(JSON.stringify(f.sim.snapshot()),before);
});
test('manual Story keeps actual chapter and its visible tracker opens Journal in a local realm',()=>{
 const f=fixture();kitAndTrail(f);f.rpg.action({dataset:{rpg:'track',id:'story'}});f.get('#tracked-open').onclick();
 {assert.equal(f.rpg.tab,'journal');assert.equal(f.get('#tracked-chapter').textContent,'CHAPTER 1');assert.ok(f.get('#rpg-content').innerHTML.includes('The Feather Beneath Wildwood'));}
});
test('a different explicit tracker choice replaces the transient selection',()=>{
 const f=fixture();kitAndTrail(f);f.rpg.action({dataset:{rpg:'track',id:'homestead'}});f.rpg.action({dataset:{rpg:'track',id:'project'}});f.rpg.tick();assert.equal(f.rpg.quest,'project');assert.equal(f.get('#tracked-chapter').textContent,'EQUIPMENT PROJECT');
});
test('real accepted commission card Track replaces Homestead without changing any saved facts',()=>{
 const f=fixture();walk(f,{x:11,z:9});const kit=A.command(f.sim,'civic-card-kit','start',{});assert.ok(kit.ok,kit.error);enter(f,'atlantis');
 const L=global.RealmLocalLife,d=L.definition('atlantis-bellglass-lamp-v1');walk(f,d.giver);const accepted=L.command(f.ctx(),'accept',{quest:d.id,choice:'approach'},{save});assert.ok(accepted.ok,accepted.error);
 f.rpg.open('local-life');f.rpg.action({dataset:{rpg:'track',id:'homestead'}});f.rpg.tick();assert.equal(f.rpg.quest,'homestead');
 // Read the actual rendered card action; do not call a helper or substitute
 // the similarly named, nonexistent local-life-track event.
 const html=f.get('#rpg-content').innerHTML,cardAction='data-rpg="civic-track" data-id="'+d.id+'"';assert.ok(html.includes(cardAction),'actual accepted card emits civic-track');
 const before=JSON.stringify(f.sim.snapshot()),saves=f.store.saves;
 for(const id of ['missing-local-commission',L.definitions.find(q=>q.id!==d.id).id]){
  f.rpg.action({dataset:{rpg:'civic-track',id}});f.rpg.tick();assert.equal(f.rpg.quest,'homestead','invalid or unaccepted card cannot replace the chosen tracker');assert.equal(f.rpg.civic.tracked,null);assert.equal(JSON.stringify(f.sim.snapshot()),before);
 }
 f.rpg.action({dataset:{rpg:'civic-track',id:d.id}});f.rpg.tick();f.rpg.tick();
 assert.equal(f.rpg.civic.tracked,d.id);assert.equal(f.rpg.quest,'local-life','actual Track must replace the prior explicit Homestead selection');assert.equal(f.get('#tracked-title').textContent,d.title);assert.ok(f.get('#tracked-chapter').textContent.startsWith('LOCAL LIFE · '));
 assert.equal(f.get('.tracker-switch [data-id="local-life"]').getAttribute('aria-pressed'),'true');assert.equal(f.get('.tracker-switch [data-id="homestead"]').getAttribute('aria-pressed'),'false');
 {assert.equal(f.rpg.trackerSelection.quest,'local-life');assert.equal(f.rpg.trackerSelection.sim,f.sim);}
 assert.equal(JSON.stringify(f.sim.snapshot()),before,'the card selection changes no claim, history, inventory, XP, gear, sockets, camera or saved preference');assert.equal(f.store.saves,saves,'projection performs no save');
});
test('failed actual project pin does not create a manual preference or alter the current tracker',()=>{
 const f=fixture();f.rpg.action({dataset:{rpg:'pursuit-pin',id:'copper_blade'}});assert.equal(f.rpg.quest,'story');assert.equal(f.rpg.trackerSelection,undefined);assert.equal(f.sim.state.adventure.pursuit.pinned,null);
});
test('passive acceptance projection cannot steal a manual choice; no preference is saved',()=>{
 const f=fixture();kitAndTrail(f);f.rpg.action({dataset:{rpg:'track',id:'homestead'}});const before=JSON.stringify(f.sim.snapshot());f.rpg.quest='hell-campaign';f.rpg.tick();assert.equal(f.rpg.quest,'homestead');assert.equal(JSON.stringify(f.sim.snapshot()),before);assert.equal(Object.hasOwn(f.sim.snapshot(),'trackerSelection'),false);
});
test('actual continuation acceptance retains manual Homestead and appears outside the locked Journal group (synthetic late history)',()=>{
 const raw=C.validate(JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json'),'utf8')));raw.hellCampaign=global.RealmHellCampaign.fresh();const f=fixture(C.validate(raw));enter(f,'hell');walk(f,global.RealmHellCampaign.definition.giver);f.rpg.action({dataset:{rpg:'track',id:'homestead'}});f.rpg.open('hell-campaign');const b=f.rpg.hellCampaign.binding,oldGear=JSON.stringify(f.sim.state.adventure.equipment),oldCameras=JSON.stringify(f.sim.state.settings.cameraViews),oldXP=f.sim.state.adventure.xp,oldCoins=f.sim.state.adventure.coins;
 f.rpg.action({dataset:{rpg:'hell-campaign-accept',id:'',binding:String(b.id),revision:String(b.adventureRevision)}});assert.equal(f.sim.state.hellCampaign.accepted,true);assert.equal(f.sim.state.hellCampaign.claimed,false);f.rpg.tick();{assert.equal(f.rpg.quest,'homestead');assert.equal(f.get('#tracked-chapter').textContent,'FIELD GUIDE · OPTIONAL');f.rpg.open('journal');const html=f.get('#rpg-content').innerHTML,active=html.indexOf('hell-campaign-invitation'),locked=html.indexOf('<details class="future-work">');assert.ok(active>=0&&(locked<0||active<locked));}
 assert.equal(JSON.stringify(f.sim.state.adventure.equipment),oldGear);assert.equal(JSON.stringify(f.sim.state.settings.cameraViews),oldCameras);assert.equal(f.sim.state.adventure.xp,oldXP);assert.equal(f.sim.state.adventure.coins,oldCoins);
});
test('claimed campaign stays visibly completed after a prior explicit track (labelled synthetic late history)',()=>{
 const p=path.join(ROOT,'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json');const raw=C.validate(JSON.parse(fs.readFileSync(p,'utf8')));assert.equal(raw.hellCampaign.claimed,true);
 // Synthetic completed/unpaid derivative: the real claim runs in validated RAM
 // to exercise its tracker transition. This is not a command-earned journey
 // or evidence that an already-paid campaign may pay again.
 raw.hellCampaign.claimed=false;const f=fixture(C.validate(raw));enter(f,'hell');walk(f,global.RealmHellCampaign.definition.giver);f.rpg.action({dataset:{rpg:'track',id:'hell-campaign'}});f.rpg.open('hell-campaign');const b=f.rpg.hellCampaign.binding;f.rpg.action({dataset:{rpg:'hell-campaign-claim',id:'',binding:String(b.id),revision:String(b.adventureRevision)}});assert.equal(f.sim.state.hellCampaign.claimed,true);f.rpg.tick();
 {assert.equal(f.rpg.quest,'hell-campaign');assert.equal(f.get('#tracked-chapter').textContent,'COMPLETED WORK · CLAIMED ONCE');assert.equal(f.get('#tracked-title').textContent,global.RealmHellCampaign.definition.title);f.get('#tracked-open').onclick();assert.equal(f.rpg.tab,'hell-campaign');assert.ok(f.get('#rpg-content').innerHTML.includes('The declared payment was claimed once'));}
});
test('actual legacy Cosmos and Hearthwater visits cannot overwrite a manually selected Homestead',()=>{
 const f=fixture();kitAndTrail(f);assert.ok(W.leave(f.sim).ok);f.rpg.action({dataset:{rpg:'track',id:'homestead'}});enter(f,'cosmos');f.rpg.tick();assert.equal(f.get('#tracked-chapter').textContent,'FIELD GUIDE · OPTIONAL');assert.ok(W.leave(f.sim).ok);walk(f,global.RealmEarth.GATE);const p=global.RealmEarth.preview(f.ctx());assert.ok(p.ok,p.error);const entered=global.RealmEarth.enter(p.ticket,f.ctx(),{save,build(){}});assert.ok(entered.ok,entered.error);f.rpg.tick();assert.equal(f.get('#tracked-chapter').textContent,'FIELD GUIDE · OPTIONAL');
});
test('no manual preference survives a new Simulation body or a cold UI constructor',()=>{
 const f=fixture();kitAndTrail(f);f.rpg.action({dataset:{rpg:'track',id:'homestead'}});const saved=f.sim.snapshot(),cold=fixture(C.validate(saved));cold.rpg.tick();assert.equal(cold.rpg.trackerSelection,undefined);assert.equal(cold.rpg.quest,'story');
 {f.replace(new C.Simulation(C.fresh()));f.rpg.quest='story';assert.equal(f.rpg.quest,'story');assert.equal(f.rpg.trackerAllows('local-world'),true);}
});
test('realm concept catalogue accurately names installed local arcs without promising full realms',()=>{
 const rows=global.RealmVisualAtlasDefinitions,at=rows.find(r=>r.id==='atlantis'),heaven=rows.find(r=>r.id==='heaven'),hell=rows.find(r=>r.id==='hell'),cosmos=rows.find(r=>r.id==='cosmos');
 {assert.ok(at.text.includes('ordered pressure controls'));assert.ok(heaven.text.includes('The Gate That Remained Open'));assert.ok(hell.text.includes('main foundry remains closed'));assert.ok(cosmos.text.includes('Open Confluence'));for(const r of rows)assert.ok(!/full (?:city|realm) (?:is|are) playable/.test(r.text));}
});
after(()=>{
 console.log('# Scope: actual Core/commands/moveTo/tick and UI owners; DOM string/attribute sink, validated RAM save acknowledgement. No native/browser/pixel proof.');
 console.log('# Setup counters: '+movements+' production movement legs; '+steps+' production ticks. Late-history cases are labelled synthetic derivatives of the installed fixture.');
});
