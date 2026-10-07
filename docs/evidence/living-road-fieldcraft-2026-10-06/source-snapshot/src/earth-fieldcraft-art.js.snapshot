/* Living Road fieldcraft projection. The expedition ledger owns the
 * permanent repair; rules-branded, live projections own only temporary fitting.
 * No geometry here participates in ground, collision, rewards or save state. */
(function(G){'use strict';
const base={appearanceOnly:true,cameraSolid:false,cutaway:false,rough:.95};
const metal=0xc2ab74,previewMetal=0xa6bbc1;
const add=(out,kind,p,s,c,role,extra={})=>out.push({kind,p,s,c,opt:{...base,fieldcraftPart:role,...extra}});
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const move=(p,axis,n)=>p.map((v,i)=>v+axis[i]*n);
function frame(a,b,eastThickness=false){
 const delta=b.map((v,i)=>v-a[i]),length=Math.hypot(...delta),axis=delta.map(v=>v/length);
 // Legal previews swing outward through yaw0..20/pitch0..35. Keep the thin
 // depth on the east face across that domain instead of rolling the wide face
 // into the wall when a generic beam's reference-axis threshold is crossed.
 const ref=eastThickness?[1,0,0]:Math.abs(axis[2])<.9?[0,0,1]:[1,0,0],z=ref.map((v,i)=>v-axis[i]*dot(axis,ref)),d=Math.hypot(...z),normal=z.map(v=>v/d);
 return{axis,normal,across:cross(axis,normal),length,p:a.map((v,i)=>(v+b[i])/2)};
}
function framed(out,f,p,s,c,role,extra={}){
 // Orthogonal columns match the renderer's inverse-scaled normal convention.
 const m=[...f.across.map(v=>v*s[0]),0,...f.axis.map(v=>v*s[1]),0,...f.normal.map(v=>v*s[2]),0,...p,1];
 add(out,'timber-panel',p,s,c,role,{m,...extra});
}
function member(out,a,b,width,depth,color,role,sectionId,extra={}){
 const f=frame(a,b,role==='preview-section');framed(out,f,f.p,[width,f.length,depth],color,role,{sectionId,anchorFrom:[...a],anchorTo:[...b],...extra});return f;
}
function collar(out,g,point,index,state='permanent',f=frame(g.from,g.to)){
 const axial=.12,side=.012,face=.008,temporary=state==='preview',supplied=state==='supplied';
 const c=temporary?previewMetal:metal,role=supplied?'supplied-joint-collar':temporary?'preview-joint-collar':'joint-collar',extra={jointIndex:index,temporary};
 // Four connected plates wrap the section ends. Their inner surfaces touch
 // actual timber, rather than a solid block hiding the join or a floating band.
 for(const sign of[-1,1]){
  framed(out,f,move(point,f.across,sign*(g.width+side)/2),[side,axial,g.depth+face*2],c,role,{...extra,collarFace:sign<0?'left':'right'});
  framed(out,f,move(point,f.normal,sign*(g.depth+face)/2),[g.width,axial,face],c,role,{...extra,collarFace:sign<0?'wall':'outer'});
 }
 // The sloping dark seam remains visible on the outer collar face, giving the
 // scarf a shape cue in addition to its metal color. It is not a new load claim.
 const center=move(point,f.normal,g.depth/2+face+.002);
 const a=move(move(center,f.axis,-.045),f.across,-.045),b=move(move(center,f.axis,.045),f.across,.045);
 member(out,a,b,.012,.004,0x70563d,supplied?'supplied-scarf-seam':temporary?'preview-scarf-seam':'scarf-seam',null,extra);
}
function receiver(out,g,r,inspected=false,temporary=false){
 // The beam centre sits6mm outside the actual east-wall face. This shallow
 // plate begins at that wall face and contacts the timber at every joint.
 const p=[r.point[0]+.009,r.point[1],r.point[2]];
 add(out,'box',p,[.030,.20,.30],temporary?(inspected?0xb3c7a2:0xd4b777):metal,temporary?'preview-receiver':'receiver',{
  receiverId:r.id,inspected,temporary,anchorPoint:[...r.point]
 });
 // An inspected socket gains a raised small pin, readable through shape.
 if(temporary&&inspected)add(out,'box',[p[0]+.018,p[1],p[2]],[.006,.07,.07],0xe5e0c5,'preview-inspection-pin',{receiverId:r.id,temporary:true});
}
function kit(out,g,sections,joints=[1,2,3]){
 const f={axis:[1,0,0],normal:[0,1,0],across:[0,0,1]};
 // Flat, individual supplied members rest directly on the canonical soil.
 // Local width is acrossZ and depth is vertical; length is the same2.015m
 // used by each installed section. No fictitious stock is added on seating.
 for(const section of sections){
  const p=[-143.4,g.floor+g.depth/2,-84.8+(section.index-1.5)*.24];
  framed(out,f,p,[g.width,g.sectionLength,g.depth],g.color,'supplied-section',{
   sectionId:section.id,anchorFrom:[p[0]-g.sectionLength/2,p[1],p[2]],anchorTo:[p[0]+g.sectionLength/2,p[1],p[2]]
  });
 }
 // The same three four-plate collars wait beside the timber. A collar leaves
 // this grounded stock only when both adjoining temporary sections are seated.
 for(const i of joints)collar(out,g,[-141.9,g.floor+(g.depth+.016)/2,-85.1+(i-1)*.30],i,'supplied',f);
}
function parts(ledger,pendingProjection){
 const E=G.RealmEarthExpedition,F=G.RealmEarthFieldcraft;
 if(!E||!F?.GEOMETRY||typeof F.isProjection!=='function')return[];
 let saved;try{saved=E.validate(ledger);}catch{return[];}
 const steps=new Set(saved.story.steps),g=F.GEOMETRY,out=[];
 if(steps.has('brace-root-channel')){
  for(const s of g.sections)member(out,s.from,s.to,g.width,g.depth,g.color,'installed-section',s.id);
  for(const r of g.receivers)receiver(out,g,r);
  for(let i=1;i<g.receivers.length-1;i++)collar(out,g,g.receivers[i].point,i);
  return out;
 }
 if(!steps.has('clear-root-pests'))return out;
 const pending=F.isProjection(pendingProjection,ledger)?pendingProjection:null;
 if(!pending){kit(out,g,g.sections);return out;}
 // Only the live rules projection can remove a section from supplied stock.
 // All seated-but-unfastened pieces retain preview roles, even when ready.
 const displayed=pending.sections.filter(s=>s.seated||s.preview);
 const fittedJoints=[1,2,3].filter(i=>pending.sections[i-1].seated&&pending.sections[i].seated);
 kit(out,g,g.sections.filter(s=>!displayed.some(p=>p.id===s.id)),[1,2,3].filter(i=>!fittedJoints.includes(i)));
 for(const s of displayed)member(out,s.from,s.to,g.width,g.depth,s.seated?0xa7b48d:0xd3b376,'preview-section',s.id,{temporary:true,seated:s.seated,active:s.preview});
 for(const r of pending.receivers)receiver(out,g,r,r.inspected,true);
 for(const i of fittedJoints)collar(out,g,g.receivers[i].point,i,'preview');
 return out;
}
const api=Object.freeze({parts});G.RealmEarthFieldcraftArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
