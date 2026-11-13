/* The finale's owner: the Regent of Ash at the spring junction. The saga owns the phases and the ending. This owner holds
 * what the saga does not: which chains are broken (saved at each break), the offer, the Regent's bodies, the freed
 * allies' clock and the camera rise. Old homecoming records still load, and their aftermath choice still feeds the
 * echo ledger. Combat progress is not saved: a reload restarts the body in its phase; broken chains stay broken. */
(function(G){'use strict';
const DATA=G.RealmEarthHomecomingData||(typeof require==='function'?require('./earth-homecoming-data.js'):null),D=DATA.definition,P=DATA.patterns,B=DATA.bands;
const FIN=()=>G.RealmFinale||(typeof require==='function'?require('./finale.js'):null);
const SG=()=>G.RealmSaga||(typeof require==='function'?require('./saga.js'):null);
const finite=Number.isFinite,fail=error=>({ok:false,error}),yes=text=>({ok:true,text});
const CHAIN_R=.6,REGENT_R=.65,CHAIN_ID=/^chain-[a-z-]{1,40}$/,MAX_BROKEN=16;
const locks=new WeakMap();
const isSim=sim=>!!G.RealmCore&&sim instanceof G.RealmCore.Simulation;
const phaseOf=st=>st?.saga?.finale?.phase??0;
const finaleOf=st=>st?.earthHomecoming?.finale||{broken:[],offer:null};
const broken=st=>finaleOf(st).broken,offerOf=st=>finaleOf(st).offer;
const live=sim=>!!sim&&sim.room===null&&!sim.worldDive&&!!sim.state&&phaseOf(sim.state)>=1&&phaseOf(sim.state)<=3&&!sim.state.saga.finale.won&&!sim.state.saga.credits;
const contactReach=p=>Math.min(p.reach,(p.kind==='annulus'?p.outerRadius:p.length)+.24);
const near=(sim,r)=>Math.hypot(sim.state.player.x-D.spring.x,sim.state.player.z-D.spring.z)<=r;
const planFor=sim=>FIN().plan(SG().echoLedger(sim.state));

function fresh(){return{version:1,accepted:false,steps:[],choice:null,claimed:false};}
function finaleRecord(raw){
 const no=()=>{throw Error('Invalid Earth homecoming: finale');};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join('|')!=='broken|offer')no();
 if(!Array.isArray(raw.broken)||raw.broken.length>MAX_BROKEN||new Set(raw.broken).size!==raw.broken.length||raw.broken.some(id=>typeof id!=='string'||!CHAIN_ID.test(id)))no();
 if(raw.offer!==null&&!['refused','taken'].includes(raw.offer))no();
 return{broken:raw.broken.slice(),offer:raw.offer};
}
// the record keeps the retired homecoming's keys for old saves; the finale adds one optional key, present only once it runs.
function validate(raw){
 if(raw===undefined)return fresh();const no=why=>{throw Error('Invalid Earth homecoming: '+why);};
 const keys=raw&&typeof raw==='object'&&!Array.isArray(raw)?Object.keys(raw).sort().join('|'):'';
 if(!['accepted|choice|claimed|steps|version','accepted|choice|claimed|finale|steps|version'].includes(keys)||raw.version!==1||typeof raw.accepted!=='boolean'||typeof raw.claimed!=='boolean')no('version or record');
 if(!Array.isArray(raw.steps)||raw.steps.length>DATA.legacySteps.length||new Set(raw.steps).size!==raw.steps.length||raw.steps.some(id=>!DATA.legacySteps.includes(id)))no('steps');
 if(raw.choice!==null&&!DATA.legacyChoices.includes(raw.choice))no('aftermath');
 if(raw.steps.includes('aftermath')!==(raw.choice!==null))no('choice history');
 if(!raw.accepted&&(raw.steps.length||raw.choice!==null||raw.claimed))no('unaccepted history');
 const out={version:1,accepted:raw.accepted,steps:raw.steps.slice(),choice:raw.choice,claimed:raw.claimed};
 if(keys.includes('finale')){try{out.finale=finaleRecord(raw.finale);}catch{no('finale');}}
 return out;
}
function validateWorld(raw){return G.RealmCore.validate(raw);}
function snapshot(sim){if(!isSim(sim))throw Error('Earth homecoming needs an actual simulation');return sim.snapshot();}

// one transaction. the saga moves on the live state, the record moves on a checked candidate, and a refused save puts
// the saga back, so the story and the record never disagree.
function persist(sim,io,ctx,text,saga,change){
 const st=sim.state,prior=JSON.stringify(st.saga);
 if(saga){const moved=saga();if(!moved?.ok){st.saga=JSON.parse(prior);return fail(moved?.error||'The story did not move.');}}
 let candidate;try{candidate=snapshot(sim);change(candidate.earthHomecoming);}catch(e){st.saga=JSON.parse(prior);return fail('Finale state refused: '+e.message);}
 const result=commit(sim,candidate,io,text,ctx);if(!result.ok)st.saga=JSON.parse(prior);return result;
}
function commit(sim,candidate,io,text,ctx){
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 const state=sim.state,room=sim.room,active=ctx?.active,before=JSON.stringify(state);
 candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'earth-homecoming',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=validateWorld(candidate);const encoded=JSON.stringify(checked);saved=io?.save?.(checked);if(JSON.stringify(checked)!==encoded)return fail('The writer changed the checked account; nothing was adopted.');}catch(e){return fail('Finale save refused: '+e.message);}
 if(!saved?.ok||typeof saved.then==='function')return fail(saved?.error||'The character could not be saved. Your progress is unchanged.');
 if(sim.state!==state||sim.room!==room||JSON.stringify(state)!==before||(ctx&&ctx.active!==active))return fail('The character changed during saving. Reopen the current account before continuing.');
 state.earthHomecoming=checked.earthHomecoming;for(const k of['xp','coins','ore','revision'])state.adventure[k]=checked.adventure[k];
 Object.assign(state.sandbox.inventory,checked.sandbox.inventory);state.journal=checked.journal;state.nextEvent=checked.nextEvent;return yes(text);
}
function runtime(sim){let r=sim.earthHomecomingRuntime;if(!r||r.state!==sim.state){r=sim.earthHomecomingRuntime={state:sim.state,t0:null,walk:{phase:0,i:0,pause:0},announced:[],arrived:[],ranNoted:false,rise:null,credits:false,creditsDone:false,chainHP:{},still:{x:null,z:null,t:0}};}return r;}

