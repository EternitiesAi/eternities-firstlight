/* Original read-only work props and ally projection, sharing the rule anchors. */
(function(G){'use strict';
const decor={cameraSolid:false,cutaway:false,rough:.88};
function draw(out,sim,t,art){
 const realm=G.RealmWorldFoundations.definition(sim.room)?.id,d=G.RealmTrails.definitions().find(d=>d.realm===realm);if(!d)return;
 const r=sim.state.realmTrails.records[d.id],box=(x,y,z,w,h,depth,c,part)=>out.box.push({p:[x,y,z],s:[w,h,depth],c,...decor,trailPart:part,trailQuest:d.id}),octa=(x,y,z,s,c,part)=>out.octa.push({p:[x,y,z],s:[s,s,s],c,...decor,trailPart:part,trailQuest:d.id});
 for(const step of d.steps.filter(s=>s.kind==='interact'&&s.id!==d.escort?.startStep)){
  const complete=r.steps.includes(step.id),c=complete?0x8ec3ad:realm==='hell'?0xc49868:realm==='heaven'?0xc4af7d:0xb0c9c3,y=step.y;
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
  }else if(realm==='atlantis'){
   box(step.x-.5,y+.5,step.z,.12,1,.12,0x4e7371,'depth-post');box(step.x,y+.62,step.z,.9,.55,.05,c,'depth-plate');for(let i=0;i<3;i++)box(step.x-.28+i*.26,y+.63,step.z+.04,.055,.25,.018,0xf1dfb1,'depth-notch');
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
 if(r.claimed)box(d.giver.x+.85,1.61,d.giver.z,.6,.06,.42,0xd0c3a2,'completed-record');
}
G.RealmTrailsArt={draw};if(typeof module!=='undefined')module.exports=G.RealmTrailsArt;
})(globalThis);
