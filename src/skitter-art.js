/* Original six-legged skitter presentation. Local +Z faces forward. Caller
 * supplies actual placement, timers and confirmed feedback; no combat rules. */
(function(G){'use strict';
 const TAU=Math.PI*2,finite=(n,f=0)=>Number.isFinite(n)?n:f;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const plus=(a,b)=>a.map((v,i)=>v+b[i]),minus=(a,b)=>a.map((v,i)=>v-b[i]);
 const scale=(a,n)=>a.map(v=>v*n),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const unit=a=>scale(a,1/(Math.hypot(...a)||1));
 const smooth=n=>n*n*(3-2*n);
 const point=(m,p)=>[0,1,2].map(i=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]);
 const mul=(a,b)=>{const m=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;};
 const frame=(p,pitch=0,yaw=0)=>{
  const a=Math.cos(pitch),b=Math.sin(pitch),c=Math.cos(yaw),d=Math.sin(yaw);
  return [c,b*d,-a*d,0,0,a,b,0,d,-b*c,a*c,0,...p,1];
 };
 function motion(previous,input={}) {
  const x=finite(input.x),z=finite(input.z),now=finite(input.time),scene=input.scene??null;
  const valid=previous&&['phase','blend','time','lastX','lastZ','lastTime'].every(k=>Number.isFinite(previous[k]));
  const state={lastX:x,lastZ:z,lastTime:now,scene,time:valid?previous.time:now,
   phase:valid?previous.phase:0,blend:valid?clamp(previous.blend,0,1):0,
   moving:false,paused:!!input.paused,reducedMotion:!!input.reducedMotion};
  if(!valid)return state;
  const dt=now-previous.lastTime,distance=Math.hypot(x-previous.lastX,z-previous.lastZ);
  if(state.paused&&scene===previous.scene)return state;
  if(scene!==previous.scene||dt<-1e-8||dt>.75||distance>Math.max(.55,Math.max(0,dt)*8)||(Math.abs(dt)<1e-8&&distance>1e-8)){
   state.phase=0;state.blend=0;state.time=state.paused?previous.time:now;return state;
  }
  if(state.paused)return state;
  if(Math.abs(dt)<1e-8){state.moving=!!previous.moving;return state;}
  const elapsed=Math.min(dt,.1);state.time+=elapsed;state.moving=distance>1e-8;
  if(state.moving)state.phase=(state.phase+distance/.8*TAU)%TAU;
  const target=state.moving?1:0;
  state.blend=target+(state.blend-target)*Math.exp(-elapsed*(state.moving?18:24));
  if(state.blend<.001)state.blend=0;
  return state;
 }
 function solve(hip,foot,side) {
  const delta=minus(foot,hip),distance=Math.hypot(...delta),direction=unit(delta);
  const along=(.20*.20-.27*.27+distance*distance)/(2*distance);
  const bend=Math.sqrt(Math.max(0,.20*.20-along*along));
  const hint=[side,.4,0],outward=unit(minus(hint,scale(direction,dot(hint,direction))));
  return {hip,knee:plus(plus(hip,scale(direction,along)),scale(outward,bend)),foot};
 }
 function pose(options={}) {
  const mode=['idle','chase','windup','recover'].includes(options.mode)?options.mode:'idle';
  const phase=finite(options.phase),blend=clamp(finite(options.blend),0,1),reducedMotion=!!options.reducedMotion;
  const validWindup=Number.isFinite(options.windup)&&options.windup>0&&Number.isFinite(options.timer);
  const validRecovery=Number.isFinite(options.recoverDuration)&&options.recoverDuration>0&&Number.isFinite(options.timer);
  const anticipation=mode==='windup'&&validWindup?smooth(clamp(1-options.timer/options.windup,0,1)):0;
  const recovery=mode==='recover'&&validRecovery?smooth(clamp(options.timer/options.recoverDuration,0,1)):0;
  const gait=mode==='windup'||mode==='recover'?0:blend;
  const bob=reducedMotion?0:Math.abs(Math.sin(phase*2))*.006*gait;
  const crouch=.09*anticipation,bodyY=.52-crouch+bob,legs={};
  for(const side of [-1,1])for(let row=0;row<3;row++) {
   const id=(side<0?'left':'right')+['Rear','Middle','Front'][row];
   const angle=phase+((side<0)===(row!==1)?0:Math.PI),z=(row-1)*.33;
   const hip=[side*.31,bodyY-.12,z];
   const foot=[side*.50,.045+Math.max(0,Math.sin(angle))*.065*gait,z-Math.cos(angle)*.075*gait];
   legs[id]=solve(hip,foot,side);
  }
  const headAnchor=[0,.64-crouch*.6+bob-recovery*.025,.48];
  const headPitch=.07*anticipation+.06*recovery;
  return {mode,named:options.named===true,reducedMotion,phase,blend,bob,crouch,bodyY,
   anticipation,recovery,legs,headAnchor,headPitch};
 }
 function parts(placement={},posed=pose({named:placement.named})) {
  if(!['x','z','base','yaw'].every(k=>Number.isFinite(placement[k]))||typeof placement.named!=='boolean'||
     !Number.isInteger(placement.bodyColor)||placement.bodyColor<0||placement.bodyColor>0xffffff)
   throw new TypeError('Skitter needs finite actual placement, named flag and body color.');
  if(!posed||posed.named!==placement.named||!Number.isFinite(posed.bodyY)||!Number.isFinite(posed.headPitch)||
     !Array.isArray(posed.headAnchor)||posed.headAnchor.length!==3||!posed.headAnchor.every(Number.isFinite)||
     !['leftRear','leftMiddle','leftFront','rightRear','rightMiddle','rightFront'].every(id=>posed.legs?.[id]&&
      ['hip','knee','foot'].every(k=>Array.isArray(posed.legs[id][k])&&posed.legs[id][k].length===3&&posed.legs[id][k].every(Number.isFinite))))
   throw new TypeError('Use a matching finite six-legged skitter pose.');
  const recoil=placement.recoil??{x:0,z:0};
  if(!Number.isFinite(recoil.x)||!Number.isFinite(recoil.z))throw new TypeError('Confirmed recoil offset must be finite.');
  const factor=placement.named?1.32:1,root=frame([placement.x+recoil.x,placement.base,placement.z+recoil.z],0,placement.yaw);
  for(let c=0;c<3;c++)for(let r=0;r<3;r++)root[c*4+r]*=factor;
  const head=frame(posed.headAnchor,posed.headPitch),identity=frame([0,0,0]),out=[];
  const emit=(kind,local,p,s,c,id,extra={})=>{
   const transform=mul(root,mul(local,frame(p))),m=transform.slice();
   for(let col=0;col<3;col++)for(let r=0;r<3;r++)m[col*4+r]*=s[col];
   out.push({kind,p:point(root,point(local,p)),s:s.map(v=>v*factor),c,m,
    cameraSolid:false,cutaway:false,rough:.92,appearanceOnly:true,skitterPart:id,
    namedSkitter:placement.named,confirmedFlash:placement.flash===true,...extra});
  };
  const skin=(kind,p,s,c,id,extra)=>emit(kind,identity,p,s,c,id,extra);
  const bone=(a,b,width,depth,c,id,kind='box')=>{
   const axis=unit(minus(b,a)),ref=Math.abs(axis[0])>.9?[0,0,1]:[1,0,0];
   const right=unit(minus(ref,scale(axis,dot(ref,axis)))),back=cross(right,axis);
   const local=[...right,0,...axis,0,...back,0,...scale(plus(a,b),.5),1];
   const length=Math.hypot(...minus(b,a));
   emit(kind,local,[0,0,0],[width,kind==='octa'?length/1.3:length,depth],c,id,
    {anchorFrom:point(root,a),anchorTo:point(root,b)});
  };
  const color=placement.bodyColor;
  skin('round',[0,posed.bodyY,0],[.95,.84,1.22],color,'carapace');
  for(let i=0;i<3;i++){
   const z=(i-1)*.28,y=posed.bodyY+.42*Math.sqrt(1-(z/.61)**2)-.025;
   skin('octa',[0,y,z],[.52,.10,.33],color,'carapace-plate-'+i);
  }
  emit('round',head,[0,0,0],[.55,.40,.50],0xbb987b,'head');
  emit('round',head,[0,-.08,.15],[.34,.20,.22],0xa68b6d,'muzzle');
  for(const side of [-1,1])emit('round',head,[side*.18,.07,.23],[.095,.095,.08],
   0xf9bf9a,side<0?'left-eye':'right-eye',{em:1});
  for(const [id,l] of Object.entries(posed.legs)) {
   bone(l.hip,l.knee,.075,.09,0x938670,id+'-upper');
   bone(l.knee,l.foot,.065,.075,0x827c65,id+'-lower');
   skin('round',l.foot,[.115,.085,.16],0x606853,id+'-foot');
  }
  if(placement.named)for(let i=0;i<5;i++) {
   const z=-.45+i*.19,y=posed.bodyY+.42*Math.sqrt(1-(z/.61)**2)-.025;
   bone([0,y,z],[0,y+.27,z-.035],.145,.15,0xcbb47e,'river-spine-'+i,'octa');
  }
  if(out.length>40)throw new RangeError('Skitter geometry budget exceeded.');
  return out;
 }
 function draw(out,placement,posed) {
  if(!out||!['box','round','octa'].every(k=>Array.isArray(out[k])))throw new TypeError('Skitter needs box, round and octa arrays.');
  const geometry=parts(placement,posed);
  for(const {kind,...item} of geometry)out[kind].push(item);
  return geometry.length;
 }
 const api=Object.freeze({motion,pose,parts,draw});
 G.RealmSkitterArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
