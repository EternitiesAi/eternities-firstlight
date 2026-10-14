'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/earth-tournament-model.js'),A=M.definition.arena;
const entry={x:A.x,z:A.z+3.2},facts=(extra={})=>({player:entry,paused:false,guarded:false,evading:false,...extra});
function begin(family='blade',record=M.fresh(),owner={}){
 const result=M.begin(record,{owner,family,player:entry});assert.equal(result.ok,true,result.error);
 return{...result,owner,family};
}
function to(b,phase){for(let i=0;M.snapshot(b.bout).phase!==phase;i++){
 assert.ok(i<1200,'phase is reachable');const r=M.advance(b.bout,.05,facts({guarded:true}));assert.ok(r.ok,r.error);
}}
function fire(b){const shot=M.attack(b.bout,{owner:b.owner,family:b.family,kind:'primary'});assert.ok(shot.ok);return shot.token;}
function finish(b,{reply=true,guarded=true}={}){
 const touched=new Set();
 for(let i=0;!M.snapshot(b.bout).complete;i++){
  assert.ok(i<1200,'bounded bout completion');const view=M.snapshot(b.bout);
  if(reply&&view.phase==='opening'&&!touched.has(view.round)){touched.add(view.round);assert.equal(M.hit(b.bout,fire(b),b.owner).ok,true);}
  const r=M.advance(b.bout,.05,facts({guarded}));assert.ok(r.ok,r.error);
 }
 return M.settle(b.record,b.bout,b.owner);
}

