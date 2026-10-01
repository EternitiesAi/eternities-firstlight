/* Table details project remembered preparations. Art never accepts or pays work. */
(function(G){'use strict';
const Q=G.RealmGathering,E=G.RealmEarth;
function draw(out,sim,t,art){
 if(sim.room!==E.ROOM||!Q.available(sim.state.adventure))return;
 const s=sim.state.adventure.earthGathering,tx=Q.TABLE.x,tz=Q.TABLE.z-1,y=E.height(tx,tz);
 const box=(x,y,z,w,h,d,c,extra={})=>out.box.push({p:[x,y,z],s:[w,h,d],c,rough:.8,...extra});
 const round=(x,y,z,w,h,d,c)=>out.round.push({p:[x,y,z],s:[w,h,d],c,rough:.8});
 if(s.prepared.includes('cloth')){
  box(tx,y+.95,tz,2.35,.025,1.24,'#ded1af');
  for(let i=0;i<4;i++){round(tx-.82+i*.54,y+1.01,tz+.2,.29,.065,.29,'#b9c6bc');round(tx-.82+i*.54,y+1.046,tz+.2,.19,.018,.19,'#e6d6b1');}
  box(tx-1.04,y+.965,tz-.26,.24,.006,.1,'#b78470');
 }
 const lx=s.prepared.includes('lantern')?tx+1.6:Q.LANTERN.x,lz=s.prepared.includes('lantern')?tz-.3:Q.LANTERN.z,ly=E.height(lx,lz);
 box(lx,ly+1.15,lz,.09,2.3,.09,'#665743');box(lx,ly+2.08,lz,.28,.44,.28,'#ffe0a0',{em:.7});box(lx,ly+2.35,lz,.4,.08,.4,'#6e5942');
 for(const dx of [-.16,.16])box(lx+dx,ly+2.08,lz,.035,.46,.32,'#705b44');
 if(s.prepared.includes('stand')){
  box(tx,y+1.1,tz-.2,.68,.17,.4,'#725039');box(tx,y+1.23,tz-.2,.54,.07,.34,'#c5a56a');
  for(let i=0;i<5;i++)box(tx-.24+i*.12,y+1.28,tz-.2,.025,.02,.24,'#e7dcb8');
 }
 if(s.shared){box(lx,ly+1.4,lz,.03,.7,.62,Q.VERSES[s.verse].color);box(lx+.025,ly+1.4,lz,.012,.045,.4,'#f1ddb7');}
}
G.RealmGatheringArt={draw};
})(globalThis);
