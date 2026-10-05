'use strict';
// Synthetic boundary fixtures use the real Core, world and combat owners.
// Anchor poses/partial ledgers are explicit setup, not command-earned journey evidence.
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),AT=require('../src/atlantis-campaign.js');
const R=require('../src/realm-trails.js'),W=require('../src/world-foundations.js'),T=require('../src/combat.js'),S=require('../src/sandbox.js');
const D=AT.definition,copy=structuredClone,step=id=>D.steps.find(s=>s.id===id);
const tokens=Object.fromEntries(AT.pressure.correct.map(s=>[s.step,s.setting]));
Object.assign(tokens,{'manual-bypass':'open-bypass','release-west':'stabilize-west','release-east':'stabilize-east'});
function seed(){
 const s=C.fresh();s.adventure.started=true;s.adventure.owned=['trail_blade','travel_coat'];s.adventure.equipment={weapon:'trail_blade',armor:'travel_coat',charm:null};
 const old=R.definition(D.prerequisite),r=s.realmTrails.records[old.id];r.accepted=true;r.claimed=true;r.steps=R.required(old);
 s.notes=[{text:'Synthetic prior notebook survives the new owner.',day:1}];return C.validate(s);
}
function fixture(raw=seed()){
 const sim=new C.Simulation(raw);sim.returnPos={...raw.player};sim.room=D.room;let stored=null,saves=0;
 const save=s=>{stored=C.validate(s);saves++;return{ok:true};};sim.atlantisCampaignSave=save;
 const ctx={sim,active:'synthetic-atlantis-boundary'};
 const act=(type,p={},io={save})=>AT.command(ctx,type,{quest:D.id,expectedRevision:sim.state.adventure.revision,expectedActive:ctx.active,...p},io);
 const at=p=>{sim.state.player={x:p.x,z:p.z,yaw:0};if(p.medium==='water'||p.medium==='court')sim.worldDive={y:p.y,hold:true,surface:{x:8,z:-16,yaw:0}};else delete sim.worldDive;};
 return{sim,save,ctx,act,at,get stored(){return stored;},get saves(){return saves;}};
}
function history(f,ids,approach='upper',choice=null,claimed=false){f.sim.state.atlantisCampaign=AT.validate({version:1,accepted:true,steps:ids,approach:ids.includes('choose-approach')?approach:null,choice,claimed});}
const beforeFlow=['receipt-conflict','choose-approach','upper-reading'];
const beforeFight=[...beforeFlow,'diagnose-flow','inlet-set','equalizer-set','outlet-set','secure-carrier','challenge-custodian'];
function enemy(f){history(f,beforeFight);f.at(D.enemy);A.syncScene(f.sim);const e=A.runtime(f.sim).enemies.find(e=>e.atlantisCampaign===D.id);assert.ok(e,'actual Adventure roster creates the owner');return e;}
function work(f,id){const s=step(id);f.at(s);const result=f.act(s.kind==='pressure'?'pressure':'step',{step:id,...(s.kind==='pressure'?{setting:tokens[id]}:{})});assert.ok(result.ok,result.error);return result;}
function finish(f,approach='upper',choice='publish',other=false,bypass=false){
 f.at(D.giver);assert.ok(f.act('accept').ok);work(f,'receipt-conflict');f.at(step('choose-approach'));assert.ok(f.act('approach',{approach}).ok);
 work(f,approach+'-reading');if(other)work(f,(approach==='upper'?'lower':'upper')+'-reading');if(bypass)work(f,'manual-bypass');
 for(const id of['diagnose-flow','inlet-set','equalizer-set','outlet-set','secure-carrier','challenge-custodian'])work(f,id);
 const e=A.runtime(f.sim).enemies.find(e=>e.atlantisCampaign);assert.ok(e);A.damageEnemy(f.sim,e,999,'weapon');assert.ok(f.sim.state.atlantisCampaign.steps.includes('bearing-exposed'));
 for(const id of['release-west','release-east','custodian-stable'])work(f,id);f.at(step('disposition'));assert.ok(f.act('choose',{choice}).ok);work(f,'verify-passage');return e;
}
function balances(s){return{xp:s.adventure.xp,coins:s.adventure.coins,ore:s.adventure.ore,materials:copy(s.sandbox.inventory)};}
function retained(s){s=copy(s);delete s.atlantisCampaign;for(const k of['xp','coins','ore','revision'])delete s.adventure[k];for(const k of Object.keys(D.reward.materials))delete s.sandbox.inventory[k];delete s.journal;delete s.nextEvent;return s;}

