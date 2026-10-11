'use strict';
const test=require('node:test'),a=require('node:assert/strict'),C=require('../src/core.js'),A=require('../src/adventure.js');
let seq=0;const act=(s,t,p={})=>s.adventureCommand('test-'+(++seq),t,p),state=s=>JSON.stringify(s.snapshot());
function step(s,t){for(let i=0;i<t*20;i++)s.tick(.05);}
function begun(){let s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};a.equal(act(s,'start').ok,true);return s;}
function mine(){let s=begun();s.state.sandbox.bridge=true;s.state.sandbox.inventory.pick=1;s.state.player={x:0,z:-48,yaw:0};a.equal(act(s,'enter').ok,true);return s;}
function move(s,x,z){a.equal(s.moveTo(x,z).ok,true);for(let i=0;s.playerPath.length&&i<2000;i++)s.tick(.05);a.ok(Math.hypot(s.state.player.x-x,s.state.player.z-z)<.01);}
// Isolated known-answer states; the separate journey test earns progress from scratch.
test('adventure defaults round trip without equipment or story',()=>{a.deepEqual(A.validate(A.fresh()),A.fresh());a.equal(A.stats(A.fresh()).level,1);});
test('v4 migration preserves sandbox, composition, notes, appearance without source mutation',()=>{let old=C.fresh();old.version=4;delete old.adventure;old.score.title='My intact song';old.notes=[{text:'History',day:1}];let before=JSON.stringify(old),s=C.validate(old);a.equal(s.version,C.VERSION);for(let k of['sandbox','score','notes','retreat','visitor'])a.deepEqual(s[k],old[k]);a.equal(JSON.stringify(old),before);});
test('realm05 browser key is copied without overwriting previous save',()=>{let old=C.fresh();old.version=4;delete old.adventure;let m=new Map([['eternities.realm05.save.v4',JSON.stringify(old)]]),store={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};let loaded=C.load(store);a.equal(loaded.status,'migrated');new C.Simulation(loaded.state).save(store);a.equal(JSON.parse(m.get('eternities.realm05.save.v4')).version,4);a.equal(JSON.parse(m.get(C.KEY)).version,C.VERSION);});
test('starter supplies require actual workshop proximity',()=>{let s=new C.Simulation(),before=state(s);a.equal(act(s,'start').ok,false);a.equal(state(s),before);});
test('starter kit is one claim and equips owned items',()=>{let s=begun();a.deepEqual(s.state.adventure.owned,['trail_blade','travel_coat']);a.equal(A.stats(s.state.adventure).attack,16);a.equal(act(s,'start').ok,false);});
test('retry is idempotent while changed terms under same ID are rejected',()=>{let s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};a.equal(s.adventureCommand('once','start').ok,true);let before=state(s);a.equal(s.adventureCommand('once','start').duplicate,true);a.equal(state(s),before);a.equal(s.adventureCommand('once','equip',{id:'trail_blade'}).ok,false);});
test('entry requires supplies, repaired crossing, pickaxe and proximity',()=>{let s=begun();a.equal(act(s,'enter').ok,false);s.state.sandbox.bridge=true;s.state.player={x:0,z:-48,yaw:0};a.equal(act(s,'enter').ok,false);s.state.sandbox.inventory.pick=1;a.equal(act(s,'enter').ok,true);});
test('interior saves retain safe exterior return position',()=>{let s=mine();a.equal(s.room,'mine');a.deepEqual(s.snapshot().player,{x:0,z:-48,yaw:0});a.equal(C.validate(s.snapshot()).version,C.VERSION);});
test('authored entry, fox and encounter positions are walkable',()=>{let s=A.fresh();a.ok(A.walkable(s,0,11));for(let e of A.ENEMIES)a.ok(A.walkable(s,e.x,e.z),e.id);a.ok(A.walkable(s,A.FOX.x,A.FOX.z));});
test('outer walls and NaN cannot be walked through',()=>{let s=A.fresh();a.equal(A.walkable(s,14,0),false);a.equal(A.walkable(s,NaN,0),false);a.equal(A.walkable(s,0,2),false);});
test('digging checks scene, tool and reach before mutation',()=>{let s=begun();a.equal(act(s,'dig',{gx:0,gz:1}).ok,false);let m=mine(),before=state(m);a.equal(act(m,'dig',{gx:0,gz:1}).ok,false);a.equal(state(m),before);});
test('two actual strikes excavate rock and open a path',()=>{let s=mine();move(s,0,4);a.equal(act(s,'dig',{gx:0,gz:1}).ok,true);a.equal(s.state.adventure.chips.length,1);a.equal(A.walkable(s.state.adventure,0,2),false);step(s,.5);a.equal(act(s,'dig',{gx:0,gz:1}).ok,true);a.equal(s.state.adventure.chips.length,0);a.ok(A.walkable(s.state.adventure,0,2));a.ok(C.pathfind(s.state.player,{x:0,z:0},s.navRoom));});
test('pick cooldown prevents duplicate immediate strokes',()=>{let s=mine();move(s,0,4);act(s,'dig',{gx:0,gz:1});let b=state(s);a.equal(act(s,'dig',{gx:0,gz:1}).ok,false);a.equal(state(s),b);});
test('outer cells refuse excavation',()=>{let s=mine();a.equal(act(s,'dig',{gx:7,gz:1}).ok,false);});
test('removed stone cannot pay again',()=>{let s=mine();move(s,0,4);act(s,'dig',{gx:0,gz:1});step(s,.5);act(s,'dig',{gx:0,gz:1});let b=state(s);a.equal(act(s,'dig',{gx:0,gz:1}).ok,false);a.equal(state(s),b);});
test('cold reopening reconstructs excavation but restarts outside',()=>{let s=mine();move(s,0,4);act(s,'dig',{gx:0,gz:1});step(s,.5);act(s,'dig',{gx:0,gz:1});let c=new C.Simulation(s.snapshot());a.equal(c.room,null);a.ok(A.walkable(c.state.adventure,0,2));});
test('attacks cannot damage distant targets',()=>{let s=mine(),e=A.runtime(s).enemies[0],hp=e.hp;a.equal(act(s,'attack',{target:e.id}).ok,false);a.equal(e.hp,hp);});
test('line of sight blocks attacks through rock',()=>{let s=mine(),e=A.runtime(s).enemies[1];s.state.player={x:0,z:3,yaw:0};e.x=0;e.z=1;a.equal(act(s,'attack',{target:e.id}).ok,false);});
test('melee decreases health, respects cooldown and creates one defeat/cache',()=>{let s=mine(),e=A.runtime(s).enemies[0];s.state.player={x:-4,z:3.4,yaw:0};a.equal(act(s,'attack',{target:e.id}).ok,true);a.equal(e.hp,19);a.equal(act(s,'attack',{target:e.id}).ok,false);step(s,.6);act(s,'attack',{target:e.id});step(s,.6);act(s,'attack',{target:e.id});a.ok(s.state.adventure.defeated.includes(e.id));a.ok(s.state.adventure.drops.includes(e.id));a.equal(s.state.adventure.xp,20);});
test('sweep consumes stamina only once per cooldown',()=>{let s=mine();s.state.player={x:-4,z:3,yaw:0};a.equal(act(s,'pulse').ok,true);a.equal(s.state.adventure.stamina,70);a.equal(act(s,'pulse').ok,false);a.equal(s.state.adventure.stamina,70);});
test('insufficient stamina refuses without mutation',()=>{let s=mine();s.state.adventure.stamina=29;let b=state(s);a.equal(act(s,'pulse').ok,false);a.equal(state(s),b);});
test('dodge respects cave collision instead of tunneling',()=>{let s=mine();s.state.player={x:0,z:3.5,yaw:Math.PI};a.equal(act(s,'dodge',{dx:0,dz:-1}).ok,true);a.ok(A.walkable(s.state.adventure,s.state.player.x,s.state.player.z));a.ok(s.state.player.z>2.9);a.equal(s.state.adventure.stamina,78);});
test('dodge avoidance protects against imminent impact',()=>{let s=mine(),r=A.runtime(s),e=r.enemies[0];s.state.player={x:-4,z:2,yaw:0};e.mode='windup';e.timer=.05;e.aim={...s.state.player};r.invincible=0;act(s,'dodge',{dx:-1,dz:0});let hp=s.state.adventure.hp;step(s,.1);a.equal(s.state.adventure.hp,hp);});
test('telegraph hits its declared destination, not a tracking player',()=>{let s=mine(),r=A.runtime(s),e=r.enemies[0];e.mode='windup';e.timer=.05;e.aim={x:-4,z:2};s.state.player={x:-8,z:2,yaw:0};r.invincible=0;step(s,.1);a.equal(s.state.adventure.hp,100);});
test('failed evasion incurs damage reduced by armor',()=>{let s=mine(),r=A.runtime(s),e=r.enemies[0];s.state.player={x:-4,z:2,yaw:0};e.mode='windup';e.timer=.05;e.aim={...s.state.player};r.invincible=0;step(s,.05);a.equal(s.state.adventure.hp,92);});
test('pause stops actual timers and combat',()=>{let s=mine();s.state.adventure.stamina=50;let b=state(s);s.paused=true;step(s,10);a.equal(state(s),b);a.equal(act(s,'dodge').ok,false);});
test('daylight slider is not a cooldown cheat',()=>{let s=mine();act(s,'pulse');let t=s.state.adventure.elapsed;s.setTime(23);a.equal(s.state.adventure.elapsed,t);a.equal(act(s,'pulse').ok,false);});
test('healing consumes tonic, caps at maximum and has cooldown',()=>{let s=mine();a.equal(act(s,'heal').ok,false);s.state.adventure.hp=25;a.equal(act(s,'heal').ok,true);a.equal(s.state.adventure.hp,73);a.equal(s.state.adventure.tonics,2);a.equal(act(s,'heal').ok,false);});
test('rest requires spring and is not available in combat',()=>{let s=mine();s.state.adventure.hp=20;a.equal(act(s,'rest').ok,false);s.leave();s.state.player={x:0,z:3,yaw:0};a.equal(act(s,'rest').ok,true);a.equal(s.state.adventure.hp,A.stats(s.state.adventure).maxHP);});
test('death stops movement and resurrection preserves loot',()=>{let s=mine();s.state.adventure.hp=0;s.state.adventure.ore=5;let p={...s.state.player};a.equal(s.moveTo(0,8).ok,false);s.manual(1,0,.1);a.deepEqual(s.state.player,p);a.equal(act(s,'attack').ok,false);a.equal(act(s,'revive').ok,true);a.equal(s.room,null);a.equal(s.state.adventure.ore,5);a.equal(s.state.adventure.hp,100);});
test('paused resurrection is possible without resuming time implicitly',()=>{let s=mine();s.state.adventure.hp=0;s.paused=true;a.equal(act(s,'revive').ok,true);a.equal(s.paused,true);});
test('living players cannot resurrect for a free teleport',()=>{let s=mine();a.equal(act(s,'revive').ok,false);a.equal(s.room,'mine');});
test('loot is proximity checked and cannot be claimed twice',()=>{let s=mine();s.state.adventure.defeated=['briar-1'];s.state.adventure.drops=['briar-1'];a.equal(act(s,'loot',{id:'briar-1'}).ok,false);s.state.player={x:-4,z:2,yaw:0};a.equal(act(s,'loot',{id:'briar-1'}).ok,true);a.equal(s.state.adventure.coins,3);a.equal(act(s,'loot',{id:'briar-1'}).ok,false);});
test('full pouch rejects atomically and preserves cache',()=>{let s=mine();s.state.adventure.defeated=['briar-1'];s.state.adventure.drops=['briar-1'];s.state.adventure.ore=9999;s.state.player={x:-4,z:2,yaw:0};let b=state(s);a.equal(act(s,'loot',{id:'briar-1'}).ok,false);a.equal(state(s),b);});
test('equipment must be owned and goes into the declared slot',()=>{let s=begun();a.equal(act(s,'equip',{id:'dawn_edge'}).ok,false);s.state.adventure.owned.push('guard_vest');a.equal(act(s,'equip',{id:'guard_vest'}).ok,true);a.equal(s.state.adventure.equipment.armor,'guard_vest');});
test('increased health capacity does not heal on equip',()=>{let s=begun();s.state.adventure.hp=40;s.state.adventure.owned.push('guard_vest');act(s,'equip',{id:'guard_vest'});a.equal(s.state.adventure.hp,40);});
test('forge consumes exact inputs once',()=>{let s=begun();s.state.adventure.ore=5;s.state.adventure.coins=5;a.equal(act(s,'forge').ok,true);a.equal(s.state.adventure.ore,1);a.equal(s.state.adventure.coins,1);a.equal(act(s,'forge').ok,false);});
test('forge outside workbench fails without cost',()=>{let s=mine();s.state.adventure.ore=5;s.state.adventure.coins=5;let b=state(s);a.equal(act(s,'forge').ok,false);a.equal(state(s),b);});
test('rescue requires proximity and threat clearance',()=>{let s=mine();s.state.player={x:-8,z:2,yaw:0};a.equal(act(s,'rescue').ok,false);s.state.adventure.defeated=['briar-1'];a.equal(act(s,'rescue').ok,true);a.equal(s.state.adventure.companion.bonded,true);a.equal(act(s,'rescue').ok,false);});
test('companion naming is bounded data and mode is enumerated',()=>{let s=mine();s.state.adventure.companion.bonded=true;a.equal(act(s,'rename',{name:'<b>Fox</b>'}).ok,true);a.equal(A.validate(s.state.adventure).companion.name,'<b>Fox</b>');a.equal(act(s,'rename',{name:'x'.repeat(25)}).ok,false);a.equal(act(s,'companion-mode',{mode:'attack-everyone'}).ok,false);});
test('Stay retains fox in its scene during active session',()=>{let s=mine();s.state.adventure.companion.bonded=true;act(s,'companion-mode',{mode:'stay'});let p={...A.runtime(s).companion};s.leave();A.syncScene(s);a.equal(A.runtime(s).companion.room,'mine');a.equal(A.runtime(s).companion.x,p.x);});
test('Follow explicitly recalls across a scene boundary',()=>{let s=mine();s.state.adventure.companion.bonded=true;act(s,'companion-mode',{mode:'stay'});s.leave();A.syncScene(s);act(s,'companion-mode',{mode:'follow'});a.equal(A.runtime(s).companion.room,null);});
test('defeated enemies stay defeated on re-entry',()=>{let s=mine();s.state.adventure.defeated=['briar-1'];s.leave();A.syncScene(s);s.state.player={x:0,z:-48,yaw:0};act(s,'enter');a.equal(A.runtime(s).enemies.some(e=>e.id==='briar-1'),false);});
test('unfinished enemies reset on re-entry; partial health is not a win',()=>{let s=mine();A.runtime(s).enemies[0].hp=1;s.leave();A.syncScene(s);s.state.player={x:0,z:-48,yaw:0};act(s,'enter');a.equal(A.runtime(s).enemies[0].hp,35);});
test('relic requires guardian defeat and proximity, with single claim',()=>{let s=mine();s.state.player={x:9,z:-10,yaw:0};a.equal(act(s,'relic').ok,false);s.state.adventure.defeated=['hart'];a.equal(act(s,'relic').ok,true);a.equal(act(s,'relic').ok,false);});
test('envoy requires relic at the spring',()=>{let s=begun();s.state.player={x:0,z:3,yaw:0};a.equal(act(s,'reveal').ok,false);s.state.adventure.defeated=['hart'];s.state.adventure.relic=true;a.equal(act(s,'reveal').ok,true);a.equal(s.state.adventure.angelSeen,true);});
test('final choice stays single across command IDs and cold reload',()=>{let s=begun();s.state.adventure.defeated=['hart'];s.state.adventure.relic=true;s.state.player={x:0,z:3,yaw:0};act(s,'reveal');a.equal(act(s,'reward',{id:'warden_stone'}).ok,true);a.equal(act(s,'reward',{id:'dawn_edge'}).ok,false);let cold=new C.Simulation(s.snapshot());a.equal(act(cold,'reward',{id:'dawn_edge'}).ok,false);a.ok(cold.state.adventure.owned.includes('warden_stone'));});
for(const[name,mutate]of[
 ['negative ore',s=>s.ore=-1],['NaN stamina',s=>s.stamina=NaN],['foreign gear',s=>s.owned=['__proto__']],['non-owned equip',s=>s.equipment.weapon='dawn_edge'],
 ['duplicate cells',s=>{s.started=true;s.dug=['0,1','0,1'];}],['outer excavation',s=>{s.started=true;s.dug=['7,0'];}],['noncanonical cell',s=>{s.started=true;s.dug=['00,1'];}],
 ['relic without defeat',s=>s.relic=true],['gift without envoy',s=>s.reward='dawn_edge'],['oversized name',s=>s.companion.name='x'.repeat(25)],
 ['duplicate drop',s=>{s.started=true;s.defeated=['hart'];s.drops=['hart','hart'];}],['impossible chips',s=>s.chips=[{id:'0,1',hp:99}]],
 ['excess health',s=>s.hp=9999],['foreign enemy',s=>s.defeated=['dragon']],['unstarted rescue',s=>s.companion.bonded=true]
])test('import rejects '+name,()=>{let s=A.fresh();mutate(s);a.throws(()=>A.validate(s));});
test('invalid command envelope cannot mutate persistent state',()=>{let s=mine(),b=state(s);a.equal(s.adventureCommand('','attack',{}).ok,false);a.equal(s.adventureCommand('x','attack',null).ok,false);a.equal(state(s),b);});
test('prototype-looking item key safely refuses',()=>{let s=begun();let b=state(s);a.equal(act(s,'equip',{id:'__proto__'}).ok,false);a.equal(state(s),b);});
test('circular command data is safely refused',()=>{let s=begun(),p={};p.self=p;let b=state(s);a.equal(s.adventureCommand('x','attack',p).ok,false);a.equal(state(s),b);});
test('no private memory or credentials enter save',()=>{let s=begun();a.equal('apiKey'in s.snapshot(),false);a.equal('residentHost'in s.snapshot(),false);});


