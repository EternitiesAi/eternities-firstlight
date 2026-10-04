'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/world-foundations.js'),S=require('../src/sandbox.js');
const B=global.RealmBridgeCommunity;
/* Labelled synthetic rule boundaries; real traversal is a separate journey. */
function fixture(){const raw=C.fresh();raw.adventure.started=true;const sim=new C.Simulation(raw);const writes=[],io={save:c=>{writes.push(C.validate(c));return{ok:true};}};sim.state.player={...W.GATE,yaw:0};const ctx={sim,active:'synthetic-bridge-boundary'},preview=W.preview(ctx,'earthlands');assert.ok(W.enter(preview.ticket,ctx,{...io,build:()=>{}}).ok);sim.state.player={x:-6,z:-68,yaw:0};return{sim,writes,io,place:p=>Object.assign(sim.state.player,p),act:(type,payload={},saver=io)=>B.command({sim},type,payload,saver)};}
function complete(h,choice='shelter'){assert.ok(h.act('accept').ok);h.place(B.definition.giverFittings);assert.ok(h.act('fittings').ok);h.place(B.definition.sites[choice]);assert.ok(h.act('fit',{choice,assembly:'matched'}).ok);assert.ok(h.act('inspect').ok);h.place(B.definition.giver);}
test('old world migrates empty bridge work without changing old fields',()=>{
 const raw=C.fresh();delete raw.bridgeCommunity;const before=structuredClone(raw),state=C.validate(raw);
 assert.deepEqual(state.bridgeCommunity,{version:1,accepted:false,choice:null,steps:[],claimed:false});
 for(const k of Object.keys(before))assert.deepEqual(state[k],before[k],k);assert.deepEqual(raw,before);
});
test('future/null/impossible bridge records refuse instead of discarding history',()=>{
 for(const r of[null,{version:2}, {...B.fresh(),claimed:true},{...B.fresh(),choice:'shelter'},{...B.fresh(),accepted:true,steps:['inspect']},{...B.fresh(),accepted:true,steps:['fittings','fittings']}])assert.throws(()=>B.validate(r));
});
test('acceptance checks kit/proximity and synchronous durability without mutations',()=>{
 const h=fixture();h.sim.state.adventure.started=false;let old=h.sim.snapshot();assert.equal(h.act('accept').ok,false);assert.deepEqual(h.sim.snapshot(),old);
 h.sim.state.adventure.started=true;h.place({x:0,z:104});old=h.sim.snapshot();assert.equal(h.act('accept').ok,false);assert.deepEqual(h.sim.snapshot(),old);
 h.place(B.definition.giver);old=h.sim.snapshot();for(const save of[()=>({ok:false,error:'quota'}),()=>Promise.resolve({ok:true}),()=>{throw Error('blocked');}]){assert.equal(h.act('accept',{}, {save}).ok,false);assert.deepEqual(h.sim.snapshot(),old);}
 assert.ok(h.act('accept').ok);const accepted=h.sim.snapshot();assert.equal(h.act('accept',{request:'new'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),accepted);
});
for(const choice of['shelter','river-lookout'])test(choice+' completed unpaid work is atomic, retryable and paid exactly once',()=>{
 const h=fixture(),before=h.sim.snapshot();assert.equal(h.act('claim').ok,false);assert.ok(h.act('accept').ok);
 h.place(B.definition.sites[choice]);const missing=h.sim.snapshot();assert.equal(h.act('fit',{choice,assembly:'matched'}).ok,false);assert.deepEqual(h.sim.snapshot(),missing);
 h.place(B.definition.giverFittings);assert.ok(h.act('fittings').ok);h.place(B.definition.sites[choice]);const carried=h.sim.snapshot();assert.equal(h.act('fit',{choice,assembly:'crossed'}).ok,false);assert.deepEqual(h.sim.snapshot(),carried);
 assert.equal(h.act('fit',{choice,assembly:'matched'},{save:()=>({ok:false})}).ok,false);assert.deepEqual(h.sim.snapshot(),carried);
 assert.ok(h.act('fit',{choice,assembly:'matched'}).ok);assert.ok(h.act('inspect').ok);h.place(B.definition.giver);
 const done=h.sim.snapshot();for(const[k,limit]of[['coins',9999],['wood',S.MAX],['fiber',S.MAX]]){const owner=k==='coins'?h.sim.state.adventure:h.sim.state.sandbox.inventory,old=owner[k];owner[k]=limit;const full=h.sim.snapshot();assert.equal(h.act('claim').ok,false);assert.deepEqual(h.sim.snapshot(),full);owner[k]=old;}
 assert.equal(h.act('claim',{}, {save:()=>({ok:false,error:'quota'})}).ok,false);assert.deepEqual(h.sim.snapshot(),done);
 const refs=[h.sim.state.adventure,h.sim.state.sandbox.inventory,h.sim.state.adventure.companion];assert.ok(h.act('claim').ok);const paid=h.sim.snapshot();
 assert.equal(paid.adventure.coins-before.adventure.coins,10);assert.equal(paid.sandbox.inventory.wood-before.sandbox.inventory.wood,2);assert.equal(paid.sandbox.inventory.fiber-before.sandbox.inventory.fiber,4);assert.equal(paid.adventure.xp,before.adventure.xp);
 assert.equal(h.act('claim',{request:'changed'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);assert.deepEqual(refs,[h.sim.state.adventure,h.sim.state.sandbox.inventory,h.sim.state.adventure.companion]);
 for(const k of['journeys','realmTrails','earthExpedition','localLife','homeHistory','retreat','notes','score','flowers'])assert.deepEqual(paid[k],before[k],k);
 for(const k of['owned','equipment','arsenal','pursuit','realmCraft','earthBinding','companion','hp','stamina','xp','starter','crossing'])assert.deepEqual(paid.adventure[k],before.adventure[k],k);
 const restored=new C.Simulation(paid);restored.room='world-earthlands';Object.assign(restored.state.player,B.definition.giver);assert.equal(B.command({sim:restored},'claim',{request:'after-restart'},h.io).duplicate,true);
});
test('work anchors and the living worker remain on full-body supported ground',()=>{
 for(const p of[B.definition.giver,B.definition.giverFittings,...Object.values(B.definition.sites)])assert.ok(W.walkable('world-earthlands',p.x,p.z));
 for(const choice of['shelter','river-lookout']){const h=fixture();complete(h,choice);for(let i=0;i<=400;i++){h.sim.elapsed=i*.05;const p=B.worker(h.sim);assert.ok(W.walkable(h.sim.room,p.x,p.z),'worker support');assert.ok(Number.isFinite(p.yaw));}h.sim.paused=true;const a=B.worker(h.sim),b=B.worker(h.sim);assert.deepEqual(a,b);}
});
test('claimed community work teaches a single deliberate home board',()=>{
 const H=require('../src/home-history.js'),d=H.definition('memory-crossing');assert.ok(d,'the crossing must teach an actual craftable home design');
 const h=fixture();assert.equal(H.unlocked(h.sim.state,d),false);complete(h);assert.equal(H.unlocked(h.sim.state,d),false);assert.ok(h.act('claim').ok);assert.equal(H.unlocked(h.sim.state,d),true);
 assert.ok(W.leave(h.sim).ok);Object.assign(h.sim.state.player,{x:11,z:9});
 const old=h.sim.snapshot(),p={kind:d.id,expectedRevision:h.sim.state.homeHistory.revision};
 assert.equal(H.command({sim:h.sim},'craft',p,{save:()=>({ok:false})}).ok,false);assert.deepEqual(h.sim.snapshot(),old);
 assert.ok(H.command({sim:h.sim},'craft',p,h.io).ok);assert.equal(h.sim.state.sandbox.inventory.wood,old.sandbox.inventory.wood-2);assert.equal(h.sim.state.sandbox.inventory.fiber,old.sandbox.inventory.fiber-1);
 assert.equal(h.sim.state.retreat.items.some(i=>i.kind===d.id),false,'crafting never places');const made=h.sim.snapshot();assert.equal(H.command({sim:h.sim},'craft',p,h.io).duplicate,true);assert.deepEqual(h.sim.snapshot(),made);
});
test('blocked-side work, stale requests and unavailable characters preserve every byte and write',()=>{
 const h=fixture();assert.ok(h.act('accept').ok);h.place(B.definition.giverFittings);assert.ok(h.act('fittings').ok);h.place({x:-8,z:-65.8});assert.ok(W.walkable(h.sim.room,-8,-65.8));assert.equal(B.at(h.sim,B.definition.sites.shelter),false);
 const reject=(type,payload={})=>{const bytes=JSON.stringify(h.sim.state),writes=h.writes.length;assert.equal(h.act(type,payload).ok,false);assert.equal(JSON.stringify(h.sim.state),bytes);assert.equal(h.writes.length,writes);};reject('fit',{choice:'shelter',assembly:'matched'});
 h.place(B.definition.sites.shelter);reject('fit',{choice:'shelter',assembly:'matched',expectedRevision:h.sim.state.adventure.revision-1});reject('fit',{choice:'shelter',assembly:'matched',quest:'another-quest'});
 h.sim.state.adventure.hp=0;reject('fit',{choice:'shelter',assembly:'matched'});h.sim.state.adventure.hp=100;h.sim.room=null;reject('fit',{choice:'shelter',assembly:'matched'});h.sim.room=B.definition.room;
 assert.ok(h.act('fit',{choice:'shelter',assembly:'matched'}).ok);h.place({x:-8,z:-65.8});reject('inspect');
 h.place(B.definition.sites.shelter);assert.ok(h.act('inspect').ok);for(const[type,payload,p]of[['fittings',{},B.definition.giverFittings],['fit',{choice:'shelter',assembly:'matched'},B.definition.sites.shelter],['inspect',{},B.definition.sites.shelter]]){h.place(p);const bytes=JSON.stringify(h.sim.snapshot()),writes=h.writes.length;assert.equal(h.act(type,payload).duplicate,true);assert.equal(JSON.stringify(h.sim.snapshot()),bytes);assert.equal(h.writes.length,writes);}
});
