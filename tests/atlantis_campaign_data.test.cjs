'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const data=require('../src/atlantis-campaign-data.js');
const {definition:d,patterns,current,pressure}=data;
const C=require('../src/core.js'),W=require('../src/world-foundations.js');
const old=require('../src/realm-trails-south.js'),AR=require('../src/arsenal.js'),HH=require('../src/home-history.js');
const world=W.definition(d.realm),steps=new Map(d.steps.map(s=>[s.id,s]));
const keys=(v,expected)=>assert.deepEqual(Object.keys(v).sort(),expected.slice().sort());
const stable=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function frozen(v){if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}}
function dryRoute(a,b,radius=.31){
 assert.ok(W.walkable(d.room,a.x,a.z,radius),'real start supports the full body');
 assert.ok(W.walkable(d.room,b.x,b.z,radius),'real destination supports the full body');
 const route=C.pathfind(a,b,{id:d.room},false,radius);assert.ok(route?.length,'production pathfinder reaches the actual destination');
 let previous=a;for(const p of route){assert.ok(W.segment(d.room,previous,p,radius),'whole path segment clears support and solids');previous=p;}
 assert.ok(distance(previous,b)<1e-8,'no nearby substitute destination');return route;
}
function swimSegment(a,b){
 const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)/.025));
 for(let i=0;i<=n;i++)assert.ok(W.swimClear(world.dive,a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,a.z+(b.z-a.z)*i/n),'whole sampled route clears the production .31-radius, 1.7-high body');
 return n+1;
}
function canAdvance(state,s){
 if(state.steps.has(s.id)||!s.requires.every(id=>state.steps.has(id)))return false;
 return s.id!=='diagnose-flow'||!!state.approach&&state.steps.has(d.approaches.find(a=>a.id===state.approach).requiredObservation);
}

test('Atlantis catalogue: immutable exact imports grant no progress, actor, support or old-owner change',()=>{
 keys(data,['definition','patterns','current','pressure']);frozen(data);
 keys(d,['id','title','room','realm','prerequisite','giver','reward','summary','danger','completionText','witnesses','approaches','steps','choices','enemy']);
 assert.equal(d.id,'atlantis-harbour-beneath-v1');assert.equal(d.realm,'atlantis');assert.equal(d.room,'world-atlantis');
 const sentinel={untouched:true},sandbox={RealmCore:sentinel,RealmWorldFoundations:sentinel,RealmAdventure:sentinel,module:{exports:{}}};
 const before=new Set(Object.keys(sandbox));vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/atlantis-campaign-data.js'),'utf8'),sandbox);
 for(const name of['RealmCore','RealmWorldFoundations','RealmAdventure'])assert.strictEqual(sandbox[name],sentinel);
 assert.deepEqual(Object.keys(sandbox).filter(k=>!before.has(k)),['RealmAtlantisCampaignData']);
 assert.strictEqual(sandbox.module.exports,sandbox.RealmAtlantisCampaignData);frozen(sandbox.RealmAtlantisCampaignData);
 assert.throws(()=>{d.reward.materials.crystal=9999;},TypeError);
 assert.match(d.summary,/provisional authored adaptations/);assert.match(d.completionText,/Original Heaven01 and the protected sanctuary remain separate/);
});

test('Atlantis entry and witnesses: existing chart and giver stay distinct; new accepted witnesses do not duplicate residents',()=>{
 const chart=old.definitions.find(v=>v.id===d.prerequisite);assert.ok(chart);assert.equal(chart.realm,d.realm);
 assert.equal(d.prerequisite,'atlantis-bellglass-chart-v1');assert.equal(distance(d.giver,chart.giver),0);
 assert.equal(distance(d.giver,world.points.find(p=>p.id===d.giver.id)),0);assert.equal(d.giver.id,'sahra');
 assert.notEqual(d.id,chart.id);assert.notEqual(d.id,world.quest.id);
 assert.deepEqual(world.points.filter(p=>p.kind==='person').map(p=>p.id),['nereme','sahra']);
 assert.deepEqual(d.witnesses.map(w=>w.id),['atlantis-ilyra-v1','atlantis-damar-v1']);
 for(const w of d.witnesses){
  keys(w,['id','name','x','z','appearsAfter']);assert.ok(stable.test(w.id));assert.ok(!world.points.some(p=>p.id===w.id||p.name===w.name));
  for(const id of w.appearsAfter)assert.ok(steps.has(id));dryRoute(world.entry,w,.4);
 }
 assert.equal(distance(d.witnesses[0],steps.get('receipt-conflict')),0);assert.deepEqual(d.witnesses[0].appearsAfter,[]);
 assert.equal(distance(d.witnesses[1],steps.get('secure-carrier')),0);assert.deepEqual(d.witnesses[1].appearsAfter,['outlet-set']);
 assert.equal(d.witnesses.some(w=>/Pelan/.test(w.name)),false,'there is no fabricated keeper visit');
 assert.match(steps.get('verify-passage').text,/not a simulated voyage/);assert.match(steps.get('verify-passage').text,/Pelan witnessed a delivery/);
});

