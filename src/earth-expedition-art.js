/* Read-only worksite changes. The quest ledger owns every transition. */
(function(G){'use strict';
const FLOOR=1.57,ROOM='world-earthlands',safe=['stormfall-recovery','managed-coppice'];
function parts(ledger,pendingProjection){
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
 // A field check is separate from the enduring first repair. An active patrol
 // displays only its own saved clearance, never a backfilled story defeat.
 const inspection=ledger.patrol?.active,checked=inspection?inspection.steps.includes('clear-root-pests'):steps.has('clear-root-pests');
 if(steps.has('read-root-load')||inspection?.steps.includes('inspect-root')){
  add('timber-panel',[-137.6,FLOOR+.52,-74.2],[.08,1.04,.08],0x766049,'clearance-stake');
  add('timber-panel',[-137.6,FLOOR+.83,-74.145],[.56,.36,.04],0x776c51,'clearance-board');
  const role=inspection?(checked?'patrol-clear-tag':'patrol-check-tag'):(checked?'story-clear-tag':'story-check-tag');
  add('box',[-137.6,FLOOR+.83,-74.12],[.32,.22,.018],checked?0x9fc6a0:0xd9b278,role,{patrolRun:inspection?.run??null});
  // A bright diagonal check reads through shape as well as color.
  if(checked)beam([-137.73,FLOOR+.80,-74.105],[-137.62,FLOOR+.75,-74.105],.036,.018,0xf0e6c7,'clearance-check');
  if(checked)beam([-137.62,FLOOR+.75,-74.105],[-137.45,FLOOR+.91,-74.105],.036,.018,0xf0e6c7,'clearance-check');
 }
 // The supplied kit and installed assembly share exact sectional geometry.
 for(const p of G.RealmEarthFieldcraftArt?.parts(ledger,pendingProjection)||[])out.push({...p,opt:{...p.opt,expeditionPart:p.opt.fieldcraftPart}});
 if(safe.includes(story.branch)&&steps.has('prepare-allocation')){
  const x=story.branch==='stormfall-recovery'?-81.8:-76.9,z=story.branch==='stormfall-recovery'?-19:-3.5;
  if(story.branch==='managed-coppice')for(let i=0;i<2;i++)add('timber-panel',[-76.58,FLOOR+.07+i*.14,z],[1.40,.14,.28],0x9a9868,'prepared-coppice-bundle',{allocation:story.branch});
  for(let i=0;i<3;i++)add('box',[x+i*.32,FLOOR+(story.branch==='managed-coppice'?.14:.32),z],[.08,story.branch==='managed-coppice'?.28:.46,.32],0xa8b487,'prepared-allocation-band',{allocation:story.branch});
 }
 if(steps.has('deliver-allocation')){
  const fiber=story.branch==='managed-coppice',c=fiber?0xa5b27e:0x94714c;
  for(let i=0;i<3;i++)add('timber-panel',[-110.7,FLOOR+.59+i*.12,-110.3],[1.04,.12,.52],c,'delivered-stock',{allocation:story.branch});
  for(const x of [-111,-110.4])add('box',[x,FLOOR+.71,-110.3],[.065,.36,.59],0xd0c1a0,'delivery-binding');
 }
 // Borrowed checking equipment belongs to the accepted run. Old paid claims
 // never construct a new rack; first delivered stock and brace stay untouched.
 if(story.claimed&&inspection){
  const x=-104.8,z=-104.2,done=inspection.steps.includes('inspect-glade'),fiber=story.branch==='managed-coppice';
  for(const dx of[-.48,.48])add('timber-panel',[x+dx,FLOOR+.22,z],[.09,.44,.48],0x715b43,'patrol-kit-foot',{patrolRun:inspection.run});
  add('timber-panel',[x,FLOOR+.47,z],[1.16,.10,.58],0x947856,'patrol-kit-tray',{patrolRun:inspection.run});
  if(fiber){
   add('timber-panel',[x,FLOOR+.61,z],[.90,.18,.34],0xa2a279,'patrol-test-bundle',{patrolRun:inspection.run});
   for(const dx of[-.26,.26])add('box',[x+dx,FLOOR+.61,z],[done?.035:.07,.24,.40],done?0xd2c18c:0x93835f,done?'patrol-lashing-seated':'patrol-lashing-loose',{patrolRun:inspection.run});
  }else for(let i=0;i<3;i++)add('timber-panel',[x-.36+i*.36,FLOOR+.61,z+(done?0:(i-1)*.06)],[.22,.18,.40],0xa28256,done?'patrol-billet-squared':'patrol-billet-check',{patrolRun:inspection.run,r:[0,done?0:(i-1)*.15,0]});
  add('box',[x,FLOOR+.529,z+.26],[.15,.018,.06],done?0x9fc6a0:0xd9b278,done?'patrol-kit-checked':'patrol-kit-pending',{patrolRun:inspection.run});
 }
 if(story.claimed){
  add('box',[-76,FLOOR+1.11,-14.735],[.24,.26,.018],0x91b982,'claimed-board-seal');
  add('octa',[-76,FLOOR+1.11,-14.721],[.13,.16,.023],0xe4d9ad,'claimed-board-mark');
 }
 return out;
}
function draw(out,sim){if(sim?.room!==ROOM)return;for(const r of parts(sim.state.earthExpedition,G.RealmEarthFieldcraft?.current(sim))){out[r.kind]?.push({p:r.p,s:r.s,c:r.c,...r.opt});}}
const api=Object.freeze({parts,draw});G.RealmEarthExpeditionArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
