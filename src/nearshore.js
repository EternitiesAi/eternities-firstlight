/* The nearshore: the regent's faultless briar and the real one, at the lantern pier. The saga owns the truth
 * (briar.state, returnedDay, homeDay). This owner runs the two foxes, the real one's walk to her habit, the
 * answer and the soft failure. Runtime is never saved; every saved change is a candidate save, adopted only
 * after the writer says ok. The spoken lines live in SCENES, one small table per scene, for the story script. */
(function(G){'use strict';
const SAGA=()=>G.RealmSaga||(typeof require==='function'?require('./saga.js'):null);
const CORE=()=>G.RealmCore||(typeof require==='function'?require('./core.js'):null);
const PLACE=Object.freeze({x:0,z:27}),REAL_START=Object.freeze({x:-.6,z:26.4});
const WAIT=2,WALK=2.4,SIDE=.5,HEEL=1.1,COLD=1.8,RETRY=3,REACH=2.8,NEAR=9,GROUND=1.31;
const fail=error=>({ok:false,error}),finite=Number.isFinite,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const SCENES=Object.freeze({
 arrive:Object.freeze([
  {speaker:'The Regent of Ash',text:'I kept her for you. She never strays now.'},
  {speaker:'',text:'Two foxes stand on the boards. One of them is looking past you.'}]),
 real:Object.freeze([
  {speaker:'',text:'She leans into your leg, and the habit she had comes back with her.'},
  {speaker:'',text:'Briar is home.'}]),
 false:Object.freeze([
  {speaker:'',text:'The fox at your heel goes cold and comes apart like ash on the water.'},
  {speaker:'The Regent of Ash',text:'Ha. You knew her too late.'}]),
 refuse:Object.freeze([
  {speaker:'The Regent of Ash',text:'You came all this way alone. Take this one. She will never stray from you.'},
  {speaker:'',text:'The fox at his feet is perfect, and it is not looking at anything.'},
  {speaker:'',text:'You walk past it. Nothing that cannot leave you is a companion.'}]),
 home:Object.freeze([
  {speaker:'',text:'That evening Briar settles in her old spot by the door, beside her bowl.'}])
});
const text=lines=>lines.map(l=>l.text).join(' ');
// Each saga write lands in a candidate's journal the way Simulation.event would.
const journalOn=c=>(kind,t)=>{c.journal.push({seq:c.nextEvent++,day:c.day,hour:c.hour,kind,text:t.slice(0,350)});if(c.journal.length>200)c.journal.shift();};
const simOn=c=>({state:c,event:journalOn(c)});
const runtimes=new WeakMap();
// Live only outdoors, with Briar taken to the nearshore and the witness finished.
function active(sim){const s=sim?.state;return !!s&&sim.room===null&&!sim.worldDive&&s.saga?.briar?.state==='nearshore'&&SAGA().done(s,'witness');}
function runtime(sim){
 let r=runtimes.get(sim);
 if(!r||r.owner!==sim.state){r={owner:sim.state,last:sim.elapsed||0,real:{x:REAL_START.x,z:REAL_START.z,yaw:0,path:null,started:false,sit:false,t:0,motion:null},fake:{state:'heel',t:0,x:0,z:0,yaw:0,motion:null}};runtimes.set(sim,r);}
 return r;
}
function heelAt(sim){
 const p=sim.state.player,yaw=finite(p.yaw)?p.yaw:0,fx=Math.sin(yaw),fz=Math.cos(yaw);
 // right of forward is (cos, -sin); behind is (-forward). Try the side first, then straight behind.
 for(const[dx,dz]of[[fz*SIDE-fx*HEEL,-fx*SIDE-fz*HEEL],[-fz*SIDE-fx*HEEL,fx*SIDE-fz*HEEL],[-fx*HEEL,-fz*HEEL]]){
  const x=p.x+dx,z=p.z+dz;if(CORE().walkable(x,z,sim.navRoom,.31))return{x,z};
 }
 return{x:p.x,z:p.z};
}
// The spot the real briar walks to: her habit landmark, or the nearest open ground beside it.
function habitSpot(sim){
 const id=SAGA().habitPlace(sim.state),L=(CORE().LANDMARKS||[]).find(l=>l.id===id)||(CORE().LANDMARKS||[])[0];
 for(const[dx,dz]of[[0,0],[0,-1.6],[1.6,0],[-1.6,0],[0,1.6],[1.6,1.6],[-1.6,1.6],[1.6,-1.6],[-1.6,-1.6],[0,-2.6],[2.6,0],[-2.6,0],[0,2.6]]){
  const x=L.x+dx,z=L.z+dz;if(CORE().walkable(x,z,sim.navRoom,.31))return{x,z,id:L.id};
 }
 return{x:L.x,z:L.z,id:L.id};
}
function stepReal(sim,f,dt){
 if(f.sit)return;
 if(!f.started&&f.t>=WAIT){
  f.started=true;const spot=habitSpot(sim),path=CORE().pathfind({x:f.x,z:f.z},spot,sim.navRoom,false,.31);
  f.path=path||[];f.spot=spot;if(!path)f.sit=true;
 }
 if(!f.started)return;
 let left=WALK*dt;
 while(f.path.length&&left>1e-9){
  const q=f.path[0],dx=q.x-f.x,dz=q.z-f.z,l=Math.hypot(dx,dz);
  if(l<=left+1e-9){f.x=q.x;f.z=q.z;left-=l;f.path.shift();}
  else{f.x+=dx/l*left;f.z+=dz/l*left;f.yaw=Math.atan2(dx,dz);left=0;}
 }
 if(!f.path.length)f.sit=true;
}
// Time comes from the simulation clock, so a reload or a repaint never double-steps a fox.
function step(sim){
 const r=runtime(sim),now=finite(sim.elapsed)?sim.elapsed:0,dt=Math.min(.1,Math.max(0,now-r.last));r.last=now;
 r.real.t+=dt;stepReal(sim,r.real,dt);
 const f=r.fake;
 if(f.state==='heel'){const h=heelAt(sim);f.x=h.x;f.z=h.z;f.yaw=sim.state.player.yaw||0;}
 else{f.t+=dt;if(f.state==='cold'&&f.t>=COLD){f.state='gone';f.t=0;}else if(f.state==='gone'&&f.t>=RETRY){f.state='heel';f.t=0;}}
 return r;
}
function view(sim){if(!active(sim)){runtimes.delete(sim);return null;}return step(sim);}
function foxAt(sim){
 const r=view(sim);if(!r)return null;const p=sim.state.player,cands=[];
 if(dist(p,r.real)<=REACH)cands.push(['real',dist(p,r.real)]);
 if(r.fake.state==='heel'&&dist(p,r.fake)<=REACH)cands.push(['false',dist(p,r.fake)]);
 cands.sort((a,b)=>a[1]-b[1]);return cands[0]?cands[0][0]:null;
}
function commit(sim,candidate,io,line,lines){
 const state=sim.state,room=sim.room,before=JSON.stringify(state);
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 candidate.adventure.revision++;
 candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'nearshore',text:line.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=CORE().validate(candidate);saved=io?.save?.(checked);}catch(e){return fail('Nearshore save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Nearshore save refused. Nothing was changed.');
 if(sim.state!==state||sim.room!==room||JSON.stringify(sim.state)!==before)return fail('The character changed during saving. The saved candidate was not adopted.');
 sim.state.saga=checked.saga;sim.state.adventure.companion=checked.adventure.companion;sim.state.adventure.revision=checked.adventure.revision;
 sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text:line,lines};
}
function arrive(sim,io){
 const s=sim.state.saga;
 if(s.briar.state==='nearshore'||s.briar.state==='returned')return{ok:true,duplicate:true,text:''};
 if(sim.room!==null||sim.worldDive)return fail('Walk out onto the lantern pier first.');
 if(s.briar.state!=='taken')return fail('Briar is not lost.');
 if(!SAGA().done(sim.state,'witness'))return fail('The witness is not finished yet.');
 if(dist(sim.state.player,PLACE)>NEAR)return fail('Walk out onto the lantern pier first.');
 const c=sim.snapshot(),res=SAGA().briarAtNearshore(simOn(c));if(!res.ok)return fail(res.error);
 return commit(sim,c,io,text(SCENES.arrive),SCENES.arrive);
}
function choose(sim,payload,io){
 const fox=payload.fox;if(fox!=='real'&&fox!=='false')return fail('Choose one of the two foxes.');
 const r=view(sim);if(!r)return fail('Nobody is waiting on the pier.');
 if(foxAt(sim)!==fox)return fail('Walk up to the fox you mean, then answer it.');
 if(fox==='false'){r.fake.state='cold';r.fake.t=0;return{ok:true,soft:true,text:text(SCENES.false),lines:SCENES.false};}
 const c=sim.snapshot();if(c.adventure.companion?.bonded!==true)return fail('Briar is not yours to call.');
 const res=SAGA().briarReturned(simOn(c));if(!res.ok)return fail(res.error);
 c.adventure.companion.mode='follow';
 const out=commit(sim,c,io,text(SCENES.real),SCENES.real);
 if(out.ok){runtimes.delete(sim);G.RealmAdventure?.syncScene?.(sim);}
 return out;
}
// A player who never took Briar home meets the same offer with nobody to compare it to, and says no.
function refusable(sim){const s=sim?.state;return !!s&&sim.room===null&&!sim.worldDive&&s.adventure?.companion?.bonded!==true&&s.saga?.briar?.state==='with'&&!Object.hasOwn(s.saga.beats,'nearshore')&&Object.hasOwn(s.saga.beats,'night')&&SAGA().done(s,'witness');}
function refuse(sim,io){
 if(Object.hasOwn(sim.state.saga.beats,'nearshore'))return{ok:true,duplicate:true,text:''};
 if(!refusable(sim))return fail('Nobody is waiting on the pier for you.');
 if(dist(sim.state.player,PLACE)>REACH+1)return fail('Walk out onto the lantern pier first.');
 const c=sim.snapshot(),res=SAGA().refuseCompanion(simOn(c));if(!res.ok)return fail(res.error);
 return commit(sim,c,io,text(SCENES.refuse),SCENES.refuse);
}
function home(sim,io){
 const s=sim.state.saga;
 if(s.briar.state!=='returned')return fail('Briar is not with you yet.');
 if(s.briar.homeDay!==null)return{ok:true,duplicate:true,text:''};
 const c=sim.snapshot(),res=SAGA().briarHome(simOn(c));if(!res.ok)return fail(res.error);
 return commit(sim,c,io,text(SCENES.home),SCENES.home);
}
// ctx: { sim, active }. payload carries the revision and the active owner the caller read.
function command(ctx,type,payload,io){
 const sim=ctx?.sim;
 if(!sim||!(sim instanceof CORE().Simulation)||!payload||typeof payload!=='object'||Array.isArray(payload))return fail('Reach the nearshore while able to act.');
 if(typeof ctx.active!=='string'||!ctx.active||payload.expectedActive!==ctx.active||!Number.isSafeInteger(payload.expectedRevision)||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or place changed. Read the current place again.');
 if(type==='arrive')return arrive(sim,io);
 if(type==='choose')return choose(sim,payload,io);
 if(type==='home')return home(sim,io);
 if(type==='refuse')return refuse(sim,io);
 return fail('Unknown nearshore action.');
}
const api=Object.freeze({PLACE,REAL_START,WAIT,WALK,HEEL,COLD,RETRY,REACH,NEAR,SCENES,active,view,foxAt,habitSpot,refusable,hidesBriar:active,command});
G.RealmNearshore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
