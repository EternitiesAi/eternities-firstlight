/* Read-only escort silhouettes and modest local consequences. Actor positions
 * are accepted only from the current host projection, never invented here. */
(function(G){'use strict';
function draw(out,sim,t,art){const R=G.RealmEarthGate,D=R.definition;if(sim.room!==D.room)return;
 const E=G.RealmEarth,q=sim.state.adventure.earthGate,quiet=sim.state.settings.reducedMotion;
 const add=(kind,x,y,z,w,h,d,c,part,extra={})=>(out[kind]||=[]).push({p:[x,y,z],s:[w,h,d],c,rough:.88,cameraSolid:false,cutaway:false,appearanceOnly:true,gatePart:part,...extra});
 const stand=(x,z,part)=>{const y=E.height(x,z);add('box',x,y+.47,z,.65,.94,.42,0x6d6953,part+'-stand');add('box',x,y+.97,z,.72,.06,.51,0xc9b995,part+'-page');for(let i=0;i<3;i++)add('box',x-.20+i*.20,y+1.005,z,.025,.009,.29,0x696c59,part+'-ink');};
 stand(-5,-34,'register');stand(-6,6.8,'waybill');
 // Keep the inspection approach and existing shelter doorway physically clear.
 if(q.prepared&&q.plan==='inspection-lane')for(const x of[-7.6,-4.4])for(const z of[-31,-33]){const y=E.height(x,z);add('box',x,y+.42,z,.08,.84,.08,0x897c5b,'lane-guide');add('box',x,y+.76,z,.28,.17,.04,0xa8b6a0,'lane-ribbon');}
 if(q.prepared&&q.plan==='temporary-shelter'){const x=-12,z=-23.8,y=E.height(x,z);for(const dx of[-.9,.9])add('box',x+dx,y+.72,z,.09,1.44,.09,0x8e7b58,'screen-upright');add('box',x,y+.8,z,1.76,1.2,.045,0x9baf9c,'repaired-weather-screen');add('box',x,y+1.42,z,1.91,.08,.08,0x8e7b58,'screen-crossbar');}
 if(art?.person){const tmp={};for(const k of Object.keys(out))tmp[k]=[];art.person(tmp,-4,-32,Math.PI,'#758c83',quiet?0:t,false,'craftsperson',false,E.height(-4,-32));for(const[k,parts]of Object.entries(tmp))for(const p of parts)(out[k]||=[]).push({...p,gatePart:'captain',cameraSolid:false,cutaway:false,appearanceOnly:true});}
 const view=sim.gatePresentation,ctx=sim.gatePresentationContext;
 if(!view||!R.motion.isProjection(view,ctx))return;
 const colors=[0x9e805c,0x719793,0x8c869f];
 for(const [i,a]of view.actors.entries()){
  const local={box:[],round:[],octa:[],disc:[]},pose=G.RealmTravelerArt.pose({phase:a.distance*4,blend:view.moving?1:0,time:sim.elapsed,reducedMotion:quiet});
  G.RealmTravelerArt.draw(local,{x:a.x,z:a.z,base:a.base+.004,yaw:a.yaw,color:colors[i]},pose);
  for(const[k,parts]of Object.entries(local))for(const p of parts){if(p.travelerPart==='ground-marker')continue;const{travelerPart,...rest}=p;(out[k]||=[]).push({...rest,gateActor:a.id,gatePart:travelerPart,appearanceOnly:true});}
  // Small, distinct travelling bundles; no equipment, loot or fake cart physics.
  const x=a.x-Math.sin(a.yaw)*.22,z=a.z-Math.cos(a.yaw)*.22;
  add('box',x,a.base+1.02,z,.37,.43,.19,[0x70644e,0x627a71,0x746879][i],'travel-bundle',{r:[0,a.yaw,0],gateActor:a.id});
 }
}
G.RealmEarthGateArt={draw};if(typeof module!=='undefined')module.exports=G.RealmEarthGateArt;
})(globalThis);
