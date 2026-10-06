/* Focused catalogue/schema/bonus checks. Adversarial states are validation
 * fixtures, not evidence of command-earned equipment or combat. */
'use strict';
const assert=require('node:assert/strict'),E=require('../src/earth-expedition.js');
const A=require('../src/adventure.js'),C=require('../src/core.js'),F=require('../src/earth-fieldcraft.js');
const copy=o=>JSON.parse(JSON.stringify(o));let checks=0;
function test(name,body){body();checks++;console.log('PASS '+name);}
function story(branch='managed-coppice'){const r=E.fresh();r.story={accepted:true,branch,steps:E.definition.steps.map(s=>s.id),claimed:true};return r;}
test('deep-frozen finite catalogue and branch allocations',()=>{
 const visit=o=>{if(o&&typeof o==='object'){assert.ok(Object.isFrozen(o));Object.values(o).forEach(visit);}};visit(E.definition);visit(E.patrol);
 assert.equal(E.definition.id,'earth-stormfall-living-road-v1');assert.equal(E.patrol.id,'earth-living-road-patrol-v1');
 assert.deepEqual(E.definition.reward,{xp:45,coins:18,ore:3});assert.deepEqual(E.patrol.reward,{xp:5,coins:4,ore:3,materials:{wood:2,fiber:2}});
 const choices=E.definition.steps.find(s=>s.choices).choices;assert.deepEqual(choices.map(c=>c.materials),[{wood:8,fiber:4},{wood:4,fiber:8}]);
 assert.deepEqual(E.BINDING_COST,{ore:3,coins:8,fiber:6});assert.deepEqual(E.definition.enemies.map(e=>[e.hp,e.damage]),[[64,9],[136,11]]);
});
test('stable finite IDs, physical anchors, and required ordered DAG',()=>{
 for(const d of[E.definition,E.patrol]){
  assert.equal(new Set(d.steps.map(s=>s.id)).size,d.steps.length);const seen=new Set();
  for(const s of d.steps){assert.match(s.id,/^[a-z]+(?:-[a-z]+)*$/);assert.ok(['interact','defeat'].includes(s.kind));assert.ok([s.x,s.z,s.y].every(Number.isFinite));assert.equal(s.y,1.57);assert.equal(s.medium,'dry');for(const id of s.requires)assert.ok(seen.has(id),'earlier prerequisite');seen.add(s.id);for(const c of s.choices||[])assert.ok([c.x,c.z,c.y].every(Number.isFinite));}
  for(const e of d.enemies){const target=d.steps.find(s=>s.id===e.defeatStep);assert.equal(target.kind,'defeat');assert.deepEqual([target.x,target.z],[e.x,e.z]);assert.ok(e.spawnAfter.every(id=>seen.has(id)));}
 }
});
test('only optional missing world ledger migrates to fresh',()=>{
 assert.deepEqual(E.validate(undefined),E.fresh());for(const raw of[null,{},0,{...E.fresh(),version:2},{...E.fresh(),extra:true},{version:1,story:E.fresh().story}])assert.throws(()=>E.validate(raw));
 const r=E.fresh();assert.deepEqual(E.validate(r),r);assert.notStrictEqual(E.validate(r).story,r.story);assert.deepEqual(E.fresh(),r);
});
test('all story subsets enforce real prerequisites, allocation, acceptance and claim',()=>{
 const d=E.definition;
 for(let mask=0;mask<1<<d.steps.length;mask++){
  const steps=d.steps.filter((s,i)=>mask&(1<<i)).map(s=>s.id),r=E.fresh();r.story.accepted=true;r.story.steps=steps;r.story.branch=steps.includes('prepare-allocation')?'stormfall-recovery':null;
  const valid=steps.every(id=>d.steps.find(s=>s.id===id).requires.every(p=>steps.includes(p)));
  if(valid)assert.deepEqual(E.validate(r).story.steps,steps);else assert.throws(()=>E.validate(r));
  r.story.claimed=true;if(valid&&steps.length===d.steps.length)assert.equal(E.validate(r).story.claimed,true);else assert.throws(()=>E.validate(r));
 }
 const r=story();r.story.accepted=false;assert.throws(()=>E.validate(r));r.story.accepted=true;r.story.branch=null;assert.throws(()=>E.validate(r));r.story.branch='allegiance';assert.throws(()=>E.validate(r));r.story.branch='managed-coppice';r.story.steps.push(r.story.steps[0]);assert.throws(()=>E.validate(r));
});
test('patrol accepted identity is exactly lastClaim plus one and follows its own DAG',()=>{
 for(const lastClaim of[0,1,7,E.MAX_RUN-1])for(let mask=0;mask<1<<E.patrol.steps.length;mask++){
  const r=story(),steps=E.patrol.steps.filter((s,i)=>mask&(1<<i)).map(s=>s.id);r.patrol={lastClaim,active:{run:lastClaim+1,steps}};
  const valid=steps.every(id=>E.patrol.steps.find(s=>s.id===id).requires.every(p=>steps.includes(p)));
  if(valid)assert.equal(E.validate(r).patrol.active.run,lastClaim+1);else assert.throws(()=>E.validate(r));
 }
 for(const run of[0,2,-1,1.5,Infinity]){const r=story();r.patrol.active={run,steps:[]};assert.throws(()=>E.validate(r));}
 for(const lastClaim of[-1,1.5,E.MAX_RUN+1,Infinity]){const r=story();r.patrol.lastClaim=lastClaim;assert.throws(()=>E.validate(r));}
 const r=E.fresh();r.patrol.active={run:1,steps:[]};assert.throws(()=>E.validate(r));
 const cap=story();cap.patrol.lastClaim=E.MAX_RUN;assert.deepEqual(E.validate(cap),cap);cap.patrol.active={run:E.MAX_RUN+1,steps:[]};assert.throws(()=>E.validate(cap));
});
test('progress exposes only reachable next actions and both physical choices without mutation',()=>{
 const r=E.fresh(),before=JSON.stringify(r);assert.equal(E.points(r).length,0);assert.equal(E.progress(r).bindingUnlocked,false);assert.equal(JSON.stringify(r),before);
 r.story.accepted=true;assert.deepEqual(E.points(r).map(p=>p.id),['assess-load']);r.story.steps.push('assess-load');
 assert.deepEqual(E.points(r).map(p=>[p.id,p.choice,p.x,p.z]),[['prepare-allocation','stormfall-recovery',-82,-18],['prepare-allocation','managed-coppice',-78,-2]]);
 const paid=story();paid.patrol.active={run:1,steps:['inspect-water']};assert.equal(E.points(paid).length,0);assert.equal(E.progress(paid).patrol.next[0].kind,'defeat');assert.equal(E.progress(paid).story.ready,true);assert.equal(E.progress({state:{}}).story.accepted,false);
});
test('required binding validates canonical owned weapons, exact shape and paired nulls',()=>{
 const a=A.fresh();a.owned=Object.keys(A.GEAR).filter(id=>A.GEAR[id].slot==='weapon');
 assert.deepEqual(E.validateBinding(E.freshBinding(),a,A.GEAR),E.freshBinding());
 for(const weapon of a.owned)for(const kind of['edge','shelter'])assert.deepEqual(E.validateBinding({version:1,weapon,kind},a,A.GEAR),{version:1,weapon,kind});
 for(const raw of[undefined,null,{version:2,weapon:null,kind:null},{version:1,weapon:null,kind:'edge'},{version:1,weapon:'trail_blade',kind:null},{version:1,weapon:'trail_blade',kind:'flight'},{version:1,weapon:'travel_coat',kind:'edge'},{version:1,weapon:'__proto__',kind:'edge'},{...E.freshBinding(),extra:true}])assert.throws(()=>E.validateBinding(raw,a,A.GEAR));
 assert.throws(()=>E.validateBinding({version:1,weapon:'trail_blade',kind:'edge'},{owned:[]},A.GEAR));
});
test('bonus follows selected equipped weapon and never mutates HP, sockets or old fittings',()=>{
 const a=A.fresh();a.earthBinding={version:1,weapon:'trail_blade',kind:'edge'};a.equipment.weapon='trail_blade';const before=JSON.stringify(a);
 assert.deepEqual(E.bonus(a,'trail_blade'),{attack:2,defense:0,maxHP:0});assert.deepEqual(E.bonus(a,'dawn_edge'),{attack:0,defense:0,maxHP:0});assert.equal(JSON.stringify(a),before);
 a.earthBinding.kind='shelter';assert.deepEqual(E.bonus(a,'trail_blade'),{attack:0,defense:1,maxHP:10});a.equipment.weapon='dawn_edge';assert.deepEqual(E.bonus(a,'trail_blade'),{attack:0,defense:0,maxHP:0});
});
test('enemy catalogue is accepted-phase/run-qualified and never a legacy payout',()=>{
 const original=globalThis.RealmWorldFoundations;globalThis.RealmWorldFoundations={definition:room=>room==='world-earthlands'?{id:'earthlands'}:null};
 try{const sim={room:'world-earthlands',state:{earthExpedition:E.fresh()}};assert.equal(E.enemies(sim).length,0);sim.state.earthExpedition.story.accepted=true;sim.state.earthExpedition.story.steps=E.definition.steps.slice(0,3).map(s=>s.id);sim.state.earthExpedition.story.branch='managed-coppice';
  let es=E.enemies(sim);assert.equal(es.length,1);assert.equal(es[0].expeditionQuest,E.definition.id);assert.equal(es[0].expeditionRun,null);assert.deepEqual([es[0].xp,es[0].coins,es[0].ore,es[0].windup,es[0].recovery],[0,0,0,1.35,2.3]);
  sim.state.earthExpedition=story();sim.state.earthExpedition.patrol.active={run:1,steps:['inspect-water']};const first=E.enemies(sim)[0];sim.state.earthExpedition.patrol={lastClaim:1,active:{run:2,steps:['inspect-water']}};const second=E.enemies(sim)[0];assert.notEqual(first.id,second.id);assert.equal(second.expeditionRun,2);assert.equal(second.hp,64);assert.equal(E.signature(sim),second.id);sim.worldDive={};assert.equal(E.enemies(sim).length,0);
 }finally{globalThis.RealmWorldFoundations=original;}
});
test('Core contract either fails closed before integration or saves before live adoption',()=>{
 const sim=new C.Simulation(),candidate=sim.snapshot();candidate.earthExpedition=E.fresh();candidate.adventure.earthBinding=E.freshBinding();const before=sim.snapshot();let calls=0,saved=null;
 const result=E.commit(sim,candidate,{save:value=>{calls++;assert.deepEqual(sim.snapshot(),before,'live state is unchanged while durable saver sees candidate');saved=C.validate(value);return{ok:true};}},'Labelled candidate-boundary validation control.');
 if(A.VERSION<12){assert.equal(result.ok,false);assert.match(result.error,/does not retain/);assert.equal(calls,0);assert.deepEqual(sim.snapshot(),before);}
 else{assert.ok(result.ok,result.error);assert.equal(calls,1);assert.deepEqual(saved.earthExpedition,E.fresh());assert.deepEqual(saved.adventure.earthBinding,E.freshBinding());assert.deepEqual(sim.snapshot(),saved);assert.equal(saved.adventure.revision,before.adventure.revision+1);const unpaid=sim.snapshot();assert.equal(E.commit(sim,sim.snapshot(),{save:()=>({ok:false,error:'labelled refused save'})},'Must remain unchanged.').ok,false);assert.deepEqual(sim.snapshot(),unpaid);}
});
if(A.VERSION>=12){
 const W=require('../src/world-foundations.js'),S=require('../src/sandbox.js');let serial=0;
 // The following fixtures plant valid ready histories/positions or reduced HP
 // only to attack validation/atomicity. They are not earned journey evidence.
 function fixture({ready=false,phase=false,claimed=false}={}){
  const sim=new C.Simulation();assert.ok(sim.moveTo(11,9).ok);while(sim.playerPath.length)sim.tick(.05);assert.ok(sim.adventureCommand('negative-kit-'+(++serial),'start').ok);
  sim.returnPos={...sim.state.player};sim.room='world-earthlands';sim.state.player={x:E.definition.giver.x,z:E.definition.giver.z,yaw:0};
  if(ready||claimed)sim.state.earthExpedition=story();if(ready)sim.state.earthExpedition.story.claimed=false;
  if(phase){const r=sim.state.earthExpedition.story;r.accepted=true;r.branch='managed-coppice';r.steps=E.definition.steps.slice(0,3).map(s=>s.id);}
  let saved=null;sim.earthExpeditionSave=value=>{saved=C.validate(value);return{ok:true};};A.syncScene(sim);
  const ownerLease=Object.freeze({}),active='isolated-negative-fixture';sim.fieldcraftOwnerLease=ownerLease;sim.worldTrip={active,realm:'earthlands',home:copy(sim.returnPos)};
  return{sim,ctx:{sim,active,revision:1,ownerLease},save:sim.earthExpeditionSave,get saved(){return saved;}};
 }
 test('real Core migrates Adventure11 only and rejects missing/current/future/crossfield records',()=>{
  const raw=C.fresh(),legacy=copy(raw);legacy.adventure.version=11;delete legacy.adventure.earthBinding;delete legacy.earthExpedition;const migrated=C.validate(legacy);
  assert.equal(migrated.adventure.version,12);assert.deepEqual(migrated.adventure.earthBinding,E.freshBinding());assert.deepEqual(migrated.earthExpedition,E.fresh());for(const key of Object.keys(legacy.adventure).filter(k=>k!=='version'))assert.deepEqual(migrated.adventure[key],legacy.adventure[key],key+' migration retained');
  const absent=copy(raw);delete absent.adventure.earthBinding;assert.throws(()=>C.validate(absent));const future=copy(raw);future.adventure.version=13;assert.throws(()=>C.validate(future));const futureLedger=copy(raw);futureLedger.earthExpedition.version=2;assert.throws(()=>C.validate(futureLedger));
  const f=fixture(),binding=f.sim.snapshot();binding.adventure.earthBinding={version:1,weapon:'trail_blade',kind:'edge'};assert.throws(()=>C.validate(binding));const noKit=copy(raw);noKit.earthExpedition.story.accepted=true;assert.throws(()=>C.validate(noKit));
 });
 test('real integrated anchor support and objective-to-giver production paths',()=>{
  const f=fixture();for(const d of[E.definition,E.patrol])for(const p of[d.giver,...d.steps,...d.steps.flatMap(s=>s.choices||[])]){
   assert.ok(W.walkable(f.sim.room,p.x,p.z),'supported clear '+p.id);assert.equal(W.height(f.sim.room,p.x,p.z),1.57);
   const route=C.pathfind(p,d.giver,f.sim.navRoom);assert.ok(route?.length,'production route to giver '+p.id);let prior=p;for(const q of route){assert.ok(W.segment(f.sim.room,prior,q),'validated route segment '+p.id);prior=q;}
  }
 });
 test('accepted physical actions enforce kit, realm, proximity, branch and DAG',()=>{
  const f=fixture(),call=(type,p={})=>E.command(f.ctx,type,{quest:E.definition.id,...p},{save:f.save});const initial=copy(f.sim.state);
  assert.equal(call('step',{step:'assess-load'}).ok,false);assert.deepEqual(f.sim.state,initial);assert.ok(call('accept').ok);const accepted=copy(f.sim.state);
  assert.equal(call('step',{step:'clear-crossing'}).ok,false);assert.equal(call('step',{step:'read-water'}).ok,false);assert.equal(call('step',{step:'assess-load'}).ok,false);assert.deepEqual(f.sim.state,accepted);
  f.sim.state.player={x:-76,z:-12,yaw:0};assert.ok(call('step',{step:'assess-load'}).ok);f.sim.state.player={x:-78,z:-2,yaw:0};assert.equal(call('step',{step:'prepare-allocation',branch:'allegiance'}).ok,false);assert.ok(call('step',{step:'prepare-allocation',branch:'managed-coppice'}).ok);
  const prepared=copy(f.sim.state);f.sim.state.player={x:-82,z:-18,yaw:0};assert.equal(call('step',{step:'prepare-allocation',branch:'stormfall-recovery'}).duplicate,true);assert.equal(f.sim.state.earthExpedition.story.branch,'managed-coppice');assert.deepEqual({...f.sim.state,player:prepared.player},prepared);
 });
 test('complete payment capacity rejects every overflowing currency/material before saver',()=>{
  for(const[key,value]of[['coins',9982],['ore',9997],['wood',996],['fiber',992]]){
   const f=fixture({ready:true}),target=['coins','ore'].includes(key)?f.sim.state.adventure:f.sim.state.sandbox.inventory;target[key]=value;const before=copy(f.sim.state);let calls=0;
   const result=E.command(f.ctx,'claim',{quest:E.definition.id},{save:()=>{calls++;return{ok:true};}});assert.equal(result.ok,false,key+' overflow');assert.equal(calls,0);assert.deepEqual(f.sim.state,before);
  }
 });
 test('successful physical work confirms the completed action and keeps payment unclaimed',()=>{
  const f=fixture({ready:true});f.sim.state.earthExpedition.story.steps=E.definition.steps.slice(0,6).map(s=>s.id);
  const before=copy(f.sim.state.adventure),work=(id,save=f.save,fittingTicket)=>{const p=E.definition.steps.find(s=>s.id===id);f.sim.state.player={x:p.x,z:p.z,yaw:0};return E.command(f.ctx,'step',{quest:E.definition.id,step:id,fittingTicket},{save});};
  assert.equal(work('brace-root-channel').ok,false,'bare proximity-only work cannot bypass fitting');const prep=f.sim.snapshot(),begun=F.begin(f.ctx);assert.ok(begun.ok,begun.error);let ticket;
  for(let i=0;i<4;i++){assert.ok(F.inspect(f.ctx,begun.plan).ok);assert.ok(F.adjust(f.ctx,begun.plan,{yaw:F.GEOMETRY.targetYaw,pitch:F.GEOMETRY.targetPitch}).ok);const seated=F.seat(f.ctx,begun.plan);assert.ok(seated.ok,seated.error);ticket=seated.ticket;}
  assert.deepEqual(f.sim.snapshot(),prep,'synthetic boundary fitting itself changes no durable owner');
  const refused=work('brace-root-channel',()=>({ok:false,error:'labelled refused repair'}),ticket);assert.equal(refused.ok,false);assert.match(refused.error,/labelled refused repair/);assert.equal(f.sim.state.earthExpedition.story.steps.length,6);assert.ok(F.validate(f.ctx,ticket).ok);
  const braced=work('brace-root-channel',f.save,ticket);assert.ok(braced.ok,braced.error);assert.match(braced.text,/brace fitted/);assert.match(braced.text,/Deliver your allocation/);assert.doesNotMatch(braced.text,/^Fit /);assert.equal(f.sim.state.earthExpedition.story.steps.length,7);assert.equal(F.validate(f.ctx,ticket).ok,false);
  const duplicate=work('brace-root-channel');assert.equal(duplicate.duplicate,true);assert.match(duplicate.text,/already recorded/);
  const delivered=work('deliver-allocation');assert.ok(delivered.ok,delivered.error);assert.match(delivered.text,/Allocation delivered/);assert.match(delivered.text,/unclaimed/);assert.equal(f.sim.state.earthExpedition.story.claimed,false);assert.equal(f.sim.state.earthExpedition.story.steps.length,8);
  for(const key of['xp','coins','ore','owned','equipment','arsenal'])assert.deepEqual(f.sim.state.adventure[key],before[key],key+' untouched by the completion caption');
 });
 test('ready payment survives refused and throwing durable savers, then cap-bound XP pays zero once',()=>{
  const f=fixture({ready:true});f.sim.state.adventure.xp=9999;const before=copy(f.sim.state);
  for(const save of[()=>({ok:false,error:'deliberate storage refusal'}),()=>{throw Error('deliberate storage exception');}]){const result=E.command(f.ctx,'claim',{quest:E.definition.id},{save});assert.equal(result.ok,false);assert.deepEqual(f.sim.state,before);}
  const paid=E.command(f.ctx,'claim',{quest:E.definition.id},{save:f.save});assert.ok(paid.ok,paid.error);assert.equal(paid.reward.xp,0);assert.equal(f.sim.state.adventure.xp,9999);assert.equal(f.sim.state.earthExpedition.story.claimed,true);assert.deepEqual(new C.Simulation(f.saved).state.earthExpedition,f.sim.state.earthExpedition);
  const once=copy(f.sim.state);assert.equal(E.command(f.ctx,'claim',{quest:E.definition.id},{save:f.save}).duplicate,true);assert.deepEqual(f.sim.state,once);
 });
 test('defeat requires actual accepted actor identity and zero HP; refused death recovers one HP',()=>{
  const f=fixture({phase:true}),e=A.runtime(f.sim).enemies.find(e=>e.expeditionQuest===E.definition.id),before=copy(f.sim.state);assert.ok(e);assert.equal(e.hp,64);
  assert.equal(E.defeat(f.sim,{...e,hp:0}),false);assert.equal(E.defeat(f.sim,e),false);assert.deepEqual(f.sim.state,before);
  e.hp=0;f.sim.earthExpeditionSave=()=>({ok:false,error:'deliberate death-checkpoint refusal'});assert.equal(E.defeat(f.sim,e),false);assert.equal(e.hp,1);assert.deepEqual(f.sim.state,before);assert.ok(A.runtime(f.sim).notices.some(s=>s.includes('refusal')));
  e.hp=0;f.sim.earthExpeditionSave=f.save;assert.equal(E.defeat(f.sim,e),true);assert.ok(f.sim.state.earthExpedition.story.steps.includes('clear-crossing'));assert.deepEqual(f.sim.state.adventure.defeated,before.adventure.defeated);assert.deepEqual(f.sim.state.adventure.drops,before.adventure.drops);assert.equal(f.sim.state.adventure.xp,before.adventure.xp);
 });
 test('same-room accepted roster changes preserve actual live HP, projectiles and combat state',()=>{
  const f=fixture(),r=A.runtime(f.sim),e=r.enemies.find(e=>e.worldRealm==='earthlands');assert.ok(e,'actual existing optional Earth actor');e.hp=37;const arrows=r.arrows,fx=r.fx,companion=r.companion,invincible=r.invincible;const tactic=Tactics();
  function Tactics(){return require('../src/combat.js').runtime(f.sim);}
  assert.ok(E.command(f.ctx,'accept',{quest:E.definition.id},{save:f.save}).ok);
  for(const id of['assess-load','prepare-allocation','read-water']){const s=E.definition.steps.find(s=>s.id===id),p=s.choices?.find(c=>c.id==='managed-coppice')||s;f.sim.state.player={x:p.x,z:p.z,yaw:0};const result=E.command(f.ctx,'step',{quest:E.definition.id,step:id,...(s.choices?{branch:p.id}:{})},{save:f.save});assert.ok(result.ok,result.error);}
  assert.ok(A.runtime(f.sim).enemies.some(v=>v.expeditionQuest===E.definition.id),'accepted first foe changes actual roster');assert.strictEqual(A.runtime(f.sim).enemies.find(v=>v.id===e.id),e);assert.equal(e.hp,37);assert.strictEqual(r.arrows,arrows);assert.strictEqual(r.fx,fx);assert.strictEqual(r.companion,companion);assert.equal(r.invincible,invincible);assert.strictEqual(Tactics(),tactic);
 });
 test('patrol stale accept/step/claim cannot start or pay a different run',()=>{
  const f=fixture({claimed:true}),call=(type,run,priorClaim,extra={})=>E.command(f.ctx,type,{quest:E.patrol.id,run,priorClaim,...extra},{save:f.save});
  assert.equal(call('patrol-accept',2,1).ok,false);assert.ok(call('patrol-accept',1,0).ok);const accepted=copy(f.sim.state);assert.equal(call('patrol-step',2,1,{step:'inspect-water'}).ok,false);assert.equal(call('patrol-claim',1,0).ok,false);assert.deepEqual(f.sim.state,accepted);
  f.sim.state.earthExpedition.patrol={lastClaim:1,active:{run:2,steps:[]}};const next=copy(f.sim.state);assert.equal(call('patrol-accept',1,0).ok,false);assert.equal(call('patrol-claim',1,0).duplicate,true);assert.deepEqual(f.sim.state,next);
 });
 test('binding costs/once-only/owned station/health and equipment state are atomic',()=>{
  const f=fixture({claimed:true});f.sim.room=null;f.sim.state.player={...f.sim.returnPos};f.sim.state.adventure.ore=3;f.sim.state.adventure.coins=8;f.sim.state.sandbox.inventory.fiber=6;f.sim.state.adventure.hp=75;
  const before=copy(f.sim.state),stats=A.stats(f.sim.state.adventure);assert.equal(E.bindingCommand(f.ctx,'dawn_edge','edge',{save:f.save}).ok,false);assert.deepEqual(f.sim.state,before);
  assert.equal(E.bindingCommand(f.ctx,'trail_blade','shelter',{save:()=>({ok:false,error:'binding saver refused'})}).ok,false);assert.deepEqual(f.sim.state,before);
  const result=E.bindingCommand(f.ctx,'trail_blade','shelter',{save:f.save});assert.ok(result.ok,result.error);assert.equal(f.sim.state.adventure.hp,75);assert.equal(A.stats(f.sim.state.adventure).maxHP-stats.maxHP,10);assert.equal(A.stats(f.sim.state.adventure).defense-stats.defense,1);assert.deepEqual(f.sim.state.adventure.arsenal,before.adventure.arsenal);assert.deepEqual(f.sim.state.adventure.equipment,before.adventure.equipment);assert.equal(f.sim.state.adventure.ore,0);assert.equal(f.sim.state.adventure.coins,0);assert.equal(f.sim.state.sandbox.inventory.fiber,0);
  const once=copy(f.sim.state);assert.equal(E.bindingCommand(f.ctx,'trail_blade','edge',{save:f.save}).ok,false);assert.deepEqual(f.sim.state,once);
 });
}else console.log('PENDING production command/physical checks: this baseline has Adventure11; shared integration is required. No substituted validator is used.');
console.log(JSON.stringify({status:'passed',checks,method:'pure schema/topology/bonus and explicitly labelled adversarial fixtures; physical production journey separate'}));
