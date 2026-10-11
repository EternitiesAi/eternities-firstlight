/* Ground-supported transient foley. No commands, context unlock, or save fields. */
(function(G){'use strict';
const LIMITS=Object.freeze({duration:.14,stride:.78,minInterval:.18,stillAfter:.2,voices:2,maxRate:192000,busGain:.22});
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
function synthesize(material,rate){
 if(!['soil','timber','stone'].includes(material)||!Number.isInteger(rate)||rate<8000||rate>LIMITS.maxRate)throw new RangeError('Unsupported footfall material or sample rate.');
 const n=Math.ceil(rate*LIMITS.duration),out=new Float32Array(n);let seed=material==='soil'?173:material==='timber'?479:811,low=0,prev=0;
 const frequency=material==='soil'?87:material==='timber'?154:246;
 for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed/4294967296)*2-1,t=i/rate;low+=.12*(noise-low);const high=noise-prev;prev=noise;
  const contact=material==='soil'?.23*low+.055*high:material==='timber'?.075*noise+.19*Math.sin(2*Math.PI*frequency*t)*Math.exp(-t*34):.11*high+.12*Math.sin(2*Math.PI*frequency*t)*Math.exp(-t*48);
  const thud=.22*Math.sin(2*Math.PI*68*t)*Math.exp(-t*42),window=Math.sin(Math.PI*i/(n-1))**2*Math.exp(-t*12);out[i]=(contact+thud)*window;
 }out[0]=0;out[n-1]=0;return out;
}
class Footfalls{
 #baseline=null;#distance=0;#lastStep=-Infinity;#stillSince=null;#voices=new Set();#buffers=new Map();#watermarks=new WeakMap();#audioTime=-Infinity;
 constructor(ctx,master){
  if(!ctx||!master||!Number.isInteger(ctx.sampleRate)||ctx.sampleRate<8000||ctx.sampleRate>LIMITS.maxRate)throw new TypeError('An existing supported audio context and master are required.');
  this.ctx=ctx;this.disposed=false;this.bus=null;
  try{
   this.bus=ctx.createGain();this.bus.gain.value=LIMITS.busGain;this.bus.connect(master);
   for(const m of ['soil','timber','stone']){const samples=synthesize(m,ctx.sampleRate),b=ctx.createBuffer(1,samples.length,ctx.sampleRate);b.getChannelData(0).set(samples);this.#buffers.set(m,b);}
  }catch{
   // An optional graph cannot prevent the existing ambient/master path.
   try{this.bus?.disconnect();}catch{}this.#buffers.clear();this.disposed=true;
  }
 }
 #retire(v){
  if(!this.#voices.delete(v))return;
  if(v.source){try{v.source.onended=null;}catch{}try{v.source.stop();}catch{}try{v.source.disconnect();}catch{}}
  if(v.gain)try{v.gain.disconnect();}catch{}
 }
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
  const now=this.ctx.currentTime,end=now+LIMITS.duration,voice={source:null,gain:null,end};
  // Register before the first allocation so every partial node has an owner.
  this.#voices.add(voice);
  try{
   voice.source=this.ctx.createBufferSource();voice.gain=this.ctx.createGain();
   voice.source.buffer=this.#buffers.get(material);voice.gain.gain.value=1;
   voice.source.connect(voice.gain);voice.gain.connect(this.bus);
   voice.source.onended=()=>this.#retire(voice);voice.source.start(now);voice.source.stop(end);
  }catch{this.#retire(voice);this.#reset();return{step:false};}
  return{step:true,material};
 }
 snapshot(){return{disposed:this.disposed,voices:this.#voices.size,buffers:this.#buffers.size,bufferBytes:[...this.#buffers.values()].reduce((n,b)=>n+b.length*4,0)};}
 dispose(){if(this.disposed)return;this.#reset();this.#buffers.clear();try{this.bus?.disconnect();}catch{}this.disposed=true;}
}
const api=Object.freeze({Footfalls,LIMITS,surface,synthesize});G.RealmGroundedFootfalls=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
