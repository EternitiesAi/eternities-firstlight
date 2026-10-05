'use strict';
/* Installed-owner CPU regressions. No replacement Core validator, snapshot,
 * Adventure roster/AI, physical world or geometry facade is permitted.
 * Synthetic comparator/prior-campaign completion, poses and zero-HP setup are unit
 * boundaries, not command-earned play. Weapon/arrow and AI tests use actual
 * callers. Nothing here qualifies browser pixels, RAF pacing or human feel. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const requiredFiles=['src/core.js','src/adventure.js','src/cosmos.js','src/world-foundations.js','src/cosmos-campaign.js','src/cosmos-campaign-data.js'];
const missing=requiredFiles.filter(p=>!fs.existsSync(path.join(ROOT,p)));
if(missing.length){
 test('installed Cosmos campaign modules exist; no staged or synthetic fallback',()=>{
  assert.deepEqual(missing,[],'Missing actual installed modules at '+ROOT+': '+missing.join(', '));
 });
}else{
 const load=p=>require(path.join(ROOT,'src',p));
 const C=load('core.js'),A=load('adventure.js'),W=load('world-foundations.js');
 const H=load('cosmos-campaign.js'),DATA=load('cosmos-campaign-data.js');
 const HELL=load('hell-campaign.js'),HV=load('heaven-campaign.js'),AT=load('atlantis-campaign.js');
 const R=load('realm-trails.js'),S=load('sandbox.js'),AR=load('arsenal.js'),T=load('combat.js'),N=load('cosmos.js');
 const D=H.definition,copy=structuredClone,step=id=>D.steps.find(s=>s.id===id);
 const sourceFiles=[...requiredFiles,'src/realm-trails.js','src/realm-trails-cosmos.js','src/sandbox.js','src/combat.js','src/arsenal.js','src/hell-campaign.js','src/heaven-campaign.js','src/atlantis-campaign.js'];
 const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const initialHashes=Object.fromEntries(sourceFiles.map(p=>[p,sha(path.join(ROOT,p))]));
 const FEE={xp:50,coins:20,ore:5,materials:{wood:4,fiber:3,crystal:2}};
 function seed(){
  const raw=C.fresh();raw.adventure.started=true;
  raw.adventure.owned=['trail_blade','trail_bow','travel_coat'];
  raw.adventure.equipment={weapon:'trail_blade',armor:'travel_coat',charm:null};
  raw.adventure.arsenal.gems={ruby:2,moonstone:1,amber:3};
  raw.adventure.arsenal.sockets={trail_bow:'moonstone'};
  // Explicit synthetic historical boundary, validated by each actual old owner.
  // These are never presented as command-earned journeys or historical payouts.
  for(const id of['cosmos-split-bearing-v1',HELL.definition.prerequisite,HV.definition.prerequisite,AT.definition.prerequisite]){
   const prior=R.definition(id),record=raw.realmTrails.records[id];record.accepted=true;record.claimed=true;record.steps=R.required(prior);
   if(prior.escort)record.checkpoint=prior.escort.route.length-1;
   for(const s of prior.steps.filter(s=>s.instrument&&record.steps.includes(s.id)))record.settings[s.id]=s.instrument.target;
  }
  raw.hellCampaign={...HELL.fresh(),accepted:true,steps:HELL.definition.steps.filter(s=>!s.optional).map(s=>s.id),choice:'license',claimed:true};
  raw.heavenCampaign={...HV.fresh(),accepted:true,steps:HV.definition.steps.filter(s=>!s.optional).map(s=>s.id),choice:'broadened-activation',claimed:true};
  raw.atlantisCampaign={...AT.fresh(),accepted:true,steps:AT.required({approach:'lower'}),approach:'lower',choice:'limited',claimed:true};
  raw.notes=[{text:'Synthetic prior notebook remains owned by its original save.',day:1}];
  raw.journal=[{seq:1,day:1,hour:17.2,kind:'synthetic-prior',text:'Prior public comparator record remains separate.'}];raw.nextEvent=2;
  raw.settings.cameraMode='follow';raw.settings.cameraViews={version:1,lastDiorama:'follow',profiles:{adventure:{yaw:.22,elevation:.28,distance:7.5},follow:{yaw:.76,elevation:.88,zoom:1}}};
  return C.validate(raw);
 }
 function fixture(raw=seed()){
  const sim=new C.Simulation(raw);sim.returnPos={...raw.player};sim.room=D.room;
  let stored=null,saves=0;
  const save=s=>{stored=C.validate(s);saves++;return{ok:true};};sim.cosmosCampaignSave=save;
  const ctx={sim,active:'synthetic-installed-cosmos-character'};
  const at=p=>{assert.ok(W.walkable(D.room,p.x,p.z,.31),'unit anchor is on actual installed support: '+JSON.stringify(p));sim.state.player={x:p.x,z:p.z,yaw:0};sim.playerPath=[];};
  const act=(type,p={},io={save})=>H.command(ctx,type,{quest:D.id,expectedActive:ctx.active,expectedRevision:sim.state.adventure.revision,...p},io);
  return{sim,ctx,at,act,save,get stored(){return stored;},get saves(){return saves;}};
 }
 function work(f,id){const s=step(id);f.at(s);const out=f.act(s.kind==='configure'?'configure':'step',{step:id,...(s.kind==='configure'?{setting:s.setting}:{})});assert.ok(out.ok,id+': '+out.error);return out;}
 function accept(f){f.at(D.giver);assert.ok(f.act('accept').ok);work(f,'read-local-cost');}
 function prepare(f,ids=['material','living'],modes={}){for(const id of ids){const support=DATA.supports.find(s=>s.id===id);if(modes[id]==='assisted')work(f,support.assistance);else{work(f,support.inspect);work(f,support.complete);}}}
 function reclaimer(f){work(f,'test-service-route');work(f,'challenge-reclaimer');const e=A.runtime(f.sim).enemies.find(e=>e.id===D.enemies[0].id);assert.ok(e,'actual Adventure roster owns the Reclaimer');return e;}
 function syntheticExhaust(f,e){e.hp=0;assert.ok(H.defeat(f.sim,e),'explicit zero-HP unit boundary');A.syncScene(f.sim);}
 function guardian(f){syntheticExhaust(f,reclaimer(f));work(f,'isolate-service-feed');work(f,'challenge-guardian');const e=A.runtime(f.sim).enemies.find(e=>e.id===D.enemies[1].id);assert.ok(e,'actual Adventure roster owns the Guardian');return e;}
 function guardianFixture(){const f=fixture();accept(f);prepare(f);return{f,e:guardian(f)};}
 function finish(f,ids=['material','living'],modes={},choice='public-record'){
  accept(f);prepare(f,ids,modes);const e=guardian(f);work(f,'release-west-feed');work(f,'release-east-feed');syntheticExhaust(f,e);work(f,'disable-central-link');f.at(step('accountability'));assert.ok(f.act('choose',{choice}).ok);
  for(const id of ids)work(f,DATA.supports.find(s=>s.id===id).configure);
  work(f,'open-confluence');work(f,'verify-open-bearings');return e;
 }
 function balances(s){return{xp:s.adventure.xp,coins:s.adventure.coins,ore:s.adventure.ore,inventory:copy(s.sandbox.inventory)};}
 function retained(s){s=copy(s);delete s.cosmosCampaign;for(const k of['xp','coins','ore','revision'])delete s.adventure[k];for(const k of Object.keys(FEE.materials))delete s.sandbox.inventory[k];delete s.journal;delete s.nextEvent;return s;}
 function tickUntil(f,predicate,seconds=8){let n=0;while(!predicate()&&n<Math.ceil(seconds/.05)){f.sim.tick(.05);n++;}assert.ok(predicate(),'actual Simulation.tick reaches required state within '+seconds+' seconds');return n*.05;}
 function startAI(f,e,p,kind){f.at(p);f.sim.tick(.05);assert.equal(e.mode,'windup','installed live AI begins its own warning');assert.equal(e.strike.kind,kind);assert.ok(Object.isFrozen(e.strike));return e.strike;}
 function waitContact(f,e,prior=e.contactAt){tickUntil(f,()=>Number.isFinite(e.contactAt)&&e.contactAt!==prior,4);return e.contactAt;}

 test('installed contracts and globals are the actual Core/Adventure/World/Cosmos owners',()=>{
  assert.strictEqual(globalThis.RealmCore,C);assert.strictEqual(globalThis.RealmAdventure,A);assert.strictEqual(globalThis.RealmWorldFoundations,W);assert.strictEqual(globalThis.RealmCosmos,N);assert.strictEqual(globalThis.RealmCosmosCampaign,H);
  assert.equal(D.id,'cosmos-open-confluence-v1');assert.equal(D.room,N.ROOM);assert.deepEqual(D.reward,FEE);assert.deepEqual(C.fresh().cosmosCampaign,H.fresh());assert.equal(C.fresh().cosmosCampaign.version,1);
  assert.equal(initialHashes['src/cosmos-campaign-data.js'],'9c7d4d30b863e25812df3651e785bff3f87495b37ede488804ee03178cab93d2');
 });
 test('optional version-one Core migration adds only empty Cosmos state and preserves prior owners',()=>{
  for(const xp of[1,2,3,4,5,9999]){
   const old=seed();delete old.cosmosCampaign;old.adventure.xp=xp;const input=copy(old),out=C.validate(old);
   assert.deepEqual(old,input,'migration does not mutate its input');assert.deepEqual(out.cosmosCampaign,H.fresh());delete out.cosmosCampaign;assert.deepEqual(out,input,'only the optional owner was added');
   const sim=new C.Simulation(old);assert.deepEqual(sim.snapshot().cosmosCampaign,H.fresh());assert.equal(sim.state.adventure.xp,xp);
  }
 });
 test('actual Core rejects malformed/future owner, impossible prerequisites and reordered history',()=>{
  for(const bad of[null,[],{...H.fresh(),version:2},{...H.fresh(),extra:true},{...H.fresh(),accepted:1},{...H.fresh(),steps:['future']},{...H.fresh(),steps:['read-local-cost']},{...H.fresh(),choice:'public-record'},{...H.fresh(),opened:true},{...H.fresh(),claimed:true}]){const raw=seed();raw.cosmosCampaign=bad;assert.throws(()=>C.validate(raw));}
  const unsupported=seed();unsupported.cosmosCampaign.accepted=true;unsupported.realmTrails.records[D.prerequisite]=R.fresh().records[D.prerequisite];assert.throws(()=>C.validate(unsupported));
  const f=fixture();finish(f);const valid=f.sim.snapshot();assert.deepEqual(C.validate(valid),valid);
  for(const id of['material-fit','configure-material']){const bad=copy(valid);bad.cosmosCampaign.steps=bad.cosmosCampaign.steps.filter(s=>s!==id);bad.cosmosCampaign.steps.push(id);assert.throws(()=>C.validate(bad),'no chronological gate backfill: '+id);}
  const alternative=copy(valid);alternative.cosmosCampaign.steps.push('assist-material');assert.throws(()=>C.validate(alternative));const repeated=copy(valid);repeated.cosmosCampaign.steps.push(repeated.cosmosCampaign.steps[0]);assert.throws(()=>C.validate(repeated));
 });
 test('physical acceptance/work are fenced by actual character, revision, room, kit and comparator',()=>{
  const f=fixture();f.at(D.giver);const before=f.sim.snapshot();
  for(const p of[{quest:'foreign'},{expectedActive:'foreign'},{expectedRevision:-1},{expectedRevision:1.5}])assert.equal(f.act('accept',p).ok,false);
  assert.equal(H.command({...f.ctx,sim:{...f.sim}},'accept',{quest:D.id},{save:f.save}).ok,false);
  f.at({x:0,z:16});assert.equal(f.act('accept').ok,false);f.at(D.giver);f.sim.worldDive={y:4.77,hold:true};assert.equal(f.act('accept').ok,false);delete f.sim.worldDive;
  f.sim.state.adventure.started=false;assert.equal(f.act('accept').ok,false);f.sim.state.adventure.started=true;
  f.sim.state.realmTrails.records[D.prerequisite].claimed=false;assert.equal(f.act('accept').ok,false);f.sim.state.realmTrails.records[D.prerequisite].claimed=true;
  assert.deepEqual(f.sim.snapshot(),before);assert.ok(f.act('accept').ok);assert.equal(f.saves,1);assert.equal(f.act('accept').duplicate,true);assert.equal(f.saves,1);
  const stale=f.sim.state.adventure.revision;work(f,'read-local-cost');f.at(step('assist-material'));assert.equal(f.act('configure',{step:'assist-material',setting:step('assist-material').setting,expectedRevision:stale}).ok,false);
 });
 test('save refusal and exceptions never adopt acceptance or trim protected snapshot owners',()=>{
  const f=fixture();f.at(D.giver);const before=f.sim.snapshot();
  for(const io of[{}, {save:()=>({ok:false,error:'explicit synthetic writer refusal'})},{save:()=>{throw Error('explicit synthetic write exception');}}]){assert.equal(f.act('accept',{},io).ok,false);assert.deepEqual(f.sim.snapshot(),before);}
  assert.ok(f.act('accept').ok);assert.deepEqual(retained(f.sim.snapshot()),retained(before));assert.deepEqual(f.stored,C.validate(f.sim.snapshot()));assert.equal(f.sim.state.journal[0].text,before.journal[0].text);
 });
 test('real save candidate refuses character, room, revision or reentrant field mutation before adoption',()=>{
  for(const mutate of[(f)=>{f.sim.state=copy(f.sim.state);},(f)=>{f.ctx.active='replacement-character';},(f)=>{f.sim.room=null;},(f)=>{f.sim.state.adventure.revision++;},(f)=>{f.sim.state.notes.push({text:'Concurrent notebook change survives',day:1});},(_f,s)=>{s.cosmosCampaign.accepted=false;}]){
   const f=fixture();f.at(D.giver);assert.equal(f.act('accept',{}, {save:s=>{C.validate(s);mutate(f,s);return{ok:true};}}).ok,false);assert.equal(f.sim.state.cosmosCampaign.accepted,false);
  }
 });
 test('any two distinct supplied/ordinary supports qualify; exclusive alternatives cannot count twice',()=>{
  const f=fixture();accept(f);work(f,'assist-material');work(f,'material-inspect');f.at(step('material-fit'));const before=f.sim.snapshot();assert.equal(f.act('configure',{step:'material-fit',setting:step('material-fit').setting}).ok,false);assert.deepEqual(f.sim.snapshot(),before);
  f.at(step('test-service-route'));assert.equal(f.act('step',{step:'test-service-route'}).ok,false);work(f,'assist-living');assert.ok(H.available(f.sim.state).some(s=>s.id==='test-service-route'));work(f,'test-service-route');
  assert.deepEqual(DATA.completedSupports(f.sim.state.cosmosCampaign.steps),['material','living']);
 });
 test('wrong settings and manual exhaustion/choice requests cannot create gate or encounter facts',()=>{
  const f=fixture();accept(f);const before=f.sim.snapshot();f.at(step('assist-living'));assert.equal(f.act('configure',{step:'assist-living',setting:'wrong'}).ok,false);
  for(const id of['reclaimer-settled','guardian-settled','accountability']){f.at(step(id));assert.equal(f.act('step',{step:id}).ok,false);}f.at(step('accountability'));assert.equal(f.act('choose',{choice:'public-record'}).ok,false);assert.deepEqual(f.sim.snapshot(),before);
 });
 test('all forty declared lead/mode/choice combinations preserve old owners and pay a separate fee once',()=>{
  let paths=0;
  for(const ids of[['material','living'],['material','observation'],['living','observation'],['material','living','observation']])for(let mask=0;mask<2**ids.length;mask++)for(const choice of D.choices){
   const modes=Object.fromEntries(ids.map((id,i)=>[id,mask&(1<<i)?'assisted':'ordinary'])),f=fixture(),before=f.sim.snapshot();
   finish(f,ids,modes,choice.id);assert.ok(H.ready(f.sim.state));assert.equal(f.sim.state.cosmosCampaign.opened,true);assert.equal(f.sim.state.cosmosCampaign.claimed,false);assert.deepEqual(balances(f.sim.state),balances(before));
   f.at(D.giver);const result=f.act('claim');assert.ok(result.ok,result.error);assert.deepEqual(result.reward,FEE);assert.deepEqual(retained(f.sim.snapshot()),retained(before));assert.deepEqual(f.sim.state.journal.slice(0,before.journal.length),before.journal);
   const paid=f.sim.snapshot(),count=f.saves;assert.equal(f.act('claim').duplicate,true);assert.equal(f.saves,count);assert.deepEqual(f.sim.snapshot(),paid);
   const reloaded=fixture(paid);reloaded.at(D.giver);assert.equal(reloaded.act('claim').duplicate,true);assert.equal(reloaded.saves,0);assert.deepEqual(reloaded.sim.snapshot(),paid);paths++;
  }
  assert.equal(paths,40);
 });
 test('prepared configuration, accountability, opened, verified and claimed remain separate saved gates',()=>{
  const f=fixture();accept(f);prepare(f);const e=guardian(f);work(f,'release-west-feed');work(f,'release-east-feed');syntheticExhaust(f,e);work(f,'disable-central-link');f.at(step('accountability'));assert.ok(f.act('choose',{choice:'bounded-account'}).ok);assert.equal(f.act('choose',{choice:'public-record'}).ok,false);
  f.at(step('configure-observation'));assert.equal(f.act('configure',{step:'configure-observation',setting:step('configure-observation').setting}).ok,false);
  work(f,'configure-material');f.at(step('open-confluence'));assert.equal(f.act('configure',{step:'open-confluence',setting:step('open-confluence').setting}).ok,false);work(f,'configure-living');work(f,'open-confluence');assert.equal(f.sim.state.cosmosCampaign.opened,true);assert.equal(H.ready(f.sim.state),false);assert.equal(f.sim.state.cosmosCampaign.claimed,false);work(f,'verify-open-bearings');assert.ok(H.ready(f.sim.state));
 });
 test('whole-fee capacity and refused claim save are atomic and retry without double payout',()=>{
  for(const key of['coins','ore','wood','fiber','crystal','refused']){
   const f=fixture();finish(f);f.at(D.giver);if(['coins','ore'].includes(key))f.sim.state.adventure[key]=9999;else if(key!=='refused')f.sim.state.sandbox.inventory[key]=S.MAX;
   const before=f.sim.snapshot(),count=f.saves;assert.equal(f.act('claim',{},key==='refused'?{save:()=>({ok:false,error:'synthetic fee refusal'})}:{save:f.save}).ok,false);assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.saves,count);assert.equal(f.sim.state.cosmosCampaign.opened,true);assert.equal(f.sim.state.cosmosCampaign.claimed,false);
   if(['coins','ore'].includes(key))f.sim.state.adventure[key]=0;else if(key!=='refused')f.sim.state.sandbox.inventory[key]=0;
   const unpaid=f.sim.snapshot();assert.ok(f.act('claim').ok);assert.equal(f.saves,count+1);assert.equal(f.sim.state.adventure.coins-unpaid.adventure.coins,FEE.coins);assert.equal(f.sim.state.adventure.ore-unpaid.adventure.ore,FEE.ore);for(const[k,n]of Object.entries(FEE.materials))assert.equal(f.sim.state.sandbox.inventory[k]-unpaid.sandbox.inventory[k],n);assert.equal(f.act('claim').duplicate,true);assert.equal(f.saves,count+1);
  }
 });
 test('claim refusal for a changed character leaves the local apparatus unpaid and retryable',()=>{
  const f=fixture();finish(f);f.at(D.giver);const before=f.sim.snapshot();assert.equal(f.act('claim',{}, {save:s=>{C.validate(s);f.ctx.active='other-character';return{ok:true};}}).ok,false);assert.deepEqual(f.sim.snapshot(),before);f.ctx.active='synthetic-installed-cosmos-character';assert.ok(f.act('claim').ok);assert.equal(f.sim.state.adventure.coins-before.adventure.coins,FEE.coins);
 });
 test('stored XP one through five and cap retain health, sockets, equipment, cameras and prior claims',()=>{
  for(const xp of[1,2,3,4,5,9999]){const raw=seed();raw.adventure.xp=xp;raw.adventure.hp=21;raw.adventure.stamina=17;raw.adventure.tonics=1;const f=fixture(raw),before=f.sim.snapshot();finish(f,['living','observation'],{living:'assisted'},'bounded-account');f.at(D.giver);const result=f.act('claim');assert.ok(result.ok);assert.equal(result.reward.xp,Math.min(50,9999-xp));assert.deepEqual(retained(f.sim.snapshot()),retained(before));assert.equal(f.sim.state.adventure.hp,21);assert.equal(f.sim.state.adventure.stamina,17);assert.equal(f.sim.state.adventure.tonics,1);}
 });
 test('accepted witness reads are pure; exact roster identity, anchor, body and character own damage',()=>{
  const f=fixture(),before=f.sim.snapshot();assert.equal(H.runtime(f.sim).witnesses.length,0);accept(f);const witness=H.runtime(f.sim).witnesses;assert.deepEqual(witness.map(w=>w.id),['cosmos-raven-service-v1']);assert.ok(Object.isFrozen(witness)&&Object.isFrozen(witness[0]));const accepted=f.sim.snapshot();H.available(f.sim.state);H.ready(f.sim.state);H.runtime(f.sim);assert.deepEqual(f.sim.snapshot(),accepted);
  prepare(f);const e=guardian(f);assert.ok(A.combatScene(f.sim));assert.ok(A.runtime(f.sim).enemies.includes(e));assert.ok(H.owned(f.sim,e));assert.equal(e.cosmosCampaign,D.id);assert.equal(e.anchored,true);assert.equal(e.radius,.95);assert.equal(e.maxHP,168);assert.equal(e.damage,12);assert.ok(W.walkable(D.room,e.x,e.z,e.radius));assert.equal(H.canDamage(f.sim,{...e}),false);
  for(const[k,v]of[['x',e.x+.1],['originX',0],['radius',.31],['maxHP',169],['damage',13],['anchored',false],['cosmosCampaign','foreign']]){const old=e[k];e[k]=v;assert.equal(H.canDamage(f.sim,e),false,k);e[k]=old;}
  assert.equal(before.cosmosCampaign.accepted,false);f.sim.state=copy(f.sim.state);assert.equal(H.canDamage(f.sim,e),false,'old actor cannot bind to the replaced save owner');e.hp=0;assert.equal(H.defeat(f.sim,e),false);
 });
 test('actual Adventure lethal damage dispatch saves only campaign exhaustion; refusal restores HP one',()=>{
  const f=fixture();accept(f);prepare(f);const e=reclaimer(f),before=f.sim.snapshot();f.sim.cosmosCampaignSave=()=>({ok:false,error:'synthetic exhausted-owner refusal'});A.damageEnemy(f.sim,e,999,'weapon');assert.equal(e.hp,1);assert.deepEqual(f.sim.snapshot(),before);
  f.sim.cosmosCampaignSave=f.save;A.damageEnemy(f.sim,e,999,'weapon');assert.equal(e.hp,0);assert.ok(f.sim.state.cosmosCampaign.steps.includes('reclaimer-settled'));for(const k of['xp','coins','ore','defeated','drops'])assert.deepEqual(f.sim.state.adventure[k],before.adventure[k]);assert.deepEqual(f.sim.state.sandbox.inventory,before.sandbox.inventory);assert.ok(T.runtime(f.sim).hits.length>0);
  const settled=f.sim.snapshot(),count=f.saves;assert.equal(H.defeat(f.sim,e),false);assert.equal(f.saves,count);assert.deepEqual(f.sim.snapshot(),settled);assert.equal(f.sim.adventureCommand('synthetic-no-cache','loot',{id:e.id}).ok,false);A.syncScene(f.sim);assert.equal(A.runtime(f.sim).enemies.some(x=>x.id===e.id),false);
 });
 test('actual targeted blade and swept bow callers can hit live owners with no generic reward replay',()=>{
  for(const weapon of['trail_blade','trail_bow']){
   const f=fixture();accept(f);prepare(f);const e=reclaimer(f);f.sim.state.adventure.equipment.weapon=weapon;f.at({x:e.x,z:e.z+(weapon==='trail_bow'?3.5:2)});e.hp=1; // Explicit low-HP unit boundary, not claimed earned damage.
   const before=balances(f.sim.state);assert.ok(f.sim.adventureCommand('synthetic-installed-'+weapon,'attack',{target:e.id}).ok);if(weapon==='trail_bow')AR.update(f.sim,.2);
   assert.equal(e.hp,0);assert.ok(f.sim.state.cosmosCampaign.steps.includes('reclaimer-settled'));assert.deepEqual(balances(f.sim.state),before);assert.deepEqual(f.sim.state.adventure.drops,[]);assert.deepEqual(f.sim.state.adventure.defeated,[]);assert.ok(T.runtime(f.sim).hits.length>0);if(weapon==='trail_bow')assert.ok(A.runtime(f.sim).fx.some(x=>x.kind==='arrow-hit'));
  }
 });
 test('actual Cosmos arrow geometry rejects opaque cover, unsupported floor, invalid aim and diving',()=>{
  const {f,e}=guardianFixture();f.sim.state.adventure.equipment.weapon='trail_bow';
  const cover=DATA.geometry.solids.find(s=>s.id==='confluence-west-court-cover');
  assert.ok(AR.projectileGround(f.sim,54,-38),'real .035-radius arrow support on the six-pace firing line');
  assert.equal(AR.projectileGround(f.sim,cover.x,cover.z),false,'actual opaque municipal cover');
  assert.equal(AR.projectileGround(f.sim,42,-49),false,'actual unsupported bay');
  f.at({x:47.5,z:-44});assert.equal(AR.aimClear(f.sim,f.sim.state.player,e),false);
  const before=f.sim.snapshot(),stamina=f.sim.state.adventure.stamina;
  const refused=f.sim.adventureCommand('synthetic-covered-bow','attack',{target:e.id});
  assert.equal(refused.ok,false);assert.match(refused.error,/clear target/);assert.equal(e.hp,168);
  assert.equal(A.runtime(f.sim).arrows.length,0);assert.equal(f.sim.state.adventure.stamina,stamina);assert.deepEqual(f.sim.snapshot(),before);
  const traced=AR.trace(f.sim.state.player,e,[e],(x,z)=>AR.projectileGround(f.sim,x,z));
  assert.ok(traced.wall>0&&traced.wall<1);assert.deepEqual(traced.hits,[],'swept contact stops before the owned actor behind cover');
  assert.equal(AR.aimClear(f.sim,{x:NaN,z:-38},e),false);assert.equal(AR.aimClear(f.sim,{x:54,z:-38},{x:54,z:1000}),false);
  f.sim.worldDive={y:4.77,hold:true};assert.equal(AR.projectileGround(f.sim,54,-38),false);assert.equal(AR.aimClear(f.sim,{x:54,z:-38},e),false);delete f.sim.worldDive;
 });
 test('actual AI initiates immutable ring, makes one scheduled contact and stays anchored through recovery',()=>{
  const {f,e}=guardianFixture(),p={x:e.x,z:e.z+4},frame=startAI(f,e,p,'annulus');const hp=f.sim.state.adventure.hp;
  assert.equal(frame.innerRadius,1.8);assert.equal(frame.outerRadius,4.6);assert.equal(e.timer,1.6);assert.equal(e.recovery,2);
  const time=waitContact(f,e);assert.ok(time>=1.6&&time<1.8);assert.equal(f.sim.state.adventure.hp,hp-(12-A.stats(f.sim.state.adventure).defense));assert.equal(e.contactHit,true);assert.strictEqual(e.strike,frame);const hitHP=f.sim.state.adventure.hp;for(let i=0;i<10;i++)f.sim.tick(.05);assert.equal(f.sim.state.adventure.hp,hitHP);assert.deepEqual({x:e.x,z:e.z},{x:54,z:-44});assert.equal(e.maxHP,168);
 });
 test('actual locked ring permits physical quiet-circle escape without retargeting or contact',()=>{
  const {f,e}=guardianFixture(),frame=startAI(f,e,{x:54,z:-40},'annulus'),hp=f.sim.state.adventure.hp;f.at({x:54,z:-42.6});assert.equal(H.strikeContains(e,f.sim.state.player),false);waitContact(f,e);assert.equal(e.contactHit,false);assert.equal(f.sim.state.adventure.hp,hp);assert.strictEqual(e.strike,frame);assert.equal(frame.yaw,0);
 });
 test('pause preserves the exact actual lock and schedule while damage caller remains inactive',()=>{
  const {f,e}=guardianFixture(),frame=startAI(f,e,{x:54,z:-40},'annulus'),elapsed=f.sim.state.adventure.elapsed,timer=e.timer,hp=f.sim.state.adventure.hp;
  f.sim.paused=true;for(let i=0;i<40;i++)f.sim.tick(.05);assert.strictEqual(e.strike,frame);assert.equal(e.timer,timer);assert.equal(f.sim.state.adventure.elapsed,elapsed);assert.equal(f.sim.state.adventure.hp,hp);assert.ok(H.owned(f.sim,e));assert.equal(H.canDamage(f.sim,e),false);f.sim.paused=false;waitContact(f,e);assert.strictEqual(e.strike,frame);
 });
 test('actual bow-distance AI selects a cross without forced cycle; beyond actual reach stays quiet',()=>{
  const {f,e}=guardianFixture();f.sim.state.adventure.equipment.weapon='trail_bow';f.at({x:54,z:-38});assert.ok(A.visible(f.sim,e,f.sim.state.player));assert.equal(e.cosmosCycle,undefined);assert.equal(e.hp,168);assert.ok(f.sim.adventureCommand('synthetic-range-arrow','attack',{target:e.id}).ok);f.sim.tick(.05);assert.equal(e.mode,'windup');assert.equal(e.strike.kind,'cross');assert.equal(e.timer,1.4);assert.equal(e.recovery,2.2);assert.ok(H.strikeContains(e,f.sim.state.player));tickUntil(f,()=>e.hp<168,1);assert.ok(e.hp>0);assert.deepEqual({x:e.x,z:e.z},{x:54,z:-44});
  const far=guardianFixture();far.f.at({x:54,z:-37.2});for(let i=0;i<40;i++)far.f.sim.tick(.05);assert.equal(far.e.mode,'idle');assert.equal(far.e.strike,undefined,'6.8 exceeds actual6.5 plus .24 contact margin');assert.deepEqual({x:far.e.x,z:far.e.z},{x:54,z:-44});
 });
 test('live cross clips unequal arms at installed opaque cover and misses a clear quadrant or covered traveler',()=>{
  for(const destination of[{x:57,z:-41},{x:47.5,z:-44}]){
   const {f,e}=guardianFixture(),frame=startAI(f,e,{x:54,z:-38},'cross');assert.equal(frame.arms.length,2);assert.ok(Object.isFrozen(frame.arms)&&frame.arms.every(Object.isFrozen));const transverse=frame.arms.find(a=>a.axis===Math.PI/2);assert.ok(transverse.negative>4.3&&transverse.negative<4.4);assert.equal(transverse.positive,6.5);
   if(destination.x===47.5)assert.equal(A.visible(f.sim,e,destination),false,'actual west municipal cover blocks the contact segment');
   f.at(destination);assert.equal(H.strikeContains(e,f.sim.state.player),false);const hp=f.sim.state.adventure.hp;waitContact(f,e);assert.equal(f.sim.state.adventure.hp,hp);assert.equal(e.contactHit,false);assert.strictEqual(e.strike,frame);
   const frameCopy=e.strike;e.strike=Object.freeze({...frameCopy});assert.equal(H.strikeContains(e,{x:54,z:-38}),false,'copied frame cannot replace the owned lock');e.strike=frameCopy;
  }
 });
 test('live physical releases preserve the current frame and alter only subsequent AI locks',()=>{
  const {f,e}=guardianFixture(),ring=startAI(f,e,{x:54,z:-40},'annulus');work(f,'release-east-feed');work(f,'release-west-feed');assert.strictEqual(e.strike,ring);assert.equal(ring.outerRadius,4.6);f.at({x:54,z:-40});waitContact(f,e);
  tickUntil(f,()=>e.strike!==ring&&e.mode==='windup',5);const cross=e.strike;assert.equal(cross.kind,'cross');assert.equal(cross.arms.length,1);assert.equal(e.windup,1.4);assert.equal(e.recovery,2.2);f.at({x:54,z:-41});waitContact(f,e);
  tickUntil(f,()=>e.strike!==cross&&e.mode==='windup',5);assert.equal(e.strike.kind,'annulus');assert.equal(e.strike.innerRadius,1.8);assert.equal(e.strike.outerRadius,3.2);assert.equal(e.windup,1.6);assert.equal(e.recovery,2);assert.equal(e.damage,12);assert.equal(e.maxHP,168);
 });
 test('actual clipped warnings stay finite on real support and cover across representative clear AI aims',()=>{
  let locks=0;
  for(const yaw of[0,.31,.77,1.2,Math.PI]){
   const {f,e}=guardianFixture(),p={x:e.x+Math.sin(yaw)*6,z:e.z+Math.cos(yaw)*6};f.at(p);if(!A.visible(f.sim,e,p)){f.sim.tick(.05);assert.equal(e.strike,undefined);continue;}
   const frame=startAI(f,e,p,'cross');locks++;
   for(const arm of frame.arms){assert.ok(Number.isFinite(arm.negative)&&Number.isFinite(arm.positive));const a=frame.yaw+arm.axis,c=Math.cos(a),s=Math.sin(a);for(const side of[-frame.halfWidth,0,frame.halfWidth])for(let k=0;k<=20;k++){const forward=-arm.negative+(arm.negative+arm.positive)*k/20,q={x:frame.x+c*side+s*forward,z:frame.z-s*side+c*forward};assert.ok(W.walkable(D.room,q.x,q.z,.04),'paint footprint is supported');assert.ok(W.segment(D.room,frame,q,.04),'paint footprint does not traverse actual cover');}}
  }
  assert.ok(locks>=3,'several actual clear headings were exercised');
 });
 test('leave/reload retain saved work but reconstruct only unfinished actual owners and clear transient locks',()=>{
  const {f,e}=guardianFixture();startAI(f,e,{x:54,z:-40},'annulus');f.sim.state.adventure.equipment.weapon='trail_bow';assert.ok(f.sim.adventureCommand('synthetic-leave-arrow','attack',{target:e.id}).ok);
  const live=A.runtime(f.sim),companion=live.companion,companionBefore=copy(companion),cooldowns=copy(live.cooldowns);assert.equal(live.arrows.length,1);const saved=f.sim.snapshot();assert.ok(f.sim.leave().ok);
  assert.strictEqual(A.runtime(f.sim),live,'ordinary return preserves the existing Adventure runtime');assert.strictEqual(live.companion,companion);assert.deepEqual(live.companion,companionBefore);assert.deepEqual(live.cooldowns,cooldowns);assert.deepEqual(live.arrows,[]);assert.deepEqual(live.enemies,[]);
  assert.equal(H.canDamage(f.sim,e),false);assert.equal(H.runtime(f.sim).witnesses.length,0);
  const reload=fixture(saved);reload.at({x:54,z:-40});A.syncScene(reload.sim);const next=A.runtime(reload.sim).enemies.find(x=>x.cosmosCampaign===D.id);assert.ok(next);assert.notStrictEqual(next,e);assert.equal(next.id,D.enemies[1].id);assert.equal(next.hp,168);assert.equal(next.strike,undefined);assert.deepEqual(reload.sim.state.cosmosCampaign,saved.cosmosCampaign);assert.deepEqual(retained(reload.sim.snapshot()),retained(saved));
 });
 test('bounded revision/journal refusal preserves unpaid history and whole-fee balances',()=>{
  for(const limit of['revision','event']){const f=fixture();finish(f);f.at(D.giver);if(limit==='revision')f.sim.state.adventure.revision=1e9;else f.sim.state.nextEvent=Number.MAX_SAFE_INTEGER-1;const before=f.sim.snapshot();assert.equal(f.act('claim').ok,false);assert.deepEqual(f.sim.snapshot(),before);}
  const f=fixture();f.sim.state.journal=Array.from({length:200},(_,i)=>({seq:i+1,day:1,hour:17.2,kind:'synthetic-prior',text:'prior public event '+i}));f.sim.state.nextEvent=201;f.at(D.giver);assert.ok(f.act('accept').ok);assert.equal(f.sim.state.journal.length,200);assert.equal(f.sim.state.journal[0].seq,2);assert.equal(f.sim.state.journal.at(-1).seq,201);
 });
 test('all actual installed test inputs remain byte-frozen during this bounded run',()=>{
  for(const[p,expected]of Object.entries(initialHashes))assert.equal(sha(path.join(ROOT,p)),expected,p);
 });
}
