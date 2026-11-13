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
const IRON=0x4b5056,EMBER=0xff7a2e,ASH={coat:0x6e6966,coatInner:0x59544f,skin:0xa39a92,hair:0xcac5bd,lid:0x857c74,seam:0xff8a3d,cinder:0x3a302c,pupil:0x3c1e16};
const BONE={robe:0xefe6d2,robeShade:0xd9ceb6,gold:0xd6b25e,skin:0xf3e2cc,hair:0xe9d69a,light:0xfff3cf,feather:0xfff1c4,halo:0xffd77a,glow:0xffe7a6,pupil:0x8c6a2a};
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
// a smile is a level centre and two corners lifted by lift (a fraction of half-width).
function smile(list,R,y,z,half,lift,color){
 beam(list,R,'capsule','smile-centre',[-half*.4,y,z],[half*.4,y,z],.011,.014,color);
 for(const s of[-1,1])beam(list,R,'capsule','smile-'+(s<0?'left':'right'),[s*half*.4,y,z],[s*half,y+half*lift,z-.002],.011,.014,color);
}
const regentPose=k=>T.pose({time:k,phase:0,blend:0});

function regent(x,y,z,yaw,t){
 const k=finite(t),R=root(finite(x),finite(y),finite(z),.98,1.28,.98,finite(yaw)),sway=Math.sin(k*.7)*.012,L=[];
 rig(L,R,{armorColor:ASH.coat,color:ASH.coatInner},regentPose(k));
 // the rig's cloak and mouth give way to the long coat and the smile.
 const parts=L.filter(it=>!/^cloak-/.test(it.storyPart)&&it.storyPart!=='mouth');
 paint(parts,{head:ASH.skin,neck:ASH.skin,nose:ASH.skin,'left-ear':ASH.skin,'right-ear':ASH.skin,'left-hand':ASH.skin,'right-hand':ASH.skin,'hair-crown':ASH.hair,'hair-back':ASH.hair,'left-brow':ASH.hair,'right-brow':ASH.hair});
 for(const it of parts)if(/-pupil$/.test(it.storyPart))it.em=.3;
 for(const it of parts)if(/-pupil$/.test(it.storyPart)||it.storyPart==='left-eye'||it.storyPart==='right-eye')it.c=it.storyPart.endsWith('pupil')?ASH.pupil:0xd8d2c6;
 // long coat: a back panel and two front panels flaring to the ankle; the hem sways.
 beam(parts,R,'capsule','coat-back',[0,1.22,-.10],[sway,.16,-.16],.36,.16,ASH.coat);
 beam(parts,R,'capsule','coat-front-left',[-.12,1.20,.05],[-.22+sway,.12,.10],.22,.13,ASH.coat);
 beam(parts,R,'capsule','coat-front-right',[.12,1.20,.05],[.22+sway,.12,.10],.22,.13,ASH.coat);
 // ember-lit seams: the coat's front edges, glowing just under the cooling.
 for(const s of[-1,1])beam(parts,R,'box','seam-'+(s<0?'left':'right'),[s*.035,1.30,.135],[s*.07+sway*.5,.16,.19],.014,.012,ASH.seam,{em:.85+.1*Math.sin(k*1.9),rough:.5});
 // a crown of cooling cinders: hot near the front, dark at the back, turning slowly.
 for(let i=0;i<7;i++){
  const a=i/7*TAU+k*.22,heat=1-i/6;
  put(parts,R,'octa','cinder-'+i,[Math.cos(a)*.17,1.90+.02*Math.sin(k*1.1+i*1.7),Math.sin(a)*.17],[.05,.085,.05],axesY(a),mixHex(ASH.cinder,EMBER,heat*.9),{em:.22+.22*heat+.03*Math.sin(k*1.3+i),rough:.7});
 }
 // half-lidded, calm; the smile sits low and lifts at the corners.
 for(const s of[-1,1])beam(parts,R,'capsule','lid-'+(s<0?'left':'right'),[s*.024,1.643,.124],[s*.080,1.643,.124],.012,.024,ASH.lid,{rough:.8});
 smile(parts,R,1.565,.122,.030,.55,0x7b4a42);
 return parts;
}

function envoy(x,y,z,yaw,t){
 const k=finite(t),R=root(finite(x),finite(y),finite(z),1.03,1.02,1.03,finite(yaw)),L=[];
 rig(L,R,{armorColor:BONE.robe,color:BONE.robeShade},T.pose({time:k,phase:0,blend:0}));
 const parts=L.filter(it=>it.storyPart!=='mouth');
 paint(parts,{head:BONE.skin,neck:BONE.skin,nose:BONE.skin,'left-ear':BONE.skin,'right-ear':BONE.skin,'left-hand':BONE.skin,'right-hand':BONE.skin,'hair-crown':BONE.hair,'hair-back':BONE.hair,'left-brow':BONE.hair,'right-brow':BONE.hair,belt:BONE.gold,'belt-buckle':BONE.gold,'left-pupil':BONE.pupil,'right-pupil':BONE.pupil});
 for(const it of parts)it.em=Math.max(it.em,/pupil|catchlight/.test(it.storyPart)?.2:.12);
 // robe to the ankle, a gold hem, the legs hidden in bone.
 beam(parts,R,'capsule','robe-front',[0,1.02,.04],[0,.14,.07],.30,.20,BONE.robe);
 beam(parts,R,'capsule','robe-back',[0,1.02,-.07],[0,.12,-.10],.34,.18,BONE.robeShade);
 ring(parts,R,'hem-gold',[0,.13,0],.24,.022,flat(0),BONE.gold,{em:.35,rough:.4});
 // folded wings of light: six feathers a side, lying along the back, breathing outward.
 const spread=Math.sin(k*.8)*.02;
 for(const s of[-1,1])for(let i=0;i<6;i++){
  const u=i/5,base=[s*.045,1.40-.07*i,-.18],tip=[s*(.22-.02*i+spread),1.06-.13*i,-.36-.01*i];
  beam(parts,R,'capsule','wing-'+(s<0?'left':'right')+'-'+i,base,tip,.07-.035*u,.024,BONE.feather,{em:.8,rough:.4});
 }
 // a halo above the head, a glow on the ground, and motes turning around her.
 ring(parts,R,'halo',[0,2.00+.01*Math.sin(k*.9),0],.22,.02,flat(0),BONE.halo,{em:.9,rough:.4});
 ring(parts,R,'glow-ground',[0,.012,0],.55,.02,flat(0),BONE.glow,{em:.8,rough:.6});
 for(let i=0;i<6;i++){
  const a=i/6*TAU+k*.3;
  put(parts,R,'octa','mote-'+i,[Math.cos(a)*.75,1.05+.35*Math.sin(k*.6+i*1.1),Math.sin(a)*.75],[.05,.05,.05],axesY(a),BONE.light,{em:.95,rough:.3});
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
 put(list,root(placement.x,placement.base,placement.z,1,1,1,placement.yaw),'disc','cold-glow',[0,.01,0],[1.3,1,1.3],IDENT,0x9fdcea,{em:.45+.1*Math.sin(k*1.7),rough:.6});
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
