/* Actual catalogue-backed synthetic presentation boundaries. The rule owner
 * is not integrated in this candidate: these tests do not prove earned play,
 * escort movement, native persistence, browser pixels or device performance. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),W=require('../src/world-foundations.js'),E=require('../src/engine.js');
const Trails=require('../src/realm-trails.js');require('../src/realm-trails-ui.js');
const D=require('../src/heaven-campaign-data.js').definition,live=new WeakMap();
// A deliberately labelled read-only projection facade exercises the agreed
// future caller interface against real authored data and production reach.
const H=global.RealmHeavenCampaign={definition:D,
 eligible:state=>!!state.realmTrails.records[D.prerequisite]?.claimed,
 available:state=>{const r=state.heavenCampaign;return r?.accepted&&!r.claimed?D.steps.filter(s=>!r.steps.includes(s.id)&&s.requires.every(id=>r.steps.includes(id))):[];},
 ready:state=>!!state.heavenCampaign?.accepted&&D.steps.filter(s=>!s.optional).every(s=>state.heavenCampaign.steps.includes(s.id)),
 at:Trails.at,runtime:sim=>live.get(sim),beamLength:(_sim,e)=>e.strike?.length??0,
 escortStatus:sim=>{const r=live.get(sim);return r.escort?{status:r.escort.phase,help:'Owned courier '+r.escort.phase+' on the supported service loop.'}:{status:r.status||'reset',help:''};}
};
const Art=require('../src/heaven-campaign-art.js'),UI=require('../src/heaven-campaign-ui.js');
const empty=()=>({box:[],octa:[],disc:[],round:[]}),all=o=>Object.values(o).flat(),required=D.steps.filter(s=>!s.optional).map(s=>s.id);
function vertices(p,kind){const g=E.geometry(kind),m=p.m||E.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),out=[];for(let i=0;i<g.length;i+=6)out.push(E.M.transform(m,Array.from(g.slice(i,i+3))));return out;}
const projected=o=>Object.entries(o).flatMap(([kind,ps])=>ps.flatMap(p=>vertices(p,kind).map(v=>({p,v}))));
const triangles=o=>Object.entries(o).reduce((n,[k,ps])=>n+ps.length*E.geometry(k).length/18,0);
function specimen(steps=[],choice=null){const sim=new C.Simulation();sim.room=D.room;sim.state.adventure.started=true;
 sim.state.heavenCampaign={version:1,accepted:true,steps:steps.slice(),choice,claimed:false};live.set(sim,{escort:null,activation:null,status:'reset'});A.runtime(sim);return sim;}
function actor(sim,index){const terms=D.enemies[index];sim.state.heavenCampaign.steps=[...new Set([...sim.state.heavenCampaign.steps,...terms.spawnAfter])];
 const e={...terms,heavenCampaign:D.id,maxHP:terms.hp,mode:'idle',timer:0,yaw:0,flash:0};A.runtime(sim).enemies.push(e);return e;}
function courier(sim,phase='following'){sim.state.heavenCampaign.steps=[...new Set([...sim.state.heavenCampaign.steps,D.escort.startStep])];const e={id:D.escort.id,x:-35,z:-31,yaw:.4,phase};H.runtime(sim).escort=e;return e;}
function harness(sim){let active='synthetic-garden-traveller',revision=8,contextSim=null,result={ok:false,error:'synthetic command sink'};const commands=[],walks=[],toasts=[];
 const rpg={sim,quest:'heaven-campaign',tab:'heaven-campaign',closed:0,paints:0,opened:[],paint(){this.paints++;},open(t){this.opened.push(t);},close(){this.closed++;},api:{
  worldContext:()=>({sim:contextSim||rpg.sim,active,revision}),toast:text=>toasts.push(text),walkLocal:(x,z)=>walks.push({x,z}),heavenCampaignCommand(type,payload){commands.push({type,payload});return result;}
 }};
 return{ui:new UI.HeavenCampaignUI(rpg),rpg,commands,walks,toasts,setActive:v=>active=v,setRoster:v=>revision=v,setContext:v=>contextSim=v,setResult:v=>result=v};
}
function button(html,type,id=''){const m=html.match(new RegExp('<button data-rpg="heaven-campaign-'+type+'" data-id="'+id+'" ([^>]*)>'));assert.ok(m,'missing visible '+type+' '+id);
 return{dataset:{rpg:'heaven-campaign-'+type,id,revision:m[1].match(/data-revision="([^"]+)"/)?.[1],binding:m[1].match(/data-binding="([^"]+)"/)?.[1]}};}
function at(sim,id){const s=D.steps.find(s=>s.id===id);sim.state.player.x=s.x;sim.state.player.z=s.z;assert.ok(H.at(sim,s),'actual authored anchor reachable');}

test('accepted recorded facts alone project static work; reading and art preserve every stored field',()=>{
 const sim=specimen(),before=JSON.stringify(sim.state),out=empty();Art.draw(out,sim,1);assert.deepEqual(all(out),[]);assert.equal(JSON.stringify(sim.state),before);
 sim.state.heavenCampaign.steps=['witness-account'];Art.draw(out,sim,2);assert.ok(all(out).some(p=>p.heavenCampaignPart==='preserved-witness-account'));assert.ok(all(out).every(p=>!p.person&&!p.actor&&!p.heavenCampaignEscort));
 sim.state.heavenCampaign.accepted=false;const unaccepted=empty();Art.draw(unaccepted,sim,0);assert.deepEqual(all(unaccepted),[]);
 sim.state.heavenCampaign.accepted=true;sim.room=null;const home=empty();Art.draw(home,sim,0);assert.deepEqual(all(home),[]);
});

test('every transformed static footprint uses existing ground, avoids existing solids and stays within the draw budget',t=>{
 for(const choice of D.choices.map(c=>c.id)){
  const sim=specimen(D.steps.map(s=>s.id),choice),before=JSON.stringify(sim.state),out=empty();Art.draw(out,sim,999);
  assert.equal(JSON.stringify(sim.state),before);assert.ok(all(out).length<150,'static instance budget '+all(out).length);assert.ok(triangles(out)<3500,'static triangle budget '+triangles(out));
  t.diagnostic(choice+': '+all(out).length+' static instances, '+triangles(out)+' triangles');
  for(const{p,v}of projected(out)){
   assert.ok(v.every(Number.isFinite));assert.ok(v[1]>=1.57-1e-5,'grounded '+p.heavenCampaignPart);assert.ok(W.land(D.room,v[0],v[2],0),'supported '+p.heavenCampaignPart);
   assert.ok(!W.definition(D.room).solids.some(s=>Math.abs(v[0]-s.x)<s.w/2&&Math.abs(v[2]-s.z)<s.d/2),'existing solid overlap '+p.heavenCampaignPart);
   assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.appearanceOnly,true);
   if(p.heavenCampaignFixture==='arrival-assembly')assert.ok(v[0]>.69,'supplement preserves the separate central complete-return-arm footprint');
  }
 }
});

test('supplied optional mirror is loose until its own recorded action, and waymarks follow the exact existing escort route',()=>{
 const sim=specimen(['inspect-false-relay']),loose=empty();Art.draw(loose,sim,0);assert.ok(all(loose).some(p=>p.heavenCampaignPart==='supplied-loose-mirror'));assert.ok(!all(loose).some(p=>p.heavenCampaignFitted));
 sim.state.heavenCampaign.steps.push('ground-mirror');const seated=empty();Art.draw(seated,sim,0);assert.ok(all(seated).some(p=>p.heavenCampaignPart==='seated-mirror-frame'));assert.ok(!all(seated).some(p=>p.heavenCampaignPart==='supplied-loose-mirror'));
 assert.ok(!all(seated).some(p=>p.heavenCampaignFixture==='service-waymark'));sim.state.heavenCampaign.steps.push('secure-service-route');const marked=empty();Art.draw(marked,sim,0);
 const posts=all(marked).filter(p=>p.heavenCampaignPart==='supplied-route-post');assert.equal(posts.length,D.escort.route.length);for(const p of posts){const q=D.escort.route[p.heavenCampaignWaypoint];assert.ok(Math.abs(p.p[0]-q.x-.75)<1e-5);assert.ok(Math.abs(p.p[2]-q.z-.65)<1e-5);}
});

test('both saved arrangements have distinct ordinary fittings readable on both faces while retaining three ceremonial notches per face',()=>{
 const outputs=[];for(const choice of D.choices.map(c=>c.id)){
  const sim=specimen(required,choice),out=empty();Art.draw(out,sim,0);outputs.push(out);
  assert.equal(all(out).filter(p=>p.heavenCampaignPart==='retained-ceremonial-notch').length,6);
  const specific=choice==='accessible-assist'?'request-plate':'ordinary-press-rim',face=all(out).filter(p=>p.heavenCampaignPart===specific);assert.equal(face.length,2);assert.ok(face.some(p=>p.p[2]>-1)&&face.some(p=>p.p[2]<-1));
  assert.ok(all(out).some(p=>p.heavenCampaignPart===(choice==='accessible-assist'?'lower-assist-lever':'broad-activation-plate')));
  assert.ok(!all(out).some(p=>p.heavenCampaignPart===(choice==='accessible-assist'?'broad-activation-plate':'lower-assist-lever')));
  const preview=specimen(['fit-arrival-assist'],choice),notSaved=empty();Art.draw(notSaved,preview,0);assert.ok(!all(notSaved).some(p=>['lower-assist-lever','broad-activation-plate'].includes(p.heavenCampaignPart)));
 }assert.notDeepEqual(outputs[0],outputs[1]);
});

test('instrument motion belongs to a current matching bounded activation; pause, reduced motion and rest stay quiet',()=>{
 for(const choice of D.choices.map(c=>c.id)){
  const sim=specimen(required,choice);sim.state.adventure.elapsed=100.6;const rest=empty(),later=empty();Art.draw(rest,sim,0);Art.draw(later,sim,999);assert.deepEqual(rest,later);
  H.runtime(sim).activation={choice,at:100,active:true};const before=JSON.stringify({state:sim.state,runtime:H.runtime(sim)}),moving=empty();Art.draw(moving,sim,20);assert.notDeepEqual(moving,rest);assert.ok(all(moving).some(p=>p.heavenCampaignActivation));assert.equal(JSON.stringify({state:sim.state,runtime:H.runtime(sim)}),before);
  for(const mode of['pause','reduced']){sim.paused=mode==='pause';sim.state.settings.reducedMotion=mode==='reduced';const quiet=empty();Art.draw(quiet,sim,500);assert.deepEqual(quiet,rest);}
  sim.paused=false;sim.state.settings.reducedMotion=false;H.runtime(sim).activation.choice='foreign-choice';const foreign=empty();Art.draw(foreign,sim,20);assert.deepEqual(foreign,rest);
  H.runtime(sim).activation.choice=choice;for(const age of[-.1,0,Art.ACTIVATION_DURATION,Art.ACTIVATION_DURATION+9]){sim.state.adventure.elapsed=100+age;const expired=empty();Art.draw(expired,sim,20);assert.deepEqual(expired,rest);}
 }
});

test('each actual apparatus uses its owned runtime actor frame and all transformed body vertices fit the declared impact radius',()=>{
 for(let i=0;i<D.enemies.length;i++){
  const sim=specimen(),e=actor(sim,i),terms=D.enemies[i];e.x=2;e.z=-70;
  for(const yaw of[0,.73,Math.PI/2,Math.PI,-Math.PI/3])for(const mode of['idle','windup','recover']){
   e.yaw=yaw;e.mode=mode;e.timer=.8;e.strike=null;const before=JSON.stringify({state:sim.state,actor:e}),out=empty(),frame=Art.drawEnemy(out,sim,e,10);
   assert.equal(JSON.stringify({state:sim.state,actor:e}),before);assert.equal(frame.x,e.x);assert.equal(frame.z,e.z);assert.equal(frame.yaw,yaw);assert.equal(frame.base,1.57);assert.equal(frame.pattern,terms.attack.kind);
   for(const{p,v}of projected(out)){assert.ok(Math.hypot(v[0]-e.x,v[2]-e.z)<=terms.radius+1e-5,'body outside impact volume '+p.heavenCampaignPart);assert.ok(v[1]>=1.57-1e-5);}
   assert.ok(all(out).length<35);assert.ok(all(out).every(p=>p.heavenCampaignActor===e.id));
  }
  assert.equal(Art.drawEnemy(empty(),sim,{...e},1),false);e.heavenCampaign='foreign-campaign';assert.equal(Art.drawEnemy(empty(),sim,e,1),false);e.heavenCampaign=D.id;sim.state.heavenCampaign.steps.push(terms.defeatStep);assert.equal(Art.drawEnemy(empty(),sim,e,1),false);
 }
});

test('directed beam warning projects only the immutable locked rectangle, independent of later actor or player movement',()=>{
 const sim=specimen(),e=actor(sim,0),a=D.enemies[0].attack;e.mode='windup';e.strike=Object.freeze({kind:'beam',x:1,z:-63,yaw:.41,length:a.length,halfWidth:a.halfWidth});
 const before=JSON.stringify(e),out=empty();Art.drawEnemy(out,sim,e,0);assert.equal(JSON.stringify(e),before);const warning=projected(out).filter(({p})=>p.heavenCampaignTelegraph),s=e.strike;assert.ok(warning.length);
 const local=warning.map(({v})=>{const dx=v[0]-s.x,dz=v[2]-s.z;return{side:dx*Math.cos(s.yaw)-dz*Math.sin(s.yaw),forward:dx*Math.sin(s.yaw)+dz*Math.cos(s.yaw)};});
 for(const p of local){assert.ok(Math.abs(p.side)<=s.halfWidth+1e-5);assert.ok(p.forward>=-1e-5&&p.forward<=s.length+1e-5);}
 assert.ok(Math.abs(Math.max(...local.map(p=>p.side))-Math.min(...local.map(p=>p.side))-2*s.halfWidth)<1e-4);assert.ok(Math.abs(Math.max(...local.map(p=>p.forward))-Math.min(...local.map(p=>p.forward))-s.length)<1e-4);
 const saved=all(out).filter(p=>p.heavenCampaignTelegraph);e.x=-3;e.z=-60;e.yaw=-1;sim.state.player.x=20;const moved=empty();Art.drawEnemy(moved,sim,e,999);assert.deepEqual(all(moved).filter(p=>p.heavenCampaignTelegraph),saved);
 e.mode='recover';const noWarning=empty();Art.drawEnemy(noWarning,sim,e,0);assert.ok(!all(noWarning).some(p=>p.heavenCampaignTelegraph));
});

test('relay warning is a radial perimeter at the actual locked pulse center and never exceeds its real radius',()=>{
 const sim=specimen(),e=actor(sim,1);e.mode='windup';e.strike=Object.freeze({kind:'pulse',x:7,z:-99,radius:D.enemies[1].attack.radius});const out=empty();Art.drawEnemy(out,sim,e,0);
 const parts=all(out).filter(p=>p.heavenCampaignTelegraph),points=projected(out).filter(({p})=>p.heavenCampaignTelegraph);assert.equal(parts.filter(p=>p.heavenCampaignPart==='locked-pulse-perimeter').length,32);assert.equal(parts.filter(p=>p.heavenCampaignPart==='radial-pulse-notch').length,4);
 for(const{p,v}of points){const radius=Math.hypot(v[0]-e.strike.x,v[2]-e.strike.z);assert.ok(radius<=e.strike.radius+1e-5);assert.equal(p.heavenCampaignPattern,'pulse');assert.ok(!p.heavenCampaignPart.includes('beam'));}
 for(const[x,z]of[[1,0],[-1,0],[0,1],[0,-1]])assert.ok(points.some(({v})=>(v[0]-e.strike.x)*x+(v[2]-e.strike.z)*z>e.strike.radius-.2),'visible cardinal pulse perimeter');
 e.x=3;e.z=-97;e.yaw=1.8;const shifted=empty();Art.drawEnemy(shifted,sim,e,500);assert.deepEqual(all(shifted).filter(p=>p.heavenCampaignTelegraph),parts);
 e.mode='recover';const noWarning=empty();Art.drawEnemy(noWarning,sim,e,0);assert.ok(!all(noWarning).some(p=>p.heavenCampaignTelegraph));
});

test('a supplied lock clipped before the existing Garden instrument cannot project past cover, and zero length warns nowhere',()=>{
 // This is a locked-frame projection fixture, not a test of future lock rules.
 // The actual existing opaque instrument makes the unclipped ray invalid.
 const sim=specimen(),e=actor(sim,0);e.x=0;e.z=-1;e.mode='windup';e.strike=Object.freeze({kind:'beam',x:0,z:-1,yaw:Math.PI,length:3.4,halfWidth:.65});
 for(const side of[-.65,0,.65]){assert.ok(W.segment(D.room,{x:side,z:-1},{x:side,z:-4.4},.04));assert.equal(W.segment(D.room,{x:side,z:-1},{x:side,z:-10},.04),false);}
 const out=empty();Art.drawEnemy(out,sim,e,0);const warning=projected(out).filter(({p})=>p.heavenCampaignTelegraph);assert.ok(warning.length);
 for(const{v}of warning){assert.ok(v[2]>=-4.4-1e-5);assert.ok(!W.definition(D.room).solids.some(s=>Math.abs(v[0]-s.x)<s.w/2&&Math.abs(v[2]-s.z)<s.d/2));}
 e.strike=Object.freeze({...e.strike,length:0});const blocked=empty();assert.ok(Art.drawEnemy(blocked,sim,e,0));assert.ok(all(blocked).length);assert.ok(!all(blocked).some(p=>p.heavenCampaignTelegraph));
});

test('short positive cover-clipped beam warnings keep caps and directional notches inside the supplied locked length',()=>{
 const sim=specimen(),e=actor(sim,0);e.mode='windup';for(const length of[.005,.02,.04,.08])for(const yaw of[0,.41,Math.PI]){
  e.strike=Object.freeze({kind:'beam',x:1,z:-63,yaw,length,halfWidth:.65});const before=JSON.stringify(e),out=empty();Art.drawEnemy(out,sim,e,0);assert.equal(JSON.stringify(e),before);
  const warning=projected(out).filter(({p})=>p.heavenCampaignTelegraph);assert.ok(warning.length);
  for(const{p,v}of warning){const dx=v[0]-e.strike.x,dz=v[2]-e.strike.z,side=dx*Math.cos(yaw)-dz*Math.sin(yaw),forward=dx*Math.sin(yaw)+dz*Math.cos(yaw);
   assert.ok(forward>=-1e-5&&forward<=length+1e-5,'short '+length+' locked frame exceeded by '+p.heavenCampaignPart+' at '+forward);assert.ok(Math.abs(side)<=e.strike.halfWidth+1e-5);
  }
 }
});

test('combat pause and reduced motion preserve deterministic frames with actual phase differences',()=>{
 for(let i=0;i<D.enemies.length;i++){
  const sim=specimen(),e=actor(sim,i);e.mode='windup';e.timer=.7;
  for(const paused of[false,true]){sim.paused=paused;sim.state.settings.reducedMotion=true;const a=empty(),b=empty();Art.drawEnemy(a,sim,e,0);Art.drawEnemy(b,sim,e,999);assert.deepEqual(a,b);e.mode='recover';const c=empty();Art.drawEnemy(c,sim,e,999);assert.notDeepEqual(b,c);e.mode='windup';}
 }
});

test('courier art uses only the actual transient actor and never reconstructs a second courier from saved invitation or arrival',()=>{
 const waiting=specimen(),idle={id:D.escort.id,x:D.escort.x,z:D.escort.z,yaw:0,phase:'idle'};H.runtime(waiting).escort=idle;const visible=empty();assert.equal(Art.drawEscort(visible,waiting,idle,0).phase,'idle');assert.ok(all(visible).length);assert.deepEqual(waiting.state.heavenCampaign.steps,[]);assert.equal(Art.drawEscort(empty(),waiting,{...idle},0),false);
 idle.phase='following';assert.equal(Art.drawEscort(empty(),waiting,idle,0),false);
 const sim=specimen(required),e=courier(sim);for(const yaw of[0,.4,Math.PI/2,-Math.PI/3])for(const phase of['following','lagging','arrived']){
  e.yaw=yaw;e.phase=phase;const before=JSON.stringify({state:sim.state,actor:e}),out=empty(),frame=Art.drawEscort(out,sim,e,999);assert.equal(frame.x,e.x);assert.equal(frame.z,e.z);assert.equal(frame.phase,phase);assert.equal(JSON.stringify({state:sim.state,actor:e}),before);
  for(const{p,v}of projected(out)){assert.ok(Math.hypot(v[0]-e.x,v[2]-e.z)<=D.escort.radius+1e-5,'courier body beyond collider '+p.heavenCampaignPart);assert.ok(v[1]>=1.57-1e-5);}assert.ok(all(out).length<25);assert.ok(all(out).every(p=>p.heavenCampaignEscort===e.id));
 }
 assert.equal(Art.drawEscort(empty(),sim,{...e},0),false);H.runtime(sim).escort=null;assert.equal(Art.drawEscort(empty(),sim,e,0),false);const staticOnly=empty();Art.draw(staticOnly,sim,0);assert.ok(!all(staticOnly).some(p=>p.heavenCampaignEscort));
 H.runtime(sim).escort=e;for(const phase of['reset','inactive']){e.phase=phase;assert.equal(Art.drawEscort(empty(),sim,e,0),false);}e.phase='following';sim.room=null;assert.equal(Art.drawEscort(empty(),sim,e,0),false);
});

test('worst-case union of all fittings, separately owned encounter frames and courier stays within the combined geometry budget',t=>{
 // The authored encounters are sequential; this union is a conservative draw
 // upper bound, not a claim that both enemies are simultaneously alive.
 const sim=specimen(D.steps.map(s=>s.id),'accessible-assist'),beam=specimen(),relay=specimen(),out=empty();Art.draw(out,sim,0);const e0=actor(beam,0),e1=actor(relay,1);e0.mode=e1.mode='windup';
 e0.strike={kind:'beam',x:e0.x,z:e0.z,yaw:0,length:9,halfWidth:.65};e1.strike={kind:'pulse',x:e1.x,z:e1.z,radius:3.4};assert.ok(Art.drawEnemy(out,beam,e0,0));assert.ok(Art.drawEnemy(out,relay,e1,0));assert.ok(Art.drawEscort(out,sim,courier(sim),0));
 assert.ok(all(out).length<250,'combined instance budget '+all(out).length);assert.ok(triangles(out)<5500,'combined triangle budget '+triangles(out));
 t.diagnostic(all(out).length+' combined instances, '+triangles(out)+' triangles');
});

test('journal, map, legend and page are pure; defeats and actual courier arrival have no completion buttons',()=>{
 const sim=specimen(),h=harness(sim),before=JSON.stringify(sim.state);h.ui.journal();h.ui.page('heaven-campaign');UI.legend(sim);assert.deepEqual(UI.routePoints(sim).map(p=>p.id),['witness-account']);assert.equal(JSON.stringify(sim.state),before);assert.deepEqual(h.commands,[]);
 for(const enemy of D.enemies){sim.state.heavenCampaign.steps=required.slice(0,required.indexOf(enemy.defeatStep));at(sim,enemy.defeatStep);const html=h.ui.page('heaven-campaign').html;assert.ok(html.includes('Close this workspace to resume combat'));assert.ok(!html.includes('data-rpg="heaven-campaign-step" data-id="'+enemy.defeatStep+'"'));}
 sim.state.heavenCampaign.steps=required.slice(0,required.indexOf(D.escort.arrivalStep));at(sim,D.escort.arrivalStep);const html=h.ui.page('heaven-campaign').html;assert.ok(html.includes('there is no arrival button'));assert.ok(!html.includes('data-rpg="heaven-campaign-step" data-id="'+D.escort.arrivalStep+'"'));assert.ok(!html.includes('data-rpg="heaven-campaign-arrive"'));
});

test('remote first invite and a reset escort walk link both reach the real staging anchor without work or actor creation',()=>{
 const sim=specimen(required.slice(0,required.indexOf(D.escort.startStep))),h=harness(sim);sim.state.player.x=7;sim.state.player.z=17;const before=JSON.stringify(sim.state),html=h.ui.page('heaven-campaign').html;
 h.ui.action(button(html,'walk','escort-staging'));assert.equal(h.walks.length,1);assert.ok(Math.hypot(h.walks[0].x-D.escort.x,h.walks[0].z-D.escort.z)<2.8);assert.ok(W.walkable(D.room,h.walks[0].x,h.walks[0].z));assert.equal(JSON.stringify(sim.state),before);assert.deepEqual(h.commands,[]);assert.equal(H.runtime(sim).escort,null);
 sim.state.heavenCampaign.steps.push(D.escort.startStep);const recorded=JSON.stringify(sim.state),reset=h.ui.page('heaven-campaign').html;assert.ok(reset.includes('unfinished escort resets'));assert.ok(reset.includes('deliberately invite again'));h.ui.action(button(reset,'walk','escort-staging'));assert.equal(h.walks.length,2);assert.equal(JSON.stringify(sim.state),recorded);
 at(sim,D.escort.startStep);const invitedBefore=JSON.stringify(sim.state),here=h.ui.page('heaven-campaign').html;h.ui.action(button(here,'invite',D.escort.startStep));assert.equal(h.commands.length,1);assert.equal(h.commands[0].type,'escort-invite');assert.equal(h.commands[0].payload.step,D.escort.startStep);assert.equal(h.commands[0].payload.expectedActive,'synthetic-garden-traveller');assert.equal(h.commands[0].payload.expectedRevision,sim.state.adventure.revision);assert.equal(JSON.stringify(sim.state),invitedBefore);
});

test('active map position comes from the actual live courier while reset preserves only honest staging and destination guidance',()=>{
 const sim=specimen(required.slice(0,required.indexOf(D.escort.arrivalStep))),e=courier(sim),before=JSON.stringify(sim.state);const active=UI.routePoints(sim),point=active.find(p=>p.id==='escort-position');assert.equal(point.x,e.x);assert.equal(point.z,e.z);assert.equal(point.informative,true);assert.ok(active.some(p=>p.id===D.escort.arrivalStep));assert.equal(JSON.stringify(sim.state),before);
 e.x=-24;e.z=-7;assert.equal(UI.routePoints(sim).find(p=>p.id==='escort-position').x,-24);H.runtime(sim).escort=null;const reset=UI.routePoints(sim);assert.ok(!reset.some(p=>p.id==='escort-position'));assert.ok(reset.some(p=>p.id==='escort-staging'));assert.equal(JSON.stringify(sim.state),before);
});

test('arrival save refusal keeps the exact courier visible at its real destination and explains callback retries without claiming arrival or payment',()=>{
 const sim=specimen(required.slice(0,required.indexOf(D.escort.arrivalStep))),e=courier(sim,'awaiting-save'),destination=D.escort.route.at(-1);e.x=destination.x;e.z=destination.z;e.routeIndex=D.escort.route.length;at(sim,D.escort.arrivalStep);
 const original=H.escortStatus;H.escortStatus=()=>({phase:'awaiting-save',text:'The physical route is finished, but its arrival save was refused. Stay beside Calen and retry when saving is available.'});
 try{
  const before=JSON.stringify({state:sim.state,actor:e}),out=empty(),frame=Art.drawEscort(out,sim,e,999);assert.equal(frame.phase,'awaiting-save');assert.equal(frame.x,destination.x);assert.equal(frame.z,destination.z);assert.ok(all(out).length);
  assert.equal(Art.drawEscort(empty(),sim,{...e},999),false);const points=UI.routePoints(sim),livePoint=points.find(p=>p.id==='escort-position');assert.equal(livePoint.x,destination.x);assert.equal(livePoint.z,destination.z);assert.ok(!points.some(p=>p.id==='escort-staging'));
  const h=harness(sim),html=h.ui.page('heaven-campaign').html;assert.ok(html.includes('data-status="awaiting-save"'));assert.ok(html.includes('arrival save was refused'));assert.ok(html.includes('automatic retries of the actual arrival save'));assert.ok(!html.includes('data-rpg="heaven-campaign-invite"'));assert.ok(!html.includes('data-rpg="heaven-campaign-step" data-id="'+D.escort.arrivalStep+'"'));assert.ok(!html.includes('data-rpg="heaven-campaign-claim"'));assert.ok(!html.includes('Complete · unpaid'));assert.deepEqual(h.commands,[]);assert.equal(JSON.stringify({state:sim.state,actor:e}),before);
  const nodes=new Map(),previous=global.document;global.document={querySelector:selector=>{if(!nodes.has(selector))nodes.set(selector,{});return nodes.get(selector);}};try{h.ui.tick();assert.ok(nodes.get('#tracked-detail').textContent.includes('awaiting-save'));}finally{if(previous===undefined)delete global.document;else global.document=previous;}
  assert.equal(JSON.stringify({state:sim.state,actor:e}),before);assert.ok(!sim.state.heavenCampaign.steps.includes(D.escort.arrivalStep));assert.equal(sim.state.heavenCampaign.claimed,false);
 }finally{H.escortStatus=original;}
 H.runtime(sim).escort={id:D.escort.id,x:D.escort.x,z:D.escort.z,yaw:0,phase:'idle'};assert.equal(Art.drawEscort(empty(),sim,e,0),false);assert.ok(UI.routePoints(sim).some(p=>p.id==='escort-staging'));assert.ok(!UI.routePoints(sim).some(p=>p.id==='escort-position'));assert.ok(!sim.state.heavenCampaign.steps.includes(D.escort.arrivalStep));
});

test('choice preview grants no work and confirmation submits the exact current character and revision',()=>{
 const sim=specimen(required.slice(0,required.indexOf('arrangement'))),h=harness(sim);at(sim,'arrangement');const before=JSON.stringify(sim.state),first=h.ui.page('heaven-campaign').html;
 h.ui.action(button(first,'review','accessible-assist'));assert.deepEqual(h.commands,[]);assert.equal(JSON.stringify(sim.state),before);const preview=h.ui.page('heaven-campaign').html;assert.ok(preview.includes('Confirm welcome arrangement'));h.ui.action(button(preview,'confirm','accessible-assist'));
 assert.equal(h.commands.length,1);assert.deepEqual(h.commands[0],{type:'choose',payload:{quest:D.id,expectedRevision:sim.state.adventure.revision,expectedActive:'synthetic-garden-traveller',choice:'accessible-assist',step:'arrangement'}});assert.equal(JSON.stringify(sim.state),before);
});

test('stale active character, roster, adventure revision, sim, context identity, room and physical preview cannot dispatch a saved choice',()=>{
 const changes=[h=>h.setActive('other'),h=>h.setRoster(9),h=>h.rpg.sim.state.adventure.revision++,h=>h.rpg.sim=specimen(required.slice(0,required.indexOf('arrangement'))),h=>h.setContext(specimen()),h=>h.rpg.sim.room=null,h=>h.rpg.sim.state.player.x+=.1];
 for(const change of changes){const sim=specimen(required.slice(0,required.indexOf('arrangement'))),h=harness(sim);at(sim,'arrangement');h.ui.action(button(h.ui.page('heaven-campaign').html,'review','broadened-activation'));const confirm=button(h.ui.page('heaven-campaign').html,'confirm','broadened-activation');change(h);const before=JSON.stringify(h.rpg.sim.state);h.ui.action(confirm);assert.deepEqual(h.commands,[]);assert.equal(JSON.stringify(h.rpg.sim.state),before);assert.equal(h.ui.pending,null);}
});

test('successful deliberate activation closes the workspace; refusals and stale owners preserve it with no presentation-owned mutation',()=>{
 const sim=specimen(required,'broadened-activation'),h=harness(sim);at(sim,'fit-arrival-assist');const before=JSON.stringify(sim.state),html=h.ui.page('heaven-campaign').html;
 h.ui.action(button(html,'activate'));assert.equal(h.commands[0].type,'activate');assert.equal(h.rpg.closed,0);assert.equal(JSON.stringify(sim.state),before);
 h.setResult({ok:true,text:'synthetic accepted activation'});h.ui.action(button(h.ui.page('heaven-campaign').html,'activate'));assert.equal(h.rpg.closed,1);assert.equal(JSON.stringify(sim.state),before);
 sim.state.heavenCampaign.claimed=true;assert.equal(h.ui.point().id,'instrument');h.ui.action(button(h.ui.page('heaven-campaign').html,'activate'));assert.equal(h.rpg.closed,2);
 const stale=button(h.ui.page('heaven-campaign').html,'activate');h.setActive('different-owner');h.ui.action(stale);assert.equal(h.commands.length,3);assert.equal(h.rpg.closed,2);
});

test('verified choice recognition quotes the actual catalogue callers including the courier, without claiming an unpaid or clipped fee',()=>{
 for(const choice of D.choices){const sim=specimen(required,choice.id),h=harness(sim),before=JSON.stringify(sim.state),html=h.ui.page('heaven-campaign').html;
  assert.ok(html.includes('heaven-campaign-local-recognition'));for(const line of choice.recognition)assert.ok(html.includes('<strong>'+line.name+':</strong>'));assert.ok(html.includes('<strong>Wayfarer:</strong>'));assert.ok(html.includes('Complete · unpaid'));assert.ok(html.includes('Up to 40 XP within the stored cap'));assert.ok(html.includes('16 sunmarks · 3 ore · 4 timber · 3 meadow fibre'));assert.equal(JSON.stringify(sim.state),before);
  sim.state.heavenCampaign.steps=required.filter(id=>id!=='verify-welcome');assert.ok(!h.ui.page('heaven-campaign').html.includes('heaven-campaign-local-recognition'));sim.state.heavenCampaign.steps=required.slice();sim.state.heavenCampaign.claimed=true;assert.ok(h.ui.page('heaven-campaign').html.includes(D.completionText));assert.ok(!h.ui.page('heaven-campaign').html.includes('data-rpg="heaven-campaign-claim"'));
 }
});
