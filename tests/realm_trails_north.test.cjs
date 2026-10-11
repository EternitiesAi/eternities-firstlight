'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {definitions}=require('../src/realm-trails-north.js');
const C=require('../src/core.js');
const W=require('../src/world-foundations.js');
const FLOOR=1.57,ID=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const sort=keys=>keys.slice().sort();
const keys=(value,expected)=>assert.deepEqual(sort(Object.keys(value)),sort(expected));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const byRealm=realm=>definitions.find(d=>d.realm===realm);
function deepFrozen(value){
 if(value&&typeof value==='object'){
  assert.ok(Object.isFrozen(value),'every nested catalogue object/array is immutable');
  Object.values(value).forEach(deepFrozen);
 }
}
function graph(def){
 const steps=new Map();
 for(const s of def.steps){
  assert.ok(ID.test(s.id)&&s.id.length<=40,'stable short step ID');
  assert.ok(!steps.has(s.id),'duplicate step identity');steps.set(s.id,s);
 }
 const visiting=new Set(),done=new Set();
 function visit(id){
  assert.ok(steps.has(id),'unknown prerequisite');assert.ok(!visiting.has(id),'cyclic prerequisite');
  if(done.has(id))return;visiting.add(id);
  const s=steps.get(id);assert.equal(new Set(s.requires).size,s.requires.length,'duplicate prerequisite');
  for(const required of s.requires){
   assert.notEqual(required,id,'self prerequisite');assert.ok(steps.has(required),'unknown prerequisite');
   assert.ok(s.optional||!steps.get(required).optional,'optional preparation cannot gate a required completion');
   visit(required);
  }
  visiting.delete(id);done.add(id);
 }
 for(const s of def.steps)visit(s.id);
 for(const id of def.enemy.spawnAfter){const s=steps.get(id);assert.ok(s&&!s.optional&&s.kind==='interact','spawn requires real required preparation');}
 assert.equal(new Set(def.enemy.spawnAfter).size,def.enemy.spawnAfter.length);
 const defeat=steps.get(def.enemy.defeatStep);assert.equal(defeat?.kind,'defeat');
 assert.deepEqual(sort(defeat.requires),sort(def.enemy.spawnAfter),'encounter and defeat share the same preparation gate');
 assert.equal(distance(defeat,def.enemy),0,'defeat anchor is the actual local enemy');
 if(def.enemy.openingBonusStep){const s=steps.get(def.enemy.openingBonusStep);assert.ok(s?.optional&&s.kind==='interact','opening extension is optional actual preparation');}
 return steps;
}
function physicalPath(def,a,b,r=.31){
 const room=W.definition(def.realm).room;
 assert.ok(W.walkable(room,a.x,a.z,r),'start must fit actual body');
 assert.ok(W.walkable(room,b.x,b.z,r),'destination must fit actual body');
 const route=C.pathfind(a,b,{id:room});assert.ok(route?.length,'production Core finds a physical path');
 let previous=a,length=0;
 for(const q of route){
  assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.z));
  assert.ok(W.segment(room,previous,q,r),'every production waypoint segment is legal against exact solids and patch union');
  length+=distance(previous,q);previous=q;
 }
 assert.ok(distance(previous,b)<1e-8,'path ends at the requested anchor');
 return {route,length};
}
function walk(sim,def,destination,speed=3.2){
 const room=W.definition(def.realm).room,start={...sim.state.player};
 const {route,length}=physicalPath(def,start,destination);
 const response=sim.moveTo(destination.x,destination.z);assert.ok(response.ok,response.error);
 assert.deepEqual(sim.playerPath,route,'accepted production moveTo uses the checked path');
 // This is an isolated movement fixture, not a real-RAF combat/escort claim.
 // Production advance follows the production path; combat and social clocks
 // are deliberately absent so catalogue topology can be tested independently.
 let frames=0;
 while(sim.playerPath.length&&frames<30000){
  const previous={...sim.state.player};sim.advance(sim.state.player,sim.playerPath,1/30,speed);frames++;
  assert.ok(W.segment(room,previous,sim.state.player),'actual incremental movement remains on supported clear ground');
 }
 assert.ok(frames<30000,'bounded movement reaches the destination');
 assert.ok(distance(sim.state.player,destination)<.002,'actual player arrives at interaction/return anchor');
 return {length,frames,seconds:frames/30};
}
function scene(def){
 const sim=new C.Simulation();sim.room=W.definition(def.realm).room;
 sim.state.player={...W.definition(def.realm).entry};return sim;
}

