/* Original Coastward woodland dressing. Ten existing solid trunks remain
 * authoritative; this bounded canopy creates no gathering or movement rules. */
(function(G){'use strict';
 const TAU=Math.PI*2,IDS=Object.freeze(Array.from({length:10},(_,i)=>'woodland-trunk-'+i));
 const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const unit=a=>{const length=Math.hypot(...a);return a.map(v=>v/length);};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function parts(def,context={}) {
  if(!def||def.id!=='earthlands')return [];
  if(!Array.isArray(def.solids))throw new TypeError('Coastward woodland solid definitions are required.');
  const height=typeof context.height==='function'?context.height:()=>1.57;
  const trees=IDS.map((id,index)=>{
   const found=def.solids.filter(s=>s.id===id);
   if(found.length!==1)throw new TypeError('One woodland parent solid is required: '+id);
   const s=found[0],base=height(s.x,s.z);
   if(!['x','z','w','d','h'].every(k=>Number.isFinite(s[k]))||s.w<.35||s.d<.35||s.w>1.3||s.d>1.3||s.h<2.5||s.h>4.5||!Number.isFinite(base))
    throw new TypeError('Finite bounded woodland parent dimensions are required: '+id);
   return {...s,base,index};
  });
  const out=[];
  for(const t of trees) {
   const {x,z,w,d,h,base,index}=t;
   const spread=(.88+(index%3)*.1)*clamp(Math.sqrt(w*d)/.65,.85,1.15);
   const angle=index*.73,profile=['rounded','angular','sheltering'][index%3];
   const wood=index%2?0x746047:0x6a5842;
   const greens=[0x55795c,0x668865,0x77966b];
   const meta=(role,extra={})=>({cameraSolid:false,cutaway:false,rough:.96,
    solidId:t.id,structureId:t.id,worldSolidId:t.id,woodlandPart:role,
    appearanceOnly:true,canopyProfile:profile,...extra});
   const add=(kind,p,s,c,role,extra={})=>out.push({kind,p,s,c,opt:meta(role,extra)});
   const beam=(a,b,width,depth,role,extra={},reference=[0,1,0])=>{
    const delta=b.map((v,i)=>v-a[i]),length=Math.hypot(...delta),axis=unit(delta);
    const ref=Math.abs(dot(reference,axis))>.95?[1,0,0]:reference;
    const up=unit(ref.map((v,i)=>v-axis[i]*dot(ref,axis))),side=cross(axis,up);
    const p=a.map((v,i)=>(v+b[i])/2),s=[length,width,depth];
    const m=[...axis.map(v=>v*length),0,...up.map(v=>v*width),0,
     ...side.map(v=>v*depth),0,...p,1];
    add('timber-panel',p,s,wood,role,{m,anchorFrom:a,anchorTo:b,...extra});
   };
   // Shallow intersecting faces texture the existing square solid bole rather
   // than hiding it inside a smaller round trunk or adding another collider.
   for(const side of [-1,1]) {
    beam([x,base+.04,z+side*(d/2+.005)],[x,base+h-.04,z+side*(d/2+.005)],
     w-.04,.018,'bark-face',{},[1,0,0]);
    beam([x+side*(w/2+.005),base+.04,z],[x+side*(w/2+.005),base+h-.04,z],
     d-.04,.018,'bark-face',{},[0,0,1]);
   }
   for(let arm=0;arm<3;arm++) {
    const a=angle+arm*TAU/3,dx=Math.cos(a),dz=Math.sin(a);
    // Ground detail stays close to the parent and above its actual floor.
    const radius=Math.min(w,d)/2+.055;
    beam([x,base+.17,z],[x+dx*radius,base+.075,z+dz*radius],.105,.105,
     'buttress-root',{lowRoot:true});
    const start=[x,base+h*.78,z],end=[x+dx*.85*spread,base+h*1.17,z+dz*.85*spread];
    beam(start,end,.16,.18,'rising-branch',{branchIndex:arm});
    const kind=profile==='angular'?'octa':'round';
    const crown=[end[0],end[1]+.22,end[2]];
    const size=kind==='octa'?[2.05*spread,1.5*spread,1.95*spread]:[2.05*spread,1.8*spread,1.95*spread];
    add(kind,crown,size,greens[(index+arm)%3],'crown-lobe',
     {foliage:true,wind:2,branchIndex:arm,restAnchor:end});
   }
   // Overlapping upper crown joins the three lower lobes into a sheltering
   // silhouette, with deterministic profile/color differences among trees.
   const topKind=profile==='angular'?'octa':'round';
   add(topKind,[x,base+h*1.46,z],[2.5*spread,(topKind==='octa'?1.65:2.1)*spread,2.4*spread],
    greens[(index+1)%3],'upper-crown',{foliage:true,wind:2});
  }
  if(out.length>220)throw new RangeError('Coastward woodland geometry budget exceeded.');
  return out;
 }
 function decorate(art,def,context={}) {
  if(!art||typeof art.add!=='function')throw new TypeError('A WorldArt geometry writer is required.');
  const geometry=parts(def,context);
  for(const p of geometry)art.add(p.kind,...p.p,...p.s,p.c,p.opt);
  return geometry.length;
 }
 const api=Object.freeze({parts,decorate});G.RealmCoastwardWoodlandArt=api;
 if(typeof module!=='undefined')module.exports=api;
})(globalThis);
