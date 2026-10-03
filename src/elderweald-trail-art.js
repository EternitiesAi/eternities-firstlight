/* Supported visual trail and undergrowth; never movement or quest authority. */
(function(G){'use strict';
const EW=G.RealmElderwealdWorld||(typeof require==='function'?require('./elderweald-world.js'):null),FLOOR=1.57;
function parts(def,quality='balanced'){
 if(def?.id!=='earthlands')return[];
 if(!['low','balanced','high'].includes(quality))throw RangeError('Unknown trail art quality.');
 const support=(x,z)=>def.patches.some(p=>p.y===FLOOR&&Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2),out=[],decor={appearanceOnly:true,cameraSolid:false,cutaway:false,rough:1};
 const add=(kind,p,s,c,role,extra={})=>out.push({kind,p,s,c,opt:{...decor,elderwealdTrail:role,...extra}});
 let serial=0;
 for(const r of EW.extension.routes)for(let i=1;i<r.points.length;i++){
  const [ax,az]=r.points[i-1],[bx,bz]=r.points[i],length=Math.hypot(bx-ax,bz-az),n=Math.ceil(length/5.5),dx=(bx-ax)/length,dz=(bz-az)/length;
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,w=.95+.12*Math.sin(serial*2.31),l=length/n;
   const corners=[-1,1].flatMap(a=>[-1,1].map(b=>[x+a*dx*l/2-b*dz*w/2,z+a*dz*l/2+b*dx*w/2]));
   const bridge=def.patches.some(p=>/bridge/.test(p.id)&&Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2);
   if(!bridge&&corners.every(([x,z])=>support(x,z)))add('box',[x,FLOOR+.007,z],[l,.012,w],serial%3===0?0x89906a:0x858863,'worn-path',{r:[0,-Math.atan2(dz,dx),0],terrain:true,route:r.id});
   if(quality!=='low'&&serial%3===0){
    const side=serial%2?1:-1,qx=x-dz*side*2.2,qz=z+dx*side*2.2;
    const clear=support(qx,qz)&&def.solids.every(p=>Math.abs(qx-p.x)>p.w/2+.8||Math.abs(qz-p.z)>p.d/2+.8)&&def.points.every(p=>Math.hypot(qx-p.x,qz-p.z)>2.5);
    if(clear)for(let k=0;k<(quality==='high'?4:3);k++)add('octa',[qx+Math.sin(k*2.1)*.15,FLOOR+.16,qz+Math.cos(k*2.1)*.15],[.22,.32,.18],[0x748b54,0x81985e,0x637c4f][k%3],'rooted-undergrowth',{wind:1,r:[0,k*1.3,0]});
   }
   serial++;
  }
 }
 if(out.length>280)throw RangeError('Trail art budget exceeded.');return out;
}
const api=Object.freeze({parts});G.RealmElderwealdTrailArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
