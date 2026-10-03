/* Pure plans against actual production bridge geometry. Synthetic invalid/input
 * and isolation fixtures are labelled; these do not render either camera. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const Earth=require('../src/earth.js'),Worlds=require('../src/world-foundations.js');
const Art=require('../src/bridge-moment-view.js');
const earth=Worlds.definition('earthlands'),coast=earth.patches.find(p=>p.id==='channel-bridge');
const source=fs.readFileSync(require.resolve('../src/bridge-moment-view.js'),'utf8');
const presets=['adventure','follow','tactical','wide'];
const hearth=()=>({scene:Earth.ROOM,player:{x:Earth.BRIDGE.x,z:Earth.BRIDGE.z,yaw:0},preset:'adventure'});
const coastward=()=>({scene:earth.room,player:{x:coast.x,z:coast.z,yaw:Math.PI},preset:'adventure'});
const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;};

test('global/CommonJS expose only a frozen pure planner',()=>{
 assert.equal(global.RealmBridgeMomentView,Art);assert.ok(Object.isFrozen(Art));assert.deepEqual(Object.keys(Art),['plan']);
 const sandbox={module:{exports:{}},sentinel:7};vm.runInNewContext(source,sandbox);
 assert.equal(sandbox.RealmBridgeMomentView,sandbox.module.exports);assert.equal(sandbox.sentinel,7);assert.equal(Object.keys(sandbox).length,3);
});

test('actual Hearthwater and Coastward midpoint plans retain the existing adventure framing',()=>{
 for(const input of [hearth(),coastward()]) {
  const result=Art.plan(input);assert.equal(result.ok,true);assert.equal(result.scene,input.scene);
  assert.equal(result.bridgeId,input.scene===Earth.ROOM?Earth.BRIDGE.id:coast.id);
  assert.deepEqual(result.view,{yaw:Math.PI*1.5,elevation:.14,tour:false,overview:false,distance:14.5,actualDistance:14.5});
  assert.equal(result.message,'Bridge side view · drag to orbit, V swaps styles, R resets.');
 }
});

test('all actual diorama styles retain half nine and relative zoom without switching preset or FOV',()=>{
 for(const build of [hearth,coastward])for(const preset of presets.slice(1))for(const baseHalf of [9,17,24,52]) {
  const input={...build(),preset,baseHalf,fov:73},result=Art.plan(input);
  assert.equal(result.ok,true);assert.deepEqual(result.view,{yaw:Math.PI*1.5,elevation:.39,tour:false,overview:false,half:9,zoom:9/baseHalf});
  assert.equal(input.preset,preset);assert.equal(input.fov,73);
  for(const key of ['preset','fov','baseHalf','player','center','distance','actualDistance'])assert.ok(!Object.hasOwn(result.view,key));
 }
 const adventure=Art.plan({...hearth(),baseHalf:17,fov:50});assert.ok(!Object.hasOwn(adventure.view,'half'));assert.ok(!Object.hasOwn(adventure.view,'zoom'));assert.ok(!Object.hasOwn(adventure.view,'fov'));
});

test('canonical bank joins remain frameable at each actual deck end',()=>{
 for(const [build,b,walkable] of [[hearth,Earth.BRIDGE,(x,z)=>Earth.walkable(x,z)],[coastward,coast,(x,z)=>Worlds.walkable(earth.room,x,z)]]) {
  for(const z of [b.z-b.d/2,b.z+b.d/2]) {
   assert.equal(walkable(b.x,z),true,'actual neighbouring bank supports full actor');
   assert.equal(Art.plan({...build(),player:{x:b.x,z}}).ok,true);
  }
 }
});

test('supported ground just beyond each deck refuses framing rather than extending bridge identity',()=>{
 for(const [build,b,walkable] of [[hearth,Earth.BRIDGE,(x,z)=>Earth.walkable(x,z)],[coastward,coast,(x,z)=>Worlds.walkable(earth.room,x,z)]])for(const side of [-1,1]) {
  const z=b.z+side*(b.d/2+.001);assert.equal(walkable(b.x,z),true,'bank is actual supported ground');
  const result=Art.plan({...build(),player:{x:b.x,z}});assert.equal(result.ok,false);assert.equal(result.view,undefined);
 }
});

test('Hearthwater physical foot support rejects the visible-deck fringe and retains valid inner edge',()=>{
 const b=Earth.BRIDGE,x=b.walkWidth/2-.31;
 for(const side of [-1,1]) {
  assert.equal(Art.plan({...hearth(),player:{x:b.x+side*(x-.001),z:b.z}}).ok,true);
  const fringe={x:b.x+side*(x+.001),z:b.z};assert.equal(Earth.walkable(fringe.x,fringe.z),false);
  assert.equal(Art.plan({...hearth(),player:fringe}).ok,false);
  assert.equal(Art.plan({...hearth(),player:{x:b.x+side*(b.w/2-.001),z:b.z}}).ok,false,'visual width is not physical actor support');
 }
});

test('Coastward framing obeys actual full-actor rail exclusion even inside the supported patch',()=>{
 for(const rail of earth.solids.filter(s=>s.id==='bridge-west-rail'||s.id==='bridge-east-rail')) {
  const sign=Math.sign(rail.x-coast.x),inner=rail.x-sign*(rail.w/2+.31);
  const clear={x:inner-sign*.001,z:coast.z},blocked={x:inner+sign*.001,z:coast.z};
  assert.equal(Worlds.walkable(earth.room,clear.x,clear.z),true);assert.equal(Art.plan({...coastward(),player:clear}).ok,true);
  assert.equal(Worlds.walkable(earth.room,blocked.x,blocked.z),false);assert.equal(Art.plan({...coastward(),player:blocked}).ok,false);
  assert.equal(Art.plan({...coastward(),player:{x:rail.x,z:rail.z}}).ok,false);
 }
});

test('actual supported off-bridge work and roads refuse without any planned camera fields',()=>{
 for(const point of [{x:-8,z:3},{x:12,z:-26}])assert.equal(Art.plan({...hearth(),player:point}).ok,false);
 for(const point of earth.points.filter(p=>['merren','field-water','delivery-register','shore-view','home-road'].includes(p.id))) {
  assert.equal(Worlds.walkable(earth.room,point.x,point.z),true);
  const result=Art.plan({...coastward(),player:point});assert.equal(result.ok,false);assert.ok(!Object.hasOwn(result,'view'));
 }
});

test('synthetic malformed input/presets/diving/base widths refuse with fresh readable results',()=>{
 const invalid=[undefined,null,[],{},'bridge',0,
  {...hearth(),scene:'valley'},{...hearth(),scene:'earthlands'},{...hearth(),scene:'world-atlantis'},
  ...[undefined,null,'unknown','Adventure',0,{}].map(preset=>({...hearth(),preset})),
  ...[null,[],{}, {x:'0',z:19.5},{x:0,z:NaN},{x:Infinity,z:19.5},{x:0,z:19.5,yaw:NaN},{x:0,z:19.5,y:Infinity}].map(player=>({...hearth(),player})),
  ...[true,null,1,'false',{}].map(diving=>({...hearth(),diving})),
  ...[null,0,-1,NaN,Infinity,'17',{},[]].map(baseHalf=>({...hearth(),baseHalf})),
  ...[undefined,Number.MIN_VALUE].map(baseHalf=>({...hearth(),preset:'follow',baseHalf}))];
 for(const input of invalid){const r=Art.plan(input);assert.equal(r.ok,false);assert.equal(typeof r.error,'string');assert.ok(r.error.length>10);assert.equal(r.message,r.error);assert.equal(r.view,undefined);}
 const a=Art.plan(null),b=Art.plan(null);assert.notEqual(a,b);
});

test('plans ignore health and extra authority objects, preserve frozen inputs and return fresh views',()=>{
 const input=hearth();input.player.hp=0;input.camera={preset:'wide',fov:73};
 for(const key of ['engine','state','save','document','simulation'])Object.defineProperty(input,key,{get(){throw Error('Forbidden authority read: '+key);}});
 freeze(input);const before=JSON.stringify(input),canonical=JSON.stringify({bridge:Earth.BRIDGE,patches:earth.patches,solids:earth.solids});
 const a=Art.plan(input);assert.equal(a.ok,true);a.view.yaw=0;a.view.player={x:999,z:999};a.message='changed';
 const b=Art.plan(input);assert.equal(b.view.yaw,Math.PI*1.5);assert.ok(!b.view.player);assert.notEqual(a.view,b.view);
 assert.equal(JSON.stringify(input),before);assert.equal(JSON.stringify({bridge:Earth.BRIDGE,patches:earth.patches,solids:earth.solids}),canonical);
 assert.equal(input.camera.preset,'wide');assert.equal(input.camera.fov,73);
});

test('synthetic missing/malformed canonical data refuse safely before exposing a view',()=>{
 const run=(RealmEarth,RealmWorldFoundations)=>{const sandbox={RealmEarth,RealmWorldFoundations};vm.runInNewContext(source,sandbox);return sandbox.RealmBridgeMomentView;};
 assert.equal(run(null,null).plan(hearth()).ok,false);
 assert.equal(run({...Earth,BRIDGE:{...Earth.BRIDGE,walkWidth:NaN}},Worlds).plan(hearth()).ok,false);
 assert.equal(run(Earth,{definition:()=>({...earth,patches:[coast,coast]}),walkable:()=>true}).plan(coastward()).ok,false);
 assert.equal(run(Earth,{definition:()=>({...earth,patches:[{...coast,w:0}]}),walkable:()=>true}).plan(coastward()).ok,false);
 assert.equal(run(Earth,{definition:()=>earth,walkable:()=>{throw Error('bad rules');}}).plan(coastward()).ok,false);
});
