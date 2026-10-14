/* Read-only, small original commission props on existing supported ground. */
(function(G){'use strict';
const M=()=>G.RealmEarthMasterwork;
function draw(out,sim,t,art){const q=M().status(sim);if(!q||![null,G.RealmEarth.ROOM].includes(sim.room))return;
 const add=(kind,x,y,z,w,h,d,c,part,extra={})=>out[kind].push({p:[x,y,z],s:[w,h,d],c,rough:.83,cameraSolid:false,cutaway:false,appearanceOnly:true,masterworkPart:part,...extra});
 const box=(...v)=>add('box',...v),home=sim.room===null,base=home?1.2:1.57;
 if(home){
  const p=M().definition.giver;if(sim.state.adventure.started&&art?.person){const actor={};for(const k of Object.keys(out))actor[k]=[];art.person(actor,p.x,p.z,-Math.PI*.7,'#749294',sim.state.settings.reducedMotion?0:t,false,'craftsperson',false,base);for(const[k,items]of Object.entries(actor))for(const item of items)out[k].push({...item,cameraSolid:false,cutaway:false,appearanceOnly:true,masterworkPart:'apprentice'});}
  // Left table's rear corner, away from its retained front timber stack.
  box(9.1,2.165,7.55,.68,.07,.48,0xd1c3a5,'tool-sample');
  for(let i=0;i<3;i++)box(8.94+i*.16,2.205,7.49+i*.05,.035,.014,.21,0x687270,'stepped-toolmark');
  box(9.27,2.205,7.69,.15,.014,.035,0x687270,'hooked-toolmark');
  box(9.16,2.15,7.9,.40,.035,.16,q.resolution?0x93b4a0:0xbda878,'private-order');
 }else{
  // Dedicated small stand; appearance does not reserve stock or navigation.
  const x=15.8,z=-28.0;box(x,base+.52,z,.08,1.04,.08,0x74634d,'stand');
  box(x,base+1.055,z,1.18,.09,.84,0x8c785b,'support');
  box(x,base+.32,z,.62,.16,.54,0x77634a,'stand-foot');
  box(x+.46,base+1.29,z-.24,.065,.52,.065,0x655743,'commission-marker');
  box(x+.46,base+1.44,z-.24,.42,.22,.03,0x749294,'commission-pennant');
  box(x-.19,base+1.108,z,.32,.035,.47,0xd8cba9,'quarry-order');
  box(x+.20,base+1.11,z,.33,.055,.48,0x9bada7,'commission-stone');
  for(let i=0;i<3;i++)box(x+.08+i*.10,base+1.145,z-.12+i*.06,.026,.015,.18,0x4f6665,'commission-toolmark');
  box(x+.30,base+1.145,z+.05,.11,.015,.025,0x4f6665,'commission-hook');
  box(x+.20,base+1.155,z+.18,.29,.018,.075,q.resolution==='public-correction'?0xb2d3c2:q.resolution==='private-correction'?0xd4c9a2:0xb88e77,'credit-plate');
  if(q.resolution){box(x+.20,base+1.18,z+.18,.22,.012,.025,0x405954,'corrected-credit');if(q.resolution==='public-correction')box(x+.20,base+1.18,z+.22,.22,.012,.014,0x405954,'apprentice-cosignature');}
 }
}
G.RealmEarthMasterworkArt={draw};if(typeof module!=='undefined')module.exports=G.RealmEarthMasterworkArt;
})(globalThis);
