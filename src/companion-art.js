/* Original Briar presentation rig. Local +Z is forward. The caller supplies
 * actual placement/bond state and owns transient samples; no game authority. */
(function(G){'use strict';
 const TAU=Math.PI*2,STRIDE=1.05,EPS=1e-8;
 const finite=(n,f=0)=>Number.isFinite(n)?n:f;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const add=(a,b)=>a.map((v,i)=>v+b[i]);
 const sub=(a,b)=>a.map((v,i)=>v-b[i]);
 const scale=(a,n)=>a.map(v=>v*n);
 const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const unit=a=>scale(a,1/(Math.hypot(...a)||1));
 const point=(m,p)=>[0,1,2].map(i=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]);
 const multiply=(a,b)=>{
  const m=Array(16).fill(0);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];
  return m;
 };
 const frame=(p,pitch=0,yaw=0,roll=0)=>{
  const a=Math.cos(pitch),b=Math.sin(pitch),c=Math.cos(yaw),d=Math.sin(yaw),e=Math.cos(roll),f=Math.sin(roll);
  return [c*e,a*f+b*d*e,b*f-a*d*e,0,-c*f,a*e-b*d*f,b*e+a*d*f,0,d,-b*c,a*c,0,...p,1];
 };
 function motion(previous,input={}) {
  const x=finite(input.x),z=finite(input.z),now=finite(input.time),scene=input.scene??null;
  const valid=previous&&['phase','blend','lastX','lastZ','lastTime','time'].every(k=>Number.isFinite(previous[k]));
  const state={lastX:x,lastZ:z,lastTime:now,scene,time:valid?previous.time:now,
   phase:valid?previous.phase:0,blend:valid?clamp(previous.blend,0,1):0,
   moving:false,paused:!!input.paused,reducedMotion:!!input.reducedMotion};
  if(!valid)return state;
  const elapsed=now-previous.lastTime,distance=Math.hypot(x-previous.lastX,z-previous.lastZ);
  if(state.paused&&scene===previous.scene)return state;
  if(scene!==previous.scene||elapsed<-EPS||elapsed>.75||distance>Math.max(.65,Math.max(0,elapsed)*8)||(Math.abs(elapsed)<EPS&&distance>EPS)) {
   state.phase=0;state.blend=0;state.time=state.paused?previous.time:now;return state;
  }
  // Paused coordinates are consumed without adding skipped travel or time.
  if(state.paused)return state;
  if(Math.abs(elapsed)<EPS){state.moving=!!previous.moving;return state;}
  const dt=Math.min(elapsed,.1);
  state.time+=dt;
  // Intent is deliberately insufficient. Displacement is the presentation
  // evidence, including actual movement accepted without a walking flag.
  state.moving=distance>EPS;
  if(state.moving)state.phase=(state.phase+distance/STRIDE*TAU)%TAU;
  const target=state.moving?1:0;
  state.blend=target+(state.blend-target)*Math.exp(-dt*(state.moving?18:24));
  if(state.blend<.001)state.blend=0;
  return state;
 }
 function leg(hip,foot,bendSign) {
  const delta=sub(foot,hip),distance=Math.hypot(...delta),direction=unit(delta);
  const half=distance/2,bend=Math.sqrt(Math.max(0,.24*.24-half*half));
  const perpendicular=unit([0,-direction[2],direction[1]]);
  return {hip,knee:add(add(hip,scale(direction,half)),scale(perpendicular,bend*bendSign)),foot};
 }
 function pose(options={}) {
  const bonded=options.bonded===true,reducedMotion=!!options.reducedMotion;
  const phase=bonded?finite(options.phase):0,blend=bonded?clamp(finite(options.blend),0,1):0;
  const time=bonded?finite(options.time):0;
  const bob=bonded&&!reducedMotion?Math.abs(Math.sin(phase*2))*.012*blend:0;
  const bodyY=(bonded?.51:.42)+bob,gait=blend;
  const legs={};
  for(const side of [-1,1])for(const front of [false,true]) {
   const id=(side<0?'left':'right')+(front?'Front':'Hind');
   const angle=phase+((side<0)===front?0:Math.PI);
   const zz=front?.29:-.33,lift=Math.max(0,Math.sin(angle))*.085*gait;
   const hip=[side*.215,bodyY-.025,zz];
   const foot=[side*.215,.055+lift,zz-Math.cos(angle)*.14*gait];
   legs[id]=leg(hip,foot,front?1:-1);
  }
  const secondary=bonded&&!reducedMotion?1:0,idle=1-blend;
  const headYaw=secondary&&idle>0?Math.sin(time*.83)*.035*idle:0;
  const headPitch=secondary&&idle>0?Math.sin(time*1.07)*.026*idle:0;
  const tailSway=secondary?Math.sin(time*1.8)*.045*idle+Math.sin(phase)*.035*blend:0;
  const headAnchor=[0,bodyY+.28,.49],earAngles=secondary&&idle>0?[
   Math.sin(time*1.3)*.055*idle,
   Math.sin(time*1.3+.6)*.055*idle]:[0,0];
  const tail=[ [0,bodyY+.02,-.47],
   [tailSway*.35,bodyY+.07,-.78],
   [tailSway*.8,bodyY+.105,-1.07],
   [tailSway,bodyY+.14,-1.34] ];
  return {bonded,reducedMotion,phase,blend,bob,bodyY,legs,headAnchor,headYaw,headPitch,earAngles,tail};
 }
 function parts(placement={},posed=pose({bonded:placement.bonded})) {
  if(!['x','z','base','yaw'].every(k=>Number.isFinite(placement[k])) || typeof placement.bonded!=='boolean')
   throw new TypeError('Briar needs finite actual placement and explicit bond state.');
  if(!posed || posed.bonded!==placement.bonded || !Number.isFinite(posed.bodyY) ||
     !['leftFront','rightFront','leftHind','rightHind'].every(id=>
      posed.legs?.[id]&&['hip','knee','foot'].every(k=>Array.isArray(posed.legs[id][k])&&posed.legs[id][k].length===3&&posed.legs[id][k].every(Number.isFinite))) ||
     ![posed.headYaw,posed.headPitch,...(posed.headAnchor||[]),...(posed.earAngles||[]),...(posed.tail||[]).flat()].every(Number.isFinite) ||
     posed.headAnchor?.length!==3 || posed.earAngles?.length!==2 || posed.tail?.length!==4 ||
     !posed.tail.every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)))
   throw new TypeError('Use a matching finite Briar pose.');
  const {x,z,base,yaw}=placement;
  const root=frame([x,base,z],0,yaw),head=frame(posed.headAnchor,posed.headPitch,posed.headYaw);
  const out=[],fur=0xcba271,warm=0xe0c093,cream=0xeee0ba,dark=0x5e594f;
  const emit=(kind,local,p,s,c,id,extra={})=>{
   const f=multiply(root,multiply(local,frame(p))),m=f.slice();
   for(let col=0;col<3;col++)for(let row=0;row<3;row++)m[col*4+row]*=s[col];
   out.push({kind,p:point(root,point(local,p)),s,c,m,
    cameraSolid:false,cutaway:false,rough:.9,companionPart:id,appearanceOnly:true,...extra});
  };
  const identity=frame([0,0,0]);
  const skin=(kind,p,s,c,id,extra)=>emit(kind,identity,p,s,c,id,extra);
  const member=(a,b,width,depth,c,id,kind='box',capOverlap=0)=>{
   const axis=unit(sub(b,a)),ref=Math.abs(axis[0])>.9?[0,0,1]:[1,0,0];
   const right=unit(sub(ref,scale(axis,dot(ref,axis)))),back=cross(right,axis);
   const local=[...right,0,...axis,0,...back,0,...scale(add(a,b),.5),1];
   emit(kind,local,[0,0,0],[width,Math.hypot(...sub(b,a))+capOverlap,depth],c,id,
    {anchorFrom:point(root,a),anchorTo:point(root,b),capOverlap});
   return local;
  };
  skin('round',[0,posed.bodyY,-.045],[.60,.46,1.02],fur,'body');
  skin('round',[0,posed.bodyY-.01,-.34],[.55,.48,.50],fur,'haunch');
  skin('round',[0,posed.bodyY+.035,.29],[.45,.40,.39],cream,'cream-bib');
  const neck=member([0,posed.bodyY+.035,.26],posed.headAnchor,.33,.33,fur,'neck','round');
  emit('round',head,[0,0,.015],[.40,.36,.46],warm,'head');
  for(const side of [-1,1]) {
   emit('round',head,[side*.115,-.075,.16],[.19,.16,.28],cream,side<0?'left-cheek':'right-cheek');
   emit('round',head,[side*.147,.025,.191],[.048,.052,.035],0x343d3b,side<0?'left-eye':'right-eye');
   const ear=frame([side*.145,.213,-.065],0,0,side*.14+posed.earAngles[side<0?0:1]);
   const earFrame=multiply(head,ear);
   emit('octa',earFrame,[0,0,0],[.17,.32,.16],fur,side<0?'left-ear':'right-ear');
   // Small inset patch on one real front ear facet, rather than a floating
   // vertical insert. Its frame follows the outer ear's exact triangle plane.
   const edge=unit([side*.085,0,-.08]);
   const towardTop=[-side*.085/2,.208,-.04];
   const up=unit(sub(towardTop,scale(edge,dot(edge,towardTop))));
   let normal=cross(edge,up);if(normal[2]<0)normal=scale(normal,-1);
   const patch=[...edge,0,...up,0,...cross(edge,up),0,
    ...add([side*.085/3,.208/3,.08/3],scale(normal,.003)),1];
   emit('round',multiply(earFrame,patch),[0,0,0],[.045,.11,.010],0xa8796b,
    side<0?'left-ear-inner':'right-ear-inner');
  }
  emit('round',head,[0,-.07,.335],[.205,.16,.345],cream,'muzzle');
  emit('round',head,[0,-.051,.502],[.098,.083,.07],0x343d3b,'nose');
  for(const [id,l] of Object.entries(posed.legs)) {
   member(l.hip,l.knee,.112,.13,fur,id+'-upper');
   member(l.knee,l.foot,.085,.10,dark,id+'-stocking');
   skin('round',l.foot,[.145,.105,.22],dark,id+'-paw');
  }
  for(let i=0;i<3;i++) member(posed.tail[i],posed.tail[i+1],i===2?.245:.29,i===2?.245:.29,
   i===2?0xf0e2bb:0xe4cb99,'tail-'+i,'round',.18);
  if(posed.bonded) {
   // Three shallow collar faces surround the neck; the familiar teal remains.
   emit('box',neck,[0,-.02,.18],[.37,.075,.055],0x648e89,'bond-collar-front');
   for(const side of [-1,1]) emit('box',neck,[side*.175,-.02,0],
    [.055,.075,.36],0x648e89,side<0?'bond-collar-left':'bond-collar-right');
  }
  if(out.length>48) throw new RangeError('Briar presentation budget exceeded.');
  return out;
 }
 function draw(out,placement,posed) {
  if(!out||!['box','round','octa'].every(kind=>Array.isArray(out[kind])))
   throw new TypeError('Briar needs box, round and octa instance arrays.');
  const geometry=parts(placement,posed);
  for(const {kind,...item} of geometry)out[kind].push(item);
  return geometry.length;
 }
 const api=Object.freeze({motion,pose,parts,draw});
 G.RealmCompanionArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
