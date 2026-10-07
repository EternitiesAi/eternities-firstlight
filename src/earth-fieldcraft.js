/* Living Road fieldcraft. Transient fitting only: no saves, inventory,
 * payment or quest mutation. E.command validates this proof at the incomplete
 * first-brace boundary after its existing completed-step duplicate return. */
(function(G){'use strict';
const ROOM='world-earthlands',STEP='brace-root-channel',KIND='earth-fieldcraft-v1';
const plans=new WeakMap(),tickets=new WeakMap(),views=new WeakMap(),bySim=new WeakMap();
const fail=error=>({ok:false,error}),rad=n=>n*Math.PI/180;
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const from=[-143.294,1.75,-78.9],to=[-143.294,3.78,-71.1];
const delta=to.map((n,i)=>n-from[i]),length=Math.hypot(...delta),sectionLength=length/4;
const lerp=t=>from.map((n,i)=>n+delta[i]*t);
const receivers=Array.from({length:5},(_,i)=>({id:'east-joint-'+i,face:'east',point:lerp(i/4)}));
const sections=Array.from({length:4},(_,i)=>({id:'brace-'+(i+1),index:i,from:lerp(i/4),to:lerp((i+1)/4),receiverFrom:receivers[i].id,receiverTo:receivers[i+1].id}));
const previewBounds=freeze({yaw:{min:0,max:rad(20)},pitch:{min:0,max:rad(35)}});
const GEOMETRY=freeze({kind:KIND,room:ROOM,floor:1.57,workPoint:{x:-145,z:-84,y:1.57},
 from,to,length,sectionLength,width:.16,depth:.025,color:0x9a7953,
 targetYaw:0,targetPitch:Math.atan2(delta[1],delta[2]),yawTolerance:rad(2),pitchTolerance:rad(2),endpointTolerance:.055,
 initialYaw:rad(12),initialPitch:0,previewBounds,sections,receivers});
const wrap=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
// The app mints/stamps this transient owner identity. Rules never mint a lease,
// mutate the Simulation marker, or infer ownership from persistence counters.
const opaqueLease=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.isFrozen(v)&&Reflect.ownKeys(v).length===0&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const dependencies=()=>({E:G.RealmEarthExpedition,W:G.RealmWorldFoundations});
function phase(sim){
 const {E}=dependencies();if(!E)return fail('The expedition rules are unavailable.');
 let ledger;try{ledger=E.validate(sim?.state?.earthExpedition);}catch(e){return fail(e.message);}
 const story=ledger.story;
 if(story.steps.includes(STEP))return{ok:true,duplicate:true,ledger};
 const step=E.definition.steps.find(s=>s.id===STEP);
 if(!story.accepted||story.claimed||!step||!step.requires.every(id=>story.steps.includes(id)))return fail('Accept this job and clear its actual bank infestation before fitting the supplied support.');
 return{ok:true,ledger};
}
function support(sim){
 const {E,W}=dependencies();
 if(!E||!W||sim?.room!==ROOM||W.definition(sim.room)?.id!=='earthlands'||sim.worldDive)return false;
 try{
  if(!E.at(sim,GEOMETRY.workPoint))return false;
  const wall=W.definition(ROOM).solids.find(s=>s.id==='elderweald-root-east-wall');
  return !!wall&&receivers.every(r=>Math.abs(r.point[0]-(wall.x+wall.w/2))<.02&&r.point[1]>=GEOMETRY.floor&&r.point[1]<=GEOMETRY.floor+wall.h&&Math.abs(r.point[2]-wall.z)<=wall.d/2);
 }catch{return false;}
}
function owner(ctx){
 const sim=ctx?.sim,a=sim?.state?.adventure,trip=sim?.worldTrip;
 if(!sim||!sim.state||typeof ctx.active!=='string'||!ctx.active||!Number.isSafeInteger(ctx.revision)||ctx.revision<0)return fail('Read this worksite with the current active character.');
 if(!opaqueLease(ctx.ownerLease)||sim.fieldcraftOwnerLease!==ctx.ownerLease)return fail('This fitting needs the current app-owned worksite lease.');
 if(!a?.started||!Number.isFinite(a.hp)||a.hp<=0||!Number.isSafeInteger(a.revision)||!Number.isSafeInteger(a.deaths))return fail('Reach the supplied support while alive and able to act.');
 if(!trip||trip.active!==ctx.active||trip.realm!=='earthlands'||!sim.returnPos||![sim.returnPos.x,sim.returnPos.z,sim.returnPos.yaw].every(Number.isFinite)||JSON.stringify(trip.home)!==JSON.stringify(sim.returnPos))return fail('This Earth outing no longer owns its original home checkpoint.');
 if(!support(sim))return fail('Stand on the supported brace work point beside the east wall.');
 return{ok:true};
}
function check(r,ctx){
 if(!r||r.cancelled)return fail('This unfinished fitting has ended. Inspect the supplied kit again.');
 if(!ctx||r.sim!==ctx.sim||r.active!==ctx.active||r.ownerLease!==ctx.ownerLease||r.ownerLease!==ctx.sim.fieldcraftOwnerLease||r.state!==ctx.sim.state||r.adventure!==ctx.sim.state.adventure||r.room!==ctx.sim.room||r.trip!==ctx.sim.worldTrip||r.earthTrip!==ctx.sim.earthTrip)return fail('The character, imported world or outing changed. Inspect the supplied kit again.');
 const sim=ctx.sim,a=sim.state.adventure;
 if(a.revision!==r.adventureRevision||a.deaths!==r.deaths||JSON.stringify(sim.returnPos)!==r.home||JSON.stringify(sim.worldTrip)!==r.tripValue)return fail('The world or home checkpoint changed. Inspect the supplied kit again.');
 const owned=owner(ctx);if(!owned.ok)return owned;
 const p=phase(sim);if(!p.ok||p.duplicate||JSON.stringify(p.ledger)!==r.phase)return fail('The accepted brace work changed. Inspect the supplied kit again.');
 return{ok:true};
}
// Read-only art has no Store handle. Last observed revision is diagnostic data;
// the live Simulation lease and all world guards determine display ownership.
const remembered=r=>({sim:r.sim,active:r.active,revision:r.observedRevision,ownerLease:r.ownerLease});
function checked(ctx,plan){const r=plans.get(plan),result=check(r,ctx);if(result.ok)r.observedRevision=ctx.revision;return result.ok?{ok:true,r}:result;}
function direction(yaw,pitch){return[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];}
function previewEnd(section,yaw,pitch){const d=direction(yaw,pitch);return section.from.map((n,i)=>n+d[i]*sectionLength);}
function fitting(r){
 return r.seated.length===sections.length&&r.seated.every((s,i)=>s.id===sections[i].id&&Math.abs(wrap(s.yaw-GEOMETRY.targetYaw))<=GEOMETRY.yawTolerance+1e-12&&Math.abs(s.pitch-GEOMETRY.targetPitch)<=GEOMETRY.pitchTolerance+1e-12&&distance(s.end,sections[i].to)<=GEOMETRY.endpointTolerance+1e-12&&r.inspected.has(sections[i].receiverFrom)&&r.inspected.has(sections[i].receiverTo));
}
function projection(plan){
 const r=plans.get(plan);if(!r||!check(r,remembered(r)).ok)return null;
 const active=sections[r.seated.length]||null;
 const view=freeze({kind:'earth-fieldcraft-projection-v1',status:active?'fitting':'ready',complete:!active,
  activeSection:active?.id??null,yaw:r.yaw,pitch:r.pitch,
  sections:sections.map(s=>{const seated=r.seated.some(p=>p.id===s.id),current=s===active;return{id:s.id,index:s.index,from:[...s.from],to:seated?[...s.to]:current?previewEnd(s,r.yaw,r.pitch):[...s.to],seated,preview:current,width:GEOMETRY.width,depth:GEOMETRY.depth,yaw:seated?GEOMETRY.targetYaw:r.yaw,pitch:seated?GEOMETRY.targetPitch:r.pitch};}),
  receivers:receivers.map(p=>({...p,point:[...p.point],inspected:r.inspected.has(p.id)}))});
 views.set(view,{r,epoch:r.epoch});return view;
}
function isProjection(value,ledger){const v=value&&typeof value==='object'?views.get(value):null;return !!v&&(ledger===undefined||ledger===v.r.sim.state.earthExpedition)&&v.epoch===v.r.epoch&&check(v.r,remembered(v.r)).ok;}
function current(sim){const plan=bySim.get(sim);return plan?projection(plan):null;}
function begin(ctx){
 const owned=owner(ctx);if(!owned.ok)return owned;
 const p=phase(ctx.sim);if(!p.ok)return p;if(p.duplicate)return{ok:true,duplicate:true,plan:null,text:'The permanent brace is already recorded. Its history is retained.'};
 const previous=bySim.get(ctx.sim);if(previous)cancel(previous);
 const sim=ctx.sim,plan=Object.freeze({kind:KIND+'-plan'}),r={sim,state:sim.state,adventure:sim.state.adventure,active:ctx.active,observedRevision:ctx.revision,ownerLease:ctx.ownerLease,
  adventureRevision:sim.state.adventure.revision,deaths:sim.state.adventure.deaths,room:sim.room,trip:sim.worldTrip,earthTrip:sim.earthTrip,
  home:JSON.stringify(sim.returnPos),tripValue:JSON.stringify(sim.worldTrip),phase:JSON.stringify(p.ledger),ledger:p.ledger,
  yaw:GEOMETRY.initialYaw,pitch:GEOMETRY.initialPitch,inspected:new Set(),seated:[],cancelled:false,ticket:null,epoch:0};
 plans.set(plan,r);bySim.set(sim,plan);return{ok:true,plan,view:projection(plan),text:'Four supplied sections. Inspect the east-wall receiving sockets, correct each preview and seat it. Unfinished fitting is not saved.'};
}
function inspect(ctx,plan,receiverId){
 const c=checked(ctx,plan);if(!c.ok)return c;const r=c.r,s=sections[r.seated.length];if(!s)return fail('All four sections are seated. Deliberately fasten the brace.');
 const ids=receiverId===undefined?[s.receiverFrom,s.receiverTo]:[receiverId];
 if(ids.some(id=>!receivers.some(p=>p.id===id&&p.face==='east')))return fail('Inspect the east-wall support sockets. The root, passage face and drain are not brace receivers.');
 for(const id of ids)r.inspected.add(id);r.epoch++;return{ok:true,view:projection(plan),text:'East-wall receiving sockets inspected. The living root and drainage stay clear.'};
}
function adjust(ctx,plan,pose){
 const c=checked(ctx,plan);if(!c.ok)return c;const r=c.r,s=sections[r.seated.length];if(!s)return fail('All four sections are seated. Deliberately fasten the brace.');
 if(!pose||typeof pose!=='object'||Array.isArray(pose)||!Number.isFinite(pose.yaw)||!Number.isFinite(pose.pitch)||pose.yaw<previewBounds.yaw.min||pose.yaw>previewBounds.yaw.max||pose.pitch<previewBounds.pitch.min||pose.pitch>previewBounds.pitch.max)return fail('Use finite yaw from 0-20 degrees and pitch from 0-35 degrees, supplied in radians.');
 if(pose.sectionId!==undefined&&pose.sectionId!==s.id||pose.receiverFrom!==undefined&&pose.receiverFrom!==s.receiverFrom||pose.receiverTo!==undefined&&pose.receiverTo!==s.receiverTo)return fail('Fit this labelled section between its own two east-wall sockets.');
 r.yaw=wrap(pose.yaw);r.pitch=pose.pitch;r.epoch++;return{ok:true,view:projection(plan)};
}
function seat(ctx,plan){
 const c=checked(ctx,plan);if(!c.ok)return c;const r=c.r,s=sections[r.seated.length];if(!s)return fail('All four sections are already seated. Deliberately fasten the brace.');
 if(!r.inspected.has(s.receiverFrom)||!r.inspected.has(s.receiverTo))return fail('Inspect both receiving sockets before seating this section.');
 const end=previewEnd(s,r.yaw,r.pitch),yawError=Math.abs(wrap(r.yaw-GEOMETRY.targetYaw)),pitchError=Math.abs(r.pitch-GEOMETRY.targetPitch),endError=distance(end,s.to);
 if(yawError>GEOMETRY.yawTolerance+1e-12||pitchError>GEOMETRY.pitchTolerance+1e-12||endError>GEOMETRY.endpointTolerance+1e-12)return{...fail('Correct yaw and pitch until this section meets its far socket, then seat it.'),yawError,pitchError,endError};
 r.seated.push({id:s.id,yaw:r.yaw,pitch:r.pitch,end});r.yaw=GEOMETRY.initialYaw;r.pitch=GEOMETRY.initialPitch;r.epoch++;
 if(r.seated.length===sections.length){const ticket=Object.freeze({kind:KIND+'-fitting'});tickets.set(ticket,{r,used:false});r.ticket=ticket;}
 return{ok:true,view:projection(plan),...(r.ticket?{ticket:r.ticket}:{}),text:s.id+' seated'+(r.ticket?'. All four sections are ready for deliberate fastening.':'. Fit the next labelled section.')};
}
function validate(ctx,ticket){
 const t=ticket&&typeof ticket==='object'?tickets.get(ticket):null;if(!t||t.used)return fail('A current, unconsumed four-section fitting is required.');
 const checked=check(t.r,ctx);if(!checked.ok)return checked;if(!fitting(t.r))return fail('Inspect and seat all four supplied sections before fastening.');t.r.observedRevision=ctx.revision;return{ok:true};
}
function consume(ticket){
 const t=ticket&&typeof ticket==='object'?tickets.get(ticket):null;if(!t||t.used||t.r.cancelled)return fail('This fitting authority is unavailable.');
 const r=t.r,sim=r.sim,a=sim.state?.adventure,p=phase(sim);
 const expected=JSON.parse(r.phase);expected.story.steps.push(STEP);
 // E.commit advances Adventure revision exactly once and adopts its validated
 // completed ledger only after a synchronous durable saver returns {ok:true}.
 // The caller must call consume only on that actual successful command result.
 if(sim.fieldcraftOwnerLease!==r.ownerLease||sim.state!==r.state||a!==r.adventure||a.revision!==r.adventureRevision+1||a.deaths!==r.deaths||!Number.isFinite(a.hp)||a.hp<=0||sim.room!==r.room||sim.worldTrip!==r.trip||sim.earthTrip!==r.earthTrip||JSON.stringify(sim.worldTrip)!==r.tripValue||JSON.stringify(sim.returnPos)!==r.home||!support(sim)||!p.ok||!p.duplicate||JSON.stringify(p.ledger)!==JSON.stringify(expected)||!fitting(r))return fail('Consume fitting authority only after the existing durable brace command succeeds.');
 t.used=true;r.cancelled=true;r.epoch++;return{ok:true};
}
function cancel(plan){const r=plan&&typeof plan==='object'?plans.get(plan):null;if(!r)return fail('Unknown fitting plan.');r.cancelled=true;r.epoch++;if(r.ticket){const t=tickets.get(r.ticket);if(t)t.used=true;}return{ok:true};}
const api=Object.freeze({GEOMETRY,previewBounds,begin,inspect,adjust,seat,validate,consume,cancel,projection,isProjection,current});G.RealmEarthFieldcraft=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
