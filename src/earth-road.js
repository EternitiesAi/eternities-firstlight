/* Ordinary Earth-road continuation. Transient travel only; no reward or save schema. */
(function(G){'use strict';
const ID='hearthwater-coastward-v1',tickets=new WeakMap();
const ENDPOINTS=Object.freeze([
 Object.freeze({id:'hearthwater-coastward-road',room:'earth-hearthwater-approach',x:18.3,z:-42,post:Object.freeze({x:18.3,z:-40.4}),name:'Coastward road · bridge, fields and woodland',destination:'world-earthlands',arrival:Object.freeze({x:8,z:106,yaw:Math.PI})}),
 Object.freeze({id:'coastward-hearthwater-road',room:'world-earthlands',x:8,z:106,post:Object.freeze({x:9.6,z:106}),name:'Hearthwater road · home and Oren’s workshop',destination:'earth-hearthwater-approach',arrival:Object.freeze({x:18.3,z:-42,yaw:-Math.PI/2})})
]);
const clone=o=>JSON.parse(JSON.stringify(o)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),fail=error=>({ok:false,error});
function endpoint(room){return ENDPOINTS.find(p=>p.room===room)||null;}
function supported(room,p){return room===G.RealmEarth.ROOM?G.RealmEarth.walkable(p.x,p.z):G.RealmWorldFoundations.walkable(room,p.x,p.z);}
function clear(room,a,b){return room===G.RealmEarth.ROOM?G.RealmEarth.segment(a,b):G.RealmWorldFoundations.segment(room,a,b);}
function route(sim){const p=endpoint(sim.room);return p&&!sim.worldDive&&sim.returnPos&&sim.state.adventure.hp>0&&supported(sim.room,sim.state.player)&&supported(p.destination,p.arrival)&&distance(p,sim.state.player)<=2.6&&clear(sim.room,sim.state.player,p)?p:null;}
function preview(ctx){const p=route(ctx.sim);if(!p)return fail('Reach the signed Earth-road continuation on dry supported ground.');
 const ticket=Object.freeze({connection:ID,destination:p.destination});tickets.set(ticket,{sim:ctx.sim,active:ctx.active,revision:ctx.revision,room:ctx.sim.room,home:clone(ctx.sim.returnPos),earthTrip:ctx.sim.earthTrip,worldTrip:ctx.sim.worldTrip,position:{...ctx.sim.state.player},used:false});return{ok:true,ticket};}
function cancel(ticket){const t=tickets.get(ticket);if(t)t.used=true;}
function enter(ticket,ctx,io){const sim=ctx.sim,t=tickets.get(ticket),p=route(sim);
 if(!t||t.used||!p||ticket.destination!==p.destination||t.sim!==sim||t.active!==ctx.active||t.revision!==ctx.revision||t.room!==sim.room||t.earthTrip!==sim.earthTrip||t.worldTrip!==sim.worldTrip||distance(t.position,sim.state.player)>.01||JSON.stringify(t.home)!==JSON.stringify(sim.returnPos))return fail('The character, checkpoint or road changed. Read the sign again.');
 t.used=true;if(io.available===false)return fail('The connecting Earth scene is unavailable. Remain at the sign.');
 let saved;try{saved=io.save(sim.snapshot());}catch(e){return fail('Road checkpoint save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Save the original Firstlight checkpoint before continuing.');
 const prior={room:sim.room,player:sim.state.player,returnPos:sim.returnPos,path:sim.playerPath,runtime:sim.adventureRuntime,earthTrip:sim.earthTrip,worldTrip:sim.worldTrip};
 try{
  if(prior.runtime)sim.adventureRuntime=clone(prior.runtime);
  sim.room=p.destination;sim.state.player={...p.arrival};sim.playerPath=[];
  if(p.destination===G.RealmEarth.ROOM){delete sim.worldTrip;sim.earthTrip={active:ctx.active,sourceRegion:'valley',sourceRevision:ctx.revision,destination:G.RealmEarth.ROOM,checkpoint:{...sim.returnPos}};}
  else{delete sim.earthTrip;sim.worldTrip={active:ctx.active,realm:'earthlands',home:{...sim.returnPos}};}
  io.build();G.RealmAdventure.syncScene(sim);G.RealmCombat.stop(sim,true);return{ok:true,text:p.destination===G.RealmEarth.ROOM?'Hearthwater · orchard, ridge and the road home.':'Coastward · follow the channel bridge to fields and woodland.'};
 }catch(e){sim.room=prior.room;sim.state.player=prior.player;sim.returnPos=prior.returnPos;sim.playerPath=prior.path;sim.adventureRuntime=prior.runtime;
  for(const key of['earthTrip','worldTrip']){if(prior[key]===undefined)delete sim[key];else sim[key]=prior[key];}
  try{io.restore?.();}catch{return fail('The road scene failed. Reopen your saved original Firstlight checkpoint.');}
  return fail('The connecting road could not load; the source scene is restored. '+e.message);
 }
}
const api={ID,ENDPOINTS,endpoint,route,preview,cancel,enter};G.RealmEarthRoad=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
