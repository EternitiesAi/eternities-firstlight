/* Transitions must not redirect old exits, lose source checkpoints or pay quests. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/earth.js'),Q=require('../src/starter.js'),A=require('../src/adventure.js');
const context=sim=>({sim,active:'character-1',revision:5});
const io={save:()=>({ok:true}),build:()=>{}};
function orchard(kit=true){const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};if(kit)assert.ok(sim.adventureCommand('kit','start').ok);sim.state.player={x:0,z:23,yaw:1};assert.ok(E.enter(E.preview(context(sim)).ticket,context(sim),io).ok);sim.state.player={x:-13,z:4,yaw:2};return sim;}
function cross(sim){const p=E.preview(context(sim));assert.ok(p.ok,p.error);const r=E.enter(p.ticket,context(sim),io);assert.ok(r.ok,r.error);return p.ticket;}
test('orchard worksite crossing preserves outer save checkpoint and returns to the orchard',()=>{
 const sim=orchard(),before=sim.snapshot(),at={...sim.state.player},ticket=cross(sim);
 assert.equal(sim.room,'riverbank');assert.deepEqual(sim.state.player,{x:0,z:12,yaw:Math.PI});assert.deepEqual(sim.snapshot(),before);
 assert.equal(E.enter(ticket,context(sim),io).ok,false,'same ticket cannot replay');
 assert.ok(sim.adventureCommand('return','starter-leave').ok);assert.equal(sim.room,E.ROOM);assert.deepEqual(sim.state.player,at);assert.deepEqual(sim.snapshot().player,{x:0,z:23,yaw:1});
 assert.ok(E.leave(sim).ok);assert.equal(sim.room,null);assert.equal(sim.earthTrip,undefined);
});
test('initial kit and physical orchard arrival are required; the scene cannot bypass old chapter gates',()=>{
 const sim=orchard(false);assert.equal(E.preview(context(sim)).ok,false);
 sim.state.adventure.started=true;sim.state.player={x:0,z:-43,yaw:0};assert.equal(E.preview(context(sim)).ok,false);
 for(const type of ['road-enter','cross-enter','starter-enter'])assert.equal(sim.adventureCommand(type,type).ok,false);
});
test('worksite travel write and construction failures preserve the exact active source',()=>{
 for(const failure of ['write','build']){const sim=orchard(),before=sim.snapshot(),position={...sim.state.player},trip=structuredClone(sim.earthTrip),runtime=A.runtime(sim);const p=E.preview(context(sim));assert.ok(p.ok,p.error);
 const r=E.enter(p.ticket,context(sim),{save:()=>({ok:failure!=='write',error:'synthetic quota'}),build:()=>{throw Error('synthetic build');},restore:()=>{}});
 assert.equal(r.ok,false);assert.equal(sim.room,E.ROOM);assert.deepEqual(sim.state.player,position);assert.deepEqual(sim.earthTrip,trip);assert.equal(A.runtime(sim),runtime);assert.deepEqual(sim.snapshot(),before);
 }
});
test('worksite preview rejects stale identity, source revision, source position and simulation',()=>{
 for(const which of ['active','revision','position','sim']){const sim=orchard(),p=E.preview(context(sim));assert.ok(p.ok,p.error);const ctx=context(sim);if(which==='position')sim.state.player.x+=.5;else ctx[which]=which==='active'?'character-2':which==='sim'?orchard():6;let saves=0;assert.equal(E.enter(p.ticket,ctx,{save:()=>{saves++;return{ok:true};},build:()=>{}}).ok,false);assert.equal(saves,0);}
});
test('river exit only returns to Earth for an active Earth trip; the old workshop route is unchanged',()=>{
 const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('kit','start').ok);sim.state.player={x:15,z:7,yaw:.8};assert.ok(sim.adventureCommand('in','starter-enter').ok);assert.ok(sim.adventureCommand('out','starter-leave').ok);assert.equal(sim.room,null);assert.deepEqual(sim.state.player,{x:15,z:7,yaw:.8});
});
test('a completed unclaimed survey, class cooldown and companion survive both route boundaries',()=>{
 const sim=orchard(),a=sim.state.adventure;
 // Labelled boundary fixture, not command-earned gameplay evidence.
 a.pursuit.active={id:'riverbank-survey/1',terms:1,defeated:['west','east'],samples:['west-sample','east-sample']};
 a.classPath={version:1,choice:'hunter',readyAt:a.elapsed+8};a.companion.bonded=true;a.companion.mode='follow';
 const before=sim.snapshot();cross(sim);const reopened=new C.Simulation(sim.snapshot());assert.equal(reopened.room,null);assert.deepEqual(reopened.snapshot(),before);assert.equal(reopened.earthTrip,undefined);
 assert.ok(sim.adventureCommand('back','starter-leave').ok);assert.deepEqual(sim.state.adventure.pursuit,before.adventure.pursuit);assert.equal(a.classPath.readyAt,before.adventure.classPath.readyAt);assert.equal(A.runtime(sim).companion.room,E.ROOM);
 assert.equal(sim.adventureCommand('premature','pursuit-claim',{run:'riverbank-survey/1'}).ok,false);assert.equal(a.pursuit.claimed,0);
});
test('death recovery from the connected worksite clears all transient route state',()=>{const sim=orchard();cross(sim);sim.state.adventure.hp=0;assert.ok(sim.adventureCommand('revive','revive').ok);assert.equal(sim.room,null);assert.equal(sim.earthTrip,undefined);assert.deepEqual(sim.state.player,{x:2.5,z:6,yaw:0});});
test('browser return protocol rolls back failed construction with live encounter state intact',()=>{
 const sim=orchard();cross(sim);const runtime=A.runtime(sim);runtime.enemies[0].hp=7;const before=sim.snapshot(),trip=sim.earthTrip;
 const ticket=E.preview(context(sim)).ticket;assert.ok(ticket);const failed=E.enter(ticket,context(sim),{save:()=>({ok:true}),build:()=>{throw Error('return scene unavailable');},restore:()=>{}});
 assert.equal(failed.ok,false);assert.equal(sim.room,'riverbank');assert.equal(sim.earthTrip,trip);assert.equal(A.runtime(sim),runtime);assert.equal(runtime.enemies[0].hp,7);assert.deepEqual(sim.snapshot(),before);
 const retry=E.preview(context(sim));assert.ok(E.enter(retry.ticket,context(sim),io).ok);assert.equal(sim.room,E.ROOM);assert.equal(sim.earthTrip.riverCheckpoint,undefined);assert.deepEqual(sim.snapshot(),before);
});
test('Oren supplies earned through the orchard persist without consuming ordinary materials',()=>{
 const sim=orchard();assert.ok(E.leave(sim).ok);sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('accept','starter-accept').ok);
 sim.state.player={x:0,z:23,yaw:0};cross(sim);sim.state.player={x:-13,z:4,yaw:2};cross(sim);
 const inv=structuredClone(sim.state.sandbox.inventory);sim.state.player={x:-7,z:3,yaw:0};assert.ok(sim.adventureCommand('bundle','starter-pickup',{id:'river-rope'}).ok);
 const before=sim.snapshot();assert.equal(sim.adventureCommand('new-bundle-request','starter-pickup',{id:'river-rope'}).ok,false);assert.deepEqual(sim.snapshot(),before);assert.deepEqual(sim.state.sandbox.inventory,inv);
 const reopened=new C.Simulation(before);assert.equal(reopened.room,null);assert.equal(reopened.earthTrip,undefined);assert.deepEqual(reopened.state.adventure.starter.bundles,['river-rope']);assert.equal(reopened.state.adventure.starter.reward,null);
});
test('Earth scenery cannot overlap walking ground or the close third-person camera corridor',()=>{
 require('../src/engine.js');require('../src/drover-art.js');require('../src/millwright-art.js');require('../src/mill-gate-art.js');require('../src/bridge-art.js');require('../src/earth-art.js');const hills=[];
 const art={e:{},map:{},begin(){},commit(){},box(){},beam(){},bench(){},add(shape,x,y,z,sx,sy,sz){(this.map[shape]||(this.map[shape]=[])).push({});if(y===-1.2)hills.push({x,z,sx,sz});}};
 globalThis.RealmEarthArt.make(art);assert.ok(hills.length>=10);
 for(const hill of hills)for(const ground of E.PATCHES)assert.ok(Math.abs(hill.x-ground.x)>hill.sx+ground.w/2+8||Math.abs(hill.z-ground.z)>hill.sz+ground.d/2+8,'distant scenery overlaps the ground or camera corridor: '+JSON.stringify(hill));
});
test('Cosmos invitation labels belong only to the valley, never Earth or the riverbank',()=>{
 const original=globalThis.document,labels=[],root={replaceChildren(){labels.length=0;},append(label){labels.push(label.textContent);}},home={};
 globalThis.document={querySelector:id=>id==='#cosmos-labels'?root:home,body:{classList:{toggle(){}}},createElement:()=>({style:{}})};
 try{require('../src/cosmos-ui.js');const view={sim:{room:null,state:{player:{x:0,z:10},settings:{labels:true}}},rpg:{dialog:{open:false},api:{project:()=>({visible:true,x:300,y:200})}}};
  globalThis.RealmCosmosUI.CosmosUI.prototype.tick.call(view);assert.equal(labels.length,1,'valley invitation still visible');
  for(const room of [E.ROOM,'riverbank','retreat']){view.sim.room=room;globalThis.RealmCosmosUI.CosmosUI.prototype.tick.call(view);assert.deepEqual(labels,[],'foreign label leaked into '+room);}
 }finally{globalThis.document=original;}
});
