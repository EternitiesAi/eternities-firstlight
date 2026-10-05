'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {definition:d}=require('../src/heaven-campaign-data.js');
const C=require('../src/core.js'),W=require('../src/world-foundations.js');
const north=require('../src/realm-trails-north.js');
const steps=new Map(d.steps.map(s=>[s.id,s]));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const keys=(v,expected)=>assert.deepEqual(Object.keys(v).sort(),expected.slice().sort());
const stable=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}}
function route(a,b,radius=.31){
 assert.ok(W.walkable(d.room,a.x,a.z,radius),'actual start clears the declared body');
 assert.ok(W.walkable(d.room,b.x,b.z,radius),'actual endpoint clears the declared body');
 const points=C.pathfind(a,b,{id:d.room},false,radius);
 assert.ok(points?.length,'production pathfinding reaches the complete authored endpoint');
 let previous=a;
 for(const p of points){assert.ok(W.segment(d.room,previous,p,radius),'every whole production path segment has body-qualified support and clearance');previous=p;}
 assert.ok(distance(previous,b)<1e-8,'no substitute nearby destination');return points;
}

test('Heaven catalogue: frozen exact API imports without starting gameplay or changing older owners',()=>{
 keys(globalThis.RealmHeavenCampaignData,['definition']);frozen(globalThis.RealmHeavenCampaignData);
 keys(d,['id','title','room','realm','prerequisite','giver','reward','summary','danger','completionText','steps','choices','enemies','escort']);
 assert.equal(d.id,'heaven-gate-remained-open-v1');assert.equal(d.room,'world-heaven');assert.equal(d.realm,'heaven');
 const sentinel={untouched:true},sandbox={RealmTrailsNorth:sentinel,RealmWorldFoundations:sentinel,RealmCore:sentinel,module:{exports:{}}};
 const before=new Set(Object.keys(sandbox));
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/heaven-campaign-data.js'),'utf8'),sandbox);
 for(const name of['RealmTrailsNorth','RealmWorldFoundations','RealmCore'])assert.strictEqual(sandbox[name],sentinel);
 assert.deepEqual(Object.keys(sandbox).filter(k=>!before.has(k)),['RealmHeavenCampaignData']);
 assert.strictEqual(sandbox.module.exports,sandbox.RealmHeavenCampaignData);
 assert.throws(()=>{d.enemies[0].hp=1;},TypeError);assert.throws(()=>{d.escort.route.push({x:0,z:0});},TypeError);
 assert.match(d.summary,/provisional authored adaptations/);assert.match(d.summary,/repaired and claimed/);
 assert.match(d.completionText,/original Heaven01 trial and protected sanctuary remain separate/);
});

test('Heaven entry: exact existing Broken Choir owner, ordinary source anchors and independent identities',()=>{
 assert.equal(d.prerequisite,'heaven-broken-choir-v1');
 const old=north.definitions.find(v=>v.id===d.prerequisite),world=W.definition(d.realm);assert.ok(old);assert.equal(old.realm,d.realm);
 keys(d.giver,['id','name','x','z']);assert.equal(d.giver.id,'heaven-rielle');
 assert.equal(distance(d.giver,old.giver),0);assert.equal(distance(d.giver,world.points.find(p=>p.id===d.giver.id)),0);
 assert.notEqual(d.id,old.id);assert.notEqual(d.id,world.quest.id);
 for(const e of d.enemies){assert.ok(!(world.enemies||[]).some(v=>v.id===e.id));assert.ok(!north.definitions.some(v=>v.enemy?.id===e.id));}
 assert.notEqual(d.escort.id,'hell-neris');assert.notEqual(d.escort.id,'heaven-calen');
 assert.match(steps.get('fit-arrival-assist').text,/already repaired/);assert.match(steps.get('fit-arrival-assist').text,/not a replay/);
 assert.match(d.danger,/No class, soul technique or companion is mandatory/);
 assert.match(d.danger,/Road home remains free/);
});

