/* Staged Cosmos campaign owner. Root must install Core/geometry/Adventure callers.
 * The catalogue creates no ground; rules never move bodies or grant legacy deeds.
 * Contact scheduling and real weapon damage remain the production combat owner. */
(function(G){'use strict';
const DATA=G.RealmCosmosCampaignData||(typeof require==='function'?require('./cosmos-campaign-data.js'):null);
const D=DATA.definition,P=DATA.patterns,SUPPORTS=DATA.supports;
const copy=o=>JSON.parse(JSON.stringify(o)),finite=Number.isFinite,fail=error=>({ok:false,error});
const step=id=>D.steps.find(s=>s.id===id),record=s=>s?.cosmosCampaign||s,locks=new WeakMap(),runtimeOwners=new WeakMap(),actorSims=new WeakMap(),actorStates=new WeakMap();
const fresh=()=>({version:1,accepted:false,steps:[],choice:null,opened:false,claimed:false});
const required=()=>D.steps.filter(s=>!s.optional).map(s=>s.id);
const prepared=r=>DATA.completedSupports(r?.steps||[]),configured=r=>DATA.configuredSupports(r?.steps||[]);
function allowed(r,s){
 if(!s||!s.requires.every(id=>r.steps.includes(id)))return false;
 const done=prepared(r),set=configured(r);
 if(s.requiresSupport&&!done.includes(s.requiresSupport)||s.requiresSupports&&done.length<s.requiresSupports||s.requiresConfiguredSupports&&set.length<s.requiresConfiguredSupports)return false;
 const lead=SUPPORTS.find(p=>p.complete===s.id||p.assistance===s.id);
 return !lead||!r.steps.includes(s.id===lead.complete?lead.assistance:lead.complete);
}
function validate(raw){
 if(raw===undefined)return fresh();const no=why=>{throw Error('Invalid Cosmos campaign: '+why);};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join('|')!=='accepted|choice|claimed|opened|steps|version'||raw.version!==1||['accepted','opened','claimed'].some(k=>typeof raw[k]!=='boolean'))no('version or record');
 if(!Array.isArray(raw.steps)||raw.steps.length>D.steps.length||new Set(raw.steps).size!==raw.steps.length||raw.steps.some(id=>typeof id!=='string'||!step(id)))no('steps');
 if(raw.choice!==null&&!D.choices.some(c=>c.id===raw.choice))no('accountability');
 // Preserve actual action order: optional late work cannot backfill an earlier
 // two-support gate, and a malformed future history never becomes a deed.
 const prior={steps:[]};for(const id of raw.steps){if(!allowed(prior,step(id)))no('ordered prerequisites/supports at '+id);prior.steps.push(id);}
 if(raw.steps.includes('accountability')!==(raw.choice!==null))no('choice history');
 if(raw.steps.includes('open-confluence')!==raw.opened)no('open history');
 if(!raw.accepted&&(raw.steps.length||raw.choice!==null||raw.opened||raw.claimed))no('unaccepted history');
 if(raw.claimed&&!ready(raw))no('unearned claim');
 return{version:1,accepted:raw.accepted,steps:raw.steps.slice(),choice:raw.choice,opened:raw.opened,claimed:raw.claimed};
}
function eligible(state){return state?.adventure?.started===true&&state?.realmTrails?.records?.[D.prerequisite]?.claimed===true;}
function available(state){const r=record(state);return r?.accepted&&!r.claimed?D.steps.filter(s=>!r.steps.includes(s.id)&&allowed(r,s)):[];}
function ready(state){const r=record(state);return !!r?.accepted&&D.choices.some(c=>c.id===r.choice)&&r.opened===true&&prepared(r).length>=2&&configured(r).length>=2&&required().every(id=>r.steps.includes(id));}
function at(sim,p){
 const W=G.RealmWorldFoundations;if(!sim||sim.room!==D.room||sim.worldDive||!p||!W||!G.RealmTrails?.at(sim,{medium:'dry',...p}))return false;
 const y=W.playerHeight(sim);return finite(y)&&Math.abs(y-(p.y??DATA.geometry.height))<=.38&&W.walkable(D.room,p.x,p.z,.31)&&W.segment(D.room,sim.state.player,p,.035);
}
function commit(sim,candidate,io,text,ctx){
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 const state=sim.state,room=sim.room,active=ctx?.active,before=JSON.stringify(state);
 candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'cosmos-campaign',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{
  const ledger=validate(candidate.cosmosCampaign);checked=G.RealmCore.validate(candidate);
  if(!checked.cosmosCampaign||JSON.stringify(validate(checked.cosmosCampaign))!==JSON.stringify(ledger))return fail('The Cosmos save owner is not installed or did not retain the candidate. No deed or fee was adopted.');
  if(checked.cosmosCampaign.accepted&&!eligible(checked))return fail('The claimed comparator prerequisite must remain in the saved character.');
  const encoded=JSON.stringify(checked);saved=io?.save?.(checked);if(JSON.stringify(checked)!==encoded)return fail('The save writer changed the validated candidate; it was not adopted.');
 }catch(e){return fail('Campaign save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Campaign save refused. No history, costs or reward were changed.');
 if(sim.state!==state||sim.room!==room||JSON.stringify(sim.state)!==before||(ctx&&ctx.active!==active))return fail('The character changed during saving. The saved candidate was not adopted into the changed simulation.');
 sim.state.cosmosCampaign=checked.cosmosCampaign;for(const k of['xp','coins','ore','revision'])sim.state.adventure[k]=checked.adventure[k];
 Object.assign(sim.state.sandbox.inventory,checked.sandbox.inventory);sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;return{ok:true,text};
}
function runtime(sim){
 let r=sim.cosmosCampaignRuntime;if(!r||r.room!==sim.room||runtimeOwners.get(r)!==sim.state){r=sim.cosmosCampaignRuntime={room:sim.room,witnesses:Object.freeze([])};runtimeOwners.set(r,sim.state);}
 const q=sim.state.cosmosCampaign,present=sim.room===D.room&&!sim.worldDive&&eligible(sim.state)&&q?.accepted;
 const prior=new Map(r.witnesses.map(w=>[w.id,w]));const witnesses=present?D.witnesses.filter(w=>w.appearsAfter.every(id=>q.steps.includes(id))).map(w=>prior.get(w.id)||Object.freeze({id:w.id,name:w.name,x:w.x,z:w.z,yaw:0,cosmosCampaign:D.id})):[];
 if(witnesses.length!==r.witnesses.length||witnesses.some((w,i)=>w!==r.witnesses[i]))r.witnesses=Object.freeze(witnesses);return r;
}
function command(ctx,type,payload,io){
 const sim=ctx?.sim;
 if(!G.RealmCore||!(sim instanceof G.RealmCore.Simulation)||!payload||typeof payload!=='object'||Array.isArray(payload)||payload.quest!==D.id||sim.room!==D.room||sim.worldDive||sim.state.adventure.hp<=0)return fail('Reach the Cosmos service operation on dry ground while able to act.');
 if(typeof ctx.active!=='string'||!ctx.active||payload.expectedActive!==ctx.active||!Number.isSafeInteger(payload.expectedRevision)||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or operation changed. Read the current terms again.');
 const r=sim.state.cosmosCampaign;if(!r||!eligible(sim.state))return fail('Earn the ordinary kit and explicitly claim the separate named-station comparator first.');
 if(type==='claim'&&r.claimed)return{ok:true,duplicate:true,text:'This local Confluence was already paid once. Its apparatus and account remain.'};
 if(type==='accept'&&r.accepted)return{ok:true,duplicate:true,text:'This operation is already accepted; its saved work remains.'};
 let candidate;try{candidate=sim.snapshot();if(!candidate.cosmosCampaign)return fail('The Cosmos snapshot owner is not installed. No history or fee was changed.');candidate.cosmosCampaign=validate(candidate.cosmosCampaign);}catch(e){return fail('Campaign state refused: '+e.message);}
 const q=candidate.cosmosCampaign;let text,reward=null;
 if(type==='accept'){
  if(!eligible(candidate)||!at(sim,D.giver))return fail('Claim the separate comparator, then speak to Anik at the actual observatory.');
  q.accepted=true;text=D.title+' accepted. The comparator, drawing shelf, equipment and ordinary return retain their own history.';
 }else if(type==='step'||type==='configure'){
  const s=step(payload.step);if(!q.accepted||q.claimed||!s||s.kind!==(type==='configure'?'configure':'interact'))return fail('Only accepted physical work of this kind can be recorded. Actual combat owns machine exhaustion.');
  if(type==='configure'&&payload.setting!==s.setting)return fail('Read and choose the exact named setting. Wrong settings have no material cost or penalty.');
  if(!at(sim,s))return fail('Reach '+s.name+' on its actual supported dry approach.');
  if(q.steps.includes(s.id))return{ok:true,duplicate:true,text:'This physical action is already recorded.'};
  if(!allowed(q,s))return fail('Complete the stated predecessors and distinct prepared supports before '+s.name+'.');
  q.steps.push(s.id);if(s.id==='open-confluence')q.opened=true;text=s.text;
 }else if(type==='choose'){
  const s=step('accountability'),choice=D.choices.find(c=>c.id===payload.choice);
  if(!q.accepted||q.claimed||!choice||!at(sim,s))return fail('Reach the local accountability marker after disabling the actual central link.');
  if(q.choice!==null)return q.choice===choice.id?{ok:true,duplicate:true,text:'That bounded local account is already retained.'}:fail('The recorded local accountability choice cannot be overwritten.');
  if(!allowed(q,s))return fail('Settle both actual machines, release both feeds and physically disable the central link before choosing.');
  q.choice=choice.id;q.steps.push(s.id);text=choice.name+' recorded. '+choice.consequence;
 }else if(type==='claim'){
  if(!ready(candidate)||!at(sim,D.giver))return fail('Verify the independently open apparatus, then return to Anik for the whole declared fee.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=D.reward;
  if(a.coins+fee.coins>9999||a.ore+fee.ore>9999||Object.entries(fee.materials).some(([k,n])=>!Object.hasOwn(inv,k)||inv[k]+n>G.RealmSandbox.MAX))return fail('Make room for the whole fee, including crystal. The apparatus remains open and unpaid; nothing was changed.');
  reward={...copy(fee),xp:Math.min(fee.xp,9999-a.xp)};a.xp+=reward.xp;a.coins+=fee.coins;a.ore+=fee.ore;for(const[k,n]of Object.entries(fee.materials))inv[k]+=n;
  q.claimed=true;text=D.title+' complete · '+D.choices.find(c=>c.id===q.choice).name+' · '+reward.xp+' XP, '+fee.coins+' sunmarks, '+fee.ore+' ore, '+fee.materials.wood+' timber, '+fee.materials.fiber+' fibre and '+fee.materials.crystal+' crystal. Claimed once.'+(reward.xp<fee.xp?' Existing stored XP cap retained.':'');
 }else return fail('Unknown Cosmos campaign action.');
 const before=G.RealmAdventure.level(sim.state.adventure),result=commit(sim,candidate,io,text,ctx);
 if(result.ok){runtime(sim);if(reward)result.reward=reward;G.RealmAdventure.syncScene(sim);if(G.RealmAdventure.level(sim.state.adventure)>before)G.RealmAdventure.notify(sim,'Level '+G.RealmAdventure.level(sim.state.adventure)+' · independent local service remains.');}return result;
}
function enemies(sim){const r=sim?.state?.cosmosCampaign;return sim?.room===D.room&&!sim.worldDive&&eligible(sim.state)&&r?.accepted?D.enemies.filter(e=>e.spawnAfter.every(id=>r.steps.includes(id))&&!r.steps.includes(e.defeatStep)).map(e=>({...e,originX:e.x,originZ:e.z,cosmosCampaign:D.id,xp:0,coins:0,ore:0,windup:(e.pattern==='reclaimer'?P.reclaimer.line:P.guardian.ring).windup,recovery:(e.pattern==='reclaimer'?P.reclaimer.line:P.guardian.ring).recovery,telegraphRadius:0})):[];}
const signature=sim=>enemies(sim).map(e=>e.id).join('|');
function encounter(e){return e?.cosmosCampaign===D.id?D.enemies.find(p=>p.id===e.id)||null:null;}
function owned(sim,e,alive=true){
 const t=encounter(e),r=sim?.state?.cosmosCampaign;
 const ok=!!G.RealmCore&&sim instanceof G.RealmCore.Simulation&&!!t&&(!actorStates.has(e)||actorStates.get(e)===sim.state)&&(!actorSims.has(e)||actorSims.get(e)===sim)&&sim.room===D.room&&!sim.worldDive&&eligible(sim.state)&&r?.accepted&&t.spawnAfter.every(id=>r.steps.includes(id))&&!r.steps.includes(t.defeatStep)&&e.originX===t.x&&e.originZ===t.z&&e.x===t.x&&e.z===t.z&&e.kind===t.kind&&e.radius===t.radius&&e.maxHP===t.hp&&e.damage===t.damage&&e.anchored===true&&finite(e.hp)&&(alive?e.hp>0&&e.hp<=t.hp:e.hp===0)&&G.RealmAdventure.runtime(sim).enemies.includes(e)&&G.RealmWorldFoundations.walkable(D.room,e.x,e.z,e.radius);
 if(ok){actorSims.set(e,sim);actorStates.set(e,sim.state);}return !!ok;
}
function canDamage(sim,e){return !sim?.paused&&sim?.state?.adventure?.hp>0&&owned(sim,e);}
// Aim locks toward the target, so its radial contact is on the primary arm.
const contactReach=p=>Math.min(p.reach,(p.kind==='annulus'?p.outerRadius:p.kind==='cross'?p.halfLength:p.length)+.24);
function pattern(e,sim=actorSims.get(e)){
 const t=encounter(e);if(!t)return null;if(t.pattern==='reclaimer')return P.reclaimer.line;
 const pendingRing=!(Number.isSafeInteger(e.cosmosCycle)&&e.cosmosCycle>=0&&e.cosmosCycle%2),q=sim?.state?.cosmosCampaign;
 const ring={...P.guardian.ring,outerRadius:q?.steps.includes('release-east-feed')?P.guardian.ring.afterEastRelease.outerRadius:P.guardian.ring.outerRadius};
 const cross={...P.guardian.cross,axes:q?.steps.includes('release-west-feed')?P.guardian.cross.afterWestRelease.axes:P.guardian.cross.axes};
 const distance=sim?Math.hypot(sim.state.player.x-e.x,sim.state.player.z-e.z):0;
 return pendingRing&&distance>contactReach(ring)&&distance<=contactReach(cross)?cross:pendingRing?ring:cross;
}
function clipPoly(poly,key,bound,greater){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=greater?a[key]>=bound:a[key]<=bound,ib=greater?b[key]>=bound:b[key]<=bound;if(ia)out.push(a);if(ia!==ib){const t=(bound-a[key])/(b[key]-a[key]);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}return out;}
function area(poly){let n=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];n+=a.x*b.z-b.x*a.z;}return Math.abs(n)/2;}
function cells(bounds,patches,uncovered){
 const relevant=patches.filter(p=>p.x+p.w/2>=bounds.minX&&p.x-p.w/2<=bounds.maxX&&p.z+p.d/2>=bounds.minZ&&p.z-p.d/2<=bounds.maxZ),xs=[bounds.minX,bounds.maxX],zs=[bounds.minZ,bounds.maxZ];
 for(const p of relevant){for(const x of[p.x-p.w/2,p.x+p.w/2])if(x>bounds.minX&&x<bounds.maxX)xs.push(x);for(const z of[p.z-p.d/2,p.z+p.d/2])if(z>bounds.minZ&&z<bounds.maxZ)zs.push(z);}xs.sort((a,b)=>a-b);zs.sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){if(xs[i]-xs[i-1]<1e-10||zs[j]-zs[j-1]<1e-10)continue;const x=(xs[i]+xs[i-1])/2,z=(zs[j]+zs[j-1])/2;if(relevant.some(p=>Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2))continue;if(uncovered(xs[i-1],xs[i],zs[j-1],zs[j]))return false;}return true;
}
function covered(poly,patches){return cells({minX:Math.min(...poly.map(p=>p.x)),maxX:Math.max(...poly.map(p=>p.x)),minZ:Math.min(...poly.map(p=>p.z)),maxZ:Math.max(...poly.map(p=>p.z))},patches,(x0,x1,z0,z1)=>{let q=clipPoly(poly,'x',x0,true);q=clipPoly(q,'x',x1,false);q=clipPoly(q,'z',z0,true);q=clipPoly(q,'z',z1,false);return area(q)>1e-10;});}
function clippedLine(sim,s){
 const world=G.RealmWorldFoundations.definition(D.room);if(!world?.patches||!world.solids)return 0;
 const sin=Math.sin(s.yaw),cos=Math.cos(s.yaw),margin=.24;let length=s.length;
 for(const p of world.solids){let poly=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const x=p.x+a*(p.w/2+margin)-s.x,z=p.z+b*(p.d/2+margin)-s.z;return{x:x*cos-z*sin,z:x*sin+z*cos};});poly=clipPoly(poly,'x',-s.halfWidth,true);poly=clipPoly(poly,'x',s.halfWidth,false);poly=clipPoly(poly,'z',0,true);if(poly.length)length=Math.min(length,Math.max(0,Math.min(...poly.map(p=>p.z))-.005));}
 const supported=n=>covered([[-s.halfWidth-margin,-margin],[s.halfWidth+margin,-margin],[s.halfWidth+margin,n+margin],[-s.halfWidth-margin,n+margin]].map(([side,forward])=>({x:s.x+cos*side+sin*forward,z:s.z-sin*side+cos*forward})),world.patches);
 if(length<=0||!supported(Math.min(length,1e-6)))return 0;if(!supported(length)){let lo=0,hi=length;for(let i=0;i<25;i++){const mid=(lo+hi)/2;if(supported(mid))lo=mid;else hi=mid;}length=Math.max(0,lo-.005);}return length;
}
function ringSupported(sim,s){
 const world=G.RealmWorldFoundations.definition(D.room),r=s.outerRadius+.24;if(!world?.patches)return false;
 return cells({minX:s.x-r,maxX:s.x+r,minZ:s.z-r,maxZ:s.z+r},world.patches,(x0,x1,z0,z1)=>Math.hypot(Math.max(x0-s.x,0,s.x-x1),Math.max(z0-s.z,0,s.z-z1))<r-1e-8);
}
function lock(sim,e){
 if(!canDamage(sim,e)||!['idle','recovery','alert'].includes(e.mode)||![sim.state.player.x,sim.state.player.z].every(finite))return false;
 const p=pattern(e,sim),distance=Math.hypot(sim.state.player.x-e.x,sim.state.player.z-e.z);if(distance>contactReach(p)||!G.RealmWorldFoundations.segment(D.room,e,sim.state.player,.04))return false;
 const yaw=Math.atan2(sim.state.player.x-e.x,sim.state.player.z-e.z),frame={kind:p.kind,x:e.x,z:e.z,yaw};
 if(p.kind==='line'){frame.halfWidth=p.halfWidth;frame.length=clippedLine(sim,{...frame,length:p.length});}
 else if(p.kind==='cross'){frame.halfWidth=p.halfWidth;frame.arms=Object.freeze(p.axes.map(axis=>Object.freeze({axis,negative:clippedLine(sim,{...frame,yaw:yaw+axis+Math.PI,length:p.halfLength}),positive:clippedLine(sim,{...frame,yaw:yaw+axis,length:p.halfLength})})));}
 else{frame.innerRadius=p.innerRadius;frame.outerRadius=p.outerRadius;if(!ringSupported(sim,frame))return false;}
 if(frame.kind==='line'&&frame.length<=0||frame.kind==='cross'&&!frame.arms.some(a=>a.negative>0||a.positive>0))return false;
 e.yaw=yaw;e.windup=p.windup;e.recovery=p.recovery;e.cosmosCycle=p.kind==='annulus'?1:0;e.strike=Object.freeze(frame);locks.set(e,{sim,state:sim.state,frame:e.strike});return e.strike;
}
function strikeContains(e,p){
 const entry=locks.get(e),s=e?.strike;if(!entry||entry.frame!==s||entry.state!==entry.sim.state||!owned(entry.sim,e)||![p?.x,p?.z].every(finite))return false;
 const W=G.RealmWorldFoundations;if(!W.walkable(D.room,p.x,p.z,.31)||!W.segment(D.room,s,p,.04))return false;
 const dx=p.x-s.x,dz=p.z-s.z,margin=.24,distance=Math.hypot(dx,dz);
 if(s.kind==='annulus')return distance>=Math.max(0,s.innerRadius-margin)&&distance<=s.outerRadius+margin;
 const contains=(yaw,negative,positive)=>{if(negative<=0&&positive<=0)return false;const forward=dx*Math.sin(yaw)+dz*Math.cos(yaw),side=dx*Math.cos(yaw)-dz*Math.sin(yaw);return Math.hypot(Math.max(0,Math.abs(side)-s.halfWidth),Math.max(0,-negative-forward,forward-positive))<=margin;};
 if(s.kind==='line')return s.length>0&&contains(s.yaw,0,s.length);if(s.kind==='cross')return s.arms.some(a=>contains(s.yaw+a.axis,a.negative,a.positive));return false;
}
function defeat(sim,e){
 if(sim?.paused||sim?.state?.adventure?.hp<=0||!owned(sim,e,false))return false;
 const t=encounter(e);let candidate;try{candidate=sim.snapshot();if(!candidate.cosmosCampaign)throw Error('Cosmos snapshot owner is not installed');candidate.cosmosCampaign.steps.push(t.defeatStep);}catch(error){e.hp=1;G.RealmAdventure.notify(sim,'Campaign state refused: '+error.message);return false;}
 const result=commit(sim,candidate,{save:sim.cosmosCampaignSave},t.name+' settled through actual combat exhaustion. No independent loot, XP or central project completion was granted.');
 if(!result.ok){e.hp=1;G.RealmAdventure.notify(sim,result.error);return false;}locks.delete(e);return true;
}
const api={definition:D,patterns:P,supports:SUPPORTS,fresh,validate,eligible,required,available,ready,at,command,runtime,enemies,signature,encounter,owned,canDamage,pattern,lock,strikeContains,defeat};
G.RealmCosmosCampaign=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
