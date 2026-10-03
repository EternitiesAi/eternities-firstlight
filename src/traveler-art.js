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
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>scale(a,1/(Math.hypot(...a)||1));
const smooth=n=>n*n*(3-2*n);
// The accepted release is presentation, not an impact test. Queued attacks join
// their real windup; direct accepted attacks begin at ready without inventing one.
const release=(ready,prepared,follow,p,origin)=>p<=.38?
 mix(origin==='ready'?ready:prepared,follow,smooth(p/.38)):
 mix(follow,ready,smooth((p-.38)/.62));
const directionMix=(a,b,t)=>{
 const angle=Math.acos(clamp(dot(a,b),-1,1)),s=Math.sin(angle);
 return angle<1e-5?norm(mix(a,b,t)):norm(plus(scale(a,Math.sin((1-t)*angle)/s),scale(b,Math.sin(t*angle)/s)));
};
// The cut passes outside the right shoulder before crossing forward. The
// shortest endpoint-only interpolation would take the blade through the head.
const bladeRelease=(ready,prepared,outside,follow,p,origin,mixer=mix)=>p<=.19?
 mixer(origin==='ready'?ready:prepared,outside,smooth(p/.19)):p<=.38?
 mixer(outside,follow,smooth((p-.19)/.19)):mixer(follow,ready,smooth((p-.38)/.62));
function bodyVector(v,body){
 const c=Math.cos(body.yaw),s=Math.sin(body.yaw),a=Math.cos(body.lean),b=Math.sin(body.lean);
 const x=c*v[0]+s*v[2],z=-s*v[0]+c*v[2];
 return [x,a*v[1]-b*z,b*v[1]+a*z];
}
const bodyPoint=(v,body,pivot)=>plus(plus(bodyVector(vec(v,pivot),body),pivot),body.shift);

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
 const reducedMotion=!!options.reducedMotion,combatScene=!!options.combatScene,swimming=!!options.swimming;
 const style=['blade','bow'].includes(options.style)?options.style:'none';
 const combatPhase=combatScene&&['anticipate','recover'].includes(options.combatPhase)?options.combatPhase:'idle';
 const combatProgress=combatPhase==='idle'?0:unit(options.combatProgress),guarded=combatScene&&!!options.guarded;
 const releaseOrigin=options.releaseOrigin==='ready'?'ready':'queued';
 const gait=(swimming?0:walkingBlend)*(reducedMotion?.55:1),stride=Math.sin(phase)*gait;
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
 const upperBody={yaw:0,lean:0,shift:[0,0,0]},pivot=[0,.985+torsoY,0];
 let bladeAxis=norm([.18,.94,.28]);
 if(combatScene&&style==='bow'){
  const readyLeft=[-.30,1.30+torsoY,.48],readyRight=[.16,1.26+torsoY,.32];
  const drawnLeft=[-.34,1.37+torsoY,.49],drawnRight=[.13,1.46+torsoY,.10];
  left=readyLeft;right=readyRight;
  if(combatPhase==='anticipate'){
   left=mix(readyLeft,drawnLeft,p);right=mix(readyRight,drawnRight,p);
   if(!reducedMotion){upperBody.yaw=.09*p;upperBody.lean=-.025*p;}
  }else if(combatPhase==='recover'){
   // A real queued draw remains connected at release, then the string relaxes.
   // Direct shots have no forged draw. Reduced motion retains only this essential
   // hand/string alignment and omits the optional small manual follow-through.
   const relax=smooth(unit(combatProgress/.55));
   if(releaseOrigin==='queued'){
    left=mix(drawnLeft,readyLeft,relax);right=mix(drawnRight,readyRight,relax);
    if(!reducedMotion){upperBody.yaw=.09*(1-relax);upperBody.lean=-.025*(1-relax);}
   }else if(!reducedMotion)right=release(readyRight,readyRight,[.20,1.24+torsoY,.36],combatProgress,'ready');
  }
  if(guarded){left=[-.30,1.28+torsoY,.40];right=[.15,1.26+torsoY,.24];}
 }else if(combatScene&&style==='blade'){
  const readyRight=[.29,.94+torsoY,.23],readyLeft=[-.27,1.02+torsoY,.13];
  const preparedRight=reducedMotion?[.32,1.01+torsoY,.24]:[.37,1.40+torsoY,.085];
  const preparedLeft=reducedMotion?readyLeft:[-.30,1.08+torsoY,.17];
  const followRight=reducedMotion?[.24,.99+torsoY,.29]:[.08,1.06+torsoY,.42];
  const followLeft=reducedMotion?readyLeft:[-.31,1.00+torsoY,.12];
  const outsideRight=releaseOrigin==='ready'?[.36,1.03+torsoY,.37]:[.40,1.19+torsoY,.38];
  const readyAxis=bladeAxis,preparedAxis=norm([.38,.27,-.88]),followAxis=norm([-.62,.20,.76]);
  right=readyRight;left=readyLeft;
  if(combatPhase==='anticipate'){
   right=mix(readyRight,preparedRight,p);left=mix(readyLeft,preparedLeft,p);
   if(!reducedMotion){bladeAxis=directionMix(readyAxis,preparedAxis,p);upperBody.yaw=-.14*p;upperBody.lean=-.04*p;upperBody.shift=[.008*p,0,-.012*p];}
  }else if(combatPhase==='recover'){
   right=reducedMotion?release(readyRight,preparedRight,followRight,combatProgress,releaseOrigin):
    bladeRelease(readyRight,preparedRight,outsideRight,followRight,combatProgress,releaseOrigin);
   left=release(readyLeft,preparedLeft,followLeft,combatProgress,releaseOrigin);
   if(!reducedMotion){
    bladeAxis=bladeRelease(readyAxis,preparedAxis,norm([.70,-.08,.71]),followAxis,combatProgress,releaseOrigin,directionMix);
    const balance=release([0,0,0],[-.14,-.04,1],[.15,.045,-1],combatProgress,releaseOrigin);
    upperBody.yaw=balance[0];upperBody.lean=balance[1];upperBody.shift=[balance[2]*.008,0,-balance[2]*.012];
   }
  }
  if(guarded){right=[.25,1.25+torsoY,.29];left=[-.24,1.26+torsoY,.25];}
 }else if(guarded){left=[-.23,1.20+torsoY,.24];right=[.23,1.20+torsoY,.24];}
 // Bracing and swimming retain their own stable ownership. Combat never moves
 // hip/leg/foot anchors or rotates the physical player/camera root.
 if(guarded||swimming){upperBody.yaw=0;upperBody.lean=0;upperBody.shift=[0,0,0];bladeAxis=guarded?norm([-.63,.72,.19]):norm([.18,.94,.28]);}
 if(swimming){const stroke=reducedMotion?0:Math.sin(time*1.9)*.12;left=[-.42,1.08+torsoY,.18+stroke];right=[.42,1.08+torsoY,.18-stroke];}
 for(const key of ['spine','chest','neck','head','back','leftShoulder','rightShoulder'])joints[key]=bodyPoint(joints[key],upperBody,pivot);
 left=bodyPoint(left,upperBody,pivot);right=bodyPoint(right,upperBody,pivot);bladeAxis=norm(bodyVector(bladeAxis,upperBody));
 const bladeLateral=norm(cross(bladeAxis,bodyVector([0,1,0],upperBody)));
 for(const [name,side,target]of [['left',-1,left],['right',1,right]]){
  const arm=twoBone(joints[name+'Shoulder'],target,.305,.285,bodyVector([side,-.3,-.25],upperBody));
  joints[name+'Elbow']=arm.middle;joints[name+'Hand']=arm.end;
 }
 return {joints,phase,walkingBlend,time,reducedMotion,style,combatScene,combatPhase,combatProgress,releaseOrigin,guarded,swimming,upperBody,bladeAxis,bladeLateral,
  bob:torsoY,cloakSwing:reducedMotion?0:Math.sin(phase)*walkingBlend*.025};
}