test('Heaven graph: all deliberate branches are acyclic and no preparation, defeat or escort is a fake button',()=>{
 assert.equal(steps.size,13);const visiting=new Set(),done=new Set();
 function visit(id){
  const s=steps.get(id);assert.ok(s,'every prerequisite names a known physical step');assert.ok(!visiting.has(id),'no cycle');if(done.has(id))return;
  visiting.add(id);for(const r of s.requires){assert.ok(s.optional||!steps.get(r)?.optional,'optional work never gates a required step');visit(r);}
  visiting.delete(id);done.add(id);
 }
 for(const s of d.steps){
  keys(s,['id','name','x','z','medium','kind','requires','optional','text']);assert.ok(stable.test(s.id));assert.ok(s.name&&s.text);
  assert.ok([s.x,s.z].every(Number.isFinite));assert.equal(s.medium,'dry');assert.equal(typeof s.optional,'boolean');
  assert.ok(['interact','defeat','escort','choice'].includes(s.kind));assert.equal(new Set(s.requires).size,s.requires.length);visit(s.id);
 }
 assert.deepEqual(d.steps.filter(s=>s.optional).map(s=>s.id),['ground-mirror']);
 assert.deepEqual(d.steps.filter(s=>s.kind==='defeat').map(s=>s.id),['beam-disabled','relay-disabled']);
 assert.deepEqual(d.steps.filter(s=>s.kind==='escort').map(s=>s.id),['wayfarer-arrived']);
 assert.equal(steps.get(d.escort.startStep).kind,'interact');assert.notEqual(d.escort.startStep,d.escort.arrivalStep);
 assert.equal(steps.get(d.escort.arrivalStep).kind,'escort');assert.deepEqual(steps.get(d.escort.arrivalStep).requires,[d.escort.startStep]);
 assert.deepEqual(steps.get('fit-arrival-assist').requires,[d.escort.arrivalStep]);assert.equal(steps.get('arrangement').kind,'choice');
 assert.deepEqual(steps.get('verify-welcome').requires,['arrangement']);assert.equal(d.steps.some(s=>s.id==='claim'),false);
 assert.match(steps.get(d.escort.arrivalStep).text,/manual completion button cannot substitute/);
 assert.match(steps.get('arrangement').text,/Preview and cancel keep the choice undecided/);
});

test('Heaven branches: exhaust every legal fact set and both arrangements with and without supplied preparation',()=>{
 // This enumerates the authored DAG, not future transaction implementation.
 const required=d.steps.filter(s=>!s.optional).map(s=>s.id),queue=[{mask:0,choice:null}],seen=new Set(['0:']),terminals=new Set();
 const has=(mask,id)=>!!(mask&(1<<d.steps.findIndex(s=>s.id===id)));
 for(let i=0;i<queue.length;i++){
  const state=queue[i];
  if(required.every(id=>has(state.mask,id))){
   assert.ok(d.choices.some(c=>c.id===state.choice));terminals.add((has(state.mask,'ground-mirror')?'prepared':'plain')+':'+state.choice);
  }
  for(let j=0;j<d.steps.length;j++){
   const s=d.steps[j];if(has(state.mask,s.id)||!s.requires.every(id=>has(state.mask,id)))continue;
   const choices=s.kind==='choice'?d.choices.map(c=>c.id):[state.choice];
   for(const choice of choices){const next={mask:state.mask|(1<<j),choice},key=next.mask+':'+(choice||'');if(!seen.has(key)){seen.add(key);queue.push(next);}}
  }
 }
 assert.deepEqual([...terminals].sort(),['plain:accessible-assist','plain:broadened-activation','prepared:accessible-assist','prepared:broadened-activation']);
 assert.ok(queue.length>20&&queue.length<100,'bounded exhaustive graph, including optional preparation timing');
 for(const state of queue){
  for(const s of d.steps)if(has(state.mask,s.id))for(const r of s.requires)assert.ok(has(state.mask,r));
  assert.equal(has(state.mask,'arrangement'),state.choice!==null,'no unearned choice and no recorded arrangement without choice');
 }
});

