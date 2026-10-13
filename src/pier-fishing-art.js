/* Original pier rod/float and a release fish, projected from current activity.
 * Appearance only. Never creates an activity, result, collision or reward. */
(function(G){'use strict';
function draw(out,sim){
 const v=sim.presentation?.fishing;if(sim.room!==null||!v||!['waiting','bite','playing','caught','lost'].includes(v.phase))return;
 const add=(kind,p,s,c,id,extra={})=>out[kind].push({p,s,c,fishingPart:id,appearanceOnly:true,cameraSolid:false,cutaway:false,rough:.7,...extra});
 const beam=(a,b,width,c,id)=>{
  const d=b.map((x,i)=>x-a[i]),len=Math.hypot(...d),y=d.map(x=>x/len),ref=Math.abs(y[1])>.95?[1,0,0]:[0,1,0];
  let x=[ref[1]*y[2]-ref[2]*y[1],ref[2]*y[0]-ref[0]*y[2],ref[0]*y[1]-ref[1]*y[0]],n=Math.hypot(...x);x=x.map(v=>v/n);
  const z=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]],p=a.map((x,i)=>(x+b[i])/2);
  add('box',p,[width,len,width],c,id,{m:[...x.map(v=>v*width),0,...y.map(v=>v*len),0,...z.map(v=>v*width),0,...p,1]});
 };
 const motion=sim.state.settings.reducedMotion?0:Math.sin(v.time*3)*.035;
 const tip=[.95,3.32-v.tension*.24,28.95],float=[.2+(v.pulling?.12:0),.15+motion,31.2-v.progress*1.7];
 add('box',[1.10,1.45,27.8],[.18,.32,.18],0x71634f,'rod-holder');
 beam([1.10,1.55,27.8],[1.03,2.65,28.3],.058,0x8e7051,'rod-lower');
 beam([1.03,2.65,28.3],tip,.034,0xc2a277,'rod-tip');
 if(v.phase==='lost')return;
 beam(tip,float,.012,0xe1d8b7,'line');
 add('round',float,[.13,.17,.13],v.phase==='bite'?0xf2d28d:0xd18c62,'float');
 add('disc',[float[0],.065,float[2]],[.55,1,.55],0x8eaaa0,'float-ripple',{em:.06});
 if(v.phase==='caught'){
  add('round',[float[0],.18,float[2]],[.19,.19,.58],0xaac7bf,'silverfin-body',{rough:.25});
  add('octa',[float[0],.17,float[2]-.34],[.28,.045,.22],0x648d87,'silverfin-tail');
  add('round',[float[0]+.078,.22,float[2]+.17],[.029,.03,.029],0x233e42,'silverfin-eye');
 }
}
const api=Object.freeze({draw});G.RealmPierFishingArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
