/* The gate that remained open: one finite public-passage campaign. Rules own the envoy's reading, combat, the escort
 * and saved deeds. The saga owns the gate and the prophecy; this module writes them into the candidate it saves. */
(function(G){'use strict';
const DATA=G.RealmHeavenCampaignData||(typeof require==='function'?require('./heaven-campaign-data.js'):null);
const D=DATA.definition,fail=error=>({ok:false,error}),copy=o=>JSON.parse(JSON.stringify(o)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// the difficulty table lands in its own lane; until then the fallback keeps the relay seraph whole.
const boss=(id,fallback)=>{const b=G.RealmDifficulty?.boss?.(id);return b&&Number.isFinite(b.hp)&&Number.isFinite(b.damage)?{hp:b.hp,damage:b.damage}:fallback;};
const fresh=()=>({version:1,accepted:false,steps:[],choice:null,claimed:false});
const required=()=>D.steps.filter(s=>!s.optional).map(s=>s.id),step=id=>D.steps.find(s=>s.id===id);
const heard=state=>(state.saga?.prophecy||[]).includes('heaven');
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
// the saga's gate: the foundry must be finished first, or this road was already accepted.
function eligible(state){return state.adventure.started&&state.realmTrails.records[D.prerequisite]?.claimed===true&&G.RealmSaga.allowed(state,'heaven');}
// the envoy's reading comes before the approach watch and before the close; an older save hears it at the envoy's home.
function ready(state){return required().every(id=>state.heavenCampaign.steps.includes(id))&&heard(state);}
function available(state){const r=state.heavenCampaign;return r.accepted&&!r.claimed?D.steps.filter(s=>!r.steps.includes(s.id)&&s.requires.every(id=>r.steps.includes(id))&&(!s.optional||!r.steps.includes('beam-disabled'))&&(s.id!=='begin-watch'||heard(state))):[];}
function at(sim,p){return sim.room===D.room&&!sim.worldDive&&G.RealmTrails.at(sim,{medium:'dry',...p});}
function journal(candidate,kind,text){candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind,text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();}
function commit(sim,candidate,io,text){
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 candidate.adventure.revision++;
 journal(candidate,'heaven-campaign',text);
 let checked,saved;try{checked=G.RealmCore.validate(candidate);saved=io?.save?.(checked);}catch(e){return fail('Campaign save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Campaign save refused. No history, costs or reward were changed.');
 sim.state.heavenCampaign=checked.heavenCampaign;sim.state.saga=checked.saga;
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
 if(!q?.accepted||sim.room!==D.room)return{phase:'inactive',text:'The courier waits only on this road.'};
 if(q.steps.includes(D.escort.arrivalStep))return{phase:'arrived',text:'The courier reached Calen by the marked road. That arrival is kept.'};
 if(e.phase==='following')return{phase:e.phase,text:'Walk beside the courier along the marked loop. It follows you the whole way.'};
 if(e.phase==='lagging')return{phase:e.phase,text:'The courier is waiting. Come back within nine units to go on.'};
 if(e.phase==='awaiting-save')return{phase:e.phase,text:'The walk is finished, but the arrival would not save. Stay beside Calen; it retries once saving works.'};
 return{phase:q.steps.includes(D.escort.startStep)?'reset':'idle',text:q.steps.includes(D.escort.startStep)?'The unfinished walk reset at the waiting place. The invitation stands. Come back and invite the courier again.':'The courier waits on the Arcade walk. Break the false signal and mark the route before you invite it.'};
}
function command(ctx,type,payload,io){
 const sim=ctx?.sim,r=sim?.state.heavenCampaign;
 if(!sim||payload?.quest!==D.id||sim.room!==D.room||sim.worldDive||sim.state.adventure.hp<=0)return fail('Reach the Heaven campaign on dry ground while able to act.');
 if(payload.expectedActive!==ctx.active||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or campaign changed. Read the current terms again.');
 if(type==='claim'&&r.claimed)return{ok:true,duplicate:true,text:'This road is already finished. Its welcome remains in the story.'};
 if(type==='accept'&&r.accepted)return{ok:true,duplicate:true,text:'This road is already open; its saved progress is kept.'};
 if(type==='activate'){
  if(!r.accepted||!r.choice||!r.steps.includes('arrangement')||!at(sim,step('fit-arrival-assist')))return fail('Go to the arrival assembly before you try it.');
  const run=runtime(sim),now=sim.state.adventure.elapsed;if(run.activation&&now-run.activation.at<3.6)return fail('The assembly is settling. Try it again in a moment.');
  run.activation={choice:r.choice,at:now,active:true};return{ok:true,text:'The welcome answers one press. Nothing is granted by it.'};
 }
 const candidate=sim.snapshot(),q=candidate.heavenCampaign;let text,reward=null,invite=false;
 if(type==='accept'){
  if(!eligible(candidate)||!at(sim,D.giver))return fail(G.RealmSaga.allowed(candidate,'heaven')?'Finish the Broken Choir repair, then speak to Rielle to begin this road.':'The garden gate is not open to you yet.');
  q.accepted=true;text=D.title+' begins. The repaired garden answer stays as it was.';
 }else if(type==='envoy'){
  // the envoy's reading belongs to the saga; the candidate carries it so it saves with this campaign's record.
  if(!q.accepted||q.claimed||!at(sim,D.envoy))return fail('Walk to the envoy in the garden to hear the reading.');
  if(heard(candidate))return{ok:true,duplicate:true,text:'The envoy has already read it to you.'};
  const said=G.RealmSaga.prophecyHeard({state:candidate,event:(kind,text)=>journal(candidate,kind,text)},'heaven');if(!said.ok)return fail(said.error);
  text='The envoy read it again: “'+G.RealmSaga.PROPHECY_LINES.heaven+'”';
 }else if(type==='escort-invite'){
  const s=step(D.escort.startStep);
  if(!q.accepted||q.claimed||q.steps.includes(D.escort.arrivalStep)||!s.requires.every(id=>q.steps.includes(id))||!at(sim,s))return fail('Mark the service walk first, then come back to invite the courier.');
  const e=runtime(sim).escort;if(['following','lagging','awaiting-save'].includes(e.phase))return{ok:true,duplicate:true,text:'The courier is already walking with you. Stay close to keep going.'};
  const prior=q.steps.includes(s.id);if(!prior)q.steps.push(s.id);invite=true;text=prior?'The courier starts the walk again. Nothing is granted for it.':s.text;
 }else if(type==='step'){
  const s=step(payload.step);
  if(!q.accepted||q.claimed||!s||s.kind!=='interact'||s.id===D.escort.startStep)return fail('Only unfinished work on this road can be recorded here.');
  if(q.steps.includes(s.id))return{ok:true,duplicate:true,text:'This is already done.'};
  if(!available(candidate).some(p=>p.id===s.id)||!at(sim,s))return fail('Reach '+s.name+' and finish what it asks first.');
  q.steps.push(s.id);text=s.text;
 }else if(type==='choose'){
  const s=step('arrangement'),choice=D.choices.find(c=>c.id===payload.choice);
  if(q.choice!==null)return q.choice===payload.choice?{ok:true,duplicate:true,text:'That welcome is already kept.'}:fail('The welcome is kept for good. Opening this page again cannot change it.');
  if(!choice||!available(candidate).some(p=>p.id===s.id)||!at(sim,s))return fail('Welcome the courier and fit the arrival assembly before you choose.');
  q.choice=choice.id;q.steps.push(s.id);text=choice.name+'. '+choice.consequence;
 }else if(type==='claim'){
  if(!q.accepted||!ready(candidate)||!at(sim,D.giver))return fail('Check the welcome with Calen, then return to Rielle to close the work.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=D.reward,max=G.RealmSandbox.MAX;
  // the reward is given as far as the pouch and the stored caps allow; a full pouch never blocks the road.
  const room=(have,n,cap)=>Math.max(0,Math.min(n,cap-have));
  const got={xp:Math.min(fee.xp,9999-a.xp),coins:room(a.coins,fee.coins,9999),ore:room(a.ore,fee.ore,9999),materials:{}};
  for(const[k,n]of Object.entries(fee.materials))got.materials[k]=Object.hasOwn(inv,k)?room(inv[k],n,max):0;
  a.xp+=got.xp;a.coins+=got.coins;a.ore+=got.ore;for(const[k,n]of Object.entries(got.materials))inv[k]+=n;
  reward=got;q.claimed=true;
  const cut=got.coins<fee.coins||got.ore<fee.ore||Object.entries(fee.materials).some(([k,n])=>got.materials[k]<n);
  text=D.title+' is finished · '+D.choices.find(c=>c.id===q.choice).name+' · '+got.xp+' XP, '+got.coins+' sunmarks, '+got.ore+' ore, '+got.materials.wood+' timber and '+got.materials.fiber+' fibre.'+(cut?' Some of it did not fit in your pouch and stayed in the garden.':'')+(got.xp<fee.xp?' Stored XP stays at its cap.':'');
 }else return fail('Unknown action on this road.');
 const before=G.RealmAdventure.level(sim.state.adventure),result=commit(sim,candidate,io,text);
 if(result.ok){const run=runtime(sim);if(invite)run.escort={...makeEscort(),phase:'following'};if(reward)result.reward=copy(reward);G.RealmAdventure.syncScene(sim);if(G.RealmAdventure.level(sim.state.adventure)>before)G.RealmAdventure.notify(sim,'Level '+G.RealmAdventure.level(sim.state.adventure)+' · a public welcome remains.');}return result;
}
function enemies(sim){const r=sim.state.heavenCampaign;return sim.room===D.room&&!sim.worldDive&&r?.accepted?D.enemies.filter(e=>e.spawnAfter.every(id=>r.steps.includes(id))&&!r.steps.includes(e.defeatStep)).map(e=>({...e,...(e.boss?boss(e.boss,{hp:e.hp,damage:e.damage}):{}),heavenCampaign:D.id,xp:0,coins:0,ore:0,windup:e.attack.windup,recovery:e.attack.recovery,telegraphRadius:0})):[];}
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
 const result=commit(sim,candidate,{save:sim.heavenCampaignSave},e.name+' was broken in the fight. It was a counterfeit machine, not an angel or a civilian.');
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
 const result=commit(sim,candidate,{save:sim.heavenCampaignSave},'The bell courier walked the whole marked road and reached Calen. The full account stays.');
 if(!result.ok){if(e.phase!=='awaiting-save')G.RealmAdventure.notify(sim,result.error);e.phase='awaiting-save';e.arrivalRetryAt=sim.state.adventure.elapsed+1;return;}e.phase='arrived';G.RealmAdventure.notify(sim,'The courier reached the garden. Fit the arrival assembly beside the repaired plate.');
}
const api={definition:D,fresh,validate,eligible,available,ready,heard,at,command,runtime,escortStatus,enemies,signature,encounter,lock,beamLength,strikeContains,canDamage,defeat,tick};G.RealmHeavenCampaign=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
