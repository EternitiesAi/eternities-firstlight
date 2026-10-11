'use strict';
// Additional strict-own CPU metadata negatives. Reuse the exact sealed fixture
// functions, real modules and unmodified selected hooks; no production facade.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=process.env.FIRSTLIGHT_ROOT||path.resolve(__dirname,'..'),visual=process.env.ROADKEEPER_STAGE||ROOT,hookFile=process.env.ROAD_ACCOUNT_PARENT_HOOKS;
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js')),EE=require(path.join(ROOT,'src/earth-expedition.js')),
 CD=require(path.join(ROOT,'src/earth-consignment-data.js')),D=require(path.join(ROOT,'src/earth-wild-signs-data.js')),CH=require(path.join(ROOT,'src/characters.js')),
 E=require(path.join(ROOT,'src/engine.js')),O=require(path.join(visual,'src/earth-roadkeeper-motion.js')),Art=require(path.join(visual,'src/earth-roadkeeper-art.js'));
const source=fs.readFileSync(path.join(__dirname,'earth-roadkeeper-app.test.cjs'),'utf8'),a=source.indexOf('function raw(resolution)'),b=source.indexOf("for(const resolution of ['signed-loop','cleared-pocket'])");
assert.ok(a>0&&b>a);const helpers=source.slice(a,b),copy=o=>JSON.parse(JSON.stringify(o));
const app=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8'),start='// BEGIN EARTH ROADKEEPER APP HOOKS',end='// END EARTH ROADKEEPER APP HOOKS';
const hooks=hookFile?fs.readFileSync(hookFile,'utf8'):app.slice(app.indexOf(start)+start.length,app.indexOf(end));
const {walking,simBytes}=vm.compileFunction(helpers+'\nreturn{walking,simBytes};',[],{filename:__filename+':unchanged-sealed-CPU-fixtures',contextExtensions:[{assert,path,vm,C,W,EE,CD,D,CH,E,O,Art,hooks,hookFile,ROOT,copy}]})();
const cases={
 inheritedAccount:f=>{const account=f.sim.state.earthWildSigns,proto=Object.create(Object.getPrototypeOf(f.sim.state));proto.earthWildSigns=account;delete f.sim.state.earthWildSigns;Object.setPrototypeOf(f.sim.state,proto);},
 inheritedThreatRoom:f=>{const rt=f.sim.adventureRuntime,proto=Object.create(Object.getPrototypeOf(rt));proto.room=rt.room;delete rt.room;Object.setPrototypeOf(rt,proto);},
 inheritedThreatIndex:f=>{const list=f.sim.adventureRuntime.enemies,proto=Object.create(Object.getPrototypeOf(list));proto[0]=list[0];delete list[0];Object.setPrototypeOf(list,proto);},
 arrayThreatLookalike:f=>{f.sim.adventureRuntime.enemies[0]=Object.assign([],f.sim.adventureRuntime.enemies[0]);},
 missingStartedKit:f=>{f.sim.state.adventure.started=false;}
};
for(const[name,alter]of Object.entries(cases))test('strict-own metadata negative: '+name,()=>{
 const f=walking(),old=f.view();alter(f);const before=simBytes(f.sim),diagnostic=f.api.roadkeeperDiagnostics(),projection=O.isProjection(old,f.sim.roadkeeperPresentationContext),out={box:[],round:[],octa:[]};
 const drawn=Art.draw(out,old,f.sim.roadkeeperPresentationContext);
 console.log(JSON.stringify({probe:name,diagnosticReturned:!!diagnostic,realMotionProjectionAccepted:projection,realArtParts:drawn}));
 assert.equal(simBytes(f.sim),before);assert.equal(projection,false);assert.equal(drawn,0);
 assert.equal(diagnostic,null,'getter must withdraw a pose that real Motion/Art refuse');
});
test('current Core elapsed invalidates cache without running Motion or renewing the lease',()=>{
 const f=walking(),lease=f.sim.roadkeeperOwnerLease,old=f.view();f.sim.tick(.1);const before=simBytes(f.sim);
 assert.equal(f.api.roadkeeperDiagnostics(),null);assert.equal(simBytes(f.sim),before);assert.equal(f.sim.roadkeeperOwnerLease,lease);
 assert.ok(O.isProjection(old,f.sim.roadkeeperPresentationContext));
});
