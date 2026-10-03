/* Read-only worksite changes. The quest ledger owns every transition. */
(function(G){'use strict';
const FLOOR=1.57,ROOM='world-earthlands',safe=['stormfall-recovery','managed-coppice'];
function parts(ledger){
 const story=ledger?.story;if(!story||!Array.isArray(story.steps))return[];
 const steps=new Set(story.steps),out=[],base={cameraSolid:false,cutaway:false,rough:.95,appearanceOnly:true};
 const add=(kind,p,s,c,role,extra={})=>out.push({kind,p,s,c,opt:{...base,expeditionPart:role,...extra}});
 const beam=(a,b,w,d,c,role)=>{
  const delta=b.map((v,i)=>v-a[i]),length=Math.hypot(...delta),axis=delta.map(v=>v/length),ref=Math.abs(axis[2])<.9?[0,0,1]:[1,0,0];
  const dot=axis.reduce((n,v,i)=>n+v*ref[i],0),z=ref.map((v,i)=>v-axis[i]*dot),n=Math.hypot(...z),zn=z.map(v=>v/n);
  const x=[axis[1]*zn[2]-axis[2]*zn[1],axis[2]*zn[0]-axis[0]*zn[2],axis[0]*zn[1]-axis[1]*zn[0]],p=a.map((v,i)=>(v+b[i])/2);
  add('timber-panel',p,[w,length,d],c,role,{m:[...x.map(v=>v*w),0,...axis.map(v=>v*length),0,...zn.map(v=>v*d),0,...p,1],anchorFrom:a,anchorTo:b});
 };
 // A grounded camp board remains beside the work approach in every state.
 for(const x of [-76.5,-75.5])add('timber-panel',[x,FLOOR+.65,-14.8],[.08,1.3,.10],0x68523b,'load-board-post');
 add('timber-panel',[-76,FLOOR+1.12,-14.8],[1.34,.68,.065],0x6d6148,'load-board');
 const page=steps.has('assess-load')?0xe7dcbb:0xc7bea2;
 for(let i=0;i<2;i++)add('box',[-76.27+i*.54,FLOOR+1.12,-14.755],[.42,.48,.018],page,'load-board-record');
 if(safe.includes(story.branch)&&steps.has('prepare-allocation')){
  const x=story.branch==='stormfall-recovery'?-81.8:-76.9,z=story.branch==='stormfall-recovery'?-19:-3.5;
  if(story.branch==='managed-coppice')for(let i=0;i<2;i++)add('timber-panel',[-76.58,FLOOR+.07+i*.14,z],[1.40,.14,.28],0x9a9868,'prepared-coppice-bundle',{allocation:story.branch});
  for(let i=0;i<3;i++)add('box',[x+i*.32,FLOOR+(story.branch==='managed-coppice'?.14:.32),z],[.08,story.branch==='managed-coppice'?.28:.46,.32],0xa8b487,'prepared-allocation-band',{allocation:story.branch});
 }
 if(steps.has('brace-root-channel')){
  // The east flank owns this repair. Every piece lies beside its outer face;
  // the authoritative open passage, root and collision wall are retained.
  const x=-143.294;
  beam([x,FLOOR+.18,-78.9],[x,FLOOR+2.21,-71.1],.16,.025,0x9a7953,'installed-brace');
  for(const [y,z] of [[FLOOR+.18,-78.9],[FLOOR+2.21,-71.1]])add('box',[x+.018,y,z],[.042,.20,.30],0xc2ab74,'brace-fastening');
 }
 if(steps.has('deliver-allocation')){
  const fiber=story.branch==='managed-coppice',c=fiber?0xa5b27e:0x94714c;
  for(let i=0;i<3;i++)add('timber-panel',[-110.7,FLOOR+.59+i*.12,-110.3],[1.04,.12,.52],c,'delivered-stock',{allocation:story.branch});
  for(const x of [-111,-110.4])add('box',[x,FLOOR+.71,-110.3],[.065,.36,.59],0xd0c1a0,'delivery-binding');
 }
 if(story.claimed){
  add('box',[-76,FLOOR+1.11,-14.735],[.24,.26,.018],0x91b982,'claimed-board-seal');
  add('octa',[-76,FLOOR+1.11,-14.721],[.13,.16,.023],0xe4d9ad,'claimed-board-mark');
 }
 return out;
}
function draw(out,sim){if(sim?.room!==ROOM)return;for(const r of parts(sim.state.earthExpedition)){out[r.kind]?.push({p:r.p,s:r.s,c:r.c,...r.opt});}}
const api=Object.freeze({parts,draw});G.RealmEarthExpeditionArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
