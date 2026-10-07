/* Optional static perimeter dressing for the existing Elderweald clearing.
 * Appearance only: no terrain, collider, creature, clue, resource or save owner. */
(function(G){'use strict';
const E=G.RealmEngine,W=G.RealmWorldFoundations,D=G.RealmEarthWildSignsData,O=G.RealmEarthGrazerMotion;
if(!E?.M||typeof E.geometry!=='function'||typeof W?.walkable!=='function'||typeof W.height!=='function'||!D?.definition||!O?.PATH)throw Error('Load actual Engine/World and canonical WildSigns/Grazer geometry before habitat art.');
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const ROOM=D.ROOM,ID='earth-grazer-clearing-dressing-v1',PER_GROUP=16,MAX=128;
const GROUPS=freeze([
 {id:'west-north',x:-168.4,z:-74.9},{id:'west-edge',x:-168.4,z:-78.0},
 {id:'west-south',x:-167.7,z:-82.9},{id:'south-margin',x:-164.7,z:-84.0},
 {id:'south-east',x:-161.4,z:-83.6},{id:'east-south',x:-159.5,z:-82.7},
 {id:'east-north',x:-159.5,z:-74.6},{id:'north-margin',x:-163.7,z:-73.5}
]);
const PALETTE=freeze({tuft:[0x4c6042,0x61724d,0x74815a],litter:[0x72634a,0x897556,0x9b8864],stone:[0x70776a,0x879080]});
const services=W.definition(ROOM)?.points;if(!Array.isArray(services))throw Error('Use the actual Earthlands service catalogue.');
const RESERVES=freeze({
 loop:O.PATH.points.map(p=>({x:p.x,z:p.z})),loopRadius:1.6,
 bypass:D.bypass.map(p=>({x:p.x,z:p.z})),bypassRadius:1,
 pestApproach:[D.evidence[2],{x:-158,z:-90},{x:-164.4,z:-92.8}].map(p=>({x:p.x,z:p.z})),
 clues:D.evidence.map(p=>({x:p.x,z:p.z,radius:1.8})),
 overlook:{x:D.overlook.x,z:D.overlook.z,radius:2.8},
 services:services.map(p=>({x:p.x,z:p.z,radius:3})),
 pest:{x:D.enemy.x,z:D.enemy.z,radius:3}
});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function toSegment(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function clearance(p,radius){
 const route=(points,r,close=false)=>{let value=Infinity;for(let i=1;i<points.length;i++)value=Math.min(value,toSegment(p,points[i-1],points[i])-r-radius);if(close)value=Math.min(value,toSegment(p,points.at(-1),points[0])-r-radius);return value;};
 return Math.min(route(RESERVES.loop,RESERVES.loopRadius,true),route(RESERVES.bypass,RESERVES.bypassRadius),route(RESERVES.pestApproach,1),
 ...[...RESERVES.clues,...RESERVES.services,RESERVES.overlook,RESERVES.pest].map(q=>distance(p,q)-q.radius-radius));
}
const unitMeshes=new Map();
function vertices(kind){if(!unitMeshes.has(kind)){const raw=E.geometry(kind),points=[];for(let i=0;i<raw.length;i+=6)points.push(Array.from(raw.slice(i,i+3)));unitMeshes.set(kind,points);}return unitMeshes.get(kind);}
// Fixed arithmetic variation, independent of time, state, input or global RNG.
const fraction=n=>n-Math.floor(n),varied=(group,slot,salt)=>fraction((group+1)*.61803398875+(slot+1)*.41421356237+salt*.73205080757);
function parts(room,options={}){
 if(room!==ROOM)return[];
 if(!options||typeof options!=='object'||Array.isArray(options)||!['low','balanced','high'].includes(options.quality??'balanced'))throw TypeError('Use a declared habitat quality.');
 const quality=options.quality??'balanced',out=[];
 for(let group=0;group<GROUPS.length;group++){
  if(quality==='low'&&group%2)continue;
  const center=GROUPS[group];
  for(let slot=0;slot<PER_GROUP;slot++){
   const role=slot<6?'tuft':slot<14?'litter':'stone',kind=role==='litter'?'box':'octa';
   const x=center.x+((slot%4)-1.5)*.42+(varied(group,slot,1)-.5)*.03,
    z=center.z+(Math.floor(slot/4)-1.5)*.42+(varied(group,slot,2)-.5)*.03,
    yaw=varied(group,slot,3)*Math.PI*2;
   const s=role==='tuft'?[.18+varied(group,slot,4)*.10,.085+varied(group,slot,5)*.06,.16+varied(group,slot,6)*.10]:
    role==='litter'?[.17+varied(group,slot,4)*.09,.015+varied(group,slot,5)*.010,.065+varied(group,slot,6)*.04]:
    [.20+varied(group,slot,4)*.08,.045+varied(group,slot,5)*.035,.18+varied(group,slot,6)*.08];
   const r=role==='litter'?[(varied(group,slot,7)-.5)*.14,yaw,(varied(group,slot,8)-.5)*.10]:[0,yaw,0];
   const local=E.M.compose(0,0,0,...s,...r),mesh=vertices(kind).map(p=>E.M.transform(local,p)),
    bottom=Math.min(...mesh.map(p=>p[1])),radius=Math.max(...mesh.map(p=>Math.hypot(p[0],p[2]))),base=W.height(ROOM,x,z);
   if(!Number.isFinite(base)||!W.walkable(ROOM,x,z,radius)||clearance({x,z},radius)<.02)throw Error('Habitat would intrude on supported living space: '+center.id+'/'+slot);
   const p=[x,base+.012-bottom,z],m=E.M.compose(...p,...s,...r);
   for(const v of vertices(kind).map(v=>E.M.transform(m,v))){const floor=W.height(ROOM,v[0],v[2]);if(!W.walkable(ROOM,v[0],v[2],0)||!Number.isFinite(floor)||v[1]<floor+.0119||v[1]>floor+.23)throw Error('Habitat ground clearance or height envelope changed.');}
   out.push({kind,p,s,r,m,c:E.hex(PALETTE[role][(group+slot)%PALETTE[role].length]),rough:1,em:0,wind:0,
    appearanceOnly:true,cameraSolid:false,cutaway:false,habitatPart:role,habitatGroup:center.id,habitatId:ID+':'+group+':'+slot});
  }
 }
 if(out.length>MAX)throw RangeError('Static habitat budget exceeded.');
 return out;
}
function make(art,sim){
 if(sim?.room!==ROOM||sim.worldDive)return 0;
 if(typeof art?.add!=='function')throw TypeError('Use the actual static WorldArt.add caller.');
 const ps=parts(sim.room,{quality:sim.state.settings.quality,reducedMotion:sim.state.settings.reducedMotion});
 for(const {kind,p,s,c,...opt}of ps)art.add(kind,...p,...s,c,opt);
 return ps.length;
}
const api=Object.freeze({ID,ROOM,MAX,PER_GROUP,GROUPS,PALETTE,RESERVES,parts,make});
G.RealmEarthGrazerHabitatArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
