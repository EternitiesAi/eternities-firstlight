/* Proposed optional investigation transactions. The real Core/Store own durable
 * candidates, GrazerMotion owns observation, and Adventure owns actual combat.
 * This module never spawns, moves or damages an actor. */
(function(G){'use strict';
const D=G.RealmEarthWildSignsData;if(!D)throw Error('Load Earth wild-signs data before command rules.');
const copy=o=>JSON.parse(JSON.stringify(o)),fail=error=>({ok:false,error});
const point=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const opaque=o=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.isFrozen(o)&&Reflect.ownKeys(o).length===0&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
const canonical=o=>JSON.stringify(o,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const same=(a,b)=>canonical(a)===canonical(b),pendingDeaths=new WeakMap();
function scope(ctx){
 const sim=ctx?.sim,C=G.RealmCore,W=G.RealmWorldFoundations,a=sim?.state?.adventure,t=sim?.worldTrip,h=sim?.returnPos;
 if(typeof C?.Simulation!=='function'||typeof C.validate!=='function'||typeof W?.definition!=='function'||typeof W.walkable!=='function'||typeof W.segment!=='function')return fail('Actual Core and supported-world owners are required.');
 if(!(sim instanceof C.Simulation)||ctx.definition!==D.definition||typeof ctx.active!=='string'||!ctx.active||!Number.isSafeInteger(ctx.revision)||ctx.revision<0||!opaque(ctx.ownerLease)||ctx.ownerLease!==sim.wildSignsOwnerLease)return fail('Use this character’s current app-owned signs context.');
 if(sim.room!==D.ROOM||W.definition(sim.room)?.id!=='earthlands'||sim.worldDive||!a?.started||!Number.isFinite(a.hp)||a.hp<=0||!Number.isSafeInteger(a.revision)||a.revision<0||!Number.isSafeInteger(a.deaths)||a.deaths<0)return fail('Reach dry Earthlands while able to act.');
 if(!t||t.active!==ctx.active||t.realm!=='earthlands'||!point(h)||!Number.isFinite(h.yaw)||!same(t.home,h))return fail('Retain the actual Earth outing and original home checkpoint.');
 if(!point(sim.state.player)||!W.walkable(sim.room,sim.state.player.x,sim.state.player.z,.31)||!Object.hasOwn(sim.state,'earthWildSigns'))return fail('Stand on supported ground with the installed signs save owner.');
 try{const record=D.crossValidate(sim.state.earthWildSigns,sim.state);if(!D.eligible(sim.state))return fail('Explicitly claim the supplied load before Sela’s separate investigation.');return{ok:true,sim,record};}catch(e){return fail(e.message);}
}
function at(sim,p){const W=G.RealmWorldFoundations;return point(p)&&Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<=2.8&&W.walkable(sim.room,p.x,p.z,.31)&&W.segment(sim.room,sim.state.player,p,.31);}
function snapshot(sim){const value=sim.snapshot();if(!Object.hasOwn(value,'earthWildSigns')||!same(D.crossValidate(value.earthWildSigns,value),D.crossValidate(sim.state.earthWildSigns,sim.state)))throw Error('The real snapshot must retain the exact optional signs owner.');return value;}
function owner(ctx){const s=ctx.sim;return{state:s.state,adventure:s.state.adventure,room:s.room,trip:s.worldTrip,earthTrip:s.earthTrip,home:canonical(s.returnPos),tripValue:canonical(s.worldTrip),lease:ctx.ownerLease,active:ctx.active,deaths:s.state.adventure.deaths,before:canonical(s.state)};}
function unchangedOwner(ctx,b){const s=ctx.sim;return s.state===b.state&&s.state.adventure===b.adventure&&s.room===b.room&&s.worldTrip===b.trip&&s.earthTrip===b.earthTrip&&canonical(s.returnPos)===b.home&&canonical(s.worldTrip)===b.tripValue&&s.wildSignsOwnerLease===b.lease&&ctx.ownerLease===b.lease&&ctx.active===b.active&&s.state.adventure.deaths===b.deaths&&canonical(s.state)===b.before;}
function commit(ctx,candidate,io,text){
 const sim=ctx.sim;
 if(typeof io?.save!=='function'||io.save.constructor?.name==='AsyncFunction')return fail('A synchronous durable signs saver is required.');
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this world before continuing: record limit reached.');
 const b=owner(ctx);candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'earth-wild-signs',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;
 try{
  const expected=canonical(candidate);checked=G.RealmCore.validate(candidate);
  D.crossValidate(checked.earthWildSigns,checked);
  if(!Object.hasOwn(checked,'earthWildSigns')||canonical(checked)!==expected)throw Error('Core must retain the exact whole candidate, all original owners and the complete fee.');
  if(!unchangedOwner(ctx,b)||!scope(ctx).ok)throw Error('The current owner changed before saving.');
  freezeCandidate(checked);saved=io.save(checked);
 }catch(e){return fail('Signs save refused: '+e.message);}
 if(saved?.then!==undefined)return fail('The saver returned an asynchronous receipt; no local completion was adopted. Inspect durable state before retrying.');
 if(saved?.ok!==true)return fail(saved?.error||'Signs save refused. Your work and fee remain unchanged.');
 if(!unchangedOwner(ctx,b))return{ok:true,text,adopted:false,warning:'The signs completion was saved. The active owner changed during saving; reload the saved outgoing world before continuing.'};
 const state=sim.state;state.earthWildSigns=copy(checked.earthWildSigns);state.adventure.coins=checked.adventure.coins;state.adventure.revision=checked.adventure.revision;
 state.sandbox.inventory.fiber=checked.sandbox.inventory.fiber;state.journal=copy(checked.journal);state.nextEvent=checked.nextEvent;
 return{ok:true,text,adopted:true};
}
function freezeCandidate(o){if(o&&typeof o==='object'){Object.values(o).forEach(freezeCandidate);Object.freeze(o);}return o;}
function observationContext(ctx,afterSave=false){
 if(typeof ctx.grazerContext!=='function')throw Error('Use a fresh actual grazer context factory.');
 const gc=ctx.grazerContext();
 if(!gc||gc.sim!==ctx.sim||gc.active!==ctx.active||!Number.isSafeInteger(gc.revision)||gc.revision<0||(!afterSave&&gc.revision!==ctx.revision)||(afterSave&&gc.revision<ctx.revision)||!opaque(gc.ownerLease)||gc.ownerLease!==ctx.sim.grazerOwnerLease)throw Error('Observation must belong to the same current traveller and real grazer lease.');
 return gc;
}
function finish(ctx,result,io,observation=null,death=null){
 if(!result.ok||result.adopted===false)return result;delete result.adopted;const warnings=[];
 if(observation){try{const value=observation.module.consumeObservation(observationContext(ctx,true),observation.ticket);if(value?.ok!==true||value?.then!==undefined)throw Error(value?.error||'observation cleanup refused');}catch(e){warnings.push('Observation was saved; its transient cleanup needs refresh: '+e.message);}}
 if(death)death.used=true;
 try{const sync=typeof io?.sync==='function'?io.sync:typeof G.RealmAdventure?.syncScene==='function'?()=>G.RealmAdventure.syncScene(ctx.sim):null;if(sync){const value=sync(ctx.sim);if(value===false||value?.ok===false||value?.then!==undefined)throw Error(value?.error||'scene synchronization refused');}}catch(e){warnings.push('Signs completion was saved; scene refresh needs attention: '+e.message);}
 if(warnings.length)result.warning=warnings.join(' ');return result;
}
const payloadKeys={accept:['quest'],read:['quest','evidence'],observe:['quest','observationTicket'],choose:['quest','resolution'],claim:['quest']};
function command(ctx,type,payload={},io){
 const keys=payloadKeys[type];if(!keys||!payload||typeof payload!=='object'||Array.isArray(payload)||Reflect.ownKeys(payload).length!==keys.length||!keys.every(k=>Object.hasOwn(payload,k))||payload.quest!==D.ID)return fail('Use an explicit action from this exact signs account.');
 const c=scope(ctx);if(!c.ok)return c;const {sim,record:r}=c;
 if(type==='accept'&&r.accepted)return{ok:true,duplicate:true,text:'This investigation is already accepted; its retained evidence and outcome remain.'};
 if(type==='claim'&&r.claimed)return{ok:true,duplicate:true,text:'Sela already paid this corrected account once.'};
 if(type==='read'&&r.evidence.includes(payload.evidence))return{ok:true,duplicate:true,text:'That distinct field mark is already recorded.'};
 if(type==='observe'&&r.observed)return{ok:true,duplicate:true,text:'The witnessed grazer behavior is already retained.'};
 if(type==='choose'&&r.resolution!==null)return r.resolution===payload.resolution?{ok:true,duplicate:true,text:'That deliberate response is already retained.'}:fail('The recorded response cannot be overwritten.');
 if(type!=='accept'&&(!r.accepted||r.claimed))return fail('Only an accepted, unpaid investigation can advance.');
 let candidate,next,text,proof=null,reward=null;
 try{candidate=snapshot(sim);next=candidate.earthWildSigns;}catch(e){return fail('Signs candidate refused: '+e.message);}
 if(type==='accept'){
  if(!at(sim,D.giver))return fail('Read Sela’s invitation at her actual Earthlands position.');
  next.accepted=true;text=D.definition.title+' accepted. Inspect the different marks, witness the harmless grazer, then deliberately choose a supported loop or a separate pest encounter. No inventory was spent.';
 }else if(type==='read'){
  const p=D.evidence.find(p=>p.id===payload.evidence);
  if(!p||!at(sim,p)||p.id==='pest-scrape'&&!r.observed)return fail('Reach this unrecorded field mark by its supported approach; the pest comparison needs the witnessed grazer first.');
  next.evidence.push(p.id);text=p.name+' recorded. '+p.text;
 }else if(type==='observe'){
  if(!['timber-gouge','feeding-track'].every(id=>r.evidence.includes(id))||!at(sim,D.overlook))return fail('Read both earlier marks and reach the supported overlook before recording a witnessed browse.');
  const O=G.RealmEarthGrazerMotion;
  if(typeof O?.validateObservation!=='function'||typeof O?.consumeObservation!=='function')return fail('The genuine grazer observation owner is unavailable.');
  let value;try{value=O.validateObservation(observationContext(ctx),payload.observationTicket);}catch(e){return fail('Observation refused: '+e.message);}
  if(value?.ok!==true||value?.then!==undefined)return fail(value?.error||'A private live observation ticket is required.');
  next.observed=true;proof={module:O,ticket:payload.observationTicket};text='A complete visible grazer browse and recovery were witnessed. The broad feeding marks differ from the narrow fresh gouge; inspect the separate pest scrape.';
 }else if(type==='choose'){
  const resolution=D.resolutions.find(p=>p.id===payload.resolution);
  if(!resolution||!r.observed||r.evidence.length!==3||!at(sim,D.evidence[2]))return fail('Compare all three marks at the pest scrape before deliberately choosing a response.');
  if(resolution.id==='signed-loop'){
   const W=G.RealmWorldFoundations;
   if(!D.bypass.every(p=>W.walkable(D.ROOM,p.x,p.z,.65))||!D.bypass.slice(1).every((p,i)=>W.segment(D.ROOM,D.bypass[i],p,.65)))return fail('The complete signed walking loop must remain supported and clear.');
  }
  next.resolution=resolution.id;text=resolution.name+' chosen. '+resolution.text;
 }else if(type==='claim'){
  if(!D.ready(r)||!at(sim,D.giver))return fail('Resolve the chosen response and return physically to Sela before taking its separate payment.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=D.definition.reward,max=G.RealmSandbox?.MAX;
  if(!Number.isSafeInteger(max)||!Number.isSafeInteger(a.coins)||a.coins+fee.coins>9999||!Number.isSafeInteger(inv.fiber)||inv.fiber+fee.materials.fiber>max)return fail('Make room for all 4 sunmarks and 3 fibre. Completed work remains unpaid.');
  a.coins+=fee.coins;inv.fiber+=fee.materials.fiber;next.claimed=true;reward=copy(fee);text=D.definition.completionText;
 }
 const result=commit(ctx,candidate,io,text);if(result.ok&&reward)result.reward=reward;return finish(ctx,result,io,proof);
}
function signature(sim){try{const r=D.crossValidate(sim?.state?.earthWildSigns,sim?.state);return D.ID+':'+(!r.accepted?'unaccepted':r.resolution||'investigating')+':'+(r.cleared?'cleared':'pending');}catch{return D.ID+':invalid';}}
function deathProof(ctx,e){
 const c=scope(ctx);if(!c.ok)return c;const {sim,record:r}=c,A=G.RealmAdventure,W=G.RealmWorldFoundations,t=D.enemy;
 if(!r.accepted||r.claimed||r.resolution!=='cleared-pocket'||r.cleared)return fail('Only the deliberately chosen, uncleared new pest pocket can record a defeat.');
 if(typeof A?.runtime!=='function')return fail('The actual Adventure enemy owner is unavailable.');
 const rt=A.runtime(sim),term='|'+signature(sim);
 if(rt.room!==D.ROOM||typeof rt.trailSignature!=='string'||!rt.trailSignature.endsWith(term)||ctx.sceneSignature!==rt.trailSignature||!Array.isArray(rt.enemies)||!rt.enemies.includes(e)||rt.enemies.filter(v=>v.id===t.id).length!==1)return fail('Use the exact current scene’s new-pest entry and signature.');
 if(!e||e.id!==t.id||e.wildSignsQuest!==D.ID||e.wildSignsOwnerLease!==ctx.ownerLease||e.kind!==t.kind||e.radius!==t.radius||e.maxHP!==t.hp||e.damage!==t.damage||e.hp!==0||e.xp!==0||e.coins!==0||e.ore!==0||e.originX!==t.x||e.originZ!==t.z||e.home?.x!==t.x||e.home?.z!==t.z||!point(e)||!W.walkable(D.ROOM,e.x,e.z,t.radius))return fail('Only the actual defeated new skitter with its canonical terms and live owner can clear this pocket.');
 let proof=pendingDeaths.get(e);
 if(proof&&(proof.used||proof.sim!==sim||proof.state!==sim.state||proof.adventure!==sim.state.adventure||proof.trip!==sim.worldTrip||proof.lease!==ctx.ownerLease||proof.active!==ctx.active||proof.signature!==rt.trailSignature||proof.record!==canonical(r)))return fail('This pending encounter belongs to a different owner or account.');
 if(!proof){proof={sim,state:sim.state,adventure:sim.state.adventure,trip:sim.worldTrip,lease:ctx.ownerLease,active:ctx.active,signature:rt.trailSignature,record:canonical(r),used:false};pendingDeaths.set(e,proof);}
 return{ok:true,sim,proof};
}
function recordClearance(ctx,e,io){
 const p=deathProof(ctx,e);if(!p.ok)return p;
 let candidate;try{candidate=snapshot(p.sim);candidate.earthWildSigns.cleared=true;}catch(error){return fail('Pest-clearance candidate refused: '+error.message);}
 return finish(ctx,commit(ctx,candidate,io,'The separate new pest was driven from its pocket. The grazer remains harmless; no kill loot or XP was granted.'),io,null,p.proof);
}
const api=Object.freeze({definition:D.definition,command,recordClearance,signature,at});G.RealmEarthWildSigns=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
