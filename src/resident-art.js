/* The three existing village residents. Presentation only; Core owns identity,
 * routes, facing, schedules and projects. Props attach to solved hand anchors. */
(function(G){'use strict';
const appearances=Object.freeze({
 ilan:Object.freeze({color:0xb67256,hair:0x6c5241,scale:[.89,.92,.92]}),
 mara:Object.freeze({color:0x609fa1,hair:0xc9c5ad,scale:[.94,.92,.94]}),
 oren:Object.freeze({color:0xb89b65,hair:0x55493c,scale:[1.06,.92,1]})
});
const plus=(a,b)=>a.map((v,i)=>v+b[i]);
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function pose(id,motion={}){
 if(!appearances[id])return null;
 const walk=Math.max(0,Math.min(1,motion.blend||0));
 const carry=id==='ilan'?{left:[-.29,1.17,.27],right:[.10,1.02,.34]}:
  id==='mara'?{left:[-.19,1.20-.20*walk,.31-.06*walk],right:[.19,1.20-.20*walk,.31-.06*walk]}:
  {left:[-.26,1.02,.21]};
 return G.RealmTravelerArt.pose({phase:motion.phase,blend:walk,time:motion.time,reducedMotion:motion.reducedMotion,carry});
}
function draw(out,input,posed=pose(input.id)){
 const appearance=appearances[input.id];if(!appearance||!posed)return null;
 const {M,hex}=G.RealmEngine,[sx,sy,sz]=appearance.scale;
 // The shared sole rests 4 mm below local zero. Keep the supplied ground plane.
 const root=M.compose(input.x,input.base+.004*sy,input.z,sx,sy,sz,0,input.yaw,0);
 const local={box:[],round:[],octa:[],disc:[]};
 const frame=G.RealmTravelerArt.draw(local,{color:appearance.color},posed),j=frame.joints;
 const skin=hex(0xc4a58d),hair=hex(appearance.hair);
 for(const [kind,parts]of Object.entries(local))for(const part of parts){
  const name=part.travelerPart;
  if(name.startsWith('cloak-')||name==='ground-marker')continue;
  if(/^(head|neck|nose|left-ear|right-ear|left-hand|right-hand)$/.test(name))part.c=skin;
  if(name.startsWith('hair-')||name.endsWith('-brow'))part.c=hair;
  if(input.id==='mara'&&name.endsWith('-hem')){
   const side=name.includes('left')?-1:1;
   part.p=[side*.098,.815+posed.bob,.008];part.s=[.185,.34,.25];
   part.m=M.compose(...part.p,...part.s,0,0,side*.045);
  }
  const {travelerPart,travelerJoints,...rest}=part;
  (out[kind]||=[]).push({...rest,p:M.transform(root,part.p),m:M.mul(root,part.m),residentId:input.id,residentPart:name,
   ...(travelerJoints?{residentJoints:travelerJoints.map(v=>M.transform(root,v))}:{})});
 }
 const add=(kind,name,p,s,c,rotation=[0,0,0])=>{
  (out[kind]||=[]).push({p:M.transform(root,p),s:s.slice(),m:M.mul(root,M.compose(...p,...s,...rotation)),c:hex(c),
   rough:.86,cameraSolid:false,cutaway:false,residentId:input.id,residentPart:name});
 };
 const beam=(name,a,b,width,depth,c)=>{
  const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),up=d.map(v=>v/length),across=[up[1],-up[0],0];
  const n=Math.hypot(...across);for(let i=0;i<3;i++)across[i]/=n;
  const forward=[across[1]*up[2],-across[0]*up[2],across[0]*up[1]-across[1]*up[0]];
  const p=mix(a,b,.5),m=new Float32Array([...across.map(v=>v*width),0,...up.map(v=>v*length),0,...forward.map(v=>v*depth),0,...p,1]);
  (out.box||=[]).push({p:M.transform(root,p),s:[width,length,depth],m:M.mul(root,m),c:hex(c),rough:.8,cameraSolid:false,cutaway:false,
   residentId:input.id,residentPart:name,segment:[M.transform(root,a),M.transform(root,b)]});
 };
 if(input.id==='ilan'){
  // The right palm rests on the front of the body; the left supports its neck.
  const body=plus(j.rightHand,[0,-.045,-.06]),neckStart=plus(body,[-.075,.11,0]);
  const neckEnd=j.leftHand.map((v,i)=>v+(v-neckStart[i])*.30);
  add('octa','instrument-body',body,[.38,.40,.12],0x9c663c);
  add('round','instrument-soundhole',plus(body,[0,.035,.063]),[.065,.065,.008],0x43382d);
  beam('instrument-neck',neckStart,neckEnd,.055,.058,0x634832);
  add('box','instrument-bridge',plus(body,[.015,-.045,.064]),[.10,.025,.015],0xd5b57c);
  beam('instrument-strings',plus(body,[.015,-.045,.074]),plus(neckEnd,[0,0,.032]),.015,.005,0xd8c9a4);
 }else if(input.id==='mara'){
  const center=mix(j.leftHand,j.rightHand,.5);
  add('box','notebook-pages',center,[.365,.255,.05],0xded5b8);
  add('box','notebook-front',plus(center,[0,0,.031]),[.40,.28,.012],0x4c696b);
  add('box','notebook-back',plus(center,[0,0,-.031]),[.40,.28,.012],0x4c696b);
  add('box','notebook-spine',plus(center,[-.191,0,0]),[.018,.28,.07],0x334e54);
  add('round','hair-gather',plus(j.head,[0,-.025,-.15]),[.16,.135,.12],appearance.hair);
 }else{
  add('traveler-cloth','work-apron',[0,.96+posed.bob,.15],[.30,.46,.026],0x75614b);
  add('box','apron-pocket',[.03,1.03+posed.bob,.169],[.14,.10,.018],0x947c59);
  add('box','folding-rule',j.leftHand,[.05,.245,.045],0xd1b77a);
  add('box','rule-hinge',plus(j.leftHand,[0,.086,.025]),[.055,.022,.008],0x71563b);
 }
 return {id:input.id,root,joints:j,anchor:[input.x,input.base,input.z],yaw:input.yaw,scale:appearance.scale.slice(),
  walkingBlend:posed.walkingBlend,reducedMotion:posed.reducedMotion};
}
const api={pose,draw};G.RealmResidentArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
