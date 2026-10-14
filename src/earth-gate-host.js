/* The live app owns escort leases, simulation ticks and checkpoint writes.
 * Presentation reads a branded frame; refused writes require an explicit retry. */
(function(G){'use strict';
const Gate=G.RealmEarthGate||(typeof require==='function'?require('./earth-gate.js'):null);
if(!Gate)throw Error('Load gate rules before the app escort host.');
class GateHost{
 constructor(api){this.api=api;this.owner=null;this.blocked=null;}
 context(){const base=this.api.context(),s=base.sim,next=[s,s.state,s.state.adventure,base.active,s.room,s.earthTrip,s.worldTrip,s.worldDive,s.state.adventure.deaths,JSON.stringify(s.returnPos),JSON.stringify(s.earthTrip)];
  if(!this.owner||next.some((v,i)=>v!==this.owner[i])){this.reset('app-owner-change');s.gateEscortOwnerLease=Object.freeze({});this.owner=next;}
  return{...base,definition:Gate.definition,ownerLease:s.gateEscortOwnerLease};
 }
 reset(reason='app-owner-change'){if(this.owner){const s=this.owner[0];Gate.motion.reset(s,reason);s.gateEscortOwnerLease=Object.freeze({});s.gatePresentation=null;s.gatePresentationContext=null;}this.owner=null;this.blocked=null;}
 present(ctx=this.context()){const s=ctx.sim,v=Gate.motion.current(ctx);s.gatePresentationContext=ctx;s.gatePresentation=v;
  if(!v?.ready)this.blocked=null;return v;
 }
 status(){const ctx=this.context(),view=this.present(ctx);return{view,error:this.blocked?.message||null};}
 command(type,payload){const ctx=this.context(),r=Gate.command(ctx,type,payload,{save:world=>ctx.current()?this.api.save(world):{ok:false,error:'The gate writer changed character.'}});this.present(ctx);return r;}
 control(type){const ctx=this.context();let r;
  if(type==='retry')return this.checkpoint(ctx,true);
  if(type==='lead')r=Gate.motion.begin(ctx);else if(type==='wait')r=Gate.motion.wait(ctx);else return{ok:false,error:'Choose lead, wait or retry.'};
  this.present(ctx);return r.ok?{...r,text:type==='lead'?'Walk beside the three travellers. They will wait if you get too far ahead.':'The group will wait here until you lead again.'}:r;
 }
 checkpoint(ctx,explicit=false){const proof=Gate.motion.arrivalTicket(ctx);if(!proof.ok)return proof;
  if(this.blocked?.ticket===proof.ticket&&!explicit)return{ok:false,error:this.blocked.message};
  const r=Gate.command(ctx,'checkpoint',{quest:Gate.definition.id,expectedActive:ctx.active,expectedRevision:ctx.sim.state.adventure.revision,ticket:proof.ticket},{save:world=>ctx.current()?this.api.save(world):{ok:false,error:'The gate writer changed character.'}});
  if(!r.ok){this.blocked={ticket:proof.ticket,message:r.error};if(!explicit)this.api.notify?.('The group reached its stop, but saving failed. Open the Gate Captain journal to retry. '+r.error);}
  else{this.blocked=null;if(ctx.sim.state.adventure.earthGate.outcome)this.api.notify?.('All three travellers arrived. Return to the captain for the agreed fee.');}
  this.present(ctx);return r;
 }
 tick(dt){const ctx=this.context(),q=ctx.sim.state.adventure.earthGate;
  if(ctx.sim.room!==Gate.definition.room||!q.accepted||ctx.sim.state.adventure.hp<=0||ctx.sim.worldDive){this.present(ctx);return;}
  const r=Gate.motion.tick(ctx,dt);if(!r.ok){this.present(ctx);return r;}
  if(r.view.ready&&!ctx.sim.paused&&!this.blocked)this.checkpoint(ctx);else this.present(ctx);return r;
 }
}
G.RealmEarthGateHost={GateHost};if(typeof module!=='undefined')module.exports=G.RealmEarthGateHost;
})(globalThis);