test('Heaven geography: every action, branch and return uses complete production support without opening the terrace',()=>{
 const world=W.definition(d.realm),home=world.points.find(p=>p.kind==='return');
 assert.equal(distance(world.entry,{x:0,z:27}),0);assert.equal(distance(home,{x:0,z:31}),0);
 for(const p of[d.giver,...d.steps]){route(world.entry,p);route(p,home);}
 for(const s of d.steps)for(const id of s.requires)route(steps.get(id),s);
 for(const[id,pointId]of[['compare-arrival-marks','heaven-arcade-response'],['inspect-false-relay','heaven-causeway-response'],['fit-arrival-assist','heaven-garden-response'],['verify-welcome','heaven-calen']]){
  assert.equal(distance(steps.get(id),world.points.find(p=>p.id===pointId)),0,'reuse the actual canonical anchor');
 }
 const closed=world.solids.find(s=>s.id==='heaven-north-closed-terrace');assert.ok(closed);
 assert.equal(W.segment(d.room,{x:0,z:-109},{x:0,z:-115}),false,'the original closed terrace is still a real obstruction');
 assert.ok(d.enemies.every(e=>e.z>closed.z+closed.d/2+e.radius),'new encounter centers stay on the lower exterior side');
 assert.match(d.danger,/upper terrace remains closed/);
});

test('Heaven enemy bodies: fixed body-qualified routes clear actual cover and reject player-only narrow clearance',()=>{
 for(const e of d.enemies){
  route(W.definition(d.realm).entry,e,e.radius);
  for(const[dx,dz]of[[4,0],[-4,0],[0,4],[0,-4]])route(e,{x:e.x+dx,z:e.z+dz},e.radius);
  assert.equal(distance(steps.get(e.defeatStep),e),0,'defeat anchor is the exact owned enemy');
 }
 const beam=d.enemies[0],pier=W.definition(d.realm).solids.find(s=>s.id==='heaven-causeway-pier-2-east');assert.ok(pier);
 const narrow={x:pier.x-pier.w/2-.45,z:pier.z};
 assert.equal(W.walkable(d.room,narrow.x,narrow.z,.31),true);assert.equal(W.walkable(d.room,narrow.x,narrow.z,beam.radius),false);
 assert.ok(C.pathfind(beam,narrow,{id:d.room})?.length,'the player-sized route remains available');
 assert.equal(C.pathfind(beam,narrow,{id:d.room},false,beam.radius),null,'a bigger construct does not borrow player clearance');
});

test('Heaven escort: the actual seven-point service loop clears the full courier body, including the bench detour',()=>{
 const e=d.escort;keys(e,['id','name','x','z','radius','speed','followRange','arrivalRadius','startStep','arrivalStep','route']);
 assert.equal(e.id,'heaven-wayfarer-v1');assert.equal(e.radius,.4);assert.equal(e.speed,2.2);assert.equal(e.followRange,9);assert.equal(e.arrivalRadius,1.25);
 assert.deepEqual(e.route,[{x:-29,z:-69},{x:-24,z:-76},{x:-35,z:-55},{x:-35,z:-31},{x:-24,z:-7},{x:-9.6,z:2.4},{x:7,z:17}]);
 assert.equal(distance(e,e.route[0]),0);assert.equal(distance(steps.get(e.startStep),e.route[0]),0);assert.equal(distance(steps.get(e.arrivalStep),e.route.at(-1)),0);
 for(const p of e.route){keys(p,['x','z']);assert.ok(W.walkable(d.room,p.x,p.z,e.radius));assert.equal(W.height(d.room,p.x,p.z),1.57);}
 for(let i=1;i<e.route.length;i++){
  assert.ok(W.segment(d.room,e.route[i-1],e.route[i],e.radius),'every complete authored courier segment clears actual support and solids');
  route(e.route[i-1],e.route[i],e.radius);
 }
 assert.equal(W.segment(d.room,e.route[4],e.route[6],e.radius),false,'the direct shortcut would cross real cover');
 assert.ok(distance(e.route.at(-1),steps.get('verify-welcome'))===3,'courier arrival is beside Calen, not the same occupied person anchor');
 assert.match(steps.get(e.startStep).text,/Leaving or reloading resets an unfinished walk while retaining the invitation/);
 assert.match(steps.get(e.startStep).text,/deliberately invite again/);assert.match(steps.get(e.arrivalStep).text,/actual complete supported-route arrival/);
 assert.match(steps.get(e.arrivalStep).text,/Unfinished route progress is transient/);
});

