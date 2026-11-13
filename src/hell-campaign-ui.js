/* The stolen pattern's page: reading and route previews own no saved progress. Spoken lines come from the data's
 * lines table (or a story script when one lands), never from the step narration. */
(function(G){'use strict';
const H=()=>G.RealmHellCampaign,def=()=>typeof H().definition==='function'?H().definition():H().definition;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,id='',extra='')=>'<button data-rpg="hell-campaign-'+type+'" data-id="'+esc(id)+'" '+extra+'>'+esc(label)+'</button>';
const record=sim=>sim.state.hellCampaign;
// a story script, when it lands, owns the spoken lines; until then the data table answers.
const spoken=(d,id,state)=>{const s=G.RealmStoryScript?.scene?.(id,state);return Array.isArray(s?.lines)?s.lines:(d.lines?.scenes?.[id]||[]);};
const speech=lines=>lines.map(l=>'<p><strong>'+esc(l.speaker)+':</strong> “'+esc(l.text)+'”</p>').join('');
function reward(d=def()){return d.reward.xp+' XP · '+d.reward.coins+' sunmarks · '+d.reward.ore+' ore'+Object.entries(d.reward.materials||{}).map(([k,n])=>' · '+n+' '+({wood:'timber',fiber:'fibre'}[k]||k)).join('');}
function routePoints(sim){const d=def(),r=record(sim);if(sim.room!==d.room||!r?.accepted||r.claimed)return[];
 const points=H().ready(sim.state)?[{...d.giver,id:'claim',kind:'giver',medium:'dry',name:'Return to '+d.giver.name}]:H().available(sim.state);
 return points.map((p,i)=>({...p,hellCampaign:true,mark:'W'+(i+1)}));
}
function legend(sim){const points=routePoints(sim);return points.length?'<section class="hell-campaign-map"><h3>The stolen pattern</h3><p>W labels show this road. The outer works are open from here; the inner foundry stays shut. Walking records nothing.</p><ol>'+points.map(p=>'<li><strong>'+p.mark+'</strong> · '+esc(p.name)+(p.optional?' · optional preparation':'')+' '+button('Walk near this action','walk',p.id)+'</li>').join('')+'</ol>'+button('Read the road and your choice','open')+'</section>':'';}
function recognition(r,d=def()){if(!r?.steps.includes('verify-route')||!r.choice)return'';
 return'<section class="hell-campaign-local-recognition"><h3>The choice is remembered</h3>'+speech(d.lines.recognition[r.choice])+'</section>';}
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
   if(!p||sim.room!==d.room||sim.worldDive){this.rpg.api.toast('Go back to Kiln Refuge and read the road again.');return true;}
   this.pending=null;const q=G.RealmTrailsUI.approach(sim,p);this.rpg.close();this.rpg.api.walkLocal(q.x,q.z);return true;
  }
  if(!['accept','step','claim','review','confirm'].includes(type))return true;
  if(!this.commandBinding(el)){this.pending=null;this.rpg.api.toast('Your saved road has changed. Read it again.');this.rpg.paint();return true;}
  if(type==='review'){
   const step=d.steps.find(s=>s.kind==='choice'),choice=d.choices.find(c=>c.id===id);
   if(!choice||!step||!H().available(sim.state).some(s=>s.id===step.id)||!H().at(sim,step)){this.rpg.api.toast('Take the pattern back before you choose.');return true;}
   this.pending={...this.owner(),choice:choice.id,step:step.id};this.rpg.paint();return true;
  }
  const payload={quest:d.id,expectedRevision:this.binding.adventureRevision,expectedActive:this.binding.active};let command=type;
  if(type==='step')payload.step=id;
  if(type==='confirm'){
   if(!this.same(this.pending,true)||id!==this.pending.choice){this.pending=null;this.rpg.api.toast('This preview belongs to an earlier checkpoint. Read the choice again.');this.rpg.paint();return true;}
   Object.assign(payload,{step:this.pending.step,choice:this.pending.choice});command='choose';
  }
  const result=this.rpg.api.hellCampaignCommand(command,payload);this.pending=null;this.rpg.api.toast(result.text||result.error);
  if(result.ok&&!result.duplicate)this.rpg.quest='hell-campaign';this.rpg.paint();return true;
 }
 journal(){const d=def(),r=record(this.sim),status=r?.claimed?'Finished':!r?.accepted?'Not started':H().ready(this.sim.state)?'Complete':'Under way · '+r.steps.length+' steps done';
  return'<section class="hell-campaign-invitation"><small>HELL · THE FOUNDRY ROAD</small><h3>'+esc(d.title)+'</h3><p>'+esc(status)+' · '+esc(reward(d))+'</p><p>A witness who is safe, a former riveter and a gate that still keeps the road. Neris stays in the Refuge while you go down.</p>'+button('Read the road','open')+(r?.accepted&&!r.claimed?button('Track this road','track'):'')+'</section>';
 }
 invitation(){return this.journal();}
 page(tab){if(tab!=='hell-campaign')return null;const d=def(),sim=this.sim,r=record(sim),here=sim.room===d.room,eligible=H().eligible(sim.state),available=H().available(sim.state),ids=new Set(available.map(s=>s.id));
  this.binding={...this.owner(),id:++this.serial};const act=(label,type,id='')=>button(label,type,id,'data-binding="'+this.binding.id+'" data-revision="'+this.binding.adventureRevision+'"');
  let html='<article class="hell-campaign"><header><small>KILN REFUGE → THE OUTER GATE → THE FOUNDRY</small><h2>'+esc(d.title)+'</h2><p>'+esc(d.summary)+'</p></header><section class="hell-campaign-terms"><h3>What this road asks</h3><p><strong>Reward:</strong> '+esc(reward(d))+'. Stored XP stops at its cap.</p><p>'+esc(d.danger)+'</p><p>The inner foundry stays shut. Istra’s road home stays open throughout. The fittings you use here are supplied and cost nothing from your pack. The road grants no gear and no class.</p></section>';
  if(!here)html+='<section><p>Reopening takes you back to your last checkpoint. Your progress stays saved. Go back to Hell to continue.</p><button data-rpg="world-select" data-id="hell">Read the way back to the Refuge</button></section>';
  if(!r?.accepted){
   html+='<section><h3>Begin with Neris</h3><p>'+(!eligible?(G.RealmSaga.allowed(sim.state,'hell')?'Finish the Open Cage rescue first. Neris’s way out of the cell is the way in.':'The road to the foundry is not open yet. The night at Bellweather has to come first.'):'Istra has the road. Take it up when you are ready.')+'</p>'+(here&&eligible&&H().at(sim,d.giver)?act('Begin the road','accept'):here?button('Walk to Istra in the Refuge','walk','giver'):'')+'<ol>'+d.steps.filter(s=>!s.optional).map(s=>'<li>'+esc(s.name)+'</li>').join('')+'</ol></section>';
  }else{
   if(r.claimed)html+='<section class="hell-campaign-recognition"><h3>Istra keeps the road honest</h3><p>'+esc(d.completionText)+'</p></section>';
   html+='<section><h3>Your road so far</h3><ol class="hell-campaign-steps">'+d.steps.map(s=>{
    const done=r.steps.includes(s.id),next=ids.has(s.id);let controls='';
    if(!r.claimed&&next){
     if(!here)controls='<p>Go back to Hell to reach this step.</p>';
     else if(!H().at(sim,s))controls=button('Walk near this action','walk',s.id);
     else if(s.kind==='defeat')controls='<p>Close this page to fight. Tab selects Veyr. Use your blade or bow, move or Brace through the marked shape, and strike while he recovers.</p>';
     else if(s.kind==='choice')controls=d.choices.map(c=>act('Read this choice','review',c.id)).join('');
     else controls=act(s.id==='challenge-veyr'?'Challenge Veyr':s.name,'step',s.id);
    }
    return'<li class="'+(done?'hell-campaign-done':next?'hell-campaign-next':'')+'" data-hell-step="'+esc(s.id)+'"><h4>'+esc(s.name)+(s.optional?' · optional':'')+(done?' · recorded':'')+'</h4><p>'+esc(s.text)+'</p>'+speech(spoken(d,s.id,sim.state))+'<div class="world-actions">'+controls+'</div></li>';
   }).join('')+'</ol></section>';
   if(!r.claimed&&H().ready(sim.state))html+='<section class="hell-campaign-ready"><h3>Complete</h3><p>Return to Istra to close the road. A full pouch never stops it; anything that does not fit stays in the works.</p>'+(here&&H().at(sim,d.giver)?act('Return to Istra and close the road','claim'):here?button('Walk back to Istra','walk','claim'):'')+'</section>';
   if(!r.claimed)html+=button('Track this road','track');
  }
  html+='<section class="hell-campaign-dispositions"><h3>Three choices for the people held here</h3><p>Your choice changes the gate and the road it leaves. The regent remembers what you choose.</p><div class="hell-campaign-choice-grid">'+d.choices.map(c=>'<article data-hell-choice="'+esc(c.id)+'"'+(r?.choice===c.id?' class="hell-campaign-chosen"':'')+'><h4>'+esc(c.name)+(r?.choice===c.id?' · your choice':'')+'</h4><p>'+esc(c.text)+'</p><p>'+esc(c.consequence)+'</p></article>').join('')+'</div></section>'+recognition(r,d,sim.state);
  if(this.pending){const c=d.choices.find(c=>c.id===this.pending.choice),valid=this.same(this.pending,true);html+='<section class="hell-campaign-confirm" aria-label="Confirm this choice"><h3>'+esc(c?.name)+' · confirm this choice</h3><p>'+esc(c?.consequence)+'</p><p>This choice is kept for good. The reward is the same whichever you pick. It assigns no class and no allegiance.</p>'+(valid?act('Confirm this choice','confirm',c.id):'<p>Your checkpoint changed. Cancel this preview and read the choice again.</p>')+button('Cancel · decide later','cancel')+'</section>';}
  html+='<p class="hell-campaign-footer">Reading and walking record nothing. Both camera styles stay available. Your steps, your choice and a finished road survive a reload.</p></article>';
  return{title:d.title,html};
 }
 tick(){const sim=this.sim,r=record(sim),toggle=document.querySelector('.tracker-switch [data-id="hell-campaign"]');if(toggle)toggle.hidden=!r?.accepted||r.claimed;
  if(this.pending&&!this.same(this.pending,true))this.pending=null;
  if(!this.seen.has(sim)){this.seen.add(sim);if(r?.accepted&&!r.claimed&&this.rpg.quest==='story')this.rpg.quest='hell-campaign';}
  if(this.rpg.quest!=='hell-campaign')return;if(!r?.accepted||r.claimed){this.rpg.quest='story';return;}
  const d=def(),ready=H().ready(sim.state),next=H().available(sim.state)[0],text={'#tracked-chapter':'HELL · THE STOLEN PATTERN','#tracked-title':d.title,'#tracked-detail':sim.room===d.room?(ready?'Return to Istra · the road is done':next?.name||'Read the road'):'Go back to the Refuge · your progress is saved','#tracked-progress':r.steps.length+' steps · '+(ready?'ready to close':'J road · M routes')};
  for(const[selector,value]of Object.entries(text)){const e=document.querySelector(selector);if(e)e.textContent=value;}
 }
}
const api={HellCampaignUI,routePoints,legend,reward,spoken};G.RealmHellCampaignUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
