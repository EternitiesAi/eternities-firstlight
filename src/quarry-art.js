/* Darric and designated public stone. Read-only prototype art; +Z forward.
 * A resting mallet is not a simulated quarry job or permission to take stock. */
(function(G){'use strict';
const ANCHOR=Object.freeze({x:14.3,z:-26,yaw:-.8});
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=a=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function phase(state){return state.steps?.includes('quarry-grade')?'packed':state.steps?.includes('quarry-reserve')?'released':state.accepted?'reserved':'waiting';}
function elbow(start,end,side){
 const upper=.34,lower=.32,delta=sub(end,start),distance=Math.hypot(...delta),dir=norm(delta);
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
 const hint=[side,-.3,-.3],plane=norm(sub(hint,mul(dir,dot(hint,dir))));
 return add(add(start,mul(dir,along)),mul(plane,bend));
}
function pose(time=0,reducedMotion=false,state={}){
 const {M}=G.RealmEngine,t=Number.isFinite(time)?time:0,stage=phase(state);
 const sway=reducedMotion?0:Math.sin(t*.43),lift=stage==='reserved'?.045:stage==='packed'?-.055:0;
 const toolRoot=M.compose(-.015,1.09+lift+sway*.012,.46,1,1,1,0,sway*.04,-.12+sway*.035);
 const joints={leftShoulder:[-.28,1.39,-.015],rightShoulder:[.28,1.39,-.015],
  leftHip:[-.15,.89,0],rightHip:[.15,.89,0],leftKnee:[-.18,.50,.025],rightKnee:[.18,.50,.025],
  leftAnkle:[-.19,.13,.015],rightAnkle:[.19,.13,.015]};
 for(const [name,side,grip]of[['left',-1,-.20],['right',1,.055]]){
  joints[name+'Hand']=M.transform(toolRoot,[grip,0,0]);joints[name+'Elbow']=elbow(joints[name+'Shoulder'],joints[name+'Hand'],side);
 }
 return{toolRoot,joints,phase:stage,reducedMotion:!!reducedMotion};
}
function draw(out,{state={},time=0,reducedMotion=false,ground=()=>0}={}){
 const {M,hex}=G.RealmEngine,{x,z,yaw}=ANCHOR,raw=ground(x,z),base=Number.isFinite(raw)?raw:0;
 const root=M.compose(x,base,z,1,1,1,0,yaw,0),posed=pose(time,reducedMotion,state),j=posed.joints,parts=[];
 const shirt=hex(0xc1b797),vest=hex(0x737e79),leather=hex(0x786047),dark=hex(0x474b42);
 const skin=hex(0xba9377),hair=hex(0x554a3d),cloth=hex(0xa2674b),pants=hex(0x616457);
 const part=(kind,name,p,s,c,rotation=[0,0,0],frame=root)=>{
  const item={p:M.transform(frame,p),s:s.slice(),m:M.mul(frame,M.compose(...p,...s,...rotation)),c,rough:.91,
   cameraSolid:false,cutaway:false,stoneworkerPart:name};out[kind].push(item);parts.push(item);
 };
 const segment=(name,a,b,width,depth,color)=>{
  const up=norm(sub(b,a)),length=Math.hypot(...sub(b,a)),across=norm(cross(up,Math.abs(up[2])<.9?[0,0,1]:[1,0,0]));
  const forward=cross(across,up),center=mul(add(a,b),.5),local=new Float32Array([...mul(across,width),0,...mul(up,length),0,...mul(forward,depth),0,...center,1]);
  const item={p:M.transform(root,center),s:[width,length,depth],m:M.mul(root,local),c:color,rough:.91,
   cameraSolid:false,cutaway:false,stoneworkerPart:name,stoneworkerJoints:[a.slice(),b.slice()]};out.box.push(item);parts.push(item);
 };
 part('box','shirt-waist',[0,1.075,0],[.41,.30,.285],shirt);
 part('box','shirt-chest',[0,1.31,-.015],[.51,.25,.30],shirt);
 part('box','vest-back',[0,1.255,-.176],[.52,.42,.035],vest);
 for(const side of[-1,1]){
  part('box','vest-front',[side*.15,1.25,.156],[.205,.40,.038],vest,[0,0,side*.045]);
  part('box','vest-pocket',[side*.15,1.105,.186],[.135,.10,.028],leather);
  part('box','leather-hem',[side*.11,.85,.156],[.212,.27,.035],leather,[0,0,side*-.035]);
 }
 part('box','belt',[0,.985,0],[.46,.062,.32],dark);
 part('box','buckle',[.09,.985,.177],[.075,.061,.028],0xb3ab8d);
 part('round','neck',[0,1.49,-.008],[.14,.16,.14],skin);
 part('round','head',[0,1.63,0],[.285,.29,.26],skin);
 part('round','cropped-hair',[0,1.743,-.025],[.30,.11,.27],hair);
 part('box','hair-back',[0,1.64,-.119],[.263,.16,.035],hair);
 part('round','short-beard',[0,1.552,.123],[.23,.11,.056],hair);
 part('octa','nose',[0,1.633,.153],[.057,.068,.075],skin);
 part('box','neck-cloth',[0,1.474,.025],[.32,.068,.22],cloth);
 part('box','cloth-knot',[-.12,1.46,.146],[.09,.095,.07],cloth,[0,0,.2]);
 part('box','cloth-tail',[-.095,1.366,.16],[.09,.16,.031],cloth,[0,0,-.13]);
 for(const [name,side]of[['left',-1],['right',1]]){
  part('round',name+'-ear',[side*.142,1.63,0],[.045,.077,.053],skin);
  part('box',name+'-eye',[side*.055,1.653,.126],[.024,.014,.016],dark);
  part('box',name+'-brow',[side*.054,1.676,.127],[.048,.014,.013],hair,[0,0,side*.07]);
  segment(name+'-thigh',j[name+'Hip'],j[name+'Knee'],.21,.21,pants);
  segment(name+'-shin',j[name+'Knee'],j[name+'Ankle'],.155,.17,pants);
  part('round',name+'-knee',j[name+'Knee'],[.183,.15,.18],pants);
  part('box',name+'-knee-patch',[side*.18,.51,.12],[.13,.14,.025],leather);
  part('box',name+'-boot',[side*.19,.088,.08],[.218,.14,.32],leather);
  part('box',name+'-sole',[side*.19,.020,.08],[.23,.04,.33],dark);
  part('round',name+'-boot-cuff',[side*.19,.21,.015],[.18,.21,.19],leather);
  part('box',name+'-shoulder',j[name+'Shoulder'],[.18,.18,.30],shirt);
  segment(name+'-sleeve',j[name+'Shoulder'],j[name+'Elbow'],.161,.17,shirt);
  part('round',name+'-rolled-cuff',j[name+'Elbow'],[.179,.11,.18],shirt);
  segment(name+'-forearm',j[name+'Elbow'],j[name+'Hand'],.11,.116,skin);
  part('round',name+'-glove',j[name+'Hand'],[.12,.11,.11],leather);
 }
 const toolRoot=M.mul(root,posed.toolRoot);
 part('box','mallet-handle',[.045,0,0],[.86,.065,.065],0x9b8058,[0,0,0],toolRoot);
 part('box','mallet-head',[.415,0,0],[.14,.225,.195],0x657268,[0,0,0],toolRoot);
 return{anchor:{x,z,yaw,base},root,joints:j,toolRoot,phase:posed.phase,reducedMotion:posed.reducedMotion,partCount:parts.length};
}
function works(out,{state={},ground=()=>0}={}){
 const blockIds=[],gradeIds=[],height=(x,z)=>{const n=ground(x,z);return Number.isFinite(n)?n:0;};
 const box=(name,id,x,y,z,w,ht,d,c)=>out.box.push({p:[x,y,z],s:[w,ht,d],c,rough:1,cameraSolid:false,cutaway:false,quarryPart:name,quarryId:id});
 if(!state.steps?.includes('quarry-reserve'))for(let i=0;i<3;i++){
  const id='public-repair-block-'+(i+1),x=10.8+i*.62,z=-27,b=height(x,z);blockIds.push(id);
  box('reserved-block',id,x,b+.20,z,.55,.40,.60,0xaba185);
  box('split-face',id,x,b+.404,z,.49,.012,.54,0xc8bea0);
  for(let k=0;k<=i;k++)box('chalk-tally',id,x-.10+k*.10,b+.414,z,.033,.012,.18,0xf0d99c);
  for(const dx of[-.15,.15])box('split-score',id,x+dx,b+.21,z+.302,.018,.22,.014,0x818570);
 }
 if(state.steps?.includes('quarry-grade'))for(let i=0;i<12;i++){
  const id='packed-grade-'+(i+1),x=13.1+(i%3)*.63,z=-14.4+Math.floor(i/3)*.65;gradeIds.push(id);
  // Above the existing .025-high visual paving, embedded in the same ground.
  box('packed-grade',id,x,height(x,z)-.005,z,.60,.08,.58,i%3?0xc2b89a:0xa4a88e);
 }
 return{blockIds,gradeIds,phase:phase(state)};
}
const api={ANCHOR,phase,pose,draw,works};G.RealmQuarryArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
