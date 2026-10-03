/* Southern owner and finite fitting regressions. Positions, boundary balances
 * and the returning history below are labelled synthetic fixtures. Initial kit,
 * travel consent, trail actions, claims, crafting and fitting use production
 * commands. Storage is an in-memory Store, not native browser persistence.
 */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),W=require('../src/world-foundations.js');
const R=require('../src/realm-trails.js'),RC=require('../src/realm-craft.js'),S=require('../src/sandbox.js');
const AR=require('../src/arsenal.js'),Q=require('../src/starter.js'),H=require('../src/pursuit.js'),Characters=require('../src/characters.js');
const copy=structuredClone,success={save:()=>({ok:true})};let serial=0;
const ctx=sim=>({sim,active:'labelled-trail-unit-character',revision:0});
const definition=realm=>R.definitions().find(d=>d.realm===realm);
function kit(){const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('trail-unit-kit-'+(++serial),'start').ok);return sim;}
function enter(realm,sim=kit()){
 assert.equal(sim.room,null);sim.state.player={...W.GATE,yaw:0};const preview=W.preview(ctx(sim),realm);assert.ok(preview.ok,preview.error);
 const result=W.enter(preview.ticket,ctx(sim),{save:()=>({ok:true}),build:()=>{}});assert.ok(result.ok,result.error);return sim;
}
function pose(sim,p){
 sim.state.player={x:p.x,z:p.z,yaw:0};
 if(p.medium==='water'||p.medium==='court')sim.worldDive={y:p.y,hold:true,surface:{x:8,z:-16,yaw:0}};
 else delete sim.worldDive;
}
const action=(sim,d,type,payload={},io=success)=>R.command(ctx(sim),type,{quest:d.id,...payload},io);
function accept(sim,d=definition(W.definition(sim.room).id),io=success){pose(sim,{...d.giver,medium:'dry'});return action(sim,d,'accept',{},io);}
function ready(realm='earthlands'){
 const sim=enter(realm),d=definition(realm);assert.ok(accept(sim,d).ok);
 for(const step of d.steps){pose(sim,step);const result=action(sim,d,'step',{step:step.id,choice:step.correctChoice});assert.ok(result.ok,result.error);}
 pose(sim,{...d.giver,medium:'dry'});return{sim,d};
}
function paidEarth(){const{sim,d}=ready();assert.ok(action(sim,d,'claim').ok);assert.ok(W.leave(sim).ok);sim.state.player={x:11,z:9,yaw:0};A.syncScene(sim);return sim;}
function unchanged(sim,run){const before=copy(sim.state),result=run();assert.equal(result.ok,false,result.text);assert.deepEqual(sim.state,before);return result;}
function memory(world){
 const data=new Map([[C.KEY,JSON.stringify(world)]]);let writes=0;
 return{data,get writes(){return writes;},getItem:k=>data.get(k)??null,setItem(k,v){writes++;data.set(k,v);}};
}
function bow(sim){assert.ok(sim.adventureCommand('trail-unit-bow-'+(++serial),'arsenal-craft',{id:'trail_bow'}).ok);return sim;}

