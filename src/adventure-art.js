/* Procedural cave and chapter artwork. Read-only projection of game state. */
(function(G){'use strict';const A=G.RealmAdventure,TAU=Math.PI*2;
const companionSamples=new WeakMap(),companionFrames=new WeakMap(),skitterSamples=new WeakMap(),skitterFrames=new WeakMap(),bruteSamples=new WeakMap();
function support(sim,x,z){
 if(G.RealmWorldFoundations?.handles(sim.room))return G.RealmWorldFoundations.height(sim.room,x,z);
 if(sim.room===G.RealmEarth?.ROOM)return G.RealmEarth.height(x,z);
 if(sim.room===G.RealmCosmos?.ROOM)return G.RealmCosmos.height(x,z);
 return sim.room?1.58:1.31;
}
function entrance(a){const x=A.MINE.x,z=A.MINE.z;
 for(const s of[-1,1]){a.box(x+s*1.8,3,z-.8,1.1,3.5,1.4,0x697c77);a.box(x+s*1.65,3,z+.03,.22,3.15,.28,0xa59f7d);}
 a.box(x,4.65,z-.6,4.6,.62,1.8,0x8b978b);a.box(x,2.9,z-1,2.5,2.7,.13,0x1e3440);a.add('octa',x,4.7,z+.35,.52,.82,.14,0xb2d9d4,{em:.55});a.lamp(-2.7,z+1.3,2.2);a.lamp(2.7,z+1.3,2.2);
 for(let i=0;i<4;i++)a.box(x,1.3+i*.025,z+1.7-i*.42,2.35,.09,.35,0xb5b39b,{wet:1});}
function cave(a,sim){a.begin('mine');a.e.theme='underways';a.e.ambientOverride=.38;a.box(0,-.1,0,33,2.6,31,0x192b34);const rng=G.RealmCore.rng(6606);
 for(let gx=-7;gx<=7;gx++)for(let gz=-7;gz<=7;gz++){let p=A.cellPoint(gx,gz);a.box(p.x,1.35,p.z,1.98,.30,1.98,[0x536967,0x5c706c,0x62766c,0x526a6b][Math.floor(rng()*4)],{wet:1,rough:.7});if(Math.abs(gx)===7||Math.abs(gz)===7){a.add('octa',p.x,2.2,p.z,2.7,2.1+rng()*2,2.4,0x344a53);a.add('octa',p.x+.1,3.1,p.z-.2,1.8,1.5,2,0x48636a);}}
 for(const z of[8,-1,-8])for(const sign of[-1,1]){let x=sign*(z===-8?11.8:2.3);a.box(x,2.7,z,.36,2.5,.6,0x968971);a.box(x,4,z,.65,.25,.87,0xb6ab87);}
 for(const z of[8,-1]){a.box(0,4.15,z,5.5,.24,.48,0x7c806c);a.add('octa',0,4.2,z+.3,.25,.6,.2,0xe2c18d,{em:.45});}
 a.box(0,1.55,11.5,3.1,.04,1.25,0xbaa77d);a.lamp(-2,10.5,2.5,1.48);a.lamp(2,10.5,2.5,1.48);for(let i=0;i<3;i++)a.box(0,1.59,10.8+i*.3,.6-i*.12,.035,.07,0xf3d49a,{em:.7});
 for(let z=8;z>-8;z-=.9){for(const x of[-.58,.58])a.box(x,1.56,z,.055,.055,.88,0xa2aaa2);a.box(0,1.51,z,1.55,.05,.11,0x685e49);}
 a.box(2.7,1.9,7.9,1.5,.65,1.7,0x847657);a.box(2.7,2.36,7.9,1.63,.12,1.83,0xaea181);for(const x of[2.05,3.35])for(const z of[7.3,8.5])a.add('cylinder',x,1.6,z,.3,.3,.3,0x373f42,{r:[Math.PI/2,0,0]});
 for(let i=0;i<11;i++){let u=i*2.4;a.add('octa',-8+Math.sin(u)*1.7,1.65,2+Math.cos(u)*1.2,.3,.5,.3,i%2?0x9baf7d:0x8ca7ad,{em:.13});}a.box(-8.7,1.66,2.65,1.2,.12,1.1,0x93806b);
 a.add('cylinder',9,1.48,-10,3.1,.38,3.1,0x788d87);a.add('cylinder',9,1.86,-10,2.5,.13,2.5,0xb6baa0);for(let i=0;i<22;i++){let t=i/22*TAU;a.box(9+Math.cos(t)*1.05,2.015,-10+Math.sin(t)*1.05,.12,.04,.08,0xe9cd91,{r:[0,-t,0],em:.35});}
 for(const[x,z]of[[4,-10],[12,-6],[12,-12],[-10,0],[-4,11]])for(let i=0;i<5;i++)a.add('octa',x+Math.sin(i*2.4)*.6,1.8+i%2*.35,z+Math.cos(i*2.4)*.6,.38,.9+i%3*.4,.4,i%2?0x94bbd2:0xabb3d8,{em:.45,rough:.2});
 for(let i=0;i<20;i++)a.box(-13+i*1.3,2+Math.sin(i)*.2,-13.1+Math.sin(i)*.22,1.5,.18,.24,0x786b56,{r:[0,Math.sin(i)*.4,.1]});a.commit();}
function draw(out,sim,t){let s=sim.state.adventure;if(!s)return;companionFrames.delete(sim);skitterFrames.set(sim,[]);let r=A.runtime(sim),p=sim.state.player,base=sim.room===G.RealmCosmos?.ROOM?G.RealmCosmos.height(p.x,p.z):sim.room?1.58:1.31;
 const add=(kind,x,y,z,w,h,d,c,opt={})=>out[kind].push({p:[x,y,z],s:[w,h,d],c,...opt}),box=(x,y,z,w,h,d,c,opt={})=>add('box',x,y,z,w,h,d,c,opt);
 const ring=(x,z,radius,c,y=1.58)=>{for(let i=0;i<32;i++){let a=i/32*TAU;box(x+Math.sin(a)*radius,y,z+Math.cos(a)*radius,.10,.04,.19,c,{r:[0,a,0],em:.75});if(i%8===0)box(x+Math.sin(a)*radius*.73,y+.03,z+Math.cos(a)*radius*.73,.12,.04,.35,c,{r:[0,a,0],em:.55});}};
 if(sim.room==='mine'){
  for(let gx=-6;gx<=6;gx++)for(let gz=-6;gz<=6;gz++){if(A.isFloor(s,gx,gz))continue;const pos=A.cellPoint(gx,gz),ore=A.mineral(gx,gz),chip=s.chips.find(c=>c.id===A.key(gx,gz)),h=chip?.hp===1?1.05:1.6;box(pos.x,1.49+h/2,pos.z,1.92,h,1.92,ore?0x696b68:0x495b60,{rough:.9,cameraSolid:true});add('octa',pos.x+.19,1.55+h,pos.z-.04,1.83,.51,1.85,ore?0xa18162:0x6b7f7b);if(ore)for(let j=0;j<3;j++)add('octa',pos.x+Math.sin(j*2.3)*.57,2+h*.22,pos.z+Math.cos(j*2.3)*.91,.34,.39,.22,0xe1ae7b,{em:.20});}
 }
 if(A.combatScene(sim)){
  for(const e of r.enemies){if(e.hp<=0||e.kind==='practice'||e.eventEnemy||e.custom==='bell')continue;const starts=Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.length]));let flash=e.flash>s.elapsed,body=flash?0xf8e4b9:e.kind==='boss'?0x688f83:e.kind==='sentinel'?0x9e92b8:e.custom==='river-bristle'?0x866747:0x7e8670;
   const terms=G.RealmEarthExpedition,rootBank=!!terms?.encounter(e);
   if(rootBank){
    const motion=G.RealmTravelerArt.motion(bruteSamples.get(e),{x:e.x,z:e.z,time:s.elapsed,scene:sim.room,paused:sim.paused,reducedMotion:sim.state.settings.reducedMotion,walking:['pursue','return'].includes(e.mode)});bruteSamples.set(e,motion);
    const reducedMotion=sim.state.settings.reducedMotion,hitAge=s.elapsed-(e.hitAt??-9),recoil=!reducedMotion&&hitAge>=0&&hitAge<.18?(1-hitAge/.18)*.12:0;
    const divisor=e.hitFrom?Math.hypot(e.x-e.hitFrom.x,e.z-e.hitFrom.z)||1:1;
    G.RealmEarthExpeditionBeastArt.draw(out,{x:e.x+(e.hitFrom?(e.x-e.hitFrom.x)/divisor*recoil:0),z:e.z+(e.hitFrom?(e.z-e.hitFrom.z)/divisor*recoil:0),base:support(sim,e.x,e.z),yaw:e.yaw,mode:e.mode,timer:e.timer,windup:e.windup,recovery:e.recovery,aim:e.aim,flash,reducedMotion,time:s.elapsed,paused:sim.paused,phase:motion.phase,blend:motion.blend,contactAge:s.elapsed-(e.contactAt??-9)});
   }
   else if(e.kind==='skitter'){
    const named=e.custom==='river-bristle',motion=G.RealmSkitterArt.motion(skitterSamples.get(e),{x:e.x,z:e.z,time:s.elapsed,scene:sim.room,paused:sim.paused,reducedMotion:sim.state.settings.reducedMotion});
    const pose=G.RealmSkitterArt.pose({...motion,named,mode:['pursue','return'].includes(e.mode)?'chase':e.mode,timer:e.timer,windup:e.windup??.75,recoverDuration:e.recovery??1.1});
    const amount=sim.state.settings.reducedMotion?0:Math.max(0,1-(s.elapsed-(e.hitAt??-9))/.18)*.12,divisor=e.hitFrom?Math.hypot(e.x-e.hitFrom.x,e.z-e.hitFrom.z)||1:1;
    const placement={x:e.x,z:e.z,base:support(sim,e.x,e.z),yaw:e.yaw,named,bodyColor:body,flash,recoil:e.hitFrom?{x:(e.x-e.hitFrom.x)/divisor*amount,z:(e.z-e.hitFrom.z)/divisor*amount}:{x:0,z:0}};
    const parts=G.RealmSkitterArt.parts(placement,pose);for(const {kind,...item} of parts)out[kind].push(item);
    skitterSamples.set(e,motion);skitterFrames.get(sim).push({id:e.id,placement,motion,pose,parts});
   }
   else if(e.kind==='sentinel'){add('octa',e.x,2.7+Math.sin(t*1.8)*.14,e.z,1.2,1.9,1.2,body,{r:[0,t*.25,0],rough:.25});for(let i=0;i<4;i++){let a=i*1.57+t*.65;add('octa',e.x+Math.sin(a)*.9,2.6,e.z+Math.cos(a)*.9,.20,.65,.20,0xddc59b,{em:.9});}}
   else if(e.kind==='charger'){add('round',e.x,2.55,e.z,2.2,1.8,2.8,body);add('octa',e.x,2.8,e.z+1.15,1.3,1.1,1.2,0xb6a480);for(const sign of[-1,1]){add('round',e.x+sign*.9,3.2,e.z+.9,.55,.83,.78,0xd8c8a0);box(e.x+sign*.65,1.95,e.z+.65,.32,1,.37,0x68634e);box(e.x+sign*.65,1.95,e.z-.85,.32,1,.37,0x68634e);add('round',e.x+sign*.30,3.03,e.z+1.67,.10,.10,.08,0xf5c188,{em:1});}for(let i=0;i<5;i++)add('octa',e.x,3.1,e.z-.9+i*.35,.42,.7,.42,0xc79874,{em:.22});}
   else{add('round',e.x,2.75,e.z,1.85,1.7,2.7,body);add('octa',e.x,3.48,e.z+1.05,.91,1.4,.85,body);for(const dx of[-.64,.64])for(const dz of[-.72,.75])box(e.x+dx,2,e.z+dz,.26,1.3,.3,0x55796e,{r:[Math.sin(t*2+dx+dz)*.08,0,0]});for(const sign of[-1,1]){box(e.x+sign*.48,4.35,e.z+.98,.15,1.7,.15,0xccbf96,{r:[0,0,-sign*.40]});for(let j=0;j<3;j++)box(e.x+sign*(.56+j*.18),4.12+j*.43,e.z+1,.56,.11,.12,0xe0cda1,{r:[0,0,sign*.2]});}for(let i=0;i<5;i++)add('octa',e.x+Math.sin(i*2.1)*.6,3.25,e.z-.8+i*.35,.36,.75,.36,e.hp<e.maxHP/2?0xc392bc:0xabc5bb,{em:.45});for(const dx of[-.26,.26])add('round',e.x+dx,3.6,e.z+1.48,.13,.13,.13,0xf2dab0,{em:1});}
   // Confirmed-hit recoil and the named beast silhouette affect art only.
   if(e.kind!=='skitter'&&!rootBank){
   const named=e.custom==='river-bristle',scale=named?1.32:1,recoil=sim.state.settings.reducedMotion?0:Math.max(0,1-(s.elapsed-(e.hitAt??-9))/.18)*.12,rd=e.hitFrom?Math.hypot(e.x-e.hitFrom.x,e.z-e.hitFrom.z)||1:1;
   if(named)for(let i=0;i<5;i++)add('octa',e.x,2.52,e.z-.45+i*.19,.18,.40,.2,0xcbb47e);
   for(const[k,items]of Object.entries(out))for(let j=starts[k];j<items.length;j++){const item=items[j];item.p[0]=e.x+(item.p[0]-e.x)*scale;item.p[1]=1.58+(item.p[1]-1.58)*scale;item.p[2]=e.z+(item.p[2]-e.z)*scale;item.s=item.s.map(v=>v*scale);}
   // Rotate body parts around the actual yaw, not warnings or health bars.
   for(const[k,items]of Object.entries(out))for(let j=starts[k];j<items.length;j++){const item=items[j],dx=item.p[0]-e.x,dz=item.p[2]-e.z;item.p[0]=e.x+dx*Math.cos(e.yaw)+dz*Math.sin(e.yaw);item.p[2]=e.z-dx*Math.sin(e.yaw)+dz*Math.cos(e.yaw);if(e.hitFrom){item.p[0]+=(e.x-e.hitFrom.x)/rd*recoil;item.p[2]+=(e.z-e.hitFrom.z)/rd*recoil;}item.r=[item.r?.[0]||0,(item.r?.[1]||0)+e.yaw,item.r?.[2]||0];}
   }
   if(sim.presentation?.attackTarget===e.id)ring(e.x,e.z,e.kind==='charger'?1.35:.8,0xf1d29a);
   if(e.kind==='charger'&&e.mode==='windup'){for(let j=0;j<18;j++)for(const sign of[-1,1]){let u=j*.5,dx=e.chargeDir.x,dz=e.chargeDir.z;box(e.x+dx*u+dz*.9*sign,1.63,e.z+dz*u-dx*.9*sign,.10,.045,.25,0xe5a5b7,{r:[0,e.yaw,0],em:.7});}ring(e.x+e.chargeDir.x*9,e.z+e.chargeDir.z*9,.85,0xf0bfd1);}
   const sweep=G.RealmEarthExpedition?.encounter(e);
   if(sweep){for(const {kind,...part}of G.RealmEarthExpeditionBeastArt.warningParts({frame:e.strike,...sweep,base:support(sim,e.x,e.z),mode:e.mode,timer:e.timer,windup:e.windup,reducedMotion:sim.state.settings.reducedMotion}))out[kind].push(part);}
   else if(e.kind!=='charger'&&e.mode==='windup'){let rad=e.telegraphRadius??(e.kind==='boss'?2.4:e.kind==='sentinel'?1.2:1.05);ring(e.aim.x,e.aim.z,rad,0xd098c8);if(!sim.state.settings.reducedMotion)ring(e.aim.x,e.aim.z,rad*Math.min(1,Math.max(.15,e.timer/(e.windup??1))),0xe0bad4,1.6);}
   if(!sim.presentation?.perspective){let w=e.kind==='boss'?2.1:1.15,y=e.kind==='boss'?5.35:rootBank?support(sim,e.x,e.z)+1.18:3.9;box(e.x,y,e.z,w,.10,.09,0x273743);box(e.x-w/2+w*e.hp/e.maxHP/2,y+.008,e.z+.035,w*e.hp/e.maxHP,.072,.07,e.kind==='boss'?0xcf9ba4:0xd1ba8d,{em:.4});}
  }
  for(const id of s.drops){let e=A.roster(sim).find(e=>e.id===id);if(!e)continue;box(e.x,1.88,e.z,.60,.47,.5,0x947856);box(e.x,2.11,e.z,.68,.13,.58,0xc9b489);add('octa',e.x,2.56+Math.sin(t*2)*.1,e.z,.19,.38,.19,0xf2d299,{em:1.2});}
  if(sim.room==='mine'&&!s.relic){let glow=s.defeated.includes('hart');for(let i=0;i<7;i++)box(9+i*.055,2.47+i*.09,-10,.13,.28,.07,glow?0xffe8ba:0x99ac9f,{r:[0,0,-.35],em:glow?1.3:.1});}
  const wall=sim.presentation?.digCell;if(wall){const pos=A.cellPoint(wall.gx,wall.gz);ring(pos.x,pos.z,.95,wall.valid?0xe5c590:0xce899d,3.35);}
 }
 const fox=(x,z,yaw,bonded)=>{
  const base=support(sim,x,z),owner=bonded?r.companion:A.FOX,previous=companionSamples.get(sim);
  const motion=G.RealmCompanionArt.motion(previous?.owner===owner&&previous.bonded===bonded?previous.motion:null,{x,z,time:sim.elapsed,scene:sim.room,paused:sim.paused,reducedMotion:sim.state.settings.reducedMotion});
  const pose=G.RealmCompanionArt.pose({...motion,bonded}),placement={x,z,base,yaw,bonded};
  const parts=G.RealmCompanionArt.parts(placement,pose);
  for(const {kind,...item} of parts)out[kind].push(item);
  companionSamples.set(sim,{owner,bonded,motion});companionFrames.set(sim,{placement,motion,pose,parts});
  if(!bonded)add('octa',x,base+1.5,z,.17,.30,.17,0xf1d3a3,{em:.8});
 };
 if(s.companion.bonded){if(r.companion.room===sim.room)fox(r.companion.x,r.companion.z,r.companion.yaw,true);}else if(sim.room==='mine')fox(A.FOX.x,A.FOX.z,Math.PI*.4,false);
 if(!sim.room&&s.road.reported){box(2.2,1.8,3,.55,1,.55,0x959a85);add('octa',2.2,2.65,3,.42,.85,.42,0xffd59e,{em:1.4});}
 if(!sim.room&&s.angelSeen){let x=-2.3,z=4.7;add('round',x,2.6,z,.57,1.8,.51,0xebe3c8);box(x,3.55,z,.35,.40,.34,0xe4c7a4);box(x,3.77,z-.02,.40,.16,.37,0xe9cf94);for(const sign of[-1,1])for(let j=0;j<7;j++)box(x+sign*(.4+j*.15),3.22+j*.11,z-.18-j*.025,.23,1.1-j*.065,.12,0xf4ecda,{r:[0,.1,-sign*(.4+j*.09)]});for(let i=0;i<22;i++){let a=i/22*TAU;box(x+Math.cos(a)*.39,4.15,z+Math.sin(a)*.39,.13,.045,.05,0xf3d8a2,{r:[0,-a,0],em:1});}for(let i=0;i<10;i++){let a=t*.45+i*2.4;add('octa',x+Math.cos(a)*1.15,1.7+(t*.25+i*.23)%2.6,z+Math.sin(a)*1.15,.065,.12,.065,i%2?0xf1dba8:0xe4c3d3,{em:1});}}
 const mark=G.RealmClasses.runtime(sim).mark;if(mark){ring(mark.enemy.x,mark.enemy.z,.95,0xa8d68d,base+.08);add('octa',mark.enemy.x,base+2.8,mark.enemy.z,.18,.35,.18,0xa8d68d,{em:.6});}
 for(const f of r.fx){let u=(s.elapsed-f.at)/.65;if(u<0||u>1)continue;if(f.kind==='arcane-flare'){const q=sim.state.settings.reducedMotion?.8:.4+u*.8;ring(f.x,f.z,q,f.color,base+.09);for(let i=0;i<4;i++)add('octa',f.x+Math.sin(i*1.57)*q,base+.65,f.z+Math.cos(i*1.57)*q,.17,.8*(1-u),.17,f.color,{em:.8});}else if(['pulse','impact','dodge','heal','arcane-cast','quarry-mark'].includes(f.kind))ring(f.x,f.z,.3+u*(f.kind==='pulse'?3.6:1.6),f.color,base+.05);else for(let i=0;i<6;i++){let a=i*2.4;add('octa',f.x+Math.sin(a)*u*.85,base+.3+Math.sin(u*Math.PI)*.7,f.z+Math.cos(a)*u*.85,.12*(1-u),.18*(1-u),.11*(1-u),f.color,{em:.4});}}
}
G.RealmAdventureArt={entrance,cave,draw,supportHeight:support,companionSnapshot:sim=>{const frame=companionFrames.get(sim);return frame?JSON.parse(JSON.stringify(frame)):null;},skitterSnapshot:sim=>JSON.parse(JSON.stringify(skitterFrames.get(sim)||[]))};})(globalThis);
