/* One optional supplied Earth load. Motion owns arrival authority; these rules
 * own a synchronous whole-candidate commit and the exact once-only payment. */
(function(G){'use strict';
const D=G.RealmEarthConsignmentData;if(!D)throw Error('Load consignment data before command rules.');
const fail=error=>({ok:false,error}),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),point=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const opaque=o=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.isFrozen(o)&&Reflect.ownKeys(o).length===0&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
function scope(ctx){
 const sim=ctx?.sim,C=G.RealmCore,W=G.RealmWorldFoundations,a=sim?.state?.adventure,trip=sim?.worldTrip;
 if(typeof C?.Simulation!=='function'||typeof C.validate!=='function'||typeof W?.definition!=='function'||typeof W.walkable!=='function'||typeof W.segment!=='function')return fail('The actual Core and supported-world dependencies are unavailable.');
 if(!(sim instanceof C.Simulation)||ctx.definition!==D.definition||typeof ctx.active!=='string'||!ctx.active||!Number.isSafeInteger(ctx.revision)||ctx.revision<0||!opaque(ctx.ownerLease)||sim.consignmentOwnerLease!==ctx.ownerLease)return fail('Use the current character, app-owned load lease and canonical commission.');
 if(sim.room!==D.ROOM||W?.definition(sim.room)?.id!=='earthlands'||sim.worldDive||!a?.started||!Number.isFinite(a.hp)||a.hp<=0||!Number.isSafeInteger(a.revision)||!Number.isSafeInteger(a.deaths))return fail('Reach dry Earthlands while able to act.');
 if(!trip||trip.active!==ctx.active||trip.realm!=='earthlands'||!point(sim.returnPos)||!Number.isFinite(sim.returnPos.yaw)||!same(trip.home,sim.returnPos))return fail('Retain this character’s Earth outing and original home checkpoint.');
 if(!point(sim.state.player)||!W.walkable(sim.room,sim.state.player.x,sim.state.player.z,.31)||!Object.hasOwn(sim.state.localLife?.records||{},D.ID))return fail('Stand on supported ground with the current five-record save owner.');
 try{
  const source=G.RealmEarthExpedition.validate(sim.state.earthExpedition);
  if(!source.story.claimed)return fail('Explicitly claim the original Living Road before this separate supplied commission.');
  return{ok:true,sim,source,record:D.crossValidate(sim.state.localLife.records[D.ID],source)};
 }catch(e){return fail(e.message);}
}
function at(sim,p){const W=G.RealmWorldFoundations;return point(p)&&Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<=2.8&&W.walkable(sim.room,p.x,p.z,.31)&&W.segment(sim.room,sim.state.player,p,.31);}
function commit(sim,candidate,io,text){
 if(typeof io?.save!=='function'||io.save.constructor?.name==='AsyncFunction')return fail('A synchronous durable consignment saver is required.');
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this world before continuing: record limit reached.');
 candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'local-life',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;
 try{
  checked=G.RealmCore.validate(candidate);
  const expected=D.crossValidate(candidate.localLife.records[D.ID],candidate.earthExpedition);
  if(!same(checked.localLife?.records?.[D.ID],expected)||!same(checked.localLife,candidate.localLife)||!same(checked.earthExpedition,candidate.earthExpedition)||!same(checked.sandbox.inventory,candidate.sandbox.inventory)||!same(checked.adventure,candidate.adventure))throw Error('The current Core save validator does not retain the exact consignment, original histories and payment.');
  saved=io.save(checked);
 }catch(e){return fail('Consignment save refused: '+e.message);}
 if(saved?.then!==undefined)return fail('The saver returned an asynchronous receipt; local completion was not adopted. Inspect durable state before retrying.');
 if(saved?.ok!==true)return fail(saved?.error||'Consignment save refused. Finished work remains unpaid.');
 sim.state.localLife=checked.localLife;
 sim.state.adventure.coins=checked.adventure.coins;sim.state.adventure.revision=checked.adventure.revision;
 Object.assign(sim.state.sandbox.inventory,checked.sandbox.inventory);sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
function command(ctx,type,payload={},io){
 if(typeof type!=='string'||!payload||typeof payload!=='object'||payload.quest!==D.ID)return fail('Read this exact consignment before acting.');
 const c=scope(ctx);if(!c.ok)return c;const {sim,record:r,source}=c;
 if(type==='accept'&&r.accepted)return{ok:true,duplicate:true,text:'This supplied load and its selected course are already retained.'};
 if(type==='claim'&&r.claimed)return{ok:true,duplicate:true,text:'This consignment was already paid once.'};
 if(type==='step'&&r.accepted&&r.steps.includes(payload.step))return{ok:true,duplicate:true,text:'This carrier arrival is already recorded.'};
 let candidate,next,text,motion=null,ticket=null,reward=null;
 try{candidate=sim.snapshot();next=candidate.localLife.records[D.ID];}catch(e){return fail('Consignment candidate refused: '+e.message);}
 if(type==='accept'){
  const choice=D.choice(payload.choice);
  if(!choice||choice.branch!==source.story.branch||!at(sim,D.definition.giver))return fail('Read the supplied consignment board at the glade and choose one course matching your retained allocation.');
  next.accepted=true;next.choice=choice.id;
  text=D.definition.title+' accepted · '+choice.name+'. A new camp-supplied consignment remains at the glade; no ordinary inventory or earlier allocation was spent.';
 }else if(type==='step'){
  if(!r.accepted||r.claimed)return fail('Only an accepted, unpaid carrier arrival can be recorded.');
  const step=D.required(r)[r.steps.length],target=D.routes[D.choice(r.choice).route][r.steps.length+1];
  if(!step||payload.step!==step||!at(sim,target))return fail('Approach this load’s exact next receiving stop in its chosen course.');
  motion=G.RealmEarthConsignmentMotion;ticket=payload.motionTicket;
  if(motion?.DEFINITION!==D.definition||typeof motion.validateArrival!=='function'||typeof motion.consume!=='function')return fail('The physical carrier authority is unavailable. No arrival was recorded.');
  let proof;try{proof=motion.validateArrival(ctx,ticket,step);}catch(e){return fail('Carrier arrival refused: '+e.message);}
  if(proof?.ok!==true||proof?.then!==undefined)return fail(proof?.error||'Physically bring the supplied carrier to this stop before recording arrival.');
  next.steps.push(step);text='Supplied consignment arrived · '+target.id.replace(/-/g,' ')+'. Its physical carrier checkpoint is retained.';
 }else if(type==='claim'){
  if(!r.accepted||r.steps.length!==D.required(r).length||!at(sim,D.definition.returner))return fail('Bring the supplied load to its receiving bay, then return to Merren for the separate declared payment.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=D.definition.reward,max=G.RealmSandbox?.MAX;
  if(!Number.isSafeInteger(max)||a.coins+fee.coins>9999||Object.entries(fee.materials).some(([id,n])=>!Object.hasOwn(inv,id)||inv[id]+n>max))return fail('Make room for all 4 sunmarks, 2 timber and 2 fibre. Completed work remains unpaid.');
  a.coins+=fee.coins;for(const[id,n]of Object.entries(fee.materials))inv[id]+=n;next.claimed=true;
  reward={xp:0,coins:fee.coins,ore:0,materials:{...fee.materials}};
  text='Merren registered this supplied load · +4 sunmarks, +2 timber, +2 fibre. Claimed once; the receiving stock remains separate.';
 }else return fail('Unknown consignment action.');
 const result=commit(sim,candidate,io,text);if(!result.ok)return result;if(reward)result.reward=reward;
 const warnings=[];
 if(motion){try{const consumed=motion.consume(ctx,ticket);if(consumed?.ok!==true||consumed?.then!==undefined)throw Error(consumed?.error||'physical arrival cleanup refused');}catch(e){warnings.push('Arrival was saved; carrier cleanup needs refresh: '+e.message);}}
 try{const sync=typeof io?.sync==='function'?io.sync:typeof G.RealmAdventure?.syncScene==='function'?()=>G.RealmAdventure.syncScene(sim):null;if(sync){const s=sync(sim);if(s===false||s?.ok===false||s?.then!==undefined)throw Error(s?.error||'scene synchronization refused');}}catch(e){warnings.push('Consignment completion was saved; scene refresh needs attention: '+e.message);}
 if(warnings.length)result.warning=warnings.join(' ');return result;
}
const api=Object.freeze({definition:D.definition,command});G.RealmEarthConsignment=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
