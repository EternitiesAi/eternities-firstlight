/* One audio owner for the realm: one context made on a gesture, four buses, one-shot cues,
 * a looping score with crossfades, and the ambience hook. Samples are embedded by build.py and
 * decoded on first use. With no context every call is a silent no-op, so play never waits on sound. */
(function(G){'use strict';
const EMBEDDED=/*__AUDIO_ASSETS__*/{};
const BUSES=Object.freeze(['music','effects','ambience','ui']);
const LABELS=Object.freeze({music:'Music',effects:'Effects',ambience:'Ambience',ui:'Interface'});
// a player's volume (0..1) times this mix; the score sits under the effects.
const MIX=Object.freeze({music:.9,effects:1,ambience:.55,ui:.8});
const DEFAULT_VOLUME=.8,MASTER=.9,FADE=2.5,MAX_VOICES=24,STORE='firstlight.audio';
// every cue is real kenney cc0 audio (assets/audio/SOURCES.md) except bird, which has no sample yet.
const CUES=Object.freeze({
 hit:{files:['fx/hit-1','fx/hit-2','fx/hit-3'],gain:.9},
 guard:{files:['fx/guard-1','fx/guard-2'],gain:.8},
 dodge:{files:['fx/dodge-1','fx/dodge-2'],gain:.7},
 dig:{files:['fx/dig-1','fx/dig-2','fx/dig-3'],gain:.8},
 heal:{files:['fx/heal-1','fx/heal-2'],gain:.8},
 rescue:{files:['fx/rescue-1'],gain:.7},
 loot:{files:['fx/loot-1','fx/loot-2'],gain:.9},
 relic:{files:['fx/relic-1'],gain:.9},
 insight:{files:['fx/insight-1'],gain:.7},
 spirit:{files:['fx/spirit-1'],gain:.7},
 'beacon-answer':{files:['fx/beacon-answer-1'],gain:.8},
 'beacon-repair':{files:['fx/beacon-repair-1'],gain:.7},
 'step-soil':{files:['fx/step-soil-1','fx/step-soil-2','fx/step-soil-3'],gain:.6,jitter:.05},
 'step-timber':{files:['fx/step-timber-1','fx/step-timber-2','fx/step-timber-3'],gain:.6,jitter:.05},
 'step-stone':{files:['fx/step-stone-1','fx/step-stone-2','fx/step-stone-3'],gain:.6,jitter:.05},
 // root is the sample's measured fundamental; pitch = root * rate tunes the court's three notes.
 bell:{files:['fx/bell-1'],gain:.8,root:379.6},
 'ui-click':{files:['fx/ui-click-1','fx/ui-click-2','fx/ui-click-3'],gain:.6,bus:'ui'},
 'ui-confirm':{files:['fx/ui-confirm-1'],gain:.7,bus:'ui'},
 'ui-open':{files:['fx/ui-open-1'],gain:.7,bus:'ui'},
 'ui-error':{files:['fx/ui-error-1'],gain:.7,bus:'ui'},
 'ui-toggle':{files:['fx/ui-toggle-1'],gain:.7,bus:'ui'},
 bird:{synth:'bird',gain:.8,bus:'ambience'}
});
const TRACKS=Object.freeze({
 valley:{file:'music/valley'},road:{file:'music/road'},battle:{file:'music/battle'},hell:{file:'music/hell'},
 heaven:{file:'music/heaven'},sea:{file:'music/sea'},cosmos:{file:'music/cosmos'},finale:{file:'music/finale'},
 credits:{file:'music/credits'}
});
// game event -> cue. a type not listed here is silent on purpose.
const EVENTS=Object.freeze({'confirmed-hit':'hit',guard:'guard',dodge:'dodge',dig:'dig',heal:'heal',rescue:'rescue',
 loot:'loot',relic:'relic',insight:'insight',spirit:'spirit','beacon-answer':'beacon-answer','beacon-repair':'beacon-repair',
 observe:'bell',bell:'bell',bird:'bird','ui-click':'ui-click','ui-confirm':'ui-confirm','ui-open':'ui-open',
 'ui-error':'ui-error','ui-toggle':'ui-toggle'});
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const buses={},volume={},decoded=new Map(),pending=new Map(),voices=new Set();
let context=null,master=null,assets=EMBEDDED,random=Math.random,listener=null,enabled=false,ambient=null,track=null,want=null,clicks=false;
for(const name of BUSES)volume[name]=DEFAULT_VOLUME;
const live=()=>enabled&&!!context&&context.state!=='closed';

function load(){try{const raw=G.localStorage&&G.localStorage.getItem(STORE);const saved=raw?JSON.parse(raw):{};for(const name of BUSES)if(Number.isFinite(saved[name]))volume[name]=clamp(saved[name],0,1);}catch(_){}}
function save(){try{G.localStorage&&G.localStorage.setItem(STORE,JSON.stringify(volume));}catch(_){}}
function bindClicks(){
 if(clicks||typeof document==='undefined'||!document.addEventListener)return;
 clicks=true;
 document.addEventListener('click',e=>{const t=e.target;if(t&&t.closest&&t.closest('button,[role="button"]'))event('ui-click');},true);
}

function open(options={}){
 if(context)return true;
 if(options.assets)assets=options.assets;
 if(options.random)random=options.random;
 let c=null;
 try{c=options.makeContext?options.makeContext():(G.AudioContext||G.webkitAudioContext?new (G.AudioContext||G.webkitAudioContext)():null);}catch(_){c=null;}
 if(!c)return false;
 load();
 try{
  // the limiter keeps overlapping cues from reaching the destination above 0 dbfs; it is idle at normal levels.
  const limiter=c.createDynamicsCompressor();
  limiter.threshold.value=-6;limiter.knee.value=6;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.25;
  limiter.connect(c.destination);
  master=c.createGain();master.gain.value=0;master.connect(limiter);
  for(const name of BUSES){const g=c.createGain();g.gain.value=volume[name]*MIX[name];g.connect(master);buses[name]=g;}
 }catch(_){try{c.close&&c.close();}catch(__){}return false;}
 context=c;
 bindClicks();
 return true;
}

function base64(text){const bin=atob(text),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return bytes;}
// decode once, lazily; a failed decode is remembered so a broken file never retries every frame.
function request(key){
 if(decoded.has(key))return decoded.get(key);
 if(!pending.has(key)&&assets[key]&&context)pending.set(key,decode(key));
 return null;
}
function decode(key){
 const ctx=context;
 return new Promise((resolve,reject)=>{
  const r=ctx.decodeAudioData(base64(assets[key]).buffer,resolve,reject);
  if(r&&typeof r.then==='function')r.then(resolve,reject);
 }).then(buffer=>{decoded.set(key,buffer);pending.delete(key);return buffer;},()=>{decoded.set(key,null);pending.delete(key);return null;});
}

function enable(){
 if(!open())return false;
 const now=context.currentTime;
 try{const p=context.state!=='running'&&context.resume?context.resume():null;if(p&&p.catch)p.catch(()=>{});}catch(_){}
 master.gain.cancelScheduledValues(now);master.gain.setTargetAtTime(MASTER,now,.2);
 enabled=true;
 for(const def of Object.values(CUES))for(const key of def.files||[])request(key);
 if(want)music(want);
 return true;
}
function disable(){
 if(!context)return;
 enabled=false;
 master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(0,context.currentTime,.1);
}

function setVolume(name,value){
 if(!BUSES.includes(name))return null;
 volume[name]=clamp(Number.isFinite(value)?value:DEFAULT_VOLUME,0,1);
 if(context&&buses[name])buses[name].gain.setTargetAtTime(volume[name]*MIX[name],context.currentTime,.05);
 save();
 return volume[name];
}
const getVolume=name=>BUSES.includes(name)?volume[name]:null;

function play(buffer,def,o){
 const ctx=context,now=ctx.currentTime,src=ctx.createBufferSource(),gain=ctx.createGain(),out=o.out||buses[def.bus||'effects'];
 const pitched=Number.isFinite(o.pitch)&&o.pitch>0&&def.root>0;
 const rate=(pitched?o.pitch/def.root:(Number.isFinite(o.rate)&&o.rate>0?o.rate:1))*(1+(random()*2-1)*(def.jitter??.03));
 src.buffer=buffer;src.playbackRate.value=rate;
 gain.gain.value=(def.gain??1)*(o.gain??1)*(1+(random()*2-1)*.12);
 const nodes=[src,gain];
 src.connect(gain);
 let last=gain;
 if(Number.isFinite(o.x)&&Number.isFinite(o.z)&&listener&&ctx.createStereoPanner){
  const dx=o.x-listener.x,dz=o.z-listener.z;
  gain.gain.value*=clamp(1-Math.hypot(dx,dz)/40,.25,1);
  const pan=ctx.createStereoPanner();pan.pan.value=clamp(dx/14,-.85,.85);
  gain.connect(pan);nodes.push(pan);last=pan;
 }
 last.connect(out);
 if(voices.size>=MAX_VOICES)[...voices][0].stop();
 const voice={end:now+buffer.duration/rate,stop(){if(!voices.delete(voice))return;src.onended=null;try{src.stop();}catch(_){}for(const n of nodes){try{n.disconnect();}catch(_){}}}};
 src.onended=()=>voice.stop();
 voices.add(voice);
 src.start(now);
 return voice;
}
// no real bird sample ships yet: this code-made chirp is the stand-in, kept to the two partials it always had.
function synth(def,o){
 const ctx=context,now=ctx.currentTime,out=o.out||buses[def.bus||'effects'],level=(def.gain??1)*(o.gain??1),nodes=[];
 for(const [freq,start,len,amp] of [[1700+(random()*2-1)*200,0,.12,.012],[2200,.17,.18,.011]]){
  const osc=ctx.createOscillator(),g=ctx.createGain();
  osc.type='sine';osc.frequency.value=freq;
  g.gain.setValueAtTime(0,now+start);g.gain.linearRampToValueAtTime(amp*level,now+start+.025);g.gain.exponentialRampToValueAtTime(.0001,now+start+len);
  osc.connect(g);g.connect(out);osc.start(now+start);osc.stop(now+start+len+.05);
  nodes.push(osc,g);
 }
 const voice={end:now+.4,stop(){if(!voices.delete(voice))return;for(const n of nodes){try{n.disconnect();}catch(_){}}}};
 voices.add(voice);
 return voice;
}
function cue(name,o={}){
 const def=CUES[name];
 if(!def||!live())return null;
 if(def.synth)return synth(def,o);
 const key=def.files[Math.floor(random()*def.files.length)],buffer=request(key);
 return buffer?play(buffer,def,o):null;
}
function event(type,o){const name=EVENTS[type];return name?cue(name,o):null;}

function fadeOut(t){
 try{
  const now=context.currentTime,g=t.gain.gain;
  g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+FADE);
  t.src.onended=()=>{for(const n of [t.src,t.gain]){try{n.disconnect();}catch(_){}}};
  t.src.stop(now+FADE+.05);
 }catch(_){}
}
// the score loops from its own buffer; the tail was already folded into the head by master_music.py.
function music(id){
 want=id||null;
 if(!live())return false;
 if(track&&track.id===want)return true;
 if(track){fadeOut(track);track=null;}
 if(!want)return true;
 const def=TRACKS[want];
 if(!def)return false;
 const buffer=request(def.file);
 if(!buffer){const target=want,p=pending.get(def.file);if(p)p.then(()=>{if(want===target)music(target);});return false;}
 const ctx=context,now=ctx.currentTime,src=ctx.createBufferSource(),gain=ctx.createGain();
 src.buffer=buffer;src.loop=true;src.loopStart=0;src.loopEnd=buffer.duration;
 gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+FADE);
 src.connect(gain);gain.connect(buses.music);src.start(now);
 track={id:want,src,gain};
 return true;
}
// the realm's place decides the score; a battle overrides it while an enemy is engaged.
function scene(input={}){
 const room=input.room||'';
 const id=input.battle?'battle':room==='world-hell'?'hell':room==='world-heaven'?'heaven':room==='world-atlantis'?'sea':room==='cosmos-near-expanse'?'cosmos':room==='road'?'road':'valley';
 return music(id);
}
// real ambience loops would play here; none ship yet, so the code-made bed in soundscape.js covers every area.
function ambience(area){ambient=area||null;return false;}
function listen(p){listener=p&&Number.isFinite(p.x)&&Number.isFinite(p.z)?{x:p.x,z:p.z}:null;}

