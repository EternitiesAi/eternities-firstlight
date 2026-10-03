/* One local outing. Definitions, durable state and atomic accepted commands. */
(function(G){'use strict';
const VERSION=1,ROOM='riverbank',ID='oren_riverbank_supplies';
const OREN=Object.freeze({x:11,z:9}),GATE=Object.freeze({x:15,z:7}),ENTRY=Object.freeze({x:0,z:12,yaw:Math.PI});
const BUNDLES=Object.freeze([
 {id:'river-rope',name:'Coiled river rope',x:-7,z:3},
 {id:'river-tools',name:'Wrapped hand tools',x:5,z:-3},
 {id:'river-canvas',name:'Folded worksite canvas',x:-5,z:-11}
]);
const ENEMIES=Object.freeze([
 // One extra ordinary strike lets the fixed starter kit see the existing tell.
 // These remain optional local creatures, with fixed power and original loot.
 {id:'river-skitter-west',name:'Riverbank skitter',kind:'skitter',x:-7,z:0,hp:40,damage:8,xp:8,ore:1,coins:2},
 {id:'river-skitter-east',name:'Reed skitter',kind:'skitter',x:5,z:-6,hp:40,damage:8,xp:8,ore:1,coins:2},
 {id:'river-old-bristle',name:'Old Bristle',kind:'skitter',custom:'river-bristle',x:-4,z:-15,hp:90,damage:18,xp:20,ore:1,coins:4,windup:1.25,recovery:1.8,telegraphRadius:1.8}
]);
const PRACTICE=Object.freeze({id:'river-practice',name:'Oren’s practice bundle',kind:'practice',x:-5,z:10,hp:100,radius:.65});
const OBSTACLES=Object.freeze([{x:-1,z:1,r:1.05},{x:2,z:-9,r:.9},{x:-9,z:-8,r:.8}]);
const TREES=Object.freeze([[-10,8,1,1],[-10,-2,.9,1],[-10,-17,1.1,1],[8,7,.85,1],[7,-11,1,1],[3,-18,.9,1]]);
const GEAR=Object.freeze({
 oren_sunblade:{name:'Oren’s riversteel blade',slot:'weapon',style:'blade',attack:16,defense:0,hp:0,tier:'Local quest',color:'#82beb0',desc:'A balanced early blade, fitted with a river-green grip. One removable gem socket.'},
 oren_reedbow:{name:'Oren’s reedbound bow',slot:'weapon',style:'bow',attack:13,defense:0,hp:0,tier:'Local quest',color:'#82beb0',desc:'A fixed early bow with green bindings. Real travelling arrows and one removable gem socket.'}
});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function fresh(){return{version:VERSION,accepted:false,bundles:[],reward:null};}
function complete(a){return !!a.starter?.accepted&&BUNDLES.every(q=>a.starter.bundles.includes(q.id))&&a.defeated.includes('river-old-bristle');}
function bonus(a,weapon){return a.starter?.reward?.choice==='temper'&&a.starter.reward.weapon===weapon?2:0;}
function validate(raw,a){
 const bad=m=>{throw Error('Invalid starter quest: '+m);};
 if(!raw||raw.version!==VERSION||typeof raw.accepted!=='boolean')bad('version or acceptance');
 if(!Array.isArray(raw.bundles)||raw.bundles.length>BUNDLES.length||new Set(raw.bundles).size!==raw.bundles.length||raw.bundles.some(id=>!BUNDLES.some(q=>q.id===id)))bad('bundle IDs');
 const q={version:VERSION,accepted:raw.accepted,bundles:raw.bundles.slice(),reward:null};
 if(q.accepted&&!a.started||!q.accepted&&(q.bundles.length||a.defeated.some(id=>ENEMIES.some(e=>e.id===id))))bad('accepted prerequisites');
 if(raw.reward!==null){
  const r=raw.reward,gear=G.RealmAdventure.GEAR;
  if(!r||typeof r!=='object'||!['oren_sunblade','oren_reedbow','temper'].includes(r.choice)||!Object.hasOwn(gear,r.weapon)||gear[r.weapon].slot!=='weapon'||!a.owned.includes(r.weapon))bad('owned reward weapon');
  if(!complete({...a,starter:q})||r.choice!=='temper'&&r.weapon!==r.choice)bad('reward prerequisites');
  q.reward={choice:r.choice,weapon:r.weapon};
 }
 return q;
}
function land(x,z,r=.31){return Number.isFinite(x)&&Number.isFinite(z)&&x>-12+r&&x<10-r&&z>-20+r&&z<15-r;}
function walkable(x,z,r=.31){return land(x,z,r)&&!OBSTACLES.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+r)&&!TREES.some(t=>Math.hypot(x-t[0],z-t[1])<.24*t[2]+r);}
function line(a,b){if(!a||!b||!Number.isFinite(distance(a,b))||distance(a,b)>100)return false;const n=Math.max(1,Math.ceil(distance(a,b)/.1));for(let i=0;i<=n;i++)if(!walkable(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,.04))return false;return true;}
function near(sim,p,r=3){return distance(sim.state.player,p)<r;}
function points(sim){const a=sim.state.adventure;
 if(sim.room===ROOM&&a.pursuit?.active)return[{id:'river-exit',name:G.RealmEarth?.riverTrip(sim)?'Orchard lane · then home to Oren':'Return survey to Oren',...ENTRY,kind:'gate'},{...PRACTICE,kind:'practice'},...G.RealmPursuit.points(sim),...G.RealmPursuit.enemies(a).map(e=>({...e,kind:'threat'}))];
 if(sim.room===ROOM)return[{id:'river-exit',name:G.RealmEarth?.riverTrip(sim)?'Return to the orchard lane':'Return to the workshop',...ENTRY,kind:'gate'},{...PRACTICE,kind:'practice'},...(a.starter.accepted?BUNDLES.filter(q=>!a.starter.bundles.includes(q.id)).map(q=>({...q,kind:'supplies'})):[]),...(a.starter.accepted&&!a.defeated.includes('river-old-bristle')?[{...ENEMIES[2],kind:'threat'}]:[])];
 if(!sim.room)return[{id:'oren-outing',name:'Oren · riverbank supplies',...OREN,kind:'quest'},{id:'river-gate',name:'Nearby riverbank worksite',...GATE,kind:'gate'}];return[];
}
function practiceHit(sim,e,n){const A=G.RealmAdventure,t=sim.state.adventure.elapsed;e.flash=t+.18;G.RealmCombat.hit(sim,e,n);A.runtime(sim).training={lastDamage:n,style:G.RealmArsenal.weapon(sim.state.adventure).style,at:t};}
function handle(sim,type,p={}){
 if(!type.startsWith('starter-'))return null;
 const A=G.RealmAdventure,a=sim.state.adventure,q=a.starter,fail=error=>({ok:false,error}),yes=text=>({ok:true,text});
 switch(type){
 case'starter-accept':
  if(!a.started||sim.room||!near(sim,OREN))return fail('Take the initial expedition kit and speak to Oren at the workshop.');
  if(q.accepted)return fail('Oren’s riverbank outing is already in your journal.');
  q.accepted=true;sim.event('quest','You agreed to recover Oren’s three supply bundles and drive away Old Bristle at the nearby riverbank. Choose a blade, bow or one weapon temper when you return.');return yes('Riverbank outing accepted. The path sign is just east of Oren’s workshop.');
 case'starter-enter':
  if(!a.started||sim.room||!near(sim,GATE))return fail('With your initial kit, approach the riverbank sign beside Oren’s workshop.');
  sim.returnPos={...sim.state.player};sim.room=ROOM;sim.state.player={...ENTRY};sim.playerPath=[];A.syncScene(sim);G.RealmCombat.stop(sim,true);return yes(a.pursuit?.active?'Riverbank survey · clear two skitters, record two samples, return to Oren.':'The nearby riverbank · bundles and Old Bristle share one short route.');
 case'starter-leave':
  if(sim.room!==ROOM||!near(sim,ENTRY))return fail('Return to the southern workshop path.');
  if(G.RealmEarth?.riverTrip(sim))return G.RealmEarth.backToApproach(sim);
  sim.leave();A.syncScene(sim);G.RealmCombat.stop(sim,true);return yes('Back beside Oren’s workshop.');
 case'starter-pickup':{
  const bundle=BUNDLES.find(b=>b.id===p.id);
  if(sim.room!==ROOM||a.pursuit?.active||!q.accepted||q.reward||!bundle||q.bundles.includes(p.id)||!near(sim,bundle,2.4)||!A.visible(sim,sim.state.player,bundle))return fail('Accept Oren’s outing, then approach a visible, unrecovered supply bundle.');
  q.bundles.push(p.id);sim.event('quest',bundle.name+' recovered ('+q.bundles.length+'/3). Your normal inventory is unchanged.');return yes(bundle.name+' secured · '+q.bundles.length+'/3 supplies');}
 case'starter-claim':{
  if(sim.room||!near(sim,OREN)||!complete(a)||q.reward)return fail('Return to Oren with three bundles and Old Bristle driven away. The reward is claimed once.');
  const choice=p.choice,weapon=choice==='temper'?p.weapon:choice;
  if(!['oren_sunblade','oren_reedbow','temper'].includes(choice))return fail('Choose the riversteel blade, reedbound bow or one owned weapon to temper.');
  if(choice==='temper'&&(!Object.hasOwn(A.GEAR,weapon)||A.GEAR[weapon].slot!=='weapon'||!a.owned.includes(weapon)))return fail('Tempering needs an explicitly selected, owned weapon.');
  if(choice!=='temper'&&(a.owned.includes(weapon)||a.owned.length>=Object.keys(A.GEAR).length))return fail('That weapon is already owned or your equipment catalogue is full. Choose another reward.');
  if(a.coins>9993)return fail('Make room for six sunmarks. Your completed objectives and unclaimed reward are safe.');
  // All validation above precedes the single payout. This record is also the temper ledger.
  if(choice!=='temper')a.owned.push(weapon);
  q.reward={choice,weapon};a.coins+=6;A.awardXP(sim,25);
  sim.event('quest','Oren’s supplies are back at the workshop. You chose '+(choice==='temper'?'one +2 temper on ':'' )+A.GEAR[weapon].name+'. This outing pays once.');
  return yes(choice==='temper'?A.GEAR[weapon].name+' tempered once · +2 attack, same weapon and socket.':A.GEAR[weapon].name+' received. Inspect and equip it when you choose.');}
 default:return fail('Unknown riverbank command.');
 }
}
const api={VERSION,ROOM,ID,OREN,GATE,ENTRY,BUNDLES,ENEMIES,PRACTICE,OBSTACLES,TREES,GEAR,fresh,validate,complete,bonus,land,walkable,line,near,points,practiceHit,handle};G.RealmStarter=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