test('Atlantis graph: named pressure order, retained approach and real exhaustion guard all mandatory edges',()=>{
 assert.equal(steps.size,17);const visiting=new Set(),done=new Set();
 function visit(id){assert.ok(steps.has(id));assert.ok(!visiting.has(id),'no cyclic prerequisites');if(done.has(id))return;visiting.add(id);for(const r of steps.get(id).requires)visit(r);visiting.delete(id);done.add(id);}
 for(const s of d.steps){
  keys(s,['id','name','x','z','medium','kind','requires','optional','text',...(s.medium==='dry'?[]:['y'])]);
  assert.ok(stable.test(s.id));assert.ok([s.x,s.z].every(Number.isFinite));assert.ok(s.name&&s.text);
  assert.ok(['dry','water','court'].includes(s.medium));assert.ok(['interact','approach','pressure','defeat','choice'].includes(s.kind));
  assert.equal(typeof s.optional,'boolean');assert.equal(new Set(s.requires).size,s.requires.length);visit(s.id);
  for(const r of s.requires)assert.ok(!steps.get(r).optional,'only the explicit selected-reading condition can require optional evidence');
 }
 assert.deepEqual(d.steps.filter(s=>s.optional).map(s=>s.id),['upper-reading','lower-reading','manual-bypass']);
 assert.deepEqual(d.approaches.map(a=>[a.id,a.requiredObservation]),[['upper','upper-reading'],['lower','lower-reading']]);
 for(const a of d.approaches){keys(a,['id','name','requiredObservation','text']);assert.equal(steps.get(a.requiredObservation).optional,true);}
 keys(pressure,['stages','bypassStep','correct']);assert.deepEqual(pressure.stages,['inlet-set','equalizer-set','outlet-set']);
 assert.deepEqual(pressure.correct,[{step:'inlet-set',setting:'isolate-redirect'},{step:'equalizer-set',setting:'match-depth-bands'},{step:'outlet-set',setting:'chosen-destination'}]);
 assert.equal(pressure.bypassStep,'manual-bypass');assert.ok(steps.get(pressure.bypassStep).optional);
 for(let i=0;i<pressure.stages.length;i++){const s=steps.get(pressure.stages[i]);assert.equal(s.kind,'pressure');assert.deepEqual(s.requires,[i?pressure.stages[i-1]:'diagnose-flow']);assert.match(s.text,new RegExp(pressure.correct[i].setting));}
 assert.deepEqual(steps.get('release-west').requires,['bearing-exposed']);assert.deepEqual(steps.get('release-east').requires,['release-west']);
 assert.deepEqual(steps.get('custodian-stable').requires,['release-east']);assert.deepEqual(steps.get('disposition').requires,['custodian-stable']);
 assert.deepEqual(steps.get('verify-passage').requires,['disposition']);assert.equal(d.steps.some(s=>s.id==='claim'),false);
 assert.equal(steps.get('bearing-exposed').kind,'defeat');assert.match(steps.get('bearing-exposed').text,/manual completion button cannot substitute/);
 assert.match(steps.get('manual-bypass').text,/three required inlet, equalizer and outlet stages still need/);
 const missing={approach:'upper',steps:new Set(['receipt-conflict','choose-approach','lower-reading'])};
 assert.equal(canAdvance(missing,steps.get('diagnose-flow')),false,'the other reading never backfills selected evidence');
 missing.steps.add('upper-reading');assert.equal(canAdvance(missing,steps.get('diagnose-flow')),true);
 assert.equal(canAdvance({approach:'upper',steps:new Set(['bearing-exposed'])},steps.get('release-east')),false,'the east release cannot bypass the west');
});

