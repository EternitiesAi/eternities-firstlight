/* Original read-only work props and ally projection, sharing the rule anchors. */
(function(G){'use strict';
const decor={cameraSolid:false,cutaway:false,rough:.88};
// These finite commissions use the same source anchors as their rules. Small
// working-side offsets keep those anchors and the authored body routes open.
// Their static before/after forms project records, never simulate a harvest.
function southWork(out,sim,d,r,step,complete,def){
 const y=step.y,state=!r.accepted?'unaccepted':complete?'recorded':'pending';
 const meta={...decor,appearanceOnly:true,trailQuest:d.id,trailStep:step.id,workState:state};
 const emit=(kind,p,s,c,part,opt={})=>out[kind].push({p,s,c,...meta,trailPart:part,...opt});
 const box=(x,yy,z,w,h,depth,c,part,opt)=>emit('box',[x,yy,z],[w,h,depth],c,part,opt);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
 const beam=(a,b,width,depth,c,part,caps=false)=>{
  const axis=unit(b.map((v,i)=>v-a[i])),length=Math.hypot(...b.map((v,i)=>v-a[i]));
  const side=unit(cross(Math.abs(axis[1])>.95?[1,0,0]:[0,1,0],axis)),back=cross(side,axis),p=a.map((v,i)=>(v+b[i])/2);
  const matrix=(at,w,h,dd)=>[...side.map(v=>v*w),0,...axis.map(v=>v*h),0,...back.map(v=>v*dd),0,...at,1];
  emit('box',p,[width,length,depth],c,part,{m:matrix(p,width,length,depth),workFrom:a,workTo:b});
  if(caps)for(const end of [a,b])emit('box',end,[width*.87,.008,depth*.87],0xd5b784,'wood-cut-face',{m:matrix(end,width*.87,.008,depth*.87)});
 };
 const tiedWood=(x,z,base,part)=>{
  for(const dz of [-.24,.24])box(x,base+.035,z+dz,.69,.07,.1,0x796348,'wood-spacer');
  for(let layer=0;layer<2;layer++)for(const dx of [-.2,0,.2])beam([x+dx,base+.16+layer*.18,z-.36],[x+dx,base+.16+layer*.18,z+.36],.18,.18,0x8e6f4d,part,true);
  for(const dz of [-.22,.22]){
   box(x,base+.447,z+dz,.66,.025,.038,0xb7a176,'wood-cord');
   for(const dx of [-.318,.318])box(x+dx,base+.255,z+dz,.027,.385,.038,0xb7a176,'wood-cord');
   box(x,base+.067,z+dz,.66,.025,.038,0xb7a176,'wood-cord');
  }
 };
 const reeds=(x,z,base,tied,small=false)=>{
  const height=small?.54:.93,n=small?4:6;
  for(let i=0;i<n;i++){
   const dx=(i%3-1)*.095,dz=(Math.floor(i/3)-.5)*.1,lean=tied?.025:(i%2?.11:-.08),tip=[x+dx+lean,base+height+(i%2)*.055,z+dz];
   beam([x+dx,base+(tied?.001:.003),z+dz],tip,.031,.035,i%2?0xb2ac72:0x84956b,'cut-reed-stem');
   emit('octa',[tip[0],tip[1]-.085,tip[2]],[.075,.15,.065],0x89784f,'reed-seed-head');
  }
  if(tied)for(const yy of [.22,height*.66]){
   box(x,base+yy,z,.33,.045,.2,0xb99c6a,'reed-binding');
   emit('octa',[x+.17,base+yy,z],[.07,.055,.07],0xb99c6a,'reed-knot');
  }
 };
 const stones=(x,z,base,sorted)=>{
  const pieces=sorted?[[-.2,0,.32],[.22,.04,.28]]:[[-.28,-.16,.29],[.12,-.21,.26],[.3,.12,.22],[-.13,.17,.25],[.02,.015,.34]];
  if(sorted)box(x,base+.028,z,.98,.056,.62,0x8d7959,'stone-sorting-board');
  for(const [dx,dz,h]of pieces)emit('octa',[x+dx,base+(sorted?.056:0)+h*.65,z+dz],[h*1.65,h,h*1.35],dx<0?0x9b9b8c:0xadb1a0,sorted?'sorted-shore-stone':'loose-shore-stone');
 };
 if(d.realm==='earthlands'){
  if(step.id==='fallen-bough'){
   const x=step.x+1.1,z=step.z;
   if(complete)tiedWood(x,z,y,'prepared-bough-piece');
   else{
    beam([x,y+.126,z-.7],[x+.04,y+.146,z+.7],.23,.25,0x756047,'fallen-bough-bole',true);
    for(const [a,b]of [[[x,y+.17,z-.18],[x+.48,y+.38,z-.55]],[[x+.025,y+.18,z+.16],[x-.35,y+.35,z+.55]]]){
     beam(a,b,.14,.16,0x6d5944,'fallen-bough-fork',true);emit('octa',a,[.18,.18,.18],0x756047,'bough-branch-joint');
    }
   }
  }else if(step.id==='shore-reeds')reeds(step.x+1.1,step.z,y,complete);
  else if(step.id==='shore-stone')stones(step.x+1.1,step.z,y,complete);
  else if(step.id==='road-pack'){
   const x=step.x-1.15,z=step.z;
   box(x,y+.045,z,1.25,.09,1.25,0x8f7956,'packing-tray');
   for(const dx of [-.59,.59])box(x+dx,y+.105,z,.07,.12,1.25,0x796449,'packing-tray-rim');
   if(complete){
    tiedWood(x-.23,z-.18,y+.09,'packed-bough-piece');reeds(x+.36,z-.27,y+.09,true,true);stones(x+.05,z+.3,y+.09,true);
    box(x,y+.55,z+.15,.9,.05,.05,0xbba47a,'load-lashing');
    box(x,y+.3,z+.15,.035,.55,.05,0xbba47a,'load-lashing');
    emit('disc',[x,y+.575,z+.15],[.16,.015,.16],r.claimed?0xcab477:0xc4d6bc,'packed-job-seal');
   }else{
    for(const dz of [-.18,.18])box(x,y+.102,z+dz,1.08,.024,.035,0xbda574,'unfastened-pack-cord');
   }
  }
  return;
 }
 const plate=(x,z,yy,old)=>{
  box(x,yy,z,.82,.56,.055,old?0x87948c:0xa99872,old?'old-masonry-plate':'bronze-depth-plate');
  for(const dx of [-.39,.39])box(x+dx,yy,z+.035,.04,.57,.035,old?0xb2b4a0:0xc5b17d,'depth-plate-edge');
  for(let i=0;i<(old?3:1);i++)box(x-.25+i*.16,yy,z+.04,.055,.28,.025,0xe0d1a8,'depth-scale-notch');
  if(complete){box(x+.22,yy-.16,z+.043,.17,.075,.025,0x91baa5,'copied-gauge-tab');emit('disc',[x+.26,yy-.16,z+.0563],[.07,.01,.07],0xd9c69c,'gauge-tab-pin',{r:[Math.PI/2,0,0]});}
 };
 if(step.id==='upper-gauge'){
  const x=step.x+1.25,z=step.z,yy=y+.64,top=G.RealmWorldFoundations.height(sim.room,x,z)-.11;
  box(x,top-.025,z,.14,.05,.12,0x8d967e,'deck-gauge-anchor',{workSupport:'deck-underside',supportY:top});
  beam([x,yy+.27,z],[x,top,z],.035,.035,0x7d8e80,'gauge-suspension');plate(x,z,yy,false);
 }else if(step.id==='lower-masonry'){
  const x=step.x+1.25,z=step.z,bed=def.dive.minY-.3,yy=y+.55;
  box(x,bed+.075,z,.45,.15,.4,0x7b8b84,'old-mark-foot',{workSupport:'gallery-bed',supportY:bed});
  beam([x,bed+.15,z],[x,yy-.26,z],.09,.1,0x78897f,'old-mark-upright');plate(x,z,yy,true);
 }else if(step.id==='depth-chart'){
  const x=step.x+1.75,z=step.z-1.1,base=def.dive.dryCourts.find(c=>c.id==='bellglass-air').floorY,tilt=.24;
  for(const dx of [-.47,.47])for(const dz of [-.29,.29])box(x+dx,base+.39,z+dz,.08,.78,.08,0x827557,'chart-desk-leg',{workSupport:'bellglass-air',supportY:base});
  box(x,base+.8,z,1.15,.08,.75,0xa89772,'chart-desk-top');
  const boardY=.84+Math.sin(tilt)*.38+Math.cos(tilt)*.0075,propTop=boardY+Math.sin(tilt)*.31-Math.cos(tilt)*.0075;
  for(const dx of [-.42,.42])box(x+dx,base+(.84+propTop)/2,z-Math.cos(tilt)*.31,.12,propTop-.84,.11,0x857653,'chart-board-prop');
  const onChart=(dx,dz,w,depth,c,part,offset=.03)=>box(x+dx,base+boardY+Math.cos(tilt)*offset-Math.sin(tilt)*dz,z+Math.sin(tilt)*offset+Math.cos(tilt)*dz,w,.015,depth,c,part,{r:[tilt,0,0],chartOffset:offset});
  onChart(0,0,1.08,.76,0x756b51,'chart-board',0);onChart(0,0,.98,.69,0xd0c4a0,'visitor-chart-paper',.015);
  const seen=id=>r.accepted&&r.steps.includes(id);
  if(seen('upper-gauge'))onChart(.28,-.23,.22,.1,0xb49b63,'upper-reading-slip');
  if(seen('lower-masonry'))onChart(.28,.23,.22,.1,0x859e98,'lower-reading-slip');
  if(complete){
   onChart(-.08,-.17,.58,.032,0xa58449,'charted-upper-layer');onChart(-.08,.17,.58,.032,0x527d78,'charted-lower-layer');
   onChart(-.27,0,.028,.308,0x697fa2,'charted-depth-connection');
   for(const dx of [.13,.29])onChart(dx,.0095,.035,.121,0x7f7253,'charted-court-doorway');
   onChart(.21,-.066,.19,.03,0x7f7253,'charted-court-doorway');
  }
 }else if(step.id==='modern-marker'){
  const x=step.x+.65,z=step.z,bed=def.dive.minY-.3,yy=y+.7;
  box(x,bed+.06,z,.17,.12,.24,0x85958b,'landing-marker-foot',{workSupport:'gallery-bed',supportY:bed});
  beam([x,bed+.12,z],[x,yy+.32,z],.06,.06,0x879b8d,'landing-marker-mast');
  box(x,yy,z,.06,.69,.72,0x658782,'landing-marker-frame');
  if(complete){
   const toward=Math.sign(def.dive.exit.z-z);
   // The filled support frame needs a fitted face on both sides. Preserve the
   // west geometry and the actual exit direction; never reflect the meaning.
   for(const sign of [-1,1]){
    const markerFace=sign<0?'west':'east';
    box(x+sign*.037,yy,z,.025,.55,.6,0xb7cab5,'fitted-landing-plate',{markerFace});
    box(x+sign*.055,yy,z,.015,.035,.4,0xefd5a0,'modern-route-arrow',{markerFace});
    for(const slope of [-1,1])box(x+sign*.055,yy+slope*.07,z+toward*.15,.015,.035,.2,0xefd5a0,'modern-route-arrow',{r:[toward*slope*Math.PI/4,0,0],towardExit:toward,markerFace});
   }
  }
 }
}
function draw(out,sim,t,art){
 const def=G.RealmWorldFoundations.definition(sim.room),realm=def?.id,d=G.RealmTrails.definitions().find(d=>d.realm===realm);if(!d)return;
 const r=sim.state.realmTrails.records[d.id],box=(x,y,z,w,h,depth,c,part)=>out.box.push({p:[x,y,z],s:[w,h,depth],c,...decor,trailPart:part,trailQuest:d.id}),octa=(x,y,z,s,c,part)=>out.octa.push({p:[x,y,z],s:[s,s,s],c,...decor,trailPart:part,trailQuest:d.id});
 for(const step of d.steps.filter(s=>s.kind==='interact'&&s.id!==d.escort?.startStep)){
  const complete=r.accepted&&r.steps.includes(step.id),c=complete?0x8ec3ad:realm==='hell'?0xc49868:realm==='heaven'?0xc4af7d:0xb0c9c3,y=step.y;
  if(step.instrument){
   const i=step.instrument,value=G.RealmTrails.setting(sim,d.id,step.id),bearing=p=>Math.atan2(p.x-step.x,p.z-step.z),ref=bearing(i.targets[1]),signed=Math.atan2(Math.sin(bearing(i.targets[0])-ref),Math.cos(bearing(i.targets[0])-ref)),angle=ref+Math.sign(signed)*value*Math.PI/180,target=ref+signed;
   box(step.x,y+.48,step.z,.17,.96,.17,0x6c6252,'sight-post');out.disc.push({p:[step.x,y+.96,step.z],s:[.9,.035,.9],c:0xaaa07c,...decor,trailPart:'sight-scale',trailQuest:d.id});
   for(const[a,c,part]of[[ref,0x927d59,'crown-arm'],[target,0xdac58e,'image-arm'],[angle,complete?0xa7cdb0:0x97c4cd,'comparator-arm']])out.box.push({p:[step.x+Math.sin(a)*.38,y+1.03,step.z+Math.cos(a)*.38],s:[.055,.055,.76],r:[0,a,0],c,...decor,trailPart:part,trailQuest:d.id,setting:value});
   for(let n=0;n<4;n++){const a=ref+n*Math.PI/6;box(step.x+Math.sin(a)*.43,y+.99,step.z+Math.cos(a)*.43,.05,.055,.05,0xcdbd91,'scale-notch');}
  }else if(realm==='heaven'){
   if(step.id==='garden-repair'){box(step.x,y+.12,step.z,.9,.24,.6,c,'repaired-instrument');for(let i=0;i<3;i++)box(step.x-.28+i*.28,y+.3,step.z,.08,.2+i*.07,.48,complete?0xc4ddd0:0x73695a,'instrument-key');out.box.push({p:[step.x,y+.48,step.z-.1],s:[.8,.06,.1],r:[0,0,complete&&!sim.state.settings.reducedMotion ? .22*Math.sin(t*.9) : 0],c:complete?0xd3c294:0x766b57,...decor,trailPart:'garden-return-arm',trailQuest:d.id});}
   else{box(step.x,y+.22,step.z,.9,.44,.9,0xb5aa91,'relay-base');box(step.x,y+.7,step.z,.2,.6,.2,0x947b55,'relay-lever');octa(step.x,y+1.05,step.z,.22,c,'relay-state');const notches={'relay-west':1,'relay-east':2,'relay-crown':3}[step.id]||0;for(let n=0;n<notches;n++)box(step.x+(n-(notches-1)/2)*.2,y+.28,step.z+.46,.08,.2,.025,0x574f42,'relay-notch');}
  }else if(realm==='hell'){
   if(step.id.includes('contact'))continue;
   box(step.x,y+.2,step.z,1.1,.4,.8,0x494b49,'route-clamp');box(step.x,y+.58,step.z,.16,.5,.18,0x989587,'clamp-handle');box(step.x,y+.7,step.z,.75,.12,.16,c,'safety-bar');
  }else if(realm==='atlantis'||realm==='earthlands'){
   southWork(out,sim,d,r,step,complete,def);
  }else if(realm==='cosmos'){
   box(step.x,y+.38,step.z,.65,.76,.7,0x74756b,'service-stand');box(step.x,y+.81,step.z,.9,.12,.65,complete?0xcac19b:0x907d60,'split-scale-fitting');
  }else{
   box(step.x,y+.15,step.z,1.15,.3,.55,step.id.includes('stone')?0xa8a49a:0xa78b5f,'job-supply');box(step.x,y+.32,step.z,.12,.12,.58,c,'supply-binding');
  }
  if(r.accepted&&!complete&&step.requires.every(id=>r.steps.includes(id)))out.disc.push({p:[step.x,y+.025,step.z],s:[.65,1,.65],c:0xd5bd86,...decor,trailPart:'action-ring',trailQuest:d.id});
 }
 if(d.escort){const actor=G.RealmTrails.escort(sim)||{x:-36,z:-102,yaw:0,walking:false,status:'At the open cage'};
  art.person(out,actor.x,actor.z,actor.yaw||0,0x9eb29f,sim.state.settings.reducedMotion?0:t,actor.walking,'traveler',false,1.57);
  box(actor.x,3.75,actor.z,.12,.12,.12,r.steps.includes(d.escort.arrivalStep)?0x9dd5ad:0xe9cd99,'neris-marker');
  if(!r.steps.includes(d.escort.startStep)){box(-37.15,2.72,-102,.14,2.3,.14,0x78746a,'open-cell-post');box(-34.85,2.72,-102,.14,2.3,.14,0x78746a,'open-cell-post');box(-36,3.85,-102,2.45,.16,.16,0x8c8372,'open-cell-frame');}
 }
 if(d.enemy){
  const live=G.RealmAdventure.runtime(sim).enemies.find(e=>e.id===d.enemy.id&&e.hp>0),dead=r.steps.includes(d.enemy.defeatStep);
  if(!live){const p=d.enemy,y=G.RealmWorldFoundations.height(sim.room,p.x,p.z);box(p.x,y+(dead?.18:.35),p.z,dead?1.05:.75,dead?.36:.7,.7,dead?0x666d68:0x918c78,dead?'folded-service-core':'dormant-service-core');octa(p.x,y+(dead?.32:.8),p.z,.18,dead?0x727a70:0xc8af75,'service-bearing');}
  else if(d.realm==='heaven'){const y=G.RealmWorldFoundations.height(sim.room,live.x,live.z),open=G.RealmTrails.canDamage(sim,live);octa(live.x,y+1.7,live.z,.23,open?0xabe3bc:0xd0b275,open?'exposed-bearing':'closed-bearing');box(live.x,y+1.3,live.z+.34,.48,.48,.055,open?0x7fbc9d:0x857556,'bearing-socket');}
 }
 if(realm==='heaven'&&r.steps.includes('garden-repair')){for(let i=0;i<3;i++)octa(-.4+i*.4,2.02,-1,.08,0xc6dfbd,'restored-note');}
 if(r.accepted&&r.claimed)box(d.giver.x+.85,1.61,d.giver.z,.6,.06,.42,0xd0c3a2,'completed-record');
}
G.RealmTrailsArt={draw};if(typeof module!=='undefined')module.exports=G.RealmTrailsArt;
})(globalThis);
