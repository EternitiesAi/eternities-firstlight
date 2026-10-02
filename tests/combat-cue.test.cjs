/* Labelled synthetic runtime boundaries. Earned fights are checked separately. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),T=require('../src/combat.js');
function setup(){
 const s=new C.Simulation();s.state.player={x:11,z:9,yaw:0};assert.ok(s.adventureCommand('cue-kit','start').ok);
 s.state.player={x:15,z:7,yaw:0};assert.ok(s.adventureCommand('cue-enter','starter-enter').ok);
 const e={id:'synthetic-cue',name:'Synthetic phase fixture',kind:'skitter',hp:56,maxHP:56,x:0,z:9,mode:'windup',timer:1.1,aim:{x:0,z:10}};
 A.runtime(s).enemies.push(e);T.runtime(s).target=e.id;s.state.player={x:0,z:10,yaw:0};return{s,e};
}
test('selected real-time strike and recovery status retain their actual timer without writes',()=>{
 const{s,e}=setup(),before=JSON.stringify({world:s.snapshot(),enemy:e,tactics:T.runtime(s)});
 assert.deepEqual(T.threat(s),{phase:'windup',kind:'strike',remaining:1.1});
 assert.equal(JSON.stringify({world:s.snapshot(),enemy:e,tactics:T.runtime(s)}),before);
 e.mode='recover';e.timer=1.37;assert.deepEqual(T.threat(s),{phase:'recover',kind:'opening',remaining:1.37});
 e.timer=.001;assert.equal(T.threat(s).remaining,.001);
});
for(const [kind,fields,want] of [
 ['charger',{},'charge'],['bellwarden',{custom:'bell',ringMode:'outer'},'bell-outer'],
 ['bellwarden',{custom:'bell',ringMode:'inner'},'bell-inner'],['siegeboss',{eventEnemy:true,aimWard:true},'ward'],
 ['siegeboss',{eventEnemy:true,aimWard:false},'strike']
])test('owner-aware warning '+want,()=>{const{s,e}=setup();Object.assign(e,{kind},fields);assert.equal(T.threat(s).kind,want);});
test('active charge is untimed and distinct from its preceding warning and later opening',()=>{
 const{s,e}=setup();Object.assign(e,{kind:'charger',mode:'charge',timer:-.3,chargeLeft:3});
 assert.deepEqual(T.threat(s),{phase:'charge',kind:'charge',remaining:null});
 e.mode='recover';e.timer=1.8;assert.deepEqual(T.threat(s),{phase:'recover',kind:'opening',remaining:1.8});
});
for(const boundary of ['idle','pursue','return','practice','hidden','defeated','unselected','far','paused','dead-player','noncombat','invalid-timer','expired-timer','unknown-ring','missing-aim','unknown-charge','unknown-owner','invalid-event-kind','invalid-bell-kind'])test('clears cue at '+boundary,()=>{
 const{s,e}=setup();
 if(['idle','pursue','return'].includes(boundary))e.mode=boundary;
 if(boundary==='practice')e.kind='practice';if(boundary==='hidden')e.hidden=true;if(boundary==='defeated')e.hp=0;
 if(boundary==='unselected')T.runtime(s).target=null;if(boundary==='far')e.x=100;
 if(boundary==='paused')s.paused=true;if(boundary==='dead-player')s.state.adventure.hp=0;
 if(boundary==='noncombat')s.room='retreat';if(boundary==='invalid-timer')e.timer=NaN;if(boundary==='expired-timer')e.timer=0;
 if(boundary==='unknown-ring')Object.assign(e,{custom:'bell',ringMode:'unknown'});
 if(boundary==='missing-aim')e.aim=null;if(boundary==='unknown-charge')Object.assign(e,{mode:'charge',kind:'skitter'});
 if(boundary==='unknown-owner')Object.assign(e,{kind:'future-unqualified',eventEnemy:true});
 if(boundary==='invalid-event-kind')e.eventEnemy=true;if(boundary==='invalid-bell-kind')Object.assign(e,{custom:'bell',ringMode:'outer'});
 assert.equal(T.threat(s),null);
});
test('opening cue never promises weapon readiness across reach, stamina or obstruction',()=>{
 const{s,e}=setup();e.mode='recover';e.timer=1.6;
 s.state.player.x=10;assert.equal(T.threat(s).phase,'recover');assert.match(T.readiness(s),/Out of range/);
 s.state.player.x=0;s.state.adventure.owned.push('trail_bow');assert.ok(s.adventureCommand('cue-bow','equip',{id:'trail_bow'}).ok);
 s.state.adventure.stamina=0;assert.equal(T.threat(s).phase,'recover');assert.equal(T.readiness(s),'Recovering stamina');
});
