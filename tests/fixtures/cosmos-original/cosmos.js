/* The Near Expanse M1. Physical ground and transient travel, no new save data or payout. */
(function(G){'use strict';
const ROOM='cosmos-near-expanse',GATE=Object.freeze({x:14,z:-5}),ENTRY=Object.freeze({x:0,z:18,yaw:Math.PI});
const PATCHES=Object.freeze([
 {id:'arrival',x:0,z:15,w:14,d:14},
 {id:'three-lamps',x:0,z:5,w:24,d:18},
 {id:'rootcut',x:-13,z:-15,w:10,d:38},
 {id:'open-road',x:12,z:-15,w:10,d:38},
 {id:'landing',x:0,z:-33,w:36,d:12},
 {id:'observatory',x:2,z:-43,w:24,d:20}
]);
// Every solid has a matching rendered footprint. Height is above the local surface.
const SOLIDS=Object.freeze([
 {id:'central-ridge',x:-.5,z:-16,w:13,d:24,h:6.6},
 {id:'culvert-cover',x:-12,z:-9,w:3,d:3,h:3.2},
 {id:'road-cover',x:11,z:-17,w:2.8,d:4,h:2.6},
 {id:'refuge-back',x:-6,z:3,w:7,d:.45,h:3.2},
 {id:'refuge-west',x:-9.3,z:6,w:.45,d:6,h:3.2},
 {id:'refuge-east',x:-2.7,z:5,w:.45,d:4,h:3.2},
 {id:'refuge-bench',x:-6,z:4.2,w:2,d:.7,h:1.3},
 {id:'observatory-back',x:3,z:-49,w:14,d:.6,h:5},
 {id:'observatory-west',x:-3.8,z:-46,w:.6,d:6,h:4},
 {id:'observatory-east',x:9.8,z:-46,w:.6,d:6,h:4},
 {id:'instrument',x:3,z:-47,w:2.2,d:2.2,h:3.3}
]);
const POINTS=Object.freeze([
 {id:'arrival',name:'Arrival gate',x:0,z:18,kind:'return'},
 {id:'lamps',name:'Three Lamps · Teren',x:3,z:7,kind:'person'},
 {id:'bench',name:'Farroad refuge bench',x:-6,z:6,kind:'rest'},
 {id:'rootcut',name:'Rootcut Lane · sheltered approach',x:-14,z:-3,kind:'route'},
 {id:'rise',name:'First Horizon Rise · open approach',x:13,z:-6,kind:'view'},
 {id:'landing',name:'Common Landing',x:0,z:-34,kind:'route'},
 {id:'anik',name:'Anik · observatory overlook',x:3,z:-43,kind:'person'}
]);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),tickets=new WeakMap();
const fail=error=>({ok:false,error});
function height(x,z){return 1.57+3.2*clamp((-z-2)/30,0,1);}
function inside(x,z,p,r=0){return Math.abs(x-p.x)<=p.w/2-r&&Math.abs(z-p.z)<=p.d/2-r;}
function land(x,z,r=.31){
 if(![x,z,r].every(Number.isFinite)||r<0||r>2)return false;
 // Check the union, not each individual patch's inset: adjoining roads have no invisible seam.
 return [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]].every(([dx,dz])=>PATCHES.some(p=>inside(x+dx,z+dz,p)));
}
function walkable(x,z,r=.31){return land(x,z,r)&&!SOLIDS.some(p=>inside(x,z,p,-r));}
function interval(a,b,p,r=0){
 let lo=0,hi=1;for(const [k,size]of [['x','w'],['z','d']]){const d=b[k]-a[k],min=p[k]-p[size]/2-r,max=p[k]+p[size]/2+r;
  if(Math.abs(d)<1e-9){if(a[k]<min||a[k]>max)return null;}else{const u=(min-a[k])/d,v=(max-a[k])/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return null;}
 }return[lo,hi];
}
function segment(a,b,r=.31){
 if(!a||!b||!Number.isFinite(dist(a,b))||dist(a,b)>150||!walkable(a.x,a.z,r)||!walkable(b.x,b.z,r))return false;
 if(SOLIDS.some(p=>interval(a,b,p,r)))return false;
 for(const [dx,dz]of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]]){
  const intervals=PATCHES.map(p=>interval({x:a.x+dx,z:a.z+dz},{x:b.x+dx,z:b.z+dz},p)).filter(Boolean).sort((a,b)=>a[0]-b[0]);let end=0;
  for(const [lo,hi]of intervals){if(lo>end+1e-8)return false;end=Math.max(end,hi);}if(end<1-1e-8)return false;
 }return true;
}
function line(a,b){return segment(a,b,.04);}
function near(sim,p,r=2.6){return dist(sim.state.player,p)<=r;}
function preview(ctx){
 const sim=ctx.sim;
 if(sim.room||sim.state.adventure.hp<=0||!near(sim,GATE))return fail('Approach the invitation beside the valley observatory.');
 const ticket=Object.freeze({destination:ROOM});tickets.set(ticket,{sim,active:ctx.active,revision:ctx.revision,position:{...sim.state.player},used:false});
 return{ok:true,ticket};
}
function cancel(ticket){const t=tickets.get(ticket);if(t)t.used=true;}
function enter(ticket,ctx,io){
 const t=tickets.get(ticket),sim=ctx.sim;
 if(!t||t.used||ticket.destination!==ROOM||t.sim!==sim||t.active!==ctx.active||t.revision!==ctx.revision||sim.room||!near(sim,GATE)||dist(sim.state.player,t.position)>.01||sim.state.adventure.hp<=0)return fail('That travel preview has changed. Review the invitation again.');
 t.used=true;
 if(io.available===false)return fail('The Near Expanse scene is unavailable. You are still in the valley.');
 const source=sim.snapshot();let saved;
 try{saved=io.save(source);}catch(e){return fail('Travel save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Save the valley checkpoint before travelling.');
 const prior={room:sim.room,returnPos:sim.returnPos,player:{...sim.state.player},path:sim.playerPath,runtime:sim.adventureRuntime};
 try{
  sim.returnPos={...t.position};sim.room=ROOM;sim.state.player={...ENTRY};sim.playerPath=[];
  sim.cosmosTrip={active:t.active,sourceRegion:'valley',sourceRevision:t.revision,destination:ROOM,checkpoint:{...t.position}};
  io.build();G.RealmAdventure.syncScene(sim);G.RealmCombat.stop(sim,true);
  return{ok:true};
 }catch(e){
  sim.room=prior.room;sim.returnPos=prior.returnPos;sim.state.player=prior.player;sim.playerPath=prior.path;sim.adventureRuntime=prior.runtime;delete sim.cosmosTrip;
  try{io.restore?.();}catch(restoreError){return fail('The scene could not load. Your saved valley checkpoint is safe; reopen the game. '+restoreError.message);}
  return fail('The scene could not load. You are back at the valley checkpoint. '+e.message);
 }
}
function leave(sim){
 if(sim.room!==ROOM||!sim.returnPos)return fail('You are already on the valley side.');
 const r=sim.leave();delete sim.cosmosTrip;G.RealmAdventure.syncScene(sim);G.RealmCombat.stop(sim,true);return r;
}
function recover(sim){
 if(sim.room!==ROOM||walkable(sim.state.player.x,sim.state.player.z))return false;
 sim.state.player={...ENTRY};sim.playerPath=[];G.RealmCombat.stop(sim,true);return true;
}
// First hit along the actual camera ray. Solids occlude the ground behind them; sky images do not participate.
function pick(start,ray,max=420){
 if(![...start,...ray,max].every(Number.isFinite)||max<=0)return null;
 for(let t=.1;t<=Math.min(420,max);t+=.12){const x=start[0]+ray[0]*t,y=start[1]+ray[1]*t,z=start[2]+ray[2]*t,h=height(x,z);
  if(SOLIDS.some(p=>inside(x,z,p)&&y>=h-.15&&y<=h+p.h))return null;
  if(land(x,z,0)&&y<=h&&y>=h-.4)return walkable(x,z)?{x,z}:null;
 }
 return null;
}
const api={ROOM,GATE,ENTRY,PATCHES,SOLIDS,POINTS,height,land,walkable,segment,line,near,preview,cancel,enter,leave,recover,pick};G.RealmCosmos=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
