/* Project the Harbour rule owner's ledger, real medium/depth and command
 * results. Reading, map labels, walking and previews grant no work. */
(function(G){'use strict';
const H=()=>G.RealmAtlantisCampaign,D=()=>H().definition,PREFIX='atlantis-campaign-';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,id='',attrs='')=>'<button data-rpg="'+PREFIX+type+'" data-id="'+esc(id)+'" '+attrs+'>'+esc(label)+'</button>';
const record=sim=>sim.state.atlantisCampaign,step=id=>D().steps.find(s=>s.id===id);
const previousTitle=()=>G.RealmTrails.definition(D().prerequisite).title;
const tokens={'manual-bypass':'open-bypass','release-west':'stabilize-west','release-east':'stabilize-east'};
function setting(s){return G.RealmAtlantisCampaignData.pressure.correct.find(p=>p.step===s.id)?.setting||tokens[s.id];}
function fee(d=D()){return'Up to '+d.reward.xp+' XP within the stored cap · '+d.reward.coins+' sunmarks · '+d.reward.ore+' ore'+Object.entries(d.reward.materials).map(([k,n])=>' · '+n+' '+({wood:'timber',fiber:'meadow fibre',crystal:'crystal'}[k]||k)).join('');}
function depth(s){const sea=G.RealmWorldFoundations.definition(D().room).dive.surfaceY;return(sea-s.y).toFixed(2)+' m foot depth';}
function routePoints(sim){const r=record(sim),d=D();if(sim.room!==d.room||!r?.accepted||r.claimed)return[];
 const points=H().ready(sim.state)?[{...d.giver,id:'claim',kind:'giver',medium:'dry',name:'Return to '+d.giver.name}]:H().available(sim.state).map(s=>({...s}));
 return points.map((p,i)=>({...p,atlantisCampaign:true,mark:'H'+(i+1)}));
}
function legend(sim){const points=routePoints(sim);return points.length?'<section class="atlantis-campaign-map"><h3>The harbour repair · physical routes</h3><p>H labels show accepted harbour work. Dry labels use the supported quay; wet labels require the existing gallery and their real depth. No label creates floor, current, arrival or work.</p><ol>'+points.map(p=>'<li><strong>'+p.mark+'</strong> · '+esc(p.name)+(p.medium==='dry'?' '+button('Walk near this dry action','walk',p.id):' · '+esc(depth(p))+' '+button('Read depth and gallery route','depth',p.id))+'</li>').join('')+'</ol>'+button('Read the current campaign','open')+'</section>':'';}
function recognition(r){if(!r?.steps.includes('verify-passage')||!r.choice)return'';const c=D().choices.find(c=>c.id===r.choice);return'<section class="atlantis-campaign-recognition"><h3>The verified local record</h3><p>'+esc(c.consequence)+'</p>'+c.recognition.map(l=>'<p><strong>'+esc(l.name)+':</strong> “'+esc(l.text)+'”</p>').join('')+'</section>';}
class AtlantisCampaignUI{
 constructor(rpg){this.rpg=rpg;this.pending=null;this.binding=null;this.serial=0;this.reading=null;this.seen=new WeakSet();}
 get sim(){return this.rpg.sim;}
 reset(){this.pending=null;this.binding=null;this.reading=null;}
 owner(){const sim=this.sim,c=this.rpg.api.worldContext();return{sim,contextSim:c.sim,active:c.active,rosterRevision:c.revision,revision:sim.state.adventure.revision,room:sim.room,dive:sim.worldDive||null,position:{x:sim.state.player.x,z:sim.state.player.z,y:G.RealmWorldFoundations.playerHeight(sim)}};}
 same(b){if(!b)return false;const c=this.owner();return c.contextSim===c.sim&&b.sim===c.sim&&b.contextSim===c.contextSim&&b.active===c.active&&b.rosterRevision===c.rosterRevision&&b.revision===c.revision&&b.room===c.room&&b.dive===c.dive&&Math.hypot(b.position.x-c.position.x,b.position.z-c.position.z)<.01&&Math.abs(b.position.y-c.position.y)<.01;}
 bound(el){return this.binding&&el.dataset.binding===String(this.binding.id)&&Number(el.dataset.revision)===this.binding.revision&&this.same(this.binding);}
 point(){const sim=this.sim,d=D(),r=record(sim);if((this.rpg.quest!=='atlantis-campaign'&&this.rpg.tab!=='atlantis-campaign')||sim.room!==d.room||!r?.accepted)return null;
  return(r.claimed?[]:routePoints(sim)).filter(p=>H().at(sim,p)).sort((a,b)=>Math.hypot(a.x-sim.state.player.x,a.z-sim.state.player.z)-Math.hypot(b.x-sim.state.player.x,b.z-sim.state.player.z))[0]||null;}
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){if(!this.point())return false;this.rpg.open('atlantis-campaign');return true;}
 open(){this.pending=null;this.rpg.open('atlantis-campaign');}
 action(el){const action=el.dataset.rpg;if(!action?.startsWith(PREFIX))return false;const type=action.slice(PREFIX.length),id=el.dataset.id,sim=this.sim,d=D();
  if(type==='open'){this.open();return true;}
  if(type==='cancel'){this.pending=null;this.rpg.paint();return true;}
  if(type==='depth'){this.reading=id;this.pending=null;this.rpg.open('atlantis-campaign');return true;}
  if(type==='track'){if(record(sim)?.accepted&&!record(sim).claimed)this.rpg.quest='atlantis-campaign';this.rpg.paint();return true;}
  if(type==='walk'||type==='entry'){
   const p=type==='entry'?G.RealmWorldFoundations.definition(d.room).points.find(p=>p.id==='tide-steps'):id==='giver'||id==='claim'?d.giver:routePoints(sim).find(p=>p.id===id);
   if(!p||sim.room!==d.room||sim.worldDive||['water','court'].includes(p.medium)){this.rpg.api.toast('Wet work needs real gallery movement and depth. F ascends, G descends; return through the landing before dry walking.');return true;}
   this.pending=null;const q=G.RealmTrailsUI.approach(sim,p);this.rpg.close();this.rpg.api.walkLocal(q.x,q.z);return true;
  }
  if(!['accept','step','pressure','review-approach','confirm-approach','review','confirm','claim'].includes(type))return true;
  if(!this.bound(el)){this.pending=null;this.rpg.api.toast('The traveller, depth or saved checkpoint changed. Read the current physical action again.');this.rpg.paint();return true;}
  if(type==='review'||type==='review-approach'){
   const approach=type==='review-approach',s=step(approach?'choose-approach':'disposition'),terms=(approach?d.approaches:d.choices).find(c=>c.id===id);
   if(!terms||!H().available(sim.state).some(p=>p.id===s.id)||!H().at(sim,s)){this.rpg.api.toast('Reach this available physical action before reviewing its confirmation.');return true;}
   this.pending={...this.owner(),kind:approach?'approach':'choice',value:id,step:s.id};this.rpg.paint();return true;
  }
  const payload={quest:d.id,expectedRevision:this.binding.revision,expectedActive:this.binding.active};let command=type;
  if(type==='step'||type==='pressure'){const s=step(id);if(!s||!H().available(sim.state).some(p=>p.id===id)||!H().at(sim,s)){this.rpg.api.toast('Reach this available action at its actual medium and depth.');return true;}payload.step=id;if(type==='pressure')payload.setting=setting(s);}
  if(type==='confirm'||type==='confirm-approach'){
   const kind=type==='confirm-approach'?'approach':'choice';if(!this.same(this.pending)||this.pending.kind!==kind||this.pending.value!==id||!H().at(sim,step(this.pending.step))){this.pending=null;this.rpg.api.toast('This preview belongs to an earlier traveller, depth or checkpoint. Read the terms again.');this.rpg.paint();return true;}
   payload.step=this.pending.step;payload[kind==='approach'?'approach':'choice']=id;command=kind==='approach'?'approach':'choose';
  }
  const result=this.rpg.api.atlantisCampaignCommand(command,payload);this.pending=null;this.rpg.api.toast(result.text||result.error);if(result.ok&&!result.duplicate)this.rpg.quest='atlantis-campaign';this.rpg.paint();return true;
 }
 journal(){const r=record(this.sim),status=r?.claimed?'Claimed once':!r?.accepted?'Not accepted':H().ready(this.sim.state)?'Complete · unpaid':'Accepted · '+r.steps.length+' recorded actions';return'<section class="atlantis-campaign-invitation"><small>ATLANTIS · A BOUNDED HARBOUR REPAIR</small><h3>'+esc(D().title)+'</h3><p>'+esc(status)+' · '+esc(fee())+'</p><p>Conflicting receipts, actual depth readings, ordered pressure controls and a municipal Custodian. The old Bellglass chart and lamp remain separate.</p>'+button('Read the repair, physical route and fee','open')+(r?.accepted&&!r.claimed?button('Track this repair','track'):'')+'</section>';}
 invitation(){return this.journal();}
 gallery(){const sim=this.sim,d=D(),world=G.RealmWorldFoundations.definition(d.room);if(sim.room!==d.room)return'';
 const entry=world.points.find(p=>p.id===world.dive.entryId),status=this.rpg.api.worldDiveStatus?.();
 return'<section class="atlantis-campaign-gallery"><h3>Depth and protected visitor passage</h3><p>Upper gauge: '+esc(depth(step('upper-reading')))+'. Lower mark: '+esc(depth(step('lower-reading')))+'. Bellglass control desk: '+esc(depth(step('diagnose-flow')))+' in its dry air court.</p><p>WASD swims in the existing gallery. F ascends, G descends; releasing holds depth. Enter the court through its actual doorway. Return along the wet east lane to the gallery landing and press E to leave onto the dry quay. No underwater Walk link or manual arrival can replace this movement.</p>'+(sim.worldDive?'<p><strong>Actual position:</strong> '+(status?.dryCourt?'Bellglass dry air court':status&&Number.isFinite(status.depth)?esc(status.depth.toFixed(2))+' m below surface':'Read the existing depth display')+'. The court has no current or combat.</p>':G.RealmWorldFoundations.near(sim,entry)?'<button data-rpg="world-dive">Enter the existing visitor gallery</button>':button('Walk to the dry Tide Steps entry','entry'))+'<button data-rpg="world-return">Return to Firstlight · free</button></section>';
 }
 page(tab){if(tab!=='atlantis-campaign')return null;const d=D(),sim=this.sim,r=record(sim),here=sim.room===d.room,available=H().available(sim.state),ids=new Set(available.map(s=>s.id));
  this.binding={...this.owner(),id:++this.serial};const act=(label,type,id='')=>button(label,type,id,'data-binding="'+this.binding.id+'" data-revision="'+this.binding.revision+'"');
  let html='<article class="atlantis-campaign"><header><small>FARWAKE → BELLGLASS → THE DRY SERVICE QUAY</small><h2>'+esc(d.title)+'</h2><p>'+esc(d.summary)+'</p></header><section class="atlantis-campaign-terms"><h3>The whole declared fee</h3><p><strong>'+esc(fee(d))+'</strong>. Only XP clips at its stored cap. A full material pouch or refused save keeps all completed work unpaid and retryable.</p><p>'+esc(d.danger)+'</p><p>Safe public air, Damar’s waiting bay and the free home passage precede disposition. No timed appointment, second player, gear grant, automatic equipment change or global pledge is required.</p></section>';
  if(!here)html+='<section><p>Reopening resumes the home checkpoint. Accepted actions, the retained approach, disposition and unpaid completion remain saved. Revisit Farwake for the actual physical route.</p><button data-rpg="world-select" data-id="atlantis">Read Atlantis travel</button></section>';
  if(!r?.accepted)html+='<section><h3>An earlier chart remains true</h3><p>'+(!H().eligible(sim.state)?'Complete and explicitly claim '+esc(previousTitle())+' first. Its chart, lamp and payment remain separate.':'The Bellglass chart was claimed. Accept this new repair deliberately; reading grants no consent.')+'</p>'+(here&&H().eligible(sim.state)&&H().at(sim,d.giver)?act('Accept the separate harbour repair','accept'):here?button('Walk to Sahra','walk','giver'):'')+'</section>';
  else{
   if(r.claimed)html+='<section><h3>The paid local passage remains</h3><p>'+esc(d.completionText)+'</p></section>';
   const approach=d.approaches.find(a=>a.id===r.approach),current=H().currentStatus(sim);
   html+='<section class="atlantis-campaign-pressure"><h3>Approach and ordered pressure</h3><p>'+(approach?'Retained '+esc(approach.name)+'. Required evidence: '+esc(step(approach.requiredObservation).name)+'. The other reading remains optional.':'First retain Upper or Lower deliberately at Sahra’s anchor. That approach names the reading needed for diagnosis.')+'</p><p>'+esc(current.text)+'</p><ol><li>Inlet · isolate-redirect, preserving public supply.</li><li>Equalizer · match-depth-bands at the dry desk.</li><li>Outlet · chosen-destination at the wet east control.</li></ol><p>The supplied manual bypass stops this current and replaces none of these stages. Wrong or premature settings spend no materials. West and east releases happen sequentially after actual combat exhaustion.</p></section>';
   html+='<section><h3>Your physical repair</h3><ol class="atlantis-campaign-steps">'+d.steps.map(s=>{
    const done=r.steps.includes(s.id),next=ids.has(s.id),requiredReading=approach?.requiredObservation===s.id;let controls='';
    if(!r.claimed&&next){if(!here)controls='<p>Revisit Farwake to reach this action.</p>';
     else if(!H().at(sim,s))controls=s.medium==='dry'?button('Walk near this dry action','walk',s.id):'<p>'+esc(depth(s))+' · '+(s.medium==='court'?'enter the real Bellglass air-court doorway.':'hold this actual water depth.')+'</p>'+button('Read depth and gallery route','depth',s.id);
     else if(s.kind==='defeat')controls='<p>Close the workspace to resume the dry-quay fight. Select the actual Custodian with Tab; use your owned blade or bow, Brace, supported movement or actual cover. A journal button cannot expose the bearing.</p>';
     else if(s.kind==='approach')controls=d.approaches.map(a=>act('Read '+a.name+' terms','review-approach',a.id)).join('');
     else if(s.kind==='choice')controls=d.choices.map(c=>act('Read '+c.name+' terms','review',c.id)).join('');
     else if(s.kind==='pressure')controls=act('Set '+setting(s)+' · '+s.name,'pressure',s.id);
     else controls=act(s.name,'step',s.id);
    }
    return'<li class="'+(done?'atlantis-campaign-done':next?'atlantis-campaign-next':'')+'" data-atlantis-step="'+esc(s.id)+'"><h4>'+esc(s.name)+(done?' · recorded':'')+(requiredReading?' · required for your approach':s.optional?' · optional':'')+'</h4><details'+(this.reading===s.id?' open':'')+'><summary>Read this action and its physical route</summary><p>'+esc(s.text)+'</p></details><div class="world-actions">'+controls+'</div></li>';
   }).join('')+'</ol></section>';
   if(!r.claimed&&H().ready(sim.state))html+='<section class="atlantis-campaign-ready"><h3>Complete · unpaid</h3><p>Return to Sahra and explicitly claim the whole fixed fee. Verification and the local handoff do not pay by themselves.</p>'+(here&&H().at(sim,d.giver)?act('Claim the whole declared fee once','claim'):here?button('Walk back to Sahra','walk','claim'):'')+'</section>';
   if(!r.claimed)html+=button('Track this repair','track');
  }
  html+=this.gallery()+'<section><h3>Two investigation approaches</h3><div class="atlantis-campaign-grid">'+d.approaches.map(a=>'<article><h4>'+esc(a.name)+(r?.approach===a.id?' · retained':'')+'</h4><p>'+esc(a.text)+'</p></article>').join('')+'</div></section><section><h3>Three local dispositions</h3><p>All preserve Damar’s safety, full account, public protection and the same fee. The wider plot, distant nursery voyage, Tideglass Fitting and patron services remain pending.</p><div class="atlantis-campaign-grid">'+d.choices.map(c=>'<article'+(r?.choice===c.id?' class="atlantis-campaign-chosen"':'')+'><h4>'+esc(c.name)+'</h4><p>'+esc(c.text)+'</p><p>'+esc(c.consequence)+'</p></article>').join('')+'</div></section>'+recognition(r);
  if(this.pending){const approach=this.pending.kind==='approach',terms=(approach?d.approaches:d.choices).find(t=>t.id===this.pending.value);html+='<section class="atlantis-campaign-confirm"><h3>'+esc(terms.name)+' · confirm this retained record</h3><p>'+esc(terms.text)+'</p>'+(approach?'<p>This approach permanently names the reading needed for diagnosis. The other reading remains optional; neither reading pays another fee.</p>':'<p>'+esc(terms.consequence)+'</p><p>This records one lasting local disposition. It does not change class, soul, global allegiance or the fixed fee.</p>')+(this.same(this.pending)?act('Confirm '+terms.name,approach?'confirm-approach':'confirm',terms.id):'<p>The traveller or physical checkpoint changed. Cancel and read the current terms.</p>')+button('Cancel · keep this record undecided','cancel')+'</section>';}
  return{title:d.title,html:html+'<p class="atlantis-campaign-footer">Reading, walking and previews grant no work. Physical depth owns wet actions; actual damage owns bearing exhaustion. Your earlier chart, lamp and equipment remain yours.</p></article>'};
 }
 tick(){const sim=this.sim,r=record(sim),toggle=document.querySelector('.tracker-switch [data-id="atlantis-campaign"]');if(toggle)toggle.hidden=!r?.accepted||r.claimed;
  if(this.pending&&!this.same(this.pending))this.pending=null;if(!this.seen.has(sim)){this.seen.add(sim);if(r?.accepted&&!r.claimed&&this.rpg.quest==='story')this.rpg.quest='atlantis-campaign';}
  if(this.rpg.quest!=='atlantis-campaign')return;if(!r?.accepted||r.claimed){this.rpg.quest='story';return;}
  const available=H().available(sim.state),requiredReading=D().approaches.find(a=>a.id===r.approach)?.requiredObservation,next=available.find(s=>!s.optional||s.id===requiredReading)||available[0],ready=H().ready(sim.state),detail=sim.room!==D().room?'Revisit Farwake · retained work stays saved':ready?'Return to Sahra · complete, unpaid':next?.medium==='water'||next?.medium==='court'?next.name+' · '+depth(next):next?.name||'Read the current repair';
  for(const[selector,text]of Object.entries({'#tracked-chapter':'ATLANTIS · THE HARBOUR BENEATH THE HARBOUR','#tracked-title':D().title,'#tracked-detail':detail,'#tracked-progress':r.steps.length+' recorded actions · '+(ready?'fee unclaimed':'J campaign · M physical routes')})){const el=document.querySelector(selector);if(el)el.textContent=text;}
 }
}
const api={AtlantisCampaignUI,routePoints,legend,fee,depth};G.RealmAtlantisCampaignUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
