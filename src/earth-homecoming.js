/* Earth homecoming owner. Core validates its optional history after all prior
 * owners. Adventure owns its actual anchored roster and single locked contact.
 * This staged integration proposal is not installed/native qualification. */
(function(G){'use strict';
const DATA=G.RealmEarthHomecomingData||(typeof require==='function'?require('./earth-homecoming-data.js'):null),D=DATA.definition,P=DATA.patterns;
const copy=o=>JSON.parse(JSON.stringify(o)),finite=Number.isFinite,fail=error=>({ok:false,error});
const step=id=>D.steps.find(s=>s.id===id),record=s=>s?.earthHomecoming||s;
const actorSims=new WeakMap(),actorStates=new WeakMap(),actorRuntimes=new WeakMap(),locks=new WeakMap(),runtimeOwners=new WeakMap();
const fresh=()=>({version:1,accepted:false,steps:[],choice:null,claimed:false});
const required=()=>D.steps.filter(s=>!s.optional).map(s=>s.id);
const eligible=state=>DATA.eligible(state),missing=state=>DATA.missing(state),evidence=state=>DATA.evidence(state);
function allowed(r,s){return !!s&&s.requires.every(id=>r.steps.includes(id))&&!(s.id==='supplied-screen'&&r.steps.includes('regent-repelled'));}
function ready(state){const r=record(state);return !!r?.accepted&&D.choices.some(c=>c.id===r.choice)&&required().every(id=>r.steps.includes(id));}
function available(state){const r=record(state);return r?.accepted&&!r.claimed?D.steps.filter(s=>!r.steps.includes(s.id)&&allowed(r,s)):[];}
function validate(raw){
 if(raw===undefined)return fresh();const no=why=>{throw Error('Invalid Earth homecoming: '+why);};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join('|')!=='accepted|choice|claimed|steps|version'||raw.version!==1||typeof raw.accepted!=='boolean'||typeof raw.claimed!=='boolean')no('version or record');
 if(!Array.isArray(raw.steps)||raw.steps.length>D.steps.length||new Set(raw.steps).size!==raw.steps.length||raw.steps.some(id=>typeof id!=='string'||!step(id)))no('steps');
 if(raw.choice!==null&&!D.choices.some(c=>c.id===raw.choice))no('aftermath');
 const prior={steps:[]};for(const id of raw.steps){if(!allowed(prior,step(id)))no('ordered prerequisites at '+id);prior.steps.push(id);}
 if(raw.steps.includes('aftermath')!==(raw.choice!==null))no('choice history');
 if(!raw.accepted&&(raw.steps.length||raw.choice!==null||raw.claimed))no('unaccepted history');
 if(raw.claimed&&!ready(raw))no('unearned claim');
 return{version:1,accepted:raw.accepted,steps:raw.steps.slice(),choice:raw.choice,claimed:raw.claimed};
}
// Named boundaries delegate to the real Core owner. Core includes the new field;
// neither helper can append an unchecked field after character-store validation.
function validateWorld(raw){return G.RealmCore.validate(raw);}
function snapshot(sim){if(!(sim instanceof G.RealmCore.Simulation))throw Error('Earth homecoming needs an actual simulation');return sim.snapshot();}
function at(sim,p){
 const C=G.RealmCore,W=G.RealmWorldFoundations;if(!C||!(sim instanceof C.Simulation)||!p||![p.x,p.z,sim.state.player.x,sim.state.player.z].every(finite)||sim.worldDive)return false;
 const room=Object.hasOwn(p,'room')?p.room:D.room;if(sim.room!==room||Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)>2.8)return false;
 if(room===D.room)return W.walkable(room,p.x,p.z,.31)&&W.walkable(room,sim.state.player.x,sim.state.player.z,.31)&&W.segment(room,sim.state.player,p,.035);
 return room===null&&C.walkable(p.x,p.z,sim.navRoom,.31)&&C.walkable(sim.state.player.x,sim.state.player.z,sim.navRoom,.31)&&C.segment(sim.state.player,p,sim.navRoom,.035);
}
function commit(sim,candidate,io,text,ctx){
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 const state=sim.state,room=sim.room,active=ctx?.active,before=JSON.stringify(state);
 candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'earth-homecoming',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=validateWorld(candidate);const encoded=JSON.stringify(checked);saved=io?.save?.(checked);if(JSON.stringify(checked)!==encoded)return fail('The writer changed the checked account; nothing was adopted.');}catch(e){return fail('Homecoming save refused: '+e.message);}
 if(!saved?.ok||typeof saved.then==='function')return fail(saved?.error||'The account could not be saved. Your work and fee remain unchanged.');
 if(sim.state!==state||sim.room!==room||JSON.stringify(state)!==before||(ctx&&ctx.active!==active))return fail('The character changed during saving. Reopen the current account before continuing.');
 state.earthHomecoming=checked.earthHomecoming;for(const k of['xp','coins','ore','revision'])state.adventure[k]=checked.adventure[k];
 Object.assign(state.sandbox.inventory,checked.sandbox.inventory);state.journal=checked.journal;state.nextEvent=checked.nextEvent;return{ok:true,text};
}
function runtime(sim){let r=sim.earthHomecomingRuntime;if(!r||r.room!==sim.room||runtimeOwners.get(r)!==sim.state){r=sim.earthHomecomingRuntime={room:sim.room};runtimeOwners.set(r,sim.state);}return r;}
function command(ctx,type,payload,io){
 const sim=ctx?.sim,C=G.RealmCore;
 if(!C||!(sim instanceof C.Simulation)||!payload||typeof payload!=='object'||Array.isArray(payload)||payload.quest!==D.id||![null,D.room].includes(sim.room)||sim.worldDive||sim.state.adventure.hp<=0)return fail('Reach Oren or the Earth road on dry ground while able to act.');
 if(typeof ctx.active!=='string'||!ctx.active||payload.expectedActive!==ctx.active||!Number.isSafeInteger(payload.expectedRevision)||payload.expectedRevision!==sim.state.adventure.revision)return fail('The character or account changed. Read the current terms again.');
 let candidate;try{candidate=snapshot(sim);}catch(e){return fail('Homecoming state refused: '+e.message);}
 const q=candidate.earthHomecoming;if(!eligible(candidate))return fail('Bring home the independently completed and paid road, realm and Open Confluence accounts first.');
 if(type==='claim'&&q.claimed)return{ok:true,duplicate:true,text:'Oren has already paid this account once. Your chosen outcome remains.'};
 if(type==='accept'&&q.accepted)return{ok:true,duplicate:true,text:'This homecoming is already accepted; your saved work remains.'};
 let text,reward=null;
 if(type==='accept'){
  if(!at(sim,D.giver))return fail('Speak to Oren at the workshop before taking this account.');q.accepted=true;text=D.title+' accepted. Bring the checked records to Vessa and Merren, then examine the new claim at the junction.';
 }else if(type==='step'){
  const s=step(payload.step);if(!q.accepted||q.claimed||!s||s.kind!=='interact')return fail('Only available physical work can be recorded here. The actual encounter must settle the Regent’s local seizure.');
  if(!at(sim,s))return fail('Reach '+s.name+' by its supported dry approach.');
  if(q.steps.includes(s.id))return{ok:true,duplicate:true,text:'This physical action is already recorded.'};
  if(!allowed(q,s))return fail('Complete the stated earlier work before '+s.name+'.');q.steps.push(s.id);text=s.text;
 }else if(type==='choose'){
  const s=step('aftermath'),choice=D.choices.find(c=>c.id===payload.choice);if(!q.accepted||q.claimed||!choice||!at(sim,s))return fail('Return to the quiet claim engine to choose its aftermath.');
  if(q.choice!==null)return q.choice===choice.id?{ok:true,duplicate:true,text:'That aftermath is already retained.'}:fail('The recorded aftermath cannot be overwritten.');
  if(!allowed(q,s))return fail('Repel the local seizure and make the passage safe before choosing.');q.choice=choice.id;q.steps.push(s.id);text=choice.name+' recorded. '+choice.consequence;
 }else if(type==='claim'){
  if(!ready(candidate)||!at(sim,D.claim))return fail('Check the free return road and bring its account physically home to Oren before taking payment.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=D.reward;
  if(a.coins+fee.coins>9999||a.ore+fee.ore>9999||Object.entries(fee.materials).some(([k,n])=>!Object.hasOwn(inv,k)||inv[k]+n>G.RealmSandbox.MAX))return fail('Make room for the whole fee: 20 sunmarks, 4 ore, 4 timber, 3 fibre and 1 crystal. Your completed account remains unpaid.');
  reward={...copy(fee),xp:Math.min(fee.xp,9999-a.xp)};a.xp+=reward.xp;a.coins+=fee.coins;a.ore+=fee.ore;for(const[k,n]of Object.entries(fee.materials))inv[k]+=n;q.claimed=true;
  text='Oren paid '+reward.xp+' XP, 20 sunmarks, 4 ore, 4 timber, 3 fibre and 1 crystal once. '+D.choices.find(c=>c.id===q.choice).name+' remains; the road and ordinary exploration stay open.';
 }else return fail('Unknown homecoming action.');
 const result=commit(sim,candidate,io,text,ctx);if(result.ok&&reward)result.reward=reward;return result;
}
function enemies(sim){const r=sim?.state?.earthHomecoming,t=D.enemy;return sim?.room===D.room&&!sim.worldDive&&eligible(sim.state)&&r?.accepted&&t.spawnAfter.every(id=>r.steps.includes(id))&&!r.steps.includes(t.defeatStep)?[{...t,originX:t.x,originZ:t.z,earthHomecoming:D.id,xp:0,coins:0,ore:0,windup:P['claim-lane'].windup,recovery:P['claim-lane'].recovery,telegraphRadius:0}]:[];}
const signature=sim=>enemies(sim).map(e=>e.id).join('|');
function encounter(e){return e?.earthHomecoming===D.id&&e.id===D.enemy.id?D.enemy:null;}
function owned(sim,e,alive=true){
 const t=encounter(e),r=sim?.state?.earthHomecoming,A=G.RealmAdventure;
 if(!G.RealmCore||!(sim instanceof G.RealmCore.Simulation)||!t)return false;
 const actual=A.runtime(sim);
 const ok=(!actorStates.has(e)||actorStates.get(e)===sim.state)&&(!actorSims.has(e)||actorSims.get(e)===sim)&&(!actorRuntimes.has(e)||actorRuntimes.get(e)===actual)&&actual.room===D.room&&sim.room===D.room&&!sim.worldDive&&eligible(sim.state)&&r?.accepted&&t.spawnAfter.every(id=>r.steps.includes(id))&&!r.steps.includes(t.defeatStep)&&e.originX===t.x&&e.originZ===t.z&&e.x===t.x&&e.z===t.z&&e.kind===t.kind&&e.radius===t.radius&&e.maxHP===t.hp&&e.damage===t.damage&&e.anchored===true&&finite(e.hp)&&(alive?e.hp>0&&e.hp<=t.hp:e.hp===0)&&actual.enemies.includes(e)&&actual.enemies.filter(a=>a.id===t.id).length===1&&G.RealmWorldFoundations.walkable(D.room,e.x,e.z,e.radius);
 if(ok){actorSims.set(e,sim);actorStates.set(e,sim.state);actorRuntimes.set(e,actual);}return !!ok;
}
function canDamage(sim,e){return !sim?.paused&&sim?.state?.adventure?.hp>0&&owned(sim,e);}
const contactReach=p=>Math.min(p.reach,(p.kind==='annulus'?p.outerRadius:p.length)+.24);
function pattern(e,sim=actorSims.get(e)){
 const t=encounter(e);if(!t)return null;const band=t.phases.find(p=>e.hp>p.aboveHP)||t.phases.at(-1),cycle=Number.isSafeInteger(e.homecomingCycle)&&e.homecomingCycle>=0?e.homecomingCycle:0;
 let id=band.order[cycle%band.order.length],p=P[id];const distance=sim?Math.hypot(sim.state.player.x-e.x,sim.state.player.z-e.z):0;
 if(distance>contactReach(p)&&distance<=contactReach(P['false-shelter'])){id='false-shelter';p=P[id];}
 return{...p,id,phase:band.id,windup:p.windup+(id==='claim-lane'&&sim?.state?.earthHomecoming?.steps.includes('supplied-screen') ? .4 : 0)};
}
/* Full transformed-width support/cover algorithm shared in shape with the
 * installed Cosmos owner, but reads only the actual Earth definition. */
function clipPoly(poly,key,bound,greater){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=greater?a[key]>=bound:a[key]<=bound,ib=greater?b[key]>=bound:b[key]<=bound;if(ia)out.push(a);if(ia!==ib){const t=(bound-a[key])/(b[key]-a[key]);out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}return out;}
function area(poly){let n=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];n+=a.x*b.z-b.x*a.z;}return Math.abs(n)/2;}
function cells(bounds,patches,uncovered){
 const relevant=patches.filter(p=>p.x+p.w/2>=bounds.minX&&p.x-p.w/2<=bounds.maxX&&p.z+p.d/2>=bounds.minZ&&p.z-p.d/2<=bounds.maxZ),xs=[bounds.minX,bounds.maxX],zs=[bounds.minZ,bounds.maxZ];
 for(const p of relevant){for(const x of[p.x-p.w/2,p.x+p.w/2])if(x>bounds.minX&&x<bounds.maxX)xs.push(x);for(const z of[p.z-p.d/2,p.z+p.d/2])if(z>bounds.minZ&&z<bounds.maxZ)zs.push(z);}xs.sort((a,b)=>a-b);zs.sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){if(xs[i]-xs[i-1]<1e-10||zs[j]-zs[j-1]<1e-10)continue;const x=(xs[i]+xs[i-1])/2,z=(zs[j]+zs[j-1])/2;if(relevant.some(p=>Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2))continue;if(uncovered(xs[i-1],xs[i],zs[j-1],zs[j]))return false;}return true;
}
function covered(poly,patches){return cells({minX:Math.min(...poly.map(p=>p.x)),maxX:Math.max(...poly.map(p=>p.x)),minZ:Math.min(...poly.map(p=>p.z)),maxZ:Math.max(...poly.map(p=>p.z))},patches,(x0,x1,z0,z1)=>{let q=clipPoly(poly,'x',x0,true);q=clipPoly(q,'x',x1,false);q=clipPoly(q,'z',z0,true);q=clipPoly(q,'z',z1,false);return area(q)>1e-10;});}
function clippedLine(sim,s){
 const world=G.RealmWorldFoundations.definition(D.room);if(!world?.patches||!world.solids)return 0;const sin=Math.sin(s.yaw),cos=Math.cos(s.yaw),margin=.24;let length=s.length;
 for(const p of world.solids){let poly=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{const x=p.x+a*(p.w/2+margin)-s.x,z=p.z+b*(p.d/2+margin)-s.z;return{x:x*cos-z*sin,z:x*sin+z*cos};});poly=clipPoly(poly,'x',-s.halfWidth,true);poly=clipPoly(poly,'x',s.halfWidth,false);poly=clipPoly(poly,'z',0,true);if(poly.length)length=Math.min(length,Math.max(0,Math.min(...poly.map(p=>p.z))-.005));}
 const supported=n=>covered([[-s.halfWidth-margin,-margin],[s.halfWidth+margin,-margin],[s.halfWidth+margin,n+margin],[-s.halfWidth-margin,n+margin]].map(([side,forward])=>({x:s.x+cos*side+sin*forward,z:s.z-sin*side+cos*forward})),world.patches);
 if(length<=0||!supported(Math.min(length,1e-6)))return 0;if(!supported(length)){let lo=0,hi=length;for(let i=0;i<25;i++){const mid=(lo+hi)/2;if(supported(mid))lo=mid;else hi=mid;}length=Math.max(0,lo-.005);}return length;
}
function ringSupported(sim,s){const world=G.RealmWorldFoundations.definition(D.room),r=s.outerRadius+.24;if(!world?.patches)return false;return cells({minX:s.x-r,maxX:s.x+r,minZ:s.z-r,maxZ:s.z+r},world.patches,(x0,x1,z0,z1)=>Math.hypot(Math.max(x0-s.x,0,s.x-x1),Math.max(z0-s.z,0,s.z-z1))<r-1e-8);}
function lock(sim,e){
 if(!canDamage(sim,e)||!['idle','alert'].includes(e.mode)||![sim.state.player.x,sim.state.player.z].every(finite))return false;
 const p=pattern(e,sim),distance=Math.hypot(sim.state.player.x-e.x,sim.state.player.z-e.z);if(distance>contactReach(p)||!G.RealmWorldFoundations.segment(D.room,e,sim.state.player,.04))return false;
 const yaw=Math.atan2(sim.state.player.x-e.x,sim.state.player.z-e.z),frame={kind:p.kind,x:e.x,z:e.z,yaw,pattern:p.id,phase:p.phase};
 if(p.kind==='line'){frame.halfWidth=p.halfWidth;frame.length=clippedLine(sim,{...frame,length:p.length});if(frame.length<=0)return false;}
 else{frame.innerRadius=p.innerRadius;frame.outerRadius=p.outerRadius;if(!ringSupported(sim,frame))return false;}
 e.yaw=yaw;e.windup=p.windup;e.recovery=p.recovery;e.homecomingCycle=(Number.isSafeInteger(e.homecomingCycle)?e.homecomingCycle:0)+1;e.strike=Object.freeze(frame);locks.set(e,{sim,state:sim.state,frame:e.strike});return e.strike;
}
function strikeContains(e,p){
 const entry=locks.get(e),s=e?.strike;if(!entry||entry.frame!==s||entry.state!==entry.sim.state||!owned(entry.sim,e)||![p?.x,p?.z].every(finite))return false;
 const W=G.RealmWorldFoundations;if(!W.walkable(D.room,p.x,p.z,.31)||!W.segment(D.room,s,p,.04))return false;
 const dx=p.x-s.x,dz=p.z-s.z,margin=.24,distance=Math.hypot(dx,dz);
 if(s.kind==='annulus')return distance>=Math.max(0,s.innerRadius-margin)&&distance<=s.outerRadius+margin;
 if(s.kind==='line'){const forward=dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw),side=dx*Math.cos(s.yaw)-dz*Math.sin(s.yaw);return s.length>0&&Math.hypot(Math.max(0,Math.abs(side)-s.halfWidth),Math.max(0,-forward,forward-s.length))<=margin;}return false;
}
function defeat(sim,e){
 if(sim?.paused||sim?.state?.adventure?.hp<=0||!owned(sim,e,false))return false;
 let candidate;try{candidate=snapshot(sim);candidate.earthHomecoming.steps.push(D.enemy.defeatStep);}catch(error){e.hp=1;G.RealmAdventure.notify(sim,'Homecoming account refused: '+error.message);return false;}
 const result=commit(sim,candidate,{save:sim.earthHomecomingSave},step(D.enemy.defeatStep).text);if(!result.ok){e.hp=1;G.RealmAdventure.notify(sim,result.error);return false;}locks.delete(e);return true;
}
const api={definition:D,patterns:P,fresh,validate,validateWorld,snapshot,missing,eligible,evidence,required,available,ready,at,command,runtime,enemies,signature,encounter,owned,canDamage,pattern,lock,strikeContains,defeat};
G.RealmEarthHomecoming=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