// the Regent's bodies and the chains as the adventure fights them. a body is the boss table's phase, not a shared hp pool.
// a chain's hp lives in the owner's runtime, so a rebuilt enemy list (a new chain appearing) never heals one already cut.
function chainEntity(c,r){const hp=Number.isFinite(r?.chainHP?.[c.id])?Math.max(1,Math.min(c.hp,r.chainHP[c.id])):c.hp;return{id:c.id,chainId:c.id,name:'Chain · '+c.site.label,kind:'sentinel',x:c.site.x,z:c.site.z,hp,maxHP:c.hp,damage:0,radius:CHAIN_R,anchored:true,earthHomecoming:D.id,finaleRole:'chain',xp:0,coins:0,ore:0};}
function regentEntity(ph){const body=FIN().phases()[ph-1];return{id:'regent-of-ash-'+ph,name:D.title,kind:'sentinel',x:D.spring.x,z:D.spring.z,hp:body.hp,maxHP:body.hp,damage:body.damage,radius:REGENT_R,anchored:true,earthHomecoming:D.id,finaleRole:'regent',finalePhase:ph,xp:0,coins:0,ore:0};}
function enemies(sim){
 if(!live(sim)||!isSim(sim))return[];
 const st=sim.state,ph=phaseOf(st),r=runtime(sim),now=st.adventure.elapsed;
 if(r.t0===null)r.t0=now;
 const chains=ph===1?planFor(sim).chains.filter(c=>!broken(st).includes(c.id)&&now-r.t0>=c.appearAt).map(c=>chainEntity(c,r)):[];
 return[...chains,regentEntity(ph)];
}
const signature=sim=>enemies(sim).map(e=>e.id).join('|');
const encounter=e=>!!e&&e.earthHomecoming===D.id&&(e.finaleRole==='regent'||e.finaleRole==='chain');
function member(sim,e){return isSim(sim)&&live(sim)&&G.RealmAdventure.runtime(sim).enemies.includes(e);}
// the body that is up in its phase. phase 3 waits for the offer: no strikes and no hits until a choice is made.
function bodyLive(sim,e){const st=sim.state,ph=phaseOf(st);return e.finaleRole==='regent'&&e.finalePhase===ph&&(ph!==3||offerOf(st)!==null);}
function canStrike(sim,e){return encounter(e)&&e.finaleRole==='regent'&&!sim?.paused&&sim?.state?.adventure?.hp>0&&e.hp>0&&member(sim,e)&&bodyLive(sim,e);}
function canDamage(sim,e){
 if(!encounter(e)||sim?.paused||!(sim?.state?.adventure?.hp>0)||!(e.hp>0)||!member(sim,e))return false;
 if(e.finaleRole==='chain')return phaseOf(sim.state)===1&&!broken(sim.state).includes(e.chainId);
 return bodyLive(sim,e)&&phaseOf(sim.state)>=2;
}
function owned(sim,e,alive=true){return alive?canDamage(sim,e):(encounter(e)&&e.hp===0&&member(sim,e)&&(e.finaleRole==='chain'||bodyLive(sim,e)));}

