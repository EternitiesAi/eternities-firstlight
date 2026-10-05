'use strict';
/* Actual Fenna/Living Road/Coastward callers, inherited world only. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const P=require('./connected_support.cjs'),C=P.load('core'),A=P.load('adventure'),AR=P.load('arsenal'),E=P.load('earth'),S=P.load('earth-story'),EE=P.load('earth-expedition'),W=P.load('world-foundations');
function run({input,bow,folder}){
 assert.equal(fs.existsSync(folder),false);fs.mkdirSync(folder,{recursive:true});
 const h=P.createInherited(input,bow),epoch=P.epoch(),baseline=h.sim.snapshot(),events=[],fights=[],links=[];h.walk=(x,z)=>P.physicalWalk(h,x,z);
 const snap=name=>P.write(folder,name,h.sim.snapshot());
 const reload=realm=>{h.reload(realm);h.sim.earthExpeditionSave=h.save;};
 const finish=name=>{const file=snap(name+'_FINAL_WORLD');links.push({chapter:name,path:file,sha256:P.sha(file)});reload();return file;};
 const rest=()=>{h.walk(0,3);h.command('rest');};
 const actEE=(type,p={})=>{h.sim.earthExpeditionSave=h.save;const r=EE.command(h.context(),type,{quest:EE.definition.id,...p},{save:h.save});assert.ok(r.ok,type+': '+r.error);events.push({owner:'earth-expedition',type,p,result:r});return r;};
 let stage='fenna';
 try{
  if(!h.sim.state.adventure.earthStory.claimed){
   rest();h.walk(E.GATE.x,E.GATE.z);const ctx=h.context(),p=E.preview(ctx);assert.ok(p.ok,p.error);assert.ok(E.enter(p.ticket,ctx,{save:h.save,build:()=>{}}).ok);
   h.walk(S.GIVER.x,S.GIVER.z);if(!h.sim.state.adventure.earthStory.accepted)h.command('earth-story-accept');
   const route=h.sim.state.adventure.earthStory.dispatch|| (bow?'quarry':'detour');
   for(const id of S.ROUTES.find(r=>r.id===route).steps){if(h.sim.state.adventure.earthStory.steps.includes(id))continue;const s=S.STEPS.find(s=>s.id===id);h.walk(s.x,s.z);h.command('earth-story-step',{id});}
   if(!h.sim.state.adventure.earthStory.dispatch){h.walk(S.GIVER.x,S.GIVER.z);h.command('earth-story-dispatch',{route});}
   h.walk(S.DESTINATION.x,S.DESTINATION.z);if(!h.sim.state.adventure.earthStory.arrived)h.command('earth-story-arrive');
   const unpaid=h.sim.snapshot();h.command('earth-story-claim');const paid=h.sim.snapshot();assert.equal(paid.adventure.coins-unpaid.adventure.coins,S.REWARD.coins);assert.equal(paid.adventure.ore-unpaid.adventure.ore,S.REWARD.ore);
   assert.equal(paid.sandbox.inventory.fiber-unpaid.sandbox.inventory.fiber,S.REWARD.fiber);assert.equal(paid.adventure.xp,unpaid.adventure.xp);
   assert.ok(E.leave(h.sim).ok);P.preserve(h.sim.snapshot(),baseline,['adventure.earthStory']);
  }else events.push({skippedPaid:'Fenna'});
  finish('01_FENNA');stage='living-road';const beforeEE=h.sim.snapshot();
  if(!h.sim.state.earthExpedition.story.claimed){
   rest();h.walk(W.GATE.x,W.GATE.z);h.enter('earthlands');h.sim.earthExpeditionSave=h.save;h.walk(EE.definition.giver.x,EE.definition.giver.z);
   if(!h.sim.state.earthExpedition.story.accepted)actEE('accept');
   for(const s of EE.definition.steps){
    if(h.sim.state.earthExpedition.story.steps.includes(s.id))continue;
    if(s.kind==='defeat'){
     const terms=EE.enemies(h.sim).find(e=>e.defeatStep===s.id&&e.expeditionQuest===EE.definition.id);assert.ok(terms);
     fights.push(P.fight(h,terms,()=>h.sim.state.earthExpedition.story.steps.includes(s.id)));
    }else{const choice=s.choices?.find(c=>c.id===(h.sim.state.earthExpedition.story.branch||(bow?'managed-coppice':'stormfall-recovery'))),p=choice||s;h.walk(p.x,p.z);actEE('step',{step:s.id,...(choice?{branch:choice.id}:{})});}
   }
   h.walk(EE.definition.giver.x,EE.definition.giver.z);const unpaid=h.sim.snapshot(),r=actEE('claim'),paid=h.sim.snapshot();
   for(const k of['xp','coins','ore'])assert.equal(paid.adventure[k]-unpaid.adventure[k],r.reward[k]);for(const[k,n]of Object.entries(r.reward.materials))assert.equal(paid.sandbox.inventory[k]-unpaid.sandbox.inventory[k],n);
   assert.equal(actEE('claim').duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);h.home();P.preserve(h.sim.snapshot(),beforeEE,['earthExpedition']);
  }else events.push({skippedPaid:'Living Road'});
  finish('02_LIVING_ROAD');stage='coastward-first-survey';const beforeSurvey=h.sim.snapshot();
  if(!h.sim.state.journeys.realms.earthlands.firstClaimed){
   rest();h.walk(W.GATE.x,W.GATE.z);h.enter('earthlands');const d=W.definition('earthlands'),giver=d.points.find(p=>p.id===d.quest.giverId);
   const act=(type,p={})=>{const r=W.command(h.context(),type,{realm:'earthlands',...p},{save:h.save});assert.ok(r.ok,type+': '+r.error);events.push({owner:'survey',type,p,result:r});return r;};
   h.walk(giver.x,giver.z);if(!h.sim.state.journeys.realms.earthlands.active)act('accept');const run=h.sim.state.journeys.realms.earthlands.active.run;
   for(const o of d.quest.objectives){if(h.sim.state.journeys.realms.earthlands.active.observed.includes(o.id))continue;const p=d.points.find(p=>p.id===o.pointId);h.walk(p.x,p.z);act('observe',{run,objective:o.id});}
   h.walk(giver.x,giver.z);const unpaid=h.sim.snapshot(),r=act('claim',{run}),paid=h.sim.snapshot();for(const k of['xp','coins','ore'])assert.equal(paid.adventure[k]-unpaid.adventure[k],r.reward[k]);
   assert.equal(act('claim',{run,request:'new-request'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);h.home();P.preserve(h.sim.snapshot(),beforeSurvey,['journeys']);
  }else events.push({skippedPaid:'Coastward first survey'});
  const final=finish('03_COASTWARD'),after=h.sim.snapshot();P.preserve(after,baseline,['adventure.earthStory','earthExpedition','journeys']);
  assert.deepEqual(P.epoch(),epoch);const report={status:'passed',input,inputSha256:P.sha(input),final,finalSha256:P.sha(final),sourceHashes:epoch,sourceFrozen:true,...P.zero,method:'inherited continuous character; actual movement/commands/AI/weapons; accelerated 50ms simulation ticks; in-memory candidate save/reload',nativePersistence:false,humanPacing:false,links,events:[...h.events,...events],routes:h.routes,fights,baselineStats:A.stats(baseline.adventure),finalStats:A.stats(after.adventure),canonicalPreservation:true};P.write(folder,'EARLY_REALMS_REPORT',report);return report;
 }catch(error){P.write(folder,'FAILURE',{status:'failed',stage,error:error.stack,input,inputSha256:P.sha(input),sourceHashes:epoch,finalHashes:P.epoch(),...P.zero,events:[...h.events,...events],routes:h.routes,fights,links});throw error;}
}
module.exports={run};
