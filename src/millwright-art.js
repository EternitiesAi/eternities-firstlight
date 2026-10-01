/* Ansel's original prototype silhouette. Presentation only; +Z faces forward.
 * A carpenter's square and both hands share one frame, never player equipment. */
(function(G){'use strict';
const ANCHOR=Object.freeze({x:8.7,z:-6.6,yaw:-1});
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]);
const mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function arm(start,end,side){
 const upper=.315,lower=.285,delta=sub(end,start),distance=Math.hypot(...delta),dir=norm(delta);
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
 const hint=[side,-.3,-.3],plane=norm(sub(hint,mul(dir,dot(hint,dir))));
 return add(add(start,mul(dir,along)),mul(plane,bend));
}
function pose(time=0,reducedMotion=false){
 const {M}=G.RealmEngine,t=Number.isFinite(time)?time:0;
 const sway=reducedMotion?0:Math.sin(t*.65),tilt=reducedMotion?0:Math.sin(t*.48);
 const toolRoot=M.compose(.01,1.07+sway*.018,.35,1,1,1,0,tilt*.065,sway*.055);
 const joints={leftShoulder:[-.25,1.37,-.015],rightShoulder:[.25,1.37,-.015],
  leftHip:[-.13,.88,0],rightHip:[.13,.88,0],leftKnee:[-.15,.49,.035],rightKnee:[.15,.49,.035],
  leftAnkle:[-.16,.13,.015],rightAnkle:[.16,.13,.015]};
 for(const [name,side]of[['left',-1],['right',1]]){
  joints[name+'Hand']=M.transform(toolRoot,[side*.23,0,0]);
  joints[name+'Elbow']=arm(joints[name+'Shoulder'],joints[name+'Hand'],side);
 }
 return {toolRoot,joints,reducedMotion:!!reducedMotion};
}
function draw(out,{base=0,time=0,reducedMotion=false}={}){
 const {M,hex}=G.RealmEngine,{x,z,yaw}=ANCHOR,posed=pose(time,reducedMotion),j=posed.joints;
 const root=M.compose(x,Number.isFinite(base)?base:0,z,1,1,1,0,yaw,0);
 const shirt=hex(0x819b98),edge=hex(0xb8c8b6),skin=hex(0xc7a185),hair=hex(0x72513c);
 const apron=hex(0x806048),dark=hex(0x5d4939),trousers=hex(0x485247),boot=hex(0x494438);
 const parts=[];
 const part=(kind,name,p,s,c,rotation=[0,0,0],frame=root,extra={})=>{
  const item={p:M.transform(frame,p),s:s.slice(),m:M.mul(frame,M.compose(...p,...s,...rotation)),c,
   rough:.87,cameraSolid:false,cutaway:false,millwrightPart:name,...extra};out[kind].push(item);parts.push(item);
 };
 const segment=(name,a,b,width,depth,color)=>{
  const delta=sub(b,a),length=Math.hypot(...delta),up=norm(delta),across=norm(cross(up,Math.abs(up[2])<.9?[0,0,1]:[1,0,0]));
  const forward=cross(across,up),center=mul(add(a,b),.5);
  const local=new Float32Array([...mul(across,width),0,...mul(up,length),0,...mul(forward,depth),0,...center,1]);
  const item={p:M.transform(root,center),s:[width,length,depth],m:M.mul(root,local),c:color,rough:.9,
   cameraSolid:false,cutaway:false,millwrightPart:name,millwrightJoints:[a.slice(),b.slice()]};out.box.push(item);parts.push(item);
 };
 part('box','shirt-waist',[0,1.055,0],[.36,.29,.255],shirt);
 part('box','shirt-chest',[0,1.29,-.015],[.45,.24,.27],shirt);
 part('octa','shirt-left-side',[-.16,1.16,0],[.17,.34,.25],shirt);
 part('octa','shirt-right-side',[.16,1.16,0],[.17,.34,.25],shirt);
 part('box','apron-bib',[0,1.23,.147],[.30,.30,.025],apron);
 part('box','apron-waist',[0,1.005,.151],[.39,.15,.032],apron);
 part('box','apron-left-hem',[-.099,.805,.14],[.189,.29,.035],apron,[0,0,-.04]);
 part('box','apron-right-hem',[.099,.805,.14],[.189,.29,.035],apron,[0,0,.04]);
 for(const side of[-1,1]){
  part('box','apron-strap',[side*.12,1.399,.065],[.045,.075,.23],dark,[.08,0,0]);
  part('box','apron-stitch',[side*.142,1.235,.164],[.014,.27,.011],edge);
 }
 part('box','apron-pocket',[.015,.935,.179],[.225,.12,.024],dark);
 part('box','belt',[0,.98,0],[.395,.052,.29],dark);
 part('box','buckle',[.15,.98,.159],[.065,.053,.025],0xbdac83);
 part('round','neck',[0,1.48,-.008],[.115,.16,.12],skin);
 part('round','head',[0,1.62,0],[.25,.28,.24],skin);
 part('box','hair-back',[0,1.63,-.105],[.225,.17,.055],hair);
 part('round','beard',[0,1.535,.115],[.19,.115,.06],hair);
 part('octa','nose',[0,1.625,.143],[.055,.067,.075],skin);
 part('round','cap-crown',[0,1.752,-.025],[.305,.12,.28],dark);
 part('box','cap-band',[0,1.713,0],[.274,.040,.24],apron);
 part('box','cap-brim',[0,1.715,.145],[.305,.026,.13],dark,[.065,0,0]);
 for(const [name,side]of[['left',-1],['right',1]]){
  part('round',name+'-ear',[side*.124,1.62,0],[.045,.072,.05],skin);
  part('box',name+'-eye',[side*.049,1.649,.118],[.023,.014,.015],0x303b37);
  part('box',name+'-brow',[side*.050,1.673,.119],[.044,.012,.012],hair);
  segment(name+'-thigh',j[name+'Hip'],j[name+'Knee'],.18,.19,trousers);
  segment(name+'-shin',j[name+'Knee'],j[name+'Ankle'],.135,.15,trousers);
  part('round',name+'-knee',j[name+'Knee'],[.155,.14,.16],trousers);
  part('box',name+'-boot',[side*.16,.088,.07],[.185,.14,.30],boot);
  part('box',name+'-sole',[side*.16,.020,.07],[.197,.04,.312],0x35372f);
  part('round',name+'-boot-cuff',[side*.16,.19,.015],[.16,.18,.18],boot);
  part('box',name+'-shoulder',j[name+'Shoulder'],[.17,.17,.265],shirt,[0,0,side*.09]);
  segment(name+'-sleeve',j[name+'Shoulder'],j[name+'Elbow'],.143,.15,shirt);
  part('round',name+'-rolled-cuff',j[name+'Elbow'],[.162,.125,.161],edge);
  segment(name+'-bare-forearm',j[name+'Elbow'],j[name+'Hand'],.095,.102,skin);
  part('round',name+'-hand',j[name+'Hand'],[.105,.10,.094],skin);
 }
 const tool=M.mul(root,posed.toolRoot);
 part('box','square-stock',[-.23,-.125,0],[.078,.29,.065],dark,[0,0,0],tool);
 part('box','square-blade',[.025,0,0],[.575,.038,.025],0xabb5ad,[0,0,0],tool,{rough:.45});
 return {anchor:{x,z,yaw,base:Number.isFinite(base)?base:0},root,joints:j,toolRoot:tool,reducedMotion:posed.reducedMotion,partCount:parts.length};
}
const api={ANCHOR,pose,draw};G.RealmMillwrightArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
