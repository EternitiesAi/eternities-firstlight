'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),Q=require('../src/starter.js');
let serial=0;
const act=(s,t,p={})=>s.adventureCommand('pursuit-test-'+(++serial),t,p);
const frozen=s=>JSON.stringify(s.snapshot());
const H=()=>globalThis.RealmPursuit;
// Labelled unit boundaries use direct placement/vitals. The separate journey earns every action.
function kit(){const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};assert.ok(act(s,'start').ok);return s;}
function home(s){if(s.room)s.leave();s.state.player={x:11,z:9,yaw:0};A.syncScene(s);return s;}
function enter(s){s.state.player={x:15,z:7,yaw:0};assert.ok(act(s,'starter-enter').ok);return s;}
function start(s=kit()){const r=act(s,'pursuit-start',{after:s.state.adventure.pursuit?.claimed||0});assert.ok(r.ok,r.error);return s;}
function finish(s=start()){
 enter(s);for(const e of [...A.runtime(s).enemies])if(e.contractRun)A.damageEnemy(s,e,e.hp);
 const run=s.state.adventure.pursuit.active.id;
 for(const p of H().SAMPLES){s.state.player={...p,yaw:0};assert.ok(act(s,'pursuit-sample',{run,id:p.id}).ok);}
 return home(s);
}
function paid(s=start()){finish(s);assert.ok(act(s,'pursuit-claim',{run:s.state.adventure.pursuit.active.id}).ok);return s;}

test('explicit survey acceptance uses kit and the next expected sequence',()=>{
 const s=kit();const r=act(s,'pursuit-start',{after:0});assert.ok(r.ok,r.error);
 assert.equal(s.state.adventure.pursuit.active.id,'riverbank-survey/1');
 assert.equal(s.state.adventure.starter.accepted,false);assert.equal(s.state.adventure.reward,null);
 const before=frozen(s);assert.equal(act(s,'pursuit-start',{after:0}).ok,false);assert.equal(frozen(s),before);
});
test('older saves acquire empty project data without changing XP or creative work',()=>{
 for(const xp of [0,29,30,79,80,149,150,259,260,9999]){
  const raw=kit().snapshot();delete raw.adventure.pursuit;raw.adventure.xp=xp;raw.notes=[{text:'my melody stays',day:1}];raw.score.title='A kept tune';
  const before=JSON.stringify(raw),s=C.validate(raw);assert.equal(s.adventure.xp,xp);assert.equal(A.level(s.adventure),[1,1,2,2,3,3,4,4,5,5][[0,29,30,79,80,149,150,259,260,9999].indexOf(xp)]);
  assert.deepEqual(s.adventure.pursuit,{version:1,pinned:null,claimed:0,active:null,fittings:{}});
  for(const k of Object.keys(raw.adventure))assert.deepEqual(s.adventure[k],raw.adventure[k],k);
  for(const k of Object.keys(raw))if(k!=='adventure')assert.deepEqual(s[k],raw[k],k);assert.equal(JSON.stringify(raw),before);
 }
});
test('a pin is a persisted attainable choice, not ownership or campaign consent',()=>{
 const s=kit(),a=s.state.adventure,owned=[...a.owned];assert.ok(act(s,'pursuit-pin',{weapon:'copper_bow'}).ok);
 assert.equal(new C.Simulation(s.snapshot()).state.adventure.pursuit.pinned,'copper_bow');assert.deepEqual(a.owned,owned);assert.equal(a.reward,null);
 for(const weapon of ['dawn_edge','travel_coat','__proto__','missing']){const before=frozen(s);assert.equal(act(s,'pursuit-pin',{weapon}).ok,false);assert.equal(frozen(s),before);}
 assert.ok(act(s,'pursuit-pin',{weapon:null}).ok);assert.equal(a.pursuit.pinned,null);
});
test('guide projects real craft sources and honest comparisons for an unowned weapon',()=>{
 const s=kit(),a=s.state.adventure;assert.ok(act(s,'pursuit-pin',{weapon:'copper_blade'}).ok);
 const q=H().recipe(a,'copper_blade');assert.equal(q.type,'forge');assert.equal(q.ore,4);assert.equal(q.coins,4);
 const bow=H().catalogue(a).find(q=>q.id==='copper_bow');assert.equal(bow.source.requires,'trail_bow');assert.deepEqual(bow.source.materials,{plank:2});
 const c=H().compare(a,'copper_bow');assert.equal(c.current.attack,16);assert.equal(c.next.attack,21);assert.equal(c.afterWeapon.style,'bow');assert.equal(c.afterWeapon.cooldown,.75);assert.equal(c.afterWeapon.stamina,6);
 assert.equal(H().catalogue(a).find(q=>q.id==='dawn_edge').pinnable,false);
});

