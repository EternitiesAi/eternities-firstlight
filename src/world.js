/* Authored procedural geometry; the mill uses embedded licensed timber maps. */
(function(G){'use strict';const{M,hex,blend}=RealmEngine,C=RealmCore,X=RealmCreative,TAU=Math.PI*2;
class WorldArt{
 constructor(engine){this.e=engine;this.room=null;this.time=0;this.map={};this.makeExterior();}
 add(kind,x,y,z,sx,sy,sz,c,opt={}){let a=this.map[kind]||(this.map[kind]=[]);a.push({p:[x,y,z],s:[sx,sy,sz],c,cutaway:y>2.2&&sy>1,...opt});}
 box(x,y,z,sx,sy,sz,c,opt){this.add('box',x,y,z,sx,sy,sz,c,opt);}
 // Detail beams share the box instance buffer. Their endpoints keep joinery on
 // the authored walls instead of enlarging navigation or camera obstacles.
 beam(from,to,width,c,opt={}){const d=to.map((v,i)=>v-from[i]),len=Math.hypot(...d);if(len<.001)return;const yy=d.map(v=>v/len),ref=Math.abs(yy[1])>.95?[1,0,0]:[0,1,0],xx=[ref[1]*yy[2]-ref[2]*yy[1],ref[2]*yy[0]-ref[0]*yy[2],ref[0]*yy[1]-ref[1]*yy[0]],n=Math.hypot(...xx);for(let i=0;i<3;i++)xx[i]/=n;const zz=[xx[1]*yy[2]-xx[2]*yy[1],xx[2]*yy[0]-xx[0]*yy[2],xx[0]*yy[1]-xx[1]*yy[0]],p=from.map((v,i)=>(v+to[i])/2);this.box(...p,width,len,width,c,{cameraSolid:false,cutaway:true,...opt,m:new Float32Array([...xx.map(v=>v*width),0,...yy.map(v=>v*len),0,...zz.map(v=>v*width),0,...p,1])});}
 commit(){this.e.viewShelters=Object.values(this.map).flat().filter(i=>i.worldRoof).map(i=>({minX:i.p[0]-i.s[0]/2,maxX:i.p[0]+i.s[0]/2,minZ:i.p[2]-i.s[2]/2,maxZ:i.p[2]+i.s[2]/2,base:i.p[1]-i.s[1]/2}));if(!this.room&&G.RealmWorldFoundationsArt)G.RealmWorldFoundationsArt.gate(this);if(!this.room&&G.RealmEarthArt)G.RealmEarthArt.gate(this);if(!this.room&&G.RealmCosmosArt)G.RealmCosmosArt.gate(this);if(!this.room&&G.RealmRoadArt)G.RealmRoadArt.gate(this);if(!this.room&&G.RealmAdventureArt)G.RealmAdventureArt.entrance(this);if(!this.room&&G.RealmSandboxArt)G.RealmSandboxArt.scenery(this);for(let[k,a]of Object.entries(this.map)){const rails=k==='box'?a.filter(i=>i.bridgeRail===true):[];this.e.batch(k,rails.length?a.filter(i=>i.bridgeRail!==true):a);if(rails.length)this.e.batch(k,rails,false,{railCutaway:true});}this.dynamicBox=this.e.batch('box',[],true);this.dynamicOcta=this.e.batch('octa',[],true);this.dynamicRound=this.e.batch('round',[],true);this.dynamicDisc=this.e.batch('disc',[],true);this.dynamicTimber=(this.room===G.RealmEarth?.ROOM||this.room===G.RealmElderwealdWorld?.extension.room)?this.e.batch('timber-panel',[],true):null;}
 begin(room){this.earthShoulderFrame=null;this.quarryFrame=null;this.droverFrame=null;this.millwrightFrame=null;this.millGateFrame=null;this.travelerPoseOwner=null;this.travelerMotion=null;this.travelerFrame=null;this.travelerParts=null;this.e.theme=null;this.e.worldAtmosphere=null;this.e.worldFog=null;this.e.worldFogCenter=null;this.e.cameraMedium=null;this.e.galleryFocus=null;this.e.worldRoofOpen=false;this.e.viewShelters=[];this.e.earthWater=null;this.e.railCutawayActive=false;this.e.noWater=false;this.e.surfacePick=null;this.e.ambientOverride=null;this.e.reflectionStrength=1;this.e.clear();this.e.isInterior=!!room;this.room=room;this.map={};}
 tree(x,z,s=1,style=0,base=1.2){let bark=0x68503c;this.add('cylinder',x,base,z,.42*s,2.6*s,.42*s,bark);for(let a of[-.6,.8,2.3])this.box(x+Math.sin(a)*.45*s,base+2*s,z+Math.cos(a)*.45*s,.18*s,1.2*s,.18*s,bark,{r:[.3,a,.55]});let colors=style===3?[0xd9a4ba,0xc489a5,0xe9bdbe]:style===1?[0xaab961,0x8fa856,0xbdc16f]:style===2?[0x87a897,0x669586,0xa0b59b]:[0x557d65,0x638f69,0x779c73];if(style===0){for(let i=0;i<3;i++)this.add('cone',x,base+(1.6+i*.85)*s,z,(3.2-i*.6)*s,2.2*s,(3.2-i*.6)*s,colors[i],{wind:2});}else{for(let i=0;i<7;i++){let a=i*2.4,r=i===0?0:1.05;this.add(style===3?'round':style===1?'round':'octa',x+Math.cos(a)*r*s,base+(3.25+(i%3)*.42)*s,z+Math.sin(a)*r*s,(2.25+(i%2)*.3)*s,(2.1+(i%3)*.23)*s,(2.15+(i%2)*.35)*s,colors[i%3],{r:[0,a,0],wind:2});}}}
 lamp(x,z,height=3.4,base=1.2){this.box(x,base+height/2,z,.13,height,.13,0x5a4735);this.box(x,base+height,z,.55,.12,.55,0x443c32);this.box(x,base+height-.35,z,.32,.54,.32,0xffd185,{em:1.4,rough:.35});this.add('cone',x,base+height+.07,z,.77,.37,.77,0x594739);this.box(x,base+.09,z,.48,.18,.48,0x777565);}
 bench(x,z,yaw=0,base=1.2,opt={}){let at=(a,b,c,sx,sy,sz,col)=>this.box(x+a*Math.cos(yaw)+c*Math.sin(yaw),base+b,z-a*Math.sin(yaw)+c*Math.cos(yaw),sx,sy,sz,col,{r:[0,yaw,0],...opt});for(let a of[-.72,.72])at(a,.38,0,.14,.75,.5,0x514c43);at(0,.74,0,1.95,.16,.68,0xa88d62);at(0,1.24,-.31,1.95,.52,.11,0xa68b62);}
 flowers(x,z,s=.7,base=1.35){for(let i=0;i<5;i++){let a=i*2.4;this.add('leaf',x+Math.cos(a)*.28,base,z+Math.sin(a)*.28,.11,s*.8,.1,0x547a48,{r:[0,a,0],wind:1,cameraSolid:false});this.add('octa',x+Math.cos(a)*.28,base+s*.7,z+Math.sin(a)*.28,.18,.20,.18,[0xdbc18c,0xbca5b4,0xf0dfb4][i%3],{cameraSolid:false});}}
 building(x,z,w,d,roof,wall=0xc8c0a5){
  const y=1.2,wood=0x5b4936,edge=0x8b7350,stone=0xa7a38c,detail={rough:.94,cameraSolid:false,cutaway:true},front=z+d/2;
  // Original wall, threshold and roof envelopes remain the camera authorities.
  this.box(x,y+.17,z,w+.5,.34,d+.5,0x767d71);
  this.box(x,y+1.75,z,w,3.3,d,wall,{rough:.95});
  this.add('roof',x,y+3.42,z,w+1.1,2,d+1,roof,{rough:.91,cutaway:true});
  // Pale, coursed river stone and substantial timber explain how it is built.
  for(let row=0;row<2;row++)for(let i=0;i<Math.ceil(w/.85);i++){const n=Math.ceil(w/.85),xx=x-w/2+(i+.5)*w/n;for(const side of[-1,1])this.box(xx,y+.16+row*.19,z+side*(d/2+.045),w/n-.045,.16,.14,blend(hex(stone),hex(0x7f8775),((i+row)%4)*.1),detail);}
  for(const side of[-1,1]){
   const zz=z+side*(d/2+.055);
   for(const xx of[x-w/2+.1,x,x+w/2-.1])this.box(xx,y+1.89,zz,.18,3.18,.18,wood,detail);
   for(const yy of[y+.55,y+2.65,y+3.39])this.box(x,yy,zz,w,.16,.18,wood,detail);
   this.beam([x-w/2+.18,y+.66,zz],[x-w*.20,y+2.57,zz],.115,edge);
   this.beam([x+w/2-.18,y+.66,zz],[x+w*.20,y+2.57,zz],.115,edge);
   for(const dir of[-1,1])this.beam([x+dir*(w/2+.45),y+3.49,zz+side*.35],[x,y+5.46,zz+side*.35],.16,wood);
   this.box(x,y+4.16,zz+side*.1,.14,1.48,.13,wood,detail);
   for(let i=-2;i<=2;i++)this.box(x+i*.23,y+3.76,zz+side*.12,.12,.53,.11,edge,detail);
  }
  for(const side of[-1,1]){
   const xx=x+side*(w/2+.04);
   for(const zz of[z-d/2+.1,z,z+d/2-.1])this.box(xx,y+1.88,zz,.17,3.2,.17,wood,detail);
   for(const yy of[y+.55,y+2.66,y+3.4])this.box(xx,yy,z,.17,.16,d,wood,detail);
   for(const dir of[-1,1]){
    const zz=z+dir*d*.28;this.box(xx,y+1.88,zz,.06,1.04,1.08,0x405650,detail);
    this.box(xx+side*.045,y+1.9,zz,.07,.81,.85,0xb4c8b3,{...detail,em:.06,rough:.45});
    this.box(xx+side*.09,y+1.9,zz,.08,1.17,.09,wood,detail);this.box(xx+side*.09,y+1.9,zz,.08,.08,1.16,wood,detail);
    for(const dz of[-.61,.61])this.box(xx+side*.08,y+1.9,zz+dz,.1,1.17,.16,edge,detail);
   }
  }
  // Individual shingle courses add value variation at both camera distances.
  const rw=w+1.1,rd=d+1,slope=Math.atan2(2,rw/2),run=Math.hypot(rw/2,2);
  for(const side of[-1,1])for(let row=0;row<4;row++)for(let tile=0;tile<6;tile++){
   const f=(row+.5)/4,xx=x+side*(rw/2)*(1-f),yy=y+3.42+2*f+.055,zz=z-rd/2+(tile+.5)*rd/6;
   this.box(xx,yy,zz,run/4+.04,.065,rd/6-.028,blend(hex(roof),hex((row+tile)%3?0xd1b691:0x423e3c),((row*3+tile)%5)*.035),{...detail,r:[0,0,-side*slope]});
  }
  this.box(x,y+5.47,z,.18,.14,d+1.16,edge,detail);
  for(const side of[-1,1])this.box(x+side*rw/2,y+3.42,z,.16,.2,d+1.14,wood,detail);
  // The door stays in its established place; daylight windows are restrained.
  this.box(x,y+1.17,front+.08,1.38,2.35,.18,0x384a44,{rough:.92});
  for(let i=0;i<6;i++)this.box(x-.55+i*.22,y+1.16,front+.185,.20,2.18,.045,i%2?0x64775e:0x596b54,detail);
  for(const dx of[-.79,.79])this.box(x+dx,y+1.23,front+.13,.19,2.46,.22,wood,detail);
  this.box(x,y+2.44,front+.14,1.8,.19,.24,wood,detail);
  for(const yy of[y+.52,y+1.92])this.box(x,yy,front+.222,1.25,.075,.045,0x46463c,detail);
  this.box(x+.45,y+1.05,front+.24,.10,.10,.07,0xc3a15d,{...detail,rough:.38});
  this.box(x,y+.12,front+.63,1.95,.24,1.2,0xa7aa94,{wet:1,rough:.8});
  for(const side of[-1,1]){
   const xx=x+side*w*.32;
   this.box(xx,y+1.9,front+.07,1.06,1.08,.05,0x3e554e,detail);
   this.box(xx,y+1.9,front+.11,.9,.9,.04,0xc7d2b7,{...detail,rough:.4,em:.08});
   for(const dx of[-.58,0,.58])this.box(xx+dx,y+1.9,front+.16,.08,1.22,.12,wood,detail);
   this.box(xx,y+1.9,front+.17,1.18,.08,.12,wood,detail);
   for(const dx of[-.78,.78]){this.box(xx+dx,y+1.9,front+.11,.28,1.18,.12,0x77846a,detail);for(const dy of[-.37,0,.37])this.box(xx+dx,y+1.9+dy,front+.18,.25,.065,.055,0x54624c,detail);}
   this.box(xx,y+1.2,front+.25,1.36,.3,.45,0x89664b,detail);this.flowers(xx,front+.25,.45,y+1.36);
  }
  const cx=x-w*.28,cz=z-d*.23;this.box(cx,y+4.6,cz,.63,2.1,.74,0x929380,{rough:1});
  for(let row=0;row<6;row++)for(let i=0;i<2;i++)this.box(cx+(i-.5)*.30,y+3.72+row*.31,cz+.38,.27,.26,.05,(i+row)%3?0xa4a28d:0x797e70,detail);
  this.box(cx,y+5.72,cz,.8,.17,.9,stone,{rough:1});this.box(cx,y+5.82,cz,.45,.025,.55,0x45493f,detail);
  this.box(x,y+2.78,front+.2,1.8,.33,.18,wood,detail);for(let i=0;i<3;i++)this.box(x-.55+i*.55,y+2.78,front+.30,.17,.085,.02,0xc3b47c,detail);
 }
 makeExterior(){this.begin(null);let random=C.rng(2317);let c=1.45;for(let z=-26;z<=26;z+=c)for(let x=-26;x<=26;x+=c){let radius=Math.hypot(x,z),edge=C.landRadius(x,z)-radius;if(edge<-.4)continue;let top=edge<.9?.55:1.2,col=blend(hex(0x5e8259),hex(0x879970),random()*.6);this.box(x,top/2,z,c+.04,top,c+.04,col,{rough:.97});if(edge<1.2)this.box(x,-.22,z,c+.02,.55,c+.02,0x657968);}

 // The new eastern garden is actual navigable terrain, not a backdrop.
 for(let z=-11;z<=15;z+=c)for(let x=24;x<=50;x+=c){let edge=11.6-Math.hypot((x-37)*.95,z-2);if(edge<-.4)continue;let top=edge<.9?.55:1.2;this.box(x,top/2,z,c+.04,top,c+.04,blend(hex(0x678e65),hex(0x9fac7b),random()*.45));if(edge<1.1){this.box(x,-.1,z,c,.7,c,0x7e8d7a);this.box(x,-.63,z,c,.34,c,0x546e68);}}
 // Stone bridge: fixed walk height, arches and rails are visual supports.
 for(let x=20.7;x<29.3;x+=.52){this.box(x,1.22,2,.48,.2,3.55,0xb4b39c,{wet:1,rough:.3});for(let z of[.32,3.68]){this.box(x,1.92,z,.11,1.32,.16,0x859886);this.box(x,2.6,z,.58,.12,.27,0xd6caa8);}}
 for(let x of[21,25,28.8]){this.box(x,.15,2,.75,2.2,3.7,0x7f9083);this.lamp(x,3.7,2.4);}
 for(let i=0;i<11;i++){let x=28+i*.8;this.box(x,1.23,1.2, .77,.05,2.5,0xa2ae98,{wet:1,rough:.3});}
 this.building(37,-3.8,6.2,4.8,0x655f87,0xcac5ae);
 this.add('cylinder',34,1.28,4,2.5,.3,2.5,0x889d92);this.add('cylinder',34,1.59,4,2.1,.035,2.1,0x759f9c,{wet:1,rough:.1});
 this.add('octa',34,2.5,4,.35,1.15,.35,0xc3e1d6,{em:.65});
 for(let i=0;i<8;i++){let a=i/8*TAU;this.add('round',34+Math.cos(a)*1.6,1.75,4+Math.sin(a)*1.6,.22,.3,.22,0xc5b191);}
 this.bench(42,4.3,.3);this.lamp(37,1.1,3);this.lamp(33,7,3);this.lamp(44,7,2.7);
 for(let i=0;i<360;i++){let x=27+random()*21,z=-7+random()*19;if(!C.walkable(x,z,null,.1)||Math.abs(z-1.2)<1.8)continue;this.add('leaf',x,1.25,z,.13,.28+random()*.3,.14,0x88a06c,{wind:1,r:[0,random()*TAU,0]});if(i%7===0){let col=[0xe8c6c2,0xb9c8d1,0xebd2a4][i%3];this.add('round',x,1.62,z,.18,.18,.18,col);}}
 // Distant waterfall cliffs. They remain scenery, not an unqualified traversable zone.
 for(let i=0;i<8;i++){let x=51+i*2.4,z=-25+Math.sin(i)*1.8;this.box(x,2.2,z,2.5,7.8+Math.sin(i)*1.1,6,0x697f78);this.box(x,6.2,z,2.65,.5,6.2,0x829778);}
 for(let x of[55.7,58.1,60.5]){this.box(x,2.6,-21.7,1.2,7.2,.08,0x9abfbb,{em:.07});this.box(x,.22,-21.2,3.1,.11,2.3,0x99b9ac,{wet:1});}
 // Broad scenery is deliberately non-navigable.
 for(let i=0;i<30;i++){let a=i/30*TAU,r=52+random()*55,x=Math.cos(a)*r,z=Math.sin(a)*r,h=5+random()*18;this.add('cone',x,-1,z,16+random()*14,h,14+random()*16,blend(hex(0x667f7a),hex(0x98a99b),random()),{r:[0,a,0]});if(h>15)this.add('cone',x,h*.68,z,5.5,h*.26,5.5,0xc5c9b5);}
 for(let i=0;i<18;i++){let x=-60+i*6.1;this.box(x,9,-58,1.1,18,2,0x81948c);this.box(x+3,17,-58,6,.9,2.2,0x8d9e94);this.box(x+3,14.8,-58,5.2,.6,1.6,0x788b83);}
 for(let i=0;i<38;i++){let a=random()*TAU,r=35+random()*25,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.hypot(x-37,z-2)<17||Math.hypot(x,z+40)<19)continue;this.tree(x,z,1+random()*1.3,0,.02);}
 // Travertine paths with narrow joints and damp reflective highlights.
 const path=(a,b,width)=>{let dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz),n=Math.ceil(d/.95),yaw=Math.atan2(dx,dz);for(let i=0;i<=n;i++)for(let j=-1;j<=1;j++){let x=a[0]+dx*i/n+Math.cos(yaw)*j*width/3,z=a[1]+dz*i/n-Math.sin(yaw)*j*width/3;if(Math.hypot(x,z)<23.8)this.box(x,1.225,z,width/3-.045,.045,.88,blend(hex(0x8a978b),hex(0xb0b6a0),random()*.55),{r:[0,yaw,0],rough:.32,wet:1});}};
 this.add('cylinder',0,1.2,0,15.7,.06,15.7,0x879589,{rough:.38,wet:1});this.add('cylinder',0,1.26,0,13.6,.025,13.6,0x99a394,{rough:.36,wet:1});for(let a=0;a<TAU;a+=TAU/40)this.box(Math.cos(a)*7.1,1.29,Math.sin(a)*7.1,.6,.03,.2,0xc0b897,{r:[0,-a,0],wet:1});
 for(let l of C.LANDMARKS)if(!['commons','retreat','moonwell','lookout'].includes(l.id))path([0,3],[l.x,l.z],2.25);path([-11,-1.6],[-13,11.3],1.7);path([11,9],[9,-5.8],1.7);
 this.add('cylinder',-1,1.28,-2.2,4.7,.35,4.7,0x788c80);this.add('cylinder',-1,1.63,-2.2,3.9,.12,3.9,0x354f4c,{rough:.12,wet:1});this.tree(-1,-2.2,1.55,1,1.5);for(let i=0;i<7;i++){let a=i/7*TAU;this.box(-1+Math.cos(a)*2.1,4.2+(i%2)*.4,-2.2+Math.sin(a)*2.1,.15,.28,.15,0xffd8a3,{em:2});}
 this.building(-11,-6,7.1,5.5,0x875662);this.building(-13,7,5.8,5.4,0x477f7d);this.building(11,5,5.8,4.9,0xa38b5b,0xc0b8a0);
 // Astronomer's tower and a small attached lens.
 this.add('cylinder',9,1.2,-10,6.2,.35,6.2,0x7b8e83);this.add('cylinder',9,1.55,-10,4.7,5.2,4.7,0xb2b5a2);this.add('cylinder',9,6.65,-10,5.4,.3,5.4,0x667e78);this.add('cone',9,6.95,-10,6.3,3.1,6.3,0x4e777a);this.add('cylinder',9,9.7,-10,.12,1.15,.12,0xd3be87);this.add('octa',9,10.9,-10,.48,.8,.48,0xf2cf8c,{em:.6});for(let i=0;i<8;i++){let a=i/8*TAU;this.box(9+Math.sin(a)*2.36,4.8,-10+Math.cos(a)*2.36,.5,1.3,.045,0xffd4a0,{r:[0,a,0],em:.48});}
 this.box(9,2.45,-7.61,1.23,2.2,.18,0x526765);this.box(9,1.35,-6.9,2,.3,1.7,0x8d9b8d);this.add('cylinder',13,1.2,-5.2,.18,1.7,.18,0x8c7750);this.add('cylinder',13,2.75,-5.2,.42,1.7,.42,0xc3ba8c,{r:[.86,0,0],rough:.3});
 // Work tables, barrels and flower boxes.
 for(let x of[9.1,12.5]){this.box(x,2.05,8,.95,.16,1.6,0x9c8157);for(let z of[7.4,8.6])this.box(x,1.62,z,.14,.75,.14,0x625542);}for(let[x,z]of[[-15,-3],[-8,-3],[14,7],[-16,9]]){this.add('cylinder',x,1.2,z,.8,.9,.8,0x897053);this.add('cylinder',x,1.36,z,.82,.07,.82,0x50534b);this.add('cylinder',x,1.85,z,.82,.07,.82,0x50534b);}
 // Tools and work-in-progress belong to Oren's existing table surfaces.
 // They add an occupation to the workshop without another interaction target.
 const small={cameraSolid:false,rough:.94};
 this.box(12.5,2.22,8,.48,.18,.61,0x53584c,small);this.box(12.5,2.4,8,.30,.26,.39,0x5e6356,small);this.box(12.5,2.54,8,.64,.12,.46,0x7b8170,{...small,rough:.55});
 for(let i=0;i<3;i++)this.box(8.83+i*.22,2.17,8.36,.17,.08,.47,[0x8d7956,0xb6a279,0x9d8863][i],small);
 this.box(9.12,2.23,7.53,.45,.06,.34,0xd0c29b,{...small,r:[0,.17,0]});this.box(9.1,2.30,7.88,.12,.10,.40,0x676e5b,small);this.box(9.22,2.22,8,.40,.06,.065,0x765a3a,{...small,r:[0,.3,0]});
 // A water jug and folded linen occupy the already authored barrel tops.
 this.add('round',-15,2.23,-3,.32,.42,.32,0x957752,small);this.add('cylinder',-15,2.35,-3,.16,.12,.16,0x957752,small);this.add('ring',-14.83,2.26,-3,.2,.28,.2,0x957752,small);
 this.box(-8,2.12,-3,.51,.04,.44,0xbcb899,small);this.box(-8,2.15,-3.06,.46,.035,.27,0x9aa68c,small);
 // Performance space.
 for(let i=0;i<3;i++)this.box(0,1.25+i*.18,-14.65,8-i*.4,.22,3.5-i*.35,0x8e9888);for(let a of[-1,1]){this.box(a*3.6,3.35,-15.5,.16,4.1,.16,0x756347);this.box(a*3.25,4.07,-15.42,.82,1.9,.07,0x825567);this.box(a*3.25,3.1,-15.41,.9,.15,.08,0xc5ad77);}for(let i=0;i<11;i++)this.box(-3.3+i*.66,4.6-Math.sin(i/10*Math.PI)*.7,-15.1,.11,.16,.11,0xffcf7f,{em:2});
 // Garden beds, sculpted supports.
 for(let[x,z]of[[-7.8,14.8],[-4.5,15.5]]){this.box(x,1.4,z,2.1,.4,1.3,0x806648);this.box(x,1.62,z,1.92,.06,1.11,0x4f5640);}
 for(let a of[.22,2.2,3.4,5.3])this.bench(Math.cos(a)*6.3,Math.sin(a)*6.3,-a+Math.PI/2);
 for(let[x,z]of[[-5,4],[5,4],[-5,-4],[5,-4],[0,13],[-11,-2],[11,2],[0,-12]])this.lamp(x,z);
 // Gate to the water; no false portal into another platform.
 for(let x of[-3.2,3.2]){this.box(x,3.5,18,.75,4.6,.75,0x8d978a);this.box(x,5.85,18,1.1,.28,1.1,0xb5b6a0);this.add('cone',x,5.99,18,1.3,.72,1.3,0x688077);}this.box(0,5.5,18,6.7,.38,.65,0xa4ae98);this.box(0,5.8,18,3.2,.2,.75,0xc0b99b);this.add('octa',0,6.27,18,.7,.7,.25,0xdbc58d,{em:.3});
 for(let z=20;z<29;z+=.48)this.box(0,1.19,z,3.4,.23,.42,0x8c795b,{rough:.38,wet:1});for(let x of[-1.53,1.53]){this.box(x,2,24.5,.1,.1,9,0x8d876a);for(let z=20;z<29;z+=2.3)this.box(x,1.48,z,.16,1.2,.16,0x6e6651);}this.lamp(1.05,27.3,2.7);this.box(5,.2,28,1.3,.45,3.1,0x705842,{r:[0,.4,0]});this.box(5,.47,28,1.05,.13,2.7,0xa18a62,{r:[0,.4,0]});
 for(let t of C.TREES)this.tree(...t);for(let i=0;i<3500;i++){let x=(random()-.5)*48,z=(random()-.5)*48;if(!C.walkable(x,z,null,0)||Math.hypot(x,z)<7.9||Math.abs(x)<1.8&&z>9)continue;let near=C.LANDMARKS.some(l=>Math.hypot(x-l.x,z-l.z)<2.5);if(near)continue;this.add('leaf',x,1.21,z,.10+random()*.12,.18+random()*.42,.1,blend(hex(0x647f48),hex(0xb1b875),random()*.5),{r:[0,random()*TAU,0],wind:1});if(i%31===0)this.add('octa',x,1.55,z,.13,.18,.13,0xe5d7a3);}
 for(let i=0;i<55;i++){let a=random()*TAU,r=C.landRadius(Math.cos(a),Math.sin(a))+.3;this.add('octa',Math.cos(a)*r,.36,Math.sin(a)*r,.9+random()*1.2,.7+random(),1+random(),0x7e8e80,{r:[0,a,0]});}

 // Realm 04: low-cost shoreline dressing; all meshes are procedural.
 // Small floating lily groups outside the walking boundary, not another terrain authority.
 for(let i=0;i<28;i++){
  let a=1.8+i*.085,r=C.landRadius(Math.cos(a),Math.sin(a))+1.1+(i%3)*.55;
  let x=Math.cos(a)*r,z=Math.sin(a)*r;
  this.add('disc',x,.055,z,.45+(i%3)*.1,1,.45+(i%3)*.1,0x649881,{rough:.5});
  if(i%4===0)for(let j=0;j<5;j++){let b=j*TAU/5;this.add('round',x+Math.cos(b)*.10,.15,z+Math.sin(b)*.10,.16,.12,.16,0xe7c4cc);}
 }
 // Golden clock face on the observatory and readable meridian ornament.
 this.add('ring',9,5.35,-7.6,1.5,1.5,.065,0xddc38b,{rough:.28});
 this.box(9,5.57,-7.52,.055,.46,.055,0xf0d9a1,{rough:.22});
 this.box(9.20,5.35,-7.52,.40,.055,.055,0xf0d9a1,{rough:.22});
 for(let i=0;i<12;i++){let a=i/12*TAU;this.box(9+Math.sin(a)*.62,5.35+Math.cos(a)*.62,-7.52,.06,.10,.035,0xc5a766,{r:[0,0,-a]});}
 // A soft floral border leaves all existing routes and door positions unchanged.
 for(let i=0;i<80;i++){
  let a=i/80*TAU,r=8.15+(i%3)*.18,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(!C.walkable(x,z,null,.2)||C.LANDMARKS.some(l=>Math.hypot(l.x-x,l.z-z)<2.5))continue;
  this.add('round',x,1.42,z,.20,.32,.20,0x729761);
  this.add('octa',x,1.61,z,.12,.12,.12,[0xe4ca9a,0xd7adb7,0xd4dfb3][i%3]);
 }
 // Gold inlay on the footbridge (visual only).
 for(let x=21.1;x<=28.8;x+=.54)for(let z of[.8,3.2])this.box(x,1.329,z,.47,.015,.035,0xc0ad79,{rough:.27});
 this.commit();}
 makeInterior(id,layout){if(id==='retreat'){this.makeRetreat(layout||X.freshHome());return;}this.begin(id);let base=1.2;this.box(0,base,0,11,.5,9,0x574d40);for(let x=-5.2;x<=5.2;x+=.6)this.box(x,1.49,0,.55,.08,8.8,0x9b845f);this.box(0,3.25,-4.35,11,3.5,.28,0xc0b69c);this.box(-5.35,3.25,0,.28,3.5,9,0xb3b09a);this.box(5.35,1.86,0,.2,.72,9,0x8d8b73);this.box(0,1.84,4.36,11,.66,.2,0x8b8670);for(let x of[-5.1,0,5.1])this.box(x,3.2,-4.14,.17,3.4,.14,0x6b5942);this.box(0,4.81,-4.09,10.8,.16,.18,0x796247);this.box(-5.13,4.81,0,.16,.16,8.8,0x796247);
 this.box(0,1.54,1.1,6.2,.055,4.2,id==='atelier'?0x6d9390:id==='home'?0x9d6570:0x5b7889);for(let x of[-2.88,2.88])this.box(x,1.58,1.1,.1,.02,3.98,0xcbba8d);this.box(0,2.15,-1.5,2.8,.17,1.9,0xb69865);for(let x of[-1.1,1.1])for(let z of[-2.2,-.8])this.box(x,1.8,z,.15,.6,.15,0x6d5a41);
 // Window and tall shelves.
 this.box(2.7,3.5,-4.16,2.1,1.7,.08,0x94c2bc,{em:.2});for(let x of[1.6,2.7,3.8])this.box(x,3.5,-4.06,.10,1.9,.12,0x736246);this.box(2.7,3.5,-4.03,2.3,.10,.14,0x736246);for(let yy of[1.8,2.45,3.1,3.75]){this.box(-3.4,yy,-3.75,2.4,.13,.66,0x755f42);for(let i=0;i<9;i++)this.box(-4.45+i*.25,yy+.3,-3.75,.15,.47+(i%3)*.04,.43,[0x657f7b,0xa18c67,0x906474,0xb6b399][i%4]);}
 for(let x of[-1,1]){this.add('cylinder',x,2.25,-1.5,.12,.33,.12,0xd3ba7e);this.add('octa',x,2.62,-1.5,.12,.22,.12,0xffd88e,{em:2});}this.box(.1,2.26,-1.4,.55,.05,.72,0xdbd0b1,{r:[0,.18,0]});
 if(id==='home'){this.box(-3.7,1.97,-1.9,1.5,.8,2.8,0x796777);this.box(-4.31,2.56,-1.9,.3,1,2.8,0x876e7a);for(let z of[-2.7,-1.3])this.box(-3.6,2.43,z,1,.3,.82,0xc3b293);this.box(3.8,2.06,-2.6,1.7,1.1,1.5,0x88907d);this.box(3.8,2.63,-2.6,1.95,.13,1.7,0xb1a17b);for(let i=0;i<4;i++)this.box(3.5+i*.17,2.77,-2.7,.12,.28,.35,0xa17663);this.add('octa',-4.4,2.9,2.2,.7,1,.7,0x779463);this.add('cylinder',-4.4,1.55,2.2,.7,.9,.7,0x9d7961);}
 if(id==='atelier'){this.box(-3.9,2.08,-1.9,1.2,1.1,2.3,0x655e51);this.box(-3.8,2.66,-1.9,1.25,.12,2.6,0x313f42);for(let i=0;i<14;i++)this.box(-3.63,2.75,-3.02+i*.16,.74,.05,.12,0xd6d5c4);for(let z of[-2.6,-1.2])this.box(-4.17,3.25,z,.28,.8,.48,0x37484c);this.add('octa',3.5,2.25,-2.5,.85,1.05,.25,0xbf965c);this.box(3.5,3.1,-2.5,.17,1.3,.12,0x6c5640);this.box(3.5,1.65,-2.5,.9,.15,.7,0x857a60);}
 if(id==='observatory'){this.add('cylinder',3.6,1.55,-2.4,.18,1.8,.18,0x8f7b54);this.add('cylinder',3.6,3.1,-2.4,.6,1.7,.6,0xc8bd89,{r:[.8,0,-.3],rough:.3});this.box(-.6,3.3,-4.13,2,1.9,.12,0x314f68);for(let i=0;i<16;i++)this.add('octa',-1.3+(i*7%13)*.115,2.6+(i*11%13)*.115,-4.02,.04,.05,.025,0xd6c9a0,{em:.5});}
 this.commit();}
 makeRetreat(layout){this.begin('retreat');this.layoutRevision=layout.revision;
 this.box(0,1.2,0,11.2,.5,9.2,0x656c63);for(let x=-5.2;x<=5.2;x+=.55)this.box(x,1.49,0,.50,.09,9,X.FLOORS[layout.floor],{rough:.6});
 this.box(0,3.24,-4.35,11,3.5,.22,X.WALLS[layout.wall]);this.box(-5.35,3.24,0,.22,3.5,9,X.WALLS[layout.wall]);
 for(let x of[-5.1,-1.65,1.65,5.1])this.box(x,3.23,-4.16,.13,3.4,.13,0x687767);this.box(0,4.9,-4.14,11,.15,.18,0x687767);
 this.box(-5.15,4.9,0,.16,.16,9,0x687767);this.box(0,1.75,4.4,11,.5,.2,0x8c9787);this.box(5.4,1.75,0,.2,.5,9,0x8c9787);
 // A broad, luminous window and a circular celestial ornament.
 this.box(0,3.5,-4.19,2.65,1.8,.06,0x86b2ab,{em:.23});for(let x of[-1.35,0,1.35])this.box(x,3.5,-4.10,.09,1.94,.12,0xc7bb91);this.box(0,3.5,-4.07,2.75,.09,.12,0xc7bb91);
 this.add('ring',-5.14,3.5,1.2,1.75,1.75,.10,0xcbba88,{r:[0,Math.PI/2,0],rough:.2});this.add('octa',-5.11,3.5,1.2,.15,.7,.65,0xabcbbd,{em:.23});
 // A marked entry lane always stays free. Doorways do not vanish in decorating mode.
 this.box(0,1.56,4,1.7,.02,.8,0xc6b898);for(let i of layout.items)this.furniture(i);
 for(let slot of X.SLOTS)if(!layout.items.some(i=>i.slot===slot.id)){this.add('disc',slot.x,1.56,slot.z,.18,1,.18,0xafa586,{em:.03});}
 this.commit();
 }
 furniture(item){let slot=X.SLOTS.find(s=>s.id===item.slot),rot=item.rotation*Math.PI/2;
 const at=(kind,x,y,z,sx,sy,sz,c,opt={})=>{let xx=slot.x+x*Math.cos(rot)+z*Math.sin(rot),zz=slot.z-x*Math.sin(rot)+z*Math.cos(rot);this.add(kind,xx,y,zz,sx,sy,sz,c,{...opt,r:[...(opt.r||[0,0,0])] .map((n,i)=>i===1?n+rot:n)});};
 const b=(x,y,z,w,h,d,c,opt)=>at('box',x,y,z,w,h,d,c,opt);
 if(G.RealmHomeHistoryArt.draw(item.kind,at))return;
 let wood=0x967953;
 if(item.kind==='shelf'){for(let x of[-.7,.7])b(x,2.7,0,.1,2.2,.7,wood);for(let y of[1.6,2.2,2.8,3.4,3.85]){b(0,y,0,1.5,.10,.78,wood);if(y<3.8)for(let j=0;j<6;j++)b(-.54+j*.21,y+.25,0,.13,.39+(j%2)*.08,.42,[0xa66e7e,0x718f84,0xc4b488][j%3]);}}
 if(item.kind==='sofa'){b(0,1.98,0,1.55,.5,.82,0x8b7289);b(0,2.47,-.33,1.55,.72,.16,0x9e869a);for(let x of[-.69,.69])b(x,2.3,0,.17,.48,.82,0xa28f9e);for(let x of[-.35,.35])b(x,2.26,.02,.53,.16,.54,0xc4b694);}
 if(item.kind==='desk'||item.kind==='piano'){b(0,2.31,0,1.42,.12,.85,wood);for(let x of[-.59,.59])for(let z of[-.31,.31])b(x,1.94,z,.09,.72,.09,0x6a6550);if(item.kind==='piano'){b(0,2.52,-.24,1.42,.35,.34,0x5c6664);for(let j=0;j<16;j++){b(-.63+j*.083,2.40,.08,.075,.06,.36,0xe0d5b8);if(j%7!==2&&j%7!==6)b(-.59+j*.083,2.44,-.015,.041,.045,.22,0x3f4c4a);}}else{b(-.2,2.4,0,.54,.045,.59,0xe0d2b1,{r:[0,.14,0]});b(.47,2.56,-.15,.17,.37,.17,0xddc589);at('octa',.47,2.78,-.15,.12,.2,.12,0xffd394,{em:2});}}
 if(item.kind==='plant'){at('cylinder',0,1.6,0,.65,.55,.65,0xb08b78);at('cylinder',0,2.1,0,.11,.8,.11,0x756243);for(let i=0;i<4;i++)at('round',Math.sin(i*2)*.23,2.7+(i%2)*.22,Math.cos(i*2)*.23,.8,1,.8,[0x8ba67b,0xacb991][i%2]);}
 if(item.kind==='lantern'){at('cylinder',0,1.6,0,.48,.15,.48,0x7f7461);b(0,2.1,0,.085,.88,.085,0x75664e);b(0,2.57,0,.28,.42,.28,0xf1cd90,{em:1.8});at('cone',0,2.82,0,.58,.24,.58,0x817460);}
 if(item.kind==='easel'){for(let x of[-.3,.3])b(x,2.36,0,.08,1.55,.09,wood,{r:[0,0,-x*.2]});b(0,2.63,-.05,.69,1.07,.06,0xdfcda9);b(0,2.73,.003,.56,.61,.02,0x799b91);at('round',.08,2.82,.02,.21,.21,.02,0xe2c286);b(0,2.02,.08,.8,.09,.24,wood);}
 if(item.kind==='cushions'){for(let x of[-.29,.29])b(x,1.78,0,.54,.25,.76,x>0?0xb29ba5:0xa4ba9e,{r:[0,x,0]});}
 if(item.kind==='rug'){b(0,1.56,0,2.8,.03,2.1,0x8c7396);for(let x of[-1.3,1.3])b(x,1.58,0,.055,.02,1.92,0xd6c395);for(let z of[-.96,.96])b(0,1.58,z,2.65,.02,.055,0xd6c395);for(let j=0;j<9;j++)for(let z of[-1.11,1.11])b(-1.2+j*.3,1.565,z,.055,.015,.15,0xc7b992);}
 }
 person(out,x,z,yaw,color,time,walking,role,player=false,base=1.2,profile=null){
  const c=hex(color),skin=profile?X.SKINS[profile.skin]:0xc4a58d,hair=profile?X.HAIR[profile.hair]:role==='musician'?0x6c5241:role==='researcher'?0xc9c5ad:0x55493c;
  const root=M.compose(x,base,z,1,1,1,0,yaw,0),step=walking?Math.sin(time*8):0,bob=walking?Math.abs(Math.sin(time*8))*.022:Math.sin(time*1.2)*.006;
  const add=(kind,a,b,d,sx,sy,sz,col,rx=0)=>{const local=M.compose(a,b,d,sx,sy,sz,rx,0,0),pos=M.transform(root,[a,b,d]);out[kind].push({p:pos,s:[sx,sy,sz],m:M.mul(root,local),c:col,rough:.83});};
  const limb=(a,b,width,col)=>{const dy=b[1]-a[1],dz=b[2]-a[2];add('round',a[0],(a[1]+b[1])/2,(a[2]+b[2])/2,width,Math.hypot(dy,dz)+width*.35,width,col,Math.atan2(dz,dy));};
  // Overlapping anatomical forms; joints stay connected throughout the stride.
  add('round',0,.88+bob,0,.47,.56,.30,c);add('round',0,.66+bob,0,.37,.24,.29,c);
  add('round',0,1.18+bob,0,.14,.18,.14,skin);
  add('round',0,1.37+bob,.005,.285,.33,.28,skin);
  add('round',0,1.48+bob,-.035,.31,.20,.29,hair);add('round',0,1.35+bob,-.105,.28,.22,.13,hair);
  for(const side of [-1,1]){
   add('round',side*.059,1.397+bob,.133,.023,.029,.022,0x343936);
   const leg=side*step,knee=[side*.13,.39+bob,leg*.13],foot=[side*.13,.12+Math.max(0,-leg)*.06,leg*.24];
   limb([side*.13,.67+bob,0],knee,.19,0x4d5149);limb(knee,foot,.155,0x41453f);
   add('round',side*.13,foot[1]-.03,foot[2]+.055,.21,.19,.32,0x393c37);
   const elbow=[side*.285,.84+bob,-leg*.12],hand=[side*.285,.67+bob,-leg*.22];
   add('round',side*.238,1.065+bob,0,.22,.23,.29,blend(c,hex(0xc8bb91),.17));
   limb([side*.285,1.04+bob,0],elbow,.155,c);limb(elbow,hand,.14,c);add('round',hand[0],hand[1]-.045,hand[2],.13,.15,.14,skin);
  }
  add('round',0,1.35+bob,.15,.052,.061,.067,skin);
  add('box',0,.72+bob,.025,.36,.064,.30,0x70614c);add('box',0,.72+bob,.183,.076,.077,.026,0xc6af7e);
  if(player){const cloak=profile?X.CLOAKS[profile.cloak]:0xdbc99c;add('round',0,.84+bob,-.19,.49,.72,.12,cloak);add('round',.08,1.12+bob,.15,.067,.065,.04,0xddc58f);out.disc.push({p:[x,base+.014,z],s:[.88,1,.88],c:0xcebc87,rough:.65,em:.05});}
  if(role==='musician'){add('octa',.31,.8,.22,.34,.48,.14,0xbd955f);add('box',.38,1.08,.24,.06,.47,.06,0x806747);}
  if(role==='researcher')add('box',.27,.9,.23,.24,.30,.07,0xb8c8be);
 }
 traveler(out,sim){
  if(this.travelerSim!==sim){this.travelerPoseOwner=null;this.travelerMotion=null;this.travelerSim=sim;}
  const p=sim.state.player,a=sim.state.adventure,reducedMotion=!!sim.state.settings.reducedMotion;
  const base=G.RealmWorldFoundations?.handles(this.room)?G.RealmWorldFoundations.playerHeight(sim):this.room===G.RealmCosmos?.ROOM?G.RealmCosmos.height(p.x,p.z):this.room===G.RealmEarth?.ROOM?G.RealmEarth.height(p.x,p.z):this.room?1.57:1.3;
  const combatScene=!!(a.started&&a.hp>0&&G.RealmAdventure.combatScene(sim));
  const weapon=a.equipment.weapon?G.RealmArsenal.weapon(a):{style:'none'};
  const r=G.RealmAdventure.runtime(sim),tactics=G.RealmCombat.runtime(sim),prior=this.travelerPoseOwner;
  // Accepted receipts establish ordering even when equip and attack both occur
  // between frames. Failed/replayed inputs never create a new weapon epoch.
  const tail=a.receipts[a.receipts.length-1]?.id;
  if(!prior||prior.receiptTail!==tail){
   let equipReceipt=prior?.equipReceipt||null,releaseAfterEquip=false,enteredScene=false,releaseAfterScene=false;
   const entries={enter:'mine','road-enter':'road','range-enter':'range','starter-enter':'riverbank','cross-enter':'crossing'};
   for(const receipt of a.receipts){
    if(!receipt.ok)continue;
    let type,payload;try{[type,payload]=JSON.parse(receipt.fp);}catch{continue;}
    if(Object.hasOwn(entries,type)||type==='waystone-travel'){
     const destination=type==='waystone-travel'?G.RealmCrossing.WAYSTONES[payload?.id]?.room:entries[type];
     enteredScene=destination===this.room;releaseAfterScene=false;
    }
    if(type==='equip'&&G.RealmAdventure.GEAR[payload?.id]?.slot==='weapon'){equipReceipt=receipt.id;releaseAfterEquip=false;}
    else if(type==='attack'||type==='pulse'){releaseAfterEquip=true;if(enteredScene)releaseAfterScene=true;}
   }
   this.travelerReceiptInfo={equipReceipt,releaseAfterEquip,releaseAfterScene};
  }
  const receiptInfo=this.travelerReceiptInfo;
  if(!prior||prior.weapon!==a.equipment.weapon||prior.scene!==this.room||prior.equipReceipt!==receiptInfo.equipReceipt){
   // Scene sync already clears current FX/arrows; a weapon change in the same
   // scene fences the old item, but retains an accepted release after equip.
   const freshRelease=!!(prior&&prior.equipReceipt!==receiptInfo.equipReceipt&&receiptInfo.releaseAfterEquip);
   const latestFx=weapon.style!=='bow'&&freshRelease?[...r.fx].reverse().find(f=>f.kind==='slash'||f.kind==='pulse'):null;
   const releaseAt=freshRelease?(weapon.style==='bow'?r.lastShot:latestFx?.at):null;
   this.travelerPoseOwner={weapon:a.equipment.weapon,scene:this.room,equipReceipt:receiptInfo.equipReceipt,blockedMotion:prior&&tactics.motion?.at!==releaseAt?tactics.motion:null,blockedFx:new Set(prior?r.fx.filter(f=>f!==latestFx):[]),blockedShot:prior?(freshRelease?null:r.lastShot):(!r.arrows.length&&!receiptInfo.releaseAfterScene?r.lastShot:null)};
  }
  const owner=this.travelerPoseOwner;
  owner.receiptTail=tail;
  let combat=combatScene?G.RealmCombat.pose(sim):{phase:'idle',progress:0};
  if(combat.style&&combat.style!==weapon.style||combat.phase==='anticipate'&&tactics.windup?.weapon!==owner.weapon||combat.phase==='recover'&&tactics.motion===owner.blockedMotion)combat={phase:'idle',progress:0};
  // Project only an accepted release belonging to this scene and weapon epoch.
  // Neither an input press nor this recovery pose implies a successful hit.
  if(combatScene&&combat.phase==='idle'){
   let release=weapon.style==='bow'&&r.lastShot!==owner.blockedShot?r.lastShot:null;
   if(weapon.style!=='bow')for(let i=r.fx.length-1;i>=0;i--)if(!owner.blockedFx.has(r.fx[i])&&(r.fx[i].kind==='slash'||r.fx[i].kind==='pulse')){release=r.fx[i].at;break;}
   if(Number.isFinite(release)&&a.elapsed>=release&&a.elapsed-release<.28)combat={phase:'recover',progress:(a.elapsed-release)/.28,releaseOrigin:'ready'};
  }
  this.travelerMotion=G.RealmTravelerArt.motion(this.travelerMotion,{x:p.x,z:p.z,scene:this.room,time:sim.elapsed,walking:sim.walking,paused:sim.paused,reducedMotion});
  const pose=G.RealmTravelerArt.pose({...this.travelerMotion,time:this.travelerMotion.time,reducedMotion,swimming:!!sim.worldDive&&!G.RealmWorldFoundations.divingStatus(sim,null)?.dryCourt,style:weapon.style,combatScene,combatPhase:combat.phase,combatProgress:combat.progress,releaseOrigin:combat.releaseOrigin,guarded:combatScene&&a.elapsed<G.RealmCombat.runtime(sim).guardUntil});
  const starts=Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.length]));
  const armorColor=G.RealmAdventure.GEAR[a.equipment.armor]?.color||null;
  this.travelerFrame=G.RealmTravelerArt.draw(out,{x:p.x,z:p.z,yaw:p.yaw,base,profile:sim.state.visitor,color:X.CLOAKS[sim.state.visitor.cloak],armorColor},pose);
  this.travelerEquipment=G.RealmTravelerEquipmentArt.draw(out,sim,this.travelerFrame);
  this.travelerParts=Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.slice(starts[k])]));
 }
 travelerSnapshot(){
  if(!this.travelerFrame)return null;
  const f=this.travelerFrame;
  return JSON.parse(JSON.stringify({motion:this.travelerMotion,frame:{...f,root:Array.from(f.root)},equipment:this.travelerEquipment,parts:Object.entries(this.travelerParts).flatMap(([kind,v])=>v.map(it=>({kind,p:it.p,s:it.s,m:it.m?Array.from(it.m):null,c:it.c,part:it.travelerPart||null,weaponPart:it.weaponPart||null,weaponId:it.weaponId||null,attachment:it.attachment||null,gemId:it.gemId||null,fittingStage:it.fittingStage||null,temper:it.temper||null})))}));
 }
 update(sim,t,target){this.e.cameraMedium=sim.worldDive?G.RealmWorldFoundations.medium(sim,this.e.camera.eye):null;sim.presentation=sim.presentation||{};sim.presentation.perspective=this.e.camera.projection==='perspective';this.e.cutaway=sim.state.settings.cameraCutaway!==false;const bridge=G.RealmEarth?.BRIDGE;this.e.railCutawayActive=!!bridge&&sim.room===G.RealmEarth.ROOM&&sim.state.player.z>=bridge.from&&sim.state.player.z<=bridge.to&&Math.abs(sim.state.player.x)<=bridge.walkWidth/2;this.e.galleryFocus=sim.worldDive?[sim.state.player.x,G.RealmWorldFoundations.playerHeight(sim)+.88,sim.state.player.z]:null;this.e.worldRoofOpen=(this.e.viewShelters||[]).some(b=>sim.state.player.x>=b.minX&&sim.state.player.x<=b.maxX&&sim.state.player.z>=b.minZ&&sim.state.player.z<=b.maxZ&&this.e.camera.eye[1]>b.base);this.e.cutawayFocus=[sim.state.player.x,G.RealmWorldFoundations?.handles(this.room)?G.RealmWorldFoundations.playerHeight(sim)+.88:sim.room===G.RealmCosmos?.ROOM?G.RealmCosmos.height(sim.state.player.x,sim.state.player.z)+.88:sim.room===G.RealmEarth?.ROOM?G.RealmEarth.height(sim.state.player.x,sim.state.player.z)+.88:sim.room?2.45:2.18,sim.state.player.z];if(this.e.worldFog)this.e.worldFogCenter=[sim.state.player.x,sim.state.player.z];let out={box:[],octa:[],disc:[],round:[],'timber-panel':[]},p=sim.state.player;this.traveler(out,sim);for(let i=0;i<C.PROFILES.length;i++){let info=C.PROFILES[i],r=sim.state.residents.find(r=>r.id===info.id),run=sim.runs.get(info.id);if(this.room){if(this.room==='home'&&run.inside){let pos=[[-3.1,1.1],[3.2,1.1],[2,3.2]][i];this.person(out,pos[0],pos[1],i?-.7:.7,info.color,t+i,false,info.role.toLowerCase(),false,1.57);}else if(this.room==='atelier'&&info.id==='ilan'&&run.goal==='atelier')this.person(out,2.5,1.1,-1,info.color,t,false,'musician',false,1.57);else if(this.room==='observatory'&&info.id==='mara'&&run.goal==='observatory')this.person(out,2.5,1.1,-1,info.color,t,false,'researcher',false,1.57);}else if(!run.inside)this.person(out,r.x,r.z,r.yaw,info.color,t+i,run.walking,info.role.toLowerCase());}
 if(!this.room){if(sim.state.weather==='rain'&&!sim.state.settings.reducedMotion){for(let i=0;i<110;i++){let x=((i*17.13)%42)-21,z=((i*23.77)%42)-21,y=1.4+((i*.61-t*10)%9+9)%9;out.box.push({p:[x,y,z],s:[.017,.32,.017],r:[0,0,-.13],c:0x9ebdc1,em:.2});}}for(let f of sim.state.flowers){out.box.push({p:[f.x,1.72,f.z],s:[.055,.48,.055],c:0x57784c});out.octa.push({p:[f.x,1.99,f.z],s:[.29,.3,.29],c:[0xe5bb94,0xc49fac,0xe5d29d,0xb7cad0][f.color]});}for(let i=0;i<13;i++){let a=t*.11+i*.8,r=26+i%3*4,x=Math.sin(a)*r,z=Math.cos(a)*r,y=9+i%4*1.3;for(let s of[-1,1])out.box.push({p:[x+s*.18,y,z],s:[.45,.055,.15],r:[0,a,s*(.25+Math.sin(t*3+i)*.2)],c:0x4a646b});}for(let j=0;j<3;j++)for(let i=0;i<4;i++){let u=(t*.3+i*.8)%3.7,x=[-13,-14.6,9.4][j],z=[-7.3,5.75,3.7][j];out.octa.push({p:[x+Math.sin(u+j)*.2,6.4+u,z],s:[.3+u*.16,.4+u*.19,.3+u*.16],c:blend(hex(0xb5bbb0),hex(0x9faeac),u/4),rough:1});}let w=t*.5;out.octa.push({p:[7+Math.cos(w)*.7,2+Math.sin(t)*.14,10+Math.sin(w)*.7],s:[.3,.43,.3],c:0x8ad6d1,em:1.3});}
 if(target)for(let i=0;i<16;i++){let a=i/16*TAU;out.box.push({p:[target.x+Math.cos(a)*.4,this.room===G.RealmCosmos?.ROOM?G.RealmCosmos.height(target.x,target.z)+.02:this.room?1.59:1.31,target.z+Math.sin(a)*.4],s:[.12,.025,.05],r:[0,-a,0],c:0xe5ce93,em:.35});}

 if(!this.room){
  // Petals and falling droplets are time-derived, not a new simulation authority.
  if(!sim.state.settings.reducedMotion)for(let i=0;i<40;i++){let u=(t*.13+i*.71)%1;out.box.push({p:[29+(i*3.81%17)+Math.sin(t*.6+i)*.8,1.4+(1-u)*6.5,-4+(i*1.31%13)],s:[.15,.018,.08],r:[u*TAU,i+t*.4,u*4],c:[0xe6b5c4,0xe6d1a6,0xc6daa1][i%3]});}
  for(let i=0;i<14;i++){let u=(t*.8+i*.417)%5.3;out.box.push({p:[55.7+(i%3)*2.4,6.2-u,-21.57],s:[.08,.5,.015],c:0xd0e1d0,em:.2});}
  if(sim.gathering){for(let i=0;i<9;i++)out.octa.push({p:[-3.2+i*.8,2+Math.sin(t*1.6+i)*.13,-13.3],s:[.11,.25,.11],c:0xe3c382,em:1});}
  if(sim.presentation?.playing){for(let i=0;i<8;i++){let active=(sim.presentation.step+i)%4===0;out.box.push({p:[-2+i*.56,1.96+(active?.35:.12),-14],s:[.2,active?.7:.25,.18],c:[0xb6d1b8,0xd5b47f,0xb697c1][i%3],em:.6});}}
 }
 if(this.room==='retreat'&&sim.presentation?.selectedSlot){let slot=X.SLOTS.find(s=>s.id===sim.presentation.selectedSlot);if(slot){for(let i=0;i<4;i++){let a=i*Math.PI/2;out.box.push({p:[slot.x+Math.sin(a)*.95,1.6,slot.z+Math.cos(a)*.95],s:i%2?[.035,.035,1.95]:[1.95,.035,.035],c:0xe4c487,em:.5});}}}
 if(G.RealmRoadArt)G.RealmRoadArt.draw(out,sim,t,this);
 if(G.RealmAdventureArt)G.RealmAdventureArt.draw(out,sim,t);
 if(G.RealmStarterArt)G.RealmStarterArt.draw(out,sim,t);
 if(G.RealmCosmosArt)G.RealmCosmosArt.draw(out,sim,t,this);
 if(G.RealmWorldFoundationsArt)G.RealmWorldFoundationsArt.draw(out,sim,t,this);if(G.RealmTrailsArt)G.RealmTrailsArt.draw(out,sim,t,this);if(G.RealmLocalLifeArt)G.RealmLocalLifeArt.draw(out,sim);if(G.RealmBridgeCommunityArt)G.RealmBridgeCommunityArt.draw(out,sim);if(G.RealmHellCampaignArt)G.RealmHellCampaignArt.draw(out,sim,t);if(G.RealmHeavenCampaignArt){G.RealmHeavenCampaignArt.draw(out,sim,t);G.RealmHeavenCampaignArt.drawEscort(out,sim,G.RealmHeavenCampaign.runtime(sim).escort,t);}
 if(G.RealmEarthArt)G.RealmEarthArt.draw(out,sim,t,this);if(G.RealmEarthNotesArt)G.RealmEarthNotesArt.draw(out,sim);
 if(G.RealmArsenalArt)G.RealmArsenalArt.draw(out,sim,t);
 if(this.room==='mine')this.e.torch=[p.x,2.6,p.z];
 if(G.RealmSandboxArt)G.RealmSandboxArt.draw(out,sim,t);
 if(G.RealmBeaconArt)G.RealmBeaconArt.draw(out,sim,t,this);
 if(G.RealmCrossingArt)G.RealmCrossingArt.draw(out,sim,t,this);
 if(this.dynamicTimber)this.dynamicTimber.items=out['timber-panel'];this.dynamicRound.items=out.round;
 this.dynamicBox.items=out.box;this.dynamicOcta.items=out.octa;this.dynamicDisc.items=out.disc;}
}
G.RealmArt={WorldArt};})(globalThis);
