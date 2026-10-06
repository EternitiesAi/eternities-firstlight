/* Labelled synthetic travel boundaries; production support and atomic persistence. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),H=require('../src/earth.js'),W=require('../src/world-foundations.js'),R=require('../src/earth-road.js'),A=require('../src/adventure.js');
const copy=o=>JSON.parse(JSON.stringify(o)),context=sim=>({sim,active:'synthetic-road-character',revision:3});
function hearth(kit=false){const sim=new C.Simulation();if(kit){sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('synthetic-road-kit','start').ok);}sim.state.player={...H.GATE,yaw:0};const ctx=context(sim);assert.ok(H.enter(H.preview(ctx).ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);sim.state.player={...R.endpoint(H.ROOM),yaw:0};return sim;}
function cross(sim,extra={}){const ctx=context(sim),p=R.preview(ctx);assert.ok(p.ok,p.error);return R.enter(p.ticket,ctx,{save:()=>({ok:true}),build:()=>{},...extra});}
test('both road endpoints, arrivals and solid posts use canonical supported geometry',()=>{
 for(const p of R.ENDPOINTS){const support=p.room===H.ROOM?H.walkable(p.x,p.z):W.walkable(p.room,p.x,p.z);assert.ok(support);assert.ok(p.destination===H.ROOM?H.walkable(p.arrival.x,p.arrival.z):W.walkable(p.destination,p.arrival.x,p.arrival.z));}
 assert.equal(H.walkable(18.3,-40.4),false);assert.equal(W.walkable('world-earthlands',9.6,106),false);assert.equal(H.walkable(19.1,-42),false);
 const paths=[[H.ROOM,[{x:0,z:-35},{x:7,z:-38},{x:12,z:-42},{x:18.3,z:-42}]],['world-earthlands',[{x:8,z:106},{x:0,z:104},{x:0,z:92}]]];
 for(const[room,points]of paths)for(let i=1;i<points.length;i++){assert.ok(C.pathfind(points[i-1],points[i],{id:room}));assert.ok(room===H.ROOM?H.segment(points[i-1],points[i]):W.segment(room,points[i-1],points[i]));}
 assert.equal(W.atRoad(Object.assign(hearth(),{room:'world-earthlands',state:{...hearth().state,player:{x:8,z:106}}})),false,'local connector cannot authorize unrelated realm travel');
});
test('lake-to-Coastward-to-Hearthwater preserves every durable field and original home',()=>{
 const sim=hearth(),before=sim.snapshot(),home=copy(sim.returnPos),saved=[];
 assert.ok(cross(sim,{save:s=>{saved.push(copy(s));return{ok:true};}}).ok);assert.equal(sim.room,'world-earthlands');assert.equal(sim.earthTrip,undefined);assert.equal(sim.worldTrip.realm,'earthlands');assert.deepEqual(sim.returnPos,home);assert.deepEqual(sim.snapshot(),before);
 assert.ok(cross(sim,{save:s=>{saved.push(copy(s));return{ok:true};}}).ok);assert.equal(sim.room,H.ROOM);assert.equal(sim.worldTrip,undefined);assert.equal(sim.earthTrip.active,'synthetic-road-character');assert.deepEqual(sim.snapshot(),before);assert.deepEqual(saved,[before,before]);
 assert.ok(H.leave(sim).ok);assert.deepEqual(sim.state.player,home);assert.equal(sim.earthTrip,undefined);assert.equal(sim.worldTrip,undefined);
});
test('direct five-light visitor returns through Hearthwater without relocating home',()=>{
 const sim=new C.Simulation();sim.state.player={...W.GATE,yaw:.3};const home=copy(sim.state.player),ctx=context(sim);assert.ok(W.enter(W.preview(ctx,'earthlands').ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);sim.state.player={x:8,z:106,yaw:0};const before=sim.snapshot();
 assert.ok(cross(sim).ok);assert.deepEqual(sim.returnPos,home);assert.deepEqual(sim.snapshot(),before);assert.equal(sim.worldTrip,undefined);assert.ok(H.leave(sim).ok);assert.deepEqual(sim.state.player,home);
});
test('cold reopening on either side preserves home and all progress',()=>{const sim=hearth();for(let i=0;i<4;i++){const before=sim.snapshot();assert.ok(cross(sim).ok);const loaded=new C.Simulation(sim.snapshot());assert.equal(loaded.room,null);assert.deepEqual(loaded.snapshot(),before);assert.deepEqual(loaded.state.player,sim.returnPos);}});
test('save refusal and unavailable scene consume ticket without adopting a transition',()=>{for(const mode of['refuse','throw','unavailable']){const sim=hearth(),before=sim.snapshot(),ctx=context(sim),p=R.preview(ctx),room=sim.room,trip=sim.earthTrip;let builds=0;const io={available:mode!=='unavailable',save:()=>{if(mode==='throw')throw Error('synthetic storage refusal');return{ok:false,error:'synthetic quota'};},build:()=>builds++};assert.equal(R.enter(p.ticket,ctx,io).ok,false);assert.equal(builds,0);assert.equal(sim.room,room);assert.strictEqual(sim.earthTrip,trip);assert.deepEqual(sim.snapshot(),before);assert.equal(R.enter(p.ticket,ctx,{save:()=>({ok:true}),build:()=>builds++}).ok,false);}});
test('stale ownership, source position, trip and home refuse before saving',()=>{for(const mode of['active','revision','position','trip','home','cancel']){const sim=hearth(),ctx=context(sim),ticket=R.preview(ctx).ticket;let saves=0;if(mode==='active')ctx.active='another-character';if(mode==='revision')ctx.revision++;if(mode==='position')sim.state.player.z+=.1;if(mode==='trip')sim.earthTrip={...sim.earthTrip};if(mode==='home')sim.returnPos={...sim.returnPos,x:1};if(mode==='cancel')R.cancel(ticket);assert.equal(R.enter(ticket,ctx,{save:()=>{saves++;return{ok:true};},build:()=>{}}).ok,false);assert.equal(saves,0);assert.equal(sim.room,H.ROOM);}});
test('build and post-sync failure restore original runtime reference and complete graph',()=>{for(const postSync of[false,true]){const sim=hearth(),ctx=context(sim),ticket=R.preview(ctx).ticket;A.runtime(sim);const before=sim.snapshot(),runtime=sim.adventureRuntime,graph=copy(runtime),trip=sim.earthTrip,player=sim.state.player;const stop=global.RealmCombat.stop;let restored=0;try{if(postSync)global.RealmCombat.stop=()=>{throw Error('synthetic post-sync failure');};const r=R.enter(ticket,ctx,{save:()=>({ok:true}),build:()=>{if(!postSync)throw Error('synthetic builder failure');},restore:()=>restored++});assert.equal(r.ok,false);}finally{global.RealmCombat.stop=stop;}assert.equal(restored,1);assert.equal(sim.room,H.ROOM);assert.strictEqual(sim.state.player,player);assert.strictEqual(sim.earthTrip,trip);assert.strictEqual(sim.adventureRuntime,runtime);assert.deepEqual(copy(runtime),graph);assert.deepEqual(sim.snapshot(),before);assert.equal(sim.worldTrip,undefined);}});
test('dead, underwater, distant, unsupported and obstructed bodies cannot preview',()=>{for(const mode of['dead','dive','far','unsupported','post']){const sim=hearth();if(mode==='dead')sim.state.adventure.hp=0;if(mode==='dive')sim.worldDive={y:-1};if(mode==='far')sim.state.player={x:12,z:-42};if(mode==='unsupported')sim.state.player={x:23,z:-42};if(mode==='post')sim.state.player={x:18.3,z:-39.7};assert.equal(R.preview(context(sim)).ok,false,mode);}});
test('a successful ticket cannot pay, accept work or replay even at the opposite sign',()=>{const sim=hearth(),ctx=context(sim),ticket=R.preview(ctx).ticket,before=sim.snapshot();assert.ok(R.enter(ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);assert.equal(R.enter(ticket,ctx,{save:()=>{throw Error('must not save again');},build:()=>{}}).ok,false);assert.deepEqual(sim.snapshot(),before);assert.deepEqual(sim.state.journeys,before.journeys);});
test('riverbank access after the local return retains the same original checkpoint',()=>{const sim=hearth(true);assert.ok(cross(sim).ok);assert.ok(cross(sim).ok);sim.state.player={...H.RIVER_GATE,yaw:0};const before=sim.snapshot(),ctx=context(sim),p=H.preview(ctx);assert.ok(p.ok);assert.ok(H.enter(p.ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);assert.equal(sim.room,'riverbank');assert.deepEqual(sim.snapshot(),before);sim.state.player={...global.RealmStarter.ENTRY};assert.ok(H.backToApproach(sim).ok);assert.deepEqual(sim.snapshot(),before);});

test('production road composition keeps every legacy piece except explicitly local leaf clearance',()=>{
 const crypto=require('node:crypto');
 for(const name of ['engine','drover-art','millwright-art','mill-gate-art','quarry-art','bridge-art','earth-shoulder-art','earth-art'])require('../src/'+name+'.js');
 const RA=require('../src/earth-road-art.js'),defs=JSON.stringify([H.PATCHES,H.SOLIDS,H.POINTS]);
 const capture=()=>{const all=[],a={e:{},map:{},begin(){},commit(){},beam(){},bench(){},box(...v){this.add('box',...v);},add(kind,x,y,z,sx,sy,sz,c,opt={}){const p={kind,p:[x,y,z],s:[sx,sy,sz],c,...opt};all.push(p);(this.map[kind]||(this.map[kind]=[])).push(p);}};global.RealmEarthArt.make(a);return{all,a};};
 let baseline;try{global.RealmEarthRoadArt=undefined;baseline=capture();}finally{global.RealmEarthRoadArt=RA;}
 const old=baseline.all.filter(p=>!p.quarryShoulder);assert.equal(old.length,2550);assert.equal(crypto.createHash('sha256').update(JSON.stringify(old)).digest('hex'),'417afdc850951c93253b815e6ad8fd56594fac61dd610271ba34a816c9ae07fd');
 const current=capture(),cleared=current.a.earthRoadCleared,actual=Object.values(current.a.map).flat(),additions=actual.filter(p=>p.earthRoadPart);
 assert.ok(cleared.length<=20,'clearance stays a small local delta');for(const p of cleared){assert.equal(p.kind,'leaf');assert.ok(RA.distance(p.p[0],p.p[2])<1.3);assert.ok(!actual.includes(p));}
 const unchanged=current.all.filter(p=>!p.earthRoadPart);assert.deepEqual(unchanged,baseline.all,'legacy RNG, terrain and distant scenery do not drift');
 assert.equal(actual.filter(p=>!p.earthRoadPart).length,baseline.all.length-cleared.length);assert.ok(additions.length<=230,'bounded separate overlay budget');
 assert.equal(additions.filter(p=>p.earthRoadPart==='fingerpost').length,16);assert.equal(additions.filter(p=>p.earthRoadPart==='post').length,1);assert.equal(additions.filter(p=>p.earthRoadPart==='ground'&&p.terrain).length,64);
 for(const p of additions){assert.ok([...p.p,...p.s,...(p.m||[])].every(Number.isFinite));assert.equal(p.cameraSolid,false);}
 assert.equal(JSON.stringify([H.PATCHES,H.SOLIDS,H.POINTS]),defs);
});

test('new ground joins actual legacy top edges and its own cells without a visible seam',()=>{
 const E=global.RealmEngine,RA=global.RealmEarthRoadArt,all=[],a={e:{},map:{},begin(){},commit(){},beam(){},bench(){},box(...v){this.add('box',...v);},add(kind,x,y,z,sx,sy,sz,c,opt={}){const p={kind,p:[x,y,z],s:[sx,sy,sz],c,...opt};all.push(p);(this.map[kind]||(this.map[kind]=[])).push(p);}};
 global.RealmEarthArt.make(a);assert.ok(RA);const matrix=p=>p.m||E.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),at=(p,x,z)=>E.M.transform(matrix(p),[x,.5,z]);
 for(let row=0;row<16;row++){
  const zz=-45.75+row*.5,legacy=all.find(p=>p.terrain&&!p.earthRoadPart&&Math.abs(p.p[0]+p.s[0]/2-10)<1e-6&&Math.abs(p.p[2]-zz)<1e-6);
  const cells=all.filter(p=>p.earthRoadPart==='ground'&&p.terrain&&Math.abs(p.p[2]-zz)<.01).sort((u,v)=>u.p[0]-v.p[0]);assert.equal(cells.length,4);
  for(const z of[-.5,.5]){assert.ok(Math.hypot(...at(legacy,.5,z).map((v,k)=>v-at(cells[0],-.5,z)[k]))<.001);for(let i=1;i<cells.length;i++)assert.ok(Math.hypot(...at(cells[i-1],.5,z).map((v,k)=>v-at(cells[i],-.5,z)[k]))<.001);}
 }
});
