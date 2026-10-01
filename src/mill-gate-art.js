/* Original headrace joinery. A projection of the existing mill-gate step. */
(function(G){'use strict';
const ANCHOR=Object.freeze({x:5.2,z:-6}),detail={cameraSolid:false,cutaway:true,rough:.94},wood=0x786044,iron=0x505b51;
function frame(a,base){
 const {x,z}=ANCHOR;
 const add=(kind,dx,dy,dz,w,h,d,c,part,opt={})=>a.add(kind,x+dx,base+dy,z+dz,w,h,d,c,{...detail,millPart:part,...opt});
 // Mortised uprights, footings and a capped lintel enclose the old gate extent.
 for(const side of[-1,1]){
  add('box',0,.13,side*.65,.46,.26,.38,0x9a9b86,'footing');
  add('timber-panel',0,1.02,side*.60,1.88,.19,.22,wood,'upright',{r:[0,0,Math.PI/2]});
  add('box',.12,1.02,side*.50,.065,1.54,.065,iron,'guide');
  add('box',0,1.90,side*.60,.30,.10,.30,0xa58d66,'post-cap');
  for(const yy of[.33,1.61])add('box',.12,yy,side*.60,.035,.12,.25,iron,'post-band');
  add('round',.148,1.72,side*.60,.048,.048,.048,0xbdad80,'peg');
 }
 add('timber-panel',0,1.78,0,1.47,.19,.28,0x967950,'lintel',{r:[0,Math.PI/2,0]});
 add('box',0,.09,0,.42,.14,1.14,0x747f70,'sill');
 // A visible pinion/rack explains the lift; it is not new water simulation.
 add('box',0,1.78,0,.27,.30,.32,iron,'bearing');
 add('round',.19,1.79,0,.16,.28,.28,0xa28b5e,'pinion');
 add('box',.31,1.79,0,.19,.065,.065,iron,'axle');
 add('box',.40,1.93,0,.07,.34,.07,iron,'crank');
 add('round',.40,2.12,0,.11,.15,.11,0xc0a579,'crank-grip');
 // Timber knees on the two closed ends leave the bank approach clear.
 for(const side of[-1,1])a.beam([x,base+1.39,z+side*.60],[x,base+1.70,z+side*.31],.10,0xa08760,{millPart:'knee'});
}
function draw(out,repaired,base){
 const {x,z}=ANCHOR,y=base+(repaired?1.27:.53),push=(kind,p,s,c,part,opt={})=>out[kind].push({p,s,c,...detail,millPart:part,...opt});
 // Local X carries the existing timber grain and becomes the plank's vertical
 // axis. Positive determinant keeps normal/culling and all material passes.
 for(let i=0;i<5;i++){
  const zz=z+(i-2)*.205,ht=.84,w=.19,d=.12;
  push('timber-panel',[x,y,zz],[ht,w,d],repaired?0xa18a60:0x78684e,'leaf-plank',
   {m:new Float32Array([0,ht,0,0,0,0,w,0,d,0,0,0,x,y,zz,1])});
 }
 for(const dy of[-.26,.26]){
  push('box',[x+.082,y+dy,z],[.055,.10,1.10],iron,'leaf-strap');
  for(const dz of[-.42,.42])push('round',[x+.117,y+dy,z+dz],[.045,.045,.045],0xc1b086,'strap-rivet');
 }
 push('box',[x,y+1.05,z],[.085,1.30,.095],iron,'lift-rack');
 for(let i=0;i<10;i++)push('box',[x+.065,y+.48+i*.12,z],[.055,.035,.11],0xa4a38b,'rack-tooth');
 if(repaired){
  push('box',[x+.09,y,z],[.055,.72,.10],0xb99b66,'repair-brace');
  for(const dy of[-.32,.32])push('round',[x+.125,y+dy,z],[.05,.05,.05],0xd0bc86,'brace-peg');
 }else push('box',[x+.15,y-.03,z+.11],[.065,.57,.08],0x555949,'jammed-brace',{r:[.30,0,0]});
 return {repaired:!!repaired,center:[x,y,z],lift:repaired?.74:0,planks:5};
}
const api={ANCHOR,frame,draw};G.RealmMillGateArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
