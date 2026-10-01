'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),T=require('../src/combat.js');
let serial=0;
const act=(s,type,p={})=>s.adventureCommand('starter-test-'+(++serial),type,p);
const step=(s,seconds)=>{for(let t=0;t<seconds;t+=.05)s.tick(.05);};
const snapshot=s=>JSON.stringify(s.snapshot());
function begun(){const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};assert.equal(act(s,'start').ok,true);return s;}
function accepted(){const s=begun();assert.equal(act(s,'starter-accept').ok,true);return s;}
function enter(s){s.state.player={x:15,z:7,yaw:0};assert.equal(act(s,'starter-enter').ok,true);return s;}
function returnOren(s){if(s.room)s.leave();s.state.player={x:11,z:9,yaw:0};A.syncScene(s);}
// Deliberate unit boundaries. The separate journey earns all movement/objectives.
function objectives(s=accepted()){
 enter(s);for(const q of globalThis.RealmStarter.BUNDLES){s.state.player={...q,yaw:0};assert.equal(act(s,'starter-pickup',{id:q.id}).ok,true);}
 const e=A.runtime(s).enemies.find(e=>e.id==='river-old-bristle');A.damageEnemy(s,e,e.hp);returnOren(s);return s;
}

test('new quest state is explicit, versioned and round trips',()=>{
 const s=A.fresh();assert.equal(A.VERSION,10);assert.deepEqual(s.starter,{version:1,accepted:false,bundles:[],reward:null});assert.deepEqual(A.validate(s),s);
});
test('version-five adventure migrates without altering existing campaign or creative data',()=>{
 const raw=new C.Simulation().snapshot();raw.adventure.version=5;delete raw.adventure.starter;raw.notes=[{text:'intact notebook',day:1}];raw.score.title='intact composition';
 const before=JSON.stringify(raw),out=C.validate(raw);assert.equal(out.adventure.version,10);assert.deepEqual(out.adventure.starter,A.fresh().starter);
 for(const k of Object.keys(raw))if(k!=='adventure')assert.deepEqual(out[k],raw[k],k);
 for(const k of Object.keys(raw.adventure))if(k!=='version')assert.deepEqual(out.adventure[k],raw.adventure[k],k);
 assert.equal(JSON.stringify(raw),before);
});
test('all banked XP boundaries retain XP and the existing five-level curve',()=>{
 for(const xp of [0,29,30,79,80,149,150,259,260,9999]){const a=A.fresh();a.version=5;delete a.starter;a.xp=xp;const out=A.validate(a);assert.equal(out.xp,xp);assert.equal(out.version,10);assert.equal(A.level(out),1+[30,80,150,260].filter(n=>xp>=n).length);}
});
test('acceptance requires kit and actual Oren proximity without campaign consent',()=>{
 const raw=new C.Simulation();raw.state.player={x:11,z:9,yaw:0};const before=snapshot(raw);assert.equal(act(raw,'starter-accept').ok,false);assert.equal(snapshot(raw),before);
 const s=begun();s.state.player={x:0,z:3,yaw:0};assert.equal(act(s,'starter-accept').ok,false);returnOren(s);assert.equal(act(s,'starter-accept').ok,true);
 assert.equal(s.state.adventure.reward,null);assert.equal(s.state.adventure.beacon.relic,'undecided');assert.equal(s.state.sandbox.bridge,false);assert.equal(s.state.adventure.crossing.met,false);
});
test('acceptance is one explicit event and survives cold reload',()=>{
 const s=accepted(),before=snapshot(s);assert.equal(act(s,'starter-accept').ok,false);assert.equal(snapshot(s),before);assert.equal(new C.Simulation(s.snapshot()).state.adventure.starter.accepted,true);
});
test('pre-acceptance pocket has no quest kills or pickups to backfill',()=>{
 const s=enter(begun());assert.equal(s.room,'riverbank');assert.deepEqual(A.runtime(s).enemies.map(e=>e.id),['river-practice']);
 s.state.player={x:-7,z:3,yaw:0};const before=snapshot(s);assert.equal(act(s,'starter-pickup',{id:'river-rope'}).ok,false);assert.equal(snapshot(s),before);
 returnOren(s);assert.equal(act(s,'starter-accept').ok,true);enter(s);assert.equal(A.runtime(s).enemies.filter(e=>e.kind!=='practice').length,3);
});
test('room dispatch and each objective use real collision-valid routes',()=>{
 const s=enter(accepted()),Q=globalThis.RealmStarter;assert.equal(A.combatScene(s),true);
 for(const p of [...Q.BUNDLES,...Q.ENEMIES,Q.PRACTICE,Q.ENTRY]){assert.equal(A.ground(s,p.x,p.z),true,p.id);assert.ok(C.pathfind(s.state.player,p,s.navRoom),p.id);}
 assert.equal(A.ground(s,200,200),false);assert.equal(AR.projectileGround(s,200,200),false);
});
test('each bundle is unique, proximity checked and never spends ordinary materials',()=>{
 const s=enter(accepted()),inv=JSON.stringify(s.state.sandbox.inventory);assert.equal(act(s,'starter-pickup',{id:'river-tools'}).ok,false);
 for(const q of globalThis.RealmStarter.BUNDLES){s.state.player={...q,yaw:0};assert.equal(act(s,'starter-pickup',{id:q.id}).ok,true);const before=snapshot(s);assert.equal(act(s,'starter-pickup',{id:q.id}).ok,false);assert.equal(snapshot(s),before);assert.deepEqual(new C.Simulation(s.snapshot()).state.adventure.starter.bundles,s.state.adventure.starter.bundles);}
 assert.equal(JSON.stringify(s.state.sandbox.inventory),inv);assert.equal(act(s,'starter-pickup',{id:'wood'}).ok,false);
});
test('named defeat can precede bundles and stays resolved after returning/re-entry',()=>{
 const s=enter(accepted()),Q=globalThis.RealmStarter,e=A.runtime(s).enemies.find(e=>e.id==='river-old-bristle');A.damageEnemy(s,e,e.hp);const xp=s.state.adventure.xp;A.damageEnemy(s,e,999);assert.equal(s.state.adventure.xp,xp);
 const cold=new C.Simulation(s.snapshot());enter(cold);assert.equal(A.runtime(cold).enemies.some(e=>e.id==='river-old-bristle'),false);
 for(const q of Q.BUNDLES){cold.state.player={...q,yaw:0};assert.equal(act(cold,'starter-pickup',{id:q.id}).ok,true);}assert.equal(Q.complete(cold.state.adventure),true);
});
test('incomplete, distant and unknown-reward turn-ins refuse atomically',()=>{
 const incomplete=accepted();let before=snapshot(incomplete);assert.equal(act(incomplete,'starter-claim',{choice:'oren_sunblade'}).ok,false);assert.equal(snapshot(incomplete),before);
 const s=objectives();s.state.player={x:0,z:3,yaw:0};before=snapshot(s);assert.equal(act(s,'starter-claim',{choice:'oren_sunblade'}).ok,false);assert.equal(snapshot(s),before);returnOren(s);before=snapshot(s);assert.equal(act(s,'starter-claim',{choice:'__proto__'}).ok,false);assert.equal(snapshot(s),before);
});
test('full currency capacity preserves every objective and reward for retry',()=>{
 const s=objectives();s.state.adventure.coins=9994;const before=snapshot(s);assert.equal(act(s,'starter-claim',{choice:'oren_sunblade'}).ok,false);assert.equal(snapshot(s),before);
 s.state.adventure.coins=9993;assert.equal(act(s,'starter-claim',{choice:'oren_sunblade'}).ok,true);assert.equal(s.state.adventure.coins,9999);
});
for(const choice of ['oren_sunblade','oren_reedbow'])test(choice+' is awarded once, deliberately equipped, and saved with correct mechanics',()=>{
 const s=objectives(),previous=s.state.adventure.equipment.weapon,xp=s.state.adventure.xp,coins=s.state.adventure.coins;
 assert.equal(act(s,'starter-claim',{choice}).ok,true);assert.equal(s.state.adventure.equipment.weapon,previous);assert.equal(s.state.adventure.xp,xp+25);assert.equal(s.state.adventure.coins,coins+6);
 const before=snapshot(s);assert.equal(act(s,'starter-claim',{choice}).ok,false);assert.equal(snapshot(s),before);
 assert.equal(act(s,'equip',{id:choice}).ok,true);const cold=new C.Simulation(s.snapshot());assert.equal(cold.state.adventure.equipment.weapon,choice);assert.deepEqual(cold.state.adventure.starter.reward,{choice,weapon:choice});
 const bow=choice==='oren_reedbow';assert.deepEqual(AR.weapon(cold.state.adventure),{style:bow?'bow':'blade',reach:bow?11:2.65,cooldown:bow?.75:.52,stamina:bow?6:0,primary:bow?'Loose arrow':'Sunstrike',special:bow?'Piercing light':'Dawn sweep'});
 assert.equal(act(cold,'starter-claim',{choice:'temper',weapon:choice}).ok,false);
});
test('single veteran temper preserves weapon identity, socket, cadence and health',()=>{
 const s=objectives(),a=s.state.adventure;a.owned.push('copper_bow');a.equipment={weapon:'copper_bow',armor:'travel_coat',charm:null};a.xp=9999;a.arsenal.sockets.copper_bow='ruby';
 const before=A.stats(a),weapon=AR.weapon(a),hp=a.hp;assert.equal(act(s,'starter-claim',{choice:'temper',weapon:'copper_bow'}).ok,true);
 assert.equal(A.stats(a).attack,before.attack+2);assert.equal(a.hp,hp);assert.equal(a.xp,9999);assert.equal(a.equipment.weapon,'copper_bow');assert.equal(a.arsenal.sockets.copper_bow,'ruby');assert.deepEqual(AR.weapon(a),weapon);
 const cold=new C.Simulation(s.snapshot());assert.equal(A.stats(cold.state.adventure).attack,before.attack+2);assert.equal(act(cold,'starter-claim',{choice:'temper',weapon:'trail_blade'}).ok,false);
});
test('temper refuses unknown, unowned and armor targets without a partial payout',()=>{
 const s=objectives();for(const weapon of ['unknown','dawn_edge','travel_coat','__proto__']){const before=snapshot(s);assert.equal(act(s,'starter-claim',{choice:'temper',weapon}).ok,false);assert.equal(snapshot(s),before);}
});
test('new bow really launches primary and piercing projectiles with costs and hit events',()=>{
 const s=objectives();act(s,'starter-claim',{choice:'oren_reedbow'});act(s,'equip',{id:'oren_reedbow'});enter(s);s.state.player={x:-5,z:12,yaw:0};
 const e=A.runtime(s).enemies.find(e=>e.id==='river-practice'),a=s.state.adventure,stamina=a.stamina;T.runtime(s).hits=[];
 assert.equal(act(s,'attack',{target:e.id}).ok,true);assert.equal(a.stamina,stamina-6);assert.equal(AR.runtime(s).arrows.length,1);assert.equal(T.runtime(s).hits.length,0);step(s,.2);assert.equal(T.runtime(s).hits.length,1);assert.equal(T.runtime(s).hits[0].n,A.stats(a).attack);
 const stamina2=a.stamina;assert.equal(act(s,'pulse',{target:e.id}).ok,true);assert.equal(a.stamina,stamina2-30);assert.equal(AR.runtime(s).arrows[0].special,true);step(s,.2);assert.equal(T.runtime(s).hits.length,2);
});
test('practice target supports blade and yields no XP, loot, coins or quest progress',()=>{
 const s=enter(accepted());s.state.player={x:-5,z:11.5,yaw:0};const a=s.state.adventure,before={xp:a.xp,coins:a.coins,defeated:[...a.defeated],quest:JSON.stringify(a.starter)};
 assert.equal(act(s,'attack',{target:'river-practice'}).ok,true);assert.equal(T.runtime(s).hits.length,1);assert.equal(a.xp,before.xp);assert.equal(a.coins,before.coins);assert.deepEqual(a.defeated,before.defeated);assert.equal(JSON.stringify(a.starter),before.quest);
});
test('new equipment keeps independent removable socket and validates after reload',()=>{
 const s=objectives();act(s,'starter-claim',{choice:'oren_reedbow'});s.state.adventure.arsenal.gems.ruby=1;
 assert.equal(act(s,'socket',{weapon:'oren_reedbow',gem:'ruby'}).ok,true);assert.equal(act(s,'equip',{id:'oren_reedbow'}).ok,true);const attack=A.stats(s.state.adventure).attack;
 assert.equal(new C.Simulation(s.snapshot()).state.adventure.arsenal.sockets.oren_reedbow,'ruby');assert.equal(act(s,'socket',{weapon:'oren_reedbow',gem:null}).ok,true);assert.equal(A.stats(s.state.adventure).attack,attack-4);
});
test('named tell locks aim and allows both a guarded hit and a movement response',()=>{
 for(const response of ['guard','move']){const s=enter(accepted()),e=A.runtime(s).enemies.find(e=>e.id==='river-old-bristle');s.state.player={x:e.x,z:e.z+1.2,yaw:Math.PI};A.runtime(s).invincible=0;step(s,.05);assert.equal(e.mode,'windup');assert.ok(e.timer>=1.2);const aim={...e.aim};
 if(response==='guard')assert.equal(act(s,'guard').ok,true);else{s.state.player={x:e.x+3,z:e.z+1.2,yaw:0};}
 const hp=s.state.adventure.hp;step(s,1.3);assert.equal(e.mode,'recover');assert.ok(e.timer>1.6);assert.deepEqual(e.aim,aim);assert.equal(s.state.adventure.hp,response==='guard'?hp-9:hp);}
});
test('save validation rejects impossible quest state and reward combinations',()=>{
 const base=objectives().snapshot();for(const mutate of [q=>q.version=99,q=>q.accepted=false,q=>q.bundles.push(q.bundles[0]),q=>q.bundles=['foreign'],q=>q.reward={choice:'temper',weapon:'travel_coat'},q=>q.reward={choice:'oren_sunblade',weapon:'trail_blade'}]){const raw=structuredClone(base);mutate(raw.adventure.starter);assert.throws(()=>C.validate(raw));}
});
