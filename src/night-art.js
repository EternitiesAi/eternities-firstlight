/* Act III art: the ash-red crossing, the travellers, the severing device, the road claimants, Briar's empty bowl and the
 * envoy. Story art from the story-art lane is used when it is loaded; otherwise these simple shapes are drawn. */
(function(G){'use strict';const TAU=Math.PI*2;
const SKY={top:0x3c1f25,fog:0x7d4a40,night:.86,power:.3,sunColor:0xd98a6c};
function device(box,octa,x,y,z,yaw,t){
 box(x,y+.05,z,.9,.1,.9,0x4b4f53);
 box(x,y+.85,z,.2,1.55,.2,0x3c4044);
 box(x,y+1.25,z,.8,.1,.1,0x4b4f53,{r:[0,yaw,0]});
 box(x,y+1.25,z,.1,.1,.8,0x4b4f53,{r:[0,yaw,0]});
 octa(x,y+1.7+Math.sin(t*3)*.05,z,.26,.26,.26,0xff7a3d,{em:1.6});
 for(let i=0;i<4;i++){const a=yaw+i*Math.PI/2;octa(x+Math.sin(a)*.55,y+1.25,z+Math.cos(a)*.55,.12,.12,.12,0xd9602c,{em:1.1});}
}
function remnants(box,octa,x,y,z,t){
 box(x,y+.03,z,1.1,.05,1.1,0x3a3331);
 box(x+.3,y+.12,z-.2,.5,.2,.14,0x4b4f53,{r:[0,.6,.2]});
 box(x-.35,y+.1,z+.25,.42,.16,.12,0x4b4f53,{r:[0,-.4,-.15]});
 octa(x,y+.2+Math.sin(t*2)*.03,z,.12,.12,.12,0xff7a3d,{em:.8});
}
function bite(octa,x,y,z,b,t){
 const k=Math.min(1,b.t/2.6);
 for(let i=0;i<12;i++){const a=i*TAU/12+t*3,r=1.2*(1-k)+.3;octa(x+Math.sin(a)*r,y+.4+(i%3)*.5*k,z+Math.cos(a)*r,.1,.1,.1,i%2?0x5a4a48:0xff7a3d,{em:.7});}
}
function claimant(box,octa,e,t){
 octa(e.x-.22,3.7,e.z+.9,.12,.12,.12,0xff8a4a,{em:1.4});
 octa(e.x+.22,3.7,e.z+.9,.12,.12,.12,0xff8a4a,{em:1.4});
 for(let i=0;i<6;i++){const a=i*TAU/6+t*.5;octa(e.x+Math.cos(a)*1.2,.6+Math.sin(t+i)*.2,e.z+Math.sin(a)*1.2,.25,.2,.25,0x6e5f5b,{rough:1});}
}
function emptyBowl(box,add,sim){
 const d=G.RealmBriarOuting?.definition;if(!d)return;
 const y=G.RealmAdventureArt?.supportHeight?G.RealmAdventureArt.supportHeight(sim,d.rest.x,d.rest.z):1.5,x=d.rest.x+.7,z=d.rest.z;
 const o={briarOutingPart:'bowl-empty',appearanceOnly:true,cameraSolid:false,cutaway:false};
 box(x,y+.0305,z,.34,.055,.34,0xa7aa94,o);
 add('disc',x,y+.0586,z,.235,.001,.235,0x5d5a4c,{...o,briarOutingPart:'bowl-empty-inner'});
 for(const s of[-1,1]){box(x+s*.1475,y+.063,z,.045,.035,.34,0xbec0a7,{...o,briarOutingPart:'bowl-empty-rim'});box(x,y+.063,z+s*.1475,.25,.035,.045,0xbec0a7,{...o,briarOutingPart:'bowl-empty-rim'});}
}
function envoy(box,octa,round,x,z,t){
 const y=1.5;
 round(x,y+1,z,.55,1.7,.5,0xe9e0c8);
 round(x,y+2.25,z,.36,.4,.36,0xf2e6cf);
 for(const s of[-1,1])for(let j=0;j<5;j++)octa(x+s*(.35+j*.12),y+2.2+j*.12,z-.2-j*.03,.18,.9-j*.1,.12,0xf4ecda,{em:.9,r:[0,0,-s*(.35+j*.08)]});
 octa(x,y+2.85+Math.sin(t*1.6)*.05,z,.5,.14,.5,0xf3d8a2,{em:1.3});
}
function draw(out,sim,t,art){
 const N=G.RealmNight,w=sim.state,n=w?.night,A=G.RealmAdventure;if(!N||!n||!A)return;
 const st=N.stage(w),add=(k,x,y,z,sx,sy,sz,c,o={})=>out[k].push({p:[x,y,z],s:[sx,sy,sz],c,...o});
 const box=(...v)=>add('box',...v),octa=(...v)=>add('octa',...v),round=(...v)=>add('round',...v),rt=N.runtime(sim);
 if(!sim.room){
  if(N.briarAway(sim)&&w.adventure.companion.bonded===true)emptyBowl(box,add,sim);
  const e=N.envoyPos(sim);if(e)envoy(box,octa,round,e.x,e.z,t);
  return;
 }
 if(sim.room!=='crossing')return;
 const lit=st==='lit'||st==='quiet';
 if(lit)art.e.worldAtmosphere=SKY;else if(art.e.worldAtmosphere===SKY)art.e.worldAtmosphere=null;
 if(!lit)return;
 for(const tr of N.TRAVELLERS){const q=N.travellerState(sim,tr.id);if(!q)continue;art.person(out,q.x,q.z,q.yaw,tr.color,t,!!q.following,'visitor',false,1.57);}
 if(n.device==='found')device(box,octa,N.DEVICE.x,1.52,N.DEVICE.z,Math.PI/2,t);
 if(n.device==='broken')remnants(box,octa,N.DEVICE.x,1.52,N.DEVICE.z,t);
 if(rt.bite)bite(octa,N.DEVICE.x,1.52,N.DEVICE.z,rt.bite,t);
 if(st==='lit')for(const e of A.runtime(sim).enemies)if(e.nightClaim&&e.hp>0)claimant(box,octa,e,t);
}
G.RealmNightArt={draw,SKY};if(typeof module!=='undefined')module.exports=G.RealmNightArt;
})(globalThis);
