'use strict';
/* Command-earned installed-module journey. Real commands/ticks/Store earn the load
 * and all signs facts. The two positive render/input issuers below are named
 * CPU host fixtures; they are neither native events nor rendered pixels. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||assert.fail('Set FIRSTLIGHT_ROOT.'));
const COHORT=path.resolve(process.env.WILD_SIGNS_COHORT||assert.fail('Set the exact current original-EE cohort.'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),copy=v=>JSON.parse(JSON.stringify(v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const head=()=>cp.execFileSync('git',['-c','core.longpaths=true','-C',ROOT,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const bound=new Map();function bind(file){file=path.resolve(file);const b=fs.readFileSync(file),v={path:file,bytes:b.length,sha256:hash(b)};const old=bound.get(file);if(old)assert.equal(old.sha256,v.sha256,'input changed during read');bound.set(file,v);return b;}
const intakeHead=head(),cohort=JSON.parse(bind(COHORT));assert.equal(cohort.schema,'first-load-native-cohort-v1');assert.equal(cohort.epoch.mode,'current-command-earned');assert.equal(cohort.epoch.head,intakeHead,'no historic cohort fallback');
assert.ok(Object.keys(cohort.epoch.runtimeSources).length>100);
for(const [relative,sha] of Object.entries(cohort.epoch.runtimeSources)){assert.match(relative,/^src\/[^/\\]+$/);assert.equal(hash(bind(path.join(ROOT,relative))),sha,'actual cohort runtime binding: '+relative);}
assert.equal(hash(bind(path.join(ROOT,'index.html'))),cohort.epoch.htmlSha256);assert.equal(hash(bind(path.join(ROOT,'FIRSTLIGHT_VALLEY.html'))),cohort.epoch.htmlSha256);
const earnedCaller=path.join(ROOT,'tests/earth_expedition_journey.cjs');assert.equal(hash(bind(earnedCaller)),cohort.epoch.callerSha256);
require(path.join(ROOT,'src/core.js'));
const D=require(path.join(ROOT,'src/earth-wild-signs-data.js'));
let emitted={};
const A=globalThis.RealmAdventure,C=globalThis.RealmCore;
const W=globalThis.RealmWorldFoundations,E=globalThis.RealmEarthExpedition,CD=globalThis.RealmEarthConsignmentData,L=globalThis.RealmLocalLife;
const CH=require(path.join(ROOT,'src/characters.js')),M=require(path.join(ROOT,'src/earth-consignment-motion.js'));
require(path.join(ROOT,'src/earth-consignment.js'));require(path.join(ROOT,'src/engine.js'));
const O=require(path.join(ROOT,'src/earth-grazer-motion.js'));
const Art=require(path.join(ROOT,'src/earth-grazer-art.js'));
const R=require(path.join(ROOT,'src/earth-wild-signs.js'));
const T=globalThis.RealmCombat;
// Extract the actual pure roster predicate, replacing only its outer Sim closure.
const appSource=bind(path.join(ROOT,'src/app.js')).toString('utf8'),threatAnchor='function consignmentThreat(query){',contextAnchor='function consignmentContext(){';
assert.equal(appSource.split(threatAnchor).length,2);assert.equal(appSource.split(contextAnchor).length,2);
const threatSource=appSource.slice(appSource.indexOf(threatAnchor),appSource.indexOf(contextAnchor)).trim();assert.ok(threatSource.endsWith('}'));
const actualThreatFactory=Function('readSim','return function consignmentThreat(query){const sim=readSim();'+threatSource.slice(threatSource.indexOf('{')+1,-1)+'};');
for(const file of Object.keys(require.cache).filter(p=>p.toLowerCase().startsWith(ROOT.toLowerCase()+path.sep)))bind(file);
const FRESH_LOAD={accepted:false,choice:null,steps:[],claimed:false};
function input(variant){
 const v=cohort.variants[variant];assert.ok(v,'declared blade/bow/veteran only');const files={};
 for(const kind of ['source','journey']){const link=v[kind];assert.ok(link&&typeof link.path==='string'&&!link.path.includes('\\'));assert.ok(!path.isAbsolute(link.path)&&!link.path.split('/').includes('..'));const file=path.resolve(path.dirname(COHORT),link.path);assert.ok(file.startsWith(path.dirname(COHORT)+path.sep));const b=bind(file);assert.equal(hash(b),link.sha256,'unchanged actual '+variant+' '+kind);files[kind]=JSON.parse(b);}
 const raw=files.source,r=files.journey;assert.equal(r.status,'passed');assert.equal(r.browserPersistence,false);assert.equal(r.humanPacing,false);for(const k of ['positionEdits','inventoryGrants','manualDamage','plantedDefeats'])assert.equal(r[k],0);assert.equal(r.harnessSha256,cohort.epoch.callerSha256);assert.equal(r.sourceDrift,false);
 for(const [name,sha]of Object.entries(r.sourceHashes)){assert.equal(path.basename(name),name);assert.equal(hash(bind(path.join(ROOT,'src',name))),sha);}
 assert.ok(E.validate(raw.earthExpedition).story.claimed);assert.deepEqual(raw.localLife.records[CD.ID],FRESH_LOAD,'fifth record really starts fresh');if(Object.hasOwn(raw,'earthWildSigns'))assert.deepEqual(raw.earthWildSigns,D.fresh());
 const validated=C.validate(raw),expected=copy(raw);expected.earthWildSigns=D.fresh();assert.equal(canonical(validated),canonical(expected),'only missing future owner addition; original economy/history bytes unchanged');return{raw,report:r,source:v.source};
}
class MemoryStorage{constructor(raw){this.values=new Map([[C.KEY,JSON.stringify(raw)]]);this.refuse=false;this.writes=0;}getItem(k){return this.values.get(k)??null;}setItem(k,v){if(this.refuse)throw Error('CPU isolated storage quota refusal');this.values.set(k,String(v));this.writes++;}}
function protectedFacts(s){const adventureRecords=copy(s.adventure);for(const k of ['elapsed','hp','stamina','revision','receipts','coins'])delete adventureRecords[k];return copy({earthExpedition:s.earthExpedition,journeys:s.journeys,realmTrails:s.realmTrails,cosmosCampaign:s.cosmosCampaign,atlantisCampaign:s.atlantisCampaign,heavenCampaign:s.heavenCampaign,hellCampaign:s.hellCampaign,earthHomecoming:s.earthHomecoming,bridgeCommunity:s.bridgeCommunity,homeHistory:s.homeHistory,oldLife:Object.fromEntries(CD.OLD_IDS.map(id=>[id,s.localLife.records[id]])),retreat:s.retreat,score:s.score,scoreRevision:s.scoreRevision,visitor:s.visitor,visited:s.visited,flowers:s.flowers,notes:s.notes,adventureRecords});}
function economy(s){return copy({coins:s.adventure.coins,inventory:s.sandbox.inventory});}
function create(variant,route='south'){
 const source=input(variant),storage=new MemoryStorage(source.raw);let store=new CH.Store(storage);const loaded=store.load();assert.ok(!store.blocked);store.writer=true;
 const imported=store.command('import',{world:source.raw},loaded.state,store.revision);assert.ok(imported.ok,imported.error);let sim=new C.Simulation(imported.state),grazerLive=false;
 let expectedReceipts=copy(sim.state.adventure.receipts);
 function assertReceipts(){assert.deepEqual(sim.state.adventure.receipts,expectedReceipts,'old Adventure receipts change only through actual bounded command append');}
 function combatCommand(id,type,payload={}){assertReceipts();const prior=copy(expectedReceipts),r=sim.adventureCommand(id,type,payload);assert.ok(r.ok,r.error);const actual=sim.state.adventure.receipts;assert.equal(actual.at(-1).id,id);assert.equal(actual.at(-1).ok,true);assert.deepEqual(actual.slice(0,-1),prior.slice(prior.length===100?1:0),'existing 100-receipt cap evicts only the oldest actual receipt');expectedReceipts=copy(actual);return r;}
 const base=()=>({sim,active:store.active,revision:store.revision});
 const metrics={variant,route,sourceSha256:source.source.sha256,ticks:0,walkFrames:0,manualFrames:0,playerDistance:0,workerDistance:0,workerFrames:0,arrivalIds:[],commands:[],observationFrames:0,observationPhases:[],clearanceCalls:0,combatCommands:0,projectileShots:0,companionStrikes:0,claims:[],coldLoads:0,positionEdits:0,inventoryGrants:0,hpEdits:0,plantedDefeats:0,scope:'CPU command-earned future proposal; accelerated real Core ticks and isolated real Store; positive renderer/native-intent stamps are CPU host fixtures only.'};
 function stamp(){sim.consignmentOwnerLease=Object.freeze({});sim.grazerOwnerLease=Object.freeze({});sim.wildSignsOwnerLease=Object.freeze({});sim.recordWildSignsClearance=e=>{metrics.clearanceCalls++;return R.recordClearance(signsContext(),e,{save,sync:()=>A.syncScene(sim)});};}
 const threat=actualThreatFactory(()=>sim);
 const loadContext=()=>({...base(),ownerLease:sim.consignmentOwnerLease,definition:CD.definition,threat});
 const grazerContext=extra=>({...base(),ownerLease:sim.grazerOwnerLease,...extra});
 const signsContext=()=>({...base(),ownerLease:sim.wildSignsOwnerLease,definition:D.definition,sceneSignature:A.runtime(sim).trailSignature,grazerContext:()=>grazerContext()});
 function save(candidate){return store.save(candidate);}
 function tick(){const from={...sim.state.player};sim.tick(.1);assert.ok(sim.state.adventure.hp>0,'real traveller stays alive');assert.ok(W.segment(sim.room,from,sim.state.player,.31),'actual complete player movement segment');metrics.ticks++;metrics.playerDistance+=distance(from,sim.state.player);const before=canonical(sim.state),elapsed=sim.elapsed;
  if(M.current(loadContext())){const r=M.update(loadContext(),.1);assert.ok(r.ok,r.error);}if(grazerLive){const r=O.tick(grazerContext(),.1);assert.ok(r.ok,r.error);}assert.equal(canonical(sim.state),before,'motion/presentation cannot mutate durable state');assert.equal(sim.elapsed,elapsed);return M.current(loadContext());}
 function walk(point){assert.ok(W.walkable(sim.room,point.x,point.z,.31));const r=sim.moveTo(point.x,point.z);assert.ok(r.ok,r.error);let frames=0;while(sim.playerPath.length&&frames++<12000){tick();metrics.walkFrames++;}assert.ok(frames<12000,'bounded actual solver walk');assert.ok(distance(sim.state.player,point)<.25,'arrived at actual supported target');}
 const walkMany=points=>points.forEach(walk);
 function enter(){const c=base(),p=W.preview(c,'earthlands');assert.ok(p.ok,p.error);const r=W.enter(p.ticket,c,{save,build(){}});assert.ok(r.ok,r.error);stamp();grazerLive=false;}
 function loadCommand(type,payload={}){const r=L.command(loadContext(),type,{quest:CD.ID,...payload},{save,sync:()=>A.syncScene(sim)});metrics.commands.push({owner:CD.ID,type,ok:r.ok});return r;}
 function signsCommand(type,payload={}){const r=R.command(signsContext(),type,{quest:D.ID,...payload},{save,sync:()=>A.syncScene(sim)});metrics.commands.push({owner:D.ID,type,ok:r.ok});return r;}
 function follow(){const v=M.current(loadContext());if(distance(sim.state.player,v)>.5){const from={...sim.state.player};if(W.segment(sim.room,sim.state.player,v,.31)){sim.manual(v.x-sim.state.player.x,v.z-sim.state.player.z,Math.min(.1,distance(sim.state.player,v)/3.2));metrics.manualFrames++;metrics.playerDistance+=distance(from,sim.state.player);assert.ok(W.segment(sim.room,from,sim.state.player,.31));}else{const r=sim.moveTo(v.x,v.z);assert.ok(r.ok,r.error);}}}
 function earnLoad(){
  const suffix=sim.state.earthExpedition.story.branch==='managed-coppice'?'coppice':'stormfall',choice=route+'-'+suffix,initial=economy(sim.state),facts=protectedFacts(sim.state),home=copy(sim.returnPos);
  assert.deepEqual(sim.state.localLife.records[CD.ID],FRESH_LOAD);assert.equal(signsCommand('accept').ok,false,'unpaid fifth record cannot invite WildSigns');
  walkMany([{x:-6,z:-61.5},{x:-26,z:-61.5},{x:-54,z:-65},{x:-68,z:-99},CD.definition.giver]);assert.ok(loadCommand('accept',{choice}).ok);
  for(const step of CD.required(choice)){assert.ok(M.continue(loadContext()).ok);let v=M.current(loadContext()),frames=0;const prefix=copy(sim.state.localLife.records[CD.ID].steps),writes=storage.writes;
   while(!v.ready&&frames++<12000){follow();const before=v;v=tick();assert.ok(v);assert.notEqual(v.status,'blocked',v.detail);assert.notEqual(v.reason,'player-far','actual following must keep carrier within its bound');const moved=distance(before,v);assert.ok(moved<=.160000001);assert.ok(W.segment(CD.ROOM,before,v,.65));metrics.workerDistance+=moved;metrics.workerFrames++;assert.deepEqual(sim.state.localLife.records[CD.ID].steps,prefix);assert.equal(storage.writes,writes,'no per-frame saves');}
   assert.ok(v.ready&&frames<12000);assert.equal(loadCommand('step',{step}).ok,false);const proof=M.arrivalTicket(loadContext());assert.ok(proof.ok);assert.equal(loadCommand('step',{step,motionTicket:copy(proof.ticket)}).ok,false);const r=loadCommand('step',{step,motionTicket:proof.ticket});assert.ok(r.ok,r.error);assert.equal(r.warning,undefined);assert.equal(M.validateArrival(loadContext(),proof.ticket,step).ok,false);metrics.arrivalIds.push(step);assert.deepEqual(protectedFacts(sim.state),facts);assert.deepEqual(sim.returnPos,home);assert.deepEqual(economy(sim.state),initial);
  }
  assert.ok(M.current(loadContext()).arrived);assert.equal(sim.state.localLife.records[CD.ID].claimed,false);walk(CD.definition.returner);const r=loadCommand('claim');assert.ok(r.ok,r.error);assert.deepEqual(r.reward,{xp:0,coins:4,ore:0,materials:{wood:2,fiber:2}});metrics.claims.push({owner:CD.ID,reward:r.reward});const expected=copy(initial);expected.coins+=4;expected.inventory.wood+=2;expected.inventory.fiber+=2;assert.deepEqual(economy(sim.state),expected);assert.deepEqual(protectedFacts(sim.state),facts);assert.equal(M.current(loadContext()),null);const bytes=storage.getItem(CH.KEY);assert.ok(loadCommand('claim').duplicate);assert.equal(storage.getItem(CH.KEY),bytes);return{choice,facts,home,initial};
 }
 function toInvitation(){walkMany([{x:-6,z:-61.5},{x:-10,z:-34},{x:-10,z:-15},{x:-20.4,z:-15},{x:-29,z:-9},{x:-70,z:-8},D.giver]);assert.ok(signsCommand('accept').ok);}
 function clueReads(reverse=false){walkMany([{x:-109,z:-28},{x:-125,z:-44},{x:-125,z:-57},{x:-148,z:-64},D.evidence[0]]);if(reverse){walk(D.evidence[1]);assert.ok(signsCommand('read',{evidence:'feeding-track'}).ok);walk(D.evidence[0]);assert.ok(signsCommand('read',{evidence:'timber-gouge'}).ok);walk(D.evidence[1]);}else{assert.ok(signsCommand('read',{evidence:'timber-gouge'}).ok);walk(D.evidence[1]);assert.ok(signsCommand('read',{evidence:'feeding-track'}).ok);}walk(D.overlook);}
 function CPU_RENDER_INPUT_FIXTURE_ONLY(){
  const view=O.current(grazerContext()),out={box:[],round:[],octa:[]},before=canonical(sim.state),submission=Art.draw(out,view,grazerContext());assert.ok(submission);sim.grazerPresentedFrame=Object.freeze({});const c=grazerContext({presentedFrame:sim.grazerPresentedFrame,visible:true,hidden:false,menuOpen:false,camera:sim.state.settings.cameraMode==='follow'?'follow':'adventure'});const r=O.acknowledge(c,submission);assert.ok(r.ok,r.error);assert.equal(canonical(sim.state),before);metrics.observationFrames++;if(!metrics.observationPhases.includes(view.phase))metrics.observationPhases.push(view.phase);return r;
 }
 function observe(refuseOnce=false){
  const begun=O.begin(grazerContext());assert.ok(begun.ok,begun.error);grazerLive=true;assert.equal(O.observationTicket(grazerContext({hidden:false,inputStamp:Object.freeze({})})),null);
  let frames=0;while(!O.current(grazerContext()).observationReady&&frames++<120){tick();CPU_RENDER_INPUT_FIXTURE_ONLY();}assert.ok(O.current(grazerContext()).observationReady&&frames<120);assert.deepEqual(sim.state.earthWildSigns.evidence.slice().sort(),['feeding-track','timber-gouge']);assert.equal(sim.state.earthWildSigns.observed,false);
  sim.paused=true;const elapsed=sim.elapsed;sim.tick(.1);assert.ok(O.tick(grazerContext(),.1).ok);assert.equal(sim.elapsed,elapsed);sim.grazerNativeIntent=Object.freeze({});const ticket=O.observationTicket(grazerContext({hidden:false,inputStamp:sim.grazerNativeIntent}));assert.ok(ticket,'private proof from actual behavior, explicit CPU intent');assert.equal(signsCommand('observe',{observationTicket:copy(ticket)}).ok,false);assert.equal(signsCommand('observe',{observationTicket:true}).ok,false);
  const lease=sim.grazerOwnerLease,revision=store.revision;assert.ok(sim.setTime(sim.state.hour));assert.ok(save(sim.snapshot()).ok);assert.ok(store.revision>revision,'actual managed persistence changes raw revision');assert.strictEqual(sim.grazerOwnerLease,lease);assert.ok(O.validateObservation(grazerContext(),ticket).ok,'ready menu proof survives real clock save');
  if(refuseOnce){const before=canonical(sim.state),bytes=storage.getItem(CH.KEY);storage.refuse=true;assert.equal(signsCommand('observe',{observationTicket:ticket}).ok,false);assert.equal(canonical(sim.state),before);assert.equal(storage.getItem(CH.KEY),bytes);assert.ok(O.validateObservation(grazerContext(),ticket).ok);storage.refuse=false;}
  const r=signsCommand('observe',{observationTicket:ticket});assert.ok(r.ok,r.error);assert.equal(r.warning,undefined);assert.equal(sim.state.earthWildSigns.observed,true);assert.equal(O.validateObservation(grazerContext(),ticket).ok,false);sim.paused=false;return ticket;
 }
 function response(resolution){walk(D.evidence[2]);assert.ok(signsCommand('read',{evidence:'pest-scrape'}).ok);assert.ok(signsCommand('choose',{resolution}).ok);assert.equal(signsCommand('choose',{resolution:resolution==='signed-loop'?'cleared-pocket':'signed-loop'}).ok,false);}
 function pest(){return A.runtime(sim).enemies.find(e=>e.id===D.enemy.id);}
 function clearPest(refuseOnce=false){
  walkMany([{x:-158,z:-90},{x:-164.4,z:-92.8}]);const e=pest();assert.ok(e&&e.hp>0);assert.ok(T.handle(sim,'target-select',{id:e.id}).ok);const before=economy(sim.state),facts=protectedFacts(sim.state);if(refuseOnce)storage.refuse=true;
  const seenCompanionFx=new WeakSet();function companionEvidence(hpBeforeTick){for(const fx of A.runtime(sim).fx)if(fx.kind==='companion'&&fx.at===sim.state.adventure.elapsed&&!seenCompanionFx.has(fx)&&distance(fx,A.runtime(sim).companion)<1e-9){assert.ok(e.hp<hpBeforeTick,'real companion FX accompanies actual pest damage');seenCompanionFx.add(fx);metrics.companionStrikes++;}}
  if(sim.state.adventure.companion.bonded){const guard=combatCommand('wild-earned-companion-brace','guard');assert.ok(guard.ok,guard.error);metrics.combatCommands++;let waits=0;while(!metrics.companionStrikes&&e.hp>0&&waits++<180){const hp=e.hp;tick();companionEvidence(hp);}assert.ok(metrics.companionStrikes>0,'bounded real Brace/wait lets the existing companion strike without pose edits');}
  let frames=0;while(pest()?.hp>0&&frames++<500){const target=pest(),range=distance(sim.state.player,target),cool=A.runtime(sim).cooldowns.attack,style=globalThis.RealmArsenal.weapon(sim.state.adventure).style;
   if(range<=(style==='bow'?10:2.6)&&A.visible(sim,sim.state.player,target)&&sim.state.adventure.elapsed>=cool){const r=combatCommand('wild-earned-hit-'+frames,'attack',{target:target.id});assert.ok(r.ok,r.error);metrics.combatCommands++;if(style==='bow'){assert.ok(A.runtime(sim).arrows.length>0);metrics.projectileShots++;}}
   const hpBeforeTick=e.hp;if(pest()?.hp>0)tick();companionEvidence(hpBeforeTick);
  }
  assert.ok(frames<500,'bounded actual combat');assert.equal(e.hp,0);assert.deepEqual(economy(sim.state),before);assert.deepEqual(protectedFacts(sim.state),facts);assert.ok(!sim.state.adventure.defeated.includes(D.enemy.id));assert.ok(!sim.state.adventure.drops.includes(D.enemy.id));
  if(refuseOnce){assert.strictEqual(pest(),e);assert.equal(sim.state.earthWildSigns.cleared,false);sim.paused=true;const bytes=storage.getItem(CH.KEY);assert.equal(A.retryWildSignsClearance(sim).ok,false);assert.strictEqual(pest(),e);assert.equal(storage.getItem(CH.KEY),bytes);storage.refuse=false;const r=A.retryWildSignsClearance(sim);assert.ok(r.ok,r.error);sim.paused=false;}
  assert.equal(sim.state.earthWildSigns.cleared,true);assert.equal(pest(),undefined);assert.deepEqual(economy(sim.state),before);assert.deepEqual(protectedFacts(sim.state),facts);
 }
 function toSela(){walkMany([{x:-158,z:-90},D.evidence[2],D.overlook,D.evidence[1],D.evidence[0],{x:-148,z:-64},{x:-125,z:-57},{x:-125,z:-44},{x:-109,z:-28},D.giver]);}
 function payout(){const before=economy(sim.state),facts=protectedFacts(sim.state),load=copy(sim.state.localLife.records[CD.ID]);const r=signsCommand('claim');assert.ok(r.ok,r.error);assert.deepEqual(r.reward,D.definition.reward);metrics.claims.push({owner:D.ID,reward:r.reward});const expected=copy(before);expected.coins+=4;expected.inventory.fiber+=3;assert.deepEqual(economy(sim.state),expected);assert.deepEqual(protectedFacts(sim.state),facts);assert.deepEqual(sim.state.localLife.records[CD.ID],load);const bytes=storage.getItem(CH.KEY);assert.ok(signsCommand('claim').duplicate);assert.equal(storage.getItem(CH.KEY),bytes);assert.equal(pest(),undefined);}
 function cold(){assertReceipts();assert.ok(save(sim.snapshot()).ok);const expected=sim.snapshot(),bytes=storage.getItem(CH.KEY),outgoing=sim;M.reset(outgoing,'cold-owner-reload');O.reset(outgoing,'cold-owner-reload');Art.reset(outgoing);outgoing.wildSignsOwnerLease=Object.freeze({});store=new CH.Store(storage);const loaded=store.load();assert.ok(!store.blocked);store.writer=true;sim=new C.Simulation(loaded.state);stamp();grazerLive=false;assert.equal(canonical(sim.snapshot()),canonical(expected),'cold whole-Core world equals actual saved candidate');assert.equal(storage.getItem(CH.KEY),bytes,'read-only cold load preserves exact saved bytes');enter();assert.deepEqual(sim.returnPos,expected.player);assertReceipts();metrics.coldLoads++;return expected;}
 stamp();assert.deepEqual(economy(sim.state),economy(source.raw));assert.deepEqual(protectedFacts(sim.state),protectedFacts(source.raw));assert.deepEqual(sim.state.earthWildSigns,D.fresh());enter();
 return{get sim(){return sim;},get store(){return store;},storage,metrics,source,save,tick,walk,walkMany,assertReceipts,base,loadContext,grazerContext,signsContext,loadCommand,signsCommand,earnLoad,toInvitation,clueReads,observe,response,pest,clearPest,toSela,payout,cold};
}
function binding(){bind(__filename);return{sourceHead:intakeHead,sourceHeadAfter:head(),mode:'installed-current-modules',cohortSha256:bound.get(COHORT).sha256,actualAppThreatSha256:hash(Buffer.from(threatSource)),emitted,inputs:[...bound.values()],inputsUnchanged:[...bound.values()].every(v=>hash(fs.readFileSync(v.path))===v.sha256)};}
module.exports={ROOT,COHORT,C,A,W,D,CD,L,M,O,Art,R,create,binding,protectedFacts,economy,copy,canonical,distance};
