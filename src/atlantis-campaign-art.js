/* Appearance-only Farwake apparatus. The rule owner owns witnesses, currents,
 * health, locked support/cover frames and saved facts. No collision or payout. */
(function(G){'use strict';
const FLOOR=1.57;
const C={ink:0x263d43,copper:0xb27548,patina:0x408b84,glass:0x9cd4d2,cream:0xe9d6ae,red:0x9c5148,gold:0xf1be77,dark:0x483946};
const finite=(...v)=>v.every(Number.isFinite),D=()=>G.RealmAtlantisCampaign?.definition||G.RealmAtlantisCampaignData.definition;
const data=()=>G.RealmAtlantisCampaignData,record=sim=>sim.state.atlantisCampaign;
function paint(out,sim,a,yaw=0,tags={}){
 const M=G.RealmEngine.M,base=a.y??G.RealmWorldFoundations.height(sim.room,a.x,a.z),root=M.compose(a.x,base,a.z,1,1,1,0,yaw,0);
 const emit=(kind,p,s,c,part,opt={})=>out[kind].push({p:M.transform(root,p),s:s.slice(),m:M.mul(root,M.compose(...p,...s,...(opt.r||[0,0,0]))),c,rough:.85,cameraSolid:false,cutaway:false,appearanceOnly:true,atlantisCampaignPart:part,...tags,...opt});
 return{root,base,emit,box:(x,y,z,w,h,d,c,part,opt)=>emit('box',[x,y,z],[w,h,d],c,part,opt)};
}
function station(out,sim,s){
 const r=record(sim),done=r.steps.includes(s.id),wet=s.medium==='water'||s.medium==='court';
 // East-lane fittings sit inward of the existing gallery volume. Their
 // smaller visual frames leave the action anchor and swimmer body clear.
 const side=wet&&s.x>11?-.82:.82;
 const p=paint(out,sim,{x:s.x+side,z:s.z,y:wet?s.y+(s.medium==='court'?.001:0):undefined},0,{atlantisCampaignFixture:s.id,atlantisCampaignMedium:s.medium,atlantisCampaignFeetY:s.y,atlantisCampaignRecorded:done});
 p.box(0,.22,0,.40,.44,.27,C.ink,'municipal-control-pedestal');p.box(0,.46,0,.45,.07,.31,C.copper,'municipal-control-bridge');
 p.box(0,.58,0,.33,.18,.18,C.glass,done?'recorded-pressure-window':'unrecorded-pressure-window');
 for(const z of[-.12,.12])p.box(0,.58,z,.24,.07,.035,done?C.patina:C.red,done?'checked-pressure-notch':'unresolved-pressure-notch');
 p.box(.16,.39,.19,.11,.18,.09,C.copper,'manual-pressure-grip');
}
function depthMarker(out,sim,s){
 const r=record(sim),selected=D().approaches.find(a=>a.id===r.approach)?.requiredObservation===s.id;
 const p=paint(out,sim,{x:s.x-.80,y:s.y,z:s.z},0,{atlantisCampaignFixture:s.id,atlantisCampaignMedium:'water',atlantisCampaignFeetY:s.y,atlantisCampaignSelectedReading:selected});
 p.box(0,.40,0,.08,.80,.12,C.copper,'depth-gauge-spine');p.box(0,.49,.09,.38,.46,.06,C.ink,'depth-gauge-face');
 for(let i=0;i<3;i++)p.box(0,.33+i*.15,.13,.26,.025,.025,i===1?(selected?C.gold:C.glass):C.cream,'rated-depth-tick');
 p.box(.20,.49,0,.08,.16,.19,r.steps.includes(s.id)?C.patina:C.red,'reading-status-tab');
}
function currentBands(out,sim){
 const c=data().current,r=record(sim);if(!r.steps.includes(c.startStep))return;
 const live=G.RealmAtlantisCampaign?.currentStatus?.(sim),active=live?.active===true;
 const p=paint(out,sim,{x:c.x,z:c.z,y:0},0,{atlantisCampaignFixture:'rated-current-band',atlantisCampaignCurrent:active,atlantisCampaignMinY:c.minY,atlantisCampaignMaxY:c.maxY});
 // Bounds and direction are catalogue markings, not displacement authority.
 for(const y of[c.minY+.015,c.maxY-.015]){
  for(const x of[-c.w/2+.025,c.w/2-.025])p.box(x,y,0,.05,.028,c.d,C.ink,'shallow-band-side');
  for(const z of[-c.d/2+.025,c.d/2-.025])p.box(0,y,z,c.w,.028,.05,C.glass,'shallow-band-end');
 }
 if(active)for(let i=0;i<3;i++){
  const z=-c.d/2+1.2+i*1.9,y=(c.minY+c.maxY)/2;
  p.box(0,y,z,.055,.03,.62,C.glass,'owned-current-direction');
  for(const x of[-.10,.10])p.box(x,y,z-.26,.045,.03,.27,C.copper,'owned-current-arrow',{r:[0,x<0?.7:-.7,0]});
 }
}
function receipt(out,sim,anchor,fixture){
 const r=record(sim),choice=r.steps.includes('disposition')&&D().choices.some(c=>c.id===r.choice)?r.choice:null;
 const p=paint(out,sim,anchor,0,{atlantisCampaignFixture:fixture,atlantisCampaignChoice:choice});
 p.box(0,.35,0,.52,.70,.34,C.ink,'receipt-stand');p.box(0,.73,0,.59,.06,.42,C.copper,'receipt-top');
 for(const z of[-.23,.23]){p.box(0,.65,z,.43,.28,.035,C.cream,'complete-account-sheet');for(const x of[-.13,.13])p.box(x,.66,z*1.09,.08,.13,.025,C.patina,'retained-conflicting-receipt');}
 if(choice==='publish')for(const x of[-.22,.22]){p.box(x,.88,0,.10,.23,.12,C.glass,'paired-checked-outlet');p.box(x,.97,0,.12,.025,.14,C.patina,'public-check-cap');}
 if(choice==='limited'){p.box(0,.86,0,.49,.15,.38,C.copper,'reviewed-custody-hood');p.box(.24,.48,.10,.15,.16,.11,C.glass,'independent-manual-indicator');}
 if(choice==='license'){p.emit('octa',[0,.92,0],[.26,.25,.20],C.copper,'personal-permit-seal');p.box(.25,.92,0,.08,.22,.20,C.red,'retained-outer-claim-marker');}
}
function body(out,sim,a,yaw,tags,settled=false,mode='idle'){
 const p=paint(out,sim,a,yaw,tags),colour=settled?C.patina:C.copper;
 p.box(0,.07,0,1.04,.14,.91,C.ink,'custodian-grounded-bed');
 for(const x of[-.32,.32])for(const z of[-.27,.27])p.box(x,.19,z,.20,.24,.24,colour,'custodian-supported-foot');
 p.box(0,.43,0,.78,.43,.65,colour,'custodian-connected-chassis');p.box(0,.68,0,.85,.08,.71,C.ink,'custodian-glass-seat');
 p.emit('round',[0,.83,0],[.65,.30,.54],C.glass,'custodian-glass-bearing');
 p.box(0,.99,0,.52,.08,.45,colour,'custodian-bearing-crosshead');
 for(const x of[-.43,.43]){p.box(x,.48,0,.09,.40,.22,C.patina,'custodian-side-pipe');p.box(x*.7,.67,0,.30,.065,.12,colour,'custodian-pipe-connection');}
 for(const x of[-.29,.29]){p.box(x,.54,.36,.13,.20,.18,colour,'custodian-vane');p.box(x,.64,.31,.16,.05,.23,C.ink,'custodian-vane-bracket');}
 p.emit('disc',[0,.46,.39],[.40,.055,.40],C.ink,'custodian-intake-ring',{r:[Math.PI/2,0,0]});
 p.emit('disc',[0,.46,.425],[.25,.025,.25],mode==='windup'?C.gold:C.patina,'custodian-intake-mouth',{r:[Math.PI/2,0,0]});
 p.box(0,.94,.24,.22,.10,.12,settled?C.patina:mode==='windup'?C.gold:C.red,settled?'settled-bearing-tab':'custodian-phase-tab');
 return p;
}
function pairedLine(p,x,z,length,width,yaw,part){
 p.box(x,.145,z,width,.03,length,C.dark,part+'-border',{r:[0,yaw,0],em:.10});
 p.box(x,.164,z,width*.38,.016,length*.98,C.gold,part+'-inlay',{r:[0,yaw,0],em:.30});
}
function warning(out,sim,e,s){
 const p=paint(out,sim,s,s.yaw,{atlantisCampaignActor:e.id,atlantisCampaignTelegraph:true,atlantisCampaignPattern:s.kind,atlantisCampaignStrike:{...s}});
 if(s.kind==='intake'){
  const l=s.length,w=s.halfWidth;if(!finite(l,w)||l<=0||w<=0)return;
  const t=Math.min(.07,w*.16,l*.12);
  for(const x of[-w+t/2,w-t/2])pairedLine(p,x,l/2,l,t,0,'locked-intake-edge');
  for(const z of new Set([t/2,l-t/2]))pairedLine(p,0,z,2*w,t,Math.PI/2,'locked-intake-cap');
  if(l>.15)for(let i=1;i<=3;i++){const z=l*i/4;pairedLine(p,0,z,Math.min(.18,l/6),Math.min(.045,w*.1),0,'locked-intake-direction');}
 }else if(s.kind==='sweep'){
  const r=s.radius,ha=s.halfAngle;if(!finite(r,ha)||r<=0||ha<=0||ha>Math.PI)return;
  const n=16,t=Math.min(.055,r*.045),rr=r-t*2,pad=Math.min(ha*.12,t*2/(r||1)),lo=-ha+pad,hi=ha-pad;
  for(let i=0;i<n;i++){
   const a=lo+(hi-lo)*i/n,b=lo+(hi-lo)*(i+1)/n,x1=Math.sin(a)*rr,z1=Math.cos(a)*rr,x2=Math.sin(b)*rr,z2=Math.cos(b)*rr;
   pairedLine(p,(x1+x2)/2,(z1+z2)/2,Math.hypot(x2-x1,z2-z1),t,Math.atan2(x2-x1,z2-z1),'locked-sweep-arc');
  }
  // Keep the inner corners away from the angle boundary as well as the arc.
  // This margin survives the renderer's Float32 world transform for tiny locks.
  const inner=Math.max(t*2,1.2*t/(2*Math.tan(pad))),length=Math.max(0,rr-inner);
  for(const a of[lo,hi])if(length>0)pairedLine(p,Math.sin(a)*(inner+length/2),Math.cos(a)*(inner+length/2),length,t,a,'locked-sweep-side');
 }
}
function drawEnemy(out,sim,e,time){
 const d=D(),r=record(sim);if(sim.room!==d.room||sim.worldDive||!r?.accepted||e?.id!==d.enemy.id||e.atlantisCampaign!==d.id||!d.enemy.spawnAfter.every(id=>r.steps.includes(id))||r.steps.includes(d.enemy.defeatStep)||!G.RealmAdventure.runtime(sim).enemies.includes(e)||!finite(e.x,e.z,e.yaw??0,e.hp)||e.hp<=0)return false;
 const p=body(out,sim,{x:e.x,z:e.z},e.yaw??0,{atlantisCampaignActor:e.id},false,e.mode);
 if((e.mode==='windup'||e.mode==='intake'&&e.strike?.kind==='intake')&&e.strike&&finite(e.strike.x,e.strike.z,e.strike.yaw))warning(out,sim,e,e.strike);
 return{actor:e.id,x:e.x,z:e.z,yaw:e.yaw??0,base:p.base,root:Array.from(p.root),mode:e.mode};
}
function drawWitness(out,sim,e,time){
 const d=D(),r=record(sim),w=d.witnesses.find(w=>w.id===e?.id),owned=G.RealmAtlantisCampaign?.runtime(sim).witnesses;
 if(sim.room!==d.room||!r?.accepted||!w||e.atlantisCampaign!==d.id||!Array.isArray(owned)||!owned.includes(e)||!w.appearsAfter.every(id=>r.steps.includes(id))||!finite(e.x,e.z,e.yaw??0))return false;
 const p=paint(out,sim,{x:e.x,z:e.z},e.yaw??0,{atlantisCampaignWitness:e.id}),clerk=w.id==='atlantis-ilyra-v1',coat=clerk?C.ink:C.patina;
 for(const x of[-.11,.11]){p.box(x,.09,.025,.15,.18,.27,C.ink,'witness-grounded-foot');p.box(x,.36,0,.10,.39,.15,coat,'witness-leg');}
 p.box(0,.71,0,.34,.31,.28,coat,'witness-coat-hem');p.box(0,1.03,0,.30,.35,.24,coat,'witness-coat');
 for(const x of[-.19,.19])p.box(x,1.0,.035,.09,.30,.14,coat,'witness-sleeve');
 p.box(0,1.25,0,.08,.10,.10,C.cream,'witness-neck');p.emit('round',[0,1.42,0],[.26,.28,.25],C.cream,'witness-head');p.box(0,1.56,0,.29,.08,.27,clerk?C.red:C.copper,'witness-work-cap');
 p.box(0,.97,.19,.28,.19,.06,clerk?C.cream:C.copper,clerk?'ilyra-whole-receipt-folder':'damar-load-account');
 return{actor:e.id,x:e.x,z:e.z,yaw:e.yaw??0,base:p.base,root:Array.from(p.root)};
}
function draw(out,sim,time){
 const d=D(),r=record(sim);if(sim.room!==d.room||!r?.accepted)return;
 const by=id=>d.steps.find(s=>s.id===id);
 receipt(out,sim,{x:1,z:-18},'registry-record');
 if(r.steps.includes('choose-approach')){for(const id of['upper-reading','lower-reading'])depthMarker(out,sim,by(id));currentBands(out,sim);}
 if(r.steps.includes('choose-approach'))for(const id of['manual-bypass','equalizer-set'])station(out,sim,by(id));
 if(r.steps.includes('diagnose-flow'))for(const id of data().pressure.stages.filter(id=>id!=='equalizer-set'))station(out,sim,by(id));
 if(r.steps.includes('bearing-exposed')){for(const id of['release-west','release-east'])station(out,sim,by(id));body(out,sim,d.enemy,0,{atlantisCampaignFixture:'settled-custodian'},true);}
 if(r.steps.includes('outlet-set'))receipt(out,sim,{x:13,z:-40.1},'landing-record');
 const seen=new Set();for(const e of G.RealmAtlantisCampaign?.runtime(sim).witnesses||[])if(!seen.has(e.id)){seen.add(e.id);drawWitness(out,sim,e,time);}
}
const api={draw,drawEnemy,drawWitness,FLOOR};G.RealmAtlantisCampaignArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
