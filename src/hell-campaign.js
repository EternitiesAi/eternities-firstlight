/* One finite local Hell campaign. Art and dialogue cannot grant its history. */
(function(G){'use strict';
const DATA=G.RealmHellCampaignData||(typeof require==='function'?require('./hell-campaign-data.js'):null);
const D=DATA.definition,fail=error=>({ok:false,error}),copy=o=>JSON.parse(JSON.stringify(o));
const fresh=()=>({version:1,accepted:false,steps:[],choice:null,claimed:false});
const required=()=>D.steps.filter(s=>!s.optional).map(s=>s.id);
function validate(raw){
 if(raw===undefined)return fresh();const no=s=>{throw Error('Invalid Hell campaign: '+s);};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.accepted!=='boolean'||typeof raw.claimed!=='boolean')no('version or record');
 if(!Array.isArray(raw.steps)||new Set(raw.steps).size!==raw.steps.length||raw.steps.some(id=>!D.steps.some(s=>s.id===id)))no('steps');
 if(raw.steps.some(id=>!D.steps.find(s=>s.id===id).requires.every(p=>raw.steps.includes(p))))no('prerequisites');
 if(raw.choice!==null&&!D.choices.some(c=>c.id===raw.choice))no('disposition');
 if(raw.steps.includes('disposition')!==(raw.choice!==null))no('choice history');
 if(!raw.accepted&&(raw.steps.length||raw.choice!==null||raw.claimed))no('unaccepted history');
 if(raw.claimed&&!required().every(id=>raw.steps.includes(id)))no('unearned claim');
 return{version:1,accepted:raw.accepted,steps:D.steps.filter(s=>raw.steps.includes(s.id)).map(s=>s.id),choice:raw.choice,claimed:raw.claimed};
}
function eligible(state){return state.adventure.started&&state.realmTrails.records[D.prerequisite]?.claimed===true;}
function ready(state){return required().every(id=>state.hellCampaign.steps.includes(id));}
function available(state){const r=state.hellCampaign;return r.accepted&&!r.claimed?D.steps.filter(s=>!r.steps.includes(s.id)&&s.requires.every(id=>r.steps.includes(id))&&(!s.optional||!r.steps.includes('warden-resolved'))):[];}
function at(sim,p){return sim.room===D.room&&!sim.worldDive&&G.RealmTrails.at(sim,{medium:'dry',...p});}
function commit(sim,candidate,io,text){
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 candidate.adventure.revision++;
 candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'hell-campaign',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=G.RealmCore.validate(candidate);saved=io?.save?.(checked);}catch(e){return fail('Campaign save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Campaign save refused. No history, costs or reward were changed.');
 sim.state.hellCampaign=checked.hellCampaign;
 for(const k of['xp','coins','ore','revision'])sim.state.adventure[k]=checked.adventure[k];
 Object.assign(sim.state.sandbox.inventory,checked.sandbox.inventory);sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
function command(ctx,type,payload,io){
 const sim=ctx?.sim,r=sim?.state.hellCampaign;
 if(!sim||payload?.quest!==D.id||sim.room!==D.room||sim.worldDive||sim.state.adventure.hp<=0)return fail('Reach the Hell campaign on dry ground while able to act.');
 if(type==='claim'&&r.claimed)return{ok:true,duplicate:true,text:'This local campaign was already paid once. Its disposition remains in history.'};
 if(type==='accept'&&r.accepted)return{ok:true,duplicate:true,text:'This campaign is already accepted; its saved progress is retained.'};
 if(payload.expectedActive!==ctx.active||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or campaign changed. Read the current terms again.');
 const candidate=sim.snapshot(),q=candidate.hellCampaign;let text,reward=null;
 if(type==='accept'){
  if(!eligible(candidate)||!at(sim,D.giver))return fail('Claim the separate Open Cage rescue, then speak to Istra to accept this continuation.');
  q.accepted=true;text=D.title+' accepted. Neris’s rescue and the unconditional road home remain separate.';
 }else if(type==='step'){
  const s=D.steps.find(s=>s.id===payload.step);
  if(!q.accepted||q.claimed||!s||s.kind!=='interact')return fail('Only unfinished accepted physical work can be recorded.');
  if(q.steps.includes(s.id))return{ok:true,duplicate:true,text:'This action is already recorded for this campaign.'};
  if(!available(candidate).some(p=>p.id===s.id)||!at(sim,s))return fail('Reach '+s.name+' and complete its stated preparations.');
  q.steps.push(s.id);text=s.text;
 }else if(type==='choose'){
  const s=D.steps.find(s=>s.id==='disposition'),choice=D.choices.find(c=>c.id===payload.choice);
  if(q.choice!==null)return q.choice===payload.choice?{ok:true,duplicate:true,text:'That disposition is already recorded.'}:fail('The local disposition is a lasting deed. It cannot be overwritten by reopening this panel.');
  if(!choice||!available(candidate).some(p=>p.id===s.id)||!at(sim,s))return fail('Resolve the Warden and stabilize the service engine before deliberately choosing its disposition.');
  q.choice=choice.id;q.steps.push(s.id);text=choice.name+' recorded. '+choice.consequence;
 }else if(type==='claim'){
  if(!q.accepted||!ready(candidate)||!at(sim,D.giver))return fail('Verify the completed local route, then return to Istra for its whole declared fee.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=D.reward;
  if(a.coins+fee.coins>9999||a.ore+fee.ore>9999||Object.entries(fee.materials).some(([k,n])=>!Object.hasOwn(inv,k)||inv[k]+n>G.RealmSandbox.MAX))return fail('Make room for the whole fee. Completed work and the chosen disposition remain unpaid; nothing was changed.');
  reward={...copy(fee),xp:Math.min(fee.xp,9999-a.xp)};a.xp+=reward.xp;a.coins+=fee.coins;a.ore+=fee.ore;for(const[k,n]of Object.entries(fee.materials))inv[k]+=n;
  q.claimed=true;text=D.title+' complete · '+D.choices.find(c=>c.id===q.choice).name+' · '+reward.xp+' XP, '+fee.coins+' sunmarks, '+fee.ore+' ore, '+fee.materials.wood+' timber and '+fee.materials.fiber+' fibre. Claimed once.'+(reward.xp<fee.xp?' Existing stored XP cap retained.':'');
 }else return fail('Unknown Hell campaign action.');
 const before=G.RealmAdventure.level(sim.state.adventure),result=commit(sim,candidate,io,text);
 if(result.ok){if(reward)result.reward=reward;G.RealmAdventure.syncScene(sim);if(G.RealmAdventure.level(sim.state.adventure)>before)G.RealmAdventure.notify(sim,'Level '+G.RealmAdventure.level(sim.state.adventure)+' · the local road is secured.');}return result;
}
function enemies(sim){const r=sim.state.hellCampaign;return sim.room===D.room&&!sim.worldDive&&r?.accepted&&D.enemy.spawnAfter.every(id=>r.steps.includes(id))&&!r.steps.includes(D.enemy.defeatStep)?[{...D.enemy,hellCampaign:D.id,xp:0,coins:0,ore:0,windup:1.35,recovery:2.2,telegraphRadius:0}]:[];}
const signature=sim=>enemies(sim).map(e=>e.id).join('|');
function encounter(e){return e?.hellCampaign===D.id&&e.id===D.enemy.id;}
function pattern(e){if(!encounter(e))return null;const cycle=e.campaignCycle||0,kind=e.hp<e.maxHP/2?['line','line','sweep'][cycle%3]:['sweep','line'][cycle%2];return{kind,...DATA.patterns[kind]};}
function lock(sim,e){
 const p=pattern(e);if(!p)return false;const yaw=Math.atan2(sim.state.player.x-e.x,sim.state.player.z-e.z),r=sim.state.hellCampaign;
 e.campaignCycle=(e.campaignCycle||0)+1;e.yaw=yaw;e.windup=p.windup;e.recovery=p.recovery+(r.steps.includes(p.support)?.6:0);
 e.strike=Object.freeze({x:e.x,z:e.z,yaw,kind:p.kind,length:p.length,halfWidth:p.halfWidth});return true;
}
function strikeContains(e,p){const s=e?.strike;if(!encounter(e)||!s||![s.x,s.z,s.yaw,s.length,s.halfWidth,p?.x,p?.z].every(Number.isFinite))return false;const dx=p.x-s.x,dz=p.z-s.z,forward=dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw),side=dx*Math.cos(s.yaw)-dz*Math.sin(s.yaw);return forward>=-.24&&forward<=s.length+.24&&Math.abs(side)<=s.halfWidth+.24;}
function canDamage(sim,e){return encounter(e)&&sim.room===D.room&&enemies(sim).some(p=>p.id===e.id)&&G.RealmAdventure.runtime(sim).enemies.includes(e)&&e.mode==='recover'&&e.timer>0;}
function defeat(sim,e){
 if(!encounter(e)||e.hp!==0||sim.room!==D.room||!G.RealmAdventure.runtime(sim).enemies.includes(e))return false;
 const r=sim.state.hellCampaign;if(r.steps.includes(D.enemy.defeatStep))return true;
 if(!r.accepted||!D.enemy.spawnAfter.every(id=>r.steps.includes(id)))return false;
 const candidate=sim.snapshot();candidate.hellCampaign.steps.push(D.enemy.defeatStep);
 const result=commit(sim,candidate,{save:sim.hellCampaignSave},'Veyr’s local Writ authority was resolved through actual combat. His death and the larger infernal country are not declared.');
 if(!result.ok){e.hp=1;G.RealmAdventure.notify(sim,result.error);return false;}return true;
}
const api={definition:D,fresh,validate,eligible,available,ready,at,command,enemies,signature,encounter,pattern,lock,strikeContains,canDamage,defeat};G.RealmHellCampaign=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
