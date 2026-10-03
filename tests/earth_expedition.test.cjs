/* Focused catalogue/schema/bonus checks. Adversarial states are validation
 * fixtures, not evidence of command-earned equipment or combat. */
'use strict';
const assert=require('node:assert/strict'),E=require('../src/earth-expedition.js');
const A=require('../src/adventure.js'),C=require('../src/core.js');
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
console.log(JSON.stringify({status:'passed',checks,method:'pure schema/topology/bonus and explicitly labelled adversarial fixtures; physical production journey separate'}));
