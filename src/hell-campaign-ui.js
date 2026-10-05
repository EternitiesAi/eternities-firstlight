/* Hell's local campaign: reading and route previews own no saved progress. */
(function(G){'use strict';
const H=()=>G.RealmHellCampaign,def=()=>typeof H().definition==='function'?H().definition():H().definition;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,id='',extra='')=>'<button data-rpg="hell-campaign-'+type+'" data-id="'+esc(id)+'" '+extra+'>'+esc(label)+'</button>';
const record=sim=>sim.state.hellCampaign;
function fee(d=def()){return d.reward.xp+' XP · '+d.reward.coins+' sunmarks · '+d.reward.ore+' ore'+Object.entries(d.reward.materials||{}).map(([k,n])=>' · '+n+' '+({wood:'timber',fiber:'meadow fibre'}[k]||k)).join('');}
function routePoints(sim){const d=def(),r=record(sim);if(sim.room!==d.room||!r?.accepted||r.claimed)return[];
 const points=H().ready(sim.state)?[{...d.giver,id:'claim',kind:'giver',medium:'dry',name:'Return to '+d.giver.name}]:H().available(sim.state);
 return points.map((p,i)=>({...p,hellCampaign:true,mark:'W'+(i+1)}));
}
function legend(sim){const points=routePoints(sim);return points.length?'<section class="hell-campaign-map"><h3>The last unclaimed road</h3><p>W labels show this accepted campaign. Tithe Mile and Moth Cut remain open; the inner works stay closed. Walking records no work.</p><ol>'+points.map(p=>'<li><strong>'+p.mark+'</strong> · '+esc(p.name)+(p.optional?' · optional preparation':'')+' '+button('Walk near this action','walk',p.id)+'</li>').join('')+'</ol>'+button('Read the campaign and saved disposition','open')+'</section>':'';}
function recognition(r){if(!r?.steps.includes('verify-route')||!r.choice)return'';
 const lines={unbind:[['Istra','Keep that handle open. This local release needs no named patron docket.'],['Tovan','The compulsory fitting is off. My old work still belongs in the record.'],['Neris','An open release, and the measurements kept whole. Keep my earlier signature with them.']],divert:[['Istra','The hooded marker shelters our limited service passage. The outer writ still stands.'],['Tovan','A working concession is useful. Do not call the claim we left intact a repair.'],['Neris','I am safe. My complete record stays beside this limited arrangement.']],license:[['Istra','The paired seals name the crew covered by this concession. I will record what it leaves in place.'],['Tovan','Another office holds the docket. The licensing machinery and our responsibility remain.'],['Neris','The named crew has its concession. Keep the truthful measurements; do not turn them into absolution.']]};
 return'<section class="hell-campaign-local-recognition"><h3>The verified disposition is remembered</h3>'+lines[r.choice].map(([name,line])=>'<p><strong>'+name+':</strong> “'+esc(line)+'”</p>').join('')+'</section>';
}
class HellCampaignUI{
 constructor(rpg){this.rpg=rpg;this.pending=null;this.binding=null;this.serial=0;this.seen=new WeakSet();}
 get sim(){return this.rpg.sim;}
 reset(){this.pending=null;this.binding=null;}
 owner(){const c=this.rpg.api.worldContext();return{sim:this.sim,active:c.active,revision:c.revision,adventureRevision:this.sim.state.adventure.revision,room:this.sim.room,position:{x:this.sim.state.player.x,z:this.sim.state.player.z}};}
 same(bound,position=false){if(!bound)return false;const c=this.owner();return bound.sim===c.sim&&bound.active===c.active&&bound.revision===c.revision&&bound.adventureRevision===c.adventureRevision&&bound.room===c.room&&(!position||Math.hypot(bound.position.x-c.position.x,bound.position.z-c.position.z)<.01);}
 commandBinding(el){return this.binding&&el.dataset.binding===String(this.binding.id)&&Number(el.dataset.revision)===this.binding.adventureRevision&&this.same(this.binding);}
 point(){if(this.rpg.quest!=='hell-campaign'&&this.rpg.tab!=='hell-campaign')return null;const d=def(),r=record(this.sim);if(this.sim.room!==d.room||!r?.accepted)return null;
 const points=r.claimed?[{...d.giver,id:'claim',name:d.giver.name}]:routePoints(this.sim);
 return points.filter(p=>H().at(this.sim,p)).sort((a,b)=>Math.hypot(a.x-this.sim.state.player.x,a.z-this.sim.state.player.z)-Math.hypot(b.x-this.sim.state.player.x,b.z-this.sim.state.player.z))[0]||null;
 }
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){if(!this.point())return false;this.rpg.open('hell-campaign');return true;}
 open(){this.pending=null;this.rpg.open('hell-campaign');}
 action(el){const action=el.dataset.rpg;if(!action?.startsWith('hell-campaign-'))return false;const type=action.slice(14),id=el.dataset.id,d=def(),sim=this.sim;
  if(type==='open'){this.open();return true;}
  if(type==='track'){if(record(sim)?.accepted&&!record(sim).claimed)this.rpg.quest='hell-campaign';this.rpg.paint();return true;}
  if(type==='cancel'){this.pending=null;this.rpg.paint();return true;}
  if(type==='walk'){
   const r=record(sim),p=id==='giver'||id==='claim'?d.giver:!r?.accepted&&id==='witness-record'?d.steps.find(s=>s.id===id):routePoints(sim).find(s=>s.id===id);
   if(!p||sim.room!==d.room||sim.worldDive){this.rpg.api.toast('Return to Kiln Refuge and read the current physical route.');return true;}
   this.pending=null;const q=G.RealmTrailsUI.approach(sim,p);this.rpg.close();this.rpg.api.walkLocal(q.x,q.z);return true;
  }
  if(!['accept','step','claim','review','confirm'].includes(type))return true;
  if(!this.commandBinding(el)){this.pending=null;this.rpg.api.toast('The traveller or saved work changed. Read the current campaign again.');this.rpg.paint();return true;}
  if(type==='review'){
   const step=d.steps.find(s=>s.kind==='choice'),choice=d.choices.find(c=>c.id===id);
   if(!choice||!step||!H().available(sim.state).some(s=>s.id===step.id)||!H().at(sim,step)){this.rpg.api.toast('Reach the stabilized service engine before choosing its disposition.');return true;}
   this.pending={...this.owner(),choice:choice.id,step:step.id};this.rpg.paint();return true;
  }
  const payload={quest:d.id,expectedRevision:this.binding.adventureRevision,expectedActive:this.binding.active};let command=type;
  if(type==='step')payload.step=id;
  if(type==='confirm'){
   if(!this.same(this.pending,true)||id!==this.pending.choice){this.pending=null;this.rpg.api.toast('This disposition preview belongs to an earlier traveller or checkpoint. Read its terms again.');this.rpg.paint();return true;}
   Object.assign(payload,{step:this.pending.step,choice:this.pending.choice});command='choose';
  }
  const result=this.rpg.api.hellCampaignCommand(command,payload);this.pending=null;this.rpg.api.toast(result.text||result.error);
  if(result.ok&&!result.duplicate)this.rpg.quest='hell-campaign';this.rpg.paint();return true;
 }
 journal(){const d=def(),r=record(this.sim),status=r?.claimed?'Claimed once':!r?.accepted?'Not accepted':H().ready(this.sim.state)?'Complete · unpaid':'Accepted · '+r.steps.length+' recorded actions';
  return'<section class="hell-campaign-invitation"><small>HELL · A LOCAL CAMPAIGN CONTINUATION</small><h3>'+esc(d.title)+'</h3><p>'+esc(status)+' · '+esc(fee(d))+'</p><p>The rescued witness, a former riveter and a machine that still claims the road. Neris stays safe in the Refuge while you investigate.</p>'+button('Read the campaign, route and exact payment','open')+(r?.accepted&&!r.claimed?button('Track this campaign','track'):'')+'</section>';
 }
 invitation(){return this.journal();}
 page(tab){if(tab!=='hell-campaign')return null;const d=def(),sim=this.sim,r=record(sim),here=sim.room===d.room,eligible=H().eligible(sim.state),available=H().available(sim.state),ids=new Set(available.map(s=>s.id));
  this.binding={...this.owner(),id:++this.serial};const act=(label,type,id='')=>button(label,type,id,'data-binding="'+this.binding.id+'" data-revision="'+this.binding.adventureRevision+'"');
  let html='<article class="hell-campaign"><header><small>KILN REFUGE → BELL YARD → A ROAD THAT RETURNS</small><h2>'+esc(d.title)+'</h2><p>'+esc(d.summary)+'</p></header><section class="hell-campaign-terms"><h3>What this expedition offers</h3><p><strong>Exact once-only payment:</strong> '+esc(fee(d))+'. The same fee follows each disposition; XP credits up to the existing stored cap.</p><p>'+esc(d.danger)+'</p><p>The inner works stay closed. Istra’s free road home remains open throughout. Supplied service fittings cost no ordinary inventory; this expedition grants no gear, automatic equipment change or new class.</p></section>';
  if(!here)html+='<section><p>Reopening resumes your home checkpoint. The accepted expedition and unpaid work remain saved. Revisit Hell to continue.</p><button data-rpg="world-select" data-id="hell">Read Kiln Refuge travel</button></section>';
  if(!r?.accepted){
   html+='<section><h3>Begin with a witness who is safe</h3><p>'+(!eligible?'First complete and explicitly claim The Open Cage. Neris’s real Refuge arrival remains the earlier rescue’s owner.':'The Open Cage was claimed. This new campaign still requires a separate deliberate acceptance.')+'</p>'+(here&&eligible&&H().at(sim,d.giver)?act('Accept the campaign and declared fee','accept'):here?button('Walk to Istra in the Refuge','walk','giver'):'')+'<ol>'+d.steps.filter(s=>!s.optional).map(s=>'<li>'+esc(s.name)+'</li>').join('')+'</ol></section>';
  }else{
   if(r.claimed)html+='<section class="hell-campaign-recognition"><h3>Istra keeps the road honest</h3><p>'+esc(d.completionText)+'</p><p>The declared payment was claimed once. Saved work and the local service fixture remain.</p></section>';
   html+='<section><h3>Your saved expedition</h3><ol class="hell-campaign-steps">'+d.steps.map(s=>{
    const done=r.steps.includes(s.id),next=ids.has(s.id);let controls='';
    if(!r.claimed&&next){
     if(!here)controls='<p>Revisit Hell to reach this action.</p>';
     else if(!H().at(sim,s))controls=button('Walk near this action','walk',s.id);
     else if(s.kind==='defeat')controls='<p>Close this workspace to resume combat. Tab selects Veyr; use your owned blade or bow, move or Brace through the locked tell, and strike the exposed recovery.</p>';
     else if(s.kind==='choice')controls=d.choices.map(c=>act('Read '+c.name+' terms','review',c.id)).join('');
     else controls=act(s.id==='challenge-veyr'?'Challenge the Tithe-Warden':s.name,'step',s.id);
    }
    return'<li class="'+(done?'hell-campaign-done':next?'hell-campaign-next':'')+'" data-hell-step="'+esc(s.id)+'"><h4>'+esc(s.name)+(s.optional?' · optional':'')+(done?' · recorded':'')+'</h4><p>'+esc(s.text)+'</p><div class="world-actions">'+controls+'</div></li>';
   }).join('')+'</ol></section>';
   if(!r.claimed&&H().ready(sim.state))html+='<section class="hell-campaign-ready"><h3>Complete · unpaid</h3><p>Return to Istra for the whole declared fee. A full pouch or refused save keeps this completed work retryable.</p>'+(here&&H().at(sim,d.giver)?act('Claim the declared payment once','claim'):here?button('Walk back to Istra','walk','claim'):'')+'</section>';
   if(!r.claimed)html+=button('Track this expedition','track');
  }
  html+='<section class="hell-campaign-dispositions"><h3>Three local dispositions</h3><p>Your choice changes this service fixture and its road plate. Patron services, wider restitution and the realm’s claim system remain unresolved.</p><div class="hell-campaign-choice-grid">'+d.choices.map(c=>'<article data-hell-choice="'+esc(c.id)+'"'+(r?.choice===c.id?' class="hell-campaign-chosen"':'')+'><h4>'+esc(c.name)+(r?.choice===c.id?' · saved choice':'')+'</h4><p>'+esc(c.text)+'</p><p>'+esc(c.consequence)+'</p></article>').join('')+'</div></section>'+recognition(r);
  if(this.pending){const c=d.choices.find(c=>c.id===this.pending.choice),valid=this.same(this.pending,true);html+='<section class="hell-campaign-confirm" aria-label="Confirm local disposition"><h3>'+esc(c?.name)+' · confirm this local change</h3><p>'+esc(c?.consequence)+'</p><p>This records one permanent disposition for this campaign. Each choice offers the same declared payment when Istra pays the verified route. It does not assign a class or global allegiance.</p>'+(valid?act('Confirm '+c.name+' for this service fixture','confirm',c.id):'<p>The traveller or checkpoint changed. Cancel this preview and read the current terms.</p>')+button('Cancel · keep the disposition undecided','cancel')+'</section>';}
  html+='<p class="hell-campaign-footer">Reading, walking and previews record no work. Both camera styles remain available during play. Accepted actions, the explicit choice and unpaid completion survive reload.</p></article>';
  return{title:d.title,html};
 }
 tick(){const sim=this.sim,r=record(sim),toggle=document.querySelector('.tracker-switch [data-id="hell-campaign"]');if(toggle)toggle.hidden=!r?.accepted||r.claimed;
  if(this.pending&&!this.same(this.pending,true))this.pending=null;
  if(!this.seen.has(sim)){this.seen.add(sim);if(r?.accepted&&!r.claimed&&this.rpg.quest==='story')this.rpg.quest='hell-campaign';}
  if(this.rpg.quest!=='hell-campaign')return;if(!r?.accepted||r.claimed){this.rpg.quest='story';return;}
  const d=def(),ready=H().ready(sim.state),next=H().available(sim.state)[0],text={'#tracked-chapter':'HELL · THE LAST UNCLAIMED ROAD','#tracked-title':d.title,'#tracked-detail':sim.room===d.room?(ready?'Return to Istra · complete, unpaid':next?.name||'Read the current campaign'):'Revisit Kiln Refuge · saved work retained','#tracked-progress':r.steps.length+' actions · '+(ready?'payment unclaimed':'J expedition · M routes')};
  for(const[selector,value]of Object.entries(text)){const e=document.querySelector(selector);if(e)e.textContent=value;}
 }
}
const api={HellCampaignUI,routePoints,legend,fee};G.RealmHellCampaignUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