test('Heaven encounters: directed beam and local pulse differ, admit ordinary damage and grant no separate rewards',()=>{
 assert.equal(d.enemies.length,2);
 for(const e of d.enemies){
  keys(e,['id','name','kind','x','z','hp','damage','radius','damageWindow','spawnAfter','defeatStep','objective','attack']);
  assert.ok(stable.test(e.id));assert.equal(e.kind,'sentinel');assert.equal(e.damageWindow,'all-live-phases');assert.ok(e.objective);
  assert.ok([e.hp,e.damage].every(v=>Number.isSafeInteger(v)&&v>0));assert.ok(e.radius>0&&e.radius<1);
  for(const id of e.spawnAfter)assert.ok(steps.has(id));assert.equal(steps.get(e.defeatStep).kind,'defeat');
  assert.deepEqual(steps.get(e.defeatStep).requires,e.spawnAfter,'one actual encounter owns each defeat edge');
  assert.equal('xp' in e,false);assert.equal('ore' in e,false);assert.equal('gear' in e,false);
 }
 const[beam,relay]=d.enemies;
 assert.deepEqual({hp:beam.hp,damage:beam.damage,radius:beam.radius},{hp:110,damage:12,radius:.55});
 assert.deepEqual({hp:relay.hp,damage:relay.damage,radius:relay.radius},{hp:75,damage:9,radius:.6});
 assert.deepEqual(beam.attack,{kind:'beam',reach:9,length:9,halfWidth:.65,windup:1.2,recovery:1.7,support:{step:'ground-mirror',windupBonus:.4}});
 assert.deepEqual(relay.attack,{kind:'pulse',reach:5.5,radius:3.4,windup:1.4,recovery:2});
 assert.ok(steps.get(beam.attack.support.step).optional);assert.equal('support' in relay.attack,false);
 assert.match(steps.get('ground-mirror').text,/adds exactly 0\.4 seconds to its warning/);
 assert.match(steps.get('ground-mirror').text,/no recovery interval, and no relay pulse/);
 assert.match(d.danger,/during all live phases/);assert.match(d.danger,/neither has recovery-only armor or equipment scaling/);
 assert.match(steps.get('beam-disabled').text,/no independent loot or XP/);
 assert.match(steps.get('secure-service-route').text,/after both apparatuses are disabled/);
});

test('Heaven reward and choices: one common finite material fee, explicit public usability and earned recognition',()=>{
 assert.deepEqual(d.reward,{xp:40,coins:16,ore:3,materials:{wood:4,fiber:3}});keys(d.reward,['xp','coins','ore','materials']);
 assert.deepEqual(d.choices.map(c=>c.id),['accessible-assist','broadened-activation']);
 for(const c of d.choices){
  keys(c,['id','name','text','consequence','recognition']);assert.ok(stable.test(c.id));
  assert.match(c.text,/keeps public service usable/);assert.match(c.text,/does not gate anyone’s right to pass/);
  assert.match(c.text,/courier arrival and truthful account remain/);assert.match(c.consequence,/permanent/);assert.match(c.consequence,/stated fee remains unchanged/);
  assert.match(c.consequence,/A deliberate activation briefly moves/);assert.match(c.consequence,/at rest the fitting stays quiet/);
  assert.deepEqual(c.recognition.map(r=>r.name),['Rielle','Calen','Yselle']);
  for(const line of c.recognition){keys(line,['name','text']);assert.ok(line.text.length>20&&line.text.length<220);}
 }
 assert.match(d.choices[0].text,/lower assist lever plus a request plate/);assert.match(d.choices[1].text,/broad activation plate/);
 assert.notEqual(d.choices[0].recognition[0].text,d.choices[1].recognition[0].text);
 assert.match(d.completionText,/fixed 16 sunmarks, 3 ore, 4 timber and 3 fibre once; XP credits up to 40 within the existing stored cap/);
 assert.doesNotMatch(d.completionText,/has paid (?:the declared )?40 XP/);
 assert.match(d.completionText,/not a promised upgrade for every veteran/);assert.match(d.completionText,/No gear was fitted, equipped or granted/);
 const contract=fs.readFileSync(path.join(__dirname,'../docs/development/HEAVEN_APPROACH_CONTRACT_2026-10-04.md'),'utf8');
 assert.match(contract,/displayed only after actual\s+`verify-welcome`/);
 assert.match(contract,/\{version:1,accepted:false,steps:\[\],choice:null,claimed:false\}/);
 assert.match(contract,/incomplete route checkpoints\s+are not saved/);
});
