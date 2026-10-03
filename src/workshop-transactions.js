/* Synchronous durable boundary for explicitly reviewed state-only workshop and
 * finite Road After Rain actions. Combat, movement, healing, other story effects
 * and hostile shops keep their live-runtime command paths. The caller supplies
 * its current simulation and existing character-store saver; this module owns
 * no storage or UI state. */
(function(G){'use strict';
const C=G.RealmCore||(typeof require==='function'?require('./core.js'):null);
const ADVENTURE=Object.freeze(['forge','arsenal-craft','socket','equip','trade','pursuit-fit','starter-claim','pursuit-claim',
 'earth-story-accept','earth-story-step','earth-story-dispatch','earth-story-arrive','earth-story-claim']);
const FIELDS=Object.freeze(['adventure','sandbox','journal','nextEvent']);
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=error=>({ok:false,error:String(error)});
function supports(domain,type){return domain==='sandbox'?type==='craft':domain==='adventure'&&ADVENTURE.includes(type);}
function command(sim,domain,id,type,payload,io){
 if(!supports(domain,type))return fail('This action is outside the durable workshop command set.');
 let before,candidate,result,checked;
 try{
  before=sim.snapshot();candidate=new C.Simulation(before);
  // snapshot() deliberately normalizes an outing to its home checkpoint. Rules
  // must still see the actual local workbench, merchant and paused context.
  candidate.room=sim.room;candidate.returnPos=clone(sim.returnPos);candidate.state.player=clone(sim.state.player);
  candidate.paused=sim.paused;candidate.worldDive=clone(sim.worldDive);
  const context={room:candidate.room,returnPos:clone(candidate.returnPos),player:clone(candidate.state.player),paused:candidate.paused,worldDive:clone(candidate.worldDive)};
  result=domain==='sandbox'?candidate.sandboxCommand(id,type,payload):candidate.adventureCommand(id,type,payload);
  if(!result?.ok||result.duplicate)return result||fail('Workshop command did not return a result.');
  if(candidate.room!==context.room||candidate.paused!==context.paused||!same(candidate.returnPos,context.returnPos)||!same(candidate.state.player,context.player)||!same(candidate.worldDive,context.worldDive)||candidate.adventureRuntime?.fx?.length||candidate.adventureRuntime?.arrows?.length)return fail('Workshop command changed live-only context; nothing was committed.');
  checked=candidate.snapshot();
  if(Object.keys(before).some(k=>!FIELDS.includes(k)&&!same(before[k],checked[k])))return fail('Workshop command changed an unrelated world field; nothing was committed.');
 }catch(e){return fail('Workshop transaction refused: '+e.message);}
 if(typeof io?.save!=='function')return fail('A synchronous durable workshop saver is required. Nothing was committed.');
 let saved;try{saved=io.save(checked);}catch(e){return fail('Workshop save refused: '+e.message);}
 if(saved&&typeof saved.then==='function')return fail('Workshop saver must return a synchronous save result. Live changes were not applied.');
 if(saved?.ok!==true)return fail(saved?.error||'Workshop save refused. Nothing was spent or equipped.');
 // Keep Simulation, state roots, player, paths, clocks and every actor/runtime.
 // Only canonical fields actually changed by the reviewed rule are adopted.
 for(const field of FIELDS)if(!same(before[field],checked[field])){
  if(field==='adventure'||field==='sandbox')Object.assign(sim.state[field],checked[field]);
  else sim.state[field]=checked[field];
 }
 return result;
}
const api={supports,command};G.RealmWorkshopTransactions=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
