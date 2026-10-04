/* Original job fixtures and one bounded working actor. No progression authority. */
(function(G){'use strict';
function draw(out,sim){const B=G.RealmBridgeCommunity,r=sim.state.bridgeCommunity;if(sim.room!==B.definition.room||!r.accepted)return;
 const emit=(kind,p,s,c,part,extra={})=>out[kind].push({p,s,c,rough:.79,cameraSolid:false,cutaway:false,appearanceOnly:true,communityPart:part,communityChoice:r.choice,...extra});
 const box=(x,y,z,w,h,d,c,part,extra)=>emit('box',[x,y,z],[w,h,d],c,part,extra);
 const base=1.57,M=G.RealmEngine.M;
 if(r.steps.includes('fittings')&&!r.steps.includes('fit')){
  const p=sim.state.player,y=G.RealmWorldFoundations.playerHeight(sim),yaw=p.yaw,c=Math.cos(yaw),s=Math.sin(yaw),anchor=[p.x-s*.27,y+1.04,p.z-c*.27];
  for(const dx of[-.13,.13])box(anchor[0]+dx*c,anchor[1],anchor[2]-dx*s,.09,.4,.065,0xa48b63,'carried-brace',{r:[.15,yaw,0]});box(anchor[0],anchor[1]-.04,anchor[2],.36,.035,.12,0x799487,'carried-tie',{r:[0,yaw,0]});
 }
 if(!r.steps.includes('fit'))return;
 if(r.choice==='shelter'){
  for(const dx of[-1.65,1.65])for(const dz of[-.65,.65]){
   box(-9+dx,base+1.0625,-65+dz,.095,2.125,.095,0x8d795b,'shelter-post',{cameraSolid:true,cutaway:true});
   const a=[-9+dx,base+1.68,-65+dz],b=[-9+dx-Math.sign(dx)*.44,base+2.125,-65+dz],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   box((a[0]+b[0])/2,(a[1]+b[1])/2,a[2],.075,length,.085,0xb59b6c,'matched-canopy-brace',{r:[0,0,-Math.atan2(b[0]-a[0],b[1]-a[1])],fixtureEnds:[a,b],cutaway:true});
  }
  // Use the existing reveal aperture. A low cosmetic roof must not collapse
  // the shoulder camera against the player when its ray crosses this canopy.
  box(-9,base+2.2,-65,3.7,.15,2.4,0x8d9680,'shelter-canopy',{cutaway:true});
  box(-7.95,base+1.03,-64.8,.55,.12,.46,0xb6a279,'sorting-tray');
 }else{
  const x=32,z=-20;for(const dx of[-.52,.52])box(x+dx,base+.56,z,.075,1.12,.65,0x8f7958,'lookout-leg');
  box(x,base+1.18,z,1.34,.09,.83,0xb4a483,'lookout-board',{r:[-.13,0,0]});
  box(x,base+1.25,z-.025,.83,.04,.55,0xdfd2ac,'river-chart',{r:[-.13,0,0]});
  const chart=M.compose(x,base+1.25,z-.025,1,1,1,-.13,0,0);
  for(const dz of[-.16,0,.16]){const p=M.transform(chart,[0,.027,dz]);emit('box',p,[.64,.012,.024],0x70918b,'chart-stream',{m:M.mul(chart,M.compose(0,.027,dz,.64,.012,.024))});}
  box(x+.57,base+1.28,z+.13,.1,.12,.14,0xaca092,'reading-weight');
 }
 const w=B.worker(sim),pose=G.RealmTravelerArt.pose({phase:w.phase,blend:w.walking?1:0,time:w.time,reducedMotion:w.reducedMotion,activity:w.working?'record':null});
 const start=Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.length]));
 const workerFrame=G.RealmTravelerArt.draw(out,{x:w.x,z:w.z,base,yaw:w.yaw,color:0xa08b69,profile:{skin:3,hair:2,cloak:2}},pose);
 for(const[k,items]of Object.entries(out))for(let i=start[k];i<items.length;i++)Object.assign(items[i],{communityPart:'road-worker',communityChoice:r.choice,appearanceOnly:true});
 if(w.working){const local=workerFrame.joints.leftHand.map((v,i)=>(v+workerFrame.joints.rightHand[i])/2);local[1]+=.075;const p=M.transform(workerFrame.root,local);emit('box',p,[.43,.22,.035],0xd9cba5,'worker-record',{m:M.mul(workerFrame.root,M.compose(...local,.43,.22,.035)),handContacts:[workerFrame.joints.leftHand,workerFrame.joints.rightHand].map(p=>M.transform(workerFrame.root,p))});}
}
const api={draw};G.RealmBridgeCommunityArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
