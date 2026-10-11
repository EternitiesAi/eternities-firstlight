'use strict';
// CPU-only Web Audio and DOM hosts. These prove no native unlock or audible feel.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'../..'));
const C=require(path.join(ROOT,'src/core.js')),S=require(path.join(ROOT,'src/soundscape.js'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function candidate(){return require(process.env.FIRSTLIGHT_FOOTFALL_SOURCE||path.join(ROOT,'src/grounded-footfalls.js'));}
function audioHost(rate=48000){
 const nodes=[],buffers=[],events=[],param=()=>({value:1,calls:[],setTargetAtTime(...a){this.calls.push(a);},setValueAtTime(...a){this.calls.push(a);},linearRampToValueAtTime(...a){this.calls.push(a);}});
 const node=kind=>{const n={kind,gain:param(),frequency:param(),Q:param(),playbackRate:param(),connections:[],stopped:false,connected:true,
  connect(q){this.connections.push(q);return q;},disconnect(){this.connected=false;this.connections=[];},start(t){this.start=t;events.push(this);},stop(t){this.stop=t;this.stopped=true;},finish(){this.onended?.();}};nodes.push(n);return n;};
 const ctx={state:'running',currentTime:1,sampleRate:rate,resumes:0,destination:node('destination'),
  resume(){this.resumes++;return Promise.resolve();},createGain:()=>node('gain'),createBufferSource:()=>node('source'),createBiquadFilter:()=>node('filter'),createOscillator:()=>node('oscillator'),
  createBuffer(channels,length,sampleRate){const b={channels,length,sampleRate,data:new Float32Array(length),getChannelData(c){assert.equal(c,0);return this.data;}};buffers.push(b);return b;}};
 const master=node('master');return{ctx,master,nodes,buffers,events,advance(dt){ctx.currentTime+=dt;for(const n of nodes)if(n.stop<=ctx.currentTime&&n.onended)n.finish();}};
}
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
function appAudio(sim){
 const F=candidate(),h=audioHost(),listeners={},buttons={},document={hidden:false,modal:false,querySelector(s){assert.equal(s,'dialog[open]');return this.modal?{}:null;},addEventListener(k,fn){listeners[k]=fn;}},window={AudioContext:function(){return h.ctx;},addEventListener(k,fn){listeners[k]=fn;}};
 const $=s=>buttons[s]||(buttons[s]={setAttribute(){},textContent:''}),source=appText(),begin=source.indexOf('const audio={ctx:null'),end=source.indexOf('experience=new RealmExperience.Experience',begin);
 assert.ok(begin>=0&&end>begin,'Actual App audio and lifecycle block');const block=source.slice(begin,end);
 const app=vm.compileFunction(block+';return {audio,setElapsed(t){elapsed=t},setSim(s){sim=s},setPanel(p){panel=p}};',['window','RealmSoundscape','RealmGroundedFootfalls','C','document','$','toast','rpg','experience','sim','elapsed','panel','characterStore'])
 (window,S,F,C,document,$,()=>{},null,null,sim,sim.elapsed,null,{active:null,revision:0});
 return{...h,...app,document,listeners,source,step(frames=12){for(let i=0;i<frames;i++){sim.manual(1,0,.05);sim.tick(.05);h.advance(.05);app.setElapsed(sim.elapsed);app.audio.tick(sim.elapsed);}}};
}
module.exports={ROOT,C,S,candidate,audioHost,actualSim,input,walk,appAudio,appText,sha,snapshot};
