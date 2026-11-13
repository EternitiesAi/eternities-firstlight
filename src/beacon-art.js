/* Read-only Chapter III and combat presentation. Geometry is original/local. */
(function(G){'use strict';
const TAU=Math.PI*2;
function draw(out,sim,t,art){
 const A=G.RealmAdventure,B=G.RealmBeacon,a=sim.state.adventure,r=B.runtime(sim),cr=G.RealmCombat.runtime(sim),ar=A.runtime(sim),p=sim.state.player;
 const add=(k,x,y,z,sx,sy,sz,c,opt={})=>out[k].push({p:[x,y,z],s:[sx,sy,sz],c,rough:.65,...opt});
 const box=(...v)=>add('box',...v),orb=(...v)=>add('round',...v);
 const ring=(x,z,rad,y,c,n=32)=>{for(let i=0;i<n;i++){let u=i/n*TAU;box(x+Math.sin(u)*rad,y,z+Math.cos(u)*rad,.12,.035,.24,c,{r:[0,u,0],em:.75});}};
 const quiet=sim.state.settings.reducedMotion,clock=quiet?0:t;
 art.e.siege=sim.room==='road'&&['assault','intermission'].includes(r.phase)?.7:0;
 if(a.elapsed<cr.guardUntil)ring(p.x,p.z,.86,sim.room?1.65:1.35,0x97c5db,20);
 if(a.elapsed<cr.shieldUntil&&cr.shield>0){ring(p.x,p.z,1.08,sim.room?1.69:1.38,0xf2dca4,24);for(let i=0;i<8;i++){let u=i*TAU/8+clock;add('octa',p.x+Math.sin(u),2.1,p.z+Math.cos(u),.09,.36,.10,0xf5e2b7,{em:.8});}}
 if(sim.room!=='road'||!a.beacon.introduced)return;
 const fought=['assault','intermission','failed'].includes(r.phase),gold=fought?0xe3a78a:0xf3ddb1;
 // A legible ward ring and rising motes, not opaque screen-covering bloom.
 ring(0,-24,2.7,1.65,gold,48);ring(0,-24,3.3,1.63,0xc7b993,32);
 for(let j=0;j<8;j++){let u=j*TAU/8;box(Math.sin(u)*3.2,1.85,-24+Math.cos(u)*3.2,.28,.45,.28,0x9cae9e);add('octa',Math.sin(u)*3.2,2.15,-24+Math.cos(u)*3.2,.21,.36,.21,gold,{em:1});}
 const rise=r.phase==='arrival'?Math.max(0,1-r.time/8)*7:0;
 const ax=0,az=-24.3;
 orb(ax,2.55+rise,az,.64,1.7,.59,0xf1e4cc);box(ax,3.53+rise,az,.34,.40,.33,0xe8c39f);box(ax,3.79+rise,az-.04,.40,.18,.37,0xebc97e);
 box(ax,2.72+rise,az+.31,.18,.24,.05,0x9f3656,{em:.14});
 for(const sign of[-1,1]){
  box(ax+sign*.36,2.89+rise,az,.15,.73,.14,0xe5d9bf,{r:[0,0,-sign*.3]});
  for(let j=0;j<9;j++)box(ax+sign*(.42+j*.17),3.32+rise+j*.09,az-.22-j*.018,.23,1.22-j*.076,.13,j%2?0xf8efde:0xe5d6be,{r:[0,.1,-sign*(.43+j*.07)]});
 }
 ring(ax,az,.42,4.24+rise,0xf1c96e,24);
 for(let i=0;i<25;i++){let u=i*2.4+clock*.38,y=1.65+((clock*.48+i*.27)%7);add('octa',ax+Math.sin(u)*(.25+i%3*.17),y,az+Math.cos(u)*(.25+i%3*.17),.055,.23,.055,i%3?0xffdcaa:0xe4a4c4,{em:1.05});}
 for(const q of r.actors){const profile=G.RealmCore.PROFILES.find(x=>x.id===q.id);art.person(out,q.x,q.z,q.yaw,profile.color,clock,q.path.length>0,profile.role.toLowerCase(),false,1.57);
  if(q.id==='oren'&&!q.path.length){box(q.x+.6,1.9,q.z,.65,.65,.7,0xb29363);box(q.x+.6,2.25,q.z,.80,.10,.82,0xccc2a2);}
  if(q.id==='mara'&&!q.path.length){add('octa',q.x-.55,2.95,q.z,.35,.75,.35,0xb1d2d5,{em:.8,r:[0,clock*.3,0]});}
 }
 if(B.sightingPending(sim)){const S=B.SCENE;art.person(out,S.tessa.x,S.tessa.z,S.tessa.yaw,'#699e9a',clock,false,'trader',false,1.57);
  if(G.RealmStoryArt?.regent)G.RealmStoryArt.draw(out,G.RealmStoryArt.regent(S.stranger.x,1.57,S.stranger.z,S.stranger.yaw,clock));
  else{art.person(out,S.stranger.x,S.stranger.z,S.stranger.yaw,'#8b8689',clock,false,'stranger',false,1.57);add('octa',S.stranger.x,2.95,S.stranger.z+.18,.2,.3,.2,0xe0743a,{em:1.5});}}
 if(fought&&r.phase!=='failed')for(const[x,z]of[[-6,-18],[6,-17]]){
  for(let j=0;j<18;j++){let u=j/18*TAU;add('octa',x+Math.sin(u)*.9,2.9+Math.cos(u)*1.6,z,.16,.36,.13,j%3?0x9c445a:0xdd956b,{em:.8});}
 }
 for(const e of ar.enemies.filter(e=>e.eventEnemy&&e.hp>0)){
  if(e.hidden){for(let j=0;j<5;j++)add('octa',e.x+Math.sin(clock+j)*.5,1.8+j*.18,e.z+Math.cos(clock+j)*.4,.14,.31,.14,0x625273,{em:.25});continue;}
  const big=e.kind==='siegeboss',h=big?1.55:1,angle=e.yaw,col=e.flash>a.elapsed?0xffe3be:big?0x3b3843:e.kind==='chanter'?0x64506b:0x6b4449;
  const local=(kind,x,y,z,w,hh,d,c,opt={})=>add(kind,e.x+(x*Math.cos(angle)+z*Math.sin(angle))*h,1.58+y*h,e.z+(-x*Math.sin(angle)+z*Math.cos(angle))*h,w*h,hh*h,d*h,c,{...opt,r:[opt.r?.[0]||0,angle,opt.r?.[2]||0]});
  local('round',0,.86,0,.65,.95,.49,col);local('octa',0,1.58,0,.46,.62,.39,col);
  for(const sign of[-1,1]){local('box',sign*.20,.30,0,.20,.64,.21,0x443c44,{r:[Math.sin(clock*4)*.15*sign,0,0]});local('box',sign*.44,.85,0,.18,.79,.19,col,{r:[e.mode==='windup'?-.9:0,0,0]});local('octa',sign*.25,1.99,-.06,.16,.74,.19,0xc2af90,{r:[0,0,-sign*.35]});local('round',sign*.13,1.65,.22,.08,.10,.045,0xffa082,{em:1.5});}
  if(big){for(let j=0;j<8;j++)local('octa',.6+j*.1,1.2-j*.1,.3,.19,.23,.19,0xb7a8a0);local('box',0,.85,.25,.13,.8,.05,0xc86465,{em:.7});}
  else if(e.kind==='chanter'){local('box',.55,.9,.22,.08,1.9,.09,0xb7987b);local('octa',.55,1.95,.22,.29,.48,.28,0xdb8890,{em:1.2});}
  if(cr.target===e.id)ring(e.x,e.z,big?1.2:.8,1.64,0xffdd9a);
  if(e.exposedUntil>a.elapsed)ring(e.x,e.z,big?1.35:.94,1.65,0xa3d9b5,16);
  if(e.mode==='windup'&&e.aim){const rad=big?2.5:1.3;ring(e.aim.x,e.aim.z,rad,1.66,e.aimWard?0xee876b:0xe895c6);ring(e.aim.x,e.aim.z,rad*Math.max(.1,e.timer/(big?1.35:1)),1.67,0xf1c1d5,24);}
  if(!sim.presentation?.perspective){box(e.x,1.58+h*2.5,e.z,big?1.65:1,.09,.08,0x292e33);box(e.x,1.59+h*2.5,e.z+.04,(big?1.65:1)*e.hp/e.maxHP,.065,.065,0xd98787,{em:.35});}
 }
 if(a.beacon.complete&&a.beacon.relic==='undecided'){add('octa',2,2.0,-22,.35,.62,.33,0xb05a72,{em:.9});ring(2,-22,.5,1.65,0xe09598,16);}
}
G.RealmBeaconArt={draw};
})(globalThis);
