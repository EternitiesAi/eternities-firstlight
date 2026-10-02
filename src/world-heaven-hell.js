/* Original Heaven/Hell opening content. Shared world rules own movement,
 * interaction, combat, save checkpoints and every reward. Names from the
 * 2026-09-14 design packages remain provisional game-fiction labels. */
(function(G){'use strict';
const FLOOR=1.57,TAU=Math.PI*2;
const solid=(id,x,z,w,d,h)=>({id,x,z,w,d,h});
const patch=(id,x,z,w,d)=>({id,x,z,w,d,y:FLOOR});
const point=(id,name,x,z,kind,text,detail,extra={})=>({id,name,x,z,kind,text,detail,...extra});
const heavenSolids=[
 solid('heaven-garden-instrument',0,-6,4,3,1.5),
 solid('heaven-rielle-bench',-15,2,4,1.6,1.1),
 solid('heaven-garden-seat-west',-13,10,3,.9,.95),
 solid('heaven-garden-seat-east',13,10,3,.9,.95),
 solid('heaven-garden-seat-north',14,-9,3,.9,.95),
 solid('heaven-planter-west',-24,17,8,4,.45),
 solid('heaven-planter-east',24,17,8,4,.45),
 solid('heaven-yselle-table',26,1,3,1.6,1.05),
 solid('heaven-arcade-workshop',-48,-31,10,34,6.2),
 solid('heaven-arcade-inlay-bench',-39,-31,2.4,2.4,1.8),
 solid('heaven-east-pavilion',41,-28,12,18,5.1),
 solid('heaven-east-service-house',43,-64,10,13,4.4),
 solid('heaven-causeway-resonator',-5,-79,2.4,2.4,2.2),
 solid('heaven-north-gate-west',-17,-102,4,4,14),
 solid('heaven-north-gate-east',17,-102,4,4,14),
 solid('heaven-north-closed-terrace',0,-112,38,2,2.4),
 solid('heaven-return-post-west',-2.8,31,.65,.65,3),
 solid('heaven-return-post-east',2.8,31,.65,.65,3)
];
for(let i=0;i<5;i++)for(const x of[-42,-28])heavenSolids.push(solid('heaven-arcade-column-'+i+'-'+(x< -35?'west':'east'),x,-12-i*10,1.2,1.2,5.4));
for(let i=0;i<4;i++)for(const x of[-11,11])heavenSolids.push(solid('heaven-causeway-pier-'+i+'-'+(x<0?'west':'east'),x,-29-i*16,1.4,3.6,3.8));
for(let i=0;i<12;i++){const x=i%2?-51:51,z=25-Math.floor(i/2)*23;heavenSolids.push(solid('heaven-tree-'+i,x,z,1.1,1.1,3.1));}
for(const [i,x,z]of[[0,-20,25],[1,20,25],[2,-23,-13],[3,23,-13],[4,-22,-53],[5,22,-53],[6,-20,-92],[7,20,-92]])heavenSolids.push(solid('heaven-lamp-'+i,x,z,.6,.6,3.5));

const hellSolids=[
 solid('hell-refuge-back',-10,10,24,1.4,4.3),
 solid('hell-refuge-west',-21.3,19,1.4,18,4.3),
 solid('hell-refuge-east',1.3,14,1.4,9,4.3),
 solid('hell-tovan-bench',-16,13,4,1.7,1.15),
 solid('hell-refuge-chair',-18,24,2.5,.9,.9),
 solid('hell-refuge-supplies',-18,18,2.2,2.2,1.5),
 solid('hell-refuge-ember-hearth',-4,12,2.4,2.4,1.1),
 solid('hell-refuge-lantern',-7,21,.6,.6,3.1),
 solid('hell-industrial-spine',0,-41,18,62,7.8),
 solid('hell-spine-stack-west',-5,-32,3.4,3.4,16),
 solid('hell-spine-stack-east',5,-56,3.4,3.4,20),
 solid('hell-tithe-mile-cover',32,-36,5,7,2.3),
 solid('hell-tithe-mile-inspection',24,-46,2.8,2.8,1.8),
 solid('hell-moth-cut-retaining',-44,-42,2.5,36,4),
 solid('hell-moth-cut-culvert',-32,-48,3.2,3.2,1.8),
 solid('hell-moth-cut-storage',-40,-67,7,6,3.1),
 solid('hell-slag-quay-loading',-22,-77,8,4,1.4),
 solid('hell-bell-yard-west-support',-26,-96,3,4,10),
 solid('hell-bell-yard-east-support',22,-96,3,4,10),
 solid('hell-bell-yard-bell-base',-11,-101,5,5,3.3),
 solid('hell-bell-yard-closed-works',0,-111,56,2.4,5.2),
 solid('hell-watch-pocket-cover',39,-88,3,5,2.2),
 solid('hell-watch-pocket-stock',47,-84,7,2.5,1.5),
 solid('hell-return-post-west',-2.8,35,.65,.65,3),
 solid('hell-return-post-east',2.8,35,.65,.65,3)
];
for(const [i,x,z]of[[0,12,18],[1,-25,4],[2,17,-15],[3,18,-63],[4,-28,-17],[5,-36,-75],[6,12,-90],[7,-20,-103]])hellSolids.push(solid('hell-lamp-'+i,x,z,.65,.65,3.2));
for(let i=0;i<8;i++){const x=i%2?-54:54,z=15-Math.floor(i/2)*30;hellSolids.push(solid('hell-ash-tree-'+i,x,z,1.1,1.1,3));}
// Shared box rendering accepts these material bases. Tiny surface inlays below
// extend by at most .025 units; all consequential cover retains these boxes.
for(const s of heavenSolids)s.color=s.id.includes('tree')?0x967d61:s.id.includes('bench')||s.id.includes('seat')||s.id.includes('table')?0xbd9d6a:s.id.includes('lamp')||s.id.includes('return-post')?0xbe914c:0xe8dfc9;
for(const s of hellSolids)s.color=s.id.includes('ash-tree')?0x49494a:s.id.includes('bench')||s.id.includes('chair')?0x796854:s.id.includes('refuge')?0x6d6860:s.id.includes('lamp')||s.id.includes('return-post')||s.id.includes('support')?0x5b6268:s.id.includes('spine')?0x303337:0x55565a;

const realms=[{
 id:'heaven',room:'world-heaven',name:'Heaven · Garden of Voices',
 description:'A welcoming garden below the Aureate skyline. Walk the Ruby Arcade and Mirror Causeway, compare three public instruments, and return to Earth whenever you choose.',
 kicker:'Bone stone, ruby craft and an ordinary welcome. Regional names remain provisional.',
 entry:{x:0,z:27,yaw:Math.PI},bounds:{minX:-60,maxX:60,minZ:-120,maxZ:40},
 patches:[patch('heaven-garden-ground',0,-5,120,90),patch('heaven-north-ground',0,-78,118,84)],
 solids:heavenSolids,
 points:[
  point('heaven-home','Road home',0,31,'return','The Earth road remains open. Leaving costs nothing and makes no pledge.','Return to your familiar Earth home. A departure confirmation keeps the choice deliberate.'),
  point('heaven-rielle','Rielle · bellwright',-14,5,'person','Polish is easy. A public instrument must answer someone with tired hands as readily as a practiced musician. Will you compare the three response plates for me?','Rielle wants usable craft, not a flawless showpiece. This small survey does not repair the upper Broken Choir or settle its cause.',{color:'#b57b77',role:'keeper'}),
  point('heaven-calen','Calen · field guide',7,20,'person','The central causeway is broad. The Ruby Arcade makes a longer loop on the west. Both meet at the northern overlook, and both bring you back here.','Calen knows these lower paths. The summit beyond the closed terrace remains closed; his route advice leaves you free to explore on foot.',{color:'#b7ac87',role:'researcher'}),
  point('heaven-yselle','Yselle · gardener',25,5,'person','These public beds stay planted. If you want a cutting, we will grow one for that purpose; a garden need not be stripped to be useful.','Yselle tends the sage and pale blossoms beside her worktable. Her future cultivation and water-shutter commissions remain separate.',{color:'#85a692',role:'researcher'}),
  point('heaven-garden-response','Garden response plate',0,-1,'objective','The lower chime answers clearly. Its broad plate can be pressed by hand; three visible notches mark the return stroke.','Observe the named shape and engraved stroke. Sound is optional; no perfect-pitch check, material cost or inventory item is required.'),
  point('heaven-arcade-response','Ruby Arcade response plate',-35,-31,'objective','The maker has set one ruby line into a worn bone frame. The plate returns evenly; a repaired hinge remains visible.','Reach this bench through the open colonnade. The ruby denotes craft and cloth, with no premium currency or allegiance.'),
  point('heaven-causeway-response','Mirror Causeway response plate',0,-79,'objective','The mirror frame holds a steady pale mark against the distant city. Its return arm stops short of the last notch.','Record the observable mismatch. This is evidence for Rielle, not a declaration that the city has been restored or its machinery explained.'),
  point('heaven-north-overlook','Northern overlook',0,-99,'view','Bone towers rise behind a rose-colored cloudbank. The upper road remains closed; the garden and both lower routes are open.','The broad grounded overlook is reachable on foot. Distant city geometry is a vista, with no hidden summit destination.'),
  point('heaven-service-loop','Arcade service walk',-24,-76,'view','A low service path turns beneath the city-facing arcade. You can return along the garden’s west edge.','This ordinary ground loop remains available before and after the survey, without a guide, class, reward or combat requirement.')
 ],
 quest:{id:'heaven-opening-v1',title:'Three ordinary answers',giverId:'heaven-rielle',
  objectives:[{id:'first',pointId:'heaven-garden-response',text:'Compare the Garden response plate',kind:'interact'},{id:'second',pointId:'heaven-arcade-response',text:'Compare the Ruby Arcade response plate',kind:'interact'},{id:'third',pointId:'heaven-causeway-response',text:'Compare the Mirror Causeway response plate',kind:'interact'}],
  reward:{xp:18,coins:7,ore:0},completionText:'Rielle records the uneven return instead of polishing it away. She pays the declared survey fee once. The Broken Choir and the upper road remain separate work.'},
 palette:{ground:0x8eaa92,stone:0xe8dfc9,trim:0xbe914c,sky:0xe79aad},theme:'cosmos',water:false
},{
 id:'hell',room:'world-hell',name:'Hell · Kiln Refuge',
 description:'A decommissioned kiln shelter holds an honest return light. Scout Tithe Mile and Moth Cut to Bell Yard; the salvage sentinel in the eastern side pocket is optional.',
 kicker:'Coal has weight, iron has purpose, and somebody kept a light. Regional names remain provisional.',
 entry:{x:0,z:31,yaw:Math.PI},bounds:{minX:-60,maxX:60,minZ:-116,maxZ:44},
 patches:[patch('hell-refuge-ground',0,9,120,70),patch('hell-marches-ground',0,-56,120,80),patch('hell-yard-ground',0,-97,100,38)],
 solids:hellSolids,
 points:[
  point('hell-home','Road home',0,35,'return','This return road is real and free. No toll, pledge, boss victory or salvage is required to leave.','Istra keeps the route honest. Confirm departure to return to your familiar Earth home.'),
  point('hell-istra','Istra · return keeper',-10,24,'person','I can promise this road home. I cannot promise what lies beyond the closed works. Will you check Tovan’s two route marks and the Bell Yard plate?','The survey is voluntary and names its finite fee. The eastern salvage sentinel is optional; both ordinary approaches and the refuge stay available.',{color:'#c5a473',role:'keeper'}),
  point('hell-tovan','Tovan · riveter',-15,16,'person','I used to fit their claim machinery. Knowing where it fails is useful; pretending I never helped it work would not be. The marks I need checked are on the ground.','Tovan offers measurements, not absolution or free gear. Tithe Mile runs east of the central works; Moth Cut runs west. The survey creates no patron contract.',{color:'#8e9aa3',role:'researcher'}),
  point('hell-tithe-mark','Tithe Mile inspection mark',24,-41,'objective','The exposed road passes an iron inspection frame. The old plate claims departure can be reviewed; Istra’s declared return remains unconditional.','Check the actual rivets and support, not the inscription’s promise. The central industrial spine is solid; a broad road runs along its east side.'),
  point('hell-moth-mark','Moth Cut service mark',-31,-43,'objective','Soot moths gather near a cooled service mouth. Its three rivets match Tovan’s sketch; the maintenance path continues to Slag Quay.','Follow the dry service approach without fighting. The old culvert mouth is closed; the open path runs beside it and joins the exposed road at Slag Quay.'),
  point('hell-bell-yard-plate','Bell Yard route plate',-12,-95,'objective','A burden bell hangs between heavy supports. The plate records a path through the yard, but the inner foundry doors remain closed.','Measure the approach and return. This opening does not release a Bell-Bearer, extract Neris, resolve Veyr or alter the realm’s claim system.'),
  point('hell-slag-quay','Slag Quay junction',0,-80,'view','Both roads meet beyond the industrial spine. Loading blocks and a distant foundry make the direction legible.','Take either already-open road back to the Kiln Refuge. The works do not seal a combat door behind you.'),
  point('hell-watch-pocket','Eastern salvage pocket',30,-93,'view','A salvage sentinel waits beyond the iron stock. You can inspect this side pocket or keep to the Bell Yard survey route.','The sentinel is an optional real combat target under shared combat rules. It grants no independent enemy loot and does not guard an objective or the road home.')
 ],
 quest:{id:'hell-opening-v1',title:'Marks on a road that returns',giverId:'hell-istra',
  objectives:[{id:'first',pointId:'hell-tithe-mark',text:'Inspect the Tithe Mile support mark',kind:'interact'},{id:'second',pointId:'hell-moth-mark',text:'Inspect the Moth Cut service mark',kind:'interact'},{id:'third',pointId:'hell-bell-yard-plate',text:'Read the grounded Bell Yard route plate',kind:'interact'}],
  reward:{xp:22,coins:9,ore:2},completionText:'Tovan keeps the measured route marks in the refuge; Istra pays the declared survey fee once. A useful record is made. The main foundry expedition, witness and local disposition remain ahead.'},
 enemies:[{id:'hell-salvage-sentinel',name:'Salvage sentinel',kind:'sentinel',x:44,z:-94,hp:90,damage:9,xp:0,ore:0,coins:0}],
 palette:{ground:0x696961,stone:0x303337,trim:0x5b6268,sky:0x573d42},theme:'cosmos',water:false
}];
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
freeze(realms);

// Route lines are original decorative paving over the supplied flat ground.
// They are not a second movement graph, raised floor or interaction authority.
const routes={heaven:[[[0,31],[0,17],[6,2],[6,-13],[0,-20],[0,-79],[0,-99]],[[0,17],[-14,5],[-24,5],[-35,-10],[-35,-52],[-24,-76],[0,-89]],[[0,17],[25,5],[29,-26],[27,-66],[0,-89]]],
 hell:[[[0,35],[0,24],[14,9],[24,-4],[24,-35],[20,-38],[20,-53],[24,-65],[16,-80],[-12,-95]],[[0,24],[-10,24],[-10,32],[-29,32],[-31,4],[-31,-15],[-27,-37],[-27,-54],[-31,-70],[-31,-82],[-15,-82],[-12,-95]],[[16,-80],[30,-93],[44,-104]]]};
function fallbackRng(seed){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function onGround(def,x,z,r=0){return def.patches.some(p=>Math.abs(x-p.x)<=p.w/2-r&&Math.abs(z-p.z)<=p.d/2-r);}
function clear(def,x,z,r=0){return onGround(def,x,z,r)&&!def.solids.some(s=>Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r);}
function routeDistance(def,x,z){let best=Infinity;for(const line of routes[def.id])for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}return best;}
function decorate(art,def,options={}){
 if(!def||!realms.some(r=>r.id===def.id))return{realmId:null,instances:0,distantInstances:0};
 const h=typeof options.height==='function'?options.height:()=>FLOOR,rnd=typeof options.rng==='function'?options.rng:fallbackRng(def.id==='heaven'?100220261:100220262),isHeaven=def.id==='heaven';
 let instances=0,distantInstances=0;
 const at=(kind,x,y,z,sx,sy,sz,c,opt={})=>{art.add(kind,x,y,z,sx,sy,sz,c,{cameraSolid:false,cutaway:false,...opt});instances++;if(opt.skyImage)distantInstances++;};
 const box=(x,y,z,w,hh,d,c,opt)=>at('box',x,y,z,w,hh,d,c,opt);
 const detail=(s,x,y,z,w,hh,d,c,opt={})=>box(x,y,z,w,hh,d,c,{worldSolidId:s.id,cutaway:true,...opt});
 const gold=0xbe914c,ruby=0x8f1538,silver=0x88b6c5,bone=0xe8dfc9,iron=0x5b6268,amber=0xe7bb74;
 // Shared art renders each actual box once. Surface dressing differs by at
 // most .025 cosmetic units; it supplies no additional invisible cover.
 for(const s of def.solids){const base=h(s.x,s.z),top=base+s.h;
  if(s.id.includes('tree')){
   detail(s,s.x,base+s.h/2,s.z,s.w*.8,s.h,s.d*.8,isHeaven?0x967d61:0x49494a);
   if(isHeaven)for(let j=0;j<5;j++){const a=j*TAU/5;at('round',s.x+Math.cos(a)*1.25,top+.65+(j%2)*.5,s.z+Math.sin(a)*1.25,3.6,2.8,3.6,[0x8eaa92,0xb5c1a7,0xd7cdbb][j%3],{wind:2,foliage:true});}
   else for(let j=0;j<3;j++)at('box',s.x+(j-1)*.5,top-.25+j*.5,s.z,.17,1.9,.17,0x77716a,{r:[0,j*.7,(j-1)*.55],foliage:true});
  }else if(s.id.includes('lamp')||s.id.includes('return-post')){
   detail(s,s.x,base+s.h*.47,s.z,s.w*.56,s.h*.9,s.d*.56,isHeaven?gold:iron);
   detail(s,s.x,top-.4,s.z,s.w+.016,.55,s.d+.016,isHeaven?0xffdca5:amber,{em:.8,rough:.45});
   detail(s,s.x,top-.038,s.z,s.w+.016,.1,s.d+.016,isHeaven?gold:iron);
  }else if(s.id.includes('column')||s.id.includes('pier')||s.id.includes('support')||s.id.includes('north-gate')){
   detail(s,s.x,base+.17,s.z,s.w+.02,.34,s.d+.02,isHeaven?gold:iron);
   detail(s,s.x,top-.16,s.z,s.w+.02,.34,s.d+.02,isHeaven?gold:iron);
   for(const zsign of[-1,1])detail(s,s.x,base+s.h*.5,s.z+zsign*(s.d/2+.004),s.w*.25,s.h*.76,.035,isHeaven?0xc1ac7e:0x8b867b);
  }else if(s.id.includes('planter')){
   detail(s,s.x,top+.012,s.z,s.w-.12,.025,s.d-.12,0x596951);
   for(let j=0;j<16;j++){const x=s.x-s.w/2+.6+(j%8)*(s.w-1.2)/7,z=s.z+(j<8?-.8:.8);at('leaf',x,top,z,.2,.55,.22,0x8eaa92,{wind:1,foliage:true});at('octa',x,top+.5,z,.27,.23,.27,j%3?0xf1e7d4:0xc84660,{foliage:true});}
  }else if(s.id.includes('bench')||s.id.includes('table')||s.id.includes('seat')||s.id.includes('chair')){
   detail(s,s.x,top-.034,s.z,s.w,.09,s.d,isHeaven?0xbd9d6a:0x796854);
   for(let j=0;j<4;j++)detail(s,s.x-s.w*.34+j*s.w*.22,top+.014,s.z,s.w*.015,.018,s.d*.9,isHeaven?0xf0cd80:0xaaa69a);
  }else{
   // Working buildings, rock/iron masses, cargo and cover gain real front/back
   // faces. Deliberately closed doors are not misleading usable interiors.
   const faceZ=s.z+s.d/2+.006;
   detail(s,s.x,top-.08,s.z,s.w,.18,s.d,isHeaven?gold:iron);
   const count=Math.min(6,Math.max(1,Math.floor(s.w/2.5)));
   for(let j=0;j<count;j++){const x=s.x-s.w/2+(j+.5)*s.w/count;detail(s,x,base+s.h*.5,faceZ,Math.min(.9,s.w/count*.65),Math.min(1.4,s.h*.5),.025,isHeaven?0x7e8494:0x151617);}
   if(!isHeaven&&s.id.includes('spine'))for(let j=0;j<6;j++)detail(s,s.x-s.w*.35+j*s.w*.14,base+s.h*.7,s.z-s.d/2-.006,.06,s.h*.5,.03,0x9e251f,{em:.28});
  }
 }
 // Flush paving and arrow stones show both directions. No raised art can
 // masquerade as a supported terrace or change the canonical flat surface.
 for(const [lineIndex,line]of routes[def.id].entries())for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(let distance=0;distance<length;distance+=2.6){
   const t=distance/length,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
   if(!clear(def,x,z,1.6))continue;
   const r=[0,Math.atan2(b[0]-a[0],b[1]-a[1]),0];
   box(x,h(x,z)+.014,z,2.4,.025,1.8,isHeaven?0xd8ceb4:0x8b8a7c,{r,paving:true,rough:1});
   // A narrow craft inlay rests on the paving top. Its color indicates the
   // existing lower route, without creating a waypoint or interaction.
   if(isHeaven&&lineIndex<2)box(x,h(x,z)+.0325,z,.28,.012,1.56,lineIndex===0?silver:ruby,{r,routeInlay:lineIndex===0?'mirror-causeway':'ruby-arcade',rough:.9});
  }
 }
 if(isHeaven)for(const [tag,x,color]of[['ruby-arcade',-.6,ruby],['mirror-causeway',.6,silver]])box(x,h(x,17)+.0325,17,.32,.012,.85,color,{routeFork:tag,rough:.9});
 for(const p of def.points){at('disc',p.x,h(p.x,p.z)+.035,p.z,p.kind==='return'?3:1.5,1,p.kind==='return'?3:1.5,p.kind==='return'?(isHeaven?gold:amber):(isHeaven?0xc5b385:0xaca99a),{markerId:p.id,rough:.65});}
 // A public instrument and two response fittings use solid-backed frames.
 if(isHeaven){
  const s=def.solids.find(s=>s.id==='heaven-garden-instrument'),b=h(s.x,s.z);
  for(let j=0;j<6;j++)at('cylinder',s.x-1.5+j*.6,b+s.h,s.z,.18,2.8-(j%3)*.4,.18,gold,{ornament:true});
  at('ring',s.x,b+4.3,s.z,3.7,3.7,.18,gold,{ornament:true});
  // Skyline-facing arcade lintels are above the head corridor, rooted at the
  // physical columns. They supply shade, never a ground door/collider.
  for(let i=0;i<5;i++)box(-35,h(-35,-12-i*10)+5.53,-12-i*10,15.2,.32,1.35,bone,{overhead:true,cutaway:true});
  for(const [x,z,w,d,y]of[[-48,-31,10,34,6.2],[41,-28,12,18,5.1],[43,-64,10,13,4.4]])at('roof',x,h(x,z)+y,z,w,2.2,d,isHeaven?0xb89d84:iron,{overhead:true,cutaway:true});
  box(0,h(0,-102)+14.16,-102,38,.4,4,bone,{overhead:true,cutaway:true});
  at('octa',0,h(0,-102)+15.8,-102,1.8,2.1,1.2,ruby,{ornament:true,em:.15});
 }else{
  // The retired kiln's patched open front faces the arrival and return road.
  // The shared renderer can reveal this complete roof in the main view.
  // The slab and patched ribs remain present for reflection and shadow art.
  box(-10,h(-10,19)+4.38,19,24,.28,19,0x5b6268,{overhead:true,cutaway:true,worldRoof:'hell-refuge'});
  for(let i=0;i<6;i++)box(-20+i*4,h(-10,19)+4.56,19,.18,.12,19,0x8b867b,{overhead:true,cutaway:true,worldRoof:'hell-refuge'});
  const s=def.solids.find(s=>s.id==='hell-refuge-ember-hearth');
  box(s.x,h(s.x,s.z)+s.h-.09,s.z,s.w*.8,.12,s.d*.8,0xb96e43,{worldSolidId:s.id,em:.5});
  // The bell is suspended high above its closed physical base, with credible
  // support endpoints. This is quiet industrial scenery, not a Bell-Bearer.
  box(-2,h(-2,-96)+10.2,-96,51,.4,1.2,iron,{overhead:true,cutaway:true});
  for(let i=0;i<9;i++)at('ring',-11,h(-11,-101)+8.9-i*.35,-101,.35,.5,.15,iron,{ornament:true,r:[0,i%2*Math.PI/2,0]});
  at('cone',-11,h(-11,-101)+5.1,-101,3.8,1.5,3.8,0x81766a,{ornament:true});
  at('cylinder',-11,h(-11,-101)+6.4,-101,2.8,.3,2.8,iron,{ornament:true});
 }
 // Fixed-seed low foliage avoids route strips, points and physical furniture.
 // This work never reads the player's location, quest objectives or inventory.
 for(let i=0;i<290;i++){const x=def.bounds.minX+3+rnd()*(def.bounds.maxX-def.bounds.minX-6),z=def.bounds.minZ+3+rnd()*(def.bounds.maxZ-def.bounds.minZ-6);if(!clear(def,x,z,1)||routeDistance(def,x,z)<3||def.points.some(p=>Math.hypot(x-p.x,z-p.z)<4))continue;
  const size=.12+rnd()*.12;at('leaf',x,h(x,z)+.01,z,size,isHeaven?.4+rnd()*.3:.22+rnd()*.18,size,isHeaven?0xb4bd9c:0x92816c,{wind:1,foliage:true,r:[0,rnd()*TAU,0]});
 }
 // Distant artwork has no route, camera clearance or quest authority. Its
 // silhouette is explicitly beyond the closed northern walking boundary.
 for(let i=0;i<17;i++){const x=-100+i*12,z=-166-(i%4)*9,height=19+(i*17%28),color=isHeaven?(i%3?0xc4baa4:0xa7a5ae):(i%3?0x494448:0x655053);
  box(x,height/2-7,z,7+(i%3)*2,height,9,color,{skyImage:true,distantArt:true});
  if(isHeaven){at('cone',x,height-7,z,9+(i%3)*2,5.5,11,0xcab991,{skyImage:true,distantArt:true});box(x,height-1.4,z,.4,3,.4,gold,{skyImage:true,distantArt:true});}
  else{box(x,height-7,z,8+(i%3)*2,.8,10,iron,{skyImage:true,distantArt:true});box(x,height-5.7,z,2.5,.9,2.5,0x9e251f,{em:.45,skyImage:true,distantArt:true});}
 }
 for(let i=0;i<12;i++){const x=-118+i*22,z=-185-(i%3)*10;at('mountain-ridge',x,-13,z,38,30+(i%4)*8,45,isHeaven?0xa5a3a3:0x4d474b,{skyImage:true,distantArt:true,rough:1});}
 if(isHeaven){for(let i=0;i<7;i++)at('round',-72+i*23,23+(i%3)*3,-151,34,9,15,[0xd2bbc1,0xdcccbf,0xc5bbc8][i%3],{skyImage:true,distantArt:true});
  at('cylinder',8,22,-188,.5,73,.5,0xf0cd80,{skyImage:true,distantArt:true,em:.55});for(let i=0;i<3;i++)at('ring',8,50+i*15,-188,15+i*7,15+i*7,.5,gold,{skyImage:true,distantArt:true,em:.1});
 }else{
  // A sagging Procession Chain joins distant foundry towers. The rings are
  // static authored vista geometry, with no thousands-of-bodies simulation.
  for(let i=0;i<35;i++)at('ring',-96+i*6,39-11*Math.sin(i/34*Math.PI),-159,1.7,2.4,.35,0x81766a,{r:[0,i%2*Math.PI/2,0],skyImage:true,distantArt:true});
  for(let i=0;i<8;i++)at('round',-80+i*23,34+i%3*7,-177,13,18+i%4*4,13,0x62565b,{skyImage:true,distantArt:true});
 }
 // A claimed survey leaves one small useful record. It cannot mint a reward,
 // restore the main saga or write through the supplied simulation projection.
 const claimed=options.sim?.state?.journeys?.realms?.[def.id]?.firstClaimed===true;
 if(claimed){const x=isHeaven?-15:-16,z=isHeaven?2:13,s=def.solids.find(s=>s.id===(isHeaven?'heaven-rielle-bench':'hell-tovan-bench'));box(x,h(x,z)+s.h+.025,z,.78,.04,.55,isHeaven?0xf0cd80:0xb1ada1,{surveyRecord:true});}
 return{realmId:def.id,instances,distantInstances,localInstances:instances-distantInstances};
}
const api={realms,decorate};G.RealmWorldHeavenHell=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