test('north trails: exact frozen catalogue contract and distinct persistent namespaces',()=>{
 assert.equal(definitions.length,2);assert.deepEqual(definitions.map(d=>d.realm),['heaven','hell']);
 assert.deepEqual(definitions.map(d=>d.id),['heaven-broken-choir-v1','hell-open-cage-v1']);
 assert.strictEqual(globalThis.RealmTrailsNorth.definitions,definitions);deepFrozen(globalThis.RealmTrailsNorth);
 for(const def of definitions){
  keys(def,['id','realm','title','summary','danger','giver','reward','completionText','steps','enemy',...(def.realm==='hell'?['escort']:[])]);
  assert.ok(ID.test(def.id)&&def.id.length<=50);assert.ok(def.title&&def.summary&&def.danger&&def.completionText);
  assert.match(def.summary,/provisional/);assert.match(def.summary,/Accept .* explicitly/);
  assert.match(def.summary,/once-only fee/);assert.match(def.summary,/claimed from/);
  assert.match(def.danger,/road home.*free|free road home/);
  // The completion paragraph is shown only after the explicit once-only claim.
  // It must name the actual paid terms, rather than inviting another payout.
  const payer=def.giver.name.split(' · ')[0];
  assert.ok(def.completionText.includes(`${payer} has paid the declared ${def.reward.xp} XP, ${def.reward.coins} coins and ${def.reward.ore} ore`));
  assert.doesNotMatch(def.completionText,/Claim the declared/);
  keys(def.giver,['id','name','x','z']);assert.ok(def.giver.name);
  const old=W.definition(def.realm),person=old.points.find(p=>p.id===def.giver.id);
  assert.equal(person?.kind,'person');assert.equal(distance(person,def.giver),0,'same existing giver, no resident replacement');
  keys(def.reward,['xp','coins','ore']);for(const v of Object.values(def.reward))assert.ok(Number.isSafeInteger(v)&&v>=0&&v<=35);
  assert.notEqual(def.id,old.quest.id);assert.notEqual(def.enemy.id,old.quest.id);
  assert.ok(!(old.enemies||[]).some(e=>e.id===def.enemy.id),'story never respawns the opening survey enemy identity');
  for(const s of def.steps){
   keys(s,['id','name','kind','x','z','y','medium','requires','optional','text']);
   assert.ok(s.name&&s.text.length>=90);assert.ok(['interact','defeat','escort'].includes(s.kind));
   assert.ok([s.x,s.z,s.y].every(Number.isFinite));assert.equal(s.y,FLOOR);assert.equal(s.medium,'dry');
   assert.ok(Array.isArray(s.requires));assert.equal(typeof s.optional,'boolean');
   assert.ok(!old.quest.objectives.some(o=>o.id===s.id),'no survey observation backfill by step ID');
  }
  keys(def.enemy,['id','name','kind','x','z','hp','damage','spawnAfter','defeatStep',...(def.realm==='heaven'?['openingBonusStep']:[])]);
  assert.ok(ID.test(def.enemy.id)&&def.enemy.name);assert.equal(def.enemy.kind,'sentinel');
  assert.equal(def.enemy.hp,90);assert.equal(def.enemy.damage,9);assert.ok([def.enemy.x,def.enemy.z].every(Number.isFinite));
  graph(def);
 }
 assert.deepEqual(byRealm('heaven').reward,{xp:30,coins:12,ore:2});
 assert.deepEqual(byRealm('hell').reward,{xp:35,coins:14,ore:3});
 assert.notEqual(byRealm('heaven').enemy.id,byRealm('hell').enemy.id);
});

