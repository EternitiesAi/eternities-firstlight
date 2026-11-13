'use strict';
/* the act I-II scenes the story audit found never reaching the player, and the fox's bond at the mine's exit.
 * each scene is asked for by the real command or defeat that owns its step, plays once, and reads its words from the
 * script at that step. defeats go through the damage path (adventure.damageEnemy), so the fights are not planted; the
 * chapter, road, beacon and crossing journeys play the fights themselves. the adventure dialog is stubbed: its file is
 * loaded against a fake document, and openDialog records the flow it would show. walking is accepted movement. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),SS=require(path.join(ROOT,'src/story-script.js')),A=require(path.join(ROOT,'src/adventure.js'));
const B=require(path.join(ROOT,'src/beacon.js')),X=require(path.join(ROOT,'src/crossing.js'));
const load=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
let serial=0;
const adv=(sim,type,p={})=>{const r=sim.adventureCommand('scene-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);return r;};
const refused=(sim,type,p={})=>{const r=sim.adventureCommand('scene-'+(++serial),type,p);assert.equal(r.ok,false,type+' should be refused');return r;};
const step=(sim,t)=>{for(let i=0;i<Math.ceil(t/.05);i++)sim.tick(.05);};
const walk=(sim,x,z)=>{const r=sim.moveTo(x,z);assert.ok(r.ok,'walk '+x+','+z+': '+r.error);for(let i=0;sim.playerPath.length&&i<6000;i++)step(sim,.05);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.15,'arrived '+x+','+z);};
// every scene queued so far, oldest first. each check reads what the last command asked for; the next one starts clean.
const drain=sim=>{const out=[];for(let q=A.takeScene(sim);q;q=A.takeScene(sim))out.push(q);return out;};
const spoken=sc=>sc.lines.map(l=>l.text).join(' ');
// the one scene the last command asked for, resolved against the world as it now stands.
function playedOnce(sim,owner,stepName,id){
 assert.deepEqual(drain(sim),[{owner,step:stepName}],owner+'.'+stepName+' is asked for, once');
 const sc=SS.forStep(owner,stepName,sim.state);assert.ok(sc,owner+'.'+stepName+' resolves');assert.equal(sc.id,id);return sc;
}
// a defeat through the real damage path. the enemy must be on the field for the room it is in.
function defeat(sim,id){
 const e=A.runtime(sim).enemies.find(v=>v.id===id);assert.ok(e,id+' is on the field');
 assert.equal(A.damageEnemy(sim,e,99999,'weapon'),true,id+' takes the blow');assert.ok(sim.state.adventure.defeated.includes(id),id+' is defeated');
}
// the workshop kit, then the mine's mouth with a bridge and a pickaxe. the mine's entrance is set directly, as the
// adventure unit tests do; the bridge itself is the sandbox's job and has its own journey.
function inMine(){const sim=new C.Simulation();walk(sim,11,9);adv(sim,'start');drain(sim);sim.state.sandbox.bridge=true;sim.state.sandbox.inventory.pick=1;sim.state.player={x:0,z:-48,yaw:0};adv(sim,'enter');return sim;}
// the underways with the skitter beaten and the fox rescued: the only bond the story accepts.
function bondedInMine(){const sim=inMine();playedOnce(sim,'adventure','enter','hart.descent');walk(sim,0,4);walk(sim,-4,2);defeat(sim,'briar-1');walk(sim,-8,2);adv(sim,'rescue');playedOnce(sim,'adventure','rescue','hart.briar');return sim;}
// the chapter-one save on the Sunward Road's lookout, the way a player reaches the gate.
function onRoadGate(){const sim=new C.Simulation(load('examples/CHAPTER_COMPLETED_EARNED.json'));walk(sim,0,3);adv(sim,'rest');walk(sim,44,6);return sim;}
// the chapter-two save at the beacon, before the answer.
function beaconReady(){const sim=new C.Simulation(load('examples/CHAPTER_II_COMPLETE_EARNED.json'));walk(sim,0,3);adv(sim,'rest');walk(sim,44,6);adv(sim,'road-enter');walk(sim,2,3.4);walk(sim,2,-4);walk(sim,0,-24);drain(sim);return sim;}
// the beacon answered, the stranger heard, the defense begun.
function beaconDefending(){const sim=beaconReady();adv(sim,'beacon-answer');playedOnce(sim,'beacon','answer','beacon.door');step(sim,18);adv(sim,'beacon-sighting');drain(sim);adv(sim,'beacon-defend');drain(sim);return sim;}
// every breach beaten through the damage path, until the defense holds.
function winDefense(sim){
 for(let i=0;i<600&&B.runtime(sim).phase!=='won';i++){for(const e of A.runtime(sim).enemies.filter(v=>v.eventEnemy&&v.hp>0)){e.hidden=false;A.damageEnemy(sim,e,99999,'weapon');}step(sim,.5);}
 assert.equal(B.runtime(sim).phase,'won','the defense holds');
}
function beaconWon(){const sim=beaconDefending();winDefense(sim);return sim;}

const ACT_ONE_TWO=[
 ['adventure','start','kit.workshop'],['adventure','enter','hart.descent'],['adventure','rescue','hart.briar'],['adventure','hart','hart.fallen'],
 ['adventure','road-enter','road.gate'],['adventure','cart-repair','road.mended'],['adventure','road-ram','road.ram'],
 ['beacon','answer','beacon.door'],['beacon','herald','beacon.herald'],['beacon','relic','beacon.cinder'],
 ['crossing','met','bellweather.rowan'],['crossing','clapper','bellweather.clapper'],['crossing','keeper','bellweather.keeper'],['crossing','complete','bellweather.bell']
];

test('the fourteen act I-II scenes are on the table at their steps',()=>{
 assert.equal(ACT_ONE_TWO.length,14);
 for(const[owner,stepName,id]of ACT_ONE_TWO)assert.equal(SS.STEPS[owner][stepName],id,owner+'.'+stepName);
});

test('the workshop kit plays Oren’s scene at the start step, once, with no toast of its own',()=>{
 const sim=new C.Simulation();walk(sim,11,9);
 assert.equal(adv(sim,'start').text,undefined,'the scene carries the kit, not a toast');
 assert.match(spoken(playedOnce(sim,'adventure','start','kit.workshop')),/There you are/);
 refused(sim,'start');assert.deepEqual(drain(sim),[],'a second claim asks for nothing');
});

test('the descent plays at the enter step, and not again in the same session',()=>{
 const sim=inMine();
 assert.match(spoken(playedOnce(sim,'adventure','enter','hart.descent')),/stair/);
 sim.leave();sim.state.player={x:0,z:-48,yaw:0};adv(sim,'enter');assert.deepEqual(drain(sim),[],'the descent is not replayed');
});

test('the fox comes along at the rescue step, and the rescue keeps no toast of its own',()=>{
 const sim=inMine();drain(sim);walk(sim,0,4);walk(sim,-4,2);defeat(sim,'briar-1');walk(sim,-8,2);
 assert.equal(adv(sim,'rescue').text,undefined);
 assert.match(spoken(playedOnce(sim,'adventure','rescue','hart.briar')),/salve Oren packed/);
 assert.equal(sim.state.adventure.companion.bonded,true);
});

test('the Hollow Hart’s fall plays at the hart step; the feather is taken with the fox',()=>{
 const sim=bondedInMine();drain(sim);
 defeat(sim,'hart');
 assert.match(spoken(playedOnce(sim,'adventure','hart','hart.fallen')),/white feather/);
 sim.state.player={x:8,z:-10,yaw:0};// beside the dais; walking there is the chapter journey’s work
 assert.equal(adv(sim,'relic').ok,true);assert.equal(sim.state.adventure.relic,true);
});

test('without the fox the feather and the lantern exit are refused, and a fallen hero revived outside has no feather',()=>{
 const sim=inMine();drain(sim);
 walk(sim,0,4);walk(sim,-4,2);defeat(sim,'briar-1');walk(sim,0,11);
 assert.match(refused(sim,'leave').error,/briarfox/,'the exit waits for the fox');
 assert.equal(sim.room,'mine');
 defeat(sim,'hart');playedOnce(sim,'adventure','hart','hart.fallen');sim.state.player={x:8,z:-10,yaw:0};
 assert.match(refused(sim,'relic').error,/briarfox/,'the feather waits for the fox');
 sim.state.adventure.hp=0;adv(sim,'revive');assert.equal(sim.room,null,'revival puts the hero outside');
 refused(sim,'relic');assert.equal(sim.state.adventure.relic,false,'no feather from outside the mine');
 assert.deepEqual(drain(sim),[],'the refused fox and feather ask for no scene');
});

test('the Sunward Road’s gate plays on the first entry only',()=>{
 const sim=onRoadGate();
 assert.equal(adv(sim,'road-enter').text,undefined);
 assert.match(spoken(playedOnce(sim,'adventure','road-enter','road.gate')),/Sunward Road starts/);
 walk(sim,0,17);adv(sim,'road-leave');drain(sim);
 walk(sim,44,6);adv(sim,'road-enter');assert.deepEqual(drain(sim),[],'the gate is not said again');
});

test('the cart’s repair plays at the cart-repair step',()=>{
 const sim=onRoadGate();adv(sim,'road-enter');drain(sim);
 A.syncScene(sim);defeat(sim,'road-prowler');
 // the find of the latch is the seek, which the road journey plays; here its result is set directly.
 sim.state.adventure.road.revealed.push('cart-latch');sim.state.adventure.road.claimed.push('cart-latch');
 sim.state.adventure.ore=Math.max(2,sim.state.adventure.ore);
 walk(sim,-10,12);
 assert.equal(adv(sim,'cart-repair').text,undefined);
 assert.match(spoken(playedOnce(sim,'adventure','cart-repair','road.mended')),/It holds/);
});

test('the Sunscar Ram’s fall plays at the road-ram step',()=>{
 const sim=onRoadGate();adv(sim,'road-enter');drain(sim);
 A.syncScene(sim);defeat(sim,'road-ram');
 assert.match(spoken(playedOnce(sim,'adventure','road-ram','road.ram')),/Sunscar Ram goes down/);
});

test('the beacon answers with its door scene, and the answer keeps no toast of its own',()=>{
 const sim=beaconReady();
 assert.equal(adv(sim,'beacon-answer').text,undefined);
 assert.match(spoken(playedOnce(sim,'beacon','answer','beacon.door')),/It’s a door/);
});

test('the herald asks at the defense’s win, and the cinder scene reads what the choice did',()=>{
 const sim=beaconWon();
 const herald=playedOnce(sim,'beacon','herald','beacon.herald');
 assert.match(spoken(herald),/Chainbound Herald comes apart/);
 assert.deepEqual(herald.choice.options.map(o=>o.label),['Keep the cinder','Seal it away'],'the script’s labels');
 assert.equal(herald.choice.prompt,'The herald’s cinder. The stranger said it was yours.','the script’s prompt');
 assert.equal(adv(sim,'beacon-relic',{choice:'accept'}).text,undefined,'the choice keeps no toast of its own');
 assert.deepEqual(drain(sim),[]);
 assert.equal(sim.state.adventure.beacon.relic,'accepted');
 assert.match(spoken(SS.forStep('beacon','relic',sim.state)),/settles in your pack/);
 assert.match(spoken(SS.forStep('beacon','relic',{adventure:{beacon:{relic:'sealed'}}})),/goes on my shelf/,'the sealed branch reads its own line');
});

test('the Bellweather road plays Rowan, the clapper, the keeper and the bell at their steps; the keeper plants the forty-one',()=>{
 const sim=new C.Simulation(load('examples/REALM10_CHAPTER_III_BASE_EARNED.json'));
 walk(sim,0,3);adv(sim,'waystone-travel',{id:'sunward'});assert.deepEqual(drain(sim),[]);
 walk(sim,0,-27);adv(sim,'cross-enter');assert.deepEqual(drain(sim),[],'the gate asks for no scene');
 walk(sim,0,17);adv(sim,'cross-attune');assert.deepEqual(drain(sim),[]);
 walk(sim,-2,9);assert.equal(adv(sim,'cross-meet').text,undefined,'Rowan’s line is the scene’s, not a toast');
 assert.match(spoken(playedOnce(sim,'crossing','met','bellweather.rowan')),/road is open/);
 walk(sim,1,3);adv(sim,'cross-inspect');drain(sim);
 walk(sim,-8,-3);adv(sim,'cross-seek');
 for(let i=0;i<300&&!sim.state.adventure.crossing.clapperRevealed;i++)step(sim,.05);
 assert.equal(sim.state.adventure.crossing.clapperRevealed,true,'Briar finds the clapper’s place');
 defeat(sim,'cross-thorn');walk(sim,X.CLAPPER.x,X.CLAPPER.z);
 assert.equal(adv(sim,'cross-clapper').text,undefined,'the clapper keeps no toast of its own');
 assert.match(spoken(playedOnce(sim,'crossing','clapper','bellweather.clapper')),/coat gone soft/);
 defeat(sim,'cross-prism');drain(sim);
 walk(sim,0,-15);defeat(sim,'cross-warden');
 assert.match(spoken(playedOnce(sim,'crossing','keeper','bellweather.keeper')),/Forty-one/);
 walk(sim,0,-18);adv(sim,'cross-repair');drain(sim);
 for(const b of X.BELLS){
  walk(sim,b.x,b.z);step(sim,.7);const r=adv(sim,'cross-ring',{id:b.id});
  if(b.id!=='sun'){assert.deepEqual(drain(sim),[],b.id+' does not finish the melody');assert.ok(r.text,'a passing tone keeps its own line');}
  else assert.equal(r.text,undefined,'the final tone speaks through the scene');
 }
 assert.match(spoken(playedOnce(sim,'crossing','complete','bellweather.bell')),/Leaf, then Wave, then Sun/);
});

// the adventure dialog's file against a fake document: the methods under test run, and openDialog is stubbed so the flow
// it would show is what the test reads.
function fakeDocument(){
 const els=new Map(),element=()=>({open:false,hidden:false,disabled:false,textContent:'',style:{},dataset:{},classList:{toggle(){}},addEventListener(){},setPointerCapture(){},showModal(){this.open=true;},close(){this.open=false;},replaceChildren(){},append(){},querySelector(){return null}});
 const find=sel=>{if(!els.has(sel))els.set(sel,element());return els.get(sel);};
 return{querySelector:find,getElementById:find,createElement:element,body:element()};
}
function loadAdventureUI(){globalThis.document=fakeDocument();vm.runInThisContext(fs.readFileSync(path.join(ROOT,'src/adventure-ui.js'),'utf8'),{filename:'adventure-ui.js'});return globalThis.RealmAdventureUI.AdventureUI;}
const AdventureUI=loadAdventureUI();
function uiFor(sim){const ui=Object.create(AdventureUI.prototype);ui.api={sim:()=>sim};ui.opened=[];ui.ran=[];ui.openDialog=(flow,opts)=>{ui.opened.push({flow,opts});};ui.run=(type,p={})=>{ui.ran.push({run:type,p});return sim.adventureCommand('ui-'+(++serial),type,p);};return ui;}

test('the herald waits until the hero is back beside the beacon, and then plays once',()=>{
 const sim=beaconWon(),ui=uiFor(sim);
 walk(sim,2,3.4);ui.playQueuedScene();assert.equal(ui.opened.length,0,'the herald waits away from the beacon');
 walk(sim,0,-24);ui.playQueuedScene();assert.equal(ui.opened.length,1,'the herald plays beside the beacon');
 ui.playQueuedScene();assert.equal(ui.opened.length,1,'and not again');
});

test('the stubbed dialog takes each queued scene once; the herald’s choice reaches the cinder command',()=>{
 const sim=beaconWon(),ui=uiFor(sim);
 walk(sim,0,-24);// the herald waits for the hero at the beacon, as the choice itself does
 ui.playQueuedScene();
 assert.equal(ui.opened.length,1);
 const[head,relic]=ui.opened[0].flow;
 assert.deepEqual([head.owner,head.step],['beacon','herald']);
 assert.deepEqual([relic.owner,relic.step],['beacon','relic'],'the cinder step follows the choice');
 assert.equal(typeof relic.command,'function','the cinder command waits for the answer');
 assert.equal(ui.opened[0].opts.finish.label,'Continue');
 ui.playQueuedScene();assert.equal(ui.opened.length,1,'nothing else is queued');
 relic.command({cinder:'accepted'});
 assert.deepEqual(ui.ran,[{run:'beacon-relic',p:{choice:'accept'}}]);
 assert.equal(sim.state.adventure.beacon.relic,'accepted');
});

test('a queued scene waits while the hero is down or another dialog is open',()=>{
 const sim=new C.Simulation();walk(sim,11,9);adv(sim,'start');
 const ui=uiFor(sim),dialog=globalThis.document.querySelector('#story-dialog');
 sim.state.adventure.hp=0;ui.playQueuedScene();assert.equal(ui.opened.length,0,'the fallen hero hears nothing yet');
 sim.state.adventure.hp=100;dialog.open=true;ui.playQueuedScene();assert.equal(ui.opened.length,0,'one dialog at a time');
 dialog.open=false;ui.playQueuedScene();
 assert.equal(ui.opened.length,1);assert.equal(ui.opened[0].flow[0].step,'start');
 assert.equal(ui.opened[0].flow.length,1,'a plain scene is one step');
});
