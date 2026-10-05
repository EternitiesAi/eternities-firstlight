/* Near Expanse M1. Original procedural stone, timber and living ground. */
(function(G){'use strict';
const C=G.RealmCosmos,TAU=Math.PI*2,h=C.height;
const col={grass:0x78856b,stone:0x898777,light:0xc3b99b,wood:0x69513d,bronze:0xb99b60,leaf:0x71856b};
function lamp(a,x,z,s=1){const b=h(x,z);a.add('cylinder',x,b,z,.32,2.65*s,.32,col.bronze);a.box(x,b+2.55*s,z,.64,.85*s,.64,0xffd793,{em:.7,rough:.4});a.add('cone',x,b+3*s,z,1,.48*s,1,col.wood);a.box(x,b+.12,z,.62,.24,.62,col.stone);}
function paving(a,points,width=2){for(let i=1;i<points.length;i++){let u=points[i-1],v=points[i],d=Math.hypot(v[0]-u[0],v[1]-u[1]);for(let t=0;t<d;t+=.72){let f=t/d,x=u[0]+(v[0]-u[0])*f,z=u[1]+(v[1]-u[1])*f;if(C.walkable(x,z,.1))a.add('disc',x,h(x,z)+.024,z,width,1,width,0xb6ac8e,{rough:1,cameraSolid:false,r:[Math.atan2(h(x,z-.1)-h(x,z+.1),.2),0,0]});}}}
const paths=[[[0,20],[0,10],[3,7],[10,2],[14,-4],[14,-14],[14,-24],[12,-31],[3,-37],[3,-43]],[[0,10],[-6,10],[-14,0],[-15,-8],[-15,-19],[-14,-30],[0,-34],[3,-37]],[[-6,10],[-6,6]]];
function pathDistance(x,z){let best=Infinity;for(const ps of paths)for(let i=1;i<ps.length;i++){const u=ps[i-1],v=ps[i],dx=v[0]-u[0],dz=v[1]-u[1],t=Math.max(0,Math.min(1,((x-u[0])*dx+(z-u[1])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-u[0]-dx*t,z-u[1]-dz*t));}return best;}
function terrain(a,rnd){
 // Ground top and physical height use the same function; buried mass closes every seam.
 for(let z=-53;z<22;z+=.5){let runs=C.PATCHES.filter(p=>z+.5>p.z-p.d/2&&z<p.z+p.d/2).map(p=>[p.x-p.w/2,p.x+p.w/2]).sort((u,v)=>u[0]-v[0]),merged=[];
  for(const p of runs){let last=merged[merged.length-1];if(last&&p[0]<=last[1])last[1]=Math.max(last[1],p[1]);else merged.push(p.slice());}
  for(const [lo,hi]of merged){let x=(lo+hi)/2,ha=h(x,z),hb=h(x,z+.5),ang=Math.atan2(ha-hb,.5);a.box(x,(ha+hb)/2-.045,z+.25,hi-lo,.09,Math.hypot(.5,hb-ha)+.002,col.grass,{rough:1,terrain:true,cameraSolid:false,cutaway:false,r:[ang,0,0]});a.box(x,Math.min(ha,hb)-5.08,z+.25,hi-lo,10,.502,0x777970,{cameraSolid:false,cutaway:false});}
 }
 // Irregular low shoulders and deep cliff roots; the walking edge remains on supported ground.
 for(let z=-53;z<=22;z+=1.3)for(let x=-18;x<=18;x+=1.3){if(!C.land(x,z,0))continue;const edge=[[1.3,0],[-1.3,0],[0,1.3],[0,-1.3]].find(([dx,dz])=>!C.land(x+dx,z+dz,0));if(!edge)continue;let xx=x+edge[0]*.3,zz=z+edge[1]*.3,b=h(xx,zz);a.add('round',xx,b-2.4,zz,2.8+rnd()*1.6,4.6,3.5,col.stone,{rough:1,cameraSolid:false,cutaway:false});a.add('octa',xx,b-6.5,zz,3.6,8+rnd()*5,3.8,0x5e6d6b,{rough:1,cameraSolid:false,cutaway:false});}
 // The central ridge is closed ground, with two real paths around its limestone walls.
 a.box(-.5,h(-.5,-16)+.8,-16,13,1.6,24,0x85877a,{rough:1,cameraSolid:true});
 for(let z=-6.2;z>=-25.8;z-=3.9)for(let x of [-4.8,-.5,3.8])a.add('round',x,h(x,z)+1.7,z,4.3,5.1,4.4,0x939580,{rough:1,cameraSolid:true});
 for(let i=0;i<11;i++){let z=-6-i*2.05;a.add('round',-.5+Math.sin(i*2.3)*2.5,h(-.5,z)+3.8,z,7.4,5.2,4.9,i%2?0xaaa48c:0x929783,{rough:1,cameraSolid:true});}
 for(let i=0;i<1400;i++){let x=-18+rnd()*36,z=-53+rnd()*75;if(!C.walkable(x,z,.5)||pathDistance(x,z)<1.25)continue;let s=.09+rnd()*.1;a.add('leaf',x,h(x,z)+.02,z,s,s*2.7,s,i%4===0?0xb5b18c:col.leaf,{wind:1,rough:1,r:[0,rnd()*TAU,0]});if(i%9===0)a.add('round',x,h(x,z)+.03,z,.26,.1,.34,0xa0a086,{cameraSolid:false,rough:1});}
 for(const ps of paths)paving(a,ps);
 // Paved gathering aprons are flush, never invisible raised steps.
 for(const [x,z,w,d]of [[-6,6,6,5],[3,7,4,4],[3,-43,8,7],[0,18,5,4]])a.box(x,h(x,z)+.012,z,w,.02,d,0xb6ac8e,{cameraSolid:false,rough:1});
}
function refuge(a){const b=h(-6,5);a.box(-6,b+1.6,3,7,3.2,.45,col.light);a.box(-9.3,b+1.6,6,.45,3.2,6,col.light);a.box(-2.7,b+1.6,5,.45,3.2,4,col.light);
 // The existing shelter reveal follows the traveler inside its real footprint.
 // Keep all roof layers together; cameraCutaway still owns the player's choice.
 const overhead={cutaway:true,worldRoof:'cosmos-farroad-refuge'};
 a.add('roof',-6,b+3.2,5.65,7.8,1.65,6.6,0x596c65,{...overhead,cameraSolid:true});a.box(-6,b+3.23,5.65,7.9,.16,6.65,col.wood,overhead);
 for(let x of [-9.3,-2.7])a.box(x,b+1.65,3,.24,3.3,.65,col.wood);
 for(let x of [-8,-4]){a.box(x,b+2,3.24,1.25,1.25,.06,col.wood);a.box(x,b+2,3.28,1.01,1.01,.05,0xf4d091,{em:.5});a.box(x,b+2,3.32,1.06,.08,.05,col.wood);a.box(x,b+2,3.32,.08,1.06,.05,col.wood);}
 a.bench(-6,4.2,0,b);lamp(a,-10.6,8.7,.65);
 for(let i=0;i<8;i++)a.box(-9.4+i*.98,b+3.24+(1-Math.abs(i/7-.5)*2)*1.65,5.65,.07,.09,6.7,0x8c9a82,{...overhead,cameraSolid:false});
}
function observatory(a){const b=h(3,-47);a.box(3,b+2.5,-49,14,5,.6,col.light);a.box(-3.8,b+2,-46,.6,4,6,col.light);a.box(9.8,b+2,-46,.6,4,6,col.light);
 // Tall crown stays recognizable above the ridge in the arrival view.
 for(let x of [-3.8,9.8]){a.box(x,b+4.9,-49,1,9.8,1,0xa7a28d);a.box(x,b+10,-49,1.45,.35,1.45,col.bronze);}
 for(let i=0;i<24;i++){let q=i/24*Math.PI,r=(i+1)/24*Math.PI,x1=3+6.8*Math.cos(q),y1=b+9.8+4*Math.sin(q),x2=3+6.8*Math.cos(r),y2=b+9.8+4*Math.sin(r);a.box((x1+x2)/2,(y1+y2)/2,-49,Math.hypot(x2-x1,y2-y1)+.035,.65,.75,col.light,{r:[0,0,Math.atan2(y2-y1,x2-x1)],cameraSolid:true});}
 for(let x of [-1.8,3,7.8]){a.box(x,b+3.05,-48.64,2,2.25,.08,0x526b72);a.box(x,b+3.05,-48.54,2.2,.09,.1,col.bronze);a.box(x,b+3.05,-48.54,.1,2.4,.1,col.bronze);}
 a.box(3,b+1.65,-47,2.2,3.3,2.2,col.stone);a.add('cylinder',3,b+3.3,-47,2.6,.24,2.6,col.light);
 for(let i=0;i<3;i++)a.add('ring',3,b+6.7,-47,5.3-i*.9,5.3-i*.9,5.3-i*.9,col.bronze,{r:[i*.66,i*.48,0],cameraSolid:false});
 a.add('octa',3,b+6.7,-47,.7,.85,.7,0xffd394,{em:.9,cameraSolid:false});
 for(let x of [-2.8,8.8])lamp(a,x,-42,.7);
}
function sky(a,rnd){
 // Remote world-space sky images: no camera clearance, surface picks, shadows or route state.
 a.add('round',-52,-16,-110,90,90,90,0xa8a8c2,{skyImage:true,em:.3,rough:1,cameraSolid:false,cutaway:false});
 for(let i=0;i<165;i++){let ang=rnd()*TAU,y=22+rnd()*135,r=Math.sqrt(205*205-y*y),s=.13+rnd()*.24;a.add('octa',Math.cos(ang)*r,y,Math.sin(ang)*r-15,s,s,s,i%7?0xc8ccdf:0xf4d8b4,{em:1.6,skyImage:true,cameraSolid:false,cutaway:false});}
 for(let i=0;i<20;i++){let x=-42+i*4,z=-68-(i%4)*4;a.add('octa',x,-3,z,8,18+i%4*5,9,0x475970,{cameraSolid:false,cutaway:false,rough:1});}
}
function make(a){a.begin(C.ROOM);a.e.theme='cosmos';a.e.isInterior=false;a.e.noWater=true;a.e.ambientOverride=.55;const rnd=G.RealmCore.rng(9512026);terrain(a,rnd);refuge(a);observatory(a);
 for(const [x,z,w,d,hh]of [[-12,-9,3,3,3.2],[11,-17,2.8,4,2.6]]){a.box(x,h(x,z)+hh/2,z,w,hh,d,col.stone);for(let i=0;i<4;i++)a.box(x,h(x,z)+(i+.5)*hh/4,z+d/2+.01,w,.035,.04,0x666d62,{cameraSolid:false});a.add('round',x,h(x,z)+hh-.1,z,w*.98,.3,d*.98,col.grass,{cameraSolid:false});}
 for(let x of [6.6,8.1,9.6])lamp(a,x,10.8,x===8.1?1.2:1);
 for(const [x,z]of [[-16.7,-18],[16.6,-28],[-7,-34]])lamp(a,x,z,.7);
 sky(a,rnd);a.commit();}
function draw(out,sim,t,a){if(sim.room!==C.ROOM)return;let p=sim.state.player;a.person(out,3,7,Math.PI*.8,'#b38c68',t,false,'keeper',false,h(3,7)+.02);a.person(out,3,-43,Math.PI,'#78959a',t,false,'researcher',false,h(3,-43)+.02);
 if(!sim.state.settings?.reducedMotion)for(let i=0;i<6;i++){let q=t*.16+i*TAU/6;out.octa.push({p:[3+Math.sin(q)*1.1,h(3,-47)+6.7+Math.cos(q)*.35,-47+Math.cos(q)*1.1],s:[.08,.14,.08],c:0xffd69a,em:.7});}
 out.disc.push({p:[p.x,h(p.x,p.z)+.02,p.z],s:[.8,1,.8],c:0xd9c38c,rough:.8,em:.05});}
function gate(a){a.add('cylinder',C.GATE.x,1.25,C.GATE.z,.18,1.3,.18,col.bronze,{cameraSolid:false});a.add('octa',C.GATE.x,2.75,C.GATE.z,.55,.6,.55,0xffd394,{em:.8,cameraSolid:false});}
G.RealmCosmosArt={make,draw,gate};
})(globalThis);
