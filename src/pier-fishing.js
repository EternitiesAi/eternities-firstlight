/* An optional ordinary fish. Transient skill play only: no inventory, payout,
 * record, consent, migration or offline clock. The actual Core clock owns time. */
(function(G){'use strict';
const C=G.RealmCore||(typeof require==='function'?require('./core.js'):null);
const sessions=new WeakMap(),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const pier=Object.freeze({x:0,z:27}),fail=error=>({ok:false,error});
function eligible(ctx){
 const sim=ctx?.sim;if(!(sim instanceof C.Simulation)||typeof ctx.current!=='function')return false;
 let owner;try{owner=ctx.current();}catch{return false;}
 return owner?.sim===sim&&owner.active===ctx.active&&sim.room===null&&!sim.worldDive&&sim.state.adventure.hp>0&&
  distance(sim.state.player,pier)<=3.4&&C.walkable(sim.state.player.x,sim.state.player.z,sim.navRoom,.31)&&
  C.segment(sim.state.player,pier,sim.navRoom,.31);
}
function owned(ctx){
 const o=sessions.get(ctx?.sim);return o&&eligible(ctx)&&o.state===ctx.sim.state&&o.active===ctx.active&&
  o.player===ctx.sim.state.player&&distance(o.origin,o.player)<=.75?o:null;
}
function current(ctx){
 const o=owned(ctx);return o?Object.freeze({phase:o.phase,time:o.time,reeling:o.reeling,tension:o.tension,progress:o.progress,
  pulling:o.phase==='playing'&&o.fightTime%5<2,message:o.message,fish:'Lantern silverfin'}):null;
}
function command(ctx,type,payload={}){
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||Reflect.ownKeys(payload).length)return fail('Use the pier controls without extra terms.');
 if(!['cast','hook','toggle','reel','ease','release','cancel'].includes(type))return fail('Unknown fishing action.');
 if(type==='cancel'){if(ctx?.sim)sessions.delete(ctx.sim);return{ok:true,text:'Line put away. Nothing was spent or kept.'};}
 if(!eligible(ctx))return fail('Stand safely at the lantern pier with a living character.');
 let o=owned(ctx);
 if(type==='ease'&&o?.phase==='playing'){o.reeling=false;return{ok:true,text:'Easing the line.'};}
 if(ctx.sim.paused)return fail('Resume the world before fishing.');
 if(type==='cast'){
  if(o&&!['lost'].includes(o.phase))return fail('Finish or release this line before casting again.');
  const sim=ctx.sim;o={state:sim.state,active:ctx.active,player:sim.state.player,origin:{x:sim.state.player.x,z:sim.state.player.z},
   last:sim.elapsed,time:0,fightTime:0,slack:0,phase:'waiting',reeling:false,tension:.28,progress:.08,message:'Float is out · watch for a bite.'};
  sessions.set(sim,o);return{ok:true,text:o.message};
 }
 if(!o)return fail('There is no current line.');
 if(type==='hook'&&o.phase==='bite'){o.phase='playing';o.message='Fish on · reel gently, ease when it pulls.';return{ok:true,text:o.message};}
 if(['toggle','reel','ease'].includes(type)&&o.phase==='playing'){
  o.reeling=type==='toggle'?!o.reeling:type==='reel';return{ok:true,text:o.reeling?'Reeling · watch the tension.':'Easing · keep a little tension.'};
 }
 if(type==='release'&&o.phase==='caught'){sessions.delete(ctx.sim);return{ok:true,text:'The silverfin slips back into the lake. Nothing taken; a little time well spent.'};}
 return fail('That action is not ready.');
}
function tick(ctx,suspended=false){
 const sim=ctx?.sim,o=owned(ctx);if(!o){if(sim)sessions.delete(sim);return;}
 const dt=sim.elapsed-o.last;o.last=sim.elapsed;
 if(sim.paused||suspended||!Number.isFinite(dt)||dt<=0||dt>.25)return;
 if(['caught','lost'].includes(o.phase))return;o.time+=dt;
 if(o.phase==='waiting'&&o.time>=3.5){o.phase='bite';o.message='A bite · press E or Hook when you are ready.';return;}
 if(o.phase!=='playing')return;
 o.fightTime+=dt;const pull=o.fightTime%5<2;
 o.tension=Math.max(0,Math.min(1,o.tension+dt*(o.reeling?(pull?.24:.105):-.22)));
 o.progress=Math.max(0,Math.min(1,o.progress+dt*(o.reeling?(pull?.055:.14):-.014)));
 o.slack=o.tension<.035?o.slack+dt:0;
 if(o.tension>=1||o.slack>=2){o.phase='lost';o.reeling=false;o.message=o.tension>=1?'Too much tension · the fish shook the line.':'The line went slack · the fish slipped free.';return;}
 if(o.progress>=1){o.phase='caught';o.reeling=false;o.message='A lantern silverfin beside the pier · release it when ready.';return;}
 o.message=pull?'Strong pull · ease the line.':'The fish is turning · a good time to reel.';
}
const api=Object.freeze({pier,eligible,current,command,tick});G.RealmPierFishing=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
