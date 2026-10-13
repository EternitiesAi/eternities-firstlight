/* Original pier rod/float and a release fish, projected from current activity.
 * Appearance only. Never creates an activity, result, collision or reward. */
(function(G){'use strict';
const phases=['waiting','bite','playing','caught','lost'],clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const add3=(a,b)=>a.map((n,i)=>n+b[i]),scale=(a,n)=>a.map(v=>v*n),mix=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t),smooth=n=>n*n*(3-2*n);
function pose(v,reducedMotion=false){
 if(!v||!phases.includes(v.phase))return null;
 const cast=reducedMotion||v.phase!=='waiting'?1:clamp(v.time/.85),u=smooth(cast<.35?cast/.35:(cast-.35)/.65);
 const ready=[.25,1.12,.36],raised=[.36,1.25,.20];
 const right=cast===1?ready:cast<.35?mix([.26,.96,.12],raised,u):mix(raised,ready,u);
 const angle=cast===1?.38:cast<.35?.38+(2.25-.38)*u:2.25+(.38-2.25)*u;
 const pitch=angle+(v.phase==='playing'?.18*clamp(v.tension):0),axis=[.32,Math.sin(pitch),Math.cos(pitch)],len=Math.hypot(...axis);
 // Accepted reeling time is monotonic only while actually reeling. Easing,
 // menus and pause freeze the hand where it is, instead of resetting the crank.
 const reelAngle=reducedMotion?0:(Number.isFinite(v.reelTime)?v.reelTime:0)*7;
 const left=add3(right,[-.20,-.07+Math.sin(reelAngle)*.048,-.035+Math.cos(reelAngle)*.048]);
 return{phase:v.phase,cast,right,left,axis:scale(axis,1/len),reelAngle};
}
function facing(prior,{view,yaw,x,z,time,paused,reducedMotion}){
 const active=!!view&&phases.includes(view.phase);
 if(!active&&!prior)return null;
 const target=active?Math.atan2(3-x,31.2-z):yaw;
 const delta=prior?(active&&prior.active?view.time-prior.fishTime:time-prior.time):0;
 const dt=!paused&&delta>0&&delta<=.25?delta:0;
 const from=prior?.yaw??yaw,arc=Math.atan2(Math.sin(target-from),Math.cos(target-from));
 const next=reducedMotion?target:from+arc*(1-Math.exp(-12*dt));
 if(!active&&(reducedMotion||Math.abs(Math.atan2(Math.sin(yaw-next),Math.cos(yaw-next)))<.002))return null;
 return{yaw:next,time,fishTime:active?view.time:null,active};
}
function draw(out,sim,frame){
 const v=sim.presentation?.fishing;
 if(sim.room!==null||!v||!phases.includes(v.phase)||!frame?.fishing||frame.combatScene||frame.swimming)return;
 const M=G.RealmEngine.M,root=frame.root,hand=frame.joints.rightHand,left=frame.joints.leftHand,f=frame.fishing;
 const world=p=>M.transform(root,p);
 const add=(kind,p,s,c,id,extra={})=>out[kind].push({p,s,c,fishingPart:id,appearanceOnly:true,cameraSolid:false,cutaway:false,rough:.7,...extra});
 const beam=(a,b,width,c,id)=>{
  const d=b.map((x,i)=>x-a[i]),len=Math.hypot(...d),y=d.map(x=>x/len),ref=Math.abs(y[1])>.95?[1,0,0]:[0,1,0];
  if(len<1e-7)return;
  let x=[ref[1]*y[2]-ref[2]*y[1],ref[2]*y[0]-ref[0]*y[2],ref[0]*y[1]-ref[1]*y[0]],n=Math.hypot(...x);x=x.map(v=>v/n);
  const z=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]],p=a.map((x,i)=>(x+b[i])/2);
  add('box',p,[width,len,width],c,id,{m:[...x.map(v=>v*width),0,...y.map(v=>v*len),0,...z.map(v=>v*width),0,...p,1],segment:[a.slice(),b.slice()]});
 };
 const motion=sim.state.settings.reducedMotion?0:Math.sin(v.time*3)*.035;
 const knee=add3(hand,scale(f.axis,1.1)),tip=world(add3(add3(hand,scale(f.axis,1.95)),[0,-clamp(v.tension)*.20,.04]));
 const center=add3(hand,[-.16,-.07,-.035]),crank=add3(center,[-.04,0,0]);
 beam(world(add3(hand,scale(f.axis,-.14))),world(add3(hand,scale(f.axis,.14))),.078,0x4d4333,'rod-grip');
 beam(world(hand),world(knee),.049,0x8e7051,'rod-lower');beam(world(knee),tip,.028,0xc2a277,'rod-tip');
 beam(world(hand),world(center),.038,0x88764f,'reel-mount');
 add('round',world(center),[.055,.17,.17],0xb49b65,'reel-spool',{rough:.38,m:M.mul(root,M.compose(...center,.055,.17,.17))});
 beam(world(center),world(crank),.030,0x4d5146,'reel-axle');beam(world(crank),world(left),.027,0xb49b65,'reel-crank');
 add('round',world(left),[.064,.060,.061],0x4d4333,'reel-handle');
 if(v.phase==='lost')return;
 const target=[3+(v.pulling?.12:0),.15+motion,31.2-v.progress*1.7],flight=smooth(clamp((f.cast-.35)/.65));
 const float=mix(tip,target,flight);float[1]+=Math.sin(flight*Math.PI)*.8;
 beam(tip,float,.012,0xe1d8b7,'line');
 add('round',float,[.13,.17,.13],v.phase==='bite'?0xf2d28d:0xd18c62,'float');
 if(flight===1)add('disc',[float[0],.065,float[2]],[.55,1,.55],0x8eaaa0,'float-ripple',{em:.06});
 if(v.phase==='caught'){
  add('round',[float[0],.18,float[2]],[.19,.19,.58],0xaac7bf,'silverfin-body',{rough:.25});
  add('octa',[float[0],.17,float[2]-.34],[.28,.045,.22],0x648d87,'silverfin-tail');
  add('round',[float[0]+.078,.22,float[2]+.17],[.029,.03,.029],0x233e42,'silverfin-eye');
 }
}
const api=Object.freeze({pose,facing,draw});G.RealmPierFishingArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
