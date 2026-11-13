/* Project the Open Confluence owner. Routes, reading and previews grant nothing. */
(function(G){'use strict';
const H=()=>G.RealmCosmosCampaign,D=()=>H().definition,B=()=>G.RealmCosmosCampaignData,PREFIX='cosmos-campaign-';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,id='',attrs='')=>'<button data-rpg="'+PREFIX+type+'" data-id="'+esc(id)+'" '+attrs+'>'+esc(label)+'</button>';
const record=sim=>sim.state.cosmosCampaign,step=id=>D().steps.find(s=>s.id===id);
const previousTitle=()=>G.RealmTrails.definition(D().prerequisite).title;
// Story cards on the adventure's story dialog (the same ids and buttons): one card per line, then done().
function cards(lines,done){
 const d=typeof document!=='undefined'&&document.getElementById?document.getElementById('story-dialog'):null;if(!d||!Array.isArray(lines)||!lines.length){if(done)done();return;}
 let i=0;const paint=()=>{const q=lines[i];document.getElementById('story-speaker').textContent=q.speaker?String(q.speaker).toUpperCase():'';document.getElementById('story-title').textContent='';document.getElementById('story-body').textContent=q.text||'';const area=document.getElementById('story-buttons');area.replaceChildren();const b=document.createElement('button');b.textContent=i+1<lines.length?'Next':'Continue';b.onclick=()=>{if(i+1<lines.length){i++;paint();return;}d.close();if(done)done();};area.appendChild(b);};
 paint();d.showModal();
}
// One choice card: its prompt and one button per option.
function choiceCard(prompt,options,pick){
 const d=typeof document!=='undefined'&&document.getElementById?document.getElementById('story-dialog'):null;if(!d||!Array.isArray(options))return;
 document.getElementById('story-speaker').textContent='';document.getElementById('story-title').textContent=prompt||'';document.getElementById('story-body').textContent='';
 const area=document.getElementById('story-buttons');area.replaceChildren();
 for(const o of options){const b=document.createElement('button');b.textContent=o.label;b.onclick=()=>{d.close();pick(o);};area.appendChild(b);}
 d.showModal();
}
function fee(){const r=D().reward;return'Up to '+r.xp+' XP within the stored cap · '+r.coins+' sunmarks · '+r.ore+' ore'+Object.entries(r.materials).map(([k,n])=>' · '+n+' '+({wood:'timber',fiber:'meadow fibre',crystal:'crystal'}[k]||k)).join('');}
function routePoints(sim){const r=record(sim);if(sim.room!==D().room||!r?.accepted||r.claimed)return[];return(H().ready(sim.state)?[{...D().giver,id:'claim',kind:'giver',name:'Return to Anik for your reward'}]:H().available(sim.state)).map((p,i)=>({...p,cosmosCampaign:true,mark:'C'+(i+1)}));}
function legend(sim){const p=routePoints(sim);return p.length?'<section class="cosmos-campaign-map"><h3>The Open Confluence</h3><p>Follow the C labels to the work you can do next. Set any two different anchors; a supplied alternative holds the same branch. The public service loop and road home stay open.</p><ol>'+p.map(s=>'<li><strong>'+s.mark+'</strong> · '+esc(s.name)+' '+button('Walk near this action','walk',s.id)+'</li>').join('')+'</ol>'+button('Read the operation','open')+'</section>':'';}
const SCRIPT=()=>G.RealmStoryScript||(typeof require==='function'?require('./story-script.js'):null);
const scriptCards=(step,state)=>{const s=SCRIPT()?.forStep?.('cosmos',step,state);return s?s.lines.map(l=>({speaker:l.speaker,text:l.text})):[];};
// The script's prompt and option labels for a choice; each button keeps its id and falls back to the term's name.
function choiceControls(step,choices,act,state){
 const sc=SCRIPT()?.forStep?.('cosmos',step,state)||null,opts=sc?.choice?.options||[];
 const label=c=>opts.find(o=>o.id===c.id)?.label||c.name;
 return(sc?.choice?.prompt?'<p>'+esc(sc.choice.prompt)+'</p>':'')+choices.map(c=>act(label(c),'review',c.id)).join('');
}
function advanceCards(){const b=document.getElementById('story-buttons')?.children?.[0];if(b&&b.onclick)b.onclick();}
class CosmosCampaignUI{
 constructor(rpg){this.rpg=rpg;this.pending=null;this.binding=null;this.serial=0;this.seen=new WeakSet();}
 get sim(){return this.rpg.sim;}
 reset(){this.pending=null;this.binding=null;this.holdSent=false;}
 // A command result's story cards, then the sighting prompt when the result carries one (open-confluence).
 showResult(result){
  if(!result||!result.ok||result.duplicate)return;
  const cs=result.cards||(result.lines||[]).map(text=>({text}));
  cards(cs,()=>{if(result.choice)this.askSighting(result.choice);});
 }
 askSighting(choice){
  choiceCard(choice.prompt,choice.options,opt=>{
   const c=this.rpg.api.worldContext();
   const result=this.rpg.api.cosmosCampaignCommand('sighting',{quest:D().id,expectedRevision:this.sim.state.adventure.revision,expectedActive:c.active,heard:opt.id==='hear'});
   this.rpg.api.toast(result.text||result.error);this.showResult(result);this.rpg.paint();
  });
 }
 // The six-second hold (BRANCHES 5): holdTick each frame, a readout while it runs, and the central-link command once it completes.
 // Anik frames the accountability choice once it is open (BRANCHES 3.6: the witness.avar scene), once per session.
 avarFrame(){
  const s=this.sim;if(!s||this.avarShown||!H().available(s.state).some(p=>p.id==='accountability'))return;
  this.avarShown=true;cards(scriptCards('accountability',s.state));
 }
 holdFrame(){
  const s=this.sim,H_=H();if(!s||!H_||!H_.holdTick)return;
  H_.holdTick(s);const h=s.cosmosCampaignRuntime?.hold,readout=document.querySelector('#cosmos-hold-readout');
  if(readout)readout.textContent=h&&!h.complete?'Holding: '+Math.min(6,Math.max(0,(s.elapsed||0)-h.startedAt)).toFixed(1)+' of 6 seconds':'';
  if(!H_.heldComplete(s)){this.holdSent=false;return;}
  if(this.holdSent)return;
  this.holdSent=true;const c=this.rpg.api.worldContext();
  const result=this.rpg.api.cosmosCampaignCommand('configure',{quest:D().id,expectedRevision:s.state.adventure.revision,expectedActive:c.active,step:'disable-central-link',setting:'disconnect-central-synchronization'});
  this.rpg.api.toast(result.text||result.error);this.showResult(result);this.rpg.paint();
 }
 owner(){const s=this.sim,c=this.rpg.api.worldContext();return{sim:s,contextSim:c.sim,active:c.active,rosterRevision:c.revision,revision:s.state.adventure.revision,room:s.room,position:{x:s.state.player.x,z:s.state.player.z}};}
 same(b){if(!b)return false;const c=this.owner();return c.contextSim===c.sim&&b.sim===c.sim&&b.contextSim===c.contextSim&&b.active===c.active&&b.rosterRevision===c.rosterRevision&&b.revision===c.revision&&b.room===c.room&&Math.hypot(b.position.x-c.position.x,b.position.z-c.position.z)<.01;}
 bound(el){return this.binding&&el.dataset.binding===String(this.binding.id)&&Number(el.dataset.revision)===this.binding.revision&&this.same(this.binding);}
 point(){const s=this.sim,r=record(s);if((this.rpg.quest!=='cosmos-campaign'&&this.rpg.tab!=='cosmos-campaign')||s.room!==D().room||!r?.accepted||r.claimed)return null;return routePoints(s).filter(p=>H().at(s,p)).sort((a,b)=>Math.hypot(a.x-s.state.player.x,a.z-s.state.player.z)-Math.hypot(b.x-s.state.player.x,b.z-s.state.player.z))[0]||null;}
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){
  // E near one of your anchors starts the hold when the central link is the next step; otherwise E does what it did.
  const s=this.sim,r=record(s);
  if(s&&r?.accepted&&!r.claimed&&s.room===D().room&&H().available(s.state).some(p=>p.id==='disable-central-link')){const h=H().holdStart(s);if(h.ok){this.rpg.api.toast(h.text);return true;}}
  if(!this.point())return false;this.rpg.open('cosmos-campaign');return true;
 }
 open(){this.pending=null;this.rpg.open('cosmos-campaign');}
 action(el){const action=el.dataset.rpg;if(!action?.startsWith(PREFIX))return false;const type=action.slice(PREFIX.length),id=el.dataset.id,s=this.sim,d=D();
  if(type==='open'){this.open();return true;}
  if(type==='cancel'){this.pending=null;this.rpg.paint();return true;}
  if(type==='track'){if(record(s)?.accepted&&!record(s).claimed)this.rpg.quest='cosmos-campaign';this.rpg.paint();return true;}
  if(type==='walk'){const p=id==='claim'||id==='giver'?d.giver:routePoints(s).find(p=>p.id===id);if(!p||s.room!==d.room)return true;this.pending=null;const near=G.RealmTrailsUI.approach(s,p);this.rpg.close();this.rpg.api.walkLocal(near.x,near.z);return true;}
  if(!['accept','step','configure','review','confirm','claim'].includes(type))return true;
  if(!this.bound(el)){this.pending=null;this.rpg.api.toast('Your traveller or situation has changed. Read this action again.');this.rpg.paint();return true;}
  if(type==='review'){const terms=d.choices.find(c=>c.id===id);if(!terms||!H().available(s.state).some(p=>p.id==='accountability')||!H().at(s,step('accountability')))return true;this.pending={...this.owner(),choice:id};this.rpg.paint();return true;}
  const payload={quest:d.id,expectedRevision:this.binding.revision,expectedActive:this.binding.active};let command=type;
  if(type==='step'||type==='configure'){const p=step(id);if(!p||!H().available(s.state).some(a=>a.id===id)||!H().at(s,p))return true;payload.step=id;if(type==='configure')payload.setting=p.setting;}
  if(type==='confirm'){if(!this.same(this.pending)||this.pending.choice!==id||!H().at(s,step('accountability'))){this.pending=null;this.rpg.api.toast('Your situation has changed since that preview. Read the terms again.');this.rpg.paint();return true;}payload.choice=id;command='choose';}
  const result=this.rpg.api.cosmosCampaignCommand(command,payload);this.pending=null;this.rpg.api.toast(result.text||result.error);this.showResult(result);if(result.ok&&!result.duplicate)this.rpg.quest='cosmos-campaign';this.rpg.paint();return true;
 }
 journal(){const r=record(this.sim),status=r?.claimed?'Complete':!r?.accepted?'Not accepted':H().ready(this.sim.state)?'Open and verified':'Accepted · '+B().completedSupports(r.steps).length+' prepared anchors';return'<section class="cosmos-campaign-invitation"><small>COSMOS · INDEPENDENT SERVICE REACH</small><h3>'+esc(D().title)+'</h3><p>'+esc(status)+' · '+esc(fee())+'</p><p>Set any two anchors. Release the guardian feeds, stop the imposed synchronization and record its cost.</p>'+button('Read Anik’s request and the risks','open')+(r?.accepted&&!r.claimed?button('Track this operation','track'):'')+'</section>';}
 invitation(){return this.journal();}
 panel(){const s=this.sim,d=D(),r=record(s),here=s.room===d.room;this.binding={...this.owner(),id:++this.serial};const attrs='data-binding="'+this.binding.id+'" data-revision="'+this.binding.revision+'"',act=(label,type,id='')=>button(label,type,id,attrs);
  let html='<article class="cosmos-campaign"><p class="cosmos-campaign-kicker">NEAR EXPANSE · THE OPEN CONFLUENCE</p><p>'+esc(d.summary)+'</p><section class="cosmos-campaign-terms"><h3>Work and reward</h3><p><strong>Reward:</strong> '+esc(fee())+'. Materials support your chosen projects; no gear is changed automatically.</p><p><strong>Danger and responses:</strong> '+esc(d.danger)+'</p><p>Set any two different anchors. For each one, inspect and fit its parts or use the tested alternative Anik supplies. No rare seed, timer, private archive or extra regional job is needed. The comparator and drawing shelf keep their own records.</p></section>';
  if(!r?.accepted)html+='<section><h3>Begin with Anik</h3><p>'+(!H().eligible(s.state)?'Finish '+esc(previousTitle())+' first. The Confluence also opens only when the main story reaches it.':'You have checked the comparator. Anik has more work for you.')+'</p>'+(here&&H().eligible(s.state)?H().at(s,d.giver)?act('Accept Anik’s work','accept'):button('Walk to Anik','walk','giver'):'<p>Visit the Near Expanse through its ordinary invitation.</p>')+'</section>';
  else if(r.claimed)html+='<section class="cosmos-campaign-recorded"><h3>Independent operation · complete</h3><p>'+esc(d.completionText)+'</p></section>';
  else{
   const available=new Set(H().available(s.state).map(p=>p.id)),prepared=B().completedSupports(r.steps),configured=B().configuredSupports(r.steps);
   const row=p=>{const done=r.steps.includes(p.id),next=available.has(p.id),at=here&&H().at(s,p);let controls='';if(next&&p.id==='disable-central-link'){controls=here?'<p>Stand at one of the anchors you set and press E. Hold for six seconds with the other anchor out of view.</p><p id="cosmos-hold-readout">'+(s.cosmosCampaignRuntime?.hold?'Holding':'')+'</p>':'<p>Revisit the Near Expanse to continue.</p>';}else if(next){if(!here)controls='<p>Revisit the Near Expanse to continue.</p>';else if(!at)controls=button('Walk near this action','walk',p.id);else if(p.kind==='defeat')controls='<p>Select the machine with Tab or click. Use your blade or bow to disable it.</p>';else if(p.kind==='choice')controls=choiceControls('accountability',d.choices,act,s.state);else controls=act(p.name,p.kind==='configure'?'configure':'step',p.id);}return'<li data-cosmos-step="'+esc(p.id)+'" class="'+(done?'cosmos-campaign-done':next?'cosmos-campaign-next':'')+'"><h4>'+esc(p.name)+(done?' · recorded':p.optional?' · optional route':'')+'</h4><details><summary>Read what to do here</summary><p>'+esc(p.text)+'</p></details>'+controls+'</li>';};
   html+='<section><h3>Any two anchors</h3><p>'+prepared.length+' prepared · '+configured.length+' set. Ordinary and supplied work are two ways to the same anchor. A third anchor is optional.</p><div class="cosmos-campaign-supports">'+B().supports.map(lead=>'<section><h4>'+esc(lead.name)+(prepared.includes(lead.id)?' · prepared':'')+'</h4><p>'+esc(lead.mode)+'</p><p>'+esc(lead.supplied)+'</p><ol>'+d.steps.filter(p=>p.lead===lead.id||p.id===lead.configure).map(row).join('')+'</ol></section>').join('')+'</div></section><section><h3>The service work</h3><ol>'+d.steps.filter(p=>!p.lead&&!B().supports.some(lead=>lead.configure===p.id)).map(row).join('')+'</ol></section>';
   if(H().ready(s.state))html+='<section><h3>Open and verified</h3><p>If your pack is full, make room and return to Anik. The apparatus stays open until you collect your reward.</p>'+(here&&H().at(s,d.giver)?act('Collect your reward','claim'):here?button('Walk back to Anik','walk','claim'):'')+'</section>';html+=button('Track this operation','track');
  }
  html+='<section><h3>Two ways to keep the account</h3><div class="cosmos-campaign-choices">'+d.choices.map(c=>'<section><h4>'+esc(c.name)+(r?.choice===c.id?' · retained':'')+'</h4><p>'+esc(c.text)+'</p><p>'+esc(c.consequence)+'</p></section>').join('')+'</div></section>';
  const choice=d.choices.find(c=>c.id===r?.choice);if(choice)html+='<section><h3>The account you kept</h3>'+choice.recognition.map(v=>'<p><strong>'+esc(v.name)+':</strong> “'+esc(v.text)+'”</p>').join('')+'</section>';
  if(this.pending){const c=d.choices.find(c=>c.id===this.pending.choice);html+='<section class="cosmos-campaign-confirm"><h3>'+esc(c.name)+' · confirm this choice</h3><p>'+esc(c.text)+'</p><p>'+esc(c.consequence)+'</p><p>This choice keeps one account. Both ways pay the same reward and leave the road home open.</p>'+(this.same(this.pending)?act('Confirm '+c.name,'confirm',c.id):'<p>Your traveller or situation has changed. Cancel and read the terms again.</p>')+button('Cancel · leave undecided','cancel')+'</section>';}
  return{title:d.title,html:html+'<p class="cosmos-campaign-footer">Follow the marked fittings, select the machines for combat, and return to Anik when the open apparatus is verified.</p></article>'};
 }
 page(tab){return tab==='cosmos-campaign'?this.panel():null;}
 tick(){this.holdFrame();this.avarFrame();const s=this.sim,r=record(s),toggle=document.querySelector('.tracker-switch [data-id="cosmos-campaign"]');if(toggle)toggle.hidden=!r?.accepted||r.claimed;if(this.pending&&!this.same(this.pending))this.pending=null;if(!this.seen.has(s)){this.seen.add(s);if(r?.accepted&&!r.claimed&&this.rpg.quest==='story')this.rpg.quest='cosmos-campaign';}if(this.rpg.quest!=='cosmos-campaign')return;if(!r?.accepted||r.claimed){this.rpg.quest='story';return;}const next=H().available(s.state).find(p=>!p.optional)||H().available(s.state)[0],ready=H().ready(s.state),detail=s.room!==D().room?'Revisit the Near Expanse · saved work remains':ready?'Return to Anik for your reward':next?.requiresSupports?'Set any two different anchors':next?.requiresConfiguredSupports?'Set any two prepared anchors':next?.name||'Read the support alternatives';for(const[sel,text]of Object.entries({'#tracked-chapter':'COSMOS · THE OPEN CONFLUENCE','#tracked-title':D().title,'#tracked-detail':detail,'#tracked-progress':B().completedSupports(r.steps).length+' prepared · '+B().configuredSupports(r.steps).length+' set · J operation · M routes'})){const el=document.querySelector(sel);if(el)el.textContent=text;}}
}
const api={CosmosCampaignUI,routePoints,legend,fee,choiceControls,advanceCards};G.RealmCosmosCampaignUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
