/* The lower Garden campaign projects its rule owner's facts and live escort.
 * Reading, walking, previews and the instrument demonstration grant no work. */
(function(G){'use strict';
const PREFIX='heaven-campaign-',H=()=>G.RealmHeavenCampaign;
const def=()=>typeof H()?.definition==='function'?H().definition():H()?.definition||G.RealmHeavenCampaignData.definition;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,id='',attrs='')=>'<button data-rpg="'+PREFIX+type+'" data-id="'+esc(id)+'" '+attrs+'>'+esc(label)+'</button>';
const record=sim=>sim.state.heavenCampaign,step=id=>def().steps.find(s=>s.id===id);
function fee(d=def()){return'Up to '+d.reward.xp+' XP within the stored cap · '+d.reward.coins+' sunmarks · '+d.reward.ore+' ore'+Object.entries(d.reward.materials).map(([k,n])=>' · '+n+' '+({wood:'timber',fiber:'meadow fibre'}[k]||k)).join('');}
function escortStatus(sim){const raw=H().escortStatus(sim),status=typeof raw==='string'?raw:raw?.status||raw?.phase||'inactive';return{status,help:typeof raw==='object'?raw.help||raw.text||'':''};}
function escortPending(sim){const r=record(sim);return r?.accepted&&r.steps.includes('secure-service-route')&&!r.steps.includes(def().escort.arrivalStep);}
function staging(){const d=def();return{...step(d.escort.startStep),id:'escort-staging',name:'Invite or restart '+d.escort.name};}
function routePoints(sim){const d=def(),r=record(sim);if(sim.room!==d.room||!r?.accepted||r.claimed)return[];
 let points=H().ready(sim.state)?[{...d.giver,id:'claim',kind:'giver',medium:'dry',name:'Return to '+d.giver.name}]:H().available(sim.state).map(p=>({...p}));
 if(escortPending(sim)){
  const status=escortStatus(sim),actor=H().runtime(sim).escort;
  if(['following','lagging','awaiting-save'].includes(status.status)&&actor?.id===d.escort.id&&[actor.x,actor.z].every(Number.isFinite))points.push({id:'escort-position',name:d.escort.name+' · actual position',x:actor.x,z:actor.z,kind:'escort-live',medium:'dry',informative:true});
  else if(!points.some(p=>p.id===d.escort.startStep))points.push({...staging(),kind:'escort-start',medium:'dry'});
 }
 return points.map((p,i)=>({...p,heavenCampaign:true,mark:'G'+(i+1)}));
}
function legend(sim){const points=routePoints(sim);return points.length?'<section class="heaven-campaign-map"><h3>The gate that remained open</h3><p>G labels show this accepted Garden campaign. The supported service loop and road home remain open; the upper terrace remains closed. Walking to a label records no work or courier arrival.</p><ol>'+points.map(p=>'<li><strong>'+p.mark+'</strong> · '+esc(p.name)+(p.optional?' · optional supplied preparation':'')+(p.informative?' · live location':'')+' '+button('Walk near this point','walk',p.id)+'</li>').join('')+'</ol>'+button('Read the campaign and current escort','open')+'</section>':'';}
function recognition(r){const d=def();if(!r?.steps.includes('verify-welcome')||!r.choice)return'';const c=d.choices.find(c=>c.id===r.choice);return'<section class="heaven-campaign-local-recognition"><h3>The verified welcome is remembered</h3><p>'+esc(c.consequence)+'</p>'+(c.recognition||[]).map(line=>'<p><strong>'+esc(line.name)+':</strong> “'+esc(line.text)+'”</p>').join('')+'</section>';}
class HeavenCampaignUI{
 constructor(rpg){this.rpg=rpg;this.pending=null;this.binding=null;this.serial=0;this.seen=new WeakSet();}
 get sim(){return this.rpg.sim;}
 reset(){this.pending=null;this.binding=null;}
 owner(){const c=this.rpg.api.worldContext();return{sim:this.sim,contextSim:c.sim,active:c.active,revision:c.revision,adventureRevision:this.sim.state.adventure.revision,room:this.sim.room,position:{x:this.sim.state.player.x,z:this.sim.state.player.z}};}
 same(bound,position=false){if(!bound)return false;const c=this.owner();return c.contextSim===c.sim&&bound.sim===c.sim&&bound.contextSim===c.contextSim&&bound.active===c.active&&bound.revision===c.revision&&bound.adventureRevision===c.adventureRevision&&bound.room===c.room&&(!position||Math.hypot(bound.position.x-c.position.x,bound.position.z-c.position.z)<.01);}
 commandBinding(el){return this.binding&&el.dataset.binding===String(this.binding.id)&&Number(el.dataset.revision)===this.binding.adventureRevision&&this.same(this.binding);}
 point(){const sim=this.sim,r=record(sim),d=def();if(this.rpg.quest!=='heaven-campaign'&&this.rpg.tab!=='heaven-campaign'||sim.room!==d.room||!r?.accepted)return null;
  const points=r.claimed?[{...d.giver,id:'claim'}]:routePoints(sim);if(r.choice)points.push({...step('fit-arrival-assist'),id:'instrument',name:'Try the saved welcome instrument'});return points.filter(p=>H().at(sim,p)).sort((a,b)=>Math.hypot(a.x-sim.state.player.x,a.z-sim.state.player.z)-Math.hypot(b.x-sim.state.player.x,b.z-sim.state.player.z))[0]||null;
 }
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){if(!this.point())return false;this.rpg.open('heaven-campaign');return true;}
 open(){this.pending=null;this.rpg.open('heaven-campaign');}
 action(el){const action=el.dataset.rpg;if(!action?.startsWith(PREFIX))return false;const type=action.slice(PREFIX.length),id=el.dataset.id,d=def(),sim=this.sim;
  if(type==='open'){this.open();return true;}
  if(type==='track'){if(record(sim)?.accepted&&!record(sim).claimed)this.rpg.quest='heaven-campaign';this.rpg.paint();return true;}
  if(type==='cancel'){this.pending=null;this.rpg.paint();return true;}
  if(type==='walk'){
   const p=id==='giver'||id==='claim'?d.giver:id==='instrument'&&record(sim)?.choice?step('fit-arrival-assist'):id==='escort-staging'&&escortPending(sim)?staging():routePoints(sim).find(p=>p.id===id);
   if(!p||sim.room!==d.room||sim.worldDive){this.rpg.api.toast('Return to the lower Garden and read the current supported route.');return true;}
   this.pending=null;const q=G.RealmTrailsUI.approach(sim,p);this.rpg.close();this.rpg.api.walkLocal(q.x,q.z);return true;
  }
  if(!['accept','step','claim','invite','review','confirm','activate'].includes(type))return true;
  if(!this.commandBinding(el)){this.pending=null;this.rpg.api.toast('The traveller or saved campaign changed. Read the current terms again.');this.rpg.paint();return true;}
  if(type==='review'){
   const s=d.steps.find(s=>s.kind==='choice'),c=d.choices.find(c=>c.id===id);
   if(!c||!H().available(sim.state).some(p=>p.id===s.id)||!H().at(sim,s)){this.rpg.api.toast('Reach the fitted Garden arrival assembly before choosing its arrangement.');return true;}
   this.pending={...this.owner(),choice:c.id,step:s.id};this.rpg.paint();return true;
  }
  const payload={quest:d.id,expectedRevision:this.binding.adventureRevision,expectedActive:this.binding.active};let command=type;
  if(type==='step')payload.step=id;
  if(type==='invite'){
   if(!escortPending(sim)||!H().at(sim,staging())){this.rpg.api.toast('Return to the courier’s waiting place to deliberately invite or restart the walk.');return true;}
   command='escort-invite';payload.step=d.escort.startStep;
  }
  if(type==='activate'&&(!record(sim)?.choice||!H().at(sim,step('fit-arrival-assist')))){this.rpg.api.toast('Reach your saved Garden arrangement before trying the instrument.');return true;}
  if(type==='confirm'){
   if(!this.same(this.pending,true)||id!==this.pending.choice){this.pending=null;this.rpg.api.toast('This preview belongs to an earlier traveller or checkpoint. Read its terms again.');this.rpg.paint();return true;}
   payload.choice=this.pending.choice;payload.step=this.pending.step;command='choose';
  }
  const result=this.rpg.api.heavenCampaignCommand(command,payload);this.pending=null;this.rpg.api.toast(result.text||result.error);
  if(result.ok&&command==='activate'){this.rpg.close();return true;}
  if(result.ok&&!result.duplicate&&command!=='activate')this.rpg.quest='heaven-campaign';this.rpg.paint();return true;
 }
 journal(){const d=def(),r=record(this.sim),status=r?.claimed?'Claimed once':!r?.accepted?'Not accepted':H().ready(this.sim.state)?'Complete · unpaid':'Accepted · '+r.steps.length+' recorded actions';
  return'<section class="heaven-campaign-invitation"><small>HEAVEN · A LOWER GARDEN CONTINUATION</small><h3>'+esc(d.title)+'</h3><p>'+esc(status)+' · '+esc(fee(d))+'</p><p>A false rescue signal, a waiting bell courier and an instrument that welcomes tired hands. The Broken Choir repair keeps its own history.</p>'+button('Read the campaign, danger and exact fee','open')+(r?.accepted&&!r.claimed?button('Track this campaign','track'):'')+'</section>';
 }
 invitation(){return this.journal();}
 escortSection(act){if(!escortPending(this.sim))return'';const sim=this.sim,d=def(),status=escortStatus(sim),active=['following','lagging'].includes(status.status),awaiting=status.status==='awaiting-save',near=H().at(sim,staging());
  const fallback=awaiting?'The real courier reached Calen, but its arrival save was refused. Stay beside Calen and close this workspace so the actual arrival callback can retry. Arrival remains unrecorded until that save succeeds.':active?'Close this workspace and walk the marked service loop with the real courier. Stay within '+d.escort.followRange+' route units; the courier waits when you move too far away.':'An unfinished escort resets after leaving or reloading. Its invitation remains recorded. Return to the waiting place and deliberately invite again; no second fee or ordinary material is granted.';
  return'<section class="heaven-campaign-escort" data-status="'+esc(status.status)+'"><h3>'+esc(d.escort.name)+' · '+esc(status.status)+'</h3><p>'+esc(status.help||fallback)+'</p><p>Your arrival alone cannot record the courier’s arrival. Map reading and this workspace grant no route progress. The upper terrace stays closed.</p>'+(awaiting?'<p>Stay beside Calen. Close the workspace to resume automatic retries of the actual arrival save; no arrival or payout button can replace that callback.</p>':active?'<p>Pause here to read; close the workspace to resume actual movement.</p>':near?act('Invite the courier · restart an unfinished walk','invite',d.escort.startStep):button('Walk to the courier’s waiting place','walk','escort-staging'))+'</section>';
 }
 page(tab){if(tab!=='heaven-campaign')return null;const d=def(),sim=this.sim,r=record(sim),here=sim.room===d.room,available=H().available(sim.state),ids=new Set(available.map(s=>s.id));
  this.binding={...this.owner(),id:++this.serial};const act=(label,type,id='')=>button(label,type,id,'data-binding="'+this.binding.id+'" data-revision="'+this.binding.adventureRevision+'"');
  let html='<article class="heaven-campaign"><header><small>GARDEN OF VOICES → SERVICE LOOP → AN ORDINARY WELCOME</small><h2>'+esc(d.title)+'</h2><p>'+esc(d.summary)+'</p></header><section class="heaven-campaign-terms"><h3>What this campaign offers</h3><p><strong>Exact once-only fee:</strong> '+esc(fee(d))+'. Both arrangements retain usable public passage and the same full material payment.</p><p>'+esc(d.danger)+'</p><p>The upper terrace remains closed. The original Heaven01 trial and protected sanctuary retain their separate identities. This lower Garden work grants no gear, automatic equipment change, class or global allegiance.</p></section>';
  if(!here)html+='<section><p>Reopening resumes the home checkpoint. Accepted work and unpaid completion stay saved. An unfinished courier walk resets; revisit the lower Garden and deliberately invite again at the waiting place.</p><button data-rpg="world-select" data-id="heaven">Read Garden travel</button></section>';
  if(!r?.accepted){html+='<section><h3>An earlier repair remains true</h3><p>'+(!H().eligible(sim.state)?'Complete and explicitly claim The Broken Choir first. Its repair and payment are separate from this campaign.':'The Broken Choir was claimed. Accept this new campaign deliberately; reading its terms grants no work.')+'</p>'+(here&&H().eligible(sim.state)&&H().at(sim,d.giver)?act('Accept the campaign and declared fee','accept'):here?button('Walk to Rielle','walk','giver'):'')+'<ol>'+d.steps.filter(s=>!s.optional).map(s=>'<li>'+esc(s.name)+'</li>').join('')+'</ol></section>';
  }else{
   if(r.claimed)html+='<section><h3>The verified welcome remains</h3><p>'+esc(d.completionText)+'</p></section>';
   html+='<section><h3>Your saved campaign</h3><ol class="heaven-campaign-steps">'+d.steps.map(s=>{
    const done=r.steps.includes(s.id),next=ids.has(s.id);let controls='';
    if(!r.claimed&&next){if(!here)controls='<p>Revisit the lower Garden to reach this action.</p>';
     else if(s.kind==='escort')controls='<p>Close this workspace and accompany the actual courier along the supported service loop. The courier’s complete arrival records this step; there is no arrival button.</p>';
     else if(!H().at(sim,s))controls=button('Walk near this action','walk',s.id);
     else if(s.kind==='defeat')controls='<p>Close this workspace to resume combat. Tab selects the actual apparatus. Use your owned blade or bow, move, Brace or retreat. Both apparatuses accept ordinary damage during every live phase.</p>';
     else if(s.kind==='choice')controls=d.choices.map(c=>act('Read '+c.name+' terms','review',c.id)).join('');
     else if(s.id===d.escort.startStep)controls=act('Deliberately invite the courier','invite',s.id);
     else controls=act(s.name,'step',s.id);
    }
    return'<li class="'+(done?'heaven-campaign-done':next?'heaven-campaign-next':'')+'" data-heaven-step="'+esc(s.id)+'"><h4>'+esc(s.name)+(s.optional?' · optional supplied preparation':'')+(done?' · recorded':'')+'</h4><p>'+esc(s.text)+'</p><div class="world-actions">'+controls+'</div></li>';
   }).join('')+'</ol></section>'+this.escortSection(act);
   if(!r.claimed&&H().ready(sim.state))html+='<section class="heaven-campaign-ready"><h3>Complete · unpaid</h3><p>Return to Rielle for the whole declared fee. A full pouch or refused save keeps this verified work unpaid and retryable.</p>'+(here&&H().at(sim,d.giver)?act('Claim the whole declared fee once','claim'):here?button('Walk back to Rielle','walk','claim'):'')+'</section>';
   if(!r.claimed)html+=button('Track this campaign','track');
  }
  html+='<section><h3>Two lasting welcome arrangements</h3><p>Both retain public access, the truthful account and the old complete return stroke. Your choice changes this local arrival assembly; it creates no global pledge.</p><div class="heaven-campaign-choice-grid">'+d.choices.map(c=>'<article data-heaven-choice="'+esc(c.id)+'"'+(r?.choice===c.id?' class="heaven-campaign-chosen"':'')+'><h4>'+esc(c.name)+(r?.choice===c.id?' · saved arrangement':'')+'</h4><p>'+esc(c.text)+'</p><p>'+esc(c.consequence)+'</p></article>').join('')+'</div></section>'+recognition(r);
  if(r?.choice)html+='<section><h3>Try the recorded welcome</h3><p>The instrument demonstration changes no saved work, costs or payment. It uses only your retained arrangement.</p>'+(here&&H().at(sim,step('fit-arrival-assist'))?act('Try the welcome instrument','activate'):here?button('Walk near the welcome instrument','walk','instrument'):'<p>Revisit the lower Garden to use it.</p>')+'</section>';
  if(this.pending){const c=d.choices.find(c=>c.id===this.pending.choice);html+='<section class="heaven-campaign-confirm" aria-label="Confirm welcome arrangement"><h3>'+esc(c.name)+' · confirm this local fitting</h3><p>'+esc(c.consequence)+'</p><p>This records one lasting arrangement. Public service and the same declared fee remain available with either choice.</p>'+(this.same(this.pending,true)?act('Confirm '+c.name,'confirm',c.id):'<p>The traveller or checkpoint changed. Cancel this preview and read the current terms.</p>')+button('Cancel · keep the arrangement undecided','cancel')+'</section>';}
  html+='<p class="heaven-campaign-footer">Reading, walking and previews record no work. Arrival belongs to the real courier. Both camera styles remain available. Accepted actions, the confirmed arrangement and unpaid completion survive reload.</p></article>';
  return{title:d.title,html};
 }
 tick(){const sim=this.sim,r=record(sim),toggle=document.querySelector('.tracker-switch [data-id="heaven-campaign"]');if(toggle)toggle.hidden=!r?.accepted||r.claimed;
  if(this.pending&&!this.same(this.pending,true))this.pending=null;
  if(!this.seen.has(sim)){this.seen.add(sim);if(r?.accepted&&!r.claimed&&this.rpg.quest==='story')this.rpg.quest='heaven-campaign';}
  if(this.rpg.quest!=='heaven-campaign')return;if(!r?.accepted||r.claimed){this.rpg.quest='story';return;}
  const d=def(),ready=H().ready(sim.state),next=H().available(sim.state)[0],escort=escortPending(sim)?escortStatus(sim):null,detail=sim.room!==d.room?'Revisit the lower Garden · unfinished escort resets':ready?'Return to Rielle · complete, unpaid':escort&&['following','lagging','awaiting-save'].includes(escort.status)?d.escort.name+' · '+escort.status:next?.name||'Read the current campaign';
  const text={'#tracked-chapter':'HEAVEN · THE GATE THAT REMAINED OPEN','#tracked-title':d.title,'#tracked-detail':detail,'#tracked-progress':r.steps.length+' recorded actions · '+(ready?'payment unclaimed':'J campaign · M supported routes')};for(const[selector,value]of Object.entries(text)){const el=document.querySelector(selector);if(el)el.textContent=value;}
 }
}
const api={HeavenCampaignUI,routePoints,legend,fee,escortStatus};G.RealmHeavenCampaignUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
