/* ET07 adjudication. The simulation adapter owns scene/character leases, actual
 * attack admission/contact, guarded state, navigation and atomic saving.
 * This module never writes a world, changes gear or grants inventory/XP. */
(function (G) {
 'use strict';
 const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
 const copy=o=>JSON.parse(JSON.stringify(o)), families=['blade','bow'];
 const definition=freeze({
  id:'earth-tournament-after-rain-v1',name:'The Tournament After the Rain',version:1,
  room:'earth-hearthwater-approach',arena:{x:5,z:-31.5,radius:4.5,bodyRadius:.31},
  rounds:[
   {id:'rain-edge',name:'The first bell',ready:2,tell:1.4,opening:3,rest:2.6,halfWidth:.7},
   {id:'wide-ribbon',name:'The broad ribbon',ready:2,tell:1.1,opening:2.7,rest:3.2,halfWidth:1},
   {id:'last-pennant',name:'The last pennant',ready:2,tell:.9,opening:2.4,rest:3.7,halfWidth:.6}
  ],
  medals:[{id:'rain-bronze',name:'Bronze rain medal',score:2},
          {id:'rain-silver',name:'Silver rain medal',score:4},
          {id:'rain-gold',name:'Gold rain medal',score:6}],
  terms:[
   'Three declared exchanges. One point for a sound defense and one for a clean primary reply in each exchange.',
   'Brace the marked strike or move clear. Release the primary reply while the white pennant is open. An attack released early forfeits that exchange’s reply point if it lands; a miss or wall does not.',
   'Damage, health, level, sockets and upgrades do not affect points. Primary reach and recovery remain the declared standard for your weapon family.',
   'Special, companion and class attacks do not compete. Ordinary controls and owned equipment remain; nothing is auto-equipped.',
   'Medals are finite personal distinctions, with no attack bonus, XP, currency or material payout. Replays can improve your best result.',
   'Leaving the ring, changing weapons or characters, or reloading ends live scoring. Withdraw the outstanding attempt before entering again. Record a finished result with the steward before leaving; an unrecorded result is not saved. Earlier medals and ordinary belongings remain.'
  ]
 });
 const MAX=1e9,bouts=new WeakMap(),attacks=new WeakMap();
 const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)
  &&[Object.prototype,null].includes(Object.getPrototypeOf(v))
  &&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
 const integer=(n,max=MAX)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 const fail=error=>({ok:false,error});
 function fresh(){return{version:1,issued:0,closed:0,best:{blade:null,bow:null},finished:{blade:0,bow:0}};}
 function validate(raw){
  const bad=why=>{throw Error('Invalid rain tournament: '+why);};
  if(!exact(raw,['version','issued','closed','best','finished'])||raw.version!==1)bad('shape/version');
  if(!integer(raw.issued)||!integer(raw.closed)||raw.issued-raw.closed<0||raw.issued-raw.closed>1)bad('run identity');
  if(!exact(raw.best,families)||!exact(raw.finished,families))bad('family records');
  for(const family of families){
   const best=raw.best[family],count=raw.finished[family];
   if(!integer(count)||best!==null&&!integer(best,6)||(count===0)!==(best===null))bad('earned family result');
  }
  if(raw.finished.blade+raw.finished.bow>raw.closed)bad('results exceed closed runs');
  return copy(raw);
 }
 function inside(p){const a=definition.arena;return !!p&&[p.x,p.z].every(Number.isFinite)&&Math.hypot(p.x-a.x,p.z-a.z)<=a.radius-a.bodyRadius+1e-8;}
 function medals(record,family){const q=validate(record);if(!families.includes(family))throw Error('Unknown weapon family');return definition.medals.filter(m=>q.best[family]!==null&&q.best[family]>=m.score).map(m=>m.id);}
 function current(handle){const b=bouts.get(handle);if(!b)throw Error('Unknown tournament bout');return b;}
 function begin(record,{owner,family,player}={}){
  let q;try{q=validate(record);}catch(e){return fail(e.message);}
  if(!owner||typeof owner!=='object'||!families.includes(family)||!inside(player))return fail('Choose a declared weapon family inside the marked ring.');
  if(q.issued!==q.closed)return fail('Withdraw the outstanding attempt before starting another.');
  if(q.issued>=MAX)return fail('Export this character before extending its tournament record.');
  q.issued++;
  const handle=Object.freeze({run:q.issued,family});
  bouts.set(handle,{owner,family,run:q.issued,record:JSON.stringify(q),time:0,index:0,phase:'ready',remaining:definition.rounds[0].ready,
   aim:null,rounds:definition.rounds.map(r=>({id:r.id,defense:null,reply:false,early:false})),serial:0,withdrawn:false});
  return{ok:true,record:q,bout:handle};
 }
 function snapshot(handle){
  const b=current(handle),round=definition.rounds[b.index];
  return freeze({run:b.run,family:b.family,time:b.time,phase:b.phase,remaining:b.remaining,round:round?.id??null,index:b.index,
   aim:b.aim?{...b.aim}:null,rounds:copy(b.rounds),score:points(b),complete:b.phase==='complete',withdrawn:b.withdrawn});
 }
 function points(b){return b.rounds.reduce((n,r)=>n+(r.defense===true?1:0)+(r.reply&&!r.early?1:0),0);}
 function strikeContains(aim,p,round){
  if(!aim||!inside(p))return false;
  const a=definition.arena,dx=aim.x-a.x,dz=aim.z-a.z,l=Math.hypot(dx,dz);
  const ux=l>1e-8?dx/l:0,uz=l>1e-8?dz/l:1,px=p.x-a.x,pz=p.z-a.z;
  return px*ux+pz*uz>=-a.bodyRadius&&Math.abs(px*uz-pz*ux)<=round.halfWidth+a.bodyRadius;
 }
 function withdraw(handle){const b=current(handle);if(b.phase==='complete'||b.withdrawn)return false;b.withdrawn=true;b.phase='withdrawn';b.remaining=0;return true;}
 function advance(handle,dt,facts){
  const b=current(handle);
  if(!Number.isFinite(dt)||dt<0||dt>.1+1e-9)return fail('Advance with an admitted simulation step of at most 0.1 seconds.');
  if(!facts||!facts.player||![facts.player.x,facts.player.z].every(Number.isFinite)
    ||['paused','guarded','evading'].some(k=>typeof facts[k]!=='boolean'))return fail('A complete current simulation observation is required.');
  if(b.phase==='complete'||b.withdrawn||facts.paused||dt===0)return{ok:true,events:[]};
  if(!inside(facts.player)){withdraw(handle);return{ok:true,events:[{type:'withdrawn',reason:'left-ring'}]};}
  const events=[];let left=dt;
  while(left>1e-9&&b.phase!=='complete'){
   const used=Math.min(left,b.remaining);left-=used;b.remaining-=used;b.time+=used;
   if(b.remaining>1e-9)break;
   const d=definition.rounds[b.index],r=b.rounds[b.index];
   if(b.phase==='ready'){
    b.aim={x:facts.player.x,z:facts.player.z};b.phase='tell';b.remaining=d.tell;events.push({type:'tell',round:d.id,aim:{...b.aim}});
   }else if(b.phase==='tell'){
    const contact=strikeContains(b.aim,facts.player,d);
    r.defense=!contact||facts.guarded||facts.evading;b.phase='opening';b.remaining=d.opening;
    events.push({type:'strike',round:d.id,contact,defense:r.defense,response:!contact?'clear':facts.evading?'evade':facts.guarded?'brace':'missed'});
   }else if(b.phase==='opening'){
    b.phase='rest';b.remaining=d.rest;events.push({type:'exchange-closed',round:d.id,score:(r.defense?1:0)+(r.reply&&!r.early?1:0)});
   }else if(b.phase==='rest'){
    b.index++;b.aim=null;
    if(b.index===definition.rounds.length){b.phase='complete';b.remaining=0;events.push({type:'complete',score:points(b)});}
    else{b.phase='ready';b.remaining=definition.rounds[b.index].ready;events.push({type:'ready',round:definition.rounds[b.index].id});}
   }
  }
  return{ok:true,events};
 }
 // Create only after the REAL primary attack passed reach, line-of-sight,
 // stamina and cooldown checks. A token alone never scores or creates feedback.
 function attack(handle,{owner,family,kind}={}){
  const b=current(handle);
  if(owner!==b.owner||family!==b.family||kind!=='primary'||b.withdrawn||b.phase==='complete'||b.serial>=MAX)return fail('This is not an admitted primary attack in this bout.');
  const token=Object.freeze({id:b.run+':'+b.index+':'+(++b.serial)});
  attacks.set(token,{bout:handle,index:b.index,phase:b.phase,used:false});
  return{ok:true,token};
 }
 // Call only for actual melee contact or swept projectile/body intersection.
 // A miss/wall/contact from a different run cannot create a successful result.
 function hit(handle,token,owner){
  const b=current(handle),a=attacks.get(token);
  if(owner!==b.owner||!a||a.bout!==handle||a.used||b.withdrawn||b.phase==='complete')return fail('No current unconsumed contact.');
  a.used=true;
  if(a.index!==b.index)return fail('That attack belongs to an earlier exchange.');
  const r=b.rounds[b.index];
  if(b.phase==='rest')return fail('That reply arrived after the exchange closed.');
  if(a.phase!=='opening'||b.phase!=='opening'){
   r.early=true;r.reply=false;return{ok:false,foul:true,error:'Wait for the white pennant before releasing the reply.'};
  }
  if(r.early||r.reply)return fail(r.early?'This exchange’s reply point was forfeited.':'This exchange’s reply point is already recorded.');
  r.reply=true;return{ok:true,point:1,round:r.id};
 }
 function settle(record,handle,owner){
  const b=current(handle);let q;
  try{q=validate(record);}catch(e){return fail(e.message);}
  if(owner!==b.owner)return fail('This bout belongs to another simulation owner.');
  if(q.closed>=b.run)return{ok:true,duplicate:true,record:q,newMedals:[]};
  if(q.issued!==b.run||JSON.stringify(q)!==b.record)return fail('The tournament record changed during this bout.');
  if(b.phase!=='complete')return fail('Finish the declared exchanges or explicitly withdraw.');
  const old=medals(q,b.family);q.closed=b.run;q.finished[b.family]++;q.best[b.family]=Math.max(q.best[b.family]??0,points(b));
  return{ok:true,record:validate(q),newMedals:medals(q,b.family).filter(id=>!old.includes(id)),score:points(b)};
 }
 // Intentional withdrawal is also the cold-load recovery path. It only closes
 // the outstanding ID; absent live proof can never reconstruct a win.
 function closeOutstanding(record){let q;try{q=validate(record);}catch(e){return fail(e.message);}if(q.closed===q.issued)return{ok:true,duplicate:true,record:q};q.closed=q.issued;return{ok:true,record:q};}
 const api={definition,fresh,validate,inside,medals,begin,snapshot,advance,attack,hit,withdraw,settle,closeOutstanding};
 G.RealmRainTournamentModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
