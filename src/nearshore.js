/* The nearshore: Briar's two foxes at the lantern pier. The saga owns the truth (briar.state, falseTrusted,
 * returnedDay, homeDay, the nearshore beat). This owner runs the foxes, the real one's walk to her habit, the heel
 * prompt and the answers. Every line comes from the story script (forStep); runtime is never saved; each saved
 * change is a candidate save, adopted only after the writer says ok. BRANCHES.md 3.8, 5 and 6. */
(function(G){'use strict';
const SAGA=()=>G.RealmSaga||(typeof require==='function'?require('./saga.js'):null);
const CORE=()=>G.RealmCore||(typeof require==='function'?require('./core.js'):null);
const SCRIPT=()=>G.RealmStoryScript||(typeof require==='function'?require('./story-script.js'):null);
const PLACE=Object.freeze({x:0,z:27}),REAL_START=Object.freeze({x:-.6,z:26.4});
const WAIT=2,WALK=2.4,SIDE=.5,HEEL=1.1,REACH=2.8,NEAR=9,GROUND=1.31;
const fail=error=>({ok:false,error}),finite=Number.isFinite,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// The script is the source of every spoken line; a missing script speaks nothing rather than inventing text.
const spoken=(step,state)=>{const s=SCRIPT()?.forStep?.('nearshore',step,state);return s?s.lines.map(l=>l.text):[];};
const sceneOf=(step,state)=>SCRIPT()?.forStep?.('nearshore',step,state)||null;
// Each saga write lands in a candidate's journal the way Simulation.event would.
const journalOn=c=>(kind,t)=>{c.journal.push({seq:c.nextEvent++,day:c.day,hour:c.hour,kind,text:t.slice(0,350)});if(c.journal.length>200)c.journal.shift();};
const simOn=c=>({state:c,event:journalOn(c)});
const runtimes=new WeakMap();
// Live only outdoors, with Briar taken to the nearshore and the witness finished.
function active(sim){const s=sim?.state;return !!s&&sim.room===null&&!sim.worldDive&&s.saga?.briar?.state==='nearshore'&&SAGA().done(s,'witness');}
// The faultless fox leaves the scene for good once it has been taken home (falseTrusted is saved).
const hasFalse=state=>state?.saga?.briar?.falseTrusted===true;
function runtime(sim){
 let r=runtimes.get(sim);
 if(!r||r.owner!==sim.state){r={owner:sim.state,last:sim.elapsed||0,real:{x:REAL_START.x,z:REAL_START.z,yaw:0,path:null,started:false,sit:false,t:0,motion:null,spot:null},fake:{x:0,z:0,yaw:0,motion:null}};runtimes.set(sim,r);}
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
 if(!hasFalse(sim.state)){const h=heelAt(sim);r.fake.x=h.x;r.fake.z=h.z;r.fake.yaw=sim.state.player.yaw||0;}
 return r;
}
// The view the art and the interaction read: the real fox always; the faultless fox only while she is not yet taken home.
function view(sim){if(!active(sim)){runtimes.delete(sim);return null;}const r=step(sim);return{real:r.real,fake:hasFalse(sim.state)?null:r.fake};}
function foxAt(sim){
 const v=view(sim);if(!v)return null;const p=sim.state.player,cands=[];
 if(dist(p,v.real)<=REACH)cands.push(['real',dist(p,v.real)]);
 if(v.fake&&dist(p,v.fake)<=REACH)cands.push(['false',dist(p,v.fake)]);
 cands.sort((a,b)=>a[1]-b[1]);return cands[0]?cands[0][0]:null;
}
function commit(sim,candidate,io,line,lines){
 const state=sim.state,room=sim.room,before=JSON.stringify(state);
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 candidate.adventure.revision++;
 candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'nearshore',text:String(line).slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=CORE().validate(candidate);saved=io?.save?.(checked);}catch(e){return fail('Nearshore save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Nearshore save refused. Nothing was changed.');
 if(sim.state!==state||sim.room!==room||JSON.stringify(sim.state)!==before)return fail('The character changed during saving. The saved candidate was not adopted.');
 sim.state.saga=checked.saga;sim.state.adventure.companion=checked.adventure.companion;sim.state.adventure.revision=checked.adventure.revision;
 sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text:line,lines};
}
// The pier, then the offer: the regent's first words once Briar is taken to the nearshore.
function arrive(sim,io){
 const s=sim.state.saga;
 if(s.briar.state==='nearshore'||s.briar.state==='returned')return{ok:true,duplicate:true,text:''};
 if(sim.room!==null||sim.worldDive)return fail('Walk out onto the lantern pier first.');
 if(s.briar.state!=='taken')return fail('Briar is not lost.');
 if(!SAGA().done(sim.state,'witness'))return fail('The witness is not finished yet.');
 if(dist(sim.state.player,PLACE)>NEAR)return fail('Walk out onto the lantern pier first.');
 const c=sim.snapshot(),res=SAGA().briarAtNearshore(simOn(c));if(!res.ok)return fail(res.error);
 const lines=[...spoken('pier',sim.state),...spoken('arrive',c)];
 return commit(sim,c,io,lines.join(' '),lines);
}
// Never bonded (BRANCHES 6): arriving at the pier plays the pier and then the plain scene, and the nearshore beat is marked.
function plain(sim,io){
 const s=sim.state.saga;
 if(sim.room!==null||sim.worldDive)return fail('Walk out onto the lantern pier first.');
 if(sim.state.adventure.companion?.bonded===true)return fail('Briar is yours to bring home.');
 if(!SAGA().done(sim.state,'witness'))return fail('The witness is not finished yet.');
 if(s.beats&&Object.prototype.hasOwnProperty.call(s.beats,'nearshore'))return{ok:true,duplicate:true,text:''};
 if(dist(sim.state.player,PLACE)>NEAR)return fail('Walk out onto the lantern pier first.');
 // the pier path is for a save where Briar was never taken; a taken Briar is answered at the nearshore instead.
 if(s.briar.state!=='with'||s.briar.takenDay!==null)return fail('Briar was taken. Answer the foxes at the nearshore.');
 const c=sim.snapshot(),res=SAGA().mark(simOn(c),'nearshore');if(!res.ok)return fail(res.error);
 const lines=[...spoken('pier',sim.state),...spoken('plain',c)];
 return commit(sim,c,io,lines.join(' '),lines);
}
// A player who never took Briar home meets the same offer with nobody to compare it to, and says no.
const REFUSE=Object.freeze(['You came all this way alone. Take this one. She will never stray from you.','The fox at his feet is perfect, and it is not looking at anything.','You walk past it. Nothing that cannot leave you is a companion.']);
function refusable(sim){const s=sim?.state;return !!s&&sim.room===null&&!sim.worldDive&&s.adventure?.companion?.bonded!==true&&s.saga?.briar?.state==='with'&&!Object.hasOwn(s.saga.beats,'nearshore')&&Object.hasOwn(s.saga.beats,'night')&&SAGA().done(s,'witness');}
function refuse(sim,io){
 if(Object.hasOwn(sim.state.saga.beats,'nearshore'))return{ok:true,duplicate:true,text:''};
 if(!refusable(sim))return fail('Nobody is waiting on the pier for you.');
 if(dist(sim.state.player,PLACE)>REACH+1)return fail('Walk out onto the lantern pier first.');
 const c=sim.snapshot(),res=SAGA().refuseCompanion(simOn(c));if(!res.ok)return fail(res.error);
 return commit(sim,c,io,REFUSE.join(' '),REFUSE);
}
// Answering the real fox: no prompt; her habit is in the lines.
function choose(sim,payload,io){
 const fox=payload.fox;if(fox!=='real'&&fox!=='false')return fail('Choose one of the two foxes.');
 const v=view(sim);if(!v)return fail('Nobody is waiting on the pier.');
 if(foxAt(sim)!==fox)return fail('Walk up to the fox you mean, then answer it.');
 if(fox==='false'){const sc=sceneOf('heel',sim.state);return{ok:true,heel:true,prompt:sc?.choice?.prompt||'',options:sc?.choice?.options||[],lines:spoken('heel',sim.state),text:spoken('heel',sim.state).join(' ')};}
 const c=sim.snapshot();if(c.adventure.companion?.bonded!==true)return fail('Briar is not yours to call.');
 const res=SAGA().briarReturned(simOn(c));if(!res.ok)return fail(res.error);
 c.adventure.companion.mode='follow';
 const lines=spoken('real',c);
 const out=commit(sim,c,io,lines.join(' '),lines);
 if(out.ok){runtimes.delete(sim);G.RealmAdventure?.syncScene?.(sim);}
 return out;
}
// The heel prompt's answer. Only take saves anything: briar-false (BRANCHES 2.2) and the faultless fox leaves.
function heelAnswer(sim,payload,io){
 if(typeof payload.take!=='boolean')return fail('Answer the fox at your heel.');
 if(!active(sim))return fail('Nobody is waiting on the pier.');
 if(payload.take!==true)return{ok:true,text:'',lines:[]};
 if(hasFalse(sim.state))return{ok:true,duplicate:true,text:''};
 const c=sim.snapshot(),res=SAGA().command(simOn(c),'nearshore-briar-false','briar-false',{});if(!res.ok)return fail(res.error);
 const lines=spoken('false',c);
 return commit(sim,c,io,lines.join(' '),lines);
}
function home(sim,io){
 const s=sim.state.saga;
 if(s.briar.state!=='returned')return fail('Briar is not with you yet.');
 if(s.briar.homeDay!==null)return{ok:true,duplicate:true,text:''};
 const c=sim.snapshot(),res=SAGA().briarHome(simOn(c));if(!res.ok)return fail(res.error);
 const lines=spoken('home',c);
 return commit(sim,c,io,lines.join(' '),lines);
}
// ctx: { sim, active }. payload carries the revision and the active owner the caller read.
// Every successful nearshore result carries its story cards: the script's lines for the state the command read.
function command(ctx,type,payload,io){
 const st=ctx?.sim?.state,cs=st?cardsFor(type,payload,st):null,out=dispatch(ctx,type,payload,io);
 if(out.ok&&cs&&cs.length&&!out.duplicate)out.cards=cs;
 return out;
}
function cardsFor(type,payload,state){
 const c=step=>(SCRIPT()?.forStep?.('nearshore',step,state)?.lines||[]).map(l=>({speaker:l.speaker,text:l.text}));
 if(type==='arrive')return[...c('pier'),...c('arrive')];
 if(type==='plain')return[...c('pier'),...c('plain')];
 if(type==='choose')return payload?.fox==='real'?c('real'):[];
 if(type==='heel-answer')return payload?.take===true?c('false'):[];
 if(type==='home')return c('home');
 if(type==='refuse')return REFUSE.map((text,i)=>({speaker:i===0?'The Regent of Ash':'',text}));
 return [];
}
function dispatch(ctx,type,payload,io){
 const sim=ctx?.sim;
 if(!sim||!(sim instanceof CORE().Simulation)||!payload||typeof payload!=='object'||Array.isArray(payload))return fail('Reach the nearshore while able to act.');
 if(typeof ctx.active!=='string'||!ctx.active||payload.expectedActive!==ctx.active||!Number.isSafeInteger(payload.expectedRevision)||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or place changed. Read the current place again.');
 if(type==='arrive')return arrive(sim,io);
 if(type==='plain')return plain(sim,io);
 if(type==='refuse')return refuse(sim,io);
 if(type==='choose')return choose(sim,payload,io);
 if(type==='heel-answer')return heelAnswer(sim,payload,io);
 if(type==='home')return home(sim,io);
 return fail('Unknown nearshore action.');
}
const api=Object.freeze({PLACE,REAL_START,WAIT,WALK,HEEL,REACH,NEAR,active,view,foxAt,habitSpot,refusable,hidesBriar:active,spoken,command});
G.RealmNearshore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
