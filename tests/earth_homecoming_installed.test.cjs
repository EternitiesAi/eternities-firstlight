'use strict';
/* CPU installed-owner regressions, NOT native or command-earned Earth
 * play. All unchanged dependencies execute from FIRSTLIGHT_ROOT. The historical
 * full-world inputs really earned the twelve prerequisites at their disclosed
 * earlier epoch; position, prior history/HP boundaries and storage refusals below
 * are explicitly unit fixtures. No roster, validator, geometry or AI facade. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const overlay=require('./earth_homecoming_actual_owners.cjs'),{ROOT,preimage,C}=overlay,load=overlay.load;
const A=load('adventure.js'),H=load('earth-homecoming.js'),DATA=load('earth-homecoming-data.js'),W=load('world-foundations.js');
const AR=load('arsenal.js'),T=load('combat.js'),S=load('sandbox.js'),CS=load('characters.js'),CC=load('cosmos-campaign.js');
const D=H.definition,copy=structuredClone,step=id=>D.steps.find(s=>s.id===id);
const EARLIER=path.join(__dirname,'fixtures/earth-homecoming-prerequisites');
const historical={blade:{file:path.join(EARLIER,'blade/ALL_TWELVE_PREREQUISITES_EARNED.json'),sha:'3b8e39f119e5eda83211f036b13f982961a96830d24235a1a86065ee32c99a93'},bow:{file:path.join(EARLIER,'bow/ALL_TWELVE_PREREQUISITES_EARNED.json'),sha:'ea92d097b01b1d9610a25e02300b07a629c257a58d1a57e09e67de27648f657f'}};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const inputs=fs.readdirSync(path.join(ROOT,'src')).filter(n=>fs.statSync(path.join(ROOT,'src',n)).isFile()).map(n=>path.join(ROOT,'src',n));
for(const n of['build.py','index.html','FIRSTLIGHT_VALLEY.html'])if(fs.existsSync(path.join(ROOT,n)))inputs.push(path.join(ROOT,n));
const freeze=Object.fromEntries(inputs.map(p=>[p,sha(fs.readFileSync(p))]));
function seed(variant='blade'){
 const source=historical[variant];assert.equal(sha(fs.readFileSync(source.file)),source.sha,'exact earlier continuous-character world bytes');
 return C.validate(JSON.parse(fs.readFileSync(source.file,'utf8')));
}
function fixture(options={}){
 const raw=options.raw||seed(options.bow?'bow':'blade'),sim=new C.Simulation(raw);
 // A quiet/starter-defense variation is explicitly synthetic unit setup, not a
 // claim about the historical character or an earned equipment action.
 if(options.starter){sim.state.adventure.equipment={weapon:options.bow?'trail_bow':'trail_blade',armor:'travel_coat',charm:null};sim.state.adventure.hp=A.stats(sim.state.adventure).maxHP;}
 if(options.quiet!==false)sim.state.adventure.companion.mode='stay';
 if(preimage)sim.state.earthHomecoming=H.fresh(); // negative pre-integration probe only
 const ctx={sim,active:'labelled-unit-character'};let stored=null,saves=0;
 const save=s=>{stored=C.validate(s);saves++;return{ok:true};};sim.earthHomecomingSave=save;
 const place=p=>{sim.room=p.room;sim.returnPos=p.room?{x:11,z:9,yaw:0}:null;sim.state.player={x:p.x,z:p.z,yaw:0};sim.playerPath=[];assert.ok(H.at(sim,p),'actual physical unit anchor '+p.id);};
 const at=(x,z)=>{sim.state.player={x,z,yaw:0};sim.playerPath=[];assert.ok(W.walkable(D.room,x,z,.31),'actual supported combat pose');};
 const act=(type,p={},io={save})=>H.command(ctx,type,{quest:D.id,expectedActive:ctx.active,expectedRevision:sim.state.adventure.revision,...p},io);
 return{sim,ctx,place,at,act,save,get saves(){return saves;},get stored(){return stored;}};
}
function accept(f){f.place(D.giver);assert.ok(f.act('accept').ok);}
function work(f,id){f.place(step(id));const result=f.act('step',{step:id});assert.ok(result.ok,id+': '+result.error);return result;}
function challenge(f,screen=false){
 accept(f);for(const id of['bridge-record','register-record','inspect-claim'])work(f,id);if(screen)work(f,'supplied-screen');
 for(const id of['west-relay-isolated','east-relay-isolated','challenge-regent'])work(f,id);
 A.syncScene(f.sim);
 if(preimage){ // Only the retained negative AI/loot probe supplies a synthetic actor.
  const term=H.enemies(f.sim)[0];A.runtime(f.sim).enemies.push({...term,maxHP:term.hp,mode:'idle',timer:0,path:[],yaw:0,home:{x:term.x,z:term.z}});
 }
 const e=A.runtime(f.sim).enemies.find(e=>e.id===D.enemy.id);assert.ok(e,'actual patched Adventure roster creates Earth actor');assert.ok(H.owned(f.sim,e));return e;
}
function tickUntil(f,condition,seconds=5){let n=0;while(!condition()&&n<Math.ceil(seconds/.05)){f.sim.tick(.05);n++;}assert.ok(condition(),'actual Simulation.tick reaches expected state within '+seconds+'s');return n*.05;}
function start(f,e,p,pattern){f.at(p.x,p.z);f.sim.tick(.05);assert.equal(e.mode,'windup');assert.equal(e.strike.pattern,pattern);assert.ok(Object.isFrozen(e.strike));return e.strike;}
function contact(f,e){const before=e.contactAt;tickUntil(f,()=>Number.isFinite(e.contactAt)&&e.contactAt!==before,3);return e.contactAt;}
function exhaust(f,e){e.hp=0;assert.ok(H.defeat(f.sim,e),'labelled zero-HP unit boundary');A.syncScene(f.sim);}
function finish(f,choice='public-watch'){const e=challenge(f);exhaust(f,e);work(f,'passage-secured');f.place(step('aftermath'));assert.ok(f.act('choose',{choice}).ok);work(f,'return-verified');assert.ok(W.leave(f.sim).ok);work(f,'home-return');return e;}
function balances(s){return{xp:s.adventure.xp,coins:s.adventure.coins,ore:s.adventure.ore,inventory:copy(s.sandbox.inventory)};}
function retained(s){s=copy(s);delete s.earthHomecoming;for(const k of['xp','coins','ore','revision'])delete s.adventure[k];for(const k of Object.keys(D.reward.materials))delete s.sandbox.inventory[k];delete s.journal;delete s.nextEvent;return s;}
function memoryStorage(initial={}){const map=new Map(Object.entries(initial));return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};}

test('optional Core owner is canonical and missing-field migration preserves XP1-5/9999',()=>{
 assert.deepEqual(C.fresh().earthHomecoming,H.fresh());assert.equal(C.VERSION,9);
 for(const xp of[1,2,3,4,5,9999]){const raw=seed();delete raw.earthHomecoming;raw.adventure.xp=xp;raw.adventure.hp=Math.min(raw.adventure.hp,A.stats(raw.adventure).maxHP);const old=copy(raw),out=C.validate(raw);assert.deepEqual(out.earthHomecoming,H.fresh());delete out.earthHomecoming;assert.deepEqual(out,old);assert.deepEqual(raw,old);}
});
test('historical full-world input keeps every old fact and gains only the real optional defaults; no flags transplanted',()=>{
 for(const variant of['blade','bow']){const bytes=fs.readFileSync(historical[variant].file),input=JSON.parse(bytes),expected=copy(input),out=seed(variant);assert.equal(Object.hasOwn(input.localLife.records,'earth-first-load-through-v1'),false);expected.localLife.records['earth-first-load-through-v1']={accepted:false,choice:null,steps:[],claimed:false};assert.deepEqual(H.missing(out),[]);assert.equal(out.earthHomecoming.accepted,false);delete out.earthHomecoming;assert.deepEqual(out,expected);assert.deepEqual(fs.readFileSync(historical[variant].file),bytes);assert.equal(Object.hasOwn(input.localLife.records,'earth-first-load-through-v1'),false);}
});
test('long earned-journey migration oracle requires the exact fresh catalogue addition and every prior field',()=>{
 const P=require('../tools/earth-homecoming-journey/earned_common.cjs');
 for(const variant of['blade','bow']){
  const bytes=fs.readFileSync(historical[variant].file),raw=JSON.parse(bytes),out=C.validate(raw),original=copy(raw);
  assert.equal(P.assertMigrationPreserved(out,raw),'exact-old-four-to-fresh-first-load');
  for(const mutate of[
   w=>{delete w.localLife.records['earth-first-load-through-v1'];},
   w=>{w.localLife.records['earth-first-load-through-v1'].accepted=true;},
   w=>{w.localLife.records['earth-first-load-through-v1'].claimed=true;},
   w=>{w.localLife.records['atlantis-bellglass-lamp-v1'].choice='desk';},
   w=>{w.adventure.xp++;},w=>{w.adventure.coins++;},w=>{w.sandbox.inventory.wood++;}
  ]){const bad=copy(out);mutate(bad);assert.throws(()=>P.assertMigrationPreserved(bad,raw),/EVERY prior field/);}
  assert.deepEqual(raw,original);assert.deepEqual(fs.readFileSync(historical[variant].file),bytes);
 }
});
test('earned migration oracle never refreshes existing fifth-record history',()=>{
 const P=require('../tools/earth-homecoming-journey/earned_common.cjs'),raw=seed();delete raw.earthHomecoming;
 // Labelled catalogue-history oracle boundaries, not command-earned progress.
 for(const record of[
  {accepted:true,choice:'south-stormfall',steps:[],claimed:false},
  {accepted:true,choice:'south-stormfall',steps:['arrive-meadow-stop'],claimed:false},
  {accepted:true,choice:'south-stormfall',steps:['arrive-meadow-stop','arrive-field-return-stop','arrive-field-gate-stop','arrive-settlement-approach','arrive-merren-receiving-bay'],claimed:true}
 ]){
  const input=copy(raw);input.localLife.records['earth-first-load-through-v1']=copy(record);
  const output=copy(input);output.earthHomecoming=H.fresh();assert.equal(P.assertMigrationPreserved(output,input),null);
  output.localLife.records['earth-first-load-through-v1']={accepted:false,choice:null,steps:[],claimed:false};
  assert.throws(()=>P.assertMigrationPreserved(output,input),/EVERY prior field/);
 }
});
test('malformed comma-joined catalogue keys cannot impersonate the four original IDs',()=>{
 const P=require('../tools/earth-homecoming-journey/earned_common.cjs'),raw=seed();delete raw.earthHomecoming;
 // Negative oracle-only specimen; actual Core refuses this malformed catalogue.
 const ids=['heaven-propagation-bed-v1','hell-refuge-water-v1','atlantis-bellglass-lamp-v1','cosmos-drawing-shelf-v1'].sort();
 raw.localLife.records={[ids.join(',')]:{accepted:false,choice:null,steps:[],claimed:false}};
 assert.throws(()=>C.validate(raw));const output=copy(raw);output.earthHomecoming=H.fresh();
 assert.equal(P.assertMigrationPreserved(output,raw),null);
 output.localLife.records['earth-first-load-through-v1']={accepted:false,choice:null,steps:[],claimed:false};
 assert.throws(()=>P.assertMigrationPreserved(output,raw),/EVERY prior field/);
});
test('Core validates every prerequisite before accepted homecoming and rejects absent Open Confluence',()=>{
 const f=fixture();accept(f);assert.doesNotThrow(()=>C.validate(f.sim.snapshot()));
 const bad=copy(f.sim.snapshot());bad.cosmosCampaign.claimed=false;assert.throws(()=>C.validate(bad),/Earth homecoming without/);
 assert.ok(bad.realmTrails.records['cosmos-split-bearing-v1'].claimed);
 for(const field of['hellCampaign','heavenCampaign','atlantisCampaign','cosmosCampaign','earthExpedition','localLife','homeHistory','bridgeCommunity','journeys','realmTrails']){const raw=seed();raw[field]={version:777};assert.throws(()=>C.validate(raw),field+' keeps its actual old validator');}
});
test('strict optional record rejects future fields and reordered consent/work/aftermath history',()=>{
 for(const record of[null,{...H.fresh(),version:2},{...H.fresh(),extra:1},{...H.fresh(),accepted:1},{...H.fresh(),steps:['bridge-record']},{...H.fresh(),choice:'public-watch'},{...H.fresh(),claimed:true}]){const raw=seed();raw.earthHomecoming=record;assert.throws(()=>C.validate(raw));}
 const f=fixture();finish(f);const bad=f.sim.snapshot();bad.earthHomecoming.steps.reverse();assert.throws(()=>C.validate(bad),/ordered/);
});
test('real snapshots/legacy storage/managed Character Store keep accepted and partial new history',()=>{
 const f=fixture();accept(f);work(f,'bridge-record');const snapshot=f.sim.snapshot();assert.deepEqual(snapshot.earthHomecoming,f.sim.state.earthHomecoming);assert.deepEqual(snapshot.player,{x:11,z:9,yaw:0});
 const storage=memoryStorage();assert.ok(f.sim.save(storage).ok);assert.deepEqual(C.load(storage).state.earthHomecoming,snapshot.earthHomecoming);
 const world=seed(),lib={version:1,revision:1,nextId:3,active:'character-1',slots:[{id:'character-1',world},{id:'character-2',world:copy(world)}]},managed=memoryStorage({[CS.KEY]:JSON.stringify(lib)}),store=new CS.Store(managed);
 store.load();store.writer=true;const other=JSON.parse(managed.getItem(CS.KEY)).slots[1];assert.ok(store.save(snapshot).ok);const reread=new CS.Store(managed).load();assert.deepEqual(reread.state.earthHomecoming,snapshot.earthHomecoming);assert.deepEqual(JSON.parse(managed.getItem(CS.KEY)).slots[1],other);
});
test('reading/default data helpers are pure and do not grant consent, reward or new actor',()=>{
 const f=fixture(),before=f.sim.snapshot();for(let i=0;i<3;i++){H.available(f.sim.state);H.evidence(f.sim.state);H.ready(f.sim.state);H.enemies(f.sim);H.signature(f.sim);T.candidates(f.sim);}
 assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.saves,0);assert.deepEqual(H.enemies(f.sim),[]);
});
test('acceptance requires current traveller/revision and physical supported home, not menu realm selection',()=>{
 const f=fixture();f.place(D.giver);const before=f.sim.snapshot();for(const p of[{expectedActive:'other'},{expectedRevision:-1},{quest:'other'}])assert.equal(f.act('accept',p).ok,false);
 f.sim.state.player.x=0;assert.equal(f.act('accept').ok,false);f.place(D.giver);f.sim.room=D.room;assert.equal(f.act('accept').ok,false);f.sim.room=null;assert.deepEqual(f.sim.snapshot(),before);
 assert.ok(f.act('accept').ok);assert.equal(f.act('accept').duplicate,true);
});
test('save-before-adopt refuses throws/Promise/candidate mutation and changed traveller/position ownership',()=>{
 for(const save of[()=>({ok:false,error:'synthetic storage refusal'}),()=>{throw Error('synthetic storage exception');},()=>Promise.resolve({ok:true}),s=>{s.earthHomecoming.accepted=false;return{ok:true};}]){const f=fixture();f.place(D.giver);const before=f.sim.snapshot();assert.equal(f.act('accept',{}, {save}).ok,false);assert.deepEqual(f.sim.snapshot(),before);}
 for(const change of[f=>{f.ctx.active='other';},f=>{f.sim.state.adventure.revision++;},f=>{f.sim.room='mine';},f=>{f.sim.state=copy(f.sim.state);}]){const f=fixture();f.place(D.giver);assert.equal(f.act('accept',{}, {save:s=>{change(f);return{ok:true};}}).ok,false);assert.equal(f.sim.state.earthHomecoming.accepted,false);}
 const f=fixture();f.place(D.giver);assert.ok(f.act('accept',{}, {save:s=>{assert.equal(f.sim.state.earthHomecoming.accepted,false);assert.equal(s.earthHomecoming.accepted,true);return f.save(s);}}).ok);
});
test('actual scene roster/signature creates one canonical anchored model only after deliberate challenge',()=>{
 const f=fixture();accept(f);A.syncScene(f.sim);assert.ok(!A.runtime(f.sim).enemies.some(e=>e.id===D.enemy.id));
 for(const id of['bridge-record','register-record','inspect-claim','west-relay-isolated','east-relay-isolated','challenge-regent'])work(f,id);
 A.syncScene(f.sim);const es=A.runtime(f.sim).enemies.filter(e=>e.id===D.enemy.id);assert.equal(es.length,1);const e=es[0];assert.ok(A.combatScene(f.sim));assert.ok(H.owned(f.sim,e));assert.equal(H.signature(f.sim),e.id);assert.equal(e.x,1);assert.equal(e.z,-35);assert.equal(e.radius,.65);assert.equal(e.maxHP,168);assert.equal(e.damage,12);assert.equal(e.anchored,true);assert.deepEqual([e.xp,e.coins,e.ore],[0,0,0]);
 A.syncScene(f.sim);assert.strictEqual(A.runtime(f.sim).enemies.find(x=>x.id===e.id),e);
});
test('actual AI locks the 10.5m bow lane before generic 8.5 awareness and never chases',()=>{
 const f=fixture({bow:true}),e=challenge(f);assert.equal(AR.weapon(f.sim.state.adventure).reach,11);
 const frame=start(f,e,{x:1,z:-45.5},'false-shelter');assert.equal(frame.length,11);assert.equal(frame.halfWidth,.55);assert.equal(e.windup,1.85);assert.equal(e.recovery,2.6);assert.deepEqual(e.path,[]);assert.deepEqual([e.x,e.z],[1,-35]);assert.equal(T.handle(f.sim,'target-select',{id:e.id}).ok,true);assert.equal(T.threat(f.sim).kind,'homecoming-line');
 const hp=f.sim.state.adventure.hp;contact(f,e);assert.equal(e.contactHit,true);assert.ok(f.sim.state.adventure.hp<hp);assert.equal(e.mode,'recover');assert.equal(T.threat(f.sim).phase,'recover');assert.strictEqual(e.strike,frame);
});
test('clear beyond maximum reach stays idle; no awareness, invisible reach or pursuit',()=>{
 const f=fixture({bow:true}),e=challenge(f);f.at(1,-46.3);assert.ok(A.visible(f.sim,e,f.sim.state.player));for(let i=0;i<12;i++)f.sim.tick(.05);assert.equal(e.mode,'idle');assert.equal(e.strike,undefined);assert.deepEqual(e.path,[]);assert.deepEqual([e.x,e.z],[1,-35]);
});
test('actual long-warning scheduling remains finite and fully supported in all32 clear headings',()=>{
 for(let i=0;i<32;i++){const f=fixture({bow:true}),e=challenge(f),yaw=i*Math.PI/16;
  const frame=start(f,e,{x:e.x+Math.sin(yaw)*10.5,z:e.z+Math.cos(yaw)*10.5},'false-shelter');assert.equal(frame.length,11);assert.equal(W.height(D.room,e.x,e.z),1.57);assert.ok(W.walkable(D.room,e.x,e.z,e.radius));
  for(const side of[-frame.halfWidth-.24,0,frame.halfWidth+.24])for(const forward of[-.24,0,frame.length,frame.length+.24]){
   const p={x:frame.x+Math.cos(frame.yaw)*side+Math.sin(frame.yaw)*forward,z:frame.z-Math.sin(frame.yaw)*side+Math.cos(frame.yaw)*forward};assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));assert.ok(W.walkable(D.room,p.x,p.z,0),'whole locked warning plus body margin on real floor');
  }
 }
});
test('broad warning is locked before mode changes; supplied screen changes only future broad tells',()=>{
 const f=fixture(),e=challenge(f,true),frame=start(f,e,{x:1,z:-32},'claim-lane');assert.equal(e.windup,1.85);assert.equal(frame.length,4);assert.equal(frame.halfWidth,1.1);
 const timer=e.timer,cycle=e.homecomingCycle;f.sim.state.earthHomecoming.steps.splice(f.sim.state.earthHomecoming.steps.indexOf('supplied-screen'),1);assert.equal(H.pattern(e,f.sim).windup,1.45);assert.equal(H.lock(f.sim,e),false);assert.equal(e.timer,timer);assert.equal(e.homecomingCycle,cycle);assert.strictEqual(e.strike,frame);contact(f,e);assert.equal(e.recovery,2.4);
});
test('target movement leaves frame fixed and a real manual step outside the narrow lane misses',()=>{
 const f=fixture({bow:true}),e=challenge(f),frame=start(f,e,{x:1,z:-45.5},'false-shelter'),hp=f.sim.state.adventure.hp;
 for(let i=0;i<12;i++){f.sim.manual(1,0,.1);f.sim.tick(.05);}assert.ok(f.sim.state.player.x>3);assert.strictEqual(e.strike,frame);contact(f,e);assert.equal(e.contactHit,false);assert.equal(f.sim.state.adventure.hp,hp);assert.equal(e.yaw,frame.yaw);
});
test('low-HP ring keeps exact rims and quiet center; the same live schedule accepts inside/outside misses',()=>{
 for(const distance of[1.1,2.5,3.7]){const f=fixture({starter:true}),e=challenge(f);e.hp=50; // explicit phase-threshold unit setup
  const frame=start(f,e,{x:1,z:-35+2.5},'closing-ring');assert.deepEqual([frame.innerRadius,frame.outerRadius],[1.5,3.2]);f.at(1,-35+distance);const hp=f.sim.state.adventure.hp;contact(f,e);
  assert.equal(e.contactHit,distance===2.5);assert.equal(f.sim.state.adventure.hp<hp,distance===2.5);assert.strictEqual(e.strike,frame);
 }
});
test('the fixed long lane is selected when an actual low-HP ring cannot reach the bow user',()=>{
 const f=fixture({bow:true}),e=challenge(f);e.hp=50;start(f,e,{x:1,z:-45.5},'false-shelter');assert.equal(e.strike.phase,'local-stand');
});
test('actual Brace halves the scheduled fixed contact through existing defense/mitigation',()=>{
 const outcomes=[];for(const brace of[false,true]){const f=fixture({starter:true}),e=challenge(f);start(f,e,{x:1,z:-32},'claim-lane');if(brace)assert.ok(T.handle(f.sim,'guard').ok);const hp=f.sim.state.adventure.hp;contact(f,e);outcomes.push(hp-f.sim.state.adventure.hp);}
 assert.deepEqual(outcomes,[11,6]);
});
test('pause preserves owned frame/timers and rejects damage; unpause resumes the same schedule',()=>{
 const f=fixture(),e=challenge(f),frame=start(f,e,{x:1,z:-32},'claim-lane'),timer=e.timer,hp=e.hp,elapsed=f.sim.state.adventure.elapsed;T.handle(f.sim,'target-select',{id:e.id});f.sim.paused=true;
 for(let i=0;i<10;i++)f.sim.tick(.05);A.damageEnemy(f.sim,e,10,'weapon');assert.equal(e.hp,hp);assert.equal(e.timer,timer);assert.equal(f.sim.state.adventure.elapsed,elapsed);assert.ok(H.owned(f.sim,e));assert.equal(H.canDamage(f.sim,e),false);assert.strictEqual(T.selected(f.sim),e);assert.equal(T.threat(f.sim),null);assert.strictEqual(e.strike,frame);f.sim.paused=false;contact(f,e);
});
test('actual blade attack and bow projectile accept live windup/recovery using canonical owner',()=>{
 for(const bow of[false,true]){const f=fixture({bow}),e=challenge(f);start(f,e,bow?{x:1,z:-45.5}:{x:1,z:-33},bow?'false-shelter':'claim-lane');const hp=e.hp,arrows=A.runtime(f.sim).arrows.length;
  assert.ok(f.sim.adventureCommand('unit-live-attack-'+bow,'attack',{target:e.id}).ok);if(bow){assert.equal(A.runtime(f.sim).arrows.length,arrows+1);tickUntil(f,()=>e.hp<hp,1);}else assert.ok(e.hp<hp);
  assert.ok(T.runtime(f.sim).hits.some(h=>h.n>0));assert.ok(!f.sim.state.earthHomecoming.steps.includes('regent-repelled'));
  contact(f,e);assert.equal(e.mode,'recover');const hp2=e.hp;assert.ok(f.sim.adventureCommand('unit-recover-attack-'+bow,'attack',{target:e.id}).ok);if(bow)tickUntil(f,()=>e.hp<hp2,1);else assert.ok(e.hp<hp2);
 }
});
test('actual autoattack uses its existing anticipated command and a real projectile, without direct HP edits',()=>{
 const f=fixture({bow:true}),e=challenge(f);start(f,e,{x:1,z:-45.5},'false-shelter');const hp=e.hp;assert.ok(T.handle(f.sim,'target-select',{id:e.id}).ok);assert.ok(T.handle(f.sim,'auto-toggle').ok);tickUntil(f,()=>e.hp<hp,1.5);assert.ok(f.sim.state.adventure.receipts.some(r=>r.id.startsWith('auto-')));assert.ok(T.runtime(f.sim).hits.length);T.stop(f.sim,true);
});
test('Earth arrows use actual supported/covered geometry with no new projectile dispatch',()=>{
 const f=fixture({bow:true}),e=challenge(f);f.at(1,-45.5);assert.ok(AR.projectileGround(f.sim,1,-40));assert.ok(AR.aimClear(f.sim,f.sim.state.player,e));assert.ok(!AR.projectileGround(f.sim,-18,-46),'actual sluice blocks an arrow point');assert.ok(!AR.aimClear(f.sim,{x:-21,z:-46},{x:-15,z:-46}),'actual world solid blocks this separate segment');assert.ok(!AR.projectileGround(f.sim,100,-35),'unsupported ground is rejected');
 assert.equal(AR.shoot(f.sim,'attack',{target:e.id}).ok,true);const hp=e.hp;tickUntil(f,()=>e.hp<hp,1);
 f.at(1,-46.1);assert.equal(AR.shoot(f.sim,'attack',{target:e.id}).ok,false);assert.equal(e.hp<hp,true);
 // No real solid lies in the Regent's eleven-unit envelope; this does not claim
 // a positive encounter cover clip. The negative separate-world query is real.
});
test('real damage rejects cloned, duplicate, replaced-runtime, departed and changed-state identities',()=>{
 const f=fixture(),e=challenge(f);f.at(1,-33);const r=A.runtime(f.sim),clone={...e},hp=e.hp;
 assert.equal(H.canDamage(f.sim,clone),false);A.damageEnemy(f.sim,clone,10);assert.equal(clone.hp,hp);assert.equal(T.handle(f.sim,'target-select',{id:'nonexistent'}).ok,false);
 r.enemies.push(clone);assert.equal(H.canDamage(f.sim,e),false);A.damageEnemy(f.sim,e,10);assert.equal(e.hp,hp);r.enemies.pop();
 f.sim.adventureRuntime={...r,enemies:[e]};assert.equal(H.canDamage(f.sim,e),false);f.sim.adventureRuntime=r;f.sim.state=copy(f.sim.state);assert.equal(H.canDamage(f.sim,e),false);A.damageEnemy(f.sim,e,10);assert.equal(e.hp,hp);
 const g=fixture(),old=challenge(g);assert.ok(W.leave(g.sim).ok);assert.equal(H.canDamage(g.sim,old),false);assert.equal(T.handle(g.sim,'target-select',{id:old.id}).ok,false);
});
test('exhaustion saves the local repulse before generic rewards and never records generic loot',()=>{
 const f=fixture(),e=challenge(f),before=balances(f.sim.state),defeated=copy(f.sim.state.adventure.defeated),drops=copy(f.sim.state.adventure.drops),count=f.saves;
 A.damageEnemy(f.sim,e,e.hp+100,'weapon');assert.ok(f.sim.state.earthHomecoming.steps.includes('regent-repelled'));assert.equal(f.saves,count+1);assert.deepEqual(balances(f.sim.state),before);assert.deepEqual(f.sim.state.adventure.defeated,defeated);assert.deepEqual(f.sim.state.adventure.drops,drops);assert.equal(H.signature(f.sim),'');A.syncScene(f.sim);assert.ok(!A.runtime(f.sim).enemies.includes(e));A.damageEnemy(f.sim,e,100);assert.equal(f.saves,count+1);
});
test('refused exhaustion restores actual HP1 with no generic replay; a later actual hit saves once',()=>{
 const f=fixture(),e=challenge(f),before=f.sim.snapshot(),count=f.saves;f.sim.earthHomecomingSave=()=>({ok:false,error:'synthetic exhaustion write refusal'});A.damageEnemy(f.sim,e,e.hp+100,'weapon');assert.equal(e.hp,1);assert.ok(!f.sim.state.earthHomecoming.steps.includes('regent-repelled'));assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.saves,count);assert.ok(H.canDamage(f.sim,e));
 f.sim.earthHomecomingSave=f.save;A.damageEnemy(f.sim,e,1,'weapon');assert.ok(f.sim.state.earthHomecoming.steps.includes('regent-repelled'));assert.equal(f.saves,count+1);assert.ok(!f.sim.state.adventure.defeated.includes(e.id));assert.ok(!f.sim.state.adventure.drops.includes(e.id));
});
test('stale/changed owner at exhaustion cannot adopt or pay; the profile adapter remains Root-owned',()=>{
 for(const mutate of[f=>{f.sim.state.adventure.revision++;},f=>{f.sim.state=copy(f.sim.state);},f=>{f.sim.room='mine';}]){const f=fixture(),e=challenge(f);f.sim.earthHomecomingSave=()=>{mutate(f);return{ok:true};};A.damageEnemy(f.sim,e,e.hp+100,'weapon');assert.equal(e.hp,1);assert.ok(!f.sim.state.earthHomecoming.steps.includes('regent-repelled'));assert.ok(!f.sim.state.adventure.defeated.includes(e.id));}
});
test('leaving discards campaign actors/arrows but preserves companion/cooldowns and old Cosmos behavior',()=>{
 for(const room of[D.room,CC.definition.room]){const f=fixture();if(room===D.room)challenge(f);else{f.sim.room=room;f.sim.returnPos={x:11,z:9,yaw:0};A.syncScene(f.sim);}
 const r=A.runtime(f.sim);r.companion.room=room;r.companion.status='Waiting here';r.companion.path=[];const companion=r.companion,cd=r.cooldowns;cd.attack=33;T.runtime(f.sim).cooldowns.guard=44;r.arrows=[{room,x:1,z:-35}];
 assert.ok(f.sim.leave().ok);assert.strictEqual(A.runtime(f.sim),r);assert.strictEqual(r.companion,companion);assert.strictEqual(r.cooldowns,cd);assert.equal(cd.attack,33);assert.equal(T.runtime(f.sim).cooldowns.guard,44);assert.deepEqual(r.enemies,[]);assert.deepEqual(r.arrows,[]);assert.equal(f.sim.state.adventure.companion.mode,'stay');
 }
});
test('re-entry after unfinished battle creates a fresh actual actor without second acceptance fee or reward',()=>{
 const f=fixture(),e=challenge(f),money=balances(f.sim.state);e.hp=20;assert.ok(W.leave(f.sim).ok);f.sim.room=D.room;f.sim.returnPos={x:11,z:9,yaw:0};f.at(1,-33);A.syncScene(f.sim);const fresh=A.runtime(f.sim).enemies.find(x=>x.id===e.id);assert.notStrictEqual(fresh,e);assert.equal(fresh.hp,168);assert.ok(H.canDamage(f.sim,fresh));assert.equal(H.canDamage(f.sim,e),false);assert.deepEqual(balances(f.sim.state),money);assert.equal(f.act('accept').duplicate,true);
});
test('passage safety, explicit lasting aftermath, return verification/home interaction and payout are distinct',()=>{
 const f=fixture(),e=challenge(f);f.place(step('regent-repelled'));assert.equal(f.act('step',{step:'regent-repelled'}).ok,false);exhaust(f,e);f.place(step('aftermath'));assert.equal(f.act('choose',{choice:'public-watch'}).ok,false);work(f,'passage-secured');assert.ok(f.act('choose',{choice:'public-watch'}).ok);assert.equal(f.act('choose',{choice:'reviewed-custody'}).ok,false);work(f,'return-verified');assert.equal(H.ready(f.sim.state),false);assert.ok(W.leave(f.sim).ok);assert.equal(H.ready(f.sim.state),false);f.place(D.claim);assert.equal(f.act('claim').ok,false);work(f,'home-return');assert.ok(H.ready(f.sim.state));
});
test('both chosen homecomings preserve all prior owners, explicit choices, equipment/sockets and same fixed fee',()=>{
 for(const choice of D.choices){const f=fixture({quiet:false});f.place(D.giver);const old=f.sim.snapshot(),before=balances(f.sim.state);finish(f,choice.id);assert.deepEqual(retained(f.sim.snapshot()),retained(old));assert.deepEqual(balances(f.sim.state),before);f.place(D.claim);assert.ok(f.act('claim').ok);assert.equal(f.sim.state.adventure.xp,before.xp+50);assert.equal(f.sim.state.adventure.coins,before.coins+20);assert.equal(f.sim.state.adventure.ore,before.ore+4);for(const[k,n]of Object.entries(D.reward.materials))assert.equal(f.sim.state.sandbox.inventory[k],before.inventory[k]+n);assert.deepEqual(retained(f.sim.snapshot()),retained(old));const paid=f.sim.snapshot(),count=f.saves;assert.equal(f.act('claim').duplicate,true);assert.deepEqual(f.sim.snapshot(),paid);assert.equal(f.saves,count);const reloaded=fixture({raw:paid});reloaded.place(D.claim);assert.equal(reloaded.act('claim').duplicate,true);assert.equal(reloaded.saves,0);}
});
test('whole fee capacity or writer refusal leaves unpaid completion and permits exactly one later retry',()=>{
 for(const key of['coins','ore','wood','fiber','crystal','writer']){const f=fixture();finish(f);f.place(D.claim);if(['coins','ore'].includes(key))f.sim.state.adventure[key]=9999;else if(key!=='writer')f.sim.state.sandbox.inventory[key]=S.MAX;const before=f.sim.snapshot(),count=f.saves;
 assert.equal(f.act('claim',{},key==='writer'?{save:()=>({ok:false,error:'synthetic payout refusal'})}:{save:f.save}).ok,false);assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.saves,count);if(['coins','ore'].includes(key))f.sim.state.adventure[key]=0;else if(key!=='writer')f.sim.state.sandbox.inventory[key]=0;assert.ok(f.act('claim').ok);assert.equal(f.act('claim').duplicate,true);}
});
test('stored XP cap clips XP only, without gear/HP/heal or altering the original paid owners',()=>{
 const f=fixture();finish(f);f.sim.state.adventure.xp=9990;const hp=f.sim.state.adventure.hp,gear=copy(f.sim.state.adventure.equipment),old=copy(f.sim.state.cosmosCampaign);f.place(D.claim);const result=f.act('claim');assert.ok(result.ok);assert.equal(result.reward.xp,9);assert.equal(f.sim.state.adventure.xp,9999);assert.equal(f.sim.state.adventure.hp,hp);assert.deepEqual(f.sim.state.adventure.equipment,gear);assert.deepEqual(f.sim.state.cosmosCampaign,old);
});
test('every Root input and legitimate earlier world remains byte-frozen after source-overlay tests',()=>{
 for(const[p,hash]of Object.entries(freeze))assert.equal(sha(fs.readFileSync(p)),hash,p);for(const h of Object.values(historical))assert.equal(sha(fs.readFileSync(h.file)),h.sha);
 assert.strictEqual(globalThis.RealmCore,C);assert.strictEqual(globalThis.RealmAdventure,A);assert.strictEqual(globalThis.RealmEarthHomecoming,H);assert.ok(!preimage);
});
