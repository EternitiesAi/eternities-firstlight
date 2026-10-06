/* Static timber fingerboards and a clear cart track on rule-owned Earth ground. */
(function(G){'use strict';
const TRACK=[[7,-38],[12,-42],[18.3,-42]];
function distance(x,z){let best=Infinity;for(let i=1;i<TRACK.length;i++){const a=TRACK[i-1],b=TRACK[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return best;}
function make(a,room){const p=G.RealmEarthRoad.endpoint(room);if(!p)return;const earth=room===G.RealmEarth.ROOM,height=(x,z)=>earth?G.RealmEarth.height(x,z):G.RealmWorldFoundations.height(room,x,z),x=p.post.x,z=p.post.z,y=height(x,z),decor={cameraSolid:false,rough:1,earthRoadPart:'fingerpost'};
 if(earth){
  // Generate the legacy field first, consuming exactly its original RNG draws.
  // Only the new track's small emission mask removes low decorative leaves.
  a.earthRoadCleared=[];if(a.map?.leaf)a.map.leaf=a.map.leaf.filter(i=>{if(distance(i.p[0],i.p[2])<1.3){a.earthRoadCleared.push(i);return false;}return true;});
  // The new patch overlaps old ground at x8..10. Render only its exposed x10+
  // strips; the pre-existing merged floor, shoulder and scenery stay intact.
  for(let zz=-46;zz<-38;zz+=.5){
   const legacy=a.map?.box?.find(i=>i.terrain&&!i.earthRoadPart&&Math.abs(i.p[0]+i.s[0]/2-10)<1e-6&&Math.abs(i.p[2]-zz-.25)<1e-6);
   if(!legacy)throw Error('Earth road requires its canonical legacy edge');
   const M=G.RealmEngine.M,old=legacy.m||M.compose(...legacy.p,...legacy.s,...(legacy.r||[0,0,0])),a0=M.transform(old,[.5,.5,-.5]),b0=M.transform(old,[.5,.5,.5]),low=a0[2],high=b0[2];
   const xs=[10,12,14,16,18.8];
   for(let i=1;i<xs.length;i++){const left=xs[i-1],right=xs[i],ha=i===1?a0[1]:height(left,low),hb=i===1?b0[1]:height(left,high),hc=height(right,low),hd=height(right,high),xx=(left+right)/2,mid=(ha+hb+hc+hd)/4,dx=(hc+hd-ha-hb)/2,dz=(hb+hd-ha-hc)/2;
    // The renderer transforms normals with orthogonal model axes. Keep this
    // local slope orthogonal too, while retaining its exact top-plane centre.
    const w=right-left,d=high-low,n=[-dx*d,w*d,-w*dz],length=Math.hypot(...n),normal=n.map(v=>v/length),projection=dx*dz/(w*w+dx*dx),row=[-projection*w,dz-projection*dx,d],center=[xx-normal[0]*.045,mid-normal[1]*.045,(low+high)/2-normal[2]*.045];
    const m=[w,dx,0,0,...normal.map(v=>v*.09),0,...row,0,...center,1];
    a.box(...center,w,.09,d,0x929768,{...decor,earthRoadPart:'ground',terrain:true,cutaway:false,m});a.box(xx,Math.min(ha,hb,hc,hd)-2.55,(low+high)/2,right-left,5,high-low+.002,0x756d5a,{...decor,earthRoadPart:'ground',cutaway:false});
   }
  }
  for(let i=1;i<TRACK.length;i++){const u=TRACK[i-1],v=TRACK[i],d=Math.hypot(v[0]-u[0],v[1]-u[1]);for(let t=0;t<d;t+=.68){const f=t/d,xx=u[0]+(v[0]-u[0])*f,zz=u[1]+(v[1]-u[1])*f;if(G.RealmEarth.walkable(xx,zz,.08))a.add('disc',xx,height(xx,zz)+.025,zz,1.7,1,1.7,0xb0a181,{...decor,earthRoadPart:'cart-track',r:[Math.atan2(height(xx,zz-.1)-height(xx,zz+.1),.2),0,0]});}}
 }
 // Coastward's matching post is already rendered from its canonical solid.
 if(earth)a.box(x,y+1.2,z,.18,2.4,.18,0x685540,{...decor,earthRoadPart:'post'});
 for(const [dy,dir]of[[2.15,-1],[1.95,1]]){a.box(x+dir*.42,y+dy,z,1.9,.24,.16,0x8c7752,decor);a.box(x+dir*1.35,y+dy,z,.2,.2,.17,0xc2ab72,{...decor,r:[0,0,Math.PI/4]});for(const face of[-1,1])for(let i=0;i<3;i++)a.box(x+dir*(.1+i*.26),y+dy,z+face*.086,.13,.06,.012,0xe0cc9c,decor);}
 if(earth){
  // Narrow appearance-only lips stay inside the supported patch.
  for(const side of[-1,1]){const zz=p.z+side*3.65;a.box(13.4,height(13.4,zz)+.015,zz,10.4,.035,.5,0x8e8a66,{...decor,earthRoadPart:'shoulder'});for(let t=0;t<6;t++){const xx=8.7+t*1.85;a.add('octa',xx,height(xx,zz)+.06,zz,.28,.15,.3,t%2?0x888976:0xa5a18a,{...decor,earthRoadPart:'shoulder'});}}
  for(const zz of[p.z-3.1,p.z+3.1])a.add('octa',18.15,height(18.15,zz)+.09,zz,.42,.21,.35,0xa39f87,{...decor,earthRoadPart:'shoulder'});
  for(let t=0;t<11;t++){const xx=8+t;for(const dz of[-.62,.62])a.box(xx,height(xx,p.z+dz)+.015,p.z+dz,.85,.03,.12,0x9b9278,{...decor,earthRoadPart:'cart-rut'});}
 }
}
G.RealmEarthRoadArt={make,distance,TRACK};if(typeof module!=='undefined')module.exports=G.RealmEarthRoadArt;
})(globalThis);
