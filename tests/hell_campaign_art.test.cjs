/* Labelled synthetic projection/ownership boundaries, not earned play proof. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),W=require('../src/world-foundations.js'),E=require('../src/engine.js'),H=require('../src/hell-campaign.js');
const Art=require('../src/hell-campaign-art.js'),UI=require('../src/hell-campaign-ui.js'),D=H.definition;
const empty=()=>({box:[],octa:[],disc:[],round:[]}),all=o=>Object.values(o).flat();
function vertices(p,kind){const g=E.geometry(kind),m=p.m||E.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),out=[];for(let i=0;i<g.length;i+=6)out.push(E.M.transform(m,Array.from(g.slice(i,i+3))));return out;}
function partsVertices(o){return Object.entries(o).flatMap(([kind,ps])=>ps.flatMap(p=>vertices(p,kind).map(v=>({p,v}))));}
function specimen(steps=[],choice=null){const sim=new C.Simulation();sim.room=D.room;sim.state.adventure.started=true;sim.state.hellCampaign={...H.fresh(),accepted:true,steps:steps.slice(),choice};A.runtime(sim);return sim;}
function boss(sim){sim.state.hellCampaign.steps=D.steps.filter(s=>['witness-record','tovan-account','read-service-writ','challenge-veyr'].includes(s.id)).map(s=>s.id);A.syncScene(sim);const e=A.runtime(sim).enemies.find(e=>e.id===D.enemy.id);assert.ok(e);return e;}
function uiHarness(sim){let active='synthetic-campaign-character',revision=7,commands=[];const rpg={sim,quest:'hell-campaign',tab:'hell-campaign',paint(){},open(){},close(){},api:{worldContext:()=>({sim:rpg.sim,active,revision}),toast(){},hellCampaignCommand(type,payload){commands.push({type,payload});return{ok:false,error:'synthetic command sink'};}}};const ui=new UI.HellCampaignUI(rpg);return{rpg,ui,commands,switchActive(v){active=v;},setRevision(v){revision=v;}};}
function actionFrom(html,type,id=''){const re=new RegExp('<button data-rpg="hell-campaign-'+type+'" data-id="'+id+'" ([^>]*)>');const m=html.match(re);assert.ok(m,'missing '+type+' '+id);const attrs=m[1],revision=attrs.match(/data-revision="([^"]+)"/)?.[1],binding=attrs.match(/data-binding="([^"]+)"/)?.[1];return{dataset:{rpg:'hell-campaign-'+type,id,revision,binding}};}

test('static work appears only for actual accepted recorded actions and never draws a second witness',()=>{
 const sim=specimen(),before=JSON.stringify(sim.state),out=empty();Art.draw(out,sim,1);assert.deepEqual(all(out),[]);assert.equal(JSON.stringify(sim.state),before);
 sim.state.hellCampaign.steps=['witness-record'];Art.draw(out,sim,2);assert.ok(all(out).some(p=>p.hellCampaignPart==='preserved-witness-account'));assert.ok(all(out).every(p=>!p.person&&!p.actor&&!p.travelerPart));
 sim.state.hellCampaign.accepted=false;const invisible=empty();Art.draw(invisible,sim,2);assert.deepEqual(all(invisible),[]);
 sim.state.hellCampaign.accepted=true;sim.room=null;const home=empty();Art.draw(home,sim,2);assert.deepEqual(all(home),[]);
});

test('all transformed service props have real supported ground and avoid canonical solids',()=>{
 for(const choice of D.choices.map(c=>c.id)){
  const sim=specimen(D.steps.map(s=>s.id),choice),before=JSON.stringify(sim.state),out=empty();Art.draw(out,sim,12);
  assert.equal(JSON.stringify(sim.state),before);assert.ok(all(out).length<170);
  const tri=Object.entries(out).reduce((n,[k,ps])=>n+ps.length*E.geometry(k).length/18,0);assert.ok(tri<3500,'bounded original geometry '+tri);
  for(const{p,v}of partsVertices(out)){
   assert.ok(v.every(Number.isFinite));assert.ok(v[1]>=1.57-1e-5,'part grounded: '+p.hellCampaignPart);
   assert.ok(W.land(D.room,v[0],v[2],0),'supported projected footprint: '+p.hellCampaignPart);
   assert.ok(!W.definition(D.room).solids.some(s=>Math.abs(v[0]-s.x)<s.w/2&&Math.abs(v[2]-s.z)<s.d/2),'part intrudes into canonical solid: '+p.hellCampaignPart);
   assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.appearanceOnly,true);
  }
 }
});

test('Unbind, Divert and License have different engine and plate shapes tied to the saved disposition',()=>{
 const expected={unbind:'open-release-handle',divert:'hooded-service-marker',license:'named-crew-seal'};const samples={};
 for(const choice of Object.keys(expected)){
  const sim=specimen(D.steps.map(s=>s.id),choice),out=empty();Art.draw(out,sim,3);samples[choice]=out;
  for(const fixture of['service-engine','route-plate'])assert.ok(all(out).some(p=>p.hellCampaignFixture===fixture&&p.hellCampaignPart===expected[choice]));
  for(const[other,part]of Object.entries(expected))if(other!==choice)assert.ok(!all(out).some(p=>p.hellCampaignPart===part));
  assert.equal(all(out).filter(p=>p.hellCampaignPart==='named-crew-seal').length,choice==='license'?4:0);
  const unfinished=specimen(['witness-record','tovan-account','read-service-writ'],choice),before=empty();Art.draw(before,unfinished,3);assert.ok(!all(before).some(p=>Object.values(expected).includes(p.hellCampaignPart)),'unrecorded preview cannot become a physical choice');
 }
 assert.notDeepEqual(samples.unbind,samples.divert);assert.notDeepEqual(samples.divert,samples.license);
});

test('supplied optional fittings visibly change from loose to seated only after their own action',()=>{
 const sim=specimen(['witness-record','tovan-account','read-service-writ']),loose=empty();Art.draw(loose,sim,0);
 assert.ok(all(loose).some(p=>p.hellCampaignPart==='supplied-loose-shunt'));assert.ok(all(loose).some(p=>p.hellCampaignPart==='supplied-loose-brace-pin'));assert.ok(!all(loose).some(p=>p.hellCampaignFitted));
 sim.state.hellCampaign.steps.push('west-shunt');const west=empty();Art.draw(west,sim,0);assert.ok(all(west).some(p=>p.hellCampaignPart==='seated-shunt'));assert.ok(!all(west).some(p=>p.hellCampaignPart==='supplied-loose-shunt'));assert.ok(all(west).some(p=>p.hellCampaignPart==='supplied-loose-brace-pin'));
 sim.state.hellCampaign.steps.push('east-brace');const both=empty();Art.draw(both,sim,0);assert.ok(all(both).some(p=>p.hellCampaignPart==='seated-brace-pin'));assert.ok(!all(both).some(p=>p.hellCampaignPart==='supplied-loose-brace-pin'));
});

test('Veyr uses the canonical live actor frame and its entire transformed body fits the declared .65 impact radius',()=>{
 const sim=specimen(),e=boss(sim);e.x=3;e.z=-98;
 for(const yaw of[0,.73,Math.PI/2,Math.PI,-Math.PI/3])for(const mode of['idle','windup','recover']){
  e.yaw=yaw;e.mode=mode;e.timer=.8;e.strike=null;const before=JSON.stringify({state:sim.state,actor:e}),out=empty(),frame=Art.drawEnemy(out,sim,e,10);
  assert.equal(JSON.stringify({state:sim.state,actor:e}),before);assert.equal(frame.x,e.x);assert.equal(frame.z,e.z);assert.equal(frame.yaw,yaw);assert.equal(frame.base,1.57);
  for(const{p,v}of partsVertices(out)){assert.ok(Math.hypot(v[0]-e.x,v[2]-e.z)<=D.enemy.radius+1e-5,'real transformed body beyond collider: '+p.hellCampaignPart);assert.ok(v[1]>=1.57-1e-5);}
  assert.ok(all(out).length<40);assert.ok(all(out).every(p=>p.hellCampaignActor===e.id));
 }
 const copied=empty();assert.equal(Art.drawEnemy(copied,sim,{...e},1),false);assert.deepEqual(all(copied),[]);
 e.hellCampaign='foreign-campaign';assert.equal(Art.drawEnemy(empty(),sim,e,1),false);
});

test('locked rectangular warnings follow the immutable strike frame and preserve distinct broad/short versus narrow/long footprints',()=>{
 const sim=specimen(),e=boss(sim),shapes={};
 for(const kind of['sweep','line']){
  const pattern=global.RealmHellCampaignData.patterns[kind];e.mode='windup';e.yaw=-.9;e.strike=Object.freeze({x:e.x-.2,z:e.z+.3,yaw:.41,kind,length:pattern.length,halfWidth:pattern.halfWidth});
  const before=JSON.stringify(e),out=empty();Art.drawEnemy(out,sim,e,1);assert.equal(JSON.stringify(e),before);const warning=partsVertices(out).filter(({p})=>p.hellCampaignTelegraph);assert.ok(warning.length);
  const s=e.strike,local=warning.map(({v})=>{const dx=v[0]-s.x,dz=v[2]-s.z;return{side:dx*Math.cos(s.yaw)-dz*Math.sin(s.yaw),forward:dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw)};});
  for(const p of local){assert.ok(Math.abs(p.side)<=s.halfWidth+1e-5);assert.ok(p.forward>=-1e-5&&p.forward<=s.length+1e-5);}
  shapes[kind]={width:Math.max(...local.map(p=>p.side))-Math.min(...local.map(p=>p.side)),length:Math.max(...local.map(p=>p.forward))-Math.min(...local.map(p=>p.forward))};
  assert.ok(Math.abs(shapes[kind].width-2*s.halfWidth)<1e-4);assert.ok(Math.abs(shapes[kind].length-s.length)<1e-4);
  e.mode='recover';const noWarning=empty();Art.drawEnemy(noWarning,sim,e,1);assert.ok(!all(noWarning).some(p=>p.hellCampaignTelegraph));
 }
 assert.ok(shapes.sweep.width>shapes.line.width&&shapes.sweep.length<shapes.line.length);
});

test('reduced motion and pause keep art deterministic across wall-clock samples while the real combat mode remains readable',()=>{
 const sim=specimen(),e=boss(sim);e.mode='windup';e.timer=.7;
 for(const paused of[false,true]){sim.paused=paused;sim.state.settings.reducedMotion=true;const a=empty(),b=empty();Art.drawEnemy(a,sim,e,0);Art.drawEnemy(b,sim,e,999);assert.deepEqual(a,b);e.mode='recover';const c=empty();Art.drawEnemy(c,sim,e,999);assert.notDeepEqual(b,c);assert.ok(all(c).some(p=>p.hellCampaignPart==='warden-exposed-bearing'&&p.em>0));e.mode='windup';}
});

test('journal, map and page are pure; route points never accept work or turn a combat defeat into a button',()=>{
 const sim=specimen(),h=uiHarness(sim),before=JSON.stringify(sim.state);h.ui.journal();h.ui.page('hell-campaign');assert.deepEqual(UI.routePoints(sim).map(p=>p.id),['witness-record']);assert.equal(JSON.stringify(sim.state),before);assert.deepEqual(h.commands,[]);
 boss(sim);sim.state.player={x:0,z:-99,yaw:0};const page=h.ui.page('hell-campaign').html;assert.ok(page.includes('Close this workspace to resume combat'));assert.ok(!page.includes('data-rpg="hell-campaign-step" data-id="warden-resolved"'));
});

test('the verified saved choice has visible distinct Istra, Tovan and Neris recognition without a premature claim',()=>{
 for(const choice of D.choices.map(c=>c.id)){
  const sim=specimen(D.steps.filter(s=>!s.optional).map(s=>s.id),choice),h=uiHarness(sim),before=JSON.stringify(sim.state),page=h.ui.page('hell-campaign').html;
  assert.ok(page.includes('hell-campaign-local-recognition'));for(const name of['Istra','Tovan','Neris'])assert.ok(page.includes('<strong>'+name+':</strong>'));assert.ok(page.includes('Complete · unpaid'));assert.equal(JSON.stringify(sim.state),before);
  sim.state.hellCampaign.steps=sim.state.hellCampaign.steps.filter(id=>id!=='verify-route');assert.ok(!h.ui.page('hell-campaign').html.includes('hell-campaign-local-recognition'));
 }
});

test('a disposition requires explicit two-stage confirmation and retains expected character ownership',()=>{
 const ids=D.steps.filter(s=>!s.optional&&!['disposition','verify-route'].includes(s.id)).map(s=>s.id),sim=specimen(ids);sim.state.player={x:0,z:-105,yaw:0};const h=uiHarness(sim),first=h.ui.page('hell-campaign').html;
 h.ui.action(actionFrom(first,'review','unbind'));assert.equal(h.commands.length,0);assert.ok(h.ui.pending);assert.equal(sim.state.hellCampaign.choice,null);
 const confirm=h.ui.page('hell-campaign').html;h.ui.action(actionFrom(confirm,'confirm','unbind'));assert.equal(h.commands.length,1);assert.equal(h.commands[0].type,'choose');assert.equal(h.commands[0].payload.choice,'unbind');assert.equal(h.commands[0].payload.expectedRevision,sim.state.adventure.revision);assert.equal(h.commands[0].payload.expectedActive,'synthetic-campaign-character');assert.equal(h.ui.pending,null);
});

test('stale same-revision character, roster revision, physical position and campaign revision refuse a disposition preview without dispatch',()=>{
 for(const drift of['active','roster','sim','position','adventure']){
  const ids=D.steps.filter(s=>!s.optional&&!['disposition','verify-route'].includes(s.id)).map(s=>s.id),sim=specimen(ids);sim.state.player={x:0,z:-105,yaw:0};const h=uiHarness(sim);
  h.ui.action(actionFrom(h.ui.page('hell-campaign').html,'review','divert'));const stale=actionFrom(h.ui.page('hell-campaign').html,'confirm','divert');
  if(drift==='active')h.switchActive('another-character');if(drift==='roster')h.setRevision(8);if(drift==='sim'){const replacement=specimen(ids);replacement.state.player={...sim.state.player};h.rpg.sim=replacement;}if(drift==='position')sim.state.player.x+=.1;if(drift==='adventure')sim.state.adventure.revision++;
  h.ui.action(stale);assert.equal(h.commands.length,0,drift);assert.equal(h.ui.pending,null,drift);assert.equal(h.rpg.sim.state.hellCampaign.choice,null);
 }
});
