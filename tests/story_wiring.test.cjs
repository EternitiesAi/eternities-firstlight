'use strict';
/* Wave d: the story script wired into the act I-II owners. Every new hook is driven through real commands; every
 * choice option is taken; every hook scene resolves with each fact at each of its values; the envoy's prompt and the
 * tracker card read one rule. Walking is accepted movement with 50 ms steps, as in the chapter journeys. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),SG=require(path.join(ROOT,'src/saga.js')),SS=require(path.join(ROOT,'src/story-script.js'));
const A=require(path.join(ROOT,'src/adventure.js')),B=require(path.join(ROOT,'src/beacon.js')),F=require(path.join(ROOT,'src/feather-sight.js'));
const X=require(path.join(ROOT,'src/crossing.js'));
const load=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
let serial=0;
function harness(sim){
 const adv=(type,p={})=>{const r=sim.adventureCommand('wire-'+(++serial),type,p);assert.ok(r.ok,type+': '+r.error);return r;};
 const refused=(type,p={})=>{const r=sim.adventureCommand('wire-'+(++serial),type,p);assert.equal(r.ok,false,type+' should be refused');return r;};
 const step=t=>{for(let i=0;i<Math.ceil(t/.05);i++)sim.tick(.05);};
 const walk=(x,z)=>{const r=sim.moveTo(x,z);assert.ok(r.ok,'walk '+x+','+z+': '+r.error);for(let i=0;sim.playerPath.length&&i<6000;i++)step(.05);assert.ok(Math.hypot(sim.state.player.x-x,sim.state.player.z-z)<.15,'arrived '+x+','+z);};
 return{adv,refused,step,walk};
}
// The chapter-one save with the envoy not yet heard: the relic is found, no gift is taken.
function beforeEnvoy(){const raw=load('examples/CHAPTER_COMPLETED_EARNED.json');delete raw.saga;const a=raw.adventure,gift=a.reward;a.angelSeen=false;a.reward=null;a.owned=a.owned.filter(x=>x!==gift);for(const k in a.equipment)if(a.equipment[k]===gift)a.equipment[k]=null;return new C.Simulation(raw);}
const HOOKS=[['adventure','home'],['adventure','envoy'],['adventure','envoy-prophecy'],['adventure','envoy-feather'],['adventure','reward'],['adventure','tessa'],['adventure','habit'],['beacon','sighting'],['beacon','sighting-answer'],['beacon','sighting-tessa'],['crossing','met']];

test('every hook scene resolves with the default facts and with each fact at each of its values, with no token left',()=>{
 const base=SS.facts(C.fresh());
 for(const[owner,step]of HOOKS){const sc=SS.forStep(owner,step,base);assert.ok(sc,owner+'.'+step+' resolves with the defaults');assert.doesNotMatch(sc.lines.map(x=>x.text).join(' '),/\{briar\}|\{habit\}/);}
 for(const key of Object.keys(SS.FACTS))for(const value of SS.FACTS[key]){
  const f=SS.facts({...base,[key]:value});
  for(const[owner,step]of HOOKS){const sc=SS.forStep(owner,step,f);assert.ok(sc,owner+'.'+step+' resolves with '+key+'='+value);assert.doesNotMatch(sc.lines.map(x=>x.text).join(' '),/\{briar\}|\{habit\}/);}
 }
});

test('the sighting choices offer exactly the answers the saga takes',()=>{
 const hear=SS.scene('beacon.stranger',C.fresh()).choice.options.map(o=>o.sets['saga.heard.beacon']);
 assert.deepEqual(hear,[true,false]);
 const waybill=SS.scene('beacon.stranger.answer',C.fresh()).choice.options.map(o=>o.sets['saga.choices.tessa']);
 assert.deepEqual(waybill,['refused','hers','signed']);
});

test('the workshop with the feather plays the home scene once, through the command',()=>{
 const sim=new C.Simulation(load('examples/CHAPTER_COMPLETED_EARNED.json')),h=harness(sim);
 h.refused('home');
 h.walk(11,9);
 assert.equal(h.adv('home').scene,'home');
 assert.equal(h.adv('home').scene,null,'the second visit does not replay it');
});

test('the cart plays the tessa scene once, through the command',()=>{
 const sim=new C.Simulation(load('examples/CHAPTER_II_COMPLETE_EARNED.json')),h=harness(sim);
 h.walk(0,3);h.adv('rest');h.walk(44,6);h.adv('road-enter');
 h.refused('tessa');
 h.walk(-10,12);
 assert.equal(h.adv('tessa').scene,'tessa');
 assert.equal(h.adv('tessa').scene,null);
});

test('the first habit to reach three is noticed once, in the script’s words with the fox’s name',()=>{
 const sim=new C.Simulation(load('examples/CHAPTER_COMPLETED_EARNED.json')),r=A.runtime(sim);
 sim.tick(.05);
 for(const id of['habit-a','habit-b','habit-c'])assert.ok(sim.sagaCommand(id,'habit',{place:'commons'}).ok);
 sim.tick(.05);
 const notes=r.notices.filter(t=>/already at the Firstlight Commons/.test(t));
 assert.equal(notes.length,1);
 assert.match(notes[0],/^Briar is already at the Firstlight Commons/);
 sim.tick(.05);
 assert.equal(r.notices.filter(t=>/already at the Firstlight Commons/.test(t)).length,1,'noticed once');
});

// The sighting: every choice option, through the one command that writes the sighting on close.
for(const heard of[true,false])for(const tessa of['refused','hers','signed',null])
 test('the sighting records heard='+heard+' and Tessa='+tessa+' in one command, in order',()=>{
  const sim=new C.Simulation(load('examples/CHAPTER_II_COMPLETE_EARNED.json')),h=harness(sim);
  h.walk(0,3);h.adv('rest');h.walk(44,6);h.adv('road-enter');h.walk(2,3.4);h.walk(2,-4);h.walk(0,-24);
  h.adv('beacon-answer');h.step(18);assert.equal(B.runtime(sim).phase,'ready');
  // the saga refuses the record out of order: no answer before the sighting is in the story.
  assert.equal(sim.sagaCommand('order-heard','regent-heard',{id:'beacon',heard}).ok,false);
  assert.equal(sim.sagaCommand('order-tessa','choose',{key:'tessa',value:'refused'}).ok,false);
  const before=sim.state.adventure.revision;
  h.adv('beacon-sighting',{heard,tessa});
  assert.equal(sim.state.adventure.revision,before+1,'one command, one save');
  const s=sim.state.saga;
  assert.deepEqual(s.regent,['beacon']);
  assert.equal(s.heard.beacon,heard);
  assert.equal(s.choices.tessa,tessa);
  const saga=JSON.stringify(sim.state.saga);
  h.adv('beacon-sighting',{heard,tessa});
  assert.equal(JSON.stringify(sim.state.saga),saga,'the same sighting again writes nothing to the story');
 });

test('the envoy’s prompt and the tracker card agree: the warning, the gift, then the road’s report, then nothing',()=>{
 const sim=beforeEnvoy(),h=harness(sim),s=()=>sim.state.adventure;
 assert.equal(A.envoyTopic({relic:false,reward:null,road:{beaconLit:false,cartRepaired:false,reported:false}}),null,'no feather, no envoy prompt');
 assert.equal(A.envoyTopic(s()),'hear','the feather in hand asks for the envoy');
 h.adv('reveal');h.adv('envoy-prophecy');h.adv('envoy-feather');
 assert.equal(A.envoyTopic(s()),'hear');
 assert.equal(A.trackerNext(s()).title,'The envoy at the spring');
 h.adv('reward',{id:'warden_stone'});
 assert.equal(A.envoyTopic(s()),null,'after the gift the spring offers no envoy prompt');
 assert.notEqual(A.trackerNext(s()).title,'The envoy at the spring');
});

test('the road’s report at the spring: the prompt and the card agree, and the report clears both',()=>{
 const raw=load('examples/CHAPTER_II_COMPLETE_EARNED.json');raw.adventure.road.reported=false;
 const sim=new C.Simulation(raw),h=harness(sim),s=()=>sim.state.adventure;
 assert.equal(A.envoyTopic(s()),'report');
 assert.equal(A.trackerNext(s()).title,'Bring the light home');
 h.adv('road-report');
 assert.equal(A.envoyTopic(s()),null);
 assert.notEqual(A.trackerNext(s())?.title,'Bring the light home');
});

test('the feather’s rows: hell, heaven, the nearshore and the crossing as the bullet says',()=>{
 const sim=new C.Simulation(load('examples/CHAPTER_COMPLETED_EARNED.json'));
 sim.room='world-hell';assert.equal(F.areaOf(sim),'hell');
 const hell=F.roadsFor(sim);
 assert.equal(hell.find(r=>r.id==='hell-master-die').truth,'true');
 assert.deepEqual(hell.filter(r=>r.id.startsWith('hell-line-')).map(r=>r.truth),['counterfeit','counterfeit']);
 sim.room='world-heaven';assert.equal(F.areaOf(sim),'heaven');
 const causeway=F.ROADS.find(r=>r.id==='heaven-causeway');
 assert.equal(F.visible({heavenCampaign:{steps:[]}},causeway),false);
 assert.equal(F.visible({heavenCampaign:{steps:['inspect-false-relay']}},causeway),true,'shown from the false relay’s reading');
 assert.equal(F.visible({heavenCampaign:{steps:['inspect-false-relay','relay-disabled']}},causeway),false,'gone once the relay is broken');
 sim.room=null;sim.state.player={x:0,z:27,yaw:0};assert.equal(F.areaOf(sim),'nearshore');
 assert.deepEqual(F.roadsFor(sim).map(r=>r.truth),['true','true'],'both foxes are marked true at the nearshore');
 sim.state.player={x:0,z:3,yaw:0};assert.equal(F.areaOf(sim),'valley');
 const track=F.ROADS.find(r=>r.id==='valley-briar-track');
 assert.equal(F.visible({adventure:{companion:{bonded:false}}},track),false);
 assert.equal(F.visible({adventure:{companion:{bonded:true}}},track),true);
 const severing=F.ROADS.find(r=>r.id==='bellweather-severing');
 assert.deepEqual(severing.points.at(-1),[16.4,18],'the severing road ends at the night’s device');
});

test('the feather can be held in a realm room once it is unlocked',()=>{
 const sim=new C.Simulation(load('examples/CHAPTER_COMPLETED_EARNED.json'));
 sim.room='world-hell';
 try{assert.equal(F.hold(sim,true),true);assert.equal(sim.state.saga.feather.uses,1);}finally{F.hold(sim,false);}
});

test('the crossing says a hundred years, not a generation',()=>{
 const keeper=X.PLACES.find(p=>p.id==='keeper');
 assert.match(keeper.detail,/hundred years/);
 assert.doesNotMatch(keeper.detail,/generation/);
});