// the strike is the same shape the adventure already reads: a line or a ring, locked while idle and fixed once locked.
function pattern(e,sim){
 if(e?.finaleRole!=='regent')return null;const share=e.maxHP>0?e.hp/e.maxHP:0,bands=B[e.finalePhase],band=bands.find(b=>share>b.above)||bands.at(-1),cycle=Number.isSafeInteger(e.homecomingCycle)&&e.homecomingCycle>=0?e.homecomingCycle:0;
 let id=band.order[cycle%band.order.length],p=P[id];const distance=sim?Math.hypot(sim.state.player.x-e.x,sim.state.player.z-e.z):0;
 const still=sim?.earthHomecomingRuntime?.state===sim?.state?sim.earthHomecomingRuntime.still.t:0;
 // one sidestep does not answer him: a ring is followed by a fast line, and standing still near him earns the stamp.
 if(e.followUp)id='ash-follow';else if(e.finalePhase>=2&&still>=FIN().timing().stillSeconds&&distance<=contactReach(P['ash-stamp']))id='ash-stamp';p=P[id];
 // out of reach, he answers with the long line only where his band uses it; the chained body keeps to his near reach.
 if(distance>contactReach(p)&&distance<=contactReach(P['false-shelter'])&&band.order.includes('false-shelter')){id='false-shelter';p=P[id];}
 return{...p,id,phase:band.id};
}
function lock(sim,e){
 if(!canStrike(sim,e)||!['idle','alert'].includes(e.mode)||![sim.state.player.x,sim.state.player.z].every(finite))return false;
 const p=pattern(e,sim),distance=Math.hypot(sim.state.player.x-e.x,sim.state.player.z-e.z);
 if(distance>contactReach(p)||!G.RealmCore.segment(e,sim.state.player,sim.navRoom))return false;
 const yaw=Math.atan2(sim.state.player.x-e.x,sim.state.player.z-e.z),frame={kind:p.kind,x:e.x,z:e.z,yaw,pattern:p.id,phase:p.phase};
 if(p.kind==='line'){frame.halfWidth=p.halfWidth;frame.length=p.length;}else{frame.innerRadius=p.innerRadius;frame.outerRadius=p.outerRadius;}
 if(!Number.isFinite(e.baseDamage))e.baseDamage=e.damage;e.damage=Math.round(e.baseDamage*(p.share??1));
 e.yaw=yaw;e.windup=p.windup;e.recovery=p.recovery;e.followUp=p.id==='closing-ring';if(p.id==='ash-follow'||p.id==='ash-stamp');else e.homecomingCycle=(Number.isSafeInteger(e.homecomingCycle)?e.homecomingCycle:0)+1;e.strike=Object.freeze(frame);locks.set(e,{sim,state:sim.state,frame:e.strike});return e.strike;
}
// an answered offer of invulnerability is a gift: the Regent still strikes, and nothing lands.
function strikeContains(e,p){
 const entry=locks.get(e),s=e?.strike;if(!entry||entry.frame!==s||entry.state!==entry.sim.state||!canStrike(entry.sim,e)||![p?.x,p?.z].every(finite))return false;
 if(offerOf(entry.sim.state)==='taken')return false;
 // a strike is a warning only while it winds up; once it has landed the shape is spent and recovery is open ground.
 if(e.mode!=='windup')return false;
 const dx=p.x-s.x,dz=p.z-s.z,margin=.24,distance=Math.hypot(dx,dz);
 if(s.kind==='annulus')return distance>=Math.max(0,s.innerRadius-margin)&&distance<=s.outerRadius+margin;
 if(s.kind==='line'){const forward=dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw),side=dx*Math.cos(s.yaw)-dz*Math.sin(s.yaw);return s.length>0&&Math.hypot(Math.max(0,Math.abs(side)-s.halfWidth),Math.max(0,-forward,forward-s.length))<=margin;}
 return false;
}

