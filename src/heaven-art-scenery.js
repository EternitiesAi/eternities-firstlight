/* Heaven scenery: bone tiers and bell towers over a cloud sea, gold arches and a bridge, ruby banners, a garden in flower,
 * the envoy's house, light shafts and motes. Every piece is non-solid art placed off the walking lines, so the patches,
 * the solids and the campaign's step points stay as they are. The heaven painter calls decorate(); the grade is set here. */
(function(G){'use strict';
const TAU=Math.PI*2,BONE=0xefe6cf,BONE2=0xe2d6bb,GOLD=0xc9a055,GOLD2=0xe7c677,RUBY=0x8f1538,CLOUD=0xf7f1e3,CLOUD2=0xeadfc9,
 LIGHT=0xfff1c9,FLOWERS=[0xd98aa0,0xf0c060,0xf7f1e1,0xa3224a,0xe9a9bd];
const NONSOLID={cameraSolid:false,cutaway:false};

function decorate(art,def,opts={}){
 const h=typeof opts.height==='function'?opts.height:()=>1.57,rnd=typeof opts.rng==='function'?opts.rng:Math.random;
 // the heaven grade: a luminous warm sky, gold fog and a warm sun. The engine reads these atmosphere fields for the realm.
 art.e.worldAtmosphere={top:0xf6ebd3,fog:0xf3dca8,night:.04,power:.98,sunColor:0xfff3d6};
 const B=(x,y,z,w,hh,d,c,o={})=>art.add('box',x,y,z,w,hh,d,c,{...NONSOLID,...o});
 const C=(x,y,z,r,hh,c,o={})=>art.add('cylinder',x,y,z,r,hh,r,c,{...NONSOLID,...o});
 const O=(x,y,z,s,c,o={})=>art.add('octa',x,y,z,s,s,s,c,{...NONSOLID,...o});
 const R=(x,y,z,s,c,o={})=>art.add('round',x,y,z,s,s,s,c,{...NONSOLID,...o});

 // a bell tower in four bone tiers, each with a gold cornice and ruby banners; a gold spire and a glowing bell.
 const tower=(x,z,base,hh,plan)=>{
  const tiers=4,th=hh/tiers;
  for(let i=0;i<tiers;i++){
   const w=plan*(1-i*.16),y=base+i*th;
   B(x,y+th/2,z,w,th,w,i%2?BONE2:BONE);
   B(x,y+th-.09,z,w+.34,.18,w+.34,GOLD);
   B(x+w/2+.04,y+th*.5,z,.1,th*.62,w*.46,RUBY,{em:.12});
   B(x,y+th*.5,z+w/2+.04,w*.46,th*.62,.1,RUBY,{em:.12});
  }
  const top=base+hh;
  C(x,top+1.1,z,.22,2.2,GOLD2,{em:.25});
  O(x,top+2.5,z,.4,GOLD2,{em:.7});
 };
 // a gold arch across the causeway; the walk passes beneath it.
 const arch=(x,z,base,span)=>{
  const half=span/2;
  C(x-half,base+2.3,z,.16,4.6,GOLD);
  C(x+half,base+2.3,z,.16,4.6,GOLD);
  B(x,base+4.7,z,span+.5,.36,.5,GOLD2,{em:.2});
  O(x,base+4.95,z,.26,RUBY,{em:.5});
  B(x-half*.5,base+3.2,z,.06,1.4,.6,RUBY,{em:.1});
  B(x+half*.5,base+3.2,z,.06,1.4,.6,RUBY,{em:.1});
 };
 // a gold-railed bone bridge over the cloud, from the garden edge out to a tower.
 const bridge=(x1,x2,z,base)=>{
  const len=x2-x1,cx=(x1+x2)/2;
  B(cx,base+.12,z,len,.24,3.2,BONE2);
  B(cx,base+.9,z-1.5,len,.1,.1,GOLD);
  B(cx,base+.9,z+1.5,len,.1,.1,GOLD);
  for(let x=x1+.5;x<x2;x+=2.5){C(x,base+.55,z-1.5,.07,1,GOLD);C(x,base+.55,z+1.5,.07,1,GOLD);}
 };

 // a cloud sea: a bone plate under the realm, and cloud billows just beyond its edges.
 B(0,-3.6,-40,150,.6,150,CLOUD2,{em:.05});
 for(let i=0;i<14;i++){const a=i/14*TAU;R(70*Math.cos(a),-2.8+rnd()*.6,-40+72*Math.sin(a),5+rnd()*3,CLOUD,{em:.08,rough:.95});}

 // towers rising on the horizon and at the garden's flanks, beyond the walkable ground.
 tower(0,-150,h(0,-150),30,11);
 tower(-74,-98,h(-74,-98),18,8);
 tower(74,-98,h(74,-98),18,8);
 tower(-76,14,h(-76,14),15,7);
 tower(76,14,h(76,14),15,7);
 bridge(58,70,-22,h(64,-22));

 // gold arches down the north causeway, from the garden gate.
 for(const z of[12,-8,-30])arch(0,z,h(0,z),5);

 // flower beds in the garden, a bone rim under each.
 for(const[cx,cz]of[[-20,12],[20,12],[-22,-22],[22,-22]]){
  const b=h(cx,cz);
  B(cx,b+.07,cz,7.6,.14,5.6,BONE2);
  let k=0;
  for(let ix=-2;ix<=2;ix++)for(let iz=-1;iz<=1;iz++)O(cx+ix*1.4,b+.32,cz+iz*1.5,.2,FLOWERS[k++%FLOWERS.length],{em:.14});
 }

 // shafts of light down into the garden.
 for(const[x,z]of[[-26,8],[26,8],[-30,-22],[30,-22],[-12,-44],[12,-44]])B(x,h(x,z)+7,z,.5,14,.5,LIGHT,{em:.95,rough:.4});

 // slow motes over the garden; placed once, so they hang in the air rather than drift.
 for(let i=0;i<60;i++){const x=-40+rnd()*80,z=-40+rnd()*68,y=h(x,z)+1.6+rnd()*3.6;O(x,y,z,.06,GOLD2,{em:.9});}

 // the envoy's house by the garden gate, a landmark beside the envoy's own place at (-8, 22).
 const ex=-16.5,ez=27.5,eb=h(ex,ez);
 B(ex,eb+1.3,ez,3.6,2.6,3.2,BONE);
 B(ex,eb+2.8,ez,4,.4,3.6,GOLD);
 B(ex,eb+3.15,ez,2.6,.35,2.4,GOLD2);
 B(ex,eb+.8,ez+1.62,.9,1.6,.08,RUBY,{em:.1});
 B(ex-1.1,eb+1.6,ez+1.62,.7,.7,.06,GOLD2,{em:.6});
 B(ex+1.1,eb+1.6,ez+1.62,.7,.7,.06,GOLD2,{em:.6});
 B(ex+1.84,eb+1.6,ez,.08,1.4,.9,RUBY,{em:.1});
 return{realmId:def?.id||null};
}

G.RealmHeavenArtScenery={decorate};if(typeof module!=='undefined')module.exports=G.RealmHeavenArtScenery;
})(typeof globalThis!=='undefined'?globalThis:this);
