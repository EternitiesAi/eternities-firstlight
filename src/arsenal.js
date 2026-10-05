/* Firstlight 08 — weapon choice, swept projectiles, and removable gem sockets.
 * Pure geometry + explicit local commands. No RNG reward, network or AI calls.
 * Practice targets are not creatures and never award XP or ordinary loot.
 */
(function(G){'use strict';
const VERSION=1,MAX=9999;
const RANGE=Object.freeze({entry:{x:0,z:9,yaw:Math.PI},gate:{x:11,z:9},width:14,depth:13,
 targets:[{id:'range-west',name:'The copper bell',kind:'practice',x:-6,z:-5,radius:.7},
 {id:'range-mid',name:'The moon disc',kind:'practice',x:0,z:-8,radius:.7},
 {id:'range-east',name:'The travelling sun',kind:'practice',x:6,z:-5,radius:.7}],
 pillars:[{x:-3,z:0,r:.65},{x:3,z:0,r:.65}],
 scenery:[...[-11.5,11.5].flatMap(x=>[-10,-3,4,11].map(z=>({x,z,r:.19}))),{x:-10,z:7,w:.8,d:2},{x:10,z:7,w:.8,d:2},{x:-7,z:9,r:.24},{x:7,z:9,r:.24},{x:-2,z:12.2,r:.25},{x:2,z:12.2,r:.25}]});
const GEAR=Object.freeze({
 trail_bow:{name:'Ashwood trail bow',slot:'weapon',attack:9,defense:0,hp:0,tier:'Crafted',style:'bow',color:'#d5b680',desc:'A nimble bow. Arrows travel, miss moving targets, and stop at stone. No ammunition grind.'},
 copper_bow:{name:'Copper-limbed longbow',slot:'weapon',attack:17,defense:0,hp:0,tier:'Crafted',style:'bow',color:'#e1b080',desc:'A stronger bow for the road. Keeps its own removable gem socket.'}
});
const GEMS=Object.freeze({
 ruby:{name:'Ember ruby',color:0xcc627b,css:'#ea8298',attack:4,hp:0,companion:0,desc:'+4 attack while this weapon is equipped.'},
 moonstone:{name:'Pearl moonstone',color:0xa5cddd,css:'#bcdfe7',attack:0,hp:18,companion:0,desc:'+18 maximum health. Fitting it does not heal you.'},
 amber:{name:'Wildwood amber',color:0xe4ad56,css:'#f1c37e',attack:0,hp:0,companion:3,desc:'+3 damage to Briar’s actual companion strikes.'}
});
const RECIPES=Object.freeze({
 trail_bow:{name:'Ashwood trail bow',gear:'trail_bow',materials:{wood:6,fiber:4,stone:2},ore:0,coins:0},
 copper_bow:{name:'Copper-limbed longbow',gear:'copper_bow',requires:'trail_bow',materials:{plank:2},ore:4,coins:6},
 ruby:{name:'Cut an ember ruby',gem:'ruby',materials:{crystal:1},ore:2,coins:3},
 moonstone:{name:'Polish a moonstone',gem:'moonstone',materials:{crystal:1,fiber:2},ore:0,coins:2},
 amber:{name:'Shape Wildwood amber',gem:'amber',materials:{wood:2,fiber:3},ore:1,coins:2}
});
const has=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
function fresh(){return{version:VERSION,gems:{ruby:0,moonstone:0,amber:0},sockets:{},rangeMedal:false,bestTime:null};}
function validate(raw,a){const bad=m=>{throw Error('Invalid arsenal: '+m);};if(!raw||raw.version!==VERSION)bad('version');const s=fresh();
 if(!raw.gems||Object.keys(raw.gems).some(k=>!has(GEMS,k)))bad('gem types');
 for(const k of Object.keys(GEMS)){const n=raw.gems[k];if(!Number.isSafeInteger(n)||n<0||n>MAX)bad('quantity');s.gems[k]=n;}
 if(!raw.sockets||Array.isArray(raw.sockets)||typeof raw.sockets!=='object')bad('sockets');
 const gear=G.RealmAdventure?.GEAR||{};
 for(const [weapon,gem] of Object.entries(raw.sockets)){
  if(!a||!a.owned.includes(weapon)||!has(gear,weapon)||gear[weapon].slot!=='weapon'||!has(GEMS,gem))bad('owned weapon / known gem');
  s.sockets[weapon]=gem;
 }
 if(typeof raw.rangeMedal!=='boolean')bad('medal');s.rangeMedal=raw.rangeMedal;
 if(raw.bestTime!==null&&(!Number.isFinite(raw.bestTime)||raw.bestTime<=0||raw.bestTime>30))bad('time');s.bestTime=raw.bestTime;
 if(s.rangeMedal!==!!s.bestTime)bad('medal/time prerequisite');
 if(a&&!a.started&&(s.rangeMedal||Object.values(s.gems).some(Boolean)||Object.keys(s.sockets).length))bad('unstarted');return s;
}
function activeGem(a){const id=a.arsenal?.sockets[a.equipment.weapon];return has(GEMS,id)?GEMS[id]:null;}
function weapon(a){const gear=G.RealmAdventure?.GEAR||GEAR;const id=a.equipment.weapon;const bow=has(gear,id)&&gear[id].slot==='weapon'&&gear[id].style==='bow';return{style:bow?'bow':'blade',reach:bow?11:2.65,cooldown:bow?.75:.52,stamina:bow?6:0,primary:bow?'Loose arrow':'Sunstrike',special:bow?'Piercing light':'Dawn sweep'};}
function rangeWalkable(x,z,r=.31){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<14-r&&Math.abs(z)<13-r&&![...RANGE.pillars,...RANGE.scenery].some(p=>p.r!==undefined?Math.hypot(x-p.x,z-p.z)<p.r+r:Math.abs(x-p.x)<p.w/2+r&&Math.abs(z-p.z)<p.d/2+r);}
function targetPose(def,t){return{...def,x:def.x+(def.id==='range-east'?Math.sin(t*.7)*1.8:0),z:def.z};}
function projectileGround(sim,x,z){
 if(G.RealmWorldFoundations?.handles(sim.room))return !sim.worldDive&&G.RealmWorldFoundations.walkable(sim.room,x,z,.035);
 const A=G.RealmAdventure,R=G.RealmRoad;
 if(sim.room==='riverbank')return G.RealmStarter.walkable(x,z,.035);
 if(sim.room==='crossing')return G.RealmCrossing.projectileGround(x,z,.035);
 if(sim.room==='mine')return A.walkable(sim.state.adventure,x,z,.035);
 if(sim.room==='range')return rangeWalkable(x,z,.035);
 if(sim.room==='road')return R.land(x,z,.035)&&![...R.OBSTACLES,...R.TREES.map(t=>({x:t[0],z:t[1],r:.24*t[2]}))].some(o=>o.r!==undefined?Math.hypot(x-o.x,z-o.z)<o.r+.035:Math.abs(x-o.x)<o.w/2+.035&&Math.abs(z-o.z)<o.d/2+.035);
 return false;
}
const validPoint=p=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<10000&&Math.abs(p.z)<10000;
function aimClear(sim,a,b){if(G.RealmWorldFoundations?.handles(sim.room))return !sim.worldDive&&validPoint(a)&&validPoint(b)&&Math.hypot(b.x-a.x,b.z-a.z)<=100&&G.RealmWorldFoundations.segment(sim.room,a,b,.035);if(!validPoint(a)||!validPoint(b)||Math.hypot(b.x-a.x,b.z-a.z)>100)return false;const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.08));for(let i=0;i<=n;i++)if(!projectileGround(sim,a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
// First intersection along a segment with a horizontal circular hit volume.
function segmentCircle(a,b,c,r){if(!validPoint(a)||!validPoint(b)||!validPoint(c)||!Number.isFinite(r)||r<0)return null;const dx=b.x-a.x,dz=b.z-a.z,ox=a.x-c.x,oz=a.z-c.z,aa=dx*dx+dz*dz,cc=ox*ox+oz*oz-r*r;if(cc<=0)return 0;if(aa<1e-12)return null;const bb=2*(ox*dx+oz*dz),disc=bb*bb-4*aa*cc;if(disc<0)return null;const u=(-bb-Math.sqrt(disc))/(2*aa);return u>=0&&u<=1?u:null;}
// Geometry, not a destination id, chooses what an arrow actually hits.
function trace(a,b,targets,isClear,already=[]){if(!validPoint(a)||!validPoint(b)||Math.hypot(b.x-a.x,b.z-a.z)>100)return{wall:0,hits:[]};let wall=null;const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.08));for(let i=0;i<=n;i++)if(!isClear(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n)){wall=i/n;break;}
 const hits=targets.filter(e=>e.hp>0&&!e.hidden&&!already.includes(e.id)).map(e=>({e,u:segmentCircle(a,b,e,e.radius??(e.kind==='boss'||e.kind==='charger'?.8:.48))})).filter(h=>h.u!==null&&(wall===null||h.u<wall-1e-8)).sort((x,y)=>x.u-y.u||x.e.id.localeCompare(y.e.id));return{wall,hits};}
function runtime(sim){const r=G.RealmAdventure.runtime(sim);if(!r.arrows)r.arrows=[];if(!r.range)r.range={active:false,start:0,hits:{},shots:0,message:'Explore the court, or begin a timed round.'};return r;}
function practiceHit(sim,e){const a=sim.state.adventure,r=runtime(sim),q=r.range;e.flash=a.elapsed+.2;
 if(!q.active)return;
 q.hits[e.id]=Math.min(2,(q.hits[e.id]||0)+1);
 if(!RANGE.targets.every(t=>(q.hits[t.id]||0)>=2))return;
 const time=Math.max(.001,Math.round((a.elapsed-q.start)*1000)/1000);if(time>30)return;
 q.active=false;q.message='Round complete · '+time.toFixed(2)+'s · '+q.shots+' arrows';
 const first=!a.arsenal.rangeMedal;
 if(first&&(a.coins>MAX-5||a.arsenal.gems.amber>=MAX)){q.message='Round complete. Make room for 5 sunmarks and an amber, then try again.';return;}
 a.arsenal.bestTime=Math.min(a.arsenal.bestTime??30,time);a.arsenal.rangeMedal=true;
 if(first){a.coins+=5;a.arsenal.gems.amber++;G.RealmAdventure.notify(sim,'First archery medal · 5 sunmarks and a Wildwood amber.');sim.event('practice','You earned your first range medal. Repeats improve the time, not the payout.');}
 a.revision++;
}
function shoot(sim,type,payload={}){const A=G.RealmAdventure,a=sim.state.adventure,r=runtime(sim),p=sim.state.player,w=weapon(a),special=type==='pulse',cost=special?30:w.stamina,cool=special?'pulse':'attack';
 const fail=error=>({ok:false,error});if(!A.combatScene(sim)||!a.started||w.style!=='bow')return fail('Equip a bow in an expedition or practice court.');
 if(a.elapsed<r.cooldowns[cool])return fail('The bow is recovering.');if(a.stamina<cost)return fail('The bow needs '+cost+' stamina.');if(r.arrows.length>=24)return fail('Too many arrows in flight.');
 const reachable=e=>e.hp>0&&!e.hidden&&Math.hypot(e.x-p.x,e.z-p.z)<w.reach&&aimClear(sim,p,e);
 const target=payload.target?r.enemies.find(e=>e.id===payload.target&&reachable(e)):r.enemies.filter(reachable).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
 if(!target)return fail('Choose a clear target within 11 paces.');
 const d=Math.hypot(target.x-p.x,target.z-p.z);if(d<.03)return fail('Step back before drawing.');
 a.stamina-=cost;r.cooldowns[cool]=a.elapsed+(special?5.5:w.cooldown);p.yaw=Math.atan2(target.x-p.x,target.z-p.z);
 r.arrows.push({id:'arrow-'+a.revision,room:sim.room,x:p.x,z:p.z,dx:(target.x-p.x)/d,dz:(target.z-p.z)/d,left:13,age:0,damage:Math.round(A.stats(a).attack*(special?1.65:1)),pierce:special?2:1,hit:[],special,color:activeGem(a)?.color??0xe6c78c});
 r.lastShot=a.elapsed;r.aimYaw=p.yaw;if(sim.room==='range'&&r.range.active)r.range.shots++;
 return{ok:true,text:special?'Piercing light · two targets in its path':'Arrow released'};
}
function update(sim,dt){const A=G.RealmAdventure,a=sim.state.adventure,r=runtime(sim);if(sim.paused||!Number.isFinite(dt)||dt<0)return;
 if(r.room==='range'){for(const e of r.enemies){const def=RANGE.targets.find(q=>q.id===e.id);if(def){const pos=targetPose(def,a.elapsed);e.x=pos.x;e.z=pos.z;}}
  if(r.range.active&&a.elapsed-r.range.start>30){r.range.active=false;r.range.message='Time is up. Practice is free; begin another round.';A.notify(sim,r.range.message);}
 }
 const keep=[];
 for(const shot of r.arrows){if(shot.room!==sim.room||a.hp<=0)continue;const step=Math.min(shot.left,dt*22),end={x:shot.x+shot.dx*step,z:shot.z+shot.dz*step},hit=trace(shot,end,r.enemies,(x,z)=>projectileGround(sim,x,z),shot.hit);let stopped=false;
  for(const {e,u}of hit.hits){const denied=e.heavenCampaign&&!G.RealmHeavenCampaign.canDamage(sim,e)||e.hellCampaign&&!G.RealmHellCampaign.canDamage(sim,e)||e.trailQuest&&!G.RealmTrails.canDamage(sim,e);shot.hit.push(e.id);shot.pierce--;if(e.kind==='practice'&&sim.room!=='riverbank')practiceHit(sim,e);else{A.damageEnemy(sim,e,shot.damage,'weapon');e.awareness=a.elapsed+3;e.lastKnown={x:sim.state.player.x,z:sim.state.player.z};}
   A.fx(sim,denied?'arrow-wall':'arrow-hit',shot.x+(end.x-shot.x)*u,shot.z+(end.z-shot.z)*u,shot.color);
   if(shot.pierce<=0){stopped=true;break;}}
  if(!stopped&&hit.wall!==null){A.fx(sim,'arrow-wall',shot.x+(end.x-shot.x)*hit.wall,shot.z+(end.z-shot.z)*hit.wall,0xb4bab0);stopped=true;}
  shot.x=end.x;shot.z=end.z;shot.left-=step;shot.age+=dt;if(!stopped&&shot.left>1e-5&&shot.age<2)keep.push(shot);
 }r.arrows=keep;
}
function atBench(sim){return (!sim.room&&G.RealmSandbox.station(sim.state.sandbox,sim.state.player))||(sim.room==='crossing'&&Math.hypot(sim.state.player.x+10,sim.state.player.z-5)<2.8);}
function handle(sim,type,payload){const A=G.RealmAdventure,a=sim.state.adventure,s=a.arsenal,p=sim.state.player,r=runtime(sim),fail=error=>({ok:false,error}),yes=text=>({ok:true,text});
 switch(type){
 case'arsenal-craft':{
  if(!a.started||!atBench(sim)||!has(RECIPES,payload.id))return fail('Take expedition supplies and visit an outdoor workbench.');const q=RECIPES[payload.id],inv=sim.state.sandbox.inventory;
  if(q.gear&&a.owned.includes(q.gear))return fail('You already own this bow.');if(q.requires&&!a.owned.includes(q.requires))return fail('Make the trail bow first.');if(q.gem&&s.gems[q.gem]>=MAX)return fail('Your gem pouch is full.');
  if(a.ore<q.ore||a.coins<q.coins||Object.entries(q.materials).some(([k,n])=>(inv[k]||0)<n))return fail('Not enough materials for '+q.name+'.');
  a.ore-=q.ore;a.coins-=q.coins;for(const[k,n]of Object.entries(q.materials))inv[k]-=n;if(q.gear)a.owned.push(q.gear);else s.gems[q.gem]++;return yes(q.name+' made.');}
 case'socket':{
  if(!atBench(sim)||!a.started)return fail('Use an outdoor workbench to fit or remove a gem.');const id=payload.weapon,gem=payload.gem;
  if(!has(A.GEAR,id)||A.GEAR[id].slot!=='weapon'||!a.owned.includes(id)||gem!==null&&!has(GEMS,gem))return fail('Choose an owned weapon and a known gem.');
  const old=s.sockets[id];if((old??null)===gem)return fail('That socket is already set.');if(gem!==null&&!s.gems[gem])return fail('You do not have that loose gem.');if(old&&s.gems[old]>=MAX)return fail('Make space before reclaiming the fitted gem.');
  if(gem!==null)s.gems[gem]--;if(old)s.gems[old]++;if(gem===null)delete s.sockets[id];else s.sockets[id]=gem;
  a.hp=Math.min(a.hp,A.stats(a).maxHP);return yes(gem===null?'Gem reclaimed intact.':GEMS[gem].name+' fitted. Previous gem returned intact.');}
 case'range-enter':
  if(sim.room||!a.started||Math.hypot(p.x-11,p.z-9)>3.5)return fail('Visit Oren’s workshop with expedition supplies.');sim.returnPos={...p};sim.room='range';sim.state.player={...RANGE.entry};sim.playerPath=[];A.syncScene(sim);return yes('The archery court · Practice without risk. Craft a bow at Oren’s bench.');
 case'range-leave':
  if(sim.room!=='range'||Math.hypot(p.x,p.z-9)>3.2)return fail('Return to the southern gate to leave the court.');sim.leave();A.syncScene(sim);return yes('Back at Oren’s workshop.');
 case'range-start':
  if(sim.room!=='range'||weapon(a).style!=='bow')return fail('Equip a bow inside the archery court.');if(r.range.active)return fail('A round is already running.');
  r.arrows=[];r.range={active:true,start:a.elapsed,hits:{},shots:0,message:'Hit each of three targets twice in 30 seconds.'};return yes(r.range.message);
 case'range-stop':
  if(sim.room!=='range'||!r.range.active)return fail('No active round.');r.range.active=false;r.arrows=[];r.range.message='Round ended. No penalty. Your best result remains.';return yes(r.range.message);
 default:return null;
 }
}
G.RealmArsenal={VERSION,MAX,RANGE,GEAR,GEMS,RECIPES,fresh,validate,activeGem,weapon,rangeWalkable,targetPose,atBench,projectileGround,aimClear,segmentCircle,trace,runtime,practiceHit,shoot,update,handle};if(typeof module!=='undefined')module.exports=G.RealmArsenal;
})(globalThis);