test('next-step preview resolves the Ashwood prerequisite separately from the longbow target',()=>{
 const s=kit(),a=s.state.adventure,before=frozen(s),q=H().nextStep(a,'copper_bow');
 assert.equal(q.weapon,'trail_bow');assert.equal(q.prerequisite,true);assert.equal(q.recipe.id,'craft:trail_bow');
 assert.deepEqual(q.recipe.materials,{wood:6,fiber:4,stone:2});assert.equal(q.recipe.ore,0);assert.equal(q.recipe.coins,0);
 assert.equal(q.current.attack,16);assert.equal(q.after.attack,13);assert.equal(H().compare(a,'copper_bow').selected.attack,21);
 assert.deepEqual(q.beforeWeapon,AR.weapon(a));assert.equal(q.afterWeapon.style,'bow');assert.equal(q.afterWeapon.cooldown,.75);assert.equal(q.afterWeapon.reach,11);assert.equal(q.afterWeapon.stamina,6);
 assert.equal(q.after.defense,1);assert.equal(q.after.maxHP,100);assert.equal(q.socket,null);assert.equal(frozen(s),before);
});

test('each prerequisite and target preview matches the actual craft then deliberate equip',()=>{
 const s=kit(),a=s.state.adventure,inv=s.state.sandbox.inventory;inv.wood=6;inv.fiber=4;inv.stone=2;inv.plank=2;a.ore=4;a.coins=6;
 assert.ok(act(s,'pursuit-pin',{weapon:'copper_bow'}).ok);
 for(const weapon of ['trail_bow','copper_bow']){
  const before=frozen(s),q=H().nextStep(a,'copper_bow'),equipped=a.equipment.weapon;assert.equal(q.weapon,weapon);assert.equal(frozen(s),before);
  assert.ok(act(s,q.recipe.type,q.recipe.payload).ok);assert.equal(a.equipment.weapon,equipped);assert.equal(a.pursuit.pinned,'copper_bow');
  assert.ok(act(s,'equip',{id:q.weapon}).ok);assert.deepEqual(A.stats(a),q.after);assert.deepEqual(AR.weapon(a),q.afterWeapon);
 }
 assert.equal(a.owned.includes('trail_bow'),true);assert.equal(a.owned.includes('trail_blade'),true);assert.equal(A.stats(a).attack,21);
});

test('next-step forge and both finite fittings match accepted commands without spending during preview',()=>{
 const s=kit(),a=s.state.adventure;a.ore=13;a.coins=16;s.state.sandbox.inventory.fiber=6;
 for(const type of ['forge','pursuit-fit','pursuit-fit']){
  const before=frozen(s),q=H().nextStep(a,'copper_blade');assert.equal(q.recipe.type,type);assert.equal(q.weapon,'copper_blade');assert.equal(q.prerequisite,false);assert.equal(frozen(s),before);
  const old=a.equipment.weapon;assert.ok(act(s,q.recipe.type,q.recipe.payload).ok);assert.equal(a.equipment.weapon,old);assert.ok(act(s,'equip',{id:q.weapon}).ok);
  assert.deepEqual(A.stats(a),q.after);assert.deepEqual(AR.weapon(a),q.afterWeapon);
 }
 assert.equal(A.stats(a).attack,27);assert.equal(H().nextStep(a,'copper_blade'),null);assert.equal(a.ore,0);assert.equal(a.coins,0);assert.equal(s.state.sandbox.inventory.fiber,0);
});

test('unequipped bow fitting preview keeps distinct sockets, health and Oren temper',()=>{
 const s=kit(),a=s.state.adventure;a.owned.push('trail_bow');a.arsenal.sockets.trail_blade='moonstone';a.arsenal.sockets.trail_bow='ruby';
 a.starter.accepted=true;a.starter.bundles=Q.BUNDLES.map(b=>b.id);a.defeated.push('river-old-bristle');a.starter.reward={choice:'temper',weapon:'trail_bow'};a.ore=3;a.coins=4;s.state.sandbox.inventory.fiber=2;
 const before=frozen(s),q=H().nextStep(a,'trail_bow');assert.equal(q.currentSocket,'moonstone');assert.equal(q.socket,'ruby');assert.equal(q.current.maxHP,118);assert.equal(q.after.maxHP,100);assert.equal(q.after.attack,21);assert.equal(frozen(s),before);
 assert.ok(act(s,q.recipe.type,q.recipe.payload).ok);assert.equal(a.equipment.weapon,'trail_blade');assert.equal(A.stats(a).maxHP,118);
 assert.ok(act(s,'equip',{id:q.weapon}).ok);assert.deepEqual(A.stats(a),q.after);assert.deepEqual(a.arsenal.sockets,{trail_blade:'moonstone',trail_bow:'ruby'});
});

