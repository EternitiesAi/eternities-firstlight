'use strict';
/* The saga owner: strict validation, inference for old saves from their real chapter and campaign records,
 * ordered idempotent beats through Simulation.sagaCommand, the habit recorder on the production tick, and the
 * echo ledger. Saves are earned fixtures from examples/ and tests/fixtures; the relic-only world is derived from
 * an earned save through the real validators. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),SG=require(path.join(ROOT,'src/saga.js'));
const load=p=>C.validate(JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8')));
const KIT='examples/CHAPTER_START_EARNED.json',ACT1='examples/CHAPTER_COMPLETED_EARNED.json',LATE='tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json';
const legacy=s=>{const raw=JSON.parse(JSON.stringify(s));delete raw.saga;return raw;};
function relicWorld(){const raw=legacy(load(ACT1)),a=raw.adventure,r=a.reward;a.angelSeen=false;a.reward=null;a.owned=a.owned.filter(x=>x!==r);for(const k in a.equipment)if(a.equipment[k]===r)a.equipment[k]=null;return C.validate(raw);}
let n=0;const cmd=(sim,type,payload={})=>sim.sagaCommand('saga-test-'+(++n),type,payload);
const round=sim=>{const snap=sim.snapshot();assert.deepEqual(C.validate(JSON.parse(JSON.stringify(snap))),snap);return snap;};

test('fresh saga round-trips through its validator and the world save',()=>{
 const f=SG.fresh();assert.deepEqual(SG.validate(f,C.fresh()),f);assert.notEqual(SG.validate(f),f);
 const w=C.fresh();assert.deepEqual(w.saga,f);const s=C.validate(JSON.parse(JSON.stringify(w)));assert.deepEqual(s.saga,f);
 assert.equal(SG.BEATS.length,14);assert.deepEqual(SG.BEATS.map(b=>b.id),['kit','hart','envoy','feather','road','beacon','bellweather','night','hell','heaven','witness','nearshore','finale','epilogue']);
 for(const b of SG.BEATS){assert.ok([1,2,3,4,5].includes(b.act));assert.ok(b.title&&b.detail&&b.place.label);assert.doesNotMatch(b.title+' '+b.detail+' '+b.place.label,/\b(fee|fees|claim|provisional|prototype|epoch|luna)\b|realm 10/i);}
});

test('every malformed saga is refused by name',()=>{
 const w=C.fresh(),ok=SG.fresh(),bad=(edit,field,world=w)=>{const s=JSON.parse(JSON.stringify(ok));edit(s);assert.throws(()=>SG.validate(s,world),{message:'Invalid saga: '+field});};
 assert.throws(()=>SG.validate(null),{message:'Invalid saga: shape'});
 bad(s=>{s.extra=1;},'shape');bad(s=>{delete s.credits;},'shape');bad(s=>{s.version=2;},'version');
 bad(s=>{s.beats.dragon={day:1};},'beats');bad(s=>{s.beats.kit={day:0};},'beat kit');bad(s=>{s.beats.kit={day:1,x:1};},'beat kit');
 bad(s=>{s.regent=['beacon','beacon'];},'regent');bad(s=>{s.regent=['tower'];},'regent');bad(s=>{s.prophecy=['deep'];},'prophecy');
 bad(s=>{s.feather.uses=1;},'feather');bad(s=>{s.feather.uses=-1;s.feather.unlocked=true;},'feather');bad(s=>{s.feather={unlocked:'yes',uses:0};},'feather');
 bad(s=>{s.briar.state='lost';},'briar');bad(s=>{s.briar.habit={'Bad Place':1};},'briar habit');bad(s=>{s.briar.habit={commons:0};},'briar habit');
 bad(s=>{s.briar.habit=Object.fromEntries(Array.from({length:33},(_,i)=>['p'+i,1]));},'briar habit');
 bad(s=>{s.briar.takenDay=3;},'briar taken day');bad(s=>{s.briar.state='taken';},'briar taken day');
 bad(s=>{s.echo.extra=[];},'echo');bad(s=>{s.echo.coercive=['nope'];},'echo coercive');bad(s=>{s.echo.freeing=['hell-unbind','hell-unbind'];},'echo freeing');
 bad(s=>{s.finale.phase=1;s.echo.coercive=['hell-unbind'];},'echo kind');bad(s=>{s.echo.freeing=['hell-unbind'];},'echo before finale');
 bad(s=>{s.finale={phase:2,won:true};},'finale');bad(s=>{s.finale.phase=4;},'finale');bad(s=>{s.credits=true;s.postgame=true;},'credits');bad(s=>{s.postgame=true;},'postgame');
 // the rest of the world must hold what the saga says it witnessed
 const act1=load(ACT1);bad(s=>{s.prophecy=['spring'];s.feather.unlocked=false;s.feather.unlocked=true;s.prophecy=[];},'feather before prophecy',act1);
 bad(s=>{s.briar={state:'taken',habit:{},takenDay:2};s.prophecy=['spring'];s.feather.unlocked=true;},'briar taken before bellweather',act1);
 bad(s=>{s.beats.night={day:1};},'beat order night');bad(s=>{s.beats.kit={day:1};},'beat order kit');
 const late=load(LATE);bad(s=>{Object.assign(s,SG.infer(late));s.beats.heaven={day:1};},'beat order heaven',late);
 bad(s=>{Object.assign(s,SG.infer(late));s.finale.phase=1;},'finale before nearshore',late);
 bad(s=>{Object.assign(s,SG.infer(late));s.briar={state:'nearshore',habit:{},takenDay:4};s.regent=['beacon','foundry'];},'briar nearshore before witness',late);
});

test('the world save refuses an inherited or undefined saga and infers an absent one',()=>{
 const raw=legacy(C.fresh());assert.deepEqual(C.validate(raw).saga,SG.fresh());
 assert.throws(()=>C.validate(Object.assign(Object.create({saga:SG.fresh()}),raw)),/inherited saga owner/);
 assert.throws(()=>C.validate({...raw,saga:undefined}),/undefined saga owner/);
 assert.throws(()=>C.validate({...raw,saga:{...SG.fresh(),version:0}}),/Invalid saga: version/);
});

test('inference reads where an old save already stands',()=>{
 const fresh=C.validate(legacy(C.fresh()));assert.equal(SG.current(fresh).id,'kit');assert.equal(SG.current(fresh).actLabel,'Act I · the valley');
 const kit=C.validate(legacy(load(KIT)));assert.ok(SG.done(kit,'kit'));assert.equal(SG.current(kit).id,'hart');assert.deepEqual(kit.saga,SG.fresh());
 const relic=relicWorld();assert.ok(SG.done(relic,'hart'));assert.equal(SG.current(relic).id,'envoy');assert.deepEqual(relic.saga.prophecy,[]);assert.equal(relic.saga.feather.unlocked,false);
 const act1=C.validate(legacy(load(ACT1)));assert.deepEqual(act1.saga.prophecy,['spring']);assert.equal(act1.saga.feather.unlocked,true);assert.equal(SG.current(act1).id,'road');
 const late=C.validate(legacy(load(LATE))),s=late.saga;
 assert.equal(late.adventure.companion.bonded,true);assert.ok(SG.done(late,'bellweather'));
 assert.equal(s.briar.state,'with');assert.equal(s.briar.takenDay,null);assert.equal(SG.done(late,'night'),false);assert.equal(SG.current(late).id,'night');
 assert.deepEqual(s.regent,['beacon','foundry','confluence']);assert.deepEqual(s.prophecy,['spring','heaven']);assert.deepEqual(s.beats,{});
 // later progress is never blocked by the new gates
 for(const g of['night','hell','heaven','atlantis','cosmos'])assert.equal(SG.allowed(late,g),true,g);
 assert.equal(SG.allowed(late,'finale'),false);assert.equal(SG.allowed(late,'unknown'),false);
 for(const g of['night','hell','heaven','nearshore','finale'])assert.equal(SG.allowed(fresh,g),false,g);
 assert.equal(SG.allowed(C.validate(legacy(load('examples/REALM10_CROSSING_READY_EARNED.json'))),'night'),false);
});

test('beats mark in order, once, with a journal line, and survive the save',()=>{
 const sim=new C.Simulation(load(KIT)),before=sim.state.journal.length;
 assert.equal(cmd(sim,'mark',{beat:'night'}).ok,false);assert.equal(cmd(sim,'mark',{beat:'hart'}).ok,false);assert.equal(cmd(sim,'mark',{beat:'dragon'}).ok,false);
 const r=cmd(sim,'mark',{beat:'kit'});assert.ok(r.ok,r.error);assert.deepEqual(sim.state.saga.beats,{kit:{day:sim.state.day}});assert.equal(sim.state.journal.length,before+1);assert.equal(sim.state.journal.at(-1).kind,'saga');
 const again=cmd(sim,'mark',{beat:'kit'});assert.equal(again.ok,true);assert.equal(again.already,true);assert.equal(sim.state.journal.length,before+1);
 assert.deepEqual(round(sim).saga.beats,{kit:{day:sim.state.day}});
 const fresh=new C.Simulation();assert.equal(cmd(fresh,'mark',{beat:'kit'}).ok,false,'a derived beat cannot be marked before it is earned');
});

test('a reused command identity replays or is refused',()=>{
 const sim=new C.Simulation(load(KIT)),a=sim.sagaCommand('same','mark',{beat:'kit'}),b=sim.sagaCommand('same','mark',{beat:'kit'});
 assert.equal(a.ok,true);assert.equal(b.duplicate,true);assert.equal(b.ok,true);
 const c=sim.sagaCommand('same','mark',{beat:'hart'});assert.equal(c.ok,false);assert.match(c.error,/reused/);
 assert.equal(sim.sagaCommand('','mark',{beat:'kit'}).ok,false);assert.equal(sim.sagaCommand('x','mark',[]).ok,false);assert.equal(sim.sagaCommand('y','teleport',{}).ok,false);
});

test('the envoy, the prophecy and the feather in order',()=>{
 const sim=new C.Simulation(relicWorld());
 assert.equal(cmd(sim,'prophecy',{id:'spring'}).ok,false,'no envoy yet');assert.equal(cmd(sim,'feather-unlock').ok,false);assert.equal(cmd(sim,'feather-use').ok,false);
 sim.state.adventure.angelSeen=true;
 assert.equal(cmd(sim,'feather-unlock').ok,false,'hear the prophecy first');
 const p=cmd(sim,'prophecy',{id:'spring'});assert.ok(p.ok);assert.equal(p.text,SG.PROPHECY_LINES.spring);assert.equal(cmd(sim,'prophecy',{id:'heaven'}).ok,false);
 assert.ok(SG.done(sim.state,'envoy'));assert.equal(SG.current(sim.state).id,'feather');
 assert.ok(cmd(sim,'feather-unlock').ok);assert.equal(cmd(sim,'feather-use').uses,1);assert.equal(cmd(sim,'feather-use').uses,2);
 assert.equal(SG.current(sim.state).id,'road');assert.ok(cmd(sim,'mark',{beat:'feather'}).ok);
 assert.equal(cmd(sim,'regent',{id:'beacon'}).ok,false,'he is not at the beacon yet');
});

test('the late chain: night, briar taken and returned, finale, credits, postgame',()=>{
 const sim=new C.Simulation(load(LATE));
 assert.equal(cmd(sim,'briar-returned').ok,false);assert.equal(cmd(sim,'finale-phase',{phase:1}).ok,false);assert.equal(cmd(sim,'credits').ok,false);
 assert.ok(cmd(sim,'briar-taken').ok);assert.equal(sim.state.saga.briar.state,'taken');assert.equal(sim.state.saga.briar.takenDay,sim.state.day);round(sim);
 assert.equal(cmd(sim,'habit',{place:'commons'}).ok,false,'nothing is learned while she is gone');
 assert.ok(cmd(sim,'mark',{beat:'night'}).ok);assert.ok(SG.done(sim.state,'witness'));assert.equal(SG.current(sim.state).id,'nearshore');assert.ok(SG.allowed(sim.state,'nearshore'));
 assert.ok(cmd(sim,'briar-nearshore').ok);round(sim);assert.ok(cmd(sim,'briar-returned').ok);assert.equal(SG.current(sim.state).id,'finale');assert.ok(SG.allowed(sim.state,'finale'));
 assert.equal(cmd(sim,'finale-phase',{phase:2}).ok,false,'phases run in order');assert.equal(cmd(sim,'finale-won').ok,false);
 for(const phase of[1,2,3]){assert.ok(cmd(sim,'finale-phase',{phase}).ok);round(sim);}
 assert.equal(cmd(sim,'finale-phase',{phase:3}).already,true);assert.ok(cmd(sim,'finale-won').ok);assert.equal(SG.current(sim.state).id,'epilogue');
 assert.ok(cmd(sim,'credits').ok);assert.equal(sim.state.saga.postgame,true);assert.equal(SG.current(sim.state),null);
 const snap=round(sim);assert.equal(snap.saga.credits,true);assert.deepEqual(new C.Simulation(snap).snapshot(),snap);
});

test('the habit recorder counts a landmark once per visit with briar following outdoors',()=>{
 const sim=new C.Simulation(load(ACT1)),place=(x,z)=>{sim.state.player={x,z,yaw:0};sim.playerPath=[];};
 const fox=()=>{const c=sim.adventureRuntime?.companion;if(c){c.x=sim.state.player.x+.8;c.z=sim.state.player.z;c.room=sim.room;}};
 place(.5,4.5);sim.tick(.1);fox();
 const step=s=>{for(let t=0;t<s;t+=.1){fox();sim.tick(.1);}};
 step(3.5);assert.deepEqual(sim.state.saga.briar.habit,{},'not before four seconds');step(1);assert.deepEqual(sim.state.saga.briar.habit,{commons:1});
 step(8);assert.equal(sim.state.saga.briar.habit.commons,1,'one count per visit');
 place(5,13);step(.5);place(.5,4.5);step(4.5);assert.equal(sim.state.saga.briar.habit.commons,2);
 sim.state.adventure.companion.mode='stay';place(5,13);step(.5);place(.5,4.5);step(5);assert.equal(sim.state.saga.briar.habit.commons,2,'briar must be following');
 sim.state.adventure.companion.mode='follow';place(11,9.3);step(5);assert.equal(sim.state.saga.briar.habit.market,1);
 assert.equal(SG.habitPlace(sim.state),'commons');assert.equal(SG.habitPlace(C.fresh()),'commons');
 assert.ok(cmd(sim,'habit',{place:'market'}).ok);assert.ok(cmd(sim,'habit',{place:'market'}).ok);assert.equal(SG.habitPlace(sim.state),'market');
 assert.equal(cmd(sim,'habit',{place:'Not A Place'}).ok,false);round(sim);
 const unbonded=new C.Simulation(load(KIT));unbonded.state.player={x:.5,z:4.5,yaw:0};for(let t=0;t<6;t+=.1)unbonded.tick(.1);assert.deepEqual(unbonded.state.saga.briar.habit,{});
});

test('the echo ledger quotes real dispositions and freezes when the finale opens',()=>{
 assert.deepEqual(SG.echoLedger(C.fresh()),{coercive:[],freeing:[]});
 const late=load(LATE),ledger=SG.echoLedger(late),ids=ledger.freeing.map(e=>e.id);
 assert.ok(ids.includes('hell-unbind'));for(const e of[...ledger.coercive,...ledger.freeing])assert.ok(e.line.length>10&&e.line.length<120);for(const e of ledger.freeing)assert.ok(e.ally);
 const raw=legacy(late);raw.hellCampaign.choice='license';const coerced=C.validate(raw);const c=SG.echoLedger(coerced);
 assert.ok(c.coercive.some(e=>e.id==='hell-license'));assert.ok(!c.freeing.some(e=>e.id==='hell-unbind'));
 const sim=new C.Simulation(coerced);for(const t of['briar-taken','briar-returned'])assert.ok(cmd(sim,t).ok);assert.ok(cmd(sim,'mark',{beat:'night'}).ok);assert.ok(cmd(sim,'finale-phase',{phase:1}).ok);
 assert.ok(sim.state.saga.echo.coercive.includes('hell-license'));const frozen=SG.echoLedger(sim.state);sim.state.hellCampaign.choice='unbind';assert.deepEqual(SG.echoLedger(sim.state),frozen);
 sim.state.hellCampaign.choice='license';assert.deepEqual(round(sim).saga.echo,sim.state.saga.echo);
});

// Synthetic in RAM: the Sunward Road's cart needs Briar's seek (road validate: companion prerequisite), so no valid save
// reaches the night unbonded today. This guards the saga's unbonded branch in case that rule ever loosens; nothing is saved.
test('a player who never bonded Briar finishes the nearshore by refusing the regent, and only that way',()=>{
 const NEAR=require(path.join(ROOT,'src/nearshore.js')),sim=new C.Simulation(load(LATE));sim.state.adventure.companion.bonded=false;sim.state.player={x:0,z:26,yaw:0};
 assert.equal(cmd(sim,'briar-taken').ok,false,'there is no Briar to take');
 assert.equal(NEAR.refusable(sim),false,'not before the night');assert.equal(cmd(sim,'refuse-companion').ok,false);
 assert.ok(cmd(sim,'mark',{beat:'night'}).ok);assert.ok(SG.done(sim.state,'witness'));assert.equal(SG.current(sim.state).id,'nearshore');
 assert.match(SG.current(sim.state).detail,/came all this way for a companion/);assert.equal(NEAR.refusable(sim),true);
 assert.equal(cmd(sim,'mark',{beat:'nearshore'}).ok,false,'a plain mark cannot end the nearshore');
 const r=cmd(sim,'refuse-companion');assert.ok(r.ok,r.error);assert.equal(sim.state.journal.at(-1).kind,'saga');
 assert.ok(Object.hasOwn(sim.state.saga.beats,'nearshore'));assert.equal(sim.state.saga.briar.state,'with');assert.equal(SG.current(sim.state).id,'finale');assert.ok(SG.allowed(sim.state,'finale'));
 assert.equal(cmd(sim,'refuse-companion').already,true);assert.equal(NEAR.refusable(sim),false);
 assert.deepEqual(SG.validate(JSON.parse(JSON.stringify(sim.state.saga)),sim.state),sim.state.saga,'the saga record itself validates');
 // bonding later cannot reopen her capture or undo the refusal
 sim.state.adventure.companion.bonded=true;assert.equal(cmd(sim,'briar-taken').ok,false);assert.ok(SG.done(sim.state,'nearshore'));
 // a bonded player cannot skip bringing her home this way
 const bonded=new C.Simulation(load(LATE));assert.ok(cmd(bonded,'briar-taken').ok);assert.ok(cmd(bonded,'mark',{beat:'night'}).ok);
 assert.equal(cmd(bonded,'refuse-companion').ok,false);assert.equal(NEAR.refusable(bonded),false);assert.equal(SG.done(bonded.state,'nearshore'),false);
 const bad=JSON.parse(JSON.stringify(sim.state.saga));bad.briar={state:'taken',habit:{},takenDay:1,returnedDay:null,homeDay:null};
 assert.throws(()=>SG.validate(bad,sim.state),/Invalid saga: beat order nearshore/);
});
