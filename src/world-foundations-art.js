/* Realm openings: visible ground and physical data share one owner. */
(function(G){'use strict';const W=G.RealmWorldFoundations,Coalescing=G.RealmWorldGroundCoalescing||(typeof require==='function'?require('./world-ground-coalescing.js'):null),decor={cameraSolid:false,cutaway:false,rough:.96};
function rawPartitions(def){
 const v=def.dive?.volume,xs=[...new Set([...def.patches.flatMap(p=>[p.x-p.w/2,p.x+p.w/2]),...(v?[v.x-v.w/2,v.x+v.w/2]:[])])].sort((a,b)=>a-b),zs=[...new Set([...def.patches.flatMap(p=>[p.z-p.d/2,p.z+p.d/2]),...(v?[v.z-v.d/2,v.z+v.d/2]:[])])].sort((a,b)=>a-b),out=[];
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
  const x=(xs[i]+xs[i-1])/2,z=(zs[j]+zs[j-1])/2,p=def.patches.filter(p=>Math.abs(x-p.x)<p.w/2&&Math.abs(z-p.z)<p.d/2).sort((a,b)=>a.w*a.d-b.w*b.d)[0];
  if(p)out.push({x,z,w:xs[i]-xs[i-1],d:zs[j]-zs[j-1],y:p.y,color:p.color??def.palette.ground,source:p.id,gallery:!!(v&&Math.abs(x-v.x)<v.w/2&&Math.abs(z-v.z)<v.d/2)});
 }return out;
}
function partitions(def){return Coalescing.coalesce(rawPartitions(def));}
// Only exposed Coastward land receives a skirt. Derive its seam from the same
// partition cells actually drawn above, including bridge cells as neighbours.
// Internal patch/grid edges therefore never become walls, and this function
// cannot enlarge physical ground, move a task or invent a collision solid.
function coastBanks(cells){
 const eps=1e-6,groups=new Map(),contains=(x,z)=>cells.some(p=>x>p.x-p.w/2-eps/4&&x<p.x+p.w/2+eps/4&&z>p.z-p.d/2-eps/4&&z<p.z+p.d/2+eps/4);
 for(const p of cells){
  if(p.source==='channel-bridge'||p.source==='elderweald-footbridge')continue;
  const x0=p.x-p.w/2,x1=p.x+p.w/2,z0=p.z-p.d/2,z1=p.z+p.d/2;
  for(const e of [{axis:'z',at:x0,from:z0,to:z1,nx:-1,nz:0},{axis:'z',at:x1,from:z0,to:z1,nx:1,nz:0},{axis:'x',at:z0,from:x0,to:x1,nx:0,nz:-1},{axis:'x',at:z1,from:x0,to:x1,nx:0,nz:1}]){
   const center=(e.from+e.to)/2,x=e.axis==='z'?e.at:center,z=e.axis==='z'?center:e.at;
   if(contains(x+e.nx*eps,z+e.nz*eps))continue;
   const seamY=p.y-.11,key=[e.axis,e.at,e.nx,e.nz,seamY].join('|');
   if(!groups.has(key))groups.set(key,[]);groups.get(key).push({...e,seamY});
  }
 }
 const edges=[];
 for(const rows of groups.values()){
  rows.sort((a,b)=>a.from-b.from);
  let merged=null;
  for(const e of rows){if(merged&&Math.abs(merged.to-e.from)<eps)merged.to=e.to;else{merged={...e};edges.push(merged);}}
 }
 edges.sort((a,b)=>a.axis.localeCompare(b.axis)||a.at-b.at||a.from-b.from||a.nx-b.nx||a.nz-b.nz);
 const water=G.RealmEngine.WATER_HEIGHT,base=water-.18,colors=[0x858872,0x898b75,0x7e846e,0x8c8c77],parts=[];
 edges.forEach((e,index)=>{
  const length=e.to-e.from,n=1,span=length;
  for(let i=0;i<n;i++){
   const from=e.from+i*span,to=e.from+(i+1)*span,center=(from+to)/2,t=(i+.5)/n;
   const width=1.35+.22*Math.sin(index*2.7);
   const p=e.axis==='z'?[e.at,base,center]:[center,base,e.at],s=[width,e.seamY-base,span],r=[0,Math.atan2(-e.nz,e.nx),0];
   parts.push({kind:'coast-bank',p,s,r,c:colors[index%colors.length],rough:1,cameraSolid:false,cutaway:false,coastBank:true,id:'coast-bank-'+index,seam:{...e,from,to}});
  }
 });
 return parts;
}
function make(a,sim){const def=W.definition(sim.room);a.begin(def.room);a.e.isInterior=false;a.e.worldFog=def.id==='earthlands'?{clear:30,span:130}:null;a.e.theme=def.theme||null;a.e.noWater=!def.water;a.e.ambientOverride=def.id==='hell'?.6:def.id==='heaven'?.87:.76;a.e.worldAtmosphere=def.id==='heaven'?{top:0x9fb8bd,fog:0xe4cdbd,night:.12,power:.85,sunColor:0xffe5c2}:def.id==='hell'?{top:0x32292f,fog:0x75605a,night:.38,power:.68,sunColor:0xffc185}:null;
 const cells=partitions(def);
 for(const p of cells){
  const gallery=p.gallery;
  a.box(p.x,p.y-.055,p.z,p.w,.11,p.d,p.color,{...decor,cutaway:!!gallery,terrain:true,worldGround:p.source});
  // Bridge decks have open water underneath. Other ground has a closed shore.
  if(!gallery&&!/bridge/.test(p.source))a.box(p.x,(p.y-.11-.5)/2,p.z,p.w,p.y-.11+.5,p.d,def.palette.stone,decor);
 }
 if(def.id==='earthlands')for(const bank of coastBanks(rawPartitions(def))){const{kind,p,s,c,...opt}=bank;a.add(kind,...p,...s,c,opt);}
 for(const p of def.solids)a.box(p.x,W.height(def.room,p.x,p.z)+p.h/2,p.z,p.w,p.h,p.d,p.color??def.palette.stone,{rough:.96,cameraSolid:true,cutaway:true,worldSolid:true,worldSolidId:p.id,...(p.id==='hearthwater-fingerpost'?{earthRoadPart:'post'}:{})});
 if(def.dive){const d=def.dive,v=d.volume;
  a.box(v.x,d.minY-.36,v.z,v.w,.12,v.d,0x638b84,decor);
  // The maintained air court uses the existing preference-controlled roof
  // reveal. Its authoritative ceiling remains solid; only its view opens.
  for(const p of d.solids||[])a.box(p.x,p.y+p.h/2,p.z,p.w,p.h,p.d,p.color??0x9bb8ab,{rough:.94,cameraSolid:true,cutaway:true,worldSolid:true,worldSolidId:p.id,...(p.id==='bellglass-ceiling'?{worldRoof:'atlantis-air-court'}:{})});
  for(const p of d.dryCourts||[]){a.box(p.x,p.floorY-.06,p.z,p.w,.12,p.d,0xb7b692,decor);a.box(p.x,p.floorY+.025,p.z,1.5,.05,2.1,0x9a8b6c,decor);}
  // Thin wall inlay and a supported field notebook make the maintained court
  // readable without changing its body route, dry volume or collision owner.
  a.box(8,-1.2,-37.235,2.6,1.2,.025,0x577b76,decor);
  for(let i=0;i<5;i++)a.box(7.1+i*.45,-1.2,-37.215,.16,.38,.015,0xd9cba3,{...decor,r:[0,0,Math.PI/4]});
  a.box(6.55,-1.865,-36.5,.5,.07,.36,0x655948,decor);a.box(6.55,-1.82,-36.5,.42,.02,.3,0xd9cba3,decor);
  a.box(8,-2.685,-32.5,1.15,.03,2.4,0xa49e7b,decor);
 }
 const painter=def.id==='heaven'||def.id==='hell'?G.RealmWorldHeavenHell:G.RealmWorldAtlantisEarth;
 painter.decorate(a,def,{height:(x,z)=>W.height(def.room,x,z),rng:G.RealmCore.rng(23171002),sim});
 for(const p of def.points.filter(p=>p.id!=='coastward-hearthwater-road')){if(p.kind==='person')continue;const y=W.height(def.room,p.x,p.z);a.add('cylinder',p.x,y,p.z,.07,.8,.07,def.palette.trim,decor);a.add('octa',p.x,y+.9,p.z,.2,.25,.2,p.kind==='return'?0xffd69a:def.palette.trim,{...decor,em:.18});}
 if(def.id==='earthlands')G.RealmEarthGrazerHabitatArt.make(a,sim);
 G.RealmEarthRoadArt?.make(a,def.room);
 a.commit();
}
function gate(a){const p=W.GATE;a.add('cylinder',p.x,1.3,p.z,.13,1.45,.13,0xae9569,decor);a.box(p.x,2.65,p.z,1.3,.57,.1,0x586963,decor);for(let i=0;i<5;i++)a.add('octa',p.x-.46+i*.23,2.65,p.z+.065,.12,.17,.10,[0xe5d8b1,0xc98b67,0x9dc8c5,0xa4b276,0xbeaec9][i],{...decor,em:.18});}
function draw(out,sim,t,a){const d=W.definition(sim.room);if(!d)return;const quiet=sim.state.settings.reducedMotion;if(d.id==='earthlands'){G.RealmEarthExpeditionArt?.draw(out,sim);G.RealmEarthWildSignsArt?.draw(out,sim);}
 // Cosmos keeps its existing people and scene owner; only accepted work adds
 // small ground records there.
 if(!d.existing)for(const p of d.points.filter(p=>p.kind==='person')){
  const base=W.height(d.room,p.x,p.z);
  if(Object.hasOwn(G.RealmGiversArt.profiles,p.id))G.RealmGiversArt.draw(out,p,{
   base,yaw:p.yaw??Math.PI,time:t,reducedMotion:quiet,paused:sim.paused,realm:d.id
  });
  else a.person(out,p.x,p.z,p.yaw??Math.PI,p.color??d.palette.trim,quiet?0:t,false,p.role||'traveler',false,base);
 }
 const r=sim.state.journeys.realms[d.id],giver=d.points.find(p=>p.id===d.quest.giverId);
 for(const o of d.quest.objectives){if(!r.active?.observed.includes(o.id))continue;const p=d.points.find(p=>p.id===o.pointId);out.disc.push({p:[p.x,W.height(d.room,p.x,p.z)+.035,p.z],s:[.65,1,.65],c:0xe0d5a3,em:.12,...decor});}
 if(r.firstClaimed&&giver&&d.existing){const y=W.height(d.room,giver.x,giver.z);out.box.push({p:[giver.x+.7,y+.015,giver.z+.3],s:[.65,.03,.48],c:0xe3d4ad,...decor});for(let i=0;i<3;i++)out.box.push({p:[giver.x+.48+i*.22,y+.036,giver.z+.3],s:[.06,.012,.3],c:[0xb6ac69,0x80a9a0,0xa89dbe][i],...decor});}
 if(sim.worldDive&&W.medium(sim,[sim.state.player.x,W.playerHeight(sim)+.85,sim.state.player.z])==='water'){const p=sim.state.player,y=W.playerHeight(sim);out.octa.push({p:[p.x,y+1.85,p.z],s:[.08,.08,.08],c:0xb4e7dd,em:.4,...decor});}
}
G.RealmWorldFoundationsArt={make,gate,draw,partitions,rawPartitions,coastBanks};if(typeof module!=='undefined')module.exports=G.RealmWorldFoundationsArt;
})(globalThis);
