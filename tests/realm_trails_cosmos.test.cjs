/* Pure catalogue and actual production geometry. No browser, GPU, personal
 * save, reward command or adjustable-interface proof is claimed here. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js'),N=require('../src/cosmos.js');
const api=require('../src/realm-trails-cosmos.js'),q=api.definitions[0];
const near=(a,b,epsilon=1e-10)=>assert.ok(Math.abs(a-b)<=epsilon,`${a} != ${b}`);
function recursivelyFrozen(value){
 if(value&&typeof value==='object'){
  assert.ok(Object.isFrozen(value));Object.values(value).forEach(recursivelyFrozen);
 }
}
function localAngle(p,targets){
 const a=Math.atan2(targets[0].x-p.x,targets[0].z-p.z);
 const b=Math.atan2(targets[1].x-p.x,targets[1].z-p.z);
 return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))*180/Math.PI;
}
const circuit=[
 [3,7],[0,10],[-6,10],[-11,10],[-11,3],[-14,0],[-15,-8],[-15,-19],[-14,-28],
 [-14,-30],[0,-34],[14,-31],[14,-28],[14,-31],[3,-37],[-1,-43],
 [3,-37],[14,-31],[14,-24],[14,-14],[14,-4],[10,2],[3,7]
].map(([x,z])=>({x,z}));

test('one stable finite definition has supported schema and exact declared payment',()=>{
 assert.deepEqual(Object.keys(api),['definitions']);assert.equal(globalThis.RealmTrailsCosmos,api);
 assert.ok(Array.isArray(api.definitions));assert.equal(api.definitions.length,1);
 assert.equal(q.id,'cosmos-split-bearing-v1');assert.equal(q.realm,'cosmos');
 assert.deepEqual(q.giver,{id:'lamps',name:'Teren · route keeper',x:3,z:7});
 assert.deepEqual(q.reward,{xp:25,coins:10,ore:2});
 assert.deepEqual(q.steps.map(s=>s.id),['west-sight','east-sight','service-arm']);
 for(const text of [q.title,q.summary,q.danger,q.completionText,...q.steps.flatMap(s=>[s.name,s.text])]){
  assert.equal(typeof text,'string');assert.ok(text.trim().length>10);
 }
 const ids=new Set(q.steps.map(s=>s.id));assert.equal(ids.size,3);
 for(const s of q.steps){
  assert.equal(s.kind,'interact');assert.equal(s.medium,'dry');assert.equal(s.optional,false);
  assert.ok([s.x,s.z,s.y].every(Number.isFinite));assert.ok(Array.isArray(s.requires));
  assert.ok(s.requires.every(id=>ids.has(id)&&id!==s.id));
 }
 assert.deepEqual(q.steps[0].requires,[]);assert.deepEqual(q.steps[1].requires,[]);
 assert.deepEqual(q.steps[2].requires,['west-sight','east-sight']);
 assert.equal('instrument' in q.steps[2],false,'fitting is a physical third step, not another adjustable station');
});

test('every nested catalogue value is immutable, including target anchors',()=>{
 recursivelyFrozen(api.definitions);
 assert.throws(()=>{q.reward.ore=999;},TypeError);
 assert.throws(()=>{q.steps[0].instrument.targets[0].x=0;},TypeError);
 assert.throws(()=>{q.steps[2].requires.push('imaginary');},TypeError);
});

test('instrument readings follow the actual authored XZ anchors and strict finite scale',()=>{
 for(const [i,expected]of [[0,63.85469061425735],[1,11.183849541231728]]){
  const s=q.steps[i],a=s.instrument;
  assert.deepEqual(Object.keys(a).sort(),['initial','max','min','target','targetLabels','targets','tolerance'].sort());
  assert.deepEqual(a.targets,[{x:-52,z:-110},{x:3,z:-49}]);
  assert.deepEqual(a.targetLabels,['fixed sky image','observatory crown']);
  assert.ok([a.min,a.max,a.target,a.tolerance,a.initial].every(Number.isFinite));
  assert.equal(a.min,0);assert.equal(a.max,90);assert.equal(a.initial,45);assert.equal(a.tolerance,2);
  near(a.target,expected);near(a.target,localAngle(s,a.targets));
  assert.ok(a.target-a.tolerance>=a.min&&a.target+a.tolerance<=a.max);
  assert.ok(Math.abs(a.initial-a.target)>a.tolerance,'initial setting cannot complete either station');
 }
 assert.ok(q.steps[0].instrument.target-q.steps[1].instrument.target>50,'moving stations has a substantial authored comparison');
});

test('both optical targets agree with geometry actually submitted by CosmosArt',()=>{
 require('../src/cosmos-art.js');const submitted=[];
 const art={e:{},begin(){},commit(){},bench(){},
  add(kind,x,y,z,w,h,d,color,options={}){submitted.push({kind,x,y,z,w,h,d,color,options});},
  box(x,y,z,w,h,d,color,options={}){this.add('box',x,y,z,w,h,d,color,options);}};
 globalThis.RealmCosmosArt.make(art);
 const images=submitted.filter(p=>p.kind==='round'&&p.options.skyImage);
 assert.equal(images.length,1);assert.deepEqual({x:images[0].x,z:images[0].z},q.steps[0].instrument.targets[0]);
 assert.equal(images[0].options.cameraSolid,false);assert.equal(images[0].options.cutaway,false);
 const crown=submitted.filter(p=>p.kind==='box'&&p.z===-49&&p.h===.65&&p.d===.75);
 assert.equal(crown.length,24,'actual arched crown submitted, not a source-text match');
 const axis=(Math.min(...crown.map(p=>p.x))+Math.max(...crown.map(p=>p.x)))/2;
 near(axis,q.steps[0].instrument.targets[1].x);assert.equal(crown[0].z,q.steps[0].instrument.targets[1].z);
 assert.ok(crown.every(p=>p.y>N.height(p.x,p.z)+9),'crown is above existing back wall');
});

test('giver and all three actions use actual dry floor, radius clearance and line access',()=>{
 const giver=N.POINTS.find(p=>p.id===q.giver.id);assert.ok(giver);
 assert.equal(giver.x,q.giver.x);assert.equal(giver.z,q.giver.z);
 for(const s of q.steps){
  assert.equal(N.walkable(s.x,s.z,.31),true,s.id);near(s.y,N.height(s.x,s.z));
  assert.equal(N.line({x:s.x+.45,z:s.z+.45},s),true,`${s.id} approach is not behind a solid`);
 }
 assert.equal(N.walkable(3,-47),false,'main instrument remains real solid, no service interaction inside it');
 assert.equal(N.walkable(-52,-110),false,'sky image supplies no supported ground');
});

test('complete out-and-back circuit follows production segments with dense radius-safe samples',()=>{
 let samples=0,length=0;
 for(let i=1;i<circuit.length;i++){
  const a=circuit[i-1],b=circuit[i];assert.equal(N.segment(a,b,.31),true,JSON.stringify({a,b}));
  const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(d/.05));length+=d;
  for(let j=0;j<=n;j++){
   const x=a.x+(b.x-a.x)*j/n,z=a.z+(b.z-a.z)*j/n;
   assert.equal(N.walkable(x,z,.31),true,JSON.stringify({i,j,x,z}));samples++;
  }
 }
 assert.equal(circuit.length-1,22);assert.equal(samples,3505);near(length,173.77652619462182);
 for(const s of q.steps)assert.ok(circuit.some(p=>p.x===s.x&&p.z===s.z));
 assert.deepEqual(circuit[0],q.giver&&{x:q.giver.x,z:q.giver.z});assert.deepEqual(circuit.at(-1),circuit[0]);
 assert.equal(N.segment({x:-6,z:10},{x:-14,z:0}),false,'the refuge wall blocks a misleading straight shortcut');
 assert.equal(N.segment(q.steps[0],q.steps[1]),false,'central ridge cannot be crossed between sight stations');
});

test('data loading and browser export do not invoke save, simulation, reward or art authority',()=>{
 const sim=new C.Simulation(C.fresh()),before=JSON.stringify(sim.state),source=fs.readFileSync(path.join(__dirname,'../src/realm-trails-cosmos.js'),'utf8');
 const trap=new Proxy({}, {get(){throw Error('authority accessed by catalogue');}});
 const sandbox={RealmCore:trap,RealmAdventure:trap,RealmWorldFoundations:trap,RealmTrails:trap,RealmCosmosArt:trap};
 vm.runInNewContext(source,sandbox,{filename:'realm-trails-cosmos.js'});
 assert.ok(Array.isArray(sandbox.RealmTrailsCosmos.definitions));
 assert.equal(JSON.stringify(sandbox.RealmTrailsCosmos.definitions),JSON.stringify(api.definitions));
 recursivelyFrozen(sandbox.RealmTrailsCosmos.definitions);assert.equal(JSON.stringify(sim.state),before);
});
