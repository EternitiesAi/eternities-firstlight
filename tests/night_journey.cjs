/* The night the warning failed, as commands. Starts from the crossing journey's earned chapter-IV save: a visit to the
 * crossing starts the night, Briar runs to the device, the travellers are called out in three groups with a reload
 * between the first and second, Briar bites the device when the way is clear, and the envoy speaks at the spring.
 * Accepted commands and timed walking only. Road claimants are fought with the ordinary attack commands. This is an
 * automated tactical check, not a pacing or fun study. */
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),T=require('../src/combat.js'),X=require('../src/crossing.js'),N=require('../src/night.js'),SG=require('../src/saga.js');
function journey(options={}){
 const out=options.out||fs.mkdtempSync(path.join(os.tmpdir(),'night-journey-'));
 // a live save (the bot's crossing world) starts the night; without one the crossing is replayed, as the fixture mode always did.
 let start;
 if(options.source)start=typeof options.source==='string'?JSON.parse(fs.readFileSync(options.source,'utf8')):options.source;
 else{const chapter=fs.mkdtempSync(path.join(os.tmpdir(),'night-chapter-'));require('./crossing_journey.cjs').journey({out:chapter});start=JSON.parse(fs.readFileSync(path.join(chapter,'CHAPTER_IV_COMPLETE_EARNED.json'),'utf8'));}
 let sim=new C.Simulation(C.validate(start));
 let seq=0,commands=0,reloads=0;const log=[];
 const cmd=(type,p={})=>{const r=sim.adventureCommand('night-j-'+(++seq),type,p);assert.ok(r.ok,type+': '+r.error);commands++;log.push({type,p});return r;};
 const refused=(type,p={})=>{const r=sim.adventureCommand('night-j-'+(++seq),type,p);commands++;assert.equal(r.ok,false,type+' should be refused');log.push({type,p,refused:r.error});return r.error;};
 const tryHeal=()=>{const r=sim.adventureCommand('night-j-'+(++seq),'heal',{});commands++;return r.ok;};
 const step=t=>{for(let i=0;i<Math.round(t/.05);i++)sim.tick(.05);};
 const near=(q,p)=>Math.hypot(q.x-p.x,q.z-p.z);
 const living=()=>A.runtime(sim).enemies.filter(e=>e.nightClaim&&e.hp>0);
 function walk(x,z){const r=sim.moveTo(x,z);assert.ok(r.ok,'path '+x+','+z+' '+r.error);for(let i=0;i<8000&&sim.playerPath.length;i++)step(.05);assert.ok(near({x,z},sim.state.player)<1.3,'arrived near '+x+','+z);log.push({walk:[x,z]});}
 function spot(e){const p=sim.state.player;for(let k=0;k<12;k++){const a=Math.atan2(p.z-e.z,p.x-e.x)+(k%2?1:-1)*Math.ceil(k/2)*.5,q={x:e.x+Math.cos(a)*1.8,z:e.z+Math.sin(a)*1.8};if(X.walkable(q.x,q.z)&&C.pathfind(p,q,sim.navRoom))return q;}return null;}
 function slay(e){
  cmd('target-select',{id:e.id});if(!T.runtime(sim).auto)cmd('auto-toggle');
  for(let i=0;i<3000&&e.hp>0;i++){
   const a=sim.state.adventure;
   if(a.hp<A.stats(a).maxHP*.5&&a.tonics>0&&a.elapsed>=A.runtime(sim).cooldowns.heal)tryHeal();
   if(near(e,sim.state.player)>2.4&&!sim.playerPath.length){const q=spot(e);if(q)sim.moveTo(q.x,q.z);}
   step(.1);
  }
  assert.ok(e.hp<=0,'slain '+e.id);sim.playerPath=[];
 }
 function clearNear(q,radius){for(let k=0;k<30;k++){const c=living().filter(e=>near(e,q)<radius).sort((a,b)=>near(a,q)-near(b,q));if(!c.length)return;slay(c[0]);}}
 function waitUntil(test,label,seconds=120){for(let i=0;i<seconds*10&&!test();i++)step(.1);assert.ok(test(),label);}
 const safe=()=>sim.state.night.safe;

 // The earned save is not yet a night. Walk to the commons waystone and travel to the crossing: that visit starts it.
 assert.equal(sim.state.night.started,false);assert.equal(sim.state.saga.briar.state,'with');assert.equal(sim.state.adventure.companion.bonded,true);
 walk(0,3);cmd('waystone-travel',{id:'bellweather'});step(.5);
 assert.equal(N.stage(sim.state),'lit');assert.equal(living().length,N.CLAIMS.length);
 waitUntil(()=>sim.state.night.device==='found','Briar found the severing device on the bridge');

 // The near bank, the bridge, then the far bank where the first group waits.
 walk(11.4,20.6);clearNear(sim.state.player,9);
 walk(15.2,18.0);clearNear(sim.state.player,6);
 walk(18.6,21.4);clearNear(sim.state.player,9);
 cmd('night-call',{group:'a'});
 walk(6.5,21.5);
 waitUntil(()=>safe().length===2,'Tessa and Hob are across the bridge');

 // Reload in the middle of the night. The safe travellers and the device survive; the road and Briar's run do not need a save.
 const snap=JSON.parse(JSON.stringify(sim.snapshot()));sim=new C.Simulation(C.validate(snap));reloads++;
 assert.deepEqual(sim.state.night.safe,['tessa','hob']);assert.equal(sim.state.night.device,'found');assert.equal(sim.state.night.started,true);
 walk(0,3);cmd('waystone-travel',{id:'bellweather'});step(.5);
 assert.equal(N.stage(sim.state),'lit');

 // Second group, reached across the same bank. The road claimants respawned with the reload and are cleared again.
 walk(11.4,20.6);clearNear(sim.state.player,9);
 walk(15.2,18.0);clearNear(sim.state.player,6);
 walk(18.6,21.4);clearNear(sim.state.player,9);
 cmd('night-call',{group:'b'});
 walk(6.5,21.5);
 waitUntil(()=>safe().length===4,'Marl and Ennis are across the bridge');

 // The last traveller. The route is clear now.
 walk(18.6,21.4);cmd('night-call',{group:'c'});
 walk(6.5,21.5);
 waitUntil(()=>safe().length===5,'Pip is across the bridge');
 assert.equal(sim.state.saga.beats.night,undefined,'the device is not broken until the way is clear');

 // The device: the claimants that guard it are already down, so Briar bites when the player reaches it.
 assert.equal(living().length,0,'claimants around the device are cleared before the bite');
 sim.moveTo(16.4,18.0);
 waitUntil(()=>sim.state.night.device==='broken','Briar bit through the severing device',20);
 assert.equal(sim.state.saga.briar.state,'taken');assert.equal(SG.done(sim.state,'night'),true);assert.equal(N.stage(sim.state),'quiet');
 refused('insight',{});
 step(.5);assert.equal(A.runtime(sim).companion.room,'away');

 // The quiet: a soft line after walking off the bridge; the envoy comes to the spring and speaks once.
 step(3);walk(4,18);assert.equal(N.objective(sim).title,'Go home.');
 walk(0,17);cmd('waystone-travel',{id:'commons'});
 walk(1.5,6);step(3.4);assert.equal(N.envoyPos(sim).arrived,true);
 walk(-1.6,4.2);const talk=cmd('night-envoy',{});assert.equal(talk.lines.length,4);assert.equal(N.stage(sim.state),'over');

 // The final record survives a round trip through the validators.
 const final=JSON.parse(JSON.stringify(sim.snapshot()));C.validate(final);
 assert.equal(final.saga.briar.state,'taken');assert.ok(final.saga.beats.night);assert.equal(final.night.envoy,true);
 const report={status:'passed',edition:'10.0.0',automated:true,commands,reloads,briar:final.saga.briar.state,nightDay:final.saga.beats.night.day,
  safe:final.night.safe,device:final.night.device,actions:log.length};
 fs.writeFileSync(path.join(out,'NIGHT_JOURNEY.json'),JSON.stringify(report,null,2));
 // the live save after the night, for the next stage to start from.
 fs.writeFileSync(path.join(out,'NIGHT_COMPLETE.json'),JSON.stringify(final,null,2));
 return report;
}
if(require.main===module){const r=journey({});console.log(JSON.stringify(r,null,2));}
module.exports={journey};
