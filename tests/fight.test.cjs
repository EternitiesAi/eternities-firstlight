/* Fight rules: guard curve, level cap, boss table and phases, telegraph shapes and timing, hit feel, poise,
 * wall-bait stun, the herald and keeper shaped moves, and the threat cue. Fixtures are synthetic and labelled. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core.js'),A=require('../src/adventure.js'),T=require('../src/combat.js'),D=require('../src/difficulty.js'),R=require('../src/road.js'),B=require('../src/beacon.js'),X=require('../src/crossing.js');
let seq=0;const act=(s,t,p={})=>s.adventureCommand('fight-rules-'+(++seq),t,p);
function step(s,t){for(let i=0;i<Math.round(t/.05);i++)s.tick(.05);}
// The mine as adventure.test.cjs builds it: real start and enter commands.
function mine(){const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};assert.equal(act(s,'start').ok,true);s.state.sandbox.bridge=true;s.state.sandbox.inventory.pick=1;s.state.player={x:0,z:-48,yaw:0};assert.equal(act(s,'enter').ok,true);return s;}
const probe=(over={})=>({id:'probe',name:'probe',kind:'skitter',hp:40,maxHP:40,x:0,z:-30,mode:'idle',timer:0,yaw:0,aim:null,flash:0,path:[],nextPath:0,awareness:0,home:{x:0,z:-30},xp:0,coins:0,ore:0,...over});

test('guard is a diminishing share: flat on small blows, the keeper coat no longer takes a skitter to one',()=>{
 assert.equal(T.armour(9,1),8);       // the starter coat still takes one point
 assert.equal(T.armour(24,1),23);
 assert.equal(T.armour(8,9),6);       // keeper coat on the river skitter: never one
 assert.equal(T.armour(17,13),12);
 for(const n of[1,2,5,8,13,17,24,28,40])assert.equal(T.armour(n,0),n);
 assert.equal(T.armour(100,1000),25); // a quarter of the blow always lands
 for(let n=1;n<=60;n++){let prev=Infinity;for(let g=0;g<=40;g++){const v=T.armour(n,g);assert.ok(v>=1&&v<=n&&v<=prev,n+' guard '+g);prev=v;}}
 const red=g=>30-T.armour(30,g);assert.ok(red(20)<2*red(10));assert.ok(red(40)<2*red(20));
});
test('level climbs to twelve, and the first four thresholds never move',()=>{
 const L=xp=>A.level({xp});
 assert.deepEqual([0,29,30,79,80,149,150,259,260,399,400,559,560,739,740,939,940,1159,1160,1399,1400,1679,1680,9999].map(L),[1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12]);
 const s=A.fresh();s.xp=9999;assert.equal(A.stats(s).level,12);assert.equal(A.stats(s).attack,26);assert.equal(A.stats(s).maxHP,210);assert.equal(A.stats(A.fresh()).maxHP,100);
});
test('saves that already store xp validate under the new cap',()=>{
 for(const xp of[0,365,1680,9999]){const raw=JSON.parse(JSON.stringify({...A.fresh(),xp}));assert.equal(A.validate(raw).xp,xp);assert.equal(A.level(A.validate(raw)),A.level({xp}));}
});
test('the main-path boss table rises in hp and damage, and the chapter bosses read it',()=>{
 const order=['hart','ram','herald','keeper','foundryWarden','relaySeraph','witnessGuardian'].map(id=>D.boss(id));
 for(let i=1;i<order.length;i++){assert.ok(order[i].hp>order[i-1].hp,'hp rises at '+i);assert.ok(order[i].damage>order[i-1].damage,'damage rises at '+i);}
 const reg=D.boss('regent');assert.deepEqual(reg.phases.map(p=>p.hp),[380,400,420]);assert.equal(reg.phases.reduce((n,p)=>n+p.hp,0),1200);
 assert.ok(reg.phases.every((p,i)=>i===0||p.damage>reg.phases[i-1].damage)); // the regent's own numbers are the finale aide's: only its internal rise is checked here
 const hart=A.ENEMIES.find(e=>e.id==='hart');assert.equal(hart.hp,780);assert.equal(hart.damage,22);
 assert.equal(R.ENEMIES.find(e=>e.id==='road-ram').hp,1080);
 const herald=B.WAVES.flat().find(e=>e.id==='herald');assert.equal(herald.hp,1200);assert.equal(herald.damage,36);
 const keeper=X.ENEMIES.find(e=>e.id==='cross-warden');assert.equal(keeper.hp,1440);assert.equal(keeper.damage,38);
 assert.throws(()=>D.boss('nobody'),/Unknown boss/);
 // the contract shape: exact keys, each entry hp, damage and windup, and copies that never write back to the table.
 assert.deepEqual(Object.keys(D.BOSSES),['hart','ram','herald','keeper','foundryWarden','relaySeraph','witnessGuardian','regent']);
 for(const id of Object.keys(D.BOSSES))for(const f of['hp','damage','windup'])assert.ok(Number.isFinite(D.boss(id)[f]),id+'.'+f);
 assert.equal(reg.hp,1200);assert.equal(reg.damage,54);assert.ok(reg.phases.every(p=>Array.isArray(p.patterns)&&p.patterns.length>0));
 assert.equal(D.boss('foundryWarden').hp,1600);assert.equal(D.boss('relaySeraph').hp,1900);assert.equal(D.boss('witnessGuardian').hp,2200);
 const copy=D.boss('hart');copy.hp=1;assert.equal(D.boss('hart').hp,780);assert.equal(D.BOSSES.hart.hp,780);
 assert.equal(hart.windup,D.boss('hart').windup);assert.equal(D.BOSSES.hart.windup,1.05);
});
test('phases() maps damage dealt to a phase, runs the hook once per change, and refuses bad data',()=>{
 const seen=[];const p=D.phases({...D.boss('regent'),onPhase:(sim,e,next,prev)=>seen.push([next,prev])});
 assert.equal(p.count,3);assert.equal(p.total,1200);assert.deepEqual([...p.bounds],[380,780,1200]);
 const e={hp:1200};assert.equal(p.step({},e),0);assert.equal(p.damage(e),46);
 e.hp=820;assert.equal(p.step({},e),1);assert.equal(p.damage(e),50);
 e.hp=819;assert.equal(p.step({},e),1);
 e.hp=420;assert.equal(p.step({},e),2);assert.equal(p.damage(e),54);
 e.hp=0;assert.equal(p.step({},e),2);
 assert.deepEqual(seen,[[1,0],[2,1]]);
 assert.throws(()=>D.phases({phases:[]}),/one to four/);
 assert.throws(()=>D.phases({phases:[{hp:0,damage:1}]}),/hp and damage/);
 assert.throws(()=>D.phases({phases:[1,2,3,4,5].map(()=>({hp:1,damage:1}))}),/one to four/);
});
test('telegraph shapes hit inside the body radius and miss beyond it',()=>{
 const line={kind:'line',ox:0,oz:0,dx:0,dz:1,length:6,half:.9};
 assert.equal(T.inLine(line,{x:0,z:3}),true);assert.equal(T.inLine(line,{x:1.1,z:3}),true);assert.equal(T.inLine(line,{x:1.2,z:3}),false);assert.equal(T.inLine(line,{x:0,z:7.5}),false);
 assert.equal(T.inRing({x:0,z:0},2.4,{x:2.6,z:0}),true);assert.equal(T.inRing({x:0,z:0},2.4,{x:2.7,z:0}),false);
});
test('telegraph fill runs from empty to full over its span; the outer stage uses its own gap',()=>{
 assert.equal(T.fill({timer:1.05,windup:1.05}),0);assert.ok(Math.abs(T.fill({timer:.525,windup:1.05})-.5)<1e-9);assert.equal(T.fill({timer:0,windup:1.05}),1);
 assert.ok(Math.abs(T.fill({timer:.4,omen:{kind:'double',stage:2,gap:.8,windup:1.1}})-.5)<1e-9);
});
test('the hart cycles ring, line slam and double ring, then wraps to the ring',()=>{
 const hart={...A.ENEMIES.find(e=>e.id==='hart')};const toward={x:11,z:-10};
 assert.equal(T.cycle(hart,toward),null);
 const line=T.cycle(hart,toward);assert.equal(line.kind,'line');assert.equal(line.windup,1.2);assert.equal(line.length,6);assert.equal(line.half,.9);
 assert.ok(Math.abs(line.dx-1)<1e-9&&Math.abs(line.dz)<1e-9);
 const dbl=T.cycle(hart,toward);assert.equal(dbl.kind,'double');assert.equal(dbl.windup,1.1);assert.equal(dbl.r1,2.4);assert.equal(dbl.r2,3.6);assert.equal(dbl.gap,.8);assert.equal(dbl.stage,1);
 assert.equal(T.cycle(hart,toward),null);
});
test('landed hits hold adventure time by weight, and the hold is spent before time advances',()=>{
 const s=mine(),t=T.runtime(s),target={x:0,z:-30,hp:10,maxHP:10,name:'probe'};
 T.hit(s,target,5,'light');assert.equal(t.hold,.04);t.hold=0;
 T.hit(s,target,5,'skill');assert.equal(t.hold,.055);t.hold=0;
 T.hit(s,target,5,'boss');assert.equal(t.hold,.07);assert.equal(t.hits.at(-1).heavy,true);
 assert.ok(Math.abs(T.holdTime(s,.1)-.03)<1e-9);assert.equal(t.hold,0);
 assert.equal(T.holdTime(s,.02),.02);
});
test('heavy blows jolt the camera briefly, reduced motion turns it off, and incoming blows get numbers',()=>{
 const s=mine(),a=s.state.adventure,t=T.runtime(s),quiet=()=>T.shakeOffset(s).every(v=>v===0);
 assert.ok(quiet());
 T.hit(s,{x:0,z:-30,hp:10,maxHP:10},5,'light');assert.ok(quiet());
 T.hit(s,{x:0,z:-30,hp:10,maxHP:10},5,'boss');assert.ok(!quiet());
 a.elapsed+=.25;assert.ok(quiet());
 s.state.settings.reducedMotion=true;T.hit(s,{x:0,z:-30,hp:10,maxHP:10},5,'boss');assert.ok(quiet());
 s.state.settings.reducedMotion=false;
 T.hurt(s,24,true);assert.equal(t.hurts.at(-1).n,24);assert.equal(t.hurts.at(-1).heavy,true);
});
test('a hit interrupts a plain windup, but never a boss windup',()=>{
 const s=mine();
 const skit=probe({mode:'windup',timer:.5,windup:.75,poise:true});
 assert.equal(A.damageEnemy(s,skit,5,'weapon'),true);assert.equal(skit.mode,'recover');assert.equal(skit.timer,.5);
 const boss=probe({id:'poise-boss',kind:'boss',boss:true,mode:'windup',timer:1});
 A.damageEnemy(s,boss,5,'weapon');assert.equal(boss.mode,'windup');assert.equal(boss.timer,1);
});
test('a bait charge that meets a wall is stunned and exposed; one that runs out of lane recovers as before',()=>{
 for(const[length,wall]of[[13,true],[1.5,false]]){
  const s=mine(),a=s.state.adventure,r=A.runtime(s);s.state.player={x:0,z:4,yaw:0};
  const ram=probe({id:'bait-probe',kind:'charger',boss:true,hp:320,maxHP:320,damage:28,x:5.5,z:-12,home:{x:5.5,z:-12},mode:'charge',chargeDir:{x:-1,z:0},chargeLeft:length,chargeHit:false,wallBait:2.8,crashed:false});
  r.enemies.push(ram);
  for(let i=0;i<60&&ram.mode==='charge';i++)step(s,.05);
  assert.equal(ram.mode,'recover',wall?'wall':'lane');
  if(wall){assert.ok(Math.abs(ram.timer-2.8)<1e-9,'stun length');assert.ok(Math.abs(ram.exposedUntil-(a.elapsed+2.8))<1e-6,'exposed while stunned');}
  else{assert.ok(Math.abs(ram.timer-1.8)<1e-9,'normal recovery');assert.ok(!(ram.exposedUntil>a.elapsed));}
 }
});
test('the threat cue names each shaped move while it winds up',()=>{
 const s=mine();s.state.player={x:0,z:4,yaw:0};const hart=A.runtime(s).enemies.find(e=>e.id==='hart');T.runtime(s).target=hart.id;
 hart.mode='windup';hart.timer=.9;hart.aim=null;hart.omen={kind:'line',ox:8,oz:-10,dx:0,dz:1,length:6,half:.9,stage:1,windup:1.2};
 assert.deepEqual(T.threat(s),{phase:'windup',kind:'telegraph-line',remaining:.9});
 hart.omen={kind:'double',x:8,z:-10,r1:2.4,r2:3.6,gap:.8,windup:1.1,stage:2};hart.timer=.4;
 assert.deepEqual(T.threat(s),{phase:'windup',kind:'telegraph-double',remaining:.4});
});
test('the herald runs its double ring and line slam through the beacon owner',()=>{
 const s=new C.Simulation(JSON.parse(fs.readFileSync(require.resolve('../examples/CHAPTER_II_COMPLETE_EARNED.json'))));
 const cmd=(t,p={})=>s.adventureCommand('fight-herald-'+(++seq),t,p);
 s.state.player={x:44,z:6,yaw:0};assert.equal(cmd('road-enter').ok,true);
 s.state.player={x:0,z:-24,yaw:0};A.runtime(s).companion={...A.runtime(s).companion,room:'road',x:0,z:-24};
 assert.equal(cmd('beacon-answer').ok,true);step(s,18);assert.equal(B.runtime(s).phase,'ready');assert.equal(cmd('beacon-sighting').ok,true);assert.equal(cmd('beacon-defend').ok,true);
 for(let k=0;k<2;k++){for(const e of A.runtime(s).enemies.filter(e=>e.eventEnemy)){e.hidden=false;A.damageEnemy(s,e,10000);}step(s,7.2);}
 assert.equal(B.runtime(s).wave,3);
 const herald=A.runtime(s).enemies.find(e=>e.id==='siege-herald');assert.ok(herald);
 const seen=[];
 for(let i=0;i<1000&&seen.length<4;i++){
  s.state.adventure.hp=100;B.runtime(s).ward=100;s.state.player={x:0,z:-19,yaw:0};step(s,.05);
  const tag=herald.omen?herald.omen.kind+':'+herald.omen.stage:(herald.mode==='windup'&&!herald.aimWard?'strike':null);
  if(tag&&tag!==seen.at(-1))seen.push(tag);
 }
 assert.deepEqual(seen.slice(0,4),['strike','double:1','double:2','line:1']);
});
test('the keeper runs its line slam and double ring through the crossing owner',()=>{
 const s=new C.Simulation();s.state.adventure.started=true;s.room='crossing';s.state.player={x:0,z:-18,yaw:0};A.syncScene(s);
 const k=A.runtime(s).enemies.find(e=>e.custom==='bell');assert.ok(k&&k.hp===1440);
 k.strikes=2;
 const seen=[];
 for(let i=0;i<800&&seen.length<4;i++){s.state.adventure.hp=100;s.state.player={x:0,z:-18,yaw:0};s.tick(.05);
  const tag=k.omen?k.omen.kind+':'+k.omen.stage:(k.mode==='windup'?'ring:'+k.ringMode:null);if(tag&&tag!==seen.at(-1))seen.push(tag);}
 assert.deepEqual(seen.slice(0,4),['line:1','double:1','double:2','ring:outer']);
});
