/* ET07: a local judged exhibition, with no equipment or economy payout.
 * Durable candidates use the existing character writer. Live bout/attack proof
 * stays scoped to this Simulation, character, scene and equipped weapon. */
(function(G){'use strict';
const M=G.RealmRainTournamentModel||(typeof require==='function'?require('./earth-tournament-model.js'):null);
const sessions=new WeakMap(),fail=error=>({ok:false,error}),copy=o=>JSON.parse(JSON.stringify(o));
const definition=Object.freeze({...M.definition,giver:Object.freeze({id:'rain-ring-steward',name:'Rain tournament steward',room:M.definition.room,x:5,z:-27.6})});
const fresh=M.fresh;
function validate(raw,a){const q=M.validate(raw);if(!a?.started&&q.issued)throw Error('Invalid rain tournament: entry without the expedition kit');return q;}
function eligible(state){return state?.adventure?.started===true;}
function at(sim){const p=definition.giver,E=G.RealmEarth;return sim?.room===p.room&&!sim.worldDive&&E?.walkable(sim.state.player.x,sim.state.player.z)
 &&Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<=2.4&&E.segment(sim.state.player,p,.035);}
function live(sim){const b=sessions.get(sim);if(!b)return null;
 const a=sim.state.adventure;
 if(sim.state!==b.state||a!==b.adventure||sim.room!==definition.room||sim.worldDive||a.hp<=0||a.equipment.weapon!==b.weapon
   ||a.earthTournament!==b.record||a.earthTournament.issued!==b.run||a.earthTournament.closed>=b.run
   ||JSON.stringify(a.earthTournament)!==b.recordBytes||b.current()!==true){sessions.delete(sim);return null;}
 return b;
}
function view(sim){const b=live(sim);return b?{...M.snapshot(b.bout),active:true,weapon:b.weapon,error:b.error||null}:null;}
function fighting(sim){const b=live(sim);if(!b)return false;const v=M.snapshot(b.bout);return !v.complete&&!v.withdrawn;}
function signature(sim){const b=live(sim);return b&&fighting(sim)?'rain:'+b.run+':'+b.weapon:'';}
function enemies(sim){const b=live(sim);return b&&fighting(sim)?[b.enemy]:[];}
function owned(sim,e){const b=live(sim);return !!b&&fighting(sim)&&!!e&&e.rainTournament===true&&e.id===b.enemy.id
 &&e.tournamentLease===b.lease&&G.RealmAdventure.runtime(sim).enemies.includes(e);}
function allowed(sim,type){if(!fighting(sim))return true;
 return ['attack','guard','dodge','target-select','target-cycle','target-clear','auto-toggle','companion-mode','rename','equip'].includes(type);
}
function stamp(sim,kind){const b=live(sim);if(!b||!fighting(sim))return null;const r=M.attack(b.bout,{owner:b.owner,family:G.RealmArsenal.weapon(sim.state.adventure).style,kind});return r.ok?r.token:null;}
function contact(sim,e,token){const b=live(sim);if(!b||!owned(sim,e))return false;const result=M.hit(b.bout,token,b.owner);
 if(result.foul){b.error=result.error;G.RealmAdventure.notify(sim,'Early reply · this exchange’s reply point is forfeited.');}
 if(!result.ok)return false;
 b.error=null;e.flash=sim.state.adventure.elapsed+.16;G.RealmAdventure.fx(sim,'hit',e.x,e.z,0xd9d6a5);
 G.RealmAdventure.notify(sim,'Clean reply · +1 tournament point.');return true;
}
function refreshEnemy(sim,b){const v=M.snapshot(b.bout),e=G.RealmAdventure.runtime(sim).enemies.find(e=>e.rainTournament&&e.tournamentLease===b.lease);if(!e)return;
 e.mode=v.phase==='tell'?'windup':v.phase==='opening'?'recover':'idle';e.timer=v.remaining;e.aim=v.aim;
 e.yaw=v.aim?Math.atan2(v.aim.x-e.x,v.aim.z-e.z):e.yaw;
 e.windup=M.definition.rounds[Math.min(v.index,2)].tell;e.recovery=M.definition.rounds[Math.min(v.index,2)].opening;
}
function tick(sim,dt){const b=live(sim);if(!b||sim.paused||!fighting(sim))return;
 const a=sim.state.adventure,r=G.RealmAdventure.runtime(sim),t=G.RealmCombat.runtime(sim);
 const result=M.advance(b.bout,dt,{player:sim.state.player,paused:sim.paused,guarded:a.elapsed<t.guardUntil,evading:a.elapsed<r.invincible&&a.elapsed<r.cooldowns.dodge});
 if(!result.ok){b.error=result.error;return;}
 refreshEnemy(sim,b);
 for(const e of result.events){
  if(e.type==='strike')G.RealmAdventure.notify(sim,e.defense?'Sound defense · +1 tournament point.':'Practice contact · no health lost. Watch the next ribbon or Brace.');
  if(e.type==='complete'){G.RealmCombat.stop(sim,true);G.RealmAdventure.notify(sim,'Exhibition complete · '+e.score+'/6. Review and record your result with the steward.');}
  if(e.type==='withdrawn'){G.RealmCombat.stop(sim,true);G.RealmAdventure.notify(sim,'You stepped outside the ring. Withdraw this attempt to enter again; recorded results remain.');}
 }
}
function saveCandidate(ctx,q,text,io){const sim=ctx.sim,state=sim.state,a=state.adventure,room=sim.room,active=ctx.active,before=JSON.stringify(state);
 if(typeof io?.save!=='function')return fail('A durable character writer is required. Nothing changed.');
 if(a.revision>=1e9||state.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before extending its record.');
 let checked,result;
 try{
  const candidate=sim.snapshot();candidate.adventure.earthTournament=q;candidate.adventure.revision++;
  candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'earth-tournament',text:text.slice(0,350)});
  if(candidate.journal.length>200)candidate.journal.shift();checked=G.RealmCore.validate(candidate);
  if(JSON.stringify(checked.adventure.earthTournament)!==JSON.stringify(M.validate(q)))return fail('The validator did not retain the checked tournament record.');
  const bytes=JSON.stringify(checked);result=io.save(checked);
  if(JSON.stringify(checked)!==bytes)return fail('The writer changed the checked result. Nothing was adopted.');
 }catch(error){return fail('Tournament save refused: '+error.message);}
 if(!result?.ok||result.adopted===false||typeof result.then==='function')return fail(result?.error||'The tournament record was not saved.');
 if(ctx.current()!==true||ctx.active!==active||sim.state!==state||state.adventure!==a||sim.room!==room||JSON.stringify(state)!==before)return fail('The character changed while saving. Read its current record before continuing.');
 a.earthTournament=checked.adventure.earthTournament;a.revision=checked.adventure.revision;state.journal=checked.journal;state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
function command(ctx,type,payload={},io){const sim=ctx?.sim,C=G.RealmCore;
 if(!C||!(sim instanceof C.Simulation)||!payload||typeof payload!=='object'||Array.isArray(payload)||payload.quest!==definition.id)return fail('Read this exact tournament before acting.');
 if(typeof ctx.active!=='string'||!ctx.active||payload.expectedActive!==ctx.active||payload.expectedRevision!==sim.state.adventure.revision||typeof ctx.current!=='function'||ctx.current()!==true)return fail('The character or tournament changed. Read the current terms again.');
 let q;try{q=validate(sim.state.adventure.earthTournament,sim.state.adventure);}catch(error){return fail(error.message);}
 if(type==='withdraw'){
  const result=M.closeOutstanding(q);if(!result.ok)return result;
  if(result.duplicate)return{ok:true,duplicate:true,text:'There is no outstanding attempt.'};
  const saved=saveCandidate(ctx,result.record,'Tournament attempt withdrawn. Recorded results and all ordinary progression remain.',io);
  if(saved.ok){const b=sessions.get(sim);if(b)M.withdraw(b.bout);sessions.delete(sim);G.RealmCombat.stop(sim,true);}return saved;
 }
 if(!eligible(sim.state)||sim.state.adventure.hp<=0||sim.paused||!at(sim))return fail('Take the expedition kit and meet the steward at the north-common ring while able to act.');
 if(type==='enter'){
  if(live(sim))return fail('Finish or withdraw this current bout first.');
  const weapon=sim.state.adventure.equipment.weapon,gear=G.RealmAdventure.GEAR[weapon],family=G.RealmArsenal.weapon(sim.state.adventure).style;
  if(!gear||gear.slot!=='weapon'||!sim.state.adventure.owned.includes(weapon)||payload.family!==family)return fail('Declare the family of the weapon you have deliberately equipped.');
  const owner=Object.freeze({}),opened=M.begin(q,{owner,family,player:sim.state.player});if(!opened.ok)return opened;
  const saved=saveCandidate(ctx,opened.record,'Entered the rain exhibition with '+gear.name+'. Three declared exchanges; no equipment or currency is at stake.',io);if(!saved.ok)return saved;
  const record=sim.state.adventure.earthTournament,lease=Object.freeze({}),a=definition.arena;
  sessions.set(sim,{owner,bout:opened.bout,run:record.issued,record,recordBytes:JSON.stringify(record),weapon,state:sim.state,adventure:sim.state.adventure,current:ctx.current,lease,error:null,
   enemy:{id:'rain-exhibition-'+record.issued,name:'Rain exhibition post',kind:'sentinel',custom:'rain-tournament',eventEnemy:true,rainTournament:true,tournamentLease:lease,x:a.x,z:a.z,radius:.48,hp:1,damage:0,xp:0,ore:0,coins:0}});
  sim.playerPath=[];G.RealmCombat.stop(sim,true);return saved;
 }
 if(type==='record'){
  const b=live(sim);if(!b)return fail('No live completed bout belongs to this character. Withdraw an interrupted attempt without losing earlier results.');
  const result=M.settle(q,b.bout,b.owner);if(!result.ok)return result;
  if(result.duplicate)return{ok:true,duplicate:true,text:'This run’s result is already recorded.'};
  const text='Rain exhibition recorded · '+result.score+'/6 · '+(result.newMedals.length?result.newMedals.map(id=>M.definition.medals.find(m=>m.id===id).name).join(', '):'personal result retained')+'. No gear, XP or currency changed.';
  const saved=saveCandidate(ctx,result.record,text,io);if(saved.ok)sessions.delete(sim);return saved;
 }
 return fail('Unknown tournament action.');
}
const api={definition,fresh,validate,eligible,at,view,fighting,signature,enemies,owned,allowed,stamp,contact,tick,command};
G.RealmEarthTournament=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
