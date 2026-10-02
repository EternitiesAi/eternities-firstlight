/* Optional original atmosphere. Room/medium projection never owns gameplay,
 * music scores, consent or critical cues. One ambient bus has a bounded lifetime. */
(function(G){'use strict';
const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);};
const PROFILES=freeze({
 field:{id:'field',filter:450,frequency:130.81,noise:1,tone:.013,level:1,birds:true},
 coast:{id:'coast',filter:420,frequency:130.81,noise:.9,tone:.011,level:.9,birds:true},
 heaven:{id:'heaven',filter:610,frequency:146.83,noise:.5,tone:.012,level:.72,birds:false},
 hell:{id:'hell',filter:180,frequency:65.405,noise:.85,tone:.009,level:.8,birds:false},
 atlantis:{id:'atlantis',filter:350,frequency:174.61,noise:.8,tone:.010,level:.8,birds:false},
 submerged:{id:'submerged',filter:95,frequency:87.305,noise:.7,tone:.006,level:.65,birds:false},
 cosmos:{id:'cosmos',filter:260,frequency:98,noise:.35,tone:.010,level:.72,birds:false},
 interior:{id:'interior',filter:180,frequency:130.81,noise:.18,tone:.006,level:.45,birds:false}
});
function project(input={}){
 const room=input.room||'',hour=Number.isFinite(input.hour)?input.hour:12;
 let id=room==='world-heaven'?'heaven':room==='world-hell'?'hell':room==='world-atlantis'?(input.medium==='water'?'submerged':'atlantis'):room==='cosmos-near-expanse'?'cosmos':room==='world-earthlands'?'coast':!room||['riverbank','road','range','crossing','earth-hearthwater-approach'].includes(room)?'field':'interior';
 const quiet=!!input.paused||!!input.hidden||Number.isFinite(input.hp)&&input.hp<=0;
 return{profile:PROFILES[id],quiet,key:id+(quiet?':quiet':':active'),birds:!quiet&&PROFILES[id].birds&&hour>=6&&hour<=20};
}
class Soundscape{
 constructor(ctx,master,rng){
  if(!ctx||!master||typeof rng!=='function')throw new TypeError('Soundscape requires its owned audio context, master and deterministic noise source');
  this.ctx=ctx;this.disposed=false;this.key=null;this.lastTime=null;this.nextBird=null;this.profile=null;this.quiet=true;
  this.bus=ctx.createGain();this.bus.gain.value=0;this.bus.connect(master);
  this.noiseGain=ctx.createGain();this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=450;this.filter.Q.value=.4;
  const length=Math.ceil(ctx.sampleRate*3),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(rng()-.5)*.24;
  this.noise=ctx.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;this.noise.connect(this.filter).connect(this.noiseGain).connect(this.bus);this.noise.start();
  this.voices=[1,196/130.81,2].map(ratio=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.value=130.81*ratio;gain.gain.value=.013;oscillator.connect(gain).connect(this.bus);oscillator.start();return{oscillator,gain,ratio};});
 }
 update(input={},time=0){
  if(this.disposed)return{disposed:true,bird:false};
  const state=project(input),now=this.ctx.currentTime,t=Number.isFinite(time)?time:0,changed=state.key!==this.key;
  // Changes ramp only the owned ambient nodes. Personal score/gathering notes
  // remain under their existing master and interruption owners.
  if(changed){
   this.filter.frequency.setTargetAtTime(state.profile.filter,now,.35);
   this.noiseGain.gain.setTargetAtTime(state.profile.noise,now,.35);
   this.bus.gain.setTargetAtTime(state.quiet?0:state.profile.level,now,state.quiet?.06:.35);
   for(const v of this.voices){v.oscillator.frequency.setTargetAtTime(state.profile.frequency*v.ratio,now,.35);v.gain.gain.setTargetAtTime(state.profile.tone,now,.35);}
   this.key=state.key;this.profile=state.profile.id;this.quiet=state.quiet;this.nextBird=t+8;
  }
  if(this.lastTime!==null&&(t<this.lastTime||t-this.lastTime>.75))this.nextBird=t+8;
  this.lastTime=t;
  const bird=state.birds&&this.nextBird!==null&&t>=this.nextBird;
  if(bird)this.nextBird=t+8;
  return{profile:this.profile,quiet:this.quiet,bird,changed,disposed:false};
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;
  for(const node of [this.noise,...this.voices.map(v=>v.oscillator)]){try{node.stop();}catch(_){}node.disconnect();}
  for(const node of [this.filter,this.noiseGain,...this.voices.map(v=>v.gain),this.bus])node.disconnect();
  this.key=null;this.nextBird=null;
 }
 snapshot(){return{profile:this.profile,quiet:this.quiet,disposed:this.disposed,loopSources:this.disposed?0:4};}
}
const api={PROFILES,project,Soundscape};G.RealmSoundscape=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
