/* Story cast presentation: the regent of ash, the envoy, the false Briar, the
 * severing device and the finale chain. Each builder returns plain instances
 * ({kind,p,s,m,c,rough,em,...}) in the traveler and companion rig format. No
 * builder owns state; a frame is a pure function of its inputs and t. */
(function(G){'use strict';
const T=G.RealmTravelerArt||(typeof require==='function'?require('./traveler-art.js'):null);
const C=G.RealmCompanionArt||(typeof require==='function'?require('./companion-art.js'):null);
if(typeof module!=='undefined'&&module.exports&&!G.RealmEngine)require('./engine.js');
const TAU=Math.PI*2;
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const vsub=(a,b)=>a.map((v,i)=>v-b[i]),vmix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const vcross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const vnorm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
// Colours stay 0xRRGGBB numbers; warm and cool shifts mix in that space.
const mixHex=(a,b,t)=>{const ch=c=>[c>>16&255,c>>8&255,c&255],A=ch(a),B=ch(b);return A.reduce((o,v,i)=>(o<<8)|Math.round(v+(B[i]-v)*t),0);};
const IDENT=[[1,0,0],[0,1,0],[0,0,1]];
// Rotations about Y, and a ring lying flat (its local XY plane turned to the ground).
const axesY=a=>[[Math.cos(a),0,-Math.sin(a)],[0,1,0],[Math.sin(a),0,Math.cos(a)]];
const flat=a=>[[Math.cos(a),0,-Math.sin(a)],[Math.sin(a),0,Math.cos(a)],[0,-1,0]];
const IRON=0x4b5056,EMBER=0xff7a2e,ASH={coat:0x8f8884,coatInner:0x6e6964,skin:0x9e8b7e,hair:0xd3cec6,white:0xd9d2c4,pupil:0x4a3026,glint:0xffd9a6,seam:0xe0683a,cinder:0x5a524d,brow:0x7a6f66};
const BONE={robe:0xefe6d2,robeShade:0xd9ceb6,gold:0xd6b25e,skin:0xf3e2cc,hair:0xe9d69a,light:0xfff3cf,feather:0xfff1c4,halo:0xffd77a,glow:0xffe7a6,pupil:0x8c6a2a,glint:0xfff4d6};
// Figure space is the traveler rig's: +Z forward, feet on y=0. The root scales
// the rig to a figure's height and yaws it, the way resident art does.
const root=(x,y,z,sx,sy,sz,yaw)=>G.RealmEngine.M.compose(x,y,z,sx,sy,sz,0,yaw,0);
// axes are the local X, Y, Z directions, so a part runs along any direction
// without Euler-angle conventions.
const frameOf=(c,s,ax)=>new Float32Array([...ax[0].map(v=>v*s[0]),0,...ax[1].map(v=>v*s[1]),0,...ax[2].map(v=>v*s[2]),0,c[0],c[1],c[2],1]);
function put(list,R,kind,name,c,s,ax,color,o={}){
 const {M}=G.RealmEngine;
 list.push({kind,p:M.transform(R,c),s:s.slice(),m:M.mul(R,frameOf(c,s,ax)),c:color,rough:o.rough??.84,em:o.em??0,cameraSolid:false,cutaway:false,storyPart:name});
}
// a capsule, box or round laid from a to b, cross-section width by depth.
function beam(list,R,kind,name,a,b,width,depth,color,o){
 const d=vsub(b,a),len=Math.hypot(...d),up=d.map(v=>v/len),ref=Math.abs(up[1])<.9?[0,1,0]:[1,0,0];
 const across=vnorm(vcross(up,ref)),fwd=vcross(across,up);
 put(list,R,kind,name,vmix(a,b,.5),[width,len,depth],[across,up,fwd],color,o);
}
// a torus link: outer radius and tube radius in figure metres (the unit ring is .495 outer, .055 tube).
function ring(list,R,name,c,outer,tube,ax,color,o){put(list,R,'ring',name,c,[outer/.495,outer/.495,tube/.055],ax,color,o);}
// the traveler rig in figure space; the caller paints, trims and adds to it.
function rig(list,R,input,posed){
 const {M}=G.RealmEngine,out={box:[],round:[],octa:[],disc:[]};
 T.draw(out,input,posed);
 for(const [kind,items] of Object.entries(out))for(const it of items){
  if(it.travelerPart==='ground-marker')continue;
  list.push({kind,p:M.transform(R,it.p),s:it.s.slice(),m:M.mul(R,it.m),c:it.c,rough:it.rough??.86,em:0,cameraSolid:false,cutaway:false,storyPart:it.travelerPart});
 }
}
const paint=(list,colours)=>{for(const it of list)if(colours[it.storyPart]!==undefined)it.c=colours[it.storyPart];};
// a smile is a level centre and two corners; lift is one fraction of half-width, or [left, right].
function smile(list,R,y,z,half,lift,color){
 const [l,r]=Array.isArray(lift)?lift:[lift,lift];
 beam(list,R,'capsule','smile-centre',[-half*.12,y,z],[half*.12,y,z],.006,.008,color);
 beam(list,R,'capsule','smile-left',[-half*.1,y,z],[-half,y+half*l,z-.002],.006,.008,color);
 beam(list,R,'capsule','smile-right',[half*.1,y,z],[half,y+half*r,z-.002],.006,.008,color);
}
function regent(x,y,z,yaw,t){
 // taller and broader than the traveler: presence comes from the shoulders and the coat, not from height alone.
 const k=finite(t),R=root(finite(x),finite(y),finite(z),1.06,1.28,1.06,finite(yaw)),sway=Math.sin(k*.6)*.006,L=[];
 // his left hand rests at the lapel; breath, coat and cinders move slowly and out of step.
 rig(L,R,{armorColor:ASH.coat,color:ASH.coatInner},T.pose({time:k,phase:0,blend:0,carry:{left:[-.12,1.24+.004*Math.sin(k*.5),.15]}}));
 const parts=L.filter(it=>!/^(cloak-|hair-crown|hair-back)/.test(it.storyPart)&&it.storyPart!=='mouth');
 paint(parts,{head:ASH.skin,neck:ASH.skin,nose:ASH.skin,'left-ear':ASH.skin,'right-ear':ASH.skin,'left-hand':ASH.skin,'right-hand':ASH.skin,'hair-crown':ASH.hair,'hair-back':ASH.hair,'left-brow':ASH.brow,'right-brow':ASH.brow,'left-eye':ASH.white,'right-eye':ASH.white,'left-pupil':ASH.pupil,'right-pupil':ASH.pupil,'left-catchlight':ASH.glint,'right-catchlight':ASH.glint,'collar-left':ASH.coatInner,'collar-right':ASH.coatInner});
 for(const it of parts)if(/pupil$/.test(it.storyPart))it.em=.12;
 for(const it of parts)if(/catchlight$/.test(it.storyPart))it.em=.6;
 // a smaller swept mass over the crown, so the head reads as hair rather than a helmet.
 beam(parts,R,'capsule','hair-swept',[0,1.715,.02],[0,1.64,-.10],.22,.19,ASH.hair);
 // the baked long coat: a flared shell from the chest to below the knee, closed at the front.
 put(parts,R,'body-coat','coat',[sway*.4,0.835,0],G.RealmBodyMeshes.sizes['body-coat'],IDENT,ASH.coat,{rough:.8});
 // ember piping down the coat's front edge, lit from within; it follows the shell's front.
 for(const s of[-1,1])beam(parts,R,'box','seam-'+(s<0?'left':'right'),[s*.05,1.12,.14],[s*.055+sway*.3,.36,.25],.006,.008,ASH.seam,{em:.34+.08*Math.sin(k*.9+s),rough:.5});
 // a thin dark circlet on the brow with small glowing ember points: one side still warm, the back gone grey.
 ring(parts,R,'circlet',[0,1.68,.008],.118,.006,flat(0),0x3e4247,{rough:.4});
 for(let i=0;i<7;i++){
  const a=i/7*TAU+k*.08,heat=Math.max(0,1-i/5);
  put(parts,R,'octa','ember-'+i,[Math.cos(a)*.118,1.68+.004*Math.sin(k*1.1+i),Math.sin(a)*.118+.008],[.014,.024,.014],axesY(a),mixHex(ASH.cinder,EMBER,heat),{em:.22+.68*heat*(.7+.3*Math.sin(k*1.3+i*.9)),rough:.4});
 }
 // a warm, closed smile; the corners lift unevenly, as if the joke is one he is deciding to share.
 smile(parts,R,1.558,.124,.024,[.42,.2],0x8a5a4e);
 return parts;
}

function envoy(x,y,z,yaw,t){
 const k=finite(t),R=root(finite(x),finite(y),finite(z),1.03,1.02,1.03,finite(yaw)),L=[];
 rig(L,R,{armorColor:BONE.robe,color:BONE.robeShade},T.pose({time:k,phase:0,blend:0}));
 const parts=L.filter(it=>it.storyPart!=='mouth');
 // the legs are dressed in the robe, so the figure reads as one long garment down to the ankle.
 paint(parts,{head:BONE.skin,neck:BONE.skin,nose:BONE.skin,'left-ear':BONE.skin,'right-ear':BONE.skin,'left-hand':BONE.skin,'right-hand':BONE.skin,'hair-crown':BONE.hair,'hair-back':BONE.hair,'left-brow':BONE.hair,'right-brow':BONE.hair,belt:BONE.gold,'belt-buckle':BONE.gold,'left-pupil':BONE.pupil,'right-pupil':BONE.pupil,'left-catchlight':BONE.glint,'right-catchlight':BONE.glint,
  'left-thigh':BONE.robeShade,'right-thigh':BONE.robeShade,'left-shin':BONE.robeShade,'right-shin':BONE.robeShade,'left-knee':BONE.robeShade,'right-knee':BONE.robeShade,'left-boot-cuff':BONE.robeShade,'right-boot-cuff':BONE.robeShade,'left-boot':0x6b5a3e,'right-boot':0x6b5a3e});
 for(const it of parts)it.em=Math.max(it.em,/pupil|catchlight/.test(it.storyPart)?.2:.12);
 // the baked robe: a flared shell from the shoulders to the ankle.
 put(parts,R,'body-robe','robe',[0,0.695,0],G.RealmBodyMeshes.sizes['body-robe'],IDENT,BONE.robe,{rough:.7});
 ring(parts,R,'hem-gold',[0,.12,0],.26,.022,flat(0),BONE.gold,{em:.35,rough:.4});
 // wings of light: the baked feather planes rise from the shoulder blades, breathing with the body; a soft glow sits behind each.
 const breath=Math.sin(k*.8)*.03;
 for(const s of[-1,1]){
  const side=s<0?'left':'right',dims=G.RealmBodyMeshes.sizes['body-wing-'+side],c=[s*.255,1.51+breath*.5,-.26];
  put(parts,R,'body-wing-'+side,'wing-'+side,c,dims,IDENT,BONE.feather,{em:.8,rough:.4});
  put(parts,R,'body-wing-'+side,'wing-'+side+'-glow',c,dims.map(v=>v*1.06),IDENT,BONE.glow,{em:.45,rough:.6});
 }
 // a halo above the head, a soft glow on the ground, and motes turning around her.
 ring(parts,R,'halo',[0,2.00+.01*Math.sin(k*.9),0],.22,.02,flat(0),BONE.halo,{em:.9,rough:.4});
 ring(parts,R,'glow-ground',[0,.012,0],.6,.016,flat(0),0xf1cf7a,{em:.45,rough:.6});
 for(let i=0;i<6;i++){
  const a=i/6*TAU+k*.3;
  put(parts,R,'round','mote-'+i,[Math.cos(a)*.75,1.05+.35*Math.sin(k*.6+i*1.1),Math.sin(a)*.75],[.045,.045,.045],axesY(a),BONE.light,{em:.95,rough:.3});
 }
 smile(parts,R,1.565,.122,.026,.30,0x9b5f52);
 return parts;
}

// the Briar fox from the real companion rig, with a cooler, cleaner coat and a faint glow.
function briarFalse(x,y,z,yaw,t){
 const k=finite(t),placement={x:finite(x),z:finite(z),base:finite(y),yaw:finite(yaw),bonded:true};
 const real=C.parts(placement,C.pose({bonded:true,time:k,phase:0,blend:0})),glow=.10+.05*Math.sin(k*2.1);
 const list=real.map(it=>({kind:it.kind,p:it.p.slice(),s:it.s.slice(),m:new Float32Array(it.m),
  c:/eye/.test(it.companionPart)?0xaef2ff:typeof it.c==='number'?mixHex(it.c,0xd9eef7,.16):it.c,rough:.82,
  em:/eye/.test(it.companionPart)?.55:glow,cameraSolid:false,cutaway:false,storyPart:it.companionPart}));
 put(list,root(placement.x,placement.base,placement.z,1,1,1,placement.yaw),'disc','cold-glow',[0,.01,0],[1.3,1,1.3],IDENT,0x8cc6d6,{em:.3+.08*Math.sin(k*1.7),rough:.6});
 return list;
}

// a severing device: an iron tripod, a serrated ring turning around a hot core.
function severingDevice(x,y,z,yaw,t){
 const k=finite(t),R=root(finite(x),finite(y),finite(z),1,1,1,finite(yaw)),L=[],hub=[0,.66,0],spin=k*.55,pulse=.5+.5*Math.sin(k*3.1);
 put(L,R,'box','plinth',[0,.05,0],[.92,.10,.92],IDENT,0x3a3d41,{rough:.7});
 for(let i=0;i<3;i++){const a=i/3*TAU+.4;beam(L,R,'capsule','frame-'+i,[Math.cos(a)*.34,.10,Math.sin(a)*.34],[Math.cos(a)*.11,.92,Math.sin(a)*.11],.075,.075,IRON);}
 ring(L,R,'blade-ring',hub,.47,.05,flat(spin),0x6c7177,{rough:.35});
 for(let i=0;i<6;i++){const a=spin+i/6*TAU;put(L,R,'octa','tooth-'+i,[Math.cos(a)*.44,hub[1],Math.sin(a)*.44],[.07,.12,.06],axesY(a),0x8a9097,{rough:.3,em:.1});}
 const core=.26+.03*pulse;
 put(L,R,'round','ember-core',hub,[core,core,core],IDENT,EMBER,{em:.9+.1*pulse,rough:.5});
 for(let i=0;i<4;i++){const a=i/4*TAU+k*.9;put(L,R,'octa','spark-'+i,[Math.cos(a)*.20,hub[1]+.14+.06*Math.sin(k*5+i),Math.sin(a)*.20],[.035,.05,.035],axesY(a),0xffb36b,{em:1,rough:.4});}
 return L;
}

// links hang between two points on a shallow sag; alternate links turn a quarter so they lock.
function chain(x,y,z,yaw,t,end){
 const k=finite(t),A=[finite(x),finite(y),finite(z)],yw=finite(yaw);
 const B=Array.isArray(end)&&end.length===3&&end.every(Number.isFinite)?end:[A[0]+2.4*Math.sin(yw),A[1]-.8,A[2]+2.4*Math.cos(yw)];
 const len=Math.hypot(...vsub(B,A)),n=Math.max(4,Math.min(56,Math.round(len/.15))),sag=.08*len*(1+.04*Math.sin(k*.9)),L=[];
 const at=u=>{const q=vmix(A,B,u);return[q[0],q[1]-4*sag*u*(1-u),q[2]+.01*Math.sin(k*1.3+u*6)];};
 const world=root(0,0,0,1,1,1,0);
 for(let i=0;i<=n;i++){
  const u=i/n,d=vsub(B,A),tan=vnorm([d[0],d[1]-4*sag*(1-2*u),d[2]]),across=vcross(tan,[0,1,0]);
  // a chain straight down has no side to turn toward; fall back to +X.
  const P=Math.hypot(...across)>1e-6?vnorm(across):[1,0,0];
  const ax=i%2?vcross(tan,P):P,az=vcross(ax,tan),anchor=i===0||i===n;
  put(L,world,'ring','link-'+i,at(u),[.142,.222,.364],[ax,tan,az],anchor?mixHex(IRON,EMBER,.5):IRON,{rough:.5,em:anchor?.35:0});
 }
 return L;
}

// the list-of-instances form the world and the tests read: kind-keyed arrays.
function draw(out,parts){for(const {kind,...item} of parts)(out[kind]||=[]).push(item);return parts.length;}

const api={regent,envoy,briarFalse,severingDevice,chain,draw};
G.RealmStoryArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