function begin(sim,io){return persist(sim,io,null,FIN().text('begin'),()=>SG().finalePhase(sim,1),rec=>{rec.finale={broken:[],offer:null};});}
function breakChain(sim,io,id,text,ctx){
 const st=sim.state;if(!live(sim)||phaseOf(st)!==1||broken(st).includes(id)||!planFor(sim).chains.some(c=>c.id===id))return fail('That chain is already broken.');
 const rest=planFor(sim).chains.every(c=>c.id===id||broken(st).includes(c.id));
 return persist(sim,io,ctx,text,rest?()=>SG().finalePhase(sim,2):null,rec=>{rec.finale.broken=[...rec.finale.broken,id];});
}
function chooseOffer(sim,io,ctx,choice){
 if(phaseOf(sim.state)!==3||offerOf(sim.state)!==null)return fail(FIN().text('noOffer'));
 return persist(sim,io,ctx,FIN().text(choice==='take'?'taken':'refused'),null,rec=>{rec.finale.offer=choice==='take'?'taken':'refused';});
}
function finish(sim,io){const result=persist(sim,io,null,FIN().text('won'),()=>SG().finaleWon(sim),()=>{});if(result.ok)runtime(sim).rise={t:0};return result;}

function defeat(sim,e){
 if(!encounter(e)||!owned(sim,e,false))return false;
 const io={save:sim.earthHomecomingSave};
 if(e.finaleRole==='chain')return breakChain(sim,io,e.chainId,FIN().text('playerBreak'),null).ok;
 const ph=phaseOf(sim.state);
 if(ph===2){const result=persist(sim,io,null,FIN().text('down'),()=>SG().finalePhase(sim,3),rec=>{rec.finale.offer=null;});if(result.ok)runtime(sim).walk={phase:3,i:0,pause:0};return result.ok;}
 if(ph===3)return finish(sim,io).ok;
 return false;
}

// the allies' clock: chain announcements and arrivals happen once per run of the phase.
function scheduleChains(sim,r,io){
 const st=sim.state,A=G.RealmAdventure,p=planFor(sim),now=st.adventure.elapsed;
 if(r.t0===null)r.t0=now;const el=now-r.t0;
 for(const c of p.chains)if(!r.announced.includes(c.id)&&el>=c.appearAt){r.announced.push(c.id);if(!broken(st).includes(c.id))A.notify(sim,FIN().text('chainPrefix')+c.line);}
 for(const a of p.allies)if(!r.arrived.includes(a.id)&&el>=a.arriveAt){r.arrived.push(a.id);A.notify(sim,a.ally+FIN().text('allyArrivePrefix')+a.line);}
}
// an arrived ally works at their chain: allyDps a second off its hp. the chain breaks in their name only if it falls to them.
function allyWork(sim,r,io,dt){
 const st=sim.state,A=G.RealmAdventure,t=FIN().timing(),list=A.runtime(sim).enemies;
 for(const a of planFor(sim).allies){if(!a.breaks||!r.arrived.includes(a.id)||broken(st).includes(a.breaks))continue;
  const e=list.find(x=>x.chainId===a.breaks&&x.finaleRole==='chain');if(!e||!(e.hp>0))continue;
  e.hp=Math.max(0,e.hp-t.allyDps*dt);r.chainHP[e.chainId]=e.hp;
  if(e.hp===0&&breakChain(sim,io,a.breaks,a.ally+FIN().text('allyBreakSuffix'),null).ok)return;}
 for(const e of list)if(e.finaleRole==='chain'&&e.hp>0)r.chainHP[e.chainId]=e.hp;
}
// the second body runs the merged valley on the route and stops at each turn; near you, it turns and pursues. the third
// body only pursues. both strike when the adventure locks a shape.
function walkRegent(sim,r,dt){
 const A=G.RealmAdventure,ph=phaseOf(sim.state),e=A.runtime(sim).enemies.find(x=>x.finaleRole==='regent'&&x.finalePhase===ph&&ph>=2);
 if(!e||!(e.hp>0)||e.mode!=='idle'||!bodyLive(sim,e))return;
 const w=r.walk,t=FIN().timing(),route=FIN().route(),p=sim.state.player,away=Math.hypot(p.x-e.x,p.z-e.z);
 // pursuit: inside the chase distance (always, for the third body) he closes on you instead of keeping to his road.
 if((ph===3||away<=t.chase)&&away>1.9){const s=Math.min(away-1.9,t.chaseSpeed*dt),nx=e.x+(p.x-e.x)/away*s,nz=e.z+(p.z-e.z)/away*s;if(G.RealmCore.walkable(nx,nz,sim.navRoom,REGENT_R)){e.x=nx;e.z=nz;}return;}
 if(ph===3)return;
 if(w.pause>0){w.pause-=dt;return;}
 const goal=route[w.i%route.length],dx=goal.x-e.x,dz=goal.z-e.z,d=Math.hypot(dx,dz);
 if(d<.25){w.i++;w.pause=t.pause;return;}
 const step=Math.min(d,t.speed*dt),nx=e.x+dx/d*step,nz=e.z+dz/d*step;
 if(!G.RealmCore.walkable(nx,nz,sim.navRoom,REGENT_R)){w.i++;return;}
 e.x=nx;e.z=nz;
}

