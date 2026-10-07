/* Staged noncombat browse actor. Host render/input witnesses are not supplied
 * by this module; parent must wire actual ordinary RAF and trusted intent. */
(function(G){'use strict';
const ROOM='world-earthlands',ID='elderweald-moss-grazer-v1',JOB='earth-first-load-through-v1';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const PATH=freeze({id:'elderweald-grazer-browse-loop-v1',room:ROOM,radius:1.4,
 points:[{x:-162,z:-79},{x:-164.5,z:-79},{x:-165,z:-78},{x:-162.2,z:-78}],
 browseToward:{x:-161.13397459621555,z:-78.5}});
const LIMITS=freeze({radius:1.4,height:1.45,speed:.65,turnSpeed:.9,lower:.8,browse:.8,recover:1,maxDt:.1,observeNear:8,maxLoop:20});
const POST_BROWSE_WALK=.05; // Private genuine displacement, never a saved counter.
const live=new WeakMap(),views=new WeakMap(),tickets=new WeakMap(),usedFrames=new WeakSet(),usedIntents=new WeakSet();
const fail=error=>({ok:false,error}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),tuple=o=>JSON.stringify(o);
const exact=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Reflect.ownKeys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const opaque=o=>exact(o,[])&&Object.isFrozen(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
const point=p=>exact(p,['x','z'])&&Number.isFinite(p.x)&&Number.isFinite(p.z);
function ledger(raw){
 const D=G.RealmEarthWildSignsData;
 if(!D||raw===undefined)throw Error('The future signs owner is unavailable.');
 return D.validate(raw);
}
function owned(ctx){
 const sim=ctx?.sim,C=G.RealmCore,W=G.RealmWorldFoundations,D=G.RealmEarthConsignmentData,a=sim?.state?.adventure;
 if(!C||!W||!D||!(sim instanceof C.Simulation)||typeof ctx.active!=='string'||!ctx.active||!Number.isSafeInteger(ctx.revision)||ctx.revision<0)
  return fail('Use the actual current traveller and fresh owner context.');
 if(!opaque(ctx.ownerLease)||sim.grazerOwnerLease!==ctx.ownerLease)return fail('The app-owned grazer lease is required.');
 if(sim.room!==ROOM||sim.worldDive||!a?.started||!Number.isFinite(a.hp)||a.hp<=0||!Number.isSafeInteger(a.deaths)||
  !Number.isSafeInteger(a.revision)||!Number.isFinite(sim.elapsed)||sim.elapsed<0)return fail('The living traveller must be in dry Earthlands.');
 const t=sim.worldTrip,h=sim.returnPos;
 if(!t||t.active!==ctx.active||t.realm!=='earthlands'||!h||!Number.isFinite(h.x)||!Number.isFinite(h.z)||!Number.isFinite(h.yaw)||tuple(t.home)!==tuple(h))
  return fail('Retain the actual Earth outing and original home checkpoint.');
 if(!W.walkable(ROOM,sim.state.player.x,sim.state.player.z,.31))return fail('The traveller must stand on supported ground.');
 try{const r=D.crossValidate(sim.state.localLife?.records?.[JOB],sim.state.earthExpedition);if(!r.claimed)return fail('Register and claim the original supplied load first.');
  if(!Object.hasOwn(sim.state,'earthWildSigns'))return fail('The explicit signs owner is required.');
  ledger(sim.state.earthWildSigns);G.RealmEarthWildSignsData.crossValidate(sim.state.earthWildSigns,sim.state);}catch(e){return fail(e.message);}
 return{ok:true};
}
function supportedPath(path){
 const W=G.RealmWorldFoundations;
 if(!exact(path,['id','room','radius','points','browseToward'])||!Object.isFrozen(path)||typeof path.id!=='string'||!path.id||path.room!==ROOM||
  !Number.isFinite(path.radius)||path.radius<LIMITS.radius||path.radius>2||!Object.isFrozen(path.points)||
  path.points.length<2||path.points.length>6||!path.points.every(p=>point(p)&&Object.isFrozen(p))||!point(path.browseToward)||!Object.isFrozen(path.browseToward))return false;
 let length=0;for(let i=0;i<path.points.length;i++){
  const a=path.points[i],b=path.points[(i+1)%path.points.length];length+=dist(a,b);
  if(dist(a,b)<.05||!W.walkable(ROOM,a.x,a.z,path.radius)||!W.segment(ROOM,a,b,path.radius)||Math.abs(W.height(ROOM,a.x,a.z)-1.57)>1e-7)return false;
 }
 return length<=LIMITS.maxLoop&&dist(path.points[0],path.browseToward)>.2;
}
function end(r,reason){if(r){r.ended=true;r.epoch++;r.reason=reason;if(live.get(r.sim)===r)live.delete(r.sim);}return fail(reason);}
function check(r,ctx){
 if(!r||r.ended)return fail('Begin the live grazer presentation again.');
 if(ctx?.sim!==r.sim||ctx.active!==r.active||ctx.ownerLease!==r.lease||ctx.path&&ctx.path!==r.path||
  r.sim.state!==r.state||r.sim.state.adventure!==r.adventure||r.sim.worldTrip!==r.trip||r.sim.earthTrip!==r.earthTrip||
  tuple(r.sim.returnPos)!==r.home||tuple(r.sim.worldTrip)!==r.tripValue||r.adventure.deaths!==r.deaths)return end(r,'Grazer ownership, death or travel changed.');
 const c=owned(ctx);if(!c.ok)return end(r,c.error);
 if(r.sim.elapsed+1e-9<r.lastElapsed||!G.RealmWorldFoundations.walkable(ROOM,r.x,r.z,r.path.radius))return end(r,'The grazer clock or support changed.');
 return{ok:true};
}
function context(r){return{sim:r.sim,active:r.active,revision:r.revision,ownerLease:r.lease,path:r.path};}
function projection(r){
 const record=ledger(r.sim.state.earthWildSigns),ready=r.witness&&record.accepted&&!record.observed&&
  ['timber-gouge','feeding-track'].every(id=>record.evidence.includes(id))&&nearby(r);
 const value=freeze({kind:'earth-grazer-view-v1',actor:ID,room:ROOM,x:r.x,z:r.z,base:G.RealmWorldFoundations.height(ROOM,r.x,r.z),yaw:r.yaw,
  phase:r.phase,phaseTime:r.phaseTime,lower:r.lower,walking:r.phase==='walk'&&!r.sim.paused,gait:r.gait,cycle:r.cycle,
  paused:!!r.sim.paused,reducedMotion:!!r.sim.state.settings.reducedMotion,radius:r.path.radius,height:LIMITS.height,
  observedBehavior:r.witness,observationReady:ready});
 views.set(value,{r,epoch:r.epoch});return value;
}
function begin(ctx,path=PATH){
 const c=owned(ctx);if(!c.ok)return c;
 try{if(!supportedPath(path))return fail('A small immutable fully supported browse loop is required.');}catch{return fail('Browse support could not be verified.');}
 const old=live.get(ctx.sim);if(old&&!old.ended){const same=check(old,{...ctx,path});if(same.ok){old.revision=ctx.revision;return{ok:true,view:projection(old)};}}
 const sim=ctx.sim,p=path.points[0],r={sim,state:sim.state,adventure:sim.state.adventure,active:ctx.active,lease:ctx.ownerLease,path,revision:ctx.revision,
  trip:sim.worldTrip,earthTrip:sim.earthTrip,home:tuple(sim.returnPos),tripValue:tuple(sim.worldTrip),deaths:sim.state.adventure.deaths,
  x:p.x,z:p.z,yaw:0,phase:'turn',phaseTime:0,lower:0,gait:0,postBrowseWalk:0,index:0,cycle:0,epoch:0,lastElapsed:sim.elapsed,
  seenCycle:0,seen:{lower:false,browse:false,recover:false},witness:false,ended:false,reason:''};
 live.set(sim,r);return{ok:true,view:projection(r)};
}
function current(ctx){const r=live.get(ctx?.sim),c=check(r,ctx);if(!c.ok)return null;r.revision=ctx.revision;return projection(r);}
function isProjection(value,ctx){const v=value&&views.get(value);return!!v&&v.epoch===v.r.epoch&&check(v.r,ctx||context(v.r)).ok&&
 value.paused===!!v.r.sim.paused&&value.reducedMotion===!!v.r.sim.state.settings.reducedMotion;}
const smooth=t=>t*t*(3-2*t),angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function tick(ctx,dt){
 if(!Number.isFinite(dt)||dt<0||dt>LIMITS.maxDt)return fail('Supply one finite Core step from0 to0.1 seconds.');
 const r=live.get(ctx?.sim),c=check(r,ctx);if(!c.ok)return c;
 const available=r.sim.elapsed-r.lastElapsed;
 if(r.sim.paused){r.lastElapsed=r.sim.elapsed;return{ok:true,view:projection(r)};}
 if(dt===0)return{ok:true,view:projection(r)};
 if(available<=0||available+1e-9<dt)return fail('A fresh actual Core tick is required; elapsed time cannot be reused.');
 r.lastElapsed=r.sim.elapsed;r.revision=ctx.revision;r.epoch++;
 if(r.phase==='turn'){
  const goal=Math.atan2(r.path.browseToward.x-r.x,r.path.browseToward.z-r.z),delta=angle(goal-r.yaw),step=LIMITS.turnSpeed*dt;
  r.yaw=angle(r.yaw+Math.sign(delta)*Math.min(Math.abs(delta),step));
  if(Math.abs(delta)<=step){r.phase='lower';r.phaseTime=0;}
 }else if(['lower','browse','recover'].includes(r.phase)){
  r.phaseTime+=dt;const duration=LIMITS[r.phase],t=Math.min(1,r.phaseTime/duration);
  r.lower=r.phase==='lower'?smooth(t):r.phase==='browse'?1:1-smooth(t);
  if(t===1){if(r.phase==='recover')r.postBrowseWalk=0;r.phase=r.phase==='lower'?'browse':r.phase==='browse'?'recover':'walk';r.phaseTime=0;}
 }else if(r.phase==='walk'){
  const next=r.path.points[(r.index+1)%r.path.points.length],distance=dist(r,next);let amount=Math.min(distance,LIMITS.speed*dt);
  if(r.postBrowseWalk===0&&distance>0){const goal=Math.atan2(next.x-r.x,next.z-r.z),delta=angle(goal-r.yaw),turn=LIMITS.turnSpeed*dt;r.yaw=angle(r.yaw+Math.sign(delta)*Math.min(Math.abs(delta),turn));if(Math.abs(delta)>turn)amount=0;}
  const to=distance?{x:r.x+(next.x-r.x)*amount/distance,z:r.z+(next.z-r.z)*amount/distance}:{x:next.x,z:next.z};
  if(!G.RealmWorldFoundations.segment(ROOM,r,to,r.path.radius))return end(r,'The next grazer segment is unsupported.');
  if(amount>0)r.yaw=Math.atan2(to.x-r.x,to.z-r.z);r.x=to.x;r.z=to.z;r.gait+=amount*5;r.postBrowseWalk+=amount;
  if(amount===distance){r.index=(r.index+1)%r.path.points.length;if(r.index===0){r.cycle++;r.phase='turn';r.phaseTime=0;r.lower=0;}}
 }
 return{ok:true,view:projection(r)};
}
function nearby(r){const p=r.sim.state.player;return dist(p,r)<=LIMITS.observeNear&&G.RealmWorldFoundations.segment(ROOM,p,r,.04);}
function acknowledge(ctx,submission){
 const r=live.get(ctx?.sim),c=check(r,ctx);if(!c.ok)return c;
 const record=ledger(r.sim.state.earthWildSigns);
 if(!record.accepted||record.observed||!['timber-gouge','feeding-track'].every(id=>record.evidence.includes(id)))
  return fail('Read both actual marks in this accepted investigation before witnessing the grazer.');
 const A=G.RealmEarthGrazerArt;
 if(!opaque(ctx.presentedFrame)||ctx.presentedFrame!==r.sim.grazerPresentedFrame||usedFrames.has(ctx.presentedFrame)||
  ctx.visible!==true||ctx.hidden!==false||ctx.menuOpen!==false||!['adventure','follow'].includes(ctx.camera)||r.sim.paused||!nearby(r)||
  !A?.isSubmission?.(submission,ctx))return fail('Only a fresh visible ordinary rendered grazer frame can witness behavior.');
 usedFrames.add(ctx.presentedFrame);
 if(r.seenCycle!==r.cycle){r.seenCycle=r.cycle;r.seen={lower:false,browse:false,recover:false};}
 if(r.phase==='lower'&&r.lower>=.4)r.seen.lower=true;
 if(r.phase==='browse'&&r.lower>=.99&&r.seen.lower)r.seen.browse=true;
 if(r.phase==='recover'&&r.lower<=.4&&r.seen.browse)r.seen.recover=true;
 if(r.phase==='walk'&&r.lower<=1e-9&&r.postBrowseWalk>=POST_BROWSE_WALK-1e-9&&r.seen.lower&&r.seen.browse&&r.seen.recover&&!r.witness){r.witness=true;r.epoch++;}
 return{ok:true,observedBehavior:r.witness};
}
function observationTicket(ctx){
 const r=live.get(ctx?.sim),c=check(r,ctx);if(!c.ok)return null;
 const record=ledger(r.sim.state.earthWildSigns);
 if(!record.accepted||record.observed||!['timber-gouge','feeding-track'].every(id=>record.evidence.includes(id))||!r.witness||!nearby(r)||ctx.hidden!==false||
  !opaque(ctx.inputStamp)||ctx.inputStamp!==r.sim.grazerNativeIntent||usedIntents.has(ctx.inputStamp))return null;
 usedIntents.add(ctx.inputStamp);const ticket=Object.freeze({});tickets.set(ticket,{r,used:false,validated:false,record:tuple(record),source:tuple(r.sim.state.earthExpedition),load:tuple(r.sim.state.localLife),revision:null});
 return ticket;
}
function validateObservation(ctx,ticket){
 const t=ticket&&tickets.get(ticket);if(!t||t.used)return fail('A private native observation proof is required.');
 const c=check(t.r,ctx);if(!c.ok)return c;
 if(!nearby(t.r)||tuple(t.r.sim.state.earthWildSigns)!==t.record||tuple(t.r.sim.state.earthExpedition)!==t.source||tuple(t.r.sim.state.localLife)!==t.load)
  return fail('Observation source, physical context or story changed.');
 t.validated=true;t.revision=t.r.adventure.revision;return{ok:true};
}
function consumeObservation(ctx,ticket){
 const t=ticket&&tickets.get(ticket);if(!t||t.used||!t.validated)return fail('Validate observation before its durable command.');
 const c=check(t.r,ctx);if(!c.ok)return c;
 const expected=JSON.parse(t.record);expected.observed=true;
 if(tuple(t.r.sim.state.earthWildSigns)!==tuple(expected)||t.r.adventure.revision!==t.revision+1||tuple(t.r.sim.state.earthExpedition)!==t.source||tuple(t.r.sim.state.localLife)!==t.load)
  return fail('Consume only after the single expected observed fact was saved.');
 t.used=true;return{ok:true};
}
function reset(sim,reason='owner-change'){end(live.get(sim),String(reason));return{ok:true};}
const api=Object.freeze({ID,ROOM,PATH,LIMITS,begin,current,isProjection,tick,acknowledge,observationTicket,validateObservation,consumeObservation,reset});
G.RealmEarthGrazerMotion=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
