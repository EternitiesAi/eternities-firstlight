'use strict';
// Labelled synthetic boundary fixture: actual production keyboard transform and
// collision caller; no DOM, browser, RAF, ledger or earned-play claim.
const fs=require('fs'),path=require('path'),readline=require('readline');
const root=path.resolve(__dirname,'..');
const W=require(path.join(root,'src/world-foundations.js'));
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const declaration=app.match(/let dx=\(keys\.has\('d'\)[^;]*;/)?.[0];
const call=app.match(/RealmWorldFoundations\.swim\(sim,dx\*Math\.cos\(camera\.yaw\)[^;]*;/)?.[0];
if(!declaration||!call)throw Error('Actual production key transform not found; do not silently substitute it.');
const frame=Function('sim','keys','camera','dt',declaration+call);
const d=W.definition('atlantis').dive;
let sim,camera;
function snapshot(){return{adventure:{player:{...sim.state.player}},camera:{...camera},dive:{y:sim.worldDive.y},clear:W.swimClear(d,sim.state.player.x,sim.worldDive.y,sim.state.player.z)};}
readline.createInterface({input:process.stdin}).on('line',line=>{
 try{
  const c=JSON.parse(line);
  if(c.init){sim={room:'world-atlantis',paused:false,state:{adventure:{hp:110},player:{x:c.init.x,z:c.init.z,yaw:0}},worldDive:{y:c.init.y,hold:true},playerPath:[]};camera={yaw:c.yaw};}
  else{let remaining=c.milliseconds/1000;while(remaining>1e-9){const dt=Math.min(1/60,remaining);frame(sim,new Set(c.keys),camera,dt);if(!W.swimClear(d,sim.state.player.x,sim.worldDive.y,sim.state.player.z))throw Error('Production caller lost body clearance');remaining-=dt;}}
  process.stdout.write(JSON.stringify(snapshot())+'\n');
 }catch(e){process.stdout.write(JSON.stringify({error:String(e.stack||e)})+'\n');}
});
