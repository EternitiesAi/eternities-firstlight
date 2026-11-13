/* The valley after the Regent, drawn from the change list. A change draws only when its kind is known here; draw returns
 * the ids it drew, so a test can count what is visible. Presentation only. */
(function(G){'use strict';
const C={ilan:0xb67256,cloth:0x6f7d8a,lute:0x7a5a3a,note:0xf2d9a0,bell:0xd9c79a,rope:0x6f5a40,arch:0x7b6a52,gold:0xe3c57e,grey:0x6f6e6a,post:0x5d4d3a,lantern:0xf2c27a,fox:0xb8653a,fox2:0x8e4a2a,iron:0x3f3b37,brass:0xb08d57,wood:0x6b5136,dome:0xc9d3d6,stone:0x9c9587,keeper:0x8a7f6c};
const E=()=>G.RealmEpilogue||(typeof require==='function'?require('./epilogue.js'):null),D=()=>G.RealmEpilogueData||(typeof require==='function'?require('./epilogue-data.js'):null);
// a flat strip along a road segment, centred on the segment and sitting on the ground.
function strip(a,b,w,h,c){const dx=b.x-a.x,dz=b.z-a.z;return{p:[(a.x+b.x)/2,h/2,(a.z+b.z)/2],s:[w,h,Math.hypot(dx,dz)],r:[0,Math.atan2(dx,dz),0],c};}
const KIND={
 'stage-play'(out,c,t){const x=c.at.x,z=c.at.z;
  out.box.push({p:[x,.6,z],s:[.5,1.2,.4],c:C.ilan});
  out.octa.push({p:[x,1.4,z],s:[.3,.32,.3],c:C.ilan});
  out.box.push({p:[x+.3,.9,z+.18],s:[.12,.9,.06],r:[0,0,.5],c:C.lute});
  for(let i=0;i<3;i++)out.octa.push({p:[x+.8+i*.12,1.9+Math.sin(t*2+i)*.12,z],s:[.08,.1,.08],c:C.note,em:.8});
  return true;},
 bells(out,c,t){const x=c.at.x,z=c.at.z;
  out.box.push({p:[x,3.15,z],s:[3,.05,.05],c:C.rope});
  for(let i=0;i<4;i++){const bx=x-1.2+i*.8,sway=Math.sin(t*1.7+i*1.3)*.06;out.box.push({p:[bx,2.9,z],s:[.02,.5,.02],c:C.rope});out.octa.push({p:[bx+sway,2.5,z],s:[.14,.18,.14],c:C.bell,em:.3});}
  return true;},
 arch(out,c){const x=c.at.x,z=c.at.z;
  for(const s of[-1.7,1.7])out.box.push({p:[x+s,1.6,z],s:[.24,3.2,.24],c:C.arch});
  out.box.push({p:[x,3.25,z],s:[3.8,.26,.3],c:C.arch});
  out.octa.push({p:[x,3.55,z],s:[.3,.3,.3],c:C.gold,em:.4});
  return true;},
 // the counterfeit roads go grey; when the valley is kept, every road does.
 'grey-road'(out,c,t,ending){const list=ending==='kept'?[...D().ROADS.counterfeitRoads,...D().ROADS.trueRoads]:D().ROADS.counterfeitRoads;for(const r of list)out.box.push(strip(r.a,r.b,.9,.05,C.grey));return true;},
 lantern(out){for(const r of D().ROADS.trueRoads){const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,len=Math.hypot(dx,dz);
  for(let k=1;k*5<len;k++){const u=k*5/len,x=r.a.x+dx*u,z=r.a.z+dz*u;out.box.push({p:[x,.6,z],s:[.08,1.2,.08],c:C.post});out.octa.push({p:[x,1.3,z],s:[.22,.22,.22],c:C.lantern,em:1.2});}}
  return true;},
 'curled-fox'(out,c){const x=c.at.x,z=c.at.z;
  out.box.push({p:[x,.26,z],s:[.9,.32,.42],c:C.fox});
  out.octa.push({p:[x+.5,.36,z],s:[.24,.22,.22],c:C.fox2});
  out.octa.push({p:[x-.52,.2,z+.1],s:[.36,.12,.14],c:C.fox2});
  return true;},
 // the quiet engine on the bridge: an iron case with a dull lamp, out of the box.
 engine(out,c){const x=c.at.x,z=c.at.z;
  out.box.push({p:[x,.3,z],s:[1.2,.5,.8],c:C.iron});
  out.octa.push({p:[x,.8,z],s:[.3,.3,.3],c:C.brass,em:.4});
  return true;},
 // the keeper on the Bellweather bridge: a figure with a book, reading the names.
 keeper(out,c,t){const x=c.at.x,z=c.at.z;
  out.box.push({p:[x,.6,z],s:[.5,1.2,.4],c:C.keeper});
  out.octa.push({p:[x,1.4,z],s:[.3,.32,.3],c:C.keeper});
  out.box.push({p:[x+.22,1.0+Math.sin(t)*.02,z+.2],s:[.3,.22,.06],c:C.dome});
  return true;},
 // the wagon at the far-water lookout: a cart with two wheels.
 wagon(out,c){const x=c.at.x,z=c.at.z;
  out.box.push({p:[x,.6,z],s:[2.2,.6,1.2],c:C.wood});
  for(const s of[-.9,.9])out.octa.push({p:[x+s,.3,z+.7],s:[.6,.6,.12],c:C.wood});
  return true;},
 // the little observatory dome, open to the sky.
 observatory(out,c){const x=c.at.x,z=c.at.z;
  out.box.push({p:[x,.3,z],s:[2.2,.6,2.2],c:C.stone});
  out.octa.push({p:[x,1.4,z],s:[1.8,1.2,1.8],c:C.dome,em:.2});
  return true;},
 // the garden stair: steps climbing from the path.
 stair(out,c){const x=c.at.x,z=c.at.z;
  for(let i=0;i<4;i++){const h=.15*(i+1);out.box.push({p:[x+i*.6,h/2,z],s:[.8,h,1.6],c:C.stone});}
  return true;}
};
// draw adds the instances for every change that is on and known, and returns the ids drawn.
function draw(out,sim,t){
 if(!sim?.state||sim.room!==null)return[];
 const ending=E()?.endingOf?.(sim.state)||'open',drawn=[];
 for(const c of E().changes(sim.state)){const fn=KIND[c.kind];if(fn&&fn(out,c,t,ending))drawn.push(c.id);}
 return drawn;
}
const api={draw,KIND:Object.freeze(Object.keys(KIND))};
G.RealmEpilogueArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
