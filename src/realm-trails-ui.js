/* UI submits deliberate choices to realm owners; it cannot grant story facts. */
(function(G){'use strict';
const R=G.RealmTrails,W=G.RealmWorldFoundations,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,id='')=>'<button data-rpg="'+action+'" data-id="'+esc(id)+'">'+esc(label)+'</button>';
const fee=reward=>reward.xp+' XP · '+reward.coins+' sunmarks'+(reward.ore?' · '+reward.ore+' ore':'')+Object.entries(reward.materials||{}).map(([k,n])=>' · '+n+' '+k).join('');
/* These projections read saved facts only. Opening a journal must not create an
 * escort actor, accept a run, reserve a fee or change the selected character. */
function progress(state,d){
 const r=state.realmTrails.records[d.id],required=d.steps.filter(s=>!s.optional),done=required.filter(s=>r.steps.includes(s.id));
 const status=r.claimed?'claimed':!r.accepted?'unaccepted':done.length===required.length?'ready':'active';
 return{status,done:done.length,total:required.length,next:status==='active'?required.filter(s=>!r.steps.includes(s.id)&&s.requires.every(id=>r.steps.includes(id))):[]};
}
function workRows(state){
 const rows=R.definitions().filter(d=>state.realmTrails.records[d.id].accepted).map(d=>({kind:'trail',key:d.id,realm:d.realm,title:d.title,giver:d.giver.name,reward:d.reward,...progress(state,d)}));
 for(const d of W.definitions()){
  const record=state.journeys.realms[d.id],run=record.active;if(!run)continue;
  const next=d.quest.objectives.filter(o=>!run.observed.includes(o.id));
  rows.push({kind:'survey',key:d.id+':'+run.run,realm:d.id,title:d.quest.title,giver:d.points.find(p=>p.id===d.quest.giverId).name,reward:W.rewards(d,record),run:run.run,repeat:run.kind==='survey',status:next.length?'active':'ready',done:run.observed.length,total:d.quest.objectives.length,next:next.map(o=>({name:o.text}))});
 }
 const order={ready:0,active:1,claimed:2};return rows.sort((a,b)=>order[a.status]-order[b.status]);
}
function approach(sim,p){
 for(const[dx,dz]of[[0,1.7],[1.7,0],[-1.7,0],[0,-1.7]]){const q={x:p.x+dx,z:p.z+dz};if(W.walkable(sim.room,q.x,q.z)&&W.segment(sim.room,q,p))return q;}return{x:p.x,z:p.z};
}
class TrailsUI{
 constructor(rpg){this.rpg=rpg;this.pendingFit=null;this.reading=null;rpg.dialog.addEventListener('input',e=>{const input=e.target;if(!input.matches('[data-trail-dial]'))return;const d=this.local(),s=d?.steps.find(s=>s.id===input.dataset.trailDial);if(!s)return;const result=R.adjust(this.rpg.api.worldContext(),d.id,s.id,Number(input.value));if(!result.ok){this.rpg.api.toast(result.error);return;}const root=input.closest('.trail-instrument');root.querySelector('output').textContent=this.dialText(s,result.setting);const arm=root.querySelector('.dial-arm');arm.setAttribute('transform','rotate('+result.setting+' 110 112)');root.classList.toggle('aligned',result.aligned);});}
 get sim(){return this.rpg.sim;}
 local(){const realm=W.definition(this.sim.room)?.id;return R.definitions().find(d=>d.realm===realm)||null;}
 point(){
  const d=this.local();if(!d)return null;const r=this.sim.state.realmTrails.records[d.id];if(d.realm==='cosmos'&&!r.accepted&&!this.rpg.worlds.local())return null;
  const points=[{...d.giver,kind:'giver',medium:'dry'},...(r.accepted?d.steps.filter(s=>s.kind==='interact'&&!r.steps.includes(s.id)):[])];
  const actor=R.escort(this.sim);if(actor&&!r.steps.includes(d.escort?.arrivalStep))points.push({...actor,id:'escort-person',name:'Neris',medium:'dry',kind:'ally'});
  return points.filter(p=>R.at(this.sim,p)).sort((a,b)=>Math.hypot(a.x-this.sim.state.player.x,a.z-this.sim.state.player.z)-Math.hypot(b.x-this.sim.state.player.x,b.z-this.sim.state.player.z))[0]||null;
 }
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){const p=this.point();if(!p)return false;this.reading=p.id;this.rpg.worlds.selected=this.local().realm;this.rpg.worlds.reading=p.kind==='giver'?p.id:null;this.rpg.open('worlds');const frame=this.rpg.dialog.querySelector('[data-trail-dial="'+p.id+'"]')?.closest('.trail-instrument');frame?.scrollIntoView({block:'center'});return true;}
 action(el){
  const action=el.dataset.rpg,id=el.dataset.id;if(!action?.startsWith('trail-'))return false;
  if(action==='trail-fit-preview'){this.pendingFit=id;this.fitContext={sim:this.sim,active:this.rpg.api.worldContext().active,revision:this.sim.state.adventure.revision};this.rpg.paint();return true;}
  if(action==='trail-fit-cancel'){this.pendingFit=null;this.rpg.paint();return true;}
  if(action==='trail-fit-confirm'){if(this.pendingFit!==id||this.fitContext?.sim!==this.sim||this.fitContext?.active!==this.rpg.api.worldContext().active||this.fitContext?.revision!==this.sim.state.adventure.revision){this.pendingFit=null;this.rpg.paint();this.rpg.api.toast('Inspect this weapon and its cost again.');return true;}const result=this.rpg.api.realmFit(id);this.rpg.api.toast(result.text||result.error);if(result.ok)this.pendingFit=null;this.rpg.paint();return true;}
  const d=this.local();if(!d)return true;
  if(action==='trail-walk'){
   const r=this.sim.state.realmTrails.records[d.id],step=id?d.steps.find(s=>s.id===id):null;
   if(id&&(!step||!r.accepted||r.claimed||r.steps.includes(id)||!step.requires.every(v=>r.steps.includes(v)))){this.rpg.api.toast('This trail route has changed. Read its available actions again.');this.rpg.paint();return true;}
   if(this.sim.worldDive){this.rpg.api.toast('Swim to the gallery landing before walking on dry civic ground. F / G changes depth; Return to Firstlight remains free.');return true;}
   const p=step||d.giver;if(p.medium==='water'||p.medium==='court'||p.kind==='escort'){this.rpg.api.toast(p.kind==='escort'?'Stay near Neris on the verified route. The map follows her current safe position.':'Enter the Tide Steps visitor gallery, then swim to the marked depth with F / G. The map shows the route.');return true;}
   this.rpg.close();const q=approach(this.sim,p);this.rpg.api.walkLocal(q.x,q.z);return true;
  }
  let type=action.slice(6),payload={quest:d.id};
  if(type==='step'){const[step,choice]=id.split(':');payload={...payload,step,choice};if(d.steps.find(s=>s.id===step)?.instrument)payload.setting=R.setting(this.sim,d.id,step);}
  if(['accept','step','claim','escort-wait','escort-follow','assist'].includes(type)){const result=this.rpg.api.trailCommand(type,payload);let feedback=result.text||result.error;if(result.ok&&!result.duplicate){if(type==='step')feedback='Recorded · '+d.steps.find(s=>s.id===payload.step).name;else if(type==='accept')feedback=d.title+' accepted · M routes · J work';else if(type==='claim')feedback='Trail complete · +'+result.reward.xp+' XP · +'+result.reward.coins+' sunmarks'+(result.reward.ore?' · +'+result.reward.ore+' ore':'')+Object.entries(result.reward.materials||{}).map(([k,n])=>' · +'+n+' '+k).join('');}this.rpg.api.toast(feedback);this.rpg.paint();}
  return true;
 }
 dialText(s,value){const offset=value-s.instrument.target;return value.toFixed(1)+'° selected · '+(Math.abs(offset)<=s.instrument.tolerance?'split scale aligned':Math.abs(offset).toFixed(1)+'° '+(offset<0?'short of':'beyond')+' the observed image arm')+' · tolerance ±'+s.instrument.tolerance+'°';}
 status(realm){
  const d=R.definitions().find(d=>d.realm===realm),p=d&&progress(this.sim.state,d),record=this.sim.state.journeys.realms[realm];if(!d)return'';
  const label={unaccepted:'Trail not accepted',active:'Accepted trail · '+p.done+'/'+p.total+' required actions',ready:'Trail ready · return to '+d.giver.name+' · unpaid',claimed:'Trail complete · fee claimed once'}[p.status];
  return'<div class="road-work-status" data-road-work="'+esc(realm)+'"><strong>'+esc(label)+'</strong><p>Work giver: '+esc(d.giver.name)+'<br>Declared trail fee: '+esc(fee(d.reward))+'</p>'+(p.next.length?'<p>Next: '+p.next.map(s=>esc(s.name)).join(' · ')+'</p>':'')+(record.active?'<p>'+esc((record.active.kind==='survey'?'Repeat survey':'First local survey')+' · run '+record.active.run+' · '+record.active.observed.length+'/'+W.definition(realm).quest.objectives.length+' observations · separate fee')+'<br>'+esc(record.active.observed.length===W.definition(realm).quest.objectives.length?'Survey ready to return · unpaid':'Survey in progress')+'</p>':record.firstClaimed?'<p>First local survey paid · new repeat work requires acceptance</p>':'')+'</div>';
 }
 journal(){
  const rows=workRows(this.sim.state),live=rows.filter(r=>r.status!=='claimed'),paid=rows.filter(r=>r.status==='claimed'),local=W.definition(this.sim.room)?.id;
  const row=r=>'<article class="accepted-work-row '+r.status+'" data-work="'+esc(r.key)+'" data-work-kind="'+r.kind+'" data-work-status="'+r.status+'"><div class="accepted-work-heading"><small>'+esc(W.definition(r.realm).name)+' · '+(r.kind==='trail'?'ONCE-ONLY TRAIL':(r.repeat?'REPEAT SURVEY':'FIRST LOCAL SURVEY')+' · RUN '+r.run)+'</small><span class="work-state">'+(r.status==='ready'?'Ready to return · unpaid':r.status==='claimed'?'Claimed once':'In progress')+'</span></div><h3>'+esc(r.title)+'</h3><p><strong>Work giver:</strong> '+esc(r.giver)+' · '+r.done+'/'+r.total+(r.kind==='trail'?' required actions':' observations')+'</p>'+(r.status==='active'?'<p><strong>Available next:</strong></p><ul>'+r.next.map(s=>'<li>'+esc(s.name)+(s.kind==='escort'?' · stay near Neris; her arrival counts':s.kind==='defeat'?' · ordinary combat':s.medium==='water'?' · Tide Steps gallery; F / G depth':s.medium==='court'?' · Bellglass air-court doorway':'')+'</li>').join('')+'</ul>':r.status==='ready'?'<p>Return to '+esc(r.giver)+' in '+esc(W.definition(r.realm).name)+' and deliberately claim the completed '+(r.kind==='trail'?'trail':'run')+'.</p>':'<p>The declared trail fee was claimed once. This story has no repeat payout.</p>')+'<p><strong>'+(r.status==='claimed'?'Declared fee, already claimed':'Declared fee')+':</strong> '+esc(fee(r.reward))+'</p><div class="world-actions">'+button(r.kind==='trail'?'Read trail & route':'Read survey run '+r.run,'world-select',r.realm)+(local===r.realm&&this.rpg.worlds.local()?button('Show local map','open','atlas'):'')+'</div></article>';
  let html='<section class="accepted-work-board" aria-label="Accepted work across the five roads"><div class="accepted-work-title"><div><small>YOUR CHARACTER’S SAVED WORK</small><h2>Work across the five roads</h2><p>Resume an accepted trail or survey; each keeps its own progress and fee.</p></div>'+button('Read all five roads','world-list')+'</div>';
  html+=live.length?'<div class="accepted-work-grid">'+live.map(row).join('')+'</div>':'<p class="work-empty">No unfinished realm work is accepted. Read a road, travel deliberately, then speak to its work giver to accept. Your earlier chapters remain below.</p>';
  if(paid.length)html+='<details class="claimed-work"><summary>Completed trails · '+paid.length+' claimed once</summary><div class="accepted-work-grid">'+paid.map(row).join('')+'</div></details>';
  const fitted=this.sim.state.adventure.realmCraft.weapon,unlocked=paid.length>0;
  html+='<div class="workshop-status"><strong>Home workshop:</strong> '+(fitted?'Realm-work fitting applied to '+esc(G.RealmAdventure.GEAR[fitted].name)+'.':unlocked?'One realm-work fitting is unlocked: choose one owned blade or bow at an outdoor Firstlight bench. Cost 3 ore + 8 sunmarks; +3 attack. You have '+this.sim.state.adventure.ore+' ore and '+this.sim.state.adventure.coins+' sunmarks.':'Claim any one trail to unlock one realm-work fitting at home.')+'<div>'+button('Inspect workshop & fitting','open','craft')+'</div></div>';
  if(!this.sim.room)html+=button('Walk to the Roads of Light marker','world-road');
  return html+'<p class="world-note">Reading and routes do not accept, complete, claim or cross. Free return and reload retain accepted work; reopening resumes your home checkpoint. Fees are declared XP before the existing 9999 stored cap. Full pouches or a refused save retain unpaid completion.</p></section>';
 }
 instrument(d,s){const value=R.setting(this.sim,d.id,s.id),target=s.instrument.target,aligned=Math.abs(value-target)<=s.instrument.tolerance;
  return'<section class="trail-instrument '+(aligned?'aligned':'')+'"><h4>Turn the horizontal comparator</h4><p>The fixed frame compares the authored sky image with the observatory crown. This is an angular view from this station; it does not measure astronomical distance or open a sky road.</p><svg viewBox="0 0 220 135" role="img" aria-label="Fixed image arm and adjustable comparator"><path d="M110 22 A90 90 0 0 1 200 112" fill="none" stroke="#697f7b" stroke-width="2"/><line x1="110" y1="112" x2="110" y2="24" stroke="#dcc68d" stroke-width="4" transform="rotate('+target+' 110 112)"/><line class="dial-arm" x1="110" y1="112" x2="110" y2="34" stroke="#a4c9c5" stroke-width="5" transform="rotate('+value+' 110 112)"/><circle cx="110" cy="112" r="7" fill="#d4c4a0"/></svg><label>Comparator setting <input type="range" min="'+s.instrument.min+'" max="'+s.instrument.max+'" step="0.1" value="'+value+'" data-trail-dial="'+s.id+'" aria-label="'+esc(s.name)+' angle"></label><output aria-live="polite">'+esc(this.dialText(s,value))+'</output><p>Turning is a preview. Record only when the split scale aligns; an unrecorded setting is lost on reload.</p></section>';
 }
 page(realm){
  const d=R.definitions().find(d=>d.realm===realm);if(!d)return'';const r=this.sim.state.realmTrails.records[d.id],here=W.definition(this.sim.room)?.id===realm;
  const reward=d.reward,materials=Object.entries(reward.materials||{}).map(([k,n])=>n+' '+k).join(' · ');
  let html='<section class="world-work realm-trail" data-trail="'+d.id+'"><small>'+(r.claimed?'TRAIL COMPLETE · ONCE-ONLY CLAIM':r.accepted?'ACCEPTED REALM TRAIL':'A DEEPER OPTIONAL TRAIL')+'</small><h3>'+esc(d.title)+'</h3><p>'+esc(d.summary)+'</p><p><strong>Danger and route:</strong> '+esc(d.danger)+'</p><p><strong>Exact reward:</strong> '+reward.xp+' XP (credited up to the existing 9999 stored cap) · '+reward.coins+' sunmarks'+(reward.ore?' · '+reward.ore+' ore':'')+(materials?' · '+materials:'')+'. Any one claimed trail unlocks the one-time workshop fitting; subsequent trails pay only these stated rewards.</p>';
  if(!r.accepted){html+='<ol class="trail-brief">'+d.steps.map(step=>'<li>'+esc(step.name)+(step.optional?' · optional':'')+'</li>').join('')+'</ol><p>Available after the initial kit. No earlier survey, campaign chapter, class or allegiance is required.</p>'+(here&&R.at(this.sim,{...d.giver,medium:'dry'})?button('Accept '+d.title,'trail-accept'):here?button('Walk to '+d.giver.name,'trail-walk'):'');}
  else{
   html+='<ol>'+d.steps.map(s=>{
    const done=r.steps.includes(s.id),ready=s.requires.every(id=>r.steps.includes(id));let controls='';
    if(!done&&here&&s.kind==='interact'&&ready&&R.at(this.sim,s))controls=s.instrument?this.instrument(d,s)+button('Record the aligned comparator','trail-step',s.id):s.choices?s.choices.map(c=>button(c.label,'trail-step',s.id+':'+c.id)).join(''):button(s.name,'trail-step',s.id);
    else if(!done&&ready&&here&&!this.sim.worldDive&&s.medium==='dry'&&s.kind!=='escort')controls=button('Walk to '+s.name,'trail-walk',s.id);
    return'<li class="'+(done?'done':'')+'"><details'+(this.reading===s.id?' open':'')+'><summary>'+esc(s.name)+(s.optional?' · optional':'')+(done?' · complete':'')+'</summary><p>'+esc(done?s.text:!ready?'First: '+s.requires.map(id=>d.steps.find(s=>s.id===id).name).join(' · '):s.kind==='defeat'?'Select the mechanism with Tab or click. Read its pulse, brace or step clear, then attack the recovery opening.':s.kind==='escort'?'Stay within ten paces of Neris on the safe route. Her arrival counts; your arrival alone does not.':s.medium==='water'?'Swim to the visible marker at '+(W.definition(realm).dive.surfaceY-s.y).toFixed(2)+' m foot depth. F ascends, G descends; compare the depth display.':s.medium==='court'?'Enter the Bellglass air court through the actual doorway. Compare your measured readings before choosing the chart.':s.text)+'</p></details>'+controls+'</li>';
   }).join('')+'</ol>';
   if(d.escort&&r.steps.includes(d.escort.startStep)&&!r.steps.includes(d.escort.arrivalStep)){
    const actor=R.escort(this.sim),status=r.escortMode==='wait'?'Waiting · speak to resume':actor&&Math.hypot(actor.x-this.sim.state.player.x,actor.z-this.sim.state.player.z)>d.escort.waitDistance?'Waiting for you · return to Neris':actor?.status?.startsWith('Route blocked')?actor.status:'Following the stabilized route';html+='<p><strong>Neris:</strong> '+esc(status)+' · safe checkpoint '+(r.checkpoint+1)+'/'+d.escort.route.length+'. She has no separate combat health in this bounded rescue; the route must already be stabilized.</p>';
    if(actor&&R.at(this.sim,{...actor,medium:'dry'},3))html+=button(r.escortMode==='wait'?'Resume the escort':'Ask Neris to wait',r.escortMode==='wait'?'trail-escort-follow':'trail-escort-wait')+button('Request assisted extraction over the safe route','trail-assist')+'<p>Assisted extraction is an explicit alternative. It records an assisted return and places Neris at the refuge; it does not claim a walked escort.</p>';
   }
   const complete=R.required(d).every(id=>r.steps.includes(id));
   html+=r.claimed?'<p>'+esc(d.completionText)+'</p>':complete?'<p class="trail-ready"><strong>Ready to return · unpaid.</strong> All required trail actions are recorded. Return to '+esc(d.giver.name)+' for the one declared fee.</p>'+(here&&R.at(this.sim,{...d.giver,medium:'dry'})?button('Return the completed trail · claim once','trail-claim'):here&&!this.sim.worldDive?button('Return to '+d.giver.name,'trail-walk'):''):'<p>'+progress(this.sim.state,d).done+'/'+R.required(d).length+' required actions recorded. Finish the available preparations before returning for payment.</p>';
  }
  return html+'<p class="world-note">Accepted facts survive reload. Reopening starts at your home checkpoint; revisit this realm to resume. Full reward pouches or a refused save retain unpaid completion. Ordinary repeat surveys remain separate.</p></section>';
 }
 fitting(){
  const a=this.sim.state.adventure,A=G.RealmAdventure,RC=G.RealmCraft,unlocked=R.definitions().some(d=>this.sim.state.realmTrails.records[d.id].claimed);
  let html='<section class="world-work realm-fitting"><small>ONE FINITE WORKSHOP LESSON PER CHARACTER</small><h3>A realm-work fitting</h3><p>Complete any realm trail, then deliberately fit one owned blade or bow at an outdoor Firstlight workbench. Cost: 3 ore and 8 sunmarks. Result: +3 attack. Range, cooldown, stamina, guard and health stay the same; your weapon identity, socket and earlier fittings remain.</p>';
  if(a.realmCraft.weapon)return html+'<p>Applied to <strong>'+esc(A.GEAR[a.realmCraft.weapon].name)+'</strong>. Equip it deliberately from Character if it is not already equipped.</p></section>';
  if(!unlocked)return html+'<p>Unlock by completing and claiming one of the realm trails. Stored campaign XP and level cap remain unchanged.</p></section>';
  if(this.pendingFit&&a.owned.includes(this.pendingFit)){
   const id=this.pendingFit,copy=JSON.parse(JSON.stringify(a));copy.equipment.weapon=id;const before=A.stats(copy);copy.realmCraft.weapon=id;const after=A.stats(copy),weapon=G.RealmArsenal.weapon(copy);
   html+='<p><strong>'+esc(A.GEAR[id].name)+':</strong> '+before.attack+' → '+after.attack+' attack when equipped. '+weapon.reach+' reach · '+weapon.cooldown+' s cooldown · '+weapon.stamina+' stamina. The violet-brass band is visible on the held or carried weapon.</p>'+button('Spend 3 ore + 8 sunmarks · fit this weapon once','trail-fit-confirm',id)+button('Choose another weapon','trail-fit-cancel');
  }else html+=a.owned.filter(id=>A.GEAR[id].slot==='weapon').map(id=>button('Inspect '+A.GEAR[id].name,'trail-fit-preview',id)).join('');
  return html+'</section>';
 }
 tick(){
  const d=this.local();if(!d||this.rpg.trackerAllows?.('realm-trail')===false)return;const r=this.sim.state.realmTrails.records[d.id];if(!r.accepted||r.claimed)return;
  const next=d.steps.find(s=>!s.optional&&!r.steps.includes(s.id)),q=s=>document.querySelector(s);
  q('#tracked-chapter').textContent='ACCEPTED REALM TRAIL';q('#tracked-title').textContent=d.title;q('#tracked-detail').textContent=next?.name||'Return to '+d.giver.name;q('#tracked-progress').textContent=r.steps.filter(id=>!d.steps.find(s=>s.id===id).optional).length+'/'+R.required(d).length+' · J work · M routes · free return';
 }
}
G.RealmTrailsUI={TrailsUI,approach,progress,workRows};if(typeof module!=='undefined')module.exports=G.RealmTrailsUI;
})(globalThis);
