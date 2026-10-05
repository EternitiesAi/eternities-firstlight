/* Catalogue-backed CPU presentation checks. The Atlantis rule owner is not
 * integrated here. The read-only facade and refusing command sink below do
 * not prove earned play, currents, contact, persistence, pixels or performance. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/adventure.js'),W=require('../src/world-foundations.js'),E=require('../src/engine.js');
const Trails=require('../src/realm-trails.js');require('../src/realm-trails-ui.js');
const Data=require('../src/atlantis-campaign-data.js'),D=Data.definition,live=new WeakMap();
const recorded=(state,id)=>state.atlantisCampaign.steps.includes(id);
// Explicit synthetic read-only interface facade: availability projects the
// frozen catalogue; reach uses the existing production medium/body query.
const H=global.RealmAtlantisCampaign={definition:D,
 eligible:state=>!!state.realmTrails.records[D.prerequisite]?.claimed,
 available:state=>{const r=state.atlantisCampaign;if(!r?.accepted||r.claimed)return[];return D.steps.filter(s=>!r.steps.includes(s.id)&&s.requires.every(id=>r.steps.includes(id))&&(s.id!=='diagnose-flow'||recorded(state,D.approaches.find(a=>a.id===r.approach)?.requiredObservation)));},
 ready:state=>{const r=state.atlantisCampaign;return !!r?.accepted&&!!r.choice&&D.steps.filter(s=>!s.optional).every(s=>r.steps.includes(s.id))&&recorded(state,D.approaches.find(a=>a.id===r.approach)?.requiredObservation);},
 at:Trails.at,runtime:sim=>live.get(sim),currentStatus:sim=>live.get(sim).current
};
const Art=require('../src/atlantis-campaign-art.js'),UI=require('../src/atlantis-campaign-ui.js');
const empty=()=>({box:[],octa:[],disc:[],round:[]}),all=o=>Object.values(o).flat(),required=D.steps.filter(s=>!s.optional).map(s=>s.id);
const by=id=>D.steps.find(s=>s.id===id),epsilon=1e-5;
function vertices(p,kind){const g=E.geometry(kind),m=p.m||E.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),out=[];for(let i=0;i<g.length;i+=6)out.push(E.M.transform(m,Array.from(g.slice(i,i+3))));return out;}
const projected=o=>Object.entries(o).flatMap(([kind,ps])=>ps.flatMap(p=>vertices(p,kind).map(v=>({p,v}))));
const triangles=o=>Object.entries(o).reduce((n,[k,ps])=>n+ps.length*E.geometry(k).length/18,0);
function specimen(steps=[],choice=null,approach='upper'){const sim=new C.Simulation();sim.room=D.room;sim.state.adventure.started=true;
 sim.state.atlantisCampaign={version:1,accepted:true,steps:steps.slice(),approach,choice,claimed:false};live.set(sim,{witnesses:[],current:{active:false,text:'Synthetic read-only current status: quiet.'}});A.runtime(sim);return sim;}
function actor(sim){sim.state.atlantisCampaign.steps=[...new Set([...sim.state.atlantisCampaign.steps,...D.enemy.spawnAfter])];const e={...D.enemy,atlantisCampaign:D.id,maxHP:D.enemy.hp,mode:'idle',timer:0,yaw:0,flash:0};A.runtime(sim).enemies.push(e);return e;}
function witness(sim,index){const w=D.witnesses[index];sim.state.atlantisCampaign.steps=[...new Set([...sim.state.atlantisCampaign.steps,...w.appearsAfter])];const e={...w,atlantisCampaign:D.id,yaw:0};H.runtime(sim).witnesses.push(e);return e;}
function place(sim,p){sim.state.player.x=p.x;sim.state.player.z=p.z;if(['water','court'].includes(p.medium))sim.worldDive={y:p.y,hold:true};else delete sim.worldDive;assert.ok(H.at(sim,p),'production reach at '+(p.id||p.name));}
function harness(sim){let active='synthetic-harbour-traveller',revision=8,contextSim=null,result={ok:false,error:'synthetic refusing command sink'};const commands=[],walks=[],toasts=[];
 const rpg={sim,quest:'atlantis-campaign',tab:'atlantis-campaign',closed:0,paints:0,opened:[],paint(){this.paints++;},open(t){this.opened.push(t);},close(){this.closed++;},api:{
  worldContext:()=>({sim:contextSim||rpg.sim,active,revision}),toast:text=>toasts.push(text),walkLocal:(x,z)=>walks.push({x,z}),worldDiveStatus:()=>W.divingStatus(rpg.sim,[8,-1,-25]),
  atlantisCampaignCommand(type,payload){commands.push({type,payload});return result;}
 }};return{ui:new UI.AtlantisCampaignUI(rpg),rpg,commands,walks,toasts,setActive:v=>active=v,setRoster:v=>revision=v,setContext:v=>contextSim=v,setResult:v=>result=v};
}
function button(html,type,id=''){const m=html.match(new RegExp('<button data-rpg="atlantis-campaign-'+type+'" data-id="'+id+'" ([^>]*)>'));assert.ok(m,'missing visible '+type+' '+id);
 return{dataset:{rpg:'atlantis-campaign-'+type,id,revision:m[1].match(/data-revision="([^"]+)"/)?.[1],binding:m[1].match(/data-binding="([^"]+)"/)?.[1]}};}
const act=(h,type,id)=>h.ui.action(button(h.ui.page('atlantis-campaign').html,type,id));
function withinVolume(v){const d=W.definition(D.room).dive;return Math.abs(v[0]-d.volume.x)<=d.volume.w/2+epsilon&&Math.abs(v[2]-d.volume.z)<=d.volume.d/2+epsilon;}
function solidAt(v,s){return Math.abs(v[0]-s.x)<s.w/2-epsilon&&Math.abs(v[2]-s.z)<s.d/2-epsilon&&v[1]>s.y+epsilon&&v[1]<s.y+s.h-epsilon;}

test('pure art projects only accepted physical-room facts and creates no rule actor or reward',()=>{
 const sim=specimen(),before=JSON.stringify({state:sim.state,live:H.runtime(sim)}),out=empty();Art.draw(out,sim,0);
 assert.ok(all(out).some(p=>p.atlantisCampaignFixture==='registry-record'));assert.ok(!all(out).some(p=>p.atlantisCampaignActor||p.atlantisCampaignWitness));assert.equal(JSON.stringify({state:sim.state,live:H.runtime(sim)}),before);
 for(const change of[()=>sim.state.atlantisCampaign.accepted=false,()=>{sim.state.atlantisCampaign.accepted=true;sim.room=null;}]){change();const absent=empty();Art.draw(absent,sim,0);assert.deepEqual(all(absent),[]);}
});

test('all static transformed vertices use the real dry support or gallery medium, avoid opaque solids and stay finite',t=>{
 for(const choice of D.choices.map(c=>c.id)){
  const sim=specimen(D.steps.map(s=>s.id),choice),out=empty();Art.draw(out,sim,99);
  for(const{p,v}of projected(out)){
   assert.ok(v.every(Number.isFinite));assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.appearanceOnly,true);
   const wet=['water','court'].includes(p.atlantisCampaignMedium)||p.atlantisCampaignFixture==='rated-current-band';
   if(wet){assert.ok(withinVolume(v),'outside supported gallery: '+p.atlantisCampaignPart);assert.ok(!W.definition(D.room).dive.solids.some(s=>solidAt(v,s)),'opaque gallery solid: '+p.atlantisCampaignPart);
    assert.equal(W.medium(sim,v),p.atlantisCampaignMedium==='court'?'air':'water','wrong medium: '+p.atlantisCampaignPart);
    if(Number.isFinite(p.atlantisCampaignFeetY))assert.ok(v[1]>=p.atlantisCampaignFeetY-epsilon,'fixture below actual feet depth');
   }else{assert.ok(W.land(D.room,v[0],v[2],0),'unsupported dry art: '+p.atlantisCampaignPart);assert.ok(v[1]>=W.height(D.room,v[0],v[2])-epsilon,'below dry floor');
    assert.ok(!W.definition(D.room).solids.some(s=>Math.abs(v[0]-s.x)<s.w/2-epsilon&&Math.abs(v[2]-s.z)<s.d/2-epsilon),'opaque dry solid: '+p.atlantisCampaignPart);}
  }
  assert.ok(all(out).length<160,'static instances '+all(out).length);assert.ok(triangles(out)<2800,'static triangles '+triangles(out));t.diagnostic(choice+': '+all(out).length+' static instances, '+triangles(out)+' triangles');
 }
});

test('real full swimmer bodies remain clear beside wet and court fittings at each physical anchor',()=>{
 const sim=specimen(D.steps.map(s=>s.id),'publish'),out=empty();Art.draw(out,sim,0);
 for(const s of D.steps.filter(s=>['water','court'].includes(s.medium))){assert.ok(W.swimClear(W.definition(D.room).dive,s.x,s.y,s.z),'authored swimmer anchor clear: '+s.id);
  const parts=projected(out).filter(({p})=>p.atlantisCampaignFixture===(s.id==='diagnose-flow'?'equalizer-set':s.id));assert.ok(parts.length,'visible depth or control fixture '+s.id);
  for(const{p,v}of parts)if(v[1]>=s.y&&v[1]<=s.y+1.7)assert.ok(Math.hypot(v[0]-s.x,v[2]-s.z)>.31,'art blocks full swimmer body: '+p.atlantisCampaignPart);
 }
});

test('depth markings retain both observations, chosen required reading and only each recorded pressure setting',()=>{
 const sim=specimen(['receipt-conflict','choose-approach'],'publish','lower'),before=JSON.stringify(sim.state),out=empty();Art.draw(out,sim,0);
 assert.ok(all(out).some(p=>p.atlantisCampaignFixture==='upper-reading'));assert.ok(all(out).some(p=>p.atlantisCampaignFixture==='lower-reading'));
 assert.ok(all(out).filter(p=>p.atlantisCampaignSelectedReading).every(p=>p.atlantisCampaignFixture==='lower-reading'));assert.ok(!all(out).some(p=>p.atlantisCampaignFixture==='inlet-set'));
 sim.state.atlantisCampaign.steps.push('diagnose-flow','inlet-set');const stages=empty();Art.draw(stages,sim,0);
 for(const id of Data.pressure.stages){const parts=all(stages).filter(p=>p.atlantisCampaignFixture===id);assert.ok(parts.length);assert.ok(parts.every(p=>p.atlantisCampaignRecorded===(id==='inlet-set')));}
 assert.equal(JSON.stringify({...sim.state,atlantisCampaign:{...sim.state.atlantisCampaign,steps:['receipt-conflict','choose-approach']}}),before);
});

test('current bands stay within their actual complete bounds and direction marks read only the owner status',()=>{
 const sim=specimen(['choose-approach']),quiet=empty();Art.draw(quiet,sim,0);assert.ok(!all(quiet).some(p=>p.atlantisCampaignPart==='owned-current-direction'));
 H.runtime(sim).current={active:true,text:'Synthetic actual-band status'};const before=JSON.stringify({state:sim.state,live:H.runtime(sim)}),out=empty();Art.draw(out,sim,999);
 const c=Data.current,marks=projected(out).filter(({p})=>p.atlantisCampaignFixture==='rated-current-band');assert.ok(marks.length);assert.equal(all(out).filter(p=>p.atlantisCampaignPart==='owned-current-direction').length,3);
 for(const{v}of marks){assert.ok(Math.abs(v[0]-c.x)<=c.w/2+epsilon);assert.ok(Math.abs(v[2]-c.z)<=c.d/2+epsilon);assert.ok(v[1]>=c.minY-epsilon&&v[1]<=c.maxY+epsilon);}
 assert.equal(JSON.stringify({state:sim.state,live:H.runtime(sim)}),before);
 // The art does not derive a current from history when its real owner says off.
 H.runtime(sim).current.active=false;const stopped=empty();Art.draw(stopped,sim,0);assert.deepEqual(stopped,quiet);
 sim.state.atlantisCampaign.steps=[];const absent=empty();Art.draw(absent,sim,0);assert.ok(!all(absent).some(p=>p.atlantisCampaignFixture==='rated-current-band'));
});

test('saved dispositions have distinct municipal fittings while keeping both complete receipts visible',()=>{
 const outputs=[];for(const choice of D.choices.map(c=>c.id)){
  const sim=specimen(required,choice),out=empty();Art.draw(out,sim,0);outputs.push(out);
  assert.equal(all(out).filter(p=>p.atlantisCampaignPart==='complete-account-sheet').length,4);assert.equal(all(out).filter(p=>p.atlantisCampaignPart==='retained-conflicting-receipt').length,8);
  const specific={publish:'paired-checked-outlet',limited:'reviewed-custody-hood',license:'personal-permit-seal'};
  for(const[id,part]of Object.entries(specific))assert.equal(all(out).some(p=>p.atlantisCampaignPart===part),id===choice);
  assert.ok(all(out).filter(p=>p.atlantisCampaignChoice).every(p=>p.atlantisCampaignChoice===choice));
  sim.state.atlantisCampaign.steps=sim.state.atlantisCampaign.steps.filter(id=>id!=='disposition');const unsaved=empty();Art.draw(unsaved,sim,0);assert.ok(!all(unsaved).some(p=>p.atlantisCampaignChoice));
 }assert.notDeepEqual(outputs[0],outputs[1]);assert.notDeepEqual(outputs[1],outputs[2]);
});

test('the squat whole Custodian is grounded inside its real radius at every actor yaw and all live phases',()=>{
 const sim=specimen(),e=actor(sim);e.y=500;for(const yaw of[0,.42,Math.PI/2,Math.PI,-Math.PI/3])for(const mode of['idle','chase','windup','intake','recover']){
  e.yaw=yaw;e.mode=mode;e.strike=null;const before=JSON.stringify({state:sim.state,actor:e}),out=empty(),frame=Art.drawEnemy(out,sim,e,99);
  assert.equal(frame.x,e.x);assert.equal(frame.z,e.z);assert.equal(frame.yaw,yaw);assert.equal(frame.base,W.height(D.room,e.x,e.z));assert.equal(JSON.stringify({state:sim.state,actor:e}),before);
  for(const{p,v}of projected(out)){assert.ok(Math.hypot(v[0]-e.x,v[2]-e.z)<=D.enemy.radius+epsilon,'outside impact radius: '+p.atlantisCampaignPart);assert.ok(v[1]>=frame.base-epsilon);assert.ok(v[1]<=frame.base+1.1);assert.ok(W.land(D.room,v[0],v[2],0));}
  assert.ok(all(out).length<30);assert.ok(all(out).every(p=>p.atlantisCampaignActor===e.id));
 }
});

test('Custodian projection rejects copied, foreign, unstored exhausted, underwater and resolved actors',()=>{
 const sim=specimen(),e=actor(sim);assert.equal(Art.drawEnemy(empty(),sim,{...e},0),false);e.atlantisCampaign=true;assert.equal(Art.drawEnemy(empty(),sim,e,0),false);e.atlantisCampaign=D.id;
 for(const hp of[0,-1,NaN]){e.hp=hp;assert.equal(Art.drawEnemy(empty(),sim,e,0),false);}e.hp=1;assert.ok(Art.drawEnemy(empty(),sim,e,0),'actual save-refusal HP1 remains a live actor');
 sim.worldDive={y:-1};assert.equal(Art.drawEnemy(empty(),sim,e,0),false);delete sim.worldDive;sim.state.atlantisCampaign.accepted=false;assert.equal(Art.drawEnemy(empty(),sim,e,0),false);sim.state.atlantisCampaign.accepted=true;
 sim.state.atlantisCampaign.steps.push('bearing-exposed');assert.equal(Art.drawEnemy(empty(),sim,e,0),false);const out=empty();Art.draw(out,sim,0);assert.ok(all(out).some(p=>p.atlantisCampaignFixture==='settled-custodian'));assert.ok(!all(out).some(p=>p.atlantisCampaignActor));
 for(const{v}of projected(out).filter(({p})=>p.atlantisCampaignFixture==='settled-custodian'))assert.ok(Math.hypot(v[0]-D.enemy.x,v[2]-D.enemy.z)<=D.enemy.radius+epsilon);
 sim.room=null;assert.equal(Art.drawEnemy(empty(),sim,e,0),false);
});

test('paired sweep strokes project the immutable actual sector, including tiny supplied radius frames',()=>{
 const sim=specimen(),e=actor(sim);e.mode='windup';for(const radius of[.005,.02,.04,.08,Data.patterns.sweep.radius])for(const yaw of[0,.41,Math.PI/2,Math.PI,-.9]){
  const s=e.strike=Object.freeze({kind:'sweep',x:8,z:-44,yaw,radius,halfAngle:Data.patterns.sweep.halfAngle}),before=JSON.stringify(e),out=empty();Art.drawEnemy(out,sim,e,0);
  const points=projected(out).filter(({p})=>p.atlantisCampaignTelegraph);assert.ok(points.length);
  for(const{p,v}of points){const dx=v[0]-s.x,dz=v[2]-s.z,side=dx*Math.cos(yaw)-dz*Math.sin(yaw),forward=dx*Math.sin(yaw)+dz*Math.cos(yaw);
   assert.ok(Math.hypot(side,forward)<=radius+epsilon,'sector radius exceeded: '+p.atlantisCampaignPart);assert.ok(Math.abs(Math.atan2(side,forward))<=s.halfAngle+epsilon,'sector angle exceeded: '+p.atlantisCampaignPart);assert.ok(v[1]>Art.FLOOR+.12);assert.ok(W.land(D.room,v[0],v[2],0));}
  assert.ok(all(out).some(p=>p.atlantisCampaignPart==='locked-sweep-arc-border'));assert.ok(all(out).some(p=>p.atlantisCampaignPart==='locked-sweep-arc-inlay'));assert.equal(JSON.stringify(e),before);
 }
});

test('paired intake strokes never exceed actual clipped length or width, even at very short cover clips',()=>{
 const sim=specimen(),e=actor(sim);for(const mode of['windup','intake'])for(const length of[.005,.02,.04,.08,3.5,Data.patterns.intake.length])for(const yaw of[0,.41,Math.PI/2,Math.PI,-.9]){
  e.mode=mode;const s=e.strike=Object.freeze({kind:'intake',x:8,z:-44,yaw,length,halfWidth:Data.patterns.intake.halfWidth}),before=JSON.stringify(e),out=empty();Art.drawEnemy(out,sim,e,0);
  const points=projected(out).filter(({p})=>p.atlantisCampaignTelegraph);assert.ok(points.length);for(const{p,v}of points){const dx=v[0]-s.x,dz=v[2]-s.z,side=dx*Math.cos(yaw)-dz*Math.sin(yaw),forward=dx*Math.sin(yaw)+dz*Math.cos(yaw);
   assert.ok(Math.abs(side)<=s.halfWidth+epsilon);assert.ok(forward>=-epsilon&&forward<=length+epsilon,'clipped lane exceeded '+length+': '+p.atlantisCampaignPart);assert.ok(v[1]>Art.FLOOR+.12);}
  assert.ok(all(out).some(p=>p.atlantisCampaignPart==='locked-intake-edge-border'));assert.ok(all(out).some(p=>p.atlantisCampaignPart==='locked-intake-edge-inlay'));assert.equal(JSON.stringify(e),before);
 }
});

test('warning pose follows the fixed strike rather than actor/player movement; zero or inactive lanes emit nothing',()=>{
 const sim=specimen(),e=actor(sim);e.mode='windup';e.strike=Object.freeze({kind:'intake',x:8,z:-44,yaw:0,length:3.5,halfWidth:1});const out=empty();Art.drawEnemy(out,sim,e,0);const saved=all(out).filter(p=>p.atlantisCampaignTelegraph);
 e.x=9;e.z=-43;e.yaw=1.2;sim.state.player.x=-3;const moved=empty();Art.drawEnemy(moved,sim,e,999);assert.deepEqual(all(moved).filter(p=>p.atlantisCampaignTelegraph),saved);
 for(const mode of['idle','chase','recover']){e.mode=mode;const quiet=empty();assert.ok(Art.drawEnemy(quiet,sim,e,0));assert.ok(!all(quiet).some(p=>p.atlantisCampaignTelegraph));}
 e.mode='windup';for(const kind of['intake','sweep']){e.strike={...e.strike,kind,length:0,radius:0,halfAngle:Math.PI/3};const emptyFrame=empty();assert.ok(Art.drawEnemy(emptyFrame,sim,e,0));assert.ok(all(emptyFrame).length);assert.ok(!all(emptyFrame).some(p=>p.atlantisCampaignTelegraph));}
 e.mode='intake';e.strike={kind:'sweep',x:8,z:-44,yaw:0,radius:3.4,halfAngle:Math.PI/3};const invalidPhase=empty();Art.drawEnemy(invalidPhase,sim,e,0);assert.ok(!all(invalidPhase).some(p=>p.atlantisCampaignTelegraph));
});

test('support-clipped south intake and real opaque-bollard clip use only their supplied frame',()=>{
 // These are explicit projection fixtures, not a claim about future clipping.
 const sim=specimen(),e=actor(sim);e.mode='windup';for(const s of[{kind:'intake',x:8,z:-44,yaw:0,length:3.5,halfWidth:1},{kind:'intake',x:14,z:-44,yaw:Math.PI/2,length:3.4,halfWidth:1}]){
  e.strike=Object.freeze(s);const out=empty();Art.drawEnemy(out,sim,e,0);for(const{v}of projected(out).filter(({p})=>p.atlantisCampaignTelegraph)){
   assert.ok(W.land(D.room,v[0],v[2],0));assert.ok(!W.definition(D.room).solids.some(p=>Math.abs(v[0]-p.x)<p.w/2&&Math.abs(v[2]-p.z)<p.d/2));}
 }
 const bollard=W.definition(D.room).solids.find(s=>s.id==='exit-quay-bollard');assert.equal(W.segment(D.room,{x:14,z:-44},{x:19,z:-44},.04),false);assert.equal(bollard.x,18);
});

test('exact owned Ilyra and Damar actors appear at their accepted facts, are grounded and never clone existing locals',()=>{
 const sim=specimen(),ilyra=witness(sim,0);for(const yaw of[0,.4,Math.PI/2,-1]){ilyra.yaw=yaw;ilyra.y=600;const before=JSON.stringify({state:sim.state,live:H.runtime(sim)}),out=empty(),frame=Art.drawWitness(out,sim,ilyra,0);
  assert.equal(frame.x,ilyra.x);assert.equal(frame.z,ilyra.z);assert.equal(frame.base,Art.FLOOR);for(const{v}of projected(out)){assert.ok(v[1]>=Art.FLOOR-epsilon);assert.ok(Math.hypot(v[0]-ilyra.x,v[2]-ilyra.z)<=.4+epsilon);assert.ok(W.land(D.room,v[0],v[2],0));}assert.equal(JSON.stringify({state:sim.state,live:H.runtime(sim)}),before);
 }
 assert.equal(Art.drawWitness(empty(),sim,{...ilyra},0),false);const damar=witness(sim,1);sim.state.atlantisCampaign.steps=[];assert.equal(Art.drawWitness(empty(),sim,damar,0),false);
 sim.state.atlantisCampaign.steps=['outlet-set'];assert.ok(Art.drawWitness(empty(),sim,damar,0));
 for(const e of[ilyra,damar])for(const yaw of[0,.4,Math.PI/2,-1]){e.yaw=yaw;const shape=empty();Art.drawWitness(shape,sim,e,0);for(const{v}of projected(shape)){
  assert.ok(v.every(Number.isFinite));assert.ok(v[1]>=Art.FLOOR-epsilon);assert.ok(Math.hypot(v[0]-e.x,v[2]-e.z)<=.4+epsilon);assert.ok(W.land(D.room,v[0],v[2],0));
  assert.ok(!W.definition(D.room).solids.some(s=>Math.abs(v[0]-s.x)<s.w/2-epsilon&&Math.abs(v[2]-s.z)<s.d/2-epsilon));
 }}
 damar.atlantisCampaign='foreign-campaign';assert.equal(Art.drawWitness(empty(),sim,damar,0),false);damar.atlantisCampaign=D.id;
 H.runtime(sim).witnesses.push(ilyra,damar);const out=empty();Art.draw(out,sim,0);
 for(const w of D.witnesses)assert.equal(all(out).filter(p=>p.atlantisCampaignWitness===w.id&&p.atlantisCampaignPart==='witness-head').length,1);
 assert.ok(!all(out).some(p=>['sahra','nereme'].includes(p.atlantisCampaignWitness)));assert.equal(Art.drawWitness(empty(),sim,{id:'sahra',x:-5,z:-10},0),false);
 H.runtime(sim).witnesses=[];assert.equal(Art.drawWitness(empty(),sim,ilyra,0),false);sim.state.atlantisCampaign.accepted=false;assert.equal(Art.drawWitness(empty(),sim,damar,0),false);
});

test('pause, reduced motion and arbitrary wall time preserve quiet deterministic fittings and locked frames',()=>{
 const sim=specimen(D.steps.map(s=>s.id),'license'),out=empty();Art.draw(out,sim,0);for(const paused of[false,true])for(const reduced of[false,true]){
  sim.paused=paused;sim.state.settings.reducedMotion=reduced;const later=empty();Art.draw(later,sim,999);assert.deepEqual(later,out);
 }
 const battle=specimen(),e=actor(battle);e.mode='windup';e.strike={kind:'sweep',x:8,z:-44,yaw:.2,radius:3.4,halfAngle:Math.PI/3};const a=empty(),b=empty();Art.drawEnemy(a,battle,e,0);battle.paused=true;battle.state.settings.reducedMotion=true;Art.drawEnemy(b,battle,e,900);assert.deepEqual(a,b);
});

test('combined fixtures, owned witnesses and worst warning stay within the bounded presentation budget',t=>{
 // Conservative union includes settled and live apparatus from separate
 // synthetic worlds; it is not a claim those mutually exclusive phases coexist.
 const sim=specimen(D.steps.map(s=>s.id),'publish'),battle=specimen(),out=empty();witness(sim,0);witness(sim,1);Art.draw(out,sim,0);const e=actor(battle);e.mode='windup';e.strike={kind:'sweep',x:8,z:-44,yaw:0,radius:3.4,halfAngle:Math.PI/3};Art.drawEnemy(out,battle,e,0);
 assert.ok(all(out).length<210,'combined instances '+all(out).length);assert.ok(triangles(out)<4000,'combined triangles '+triangles(out));t.diagnostic(all(out).length+' combined instances, '+triangles(out)+' triangles');
});

test('journal, map, route labels and terms are read-pure and explicit acceptance needs the old claimed chart',()=>{
 const sim=specimen(),h=harness(sim);sim.state.atlantisCampaign.accepted=false;sim.state.atlantisCampaign.approach=null;place(sim,D.giver);const before=JSON.stringify(sim.state),locked=h.ui.page('atlantis-campaign').html;
 assert.match(locked,/explicitly claim The Bellglass Depth Chart first/);assert.ok(!locked.includes('data-rpg="atlantis-campaign-accept"'));h.ui.journal();UI.legend(sim);assert.deepEqual(UI.routePoints(sim),[]);assert.equal(JSON.stringify(sim.state),before);assert.deepEqual(h.commands,[]);
 sim.state.realmTrails.records[D.prerequisite].claimed=true;const allowed=h.ui.page('atlantis-campaign').html,b=button(allowed,'accept');const acceptedBefore=JSON.stringify(sim.state);h.ui.action(b);
 assert.deepEqual(h.commands,[{type:'accept',payload:{quest:D.id,expectedRevision:sim.state.adventure.revision,expectedActive:'synthetic-harbour-traveller'}}]);assert.equal(JSON.stringify(sim.state),acceptedBefore,'refusing sink grants nothing');
 const fee=UI.fee();for(const phrase of['48 XP','18 sunmarks','4 ore','4 timber','3 meadow fibre','1 crystal'])assert.ok(fee.includes(phrase));assert.match(allowed,/Only XP clips/);assert.match(allowed,/full material pouch or refused save/);
});

test('wet map labels are depth-reading controls; dry walk uses the existing supported approach without work',()=>{
 const sim=specimen(['receipt-conflict','choose-approach']),h=harness(sim);place(sim,D.giver);const before=JSON.stringify(sim.state),map=UI.legend(sim);
 for(const id of['upper-reading','lower-reading','manual-bypass']){assert.ok(map.includes('data-rpg="atlantis-campaign-depth" data-id="'+id+'"'));assert.ok(!map.includes('data-rpg="atlantis-campaign-walk" data-id="'+id+'"'));h.ui.action(button(map,'depth',id));}
 h.ui.action({dataset:{rpg:'atlantis-campaign-walk',id:'upper-reading'}});assert.deepEqual(h.walks,[]);assert.match(h.toasts.at(-1),/real gallery movement/);
 const first=specimen(),dry=harness(first);place(first,D.giver);dry.ui.action(button(UI.legend(first),'walk','receipt-conflict'));assert.equal(dry.walks.length,1);assert.ok(W.walkable(D.room,dry.walks[0].x,dry.walks[0].z));assert.ok(Trails.at({...first,state:{...first.state,player:dry.walks[0]}},by('receipt-conflict')));
 assert.equal(JSON.stringify(sim.state),before);assert.deepEqual(h.commands,[]);assert.deepEqual(dry.commands,[]);
});

test('gallery controls expose the existing physical dive handler and honest E-at-landing exit, with no new exit action',()=>{
 const sim=specimen(['choose-approach']),h=harness(sim);place(sim,D.giver);let html=h.ui.page('atlantis-campaign').html;assert.ok(!html.includes('data-rpg="world-dive"'));assert.ok(html.includes('data-rpg="atlantis-campaign-entry"'));
 const entry=W.definition(D.room).points.find(p=>p.id==='tide-steps');place(sim,entry);html=h.ui.page('atlantis-campaign').html;assert.ok(html.includes('data-rpg="world-dive"'));assert.ok(html.includes('data-rpg="world-return"'));
 place(sim,by('lower-reading'));html=h.ui.page('atlantis-campaign').html;assert.match(html,/press E to leave onto the dry quay/);assert.match(html,/F ascends, G descends/);assert.ok(!html.includes('data-rpg="world-dry"'));assert.ok(!html.includes('data-rpg="world-dive"'));assert.deepEqual(h.commands,[]);
});

test('production medium and feet depth reject overhead or wrong-depth actions; real wet and court anchors expose controls',()=>{
 const sim=specimen(['receipt-conflict','choose-approach']),h=harness(sim),s=by('upper-reading');sim.state.player.x=s.x;sim.state.player.z=s.z;delete sim.worldDive;
 let html=h.ui.page('atlantis-campaign').html;assert.ok(!html.includes('data-rpg="atlantis-campaign-step" data-id="upper-reading"'));assert.equal(H.at(sim,s),false);
 sim.worldDive={y:-2.55,hold:true};assert.equal(H.at(sim,s),false);place(sim,s);act(h,'step',s.id);assert.equal(h.commands.at(-1).type,'step');assert.equal(h.commands.at(-1).payload.step,s.id);
 sim.state.atlantisCampaign.steps.push('upper-reading');place(sim,by('diagnose-flow'));assert.equal(W.medium(sim,[8,-1.85,-35]),'air');act(h,'step','diagnose-flow');assert.equal(h.commands.at(-1).payload.step,'diagnose-flow');
});

test('pressure controls use exact catalogue tokens and sequential availability; no remote or combat-completion dispatch',()=>{
 for(const[id,token]of[['manual-bypass','open-bypass'],...Data.pressure.correct.map(p=>[p.step,p.setting]),['release-west','stabilize-west'],['release-east','stabilize-east']]){
  const index=D.steps.findIndex(s=>s.id===id),sim=specimen(D.steps.slice(0,index).map(s=>s.id)),h=harness(sim);place(sim,by(id));act(h,'pressure',id);
  assert.deepEqual(h.commands.at(-1),{type:'pressure',payload:{quest:D.id,expectedRevision:sim.state.adventure.revision,expectedActive:'synthetic-harbour-traveller',step:id,setting:token}});
 }
 const sim=specimen(['receipt-conflict','choose-approach','upper-reading','diagnose-flow']),h=harness(sim);place(sim,by('inlet-set'));const html=h.ui.page('atlantis-campaign').html;
 assert.ok(!html.includes('data-rpg="atlantis-campaign-pressure" data-id="equalizer-set"'));const b=button(html,'pressure','inlet-set');sim.state.player.z-=8;h.ui.action(b);assert.deepEqual(h.commands,[]);
 const fight=specimen(D.steps.slice(0,D.steps.findIndex(s=>s.id==='bearing-exposed')).map(s=>s.id)),f=harness(fight);place(fight,D.enemy);const fightHTML=f.ui.page('atlantis-campaign').html;assert.match(fightHTML,/A journal button cannot expose the bearing/);assert.ok(!fightHTML.includes('data-rpg="atlantis-campaign-step" data-id="bearing-exposed"'));
});

test('retained approaches use explicit preview, cancel and owner-bound confirmation without read or preview credit',()=>{
 for(const terms of D.approaches){const sim=specimen(['receipt-conflict'],null,null),h=harness(sim);place(sim,by('choose-approach'));const before=JSON.stringify(sim.state);act(h,'review-approach',terms.id);
  assert.deepEqual(h.commands,[]);assert.equal(JSON.stringify(sim.state),before);assert.equal(h.ui.pending.value,terms.id);act(h,'confirm-approach',terms.id);
  assert.deepEqual(h.commands.at(-1),{type:'approach',payload:{quest:D.id,expectedRevision:sim.state.adventure.revision,expectedActive:'synthetic-harbour-traveller',step:'choose-approach',approach:terms.id}});assert.equal(JSON.stringify(sim.state),before);
  act(h,'review-approach',terms.id);h.ui.action({dataset:{rpg:'atlantis-campaign-cancel'}});assert.equal(h.ui.pending,null);assert.equal(h.commands.length,1);
 }
 for(const approach of D.approaches){const sim=specimen(['receipt-conflict','choose-approach'],null,approach.id),h=harness(sim);assert.ok(!H.available(sim.state).some(s=>s.id==='diagnose-flow'));sim.state.atlantisCampaign.steps.push(approach.requiredObservation);assert.ok(H.available(sim.state).some(s=>s.id==='diagnose-flow'));assert.match(h.ui.page('atlantis-campaign').html,/required for your approach/);}
});

test('each disposition confirms once through the current physical owner, quotes recognition only after verification and pays separately',()=>{
 for(const choice of D.choices){const sim=specimen(required.filter(id=>!['disposition','verify-passage'].includes(id)).concat('upper-reading')),h=harness(sim);place(sim,by('disposition'));const before=JSON.stringify(sim.state);act(h,'review',choice.id);
  assert.deepEqual(h.commands,[]);const preview=h.ui.page('atlantis-campaign').html;assert.match(preview,/one lasting local disposition/);assert.ok(!preview.includes('The verified local record'));h.ui.action(button(preview,'confirm',choice.id));
  assert.deepEqual(h.commands.at(-1),{type:'choose',payload:{quest:D.id,expectedRevision:sim.state.adventure.revision,expectedActive:'synthetic-harbour-traveller',step:'disposition',choice:choice.id}});assert.equal(JSON.stringify(sim.state),before);
  sim.state.atlantisCampaign.choice=choice.id;sim.state.atlantisCampaign.steps.push('disposition');assert.ok(!h.ui.page('atlantis-campaign').html.includes('The verified local record'));
  sim.state.atlantisCampaign.steps.push('verify-passage');place(sim,D.giver);const ready=h.ui.page('atlantis-campaign').html;assert.match(ready,/Complete · unpaid/);for(const line of choice.recognition)assert.ok(ready.includes(line.name+':</strong>'));
  act(h,'claim');assert.equal(h.commands.at(-1).type,'claim');assert.equal(h.commands.length,2);sim.state.atlantisCampaign.claimed=true;assert.ok(!h.ui.page('atlantis-campaign').html.includes('data-rpg="atlantis-campaign-claim"'));assert.deepEqual(UI.routePoints(sim),[]);
 }
});

test('every stale traveller, revision, medium, depth, position or page fence refuses mutation and stale confirmation',()=>{
 const changes=[h=>h.setActive('another-traveller'),h=>h.setRoster(9),h=>h.setContext(specimen()),h=>h.rpg.sim.state.adventure.revision++,h=>h.rpg.sim.room=null,h=>h.rpg.sim.state.player.x+=.02,h=>h.rpg.sim.worldDive={y:-1},h=>h.rpg.sim=specimen()];
 for(const change of changes){const sim=specimen(['receipt-conflict'],null,null),h=harness(sim);place(sim,by('choose-approach'));act(h,'review-approach','upper');const confirm=button(h.ui.page('atlantis-campaign').html,'confirm-approach','upper');change(h);h.ui.action(confirm);assert.deepEqual(h.commands,[]);assert.equal(h.ui.pending,null);}
 const sim=specimen(['choose-approach']),h=harness(sim);place(sim,by('upper-reading'));let b=button(h.ui.page('atlantis-campaign').html,'step','upper-reading');sim.worldDive.y-=.02;h.ui.action(b);assert.deepEqual(h.commands,[]);
 place(sim,by('upper-reading'));b=button(h.ui.page('atlantis-campaign').html,'step','upper-reading');sim.worldDive={...sim.worldDive};h.ui.action(b);assert.deepEqual(h.commands,[]);
 b=button(h.ui.page('atlantis-campaign').html,'step','upper-reading');h.ui.page('atlantis-campaign');h.ui.action(b);assert.deepEqual(h.commands,[],'an older rendered page cannot dispatch');
});

test('context, tracker and route reads never record work or courier arrival and retain all old save fields',()=>{
 const sim=specimen(['receipt-conflict','choose-approach']),h=harness(sim);place(sim,by('upper-reading'));const before=JSON.stringify(sim.state),priorDocument=global.document;const nodes=new Map();global.document={querySelector:selector=>{if(!nodes.has(selector))nodes.set(selector,{textContent:'',hidden:false});return nodes.get(selector);}};
 try{assert.match(h.ui.context(),/^E/);assert.equal(h.ui.interact(),true);h.ui.tick();h.ui.journal();h.ui.page('atlantis-campaign');UI.routePoints(sim);UI.legend(sim);assert.equal(JSON.stringify(sim.state),before);assert.deepEqual(h.commands,[]);assert.match(nodes.get('#tracked-detail').textContent,/foot depth/);assert.equal(nodes.get('.tracker-switch [data-id="atlantis-campaign"]').hidden,false);
 }finally{global.document=priorDocument;}
 sim.room=null;assert.equal(h.ui.context(),null);assert.deepEqual(UI.routePoints(sim),[]);assert.match(h.ui.page('atlantis-campaign').html,/home checkpoint/);
});
