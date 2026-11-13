/* Chapter III: a bounded local beacon defense, not a simulated public server.
 * Long-lived outcomes are separate from the resumable encounter checkpoint. */
(function(G){
'use strict';
const D=G.RealmDifficulty||(typeof require==='function'?require('./difficulty.js'):null);
const POINT={x:0,z:-24},dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const ROUTES=Object.freeze({monastery:'The mountain monastery',kingdom:'The fallen kingdom',forest:'The living forest'});
const WAVES=Object.freeze([
 [{id:'west-ash',name:'Ashbound raider',kind:'invader',x:-6,z:-18,hp:78,damage:15,wardDamage:6,windup:1,poise:true},
  {id:'east-ash',name:'Cinder claw',kind:'invader',x:6,z:-17,hp:78,damage:15,wardDamage:6,windup:1,poise:true}],
 [{id:'cantor',name:'The ember cantor',kind:'chanter',x:5,z:-16,hp:105,damage:17,wardDamage:9,windup:1,poise:true},
  {id:'veiled',name:'Veiled desecrator',kind:'saboteur',x:-7,z:-16,hp:80,damage:13,wardDamage:7,hidden:true,windup:1,poise:true},
  {id:'second-claw',name:'Ashbound raider',kind:'invader',x:1,z:-14,hp:85,damage:15,wardDamage:6,windup:1,poise:true}],
 [{id:'herald',name:'The Chainbound Herald',kind:'siegeboss',boss:true,x:0,z:-17,hp:D.boss('herald').hp,damage:D.boss('herald').damage,wardDamage:14,windup:1.35,attackOrder:['strike','double','line'],attackSpec:{double:{windup:1.2,r1:2.5,r2:4,gap:.8},line:{windup:1.2,length:7,half:1}}},
  {id:'last-claw',name:'The herald’s attendant',kind:'invader',x:5,z:-15,hp:90,damage:17,wardDamage:6,windup:1,poise:true}]
]);
function fresh(){return{version:1,introduced:false,complete:false,status:'dormant',attempts:0,failures:0,reward:false,relic:'undecided',route:null,soul:{grace:false,equipped:null,radiance:0,corruption:0,scars:[]}};}
function validate(raw,a){
 const bad=k=>{throw Error('Invalid beacon: '+k);};if(!raw||raw.version!==1)bad('version');const b=fresh();
 for(const k of['introduced','complete','reward']){if(typeof raw[k]!=='boolean')bad(k);b[k]=raw[k];}
 for(const k of['attempts','failures']){if(!Number.isSafeInteger(raw[k])||raw[k]<0||raw[k]>9999)bad(k);b[k]=raw[k];}
 if(!['dormant','awakened','corrupted','stable'].includes(raw.status))bad('status');b.status=raw.status;
 if(!['undecided','accepted','sealed','renounced'].includes(raw.relic))bad('relic');b.relic=raw.relic;
 if(raw.route!==null&&!Object.hasOwn(ROUTES,raw.route))bad('route');b.route=raw.route;
 const s=raw.soul;if(!s||typeof s.grace!=='boolean'||!['aegis','cinder',null].includes(s.equipped))bad('soul');
 for(const k of['radiance','corruption'])if(!Number.isInteger(s[k])||s[k]<0||s[k]>2)bad(k);
 if(!Array.isArray(s.scars)||s.scars.length>2||new Set(s.scars).size!==s.scars.length||s.scars.some(v=>!['cinder-invoked','cinder-renounced'].includes(v)))bad('scars');
 b.soul={grace:s.grace,equipped:s.equipped,radiance:s.radiance,corruption:s.corruption,scars:s.scars.slice()};
 if(b.introduced&&(!a.road.beaconLit||!a.road.cartRepaired)||b.complete&&!b.introduced||b.reward&&!b.complete)bad('story prerequisites');
 if((b.status==='stable')!==b.complete||!b.introduced&&b.status!=='dormant'||b.introduced&&b.status==='dormant')bad('state prerequisites');
 if((b.soul.grace||b.attempts||b.relic!=='undecided')&&!b.introduced||b.failures>b.attempts)bad('progress prerequisites');
 if(b.relic!=='undecided'&&!b.complete||b.route&&!b.complete)bad('completion prerequisite');
 if(s.equipped==='aegis'&&!s.grace||s.equipped==='cinder'&&b.relic!=='accepted')bad('equipped technique');
 if(s.corruption&&!s.scars.includes('cinder-invoked')||b.relic==='renounced'&&!s.scars.includes('cinder-renounced'))bad('history');
 if(s.radiance!==(s.grace?1:0)+(b.relic==='renounced'?1:0)||s.corruption!==(b.relic==='accepted'&&s.scars.includes('cinder-invoked')?1:0))bad('resonance');
 if(s.scars.includes('cinder-invoked')&&!['accepted','renounced'].includes(b.relic)||s.scars.includes('cinder-renounced')&&b.relic!=='renounced')bad('scar prerequisites');
 return b;
}
function runtime(sim){if(!sim.beaconRuntime)sim.beaconRuntime={phase:'idle',time:0,wave:0,ward:100,actors:[],serial:0,notice:'',repairAt:0,maraAt:0,ilanAt:0,playerRepairAt:0,defeats:0};return sim.beaconRuntime;}
function near(sim,r=4){return sim.room==='road'&&dist(sim.state.player,POINT)<r;}
function actors(sim){const C=G.RealmCore;return [
 {id:'oren',x:2,z:-3,yaw:0,goal:{x:-3,z:-22},role:'Repairing the ward'},
 {id:'mara',x:2,z:-2.8,yaw:0,goal:{x:3,z:-21},role:'Reading breach patterns'},
 {id:'ilan',x:2,z:-3.3,yaw:0,goal:{x:0,z:-20},role:'Keeping a steady signal'}
 ].map(q=>({...q,path:C.pathfind(q,q.goal,sim.navRoom)||[]}));}
function restoreWard(sim,n){const r=runtime(sim);if(r.phase!=='assault'||!near(sim,8))return false;r.ward=Math.min(100,r.ward+n);return true;}
function begin(sim,replay=false){const r=runtime(sim),b=sim.state.adventure.beacon;if(!replay&&b.attempts>=9999)return{ok:false,error:'Expedition attempt limit reached.'};
 if(!replay){b.attempts++;b.status='awakened';}Object.assign(r,{replay,phase:'assault',time:0,wave:0,ward:100,defeats:0,repairAt:4,maraAt:10,ilanAt:9,playerRepairAt:0});nextWave(sim);sim.event('beacon','The defense begins. The envoy holds the road open; the community defends its anchor.');return{ok:true,text:'Defend the Sunward Beacon. Stop the channelers and protect the ward.'};}
function nextWave(sim){const A=G.RealmAdventure,r=runtime(sim),ar=A.runtime(sim);r.wave++;r.phase='assault';r.waveStart=r.time;
 const now=sim.state.adventure.elapsed;
 ar.enemies=ar.enemies.filter(e=>!e.eventEnemy);
 for(const q of WAVES[r.wave-1])ar.enemies.push({...q,id:'siege-'+q.id,eventEnemy:true,maxHP:q.hp,xp:0,coins:0,ore:0,mode:'pursue',timer:0,yaw:Math.PI,aim:null,flash:0,path:[],nextPath:0,awareness:now+1e5,home:{x:q.x,z:q.z},born:now});
 A.notify(sim,'Breach '+r.wave+' of 3 · '+(r.wave===2?'Briar senses something hidden.':r.wave===3?'The Chainbound Herald has crossed.':'Raiders are coming for the beacon.'));
}
function fail(sim,why){const b=sim.state.adventure.beacon,r=runtime(sim);if(!['assault','intermission'].includes(r.phase))return;
 if(!r.replay){b.status='corrupted';b.failures=Math.min(9999,b.failures+1);}r.phase=r.replay?'won':'failed';G.RealmCombat.stop(sim,true);G.RealmAdventure.runtime(sim).enemies=G.RealmAdventure.runtime(sim).enemies.filter(e=>!e.eventEnemy);sim.event('beacon',r.replay?'The repeat assault ended. '+why+' The completed chapter and its rewards are unchanged.':'The ward faltered. '+why+' Reclaiming the beacon is possible; your home and earlier progress are untouched.');G.RealmAdventure.notify(sim,r.replay?'Repeat assault ended · the completed chapter remains.':'Beacon contested. Return to its light to reclaim it.');}
function win(sim){const A=G.RealmAdventure,a=sim.state.adventure,b=a.beacon,r=runtime(sim);if(r.replay){r.phase='won';G.RealmCombat.stop(sim,true);sim.event('beacon','Another breach repelled. No repeat reward was created.');A.notify(sim,'Repeat defense complete · no repeat loot.');return;}b.complete=true;b.status='stable';r.phase='won';r.ward=Math.max(1,r.ward);G.RealmCombat.stop(sim,true);a.revision++;sim.event('quest','The Sunward Beacon held. A map of lost roads answers the envoy. A cinder remains where the herald fell.');A.notify(sim,'Chapter III complete · Speak at the beacon for your reward and the roads beyond.');}
function damage(sim,e,n){if(!e?.eventEnemy)return false;const a=sim.state.adventure,r=runtime(sim);if(e.hp<=0||e.hidden)return true;
 e.hp=Math.max(0,e.hp-n);e.flash=a.elapsed+.18;G.RealmAdventure.fx(sim,'hit',e.x,e.z);if(e.poise&&e.hp>0&&e.mode==='windup'){e.mode='recover';e.timer=.5;e.omen=null;}if(e.hp===0){e.mode='dead';r.defeats++;G.RealmAdventure.notify(sim,e.name+' banished.');}return true;}
function handle(sim,type,p={}){
 if(!type.startsWith('beacon-')&&!['soul-equip','soul-purify'].includes(type))return null;
 const A=G.RealmAdventure,a=sim.state.adventure,b=a.beacon,r=runtime(sim),ar=A.runtime(sim),yes=text=>({ok:true,text}),no=error=>({ok:false,error});
 if(type==='soul-equip'){
  if(![null,'aegis','cinder'].includes(p.power)||p.power==='aegis'&&!b.soul.grace||p.power==='cinder'&&b.relic!=='accepted')return no('You have not chosen that technique.');
  b.soul.equipped=p.power;return yes(p.power==='aegis'?'Dawn aegis equipped.':p.power==='cinder'?'Cinder surge equipped.':'Mortal path · no soul technique equipped.');
 }
 if(!near(sim))return no('Approach the lit Sunward Beacon on the road.');
 if(!a.road.beaconLit||!a.road.cartRepaired)return no('Light the beacon and help Tessa first.');
 if(['assault','intermission'].includes(r.phase)&&type!=='beacon-repair')return no('Finish the assault before making a story choice.');
 switch(type){
 case 'beacon-answer':
  if(b.introduced)return no('The road has already answered. Prepare or continue the defense.');
  if(!a.road.reported){a.road.reported=true;if(!a.owned.includes('wayfarer_band'))a.owned.push('wayfarer_band');a.xp=Math.min(9999,a.xp+20);}
  b.introduced=true;b.status='awakened';Object.assign(r,{phase:'arrival',time:0,wave:0,ward:100,actors:actors(sim)});sim.playerPath=[];G.RealmCombat.stop(sim,true);sim.event('quest','A road believed dead has answered. The envoy descends through the Sunward Beacon; Oren, Mara and Ilan hurry up the road.');return yes('The beacon was not a lighthouse. It was a door.');
 case 'beacon-grace':
  if(!b.introduced||b.soul.grace||['arrival','assault','intermission'].includes(r.phase))return no('Speak with the envoy between battles.');b.soul.grace=true;b.soul.radiance++;b.soul.equipped='aegis';sim.event('choice','You accepted the envoy’s first Grace. The power is a gift, not a forced allegiance.');return yes('Dawn aegis learned · skill 5. You may unequip it at any time.');
 case 'beacon-replay':
  if(!b.complete||!['won','idle'].includes(r.phase))return no('Complete the chapter before repeating a defense.');
  if(!r.actors.length)r.actors=actors(sim).map(q=>({...q,...q.goal,path:[]}));
  a.hp=A.stats(a).maxHP;a.stamina=100;a.tonics=3;ar.invincible=a.elapsed+1;return begin(sim,true);
 case 'beacon-defend':
  if(!b.introduced||b.complete||b.attempts>=9999||!['ready','failed','idle'].includes(r.phase))return no('Wait for the arrival or finish the current defense.');
  if(!r.actors.length)r.actors=actors(sim).map(q=>({...q,...q.goal,path:[]}));
  a.hp=A.stats(a).maxHP;a.stamina=100;a.tonics=3;ar.invincible=a.elapsed+1;return begin(sim);
 case 'beacon-repair':
  if(r.phase!=='assault'||r.time<r.playerRepairAt||a.stamina<20||r.ward>=100)return no('Ward repair needs damage, 20 stamina and an 8-second recovery.');a.stamina-=20;r.ward=Math.min(100,r.ward+15);r.playerRepairAt=r.time+8;return yes('Ward repaired · +15 integrity.');
 case 'beacon-reward':
  if(!b.complete||b.reward)return no('The defense reward is not available.');if(a.coins>9984||a.arsenal.gems.moonstone>=9999)return no('Make room for 15 sunmarks and a moonstone.');a.coins+=15;a.arsenal.gems.moonstone++;b.reward=true;return yes('Defense reward · 15 sunmarks and a pearl moonstone.');
 case 'beacon-relic':
  if(!b.complete||b.relic!=='undecided'||!['accept','seal'].includes(p.choice))return no('Choose once what to do with the herald’s cinder.');
  b.relic=p.choice==='accept'?'accepted':'sealed';if(p.choice==='accept')b.soul.equipped='cinder';sim.event('choice',p.choice==='accept'?'You kept the herald’s cinder, knowing its health cost and the consequence of invoking it.':'You sealed the herald’s cinder rather than accepting its power.');return yes(p.choice==='accept'?'Cinder surge learned. Using it records corruption; accepting alone does not.':'The cinder is sealed. No power or corruption was imposed.');
 case 'soul-purify':
  if(!b.complete||b.relic!=='accepted')return no('There is no accepted cinder to renounce.');b.relic='renounced';b.soul.corruption=0;b.soul.radiance++;b.soul.scars.push('cinder-renounced');if(b.soul.equipped==='cinder')b.soul.equipped=b.soul.grace?'aegis':null;sim.event('choice','You relinquished the cinder. Its power and current corruption are gone. The history of your choice remains.');return yes('Cinder relinquished. History preserved; current corruption cleared.');
 case 'beacon-route':
  if(!b.complete||!Object.hasOwn(ROUTES,p.route))return no('The lost-road projection is not ready.');b.route=p.route;return yes('Charted: '+ROUTES[p.route]+'. This destination is not playable in this prototype yet.');
 default:return no('Unknown beacon action.');
 }
}
function tick(sim,dt){
 const A=G.RealmAdventure,a=sim.state.adventure,b=a.beacon,r=runtime(sim),ar=A.runtime(sim);
 if(sim.room!=='road'){
  if(['assault','intermission'].includes(r.phase))fail(sim,'The defenders withdrew.');
  r.actors=[];if(r.phase!=='failed')r.phase='idle';return;
 }
 if(!b.introduced)return;
 if(r.phase==='idle'){
  r.phase=b.complete?'won':b.status==='corrupted'?'failed':'ready';r.actors=actors(sim).map(q=>({...q,...q.goal,path:[]}));
 }
 if(sim.paused||a.hp<=0){if(a.hp<=0)fail(sim,'The bearer fell.');return;}
 r.time+=dt;
 for(const q of r.actors)if(q.path.length)sim.advance(q,q.path,dt,3.1);
 if(r.phase==='arrival'){if(r.time>=9&&r.actors.every(q=>!q.path.length)){r.phase='ready';A.notify(sim,'The envoy is here. Approach the beacon and choose when to begin.');}return;}
 if(r.phase==='intermission'){if(r.time>=r.nextWave)nextWave(sim);return;}
 if(r.phase!=='assault')return;
 const enemies=ar.enemies.filter(e=>e.eventEnemy&&e.hp>0),p=sim.state.player;
 if(r.time>=r.repairAt){r.repairAt=r.time+4;r.ward=Math.min(100,r.ward+3);}
 if(r.time>=r.maraAt){r.maraAt=r.time+11;for(const e of enemies){if(e.hidden){e.hidden=false;A.notify(sim,'Mara’s lens revealed the veiled desecrator.');}e.exposedUntil=a.elapsed+3;}}
 if(r.time>=r.ilanAt){r.ilanAt=r.time+9;if(dist(p,POINT)<12)a.stamina=Math.min(100,a.stamina+12);A.fx(sim,'insight',0,-20,0xc4b3e0);}
 for(const e of enemies){
  e.timer-=dt;
  if(e.hidden&&a.elapsed-e.born>12)e.hidden=false;
  if(e.mode==='windup'){
   if(e.timer<=0){
    if(e.omen){if(G.RealmCombat.strike(sim,e))continue;}
    else if(e.aimWard){r.ward=Math.max(0,r.ward-e.wardDamage);A.fx(sim,'cinder',0,-24,0xd87786);}
    else if(dist(p,e.aim)<(e.kind==='siegeboss'?2.5:1.3)&&A.visible(sim,e,p))A.takeDamage(sim,e.damage);
    e.mode='recover';e.timer=e.kind==='siegeboss'?(e.hp<e.maxHP/2?1.1:1.7):1.4;
   }continue;
  }
  if(e.mode==='recover'){if(e.timer<=0)e.mode='pursue';continue;}
  const playerNear=dist(p,e)<(e.kind==='siegeboss'?4:2.8)&&A.visible(sim,e,p);
  const wardReach=e.kind==='chanter'?8:e.kind==='siegeboss'?4:2.2;
  if(playerNear||dist(e,POINT)<wardReach){e.aimWard=!playerNear;const omen=playerNear?G.RealmCombat.cycle(e,p):null;e.omen=omen;e.aim=omen?null:playerNear?{x:p.x,z:p.z}:{...POINT};e.mode='windup';e.timer=omen?omen.windup:e.windup;const aimAt=playerNear?p:POINT;e.yaw=Math.atan2(aimAt.x-e.x,aimAt.z-e.z);e.path=[];continue;}
  e.mode='pursue';A.followPath(sim,e,{x:e.x<0?-1.2:1.2,z:-22.6},dt,e.kind==='siegeboss'?1.3:1.65);
 }
 if(r.ward<=0){fail(sim,'The infernal signal overwhelmed the ward.');return;}
 if(!enemies.length){if(r.wave>=3)win(sim);else{r.phase='intermission';r.nextWave=r.time+7;A.notify(sim,'The breach pauses. Regroup — another wave is approaching.');}}
}
function objective(a){const b=a.beacon;
 if(!b.introduced)return{title:'The Beacon Answers',detail:'Return to the lit Sunward Beacon. The envoy can cross there.'};
 if(!b.complete)return{title:b.status==='corrupted'?'Reclaim the Sunward Beacon':'Hold the road open',detail:'Meet the envoy at the beacon. Prepare, then defend three breaches.'};
 if(!b.reward)return{title:'A community kept the light',detail:'Claim your defense reward at the beacon.'};
 if(b.relic==='undecided')return{title:'A cinder left behind',detail:'Decide whether to keep or seal the herald’s temptation.'};
 return{title:'The lost roads',detail:b.route?'A route is charted. More of Earth lies ahead.':'Inspect the beacon network and chart a future route.'};
}
G.RealmBeacon={POINT,ROUTES,WAVES,fresh,validate,runtime,near,restoreWard,handle,tick,damage,fail,objective};
if(typeof module!=='undefined')module.exports=G.RealmBeacon;
})(globalThis);
