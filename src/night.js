/* Act III, the night the warning failed. state.night is this lane's optional owner: who is across the bridge, whether
 * the severing device is found and broken, and whether the envoy has spoken at the spring. The beats stay with the saga
 * (mark 'night', briarTaken, choose). The spoken lines come from src/story-script.js (forStep 'night'); the journal keeps
 * only the short facts the player reads back. Scenes that fire during play wait in a queue for the interface to show. */
(function(G){'use strict';
const VERSION=1,REACH=2.6,CLAIM_NEAR=4.6,CALL_RANGE=7,DEVICE_CLEAR=6,FOLLOW_SPEED=2.8,DRIVE_SPEED=4.2,BITE_SECONDS=2.6,ARRIVE_SECONDS=3,
 HOME_FAR=12,HOUR_MIN=22.4,HOUR_MAX=23.3,HOUR_RATE=.9,CLAIM_HP=64,CLAIM_DAMAGE=9,CLAIM_XP=14,SPRING_NEAR=10,ENVOY_TALK=4.5,BOWL_NEAR=2.8;
const C=()=>G.RealmCore||(typeof require==='function'?require('./core.js'):null);
const A=()=>G.RealmAdventure||(typeof require==='function'?require('./adventure.js'):null);
const SG=()=>G.RealmSaga||(typeof require==='function'?require('./saga.js'):null);
const ST=()=>G.RealmStoryScript||(typeof require==='function'?require('./story-script.js'):null);
const own=Object.hasOwn,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),fail=error=>({ok:false,error}),yes=(text,extra)=>({ok:true,text,...extra});
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(_,k)=>v[k]??'');
const DEVICE=Object.freeze({x:16.4,z:18}),SPRING=Object.freeze({x:0,z:3}),ENVOY=Object.freeze({x:-2.3,z:4.7}),ENVOY_FROM=Object.freeze({x:7.2,z:-3.4}),SAFE=Object.freeze({x:6.5,z:21.5,r:3.2});
const TRAVELLERS=Object.freeze([
 {id:'tessa',name:'Tessa',group:'a',spot:{x:19,z:21},color:'#c99a68'},
 {id:'hob',name:'Hob',group:'a',spot:{x:19.6,z:22.9},color:'#86966a'},
 {id:'marl',name:'Marl',group:'b',spot:{x:18.5,z:23.9},color:'#7f93a8'},
 {id:'ennis',name:'Ennis',group:'b',spot:{x:19.5,z:25.2},color:'#b48a8a'},
 {id:'pip',name:'Pip',group:'c',spot:{x:18.4,z:20.3},color:'#a7ad72'}
]);
const GROUPS=Object.freeze({a:Object.freeze(['tessa','hob']),b:Object.freeze(['marl','ennis']),c:Object.freeze(['pip'])});
const GROUP_NAME=Object.freeze({a:'Tessa and Hob',b:'Marl and Ennis',c:'Pip'});
// Road claimants: ordinary enemies made for the night. Two guard the device, one stands at the bridge's near end.
const CLAIMS=Object.freeze([{id:'claim-1',x:19.8,z:12.6},{id:'claim-2',x:19.8,z:15.4},{id:'claim-3',x:15,z:18.6},{id:'claim-4',x:17.6,z:17.2},{id:'claim-5',x:11.2,z:17.2},{id:'claim-6',x:9.4,z:22.6}]);
const IDS=Object.freeze(TRAVELLERS.map(t=>t.id));
// Short facts for the journal and the adventure log. Spoken lines are not here: they come from the story script.
const JOURNAL=Object.freeze({
 begin:'Night has come down wrong over the crossing.',
 'found-briar':'Briar found the severing device on the bridge.',
 'found-tessa':'Tessa noticed the severing device on the bridge.',
 safe:'{name} is across the bridge.',
 call:'{names} will follow you.',
 'broken-briar':'Briar bit through the severing device. The counterfeit road pulled her under.',
 'broken-you':'The severing device broke in your hands. The bridge went quiet.',
 envoy:'The envoy spoke to you at the spring.'
});
// The tracker's own objectives: interface labels, not dialogue.
const TRACKER=Object.freeze({
 lead:{title:'Lead the travellers out',detail:'Walk to a group and call them. The road claimants slow them down, so clear the way ahead.'},
 briarRun:{title:'The severing device',detail:'Briar is running ahead to the bridge. Keep up.'},
 briarHold:{title:'The severing device',detail:'Briar is holding the bridge. Clear the road claimants around the device and reach it.'},
 tessa:{title:'The severing device',detail:'Tessa saw it first. Clear the road claimants around the device and reach it.'},
 plain:{title:'The severing device',detail:'Clear the road claimants around the device and reach it.'},
 quiet:{title:'The bridge is quiet.',briarDetail:'Briar is gone. The road let go of the bridge.',plainDetail:'The road let go of the bridge.'},
 home:{title:'Go home.',briarDetail:'Her bowl is still beside the shared house door.',plainDetail:'The envoy is waiting at the spring.'}
});
function fresh(){return{version:VERSION,started:false,safe:[],device:'hidden',envoy:false};}
function validate(raw,world){
 const no=f=>{throw Error('Invalid night: '+f);},isObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
 if(!isObj(raw)||Object.keys(raw).length!==5||!['version','started','safe','device','envoy'].every(k=>own(raw,k)))no('shape');
 if(raw.version!==VERSION)no('version');
 if(typeof raw.started!=='boolean'||typeof raw.envoy!=='boolean')no('flags');
 if(!Array.isArray(raw.safe)||new Set(raw.safe).size!==raw.safe.length||raw.safe.some(id=>!IDS.includes(id)))no('safe');
 if(!['hidden','found','broken'].includes(raw.device))no('device');
 const s={version:VERSION,started:raw.started,safe:IDS.filter(id=>raw.safe.includes(id)),device:raw.device,envoy:raw.envoy};
 if(!s.started&&(s.safe.length||s.device!=='hidden'||s.envoy))no('before the night');
 if(s.device==='broken'&&s.safe.length!==IDS.length)no('device before the travellers');
 if(s.envoy&&s.device!=='broken')no('envoy before the break');
 if(world&&s.started&&world.adventure?.crossing?.complete!==true)no('night before bellweather');
 return s;
}
// Old saves: a save already past the night (the saga marked it, or Briar is no longer with you) is whole, and nothing
// earlier is invented. The envoy counts as spoken once the player has moved on to Hell or Heaven.
function infer(world){
 const s=fresh(),b=world?.saga;
 if(b&&(own(b.beats||{},'night')||(b.briar?.state&&b.briar.state!=='with'))){
  Object.assign(s,{started:true,safe:IDS.slice(),device:'broken',envoy:!!(world.hellCampaign?.accepted||world.heavenCampaign?.accepted)});
 }
 return s;
}
function stageOf(world){const n=world?.night;if(!n?.started)return'waiting';if(!own(world.saga?.beats||{},'night'))return'lit';return n.envoy?'over':'quiet';}
function briarAway(sim){const s=sim?.state?.saga?.briar?.state;return s==='taken'||s==='nearshore';}
function runtime(sim){if(!sim.nightRuntime)sim.nightRuntime={people:{},slain:[],drive:false,run:false,driveSet:false,bite:null,envoyT:0,envoyArrived:false,pending:[],seq:0};return sim.nightRuntime;}
// The story script's scene for a night step, read against the world as it is now. Null when the script is not loaded.
function sceneOf(step,world){return ST()?.forStep?.('night',step,world)||null;}
function queue(sim,step){const sc=sceneOf(step,sim.state);if(sc&&sc.lines.length)runtime(sim).pending.push({step,scene:sc});}
function takePending(sim){return runtime(sim).pending.shift()||null;}
const hasPending=sim=>runtime(sim).pending.length>0;
const travellerOf=id=>TRAVELLERS.find(t=>t.id===id);
const safeSpot=i=>({x:SAFE.x+(i%2?.9:-.9),z:SAFE.z+(i<2?-.6:.8)});
function ensurePeople(sim){const r=runtime(sim),n=sim.state.night;TRAVELLERS.forEach((t,i)=>{if(r.people[t.id])return;const at=n.safe.includes(t.id)?safeSpot(i):t.spot;r.people[t.id]={x:at.x,z:at.z,yaw:Math.PI,following:false,frozen:false,path:[],nextPath:0};});}
function posOf(sim,id){const q=runtime(sim).people[id];return q?{x:q.x,z:q.z}:{x:travellerOf(id).spot.x,z:travellerOf(id).spot.z};}
function claimants(sim){return(A()?.runtime(sim)?.enemies||[]).filter(v=>v.nightClaim&&v.hp>0);}
function claimantsNear(sim,q,radius){return claimants(sim).some(v=>dist(v,q)<radius);}
function breakBlock(sim){
 const w=sim.state,n=w.night,p=w.player;
 if(n.device==='broken')return'The device is already broken.';
 if(n.device!=='found')return'The device is not found yet.';
 if(n.safe.length<IDS.length)return'The last of them are still on the far bank.';
 if(dist(p,DEVICE)>REACH)return'Reach the device first.';
 if(claimantsNear(sim,DEVICE,DEVICE_CLEAR))return'Clear the road claimants around the device first.';
 return null;
}
function groupAt(sim){
 const w=sim.state,n=w.night;let best=null;
 for(const g of Object.keys(GROUPS)){
  const waiting=GROUPS[g].filter(id=>!n.safe.includes(id));
  if(!waiting.length)continue;
  const d=Math.min(...waiting.map(id=>dist(posOf(sim,id),w.player)));
  if(d<=CALL_RANGE&&(!best||d<best.d))best={group:g,d};
 }
 return best?.group||null;
}
function found(sim,who){const key=who==='briar'?'found-briar':'found-tessa';sim.state.night.device='found';sim.event('night',JOURNAL[key]);A().notify(sim,JOURNAL[key]);queue(sim,key);}
function begin(sim){
 const w=sim.state,n=w.night,r=runtime(sim),bonded=w.adventure.companion.bonded!==false;
 n.started=true;r.people={};ensurePeople(sim);
 r.driveSet=true;r.drive=bonded;r.run=bonded;
 sim.event('night',JOURNAL.begin);A().notify(sim,JOURNAL.begin);queue(sim,'begin');
 if(bonded)G.RealmBriarOuting?.cancel?.(sim,'The night has come down over the crossing.');
}
function breakDevice(sim,who){
 const w=sim.state,n=w.night,r=runtime(sim),S=SG();
 if(n.device==='broken')return fail('The device is already broken.');
 const beat=S.mark(sim,'night');if(!beat.ok)return fail(beat.error);
 n.device='broken';r.drive=false;r.run=false;r.bite={t:0,who};
 if(who==='briar'){const taken=S.briarTaken(sim);if(!taken.ok)sim.event('night','Briar could not be taken: '+taken.error);}
 const key=who==='briar'?'broken-briar':'broken-you';
 sim.event('night',JOURNAL[key]);A().notify(sim,JOURNAL[key]);
 queue(sim,key);queue(sim,'receipt');
 return yes(JOURNAL[key]);
}
function call(sim,group){
 const w=sim.state,n=w.night;
 if(stageOf(w)!=='lit'||sim.room!=='crossing')return fail('Nothing needs calling from here.');
 if(!own(GROUPS,group))return fail('Unknown group.');
 ensurePeople(sim);
 const waiting=GROUPS[group].filter(id=>!n.safe.includes(id));
 if(!waiting.length)return fail('They are already across.');
 if(Math.min(...waiting.map(id=>dist(posOf(sim,id),w.player)))>CALL_RANGE)return fail('Walk closer to them first.');
 const r=runtime(sim);
 for(const id of waiting){const q=r.people[id];q.following=true;q.path=[];q.nextPath=0;}
 const text=fill(JOURNAL.call,{names:waiting.map(id=>travellerOf(id).name).join(' and ')});
 sim.event('night',text);return yes(text);
}
function breakByYou(sim){
 const w=sim.state;
 if(stageOf(w)!=='lit'||sim.room!=='crossing')return fail('Nothing needs breaking here tonight.');
 if(w.adventure.companion.bonded!==false)return fail('Briar is the one who breaks it.');
 const why=breakBlock(sim);if(why)return fail(why);
 return breakDevice(sim,'you');
}
function envoy(sim){
 const w=sim.state,n=w.night,r=runtime(sim);
 if(stageOf(w)!=='quiet'||sim.room!==null)return fail('There is nothing to say at the spring tonight.');
 if(!r.envoyArrived)return fail('The envoy has not come to the spring yet.');
 if(dist(w.player,ENVOY)>ENVOY_TALK)return fail('Walk to the envoy at the spring.');
 n.envoy=true;
 const sc=sceneOf('envoy',w),lines=sc?sc.lines:[];
 sim.event('night',JOURNAL.envoy);
 return yes(lines[0]?.text||JOURNAL.envoy,{lines});
}
// The device is placed once, in the crossing, after the envoy has spoken. The saga records the choice; the night
// only offers it and queues the scene that follows.
function deviceReady(sim){const w=sim.state;return sim.room==='crossing'&&w.night.envoy===true&&!w.saga?.choices?.device&&dist(w.player,DEVICE)<=REACH;}
function deviceOptions(sim){return sceneOf('device',sim.state)?.choice?.options||[];}
function placeDevice(sim,value){
 const w=sim.state,r=runtime(sim);
 if(!w.night.envoy)return fail('There is nothing to place yet.');
 if(sim.room!=='crossing'||dist(w.player,DEVICE)>REACH)return fail('Stand at the device to place it.');
 const opt=deviceOptions(sim).find(o=>o.id===value);
 if(!opt)return fail('Unknown placement.');
 const key=Object.keys(opt.sets)[0].split('.').pop();
 r.seq=(r.seq||0)+1;
 const res=sim.sagaCommand('night-place-'+r.seq,'choose',{key,value});
 if(!res.ok)return fail(res.error);
 if(!res.already)queue(sim,'device-after');
 return yes(opt.label,{value,already:res.already===true});
}
// The bowl by the shared house door is read again whenever Briar is taken. It changes nothing.
function bowlPoint(){const d=G.RealmBriarOuting?.definition;return d?{x:d.rest.x+.7,z:d.rest.z}:null;}
function bowlNear(sim){const p=bowlPoint(),w=sim.state;return!!p&&sim.room===null&&w.saga?.briar?.state==='taken'&&dist(w.player,p)<=BOWL_NEAR;}
// Briar runs to the device when the night begins, holds the bridge, and is the one who bites when the way is clear.
function driveBriar(sim,dt){
 const r=runtime(sim),n=sim.state.night,c=A()?.runtime(sim)?.companion;
 if(!c||!r.drive||!r.run)return;
 if(dist(c,DEVICE)<1.4){r.run=false;c.path=[];c.status='Holding the bridge';if(n.device==='hidden')found(sim,'briar');return;}
 A().followPath(sim,c,DEVICE,dt,DRIVE_SPEED);c.status='Running ahead';
}
function moveTravellers(sim,dt){
 const w=sim.state,n=w.night,r=runtime(sim),p=w.player,now=w.adventure.elapsed,K=C();
 for(const t of TRAVELLERS){
  const q=r.people[t.id];if(!q||n.safe.includes(t.id)||!q.following)continue;
  q.frozen=claimantsNear(sim,q,CLAIM_NEAR);if(q.frozen)continue;
  if(dist(q,p)<=1.7){q.path=[];continue;}
  if(!q.path?.length||now>=q.nextPath){q.path=K.pathfind(q,p,sim.navRoom,false,.31)||[];q.nextPath=now+.6;}
  sim.advance(q,q.path,dt,FOLLOW_SPEED);
 }
 for(const t of TRAVELLERS){
  const q=r.people[t.id];if(!q||n.safe.includes(t.id)||!q.following||dist(q,SAFE)>SAFE.r)continue;
  n.safe=IDS.filter(id=>id===t.id||n.safe.includes(id));
  q.following=false;q.path=[];Object.assign(q,safeSpot(IDS.indexOf(t.id)));
  const text=fill(JOURNAL.safe,{name:t.name});sim.event('night',text);A().notify(sim,text);
  if(n.safe.length===IDS.length)queue(sim,'all-safe');
 }
}
function enemies(sim){
 const r=runtime(sim);
 if(sim.room!=='crossing'||stageOf(sim.state)!=='lit')return[];
 return CLAIMS.filter(c=>!r.slain.includes(c.id)).map(c=>({...c,name:'Road claimant',kind:'claim',nightClaim:true,maxHP:CLAIM_HP,hp:CLAIM_HP,damage:CLAIM_DAMAGE,xp:CLAIM_XP,ore:0,coins:0}));
}
function defeat(sim,e){const r=runtime(sim),xp=e.xp||CLAIM_XP;if(!r.slain.includes(e.id))r.slain.push(e.id);A().awardXP(sim,xp);A().notify(sim,'Road claimant broken · +'+xp+' experience');}
function signature(sim){return stageOf(sim.state)+'|'+sim.state.night.device+'|'+runtime(sim).slain.length;}
function objective(sim){
 const w=sim.state,n=w.night,bonded=w.adventure.companion.bonded!==false,T=TRACKER,st=stageOf(w);
 if(st==='lit'){
  if(n.safe.length<IDS.length)return{title:T.lead.title,detail:T.lead.detail,progress:n.safe.length+' / '+IDS.length+' across · Journal J'};
  const pick=!bonded?(n.device==='found'?T.tessa:T.plain):n.device==='found'?T.briarHold:T.briarRun;
  return{title:pick.title,detail:pick.detail,progress:'Journal J'};
 }
 if(st==='quiet'){
  const far=dist(w.player,DEVICE)>HOME_FAR;
  if(far)return{title:T.home.title,detail:bonded?T.home.briarDetail:T.home.plainDetail,progress:'Journal J'};
  return{title:T.quiet.title,detail:bonded?T.quiet.briarDetail:T.quiet.plainDetail,progress:'Journal J'};
 }
 return null;
}
function envoyPos(sim){
 const r=runtime(sim);
 if(stageOf(sim.state)!=='quiet'||sim.room!==null||!(r.envoyT>0))return null;
 const f=Math.min(1,r.envoyT/ARRIVE_SECONDS),e=f*f*(3-2*f);
 return{x:ENVOY_FROM.x+(ENVOY.x-ENVOY_FROM.x)*e,z:ENVOY_FROM.z+(ENVOY.z-ENVOY_FROM.z)*e,arrived:r.envoyArrived};
}
function travellerState(sim,id){ensurePeople(sim);return runtime(sim).people[id];}
function handle(sim,type,p={}){
 if(typeof type!=='string'||!type.startsWith('night-'))return null;
 switch(type){
  case'night-call':return call(sim,p.group);
  case'night-break':return breakByYou(sim);
  case'night-envoy':return envoy(sim);
  case'night-device':return placeDevice(sim,p.value);
  default:return fail('Unknown night action.');
 }
}
function tick(sim,dt){
 const w=sim.state,n=w?.night,a=w?.adventure;
 if(!n||!a||!Number.isFinite(dt)||dt<=0)return;
 const r=runtime(sim),p=w.player,beat=own(w.saga?.beats||{},'night');
 // the night begins on a new visit, not in the one that rang the bell: the reward and the inn stay as they were.
 const entered=sim.room==='crossing'&&r.lastRoom!=='crossing';r.lastRoom=sim.room;
 if(entered&&!n.started&&a.crossing?.complete===true&&!beat&&!sim.worldDive&&a.hp>0)begin(sim);
 const st=stageOf(w),bonded=a.companion.bonded!==false;
 if(st==='lit'||st==='quiet'){const want=Math.min(HOUR_MAX,Math.max(HOUR_MIN,w.hour)),d=want-w.hour;w.hour+=Math.max(-dt*HOUR_RATE,Math.min(dt*HOUR_RATE,d));}
 const c=A()?.runtime(sim)?.companion;
 if(c){
  if(briarAway(sim)){if(c.room!=='away')Object.assign(c,{room:'away',path:[],nextPath:0,seek:null,guide:null,status:'Gone'});}
  else if(c.room==='away')Object.assign(c,{room:sim.room,path:[],nextPath:0,x:p.x,z:p.z,status:'Beside you'});
 }
 if(r.bite){r.bite.t+=dt;if(r.bite.t<BITE_SECONDS)sim.playerPath=[];}
 if(st==='lit'&&sim.room==='crossing'&&a.hp>0){
  ensurePeople(sim);
  if(bonded&&!r.driveSet&&n.device!=='broken'){r.driveSet=true;r.drive=true;r.run=true;}
  driveBriar(sim,dt);
  moveTravellers(sim,dt);
  if(!bonded&&n.device==='hidden'&&n.safe.includes('tessa'))found(sim,'tessa');
  if(bonded&&n.device==='found'&&!breakBlock(sim))breakDevice(sim,'briar');
 }
 if(st==='quiet'&&sim.room===null&&a.hp>0&&!r.envoyArrived&&dist(p,SPRING)<SPRING_NEAR){
  r.envoyT=Math.min(ARRIVE_SECONDS,r.envoyT+dt);
  if(r.envoyT>=ARRIVE_SECONDS)r.envoyArrived=true;
 }
}
const api=Object.freeze({VERSION,REACH,ENVOY_TALK,TRAVELLERS,GROUPS,GROUP_NAME,CLAIMS,DEVICE,SPRING,ENVOY,SAFE,JOURNAL,TRACKER,
 fresh,validate,infer,stage:stageOf,briarAway,runtime,sceneOf,takePending,hasPending,deviceReady,deviceOptions,bowlNear,
 bowlScene:sim=>sceneOf('bowl',sim.state),
 holdsBriar:sim=>runtime(sim).drive===true,
 holdsPlayer:sim=>{const b=runtime(sim).bite;return!!b&&b.t<BITE_SECONDS;},
 envoyHidden:sim=>stageOf(sim.state)==='quiet',envoyPos,travellerState,enemies,signature,defeat,breakBlock,groupAt,objective,handle,tick});
G.RealmNight=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
