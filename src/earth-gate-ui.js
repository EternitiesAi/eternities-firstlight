/* Gate journal and local controls. Reading never leads, spends or claims. */
(function(G){'use strict';
const R=()=>G.RealmEarthGate,D=()=>R().definition,TAB='earth-gate';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,type,id='',attrs='')=>'<button data-rpg="gate-'+type+'" data-id="'+esc(id)+'" '+attrs+'>'+esc(text)+'</button>';
const names={'camp':'South meadow camp','orchard-turn':'Orchard turn','west-track':'West track','shelter-west':'West of the shelter','shelter-north':'North of the shelter','inspection-point':'Staffed inspection point','shelter-approach':'Shelter approach','shelter-door':'Shelter entrance','shelter-inside':'Inside the shelter'};
class GateUI{
 constructor(rpg){this.rpg=rpg;}
 get sim(){return this.rpg.sim;}get state(){return this.sim.state.adventure.earthGate;}
 status(){return this.rpg.api.gateStatus();}
 attrs(){const c=this.rpg.api.gateContext();return'data-owner="'+esc(c.active)+'" data-revision="'+this.sim.state.adventure.revision+'"';}
 act(text,type,id=''){return btn(text,type,id,this.attrs());}
 local(){if(!R().eligible(this.sim.state))return null;if(R().at(this.sim,D().giver))return D().giver;
  if(!this.state.accepted)return null;const v=this.status().view,p=v?.actors[1];
  if(p&&R().at(this.sim,{...p,room:D().room}))return{name:'The three travellers'};
  return this.rpg.quest===TAB?D().evidence.find(p=>R().at(this.sim,p))||null:null;
 }
 context(){const p=this.local();return p?'E · '+p.name:null;}
 interact(){if(!this.local())return false;this.rpg.open(TAB);return true;}
 target(id){if(id==='giver')return D().giver;if(id==='group'){const a=this.status().view?.actors[1];return a?{...a,room:D().room,name:'the waiting group'}:{room:D().room,x:-6,z:6,name:'the south meadow camp'};}
  if(id==='prepare')return this.state.plan?{...D().plans[this.state.plan].prepare,name:'the preparation site'}:null;
  return D().evidence.find(p=>p.id===id)||null;
 }
 travel(id){const p=this.target(id);if(!p)return'';return this.sim.room===D().room?btn('Walk to '+p.name,'walk',id):'<p>Enter Hearthwater from Firstlight’s lake, cross the long bridge, then follow the west orchard track to the north common.</p><button data-rpg="open" data-id="earth">Read the Hearthwater route</button>';}
 action(el){const a=el.dataset.rpg;if(!a?.startsWith('gate-'))return false;const type=a.slice(5),id=el.dataset.id;
  if(type==='open'){this.rpg.open(TAB);return true;}
  if(type==='track'){this.rpg.quest=TAB;this.rpg.tick();return true;}
  if(type==='walk'){const p=this.target(id);if(p&&this.sim.room===p.room){this.rpg.close();this.rpg.api.walkLocal(p.x,p.z);}return true;}
  const payload={quest:D().id,expectedActive:el.dataset.owner,expectedRevision:Number(el.dataset.revision)};
  if(type==='read')payload.evidence=id;if(type==='choose')payload.plan=id;
  if(!['accept','read','choose','prepare','claim','lead','wait','retry'].includes(type))return true;
  // Close the journal before asking the living simulation to act. Captured
  // owner/revision still fences durable commands against a stale panel.
  const ctx=this.rpg.api.gateContext();if(payload.expectedActive!==ctx.active||payload.expectedRevision!==this.sim.state.adventure.revision){this.rpg.api.toast('The character or record changed. Read the current action again.');this.rpg.paint();return true;}
  this.rpg.close();const control=['lead','wait','retry'].includes(type),r=control?this.rpg.api.gateControl(type):this.rpg.api.gateCommand(type,payload);
  this.rpg.api.toast(r.ok?r.text:r.error);if(r.ok)this.rpg.quest=TAB;
  if(type!=='lead'||!r.ok)this.rpg.open(TAB);return true;
 }
 journal(){const q=this.state;return'<section class="earth-invitation"><small>HEARTHWATER · PEOPLE ON THE ROAD</small><h3>'+esc(D().title)+'</h3><p>'+esc(q.claimed?'Three travellers have a recorded place. The captain’s fee is paid.':q.outcome?'All three arrived. Return to the captain for the fee.':q.accepted?'Investigate, prepare a safe destination, then lead the three travellers.':D().summary)+'</p>'+btn('Read the captain’s request','open')+'</section>';}
 page(tab){if(tab!==TAB)return null;const d=D(),q=this.state,inv=this.sim.state.sandbox.inventory,s=this.status(),v=s.view;
  let html='<article class="earth-reading gate-reading"><small>HEARTHWATER · THE GATE CAPTAIN</small><h2>'+esc(d.title)+'</h2><p class="earth-quote">“I cannot ignore the duplicate seal. I cannot leave people in the weather while I check it, either.”</p><p>'+esc(d.summary)+'</p><p>'+esc(d.uncertainty)+'</p><section class="gate-offer"><h3>Know the terms before accepting</h3><p>Read the register, the cart’s waybill and the old shelter screen. Both destinations use the same nearby orchard route. No combat or main-story progress is required.</p><p><strong>Either outcome: 8 sunmarks and up to 15 XP, once.</strong> XP stops at the existing 9,999 cap. The fee waits if your coin pouch cannot hold all eight.</p><p><strong>Inspection lane:</strong> no material cost. <strong>Temporary shelter:</strong> exactly 4 timber + 2 fibre, spent only when you explicitly repair the screen. You have '+inv.wood+' timber and '+inv.fiber+' fibre.</p></section>';
  if(!this.sim.state.adventure.started)html+='<p>Collect the initial expedition kit from Oren first.</p>';
  else if(!q.accepted)html+=R().at(this.sim,d.giver)?this.act('Accept the captain’s request · no cost','accept'):this.travel('giver');
  else{
   html+='<ol class="gate-evidence">'+d.evidence.map(p=>'<li data-gate-evidence="'+p.id+'"><h3>'+esc(p.name)+(q.evidence.includes(p.id)?' · read':'')+'</h3><p>'+esc(q.evidence.includes(p.id)?p.text:'Inspect this in person before choosing a destination.')+'</p>'+(q.evidence.includes(p.id)?'':R().at(this.sim,p)?this.act('Inspect '+p.name,'read',p.id):this.travel(p.id))+'</li>').join('')+'</ol>';
   if(q.evidence.length===3&&!q.prepared)html+='<section><h3>Choose where they can safely wait</h3>'+Object.values(d.plans).map(p=>'<div class="gate-plan"><h4>'+esc(p.name)+(q.plan===p.id?' · selected':'')+'</h4><p>'+esc(p.text)+'</p>'+this.act(q.plan===p.id?'Keep this plan':'Select this plan','choose',p.id)+'</div>').join('')+'<p>Selection spends nothing and can change until preparation.</p>'+(q.plan?(R().at(this.sim,d.plans[q.plan].prepare)?this.act(q.plan==='temporary-shelter'?'Confirm repair · spend 4 timber + 2 fibre':'Prepare the lane · no cost','prepare'):this.travel('prepare')):'')+'</section>';
   if(q.prepared&&!q.outcome){html+='<section class="gate-live"><h3>Lead all three travellers</h3><p>Destination: '+esc(d.plans[q.plan].name)+'. Recorded checkpoint: '+esc(names[q.checkpoint])+'.</p><p>Stay within ten metres. The group waits if you get too far ahead; walking back lets them continue. Menus pause the escort. Reload restores the last recorded checkpoint, ready for you to lead again.</p>';
    if(s.error)html+='<p role="alert">The group reached its stop, but it was not saved: '+esc(s.error)+'</p>'+this.act('Retry saving this reached checkpoint','retry');
    else if(v)html+='<p role="status">'+esc(v.status==='waiting-far'?'Waiting for you to return.':v.leading?'Following · next stop: '+names[v.next]:'Waiting for you to lead from '+names[q.checkpoint])+ '</p>'+(v.leading?this.act('Wait here','wait'):this.act('Lead / resume beside the group','lead'));
    html+=this.travel('group')+'</section>';
   }
   if(q.outcome)html+='<section class="gate-outcome"><h3>'+ (q.outcome==='admitted'?'Three travellers admitted at the inspection point':'Three travellers sheltered')+'</h3><p>'+esc(q.outcome==='admitted'?'The captain has received all three at the staffed lane. The unresolved seal remains in the register.':'All three are inside the repaired shelter. Their later admission is still undecided.')+'</p><p>“They have somewhere safe while the paperwork is checked. Thank you for staying with them.”</p>'+(q.claimed?'<p><strong>The agreed fee is paid. This group has no second payout.</strong></p>':R().at(this.sim,d.giver)?this.act('Claim 8 sunmarks + up to 15 XP','claim'):this.travel('giver'))+'</section>';
   html+=btn('Track the Gate Captain outing','track');
  }
  return{title:d.title,html:html+'<p class="fineprint">V switches between your camera views. Walking and reading never spend supplies or collect the fee.</p></article>'};
 }
 tick(){const doc=G.document,q=this.state,e=doc?.querySelector('.tracker-switch [data-id="earth-gate"]');if(e)e.hidden=!q.accepted;if(this.rpg.quest!==TAB)return;const s=this.status(),v=s.view;
  const detail=s.error?'Checkpoint save refused · J to retry':q.claimed?'Group safe · fee paid':q.outcome?'Return to the captain for your fee':!q.prepared?q.evidence.length<3?'Inspect register, waybill and shelter':'Choose and prepare the destination':v?.status==='waiting-far'?'Return to the waiting travellers':v?.leading?'Walk together · next: '+names[v.next]:'Meet the group at '+names[q.checkpoint]+' · E to lead';
  for(const[sel,text]of Object.entries({'#tracked-chapter':'EARTH · THE GATE CAPTAIN','#tracked-title':D().title,'#tracked-detail':detail,'#tracked-progress':q.prepared?'Three travellers · J journal · M routes':q.evidence.length+'/3 records · J journal · M routes'})){const el=doc?.querySelector(sel);if(el)el.textContent=text;}
 }
}
G.RealmEarthGateUI={GateUI};if(typeof module!=='undefined')module.exports=G.RealmEarthGateUI;
})(globalThis);
