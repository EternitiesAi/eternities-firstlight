/* Quarry scenery follows the rendered grass lip; it never owns ground. */
(function(G){'use strict';
const {M,WATER_HEIGHT}=G.RealmEngine;
const LIMIT=Object.freeze({x:18,from:-24,to:-6});
function matrix(p){return p.m||M.compose(...p.p,...p.s,...(p.r||[0,0,0]));}
function edge(p,end){return M.transform(matrix(p),[.5,-.5,end]);}
function parts(strips){
 const selected=strips.filter(p=>p.terrain&&Math.abs(p.p[0]+p.s[0]/2-LIMIT.x)<1e-6&&p.p[2]>=LIMIT.from+.25&&p.p[2]<=LIMIT.to-.25).slice().sort((a,b)=>a.p[2]-b.p[2]),groups=[];
 // Short sections let the outward width taper into the unchanged wall at each
 // end. Never group across the different grass plane at the mill-road merge.
 for(const p of selected){const last=groups[groups.length-1];if(last&&last.length<4&&Math.abs(last[0].p[0]-p.p[0])<1e-6&&Math.abs((last[0].r?.[0]||0)-(p.r?.[0]||0))<1e-8)last.push(p);else groups.push([p]);}
 return groups.map((rows,i)=>{
  const from=edge(rows[0],-.5),to=edge(rows[rows.length-1],.5),dy=to[1]-from[1],dz=to[2]-from[2],length=Math.hypot(dy,dz),pitch=Math.atan2(-dy,dz),c=Math.cos(pitch),s=Math.sin(pitch);
  // Pitch moves the foot vertically and along Z. Sink every foot vertex,
  // then compensate that same pitch so the upper seam matches the grass.
  const base=WATER_HEIGHT-.18-Math.abs(s*length)/2,height=((from[1]+to[1])/2-base)/c;
  const widths=[.2,.64,1.08,1.35,1.24,1.1,.97,.58,.2],colors=[0x737b67,0x78806c,0x747c67,0x79806b,0x747c68,0x76806a,0x737b66,0x777e69,0x747b66];
  const p=[from[0],base,(from[2]+to[2])/2-s*height],size=[widths[i],height,length],r=[pitch,0,0];
  return{kind:'bank-slope',p,s:size,r,c:colors[i],m:M.compose(...p,...size,...r),rough:1,cameraSolid:false,cutaway:false,quarryShoulder:true,id:'quarry-east-shoulder-'+(i+1),sourceStrips:rows.length,seam:[from,to]};
 });
}
function draw(a,strips){const built=parts(strips);for(const p of built){const{kind,p:pos,s:size,c,...opt}=p;a.add(kind,...pos,...size,c,opt);}return{limit:LIMIT,partCount:built.length,triangles:built.length*72,sourceStrips:built.reduce((n,p)=>n+p.sourceStrips,0)};}
const api={LIMIT,parts,draw};G.RealmEarthShoulderArt=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
