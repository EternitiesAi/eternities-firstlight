/* Original traveller equipment silhouettes, attached to the articulated rig.
 * This is a read-only projection of the equipped catalogue item. Quiver arrows,
 * sheath and the retained cave lantern are decoration, never inventory grants. */
(function(G){'use strict';
const add=(a,b)=>a.map((n,i)=>n+b[i]),sub=(a,b)=>a.map((n,i)=>n-b[i]),scale=(a,n)=>a.map(v=>v*n);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>scale(a,1/(Math.hypot(...a)||1)),offset=(p,axis,n)=>add(p,scale(axis,n));
const point=p=>p?.length===3&&Array.from(p).every(Number.isFinite);
// These bounded art dimensions describe authored silhouettes, not attack/reach.
const BLADES=Object.freeze({
 trail_blade:{length:.64,width:.082,guard:.25,grip:0x695343,metal:0xadb39d,sheath:0x4e594c,edge:0xe5dfcc},
 copper_blade:{length:.69,width:.112,guard:.32,grip:0x715242,metal:0xbb8c61,sheath:0x63513d,edge:0xf0d0a3,sweep:-.045},
 oren_sunblade:{length:.71,width:.089,guard:.29,grip:0x477e6c,metal:0x528a78,sheath:0x426452,edge:0xd6e5cd,sweep:.035},
 dawn_edge:{length:.76,width:.081,guard:.38,grip:0x5c5350,metal:0xd9b272,sheath:0x534f45,edge:0xffe5b3,sweep:.07}
});
const BOWS=Object.freeze({
 trail_bow:{half:.57,curve:.16,width:.066,grip:0x735b43,tip:0xa2926d},
 copper_bow:{half:.65,curve:.20,width:.088,grip:0x735443,tip:0xe5c68e},
 oren_reedbow:{half:.61,curve:.14,width:.072,grip:0x467762,tip:0xc9d5ad}
});

function draw(out,sim,frame){
 const none={weaponId:null,style:null,mode:'none',gripLocal:null,gripWorld:null,gem:null,temper:0,stage:0,instances:0};
 const A=G.RealmAdventure,AR=G.RealmArsenal,M=G.RealmEngine?.M,a=sim?.state?.adventure,id=a?.equipment?.weapon;
 if(!a?.started||!A||!AR||!M||typeof id!=='string'||!Object.hasOwn(A.GEAR,id)||A.GEAR[id].slot!=='weapon'||!a.owned.includes(id))return none;
 if(!frame?.root||frame.root.length!==16||!Array.from(frame.root).every(Number.isFinite))return none;
 const joints=frame.joints||{},style=AR.weapon(a).style,ready=!!frame.combatScene,carryMode=ready?'ready':'stowed';
 const hip=point(joints.hip)?joints.hip:point(joints.spine)?add(joints.spine,[0,-.15,0]):[0,.90,0];
 const back=point(joints.back)?joints.back:point(joints.spine)?add(joints.spine,[0,.25,-.20]):[0,1.25,-.17];
 const stowGrip=style==='bow'?add(back,[-.06,-.26,-.19]):add(hip,[-.31,.09,.01]);
 const grip=ready?joints[style==='bow'?'leftHand':'rightHand']:stowGrip;
 if(!point(grip)||ready&&style==='bow'&&!point(joints.rightHand))return none;
 const gear=A.GEAR[id],colour=typeof gear.color==='string'?parseInt(gear.color.slice(1),16):gear.color;
 const gem=AR.activeGem(a),gemId=gem?a.arsenal.sockets[id]:null,stage=Math.max(0,Math.min(2,G.RealmPursuit?.stage(a,id)||0)),temper=G.RealmStarter?.bonus(a,id)||0,realmFitting=G.RealmCraft?.bonus(a,id)||0;
 const summary={weaponId:id,style,mode:ready?'held':'stowed',gripLocal:Array.from(grip),gripWorld:M.transform(frame.root,grip),gem:gemId,temper,stage,realmFitting,instances:0};
 const attachment=ready?(style==='bow'?'leftHand':'rightHand'):(style==='bow'?'back':'hip');

 // A complete orthonormal basis handles beams with arbitrary X/Y/Z endpoints.
 // Local +Y spans the exact segment; multiplying by the rig root preserves both
 // attachment points across facing changes and height-aware terrain.
 function form(kind,center,axis,width,length,depth,c,weaponPart,extra={}){
  const y=unit(axis),reference=Math.abs(y[2])<.85?[0,0,1]:[1,0,0],x=unit(cross(y,reference)),z=cross(x,y);
  const local=new Float32Array([x[0]*width,x[1]*width,x[2]*width,0,y[0]*length,y[1]*length,y[2]*length,0,z[0]*depth,z[1]*depth,z[2]*depth,0,...center,1]);
  out[kind].push({p:M.transform(frame.root,center),s:[width,length,depth],m:M.mul(frame.root,local),c,rough:.76,travelerPart:'equipment',weaponPart,weaponId:id,carryMode,attachment,...extra});summary.instances++;
 }
 function beam(start,end,width,depth,c,weaponPart,extra={},kind='box'){
  const direction=sub(end,start),length=Math.hypot(...direction);if(length<1e-7)return;
  form(kind,scale(add(start,end),.5),direction,width,length,depth,c,weaponPart,extra);
 }
 function block(center,size,c,weaponPart,extra={},axis=[0,1,0],kind='box'){form(kind,center,axis,...size,c,weaponPart,extra);}
 function markers(axis,front,width){
  const mount=add(offset(grip,axis,-.17),scale(front,.067));
  block(mount,[.13,.11,.044],0xb0a07a,'socket-mount',{},axis);
  if(gem)block(add(mount,scale(front,.025)),[.096,.12,.061],gem.color,'socket',{gemId,em:.35},axis,'octa');
  for(let i=0;i<stage;i++)block(offset(grip,axis,.24+i*.10),[width,.061,.13],i?0xece0b6:0xd39366,'fitting',{fittingStage:i+1},axis);
  if(realmFitting)block(offset(grip,axis,.36),[width+.04,.08,.14],0xa997cc,'realm-fitting',{realmFitting},axis);
  if(temper)block(offset(grip,axis,.16),[width+.025,.07,.12],0x82beb0,'temper',{temper},axis);
 }
 function sheath(anchor,spec){
  const axis=unit([-.08,-.93,-.35]),start=offset(anchor,axis,.20),end=offset(anchor,axis,spec.length+.26);
  beam(start,end,spec.width*1.65,.102,spec.sheath,'scabbard',{attachment:'hip'});
  // An exposed catalogue-colour inlay makes the carried weapon identifiable.
  beam(add(start,[0,0,.061]),add(end,[0,0,.061]),.033,.022,colour,'scabbard-inlay',{attachment:'hip'});
  block(start,[spec.width*1.9,.084,.13],spec.metal,'scabbard-throat',{attachment:'hip'},axis);
  beam(add(hip,[-.18,0,0]),add(anchor,[0,-.03,-.01]),.049,.056,0x6e5a42,'sheath-hanger',{attachment:'hip'});
 }
 function blade(){
  const spec=Object.hasOwn(BLADES,id)?BLADES[id]:BLADES.trail_blade,phase=frame.combatPhase,progress=Number.isFinite(frame.combatProgress)?Math.max(0,Math.min(1,frame.combatProgress)):0;
  let axis=unit([-.10,.92,.37]);
  if(!ready)axis=unit([-.08,-.93,-.35]);
  else if(frame.guarded)axis=unit([-.63,.72,.19]);
  else if(!frame.reducedMotion&&phase==='anticipate')axis=unit([-.25,.84-.50*progress,-.12-.65*progress]);
  else if(!frame.reducedMotion&&phase==='recover')axis=unit([-.30+.20*progress,.25+.67*progress,.94-.57*progress]);
  const lateral=unit(cross(axis,[0,0,1])),front=unit(cross(lateral,axis));
  beam(offset(grip,axis,-.12),offset(grip,axis,.12),.095,.088,spec.grip,'grip',{},'round');
  block(offset(grip,axis,-.155),[.13,.10,.11],spec.metal,'pommel',{},axis,'round');
  const guard=offset(grip,axis,.17);
  if(spec.sweep)for(const sign of [-1,1])beam(guard,add(offset(guard,lateral,sign*spec.guard*.5),scale(axis,spec.sweep)),.063,.094,spec.metal,'guard');
  else beam(offset(guard,lateral,-spec.guard*.5),offset(guard,lateral,spec.guard*.5),.065,.094,spec.metal,'guard');
  if(ready){
   const start=offset(grip,axis,.215),end=offset(start,axis,spec.length);
   beam(start,end,spec.width,.035,colour,'blade');
   for(const side of [-1,1])beam(offset(start,lateral,side*spec.width*.46),offset(end,lateral,side*spec.width*.36),.020,.039,spec.edge,'blade-edge');
   block(offset(end,axis,.055),[spec.width,.115,.039],colour,'blade-tip',{},axis,'octa');
   sheath(stowGrip,spec);
  }else sheath(grip,spec);
  markers(axis,front,.17);
  // The original cave hand-light stays on the available left palm. Its fixed
  // glow represents the existing lantern presentation, never a hit result.
  if(ready&&sim.room==='mine'&&point(joints.leftHand)){
   const hand=joints.leftHand,body=add(hand,[0,-.20,0]);
   beam(hand,add(body,[0,.08,0]),.025,.025,0x8b7b5e,'lantern-handle',{attachment:'leftHand'});
   block(body,[.17,.20,.15],0xf7d49e,'lantern',{attachment:'leftHand',em:1.1},[0,1,0],'octa');
   for(const y of [-.11,.10])block(add(body,[0,y,0]),[.20,.045,.18],0x756951,'lantern-cap',{attachment:'leftHand'});
  }
 }
 function quiver(){
  const center=add(back,[.25,-.16,-.17]),axis=unit([.20,.97,.03]),top=offset(center,axis,.31);
  beam(offset(center,axis,-.32),top,.20,.15,0x675b45,'quiver',{attachment:'back'},'round');
  block(top,[.24,.078,.18],0x9a8157,'quiver-rim',{attachment:'back'},axis,'round');
  for(let i=0;i<3;i++){
   const foot=add(top,[(i-1)*.048,-.10,(i%2)*.038]),tip=offset(foot,axis,.27+i*.025);
   beam(foot,tip,.018,.018,0xcebd8f,'quiver-shaft',{attachment:'back',decorative:true});
   block(offset(tip,axis,-.027),[.052,.12,.051],i===1?0x83a28d:0xddd1ac,'quiver-feather',{attachment:'back',decorative:true},axis,'octa');
  }
  beam(add(back,[-.15,.02,.06]),add(center,[.04,-.27,.04]),.056,.027,0x726148,'quiver-strap',{attachment:'back'});
 }
 function bow(){
  const spec=Object.hasOwn(BOWS,id)?BOWS[id]:BOWS.trail_bow,up=ready?[0,1,0]:unit([.29,.95,.025]);
  const pull=ready?sub(joints.rightHand,grip):[0,0,-1],backward=ready?unit([pull[0],0,pull[2]]):[0,0,-1];
  const bend=dot(backward,backward)>.5?backward:[0,0,-1],front=scale(bend,-1),tips=[];
  beam(offset(grip,up,-.10),offset(grip,up,.10),.103,.104,spec.grip,'grip',{},'round');
  for(const sign of [-1,1]){
   const nodes=[[.10,0],[.27,.22],[.55,.67],[.82,1],[1,.81]].map(([height,curve])=>add(offset(grip,up,sign*height*spec.half),scale(bend,curve*spec.curve)));
   for(let i=1;i<nodes.length;i++)beam(nodes[i-1],nodes[i],spec.width,.060,colour,'bow-limb',{limbSide:sign,limbSegment:i-1},'round');
   block(nodes[4],[spec.width+.025,.09,.076],spec.tip,'bow-tip',{},up,'round');tips.push(nodes[4]);
  }
  const stringGrip=ready?joints.rightHand:add(grip,scale(bend,spec.curve*.81));
  for(let i=0;i<tips.length;i++)beam(tips[i],stringGrip,.017,.017,0xe4d3ae,'bow-string',{stringSide:i,drawAttachment:ready?'rightHand':null});
  markers(up,front,.15);
  quiver();
 }
 if(style==='bow')bow();else blade();return summary;
}
const api={draw};G.RealmTravelerEquipmentArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
