/* Local equipment projects. A contiguous paid-run ledger is separate from story rewards. */
(function(G){'use strict';
const VERSION=1,CONTRACT='riverbank-survey',TERMS=1;
const REWARD=Object.freeze({ore:3,coins:4,fiber:2});
const ENEMIES=Object.freeze([
 {objective:'west',name:'Bankroot skitter',kind:'skitter',x:-7,z:0,hp:38,damage:9},
 {objective:'east',name:'Reedback skitter',kind:'skitter',x:5,z:-6,hp:56,damage:12,windup:1.1,recovery:1.6,telegraphRadius:1.45}
]);
const SAMPLES=Object.freeze([
 {id:'west-sample',name:'Copper gravel sample',x:-7,z:3},
 {id:'east-sample',name:'Reed-fibre sample',x:5,z:-11}
]);
const FITTINGS=Object.freeze([
 {step:1,name:'River fitting I',attack:2,ore:3,coins:4,materials:{fiber:2}},
 {step:2,name:'River fitting II',attack:4,ore:6,coins:8,materials:{fiber:4}}
]);
const own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
const weapon=id=>own(G.RealmAdventure.GEAR,id)&&G.RealmAdventure.GEAR[id].slot==='weapon';
function fresh(){return{version:VERSION,pinned:null,claimed:0,active:null,fittings:{}};}
function stage(a,id){return a.pursuit?.fittings[id]||0;}
function bonus(a,id){return stage(a,id)*2;}
function source(id){
 const A=G.RealmAdventure,AR=G.RealmArsenal,q=AR.RECIPES[id];
 if(q?.gear)return{kind:'craft',label:'Craft at an outdoor workbench',recipe:id,materials:{...q.materials},ore:q.ore,coins:q.coins,requires:q.requires||null};
 if(id==='copper_blade')return{kind:'craft',label:'Forge at an outdoor workbench',recipe:id,materials:{},ore:A.FORGE.ore,coins:A.FORGE.coins,requires:null};
 if(id==='trail_blade')return{kind:'kit',label:'Oren’s initial expedition kit · received once'};
 if(id.startsWith('oren_'))return{kind:'story',label:'Oren’s supply quest · one reward choice, once; not survey loot'};
 return{kind:'story',label:'The envoy’s Chapter I gift · one choice, once; requires campaign progress'};
}
function catalogue(a){return Object.entries(G.RealmAdventure.GEAR).filter(([,g])=>g.slot==='weapon').map(([id,g])=>{
 const from=source(id),owned=a.owned.includes(id);
 return{id,name:g.name,style:g.style==='bow'?'bow':'blade',owned,pinnable:a.started&&(owned||from.kind==='craft'),source:from,tier:stage(a,id)};
});}
function recipe(a,id){
 if(!weapon(id))return null;
 if(a.owned.includes(id)){const f=FITTINGS[stage(a,id)];return f?{...f,materials:{...f.materials},id:'fit:'+id+':'+f.step,type:'pursuit-fit',payload:{weapon:id,step:f.step},requires:null}:null;}
 const s=source(id);if(s.kind!=='craft')return null;
 if(s.requires&&!a.owned.includes(s.requires))return recipe(a,s.requires);
 return{id:'craft:'+id,type:id==='copper_blade'?'forge':'arsenal-craft',payload:id==='copper_blade'?{}:{id},name:G.RealmAdventure.GEAR[id].name,materials:{...s.materials},ore:s.ore,coins:s.coins,requires:s.requires};
}
function compare(a,id){
 if(!weapon(id))return null;
 const A=G.RealmAdventure,AR=G.RealmArsenal,copy=JSON.parse(JSON.stringify(a));copy.equipment.weapon=id;
 const selected=A.stats(copy),next={...selected},step=a.owned.includes(id)?Math.min(2,stage(a,id)+1):0;
 if(a.owned.includes(id)&&stage(a,id)<2)next.attack+=2;
 return{current:A.stats(a),selected,next,beforeWeapon:AR.weapon(a),afterWeapon:AR.weapon(copy),socket:a.arsenal.sockets[id]||null,step};
}
function nextStep(a,id){
 const q=recipe(a,id);if(!q)return null;
 const result=q.type==='forge'?'copper_blade':q.type==='arsenal-craft'?q.payload.id:q.type==='pursuit-fit'?q.payload.weapon:null;
 if(!weapon(result))return null;
 const A=G.RealmAdventure,AR=G.RealmArsenal,copy=JSON.parse(JSON.stringify(a));
 if(q.type==='pursuit-fit')copy.pursuit.fittings[result]=q.payload.step;
 else if(!copy.owned.includes(result))copy.owned.push(result);
 copy.equipment.weapon=result;
 return{recipe:q,weapon:result,prerequisite:result!==id,current:A.stats(a),after:A.stats(copy),beforeWeapon:AR.weapon(a),afterWeapon:AR.weapon(copy),currentSocket:a.arsenal.sockets[a.equipment.weapon]||null,socket:copy.arsenal.sockets[result]||null};
}
function complete(a){const r=a.pursuit?.active;return !!r&&ENEMIES.every(e=>r.defeated.includes(e.objective))&&SAMPLES.every(s=>r.samples.includes(s.id));}
function validate(raw,a){
 if(raw===undefined)return fresh();
 const bad=m=>{throw Error('Invalid equipment pursuit: '+m);},object=o=>o&&typeof o==='object'&&!Array.isArray(o);
 if(!object(raw)||raw.version!==VERSION)bad('version');
 if(!Number.isSafeInteger(raw.claimed)||raw.claimed<0||raw.claimed>1e9)bad('paid run sequence');
 const p=fresh();p.claimed=raw.claimed;
 if(raw.pinned!==null&&!catalogue(a).some(g=>g.id===raw.pinned&&g.pinnable))bad('pinned project');p.pinned=raw.pinned;
 if(!object(raw.fittings))bad('fittings');
 for(const [id,n] of Object.entries(raw.fittings)){
  if(!weapon(id)||!a.owned.includes(id)||!Number.isInteger(n)||n<1||n>2)bad('owned finite fitting');p.fittings[id]=n;
 }
 if(raw.active!==null){
  const r=raw.active;if(!object(r)||r.id!==CONTRACT+'/'+(p.claimed+1)||r.terms!==TERMS||p.claimed>=1e9)bad('active run or terms');
  for(const [field,ids] of [['defeated',ENEMIES.map(e=>e.objective)],['samples',SAMPLES.map(s=>s.id)]]){
   if(!Array.isArray(r[field])||r[field].length>ids.length||new Set(r[field]).size!==r[field].length||r[field].some(id=>!ids.includes(id)))bad(field);
  }
  p.active={id:r.id,terms:r.terms,defeated:r.defeated.slice(),samples:r.samples.slice()};
 }
 if(!a.started&&(p.pinned||p.claimed||p.active||Object.keys(p.fittings).length))bad('kit prerequisite');
 return p;
}
function enemies(a){const r=a.pursuit?.active;return r?ENEMIES.filter(e=>!r.defeated.includes(e.objective)).map(e=>({...e,id:r.id+':'+e.objective,contractRun:r.id})):[];}
function points(sim){const r=sim.state.adventure.pursuit?.active;return sim.room===G.RealmStarter.ROOM&&r?SAMPLES.filter(p=>!r.samples.includes(p.id)).map(p=>({...p,kind:'survey'})):[];}
function defeat(sim,e){
 const a=sim.state.adventure,r=a.pursuit.active;
 if(sim.room!==G.RealmStarter.ROOM||!r||e.contractRun!==r.id||e.hp!==0||!ENEMIES.some(d=>d.objective===e.objective)||e.id!==r.id+':'+e.objective||r.defeated.includes(e.objective)||!G.RealmAdventure.runtime(sim).enemies.includes(e))return false;
 r.defeated.push(e.objective);a.revision=Math.min(1e9,a.revision+1);
 sim.event('survey',e.name+' cleared for '+r.id+'. The declared materials are paid once when this survey is returned.');
 G.RealmAdventure.notify(sim,e.name+' cleared · '+r.defeated.length+'/2 survey threats');return true;
}
function handle(sim,type,p={}){
 if(!type.startsWith('pursuit-'))return null;
 const A=G.RealmAdventure,Q=G.RealmStarter,AR=G.RealmArsenal,a=sim.state.adventure,h=a.pursuit,inv=sim.state.sandbox.inventory;
 const fail=error=>({ok:false,error}),yes=text=>({ok:true,text}),atOren=()=>!sim.room&&Q.near(sim,Q.OREN);
 if(!a.started)return fail('Take the initial expedition kit from Oren first.');
 switch(type){
 case'pursuit-pin':
  if(p.weapon!==null&&!catalogue(a).some(g=>g.id===p.weapon&&g.pinnable))return fail('Pin an owned weapon or a craftable local weapon. Story gifts stay separate.');
  if(h.pinned===p.weapon)return fail('That project is already selected.');h.pinned=p.weapon;return yes(p.weapon===null?'Equipment project unpinned.':A.GEAR[p.weapon].name+' pinned. The field guide shows the next real recipe.');
 case'pursuit-start':
  if(!atOren()||h.active||p.after!==h.claimed||h.claimed>=1e9)return fail('At Oren: explicitly begin the next survey after claiming the previous one. An unfinished run resumes.');
  h.active={id:CONTRACT+'/'+(h.claimed+1),terms:TERMS,defeated:[],samples:[]};
  sim.event('survey','Accepted '+h.active.id+': two skitters and two samples for 3 copper, 4 sunmarks and 2 fibre. Oren’s once-only quest is paused, not reset.');
  return yes('Survey accepted. Enter the nearby riverbank; partial objectives will be remembered.');
 case'pursuit-sample':{
  const r=h.active,s=SAMPLES.find(s=>s.id===p.id);
  if(sim.room!==Q.ROOM||!r||p.run!==r.id||!s||r.samples.includes(s.id)||!Q.near(sim,s,2.4)||!A.visible(sim,sim.state.player,s))return fail('Approach an unrecorded sample for the current survey.');
  r.samples.push(s.id);sim.event('survey',s.name+' recorded for '+r.id+'. '+r.samples.length+'/2 samples.');return yes(s.name+' recorded. Normal inventory is unchanged until the survey is claimed.');}
 case'pursuit-claim':{
  const r=h.active;
  if(!atOren()||!r||p.run!==r.id||!complete(a))return fail('Return this completed survey to Oren. Each run has one payout.');
  if(a.ore>9999-REWARD.ore||a.coins>9999-REWARD.coins||inv.fiber>G.RealmSandbox.MAX-REWARD.fiber)return fail('Make room for 3 copper, 4 sunmarks and 2 fibre. This completed survey stays unclaimed.');
  a.ore+=REWARD.ore;a.coins+=REWARD.coins;inv.fiber+=REWARD.fiber;h.claimed++;h.active=null;
  sim.event('survey',r.id+' paid: 3 copper, 4 sunmarks, 2 fibre. All surveys through '+h.claimed+' are claimed.');return yes('Survey paid · 3 copper, 4 sunmarks, 2 fibre. Begin another survey deliberately when ready.');}
 case'pursuit-fit':{
  const id=p.weapon,f=FITTINGS[stage(a,id)];
  if(!AR.atBench(sim)||!weapon(id)||!a.owned.includes(id)||!f||p.step!==f.step)return fail('At a workbench, choose the next of two fittings on an owned weapon.');
  if(a.ore<f.ore||a.coins<f.coins||Object.entries(f.materials).some(([k,n])=>inv[k]<n))return fail('More materials are needed. No part of the fitting cost was spent.');
  a.ore-=f.ore;a.coins-=f.coins;for(const[k,n]of Object.entries(f.materials))inv[k]-=n;h.fittings[id]=f.step;
  sim.event('craft',f.name+' fitted to '+A.GEAR[id].name+' for '+f.ore+' copper, '+f.coins+' sunmarks and '+f.materials.fiber+' fibre. Identity and socket retained.');
  return yes(f.name+' applied · +2 attack. Equip this weapon deliberately if it is not already equipped.');}
 default:return fail('Unknown equipment project command.');
 }
}
const api={VERSION,CONTRACT,TERMS,REWARD,ENEMIES,SAMPLES,FITTINGS,fresh,stage,bonus,source,catalogue,recipe,compare,nextStep,complete,validate,enemies,points,defeat,handle};
G.RealmPursuit=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
