'use strict';
/* Installed-module combat/save regressions. Prior paid/observed facts, initial
 * player/companion poses, writer and lease issuers are labelled synthetic CPU
 * fixtures. Real commands/ticks/projectiles, roster damage, supported movement,
 * strict validators and CharacterStore execute actual loaded modules.
 * No native event, pixels, earned prerequisite or human feel claim.
 * Ported from frozen proposal test3bea2cc2; no proposal compilation/imports. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),A=globalThis.RealmAdventure;
const D=require(path.join(ROOT,'src/earth-wild-signs-data.js')),CD=require(path.join(ROOT,'src/earth-consignment-data.js')),E=globalThis.RealmEarthExpedition,W=globalThis.RealmWorldFoundations;
const CH=require(path.join(ROOT,'src/characters.js')),R=require(path.join(ROOT,'src/earth-wild-signs.js')),ER=require(path.join(ROOT,'src/earth-road.js')),T=globalThis.RealmCombat,AR=globalThis.RealmArsenal;
const copy=v=>JSON.parse(JSON.stringify(v));
// Literal frozen old-runtime CPU specimen, captured at clean279d7a5a. Synthetic
// mine placement + damage999; not a native or player-earned journey. Sources:
// Core1ef2eefb1c8cb009efae02c8d944e099c1ac911e04cc0c24828122a941ce5903
// Adventurec8c9f751bfd09d4e123ef786867fd1f1321d8364cf2f83a3e8bda74c12417a5c
const FROZEN_GENERIC_MINE=Object.freeze({foeId:'briar-1',foeHp:0,defeated:['briar-1'],drops:['briar-1'],xp:20,coins:0,ore:0,revision:1});
const compared=()=>({version:1,accepted:true,evidence:['timber-gouge','feeding-track','pest-scrape'],observed:true,resolution:null,cleared:false,claimed:false});
const chosen=(resolution='cleared-pocket',cleared=false,claimed=false)=>({...compared(),resolution,cleared,claimed});
function paid(record=chosen(),weapon='trail_blade',companion=false){
 const s=C.fresh();s.adventure.started=true;s.player={x:W.GATE.x,z:W.GATE.z,yaw:0};
 s.earthExpedition={version:1,story:{accepted:true,branch:'stormfall-recovery',steps:E.definition.steps.map(p=>p.id),claimed:true},patrol:{lastClaim:0,active:null}};
 s.localLife.records[CD.ID]={accepted:true,choice:'south-stormfall',steps:CD.required('south-stormfall').slice(),claimed:true};
 s.earthWildSigns=copy(record);s.adventure.owned=[weapon,'travel_coat'];s.adventure.equipment={weapon,armor:'travel_coat',charm:null};
 s.adventure.companion.bonded=companion;s.adventure.companion.mode=companion?'follow':'stay';if(companion)s.adventure.arsenal.sockets[weapon]='amber';return C.validate(s);
}
function memory(world){const map=new Map([[CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world}]})]]);return{map,writes:0,refuse:false,getItem:k=>map.has(k)?map.get(k):null,setItem(k,v){if(this.refuse)throw Error('Labelled CPU quota refusal');this.writes++;map.set(k,v);}};}
function host(record=chosen(),weapon='trail_blade',companion=false,sourceWorld=null){
 const storage=memory(sourceWorld||paid(record,weapon,companion)),store=new CH.Store(storage),loaded=store.load();assert.equal(loaded.status,'loaded');store.writer=true;
 const sim=new C.Simulation(loaded.state),base=()=>({sim,active:store.active,revision:store.revision});const trip=W.preview(base(),'earthlands');assert.ok(trip.ok,trip.error);assert.ok(W.enter(trip.ticket,base(),{save:v=>store.save(v),build(){}}).ok);
 sim.state.player={x:-164.4,z:-92.8,yaw:0};sim.wildSignsOwnerLease=Object.freeze({});const h={sim,storage,store,calls:0};
 h.ctx=()=>({...base(),definition:D.definition,ownerLease:sim.wildSignsOwnerLease,sceneSignature:A.runtime(sim).trailSignature});
 h.io={save:v=>store.save(v)};sim.recordWildSignsClearance=e=>{h.calls++;return R.recordClearance(h.ctx(),e,h.io);};
 h.pose=p=>{assert.ok(W.walkable(D.ROOM,p.x,p.z,.31),'labelled supported pose');sim.state.player={x:p.x,z:p.z,yaw:0};};
 h.record=record=>{sim.state.earthWildSigns=D.crossValidate(copy(record),sim.state);A.syncScene(sim);};
 h.pest=()=>A.runtime(sim).enemies.find(e=>e.id===D.enemy.id);h.bytes=()=>storage.getItem(CH.KEY);A.syncScene(sim);return h;
}
function ledgers(sim){const s=copy(sim.state);delete s.player;delete s.hour;delete s.day;delete s.weather;delete s.residents;delete s.journal;delete s.nextEvent;delete s.earthWildSigns;for(const k of ['elapsed','hp','stamina','revision','receipts'])delete s.adventure[k];delete s.sandbox.elapsed;return s;}
function noWild(h,label){assert.equal(h.pest(),undefined,label);assert.equal(A.roster(h.sim).some(e=>e.id===D.enemy.id),false);}
function ordinary(h){return A.runtime(h.sim).enemies.find(e=>e.id!==D.enemy.id);}

test('actual saved world retains versions and canonical separate encounter terms',()=>{
 const h=host(),s=h.sim.snapshot();assert.equal(C.VERSION,9);assert.equal(A.VERSION,12);assert.equal(s.version,9);assert.equal(s.adventure.version,12);assert.equal(s.localLife.version,1);
 assert.deepEqual(C.validate(s),s);assert.deepEqual(s.earthWildSigns,chosen());
 assert.equal(Object.hasOwn(s,'wildSignsOwnerLease'),false);assert.equal(Object.hasOwn(s,'grazerOwnerLease'),false);assert.equal(Object.hasOwn(s,'adventureRuntime'),false);
 const entry=h.pest();assert.ok(entry);assert.equal(entry.id,D.enemy.id);assert.equal(entry.hp,72);assert.equal(entry.radius,.48);assert.equal(entry.damage,9);assert.equal(entry.xp,0);assert.equal(entry.coins,0);assert.equal(entry.ore,0);
 assert.ok(h.store.save(s).ok);const cold=new CH.Store(h.storage).load();assert.equal(cold.status,'loaded');assert.deepEqual(cold.state,s);assert.equal(cold.state.earthWildSigns.cleared,false);assert.deepEqual(cold.state.earthExpedition,s.earthExpedition);assert.deepEqual(cold.state.localLife,s.localLife);
});
test('canonical pest spawns once only for deliberate unresolved observed pocket and exact current lease/outing',()=>{
 for(const r of [D.fresh(),{...D.fresh(),accepted:true},compared(),chosen('signed-loop'),chosen('cleared-pocket',true),chosen('cleared-pocket',true,true)])noWild(host(r));
 const h=host(),e=h.pest();assert.ok(e);assert.equal(A.roster(h.sim).filter(e=>e.id===D.enemy.id).length,1);for(const k of ['id','kind','radius','damage','xp','coins','ore'])assert.equal(e[k],D.enemy[k]);assert.equal(e.hp,72);assert.equal(e.maxHP,72);assert.deepEqual(e.home,{x:-166,z:-94});assert.equal(e.originX,-166);assert.equal(e.originZ,-94);assert.strictEqual(e.wildSignsOwnerLease,h.sim.wildSignsOwnerLease);assert.equal(e.wildSignsQuest,D.ID);
 for(const mode of ['lease','trip','home','dead','dive']){const f=host();if(mode==='lease')f.sim.wildSignsOwnerLease={};if(mode==='trip')f.sim.worldTrip.active='';if(mode==='home')f.sim.returnPos={...f.sim.returnPos,x:f.sim.returnPos.x+1};if(mode==='dead')f.sim.state.adventure.hp=0;if(mode==='dive')f.sim.worldDive={};A.syncScene(f.sim);noWild(f,mode);}
});
test('acceptance/choice/clear reconcile only pest: wounded old entry, real arrow, tactics, companion and ordinary ledgers survive',()=>{
 const h=host(D.fresh(),'trail_bow',true),rt=A.runtime(h.sim),old=ordinary(h);assert.ok(old);h.pose({x:old.x,z:old.z+2});assert.ok(A.visible(h.sim,h.sim.state.player,old));A.damageEnemy(h.sim,old,5,'weapon');const wounded=old.hp;assert.ok(T.handle(h.sim,'target-select',{id:old.id}).ok);assert.ok(AR.shoot(h.sim,'attack',{target:old.id}).ok);
 const arrows=rt.arrows,shot=arrows[0],companion=rt.companion,target=rt.tactics.target,facts=ledgers(h.sim),snapshotArrows=copy(arrows);
 const retained=()=>{assert.strictEqual(ordinary(h),old);assert.equal(old.hp,wounded);assert.strictEqual(rt.arrows,arrows);assert.strictEqual(rt.arrows[0],shot);assert.deepEqual(rt.arrows,snapshotArrows);assert.strictEqual(rt.companion,companion);assert.equal(rt.tactics.target,target);assert.deepEqual(ledgers(h.sim),facts);};
 h.pose(D.giver);assert.ok(R.command(h.ctx(),'accept',{quest:D.ID},h.io).ok);retained();
 // Explicit synthetic already-witnessed field history; this is not a native witness.
 h.record(compared());retained();h.pose(D.evidence[2]);assert.ok(R.command(h.ctx(),'choose',{quest:D.ID,resolution:'cleared-pocket'},h.io).ok);retained();assert.ok(h.pest());
 A.damageEnemy(h.sim,h.pest(),999,'weapon');assert.equal(h.sim.state.earthWildSigns.cleared,true);assert.equal(h.pest(),undefined);retained();
});
test('signature appended exactly for Rules without resetting old ordinary fights on harmless clock/camera persistence',()=>{
 const h=host(),rt=A.runtime(h.sim),e=h.pest(),old=ordinary(h),arrows=rt.arrows,companion=rt.companion;assert.ok(rt.trailSignature.endsWith('|'+R.signature(h.sim)));assert.equal(rt.trailSignature,rt.genericTrailSignature+'|'+R.signature(h.sim));old.hp-=3;e.hp-=4;
 for(const mode of ['adventure','follow']){h.sim.state.settings.cameraMode=mode;assert.ok(h.store.save(h.sim.snapshot()).ok);A.syncScene(h.sim);assert.strictEqual(h.pest(),e);assert.strictEqual(ordinary(h),old);assert.strictEqual(rt.arrows,arrows);assert.strictEqual(rt.companion,companion);}h.sim.state.hour+=.01;assert.ok(h.store.save(h.sim.snapshot()).ok);A.syncScene(h.sim);assert.strictEqual(h.pest(),e);
});
test('clones, foreign/stale leases and forged quest entries cannot receive new-pest damage or generic rewards',()=>{
 const h=host(),e=h.pest(),facts=ledgers(h.sim);for(const fake of [{...e},copy(e),{...e,wildSignsOwnerLease:Object.freeze({})},{...e,id:'briar-1',wildSignsQuest:D.ID}]){A.damageEnemy(h.sim,fake,999);assert.equal(fake.hp,72);assert.equal(h.calls,0);assert.deepEqual(ledgers(h.sim),facts);}const lease=h.sim.wildSignsOwnerLease;h.sim.wildSignsOwnerLease=Object.freeze({});A.damageEnemy(h.sim,e,999);assert.equal(e.hp,72);h.sim.wildSignsOwnerLease=lease;
});
test('actual lethal damage invokes real saved clearance before any generic defeat/drop/XP and preserves other accounts',()=>{
 const h=host(),e=h.pest(),before=ledgers(h.sim),xp=h.sim.state.adventure.xp,coins=h.sim.state.adventure.coins,ore=h.sim.state.adventure.ore;A.damageEnemy(h.sim,e,999,'weapon');assert.equal(h.calls,1);assert.equal(e.hp,0);assert.equal(h.sim.state.earthWildSigns.cleared,true);assert.equal(JSON.parse(h.bytes()).slots[0].world.earthWildSigns.cleared,true);assert.deepEqual(ledgers(h.sim),before);assert.equal(h.sim.state.adventure.xp,xp);assert.equal(h.sim.state.adventure.coins,coins);assert.equal(h.sim.state.adventure.ore,ore);assert.ok(!h.sim.state.adventure.defeated.includes(e.id));assert.ok(!h.sim.state.adventure.drops.includes(e.id));assert.ok(!h.sim.state.journeys.realms.earthlands.defeated.includes(e.id));assert.equal(A.retryWildSignsClearance(h.sim).ok,false);assert.equal(h.calls,1);
});
test('quota refusal keeps exact actual dead identity, never auto-retries, and explicit paused far retry adopts once',()=>{
 const h=host(),e=h.pest(),facts=ledgers(h.sim),raw=h.bytes();h.storage.refuse=true;A.damageEnemy(h.sim,e,999);assert.equal(h.calls,1);assert.equal(e.hp,0);assert.strictEqual(h.pest(),e);assert.equal(h.bytes(),raw);assert.equal(h.sim.state.earthWildSigns.cleared,false);assert.deepEqual(ledgers(h.sim),facts);
 h.sim.paused=true;for(let n=0;n<5;n++)h.sim.tick(.1);A.syncScene(h.sim);assert.strictEqual(h.pest(),e);assert.equal(h.calls,1);A.damageEnemy(h.sim,e,999);assert.equal(h.calls,1);
 h.storage.refuse=false;h.pose(D.giver);assert.ok(Math.hypot(h.sim.state.player.x-e.x,h.sim.state.player.z-e.z)>22);assert.ok(h.store.save(h.sim.snapshot()).ok);assert.ok(A.retryWildSignsClearance(h.sim).ok);assert.equal(h.calls,2);assert.equal(h.sim.state.earthWildSigns.cleared,true);assert.equal(h.pest(),undefined);assert.deepEqual(ledgers(h.sim),facts);
});
test('missing/throwing/async/refused/bare-success callback leaves no recorded/generic success and retains physical dead entry',()=>{
 for(const callback of [undefined,()=>{throw Error('CPU callback fault');},async()=>({ok:true}),()=>Promise.resolve({ok:true}),()=>({ok:false,error:'CPU refused'}),()=>({ok:true})]){const h=host(),e=h.pest(),before=h.bytes(),facts=ledgers(h.sim);h.sim.recordWildSignsClearance=callback;A.damageEnemy(h.sim,e,999);assert.strictEqual(h.pest(),e);assert.equal(e.hp,0);assert.equal(h.sim.state.earthWildSigns.cleared,false);assert.equal(h.bytes(),before);assert.deepEqual(ledgers(h.sim),facts);assert.equal(A.runtime(h.sim).wildSignsClearanceResult.ok,false);}
});
test('outgoing saved-owner result remains truthful and is not claimed as adopted current clearance',()=>{
 const h=host(),e=h.pest();h.sim.recordWildSignsClearance=()=>({ok:true,adopted:false,text:'Saved outgoing world.',warning:'Reload that saved world.'});A.damageEnemy(h.sim,e,999);assert.equal(h.sim.state.earthWildSigns.cleared,false);assert.equal(A.runtime(h.sim).wildSignsClearanceResult.adopted,false);assert.match(A.runtime(h.sim).wildSignsClearanceResult.warning,/Reload/);
});
test('lease/state/trip/home/death changes expire pending identity; legitimate reload restarts only unsaved fight',()=>{
 for(const mode of ['lease','state','trip','home','death']){const h=host(),e=h.pest();h.storage.refuse=true;A.damageEnemy(h.sim,e,999);h.storage.refuse=false;if(mode==='lease')h.sim.wildSignsOwnerLease=Object.freeze({});if(mode==='state')h.sim.state=copy(h.sim.state);if(mode==='trip')h.sim.worldTrip={...h.sim.worldTrip};if(mode==='home')h.sim.returnPos={...h.sim.returnPos,x:h.sim.returnPos.x+1};if(mode==='death')h.sim.state.adventure.hp=0;assert.equal(A.retryWildSignsClearance(h.sim).ok,false);A.syncScene(h.sim);assert.notStrictEqual(h.pest(),e);assert.equal(h.sim.state.earthWildSigns.cleared,false);}
 const h=host(),e=h.pest(),facts=ledgers(h.sim);h.storage.refuse=true;A.damageEnemy(h.sim,e,999);h.storage.refuse=false;const coldWorld=new CH.Store(h.storage).load().state,restored=host(coldWorld.earthWildSigns,'trail_blade',false,coldWorld);assert.equal(restored.pest().hp,72);assert.equal(restored.sim.state.earthWildSigns.cleared,false);assert.notStrictEqual(restored.pest(),e);assert.deepEqual(ledgers(restored.sim),facts);const cleared=host(chosen('cleared-pocket',true));noWild(cleared);
});
test('ordinary skitter windup/contact/recovery and radius-aware pursuit run through actual Core tick without new patterns',()=>{
 const h=host(),e=h.pest();h.pose({x:-164.7,z:-94});const modes=new Set(),hp=h.sim.state.adventure.hp;
 for(let n=0;n<55;n++){h.sim.tick(.1);modes.add(e.mode);assert.ok(W.walkable(D.ROOM,e.x,e.z,D.enemy.radius));}assert.ok(modes.has('windup'));assert.ok(modes.has('recover'));assert.ok(h.sim.state.adventure.hp<hp);assert.equal(e.kind,'skitter');assert.equal(e.damage,9);assert.equal(h.sim.state.earthWildSigns.cleared,false);
 const f=host(),p=f.pest();f.pose({x:-162,z:-92});let moved=false;for(let n=0;n<15;n++){const a={x:p.x,z:p.z};f.sim.tick(.1);if(Math.hypot(p.x-a.x,p.z-a.z)>0)moved=true;assert.ok(W.segment(D.ROOM,a,p,.48));}assert.equal(moved,true);
});
test('actual targeting accepts new skitter, excludes dead entry and keeps grazer outside roster',()=>{
 const h=host(),e=h.pest();assert.ok(T.candidates(h.sim).includes(e));assert.ok(T.handle(h.sim,'target-select',{id:e.id}).ok);assert.strictEqual(T.selected(h.sim),e);assert.ok(!A.runtime(h.sim).enemies.some(e=>e.id==='earth-moss-grazer-v1'||e.kind==='grazer'));h.storage.refuse=true;A.damageEnemy(h.sim,e,999);assert.ok(!T.candidates(h.sim).includes(e));assert.equal(T.selected(h.sim),null);
});
test('real blade attack and melee pulse earn clearance with original weapon/account authority',()=>{
 for(const type of ['attack','pulse']){const h=host(),facts=ledgers(h.sim);h.pose({x:-164.6,z:-94});for(let n=0;n<8&&!h.sim.state.earthWildSigns.cleared;n++){const e=h.pest();assert.ok(e);const r=h.sim.adventureCommand('cpu-'+type+n,type,{target:e.id});assert.ok(r.ok,r.error);for(let t=0;t<(type==='pulse'?56:6)&&!h.sim.state.earthWildSigns.cleared;t++)h.sim.tick(.1);}assert.equal(h.sim.state.earthWildSigns.cleared,true);assert.equal(h.calls,1);assert.deepEqual(ledgers(h.sim),facts);}
});
test('real arrows and piercing projectiles earn clearance and are not cleared by the new owner transition',()=>{
 for(const type of ['attack','pulse']){const h=host(chosen(),'trail_bow'),facts=ledgers(h.sim);h.pose({x:-162,z:-94});for(let n=0;n<12&&!h.sim.state.earthWildSigns.cleared;n++){const e=h.pest();assert.ok(e);const shot=h.sim.adventureCommand('cpu-bow-'+type+n,type,{target:e.id});assert.ok(shot.ok,shot.error);assert.ok(A.runtime(h.sim).arrows.length>0);for(let t=0;t<(type==='pulse'?56:10)&&!h.sim.state.earthWildSigns.cleared;t++)h.sim.tick(.1);}assert.equal(h.sim.state.earthWildSigns.cleared,true);assert.equal(h.calls,1);assert.deepEqual(ledgers(h.sim),facts);}
});
test('real companion strikes can finish pest through same owned callback without new loot or targeting grazer',()=>{
 const h=host(chosen(),'trail_blade',true),facts=ledgers(h.sim),r=A.runtime(h.sim);h.pose({x:-164.6,z:-94});Object.assign(r.companion,{x:-164.7,z:-94,path:[],nextPath:0});for(let n=0;n<300&&!h.sim.state.earthWildSigns.cleared&&h.sim.state.adventure.hp>0;n++)h.sim.tick(.1);assert.equal(h.sim.state.earthWildSigns.cleared,true);assert.equal(h.calls,1);assert.deepEqual(ledgers(h.sim),facts);
});
test('old generic mine defeat and existing World foe ownership remain independent and unchanged',()=>{
 const fresh=new C.Simulation(C.fresh());fresh.state.adventure.started=true;fresh.room='mine';A.syncScene(fresh);const foe=A.runtime(fresh).enemies[0];assert.equal(foe.id,FROZEN_GENERIC_MINE.foeId);A.damageEnemy(fresh,foe,999);assert.deepEqual({foeId:foe.id,foeHp:foe.hp,defeated:fresh.state.adventure.defeated,drops:fresh.state.adventure.drops,xp:fresh.state.adventure.xp,coins:fresh.state.adventure.coins,ore:fresh.state.adventure.ore,revision:fresh.state.adventure.revision},FROZEN_GENERIC_MINE);assert.deepEqual(fresh.state.earthWildSigns,D.fresh());
 const h=host(),worldFoe=ordinary(h),xp=h.sim.state.adventure.xp;A.damageEnemy(h.sim,worldFoe,999);assert.ok(h.sim.state.journeys.realms.earthlands.defeated.includes(worldFoe.id));assert.ok(!h.sim.state.adventure.defeated.includes(worldFoe.id));assert.equal(h.sim.state.adventure.xp,xp);assert.equal(h.sim.state.earthWildSigns.cleared,false);
});

test('actual Road of Light and connected Earth callers can clone runtime and preserve original home and owners',()=>{
 for(const travel of ['realm','earth-road']){
  const h=host(),sim=h.sim,pest=h.pest(),home=copy(sim.returnPos),facts=ledgers(sim);assert.doesNotThrow(()=>JSON.stringify(A.runtime(sim)),'runtime must remain JSON-cloneable for both existing travel callers');
  const point=travel==='realm'?W.definition(D.ROOM).points.find(p=>p.kind==='return'):ER.endpoint(D.ROOM);h.pose(point);
  const p=travel==='realm'?W.preview(h.ctx(),'heaven'):ER.preview(h.ctx());assert.ok(p.ok,p.error);
  const result=(travel==='realm'?W:ER).enter(p.ticket,h.ctx(),{save:h.io.save,build(){}});assert.ok(result.ok,result.error);assert.equal(sim.room,travel==='realm'?'world-heaven':'earth-hearthwater-approach');assert.deepEqual(sim.returnPos,home);assert.deepEqual(ledgers(sim),facts);assert.ok(!A.runtime(sim).enemies.includes(pest));assert.equal(A.retryWildSignsClearance(sim).ok,false);
  const returned=(travel==='realm'?W:globalThis.RealmEarth).leave(sim);assert.ok(returned.ok,returned.error);assert.equal(sim.room,null);assert.deepEqual(sim.state.player,home);assert.deepEqual(ledgers(sim),facts);
 }
});

test('prior actual generic drop and World defeat never replay when the separate signs owner advances',()=>{
 const mine=new C.Simulation(paid(D.fresh()));mine.room='mine';A.syncScene(mine);const prior=A.runtime(mine).enemies[0];A.damageEnemy(mine,prior,999);assert.ok(mine.state.adventure.drops.includes(prior.id));
 const h=host(D.fresh(),'trail_blade',false,mine.snapshot()),old=ordinary(h);A.damageEnemy(h.sim,old,999);assert.ok(h.sim.state.journeys.realms.earthlands.defeated.includes(old.id));const facts=ledgers(h.sim);
 h.pose(D.giver);assert.ok(R.command(h.ctx(),'accept',{quest:D.ID},h.io).ok);h.record(compared());h.pose(D.evidence[2]);assert.ok(R.command(h.ctx(),'choose',{quest:D.ID,resolution:'cleared-pocket'},h.io).ok);A.damageEnemy(h.sim,h.pest(),999);assert.equal(h.sim.state.earthWildSigns.cleared,true);
 for(let n=0;n<4;n++)A.syncScene(h.sim);assert.strictEqual(A.runtime(h.sim).enemies.find(e=>e.id===old.id),old);assert.equal(old.hp,0);assert.ok(!T.candidates(h.sim).includes(old));A.damageEnemy(h.sim,old,999);assert.equal(h.sim.state.adventure.drops.filter(id=>id===prior.id).length,1);assert.deepEqual(ledgers(h.sim),facts);assert.ok(!h.sim.state.adventure.defeated.includes(D.enemy.id));
});
