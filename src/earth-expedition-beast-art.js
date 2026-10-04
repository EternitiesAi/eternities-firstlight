/* Original grounded Root-bank brute interpretation, local +Z forward.
 * Actual placement/timers/flash belong to the caller. No movement or combat
 * authority, no wall-clock gait, no inferred attack result or hit recoil. */
(function(G){'use strict';
 const add=(a,b)=>a.map((n,i)=>n+b[i]),sub=(a,b)=>a.map((n,i)=>n-b[i]);
 const scale=(a,n)=>a.map(v=>v*n),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const unit=a=>scale(a,1/Math.hypot(...a)),clamp=n=>Math.max(0,Math.min(1,n));
 const smooth=n=>n*n*(3-2*n);
 const point=(m,p)=>[0,1,2].map(i=>m[i]*p[0]+m[i+4]*p[1]+m[i+8]*p[2]+m[i+12]);
 const mul=(a,b)=>{const m=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;};
 const frame=(p,pitch=0,yaw=0)=>{const a=Math.cos(pitch),b=Math.sin(pitch),c=Math.cos(yaw),d=Math.sin(yaw);return[c,b*d,-a*d,0,0,a,b,0,d,-b*c,a*c,0,...p,1];};
 function pose(options={}){
  if(!options||typeof options!=='object')throw new TypeError('Use actual beast pose options.');
  const supplied=options.mode??'idle',mode=['pursue','return'].includes(supplied)?'chase':supplied;
  if(!['idle','chase','windup','recover'].includes(mode))throw new RangeError('Unsupported beast mode.');
  const timer=options.timer??0,windup=options.windup??1.35,recovery=options.recovery??2.3;
  if(!Number.isFinite(timer)||!Number.isFinite(windup)||windup<=0||!Number.isFinite(recovery)||recovery<=0)
   throw new RangeError('Use finite actual combat timer and positive durations.');
  if(options.time!==undefined&&!Number.isFinite(options.time))throw new RangeError('Beast sample time must be finite.');
  const anticipation=mode==='windup'?smooth(clamp(1-timer/windup)):0;
  const settling=mode==='recover'?smooth(clamp(timer/recovery)):0;
  const crouch=mode==='windup'?.02+.06*anticipation:.08*settling;
  const headPitch=mode==='windup'?.04+.18*anticipation:.22*settling;
  const age=options.contactAge,contact=mode==='recover'&&Number.isFinite(age)&&age>=0&&age<.18&&!options.reducedMotion?(1-age/.18)*.045:0;
  const bodyY=.55-crouch-contact,headAnchor=[0,bodyY+.015,.33],legs={};
  const gait=mode==='chase'?Math.max(0,Math.min(1,Number.isFinite(options.blend)?options.blend:0)):0,phase=Number.isFinite(options.phase)?options.phase:0,quiet=options.reducedMotion===true;
  const stance=mode==='chase'?.025:mode==='windup'?.035*anticipation:.035*settling;
  for(const side of [-1,1])for(const front of [false,true]){
   const id=(side<0?'left':'right')+(front?'Front':'Rear'),angle=phase+((side<0)===front?0:Math.PI),step=Math.sin(angle)*gait*(quiet?.05:.12),lift=Math.max(0,-Math.cos(angle))**2*gait*(quiet?.035:.085);
   legs[id]={hip:[side*.28,bodyY-.08,front?.20:-.33],
    knee:[side*.35,.25-crouch*.25+lift*.45,(front?.15:-.35)+step*.4],
    foot:[side*.43,.065+lift,(front?.28+stance:-.40-stance)+step]};
  }
  return{mode,anticipation,recovery:settling,crouch,bodyY,headAnchor,headPitch,legs,
   reducedMotion:options.reducedMotion===true,paused:options.paused===true};
 }
 function parts(options={}){
  if(!options||!['x','z','base','yaw'].every(k=>Number.isFinite(options[k])))
   throw new TypeError('Beast needs finite actual X/Z, support height and yaw.');
  if(options.aim!==undefined&&options.aim!==null&&(!Number.isFinite(options.aim.x)||!Number.isFinite(options.aim.z)))
   throw new TypeError('Actual attack aim must be finite or null.');
  const posed=pose(options),root=frame([options.x,options.base,options.z],0,options.yaw),head=frame(posed.headAnchor,posed.headPitch);
  const identity=frame([0,0,0]),out=[],flash=options.flash===true;
  const emit=(kind,local,p,s,c,id,extra={})=>{
   const transform=mul(root,mul(local,frame(p))),m=transform.slice();
   for(let col=0;col<3;col++)for(let row=0;row<3;row++)m[col*4+row]*=s[col];
   out.push({kind,p:point(root,point(local,p)),s:s.slice(),c:flash?0xf8e4b9:c,m,
    cameraSolid:false,cutaway:false,appearanceOnly:true,rough:.94,
    expeditionBeastPart:id,poseMode:posed.mode,confirmedFlash:flash,...extra});
  };
  const skin=(kind,p,s,c,id,extra)=>emit(kind,identity,p,s,c,id,extra);
  const bone=(local,a,b,width,depth,c,id,kind='box')=>{
   const axis=unit(sub(b,a)),hint=Math.abs(axis[0])>.9?[0,0,1]:[1,0,0];
   const right=unit(sub(hint,scale(axis,dot(hint,axis)))),back=cross(right,axis);
   const basis=[...right,0,...axis,0,...back,0,...scale(add(a,b),.5),1];
   const length=Math.hypot(...sub(b,a));
   emit(kind,mul(local,basis),[0,0,0],[width,kind==='octa'?length/1.3:length,depth],c,id,
    {anchorFrom:point(root,point(local,a)),anchorTo:point(root,point(local,b))});
  };
  skin('round',[0,posed.bodyY,-.08],[.99,.55,.94],0x746b49,'body');
  skin('round',[0,posed.bodyY-.025,.22],[.81,.52,.56],0x837753,'shoulder');
  skin('round',[0,posed.bodyY-.15,0],[.77,.22,.78],0x514f36,'belly');
  emit('round',head,[0,0,0],[.60,.42,.47],0x80704b,'head');
  emit('round',head,[0,-.075,.22],[.40,.23,.30],0x9b835a,'muzzle');
  emit('box',head,[0,-.075,.347],[.28,.14,.03],0x3f4031,'nose');
  for(const side of [-1,1]){
   const id=side<0?'left':'right';
   emit('round',head,[side*.20,-.07,.09],[.22,.20,.28],0x766846,id+'-cheek');
   emit('octa',head,[side*.225,.13,-.08],[.15,.20,.08],0x615d3d,id+'-ear');
   emit('round',head,[side*.205,.06,.14],[.072,.072,.058],0x252d26,id+'-eye');
   emit('round',head,[side*.085,-.055,.366],[.035,.027,.018],0x222921,id+'-nostril');
   const a=[side*.17,-.11,.23],b=[side*.225,-.085,.33],c=[side*.23,.015,.365];
   bone(head,a,b,.045,.045,0xc6ba91,id+'-tusk-base','octa');
   bone(head,b,c,.036,.036,0xd8cbaa,id+'-tusk-tip','octa');
  }
  for(const [id,l]of Object.entries(posed.legs)){
   bone(identity,l.hip,l.knee,.145,.16,0x685f40,id+'-upper');
   bone(identity,l.knee,l.foot,.125,.135,0x4c4c35,id+'-lower');
   skin('round',l.knee,[.16,.16,.16],0x665f42,id+'-joint');
   skin('box',[l.foot[0],l.foot[1]-.02,l.foot[2]],[.19,.09,.21],0x353e2f,id+'-hoof');
  }
  for(let i=0;i<4;i++){
   const z=-.34+i*.16,y=posed.bodyY+.275*Math.sqrt(1-((z+.08)/.47)**2)-.01;
   skin('octa',[0,y,z],[.20,.12,.12],0x5b603e,'ridge-'+i);
  }
  const tailA=[0,posed.bodyY+.025,-.47],tailB=[0,posed.bodyY-.01,-.61],tailC=[.025,posed.bodyY+.025,-.67];
  bone(identity,tailA,tailB,.052,.052,0x655d3d,'tail-base');
  bone(identity,tailB,tailC,.045,.045,0x655d3d,'tail-tip');
  skin('round',tailC,[.074,.064,.074],0x4b5236,'tail-tuft');
  if(out.length>=65)throw new RangeError('Expedition beast geometry budget exceeded.');
  return out;
 }
 function draw(out,options){
  if(!out||!['box','round','octa'].every(kind=>Array.isArray(out[kind])&&Object.isExtensible(out[kind])&&Object.getOwnPropertyDescriptor(out[kind],'length').writable))
   throw new TypeError('Beast needs box, round and octa output arrays.');
  const geometry=parts(options);for(const{kind,...item}of geometry)out[kind].push(item);return geometry.length;
 }
 // The caller supplies the actual immutable combat frame and canonical size.
 // This border is the marked damage rectangle, never a second hit authority.
 function warningParts({frame,length,halfWidth,base,mode,timer,windup,reducedMotion=false}={}){
  if(mode!=='windup')return[];
  if(!frame||![frame.x,frame.z,frame.yaw,length,halfWidth,base,timer,windup].every(Number.isFinite)||length<=0||halfWidth<=0||windup<=0)return[];
  const out=[],root=frameMatrix(frame),y=base+.035;
  function add(x,z,w,d,c,role){const p=point(root,[x,y,z]);out.push({kind:'box',p,s:[w,.045,d],c,r:[0,frame.yaw,0],em:.65,cameraSolid:false,cutaway:false,appearanceOnly:true,bankSweepPart:role});}
  for(const side of[-1,1])add(side*halfWidth,length/2,.075,length,0xe6bb87,'lane-side');
  for(const z of[0,length])add(0,z,halfWidth*2,.075,0xe6bb87,'lane-end');
  // Fixed crossbars retain direction/shape when prominent motion is disabled.
  for(const z of[.65,1.4,2.15])for(const side of[-1,1])add(side*.18,z,.065,.32,0xf0d8af,'lane-direction');
  if(!reducedMotion){const z=length*Math.max(0,Math.min(1,1-timer/windup));add(0,z,halfWidth*2,.055,0xffe4b4,'lane-deadline');}
  return out;
 }
 function frameMatrix(f){return frame([f.x,0,f.z],0,f.yaw);}
 const api=Object.freeze({pose,parts,draw,warningParts});G.RealmEarthExpeditionBeastArt=api;
 if(typeof module!=='undefined')module.exports=api;
})(globalThis);