test('old Core saves add only the empty optional owner; exact schema refuses future and impossible history',()=>{
 const old=seed();delete old.atlantisCampaign;old.adventure.xp=9999;const out=C.validate(old);assert.deepEqual(out.atlantisCampaign,AT.fresh());delete out.atlantisCampaign;assert.deepEqual(out,old);
 for(const bad of[null,[],{...AT.fresh(),version:2},{...AT.fresh(),extra:true},{...AT.fresh(),accepted:1},{...AT.fresh(),steps:['future-step']},{...AT.fresh(),steps:['receipt-conflict']},{...AT.fresh(),approach:'upper'},{...AT.fresh(),choice:'publish'},{...AT.fresh(),claimed:true}])assert.throws(()=>AT.validate(bad));
 for(const [ids,approach,choice]of[[['receipt-conflict','choose-approach','lower-reading','diagnose-flow'],'upper',null],[['receipt-conflict','choose-approach'],'upper','publish'],[beforeFight,'future',null],[[...beforeFight,'release-east'],'upper',null],[[...beforeFight,'bearing-exposed','release-west','release-east','custodian-stable','disposition'],'upper',null]])assert.throws(()=>AT.validate({version:1,accepted:true,steps:ids,approach,choice,claimed:false}));
 const accepted=seed();accepted.atlantisCampaign={...AT.fresh(),accepted:true};accepted.realmTrails.records[D.prerequisite]=R.fresh().records[D.prerequisite];assert.throws(()=>C.validate(accepted));
});
test('every required descendant depends on the retained observation, not merely the other optional reading',()=>{
 for(const approach of['upper','lower']){
  const other=approach==='upper'?'lower':'upper',f=fixture();history(f,['receipt-conflict','choose-approach',other+'-reading'],approach);
  assert.equal(AT.available(f.sim.state).some(s=>s.id==='diagnose-flow'),false);f.at(step('diagnose-flow'));const before=f.sim.snapshot();assert.equal(f.act('step',{step:'diagnose-flow'}).ok,false);assert.deepEqual(f.sim.snapshot(),before);
  assert.ok(AT.required(f.sim.state).includes(approach+'-reading'));assert.equal(AT.required(f.sim.state).includes(other+'-reading'),false);work(f,approach+'-reading');assert.ok(AT.available(f.sim.state).some(s=>s.id==='diagnose-flow'));
 }
});
test('acceptance checks real character, chart, owner and revision; refused candidate is never adopted',()=>{
 const f=fixture();f.at(D.giver);const before=f.sim.snapshot();
 for(const p of[{quest:'foreign'},{expectedActive:'foreign'},{expectedRevision:-1},{expectedRevision:1.2}])assert.equal(f.act('accept',p).ok,false);
 assert.equal(AT.command({...f.ctx,sim:{...f.sim}},'accept',{quest:D.id}, {save:f.save}).ok,false);
 for(const io of[{}, {save:()=>({ok:false,error:'synthetic refusal'})},{save:()=>{throw Error('synthetic write failure');}}])assert.equal(f.act('accept',{},io).ok,false);
 assert.deepEqual(f.sim.snapshot(),before);f.at({x:0,z:39});assert.equal(f.act('accept').ok,false);f.at(D.giver);assert.ok(f.act('accept').ok);assert.equal(f.saves,1);const accepted=f.sim.snapshot();assert.equal(f.act('accept').duplicate,true);assert.deepEqual(f.sim.snapshot(),accepted);
});
test('saving cannot adopt into a replaced character, changed owner or reentrant state',()=>{
 for(const mutate of[(f)=>{f.sim.state=copy(f.sim.state);},(f)=>{f.ctx.active='replacement';},(f)=>{f.sim.state.notes.push({text:'Concurrent change retained',day:1});}]){
  const f=fixture();f.at(D.giver);assert.equal(f.act('accept',{}, {save:s=>{C.validate(s);mutate(f);return{ok:true};}}).ok,false);assert.equal(f.sim.state.atlantisCampaign.accepted,false);assert.equal(f.sim.state.adventure.revision,0);
 }
});
test('depth and medium are physical; an obstructed nearby control cannot be worked through a wall',()=>{
 const f=fixture();history(f,['receipt-conflict','choose-approach']);f.at({x:8,z:-22});assert.equal(AT.at(f.sim,step('upper-reading')),false);
 f.at({...step('upper-reading'),y:-2.55});assert.equal(AT.at(f.sim,step('upper-reading')),false);f.at(step('upper-reading'));assert.ok(AT.at(f.sim,step('upper-reading')));work(f,'upper-reading');
 f.at({x:12.4,z:-35,y:-2.7,medium:'water'});assert.equal(AT.at(f.sim,step('diagnose-flow')),false);f.at(step('diagnose-flow'));assert.ok(AT.at(f.sim,step('diagnose-flow')));
 f.at({x:6,z:-35,y:-2.7,medium:'court'});assert.equal(AT.at(f.sim,step('diagnose-flow')),true,'the supported open desk approach is usable');
 f.at({x:0,z:-21.5});assert.equal(AT.at(f.sim,step('receipt-conflict')),false,'registry solid separates this otherwise nearby pose');
});
test('first approach is deliberate and retained; wrong or premature pressure has no loss or progress',()=>{
 const f=fixture();f.at(D.giver);assert.ok(f.act('accept').ok);assert.equal(f.act('approach',{approach:'upper'}).ok,false);work(f,'receipt-conflict');f.at(step('choose-approach'));assert.ok(f.act('approach',{approach:'lower'}).ok);const before=f.sim.snapshot();assert.equal(f.act('approach',{approach:'upper'}).ok,false);assert.equal(f.act('approach',{approach:'lower'}).duplicate,true);assert.deepEqual(f.sim.snapshot(),before);
 f.at(step('inlet-set'));for(const setting of['wrong',tokens['inlet-set']])assert.equal(f.act('pressure',{step:'inlet-set',setting}).ok,false);assert.deepEqual(f.sim.snapshot(),before);
 for(const id of['bearing-exposed','disposition','choose-approach']){f.at(step(id));assert.equal(f.act('step',{step:id}).ok,false);}assert.deepEqual(f.sim.snapshot(),before);
});
test('all 24 authored branches use actual commands, actual damage, sequential releases and a separate one-time fee',()=>{
 for(const approach of['upper','lower'])for(const other of[false,true])for(const bypass of[false,true])for(const choice of['publish','limited','license']){
  const f=fixture(),prior=f.sim.snapshot();finish(f,approach,choice,other,bypass);assert.ok(AT.ready(f.sim.state));assert.equal(f.sim.state.atlantisCampaign.claimed,false);assert.deepEqual(balances(f.sim.state),balances(prior));
  f.at(D.giver);const out=f.act('claim');assert.ok(out.ok,out.error);assert.deepEqual(out.reward,D.reward);assert.equal(f.sim.state.adventure.xp-prior.adventure.xp,48);assert.equal(f.sim.state.adventure.coins-prior.adventure.coins,18);assert.equal(f.sim.state.adventure.ore-prior.adventure.ore,4);for(const[k,n]of Object.entries(D.reward.materials))assert.equal(f.sim.state.sandbox.inventory[k]-prior.sandbox.inventory[k],n);
  assert.deepEqual(retained(f.sim.snapshot()),retained(prior),'every other owner, camera, socket, kit, notebook and ordinary balance stays intact');
  const paid=f.sim.snapshot();assert.equal(f.act('claim',{request:'another'}).duplicate,true);assert.deepEqual(f.sim.snapshot(),paid);const reloaded=fixture(paid);reloaded.at(D.giver);assert.equal(reloaded.act('claim').duplicate,true);assert.deepEqual(reloaded.sim.snapshot(),paid);
 }
});
test('whole fee capacity includes crystal; stored XP cap never blocks full fixed materials or refills a character',()=>{
 for(const k of['coins','ore','wood','fiber','crystal','refused']){
  const f=fixture();history(f,AT.required({approach:'upper'}),'upper','limited');f.at(D.giver);if(k==='coins'||k==='ore')f.sim.state.adventure[k]=9999;else if(k!=='refused')f.sim.state.sandbox.inventory[k]=S.MAX;
  const before=f.sim.snapshot();assert.equal(f.act('claim',{}, k==='refused'?{save:()=>({ok:false,error:'synthetic whole-fee refusal'})}:{save:f.save}).ok,false);assert.deepEqual(f.sim.snapshot(),before);
  if(k==='coins'||k==='ore')f.sim.state.adventure[k]=0;else if(k!=='refused')f.sim.state.sandbox.inventory[k]=0;
  f.sim.state.adventure.xp=9999;f.sim.state.adventure.hp=31;f.sim.state.adventure.stamina=23;f.sim.state.adventure.tonics=1;const cap=f.sim.snapshot();assert.ok(f.act('claim').ok);assert.equal(f.sim.state.adventure.xp,9999);for(const n of['hp','stamina','tonics'])assert.equal(f.sim.state.adventure[n],cap.adventure[n]);assert.match(f.sim.state.journal.at(-1).text,/0 XP.*crystal.*cap retained/);
 }
});
test('revision and event limits refuse without consuming fees or trimming prior history',()=>{
 for(const limit of['revision','event']){const f=fixture();history(f,AT.required({approach:'lower'}),'lower','license');f.at(D.giver);if(limit==='revision')f.sim.state.adventure.revision=1e9;else f.sim.state.nextEvent=Number.MAX_SAFE_INTEGER-1;const before=f.sim.snapshot();assert.equal(f.act('claim').ok,false);assert.deepEqual(f.sim.snapshot(),before);}
 const f=fixture();f.sim.state.journal=Array.from({length:200},(_,i)=>({seq:i+1,day:1,hour:17.2,kind:'synthetic-prior',text:'kept '+i}));f.sim.state.nextEvent=201;f.at(D.giver);assert.ok(f.act('accept').ok);assert.equal(f.sim.state.journal.length,200);assert.equal(f.sim.state.journal[0].seq,2);assert.equal(f.sim.state.journal.at(-1).seq,201);
});
test('stored early XP one through five earns only the fixed fee and never resets equipment or health at a level boundary',()=>{
 for(const xp of[1,2,3,4,5]){const f=fixture();history(f,AT.required({approach:'upper'}),'upper','publish');f.sim.state.adventure.xp=xp;f.sim.state.adventure.hp=21;f.sim.state.adventure.stamina=17;f.at(D.giver);const before=f.sim.snapshot();assert.ok(f.act('claim').ok);assert.equal(f.sim.state.adventure.xp,xp+48);assert.deepEqual(retained(f.sim.snapshot()),retained(before));assert.equal(f.sim.state.adventure.hp,21);assert.equal(f.sim.state.adventure.stamina,17);}
});
test('read-only accepted witnesses have stable ownership and saved outlet controls Damar’s actual presence',()=>{
 const f=fixture(),before=f.sim.snapshot();assert.equal(AT.runtime(f.sim).witnesses.length,0);assert.equal(AT.currentStatus(f.sim).active,false);assert.deepEqual(f.sim.snapshot(),before);f.at(D.giver);assert.ok(f.act('accept').ok);const i=AT.runtime(f.sim).witnesses[0];assert.equal(i.name,D.witnesses[0].name);assert.ok(Object.isFrozen(i));work(f,'receipt-conflict');assert.strictEqual(AT.runtime(f.sim).witnesses[0],i);
 history(f,beforeFight);const witnesses=AT.runtime(f.sim).witnesses;assert.deepEqual(witnesses.map(w=>w.id),D.witnesses.map(w=>w.id));assert.ok(Object.isFrozen(witnesses));assert.strictEqual(witnesses[0],i);const saved=f.sim.snapshot();AT.currentStatus(f.sim);assert.deepEqual(f.sim.snapshot(),saved);
 assert.ok(f.sim.leave().ok);assert.equal(AT.runtime(f.sim).witnesses.length,0);f.sim.returnPos={...f.sim.state.player};f.sim.room=D.room;assert.notStrictEqual(AT.runtime(f.sim).witnesses[0],i);const reloaded=fixture(saved);assert.deepEqual(AT.runtime(reloaded.sim).witnesses.map(w=>w.id),D.witnesses.map(w=>w.id));
});
test('real owned moving Custodian can take ordinary damage in all live phases; copies and false origins cannot',()=>{
 const f=fixture(),e=enemy(f);assert.equal(e.originX,8);assert.equal(e.originZ,-44);e.x=10;e.z=-43;assert.ok(AT.canDamage(f.sim,e),'canonical origin does not pin its live body');
 for(const mode of['idle','pursue','windup','intake','recover']){e.mode=mode;const hp=e.hp;A.damageEnemy(f.sim,e,1,'weapon');assert.equal(e.hp,hp-1);}
 assert.equal(AT.canDamage(f.sim,{...e}),false);assert.equal(AT.canDamage({...f.sim},e),false,'copied runtime fields do not make a real Simulation owner');for(const[k,v]of[['originX',9],['maxHP',129],['radius',.31]]){const old=e[k];e[k]=v;assert.equal(AT.canDamage(f.sim,e),false);e[k]=old;}
 f.sim.paused=true;assert.equal(AT.canDamage(f.sim,e),false);f.sim.paused=false;f.sim.worldDive={y:-1.4};assert.equal(AT.canDamage(f.sim,e),false);delete f.sim.worldDive;e.x=30;assert.equal(AT.canDamage(f.sim,e),false);
});
test('real lethal damage saves bearing once, refuses to HP one, and never invokes legacy loot',()=>{
 const f=fixture(),e=enemy(f),before=f.sim.snapshot();f.sim.atlantisCampaignSave=()=>({ok:false,error:'synthetic exhaustion refusal'});A.damageEnemy(f.sim,e,999,'weapon');assert.equal(e.hp,1);assert.deepEqual(f.sim.snapshot(),before);assert.ok(T.runtime(f.sim).hits.length>0);
 f.sim.atlantisCampaignSave=f.save;A.damageEnemy(f.sim,e,999,'weapon');assert.equal(e.hp,0);assert.ok(f.sim.state.atlantisCampaign.steps.includes('bearing-exposed'));assert.equal(f.sim.state.atlantisCampaign.steps.includes('release-west'),false);for(const k of['xp','coins','ore','defeated','drops'])assert.deepEqual(f.sim.state.adventure[k],before.adventure[k]);assert.equal(AT.defeat(f.sim,e),false);A.syncScene(f.sim);assert.equal(A.runtime(f.sim).enemies.filter(e=>e.atlantisCampaign).length,0);
});
test('an invalid character envelope refuses real exhaustion without leaving an unstored zero-HP owner',()=>{
 const f=fixture(),e=enemy(f);f.sim.state.notes.push(...Array.from({length:20},()=>({text:'synthetic malformed envelope',day:1})));
 assert.doesNotThrow(()=>A.damageEnemy(f.sim,e,999,'weapon'));assert.equal(e.hp,1);assert.equal(f.sim.state.atlantisCampaign.steps.includes('bearing-exposed'),false);assert.equal(f.saves,0);
});
test('actual bow projectile can hit an ordinary windup and resolve only the campaign bearing',()=>{
 const AR=require('../src/arsenal.js'),f=fixture(),e=enemy(f);f.sim.state.adventure.owned.push('trail_bow');f.sim.state.adventure.equipment.weapon='trail_bow';f.at({x:e.x,z:e.z+4});e.mode='windup';e.timer=10;e.hp=1;
 assert.ok(f.sim.adventureCommand('synthetic-atlantis-arrow','attack',{target:e.id}).ok);AR.update(f.sim,.2);assert.equal(e.hp,0);assert.ok(f.sim.state.atlantisCampaign.steps.includes('bearing-exposed'));assert.deepEqual(A.runtime(f.sim).fx.filter(v=>v.kind.startsWith('arrow-')).map(v=>v.kind),['arrow-hit']);assert.equal(T.runtime(f.sim).hits.length,1);assert.deepEqual(f.sim.state.adventure.drops,[]);
});
test('real bow-distance AI selects its declared intake while the Custodian remains anchored and retreat stays out of reach',()=>{
 const f=fixture(),e=enemy(f);f.sim.state.adventure.owned.push('trail_bow');f.sim.state.adventure.equipment.weapon='trail_bow';f.at({x:e.x+4,z:e.z});
 assert.equal(e.anchored,true);assert.strictEqual(AT.pattern(e),AT.patterns.sweep,'query without Simulation retains cycle-only behavior');assert.strictEqual(AT.pattern(e,f.sim),AT.patterns.intake,'owned range four uses existing reach six');assert.strictEqual(AT.pattern({...e},f.sim),AT.patterns.sweep);assert.strictEqual(AT.pattern(e,{...f.sim}),AT.patterns.sweep);
 const origin={x:e.x,z:e.z};assert.ok(f.sim.adventureCommand('synthetic-atlantis-range-arrow','attack',{target:e.id}).ok);f.sim.tick(.05);assert.equal(e.mode,'windup');assert.equal(e.strike.kind,'intake');assert.equal(e.timer,1.5);assert.equal(e.recovery,2.1);assert.equal(e.atlantisCycle,0,'next cycle follows the chosen intake, not the overridden sweep');
 for(let i=0;i<31&&e.mode==='windup';i++)f.sim.tick(.05);assert.equal(e.mode,'intake');assert.ok(e.hp<D.enemy.hp,'the ordinary bow projectile actually hit');assert.deepEqual({x:e.x,z:e.z},origin);assert.equal(e.damage,10);
 const near=fixture(),n=enemy(near);near.at({x:n.x+3.6,z:n.z});assert.strictEqual(AT.pattern(n,near.sim),AT.patterns.sweep,'exact sweep boundary adds no extra reach');near.sim.tick(.05);assert.equal(n.strike.kind,'sweep');assert.equal(n.atlantisCycle,1);
 const far=fixture(),r=enemy(far);far.at({x:r.x+6.01,z:r.z});assert.strictEqual(AT.pattern(r,far.sim),AT.patterns.sweep);for(let i=0;i<50;i++)far.sim.tick(.05);assert.equal(r.mode,'idle');assert.ok(!r.strike,'outside declared intake reach no attack frame is created');assert.deepEqual({x:r.x,z:r.z},{x:D.enemy.x,z:D.enemy.z});
});
test('two immutable locked patterns cycle with fixed timing and cannot follow a moved traveler or use a copied frame',()=>{
 const f=fixture(),e=enemy(f);f.at({x:e.x,z:e.z+2});assert.strictEqual(AT.pattern(e),AT.patterns.sweep);const s=AT.lock(f.sim,e);assert.equal(s.kind,'sweep');assert.ok(Object.isFrozen(s));assert.equal(e.windup,1.3);assert.equal(e.recovery,1.9);assert.strictEqual(AT.pattern(e),AT.patterns.intake);f.at({x:e.x+4,z:e.z});assert.strictEqual(e.strike,s);assert.equal(s.yaw,0);e.hp=40;
 const lane=AT.lock(f.sim,e);assert.equal(lane.kind,'intake');assert.equal(e.windup,1.5);assert.equal(e.recovery,2.1);assert.ok(Object.isFrozen(lane));assert.equal(AT.strikeContains({...e},f.sim.state.player),false);e.strike={...lane};assert.equal(AT.strikeContains(e,f.sim.state.player),false);e.strike=lane;assert.strictEqual(AT.pattern(e),AT.patterns.sweep);
});
test('independent closest-shape oracle checks sector edge and rounded intake corners across directions',()=>{
 function oracle(s,p){let best=Infinity;if(s.kind==='sweep'){const d=Math.hypot(p.x-s.x,p.z-s.z),angle=Math.atan2(p.x-s.x,p.z-s.z),delta=Math.atan2(Math.sin(angle-s.yaw),Math.cos(angle-s.yaw));if(Math.abs(delta)<=s.halfAngle&&d<=s.radius)return true;for(let i=0;i<=2400;i++){const a=s.yaw-s.halfAngle+2*s.halfAngle*i/2400;best=Math.min(best,Math.hypot(p.x-s.x-Math.sin(a)*s.radius,p.z-s.z-Math.cos(a)*s.radius));}for(const a of[s.yaw-s.halfAngle,s.yaw+s.halfAngle]){const dx=Math.sin(a),dz=Math.cos(a),t=Math.max(0,Math.min(s.radius,(p.x-s.x)*dx+(p.z-s.z)*dz));best=Math.min(best,Math.hypot(p.x-s.x-dx*t,p.z-s.z-dz*t));}return best<=.24;}const x=(p.x-s.x)*Math.cos(s.yaw)-(p.z-s.z)*Math.sin(s.yaw),z=(p.x-s.x)*Math.sin(s.yaw)+(p.z-s.z)*Math.cos(s.yaw);if(s.length===0)return false;const nearestX=Math.max(-s.halfWidth,Math.min(s.halfWidth,x)),nearestZ=Math.max(0,Math.min(s.length,z));return Math.hypot(x-nearestX,z-nearestZ)<=.24;}
 const f=fixture(),e=enemy(f);for(const yaw of[0,.41,Math.PI])for(const cycle of[0,1]){e.atlantisCycle=cycle;f.at({x:e.x+Math.sin(yaw)*2,z:e.z+Math.cos(yaw)*2});const s=AT.lock(f.sim,e);for(const side of[-4,-1.23,-1.18,0,1.18,1.23,4])for(const forward of[-.3,-.18,0,1,3.2,3.68,5.7]){const p={x:s.x+Math.cos(s.yaw)*side+Math.sin(s.yaw)*forward,z:s.z-Math.sin(s.yaw)*side+Math.cos(s.yaw)*forward};assert.equal(AT.strikeContains(e,p),oracle(s,p),s.kind+' '+side+'/'+forward);}}
});
test('anchored intake meets canonical visible service cover without moving the machine',()=>{
 const f=fixture(),e=enemy(f),cover=W.definition(D.room).solids.find(s=>s.id==='custodian-service-bollard');
 assert.deepEqual(cover,{id:'custodian-service-bollard',x:12.5,z:-43,w:.7,d:.7,h:1.3,color:0x887356});
 f.at({x:13.4,z:-44.1});assert.ok(A.visible(f.sim,e,f.sim.state.player),'the centerline remains clear while the actual full-width intake meets cover');
 f.sim.tick(.05);const lane=e.strike;assert.equal(lane.kind,'intake');assert.ok(lane.length>3.5&&lane.length<4.5);assert.equal(AT.strikeContains(e,f.sim.state.player),false);
 assert.deepEqual({x:e.x,z:e.z},{x:D.enemy.x,z:D.enemy.z});
 const hp=f.sim.state.adventure.hp,position=copy(f.sim.state.player);
 for(let i=0;i<55;i++)f.sim.tick(.05);
 assert.equal(f.sim.state.adventure.hp,hp);assert.deepEqual(f.sim.state.player,position,'a clipped intake cannot pull the player behind its terminating obstacle');
});
test('locked intake clips the whole supported lane at real quay edges and opaque cover, not merely its centerline',()=>{
 const f=fixture(),e=enemy(f);e.atlantisCycle=1;f.at({x:8,z:-47});const south=AT.lock(f.sim,e);assert.ok(south.length>3.6&&south.length<3.7,'southern edge clips before unsupported water');
 for(const yaw of[0,.31,.77,1.2,Math.PI,4.5]){e.atlantisCycle=1;f.at({x:e.x+Math.sin(yaw)*3,z:e.z+Math.cos(yaw)*3});const s=AT.lock(f.sim,e);if(s.length===0)continue;for(let side=-s.halfWidth;side<=s.halfWidth+.001;side+=.1){const a={x:s.x+Math.cos(s.yaw)*side,z:s.z-Math.sin(s.yaw)*side},b={x:a.x+Math.sin(s.yaw)*s.length,z:a.z+Math.cos(s.yaw)*s.length};assert.ok(W.segment(D.room,a,b,.31),'independent actual whole-body segment oracle: yaw '+yaw+' side '+side);}}
 e.x=16;e.z=-42.85;e.atlantisCycle=1;f.at({x:19.5,z:-42.85});assert.ok(A.visible(f.sim,e,f.sim.state.player),'centerline clears actual existing bollard');const lane=AT.lock(f.sim,e);assert.ok(lane.length<1.4,'lane edge still intersects the inflated bollard');assert.equal(AT.strikeContains(e,f.sim.state.player),false);
});
test('pull requires exact real intake ownership/time/contact and preserves depth, yaw, HP and durable ledgers',()=>{
 const f=fixture(),e=enemy(f);f.at({x:8,z:-40.5});e.atlantisCycle=1;AT.lock(f.sim,e);e.mode='intake';e.timer=1.2;e.contactAt=f.sim.state.adventure.elapsed;f.sim.state.player.yaw=.7;f.sim.playerPath=[{x:9,z:-40}];const before=f.sim.snapshot(),start=copy(f.sim.state.player);
 assert.ok(AT.pull(f.sim,e,.1));assert.ok(Math.abs(f.sim.state.player.z-(start.z-.12))<1e-8);assert.equal(f.sim.state.player.yaw,.7);assert.deepEqual(f.sim.playerPath,[]);assert.deepEqual(f.sim.snapshot(),before);assert.ok(AT.runtime(f.sim).pullDistance>.119);
 const moved=copy(f.sim.state.player);for(const mutate of[()=>{e.mode='recover';},()=>{e.timer=0;},()=>{e.contactAt=100;},()=>{f.sim.paused=true;}]){e.mode='intake';e.timer=1.2;e.contactAt=f.sim.state.adventure.elapsed;f.sim.paused=false;mutate();assert.equal(AT.pull(f.sim,e,.1),false);assert.deepEqual(f.sim.state.player,moved);}f.sim.paused=false;e.mode='intake';e.timer=1.2;e.contactAt=0;assert.equal(AT.pull(f.sim,{...e},.1),false);assert.equal(AT.pull(f.sim,e,NaN),false);
 f.at({x:8,z:-42.75});for(let i=0;i<25;i++)AT.pull(f.sim,e,.1);assert.ok(Math.abs(Math.hypot(f.sim.state.player.x-e.strike.x,f.sim.state.player.z-e.strike.z)-1.2)<1e-7,'pull stops without crossing the real machine');
});
test('ordinary simulation time applies the final intake fraction once, then recovery; locked escape avoids contact',()=>{
 const f=fixture(),e=enemy(f);f.at({x:8,z:-40.5});e.atlantisCycle=1;AT.lock(f.sim,e);e.mode='intake';e.timer=.03;e.contactAt=0;A.runtime(f.sim).invincible=0;const z=f.sim.state.player.z,hp=f.sim.state.adventure.hp,frame=e.strike;f.sim.tick(.05);
 assert.ok(Math.abs(f.sim.state.player.z-(z-.036))<1e-8,'last positive 0.03s is physically applied');assert.equal(e.mode,'recover');assert.equal(e.damage,10);assert.equal(A.stats(f.sim.state.adventure).defense,1);assert.equal(f.sim.state.adventure.hp,hp-9,'ordinary travel coat retains its one point of defense');assert.strictEqual(e.strike,frame);const hitHP=f.sim.state.adventure.hp;f.sim.tick(.05);assert.equal(f.sim.state.adventure.hp,hitHP,'one contact cannot pay damage repeatedly');
 const escape=fixture(),unit=enemy(escape);escape.at({x:8,z:-40.5});unit.atlantisCycle=1;AT.lock(escape.sim,unit);unit.mode='intake';unit.timer=.03;unit.contactAt=0;A.runtime(escape.sim).invincible=0;escape.at({x:10,z:-40.5});const before=copy(escape.sim.state.player),health=escape.sim.state.adventure.hp;escape.sim.tick(.05);assert.deepEqual(escape.sim.state.player,before);assert.equal(escape.sim.state.adventure.hp,health);
});
test('real shallow current retains y and uses supported small motion; quiet depths, court, pause and refusal do not drift',()=>{
 const f=fixture();history(f,['receipt-conflict','choose-approach']);f.at({x:8,z:-25,y:-1.05,medium:'water'});const before=f.sim.snapshot();const y=f.sim.worldDive.y;assert.ok(AT.currentStatus(f.sim).active);assert.ok(AT.tick(f.sim,100));assert.ok(Math.abs(f.sim.state.player.z+25.07)<1e-8);assert.equal(f.sim.worldDive.y,y);assert.deepEqual(f.sim.snapshot(),before);
 for(const pose of[{x:8,z:-25,y:-2.55,medium:'water'},step('diagnose-flow'),{x:8,z:-25},{x:10,z:-25,y:-1.05,medium:'water'}]){f.at(pose);const p=copy(f.sim.state.player);assert.equal(AT.tick(f.sim,.1),false);assert.deepEqual(f.sim.state.player,p);}
 f.at(step('manual-bypass'));const workBefore=f.sim.snapshot();assert.equal(f.act('pressure',{step:'manual-bypass',setting:'open-bypass'}, {save:()=>({ok:false,error:'synthetic bypass refusal'})}).ok,false);assert.deepEqual(f.sim.snapshot(),workBefore);assert.ok(AT.currentStatus(f.sim).active);assert.ok(f.act('pressure',{step:'manual-bypass',setting:'open-bypass'}).ok);assert.equal(AT.currentStatus(f.sim).active,false);
 const active=fixture();history(active,['receipt-conflict','choose-approach']);active.at({x:8,z:-25,y:-1.05,medium:'water'});active.sim.paused=true;assert.equal(AT.tick(active.sim,.1),false);active.sim.paused=false;assert.equal(AT.tick(active.sim,NaN),false);active.sim.state.adventure.hp=0;assert.equal(AT.tick(active.sim,.1),false);
});
test('saved manual bypass survives reload without erasing required pressure stages or charging another fee',()=>{
 const f=fixture();history(f,['receipt-conflict','choose-approach']);work(f,'manual-bypass');const reloaded=fixture(f.sim.snapshot());reloaded.at({x:8,z:-25,y:-1.05,medium:'water'});assert.equal(AT.tick(reloaded.sim,.1),false);assert.equal(AT.ready(reloaded.sim.state),false);assert.ok(AT.required(reloaded.sim.state).includes('inlet-set'));assert.equal(AT.enemies(reloaded.sim).length,0);assert.equal(reloaded.sim.state.adventure.xp,0);assert.equal(W.diveExit(reloaded.sim).ok,false,'a bypass does not invent remote dry exits');
});
