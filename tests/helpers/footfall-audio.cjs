'use strict';
// CPU-only Web Audio, RealmAudio stub and DOM hosts. These prove wiring and lifecycle, not native unlock or audible feel.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'../..'));
const C=require(path.join(ROOT,'src/core.js')),S=require(path.join(ROOT,'src/soundscape.js'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function candidate(){return require(process.env.FIRSTLIGHT_FOOTFALL_SOURCE||path.join(ROOT,'src/grounded-footfalls.js'));}
function audioHost(rate=48000){
 const nodes=[],param=()=>({value:1,calls:[],setTargetAtTime(...a){this.calls.push(a);},setValueAtTime(...a){this.calls.push(a);},linearRampToValueAtTime(...a){this.calls.push(a);},exponentialRampToValueAtTime(...a){this.calls.push(a);},cancelScheduledValues(){}});
 const node=kind=>{const n={kind,gain:param(),frequency:param(),Q:param(),playbackRate:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),pan:param(),
  connections:[],stopped:false,connected:true,connect(q){this.connections.push(q);return q;},disconnect(){this.connected=false;this.connections=[];},
  start(t){this.started=t;},stop(t){this.stopAt=t;this.stopped=true;},finish(){this.onended?.();}};nodes.push(n);return n;};
 const ctx={state:'running',currentTime:1,sampleRate:rate,resumes:0,destination:node('destination'),
  resume(){this.resumes++;return Promise.resolve();},createGain:()=>node('gain'),createBufferSource:()=>node('source'),createBiquadFilter:()=>node('filter'),
  createOscillator:()=>node('oscillator'),createDynamicsCompressor:()=>node('compressor'),createStereoPanner:()=>node('panner'),
  createBuffer(channels,length,sampleRate){const data=new Float32Array(length);return{channels,length,sampleRate,duration:length/sampleRate,getChannelData(){return data;}};},
  decodeAudioData(data,ok){const b={duration:1,length:rate,sampleRate:rate,numberOfChannels:1};ok(b);return Promise.resolve(b);}};
 const master=node('master');
 return{ctx,master,nodes,advance(dt){ctx.currentTime+=dt;for(const n of nodes)if(n.stopAt<=ctx.currentTime&&n.onended)n.finish();}};
}
// a RealmAudio stand-in for the footfall and App tests: it records each cue and hands back a voice that can stop.
function stubAudio(h){
 const api={cues:[],voices:[],calls:[],enabled:true,buses:{music:h.ctx.createGain(),effects:h.ctx.createGain(),ambience:h.ctx.createGain(),ui:h.ctx.createGain()},
  open(){return true;},
  enable(){api.enabled=true;api.calls.push('enable');return true;},
  disable(){api.enabled=false;api.calls.push('disable');},
  context(){return h.ctx;},
  bus(name){return api.buses[name]||null;},
  cue(name,o={}){if(!api.enabled)return null;const v={name,opts:o,end:h.ctx.currentTime+.3,stopped:false,stop(){this.stopped=true;}};api.cues.push(v);api.voices.push(v);return v;},
  event(){return null;},listen(){},scene(){},ambience(){return false;},
  snapshot(){return{enabled:api.enabled,cues:api.cues.length};}};
 return api;
}
function installAudio(h){const a=stubAudio(h);globalThis.RealmAudio=a;return a;}
function actualSim(room='world-earthlands',x=-5,z=-48){const sim=new C.Simulation(C.fresh());sim.returnPos={...sim.state.player};sim.room=room;sim.state.player={x,z,yaw:0};sim.tick(0);return sim;}
function input(sim,extra={}){return{sim,enabled:true,hidden:false,blocked:false,active:null,revision:0,...extra};}
function snapshot(v,seen=new Map()){
 if(!v||typeof v!=='object')return v;if(seen.has(v))return seen.get(v);
 const copy=v instanceof Map?new Map():v instanceof Set?new Set():Array.isArray(v)?[]:Object.create(Object.getPrototypeOf(v));seen.set(v,copy);
 if(v instanceof Map)for(const [k,q]of v)copy.set(snapshot(k,seen),snapshot(q,seen));
 if(v instanceof Set)for(const q of v)copy.add(snapshot(q,seen));
 for(const k of Reflect.ownKeys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(Object.hasOwn(d,'value'))d.value=snapshot(d.value,seen);Object.defineProperty(copy,k,d);}return copy;
}
function walk(sim,f,h,dx=1,dz=0,frames=12,extra={}){const out=[];for(let i=0;i<frames;i++){sim.manual(dx,dz,.05);sim.tick(.05);h.advance(.05);const before=JSON.stringify(sim),graph=snapshot(sim);out.push(f.update(input(sim,extra),sim.elapsed));assert.equal(JSON.stringify(sim),before);assert.deepEqual(sim,graph,'Complete own Simulation graph, including Map/Set/runtime contents');}return out;}
function appText(){let text=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8');if(process.env.FIRSTLIGHT_FOOTFALL_RECIPE){const recipe=JSON.parse(fs.readFileSync(process.env.FIRSTLIGHT_FOOTFALL_RECIPE,'utf8')),item=recipe.files.find(x=>x.path==='src/app.js');
  // Optional stage-only Git readback. The default installed test reads its
  // actual App. Parent integration can change ROOT after an old-basis seal.
  const head=process.env.FIRSTLIGHT_FOOTFALL_BASELINE_HEAD;if(head){assert.match(head,/^[0-9a-f]{40}$/);assert.equal(head,recipe.basisHead);const gitText=cp.execFileSync('git',['-C',ROOT,'show',head+':src/app.js'],{encoding:'utf8',maxBuffer:200000});text=[gitText,gitText.replace(/\r?\n/g,'\r\n')].find(t=>sha(Buffer.from(t))===item.inputSHA256);assert.equal(typeof text,'string','Exact original raw byte hash from attributed Git readback');}
  assert.equal(sha(Buffer.from(text)),item.inputSHA256);for(const edit of item.edits){assert.equal(text.split(edit.before).length,2);text=text.replace(edit.before,edit.after);}assert.equal(sha(Buffer.from(text)),item.outputSHA256);}return text;}
