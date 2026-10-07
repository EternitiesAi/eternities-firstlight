/* One supplied carrier and load. Presentation cannot earn an arrival or payment. */
(function(G){'use strict';
const ROOM='world-earthlands',ID='earth-first-load-through-v1',GLADE={x:-106,z:-105},BAY={x:5.8,z:-69};
const motion=new WeakMap(),frames=new WeakMap();
function owned(sim){
 let r=sim?.state?.localLife?.records?.[ID],source,s;
 if(sim?.room!==ROOM||sim.worldDive||!sim.state.adventure?.started||!r)return null;
 const D=G.RealmEarthConsignmentData;if(typeof D?.required!=='function'||typeof D?.crossValidate!=='function')return null;
 try{source=G.RealmEarthExpedition.validate(sim.state.earthExpedition);s=source.story;if(!s.claimed)return null;r=D.crossValidate(r,source);}catch{return null;}
 if(!r.accepted)return{record:r,kind:s.branch==='stormfall-recovery'?'timber':s.branch==='managed-coppice'?'fiber':null,arrived:false};
 let sequence;try{sequence=D.required(r.choice);}catch{return null;}
 const timber=r.choice==='south-stormfall'||r.choice==='north-stormfall',fiber=r.choice==='south-coppice'||r.choice==='north-coppice';
 if(!Array.isArray(sequence)||!sequence.length||(!timber&&!fiber)||!Array.isArray(r.steps)||r.steps.length>sequence.length||r.steps.some((v,i)=>v!==sequence[i])||timber&&s.branch!=='stormfall-recovery'||fiber&&s.branch!=='managed-coppice')return null;
 return{record:r,kind:timber?'timber':'fiber',arrived:r.steps.length===sequence.length};
}
function add(out,kind,part,position,size,color,frame,rotation=[0,0,0],extra={}){
 const {M,hex}=G.RealmEngine;
 const matrix=M.mul(frame,M.compose(...position,...size,...rotation));
 const item={p:M.transform(frame,position),s:size.slice(),m:matrix,c:hex(color),rough:.93,cameraSolid:false,cutaway:false,appearanceOnly:true,
  consignmentPart:part,consignmentJob:ID,...extra};
 if(Array.isArray(out[kind]))out[kind].push(item);return item;
}
function bundle(out,kind,frame,stock=false){
 const parts=[],push=(mesh,name,p,s,c,rotation,extra)=>parts.push(add(out,mesh,name,p,s,c,frame,rotation,extra));
 if(kind==='timber'){
  for(let i=0;i<4;i++){
   const p=stock?[0,.123+Math.floor(i/2)*.13,(i%2?1:-1)*.145]:[(i-1.5)*.16,1.19,-.30];
   push('timber-panel',stock?'received-timber':'carried-timber',p,[.13,1.05,.13],0x98764f,stock?[0,0,Math.PI/2]:[0,0,0],{consignmentPiece:'short-timber-'+(i+1),consignmentSource:'new-supplier'});
  }
  if(stock)for(const z of[-.145,.145]){
   for(const y of[.041,.335])push('box','received-timber-binding',[0,y,z],[.055,.034,.19],0xcab488);
   for(const side of[-.080,.080])push('box','received-timber-binding',[0,.188,z+side],[.055,.26,.03],0xcab488);
  }
  else for(const y of[1.01,1.37])push('box','carried-timber-binding',[0,y,-.30],[.64,.035,.17],0xcab488);
 }else if(kind==='fiber'){
  for(let i=0;i<3;i++)push('round',stock?'received-fibre':'carried-fibre',[(i-1)*.205,stock?.358:1.18,stock?0:-.30],[.18,.60,.19],0x9d9d70,undefined,{consignmentPiece:'binding-fibre-'+(i+1),consignmentSource:'new-supplier'});
  for(const y of stock?[.20,.47]:[1.04,1.31])push('box',stock?'received-fibre-binding':'carried-fibre-binding',[0,y,stock?0:-.30],[.64,.029,.21],0xd4bd8e);
 }
 return parts;
}
function board(out,sim,claimed){
 const {M}=G.RealmEngine,W=G.RealmWorldFoundations,y=W.height(ROOM,GLADE.x,GLADE.z),root=M.compose(GLADE.x-.9,y,GLADE.z-.85,1,1,1);
 for(const x of[-.39,.39])add(out,'timber-panel','work-order-post',[x,.45,0],[.08,.9,.10],0x736047,root);
 add(out,'timber-panel','work-order-board',[0,.91,0],[.96,.46,.065],0x8a7353,root);
 add(out,'box','work-order-page',[0,.91,.042],[.38,.34,.014],0xe2d3b0,root);
 add(out,'octa',claimed?'paid-work-order-seal':'supplied-work-order-seal',[.25,.77,.056],[.10,.10,.016],claimed?0x92b88b:0xc2aa73,root);
}
function actor(out,sim,view,kind,carrying){
 const {M}=G.RealmEngine,T=G.RealmTravelerArt,W=G.RealmWorldFoundations;
 if(!T?.motion||!T?.pose||!T?.draw)return null;
 const reduced=!!sim.state.settings?.reducedMotion,scene=ROOM+':consignment:'+(view.choice||'available');
 const sample=T.motion(motion.get(sim),{x:view.x,z:view.z,scene,time:sim.elapsed,walking:!!view.moving,paused:!!sim.paused,reducedMotion:reduced});motion.set(sim,sample);
 const pose=T.pose({...sample,time:sample.time,reducedMotion:reduced,style:'blade',combatScene:false,combatPhase:'idle',combatProgress:0,guarded:false});
 const starts=Object.fromEntries(Object.entries(out).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length]));
 const base=W.height(ROOM,view.x,view.z),frame=T.draw(out,{x:view.x,z:view.z,yaw:view.yaw||0,base,color:0x927352,profile:{skin:2,hair:1}},pose);
 // The shared rig's player tags/marker must not leak into player-only observers.
 for(const[k,start]of Object.entries(starts)){
  const list=out[k];for(let i=list.length-1;i>=start;i--){const item=list[i];if(item.travelerPart==='ground-marker'){list.splice(i,1);continue;}
   item.consignmentPart='carrier-'+item.travelerPart;item.consignmentJob=ID;item.consignmentActor='first-load-carrier-v1';item.appearanceOnly=true;
   if(item.travelerJoints)item.consignmentJoints=item.travelerJoints;
   delete item.travelerPart;delete item.travelerJoints;
  }
 }
 const cargo=carrying?bundle(out,kind,frame.root):[];
 // Strap is visible whether the paid worker is carrying or receiving the load.
 add(out,'box','carrier-pack-strap',[-.19,1.17,.157],[.036,.39,.031],0x4f4336,frame.root,[0,0,-.13]);
 return{root:Array.from(frame.root),x:view.x,z:view.z,yaw:view.yaw||0,base,walking:!!view.moving,carrying,cargoKind:kind,cargoPieces:cargo.filter(p=>p.consignmentPiece).map(p=>p.consignmentPiece),reducedMotion:reduced};
}
function draw(out,sim,projection=sim?.consignmentPresentation){
 frames.delete(sim);const state=owned(sim);if(!state?.kind)return;
 board(out,sim,state.record.claimed);
 const M=G.RealmEarthConsignmentMotion,context=sim.consignmentPresentationContext;
 const live=!!projection&&context?.sim===sim&&M?.isProjection?.(projection,context)===true&&projection.job===ID&&projection.room===ROOM;
 if(state.record.accepted&&!live&&!state.arrived)return; // No made-up intermediate actor/cargo position.
 const view=live?projection:state.arrived?{x:BAY.x,z:BAY.z,yaw:Math.PI/2,moving:false,choice:state.record.choice}:{x:GLADE.x,z:GLADE.z,yaw:Math.PI/2,moving:false,choice:null};
 const carrying=!state.arrived,frame=actor(out,sim,view,state.kind,carrying);
 let stock=[];if(state.arrived){
  const {M}=G.RealmEngine,y=G.RealmWorldFoundations.height(ROOM,BAY.x+.25,BAY.z+.9),root=M.compose(BAY.x+.25,y,BAY.z+.9,1,1,1);
  add(out,'timber-panel','receiving-stock-tray',[0,.029,0],[1.23,.058,.62],0x7d694b,root);
  stock=bundle(out,state.kind,root,true);
  add(out,'box','receiving-stock-label',[.53,.16,.30],[.20,.23,.018],0xd8caab,root);
 }
 if(frame)frames.set(sim,Object.freeze({...frame,arrived:state.arrived,claimed:state.record.claimed,stockPieces:stock.filter(p=>p.consignmentPiece).map(p=>p.consignmentPiece)}));
}
function snapshot(sim){const frame=frames.get(sim);return frame?JSON.parse(JSON.stringify(frame)):null;}
function reset(sim){motion.delete(sim);frames.delete(sim);}
const api=Object.freeze({draw,snapshot,owned,bundle,reset});G.RealmEarthConsignmentArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
