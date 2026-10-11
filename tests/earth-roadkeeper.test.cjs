'use strict';
// Synthetic already-paid records and initial traveller pose; actual installed
// Core/World/CharacterStore and staged Motion/Art execute, with no validator facade.
// CPU composition is not earned prerequisite, native, camera or pixel evidence.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js')),
 EE=require(path.join(ROOT,'src/earth-expedition.js')),CD=require(path.join(ROOT,'src/earth-consignment-data.js')),
 D=require(path.join(ROOT,'src/earth-wild-signs-data.js')),CH=require(path.join(ROOT,'src/characters.js'));
const E=require(path.join(ROOT,'src/engine.js')),O=require('../src/earth-roadkeeper-motion.js'),Art=require('../src/earth-roadkeeper-art.js');
const copy=o=>JSON.parse(JSON.stringify(o)),bytes=sim=>JSON.stringify(sim.state);
function raw(resolution='signed-loop'){
 const s=C.fresh();s.adventure.started=true;s.player={x:W.GATE.x,z:W.GATE.z,yaw:0};
 s.earthExpedition={version:1,story:{accepted:true,branch:'stormfall-recovery',steps:EE.definition.steps.map(p=>p.id),claimed:true},patrol:{lastClaim:0,active:null}};
 s.localLife.records[CD.ID]={accepted:true,choice:'south-stormfall',steps:CD.required('south-stormfall').slice(),claimed:true};
 s.earthWildSigns={version:1,accepted:true,evidence:D.evidence.map(p=>p.id),observed:true,resolution,cleared:resolution==='cleared-pocket',claimed:true};return C.validate(s);
}
function fixture(resolution='signed-loop'){
 const map=new Map([[CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:raw(resolution)}]})]]);
 let writes=0;const storage={getItem:k=>map.get(k)||null,setItem(k,v){writes++;map.set(k,v);}};
 const store=new CH.Store(storage),loaded=store.load();assert.equal(loaded.status,'loaded');store.writer=true;
 const sim=new C.Simulation(loaded.state),base=()=>({sim,active:store.active,revision:store.revision});
 const p=W.preview(base(),'earthlands');assert.ok(p.ok,p.error);assert.ok(W.enter(p.ticket,base(),{save:v=>store.save(v),build(){}}).ok);
 sim.state.player={x:D.giver.x,z:D.giver.z,yaw:0};sim.state.settings.timeFlow=false;
 // The real Core caller initializes the actual current-room Adventure roster.
 // This healthy-owner setup is not a validator facade or a Motion-side repair.
 sim.tick(0);
 sim.roadkeeperOwnerLease=Object.freeze({});let hidden=false,menuOpen=false;
 return{sim,store,map,storage,writes:()=>writes,context:extra=>({...base(),ownerLease:sim.roadkeeperOwnerLease,hidden,menuOpen,...extra}),
  hidden:v=>{hidden=v;},menu:v=>{menuOpen=v;},tick(dt=.1){sim.tick(dt);const r=O.tick(this.context(),dt);assert.ok(r.ok,r.error);return r.view;}};
}
function start(f){const before=bytes(f.sim),writes=f.writes(),r=O.begin(f.context());assert.ok(r.ok,r.error);assert.equal(bytes(f.sim),before);assert.equal(f.writes(),writes);return r.view;}
function forward(f,seconds=6){let v;for(let n=0;n<Math.ceil(seconds*10);n++)v=f.tick();return v;}
function output(){return{box:[],round:[],octa:[]};}
function outBytes(o){return JSON.stringify(o);}

