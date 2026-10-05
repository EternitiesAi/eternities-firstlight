'use strict';
/* Readback of genuine command-earned checkpoints plus explicitly synthetic
 * capacity/write/owner boundary fixtures. These are CPU tests, not native play. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../tools/earth-homecoming-journey/earned_common.cjs'),J=require('../tools/earth-homecoming-journey/connected_homecoming.cjs');
if(!process.env.EARTH_EARNED_REPORT){test('explicit current Earth command-earned cohort is required',{skip:'Run tools/earth_homecoming_journey.cjs; this generic rules invocation has no cohort path.'},()=>{});}else{
const epoch=process.env.EARTH_INSTALLED_EPOCH;assert.ok(epoch,'explicit current-source epoch path required');
P.installedEpoch(epoch,process.env.EARTH_INSTALLED_EPOCH_SHA);P.initialize();
const reportPath=process.env.EARTH_EARNED_REPORT;assert.ok(reportPath,'explicit command-earned cohort report is required');
const cohort=JSON.parse(fs.readFileSync(reportPath)),C=P.load('core'),H=P.load('earth-homecoming'),CS=P.load('characters'),D=H.definition;
function earned(result,name){const file=path.join(path.dirname(result.earthReport.path),name+'.json'),r=JSON.parse(fs.readFileSync(result.earthReport.path)),link=r.checkpoints.find(p=>p.path===file);assert.ok(link);J.link(link);return JSON.parse(fs.readFileSync(file));}
const blade=cohort.results.find(r=>r.variant==='blade');assert.ok(blade);
function fixture(edit=()=>{}){const raw=earned(blade,'06_HOME_UNPAID');edit(raw);const m=P.profile(C.validate(raw)),sim=new C.Simulation(m.state),app=P.productionApp(sim,m.store);return{...m,sim,app};}
function payload(f,extra={}){return{quest:D.id,expectedActive:f.store.active,expectedRevision:f.sim.state.adventure.revision,...extra};}
function claim(f){return f.app.command('claim',payload(f));}
function unchanged(f,world,bytes){assert.deepEqual(f.sim.snapshot(),world);assert.equal(f.values.get(CS.KEY),bytes);}
function paidDelta(f,before,result){assert.ok(result.ok,result.error);assert.equal(f.sim.state.earthHomecoming.claimed,true);for(const k of['xp','coins','ore'])assert.equal(f.sim.state.adventure[k]-before.adventure[k],result.reward[k]);for(const[k,n]of Object.entries(D.reward.materials))assert.equal(f.sim.state.sandbox.inventory[k]-before.sandbox.inventory[k],n);P.preserved(f.sim.snapshot(),before);}

test('all three real continuations bind the frozen installed source and exact output bytes',()=>{
 assert.equal(cohort.status,'passed');assert.equal(cohort.sourceFrozen,true);assert.deepEqual(cohort.results.map(r=>r.variant),['blade','bow','strongest']);assert.ok(Object.keys(cohort.sourceEpoch.actual).length>=150);for(const p of ['src/core.js','src/earth-homecoming.js','src/app.js','tools/earth_homecoming_journey.cjs'])assert.ok(cohort.sourceEpoch.actual[p]);assert.deepEqual(cohort.sourceEpoch,P.epoch());
 for(const r of cohort.results){J.link(r.earthReport);J.link(r.final);for(const[k,v]of Object.entries(P.ZERO))assert.equal(cohort[k],v);}
});
test('historical blade and explicit pre-IV bow fixtures preserve their byte-bound original character history',()=>{
 for(const v of['blade','bow']){const input=J.inputFor(v),r=cohort.results.find(r=>r.variant===v);assert.deepEqual(r.origin,input.provenance);assert.equal(r.migration.source.sha256,input.input.sha256);assert.equal(r.prerequisiteLineage.length,0);assert.match(r.origin.kind,/continuous/);}
 assert.match(cohort.results.find(r=>r.variant==='bow').origin.note,/bow/i);
});
test('strongest fixture origin is disclosed and genuinely earns its missing owners on the same world',()=>{
 const r=cohort.results.find(r=>r.variant==='strongest');assert.match(r.origin.kind,/fixture-origin/);assert.equal(r.prerequisiteLineage.length,4);let previous=r.migration.output.sha256;for(const e of r.prerequisiteLineage){assert.equal(e.input.sha256,previous);J.link(e.input);J.link(e.output);J.link(e.report);previous=e.output.sha256;}
 const world=earned(r,'01_ACCEPTED');assert.ok(H.eligible(world));assert.ok(world.cosmosCampaign.claimed&&world.hellCampaign.claimed&&world.heavenCampaign.claimed&&world.atlantisCampaign.claimed);assert.ok(world.adventure.earthStory.claimed&&world.earthExpedition.story.claimed);
});
test('actual optional migration adds only an empty Earth owner to each historical world',()=>{
 for(const r of cohort.results){J.link(r.migration.source);J.link(r.migration.output);const raw=JSON.parse(fs.readFileSync(r.migration.source.path)),out=JSON.parse(fs.readFileSync(r.migration.output.path));assert.deepEqual(out.earthHomecoming,H.fresh());delete out.earthHomecoming;assert.deepEqual(out,raw);assert.ok(r.sourceDeltas.some(p=>p.path==='src/core.js'));}
});
test('exact portable fixture receipts, paths and variant selection reject forged metadata',()=>{
 const meta=JSON.parse(fs.readFileSync(path.join(P.ROOT,'tests/fixtures/earth-homecoming-prerequisites/PROVENANCE.json'))),changed=P.copy(meta);changed.records.blade.sha256='0'.repeat(64);assert.throws(()=>J.inputFor('blade',changed),/byte-bound fixture receipt/);changed.records.blade.sha256=meta.records.blade.sha256;changed.records.blade.path='../some-other-save.json';assert.throws(()=>J.inputFor('blade',changed),/declared repository fixture path/);assert.throws(()=>J.plan('fresh-bow-I'));assert.throws(()=>J.link({path:reportPath,sha256:'0'.repeat(64)}),/exact linked bytes/);assert.equal(J.inputFor('blade').provenance.originalReportsReplayed,false);
});
test('earned signals include three immutable scheduled contacts and actual blade or arrow damage',()=>{
 for(const r of cohort.results){const j=JSON.parse(fs.readFileSync(r.earthReport.path)),p=j.combat;assert.ok(j.priorOwnersPreserved&&j.all12Paid);assert.equal(j.syntheticGameplaySetup,false);assert.equal(j.nativePersistence,false);assert.equal(j.browserExecuted,false);assert.ok(j.reloads>=7);assert.ok(p.guards>0);
  assert.deepEqual(j.coldReloads.map(r=>r.label),['accepted','ordered-relays','regent-repelled','chosen','verified-away-from-home','home-unpaid','paid']);assert.ok(j.coldReloads.every(r=>r.wholeSnapshotPreserved));assert.deepEqual([...new Set(p.frames.map(f=>f.frame.pattern))].sort(),['claim-lane','closing-ring','false-shelter']);assert.ok(p.contacts.length>=3);assert.ok(p.contacts.some(c=>c.hit&&c.damage>=0));assert.ok(p.weaponImpacts.every(i=>i.before>i.after));assert.ok(p.weaponImpacts.length);
  if(r.variant==='bow'){assert.equal(p.style,'bow');assert.ok(p.arrowFrames>0);assert.ok(p.weaponImpacts.every(i=>i.caller==='production projectile impact'));assert.ok(p.contacts.some(c=>c.frame.pattern==='false-shelter'&&c.frame.length>10));}else assert.equal(p.style,'blade');
 }
});
test('saved choice, Vessa verification, physical home arrival and payment remain separate',()=>{
 for(const r of cohort.results){const chosen=earned(r,'04_CHOICE'),verified=earned(r,'05_VERIFIED'),unpaid=earned(r,'06_HOME_UNPAID'),paid=earned(r,'07_PAID');assert.equal(chosen.earthHomecoming.claimed,false);assert.equal(verified.earthHomecoming.claimed,false);assert.equal(H.ready(verified),false);assert.ok(!verified.earthHomecoming.steps.includes('home-return'));assert.equal(H.ready(unpaid),true);assert.equal(unpaid.earthHomecoming.claimed,false);assert.equal(paid.earthHomecoming.claimed,true);assert.equal(paid.adventure.coins-unpaid.adventure.coins,20);assert.equal(paid.sandbox.inventory.crystal-unpaid.sandbox.inventory.crystal,1);}
 assert.equal(earned(cohort.results.find(r=>r.variant==='bow'),'07_PAID').earthHomecoming.choice,'reviewed-custody');assert.equal(earned(blade,'07_PAID').earthHomecoming.choice,'public-watch');
});
test('actual Regent exhaustion pays no generic loot and the final chapter preserves every prior owner',()=>{
 for(const r of cohort.results){const relays=earned(r,'02_RELAYS'),repelled=earned(r,'03_REGENT_REPELLED'),accepted=JSON.parse(fs.readFileSync(JSON.parse(fs.readFileSync(r.earthReport.path)).input.path)),final=JSON.parse(fs.readFileSync(r.final.path));for(const k of['xp','coins','ore','drops','defeated'])assert.deepEqual(repelled.adventure[k],relays.adventure[k]);assert.deepEqual(repelled.sandbox.inventory,relays.sandbox.inventory);P.preserved(final,accepted);}
});
test('strongest keeps its paid Open Confluence and historical kit through missing-prerequisite commands',()=>{
 const r=cohort.results.find(r=>r.variant==='strongest'),before=JSON.parse(fs.readFileSync(r.migration.output.path)),after=earned(r,'01_ACCEPTED');assert.deepEqual(after.cosmosCampaign,before.cosmosCampaign);assert.deepEqual(after.realmTrails.records['cosmos-split-bearing-v1'],before.realmTrails.records['cosmos-split-bearing-v1']);for(const k of['equipment','owned','arsenal','realmCraft','reward','crossing'])assert.deepEqual(after.adventure[k],before.adventure[k]);
});
test('synthetic full coin boundary refuses the entire payment before storage, then real claim can retry',()=>{
 const f=fixture(w=>{w.adventure.coins=9999;}),before=f.sim.snapshot(),bytes=f.values.get(CS.KEY),out=claim(f);assert.equal(out.ok,false);assert.match(out.error,/whole fee/);unchanged(f,before,bytes);
 // Restored capacity is an explicitly synthetic unit condition, not earned money.
 f.sim.state.adventure.coins-=20;const room=f.sim.snapshot();paidDelta(f,room,claim(f));
});
test('synthetic material capacity refuses every currency and retained account atomically',()=>{
 const f=fixture(w=>{w.sandbox.inventory.crystal=P.load('sandbox').MAX;}),before=f.sim.snapshot(),bytes=f.values.get(CS.KEY);assert.equal(claim(f).ok,false);unchanged(f,before,bytes);
});
test('actual Store write refusal leaves earned ready work unpaid and can retry after storage recovers',()=>{
 const f=fixture(),before=f.sim.snapshot(),bytes=f.values.get(CS.KEY),original=f.storage.setItem;f.storage.setItem=()=>{throw Error('labelled synthetic quota refusal');};const out=claim(f);assert.equal(out.ok,false);assert.match(out.error,/quota refusal/);unchanged(f,before,bytes);f.storage.setItem=original;paidDelta(f,before,claim(f));
});
test('actual stale tab bytes refuse payment without overwriting the external character library',()=>{
 const f=fixture(),before=f.sim.snapshot(),external=JSON.parse(f.values.get(CS.KEY));external.revision++;const bytes=JSON.stringify(external);f.values.set(CS.KEY,bytes);assert.equal(claim(f).ok,false);unchanged(f,before,bytes);
});
test('wrong active owner and old action revision never reach the saver',()=>{
 const f=fixture(),before=f.sim.snapshot(),bytes=f.values.get(CS.KEY);assert.equal(f.app.command('claim',payload(f,{expectedActive:'character-1'})).ok,false);assert.equal(f.app.command('claim',payload(f,{expectedRevision:before.adventure.revision-1})).ok,false);unchanged(f,before,bytes);
});
test('exact installed application writer refuses a real character switch after binding',()=>{
 const f=fixture();f.app.context();const old=f.app.scope.earthHomecomingWriter(),world=f.sim.snapshot(),switched=f.store.command('switch',{id:'character-1'},world,f.store.revision);assert.ok(switched.ok);const saved=f.values.get(CS.KEY);assert.equal(old(world).ok,false);assert.equal(f.values.get(CS.KEY),saved);assert.deepEqual(f.sim.snapshot(),world);
});
test('pending owner replacement during save cannot adopt a paid account into another state',()=>{
 const f=fixture(),ctx=f.app.context(),before=f.sim.snapshot(),bytes=f.values.get(CS.KEY),replacement=C.validate(before),out=H.command(ctx,'claim',payload(f),{save:()=>{f.sim.state=replacement;return{ok:true};}});assert.equal(out.ok,false);assert.match(out.error,/changed during saving/);assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.values.get(CS.KEY),bytes);
});
test('synthetic capped XP clips only XP while delivering the complete declared fixed fee',()=>{
 const f=fixture(w=>{w.adventure.xp=9999;}),before=f.sim.snapshot(),out=claim(f);assert.equal(out.reward.xp,0);paidDelta(f,before,out);
});
test('actual paid replay survives Store cold reload and leaves inactive character bytes unchanged',()=>{
 const f=fixture(),inactive=P.copy(f.store.record.slots[0]);assert.ok(claim(f).ok);const before=f.sim.snapshot(),bytes=f.values.get(CS.KEY);assert.equal(claim(f).duplicate,true);unchanged(f,before,bytes);const store=new CS.Store(f.storage),loaded=store.load();assert.equal(loaded.status,'loaded');store.writer=true;const sim=new C.Simulation(loaded.state),app=P.productionApp(sim,store),out=app.command('claim',{quest:D.id,expectedActive:store.active,expectedRevision:sim.state.adventure.revision});assert.equal(out.duplicate,true);assert.deepEqual(sim.snapshot(),before);assert.deepEqual(store.record.slots[0],inactive);assert.equal(f.values.get(CS.KEY),bytes);
});
test('staged caller source remains frozen and has no direct progress or combat injection spellings',()=>{assert.deepEqual(P.callerAudit(),cohort.callerAudit);assert.deepEqual(P.epoch(),cohort.sourceEpoch);});

}