test('Atlantis branches: exhaustive authored fact sets cover both approaches, optional evidence/bypass and every disposition',()=>{
 // Catalogue/DAG proof only. This is not a campaign-state migration or transaction implementation.
 const required=d.steps.filter(s=>!s.optional).map(s=>s.id),queue=[{steps:new Set(),approach:null,choice:null}],seen=new Set(['0::']),terminals=new Set();
 const signature=s=>d.steps.reduce((mask,p,i)=>mask|(s.steps.has(p.id)?1<<i:0),0)+':'+(s.approach||'')+':'+(s.choice||'');
 for(let i=0;i<queue.length;i++){
  const state=queue[i];
  if(required.every(id=>state.steps.has(id))){
   const selected=d.approaches.find(a=>a.id===state.approach);assert.ok(selected);assert.ok(state.steps.has(selected.requiredObservation));assert.ok(d.choices.some(c=>c.id===state.choice));
   const extra=d.approaches.find(a=>a.id!==state.approach).requiredObservation;
   terminals.add([state.approach,state.steps.has(extra)?'both':'selected',state.steps.has(pressure.bypassStep)?'bypass':'ordinary',state.choice].join(':'));
  }
  for(const s of d.steps){if(!canAdvance(state,s))continue;
   for(const approach of s.kind==='approach'?d.approaches.map(a=>a.id):[state.approach])for(const choice of s.kind==='choice'?d.choices.map(c=>c.id):[state.choice]){
    const next={steps:new Set([...state.steps,s.id]),approach,choice},key=signature(next);if(!seen.has(key)){seen.add(key);queue.push(next);}
   }
  }
 }
 const expected=[];for(const a of d.approaches)for(const extra of['both','selected'])for(const bypass of['bypass','ordinary'])for(const c of d.choices)expected.push([a.id,extra,bypass,c.id].join(':'));
 assert.deepEqual([...terminals].sort(),expected.sort());assert.equal(terminals.size,24);assert.ok(queue.length>40&&queue.length<2000,'exhaustive graph stays finite');
 for(const state of queue){
  assert.equal(state.steps.has('choose-approach'),state.approach!==null);assert.equal(state.steps.has('disposition'),state.choice!==null);
  for(const s of d.steps)if(state.steps.has(s.id)){for(const id of s.requires)assert.ok(state.steps.has(id));if(s.id==='diagnose-flow')assert.ok(state.steps.has(d.approaches.find(a=>a.id===state.approach).requiredObservation));}
 }
});

test('Atlantis dry geography: every dry action and declared waiting witness has a full supported home path',()=>{
 const home=world.points.find(p=>p.kind==='return');assert.equal(home.id,'home-pier');assert.equal(distance(home,world.entry),0);
 for(const p of[d.giver,...d.steps.filter(s=>s.medium==='dry'),...d.witnesses]){dryRoute(world.entry,p);dryRoute(p,home);assert.equal(W.height(d.room,p.x,p.z),1.57);}
 dryRoute(world.entry,d.enemy,d.enemy.radius);assert.equal(distance(d.enemy,steps.get(d.enemy.defeatStep)),0);
 for(const p of[{x:2,z:-44},{x:15,z:-44},{x:12,z:-40.1}])dryRoute(d.enemy,p,d.enemy.radius);
 assert.ok(W.segment(d.room,{x:-3,z:-40},{x:-3,z:-24}),'.31 public causeway stays open independently of the quay');
});

