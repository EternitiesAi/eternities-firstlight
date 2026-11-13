/* Firstlight 10 — Bellweather Crossing. Local chapter and waystone rules.
 * Long-lived achievements are explicit; fights, paths, and bell input are transient.
 * There is no network authority or inference about the person playing. */
(function(G){'use strict';
const D=G.RealmDifficulty||(typeof require==='function'?require('./difficulty.js'):null);
const VERSION=1, dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z), has=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
const GATE=Object.freeze({x:0,z:-27}), ENTRY=Object.freeze({x:0,z:24,yaw:Math.PI});
const PLACES=Object.freeze([
 {id:'exit',name:'The Sunward arch',x:0,z:24,kind:'gate',detail:'Walk back to the Sunward Beacon.'},
 {id:'waystone',name:'Bellweather waystone',x:0,z:17,kind:'waystone',detail:'Attune here to reopen the journey home.'},
 {id:'keeper',name:'Rowan, the bell keeper',x:-2,z:9,kind:'person',detail:'The watch bell has not answered for a generation.'},
 {id:'inn',name:'The Wayfarer’s Rest',x:9,z:14,kind:'rest',detail:'Nella serves the porch. Rest here without charge.'},
 {id:'shop',name:'Edda’s provisions',x:-9,z:15,kind:'shop',detail:'A travelling coat, trail tonics, and fair exchange.'},
 {id:'board',name:'The common works board',x:7,z:7,kind:'project',detail:'Two voluntary commissions improve the village.'},
 {id:'workbench',name:'The public forge',x:-10,z:5,kind:'craft',detail:'Use familiar recipes at a new outdoor workbench.'},
 {id:'inscription',name:'The listening stone',x:1,z:3,kind:'clue',detail:'Read the order of the three watch bells.'},
 {id:'thicket',name:'The old charcoal track',x:-8,z:-3,kind:'scent',detail:'Briar may find the missing clapper here.'},
 {id:'court',name:'The watch-bell court',x:0,z:-18,kind:'bell',detail:'Repair the bell and give its three tones their order.'}
]);
const CLAPPER=Object.freeze({x:-13,z:-9});
const BELLS=Object.freeze([
 {id:'leaf',name:'Leaf · the first breath',x:-3,z:-20,note:293.66,color:0xabc486},
 {id:'wave',name:'Wave · the returning water',x:0,z:-18.5,note:369.99,color:0x86bac6},
 {id:'sun',name:'Sun · the answering light',x:3,z:-20,note:440,color:0xe9bd77}
]);
const ORDER=Object.freeze(['leaf','wave','sun']);
const BUILDINGS=Object.freeze([
 {id:'inn',x:11,z:10,w:6,d:5,roof:0x87675d,wall:0xe2c8a4},
 {id:'shop',x:-12,z:11,w:5.2,d:4.4,roof:0x5e8890,wall:0xc5c7aa},
 {id:'forge',x:-13,z:1,w:5.4,d:5,roof:0x7e7d62,wall:0xb3b4a0},
 {id:'hall',x:11,z:1,w:6.2,d:5.3,roof:0x647e79,wall:0xcec7ae},
 {id:'home',x:-10,z:21,w:4,d:3.5,roof:0xb09c77,wall:0xd4c4a0}
]);
const TREES=Object.freeze([[-19,17,1.1,1],[-18,8,1,2],[-18,-2,1.2,0],[-18,-12,1.3,0],[-15,-18,1,1],[-10,-24,1.3,0],[9,-26,1.1,0],[16,-21,1.2,0],[18,-13,1.15,2],[18,-4,1.1,0],[19,5,1.2,1],[18,15,.9,3],[14,22,1,3],[5,25,.75,1],[-6,25,.8,1],[-8,-14,.8,0],[11,-7,1,1]]);
const SOLIDS=Object.freeze([
 ...BUILDINGS.map(b=>({x:b.x,z:b.z,w:b.w+.15,d:b.d+.15})),
 ...TREES.map(t=>({x:t[0],z:t[1],r:.24*t[2]})),
 {x:-5,z:-11,r:1.1},{x:5,z:-7,r:1.25},{x:12,z:-18,r:1},{x:-10,z:-20,r:1.1},
 ...[-5,5].flatMap(x=>[-19,-24].map(z=>({x,z,r:.5}))),
 {x:0,z:-26,w:1.4,d:1.4}
]);
const ENEMIES=Object.freeze([
 {id:'cross-thorn',name:'Briarback prowler',kind:'skitter',x:-10,z:-7,hp:110,damage:17,xp:25,ore:2,coins:6,windup:.75,poise:true},
 {id:'cross-prism',name:'The fractured tuner',kind:'sentinel',x:8,z:-13,hp:145,damage:19,xp:30,ore:2,coins:8,windup:1.05,poise:true},
 {id:'cross-warden',name:'The Hushbound Keeper',kind:'bellwarden',custom:'bell',boss:true,x:0,z:-23,hp:D.boss('keeper').hp,damage:D.boss('keeper').damage,xp:D.boss('keeper').xp,ore:3,coins:15,windup:1.2,attackOrder:['outer','inner','line','double'],attackSpec:{outer:{windup:1.7},inner:{windup:1.2},line:{windup:1.4,length:7,half:1},double:{windup:1.2,r1:2.8,r2:4.6,gap:.8}}}
]);
const GEAR=Object.freeze({
 keeper_coat:{name:'Bellweather keeper’s coat',slot:'armor',attack:0,defense:9,hp:30,tier:'Merchant',color:'#94ada4',desc:'A weatherproof coat from Edda. 24 sunmarks; +9 guard and +30 maximum health.'},
 chime_clasp:{name:'Clasp of the answering bell',slot:'charm',attack:5,defense:4,hp:30,tier:'Quest',color:'#e6c58e',desc:'Rowan’s thanks for returning the village’s voice. +5 attack, +4 guard, +30 maximum health.'}
});
const PROJECTS=Object.freeze({
 lamps:{name:'Light the evening market',materials:{plank:4,stone:6},coins:12,detail:'Four planks and six stone fit new lanterns along the square. Reward: 12 sunmarks.'},
 pantry:{name:'A harvest for the road',materials:{berry:4},gem:'ruby',detail:'Four sunberries stock the inn’s pantry. Reward: one Ember ruby. Each commission is completed once.'}
});
const WAYSTONES=Object.freeze({commons:{name:'Firstlight spring',room:null,x:0,z:3},sunward:{name:'Sunward Beacon',room:'road',x:0,z:-24},bellweather:{name:'Bellweather waystone',room:'crossing',x:0,z:17}});
function land(x,z,r=0){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<21-r&&z> -30+r&&z<28-r;}
function riverX(z){return 16+Math.sin(z*.13)*.6;}
function projectileGround(x,z,r=.04){return land(x,z,r)&&!SOLIDS.some(o=>o.r!==undefined?Math.hypot(x-o.x,z-o.z)<o.r+r:Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);}
function walkable(x,z,r=.31){return projectileGround(x,z,r)&&!(Math.abs(x-riverX(z))<1.2+r&&Math.abs(z-18)>2-r);}
function line(a,b){if(!a||!b||!land(a.x,a.z)||!land(b.x,b.z))return false;const n=Math.max(1,Math.ceil(dist(a,b)/.12));for(let i=0;i<=n;i++)if(!projectileGround(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
function fresh(){return{version:VERSION,entered:false,met:false,inscription:false,clapperRevealed:false,clapper:false,repaired:false,complete:false,reward:false,attuned:false,projects:[]};}
function validate(raw,a){const bad=k=>{throw Error('Invalid crossing: '+k);};if(!raw||raw.version!==VERSION)bad('version');const s=fresh();
 for(const k of['entered','met','inscription','clapperRevealed','clapper','repaired','complete','reward','attuned']){if(typeof raw[k]!=='boolean')bad(k);s[k]=raw[k];}
 if(!Array.isArray(raw.projects)||raw.projects.length>2||new Set(raw.projects).size!==raw.projects.length||raw.projects.some(k=>!has(PROJECTS,k)))bad('projects');s.projects=raw.projects.slice();
 if(!s.entered&&(Object.keys(s).some(k=>k!=='entered'&&k!=='version'&&k!=='projects'&&s[k])||s.projects.length))bad('entry prerequisite');
 if(s.clapper&&!s.clapperRevealed||s.repaired&&(!s.clapper||!s.met)||s.complete&&!s.repaired||s.reward&&!s.complete)bad('quest order');
 if(a){if(s.entered&&!a.beacon.complete)bad('beacon prerequisite');if(s.clapper&&!a.defeated.includes('cross-thorn'))bad('clapper guard');if(s.repaired&&!ENEMIES.every(e=>a.defeated.includes(e.id)))bad('guardians');if(a.defeated.some(id=>ENEMIES.some(e=>e.id===id))&&!s.entered)bad('unvisited encounters');if(s.reward&&!a.owned.includes('chime_clasp'))bad('reward item');if(a.owned.some(id=>has(GEAR,id))&&!s.entered)bad('gear location');if(a.owned.includes('chime_clasp')&&!s.reward)bad('reward provenance');}return s;
}
function runtime(sim){if(!sim.crossingRuntime)sim.crossingRuntime={room:sim.room,tones:[],seek:false,rangAt:-10,tone:null,toneSerial:0};const r=sim.crossingRuntime;if(r.room!==sim.room){Object.assign(r,{room:sim.room,tones:[],seek:false,tone:null});}return r;}
function near(sim,q,r=2.8){return sim.room==='crossing'&&dist(sim.state.player,q)<r;}
function hostile(sim){const A=G.RealmAdventure;return A.runtime(sim).enemies.some(e=>e.hp>0&&e.kind!=='practice'&&dist(e,sim.state.player)<12&&['pursue','windup','charge'].includes(e.mode));}
function stoneKnown(a,id){return id==='commons'||id==='sunward'&&a.beacon.complete||id==='bellweather'&&a.crossing.attuned;}
function currentStone(sim){return Object.entries(WAYSTONES).find(([,q])=>q.room===sim.room&&dist(sim.state.player,q)<3)?.[0]||null;}
function travelCheck(sim,id){const a=sim.state.adventure,src=currentStone(sim),b=G.RealmBeacon.runtime(sim);if(!has(WAYSTONES,id))return'Unknown waystone.';if(!a.beacon.complete)return'Restore the Sunward Beacon first.';if(!stoneKnown(a,id))return'Discover and attune that waystone first.';if(!src)return'Travel begins at a waystone, not from anywhere on the map.';if(src===id)return'You are already beside that waystone.';if(hostile(sim)||['arrival','assault','intermission'].includes(b.phase))return'Finish the encounter before using the Roads of Light.';return null;}
function transition(sim,room,point){const A=G.RealmAdventure;sim.room=room;sim.returnPos=room?{x:44,z:6,yaw:0}:null;sim.state.player={x:point.x,z:point.z,yaw:point.yaw??0};sim.playerPath=[];A.syncScene(sim);G.RealmCombat.stop(sim,true);runtime(sim);}
function handle(sim,type,p={}){
 if(!type.startsWith('cross-')&&type!=='waystone-travel')return null;
 const A=G.RealmAdventure,a=sim.state.adventure,s=a.crossing,r=runtime(sim),pos=sim.state.player,fail=error=>({ok:false,error}),yes=text=>({ok:true,text});
 if(type==='waystone-travel'){const error=travelCheck(sim,p.id);if(error)return fail(error);const q=WAYSTONES[p.id];transition(sim,q.room,q);sim.event('travel','You followed the Roads of Light to '+q.name+'. No health, items or story rewards were granted.');return yes('Arrived at '+q.name+'.');}
 if(type==='cross-enter'){
  if(sim.room!=='road'||dist(pos,GATE)>2||!a.beacon.complete)return fail('Defend the Sunward Beacon, then approach the northern arch.');
  if(hostile(sim)||['arrival','assault','intermission'].includes(G.RealmBeacon.runtime(sim).phase))return fail('End the beacon encounter before taking the northern road.');
  s.entered=true;transition(sim,'crossing',ENTRY);sim.event('quest','Beyond the beacon, Bellweather Crossing has heard the returning light.');return yes('Chapter IV · Bellweather Crossing. Meet Rowan in the square.');
 }
 if(sim.room!=='crossing')return fail('This action belongs to Bellweather Crossing.');
 const place=id=>PLACES.find(q=>q.id===id);
 switch(type){
 case'cross-leave':if(!near(sim,ENTRY))return fail('Return to the southern Sunward arch.');transition(sim,'road',{...GATE,yaw:0});return yes('Back beside the Sunward Beacon.');
 case'cross-attune':if(!near(sim,WAYSTONES.bellweather))return fail('Approach the village waystone.');if(s.attuned)return fail('This waystone is already attuned.');s.attuned=true;sim.event('travel','Bellweather joined your discovered waystones. Travel is available at anchors, not during battle.');return yes('Waystone attuned. M opens the map; travel from an anchor.');
 case'cross-meet':if(!near(sim,place('keeper')))return fail('Approach Rowan in the square.');if(s.met)return fail('Rowan has already entrusted you with the watch bell.');s.met=true;sim.event('quest','Rowan asked you to find the lost clapper and restore the watch bell. Read the listening stone, then follow the northern trail.');return yes('“The road is open. Now we need a voice to call the lost home.”');
 case'cross-inspect':if(!near(sim,place('inscription')))return fail('Approach the listening stone.');if(s.inscription)return fail('The inscription is already kept in your journal.');s.inscription=true;return yes('Leaf takes the first breath. Wave carries it onward. Sun answers at last.');
 case'cross-seek':{
  const c=A.runtime(sim).companion;if(!s.met)return fail('Speak with Rowan before searching for the missing bell clapper.');if(s.clapperRevealed)return fail('Briar already marked the clapper on your map.');if(!a.companion.bonded||a.companion.mode!=='follow'||c.room!==sim.room)return fail('Briar needs to be following you.');if(dist(pos,CLAPPER)>12)return fail('Try the old charcoal track north-west of the square.');if(r.seek)return fail('Briar is already following the scent.');if(!G.RealmCore.pathfind(c,CLAPPER,sim.navRoom))return fail('Move to a clear path beside Briar.');r.seek=true;c.path=[];c.nextPath=0;c.status='Following the old charcoal scent';return yes('Briar caught a scent. Follow the fox into the thicket.');}
 case'cross-survey':if(!s.met||!near(sim,CLAPPER,2.5))return fail('Inspect disturbed earth in the north-west thicket.');if(s.clapperRevealed)return fail('This spot is already marked.');s.clapperRevealed=true;return yes('Careful inspection reveals the clapper. Briar could have led you here.');
 case'cross-clapper':if(!s.clapperRevealed||s.clapper||!near(sim,CLAPPER))return fail('Approach the clapper that was uncovered in the thicket.');if(!a.defeated.includes('cross-thorn'))return fail('Drive away the Briarback prowler before reaching into the roots.');s.clapper=true;sim.event('quest','The missing bronze clapper was recovered.');return yes('Clapper recovered. Clear the northern court and repair the watch bell.');
 case'cross-repair':if(!s.met||!s.clapper||s.repaired||!near(sim,place('court'),3.5))return fail('Bring the clapper to the watch-bell court.');if(!ENEMIES.every(e=>a.defeated.includes(e.id)))return fail('Clear the prowler, fractured tuner and Hushbound Keeper first.');s.repaired=true;r.tones=[];return yes('The clapper fits. Ring Leaf, then Wave, then Sun. The journal retains the inscription.');
 case'cross-ring':{
  const bell=BELLS.find(b=>b.id===p.id);if(!bell||!near(sim,bell,2.3)||!s.repaired)return fail('Repair the watch bell, then stand beside a marked resonator.');if(a.elapsed-r.rangAt<.65)return fail('Let the tone settle.');r.rangAt=a.elapsed;r.tone=bell.id;r.toneSerial++;
  if(s.complete)return yes(bell.name+' rings. The melody is already restored.');
  if(p.id===ORDER[r.tones.length])r.tones.push(p.id);else r.tones=p.id===ORDER[0]?[p.id]:[];
  if(r.tones.length===3){s.complete=true;sim.event('quest','Leaf, Wave, Sun. The watch bell rang across the valley again. Return to Rowan.');return yes('The bell answers. The village has a voice again. Return to Rowan.');}
  return yes(r.tones.length?'The melody holds · '+r.tones.length+' / 3.':'The tones disagree. Begin again with Leaf. No items were lost.');}
 case'cross-reward':if(!near(sim,place('keeper'))||!s.complete||s.reward)return fail('Restore the bell, then return to Rowan for a single reward.');if(a.coins>9999-18)return fail('Make room for 18 sunmarks before accepting.');s.reward=true;a.coins+=18;a.owned.push('chime_clasp');sim.event('quest','Rowan gave you the Clasp of the answering bell and 18 sunmarks. Windbells now hang at Oren’s workshop.');return yes('Chapter IV complete · 18 sunmarks, a new charm, and windbells for home.');
 case'cross-rest':if(!near(sim,place('inn'))||hostile(sim))return fail('Visit Nella on the inn porch after danger has passed.');a.hp=A.stats(a).maxHP;a.stamina=100;a.tonics=3;return yes('A meal and a moment of shelter. Health, stamina and three tonics restored.');
 case'cross-project':{
  const q=has(PROJECTS,p.id)?PROJECTS[p.id]:null,inv=sim.state.sandbox.inventory;
  if(!q||!near(sim,place('board'))||s.projects.includes(p.id))return fail('Choose an unfinished commission at the common works board.');
  if(Object.entries(q.materials).some(([k,n])=>inv[k]<n))return fail('Gather the listed materials first. Nothing was charged.');
  if(q.coins&&a.coins>9999-q.coins||q.gem&&a.arsenal.gems[q.gem]>=9999)return fail('Make space for the commission reward.');
  for(const[k,n]of Object.entries(q.materials))inv[k]-=n;if(q.coins)a.coins+=q.coins;if(q.gem)a.arsenal.gems[q.gem]++;s.projects.push(p.id);sim.event('community','Completed: '+q.name+'.');return yes(q.name+' completed. The change stays in the village.');}
 case'cross-trade':{
  if(!near(sim,place('shop'))||hostile(sim))return fail('Visit Edda’s stall in the square.');
  if(p.offer==='coat'){if(a.coins<24||a.owned.includes('keeper_coat'))return fail('The keeper’s coat costs 24 sunmarks and can be bought once.');a.coins-=24;a.owned.push('keeper_coat');return yes('Keeper’s coat purchased. Equip it in Character.');}
  if(p.offer==='tonic'){if(a.coins<2||a.tonics>=3)return fail('A tonic costs 2 sunmarks; carry up to three.');a.coins-=2;a.tonics++;return yes('One tonic purchased.');}
  if(p.offer==='copper'){if(a.ore<2||a.coins>9996)return fail('Sell 2 copper for 3 sunmarks. Check your pouch.');a.ore-=2;a.coins+=3;return yes('Sold two copper for three sunmarks.');}
  if(p.offer==='berries'){const inv=sim.state.sandbox.inventory;if(inv.berry<2||a.coins>=9999)return fail('Sell 2 berries for 1 sunmark.');inv.berry-=2;a.coins++;return yes('Sold two sunberries.');}return fail('Unknown merchant offer.');}
 default:return fail('Unknown Bellweather action.');
 }
}
function inImpact(e,p){const d=dist(p,e.aim);return e.ringMode==='outer'?d>2.1&&d<6.2:d<2.8;}
function tick(sim,dt){const A=G.RealmAdventure,a=sim.state.adventure,r=runtime(sim);if(sim.room!=='crossing'||a.hp<=0||sim.paused)return;
 const s=a.crossing,c=A.runtime(sim).companion,p=sim.state.player;
 if(r.seek){
  if(a.companion.mode!=='follow'||c.room!==sim.room){r.seek=false;}
  else if(dist(c,CLAPPER)<.7){s.clapperRevealed=true;a.revision=Math.min(1e9,a.revision+1);r.seek=false;c.path=[];c.status='Found the lost clapper';A.notify(sim,'Briar found the clapper. Its marker is now on your map.');A.fx(sim,'companion',CLAPPER.x,CLAPPER.z,0xe3c697);}
  else{c.status='Following the old charcoal scent';A.followPath(sim,c,CLAPPER,dt,3.6);}
 }
 for(const e of A.runtime(sim).enemies){if(e.hp<=0||e.custom!=='bell')continue;e.timer-=dt;
  if(e.mode==='windup'){if(e.timer<=0){if(e.omen){if(G.RealmCombat.strike(sim,e))continue;e.mode='recover';e.timer=2.2;continue;}if(inImpact(e,p)&&A.visible(sim,e,p))A.takeDamage(sim,e.damage);A.fx(sim,'impact',e.aim.x,e.aim.z,0xd3a3cc);e.mode='recover';e.timer=2.2;}continue;}
  if(e.mode==='recover'){if(e.timer<=0)e.mode='idle';continue;}
  if(dist(p,e.home)>15||p.z> -4){if(dist(e,e.home)>.5)A.followPath(sim,e,e.home,dt,1.8);else e.mode='idle';continue;}
  if(dist(p,e)<10&&A.visible(sim,p,e)){
   if(dist(p,e)>6){e.mode='pursue';A.followPath(sim,e,p,dt,1.5);}else{const order=e.attackOrder||['outer','inner'],name=order[(e.strikes||0)%order.length];e.strikes=(e.strikes||0)+1;e.mode='windup';e.path=[];e.yaw=Math.atan2(p.x-e.x,p.z-e.z);const omen=G.RealmCombat.telegraph(e,name,p);e.omen=omen;
    if(omen){e.ringMode=null;e.timer=omen.windup;e.aim=null;}else{e.ringMode=name;e.timer=e.attackSpec?.[name]?.windup??e.windup;e.aim={x:e.x,z:e.z};}}
  }else e.mode='idle';
 }
}
function objectives(a){const s=a.crossing;return[
 {title:'The world beyond the beacon',detail:'After the defense, take the northern arch beside the Sunward Beacon. M opens the map.',done:s.entered},
 {title:'A village with no voice',detail:'Meet Rowan in Bellweather’s square. Attune the waystone for the return home.',done:s.met},
 {title:'A familiar nose, a different trail',detail:'From the charcoal track, ask Briar to seek. Clear the prowler and recover the clapper.',done:s.clapper},
 {title:'The Hushbound Keeper',detail:'Clear the tuner and Keeper. For its wide ring, step INTO the quiet center; for the small circle, step OUT.',done:ENEMIES.every(e=>a.defeated.includes(e.id))},
 {title:'Give the bell its voice',detail:'Repair the court bell. Ring Leaf → Wave → Sun at the three marked resonators.',done:s.complete},
 {title:'Bring the sound home',detail:'Return to Rowan for a charm and 18 sunmarks. New windbells will hang at Oren’s workshop.',done:s.reward}
 ];}
G.RealmCrossing={VERSION,GATE,ENTRY,PLACES,CLAPPER,BELLS,ORDER,BUILDINGS,TREES,SOLIDS,ENEMIES,GEAR,PROJECTS,WAYSTONES,land,riverX,projectileGround,walkable,line,fresh,validate,runtime,near,hostile,stoneKnown,currentStone,travelCheck,transition,handle,tick,inImpact,objectives};if(typeof module!=='undefined')module.exports=G.RealmCrossing;
})(globalThis);
