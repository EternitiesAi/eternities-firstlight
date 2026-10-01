/* Fenna's original drover and load. Read-only projection, never an escort.
 * +Z faces forward; the coil and holding hand share the same local frame. */
(function(G){'use strict';
const WAIT=Object.freeze({x:8.8,z:5,yaw:-.6}),SENT=Object.freeze({x:2,z:-43,yaw:-.6});
const CART_WAIT=Object.freeze({x:9.3,z:7}),CART_SENT=Object.freeze({x:-3,z:-43});
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function arm(start,end,side){
 const upper=.315,lower=.285,delta=sub(end,start),distance=Math.hypot(...delta),dir=norm(delta);
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
 const hint=[side,-.3,-.3],plane=norm(sub(hint,mul(dir,dot(hint,dir))));
 return add(add(start,mul(dir,along)),mul(plane,bend));
}
function pose(time=0,reducedMotion=false,arrived=false){
 const {M}=G.RealmEngine,t=Number.isFinite(time)?time:0,sway=reducedMotion?0:Math.sin(t*.53);
 const coilRoot=M.compose(.02,arrived?.93:1.04+sway*.014,.32,1,1,1,0,sway*.06,arrived?-.14:sway*.04);
 const joints={leftShoulder:[-.25,1.35,-.015],rightShoulder:[.25,1.35,-.015],
  leftHand:[-.32,.89,.08],rightHand:M.transform(coilRoot,[.14,.06,0]),
  leftHip:[-.13,.87,0],rightHip:[.13,.87,0],leftKnee:[-.15,.48,.035],rightKnee:[.15,.48,.035],
  leftAnkle:[-.16,.13,.015],rightAnkle:[.16,.13,.015]};
 for(const [name,side]of[['left',-1],['right',1]])joints[name+'Elbow']=arm(joints[name+'Shoulder'],joints[name+'Hand'],side);
 return{coilRoot,joints,reducedMotion:!!reducedMotion};
}
function draw(out,{state={},time=0,reducedMotion=false,ground=()=>0}={}){
 const {M,hex}=G.RealmEngine,sent=!!state.dispatch,arrived=!!state.arrived,anchor=sent?SENT:WAIT,cart=sent?CART_SENT:CART_WAIT;
 const height=(x,z)=>{const v=ground(x,z);return Number.isFinite(v)?v:0;},base=height(anchor.x,anchor.z);
 const root=M.compose(anchor.x,base,anchor.z,1,1,1,0,anchor.yaw,0),posed=pose(time,reducedMotion,arrived),j=posed.joints;
 const coat=hex(0xa47954),edge=hex(0xc4a982),shirt=hex(0x647e79),skin=hex(0xc99e80),hair=hex(0x514839),boots=hex(0x4b493b);
 const wood=hex(0x806647),dark=hex(0x504739),canvas=hex(0xc6b99c),rope=hex(0xc6aa76),parts=[];let group='actor';
 const part=(kind,name,p,s,c,rotation=[0,0,0],frame=root)=>{
  const item={p:M.transform(frame,p),s:s.slice(),m:M.mul(frame,M.compose(...p,...s,...rotation)),c,rough:.9,
   cameraSolid:false,cutaway:false,droverPart:name,droverGroup:group};out[kind].push(item);parts.push(item);return item;
 };
 const segment=(name,a,b,width,depth,color,frame=root)=>{
  const delta=sub(b,a),length=Math.hypot(...delta),up=norm(delta),across=norm(cross(up,Math.abs(up[2])<.9?[0,0,1]:[1,0,0]));
  const forward=cross(across,up),center=mul(add(a,b),.5),local=new Float32Array([...mul(across,width),0,...mul(up,length),0,...mul(forward,depth),0,...center,1]);
  const item={p:M.transform(frame,center),s:[width,length,depth],m:M.mul(frame,local),c:color,rough:.9,
   cameraSolid:false,cutaway:false,droverPart:name,droverGroup:group,droverJoints:[M.transform(frame,a),M.transform(frame,b)]};out.box.push(item);parts.push(item);
 };
 part('box','shirt-waist',[0,1.04,0],[.36,.28,.255],shirt);
 part('box','shirt-chest',[0,1.28,-.015],[.45,.24,.27],shirt);
 part('box','coat-back',[0,1.14,-.169],[.49,.57,.065],coat);
 for(const side of[-1,1]){
  part('octa','coat-side',[side*.205,1.09,0],[.18,.66,.34],coat);
  part('box','coat-lapel',[side*.177,1.30,.145],[.09,.23,.046],edge,[0,0,side*-.08]);
  part('box','coat-hem',[side*.107,.825,-.035],[.207,.28,.29],coat,[0,0,side*-.035]);
 }
 part('box','belt',[0,.99,0],[.40,.053,.29],dark);
 part('box','belt-buckle',[.12,.99,.159],[.06,.05,.025],0xbca980);
 segment('satchel-strap',[-.17,1.42,.169],[.27,.87,.17],.043,.027,dark);
 part('box','satchel',[.29,.89,.03],[.22,.26,.15],0x9b8962,[0,0,.05]);
 part('box','satchel-flap',[.29,.97,.11],[.23,.11,.027],edge);
 part('round','neck',[0,1.46,-.008],[.115,.14,.12],skin);
 part('round','head',[0,1.60,0],[.25,.28,.24],skin);
 part('box','hair-back',[0,1.63,-.11],[.23,.19,.055],hair);
 part('round','tied-hair',[0,1.60,-.161],[.15,.15,.13],hair);
 part('octa','nose',[0,1.605,.143],[.05,.065,.065],skin);
 part('round','headscarf-crown',[0,1.738,-.025],[.29,.13,.26],coat);
 part('box','headscarf-band',[0,1.686,.002],[.274,.06,.235],edge);
 part('box','scarf-collar',[0,1.45,.045],[.32,.075,.21],edge);
 part('box','scarf-tail',[-.09,1.34,.19],[.10,.25,.035],edge,[0,0,-.09]);
 for(const [name,side]of[['left',-1],['right',1]]){
  part('round',name+'-ear',[side*.124,1.60,0],[.045,.068,.05],skin);
  part('box',name+'-eye',[side*.048,1.627,.119],[.023,.014,.016],dark);
  part('box',name+'-brow',[side*.048,1.65,.12],[.043,.012,.013],hair);
  segment(name+'-thigh',j[name+'Hip'],j[name+'Knee'],.175,.19,0x596057);
  segment(name+'-shin',j[name+'Knee'],j[name+'Ankle'],.14,.15,0x596057);
  part('round',name+'-knee',j[name+'Knee'],[.16,.14,.16],0x596057);
  part('box',name+'-boot',[side*.16,.088,.07],[.19,.14,.30],boots);
  part('box',name+'-sole',[side*.16,.020,.07],[.202,.04,.312],dark);
  part('round',name+'-boot-cuff',[side*.16,.21,.015],[.17,.22,.18],boots);
  part('box',name+'-shoulder',j[name+'Shoulder'],[.18,.17,.27],coat);
  segment(name+'-sleeve',j[name+'Shoulder'],j[name+'Elbow'],.147,.155,coat);
  part('round',name+'-cuff',j[name+'Elbow'],[.16,.10,.16],edge);
  segment(name+'-forearm',j[name+'Elbow'],j[name+'Hand'],.10,.11,coat);
  part('round',name+'-hand',j[name+'Hand'],[.107,.10,.096],skin);
 }
 const coilRoot=M.mul(root,posed.coilRoot);
 for(let i=0;i<12;i++){
  const angle=i*Math.PI/6,next=(i+1)*Math.PI/6;
  segment('rope-coil',[Math.cos(angle)*.145,Math.sin(angle)*.18,0],[Math.cos(next)*.145,Math.sin(next)*.18,0],.032,.049,rope,coilRoot);
 }
 part('box','rope-wrap',[0,.135,.014],[.07,.09,.075],dark,[0,0,0],coilRoot);
 segment('rope-tail',[-.06,-.16,0],[-.11,-.30,.005],.025,.025,rope,coilRoot);
 segment('rope-end',[-.11,-.30,.005],[-.06,-.34,.008],.025,.025,rope,coilRoot);
 const actorCount=parts.length;group='cart';const b=height(cart.x,cart.z),cartRoot=M.compose(cart.x,b,cart.z,1,1,1);
 const cp=(kind,name,p,s,c,r)=>part(kind,name,p,s,c,r||[0,0,0],cartRoot),wheelContacts=[];
 for(const wz of[-.78,.78]){
  const ends=[];
  for(const wx of[-.98,.98]){
   const groundY=height(cart.x+wx,cart.z+wz),cy=groundY-b+.36;ends.push([wx,cy,wz]);
   cp('round','wheel-rim',[wx,cy,wz],[.16,.72,.72],dark);
   cp('round','wheel-wood',[wx+(wx<0?-.013:.013),cy,wz],[.171,.57,.57],wood);
   cp('round','wheel-hub',[wx+(wx<0?-.04:.04),cy,wz],[.22,.145,.145],0xaba383);
   for(let i=0;i<6;i++){
    const angle=i*Math.PI/3,side=wx<0?-.092:.092;
    segment('wheel-spoke',[wx+side,cy,wz],[wx+side,cy+Math.sin(angle)*.28,wz+Math.cos(angle)*.28],.034,.032,dark,cartRoot);
   }
   wheelContacts.push({x:cart.x+wx,z:cart.z+wz,ground:groundY,center:groundY+.36,radius:.36});
  }
  segment('cart-axle',ends[0],ends[1],.095,.095,dark,cartRoot);
 }
 for(let i=0;i<5;i++)cp('box','bed-plank',[-.67+i*.335,.63,0],[.326,.16,2.45],i%2?0x987955:wood);
 for(const dx of[-.63,.63]){
  cp('box','bed-beam',[dx,.51,0],[.13,.16,2.53],dark);
  cp('box','side-rail',[dx*1.27,1.04,0],[.11,.17,2.45],wood);
  for(const dz of[-1.08,1.08])cp('box','rail-post',[dx*1.27,.87,dz],[.12,.62,.12],wood);
  cp('box','short-shaft',[dx,.72,-1.43],[.095,.09,.44],dark,[.04,0,0]);
 }
 const sackCount=arrived?2:4;
 for(let i=0;i<sackCount;i++){
  const p=[i%2?-.37:.37,1.025,Math.floor(i/2)*.67-.26];
  cp('round','flour-sack',p,[.64,.63,.57],canvas);
  cp('box','sack-seam',[p[0],1.25,p[2]+.12],[.43,.025,.04],rope);
 }
 cp('box','apple-crate-bed',[0,1.005,-.93],[1.33,.11,.42],wood);
 for(const dx of[-.64,.64])cp('box','apple-crate-end',[dx,1.17,-.93],[.065,.24,.42],0x9e805a);
 for(const dz of[-1.12,-.73])cp('box','apple-crate-side',[0,1.14,dz],[1.33,.16,.045],0x9e805a);
 if(!arrived){
  for(let i=0;i<5;i++)cp('round','apple',[ -.47+i*.235,1.19,-.93],[.20,.20,.20],0xb86847);
  for(const dx of[-.37,.37])cp('box','load-strap',[dx,1.355,.1],[.035,.035,1.67],dark);
 }else{
  cp('box','folded-cover',[0,.89,.57],[1.26,.28,.55],shirt);
  cp('box','cover-fold',[0,1.036,.57],[1.23,.021,.35],edge);
 }
 return{anchor:{...anchor,base},cart:{...cart,base:b},root,coilRoot,joints:j,actorCount,partCount:parts.length,
  reducedMotion:posed.reducedMotion,phase:arrived?'arrived':sent?'dispatched':state.accepted?'accepted':'waiting',sackCount,appleCount:arrived?0:5,wheelContacts};
}
const api={WAIT,SENT,CART_WAIT,CART_SENT,pose,draw};G.RealmDroverArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