function stopAll(){
 for(const v of [...voices])v.stop();
 if(track){const t=track;track=null;try{t.src.stop();}catch(_){}}
 want=null;
}
function close(){
 stopAll();
 try{context&&context.close&&context.close();}catch(_){}
 context=null;master=null;enabled=false;listener=null;ambient=null;
 for(const name of BUSES)delete buses[name];
 decoded.clear();pending.clear();voices.clear();
}
function snapshot(){
 return{open:!!context,enabled,state:context?context.state:'none',voices:voices.size,music:track?track.id:null,ambience:ambient,
  decoded:[...decoded.values()].filter(Boolean).length,
  loaded:Object.fromEntries([...decoded].filter(([,b])=>b).map(([k,b])=>[k,Math.round(b.duration*1000)/1000])),volume:{...volume}};
}

// the public face never throws: a failing audio path reads as silence and game code keeps running.
const quiet=fn=>(...args)=>{try{return fn(...args);}catch(_){return null;}};
const api={BUSES,LABELS,CUES,TRACKS,EVENTS,open:quiet(open),enable:quiet(enable),disable:quiet(disable),setVolume:quiet(setVolume),
 getVolume:quiet(getVolume),cue:quiet(cue),event:quiet(event),music:quiet(music),scene:quiet(scene),ambience:quiet(ambience),
 listen:quiet(listen),stopAll:quiet(stopAll),close:quiet(close),snapshot:quiet(snapshot),context:()=>context,output:()=>master,
 bus:name=>buses[name]||null,get enabled(){return enabled;},set random(fn){random=fn;},set assets(map){assets=map;}};
G.RealmAudio=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
