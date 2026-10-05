'use strict';
/* Actual UI owner routing with a labelled DOM/caller boundary. This is not
 * browser visibility, native storage or command-earned quest completion. */
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),N=require('../src/cosmos.js');
function fixture(accepted){
 const priorDocument=global.document,nodes=new Map(),calls=[];
 const node=()=>({hidden:false,textContent:'',style:{},children:[],setAttribute(){},append(n){this.children.push(n);if(n.id)nodes.set('#'+n.id,n);},replaceChildren(){this.children=[];}});
 for(const id of['#hud','#rpg-hud','#tracked-chapter','#tracked-title','#tracked-detail','#tracked-progress'])nodes.set(id,node());
 global.document={querySelector:id=>nodes.get(id),createElement:node,body:{classList:{toggle(){}}}};
 require('../src/world-foundations-ui.js');require('../src/cosmos-ui.js');
 const sim=new C.Simulation(C.fresh());sim.room=N.ROOM;sim.state.settings.labels=false;
 // UI boundary only: no command or completed-history claim comes from this
 // synthetic accepted flag. Actual save validation is covered elsewhere.
 sim.state.cosmosCampaign.accepted=accepted;
 const rpg={sim,quest:'story',dialog:{open:false},api:{worldReturn:()=>{calls.push('worldReturn');return{ok:true};},cosmosReturn:()=>{calls.push('cosmosReturn');return{ok:true};}},close:()=>calls.push('close')};
 rpg.worlds=new global.RealmWorldFoundationsUI.WorldUI(rpg);rpg.cosmos=new global.RealmCosmosUI.CosmosUI(rpg);
 return{nodes,calls,rpg,restore:()=>{global.document=priorDocument;}};
}
test('accepted Cosmos uses the visible unified return and hides the obsolete control',()=>{
 const f=fixture(true);try{f.rpg.worlds.tick();f.rpg.cosmos.tick();assert.equal(f.rpg.worlds.local(),true);assert.equal(f.nodes.get('#world-home').hidden,false);assert.equal(f.nodes.get('#cosmos-home').hidden,true);f.nodes.get('#world-home').onclick();assert.deepEqual(f.calls,['worldReturn','close']);}finally{f.restore();}
});
test('legacy unaccepted Cosmos keeps its own return when no local owner adopts it',()=>{
 const f=fixture(false);try{f.rpg.worlds.tick();f.rpg.cosmos.tick();assert.equal(f.rpg.worlds.local(),false);assert.equal(f.nodes.get('#world-home').hidden,true);assert.equal(f.nodes.get('#cosmos-home').hidden,false);f.nodes.get('#cosmos-home').onclick();assert.deepEqual(f.calls,['cosmosReturn','close']);}finally{f.restore();}
});
