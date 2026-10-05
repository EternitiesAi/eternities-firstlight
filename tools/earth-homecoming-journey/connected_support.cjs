'use strict';
/* Staged caller only. All game owners come from the installed source ROOT. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=fs.realpathSync(process.env.FIRSTLIGHT_ROOT||path.resolve(__dirname,'../..'));
const sourcePath=name=>path.join(ROOT,'src',name+'.js'),load=name=>require(sourcePath(name));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const copy=structuredClone,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const zero=Object.freeze({positionEdits:0,actorPositionEdits:0,inventoryGrants:0,healthGrants:0,manualDamage:0,plantedDefeats:0,plantedQuestFacts:0,forcedModes:0,forcedCycles:0});
function epoch(){
 const files=fs.readdirSync(path.join(ROOT,'src')).filter(f=>fs.statSync(path.join(ROOT,'src',f)).isFile()).sort().map(f=>'src/'+f);
 files.push('build.py','index.html','tests/realm_trails_journey.cjs','tests/hell_campaign_journey.cjs','tests/heaven_campaign_journey.cjs','tests/atlantis_campaign_journey.cjs','tests/cosmos_campaign_journey.cjs','tests/earth_story_journey.cjs','tests/earth_expedition_journey.cjs','tests/world_foundations_journey.cjs');
 return Object.fromEntries(files.map(p=>[p,sha(path.join(ROOT,p))]));
}
function write(folder,name,value){const file=path.join(folder,name+'.json');fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});return file;}
function readInherited(file,bow){
 assert.ok(file,'inherited world is required; fresh/returning fixture fallbacks are forbidden');
 const raw=JSON.parse(fs.readFileSync(file,'utf8')),C=load('core'),AR=load('arsenal');
 const sim=new C.Simulation(raw);assert.deepEqual(sim.snapshot(),raw,'inherited full world is already canonical; no migration/transplant');
 assert.equal(sim.room,null);assert.equal(AR.weapon(sim.state.adventure).style,bow?'bow':'blade','carry the actual weapon; never equip it implicitly');
 assert.equal(raw.adventure.started,true);assert.equal(raw.adventure.crossing.reward,true);return raw;
}
function createInherited(file,bow){return require(path.join(ROOT,'tests/realm_trails_journey.cjs')).createHarness(readInherited(file,bow));}
function preserve(final,before,changed=[]){
 const permit=new Set(changed);
 for(const k of ['journeys','realmTrails','earthExpedition','hellCampaign','heavenCampaign','atlantisCampaign','cosmosCampaign','bridgeCommunity','localLife','homeHistory','notes','score','scoreRevision','retreat','visitor','flowers','settings'])if(!permit.has(k))assert.deepEqual(final[k],before[k],'old world owner '+k+' retained');
 for(const k of ['owned','equipment','arsenal','starter','pursuit','realmCraft','earthBinding','classPath','companion','beacon','crossing','road','earthStory','earthNotes','earthGathering','defeated','drops','reward','relic','angelSeen'])if(!permit.has('adventure.'+k))assert.deepEqual(final.adventure[k],before.adventure[k],'old adventure owner '+k+' retained');
 for(const k of ['bridge','nextId','stats','milestones','recentCommands','cooldownUntil'])assert.deepEqual(final.sandbox[k],before.sandbox[k],'sandbox '+k+' retained');
 assert.deepEqual(final.sandbox.placed.map(p=>({...p,crop:null})),before.sandbox.placed.map(p=>({...p,crop:null})),'construction and positions retained');
 for(const p of before.sandbox.placed)if(p.crop){const q=final.sandbox.placed.find(q=>q.id===p.id).crop;assert.ok(q);assert.equal(q.plantedAt,p.crop.plantedAt);assert.equal(q.readyAt,p.crop.readyAt);assert.ok(q.stage===p.crop.stage||p.crop.stage==='watered'&&q.stage==='ripe');}
 for(const old of before.journal){const now=final.journal.find(p=>p.seq===old.seq);if(now)assert.deepEqual(now,old);else assert.ok(final.journal.length===200&&old.seq<final.journal[0].seq,'only production bounded history trimming');}
 assert.equal(final.earthHomecoming?.accepted||false,false,'prospective homecoming remains unaccepted');
}
function physicalWalk(h,x,z){
 const C=load('core'),sim=h.sim,start=copy(sim.state.player),r=sim.moveTo(x,z);assert.ok(r.ok,'physical walk '+x+','+z+': '+r.error);
 let p=start;for(const q of sim.playerPath){assert.ok(C.segment(p,q,sim.navRoom,.31),'complete path supported');p=q;}
 let frames=0;while(sim.playerPath.length&&frames++<18000){const old=copy(sim.state.player);sim.tick(.05);assert.ok(C.segment(old,sim.state.player,sim.navRoom,.31));assert.ok(sim.state.adventure.hp>0);}
 assert.ok(frames<18000&&dist(sim.state.player,{x,z})<.25);h.routes.push({room:sim.room||'valley',start,x,z,frames});
}
function fight(h,terms,resolved,{closed=false,stand}={}){
 const A=load('adventure'),AR=load('arsenal'),T=load('combat'),sim=h.sim,e=A.runtime(sim).enemies.find(e=>e.id===terms.id);assert.ok(e,'actual installed roster owns '+terms.id);
 const style=AR.weapon(sim.state.adventure).style,radius=stand??(style==='bow'?4:1.1),start=sim.state.adventure.elapsed;
 const economic=()=>({xp:sim.state.adventure.xp,coins:sim.state.adventure.coins,ore:sim.state.adventure.ore,inventory:copy(sim.state.sandbox.inventory),defeated:copy(sim.state.adventure.defeated),drops:copy(sim.state.adventure.drops)}),initial=economic();
 const impacts=[],weaponImpacts=[],phases=[],command=sim.adventureCommand,damage=A.damageEnemy;let frames=0,guards=0,arrows=false,lastHP=e.hp;
 sim.adventureCommand=function(id,type,p){const before=e.hp,mode=e.mode,r=command.call(this,id,type,p);if(this===sim&&style==='blade'&&['attack','pulse'].includes(type)&&r.ok&&e.hp<before)weaponImpacts.push({caller:'production blade command',mode,before,after:e.hp});return r;};
 A.damageEnemy=function(current,enemy,n,source){const before=enemy?.hp,mode=enemy?.mode,r=damage.apply(this,arguments);if(current===sim&&enemy===e&&source==='weapon'&&enemy.hp<before)weaponImpacts.push({caller:'production projectile impact',mode,n,before,after:enemy.hp});return r;};
 try{
  h.walk(e.x,e.z+radius);h.command('target-select',{id:e.id});assert.strictEqual(T.selected(sim),e);if(!T.runtime(sim).auto)h.command('auto-toggle');
  while(!resolved()&&frames++<4000){const a=sim.state.adventure,cue=T.threat(sim),t=T.runtime(sim);assert.ok(a.hp>0,'survive '+e.id);
   if(cue&&!phases.some(p=>p.phase===cue.phase&&p.kind===cue.kind))phases.push({at:a.elapsed-start,...cue});
   if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){h.command('guard');guards++;}
   if(a.hp<45&&a.tonics&&a.elapsed>=A.runtime(sim).cooldowns.heal)h.command('heal');
   if(dist(sim.state.player,e)>=AR.weapon(a).reach-.2&&!sim.playerPath.length)assert.ok(sim.moveTo(e.x,e.z+radius).ok);
   sim.tick(.05);arrows ||=AR.runtime(sim).arrows.length>0;if(e.hp<lastHP){impacts.push({mode:e.mode,before:lastHP,after:e.hp});if(closed)assert.equal(e.mode,'recover','legacy opening rule retained');lastHP=e.hp;}
  }
 }finally{sim.adventureCommand=command;A.damageEnemy=damage;}
 assert.ok(frames<4000&&e.hp===0&&resolved(),'actual zero-HP combat earns accepted fact');assert.ok(weaponImpacts.length>0,'actual weapon contributes independently of Briar');
 if(style==='bow')assert.ok(arrows&&weaponImpacts.some(p=>p.caller==='production projectile impact'));
 assert.deepEqual(economic(),initial,'no enemy loot or separate payout');h.command('target-clear');
 return{enemy:e.id,style,stats:A.stats(sim.state.adventure),frames,seconds:sim.state.adventure.elapsed-start,guards,arrows,phases,impacts,weaponImpacts,pacing:'carried command-earned equipment; no starter multi-phase/guard-count requirement'};
}
module.exports={ROOT,sourcePath,load,sha,copy,dist,zero,epoch,write,readInherited,createInherited,preserve,physicalWalk,fight};