// compiles the actual App audio block against a stub RealmAudio; opts.toast captures player-facing messages.
function appAudio(sim,opts={}){
 const F=candidate(),h=audioHost(),RA=opts.audio||installAudio(h),listeners={},buttons={},toasts=[],document={hidden:false,modal:false,querySelector(s){assert.equal(s,'dialog[open]');return this.modal?{}:null;},addEventListener(k,fn){listeners[k]=fn;}};
 const $=s=>buttons[s]||(buttons[s]={setAttribute(){},textContent:''}),source=appText(),begin=source.indexOf('const audio={ctx:null'),end=source.indexOf('experience=new RealmExperience.Experience',begin);
 assert.ok(begin>=0&&end>begin,'Actual App audio and lifecycle block');const block=source.slice(begin,end);
 const win={addEventListener(k,fn){listeners[k]=fn;}};
 const app=vm.compileFunction(block+';return {audio,setElapsed(t){elapsed=t},setSim(s){sim=s},setPanel(p){panel=p}};',['RealmAudio','RealmSoundscape','RealmGroundedFootfalls','C','document','$','toast','rpg','experience','sim','elapsed','panel','characterStore','RealmCombat','RealmStoryAudio','window'])
 (RA,S,F,C,document,$,opts.toast||(s=>toasts.push(s)),null,null,sim,sim.elapsed,null,{active:null,revision:0},{selected:()=>null},{tick(){}},win);
 return{...h,...app,RA,document,listeners,toasts,source,step(frames=12){for(let i=0;i<frames;i++){sim.manual(1,0,.05);sim.tick(.05);h.advance(.05);app.setElapsed(sim.elapsed);app.audio.tick(sim.elapsed);}}};
}
module.exports={ROOT,C,S,candidate,audioHost,stubAudio,installAudio,actualSim,input,walk,appAudio,appText,sha,snapshot};
