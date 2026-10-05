/* Firstlight 09: explicit target selection, autoattack and a small skill kit.
 * Runtime intent is never saved. Input, art and menus do not award damage. */
(function (G) {
'use strict';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const skills=Object.freeze({
 guard:{name:'Brace',cost:20,cooldown:8,duration:3,description:'Take half damage for 3 seconds. Does not stop movement.'},
 insight:{name:'Briar’s insight',cost:0,cooldown:10,duration:6,description:'Reveal hidden invaders, expose the selected foe and interrupt its warning. With no foe, seek a road scent.'},
 aegis:{name:'Dawn aegis',cost:25,cooldown:18,duration:5,description:'Absorb 35 incoming damage for 5 seconds; restore 8 ward near the contested beacon.'},
 cinder:{name:'Cinder surge',cost:12,cooldown:12,duration:0,description:'Spend 12 health for a heavy targeted strike. First use records a lasting scar and current corruption.'}
});
function runtime(sim){
 const r=G.RealmAdventure.runtime(sim);
 if(!r.tactics)r.tactics={scene:sim.room,target:null,auto:false,nextAttack:0,guardUntil:0,shield:0,shieldUntil:0,cooldowns:{guard:0,insight:0,spirit:0},hits:[],serial:0};
 if(r.tactics.scene!==sim.room){r.tactics.scene=sim.room;r.tactics.target=null;r.tactics.auto=false;r.tactics.windup=null;r.tactics.motion=null;r.tactics.hits=[];}
 return r.tactics;
}
function canTarget(sim,e){return !!e&&e.hp>0&&!e.hidden&&dist(sim.state.player,e)<=22;}
function candidates(sim){return G.RealmAdventure.runtime(sim).enemies.filter(e=>canTarget(sim,e)).sort((a,b)=>dist(sim.state.player,a)-dist(sim.state.player,b)||a.id.localeCompare(b.id));}
function selected(sim){const t=runtime(sim);return G.RealmAdventure.runtime(sim).enemies.find(e=>e.id===t.target&&canTarget(sim,e))||null;}
function stop(sim,clear=false){const t=runtime(sim);t.auto=false;t.windup=null;if(clear)t.target=null;}
function pose(sim){const t=runtime(sim),now=sim.state.adventure.elapsed;if(t.windup)return{style:t.windup.style,phase:'anticipate',progress:Math.min(1,(now-t.windup.started)/.12)};if(t.motion&&now-t.motion.at<.28)return{style:t.motion.style,phase:'recover',progress:(now-t.motion.at)/.28};return{style:G.RealmArsenal.weapon(sim.state.adventure).style,phase:'idle',progress:0};}
function readiness(sim){
 const A=G.RealmAdventure,a=sim.state.adventure,r=A.runtime(sim),t=runtime(sim),e=selected(sim),w=G.RealmArsenal.weapon(a);
 if(!e)return 'Select a target with Tab';
 if(sim.paused)return 'Paused';
 if(a.hp<=0)return 'Recover at the spring';
 if(dist(sim.state.player,e)>=w.reach)return 'Out of range — move closer';
 const clear=w.style==='bow'?G.RealmArsenal.aimClear(sim,sim.state.player,e):A.visible(sim,sim.state.player,e);
 if(!clear)return 'Line of sight blocked';
 if(a.stamina<w.stamina)return 'Recovering stamina';
 if(a.elapsed<r.cooldowns.attack)return 'Weapon recovering';
 return t.auto?'Autoattack active':'Ready · 1 to autoattack';
}
// Read current AI intent only. Timers and damage remain with their encounter owner.
function threat(sim){
 const a=sim.state.adventure;if(sim.paused||!a.started||a.hp<=0||!G.RealmAdventure.combatScene(sim))return null;
 const e=selected(sim);if(!e||e.kind==='practice')return null;
 const known=e.custom==='bell'?e.kind==='bellwarden':e.eventEnemy?['invader','chanter','saboteur','siegeboss'].includes(e.kind):['skitter','sentinel','boss','charger'].includes(e.kind);
 if(!known)return null;
 if(e.mode==='charge')return e.kind==='charger'&&Number.isFinite(e.chargeLeft)&&e.chargeLeft>0?{phase:'charge',kind:'charge',remaining:null}:null;
 if(!['windup','recover'].includes(e.mode)||!Number.isFinite(e.timer)||e.timer<=0)return null;
 if(e.mode==='recover')return{phase:'recover',kind:'opening',remaining:e.timer};
 if(!e.aim||!Number.isFinite(e.aim.x)||!Number.isFinite(e.aim.z))return null;
 let kind='strike';
 if(G.RealmHellCampaign?.encounter(e)){if(!e.strike||!['line','sweep'].includes(e.strike.kind))return null;kind='writ-'+e.strike.kind;}
 else if(G.RealmEarthExpedition?.encounter(e)){if(!e.strike||![e.strike.x,e.strike.z,e.strike.yaw].every(Number.isFinite))return null;kind='bank-sweep';}
 else if(e.custom==='bell'){if(!['inner','outer'].includes(e.ringMode))return null;kind='bell-'+e.ringMode;}
 else if(e.eventEnemy&&e.aimWard)kind='ward';
 else if(e.kind==='charger')kind='charge';
 return{phase:'windup',kind,remaining:e.timer};
}
function handle(sim,type,p={}){
 const A=G.RealmAdventure,a=sim.state.adventure,r=A.runtime(sim),t=runtime(sim),fail=error=>({ok:false,error}),yes=text=>({ok:true,text});
 if(type==='target-cycle'){
  const list=candidates(sim);if(!list.length){t.target=null;t.auto=false;return yes('No enemies within targeting distance.');}
  const old=list.findIndex(e=>e.id===t.target),step=p.reverse?-1:1;
  t.target=list[old<0?(step<0?list.length-1:0):(old+step+list.length)%list.length].id;
  return yes('Target: '+selected(sim).name);
 }
 if(type==='target-select'){
  const e=r.enemies.find(e=>e.id===p.id);if(!canTarget(sim,e))return fail('That target is not available.');t.target=e.id;return yes('Target: '+e.name);
 }
 if(type==='target-clear'){stop(sim,true);return yes('Target cleared.');}
 if(type==='auto-toggle'){
  if(!A.combatScene(sim)||!a.started)return fail('Autoattack is for expeditions and the practice court.');
  if(!t.auto&&!selected(sim)){const list=candidates(sim);if(!list.length)return fail('No enemy to select.');t.target=list[0].id;}
  t.auto=!t.auto;if(!t.auto)t.windup=null;return yes(t.auto?'Autoattack on. Move into range; movement remains yours.':'Autoattack off.');
 }
 if(!['guard','insight','spirit'].includes(type))return null;
 if(!A.combatScene(sim)||!a.started||a.hp<=0)return fail('Use this skill during an expedition.');
 const now=a.elapsed;
 if(now<t.cooldowns[type])return fail('That skill is recovering.');
 if(type==='guard'){
  if(a.stamina<skills.guard.cost)return fail('Brace needs 20 stamina.');a.stamina-=20;t.guardUntil=now+3;t.cooldowns.guard=now+8;A.fx(sim,'guard',sim.state.player.x,sim.state.player.z,0xa8ced9);return yes('Braced · incoming damage halved for 3 seconds.');
 }
 if(type==='insight'){
  if(!a.companion.bonded||a.companion.mode!=='follow'||r.companion.room!==sim.room)return fail('Briar must be following you.');
  const nearby=r.enemies.filter(e=>e.hp>0&&e.kind!=='practice'&&dist(sim.state.player,e)<13);
  if(!nearby.length)return fail('No foe nearby. Use Seek on the road to find buried scents.');
  for(const e of nearby)if(e.hidden){e.hidden=false;A.notify(sim,'Briar revealed '+e.name+'.');}
  const e=selected(sim)||nearby.sort((x,y)=>dist(sim.state.player,x)-dist(sim.state.player,y))[0];
  e.exposedUntil=now+6;if(e.mode==='windup'){e.mode='recover';e.timer=1.5;}t.cooldowns.insight=now+10;
  A.fx(sim,'insight',e.x,e.z,0xa9d6a2);return yes('Briar exposed '+e.name+' · +20% damage for 6 seconds.');
 }
 const b=a.beacon,power=b?.soul.equipped;
 if(power==='aegis'&&b.soul.grace){
  if(a.stamina<25)return fail('Dawn aegis needs 25 stamina.');a.stamina-=25;t.shield=35;t.shieldUntil=now+5;t.cooldowns.spirit=now+18;
  G.RealmBeacon?.restoreWard(sim,8);A.fx(sim,'aegis',sim.state.player.x,sim.state.player.z,0xf1d69c);return yes('Dawn aegis · 35 barrier for 5 seconds.');
 }
 if(power==='cinder'&&b.relic==='accepted'){
  const e=selected(sim);if(!e||e.kind==='practice'||dist(sim.state.player,e)>10||!A.visible(sim,sim.state.player,e))return fail('Select a visible foe within 10 paces.');
  if(a.hp<=12)return fail('Cinder surge needs more than 12 health.');
  a.hp-=12;t.cooldowns.spirit=now+12;
  if(!b.soul.scars.includes('cinder-invoked')){b.soul.scars.push('cinder-invoked');b.soul.corruption=1;sim.event('choice','You invoked the cinder willingly. The deed remains in your history even if you renounce its power.');}
  A.damageEnemy(sim,e,Math.round(A.stats(a).attack*2.3));A.fx(sim,'cinder',e.x,e.z,0xe27d86);return yes('Cinder surge · health paid, power released.');
 }
 return fail('No soul technique equipped. You may remain entirely mortal.');
}
function mitigate(sim,damage){
 const a=sim.state.adventure,t=runtime(sim);let n=damage;
 if(a.elapsed<t.guardUntil)n=Math.max(1,Math.ceil(n*.5));
 if(a.elapsed<t.shieldUntil&&t.shield>0){const absorb=Math.min(t.shield,n);t.shield-=absorb;n-=absorb;}
 return n;
}
function hit(sim,e,n){const t=runtime(sim),a=sim.state.adventure;e.hitAt=a.elapsed;e.hitFrom={x:sim.state.player.x,z:sim.state.player.z};t.hits.push({x:e.x,z:e.z,n,at:a.elapsed,id:++t.serial});if(t.hits.length>20)t.hits.shift();}
function tick(sim){
 const A=G.RealmAdventure,a=sim.state.adventure,r=A.runtime(sim),t=runtime(sim);
 if(t.scene!==sim.room){t.scene=sim.room;t.target=null;t.auto=false;}
 t.hits=t.hits.filter(h=>a.elapsed-h.at<.9);
 if(a.elapsed>=t.shieldUntil)t.shield=0;
 if(a.hp<=0){stop(sim,true);return;}
 if(t.target&&!selected(sim)){stop(sim,true);return;}
 if(sim.paused||!t.auto){t.windup=null;return;}
 const e=selected(sim),w=G.RealmArsenal.weapon(a);
 if(!e||!A.combatScene(sim)||a.stamina<w.stamina||dist(sim.state.player,e)>=w.reach||!(w.style==='bow'?G.RealmArsenal.aimClear(sim,sim.state.player,e):A.visible(sim,sim.state.player,e))){t.windup=null;return;}
 if(t.windup&&(t.windup.target!==e.id||t.windup.weapon!==a.equipment.weapon))t.windup=null;
 // Anticipation occupies the last .12s of recovery. It never subtracts from
 // the weapon's authoritative cooldown or grants damage from presentation.
 if(!t.windup){if(a.elapsed<r.cooldowns.attack-.12)return;t.windup={target:e.id,weapon:a.equipment.weapon,style:w.style,started:a.elapsed,impactAt:Math.max(a.elapsed+.12,r.cooldowns.attack)};}
 sim.state.player.yaw=Math.atan2(e.x-sim.state.player.x,e.z-sim.state.player.z);
 if(a.elapsed+1e-8<t.windup.impactAt||a.elapsed<r.cooldowns.attack)return;
 const result=sim.adventureCommand('auto-'+(++t.serial)+'-'+a.revision,'attack',{target:e.id});
 if(result.ok)t.motion={style:w.style,at:a.elapsed};t.windup=null;
}
G.RealmCombat={skills,runtime,candidates,selected,stop,pose,readiness,threat,handle,mitigate,hit,tick};
if(typeof module!=='undefined')module.exports=G.RealmCombat;
})(globalThis);
