/* Command-earned kit and physical movement. In-memory persistence is explicit;
 * malformed save probes and numeric boundaries are labelled synthetic cases. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs');
const C=require('../src/core.js'),R=require('../src/realm-trails.js');
require('../src/world-foundations-ui.js');const UI=global.RealmWorldFoundationsUI;
const definition=()=>R.definitions().find(d=>d.realm==='cosmos');
function setup(){const h=createHarness();earnedKit(h,false);h.enter('cosmos');const d=definition();h.walk(d.giver.x,d.giver.z);h.trail('accept',d);return{h,d};}
const io=h=>({save:h.save});
const action=(h,d,s,value)=>R.command(h.context(),'step',{quest:d.id,step:s.id,setting:value},io(h));
function unchanged(h,fn){const before=h.sim.snapshot(),saves=h.checkpoints.length,result=fn();assert.equal(result.ok,false);assert.deepEqual(h.sim.snapshot(),before);assert.equal(h.checkpoints.length,saves);}
test('two real sight stations expose earned comparator preview without mutating the world',()=>{
 const {h,d}=setup(),s=d.steps.find(s=>s.instrument);h.walk(s.x,s.z);const before=h.sim.snapshot(),saves=h.checkpoints.length;
 assert.equal(R.setting(h.sim,d.id,s.id),45);const result=R.adjust(h.context(),d.id,s.id,s.instrument.target);
 assert.equal(result.ok,true);assert.equal(result.aligned,true);assert.deepEqual(h.sim.snapshot(),before);assert.equal(h.checkpoints.length,saves);
 assert.ok(UI.trailPoints(h.sim).some(p=>p.id===s.id));assert.match(UI.mapSVG(global.RealmWorldFoundations.definition(h.sim.room),h.sim),/data-trail-marker/);
 assert.match(UI.trailLegend(h.sim),/Accepted trail/);
});
test('misaligned, absent, remote, nonfinite and out-of-scale calibration cannot record or spend',()=>{
 const {h,d}=setup(),s=d.steps.find(s=>s.instrument);
 unchanged(h,()=>R.adjust(h.context(),d.id,s.id,s.instrument.target));h.walk(s.x,s.z);
 unchanged(h,()=>action(h,d,s,s.instrument.target)); // target data alone is not a turned physical comparator
 for(const value of [undefined,NaN,Infinity,-Infinity,-.1,90.1,'64',null])unchanged(h,()=>R.adjust(h.context(),d.id,s.id,value));
 assert.ok(R.adjust(h.context(),d.id,s.id,s.instrument.target+3).ok);unchanged(h,()=>action(h,d,s,s.instrument.target+3));
 assert.ok(R.adjust(h.context(),d.id,s.id,s.instrument.target).ok);unchanged(h,()=>action(h,d,s,s.instrument.target+1));
});
test('unrecorded dial resets on cold reload; recorded values, prerequisites and once-only claim survive',()=>{
 const {h,d}=setup(),instruments=d.steps.filter(s=>s.instrument),arm=d.steps.find(s=>!s.instrument);
 h.walk(arm.x,arm.z);unchanged(h,()=>action(h,d,arm));
 const first=instruments[0];h.walk(first.x,first.z);assert.ok(R.adjust(h.context(),d.id,first.id,first.instrument.target).ok);h.reload('cosmos');h.walk(first.x,first.z);
 assert.equal(R.setting(h.sim,d.id,first.id),first.instrument.initial);
 for(const s of instruments){h.walk(s.x,s.z);assert.ok(R.adjust(h.context(),d.id,s.id,s.instrument.target).ok);assert.ok(action(h,d,s,s.instrument.target).ok);
  const saved=h.sim.snapshot();h.reload('cosmos');assert.deepEqual(h.sim.state.realmTrails,saved.realmTrails);
  assert.equal(R.setting(h.sim,d.id,s.id),s.instrument.target);h.walk(s.x,s.z);const dup=action(h,d,s,s.instrument.target);assert.equal(dup.duplicate,true);
 }
 h.walk(arm.x,arm.z);assert.ok(action(h,d,arm).ok);assert.ok(UI.trailPoints(h.sim).some(p=>p.id===d.giver.id));
 h.walk(d.giver.x,d.giver.z);const before=h.sim.snapshot();h.trail('claim',d);for(const k of ['xp','coins','ore'])assert.equal(h.sim.state.adventure[k]-before.adventure[k],d.reward[k]);
 const paid=h.sim.snapshot();h.reload('cosmos');h.walk(d.giver.x,d.giver.z);assert.equal(h.trail('claim',d,{request:'different'}).duplicate,true);assert.deepEqual(h.sim.state.realmTrails,paid.realmTrails);
 assert.deepEqual(UI.trailPoints(h.sim),[]);
});
test('save refusal leaves an aligned physical comparator retryable and its earned state unchanged',()=>{
 const {h,d}=setup(),s=d.steps.find(s=>s.instrument);h.walk(s.x,s.z);assert.ok(R.adjust(h.context(),d.id,s.id,s.instrument.target).ok);
 unchanged(h,()=>R.command(h.context(),'step',{quest:d.id,step:s.id,setting:s.instrument.target},{save:()=>({ok:false,error:'synthetic full disk'})}));
 assert.equal(R.setting(h.sim,d.id,s.id),s.instrument.target);assert.ok(action(h,d,s,s.instrument.target).ok);
});
test('import refuses fabricated instrument histories while preserving source objects',()=>{
 const {h,d}=setup(),s=d.steps.find(s=>s.instrument),base=h.sim.snapshot();
 const probes=[r=>r.settings.foreign=20,r=>r.settings[s.id]=s.instrument.target,r=>r.steps.push(s.id),r=>{r.steps.push(s.id);r.settings[s.id]=s.instrument.target+3;},r=>{r.steps.push(s.id);r.settings[s.id]='64';}];
 for(const edit of probes){const raw=structuredClone(base);edit(raw.realmTrails.records[d.id]);const before=structuredClone(raw);assert.throws(()=>C.validate(raw));assert.deepEqual(raw,before);}
});
