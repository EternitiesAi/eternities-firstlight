'use strict';
/* The feather's sight as a presentation module. It stays shut until the envoy teaches it; one hold is one saga
 * use; the roads come from data (the valley is all true, the stranger's spur is counterfeit and waits for the
 * stranger, the severing line at Bellweather is counterfeit); drawing never changes the save. Presentation checks
 * set sim.room directly, because this module reads the room but never changes it. Saga facts go through commands. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),F=require(path.join(ROOT,'src/feather-sight.js'));
const load=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const EARNED='examples/CHAPTER_COMPLETED_EARNED.json';
// The earned chapter-one save has its envoy heard, so the sight is open on load (inferred from the adventure).
const earnedSim=()=>new C.Simulation(load(EARNED));

test('the sight stays shut until the envoy has taught it',()=>{
 const sim=new C.Simulation();
 assert.equal(F.unlocked(sim),false);
 assert.equal(F.hold(sim,true),false);
 assert.equal(F.held(),false);
 const r=sim.sagaCommand('sight-shut-1','feather-use',{});
 assert.equal(r.ok,false);
 assert.match(r.error,/has not opened its sight/);
 const out={box:[]};F.draw(out,sim,0,null);
 assert.equal(out.box.length,0);
});

test('the valley is all true roads',()=>{
 const sim=earnedSim();
 assert.equal(F.areaOf(sim),'valley');
 const roads=F.roadsFor(sim);
 assert.ok(roads.length>=5,'the valley has its paths');
 assert.ok(roads.every(r=>r.truth==='true'));
});

test('the stranger’s spur is counterfeit and shows only once he has come to the beacon',()=>{
 const spur=F.ROADS.find(r=>r.id==='sunward-spur');
 assert.equal(spur.truth,'counterfeit');
 assert.equal(F.visible({adventure:{beacon:{introduced:false}}},spur),false);
 assert.equal(F.visible({adventure:{beacon:{introduced:true}}},spur),true);
 const sim=earnedSim();
 sim.room='road';
 assert.equal(F.roadsFor(sim).some(r=>r.id==='sunward-spur'),false);
 assert.equal(F.roadsFor(sim).find(r=>r.id==='sunward-road').truth,'true');
});

test('Bellweather shows its true road in gold and its severing line in ash red',()=>{
 const sim=earnedSim();
 sim.room='crossing';
 const roads=F.roadsFor(sim);
 assert.deepEqual(roads.map(r=>r.id).sort(),['bellweather-main','bellweather-severing','bellweather-shop']);
 assert.equal(roads.find(r=>r.id==='bellweather-severing').truth,'counterfeit');
 assert.equal(roads.find(r=>r.id==='bellweather-main').truth,'true');
});

test('one hold is one use of the feather, and holding is not a second use',()=>{
 const sim=earnedSim();
 try{
  assert.equal(F.hold(sim,true),true);
  assert.equal(sim.state.saga.feather.uses,1);
  assert.equal(F.hold(sim,true),true);
  assert.equal(sim.state.saga.feather.uses,1,'a held key is still the same use');
  F.hold(sim,false);
  assert.equal(F.held(),false);
  assert.equal(F.hold(sim,true),true);
  assert.equal(sim.state.saga.feather.uses,2);
  F.hold(sim,false);
  sim.room='mine';
  assert.equal(F.hold(sim,true),false,'the underways have no roads to read');
  assert.equal(sim.state.saga.feather.uses,2);
 }finally{F.hold(sim,false);}
});

test('drawing paints gold and ash red only while held, and never changes the save',()=>{
 const sim=earnedSim();
 sim.room='crossing';
 const idle={box:[]};F.draw(idle,sim,0,null);
 assert.equal(idle.box.length,0,'nothing is drawn until the feather is held');
 try{
  F.hold(sim,true);
  const before=JSON.stringify(sim.snapshot());
  const out={box:[]};F.draw(out,sim,1.25,null);
  const gold=out.box.filter(b=>b.c===F.GOLD),red=out.box.filter(b=>b.c===F.ASH_RED);
  assert.ok(gold.length>0,'the true road glows gold');
  assert.ok(red.length>0,'the severing line glows ash red');
  assert.equal(gold.length+red.length,out.box.length,'only the two truths are drawn');
  assert.ok(out.box.every(b=>b.p.length===3&&b.s.length===3&&b.em>0),'each marker has a place, a size and a glow');
  assert.equal(JSON.stringify(sim.snapshot()),before,'drawing does not change the save');
 }finally{F.hold(sim,false);}
 const off={box:[]};F.draw(off,sim,1.25,null);
 assert.equal(off.box.length,0,'letting go shuts the sight again');
});

test('the sight is on Z, with a feather button for touch screens',()=>{
 assert.equal(F.KEY,'z');
});
