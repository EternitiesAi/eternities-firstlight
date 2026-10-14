/* Local event terms, deliberate entry and saved results. This presentation
 * reads the encounter owner; it cannot create a contact or settle a score. */
(function(G){'use strict';
const R=()=>G.RealmEarthTournament,D=()=>R().definition,TAB='earth-tournament';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,attrs='')=>'<button data-rpg="tournament-'+action+'" '+attrs+'>'+esc(text)+'</button>';
function instruction(v){if(!v)return'Watch freely · amber ribbon marks the strike; the white pennant marks the reply.';
 if(v.complete)return'Finished · review and record with the steward before leaving or reloading.';
 if(v.withdrawn)return'Outside the ring · withdraw this attempt to enter again. Earlier medals remain.';
 if(v.phase==='ready')return'Take your distance · Tab selects · wait for the marked strike.';
 if(v.phase==='tell')return'Amber ribbon · Brace (3) or move sideways, inside the ring.';
 if(v.phase==='opening')return v.rounds[v.index].early?'Early reply forfeited · prepare for the next exchange.':v.rounds[v.index].reply?'Clean reply retained · wait for the next bell.':'White pennant · F for one primary reply. Let the arrow land.';
 return'Rest · recover stamina and prepare. Hold fire until the next white pennant.';
}
class TournamentUI{
 constructor(rpg){this.rpg=rpg;this.lastCue='';if(G.document){const root=G.document.createElement('section');root.id='rain-tournament-hud';root.hidden=true;root.setAttribute('aria-label','Rain exhibition');root.innerHTML='<small id="rain-phase"></small><strong id="rain-instruction" role="status" aria-live="polite"></strong><span id="rain-score"></span>'+button('Review / withdraw','open');G.document.querySelector('#rpg-hud').append(root);}}
 get sim(){return this.rpg.sim;}get record(){return this.sim.state.adventure.earthTournament;}
 context(){return R().at(this.sim)?'E · Rain exhibition steward':null;}
 interact(){if(!R().at(this.sim))return false;this.rpg.open(TAB);return true;}
 attrs(){const c=this.rpg.api.tournamentContext();return'data-owner="'+esc(c.active)+'" data-revision="'+this.sim.state.adventure.revision+'"';}
 action(el){const type=el.dataset.rpg;if(!type?.startsWith('tournament-'))return false;const act=type.slice(11);
  if(act==='open'){this.rpg.open(TAB);return true;}
  if(act==='track'){this.rpg.quest=TAB;this.rpg.tick();return true;}
  if(act==='walk'){this.rpg.close();if(this.sim.room===D().room)this.rpg.api.walkLocal(D().giver.x,D().giver.z);return true;}
  if(act==='observe'){this.rpg.close();this.rpg.api.toast('Observe the practice post freely. The demonstration grants no score or medal.');return true;}
  if(['enter','record','withdraw'].includes(act)){
   const payload={quest:D().id,expectedActive:el.dataset.owner,expectedRevision:Number(el.dataset.revision),family:el.dataset.family};
   this.rpg.close();const r=this.rpg.api.tournamentCommand(act,payload);this.rpg.api.toast(r.ok?r.text:r.error);
   if(r.ok&&act==='enter'){this.rpg.quest=TAB;this.sim.playerPath=[];this.rpg.api.focusWorld();}else this.rpg.open(TAB);
  }return true;
 }
 journal(){const q=this.record;return'<section class="earth-invitation"><small>EARTH · A LOCAL SKILL EVENT</small><h3>'+D().name+'</h3><p>The rain has passed. A chalk ring and an old practice post wait on Hearthwater’s north common. Three exchanges; a personal distinction earned by timing.</p><p>Best blade '+(q.best.blade??'—')+'/6 · best bow '+(q.best.bow??'—')+'/6. No entry fee; no item or currency payout.</p>'+button('Read the rules and results','open')+'</section>';}
 page(tab){if(tab!==TAB)return null;const a=this.sim.state.adventure,q=this.record,v=R().view(this.sim),w=G.RealmArsenal.weapon(a),d=D(),near=R().at(this.sim),pending=q.issued>q.closed;
  let html='<article class="rain-reading earth-reading"><small>HEARTHWATER · NORTH COMMON</small><h2>'+d.name+'</h2><p class="earth-quote">“A good reply begins with listening. Let the ribbon fall, then show us your answer.”</p><p>A judged exhibition against the mechanical practice post. Take Oren’s initial expedition kit to compete. No campaign chapter, profession or class is required. You may observe without entering. These are personal records; no online rivals are simulated.</p><section class="rain-terms"><h3>Before you enter</h3><ul>'+d.terms.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul><p><strong>Controls:</strong> Tab selects; F strikes once; 3 braces; movement or Space avoids the ribbon. 1 toggles stationary autoattack. Click selection also starts autoattack; switch it off before waiting for the reply. E speaks to the steward. V switches either camera. Menus and P pause the event.</p><p>Blade: 2.65m reach, 0.52s recovery, no primary stamina cost. Bow: 11m reach, 0.75s recovery, 6 stamina per arrow. Within this small ring, move within reach before the opening. Brace costs 20 stamina, lasts 3s and recovers in 8s.</p><p><strong>Equipped:</strong> '+esc(G.RealmAdventure.GEAR[a.equipment.weapon]?.name||'No weapon')+' · '+w.style+' · '+w.reach+'m · '+w.cooldown+'s · '+w.stamina+' stamina. Your item stays yours, including its socket and fittings; weapon damage never buys points.</p></section>';
  html+='<table class="guide-comparison"><caption>Three exchanges · six possible points</caption><thead><tr><th>Exchange</th><th>Ready</th><th>Amber warning</th><th>White opening</th><th>Rest</th></tr></thead><tbody>'+d.rounds.map(r=>'<tr><th>'+esc(r.name)+'</th><td>'+r.ready+'s</td><td>'+r.tell+'s</td><td>'+r.opening+'s</td><td>'+r.rest+'s</td></tr>').join('')+'</tbody></table><p>Bronze at 2, silver at 4, gold at 6. Each is recorded once per weapon family. Replay for practice or a better result; no repeat payout.</p>';
  if(v){html+='<section class="rain-result"><h3>'+esc(v.complete?'Exhibition complete':v.withdrawn?'Attempt interrupted':'Exhibition in progress')+' · '+v.score+'/6</h3><p>'+esc(instruction(v))+'</p><ol>'+v.rounds.map(r=>'<li>'+esc(d.rounds.find(x=>x.id===r.id).name)+' · defense '+(r.defense===null?'pending':r.defense?'sound':'missed')+' · reply '+(r.early?'early':r.reply?'clean':'not scored')+'</li>').join('')+'</ol>';
   if(v.complete&&near)html+=button('Record this result','record',this.attrs());html+='</section>';}
  else if(pending)html+='<p class="rain-result">An interrupted attempt has no live scoring proof. Withdraw it to enter again. Recorded medals and ordinary belongings remain; an unrecorded result cannot be recovered.</p>';
  if(pending)html+=button('Withdraw this attempt · keep earlier results','withdraw',this.attrs());
  else if(!a.started)html+='<p>Take Oren’s initial expedition kit at the Firstlight workshop. No campaign chapter or class is required.</p>';
  else if(near)html+=button('Enter with equipped '+w.style+' · no fee','enter',this.attrs()+' data-family="'+w.style+'"');
  if(near&&!pending)html+=button('Observe without entering','observe');
  html+='<section class="rain-records"><h3>Your retained distinctions</h3>'+['blade','bow'].map(f=>'<p><strong>'+f+'</strong> · '+q.finished[f]+' recorded · best '+(q.best[f]??'—')+'/6 · '+(d.medals.filter(m=>q.best[f]!==null&&q.best[f]>=m.score).map(m=>m.name).join(', ')||'no medals yet')+'</p>').join('')+'</section><p>Cross Hearthwater’s lake bridge. Follow either the western orchard lane or eastern quarry road onto the north common. The ring stands beside their meeting, south of Bellweather’s road.</p>';
  if(!near)html+=this.sim.room===d.room?button('Walk to the steward','walk'):'<button data-rpg="open" data-id="earth">Read the Hearthwater route</button>';
  html+=button('Track the exhibition','track');return{title:d.name,html:html+'</article>'};
 }
 tick(){const doc=G.document;if(!doc)return;const v=R().view(this.sim),root=doc.querySelector('#rain-tournament-hud'),toggle=doc.querySelector('.tracker-switch [data-id="earth-tournament"]');if(toggle)toggle.hidden=!this.sim.state.adventure.started;
  if(root){root.hidden=!v;root.dataset.phase=v?.phase||'';if(v){doc.querySelector('#rain-phase').textContent=v.complete?'THREE EXCHANGES FINISHED':v.withdrawn?'ATTEMPT INTERRUPTED':'EXCHANGE '+(v.index+1)+' / 3 · '+v.phase.toUpperCase()+' · '+v.remaining.toFixed(1)+'s';
   const cue=instruction(v);if(cue!==this.lastCue){doc.querySelector('#rain-instruction').textContent=cue;this.lastCue=cue;}doc.querySelector('#rain-score').textContent=v.score+' / 6 points · '+v.family;}}
  if(R().fighting(this.sim)){for(const id of ['special','insight','spirit','heal','class']){const e=doc.querySelector('#skill-'+id);if(e){e.disabled=true;e.title='Not admitted in the rain exhibition; withdraw to use this power.';}}doc.querySelector('#combat-help').textContent='TAB selects · F primary reply · 3 Brace · move clear · 1 autoattack on/off';}
  if(this.rpg.quest===TAB){for(const[sel,text]of Object.entries({'#tracked-chapter':'EARTH · THE NORTH COMMON','#tracked-title':D().name,'#tracked-detail':v?instruction(v):'Hearthwater north common · read the steward’s terms','#tracked-progress':v?v.score+'/6 · J to review':'Blade '+(this.record.best.blade??'—')+'/6 · bow '+(this.record.best.bow??'—')+'/6 · J to review'})){const e=doc.querySelector(sel);if(e)e.textContent=text;}}
 }
}
G.RealmEarthTournamentUI={TournamentUI,instruction};if(typeof module!=='undefined')module.exports=G.RealmEarthTournamentUI;
})(globalThis);
