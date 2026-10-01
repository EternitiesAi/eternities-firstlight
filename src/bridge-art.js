/* Original, read-only stone crossing and distant ridge. No progress or saves. */
(function(G){'use strict';
const E=G.RealmEarth,B=E.BRIDGE;
const quiet={cameraSolid:false,cutaway:false,rough:.9,bridgePart:true};
function crossing(a){
 const stone=[0x919889,0xa1a694,0xb4b49e,0x9c9f8d];
 // Thin deck exactly meets the rule floor; no filled terrain reaches the water.
 a.box(0,B.deck-.09,B.z,B.w,.18,B.d,0x939781,quiet);
 for(let row=0;row<30;row++)for(let lane=0;lane<4;lane++){
  const z=B.from+(row+.5)*.5,x=(lane-1.5)*.88;
  a.box(x,B.deck-.022,z,.85,.044,.47,stone[(row+lane*3)%4],quiet);
 }
 for(const z of B.piers){
  a.box(0,.47,z,3.7,1.08,.56,0x848e81,quiet);
  for(const side of[-1,1]){
   a.add('octa',side*1.86,.24,z,.82,.58,.58,0x7a887e,quiet);
   a.box(side*1.79,.97,z,.24,.17,.68,0xa7ae9a,quiet);
   a.box(side*1.73,B.deck+.36,z,.16,.72,.23,0xa4a995,quiet);
   a.box(side*1.73,B.deck+.75,z,.24,.11,.31,0xc0bea3,quiet);
  }
 }
 for(let span=0;span<4;span++){
  const z=B.from+(span+.5)*3.75;
  // One original extruded vault, open below its ellipse and joined to the deck.
  a.add('bridge-vault',0,.12,z,B.w,1,1,0x9aa28d,quiet);
  for(const side of[-1,1]){
   for(let i=0;i<11;i++){
    const t=(i+.5)/11*Math.PI;
    a.box(side*1.867,.12+Math.sin(t)*1.185,z+Math.cos(t)*1.67,.035,.19,.35,
     stone[(span+i)%4],{...quiet,r:[Math.PI/2-t,0,0]});
   }
   a.box(side*1.73,B.deck+.64,z,.12,.10,3.54,0xa6aa93,quiet);
   for(let post=1;post<3;post++)a.box(side*1.73,B.deck+.32,B.from+span*3.75+post*1.25,.10,.64,.13,0x929e88,quiet);
  }
 }
 for(const z of[B.from,B.to])for(const side of[-1,1])a.box(side*1.89,B.deck+.16,z,.42,.32,.64,0xb2b59c,quiet);
 // A dressed abutment gives the narrow entry bank a built edge; it is the
 // same disclosed return landing, not a new walking region beyond the marker.
 for(let course=0;course<3;course++)for(let stone=0;stone<8;stone++){
  a.box((stone-3.5)*.76,.20+course*.43,27.47,.71,.39,1.01,0x929d8b,quiet);
 }
 // The existing marker's interaction stays at (0,16), but its board follows
 // the eastern rail rather than obstructing the centre of this narrow deck.
 const marker={...quiet,markerPart:true};
 a.box(1.72,B.deck+.62,16,.10,1.24,.10,0x756349,marker);
 a.box(1.72,B.deck+1.11,16,.10,.44,1.38,0x917954,marker);
 for(const z of[15.35,16.65])a.box(1.72,B.deck+1.11,z,.14,.48,.06,0xb9a177,marker);
 for(const y of[B.deck+.93,B.deck+1.29])a.box(1.656,y,16,.03,.045,1.27,0xbea977,marker);
 a.add('octa',1.653,B.deck+1.11,16,.03,.15,.15,0xc2a86c,{...marker,em:.08});
}
function mountains(a){
 // Positive-X layers sit across the channel in the optional western side view.
 // Distant scenery has no collision/interaction or borrowed castle canon.
 for(let layer=0;layer<3;layer++)for(let i=0;i<6;i++){
  const x=62+layer*38+(i%3)*5,z=-75+i*32+layer*7;
  const height=18+layer*8+Math.sin(i*1.7+layer)*6,width=35+layer*11;
  const color=[0x637873,0x819591,0xa4b1ac][layer];
  const opts={cameraSolid:false,cutaway:false,rough:1,mountainPart:true,mountainLayer:layer};
  a.add('mountain-ridge',x,-1.2,z,width,height,width*1.1,color,{...opts,r:[0,i*.8+layer,0]});
  a.add('mountain-ridge',x-4,-1.2,z+5,width*.7,height*.7,width*.8,color,{...opts,r:[0,i*.5+1,0]});
 }
}
function shoreline(a){
 // Steep bare skirts descend from existing support, without decorative flat
 // ground or any change to movement/picking. Leave the whole bridge mouth open.
 const arrival=E.PATCHES.find(p=>p.id==='arrival'),meadow=E.PATCHES.find(p=>p.id==='south-meadow'),water=.01;
 const opts={cameraSolid:false,cutaway:false,rough:1,shorelinePart:true};
 const edge=(x,z,length,yaw,width=.85)=>a.add('bank-slope',x,water,z,width,E.height(x,z)-water-.04,length,0x6d7564,{...opts,r:[0,yaw,0]});
 for(const side of[-1,1])edge(arrival.x+side*arrival.w/2,arrival.z,arrival.d,side>0?0:Math.PI);
 edge(arrival.x,arrival.z+arrival.d/2,arrival.w,-Math.PI/2);
 const notch=B.w/2+.10;
 for(const bank of[arrival,meadow]){
  const front=bank===arrival?bank.z-bank.d/2:bank.z+bank.d/2;
  const len=bank.w/2-notch;
  for(const side of[-1,1])edge(side*(notch+len/2),front,len,bank===arrival?Math.PI/2:-Math.PI/2);
 }
 // Low irregular stones close the corner joins; no stone reaches actor height.
 for(const side of[-1,1])for(const end of[-1,1]){
  const x=arrival.x+side*(arrival.w/2+.16),z=arrival.z+end*(arrival.d/2+.13);
  for(let i=0;i<3;i++)a.add('octa',x+side*i*.20,.52-i*.16,z+end*i*.19,1.08-i*.20,.95-i*.21,.96-i*.17,i%2?0x808978:0x687463,{...opts,r:[0,side*.45+i*.8,0]});
 }
}
const api={crossing,mountains,shoreline,bridge:B};G.RealmBridgeArt=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
