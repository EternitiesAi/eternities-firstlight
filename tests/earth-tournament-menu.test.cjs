/* Synthetic local entry, real Simulation/contact owner and the actual app
 * drawer functions. Minimal DOM scaffolding supplies only the drawer elements.
 * No browser-layout or native-key claim; the serial native caller covers those. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('../src/core.js'),A=require('../src/adventure.js'),E=require('../src/earth.js');
const T=require('../src/combat.js'),AR=require('../src/arsenal.js'),R=require('../src/earth-tournament.js');
const UI=require('../src/earth-tournament-ui.js');
const app=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
const drawerSource=['openPanel','closePanel','toggleSimulationPause'].map(name=>{
 const line=app.split(/\r?\n/).find(line=>line.startsWith('function '+name+'('));
 assert.ok(line,'actual app '+name+' function');return line;
}).join('\n');
let serial=0;
function fixture({bow=false,enter=true}={}){
 const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};
 assert.equal(sim.adventureCommand('rain-menu-'+(++serial),'start').ok,true);
 if(bow){sim.state.adventure.owned.push('trail_bow');assert.equal(sim.adventureCommand('rain-menu-'+(++serial),'equip',{id:'trail_bow'}).ok,true);}
 sim.room=E.ROOM;sim.returnPos={x:0,z:23,yaw:0};sim.state.player={x:5,z:-29.8,yaw:Math.PI};A.syncScene(sim);
 if(enter){const r=R.command({sim,active:'synthetic-menu',current:()=>true},'enter',{
  quest:R.definition.id,expectedActive:'synthetic-menu',expectedRevision:sim.state.adventure.revision,
  family:AR.weapon(sim.state.adventure).style},{save:()=>({ok:true})});assert.ok(r.ok,r.error);A.syncScene(sim);}
 const noop=()=>{},classes={add:noop,remove:noop},focus={focus:noop};
 const scope=vm.createContext({sim,RealmCombat:T,RealmEarthTournamentUI:UI,
  rpg:{intercept:()=>false,dialog:{open:false}},adventure:{stopAuto:noop},sandbox:{endBuild:noop},
  keys:new Set(),experience:null,panel:null,lastFocus:null,renderPanel:noop,toast:noop,$:()=>focus,
  document:{activeElement:focus,body:{classList:classes},querySelectorAll:()=>[],contains:()=>true},
  ui:{drawer:{inert:true,classList:classes}}});
 vm.runInContext(drawerSource,scope);
 return{sim,scope,open:name=>scope.openPanel(name),close:()=>scope.closePanel()};
}

test('actual Settings drawer holds all simulation time and restores a running exhibition',()=>{
 const f=fixture(),before=f.sim.snapshot(),bout=R.view(f.sim);
 f.open('settings');assert.equal(f.sim.paused,true,'the hidden bout must actually pause');
 for(let i=0;i<60;i++)f.sim.tick(.05);
 assert.deepEqual(R.view(f.sim),bout);assert.deepEqual(f.sim.snapshot(),before);
 f.open('inhabitants');assert.equal(f.sim.paused,true,'changing drawers retains the original pause lease');
 f.close();assert.equal(f.sim.paused,false);f.sim.tick(.05);assert.ok(R.view(f.sim).time>bout.time);
});

test('menu hold freezes an admitted bow projectile too, then resumes its actual contact',()=>{
 const f=fixture({bow:true});while(R.view(f.sim).phase!=='opening')f.sim.tick(.05);
 assert.equal(f.sim.adventureCommand('rain-menu-'+(++serial),'attack',{target:A.runtime(f.sim).enemies[0].id}).ok,true);
 const shot=JSON.stringify(AR.runtime(f.sim).arrows),before=R.view(f.sim);
 assert.equal(AR.runtime(f.sim).arrows.length,1);f.open('settings');
 for(let i=0;i<30;i++)f.sim.tick(.05);
 assert.equal(JSON.stringify(AR.runtime(f.sim).arrows),shot);assert.deepEqual(R.view(f.sim),before);
 f.close();for(let i=0;i<10&&!R.view(f.sim).rounds[0].reply;i++)f.sim.tick(.05);
 assert.equal(R.view(f.sim).rounds[0].reply,true);
});

test('pause choices made in a held drawer affect return, never release the hidden bout',()=>{
 const f=fixture(),before=R.view(f.sim);f.open('settings');
 assert.equal(UI.pauseAction(f.sim),'Pause after closing menu');
 f.scope.toggleSimulationPause();assert.equal(f.sim.paused,true);
 assert.equal(UI.pauseAction(f.sim),'Resume after closing menu');
 f.sim.tick(.1);assert.deepEqual(R.view(f.sim),before);
 f.close();assert.equal(f.sim.paused,true,'explicit pause remains after close');
 f.open('settings');f.scope.toggleSimulationPause();assert.equal(UI.pauseAction(f.sim),'Pause after closing menu');
 assert.equal(f.sim.paused,true,'resume is deferred until controls are visible');
 f.close();assert.equal(f.sim.paused,false);
});

test('ordinary drawers keep their old live-time semantics and cannot release another owner',()=>{
 const ordinary=fixture({enter:false});ordinary.open('settings');assert.equal(ordinary.sim.paused,false);
 ordinary.scope.toggleSimulationPause();ordinary.close();assert.equal(ordinary.sim.paused,true);
 const f=fixture();f.open('settings');const next=new C.Simulation();next.paused=true;f.scope.sim=next;
 f.close();assert.equal(next.paused,true,'old world hold does not restore a new world');
 const changed=fixture();changed.open('settings');changed.sim.state=C.validate(changed.sim.snapshot());changed.sim.paused=true;
 changed.close();assert.equal(changed.sim.paused,true,'replaced state cannot inherit an old resume');
});

test('actual native key router leaves drawer Space/Enter activation to the focused button',()=>{
 const f=fixture(),dispatched=[];f.scope.rpg.key=e=>{dispatched.push(e.key);return true;};
 f.scope.document.querySelector=()=>null;
 f.scope.window={addEventListener:(type,handler)=>{assert.equal(type,'keydown');f.scope.keydown=handler;}};
 const start=app.indexOf("window.addEventListener('keydown',e=>{"),end=app.indexOf('\n});',start);
 assert.ok(start>=0&&end>start);vm.runInContext(app.slice(start,end+4),f.scope);
 const press=(key,container)=>{let prevented=false;f.scope.keydown({key,
  target:{tagName:'BUTTON',closest:selector=>container&&selector.split(',').includes(container)?{}:null},
  preventDefault(){prevented=true;}});return prevented;};
 for(const key of [' ','Enter']){
  assert.equal(press(key,'#drawer'),false,'native '+key+' activation is not cancelled');
  assert.deepEqual(dispatched,[],'menu activation never dispatches a combat slot');
 }
 assert.equal(press(' ','#pier-fishing'),false,'previous fishing button behavior remains');
 assert.equal(press(' ',null),true,'world Space still reaches the ordinary game control');
 assert.deepEqual(dispatched,[' ']);
});
