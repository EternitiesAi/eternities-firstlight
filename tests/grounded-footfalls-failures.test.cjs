'use strict';
/* Real Core/ground/App source with explicitly synthetic AudioHost failures.
 * No native AudioContext, device, browser, save, fabricated step or Core facade. */
const {test}=require('node:test'),assert=require('node:assert/strict'),H=require('./helpers/footfall-audio.cjs');
const STILL=.2;
function setup(){const h=H.audioHost(),sim=H.actualSim(),F=H.candidate(),f=new F.Footfalls(h.ctx,h.master);f.update(H.input(sim),sim.elapsed);H.walk(sim,f,h,1,0,4);return{h,sim,f};}
function once(node,key,after=false){const prior=node[key];let fired=false;node[key]=function(...args){if(!fired){fired=true;if(after)prior.apply(this,args);throw Error('CPU fault '+key);}return prior.apply(this,args);};}
function setterOnce(node,key){let value,fired=false;Object.defineProperty(node,key,{configurable:true,get(){return value;},set(v){if(!fired){fired=true;throw Error('CPU setter '+key);}value=v;}});}
function voiceFault(h,stage){
 const makeSource=h.ctx.createBufferSource,makeGain=h.ctx.createGain;
 if(stage==='createSource'){h.ctx.createBufferSource=()=>{throw Error('CPU source allocation');};return;}
 if(stage==='createGain'){h.ctx.createGain=()=>{throw Error('CPU gain allocation');};return;}
 h.ctx.createBufferSource=()=>{const n=makeSource();if(stage==='buffer')setterOnce(n,'buffer');if(stage==='sourceConnect')once(n,'connect',true);if(stage==='onended')setterOnce(n,'onended');if(stage==='start')once(n,'start',true);if(stage==='stop')once(n,'stop',true);return n;};
 h.ctx.createGain=()=>{const n=makeGain();if(stage==='gainValue')setterOnce(n.gain,'value');if(stage==='gainConnect')once(n,'connect',true);return n;};
}
test('every owned voice allocation/assignment/connection/start/stop failure refuses and retires all partial nodes',()=>{
 for(const stage of ['createSource','createGain','buffer','gainValue','sourceConnect','gainConnect','onended','start','stop']){
  const {h,sim,f}=setup(),first=h.nodes.length,beforeBuffers=h.buffers.length;voiceFault(h,stage);
  sim.manual(1,0,.05);sim.tick(.05);h.advance(.05);const before=H.snapshot(sim);let result;
  assert.doesNotThrow(()=>{result=f.update(H.input(sim),sim.elapsed);},stage+' cannot propagate');assert.equal(result.step,false,stage);assert.deepEqual(sim,before,stage+' actual Simulation graph unchanged');
  assert.equal(f.snapshot().voices,0,stage+' zero registered voices');for(const n of h.nodes.slice(first)){assert.equal(n.connected,false,stage+' partial '+n.kind+' disconnected');assert.equal(n.connections.length,0);}
  assert.equal(h.buffers.length,beforeBuffers);assert.equal(h.master.connected,true);f.dispose();assert.equal(h.master.connected,true);
 }
});
test('setup bus and each cached-buffer failure dispose only the candidate without throwing',()=>{
 for(const stage of ['busCreate','busValue','busConnect','buffer1','buffer2','buffer3','channel','copy']){
  const h=H.audioHost(),F=H.candidate(),makeGain=h.ctx.createGain,makeBuffer=h.ctx.createBuffer,first=h.nodes.length;let count=0;
  h.ctx.createGain=()=>{if(stage==='busCreate')throw Error('CPU bus allocation');const n=makeGain();if(stage==='busValue')setterOnce(n.gain,'value');if(stage==='busConnect')once(n,'connect',true);return n;};
  h.ctx.createBuffer=(...args)=>{count++;if(stage==='buffer'+count)throw Error('CPU buffer allocation '+count);const b=makeBuffer(...args);if(stage==='channel')b.getChannelData=()=>{throw Error('CPU channel access');};if(stage==='copy')b.getChannelData=()=>({set(){throw Error('CPU sample copy');}});return b;};
  let f;assert.doesNotThrow(()=>{f=new F.Footfalls(h.ctx,h.master);},stage);assert.equal(f.snapshot().disposed,true,stage);assert.equal(f.snapshot().buffers,0);assert.equal(f.snapshot().voices,0);for(const n of h.nodes.slice(first))assert.equal(n.connected,false,stage+' partial bus retired');assert.equal(h.master.connected,true);f.dispose();
 }
});
test('actual staged App ambient update continues after optional voice host failure',()=>{
 const sim=H.actualSim(),a=H.appAudio(sim);assert.equal(a.audio.enable(),true);a.step(4);const soundscape=a.audio.soundscape,last=soundscape.lastTime;voiceFault(a,'gainConnect');
 assert.doesNotThrow(()=>a.step(1));assert.equal(a.audio.enabled,true);assert.ok(soundscape.lastTime>last);assert.equal(a.audio.footfalls.snapshot().voices,0);assert.equal(a.audio.master.connected,true);
});
test('actual staged App can retain enabled ambience when optional setup allocation fails',()=>{
 const sim=H.actualSim(),a=H.appAudio(sim);assert.equal(a.audio.enable(),true);const soundscape=a.audio.soundscape;a.audio.footfalls.dispose();a.ctx.createGain=()=>{throw Error('CPU optional bus allocation');};
 assert.equal(a.audio.enable(),true);assert.equal(a.audio.enabled,true);assert.equal(a.audio.soundscape,soundscape);assert.equal(a.audio.soundscape.disposed,false);assert.equal(a.audio.footfalls.disposed,true);assert.equal(a.audio.master.connected,true);
});
test('meaningful stationary interval resets partial cadence while one short RAF pause retains measured displacement',()=>{
 assert.equal(H.candidate().LIMITS.stillAfter,STILL);
 for(const frames of [1,5,20]){
  const {h,sim,f}=setup();for(let i=0;i<frames;i++){sim.tick(.05);h.advance(.05);f.update(H.input(sim),sim.elapsed);}
  const first=H.walk(sim,f,h,1,0,1).filter(r=>r.step).length;assert.equal(first,frames===1?1:0,'idle seconds '+frames*.05);
  if(frames>1){assert.equal(H.walk(sim,f,h,1,0,3).filter(r=>r.step).length,0);assert.equal(H.walk(sim,f,h,1,0,1).filter(r=>r.step).length,1,'Fresh restart requires measured .8m, no old .64m credit');}
 }
});
test('stationary update clock-reaps ended voices even with delayed onended',()=>{
 const {h,sim,f}=setup();H.walk(sim,f,h,1,0,1);assert.equal(f.snapshot().voices,1);const sources=h.nodes.filter(n=>n.kind==='source'),gain=h.nodes.find(n=>n.kind==='gain'&&n!==f.bus);h.ctx.currentTime+=1;
 sim.tick(.05);const before=H.snapshot(sim);assert.doesNotThrow(()=>f.update(H.input(sim),sim.elapsed));assert.deepEqual(sim,before);assert.equal(f.snapshot().voices,0);assert.ok(sources.every(n=>!n.connected));assert.equal(gain.connected,false);assert.equal(h.master.connected,true);
});
