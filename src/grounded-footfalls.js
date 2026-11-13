/* Ground-supported transient foley. No commands, context unlock, or save fields. */
(function(G){'use strict';
const LIMITS=Object.freeze({stride:.78,minInterval:.18,stillAfter:.2,voices:2,maxRate:192000,busGain:1});
const soil=new Set(['woodland-country','woodland-west','woodland-east','field-approach','working-fields','coppice-spur','coppice-pocket','elderweald-north-junction','elderweald-tended-edge','elderweald-clearing-country','elderweald-wetland-rim','elderweald-south-bank','elderweald-root-country','elderweald-return-moor','elderweald-meadow-return','elderweald-field-return']);
const offsets=[[0,0],[.31,0],[-.31,0],[0,.31],[0,-.31],[.31*.707,.31*.707],[-.31*.707,.31*.707],[.31*.707,-.31*.707],[-.31*.707,-.31*.707]];
const data=(name,file)=>G[name]||(typeof require==='function'?require('./'+file):null),inside=(x,z,p)=>Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2;
function owners(){return{C:data('RealmCore','core.js'),W:data('RealmWorldFoundations','world-foundations.js'),E:data('RealmEarth','earth.js')};}
function genuine(sim,C){return !!C&&sim instanceof C.Simulation&&Object.hasOwn(sim,'state')&&Object.hasOwn(sim,'elapsed')&&sim.state&&Object.hasOwn(sim.state,'player')&&sim.state.player&&[sim.state.player.x,sim.state.player.z,sim.elapsed,sim.state.adventure?.hp].every(Number.isFinite);}
function surface(sim){
 const {C,W,E}=owners();if(!genuine(sim,C)||sim.worldDive||sim.state.adventure.hp<=0)return null;const p=sim.state.player;
 if(sim.room===E?.ROOM){const b=E.BRIDGE;return E.walkable(p.x,p.z,.31)&&Math.abs(p.x-b.x)<=b.walkWidth/2-.31&&p.z>=b.from+.31&&p.z<=b.to-.31?'stone':null;}
 if(sim.room!=='world-earthlands'||!W?.walkable(sim.room,p.x,p.z,.31))return null;const def=W.definition(sim.room);
 const material=(x,z)=>{const patch=def.patches.filter(q=>inside(x,z,q)).sort((a,b)=>a.w*a.d-b.w*b.d)[0];if(!patch)return null;
  // Deck skins are narrower than their supported ground; use the actual art
  // interiors as well as the canonical patch, never a room/palette guess.
  if(patch.id==='channel-bridge')return Math.abs(x)<=3.35&&z>=17&&z<=93?'timber':null;
  if(patch.id==='elderweald-footbridge')return Math.abs(x+125)<=2.51&&z>=-52.97&&z<=-45.03?'timber':null;
  return soil.has(patch.id)?'soil':null;
 };const m=material(p.x,p.z);return m&&offsets.every(([dx,dz])=>material(p.x+dx,p.z+dz)===m)?m:null;
}
class Footfalls{
 #baseline=null;#distance=0;#lastStep=-Infinity;#stillSince=null;#voices=new Set();#watermarks=new WeakMap();#audioTime=-Infinity;
 constructor(ctx,master){
  if(!ctx||!master||!Number.isInteger(ctx.sampleRate)||ctx.sampleRate<8000||ctx.sampleRate>LIMITS.maxRate)throw new TypeError('An existing supported audio context and master are required.');
  this.ctx=ctx;this.disposed=false;this.bus=null;
  try{
   this.bus=ctx.createGain();this.bus.gain.value=LIMITS.busGain;this.bus.connect(master);
  }catch{
   // An optional graph cannot prevent the existing ambient/master path.
   try{this.bus?.disconnect();}catch{}this.disposed=true;
  }
 }
 #retire(v){if(!this.#voices.delete(v))return;try{v.stop();}catch{}}
 #reset(){for(const v of [...this.#voices])this.#retire(v);this.#baseline=null;this.#distance=0;this.#lastStep=-Infinity;this.#stillSince=null;}
 update(input,t){
  if(this.disposed)return{step:false,disposed:true};const {C,W,E}=owners(),sim=input?.sim;
  if(!genuine(sim,C)||!Number.isFinite(t)||Math.abs(t-sim.elapsed)>1e-6||!Number.isSafeInteger(input.revision)||input.revision<0||!(input.active===null||typeof input.active==='string'&&input.active.length>0)||!Number.isFinite(this.ctx.currentTime)){this.#reset();return{step:false};}
  const oldMark=this.#watermarks.get(sim);if(oldMark&&oldMark.state===sim.state&&oldMark.active===input.active&&input.revision<oldMark.revision){this.#reset();return{step:false};}
  this.#watermarks.set(sim,{state:sim.state,active:input.active,revision:input.revision});
  if(this.ctx.currentTime<this.#audioTime){this.#audioTime=this.ctx.currentTime;this.#reset();return{step:false};}this.#audioTime=this.ctx.currentTime;
  // The ended callback may be delayed while the main thread is idle. Clock
  // retirement applies to stationary/short-stride samples as well as steps.
  for(const v of [...this.#voices])if(v.end<=this.ctx.currentTime)this.#retire(v);
  if(input.enabled!==true||input.hidden!==false||input.blocked!==false||sim.paused||this.ctx.state!=='running'||sim.state.adventure.hp<=0||sim.worldDive){this.#reset();return{step:false};}
  const material=surface(sim);if(!material){this.#reset();return{step:false};}const p=sim.state.player,prior=this.#baseline;
  const next={sim,state:sim.state,player:p,room:sim.room,active:input.active,trip:sim.worldTrip,earthTrip:sim.earthTrip,x:p.x,z:p.z,t,material};
  if(!prior||['sim','state','player','room','active','trip','earthTrip','material'].some(k=>prior[k]!==next[k])){this.#reset();this.#baseline=next;return{step:false};}
  const dt=t-prior.t,distance=Math.hypot(next.x-prior.x,next.z-prior.z),clear=sim.room===E.ROOM?E.segment(prior,next,.31):W.segment(sim.room,prior,next,.31);
  if(dt<=0||dt>.100001||distance>3.2*dt+1e-6||!clear){this.#reset();this.#baseline=next;return{step:false};}this.#baseline=next;
  if(distance<=1e-6){
   if(this.#stillSince===null)this.#stillSince=prior.t;
   if(t-this.#stillSince+1e-6>=LIMITS.stillAfter){this.#reset();this.#baseline=next;}
   return{step:false};
  }
  this.#stillSince=null;this.#distance+=distance;
  if(this.#distance<LIMITS.stride||t-this.#lastStep<LIMITS.minInterval)return{step:false};this.#distance%=LIMITS.stride;this.#lastStep=t;
  while(this.#voices.size>=LIMITS.voices)this.#retire(this.#voices.values().next().value);
  // the real footstep sample for this surface; a sample still decoding makes no sound for this step.
  let sound=null;try{sound=G.RealmAudio?.cue('step-'+material,{out:this.bus})||null;}catch{sound=null;}
  if(!sound)return{step:false};
  this.#voices.add(sound);
  return{step:true,material};
 }
 snapshot(){return{disposed:this.disposed,voices:this.#voices.size};}
 dispose(){if(this.disposed)return;this.#reset();try{this.bus?.disconnect();}catch{}this.disposed=true;}
}
const api=Object.freeze({Footfalls,LIMITS,surface});G.RealmGroundedFootfalls=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
