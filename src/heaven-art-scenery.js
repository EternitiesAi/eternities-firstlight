/* Heaven scenery: a polished bone terrace over a cloud sea. The walking ground stays flat. Terraces step down outside its
 * edges into clouds, with colonnades, bell towers on the tiers, gold arches and bridges, ruby banners, light shafts, gold
 * inlay, blossoms and the envoy's house as a landmark under a gold dome. Every piece is non-solid art, so the patches, the
 * solids and the campaign's step points stay as they are. decorate() runs once from the heaven painter and sets the grade;
 * draw() runs every frame and drifts the motes. */
(function(G){'use strict';
const TAU=Math.PI*2,FLOOR=1.57,ROOM='world-heaven';
const BONE=0xf4eee2,BONE2=0xe6dcc6,GOLD=0xd4a95c,GOLD2=0xf7dc92,RUBY=0x8f1538,RUBY2=0xc6284f,
 CLOUD=0xfdfaf3,CLOUD2=0xefe6d0,SUN=0xfffaea,HALO=0xffe7a8,LIGHT=0xfff4d6,INLAY=0xc39a48,
 BLOOM=[0xf4b9c8,0xf7da86,0xfdf8ec,0xe9869f,0xfbe9ad];
const NONSOLID={cameraSolid:false,cutaway:false};
// the walking ground is x -60..60, z -120..40 (both patches together). the terraces stand outside it.
const FOOT={x:0,z:-40,w:120,d:160};
// three tiers step down and out from the walking ground into the clouds; BOT is the bottom of every tier.
const TIERS=[{o:0,w:7,top:FLOOR-.5},{o:7,w:7,top:FLOOR-1.5},{o:14,w:9,top:FLOOR-2.6}];
const BOT=-2.4;
// the motes: a fixed scatter from a seeded generator, so every run starts from the same sky.
const MOTES=(()=>{let s=20261113;const r=()=>(s=(Math.imul(1664525,s)+1013904223)>>>0)/4294967296;const out=[];
 for(let i=0;i<110;i++)out.push({x:-52+r()*104,z:-46+r()*90,y:1.9+r()*4.4,p:r()*TAU,k:.07+r()*.11,s:.07+r()*.05,c:i%5?GOLD2:0xfff6dc});
 return out;})();

// a point just outside the walking ground on one side (0 west, 1 east, 2 north, 3 south), off units out, u along it.
function sidePoint(side,off,u){
 if(side===0)return[FOOT.x-FOOT.w/2-off,FOOT.z-FOOT.d/2+u*FOOT.d];
 if(side===1)return[FOOT.x+FOOT.w/2+off,FOOT.z-FOOT.d/2+u*FOOT.d];
 if(side===2)return[FOOT.x-FOOT.w/2+u*FOOT.w,FOOT.z-FOOT.d/2-off];
 return[FOOT.x-FOOT.w/2+u*FOOT.w,FOOT.z+FOOT.d/2+off];
}

function decorate(art,def,opts={}){
 const h=typeof opts.height==='function'?opts.height:()=>FLOOR,rnd=typeof opts.rng==='function'?opts.rng:Math.random;
 // the grade: a clear deep blue overhead, gold at the horizon, a warm white sun, and less ambient light than the
 // cosmos default so the stone and the shadows keep their contrast. the engine reads these fields for the realm.
 art.e.worldAtmosphere={top:0x4a85d2,fog:0xfbe3a8,night:.02,power:1.12,sunColor:0xfff7e6};
 art.e.ambientOverride=.36;
 const B=(x,y,z,w,hh,d,c,o={})=>art.add('box',x,y,z,w,hh,d,c,{...NONSOLID,...o});
 const C=(x,y,z,r,hh,c,o={})=>art.add('cylinder',x,y,z,r,hh,r,c,{...NONSOLID,...o});
 const O=(x,y,z,s,c,o={})=>art.add('octa',x,y,z,s,s,s,c,{...NONSOLID,...o});
 const R=(x,y,z,s,c,o={})=>art.add('round',x,y,z,s,s,s,c,{...NONSOLID,...o});

 // a stepped terrace in bone with gold cornices. ruby glass only when asked, so ruby stays rare.
 const terrace=(x,z,base,tiers,w0,th,glass=false)=>{
  for(let i=0;i<tiers;i++){
   const w=w0*(1-i*.15),y=base+i*th;
   B(x,y+th/2,z,w,th,w,i%2?BONE2:BONE,{rough:.4});
   B(x,y+th-.1,z,w+.6,.2,w+.6,GOLD,{rough:.35});
   if(glass)for(const s of[-1,1]){
    B(x+s*(w/2+.03),y+th*.5,z,.06,th*.5,w*.42,RUBY2,{em:.25});
    B(x,y+th*.5,z+s*(w/2+.03),w*.42,th*.5,.06,RUBY2,{em:.25});
   }
  }
  return base+tiers*th;
 };
 // a bell tower on a terrace: a bone shaft with lit gold openings, a gold belfry, a spire and a glowing bell.
 const belltower=(x,z,base,hh,plan,crown=true)=>{
  const top=base+hh;
  B(x,base+hh/2,z,plan,hh,plan,BONE,{rough:.4});
  for(const s of[-1,1]){
   B(x+s*(plan/2+.03),base+hh*.72,z,.06,hh*.3,plan*.42,GOLD2,{em:.35});
   B(x,base+hh*.72,z+s*(plan/2+.03),plan*.42,hh*.3,.06,GOLD2,{em:.35});
  }
  B(x,top+.3,z,plan+.8,.6,plan+.8,GOLD,{rough:.35});
  for(const sx of[-1,1])for(const sz of[-1,1])C(x+sx*plan*.36,top+1.5,z+sz*plan*.36,.14,2.4,GOLD2,{em:.2});
  B(x,top+2.8,z,plan*.9,.3,plan*.9,GOLD2,{em:.2});
  C(x,top+4,z,.16,2.2,GOLD2,{em:.35});
  O(x,top+5.3,z,.42,GOLD2,{em:.8});
  if(crown)O(x,top+6.4,z,.22,RUBY2,{em:1});
 };
 // a gold arch over a path; the walk passes beneath it. the gate keeps two ruby banners.
 const arch=(x,z,base,span,banners)=>{
  const half=span/2;
  for(const s of[-1,1])C(x+s*half,base+3,z,.2,6,GOLD);
  B(x,base+6,z,span+.9,.46,.6,GOLD2,{em:.3});
  B(x,base+6.7,z,span*.6,.36,.5,BONE2,{rough:.4});
  O(x,base+6.4,z,.3,RUBY2,{em:.8});
  if(banners)for(const s of[-1,1])B(x+s*half*.5,base+3.6,z,.12,2.2,.7,RUBY2,{em:.2});
 };
 // a colonnade of bone columns with gold capitals under one lintel. it runs along x when z is fixed, else along z.
 // gap skips the columns near one along-coordinate, so a bridge can pass through.
 const colonnade=(x1,z1,x2,z2,base,n,hh,gap)=>{
  const alongZ=x1===x2;
  for(let i=0;i<n;i++){
   const t=i/(n-1),x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;
   if(gap&&Math.abs((alongZ?z:x)-gap.c)<gap.h)continue;
   B(x,base+.12,z,1.2,.24,1.2,BONE2,{rough:.4});
   C(x,base+.24+hh/2,z,.34,hh,BONE,{rough:.4});
   B(x,base+.24+hh+.1,z,1,.2,1,GOLD,{rough:.35});
  }
  B((x1+x2)/2,base+hh+.5,(z1+z2)/2,alongZ?.8:Math.abs(x2-x1)+1.2,.4,alongZ?Math.abs(z2-z1)+1.2:.8,GOLD2,{em:.2});
 };
 // a bone bridge with gold rails, from the walking ground out over the terraces to a tower.
 const bridge=(x1,x2,z,base)=>{
  const len=x2-x1,cx=(x1+x2)/2;
  B(cx,base+.14,z,len,.28,4.2,BONE2,{rough:.4});
  for(const s of[-1,1]){
   B(cx,base+1,z+s*2,len,.12,.12,GOLD);
   for(let x=x1+.6;x<x2;x+=2.4)C(x,base+.6,z+s*2,.08,1.2,GOLD);
  }
 };

 // the terraces: each tier steps down and out with a gold lip on its outer edge, so the walk's edge drops into cloud.
 for(const t of TIERS){
  const reach=t.o+t.w,hh=t.top-BOT,cy=(t.top+BOT)/2,span=FOOT.d+2*reach,across=FOOT.w+2*reach;
  B(FOOT.x-FOOT.w/2-t.o-t.w/2,cy,FOOT.z,t.w,hh,span,BONE2,{rough:.4});
  B(FOOT.x+FOOT.w/2+t.o+t.w/2,cy,FOOT.z,t.w,hh,span,BONE2,{rough:.4});
  B(FOOT.x,cy,FOOT.z-FOOT.d/2-t.o-t.w/2,across,hh,t.w,BONE2,{rough:.4});
  B(FOOT.x,cy,FOOT.z+FOOT.d/2+t.o+t.w/2,across,hh,t.w,BONE2,{rough:.4});
  B(FOOT.x-FOOT.w/2-reach+.2,t.top+.05,FOOT.z,.4,.1,span,GOLD,{rough:.35});
  B(FOOT.x+FOOT.w/2+reach-.2,t.top+.05,FOOT.z,.4,.1,span,GOLD,{rough:.35});
  B(FOOT.x,t.top+.05,FOOT.z-FOOT.d/2-reach+.2,across,.1,.4,GOLD,{rough:.35});
  B(FOOT.x,t.top+.05,FOOT.z+FOOT.d/2+reach-.2,across,.1,.4,GOLD,{rough:.35});
 }

 // the cloud sea: a plate under the terraces, billows along their foot and banks on the far horizon.
 B(FOOT.x,-4.6,FOOT.z,260,.6,260,CLOUD2,{em:.06});
 for(let i=0;i<72;i++){
  const[x,z]=sidePoint(i%4,18+rnd()*40,rnd());
  R(x,-2.6+rnd()*.8,z,6+rnd()*5,CLOUD,{em:.14,rough:.95});
 }
 for(let i=0;i<14;i++){const[x,z]=sidePoint(i%4,88+rnd()*34,rnd());R(x,1+rnd()*3,z,12+rnd()*5,CLOUD,{em:.12,rough:.95});}

 // the city on the north horizon: a great terrace with its bell tower, lesser terraces beside it, plinth towers at its wings.
 belltower(0,-168,terrace(0,-168,-1.6,5,40,6,true),18,9);
 belltower(-46,-160,terrace(-46,-160,-1.6,3,26,6),14,8);
 belltower(46,-160,terrace(46,-160,-1.6,3,26,6),14,8);
 belltower(-82,-178,terrace(-82,-178,-1.6,2,18,5),20,7);
 belltower(82,-178,terrace(82,-178,-1.6,2,18,5),20,7);
 // bell towers on the outer tier: the corners and the midpoints of both flanks, and the south corners.
 const T=TIERS[2].top;
 for(const[x,z,hh,plan]of[[-78.5,-138.5,22,8],[78.5,-138.5,22,8],[-78.5,-40,16,8],[78.5,-40,16,8],[-78.5,58.5,18,8],[78.5,58.5,18,8]])belltower(x,z,T,hh,plan);
 // gold bridges from the walking ground's flanks out to the midpoint towers.
 bridge(60,74.5,-40,FLOOR);
 bridge(-74.5,-60,-40,FLOOR);

 // colonnades on the first tier, round the walking ground. the bridges pass through the gaps in the flank colonnades.
 const T1=TIERS[0].top,gap={c:-40,h:4};
 colonnade(-63.5,-118,-63.5,38,T1,22,6.4,gap);
 colonnade(63.5,-118,63.5,38,T1,22,6.4,gap);
 colonnade(-60,-123.5,60,-123.5,T1,16,6.4);
 colonnade(-60,43.5,60,43.5,T1,16,6.4);
 // ruby banners hang from the north colonnade.
 for(const x of[-30,0,30])B(x,T1+5.3,-123.5,.12,2.6,.9,RUBY2,{em:.2});

 // the gate that remained open on the arrival path, and gold arches over the causeway.
 arch(0,22,h(0,22),8,true);
 for(const z of[12,-8,-30])arch(0,z,h(0,z),5,false);

 // gold inlay lines set flush in the walking ground, and gold edges round it.
 for(let x=-50;x<=50;x+=10)B(x,h(x,-40)+.03,-40,.12,.02,160,INLAY,{rough:.35});
 for(let z=-110;z<=30;z+=20)B(0,h(0,z)+.03,z,120,.02,.12,INLAY,{rough:.35});
 for(const s of[-1,1])B(s*59.4,h(0,-40)+.03,-40,.8,.02,160,GOLD,{rough:.35});
 B(0,h(0,40)+.03,39.4,120,.02,.8,GOLD,{rough:.35});
 B(0,h(0,-120)+.03,-119.4,120,.02,.8,GOLD,{rough:.35});

 // flower beds in the garden, a bone rim under each, blooming in rose, gold and white.
 for(const[cx,cz]of[[-20,12],[20,12],[-22,-22],[22,-22]]){
  const b=h(cx,cz);
  B(cx,b+.07,cz,7.6,.14,5.6,BONE2,{rough:.4});
  let k=0;
  for(let ix=-2;ix<=2;ix++)for(let iz=-1;iz<=1;iz++)O(cx+ix*1.4,b+.36,cz+iz*1.5,.26,BLOOM[k++%BLOOM.length],{em:.14});
 }
 // blossoms through the garden, so it reads as a garden in flower from the arrival.
 for(let i=0;i<80;i++){const x=-50+rnd()*100,z=-44+rnd()*76,b=h(x,z);O(x,b+.2+rnd()*.25,z,.16,BLOOM[i%BLOOM.length],{em:.12});}

 // light shafts down into the garden, each with a pool of light where it lands.
 for(const[x,z]of[[-40,-10],[40,-10],[-30,-30],[30,-30],[-14,-62],[14,-62]]){const b=h(x,z);B(x,b+12,z,1,24,1,LIGHT,{em:.9,rough:.4});C(x,b+.05,z,2.4,.1,LIGHT,{em:.8});}

 // the envoy's house by the garden gate, the landmark of the arrival: a bone house under a gold dome, a small bell tower
 // over it, and a pool of light with four lanterns round it.
 const ex=-16.5,ez=27.5,eb=h(ex,ez);
 C(ex,eb+.05,ez,4.4,.1,LIGHT,{em:.7});
 B(ex,eb+1.3,ez,3.8,2.6,3.4,BONE,{rough:.4});
 B(ex,eb+2.8,ez,4.2,.4,3.8,GOLD,{rough:.35});
 R(ex,eb+3.5,ez,1.9,GOLD2,{em:.25,rough:.3});
 C(ex,eb+5.2,ez,.5,2.2,BONE2,{rough:.4});
 O(ex,eb+6.6,ez,.36,GOLD2,{em:.9});
 O(ex,eb+7.4,ez,.18,RUBY2,{em:1});
 for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])O(ex+sx*2.9,eb+1.5,ez+sz*2.9,.22,GOLD2,{em:1});
 B(ex,eb+.8,ez+1.72,.9,1.6,.08,RUBY,{em:.12});
 B(ex-1.1,eb+1.6,ez+1.72,.7,.7,.06,GOLD2,{em:.6});
 B(ex+1.1,eb+1.6,ez+1.72,.7,.7,.06,GOLD2,{em:.6});

 // the sun low over the north city, its disc behind the great tower, so the towers stand against the light.
 R(0,44,-196,14,SUN,{em:1});
 R(0,44,-196,26,HALO,{em:.45});
 return{realmId:def?.id||null};
}

// the motes drift slowly over the garden every frame. reduced motion and pause hold them still.
function draw(out,sim,time){
 const M=G.RealmEngine?.M;
 if(!M||!out?.octa||sim?.room!==ROOM)return;
 const still=!!sim.paused||!!sim.state?.settings?.reducedMotion||!Number.isFinite(time),t=still?0:time,root=M.compose(0,FLOOR,0,1,1,1,0,0,0);
 for(const m of MOTES){
  const x=m.x+Math.sin(t*m.k+m.p)*1.1,z=m.z+Math.cos(t*m.k*.8+m.p)*1.1,y=m.y+Math.sin(t*m.k*.6+m.p*1.3)*.4,s=m.s;
  out.octa.push({p:M.transform(root,[x,y,z]),s:[s,s,s],m:M.mul(root,M.compose(x,y,z,s,s,s,0,0,0)),c:m.c,rough:.86,
   cameraSolid:false,cutaway:false,appearanceOnly:true,em:.9});
 }
}

G.RealmHeavenArtScenery={decorate,draw};if(typeof module!=='undefined')module.exports=G.RealmHeavenArtScenery;
})(typeof globalThis!=='undefined'?globalThis:this);
