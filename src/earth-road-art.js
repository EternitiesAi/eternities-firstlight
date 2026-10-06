/* Static timber fingerboards and a clear cart track on rule-owned Earth ground. */
(function(G){'use strict';
function make(a,room){const p=G.RealmEarthRoad.endpoint(room);if(!p)return;const earth=room===G.RealmEarth.ROOM,height=(x,z)=>earth?G.RealmEarth.height(x,z):G.RealmWorldFoundations.height(room,x,z),x=p.x+1.6,z=p.z,y=height(x,z),decor={cameraSolid:false,rough:1,earthRoadPart:'fingerpost'};
 // Coastward's post is already rendered from its collision solid. Hearthwater
 // draws its own matching post. Fingerboards sit above the clear walking body.
 if(earth)a.box(x,y+1.2,z,.18,2.4,.18,0x685540,{...decor,earthRoadPart:'post'});
 for(const [dy,dir]of[[2.15,-1],[1.95,1]]){a.box(x+dir*.42,y+dy,z,1.9,.24,.16,0x8c7752,decor);a.box(x+dir*1.35,y+dy,z,.2,.2,.17,0xc2ab72,{...decor,r:[0,0,Math.PI/4]});for(const face of[-1,1])for(let i=0;i<3;i++)a.box(x+dir*(.1+i*.26),y+dy,z+face*.086,.13,.06,.012,0xe0cc9c,decor);}
 if(earth){
  // A narrow soil lip and low stones soften only this new authored spur.
  // They add no ground, collision, work ownership or camera obstruction.
  for(const side of[-1,1]){const zz=z+side*3.65;a.box(15,height(15,zz)+.015,zz,13.6,.035,.5,0x8e8a66,{...decor,earthRoadPart:'shoulder'});for(let t=0;t<7;t++){const xx=9+t*1.9;a.add('octa',xx,height(xx,zz)+.06,zz,.28,.15,.3,t%2?0x888976:0xa5a18a,{...decor,earthRoadPart:'shoulder'});}}
  for(const zz of[z-3.1,z+3.1])a.add('octa',21.4,height(21.4,zz)+.09,zz,.42,.21,.35,0xa39f87,{...decor,earthRoadPart:'shoulder'});
  for(let t=0;t<12;t++){const xx=8+t;for(const dz of[-.62,.62])a.box(xx,height(xx,z+dz)+.015,z+dz,.85,.03,.12,0x9b9278,{...decor,earthRoadPart:'cart-rut'});}}
}
G.RealmEarthRoadArt={make};if(typeof module!=='undefined')module.exports=G.RealmEarthRoadArt;
})(globalThis);