test('finished, uncraftable and invalid project IDs have no invented next step',()=>{
 const s=kit(),a=s.state.adventure;a.pursuit.fittings.trail_blade=2;const before=frozen(s);
 for(const id of ['trail_blade','dawn_edge','oren_reedbow','travel_coat','__proto__','toString','missing',null])assert.equal(H().nextStep(a,id),null,String(id));
 assert.equal(frozen(s),before);
});

test('repeated immutable next-step previews keep XP, all history, cost, vitals and selected socket unchanged',()=>{
 const s=paid(),a=s.state.adventure;a.arsenal.sockets.trail_blade='moonstone';const raw=structuredClone(a);
 function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}freeze(raw);
 const before=JSON.stringify(raw);for(let i=0;i<100;i++){const q=H().nextStep(raw,'copper_bow');assert.equal(q.after.maxHP,100);assert.equal(q.current.maxHP,118);assert.equal(q.socket,null);}
 assert.equal(JSON.stringify(raw),before);
});

test('Oren comparisons explicitly use current XP and do not project or award the separate XP reward',()=>{
 require('../src/starter-ui.js');const compare=globalThis.RealmStarterUI.StarterUI.prototype.compare;
 for(const xp of [0,29,30,79,80,149,150,259,260,9990,9999]){
  const s=kit(),a=s.state.adventure;a.xp=xp;const before=frozen(s),html=compare.call({a},'oren_sunblade','oren_sunblade');
  assert.match(html,/at your current XP/);assert.match(html,/separate 25 XP reward may also raise your level/);assert.equal(frozen(s),before);
 }
});
test('survey cannot be accepted remotely or before kit, and failed start is atomic',()=>{
 for(const s of [new C.Simulation(),kit()]){s.state.player={x:0,z:3,yaw:0};const before=frozen(s);assert.equal(act(s,'pursuit-start',{after:0}).ok,false);assert.equal(frozen(s),before);}
 const s=kit();for(const after of [undefined,-1,1,.1,'0']){const before=frozen(s);assert.equal(act(s,'pursuit-start',{after}).ok,false);assert.equal(frozen(s),before);}
});
test('survey temporarily owns encounters without replaying the once-only quest',()=>{
 const s=kit();assert.ok(act(s,'starter-accept').ok);const q=structuredClone(s.state.adventure.starter);start(s);enter(s);
 const enemies=A.runtime(s).enemies;assert.deepEqual(enemies.map(e=>e.id),['river-practice','riverbank-survey/1:west','riverbank-survey/1:east']);
 for(const p of [...enemies,...H().SAMPLES]){assert.ok(A.ground(s,p.x,p.z),p.id);assert.ok(C.pathfind(s.state.player,p,s.navRoom),p.id);}
 s.state.player={x:-7,z:3,yaw:0};assert.equal(act(s,'starter-pickup',{id:'river-rope'}).ok,false);
 home(s);paid(s);assert.deepEqual(s.state.adventure.starter,q);enter(s);assert.ok(A.runtime(s).enemies.some(e=>e.id==='river-old-bristle'));
});
test('accepted sample events require run identity, proximity and once-per-run ownership',()=>{
 const s=enter(start()),run=s.state.adventure.pursuit.active.id;
 for(const payload of [{run,id:'west-sample'},{run:'riverbank-survey/0',id:'west-sample'},{run,id:'wood'}]){const before=frozen(s);assert.equal(act(s,'pursuit-sample',payload).ok,false);assert.equal(frozen(s),before);}
 s.state.player={x:-7,z:3,yaw:0};const inv=structuredClone(s.state.sandbox.inventory);assert.ok(act(s,'pursuit-sample',{run,id:'west-sample'}).ok);assert.deepEqual(s.state.sandbox.inventory,inv);
 const before=frozen(s);assert.equal(act(s,'pursuit-sample',{run,id:'west-sample'}).ok,false);assert.equal(frozen(s),before);
 const cold=new C.Simulation(s.snapshot());assert.deepEqual(cold.state.adventure.pursuit.active.samples,['west-sample']);
});
test('actual defeat progresses the active run but creates no story defeat, cache or XP',()=>{
 const s=enter(start()),a=s.state.adventure,e=A.runtime(s).enemies.find(e=>e.objective==='west');
 A.damageEnemy(s,e,e.hp);A.damageEnemy(s,e,999);assert.deepEqual(a.pursuit.active.defeated,['west']);assert.deepEqual(a.defeated,[]);assert.deepEqual(a.drops,[]);assert.equal(a.xp,0);
 const cold=enter(new C.Simulation(s.snapshot()));assert.equal(A.runtime(cold).enemies.some(q=>q.objective==='west'),false);assert.equal(A.runtime(cold).enemies.find(q=>q.objective==='east').hp,56);
});
test('each deliberate completed run pays once, including after reload and receipt eviction',()=>{
 let s=paid(),a=s.state.adventure;assert.equal(a.pursuit.claimed,1);assert.equal(a.ore,3);assert.equal(a.coins,4);assert.equal(s.state.sandbox.inventory.fiber,2);
 s=new C.Simulation(s.snapshot());home(s);
 for(let i=0;i<105;i++)assert.ok(act(s,'pursuit-pin',{weapon:i%2?'trail_blade':'copper_blade'}).ok);
 for(const [type,p]of [['pursuit-claim',{run:'riverbank-survey/1'}],['pursuit-start',{after:0}]]){const before=frozen(s);assert.equal(act(s,type,p).ok,false);assert.equal(frozen(s),before);}
 start(s);assert.equal(s.state.adventure.pursuit.active.id,'riverbank-survey/2');paid(s);a=s.state.adventure;
 assert.equal(a.pursuit.claimed,2);assert.equal(a.ore,6);assert.equal(a.coins,8);assert.equal(s.state.sandbox.inventory.fiber,4);assert.equal(a.xp,0);
});
test('changed request IDs cannot claim an incomplete run or a stale entitlement',()=>{
 const s=start(),run=s.state.adventure.pursuit.active.id;let before=frozen(s);assert.equal(act(s,'pursuit-claim',{run}).ok,false);assert.equal(frozen(s),before);
 finish(s);assert.ok(act(s,'pursuit-claim',{run}).ok);start(s);before=frozen(s);assert.equal(act(s,'pursuit-claim',{run}).ok,false);assert.equal(frozen(s),before);
 enter(s);const e=A.runtime(s).enemies.find(e=>e.contractRun);const stale={...e,hp:0,contractRun:run};assert.equal(H().defeat(s,stale),false);assert.deepEqual(s.state.adventure.pursuit.active.defeated,[]);
});
for(const boundary of ['ore','coins','fiber'])test('full '+boundary+' refuses the entire claim and preserves earned entitlement',()=>{
 const s=finish(),a=s.state.adventure,inv=s.state.sandbox.inventory,run=a.pursuit.active.id;
 if(boundary==='fiber')inv.fiber=998;else a[boundary]=9998;const before=frozen(s);
 assert.equal(act(s,'pursuit-claim',{run}).ok,false);assert.equal(frozen(s),before);
 const cold=new C.Simulation(s.snapshot());home(cold);if(boundary==='fiber')cold.state.sandbox.inventory.fiber=997;else cold.state.adventure[boundary]=boundary==='ore'?9996:9995;
 assert.ok(act(cold,'pursuit-claim',{run}).ok);assert.equal(cold.state.adventure.pursuit.active,null);assert.equal(cold.state.adventure.pursuit.claimed,1);
});
test('finite fittings consume whole costs, keep equipped identity and preserve sockets',()=>{
 const s=kit(),a=s.state.adventure;a.ore=9;a.coins=12;s.state.sandbox.inventory.fiber=6;a.arsenal.sockets.trail_blade='ruby';
 const gear=structuredClone(a.equipment),socket=structuredClone(a.arsenal),w=AR.weapon(a),hp=a.hp;
 assert.equal(A.stats(a).attack,20);assert.ok(act(s,'pursuit-fit',{weapon:'trail_blade',step:1}).ok);assert.equal(A.stats(a).attack,22);
 assert.ok(act(s,'pursuit-fit',{weapon:'trail_blade',step:2}).ok);assert.equal(A.stats(a).attack,24);assert.equal(a.ore,0);assert.equal(a.coins,0);assert.equal(s.state.sandbox.inventory.fiber,0);
 assert.deepEqual(a.equipment,gear);assert.deepEqual(a.arsenal,socket);assert.deepEqual(AR.weapon(a),w);assert.equal(a.hp,hp);
 const before=frozen(s);for(const step of [1,2,3]){assert.equal(act(s,'pursuit-fit',{weapon:'trail_blade',step}).ok,false);assert.equal(frozen(s),before);}
 const cold=new C.Simulation(s.snapshot());assert.equal(A.stats(cold.state.adventure).attack,24);
});
test('invalid, distant, out-of-order and missing-cost fittings never partly spend materials',()=>{
 const s=kit(),a=s.state.adventure;a.ore=3;a.coins=4;s.state.sandbox.inventory.fiber=1;
 for(const payload of [{weapon:'trail_blade',step:1},{weapon:'trail_blade',step:2},{weapon:'dawn_edge',step:1},{weapon:'__proto__',step:1},{weapon:'travel_coat',step:1}]){const before=frozen(s);assert.equal(act(s,'pursuit-fit',payload).ok,false);assert.equal(frozen(s),before);}
 s.state.sandbox.inventory.fiber=2;s.state.player={x:0,z:3,yaw:0};const before=frozen(s);assert.equal(act(s,'pursuit-fit',{weapon:'trail_blade',step:1}).ok,false);assert.equal(frozen(s),before);
});
test('improving an unequipped bow never equips it or changes the equipped socket',()=>{
 const s=kit(),a=s.state.adventure;a.owned.push('trail_bow');a.ore=3;a.coins=4;s.state.sandbox.inventory.fiber=2;a.arsenal.sockets.trail_blade='moonstone';
 assert.ok(act(s,'pursuit-fit',{weapon:'trail_bow',step:1}).ok);assert.equal(a.equipment.weapon,'trail_blade');assert.equal(A.stats(a).attack,16);assert.equal(A.stats(a).maxHP,118);
 assert.ok(act(s,'equip',{id:'trail_bow'}).ok);assert.equal(A.stats(a).attack,15);assert.equal(AR.weapon(a).style,'bow');assert.equal(A.stats(a).maxHP,100);assert.equal(a.arsenal.sockets.trail_blade,'moonstone');
});
test('fittings affect both real damage paths and leave obstruction rules intact',()=>{
 for(const bow of [false,true]){const s=kit(),a=s.state.adventure,id=bow?'trail_bow':'trail_blade';if(bow)a.owned.push(id);a.equipment.weapon=id;a.ore=3;a.coins=4;s.state.sandbox.inventory.fiber=2;assert.ok(act(s,'pursuit-fit',{weapon:id,step:1}).ok);enter(s);s.state.player={x:-5,z:12,yaw:0};
  assert.ok(act(s,'attack',{target:'river-practice'}).ok);for(let i=0;i<5;i++)s.tick(.05);assert.equal(A.runtime(s).training.lastDamage,bow?15:18);
  s.state.player={x:-1,z:3,yaw:0};A.runtime(s).enemies.find(e=>e.id==='river-practice').x=-1;A.runtime(s).enemies.find(e=>e.id==='river-practice').z=-1;for(let i=0;i<20;i++)s.tick(.05);
  const hits=globalThis.RealmCombat.runtime(s).hits.length;assert.equal(act(s,'attack',{target:'river-practice'}).ok,false);assert.equal(globalThis.RealmCombat.runtime(s).hits.length,hits);
 }
});
test('present malformed ledgers refuse import instead of resetting paid history',()=>{
 const raw=paid().snapshot();for(const mutate of [p=>p.version=2,p=>p.claimed=-1,p=>p.claimed=.5,p=>p.pinned='missing',p=>p.fittings={trail_blade:3},p=>p.fittings={dawn_edge:1},p=>p.active={id:'riverbank-survey/1',terms:1,defeated:[],samples:[]},p=>p.active={id:'riverbank-survey/2',terms:99,defeated:[],samples:[]}]){
  const x=structuredClone(raw);mutate(x.adventure.pursuit);assert.throws(()=>C.validate(x));
 }
 const partial=start().snapshot();partial.adventure.pursuit.active.samples=['west-sample','west-sample'];assert.throws(()=>C.validate(partial));
});
