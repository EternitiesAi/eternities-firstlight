/* The two foxes at the nearshore. Positions and answers come from G.RealmNearshore; the parts come from the
 * Briar art so both foxes read as the same animal. A cold fox flickers out over its last seconds. */
(function(G){'use strict';
function draw(out,sim){
 const N=G.RealmNearshore,A=G.RealmCompanionArt;if(!N||!A||!out||!sim)return;
 const r=N.view(sim);if(!r)return;
 const p=sim.state.player,reduced=!!sim.state.settings?.reducedMotion;
 const one=(f,cold)=>{
  const yaw=Number.isFinite(f.yaw)?f.yaw:Math.atan2(p.x-f.x,p.z-f.z);
  const motion=A.motion(f.motion||null,{x:f.x,z:f.z,time:sim.elapsed,scene:null,paused:!!sim.paused,reducedMotion:reduced});
  const pose=A.pose({...motion,bonded:true,carrying:false,resting:!!f.sit});
  f.motion=motion;
  for(const{kind,...item}of A.parts({x:f.x,z:f.z,base:1.31,yaw,bonded:true},pose)){
   if(cold&&Math.floor(sim.elapsed*6)%2)continue;
   out[kind].push(item);
  }
 };
 one(r.real,false);
 if(r.fake)one(r.fake,false);
}
const api={draw};G.RealmNearshoreArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
