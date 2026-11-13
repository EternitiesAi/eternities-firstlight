'use strict';
/* The nearshore through the real owners (BRANCHES 3.8, 5, 6): the pier and arrival lines from the story script, the
 * heel prompt (wait changes nothing; take sends briar-false), the real answer, the never-bonded plain path, and a
 * reload in the middle. take depends on the saga's briar-false command (BRANCHES 2.2); those cases fail until it lands. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.join(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),SG=require(path.join(ROOT,'src/saga.js')),RT=require(path.join(ROOT,'src/realm-trails.js'));
require(path.join(ROOT,'src/companion-art.js'));
const SCRIPT=require(path.join(ROOT,'src/story-script.js'));
const NEAR=require(path.join(ROOT,'src/nearshore.js'));require(path.join(ROOT,'src/nearshore-art.js'));
const FIXTURE='tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
const clone=o=>JSON.parse(JSON.stringify(o));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Earned witness save: heaven, both doors and both campaigns are finished, the sighting is in the saga.
function witnessSave(briar='taken',habit={commons:2},extra={}){
 const raw=clone(JSON.parse(fs.readFileSync(path.join(ROOT,FIXTURE),'utf8')));
 raw.saga={version:1,beats:{},regent:['confluence'],prophecy:['spring','heaven'],feather:{unlocked:true,uses:0},
  briar:{state:briar,habit:{...habit},takenDay:briar==='with'?null:1,returnedDay:null,homeDay:null},
  echo:{coercive:[],freeing:[]},finale:{phase:0,won:false},credits:false,postgame:false,...extra};
 raw.player={x:0,z:26,yaw:0};
 return C.validate(raw);
}
const ctxOf=sim=>({sim,active:'witness-test'});
const pay=(sim,p={})=>({expectedActive:'witness-test',expectedRevision:sim.state.adventure.revision,...p});
const saves=(result={ok:true})=>({save:()=>result});
function walk(sim,seconds){for(let t=0;t<seconds-1e-9;t+=.05){sim.elapsed+=.05;NEAR.view(sim);}}
const lineTexts=step=>SCRIPT.forStep('nearshore',step,{}).lines.map(l=>l.text);

test('the script speaks the pier, the offer, the heel prompt and the real answer',()=>{
 assert.ok(lineTexts('pier').length>0,'pier lines');
 assert.ok(lineTexts('arrive').length>0,'offer lines');
 const heel=SCRIPT.forStep('nearshore','heel',{});
 assert.equal(heel.choice.id,'heel');
 assert.deepEqual(heel.choice.options.map(o=>o.id),['take','wait']);
 assert.ok(lineTexts('real').length>0&&lineTexts('plain').length>0);
});

test('every landmark gives the real briar a reachable spot to walk to',()=>{
 const sim=new C.Simulation(witnessSave('nearshore'));
 for(const l of C.LANDMARKS){
  sim.state.saga.briar.habit={[l.id]:1};
  const spot=NEAR.habitSpot(sim);
  assert.equal(spot.id,l.id);
  assert.ok(C.walkable(spot.x,spot.z,sim.navRoom,.31),'walkable spot for '+l.id);
  assert.ok(C.pathfind({x:NEAR.REAL_START.x,z:NEAR.REAL_START.z},spot,sim.navRoom,false,.31),'path to '+l.id);
 }
});

test('arrival speaks the pier then the offer, and a reload keeps the nearshore with both foxes rebuilt',()=>{
 let sim=new C.Simulation(witnessSave('taken'));
 const arrived=NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());
 assert.equal(arrived.ok,true,arrived.error);
 assert.deepEqual(arrived.lines,[...lineTexts('pier'),...lineTexts('arrive')]);
 assert.equal(sim.state.saga.briar.state,'nearshore');
 assert.equal(NEAR.command(ctxOf(sim),'arrive',pay(sim),saves()).duplicate,true);
 walk(sim,1);
 let v=NEAR.view(sim);
 assert.ok(v.real&&v.fake,'the real briar and the faultless one at the heel');
 assert.ok(dist(v.fake,sim.state.player)<2);
 sim=new C.Simulation(C.validate(clone(sim.snapshot())));
 assert.equal(NEAR.active(sim),true);
 walk(sim,60);
 v=NEAR.view(sim);
 assert.equal(NEAR.habitSpot(sim).id,'commons');
 assert.equal(v.real.sit,true,'the real briar sits where she used to');
 assert.ok(dist(v.real,NEAR.habitSpot(sim))<.1);
});

test('the heel prompt: wait changes nothing; the real fox needs no prompt',()=>{
 const sim=new C.Simulation(witnessSave('taken'));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const v=NEAR.view(sim);
 sim.state.player={x:v.fake.x,z:v.fake.z,yaw:0};
 assert.equal(NEAR.foxAt(sim),'false');
 const before=clone(sim.state.saga);
 const asked=NEAR.command(ctxOf(sim),'choose',pay(sim,{fox:'false'}),saves());
 assert.equal(asked.ok,true);assert.equal(asked.heel,true,'E on the heel fox asks first');
 assert.deepEqual(asked.options.map(o=>o.id),['take','wait']);
 assert.deepEqual(sim.state.saga,before,'asking saves nothing');
 const waited=NEAR.command(ctxOf(sim),'heel-answer',pay(sim,{take:false}),saves());
 assert.equal(waited.ok,true);assert.deepEqual(sim.state.saga,before,'wait saves nothing');
 assert.ok(NEAR.view(sim).fake,'the fox stays at the heel');
});

test('take sends briar-false; the faultless fox leaves for good; the real briar can still be answered',()=>{
 const sim=new C.Simulation(witnessSave('taken'));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const v=NEAR.view(sim);
 sim.state.player={x:v.fake.x,z:v.fake.z,yaw:0};
 NEAR.command(ctxOf(sim),'choose',pay(sim,{fox:'false'}),saves());
 const taken=NEAR.command(ctxOf(sim),'heel-answer',pay(sim,{take:true}),saves());
 assert.equal(taken.ok,true,taken.error);
 assert.match(taken.text,/comes apart like ash/);
 assert.equal(sim.state.saga.briar.falseTrusted,true);
 assert.equal(NEAR.view(sim).fake,null,'the faultless fox is gone');
 assert.equal(NEAR.active(sim),true,'the real briar is still at the nearshore');
 const again=NEAR.view(sim);sim.state.player={x:again.real.x+.3,z:again.real.z,yaw:0};
 assert.equal(NEAR.foxAt(sim),'real');
});

test('the real briar comes home with her habit intact; a refused save adopts nothing; home on the first evening',()=>{
 let sim=new C.Simulation(witnessSave('taken',{commons:2,market:1}));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const v=NEAR.view(sim);
 sim.state.player={x:v.real.x+.3,z:v.real.z,yaw:0};
 const refused=NEAR.command(ctxOf(sim),'choose',pay(sim,{fox:'real'}),saves({ok:false,error:'disk full'}));
 assert.equal(refused.ok,false);assert.equal(sim.state.saga.briar.state,'nearshore','nothing adopted');
 sim=new C.Simulation(C.validate(clone(sim.snapshot())));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const again=NEAR.view(sim);sim.state.player={x:again.real.x+.3,z:again.real.z,yaw:0};
 const home=clone(sim.state.saga.briar.habit);
 const back=NEAR.command(ctxOf(sim),'choose',pay(sim,{fox:'real'}),saves());
 assert.equal(back.ok,true,back.error);
 assert.equal(back.lines.length,lineTexts('real').length,'the real answer speaks the script');
 assert.equal(sim.state.saga.briar.state,'returned');
 assert.equal(sim.state.saga.briar.returnedDay,sim.state.day);
 assert.deepEqual(sim.state.saga.briar.habit,home,'her habits are not reset on return');
 assert.equal(sim.state.adventure.companion.mode,'follow');
 assert.equal(NEAR.active(sim),false);
 sim.state.hour=10;
 assert.equal(NEAR.command(ctxOf(sim),'home',pay(sim),saves()).ok,false,'not yet the evening');
 sim.state.hour=19;
 const settled=NEAR.command(ctxOf(sim),'home',pay(sim),saves());
 assert.equal(settled.ok,true,settled.error);
 assert.deepEqual(settled.lines,lineTexts('home'));
 assert.equal(sim.state.saga.briar.homeDay,sim.state.day);
 assert.equal(NEAR.command(ctxOf(sim),'home',pay(sim),saves()).duplicate,true);
});

test('never bonded: arriving at the pier speaks the pier then the plain scene, and the nearshore beat is marked',()=>{
 const raw=clone(JSON.parse(fs.readFileSync(path.join(ROOT,FIXTURE),'utf8')));
 raw.adventure.companion.bonded=false;
 raw.saga={version:1,beats:{night:{day:1}},regent:['confluence'],prophecy:['spring','heaven'],feather:{unlocked:true,uses:0},
  briar:{state:'with',habit:{},takenDay:null,returnedDay:null,homeDay:null},echo:{coercive:[],freeing:[]},finale:{phase:0,won:false},credits:false,postgame:false};
 raw.player={x:0,z:26,yaw:0};
 const sim=new C.Simulation(C.validate(raw));
 const plain=NEAR.command(ctxOf(sim),'plain',pay(sim),saves());
 assert.equal(plain.ok,true,plain.error);
 assert.deepEqual(plain.lines,[...lineTexts('pier'),...lineTexts('plain')]);
 assert.equal(Object.hasOwn(sim.state.saga.beats,'nearshore'),true,'the saga marks the beat');
 assert.equal(SG.done(sim.state,'nearshore'),true);
 assert.equal(NEAR.command(ctxOf(sim),'plain',pay(sim),saves()).duplicate,true);
});

test('the faultless fox is drawn only while she is not yet taken home',()=>{
 const sim=new C.Simulation(witnessSave('taken'));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const full={box:[],round:[],octa:[]};globalThis.RealmNearshoreArt.draw(full,sim);
 sim.state.saga.briar.falseTrusted=true;
 const alone={box:[],round:[],octa:[]};globalThis.RealmNearshoreArt.draw(alone,sim);
 assert.ok(full.box.length>alone.box.length,'the faultless fox adds its parts');
 assert.ok(alone.box.length>0,'the real briar is drawn');
});
