'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {definition:d,patterns}=require('../src/hell-campaign-data.js');
const C=require('../src/core.js');
const W=require('../src/world-foundations.js');
const north=require('../src/realm-trails-north.js');
const keys=(value,expected)=>assert.deepEqual(Object.keys(value).sort(),expected.slice().sort());
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const stable=/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const steps=new Map(d.steps.map(s=>[s.id,s]));
function frozen(value){if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozen);}}
function route(a,b,radius=.31){
 assert.ok(W.walkable(d.room,a.x,a.z,radius),'start has actual supported clear ground for this body');
 assert.ok(W.walkable(d.room,b.x,b.z,radius),'destination has actual supported clear ground for this body');
 const points=C.pathfind(a,b,{id:d.room},false,radius);
 assert.ok(points?.length,'production pathfinding reaches the authored anchor');
 let previous=a;
 for(const point of points){assert.ok(W.segment(d.room,previous,point,radius),'every complete segment clears actual solids and support for this body');previous=point;}
 assert.ok(distance(previous,b)<1e-8,'path ends at the exact authored anchor');
 return points;
}

test('Hell campaign data: exact frozen catalogue, source boundary and import without gameplay mutation',()=>{
 keys(globalThis.RealmHellCampaignData,['definition','patterns']);frozen(globalThis.RealmHellCampaignData);
 keys(d,['id','title','room','realm','prerequisite','giver','reward','summary','danger','completionText','steps','choices','enemy']);
 assert.equal(d.id,'hell-last-unclaimed-road-v1');assert.equal(d.room,'world-hell');assert.equal(d.realm,'hell');
 assert.equal(d.prerequisite,'hell-open-cage-v1');
 assert.equal(north.definitions.find(v=>v.id===d.prerequisite)?.realm,d.realm);
 const old=W.definition(d.realm),giver=old.points.find(p=>p.id===d.giver.id);
 keys(d.giver,['id','name','x','z']);assert.equal(giver?.kind,'person');assert.equal(distance(giver,d.giver),0);
 assert.notEqual(d.id,old.quest.id);assert.ok(!north.definitions.some(v=>v.id===d.id));
 assert.ok(!old.enemies.some(v=>v.id===d.enemy.id));assert.ok(!north.definitions.some(v=>v.enemy?.id===d.enemy.id));
 const sentinel={untouched:true},sandbox={RealmTrailsNorth:sentinel,RealmWorldFoundations:sentinel,module:{exports:{}}};
 const before=new Set(Object.keys(sandbox));
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/hell-campaign-data.js'),'utf8'),sandbox);
 assert.strictEqual(sandbox.RealmTrailsNorth,sentinel);assert.strictEqual(sandbox.RealmWorldFoundations,sentinel);
 assert.deepEqual(Object.keys(sandbox).filter(k=>!before.has(k)),['RealmHellCampaignData']);
 assert.strictEqual(sandbox.module.exports,sandbox.RealmHellCampaignData);
 assert.match(d.summary,/provisional authored adaptations/);assert.match(d.danger,/inner foundry remains closed/);
 assert.match(d.completionText,/not a claim that he was killed/);
});

