'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),L=require('../src/local-life.js'),W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js'),A=require('../src/adventure.js'),S=require('../src/sandbox.js');
const Art=require('../src/local-life-art.js');
const clone=structuredClone;
/* Boundary fixtures below are explicitly synthetic. Command-earned traversal
 * is owned by local_life_journey.cjs, not claimed by these unit checks. */
function fixture(d){
 const raw=C.fresh();raw.adventure.started=true;
 if(d.prerequisite){const old=R.definition(d.prerequisite),record=raw.realmTrails.records[old.id];record.accepted=true;record.steps=old.steps.map(s=>s.id);record.claimed=true;if(old.escort){record.checkpoint=old.escort.route.length-1;record.assisted=true;}}
 const sim=new C.Simulation(C.validate(raw));
 const saved=[];const io={save:state=>{saved.push(C.validate(state));return{ok:true};}};
 sim.state.player={...W.GATE,yaw:0};const ctx={sim,active:'synthetic-local-boundary',revision:0},preview=W.preview(ctx,d.realm);assert.ok(preview.ok,preview.error);assert.ok(W.enter(preview.ticket,ctx,{...io,build:()=>{}}).ok);
 const place=p=>{sim.state.player.x=p.x;sim.state.player.z=p.z;};place(d.giver);
 return{sim,place,saved,io,act:(type,payload={},options=io)=>L.command({sim,active:'synthetic-local-boundary'},type,{quest:d.id,...payload},options)};
}
test('older world9 migrates optional localLife1 without altering existing histories',()=>{
 const raw=C.fresh();delete raw.localLife;const copy=clone(raw),state=C.validate(raw);assert.deepEqual(raw,copy);assert.deepEqual(state.localLife,L.fresh());for(const k of Object.keys(copy))assert.deepEqual(state[k],copy[k],k);assert.equal(state.version,9);assert.equal(state.adventure.version,12);
});
test('current malformed/future local work refuses rather than resetting progress',()=>{
 for(const bad of[{version:2,records:{}},{version:1,records:{}},null])assert.throws(()=>L.validate(bad));
 const d=L.definitions[0];for(const change of[r=>r.choice='channel',r=>r.claimed=true,r=>r.steps=['plant-cuttings'],r=>r.steps=['not-a-step']]){const raw=L.fresh();change(raw.records[d.id]);assert.throws(()=>L.validate(raw));}
});
test('the new local ledger does not extend or rewrite the old five trail definitions',()=>{assert.equal(R.definitions().length,5);assert.equal(R.fresh().version,1);assert.equal(L.definitions.length,4);assert.ok(Object.isFrozen(L.definitions));assert.equal(A.VERSION,12);});
for(const d of L.definitions){
 test(d.id+' rejects offsite acceptance, invalid arrangement and absent prerequisite atomically',()=>{
  const h=fixture(d),before=h.sim.snapshot();h.place({x:0,z:W.definition(d.realm).bounds.maxZ});const offsite=h.sim.snapshot();assert.equal(h.act('accept',{choice:d.choices[0].id}).ok,false);assert.deepEqual(h.sim.snapshot(),offsite);h.place(d.giver);
  assert.equal(h.act('accept',{choice:'invented'}).ok,false);assert.deepEqual(h.sim.snapshot(),before);
  if(d.prerequisite){h.sim.state.realmTrails.records[d.prerequisite]=R.fresh().records[d.prerequisite];const none=h.sim.snapshot();assert.equal(h.act('accept',{choice:d.choices[0].id}).ok,false);assert.deepEqual(h.sim.snapshot(),none);}
 });
 for(const choice of d.choices){
  test(d.id+' '+choice.id+' physical work, durable candidate refusal and exact one payout',()=>{
   const h=fixture(d),before=h.sim.snapshot();assert.ok(h.act('accept',{choice:choice.id}).ok);const accepted=h.sim.snapshot();
   assert.equal(h.act('accept',{choice:d.choices.at(-1).id}).duplicate,true);assert.deepEqual(h.sim.snapshot(),accepted);
   assert.equal(h.act('claim').ok,false);assert.deepEqual(h.sim.snapshot(),accepted);
   for(const source of d.steps){
    const site=L.stepSite(d,source,choice.id);h.place(site);
    if(site.medium!=='dry'){
     /* Labelled body-position boundary, not a swimming route. */
     h.sim.worldDive={y:site.y};
    }
    const unpaid=h.sim.snapshot(),payload={step:source.id,assembly:source.assembly?.correct};
    if(site.assembly){assert.equal(h.act('step',{...payload,assembly:'wrong'}).ok,false);assert.deepEqual(h.sim.snapshot(),unpaid);}
    assert.equal(h.act('step',payload,{save:()=>({ok:false,error:'synthetic durable refusal'})}).ok,false);assert.deepEqual(h.sim.snapshot(),unpaid);
    const result=h.act('step',payload);assert.ok(result.ok,result.error);assert.equal(h.act('step',payload).duplicate,true);
    assert.equal(h.sim.state.localLife.records[d.id].choice,choice.id);assert.deepEqual(C.validate(h.sim.snapshot()).localLife,h.sim.state.localLife);
   }
   h.sim.worldDive=null;h.place(d.returner||d.giver);const complete=h.sim.snapshot();assert.ok(L.ready(complete,d));
   h.sim.state.adventure.coins=9999;const blocked=h.sim.snapshot();assert.equal(h.act('claim').ok,false);assert.deepEqual(h.sim.snapshot(),blocked);h.sim.state.adventure.coins=complete.adventure.coins;
   assert.equal(h.act('claim',{}, {save:()=>({ok:false,error:'synthetic claim refusal'})}).ok,false);assert.deepEqual(h.sim.snapshot(),complete);
   const refs={adventure:h.sim.state.adventure,companion:h.sim.state.adventure.companion,equipment:h.sim.state.adventure.equipment,inventory:h.sim.state.sandbox.inventory};
   const result=h.act('claim');assert.ok(result.ok,result.error);const paid=h.sim.snapshot();
   for(const k of['xp','coins','ore'])assert.equal(paid.adventure[k]-before.adventure[k],d.reward[k]);
   for(const[k,n]of Object.entries(d.reward.materials||{}))assert.equal(paid.sandbox.inventory[k]-before.sandbox.inventory[k],n);
   assert.equal(h.act('claim',{request:'different'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);
   assert.strictEqual(h.sim.state.adventure,refs.adventure);assert.strictEqual(h.sim.state.adventure.companion,refs.companion);assert.strictEqual(h.sim.state.adventure.equipment,refs.equipment);assert.strictEqual(h.sim.state.sandbox.inventory,refs.inventory);
   for(const k of['realmTrails','journeys','earthExpedition','notes','flowers','score','retreat','visitor'])assert.deepEqual(paid[k],before[k],k);
   for(const k of['owned','equipment','arsenal','companion','realmCraft','earthBinding','hp','stamina'])assert.deepEqual(paid.adventure[k],before.adventure[k],k);
  });
 }
}
test('dry sites and both selected Heaven beds retain full canonical foot support',()=>{
 for(const d of L.definitions)for(const choice of d.choices)for(const source of d.steps){const p=L.stepSite(d,source,choice.id);if(p.medium==='dry')assert.ok(W.walkable(W.definition(d.realm).room,p.x,p.z),d.id+':'+p.id+':'+choice.id);}
});
test('Atlantis work requires actual gallery body depth and medium',()=>{
 const d=L.definitions.find(d=>d.realm==='atlantis'),h=fixture(d);h.act('accept',{choice:'desk'});h.place(d.steps[0]);h.act('step',{step:d.steps[0].id,assembly:'keyed'});
 const gauge=d.steps[1];h.place(gauge);const raw=h.sim.snapshot();assert.equal(h.act('step',{step:gauge.id}).ok,false);assert.deepEqual(h.sim.snapshot(),raw);
 h.sim.worldDive={y:gauge.y+.8};assert.equal(h.act('step',{step:gauge.id}).ok,false);
 h.sim.worldDive={y:gauge.y};assert.ok(h.act('step',{step:gauge.id}).ok);
 const court=d.steps[2];h.place(court);h.sim.worldDive={y:-.5};assert.equal(h.act('step',{step:court.id}).ok,false);h.sim.worldDive={y:court.y};assert.ok(h.act('step',{step:court.id}).ok);
});
test('material capacity and 9999 XP boundary retain whole-payment atomicity',()=>{
 const d=L.definitions.find(d=>d.realm==='cosmos'),h=fixture(d);h.act('accept',{choice:'route'});
 for(const s of d.steps){h.place(s);h.act('step',{step:s.id,assembly:s.assembly?.correct});}h.place(d.returner);h.sim.state.sandbox.inventory.wood=S.MAX;const blocked=h.sim.snapshot();assert.equal(h.act('claim').ok,false);assert.deepEqual(h.sim.snapshot(),blocked);
 h.sim.state.sandbox.inventory.wood=0;h.sim.state.adventure.xp=9999;const result=h.act('claim');assert.ok(result.ok);assert.equal(result.reward.xp,0);assert.equal(h.sim.state.adventure.xp,9999);
});
test('new art reads accepted state, emits finite supported shapes and preserves canonical state',()=>{
 for(const d of L.definitions)for(const choice of d.choices){const h=fixture(d),empty={box:[],octa:[],disc:[]};Art.draw(empty,h.sim);assert.equal(Object.values(empty).flat().length,0);h.act('accept',{choice:choice.id});
  const r=h.sim.state.localLife.records[d.id];r.steps=d.steps.map(s=>s.id);const before=h.sim.snapshot(),out={box:[],octa:[],disc:[]};Art.draw(out,h.sim);assert.deepEqual(h.sim.snapshot(),before);const parts=Object.values(out).flat();assert.ok(parts.length>5&&parts.length<100);for(const p of parts){assert.ok([...p.p,...p.s].every(Number.isFinite));assert.ok(p.s.every(v=>v>0));assert.equal(p.cameraSolid,false);assert.equal(p.localLifeChoice,choice.id);}
 }
});
test('both fitted Cosmos arrangements clear the production bench backrest',()=>{
 require('../src/engine.js');require('../src/world.js');
 const d=L.definitions.find(d=>d.realm==='cosmos');
 for(const choice of d.choices){const h=fixture(d);h.act('accept',{choice:choice.id});h.sim.state.localLife.records[d.id].steps=d.steps.map(s=>s.id);
  const out={box:[],octa:[],disc:[]};Art.draw(out,h.sim);
  const bench=[];globalThis.RealmArt.WorldArt.prototype.bench.call({box:(x,y,z,sx,sy,sz)=>bench.push({p:[x,y,z],s:[sx,sy,sz]})},-6,4.2,0,globalThis.RealmCosmos.height(-6,4.2));
  const back=bench.at(-1),overlap=(a,b)=>a.p.every((v,i)=>Math.abs(v-b.p[i])<(a.s[i]+b.s[i])/2-1e-5);
  for(const p of out.box.filter(p=>['fitted-drawing-board','shelf-page','writing-tray-rim','route-shelf-back'].includes(p.localLifePart)))assert.equal(overlap(p,back),false,choice.id+' '+p.localLifePart);
 }
});
test('legacy Cosmos presentation is handed over only after explicit local acceptance',()=>{
 require('../src/world-foundations-ui.js');
 const d=L.definitions.find(d=>d.realm==='cosmos'),h=fixture(d);delete h.sim.worldTrip;
 const local=()=>globalThis.RealmWorldFoundationsUI.WorldUI.prototype.local.call({sim:h.sim});
 assert.equal(local(),false,'untouched legacy invitation retains its original presentation');h.act('accept',{choice:'route'});assert.equal(local(),true);
 for(const s of d.steps){h.place(s);h.act('step',{step:s.id,assembly:s.assembly?.correct});}h.place(d.returner);h.act('claim');assert.equal(local(),true,'lasting paid shelf remains visible through the same local map');
});
