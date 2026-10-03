/* Original Coastward exterior dressing. Existing realm solids remain the only
 * building/body authority; this module creates neither interiors nor work. */
(function (G) {
 'use strict';
 const profiles = Object.freeze([
  Object.freeze({id:'west-house',roof:0x685f4e,wood:0x796047,shutter:0x6d7659}),
  Object.freeze({id:'east-house',roof:0x75634d,wood:0x81664a,shutter:0x7a6c52}),
  Object.freeze({id:'field-store',roof:0x637565,wood:0x756047,shutter:0x68775f})
 ]);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
 const unit=a=>{const length=Math.hypot(...a);return a.map(x=>x/length);};
 function parts(def,context={}) {
  if(!def || def.id!=='earthlands') return [];
  if(!Array.isArray(def.solids)) throw new TypeError('Coastward solid definitions are required.');
  const height=typeof context.height==='function'?context.height:()=>1.57;
  // Resolve all parents before producing any output. A malformed definition
  // cannot leave half a dressed settlement in the caller's geometry writer.
  const buildings=profiles.map(profile=>{
   const matches=def.solids.filter(s=>s.id===profile.id);
   if(matches.length!==1) throw new TypeError('One parent solid is required: '+profile.id);
   const solid=matches[0],base=height(solid.x,solid.z);
   if(!['x','z','w','d','h'].every(k=>Number.isFinite(solid[k])) ||
      solid.w<5 || solid.d<5 || solid.h<3 || !Number.isFinite(base))
    throw new TypeError('Finite supported building dimensions are required: '+profile.id);
   return {...solid,...profile,base};
  });
  const out=[];
  for(const b of buildings) {
   const {x,z,w,d,h,base}=b,front=z+d/2,back=z-d/2,top=base+h;
   const rw=w+.56,rd=d+.5,rise=h*.28,roofBase=top+.03;
   const meta=(role,extra={})=>({cameraSolid:false,cutaway:true,rough:.94,
    solidId:b.id,structureId:b.id,worldSolidId:b.id,
    settlementPart:role,appearanceOnly:true,...extra});
   const add=(kind,p,s,c,role,extra={})=>out.push({kind,p,s,c,opt:meta(role,extra)});
   const box=(p,s,c,role,extra)=>add('box',p,s,c,role,extra);
   const beam=(a,end,width,depth,c,role,extra={})=>{
    const delta=end.map((v,i)=>v-a[i]),length=Math.hypot(...delta),axis=unit(delta);
    // Timber UVs run along local X. A positive orthonormal basis aligns that
    // grain with the actual joinery, including vertical and sloping members.
    const ref=Math.abs(axis[1])>.9?[1,0,0]:[0,1,0];
    const up=unit(ref.map((v,i)=>v-axis[i]*dot(ref,axis))),side=cross(axis,up);
    const p=a.map((v,i)=>(v+end[i])/2),s=[length,width,depth];
    const m=[...axis.map(v=>v*length),0,...up.map(v=>v*width),0,
     ...side.map(v=>v*depth),0,...p,1];
    add('timber-panel',p,s,c,role,{m,beamFrom:a,beamTo:end,...extra});
   };

   // A closed roof shell, restrained overhang, and attached framing replace
   // the former roof and flat perimeter plate. No new horizontal floor/cap.
   add('roof',[x,roofBase,z],[rw,rise,rd],b.roof,'roof-shell');
   for(const side of [-1,1]) {
    const edge=x+side*rw/2;
    beam([edge,roofBase,z-rd/2],[edge,roofBase,z+rd/2],.13,.15,b.wood,'eave-fascia');
    for(const along of [-.32,0,.32]) {
     const zz=z+d*along,inner=x+side*(w/2-.16);
     const yy=roofBase+rise*(1-Math.abs(inner-x)/(rw/2));
     beam([inner,yy-.055,zz],[edge,roofBase-.055,zz],.1,.12,b.wood,'rafter-tail');
    }
   }
   for(const side of [-1,1]) {
    const zz=z+side*rd/2;
    for(const edge of [-1,1])
     beam([x+edge*rw/2,roofBase+.025,zz],[x,roofBase+rise+.025,zz],.13,.12,b.wood,'gable-barge');
    beam([x-w/2,top-.025,zz],[x+w/2,top-.025,zz],.14,.13,b.wood,'gable-tie');
    beam([x,roofBase+.065,zz],[x,roofBase+rise-.035,zz],.13,.13,b.wood,'gable-king');
   }
   beam([x,roofBase+rise+.03,z-rd/2-.055],[x,roofBase+rise+.03,z+rd/2+.055],.12,.16,b.wood,'roof-ridge');

   // Low river-stone facing stays close to the existing solid. The small
   // mortar gaps and staggered front courses break up the former flat box.
   for(const side of [-1,1]) for(let row=0;row<(side===1?2:1);row++) {
    const n=4,span=w/n,zz=z+side*(d/2+.015);
    for(let i=0;i<n;i++) box([x-w/2+(i+.5)*span,base+.105+row*.205,zz],
     [span-.035,.18,.1],(i+row)%2?0x9d9d89:0xa9a48e,'stone-course');
   }
   for(const side of [-1,1]) box([x+side*(w/2+.015),base+.2,z],
    [.1,.38,d-.04],0x9a9b87,'stone-side');
   for(const side of [-1,1]) for(const end of [-1,1])
    beam([x+side*(w/2-.035),base+.4,z+end*(d/2-.025)],
     [x+side*(w/2-.035),top-.03,z+end*(d/2-.025)],.17,.16,b.wood,'corner-post');
   for(const side of [-1,1]) {
    beam([x-w/2,base+.48,z+side*(d/2+.035)],
     [x+w/2,base+.48,z+side*(d/2+.035)],.13,.11,b.wood,'wall-sill');
    beam([x+side*(w/2+.035),base+.48,back],[x+side*(w/2+.035),base+.48,front],
     .13,.11,b.wood,'side-sill');
    // Braces flank the closed door and finish below the shuttered windows.
    beam([x+side*(w/2-.2),base+.58,front+.055],
     [x+side*(w/2-1.1),base+1.45,front+.055],.11,.09,b.wood,'face-brace');
   }
   const face=front+.055;
   beam([x,base+.12,face],[x,base+2.12,face],1.16,.055,0x86694a,'closed-door',{closedDoor:true});
   for(const side of [-1,1]) beam([x+side*.66,base+.065,face],
    [x+side*.66,base+2.2,face],.11,.11,b.wood,'door-jamb');
   beam([x-.715,base+2.2,face],[x+.715,base+2.2,face],.11,.11,b.wood,'door-lintel');
   box([x+.39,base+1.04,front+.108],[.055,.075,.035],0xb09b67,'door-latch');
   for(const side of [-1,1]) {
    const wx=x+side*w*.3,wy=base+2.56;
    box([wx,wy,front+.027],[1.25,1.15,.045],0x5a5c50,'window-recess');
    for(const half of [-1,1]) beam([wx+half*.295,wy-.51,front+.065],
     [wx+half*.295,wy+.51,front+.065],.55,.065,b.shutter,'closed-shutter',{closedShutter:true});
    beam([wx-.7,wy-.6,front+.07],[wx+.7,wy-.6,front+.07],.12,.15,b.wood,'window-sill');
    beam([wx-.7,wy+.6,front+.045],[wx+.7,wy+.6,front+.045],.1,.105,b.wood,'window-lintel');
   }
   if(b.id==='field-store') {
    // Secured packing boards occupy the parent store wall, not the street.
    // Their exposed front faces are ordinary props, never harvestable stock.
    const px=x+w*.23,pz=front-.065;
    for(let i=0;i<4;i++) beam([px-.53,base+.55+i*.15,pz],
     [px+.53,base+.55+i*.15,pz],.12,.22,0x9a7c55,'packed-board');
    for(const side of [-1,1]) box([px+side*.35,base+.775,front+.055],
     [.055,.63,.03],0x6d6250,'packing-strap');
   }
  }
  if(out.length>180) throw new RangeError('Coastward settlement geometry budget exceeded.');
  return out;
 }
 function decorate(art,def,context={}) {
  if(!art || typeof art.add!=='function') throw new TypeError('A WorldArt geometry writer is required.');
  const geometry=parts(def,context);
  for(const p of geometry) art.add(p.kind,...p.p,...p.s,p.c,p.opt);
  return geometry.length;
 }
 const api=Object.freeze({parts,decorate});
 G.RealmCoastwardSettlementArt=api;
 if(typeof module!=='undefined') module.exports=api;
})(globalThis);
