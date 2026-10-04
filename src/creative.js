/* Realm 03 creative domain. Original synthesis and MIDI/WAV writers.
 * The score and home are real editable local artifacts. No model calls. */
(function(G){'use strict';
const clone=o=>JSON.parse(JSON.stringify(o)), finite=Number.isFinite;
const NOTES=[74,72,69,67,65,62,60,57];
const LABELS=['D5','C5','A4','G4','F4','D4','C4','A3'];
const VOICES=['felt','glass','plucked'];
const SKINS=['#d2ac8e','#ad805f','#765441','#edd1b4','#483933'];
const CLOAKS=['#6c9790','#955e73','#c0a775','#657fa2','#c5c9b2'];
const HAIR=['#5a4334','#bdab83','#333943','#9c694c','#d5d0bd'];
const WALLS={moss:0xb8c3a3,rose:0xc6a8a1,ink:0x778e9c,ivory:0xd8ceb4};
const FLOORS={oak:0xaa875f,walnut:0x715b50,stone:0x9ca89a};
const HH=G.RealmHomeHistory||(typeof require==='function'?require('./home-history.js'):null);
const FURNITURE={
 ...Object.fromEntries(HH.definitions.map(d=>[d.id,{name:d.name,w:d.w,d:d.d,solid:d.solid}])),
 shelf:{name:'Library shelf',w:1.4,d:.78,solid:true},
 sofa:{name:'Reading sofa',w:1.55,d:.82,solid:true},
 desk:{name:'Writing desk',w:1.42,d:.85,solid:true},
 piano:{name:'Small piano',w:1.45,d:.85,solid:true},
 plant:{name:'Potted tree',w:.75,d:.75,solid:true},
 lantern:{name:'Warm lantern',w:.5,d:.5,solid:true},
 easel:{name:'Painter’s easel',w:.7,d:.8,solid:true},
 cushions:{name:'Floor cushions',w:1.2,d:1,solid:true},
 rug:{name:'Woven rug',w:2.8,d:2.1,solid:false}
};
const SLOTS=[
 {id:'nw',label:'Back left',x:-3.7,z:-2.7}, {id:'n',label:'Back centre',x:0,z:-2.7}, {id:'ne',label:'Back right',x:3.7,z:-2.7},
 {id:'w',label:'Left nook',x:-3.7,z:0}, {id:'c',label:'Centre',x:0,z:0}, {id:'e',label:'Right nook',x:3.7,z:0},
 {id:'sw',label:'Front left',x:-3.7,z:2.6}, {id:'se',label:'Front right',x:3.7,z:2.6}
];
function emptyScore(){return{format:'eternities.score.v1',title:'A Window Left Open',bpm:88,voice:'felt',melody:NOTES.map(()=>Array(16).fill(0)),bass:Array(16).fill(0),drums:Array.from({length:3},()=>Array(16).fill(0))};}
function preset(name='firstlight'){
 let s=emptyScore();
 const patterns={firstlight:[5,-1,4,3,2,-1,3,-1,4,5,-1,6,7,-1,5,-1],rain:[7,-1,5,4,-1,3,5,-1,6,-1,4,3,-1,2,4,-1],lanterns:[2,3,4,-1,5,4,3,-1,2,1,2,3,4,-1,5,-1]};
 if(!patterns[name])throw Error('Unknown composition preset.');
 patterns[name].forEach((r,c)=>{if(r>=0)s.melody[r][c]=1;});
 s.title={firstlight:'A Window Left Open',rain:'Rain on the Glass',lanterns:'Lanterns on the Water'}[name];
 s.bpm={firstlight:88,rain:76,lanterns:108}[name];s.voice=name==='lanterns'?'plucked':name==='rain'?'glass':'felt';
 for(let c of[0,4,8,12])s.bass[c]=1;for(let c of[0,8])s.drums[0][c]=1;for(let c of[4,12])s.drums[1][c]=1;for(let c of[2,6,10,14])s.drums[2][c]=1;
 return s;
}
function validateScore(s){
 const bad=()=>{throw Error('Invalid score: use a title, 50–160 BPM, a supported voice, and bounded 16-step grids.');};
 if(!s||s.format!=='eternities.score.v1'||typeof s.title!=='string'||!s.title.trim()||s.title.length>64||!Number.isInteger(s.bpm)||s.bpm<50||s.bpm>160||!VOICES.includes(s.voice))bad();
 const row=a=>Array.isArray(a)&&a.length===16&&a.every(v=>v===0||v===1);
 if(!Array.isArray(s.melody)||s.melody.length!==8||!s.melody.every(row)||!row(s.bass)||!Array.isArray(s.drums)||s.drums.length!==3||!s.drums.every(row))bad();
 return{format:s.format,title:s.title.trim(),bpm:s.bpm,voice:s.voice,melody:s.melody.map(a=>a.slice()),bass:s.bass.slice(),drums:s.drums.map(a=>a.slice())};
}
function freshHome(){return{version:1,revision:0,wall:'moss',floor:'oak',items:[{slot:'nw',kind:'shelf',rotation:0},{slot:'ne',kind:'piano',rotation:0},{slot:'w',kind:'sofa',rotation:1},{slot:'e',kind:'plant',rotation:0},{slot:'c',kind:'rug',rotation:0}]};}
function validateHome(h){if(!h||h.version!==1||!Number.isSafeInteger(h.revision)||h.revision<0||h.revision>1e8||!Object.hasOwn(WALLS,h.wall)||!Object.hasOwn(FLOORS,h.floor)||!Array.isArray(h.items)||h.items.length>SLOTS.length)throw Error('Invalid retreat.');let ids=new Set();return{version:1,revision:h.revision,wall:h.wall,floor:h.floor,items:h.items.map(i=>{if(!i||!SLOTS.some(s=>s.id===i.slot)||ids.has(i.slot)||!Object.hasOwn(FURNITURE,i.kind)||!Number.isInteger(i.rotation)||i.rotation<0||i.rotation>3)throw Error('Invalid furniture slot.');ids.add(i.slot);return{slot:i.slot,kind:i.kind,rotation:i.rotation};})};}
function obstacles(home){return home.items.filter(i=>FURNITURE[i.kind].solid).map(i=>{let s=SLOTS.find(s=>s.id===i.slot),f=FURNITURE[i.kind],rot=i.rotation%2;return{x:s.x,z:s.z,w:rot?f.d:f.w,d:rot?f.w:f.d};});}
function freshVisitor(){return{name:'Visitor',skin:0,cloak:0,hair:0};}
function validateVisitor(p){if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>32||['skin','cloak','hair'].some(k=>!Number.isInteger(p[k])||p[k]<0||p[k]>4))throw Error('Invalid visitor appearance.');return{name:p.name.trim(),skin:p.skin,cloak:p.cloak,hair:p.hair};}
function events(score,loops=1){let s=validateScore(score);if(!Number.isInteger(loops)||loops<1||loops>4)throw Error('Use 1–4 loops.');let step=30/s.bpm,e=[];for(let l=0;l<loops;l++)for(let c=0;c<16;c++){let t=(l*16+c)*step;for(let r=0;r<8;r++)if(s.melody[r][c])e.push({t,len:step*.88,midi:NOTES[r],voice:s.voice,gain:.28,pan:(r/7-.5)*.55});if(s.bass[c])e.push({t,len:step*1.7,midi:[38,41,45,36][Math.floor(c/4)],voice:'bass',gain:.25,pan:0});s.drums.forEach((row,r)=>{if(row[c])e.push({t,len:r===0?.28:.16,midi:[36,38,42][r],voice:['kick','snare','shaker'][r],gain:[.5,.20,.08][r],pan:r===2?.28:0});});}return{score:s,events:e,loopSeconds:16*step,duration:16*step*loops+.8};}
function renderPCM(score,loops=1,sampleRate=22050,tail=true){if(![22050,44100,48000].includes(sampleRate))throw Error('Unsupported audio sample rate.');let plan=events(score,loops),duration=tail?plan.duration:plan.loopSeconds*loops,n=Math.ceil(duration*sampleRate),left=new Float32Array(n),right=new Float32Array(n),seed=735;
 const noise=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/2147483648-1;};
 for(let ev of plan.events){let start=Math.round(ev.t*sampleRate),release=ev.voice==='glass'?1.25:ev.voice==='felt'?.85:.35,len=Math.ceil((ev.len+release)*sampleRate),freq=440*Math.pow(2,(ev.midi-69)/12),lp=Math.sqrt((1-ev.pan)/2),rp=Math.sqrt((1+ev.pan)/2);
  for(let i=0;i<len&&start+i<n;i++){let t=i/sampleRate,v=0,en=Math.min(1,t/.006)*Math.exp(-t/(ev.voice==='glass'?.68:ev.voice==='bass'?.32:.37));if(t>ev.len)en*=Math.exp(-(t-ev.len)/.12);
   let ph=2*Math.PI*freq*t;
   if(ev.voice==='kick'){v=Math.sin(2*Math.PI*(47*t+2.1*(1-Math.exp(-t*30))))*Math.exp(-t*17);}
   else if(ev.voice==='snare'){v=(noise()*.7+Math.sin(2*Math.PI*165*t)*.3)*Math.exp(-t*28);}
   else if(ev.voice==='shaker'){v=noise()*Math.exp(-t*48);}
   else if(ev.voice==='glass'){v=(Math.sin(ph)+.24*Math.sin(ph*2.003)+.12*Math.sin(ph*4.01))*en;}
   else if(ev.voice==='plucked'){v=(Math.sin(ph)+.34*Math.sin(ph*2)+.17*Math.sin(ph*3))*en;}
   else if(ev.voice==='bass'){v=(Math.sin(ph)+.18*Math.sin(ph*2))*en;}
   else v=(Math.sin(ph)+.23*Math.sin(ph*2)*Math.exp(-t*4)+.07*Math.sin(ph*3))*en;
   left[start+i]+=v*ev.gain*lp;right[start+i]+=v*ev.gain*rp;
  }
 }
 // Small deterministic cross-channel echo, never a downloaded impulse response.
 let delay=Math.round(sampleRate*.143);for(let i=n-1;i>=delay;i--){left[i]+=right[i-delay]*.12;right[i]+=left[i-delay]*.10;}
 let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));let scale=peak>.88?.88/peak:1;for(let i=0;i<n;i++){left[i]*=scale;right[i]*=scale;let edge=Math.min(1,i/128,(n-1-i)/256);left[i]*=edge;right[i]*=edge;}
 return{left,right,sampleRate,duration:n/sampleRate,loopSeconds:plan.loopSeconds,peak:peak*scale,eventCount:plan.events.length};
}
function wav(pcm){let{left,right,sampleRate}=pcm,n=left.length;if(right.length!==n||!n)throw Error('Invalid PCM channels.');let out=new Uint8Array(44+n*4),v=new DataView(out.buffer),str=(at,s)=>{for(let i=0;i<s.length;i++)out[at+i]=s.charCodeAt(i);};str(0,'RIFF');v.setUint32(4,36+n*4,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*4,true);for(let i=0;i<n;i++)for(let c=0;c<2;c++){let f=(c?right:left)[i];if(!finite(f))throw Error('Nonfinite audio.');v.setInt16(44+i*4+c*2,Math.round(Math.max(-1,Math.min(1,f))*32767),true);}return out;}
function midi(score,loops=1){let plan=events(score,loops),s=plan.score,ev=[],ppq=480,tempo=Math.round(60000000/s.bpm),vlq=n=>{let a=[n&127];while(n>>=7)a.unshift((n&127)|128);return a;};ev.push({t:0,bytes:[255,81,3,tempo>>16&255,tempo>>8&255,tempo&255]},{t:0,bytes:[255,88,4,4,2,24,8]},{t:0,bytes:[192,s.voice==='glass'?10:s.voice==='plucked'?24:0]},{t:0,bytes:[193,32]});
 for(let e of plan.events){let drum=['kick','snare','shaker'].includes(e.voice),ch=drum?9:e.voice==='bass'?1:0,t=Math.round(e.t*s.bpm/60*ppq),end=t+Math.max(1,Math.round(e.len*s.bpm/60*ppq));ev.push({t,bytes:[144|ch,e.midi,drum?72:80]},{t:end,bytes:[128|ch,e.midi,0]});}
 const priority=e=>e.bytes[0]===255?0:(e.bytes[0]&240)===192?1:(e.bytes[0]&240)===128?2:3;ev.sort((a,b)=>a.t-b.t||priority(a)-priority(b));let track=[],last=0;for(let e of ev){track.push(...vlq(e.t-last),...e.bytes);last=e.t;}track.push(...vlq(Math.max(0,loops*3840-last)),255,47,0);let len=track.length,head=[77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,len>>>24&255,len>>>16&255,len>>>8&255,len&255];return new Uint8Array([...head,...track]);}
const api={NOTES,LABELS,VOICES,SKINS,CLOAKS,HAIR,WALLS,FLOORS,FURNITURE,SLOTS,preset,emptyScore,validateScore,freshHome,validateHome,obstacles,freshVisitor,validateVisitor,events,renderPCM,wav,midi,clone};G.RealmCreative=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