test('entry proposes one run and never edits the supplied ledger or owner',()=>{
 const record=M.fresh(),before=structuredClone(record),owner={character:'synthetic'};
 const b=begin('blade',record,owner);assert.deepEqual(record,before);assert.deepEqual(owner,{character:'synthetic'});
 assert.equal(b.record.issued,1);assert.equal(b.record.closed,0);assert.deepEqual(M.medals(b.record,'blade'),[]);
 assert.equal(M.begin(b.record,{owner,family:'blade',player:entry}).ok,false);
});
test('canonical records reject inherited, extra, future, impossible and unearned results',()=>{
 const corrupt=[q=>q.version=2,q=>q.extra=0,q=>q.issued=2,q=>q.closed=1,q=>q.issued=-1,
  q=>q.best.blade=6,q=>q.finished.blade=1,q=>q.best.bow=NaN,q=>q.finished.other=1,
  q=>q.best.blade=-1,q=>q.issued=1e9+1,q=>delete q.closed];
 for(const mutate of corrupt){const q=M.fresh();mutate(q);assert.throws(()=>M.validate(q));}
 assert.throws(()=>M.validate(Object.create(M.fresh())));
 const q=M.fresh();q[Symbol('extra')]=1;assert.throws(()=>M.validate(q));
 assert.throws(()=>M.validate({...M.fresh(),best:Object.create(M.fresh().best)}));
});
test('blade and bow each complete all declared exchanges for six finite points',()=>{
 for(const family of['blade','bow']){const b=begin(family),before=structuredClone(b.record),result=finish(b);
  assert.equal(result.ok,true);assert.equal(result.score,6);assert.equal(result.newMedals.length,3);
  assert.equal(result.record.best[family],6);assert.equal(result.record.finished[family],1);
  assert.ok(Math.abs(M.snapshot(b.bout).time-27)<1e-8);assert.deepEqual(b.record,before);
 }
});
test('the three listed intervals have the declared nine-second duration',()=>{
 for(const r of M.definition.rounds)assert.equal(r.ready+r.tell+r.opening+r.rest,9);
 assert.ok(Object.isFrozen(M.definition.rounds[0]));
});
test('ordinary misses cannot score merely from attack creation',()=>{
 const b=begin();to(b,'opening');const token=fire(b);assert.ok(token);
 assert.equal(M.snapshot(b.bout).score,1);assert.equal(M.snapshot(b.bout).rounds[0].reply,false);
});
test('a primary attack launched early and arriving in the opening forfeits only that reply',()=>{
 const b=begin();to(b,'tell');const token=fire(b);to(b,'opening');
 assert.equal(M.hit(b.bout,token,b.owner).foul,true);assert.equal(M.snapshot(b.bout).score,1);
 assert.equal(M.hit(b.bout,fire(b),b.owner).ok,false);assert.equal(M.snapshot(b.bout).rounds[0].early,true);
});
test('late arrival cannot revoke a reply already accepted in its opening',()=>{
 const b=begin();to(b,'opening');assert.equal(M.hit(b.bout,fire(b),b.owner).ok,true);
 const late=fire(b);to(b,'rest');const before=M.snapshot(b.bout);
 assert.equal(M.hit(b.bout,late,b.owner).ok,false);assert.deepEqual(M.snapshot(b.bout),before);
});
test('late arrival with no earlier reply is a miss, not an early-contact foul',()=>{
 const b=begin();to(b,'opening');const late=fire(b);to(b,'rest');
 assert.equal(M.hit(b.bout,late,b.owner).ok,false);assert.equal(M.snapshot(b.bout).rounds[0].early,false);
});
test('duplicate contact and fresh tokens cannot exceed one reply in an exchange',()=>{
 const b=begin();to(b,'opening');const token=fire(b);
 assert.equal(M.hit(b.bout,token,b.owner).ok,true);const before=M.snapshot(b.bout);
 assert.equal(M.hit(b.bout,token,b.owner).ok,false);assert.equal(M.hit(b.bout,fire(b),b.owner).ok,false);
 assert.deepEqual(M.snapshot(b.bout),before);assert.equal(before.score,2);
});
test('old projectiles and foreign bout tokens cannot score in another exchange or owner',()=>{
 const b=begin(),other=begin();to(b,'opening');const old=fire(b),foreign=fire(other);
 to(b,'rest');to(b,'ready');to(b,'opening');const before=M.snapshot(b.bout);
 assert.equal(M.hit(b.bout,old,b.owner).ok,false);assert.equal(M.hit(b.bout,foreign,b.owner).ok,false);
 assert.equal(M.hit(b.bout,fire(b),other.owner).ok,false);assert.deepEqual(M.snapshot(b.bout),before);
 assert.throws(()=>M.snapshot({run:1,family:'blade'}));
});
test('companion, class, special and mismatched family attacks never create scoring tokens',()=>{
 const b=begin();to(b,'opening');const before=M.snapshot(b.bout);
 for(const kind of['special','companion','cinder','primary-extra',null])assert.equal(M.attack(b.bout,{owner:b.owner,family:b.family,kind}).ok,false);
 assert.equal(M.attack(b.bout,{owner:b.owner,family:'bow',kind:'primary'}).ok,false);
 assert.equal(M.attack(b.bout,{owner:{},family:'blade',kind:'primary'}).ok,false);
 assert.deepEqual(M.snapshot(b.bout),before);
});
test('movement out of the locked ribbon and a live evade both count as sound defense',()=>{
 for(const method of['move','evade']){
  const b=begin();to(b,'tell');const observation=facts(method==='move'?{player:{x:A.x+3,z:A.z+1}}:{evading:true});
  for(let i=0;M.snapshot(b.bout).phase==='tell';i++){assert.ok(i<50);assert.ok(M.advance(b.bout,.05,observation).ok);}
  assert.equal(M.snapshot(b.bout).rounds[0].defense,true,method);
 }
});
test('an unguarded contact scores no defense and the ledger can retain a zero result',()=>{
 const b=begin(),r=finish(b,{reply:false,guarded:false});assert.equal(r.ok,true);assert.equal(r.score,0);
 assert.equal(r.record.best.blade,0);assert.equal(r.record.finished.blade,1);assert.deepEqual(r.newMedals,[]);
});
test('paused steps and invalid observations cannot silently advance the event',()=>{
 const b=begin(),before=M.snapshot(b.bout);
 assert.ok(M.advance(b.bout,.1,facts({paused:true})).ok);
 for(const dt of[NaN,Infinity,-.1,.5])assert.equal(M.advance(b.bout,dt,facts()).ok,false);
 assert.equal(M.advance(b.bout,.05,{player:entry}).ok,false);
 assert.equal(M.advance(b.bout,.05,facts({player:{x:NaN,z:0}})).ok,false);
 assert.deepEqual(M.snapshot(b.bout),before);
});
test('leaving the ring withdraws without converting partial proof into a reward',()=>{
 const b=begin();to(b,'opening');M.hit(b.bout,fire(b),b.owner);
 assert.equal(M.advance(b.bout,.05,facts({player:{x:A.x+6,z:A.z}})).events[0].type,'withdrawn');
 assert.equal(M.snapshot(b.bout).withdrawn,true);assert.equal(M.settle(b.record,b.bout,b.owner).ok,false);
 const closed=M.closeOutstanding(b.record);assert.equal(closed.record.closed,1);assert.equal(closed.record.best.blade,null);
});
test('cold records alone can withdraw, never reconstruct the unsaved live result',()=>{
 const b=begin();finish(b);const cold=JSON.parse(JSON.stringify(b.record));
 const result=M.closeOutstanding(cold);assert.equal(result.ok,true);assert.deepEqual(result.record.best,{blade:null,bow:null});
 assert.deepEqual(M.closeOutstanding(result.record).record,result.record);
 assert.equal(M.begin(cold,{owner:{},family:'blade',player:entry}).ok,false);
 assert.equal(begin('blade',result.record).record.issued,2);
});
test('failed adoption is retryable; adopted settlement is a no-op even after another run',()=>{
 const b=begin(),candidate=finish(b);assert.equal(M.settle(b.record,b.bout,b.owner).score,candidate.score);
 assert.deepEqual(M.settle(b.record,b.bout,b.owner),candidate);
 const replay=M.settle(candidate.record,b.bout,b.owner);assert.equal(replay.duplicate,true);assert.deepEqual(replay.newMedals,[]);
 const next=begin('blade',candidate.record),again=finish(next);assert.equal(again.record.issued,2);assert.equal(again.record.finished.blade,2);assert.deepEqual(again.newMedals,[]);
 assert.equal(M.settle(again.record,b.bout,b.owner).duplicate,true);
});
test('settlement refuses unfinished, foreign-owner or changed record input',()=>{
 const b=begin();assert.equal(M.settle(b.record,b.bout,b.owner).ok,false);const completed=finish(b);
 assert.equal(M.settle(b.record,b.bout,{}).ok,false);
 // A later CLOSED identity is deliberately an idempotent no-op (covered above).
 // Keep this outstanding identity and alter valid prior history instead.
 const next=begin('blade',completed.record);finish(next);const changed=structuredClone(next.record);
 changed.best.blade=5;assert.doesNotThrow(()=>M.validate(changed));
 assert.equal(M.settle(changed,next.bout,next.owner).ok,false);
});
test('returned views cannot mutate hidden proof or the finite medal definitions',()=>{
 const b=begin(),view=M.snapshot(b.bout);assert.throws(()=>view.rounds[0].reply=true);
 assert.throws(()=>M.definition.medals[0].score=0);assert.equal(M.snapshot(b.bout).score,0);
});
test('run identity exhaustion refuses instead of wrapping or resetting history',()=>{
 const q={...M.fresh(),issued:1e9,closed:1e9};assert.equal(M.begin(q,{owner:{},family:'blade',player:entry}).ok,false);
 assert.deepEqual(M.validate(q),q);
});
