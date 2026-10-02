/* Equipment projection tests. Complete catalogue fixtures below are labelled
 * synthetic; the initial kit and gathered/crafted bow also use real commands. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),S=require('../src/sandbox.js'),Q=require('../src/starter.js'),H=require('../src/pursuit.js');
const {M}=require('../src/engine.js');
const artPath=require('node:path').join(__dirname,'../src/traveler-equipment-art.js');
const Art=fs.existsSync(artPath)?require(artPath):{};
const empty=()=>({box:[],round:[],octa:[],disc:[]}),items=out=>Object.values(out).flat();
const near=(got,want,label)=>{assert.equal(got.length,want.length);got.forEach((v,i)=>assert.ok(Math.abs(v-want[i])<2e-6,`${label} axis ${i}: ${v} / ${want[i]}`));};
let serial=0;
const command=(sim,type,p={})=>{const result=sim.adventureCommand('traveler-equipment-'+(++serial),type,p);assert.ok(result.ok,result.error);};
function walk(sim,x,z){assert.ok(sim.moveTo(x,z).ok);for(let i=0;i<7000&&sim.playerPath.length;i++)sim.tick(.05);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.25);}
function earnedKit(){const sim=new C.Simulation();walk(sim,11,9);command(sim,'start');return sim;}
function fixture(id='trail_blade'){
 const sim=earnedKit(),a=sim.state.adventure;
 // Synthetic ownership is for exhaustive visual family coverage, not an earned reward.
 if(!a.owned.includes(id))a.owned.push(id);a.equipment.weapon=id;return sim;
}
function syntheticTemper(a,id){
 // Complete synthetic quest prerequisites keep these visual specimens valid.
 a.starter.accepted=true;a.starter.bundles=Q.BUNDLES.map(b=>b.id);
 if(!a.defeated.includes('river-old-bristle'))a.defeated.push('river-old-bristle');
 a.starter.reward={choice:'temper',weapon:id};
}
function frame({yaw=0,base=1.3,combatScene=true,phase='idle',progress=0,reducedMotion=false}={}){
 return {root:M.compose(7,base,-3,1,1,1,0,yaw,0),joints:{rightHand:[.33,1.08,.27],leftHand:[-.30,1.30,.48],head:[0,1.37,0],spine:[0,.88,0],hip:[0,.90,0],back:[0,1.25,-.17]},style:'blade',combatScene,combatPhase:phase,combatProgress:progress,guarded:false,reducedMotion,walkingBlend:0};
}
function draw(sim,f){assert.equal(typeof Art.draw,'function','equipment draw API is implemented');const out=empty();Art.draw(out,sim,f);return items(out);}
function expectedWorld(local,yaw,base){return [7+local[0]*Math.cos(yaw)+local[2]*Math.sin(yaw),base+local[1],-3-local[0]*Math.sin(yaw)+local[2]*Math.cos(yaw)];}
function endpoint(item,side){return M.transform(item.m,[0,side*.5,0]);}
// Separating axes from the actual rendered transforms, not authored anchor guesses.
function obbOverlaps(a,b){
 const dot=(x,y)=>x.reduce((n,v,i)=>n+v*y[i],0),cross=(x,y)=>[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
 const edges=p=>[0,4,8].map(i=>[p.m[i],p.m[i+1],p.m[i+2]].map(n=>n/2)),aa=edges(a),bb=edges(b),delta=a.p.map((v,i)=>v-b.p[i]);
 for(const raw of [...aa,...bb,...aa.flatMap(x=>bb.map(y=>cross(x,y)))]){
  const length=Math.hypot(...raw);if(length<1e-8)continue;const axis=raw.map(n=>n/length),radius=[...aa,...bb].reduce((n,v)=>n+Math.abs(dot(axis,v)),0);
  if(Math.abs(dot(axis,delta))>radius+1e-6)return false;
 }return true;
}

test('unstarted, absent, unknown and unowned equipment produce no gear',()=>{
 assert.equal(typeof Art.draw,'function');
 const raw=new C.Simulation();assert.deepEqual(draw(raw,frame()),[]);
 for(const id of [null,'missing','travel_coat','oren_reedbow']){const sim=earnedKit();sim.state.adventure.equipment.weapon=id;assert.deepEqual(draw(sim,frame()),[],String(id));}
 const sim=fixture();sim.state.adventure.started=false;assert.deepEqual(draw(sim,frame()),[]);
});

test('read-only attachment summary reports exactly the rendered grip and actual markers',()=>{
 assert.equal(typeof Art.draw,'function');
 for(const id of ['oren_sunblade','copper_bow'])for(const combatScene of [true,false]){
  const sim=fixture(id),a=sim.state.adventure;a.arsenal.sockets[id]='moonstone';a.pursuit.fittings[id]=1;syntheticTemper(a,id);
  const f=frame({yaw:.4,base:2.1,combatScene}),out=empty(),summary=Art.draw(out,sim,f),grip=items(out).find(p=>p.weaponPart==='grip');
  assert.equal(summary.weaponId,id);assert.equal(summary.style,AR.weapon(a).style);assert.equal(summary.mode,combatScene?'held':'stowed');assert.equal(summary.gem,'moonstone');assert.equal(summary.temper,2);assert.equal(summary.stage,1);assert.equal(summary.instances,items(out).length);
  near(summary.gripWorld,grip.p,'diagnostic grip');near(M.transform(f.root,summary.gripLocal),grip.p,'diagnostic local grip');
 }
 const out=empty(),summary=Art.draw(out,new C.Simulation(),frame());assert.equal(summary.mode,'none');assert.equal(summary.instances,0);assert.equal(summary.gripWorld,null);assert.equal(summary.weaponId,null);
});

test('a command-earned kit is held at the right palm through actual root yaw and terrain height',()=>{
 const sim=earnedKit();assert.equal(sim.state.adventure.equipment.weapon,'trail_blade');
 for(const yaw of [0,Math.PI/2,Math.PI,-.9])for(const base of [1.3,1.57,4.25]){
  const f=frame({yaw,base}),out=draw(sim,f),grip=out.find(p=>p.weaponPart==='grip');
  assert.ok(grip);assert.equal(grip.weaponId,'trail_blade');assert.equal(grip.attachment,'rightHand');assert.equal(grip.carryMode,'ready');
  near(grip.p,expectedWorld(f.joints.rightHand,yaw,base),'grip position');
  near(M.transform(grip.m,[0,0,0]),expectedWorld(f.joints.rightHand,yaw,base),'rendered grip center');
 }
});

test('curved bow grip and both string segments attach to the two moving palms',()=>{
 const sim=fixture('trail_bow');
 for(const phase of ['idle','anticipate','recover'])for(const yaw of [0,1.7])for(const progress of [0,.5,1]){
  const f=frame({phase,progress,yaw,base:2.4});f.style='blade'; // actual equipment owns style.
  f.joints.leftHand=[-.30-progress*.04,1.30+progress*.07,.48+progress*.01];
  f.joints.rightHand=[.16-progress*.03,1.26+progress*.20,.32-progress*.22];
  const out=draw(sim,f),grip=out.find(p=>p.weaponPart==='grip'),strings=out.filter(p=>p.weaponPart==='bow-string');
  assert.ok(grip);assert.equal(grip.attachment,'leftHand');near(M.transform(grip.m,[0,0,0]),expectedWorld(f.joints.leftHand,yaw,2.4),'bow palm');
  assert.equal(strings.length,2);for(const string of strings)near(endpoint(string,1),expectedWorld(f.joints.rightHand,yaw,2.4),'string at drawing palm');
  assert.ok(out.filter(p=>p.weaponPart==='bow-limb').length>=6,'curvature has multiple connected segments');
 }
});

test('ordinary travel stows blade at hip and bow at back without hand-held copies',()=>{
 for(const id of ['trail_blade','oren_sunblade','dawn_edge','trail_bow','copper_bow','oren_reedbow']){
  const out=draw(fixture(id),frame({combatScene:false,yaw:.8,base:3})),bow=AR.weapon(fixture(id).state.adventure).style==='bow';
  assert.ok(out.length);assert.ok(out.every(p=>p.carryMode==='stowed'));assert.ok(out.every(p=>!['leftHand','rightHand'].includes(p.attachment)));
  const grip=out.find(p=>p.weaponPart==='grip');assert.equal(grip.attachment,bow?'back':'hip');
  assert.ok(out.some(p=>p.weaponPart===(bow?'bow-limb':'scabbard')));
  if(bow)assert.ok(out.some(p=>p.weaponPart==='quiver'),'quiver is decorative equipment geometry');
  else assert.equal(out.filter(p=>p.weaponPart==='blade').length,0,'stowed blade is sheathed');
 }
});

test('each catalogue weapon preserves its own colour, gem, fittings and separate Oren temper',()=>{
 const ids=Object.entries(A.GEAR).filter(([,g])=>g.slot==='weapon').map(([id])=>id);
 assert.ok(ids.includes('oren_sunblade')&&ids.includes('oren_reedbow')&&ids.includes('dawn_edge'));
 for(const id of ids)for(const gemId of Object.keys(AR.GEMS))for(const combatScene of [true,false]){
  const sim=fixture(id),a=sim.state.adventure;a.arsenal.sockets[id]=gemId;a.pursuit.fittings[id]=2;syntheticTemper(a,id);
  const before=JSON.stringify(sim.snapshot()),out=draw(sim,frame({combatScene}));
  assert.ok(out.every(p=>p.weaponId===id),id);assert.ok(out.some(p=>p.c===parseInt(A.GEAR[id].color.slice(1),16)),id+' catalogue material');
  const gem=out.filter(p=>p.weaponPart==='socket');assert.equal(gem.length,1);assert.equal(gem[0].gemId,gemId);assert.equal(gem[0].c,AR.GEMS[gemId].color);
  const fits=out.filter(p=>p.weaponPart==='fitting');assert.equal(fits.length,2);assert.deepEqual(fits.map(p=>p.fittingStage),[1,2]);assert.equal(fits[0].c,0xd39366);assert.equal(fits[1].c,0xece0b6);
  assert.equal(out.filter(p=>p.weaponPart==='temper').length,1);assert.equal(JSON.stringify(sim.snapshot()),before,'art cannot mutate identity or progression');
  assert.equal(H.stage(a,id),2);assert.equal(Q.bonus(a,id),2);
 }
});

test('markers project only the selected weapon rather than another owned weapon',()=>{
 const sim=fixture('trail_blade'),a=sim.state.adventure;a.owned.push('copper_bow');a.arsenal.sockets.copper_bow='ruby';a.pursuit.fittings.copper_bow=2;syntheticTemper(a,'copper_bow');
 const out=draw(sim,frame());assert.equal(out.filter(p=>['socket','fitting','temper'].includes(p.weaponPart)).length,0);
 assert.equal(out.filter(p=>p.weaponPart==='socket-mount').length,1,'empty mounting remains visible');
});

test('family silhouettes differ within a bounded traveller scale',()=>{
 const bladeLengths=['trail_blade','copper_blade','oren_sunblade','dawn_edge'].map(id=>{
  const out=draw(fixture(id),frame()),body=out.find(p=>p.weaponPart==='blade');assert.ok(body);return Math.hypot(body.m[4],body.m[5],body.m[6]);
 });
 assert.ok(new Set(bladeLengths.map(n=>n.toFixed(3))).size>=3);
 for(const length of bladeLengths)assert.ok(length>.5&&length<1.0,'weapon silhouette remains local and does not depict rule reach');
 const bowHeights=['trail_bow','copper_bow','oren_reedbow'].map(id=>{
  const out=draw(fixture(id),frame()),points=out.filter(p=>p.weaponPart==='bow-limb').flatMap(p=>[endpoint(p,-1),endpoint(p,1)]);return Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]));
 });
 assert.ok(new Set(bowHeights.map(n=>n.toFixed(3))).size>=2);for(const h of bowHeights)assert.ok(h>1&&h<1.5);
});

test('blade anticipation, recovery and guard keep the grip connected while changing orientation',()=>{
 const sim=fixture(),orientations=[];
 for(const [phase,progress,guarded]of [['idle',0,false],['anticipate',1,false],['recover',.2,false],['idle',0,true]]){
  const f=frame({phase,progress,yaw:1.2});f.guarded=guarded;const grip=draw(sim,f).find(p=>p.weaponPart==='grip');
  near(M.transform(grip.m,[0,0,0]),expectedWorld(f.joints.rightHand,1.2,1.3),'posed grip');orientations.push([grip.m[4],grip.m[5],grip.m[6]]);
 }
 assert.notDeepEqual(orientations[0],orientations[1]);assert.notDeepEqual(orientations[0],orientations[2]);assert.notDeepEqual(orientations[0],orientations[3]);
});

test('reduced motion keeps essential palm connections without phase-driven blade flourishes',()=>{
 const sim=fixture(),f=frame({reducedMotion:true,phase:'anticipate',progress:0}),first=draw(sim,f);f.combatProgress=1;const second=draw(sim,f);
 assert.deepEqual(first.map(p=>Array.from(p.m)),second.map(p=>Array.from(p.m)));
 const bow=fixture('oren_reedbow');f.joints.rightHand=[.13,1.46,.10];const out=draw(bow,f);for(const string of out.filter(p=>p.weaponPart==='bow-string'))near(endpoint(string,1),[7.13,2.76,-2.90],'essential draw pose');
});

test('all equipment transforms stay finite, orthogonal and under forty instances',()=>{
 for(const [id,g]of Object.entries(A.GEAR).filter(([,g])=>g.slot==='weapon'))for(const combatScene of [false,true]){
  const sim=fixture(id);sim.room='mine';const a=sim.state.adventure;a.arsenal.sockets[id]='amber';a.pursuit.fittings[id]=2;syntheticTemper(a,id);
  const f=frame({combatScene,phase:'anticipate',progress:1,yaw:.83}),out=draw(sim,f);assert.ok(out.length<40,id+': '+out.length);
  for(const p of out){assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));assert.ok(Array.from(p.m).every(Number.isFinite));
   const axes=[0,4,8].map(i=>[p.m[i],p.m[i+1],p.m[i+2]]);for(const [i,j]of [[0,1],[0,2],[1,2]])assert.ok(Math.abs(axes[i].reduce((n,v,k)=>n+v*axes[j][k],0))<1e-6,'orthonormal beam basis');
  }
  assert.equal(out.some(p=>p.weaponPart==='lantern'),g.style!=='bow'&&combatScene);
 }
});

test('read-only rendering does not create runtime, commands, effects or arrows',()=>{
 const sim=fixture('oren_reedbow'),before=JSON.stringify(sim),saved=JSON.stringify(sim.snapshot()),keys=Object.keys(sim);
 const out=draw(sim,frame({phase:'recover',progress:.1}));assert.ok(out.length);assert.equal(JSON.stringify(sim),before);assert.equal(JSON.stringify(sim.snapshot()),saved);assert.deepEqual(Object.keys(sim),keys);
 const a=sim.state.adventure;assert.equal(a.arsenal.rangeMedal,false);assert.equal(a.pursuit.claimed,0);
});

test('gathered and command-crafted bow projects the actual equipped item',()=>{
 const sim=earnedKit();
 for(const id of ['timber-1','timber-2','fibre-1','fibre-2','stone-1','stone-2']){
  const node=S.NODES.find(n=>n.id===id);walk(sim,node.x+1.1,node.z);const current=sim.state.sandbox.nodes.find(n=>n.id===id);
  while(current.hp){if(current.readyAt>sim.state.sandbox.elapsed)sim.tick(current.readyAt-sim.state.sandbox.elapsed+.1);const result=sim.sandboxCommand('traveler-gather-'+(++serial),'gather',{node:id});assert.ok(result.ok,result.error);for(let i=0;i<20;i++)sim.tick(.05);}
 }
 walk(sim,11,9);command(sim,'arsenal-craft',{id:'trail_bow'});command(sim,'equip',{id:'trail_bow'});
 const before=JSON.stringify(sim.snapshot()),out=draw(sim,frame());assert.equal(out.find(p=>p.weaponPart==='grip').weaponId,'trail_bow');assert.ok(out.some(p=>p.weaponPart==='bow-string'));assert.equal(JSON.stringify(sim.snapshot()),before);
});


test('finite realm collars preserve prior markers and follow the actual blade or curved bow segment',()=>{
 // Synthetic catalogue coverage. Rule/journey suites independently earn the fitting.
 for(const id of Object.entries(A.GEAR).filter(([,g])=>g.slot==='weapon').map(([id])=>id))for(const combatScene of [true,false])for(const yaw of [0,1.3])for(const progress of [0,.5,1]){
  const sim=fixture(id),a=sim.state.adventure;a.pursuit.fittings[id]=2;syntheticTemper(a,id);a.arsenal.sockets[id]='ruby';
  const d=globalThis.RealmTrails.definition('earthlands-coastward-materials-v1'),record=sim.state.realmTrails.records[d.id];record.accepted=true;record.steps=d.steps.filter(s=>!s.optional).map(s=>s.id);record.claimed=true;
  const f=frame({combatScene,yaw,phase:progress===0?'idle':progress===1?'anticipate':'recover',progress});f.joints.leftHand=[-.30-progress*.04,1.30+progress*.07,.48+progress*.01];f.joints.rightHand=[.16-progress*.03,1.26+progress*.20,.32-progress*.22];const before=draw(sim,f);a.realmCraft.weapon=id;const snapshot=JSON.stringify(sim.snapshot()),after=draw(sim,f);
  assert.deepEqual(after.filter(p=>!p.weaponPart.startsWith('realm-fitting')),before,'earlier weapon, socket, temper and River geometry remain identical');
  const body=after.filter(p=>p.weaponPart==='realm-fitting'),trim=after.filter(p=>p.weaponPart==='realm-fitting-trim');assert.equal(body.length,1);assert.equal(trim.length,2);assert.equal(body[0].c,0xa997cc);assert.ok(trim.every(p=>p.c===0xd1b06b));
  const collar=body[0],basis=p=>[p.m[4],p.m[5],p.m[6]].map(n=>n/Math.hypot(p.m[4],p.m[5],p.m[6]));
  if(AR.weapon(a).style==='bow'){
   const limb=after.find(p=>p.weaponPart==='bow-limb'&&p.limbSide===1&&p.limbSegment===3);near(collar.p,limb.p,'collar sits on real curved limb');near(basis(collar),basis(limb),'collar follows real curved limb basis');
  }else{
   const shaft=after.find(p=>p.weaponPart===(combatScene?'blade':'scabbard')),start=endpoint(shaft,-1),end=endpoint(shaft,1),delta=end.map((v,i)=>v-start[i]),length=Math.hypot(...delta),t=collar.p.reduce((n,v,i)=>n+(v-start[i])*delta[i],0)/(length*length);
   assert.ok(t>0&&t<1,'collar remains within actual blade/sheath');near(collar.p,start.map((v,i)=>v+t*delta[i]),'collar does not float away from shaft');
   for(const old of after.filter(p=>['fitting','temper'].includes(p.weaponPart)))assert.ok(Math.hypot(...old.p.map((v,i)=>v-collar.p[i]))>.14,'new collar leaves earlier finite marks separate');
  }
  for(const p of [collar,...trim])assert.ok(p.realmFitting===3&&Array.from(p.m).every(Number.isFinite));
  for(const next of [collar,...trim])for(const old of after.filter(p=>['fitting','temper','socket'].includes(p.weaponPart)))assert.equal(obbOverlaps(next,old),false,id+' '+next.weaponPart+' must not cover '+old.weaponPart+' '+old.fittingStage);
  assert.equal(JSON.stringify(sim.snapshot()),snapshot,'collar projection cannot alter progression');
 }
});
