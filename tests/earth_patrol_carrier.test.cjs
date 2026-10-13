/* Integrated CPU boundary fixtures, not earned outings/native persistence.
 * Valid planted histories/positions and synthetic Store transport are labelled.
 * Production geometry, command, validator and Store execute unchanged. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/earth-expedition.js'),CH=require('../src/characters.js');
const ENGINE=require('../src/engine.js'),copy=v=>JSON.parse(JSON.stringify(v));
const carrier=()=>require('../src/earth-patrol-carrier.js');
function fixture(branch='stormfall-recovery'){
 const sim=new C.Simulation();sim.state.adventure.started=true;
 sim.state.adventure.owned=['trail_blade','travel_coat'];sim.state.adventure.equipment.weapon='trail_blade';sim.state.adventure.equipment.armor='travel_coat';
 sim.state.earthExpedition.story={accepted:true,branch,steps:E.definition.steps.map(s=>s.id),claimed:true};
 sim.state.earthExpedition.patrol.active={run:1,steps:E.patrol.steps.slice(0,4).map(s=>s.id)};
 sim.returnPos={...sim.state.player};sim.room='world-earthlands';sim.state.player={x:-106,z:-105,yaw:0};
 const f={sim,active:'synthetic-carrier-owner',revision:7,lease:Object.freeze({}),writes:0,allow:true};
 sim.worldTrip={active:f.active,realm:'earthlands',home:copy(sim.returnPos)};sim.fieldcraftOwnerLease=f.lease;
 f.ctx=()=>({sim:f.sim,active:f.active,revision:f.revision,ownerLease:f.lease});
 f.save=v=>{f.writes++;if(!f.allow)return{ok:false,error:'labelled refused storage'};f.saved=C.validate(v);return{ok:true};};
 C.validate(sim.snapshot());return f;
}
function managed(){
 const f=fixture(),data=new Map(),storage={fail:false,getItem:k=>data.get(k)??null,setItem(k,v){if(this.fail)throw Error('labelled quota refusal');data.set(k,v);}};
 storage.setItem(CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:f.sim.snapshot()}]}));
 const store=new CH.Store(storage);store.load();store.writer=true;f.active=store.active;f.sim.worldTrip.active=f.active;
 f.storage=storage;f.store=store;f.ctx=()=>({sim:f.sim,active:store.active,revision:store.revision,ownerLease:f.lease});
 f.save=v=>{f.writes++;const r=store.save(v);if(r.ok)f.saved=C.validate(v);return r;};return f;
}
const bytes=f=>JSON.stringify(f.sim.snapshot());
const glade=(f,ticket)=>E.command(f.ctx(),'patrol-step',{quest:E.patrol.id,run:1,priorClaim:0,step:'inspect-glade',carrierTicket:ticket},{save:f.save});
const claim=f=>E.command(f.ctx(),'patrol-claim',{quest:E.patrol.id,run:1,priorClaim:0},{save:f.save});
function fit(f){
 const P=carrier(),start=P.begin(f.ctx());assert.ok(start.ok,start.error);let view=start.view,ticket;
 while(view.activePiece){
  const p=view.activePiece,r=view.receivers.find(r=>r.pieceId===p);
  assert.ok(P.inspect(f.ctx(),start.plan,p,r.id).ok);
  const adjusted=P.adjust(f.ctx(),start.plan,{pieceId:p,receiverId:r.id,...r.target});assert.ok(adjusted.ok,adjusted.error);
  const seated=P.seat(f.ctx(),start.plan,p);assert.ok(seated.ok,seated.error);view=seated.view;ticket=seated.ticket;
 }
 assert.ok(P.validate(f.ctx(),ticket).ok);return{plan:start.plan,ticket,view};
}
function giver(f){f.sim.state.player={x:E.patrol.giver.x,z:E.patrol.giver.z,yaw:0};}

test('bare incomplete glade cannot bypass three-piece authority or write',()=>{
 const f=fixture(),before=bytes(f);assert.equal(glade(f).ok,false);assert.equal(bytes(f),before);assert.equal(f.writes,0);
});
test('both supplied catalogues have fixed three-piece identities and old dimensions',()=>{
 const P=carrier(),a=P.definition('stormfall-recovery'),b=P.definition('managed-coppice');
 assert.deepEqual(a.pieces.map(p=>p.id),['billet-0','billet-1','billet-2']);assert.deepEqual(b.pieces.map(p=>p.id),['bundle','lashing-left','lashing-right']);
 assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.pieces[0].size));
 assert.deepEqual(a.pieces.map(p=>p.size),[[.22,.18,.40],[.22,.18,.40],[.22,.18,.40]]);
 assert.deepEqual(b.pieces.map(p=>p.size),[[.90,.18,.34],[.07,.24,.40],[.07,.24,.40]]);
 for(const branch of['invented','__proto__','constructor',null,{}])assert.equal(P.definition(branch),null);assert.equal(P.GEOMETRY.epsilon,2e-5);
});
test('fitting both allocations uses actual corners and changes no durable byte',()=>{
 const P=carrier();for(const branch of['stormfall-recovery','managed-coppice']){
  const f=fixture(branch),before=bytes(f),r=fit(f);assert.equal(bytes(f),before);assert.equal(f.writes,0);
  assert.equal(r.view.pieces.filter(p=>p.seated).length,3);assert.equal(r.view.status,'ready');
  for(const p of r.view.pieces){
   const m=ENGINE.M.compose(...p.position,...p.size,0,p.yaw,0),corners=[];
   for(const x of[-.5,.5])for(const y of[-.5,.5])for(const z of[-.5,.5])corners.push(ENGINE.M.transform(m,[x,y,z]));
   assert.deepEqual(p.corners,corners,'independent actual Engine corner enumeration');
   for(const q of corners){assert.ok(Math.abs(q[0]+104.8)<=.58002);assert.ok(Math.abs(q[2]+104.2)<=.29002);}
  }
  assert.equal(P.consume(r.ticket,{ok:true}).ok,false,'fake success cannot promote checked proof');
 }
});
test('receiver labels, order, wrong pose and nonfinite controls cannot seat',()=>{
 const P=carrier(),f=fixture(),s=P.begin(f.ctx()),before=bytes(f),p=s.view.activePiece,r=s.view.receivers[0];
 assert.equal(P.seat(f.ctx(),s.plan,p).ok,false);assert.equal(P.inspect(f.ctx(),s.plan,'billet-1',r.id).ok,false);
 assert.equal(P.inspect(f.ctx(),s.plan,p,'invented').ok,false);assert.ok(P.inspect(f.ctx(),s.plan,p,r.id).ok);
 for(const pose of[{x:NaN,z:0,yaw:0},{x:0,z:Infinity,yaw:0},{x:0,z:0,yaw:99},{x:0,z:0,yaw:0,pieceId:'billet-2'}])assert.equal(P.adjust(f.ctx(),s.plan,{pieceId:p,receiverId:r.id,...pose}).ok,false);
 assert.equal(P.seat(f.ctx(),s.plan,p).ok,false,'skewed supplied starting pose fails actual fit');
 const old=P.projection(s.plan);assert.equal(P.adjust(f.ctx(),s.plan,{pieceId:p,receiverId:r.id,x:-.7,z:0,yaw:0}).ok,false);assert.deepEqual(P.projection(s.plan),old,'refusal retains last valid pose');
 assert.equal(bytes(f),before);assert.equal(f.writes,0);
});
test('unfinished plan survives walking away but all actions require the glade',()=>{
 const P=carrier(),f=fixture(),s=P.begin(f.ctx());giver(f);assert.ok(P.isProjection(P.projection(s.plan),f.sim.state.earthExpedition));
 assert.equal(P.inspect(f.ctx(),s.plan,s.view.activePiece,s.view.receivers[0].id).ok,false);
 assert.equal(P.adjust(f.ctx(),s.plan,{pieceId:s.view.activePiece,receiverId:s.view.receivers[0].id,...s.view.receivers[0].target}).ok,false);assert.equal(P.seat(f.ctx(),s.plan,s.view.activePiece).ok,false);assert.equal(glade(f).ok,false);
 f.sim.state.player={x:-106,z:-105,yaw:0};assert.ok(P.inspect(f.ctx(),s.plan,s.view.activePiece,s.view.receivers[0].id).ok);
});
test('copied or foreign authority and forged adopted state cannot confirm inspection',()=>{
 const P=carrier(),f=fixture(),r=fit(f),before=bytes(f);
 for(const plan of[undefined,{},copy(r.plan)])assert.equal(P.projection(plan),null);
 for(const t of[undefined,{},copy(r.ticket),P.projection(r.plan),{kind:'earth-fieldcraft-v1-fitting'}])assert.equal(glade(f,t).ok,false);
 assert.equal(bytes(f),before);assert.equal(f.writes,0);
 f.sim.state.earthExpedition.patrol.active.steps.push('inspect-glade');f.sim.state.adventure.revision++;f.sim.state.journal.push({seq:f.sim.state.nextEvent++,day:f.sim.state.day,hour:f.sim.state.hour,kind:'earth-expedition',text:E.returnWork(f.sim).completed});C.validate(f.sim.snapshot());
 assert.equal(P.consume(r.ticket,{ok:true}).ok,false,'matching manually planted ledger/revision is not an actual command');
 assert.notEqual(P.current(f.sim)?.status,'checked');
});
test('actual refused Store commit retains fitting then consumes once on saved step',()=>{
 const P=carrier(),f=managed(),r=fit(f),before=bytes(f),stored=f.storage.getItem(CH.KEY);f.storage.fail=true;
 assert.equal(glade(f,r.ticket).ok,false);assert.equal(bytes(f),before);assert.equal(f.storage.getItem(CH.KEY),stored);assert.ok(P.validate(f.ctx(),r.ticket).ok);
 f.storage.fail=false;const result=glade(f,r.ticket);assert.ok(result.ok,result.error);assert.equal(result.warning,undefined);
 assert.equal(P.current(f.sim).status,'checked');assert.equal(P.validate(f.ctx(),r.ticket).ok,false);assert.equal(P.consume(r.ticket,result).ok,false);
 assert.ok(f.store.record.slots[0].world.earthExpedition.patrol.active.steps.includes('inspect-glade'));
 const done=bytes(f),writes=f.writes;assert.ok(glade(f).duplicate);assert.equal(bytes(f),done);assert.equal(f.writes,writes);
});
test('checked proof survives actual equip and an identical adopted ledger at current revision',()=>{
 const P=carrier(),f=fixture(),r=fit(f);assert.ok(glade(f,r.ticket).ok);const old=f.sim.state.earthExpedition,rev=f.sim.state.adventure.revision;
 const equipped=f.sim.adventureCommand('carrier-equip-control','equip',{id:'trail_blade'});assert.ok(equipped.ok,equipped.error);
 // Labelled candidate boundary: the production commit adopts an identical
 // ready ledger, without pretending home crafting can occur in this forest.
 assert.ok(E.commit(f.sim,f.sim.snapshot(),{save:f.save},'Labelled identical-ledger adoption control.').ok);
 giver(f);assert.notStrictEqual(f.sim.state.earthExpedition,old);assert.ok(f.sim.state.adventure.revision>rev);
 assert.equal(P.current(f.sim).status,'checked');assert.ok(claim(f).ok);assert.equal(P.current(f.sim).status,'paid');
});
test('payment capacity refusal preserves checked work and atomic retry',()=>{
 const P=carrier();for(const[key,n]of[['coins',9996],['ore',9997],['wood',998],['fiber',998]]){
  const f=fixture(),r=fit(f);assert.ok(glade(f,r.ticket).ok);giver(f);const target=['coins','ore'].includes(key)?f.sim.state.adventure:f.sim.state.sandbox.inventory;
  const prior=target[key];target[key]=n;const before=bytes(f),writes=f.writes;assert.equal(claim(f).ok,false);assert.equal(bytes(f),before);assert.equal(f.writes,writes);assert.equal(P.current(f.sim).status,'checked');
  target[key]=prior;const result=claim(f);assert.ok(result.ok,result.error);assert.deepEqual(result.reward,E.patrol.reward);assert.equal(P.current(f.sim).status,'paid');
  const paid=bytes(f);assert.ok(claim(f).duplicate);assert.equal(bytes(f),paid);
 }
});
test('legacy recorded ready claim remains valid without live module or recognition',()=>{
 const P=carrier(),f=fixture();f.sim.state.earthExpedition.patrol.active.steps.push('inspect-glade');giver(f);
 const before=f.sim.snapshot(),previous=globalThis.RealmEarthPatrolCarrier;let result;try{globalThis.RealmEarthPatrolCarrier=undefined;result=claim(f);assert.ok(result.ok);}finally{globalThis.RealmEarthPatrolCarrier=previous;}
 assert.deepEqual(result.reward,E.patrol.reward);assert.equal(f.sim.state.adventure.revision,before.adventure.revision+1);assert.equal(f.sim.state.nextEvent,before.nextEvent+1);assert.equal(f.sim.state.journal.at(-1).kind,'earth-expedition');
 for(const k of['xp','coins','ore'])assert.equal(f.sim.state.adventure[k]-before.adventure[k],E.patrol.reward[k]);for(const k of['wood','fiber'])assert.equal(f.sim.state.sandbox.inventory[k]-before.sandbox.inventory[k],2);
 assert.deepEqual(f.sim.state.earthExpedition.patrol,{lastClaim:1,active:null});assert.equal(P.current(f.sim),null);const paid=bytes(f),writes=f.writes;assert.ok(claim(f).duplicate);assert.equal(bytes(f),paid);assert.equal(f.writes,writes);
});
test('owner changes revoke fitting and checked proof while saved steps survive',()=>{
 const P=carrier();for(const checked of[false,true])for(const change of['lease','death','home','trip','adventure','run','branch']){
  const f=fixture(),r=fit(f);if(checked)assert.ok(glade(f,r.ticket).ok);
  if(change==='lease')f.sim.fieldcraftOwnerLease=Object.freeze({});
  if(change==='death')f.sim.state.adventure.deaths++;
  if(change==='home')f.sim.returnPos.x++;
  if(change==='trip')f.sim.worldTrip={...f.sim.worldTrip};
  if(change==='adventure')f.sim.state.adventure=copy(f.sim.state.adventure);
  if(change==='run'){f.sim.state.earthExpedition.patrol.lastClaim=1;f.sim.state.earthExpedition.patrol.active={run:2,steps:[]};}
  if(change==='branch')f.sim.state.earthExpedition.story.branch='managed-coppice';
  assert.equal(P.current(f.sim),null,change);assert.equal(P.validate(f.ctx(),r.ticket).ok,false,change);
  if(checked&&change!=='run')assert.ok(f.sim.state.earthExpedition.patrol.active.steps.includes('inspect-glade'));
 }
});
test('fake and stale claim acknowledgement cannot fabricate local paid presentation',()=>{
 const P=carrier(),f=fixture(),r=fit(f);assert.ok(glade(f,r.ticket).ok);giver(f);const a=P.prepareClaim(f.ctx());assert.ok(a);
 assert.equal(P.acknowledgeClaim(a,{ok:true}).ok,false);f.sim.state.adventure.revision++;
 const result=claim(f);assert.ok(result.ok,result.error);assert.equal(P.acknowledgeClaim(a,result).ok,false,'old prepared revision cannot consume later actual result');
 assert.equal(P.current(f.sim).status,'paid');
});
test('legal preview bounds still reject tray overhang, tab and dependent-lashing escape',()=>{
 const P=carrier(),f=fixture(),s=P.begin(f.ctx()),old=P.projection(s.plan),r=old.receivers[0],id=old.activePiece;
 for(const pose of[{x:-.5,z:0,yaw:0},{x:0,z:.06,yaw:0}]){
  assert.equal(P.adjust(f.ctx(),s.plan,{pieceId:id,receiverId:r.id,...pose}).ok,false);assert.deepEqual(P.projection(s.plan),old);
 }
 const g=fixture('managed-coppice'),a=P.begin(g.ctx()),before=P.projection(a.plan),receiver=before.receivers[0];
 assert.equal(P.adjust(g.ctx(),a.plan,{pieceId:'bundle',receiverId:receiver.id,x:0,z:-.10,yaw:0}).ok,false,'bundle alone fits but waiting lashings leave tray');assert.deepEqual(P.projection(a.plan),before);
});
test('nonzero seated bundle owns relative lashing poses with independent world arithmetic',()=>{
 const P=carrier(),f=fixture('managed-coppice'),s=P.begin(f.ctx()),bundle={x:.010,z:.005,yaw:.020};let view=s.view;
 while(view.activePiece){const id=view.activePiece,r=view.receivers.find(r=>r.pieceId===id);assert.ok(P.inspect(f.ctx(),s.plan,id,r.id).ok);
  assert.ok(P.adjust(f.ctx(),s.plan,{pieceId:id,receiverId:r.id,...(id==='bundle'?bundle:r.target)}).ok);
  const seated=P.seat(f.ctx(),s.plan,id);assert.ok(seated.ok,seated.error);view=seated.view;
  for(const p of view.pieces)for(const q of p.corners){assert.ok(Math.abs(q[0]+104.8)<=.58002);assert.ok(Math.abs(q[2]+104.2)<=.29002);}
 }
 for(const[id,x,size]of[['bundle',0,[.90,.18,.34]],['lashing-left',-.26,[.07,.24,.40]],['lashing-right',.26,[.07,.24,.40]]]){
  const p=view.pieces.find(p=>p.id===id),c=Math.cos(bundle.yaw),sine=Math.sin(bundle.yaw),cx=-104.8+bundle.x+c*x,cz=-104.2+bundle.z-sine*x;
  assert.ok(Math.abs(p.position[0]-cx)<1e-12);assert.ok(Math.abs(p.position[2]-cz)<1e-12);assert.ok(Math.abs(p.yaw-bundle.yaw)<1e-12);
  let i=0;for(const dx of[-size[0]/2,size[0]/2])for(const dy of[-size[1]/2,size[1]/2])for(const dz of[-size[2]/2,size[2]/2]){
   const expected=[cx+c*dx+sine*dz,2.18+dy,cz-sine*dx+c*dz];assert.ok(expected.every((n,j)=>Math.abs(p.corners[i][j]-n)<=2e-5),'independent analytic world corner');i++;
  }
 }
});
test('literal billet center and yaw boundaries are evaluated before seating',()=>{
 const P=carrier(),f=fixture(),s=P.begin(f.ctx()),r=s.view.receivers[0],id=s.view.activePiece;assert.ok(P.inspect(f.ctx(),s.plan,id,r.id).ok);
 for(const pose of[{x:-.3855,z:0,yaw:0},{x:-.36,z:0,yaw:3.01*Math.PI/180}]){assert.ok(P.adjust(f.ctx(),s.plan,{pieceId:id,receiverId:r.id,...pose}).ok);assert.equal(P.seat(f.ctx(),s.plan,id).ok,false);}
 assert.ok(P.adjust(f.ctx(),s.plan,{pieceId:id,receiverId:r.id,x:-.385,z:.020,yaw:3*Math.PI/180}).ok);assert.ok(P.seat(f.ctx(),s.plan,id).ok);
});

test('authenticated diagnostics report independent signed errors and geometric limits without seating',()=>{
 const P=carrier(),f=fixture('managed-coppice'),s=P.begin(f.ctx()),before=bytes(f),p=s.view.pieces[0],d=p.diagnostics;
 assert.ok(Object.isFrozen(d)&&Object.isFrozen(d.offset));assert.equal(d.offset.x,.04);assert.equal(d.tolerance.x,.015);assert.ok(Math.abs((d.offset.yaw-d.tolerance.yaw)*180/Math.PI-3.729577951308232)<1e-12);
 // Independent rotated rectangle half-depth: .45*sin(.1)+.17*cos(.1).
 assert.ok(Math.abs(d.receiverOverhang.z-(.45*Math.sin(.1)+.17*Math.cos(.1)-.20))<2e-5);assert.equal(p.fits,false);assert.equal(d.trayClear,true);assert.equal(d.tabClear,true);assert.equal(d.lashingEndsClear,true);assert.equal(bytes(f),before);
 assert.ok(P.inspect(f.ctx(),s.plan,p.id,s.view.receivers[0].id).ok);assert.ok(P.adjust(f.ctx(),s.plan,{pieceId:p.id,receiverId:s.view.receivers[0].id,x:.010,z:.005,yaw:.020}).ok);let seated=P.seat(f.ctx(),s.plan,p.id);assert.ok(seated.ok);
 const l=seated.view.pieces.find(p=>p.id==='lashing-left'),ld=l.diagnostics;assert.ok(Math.abs(ld.offset.x-.03)<1e-12);assert.equal(ld.offset.z,-.035);assert.equal(ld.lashingEndsClear,false,'independent lower end exceeds required .185 clearance');
 const r=seated.view.receivers.find(r=>r.pieceId===l.id);assert.ok(P.inspect(f.ctx(),s.plan,l.id,r.id).ok);assert.ok(P.adjust(f.ctx(),s.plan,{pieceId:l.id,receiverId:r.id,...r.target}).ok);seated=P.seat(f.ctx(),s.plan,l.id);assert.ok(seated.ok);assert.equal(seated.view.pieces.find(p=>p.id===l.id).diagnostics.lashingEndsClear,true);
 const g=fixture('managed-coppice'),b=P.begin(g.ctx()),unchanged=P.projection(b.plan),bad=P.adjust(g.ctx(),b.plan,{pieceId:'bundle',receiverId:unchanged.receivers[0].id,x:0,z:-.10,yaw:0});assert.equal(bad.ok,false);assert.match(bad.error,/lashing-left.*last valid pose stays/);assert.deepEqual(P.projection(b.plan),unchanged);
});
test('actual Store claim refusal preserves exact bytes and checked proof for retry',()=>{
 const P=carrier(),f=managed(),r=fit(f);assert.ok(glade(f,r.ticket).ok);giver(f);const before=bytes(f),raw=f.storage.getItem(CH.KEY),revision=f.store.revision;f.storage.fail=true;
 assert.equal(claim(f).ok,false);assert.equal(bytes(f),before);assert.equal(f.storage.getItem(CH.KEY),raw);assert.equal(f.store.revision,revision);assert.equal(P.current(f.sim).status,'checked');
 f.storage.fail=false;assert.ok(claim(f).ok);assert.equal(P.current(f.sim).status,'paid');const paid=bytes(f),stored=f.storage.getItem(CH.KEY),rev=f.store.revision;assert.ok(claim(f).duplicate);assert.equal(bytes(f),paid);assert.equal(f.storage.getItem(CH.KEY),stored);assert.equal(f.store.revision,rev);
});
test('direct durable commit and promised saver cannot fabricate command witness',()=>{
 const P=carrier();{
  const f=fixture(),r=fit(f),candidate=f.sim.snapshot();candidate.earthExpedition.patrol.active.steps.push('inspect-glade');
  const result=E.commit(f.sim,candidate,{save:f.save},'Labelled direct ready-ledger adoption, not a command.');assert.ok(result.ok);assert.equal(P.consume(r.ticket,result).ok,false);assert.notEqual(P.current(f.sim)?.status,'checked');
 }
 {
  const f=fixture(),r=fit(f),before=bytes(f);f.save=()=>Promise.resolve({ok:true});assert.equal(glade(f,r.ticket).ok,false);assert.equal(bytes(f),before);assert.ok(P.validate(f.ctx(),r.ticket).ok);
  // This explicit promise transport performs no external write. The rule's
  // refusal alone cannot prove a third party saver had no external effects.
 }
});