test('both measured routes retain all real supported points, enemy/service/notice reserves and canonical six-point bypass',()=>{
 for(const choice of D.resolutions){const r=O.measure(choice.id);assert.ok(r.ok);assert.ok(r.pointsSupported);assert.ok(r.segments.every(s=>s.supported));
  assert.ok(Math.min(...r.segments.map(s=>s.enemyClearance))>=0);assert.ok(Math.min(...r.segments.map(s=>s.serviceClearance))>=0);
  assert.ok(Math.min(...r.segments.map(s=>s.noticeClearance))>=0);assert.ok(r.outboundMeters>100&&r.outboundMeters<120);assert.equal(r.roundTripMeters,r.outboundMeters*2);}
 assert.deepEqual(O.ROUTES['signed-loop'].slice(-6),D.bypass);assert.ok(Object.isFrozen(O.ROUTES['signed-loop'][0]));
 assert.deepEqual(O.HOME,{x:-100.6,z:-27.4});assert.deepEqual(W.definition(D.ROOM).points.find(p=>p.id==='elderweald-sela').x,-103);
});
test('the wider x=-129 detour is genuinely unsupported and the old near-Sela home violates the chosen service reserve',()=>{
 assert.equal(W.segment(D.ROOM,{x:-129,z:-44},{x:-129,z:-57},.6),false);
 const old={x:-100.6,z:-24.4};assert.ok(Math.hypot(old.x-D.giver.x,old.z-D.giver.z)<O.LIMITS.serviceReserve+O.LIMITS.radius);
});
for(const choice of ['signed-loop','cleared-pocket'])test(choice+' makes a complete real-tick outbound/inspection/return with exact no-extra-state delta',()=>{
 const f=fixture(choice),control=fixture(choice).sim;
 // Real Core comparison keeps normal clock, routines, hostile ticks and journals.
 // The walker changes only its private WeakMap, not any Core-owned field.
 start(f);let v,seenInspect=false,seenReturn=false,travel=0,previous=O.HOME;const writes=f.writes(),disk=f.map.get(CH.KEY),home=copy(f.sim.returnPos);
 for(let n=0;n<5500;n++){
  control.tick(.1);v=f.tick();travel+=Math.hypot(v.x-previous.x,v.z-previous.z);previous=v;
  assert.ok(W.walkable(D.ROOM,v.x,v.z,O.LIMITS.radius));if(v.phase==='inspect')seenInspect=true;if(v.phase==='return')seenReturn=true;
  assert.equal(bytes(f.sim),bytes(control));if(v.cycle===1)break;
 }
 assert.equal(v.cycle,1);assert.ok(seenInspect&&seenReturn);assert.equal(v.phase,'home');assert.deepEqual({x:v.x,z:v.z},O.HOME);
 assert.ok(Math.abs(travel-O.measure(choice).roundTripMeters)<1e-6);assert.deepEqual(f.sim.returnPos,home);assert.equal(f.writes(),writes);assert.equal(f.map.get(CH.KEY),disk);
});
test('unclaimed, merely chosen, uncleared, missing, malformed and ineligible account histories refuse without state or disk writes',()=>{
 for(const mode of ['unclaimed','chosen','uncleared','missing','malformed','ineligible']){
  const f=fixture(mode==='uncleared'?'cleared-pocket':'signed-loop');
  if(mode==='unclaimed')f.sim.state.earthWildSigns.claimed=false;
  if(mode==='chosen'){f.sim.state.earthWildSigns.claimed=false;f.sim.state.earthWildSigns.observed=false;}
  if(mode==='uncleared')f.sim.state.earthWildSigns.cleared=false;
  if(mode==='missing')delete f.sim.state.earthWildSigns;
  if(mode==='malformed')f.sim.state.earthWildSigns.extra=true;
  if(mode==='ineligible')f.sim.state.localLife.records[CD.ID].claimed=false;
  const b=bytes(f.sim),w=f.writes();assert.equal(O.begin(f.context()).ok,false);assert.equal(bytes(f.sim),b);assert.equal(f.writes(),w);
 }
});
test('plain facade, missing live lease, nonopaque lease and omitted visibility/menu context refuse',()=>{
 const f=fixture();for(const c of [f.context({sim:{...f.sim}}),f.context({ownerLease:Object.freeze({})}),f.context({ownerLease:{}}),f.context({hidden:undefined}),f.context({menuOpen:undefined})])assert.equal(O.begin(c).ok,false);
});
test('begin/current/draw/reset preserve all enumerable Simulation fields, runtime, home, existing NPCs and stores',()=>{
 const f=fixture(),before=JSON.stringify(f.sim),disk=f.map.get(CH.KEY),writes=f.writes(),services=JSON.stringify(W.definition(D.ROOM).points);
 const v=start(f);assert.equal(JSON.stringify(f.sim),before);for(let n=0;n<20;n++){O.current(f.context());Art.draw(output(),v,f.context());}
 O.reset(f.sim);assert.equal(JSON.stringify(f.sim),before);assert.equal(f.map.get(CH.KEY),disk);assert.equal(f.writes(),writes);assert.equal(JSON.stringify(W.definition(D.ROOM).points),services);
});
test('pause, explicit menu and hidden suspend phase time/translation and prevent catch-up on return',()=>{
 for(const reason of ['paused','menu','hidden']){
  const f=fixture();start(f);forward(f);const before=O.current(f.context());
  if(reason==='paused')f.sim.paused=true;else if(reason==='menu')f.menu(true);else f.hidden(true);
  for(let n=0;n<20;n++){const v=f.tick();assert.equal(v.suspended,reason);assert.equal(v.x,before.x);assert.equal(v.z,before.z);assert.equal(v.phaseTime,before.phaseTime);assert.equal(v.gait,before.gait);assert.equal(v.walking,false);}
  f.sim.paused=false;f.menu(false);f.hidden(false);const v=f.tick();assert.ok(Math.hypot(v.x-before.x,v.z-before.z)<=O.LIMITS.speed*.1+1e-8);
 }
});
test('render/current cannot advance; repeated elapsed, oversize/nonfinite steps and clock gaps cannot teleport',()=>{
 const f=fixture();start(f);forward(f);const v=O.current(f.context()),before=bytes(f.sim),out=output();
 for(let n=0;n<10;n++){assert.deepEqual(O.current(f.context()),v);Art.draw(out,O.current(f.context()),f.context());}assert.equal(bytes(f.sim),before);
 for(const dt of [.1,NaN,-.01,.11,Infinity])assert.equal(O.tick(f.context(),dt).ok,false);
 assert.deepEqual(O.current(f.context()),v);f.sim.elapsed+=3;assert.equal(O.tick(f.context(),.1).ok,false);
 const gap=O.current(f.context());assert.equal(gap.x,v.x);assert.equal(gap.z,v.z);const after=f.tick();assert.ok(Math.hypot(after.x-v.x,after.z-v.z)<=.115+1e-8);
});
test('room/trip/home/state/adventure/character/lease/death/account/revision/rollback changes invalidate outgoing views and restart at home',()=>{
 const mutations=[f=>{f.sim.room=null;},f=>{f.sim.worldTrip={...f.sim.worldTrip};},f=>{f.sim.worldTrip.active='other';},f=>{f.sim.returnPos.x++;},
  f=>{f.sim.state=copy(f.sim.state);},f=>{f.sim.state.adventure=copy(f.sim.state.adventure);},f=>{f.store.record.active='other';},
  f=>{f.sim.roadkeeperOwnerLease=Object.freeze({});},f=>{f.sim.state.adventure.deaths++;},f=>{f.sim.state.earthWildSigns.claimed=false;},
  f=>{f.store.record.revision=0;},f=>{f.sim.elapsed=0;}];
 for(const mutate of mutations){const f=fixture();start(f);forward(f);const v=O.current(f.context());mutate(f);assert.equal(O.current(f.context()),null);assert.equal(O.isProjection(v,f.context()),false);}
 const f=fixture();start(f);forward(f);const stale=O.current(f.context());assert.ok(O.reset(f.sim).ok);assert.equal(O.isProjection(stale,f.context()),false);
 assert.deepEqual({x:start(f).x,z:O.current(f.context()).z},O.HOME);
});
test('death and diving refuse; no inherited account or resolution-only lookalike qualifies',()=>{
 for(const mode of ['dead','dive','inherited','lookalike']){const f=fixture();
  if(mode==='dead')f.sim.state.adventure.hp=0;if(mode==='dive')f.sim.worldDive={y:1};
  if(mode==='inherited'){const r=f.sim.state.earthWildSigns;delete f.sim.state.earthWildSigns;Object.setPrototypeOf(f.sim.state,{earthWildSigns:r});}
  if(mode==='lookalike')f.sim.state.earthWildSigns={claimed:true,resolution:'signed-loop'};
  assert.equal(O.begin(f.context()).ok,false);
 }
});
test('live hostile reserve suspends in place, never damages or defeats it, and permits a later safe step',()=>{
 const f=fixture();start(f);forward(f);const v=O.current(f.context()),enemy=f.sim.adventureRuntime.enemies[0];
 assert.ok(enemy);enemy.x=v.x;enemy.z=v.z;const hp=enemy.hp;f.sim.elapsed+=.1;const r=O.tick(f.context(),.1);assert.ok(r.ok);assert.equal(r.view.suspended,'hostile-nearby');
 assert.equal(r.view.x,v.x);assert.equal(r.view.z,v.z);assert.equal(enemy.hp,hp);enemy.x+=20;enemy.z+=20;
 f.sim.elapsed+=.1;assert.equal(O.tick(f.context(),.1).view.suspended,null);
});
test('a new live hostile invalidates a previously drawn walking pose even between clock steps',()=>{
 const f=fixture();start(f);forward(f);const view=O.current(f.context()),enemy=f.sim.adventureRuntime.enemies[0];enemy.x=view.x;enemy.z=view.z;
 assert.equal(O.isProjection(view,f.context()),false);assert.equal(Art.draw(output(),view,f.context()),0);
 const now=O.current(f.context());assert.equal(now.suspended,'hostile-nearby');assert.equal(now.walking,false);assert.ok(Art.draw(output(),now,f.context())>0);
});
test('real next-segment support loss resets rather than walking over it',()=>{
 const f=fixture();start(f);forward(f);const original=W.segment;W.segment=()=>false;
 try{f.sim.elapsed+=.1;assert.equal(O.tick(f.context(),.1).ok,false);assert.equal(O.current(f.context()),null);}finally{W.segment=original;}
});
test('art emits bounded existing primitives inside the measured body/height envelope and appends without replacing arrays',()=>{
 const f=fixture();start(f);forward(f);const view=O.current(f.context()),out=output(),refs={...out},before=bytes(f.sim),parts=Art.shape(view);
 assert.ok(parts.length<=24&&parts.length>=18);const n=Art.draw(out,view,f.context());assert.equal(n,parts.length);
 for(const kind of ['box','round','octa'])assert.equal(out[kind],refs[kind]);
 for(const p of parts){assert.ok(['box','round','octa'].includes(p.kind));assert.equal(p.appearanceOnly,true);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);
  assert.equal(p.roadkeeperActor,O.ID);const verts=E.geometry(p.kind);for(let i=0;i<verts.length;i+=6){const v=E.M.transform(p.m,Array.from(verts.slice(i,i+3)));
   assert.ok(Math.hypot(v[0]-view.x,v[2]-view.z)<O.LIMITS.radius+1e-5);assert.ok(v[1]>=view.base-1e-5&&v[1]<=view.base+O.LIMITS.height+1e-5);
  }}assert.equal(bytes(f.sim),before);assert.equal(globalThis.RealmLocalLife.definitions.length,5);
});
test('forged/stale/hidden projections append nothing and invalid outputs refuse',()=>{
 const f=fixture();start(f);forward(f);const v=O.current(f.context()),out=output();assert.equal(Art.draw(out,{...v},f.context()),0);f.tick();assert.equal(Art.draw(out,v,f.context()),0);
 f.hidden(true);const hidden=O.current(f.context());assert.equal(Art.draw(out,hidden,f.context()),0);assert.equal(outBytes(out),outBytes(output()));
 assert.throws(()=>Art.draw({box:Object.freeze([]),round:[],octa:[]},hidden,f.context()));
});
test('reduced motion suppresses gait embellishment while retaining ordinary route translation; outcome selects only the modest band color',()=>{
 const f=fixture();start(f);forward(f);f.sim.state.settings.reducedMotion=true;let v=f.tick(),p=Art.shape(v);const b=outBytes(p);v={...v,gait:v.gait+1};assert.equal(outBytes(Art.shape(v)),b);
 const before=O.current(f.context());forward(f,1);assert.ok(Math.hypot(O.current(f.context()).x-before.x,O.current(f.context()).z-before.z)>0);
 const g=fixture('cleared-pocket');start(g);const signed=Art.shape(O.current(f.context())).find(p=>p.roadkeeperPart==='chosen-account-band'),cleared=Art.shape(O.current(g.context())).find(p=>p.roadkeeperPart==='chosen-account-band');
 assert.notDeepEqual(signed.c,cleared.c);assert.equal(signed.roadkeeperResolution,'signed-loop');assert.equal(cleared.roadkeeperResolution,'cleared-pocket');
});
test('managed save/reload persists identical canonical world and creates only a fresh home routine, with no payout',()=>{
 const f=fixture();start(f);forward(f);const state=bytes(f.sim),coins=f.sim.state.adventure.coins,xp=f.sim.state.adventure.xp;
 assert.ok(f.store.save(f.sim.snapshot()).ok);assert.equal(bytes(f.sim),state);const loaded=new CH.Store(f.storage).load();assert.equal(loaded.status,'loaded');
 assert.deepEqual(loaded.state.earthWildSigns,f.sim.state.earthWildSigns);assert.equal(loaded.state.adventure.coins,coins);assert.equal(loaded.state.adventure.xp,xp);
 assert.equal(Object.hasOwn(loaded.state,'roadkeeper'),false);assert.equal(Object.hasOwn(loaded.state,'roadkeeperOwnerLease'),false);
});

