'use strict';
/* The real hell and heaven gates, loaded without tests/hellheaven_night_gate.cjs. The saga's order decides when
 * each door opens, a fresh save cannot reach either road early, heaven's opening walk holds no hostile, the envoy's
 * reading comes before the approach watch, and the bosses take the difficulty table when it lands. */
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),SG=require('../src/saga.js'),W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js');
const H=require('../src/hell-campaign.js'),V=require('../src/heaven-campaign.js');
const HELL_TO_VEYR=['witness-record','tovan-account','read-service-writ','challenge-veyr'];
const HEAVEN_TO_WATCH=['witness-account','compare-arrival-marks','inspect-false-relay'];
const HEAVEN_TO_SERAPH=[...HEAVEN_TO_WATCH,'begin-watch','beam-disabled'];
function world(room){const sim=new C.Simulation(C.fresh());sim.room=room;return sim;}

test('the saga opens hell only after the night and heaven only after hell; an accepted road keeps its door',()=>{
 const w=C.fresh();
 assert.equal(SG.allowed(w,'hell'),false);assert.equal(SG.allowed(w,'heaven'),false);
 w.hellCampaign.accepted=true;
 assert.equal(SG.allowed(w,'hell'),true,'an accepted hell road keeps its door');
 assert.equal(SG.allowed(w,'heaven'),false,'accepting hell does not open heaven');
 w.heavenCampaign.accepted=true;assert.equal(SG.allowed(w,'heaven'),true,'an accepted heaven road keeps its door');
});

test('each campaign is eligible only through its trail and the saga gate',()=>{
 const w=C.fresh();w.adventure.started=true;
 w.realmTrails.records['hell-open-cage-v1'].claimed=true;w.realmTrails.records['heaven-broken-choir-v1'].claimed=true;
 assert.equal(H.eligible(w),false,'the Open Cage alone does not open the foundry road');
 assert.equal(V.eligible(w),false,'the Broken Choir alone does not open the garden gate');
 w.hellCampaign.accepted=true;assert.equal(H.eligible(w),true);assert.equal(V.eligible(w),false,'the hell road does not open heaven');
});

test('the regent is seen at the foundry only once the road is accepted, and the prophecy is read only in heaven’s road',()=>{
 const sim=world(null);
 assert.equal(SG.regentSeen(sim,'foundry').ok,false,'no sighting before the road');
 assert.equal(SG.prophecyHeard(sim,'heaven').ok,false,'no reading before the garden road');
 sim.state.hellCampaign.accepted=true;assert.equal(SG.regentSeen(sim,'foundry').ok,true);
 sim.state.heavenCampaign.accepted=true;assert.equal(SG.prophecyHeard(sim,'heaven').ok,true);
 assert.deepEqual(sim.state.saga.regent,['foundry']);assert.deepEqual(sim.state.saga.prophecy,['heaven']);
});

test('heaven’s opening walk holds no hostile, and the approach watch waits on the envoy’s reading',()=>{
 const sim=world('world-heaven');
 sim.state.heavenCampaign=V.validate({version:1,accepted:true,steps:HEAVEN_TO_WATCH,choice:null,claimed:false});
 assert.deepEqual(V.enemies(sim),[],'no campaign hostile on the opening walk');
 assert.deepEqual(R.enemies(sim),[],'no trail hostile on the opening walk');
 assert.equal(V.available(sim.state).some(s=>s.id==='begin-watch'),false,'the watch waits on the reading');
 sim.state.saga.prophecy=['heaven'];
 assert.equal(V.available(sim.state).some(s=>s.id==='begin-watch'),true,'the reading opens the watch');
});

test('hell’s warden takes 2080 health and 26 damage, and the difficulty table replaces them when it lands',()=>{
 const sim=world('world-hell');
 sim.state.hellCampaign=H.validate({version:1,accepted:true,steps:HELL_TO_VEYR,choice:null,claimed:false});
 const [veyr]=H.enemies(sim);
 assert.equal(veyr.hp,2080);assert.equal(veyr.damage,26);
 globalThis.RealmDifficulty={boss:id=>id==='foundryWarden'?{hp:700,damage:41}:null};
 try{const [table]=H.enemies(sim);assert.equal(table.hp,700);assert.equal(table.damage,41);}finally{delete globalThis.RealmDifficulty;}
});

test('heaven’s relay seraph takes 2470 health and 27 damage, and the difficulty table replaces them when it lands',()=>{
 const sim=world('world-heaven');
 sim.state.heavenCampaign=V.validate({version:1,accepted:true,steps:HEAVEN_TO_SERAPH,choice:null,claimed:false});
 const seraph=V.enemies(sim).find(e=>e.id==='heaven-relay-seraph-v1');
 assert.ok(seraph,'the seraph wakes once the glasswing is broken');
 assert.equal(seraph.hp,2470);assert.equal(seraph.damage,27);
 globalThis.RealmDifficulty={boss:id=>id==='relaySeraph'?{hp:800,damage:44}:null};
 try{const table=V.enemies(sim).find(e=>e.id==='heaven-relay-seraph-v1');assert.equal(table.hp,800);assert.equal(table.damage,44);}finally{delete globalThis.RealmDifficulty;}
});

test('the foundry sighting and the envoy’s reading are kept by their own rules, not by the campaign page',()=>{
 assert.ok(W.definition('world-hell')&&W.definition('world-heaven'),'both realm rooms exist');
 assert.equal(H.sighted(C.fresh()),false);assert.equal(V.heard(C.fresh()),false);
});
