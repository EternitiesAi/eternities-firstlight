/* Read-only rendering of the court, bows, travelling arrows and their impacts. */
(function(G){'use strict';const AR=G.RealmArsenal,TAU=Math.PI*2;
function court(a){a.begin('range');a.e.theme='range';a.e.ambientOverride=.58;const rng=G.RealmCore.rng(808);
 // A woodland clearing surrounds the bounded court; scenery is not secretly traversable.
 a.add('cylinder',0,-1.5,0,85,2.5,74,0x678568);for(let i=0;i<9;i++){a.add('octa',-42+i*10,2,-43-(i%2)*8,20,12+(i%3)*4,22,0x79917d);}
 a.box(0,.3,0,30,2.4,28,0x617e62);a.box(0,1.37,0,28,.25,26,0xb1ac88,{wet:.1});
 for(let x=-13;x<14;x+=1)for(let z=-12;z<13;z+=1){const lane=Math.abs(x)<8&&z<6,col=lane?[0xc7bd9c,0xb8b095,0xc0bba1][Math.floor(rng()*3)]:[0x789371,0x89a078,0x83966d][Math.floor(rng()*3)];a.box(x+.5,1.51,z+.5,.96,.04,.96,col,{rough:.95});}
 for(const x of[-13.9,13.9]){a.box(x,1.85,0,.25,.65,26,0xc4bca0);a.box(x,2.21,0,.42,.09,26,0xe3d5b0);}a.box(0,2.3,-13.3,29,1.6,.7,0x9d9f85);a.box(0,3.12,-13.3,29,.13,.94,0xd9cda9);
 for(const x of[-12,-6,0,6,12]){a.box(x,3.8,-13.3,.62,4.7,.8,0xd1c4a3);a.box(x,6.05,-13.3,.94,.23,1.1,0xe5d5aa);a.box(x,5.3,-12.8,.65,1.5,.055,0x92766a);a.add('octa',x,5.55,-12.73,.23,.47,.045,0xe3c68b,{em:.25});}a.box(0,6.25,-13.3,26.2,.25,.72,0xb3a278);
 for(const p of AR.RANGE.pillars){a.add('cylinder',p.x,1.65,p.z,1.1,3.05,1.1,0xd2c6a9);a.add('cylinder',p.x,1.62,p.z,1.45,.24,1.45,0x9f9e87);a.add('cylinder',p.x,4.7,p.z,1.45,.24,1.45,0xe4d0a3);a.add('octa',p.x,5.1,p.z,.48,.72,.48,0xf4d895,{em:.5});}
 for(const x of[-11.5,11.5])for(const z of[-10,-3,4,11]){a.tree(x,z,.62,z<0?1:3,1.5);a.flowers(x+(x<0?1.4:-1.4),z,.8);}
 a.bench(-10,7,Math.PI/2,1.5);a.bench(10,7,-Math.PI/2,1.5);a.lamp(-7,9,2.6,1.5);a.lamp(7,9,2.6,1.5);
 for(let j=0;j<5;j++){a.box(0,1.55,8+j*.7,4,.04,.09,0xe2d7b2);a.box(-5,1.55,4+j*.65,.06,.04,.25,0xe2d7b2);a.box(5,1.55,4+j*.65,.06,.04,.25,0xe2d7b2);}
 for(const x of[-2,2]){a.box(x,2.7,12.2,.38,2.45,.44,0x9b9579);a.add('octa',x,4.2,12.2,.55,.67,.5,0xddcaa0);}a.box(0,4.05,12.2,4.6,.2,.5,0xb9aa84);
 // Distant forest and broken aqueduct are scenery, not hidden walkable regions.
 for(let i=0;i<17;i++){const x=-27+i*3.5;a.tree(x,-18-rng()*5,.8+rng()*.8,i%3,0);}for(let i=0;i<7;i++){a.box(-26+i*8,4,-32,2,12,2.4,0x77877a);a.box(-22+i*8,10,-32,8.4,.6,2.5,0x94a092);}for(let i=0;i<35;i++){let q=i*2.4;a.flowers(Math.cos(q)*(18+i%8),Math.sin(q)*(17+i%9),.5);}
 a.commit();}
function draw(out,sim,t){const A=G.RealmAdventure,s=sim.state.adventure,r=AR.runtime(sim),p=sim.state.player,base=sim.room===G.RealmCosmos?.ROOM?G.RealmCosmos.height(p.x,p.z):sim.room?1.58:1.31;
 const add=(k,x,y,z,w,h,d,c,o={})=>out[k].push({p:[x,y,z],s:[w,h,d],c,...o}),box=(...a)=>add('box',...a);
 function ring(x,y,z,rad,col,yaw=0){for(let i=0;i<26;i++){const q=i*TAU/26;const xx=Math.sin(q)*rad,yy=Math.cos(q)*rad;box(x+xx*Math.cos(yaw),y+yy,z-xx*Math.sin(yaw),.12,.19,.07,col,{r:[0,yaw,-q],em:.15});}}
 if(sim.room==='range')for(const e of r.enemies){const col=e.id==='range-west'?0xc99165:e.id==='range-mid'?0x9acbd8:0xe2c875;for(const x of[-.42,.42])box(e.x+x,2.0,e.z,.12,1,.15,0x796953,{r:[0,0,x*.35]});box(e.x,2.5,e.z,.12,1.8,.16,0x8c785c);ring(e.x,2.9,e.z,.78,e.flash>s.elapsed?0xffeed1:col);ring(e.x,2.9,e.z+.04,.46,0xe5dbc0);ring(e.x,2.9,e.z+.08,.18,col);add('disc',e.x,2.9,e.z-.02,1.44,.08,1.44,0x7c6c55,{r:[Math.PI/2,0,0]});for(let j=0;j<(r.range.hits[e.id]||0);j++)add('octa',e.x-.17+j*.34,4.0,e.z,.18,.3,.14,0xf6d38a,{em:.8});if(e.id==='range-east')box(6,1.63,-5,5,.12,.18,0x90877a);}
 for(const shot of r.arrows){const yaw=Math.atan2(shot.dx,shot.dz),y=base+1.25;box(shot.x,y,shot.z,.045,.045,.8,0xdac6a0,{r:[0,yaw,0],em:.2});add('octa',shot.x+shot.dx*.40,y,shot.z+shot.dz*.40,.13,.09,.24,shot.color,{r:[0,yaw,0],em:.7});for(let i=1;i<5;i++)box(shot.x-shot.dx*i*.23,y,shot.z-shot.dz*i*.23,.045,.045,.15,shot.special?0xaedbdf:0xf1d295,{r:[0,yaw,0],em:1-i*.1});}
}
G.RealmArsenalArt={court,draw};})(globalThis);
