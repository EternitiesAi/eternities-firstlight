/* The finale's drawing: the Regent's body, its chains, the freed allies, the merged valley's features and the diorama
 * anchors. Presentation only: it reads the owner and the tables and never writes to the story or the fight. Primitives
 * stand in until the story art lands; a body that is not in its phase draws nothing. */
(function(G){'use strict';
const C={coat:0x5b6063,dark:0x1e1a18,seam:0xe0643a,skin:0xd9cfc1,cinder:0x3b3430,iron:0x4a4642,bone:0xf1e6c8,gold:0xf1d890,sea:0x2f6f86,chainIron:0x3a3431,lantern:0xf2c27a,post:0x6f5a40,face:0xd9b98e};
const D=()=>G.RealmEarthHomecoming.definition,F=()=>G.RealmFinale,SG=()=>G.RealmSaga;
const finite=(...xs)=>xs.every(Number.isFinite);
function regent(out,e,t){
 const hot=e.mode==='windup'||e.mode==='recover',glow=e.finalePhase===3?1.2:e.finalePhase===2?.8:.5,yaw=e.yaw||0,pulse=.5+.5*Math.sin(t*3);
 out.box.push({p:[e.x,.9,e.z],s:[.9,1.8,.5],r:[0,yaw,0],c:C.coat});
 out.box.push({p:[e.x,.12,e.z],s:[.8,.24,.56],r:[0,yaw,0],c:C.dark});
 for(const x of[-.22,.22])out.box.push({p:[e.x+x*Math.cos(yaw),.95,e.z-x*Math.sin(yaw)],s:[.05,1.7,.06],r:[0,yaw,0],c:C.seam,em:(hot?1.6:glow)+pulse*.2});
 out.octa.push({p:[e.x,2.35,e.z],s:[.42,.46,.42],c:C.skin});
 out.box.push({p:[e.x,2.31,e.z+.2],s:[.22,.04,.04],c:C.dark});
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2+t*.4;out.octa.push({p:[e.x+Math.cos(a)*.34,2.66,e.z+Math.sin(a)*.34],s:[.12,.16,.12],c:C.cinder,em:(glow+.3)*(.7+.3*Math.sin(t*4+i))});}
}
function chain(out,e){
 const sp=D().spring,dx=sp.x-e.x,dz=sp.z-e.z,n=8,yaw=Math.atan2(dx,dz);
 out.box.push({p:[e.x,.25,e.z],s:[.5,.5,.5],c:C.iron});
 out.octa.push({p:[e.x,.66,e.z],s:[.9,.2,.9],c:C.iron,em:.25});
 for(let i=1;i<=n;i++){const u=i/(n+1);out.box.push({p:[e.x+dx*u,.9+Math.sin(Math.PI*u)*.5,e.z+dz*u],s:[.1,.1,.34],r:[0,yaw,0],c:C.iron});}
}
// drawEnemy is the adventure's hook for every body the finale owns.
function drawEnemy(out,sim,e,t){
 if(!G.RealmEarthHomecoming?.encounter(e)||!finite(e.x,e.z))return false;
 if(e.finaleRole==='chain')chain(out,e);else regent(out,e,t);
 return true;
}
// draw is the valley's world hook: the merged valley's features, the freed allies, the offer's glow and the anchors.
function draw(out,sim,t){
 if(!sim?.state?.saga||sim.room!==null)return;
 const st=sim.state,ph=st.saga.finale.phase,won=st.saga.finale.won||st.saga.credits,fin=st.earthHomecoming?.finale||{broken:[],offer:null},f=F(),route=f.route();
 if(ph===2&&!won){
  for(let i=0;i<route.length;i++){const a=route[i],b=route[(i+1)%route.length],mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,yaw=Math.atan2(b.x-a.x,b.z-a.z),len=Math.hypot(b.x-a.x,b.z-a.z);
   if(i%3===2)for(const s of[-.9,.9])out.box.push({p:[mx+Math.cos(yaw)*s,.7,mz-Math.sin(yaw)*s],s:[.16,1.4,.16],c:C.bone,em:.5});
   if(i%3===2)out.box.push({p:[mx,1.4,mz],s:[1.9,.18,.22],r:[0,yaw,0],c:C.gold,em:.6});
   if(i>=3&&i<=5)for(let k=0;k<len/1.2;k++){const u=(k+.5)/(len/1.2);out.box.push({p:[a.x+(b.x-a.x)*u,.22,a.z+(b.z-a.z)*u],s:[.14,.14,.3],r:[0,yaw,0],c:C.chainIron});}
   if(i>=6&&i<=8)out.box.push({p:[mx,.03,mz],s:[2.4,.03,Math.max(1.2,len*.5)],r:[0,yaw,0],c:C.sea,em:.1});
  }
 }
 if(won)for(const a of f.anchors(SG().echoLedger(st))){
  out.box.push({p:[a.x,.8,a.z],s:[.14,1.6,.14],c:C.post});
  out.octa.push({p:[a.x,1.7,a.z],s:[.32,.32,.32],c:a.lit?C.lantern:C.dark,em:a.lit?1.6:0});
 }
 if(ph===3&&!won&&(fin.offer??null)===null)for(let i=0;i<8;i++){const a=i/8*Math.PI*2+t*.2;out.octa.push({p:[D().spring.x+Math.cos(a)*2.2,1.2,D().spring.z+Math.sin(a)*2.2],s:[.14,.14,.14],c:C.gold,em:1.2});}
 if(ph>=1){
  const r=sim.earthHomecomingRuntime||{arrived:[]},plan=f.plan(SG().echoLedger(st));
  for(const a of plan.allies){if(!(r.arrived.includes(a.id)||(a.breaks&&fin.broken.includes(a.breaks))))continue;
   out.box.push({p:[a.site.x+.9,.5,a.site.z+.4],s:[.42,1,.3],c:parseHex(a.color)});
   out.octa.push({p:[a.site.x+.9,1.2,a.site.z+.4],s:[.24,.26,.24],c:C.face});}
 }
}
function parseHex(s){const n=parseInt(String(s||'#c9b79c').replace('#',''),16);return Number.isFinite(n)?n:0xc9b79c;}
const api={drawEnemy,draw};
G.RealmEarthHomecomingArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
