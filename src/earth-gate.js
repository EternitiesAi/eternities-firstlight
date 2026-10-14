/* Gate decision and durable transactions. Pure proposed records are never
 * accepted as evidence that the three physical travellers have arrived. */
(function(G){'use strict';
const M=G.RealmEarthGateModel||(typeof require==='function'?require('./earth-gate-model.js'):null);
const Motion=G.RealmEarthGateMotion||(typeof require==='function'?require('./earth-gate-motion.js'):null);
if(!M||!Motion)throw Error('Load the gate model and physical escort before commands.');
const definition=M.definition,fail=error=>({ok:false,error});
function current(ctx){try{return typeof ctx?.current==='function'&&ctx.current()===true;}catch{return false;}}
function validate(raw,adventure){const q=M.validate(raw);if(q.accepted&&adventure?.started!==true)throw Error('Invalid gate captain record: expedition kit required.');return q;}
function eligible(state){return state?.adventure?.started===true;}
function at(sim,p){const C=G.RealmCore,E=G.RealmEarth;return!!(C&&E&&sim instanceof C.Simulation&&p&&sim.room===definition.room&&p.room===definition.room&&!sim.worldDive&&E.walkable(p.x,p.z,.31)&&E.walkable(sim.state.player.x,sim.state.player.z,.31)&&Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<=2.4&&C.segment(sim.state.player,p,sim.navRoom,.035));}
function command(ctx,type,payload={},io){
 const sim=ctx?.sim,C=G.RealmCore;
 if(!C||!(sim instanceof C.Simulation)||!payload||typeof payload!=='object'||Array.isArray(payload)||payload.quest!==definition.id)return fail('Read this exact gate outing before acting.');
 const state=sim.state,a=state.adventure,sandbox=state.sandbox,inventory=sandbox.inventory;
 if(typeof ctx.active!=='string'||!ctx.active||!current(ctx)||payload.expectedActive!==ctx.active||payload.expectedRevision!==a.revision)return fail('The character or gate record changed. Read the current action again.');
 if(!eligible(state)||a.hp<=0||sim.paused||sim.worldDive||sim.room!==definition.room)return fail('Take the expedition kit and resume on the Hearthwater approach while able to act.');
 let q;try{q=validate(a.earthGate,a);}catch(e){return fail(e.message);}
 let proof=null;
 if(type==='accept'||type==='claim'){if(!at(sim,definition.giver))return fail('Meet the gate captain on the north common.');}
 else if(type==='read'){if(!at(sim,definition.evidence.find(e=>e.id===payload.evidence)))return fail('Approach this physical register, waybill or screen to inspect it.');}
 else if(type==='prepare'){if(!q.plan||!at(sim,definition.plans[q.plan].prepare))return fail('Reach the chosen lane or shelter before preparing it.');}
 else if(type==='checkpoint'){
  proof=Motion.validateArrival(ctx,payload.ticket);if(!proof.ok)return proof;
 }else if(type!=='choose')return fail('Unknown gate captain action.');
 const proposed=M.transition(q,type,proof?{checkpoint:proof.checkpoint}:payload);if(!proposed.ok)return proposed;
 if(proposed.duplicate)return{ok:true,duplicate:true,text:'This action is already recorded for these travellers. Nothing was charged or paid again.'};
 for(const [key,n] of Object.entries(proposed.cost||{}))if(!Object.hasOwn(inventory,key)||!Number.isSafeInteger(inventory[key])||inventory[key]<n)return fail('Preparation requires exactly 4 timber and 2 fibre. Your plan and supplies remain unchanged.');
 if(proposed.reward&&a.coins+proposed.reward.coins>definition.coinCap)return fail('Make room for the whole 8-sunmark fee. The group’s recorded arrival remains; nothing was paid.');
 if(typeof io?.save!=='function')return fail('A durable character saver is required; nothing was changed.');
 if(a.revision>=1e9||state.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before extending its record.');
 const active=ctx.active,room=sim.room,before=JSON.stringify(state),trip=sim.earthTrip,home=JSON.stringify(sim.returnPos);
 const reward=proposed.reward?{xp:Math.min(proposed.reward.xp,definition.xpCap-a.xp),coins:proposed.reward.coins}:null;
 let text=type==='accept'?'The Gate Captain’s Choice accepted. Inspect the three records, prepare one destination, then lead all three travellers.'
  :type==='read'?definition.evidence.find(e=>e.id===payload.evidence).text
  :type==='choose'?definition.plans[proposed.state.plan].name+' selected. Preparation and any stated material charge remain separate.'
  :type==='prepare'?(q.plan==='temporary-shelter'?'Weather screen prepared · spent exactly 4 timber and 2 fibre.':'Inspection lane prepared with the captain’s supplied guides. No personal materials spent.')+' Meet the three travellers by their cart to lead them.'
  :type==='checkpoint'?(proposed.state.outcome==='admitted'?'All three travellers reached the staffed inspection point and were admitted. The duplicate manifests remain under review.':proposed.state.outcome==='sheltered'?'All three travellers reached the maintained shelter. They are sheltered while the manifests are checked; no later admission is claimed.':'All three travellers reached '+proof.checkpoint.replace(/-/g,' ')+'. This escort checkpoint is saved.')
  :'Gate captain’s fee claimed once · +'+reward.xp+' XP, +8 sunmarks.'+(reward.xp<15?' Stored XP stays at the existing 9999 cap.':'');
 let checked,saved;
 try{
  const candidate=sim.snapshot();candidate.adventure.earthGate=proposed.state;candidate.adventure.revision++;
  for(const [key,n] of Object.entries(proposed.cost||{}))candidate.sandbox.inventory[key]-=n;
  if(reward){candidate.adventure.xp+=reward.xp;candidate.adventure.coins+=reward.coins;}
  candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'earth-gate',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
  checked=C.validate(candidate);if(JSON.stringify(checked.adventure.earthGate)!==JSON.stringify(proposed.state))throw Error('The validator did not retain the exact gate record.');
  const bytes=JSON.stringify(checked);saved=io.save(checked);if(JSON.stringify(checked)!==bytes)return fail('The writer changed the checked gate candidate; nothing was adopted.');
 }catch(e){return fail('Gate save refused: '+e.message);}
 if(!saved?.ok||saved.adopted===false||typeof saved.then==='function')return fail(saved?.error||'The gate action was not saved. Nothing was adopted.');
 if(!current(ctx)||ctx.active!==active||sim.state!==state||state.adventure!==a||state.sandbox!==sandbox||sandbox.inventory!==inventory||sim.room!==room||sim.earthTrip!==trip||JSON.stringify(sim.returnPos)!==home||JSON.stringify(state)!==before)return fail('The character or outing changed while saving. Read the current gate record again.');
 a.earthGate=checked.adventure.earthGate;a.revision=checked.adventure.revision;
 for(const key of Object.keys(proposed.cost||{}))inventory[key]=checked.sandbox.inventory[key];
 if(reward){a.xp=checked.adventure.xp;a.coins=checked.adventure.coins;}
 state.journal=checked.journal;state.nextEvent=checked.nextEvent;
 const result={ok:true,text,...(reward?{reward}:{}),...(proposed.cost?{cost:proposed.cost}:{})};
 if(proof){const consumed=Motion.consume(ctx,payload.ticket);if(!consumed.ok){Motion.reset(sim,'saved-checkpoint-reload');result.warning='The checkpoint was saved. Resume the group from that recorded point.';}}
 return result;
}
const api=Object.freeze({definition,fresh:M.fresh,validate,eligible,at,command,motion:Motion});G.RealmEarthGate=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