test('Hell campaign graph: consent, real combat, stabilization, deliberate disposition and verification',()=>{
 assert.equal(steps.size,d.steps.length,'all step identities are distinct');
 for(const s of d.steps){
  keys(s,['id','name','x','z','medium','kind','requires','optional','text']);
  assert.ok(stable.test(s.id));assert.ok(s.name&&s.text);assert.ok([s.x,s.z].every(Number.isFinite));
  assert.equal(s.medium,'dry');assert.ok(['interact','defeat','choice'].includes(s.kind));assert.equal(typeof s.optional,'boolean');
  assert.equal(new Set(s.requires).size,s.requires.length);
 }
 const visiting=new Set(),done=new Set();
 function visit(id){
  const s=steps.get(id);assert.ok(s,'prerequisites name authored steps');assert.ok(!visiting.has(id),'no prerequisite cycle');
  if(done.has(id))return;visiting.add(id);
  for(const required of s.requires){assert.ok(s.optional||!steps.get(required)?.optional,'optional preparation never gates required completion');visit(required);}
  visiting.delete(id);done.add(id);
 }
 d.steps.forEach(s=>visit(s.id));
 assert.deepEqual(d.steps.filter(s=>s.optional).map(s=>s.id),['west-shunt','east-brace']);
 assert.deepEqual(d.enemy.spawnAfter,['challenge-veyr']);assert.equal(d.enemy.defeatStep,'warden-resolved');
 assert.equal(steps.get('warden-resolved').kind,'defeat');assert.deepEqual(steps.get('warden-resolved').requires,['challenge-veyr']);
 assert.deepEqual(steps.get('stabilize-service-engine').requires,['warden-resolved']);
 assert.deepEqual(steps.get('disposition').requires,['stabilize-service-engine']);assert.equal(steps.get('disposition').kind,'choice');
 assert.deepEqual(steps.get('verify-route').requires,['disposition']);
 assert.equal(d.steps.some(s=>s.id==='claim'),false,'claim is a separate giver transaction after physical work');
 assert.equal(distance(steps.get('warden-resolved'),d.enemy),0,'defeat anchor is the actual declared boss');
});

test('Hell campaign geography: all authored anchors use supported existing ground and production paths',()=>{
 const world=W.definition(d.realm),home=world.points.find(p=>p.kind==='return');
 assert.equal(world.room,d.room);assert.equal(distance(home,{x:0,z:35}),0,'original free home anchor is retained');
 const original=north.definitions.find(v=>v.id===d.prerequisite);
 assert.equal(distance(steps.get('witness-record'),original.escort.route.at(-1)),0,'Neris is at her already-saved safe arrival');
 assert.equal(distance(steps.get('tovan-account'),world.points.find(p=>p.id==='hell-tovan')),0,'same existing Tovan anchor');
 for(const id of['read-service-writ','verify-route'])assert.equal(distance(steps.get(id),world.points.find(p=>p.id==='hell-bell-yard-plate')),0);
 const closed=world.solids.find(s=>s.id==='hell-bell-yard-closed-works');assert.ok(closed);
 for(const p of[d.giver,...d.steps]){assert.ok(W.walkable(d.room,p.x,p.z));route(world.entry,p);route(p,home);}
 assert.ok(W.walkable(d.room,d.enemy.x,d.enemy.z,d.enemy.radius),'declared boss body clears the current actual ground and solids');
 assert.ok(steps.get('stabilize-service-engine').z>closed.z+closed.d/2+.31,'engine stays on the open exterior side of the closed works');
 for(const id of['west-shunt','east-brace','stabilize-service-engine'])assert.ok(W.segment(d.room,d.enemy,steps.get(id)),'boss/support/engine connecting segment is physically clear');
 assert.equal(W.segment(d.room,{x:0,z:-105},{x:0,z:-114}),false,'closed foundry is still a physical obstruction');
});

test('Hell campaign patterns: distinct fixed locked-shape terms and narrow optional recovery supports',()=>{
 keys(d.enemy,['id','name','kind','x','z','hp','damage','radius','spawnAfter','defeatStep']);
 assert.deepEqual(d.enemy,{id:'hell-tithe-warden-v1',name:'Tithe-Warden Veyr',kind:'sentinel',x:0,z:-99,hp:120,damage:12,radius:.65,spawnAfter:['challenge-veyr'],defeatStep:'warden-resolved'});
 assert.deepEqual(patterns,{sweep:{reach:5.5,length:3.8,halfWidth:2,windup:1.35,recovery:2.2,support:'west-shunt'},line:{reach:7,length:6,halfWidth:.65,windup:1.35,recovery:2.2,support:'east-brace'}});
 assert.ok(patterns.sweep.halfWidth>patterns.line.halfWidth);assert.ok(patterns.line.length>patterns.sweep.length);
 for(const p of Object.values(patterns)){
  keys(p,['reach','length','halfWidth','windup','recovery','support']);
  assert.ok(steps.get(p.support)?.optional);assert.match(steps.get(p.support).text,/exactly 0\.6 seconds/);
  for(const k of['reach','length','halfWidth','windup','recovery'])assert.ok(Number.isFinite(p[k])&&p[k]>0);
 }
 assert.match(d.danger,/Below half health the order varies without raising damage or speed/);
 assert.match(d.danger,/free road home remains available/);
});

