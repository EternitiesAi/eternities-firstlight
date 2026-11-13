'use strict';
/* The witness act's gates and the nearshore, through the real owners. Saves start from an earned fixture with
 * atlantis and cosmos finished; Briar is taken by a saga record the validator checks. A reload runs in the middle
 * of the nearshore, and both answers are tested: the real briar comes home, the faultless one dissolves. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.join(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),SG=require(path.join(ROOT,'src/saga.js')),RT=require(path.join(ROOT,'src/realm-trails.js'));
require(path.join(ROOT,'src/companion-art.js'));
const NEAR=require(path.join(ROOT,'src/nearshore.js'));require(path.join(ROOT,'src/nearshore-art.js'));
const FIXTURE='tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
const clone=o=>JSON.parse(JSON.stringify(o));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Earned witness save: heaven, both doors and both campaigns are finished, the sighting is in the saga.
function witnessSave(briar='taken',habit={commons:2}){
 const raw=clone(JSON.parse(fs.readFileSync(path.join(ROOT,FIXTURE),'utf8')));
 raw.saga={version:1,beats:{},regent:['confluence'],prophecy:['spring','heaven'],feather:{unlocked:true,uses:0},
  briar:{state:briar,habit:{...habit},takenDay:briar==='with'?null:1,returnedDay:null,homeDay:null},
  echo:{coercive:[],freeing:[]},finale:{phase:0,won:false},credits:false,postgame:false};
 raw.player={x:0,z:26,yaw:0};
 return C.validate(raw);
}
const ctxOf=sim=>({sim,active:'witness-test'});
const pay=(sim,p={})=>({expectedActive:'witness-test',expectedRevision:sim.state.adventure.revision,...p});
const saves=(result={ok:true})=>({save:()=>result});
function walk(sim,seconds){for(let t=0;t<seconds-1e-9;t+=.05){sim.elapsed+=.05;NEAR.view(sim);}}

test('the doors, the witness and the nearshore follow the saga order',()=>{
 assert.equal(SG.allowed(C.fresh(),'atlantis'),false);
 assert.equal(SG.allowed(C.fresh(),'cosmos'),false);
 assert.equal(SG.allowed(C.fresh(),'nearshore'),false);
 assert.equal(RT.definition('atlantis-bellglass-chart-v1').gate,'atlantis');
 assert.equal(RT.definition('cosmos-split-bearing-v1').gate,'cosmos');
 const s=witnessSave();
 assert.equal(SG.done(s,'witness'),true);
 assert.equal(SG.allowed(s,'nearshore'),true);
 const noSighting=clone(s);noSighting.saga.regent=[];
 assert.equal(SG.done(noSighting,'witness'),false,'both claims without the confluence sighting do not finish the witness');
 const noCosmos=clone(s);noCosmos.cosmosCampaign.claimed=false;
 assert.equal(SG.done(noCosmos,'witness'),false);
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

test('nearshore: arrival, a reload in the middle, the real briar walks to her habit and sits',()=>{
 let sim=new C.Simulation(witnessSave('taken'));
 const arrived=NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());
 assert.equal(arrived.ok,true,arrived.error);
 assert.equal(sim.state.saga.briar.state,'nearshore');
 assert.equal(NEAR.command(ctxOf(sim),'arrive',pay(sim),saves()).duplicate,true,'arriving twice changes nothing');
 walk(sim,1);
 let v=NEAR.view(sim);
 assert.ok(v.real&&v.fake.state==='heel','two foxes: the real one and the one at heel');
 assert.ok(dist(v.fake,sim.state.player)<2,'the faultless briar stays at the heel');
 // reload: the saga state persists; the foxes are rebuilt at the pier.
 sim=new C.Simulation(C.validate(clone(sim.snapshot())));
 assert.equal(sim.state.saga.briar.state,'nearshore');
 assert.equal(NEAR.active(sim),true);
 walk(sim,60);
 v=NEAR.view(sim);
 const spot=NEAR.habitSpot(sim);
 assert.equal(spot.id,'commons');
 assert.equal(v.real.sit,true,'the real briar sits where she used to');
 assert.ok(dist(v.real,spot)<.1,'at her habit landmark');
 assert.ok(dist(v.real,NEAR.REAL_START)>10,'she walked there from the pier');
});

test('a faultless fox at your heel is a soft failure; the fox comes back to try again',()=>{
 const sim=new C.Simulation(witnessSave('taken'));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const v=NEAR.view(sim);
 sim.state.player={x:v.fake.x,z:v.fake.z,yaw:0};
 assert.equal(NEAR.foxAt(sim),'false');
 const before=clone(sim.state.saga);
 const wrong=NEAR.command(ctxOf(sim),'choose',pay(sim,{fox:'false'}),saves());
 assert.equal(wrong.ok,true);assert.equal(wrong.soft,true);
 assert.match(wrong.text,/You knew her too late/);
 assert.deepEqual(sim.state.saga,before,'a wrong answer saves nothing');
 walk(sim,2.2);
 assert.equal(NEAR.view(sim).fake.state,'gone');
 walk(sim,3.2);
 assert.equal(NEAR.view(sim).fake.state,'heel','the faultless fox forms again: no lock-out');
 assert.equal(sim.state.saga.briar.state,'nearshore');
});

test('the real briar comes home with her habit intact; a refused save adopts nothing; home on the first evening',()=>{
 let sim=new C.Simulation(witnessSave('taken',{commons:2,market:1}));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const v=NEAR.view(sim);
 sim.state.player={x:v.real.x+.3,z:v.real.z,yaw:0};
 assert.equal(NEAR.foxAt(sim),'real');
 const refused=NEAR.command(ctxOf(sim),'choose',pay(sim,{fox:'real'}),saves({ok:false,error:'disk full'}));
 assert.equal(refused.ok,false);assert.equal(sim.state.saga.briar.state,'nearshore','nothing adopted');
 sim=new C.Simulation(C.validate(clone(sim.snapshot())));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const again=NEAR.view(sim);sim.state.player={x:again.real.x+.3,z:again.real.z,yaw:0};
 const home=clone(sim.state.saga.briar.habit);
 const back=NEAR.command(ctxOf(sim),'choose',pay(sim,{fox:'real'}),saves());
 assert.equal(back.ok,true,back.error);
 assert.equal(sim.state.saga.briar.state,'returned');
 assert.equal(sim.state.saga.briar.returnedDay,sim.state.day);
 assert.deepEqual(sim.state.saga.briar.habit,home,'her habits are not reset on return');
 assert.equal(sim.state.adventure.companion.mode,'follow');
 assert.equal(NEAR.active(sim),false,'the nearshore foxes give way to Briar');
 sim.state.hour=10;
 assert.equal(NEAR.command(ctxOf(sim),'home',pay(sim),saves()).ok,false,'not yet the evening');
 sim.state.hour=19;
 const settled=NEAR.command(ctxOf(sim),'home',pay(sim),saves());
 assert.equal(settled.ok,true,settled.error);
 assert.equal(sim.state.saga.briar.homeDay,sim.state.day);
 assert.equal(NEAR.command(ctxOf(sim),'home',pay(sim),saves()).duplicate,true);
 assert.deepEqual(sim.state.saga.briar.habit,home,'the bowl evening keeps the habit too');
});

test('the two foxes are drawn from the Briar parts; a cold fox flickers and then leaves the scene',()=>{
 const sim=new C.Simulation(witnessSave('taken'));
 NEAR.command(ctxOf(sim),'arrive',pay(sim),saves());walk(sim,60);
 const full={box:[],round:[],octa:[]};G_draw(full,sim);
 const v=NEAR.view(sim);v.fake.state='gone';
 const alone={box:[],round:[],octa:[]};G_draw(alone,sim);
 assert.ok(full.box.length>alone.box.length,'the faultless fox adds its parts');
 assert.ok(alone.box.length>0,'the real briar is drawn');
});
function G_draw(out,sim){globalThis.RealmNearshoreArt.draw(out,sim);}
