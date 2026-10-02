/* Read-only UI projections and current-owner route checks. The records and
 * placements below are explicitly synthetic boundary fixtures, not earned work,
 * native persistence, a human playtest or evidence of a claimed reward. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js');
const W=require('../src/world-foundations.js'),R=require('../src/realm-trails.js');
const UI=require('../src/realm-trails-ui.js');require('../src/world-foundations-ui.js');
const WorldUI=global.RealmWorldFoundationsUI,copy=structuredClone;
const definition=realm=>R.definitions().find(d=>d.realm===realm);
let serial=0;
function fixture(realm=null){
 const sim=new C.Simulation();sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('synthetic-ui-kit-'+(++serial),'start').ok);if(realm)sim.room=W.definition(realm).room;
 const effects={walks:[],toasts:[],closed:0,painted:0},rpg={sim,worlds:{local:()=>!!W.definition(rpg.sim.room)},api:{walkLocal:(x,z)=>effects.walks.push({x,z}),toast:s=>effects.toasts.push(s)},close:()=>effects.closed++,paint:()=>effects.painted++};
 const ui=Object.create(UI.TrailsUI.prototype);ui.rpg=rpg;
 return{sim,rpg,ui,effects};
}
function accept(sim,realm){const d=definition(realm);sim.state.realmTrails.records[d.id].accepted=true;return d;}
function finish(sim,d){const r=sim.state.realmTrails.records[d.id];r.steps=R.required(d);for(const s of d.steps.filter(s=>s.instrument&&!s.optional))r.settings[s.id]=s.instrument.target;if(d.escort)r.checkpoint=d.escort.route.length-1;}
const el=(action,id='')=>({dataset:{rpg:action,id}});

test('all five trails distinguish unaccepted, active, ready and claimed saved facts',()=>{
 const {sim}=fixture(),before=copy(sim.state);
 for(const d of R.definitions()){
  let p=UI.progress(sim.state,d);assert.equal(p.status,'unaccepted');assert.equal(p.done,0);assert.deepEqual(p.next,[]);
  accept(sim,d.realm);p=UI.progress(sim.state,d);assert.equal(p.status,'active');assert.ok(p.next.length);assert.ok(p.next.every(s=>!s.optional&&s.requires.length===0));
  finish(sim,d);p=UI.progress(sim.state,d);assert.equal(p.status,'ready');assert.equal(p.done,p.total);assert.deepEqual(p.next,[]);
  sim.state.realmTrails.records[d.id].claimed=true;assert.equal(UI.progress(sim.state,d).status,'claimed');
 }
 assert.doesNotThrow(()=>C.validate(sim.state),'all projected complete records also satisfy the canonical save validator');
 assert.deepEqual(before.realmTrails,R.fresh(),'fixture began with empty canonical records');
});
test('eligible work lists preparations, never a later locked encounter or optional work as required',()=>{
 const{sim}=fixture(),d=accept(sim,'heaven'),r=sim.state.realmTrails.records[d.id];
 assert.ok(!UI.progress(sim.state,d).next.some(s=>s.id==='disable-core'||s.id==='garden-repair'||s.optional));
 r.steps.push(...d.enemy.spawnAfter);let p=UI.progress(sim.state,d);assert.deepEqual(p.next.map(s=>s.id),['disable-core']);
 r.steps.push(d.enemy.defeatStep);p=UI.progress(sim.state,d);assert.deepEqual(p.next.map(s=>s.id),['garden-repair']);
 r.steps.push('spillway');assert.equal(UI.progress(sim.state,d).done,p.done,'optional spillway does not alter required progress');
});
test('one realm can retain a once-only trail and a separate repeat survey run without merging fees',()=>{
 const{sim}=fixture();accept(sim,'earthlands');const ledger=sim.state.journeys.realms.earthlands;
 Object.assign(ledger,{firstClaimed:true,counter:4,lastClaim:3,active:{run:4,kind:'survey',observed:['first']}});
 const rows=UI.workRows(sim.state);assert.equal(rows.length,2);
 const trail=rows.find(r=>r.kind==='trail'),survey=rows.find(r=>r.kind==='survey');
 assert.equal(trail.key,'earthlands-coastward-materials-v1');assert.deepEqual(trail.reward.materials,{wood:6,fiber:4,stone:2});
 assert.equal(survey.key,'earthlands:4');assert.equal(survey.run,4);assert.equal(survey.repeat,true);assert.deepEqual(survey.reward,{xp:5,coins:2,ore:0});assert.equal(survey.done,1);
 assert.equal(survey.next.length,2);assert.notEqual(survey.title,trail.title);
});
test('unpaid completion stays ahead of other work and paid trails have no next action',()=>{
 const{sim}=fixture(),earth=accept(sim,'earthlands'),heaven=accept(sim,'heaven'),cosmos=accept(sim,'cosmos');
 finish(sim,earth);finish(sim,cosmos);sim.state.realmTrails.records[cosmos.id].claimed=true;
 const rows=UI.workRows(sim.state);assert.deepEqual(rows.map(r=>r.key),[earth.id,heaven.id,cosmos.id]);assert.deepEqual(rows.at(-1).next,[]);
});
test('journal and road statuses remain pure and never construct an escort actor',()=>{
 const{sim,ui}=fixture();for(const d of R.definitions())accept(sim,d.realm);
 const hell=definition('hell');sim.state.realmTrails.records[hell.id].steps=hell.steps.filter(s=>s.id!=='refuge-arrival').map(s=>s.id);
 const before=copy(sim.state),escort=R.escort;R.escort=()=>{throw Error('journal must not construct an escort');};
 try{assert.match(ui.journal(),/stay near Neris/);for(const d of W.definitions())assert.match(ui.status(d.id),/Accepted trail/);}finally{R.escort=escort;}
 assert.deepEqual(sim.state,before);
});
test('home journal retains exact fees, giver, progress and explicitly separate survey identity',()=>{
 const{sim,ui}=fixture(),earth=accept(sim,'earthlands');finish(sim,earth);
 sim.state.journeys.realms.earthlands.counter=1;sim.state.journeys.realms.earthlands.active={run:1,kind:'opening',observed:[]};
 const html=ui.journal();assert.match(html,/Ready to return · unpaid/);assert.match(html,/Vessa · bridge keeper/);assert.match(html,/6 wood · 4 fiber · 2 stone/);assert.match(html,/FIRST LOCAL SURVEY · RUN 1/);
 assert.match(html,/data-rpg="world-select" data-id="earthlands"/);assert.match(html,/data-rpg="world-road"/);
 assert.ok(!/data-rpg="(?:trail-accept|trail-step|trail-claim|world-confirm|world-claim|trail-fit-confirm)"/.test(html),'journal only reads or navigates');
});
test('empty journal gives a deliberate road entry and preserves campaign ordering below it',()=>{
 const{ui}=fixture(),html=ui.journal();assert.match(html,/No unfinished realm work is accepted/);assert.match(html,/Your earlier chapters remain below/);assert.match(html,/data-rpg="world-list"/);assert.match(html,/Claim any one trail to unlock/);
});
test('claim control is absent before completion and present only at the actual ready giver',()=>{
 const{sim,ui}=fixture('earthlands'),d=accept(sim,'earthlands');sim.state.player={...d.giver,yaw:0};
 assert.ok(!ui.page('earthlands').includes('data-rpg="trail-claim"'));assert.ok(!ui.page('earthlands').includes('data-id="road-pack"'),'locked packing has no route control');
 finish(sim,d);assert.match(ui.page('earthlands'),/data-rpg="trail-claim"/);sim.state.player={x:0,z:16,yaw:0};assert.ok(!ui.page('earthlands').includes('data-rpg="trail-claim"'));assert.match(ui.page('earthlands'),/Ready to return · unpaid/);
});
test('survey claim control also requires its own complete current run at the correct separate giver',()=>{
 const{sim,rpg}=fixture('earthlands'),d=W.definition('earthlands'),ui=Object.create(WorldUI.WorldUI.prototype);ui.rpg=rpg;
 const giver=d.points.find(p=>p.id===d.quest.giverId);sim.state.player={...giver,yaw:0};sim.state.journeys.realms[d.id].counter=1;sim.state.journeys.realms[d.id].active={run:1,kind:'opening',observed:[]};
 assert.ok(!ui.work(d).includes('data-rpg="world-claim"'));assert.match(ui.work(d),/0\/3 observations recorded for run 1/);
 sim.state.journeys.realms[d.id].active.observed=d.quest.objectives.map(o=>o.id);assert.match(ui.work(d),/data-rpg="world-claim"/);
 sim.state.player={...definition('earthlands').giver,yaw:0};assert.ok(!ui.work(d).includes('data-rpg="world-claim"'),'Vessa cannot pay Merren’s separate survey');
});
test('a recorded or prerequisite-locked dry route refuses stale controls without walking',()=>{
 const{sim,ui,effects}=fixture('earthlands'),d=accept(sim,'earthlands');
 ui.action(el('trail-walk','road-pack'));assert.equal(effects.walks.length,0);
 sim.state.realmTrails.records[d.id].steps.push('fallen-bough');ui.action(el('trail-walk','fallen-bough'));assert.equal(effects.walks.length,0);assert.equal(effects.painted,2);
});
test('a route uses the restored current simulation, refusing a previous character trail id',()=>{
 const{sim,ui,rpg,effects}=fixture('earthlands');accept(sim,'earthlands');
 const other=fixture('atlantis').sim;accept(other,'atlantis');rpg.sim=other;const before=copy(other.state);
 ui.action(el('trail-walk','fallen-bough'));assert.equal(effects.walks.length,0);assert.deepEqual(other.state,before);assert.equal(ui.local().realm,'atlantis');
 assert.ok(!ui.journal().includes('Wood, Reed and a Road Home'));
});
test('water, air-court and escort routes give guidance without impossible dry walks',()=>{
 for(const[realm,id]of[['atlantis','upper-gauge'],['hell','refuge-arrival']]){
  const{sim,ui,effects}=fixture(realm),d=accept(sim,realm),step=d.steps.find(s=>s.id===id);sim.state.realmTrails.records[d.id].steps=step.requires;
  ui.action(el('trail-walk',id));assert.equal(effects.walks.length,0);assert.equal(effects.closed,0);assert.match(effects.toasts[0],realm==='hell'?/Neris/:/Tide Steps/);
 }
});
test('available-action map legend routes dry work but names gallery controls instead of walking underwater',()=>{
 const{sim}=fixture('earthlands');accept(sim,'earthlands');const dry=WorldUI.trailLegend(sim);
 assert.match(dry,/data-rpg="trail-walk" data-id="fallen-bough"/);assert.ok(!dry.includes('data-id="road-pack"'));
 const wet=fixture('atlantis').sim;accept(wet,'atlantis');const html=WorldUI.trailLegend(wet);
 assert.match(html,/F \/ G/);assert.match(html,/data-rpg="world-walk" data-id="tide-steps"/);assert.ok(!html.includes('data-rpg="trail-walk"'));
 wet.worldDive={y:-.5};const immersed=WorldUI.trailLegend(wet);assert.ok(!immersed.includes('data-rpg="world-walk"'));assert.match(immersed,/releasing holds depth/);
});
test('Road marker navigation uses the current realm return point and refuses unrelated or wet rooms',()=>{
 const{sim,rpg,effects}=fixture('heaven'),ui=Object.create(WorldUI.WorldUI.prototype);ui.rpg=rpg;
 ui.action(el('world-road'));const point=W.definition('heaven').points.find(p=>p.kind==='return');assert.deepEqual(effects.walks,[{x:point.x,z:point.z}]);
 sim.room='mine';ui.action(el('world-road'));assert.equal(effects.walks.length,1);
 sim.room=W.definition('atlantis').room;sim.worldDive={y:-.5};ui.action(el('world-road'));assert.equal(effects.walks.length,1);
 delete sim.worldDive;sim.room=null;ui.action(el('world-road'));assert.deepEqual(effects.walks.at(-1),W.GATE);
});
test('road cards show claimed trails and current repeat runs as distinct records',()=>{
 const{sim,ui}=fixture(),d=accept(sim,'cosmos');finish(sim,d);sim.state.realmTrails.records[d.id].claimed=true;
 Object.assign(sim.state.journeys.realms.cosmos,{firstClaimed:true,counter:2,lastClaim:1,active:{run:2,kind:'survey',observed:['first','second','third']}});
 const html=ui.status('cosmos');assert.match(html,/Trail complete · fee claimed once/);assert.match(html,/Repeat survey · run 2 · 3\/3 observations · separate fee/);
});