function draw(out,input={},posed=pose()){
 const {M,hex,blend}=G.RealmEngine;
 const x=finite(input.x),z=finite(input.z),base=finite(input.base),yaw=finite(input.yaw);
 const root=M.compose(x,base,z,1,1,1,0,yaw,0),j=posed.joints;
 const body=posed.upperBody||{yaw:0,lean:0,shift:[0,0,0]},pivotY=.985+posed.bob;
 const bodyRoot=M.mul(root,M.mul(M.compose(body.shift[0],pivotY+body.shift[1],body.shift[2],1,1,1,body.lean,body.yaw,0),M.compose(0,-pivotY,0,1,1,1)));
 const profile=input.profile||{},pal=G.RealmCreative||{};
 const pick=(list,key,fallback)=>Array.isArray(list)&&Number.isInteger(key)&&list[key]!=null?list[key]:fallback;
 const skin=hex(pick(pal.SKINS,profile.skin,0xd2ac8e)),hair=hex(pick(pal.HAIR,profile.hair,0x5a4334));
 const cloth=hex(input.color??pick(pal.CLOAKS,profile.cloak,0x6c9790));
 const cloak=hex(pick(pal.CLOAKS,profile.cloak,input.color??0x6c9790));
 const armored=input.armorColor!=null,coat=armored?hex(input.armorColor):blend(cloth,hex(0xe2d6b7),.12);
 const darkCoat=blend(coat,hex(0x263932),.20),seam=blend(coat,hex(0xe2d6b7),.32);
 const trousers=hex(0x414b45),leather=hex(0x4f4336),sole=hex(0x302f2b),metal=hex(0xc4af7b);
 const add=(kind,name,position,size,color,rotation=[0,0,0],extra={},upper=false)=>{
  const local=M.compose(...position,...size,...rotation);
  const parent=upper?bodyRoot:root;
  out[kind].push({p:M.transform(parent,position),s:size.slice(),m:M.mul(parent,local),c:color,rough:.84,
   cameraSolid:false,cutaway:false,travelerPart:name,...extra});
 };
 const upperAdd=(kind,name,position,size,color,rotation=[0,0,0])=>add(kind,name,position,size,color,rotation,{},true);
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
 upperAdd('box','jacket-waist',[0,1.035+y,0],[.335,.27,.24],darkCoat);
 upperAdd('box','jacket-chest',[0,1.255+y,0],[.425,.245,.255],coat);
 upperAdd('octa','jacket-left-side',[-.155,1.13+y,0],[.155,.35,.245],coat);
 upperAdd('octa','jacket-right-side',[.155,1.13+y,0],[.155,.35,.245],coat);
 upperAdd('box','jacket-front-seam',[0,1.18+y,.132],[.025,.30,.022],seam);
 add('box','jacket-left-hem',[-.096,.89+y,.008],[.18,.20,.245],darkCoat,[0,0,-.045]);
 add('box','jacket-right-hem',[.096,.89+y,.008],[.18,.20,.245],darkCoat,[0,0,.045]);
 add('box','belt',[0,.985+y,.008],[.355,.063,.267],leather);
 add('box','belt-buckle',[0,.985+y,.152],[.065,.060,.028],metal);
 upperAdd('box','collar-left',[-.09,1.407+y,.042],[.09,.10,.18],seam,[0,0,-.18]);
 upperAdd('box','collar-right',[.09,1.407+y,.042],[.09,.10,.18],seam,[0,0,.18]);
 upperAdd('round','neck',[0,1.475+y,0],[.105,.15,.115],skin);
 upperAdd('round','head',[0,1.610+y,.008],[.245,.27,.235],skin);
 upperAdd('box','hair-crown',[0,1.721+y,-.015],[.226,.062,.207],hair);
 upperAdd('box','hair-back',[0,1.620+y,-.105],[.220,.205,.072],hair);
 for(const [name,side]of [['left',-1],['right',1]]){
  upperAdd('round',name+'-ear',[side*.122,1.610+y,.003],[.046,.071,.05],skin);
  upperAdd('box',name+'-eye',[side*.050,1.633+y,.119],[.025,.016,.012],0x303b37);
  upperAdd('box',name+'-brow',[side*.051,1.654+y,.118],[.043,.012,.013],hair);
  limb(name+'-thigh',j[name+'Hip'],j[name+'Knee'],.165,.18,trousers);
  limb(name+'-shin',j[name+'Knee'],j[name+'Ankle'],.125,.145,trousers);
  add('round',name+'-knee',j[name+'Knee'],[.151,.13,.155],trousers);
  add('box',name+'-boot',j[name+'Foot'],[.165,.126,.285],leather);
  add('box',name+'-sole',plus(j[name+'Foot'],[0,-.049,0]),[.177,.036,.299],sole);
  add('round',name+'-boot-cuff',plus(j[name+'Ankle'],[0,.045,-.007]),[.152,.15,.172],leather);
  upperAdd('box',name+'-shoulder',[side*.235,1.365+y,0],[.18,.15,.255],coat,[0,0,side*.10]);
  limb(name+'-upper-arm',j[name+'Shoulder'],j[name+'Elbow'],.132,.144,coat);
  add('round',name+'-elbow',j[name+'Elbow'],[.125,.125,.129],darkCoat);
  limb(name+'-forearm',j[name+'Elbow'],j[name+'Hand'],.107,.119,darkCoat);
  add('round',name+'-hand',j[name+'Hand'],[.104,.116,.102],skin);
 }
 upperAdd('octa','nose',[0,1.614+y,.137],[.052,.066,.074],skin);
 const sweep=posed.cloakSwing;
 for(const [name,side]of [['left',-1],['center',0],['right',1]]){
  upperAdd('box','cloak-'+name,[side*.133,1.10+y,-.189-Math.abs(side)*.020+sweep],[.150,.61,.045],
   side?cloak:blend(cloak,hex(0x2d4039),.12),[.105+sweep,0,-side*.07]);
 }
 upperAdd('box','cloak-clasp',[.10,1.383+y,.145],[.046,.050,.028],metal);
 add('disc','ground-marker',[0,.013,0],[.88,1,.88],0xcebc87,[0,0,0],{rough:.65,em:.05});
 // Copy anchors into the frame; later attachment code cannot mutate a pose.
 const joints=Object.fromEntries(Object.entries(j).map(([name,v])=>[name,v.slice()]));
 return {root,joints,style:posed.style,combatScene:posed.combatScene,combatPhase:posed.combatPhase,
  combatProgress:posed.combatProgress,releaseOrigin:posed.releaseOrigin,bladeAxis:posed.bladeAxis.slice(),bladeLateral:posed.bladeLateral.slice(),
  upperBody:{yaw:body.yaw,lean:body.lean,shift:body.shift.slice()},guarded:posed.guarded,reducedMotion:posed.reducedMotion,swimming:posed.swimming,walkingBlend:posed.walkingBlend};
}
const api={motion,pose,draw};G.RealmTravelerArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
