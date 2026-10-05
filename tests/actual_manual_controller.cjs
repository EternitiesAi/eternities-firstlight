/* Synthetic recorded-pose/HP boundary for actual installed Core/manual/AI.
 * No earned/native capture claim; unchanged owners, roster and geometry execute. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),readline=require('node:readline'),assert=require('node:assert/strict');
const root=process.argv[2],C=require(path.join(root,'src/core.js')),H=require(path.join(root,'src/earth-homecoming.js')),A=require(path.join(root,'src/adventure.js')),W=require(path.join(root,'src/world-foundations.js'));
const raw=C.validate(JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json'),'utf8')));
const sim=new C.Simulation(raw),ctx={sim,active:'synthetic-capture-controller-unit'},D=H.definition;
const save=s=>{C.validate(s);return{ok:true};};sim.earthHomecomingSave=save;
function physical(p){sim.room=p.room;sim.returnPos={x:11,z:9,yaw:0};sim.state.player={x:p.x,z:p.z,yaw:0};sim.playerPath=[];}
function command(type,p={}){const result=H.command(ctx,type,{quest:D.id,expectedActive:ctx.active,expectedRevision:sim.state.adventure.revision,...p},{save});assert.ok(result.ok,result.error);}
physical(D.giver);command('accept');
for(const id of ['bridge-record','register-record','inspect-claim','west-relay-isolated','east-relay-isolated','challenge-regent']){physical(D.steps.find(s=>s.id===id));command('step',{step:id});}
A.syncScene(sim);const e=A.runtime(sim).enemies.find(e=>e.id===D.enemy.id);assert.ok(H.owned(sim,e));
// Explicit unit HP/pose/companion boundaries reconstruct the retained failed
// response. They are never used by the ordinary-time capture controller.
e.hp=24;sim.state.adventure.companion.mode='stay';
sim.state.player={x:1.0499835647073648,z:-33.65656595597995,yaw:2.3307963267948963};
assert.ok(W.walkable(D.room,sim.state.player.x,sim.state.player.z,.31));sim.tick(1/60);
assert.equal(e.mode,'windup');assert.equal(e.strike.pattern,'closing-ring');assert.ok(Object.isFrozen(e.strike));
const locked=e.strike,app=fs.readFileSync(path.join(root,'src/app.js'),'utf8'),frame=app.slice(app.indexOf('function frame(now)'));
const start=frame.indexOf('let dx='),end=frame.indexOf(';if(sim.worldDive',start);assert.ok(start>=0&&end>start);
const manual=new vm.Script(frame.slice(start,end)+';'+frame.match(/sim\.manual\([^;]+\);/)[0]);
function advance(ms,keys=[],yaw=.76){let left=ms/1000;while(left>1e-10){const dt=Math.min(1/60,left);if(keys.length)manual.runInNewContext({sim,dt,keys:new Set(keys),camera:{yaw},Math});sim.tick(dt);left-=dt;}assert.equal(e.strike,locked,'steering never rewrites the locked ring');assert.ok(C.walkable(sim.state.player.x,sim.state.player.z,sim.navRoom,.31));}
function state(yaw=.76){return{adventure:{player:{...sim.state.player},enemies:[{id:e.id,x:e.x,z:e.z,hp:e.hp,mode:e.mode,timer:e.timer,strike:e.strike,contactAt:e.contactAt,contactHit:e.contactHit}],tactics:A.runtime(sim).tactics},camera:{yaw}};}
readline.createInterface({input:process.stdin}).on('line',line=>{try{const input=JSON.parse(line);if(input.action==='hold')advance(input.ms,input.keys,input.yaw);if(input.action==='wait')advance(input.ms);
// Probe just outside the mathematical inner contact edge: adding exactly
// 1.26 to -35 rounds its recovered distance just below 1.26 in binary64.
const result=input.action==='boundaries'?{innerRadius:locked.innerRadius,outerRadius:locked.outerRadius,inside:H.strikeContains(e,{x:1,z:-35+1.259}),edge:H.strikeContains(e,{x:1,z:-35+1.260001}),danger:H.strikeContains(e,{x:1,z:-35+1.3443635622006873}),owned:H.owned(sim,e)}:state(input.yaw);
console.log(JSON.stringify(result));}catch(error){console.log(JSON.stringify({error:error.stack}));process.exitCode=1;}});
