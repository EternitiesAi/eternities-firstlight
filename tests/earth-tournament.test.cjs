/* Synthetic boundary fixtures for production owner/writer rules.
 * These do not substitute for the later command-earned/native combat journey. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),T=require('../src/combat.js'),E=require('../src/earth.js'),R=require('../src/earth-tournament.js');
const {removeEmptyGate}=require('./helpers/earth-tournament-migration.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function fresh(){const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};assert.equal(A.command(s,'kit','start').ok,true);
 s.room=E.ROOM;s.returnPos={x:0,z:23,yaw:0};s.state.player={x:5,z:-27.6,yaw:Math.PI};return s;}
function context(s,current=()=>true){const state=s.state;return{sim:s,active:'synthetic-rain-owner',current:()=>s.state===state&&current()};}
function call(s,type,extra={},save=()=>({ok:true}),current=()=>true){const c=context(s,current);return R.command(c,type,{quest:R.definition.id,expectedActive:c.active,expectedRevision:s.state.adventure.revision,family:AR.weapon(s.state.adventure).style,...extra},{save});}
function enter(){const s=fresh();assert.equal(call(s,'enter').ok,true);return s;}
function complete(s){
 A.runtime(s).enemies=R.enemies(s).map(e=>({...e}));const e=A.runtime(s).enemies[0],seen=new Set();
 for(let i=0;!R.view(s).complete;i++){
  assert.ok(i<700);const v=R.view(s);
  if(v.phase==='opening'&&!seen.has(v.round)){seen.add(v.round);assert.equal(R.contact(s,e,R.stamp(s,'primary')),true);}
  s.state.adventure.elapsed+=.05;T.runtime(s).guardUntil=s.state.adventure.elapsed+.1;R.tick(s,.05);
 }
 assert.equal(R.view(s).score,6);return s;
}
test('an entered bout adopts only its checked record, revision and journal',()=>{
 const s=fresh(),before=s.snapshot();let written;
 const r=call(s,'enter',{},candidate=>{written=clone(candidate);return{ok:true};});assert.equal(r.ok,true,r.error);
 const after=s.snapshot(),normalized=clone(after);normalized.adventure.earthTournament=before.adventure.earthTournament;normalized.adventure.revision=before.adventure.revision;normalized.journal=before.journal;normalized.nextEvent=before.nextEvent;
 assert.deepEqual(normalized,before);assert.deepEqual(written,after);assert.equal(R.view(s).run,1);
 assert.equal(call(s,'enter').ok,false);assert.equal(s.state.adventure.earthTournament.issued,1);
});
test('entry requires actual kit, correct family, current owner/revision and supported proximity',()=>{
 const s=fresh(),before=s.snapshot();
 for(const extra of[{family:'bow'},{expectedActive:'other'},{expectedRevision:999},{quest:'other'}])assert.equal(call(s,'enter',extra).ok,false);
 assert.equal(call(s,'enter',{},()=>({ok:true}),()=>false).ok,false);assert.deepEqual(s.snapshot(),before);
 s.state.player={x:0,z:24,yaw:0};assert.equal(call(s,'enter').ok,false);
 const blank=new C.Simulation();assert.equal(call(blank,'enter').ok,false);
});
test('refused, thrown, asynchronous and mutated writer results never adopt entry',()=>{
 for(const writer of[()=>({ok:false}),()=>{throw Error('quota');},()=>Promise.resolve({ok:true}),()=>({ok:true,adopted:false}),q=>{q.adventure.xp++;return{ok:true};}]){
  const s=fresh(),before=s.snapshot();assert.equal(call(s,'enter',{},writer).ok,false);assert.deepEqual(s.snapshot(),before);assert.equal(R.view(s),null);
 }
 const s=fresh(),c=context(s);assert.equal(R.command(c,'enter',{quest:R.definition.id,expectedActive:c.active,expectedRevision:s.state.adventure.revision,family:'blade'},{}).ok,false);
});
test('writer-time owner loss refuses adoption without erasing a concurrent edit',()=>{
 const s=fresh(),before=s.snapshot();let active=true;
 assert.equal(call(s,'enter',{},()=>{active=false;return{ok:true};},()=>active).ok,false);assert.deepEqual(s.snapshot(),before);
 assert.equal(call(s,'enter',{},()=>{s.state.adventure.coins++;return{ok:true};}).ok,false);
 const expected=clone(before);expected.adventure.coins++;assert.deepEqual(s.snapshot(),expected);assert.equal(R.view(s),null);
});
test('a completed live result survives a refused writer and records once on retry',()=>{
 const s=complete(enter()),before=s.snapshot();
 assert.equal(call(s,'record',{},()=>({ok:false,error:'quota'})).ok,false);assert.deepEqual(s.snapshot(),before);assert.equal(R.view(s).complete,true);
 assert.equal(call(s,'record').ok,true);const final=s.snapshot();assert.equal(final.adventure.earthTournament.best.blade,6);assert.equal(final.adventure.earthTournament.finished.blade,1);
 for(let i=0;i<3;i++){assert.equal(call(s,'record',{requestId:'changed-'+i}).ok,false);assert.deepEqual(s.snapshot(),final);}
 const normalized=clone(final);normalized.adventure.earthTournament=before.adventure.earthTournament;normalized.adventure.revision=before.adventure.revision;normalized.journal=before.journal;normalized.nextEvent=before.nextEvent;assert.deepEqual(normalized,before);
});
test('cold reload preserves a saved result but cannot backfill an unfinished attempt',()=>{
 const done=complete(enter());assert.equal(call(done,'record').ok,true);const saved=done.snapshot();assert.deepEqual(new C.Simulation(saved).snapshot(),saved);
 const pending=enter().snapshot(),s=new C.Simulation(pending);assert.equal(R.view(s),null);assert.equal(call(s,'record').ok,false);
 assert.equal(call(s,'withdraw').ok,true);assert.equal(s.state.adventure.earthTournament.closed,1);assert.equal(s.state.adventure.earthTournament.best.blade,null);
 const after=s.snapshot();assert.equal(call(s,'withdraw').duplicate,true);assert.deepEqual(s.snapshot(),after);
});
test('character/state, weapon and scene replacements revoke live scoring authority',()=>{
 for(const change of[s=>{s.state=C.validate(s.snapshot());},s=>{s.state.adventure.owned.push('copper_blade');s.state.adventure.equipment.weapon='copper_blade';},s=>{s.room=null;}]){
  const s=enter();A.runtime(s).enemies=R.enemies(s);const e=A.runtime(s).enemies[0],stamp=R.stamp(s,'primary');change(s);
  assert.equal(R.view(s),null);assert.equal(R.contact(s,e,stamp),false);assert.equal(R.fighting(s),false);assert.equal(s.state.adventure.earthTournament.best.blade,null);
 }
});
test('a visible copied actor without the actual roster identity cannot assert contact',()=>{
 const s=enter();A.runtime(s).enemies=R.enemies(s);const real=A.runtime(s).enemies[0];
 assert.equal(R.owned(s,real),true);assert.equal(R.owned(s,{...real}),false);
 assert.equal(R.contact(s,{...real},R.stamp(s,'primary')),false);assert.equal(R.stamp(s,'special'),null);
});
test('explicit withdrawal is retryable and revokes the actor only after adoption',()=>{
 const s=enter(),before=s.snapshot();assert.equal(call(s,'withdraw',{},()=>({ok:false})).ok,false);assert.deepEqual(s.snapshot(),before);assert.equal(R.fighting(s),true);
 assert.equal(call(s,'withdraw').ok,true);assert.equal(R.fighting(s),false);assert.equal(R.enemies(s).length,0);
 assert.equal(call(s,'enter').ok,true);assert.equal(R.view(s).run,2);assert.equal(s.state.adventure.earthTournament.best.blade,null);
});
test('schema13 migration adds exactly the empty record at all XP boundaries',()=>{
 for(const xp of[0,29,30,79,80,149,150,259,260,9999]){
  const old=fresh().snapshot();old.adventure.version=13;old.adventure.xp=xp;removeEmptyGate(old.adventure);delete old.adventure.earthTournament;
  old.notes=[{text:'Synthetic migration boundary — preserve this notebook.',day:1}];const before=clone(old);
  const upgraded=C.validate(old);assert.equal(upgraded.version,9);assert.equal(upgraded.adventure.version,15);assert.deepEqual(upgraded.adventure.earthTournament,R.fresh());
  const normalized=clone(upgraded);normalized.adventure.version=13;removeEmptyGate(normalized.adventure);delete normalized.adventure.earthTournament;
  assert.deepEqual(normalized,before);assert.deepEqual(old,before);assert.equal(upgraded.adventure.xp,xp);
 }
});
test('current missing/invalid and ambiguous pre-schema tournament data refuse saves',()=>{
 const old=fresh().snapshot();old.adventure.version=13;assert.throws(()=>C.validate(old),/pre-schema/);
 const current=fresh().snapshot();delete current.adventure.earthTournament;assert.throws(()=>C.validate(current));
 for(const mutate of[q=>q.version=2,q=>q.best.blade=6,q=>q.issued=2,q=>q.closed=1,q=>q.extra=true]){const raw=fresh().snapshot();mutate(raw.adventure.earthTournament);assert.throws(()=>C.validate(raw));}
 const unstarted=C.fresh();unstarted.adventure.earthTournament.issued=1;assert.throws(()=>C.validate(unstarted),/entry without/);
});
