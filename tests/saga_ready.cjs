'use strict';
/* A story-ready world for journeys that walk the act IV trails, prepared only through the game's own commands:
 * the crossing journey's earned chapter-IV save (home after the bell), the night beat marked through the saga's own `mark`, then the hell
 * campaign (and, through 'heaven', the heaven campaign) played by the bot's connected helpers, with the foundry
 * sighting and the heaven reading taken through the saga's own `regent` and `prophecy`. Nothing is written into the
 * save by hand.
 *   through: 'night' (the hell trail opens), 'hell' (the garden gate opens), 'heaven' (the cosmos opens).
 * storyWorld starts from chapter IV; advance carries any world further, skipping what it has already done (a hell
 * trail already walked is kept: the hell campaign plays its prerequisite only when it is missing). Both return a raw
 * world. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const C=require('../src/core.js'),SG=require('../src/saga.js');
const STAGES=['night','hell','heaven'],made=new Map();let serial=0;
// scratch: never on C: on windows (the evidence helpers refuse it and the house keeps C: clear); the box uses its tmp.
const scratch=()=>{const base=process.env.FIRSTLIGHT_SCRATCH||(process.platform==='win32'?'D:/firstlight/scratch':os.tmpdir());fs.mkdirSync(base,{recursive:true});return fs.mkdtempSync(path.join(base,'saga-ready-'));};
function sagaCmd(sim,type,payload){const r=sim.sagaCommand('saga-ready-'+(++serial)+'-'+type,type,payload);assert.ok(r.ok,'saga '+type+': '+r.error);return r;}
const load=file=>new C.Simulation(C.validate(JSON.parse(fs.readFileSync(file,'utf8'))));
function campaign(tool,sim,dir,stage,bow){
 const variant=bow?'connected-bow':'connected-blade',input=path.join(dir,'before-'+stage+'.json');fs.writeFileSync(input,JSON.stringify(sim.snapshot()));
 const r=require('../tools/earth-homecoming-journey/'+tool).journey({root:ROOT,inheritedWorld:input,connectedVariant:variant,bow,output:path.join(dir,stage)});
 assert.equal(r.status,'passed','the '+stage+' campaign');return load(path.join(dir,stage,variant,'FINAL_WORLD.json'));
}
function advance(raw,{bow=false,through='hell',out}={}){
 assert.ok(STAGES.includes(through),'saga_ready through: '+STAGES.join(' | '));
 const dir=out||scratch(),want=STAGES.indexOf(through);fs.mkdirSync(dir,{recursive:true});
 let sim=new C.Simulation(C.validate(JSON.parse(JSON.stringify(raw))));
 if(!SG.done(sim.state,'night'))sagaCmd(sim,'mark',{beat:'night'});
 // the hell gate holds until the quiet engine is placed (BRANCHES 3.3); this helper places it under the bell.
 if(!sim.state.saga.choices.device)sagaCmd(sim,'choose',{key:'device',value:'open'});
 assert.equal(SG.allowed(sim.state,'hell'),true,'the night opens the way down');
 if(want>=1){
  if(sim.state.hellCampaign?.claimed!==true)sim=campaign('connected_hell.cjs',sim,dir,'hell',bow);
  sagaCmd(sim,'regent',{id:'foundry'});assert.equal(SG.allowed(sim.state,'heaven'),true,'the foundry opens the garden gate');
 }
 if(want>=2){
  if(sim.state.heavenCampaign?.claimed!==true)sim=campaign('connected_heaven.cjs',sim,dir,'heaven',bow);
  sagaCmd(sim,'prophecy',{id:'heaven'});assert.equal(SG.allowed(sim.state,'cosmos'),true,'heaven opens the cosmos');
 }
 return sim.snapshot();
}
// the same arguments in one process reuse the first result
function storyWorld({bow=false,through='hell',out}={}){
 const key=(bow?'bow':'blade')+':'+through;if(made.has(key))return JSON.parse(made.get(key));
 const dir=out||scratch(),iv=path.join(dir,'chapter-iv');
 require('./crossing_journey.cjs').journey({out:iv,bow});
 const world=advance(JSON.parse(fs.readFileSync(path.join(iv,'HOME_AFTER_BELL_EARNED.json'),'utf8')),{bow,through,out:dir});
 made.set(key,JSON.stringify(world));return JSON.parse(made.get(key));
}
module.exports={storyWorld,advance,STAGES};