// New guide uses actual Core/Adventure; these negative fixtures are labelled
// isolated known-answer state, not command-earned progress or native footage.
function guideScene(){
 const W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js');
 const s=begun();s.state.adventure.companion.bonded=true;
 s.returnPos={...s.state.player};s.worldTrip={active:'cpu-known-owner',realm:'heaven',home:{...s.returnPos}};s.room='world-heaven';s.state.player={x:-14,z:5,yaw:0};
 s.state.realmTrails.records['heaven-broken-choir-v1'].accepted=true;A.syncScene(s);
 return {s,W,R};
}
test('Briar Heaven guide refuses invalid intent and records one ordinary accepted command',()=>{
 const {s}=guideScene(),before=state(s),r=A.runtime(s);
 a.equal(act(s,'companion-guide',{x:0,z:0}).ok,false,'caller cannot select or inject a destination');a.equal(state(s),before);
 const revision=s.state.adventure.revision,count=s.state.adventure.receipts.length;
 const result=s.adventureCommand('guide-once','companion-guide',{});a.equal(result.ok,true,result.error);
 a.equal(s.state.adventure.revision,revision+1);a.equal(s.state.adventure.receipts.length,count+1);
 const accepted=state(s);a.equal(s.adventureCommand('guide-once','companion-guide',{}).duplicate,true);a.equal(state(s),accepted);
 a.equal(s.adventureCommand('guide-once','companion-guide',{x:25}).ok,false);a.equal(state(s),accepted);
 a.equal(act(s,'companion-guide').ok,false,'one current transient guide');a.equal(state(s),accepted);
 a.deepEqual(s.playerPath,[],'no player autowalk');a.ok(r.companion.guide);a.equal(r.companion.seek,null);
});
test('Briar Heaven guide rejects unbonded Stay dead paused unaccepted completed and wrong-room requests atomically',()=>{
 for(const mutate of[
  s=>s.state.adventure.companion.bonded=false,s=>s.state.adventure.companion.mode='stay',s=>s.state.adventure.hp=0,
  s=>s.paused=true,s=>s.state.realmTrails.records['heaven-broken-choir-v1'].accepted=false,
  s=>s.state.realmTrails.records['heaven-broken-choir-v1'].steps.push('spillway'),s=>{s.room='world-hell';A.syncScene(s);},
 ]){const {s}=guideScene();mutate(s);const before=state(s);a.equal(act(s,'companion-guide').ok,false);a.equal(state(s),before);}
});
test('Briar Heaven guide cancels current owner Stay death dive scene and actual danger without progress',()=>{
 for(const mode of ['stay','death','dive','scene','owner','adventure','companion','record','trip','active','danger']){
  const {s}=guideScene();a.equal(act(s,'companion-guide').ok,true);const old=A.runtime(s).companion;
  if(mode==='stay')a.equal(act(s,'companion-mode',{mode:'stay'}).ok,true);
  if(mode==='death')s.state.adventure.hp=0;
  if(mode==='dive')s.worldDive={surface:{...s.state.player},y:1.57};
  if(mode==='scene')s.room='world-hell';
  if(mode==='owner')s.state={...s.state};
  if(mode==='adventure')s.state.adventure={...s.state.adventure};
  if(mode==='companion')s.state.adventure.companion={...s.state.adventure.companion};
  if(mode==='record')s.state.realmTrails.records['heaven-broken-choir-v1']={...s.state.realmTrails.records['heaven-broken-choir-v1']};
  if(mode==='trip')s.worldTrip={active:'different-controlled-owner'};
  if(mode==='active')s.worldTrip.active='different-controlled-owner';
  if(mode==='danger'){
   const r=s.state.realmTrails.records['heaven-broken-choir-v1'];r.steps.push('relay-west','relay-east','relay-crown');A.syncScene(s);
   const e=A.runtime(s).enemies.find(e=>e.id==='heaven-choir-core-v1');a.ok(e);e.x=old.x+3;e.z=old.z;
  }
  // Actual Adventure tick with isolated negative transient boundaries. These
  // state/scene mutations are CPU fault controls, never native input proof.
  A.tick(s,0);a.equal(old.guide,null,mode);if(old.path.length)a.notDeepEqual(old.path.at(-1),{x:25,z:-15},mode+' cannot keep the cancelled guide destination; ordinary following may resume');
  a.equal(s.state.realmTrails.records['heaven-broken-choir-v1'].steps.includes('spillway'),false,mode);
 }
});
test('Briar Heaven guide body guard refuses a corrupted path through a real solid',()=>{
 const {s,W}=guideScene();a.equal(act(s,'companion-guide').ok,true);const c=A.runtime(s).companion;
 const solid=W.definition('heaven').solids.find(p=>W.walkable(s.room,p.x-p.w/2-.32,p.z)&&A.runtime(s).enemies.every(e=>Math.hypot(e.x-(p.x-p.w/2-.32),e.z-p.z)>15));a.ok(solid);c.x=solid.x-solid.w/2-.32;c.z=solid.z;
 c.path=[{x:solid.x,z:solid.z}];c.guide.waiting=false;s.state.player={x:c.x,z:c.z,yaw:0};
 const old={x:c.x,z:c.z};A.tick(s,.1);a.deepEqual({x:c.x,z:c.z},old);a.equal(c.guide,null);a.deepEqual(c.path,[]);
});
test('Briar Heaven guide reload replacement cannot retain the old transient request',()=>{
 const {s}=guideScene();a.equal(act(s,'companion-guide').ok,true);const raw=s.snapshot();
 a.equal(JSON.stringify(raw).includes('companion-guide'),true,'normal receipt is honest persistent intent');
 a.equal(Object.hasOwn(raw.adventure.companion,'guide'),false,'no new saved guide field');
 const cold=new C.Simulation(raw,{hydrated:true});A.syncScene(cold);a.equal(A.runtime(cold).companion.guide??null,null);
 a.equal(cold.room,null);a.deepEqual(cold.state.realmTrails,raw.realmTrails);
});
