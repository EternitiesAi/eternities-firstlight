/* Real canonical geography and existing task sites, synthetic body samples. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/earth.js'),R=require('../src/earth-tournament.js'),Q=require('../src/gathering.js'),Story=require('../src/earth-story.js');
test('the full ring and entry rays fit current authoritative ground without moving other tasks',()=>{
 const a=R.definition.arena,entry=R.definition.giver,before=JSON.stringify([E.PATCHES,E.SOLIDS,E.POINTS,Q.TASKS,Story.STEPS]);let samples=0;
 for(let radius=0;radius<a.radius-a.bodyRadius;radius+=.25)for(let i=0;i<64;i++){
  const p={x:a.x+Math.sin(i*Math.PI/32)*radius,z:a.z+Math.cos(i*Math.PI/32)*radius};
  assert.ok(E.walkable(p.x,p.z,a.bodyRadius),JSON.stringify(p));assert.ok(E.segment(entry,p,a.bodyRadius),JSON.stringify(p));samples++;
 }
 assert.equal(samples,1088);assert.ok(C.pathfind(E.ENTRY,entry,{id:E.ROOM}));assert.equal(JSON.stringify([E.PATCHES,E.SOLIDS,E.POINTS,Q.TASKS,Story.STEPS]),before);
});
test('an existing hospitality lantern or roadwork objective cannot occupy the competitive ring',()=>{
 const a=R.definition.arena;for(const p of [...Q.TASKS,...Story.STEPS])assert.ok(Math.hypot(a.x-p.x,a.z-p.z)>a.radius+.5,p.id+' must keep its own clear approach');
});
