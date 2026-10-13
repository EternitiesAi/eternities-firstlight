/* Real UI methods with a bounded DOM boundary; no native pixel claim. */
'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),F=require('../src/pier-fishing.js');let UI;try{UI=require('../src/pier-fishing-ui.js').FishingUI;}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
function fixture(){assert.ok(UI,'The fishing rules need a visible production caller');const sim=new C.Simulation();sim.state.player={x:0,z:27,yaw:0};
 const h={sim,active:'synthetic-ui',toasts:[],blocked:false};
 const api={sim:()=>h.sim,active:()=>h.active,blocked:()=>h.blocked,menuOpen:()=>!!h.menu,prepare(){},focus(){},toast:s=>h.toasts.push(s),rest(){h.rests=(h.rests||0)+1;}};
 const ui=Object.create(UI.prototype);ui.api=api;ui.paint=()=>{};
 ui.dialog={open:false,showModal(){this.open=true;},close(){this.open=false;}};h.ui=ui;return h;}
test('opening the pier choices has no implicit rest, cast or persistent mutation',()=>{
 const h=fixture(),before=h.sim.snapshot();h.ui.open();assert.ok(h.ui.dialog.open);assert.equal(h.sim.paused,true);
 assert.equal(h.rests,undefined);assert.equal(F.current(h.ui.context()),null);assert.deepEqual(h.sim.snapshot(),before);
 h.ui.cast();assert.equal(h.ui.dialog.open,false);assert.equal(h.sim.paused,false);assert.equal(F.current(h.ui.context()).phase,'waiting');
});
test('a previously paused world is not silently resumed to permit casting',()=>{
 const h=fixture();h.sim.paused=true;h.ui.open();h.ui.cast();assert.equal(h.sim.paused,true);assert.equal(F.current(h.ui.context()),null);
});
test('stale modal ownership and an active Briar outing cannot start a new activity',()=>{
 const h=fixture();h.blocked=true;h.ui.open();assert.equal(h.ui.dialog.open,false);
 h.blocked=false;h.ui.open();h.active='replacement';h.ui.cast();assert.equal(F.current(h.ui.context()),null);
});
test('actual keyboard control chooses Hook then reel/ease, protects typing and cancels only its line',()=>{
 const h=fixture();h.ui.open();h.ui.cast();for(let i=0;i<80;i++){h.sim.tick(.05);F.tick(h.ui.context());}
 const event=(key,tagName='CANVAS',repeat=false)=>({key,target:{tagName},repeat});
 assert.equal(h.ui.key(event('e','INPUT')),false);assert.equal(F.current(h.ui.context()).phase,'bite');
 assert.equal(h.ui.key(event('e')),true);assert.equal(F.current(h.ui.context()).phase,'playing');
 h.ui.key(event('e'));assert.equal(F.current(h.ui.context()).reeling,true);
 h.ui.key(event('e','CANVAS',true));assert.equal(F.current(h.ui.context()).reeling,true);
 h.ui.key(event('e'));assert.equal(F.current(h.ui.context()).reeling,false);
 assert.equal(h.ui.key(event('v')),false,'Both camera controls pass through');
 assert.equal(h.ui.key(event('Escape')),true);assert.equal(F.current(h.ui.context()),null);
});

test('a non-pausing drawer freezes the fishing clock and discards elapsed menu time',()=>{
 const h=fixture();h.ui.open();h.ui.cast();for(let i=0;i<80;i++){h.sim.tick(.05);h.ui.tick();}
 h.ui.primary();h.ui.primary();h.menu=true;h.ui.tick();const before=F.current(h.ui.context());
 for(let i=0;i<200;i++){h.sim.tick(.05);h.ui.tick();}
 assert.equal(h.sim.paused,false);assert.deepEqual(F.current(h.ui.context()),before);
 h.menu=false;h.sim.tick(.05);h.ui.tick();assert.ok(F.current(h.ui.context()).time-before.time<.06);
 assert.equal(F.current(h.ui.context()).phase,'playing');
});
test('App native fishing buttons retain Space and Enter without invoking dodge',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require.resolve('../src/app.js'),'utf8');let callback,combat=0;
 const env={window:{addEventListener:(n,f)=>callback=f},document:{querySelector:()=>null},sim:{},panel:null,rpg:{key(){combat++;return true;}}};
 vm.createContext(env);vm.runInContext(s.slice(s.indexOf("window.addEventListener('keydown',e=>{"),s.indexOf("window.addEventListener('keyup'")),env);
 for(const key of [' ','Enter']){let prevented=false;callback({key,target:{tagName:'BUTTON',closest:()=>({})},preventDefault(){prevented=true;}});assert.equal(prevented,false);}
 assert.equal(combat,0);
 callback({key:' ',target:{tagName:'CANVAS'},preventDefault(){}});assert.equal(combat,1,'Ordinary combat keeps its existing Space behavior');
});
test('the original quiet-water rest reach still opens the choices without an implicit cast',()=>{
 const h=fixture();h.sim.state.player.z=24;assert.equal(h.ui.open(),true);assert.equal(h.ui.dialog.open,true);
 assert.equal(F.current(h.ui.context()),null);
});

