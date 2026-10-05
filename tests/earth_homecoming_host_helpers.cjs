/* CPU DOM/batch sinks, explicitly not a browser/pixel facade. Production Core,
 * Store, physical geometry, EH, its UI and all patched host methods remain real.
 * Synthetic unit actor poses/history are not claimed as earned gameplay. */
'use strict';
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const overlay=require('./earth_homecoming_actual_owners.cjs'),{C,ROOT,load}=overlay;
const A=load('adventure.js'),H=load('earth-homecoming.js'),DATA=load('earth-homecoming-data.js'),W=load('world-foundations.js'),CS=load('characters.js'),E=load('engine.js'),T=load('combat.js');
for(const n of ['road.js','starter.js','classes.js','earth-story.js','earth-expedition.js','hell-campaign.js','heaven-campaign.js','atlantis-campaign.js','cosmos-campaign.js','realm-trails.js','traveler-art.js','traveler-equipment-art.js','companion-art.js','skitter-art.js','earth-expedition-beast-art.js'])load(n);
const D=H.definition,copy=structuredClone,step=id=>D.steps.find(s=>s.id===id);
class Node{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.style={setProperty(){}};this.listeners={};this.open=false;this.hidden=false;this.textContent='';this.innerHTML='';this.scrollLeft=0;this.classList={add(){},toggle(){},remove(){}};}
 append(...v){this.children.push(...v);}replaceChildren(...v){this.children=v;}addEventListener(k,fn){this.listeners[k]=fn;}setAttribute(k,v){this[k]=v;}focus(){}showModal(){this.open=true;}close(){this.open=false;}querySelector(){return new Node();}querySelectorAll(){return[];}getBoundingClientRect(){return{left:0,right:1200,top:0,bottom:600,height:600,width:1200};}insertAdjacentHTML(position,html){this.innerHTML=position==='afterbegin'?html+this.innerHTML:this.innerHTML+html;}
}
function dom(){const nodes=new Map(),doc={body:new Node('body'),querySelector:k=>{if(k.endsWith('[open]'))return null;if(!nodes.has(k))nodes.set(k,new Node());return nodes.get(k);},querySelectorAll:()=>[],createElement:tag=>new Node(tag)};global.document=doc;global.ResizeObserver=class{observe(){}};return{doc,nodes};}
// Unrelated component constructor/lifecycle sinks; no state/rule action can
// succeed here. Actual Starter and World UI are retained to check old ownership.
class OtherUI{constructor(rpg){this.rpg=rpg;this.notes={active:()=>false,reset(){}};}reset(){}context(){return null;}action(){return false;}interact(){return false;}page(){return null;}tick(){}invitation(){return'';}journal(){return'';}fitting(){return'';}status(){return'';}}
function installHosts(){
 for(const[n,k]of [['RealmCrossingUI','CrossingUI'],['RealmPursuitUI','PursuitUI'],['RealmCharactersUI','CharactersUI'],['RealmClassesUI','ClassesUI'],['RealmCosmosUI','CosmosUI'],['RealmGatheringUI','GatheringUI'],['RealmEarthUI','EarthUI'],['RealmTrailsUI','TrailsUI'],['RealmHellCampaignUI','HellCampaignUI'],['RealmHeavenCampaignUI','HeavenCampaignUI'],['RealmCosmosCampaignUI','CosmosCampaignUI'],['RealmAtlantisCampaignUI','AtlantisCampaignUI'],['RealmBridgeCommunityUI','BridgeCommunityUI'],['RealmLocalLifeUI','LocalLifeUI'],['RealmEarthExpeditionUI','ExpeditionUI']])global[n]={[k]:OtherUI,routePoints:()=>[],legend:()=>''};
 global.RealmVisualAtlas=class extends OtherUI{};
 global.RealmHomeHistoryUI={teaser:()=>''};
 load('starter-ui.js');load('earth-homecoming-ui.js');load('earth-homecoming-art.js');load('world-foundations-ui.js');load('adventure-ui.js');load('adventure-art.js');load('rpg-ui.js');load('world.js');
}
const EARLIER=path.join(__dirname,'fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json');
function seed(){return C.validate(JSON.parse(fs.readFileSync(EARLIER,'utf8')));}
function library(sim){const values=new Map([[CS.KEY,JSON.stringify({version:1,revision:1,nextId:3,active:'character-2',slots:[{id:'character-1',world:C.fresh()},{id:'character-2',world:sim.snapshot()}]})]]);const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};const store=new CS.Store(storage);store.load();store.writer=true;return{values,storage,store};}
function appOwner(sim,store){
 const calls=[],app=overlay.read('app.js'),first=app.slice(app.indexOf('function earthHomecomingWriter('),app.indexOf('function worldTravel(')),save=app.slice(app.indexOf('function worldSave('),app.indexOf('function worldCommand(')),command=app.slice(app.indexOf('function earthHomecomingCommand('),app.indexOf('function hellCampaignCommand('));
 const context={sim,characterStore:store,preserveExisting:false,saveState:'loaded',RealmEarthHomecoming:H,renderStatus:()=>calls.push('render-status')};
 vm.createContext(context);vm.runInContext(first+'\n'+save+'\n'+command,context);
 return{context,calls,worldContext:()=>context.worldContext(),command:(...args)=>context.earthHomecomingCommand(...args)};
}
function fixture(raw=seed()){
 const {doc,nodes}=dom();installHosts();const sim=new C.Simulation(raw),mem=library(sim),app=appOwner(sim,mem.store),calls=[];
 const old=Object.create(global.RealmAdventureUI.AdventureUI.prototype);old.sequence=0;old.intent=null;old.api={sim:()=>sim,save:()=>mem.store.save(sim.snapshot()),changed:()=>calls.push('legacy-changed'),toast:s=>calls.push(s),audio:()=>null,panel:()=>null,openPanel:name=>calls.push(name)};
 const api={sim:()=>sim,adventure:()=>old,worldContext:app.worldContext,earthHomecomingCommand:app.command,closePanel(){},endBuild(){},clearKeys(){calls.push('clear-keys');},focusWorld(){calls.push('focus-world');},toast:s=>calls.push(s),worldReturn:()=>{const r=W.leave(sim);if(r.ok)mem.store.save(sim.snapshot());return r;},walkLocal:(x,z)=>calls.push({walk:[x,z]}),project:(x,y,z)=>({x:x*10,y:y*10,depth:1,visible:true})};
 const rpg=new global.RealmRPGUI.RPGUI(api);rpg.lastPreview=Infinity;rpg.paintPreview=()=>{};
 const place=p=>{sim.room=p.room;sim.returnPos=p.room?{x:11,z:9,yaw:0}:null;Object.assign(sim.state.player,{x:p.x,z:p.z,yaw:0});sim.playerPath=[];assert.ok(H.at(sim,p));};
 const accept=()=>{place(D.giver);const q=app.command('accept',{quest:D.id,expectedActive:mem.store.active,expectedRevision:sim.state.adventure.revision});assert.ok(q.ok,q.error);};
 const work=id=>{place(step(id));const q=app.command('step',{quest:D.id,step:id,expectedActive:mem.store.active,expectedRevision:sim.state.adventure.revision});assert.ok(q.ok,q.error);};
 return{sim,mem,app,rpg,old,doc,nodes,calls,api,place,accept,work};
}
function actor(f){f.accept();for(const id of ['bridge-record','register-record','inspect-claim','west-relay-isolated','east-relay-isolated','challenge-regent'])f.work(id);A.syncScene(f.sim);const e=A.runtime(f.sim).enemies.find(e=>e.id===D.enemy.id);assert.ok(H.owned(f.sim,e));return e;}
function synthetic(f,last,choice='public-watch',claimed=false){const mandatory=D.steps.filter(s=>!s.optional),index=mandatory.findIndex(s=>s.id===last);f.sim.state.earthHomecoming=H.validate({version:1,accepted:true,steps:mandatory.slice(0,index+1).map(s=>s.id),choice:mandatory.slice(0,index+1).some(s=>s.id==='aftermath')?choice:null,claimed});}
const empty=()=>({box:[],octa:[],round:[],disc:[],'timber-panel':[]});
module.exports={overlay,C,A,H,DATA,D,W,CS,E,T,ROOT,load,dom,installHosts,seed,fixture,appOwner,library,actor,synthetic,step,empty,copy,Node};
