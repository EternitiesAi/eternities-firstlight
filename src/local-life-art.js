/* Original appearance-only work, keyed exclusively to accepted local facts. */
(function(G){'use strict';
const decor={appearanceOnly:true,cameraSolid:false,cutaway:false,rough:.86};
function draw(out,sim){
 const L=G.RealmLocalLife,W=G.RealmWorldFoundations,d=L.definitions.find(d=>d.realm===W.definition(sim.room)?.id);if(!d||d.kind==='earth-consignment-motion-v1')return;
 const r=sim.state.localLife.records[d.id];if(!r.accepted)return;
 const emit=(kind,p,s,c,part,extra={})=>out[kind].push({p,s,c,...decor,localLifeQuest:d.id,localLifePart:part,localLifeChoice:r.choice,...extra});
 const box=(x,y,z,w,h,depth,c,part,extra)=>emit('box',[x,y,z],[w,h,depth],c,part,extra);
 const oct=(x,y,z,w,h,depth,c,part,extra)=>emit('octa',[x,y,z],[w,h,depth],c,part,extra);
 const disc=(x,y,z,w,h,depth,c,part,extra)=>emit('disc',[x,y,z],[w,h,depth],c,part,extra);
 if(d.realm==='heaven'){
  const s=L.stepSite(d,d.steps.find(s=>s.id==='plant-cuttings'),r.choice),x=s.x,z=s.z+1.15,y=W.height(sim.room,x,z),planted=r.steps.includes('plant-cuttings');
  box(x,y+.15,z,1.35,.3,1.3,0x927351,'nursery-box');box(x,y+.31,z,1.2,.025,1.15,0x625e45,'nursery-soil');
  for(const side of[-1,1])box(x+side*.65,y+.19,z,.05,.4,1.3,0xad9270,'nursery-rail');
  if(planted)for(let i=0;i<6;i++){const xx=x+(i%3-1)*.32,zz=z+(Math.floor(i/3)-.5)*.48;box(xx,y+.46,zz,.035,.28,.035,0x6f8a65,'rooted-stem');oct(xx,y+.54,zz,.26,.14,.18,0x91ad78,'rooted-leaf');oct(xx,y+.63,zz,.1,.13,.1,r.choice==='channel'?0xe3cbbb:0xc398af,'rooted-blossom');}
  if(r.choice==='channel'){box(x+.83,y+.12,z,.31,.24,.4,0xbaa67c,'nursery-shutter');box(x+.83,y+.24,z,.24,.04,.28,planted?0xa0c2b0:0x7c826c,'shutter-state');}
  else for(const dx of[-.4,.4]){box(x+dx,y+.025,z-.88,.18,.05,.42,0xc4b493,'nursery-wick');box(x+dx,y+.11,z-.88,.29,.17,.25,0x7b8f83,'wick-cup');}
 }else if(d.realm==='hell'){
  const done=r.steps.includes('fit-filter'),checked=r.steps.includes('verify-outlet'),x=-13.85,z=18,y=W.height(sim.room,x,z);
  box(x,y+.35,z,.64,.7,.58,0x626d68,'filter-body');box(x,y+.76,z,.74,.12,.67,0xa38f70,'filter-collar');
  box(x,y+.46,z+.31,.27,.45,.025,done?0x9ebcb0:0x887963,'filter-cartridge');
  box(x-.47,y+.54,z,.32,.12,.18,0x7a8d87,'downstream-open-port');
  if(r.choice==='hand-filter'){box(x+.39,y+.91,z,.07,.45,.07,0xb8b3a1,'manual-filter-handle');box(x+.48,y+1.14,z,.28,.06,.1,0xc4b79b,'manual-filter-grip');}
  else disc(x,y+.85,z,.32,.035,.32,done?0xa7cbbb:0x97886d,'seated-filter-top');
  box(-15.1,y+.22,25,.55,.44,.56,0x988364,'filling-point');box(-15.1,y+.46,25,.42,.06,.43,checked?0xa1c8c0:0x6d817e,'verified-water-surface');
  if(checked)box(-15.1,y+.56,25.3,.26,.17,.03,0xd7caa5,'verified-outlet-tag');
 }else if(d.realm==='atlantis'){
  const fitted=r.steps.includes('fit-court-lamp'),x=5.2,z=-35,y=-2.7;
  const benchX=-9.15,benchY=1.57;
  for(const dx of[-.38,.38])for(const dz of[-.23,.23])box(benchX+dx,benchY+.39,-10+dz,.065,.78,.065,0x7d8a78,'cartridge-bench-leg');
  box(benchX,benchY+.82,-10,.95,.09,.65,0xa59773,'cartridge-bench-top');
  disc(benchX,benchY+.89,-10,.38,.035,.38,0x9aa785,'keyed-collar');
  box(benchX+.155,benchY+.93,-10,.055,.1,.08,0xc7b78c,'collar-notch');
  if(!r.steps.includes('assemble-cartridge'))box(benchX-.25,benchY+1.04,-10,.15,.25,.15,0x779e95,'unseated-cartridge');
  if(fitted){
   box(x,y+1.91,z,.43,.09,.42,0xc1a77b,'lamp-service-collar');
   box(x+.055,y+1.7,z,.3,.3,.3,0xd7d0a9,'seated-lamp-cartridge',{em:.22});
   if(r.choice==='desk'){box(x,y+1.89,z,.48,.08,.48,0x668b84,'desk-lamp-hood');box(x-.15,y+1.71,z,.06,.31,.39,0x64867e,'desk-lamp-back');box(x+.2,y+1.63,z,.14,.14,.24,0xdbcbb0,'desk-light-face',{em:.28});}
   else{box(x,y+1.73,z-.2,.44,.35,.065,0x6e8e86,'approach-shutter-back');box(x,y+1.73,z+.21,.37,.27,.04,0xe1d5af,'approach-light-face',{em:.28});}
  }
 }else if(d.realm==='cosmos'){
  const fitted=r.steps.includes('fit-shelf'),x=-6,z=r.choice==='route'?4.4:4.3,y=G.RealmCosmos.height(x,z);
  const wx=-2.05,wz=-43,wy=G.RealmCosmos.height(wx,wz);
  for(const dz of[-.24,.24])box(wx,wy+.42,wz+dz,.74,.84,.055,0x7e806b,'board-assembly-frame');
  box(wx,wy+.87,wz,.85,.07,.61,0xb6a47d,'board-assembly-surface');
  if(!r.steps.includes('assemble-board'))for(const[i,len]of[.29,.43].entries())box(wx+(i? .2:-.2),wy+.945,wz,.11,.08,len,0x788d83,'unmatched-board-support');
  if(fitted){
   box(x,y+1.15,z,1.2,.09,.56,0xb4a181,'fitted-drawing-board');
   for(const dx of[-.47,.47])box(x+dx,y+.96,z,.08,.3,.42,0x7c8473,'matched-board-support');
   box(x,y+1.205,z,.71,.018,.4,0xddcfaa,'shelf-page');
   for(let i=0;i<3;i++)box(x-.22+i*.14,y+1.217,z,.04,.009,.27,0x779792,'page-route-line');
   if(r.choice==='sheltered')for(const sign of[-1,1])box(x+sign*.57,y+1.23,z,.055,.13,.57,0x907c5f,'writing-tray-rim');
   else box(x,y+1.215,z-.26,1.22,.04,.055,0x978b68,'route-shelf-back');
  }
 }
 for(const s of L.available(sim.state,d)){
  if(s.medium!=='dry'||sim.worldDive)continue;
  disc(s.x,s.y+.025,s.z,.48,.025,.48,0x90c6cf,'available-work-ring');
 }
 if(L.carrying(sim.state,d)){
  const p=sim.state.player,y=sim.worldDive?W.playerHeight(sim):W.height(sim.room,p.x,p.z),yaw=p.yaw||0,x=p.x-Math.sin(yaw)*.32,z=p.z-Math.cos(yaw)*.32;
  const supply={r:[0,yaw,0],carriedSupply:d.carry.name};
  if(d.realm==='cosmos')box(x,y+1.02,z,.65,.45,.065,0xad9970,'carried-drawing-board',supply);
  else if(d.realm==='atlantis'){box(x,y+.97,z,.2,.35,.19,0x779c95,'carried-lamp-cartridge',supply);box(x,y+.8,z,.25,.045,.23,0xc3ad80,'carried-cartridge-collar',supply);}
  else{box(x,y+.94,z,.46,.18,.24,0xa68d6a,'carried-cutting-tray',supply);for(const dx of[-.14,.14])oct(x+dx*Math.cos(yaw),y+1.07,z-dx*Math.sin(yaw),.17,.18,.12,0x94af7c,'carried-cutting',supply);}
  box(x,y+1.02,z,.035,.42,.18,0xd2c09c,'carried-job-binding',supply);
 }
 if(r.claimed){const p=d.returner||d.giver,y=W.height(sim.room,p.x,p.z);box(p.x+.72,y+.045,p.z+.5,.42,.09,.32,0xbec8ad,'paid-local-receipt');}
}
G.RealmLocalLifeArt={draw};if(typeof module!=='undefined')module.exports=G.RealmLocalLifeArt;
})(globalThis);
