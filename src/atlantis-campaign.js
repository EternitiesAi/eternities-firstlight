/* Finite Atlantis repair owner. Presentation cannot create pressure, damage or fees.
 * Invariants: one retained approach; its actual reading gates every descendant;
 * full candidate saves precede adoption; movement retains body support and depth.
 * Enemy originX/originZ identify the canonical unit; current x/z may legitimately
 * move. Root owns actual AI timers/contact and invokes defeat from damageEnemy.
 */
(function(G){'use strict';
const DATA=G.RealmAtlantisCampaignData||(typeof require==='function'?require('./atlantis-campaign-data.js'):null);
const D=DATA.definition,P=DATA.patterns,F=DATA.current,Q=DATA.pressure;
const fail=error=>({ok:false,error}),copy=o=>JSON.parse(JSON.stringify(o)),finite=Number.isFinite,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const step=id=>D.steps.find(s=>s.id===id),record=s=>s?.atlantisCampaign||s,locks=new WeakMap(),owners=new WeakMap();
const fresh=()=>({version:1,accepted:false,steps:[],approach:null,choice:null,claimed:false});
function required(state){const r=record(state),selected=D.approaches.find(a=>a.id===r?.approach)?.requiredObservation;return D.steps.filter(s=>!s.optional||s.id===selected).map(s=>s.id);}
function validate(raw){
 if(raw===undefined)return fresh();const no=why=>{throw Error('Invalid Atlantis campaign: '+why);};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join('|')!=='accepted|approach|choice|claimed|steps|version'||raw.version!==1||typeof raw.accepted!=='boolean'||typeof raw.claimed!=='boolean')no('version or record');
 if(!Array.isArray(raw.steps)||raw.steps.length>D.steps.length||new Set(raw.steps).size!==raw.steps.length||raw.steps.some(id=>typeof id!=='string'||!step(id)))no('steps');
 if(raw.steps.some(id=>!step(id).requires.every(p=>raw.steps.includes(p))))no('prerequisites');
 if(raw.approach!==null&&!D.approaches.some(a=>a.id===raw.approach))no('approach');
 if(raw.steps.includes('choose-approach')!==(raw.approach!==null))no('approach history');
 if(raw.steps.includes('diagnose-flow')&&!raw.steps.includes(D.approaches.find(a=>a.id===raw.approach)?.requiredObservation))no('selected observation');
 if(raw.choice!==null&&!D.choices.some(c=>c.id===raw.choice))no('disposition');
 if(raw.steps.includes('disposition')!==(raw.choice!==null))no('choice history');
 if(!raw.accepted&&(raw.steps.length||raw.approach!==null||raw.choice!==null||raw.claimed))no('unaccepted history');
 if(raw.claimed&&!required(raw).every(id=>raw.steps.includes(id)))no('unearned claim');
 return{version:1,accepted:raw.accepted,steps:D.steps.filter(s=>raw.steps.includes(s.id)).map(s=>s.id),approach:raw.approach,choice:raw.choice,claimed:raw.claimed};
}
function eligible(state){return state?.adventure?.started===true&&state?.realmTrails?.records?.[D.prerequisite]?.claimed===true;}
function available(state){const r=record(state);return r?.accepted&&!r.claimed?D.steps.filter(s=>!r.steps.includes(s.id)&&s.requires.every(id=>r.steps.includes(id))&&(s.id!=='diagnose-flow'||r.steps.includes(D.approaches.find(a=>a.id===r.approach)?.requiredObservation))):[];}
function ready(state){const r=record(state);return !!r?.accepted&&D.approaches.some(a=>a.id===r.approach)&&D.choices.some(c=>c.id===r.choice)&&required(r).every(id=>r.steps.includes(id));}
function at(sim,p){
 if(!sim||sim.room!==D.room||!p||!G.RealmTrails.at(sim,{medium:'dry',...p}))return false;
 const W=G.RealmWorldFoundations,a=sim.state.player;
 if(p.medium!=='water'&&p.medium!=='court')return W.segment(D.room,a,p,.035);
 const y=W.playerHeight(sim),d=W.definition(D.room).dive,n=Math.max(1,Math.ceil(Math.hypot(a.x-p.x,a.z-p.z,y-p.y)/.04));
 for(let i=0;i<=n;i++)if(!W.swimClear(d,a.x+(p.x-a.x)*i/n,y+(p.y-y)*i/n,a.z+(p.z-a.z)*i/n))return false;
 return true;
}
function commit(sim,candidate,io,text,ctx){
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 const state=sim.state,room=sim.room,active=ctx?.active,before=JSON.stringify(state);
 candidate.adventure.revision++;
 candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'atlantis-campaign',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=G.RealmCore.validate(candidate);saved=io?.save?.(checked);}catch(e){return fail('Campaign save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Campaign save refused. No history, costs or reward were changed.');
 // The synchronous writer owns the durable character envelope. Never adopt its
 // result into a replaced or re-entrant simulation, even if the writer said ok.
 if(sim.state!==state||sim.room!==room||JSON.stringify(sim.state)!==before||(ctx&&ctx.active!==active))return fail('The character changed during saving. The saved candidate was not adopted into the changed simulation.');
 sim.state.atlantisCampaign=checked.atlantisCampaign;
 for(const k of['xp','coins','ore','revision'])sim.state.adventure[k]=checked.adventure[k];
 Object.assign(sim.state.sandbox.inventory,checked.sandbox.inventory);sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
function flowEnabled(sim){const r=sim?.state?.atlantisCampaign;return sim?.room===D.room&&eligible(sim.state)&&r?.accepted&&!r.claimed&&r.steps.includes(F.startStep)&&!F.stopSteps.some(id=>r.steps.includes(id));}
function currentStatus(sim){
 const active=flowEnabled(sim);
 return{active,text:active?'The marked shallow repair current is active. Ordinary swimming is faster; the quiet lower band and supplied manual bypass remain available. The air court has no current.':'The local repair current is inactive. Public visitor protection, the quiet lower band and the free home passage remain.'};
}
function runtime(sim){
 let r=sim.atlantisCampaignRuntime;
 if(!r||r.room!==sim.room||owners.get(r)!==sim.state){r=sim.atlantisCampaignRuntime={room:sim.room,witnesses:Object.freeze([]),currentActive:false,currentDistance:0,pullDistance:0};owners.set(r,sim.state);}
 const q=sim.state.atlantisCampaign,present=sim.room===D.room&&eligible(sim.state)&&q?.accepted;
 const prior=new Map(r.witnesses.map(w=>[w.id,w]));
 const witnesses=present?D.witnesses.filter(w=>w.appearsAfter.every(id=>q.steps.includes(id))).map(w=>prior.get(w.id)||Object.freeze({id:w.id,name:w.name,x:w.x,z:w.z,yaw:0,atlantisCampaign:D.id})):[];
 if(witnesses.length!==r.witnesses.length||witnesses.some((w,i)=>w!==r.witnesses[i]))r.witnesses=Object.freeze(witnesses);
 r.currentActive=flowEnabled(sim);return r;
}
const settingFor=id=>Q.correct.find(p=>p.step===id)?.setting||({'manual-bypass':'open-bypass','release-west':'stabilize-west','release-east':'stabilize-east'})[id];
function command(ctx,type,payload,io){
 const sim=ctx?.sim;
 if(!G.RealmCore||!(sim instanceof G.RealmCore.Simulation)||!payload||typeof payload!=='object'||Array.isArray(payload)||payload.quest!==D.id||sim.room!==D.room||sim.state.adventure.hp<=0)return fail('Reach the Atlantis campaign while able to act.');
 if(typeof ctx.active!=='string'||!ctx.active||payload.expectedActive!==ctx.active||!Number.isSafeInteger(payload.expectedRevision)||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or campaign changed. Read the current terms again.');
 const r=sim.state.atlantisCampaign;
 if(type==='claim'&&r.claimed)return{ok:true,duplicate:true,text:'This local harbour campaign was already paid once. Its disposition remains in history.'};
 if(type==='accept'&&r.accepted)return{ok:true,duplicate:true,text:'This campaign is already accepted; its saved approach and work remain.'};
 let candidate;try{candidate=sim.snapshot();}catch(e){return fail('Campaign state refused: '+e.message);}
 const q=candidate.atlantisCampaign;let text,reward=null;
 if(type==='accept'){
  if(!eligible(candidate)||!at(sim,D.giver))return fail('Claim the separate Bellglass depth chart, then speak to Sahra to accept this continuation.');
  q.accepted=true;text=D.title+' accepted. The earlier chart, lamp, equipment and free home passage retain their own history.';
 }else if(type==='approach'){
  const s=step('choose-approach'),a=D.approaches.find(v=>v.id===payload.approach);
  if(!q.accepted||q.claimed||!a||!at(sim,s))return fail('Return to Sahra to deliberately retain an Upper or Lower investigation approach.');
  if(q.approach!==null)return q.approach===a.id?{ok:true,duplicate:true,text:'That first approach is already retained.'}:fail('The first investigation approach is retained. The other reading remains optional evidence.');
  if(!available(candidate).some(v=>v.id===s.id))return fail('Preserve Ilyra’s conflicting receipts before choosing a depth approach.');
  q.approach=a.id;q.steps.push(s.id);text=a.name+' retained. '+a.text;
 }else if(type==='step'||type==='pressure'){
  const s=step(payload.step);
  if(!q.accepted||q.claimed||!s||s.kind!==(type==='pressure'?'pressure':'interact'))return fail('Only accepted physical work of this kind can be recorded. Combat exhaustion has its actual damage caller.');
  if(type==='pressure'&&payload.setting!==settingFor(s.id))return fail('Read the named pressure setting. Incorrect settings have no timing penalty or material cost.');
  if(!at(sim,s))return fail('Reach '+s.name+' at its actual supported medium and depth.');
  if(q.steps.includes(s.id))return{ok:true,duplicate:true,text:'This action is already recorded for this campaign.'};
  if(!available(candidate).some(v=>v.id===s.id))return fail('Complete '+s.name+' in its stated order, with the retained approach’s actual reading.');
  q.steps.push(s.id);text=s.text;
 }else if(type==='choose'){
  const s=step('disposition'),choice=D.choices.find(c=>c.id===payload.choice);
  if(!q.accepted||q.claimed||!choice||!at(sim,s))return fail('Reach Ilyra’s registry after actual Custodian stabilization to choose the local disposition.');
  if(q.choice!==null)return q.choice===choice.id?{ok:true,duplicate:true,text:'That disposition is already recorded.'}:fail('The local disposition is a lasting deed and cannot be overwritten.');
  if(!available(candidate).some(v=>v.id===s.id))return fail('Secure the carrier, exhaust the actual bearing and stabilize both sequential releases before choosing.');
  q.choice=choice.id;q.steps.push(s.id);text=choice.name+' recorded. '+choice.consequence;
 }else if(type==='claim'){
  if(!q.accepted||!ready(candidate)||!at(sim,D.giver))return fail('Verify the selected passage and supervised handoff, then return to Sahra for the whole declared fee.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=D.reward;
  if(a.coins+fee.coins>9999||a.ore+fee.ore>9999||Object.entries(fee.materials).some(([k,n])=>!Object.hasOwn(inv,k)||inv[k]+n>G.RealmSandbox.MAX))return fail('Make room for the whole fee, including crystal. Verified work remains unpaid; nothing was changed.');
  reward={...copy(fee),xp:Math.min(fee.xp,9999-a.xp)};a.xp+=reward.xp;a.coins+=fee.coins;a.ore+=fee.ore;for(const[k,n]of Object.entries(fee.materials))inv[k]+=n;
  q.claimed=true;text=D.title+' complete · '+D.choices.find(c=>c.id===q.choice).name+' · '+reward.xp+' XP, '+fee.coins+' sunmarks, '+fee.ore+' ore, '+fee.materials.wood+' timber, '+fee.materials.fiber+' fibre and '+fee.materials.crystal+' crystal. Claimed once.'+(reward.xp<fee.xp?' Existing stored XP cap retained.':'');
 }else return fail('Unknown Atlantis campaign action.');
 const before=G.RealmAdventure.level(sim.state.adventure),result=commit(sim,candidate,io,text,ctx);
 if(result.ok){runtime(sim);if(reward)result.reward=reward;G.RealmAdventure.syncScene(sim);if(G.RealmAdventure.level(sim.state.adventure)>before)G.RealmAdventure.notify(sim,'Level '+G.RealmAdventure.level(sim.state.adventure)+' · a local passage remains.');}return result;
}
function enemies(sim){const r=sim?.state?.atlantisCampaign;return sim?.room===D.room&&!sim.worldDive&&eligible(sim.state)&&r?.accepted&&D.enemy.spawnAfter.every(id=>r.steps.includes(id))&&!r.steps.includes(D.enemy.defeatStep)?[{...D.enemy,originX:D.enemy.x,originZ:D.enemy.z,atlantisCampaign:D.id,xp:0,coins:0,ore:0,windup:P.sweep.windup,recovery:P.sweep.recovery,telegraphRadius:0}]:[];}
const signature=sim=>enemies(sim).map(e=>e.id).join('|');
function encounter(e){return e?.atlantisCampaign===D.id&&e.id===D.enemy.id?D.enemy:null;}
function owned(sim,e,alive=true){return !!G.RealmCore&&sim instanceof G.RealmCore.Simulation&&!!encounter(e)&&sim.room===D.room&&!sim.worldDive&&eligible(sim.state)&&sim.state.atlantisCampaign?.accepted&&D.enemy.spawnAfter.every(id=>sim.state.atlantisCampaign.steps.includes(id))&&!sim.state.atlantisCampaign.steps.includes(D.enemy.defeatStep)&&e.originX===D.enemy.x&&e.originZ===D.enemy.z&&e.kind==='sentinel'&&e.radius===D.enemy.radius&&e.maxHP===D.enemy.hp&&finite(e.hp)&&(alive?e.hp>0&&e.hp<=D.enemy.hp:e.hp===0)&&G.RealmAdventure.runtime(sim).enemies.includes(e)&&G.RealmWorldFoundations.walkable(D.room,e.x,e.z,e.radius);}
function canDamage(sim,e){return !sim?.paused&&sim?.state?.adventure?.hp>0&&owned(sim,e);}
function clipPoly(poly,key,bound,greater){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=greater?a[key]>=bound:a[key]<=bound,ib=greater?b[key]>=bound:b[key]<=bound;if(ia)out.push(a);if(ia!==ib){const t=(bound-a[key])/(b[key]-a[key]);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}return out;}
function area(poly){let a=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];a+=p.x*q.z-q.x*p.z;}return Math.abs(a)/2;}
function covered(poly,patches){
 const minX=Math.min(...poly.map(p=>p.x)),maxX=Math.max(...poly.map(p=>p.x)),minZ=Math.min(...poly.map(p=>p.z)),maxZ=Math.max(...poly.map(p=>p.z));
 const relevant=patches.filter(p=>p.x+p.w/2>=minX&&p.x-p.w/2<=maxX&&p.z+p.d/2>=minZ&&p.z-p.d/2<=maxZ);
 const xs=[minX,maxX],zs=[minZ,maxZ];for(const p of relevant){for(const x of[p.x-p.w/2,p.x+p.w/2])if(x>minX&&x<maxX)xs.push(x);for(const z of[p.z-p.d/2,p.z+p.d/2])if(z>minZ&&z<maxZ)zs.push(z);}xs.sort((a,b)=>a-b);zs.sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
  if(xs[i]-xs[i-1]<1e-10||zs[j]-zs[j-1]<1e-10)continue;const x=(xs[i]+xs[i-1])/2,z=(zs[j]+zs[j-1])/2;
  if(relevant.some(p=>Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2))continue;
  let cut=clipPoly(poly,'x',xs[i-1],true);cut=clipPoly(cut,'x',xs[i],false);cut=clipPoly(cut,'z',zs[j-1],true);cut=clipPoly(cut,'z',zs[j],false);if(area(cut)>1e-9)return false;
 }return true;
}
function clippedIntake(sim,s){
 const W=G.RealmWorldFoundations,world=W.definition(D.room),sin=Math.sin(s.yaw),cos=Math.cos(s.yaw),margin=.31;
 let length=s.length;
 for(const p of world.solids){
  let polygon=[];for(const[dx,dz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const x=p.x+dx*(p.w/2+margin)-s.x,z=p.z+dz*(p.d/2+margin)-s.z;polygon.push({x:x*cos-z*sin,z:x*sin+z*cos});}
  polygon=clipPoly(polygon,'x',-s.halfWidth,true);polygon=clipPoly(polygon,'x',s.halfWidth,false);polygon=clipPoly(polygon,'z',0,true);
  if(polygon.length)length=Math.min(length,Math.max(0,Math.min(...polygon.map(p=>p.z))-.005));
 }
 const offsets=[[0,0],[margin,0],[-margin,0],[0,margin],[0,-margin],[margin*.707,margin*.707],[-margin*.707,margin*.707],[margin*.707,-margin*.707],[-margin*.707,-margin*.707]];
 function supported(n){const poly=[[-s.halfWidth,0],[s.halfWidth,0],[s.halfWidth,n],[-s.halfWidth,n]].map(([side,forward])=>({x:s.x+cos*side+sin*forward,z:s.z-sin*side+cos*forward}));return offsets.every(([dx,dz])=>covered(poly.map(p=>({x:p.x+dx,z:p.z+dz})),world.patches));}
 if(length<=0||!supported(Math.min(length,1e-5)))return 0;
 if(!supported(length)){let lo=0,hi=length;for(let i=0;i<23;i++){const mid=(lo+hi)/2;if(supported(mid))lo=mid;else hi=mid;}length=Math.max(0,lo-.005);}
 return length;
}
function pattern(e,sim){
 const next=P[Number.isSafeInteger(e?.atlantisCycle)&&e.atlantisCycle>=0&&e.atlantisCycle%2?'intake':'sweep'];
 if(sim&&canDamage(sim,e)){const distance=dist(e,sim.state.player);if(distance>P.sweep.reach&&distance<=P.intake.reach)return P.intake;}
 return next;
}
function lock(sim,e){
 if(!canDamage(sim,e)||![e.x,e.z,sim.state.player.x,sim.state.player.z].every(finite))return false;
 const p=pattern(e,sim),kind=p.kind,yaw=Math.atan2(sim.state.player.x-e.x,sim.state.player.z-e.z);
 const frame={kind,x:e.x,z:e.z,yaw};if(kind==='sweep'){frame.radius=p.radius;frame.halfAngle=p.halfAngle;}else{frame.length=p.length;frame.halfWidth=p.halfWidth;frame.length=clippedIntake(sim,frame);}
 e.atlantisCycle=kind==='sweep'?1:0;e.yaw=yaw;e.windup=p.windup;e.recovery=p.recovery;e.strike=Object.freeze(frame);locks.set(e,{sim,frame:e.strike});return e.strike;
}
function strikeContains(e,p){
 const entry=locks.get(e),s=e?.strike;if(!entry||entry.frame!==s||!owned(entry.sim,e)||![p?.x,p?.z].every(finite))return false;
 const dx=p.x-s.x,dz=p.z-s.z,forward=dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw),side=dx*Math.cos(s.yaw)-dz*Math.sin(s.yaw),margin=.24;
 if(s.kind==='intake'){if(s.length<=0)return false;return Math.hypot(Math.max(0,Math.abs(side)-s.halfWidth),Math.max(0,-forward,forward-s.length))<=margin;}
 if(s.kind!=='sweep')return false;
 if(Math.abs(Math.atan2(side,forward))<=s.halfAngle)return Math.hypot(dx,dz)<=s.radius+margin;
 const edgeSide=Math.sign(side||1)*Math.sin(s.halfAngle),edgeForward=Math.cos(s.halfAngle),projection=Math.max(0,Math.min(s.radius,side*edgeSide+forward*edgeForward));
 return Math.hypot(side-edgeSide*projection,forward-edgeForward*projection)<=margin;
}
function defeat(sim,e){
 if(sim?.paused||sim?.state?.adventure?.hp<=0||!owned(sim,e,false))return false;
 let candidate;try{candidate=sim.snapshot();}catch(error){e.hp=1;G.RealmAdventure.notify(sim,'Campaign state refused: '+error.message);return false;}candidate.atlantisCampaign.steps.push(D.enemy.defeatStep);
 const result=commit(sim,candidate,{save:sim.atlantisCampaignSave},'The actual Custodian bearing was exhausted through combat. The municipal unit settled; no independent loot or XP was granted. Both sequential releases remain.');
 if(!result.ok){e.hp=1;G.RealmAdventure.notify(sim,result.error);return false;}locks.delete(e);return true;
}
function inCurrent(p,y){return Math.abs(p.x-F.x)<=F.w/2&&Math.abs(p.z-F.z)<=F.d/2&&y>=F.minY&&y<=F.maxY;}
function tick(sim,dt){
 const r=runtime(sim);if(sim.paused||!finite(dt)||dt<=0||!r.currentActive||!sim.worldDive||sim.state.adventure.hp<=0)return false;
 const W=G.RealmWorldFoundations,p=sim.state.player,y=W.playerHeight(sim),d=W.definition(D.room).dive;
 if(!finite(y)||!inCurrent(p,y)||W.medium(sim,[p.x,y+.85,p.z])!=='water'||!W.swimClear(d,p.x,y,p.z))return false;
 let remaining=Math.min(dt,.1)*F.speed,moved=0;
 while(remaining>1e-8){const n=Math.min(.02,remaining),q={x:p.x+F.direction.dx*n,z:p.z+F.direction.dz*n};if(!inCurrent(q,y)||W.medium(sim,[q.x,y+.85,q.z])!=='water'||!W.swimClear(d,q.x,y,q.z))break;p.x=q.x;p.z=q.z;moved+=n;remaining-=n;}
 if(moved>0){sim.playerPath=[];r.currentDistance+=moved;return true;}return false;
}
function pull(sim,e,dt){
 const entry=locks.get(e),s=e?.strike,now=sim?.state?.adventure?.elapsed;
 if(!canDamage(sim,e)||!entry||entry.sim!==sim||entry.frame!==s||s.kind!=='intake'||s.length<=0||e.mode!=='intake'||!finite(dt)||dt<=0||!finite(e.timer)||e.timer<=0||e.timer>P.intake.active+1e-8||!finite(e.contactAt)||e.contactAt>now+1e-8||now-e.contactAt>P.intake.active+1e-8)return false;
 const W=G.RealmWorldFoundations,p=sim.state.player;
 if(!strikeContains(e,p)||!W.walkable(D.room,p.x,p.z,.31)||!W.segment(D.room,s,p,.04))return false;
 const distance=dist(s,p);let remaining=Math.min(P.intake.pullSpeed*Math.min(dt,.1),Math.max(0,distance-P.intake.stopRadius)),moved=0;
 const dx=(s.x-p.x)/(distance||1),dz=(s.z-p.z)/(distance||1);
 while(remaining>1e-8){const n=Math.min(.02,remaining),q={x:p.x+dx*n,z:p.z+dz*n};if(!W.segment(D.room,p,q,.31)||!W.segment(D.room,s,q,.04))break;p.x=q.x;p.z=q.z;moved+=n;remaining-=n;}
 if(moved>0){sim.playerPath=[];runtime(sim).pullDistance+=moved;return true;}return false;
}
const api={definition:D,patterns:P,current:F,pressure:Q,fresh,validate,eligible,required,available,ready,at,command,runtime,currentStatus,enemies,signature,encounter,pattern,lock,strikeContains,canDamage,defeat,tick,pull};
G.RealmAtlantisCampaign=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
