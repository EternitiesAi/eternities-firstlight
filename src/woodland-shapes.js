/* Four authored crown replacements, appearance only. Trunks, roots, ground,
 * collision, camera solids, services, actors and saved worlds keep their owners. */
(function(G){'use strict';
const SEED=23171007,ROOM='world-earthlands',FLOOR=1.57;
const IDS=Object.freeze(['elderweald-trunk-16','elderweald-trunk-17','elderweald-trunk-18','elderweald-trunk-31']);
const ROLES=Object.freeze(['crown-branch','crown-lobe','upper-crown']),PROFILE=Object.freeze([.9,1,.85,1]);
const PALETTE=Object.freeze([0x49664d,0x617b55,0x7f8c63,0x567361]);
const vary=(i,n)=>{let x=(SEED^(i+1)*2654435761^(n+1)*1597334677)>>>0;x=Math.imul(x^(x>>>16),2246822507);x=Math.imul(x^(x>>>13),3266489909);return((x^(x>>>16))>>>0)/4294967296;};
function dependencies(def){
 const E=G.RealmEngine,W=G.RealmWorldFoundations,EW=G.RealmElderwealdWorld,D=G.RealmEarthWildSignsData,grazer=G.RealmEarthGrazerMotion,expedition=G.RealmEarthExpedition;
 if(!E?.geometry||!E?.M||!EW?.parts||!D?.definition||!grazer?.PATH||!expedition?.definition||def!==W?.definition(ROOM))throw TypeError('Use the actual Engine, canonical Earth and authored creature/route catalogues.');
 return{E,W,EW,D,grazer,expedition};
}
function qualityOf(options={}){
 if(!options||typeof options!=='object'||Array.isArray(options)||Reflect.ownKeys(options).some(k=>k!=='quality')||!['low','balanced','high'].includes(options.quality??'balanced'))throw TypeError('Use one declared quality and the fixed authored seed.');
 return options.quality??'balanced';
}
const toSegment=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);};
function reserves(def,{D,grazer,expedition}){
 const routes=[{points:D.bypass,r:1.6},{points:[D.evidence[2],{x:-158,z:-90},{x:-160,z:-92.5}],r:1.6},
  {points:[...grazer.PATH.points,grazer.PATH.points[0]],r:grazer.PATH.radius+.2},
  ...def.routes.map(route=>({points:route.points.map(([x,z])=>({x,z})),r:.6}))];
 // The parent may install the separately reviewed roadkeeper alongside this
 // dressing. Its real catalogue, when available, receives the full reserve.
 const roadkeeper=G.RealmEarthRoadkeeperMotion;
 if(roadkeeper?.ROOM===ROOM&&roadkeeper.ROUTES)for(const points of Object.values(roadkeeper.ROUTES))routes.push({points,r:1+roadkeeper.LIMITS.radius});
 const circles=[...D.evidence.map(p=>({...p,r:1.8})),{...D.overlook,r:2.8},...def.points.map(p=>({...p,r:3})),
  ...[...expedition.definition.enemies,...def.enemies,D.enemy].map(p=>({...p,r:5.6}))];
 return{routes,circles};
}
function parts(def,options={}){
 const quality=qualityOf(options),deps=dependencies(def),{E,W}=deps,out=[],protectedSpace=reserves(def,deps);
 for(let i=0;i<IDS.length;i++){
  const t=def.solids.find(p=>p.id===IDS[i]);if(!t||Math.abs(W.height(ROOM,t.x,t.z)-FLOOR)>1e-7)throw Error('An original tree anchor lost its exact supported floor.');
  const {x,z,h,id}=t,scale=PROFILE[i],yaw=vary(i,0)*Math.PI*2;
  const emit=(kind,p,s,c,role,extra={})=>out.push({kind,p,s,c,opt:{rough:.9+Math.floor(vary(i,1)*3)*.025,appearanceOnly:true,cameraSolid:false,cutaway:true,
   solidId:id,worldSolidId:id,structureId:id,elderwealdPart:role,woodlandShapes:SEED,...extra}});
  const branch=(end,slot)=>{
   const start=[x,FLOOR+h*.84,z],d=end.map((v,k)=>v-start[k]),length=Math.hypot(...d),yy=d.map(v=>v/length),ref=[0,0,1];
   let xx=[ref[1]*yy[2]-ref[2]*yy[1],ref[2]*yy[0]-ref[0]*yy[2],ref[0]*yy[1]-ref[1]*yy[0]],n=Math.hypot(...xx);xx=xx.map(v=>v/n);
   const zz=[xx[1]*yy[2]-xx[2]*yy[1],xx[2]*yy[0]-xx[0]*yy[2],xx[0]*yy[1]-xx[1]*yy[0]],width=.16+vary(i,slot+5)*.055;
   emit('cylinder',start,[width,length,width*.9],t.color,'organic-crown-branch',{rough:.98,m:[...xx.map(v=>v*width),0,...yy.map(v=>v*length),0,...zz.map(v=>v*width*.9),0,...start,1],anchorFrom:start,anchorTo:end});
  };
  if(quality==='low'){
   branch([x+.1*scale,FLOOR+h+.5,z-.08*scale],0);
   emit('round',[x+.07*scale,FLOOR+h+1.1,z-.08*scale],[3.1*scale,3.1,2.7*scale],PALETTE[i],'organic-crown',{foliage:true,wind:2,r:[0,yaw,0]});
  }else{
   for(let side=0;side<2;side++){
    const angle=yaw+side*2.55,offset=(.68+vary(i,side+2)*.1)*scale;
    const p=[x+Math.cos(angle)*offset,FLOOR+h+.75+vary(i,side+3)*.12,z+Math.sin(angle)*offset];
    branch([p[0],p[1]-.28,p[2]],side);
    emit('round',p,[2.35*scale,2.2+vary(i,side+7)*.15,2.25*scale],PALETTE[(i+side)%4],'organic-crown',{foliage:true,wind:2,r:[0,angle,0],rough:.86+.03*((i+side)%4)});
   }
   emit('round',[x-.09*scale,FLOOR+h+1.25,z+.06*scale],[2.7*scale,2.6,2.5*scale],PALETTE[(i+2)%4],'organic-crown',{foliage:true,wind:2,r:[0,yaw+.4,0]});
  }
  // Actual transformed meshes and conservative current shader wind envelope.
  // Keep the whole canopy column clear, rather than relying on overhead height.
  const points=[];
  for(const p of out.filter(p=>p.opt.solidId===id)){
   const m=p.opt.m||E.M.compose(...p.p,...p.s,...(p.opt.r||[0,0,0])),raw=E.geometry(p.kind);
   for(let v=0;v<raw.length;v+=6){const q=E.M.transform(m,Array.from(raw.slice(v,v+3)));points.push(q);
    if(!q.every(Number.isFinite)||q[1]-(p.opt.wind ? .05 : 0)<=FLOOR+2.2||[q[0]-.095,q[0]+.095].some(qx=>W.height(ROOM,qx,q[2])!==FLOOR))throw Error('An authored crown lost real ground projection or overhead clearance.');
   }
  }
  const radius=Math.max(...points.map(p=>Math.hypot(p[0]-x,p[2]-z)))+.095;
  if(protectedSpace.routes.some(route=>route.points.slice(1).some((b,k)=>toSegment(t,route.points[k],b)-route.r-radius<.015))||
   protectedSpace.circles.some(p=>Math.hypot(x-p.x,z-p.z)-p.r-radius<.015))throw Error('An authored crown would enter an existing actor, clue, service, hostile or walking reserve.');
 }
 if(out.length>(quality==='low'?8:20))throw RangeError('Four-crown instance budget exceeded.');return out;
}
function replace(original,def,options={}){
 const quality=qualityOf(options),{EW,W}=dependencies(def),canonical=EW.parts({quality,height:(x,z)=>W.height(ROOM,x,z)});
 if(!Array.isArray(original)||JSON.stringify(original)!==JSON.stringify(canonical))throw TypeError('Replace only the complete actual Elderweald painter output for this exact tier.');
 const kept=original.filter(p=>!IDS.includes(p.opt.solidId)||!ROLES.includes(p.opt.elderwealdPart));return[...kept,...parts(def,{quality})];
}
const api=Object.freeze({SEED,IDS,ROLES,PALETTE,parts,replace});G.RealmWoodlandShapes=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
