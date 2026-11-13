/* Command journey: the Hollow Hart at level one. The route to the mine uses real commands. The fight then starts with the
 * player placed beside the hart, because the other mine creatures would lift the level and walking past them is not this
 * check. That placement is labelled synthetic. Timing is automated; this is not a human balance trial. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),S=require('../src/sandbox.js'),A=require('../src/adventure.js'),T=require('../src/combat.js');
function atHart(){
 const sim=new C.Simulation();let seq=0;
 const ok=(res,what)=>{assert.ok(res.ok,what+': '+res.error);return res;};
 const adv=(t,p={})=>ok(sim.adventureCommand('hart-'+(++seq),t,p),t);
 const sb=(t,p={})=>ok(sim.sandboxCommand('hart-'+(++seq),t,p),t);
 const step=t=>{for(let i=0;i<Math.round(t*20);i++)sim.tick(.05);};
 const walk=(x,z)=>{ok(sim.moveTo(x,z),'walk to '+x+','+z);for(let i=0;sim.playerPath.length&&i<6000;i++)sim.tick(.05);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.1,'arrived');};
 const harvest=id=>{const n=S.NODES.find(n=>n.id===id),p=sim.state.player;let q=null;for(let i=0;i<16&&!q;i++){const c={x:n.x+Math.sin(i*Math.PI/8)*1.55,z:n.z+Math.cos(i*Math.PI/8)*1.55};if(C.pathfind(p,c,sim.navRoom))q=c;}assert.ok(q,'reach '+id);walk(q.x,q.z);while(sim.state.sandbox.nodes.find(m=>m.id===id).hp){sb('gather',{node:id});step(.55);}};
 walk(11,9);adv('start');harvest('timber-1');harvest('timber-2');harvest('stone-1');harvest('stone-2');walk(11,9);sb('craft',{recipe:'pick'});sb('craft',{recipe:'plank'});sb('craft',{recipe:'plank'});walk(0,-21.3);sb('bridge');walk(0,-48);adv('enter');
 const s=sim.state.adventure;assert.equal(A.level(s),1);assert.equal(s.xp,0);
 sim.state.player={x:5,z:-12,yaw:0};
 const hart=A.runtime(sim).enemies.find(e=>e.id==='hart');assert.ok(hart&&hart.hp===780&&hart.maxHP===780);
 return{sim,s,hart,step};
}
// Planning oracle for the dodge: a walkable spot the telegraph will not hit, with a margin. The game still decides the hit.
function spotOutside(sim,hart){
 const p=sim.state.player,t=hart.omen,m=.2;let best=null;
 for(let dx=-3;dx<=3.001;dx+=.2)for(let dz=-3;dz<=3.001;dz+=.2){
  const len=Math.hypot(dx,dz);if(len>3||len<.5)continue;const q={x:p.x+dx,z:p.z+dz};
  if(!A.ground(sim,q.x,q.z,.31))continue;
  const hit=!t?T.inRing({x:hart.aim.x,z:hart.aim.z},2.4+m,q):t.kind==='line'?T.inLine({...t,half:t.half+m},q):T.inRing({x:hart.x,z:hart.z},t.r2+m,q);
  if(!hit&&(!best||len<best.len))best={x:q.x,z:q.z,len};
 }
 return best;
}
test('a level-one player who stands still loses to the Hollow Hart',()=>{
 const{s,step}=atHart();assert.equal(s.hp,100);
 const hits=[];let last=s.hp;
 for(let i=0;i<800&&s.hp>0;i++){step(.05);if(s.hp<last)hits.push([+s.elapsed.toFixed(2),last-s.hp]);last=s.hp;}
 assert.equal(s.hp,0,'health reaches zero');assert.equal(s.deaths,1);assert.ok(!s.defeated.includes('hart'),'the hart still stands');
 assert.ok(hits.length>=4,JSON.stringify(hits));
});
test('stepping out of each telegraph avoids its hit: ring, line slam, then double ring',()=>{
 const{sim,s,hart,step}=atHart();const start=s.hp;const dodged=[];let pending=null;
 // Labelled isolation: the sentinel and prowler aggro across this chamber and hit on their own windups along the dodge
 // path (debug replay: 12, 12, 10). Only the hart's telegraphs are under test here; the stand-still test keeps them.
 const rt=A.runtime(sim);rt.enemies=rt.enemies.filter(e=>e.id==='hart');
 for(let i=0;i<1600&&dodged.length<3&&s.hp>0;i++){
  if(!pending&&hart.mode==='windup'){
   const q=spotOutside(sim,hart);assert.ok(q,'a reachable spot outside the telegraph');
   assert.equal(sim.moveTo(q.x,q.z).ok,true);pending={kind:hart.omen?hart.omen.kind:'ring',hp:s.hp};
  }
  step(.05);
  if(pending&&hart.mode!=='windup'){assert.equal(s.hp,pending.hp,pending.kind+' landed on the player');dodged.push(pending.kind);pending=null;}
 }
 assert.deepEqual(dodged,['ring','line','double']);assert.equal(s.hp,start);assert.ok(hart.hp>0,'the hart still stands');
});
