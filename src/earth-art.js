/* Earth E1 — Hearthwater Vale procedural geography. */
(function(G){'use strict';
const C=G.RealmEarth,TAU=Math.PI*2,h=C.height,{hex,blend}=G.RealmEngine;
const col={grass:0x70865e,meadow:0x929768,stone:0xaaa58d,path:0xb0a181,wood:0x67513a,roof:0x766754,leaf:0x648657,fruit:0xc47b51,water:0x577c7a,gold:0xc2a86c};
const decor={cameraSolid:false,rough:.96,cutaway:true};
const paths=[
 [[0,25],[0,17],[0,10],[-7,5],[-12,-3],[-14,-12],[-14,-22],[-10,-30],[0,-35],[0,-44]],
 [[0,10],[7,5],[13,-3],[14,-12],[14,-22],[11,-30],[0,-35],[0,-44]],
 [[-14,-22],[-12,-24]],
 [[-7,5],[-10,4],[-13,4]]
];
function pathDistance(x,z){let best=Infinity;for(const ps of paths)for(let i=1;i<ps.length;i++){const u=ps[i-1],v=ps[i],dx=v[0]-u[0],dz=v[1]-u[1],d=dx*dx+dz*dz,t=d?Math.max(0,Math.min(1,((x-u[0])*dx+(z-u[1])*dz)/d)):0;best=Math.min(best,Math.hypot(x-u[0]-dx*t,z-u[1]-dz*t));}return best;}
function paving(a,points,width=1.7){for(let i=1;i<points.length;i++){const u=points[i-1],v=points[i],d=Math.hypot(v[0]-u[0],v[1]-u[1]);for(let t=0;t<d;t+=.68){const f=t/d,x=u[0]+(v[0]-u[0])*f,z=u[1]+(v[1]-u[1])*f;if(z>C.BRIDGE.from&&z<C.BRIDGE.to)continue;if(C.walkable(x,z,.08))a.add('disc',x,h(x,z)+.025,z,width,1,width,col.path,{rough:1,cameraSolid:false,r:[Math.atan2(h(x,z-.1)-h(x,z+.1),.2),0,0]});}}}
function roof(a,x,y,z,w,rise,d,color){
 a.add('roof',x,y,z,w,rise,d,color,{rough:.94,cutaway:true,cameraSolid:true});
 const slope=Math.atan2(rise,w/2),run=Math.hypot(w/2,rise);
 for(const side of[-1,1])for(let row=0;row<4;row++)for(let tile=0;tile<5;tile++){
  const f=(row+.5)/4;a.box(x+side*w/2*(1-f),y+rise*f+.035,z-d/2+(tile+.5)*d/5,run/4+.03,.055,d/5-.025,blend(hex(color),hex(0xbdab84),((row+tile*3)%5)*.04),{...decor,r:[0,0,-side*slope]});
 }
 a.box(x,y+rise+.03,z,.16,.12,d+.14,0x928064,decor);
 for(const side of[-1,1]){a.box(x+side*w/2,y,z,.14,.18,d+.13,col.wood,decor);for(const end of[-1,1])a.beam([x+side*w/2,y,z+end*d/2],[x,y+rise,z+end*d/2],.16,col.wood);}
}
function crate(a,x,z,size=.7){const y=h(x,z),d=size*.8;a.box(x,y+size*.42,z,size,size*.84,d,0x8c714c,decor);for(const side of[-1,1]){for(let i=0;i<4;i++)a.box(x-size/2+(i+.5)*size/4,y+size*.43,z+side*d/2,size/4-.022,size*.78,.04,i%2?0xa38b5c:0x8e7750,decor);for(const yy of[y+.09,y+size*.74])a.box(x,yy,z+side*(d/2+.03),size+.07,.085,.06,col.wood,decor);}return y+size*.84;}
function orchard(a){
 // Broad uneven crowns and forked limbs give the fruit trees a worked orchard
 // silhouette. Foliage is cutaway-capable and never a camera or walking solid.
 for(let row=0;row<3;row++)for(let i=0;i<5;i++){
  const x=-12+row*3,z=5-i*2.6;if(pathDistance(x,z)<1.25)continue;const b=h(x,z),q=row*2.1+i*.7;
  a.add('cylinder',x,b,z,.26,1.9,.25,col.wood,decor);
  for(const side of[-1,1]){a.beam([x,b+1.05,z],[x+side*.53,b+2.2,z+side*.22],.13,0x7b6242);a.beam([x,b+.24,z],[x+side*.42,b+.025,z+side*.23],.14,0x67563c);}
  for(let l=0;l<4;l++){const angle=q+l*2.4;a.add('round',x+Math.sin(angle)*.56,b+2.08+(l%2)*.37,z+Math.cos(angle)*.47,1.65,1.43,1.65,[0x547548,0x779455,0x628552,0x8c9d65][(l+i)%4],{...decor,wind:2});}
  for(let f=0;f<5;f++){const angle=q+f*2.1;a.add('round',x+Math.sin(angle)*.88,b+2.03+(f%3)*.20,z+Math.cos(angle)*.78,.16,.17,.16,f%2?0xba7146:0xd09a57,decor);}
 }
 // An orchard shed uses the existing declared solid. The dark door and stone
 // threshold remain readable; work objects sit against its closed sides.
 const x=-8,z=0,b=h(x,z),front=2.12;
 a.box(x,b+1.75,z,4.4,3.5,4.2,0xb8ab88,{rough:.97});
 for(let i=0;i<8;i++){const xx=x-1.96+i*.56;for(const side of[-1,1])a.box(xx,b+1.95,side*2.14,.49,2.95,.08,i%3?0xb5a480:0xa99874,decor);}
 for(const side of[-1,1]){
  a.box(x+side*2.15,b+1.83,z,.16,3.32,4.18,col.wood,decor);
  for(const end of[-1,1])a.box(x+side*2.10,b+1.83,end*2.14,.18,3.36,.18,col.wood,decor);
  a.box(x,b+.3,side*2.15,4.38,.48,.13,0x999681,decor);a.box(x,b+3.48,side*2.18,4.6,.19,.2,col.wood,decor);
  a.beam([x+side*2.02,b+.58,front+.02],[x+side*.94,b+2.8,front+.02],.105,0x8b7250);
 }
 roof(a,x,b+3.5,z,5,1.5,4.8,col.roof);
 for(const side of[-1,1]){const zz=side*2.42;a.box(x,b+3.62,zz,4.25,.12,.11,col.wood,decor);a.box(x,b+4.04,zz,.14,.99,.10,col.wood,decor);for(const dx of[-.45,.45])a.beam([x+dx,b+3.67,zz],[x,b+4.62,zz],.09,0x8a7353);}
 a.box(x,b+1.2,front,1.3,2.4,.10,0x3d473b,{rough:.95});
 for(let i=0;i<6;i++)a.box(x-.54+i*.215,b+1.16,front+.065,.195,2.28,.035,i%2?0x726148:0x685740,decor);
 for(const yy of[b+.4,b+1.93])a.box(x,yy,front+.1,1.22,.09,.04,0x41463c,decor);
 for(const dx of[-.75,.75])a.box(x+dx,b+1.25,front+.06,.16,2.5,.18,col.wood,decor);
 a.box(x,b+2.5,front+.06,1.65,.18,.2,col.wood,decor);a.box(x+.4,b+1.1,front+.13,.08,.08,.04,col.gold,decor);
 a.box(x,b+.09,front+.33,1.65,.18,.63,col.stone,{...decor,wet:1});
 // Window, turned shutter, stacked split logs and fruit crates.
 a.box(-10.24,b+2.15,-.5,.06,1.06,1.15,0x3e5042,decor);a.box(-10.28,b+2.15,-.5,.04,.87,.93,0xaeb99a,decor);
 for(const zz of[-1.12,.12])a.box(-10.32,b+2.15,zz,.08,1.18,.17,col.wood,decor);
 a.box(-10.34,b+2.15,-.5,.07,.07,1.17,col.wood,decor);
 for(let i=0;i<6;i++){const xx=-9.6+(i%3)*.4,yy=b+.17+Math.floor(i/3)*.28;a.add('cylinder',xx,yy,-2.25,.25,1.1,.25,0x806745,{...decor,r:[Math.PI/2,0,0]});a.add('disc',xx,yy,-2.27,.22,1,.22,0xb9a17a,{...decor,r:[Math.PI/2,0,0]});}
 for(const [cx,cz]of[[-5.5,-1.65],[-5.5,-.65]]){const top=crate(a,cx,cz,.66);for(let i=0;i<6;i++)a.add('round',cx+(i%3-.9)*.16,top+.035,cz+(Math.floor(i/3)-.5)*.21,.16,.16,.16,i%2?col.fruit:0xd7ad64,decor);}
 const by=h(-5.54,1.13);a.box(-5.54,by+.83,1.13,.73,.12,1.38,0x9f8258,decor);for(const zz of[.65,1.62])a.box(-5.54,by+.42,zz,.62,.78,.12,col.wood,decor);a.box(-5.54,by+.93,1.13,.39,.06,.6,0xc8bb8c,decor);
}
function mill(a){
 G.RealmMillGateArt.frame(a,h(5.2,-6));
 // The wheel and its covered bearing are entirely within the already blocked
 // pond. This is visual machinery, with no new building or route authority.
 const x=3.55,z=-10.9,b=1.36,cy=b+1.35;
 for(const zz of[-12.4,-9.4]){a.box(3.56,b+.49,zz,1.35,.98,.56,0x9c9c87,decor);a.box(3.56,b+1.55,zz,.2,1.35,.22,col.wood,decor);}
 a.box(3.56,b+2.18,z,.24,.24,3.55,col.wood,decor);
 roof(a,3.2,b+2.32,z,2.35,.83,3.8,0x625e50);
 // Set the visual roof's camera policy to decor; the fixed watercourse remains
 // the only authority here and the path-side gate stays exposed.
 a.map.roof[a.map.roof.length-1].cameraSolid=false;
 for(const dx of[-.20,.20])a.add('ring',x+dx,cy,z,2.65,2.65,.18,0x70583d,{...decor,r:[0,Math.PI/2,0]});
 a.add('cylinder',x-.47,cy,z,.23,.95,.23,0x504e42,{...decor,r:[0,0,-Math.PI/2]});
 for(let i=0;i<12;i++){const zz=-7.4-i*1.45;a.box(4.02,1.48,zz,.35,.28,1.31,i%3?0xa3a58d:0x858e7b,{...decor,wet:1});a.box(-4.02,1.49,zz,.38,.3,1.32,0x8d9c84,{...decor,wet:1});}
 // A boardwalk landing beside Ansel, flush with the road rather than a new
 // obstacle. Tools stay well away from the live root and gate cues.
 // One measured surface proof, keeping the eight original boxes and their
 // transforms. The narrow UV strip follows each landing board's long axis.
 for(let i=0;i<7;i++)a.add('timber-panel',7.8,h(7.8,-8.1)+.035,-8.65+i*.18,2.25,.07,.16,i%2?0x8f7753:0x9c855e,decor);
 a.add('timber-panel',8.75,h(8.75,-9.1)+.35,-9.1,.8,.7,.7,0x927751,decor);a.box(8.75,h(8.75,-9.1)+.73,-9.1,.5,.08,.42,0xc1b79b,decor);
}
function shelter(a){
 const x=-12,z=-25,b=h(x,z),stone=0xaca68e;
 a.box(x,b+1.55,-26,6.6,3.1,.5,0x929782);
 a.box(-15,b+1.55,-23.8,.5,3.1,4.8,0x929782);a.box(-9,b+1.55,-24.6,.5,3.1,3.2,0x929782);
 // Dressed courses follow the exact existing three-wall footprint.
 for(let row=0;row<7;row++)for(let i=0;i<7;i++){const xx=x-2.82+i*.94;a.box(xx,b+.23+row*.42,-25.73,.88,.37,.065,(row+i)%4?stone:0x858e78,decor);a.box(xx,b+.23+row*.42,-26.27,.88,.37,.065,(row+i)%3?stone:0x929581,decor);}
 for(const side of[-1,1]){const xx=side<0?-14.73:-9.27;for(let row=0;row<7;row++)for(let i=0;i<(side<0?5:3);i++)a.box(xx,b+.23+row*.42,-26+i*.89,.065,.37,.82,(row+i)%3?stone:0x8e947e,decor);}
 roof(a,x,b+3.1,-24.2,7.3,1.5,5.2,0x655d4c);
 for(const xx of[-14.7,-9.3]){a.box(xx,b+1.63,-22.1,.18,3.25,.18,col.wood,decor);a.beam([xx,b+2.3,-22.1],[xx+(xx<x?.58:-.58),b+3.13,-22.1],.15,col.wood);}
 a.box(x,b+3.12,-21.67,7.2,.22,.20,col.wood,decor);a.box(x,b+.045,-23.5,5.2,.09,3.5,0x9b9274,decor);
 a.bench(-12,-24.65,0,b,{cameraSolid:false,cutaway:true});a.box(-11,b+2.1,-26.25,1.5,1.15,.06,0x52624f,decor);a.box(-11,b+2.1,-26.18,1.2,.9,.04,0xa6b99a,{...decor,em:.04});
 // Dry bundles, a stone hearth and hung crockery suggest shelter is useful.
 for(let i=0;i<5;i++)a.add('cylinder',-14.25+(i%2)*.26,b+.15+Math.floor(i/2)*.22,-25.06,.20,.75,.20,0x816949,{...decor,r:[Math.PI/2,0,0]});
 a.box(-9.72,b+.14,-25.08,.76,.28,.9,0x757d6c,decor);a.add('round',-9.72,b+.44,-25.08,.43,.43,.43,0x8c6950,decor);a.add('disc',-9.72,b+.65,-25.08,.28,1,.28,0x454d40,decor);
 a.box(-14.68,b+1.84,-24.6,.12,.09,1.2,col.wood,decor);for(let i=0;i<3;i++)a.add('round',-14.6,b+1.52,-25.02+i*.36,.14,.29,.23,0xbbad85,decor);
}
function terrain(a,rnd){
 for(let z=-52;z<29;z+=.5){let runs=C.PATCHES.filter(p=>p.id!=='bridge'&&z+.5>p.z-p.d/2&&z<p.z+p.d/2).map(p=>[p.x-p.w/2,p.x+p.w/2]).sort((u,v)=>u[0]-v[0]),merged=[];
  for(const p of runs){const last=merged[merged.length-1];if(last&&p[0]<=last[1])last[1]=Math.max(last[1],p[1]);else merged.push(p.slice());}
  for(const [lo,hi]of merged){const x=(lo+hi)/2,ha=h(x,z),hb=h(x,z+.5),ang=Math.atan2(ha-hb,.5),green=z<-25?col.meadow:col.grass;a.box(x,(ha+hb)/2-.045,z+.25,hi-lo,.09,Math.hypot(.5,hb-ha)+.002,green,{rough:1,terrain:true,cameraSolid:false,cutaway:false,r:[ang,0,0]});a.box(x,Math.min(ha,hb)-2.55,z+.25,hi-lo,5,.502,0x756d5a,{cameraSolid:false,cutaway:false});}
 }
 for(const ps of paths)paving(a,ps);
 // Mill pond/watercourse is a visible reason the direct center is not walkable in E1.
 a.box(0,1.32,-12.5,8.8,.08,33,col.water,{rough:.25,wet:1,cameraSolid:false,cutaway:false});
 for(let i=0;i<9;i++){let z=-7-i*2.1;a.add('disc',Math.sin(i*.8)*1.2,h(0,z)-.04,z,.55,1,.55,0x6e8f69,{cameraSolid:false,rough:.8});}
 // Low stone walls make the orchard road legible without turning every fence into a collision maze.
 for(let z=6;z>-9;z-=1.15){if(z>2.7&&z<5.3)continue;a.box(-15.6,h(-15.6,z)+.28,z,.5,.56,1.02,col.stone,{cameraSolid:true});}
 orchard(a);
 // A worksite gateway: split wall, timber posts and a small packed load.
 for(const z of [2.8,5.2]){const b=h(-14.7,z);a.box(-14.7,b+.85,z,.22,1.7,.22,col.wood,{cameraSolid:false});}
 for(const z of [3.1,3.65])a.box(-14.5,h(-14.5,z)+.28,z,.7,.56,.46,col.wood,{cameraSolid:false});
 a.box(-14.5,h(-14.5,3.4)+.6,3.4,.78,.12,1.12,0xb3a07b,{cameraSolid:false});
 mill(a);
 // Quarry stacks: pale split faces, narrow courses and timber separation make
 // reserved repair stone distinct from the darker natural ground.
 for(const [x,z,s]of [[11.7,-18,1],[14,-21,.7],[10,-24,.8]]){
  const b=h(x,z);for(let i=0;i<4;i++){const xx=x+(i%2)*.8,yy=b+.25+i*.37,zz=z+(i%3)*.35;a.box(xx,yy,zz,1.25,.45,.72,i%2?0xb0ab92:0x999d88,{rough:1});a.box(xx-.1,yy+.235,zz,1.08,.025,.63,0xc4bca0,decor);for(let j=0;j<3;j++)a.box(xx-.38+j*.32,yy,zz+.367,.028,.22,.015,0x727b6b,decor);if(i<3)a.box(xx,yy+.25,zz+.02,1.3,.055,.09,0x887455,decor);}
 }
 for(let i=0;i<6;i++){const x=10.7+(i%3)*.38,z=-19.7+Math.floor(i/3)*.3;a.add('octa',x,h(x,z)+.09,z,.26,.14,.25,0xa7aa8c,{...decor,r:[0,i*.9,0]});}
 shelter(a);
 // Bellweather bell is a distant orientation landmark beyond the qualified boundary.
 const bb=h(0,-48);for(const x of[-2.4,2.4])a.box(x,bb+4.2,-50,.55,8.4,.55,0x82765e,{cameraSolid:false});
 a.box(0,bb+7.7,-50,5.2,.45,.6,0x82765e,{cameraSolid:false});a.add('bell',0,bb+6.7,-49.9,1.2,1.6,1.2,0xc6aa6b,{cameraSolid:false,em:.06});
 G.RealmBridgeArt.crossing(a);
 G.RealmBridgeArt.shoreline(a);
 G.RealmBridgeArt.mountains(a);
 // Field dressing respects route clearance.
 for(let i=0;i<850;i++){let x=-18+rnd()*36,z=-49+rnd()*74;if(!C.walkable(x,z,.45)||pathDistance(x,z)<1.25)continue;let b=h(x,z),s=.07+rnd()*.11;a.add('leaf',x,b+.02,z,s,s*2.6,s,i%7===0?0xb3a56f:0x678150,{wind:1,rough:1,cameraSolid:false,r:[0,rnd()*TAU,0]});if(i%33===0)a.add('octa',x,b+.18,z,.10,.16,.10,[0xdfc78f,0xcaa6a1,0xd9d3a2][i%3],{cameraSolid:false});}
 // Larger quiet meadow clumps vary the greens while yielding to routes,
 // carved evidence and residents. Reeds are confined to the blocked pond.
 for(let i=0;i<110;i++){
  const x=-16+rnd()*32,z=-46+rnd()*62;if(!C.walkable(x,z,.55)||pathDistance(x,z)<1.9||C.POINTS.some(p=>Math.hypot(p.x-x,p.z-z)<2.25)||G.RealmEarthNotes.MARKS.some(p=>Math.hypot(p.x-x,p.z-z)<1.9))continue;
  const b=h(x,z),s=.28+rnd()*.25;
  for(let j=0;j<3;j++)a.add('leaf',x+Math.sin(j*2.1)*.15,b,z+Math.cos(j*2.1)*.15,s,.43+rnd()*.25,s,[0x879765,0x5f7d50,0x9ca477][i%3],{...decor,wind:1,r:[0,j*2.1,0]});
 }
 for(let i=0;i<30;i++){const side=i%2?1:-1,x=side*(3.45+(i%3)*.12),z=-14.5-Math.floor(i/2)*.65;for(let j=0;j<3;j++){const xx=x+j*.10,y=1.36,ht=.54+(i%4)*.15;a.add('leaf',xx,y,z,.07,ht,.08,0x7e8d60,{...decor,wind:1,r:[0,j*2.3,0]});if(j===1)a.add('round',xx,y+ht*.86,z,.10,.22,.10,0xbab591,decor);}}
 // Distant wooded hills are scenery only.
 for(let i=0;i<26;i++){let a0=i/26*TAU,r=95+rnd()*22,x=Math.cos(a0)*r,z=-12+Math.sin(a0)*r*.8,b=1.0+rnd()*1.5;const sx=14+rnd()*8,sy=8+rnd()*10,sz=14+rnd()*8;a.add('round',x,-1.2,z,sx,sy,sz,i%3?0x60755d:0x75846b,{cameraSolid:false,cutaway:false,rough:1});if(i%2===0)a.add('round',x,-1.2+sy/2-1.1,z,7,4,7,0x647858,{cameraSolid:false,cutaway:false,rough:1});}
 // An authored tree line supplies scale below the hill masses; it does not
 // pretend the unqualified distance is a traversable forest.
 for(let i=0;i<30;i++){const side=i%2?1:-1,x=side*(27+(i%5)*2.1),z=-48+Math.floor(i/2)*5.2,base=-.3,s=.75+(i%4)*.16;a.add('cylinder',x,base,z,.28*s,3.1*s,.28*s,0x6d7155,{cameraSolid:false,rough:1});for(let j=0;j<3;j++)a.add('cone',x,base+(1.45+j*.86)*s,z,(3.3-j*.65)*s,2.3*s,(3.3-j*.65)*s,[0x57745a,0x617b5c,0x7b8c68][j],{cameraSolid:false,rough:1,wind:2,cutaway:true});}
}
function sign(a,x,z,textColor=col.gold){
 const b=h(x,z);a.box(x,b+.85,z,.18,1.7,.18,col.wood,decor);a.box(x,b+1.55,z,2.3,.75,.12,0x826c4b,decor);
 // Crafted plank edges and the established diamond distinguish a waymarker
 // without pretending decorative marks are additional readable quest text.
 for(const side of[-1,1]){const zz=z+side*.071;for(const dy of[-.30,.30])a.box(x,b+1.55+dy,zz,2.19,.06,.025,0xab8d5c,decor);for(const dx of[-1.06,1.06])a.box(x+dx,b+1.55,zz,.06,.65,.025,col.wood,decor);for(let i=0;i<3;i++){a.box(x-.69,b+1.40+i*.12,zz,.31+(i%2)*.11,.018,.013,0x5c513b,decor);a.box(x+.59,b+1.44+i*.1,zz,.45-(i%2)*.1,.018,.013,0x5c513b,decor);}}
 a.add('octa',x,b+1.57,z+.09,.17,.17,.04,textColor,{em:.08,cameraSolid:false});
}
function make(a){a.begin(C.ROOM);a.e.theme='earth';a.e.earthWater=C.BRIDGE;a.e.isInterior=false;a.e.noWater=false;a.e.ambientOverride=.78;const rnd=G.RealmCore.rng(18092026);terrain(a,rnd);for(const [x,z]of [[-8,3],[-13,4],[7,2],[13,-13],[12,-26],[-12,-23],[0,-43]])sign(a,x,z);a.commit();}
function story(out,sim,t,a){
 const s=sim.state.adventure.earthStory,quiet=sim.state.settings.reducedMotion,clock=quiet?0:t,done=id=>s.steps.includes(id);
 const box=(x,y,z,w,ht,d,c,r)=>out.box.push({p:[x,y,z],s:[w,ht,d],c,r:r||[0,0,0],rough:.9,cameraSolid:false});
 const round=(x,y,z,w,ht,d,c)=>out.round.push({p:[x,y,z],s:[w,ht,d],c,rough:.9});
 // Residents stand beside supported paths. They never own progression or collision.
 a.droverFrame=G.RealmDroverArt.draw(out,{state:s,time:sim.elapsed,reducedMotion:quiet,ground:h});
 const ansel=G.RealmMillwrightArt.ANCHOR;
 a.millwrightFrame=G.RealmMillwrightArt.draw(out,{base:h(ansel.x,ansel.z),time:sim.elapsed,reducedMotion:quiet});
 a.quarryFrame={actor:G.RealmQuarryArt.draw(out,{state:s,time:sim.elapsed,reducedMotion:quiet,ground:h}),works:G.RealmQuarryArt.works(out,{state:s,ground:h})};
 // The drover module projects dispatch/arrival; only the rules can move the load.
 // Small headrace machinery remains on the bank; it does not open collision through the pond.
 const gy=h(5.2,-6);a.millGateFrame=G.RealmMillGateArt.draw(out,done('mill-gate'),gy);
 if(!done('mill-root')){box(5.15,gy+.2,-4.5,.28,.25,1.9,0x5a503d,[0,.5,.25]);box(5.55,gy+.23,-4.4,.8,.14,.18,0x5a503d,[0,-.5,0]);}
 // Only the repaired mechanism turns. Reduced motion freezes a clear wheel
 // silhouette; this presentation never completes or pays the repair itself.
 const phase=done('mill-gate')?(quiet?0:sim.elapsed)*.35:0;
 for(let i=0;i<10;i++){const angle=i/10*TAU+phase,x=3.55,y=2.71,z=-10.9;box(x,y+Math.sin(angle)*1.2,z+Math.cos(angle)*1.2,.65,.15,.43,0xa08454,[angle,0,0]);box(x,y,z,.10,.11,2.38,col.wood,[-angle,0,0]);}
 // Quarry presentation reads accepted release/packing; story rules own the work.
 if(done('detour-mark'))for(const [x,z]of [[11.4,-13],[-10.1,-22],[2,-35]]){const y=h(x,z);box(x,y+.6,z,.09,1.2,.09,col.wood);box(x+.25,y+1.08,z,.62,.3,.07,0xc4aa69);}
 // The rule point is the approach stance, one metre south of the tabletop.
 // Both base table and remembered preparations derive from that same anchor.
 if(s.arrived){const table=G.RealmGathering?.TABLE||{x:3.8,z:-44},x=table.x,z=table.z-1,y=h(x,z);box(x,y+.85,z,2.6,.15,1.4,0x9e8155);for(const dx of [-1,1])box(x+dx,y+.43,z,.14,.85,1.1,col.wood);box(x,y+.96,z,1.25,.04,.85,0xcdbd99);for(let i=0;i<3;i++)round(x-.5+i*.5,y+1.05,z,.34,.12,.34,0xbc985b);}
}
function draw(out,sim,t,a){if(sim.room!==C.ROOM)return;story(out,sim,t,a);const p=sim.state.player;if(!sim.state.settings?.reducedMotion){for(let i=0;i<5;i++){let q=t*.13+i*1.7,x=-4+Math.sin(q)*5,z=-30+Math.cos(q*.7)*4,b=h(x,z);out.box.push({p:[x,b+5+Math.sin(q*1.8)*.35,z],s:[.38,.045,.12],r:[0,q,.2],c:0x4c5f55});}}out.disc.push({p:[p.x,h(p.x,p.z)+.02,p.z],s:[.8,1,.8],c:0xd5bd83,rough:.8,em:.04});if(G.RealmGatheringArt)G.RealmGatheringArt.draw(out,sim,t,a);}
function gate(a){const b=1.3;a.box(C.GATE.x,b+.75,C.GATE.z,.18,1.5,.18,col.wood,{cameraSolid:false});a.box(C.GATE.x,b+1.35,C.GATE.z,1.9,.55,.12,0x826c4b,{cameraSolid:false});a.add('octa',C.GATE.x,b+1.38,C.GATE.z+.08,.12,.12,.04,col.gold,{em:.15,cameraSolid:false});}
G.RealmEarthArt={make,draw,gate};
})(globalThis);
