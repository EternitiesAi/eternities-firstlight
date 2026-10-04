/* One readable episode; UI previews and walking never record work. */
(function(G){'use strict';const B=G.RealmBridgeCommunity;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(s,a,id='')=>'<button data-rpg="community-'+a+'" data-id="'+esc(id)+'">'+esc(s)+'</button>';
function routePoints(sim){return sim.room===B.definition.room&&sim.state.bridgeCommunity.accepted&&!sim.state.bridgeCommunity.claimed?B.next(sim.state).map((p,i)=>({...p,community:true,medium:'dry',mark:'B'+(i+1)})):[];}
function legend(sim){const points=routePoints(sim);return points.length?'<section class="community-map"><h3>A place beside the road</h3><p>Blue B rings show this separate accepted community episode. The timber bridge and existing woodland roads connect both banks.</p>'+points.map(p=>'<p><strong>'+p.mark+'</strong> · '+esc(p.name)+' '+button('Walk near this work','walk',p.id)+'</p>').join('')+button('Read the work and exact fee','open')+'</section>':'';}
class BridgeCommunityUI{
 constructor(rpg){this.rpg=rpg;this.seen=new WeakSet();}
 get sim(){return this.rpg.sim;}
 invitation(){const r=this.sim.state.bridgeCommunity;return'<section class="community-invitation"><small>A LASTING PLACE · SEPARATE ONCE-ONLY EPISODE</small><h3>'+esc(B.definition.title)+'</h3><p>'+(r.claimed?'Merren remembers your '+(r.choice==='shelter'?'sheltered sorting bench':'river observation stand')+'. The road worker continues using it.':'Cross to Vessa for supplied fittings, then choose a sheltered sorting bench or a river observation stand. The existing woodland expedition remains available.')+'</p>'+button(r.accepted?'Read your saved community work':'Read the choices, route and fee','open')+'</section>';}
 point(){return this.rpg.quest==='community'?routePoints(this.sim).find(p=>B.at(this.sim,p)):null;}
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){if(!this.point())return false;this.rpg.open('community');return true;}
 action(el){const a=el.dataset.rpg;if(!a?.startsWith('community-'))return false;const type=a.slice(10),id=el.dataset.id;
  if(type==='open'){this.rpg.open('community');return true;}
  if(type==='walk'){
   const p=id==='giver'?B.definition.giver:B.next(this.sim.state).find(p=>p.id===id);if(!p||this.sim.room!==B.definition.room){this.rpg.api.toast('Visit Coastward Road and read the current route.');return true;}
   const near=G.RealmTrailsUI.approach(this.sim,p);this.rpg.close();this.rpg.api.walkLocal(near.x,near.z);return true;
  }
  if(type==='track'){this.rpg.quest='community';this.rpg.paint();return true;}
  const payload={expectedRevision:Number(el.dataset.revision),quest:B.definition.id};
  if(type==='fit'){const [choice,assembly]=id.split(':');Object.assign(payload,{choice,assembly});}
  if(['accept','fittings','fit','inspect','claim'].includes(type)){
   const r=this.rpg.api.bridgeCommunityCommand(type,payload);this.rpg.api.toast(r.text||r.error);if(r.ok&&!r.duplicate)this.rpg.quest='community';this.rpg.paint();
  }
  return true;
 }
 page(tab){if(tab!=='community')return null;const sim=this.sim,r=sim.state.bridgeCommunity,here=sim.room===B.definition.room;
  const act=(label,type,id='')=>button(label,type,id).replace('<button ','<button data-revision="'+sim.state.adventure.revision+'" ');
  let html='<article class="community-page"><small>COASTWARD · AN ORDINARY PLACE THAT LASTS</small><h2>'+esc(B.definition.title)+'</h2><p>Merren needs a dependable place for roadside work. Vessa has a labelled set of braces and ties across the channel. Bring them back and choose where they help.</p><div class="community-terms"><strong>Exact once-only fee: 10 sunmarks · 2 timber · 4 meadow fibre</strong><p>No XP or ore. Supplied fittings cost no ordinary inventory and occupy no equipment slot. Stronger equipped weapons stay stronger; this work offers materials, a community arrangement and an optional home design.</p></div><p><strong>Route:</strong> settlement → existing woodland lane → long timber bridge → Vessa → chosen site → Merren. Optional creatures and the separate living-road expedition keep their own rules. Both cameras and free home return remain available.</p>';
  html+='<div class="community-options"><section><h3>Sheltered sorting bench</h3><p>A fitted canopy over the settlement’s existing bench. The road worker sorts and checks fittings beside the sheltered place.</p></section><section><h3>River observation stand</h3><p>A fitted board on the existing shore overlook. The road worker makes river readings from safe, supported ground.</p></section></div>';
  if(!here)html+='<p>Reopening resumes your home checkpoint. Revisit Coastward Road to continue this saved episode.</p><button data-rpg="world-select" data-id="earthlands">Read Coastward travel</button>';
  if(!r.accepted){html+='<p>Available after Oren’s initial kit. No campaign chapter, class or previous local reward is required.</p>'+(here&&B.at(sim,B.definition.giver)&&sim.state.adventure.started?act('Accept Merren’s community episode','accept'):here?button('Walk to Merren','walk','giver'):'');}
  else if(r.claimed){html+='<p class="community-recognition">Merren: “'+(r.choice==='shelter'?'You gave ordinary work a dry place to land.':'You gave us a place to read the river before setting out.')+'”</p><p>Vessa recognizes the matching fittings and your chosen arrangement. Payment was claimed once. Your worker and fixture remain; the crossing route-board design is learned.</p><button data-rpg="panel" data-id="retreat">Inspect the learned home route-board</button><button data-rpg="open" data-id="pursuit">Inspect your equipment project</button>';}
  else{
   html+='<p><strong>Saved progress:</strong> '+r.steps.length+' / 3 physical actions'+(r.choice?' · '+esc(B.definition.sites[r.choice].name):' · allocation remains your choice')+'.</p>'+(r.steps.includes('fittings')&&!r.steps.includes('fit')?'<p class="community-cargo">Carrying Vessa’s labelled braces and ties. These are supplied job parts.</p>':'');
   for(const p of B.next(sim.state)){
    html+='<section class="community-next"><h3>'+esc(p.name)+'</h3>';
    if(here&&B.at(sim,p)){
     if(p.id.startsWith('fit-'))html+='<p>The unequal braces must match their sockets. Fitting records this selected arrangement permanently for this episode.</p>'+act('Match braces and fit this arrangement','fit',p.choice+':matched')+act('Try crossed braces','fit',p.choice+':crossed');
     else html+=act(p.id==='claim'?'Claim the whole declared fee once':p.id==='inspect'?'Inspect the seated braces and working place':'Receive the labelled job fittings',p.id);
    }else if(here)html+=button('Walk near this work','walk',p.id);
    html+='</section>';
   }
   html+=button('Track this episode','track');
  }
  html+='<p>Completed unpaid work survives capacity or save refusal. Retry after making room. Your old equipment, sockets, XP and story histories are retained. Nothing is auto-equipped or placed at home.</p></article>';
  return{title:B.definition.title,html};
 }
 tick(){const r=this.sim.state.bridgeCommunity,toggle=document.querySelector('.tracker-switch [data-id="community"]');if(toggle)toggle.hidden=!r.accepted||r.claimed;
  if(!this.seen.has(this.sim)){this.seen.add(this.sim);if(r.accepted&&!r.claimed&&this.rpg.quest==='story')this.rpg.quest='community';}
  if(this.rpg.quest!=='community')return;if(r.claimed){this.rpg.quest='story';return;}
  const next=B.next(this.sim.state)[0];document.querySelector('#tracked-chapter').textContent='COASTWARD COMMUNITY';document.querySelector('#tracked-title').textContent=B.definition.title;document.querySelector('#tracked-detail').textContent=this.sim.room===B.definition.room?next?.name||'Read the episode':'Revisit Coastward Road · saved work retained';document.querySelector('#tracked-progress').textContent=r.steps.length+' / 3 · '+(r.steps.includes('inspect')?'completed, unpaid':'10 sunmarks + materials');
 }
}
G.RealmBridgeCommunityUI={BridgeCommunityUI,routePoints,legend};if(typeof module!=='undefined')module.exports=G.RealmBridgeCommunityUI;
})(globalThis);
