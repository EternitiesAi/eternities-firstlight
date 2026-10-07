'use strict';
/* Focused controller composition with installed rules/motion and Core.
 * Original history is command-earned; positions and saver are labelled UI
 * boundary specimens. Native app/storage/DOM/pixels remain a separate gate. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const ROOT=path.resolve(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js'));
const D=require('../src/earth-consignment-data.js');require('../src/local-life.js');require('../src/earth-consignment.js');
const M=require('../src/earth-consignment-motion.js'),L=globalThis.RealmLocalLife,U=require('../src/earth-consignment-ui.js');
const copy=o=>JSON.parse(JSON.stringify(o)),control=(type,id='')=>({dataset:{rpg:'consignment-'+type,job:D.ID,id}});
function harness(branch='stormfall'){
 const variant=branch==='coppice'?'fresh-bow':'fresh-blade',source=require('./helpers/consignment-fixtures.cjs').load(variant);
 const sim=new C.Simulation(source),ctx0={sim,active:'ui-boundary-owner',revision:0},preview=W.preview(ctx0,'earthlands');assert.ok(preview.ok);assert.ok(W.enter(preview.ticket,ctx0,{save:()=>({ok:true}),build:()=>{}}).ok);
 sim.state.player.x=-106;sim.state.player.z=-105;sim.consignmentOwnerLease=Object.freeze({});sim.paused=true;
 let revision=0,refuse=false,writes=0,closes=0,paints=0,controls=0,threat=()=>({clear:true});const notices=[];
 const ctx=()=>({sim,active:ctx0.active,revision,ownerLease:sim.consignmentOwnerLease,definition:D.definition,threat});
 const rpg={sim,civic:{selected:null,tracked:null},open(){sim.paused=true;},close(){sim.paused=false;closes++;},paint(){paints++;},api:{consignmentContext:ctx,toast:t=>notices.push(t),localLifeCommand(type,payload){return L.command(ctx(),type,payload,{save(){if(refuse)return{ok:false,error:'labelled UI quota refusal'};revision++;writes++;return{ok:true};}});},consignmentControl(type){controls++;return M[type==='continue'?'continue':'wait'](ctx());}}};
 const ui=new U.ConsignmentUI(rpg),accept=choice=>ui.action(control('accept',choice));
 function leg(){let v=M.current(ctx()),frames=0;while(!v.ready&&frames++<6000){const p=sim.state.player,d=Math.hypot(p.x-v.x,p.z-v.z);if(d>.5){assert.ok(W.segment(D.ROOM,p,v,.31));sim.manual(v.x-p.x,v.z-p.z,Math.min(.1,d/3.2));}sim.tick(.1);const result=M.update(ctx(),.1);assert.ok(result.ok,result.error);v=result.view;}assert.ok(v.ready,'actual staged carrier reaches next stop');sim.paused=true;return v;}
 return{sim,rpg,ctx,ui,accept,leg,notices,get writes(){return writes;},get closes(){return closes;},get paints(){return paints;},get controls(){return controls;},refuse:v=>{refuse=v;},setThreat:fn=>{threat=fn;}};
}
test('reading exposes two branch-matching routes, exact payment, checkpoint/reload terms and accepts nothing',()=>{
 for(const branch of['stormfall','coppice']){const h=harness(branch),before=JSON.stringify(h.sim.state),html=h.ui.panel();assert.equal((html.match(/Accept this course/g)||[]).length,2);assert.ok(html.includes('4 sunmarks · 2 timber · 2 meadow fibre · no XP'));assert.ok(html.includes('Five arrival checkpoints')&&html.includes('Twelve arrival checkpoints'));assert.ok(html.includes(branch==='stormfall'?'four short timbers':'three binding-fibre bundles'));assert.ok(!html.includes('data-id="south-'+(branch==='stormfall'?'coppice':'stormfall')+'"'));assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.writes,0);assert.equal(h.ui.point().id,'first-load-board');}
});
test('visible accept uses the exact canonical choice and first load is separately tracked',()=>{
 const h=harness(),old=copy(h.sim.state.earthExpedition);h.accept('north-stormfall');assert.equal(h.writes,1);assert.deepEqual(h.sim.state.earthExpedition,old);assert.equal(h.ui.tracker().progress,'0/12 arrivals · J work · M route');assert.equal(h.rpg.quest,'local-life');assert.ok(h.ui.interact());assert.equal(h.rpg.civic.selected,'earthlands');assert.equal(h.rpg.civic.tracked,D.ID);
});
test('Continue closes the paused workspace before obtaining real moving status',()=>{
 const h=harness();h.accept('south-stormfall');assert.equal(h.sim.paused,true);h.ui.action(control('continue'));assert.equal(h.closes,1);assert.equal(h.sim.paused,false);assert.equal(M.current(h.ctx()).status,'moving');assert.equal(h.writes,1);assert.match(h.notices.at(-1),/Stay nearby until it stops at Meadow road/);assert.match(h.notices.at(-1),/blue dotted course/);assert.doesNotMatch(h.notices.at(-1),/next stop is marked/);
});
test('map describes the unaccepted board before exposing a selected physical course, without progress',()=>{
 const h=harness(),before=JSON.stringify(h.sim.state);assert.match(U.legend(h.sim),/signed supply board/);assert.doesNotMatch(U.legend(h.sim),/chosen route|blue dotted course/);assert.deepEqual(U.routeLine(h.sim),[]);assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.writes,0);
 h.accept('south-stormfall');const accepted=JSON.stringify(h.sim.state),writes=h.writes;assert.match(U.legend(h.sim),/chosen route/);assert.match(U.legend(h.sim),/blue dotted course/);assert.ok(U.routeLine(h.sim).length>5);assert.equal(JSON.stringify(h.sim.state),accepted);assert.equal(h.writes,writes);
});
test('a refused ready-arrival save retains proof/menu and retry records exactly one before continuing',()=>{
 const h=harness();h.accept('south-stormfall');h.ui.action(control('continue'));const ready=h.leg(),ticket=M.arrivalTicket(h.ctx()).ticket,before=JSON.stringify(h.sim.state),closes=h.closes;assert.ok(h.ui.panel().includes('Record this arrival and continue'));
 h.refuse(true);h.ui.action(control('continue'));assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.closes,closes);assert.equal(h.sim.paused,true);assert.equal(M.arrivalTicket(h.ctx()).ticket,ticket);assert.ok(h.ui.notice.includes('quota refusal'));assert.equal(h.writes,1);
 h.refuse(false);h.ui.action(control('continue'));assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,['arrive-meadow-stop']);assert.equal(h.writes,2);assert.equal(M.validateArrival(h.ctx(),ticket,'arrive-meadow-stop').ok,false);assert.equal(M.current(h.ctx()).status,'moving');assert.ok(h.closes>closes);assert.equal(ready.ready,true);
});
test('final visible action records real five-stop delivery, keeps payment explicit and received stock separate',()=>{
 const h=harness(),original=copy(h.sim.state.earthExpedition),coins=h.sim.state.adventure.coins,inventory=copy(h.sim.state.sandbox.inventory);h.accept('south-stormfall');h.ui.action(control('continue'));
 for(let i=0;i<5;i++){h.leg();if(i===4)assert.ok(h.ui.panel().includes('Register delivery at this receiving bay'));h.ui.action(control('continue'));}
 assert.equal(h.sim.state.localLife.records[D.ID].steps.length,5);assert.equal(h.sim.state.localLife.records[D.ID].claimed,false);assert.equal(h.sim.state.adventure.coins,coins);assert.deepEqual(h.sim.state.sandbox.inventory,inventory);assert.deepEqual(h.sim.state.earthExpedition,original);assert.equal(h.writes,6);assert.equal(h.sim.paused,true);assert.ok(h.ui.panel().includes('Delivered · separate payment still unpaid'));assert.equal(h.ui.point(),null,'Merren is still across the bay approach; no remote payout');
});
test('synthetic northern partial record displays5of12 and cannot appear delivered after five stops',()=>{
 const h=harness();h.accept('north-stormfall');h.sim.state.localLife.records[D.ID].steps=D.required('north-stormfall').slice(0,5);M.reset(h.sim,'synthetic-boundary-prefix');const html=h.ui.panel();assert.ok(html.includes('Recorded stops: 5 of 12'));assert.ok(html.includes('Woodland camp'));assert.ok(!html.includes('Delivered · separate payment still unpaid'));assert.equal(h.ui.tracker().progress,'5/12 arrivals · J work · M route');
});
test('synthetic earned-final boundary: capacity refusal and exact once-only claim preserve all earlier ledgers',()=>{
 const h=harness('coppice');h.accept('south-coppice');h.sim.state.localLife.records[D.ID].steps=D.required('south-coppice').slice();h.sim.state.player.x=-6;h.sim.state.player.z=-68;M.reset(h.sim,'synthetic-final-boundary');
 const old=copy(h.sim.state.earthExpedition),xp=h.sim.state.adventure.xp;h.sim.state.adventure.coins=9999;const before=JSON.stringify(h.sim.state);h.ui.action(control('claim'));assert.equal(JSON.stringify(h.sim.state),before);assert.ok(h.ui.notice.includes('Make room'));assert.ok(h.ui.panel().includes('Claim 4 sunmarks, 2 timber and 2 fibre once'));
 h.sim.state.adventure.coins=100;const inv=copy(h.sim.state.sandbox.inventory);h.ui.action(control('claim'));assert.equal(h.sim.state.adventure.coins,104);assert.equal(h.sim.state.sandbox.inventory.wood,inv.wood+2);assert.equal(h.sim.state.sandbox.inventory.fiber,inv.fiber+2);assert.equal(h.sim.state.adventure.xp,xp);assert.deepEqual(h.sim.state.earthExpedition,old);const after=JSON.stringify(h.sim.state),writes=h.writes;h.ui.action(control('claim'));assert.equal(JSON.stringify(h.sim.state),after);assert.equal(h.writes,writes);assert.equal(h.ui.tracker(),null);
});
test('stale foreign job controls and player-only arrival do not write or claim',()=>{
 const h=harness();h.accept('south-stormfall');const before=JSON.stringify(h.sim.state),writes=h.writes;h.ui.action({dataset:{rpg:'consignment-claim',job:'wrong'}});assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.writes,writes);
 h.sim.state.player.x=-68;h.sim.state.player.z=-99;h.ui.action(control('record'));assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);assert.equal(h.writes,writes);assert.ok(h.ui.notice.includes('Physically reach'));
});
test('reopening, tracking and route reads have no extra payouts or motion steps',()=>{
 const h=harness();h.accept('south-stormfall');const before=JSON.stringify(h.sim.state),writes=h.writes;for(let i=0;i<10;i++){h.ui.panel();h.ui.tracker();h.ui.interact();h.ui.action(control('open'));U.routePoints(h.sim,h.ctx());}assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.writes,writes);assert.equal(M.current(h.ctx()).status,'waiting');
});
test('selected map lines use the actual loaded solver and supported segments for both routes',()=>{
 for(const choice of['south-stormfall','north-coppice']){const h=harness(choice.endsWith('coppice')?'coppice':'stormfall');h.accept(choice);const before=JSON.stringify(h.sim.state),writes=h.writes,line=U.routeLine(h.sim);assert.ok(line.length>5);assert.deepEqual(line[0],{x:-106,z:-105});assert.deepEqual(line.at(-1),{x:5.8,z:-69});for(let i=1;i<line.length;i++)assert.ok(W.segment(D.ROOM,line[i-1],line[i],.65));assert.equal(JSON.stringify(h.sim.state),before);assert.equal(h.writes,writes);}
});
test('a real motion threat refusal is described as waiting rather than successful movement',()=>{
 const h=harness();h.accept('south-stormfall');h.setThreat(()=>({clear:false,reason:'labelled live threat'}));h.ui.action(control('continue'));assert.equal(M.current(h.ctx()).status,'blocked');assert.ok(h.ui.notice.includes('waiting')&&h.ui.notice.includes('labelled live threat'));assert.ok(!h.ui.notice.includes('is continuing'));assert.equal(h.writes,1);
});
test('a saved intermediate receipt and cleanup warning survive the combined continue action',()=>{
 const h=harness();h.accept('south-stormfall');h.ui.action(control('continue'));h.leg();const original=globalThis.RealmEarthConsignmentMotion;
 try{globalThis.RealmEarthConsignmentMotion={...M,consume(){throw Error('labelled post-save cleanup failure');}};h.ui.action(control('continue'));assert.equal(h.sim.state.localLife.records[D.ID].steps.length,1);assert.equal(h.writes,2);assert.ok(h.ui.notice.includes('Supplied consignment arrived'));assert.ok(h.ui.notice.includes('Arrival was saved; carrier cleanup needs refresh'));assert.ok(h.ui.notice.includes('labelled post-save cleanup failure'));}finally{globalThis.RealmEarthConsignmentMotion=original;}
});
test('a saved intermediate arrival stays visibly saved when the following control refuses',()=>{
 const h=harness();h.accept('south-stormfall');h.ui.action(control('continue'));h.leg();h.rpg.api.consignmentControl=()=>({ok:false,error:'labelled next-leg refusal'});h.ui.action(control('continue'));assert.equal(h.writes,2);assert.equal(h.sim.state.localLife.records[D.ID].steps.length,1);assert.ok(h.ui.notice.includes('Supplied consignment arrived')&&h.ui.notice.includes('labelled next-leg refusal'));
});
test('missing motion authority degrades reading and map to the saved checkpoint without writes',()=>{
 const h=harness();h.accept('south-stormfall');const original=globalThis.RealmEarthConsignmentMotion,writes=h.writes;
 try{globalThis.RealmEarthConsignmentMotion=undefined;assert.equal(h.ui.live(),null);assert.equal(U.routePoints(h.sim,h.ctx())[0].x,-106);assert.ok(h.ui.panel().includes('Walk to the supplied carrier'));h.ui.action(control('continue'));assert.equal(h.writes,writes);}finally{globalThis.RealmEarthConsignmentMotion=original;}
});
test('unaccepted controls and map refuse malformed original source with superficially paid flags',()=>{
 const h=harness();h.sim.state.earthExpedition={version:1,story:{claimed:true,branch:'stormfall-recovery'}};assert.deepEqual(U.routePoints(h.sim,h.ctx()),[]);assert.equal(h.ui.point(),null);assert.ok(h.ui.panel().includes('cannot be validated'));assert.ok(!h.ui.panel().includes('Accept this course'));assert.equal(h.writes,0);
});
test('real notice ownership clears feedback on a new lease or slot while menu closure preserves it',()=>{
 const h=harness();h.accept('south-stormfall');const text=h.ui.notice;assert.ok(text.includes('accepted'));h.ui.reset('presentation');assert.equal(h.ui.notice,text);h.rpg.close();h.rpg.open();h.ui.panel();assert.equal(h.ui.notice,text);h.sim.consignmentOwnerLease=Object.freeze({});h.ui.panel();assert.equal(h.ui.notice,'');
 h.ui.finish({ok:false,error:'labelled first-owner refusal'});h.rpg.api.consignmentContext=()=>({...h.ctx(),active:'another-slot'});h.ui.panel();assert.equal(h.ui.notice,'');h.ui.finish({ok:true,text:'labelled new-owner record'});h.ui.reset('owner');assert.equal(h.ui.notice,'');
});
test('map load actions use the new guarded controller while Merren’s earlier workshop remains reachable',()=>{
 const h=harness();const before=JSON.stringify(h.sim.state),legend=U.legend(h.sim);assert.ok(legend.includes('data-rpg="consignment-walk"')&&legend.includes('data-id="giver"'));assert.ok(!legend.includes('data-rpg="civic-walk"'));h.accept('south-stormfall');assert.ok(U.legend(h.sim).includes('data-id="carrier"'));assert.ok(h.ui.panel().includes('data-rpg="community-open"'));assert.ok(h.ui.panel().includes('data-rpg="expedition-open"'));assert.equal(JSON.stringify(h.sim.state.earthExpedition),JSON.stringify(JSON.parse(before).earthExpedition));
});
