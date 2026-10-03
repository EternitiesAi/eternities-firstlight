/* Read-only riverbank scenery. Enemy outcomes and positions come from shared rules. */
(function(G){'use strict';const Q=G.RealmStarter;
function make(a){a.begin(Q.ROOM);a.e.theme='riverbank';a.e.isInterior=false;a.e.ambientOverride=.50;const rng=G.RealmCore.rng(1212);
 a.box(-1,.30,-2.5,22,2.4,35,0x687e60);
 for(let z=-23;z<21;z+=2.5){a.add('octa',-13,.2,z,5,2.5,4,0x768c70);a.add('octa',10.7,.25,z,2.2,1.6,3.3,0x8d9980);}
 a.box(-1,1.47,-2.5,22,.08,35,0x789065,{rough:1});
 const route=[Q.ENTRY,...Q.BUNDLES,Q.ENEMIES[2]];for(let j=1;j<route.length;j++){const p=route[j-1],q=route[j],d=Math.hypot(q.x-p.x,q.z-p.z);for(let t=0;t<=d;t+=.8)a.add('disc',p.x+(q.x-p.x)*t/d,1.525,p.z+(q.z-p.z)*t/d,2,.018,2,0xb5ac85,{rough:1});}
 // Eastern shore is outside the movement bounds; the engine supplies the surrounding water.
 for(let z=-19;z<16;z+=1.8){let sway=Math.sin(z*.73)*.22;a.add('octa',10.15+sway,1.1,z,.72+.12*Math.sin(z),.65,1.35+.18*Math.cos(z),0xa8a98a,{r:[0,sway,0]});for(let i=0;i<3;i++)a.add('round',9.7+Math.sin(z+i)*.15,1.58+i*.08,z+i*.28,.07,.42,.07,0xb3b17c,{r:[.1,0,.13],wind:1});}
 for(const o of Q.OBSTACLES){a.add('round',o.x,1.57,o.z,o.r*2,1.8,o.r*2,0x8c9987,{rough:1});a.add('round',o.x+.17,1.74,o.z-.08,o.r*1.6,1.45,o.r*1.4,0x929d89,{rough:1});}
 for(const [x,z,scale,kind]of Q.TREES)a.tree(x,z,scale,kind,1.5);
 for(let i=0;i<16;i++){const z=-23+i*2.8;a.tree(-16-rng()*3,z,.75+rng()*.6,i%3,.5);}
 // A bounded shore and far treeline, beyond the existing movement limits.
 for(let i=0;i<22;i++){const z=-22+i*1.9;a.add('round',10.4+Math.sin(i*1.7)*.4,.63,z,2.6,1.55,2.8,0x89967d,{rough:1});}
 for(let i=0;i<9;i++){const x=-27+i*7.2,z=-32-Math.sin(i)*5;a.add('round',x,-1,z,18,8+i%3*2,20,[0x60786c,0x6c8170,0x758575][i%3],{rough:1});for(let j=0;j<3;j++)a.tree(x-3+j*3.5,z+2,.6+(j%2)*.3,0,1.3+i%3*.55);}
 const onRoute=(x,z)=>route.some((b,i)=>{if(!i)return false;const a=route[i-1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz)<1.25;});
 for(let i=0;i<260;i++){const x=-10.5+rng()*20,z=-19+rng()*33;if(onRoute(x,z)||Q.BUNDLES.some(b=>Math.hypot(b.x-x,b.z-z)<1.2))continue;const h=.12+rng()*.23;a.add('leaf',x,1.52,z,.10,h,.10,0x879765,{r:[0,rng()*6.28,0],wind:1});if(i%11===0)a.add('round',x,1.56,z,.27,.13,.22,0xa4a18a,{rough:1});}
 a.box(-1.9,2.3,13.5,.17,1.7,.17,0x857557);a.box(-1.9,2.85,13.5,1.6,.4,.10,0xd0bb91);a.lamp(1.7,13,2.6,1.5);
 // Unrecovered bundles are dynamic so saving/collecting cannot leave stale scenery.
 a.commit();
}
function draw(out,sim,t){const a=sim.state.adventure,q=a.starter;
 const add=(k,x,y,z,w,h,d,c,o={})=>out[k].push({p:[x,y,z],s:[w,h,d],c,...o}),box=(...p)=>add('box',...p);
 function bundle(x,z,i){box(x,1.83,z,.8,.55,.7,0x967551);box(x,2.12,z,.92,.08,.79,0xd5bc89);box(x,1.86,z,.08,.67,.81,0x608e82);box(x,1.87,z,.93,.66,.07,0x608e82);if(i===1){box(x,2.24,z,.62,.12,.16,0xbbc0af);box(x+.23,2.20,z,.12,.14,.58,0x84704f);}if(i===2)box(x,2.28,z,.70,.22,.6,0xb8c3a1);}
 if(sim.room===Q.ROOM){for(let i=0;i<Q.BUNDLES.length;i++){const b=Q.BUNDLES[i];if(!a.pursuit?.active&&!q.bundles.includes(b.id))bundle(b.x,b.z,i);}
  for(const s of G.RealmPursuit.points(sim)){box(s.x,1.64,s.z,1.15,.15,1.0,0x657c72);for(let i=0;i<4;i++)add('octa',s.x-.35+(i%2)*.4,1.85+Math.floor(i/2)*.12,s.z-.2+(i%2)*.25,.28,.35,.35,s.id==='west-sample'?0xc69262:0xb2be79,{em:.12});box(s.x+.65,1.91,s.z,.05,.72,.05,0xc6b894);box(s.x+.65,2.23,s.z,.42,.2,.04,0xe6d59e);}
  // The existing main-view aperture reveals held equipment behind the bundle.
  // Its physical target, submitted geometry, reflections and hit rules stay fixed.
  const p=Q.PRACTICE,practice={cameraSolid:false,cutaway:true,practicePart:true};box(p.x,2.12,p.z,.18,1.3,.20,0x796346,practice);add('round',p.x,2.75,p.z,1.1,1.1,.55,0xb4a779,practice);box(p.x,2.75,p.z+.28,.17,.95,.04,0x75988b,practice);box(p.x,2.75,p.z+.29,.9,.17,.04,0x75988b,practice);
 }else if(!sim.room){
  box(Q.GATE.x,1.85,Q.GATE.z,.13,1.1,.13,0x807250);box(Q.GATE.x,2.4,Q.GATE.z,1.25,.36,.09,0xc1b18d);add('octa',Q.GATE.x+.6,2.4,Q.GATE.z,.38,.36,.1,0xc1b18d);
  if(q.reward)for(let i=0;i<3;i++)bundle(12.2+(i%2)*.9,7.1+Math.floor(i/2)*.9,i);
 }
}
G.RealmStarterArt={make,draw};})(globalThis);
