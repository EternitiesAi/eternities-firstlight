/* Exports the traveler rig's rest parts (kind, centre, size, basis, limb joints) so the Blender
 * bake fits human geometry to the exact envelopes the rig draws. Writes assets/source/human-bodies/RIG_PARTS.json.
 * Node only: no Blender, network or browser. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
require(path.join(root,'src/engine.js'));require(path.join(root,'src/creative.js'));
const T=require(path.join(root,'src/traveler-art.js'));
const out={box:[],round:[],octa:[],disc:[],capsule:[],'traveler-cloth':[]};
T.draw(out,{x:0,z:0,base:0,yaw:0},T.pose({}));
const r=v=>Number(Number(v).toFixed(9));
const parts=[];
for(const [kind,items] of Object.entries(out))for(const it of items){
 if(!it.travelerPart||it.travelerFace)continue;
 parts.push({name:it.travelerPart,kind,p:it.p.map(r),s:it.s.map(r),m:Array.from(it.m,r),joints:it.travelerJoints?it.travelerJoints.map(j=>j.map(r)):null});
}
parts.sort((a,b)=>a.name.localeCompare(b.name));
const text=JSON.stringify({kind:'traveler-rig-rest-v1',pose:'T.pose({}) at the origin, facing +Z',parts},null,1)+'\n';
const target=path.join(root,'assets/source/human-bodies/RIG_PARTS.json');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,text);
console.log('wrote '+path.relative(root,target)+' with '+parts.length+' parts');
