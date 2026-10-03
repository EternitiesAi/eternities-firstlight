/* Local work is deliberate. Reading, walking and an assembly preview pay nothing. */
(function(G){'use strict';
const L=G.RealmLocalLife,W=G.RealmWorldFoundations;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,id='')=>'<button data-rpg="civic-'+action+'" data-id="'+esc(id)+'">'+esc(label)+'</button>';
const material={wood:'timber',fiber:'meadow fibre',crystal:'moon crystal'};
const fee=d=>d.reward.xp+' XP · '+d.reward.coins+' sunmarks'+(d.reward.ore?' · '+d.reward.ore+' ore':'')+Object.entries(d.reward.materials||{}).map(([k,n])=>' · '+n+' '+(material[k]||k)).join('');
function routePoints(sim){
 const realm=W.definition(sim.room)?.id,d=L.definitions.find(d=>d.realm===realm);if(!d)return[];
 const r=sim.state.localLife.records[d.id];if(!r.accepted||r.claimed)return[];
 const points=L.ready(sim.state,d)?[{...(d.returner||d.giver),id:'return',name:'Return to '+(d.returner||d.giver).name,kind:'giver',medium:'dry'}]:L.available(sim.state,d);
 return points.map((p,i)=>({...p,quest:d.id,mark:'L'+(i+1)}));
}
class LocalLifeUI{
 constructor(rpg){this.rpg=rpg;this.selected=null;this.reading=null;this.tracked=null;this.seen=new WeakSet();}
 get sim(){return this.rpg.sim;}
 local(){return L.definitions.find(d=>d.realm===W.definition(this.sim.room)?.id)||null;}
 point(){
  const d=this.local();if(!d)return null;const r=this.sim.state.localLife.records[d.id];
  if(!r.accepted||this.rpg.quest!=='local-life'&&this.rpg.tab!=='local-life'||r.claimed&&this.rpg.quest!=='local-life')return null;
  const points=r.claimed?[{...(d.returner||d.giver),id:'return',kind:'giver'}]:routePoints(this.sim);
  return points.filter(p=>L.at(this.sim,p)).sort((a,b)=>Math.hypot(a.x-this.sim.state.player.x,a.z-this.sim.state.player.z)-Math.hypot(b.x-this.sim.state.player.x,b.z-this.sim.state.player.z))[0]||null;
 }
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){const p=this.point();if(!p)return false;this.selected=this.local().realm;this.reading=p.id;this.rpg.open('local-life');return true;}
 action(el){
  const action=el.dataset.rpg,id=el.dataset.id;if(!action?.startsWith('civic-'))return false;
  const type=action.slice(6);
  if(type==='open'){this.selected=id||W.definition(this.sim.room)?.id||'all';this.rpg.open('local-life');return true;}
  if(type==='all'){this.selected='all';this.rpg.open('local-life');return true;}
  if(type==='track'){const d=L.definition(id);if(d&&this.sim.state.localLife.records[id].accepted&&!this.sim.state.localLife.records[id].claimed){this.tracked=id;this.rpg.quest='local-life';this.rpg.paint();}return true;}
  const d=this.local();if(!d){this.rpg.api.toast('Visit the local work’s realm before acting.');return true;}
  const r=this.sim.state.localLife.records[d.id];
  if(type==='walk'){
   const p=id==='return'?d.returner||d.giver:id==='giver'?d.giver:L.available(this.sim.state,d).find(s=>s.id===id);
   if(!p){this.rpg.api.toast('Read the available local actions again.');return true;}
   if(this.sim.worldDive||p.medium==='water'||p.medium==='court'){this.rpg.api.toast('Use the Tide Steps entry and F / G to reach the indicated depth. The map marks the physical work.');return true;}
   const q=G.RealmTrailsUI.approach(this.sim,p);this.rpg.close();this.rpg.api.walkLocal(q.x,q.z);return true;
  }
  const payload={quest:d.id};
  if(type==='accept')payload.choice=id;
  if(type==='step'){const [step,assembly]=id.split(':');Object.assign(payload,{step,assembly});}
  if(['accept','step','claim'].includes(type)){
   const result=this.rpg.api.localLifeCommand(type,payload);this.rpg.api.toast(result.text||result.error);
   if(result.ok&&!result.duplicate){this.tracked=d.id;this.rpg.quest='local-life';this.reading=payload.step||null;}
   this.rpg.paint();
  }
  return true;
 }
 teaser(realm){const d=L.definitions.find(d=>d.realm===realm);if(!d)return'';const r=this.sim.state.localLife.records[d.id];return'<section class="local-life-teaser"><small>LOCAL LIFE · SEPARATE ONCE-ONLY WORK</small><h3>'+esc(d.title)+'</h3><p>'+esc(r.claimed?d.completionText:d.summary)+'</p>'+button(r.accepted?'Read saved local work':'Read the commission, arrangements and payment','open',realm)+'</section>';}
 journal(){
  return'<section class="local-life-board" aria-label="Local life across the roads"><div class="local-life-heading"><div><small>PLACES PEOPLE INHABIT</small><h2>Local life across the roads</h2><p>Four finite commissions keep their own arrangements, supplied parts and payments.</p></div>'+button('Read all local commissions','all')+'</div><div class="local-life-grid">'+L.definitions.map(d=>{
   const r=this.sim.state.localLife.records[d.id],state=r.claimed?'Paid once':!r.accepted?'Not accepted':L.ready(this.sim.state,d)?'Ready to return · unpaid':r.steps.length+'/'+d.steps.length+' actions';
   return'<article data-local-work="'+d.id+'"><small>'+esc(W.definition(d.realm).name)+' · '+esc(state)+'</small><h3>'+esc(d.title)+'</h3><p>'+esc((d.returner||d.giver).name)+' · '+esc(fee(d))+'</p>'+button('Read local work','open',d.realm)+(r.accepted&&!r.claimed?button('Track this local work','track',d.id):'')+'</article>';
  }).join('')+'</div><p>Supplied job parts never occupy equipment slots. These payments contribute to ordinary crafting and building; fully fitted gear gains no new power tier from them.</p></section>';
 }
 page(tab){
  if(tab!=='local-life')return null;
  const selected=this.selected||W.definition(this.sim.room)?.id||'all',list=L.definitions.filter(d=>selected==='all'||d.realm===selected);
  let html='<section class="local-life-page"><p>Practical work, lasting arrangements and separate once-only payments. Reading accepts nothing.</p><div class="world-actions">'+button('All four commissions','all')+'</div>';
  for(const d of list){
   const r=this.sim.state.localLife.records[d.id],here=W.definition(this.sim.room)?.id===d.realm,eligible=L.eligible(this.sim.state,d),choice=d.choices.find(c=>c.id===r.choice);
   html+='<article class="local-life-card" data-local-quest="'+d.id+'"><small>'+esc(W.definition(d.realm).name)+' · '+(r.claimed?'CLAIMED ONCE':r.accepted?'ACCEPTED LOCAL WORK':'OPTIONAL LOCAL COMMISSION')+'</small><h3>'+esc(d.title)+'</h3><p><strong>Commissioned by:</strong> '+esc(d.giver.name)+(d.returner?'<br><strong>Return to:</strong> '+esc(d.returner.name):'')+'</p><p>'+esc(d.summary)+'</p><p><strong>Route and danger:</strong> '+esc(d.danger)+'</p><p><strong>Exact once-only payment:</strong> '+esc(fee(d))+'. XP credits only up to the existing 9999 stored cap.</p>';
   if(!r.accepted){
    html+='<p>'+(!this.sim.state.adventure.started?'Collect Oren’s initial expedition kit first.':d.prerequisite&&!eligible?'First complete and claim '+esc(G.RealmTrails.definition(d.prerequisite).title)+'. That earlier claim does not accept this new commission.':'Available after the initial kit. No campaign chapter, class or allegiance is required.')+'</p><h4>Choose the arrangement at acceptance</h4>';
    html+=d.choices.map(c=>'<div class="local-life-choice"><strong>'+esc(c.name)+'</strong><p>'+esc(c.text)+'</p>'+(here&&eligible&&L.at(this.sim,d.giver)?button('Accept: '+c.name,'accept',c.id):'')+'</div>').join('');
    html+='<p>Your selected arrangement is retained for this finite job. The giver supplies its job parts; your existing inventory is unchanged.</p><ol>'+d.steps.map(s=>'<li>'+esc(s.name)+'</li>').join('')+'</ol>'+(here&&!this.sim.worldDive?button('Walk to '+d.giver.name,'walk','giver'):!here&&this.rpg.worlds?'<button data-rpg="world-select" data-id="'+d.realm+'">Read this Road of Light</button>':'');
   }else{
    html+='<p><strong>Selected arrangement:</strong> '+esc(choice.name)+' · '+esc(choice.text)+'</p>'+(L.carrying(this.sim.state,d)?'<p class="local-life-carry">Carrying the supplied job: '+esc(d.carry.name)+'. It is separate from equipment and ordinary inventory.</p>':'');
    html+='<ol class="local-life-steps">'+d.steps.map(source=>{
     const s=L.stepSite(d,source,r.choice),done=r.steps.includes(s.id),prepared=s.requires.every(id=>r.steps.includes(id));let controls='';
     if(!done&&!r.claimed&&prepared&&here){
      if(L.at(this.sim,s))controls=s.assembly?s.assembly.options.map(o=>button(o.name,'step',s.id+':'+o.id)).join(''):button(s.name,'step',s.id);
      else if(s.medium==='dry'&&!this.sim.worldDive)controls=button('Reach '+s.name,'walk',s.id);
      else controls='<p>'+esc(s.medium==='dry'?'Return through the gallery’s east water lane to the far dry landing, then press E to exit before walking.':'Use the Tide Steps visitor gallery and F / G to reach the indicated body depth. Read M for the gallery route.')+'</p>';
     }
     return'<li data-local-step="'+s.id+'" class="'+(done?'done':'')+'"><strong>'+esc(s.name)+(done?' · recorded':'')+'</strong><p>'+esc(s.text)+'</p>'+(!done&&!prepared?'<p>First: '+s.requires.map(id=>esc(d.steps.find(p=>p.id===id).name)).join(' · ')+'</p>':'')+(s.medium!=='dry'?'<p>Required body: '+(s.medium==='water'?'water':'air court')+' · foot height '+s.y.toFixed(2)+' m. Use F / G in the gallery.</p>':'')+'<div class="world-actions">'+controls+'</div></li>';
    }).join('')+'</ol>';
    if(r.claimed)html+='<p class="local-life-complete">'+esc(d.completionText)+' Selected: '+esc(choice.name)+'.</p>';
    else if(L.ready(this.sim.state,d))html+='<p><strong>Work complete · unpaid.</strong> Return to '+esc((d.returner||d.giver).name)+'.</p>'+(here&&L.at(this.sim,d.returner||d.giver)?button('Claim the declared local payment once','claim'):here&&!this.sim.worldDive?button('Return to '+(d.returner||d.giver).name,'walk','return'):here?'<p>Use the east water lane to the far dry gallery landing; press E there to exit, then return to Sahra.</p>':'');
    html+=!r.claimed?button('Track this local work','track',d.id):'';
   }
   html+='</article>';
  }
  if(!list.length)html+='<p>The living-road expedition remains Earth’s current local continuation. Read the other four commissions here.</p>'+button('Read other local commissions','all');
  return{title:'Local life',html:html+'<p>Accepted work, supplied parts, selected arrangements and unpaid completion survive reload. Reopening resumes your home checkpoint; revisit the realm to continue. Full pouches or a refused save preserve unpaid work. Nothing auto-equips or places furniture at home.</p></section>'};
 }
 tick(){
  const pending=L.definitions.filter(d=>{const r=this.sim.state.localLife.records[d.id];return r.accepted&&!r.claimed;});
  if(!this.seen.has(this.sim)){this.seen.add(this.sim);const e=this.sim.state.earthExpedition;if(pending.length&&this.rpg.quest==='story'&&!(e.story.accepted&&!e.story.claimed||e.patrol.active))this.rpg.quest='local-life';}
  const toggle=document.querySelector('.tracker-switch [data-id="local-life"]');if(toggle)toggle.hidden=!pending.length;
  if(this.rpg.quest!=='local-life')return;
  const d=pending.find(d=>d.id===this.tracked)||pending.find(d=>d.realm===W.definition(this.sim.room)?.id)||pending[0];
  if(!d){this.rpg.quest='story';return;}
  const r=this.sim.state.localLife.records[d.id],next=L.available(this.sim.state,d)[0],same=W.definition(this.sim.room)?.id===d.realm;
  document.querySelector('#tracked-chapter').textContent='LOCAL LIFE · '+W.definition(d.realm).name;
  document.querySelector('#tracked-title').textContent=d.title;
  document.querySelector('#tracked-detail').textContent=same?next?.name||'Return to '+(d.returner||d.giver).name:'Revisit '+W.definition(d.realm).name+' to resume';
  document.querySelector('#tracked-progress').textContent=r.steps.length+'/'+d.steps.length+' · '+(L.carrying(this.sim.state,d)?d.carry.name+' · ':'')+'J work · M routes';
 }
}
G.RealmLocalLifeUI={LocalLifeUI,routePoints,fee};if(typeof module!=='undefined')module.exports=G.RealmLocalLifeUI;
})(globalThis);
