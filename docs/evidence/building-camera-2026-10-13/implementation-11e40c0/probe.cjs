const path=require('path');
const root='D:/07-GAMES/Firstlight/authoring/atlantis-harbour-campaign-20261004';
require(path.join(root,'src/core.js'));require(path.join(root,'src/creative.js'));
const E=require(path.join(root,'src/engine.js'));
require(path.join(root,'src/world.js'));
const art=Object.create(global.RealmArt.WorldArt.prototype);art.map={};
art.building(-11,-6,7.1,5.5,0x875662);
const engine=Object.create(E.Engine.prototype);engine.cameraSolids=Object.entries(art.map).flatMap(([k,items])=>items.map(i=>E.solidBounds(k,i)).filter(Boolean));engine.dynamic=[];
for(const z of[-1,-1.6,-2,-2.4]){
 const focus=[-11,2.8,z],rows=[];
 for(const elevation of[.12,.28,.5,.7,.9,1.1,1.3,1.4,1.45]){
  const yaw=Math.PI,d=7.5,dir=[Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation)];
  rows.push({elevation,clear:engine.clearCameraDistance(focus,focus.map((v,i)=>v+dir[i]*d))});
 }
 console.log(JSON.stringify({z,rows}));
}
