const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js');
const F=require('../src/first-run.js');
const fresh=()=>new C.Simulation(C.fresh());
test('the card is visible until dismissed or every step is done',()=>{
 assert.equal(F.visible(null),false);
 assert.equal(F.visible({move:false,camera:false,attack:false,interact:false,dismissed:false}),true);
 assert.equal(F.visible({move:true,camera:true,attack:true,interact:true,dismissed:true}),false);
});
test('rows keep the teaching order and mirror the flags',()=>{
 const rows=F.rows({move:true,camera:false,attack:true,interact:false,dismissed:false});
 assert.deepEqual(rows.map(r=>r.id),['move','camera','attack','interact']);
 assert.deepEqual(rows.map(r=>r.done),[true,false,true,false]);
 for(const r of rows)assert.doesNotMatch(r.text,/prototype|luna|realm 10/i);
});
test('each step ticks once through the world command and the card clears after the last one',()=>{
 const sim=fresh();
 const first=sim.act('first-run:camera','first-run',{step:'camera'});
 assert.equal(first.ok,true);assert.equal(first.changed,true);
 assert.equal(sim.state.firstRun.camera,true);
 const again=sim.act('first-run:camera','first-run',{step:'camera'});
 assert.equal(again.duplicate,true);
 for(const step of['move','attack','interact'])sim.act('first-run:'+step,'first-run',{step});
 assert.equal(sim.state.firstRun.dismissed,true);
 assert.equal(F.visible(sim.state.firstRun),false);
});
test('a dismissed card stays dismissed and ignores later steps',()=>{
 const sim=fresh();
 assert.equal(sim.act('first-run-dismiss','first-run-dismiss',{}).ok,true);
 const r=sim.act('first-run:move','first-run',{step:'move'});
 assert.equal(r.changed,false);
 assert.equal(sim.state.firstRun.move,false);
});
test('unknown steps are refused without changing the flags',()=>{
 const sim=fresh();
 const r=sim.act('first-run:fly','first-run',{step:'fly'});
 assert.equal(r.ok,false);
 assert.deepEqual(sim.state.firstRun,C.fresh().firstRun);
});
test('the flags survive a save round trip',()=>{
 const sim=fresh();sim.act('first-run:move','first-run',{step:'move'});
 const back=C.validate(sim.snapshot());
 assert.equal(back.firstRun.move,true);assert.equal(back.firstRun.dismissed,false);
});
