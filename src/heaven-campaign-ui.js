/* The gate that remained open's page: it projects the rule owner's facts and the live courier.
 * Reading, walking, previews and the welcome demonstration grant no work. */
(function(G){'use strict';
const PREFIX='heaven-campaign-',H=()=>G.RealmHeavenCampaign;
const def=()=>typeof H()?.definition==='function'?H().definition():H()?.definition||G.RealmHeavenCampaignData.definition;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,id='',attrs='')=>'<button data-rpg="'+PREFIX+type+'" data-id="'+esc(id)+'" '+attrs+'>'+esc(label)+'</button>';
const record=sim=>sim.state.heavenCampaign,step=id=>def().steps.find(s=>s.id===id);
// the story script speaks every line; a scene absent for this state has none.
const sceneOf=(owner,id,state)=>G.RealmStoryScript?.forStep?.(owner,id,state)||null,linesOf=s=>Array.isArray(s?.lines)?s.lines:[];
const speech=lines=>lines.map(l=>'<p><strong>'+esc(l.speaker)+':</strong> “'+esc(l.text)+'”</p>').join('');
const sceneSection=(cls,title,s)=>linesOf(s).length?'<section class="'+cls+'"><h3>'+esc(title)+'</h3>'+speech(linesOf(s))+'</section>':'';
function reward(d=def()){return'Up to '+d.reward.xp+' XP within the stored cap · '+d.reward.coins+' sunmarks · '+d.reward.ore+' ore'+Object.entries(d.reward.materials).map(([k,n])=>' · '+n+' '+({wood:'timber',fiber:'fibre'}[k]||k)).join('');}
function escortStatus(sim){const raw=H().escortStatus(sim),status=typeof raw==='string'?raw:raw?.status||raw?.phase||'inactive';return{status,help:typeof raw==='object'?raw.help||raw.text||'':''};}
function escortPending(sim){const r=record(sim);return r?.accepted&&r.steps.includes('secure-service-route')&&!r.steps.includes(def().escort.arrivalStep);}
function staging(){const d=def();return{...step(d.escort.startStep),id:'escort-staging',name:'Invite or restart '+d.escort.name};}
function routePoints(sim){const d=def(),r=record(sim);if(sim.room!==d.room||!r?.accepted||r.claimed)return[];
 let points=H().ready(sim.state)?[{...d.giver,id:'claim',kind:'giver',medium:'dry',name:'Return to '+d.giver.name}]:H().available(sim.state).map(p=>({...p}));
 if(!H().heard(sim.state))points.unshift({...d.envoy,id:'envoy',kind:'envoy',medium:'dry',name:'The envoy · the reading'});
 if(escortPending(sim)){
  const status=escortStatus(sim),actor=H().runtime(sim).escort;
  if(['following','lagging','awaiting-save'].includes(status.status)&&actor?.id===d.escort.id&&[actor.x,actor.z].every(Number.isFinite))points.push({id:'escort-position',name:d.escort.name+' · actual position',x:actor.x,z:actor.z,kind:'escort-live',medium:'dry',informative:true});
  else if(!points.some(p=>p.id===d.escort.startStep))points.push({...staging(),kind:'escort-start',medium:'dry'});
 }
 return points.map((p,i)=>({...p,heavenCampaign:true,mark:'G'+(i+1)}));
}
function legend(sim){const points=routePoints(sim);return points.length?'<section class="heaven-campaign-map"><h3>The gate that remained open</h3><p>G labels show this road. The service walk and the road home stay open; the upper terrace stays closed. Walking to a label records nothing.</p><ol>'+points.map(p=>'<li><strong>'+p.mark+'</strong> · '+esc(p.name)+(p.optional?' · optional preparation':'')+(p.informative?' · live location':'')+' '+button('Walk near this point','walk',p.id)+'</li>').join('')+'</ol>'+button('Read the road and the courier','open')+'</section>':'';}
function recognition(r,state){const d=def();if(!r?.steps.includes('verify-welcome')||!r.choice)return'';const c=d.choices.find(c=>c.id===r.choice);return'<section class="heaven-campaign-local-recognition"><h3>The welcome is remembered</h3><p>'+esc(c.consequence)+'</p>'+speech(linesOf(sceneOf('heaven','verify-welcome',state)))+'</section>';}
class HeavenCampaignUI{
 constructor(rpg){this.rpg=rpg;this.pending=null;this.binding=null;this.serial=0;this.seen=new WeakSet();}
 get sim(){return this.rpg.sim;}
 reset(){this.pending=null;this.binding=null;}
 owner(){const c=this.rpg.api.worldContext();return{sim:this.sim,contextSim:c.sim,active:c.active,revision:c.revision,adventureRevision:this.sim.state.adventure.revision,room:this.sim.room,position:{x:this.sim.state.player.x,z:this.sim.state.player.z}};}
 same(bound,position=false){if(!bound)return false;const c=this.owner();return c.contextSim===c.sim&&bound.sim===c.sim&&bound.contextSim===c.contextSim&&bound.active===c.active&&bound.revision===c.revision&&bound.adventureRevision===c.adventureRevision&&bound.room===c.room&&(!position||Math.hypot(bound.position.x-c.position.x,bound.position.z-c.position.z)<.01);}
 commandBinding(el){return this.binding&&el.dataset.binding===String(this.binding.id)&&Number(el.dataset.revision)===this.binding.adventureRevision&&this.same(this.binding);}
 point(){const sim=this.sim,r=record(sim),d=def();if(this.rpg.quest!=='heaven-campaign'&&this.rpg.tab!=='heaven-campaign'||sim.room!==d.room||!r?.accepted)return null;
  const points=r.claimed?[{...d.giver,id:'claim'}]:routePoints(sim);if(r.choice)points.push({...step('fit-arrival-assist'),id:'instrument',name:'Try your welcome'});return points.filter(p=>H().at(sim,p)).sort((a,b)=>Math.hypot(a.x-sim.state.player.x,a.z-sim.state.player.z)-Math.hypot(b.x-sim.state.player.x,b.z-sim.state.player.z))[0]||null;
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
   if(!p||sim.room!==d.room||sim.worldDive){this.rpg.api.toast('Go back to the garden and read the road again.');return true;}
   this.pending=null;const q=G.RealmTrailsUI.approach(sim,p);this.rpg.close();this.rpg.api.walkLocal(q.x,q.z);return true;
  }
  if(!['accept','step','claim','invite','review','confirm','activate','envoy'].includes(type))return true;
  if(!this.commandBinding(el)){this.pending=null;this.rpg.api.toast('Your saved road has changed. Read it again.');this.rpg.paint();return true;}
  if(type==='review'){
   const s=d.steps.find(s=>s.kind==='choice'),c=d.choices.find(c=>c.id===id);
   if(!c||!H().available(sim.state).some(p=>p.id===s.id)||!H().at(sim,s)){this.rpg.api.toast('Go to the fitted arrival assembly before you choose.');return true;}
   this.pending={...this.owner(),choice:c.id,step:s.id};this.rpg.paint();return true;
  }
  const payload={quest:d.id,expectedRevision:this.binding.adventureRevision,expectedActive:this.binding.active};let command=type;
  if(type==='step')payload.step=id;
  if(type==='invite'){
   if(!escortPending(sim)||!H().at(sim,staging())){this.rpg.api.toast('Go back to the courier’s waiting place to invite it or start its walk again.');return true;}
   command='escort-invite';payload.step=d.escort.startStep;
  }
  if(type==='activate'&&(!record(sim)?.choice||!H().at(sim,step('fit-arrival-assist')))){this.rpg.api.toast('Go to your welcome before you try it.');return true;}
  if(type==='confirm'){
   if(!this.same(this.pending,true)||id!==this.pending.choice){this.pending=null;this.rpg.api.toast('This preview belongs to an earlier checkpoint. Read the terms again.');this.rpg.paint();return true;}
   payload.choice=this.pending.choice;payload.step=this.pending.step;command='choose';
  }
  const result=this.rpg.api.heavenCampaignCommand(command,payload);this.pending=null;this.rpg.api.toast(result.text||result.error);
  if(result.ok&&command==='activate'){this.rpg.close();return true;}
  if(result.ok&&!result.duplicate&&command!=='activate')this.rpg.quest='heaven-campaign';this.rpg.paint();return true;
 }
 journal(){const d=def(),r=record(this.sim),status=r?.claimed?'Finished':!r?.accepted?'Not started':H().ready(this.sim.state)?'Complete':'Under way · '+r.steps.length+' steps done';
  return'<section class="heaven-campaign-invitation"><small>HEAVEN · THE GARDEN GATE</small><h3>'+esc(d.title)+'</h3><p>'+esc(status)+' · '+esc(reward(d))+'</p><p>A borrowed rescue signal, a bell courier who waits on the Arcade walk and a welcome for tired hands. The Broken Choir keeps its own history.</p>'+button('Read the road and what it asks','open')+(r?.accepted&&!r.claimed?button('Track this road','track'):'')+'</section>';
 }
 invitation(){return this.journal();}
 envoySection(act){const d=def(),sim=this.sim,here=sim.room===d.room;
  return'<section class="heaven-campaign-envoy"><h3>The envoy’s home</h3><p>The envoy keeps a house in this garden. The reading comes before the walk on the Arcade road: nothing is watching for you there until it is heard.</p>'+speech(linesOf(sceneOf('heaven','envoy',sim.state)))+(here&&H().at(sim,d.envoy)?act('Hear the envoy’s reading','envoy'):here?button('Walk to the envoy','walk','envoy'):'<p>Go back to the garden to hear the reading.</p>')+'</section>';
 }
 escortSection(act){if(!escortPending(this.sim))return'';const sim=this.sim,d=def(),status=escortStatus(sim),active=['following','lagging'].includes(status.status),awaiting=status.status==='awaiting-save',near=H().at(sim,staging());
  const fallback=awaiting?'The courier reached Calen, but the arrival would not save. Stay beside Calen and close this page so the arrival can retry. It is not recorded until the save works.':active?'Close this page and walk the marked loop with the courier. Stay within '+d.escort.followRange+' units; it waits when you wander off.':'An unfinished walk resets after you leave or reload. The invitation stays. Come back to the waiting place and invite the courier again.';
  return'<section class="heaven-campaign-escort" data-status="'+esc(status.status)+'"><h3>'+esc(d.escort.name)+' · '+esc(status.status)+'</h3><p>'+esc(status.help||fallback)+'</p><p>Your own arrival does not count. Reading the map and this page earn no progress. The upper terrace stays closed.</p>'+(awaiting?'<p>Stay beside Calen and close this page. The arrival retries by itself; no button can replace it.</p>':active?'<p>Pause here to read. Close the page to walk on.</p>':near?act('Invite the courier · or start its walk again','invite',d.escort.startStep):button('Walk to the courier’s waiting place','walk','escort-staging'))+'</section>';
 }
 page(tab){if(tab!=='heaven-campaign')return null;const d=def(),sim=this.sim,r=record(sim),here=sim.room===d.room,available=H().available(sim.state),ids=new Set(available.map(s=>s.id));
  this.binding={...this.owner(),id:++this.serial};const act=(label,type,id='')=>button(label,type,id,'data-binding="'+this.binding.id+'" data-revision="'+this.binding.adventureRevision+'"');
  let html='<article class="heaven-campaign"><header><small>GARDEN OF VOICES → THE ARCADE WALK → AN ORDINARY WELCOME</small><h2>'+esc(d.title)+'</h2><p>'+esc(d.summary)+'</p></header><section class="heaven-campaign-terms"><h3>What this road asks</h3><p><strong>Reward:</strong> '+esc(reward(d))+'. Both arrangements keep the garden open and carry the same reward.</p><p>'+esc(d.danger)+'</p><p>The upper terrace stays closed. The Heaven trial and the sanctuary keep their own stories. This road grants no gear, no class and no allegiance.</p></section>';
  if(!here)html+='<section><p>Reopening takes you to your last checkpoint. Your progress stays saved. An unfinished courier walk resets; come back and invite it again at the waiting place.</p><button data-rpg="world-select" data-id="heaven">Read the way back to the garden</button></section>';
  if(!r?.accepted){html+='<section><h3>The Broken Choir is mended</h3><p>'+(!H().eligible(sim.state)?(G.RealmSaga.allowed(sim.state,'heaven')?'Finish the Broken Choir repair first. Its garden answer stays true.':'The garden gate opens after the foundry. Finish that road first.'):'Rielle has the road. Take it up when you are ready.')+'</p>'+(here&&H().eligible(sim.state)&&H().at(sim,d.giver)?act('Begin the road','accept'):here?button('Walk to Rielle','walk','giver'):'')+'<ol>'+d.steps.filter(s=>!s.optional).map(s=>'<li>'+esc(s.name)+'</li>').join('')+'</ol></section>';
  }else{
   if(r.claimed)html+='<section><h3>The welcome remains</h3><p>'+esc(d.completionText)+'</p></section>';
   if(!r.steps.length&&!r.claimed)html+=sceneSection('heaven-campaign-arrival','Arrival',sceneOf('heaven','arrive',sim.state));
   if(!H().heard(sim.state)&&!r.claimed)html+=this.envoySection(act);else if(!r.claimed)html+=sceneSection('heaven-campaign-reading','The reading',sceneOf('heaven','reading',sim.state));
   html+='<section><h3>Your road so far</h3><ol class="heaven-campaign-steps">'+d.steps.map(s=>{
    const done=r.steps.includes(s.id),next=ids.has(s.id);let controls='';
    if(!r.claimed&&next){if(!here)controls='<p>Go back to the garden to reach this step.</p>';
     else if(s.kind==='escort')controls='<p>Close this page and walk with the courier along the marked loop. Its arrival records this step; there is no button for it.</p>';
     else if(!H().at(sim,s))controls=button('Walk near this action','walk',s.id);
     else if(s.kind==='defeat')controls='<p>Close this page to fight. Tab selects the apparatus. Use your blade or bow, move, Brace or retreat. Both take ordinary damage in every live phase.</p>';
     else if(s.kind==='choice')controls=d.choices.map(c=>act('Read this arrangement','review',c.id)).join('');
     else if(s.id===d.escort.startStep)controls=act('Invite the courier','invite',s.id);
     else controls=act(s.name,'step',s.id);
    }
    return'<li class="'+(done?'heaven-campaign-done':next?'heaven-campaign-next':'')+'" data-heaven-step="'+esc(s.id)+'"><h4>'+esc(s.name)+(s.optional?' · optional':'')+(done?' · recorded':'')+'</h4><p>'+esc(s.text)+'</p>'+speech(linesOf(sceneOf('heaven',s.id,sim.state)))+'<div class="world-actions">'+controls+'</div></li>';
   }).join('')+'</ol></section>'+this.escortSection(act);
   if(!r.claimed&&H().ready(sim.state))html+='<section class="heaven-campaign-ready"><h3>Complete</h3><p>Return to Rielle to close the work. A full pouch never stops it; anything that does not fit stays in the garden.</p>'+(here&&H().at(sim,d.giver)?act('Return to Rielle and close the work','claim'):here?button('Walk back to Rielle','walk','claim'):'')+'</section>';
   if(!r.claimed)html+=button('Track this road','track');
  }
  html+='<section><h3>Two welcome arrangements</h3><p>Both keep the garden open, the true account and the old return stroke. Your choice changes this one fitting and is kept for good.</p><div class="heaven-campaign-choice-grid">'+d.choices.map(c=>'<article data-heaven-choice="'+esc(c.id)+'"'+(r?.choice===c.id?' class="heaven-campaign-chosen"':'')+'><h4>'+esc(c.name)+(r?.choice===c.id?' · your welcome':'')+'</h4><p>'+esc(c.text)+'</p><p>'+esc(c.consequence)+'</p></article>').join('')+'</div></section>'+recognition(r,sim.state);
  if(r?.choice)html+='<section><h3>Try your welcome</h3><p>Trying it changes nothing you have recorded. It only shows the arrangement you kept.</p>'+(here&&H().at(sim,step('fit-arrival-assist'))?act('Try the welcome','activate'):here?button('Walk near the welcome instrument','walk','instrument'):'<p>Go back to the garden to try it.</p>')+'</section>';
  if(this.pending){const c=d.choices.find(c=>c.id===this.pending.choice);html+='<section class="heaven-campaign-confirm" aria-label="Confirm welcome arrangement"><h3>'+esc(c.name)+' · confirm this welcome</h3><p>'+esc(c.consequence)+'</p><p>This is kept for good. Both arrangements keep the garden open and carry the same reward.</p>'+(this.same(this.pending,true)?act('Confirm this welcome','confirm',c.id):'<p>Your checkpoint changed. Cancel this preview and read the terms again.</p>')+button('Cancel · decide later','cancel')+'</section>';}
  html+='<p class="heaven-campaign-footer">Reading and walking record nothing. Arrival belongs to the courier. Both camera styles stay available. Your steps, your welcome and a finished road survive a reload.</p></article>';
  return{title:d.title,html};
 }
 tick(){const sim=this.sim,r=record(sim),toggle=document.querySelector('.tracker-switch [data-id="heaven-campaign"]');if(toggle)toggle.hidden=!r?.accepted||r.claimed;
  if(this.pending&&!this.same(this.pending,true))this.pending=null;
  if(!this.seen.has(sim)){this.seen.add(sim);if(r?.accepted&&!r.claimed&&this.rpg.quest==='story')this.rpg.quest='heaven-campaign';}
  if(this.rpg.quest!=='heaven-campaign')return;if(!r?.accepted||r.claimed){this.rpg.quest='story';return;}
  const d=def(),ready=H().ready(sim.state),escort=escortPending(sim)?escortStatus(sim):null,next=H().available(sim.state)[0];
  const detail=sim.room!==d.room?'Go back to the garden · an unfinished walk resets':escort&&['following','lagging','awaiting-save'].includes(escort.status)?d.escort.name+' · '+escort.status:!H().heard(sim.state)?'The envoy’s reading · walk to the envoy':ready?'Return to Rielle · the work is done':next?.name||'Read the road';
  const text={'#tracked-chapter':'HEAVEN · THE GATE THAT REMAINED OPEN','#tracked-title':d.title,'#tracked-detail':detail,'#tracked-progress':r.steps.length+' steps · '+(ready?'ready to close':'J road · M routes')};for(const[selector,value]of Object.entries(text)){const el=document.querySelector(selector);if(el)el.textContent=value;}
 }
}
const api={HeavenCampaignUI,routePoints,legend,reward,escortStatus};G.RealmHeavenCampaignUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