test('Heaven: three independent relay actions, optional real opening and post-defeat physical repair',()=>{
 const d=byRealm('heaven'),steps=graph(d);
 assert.equal(d.steps.length,6);assert.equal(d.steps.filter(s=>s.optional).length,1);
 assert.deepEqual(d.enemy.spawnAfter,['relay-west','relay-east','relay-crown']);
 for(const id of d.enemy.spawnAfter){assert.equal(steps.get(id).kind,'interact');assert.deepEqual(steps.get(id).requires,[]);}
 const spillway=steps.get(d.enemy.openingBonusStep);assert.equal(spillway.id,'spillway');assert.deepEqual(spillway.requires,[]);
 assert.match(spillway.text,/0\.8 seconds/);assert.match(d.danger,/outside recovery do not damage/);
 const repair=steps.get('garden-repair');assert.equal(repair.kind,'interact');assert.deepEqual(repair.requires,['disable-core']);
 assert.equal(d.steps.some(s=>s.kind==='escort'),false);assert.ok(!('escort' in d));
 assert.match(d.completionText,/summit.*remain ahead/);
});

test('Hell: all route safety is required; actual ally arrival follows separate defeat and explicit invitation',()=>{
 const d=byRealm('hell'),steps=graph(d);
 assert.equal(d.steps.length,7);assert.equal(d.steps.filter(s=>s.optional).length,0);
 assert.deepEqual(d.enemy.spawnAfter,['contact-neris','cooling','clamp-west','clamp-east']);
 assert.deepEqual(steps.get('cooling').requires,['contact-neris']);
 for(const id of['clamp-west','clamp-east'])assert.deepEqual(steps.get(id).requires,['contact-neris','cooling']);
 assert.ok(!('openingBonusStep' in d.enemy));
 keys(d.escort,['startStep','arrivalStep','route','name','waitDistance','speed']);
 assert.equal(d.escort.name,'Neris');assert.equal(d.escort.waitDistance,10);assert.equal(d.escort.speed,2.5);
 const start=steps.get(d.escort.startStep),arrival=steps.get(d.escort.arrivalStep);
 assert.equal(start.kind,'interact');assert.deepEqual(start.requires,[...d.enemy.spawnAfter,d.enemy.defeatStep]);
 assert.equal(arrival.kind,'escort');assert.deepEqual(arrival.requires,[start.id]);
 assert.equal(distance(d.escort.route[0],start),0);assert.equal(distance(d.escort.route.at(-1),arrival),0);
 assert.equal(distance(steps.get('contact-neris'),start),0,'invitation returns to the real witness anchor');
 assert.match(arrival.text,/Neris herself/);assert.match(arrival.text,/Your arrival alone cannot/);
 assert.match(start.text,/explicit assisted-extraction fallback/);assert.match(d.danger,/never pretend she walked/);
 assert.match(d.completionText,/Safety is not a verdict/);assert.match(d.completionText,/allegiance.*remain unresolved/);
 const old=W.definition('hell').enemies.find(e=>e.id==='hell-salvage-sentinel');
 assert.ok(distance(old,d.enemy)>70,'new Reeve is outside the old optional salvage pocket');
 for(const p of d.escort.route){keys(p,['x','z']);assert.ok([p.x,p.z].every(Number.isFinite));}
});

test('graph guard detects cycles, unknown prerequisites, optional completion gates and encounter mismatch',()=>{
 const bad=edit=>{const d=structuredClone(byRealm('heaven'));edit(d);return()=>graph(d);};
 assert.throws(bad(d=>{d.steps.find(s=>s.id==='relay-west').requires=['garden-repair'];}),/cyclic prerequisite/);
 assert.throws(bad(d=>{d.steps.find(s=>s.id==='relay-east').requires=['missing-step'];}),/unknown prerequisite/);
 assert.throws(bad(d=>{d.steps.find(s=>s.id==='garden-repair').requires.push('spillway');}),/optional preparation cannot gate/);
 assert.throws(bad(d=>{d.enemy.spawnAfter.pop();}),/encounter and defeat share/);
 assert.throws(bad(d=>{d.enemy.openingBonusStep='relay-west';}),/opening extension is optional/);
 assert.throws(bad(d=>{d.steps.push({...d.steps[0]});}),/duplicate step identity/);
});