test('the fishing HUD yields to drawers and returns when controls are available again',()=>{
 const h=fixture();h.ui.open();h.ui.cast();const previous=global.document,parts=new Map();
 global.document={body:{classList:{toggle(){}}}};
 try{
  h.ui.host={};h.ui.hud={hidden:false,dataset:{},querySelector:s=>{if(!parts.has(s))parts.set(s,{});return parts.get(s);}};
  h.menu=true;UI.prototype.paint.call(h.ui);assert.equal(h.ui.hud.hidden,true,'Do not cover the drawer close control');
  h.menu=false;UI.prototype.paint.call(h.ui);assert.equal(h.ui.hud.hidden,false);
  h.ui.act('cancel');UI.prototype.paint.call(h.ui);assert.equal(h.ui.hud.hidden,true);
 }finally{if(previous===undefined)delete global.document;else global.document=previous;}
});
test('framing the water is an explicit camera action that retains the chosen style and FOV',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require.resolve('../src/app.js'),'utf8');
 let saves=0;const camera={preset:'adventure',fov:72};const env={engine:{},fishing:{active:()=>true},sim:{room:null},camera,
  clearGrazerFocus(){},clearCarrierFocus(){},fieldcraftFrame:null,follow:null,updateCamera(){},save:()=>{saves++;return{ok:true};},fitCameraHalf:(half,zoom)=>half*zoom};
 vm.createContext(env);vm.runInContext(s.slice(s.indexOf('function frameFishing(){'),s.indexOf('function bridgeView(){')),env);
 assert.equal(env.frameFishing().ok,true);assert.equal(camera.preset,'adventure');assert.equal(camera.fov,72);assert.equal(saves,1);
 camera.preset='follow';camera.baseHalf=18;env.frameFishing();assert.equal(camera.preset,'follow');assert.equal(camera.fov,72);assert.equal(saves,2);
 env.fishing.active=()=>false;assert.equal(env.frameFishing().ok,false);assert.equal(saves,2);
});

test('the actual App boundary gives photo mode its controls and suspends the hidden line',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require.resolve('../src/app.js'),'utf8');let photo=false,dialog=false;
 const env={panel:null,document:{querySelector:()=>dialog?{}:null,body:{classList:{contains:()=>photo}}}};
 vm.createContext(env);vm.runInContext(s.split('\n').find(l=>l.startsWith('function fishingControlsCovered(')),env);
 assert.equal(env.fishingControlsCovered(),false);photo=true;assert.equal(env.fishingControlsCovered(),true);
 photo=false;dialog=true;assert.equal(env.fishingControlsCovered(),true);dialog=false;env.panel='settings';assert.equal(env.fishingControlsCovered(),true);
});

test('global App E cannot act on a line hidden behind photo or menu controls',()=>{
 const h=fixture(),fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require.resolve('../src/app.js'),'utf8');let callback;
 const env={window:{addEventListener:(n,f)=>callback=f},document:{querySelector:()=>null},sim:h.sim,panel:null,fishing:h.ui,
  briarInteract:()=>false,rpg:{key:()=>false},adventure:{key:()=>false},sandbox:{key:()=>false}};
 vm.createContext(env);vm.runInContext(s.split('\n').find(l=>l.startsWith('function interact(){')),env);
 vm.runInContext(s.slice(s.indexOf("window.addEventListener('keydown',e=>{"),s.indexOf("window.addEventListener('keyup'")),env);
 const press=()=>callback({key:'e',target:{tagName:'CANVAS'},preventDefault(){}});
 h.ui.open();h.ui.cast();for(let i=0;i<80;i++){h.sim.tick(.05);h.ui.tick();}
 assert.equal(F.current(h.ui.context()).phase,'bite');h.menu=true;let before=F.current(h.ui.context());press();assert.deepEqual(F.current(h.ui.context()),before);
 h.menu=false;press();assert.equal(F.current(h.ui.context()).phase,'playing');
 for(let i=0;i<1600&&F.current(h.ui.context()).phase==='playing';i++){
  const v=F.current(h.ui.context());if(v.tension<.35&&!v.reeling||v.tension>.7&&v.reeling)press();h.sim.tick(.05);h.ui.tick();
 }
 assert.equal(F.current(h.ui.context()).phase,'caught');h.menu=true;before=F.current(h.ui.context());press();assert.deepEqual(F.current(h.ui.context()),before);
 h.menu=false;press();assert.equal(F.current(h.ui.context()),null);
 h.menu=true;assert.equal(h.ui.open(),false,'Photo mode cannot open invisible pier choices');
});
