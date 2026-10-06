/* Earth E1 — Hearthwater Vale's first connected approach.
 * Physical ground and transient travel only: no quest completion, payout, class,
 * economy, Bellweather unlock, or durable region state. */
(function(G){'use strict';
const ROOM='earth-hearthwater-approach';
const GATE=Object.freeze({x:0,z:23});
const ENTRY=Object.freeze({x:0,z:24,yaw:Math.PI});
const RIVER_GATE=Object.freeze({x:-13,z:4});
// Rules and art share the supported deck. Its flanking channel is water.
const BRIDGE=Object.freeze({id:'hearthwater-lake-bridge-v1',x:0,z:19.5,w:3.7,walkWidth:3.22,d:15,from:12,to:27,deck:1.57,piers:Object.freeze([12,15.75,19.5,23.25,27])});
const PATCHES=Object.freeze([
 {id:'arrival',x:0,z:27.5,w:10,d:1},
 {id:'bridge',x:BRIDGE.x,z:BRIDGE.z,w:BRIDGE.walkWidth,d:BRIDGE.d},
 {id:'south-meadow',x:0,z:8,w:22,d:8},
 {id:'orchard-lane',x:-9,z:-1,w:14,d:16},
 {id:'mill-road',x:8,z:-2,w:14,d:16},
 {id:'west-track',x:-13,z:-17,w:10,d:26},
 {id:'ridge-track',x:13,z:-18,w:10,d:28},
 {id:'north-common',x:0,z:-32,w:34,d:12},
 {id:'bellweather-road',x:0,z:-43,w:20,d:16},
 {id:'coastward-road-spur',x:15,z:-42,w:14,d:8}
]);
const SOLIDS=Object.freeze([
 {id:'mill-pond',x:0,z:-15,w:9,d:20,h:.35},
 {id:'orchard-shed',x:-8,z:0,w:4.4,d:4.2,h:3.5},
 {id:'quarry-stack',x:11.7,z:-18,w:3.2,d:4.5,h:2.5},
 {id:'shelter-back',x:-12,z:-26,w:6.6,d:.5,h:3.1},
 {id:'shelter-west',x:-15,z:-23.8,w:.5,d:4.8,h:3.1},
 {id:'shelter-east',x:-9,z:-24.6,w:.5,d:3.2,h:3.1},
 {id:'coastward-fingerpost',x:20.6,z:-42,w:.18,d:.18,h:2.4}
]);
const POINTS=Object.freeze([
 {id:'arrival',name:'Lake footbridge · way home',x:0,z:24,kind:'return'},
 {id:'bridge',name:'Hearthwater footbridge',x:0,z:16,kind:'route'},
 {id:'orchard',name:'Orchard lane',x:-8,z:3,kind:'view'},
 {id:'riverbank',name:'Riverbank worksite',...RIVER_GATE,kind:'worksite'},
 {id:'millfork',name:'Mill road fork · Fenna',x:7,z:2,kind:'route'},
 {id:'ridge',name:'Ridge road',x:13,z:-13,kind:'view'},
 {id:'quarry',name:'Quarry approach',x:12,z:-26,kind:'route'},
 {id:'shelter',name:'Old ridge shelter',x:-12,z:-23,kind:'rest'},
 {id:'bellweather',name:'Bellweather west road',x:0,z:-43,kind:'boundary'},
 {id:'hearthwater-coastward-road',name:'Coastward road · bridge, fields and woodland',x:19,z:-42,kind:'route'}
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),tickets=new WeakMap();
const fail=error=>({ok:false,error});
function height(x,z){
 const rise=clamp((-z+8)/50,0,1);
 return 1.57+.62*rise+.08*Math.sin(x*.16)*clamp((-z+3)/45,0,1);
}
function inside(x,z,p,r=0){return Math.abs(x-p.x)<=p.w/2-r&&Math.abs(z-p.z)<=p.d/2-r;}
function land(x,z,r=.31){
 if(![x,z,r].every(Number.isFinite)||r<0||r>2)return false;
 const offsets=[[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]];
 return offsets.every(([dx,dz])=>PATCHES.some(p=>inside(x+dx,z+dz,p)));
}
function walkable(x,z,r=.31){return land(x,z,r)&&!SOLIDS.some(p=>inside(x,z,p,-r));}
function interval(a,b,p,r=0){
 let lo=0,hi=1;
 for(const [k,size] of [['x','w'],['z','d']]){
  const d=b[k]-a[k],min=p[k]-p[size]/2-r,max=p[k]+p[size]/2+r;
  if(Math.abs(d)<1e-9){if(a[k]<min||a[k]>max)return null;}
  else{
   const u=(min-a[k])/d,v=(max-a[k])/d;
   lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));
   if(lo>hi)return null;
  }
 }
 return[lo,hi];
}
function segment(a,b,r=.31){
 if(!a||!b||!Number.isFinite(dist(a,b))||dist(a,b)>160||!walkable(a.x,a.z,r)||!walkable(b.x,b.z,r))return false;
 if(SOLIDS.some(p=>interval(a,b,p,r)))return false;
 const offsets=[[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]];
 for(const [dx,dz] of offsets){
  const intervals=PATCHES.map(p=>interval({x:a.x+dx,z:a.z+dz},{x:b.x+dx,z:b.z+dz},p)).filter(Boolean).sort((u,v)=>u[0]-v[0]);
  let end=0;
  for(const [lo,hi] of intervals){if(lo>end+1e-8)return false;end=Math.max(end,hi);}
  if(end<1-1e-8)return false;
 }
 return true;
}
function line(a,b){return segment(a,b,.04);}
function near(sim,p,r=2.8){return dist(sim.state.player,p)<=r;}
function riverTrip(sim){return !!(sim.earthTrip?.riverCheckpoint&&sim.returnPos&&walkable(sim.earthTrip.riverCheckpoint.x,sim.earthTrip.riverCheckpoint.z));}
function route(sim){
 const Q=G.RealmStarter;
 if(sim.state.adventure.hp<=0)return null;
 if(!sim.room&&near(sim,GATE))return{destination:ROOM,arrival:ENTRY};
 if(sim.room===ROOM&&sim.earthTrip&&sim.returnPos&&sim.state.adventure.started&&near(sim,RIVER_GATE,2.4))return{destination:Q.ROOM,arrival:Q.ENTRY};
 if(sim.room===Q.ROOM&&riverTrip(sim)&&near(sim,Q.ENTRY,2.8))return{destination:ROOM,arrival:sim.earthTrip.riverCheckpoint};
 return null;
}
function preview(ctx){
 const sim=ctx.sim,link=route(sim);
 if(!link)return fail('Approach the lake trail marker, or take Oren’s initial kit to the orchard worksite sign.');
 const ticket=Object.freeze({destination:link.destination});
 tickets.set(ticket,{sim,active:ctx.active,revision:ctx.revision,source:sim.room,trip:sim.earthTrip,position:{...sim.state.player},used:false});
 return{ok:true,ticket};
}
function cancel(ticket){const t=tickets.get(ticket);if(t)t.used=true;}
function enter(ticket,ctx,io){
 const t=tickets.get(ticket),sim=ctx.sim,link=route(sim);
 if(!t||t.used||!link||ticket.destination!==link.destination||t.sim!==sim||t.active!==ctx.active||t.revision!==ctx.revision||t.source!==sim.room||t.trip!==sim.earthTrip||dist(sim.state.player,t.position)>.01)return fail('That trail preview has changed. Review the marker again.');
 t.used=true;
 if(io.available===false)return fail('That route is unavailable. You are still at the source marker.');
 const source=sim.snapshot();let saved;
 try{saved=io.save(source);}catch(e){return fail('Travel save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Save your progress before taking the trail.');
 const prior={room:sim.room,returnPos:sim.returnPos,player:{...sim.state.player},path:sim.playerPath,runtime:sim.adventureRuntime,trip:sim.earthTrip};
 try{
  if(!sim.room){sim.returnPos={...t.position};sim.earthTrip={active:t.active,sourceRegion:'valley',sourceRevision:t.revision,destination:ROOM,checkpoint:{...t.position}};}
  else if(sim.room===ROOM)sim.earthTrip={...sim.earthTrip,riverCheckpoint:{...t.position}};
  else{sim.earthTrip={...sim.earthTrip};delete sim.earthTrip.riverCheckpoint;}
  sim.room=link.destination;sim.state.player={...link.arrival};sim.playerPath=[];
  io.build();G.RealmAdventure.syncScene(sim);G.RealmCombat.stop(sim,true);return{ok:true};
 }catch(e){
  sim.room=prior.room;sim.returnPos=prior.returnPos;sim.state.player=prior.player;sim.playerPath=prior.path;sim.adventureRuntime=prior.runtime;if(prior.trip)sim.earthTrip=prior.trip;else delete sim.earthTrip;
  try{io.restore?.();}catch(restoreError){return fail('The route could not load. Your saved valley checkpoint is safe; reopen the game. '+restoreError.message);}
  return fail('The route could not load. You are back at the source marker. '+e.message);
 }
}
// Headless command authority uses the same local checkpoint. The browser wraps
// this return in preview/enter to save first and roll back failed scene builds.
function backToApproach(sim){
 if(sim.room!==G.RealmStarter.ROOM||!riverTrip(sim)||!near(sim,G.RealmStarter.ENTRY,2.8))return fail('Return to the southern orchard path.');
 sim.state.player={...sim.earthTrip.riverCheckpoint};sim.earthTrip={...sim.earthTrip};delete sim.earthTrip.riverCheckpoint;
 sim.room=ROOM;sim.playerPath=[];G.RealmAdventure.syncScene(sim);G.RealmCombat.stop(sim,true);return{ok:true,text:'Back on the orchard lane. Oren is home in Firstlight.'};
}
function leave(sim){
 if(sim.room!==ROOM||!sim.returnPos)return fail('You are already on the Firstlight side.');
 const r=sim.leave();delete sim.earthTrip;G.RealmAdventure.syncScene(sim);G.RealmCombat.stop(sim,true);return r;
}
function recover(sim){
 if(sim.room!==ROOM||walkable(sim.state.player.x,sim.state.player.z))return false;
 sim.state.player={...ENTRY};sim.playerPath=[];G.RealmCombat.stop(sim,true);return true;
}
function pick(start,ray,max=420){
 if(![...start,...ray,max].every(Number.isFinite)||max<=0)return null;
 for(let t=.1;t<=Math.min(420,max);t+=.12){
  const x=start[0]+ray[0]*t,y=start[1]+ray[1]*t,z=start[2]+ray[2]*t,h=height(x,z);
  if(SOLIDS.some(p=>inside(x,z,p)&&y>=h-.15&&y<=h+p.h))return null;
  if(land(x,z,0)&&y<=h&&y>=h-.45)return walkable(x,z)?{x,z}:null;
 }
 return null;
}
const api={ROOM,GATE,ENTRY,RIVER_GATE,BRIDGE,PATCHES,SOLIDS,POINTS,height,land,walkable,segment,line,near,preview,cancel,enter,leave,riverTrip,backToApproach,recover,pick};
G.RealmEarth=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
