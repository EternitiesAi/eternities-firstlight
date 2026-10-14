/* Physical, checkpointed group movement. No durable writes, inventory mutation,
 * elapsed-time grants or public construction of an arrival proof. */
(function(G){'use strict';
const M=G.RealmEarthGateModel||(typeof require==='function'?require('./earth-gate-model.js'):null);
if(!M)throw Error('Load the gate model before its physical escort.');
const D=M.definition,live=new WeakMap(),projections=new WeakMap(),tickets=new WeakMap();
const fail=error=>({ok:false,error}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),tuple=o=>JSON.stringify(o);
const opaque=o=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.isFrozen(o)&&Reflect.ownKeys(o).length===0&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
function owned(ctx){
 try{
  const sim=ctx?.sim,C=G.RealmCore,E=G.RealmEarth,a=sim?.state?.adventure;
  if(!C||!E||!(sim instanceof C.Simulation)||ctx.definition!==D||typeof ctx.active!=='string'||!ctx.active||typeof ctx.current!=='function'||ctx.current()!==true)return fail('Read this group with the current traveller.');
  if(!opaque(ctx.ownerLease)||sim.gateEscortOwnerLease!==ctx.ownerLease)return fail('The current app-owned escort lease is required.');
  if(sim.room!==D.room||sim.worldDive||!a.started||a.hp<=0||!Number.isSafeInteger(a.deaths)||!Number.isFinite(sim.elapsed)||sim.elapsed<0)return fail('The living traveller must be on the Hearthwater approach.');
  const trip=sim.earthTrip,home=sim.returnPos;
  if(!trip||trip.active!==ctx.active||trip.destination!==D.room||!home||![home.x,home.z,home.yaw].every(Number.isFinite)||tuple(trip.checkpoint)!==tuple(home))return fail('Keep the actual Earth outing and its original home checkpoint.');
  if(!E.walkable(sim.state.player.x,sim.state.player.z,.31))return fail('Stand on supported ground.');
  const q=M.validate(a.earthGate);if(!q.accepted)return fail('Accept the captain’s terms before leading this group.');
  return{ok:true,q};
 }catch(e){return fail(e.message);}
}
function end(r,reason){if(r){r.ended=true;r.epoch++;r.reason=reason;if(r.ticket){const t=tickets.get(r.ticket);if(t)t.used=true;}if(live.get(r.sim)===r)live.delete(r.sim);}}
function same(r,ctx){const s=ctx?.sim;return!!r&&!r.ended&&live.get(s)===r&&s===r.sim&&ctx.active===r.active&&ctx.ownerLease===r.lease&&s.state===r.state&&s.state.adventure===r.adventure&&s.earthTrip===r.trip&&s.worldTrip===r.worldTrip&&tuple(s.earthTrip)===r.tripValue&&tuple(s.returnPos)===r.home&&s.state.adventure.deaths===r.deaths;}
function check(r,ctx){
 if(!same(r,ctx))return fail('The group’s character, outing, death count or live lease changed.');
 const c=owned(ctx);if(!c.ok)return c;
 if(tuple(c.q)!==r.record||r.sim.elapsed+1e-9<r.lastElapsed)return fail('The saved checkpoint or simulation clock changed.');
 if(!r.actors.every(p=>G.RealmEarth.walkable(p.x,p.z,D.radius)))return fail('The group no longer stands on supported ground.');
 return c;
}
function get(ctx,initialize=true){
 const sim=ctx?.sim;let r=sim&&typeof sim==='object'?live.get(sim):null;
 if(r){const c=check(r,ctx);if(c.ok)return{ok:true,r};end(r,c.error);if(!initialize)return c;}
 if(!initialize)return fail('Resume this group from its saved checkpoint.');
 const c=owned(ctx);if(!c.ok)return c;
 const q=c.q,route=q.plan?M.route(q.plan):M.route('inspection-lane'),index=route.findIndex(p=>p.id===q.checkpoint),point=route[index];
 const actors=D.actors.map(a=>({...a,x:point.x+a.offset,z:point.z,yaw:Math.PI,distance:0}));
 const E=G.RealmEarth;
 for(const actor of D.actors){const path=route.map(p=>({x:p.x+actor.offset,z:p.z}));if(path.some(p=>!E.walkable(p.x,p.z,D.radius))||path.slice(1).some((p,i)=>!E.segment(path[i],p,D.radius)))return fail('The complete group route must remain supported.');}
 r={sim,state:sim.state,adventure:sim.state.adventure,active:ctx.active,lease:ctx.ownerLease,trip:sim.earthTrip,worldTrip:sim.worldTrip,
  tripValue:tuple(sim.earthTrip),home:tuple(sim.returnPos),deaths:sim.state.adventure.deaths,record:tuple(q),plan:q.plan,route,index,actors,
  leading:false,status:q.outcome?'arrived':q.prepared?'waiting':'unprepared',reason:'saved-checkpoint',lastElapsed:sim.elapsed,ticket:null,epoch:0,ended:false};
 live.set(sim,r);return{ok:true,r};
}
function view(r){
 const paused=r.sim.paused&&r.leading,value=Object.freeze({kind:'earth-gate-escort-view-v1',group:D.group,room:D.room,plan:r.plan,
  checkpoint:r.route[r.index].id,next:r.route[r.index+1]?.id||null,status:paused?'paused':r.status,reason:paused?'menu-pause':r.reason,
  ready:r.status==='ready',arrived:r.status==='arrived',moving:!paused&&r.status==='moving',leading:r.leading,
  actors:Object.freeze(r.actors.map(a=>Object.freeze({id:a.id,name:a.name,x:a.x,z:a.z,yaw:a.yaw,base:G.RealmEarth.height(a.x,a.z),distance:a.distance}))) });
 projections.set(value,{r,epoch:r.epoch});return value;
}
function current(ctx){const c=get(ctx);return c.ok?view(c.r):null;}
function isProjection(value,ctx){const p=value&&projections.get(value);return!!p&&p.epoch===p.r.epoch&&check(p.r,ctx).ok;}
function begin(ctx){
 const c=get(ctx);if(!c.ok)return c;const r=c.r,q=M.validate(r.sim.state.adventure.earthGate);
 if(r.sim.paused||!q.prepared||q.outcome)return fail('Prepare the destination, then resume beside the waiting travellers.');
 if(Math.max(...r.actors.map(a=>dist(a,r.sim.state.player)))>2.8)return fail('Stand beside all three travellers to begin or resume leading.');
 if(r.status==='ready')return{ok:true,view:view(r)};
 r.leading=true;r.status='moving';r.reason='following';r.lastElapsed=r.sim.elapsed;r.epoch++;return{ok:true,view:view(r)};
}
function wait(ctx){const c=get(ctx);if(!c.ok)return c;const r=c.r;r.leading=false;if(r.status==='moving'||r.status==='waiting-far')r.status='waiting';r.reason='player-wait';r.lastElapsed=r.sim.elapsed;r.epoch++;return{ok:true,view:view(r)};}
function tick(ctx,dt){
 if(!Number.isFinite(dt)||dt<0||dt>D.maxDt)return fail('Use one finite Core step from 0 to 0.1 seconds.');
 const c=get(ctx);if(!c.ok)return c;const r=c.r,available=r.sim.elapsed-r.lastElapsed;r.lastElapsed=r.sim.elapsed;
 if(r.sim.paused||!r.leading||dt===0||r.status==='ready'||r.status==='arrived')return{ok:true,view:view(r)};
 if(available<=0||available+1e-9<dt)return fail('Advance the group only after one fresh Core tick; time cannot be reused.');
 const next=r.route[r.index+1];if(!next)return fail('No further group checkpoint exists.');
 const targets=r.actors.map(a=>{const target={x:next.x+a.offset,z:next.z},length=dist(a,target),step=Math.min(length,D.speed*dt);return length<=1e-12?target:{x:a.x+(target.x-a.x)*step/length,z:a.z+(target.z-a.z)*step/length};});
 if(r.actors.some(a=>dist(a,r.sim.state.player)>D.followDistance)||targets.some(a=>dist(a,r.sim.state.player)>D.followDistance)){
  r.status='waiting-far';r.reason='Stay within 10 metres of all three travellers.';r.epoch++;return{ok:true,view:view(r)};
 }
 if(targets.some((p,i)=>!G.RealmCore.segment(r.actors[i],p,r.sim.navRoom,D.radius)||dist(r.actors[i],p)>D.speed*dt+1e-8)){
  r.leading=false;r.status='blocked';r.reason='The next complete body segment is unsupported.';r.epoch++;return fail(r.reason);
 }
 for(let i=0;i<r.actors.length;i++){const a=r.actors[i],p=targets[i],moved=dist(a,p);if(moved>0)a.yaw=Math.atan2(p.x-a.x,p.z-a.z);a.x=p.x;a.z=p.z;a.distance+=moved;}
 r.status='moving';r.reason='following';r.epoch++;
 if(r.actors.every(a=>dist(a,{x:next.x+a.offset,z:next.z})<=1e-9)){
  r.status='ready';r.reason='All three travellers reached the checkpoint.';r.ticket=Object.freeze({kind:'earth-gate-arrival-v1'});
  tickets.set(r.ticket,{r,checkpoint:next.id,used:false,validated:false});
 }
 return{ok:true,view:view(r)};
}
function arrivalTicket(ctx){const c=get(ctx,false);return c.ok&&c.r.status==='ready'&&c.r.ticket?{ok:true,ticket:c.r.ticket}:fail('All three travellers must physically reach the next checkpoint.');}
function validateArrival(ctx,ticket){
 const t=ticket&&tickets.get(ticket);if(!t||t.used)return fail('A current physical group arrival is required.');
 const c=check(t.r,ctx);if(!c.ok){end(t.r,c.error);return c;}const r=t.r;
 if(r.sim.paused||r.status!=='ready'||r.ticket!==ticket||r.route[r.index+1]?.id!==t.checkpoint||r.actors.some(a=>dist(a,{x:r.route[r.index+1].x+a.offset,z:r.route[r.index+1].z})>1e-9||dist(a,r.sim.state.player)>D.followDistance))return fail('Remain near all three arrivals while recording their exact next checkpoint.');
 t.validated=true;t.revision=r.adventure.revision;return{ok:true,checkpoint:t.checkpoint};
}
function consume(ctx,ticket){
 const t=ticket&&tickets.get(ticket);if(!t||t.used||!t.validated||!same(t.r,ctx))return fail('Validate this arrival before adopting its one saved checkpoint.');
 const r=t.r,c=owned(ctx);if(!c.ok)return c;
 const proposed=M.transition(JSON.parse(r.record),'checkpoint',{checkpoint:t.checkpoint});
 if(!proposed.ok||r.status!=='ready'||r.ticket!==ticket||r.adventure.revision!==t.revision+1||tuple(c.q)!==tuple(proposed.state))return fail('Only the single expected saved checkpoint can consume this arrival.');
 t.used=true;r.ticket=null;r.index++;r.record=tuple(c.q);r.lastElapsed=r.sim.elapsed;r.status=c.q.outcome?'arrived':r.leading?'moving':'waiting';r.reason='checkpoint-recorded';if(c.q.outcome)r.leading=false;r.epoch++;
 return{ok:true,view:view(r)};
}
function reset(sim,reason='owner-change'){if(sim&&typeof sim==='object')end(live.get(sim),reason);return{ok:true};}
const api=Object.freeze({definition:D,current,isProjection,begin,wait,tick,arrivalTicket,validateArrival,consume,reset});
G.RealmEarthGateMotion=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