function tick(sim,dt){
 if(!isSim(sim)||!(dt>0)||!sim.state.adventure?.started||sim.paused||sim.room!==null||sim.worldDive)return;
 const st=sim.state,r=runtime(sim),ph=phaseOf(st),io={save:sim.earthHomecomingSave},A=G.RealmAdventure,t=FIN().timing();
 if(ph===0){if(!st.saga.credits&&st.adventure.hp>0&&near(sim,t.startRange)&&SG().allowed(st,'finale')&&begin(sim,io).ok)A.notify(sim,FIN().text('begin'));return;}
 if(r.walk.phase!==ph)r.walk={phase:ph,i:0,pause:0};
 const p=st.player,s=r.still;if(s.x===null||Math.hypot(p.x-s.x,p.z-s.z)>.5){s.x=p.x;s.z=p.z;s.t=0;}else s.t+=dt;
 if(ph===1){scheduleChains(sim,r,io);if(phaseOf(st)===1)allyWork(sim,r,io,dt);}
 if(phaseOf(st)===2&&!r.ranNoted){r.ranNoted=true;A.notify(sim,FIN().text('runs'));}
 if(ph>=2)walkRegent(sim,r,dt);
 if(st.saga.finale.won&&!st.saga.credits){if(!r.rise)r.rise={t:0};r.rise.t+=dt;if(r.rise.t>=t.riseSeconds&&!r.credits&&persist(sim,io,null,FIN().text('credits'),()=>SG().rollCredits(sim),()=>{}).ok)r.credits=true;}
}

// the one player command: the offer. it is only answered at the spring, and only once, and both answers are saved.
function command(ctx,type,payload,io){
 const sim=ctx?.sim;
 if(!isSim(sim)||!payload||typeof payload!=='object'||Array.isArray(payload)||payload.quest!==D.id||sim.room!==null||sim.worldDive||!(sim.state.adventure.hp>0))return fail('Stand at the spring junction while able to act.');
 if(typeof ctx.active!=='string'||!ctx.active||payload.expectedActive!==ctx.active||!Number.isSafeInteger(payload.expectedRevision)||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or account changed. Read the current terms again.');
 if(type!=='offer')return fail('Unknown finale action.');
 if(!near(sim,FIN().timing().offerRange))return fail('Go to the spring junction first.');
 if(!['refuse','take'].includes(payload.choice))return fail('Unknown answer.');
 return chooseOffer(sim,io||{save:sim.earthHomecomingSave},ctx,payload.choice);
}

// the camera rise for the last hit: the presentation reads this and never writes to the story.
const ease=k=>k*k*(3-2*k);
function view(sim){const r=sim?.earthHomecomingRuntime;if(!r?.rise||r.creditsDone)return null;const t=FIN().timing(),k=ease(Math.min(1,r.rise.t/t.riseSeconds));return{elevation:.28+(1.05-.28)*k,distance:7.5+(46-7.5)*k,center:[0,1,0]};}

const api={definition:D,patterns:P,bands:B,fresh,validate,validateWorld,snapshot,
 eligible:state=>!!state?.earthHomecoming?.accepted||SG().allowed(state,'finale'),
 missing:state=>SG().BEATS.filter(b=>b.act<5&&!SG().done(state,b.id)).map(b=>b.id),
 ready:state=>SG().done(state,'nearshore'),
 encounter,enemies,signature,pattern,lock,strikeContains,canStrike,canDamage,owned,defeat,command,tick,runtime,view,plan:planFor,begin};
G.RealmEarthHomecoming=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
