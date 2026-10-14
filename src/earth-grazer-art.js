/* Primitive grazer; shape is appearance only. Only draw of a branded
 * live projection returns a private submission receipt, never observed progress. */
(function(G){'use strict';
const E=G.RealmEngine,B=G.RealmEarthGrazerMotion;if(!E?.M||!B)throw Error('Load Engine and GrazerMotion before grazer art.');
const frames=new WeakMap(),latest=new WeakMap(),KIND=['box','round','octa','earth-grazer-body-v1'];
const MATERIALS=Object.freeze({hide:0x647982,belly:0x53656c,head:0x849493,muzzle:0xacb4a1,hoof:0x39434a,moss:0x748b52,eye:0x27383a});
const unit=a=>{const n=Math.hypot(...a);if(n<1e-9)throw Error('Distinct bone endpoints required.');return a.map(v=>v/n);};
function shape(pose,options={}){
 if(!pose||!['x','z','base','yaw','lower','gait'].every(k=>Number.isFinite(pose[k]))||pose.lower<0||pose.lower>1||
  !['low','balanced','high'].includes(options.quality||'balanced'))throw TypeError('Use bounded actual grazer pose and quality.');
 const {M}=E,root=M.compose(pose.x,pose.base,pose.z,1,1,1,0,pose.yaw,0),head=M.compose(0,.89,.35,1,1,1,pose.lower*Math.PI*55/180),out=[];
 const emit=(kind,local,p,s,c,part)=>{
  const m=M.mul(root,M.mul(local,M.compose(...p,...s))),position=M.transform(root,M.transform(local,p));
  out.push({kind,p:position,s:s.slice(),m,c:E.hex(c),rough:.96,cameraSolid:false,cutaway:false,appearanceOnly:true,
   grazerPart:part,grazerActor:B.ID,grazerPhase:pose.phase||'shape-fixture'});
 };
 const identity=M.identity(),body=(kind,p,s,c,id)=>emit(kind,identity,p,s,c,id);
 const bone=(a,b,w,d,c,id,kind='box')=>{
  const axis=unit(b.map((v,i)=>v-a[i])),hint=Math.abs(axis[0])>.9?[0,0,1]:[1,0,0];
  const right=unit(hint.map((v,i)=>v-axis[i]*E.dot(hint,axis))),back=E.cross(right,axis),length=Math.hypot(...b.map((v,i)=>v-a[i]));
  const matrix=new Float32Array([...right,0,...axis,0,...back,0,...a.map((v,i)=>(v+b[i])/2),1]);
  emit(kind,matrix,[0,0,0],[w,length,d],c,id);
 };
 // One original Blender surface joins the shoulder and haunch. Articulation
 // and the existing observation IDs remain owned by the live presentation.
 body('earth-grazer-body-v1',[0,0,0],[1,1,1],MATERIALS.hide,'long-body');
 body('round',[0,.99,.48],[.29,.47,.34],MATERIALS.head,'neck');
 emit('round',head,[0,.215,.405],[.33,.32,.49],MATERIALS.head,'slender-head');
 emit('round',head,[0,.145,.57],[.25,.155,.30],MATERIALS.muzzle,'feeding-muzzle');
 emit('box',head,[0,.145,.718],[.18,.080,.024],MATERIALS.hoof,'soft-nose');
 for(const side of[-1,1]){
  const ear=M.mul(head,M.compose(side*.155,.405,.255,1,1,1,0,0,-side*.40));
  emit('octa',ear,[0,0,0],[.10,.18,.10],MATERIALS.belly,(side<0?'left':'right')+'-split-ear');
  emit('round',head,[side*.149,.26,.465],[.046,.048,.046],MATERIALS.eye,(side<0?'left':'right')+'-eye');
 }
 const quiet=pose.reducedMotion===true||options.reducedMotion===true;
 for(const side of[-1,1])for(const front of[false,true]){
  const id=(side<0?'left':'right')+(front?'-front':'-rear'),phase=pose.gait+((side<0)===front?0:Math.PI);
  const step=pose.walking&&!quiet?Math.sin(phase)*.04:0,lift=pose.walking&&!quiet?Math.max(0,-Math.cos(phase))*.035:0;
  const hip=[side*.29,.76,front?.36:-.49],knee=[side*.32,.38+lift*.5,front?.265:-.325],foot=[side*.35,.060+lift,(front?.435:-.575)+step];
  bone(hip,knee,.19,.21,MATERIALS.hide,id+'-upper','octa');bone(knee,foot,.075,.09,MATERIALS.belly,id+'-lower');
  body('box',[foot[0],.045+lift,foot[2]],[.15,.09,.19],MATERIALS.hoof,id+'-hoof');
 }
 const moss=[{p:[-.06,1.155,-.50],s:[.59,.14,.48]},{p:[.06,1.175,-.13],s:[.63,.13,.51]},{p:[-.025,1.16,.265],s:[.47,.12,.39]}];
 moss.forEach((lobe,i)=>body('round',lobe.p,lobe.s,MATERIALS.moss,'moss-lobe-'+i));
 if((options.quality||'balanced')!=='low')for(const side of[-1,1])body('octa',[side*.245,1.12,-.30],[.15,.10,.20],0x8c9b68,(side<0?'left':'right')+'-moss-tip');
 bone([0,.82,-.77],[.025,.72,-.99],.055,.06,MATERIALS.belly,'short-tail');
 body('round',[.025,.72,-.99],[.09,.12,.15],MATERIALS.moss,'tail-tuft');
 return out;
}
function output(out){return!!out&&KIND.every(k=>Array.isArray(out[k])&&Object.isExtensible(out[k])&&Object.getOwnPropertyDescriptor(out[k],'length').writable);}
function draw(out,view,ctx,options={}){
 if(!output(out))throw TypeError('Use writable box/round/octa primitive arrays.');
 if(!B.isProjection(view,ctx))return null;
 const parts=shape(view,options),members=[];
 for(const {kind,...item}of parts){out[kind].push(item);members.push({kind,item,signature:JSON.stringify(item)});}
 const receipt=Object.freeze({});frames.set(receipt,{view,sim:ctx.sim,out,members});latest.set(ctx.sim,receipt);return receipt;
}
function isSubmission(receipt,ctx){
 const f=receipt&&frames.get(receipt);try{return!!f&&f.sim===ctx?.sim&&latest.get(f.sim)===receipt&&B.isProjection(f.view,ctx)&&
 f.members.every(({kind,item,signature})=>Array.isArray(f.out[kind])&&f.out[kind].filter(p=>p===item).length===1&&JSON.stringify(item)===signature);}catch{return false;}
}
function inspect(receipt){const f=receipt&&frames.get(receipt);return f?Object.freeze({actor:B.ID,count:f.members.length,phase:f.view.phase,
  x:f.view.x,z:f.view.z,yaw:f.view.yaw,lower:f.view.lower,walking:f.view.walking}):null;}
function foliage(out,path=B.PATH){
 if(!output(out)||path!==B.PATH)throw TypeError('Use canonical measured path for proposed feeding tuft.');
 const first=path.points[0],toward=path.browseToward,d=Math.hypot(toward.x-first.x,toward.z-first.z),x=first.x+(toward.x-first.x)*.85/d,z=first.z+(toward.z-first.z)*.85/d;
 for(const [i,dx]of[-.11,0,.11].entries())out.octa.push({p:[x+dx,1.57+.17,z],s:[.20,.26,.20],c:E.hex(MATERIALS.moss),rough:.98,
  cameraSolid:false,cutaway:false,appearanceOnly:true,grazerFoliagePart:'feeding-tuft-'+i});
 return 3;
}
function reset(sim){latest.delete(sim);}
const api=Object.freeze({MATERIALS,shape,draw,isSubmission,inspect,foliage,reset});G.RealmEarthGrazerArt=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
