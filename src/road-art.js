/* Procedural Sunward Road. Static obstacles come from the rules module.
 * Dynamic art projects accepted cart/cache/beacon facts, never grants rewards. */
(function(G){'use strict';const R=G.RealmRoad,TAU=Math.PI*2;
function gate(a){const{x,z}=R.GATE;for(const sign of[-1,1]){a.box(x+sign*1.1,2.35,z-1.1,.4,2.3,.42,0x8c9982);a.add('octa',x+sign*1.1,3.62,z-1.1,.56,.6,.56,0xc5b98e);}a.box(x,3.4,z-1.1,2.6,.18,.36,0xc9b992);a.box(x,3.58,z-1.1,.45,.18,.42,0xe3c88d,{em:.4});for(let i=0;i<5;i++)a.box(x+(i-2)*.4,1.32,z,.34,.07,1.45,0xbdc3a4,{wet:1});}
function make(a,sim){
 a.begin('road');a.e.isInterior=false;a.e.theme='sunward';a.e.reflectionStrength=.7;
 const rng=G.RealmCore.rng(7007),hex=G.RealmEngine.hex,blend=G.RealmEngine.blend;
 for(let z=-30;z<24;z+=1.2)for(let x=-21;x<21;x+=1.2){
  if(!R.land(x,z,-.4)||Math.abs(z-R.riverZ(x))<1.75)continue;
  const edge=!R.land(x,z,.9),col=blend(hex(0x567c51),hex(0x98a36f),.43+Math.sin(x*.22+z*.13)*.05+rng()*.07);
  a.box(x,edge?.55:.75,z,1.23,edge?1.1:1.5,1.23,col);if(edge)a.box(x,-.1,z,1.2,.9,1.2,0x708074);
 }
 const path=[{x:0,z:17},{x:-1,z:6},{x:2,z:3},{x:2,z:-4},{x:3,z:-12},{x:0,z:-24}];
 for(let n=0;n<path.length-1;n++){
  const p=path[n],q=path[n+1],d=Math.hypot(q.x-p.x,q.z-p.z),yaw=Math.atan2(q.x-p.x,q.z-p.z);
  for(let u=0;u<d;u+=.65)for(const side of[-.7,0,.7]){const x=p.x+(q.x-p.x)*u/d+Math.cos(yaw)*side,z=p.z+(q.z-p.z)*u/d-Math.sin(yaw)*side;if(R.walkable(x,z,.05))a.box(x,1.54,z,.60,.08,.58,[0xa9ae92,0xb4b69b,0x929e87][Math.floor(rng()*3)],{r:[0,yaw,0],wet:1});}
 }
 a.box(2,1.38,0,4.8,.34,5.6,0xa2ac93,{wet:1});for(let z=-2.4;z<=2.4;z+=.6)for(let x=0;x<4.5;x+=.62)a.box(x,1.58,z,.56,.05,.52,0xbfc1a5,{wet:1});
 for(const x of[-.2,4.2])for(const z of[-2.4,-.8,.8,2.4]){a.box(x,1.91,z,.32,.7,.35,0x879a89);a.box(x,2.30,z,.47,.12,.49,0xc5c5aa);}for(const x of[-.2,4.2])a.box(x,2.02,0,.20,.16,5,0xc1bba0);
 a.lamp(-.1,3.5,2.6,1.5);a.lamp(4.1,-3.2,2.6,1.5);
 for(let i=0;i<54;i++){const x=-16+i*.61,z=R.riverZ(x)+(i%2?2.35:-2.35);if(!R.land(x,z,.2)||Math.abs(x-2)<2.6)continue;for(let j=0;j<3;j++)a.add('leaf',x+j*.10,1.6+j*.04,z,.14,.75+(i%3)*.12,.14,0x8b986b,{wind:1,r:[0,j*2,0]});}
 for(const o of R.OBSTACLES)if(o.r){a.add('octa',o.x,1.5+o.r*.45,o.z,o.r*2,o.r*1.3,o.r*2,0x819383);a.add('octa',o.x+.25,2+o.r*.5,o.z-.18,o.r*1.35,o.r*.45,o.r*1.45,0xa2af8e);}
 for(const t of R.TREES)a.tree(t[0],t[1],t[2],t[3],1.5);
 for(let i=0;i<65;i++){const x=(rng()-.5)*32,z=(rng()-.5)*43-3;if(R.walkable(x,z)&&Math.abs(x-1)>3)a.flowers(x,z,.4+rng()*.3);}
 const tx=-13,tz=-22;a.box(tx,2.8,tz,3,2.6,3.4,0x7b8c80);a.box(tx,4.3,tz,3.3,.25,3.7,0xacb6a0);for(const dx of[-1.2,0,1.2])for(const dz of[-1.4,1.4])a.box(tx+dx,4.8,tz+dz,.62,.9,.65,0x99aa94);a.box(tx,3.15,tz+1.71,.7,1.12,.04,0x405c52);
 const w=R.OBSTACLES.find(o=>o.w===2.6);a.box(w.x,2.04,w.z,2.6,.7,3,0x887555);a.box(w.x,2.49,w.z,2.8,.17,3.1,0xb4a16f);for(const sign of[-1,1])for(const zz of[-.92,.92])a.add('cylinder',w.x+sign*1.36,1.77,w.z+zz,.82,.17,.82,0x746246,{r:[0,0,Math.PI/2]});for(const sign of[-1,1])a.box(w.x+sign*1.16,3.2,w.z,.11,1.45,.11,0xb8a87c);a.add('roof',w.x,3.7,w.z,3,.7,3.3,0x78a4a0);a.lamp(-9.6,14.3,2.2,1.5);a.bench(-7.2,13.8,-.3,1.5);
 for(let i=0;i<3;i++)a.add('cylinder',0,1.55+i*.14,-24,3.3-i*.48,.22,3.3-i*.48,0xaaa98a);
 a.box(0,2.78,-24,.45,2.05,.45,0x8a8872);a.box(0,3.73,-24,1.2,.18,1.2,0xc9b78d);for(const x of[-.5,.5])for(const z of[-24.5,-23.5])a.box(x,4.25,z,.1,1,.1,0xbba46b);a.add('roof',0,4.79,-24,1.65,.7,1.65,0x557c79);for(const x of[-2.6,2.6]){a.box(x,3.1,-24,.15,3.2,.15,0xb7a77f);a.box(x+.42,3.84,-24,.7,1.6,.06,0x7093a4,{wind:2});}
 for(const x of[-1.6,1.6])a.box(x,2.7,18.8,.5,2.4,.55,0x9b9e87);a.box(0,4,18.8,4,.24,.6,0xc2b697);for(let i=0;i<8;i++)a.box(-1.4+i*.4,1.57,17.8,.2,.055,.1,0xe1c98c,{em:.35});
 // Distant, unwalkable skyline; this is not another playable city.
 for(let i=0;i<18;i++){const x=(i-9)*7,z=-46-(i%3)*8;a.add('cone',x,3,z,12+(i%4)*3,12+(i%5)*4,15,0x758e91);a.add('cone',x,8+(i%5)*2,z,5,6+(i%5)*2,6,0xb3bdb1);}for(let i=0;i<7;i++){const x=-11+i*3.5,z=-48-i%2*3;a.box(x,8,z,1.3,8+i%3*2,1.3,0xb6bcaa);a.add('cone',x,13+i%3,z,2.1,3.2,2.1,0x638894);}
 if(G.RealmCrossingArt)G.RealmCrossingArt.gate(a,sim);
 a.commit();
}
function draw(out,sim,t,artist){if(sim.room!=='road')return;const s=sim.state.adventure,r=s.road,add=(k,p,sz,c,o={})=>out[k].push({p,s:sz,c,...o});if(!G.RealmBeacon?.sightingPending(sim))artist.person(out,R.MERCHANT.x,R.MERCHANT.z,.5,'#699e9a',t,false,'trader',false,1.57);
 if(r.cartRepaired)add('box',[-10.86,2.15,11],[.2,.23,1.2],0xd9bd78,{em:.1});else{add('box',[-10.88,2.15,11],[.15,.15,.3],0x645244);add('octa',[-10,3.5,12],[.18,.4,.18],0xe2bb8b,{em:.4});}
 if(r.beaconLit){add('octa',[0,4.23,-24],[.62,1.1,.62],0xffd599,{em:2});for(let i=0;i<7;i++){let a=t*.4+i*2.4;add('octa',[Math.cos(a)*.65,4.6+(t*.3+i*.27)%2.4,-24+Math.sin(a)*.65],[.06,.15,.06],0xefd2a1,{em:1.3});}}
 for(const c of R.CACHES){if(!r.revealed.includes(c.id)||r.claimed.includes(c.id))continue;add('box',[c.x,1.85,c.z],[.55,.4,.45],0x88795d);add('box',[c.x,2.1,c.z],[.61,.1,.52],0xe1c699);add('octa',[c.x,2.7+Math.sin(t*2)*.1,c.z],[.2,.4,.2],0xdcd99f,{em:1});}
 if(!sim.state.settings.reducedMotion)for(let i=0;i<28;i++){const u=(t*.1+i*.71)%1;add('box',[-12+(i*2.31%24),1.8+(1-u)*4.2,-25+(i*7.3%44)],[.12,.015,.09],[0xdac294,0xb9ca89,0xcbaa9d][i%3],{r:[u*TAU,i,u*3]});}
}
G.RealmRoadArt={gate,make,draw,TREES:R.TREES};})(globalThis);
