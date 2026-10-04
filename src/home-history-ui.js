/* Readable home projects over the existing room and workbench. Sketches are
 * explicitly plans; the placed model is rendered by the real world engine. */
(function(G){'use strict';
const H=G.RealmHomeHistory,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,id='',disabled=false)=>'<button data-action="memory-'+action+'" data-id="'+id+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';
const commission=d=>d.source==='bridgeCommunity'?G.RealmBridgeCommunity.definition:G.RealmLocalLife.definition(d.quest);
function sketch(d){const shapes={
 'memory-crossing':'<path d="M43 101V44m74 57V44M37 29h86v57H37z" fill="#ab9270" stroke="#6e6d53" stroke-width="5"/><path d="M49 39h62v36H49z" fill="#ded2aa"/><path d="M53 48q18 27 40 9t12 9" fill="none" stroke="#72938a" stroke-width="5"/><path d="M72 46v24m8-24v24" stroke="#796548" stroke-width="3"/>' ,
 'memory-cuttings':'<path d="M30 75h100l-8 23H38z" fill="#b79b70"/><path d="M42 77h77" stroke="#504e3b" stroke-width="7"/><path d="M57 77V47m23 30V38m23 39V47" stroke="#739568" stroke-width="4"/><ellipse cx="51" cy="52" rx="12" ry="5"/><ellipse cx="85" cy="45" rx="12" ry="5"/><ellipse cx="106" cy="56" rx="12" ry="5"/>',
 'memory-refuge':'<ellipse cx="80" cy="94" rx="25" ry="9" fill="#7b7c70"/><path d="M55 88V53h50v35M64 53V32h32v21" fill="none" stroke="#b3936a" stroke-width="6"/><path d="M80 82c-20-10-10-20 0-29 5 13 19 23 0 29" fill="#e2ad67"/>',
 'memory-bellglass':'<ellipse cx="80" cy="99" rx="27" ry="8" fill="#b39167"/><path d="M80 95V67M62 66V28m36 38V28" stroke="#bd996f" stroke-width="5"/><path d="M80 32l11 17-11 17-11-17z"/><path d="M54 28l26-16 26 16z" fill="#557d7b"/>',
 'memory-farroad':'<path d="M40 89V61m80 28V61M35 55l84-9 9 24-84 10z" fill="#ba9d73" stroke="#7e725c" stroke-width="5"/><path d="M53 57l48-6 7 15-48 6z" fill="#dfd2ae"/><path d="M79 53l6 17" stroke="#8f7bab" stroke-width="3"/> '
 };return'<svg viewBox="0 0 160 120" role="img" aria-label="Design sketch of '+esc(d.name)+'" style="color:'+d.color+';fill:currentColor"><ellipse cx="80" cy="105" rx="53" ry="5" fill="#182625" opacity=".3"/>'+shapes[d.id]+'</svg>';}
function teaser(state){const d=H.definition(state.homeHistory.pinned),made=state.homeHistory.owned.length;return'<section class="home-memory-teaser"><small>A HOME THAT REMEMBERS</small><h3>'+(d?'Pinned home project: '+esc(d.name):'Bring a journey home')+'</h3><p>'+(d?(state.homeHistory.owned.includes(d.id)?'Made once. Choose where it belongs in your retreat.':H.unlocked(state,d)?'Design learned. Check materials, craft at an outdoor workbench, then choose its place.':'Read and claim '+esc(commission(d).title)+' to learn this design.'):H.definitions.length+' finite objects connect local work to your room. '+made+' of '+H.definitions.length+' made.')+'</p><button data-rpg="panel" data-id="retreat">Read home designs and arrange your room</button></section>';}
class Workspace{
 constructor(experience,hooks){this.e=experience;this.h=hooks;this.pending=null;}
 get sim(){return this.e.sim;}
 render(){if(this.pending&&this.pending.owner!==this.sim)this.pending=null;const state=this.sim.state,ledger=state.homeHistory;
  return'<section class="home-memories" aria-label="A Home That Remembers"><small>MAKE A PLACE FOR THE JOURNEY</small><h2>A Home That Remembers</h2><p>Claim local work, learn its design, then spend the exact materials once at an outdoor workbench. You own one of each. Choose where it belongs; nothing auto-places or replaces furniture. Removing it keeps the piece for another arrangement.</p><div class="row">'+button('Walk to the outdoor workbench','bench')+(ledger.pinned?button('Unpin home project','pin'):'')+'</div><div class="home-memory-grid">'+H.definitions.map(d=>{
   const made=ledger.owned.includes(d.id),learned=H.unlocked(state,d),placed=state.retreat.items.find(i=>i.kind===d.id),bench=!this.sim.room&&G.RealmSandbox.station(state.sandbox,state.player),enough=G.RealmSandbox.checkCost(state.sandbox,d.cost),q=commission(d);
   return'<article class="home-memory-card" data-home-kind="'+d.id+'">'+sketch(d)+'<small>DESIGN SKETCH · '+esc(d.realm.toUpperCase())+'</small><h3>'+esc(d.name)+'</h3><p>'+esc(d.description)+'</p><strong>'+(made?'MADE ONCE'+(placed?' · '+esc(G.RealmCreative.SLOTS.find(s=>s.id===placed.slot).label):' · ready to place'):learned?'DESIGN LEARNED':'CLAIM THIS COMMISSION TO LEARN')+'</strong><p>'+esc(q.title)+'</p><div class="home-memory-cost">'+Object.entries(d.cost).map(([k,n])=>'<span class="'+(state.sandbox.inventory[k]>=n?'met':'missing')+'">'+esc(G.RealmSandbox.ITEMS[k].name)+': '+state.sandbox.inventory[k]+' → '+(made?state.sandbox.inventory[k]:Math.max(0,state.sandbox.inventory[k]-n))+' <small>(cost '+n+')</small></span>').join('')+'</div><p>'+(made?'Further placement and removal cost nothing; no raw materials are refunded.':!enough?'Missing materials must be gathered. No partial payment.':!bench?'Materials ready. Walk to the outdoor workbench to make it.':'Materials and workbench ready. Making does not place the object.')+'</p><div class="row">'+button(ledger.pinned===d.id?'Pinned home project':'Pin this home project','pin',d.id)+button('Read the local commission','commission',d.realm)+(made?'':button('Make '+d.name+' once','craft',d.id,!learned||!enough||!bench||this.sim.paused))+'</div>'+(!made?'<div class="row">'+Object.keys(d.cost).filter(k=>state.sandbox.inventory[k]<d.cost[k]).map(k=>button('Find '+G.RealmSandbox.ITEMS[k].name,'gather',k)).join('')+'</div>':'')+'</article>';
  }).join('')+'</div>'+this.confirmation()+'</section>';
 }
 furniture(k,f,item){const made=H.definition(k),existing=this.sim.state.retreat.items.find(i=>i.kind===k);if(made&&!this.sim.state.homeHistory.owned.includes(k))return'';
  return'<button data-action="'+(made?'memory-propose':'furnish')+'" '+(made?'data-id':'data-kind')+'="'+k+'" aria-pressed="'+(item?.kind===k)+'">'+this.e.icon(k)+' <span>'+(made&&existing&&existing.slot!==this.e.selectedSlot?'Move '+f.name:f.name)+'</span></button>';
 }
 confirmation(){const p=this.pending;if(!p)return'';const d=H.definition(p.kind),h=this.sim.state.retreat,old=h.items.find(i=>i.slot===p.slot),from=h.items.find(i=>i.kind===p.kind),target=G.RealmCreative.SLOTS.find(s=>s.id===p.slot);
  return'<section class="home-placement-confirm" role="status"><h3>Place '+esc(d.name)+' · '+esc(target.label)+'</h3><p>'+(from?'Move your one existing piece from '+esc(G.RealmCreative.SLOTS.find(s=>s.id===from.slot).label)+'. ':'Place your owned piece. ')+(old&&old.kind!==p.kind?'This replaces '+esc(G.RealmCreative.FURNITURE[old.kind].name)+' at that position. It remains available to place again. ':'The position is '+(old?'already holding this piece':'empty')+'. ')+'Costs nothing. Your doorway and current body position are checked before saving.</p><div class="row">'+button('Confirm this arrangement','place')+button('Cancel placement','cancel')+'</div></section>';
 }
 action(b){if(!b.dataset.action?.startsWith('memory-'))return false;const action=b.dataset.action.slice(7),id=b.dataset.id,ledger=this.sim.state.homeHistory;
  if(action==='bench'){this.h.navigate('market');this.h.closePanel();return true;}
  if(action==='commission'){this.h.openCommission(id);return true;}
  if(action==='gather'){this.h.seekMaterial(id);return true;}
  if(action==='propose'){if(H.definition(id)&&ledger.owned.includes(id))this.pending={owner:this.sim,kind:id,slot:this.e.selectedSlot,revision:this.sim.state.retreat.revision};this.h.renderPanel();document.querySelector('.home-placement-confirm')?.scrollIntoView({block:'center'});return true;}
  if(action==='cancel'){this.pending=null;this.h.renderPanel();return true;}
  if(action==='place'){
   const p=this.pending;if(!p)return true;if(p.owner!==this.sim){this.pending=null;this.h.toast('The character changed. Choose this character’s arrangement again.');this.h.renderPanel();return true;}const home=G.RealmCreative.clone(this.sim.state.retreat),item=home.items.find(i=>i.kind===p.kind);home.items=home.items.filter(i=>i.slot!==p.slot&&i.kind!==p.kind);home.items.push({slot:p.slot,kind:p.kind,rotation:item?.rotation||0});
   const r=this.h.homeCommand('decorate',{home,expectedRevision:p.revision});this.h.toast(r.text||r.error);if(r.ok){this.pending=null;this.h.redrawRoom();}this.h.renderPanel();return true;
  }
  if(action==='pin'||action==='craft'){const r=this.h.homeCommand(action,{kind:id||null,expectedRevision:ledger.revision});this.h.toast(r.text||r.error);this.h.renderPanel();return true;}
  return true;
 }
}
const api={Workspace,sketch,teaser};G.RealmHomeHistoryUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
