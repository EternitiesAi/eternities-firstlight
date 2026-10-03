/* ET11/ET12-inspired local work. Pure definitions and candidate transactions;
 * actual movement/combat and the durable saver remain production authorities. */
(function(G){'use strict';
const clone=o=>JSON.parse(JSON.stringify(o)),fail=error=>({ok:false,error}),MAX_RUN=1000000;
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const point=(id,name,kind,x,z,requires,text)=>({id,name,kind,x,z,y:1.57,medium:'dry',requires,text});
const giver={id:'elderweald-rill',name:'Rill · forestkeeper',x:-67,z:-4,y:1.57,medium:'dry'};
const definition=freeze({
 id:'earth-stormfall-living-road-v1',realm:'earthlands',title:'Stormfall and the Living Road',giver,
 summary:'A storm has damaged the woodland route. Recover practical supplies, clear two infestations, and brace the living root-channel before delivering your chosen allocation. Rill asks for field work.',
 danger:'Two accepted encounters: 64 / 136 health and 9 / 11 damage, fixed for every weapon. Their 1.35-second tells and 2.3-second recovery leave room to Brace or retreat. Your free road home remains available.',
 reward:{xp:45,coins:18,ore:3},
 completionText:'The allocation is delivered and a separate brace carries the damaged connection. The old root organism remains alive. Rill recognizes your chosen practical approach; one Trailward binding is available at an outdoor home workbench.',
 steps:[
  point('assess-load','Read the camp load board','interact',-76,-12,[],'Rill: The road and the watercourse share this load. Read what each needs before choosing a supply.'),
  {...point('prepare-allocation','Choose and prepare the supply','interact',-76,-12,['assess-load'],'Choose a physical preparation; the allocation is retained when you return.'),choices:[
   {id:'stormfall-recovery',name:'Recover stormfall',x:-82,z:-18,y:1.57,materials:{wood:8,fiber:4},text:'Recover already fallen timber and bind it for transport. The standing refuge stays intact. This pays 8 timber and 4 fibre; the binding needs two additional fibre from gathering or one patrol.'},
   {id:'managed-coppice',name:'Prepare managed coppice',x:-78,z:-2,y:1.57,materials:{wood:4,fiber:8},text:'Prepare a limited managed allocation with more binding fibre. This pays 4 timber and 8 fibre; the binding can be afforded from this allocation once the currency is claimed.'}
  ]},
  point('read-water','Check the wetland watercourse','interact',-109,-28,['prepare-allocation'],'Read the watercourse before moving the load. The supply plan leaves this refuge and its drainage open.'),
  point('clear-crossing','Clear the crossing infestation','defeat',-119,-44,['read-water'],'Disable the accepted Channel skitter through actual weapon impacts; the crossing itself stays supported and your exit stays free.'),
  point('read-root-load','Read the living root anchor','interact',-148,-66,['clear-crossing'],'The old organism carries part of the route. Read the damaged connection; cutting the living support away would transfer its load into the breach.'),
  point('clear-root-pests','Clear the root-bank infestation','defeat',-134,-70,['read-root-load'],'Disable the accepted Root-bank brute in the open bank pocket, away from the passage walls.'),
  point('brace-root-channel','Fit the alternate route brace','interact',-145,-84,['clear-root-pests'],'Fit the prepared alternate brace before releasing the damaged connection. The old organism stays alive; this records one local support repair.'),
  point('deliver-allocation','Deliver the chosen allocation','interact',-106,-105,['brace-root-channel'],'Deliver the retained practical allocation at the return glade. Return to Rill to explicitly claim the declared currency and materials.')
 ],
 enemies:[
  {id:'earth-stormfall-crossing-v1',name:'Channel skitter',kind:'skitter',x:-119,z:-44,hp:64,damage:9,spawnAfter:['read-water'],defeatStep:'clear-crossing'},
  {id:'earth-stormfall-root-v1',name:'Root-bank brute',kind:'sentinel',x:-134,z:-70,hp:136,damage:11,spawnAfter:['read-root-load'],defeatStep:'clear-root-pests'}
 ]
});
const patrol=freeze({
 id:'earth-living-road-patrol-v1',realm:'earthlands',title:'Living Road patrol',giver,
 summary:'After the first delivery is claimed, intentionally accept a new inspection circuit. Each accepted run owns new encounters and one payment; the living organism is never killed, reset or repaired again for payment.',
 danger:definition.danger,reward:{xp:5,coins:4,ore:3,materials:{wood:2,fiber:2}},
 completionText:'The accepted inspection circuit is recorded and paid once. Your first support repair and allocation remain recognized.',
 steps:[
  point('inspect-water','Inspect the wetland course','interact',-109,-28,[],'Check that the wetland course remains open for this accepted patrol.'),
  point('clear-crossing','Clear the patrol crossing pocket','defeat',-119,-44,['inspect-water'],'Clear this run’s actual crossing infestation; an old defeat cannot satisfy a new patrol.'),
  point('inspect-root','Inspect the supported root passage','interact',-148,-66,['clear-crossing'],'Inspect the existing alternate support. This is an inspection, not a repeated rescue or a new repair.'),
  point('clear-root-pests','Clear the patrol bank pocket','defeat',-134,-70,['inspect-root'],'Clear this run’s actual bank infestation; the living root anchor is not a foe.'),
  point('inspect-glade','Record the return glade','interact',-106,-105,['clear-root-pests'],'Record the end of this patrol and return to Rill for its explicitly declared payment.')
 ],
 enemies:[
  {id:'crossing',name:'Patrol channel skitter',kind:'skitter',x:-119,z:-44,hp:64,damage:9,spawnAfter:['inspect-water'],defeatStep:'clear-crossing'},
  {id:'root',name:'Patrol root-bank brute',kind:'sentinel',x:-134,z:-70,hp:136,damage:11,spawnAfter:['inspect-root'],defeatStep:'clear-root-pests'}
 ]
});
const BINDING_COST=freeze({ore:3,coins:8,fiber:6});
const fresh=()=>({version:1,story:{accepted:false,branch:null,steps:[],claimed:false},patrol:{lastClaim:0,active:null}});
const freshBinding=()=>({version:1,weapon:null,kind:null});
const exact=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
function checkSteps(steps,d){
 if(!Array.isArray(steps)||new Set(steps).size!==steps.length||steps.some(id=>!d.steps.some(s=>s.id===id)))throw Error('Invalid Earth expedition: steps');
 if(steps.some(id=>d.steps.find(s=>s.id===id).requires.some(p=>!steps.includes(p))))throw Error('Invalid Earth expedition: prerequisites');
 return d.steps.filter(s=>steps.includes(s.id)).map(s=>s.id);
}
function validate(raw){
 if(raw===undefined)return fresh();const no=why=>{throw Error('Invalid Earth expedition: '+why);};
 if(!exact(raw,['version','story','patrol'])||raw.version!==1||!exact(raw.story,['accepted','branch','steps','claimed'])||!exact(raw.patrol,['lastClaim','active']))no('version or shape');
 const r=raw.story;if(typeof r.accepted!=='boolean'||typeof r.claimed!=='boolean'||!(r.branch===null||definition.steps[1].choices.some(c=>c.id===r.branch)))no('story');
 const steps=checkSteps(r.steps,definition);if((r.branch!==null)!==steps.includes('prepare-allocation'))no('allocation');
 if(!r.accepted&&(steps.length||r.branch!==null||r.claimed)||r.claimed&&steps.length!==definition.steps.length)no('unearned story');
 const p=raw.patrol;if(!Number.isSafeInteger(p.lastClaim)||p.lastClaim<0||p.lastClaim>MAX_RUN||!r.claimed&&(p.lastClaim||p.active!==null))no('patrol ownership');
 let active=null;if(p.active!==null){if(!exact(p.active,['run','steps'])||!Number.isSafeInteger(p.active.run)||p.active.run!==p.lastClaim+1||p.active.run>MAX_RUN)no('patrol identity');active={run:p.active.run,steps:checkSteps(p.active.steps,patrol)};}
 return{version:1,story:{accepted:r.accepted,branch:r.branch,steps,claimed:r.claimed},patrol:{lastClaim:p.lastClaim,active}};
}
function validateBinding(raw,a,gear){
 if(!exact(raw,['version','weapon','kind'])||raw.version!==1)throw Error('Invalid Earth binding: version or shape');
 if(raw.weapon===null&&raw.kind===null)return freshBinding();
 if(typeof raw.weapon!=='string'||!['edge','shelter'].includes(raw.kind)||!Array.isArray(a?.owned)||!a.owned.includes(raw.weapon)||!Object.hasOwn(gear||{},raw.weapon)||gear[raw.weapon].slot!=='weapon'||gear[raw.weapon].style&&!['blade','bow'].includes(gear[raw.weapon].style))throw Error('Invalid Earth binding: ownership or choice');
 return{version:1,weapon:raw.weapon,kind:raw.kind};
}
function bonus(a,id){
 const b=a?.earthBinding;if(!b||b.weapon!==id||a.equipment?.weapon!==id)return{attack:0,defense:0,maxHP:0};
 return b.kind==='edge'?{attack:2,defense:0,maxHP:0}:b.kind==='shelter'?{attack:0,defense:1,maxHP:10}:{attack:0,defense:0,maxHP:0};
}
function ledger(value){return value?.state?value.state.earthExpedition||fresh():value||fresh();}
function progress(value){
 const r=ledger(value),s=r.story,p=r.patrol.active;
 const project=(d,steps)=>({done:steps.length,total:d.steps.length,ready:steps.length===d.steps.length,next:d.steps.filter(s=>!steps.includes(s.id)&&s.requires.every(id=>steps.includes(id)))});
 return{story:{accepted:s.accepted,branch:s.branch,claimed:s.claimed,...project(definition,s.steps)},patrol:{lastClaim:r.patrol.lastClaim,active:p?clone(p):null,...project(patrol,p?.steps||[])},bindingUnlocked:s.claimed};
}
function points(value){
 const p=progress(value),out=[];
 const add=(next,quest,run)=>{for(const s of next.filter(s=>s.kind==='interact')){
  if(s.choices)for(const c of s.choices)out.push({...s,...c,id:s.id,choice:c.id,quest,run});
  else out.push({...s,choice:null,quest,run});
 }};
 if(p.story.accepted&&!p.story.claimed)add(p.story.next,definition.id,null);
 if(p.patrol.active)add(p.patrol.next,patrol.id,p.patrol.active.run);return out;
}
function at(sim,p){
 const W=G.RealmWorldFoundations,player=sim.state.player;
 return !!W&&!sim.worldDive&&[player.x,player.z,p.x,p.z,p.y].every(Number.isFinite)&&Math.hypot(player.x-p.x,player.z-p.z)<=2.8&&Math.abs(W.height(sim.room,player.x,player.z)-p.y)<.08&&W.walkable(sim.room,player.x,player.z)&&W.walkable(sim.room,p.x,p.z)&&W.segment(sim.room,player,p);
}
function commit(sim,candidate,io,text){
 if(typeof io?.save!=='function')return fail('A durable expedition saver is required. Nothing was paid or spent.');
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this world before continuing: record limit reached.');
 candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'earth-expedition',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=G.RealmCore.validate(candidate);if(JSON.stringify(checked.earthExpedition)!==JSON.stringify(validate(candidate.earthExpedition))||JSON.stringify(checked.adventure.earthBinding)!==JSON.stringify(candidate.adventure.earthBinding))throw Error('Current save validator does not retain the expedition and binding contract.');saved=io.save(checked);}catch(e){return fail('Expedition save refused: '+e.message);}
 if(saved?.then||!saved?.ok)return fail(saved?.error||'Expedition save refused. Finished work remains unpaid; nothing was changed.');
 sim.state.earthExpedition=checked.earthExpedition;Object.assign(sim.state.adventure,checked.adventure);Object.assign(sim.state.sandbox,checked.sandbox);sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;return{ok:true,text};
}
function pay(candidate,reward){
 const a=candidate.adventure,inv=candidate.sandbox.inventory,max=G.RealmSandbox.MAX;
 if(a.coins+reward.coins>9999||a.ore+reward.ore>9999||Object.entries(reward.materials||{}).some(([k,n])=>!Object.hasOwn(inv,k)||inv[k]+n>max))return null;
 const credited={...reward,xp:Math.min(9999-a.xp,reward.xp)};a.xp+=credited.xp;a.coins+=reward.coins;a.ore+=reward.ore;for(const[k,n]of Object.entries(reward.materials||{}))inv[k]+=n;return credited;
}
function command(ctx,type,payload={},io){
 const sim=ctx.sim,A=G.RealmAdventure,W=G.RealmWorldFoundations;
 if(typeof type!=='string'||!payload||typeof payload!=='object')return fail('Unknown expedition action.');
 if(W?.definition(sim.room)?.id!=='earthlands'||sim.worldDive||sim.state.adventure.hp<=0||!sim.state.adventure.started)return fail('Reach Earth while able to act, with Oren’s initial expedition kit.');
 const repeat=type.startsWith('patrol-'),d=repeat?patrol:definition;if(payload.quest!==d.id)return fail('Read this exact expedition contract before acting.');
 let current;try{current=validate(sim.state.earthExpedition);}catch(e){return fail(e.message);}
 if(repeat){if(!Number.isSafeInteger(payload.run)||payload.run<1||payload.run>MAX_RUN||payload.priorClaim!==payload.run-1)return fail('This patrol invitation has an invalid run identity.');if(type==='patrol-claim'&&payload.run<=current.patrol.lastClaim)return{ok:true,duplicate:true,text:'That accepted patrol was already paid. No new run was claimed.'};if(payload.priorClaim!==current.patrol.lastClaim)return fail('This patrol invitation is stale. Read the current run and payment again.');}
 const candidate=sim.snapshot();candidate.earthExpedition=clone(current);const r=repeat?candidate.earthExpedition.patrol:candidate.earthExpedition.story;let text,reward=null;
 if(type==='accept'||type==='patrol-accept'){
  if(!at(sim,giver))return fail('Speak to Rill at the camp to explicitly accept this work.');
  if(repeat){if(!current.story.claimed)return fail('Claim the first living-road delivery before accepting a patrol.');if(r.active)return{ok:true,duplicate:true,text:'This exact patrol is already accepted; its progress is retained.'};r.active={run:payload.run,steps:[]};}
  else{if(r.accepted)return{ok:true,duplicate:true,text:'The first delivery is already accepted; its allocation and progress are retained.'};r.accepted=true;}
  text=d.title+(repeat?' · run '+payload.run:'')+' explicitly accepted. The route, danger and fixed payment are retained.';
 }else if(type==='step'||type==='patrol-step'){
  const record=repeat?r.active:r,s=d.steps.find(s=>s.id===payload.step);
  if(!record||repeat&&record.run!==payload.run||!repeat&&!r.accepted||!s||s.kind!=='interact')return fail('Only an accepted physical interaction can be recorded.');
  if(record.steps.includes(s.id))return{ok:true,duplicate:true,text:'This accepted action is already recorded.'};
  const choice=s.choices?.find(c=>c.id===payload.branch),anchor=s.choices?choice:s;
  if(!anchor||!at(sim,anchor)||!s.requires.every(id=>record.steps.includes(id)))return fail('Reach '+s.name+' and finish its declared prerequisites.');
  record.steps.push(s.id);if(choice)r.branch=choice.id;text=choice?choice.text:s.text;
 }else if(type==='claim'||type==='patrol-claim'){
  if(!repeat&&r.claimed)return{ok:true,duplicate:true,text:'The first delivery was already paid once.'};
  const record=repeat?r.active:r;if(!record||repeat&&record.run!==payload.run||!repeat&&!r.accepted||!d.steps.every(s=>record.steps.includes(s.id))||!at(sim,giver))return fail('Complete this accepted circuit and return to Rill to explicitly claim.');
  const declared=repeat?d.reward:{...d.reward,materials:definition.steps[1].choices.find(c=>c.id===r.branch).materials};reward=pay(candidate,declared);if(!reward)return fail('Make room for the complete declared payment. Finished work remains ready; nothing was changed.');
  if(repeat){r.lastClaim=payload.run;r.active=null;}else r.claimed=true;
  text=d.title+' paid once · +'+reward.xp+' XP · +'+reward.coins+' sunmarks · +'+reward.ore+' ore'+Object.entries(reward.materials).map(([k,n])=>' · +'+n+' '+k).join('')+'. '+(reward.xp<declared.xp?'Stored XP remains at its existing 9999 cap. ':'')+d.completionText;
 }else return fail('Unknown expedition action.');
 const beforeLevel=A.level(sim.state.adventure),result=commit(sim,candidate,io,text);if(result.ok){if(reward){result.reward=reward;if(A.level(sim.state.adventure)>beforeLevel)A.notify(sim,'Level '+A.level(sim.state.adventure)+' · the living road recognizes useful work.');}A.syncScene(sim);}return result;
}
function enemyId(d,e,run){return d===patrol?patrol.id+'-run-'+run+'-'+e.id:e.id;}
function enemies(sim){
 if(sim.worldDive||G.RealmWorldFoundations?.definition(sim.room)?.id!=='earthlands')return[];
 const r=sim.state.earthExpedition;if(!r)return[];const out=[];
 for(const d of[definition,patrol]){const record=d===definition?r.story:r.patrol.active;if(!record||d===definition&&!record.accepted)continue;
  for(const e of d.enemies)if(!record.steps.includes(e.defeatStep)&&e.spawnAfter.every(id=>record.steps.includes(id)))out.push({...e,id:enemyId(d,e,record.run),expeditionQuest:d.id,expeditionRun:d===patrol?record.run:null,xp:0,coins:0,ore:0,windup:1.35,recovery:2.3});
 }return out;
}
function signature(sim){return enemies(sim).map(e=>e.id).join('|');}
function defeat(sim,e){
 const A=G.RealmAdventure,d=e?.expeditionQuest===definition.id?definition:e?.expeditionQuest===patrol.id?patrol:null;
 if(!d||e.hp!==0||!A.runtime(sim).enemies.includes(e)||G.RealmWorldFoundations?.definition(sim.room)?.id!=='earthlands'||sim.worldDive)return false;
 const r=sim.state.earthExpedition,record=d===definition?r?.story:r?.patrol.active,terms=d.enemies.find(v=>enemyId(d,v,record?.run)===e.id);
 if(!record||d===definition&&!record.accepted||!terms||e.expeditionRun!==(d===patrol?record.run:null)||!terms.spawnAfter.every(id=>record.steps.includes(id)))return false;
 if(record.steps.includes(terms.defeatStep))return true;
 const candidate=sim.snapshot();candidate.earthExpedition=clone(r);(d===definition?candidate.earthExpedition.story:candidate.earthExpedition.patrol.active).steps.push(terms.defeatStep);
 const result=commit(sim,candidate,{save:sim.earthExpeditionSave},e.name+' cleared through actual combat for '+d.title+(d===patrol?' run '+record.run:'')+'. No legacy loot or XP is paid.');
 if(!result.ok){e.hp=1;A.notify(sim,result.error);return false;}return true;
}
function bindingCommand(ctx,weapon,kind,io){
 const sim=ctx.sim,A=G.RealmAdventure,a=sim.state.adventure,S=G.RealmSandbox;
 if(sim.room||sim.worldDive||a.hp<=0||!S.station(sim.state.sandbox,sim.state.player))return fail('Use an outdoor home workbench while able to act.');
 if(!sim.state.earthExpedition?.story.claimed)return fail('Complete and explicitly claim Stormfall and the Living Road before binding its lesson.');
 if(!a.earthBinding||a.earthBinding.weapon!==null)return fail('This character’s one Trailward binding is already used or unavailable.');
 try{validateBinding({version:1,weapon,kind},a,A.GEAR);}catch{return fail('Choose an owned canonical blade or bow and either edge or shelter.');}
 if(weapon===null||!['edge','shelter'].includes(kind))return fail('Choose a weapon and a binding; nothing is automatically equipped.');
 if(a.ore<BINDING_COST.ore||a.coins<BINDING_COST.coins||sim.state.sandbox.inventory.fiber<BINDING_COST.fiber)return fail('The binding needs 3 ore, 8 sunmarks and 6 fibre. Nothing was spent.');
 const candidate=sim.snapshot();candidate.earthExpedition=clone(sim.state.earthExpedition);candidate.adventure.ore-=BINDING_COST.ore;candidate.adventure.coins-=BINDING_COST.coins;candidate.sandbox.inventory.fiber-=BINDING_COST.fiber;candidate.adventure.earthBinding={version:1,weapon,kind};
 return commit(sim,candidate,io,'Trailward '+kind+' binding applied to '+A.GEAR[weapon].name+' · '+(kind==='edge'?'+2 attack':'+1 defense / +10 maximum HP')+'. Identity, sockets, earlier fittings and current health retained; nothing was equipped.');
}
const api={definition,patrol,MAX_RUN,BINDING_COST,fresh,validate,progress,points,at,commit,command,enemies,signature,defeat,freshBinding,validateBinding,bonus,bindingCommand};G.RealmEarthExpedition=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
