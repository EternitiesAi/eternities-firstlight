/* Shared Roads of Light: bounded offline realm visits and explicitly accepted work. */
(function(G){'use strict';
const IDS=Object.freeze(['heaven','hell','earthlands','atlantis','cosmos']),OBJECTIVES=Object.freeze(['first','second','third']),GATE=Object.freeze({x:18,z:6});
const clone=o=>JSON.parse(JSON.stringify(o)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),finite=Number.isFinite,tickets=new WeakMap();
const fail=error=>({ok:false,error}),yes=text=>({ok:true,text}),inside=(x,z,p,r=0)=>Math.abs(x-p.x)<=p.w/2-r&&Math.abs(z-p.z)<=p.d/2-r;
function data(name,file){return G[name]||(typeof require==='function'?require('./'+file):null);}
let catalogueCache=null;
function definitions(){
 if(catalogueCache)return catalogueCache;
 const north=data('RealmWorldHeavenHell','world-heaven-hell.js'),south=data('RealmWorldAtlantisEarth','world-atlantis-earth.js'),n=data('RealmCosmos','cosmos.js');
 const cosmos={id:'cosmos',room:n.ROOM,name:'The Near Expanse',description:'Warm lamps and useful field work under an extraordinary sky.',kicker:'COSMOS · THE ROADS BETWEEN STARS',entry:n.ENTRY,bounds:{minX:-20,maxX:20,minZ:-55,maxZ:23},patches:n.PATCHES,solids:n.SOLIDS,points:n.POINTS.map(p=>({...p,text:p.id==='lamps'?'Teren keeps three lamps ready: one for the road out, one for shelter, one for the way home.':'Record the bearing without deciding what the whole sky means.'})),quest:{id:'cosmos-opening-v1',title:'Three Bearings Under the Lamps',giverId:'lamps',objectives:[{id:'first',pointId:'rootcut',text:'Record the sheltered lane bearing',kind:'interact'},{id:'second',pointId:'rise',text:'Compare the open-road horizon',kind:'interact'},{id:'third',pointId:'anik',text:'Bring both bearings to the observatory',kind:'interact'}],reward:{xp:15,coins:6,ore:1},completionText:'A small route chart now belongs to the Three Lamps station.'},enemies:[],palette:{ground:0x78856b,stone:0x898777,trim:0xb99b60,sky:0x242a44},water:false,existing:true};
 return catalogueCache=Object.freeze([...north.realms,...south.realms,cosmos]);
}
function definition(id){return definitions().find(d=>d.id===id||d.room===id)||null;}
function handles(room){return typeof room==='string'&&room.startsWith('world-')&&['world-heaven','world-hell','world-earthlands','world-atlantis'].includes(room);}
function freshRecord(){return{counter:0,lastClaim:0,firstClaimed:false,active:null,defeated:[]};}
function fresh(){return{version:1,realms:Object.fromEntries(IDS.map(id=>[id,freshRecord()]))};}
function validate(raw){
 if(raw===undefined)return fresh();const no=why=>{throw Error('Invalid world journeys: '+why);};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1)no('unsupported version');
 if(!raw.realms||typeof raw.realms!=='object'||Array.isArray(raw.realms)||Object.keys(raw.realms).some(k=>!IDS.includes(k)))no('realm records');
 const out=fresh();
 for(const id of IDS){const r=raw.realms[id];if(!r||typeof r!=='object'||Array.isArray(r))no(id);
  for(const k of['counter','lastClaim'])if(!Number.isSafeInteger(r[k])||r[k]<0||r[k]>1e6)no(k);
  if(r.lastClaim>r.counter||typeof r.firstClaimed!=='boolean'||r.firstClaimed!==(r.lastClaim>0))no('claim history');
  const q={counter:r.counter,lastClaim:r.lastClaim,firstClaimed:r.firstClaimed,active:null,defeated:[]};
  if(r.active!==null){const a=r.active;if(!a||typeof a!=='object'||Array.isArray(a)||a.run!==r.counter||a.run!==r.lastClaim+1||!['opening','survey'].includes(a.kind)||a.kind!==(r.firstClaimed?'survey':'opening'))no('active run');
   if(!Array.isArray(a.observed)||a.observed.length>3||new Set(a.observed).size!==a.observed.length||a.observed.some(x=>!OBJECTIVES.includes(x)))no('objectives');
   q.active={run:a.run,kind:a.kind,observed:OBJECTIVES.filter(x=>a.observed.includes(x))};
  }else if(r.counter!==r.lastClaim)no('missing active run');
  if(!Array.isArray(r.defeated)||r.defeated.length>16||new Set(r.defeated).size!==r.defeated.length||r.defeated.some(x=>typeof x!=='string'||!/^[-a-z0-9]{1,70}$/.test(x)))no('local defeat records');
  if(r.defeated.length){const allowed=definition(id)?.enemies||[];if(r.defeated.some(x=>!allowed.some(e=>e.id===x)))no('unknown local enemy');}
  q.defeated=r.defeated.slice();out.realms[id]=q;
 }return out;
}
function height(room,x,z){if(room===G.RealmCosmos?.ROOM)return G.RealmCosmos.height(x,z);const d=definition(room),p=d?.patches.filter(p=>inside(x,z,p)).sort((a,b)=>a.w*a.d-b.w*b.d)[0];return p?.y??1.57;}
function playerHeight(sim){return sim.worldDive?.y??height(sim.room,sim.state.player.x,sim.state.player.z);}
function land(room,x,z,r=.31){const d=definition(room);if(!d||![x,z,r].every(finite)||r<0||r>2)return false;
 return[[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]].every(([dx,dz])=>d.patches.some(p=>inside(x+dx,z+dz,p)));
}
function walkable(room,x,z,r=.31){const d=definition(room);return land(room,x,z,r)&&!d.solids.some(p=>inside(x,z,p,-r));}
function interval(a,b,p,r=0){let lo=0,hi=1;for(const[k,s]of[['x','w'],['z','d']]){const step=b[k]-a[k],min=p[k]-p[s]/2-r,max=p[k]+p[s]/2+r;
 if(Math.abs(step)<1e-10){if(a[k]<min||a[k]>max)return null;}else{const u=(min-a[k])/step,v=(max-a[k])/step;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return null;}}return[lo,hi];}
function segment(room,a,b,r=.31){const d=definition(room);if(!d||!a||!b||!finite(dist(a,b))||dist(a,b)>600||!walkable(room,a.x,a.z,r)||!walkable(room,b.x,b.z,r))return false;
 if(d.solids.some(p=>interval(a,b,p,r)))return false;
 for(const[dx,dz]of[[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]]){
  const ranges=d.patches.map(p=>interval({x:a.x+dx,z:a.z+dz},{x:b.x+dx,z:b.z+dz},p)).filter(Boolean).sort((a,b)=>a[0]-b[0]);let end=0;
  for(const[lo,hi]of ranges){if(lo>end+1e-8)return false;end=Math.max(end,hi);}if(end<1-1e-8)return false;
 }return true;
}
function near(sim,p,r=2.8){return !!p&&dist(sim.state.player,p)<=r;}
function atRoad(sim){if(sim.worldDive)return false;if(!sim.room)return near(sim,GATE);const d=definition(sim.room);return !!d&&d.points.some(p=>p.kind==='return'&&near(sim,p,4));}
function preview(ctx,id){const d=definition(id),sim=ctx.sim;if(!d||!atRoad(sim)||sim.state.adventure.hp<=0)return fail('Reach a Road of Light marker before travelling.');
 const ticket=Object.freeze({destination:d.room});tickets.set(ticket,{id:d.id,sim,active:ctx.active,revision:ctx.revision,room:sim.room,position:{...sim.state.player},used:false});return{ok:true,ticket};}
function cancel(ticket){const t=tickets.get(ticket);if(t)t.used=true;}
function enter(ticket,ctx,io){const t=tickets.get(ticket),sim=ctx.sim;
 if(!t||t.used||t.sim!==sim||t.active!==ctx.active||t.revision!==ctx.revision||t.room!==sim.room||dist(t.position,sim.state.player)>.01||!atRoad(sim)||sim.state.adventure.hp<=0)return fail('The traveller or road changed. Read the invitation again.');
 t.used=true;const d=definition(t.id);if(io.available===false)return fail('The realm scene is unavailable. Your home checkpoint is safe.');
 let saved;try{saved=io.save(sim.snapshot());}catch(e){return fail('Checkpoint save refused: '+e.message);}if(!saved?.ok)return fail(saved?.error||'Save the home checkpoint before travelling.');
 const prior={room:sim.room,returnPos:sim.returnPos,player:{...sim.state.player},path:sim.playerPath,runtime:sim.adventureRuntime,trip:sim.worldTrip};
 try{if(prior.runtime)sim.adventureRuntime=clone(prior.runtime);const home=sim.returnPos?{...sim.returnPos}:{...t.position};sim.returnPos=home;sim.room=d.room;sim.state.player={...d.entry};sim.playerPath=[];sim.worldTrip={active:t.active,realm:d.id,home};delete sim.worldDive;
  io.build();G.RealmAdventure.syncScene(sim);G.RealmCombat.stop(sim,true);return yes(d.name+' · a clear road home remains.');
 }catch(e){sim.room=prior.room;sim.returnPos=prior.returnPos;sim.state.player=prior.player;sim.playerPath=prior.path;sim.adventureRuntime=prior.runtime;sim.worldTrip=prior.trip;
  try{io.restore?.();}catch{return fail('Scene construction failed. Reopen the saved home checkpoint.');}return fail('Scene construction failed; the previous road is restored. '+e.message);}
}
function leave(sim){if(!sim.worldTrip&&!handles(sim.room))return fail('You are already outside this expedition.');const r=sim.leave();delete sim.worldTrip;delete sim.worldDive;G.RealmAdventure.syncScene(sim);G.RealmCombat.stop(sim,true);return r;}
function rewards(def,record){return record.firstClaimed?{xp:5,coins:2,ore:0}:def.quest.reward;}
function command(ctx,type,payload,io){const sim=ctx.sim,d=definition(payload?.realm);if(!d||sim.room!==d.room||sim.state.adventure.hp<=0||sim.worldDive)return fail('Return to this realm’s dry worksite to take that action.');
 if(!sim.state.adventure.started)return fail('Collect the initial expedition kit at home before accepting field work. No chapter completion is needed.');
 const journeys=clone(sim.state.journeys),r=journeys.realms[d.id],giver=d.points.find(p=>p.id===d.quest.giverId);let result;
 if(type==='accept'){
  if(!near(sim,giver))return fail('Speak to the local work giver first.');if(r.active)return fail('Finish the current accepted outing before starting another.');if(r.counter>=1e6)return fail('Local outing limit reached. Export this world.');
  r.counter++;r.active={run:r.counter,kind:r.firstClaimed?'survey':'opening',observed:[]};result=yes(r.firstClaimed?'Repeat survey accepted · new run '+r.counter+'.':d.quest.title+' accepted.');
 }else if(type==='observe'){
  if(!r.active||payload.run!==r.active.run)return fail('That accepted run has changed.');const o=d.quest.objectives.find(o=>o.id===payload.objective),p=d.points.find(p=>p.id===o?.pointId);
  if(!o||o.kind!=='interact'||!near(sim,p))return fail('Reach the named objective before recording it.');if(r.active.observed.includes(o.id))return{ok:true,duplicate:true,text:'This objective is already recorded.'};
  r.active.observed.push(o.id);result=yes(o.text+' · recorded for this run.');
 }else if(type==='claim'){
  if(Number.isSafeInteger(payload.run)&&payload.run>0&&payload.run<=r.lastClaim)return{ok:true,duplicate:true,text:'That outing has already been paid.'};
  if(!near(sim,giver)||!r.active||payload.run!==r.active.run||!OBJECTIVES.every(id=>r.active.observed.includes(id)))return fail('Complete all three accepted objectives and return to the giver.');
  const reward=rewards(d,r),a=sim.state.adventure;
  if(a.coins+reward.coins>9999||a.ore+reward.ore>9999)return fail('Reward capacity is full. Your completed outing remains ready; spend or craft before returning.');
  r.lastClaim=r.active.run;r.firstClaimed=true;r.active=null;result={...yes(d.quest.completionText),reward};
 }else return fail('Unknown realm work action.');
 const candidate=sim.snapshot();candidate.journeys=validate(journeys);if(result.reward){candidate.adventure.coins+=result.reward.coins;candidate.adventure.ore+=result.reward.ore;candidate.adventure.xp=Math.min(9999,candidate.adventure.xp+result.reward.xp);}
 if(candidate.adventure.revision>=1e9)return fail('Adventure revision limit reached. Export this world.');candidate.adventure.revision++;
 if(candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Journal sequence limit reached. Export this world.');
 candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'realm-work',text:result.text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let saved;try{saved=io.save(candidate);}catch(e){return fail('Local work save refused: '+e.message);}if(!saved?.ok)return fail(saved?.error||'Local work was not saved; nothing was paid or spent.');
 sim.state.journeys=candidate.journeys;sim.state.journal=candidate.journal;sim.state.nextEvent=candidate.nextEvent;for(const k of['coins','ore','xp','revision'])sim.state.adventure[k]=candidate.adventure[k];return result;
}
function enemies(sim){const d=definition(sim.room);if(!d||!handles(sim.room)||sim.worldDive||!sim.state.adventure.started)return[];const dead=sim.state.journeys.realms[d.id].defeated;return(d.enemies||[]).filter(e=>!dead.includes(e.id)).map(e=>({...e,worldRealm:d.id}));}
function defeat(sim,e){const d=definition(e.worldRealm);if(!d||sim.room!==d.room||e.hp!==0||!G.RealmAdventure.runtime(sim).enemies.includes(e)||!d.enemies?.some(v=>v.id===e.id))return false;const r=sim.state.journeys.realms[d.id];if(!r.defeated.includes(e.id)){r.defeated.push(e.id);sim.state.adventure.revision=Math.min(1e9,sim.state.adventure.revision+1);sim.event('realm-work',e.name+' driven away. No legacy loot or reward was replayed.');}return true;}
function recover(sim){if(!handles(sim.room)||sim.worldDive||walkable(sim.room,sim.state.player.x,sim.state.player.z))return false;sim.state.player={...definition(sim.room).entry};sim.playerPath=[];G.RealmCombat.stop(sim,true);return true;}
function pick(room,start,ray,max=550){const d=definition(room);if(!d||![...start,...ray,max].every(finite))return null;for(let t=.1;t<=Math.min(max,550);t+=.16){const x=start[0]+ray[0]*t,y=start[1]+ray[1]*t,z=start[2]+ray[2]*t,h=height(room,x,z);
 if(d.solids.some(p=>inside(x,z,p)&&y>=height(room,p.x,p.z)-.15&&y<=height(room,p.x,p.z)+p.h))return null;
 if(land(room,x,z,0)&&y<=h&&y>=h-.5)return walkable(room,x,z)?{x,z}:null;}return null;}
function diveDefinition(sim){return definition(sim.room)?.dive;}
function dryAt(d,x,y,z){return(d.dryCourts||[]).find(p=>inside(x,z,p,.31)&&y>=p.minY-.01&&y+1.7<=p.maxY+.01);}
function swimClear(d,x,y,z){if(![x,y,z].every(finite)||!inside(x,z,d.volume,.31)||y<d.minY||y>d.maxY)return false;
 return !(d.solids||[]).some(p=>inside(x,z,p,-.31)&&y+1.7>p.y&&y<p.y+p.h);}
function diveEnter(sim){const d=diveDefinition(sim),def=definition(sim.room),p=def?.points.find(p=>p.id===d?.entryId);
 if(!d||sim.worldDive||sim.paused||!walkable(sim.room,sim.state.player.x,sim.state.player.z)||!near(sim,p)||sim.state.adventure.hp<=0)return fail('Reach the marked tide steps and resume time to enter the gallery.');
 if(!swimClear(d,d.entry.x,d.entry.y,d.entry.z))return fail('The gallery entry is blocked. Remain on the quay.');
 const surface={...sim.state.player};sim.worldDive={surface,y:d.entry.y,hold:true};sim.state.player={x:d.entry.x,z:d.entry.z,yaw:d.entry.yaw};sim.playerPath=[];G.RealmCombat.stop(sim,true);return yes('Route-limited breath envelope · F ascend / G descend · depth holds when released. Your companion waits on the quay.');}
function diveExit(sim){const d=diveDefinition(sim),def=definition(sim.room),p=def?.points.find(p=>p.id===d?.exitId);
 if(!d||!sim.worldDive||!near(sim,p,3.5)||!walkable(sim.room,d.exit.x,d.exit.z))return fail('Reach the gallery landing to return to the dry quay.');
 sim.state.player={...d.exit};sim.playerPath=[];delete sim.worldDive;G.RealmAdventure.runtime(sim).room=undefined;G.RealmAdventure.syncScene(sim);return yes('Dry landing · the free return road is open.');}
function swim(sim,dx,dz,vertical,dt){const d=diveDefinition(sim),v=sim.worldDive;if(!d||!v||sim.paused||sim.state.adventure.hp<=0||![dx,dz,vertical,dt].every(finite))return false;
 const p=sim.state.player,step=Math.max(0,Math.min(dt,.1))*2.6,n=Math.hypot(dx,dz)||1,ny=Math.max(d.minY,Math.min(d.maxY,v.y+Math.max(-1,Math.min(1,vertical))*step)),x=p.x+dx/n*step,z=p.z+dz/n*step;
 if(swimClear(d,x,ny,z)){p.x=x;p.z=z;v.y=ny;}else if(swimClear(d,p.x,ny,p.z))v.y=ny;
 const court=dryAt(d,p.x,v.y,p.z);if(court)v.y=court.floorY;if(dx||dz)p.yaw=Math.atan2(dx,dz);sim.playerPath=[];return true;}
function medium(sim,point){const d=diveDefinition(sim);if(!d||!point||!inside(point[0],point[2],d.volume,0)||point[1]>=d.surfaceY)return'air';
 if((d.dryCourts||[]).some(p=>inside(point[0],point[2],p,0)&&point[1]>=p.minY&&point[1]<=p.maxY))return'air';return'water';}
function divingStatus(sim,cameraEye){return sim.worldDive?{y:sim.worldDive.y,depth:Math.max(0,diveDefinition(sim).surfaceY-sim.worldDive.y),hold:sim.worldDive.hold,body:medium(sim,[sim.state.player.x,sim.worldDive.y+.85,sim.state.player.z]),camera:medium(sim,cameraEye),dryCourt:dryAt(diveDefinition(sim),sim.state.player.x,sim.worldDive.y,sim.state.player.z)?.id||null}:null;}
const api={IDS,OBJECTIVES,GATE,definitions,definition,handles,fresh,validate,height,playerHeight,land,walkable,segment,near,atRoad,preview,cancel,enter,leave,rewards,command,enemies,defeat,recover,pick,diveEnter,diveExit,swim,swimClear,medium,divingStatus};
G.RealmWorldFoundations=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
