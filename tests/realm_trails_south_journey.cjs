/* Real Coastward and Bellglass rules: no placements, supplies or histories are
 * injected. Production movement/swimming is accelerated; persistence is an
 * explicit in-memory candidate holder, not human or native-browser evidence. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createHarness,earnedKit}=require('./realm_trails_journey.cjs'),W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js');
const ROOT=path.resolve(__dirname,'..'),copy=structuredClone;
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function sourceEpoch(){const files=Object.keys(require.cache).filter(file=>file.startsWith(ROOT+path.sep)).sort();return{htmlSha256:sha(path.join(ROOT,'index.html')),sourceSha256:Object.fromEntries(files.map(file=>[path.relative(ROOT,file).split(path.sep).join('/'),sha(file)]))};}
const earthRoute=[[-7,97],[0,97],[0,92],[0,16],[-10,15],[-10,-12],[-25,-12],[-25,-11],[-25,-12],[-10,-12],[-10,-34],[1,-35],[14,-34],[14,-19],[28,-19],[28,-16],[30,-25],[28,-19],[14,-19],[14,15],[0,16],[0,92],[0,97],[-3,97],[-7,97]];
const galleryRoute=[[8,-.5,-19.5],[8,-1.05,-22],[8,-2.55,-28],[8,-2.7,-29.5],[8,-2.7,-32],[8,-2.7,-35],[8,-2.7,-32],[8,-2.7,-29.5],[8,-1.8,-29],[12,-1.8,-29],[12,-1.4,-38.4],[12,-1.4,-39.3]];
function journey({bow=false,output=null}={}){
 const h=createHarness(),variant=bow?'fresh-bow':'fresh-blade',claims=[],swims=[];earnedKit(h,bow);const original=h.sim.snapshot();
 const snap=name=>{if(output){fs.mkdirSync(path.join(output,variant),{recursive:true});fs.writeFileSync(path.join(output,variant,name+'.json'),JSON.stringify(h.sim.snapshot(),null,2)+'\n');}};
 function accept(d){h.enter(d.realm);h.walk(d.giver.x,d.giver.z);h.trail('accept',d);snap(d.realm+'_01_ACCEPTED');h.reload(d.realm);}
 function claim(d){h.walk(d.giver.x,d.giver.z);snap(d.realm+'_04_READY_UNPAID');h.reload(d.realm);h.walk(d.giver.x,d.giver.z);const before=h.sim.snapshot();h.trail('claim',d);for(const k of ['xp','coins','ore'])assert.equal(h.sim.state.adventure[k]-before.adventure[k],d.reward[k]);for(const[k,n]of Object.entries(d.reward.materials||{}))assert.equal(h.sim.state.sandbox.inventory[k]-before.sandbox.inventory[k],n);const paid=h.sim.snapshot();assert.equal(h.trail('claim',d,{request:'other'}).duplicate,true);assert.deepEqual(h.sim.snapshot(),paid);claims.push({quest:d.id,reward:copy(d.reward)});snap(d.realm+'_05_PAID');h.home();h.walk(18,6);}
 let d=R.definitions().find(d=>d.realm==='earthlands');accept(d);
 for(const[x,z]of earthRoute){h.walk(x,z);const r=h.sim.state.realmTrails.records[d.id],s=d.steps.find(s=>s.x===x&&s.z===z&&!r.steps.includes(s.id));if(s)h.trail('step',d,{step:s.id});}
 assert.deepEqual(h.sim.state.sandbox.inventory,original.sandbox.inventory,'prepared job bundles do not steal normal materials');claim(d);
 d=R.definitions().find(d=>d.realm==='atlantis');accept(d);const landing=W.definition('atlantis').points.find(p=>p.id==='tide-steps');h.walk(landing.x,landing.z);assert.ok(W.diveEnter(h.sim).ok);
 for(const target of galleryRoute){let frames=0;for(;frames<2000;frames++){
  const p=h.sim.state.player,v=W.divingStatus(h.sim),dx=target[0]-p.x,dz=target[2]-p.z,dy=target[1]-v.y;if(Math.hypot(dx,dz)<.015&&Math.abs(dy)<.015)break;
  const horizontal=Math.hypot(dx,dz),dt=horizontal>.005?Math.min(.05,horizontal/2.6):Math.min(.05,Math.abs(dy)/2.6),step=dt*2.6;
  W.swim(h.sim,horizontal>.005?dx:0,horizontal>.005?dz:0,step?dy/step:0,dt);assert.ok(W.swimClear(W.definition('atlantis').dive,h.sim.state.player.x,W.playerHeight(h.sim),h.sim.state.player.z),'actual full body stays in clear gallery/court volume');
 }assert.ok(frames<2000,'actual swim reaches '+JSON.stringify(target));swims.push({target,frames,body:W.divingStatus(h.sim).body});
 const r=h.sim.state.realmTrails.records[d.id],s=d.steps.find(s=>s.x===target[0]&&s.y===target[1]&&s.z===target[2]&&!r.steps.includes(s.id));if(s){assert.ok(R.at(h.sim,s));if(s.choices){const before=h.sim.snapshot(),bad=R.command(h.context(),'step',{quest:d.id,step:s.id,choice:'one-flat-line'},{save:h.save});assert.equal(bad.ok,false);assert.deepEqual(h.sim.snapshot(),before);assert.equal(W.divingStatus(h.sim).body,'air');}h.trail('step',d,{step:s.id,choice:s.correctChoice});snap('atlantis_'+s.id);}
 }
 assert.ok(W.diveExit(h.sim).ok);claim(d);const final=h.sim.snapshot();
 for(const k of ['owned','equipment','arsenal','starter','pursuit','classPath','road','beacon','crossing','earthStory','earthNotes','earthGathering','companion','defeated','drops','reward'])assert.deepEqual(final.adventure[k],original.adventure[k],k+' retained');
 for(const k of ['notes','score','scoreRevision','retreat','visitor','journeys'])assert.deepEqual(final[k],original[k]);
 assert.equal(final.adventure.xp-original.adventure.xp,55);assert.equal(final.adventure.coins-original.adventure.coins,22);assert.equal(final.adventure.ore-original.adventure.ore,2);
 const report={status:'passed',variant,method:'accepted production commands, actual Core paths and full-body World swimming; accelerated ticks, in-memory saver',humanPacing:false,browserPersistence:false,positionEdits:0,inventoryGrants:0,manualDamage:0,plantedDefeats:0,claims,swims,walkedLegs:h.routes.length,saveCount:h.checkpoints.length,canonicalPreservation:true,...sourceEpoch(),harnessSha256:sha(__filename),events:h.events,routes:h.routes};
 if(output)fs.writeFileSync(path.join(output,variant,'SOUTH_TRAILS_JOURNEY_REPORT.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const i=process.argv.indexOf('--output'),output=i>=0?path.resolve(process.argv[i+1]):null;if(output&&process.platform==='win32')assert.match(output,/^D:[\\/]/i);const r=journey({bow:process.argv.includes('--bow'),output});console.log(JSON.stringify({...r,events:undefined,routes:undefined,swims:undefined},null,2));}
module.exports={journey};
