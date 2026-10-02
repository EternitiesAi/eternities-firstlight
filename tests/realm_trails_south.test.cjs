'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const T=require('../src/realm-trails-south.js');
const C=require('../src/core.js'),W=require('../src/world-foundations.js');
const AR=require('../src/arsenal.js'),S=require('../src/sandbox.js');
const trail=id=>T.definitions.find(d=>d.realm===id);
const earthCircuit=[[-7,97],[0,97],[0,92],[0,16],[-10,15],[-10,-12],[-25,-12],[-25,-11],[-25,-12],[-10,-12],[-10,-34],[1,-35],[14,-34],[14,-19],[28,-19],[28,-16],[30,-25],[28,-19],[14,-19],[14,15],[0,16],[0,92],[0,97],[-3,97],[-7,97]];
const galleryCircuit=[[8,-.5,-19.5],[8,-1.05,-22],[8,-2.55,-28],[8,-2.7,-29.5],[8,-2.7,-32],[8,-2.7,-35],[8,-2.7,-32],[8,-2.7,-29.5],[8,-1.8,-29],[12,-1.8,-29],[12,-1.4,-38.4],[12,-1.4,-39.3]];
function sampled(a,b,visit){
 const n=Math.ceil(Math.hypot(...a.map((v,i)=>b[i]-v))/.05);
 for(let i=0;i<=n;i++)visit(a.map((v,k)=>v+(b[k]-v)*i/n));
}
function allFrozen(value){
 if(value&&typeof value==='object'){
  assert.ok(Object.isFrozen(value));Object.values(value).forEach(allFrozen);
 }
}
function drive(sim,target){
 // Labelled deterministic motion probe, not a new quest command or human run.
 for(let i=0;i<2000;i++){
  const p=sim.state.player,v=sim.worldDive,dx=target[0]-p.x,dz=target[2]-p.z,dy=target[1]-v.y;
  if(Math.hypot(dx,dz)<.015&&Math.abs(dy)<.015)return;
  const horizontal=Math.hypot(dx,dz),dt=horizontal>.005?Math.min(.05,horizontal/2.6):Math.min(.05,Math.abs(dy)/2.6);
  const step=dt*2.6,before=[p.x,v.y,p.z];
  assert.ok(W.swim(sim,horizontal>.005?dx:0,horizontal>.005?dz:0,step?dy/step:0,dt));
  assert.ok(W.swimClear(W.definition(sim.room).dive,p.x,v.y,p.z));
  assert.notDeepEqual([p.x,v.y,p.z],before,'motion must not stall at a wall or ceiling');
 }
 assert.fail('bounded motion did not reach '+JSON.stringify(target));
}
test('both terms are deeply frozen and browser/CommonJS exports agree without mutable service access',()=>{
 assert.equal(T.definitions.length,2);allFrozen(T.definitions);
 assert.throws(()=>T.definitions[0].steps[0].x=100,TypeError);
 const untouched={marker:'sentinel'},context={protectedState:untouched};
 Object.defineProperty(context,'localStorage',{get(){throw Error('data module accessed persistence');}});
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/realm-trails-south.js'),'utf8'),context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.RealmTrailsSouth.definitions)),JSON.parse(JSON.stringify(T.definitions)));
 assert.equal(context.protectedState,untouched);assert.deepEqual(untouched,{marker:'sentinel'});
});
test('stable terms, finite step topology and choice references match the approved data contract',()=>{
 assert.deepEqual(T.definitions.map(d=>d.id),['atlantis-bellglass-chart-v1','earthlands-coastward-materials-v1']);
 for(const d of T.definitions){
  assert.deepEqual(Object.keys(d).sort(),['id','realm','title','summary','danger','giver','reward','completionText','steps'].sort());
  assert.ok(d.steps.length===4);const ids=new Set(d.steps.map(s=>s.id));assert.equal(ids.size,d.steps.length);
  const available=new Set(),remaining=d.steps.slice();
  while(remaining.length){const index=remaining.findIndex(s=>s.requires.every(id=>available.has(id)));assert.notEqual(index,-1,'dependencies must be reachable without a cycle');available.add(remaining.splice(index,1)[0].id);}
  for(const s of d.steps){
   assert.match(s.id,/^[a-z][a-z0-9-]{1,60}$/);assert.equal(s.kind,'interact');assert.equal(s.optional,false);
   assert.ok(['dry','water','court'].includes(s.medium));assert.ok([s.x,s.y,s.z].every(Number.isFinite));
   assert.ok(s.requires.every(id=>ids.has(id)&&id!==s.id));assert.equal(new Set(s.requires).size,s.requires.length);
   if(s.choices){assert.equal(new Set(s.choices.map(c=>c.id)).size,s.choices.length);assert.ok(s.choices.some(c=>c.id===s.correctChoice));}
   else assert.equal(s.correctChoice,undefined);
  }
 }
 const earth=trail('earthlands');assert.deepEqual(earth.steps.find(s=>s.id==='road-pack').requires,['fallen-bough','shore-reeds','shore-stone']);
 const atlas=trail('atlantis');assert.deepEqual(atlas.steps.find(s=>s.id==='depth-chart').requires,['upper-gauge','lower-masonry']);
 assert.deepEqual(atlas.steps.find(s=>s.id==='modern-marker').requires,['depth-chart']);
});
test('givers retain current canonical point ownership and every dry step has supported collision-free ground',()=>{
 for(const d of T.definitions){
  const realm=W.definition(d.realm),giver=realm.points.find(p=>p.id===d.giver.id);
  assert.ok(giver);assert.equal(giver.kind,'person');assert.deepEqual([d.giver.x,d.giver.z],[giver.x,giver.z]);assert.ok(W.walkable(realm.room,giver.x,giver.z));
  for(const s of d.steps.filter(s=>s.medium==='dry')){assert.ok(W.walkable(realm.room,s.x,s.z),s.id);assert.equal(s.y,W.height(realm.room,s.x,s.z));}
 }
});
test('the complete dry circuit follows real supported segments and stays outside the optional foe detection radius',()=>{
 const realm=W.definition('earthlands'),foe=realm.enemies.find(e=>e.id==='earthlands-coppice-skitter');assert.ok(foe);
 let minimum=Infinity,samples=0;
 for(let i=1;i<earthCircuit.length;i++){
  const a=earthCircuit[i-1],b=earthCircuit[i];assert.ok(W.segment(realm.room,{x:a[0],z:a[1]},{x:b[0],z:b[1]}),JSON.stringify([a,b]));
  sampled(a,b,([x,z])=>{assert.ok(W.walkable(realm.room,x,z));minimum=Math.min(minimum,Math.hypot(x-foe.x,z-foe.z));samples++;});
 }
 assert.ok(samples>5000);assert.ok(minimum>8.5,'current skitter detection must remain optional');
 for(const s of trail('earthlands').steps)assert.ok(earthCircuit.some(([x,z])=>x===s.x&&z===s.z),'circuit visits '+s.id);
});
test('underwater and air-court anchors agree with actual full-body clearance and character medium',()=>{
 const realm=W.definition('atlantis'),dive=realm.dive,sim=new C.Simulation();sim.room=realm.room;
 for(const s of trail('atlantis').steps){
  assert.ok(W.swimClear(dive,s.x,s.y,s.z),s.id);
  sim.state.player={x:s.x,z:s.z,yaw:0};sim.worldDive={y:s.y,hold:true,surface:{...realm.entry}};
  const state=W.divingStatus(sim,[s.x,s.y+.85,s.z]);
  assert.equal(state.body,s.medium==='court'?'air':'water',s.id);
  assert.equal(state.dryCourt,s.medium==='court'?'bellglass-air':null,s.id);
  assert.notEqual(s.y,W.height(realm.room,s.x,s.z),'overhead dry deck is a different depth');
 }
 for(let i=1;i<galleryCircuit.length;i++)sampled(galleryCircuit[i-1],galleryCircuit[i],([x,y,z])=>assert.ok(W.swimClear(dive,x,y,z),'full interval clears actual gallery solids'));
});
test('production depth movement reaches every new anchor through the real doorway and east lane, then exits',()=>{
 const realm=W.definition('atlantis'),dive=realm.dive,sim=new C.Simulation();sim.room=realm.room;
 const entry=realm.points.find(p=>p.id===dive.entryId);sim.state.player={x:entry.x,z:entry.z,yaw:0};
 assert.ok(W.diveEnter(sim).ok);
 for(const p of galleryCircuit)drive(sim,p);
 const held=sim.worldDive.y;assert.ok(W.swim(sim,0,0,0,.1));assert.equal(sim.worldDive.y,held);
 assert.ok(W.diveExit(sim).ok);assert.equal(sim.worldDive,undefined);assert.ok(W.walkable(realm.room,sim.state.player.x,sim.state.player.z));
 for(const s of trail('atlantis').steps)assert.ok(galleryCircuit.some(p=>p[0]===s.x&&p[1]===s.y&&p[2]===s.z));
});
test('the material claim supports an existing recipe without a new item, resource node or weapon stat',()=>{
 const reward=trail('earthlands').reward;
 assert.deepEqual(reward,{xp:25,coins:10,ore:0,materials:{wood:6,fiber:4,stone:2}});
 assert.deepEqual(reward.materials,AR.RECIPES.trail_bow.materials);
 for(const [id,n]of Object.entries(reward.materials)){assert.ok(Object.hasOwn(S.ITEMS,id));assert.ok(Number.isSafeInteger(n)&&n>0&&n<=S.MAX);}
 assert.deepEqual(trail('atlantis').reward,{xp:30,coins:12,ore:2});
 assert.equal(T.definitions.some(d=>'enemies'in d||'nodes'in d||'stats'in d||'fittings'in d),false);
});
test('labels distinguish job supplies, physical depth, protected history and finite claimed materials',()=>{
 const earth=trail('earthlands'),atlas=trail('atlantis');
 assert.match(earth.steps.find(s=>s.id==='road-pack').text,/only when its once-only claim succeeds/);
 assert.match(earth.steps.find(s=>s.id==='shore-stone').text,/Darric/);
 assert.match(atlas.steps.find(s=>s.id==='depth-chart').text,/without spending supplies/);
 assert.match(atlas.completionText,/does not settle the missing cargo/);
});
