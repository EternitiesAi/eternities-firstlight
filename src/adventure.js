/* Firstlight 08 — The Feather Beneath Wildwood and the Sunward Road.
 * Deterministic local action-RPG rules; UI and art submit/read, not invent outcomes.
 * Not a network authority or resident-mind host. Offline saves remain user editable.
 */
(function(G){'use strict';
const ROAD=G.RealmRoad||(typeof require==='function'?require('./road.js'):null);
const AR=G.RealmArsenal||(typeof require==='function'?require('./arsenal.js'):null);
const B=G.RealmBeacon||(typeof require==='function'?require('./beacon.js'):null);
const T=G.RealmCombat||(typeof require==='function'?require('./combat.js'):null);
const CROSS=G.RealmCrossing||(typeof require==='function'?require('./crossing.js'):null);
const Q=G.RealmStarter||(typeof require==='function'?require('./starter.js'):null);
const H=G.RealmPursuit||(typeof require==='function'?require('./pursuit.js'):null);
const K=G.RealmClasses||(typeof require==='function'?require('./classes.js'):null);
const ES=G.RealmEarthStory||(typeof require==='function'?require('./earth-story.js'):null);
const EN=G.RealmEarthNotes||(typeof require==='function'?require('./earth-notes.js'):null);
const EG=G.RealmGathering||(typeof require==='function'?require('./gathering.js'):null);
const FORGE=Object.freeze({ore:4,coins:4});
const RC=G.RealmCraft||(typeof require==='function'?require('./realm-craft.js'):null);
const EE=G.RealmEarthExpedition||(typeof require==='function'?require('./earth-expedition.js'):null);
const VERSION=12,CELL=2,LIMIT=7,REACH=2.8,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const MINE={id:'mine',name:'The Rootbound Underways',x:0,z:-48},ENTRANCE={x:0,z:11,yaw:Math.PI},FOX={x:-8,z:2},RELIC={x:9,z:-10};
const GEAR=Object.freeze({
 ...AR.GEAR,...CROSS.GEAR,...Q.GEAR,
 courier_mantle:{name:'Courier’s storm mantle',slot:'armor',attack:0,defense:7,hp:20,tier:'Merchant',color:'#91bdc0',desc:'Tessa’s weatherproof travelling armor. 18 sunmarks.'},
 wayfarer_band:{name:'Band of the returning light',slot:'charm',attack:4,defense:2,hp:15,tier:'Quest',color:'#e7c691',desc:'The envoy’s recognition of a road restored, not a replacement for your first gift.'},
 trail_blade:{name:'Trail blade',slot:'weapon',attack:12,defense:0,hp:0,tier:'Common',color:'#c0c8bd',desc:'A dependable blade from Oren’s workshop.'},
 travel_coat:{name:'Travel coat',slot:'armor',attack:0,defense:1,hp:0,tier:'Common',color:'#9c967d',desc:'A little protection for the road.'},
 copper_blade:{name:'Copper-edged blade',slot:'weapon',attack:19,defense:0,hp:0,tier:'Crafted',color:'#dca77b',desc:'Forged from four copper ore and four sunmarks.'},
 guard_vest:{name:'Underway guard’s vest',slot:'armor',attack:0,defense:4,hp:15,tier:'Uncommon',color:'#7ea99d',desc:'Recovered from the sentinel’s cache.'},
 dawn_edge:{name:'Dawn’s edge',slot:'weapon',attack:25,defense:0,hp:0,tier:'Rare',color:'#edc78e',desc:'One of the envoy’s gifts. A light for the road ahead.'},
 warden_stone:{name:'Warden’s heartstone',slot:'charm',attack:2,defense:3,hp:25,tier:'Rare',color:'#abc89c',desc:'One of the envoy’s gifts. Endurance rather than haste.'}
});
const ENEMIES=Object.freeze([
 {id:'briar-1',name:'Briar skitter',kind:'skitter',x:-4,z:2,hp:35,damage:9,xp:20,ore:1,coins:3},
 {id:'briar-2',name:'Root prowler',kind:'skitter',x:0,z:-3,hp:48,damage:11,xp:25,ore:1,coins:4},
 {id:'sentinel',name:'Prism sentinel',kind:'sentinel',x:8,z:-3,hp:70,damage:13,xp:35,ore:2,coins:6,gear:'guard_vest'},
 {id:'hart',name:'The Hollow Hart',kind:'boss',x:8,z:-10,hp:240,damage:24,xp:90,ore:4,coins:12}
]);
const key=(x,z)=>x+','+z,cellAt=(x,z)=>({gx:Math.round(x/CELL),gz:Math.round(z/CELL)}),cellPoint=(gx,gz)=>({x:gx*CELL,z:gz*CELL});
function validCell(x,z){return Number.isInteger(x)&&Number.isInteger(z)&&Math.abs(x)<LIMIT&&Math.abs(z)<LIMIT;}
function initialFloor(x,z){return(x>=-2&&x<=2&&z>=3&&z<=6)||(x>=-5&&x<=-1&&z>=0&&z<=2)||(x>=-1&&x<=1&&z>=-4&&z<=3&&z!==1)||(x>=2&&x<=6&&z>=-6&&z<=-1&&!(x===2&&z>=-3&&z<=-1));}
function isFloor(s,x,z){return validCell(x,z)&&(initialFloor(x,z)||s.dug.includes(key(x,z)));}
function mineral(x,z){return!initialFloor(x,z)&&((x*13+z*7)%5===0||x<=-3&&z<=-2);}
function wallHP(x,z){return mineral(x,z)?3:2;}
function walkable(s,x,z,r=.31){if(!s||!Number.isFinite(x)||!Number.isFinite(z))return false;for(const[dx,dz]of[[-r,-r],[-r,r],[r,-r],[r,r],[0,0]]){const c=cellAt(x+dx,z+dz);if(!isFloor(s,c.gx,c.gz))return false;}return true;}
function line(s,a,b){const n=Math.ceil(dist(a,b)/.18);for(let i=0;i<=n;i++){const t=n?i/n:0;if(!walkable(s,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,.04))return false;}return true;}
function fresh(){return{version:VERSION,earthBinding:EE.freshBinding(),realmCraft:RC.fresh(),earthGathering:EG.fresh(),earthNotes:EN.fresh(),earthStory:ES.fresh(),classPath:K.fresh(),pursuit:H.fresh(),starter:Q.fresh(),crossing:CROSS.fresh(),beacon:B.fresh(),arsenal:AR.fresh(),road:ROAD.fresh(),elapsed:0,revision:0,started:false,dug:[],chips:[],defeated:[],drops:[],ore:0,coins:0,xp:0,hp:100,stamina:100,tonics:3,equipment:{weapon:null,armor:null,charm:null},owned:[],companion:{bonded:false,name:'Briar',mode:'follow'},relic:false,angelSeen:false,reward:null,deaths:0,receipts:[]};}
function level(s){return 1+[30,80,150,260].filter(n=>s.xp>=n).length;}
function stats(s){let l=level(s),o={level:l,attack:4+(l-1)*2,defense:0,maxHP:100+(l-1)*10};for(const id of Object.values(s.equipment)){const g=GEAR[id];if(g){o.attack+=g.attack+Q.bonus(s,id)+H.bonus(s,id)+RC.bonus(s,id);const binding=EE.bonus(s,id);o.attack+=binding.attack;o.defense+=g.defense+binding.defense;o.maxHP+=g.hp+binding.maxHP;}}const gem=AR.activeGem(s);if(gem){o.attack+=gem.attack;o.maxHP+=gem.hp;}return o;}
function validate(raw){
 if(raw&&raw.version>VERSION)throw Error('Unsupported future adventure version. Keep a backup and use a newer build.');
 if(raw&&raw.version===1)raw={...raw,version:3,arsenal:AR.fresh(),road:ROAD.fresh()};
 if(raw&&raw.version===2)raw={...raw,version:3,arsenal:AR.fresh()};
 if(raw&&raw.version===3)raw={...raw,version:4,beacon:B.fresh()};
 if(raw&&raw.version===4)raw={...raw,version:5,crossing:CROSS.fresh()};
 if(raw&&raw.version===5)raw={...raw,version:6,pursuit:H.fresh(),starter:Q.fresh()};
 if(raw&&raw.version===6)raw={...raw,version:7,classPath:K.fresh()};
 if(raw&&raw.version===7)raw={...raw,version:8,earthStory:ES.fresh()};
 if(raw&&raw.version===8)raw={...raw,version:9,earthNotes:EN.fresh()};
 if(raw&&raw.version===9)raw={...raw,version:10,earthGathering:EG.fresh()};
 if(raw&&raw.version===10)raw={...raw,version:11,realmCraft:RC.fresh()};
 if(raw&&raw.version===11)raw={...raw,version:12,earthBinding:EE.freshBinding()};
 const no=f=>{throw Error('Invalid adventure: '+f);};if(!raw||raw.version!==VERSION)no('version');const s=fresh();
 for(const k of['elapsed','hp','stamina']){if(!Number.isFinite(raw[k])||raw[k]<0||raw[k]>1e9)no(k);s[k]=raw[k];}
 for(const k of['revision','ore','coins','xp','tonics','deaths']){if(!Number.isSafeInteger(raw[k])||raw[k]<0||raw[k]>(k==='revision'?1e9:9999))no(k);s[k]=raw[k];}
 for(const k of['started','relic','angelSeen']){if(typeof raw[k]!=='boolean')no(k);s[k]=raw[k];}
 if(!Array.isArray(raw.dug)||raw.dug.length>169||new Set(raw.dug).size!==raw.dug.length)no('excavation');
 for(const id of raw.dug){if(typeof id!=='string'||!/^(-?\d+),(-?\d+)$/.test(id))no('cell');const[x,z]=id.split(',').map(Number);if(!validCell(x,z)||initialFloor(x,z)||key(x,z)!==id)no('dug cell');}s.dug=raw.dug.slice();
 if(!Array.isArray(raw.chips)||raw.chips.length>169||new Set(raw.chips.map(c=>c?.id)).size!==raw.chips.length)no('wall chips');
 s.chips=raw.chips.map(c=>{if(!c||typeof c.id!=='string'||!/^(-?\d+),(-?\d+)$/.test(c.id))no('chip');const[x,z]=c.id.split(',').map(Number);if(!validCell(x,z)||key(x,z)!==c.id||initialFloor(x,z)||s.dug.includes(c.id)||!Number.isInteger(c.hp)||c.hp<1||c.hp>=wallHP(x,z))no('chip hp');return{id:c.id,hp:c.hp};});
 if(!Array.isArray(raw.defeated)||raw.defeated.length>ENEMIES.length+ROAD.ENEMIES.length+CROSS.ENEMIES.length+Q.ENEMIES.length||new Set(raw.defeated).size!==raw.defeated.length||raw.defeated.some(id=>![...ENEMIES,...ROAD.ENEMIES,...CROSS.ENEMIES,...Q.ENEMIES].some(e=>e.id===id)))no('defeated');s.defeated=raw.defeated.slice();
 if(!Array.isArray(raw.drops)||raw.drops.length>ENEMIES.length+ROAD.ENEMIES.length+CROSS.ENEMIES.length+Q.ENEMIES.length||new Set(raw.drops).size!==raw.drops.length||raw.drops.some(id=>!s.defeated.includes(id)))no('drops');s.drops=raw.drops.slice();
 if(!Array.isArray(raw.owned)||raw.owned.length>Object.keys(GEAR).length||new Set(raw.owned).size!==raw.owned.length||raw.owned.some(id=>!Object.hasOwn(GEAR,id)))no('gear');s.owned=raw.owned.slice();
 if(!raw.equipment||typeof raw.equipment!=='object')no('equipment');for(const slot of['weapon','armor','charm']){const id=raw.equipment[slot];if(id!==null&&(!s.owned.includes(id)||GEAR[id].slot!==slot))no('equipped slot');s.equipment[slot]=id;}
 const c=raw.companion;if(!c||typeof c.bonded!=='boolean'||typeof c.name!=='string'||!c.name.trim()||c.name.length>24||!['follow','stay'].includes(c.mode))no('companion');s.companion={bonded:c.bonded,name:c.name,mode:c.mode};
 if(raw.reward!==null&&!['dawn_edge','warden_stone'].includes(raw.reward))no('reward');s.reward=raw.reward;
 if(s.relic&&!s.defeated.includes('hart')||s.angelSeen&&!s.relic||s.reward&&(!s.angelSeen||!s.owned.includes(s.reward)))no('story prerequisites');
 if(!s.started&&(s.defeated.length||s.dug.length||s.companion.bonded||s.relic||s.owned.length))no('unstarted progression');
 s.realmCraft=RC.validate(raw.realmCraft,s,GEAR);
 s.earthBinding=EE.validateBinding(raw.earthBinding,s,GEAR);
 s.classPath=K.validate(raw.classPath,s);
 s.earthStory=ES.validate(raw.earthStory,s);
 s.earthNotes=EN.validate(raw.earthNotes,s);
 s.earthGathering=EG.validate(raw.earthGathering,s);
 s.starter=Q.validate(raw.starter,s);
 s.pursuit=H.validate(raw.pursuit,s);
 s.arsenal=AR.validate(raw.arsenal,s);
 if(s.stamina>100||s.hp>stats(s).maxHP||s.tonics>3)no('vitals');
 if(!Array.isArray(raw.receipts)||raw.receipts.length>100||new Set(raw.receipts.map(r=>r?.id)).size!==raw.receipts.length)no('receipts');
 s.receipts=raw.receipts.map(r=>{if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||typeof r.fp!=='string'||r.fp.length>500||typeof r.ok!=='boolean')no('receipt');return{id:r.id,fp:r.fp,ok:r.ok};});s.road=ROAD.validate(raw.road,s);s.beacon=B.validate(raw.beacon,s);s.crossing=CROSS.validate(raw.crossing,s);return s;
}
function combatScene(sim){if(G.RealmWorldFoundations?.handles(sim.room))return !sim.worldDive&&(!!G.RealmWorldFoundations.definition(sim.room)?.enemies?.length||!!G.RealmTrails?.enemies(sim).length);return sim.room===Q.ROOM||sim.room==='mine'||sim.room==='road'||sim.room==='range'||sim.room==='crossing';}
function roster(sim){if(G.RealmWorldFoundations?.handles(sim.room))return[...G.RealmWorldFoundations.enemies(sim),...(G.RealmTrails?.enemies(sim)||[]),...EE.enemies(sim)];return sim.room===Q.ROOM?[Q.PRACTICE,...(sim.state.adventure.pursuit.active?H.enemies(sim.state.adventure):sim.state.adventure.starter.accepted?Q.ENEMIES:[])]:sim.room==='crossing'?CROSS.ENEMIES:sim.room==='range'?AR.RANGE.targets.map(d=>({...d,hp:100,maxHP:100})):sim.room==='road'?ROAD.ENEMIES:sim.room==='mine'?ENEMIES:[];}
function visible(sim,a,b){if(G.RealmWorldFoundations?.handles(sim.room))return !sim.worldDive&&G.RealmWorldFoundations.segment(sim.room,a,b,.04);if(sim.room===G.RealmCosmos?.ROOM)return G.RealmCosmos.line(a,b);return sim.room===Q.ROOM?Q.line(a,b):sim.room==='crossing'?CROSS.line(a,b):sim.room==='range'?AR.aimClear(sim,a,b):sim.room==='road'?ROAD.line(a,b):sim.room==='mine'?line(sim.state.adventure,a,b):G.RealmCore.segment(a,b,sim.navRoom);}
function ground(sim,x,z,r=.31){if(G.RealmWorldFoundations?.handles(sim.room))return !sim.worldDive&&G.RealmWorldFoundations.walkable(sim.room,x,z,r);if(sim.room===G.RealmCosmos?.ROOM)return G.RealmCosmos.walkable(x,z,r);return sim.room===Q.ROOM?Q.walkable(x,z,r):sim.room==='crossing'?CROSS.walkable(x,z,r):sim.room==='range'?AR.rangeWalkable(x,z,r):sim.room==='road'?ROAD.walkable(x,z,r):sim.room==='mine'?walkable(sim.state.adventure,x,z,r):G.RealmCore.walkable(x,z,sim.navRoom,r);}
function safeNear(sim,p,radius=.7){const options=[{x:p.x,z:p.z},...Array.from({length:12},(_,i)=>({x:p.x+Math.sin(i*Math.PI/6)*radius,z:p.z+Math.cos(i*Math.PI/6)*radius}))];return options.find(q=>ground(sim,q.x,q.z))||{x:p.x,z:p.z};}
function newFox(sim){const source=sim.worldDive?.surface||sim.state.player,q=safeNear(sim,source);return{room:sim.room,...q,yaw:source.yaw,path:[],nextPath:0,nextHit:0,seek:null,status:'Beside you'};}
function followPath(sim,actor,target,dt,speed){
 const now=sim.state.adventure.elapsed;
 if(now>=(actor.nextPath||0)){actor.nextPath=now+.7;const goal=safeNear(sim,target);actor.path=G.RealmCore.pathfind(actor,goal,sim.navRoom)||[];}
 if(actor.path?.length){const q=actor.path[0],d=dist(actor,q),step=Math.min(d,dt*speed),x=actor.x+(q.x-actor.x)/(d||1)*step,z=actor.z+(q.z-actor.z)/(d||1)*step;if(!ground(sim,x,z)){actor.path=[];actor.nextPath=0;return false;}sim.advance(actor,actor.path,dt,speed);return true;}return false;
}
function runtime(sim){if(!sim.adventureRuntime)sim.adventureRuntime={room:undefined,enemies:[],fx:[],cooldowns:{attack:0,pulse:0,dodge:0,heal:0,dig:0},invincible:0,companion:newFox(sim),notices:[]};return sim.adventureRuntime;}
function notify(sim,text){let r=runtime(sim);r.notices.push(text);if(r.notices.length>20)r.notices.shift();}
function syncScene(sim){let r=runtime(sim);const survey=sim.room===Q.ROOM?sim.state.adventure.pursuit.active?.id:null;const trail=(G.RealmTrails?.signature(sim)||'')+'|'+EE.signature(sim),sameRoom=r.room===sim.room,sameRun=sameRoom&&r.pursuitRun===survey;if(sameRoom&&r.pursuitRun===survey&&r.trailSignature===trail){for(const e of r.enemies.filter(e=>e.trailQuest)){const terms=G.RealmTrails.enemies(sim).find(v=>v.id===e.id);if(terms)e.recovery=terms.recovery;}return;}const prior=sameRoom?r.enemies:[];r.room=sim.room;r.pursuitRun=survey;r.trailSignature=trail;r.enemies=combatScene(sim)?roster(sim).filter(e=>!sim.state.adventure.defeated.includes(e.id)).map(e=>prior.find(p=>p.id===e.id&&p.hp>0)||({...e,maxHP:e.hp,mode:'idle',timer:0,yaw:0,aim:null,flash:0,path:[],nextPath:0,awareness:0,home:{x:e.x,z:e.z}})):[];if(sameRun)return;r.fx=[];r.arrows=[];r.range={active:false,start:0,hits:{},shots:0,message:'A calm place to learn a different rhythm.'};if(!sim.state.adventure.companion.bonded||sim.state.adventure.companion.mode==='follow')r.companion=newFox(sim);r.invincible=sim.state.adventure.elapsed+1;}
function fx(sim,kind,x,z,color=0xf2c891){let r=runtime(sim);r.fx.push({kind,x,z,color,at:sim.state.adventure.elapsed});if(r.fx.length>48)r.fx.shift();}
function awardXP(sim,n){let s=sim.state.adventure,l=level(s);s.xp=Math.min(9999,s.xp+n);if(level(s)>l){s.hp=Math.min(stats(s).maxHP,s.hp+10*(level(s)-l));notify(sim,'Level '+level(s)+' · Your journey is changing you.');sim.event('adventure','You reached level '+level(s)+'.');}}
function damageEnemy(sim,e,n,source='other'){let s=sim.state.adventure;if(!e||e.hp<=0||e.hidden||!Number.isFinite(n)||n<=0)return;if(e.trailQuest&&!G.RealmTrails.canDamage(sim,e))return;n=K.weaponDamage(sim,e,n,source);if(e.kind==='practice'){if(sim.room===Q.ROOM)Q.practiceHit(sim,e,n);else AR.practiceHit(sim,e);return;}if(e.exposedUntil>s.elapsed)n=Math.round(n*1.2);T.hit(sim,e,n);if(B.damage(sim,e,n))return;e.hp=Math.max(0,e.hp-n);e.flash=s.elapsed+.16;fx(sim,'hit',e.x,e.z);if(e.hp===0&&e.expeditionQuest){EE.defeat(sim,e);return;}if(e.hp===0&&e.trailQuest){G.RealmTrails.defeat(sim,e);return;}if(e.hp===0&&e.worldRealm){G.RealmWorldFoundations.defeat(sim,e);return;}if(e.hp===0&&e.contractRun){H.defeat(sim,e);return;}if(e.hp===0&&!s.defeated.includes(e.id)){s.defeated.push(e.id);s.drops.push(e.id);s.revision++;awardXP(sim,e.xp);sim.event('adventure',e.name+' defeated. A cache remains at its original position.');notify(sim,e.kind==='boss'?'The Hollow Hart is free. The feather is waiting.':e.name+' defeated · +'+e.xp+' experience');}}
function takeDamage(sim,n){let s=sim.state.adventure,r=runtime(sim);if(s.hp<=0||s.elapsed<r.invincible)return false;s.hp=Math.max(0,s.hp-T.mitigate(sim,Math.max(1,n-stats(s).defense)));r.invincible=s.elapsed+.28;fx(sim,'hurt',sim.state.player.x,sim.state.player.z,0xd57f88);if(s.hp===0){sim.playerPath=[];s.deaths=Math.min(9999,s.deaths+1);sim.event('adventure','You fell on an expedition. Your home and belongings are safe.');notify(sim,'You have fallen. Return to the spring to try again.');}return true;}
function diggableFrom(s,p,gx,gz){return validCell(gx,gz)&&!isFloor(s,gx,gz)&&dist(p,cellPoint(gx,gz))<=REACH&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>isFloor(s,gx+dx,gz+dz)&&dist(p,cellPoint(gx+dx,gz+dz))<2.2);}
function nearbyWall(s,p){let best=null,c=cellAt(p.x,p.z);for(let x=c.gx-2;x<=c.gx+2;x++)for(let z=c.gz-2;z<=c.gz+2;z++)if(diggableFrom(s,p,x,z)){let q=cellPoint(x,z),d=dist(p,q);if(!best||d<best.d)best={gx:x,gz:z,d,...q};}return best;}
const surfaceNear=(sim,q,r=3.5)=>!sim.room&&dist(sim.state.player,q)<r;
function command(sim,id,type,payload={}){
 const s=sim.state.adventure,r=runtime(sim);syncScene(sim);const fail=error=>({ok:false,error}),yes=text=>({ok:true,text});
 if(typeof id!=='string'||!id||id.length>100||!payload||typeof payload!=='object'||Array.isArray(payload))return fail('Invalid command envelope.');
 let fp;try{fp=JSON.stringify([type,payload]);}catch{return fail('Invalid command content.');}if(fp.length>500)return fail('Command too large.');
 let prior=s.receipts.find(c=>c.id===id);if(prior)return prior.fp===fp?{ok:prior.ok,duplicate:true}:fail('Command identity reused with different terms.');
 if(s.revision>=1e9)return fail('Adventure revision limit reached. Export this world.');
 if(sim.paused&&!['companion-mode','rename','equip','start','revive','target-clear','soul-equip','class-choose'].includes(type))return fail('Resume time with P before taking this action.');
 if(s.hp<=0&&type!=='revive')return fail('Return to the spring before continuing.');
 const p=sim.state.player;let result;
 switch(type){
 case'start':
  if(s.started)return fail('Your expedition supplies were already collected.');if(!surfaceNear(sim,{x:11,z:9}))return fail('Meet Oren at the workshop first.');
  s.started=true;s.owned=['trail_blade','travel_coat'];s.equipment.weapon='trail_blade';s.equipment.armor='travel_coat';sim.event('quest','Oren supplied a trail blade, a lantern, three tonics and a salve for an injured animal. Find the northern mine.');result=yes('Expedition ready · Blade, lantern, tonics and a trail salve.');break;
 case'enter':
  if(!s.started||!sim.state.sandbox.bridge||!surfaceNear(sim,MINE))return fail('Take Oren’s supplies, repair the crossing, and approach the mine entrance.');if(!sim.state.sandbox.inventory.pick)return fail('Craft a stone pickaxe before entering.');
  sim.returnPos={...p};sim.room='mine';sim.state.player={...ENTRANCE};sim.playerPath=[];syncScene(sim);sim.event('quest','You entered the Rootbound Underways. Excavation and completed encounters are remembered.');result=yes('The underways · E to mine. F to strike. Space to dodge.');break;
 case'leave':if(sim.room!=='mine'||dist(p,ENTRANCE)>3)return fail('Return to the southern lantern exit.');sim.leave();syncScene(sim);result=yes('Back under the open sky.');break;
 case'dig':{
  if(sim.room!=='mine'||!sim.state.sandbox.inventory.pick)return fail('Use the pickaxe inside the mine.');const {gx,gz}=payload;
  if(!validCell(gx,gz)||isFloor(s,gx,gz))return fail('That is not an excavatable wall.');if(!diggableFrom(s,p,gx,gz))return fail('Stand beside an exposed face of the stone.');if(s.elapsed<r.cooldowns.dig)return fail('The pickaxe is still swinging.');
  const q=cellPoint(gx,gz),ch=s.chips.find(c=>c.id===key(gx,gz)),hp=(ch?ch.hp:wallHP(gx,gz))-1;
  if(!hp&&mineral(gx,gz)&&s.ore>=9999)return fail('Your ore pouch is full.');r.cooldowns.dig=s.elapsed+.42;s.chips=s.chips.filter(c=>c.id!==key(gx,gz));fx(sim,'dig',q.x,q.z,0xb9b3a1);
  if(hp)s.chips.push({id:key(gx,gz),hp});else{s.dug.push(key(gx,gz));sim.playerPath=[];r.companion.path=[];if(mineral(gx,gz))s.ore++;awardXP(sim,1);}result=yes(hp?'Stone cracks · '+hp+' more strike'+(hp===1?'':'s'):mineral(gx,gz)?'Copper recovered. A new path opens.':'A new path opens.');break;}
 case'attack':case'pulse':{
  if(AR.weapon(s).style==='bow'){result=AR.shoot(sim,type,payload);if(!result.ok)return result;break;}
  if(sim.room==='range')return fail('Practice targets are for the bow. Equip one from the Armory.');
  if(!combatScene(sim)||!s.started)return fail('Combat is available in expedition areas, not the village.');const pulse=type==='pulse',cool=pulse?'pulse':'attack';if(s.elapsed<r.cooldowns[cool])return fail('That technique is recovering.');if(pulse&&s.stamina<30)return fail('Dawn sweep needs 30 stamina.');
  const enemies=r.enemies.filter(e=>e.hp>0&&!e.hidden&&dist(p,e)<(pulse?3.6:2.65)&&visible(sim,p,e));const selected=payload.target?r.enemies.find(e=>e.id===payload.target):enemies.sort((a,b)=>dist(p,a)-dist(p,b))[0];
  if(!pulse&&(!selected||!enemies.includes(selected)))return fail('Approach a visible enemy to strike.');if(pulse)s.stamina-=30;r.cooldowns[cool]=s.elapsed+(pulse?5.5:.52);if(selected)p.yaw=Math.atan2(selected.x-p.x,selected.z-p.z);fx(sim,pulse?'pulse':'slash',p.x,p.z);for(const e of pulse?enemies:[selected])damageEnemy(sim,e,Math.round(stats(s).attack*(pulse?1.5:1)),'weapon');result=yes(pulse?'Dawn sweep':'Sunstrike');break;}
 case'dodge':{
  if(!combatScene(sim)||s.elapsed<r.cooldowns.dodge||s.stamina<22)return fail('Wingstep needs 22 stamina and a recovered dodge.');let {dx,dz}=payload;if(!Number.isFinite(dx)||!Number.isFinite(dz)){dx=Math.sin(p.yaw);dz=Math.cos(p.yaw);}const l=Math.hypot(dx,dz);if(l<.01)return fail('Choose a direction.');dx/=l;dz/=l;
  s.stamina-=22;r.cooldowns.dodge=s.elapsed+1.2;r.invincible=s.elapsed+.40;sim.playerPath=[];const before={...p};for(let i=0;i<14;i++){let x=p.x+dx*.16,z=p.z+dz*.16;if(!ground(sim,x,z))break;p.x=x;p.z=z;}p.yaw=Math.atan2(dx,dz);fx(sim,'dodge',before.x,before.z,0xb4d6cf);result=yes('Wingstep');break;}
 case'heal':if(!s.started||!s.tonics||s.elapsed<r.cooldowns.heal||s.hp>=stats(s).maxHP)return fail('No healing needed, no tonic left, or the tonic is recovering.');s.tonics--;s.hp=Math.min(stats(s).maxHP,s.hp+48);r.cooldowns.heal=s.elapsed+3;fx(sim,'heal',p.x,p.z,0xa3dca2);result=yes('Trail tonic · up to +48 health');break;
 case'rest':if(!s.started||!surfaceNear(sim,{x:0,z:3},4))return fail('Rest at the Firstlight spring.');s.hp=stats(s).maxHP;s.stamina=100;s.tonics=3;result=yes('Rested · Health and three trail tonics restored.');break;
 case'revive':if(s.hp>0)return fail('You have not fallen.');if(sim.room)sim.leave();sim.state.player={x:2.5,z:6,yaw:0};sim.playerPath=[];syncScene(sim);s.hp=stats(s).maxHP;s.stamina=100;s.tonics=3;sim.event('quest','You returned to the spring. Belongings, excavation and completed encounters remain.');result=yes('A new breath. No belongings were lost.');break;
 case'rescue':if(sim.room!=='mine'||s.companion.bonded||dist(p,FOX)>3)return fail('Approach the injured briarfox.');if(!s.defeated.includes('briar-1'))return fail('Drive away the briar skitter first.');s.companion.bonded=true;r.companion={...newFox(sim),x:FOX.x,z:FOX.z};awardXP(sim,10);sim.event('companion','You used the trail salve to help Briar. The fox chose to follow.');result=yes('Briar is coming with you. Follow or Stay is your choice.');break;
 case'companion-mode':if(!s.companion.bonded||!['follow','stay'].includes(payload.mode))return fail('No valid companion command.');s.companion.mode=payload.mode;if(payload.mode==='follow'&&r.companion.room!==sim.room)r.companion=newFox(sim);r.companion.path=[];r.companion.seek=null;r.companion.status=payload.mode==='stay'?'Waiting here':'Following';result=yes(s.companion.name+' will '+payload.mode+'.');break;
 case'rename':if(!s.companion.bonded||typeof payload.name!=='string'||!payload.name.trim()||payload.name.length>24)return fail('Use a companion name of 1–24 characters.');s.companion.name=payload.name.trim();result=yes('Companion name kept in your local world.');break;
 case'loot':{let e=roster(sim).find(e=>e.id===payload.id);if(!combatScene(sim)||!e||!s.drops.includes(e.id)||dist(p,e)>3||!visible(sim,p,e))return fail('Approach a visible, unclaimed cache.');if(s.ore+e.ore>9999||s.coins+e.coins>9999)return fail('Your material pouch is full.');s.drops=s.drops.filter(id=>id!==e.id);s.ore+=e.ore;s.coins+=e.coins;if(e.gear&&!s.owned.includes(e.gear))s.owned.push(e.gear);result=yes('Cache · '+e.ore+' copper, '+e.coins+' sunmarks'+(e.gear?' · '+GEAR[e.gear].name:''));break;}
 case'equip':{let g=Object.hasOwn(GEAR,payload.id)?GEAR[payload.id]:null;if(!g||!s.owned.includes(payload.id))return fail('You do not own that item.');s.equipment[g.slot]=payload.id;s.hp=Math.min(s.hp,stats(s).maxHP);result=yes(g.name+' equipped.');break;}
 case'forge':if(!s.started||!AR.atBench(sim)||s.owned.includes('copper_blade')||s.ore<FORGE.ore||s.coins<FORGE.coins)return fail('Use a workbench with 4 copper and 4 sunmarks. This blade is crafted once.');s.ore-=FORGE.ore;s.coins-=FORGE.coins;s.owned.push('copper_blade');result=yes('Copper-edged blade forged. Equip it in Adventure.');break;
 case'relic':if(sim.room!=='mine'||!s.defeated.includes('hart')||s.relic||dist(p,RELIC)>3)return fail('Free the Hollow Hart and approach the feather’s dais.');s.relic=true;awardXP(sim,20);sim.event('quest','You recovered a white feather from the celestial anchor. Bring it to the Firstlight spring.');result=yes('The feather is warm. Return to the spring.');break;
 case'reveal':if(!s.relic||!surfaceNear(sim,{x:0,z:3},4))return fail('Bring the feather to the Firstlight spring.');if(!s.angelSeen){s.angelSeen=true;sim.event('story','A white-winged envoy appeared: Heaven is under attack, and broken passages endanger the mortal world.');}result=yes('A visitor from the light.');break;
 case'reward':if(!s.angelSeen||s.reward||!surfaceNear(sim,{x:0,z:3},4)||!['dawn_edge','warden_stone'].includes(payload.id))return fail('Meet the envoy at the spring and choose one gift.');s.reward=payload.id;s.owned.push(payload.id);awardXP(sim,25);sim.event('story','You accepted '+GEAR[payload.id].name+'. The first chapter is complete; the wider campaign is still to be built.');result=yes('Chapter complete · '+GEAR[payload.id].name);break;
 case'road-enter':
  if(!s.reward||!surfaceNear(sim,ROAD.GATE))return fail('Accept the envoy’s gift and approach the far-water lookout.');
  sim.returnPos={...p};sim.room='road';sim.state.player={...ROAD.ENTRY};sim.playerPath=[];s.road.entered=true;syncScene(sim);sim.event('quest','You took the Sunward Road. Tessa’s stranded caravan waits beyond the gate.');result=yes('Chapter II · Seek the cart’s missing latch with Briar.');break;
 case'road-leave':
  if(sim.room!=='road'||dist(p,ROAD.ENTRY)>3)return fail('Return to the southern waygate.');sim.leave();syncScene(sim);result=yes('Your valley waits beyond the road.');break;
 case'seek':{
  if(sim.room!=='road'||!s.companion.bonded||s.companion.mode!=='follow'||r.companion.room!==sim.room)return fail('Briar must be following you on the Sunward Road.');
  if(r.companion.seek)return fail('Briar is already following a scent.');
  const options=ROAD.CACHES.filter(c=>!s.road.revealed.includes(c.id)&&dist(p,c)<8).sort((a,b)=>dist(p,a)-dist(p,b));const cache=options.find(q=>G.RealmCore.pathfind(r.companion,q,sim.navRoom));
  if(!cache)return fail('No new scent nearby. Try the meadow west of the bridge or the northern ruins.');
  r.companion.seek=cache.id;r.companion.path=[];r.companion.nextPath=0;r.companion.status='Following a scent';result=yes(s.companion.name+' is following a scent. Watch where the fox goes.');break;}
 case'road-cache':{
  const q=ROAD.CACHES.find(c=>c.id===payload.id);
  if(sim.room!=='road'||!q||!s.road.revealed.includes(q.id)||s.road.claimed.includes(q.id)||dist(p,q)>3||!visible(sim,p,q))return fail('Approach a cache that Briar has revealed.');
  if(s.ore+q.ore>9999||s.coins+q.coins>9999)return fail('Your pouch is full.');s.ore+=q.ore;s.coins+=q.coins;s.road.claimed.push(q.id);result=yes(q.name+' recovered · '+q.ore+' copper, '+q.coins+' sunmarks');break;}
 case'cart-repair':
  if(sim.room!=='road'||dist(p,ROAD.MERCHANT)>3||s.road.cartRepaired||!s.defeated.includes('road-prowler')||!s.road.claimed.includes('cart-latch')||s.ore<2)return fail('At Tessa’s cart: recover the latch, clear the prowler and bring 2 copper.');s.ore-=2;s.road.cartRepaired=true;sim.event('quest','You fitted the recovered latch and repaired Tessa’s cart. Her road shop is open.');result=yes('Cart repaired. Tessa opens her travelling shop.');break;
 case'trade':{
  if(sim.room!=='road'||!s.road.cartRepaired||dist(p,ROAD.MERCHANT)>3)return fail('Visit Tessa’s repaired cart to trade.');
  const offer=payload.offer;
  if(offer==='tonic'){if(s.coins<2||s.tonics>=3)return fail('A tonic costs 2 sunmarks. You can carry three.');s.coins-=2;s.tonics++;result=yes('Bought one tonic for 2 sunmarks.');}
  else if(offer==='mantle'){if(s.coins<18||s.owned.includes('courier_mantle'))return fail('The mantle costs 18 sunmarks and can be bought once.');s.coins-=18;s.owned.push('courier_mantle');result=yes('Courier’s storm mantle purchased. Equip it in Adventure.');}
  else if(offer==='sell-copper'){if(s.ore<2||s.coins>9996)return fail('Sell 2 copper for 3 sunmarks. Check your pouch.');s.ore-=2;s.coins+=3;result=yes('Sold 2 copper for 3 sunmarks.');}
  else if(offer==='sell-berries'){const inv=sim.state.sandbox.inventory;if((inv.berry||0)<2||s.coins>=9999)return fail('Tessa buys 2 sunberries for 1 sunmark.');inv.berry-=2;s.coins++;result=yes('Sold 2 sunberries for 1 sunmark.');}
  else return fail('Unknown shop offer.');break;}
 case'beacon-light':
  if(sim.room!=='road'||dist(p,ROAD.BEACON)>3||s.road.beaconLit||!ROAD.ENEMIES.every(e=>s.defeated.includes(e.id)))return fail('Clear the three road encounters and approach the northern beacon.');s.road.beaconLit=true;awardXP(sim,20);sim.event('quest','The Sunward Beacon is alight. Return home after helping Tessa.');result=yes('The beacon answers. A light is visible through the trees.');break;
 case'road-report':
  if(!surfaceNear(sim,{x:0,z:3},4)||!s.road.beaconLit||!s.road.cartRepaired||s.road.reported)return fail('Repair the cart, light the beacon, then return to the envoy at the spring.');s.road.reported=true;if(!s.owned.includes('wayfarer_band'))s.owned.push('wayfarer_band');awardXP(sim,20);sim.event('quest','You brought the road’s light home. The envoy gave you the Band of the returning light.');result=yes('Chapter II complete · A wayfarer’s band and a light at the Commons.');break;
 default:result=EG.handle(sim,type,payload)||EN.handle(sim,type,payload)||ES.handle(sim,type,payload)||K.handle(sim,type,payload)||H.handle(sim,type,payload)||Q.handle(sim,type,payload)||CROSS.handle(sim,type,payload)||T.handle(sim,type,payload)||B.handle(sim,type,payload)||AR.handle(sim,type,payload);if(!result)return fail('Unknown adventure command.');if(!result.ok)return result;
 }
 s.revision++;s.receipts.push({id,fp,ok:true});if(s.receipts.length>100)s.receipts.shift();return result;
}
function tick(sim,dt){
 const s=sim.state.adventure,r=runtime(sim);syncScene(sim);
 if(!Number.isFinite(dt)||dt<0||sim.paused)return;
 dt=Math.min(dt,.1);s.elapsed=Math.min(1e9,s.elapsed+dt);r.fx=r.fx.filter(f=>s.elapsed-f.at<.65);
 if(!s.started)return;
 if(s.hp>0)s.stamina=Math.min(100,s.stamina+dt*15);
 AR.update(sim,dt);
 B.tick(sim,dt);
 CROSS.tick(sim,dt);
 const p=sim.state.player;
 if(combatScene(sim)&&s.hp>0)for(const e of r.enemies){
  if(e.hp<=0||e.kind==='practice'||e.eventEnemy||e.custom==='bell')continue;
  const d=dist(p,e),canSee=visible(sim,p,e);e.timer-=dt;
  // Charge direction is fixed at windup; subdivided collision prevents tunneling.
  if(e.mode==='charge'){
   let remaining=Math.min(e.chargeLeft,dt*12);
   while(remaining>1e-7){
    const move=Math.min(.12,remaining),nx=e.x+e.chargeDir.x*move,nz=e.z+e.chargeDir.z*move;
    if(!ground(sim,nx,nz,.35)){e.chargeLeft=0;break;}
    e.x=nx;e.z=nz;e.chargeLeft-=move;remaining-=move;
    if(!e.chargeHit&&dist(p,e)<1.05&&visible(sim,e,p)){takeDamage(sim,e.damage);e.chargeHit=true;}
   }
   if(e.chargeLeft<=.01){e.mode='recover';e.timer=1.8;e.path=[];fx(sim,'impact',e.x,e.z,0xd4b48b);}
   continue;
  }
  if(e.mode==='windup'){
   if(e.timer<=0){
    if(e.kind==='charger'){e.mode='charge';e.chargeLeft=9;e.chargeHit=false;fx(sim,'dodge',e.x,e.z,0xd8ad87);}
    else{const radius=e.telegraphRadius??(e.kind==='boss'?2.4:e.kind==='sentinel'?1.2:1.05);fx(sim,'impact',e.aim.x,e.aim.z,e.kind==='boss'?0xc68fbd:0xc5ac83);if(dist(p,e.aim)<radius+.24&&visible(sim,e,p))takeDamage(sim,e.damage);e.mode='recover';e.timer=e.recovery??(e.kind==='boss'?(e.hp<e.maxHP/2?1:1.8):1.1);}
   }continue;
  }
  if(e.mode==='recover'){if(e.timer<=0)e.mode='idle';continue;}
  if((sim.room==='crossing'&&p.z> -1)||(sim.room===Q.ROOM&&p.z>7)){e.mode='return';if(dist(e,e.home)>.4)followPath(sim,e,e.home,dt,1.65);continue;}
  const aggro=e.kind==='charger'?10:e.kind==='boss'?7:8.5;
  if(d<aggro&&canSee){e.awareness=s.elapsed+3;e.lastKnown={x:p.x,z:p.z};}
  const home=e.home||{x:e.x,z:e.z};if(dist(e,home)>15||d>18)e.awareness=0;
  if((e.awareness||0)<s.elapsed){if(dist(e,home)>.6){e.mode='return';followPath(sim,e,home,dt,1.65);}else e.mode='idle';continue;}
  const reach=e.kind==='charger'?9:e.kind==='sentinel'?6.5:e.kind==='boss'?4:1.9;
  if(canSee&&d<=reach){e.mode='windup';e.timer=e.windup??(e.kind==='charger'?1.2:e.kind==='skitter'?.75:1.05);e.aim={x:p.x,z:p.z};e.yaw=Math.atan2(p.x-e.x,p.z-e.z);e.path=[];if(e.kind==='charger')e.chargeDir={x:Math.sin(e.yaw),z:Math.cos(e.yaw)};continue;}
  e.mode='pursue';const q=canSee?p:e.lastKnown;if(q)followPath(sim,e,q,dt,e.kind==='boss'?1.25:1.6);
 }
 const c=r.companion;
 if(sim.worldDive){c.path=[];c.status='Waiting on the quay';return;}
 if(!s.companion.bonded||s.companion.mode!=='follow'||s.hp<=0||c.room!==sim.room)return;
 if(!ground(sim,c.x,c.z)){Object.assign(c,safeNear(sim,p),{path:[],nextPath:0,status:'Recalled from blocked ground'});notify(sim,s.companion.name+' was recalled from blocked ground.');}
 if(sim.room==='crossing'&&CROSS.runtime(sim).seek)return;
 if(c.seek&&sim.room==='road'){
  const q=ROAD.CACHES.find(q=>q.id===c.seek);
  if(!q||s.road.revealed.includes(q.id)){c.seek=null;c.path=[];}
  else if(dist(c,q)<.7){s.road.revealed.push(q.id);s.revision=Math.min(1e9,s.revision+1);c.seek=null;c.path=[];c.status='Found something';sim.event('companion',s.companion.name+' uncovered '+q.name.toLowerCase()+'.');notify(sim,s.companion.name+' found '+q.name.toLowerCase()+'. Walk over to collect it.');fx(sim,'companion',q.x,q.z,0xe6c78a);}
  else{c.status='Following a scent';followPath(sim,c,q,dt,3.6);}return;
 }
 const foe=combatScene(sim)&&sim.room!=='range'?r.enemies.filter(e=>e.hp>0&&!e.hidden&&['pursue','windup','charge','recover'].includes(e.mode)&&dist(p,e)<7).sort((a,b)=>dist(c,a)-dist(c,b))[0]:null,target=foe||p;
 if(dist(c,target)>(foe?1.3:1.25)){c.status=foe?'Helping in combat':'Following';followPath(sim,c,target,dt,3.4);}else{c.path=[];c.status=foe?'Helping in combat':'Beside you';}
 if(foe&&dist(c,foe)<1.65&&visible(sim,c,foe)&&s.elapsed>=c.nextHit){c.nextHit=s.elapsed+1.5;damageEnemy(sim,foe,5+level(s)+(AR.activeGem(s)?.companion||0));fx(sim,'companion',c.x,c.z,0xb7d58c);}
}
const STORY=[
 {speaker:'The envoy',title:'A feather, carried home.',body:'I was told I would find a fortress. An army. Someone prepared. Instead, I found someone who knows how to begin.'},
 {speaker:'The envoy',title:'The light beyond the valley.',body:'Heaven is under attack. Hell is breaking the passages between our worlds, and this land lies along their path. The anchor beneath your forest has answered you.'},
 {speaker:'The envoy',title:'A life worth returning to.',body:'Do not abandon what you have made here. It is why the journey matters. Others will bear this light as well. Choose a gift, and when the road is ready, we will walk it together.'}
];
function objectives(s){return[
 {title:'Take the road’s tools',detail:'Collect expedition supplies at Oren’s workshop.',done:s.started},
 {title:'A passage through stone',detail:'Enter the northern mine with a pickaxe. Chip an exposed wall.',done:s.dug.length>0},
 {title:'Someone to come home with',detail:'Defeat the briar skitter, then help the fox in the western alcove.',done:s.companion.bonded},
 {title:'The Hollow Hart',detail:'Move out of its violet strike circles and free the guardian.',done:s.defeated.includes('hart')},
 {title:'A feather beneath Wildwood',detail:'Recover the feather at the guardian’s dais.',done:s.relic},
 {title:'The envoy at the spring',detail:'Return to the Commons. Hear the warning and choose one gift.',done:!!s.reward}
];}
const api={ROAD,FORGE,awardXP,combatScene,roster,visible,ground,followPath,VERSION,CELL,LIMIT,REACH,MINE,ENTRANCE,FOX,RELIC,GEAR,ENEMIES,STORY,key,cellAt,cellPoint,validCell,initialFloor,isFloor,mineral,wallHP,walkable,line,fresh,validate,stats,level,runtime,syncScene,command,tick,nearbyWall,diggableFrom,objectives,damageEnemy,takeDamage,notify,fx};G.RealmAdventure=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
