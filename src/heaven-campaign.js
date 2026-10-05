/* One finite public-passage campaign. Rules own combat, escort and saved deeds. */
(function(G){'use strict';
const DATA=G.RealmHeavenCampaignData||(typeof require==='function'?require('./heaven-campaign-data.js'):null);
const D=DATA.definition,fail=error=>({ok:false,error}),copy=o=>JSON.parse(JSON.stringify(o)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const fresh=()=>({version:1,accepted:false,steps:[],choice:null,claimed:false});
const required=()=>D.steps.filter(s=>!s.optional).map(s=>s.id),step=id=>D.steps.find(s=>s.id===id);
function validate(raw){
 if(raw===undefined)return fresh();const no=s=>{throw Error('Invalid Heaven campaign: '+s);};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join('|')!=='accepted|choice|claimed|steps|version'||raw.version!==1||typeof raw.accepted!=='boolean'||typeof raw.claimed!=='boolean')no('version or record');
 if(!Array.isArray(raw.steps)||new Set(raw.steps).size!==raw.steps.length||raw.steps.some(id=>typeof id!=='string'||!step(id)))no('steps');
 if(raw.steps.some(id=>!step(id).requires.every(p=>raw.steps.includes(p))))no('prerequisites');
 if(raw.choice!==null&&!D.choices.some(c=>c.id===raw.choice))no('arrangement');
 if(raw.steps.includes('arrangement')!==(raw.choice!==null))no('choice history');
 if(!raw.accepted&&(raw.steps.length||raw.choice!==null||raw.claimed))no('unaccepted history');
 if(raw.claimed&&!required().every(id=>raw.steps.includes(id)))no('unearned claim');
 return{version:1,accepted:raw.accepted,steps:D.steps.filter(s=>raw.steps.includes(s.id)).map(s=>s.id),choice:raw.choice,claimed:raw.claimed};
}
function eligible(state){return state.adventure.started&&state.realmTrails.records[D.prerequisite]?.claimed===true;}
function ready(state){return required().every(id=>state.heavenCampaign.steps.includes(id));}
function available(state){const r=state.heavenCampaign;return r.accepted&&!r.claimed?D.steps.filter(s=>!r.steps.includes(s.id)&&s.requires.every(id=>r.steps.includes(id))&&(!s.optional||!r.steps.includes('beam-disabled'))):[];}
function at(sim,p){return sim.room===D.room&&!sim.worldDive&&G.RealmTrails.at(sim,{medium:'dry',...p});}
function commit(sim,candidate,io,text){
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 candidate.adventure.revision++;
 candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'heaven-campaign',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=G.RealmCore.validate(candidate);saved=io?.save?.(checked);}catch(e){return fail('Campaign save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Campaign save refused. No history, costs or reward were changed.');
 sim.state.heavenCampaign=checked.heavenCampaign;
 for(const k of['xp','coins','ore','revision'])sim.state.adventure[k]=checked.adventure[k];
 Object.assign(sim.state.sandbox.inventory,checked.sandbox.inventory);sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
function makeEscort(arrived=false){const p=arrived?D.escort.route.at(-1):D.escort;return{id:D.escort.id,x:p.x,z:p.z,yaw:0,phase:arrived?'arrived':'idle',routeIndex:arrived?D.escort.route.length:1,distance:0,walking:false};}
function runtime(sim){
 let r=sim.heavenCampaignRuntime;if(!r)r=sim.heavenCampaignRuntime={room:sim.room,escort:null,activation:null};
 if(r.room!==sim.room){r.room=sim.room;r.escort=null;r.activation=null;}
 const q=sim.state.heavenCampaign;
 if(sim.room!==D.room||!q?.accepted){r.escort=null;r.activation=null;return r;}
 if(!r.escort)r.escort=makeEscort(q.steps.includes(D.escort.arrivalStep));
 return r;
}
function escortStatus(sim){
 const q=sim.state.heavenCampaign,r=runtime(sim),e=r.escort;
 if(!q?.accepted||sim.room!==D.room)return{phase:'inactive',text:'The courier waits only during this accepted Heaven visit.'};
 if(q.steps.includes(D.escort.arrivalStep))return{phase:'arrived',text:'The courier actually reached Calen on the complete supported service route. That saved arrival remains.'};
 if(e.phase==='following')return{phase:e.phase,text:'Walk beside the courier along the marked service loop; it follows the complete route.'};
 if(e.phase==='lagging')return{phase:e.phase,text:'The courier is waiting. Return within nine units to continue the same walk.'};
 if(e.phase==='awaiting-save')return{phase:e.phase,text:'The physical route is finished, but its arrival save was refused. Stay beside Calen and retry when saving is available.'};
 return{phase:q.steps.includes(D.escort.startStep)?'reset':'idle',text:q.steps.includes(D.escort.startStep)?'The unfinished walk reset at the waiting place. Its invitation remains. Return and deliberately invite the courier again.':'The courier waits at the service-walk witness point. Resolve the false signal and mark the route before inviting it.'};
}
function command(ctx,type,payload,io){
 const sim=ctx?.sim,r=sim?.state.heavenCampaign;
 if(!sim||payload?.quest!==D.id||sim.room!==D.room||sim.worldDive||sim.state.adventure.hp<=0)return fail('Reach the Heaven campaign on dry ground while able to act.');
 if(payload.expectedActive!==ctx.active||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or campaign changed. Read the current terms again.');
 if(type==='claim'&&r.claimed)return{ok:true,duplicate:true,text:'This local campaign was already paid once. Its welcome remains in history.'};
 if(type==='accept'&&r.accepted)return{ok:true,duplicate:true,text:'This campaign is already accepted; its saved progress is retained.'};
 if(type==='activate'){
  if(!r.accepted||!r.choice||!r.steps.includes('arrangement')||!at(sim,step('fit-arrival-assist')))return fail('Reach the chosen Garden arrival assembly before trying its ordinary activation.');
  const run=runtime(sim),now=sim.state.adventure.elapsed;if(run.activation&&now-run.activation.at<3.6)return fail('The arrival assembly is returning to rest. Try it again after recovery.');
  run.activation={choice:r.choice,at:now,active:true};return{ok:true,text:'The chosen welcome instrument answers one ordinary activation. No reward or story work was granted.'};
 }
 const candidate=sim.snapshot(),q=candidate.heavenCampaign;let text,reward=null,invite=false;
 if(type==='accept'){
  if(!eligible(candidate)||!at(sim,D.giver))return fail('Claim the separate Broken Choir repair, then speak to Rielle to accept this continuation.');
  q.accepted=true;text=D.title+' accepted. The repaired Garden answer and its prior payment remain separate.';
 }else if(type==='escort-invite'){
  const s=step(D.escort.startStep);
  if(!q.accepted||q.claimed||q.steps.includes(D.escort.arrivalStep)||!s.requires.every(id=>q.steps.includes(id))||!at(sim,s))return fail('Secure the actual service route, then return to the waiting courier to invite it deliberately.');
  const e=runtime(sim).escort;if(['following','lagging','awaiting-save'].includes(e.phase))return{ok:true,duplicate:true,text:'The same invited courier is already on this walk. Stay beside it to continue.'};
  const prior=q.steps.includes(s.id);if(!prior)q.steps.push(s.id);invite=true;text=prior?'The retained invitation started a fresh physical walk. No materials or fee were granted.':s.text;
 }else if(type==='step'){
  const s=step(payload.step);
  if(!q.accepted||q.claimed||!s||s.kind!=='interact'||s.id===D.escort.startStep)return fail('Only unfinished accepted physical work can be recorded. Combat and escort have their own actual callers.');
  if(q.steps.includes(s.id))return{ok:true,duplicate:true,text:'This action is already recorded for this campaign.'};
  if(!available(candidate).some(p=>p.id===s.id)||!at(sim,s))return fail('Reach '+s.name+' and complete its stated preparations.');
  q.steps.push(s.id);text=s.text;
 }else if(type==='choose'){
  const s=step('arrangement'),choice=D.choices.find(c=>c.id===payload.choice);
  if(q.choice!==null)return q.choice===payload.choice?{ok:true,duplicate:true,text:'That welcome arrangement is already recorded.'}:fail('The local welcome is a lasting deed. Reopening this panel cannot overwrite it.');
  if(!choice||!available(candidate).some(p=>p.id===s.id)||!at(sim,s))return fail('Welcome the actual courier and fit the arrival assembly before deliberately choosing its arrangement.');
  q.choice=choice.id;q.steps.push(s.id);text=choice.name+' recorded. '+choice.consequence;
 }else if(type==='claim'){
  if(!q.accepted||!ready(candidate)||!at(sim,D.giver))return fail('Verify the actual courier arrival and chosen welcome, then return to Rielle for the whole declared fee.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=D.reward;
  if(a.coins+fee.coins>9999||a.ore+fee.ore>9999||Object.entries(fee.materials).some(([k,n])=>!Object.hasOwn(inv,k)||inv[k]+n>G.RealmSandbox.MAX))return fail('Make room for the whole fee. Completed work and the welcome remain unpaid; nothing was changed.');
  reward={...copy(fee),xp:Math.min(fee.xp,9999-a.xp)};a.xp+=reward.xp;a.coins+=fee.coins;a.ore+=fee.ore;for(const[k,n]of Object.entries(fee.materials))inv[k]+=n;
  q.claimed=true;text=D.title+' complete · '+D.choices.find(c=>c.id===q.choice).name+' · '+reward.xp+' XP, '+fee.coins+' sunmarks, '+fee.ore+' ore, '+fee.materials.wood+' timber and '+fee.materials.fiber+' fibre. Claimed once.'+(reward.xp<fee.xp?' Existing stored XP cap retained.':'');
 }else return fail('Unknown Heaven campaign action.');
 const before=G.RealmAdventure.level(sim.state.adventure),result=commit(sim,candidate,io,text);
 if(result.ok){const run=runtime(sim);if(invite)run.escort={...makeEscort(),phase:'following'};if(reward)result.reward=reward;G.RealmAdventure.syncScene(sim);if(G.RealmAdventure.level(sim.state.adventure)>before)G.RealmAdventure.notify(sim,'Level '+G.RealmAdventure.level(sim.state.adventure)+' · a public welcome remains.');}return result;
}
function enemies(sim){const r=sim.state.heavenCampaign;return sim.room===D.room&&!sim.worldDive&&r?.accepted?D.enemies.filter(e=>e.spawnAfter.every(id=>r.steps.includes(id))&&!r.steps.includes(e.defeatStep)).map(e=>({...e,heavenCampaign:D.id,xp:0,coins:0,ore:0,windup:e.attack.windup,recovery:e.attack.recovery,telegraphRadius:0})):[];}
const signature=sim=>enemies(sim).map(e=>e.id).join('|');
function encounter(e){return e?.heavenCampaign===D.id?D.enemies.find(p=>p.id===e.id)||null:null;}
function clipPolygon(vertices,key,bound,greater){const out=[];for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],inside=p=>greater?p[key]>=bound:p[key]<=bound,ia=inside(a),ib=inside(b);if(ia)out.push(a);if(ia!==ib){const t=(bound-a[key])/(b[key]-a[key]);out.push({side:a.side+(b.side-a.side)*t,forward:a.forward+(b.forward-a.forward)*t});}}return out;}
function clippedBeam(sim,s){
 const sin=Math.sin(s.yaw),cos=Math.cos(s.yaw),world=G.RealmWorldFoundations;let length=s.length;
 for(const p of world.definition(sim.room).solids){
  let polygon=[];for(const[dx,dz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const x=p.x+dx*(p.w/2+.04)-s.x,z=p.z+dz*(p.d/2+.04)-s.z;polygon.push({side:x*cos-z*sin,forward:x*sin+z*cos});}
  polygon=clipPolygon(polygon,'side',-s.halfWidth,true);polygon=clipPolygon(polygon,'side',s.halfWidth,false);polygon=clipPolygon(polygon,'forward',0,true);
  if(polygon.length)length=Math.min(length,Math.max(0,Math.min(...polygon.map(p=>p.forward))-.01));
 }
 const point=n=>({x:s.x+sin*n,z:s.z+cos*n});if(!world.segment(sim.room,s,point(length),.04)){let lo=0,hi=length;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(world.segment(sim.room,s,point(mid),.04))lo=mid;else hi=mid;}length=lo;}
 return length;
}
function lock(sim,e){
 const terms=encounter(e);if(!terms)return false;const p=terms.attack,yaw=Math.atan2(sim.state.player.x-e.x,sim.state.player.z-e.z);
 e.yaw=yaw;e.windup=p.windup+(p.support&&sim.state.heavenCampaign.steps.includes(p.support.step)?p.support.windupBonus:0);e.recovery=p.recovery;
 const frame={x:e.x,z:e.z,yaw,kind:p.kind};if(p.kind==='beam'){frame.length=p.length;frame.halfWidth=p.halfWidth;frame.length=clippedBeam(sim,frame);}else frame.radius=p.radius;
 e.strike=Object.freeze(frame);return true;
}
function beamLength(sim,e){return encounter(e)&&e.strike?.kind==='beam'&&G.RealmAdventure.runtime(sim).enemies.includes(e)?e.strike.length:0;}
function strikeContains(e,p){
 const s=e?.strike;if(!encounter(e)||!s||![s.x,s.z,p?.x,p?.z].every(Number.isFinite))return false;
 const dx=p.x-s.x,dz=p.z-s.z;
 if(s.kind==='pulse')return Number.isFinite(s.radius)&&Math.hypot(dx,dz)<=s.radius+.24;
 if(s.kind!=='beam'||![s.yaw,s.length,s.halfWidth].every(Number.isFinite)||s.length<=0)return false;
 const forward=dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw),side=dx*Math.cos(s.yaw)-dz*Math.sin(s.yaw);return forward>=-.24&&forward<=s.length+.24&&Math.abs(side)<=s.halfWidth+.24;
}
function canDamage(sim,e){return !!encounter(e)&&e.hp>0&&sim.room===D.room&&enemies(sim).some(p=>p.id===e.id)&&G.RealmAdventure.runtime(sim).enemies.includes(e);}
function defeat(sim,e){
 const terms=encounter(e);if(!terms||e.hp!==0||sim.room!==D.room||!G.RealmAdventure.runtime(sim).enemies.includes(e))return false;
 const r=sim.state.heavenCampaign;if(r.steps.includes(terms.defeatStep))return true;if(!r.accepted||!terms.spawnAfter.every(id=>r.steps.includes(id)))return false;
 const candidate=sim.snapshot();candidate.heavenCampaign.steps.push(terms.defeatStep);
 const result=commit(sim,candidate,{save:sim.heavenCampaignSave},e.name+' was disabled through actual combat. No angel, civilian or larger network was declared defeated.');
 if(!result.ok){e.hp=1;G.RealmAdventure.notify(sim,result.error);return false;}return true;
}
function tick(sim,dt){
 const run=runtime(sim),q=sim.state.heavenCampaign;if(sim.paused||!Number.isFinite(dt)||dt<=0||sim.room!==D.room||sim.worldDive||!q?.accepted||sim.state.adventure.hp<=0)return;
 dt=Math.min(dt,.1);if(run.activation&&sim.state.adventure.elapsed-run.activation.at>=1.2)run.activation.active=false;
 const e=run.escort;if(e)e.walking=false;if(!e||!['following','lagging','awaiting-save'].includes(e.phase)||q.steps.includes(D.escort.arrivalStep))return;
 if(dist(sim.state.player,e)>D.escort.followRange){e.phase='lagging';return;}
 if(e.routeIndex<D.escort.route.length){
  e.phase='following';const p=D.escort.route[e.routeIndex],d=dist(e,p),move=Math.min(d,dt*D.escort.speed),nx=e.x+(p.x-e.x)/(d||1)*move,nz=e.z+(p.z-e.z)/(d||1)*move;
  if(!G.RealmWorldFoundations.segment(sim.room,e,{x:nx,z:nz},D.escort.radius)){e.phase='lagging';return;}
  if(d>.001)e.yaw=Math.atan2(p.x-e.x,p.z-e.z);e.distance+=move;e.walking=move>1e-8;e.x=nx;e.z=nz;if(d<=move+1e-8)e.routeIndex++;
 }
 if(e.routeIndex!==D.escort.route.length||dist(e,D.escort.route.at(-1))>.001||dist(sim.state.player,e)>D.escort.arrivalRadius||sim.state.adventure.elapsed<(e.arrivalRetryAt||0))return;
 const candidate=sim.snapshot();candidate.heavenCampaign.steps.push(D.escort.arrivalStep);
 const result=commit(sim,candidate,{save:sim.heavenCampaignSave},'The actual bell courier completed every marked service segment and arrived beside Calen and the traveller. The full account stays intact.');
 if(!result.ok){if(e.phase!=='awaiting-save')G.RealmAdventure.notify(sim,result.error);e.phase='awaiting-save';e.arrivalRetryAt=sim.state.adventure.elapsed+1;return;}e.phase='arrived';G.RealmAdventure.notify(sim,'The courier reached the Garden. Fit the public arrival assembly beside the repaired plate.');
}
const api={definition:D,fresh,validate,eligible,available,ready,at,command,runtime,escortStatus,enemies,signature,encounter,lock,beamLength,strikeContains,canDamage,defeat,tick};G.RealmHeavenCampaign=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
