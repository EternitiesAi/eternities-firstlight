'use strict';
/* Bounded CPU component tests. Installed source is read-only. The historical returning
 * expedition fixture is command-earned; new acceptance is explicitly synthetic
 * while the separate journey suite earns all new arrivals through installed commands. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const F=require('./helpers/consignment-fixtures.cjs');
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js')),E=require(path.join(ROOT,'src/earth-expedition.js')),A=require(path.join(ROOT,'src/adventure.js')),CH=require(path.join(ROOT,'src/characters.js'));
const D=require('../src/earth-consignment-data.js'),M=require('../src/earth-consignment-motion.js');
const oracle=require('./helpers/consignment-route-oracle.cjs');
const copy=v=>JSON.parse(JSON.stringify(v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const prepared=new Map();
function fixture(choice){const variant=choice.endsWith('coppice')?'fresh-bow':'fresh-blade';return F.load(variant);}
function walk(sim,x,z){
 assert.ok(sim.moveTo(x,z).ok,'actual Core path to setup point');let ticks=0;
 while(sim.playerPath.length&&ticks++<12000){const p={...sim.state.player};sim.tick(.1);assert.ok(W.segment(sim.room,p,sim.state.player,.31),'actual setup player segment');assert.ok(sim.state.adventure.hp>0);}
 assert.ok(ticks<12000&&dist(sim.state.player,{x,z})<.25,'actual setup arrival');return ticks;
}
function sourceAtGlade(choice){
 const key=choice.endsWith('coppice')?'coppice':'stormfall';if(prepared.has(key))return prepared.get(key);
 const sim=new C.Simulation(fixture(choice)),ctx={sim,active:'motion-component',revision:0},preview=W.preview(ctx,'earthlands');assert.ok(preview.ok,preview.error);
 assert.ok(W.enter(preview.ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);const ticks=walk(sim,-106,-105);
 const out={home:sim.snapshot(),room:sim.room,returnPos:copy(sim.returnPos),player:copy(sim.state.player),trip:copy(sim.worldTrip),elapsed:sim.elapsed,runtime:copy(sim.adventureRuntime),ticks};
 prepared.set(key,out);return out;
}
function harness(choice='south-stormfall'){
 // The shared physically reached glade is reused only for adversarial component
 // specimens. Journey tests instantiate/travel/walk separately with command IO.
 const p=sourceAtGlade(choice),sim=new C.Simulation(p.home);sim.room=p.room;sim.returnPos=copy(p.returnPos);sim.state.player=copy(p.player);sim.worldTrip=copy(p.trip);sim.elapsed=p.elapsed;sim.adventureRuntime=copy(p.runtime);
 sim.state.localLife.records[D.ID]={accepted:true,choice,steps:[],claimed:false};
 let revision=0,lease=Object.freeze({}),threat=()=>({clear:true});sim.consignmentOwnerLease=lease;
 const ctx=()=>({sim,active:'motion-component',revision:revision++,ownerLease:lease,definition:D.definition,threat});
 const state=()=>JSON.stringify(sim.state),tick=(dt=.1)=>{sim.tick(dt);const before=state(),elapsed=sim.elapsed,result=M.update(ctx(),dt);assert.equal(state(),before,'motion never writes Sim state');assert.equal(sim.elapsed,elapsed,'motion never writes elapsed');return result;};
 function follow(){const v=M.current(ctx());assert.ok(v);if(dist(sim.state.player,v)>.5){const p={...sim.state.player};if(W.segment(sim.room,p,v,.31)){const dt=Math.min(.1,dist(p,v)/3.2);sim.manual(v.x-p.x,v.z-p.z,dt);}else assert.ok(sim.moveTo(v.x,v.z).ok);assert.ok(W.segment(sim.room,p,sim.state.player,.31));}}
 function ready(){assert.ok(M.continue(ctx()).ok);let frames=0,last=M.current(ctx());while(!last.ready&&frames++<6000){follow();const result=tick();assert.ok(result.ok,result.error);const v=result.view;assert.ok(dist(last,v)<=.160000001,'independent speed bound');assert.ok(W.segment(D.ROOM,last,v,.65),'independent full physical support');assert.notEqual(v.status,'blocked',v.detail);last=v;}assert.ok(last.ready,'physical exact next arrival');return M.arrivalTicket(ctx()).ticket;}
 function commit(ticket,{refuse=false,extra=[],other=false,increment=1}={}){
  const step=D.required(choice)[sim.state.localLife.records[D.ID].steps.length],checked=M.validateArrival(ctx(),ticket,step);if(!checked.ok)return checked;
  if(refuse)return{ok:false,error:'Synthetic quota/capacity refusal; no candidate adopted.'};
  const next=copy(sim.state.localLife);next.records[D.ID].steps.push(step,...extra);if(other)next.records[D.OLD_IDS[0]].accepted=!next.records[D.OLD_IDS[0]].accepted;
  sim.state.localLife=next;sim.state.adventure.revision+=increment;return M.consume(ctx(),ticket);
 }
 return{sim,ctx,tick,follow,ready,commit,state,setThreat:fn=>{threat=fn;},mint:()=>{lease=Object.freeze({});sim.consignmentOwnerLease=lease;},setRevision:n=>{revision=n;}};
}
test('canonical routes and arrival IDs match independent frozen proposal oracle',()=>{
 assert.equal(M.DEFINITION,D.definition);assert.deepEqual(D.routes,oracle.ROUTES);for(const c of D.choices){assert.deepEqual(D.required(c.id),oracle.required(c.id));assert.equal(c.branch,oracle.CHOICES[c.id].branch);assert.equal(c.cargo.kind,oracle.CHOICES[c.id].cargoKind);}assert.deepEqual(M.LIMITS,{radius:.65,speed:1.6,approach:2.8,farWait:10,maxDt:.1});
});
test('accepted empty history is an immutable branded idle load at origin',()=>{
 const h=harness(),before=h.state(),v=M.current(h.ctx());assert.deepEqual({x:v.x,z:v.z,index:v.checkpointIndex},{x:-106,z:-105,index:0});assert.equal(v.cargoKind,'supplier-short-timber');assert.equal(v.status,'waiting');assert.ok(Object.isFrozen(v)&&Object.isFrozen(v.next));assert.ok(M.isProjection(v));assert.ok(M.isProjection(v,h.ctx()));assert.equal(M.isProjection(copy(v)),false);assert.equal(M.isProjection(v,{...h.ctx(),definition:copy(D.definition)}),false);assert.equal(h.state(),before);
});
test('player-only arrival and fabricated ticket cannot record worker progress',()=>{
 const h=harness(),v=M.current(h.ctx());assert.equal(M.arrivalTicket(h.ctx()).ok,false);assert.equal(M.validateArrival(h.ctx(),Object.freeze({kind:'earth-consignment-arrival-v1'}),'arrive-meadow-stop').ok,false);assert.equal(M.validateArrival(h.ctx(),v,'arrive-meadow-stop').ok,false);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);
});
test('the supplied record must retain real paid original branch provenance',()=>{
 const h=harness();h.sim.state.localLife.records[D.ID].choice='south-coppice';assert.equal(M.current(h.ctx()),null);h.sim.state.localLife.records[D.ID].choice='south-stormfall';h.sim.state.earthExpedition=E.fresh();assert.equal(M.current(h.ctx()),null);
});
test('unaccepted, claimed, skipped and unknown records cannot initialize motion',()=>{
 const h=harness();for(const r of[D.freshRecord(),{accepted:true,choice:'south-stormfall',steps:[],claimed:true},{accepted:true,choice:'south-stormfall',steps:['arrive-field-return-stop'],claimed:false},{accepted:true,choice:'wrong',steps:[],claimed:false}]){h.sim.state.localLife.records[D.ID]=r;assert.equal(M.current(h.ctx()),null);}
});
test('invalid lease specimens and a different real Sim are refused',()=>{
 const h=harness();const base=h.ctx();for(const lease of[null,{},Object.freeze({id:1}),Object.freeze([]),Object.freeze(Object.create({})),Object.freeze({})])assert.equal(M.continue({...base,ownerLease:lease}).ok,false);
 assert.equal(M.continue({...h.ctx(),sim:{...h.sim}}).ok,false);assert.equal(M.continue({...h.ctx(),revision:NaN}).ok,false);
});
test('Continue requires a supported near-player approach',()=>{
 const h=harness();walk(h.sim,-98,-105);const before=M.current(h.ctx());assert.ok(dist(before,h.sim.state.player)>2.8);assert.equal(M.continue(h.ctx()).ok,false);assert.equal(M.current(h.ctx()).x,before.x);
});
test('missing, invalid and throwing live-threat callbacks fail closed',()=>{
 const h=harness();for(const fn of[undefined,()=>null,()=>({clear:'yes'}),()=>({clear:true,reason:1}),async()=>({clear:true}),()=>({clear:true,then(){}}),()=>{throw Error('Roster unavailable');}]){h.setThreat(fn);const result=M.continue(h.ctx());assert.ok(result.ok);assert.equal(result.view.status,'blocked');assert.equal(result.view.reason,'threat-unavailable');assert.equal(result.view.x,-106);}
});
test('a real threat query suspends the current segment without combat or grants',()=>{
 const h=harness();assert.ok(M.continue(h.ctx()).ok);const before=h.state();let query;h.setThreat(q=>{query=q;return{clear:false,reason:'Living patrol crossing the load route.'};});h.sim.tick(.1);const baseline=h.state(),v=M.update(h.ctx(),.1).view;assert.equal(v.reason,'threat');assert.equal(v.status,'blocked');assert.equal(h.state(),baseline);assert.ok(Object.isFrozen(query)&&Object.isFrozen(query.from)&&query.radius===.65);assert.equal(v.x,-106);assert.notEqual(before,baseline,'only the actual Core tick advances clocks');h.setThreat(()=>({clear:true}));assert.equal(M.current(h.ctx()).status,'blocked','no automatic chase/resume');assert.equal(M.continue(h.ctx()).view.status,'moving');
});
test('repeated update without Core elapsed cannot create travel or a ticket',()=>{
 const h=harness();assert.ok(M.continue(h.ctx()).ok);assert.equal(M.update(h.ctx(),.1).ok,false);const v=h.tick().view;assert.equal(M.update(h.ctx(),.1).ok,false);assert.equal(dist(v,M.current(h.ctx())),0);assert.equal(M.arrivalTicket(h.ctx()).ok,false);
});
test('tiny dt cannot exploit floating tolerance to reuse a zero elapsed delta',()=>{
 const h=harness();assert.ok(M.continue(h.ctx()).ok);const start=M.current(h.ctx());for(let i=0;i<4;i++)assert.equal(M.update(h.ctx(),1e-12).ok,false);assert.equal(dist(start,M.current(h.ctx())),0);assert.equal(M.arrivalTicket(h.ctx()).ok,false);
});
test('dt bounds reject negative, nonfinite and hitch-sized steps',()=>{
 const h=harness();assert.ok(M.continue(h.ctx()).ok);const v=M.current(h.ctx());for(const dt of[-.1,NaN,Infinity,.1000001,1])assert.equal(M.update(h.ctx(),dt).ok,false);assert.equal(dist(v,M.current(h.ctx())),0);assert.ok(M.update(h.ctx(),0).ok);
});
test('pause and Wait retain position without catch-up',()=>{
 const h=harness();assert.ok(M.continue(h.ctx()).ok);const start=h.tick().view;h.sim.paused=true;for(let i=0;i<10;i++)assert.equal(dist(start,h.tick().view),0);assert.equal(M.current(h.ctx()).status,'paused');assert.equal(M.continue(h.ctx()).ok,false);assert.equal(M.wait(h.ctx()).view.status,'waiting');h.sim.paused=false;for(let i=0;i<20;i++)h.tick();assert.equal(dist(start,M.current(h.ctx())),0);assert.ok(M.continue(h.ctx()).ok);assert.ok(dist(start,h.tick().view)<=.160000001);
});
test('walking away beyond ten metres auto-waits; returning needs explicit Continue',()=>{
 const h=harness();assert.ok(M.continue(h.ctx()).ok);walk(h.sim,-92,-105);const v=h.tick().view;assert.equal(v.status,'waiting');assert.equal(v.reason,'player-far');assert.equal(v.x,-106);walk(h.sim,-106,-105);assert.equal(h.tick().view.status,'waiting');assert.equal(M.continue(h.ctx()).view.status,'moving');
});
test('actual camera/time edits and fresh observation revisions retain live motion',()=>{
 const h=harness();assert.ok(M.continue(h.ctx()).ok);const v=h.tick().view,lease=h.sim.consignmentOwnerLease;h.sim.setTime(9);h.sim.state.settings.cameraMode='tactical';h.sim.state.settings.cameraFov=45;h.setRevision(1234);assert.ok(M.isProjection(v,h.ctx()));assert.equal(h.sim.consignmentOwnerLease,lease);assert.ok(M.update(h.ctx(),0).ok);assert.equal(dist(v,M.current(h.ctx())),0);
});
for(const [name,change]of[
 ['lease',h=>h.mint()],['active',h=>{h.sim.worldTrip.active='another-owner';}],['state-import',h=>{h.sim.state=copy(h.sim.state);}],['adventure-owner',h=>{h.sim.state.adventure=copy(h.sim.state.adventure);}],['trip',h=>{h.sim.worldTrip=copy(h.sim.worldTrip);}],['home',h=>{h.sim.returnPos.x+=1;}],['scene',h=>{h.sim.room='world-heaven';}],['death',h=>{h.sim.state.adventure.hp=0;h.sim.state.adventure.deaths++;}],['clock-rewind',h=>{h.sim.elapsed=0;}],['changed-prefix',h=>{h.sim.state.localLife.records[D.ID].steps.push('arrive-meadow-stop');}]
])test(name+' expires existing projection and physical arrival proof',()=>{
 const h=harness(),ticket=h.ready(),v=M.current(h.ctx());assert.ok(M.isProjection(v));change(h);assert.equal(M.isProjection(v),false);assert.equal(M.validateArrival(h.ctx(),ticket,'arrive-meadow-stop').ok,false);assert.equal(M.consume(h.ctx(),ticket).ok,false);
});
test('reset abandons unsaved movement and resumes only last durable checkpoint',()=>{
 const h=harness();assert.ok(M.continue(h.ctx()).ok);for(let i=0;i<15;i++){h.follow();h.tick();}const old=M.current(h.ctx());assert.ok(old.distanceTraveled>0);assert.ok(M.reset(h.sim,'menu-owner-reset').ok);assert.equal(M.isProjection(old),false);const idle=M.current(h.ctx());assert.equal(idle.x,-106);assert.equal(idle.z,-105);assert.equal(idle.checkpointIndex,0);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);
});
test('exact physical arrival creates one branded ticket, never ledger progress',()=>{
 const h=harness(),baseline=copy(h.sim.state.localLife),ticket=h.ready(),v=M.current(h.ctx());assert.equal(v.x,-68);assert.equal(v.z,-99);assert.ok(v.ready&&!v.arrived);assert.deepEqual(h.sim.state.localLife,baseline);assert.equal(M.arrivalTicket(h.ctx()).ticket,ticket);assert.equal(M.validateArrival(h.ctx(),copy(ticket),'arrive-meadow-stop').ok,false);assert.equal(M.validateArrival(h.ctx(),ticket,'arrive-field-return-stop').ok,false);assert.equal(M.consume(h.ctx(),ticket).ok,false);assert.ok(M.validateArrival(h.ctx(),ticket,'arrive-meadow-stop').ok);
});
test('a ready arrival refuses remote recording but retains proof for approach retry',()=>{
 const h=harness(),ticket=h.ready();walk(h.sim,-62,-99);assert.equal(M.validateArrival(h.ctx(),ticket,'arrive-meadow-stop').ok,false);walk(h.sim,-68,-99);assert.ok(M.validateArrival(h.ctx(),ticket,'arrive-meadow-stop').ok);assert.equal(M.arrivalTicket(h.ctx()).ticket,ticket);
});
test('save refusal keeps ready ticket and exact unadvanced prefix for retry',()=>{
 const h=harness(),ticket=h.ready(),before=h.state();assert.equal(h.commit(ticket,{refuse:true}).ok,false);assert.equal(h.state(),before);assert.equal(M.arrivalTicket(h.ctx()).ticket,ticket);assert.ok(M.isProjection(M.current(h.ctx())));assert.ok(h.commit(ticket).ok);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,['arrive-meadow-stop']);assert.equal(M.validateArrival(h.ctx(),ticket,'arrive-meadow-stop').ok,false);assert.equal(M.consume(h.ctx(),ticket).ok,false);assert.equal(M.current(h.ctx()).status,'waiting');assert.equal(M.current(h.ctx()).checkpointIndex,1);
});
test('reading a paused menu retains ready proof and permits deliberate saved arrival',()=>{
 const h=harness(),ticket=h.ready(),before=M.current(h.ctx());h.sim.paused=true;assert.ok(M.current(h.ctx()).ready);assert.equal(M.arrivalTicket(h.ctx()).ticket,ticket);assert.ok(M.validateArrival(h.ctx(),ticket,'arrive-meadow-stop').ok);assert.ok(h.commit(ticket).ok);assert.equal(M.current(h.ctx()).checkpointIndex,1);assert.equal(dist(before,M.current(h.ctx())),0);assert.equal(M.continue(h.ctx()).ok,false);
});
for(const [name,options]of[['skip',{extra:['arrive-field-return-stop']}],['wrong-revision',{increment:2}],['other-ledger-change',{other:true}]])test('consume refuses '+name+' after candidate adoption',()=>{
 const h=harness(),ticket=h.ready();assert.equal(h.commit(ticket,options).ok,false);
});
test('consume refuses a structurally complete record unless validate preceded commit',()=>{
 const h=harness(),ticket=h.ready();h.sim.state.localLife.records[D.ID].steps.push('arrive-meadow-stop');h.sim.state.adventure.revision++;assert.equal(M.consume(h.ctx(),ticket).ok,false);
});
test('physical solver and full-segment failures stop without teleport',()=>{
 const h=harness(),pathfind=C.pathfind,segment=W.segment;assert.ok(M.continue(h.ctx()).ok);h.sim.tick(.1);const before=M.current(h.ctx());
 try{C.pathfind=()=>[{x:1000,z:1000}];const v=M.update(h.ctx(),.1).view;assert.equal(v.reason,'route-blocked');assert.equal(dist(before,v),0);}finally{C.pathfind=pathfind;}
 assert.ok(M.continue(h.ctx()).ok);h.sim.tick(.1);try{W.segment=()=>false;const v=M.update(h.ctx(),.1).view;assert.equal(v.reason,'route-blocked');assert.equal(dist(before,v),0);}finally{W.segment=segment;}
 assert.equal(M.arrivalTicket(h.ctx()).ok,false);
});
test('unsupported next checkpoint/path produces blocked feedback and no movement',()=>{
 const h=harness(),original=C.pathfind;try{C.pathfind=()=>null;const v=M.continue(h.ctx()).view;assert.equal(v.status,'blocked');assert.equal(v.reason,'route-blocked');assert.equal(v.x,-106);}finally{C.pathfind=original;}
});
module.exports={ROOT,F,C,W,E,A,CH,D,M,fixture,walk,copy,dist,harness};
