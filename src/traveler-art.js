/* Original instanced traveller rig. Local +Z is forward, +X right, +Y up.
 * Presentation only: callers supply movement, combat and canonical colours.
 * Sampling is pure; the parent owns one motion state per simulation identity. */
(function(G){'use strict';
const TAU=Math.PI*2,STRIDE=1.35,MAX_DT=.10,RESET_DT=.75;
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const unit=n=>clamp(finite(n),0,1);
const vec=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const scale=(a,n)=>a.map(v=>v*n);
const plus=(a,b)=>a.map((v,i)=>v+b[i]);
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const norm=a=>scale(a,1/(Math.hypot(...a)||1));
const smooth=n=>n*n*(3-2*n);

function motion(previous,input={}){
 const x=finite(input.x),z=finite(input.z),now=finite(input.time),scene=input.scene??null;
 const paused=!!input.paused,reducedMotion=!!input.reducedMotion;
 const valid=previous&&[previous.phase,previous.blend,previous.lastX,previous.lastZ,previous.lastTime,previous.time].every(Number.isFinite);
 const state={phase:valid?previous.phase:0,blend:valid?unit(previous.blend):0,lastX:x,lastZ:z,lastTime:now,scene,
  time:valid?previous.time:now,paused,reducedMotion};
 if(!valid)return state;
 const clockDelta=now-previous.lastTime,elapsed=Math.abs(clockDelta)<1e-9?0:clockDelta;
 const distance=Math.hypot(x-previous.lastX,z-previous.lastZ);
 if(paused&&scene===previous.scene)return state;
 // A changed scene, clock restart, hidden-tab gap or teleport starts a clean
 // stance. The distance gate tolerates normal frame subdivision at game speed.
 if(scene!==previous.scene||elapsed<0||elapsed>RESET_DT||distance>Math.max(.65,elapsed*8)||(!elapsed&&distance>1e-7)){
  state.phase=0;state.blend=0;state.time=paused?previous.time:now;return state;
 }
 // Consume sampling coordinates during pause without adding animation time.
 // This prevents a resumed frame from walking the distance skipped by a menu.
 if(paused||elapsed===0)return state;
 const dt=Math.min(elapsed,MAX_DT);
 state.time+=dt;
 const moved=!!input.walking&&distance>1e-7;
 if(moved)state.phase=(state.phase+distance/STRIDE*TAU)%TAU;
 // A stationary actor cannot keep shuffling because its intent says walking.
 // Phase is held while blend eases the actual last stride back into a stance.
 const target=moved?1:0;
 state.blend=target+(state.blend-target)*Math.exp(-dt*(moved?16:20));
 if(state.blend<.001)state.blend=0;
 return state;
}

// Analytic two-bone solve with a stable local bend direction. The returned end
// is the reachable hand/ankle anchor, shared by skin and equipment geometry.
function twoBone(start,target,upper,lower,hint){
 let delta=vec(target,start),distance=Math.hypot(...delta);
 const direction=distance>1e-8?scale(delta,1/distance):[0,-1,0];
 distance=clamp(distance,Math.abs(upper-lower)+.0001,upper+lower-.0001);
 const end=plus(start,scale(direction,distance));
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
 let side=vec(hint,scale(direction,dot(hint,direction)));
 if(Math.hypot(...side)<1e-6){const fallback=Math.abs(direction[0])<.9?[1,0,0]:[0,0,1];side=vec(fallback,scale(direction,dot(fallback,direction)));}
 return {middle:plus(plus(start,scale(direction,along)),scale(norm(side),bend)),end};
}

function pose(options={}){
 const phase=finite(options.phase),walkingBlend=unit(options.blend),time=finite(options.time);
 const reducedMotion=!!options.reducedMotion,combatScene=!!options.combatScene;
 const style=['blade','bow'].includes(options.style)?options.style:'none';
 const combatPhase=combatScene&&['anticipate','recover'].includes(options.combatPhase)?options.combatPhase:'idle';
 const combatProgress=combatPhase==='idle'?0:unit(options.combatProgress),guarded=combatScene&&!!options.guarded;
 const gait=walkingBlend*(reducedMotion?.55:1),stride=Math.sin(phase)*gait;
 const bob=reducedMotion?0:Math.abs(Math.sin(phase*2))*.012*walkingBlend;
 const breath=reducedMotion?0:Math.sin(time*1.35)*.003*(1-walkingBlend);
 const torsoY=bob+breath;
 const joints={hip:[0,.90+torsoY,0],pelvis:[0,.885+torsoY,0],spine:[0,1.13+torsoY,0],
  chest:[0,1.265+torsoY,0],neck:[0,1.475+torsoY,0],head:[0,1.610+torsoY,.008],back:[0,1.25+torsoY,-.17]};
 for(const [name,side]of [['left',-1],['right',1]]){
  const hip=[side*.115,.885+torsoY,0],step=side*stride;
  const lift=Math.max(0,side*Math.cos(phase))**2*gait*(reducedMotion?.055:.105);
  const leg=twoBone(hip,[side*.115,.115+lift,step*.22],.41,.41,[0,0,1]);
  joints[name+'Hip']=hip;joints[name+'Knee']=leg.middle;joints[name+'Ankle']=leg.end;
  joints[name+'Foot']=plus(leg.end,[0,-.052,.06]);
  joints[name+'Shoulder']=[side*.235,1.365+torsoY,0];
 }
 const swing=reducedMotion?0:stride*.16;
 let left=[-.265,.845+torsoY,swing],right=[.265,.845+torsoY,-swing];
 const p=smooth(combatProgress);
 if(combatScene&&style==='bow'){
  const readyLeft=[-.30,1.30+torsoY,.48],readyRight=[.16,1.26+torsoY,.32];
  left=readyLeft;right=readyRight;
  if(combatPhase==='anticipate'){
   left=mix(readyLeft,[-.34,1.37+torsoY,.49],p);
   right=mix(readyRight,[.13,1.46+torsoY,.10],p);
  }else if(combatPhase==='recover'){
   // A released string relaxes directly to ready; secondary recoil is omitted
   // in reduced motion, while the essential two-hand bow alignment remains.
   right=reducedMotion?readyRight:mix([.16,1.26+torsoY,.35],readyRight,p);
  }
  if(guarded){left=[-.30,1.28+torsoY,.40];right=[.15,1.26+torsoY,.24];}
 }else if(combatScene&&style==='blade'){
  const readyRight=[.29,.94+torsoY,.23],readyLeft=[-.27,1.02+torsoY,.13];
  right=readyRight;left=readyLeft;
  if(combatPhase==='anticipate'){
   right=mix(readyRight,[.34,1.45+torsoY,.12],p);
   left=mix(readyLeft,[-.29,1.11+torsoY,.20],p*.5);
  }else if(combatPhase==='recover'){
   right=mix([.055,1.08+torsoY,.48],readyRight,p);
  }
  if(guarded){right=[.25,1.25+torsoY,.29];left=[-.24,1.26+torsoY,.25];}
 }else if(guarded){left=[-.23,1.20+torsoY,.24];right=[.23,1.20+torsoY,.24];}
 for(const [name,side,target]of [['left',-1,left],['right',1,right]]){
  const arm=twoBone(joints[name+'Shoulder'],target,.305,.285,[side,-.3,-.25]);
  joints[name+'Elbow']=arm.middle;joints[name+'Hand']=arm.end;
 }
 return {joints,phase,walkingBlend,time,reducedMotion,style,combatScene,combatPhase,combatProgress,guarded,
  bob:torsoY,cloakSwing:reducedMotion?0:Math.sin(phase)*walkingBlend*.025};
}

function draw(out,input={},posed=pose()){
 const {M,hex,blend}=G.RealmEngine;
 const x=finite(input.x),z=finite(input.z),base=finite(input.base),yaw=finite(input.yaw);
 const root=M.compose(x,base,z,1,1,1,0,yaw,0),j=posed.joints;
 const profile=input.profile||{},pal=G.RealmCreative||{};
 const pick=(list,key,fallback)=>Array.isArray(list)&&Number.isInteger(key)&&list[key]!=null?list[key]:fallback;
 const skin=hex(pick(pal.SKINS,profile.skin,0xd2ac8e)),hair=hex(pick(pal.HAIR,profile.hair,0x5a4334));
 const cloth=hex(input.color??pick(pal.CLOAKS,profile.cloak,0x6c9790));
 const cloak=hex(pick(pal.CLOAKS,profile.cloak,input.color??0x6c9790));
 const armored=input.armorColor!=null,coat=armored?hex(input.armorColor):blend(cloth,hex(0xe2d6b7),.12);
 const darkCoat=blend(coat,hex(0x263932),.20),seam=blend(coat,hex(0xe2d6b7),.32);
 const trousers=hex(0x414b45),leather=hex(0x4f4336),sole=hex(0x302f2b),metal=hex(0xc4af7b);
 const add=(kind,name,position,size,color,rotation=[0,0,0],extra={})=>{
  const local=M.compose(...position,...size,...rotation);
  out[kind].push({p:M.transform(root,position),s:size.slice(),m:M.mul(root,local),c:color,rough:.84,
   cameraSolid:false,cutaway:false,travelerPart:name,...extra});
 };
 // Columns of this basis point along a 3D segment. Unlike the old Y/Z-only
 // rotation, it can connect a cross-body wrist to its elbow without a gap.
 const limb=(name,a,b,width,depth,color)=>{
  const length=Math.hypot(...vec(b,a)),up=norm(vec(b,a));
  const reference=Math.abs(up[2])<.9?[0,0,1]:[1,0,0];
  const across=norm([up[1]*reference[2]-up[2]*reference[1],up[2]*reference[0]-up[0]*reference[2],up[0]*reference[1]-up[1]*reference[0]]);
  const forward=[across[1]*up[2]-across[2]*up[1],across[2]*up[0]-across[0]*up[2],across[0]*up[1]-across[1]*up[0]];
  const center=mix(a,b,.5),local=new Float32Array([...scale(across,width),0,...scale(up,length),0,...scale(forward,depth),0,...center,1]);
  out.box.push({p:M.transform(root,center),s:[width,length,depth],m:M.mul(root,local),c:color,rough:.87,
   cameraSolid:false,cutaway:false,travelerPart:name,travelerJoints:[a.slice(),b.slice()]});
 };
 const y=posed.bob;
 // Narrow waist, broader shoulder line and a split hem make fitted clothing
 // with existing primitives, rather than a stack of rounded doll volumes.
 add('box','jacket-waist',[0,1.035+y,0],[.335,.27,.24],darkCoat);
 add('box','jacket-chest',[0,1.255+y,0],[.425,.245,.255],coat);
 add('octa','jacket-left-side',[-.155,1.13+y,0],[.155,.35,.245],coat);
 add('octa','jacket-right-side',[.155,1.13+y,0],[.155,.35,.245],coat);
 add('box','jacket-front-seam',[0,1.18+y,.132],[.025,.30,.022],seam);
 add('box','jacket-left-hem',[-.096,.89+y,.008],[.18,.20,.245],darkCoat,[0,0,-.045]);
 add('box','jacket-right-hem',[.096,.89+y,.008],[.18,.20,.245],darkCoat,[0,0,.045]);
 add('box','belt',[0,.985+y,.008],[.355,.063,.267],leather);
 add('box','belt-buckle',[0,.985+y,.152],[.065,.060,.028],metal);
 add('box','collar-left',[-.09,1.407+y,.042],[.09,.10,.18],seam,[0,0,-.18]);
 add('box','collar-right',[.09,1.407+y,.042],[.09,.10,.18],seam,[0,0,.18]);
 add('round','neck',j.neck,[.105,.15,.115],skin);
 add('round','head',j.head,[.245,.27,.235],skin);
 add('box','hair-crown',[0,1.721+y,-.015],[.226,.062,.207],hair);
 add('box','hair-back',[0,1.620+y,-.105],[.220,.205,.072],hair);
 for(const [name,side]of [['left',-1],['right',1]]){
  add('round',name+'-ear',[side*.122,1.610+y,.003],[.046,.071,.05],skin);
  add('box',name+'-eye',[side*.050,1.633+y,.119],[.025,.016,.012],0x303b37);
  add('box',name+'-brow',[side*.051,1.654+y,.118],[.043,.012,.013],hair);
  limb(name+'-thigh',j[name+'Hip'],j[name+'Knee'],.165,.18,trousers);
  limb(name+'-shin',j[name+'Knee'],j[name+'Ankle'],.125,.145,trousers);
  add('round',name+'-knee',j[name+'Knee'],[.151,.13,.155],trousers);
  add('box',name+'-boot',j[name+'Foot'],[.165,.126,.285],leather);
  add('box',name+'-sole',plus(j[name+'Foot'],[0,-.049,0]),[.177,.036,.299],sole);
  add('round',name+'-boot-cuff',plus(j[name+'Ankle'],[0,.045,-.007]),[.152,.15,.172],leather);
  add('box',name+'-shoulder',j[name+'Shoulder'],[.18,.15,.255],coat,[0,0,side*.10]);
  limb(name+'-upper-arm',j[name+'Shoulder'],j[name+'Elbow'],.132,.144,coat);
  add('round',name+'-elbow',j[name+'Elbow'],[.125,.125,.129],darkCoat);
  limb(name+'-forearm',j[name+'Elbow'],j[name+'Hand'],.107,.119,darkCoat);
  add('round',name+'-hand',j[name+'Hand'],[.104,.116,.102],skin);
 }
 add('octa','nose',[0,1.614+y,.137],[.052,.066,.074],skin);
 const sweep=posed.cloakSwing;
 for(const [name,side]of [['left',-1],['center',0],['right',1]]){
  add('box','cloak-'+name,[side*.133,1.10+y,-.189-Math.abs(side)*.020+sweep],[.150,.61,.045],
   side?cloak:blend(cloak,hex(0x2d4039),.12),[.105+sweep,0,-side*.07]);
 }
 add('box','cloak-clasp',[.10,1.383+y,.145],[.046,.050,.028],metal);
 add('disc','ground-marker',[0,.013,0],[.88,1,.88],0xcebc87,[0,0,0],{rough:.65,em:.05});
 // Copy anchors into the frame; later attachment code cannot mutate a pose.
 const joints=Object.fromEntries(Object.entries(j).map(([name,v])=>[name,v.slice()]));
 return {root,joints,style:posed.style,combatScene:posed.combatScene,combatPhase:posed.combatPhase,
  combatProgress:posed.combatProgress,guarded:posed.guarded,reducedMotion:posed.reducedMotion,walkingBlend:posed.walkingBlend};
}
const api={motion,pose,draw};G.RealmTravelerArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