test('Atlantis wet geography: exact depth/medium actions connect through the existing whole-body gallery route',()=>{
 const route=world.dive.routes.find(r=>r.id==='visitor-gallery').points.map(([x,y,z])=>({x,y,z}));
 let samples=0;for(let i=1;i<route.length;i++)samples+=swimSegment(route[i-1],route[i]);assert.ok(samples>1000);
 const links=[
  [route[0],steps.get('upper-reading')],[steps.get('upper-reading'),route[1]],
  [route[1],steps.get('lower-reading')],[steps.get('lower-reading'),route[2]],
  [route[3],steps.get('diagnose-flow')],[steps.get('diagnose-flow'),route[4]],
  [route[7],steps.get('manual-bypass')],[route[7],steps.get('outlet-set')],[steps.get('outlet-set'),route[8]]
 ];
 for(const[a,b]of links)swimSegment(a,b);
 for(const s of d.steps.filter(s=>s.medium!=='dry')){
  assert.ok(Number.isFinite(s.y));assert.ok(W.swimClear(world.dive,s.x,s.y,s.z));
  assert.equal(W.medium({room:d.room},[s.x,s.y+.85,s.z]),s.medium==='court'?'air':'water');
  assert.ok([...route,...links.flat()].some(p=>distance(p,s)<1e-8&&Math.abs(p.y-s.y)<1e-8),'every exact action lies on the qualified connected network');
 }
 assert.equal(steps.get('diagnose-flow').y,world.dive.dryCourts[0].floorY);
 assert.equal(W.swimClear(world.dive,8,-2.7,-37.38),false,'the actual Bellglass back-wall point blocks the whole body');
 assert.throws(()=>swimSegment(steps.get('diagnose-flow'),{x:8,y:-2.7,z:-38.4}),{code:'ERR_ASSERTION'},'a clear destination beyond the wall does not make the direct crossing valid');
});

test('Atlantis current: marked shallow region is entirely water; lower reading, manual bypass and air court remain outside',()=>{
 keys(current,['x','z','w','d','minY','maxY','direction','speed','startStep','stopSteps']);assert.equal(current.startStep,'choose-approach');assert.deepEqual(current.stopSteps,['manual-bypass','outlet-set']);
 assert.equal(Math.hypot(current.direction.dx,current.direction.dz),1);assert.equal(current.speed,.7);
 const within=p=>Math.abs(p.x-current.x)<=current.w/2&&Math.abs(p.z-current.z)<=current.d/2&&p.y>=current.minY&&p.y<=current.maxY;
 assert.ok(within(steps.get('upper-reading')));assert.equal(within(steps.get('lower-reading')),false);assert.equal(within(steps.get('manual-bypass')),false);
 for(const x of[current.x-current.w/2,current.x,current.x+current.w/2])for(const z of[current.z-current.d/2,current.z,current.z+current.d/2])for(const y of[current.minY,current.maxY]){
  assert.ok(W.swimClear(world.dive,x,y,z));assert.equal(W.medium({room:d.room},[x,y+.85,z]),'water');
 }
 const court=world.dive.dryCourts[0];assert.ok(current.z-current.d/2>court.z+court.d/2,'no current overlaps the air court');
 // A synthetic primitive fixture measures the existing control speed, not new campaign behavior.
 const sim={room:d.room,paused:false,worldDive:{y:-1.05,hold:true},state:{player:{x:8,z:-24,yaw:0},adventure:{hp:100}},playerPath:[]};
 assert.equal(W.swim(sim,1,0,0,.1),true);const controlSpeed=(sim.state.player.x-8)/.1;assert.ok(Math.abs(controlSpeed-2.6)<1e-8);assert.ok(current.speed<controlSpeed);
 assert.match(d.danger,/no breath timer, hidden timing penalty or material loss/);assert.match(d.danger,/air court has no current and no combat/);
});