test('Hell campaign body clearance: production paths respect Veyr radius around existing Bell Yard support',()=>{
 const world=W.definition(d.realm),support=world.solids.find(s=>s.id==='hell-bell-yard-west-support');
 assert.ok(support,'the detour uses existing solid cover');
 const start={x:support.x+4,z:support.z+2},end={x:support.x-3,z:support.z-1};
 assert.equal(W.segment(d.room,start,end,d.enemy.radius),false,'a direct line is blocked by the existing support');
 assert.ok(route(start,end,d.enemy.radius).length>1,'the body-qualified production path actually routes around the support');
 assert.ok(route(d.enemy,{x:-14.6,z:-104.1},d.enemy.radius).length>1,'Veyr also routes around the existing bell base with full body clearance');

 const bell=world.solids.find(s=>s.id==='hell-bell-yard-bell-base');assert.ok(bell);
 const narrow={x:bell.x+bell.w/2+.5,z:bell.z-.2};
 assert.equal(W.walkable(d.room,narrow.x,narrow.z,.31),true,'the existing half-unit clearance beside cover admits the player body');
 assert.equal(W.walkable(d.room,narrow.x,narrow.z,d.enemy.radius),false,'the same actual clearance cannot admit the wider warden');
 assert.ok(C.pathfind(d.enemy,narrow,{id:d.room})?.length,'the default player-radius path remains available');
 assert.equal(C.pathfind(d.enemy,narrow,{id:d.room},false,d.enemy.radius),null,'the explicit warden-radius path rejects the narrow destination');
});

test('Hell campaign outcomes: three lasting local choices retain safety, truth and one common fixed fee',()=>{
 assert.deepEqual(d.reward,{xp:45,coins:20,ore:4,materials:{wood:3,fiber:2}});
 assert.deepEqual(d.choices.map(c=>c.id),['unbind','divert','license']);
 for(const c of d.choices){
  keys(c,['id','name','text','consequence']);assert.ok(c.name&&c.text&&c.consequence);
  assert.match(c.text,/Neris/);assert.match(c.consequence,/permanently/);assert.match(c.consequence,/fee remains unchanged/);
  assert.doesNotMatch(c.text+c.consequence,/grants? (?:a|the) (?:class|recipe|global|online)|auto-equip|free gear/i);
 }
 assert.match(d.choices[0].text,/without a named patron docket/);
 assert.match(d.choices[1].text,/outer compulsory writ remains/);
 assert.match(d.choices[2].text,/other compulsory claims remain/);
 assert.match(d.choices[2].text,/not an automatic global oath/);
 assert.match(d.choices[2].consequence,/restitution branches are pending/);
 assert.match(steps.get('disposition').text,/does not assign a class or change Grace, Cinder, renunciation or global allegiance/);
 assert.match(d.completionText,/not a promised upgrade for every veteran/);
 assert.match(d.completionText,/No equipment was fitted or equipped/);
 assert.match(d.completionText,/paid the fixed 20 sunmarks, 4 ore, 3 timber and 2 fibre once; XP credits up to 45 within the existing stored cap/);
 assert.doesNotMatch(d.completionText,/has paid (?:the declared )?45 XP/,'completion never claims capped XP was received unconditionally');
});
