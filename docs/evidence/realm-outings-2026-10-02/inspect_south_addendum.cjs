/* Read-only integration/record audit. Does not run a journey or test suite. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT='D:/07-GAMES/Firstlight/authoring/bridge-moment',BASE='D:/07-GAMES/Firstlight/artifacts/realm-outings-2026-10-02',OUT=__dirname;
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceFiles=['tests/realm_trails_south_journey.cjs','tests/realm_trails_journey.cjs','tools/verify.py','.github/workflows/verify.yml','src/realm-trails-ui.js','src/realm-trails.js','src/world-foundations.js','src/core.js','src/adventure.js','src/realm-trails-south.js','src/realm-trails-art.js','tests/realm_trails.test.cjs','tests/realm_trails_browser.py','index.html'];
const hashes=()=>Object.fromEntries(sourceFiles.map(file=>[file,sha(path.join(ROOT,file))]));
const result={startedUtc:new Date().toISOString(),method:'Read-only source and retained-record audit plus pure helper/page probes. No journey, suite, browser, GPU or build rerun.',sourceHashesBefore:hashes(),checks:[],reports:[],fixtureInventory:[]};
const C=require(ROOT+'/src/core.js'),R=require(ROOT+'/src/realm-trails.js'),W=require(ROOT+'/src/world-foundations.js');require(ROOT+'/src/realm-trails-ui.js');
const verify=fs.readFileSync(path.join(ROOT,'tools/verify.py'),'utf8'),workflow=fs.readFileSync(path.join(ROOT,'.github/workflows/verify.yml'),'utf8');
const literalRuns=[...verify.matchAll(/^\s*run\('([^']+)',\s*\[([^\n]+)\]/gm)].map(m=>({name:m[1],command:m[2]}));
const journeys=literalRuns.filter(r=>r.command.startsWith("'node', 'tests/"));
const browserList=verify.match(/for suite in \[([^\]]+)\]/)[1].match(/'([^']+)'/g).map(s=>s.slice(1,-1));
const matrixList=workflow.match(/suite: \[([^\]]+)\]/)[1].split(',').map(s=>s.trim());assert.deepEqual(browserList,matrixList);assert.equal(new Set(browserList).size,browserList.length);
const southRegistrations=journeys.filter(r=>r.command.includes('realm_trails_south_journey.cjs'));assert.equal(southRegistrations.length,2);assert.equal(southRegistrations.filter(r=>r.command.includes('--bow')).length,1);
const syntaxModules=fs.readdirSync(path.join(ROOT,'src')).filter(f=>f.endsWith('.js')).length;
const ruleFiles=fs.readdirSync(path.join(ROOT,'tests')).filter(f=>f.endsWith('.test.cjs')).length;
result.registration={syntaxModules,ruleFiles,commandJourneys:journeys.length,browserSuites:browserList.length,configuredHostedJobs:browserList.length+2,expectedSourceLogs:syntaxModules+3+journeys.length,expectedFullLogs:syntaxModules+3+journeys.length+browserList.length,southRegistrations,browserList};
result.checks.push('Both southern variants registered exactly once; local and CI browser lists agree without duplicate suites. Counts are configured inventory, not fresh pass claims.');

for(const folder of['south-earned-journeys','south-earned-journeys-pinned'])for(const variant of['fresh-blade','fresh-bow']){
 const dir=path.join(BASE,folder,variant),file=path.join(dir,'SOUTH_TRAILS_JOURNEY_REPORT.json'),r=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(r.status,'passed');assert.equal(r.variant,variant);assert.equal(r.walkedLegs,r.routes.length);assert.equal(r.claims.length,2);assert.equal(r.swims.length,12);
 const expectedSaves=r.events.filter(e=>e.owner==='travel'&&e.enter).length+r.events.filter(e=>e.owner==='trail'&&!e.result.duplicate).length+r.events.filter(e=>e.owner==='reload').length+r.events.filter(e=>e.owner==='travel'&&e.freeHome).length;
 assert.equal(r.saveCount,expectedSaves);assert.equal(r.humanPacing,false);assert.equal(r.browserPersistence,false);
 const identities=r.sourceSha256?Object.entries(r.sourceSha256).map(([source,hash])=>({source,sha256:hash,matchesCurrent:sha(path.join(ROOT,source))===hash})):[];
 if(folder.endsWith('-pinned')){assert.equal(identities.length,27);assert.ok(identities.every(v=>v.matchesCurrent));assert.equal(r.htmlSha256,sha(path.join(ROOT,'index.html')));assert.equal(r.harnessSha256,sha(path.join(ROOT,'tests/realm_trails_south_journey.cjs')));}
 const tally={};for(const e of r.events)tally[e.owner]=(tally[e.owner]||0)+1;
 result.reports.push({folder,variant,path:file,sha256:sha(file),runnerSha256:r.harnessSha256,htmlSha256:r.htmlSha256||null,sourceFileCount:identities.length,sourceIdentities:identities,walkedLegs:r.routes.length,events:r.events.length,eventOwners:tally,saveCountReported:r.saveCount,saveCountDerivedFromEvents:expectedSaves,swimTargets:r.swims.length,swimCalls:r.swims.reduce((n,v)=>n+v.frames,0),swimBodies:r.swims.map(v=>v.body),claims:r.claims});
 const snapshotFiles=fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='SOUTH_TRAILS_JOURNEY_REPORT.json');assert.equal(snapshotFiles.length,10);
 for(const name of snapshotFiles){const full=path.join(dir,name),raw=JSON.parse(fs.readFileSync(full,'utf8'));assert.doesNotThrow(()=>C.validate(raw));result.fixtureInventory.push({folder,variant,file:name,sha256:sha(full)});}
 for(const realm of['earthlands','atlantis']){
  const ready=JSON.parse(fs.readFileSync(path.join(dir,realm+'_04_READY_UNPAID.json'),'utf8')),paid=JSON.parse(fs.readFileSync(path.join(dir,realm+'_05_PAID.json'),'utf8')),d=R.definitions().find(d=>d.realm===realm);
  assert.equal(ready.realmTrails.records[d.id].accepted,true);assert.equal(ready.realmTrails.records[d.id].claimed,false);assert.ok(R.required(d).every(id=>ready.realmTrails.records[d.id].steps.includes(id)));assert.equal(paid.realmTrails.records[d.id].claimed,true);
  for(const key of['xp','coins','ore'])assert.equal(paid.adventure[key]-ready.adventure[key],d.reward[key]);for(const[key,n]of Object.entries(d.reward.materials||{}))assert.equal(paid.sandbox.inventory[key]-ready.sandbox.inventory[key],n);
 }
}
result.checks.push('Four retained reports have consistent route, event-derived save, swim and claim records; 40 snapshots validate and ready-to-paid deltas match declared rewards. Pinned 27-source identities and HTML match the inspected checkout.');

let approaches=0;const approachResults=[];
for(const d of R.definitions()){
 const sim=new C.Simulation();sim.room=W.definition(d.realm).room;
 for(const p of[d.giver,...d.steps.filter(s=>s.medium==='dry'&&s.kind==='interact')]){
  const before=JSON.stringify(sim.state),room=sim.room,pathRef=sim.playerPath,q=global.RealmTrailsUI.approach(sim,p);
  assert.equal(JSON.stringify(sim.state),before);assert.equal(sim.room,room);assert.strictEqual(sim.playerPath,pathRef);assert.ok([q.x,q.z].every(Number.isFinite));assert.ok(W.walkable(sim.room,q.x,q.z));assert.ok(W.segment(sim.room,q,p));assert.ok(Math.hypot(q.x-p.x,q.z-p.z)<=1.7000000001);
  approachResults.push({realm:d.realm,id:p.id,point:{x:p.x,z:p.z},approach:q});approaches++;
 }
}
result.approach={fixture:'Synthetic room assignment; actual pure approach, ground and segment functions.',calls:approaches,unchangedState:true,unchangedPathIdentity:true,approachResults};
result.checks.push('Every current dry interaction/giver approach remains supported, radius-near and state/path inert. The action deliberately calls walking afterward; the helper itself never saves, pays or teleports.');

const raw=JSON.parse(fs.readFileSync(path.join(BASE,'south-earned-journeys-pinned/fresh-blade/atlantis_01_ACCEPTED.json'),'utf8')),sim=new C.Simulation(raw),host={sim,dialog:{addEventListener(){}},worlds:{local(){return false;}}},ui=new global.RealmTrailsUI.TrailsUI(host),pages=[];
for(const room of[null,'world-earthlands','cosmos-near-expanse']){
 sim.room=room;const before=JSON.stringify(sim.state),html=ui.page('atlantis');assert.ok(html.includes('ACCEPTED REALM TRAIL'));assert.equal(/data-rpg="trail-(accept|step|claim)"/.test(html),false);assert.equal(JSON.stringify(sim.state),before);pages.push({room,htmlBytes:Buffer.byteLength(html),grantControls:0});
}
result.offRealmPages={fixture:'Actual retained accepted world with synthetic current-room assignment and minimal UI host; no rendering.',pages};result.checks.push('The inspected-realm depth fix remains present and accepted off-realm pages do not throw or expose grant controls in the bounded host.');
result.sourceHashesAfter=hashes();result.sourceChangedDuringAudit=sourceFiles.filter(file=>result.sourceHashesBefore[file]!==result.sourceHashesAfter[file]);assert.deepEqual(result.sourceChangedDuringAudit,[]);
result.finishedUtc=new Date().toISOString();fs.writeFileSync(path.join(OUT,'ADDENDUM_SOUTH.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({registration:result.registration,reports:result.reports.map(r=>({folder:r.folder,variant:r.variant,walkedLegs:r.walkedLegs,events:r.events,saves:r.saveCountDerivedFromEvents,swimTargets:r.swimTargets,swimCalls:r.swimCalls,sourceFileCount:r.sourceFileCount,htmlSha256:r.htmlSha256})),approachCalls:approaches,offRealmPages:pages,sourceChangedDuringAudit:result.sourceChangedDuringAudit},null,2));
