const {test}=require('node:test'),assert=require('node:assert/strict');
const V=require('../src/combat-view.js');
const input=()=>({preset:'adventure',player:{x:0,z:0},enemy:{id:'accepted',x:2,z:-2,hp:136,hidden:false},distance:7.5});
test('explicit close-target framing faces the living foe without mutating input',()=>{const i=input(),before=JSON.stringify(i),r=V.plan(i);assert.ok(r.ok);assert.equal(JSON.stringify(i),before);assert.equal(r.view.yaw,Math.atan2(-2,2));assert.equal(r.view.elevation,.55);assert.equal(r.view.distance,8.5);assert.equal(r.view.tour,false);assert.equal(r.view.overview,false);assert.equal(Object.hasOwn(r.view,'fov'),false);assert.equal(Object.hasOwn(r.view,'center'),false);});
test('framing retains valid farther zoom and bounds eligibility to declared12m',()=>{const i=input();i.distance=20;assert.equal(V.plan(i).view.distance,20);i.enemy={id:'bow',x:0,z:-12,hp:1};assert.ok(V.plan(i).ok);i.enemy.z=-12.01;assert.equal(V.plan(i).ok,false);});
test('no wrong-view, invalid, dead, hidden, coincident or stale actor framing',()=>{for(const mutate of[i=>i.preset='follow',i=>i.enemy=null,i=>i.enemy.hp=0,i=>i.enemy.hidden=true,i=>i.enemy.id='',i=>i.player.x=NaN,i=>i.enemy.z=Infinity,i=>i.enemy.x=i.enemy.z=0,i=>i.distance=21]){const i=input();mutate(i);const before=JSON.stringify(i);assert.equal(V.plan(i).ok,false);assert.equal(JSON.stringify(i),before);}});

test('very close foe deliberately widens framing for a lane behind the player',()=>{const i=input();i.enemy.x=.1;i.enemy.z=0;assert.equal(V.plan(i).view.distance,14);});
test('unobstructed flat close lane and body project above a desktop action bar at45to80FOV',()=>{
 const E=require('../src/engine.js');for(const range of[.05,.3,1,1.5,2.6,4,11,12])for(const fov of[45,60,80]){
  const r=V.plan({preset:'adventure',player:{x:0,z:0},enemy:{id:'probe',x:0,z:-range,hp:1},distance:7.5});assert.ok(r.ok);const v=r.view,e=Object.create(E.Engine.prototype);e.canvas={clientWidth:1440,clientHeight:900};e.setCamera({eye:[0,1.5+Math.sin(v.elevation)*v.distance,Math.cos(v.elevation)*v.distance],target:[0,1.5,0],projection:'perspective',fov,aspect:1.6});
  for(const z of[-range,-range+3.1]){const q=e.project(0,0,z);assert.ok(q.visible&&q.y<760,JSON.stringify({range,fov,q}));}
 }
});
