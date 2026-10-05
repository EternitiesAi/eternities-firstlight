'use strict';
/* Actual installed production command/movement/AI/projectile continuation.
 * Accelerated CPU, not native/RAF/human play. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const P=require('./earned_common.cjs');
function journey({input,expectedSha,folder,variant,choice='public-watch',prepared=false}={}){
 assert.ok(input&&expectedSha&&folder);assert.equal(fs.existsSync(folder),false,'preserve every previous journey');fs.mkdirSync(folder,{recursive:true});
 const C=P.load('core'),A=P.load('adventure'),AR=P.load('arsenal'),T=P.load('combat'),W=P.load('world-foundations'),H=P.load('earth-homecoming'),D=H.definition,CS=P.load('characters');
 assert.equal(P.sha(input),expectedSha);const raw=JSON.parse(fs.readFileSync(input)),mem=P.profile(C.validate(raw));let sim=new C.Simulation(mem.state),store=mem.store,app=P.productionApp(sim,store),serial=0,stage='input';
 assert.ok(H.eligible(sim.state),'all twelve individually paid prerequisites');assert.deepEqual(sim.state.earthHomecoming,H.fresh());
 const baseline=sim.snapshot(),epoch=P.epoch(),events=[],walks=[],checkpoints=[],frames=[],contacts=[],weaponImpacts=[],commands=[],coldReloads=[],modes=new Set(),patternIds=new Set();let reloads=0,guards=0,shots=0;
 const balance=()=>({xp:sim.state.adventure.xp,coins:sim.state.adventure.coins,ore:sim.state.adventure.ore,inventory:P.copy(sim.state.sandbox.inventory)});
 const initialMoney=balance(),step=id=>D.steps.find(s=>s.id===id),physical=(a,b)=>W.handles(sim.room)?W.segment(sim.room,a,b,.31):C.segment(a,b,sim.navRoom,.31);
 const command=(type,p={})=>{const id='earned-earth-'+variant+'-'+(++serial),out=sim.adventureCommand(id,type,p);assert.ok(out.ok,type+': '+out.error);commands.push({id,type,p,result:out});return out;};
 const act=(type,p={})=>{const ctx=app.context(),payload={quest:D.id,expectedActive:ctx.active,expectedRevision:sim.state.adventure.revision,...p},out=app.command(type,payload);assert.ok(out.ok,type+': '+out.error);events.push({type,payload,result:out,room:sim.room,player:P.copy(sim.state.player)});return out;};
 let observe=null,defend=null;
 const tick=()=>{defend?.();const prior=P.copy(sim.state.player);sim.tick(.05);assert.ok(physical(prior,sim.state.player),'actual movement stays on whole support');assert.ok(sim.state.adventure.hp>0,'survive real movement/combat');observe?.();};
 const walk=(x,z)=>{const start=P.copy(sim.state.player),out=sim.moveTo(x,z);assert.ok(out.ok,'actual moveTo '+x+','+z+': '+out.error);let prior=start;for(const q of sim.playerPath){assert.ok(physical(prior,q),'whole production path');prior=q;}let n=0;while(sim.playerPath.length&&n++<18000)tick();assert.ok(n<18000&&P.dist(sim.state.player,{x,z})<.25);walks.push({room:sim.room||'valley',start,x,z,frames:n});};
 const snap=name=>{const file=P.write(folder,name,sim.snapshot());checkpoints.push(file);return file;};
 const reload=label=>{assert.ok(store.save(sim.snapshot()).ok);const prior=sim.snapshot(),fresh=new CS.Store(mem.storage),loaded=fresh.load();assert.equal(loaded.status,'loaded');fresh.writer=true;store=fresh;sim=new C.Simulation(loaded.state);app=P.productionApp(sim,store);assert.deepEqual(sim.snapshot(),prior);assert.equal(sim.room,null);coldReloads.push({label,accepted:prior.earthHomecoming.accepted,steps:P.copy(prior.earthHomecoming.steps),choice:prior.earthHomecoming.choice,claimed:prior.earthHomecoming.claimed,wholeSnapshotPreserved:true});reloads++;};
 const enter=()=>{walk(W.GATE.x,W.GATE.z);const ctx=app.context(),preview=W.preview(ctx,'earthlands');assert.ok(preview.ok,preview.error);assert.ok(W.enter(preview.ticket,ctx,{save:app.save,build:()=>{}}).ok);assert.equal(sim.room,D.room);};
 const work=id=>{const s=step(id);assert.equal(s.kind,'interact');assert.equal(sim.room,s.room);walk(s.x,s.z);return act('step',{step:id});};
 function fight(){
  const e=A.runtime(sim).enemies.find(e=>e.id===D.enemy.id);assert.ok(e&&H.owned(sim,e),'actual roster-owned Regent');const start=sim.state.adventure.elapsed,money=balance(),oldDrops=P.copy(sim.state.adventure.drops),oldDefeats=P.copy(sim.state.adventure.defeated),style=AR.weapon(sim.state.adventure).style,seen=new WeakSet();
  let lastContact=e.contactAt,totalTicks=0,observedHP=sim.state.adventure.hp;
  const sourceCommand=sim.adventureCommand,sourceDamage=A.damageEnemy;
  sim.adventureCommand=function(id,type,p){const hp=e.hp,mode=e.mode,out=sourceCommand.call(this,id,type,p);if(style==='blade'&&['attack','pulse'].includes(type)&&out.ok&&e.hp<hp)weaponImpacts.push({caller:'production blade command',mode,before:hp,after:e.hp,at:sim.state.adventure.elapsed-start});return out;};
  A.damageEnemy=function(current,enemy,n,source){const hp=enemy?.hp,mode=enemy?.mode,out=sourceDamage.apply(this,arguments);if(style==='bow'&&current===sim&&enemy===e&&source==='weapon'&&enemy.hp<hp)weaponImpacts.push({caller:'production projectile impact',mode,before:hp,after:enemy.hp,n,at:sim.state.adventure.elapsed-start});return out;};
  observe=()=>{modes.add(e.mode);if(e.strike&&!seen.has(e.strike)){assert.ok(Object.isFrozen(e.strike));seen.add(e.strike);patternIds.add(e.strike.pattern);frames.push({at:sim.state.adventure.elapsed-start,frame:P.copy(e.strike),hp:e.hp,windup:e.windup,recovery:e.recovery});}if(e.contactAt!==lastContact){contacts.push({at:e.contactAt-start,hit:e.contactHit,frame:P.copy(e.strike),beforeHP:observedHP,hp:sim.state.adventure.hp,damage:observedHP-sim.state.adventure.hp});lastContact=e.contactAt;}observedHP=sim.state.adventure.hp;shots+=AR.runtime(sim).arrows.length>0?1:0;assert.deepEqual([e.x,e.z,e.radius,e.maxHP,e.damage],[D.enemy.x,D.enemy.z,D.enemy.radius,D.enemy.hp,D.enemy.damage]);};
  defend=()=>{const a=sim.state.adventure,t=T.runtime(sim),cue=T.threat(sim);if(cue?.phase==='windup'&&a.stamina>=20&&a.elapsed>=t.cooldowns.guard){command('guard');guards++;}if(a.hp<45&&a.tonics&&a.elapsed>=A.runtime(sim).cooldowns.heal)command('heal');};
  const until=(fn,seconds=12)=>{let n=0;while(!fn()&&n++<Math.ceil(seconds/.05)){tick();totalTicks++;}assert.ok(fn(),'actual scheduled combat condition within '+seconds+'s');};
  const hit=()=>{const hp=e.hp;until(()=>sim.state.adventure.elapsed>=A.runtime(sim).cooldowns.attack&&sim.state.adventure.stamina>=AR.weapon(sim.state.adventure).stamina,3);command('attack',{target:e.id});until(()=>e.hp<hp,1);};
  const waitPattern=id=>{until(()=>e.mode==='windup'&&e.strike?.pattern===id,14);const frame=e.strike,at=e.contactAt;until(()=>e.contactAt!==at,3);assert.strictEqual(e.strike,frame);};
  try{
   command('target-select',{id:e.id});walk(e.x,e.z+2.1);waitPattern('claim-lane');
   while(e.hp>112)hit(); // actual owned attacks determine the next band
   if(style==='bow'){walk(e.x,e.z-10.5);waitPattern('false-shelter');walk(e.x,e.z+2.1);}else{walk(e.x,e.z+2.1);waitPattern('false-shelter');}
   while(e.hp>56)hit();waitPattern('closing-ring');
   if(style==='bow')walk(e.x,e.z-10.5);
   command('auto-toggle');until(()=>sim.state.earthHomecoming.steps.includes('regent-repelled'),18);command('target-clear');
   assert.equal(e.hp,0);assert.ok(weaponImpacts.length);assert.ok(['claim-lane','false-shelter','closing-ring'].every(id=>patternIds.has(id)));assert.ok(modes.has('windup')&&modes.has('recover'));assert.ok(contacts.length>=3);assert.ok(guards>0);if(style==='bow')assert.ok(shots&&weaponImpacts.some(p=>p.caller==='production projectile impact'));
   assert.deepEqual(balance(),money);assert.deepEqual(sim.state.adventure.drops,oldDrops);assert.deepEqual(sim.state.adventure.defeated,oldDefeats);
   return{enemy:e.id,style,startStats:A.stats(sim.state.adventure),seconds:sim.state.adventure.elapsed-start,totalTicks,guards,arrowFrames:shots,frames,contacts,weaponImpacts,method:'deliberate actual attacks at real HP bands, ordinary movement, existing target/auto/Brace; no forced HP, cycle or mode; companion deliberately asked to wait through actual command'};
  }finally{observe=null;defend=null;sim.adventureCommand=sourceCommand;A.damageEnemy=sourceDamage;}
 }
 try{
  stage='physical-accept';walk(D.giver.x,D.giver.z);act('accept');snap('01_ACCEPTED');reload('accepted');
  // Existing explicit wait/follow command prevents incidental companion damage
  // from hiding an authored tell; the original mode is restored before return.
  const originalMode=sim.state.adventure.companion.mode;if(sim.state.adventure.companion.bonded&&originalMode!=='stay')command('companion-mode',{mode:'stay'});
  enter();work('bridge-record');work('register-record');work('inspect-claim');if(prepared)work('supplied-screen');work('west-relay-isolated');work('east-relay-isolated');snap('02_RELAYS');reload('ordered-relays');enter();
  stage='real-regent';work('challenge-regent');app.context();tick();const combat=fight();snap('03_REGENT_REPELLED');reload('regent-repelled');enter();assert.equal(H.enemies(sim).length,0);
  stage='deliberate-aftermath';work('passage-secured');walk(step('aftermath').x,step('aftermath').z);act('choose',{choice});snap('04_CHOICE');reload('chosen');enter();work('return-verified');snap('05_VERIFIED');assert.equal(H.ready(sim.state),false);reload('verified-away-from-home');enter();assert.ok(W.leave(sim).ok);assert.equal(sim.room,null);assert.equal(H.ready(sim.state),false);
  stage='physical-home';walk(step('home-return').x,step('home-return').z);work('home-return');if(sim.state.adventure.companion.bonded&&sim.state.adventure.companion.mode!==originalMode)command('companion-mode',{mode:originalMode});assert.ok(H.ready(sim.state));assert.equal(sim.state.earthHomecoming.claimed,false);snap('06_HOME_UNPAID');reload('home-unpaid');assert.ok(H.ready(sim.state));
  stage='separate-fee';walk(D.claim.x,D.claim.z);const before=balance();const result=act('claim');for(const k of['xp','coins','ore'])assert.equal(balance()[k]-before[k],result.reward[k]);for(const[k,n]of Object.entries(D.reward.materials))assert.equal(balance().inventory[k]-before.inventory[k],n);assert.ok(initialMoney.xp<=sim.state.adventure.xp);snap('07_PAID');const paid=sim.snapshot();assert.equal(act('claim').duplicate,true);assert.deepEqual(sim.snapshot(),paid);reload('paid');walk(D.claim.x,D.claim.z);assert.equal(act('claim').duplicate,true);assert.ok(sim.state.earthHomecoming.claimed);P.preserved(sim.snapshot(),baseline);
  const final=snap('FINAL_WORLD');assert.deepEqual(P.epoch(),epoch);const report={status:'passed',scope:'staged caller executes actual installed-owner accelerated continuation; native/browser and human qualification remain pending',variant,choice,prepared,input:{path:input,sha256:expectedSha},final,initialStats:A.stats(baseline.adventure),finalStats:A.stats(sim.state.adventure),all12Paid:true,priorOwnersPreserved:true,combat,events,commands,walks,checkpoints,reloads,coldReloads,sourceEpoch:epoch,sourceFrozen:true,...P.ZERO,method:'actual Core movement/World travel, exact installed app command fragments/synchronous Character Store writes, actual Adventure target/auto/guard/weapons/AI, cold Core+Store reloads; in-memory storage',nativePersistence:false,browserExecuted:false,normalRAF:false,humanPacing:false,syntheticGameplaySetup:false,managedProfileShellSynthetic:true};P.write(folder,'EARTH_HOMECOMING_JOURNEY_REPORT',report);return report;
 }catch(error){P.write(folder,'FAILURE',{status:'failed',stage,error:error.stack,input:{path:input,sha256:expectedSha},events,commands,walks,checkpoints,frames,contacts,weaponImpacts,sourceEpoch:epoch,finalEpoch:P.epoch(),...P.ZERO});throw error;}
}
module.exports={journey};