test('Atlantis encounter: grounded sweep fits; intake exposes the real south-edge clipping requirement',()=>{
 keys(d.enemy,['id','name','kind','x','z','hp','damage','radius','anchored','damageWindow','spawnAfter','defeatStep']);
 assert.equal(d.enemy.anchored,true,'municipal service machine stays at its supported foundation');
 assert.equal(d.enemy.id,'atlantis-breakwater-custodian-v1');assert.equal(d.enemy.kind,'sentinel');assert.equal(d.enemy.hp,128);assert.equal(d.enemy.damage,10);assert.equal(d.enemy.radius,.75);assert.equal(d.enemy.damageWindow,'all-live-phases');
 assert.deepEqual(d.enemy.spawnAfter,['challenge-custodian']);assert.equal(d.enemy.defeatStep,'bearing-exposed');assert.equal((world.enemies||[]).length,0);
 assert.ok(!old.definitions.some(v=>v.enemy?.id===d.enemy.id));assert.equal('xp' in d.enemy,false);assert.equal('gear' in d.enemy,false);
 keys(patterns,['sweep','intake']);assert.deepEqual(patterns.sweep,{kind:'sweep',reach:3.6,radius:3.4,halfAngle:Math.PI/3,windup:1.3,contact:.18,recovery:1.9});
 assert.deepEqual(patterns.intake,{kind:'intake',reach:6,length:5.5,halfWidth:1,windup:1.5,active:1.2,recovery:2.1,pullSpeed:1.2,stopRadius:1.2});
 assert.ok(patterns.intake.stopRadius>d.enemy.radius+.31,'the declared pull stop keeps the player body outside the floor-clamped unit');
 for(let i=0;i<128;i++){const a=i/128*Math.PI*2,p={x:d.enemy.x+Math.sin(a)*patterns.sweep.radius,z:d.enemy.z+Math.cos(a)*patterns.sweep.radius};assert.ok(W.segment(d.room,d.enemy,p,.31),'all headings of the whole sweep fit supported player ground');}
 function lane(length,yaw){for(const side of[-1,0,1]){const a={x:d.enemy.x+Math.cos(yaw)*side,z:d.enemy.z-Math.sin(yaw)*side},b={x:a.x+Math.sin(yaw)*length,z:a.z+Math.cos(yaw)*length};if(!W.segment(d.room,a,b,.31))return false;}return true;}
 assert.equal(lane(patterns.intake.length,0),true,'the maximum northern full-width lane fits');
 assert.equal(lane(patterns.intake.length,Math.PI),false,'raw maximum southward intake leaves existing support');
 assert.equal(lane(3.5,Math.PI),true,'a shorter southward locked lane can fit the same supported quay');
 const bollard=world.solids.find(s=>s.id==='exit-quay-bollard');assert.ok(bollard);assert.equal(W.segment(d.room,d.enemy,{x:19,z:-44},.04),false,'existing opaque bollard is real contact cover');
 assert.match(d.danger,/support and opaque cover must clip the locked footprint/);assert.match(steps.get('challenge-custodian').text,/anchored at its service foundation.*does not chase/);
 assert.match(steps.get('bearing-exposed').text,/not killed or exploded/);assert.match(d.danger,/no recovery-only armor or equipment scaling/);
});

test('Atlantis fee and dispositions: fixed complete payload contributes to actual recipes and keeps recognition local',()=>{
 assert.deepEqual(d.reward,{xp:48,coins:18,ore:4,materials:{wood:4,fiber:3,crystal:1}});keys(d.reward,['xp','coins','ore','materials']);
 for(const n of[d.reward.xp,d.reward.coins,d.reward.ore,...Object.values(d.reward.materials)])assert.ok(Number.isSafeInteger(n)&&n>0&&n<9999);
 const ruby=AR.RECIPES.ruby,lamp=HH.definition('memory-bellglass');assert.ok(ruby&&lamp);
 assert.ok(d.reward.ore>=ruby.ore&&d.reward.coins>=ruby.coins);for(const[k,n]of Object.entries(ruby.materials))assert.ok((d.reward.materials[k]||0)>=n);
 for(const[k,n]of Object.entries(lamp.cost))assert.ok((d.reward.materials[k]||0)>=n);
 assert.deepEqual(d.choices.map(c=>c.id),['publish','limited','license']);
 for(const c of d.choices){
  keys(c,['id','name','text','consequence','recognition']);assert.ok(stable.test(c.id));assert.match(c.text,/Damar’s safety and the free home passage remain/);assert.match(c.consequence,/permanent local/);assert.match(c.consequence,/stated fee remains unchanged/);
  assert.deepEqual(c.recognition.map(r=>r.name),['Sahra','Ilyra','Damar']);for(const line of c.recognition){keys(line,['name','text']);assert.ok(line.text.length>30&&line.text.length<220);}
 }
 assert.equal(new Set(d.choices.map(c=>c.recognition.at(-1).text)).size,3,'real carrier recognition differs with the disposition');
 assert.match(d.choices[2].text,/Future patron privileges are not implemented/);assert.match(steps.get('disposition').text,/no choice changes Grace, Cinder, renunciation, class or global allegiance/);
 assert.match(d.completionText,/XP credits up to 48 within the existing stored cap/);assert.match(d.completionText,/not a universal weapon upgrade/);assert.match(d.completionText,/Tideglass Fitting remain pending/);
});
