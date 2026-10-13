/* One optional ET02 outing. Core owns supported movement, Adventure owns the
 * single fox, and the current character writer owns durable completed facts. */
(function(G){'use strict';
const M=G.RealmBriarMoments||(typeof require==='function'?require('./briar-moments.js'):null);
const C=G.RealmCore||(typeof require==='function'?require('./core.js'):null);
const A=G.RealmAdventure||(typeof require==='function'?require('./adventure.js'):null);
const definition=Object.freeze({id:'briar-wayward-cloth-v1',title:'The Bowl Beside the Door',
 cloth:Object.freeze({x:0,z:25.4}),home:Object.freeze({x:2,z:8}),
 rest:Object.freeze({x:-12.25,z:-.65}),speed:3.2,arrival:.55});
const activities=new WeakMap(),quarantines=new WeakMap(),copy=o=>JSON.parse(JSON.stringify(o)),canonical=o=>JSON.stringify(o);
const fail=error=>({ok:false,error}),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const opaque=o=>o&&typeof o==='object'&&Object.isFrozen(o)&&Reflect.ownKeys(o).length===0&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
function scope(ctx,allowPaused=false){
 const sim=ctx?.sim,a=sim?.state?.adventure;
 if(!(sim instanceof C.Simulation)||ctx.definition!==definition||typeof ctx.active!=='string'||!ctx.active||!Number.isSafeInteger(ctx.revision)||ctx.revision<0||!opaque(ctx.ownerLease)||ctx.ownerLease!==sim.briarOwnerLease||typeof ctx.current!=='function')return fail('Use this character’s current Briar controls.');
 let live;try{live=ctx.current();}catch{return fail('The current character could not be checked.');}
 if(live?.sim!==sim||live.active!==ctx.active||live.ownerLease!==ctx.ownerLease)return fail('Briar’s outing belongs to a different character or world.');
 const actor=sim.adventureRuntime?.companion;
 if(sim.room!==null||sim.worldDive||(!allowPaused&&sim.paused)||a?.started!==true||a.companion?.bonded!==true||a.companion.mode!=='follow'||!(a.hp>0)||!actor||actor.room!==null||actor.seek||actor.guide)return fail('Return to Firstlight with a living, following Briar, away from other activities.');
 if(![actor,sim.state.player].every(p=>point(p)&&C.walkable(p.x,p.z,sim.navRoom,.31)))return fail('Briar and you need clear supported ground.');
 if(A.runtime(sim).enemies.some(e=>e.hp>0&&e.kind!=='practice'&&point(e)&&Math.min(dist(e,actor),dist(e,sim.state.player))<13))return fail('Make the nearby route safe before a quiet outing.');
 try{return{ok:true,sim,actor,record:M.fromWorld(sim.state)};}catch(e){return fail(e.message);}
}
function at(sim,actor,q,r=2.8){return dist(actor,q)<=definition.arrival&&dist(sim.state.player,q)<=r&&C.segment(actor,q,sim.navRoom,.31)&&C.segment(sim.state.player,q,sim.navRoom,.31);}
function restReady(o){return !o.yielding&&dist(o.actor,o.sim.state.player)>=1.05&&at(o.sim,o.actor,definition.rest);}
function owned(ctx,o){
 const s=scope(ctx,true),sim=ctx?.sim;
 return s.ok&&o&&o.sim===sim&&o.state===sim.state&&o.adventure===sim.state.adventure&&o.companion===sim.state.adventure.companion&&o.actor===s.actor&&o.active===ctx.active&&o.lease===ctx.ownerLease&&o.deaths===sim.state.adventure.deaths&&o.record===sim.state.briarMoments&&dist(o.last,s.actor)<1e-8?o:null;
}
function cancel(sim,reason='Outing cancelled · follow or ask again'){
 const o=activities.get(sim);if(!o)return false;activities.delete(sim);
 if(sim.adventureRuntime?.companion===o.actor){o.actor.path=[];o.actor.status=reason;}
 return true;
}
function current(ctx){
 const o=owned(ctx,activities.get(ctx?.sim));if(!o)return null;
 const actualPhase=o.uncertainFrom||o.phase;
 return{phase:o.phase,uncertain:o.phase==='uncertain',carrying:['returning','await-take'].includes(actualPhase),resting:!o.yielding&&dist(o.actor,o.sim.state.player)>=1.05&&['settled','rested'].includes(actualPhase)&&dist(o.actor,definition.rest)<=definition.arrival,readyToRemember:o.phase==='settled'&&restReady(o),yielding:!!o.yielding,waiting:o.waiting,distanceTravelled:o.travelled,status:o.actor.status,object:definition.id};
}
function availability(ctx){
 const s=scope(ctx,true),v=current(ctx);
 const uncertain=quarantines.has(ctx?.sim);
 return{ok:s.ok&&!uncertain,error:uncertain?quarantines.get(ctx.sim)+' Reload the saved character before writing again.':s.error||null,savingBlocked:uncertain,view:v,moments:s.ok?s.record.moments.slice():[],nearHome:s.ok&&dist(s.sim.state.player,definition.home)<=2.8&&C.segment(s.sim.state.player,definition.home,s.sim.navRoom,.31)};
}
function prompt(ctx){
 const v=current(ctx);if(!v)return null;
 const s=scope(ctx,true);if(!s.ok)return null;
 const guide=(text,action=null)=>Object.freeze({text,action});
 if(!saveAllowed(s.sim))return guide('Reload the saved character before continuing this moment.');
 if(s.sim.paused)return guide('Outing paused · resume before continuing with Briar.');
 if(v.yielding)return guide('Give Briar a little room beside the doorstep.');
 if(v.waiting)return guide('Briar is waiting · walk closer to your companion.');
 if(v.phase==='outbound')return guide('Walk beside Briar toward the lantern pier.');
 if(v.phase==='returning')return guide('Walk with Briar as the cloth comes home to the Commons.');
 if(v.phase==='resting')return guide('Walk with Briar to the shared-house doorstep.');
 if(v.phase==='await-take')return at(s.sim,s.actor,definition.home)?guide('Take the cloth from Briar','take'):guide('Walk beside Briar at the Commons to take the cloth.');
 if(v.phase==='settled')return v.readyToRemember?guide('Remember this doorstep moment with Briar','remember'):guide('Stand beside Briar with a little room at the doorstep before remembering.');
 if(v.phase==='rested')return guide('Doorstep moment kept · return to following','cancel');
 return null;
}
function saveAllowed(sim){return!quarantines.has(sim);}
function saveBlockReason(sim){return quarantines.get(sim)||null;}
function uncertain(sim,o,reason){quarantines.set(sim,'A save outcome is uncertain. '+reason);o.uncertainFrom=o.phase;o.phase='uncertain';return fail(reason+' Reload the saved character before retrying; no local moment was adopted.');}
function begin(ctx,phase,target){
 const s=scope(ctx);if(!s.ok)return s;
 if(activities.has(s.sim))return fail('Finish or explicitly cancel Briar’s current outing first.');
 if(dist(s.sim.state.player,definition.home)>2.8||dist(s.actor,s.sim.state.player)>3)return fail('Meet Briar beside the Commons path before this outing.');
 if(!C.walkable(target.x,target.z,s.sim.navRoom,.31))return fail('The chosen place is blocked. Clear it before asking Briar.');
 const path=C.pathfind(s.actor,target,s.sim.navRoom,false,.31);
 if(!path?.length)return fail('There is no supported route. Clear construction or approach from open ground.');
 const o={sim:s.sim,state:s.sim.state,adventure:s.sim.state.adventure,companion:s.sim.state.adventure.companion,actor:s.actor,active:ctx.active,lease:ctx.ownerLease,deaths:s.sim.state.adventure.deaths,record:s.sim.state.briarMoments,phase,path,last:{x:s.actor.x,z:s.actor.z},travelled:0,legTravelled:0,waiting:false,nextPath:0};
 activities.set(s.sim,o);s.actor.path=path.map(p=>({...p}));s.actor.status=phase==='outbound'?'Finding the dropped cloth · walk beside Briar':'Going to the sheltered doorstep';
 return{ok:true,text:s.actor.status};
}
function restSpace(sim,o,dt){
 const c=o.actor,p=sim.state.player,target=definition.rest,gap=dist(c,p);
 if(gap<.9)o.yielding=true;
 if(!o.yielding)return;
 c.status='Giving you room · leave a little space beside the doorstep';
 let q;
 if(gap<1.15){
  const angle=gap>.01?Math.atan2(c.x-p.x,c.z-p.z):Math.PI/2;
  const choices=Array.from({length:12},(_,i)=>{const a=angle+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/6;return{x:p.x+Math.sin(a)*1.35,z:p.z+Math.cos(a)*1.35};});
  q=choices.find(q=>dist(q,target)<2.3&&C.walkable(q.x,q.z,sim.navRoom,.31)&&C.segment(c,q,sim.navRoom,.31));
 }else if(dist(p,target)>=1.5){
  if(dist(c,target)<=definition.arrival){o.yielding=false;c.path=[];c.status=o.phase==='rested'?'Resting at the doorstep · Follow whenever you wish':'Resting at the doorstep · choose Remember this moment';return;}
  q=(C.pathfind(c,target,sim.navRoom,false,.31)||[])[0];
 }
 c.path=[];if(!q)return;
 const d=dist(c,q),amount=Math.min(d,dt*1.6),to={x:c.x+(q.x-c.x)/(d||1)*amount,z:c.z+(q.z-c.z)/(d||1)*amount};
 if(!C.segment(c,to,sim.navRoom,.31)||gap<1.05&&dist(to,p)<=gap)return;
 const old={x:c.x,z:c.z};sim.advance(c,[q],dt,1.6);
 o.last={x:c.x,z:c.z};o.travelled+=dist(old,c);o.legTravelled+=dist(old,c);
}
function tick(sim,dt){
 const o=activities.get(sim);if(!o)return false;
 let ctx;try{ctx=typeof sim.briarContext==='function'?sim.briarContext():null;}catch{}
 if(!owned(ctx,o)){cancel(sim,'Outing interrupted · nothing was recorded');return true;}
 if(sim.paused)return true;
 if(!Number.isFinite(dt)||dt<=0||dt>.2)return true;
 if(['settled','rested'].includes(o.phase)){restSpace(sim,o,dt);return true;}
 if(['await-take','uncertain'].includes(o.phase))return true;
 const target=o.phase==='outbound'?definition.cloth:o.phase==='returning'?definition.home:definition.rest,c=o.actor;
 if(!C.walkable(target.x,target.z,sim.navRoom,.31)){cancel(sim,'The destination is blocked · clear it and ask again');return true;}
 const gap=dist(c,sim.state.player);
 if(o.waiting?gap>2.5:gap>=4){o.waiting=true;c.status='Waiting for you · walk beside Briar';return true;}
 o.waiting=false;
 if(dist(c,target)<=definition.arrival&&o.legTravelled>0&&C.segment(c,target,sim.navRoom,.31)){
  if(o.phase==='outbound'){o.phase='returning';o.path=[];o.nextPath=0;o.legTravelled=0;c.status='Carrying the cloth home · keep Briar company';}
  else{o.phase=o.phase==='returning'?'await-take':M.fromWorld(sim.state).moments.includes(M.COMMONS_REST)?'rested':'settled';o.path=[];c.path=[];c.status=o.phase==='await-take'?'Cloth brought home · take it beside Briar':o.phase==='rested'?'Resting at the doorstep · Follow whenever you wish':'Resting at the doorstep · choose Remember this moment';}
  return true;
 }
 if(sim.elapsed>=o.nextPath||!o.path.length){o.path=C.pathfind(c,target,sim.navRoom,false,.31)||[];o.nextPath=sim.elapsed+.7;}
 const q=o.path[0];if(!q){cancel(sim,'The supported route is blocked · ask again from clear ground');return true;}
 const d=dist(c,q),amount=Math.min(d,dt*definition.speed),from={x:c.x,z:c.z},to={x:c.x+(q.x-c.x)/(d||1)*amount,z:c.z+(q.z-c.z)/(d||1)*amount};
 if(!C.segment(from,to,sim.navRoom,.31)){cancel(sim,'Construction blocks Briar’s next step · nothing was recorded');return true;}
 // A single-waypoint slice cannot consume an unchecked second segment.
 const step=[{x:q.x,z:q.z}];sim.advance(c,step,dt,definition.speed);
 if(!C.segment(from,c,sim.navRoom,.31)||dist(c,to)>1e-8){cancel(sim,'Briar’s movement changed unexpectedly · ask again');return true;}
 if(!step.length)o.path.shift();c.path=o.path.map(p=>({...p}));o.last={x:c.x,z:c.z};o.travelled+=dist(from,c);o.legTravelled+=dist(from,c);
 c.status=o.phase==='outbound'?'Finding the dropped cloth · walk beside Briar':o.phase==='returning'?'Carrying the cloth home · keep Briar company':'Going to the sheltered doorstep';return true;
}
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
function commit(ctx,o,moment,io,text){
 if(typeof io?.save!=='function'||io.save.constructor?.name==='AsyncFunction')return fail('A synchronous character saver is required; nothing was recorded.');
 const sim=ctx.sim,before=canonical(sim.state),state=sim.state;
 if(state.adventure.revision>=1e9||state.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this world before adding another moment.');
 let checked,result,invoked=false;
 try{
  const candidate=sim.snapshot();candidate.briarMoments.moments.push(moment);candidate.briarMoments.revision++;
  candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'briar-moment',text});if(candidate.journal.length>200)candidate.journal.shift();
  checked=C.validate(candidate);if(canonical(checked)!==canonical(candidate)||!owned(ctx,o)||canonical(sim.state)!==before)throw Error('The exact candidate or current owner changed.');
  freeze(checked);invoked=true;result=io.save(checked);
 }catch(e){return invoked?uncertain(sim,o,'The saver threw after invocation; its outcome is unknown: '+e.message):fail('Briar’s candidate was refused before saving: '+e.message+'. The physical work remains available for explicit retry.');}
 if(result?.then!==undefined)return uncertain(sim,o,'The saver returned an asynchronous, uncertain receipt.');
 if(result?.ok!==true)return fail(result?.error||'Saving was refused. The completed physical work is still available.');
 if(!owned(ctx,o)||sim.state!==state||canonical(sim.state)!==before||result.adopted===false){quarantines.set(sim,'The outgoing moment was saved, but not adopted into its changed local owner.');cancel(sim,'Saved moment needs readback · reload that character');return{ok:true,adopted:false,text,warning:'The outgoing moment was saved, but not adopted. Reload that saved character before continuing.'};}
 state.briarMoments=copy(checked.briarMoments);state.adventure.revision=checked.adventure.revision;state.journal=copy(checked.journal);state.nextEvent=checked.nextEvent;
 if(moment===M.CLOTH_HOME)cancel(sim,'The cloth is home · a shared moment kept');else{o.record=state.briarMoments;o.phase='rested';o.actor.status='Resting at the doorstep · Follow whenever you wish';}
 return{ok:true,adopted:true,text};
}
function command(ctx,type,payload={},io){
 if(!['start','take','rest','remember','cancel'].includes(type)||!payload||typeof payload!=='object'||Array.isArray(payload)||Reflect.ownKeys(payload).length)return fail('Use an explicit action from Briar’s outing; coordinates and extra terms are not accepted.');
 if(type!=='cancel'&&!saveAllowed(ctx?.sim))return fail(saveBlockReason(ctx?.sim)+' Reload the saved character before restarting or recording another moment.');
 const s=scope(ctx);if(!s.ok)return s;
 if(type==='cancel'){cancel(s.sim);return{ok:true,text:'Briar can follow normally. No unfinished moment was recorded.'};}
 if(type==='take'&&s.record.moments.includes(M.CLOTH_HOME)||type==='remember'&&s.record.moments.includes(M.COMMONS_REST))return{ok:true,duplicate:true,text:'That completed shared moment is already kept.'};
 if(type==='start'){if(s.record.moments.includes(M.CLOTH_HOME))return fail('The dropped cloth is already home. Briar can still rest at the familiar door.');return begin(ctx,'outbound',definition.cloth);}
 if(type==='rest'){if(!s.record.moments.includes(M.CLOTH_HOME))return fail('Bring the cloth home together before choosing a resting place.');return begin(ctx,'resting',definition.rest);}
 const o=owned(ctx,activities.get(s.sim));
 if(!o||o.yielding||o.phase!==(type==='take'?'await-take':'settled')||!(type==='take'?at(s.sim,o.actor,definition.home):restReady(o)))return fail('Complete the actual outing and stand beside Briar before recording that moment.');
 return commit(ctx,o,type==='take'?M.CLOTH_HOME:M.COMMONS_REST,io,type==='take'?'Briar brought the misplaced cloth home. You took it beside the Commons path.':'You chose the shared-house doorstep, and Briar settled there after your outing.');
}
const api=Object.freeze({definition,current,availability,prompt,command,tick,cancel,saveAllowed,saveBlockReason});
G.RealmBriarOuting=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
