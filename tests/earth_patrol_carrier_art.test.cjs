/* Actual read-only part submission with labelled CPU histories/positions.
 * No rendered pixels, browser, GPU or earned encounter claim. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/earth-expedition.js');require('../src/engine.js');require('../src/earth-fieldcraft-art.js');
const P=require('../src/earth-patrol-carrier.js'),ART=require('../src/earth-patrol-carrier-art.js'),OLD=require('../src/earth-expedition-art.js');
const copy=v=>JSON.parse(JSON.stringify(v));
function fixture(branch='managed-coppice'){
 const sim=new C.Simulation();sim.state.adventure.started=true;sim.state.adventure.owned=['trail_blade','travel_coat'];sim.state.adventure.equipment.weapon='trail_blade';sim.state.adventure.equipment.armor='travel_coat';
 sim.state.earthExpedition.story={accepted:true,branch,steps:E.definition.steps.map(s=>s.id),claimed:true};sim.state.earthExpedition.patrol.active={run:1,steps:E.patrol.steps.slice(0,4).map(s=>s.id)};
 sim.returnPos={...sim.state.player};sim.room='world-earthlands';sim.state.player={x:-106,z:-105,yaw:0};
 const lease=Object.freeze({}),ctx={sim,active:'synthetic-carrier-art',revision:1,ownerLease:lease};sim.fieldcraftOwnerLease=lease;sim.worldTrip={active:ctx.active,realm:'earthlands',home:copy(sim.returnPos)};
 const save=v=>{C.validate(v);return{ok:true};};C.validate(sim.snapshot());return{sim,ctx,save};
}
function fitted(f){const s=P.begin(f.ctx);assert.ok(s.ok);let view=s.view,ticket;while(view.activePiece){const r=view.receivers.find(r=>r.pieceId===view.activePiece);assert.ok(P.inspect(f.ctx,s.plan,r.pieceId,r.id).ok);assert.ok(P.adjust(f.ctx,s.plan,{pieceId:r.pieceId,receiverId:r.id,...r.target}).ok);const n=P.seat(f.ctx,s.plan,r.pieceId);assert.ok(n.ok);view=n.view;ticket=n.ticket;}return{plan:s.plan,ticket};}
test('only a current private projection can submit live kit geometry',()=>{
 const f=fixture(),s=P.begin(f.ctx),l=f.sim.state.earthExpedition,before=JSON.stringify(f.sim.snapshot());
 for(const v of[null,{},copy(s.view),{kind:s.view.kind,status:'paid'}])assert.deepEqual(ART.parts(l,v),[]);
 assert.deepEqual(ART.parts(copy(l),s.view),[]);assert.equal(JSON.stringify(f.sim.snapshot()),before);
});
test('live poses replace only borrowed bodies; old tray, tag and first repair remain',()=>{
 for(const branch of['stormfall-recovery','managed-coppice']){
  const f=fixture(branch),before=f.sim.snapshot(),s=P.begin(f.ctx),l=f.sim.state.earthExpedition,neutral=OLD.parts(l),live=OLD.parts(l,null,s.view);
  const stable=p=>!/^patrol-(billet|lashing|test)/.test(p.opt.expeditionPart)&&!p.opt.carrierPart;
  assert.deepEqual(live.filter(stable),neutral.filter(stable));assert.equal(live.filter(p=>p.opt.carrierPart==='carrier-loose-piece').length,3);
  assert.ok(!live.some(p=>/^patrol-(billet|lashing|test)/.test(p.opt.expeditionPart)));assert.ok(live.some(p=>p.opt.carrierPart==='carrier-receiver-edge'));
  assert.deepEqual(f.sim.snapshot(),before);
 }
});
test('recorded live pieces preserve their supplied dimensions and old ready fallback stays neutral',()=>{
 const f=fixture(),r=fitted(f),result=E.command(f.ctx,'patrol-step',{quest:E.patrol.id,run:1,priorClaim:0,step:'inspect-glade',carrierTicket:r.ticket},{save:f.save});assert.ok(result.ok);
 const l=f.sim.state.earthExpedition,v=P.current(f.sim),live=ART.parts(l,v),neutral=OLD.parts(l);
 assert.equal(live.filter(p=>p.opt.carrierPart==='carrier-seated-piece').length,3);assert.equal(live.filter(p=>p.opt.carrierPart==='carrier-seated-piece'&&p.kind==='box').length,2);
 assert.ok(live.filter(p=>p.kind==='box').every(p=>p.s[0]===.07));assert.ok(neutral.filter(p=>p.opt.expeditionPart==='patrol-lashing-seated').every(p=>p.s[0]===.035));
 assert.ok(live.every(p=>p.opt.appearanceOnly&&!p.opt.cameraSolid&&!p.opt.cutaway));
});
test('actual paid command projects a local receiving tray and never adds a ledger field',()=>{
 const f=fixture(),r=fitted(f);assert.ok(E.command(f.ctx,'patrol-step',{quest:E.patrol.id,run:1,priorClaim:0,step:'inspect-glade',carrierTicket:r.ticket},{save:f.save}).ok);
 f.sim.state.player={x:E.patrol.giver.x,z:E.patrol.giver.z,yaw:0};assert.ok(E.command(f.ctx,'patrol-claim',{quest:E.patrol.id,run:1,priorClaim:0},{save:f.save}).ok);
 const before=f.sim.snapshot(),parts=OLD.parts(f.sim.state.earthExpedition,null,P.current(f.sim));
 assert.equal(parts.filter(p=>p.opt.carrierPart==='carrier-received-piece').length,3);assert.equal(parts.filter(p=>p.opt.carrierPart==='carrier-receiving-tray').length,1);
 assert.ok(parts.filter(p=>p.opt.carrierPart).every(p=>Math.hypot(p.p[0]-E.patrol.giver.x,p.p[2]-E.patrol.giver.z)<2.8));
 assert.ok(!parts.some(p=>p.opt.patrolRun===1));assert.deepEqual(Object.keys(before.earthExpedition),['version','story','patrol']);assert.deepEqual(f.sim.snapshot(),before);
 const reloaded=new C.Simulation(before);assert.equal(P.current(reloaded),null);assert.ok(!OLD.parts(reloaded.state.earthExpedition).some(p=>p.opt.carrierPart));
});
test('both-view Low and reduced-motion settings preserve exact readonly live submission',()=>{
 const f=fixture(),s=P.begin(f.ctx),baseline=ART.parts(f.sim.state.earthExpedition,s.view);
 for(const quality of['low','balanced','high'])for(const cameraMode of['follow','adventure'])for(const reducedMotion of[false,true]){
  Object.assign(f.sim.state.settings,{quality,cameraMode,reducedMotion});const before=f.sim.snapshot(),parts=ART.parts(f.sim.state.earthExpedition,P.current(f.sim));
  assert.deepEqual(parts,baseline);assert.deepEqual(f.sim.snapshot(),before);for(const p of parts)assert.ok([...p.p,...p.s,...p.opt.r].every(Number.isFinite));
 }
});