for(const def of definitions){
 test(def.realm+': production ground, exact collision and navigation provide every action a giver/home return',()=>{
  const world=W.definition(def.realm),home=world.points.find(p=>p.kind==='return');
  const anchors=[def.giver,...def.steps,def.enemy,...(def.escort?.route||[])];
  let legs=0,waypoints=0;
  for(const p of anchors){
   assert.equal(W.height(world.room,p.x,p.z),FLOOR);
   // A .7-radius envelope additionally checks that the interaction and its
   // approach are not jammed into a wall by the default .31-radius body.
   assert.ok(W.walkable(world.room,p.x,p.z,.7),'comfortable supported action anchor: '+(p.id||'escort waypoint'));
   for(const [a,b]of[[world.entry,p],[def.giver,p],[p,def.giver],[p,home]]){
    const route=physicalPath(def,a,b);legs++;waypoints+=route.route.length;
   }
  }
  assert.equal(legs,anchors.length*4);assert.ok(waypoints>=legs);
 });
 test(def.realm+': production accepted movement physically walks ordered work and freely returns home',()=>{
  const sim=scene(def),world=W.definition(def.realm),home=world.points.find(p=>p.kind==='return');
  const before=JSON.stringify({adventure:sim.state.adventure,journeys:sim.state.journeys,residents:sim.state.residents});
  walk(sim,def,def.giver);
  for(const s of def.steps)walk(sim,def,s);
  walk(sim,def,def.giver);walk(sim,def,home);
  assert.equal(JSON.stringify({adventure:sim.state.adventure,journeys:sim.state.journeys,residents:sim.state.residents}),before,'navigation neither grants work nor alters canonical people/property');
 });
}

test('Hell: supported escorted macro route uses a real culvert detour and remains within Refuge at its endpoint',()=>{
 const def=byRealm('hell'),world=W.definition('hell'),sim=scene(def),route=def.escort.route;
 walk(sim,def,route[0]);let length=0,frames=0;
 for(let i=1;i<route.length;i++){const result=walk(sim,def,route[i],def.escort.speed);length+=result.length;frames+=result.frames;}
 assert.ok(length>150&&length<165,'bounded full rescue return route');
 assert.ok(frames/30>60&&frames/30<67,'route length is consistent with declared 2.5 speed');
 assert.equal(W.segment(world.room,route[2],route[3]),false,'direct interpolation would cross the real culvert');
 const detour=physicalPath(def,route[2],route[3]);assert.ok(detour.route.length>1,'production route goes around physical cover');
 assert.ok(distance(sim.state.player,def.giver)<4,'arrival is beside Istra inside the real Refuge');
 assert.ok(sim.state.player.x>-20&&sim.state.player.x<0&&sim.state.player.z>10&&sim.state.player.z<28);
 const home=world.points.find(p=>p.kind==='return');walk(sim,def,home);
});

test('catalogue is deterministic inert data in browser and CommonJS hosts, with no save/scene/reward effects',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/realm-trails-north.js'),'utf8');
 const load=commonJS=>{
  const touched=[];
  const trap=name=>new Proxy(function(){touched.push(name);throw Error('catalogue touched '+name);},{get(){touched.push(name);throw Error('catalogue touched '+name);}});
  const preserved={adventure:{xp:19,coins:8,ore:2,owned:{blade:'fixture-only'}},journeys:{version:1},resident:'protected-fixture'};
  const sandbox={localStorage:trap('storage'),document:trap('DOM'),fetch:trap('network'),require:trap('dependency'),RealmCore:trap('core'),RealmAdventure:trap('adventure'),sim:structuredClone(preserved)};
  if(commonJS)sandbox.module={exports:{}};
  const context=vm.createContext(sandbox);vm.runInContext(source,context,{timeout:1000});
  assert.deepEqual(touched,[]);assert.deepEqual(sandbox.sim,preserved);
  assert.equal(JSON.stringify(context.RealmTrailsNorth.definitions),JSON.stringify(definitions));
  if(commonJS)assert.strictEqual(context.module.exports,context.RealmTrailsNorth);
  vm.runInContext("'use strict'; if (!Object.isFrozen(RealmTrailsNorth.definitions[0].steps[0].requires)) throw Error('mutable');",context);
  assert.throws(()=>vm.runInContext("'use strict'; RealmTrailsNorth.definitions[0].reward.xp++;",context),/read only|readonly|Cannot assign/);
  return JSON.stringify(context.RealmTrailsNorth.definitions);
 };
 assert.equal(load(false),load(true));assert.equal(load(false),load(false));
});