test('adventure 10 and missing optional trails preserve all ten XP boundaries and source input',()=>{
 const boundaries=[0,29,30,79,80,149,150,259,260,9999],levels=[1,1,2,2,3,3,4,4,5,5];
 for(let i=0;i<boundaries.length;i++){
  const raw=kit().snapshot();raw.adventure.version=10;delete raw.adventure.realmCraft;delete raw.realmTrails;
  raw.adventure.xp=boundaries[i];raw.notes=[{text:'Synthetic returning notebook',day:1}];raw.score.title='A kept melody';raw.retreat.wall='rose';
  const before=copy(raw),out=C.validate(raw);assert.deepEqual(raw,before,'migration cannot mutate its source');
  assert.equal(C.VERSION,9);assert.equal(out.adventure.version,12);assert.equal(out.adventure.xp,boundaries[i]);assert.equal(A.level(out.adventure),levels[i]);
  assert.deepEqual(out.realmTrails,R.fresh());assert.deepEqual(out.adventure.realmCraft,RC.fresh());
  const originalAdventure=copy(raw.adventure),migratedAdventure=copy(out.adventure);delete originalAdventure.version;delete migratedAdventure.version;delete migratedAdventure.realmCraft;assert.deepEqual(migratedAdventure,originalAdventure);
  for(const key of Object.keys(raw).filter(k=>k!=='adventure'))assert.deepEqual(out[key],raw[key],key);
 }
});
test('current/future schemas refuse missing fields, foreign steps and impossible histories',()=>{
 const base=kit().snapshot(),id=definition('earthlands').id;
 const mutations=[
  w=>w.adventure.version=A.VERSION+1,w=>delete w.adventure.realmCraft,w=>w.adventure.realmCraft.version=2,
  w=>w.adventure.realmCraft.weapon='travel_coat',w=>w.adventure.realmCraft.weapon='dawn_edge',
  w=>w.realmTrails.version=2,w=>delete w.realmTrails.records[id],w=>w.realmTrails.records.foreign={},
  w=>w.realmTrails.records[id].steps=['foreign-step'],w=>w.realmTrails.records[id].steps=['fallen-bough','fallen-bough'],
  w=>{w.realmTrails.records[id].accepted=true;w.realmTrails.records[id].steps=['road-pack'];},
  w=>w.realmTrails.records[id].claimed=true,w=>w.realmTrails.records[id].checkpoint=1,
  w=>w.realmTrails.records[id].assisted=true,w=>w.realmTrails.records[id].escortMode='wait'
 ];
 for(const field of['accepted','claimed','assisted','steps','checkpoint','escortMode'])mutations.push(w=>delete w.realmTrails.records[id][field]);
 for(const mutate of mutations){const raw=copy(base);mutate(raw);const before=copy(raw);assert.throws(()=>C.validate(raw));assert.deepEqual(raw,before);}
});
test('trail acceptance and realm fitting require their cross-owner earned histories on import',()=>{
 const raw=C.fresh();raw.realmTrails.records[definition('earthlands').id].accepted=true;assert.throws(()=>C.validate(raw));
 const equipped=kit().snapshot();equipped.adventure.realmCraft={version:1,weapon:'trail_blade'};assert.throws(()=>C.validate(equipped),/realm fitting without earned trail/);
});
test('acceptance requires the kit, correct realm, physical giver and living dry character',()=>{
 const d=definition('earthlands'),bare=enter('earthlands',new C.Simulation());pose(bare,{...d.giver,medium:'dry'});unchanged(bare,()=>action(bare,d,'accept'));
 const sim=enter('earthlands');pose(sim,{x:0,z:55,medium:'dry'});unchanged(sim,()=>action(sim,d,'accept'));
 pose(sim,{...d.giver,medium:'dry'});sim.state.adventure.hp=0;unchanged(sim,()=>action(sim,d,'accept'));sim.state.adventure.hp=100;
 unchanged(sim,()=>action(sim,definition('atlantis'),'accept'));
 sim.worldDive={y:-1.4,hold:true,surface:{...sim.state.player}};unchanged(sim,()=>action(sim,d,'accept'));delete sim.worldDive;
 const original=copy(sim.state.journeys);assert.ok(action(sim,d,'accept').ok);assert.deepEqual(sim.state.journeys,original);assert.equal(sim.state.adventure.classPath.choice,null);
 const paidState=copy(sim.state);let saves=0;const repeat=action(sim,d,'accept',{}, {save:()=>{saves++;return{ok:true};}});assert.equal(repeat.duplicate,true);assert.equal(saves,0);assert.deepEqual(sim.state,paidState);
});
test('malformed transient XZ and depth cannot qualify a physical trail action',()=>{
 const d=definition('earthlands');for(const value of[NaN,Infinity,-Infinity]){
  const sim=enter('earthlands');pose(sim,{...d.giver,medium:'dry'});sim.state.player.x=value;let saves=0;
  unchanged(sim,()=>action(sim,d,'accept',{}, {save:()=>{saves++;return{ok:true};}}));assert.equal(saves,0);
 }
 const a=enter('atlantis'),at=definition('atlantis');assert.ok(accept(a,at).ok);const gauge=at.steps[0];
 for(const value of[NaN,Infinity,-Infinity]){pose(a,gauge);a.worldDive.y=value;unchanged(a,()=>action(a,at,'step',{step:gauge.id}));}
});
test('accept/step refusal from throwing or unavailable persistence changes no live state',()=>{
 for(const save of[()=>({ok:false,error:'labelled quota refusal'}),()=>{throw Error('labelled write failure');}]){
  const sim=enter('earthlands'),d=definition('earthlands');pose(sim,{...d.giver,medium:'dry'});unchanged(sim,()=>action(sim,d,'accept',{}, {save}));
  assert.ok(accept(sim,d).ok);pose(sim,d.steps[0]);unchanged(sim,()=>action(sim,d,'step',{step:d.steps[0].id},{save}));
 }
});
test('supply preparation is physical, dependency-checked and grants nothing before claim',()=>{
 const sim=enter('earthlands'),d=definition('earthlands');pose(sim,d.steps[0]);unchanged(sim,()=>action(sim,d,'step',{step:d.steps[0].id}));assert.ok(accept(sim,d).ok);
 pose(sim,d.steps[3]);unchanged(sim,()=>action(sim,d,'step',{step:'road-pack'}));const materials=copy(sim.state.sandbox.inventory),balances=[sim.state.adventure.xp,sim.state.adventure.coins,sim.state.adventure.ore];
 for(const step of[d.steps[2],d.steps[0],d.steps[1],d.steps[3]]){pose(sim,step);assert.ok(action(sim,d,'step',{step:step.id}).ok);}
 assert.deepEqual(sim.state.sandbox.inventory,materials);assert.deepEqual([sim.state.adventure.xp,sim.state.adventure.coins,sim.state.adventure.ore],balances);assert.equal(sim.state.realmTrails.records[d.id].claimed,false);
 const state=copy(sim.state);let saves=0;assert.equal(action(sim,d,'step',{step:'road-pack'},{save:()=>{saves++;return{ok:true};}}).duplicate,true);assert.equal(saves,0);assert.deepEqual(sim.state,state);
});
test('wet readings need actual depth/body medium and cannot be recorded on the overhead deck',()=>{
 const sim=enter('atlantis'),d=definition('atlantis');assert.ok(accept(sim,d).ok);const gauge=d.steps[0];
 pose(sim,{...gauge,medium:'dry'});unchanged(sim,()=>action(sim,d,'step',{step:gauge.id}));
 pose(sim,gauge);sim.worldDive.y=gauge.y-.5;unchanged(sim,()=>action(sim,d,'step',{step:gauge.id}));
 pose(sim,gauge);sim.state.player.z=gauge.z+3;unchanged(sim,()=>action(sim,d,'step',{step:gauge.id}));
 pose(sim,gauge);assert.equal(W.divingStatus(sim,[8,3,-22]).camera,'air');assert.ok(action(sim,d,'step',{step:gauge.id}).ok,'camera above water cannot veto the actual wet character');
 const lower=d.steps[1];pose(sim,lower);sim.state.player.z=-30.7;assert.equal(W.divingStatus(sim,[8,-2,-30.7]).body,'air');unchanged(sim,()=>action(sim,d,'step',{step:lower.id}));
});
test('Bellglass chart works in the actual air court and wrong choices are costless refusals',()=>{
 const sim=enter('atlantis'),d=definition('atlantis'),chart=d.steps[2];assert.ok(accept(sim,d).ok);pose(sim,chart);unchanged(sim,()=>action(sim,d,'step',{step:chart.id,choice:chart.correctChoice}));
 for(const step of d.steps.slice(0,2)){pose(sim,step);assert.ok(action(sim,d,'step',{step:step.id}).ok);}
 pose(sim,chart);assert.equal(W.divingStatus(sim,[12,-1.8,-35]).body,'air');assert.equal(W.divingStatus(sim,[12,-1.8,-35]).camera,'water');
 for(const choice of[undefined,'one-flat-line','erase-old-road','unknown'])unchanged(sim,()=>action(sim,d,'step',{step:chart.id,choice}));
 assert.ok(action(sim,d,'step',{step:chart.id,choice:chart.correctChoice}).ok);const marker=d.steps[3];pose(sim,marker);assert.ok(action(sim,d,'step',{step:marker.id}).ok);
 pose(sim,{...d.giver,medium:'dry'});assert.ok(action(sim,d,'claim').ok);assert.equal(sim.state.realmTrails.records[d.id].claimed,true);
});
test('each material slot and currency limit refuses the whole declared claim, then exact capacity succeeds',()=>{
 for(const [key,n]of Object.entries(definition('earthlands').reward.materials)){
  const{sim,d}=ready();sim.state.sandbox.inventory[key]=S.MAX-n+1;unchanged(sim,()=>action(sim,d,'claim'));assert.equal(sim.state.realmTrails.records[d.id].claimed,false);
  sim.state.sandbox.inventory[key]=S.MAX-n;assert.ok(action(sim,d,'claim').ok);assert.equal(sim.state.sandbox.inventory[key],S.MAX);
 }
 const e=ready();e.sim.state.adventure.coins=9990;unchanged(e.sim,()=>action(e.sim,e.d,'claim'));e.sim.state.adventure.coins=9989;assert.ok(action(e.sim,e.d,'claim').ok);assert.equal(e.sim.state.adventure.coins,9999);
 const a=ready('atlantis');a.sim.state.adventure.ore=9998;unchanged(a.sim,()=>action(a.sim,a.d,'claim'));a.sim.state.adventure.ore=9997;assert.ok(action(a.sim,a.d,'claim').ok);assert.equal(a.sim.state.adventure.ore,9999);
});
test('claim validates/saves the full paid candidate before applying it and retains live owner objects',()=>{
 const{sim,d}=ready(),before=copy(sim.state),adv=sim.state.adventure,sandbox=sim.state.sandbox;let saves=0,persisted;
 const result=action(sim,d,'claim',{}, {save(candidate){saves++;assert.deepEqual(sim.state,before);assert.equal(candidate.realmTrails.records[d.id].claimed,true);for(const[k,n]of Object.entries(d.reward.materials))assert.equal(candidate.sandbox.inventory[k],before.sandbox.inventory[k]+n);persisted=copy(candidate);return{ok:true};}});
 assert.ok(result.ok);assert.equal(saves,1);assert.equal(sim.state.adventure,adv);assert.equal(sim.state.sandbox,sandbox);assert.deepEqual(sim.snapshot(),persisted);
 for(const save of[()=>({ok:false,error:'labelled refusal'}),()=>{throw Error('labelled quota');}]){const r=ready();unchanged(r.sim,()=>action(r.sim,r.d,'claim',{}, {save}));assert.equal(r.sim.state.realmTrails.records[r.d.id].claimed,false);}
});
test('claim clamps XP at 9999 without replacing the retained five-level curve',()=>{
 for(const realm of['earthlands','atlantis']){const{sim,d}=ready(realm);sim.state.adventure.xp=9999;assert.ok(action(sim,d,'claim').ok);assert.equal(sim.state.adventure.xp,9999);assert.equal(A.level(sim.state.adventure),5);}
});
test('partial, ready and paid records survive snapshot/reload without accepting or paying again',()=>{
 const sim=enter('earthlands'),d=definition('earthlands');assert.ok(accept(sim,d).ok);pose(sim,d.steps[0]);assert.ok(action(sim,d,'step',{step:d.steps[0].id}).ok);
 let cold=new C.Simulation(sim.snapshot());assert.equal(cold.room,null);assert.deepEqual(cold.state.realmTrails.records[d.id].steps,['fallen-bough']);enter('earthlands',cold);
 for(const step of d.steps.slice(1)){pose(cold,step);assert.ok(action(cold,d,'step',{step:step.id}).ok);}
 cold=new C.Simulation(cold.snapshot());assert.equal(cold.state.realmTrails.records[d.id].claimed,false);enter('earthlands',cold);pose(cold,{...d.giver,medium:'dry'});assert.ok(action(cold,d,'claim').ok);
 const paid=copy(cold.state.realmTrails.records[d.id]),inventory=copy(cold.state.sandbox.inventory);cold=new C.Simulation(cold.snapshot());enter('earthlands',cold);pose(cold,{...d.giver,medium:'dry'});let saves=0;
 assert.equal(action(cold,d,'accept').duplicate,true);assert.equal(action(cold,d,'claim',{}, {save:()=>{saves++;return{ok:true};}}).duplicate,true);assert.equal(saves,0);assert.deepEqual(cold.state.realmTrails.records[d.id],paid);assert.deepEqual(cold.state.sandbox.inventory,inventory);
});
test('a real in-memory character Store makes quota refusal atomic and pays one saved entitlement',()=>{
 const{sim,d}=ready(),m=memory(sim.snapshot()),store=new Characters.Store(m);store.load();store.writer=true;const bytes=m.getItem(C.KEY),before=copy(sim.state),revision=store.revision;
 const original=m.setItem;m.setItem=()=>{throw Error('labelled Store quota');};unchanged(sim,()=>action(sim,d,'claim',{}, {save:candidate=>store.save(candidate)}));assert.equal(m.getItem(C.KEY),bytes);assert.equal(store.revision,revision);assert.deepEqual(sim.state,before);
 m.setItem=original;assert.ok(action(sim,d,'claim',{}, {save:candidate=>store.save(candidate)}).ok);assert.equal(m.writes,1);
 const loaded=new Characters.Store(m).load().state;assert.equal(loaded.realmTrails.records[d.id].claimed,true);assert.deepEqual(loaded.sandbox.inventory,sim.state.sandbox.inventory);assert.deepEqual(loaded.adventure,sim.state.adventure);
});
test('a missing saver refuses claim and fitting without recording a false durable success',()=>{
 const{sim,d}=ready();unchanged(sim,()=>action(sim,d,'claim',{},{}));assert.equal(sim.state.realmTrails.records[d.id].claimed,false);
 const fit=paidEarth();fit.state.adventure.ore=3;fit.state.adventure.coins=8;unchanged(fit,()=>RC.command(ctx(fit),'trail_blade',{}));assert.deepEqual(fit.state.adventure.realmCraft,RC.fresh());
});
test('managed Store writer and changed-source refusals preserve the complete unpaid trail',()=>{
 for(const mode of['writer','source']){
  const{sim,d}=ready(),m=memory(sim.snapshot()),store=new Characters.Store(m);const loaded=store.load();store.writer=true;
  let result=store.command('create',{visitor:{name:'Synthetic companion slot',skin:1,cloak:1,hair:1}},loaded.state,store.revision);assert.ok(result.ok);
  result=store.command('switch',{id:'character-1'},result.state,store.revision);assert.ok(result.ok);
  if(mode==='writer')store.writer=false;
  else{const external=JSON.parse(m.getItem(Characters.KEY));external.revision++;m.data.set(Characters.KEY,JSON.stringify(external));}
  const bytes=m.getItem(Characters.KEY),revision=store.revision,writes=m.writes;
  unchanged(sim,()=>R.command({sim,active:store.active,revision:store.revision},'claim',{quest:d.id},{save:candidate=>store.save(candidate)}));
  assert.equal(m.getItem(Characters.KEY),bytes);assert.equal(store.revision,revision);assert.equal(m.writes,writes);assert.equal(sim.state.realmTrails.records[d.id].claimed,false);
 }
});
test('independent character worlds keep trail claims and the fitting entitlement separate',()=>{
 const first=paidEarth(),m=memory(first.snapshot()),store=new Characters.Store(m);const loaded=store.load();store.writer=true;
 let result=store.command('create',{visitor:{name:'Synthetic second character',skin:2,cloak:3,hair:1}},loaded.state,store.revision);assert.ok(result.ok,result.error);
 assert.equal(Object.values(result.state.realmTrails.records).some(r=>r.claimed),false);assert.deepEqual(result.state.adventure.realmCraft,RC.fresh());const second=copy(result.state);
 result=store.command('switch',{id:'character-1'},result.state,store.revision);assert.ok(result.ok);assert.equal(result.state.realmTrails.records[definition('earthlands').id].claimed,true);
 result=store.command('switch',{id:'character-2'},result.state,store.revision);assert.ok(result.ok);assert.deepEqual(result.state,second);
});
test('a fitting requires claimed work, an outdoor bench, life, an owned weapon and complete cost',()=>{
 const locked=kit();locked.state.adventure.ore=3;locked.state.adventure.coins=8;unchanged(locked,()=>RC.command(ctx(locked),'trail_blade',success));
 for(const mutate of[
  s=>s.state.player={x:0,z:0,yaw:0},s=>s.room='world-earthlands',s=>s.worldDive={y:-1.4},s=>s.state.adventure.hp=0,
  s=>s.state.adventure.ore=2,s=>s.state.adventure.coins=7
 ]){const sim=paidEarth();sim.state.adventure.ore=3;sim.state.adventure.coins=8;mutate(sim);unchanged(sim,()=>RC.command(ctx(sim),'trail_blade',success));}
 for(const weapon of['unknown','travel_coat','dawn_edge',null,'__proto__']){const sim=paidEarth();sim.state.adventure.ore=3;sim.state.adventure.coins=8;unchanged(sim,()=>RC.command(ctx(sim),weapon,success));}
});
test('finite fitting spends only after persistence and adds exactly three to the selected equipped blade',()=>{
 const sim=paidEarth();sim.state.adventure.ore=3;sim.state.adventure.coins=8;const before=copy(sim.state),stats=A.stats(sim.state.adventure),weapon=AR.weapon(sim.state.adventure);let saved;
 unchanged(sim,()=>RC.command(ctx(sim),'trail_blade',{save:()=>({ok:false,error:'labelled refusal'})}));unchanged(sim,()=>RC.command(ctx(sim),'trail_blade',{save:()=>{throw Error('labelled quota');}}));
 assert.ok(RC.command(ctx(sim),'trail_blade',{save(candidate){assert.deepEqual(sim.state,before);saved=copy(candidate);return{ok:true};}}).ok);
 assert.deepEqual(sim.snapshot(),saved);assert.equal(sim.state.adventure.ore,0);assert.equal(sim.state.adventure.coins,0);assert.deepEqual(sim.state.adventure.equipment,before.adventure.equipment);assert.deepEqual(AR.weapon(sim.state.adventure),weapon);assert.deepEqual(A.stats(sim.state.adventure),{...stats,attack:stats.attack+3});
 unchanged(sim,()=>RC.command(ctx(sim),'trail_blade',success));
});
test('fitting an unequipped canonical bow never equips it and the one global spend excludes another weapon',()=>{
 const sim=bow(paidEarth());sim.state.adventure.ore=3;sim.state.adventure.coins=8;const equipped=copy(sim.state.adventure.equipment),stats=A.stats(sim.state.adventure),sockets=copy(sim.state.adventure.arsenal.sockets);
 assert.ok(RC.command(ctx(sim),'trail_bow',success).ok);assert.deepEqual(sim.state.adventure.equipment,equipped);assert.deepEqual(sim.state.adventure.arsenal.sockets,sockets);assert.deepEqual(A.stats(sim.state.adventure),stats);assert.equal(RC.bonus(sim.state.adventure,'trail_bow'),3);assert.equal(RC.bonus(sim.state.adventure,'trail_blade'),0);
 sim.state.adventure.ore=3;sim.state.adventure.coins=8;unchanged(sim,()=>RC.command(ctx(sim),'trail_blade',success));assert.ok(sim.adventureCommand('trail-unit-equip-'+(++serial),'equip',{id:'trail_bow'}).ok);assert.equal(A.stats(sim.state.adventure).attack,4+(A.level(sim.state.adventure)-1)*2+AR.GEAR.trail_bow.attack+3);
});
test('returning finite starter/river work, ruby, pinned project, banked XP and weapon behavior survive fitting',()=>{
 const sim=paidEarth(),a=sim.state.adventure;
 // Synthetic valid returning-history fixture, not an earned veteran journey.
 a.xp=9999;a.defeated.push('river-old-bristle');a.starter={version:1,accepted:true,bundles:Q.BUNDLES.map(b=>b.id),reward:{choice:'temper',weapon:'trail_blade'}};
 a.pursuit.fittings.trail_blade=2;a.pursuit.pinned='trail_blade';a.arsenal.sockets.trail_blade='ruby';a.ore=3;a.coins=8;
 assert.doesNotThrow(()=>C.validate(sim.snapshot()));const before=copy(a),stats=A.stats(a),weapon=AR.weapon(a),identity=a;
 assert.ok(RC.command(ctx(sim),'trail_blade',success).ok);assert.equal(sim.state.adventure,identity);assert.equal(a.xp,9999);assert.equal(A.level(a),5);assert.equal(Q.bonus(a,'trail_blade'),2);assert.equal(H.bonus(a,'trail_blade'),4);assert.equal(a.arsenal.sockets.trail_blade,'ruby');
 assert.deepEqual(a.starter,before.starter);assert.deepEqual(a.pursuit,before.pursuit);assert.deepEqual(a.arsenal,before.arsenal);assert.deepEqual(a.equipment,before.equipment);assert.deepEqual(AR.weapon(a),weapon);assert.deepEqual(A.stats(a),{...stats,attack:stats.attack+3});
 const cold=new C.Simulation(sim.snapshot());assert.deepEqual(cold.state.adventure.realmCraft,{version:1,weapon:'trail_blade'});assert.deepEqual(A.stats(cold.state.adventure),A.stats(a));
});

// Independent review reproduced an off-realm formatter crash. These are actual
// accepted travel states with a minimal, explicitly synthetic UI host.
test('accepted Atlantis pages are readable at home and from another realm after cold reload',()=>{
 require('../src/realm-trails-ui.js');const sim=enter('atlantis'),d=definition('atlantis');assert.ok(accept(sim,d).ok);assert.ok(W.leave(sim).ok);
 const reader=Object.create(global.RealmTrailsUI.TrailsUI.prototype);reader.rpg={sim};reader.reading=null;
 assert.match(reader.page('atlantis'),/Read the upper visitor gauge/);
 const loaded=new C.Simulation(sim.snapshot());reader.rpg.sim=loaded;assert.match(reader.page('atlantis'),/Bellglass/);
 loaded.state.player={...W.GATE,yaw:0};assert.ok(W.enter(W.preview(ctx(loaded),'earthlands').ticket,ctx(loaded),{save:()=>({ok:true}),build:()=>{}}).ok);
 assert.match(reader.page('atlantis'),/F ascends/);assert.equal(reader.rpg.sim.state.realmTrails.records[d.id].accepted,true);
});
