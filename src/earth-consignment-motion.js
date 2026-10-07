/* First load through: transient physical motion, never saved progress or cargo.
 * Load Core, WorldFoundations and EarthConsignmentData first. The app owns the
 * lease and living-hostile query; command rules own whole-candidate persistence. */
(function(G){'use strict';
const D=G.RealmEarthConsignmentData;
if(!D)throw Error('Load EarthConsignmentData before consignment motion.');
const DEFINITION=D.definition,ROOM=D.ROOM,ID=D.ID;
const LIMITS=Object.freeze({radius:.65,speed:1.6,approach:2.8,farWait:10,maxDt:.1});
const bySim=new WeakMap(),views=new WeakMap(),tickets=new WeakMap();
const fail=error=>({ok:false,error}),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const copyPoint=p=>p?Object.freeze({id:p.id,x:p.x,z:p.z}):null;
const opaque=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.isFrozen(v)&&Reflect.ownKeys(v).length===0&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const tuple=v=>JSON.stringify(v),finitePoint=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const dependencies=()=>({C:G.RealmCore,W:G.RealmWorldFoundations});
function record(sim){
 const owner=sim?.state?.localLife;
 if(!owner||owner.version!==1||!owner.records||!Object.hasOwn(owner.records,ID))throw Error('The accepted first-load record is unavailable.');
 return D.crossValidate(owner.records[ID],sim.state.earthExpedition);
}
function owned(ctx){
 const {C,W}=dependencies(),sim=ctx?.sim,a=sim?.state?.adventure,trip=sim?.worldTrip;
 if(!C||!W||!sim||!(sim instanceof C.Simulation)||!sim.state||ctx.definition!==DEFINITION||typeof ctx.active!=='string'||!ctx.active||!Number.isSafeInteger(ctx.revision)||ctx.revision<0)return fail('Read this load with the current character and canonical commission.');
 if(!opaque(ctx.ownerLease)||sim.consignmentOwnerLease!==ctx.ownerLease)return fail('The current app-owned consignment lease is required.');
 if(sim.room!==ROOM||W.definition(ROOM)?.id!=='earthlands'||sim.worldDive)return fail('The supplied load stays on dry Earthlands ground.');
 if(!a?.started||!Number.isFinite(a.hp)||a.hp<=0||!Number.isSafeInteger(a.deaths)||!Number.isSafeInteger(a.revision)||!Number.isFinite(sim.elapsed)||sim.elapsed<0)return fail('The living traveller must be able to act.');
 if(!trip||trip.active!==ctx.active||trip.realm!=='earthlands'||!finitePoint(sim.returnPos)||!Number.isFinite(sim.returnPos.yaw)||tuple(trip.home)!==tuple(sim.returnPos))return fail('The Earth outing must retain its original home checkpoint.');
 if(!finitePoint(sim.state.player)||!W.walkable(ROOM,sim.state.player.x,sim.state.player.z,.31))return fail('Stand on supported Earthlands ground.');
 let value;try{value=record(sim);}catch(e){return fail(e.message);}
 if(!value.accepted||value.claimed)return fail('Only an accepted, unpaid first load has a transient carrier.');
 return{ok:true,record:value};
}
function remembered(r){return{sim:r.sim,active:r.active,revision:r.observedRevision,ownerLease:r.lease,definition:DEFINITION,threat:r.threat};}
function check(r,ctx){
 if(!r||r.ended)return fail('This transient load journey has ended. Read its saved checkpoint again.');
 const sim=ctx?.sim;
 if(sim!==r.sim||ctx.active!==r.active||ctx.ownerLease!==r.lease||sim?.state!==r.state||sim.state.adventure!==r.adventure||sim.room!==r.room||sim.worldTrip!==r.trip||sim.earthTrip!==r.earthTrip||tuple(sim.returnPos)!==r.home||tuple(sim.worldTrip)!==r.tripValue||sim.state.adventure.deaths!==r.deaths)return fail('The character, imported world, death or Earth outing changed.');
 const c=owned(ctx);if(!c.ok)return c;if(sim.elapsed+1e-9<r.lastElapsed)return fail('The simulation clock changed outside this load journey.');
 if(tuple(c.record)!==r.recordValue)return fail('The accepted route, payment or saved arrival prefix changed.');
 const {W}=dependencies();if(!W.walkable(ROOM,r.x,r.z,LIMITS.radius))return fail('The load no longer stands on supported ground.');
 return c;
}
function end(r,reason){
 if(!r)return;r.ended=true;r.epoch++;r.path=[];r.reason=reason;
 if(r.ticket){const t=tickets.get(r.ticket);if(t)t.used=true;}
 if(bySim.get(r.sim)===r)bySim.delete(r.sim);
}
function get(ctx,initialize=true){
 const sim=ctx?.sim;let r=sim&&typeof sim==='object'?bySim.get(sim):null;
 if(r){const c=check(r,ctx);if(c.ok){r.observedRevision=ctx.revision;r.threat=ctx.threat;return{ok:true,r};}end(r,c.error);if(!initialize)return c;}
 if(!initialize)return fail('Read the accepted load before moving it.');
 const c=owned(ctx);if(!c.ok)return c;
 const value=c.record,choice=D.choice(value.choice),route=D.routes[choice.route],index=value.steps.length,p=route[index];
 const {W}=dependencies();if(!p||!W.walkable(ROOM,p.x,p.z,LIMITS.radius))return fail('The saved load checkpoint is unsupported.');
 r={sim,state:sim.state,adventure:sim.state.adventure,active:ctx.active,lease:ctx.ownerLease,observedRevision:ctx.revision,threat:ctx.threat,
  room:sim.room,trip:sim.worldTrip,earthTrip:sim.earthTrip,home:tuple(sim.returnPos),tripValue:tuple(sim.worldTrip),deaths:sim.state.adventure.deaths,
  recordValue:tuple(value),choice:value.choice,cargoKind:choice.cargo.kind,route,index,x:p.x,z:p.z,yaw:0,
  status:index===route.length-1?'complete':'waiting',reason:index===route.length-1?'durable-arrival':'waiting',detail:'',path:[],ticket:null,epoch:0,ended:false,distanceTraveled:0,lastElapsed:sim.elapsed};
 bySim.set(sim,r);return{ok:true,r};
}
function view(r){
 const next=r.route[r.index+1]||null,paused=r.sim.paused&&r.status==='moving';
 const value=Object.freeze({kind:'earth-consignment-projection-v1',job:ID,room:ROOM,choice:r.choice,cargoKind:r.cargoKind,
  x:r.x,z:r.z,yaw:r.yaw,moving:r.status==='moving'&&!paused,status:paused?'paused':r.status,reason:paused?'paused':r.reason,detail:r.detail,
  checkpointIndex:r.index,checkpoint:copyPoint(r.route[r.index]),next:copyPoint(next),loaded:true,arrived:r.index===r.route.length-1,ready:r.status==='ready',distanceTraveled:r.distanceTraveled});
 views.set(value,{r,epoch:r.epoch});return value;
}
function current(ctx){const c=get(ctx);return c.ok?view(c.r):null;}
function isProjection(value,ctx){
 const v=value&&typeof value==='object'?views.get(value):null;if(!v||v.epoch!==v.r.epoch)return false;
 const c=check(v.r,ctx||remembered(v.r));if(!c.ok){end(v.r,c.error);return false;}return true;
}
function nearby(r){const {W}=dependencies(),p=r.sim.state.player;return distance(p,r)<=LIMITS.approach&&W.segment(ROOM,p,r,.31);}
function suspend(r,reason,detail='',status='blocked'){
 r.status=status;r.reason=reason;r.detail=detail;r.path=[];r.epoch++;return{ok:true,view:view(r)};
}
function threat(ctx,r,to){
 if(typeof ctx.threat!=='function'||ctx.threat.constructor?.name==='AsyncFunction')return{clear:false,reason:'The live hostile check is unavailable.',unavailable:true};
 try{
  const result=ctx.threat(Object.freeze({job:ID,room:ROOM,from:Object.freeze({x:r.x,z:r.z}),to:Object.freeze({x:to.x,z:to.z}),radius:LIMITS.radius}));
  if(!result||typeof result!=='object'||Array.isArray(result)||result.then!==undefined||typeof result.clear!=='boolean'||result.reason!==undefined&&(typeof result.reason!=='string'||result.reason.length>200))throw Error('Invalid hostile check');
  return result;
 }catch{return{clear:false,reason:'The live hostile check was refused.',unavailable:true};}
}
function resume(ctx){
 const c=get(ctx);if(!c.ok)return c;const r=c.r;
 if(r.status==='ready'||r.status==='complete')return{ok:true,view:view(r)};
 if(r.sim.paused)return fail('Resume time before asking the carrier to continue.');
 if(!nearby(r))return fail('Approach within 2.8 supported metres of the load before continuing.');
 const next=r.route[r.index+1],t=threat(ctx,r,r);if(!t.clear)return suspend(r,t.unavailable?'threat-unavailable':'threat',t.reason||'A living hostile is near the load.');
 const {C,W}=dependencies();let path;
 try{path=C.pathfind(r,next,{id:ROOM},false,LIMITS.radius);}catch{path=null;}
 let previous=r;
 let supported=false;try{supported=Array.isArray(path)&&path.length>0&&finitePoint(path.at(-1))&&distance(path.at(-1),next)<=1e-9&&!path.some(p=>{const good=finitePoint(p)&&W.segment(ROOM,previous,p,LIMITS.radius);previous=p;return!good;});}catch{}
 if(!supported)return suspend(r,'route-blocked','The supported route to the next stop is blocked.');
 r.path=path.map(p=>({x:p.x,z:p.z}));r.status='moving';r.reason='continuing';r.detail='';r.lastElapsed=r.sim.elapsed;r.epoch++;return{ok:true,view:view(r)};
}
function wait(ctx){const c=get(ctx);if(!c.ok)return c;const r=c.r;if(r.status==='ready'||r.status==='complete')return{ok:true,view:view(r)};return suspend(r,'waiting','', 'waiting');}
function update(ctx,dt){
 if(!Number.isFinite(dt)||dt<0||dt>LIMITS.maxDt)return fail('Supply one finite simulation step from 0 to 0.1 seconds.');
 const c=get(ctx);if(!c.ok)return c;const r=c.r;
 const available=r.sim.elapsed-r.lastElapsed;r.lastElapsed=r.sim.elapsed;
 if(r.sim.paused||dt===0||r.status!=='moving')return{ok:true,view:view(r)};
 if(available<=0||available+1e-9<dt)return fail('Advance motion after one fresh Core simulation tick; elapsed time cannot be reused.');
 if(distance(r.sim.state.player,r)>LIMITS.farWait)return suspend(r,'player-far','The traveller is more than 10 metres away.','waiting');
 const {C,W}=dependencies(),duration=Math.min(dt,available);let budget=duration*LIMITS.speed;
 while(budget>0&&r.path.length){
  const target=r.path[0],length=distance(r,target),amount=Math.min(length,budget),to=length===0?{x:target.x,z:target.z}:{x:r.x+(target.x-r.x)*amount/length,z:r.z+(target.z-r.z)*amount/length};
  if(distance(r.sim.state.player,to)>LIMITS.farWait)return suspend(r,'player-far','The next step would carry the load more than 10 metres away.','waiting');
  const t=threat(ctx,r,to);if(!t.clear)return suspend(r,t.unavailable?'threat-unavailable':'threat',t.reason||'A living hostile is near the load.');
  let supported=false;try{const verified=C.pathfind(r,to,{id:ROOM},false,LIMITS.radius);supported=Array.isArray(verified)&&verified.length>0&&!verified.some(p=>!finitePoint(p))&&distance(verified.at(-1),to)<=1e-9&&W.segment(ROOM,r,to,LIMITS.radius);}catch{}
  if(!supported)return suspend(r,'route-blocked','The next physical movement segment is blocked.');
  const moved=distance(r,to);if(moved>LIMITS.speed*duration+1e-9||moved>amount+1e-9)return suspend(r,'route-blocked','The movement solver refused a bounded step.');
  if(moved>0)r.yaw=Math.atan2(to.x-r.x,to.z-r.z);
  r.x=to.x;r.z=to.z;r.distanceTraveled+=moved;r.epoch++;budget-=amount;
  if(amount===length){r.path.shift();}else break;
 }
 if(!r.path.length){
  const next=r.route[r.index+1];if(distance(r,next)>1e-9)return suspend(r,'route-blocked','The solver did not reach the exact receiving stop.');
  r.status='ready';r.reason='arrival-ready';r.detail='';r.epoch++;
  r.ticket=Object.freeze({kind:'earth-consignment-arrival-v1'});tickets.set(r.ticket,{r,used:false,validated:false,step:D.required(r.choice)[r.index]});
 }
 return{ok:true,view:view(r)};
}
function arrivalTicket(ctx){const c=get(ctx,false);if(!c.ok)return c;const r=c.r;if(r.status!=='ready'||!r.ticket)return fail('Physically bring this load to its next stop first.');return{ok:true,ticket:r.ticket};}
const otherRecords=sim=>tuple(Object.fromEntries(Object.entries(sim.state.localLife.records).filter(([id])=>id!==ID)));
function validateArrival(ctx,ticket,expectedStep){
 const t=ticket&&typeof ticket==='object'?tickets.get(ticket):null;if(!t||t.used)return fail('A current physical arrival ticket is required.');
 const c=check(t.r,ctx);if(!c.ok){end(t.r,c.error);return c;}const r=t.r;
 if(expectedStep!==t.step||r.status!=='ready'||r.ticket!==ticket||distance(r,r.route[r.index+1])>1e-9||!nearby(r))return fail('Record only this load’s exact next stop while standing nearby.');
 t.validated=true;t.adventureRevision=r.adventure.revision;t.otherRecords=otherRecords(r.sim);r.observedRevision=ctx.revision;
 return{ok:true};
}
function consume(ctx,ticket){
 const t=ticket&&typeof ticket==='object'?tickets.get(ticket):null;if(!t||t.used||!t.validated||t.r.ended)return fail('Validate this physical arrival before its durable command.');
 const r=t.r,sim=ctx?.sim,c=owned(ctx);if(!c.ok)return c;
 const expected=JSON.parse(r.recordValue);expected.steps.push(t.step);
 if(sim!==r.sim||ctx.active!==r.active||ctx.ownerLease!==r.lease||sim.state!==r.state||sim.state.adventure!==r.adventure||sim.room!==r.room||sim.worldTrip!==r.trip||sim.earthTrip!==r.earthTrip||tuple(sim.returnPos)!==r.home||tuple(sim.worldTrip)!==r.tripValue||sim.state.adventure.deaths!==r.deaths||sim.state.adventure.revision!==t.adventureRevision+1||tuple(c.record)!==tuple(expected)||otherRecords(sim)!==t.otherRecords||r.status!=='ready'||r.ticket!==ticket||distance(r,r.route[r.index+1])>1e-9)return fail('Consume arrival authority only after the single expected arrival was saved.');
 t.used=true;r.ticket=null;r.index++;r.recordValue=tuple(c.record);r.path=[];r.status=r.index===r.route.length-1?'complete':'waiting';r.reason=r.status==='complete'?'durable-arrival':'waiting';r.detail='';r.observedRevision=ctx.revision;r.epoch++;
 return{ok:true,view:view(r)};
}
function reset(sim,reason='owner-change'){if(sim&&typeof sim==='object')end(bySim.get(sim),String(reason));return{ok:true};}
const api=Object.freeze({DEFINITION,LIMITS,current,isProjection,continue:resume,wait,update,arrivalTicket,validateArrival,consume,reset});
G.RealmEarthConsignmentMotion=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
