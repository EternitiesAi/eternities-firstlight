'use strict';
/* CPU regression for the real extracted App/Store owner lifecycle. The retained
 * prerequisite is a historical earned fixture; giver placement below is an
 * explicitly synthetic unit condition, never a new earned/native receipt. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const ROOT=fs.realpathSync(process.env.FIRSTLIGHT_ROOT||path.resolve(__dirname,'..'));
const P=require(process.env.EARTH_HOST_COMMON||path.join(ROOT,'tools/earth-homecoming-journey/earned_common.cjs'));
const folder=fs.mkdtempSync(path.join(process.env.EARTH_HOST_TEST_OUTPUT||os.tmpdir(),'firstlight-earned-app-host-'));
const manifest=path.join(folder,'UNIT_SOURCE_EPOCH.json'),files=['src/core.js','src/app.js','src/engine.js','src/earth-grazer-motion.js','src/earth-grazer-art.js','src/earth-wild-signs-data.js','src/earth-wild-signs.js'];
fs.writeFileSync(manifest,JSON.stringify({root:ROOT,scope:'installed Earth source freeze',sourceHashes:Object.fromEntries(files.map(p=>[p,P.sha(path.join(ROOT,p))])),evidenceScope:'CPU app host regression only; no earned or native qualification'})+'\n',{flag:'wx'});
P.installedEpoch(manifest,P.sha(manifest));P.initialize();
const C=P.load('core'),H=P.load('earth-homecoming'),CS=P.load('characters'),D=P.load('earth-wild-signs-data'),W=P.load('world-foundations');
P.load('engine');const Motion=P.load('earth-grazer-motion'),Art=P.load('earth-grazer-art'),Signs=P.load('earth-wild-signs');
function fixture(){const raw=C.validate(JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json')))),memory=P.profile(raw),sim=new C.Simulation(memory.state);return{...memory,sim,app:P.productionApp(sim,memory.store)};}

test('real field rules accept the extracted App lease realm before refusing an unsupported outing',()=>{
 const f=fixture(),before=f.sim.snapshot(),bytes=f.values.get(CS.KEY);f.app.context();
 const out=Signs.command(f.app.scope.wildSignsContext(),'accept',{quest:D.ID},{save:f.app.save});
 assert.equal(out.ok,false);assert.match(out.error,/Reach dry Earthlands while able to act/);
 assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.values.get(CS.KEY),bytes);
});

test('real saved Earth entry renews App owners and invalidates the outgoing clearance callback',()=>{
 const f=fixture();Object.assign(f.sim.state.player,{x:H.definition.giver.x,z:H.definition.giver.z});
 f.app.context();const state=f.sim.state,lease=f.sim.wildSignsOwnerLease,grazerLease=f.sim.grazerOwnerLease,clearance=f.sim.recordWildSignsClearance;
 const out=f.app.command('accept',{quest:H.definition.id,expectedActive:f.store.active,expectedRevision:f.sim.state.adventure.revision});assert.ok(out.ok,out.error);
 assert.equal(f.sim.state,state);assert.equal(f.sim.state.earthHomecoming.accepted,true);
 Object.assign(f.sim.state.player,{x:W.GATE.x,z:W.GATE.z});const preview=W.preview(f.app.context(),'earthlands');assert.ok(preview.ok,preview.error);const entered=W.enter(preview.ticket,f.app.context(),{save:f.app.save,build:()=>{}});assert.ok(entered.ok,entered.error);
 const ctx=f.app.context();assert.equal(ctx.sim,f.sim);assert.notEqual(f.sim.wildSignsOwnerLease,lease);assert.notEqual(f.sim.grazerOwnerLease,grazerLease);assert.notEqual(f.sim.wildSignsOwnerLease,f.sim.grazerOwnerLease);
 const bytes=f.values.get(CS.KEY),world=f.sim.snapshot();assert.equal(clearance({}).ok,false);assert.deepEqual(f.sim.snapshot(),world);assert.equal(f.values.get(CS.KEY),bytes);
});

test('actual character switching renews leases without changing either stored world',()=>{
 const f=fixture();f.app.context();const lease=f.sim.wildSignsOwnerLease,grazerLease=f.sim.grazerOwnerLease,writer=f.app.scope.earthHomecomingWriter(),clearance=f.sim.recordWildSignsClearance;
 assert.ok(f.store.command('switch',{id:'character-1'},f.sim.snapshot(),f.store.revision).ok);const world=f.sim.snapshot(),bytes=f.values.get(CS.KEY);f.app.context();
 assert.notEqual(f.sim.wildSignsOwnerLease,lease);assert.notEqual(f.sim.grazerOwnerLease,grazerLease);assert.equal(writer(world).ok,false);assert.equal(clearance({}).ok,false);assert.deepEqual(f.sim.snapshot(),world);assert.equal(f.values.get(CS.KEY),bytes);
});

test('stable App context retains its owners and real motion/art rules refuse fabricated projections',()=>{
 const f=fixture();const before=f.sim.snapshot(),bytes=f.values.get(CS.KEY);f.app.context();const lease=f.sim.wildSignsOwnerLease,grazerLease=f.sim.grazerOwnerLease,clearance=f.sim.recordWildSignsClearance;f.app.context();
 assert.equal(f.sim.wildSignsOwnerLease,lease);assert.equal(f.sim.grazerOwnerLease,grazerLease);assert.equal(Motion.current(f.app.scope.grazerContext()),null);assert.equal(Motion.isProjection({},f.app.scope.grazerContext()),false);assert.equal(Art.isSubmission({},f.app.scope.grazerContext()),false);assert.equal(clearance({}).ok,false);assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.values.get(CS.KEY),bytes);
});
