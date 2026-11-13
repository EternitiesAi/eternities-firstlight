/* The feather's sight: hold Z (or the feather button on a phone) to see the roads as they are. True roads glow
 * gold, counterfeit roads glow ash red, and the rest of the scene is quieted with a canvas filter. Presentation
 * only: each hold is a saga command (feather-use). Which roads are true is data here, never save state. */
(function(G){'use strict';
const KEY='z',GOLD=0xffc23a,ASH_RED=0x9c2f26,QUIET='saturate(0.42)',STEP=1.2,DASH=[.34,.035,.9];
// The two campaign realms are world-foundations rooms.
const HELL_ROOM='world-hell',HEAVEN_ROOM='world-heaven';
// The nearshore is the valley within reach of the lantern pier (the nearshore module's PLACE and its nine-pace reach).
const PIER={x:0,z:27},PIER_REACH=9;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// The valley floor sits lower than the road and crossing paths, so the glow needs its own height per area.
// Hell and heaven read their height from world-foundations per point.
const GROUND=Object.freeze({valley:1.31,nearshore:1.31,road:1.59,crossing:1.59});
// Markers only go where the area's own ground is walkable, so no glow floats over water or into a wall.
const WALK=Object.freeze({
 valley:(x,z)=>!!G.RealmCore&&G.RealmCore.walkable(x,z,null,.05),
 nearshore:(x,z)=>!!G.RealmCore&&G.RealmCore.walkable(x,z,null,.05),
 road:(x,z)=>!!G.RealmRoad&&G.RealmRoad.walkable(x,z,.05),
 crossing:(x,z)=>!!G.RealmCrossing&&G.RealmCrossing.walkable(x,z,.05)
});
// Every road is a polyline on one area. `after` names a world fact the road waits for; `when` names a check (below).
const ROADS=Object.freeze([
 {id:'valley-workshop',area:'valley',truth:'true',points:[[0,3],[5,6],[11,9]]},
 {id:'valley-stage',area:'valley',truth:'true',points:[[0,3],[0,-11.6]]},
 {id:'valley-mine',area:'valley',truth:'true',points:[[0,3],[-4,0],[-5,-6],[-5,-12],[-5,-20],[-2,-24]]},
 {id:'valley-lookout',area:'valley',truth:'true',points:[[0,3],[20,4],[37,3],[44,6]]},
 {id:'valley-house',area:'valley',truth:'true',points:[[0,3],[-6,0],[-11,-1.6]]},
 // the track the fox has worn from the commons to the shared house door: thin, and only once she is bonded.
 {id:'valley-briar-track',area:'valley',truth:'true',thin:true,after:'bonded',points:[[0,3],[-5,4.5],[-10,2.5]]},
 {id:'valley-garden',area:'valley',truth:'true',points:[[0,3],[-6,8],[-6,13]]},
 {id:'valley-shore',area:'valley',truth:'true',points:[[0,3],[0,15],[0,27]]},
 {id:'sunward-road',area:'road',truth:'true',points:[[0,17],[-1,6],[2,3],[2,-4],[3,-12],[0,-24]]},
 {id:'sunward-spur',area:'road',truth:'counterfeit',after:'beacon',points:[[3,-12],[7,-14],[10,-18],[6,-22],[2,-23]]},
 {id:'bellweather-main',area:'crossing',truth:'true',points:[[0,24],[0,17],[0,9],[0,0],[0,-9],[0,-18]]},
 {id:'bellweather-shop',area:'crossing',truth:'true',points:[[0,9],[-9,15]]},
 // a faint red road, old as the flagstones: it stays by day and ends at the night's device (night.js DEVICE 16.4, 18).
 {id:'bellweather-severing',area:'crossing',truth:'counterfeit',points:[[-10,-8],[-6,0],[-1,6],[4,12],[10,15],[16.4,18]]},
 {id:'hell-master-die',area:'hell',truth:'true',points:[[-12,-95],[0,-105]]},
 {id:'hell-line-west',area:'hell',truth:'counterfeit',points:[[-18,-90],[-12,-95]]},
 {id:'hell-line-east',area:'hell',truth:'counterfeit',points:[[17,-90],[0,-91]]},
 // the borrowed rescue road: shown from the false relay's reading until the relay seraph is broken.
 {id:'heaven-causeway',area:'heaven',truth:'counterfeit',when:'causeway',points:[[0,-79],[0,-53]]},
 // at the nearshore both foxes are marked true: the sight cannot tell them apart, the habit can (BRANCHES.md 3.8).
 {id:'nearshore-fox-real',area:'nearshore',truth:'true',points:[[-0.6,26.4],[0.7,26.4]]},
 {id:'nearshore-fox-false',area:'nearshore',truth:'true',points:[[-0.2,27.6],[0.6,27.6]]}
]);
function areaOf(sim){
 const r=sim?.room;
 if(!r)return sim?.state?.player&&dist(sim.state.player,PIER)<=PIER_REACH?'nearshore':'valley';
 if(r==='road'||r==='crossing')return r;
 if(r===HELL_ROOM)return'hell';
 if(r===HEAVEN_ROOM)return'heaven';
 return null;
}
function unlocked(sim){return sim?.state?.saga?.feather?.unlocked===true;}
// A road shows when its world fact holds: the stranger's spur after the beacon, the briar track once she is bonded,
// and the causeway from the false relay's reading until the relay is broken.
function visible(world,road){
 if(road.after==='beacon')return world?.adventure?.beacon?.introduced===true;
 if(road.after==='bonded')return world?.adventure?.companion?.bonded===true;
 if(road.when==='causeway'){const st=world?.heavenCampaign?.steps||[];return st.includes('inspect-false-relay')&&!st.includes('relay-disabled');}
 return true;
}
function roadsFor(sim){const area=areaOf(sim);return area?ROADS.filter(r=>r.area===area&&visible(sim.state,r)):[];}
const state={held:false,sim:null,serial:0,filter:'',button:null};
// A new hold is one use of the feather. Holding again without letting go is not another use.
function hold(sim,on){
 if(sim)state.sim=sim;
 const next=!!on&&!!sim&&typeof sim.sagaCommand==='function'&&unlocked(sim)&&areaOf(sim)!==null;
 if(next&&!state.held){const r=sim.sagaCommand('feather-sight-'+(++state.serial),'feather-use',{});if(!r.ok){state.held=false;return false;}}
 state.held=next;return next;
}
function paint(active){
 const v=active?QUIET:'';if(v===state.filter)return;state.filter=v;
 const canvas=typeof document!=='undefined'&&document.getElementById('world');if(canvas)canvas.style.filter=v;
}
function mount(){
 if(state.button||typeof document==='undefined')return;const hud=document.getElementById('hud');if(!hud)return;
 const b=document.createElement('button');b.id='feather-sight';b.type='button';b.hidden=true;b.textContent='Hold · feather';
 b.title='Hold to see the true roads · Z';b.setAttribute('aria-label','Hold to see the true roads');
 b.style.cssText='position:fixed;left:12px;bottom:58px;min-height:44px;min-width:44px;padding:0 16px;border-radius:22px;border:1px solid #e7c77a;background:#1b3a3f;color:#f3e2b4;font:600 14px system-ui,sans-serif;touch-action:none;z-index:5;';
 const release=()=>hold(state.sim,false);
 b.addEventListener('pointerdown',e=>{e.preventDefault();hold(state.sim,true);});
 b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('pointerleave',release);
 hud.append(b);state.button=b;
}
function draw(out,sim,t,artist){
 state.sim=sim;mount();
 const area=areaOf(sim),ok=unlocked(sim)&&area!==null;
 if(state.button)state.button.hidden=!ok;
 if(!ok&&state.held)hold(sim,false);
 const active=state.held&&ok;paint(active);if(!active)return;
 const realm=area==='hell'||area==='heaven',W=G.RealmWorldFoundations,reduced=!!sim.state.settings?.reducedMotion,clock=reduced?0:t;let n=0;
 const ground=(x,z)=>realm?W.height(sim.room,x,z):GROUND[area];
 const walk=realm?(x,z)=>W.walkable(sim.room,x,z,.05):WALK[area];
 for(const road of roadsFor(sim)){
  const color=road.truth==='true'?GOLD:ASH_RED,thin=road.thin?.4:1;
  for(let k=0;k<road.points.length-1;k++){
   const[ax,az]=road.points[k],[bx,bz]=road.points[k+1],dx=bx-ax,dz=bz-az,count=Math.max(1,Math.round(Math.hypot(dx,dz)/STEP)),yaw=Math.atan2(dx,dz);
   for(let i=0;i<count;i++){
    const u=(i+.5)/count,x=ax+dx*u,z=az+dz*u;
    if(!walk(x,z))continue;
    const base=ground(x,z),em=reduced?1.8:1.6+.5*Math.sin(clock*2.4+n*.55);n++;
    out.box.push({p:[x,base+.16,z],s:[DASH[0]*thin,DASH[1],DASH[2]],c:color,r:[0,yaw,0],em,rough:.5});
    out.box.push({p:[x,base+.13,z],s:[DASH[0]*1.7*thin,.012,DASH[2]*1.25],c:color,r:[0,yaw,0],em:em*.35,rough:.9});
   }
  }
 }
}
// Keyboard hold, with the key's own events only. Holding repeats are ignored; blur and an open dialog let go.
if(typeof window!=='undefined'&&typeof document!=='undefined'){
 const isKey=e=>typeof e.key==='string'&&e.key.toLowerCase()===KEY;
 window.addEventListener('keydown',e=>{if(!isKey(e)||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')||document.querySelector('dialog[open]'))return;hold(state.sim,true);});
 window.addEventListener('keyup',e=>{if(isKey(e))hold(state.sim,false);});
 window.addEventListener('blur',()=>hold(state.sim,false));
}
const api=Object.freeze({KEY,GOLD,ASH_RED,ROADS,GROUND,PIER,PIER_REACH,areaOf,roadsFor,visible,unlocked,hold,held:()=>state.held,draw});
G.RealmFeatherSight=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
