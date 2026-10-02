/* Bounded once-only realm stories. Presentation never manufactures accepted facts. */
(function(G){'use strict';
const clone=o=>JSON.parse(JSON.stringify(o)),actors=new WeakMap(),dials=new WeakMap(),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const fail=error=>({ok:false,error});
function definitions(){const north=G.RealmTrailsNorth||(typeof require==='function'?require('./realm-trails-north.js'):null),south=G.RealmTrailsSouth||(typeof require==='function'?require('./realm-trails-south.js'):null),cosmos=G.RealmTrailsCosmos||(typeof require==='function'?require('./realm-trails-cosmos.js'):null);return[...north.definitions,...south.definitions,...cosmos.definitions];}
const definition=id=>definitions().find(d=>d.id===id)||null;
const record=()=>({accepted:false,steps:[],settings:{},checkpoint:0,escortMode:'follow',assisted:false,claimed:false});
function fresh(){return{version:1,records:Object.fromEntries(definitions().map(d=>[d.id,record()]))};}
function required(d){return d.steps.filter(s=>!s.optional).map(s=>s.id);}
function validate(raw){
 if(raw===undefined)return fresh();const no=why=>{throw Error('Invalid realm trails: '+why);};
 if(!raw||raw.version!==1||!raw.records||typeof raw.records!=='object'||Array.isArray(raw.records)||Object.keys(raw.records).some(id=>!definition(id)))no('version or records');
 const out=fresh();for(const d of definitions()){
  const r=raw.records[d.id];if(!r||typeof r!=='object')no(d.id);
  for(const k of['accepted','claimed','assisted'])if(typeof r[k]!=='boolean')no(k);
  if(!Array.isArray(r.steps)||new Set(r.steps).size!==r.steps.length||r.steps.some(id=>!d.steps.some(s=>s.id===id)))no('steps');
  if(r.steps.some(id=>d.steps.find(s=>s.id===id).requires.some(p=>!r.steps.includes(p))))no('prerequisites');
  if(!['follow','wait'].includes(r.escortMode)||!Number.isSafeInteger(r.checkpoint)||r.checkpoint<0||r.checkpoint>=(d.escort?.route.length||1))no('escort checkpoint');
  if(!r.accepted&&(r.steps.length||r.claimed||r.checkpoint||r.assisted))no('unaccepted history');
  if(d.escort){if(r.checkpoint>0&&!r.steps.includes(d.escort.startStep)||r.assisted&&!r.steps.includes(d.escort.arrivalStep)||r.steps.includes(d.escort.arrivalStep)!==(r.checkpoint===d.escort.route.length-1))no('arrival history');}
  else if(r.checkpoint||r.assisted||r.escortMode!=='follow')no('foreign escort');
  const settings=r.settings===undefined?{}:r.settings;if(!settings||typeof settings!=='object'||Array.isArray(settings))no('instrument settings');
  for(const[id,value]of Object.entries(settings)){const instrument=d.steps.find(s=>s.id===id)?.instrument;if(!instrument||!r.steps.includes(id)||!Number.isFinite(value)||value<instrument.min||value>instrument.max||Math.abs(value-instrument.target)>instrument.tolerance)no('unearned calibration');}
  if(d.steps.some(s=>s.instrument&&r.steps.includes(s.id)&&!Object.hasOwn(settings,s.id)))no('missing calibration');
  if(r.claimed&&!required(d).every(id=>r.steps.includes(id)))no('unearned claim');
  out.records[d.id]={accepted:r.accepted,steps:d.steps.filter(s=>r.steps.includes(s.id)).map(s=>s.id),settings:{...settings},checkpoint:r.checkpoint,escortMode:r.escortMode,assisted:r.assisted,claimed:r.claimed};
 }return out;
}
function at(sim,p,radius=2.8){
 if(!p||![sim.state.player.x,sim.state.player.z,p.x,p.z,radius].every(Number.isFinite)||radius<0||radius>10||dist(sim.state.player,p)>radius)return false;const W=G.RealmWorldFoundations;
 if(p.medium==='water'||p.medium==='court'){
  if(!sim.worldDive||![W.playerHeight(sim),p.y].every(Number.isFinite)||Math.abs(W.playerHeight(sim)-p.y)>.38||!W.definition(sim.room)?.dive||!W.swimClear(W.definition(sim.room).dive,sim.state.player.x,W.playerHeight(sim),sim.state.player.z))return false;
  const body=W.medium(sim,[sim.state.player.x,W.playerHeight(sim)+.85,sim.state.player.z]);
  return p.medium==='water'?body==='water':body==='air';
 }
 return !sim.worldDive&&W.walkable(sim.room,sim.state.player.x,sim.state.player.z);
}
function commit(sim,candidate,io,text){
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this world before continuing: record limit reached.');
 candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'realm-trail',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=G.RealmCore.validate(candidate);saved=io.save(checked);}catch(e){return fail('Trail save refused: '+e.message);}if(!saved?.ok)return fail(saved?.error||'Trail save refused. Nothing was paid or spent.');
 sim.state.realmTrails=checked.realmTrails;Object.assign(sim.state.adventure,checked.adventure);Object.assign(sim.state.sandbox,checked.sandbox);sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
function setting(sim,quest,step){const d=definition(quest),s=d?.steps.find(s=>s.id===step);return sim.state.realmTrails.records[quest]?.settings?.[step]??dials.get(sim)?.[quest+':'+step]??s?.instrument?.initial;}
function adjust(ctx,quest,step,value){
 const sim=ctx.sim,d=definition(quest),s=d?.steps.find(s=>s.id===step),r=d&&sim.state.realmTrails.records[d.id],instrument=s?.instrument;
 if(!instrument||!r?.accepted||r.steps.includes(step)||G.RealmWorldFoundations.definition(sim.room)?.id!==d.realm||sim.state.adventure.hp<=0||!at(sim,s)||!s.requires.every(id=>r.steps.includes(id)))return fail('Reach the accepted sight frame before turning its scale.');
 if(!Number.isFinite(value)||value<instrument.min||value>instrument.max)return fail('Keep this comparator within its declared scale.');
 const values=dials.get(sim)||{};values[quest+':'+step]=value;dials.set(sim,values);return{ok:true,setting:value,offset:value-instrument.target,aligned:Math.abs(value-instrument.target)<=instrument.tolerance};
}
function command(ctx,type,payload,io){
 const sim=ctx.sim,d=definition(payload?.quest),W=G.RealmWorldFoundations;
 if(!d||W.definition(sim.room)?.id!==d.realm||sim.state.adventure.hp<=0)return fail('Reach this trail’s realm while able to act.');
 if(!sim.state.adventure.started)return fail('Collect Oren’s initial expedition kit before taking this trail.');
 const candidate=sim.snapshot(),r=candidate.realmTrails.records[d.id],beforeLevel=G.RealmAdventure.level(sim.state.adventure);let text,paidReward=null;
 if(type==='accept'){
  if(!at(sim,{...d.giver,medium:'dry'}))return fail('Speak to '+d.giver.name+' to accept this work.');
  if(r.accepted)return{ok:true,duplicate:true,text:'This trail is already accepted. Its progress is retained.'};
  r.accepted=true;text=d.title+' accepted. Read the route, danger and fixed reward.';
 }else if(type==='step'){
  const s=d.steps.find(s=>s.id===payload.step);if(!r.accepted||!s||s.kind!=='interact')return fail('Only an accepted physical interaction can be recorded here.');
  if(r.steps.includes(s.id))return{ok:true,duplicate:true,text:'This accepted action is already recorded.'};
  if(!at(sim,s)||!s.requires.every(id=>r.steps.includes(id)))return fail('Reach '+s.name+' and finish its stated preparations.');
  if(s.correctChoice&&payload.choice!==s.correctChoice)return fail('That chart does not match the measured depth. Compare the two gauges; no materials were spent.');
  if(s.instrument){const value=payload.setting;if(!Number.isFinite(value)||value<s.instrument.min||value>s.instrument.max||Math.abs(value-s.instrument.target)>s.instrument.tolerance||value!==setting(sim,d.id,s.id))return fail('The split scale is not aligned yet. Turn the physical comparator and check its visible offset before recording.');r.settings[s.id]=value;}
  r.steps.push(s.id);text=s.text;
 }else if(type==='claim'){
  if(r.claimed)return{ok:true,duplicate:true,text:'This trail has already been paid once.'};
  if(!r.accepted||!required(d).every(id=>r.steps.includes(id))||!at(sim,{...d.giver,medium:'dry'}))return fail('Complete the accepted trail and return to '+d.giver.name+'.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,reward=d.reward;
  if(a.coins+reward.coins>9999||a.ore+reward.ore>9999||Object.entries(reward.materials||{}).some(([k,n])=>!Object.hasOwn(inv,k)||inv[k]+n>G.RealmSandbox.MAX))return fail('Make room for the complete declared reward. Your finished trail remains ready; nothing was changed.');
  const creditedXP=Math.min(9999-a.xp,reward.xp);a.coins+=reward.coins;a.ore+=reward.ore;a.xp+=creditedXP;for(const[k,n]of Object.entries(reward.materials||{}))inv[k]+=n;
  paidReward={...reward,xp:creditedXP};r.claimed=true;text=d.title+' complete · +'+creditedXP+' XP · +'+reward.coins+' sunmarks'+(reward.ore?' · +'+reward.ore+' ore':'')+Object.entries(reward.materials||{}).map(([k,n])=>' · +'+n+' '+k).join('')+'. '+(creditedXP<reward.xp?'Stored XP remains at its existing 9999 cap. ':'')+'The declared fee is claimed once.';
 }else if(type==='escort-wait'||type==='escort-follow'||type==='assist'){
  if(!d.escort||!r.steps.includes(d.escort.startStep)||r.steps.includes(d.escort.arrivalStep))return fail('There is no active escort on this trail.');
  const actor=escort(sim);if(!actor||dist(sim.state.player,actor)>3)return fail('Reach Neris at her current safe checkpoint before changing the plan.');
  if(type==='assist'){r.checkpoint=d.escort.route.length-1;r.steps.push(d.escort.arrivalStep);r.assisted=true;text='You request an assisted extraction over the stabilized route. Neris is safely at the refuge; this was not a walked escort.';}
  else{r.escortMode=type==='escort-wait'?'wait':'follow';text=r.escortMode==='wait'?'Neris waits here. Speak to her to resume.':'Neris resumes the safe route. Stay within ten paces.';}
 }else return fail('Unknown trail action.');
 const result=commit(sim,candidate,io,text);if(result.ok){if(paidReward){result.reward=paidReward;const afterLevel=G.RealmAdventure.level(sim.state.adventure);if(afterLevel>beforeLevel)G.RealmAdventure.notify(sim,'Level '+afterLevel+' · useful work beyond the valley.');}if(type==='assist')actors.delete(sim);G.RealmAdventure.syncScene(sim);}return result;
}
function enemies(sim){
 if(sim.worldDive)return[];const realm=G.RealmWorldFoundations.definition(sim.room)?.id;
 return definitions().filter(d=>d.realm===realm&&d.enemy).flatMap(d=>{const r=sim.state.realmTrails.records[d.id],e=d.enemy;if(!r.accepted||r.steps.includes(e.defeatStep)||!e.spawnAfter.every(id=>r.steps.includes(id)))return[];
  return[{...e,trailQuest:d.id,xp:0,coins:0,ore:0,windup:1.35,recovery:1.8+(e.openingBonusStep&&r.steps.includes(e.openingBonusStep)?.8:0)}];});
}
function signature(sim){return enemies(sim).map(e=>e.id).join('|');}
function canDamage(sim,e){return !e.trailQuest||definition(e.trailQuest)?.realm!=='heaven'||e.mode==='recover'&&e.timer>0;}
function defeat(sim,e){
 const d=definition(e?.trailQuest),r=d&&sim.state.realmTrails.records[d.id];
 if(!d||!r.accepted||e.hp!==0||!G.RealmAdventure.runtime(sim).enemies.includes(e)||d.enemy.id!==e.id||G.RealmWorldFoundations.definition(sim.room)?.id!==d.realm)return false;
 if(r.steps.includes(d.enemy.defeatStep))return true;
 const candidate=sim.snapshot();candidate.realmTrails.records[d.id].steps.push(d.enemy.defeatStep);
 const result=commit(sim,candidate,{save:sim.realmTrailSave||(()=>({ok:false,error:"A durable trail saver is required; no checkpoint was recorded."}))},e.name+' disabled through its actual combat opening.');
 if(!result.ok){e.hp=1;G.RealmAdventure.notify(sim,result.error);return false;}return true;
}
function escort(sim){
 const d=definitions().find(d=>d.escort&&G.RealmWorldFoundations.definition(sim.room)?.id===d.realm),r=d&&sim.state.realmTrails.records[d.id];if(!r?.steps.includes(d.escort.startStep))return null;
 if(r.steps.includes(d.escort.arrivalStep))return{...d.escort.route.at(-1),yaw:0,walking:false,status:r.assisted?'Arrived by assisted extraction':'Safe at the refuge',quest:d.id};
 let a=actors.get(sim);if(!a||a.quest!==d.id||a.checkpoint!==r.checkpoint){a={...d.escort.route[r.checkpoint],quest:d.id,checkpoint:r.checkpoint,yaw:0,path:[],walking:false,status:'Stay near Neris',retry:0};actors.set(sim,a);}return a;
}
function tick(sim,dt){
 if(sim.paused||sim.state.adventure.hp<=0)return;const a=escort(sim);if(!a)return;
 const d=definition(a.quest),r=sim.state.realmTrails.records[d.id];if(r.steps.includes(d.escort.arrivalStep))return;
 const next=d.escort.route[r.checkpoint+1];if(!next)return;
 a.walking=false;if(r.escortMode==='wait'){a.status='Waiting · speak to resume';return;}if(dist(a,sim.state.player)>d.escort.waitDistance){a.status='Waiting for you · return to Neris';return;}
 a.status='Following the stabilized route';
 if(dist(a,next)>.3){if(!a.path.length)a.path=G.RealmCore.pathfind(a,next,sim.navRoom)||[];if(a.path.length){a.walking=sim.advance(a,a.path,dt,d.escort.speed);}else a.status='Route blocked · speak for assisted extraction';return;}
 if(sim.state.adventure.elapsed<a.retry)return;a.retry=sim.state.adventure.elapsed+1;
 const candidate=sim.snapshot(),q=candidate.realmTrails.records[d.id];q.checkpoint++;if(q.checkpoint===d.escort.route.length-1)q.steps.push(d.escort.arrivalStep);
 const result=commit(sim,candidate,{save:sim.realmTrailSave||(()=>({ok:false,error:"A durable trail saver is required; no checkpoint was recorded."}))},q.steps.includes(d.escort.arrivalStep)?'Neris reached the Kiln Refuge on the walked route.':'Neris reached a safe route checkpoint.');
 if(result.ok)actors.delete(sim);else a.status='Checkpoint save refused · retrying safely';
}
const api={definitions,definition,required,fresh,validate,at,commit,setting,adjust,command,enemies,signature,canDamage,defeat,escort,tick};G.RealmTrails=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
