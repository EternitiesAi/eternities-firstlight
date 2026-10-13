/* Read-only authorized kit projection. No collision/NPC/payment ownership. */
(function(G){'use strict';
function parts(ledger,view){
 const P=G.RealmEarthPatrolCarrier;if(!P?.isProjection(view,ledger))return[];
 const paid=view.status==='paid',g=P.GEOMETRY,out=[],giver=G.RealmEarthExpedition.patrol.giver;
 const destination=paid?[giver.x-1.65,2.18,giver.z-.85]:g.center,offset=destination.map((n,i)=>n-g.center[i]);
 const base={cameraSolid:false,cutaway:false,appearanceOnly:true,rough:.95,carrierRun:view.run};
 const add=(kind,p,s,c,role,r=[0,0,0])=>out.push({kind,p,s,c,opt:{...base,carrierPart:role,expeditionPart:role,r}});
 if(paid){
  for(const dx of[-.48,.48])add('timber-panel',[destination[0]+dx,1.79,destination[2]],[.09,.44,.48],0x715b43,'carrier-receiving-foot');
  add('timber-panel',[destination[0],2.04,destination[2]],[1.16,.10,.58],0x947856,'carrier-receiving-tray');
  add('box',[destination[0],2.099,destination[2]+.26],[.15,.018,.06],0x9fc6a0,'carrier-received-tag');
 }
 for(const p of view.pieces){
  const lashing=p.id.startsWith('lashing'),bundle=p.id==='bundle';
  add(lashing?'box':'timber-panel',p.position.map((n,i)=>n+offset[i]),p.size,lashing?(p.seated?0xd2c18c:0x93835f):bundle?0xa2a279:0xa28256,
   paid?'carrier-received-piece':p.seated?'carrier-seated-piece':'carrier-loose-piece',[0,p.yaw,0]);
 }
 if(!paid&&view.status!=='checked')for(const r of view.receivers){
  if(view.pieces.find(p=>p.id===r.pieceId)?.seated)continue;
  const c=r.pieceId===view.activePiece?0xe5cd85:0xa9b9b1,cos=Math.cos(r.yaw),sin=Math.sin(r.yaw);
  const put=(x,z,w,d,role)=>add('box',[r.position[0]+cos*x+sin*z,2.095,r.position[2]-sin*x+cos*z],[w,.010,d],c,role,[0,r.yaw,0]);
  for(const x of[-r.width/2,r.width/2])put(x,0,.012,r.depth,'carrier-receiver-edge');
  // Corner brackets leave the existing central inspection tab visible.
  for(const z of[-r.depth/2,r.depth/2])for(const sign of[-1,1])put(sign*(r.width/2-.03),z,.06,.012,'carrier-receiver-edge');
 }
 return out;
}
const api=Object.freeze({parts});G.RealmEarthPatrolCarrierArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
