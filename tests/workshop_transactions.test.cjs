/* Real command handlers with labeled synthetic placements, balances and completed
 * objectives for refusal boundaries. The separate browser proof earns bow inputs. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),Chars=require('../src/characters.js');
const T=require('../src/workshop-transactions.js'),copy=structuredClone;
let serial=0;
function home(){
 const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('tx-kit-'+(++serial),'start').ok);
 Object.assign(sim.state.sandbox.inventory,{wood:12,fiber:12,stone:12,crystal:10,plank:8,berry:4});
 Object.assign(sim.state.adventure,{ore:30,coins:60,tonics:2});return sim;
}
function storage(sim){
 const map=new Map([[C.KEY,JSON.stringify(sim.snapshot())]]),modes={throw:false},adapter={getItem:k=>map.get(k)??null,setItem:(k,v)=>{if(modes.throw)throw Error('synthetic quota refusal');map.set(k,v);}};
 const store=new Chars.Store(adapter);assert.equal(store.load().status,'loaded');return{map,modes,store,io:{save:v=>store.save(v)}};
}
function run(sim,type,payload={},io={save:()=>({ok:true})},id='tx-'+(++serial),domain='adventure'){return T.command(sim,domain,id,type,payload,io);}
function exact(sim){return JSON.stringify(sim.state);}
function refuseRetry(sim,type,payload={},domain='adventure'){
 const s=storage(sim),before=exact(sim),durable=s.map.get(C.KEY),id='same-request-'+(++serial);s.modes.throw=true;
 const refused=run(sim,type,payload,s.io,id,domain);assert.equal(refused.ok,false);assert.match(refused.error,/synthetic quota/);assert.equal(exact(sim),before);assert.equal(s.map.get(C.KEY),durable);
 s.modes.throw=false;const accepted=run(sim,type,payload,s.io,id,domain);assert.ok(accepted.ok,accepted.error);assert.equal(accepted.duplicate,undefined);
 const after=exact(sim),saved=s.map.get(C.KEY),duplicate=run(sim,type,payload,{save:()=>{throw Error('duplicate must not save');}},id,domain);
 assert.ok(duplicate.ok);assert.ok(duplicate.duplicate);assert.equal(exact(sim),after);assert.equal(s.map.get(C.KEY),saved);assert.deepEqual(JSON.parse(saved),sim.snapshot());return{sim,s};
}
test('refused bow transaction preserves every live field and can retry one identical request',()=>{
 const sim=home(),before=copy(sim.state),{s}=refuseRetry(sim,'arsenal-craft',{id:'trail_bow'});
 assert.ok(sim.state.adventure.owned.includes('trail_bow'));assert.equal(sim.state.adventure.equipment.weapon,'trail_blade');
 assert.equal(sim.state.sandbox.inventory.wood,6);assert.equal(sim.state.sandbox.inventory.fiber,8);assert.equal(sim.state.sandbox.inventory.stone,10);
 for(const k of Object.keys(before).filter(k=>!['adventure','sandbox'].includes(k)))assert.deepEqual(sim.state[k],before[k]);
 assert.ok(new C.Simulation(JSON.parse(s.map.get(C.KEY))).state.adventure.owned.includes('trail_bow'));
});
test('sandbox craft saves materials, output, receipt and journal together',()=>{
 const sim=home();refuseRetry(sim,'craft',{recipe:'plank'},'sandbox');assert.equal(sim.state.sandbox.inventory.wood,10);assert.equal(sim.state.sandbox.inventory.plank,12);assert.equal(sim.state.sandbox.stats.crafted,1);assert.equal(sim.state.journal.at(-1).kind,'sandbox');
});
test('forge cannot spend ore or coins before a durable write',()=>{
 const sim=home();refuseRetry(sim,'forge');assert.equal(sim.state.adventure.ore,26);assert.equal(sim.state.adventure.coins,56);assert.ok(sim.state.adventure.owned.includes('copper_blade'));
});
test('socket replacement and removal preserve loose gems on refusal and return them exactly once',()=>{
 const sim=home();sim.state.adventure.arsenal.gems.ruby=1;sim.state.adventure.arsenal.gems.moonstone=1;
 refuseRetry(sim,'socket',{weapon:'trail_blade',gem:'ruby'});refuseRetry(sim,'socket',{weapon:'trail_blade',gem:'moonstone'});
 assert.deepEqual(sim.state.adventure.arsenal.gems,{ruby:1,moonstone:0,amber:0});assert.equal(sim.state.adventure.arsenal.sockets.trail_blade,'moonstone');
 refuseRetry(sim,'socket',{weapon:'trail_blade',gem:null});assert.deepEqual(sim.state.adventure.arsenal.gems,{ruby:1,moonstone:1,amber:0});assert.equal(sim.state.adventure.arsenal.sockets.trail_blade,undefined);
});
test('equipping preserves selected equipment on refusal and retains the live combat runtime',()=>{
 const sim=home();sim.state.adventure.owned.push('trail_bow');A.syncScene(sim);const runtime=A.runtime(sim),runtimeBefore=copy(runtime);
 sim.paused=true;const player=sim.state.player,path=sim.playerPath,runs=sim.runs,state=sim.state,adventure=sim.state.adventure,sandbox=sim.state.sandbox;
 refuseRetry(sim,'equip',{id:'trail_bow'});assert.equal(sim.state.adventure.equipment.weapon,'trail_bow');assert.equal(sim.paused,true);
 assert.equal(A.runtime(sim),runtime);assert.deepEqual(runtime,runtimeBefore);assert.equal(sim.state.player,player);assert.equal(sim.playerPath,path);assert.equal(sim.runs,runs);assert.equal(sim.state,state);assert.equal(sim.state.adventure,adventure);assert.equal(sim.state.sandbox,sandbox);
});
test('both finite field-guide fittings save exact costs and keep weapon identity, socket and equipment',()=>{
 const sim=home();sim.state.adventure.arsenal.sockets.trail_blade='ruby';const equipment=copy(sim.state.adventure.equipment),owned=copy(sim.state.adventure.owned);
 refuseRetry(sim,'pursuit-fit',{weapon:'trail_blade',step:1});refuseRetry(sim,'pursuit-fit',{weapon:'trail_blade',step:2});
 assert.equal(sim.state.adventure.ore,21);assert.equal(sim.state.adventure.coins,48);assert.equal(sim.state.sandbox.inventory.fiber,6);assert.equal(sim.state.adventure.pursuit.fittings.trail_blade,2);assert.deepEqual(sim.state.adventure.owned,owned);assert.deepEqual(sim.state.adventure.equipment,equipment);assert.equal(sim.state.adventure.arsenal.sockets.trail_blade,'ruby');
 const before=exact(sim);assert.equal(run(sim,'pursuit-fit',{weapon:'trail_blade',step:2}).ok,false);assert.equal(exact(sim),before);
});
for(const choice of ['oren_sunblade','oren_reedbow','temper'])test('explicit starter '+choice+' survives refusal and pays its one canonical reward',()=>{
 const sim=home(),a=sim.state.adventure;assert.ok(sim.adventureCommand('accept-'+(++serial),'starter-accept').ok);
 a.starter.bundles=global.RealmStarter.BUNDLES.map(b=>b.id);a.defeated.push('river-old-bristle');a.arsenal.sockets.trail_blade='ruby';
 const eq=copy(a.equipment);refuseRetry(sim,'starter-claim',choice==='temper'?{choice,weapon:'trail_blade'}:{choice});
 assert.equal(a.coins,66);assert.equal(a.xp,25);assert.deepEqual(a.equipment,eq);assert.equal(a.arsenal.sockets.trail_blade,'ruby');assert.deepEqual(a.starter.reward,{choice,weapon:choice==='temper'?'trail_blade':choice});
 const before=exact(sim);assert.equal(run(sim,'starter-claim',{choice:'temper',weapon:'trail_blade'}).ok,false);assert.equal(exact(sim),before);
});
test('completed survey payout is one atomic current-run ledger transition',()=>{
 const sim=home(),a=sim.state.adventure;assert.ok(sim.adventureCommand('accept-survey-'+(++serial),'pursuit-start',{after:0}).ok);
 a.pursuit.active.defeated=['west','east'];a.pursuit.active.samples=['west-sample','east-sample'];const id=a.pursuit.active.id;
 refuseRetry(sim,'pursuit-claim',{run:id});assert.equal(a.pursuit.claimed,1);assert.equal(a.pursuit.active,null);assert.equal(a.ore,33);assert.equal(a.coins,64);assert.equal(sim.state.sandbox.inventory.fiber,14);
 const before=exact(sim);assert.equal(run(sim,'pursuit-claim',{run:id}).ok,false);assert.equal(exact(sim),before);
});
function roadShop(){
 const sim=new C.Simulation(JSON.parse(fs.readFileSync(require.resolve('../examples/CHAPTER_COMPLETED_EARNED.json'))));
 sim.state.player={x:44,z:6,yaw:0};assert.ok(sim.adventureCommand('road-entry-'+(++serial),'road-enter').ok);
 const a=sim.state.adventure;a.road.revealed=['cart-latch'];a.road.claimed=['cart-latch'];a.defeated.push('road-prowler');sim.state.player={x:-10,z:12,yaw:0};a.ore=30;a.coins=60;a.tonics=2;sim.state.sandbox.inventory.berry=4;
 assert.ok(sim.adventureCommand('repair-'+(++serial),'cart-repair').ok);return sim;
}
for(const [offer,ore,coins,tonics,berry] of [['tonic',28,58,3,4],['mantle',28,42,2,4],['sell-copper',26,63,2,4],['sell-berries',28,61,2,2]])test('Tessa '+offer+' uses current road context and durably spends exactly one offer',()=>{
 const sim=roadShop(),player=sim.state.player,room=sim.room,returnPos=sim.returnPos;refuseRetry(sim,'trade',{offer});
 assert.equal(sim.state.adventure.ore,ore);assert.equal(sim.state.adventure.coins,coins);assert.equal(sim.state.adventure.tonics,tonics);assert.equal(sim.state.sandbox.inventory.berry,berry);assert.equal(sim.state.player,player);assert.equal(sim.room,room);assert.equal(sim.returnPos,returnPos);
 if(offer==='mantle')assert.ok(sim.state.adventure.owned.includes('courier_mantle'));
});
test('Bellweather bench uses actual local position while saving the home checkpoint',()=>{
 const sim=home();sim.room='crossing';sim.returnPos={x:18,z:6,yaw:.3};sim.state.player={x:-10,z:5,yaw:.8};
 const player=sim.state.player,returnPos=sim.returnPos;A.syncScene(sim);const runtime=A.runtime(sim),saved=[];
 assert.ok(run(sim,'forge',{}, {save:v=>{saved.push(copy(v));return{ok:true};}}).ok);assert.equal(saved[0].player.x,18);assert.equal(saved[0].player.z,6);assert.equal(sim.state.player,player);assert.equal(sim.returnPos,returnPos);assert.equal(sim.room,'crossing');assert.equal(A.runtime(sim),runtime);
});
test('source conflict leaves supplies and the other tab saved bytes intact',()=>{
 const sim=home(),s=storage(sim),before=exact(sim),other=JSON.parse(s.map.get(C.KEY));other.adventure.coins++;
 const foreign=JSON.stringify(other);s.map.set(C.KEY,foreign);const r=run(sim,'arsenal-craft',{id:'trail_bow'},s.io);
 assert.equal(r.ok,false);assert.match(r.error,/Another tab/);assert.equal(exact(sim),before);assert.equal(s.map.get(C.KEY),foreign);
});
test('managed character writer rejection keeps current character materials and receipts intact',()=>{
 const sim=home(),s=storage(sim);s.store.writer=true;assert.ok(s.store.command('create',{visitor:C.fresh().visitor},sim.snapshot(),0).ok);
 assert.ok(s.store.command('switch',{id:'character-1'},C.fresh(),s.store.revision).ok);const durable=s.map.get(Chars.KEY),before=exact(sim);s.store.writer=false;
 const r=run(sim,'arsenal-craft',{id:'trail_bow'},s.io);assert.equal(r.ok,false);assert.match(r.error,/cannot write/);assert.equal(exact(sim),before);assert.equal(s.map.get(Chars.KEY),durable);
});
test('thrown saver preserves the full live state and does not reserve the request identity',()=>{
 const sim=home(),before=exact(sim),id='throwing-save';assert.equal(run(sim,'arsenal-craft',{id:'trail_bow'},{save:()=>{throw Error('synthetic thrown saver');}},id).ok,false);assert.equal(exact(sim),before);
 assert.ok(run(sim,'arsenal-craft',{id:'trail_bow'},{save:()=>({ok:true})},id).ok);
});
test('rules refuse wrong benches, insufficient costs, invalid ownership and changed receipt terms before saving',()=>{
 const sim=home(),before=exact(sim),io={save:()=>{throw Error('refused command must not save');}};
 assert.equal(run(sim,'socket',{weapon:'dawn_edge',gem:'ruby'},io).ok,false);assert.equal(exact(sim),before);
 sim.state.player={x:0,z:3,yaw:0};let value=exact(sim);assert.equal(run(sim,'forge',{},io).ok,false);assert.equal(exact(sim),value);
 sim.state.player={x:11,z:9,yaw:0};sim.state.sandbox.inventory.wood=0;value=exact(sim);assert.equal(run(sim,'arsenal-craft',{id:'trail_bow'},io).ok,false);assert.equal(exact(sim),value);
 const another=home();assert.ok(run(another,'craft',{recipe:'plank'},{save:()=>({ok:true})},'reused','sandbox').ok);value=exact(another);assert.equal(run(another,'craft',{recipe:'block'},io,'reused','sandbox').ok,false);assert.equal(exact(another),value);
});
test('pause policies remain canonical and a saver is always required for a new successful action',()=>{
 const sim=home();sim.paused=true;const before=exact(sim);assert.equal(run(sim,'forge').ok,false);assert.equal(exact(sim),before);assert.equal(sim.paused,true);
 sim.paused=false;assert.equal(run(sim,'forge',{},{}).ok,false);assert.equal(exact(sim),before);
});
test('validation refusal keeps the exact live canonical state and prevents saving',()=>{
 const sim=home();sim.state.sandbox.stats.crafted=100000000;const before=exact(sim);let saves=0;
 const r=run(sim,'craft',{recipe:'plank'},{save:()=>{saves++;return{ok:true};}},'over-limit','sandbox');assert.equal(r.ok,false);assert.equal(saves,0);assert.equal(exact(sim),before);
});
test('only the reviewed state-only economic and finite Earth-story names are accepted',()=>{
 const sim=home(),before=exact(sim),io={save:()=>{throw Error('unsafe commands must not save');}};
 for(const type of ['attack','pulse','dodge','heal','rest','revive','starter-enter','starter-leave','range-enter','cross-trade','beacon-defend','reward','class-choose','soul-equip','start','earth-story-grant','earth-story-reset','earth-note-record','earth-gathering-reward']){assert.equal(T.supports('adventure',type),false,type);assert.equal(run(sim,type,{},io).ok,false,type);assert.equal(exact(sim),before,type);}
 for(const type of ['gather','bridge','place','reclaim','crop']){assert.equal(T.supports('sandbox',type),false,type);assert.equal(run(sim,type,{},io,'unsafe-'+type,'sandbox').ok,false,type);assert.equal(exact(sim),before,type);}
 assert.equal(T.supports('unknown','craft'),false);
});

// These CPU boundary fixtures use explicitly synthetic local placements and
// balances. The native browser proof below earns preparation through actual UI.
const ES=global.RealmEarthStory,E=global.RealmEarth,S=global.RealmSandbox;
function earth(){const sim=home();sim.room=E.ROOM;sim.returnPos={x:0,z:23,yaw:.2};sim.state.player={...ES.GIVER,yaw:.4};A.syncScene(sim);return sim;}
function place(sim,p){sim.state.player={x:p.x,z:p.z,yaw:.4};}
function localStep(sim,id){const step=ES.STEPS.find(s=>s.id===id);place(sim,step);assert.ok(run(sim,'earth-story-step',{id}).ok);}
function delivered(){const sim=earth();assert.ok(run(sim,'earth-story-accept').ok);localStep(sim,'mill-root');localStep(sim,'mill-gate');place(sim,ES.GIVER);assert.ok(run(sim,'earth-story-dispatch',{route:'mill'}).ok);place(sim,ES.DESTINATION);assert.ok(run(sim,'earth-story-arrive').ok);return sim;}

test('exactly five finite Earth-story actions join the explicit command set',()=>{
 for(const type of ['earth-story-accept','earth-story-step','earth-story-dispatch','earth-story-arrive','earth-story-claim'])assert.ok(T.supports('adventure',type),type);
 assert.equal(T.supports('sandbox','earth-story-step'),false);assert.equal(T.supports('adventure','earth-story-claim-again'),false);
});

test('Earth consent saves before adoption and keeps all live context and actor epochs',()=>{
 const sim=earth(),before=exact(sim),runtime=A.runtime(sim),epoch=copy(runtime),refs={state:sim.state,a:sim.state.adventure,s:sim.state.sandbox,player:sim.state.player,path:sim.playerPath,returnPos:sim.returnPos,runs:sim.runs},elapsed=sim.elapsed;
 let candidate;assert.ok(run(sim,'earth-story-accept',{}, {save:v=>{assert.equal(exact(sim),before);candidate=copy(v);return{ok:true};}}).ok);
 assert.ok(sim.state.adventure.earthStory.accepted);assert.equal(candidate.player.x,0);assert.equal(candidate.player.z,23);assert.equal(candidate.adventure.xp,sim.state.adventure.xp);
 assert.equal(sim.state,refs.state);assert.equal(sim.state.adventure,refs.a);assert.equal(sim.state.sandbox,refs.s);assert.equal(sim.state.player,refs.player);assert.equal(sim.playerPath,refs.path);assert.equal(sim.returnPos,refs.returnPos);assert.equal(sim.runs,refs.runs);assert.equal(sim.elapsed,elapsed);assert.equal(sim.room,E.ROOM);assert.equal(A.runtime(sim),runtime);assert.deepEqual(runtime,epoch);
});

test('every mill delivery transition survives quota refusal and same-request retry with one cost and payout',()=>{
 const sim=earth(),a=sim.state.adventure,initial=copy(sim.state),runtime=A.runtime(sim),epoch=copy(runtime);
 refuseRetry(sim,'earth-story-accept');place(sim,ES.STEPS.find(s=>s.id==='mill-root'));refuseRetry(sim,'earth-story-step',{id:'mill-root'});
 place(sim,ES.STEPS.find(s=>s.id==='mill-gate'));const player=sim.state.player,path=sim.playerPath,returnPos=sim.returnPos;refuseRetry(sim,'earth-story-step',{id:'mill-gate'});
 assert.equal(sim.state.sandbox.inventory.wood,initial.sandbox.inventory.wood-2);assert.equal(sim.state.player,player);assert.equal(sim.playerPath,path);assert.equal(sim.returnPos,returnPos);
 place(sim,ES.GIVER);refuseRetry(sim,'earth-story-dispatch',{route:'mill'});place(sim,ES.DESTINATION);refuseRetry(sim,'earth-story-arrive');refuseRetry(sim,'earth-story-claim');
 assert.equal(a.ore,initial.adventure.ore+3);assert.equal(a.coins,initial.adventure.coins+4);assert.equal(sim.state.sandbox.inventory.fiber,initial.sandbox.inventory.fiber+2);assert.equal(a.xp,initial.adventure.xp);assert.equal(a.earthStory.claimed,true);
 for(const k of ['equipment','owned','classPath','starter','pursuit','companion','road','beacon','crossing'])assert.deepEqual(a[k],initial.adventure[k],k);
 assert.equal(A.runtime(sim),runtime);assert.deepEqual(runtime,epoch);
 const before=exact(sim);assert.equal(run(sim,'earth-story-claim').ok,false);assert.equal(exact(sim),before);assert.equal(run(sim,'earth-story-arrive',{}, {save:()=>{throw Error('changed terms must not save');}},a.receipts.at(-1).id).ok,false);assert.equal(exact(sim),before);
 place(sim,ES.STEPS.find(s=>s.id==='mill-gate'));const value=exact(sim);assert.equal(run(sim,'earth-story-step',{id:'mill-gate'}).ok,false);assert.equal(exact(sim),value);
});

test('Earth task prerequisites, cost, source room, local position and pause refuse before saving',()=>{
 const sim=earth(),io={save:()=>{throw Error('refused Earth rules must not save');}};
 const denied=(type,p={})=>{const before=exact(sim);assert.equal(run(sim,type,p,io).ok,false);assert.equal(exact(sim),before);};
 denied('earth-story-step',{id:'mill-root'});assert.ok(run(sim,'earth-story-accept').ok);
 place(sim,ES.STEPS.find(s=>s.id==='mill-gate'));denied('earth-story-step',{id:'mill-gate'});localStep(sim,'mill-root');
 place(sim,ES.STEPS.find(s=>s.id==='mill-gate'));sim.state.sandbox.inventory.wood=1;denied('earth-story-step',{id:'mill-gate'});
 place(sim,ES.GIVER);denied('earth-story-dispatch',{route:'mill'});denied('earth-story-arrive');denied('earth-story-claim');
 place(sim,{x:0,z:10});denied('earth-story-step',{id:'quarry-reserve'});sim.room='mine';denied('earth-story-accept');
 sim.room=E.ROOM;place(sim,ES.GIVER);sim.paused=true;denied('earth-story-dispatch',{route:'mill'});assert.equal(sim.paused,true);
});

test('all compatible improvements remain available after the single delivery without a second payout',()=>{
 const sim=delivered();assert.ok(run(sim,'earth-story-claim').ok);const payout={ore:sim.state.adventure.ore,coins:sim.state.adventure.coins,fiber:sim.state.sandbox.inventory.fiber,xp:sim.state.adventure.xp,wood:sim.state.sandbox.inventory.wood};
 for(const step of ES.STEPS.filter(s=>!sim.state.adventure.earthStory.steps.includes(s.id))){place(sim,step);refuseRetry(sim,'earth-story-step',{id:step.id});}
 assert.equal(sim.state.adventure.earthStory.steps.length,ES.STEPS.length);assert.deepEqual({ore:sim.state.adventure.ore,coins:sim.state.adventure.coins,fiber:sim.state.sandbox.inventory.fiber,xp:sim.state.adventure.xp,wood:sim.state.sandbox.inventory.wood},payout);
 place(sim,ES.GIVER);const before=exact(sim);assert.equal(run(sim,'earth-story-dispatch',{route:'quarry'}).ok,false);assert.equal(exact(sim),before);
});

test('each Earth payment capacity refusal preserves unpaid work and exact rewards have zero XP',()=>{
 for(const field of ['ore','coins','fiber']){
  const sim=delivered(),a=sim.state.adventure,inv=sim.state.sandbox.inventory;const target=field==='fiber'?inv:a,limit=field==='fiber'?S.MAX:9999,reward=ES.REWARD[field];target[field]=limit-reward+1;
  const before=exact(sim);assert.equal(run(sim,'earth-story-claim',{}, {save:()=>{throw Error('full payment must not save');}}).ok,false);assert.equal(exact(sim),before);assert.equal(a.earthStory.claimed,false);
  target[field]--;const xp=a.xp;refuseRetry(sim,'earth-story-claim');assert.equal(field==='fiber'?sim.state.sandbox.inventory[field]:a[field],limit);assert.equal(a.xp,xp);
 }
});

test('Earth repair rejects foreign source bytes and keeps the other writer intact',()=>{
 const sim=earth();assert.ok(run(sim,'earth-story-accept').ok);localStep(sim,'mill-root');place(sim,ES.STEPS.find(s=>s.id==='mill-gate'));
 const s=storage(sim),other=JSON.parse(s.map.get(C.KEY));other.adventure.coins++;const foreign=JSON.stringify(other);s.map.set(C.KEY,foreign);const before=exact(sim);
 const r=run(sim,'earth-story-step',{id:'mill-gate'},s.io);assert.equal(r.ok,false);assert.match(r.error,/Another tab/);assert.equal(exact(sim),before);assert.equal(s.map.get(C.KEY),foreign);
});

test('managed writer refusal preserves Earth payment and permits a later owned retry',()=>{
 const sim=delivered(),s=storage(sim);s.store.writer=true;assert.ok(s.store.command('create',{visitor:C.fresh().visitor},sim.snapshot(),0).ok);assert.ok(s.store.command('switch',{id:'character-1'},C.fresh(),s.store.revision).ok);
 const before=exact(sim),durable=s.map.get(Chars.KEY),id='earth-writer-retry';s.store.writer=false;const r=run(sim,'earth-story-claim',{},s.io,id);assert.equal(r.ok,false);assert.match(r.error,/cannot write/);assert.equal(exact(sim),before);assert.equal(s.map.get(Chars.KEY),durable);
 s.store.writer=true;assert.ok(run(sim,'earth-story-claim',{},s.io,id).ok);assert.equal(sim.state.adventure.earthStory.claimed,true);assert.equal(s.store.record.slots.find(c=>c.id==='character-1').world.adventure.earthStory.claimed,true);
});
