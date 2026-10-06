/* Actual initial kit/crafted bow, movement, local survey and return via Earth roads.
 * Accelerated simulation and memory storage are not native persistence or human timing. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),H=require('../src/earth.js'),W=require('../src/world-foundations.js'),R=require('../src/earth-road.js'),AR=require('../src/arsenal.js');
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs');
const copy=o=>JSON.parse(JSON.stringify(o));
function journey(variant,output){
 const h=createHarness(),events=[],checkpoints=[];earnedKit(h,variant==='bow');const initial=h.sim.snapshot();
 const snapshot=name=>{const state=h.sim.snapshot();checkpoints.push({name,room:h.sim.room||'valley',home:copy(h.sim.returnPos),xp:state.adventure.xp,claims:state.journeys.realms.earthlands.lastClaim});if(output){const dir=path.join(output,variant);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(state,null,2)+'\n');}return state;};
 function walk(x,z){const sim=h.sim;if(sim.room!==H.ROOM)return h.walk(x,z);assert.ok(sim.moveTo(x,z).ok);let frames=0;while(sim.playerPath.length&&frames++<18000){const before={...sim.state.player};h.tick(.05);assert.ok(H.segment(before,sim.state.player),'each real Hearthwater walking segment is supported and clear');}assert.ok(frames<18000&&Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.25);h.routes.push({room:sim.room,x,z,frames});}
 function cross(){const before=h.sim.snapshot(),ctx=h.context(),p=R.preview(ctx);assert.ok(p.ok,p.error);assert.ok(R.enter(p.ticket,ctx,{save:h.save,build:()=>{}}).ok);assert.deepEqual(h.sim.snapshot(),before,'walking continuation changes no durable state');events.push({connection:R.ID,room:h.sim.room,home:copy(h.sim.returnPos)});}
 h.walk(H.GATE.x,H.GATE.z);const ctx=h.context(),p=H.preview(ctx);assert.ok(p.ok);assert.ok(H.enter(p.ticket,ctx,{save:h.save,build:()=>{}}).ok);const home=copy(h.sim.returnPos);
 walk(0,10);walk(14,-12);walk(12,-26);walk(0,-35);walk(7,-38);walk(12,-42);walk(18.3,-42);snapshot('HEARTHWATER_GATE');cross();snapshot('COASTWARD_ARRIVAL');
 for(const[x,z]of[[0,104],[0,92],[0,16],[14,15],[14,-34],[4,-41],[4,-67],[-6,-68]])walk(x,z);
 const before=h.sim.snapshot(),record=before.journeys.realms.earthlands;assert.equal(record.active,null);const accept=W.command(h.context(),'accept',{realm:'earthlands'},{save:h.save});assert.ok(accept.ok,accept.error);const run=h.sim.state.journeys.realms.earthlands.active.run;
 for(const[id,x,z]of[['first',-15,-46],['second',13,-54],['third',8,-69]]){walk(x,z);const r=W.command(h.context(),'observe',{realm:'earthlands',run,objective:id},{save:h.save});assert.ok(r.ok,r.error);}
 snapshot('COMPLETED_UNPAID');walk(-6,-68);const paid=W.command(h.context(),'claim',{realm:'earthlands',run},{save:h.save});assert.ok(paid.ok,paid.error);assert.deepEqual(paid.reward,{xp:28,coins:12,ore:2});const paidState=snapshot('PAID_ONCE');
 assert.equal(W.command(h.context(),'claim',{realm:'earthlands',run},{save:h.save}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paidState,'changed request path cannot replay the payout');
 for(const[x,z]of[[4,-67],[4,-41],[14,-34],[14,15],[0,16],[0,92],[0,104],[8,106]])walk(x,z);cross();snapshot('HEARTHWATER_RETURN');assert.equal(h.sim.worldTrip,undefined);
 for(const[x,z]of[[12,-42],[7,-38],[0,-35],[-10,-30],[-12,-23],[-14,-12],[-8,3],[0,10],[0,24]])walk(x,z);
 assert.ok(H.leave(h.sim).ok);assert.deepEqual(h.sim.state.player,home);const final=snapshot('FINAL_WORLD');const loaded=new C.Simulation(final);assert.deepEqual(loaded.snapshot(),final);assert.equal(loaded.room,null);
 assert.equal(AR.weapon(final.adventure).style,variant==='bow'?'bow':'blade');assert.deepEqual(final.adventure.equipment,initial.adventure.equipment);assert.deepEqual(final.adventure.arsenal.sockets,initial.adventure.arsenal.sockets);assert.deepEqual(final.adventure.starter,initial.adventure.starter);assert.deepEqual(final.adventure.pursuit,initial.adventure.pursuit);
 const sources=['earth-road.js','earth.js','world-atlantis-earth.js','core.js','world-foundations.js'];const hashes=Object.fromEntries(sources.map(n=>[n,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../src',n))).digest('hex')]));
 return{variant,method:'command-earned kit and bow; production pathfinding/ticks; explicit one-time survey; memory persistence',sourceHashes:hashes,events,checkpoints,routes:h.routes,adventureEvents:h.events,home,finalWeapon:final.adventure.equipment.weapon,completed:true};
}
if(require.main===module){const index=process.argv.indexOf('--output'),output=index>=0?path.resolve(process.argv[index+1]):null;if(output&&fs.existsSync(output))throw Error('Use a fresh bounded journey directory; retain earlier evidence.');const results=['blade','bow'].map(v=>journey(v,output));if(output)fs.writeFileSync(path.join(output,'REPORT.json'),JSON.stringify({method:'accelerated command-earned journey, not native browser or human pacing',results},null,2)+'\n');console.log(JSON.stringify({completed:results.length,variants:results.map(r=>r.variant),crossings:results.reduce((n,r)=>n+r.events.length,0),routes:results.reduce((n,r)=>n+r.routes.length,0),output}));}
module.exports={journey};
