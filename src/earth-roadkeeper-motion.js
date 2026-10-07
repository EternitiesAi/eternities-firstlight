/* Passive public consequence of an already claimed canonical account.
 * All motion is transient. No command, proof, combat, payout or saved owner. */
(function(G){'use strict';
const C=G.RealmCore,W=G.RealmWorldFoundations,D=G.RealmEarthWildSignsData;
if(!C?.Simulation||!W?.segment||!D?.crossValidate)throw Error('Load actual Core, World and WildSigns Data before Roadkeeper Motion.');
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const ID='earth-wild-signs-roadkeeper-v1',ROOM=D.ROOM;
const LIMITS=freeze({radius:.6,height:1.78,speed:1.15,turnSpeed:1.5,maxDt:.1,homeWait:4,returnWait:18,inspectWait:5,enemyReserve:5,serviceReserve:3,noticeReserve:1});
const HOME=freeze({x:D.giver.x+2.4,z:D.giver.z-4.4});
const APPROACH=freeze([HOME,{x:-109,z:-28},{x:-125,z:-38},{x:-125,z:-44},{x:-125,z:-57},{x:-137,z:-62}]);
const ROUTES=freeze({
 'signed-loop':[...APPROACH,...D.bypass.map(p=>({x:p.x,z:p.z}))],
 'cleared-pocket':[...APPROACH,...D.bypass.slice(0,5).map(p=>({x:p.x,z:p.z})),{x:-158,z:-90},{x:-160,z:-92.5}]
});
const bySim=new WeakMap(),views=new WeakMap(),observedOwners=new WeakMap(),tuple=o=>JSON.stringify(o),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const fail=error=>({ok:false,error});
const own=(o,key)=>!!o&&typeof o==='object'&&Object.hasOwn(o,key);
function opaque(lease){try{return!!lease&&typeof lease==='object'&&!Array.isArray(lease)&&Object.isFrozen(lease)&&
 Reflect.ownKeys(lease).length===0&&[Object.prototype,null].includes(Object.getPrototypeOf(lease));}catch{return false;}}
function threatSource(sim){
 const owner=sim.adventureRuntime;
 if(!own(sim,'adventureRuntime')||!owner||typeof owner!=='object'||Array.isArray(owner)||!own(owner,'room')||owner.room!==ROOM||
  !own(owner,'enemies')||!Array.isArray(owner.enemies))return fail('The actual current-room hostile owner is unavailable.');
 const list=owner.enemies;
 for(let index=0;index<list.length;index++){
  const e=list[index];if(!own(list,index)||!e||typeof e!=='object'||Array.isArray(e)||!own(e,'hp')||!Number.isFinite(e.hp)||e.hp<0||
   own(e,'hidden')&&typeof e.hidden!=='boolean'||e.hp>0&&(!own(e,'x')||!own(e,'z')||!Number.isFinite(e.x)||!Number.isFinite(e.z)))
   return fail('The current hostile roster or live position is unreadable.');
 }
 return{ok:true,owner};
}
function observeOwner(ctx){
 const prior=observedOwners.get(ctx.sim);
 if(prior?.lease===ctx.ownerLease){
  if(prior.active!==ctx.active||ctx.revision<prior.revision)return fail('The observed character revision requires a fresh current owner.');
  prior.revision=ctx.revision;
 }else observedOwners.set(ctx.sim,{lease:ctx.ownerLease,active:ctx.active,revision:ctx.revision});
 return{ok:true};
}
function toSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function reserves(){const def=W.definition(ROOM),E=G.RealmEarthExpedition;if(!def||!E?.definition?.enemies)throw Error('Retain the actual Earth service and independent enemy catalogues.');return{
 enemies:[...E.definition.enemies,...def.enemies,D.enemy],services:def.points.filter(p=>p.kind==='person'),notice:{x:D.giver.x+1.4,z:D.giver.z+.45}};}
function measure(resolution){
 const route=ROUTES[resolution];if(!route)throw TypeError('Use one canonical claimed outcome.');
 const reserve=reserves(),segments=[];let meters=0;
 for(let i=1;i<route.length;i++){
  const from=route[i-1],to=route[i],length=dist(from,to),samples=Math.ceil(length/.1),heights=[];meters+=length;
  for(let step=0;step<=samples;step++){const t=step/samples;heights.push(W.height(ROOM,from.x+(to.x-from.x)*t,from.z+(to.z-from.z)*t));}
  segments.push({from:{...from},to:{...to},length,supported:W.segment(ROOM,from,to,LIMITS.radius)&&heights.every(h=>Number.isFinite(h)&&Math.abs(h-1.57)<1e-7),
   floorMin:Math.min(...heights),floorMax:Math.max(...heights),heightSamples:heights.length,
   enemyClearance:Math.min(...reserve.enemies.map(p=>toSegment(p,from,to)))-LIMITS.enemyReserve-LIMITS.radius,
   serviceClearance:Math.min(...reserve.services.map(p=>toSegment(p,from,to)))-LIMITS.serviceReserve-LIMITS.radius,
   noticeClearance:toSegment(reserve.notice,from,to)-LIMITS.noticeReserve-LIMITS.radius});
 }
 const pointsSupported=route.every(p=>W.walkable(ROOM,p.x,p.z,LIMITS.radius)&&Number.isFinite(W.height(ROOM,p.x,p.z)));
 return freeze({resolution,radius:LIMITS.radius,outboundMeters:meters,roundTripMeters:meters*2,segments,pointsSupported,
  ok:pointsSupported&&segments.every(s=>s.supported&&s.enemyClearance>=0&&s.serviceClearance>=0&&s.noticeClearance>=0)});
}
function owned(ctx){
 const sim=ctx?.sim,a=sim?.state?.adventure;
 if(!(sim instanceof C.Simulation)||typeof ctx.active!=='string'||!ctx.active||!Number.isSafeInteger(ctx.revision)||ctx.revision<0||
  typeof ctx.hidden!=='boolean'||typeof ctx.menuOpen!=='boolean')return fail('Use the actual traveller, character and explicit visibility/menu context.');
 const lease=ctx.ownerLease;if(!opaque(lease)||sim.roadkeeperOwnerLease!==lease)
  return fail('Use the app-owned transient roadkeeper lease.');
 if(sim.room!==ROOM||sim.worldDive||a?.started!==true||!Number.isFinite(a.hp)||a.hp<=0||!Number.isSafeInteger(a.deaths)||
  !Number.isFinite(sim.elapsed)||sim.elapsed<0)return fail('The current living traveller must remain in dry Earthlands.');
 const t=sim.worldTrip,h=sim.returnPos;
 if(!t||t.active!==ctx.active||t.realm!=='earthlands'||!h||!['x','z','yaw'].every(k=>Number.isFinite(h[k]))||tuple(t.home)!==tuple(h))
  return fail('Retain this real trip and its original home checkpoint.');
 if(!W.walkable(ROOM,sim.state.player.x,sim.state.player.z,.31))return fail('The traveller must remain on actual supported ground.');
 try{const loadId=G.RealmEarthConsignmentData?.ID;
  if(!own(sim.state,'earthWildSigns')||!own(sim.state,'localLife')||!own(sim.state.localLife,'records')||typeof loadId!=='string'||
   !own(sim.state.localLife.records,loadId)||!own(sim.state,'earthExpedition'))return fail('The own canonical account and paid-load prerequisites are required.');
  const record=D.crossValidate(sim.state.earthWildSigns,sim.state);
  if(!record.claimed)return fail('Only an already claimed canonical account selects this routine.');
  const threat=threatSource(sim);if(!threat.ok)return threat;
  return{ok:true,record,threatOwner:threat.owner};
 }catch(e){return fail(e.message);}
}
function end(r,reason){if(r){r.ended=true;r.epoch++;if(bySim.get(r.sim)===r)bySim.delete(r.sim);}return fail(reason);}
function check(r,ctx){
 if(!r||r.ended)return fail('Begin this current transient roadkeeper again.');
 if(ctx?.sim!==r.sim||ctx.active!==r.active||ctx.ownerLease!==r.lease||r.sim.state!==r.state||r.sim.state.adventure!==r.adventure||
  r.sim.worldTrip!==r.trip||r.sim.earthTrip!==r.earthTrip||tuple(r.sim.worldTrip)!==r.tripValue||tuple(r.sim.returnPos)!==r.home||r.adventure.deaths!==r.deaths)
  return end(r,'Roadkeeper character, state, death or travel ownership changed.');
 const c=owned(ctx);if(!c.ok)return end(r,c.error);
 if(c.threatOwner!==r.threatOwner)return end(r,'The actual hostile owner changed.');
 if(c.record.resolution!==r.resolution||tuple(c.record)!==r.account)return end(r,'The canonical claimed account changed.');
 if(r.sim.elapsed+1e-9<r.lastElapsed||ctx.revision<r.revision||!W.walkable(ROOM,r.x,r.z,LIMITS.radius))return end(r,'Roadkeeper clock, revision or ground support changed.');
 const observed=observeOwner(ctx);if(!observed.ok)return end(r,observed.error);
 if(ctx.revision>r.revision){r.revision=ctx.revision;r.epoch++;}
 return{ok:true};
}
function hostiles(r){return r.threatOwner.enemies;}
const liveThreat=e=>e.hp>0&&!(own(e,'hidden')&&e.hidden===true);
function nearHostile(r){return hostiles(r).some(e=>liveThreat(e)&&dist(e,r)<LIMITS.enemyReserve+LIMITS.radius);}
function suspended(r,ctx){return r.sim.paused?'paused':ctx.hidden?'hidden':ctx.menuOpen?'menu':r.hazard||nearHostile(r)?'hostile-nearby':null;}
function projection(r,ctx){const reason=suspended(r,ctx),v=freeze({kind:'earth-roadkeeper-view-v1',actor:ID,room:ROOM,resolution:r.resolution,
 x:r.x,z:r.z,base:W.height(ROOM,r.x,r.z),yaw:r.yaw,phase:r.phase,phaseTime:r.phaseTime,gait:r.gait,cycle:r.cycle,
 walking:['outbound','return'].includes(r.phase)&&r.moved&&!reason,paused:!!r.sim.paused,suspended:reason,hidden:ctx.hidden,menuOpen:ctx.menuOpen,
 reducedMotion:!!r.sim.state.settings.reducedMotion,radius:LIMITS.radius,height:LIMITS.height});views.set(v,{r,epoch:r.epoch});return v;}
function begin(ctx){
 const c=owned(ctx);if(!c.ok)return c;const observed=observeOwner(ctx);if(!observed.ok)return observed;const route=ROUTES[c.record.resolution];
 try{if(!measure(c.record.resolution).ok)return fail('The measured complete route no longer preserves actual support and reserves.');}catch(e){return fail(e.message);}
 const old=bySim.get(ctx.sim);if(old&&!old.ended&&check(old,ctx).ok)return{ok:true,view:projection(old,ctx)};
 const sim=ctx.sim,r={sim,state:sim.state,adventure:sim.state.adventure,threatOwner:c.threatOwner,active:ctx.active,lease:ctx.ownerLease,revision:ctx.revision,
  trip:sim.worldTrip,earthTrip:sim.earthTrip,tripValue:tuple(sim.worldTrip),home:tuple(sim.returnPos),deaths:sim.state.adventure.deaths,
  resolution:c.record.resolution,account:tuple(c.record),route,x:HOME.x,z:HOME.z,yaw:Math.PI,phase:'home',phaseTime:0,
  index:1,gait:0,moved:false,cycle:0,epoch:0,lastElapsed:sim.elapsed,hazard:false,ended:false};
 bySim.set(sim,r);return{ok:true,view:projection(r,ctx)};
}
function current(ctx){const r=bySim.get(ctx?.sim),c=check(r,ctx);if(!c.ok)return null;return projection(r,ctx);}
function isProjection(value,ctx){const v=value&&views.get(value);return!!v&&check(v.r,ctx).ok&&v.epoch===v.r.epoch&&
 value.paused===!!v.r.sim.paused&&value.hidden===ctx.hidden&&value.menuOpen===ctx.menuOpen&&
 value.reducedMotion===!!v.r.sim.state.settings.reducedMotion&&value.suspended===suspended(v.r,ctx);}
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function tick(ctx,dt){
 if(!Number.isFinite(dt)||dt<0||dt>LIMITS.maxDt)return fail('Supply one actual finite Core step between0 and0.1 seconds.');
 const r=bySim.get(ctx?.sim),c=check(r,ctx);if(!c.ok)return c;
 const available=r.sim.elapsed-r.lastElapsed;
 if(r.sim.paused||ctx.hidden||ctx.menuOpen){r.moved=false;r.lastElapsed=r.sim.elapsed;r.epoch++;return{ok:true,view:projection(r,ctx)};}
 if(dt===0)return{ok:true,view:projection(r,ctx)};
 if(available<=0||available+1e-9<dt)return fail('A fresh actual Core tick is required; elapsed time cannot be reused.');
 if(available>dt+1e-7){r.lastElapsed=r.sim.elapsed;r.epoch++;return fail('Clock gap suspended the roadkeeper; resume with the next fresh Core step.');}
 r.lastElapsed=r.sim.elapsed;r.revision=ctx.revision;r.epoch++;r.moved=false;r.hazard=false;
 const enemies=hostiles(r);
 if(nearHostile(r)){
  r.hazard=true;return{ok:true,view:projection(r,ctx)};
 }
 if(r.phase==='home'){
  r.phaseTime+=dt;if(r.phaseTime>=(r.cycle?LIMITS.returnWait:LIMITS.homeWait)){r.phase='outbound';r.phaseTime=0;r.index=1;}
 }else if(r.phase==='inspect'){
  r.phaseTime+=dt;if(r.phaseTime>=LIMITS.inspectWait){r.phase='return';r.phaseTime=0;r.index=r.route.length-2;}
 }else{
  const next=r.route[r.index],distance=dist(r,next),goal=Math.atan2(next.x-r.x,next.z-r.z),delta=angle(goal-r.yaw),turn=LIMITS.turnSpeed*dt;
  r.yaw=angle(r.yaw+Math.sign(delta)*Math.min(Math.abs(delta),turn));
  if(Math.abs(delta)>turn)return{ok:true,view:projection(r,ctx)};
  const amount=Math.min(distance,LIMITS.speed*dt),to=distance?{x:r.x+(next.x-r.x)*amount/distance,z:r.z+(next.z-r.z)*amount/distance}:{...next};
  if(!W.segment(ROOM,r,to,LIMITS.radius)||Math.abs(W.height(ROOM,to.x,to.z)-1.57)>1e-7)return end(r,'The next real roadkeeper segment lost ground support.');
  if(enemies.some(e=>liveThreat(e)&&toSegment(e,r,to)<LIMITS.enemyReserve+LIMITS.radius)){
   r.hazard=true;return{ok:true,view:projection(r,ctx)};
  }
  r.x=to.x;r.z=to.z;r.moved=amount>0;r.gait+=amount*5;
  if(amount===distance){r.phaseTime=0;if(r.phase==='outbound'){
   if(r.index===r.route.length-1){r.phase='inspect';r.moved=false;}else r.index++;
  }else if(r.index===0){r.phase='home';r.cycle++;r.moved=false;}else r.index--;}
 }
 return{ok:true,view:projection(r,ctx)};
}
function reset(sim,reason='owner-change'){end(bySim.get(sim),String(reason));return{ok:true};}
const api=Object.freeze({ID,ROOM,LIMITS,HOME,ROUTES,measure,begin,current,isProjection,tick,reset});G.RealmEarthRoadkeeperMotion=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