test('review negative: primitive or nonopaque leases return structured refusal without throwing or touching state',()=>{
 for(const lease of [7,'lease',true,Symbol('lease'),()=>{},null,undefined]){const f=fixture(),before=JSON.stringify(f.sim),disk=f.map.get(CH.KEY),writes=f.writes();
  let result;assert.doesNotThrow(()=>{result=O.begin(f.context({ownerLease:lease}));});assert.equal(result.ok,false);
  assert.equal(JSON.stringify(f.sim),before);assert.equal(f.map.get(CH.KEY),disk);assert.equal(f.writes(),writes);
 }
});
test('review negative: inherited paid-load or expedition prerequisites cannot start a public routine',()=>{
 for(const alter of [f=>{f.sim.state.localLife.records=Object.create(f.sim.state.localLife.records);},
  f=>{const prior=f.sim.state.localLife;delete f.sim.state.localLife;Object.setPrototypeOf(f.sim.state,{localLife:prior});},
  f=>{const prior=f.sim.state.localLife.records;delete f.sim.state.localLife.records;Object.setPrototypeOf(f.sim.state.localLife,{records:prior});},
  f=>{const prior=f.sim.state.earthExpedition;delete f.sim.state.earthExpedition;Object.setPrototypeOf(f.sim.state,{earthExpedition:prior});}]){
  const f=fixture();alter(f);const before=JSON.stringify(f.sim),writes=f.writes();assert.equal(O.begin(f.context()).ok,false);
  assert.equal(JSON.stringify(f.sim),before);assert.equal(f.writes(),writes);
 }
});
test('review negative: presentation, begin, paused/hidden tick and projection checks observe monotonic owner revision',()=>{
 for(const call of ['current','begin','paused','hidden','projection']){const f=fixture();start(f);forward(f);const original=f.context().revision,old=O.current(f.context()),newer=f.context({revision:original+1});
  if(call==='current')assert.ok(O.current(newer));
  if(call==='begin')assert.ok(O.begin(newer).ok);
  if(call==='paused'){f.sim.paused=true;assert.ok(O.tick(newer,0).ok);}
  if(call==='hidden')assert.ok(O.tick({...newer,hidden:true},0).ok);
  if(call==='projection')assert.equal(O.isProjection(old,newer),false);
  assert.equal(O.current(f.context()),null,'older context refused after '+call);assert.equal(O.isProjection(old,f.context()),false);
  assert.equal(O.begin(f.context()).ok,false,'same-lease rollback cannot restart the ended routine');
 }
});
test('review negative: absent, inherited, malformed, different-room or replaced threat owner fails closed without minting it',()=>{
 const modes=['deleted','null','inherited','wrong-room','missing-array','sparse-array','replaced'];
 for(const mode of modes){const f=fixture();start(f);forward(f);const old=O.current(f.context());f.sim.tick(.1);
  if(mode==='deleted')delete f.sim.adventureRuntime;if(mode==='null')f.sim.adventureRuntime=null;
  if(mode==='inherited'){const rt=f.sim.adventureRuntime,proto=Object.create(Object.getPrototypeOf(f.sim));proto.adventureRuntime=rt;delete f.sim.adventureRuntime;Object.setPrototypeOf(f.sim,proto);assert.ok(f.sim instanceof C.Simulation);}
  if(mode==='wrong-room')f.sim.adventureRuntime.room='world-atlantis';if(mode==='missing-array')delete f.sim.adventureRuntime.enemies;
  if(mode==='sparse-array')f.sim.adventureRuntime.enemies=Array(1);if(mode==='replaced')f.sim.adventureRuntime={...f.sim.adventureRuntime};
  const before=JSON.stringify(f.sim),rt=f.sim.adventureRuntime,writes=f.writes();assert.equal(O.isProjection(old,f.context()),false,mode);
  assert.equal(Art.draw(output(),old,f.context()),0);assert.equal(O.current(f.context()),null);assert.equal(O.tick(f.context(),.1).ok,false);
  assert.equal(JSON.stringify(f.sim),before);assert.equal(f.sim.adventureRuntime,rt);assert.equal(f.writes(),writes);
 }
 const f=fixture();delete f.sim.adventureRuntime;const before=JSON.stringify(f.sim);assert.equal(O.begin(f.context()).ok,false);assert.equal(Object.hasOwn(f.sim,'adventureRuntime'),false);assert.equal(JSON.stringify(f.sim),before);
});
test('review negative: unknown current live threat position or malformed HP invalidates stale art and refuses motion without repair',()=>{
 for(const invalid of [e=>{e.x=NaN;},e=>{e.z=Infinity;},e=>{delete e.x;},e=>{e.hp=NaN;},e=>{delete e.hp;}]){
  const f=fixture();start(f);forward(f);const old=O.current(f.context()),enemy=f.sim.adventureRuntime.enemies.find(e=>e.hp>0&&!e.hidden);assert.ok(enemy);invalid(enemy);
  const before=JSON.stringify(f.sim),writes=f.writes();assert.equal(O.isProjection(old,f.context()),false);assert.equal(Art.draw(output(),old,f.context()),0);
  assert.equal(O.current(f.context()),null);f.sim.elapsed+=.1;const afterClock=JSON.stringify(f.sim);assert.equal(O.tick(f.context(),.1).ok,false);assert.equal(JSON.stringify(f.sim),afterClock);
  f.sim.elapsed-=.1;assert.equal(JSON.stringify(f.sim),before);assert.equal(f.writes(),writes);
 }
});
