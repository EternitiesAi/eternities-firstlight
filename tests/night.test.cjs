'use strict';
/* The night the warning failed: validation, inference from old saves, the begin trigger, command refusals and duplicate
 * identity, the device and envoy rules, Briar's absence (companion hidden, insight refused, empty bowl, skill disabled)
 * and the tracker's soft line. Fixtures are the crossing journey's own earned chapter-IV save, written to a temp folder. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),A=require(path.join(ROOT,'src/adventure.js')),SG=require(path.join(ROOT,'src/saga.js'));
const N=require(path.join(ROOT,'src/night.js')),X=require(path.join(ROOT,'src/crossing.js'));
require(path.join(ROOT,'src/briar-outing.js'));require(path.join(ROOT,'src/night-art.js'));require(path.join(ROOT,'src/night-ui.js'));
const NightUI=globalThis.RealmNightUI.NightUI;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'night-'));
require(path.join(__dirname,'crossing_journey.cjs')).journey({out:tmp});
const earned=()=>JSON.parse(fs.readFileSync(path.join(tmp,'CHAPTER_IV_COMPLETE_EARNED.json'),'utf8'));
let n=0;const id=p=>'night-unit-'+(++n)+'-'+p;
function sim(edit){const raw=earned();if(edit)edit(raw);return new C.Simulation(C.validate(raw));}
// Walk the player to the commons waystone and travel to the crossing: a visit, which is what starts the night.
function visitCrossing(s){s.state.player={x:0,z:3,yaw:0};const r=s.adventureCommand(id('travel'),'waystone-travel',{id:'bellweather'});assert.ok(r.ok,r.error);s.tick(.05);return s;}
function lit(edit){return visitCrossing(sim(edit));}
const allSafe=s=>{s.state.night.safe=N.TRAVELLERS.map(t=>t.id);};
const slainAll=s=>{N.runtime(s).slain=N.CLAIMS.map(c=>c.id);};
const at=(s,p)=>{s.state.player={x:p.x,z:p.z,yaw:0};};
const step=(s,t)=>{for(let i=0;i<Math.round(t/.05);i++)s.tick(.05);};

test('the night owner validates, round-trips, and refuses malformed records by name',()=>{
 const f=N.fresh();assert.deepEqual(N.validate(f),f);
 assert.throws(()=>N.validate({...f,device:'nope'}),{message:'Invalid night: device'});
 assert.throws(()=>N.validate({...f,safe:['tessa','tessa']}),{message:'Invalid night: safe'});
 assert.throws(()=>N.validate({...f,envoy:true}),{message:'Invalid night: before the night'});
 assert.throws(()=>N.validate({...f,started:true},C.fresh()),{message:'Invalid night: night before bellweather'});
 assert.throws(()=>N.validate({...f,started:true,device:'broken',safe:['tessa']}),{message:'Invalid night: device before the travellers'});
 const s=lit();const snap=JSON.parse(JSON.stringify(s.snapshot()));assert.deepEqual(C.validate(snap).night,s.state.night);
});

test('old saves infer the night from what they already hold; a save past the night is whole',()=>{
 const raw=earned();delete raw.night;delete raw.saga;const old=C.validate(raw);
 assert.equal(old.night.started,false);assert.equal(old.night.device,'hidden');assert.equal(old.saga.briar.state,'with');
 const past=earned();delete past.night;past.saga.beats.night={day:past.day};past.saga.briar={state:'taken',habit:{},takenDay:past.day};
 const inferred=C.validate(past).night;assert.equal(inferred.started,true);assert.equal(inferred.device,'broken');assert.deepEqual(inferred.safe,N.TRAVELLERS.map(t=>t.id));
});

test('the night begins on a visit to the crossing, not in the visit that rang the bell',()=>{
 const s=sim();assert.equal(s.state.night.started,false);step(s,.5);assert.equal(s.state.night.started,false);
 visitCrossing(s);assert.equal(s.state.night.started,true);assert.equal(N.stage(s.state),'lit');
 assert.equal(A.runtime(s).enemies.filter(e=>e.nightClaim).length,N.CLAIMS.length);
 assert.equal(A.runtime(s).companion.room,'crossing');
});

test('a claim wraith on the far bank does not go home just because the player is south of the crossing rule line',()=>{
 const s=lit();at(s,{x:17.5,z:18});step(s,.05);const c2=A.runtime(s).enemies.find(e=>e.id==='claim-2');c2.x=19.8;c2.z=15.4;
 step(s,.5);assert.notEqual(c2.mode,'return');
});

test('command refusals name the reason and duplicates replay without a second effect',()=>{
 const s=lit();
 assert.deepEqual(pick(s.adventureCommand(id('g'),'night-call',{group:'z'})),{ok:false,error:'Unknown group.'});
 assert.equal(s.adventureCommand(id('far'),'night-call',{group:'a'}).error,'Walk closer to them first.');
 assert.equal(s.adventureCommand(id('env'),'night-envoy',{}).error,'There is nothing to say at the spring tonight.');
 assert.equal(s.adventureCommand(id('brk'),'night-break',{}).error,'Briar is the one who breaks it.');
 at(s,{x:17.6,z:21.2});const cid=id('call');const first=s.adventureCommand(cid,'night-call',{group:'a'});assert.equal(first.ok,true);
 const events=s.state.journal.length;
 const again=s.adventureCommand(cid,'night-call',{group:'a'});assert.equal(again.ok,true);assert.equal(again.duplicate,true);assert.equal(s.state.journal.length,events);
 assert.equal(s.adventureCommand(cid,'night-call',{group:'b'}).error,'Command identity reused with different terms.');
});

test('a traveller reaching the safe ground is across for good, and the device waits for all five',()=>{
 const s=lit();step(s,6);at(s,{x:17.6,z:21.2});assert.equal(s.adventureCommand(id('call'),'night-call',{group:'a'}).ok,true);
 const q=N.travellerState(s,'tessa');q.x=6.5;q.z=21.5;step(s,.2);
 assert.deepEqual(s.state.night.safe,['tessa']);
 assert.equal(s.state.night.device,'found',s.state.night.device);
 at(s,{x:16.4,z:18});assert.equal(s.adventureCommand(id('brk'),'night-break',{}).error,'Briar is the one who breaks it.');
});

test('breaking the device with Briar takes her, marks the night, and leaves the valley without her',()=>{
 const s=lit();allSafe(s);slainAll(s);s.state.night.device='found';at(s,{x:16.4,z:18});
 step(s,.1);
 assert.equal(s.state.night.device,'broken');assert.equal(s.state.saga.briar.state,'taken');assert.equal(SG.done(s.state,'night'),true);
 assert.equal(N.stage(s.state),'quiet');
 step(s,3.2);
 const c=A.runtime(s).companion;assert.equal(c.room,'away');
 const before={x:c.x,z:c.z};at(s,{x:4,z:-4});step(s,2);assert.deepEqual({x:c.x,z:c.z},before);
 assert.equal(s.adventureCommand(id('ins'),'insight',{}).error,'Briar is gone.');
 const snap=JSON.parse(JSON.stringify(s.snapshot()));assert.equal(C.validate(snap).saga.briar.state,'taken');
});

test('a never-bonded save still gets the night: Tessa finds the device and the player breaks it',()=>{
 const s=sim();s.state.adventure.companion.bonded=false;visitCrossing(s);
 assert.equal(N.runtime(s).drive,false);
 step(s,.2);assert.equal(s.state.night.device,'hidden');
 allSafeExcept(s,'tessa');step(s,.2);assert.equal(s.state.night.device,'hidden');
 s.state.night.safe=['tessa'];step(s,.2);assert.equal(s.state.night.device,'found');
 assert.equal(s.adventureCommand(id('early'),'night-break',{}).error,'The last of them are still on the far bank.');
 allSafe(s);slainAll(s);at(s,{x:16.4,z:18});
 const r=s.adventureCommand(id('you'),'night-break',{});assert.equal(r.ok,true,r.error);
 assert.equal(s.state.night.device,'broken');assert.equal(s.state.saga.briar.state,'with');assert.equal(SG.done(s.state,'night'),true);
});
function allSafeExcept(s,skip){s.state.night.safe=N.TRAVELLERS.map(t=>t.id).filter(x=>x!==skip);}

test('the envoy speaks only at the spring, after walking up to him, and never bargains',()=>{
 const s=lit();allSafe(s);slainAll(s);s.state.night.device='found';at(s,{x:16.4,z:18});step(s,.1);
 s.leave();at(s,{x:0,z:3});
 assert.equal(s.adventureCommand(id('early'),'night-envoy',{}).error,'The envoy has not come to the spring yet.');
 step(s,3.4);assert.equal(N.envoyPos(s).arrived,true);
 at(s,{x:-1.6,z:4.2});const r=s.adventureCommand(id('talk'),'night-envoy',{});assert.equal(r.ok,true,r.error);
 assert.ok(r.lines.length>0);assert.deepEqual(r.lines,N.sceneOf('envoy',s.state).lines);assert.equal(N.stage(s.state),'over');
 assert.doesNotMatch(r.lines.map(l=>l.text).join(' '),/\b(fee|fees|claim|provisional|prototype|epoch|luna|realm 10)\b/i);
});

test('the tracker keeps a soft line while the night is quiet, and only shows the lead while travellers are out',()=>{
 const s=lit();let o=N.objective(s);assert.equal(o.title,'Lead the travellers out');
 allSafe(s);s.state.night.device='found';o=N.objective(s);assert.equal(o.title,'The severing device');
 slainAll(s);at(s,{x:16.4,z:18});step(s,.1);
 at(s,{x:16.4,z:18});assert.equal(N.objective(s).title,'The bridge is quiet.');
 at(s,{x:0,z:3});assert.equal(N.objective(s).title,'Go home.');
});

test('the absence reaches the skill button and the empty bowl, and nothing else goes missing',()=>{
 const els={};global.document={querySelector:sel=>els[sel]||(els[sel]={disabled:false,title:'',textContent:'',setAttribute(k,v){this[k]=v;}})};
 try{
  const s=lit();allSafe(s);slainAll(s);s.state.night.device='found';at(s,{x:16.4,z:18});step(s,.1);
  s.leave();step(s,3.2);
  const rpg={sim:s,quest:'story',api:{toast(){}},run(){},open(){},tick(){}};
  new NightUI(rpg).tick();
  assert.equal(els['#skill-insight'].disabled,true);assert.equal(els['#skill-insight'].title,'Briar is gone.');
  const out={box:[],octa:[],disc:[],round:[]},art={e:{},person(){}};
  globalThis.RealmNightArt.draw(out,s,1,art);
  assert.ok(out.box.some(b=>b.briarOutingPart==='bowl-empty'),'empty bowl drawn');
  assert.equal(out.box.some(b=>b.briarOutingPart==='bowl'),false,'no filled bowl');
 }finally{delete global.document;}
});
// The story-script hooks: all-safe, the receipt, the bowl, the device choice with its aftermath, and the never-bonded lines.
const SCRIPT=require(path.join(ROOT,'src/story-script.js'));
function queued(s){const q=[];let p;while((p=N.takePending(s)))q.push(p);return q;}
test('all-safe queues once, on the fifth traveller',()=>{
 const s=lit();step(s,.2);queued(s);allSafeExcept(s,'pip');
 const q=N.travellerState(s,'pip');q.x=6.5;q.z=21.5;q.following=true;
 step(s,.1);
 const first=queued(s);assert.deepEqual(first.map(x=>x.step),['all-safe']);assert.equal(first[0].scene.id,'night.across');
 step(s,.5);assert.equal(queued(s).length,0);
});
test('breaking the device queues the bridge and then the receipt, once',()=>{
 const s=lit();queued(s);allSafe(s);slainAll(s);s.state.night.device='found';at(s,{x:16.4,z:18});step(s,.1);
 assert.deepEqual(queued(s).map(x=>x.scene.id),['night.bridge','night.receipt']);
 step(s,.3);assert.equal(queued(s).length,0);
});
test('the bowl is read only while Briar is taken, and reading it changes nothing',()=>{
 const s=sim();assert.equal(N.bowlNear(s),false);
 SG.briarTaken(s);at(s,{x:-11.55,z:-0.65});
 assert.equal(N.bowlNear(s),true);
 const scene=N.bowlScene(s);assert.equal(scene.id,'night.quiet');assert.ok(scene.lines.some(l=>/Her bowl is beside the door/.test(l.text)));
 const before=JSON.stringify([s.state.night,s.state.saga]);N.bowlScene(s);assert.equal(JSON.stringify([s.state.night,s.state.saga]),before);
 at(s,{x:4,z:-4});assert.equal(N.bowlNear(s),false);
});
test('the device prompt waits for the envoy and the crossing, and goes once the choice is kept',()=>{
 const s=lit();allSafe(s);slainAll(s);s.state.night.device='found';at(s,{x:16.4,z:18});step(s,.1);
 assert.equal(N.deviceReady(s),false);
 s.leave();at(s,{x:0,z:3});step(s,3.4);at(s,{x:-1.6,z:4.2});assert.equal(N.handle(s,'night-envoy',{}).ok,true);
 s.state.player={x:0,z:3,yaw:0};assert.equal(s.adventureCommand(id('back'),'waystone-travel',{id:'bellweather'}).ok,true);step(s,.05);
 at(s,{x:16.4,z:18});assert.equal(N.deviceReady(s),true);
 s.state.saga.choices={tessa:null,device:'open'};assert.equal(N.deviceReady(s),false);
});
test('each device option is sent to the saga as a choice and queues its own aftermath',()=>{
 const texts={};
 for(const value of ['open','sealed','carried']){
  const s=lit();allSafe(s);slainAll(s);s.state.night.device='found';at(s,{x:16.4,z:18});step(s,.1);queued(s);
  s.state.night.envoy=true;
  const calls=[];s.sagaCommand=(cid,type,payload)=>{calls.push({cid,type,payload});s.state.saga.choices={tessa:null,device:payload.value};return{ok:true,text:'Placed.'};};
  const cid=id('place-'+value);const r=s.adventureCommand(cid,'night-device',{value});assert.equal(r.ok,true,r.error);
  assert.deepEqual(calls.map(c=>[c.type,c.payload]),[['choose',{key:'device',value}]]);
  const again=s.adventureCommand(cid,'night-device',{value});assert.equal(again.duplicate,true);assert.equal(calls.length,1);
  const q=queued(s);assert.deepEqual(q.map(x=>x.scene.id),['night.device.after']);assert.ok(q[0].scene.lines.length>0);
  texts[value]=q[0].scene.lines.map(l=>l.text).join(' | ');
 }
 assert.equal(new Set(Object.values(texts)).size,3);
 assert.match(texts.open,/Rowan|hangs under her/);assert.match(texts.sealed,/Two locks/);assert.match(texts.carried,/pack/);
});
test('a refused placement says why and queues nothing',()=>{
 const s=lit();allSafe(s);slainAll(s);s.state.night.device='found';at(s,{x:16.4,z:18});step(s,.1);queued(s);
 assert.equal(N.handle(s,'night-device',{value:'open'}).error,'There is nothing to place yet.');
 s.state.night.envoy=true;
 s.sagaCommand=()=>({ok:false,error:'That is done, and it stays done.'});
 const r=s.adventureCommand(id('again'),'night-device',{value:'sealed'});assert.equal(r.ok,false);assert.equal(r.error,'That is done, and it stays done.');
 assert.equal(queued(s).length,0);
 at(s,{x:4,z:-4});assert.equal(N.handle(s,'night-device',{value:'open'}).error,'Stand at the device to place it.');
 at(s,{x:16.4,z:18});assert.equal(N.handle(s,'night-device',{value:'buried'}).error,'Unknown placement.');
});
test('never-bonded saves hear the plain variants of the night',()=>{
 const s=sim();s.state.adventure.companion.bonded=false;visitCrossing(s);
 assert.deepEqual(N.sceneOf('found-tessa',s.state).lines.map(l=>l.speaker),['Tessa']);
 const b=sim();visitCrossing(b);assert.ok(N.sceneOf('found-briar',b.state).lines.length>=2);
 assert.ok(N.sceneOf('broken-you',s.state).lines.some(l=>/comes apart in your hands/.test(l.text)));
 assert.ok(N.sceneOf('receipt',s.state).lines.some(l=>/Five travellers, not received/.test(l.text)));
 assert.equal(N.sceneOf('receipt',b.state).lines.some(l=>/Five travellers, not received/.test(l.text)),false);
});
test('the three device options go through the real saga: recorded once, replayed, and a second answer refused',()=>{
 const texts={};
 for(const value of ['open','sealed','carried']){
  const s=lit();allSafe(s);slainAll(s);s.state.night.device='found';at(s,{x:16.4,z:18});step(s,.1);queued(s);
  s.state.night.envoy=true;
  const r=N.handle(s,'night-device',{value});assert.equal(r.ok,true,r.error);
  assert.equal(s.state.saga.choices.device,value);
  assert.ok(s.state.journal.some(e=>e.kind==='saga'&&e.text.endsWith('.')&&e.text.length>3),'the saga journals the choice');
  const q=queued(s);assert.deepEqual(q.map(x=>x.scene.id),['night.device.after']);texts[value]=q[0].scene.lines.map(l=>l.text).join(' | ');
  const again=N.handle(s,'night-device',{value});assert.equal(again.ok,true);assert.equal(again.already,true);assert.equal(queued(s).length,0);
  const other=value==='open'?'sealed':'open';
  assert.equal(N.handle(s,'night-device',{value:other}).error,'That is done, and it stays done.');
  assert.equal(s.state.saga.choices.device,value);
  assert.equal(N.deviceReady(s),false);
 }
 assert.equal(new Set(Object.values(texts)).size,3);
});
function pick(r){return{ok:r.ok,error:r.error};}