// This helper earns both real weapon variants and Briar through commands and
// production paths/combat. Accelerated CPU ticks, in-memory saver and omitted
// renderer construction are explicit: no native, storage or human-feel claim.
const GuideAdventure=require('../src/adventure.js'),GuideTrails=require('../src/realm-trails.js');
const guideEarnedRaw=new Map();let guideSerial=0;
function earnedGuideRaw(bow=false){
 if(guideEarnedRaw.has(bow))return structuredClone(guideEarnedRaw.get(bow));
 const J=require('./realm_trails_journey.cjs'),S=require('../src/sandbox.js'),h=J.createHarness();J.earnedKit(h,bow);
 function sb(type,payload={}){const r=h.sim.sandboxCommand('guide-earn-'+(++guideSerial),type,payload);assert.ok(r.ok,r.error);}
 for(const id of ['timber-1','timber-2','stone-1','stone-2']){
  const n=S.NODES.find(n=>n.id===id);h.walk(n.x+1.1,n.z);let wait=0;
  while(!h.sim.state.sandbox.nodes.find(q=>q.id===id).hp&&wait++<400)h.tick(.5);
  assert.ok(wait<400,'genuine resource regeneration bounded');
  while(h.sim.state.sandbox.nodes.find(q=>q.id===id).hp){sb('gather',{node:id});h.tick(.55);}
 }
 h.walk(11,9);sb('craft',{recipe:'pick'});sb('craft',{recipe:'plank'});sb('craft',{recipe:'plank'});
 h.walk(0,-21.3);sb('bridge');h.walk(0,-48);h.command('enter');h.walk(0,4);h.command('dig',{gx:0,gz:1});h.tick(.5);h.command('dig',{gx:0,gz:1});
 h.walk(-4,3.3);h.command('target-select',{id:'briar-1'});h.command('auto-toggle');let frames=0;
 while(!h.sim.state.adventure.defeated.includes('briar-1')&&frames++<600){
  const s=h.sim.state.adventure,r=GuideAdventure.runtime(h.sim);
  if(s.hp<65&&s.tonics&&s.elapsed>=r.cooldowns.heal)h.command('heal');h.tick(.05);assert.ok(s.hp>0);
 }
 assert.ok(frames<600,'actual weapon earns threat clearance');h.command('auto-toggle');h.walk(-8,2);h.command('rescue');
 h.walk(0,11);h.command('leave');h.walk(0,3);h.command('rest');h.walk(W.GATE.x,W.GATE.z);
 assert.equal(h.sim.state.adventure.companion.bonded,true);assert.equal(require('../src/arsenal.js').weapon(h.sim.state.adventure).style,bow?'bow':'blade');
 const raw=h.sim.snapshot();guideEarnedRaw.set(bow,structuredClone(raw));return raw;
}
function earnedGuideScene(bow=false){
 const raw=earnedGuideRaw(bow),sim=new C.Simulation(raw,{hydrated:true});let saved=null,serial=0;
 const save=candidate=>{saved=C.validate(candidate);return{ok:true};},ctx=()=>({sim,active:'guide-cpu-earned',revision:++serial});
 const preview=W.preview(ctx(),'heaven');assert.ok(preview.ok,preview.error);
 // Ticket context terms are stable through the original enter transaction.
 const context={sim,active:'guide-cpu-earned',revision:serial};assert.ok(W.enter(preview.ticket,context,{save,build:()=>{}}).ok);
 const move=(x,z)=>{assert.ok(sim.moveTo(x,z).ok);let n=0;while(sim.playerPath.length&&n++<3000){const old={...sim.state.player};sim.tick(.05);assert.ok(W.segment(sim.room,old,sim.state.player));}assert.ok(n<3000);};
 const d=byRealm('heaven');move(d.giver.x,d.giver.z);assert.ok(GuideTrails.command(ctx(),'accept',{quest:d.id},{save}).ok);GuideAdventure.syncScene(sim);
 return {sim,d,save,ctx,move,get saved(){return saved;}};
}
test('Briar Heaven guide projects only the existing accepted unfinished optional spillway without mutation',()=>{
 const h=earnedGuideScene(),before=JSON.stringify(h.sim.snapshot());
 assert.equal(typeof GuideTrails.companionGuide,'function','missing finite guide projection');
 assert.deepEqual(GuideTrails.companionGuide(h.sim),{quest:'heaven-broken-choir-v1',step:'spillway',name:'Set Yselle’s service spillway',x:25,z:-15});
 assert.equal(JSON.stringify(h.sim.snapshot()),before);
 const r=h.sim.state.realmTrails.records[h.d.id];r.steps.push('spillway');assert.equal(GuideTrails.companionGuide(h.sim),null);
});
test('Briar Heaven guide earned blade and bow walk bounded supported short leads and arrival never operates or pays',()=>{
 for(const bow of [false,true]){
  const h=earnedGuideScene(bow),s=h.sim;assert.ok(s.adventureCommand('guide-earned-'+bow,'companion-guide').ok);
  const c=GuideAdventure.runtime(s).companion,baseline=structuredClone(s.snapshot()),player={...s.state.player};
  for(let i=0;i<160;i++){const old={x:c.x,z:c.z};s.tick(.05);assert.ok(W.segment(s.room,old,c));}
  assert.ok(c.guide&&c.guide.waiting,'fox waits for the actual player');assert.ok(distance(c,s.state.player)<=4.2,'bounded lead');assert.deepEqual(s.state.player,player);
  assert.deepEqual(s.playerPath,[]);const waited={x:c.x,z:c.z};for(let i=0;i<80;i++)s.tick(.05);assert.deepEqual({x:c.x,z:c.z},waited,'no creeping beyond leash');
  let frames=0,maxLead=0;
  while(c.guide&&frames++<6000){
   if(frames%8===1)assert.ok(s.moveTo(c.x,c.z).ok,'player chooses ordinary legal follower route');
   const p={...s.state.player},f={x:c.x,z:c.z};s.tick(.05);assert.ok(W.segment(s.room,p,s.state.player));assert.ok(W.segment(s.room,f,c));maxLead=Math.max(maxLead,distance(c,s.state.player));
  }
  assert.ok(frames<6000&&distance(c,{x:25,z:-15})<.7,'actual guide reaches the existing handle');assert.ok(maxLead<=4.2);assert.equal(c.guide,null);
  const after=s.snapshot();for(const k of ['realmTrails','journal','nextEvent','journeys'])assert.deepEqual(after[k],baseline[k],k+' cannot be earned by arrival');
  for(const k of ['coins','ore','xp','revision','receipts','owned','equipment','arsenal','companion','defeated','drops'])assert.deepEqual(after.adventure[k],baseline.adventure[k],k+' guide movement preserves');
  assert.equal(after.realmTrails.records[h.d.id].steps.includes('spillway'),false);
  console.log(JSON.stringify({cpuGuideVariant:bow?'command-earned-bow':'command-earned-blade',frames,maximumLeadMetres:maxLead,arrival:{x:c.x,z:c.z},journalBefore:baseline.nextEvent,journalAfter:after.nextEvent,guideArrivalPaid:false,browserPersistence:false,nativeRAF:false}));
  h.move(25,-15);assert.ok(GuideTrails.command(h.ctx(),'step',{quest:h.d.id,step:'spillway'},{save:h.save}).ok);
  assert.equal(GuideTrails.command(h.ctx(),'step',{quest:h.d.id,step:'spillway'},{save:h.save}).duplicate,true,'physical step still once-only');
  assert.equal(s.state.realmTrails.records[h.d.id].steps.includes('spillway'),true);
  const beforeReturn=structuredClone(s.snapshot());assert.ok(W.leave(s).ok);assert.deepEqual(s.state.player,s.returnPos??beforeReturn.player); // snapshot stores the legitimate exterior return.
  assert.deepEqual(s.state.realmTrails,beforeReturn.realmTrails);assert.equal(s.room,null);
 }
});
test('Briar Heaven guide actual UI offers only eligible intent and closes ordinary menu before command',()=>{
 for(const wasPaused of [false,true]){
 const h=earnedGuideScene(),s=h.sim;
 const context={RealmAdventure:GuideAdventure,RealmTrails:GuideTrails,RealmCore:C,RealmArsenal:globalThis.RealmArsenal,RealmCombat:globalThis.RealmCombat,RealmSandbox:globalThis.RealmSandbox,RealmBeacon:globalThis.RealmBeacon};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/rpg-ui.js'),'utf8'),context);
 const ui=Object.create(context.RealmRPGUI.RPGUI.prototype);
 ui.dialog={open:true,close(){this.open=false;}};ui.wasPaused=wasPaused;s.paused=true;
 for(const k of ['wildSigns','earthHomecoming','cosmosCampaign','atlantisCampaign','heavenCampaign','hellCampaign','community','civic','expedition','trails','worlds','realmAtlas','gathering','earth','cosmos','classes','characters','starter','crossing','pursuit'])ui[k]={action(){return false;},reset(){}};
 ui.api={sim:()=>s,clearKeys(){},focusWorld(){},adventure(){return{run:(type,payload)=>s.adventureCommand('guide-ui-'+(++guideSerial),type,payload)}}};
 assert.match(ui.companion(),/data-rpg="companion-guide"/,'actual rendered companion action');
 const before=JSON.stringify(s.snapshot());ui.action({dataset:{rpg:'companion-guide'}});assert.equal(ui.dialog.open,false);assert.equal(s.paused,wasPaused);
 if(wasPaused){assert.equal(GuideAdventure.runtime(s).companion.guide??null,null,'preexisting P pause refuses');assert.equal(JSON.stringify(s.snapshot()),before);}else{assert.ok(GuideAdventure.runtime(s).companion.guide,'actual dispatch accepts normal unpaused command');assert.doesNotMatch(ui.companion(),/data-rpg="companion-guide"/,'no second concurrent request');}
 }
});
test('Briar Heaven guide original optional handle alone grants the conditional recovery extension and cannot claim unfinished work',()=>{
 for(const prepared of [false,true]){
  const h=earnedGuideScene(),s=h.sim;
  if(prepared){h.move(25,-15);assert.ok(GuideTrails.command(h.ctx(),'step',{quest:h.d.id,step:'spillway'},{save:h.save}).ok);}
  for(const [id,x,z] of [['relay-west',-8,-88],['relay-east',8,-88],['relay-crown',0,-102]]){h.move(x,z);assert.ok(GuideTrails.command(h.ctx(),'step',{quest:h.d.id,step:id},{save:h.save}).ok);}
  const enemy=GuideTrails.enemies(s).find(e=>e.id==='heaven-choir-core-v1');assert.ok(enemy);assert.equal(enemy.recovery,prepared?2.6:1.8);
  const before=JSON.stringify(s.snapshot());assert.equal(GuideTrails.command(h.ctx(),'claim',{quest:h.d.id},{save:h.save}).ok,false);assert.equal(JSON.stringify(s.snapshot()),before,'unfinished claim preserves all facts');
  assert.equal(s.state.realmTrails.records[h.d.id].claimed,false);
 }
});
