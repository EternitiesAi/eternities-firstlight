/* A local expedition interface. Every fact and payment belongs to its rules. */
(function(G){'use strict';
const E=G.RealmEarthExpedition,W=G.RealmWorldFoundations,A=G.RealmAdventure,ROOM='world-earthlands';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,id='',extra='')=>'<button data-rpg="expedition-'+action+'" data-id="'+esc(id)+'" '+extra+'>'+esc(label)+'</button>';
const fee=r=>r.xp+' XP · '+r.coins+' sunmarks · '+r.ore+' ore'+Object.entries(r.materials||{}).map(([id,n])=>' · '+n+' '+({wood:'timber',fiber:'fibre'}[id]||id)).join('');
const format=n=>Number.isInteger(n)?String(n):Number(n).toFixed(2);
function xpNote(a,reward){const n=Math.min(reward.xp,9999-a.xp);return n===reward.xp?'':n===0?'<p>Your experience is full; this payment adds 0 XP. Its sunmarks and materials stay the same.</p>':'<p>At your current experience, this payment can add '+n+' of its '+reward.xp+' XP. Its sunmarks and materials stay the same.</p>';}
function comparison(a,id,kind){
 const equipped=A.stats(a),selected={...a,equipment:{...a.equipment,weapon:id}},before=A.stats(selected),after=A.stats({...selected,earthBinding:{version:1,weapon:id,kind}});
 const weapon=G.RealmArsenal.weapon(selected);
 return{equipped,before,after,weapon};
}
function at(sim,p){return sim.room===ROOM&&!sim.worldDive&&sim.state.adventure.hp>0&&Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)<=2.8&&W.walkable(sim.room,sim.state.player.x,sim.state.player.z)&&W.segment(sim.room,sim.state.player,p,.04);}
function routePoints(sim){
 if(sim.room!==ROOM)return[];
 const p=E.progress(sim),active=p.patrol.active?p.patrol:p.story;
 if(!active.accepted&&!p.patrol.active)return[];
 if(active.claimed)return[];
 if(active.ready)return[{...E.definition.giver,name:'Return to '+E.definition.giver.name,kind:'giver',quest:p.patrol.active?E.patrol.id:E.definition.id,run:p.patrol.active?.run??null,mark:'A'}];
 return active.next.flatMap(s=>s.choices?s.choices.map(c=>({...c,step:s.id,kind:'interact',quest:E.definition.id})): [{...s,step:s.id,quest:p.patrol.active?E.patrol.id:E.definition.id,run:p.patrol.active?.run??null}]).map((p,i)=>({...p,mark:String.fromCharCode(65+i)}));
}
class ExpeditionUI{
 constructor(rpg){this.rpg=rpg;this.pending=null;this.reading=null;this.owner=null;}
 get sim(){return this.rpg.sim;}
 reset(){this.pending=null;this.reading=null;}
 point(){
  if(this.sim.room!==ROOM)return null;
  return[...E.points(this.sim),{...E.definition.giver,kind:'giver'}].filter(p=>at(this.sim,p)).sort((a,b)=>Math.hypot(a.x-this.sim.state.player.x,a.z-this.sim.state.player.z)-Math.hypot(b.x-this.sim.state.player.x,b.z-this.sim.state.player.z))[0]||null;
 }
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){const p=this.point();if(!p)return false;this.reading=p.id;this.rpg.open('expedition');return true;}
 action(el){
  const action=el.dataset.rpg;if(!action?.startsWith('expedition-'))return false;
  const type=action.slice(11),id=el.dataset.id;
  if(type==='open'){this.rpg.open('expedition');return true;}
  if(type==='walk'){
   const points=[{...E.definition.giver,id:'giver'},...routePoints(this.sim)],p=points.find(p=>p.id===id||p.step===id&&(!el.dataset.choice||p.id===el.dataset.choice));
   if(this.sim.room!==ROOM||!p){this.rpg.api.toast('Read the current route before setting out.');return true;}
   this.rpg.close();
   let q=null;for(const[dx,dz]of[[0,1.7],[1.7,0],[-1.7,0],[0,-1.7]]){const candidate={x:p.x+dx,z:p.z+dz};if(W.walkable(this.sim.room,candidate.x,candidate.z)&&W.segment(this.sim.room,candidate,p,.04)){q=candidate;break;}}
   this.rpg.api.walkLocal((q||p).x,(q||p).z);return true;
  }
  if(type==='binding-preview'){
   const kind=el.dataset.kind;if(!['edge','shelter'].includes(kind))return true;
   this.pending={weapon:id,kind,sim:this.sim,active:this.rpg.api.worldContext().active,revision:this.sim.state.adventure.revision};this.rpg.paint();return true;
  }
  if(type==='binding-cancel'){this.pending=null;this.rpg.paint();return true;}
  if(type==='binding-confirm'){
   const p=this.pending,ctx=this.rpg.api.worldContext();
   if(!p||p.weapon!==id||p.sim!==this.sim||p.active!==ctx.active||p.revision!==this.sim.state.adventure.revision){this.pending=null;this.rpg.api.toast('Your loadout or character changed. Inspect the binding again.');this.rpg.paint();return true;}
   const result=this.rpg.api.earthBinding(p.weapon,p.kind);if(result.ok)this.pending=null;this.rpg.api.toast(result.text||result.error);this.rpg.paint();return true;
  }
  const payload={quest:type.startsWith('patrol-')?E.patrol.id:E.definition.id};
  if(type.startsWith('patrol-')){payload.run=Number(el.dataset.run);payload.priorClaim=Number(el.dataset.priorClaim);}
  if(type==='step'||type==='patrol-step'){payload.step=id;if(el.dataset.choice)payload.branch=el.dataset.choice;}
  const result=this.rpg.api.expeditionCommand(type,payload);
  if(result.ok){this.rpg.quest='expedition';this.reading=null;}
  this.rpg.api.toast(result.text||result.error);this.rpg.paint();return true;
 }
 invitation(){
  const r=this.sim.state.earthExpedition.story;
  return'<section class="expedition-invitation"><small>ELDERWEALD · A ROAD THAT KEEPS ITS ROOTS</small><h3>'+esc(E.definition.title)+'</h3><p>'+esc(r.claimed?'The passage is braced and your allocation is remembered. Rill offers deliberate repeat patrols; your finite binding can be inspected at home.':r.accepted?'Your accepted work and exact reward are kept. Cross Coastward’s western woods to continue.':'Beyond Coastward’s west coppice, the old root-channel still carries water. Rill needs practical help, with two material allocations and a useful weapon project.')+'</p>'+button('Read the living-road expedition','open')+'</section>';
 }
 work(quest,p){
  const patrol=quest===E.patrol,d=quest;
  if(!p.accepted&&!patrol||patrol&&!p.active)return'';
  const active=patrol?p.active:this.sim.state.earthExpedition.story;
  const runMeta=patrol?'data-run="'+active.run+'" data-prior-claim="'+p.lastClaim+'"':'';
  let html='<section class="expedition-objectives"><h3>'+(p.ready?'Work complete · payment ready':'Your next action')+'</h3>';
  if(p.ready)html+='<p>Return to Rill at the camp. Your payment remains unclaimed until you deliberately collect it.</p>'+button('Walk back to Rill','walk','giver')+button(patrol?'Claim patrol '+active.run:'Claim the declared story payment',patrol?'patrol-claim':'claim','',runMeta);
  else for(const s of p.next){
   html+='<article data-expedition-step="'+esc(s.id)+'"><small>'+(s.kind==='defeat'?'ACTUAL ENCOUNTER':'FIELD WORK')+'</small><h4>'+esc(s.name)+'</h4><p>'+esc(s.text)+'</p>';
   if(s.choices)for(const c of s.choices)html+='<div class="expedition-choice"><h5>'+esc(c.name)+'</h5><p>'+esc(c.text)+'</p><p><strong>Allocation:</strong> '+Object.entries(c.materials).map(([k,n])=>n+' '+({wood:'timber',fiber:'fibre'}[k]||k)).join(' · ')+'</p>'+button('Walk to this preparation','walk',c.id)+button('Prepare this allocation','step',s.id,'data-choice="'+esc(c.id)+'"')+'</div>';
   else html+=button(s.kind==='defeat'?'Walk near the encounter':'Walk to this action','walk',s.id)+(s.kind==='defeat'?'<p class="expedition-muted">Tab selects · 1 stationary autoattack · Brace or move during the tell. The actual defeat records this objective.</p>':button('Do this work here',patrol?'patrol-step':'step',s.id,runMeta));
   html+='</article>';
  }
  return html+'<p class="expedition-muted">'+p.done+' / '+p.total+' completed. Walking only takes you there; E opens the action on arrival. V changes view. Home remains available.</p></section>';
 }
 page(tab){
  if(tab!=='expedition')return null;
  const d=E.definition,r=this.sim.state.earthExpedition.story,p=E.progress(this.sim),here=this.sim.room===ROOM;
  let html='<article class="earth-expedition"><header><small>ELDERWEALD · OPTIONAL EARTH EXPEDITION</small><h2>'+esc(d.title)+'</h2><p>'+esc(d.summary)+'</p></header><div class="expedition-terms"><p><strong>Route:</strong> leave Coastward’s west coppice for the clearing camp, cross the wetland footbridge, visit the root-channel and return by the glade toward the fields. Two supported junctions join the same country.</p><p><strong>Danger:</strong> '+esc(d.danger)+'</p><p><strong>Fixed story payment:</strong> '+fee(d.reward)+'. Your chosen material allocation is added to this payment.</p><p><strong>Weapon project:</strong> one Trailward binding on an owned blade or bow: edge +2 attack, or shelter +1 guard / +10 maximum health. Cost: 3 ore, 8 sunmarks and 6 fibre. Inspect before spending; equipment stays yours.</p></div>';
  if(at(this.sim,d.giver)){
   const speech=G.RealmEarthExpeditionDialogue?.reading(d.giver.id,this.sim.state.earthExpedition,this.sim.state.adventure.earthBinding);
   if(speech)html+='<section class="expedition-dialogue"><small>'+esc(speech.speaker)+'</small><h3>'+esc(speech.title)+'</h3>'+speech.lines.map(line=>'<p>'+esc(line)+'</p>').join('')+'<p class="expedition-muted">'+esc(speech.hint)+'</p></section>';
  }
  html+=xpNote(this.sim.state.adventure,d.reward);
  if(!r.accepted){
   const choices=d.steps.find(s=>s.choices)?.choices||[];
   html+='<div class="expedition-choices">'+choices.map(c=>'<section><h3>'+esc(c.name)+'</h3><p>'+esc(c.text)+'</p><strong>'+Object.entries(c.materials).map(([k,n])=>n+' '+({wood:'timber',fiber:'fibre'}[k]||k)).join(' · ')+'</strong><p class="expedition-muted">'+(c.materials.fiber<6?'Two more fibre are needed for the binding: existing gathering or one completed patrol supplies them.':'This allocation supplies the six fibre needed for the binding.')+'</p></section>').join('')+'</div>';
   html+=(here?button('Walk to Rill at the clearing camp','walk','giver')+button('Accept this expedition','accept'):'<p>Travel to Earth · Coastward Road through the Roads of Light, then take either western woodland junction to Rill’s camp.</p><button data-rpg="world-select" data-id="earthlands">Read the Earth crossing</button>');
  }else if(!r.claimed)html+=this.work(d,p.story);
  else html+='<section class="expedition-finished"><small>ONCE-ONLY STORY · PAYMENT CLAIMED</small><h3>The living road remembers</h3><p>'+esc(r.branch==='stormfall-recovery'?'Your recovered stormfall timber supports the camp’s winter work. The standing shelter trees remain.':'Your managed-coppice allocation preserves more flexible fibre for the local work. The designated growth keeps its own boundary.')+'</p><p>The root-channel’s new brace remains visible. Rill recognizes the completed allocation. The forest organism and the older Earth stories retain their own history.</p></section>';
  if(r.claimed){
   html+='<section class="expedition-patrol"><small>INTENTIONAL REPEAT WORK · SEPARATE RUNS</small><h3>'+esc(E.patrol.title)+'</h3><p>'+esc(E.patrol.summary)+'</p><p><strong>Each completed patrol pays:</strong> '+fee(E.patrol.reward)+'. No acceptance fee. Inspect the wetland, clear the declared encounters, inspect the root support and glade, then return to Rill. Re-entry or reload keeps the same run.</p>'+(p.patrol.active?this.work(E.patrol,p.patrol):button('Walk to Rill','walk','giver')+button('Begin a new patrol','patrol-accept','','data-run="'+(p.patrol.lastClaim+1)+'" data-prior-claim="'+p.patrol.lastClaim+'"'))+xpNote(this.sim.state.adventure,E.patrol.reward)+'<p class="expedition-muted">'+p.patrol.lastClaim+' patrol'+(p.patrol.lastClaim===1?'':'s')+' paid. Oren’s rewards and the original realm surveys keep their separate claims.</p></section>';
  }
  html+='<section><h3>A useful return</h3><p>Return to your outdoor home workbench to inspect the finite binding. Keep gathering, crafting, housing, music and the main story in whichever order you choose.</p><button data-rpg="open" data-id="craft">Inspect the workbench and binding</button>'+(here?'<button data-rpg="world-return">Return to Firstlight</button><button data-rpg="open" data-id="atlas">Local map</button>':'')+'</section></article>';
  return{title:'The living road',html};
 }
 fitting(){
  const a=this.sim.state.adventure,r=this.sim.state.earthExpedition.story,b=a.earthBinding;
  if(!r.accepted)return'';
  let html='<section class="expedition-binding"><small>ONE FINITE EQUIPMENT PROJECT</small><h3>Trailward binding</h3>';
  if(b.weapon)return html+'<p>'+esc(A.GEAR[b.weapon].name)+' carries the '+esc(b.kind)+' binding. '+(b.kind==='edge'?'+2 attack':'+1 guard · +10 maximum health')+' while equipped. Identity, socket and earlier fittings remain.</p></section>';
  html+='<p>Choose one owned blade or bow after the living-road story is claimed. Edge adds 2 attack; shelter adds 1 guard and 10 maximum health. One choice, one weapon, once per character. No auto-equip or health refill.</p><p><strong>Cost:</strong> 3 ore · 8 sunmarks · 6 fibre. You have '+a.ore+' ore · '+a.coins+' sunmarks · '+this.sim.state.sandbox.inventory.fiber+' fibre.</p>';
  if(!r.claimed)return html+'<p>Complete and claim Rill’s story before applying this project.</p></section>';
  if(this.pending){
   const {weapon:id,kind}=this.pending,c=comparison(a,id,kind),w=c.weapon;
   html+='<div class="expedition-binding-preview" data-binding-preview="'+esc(kind)+'"><h4>'+esc(A.GEAR[id].name)+' · '+esc(kind)+'</h4><table><thead><tr><th>Effect</th><th>Equipped now</th><th>Selected weapon</th><th>After binding</th></tr></thead><tbody>'+[['Attack','attack'],['Guard','defense'],['Maximum health','maxHP']].map(([name,key])=>'<tr><th>'+name+'</th><td>'+c.equipped[key]+'</td><td>'+c.before[key]+'</td><td>'+c.after[key]+'</td></tr>').join('')+'</tbody></table><p>'+esc(w.style==='bow'?'Bow':'Blade')+' · '+format(w.reach)+' m reach · '+format(w.cooldown)+' s ordinary recovery · '+w.stamina+' ordinary stamina. These behaviors and the socket are retained.</p><p>Applying to an unequipped weapon leaves your current loadout in place. The preview keeps your current XP fixed.</p>'+button('Apply this binding · spend the stated cost','binding-confirm',id)+button('Keep my materials','binding-cancel')+'</div>';
  }else html+='<div class="expedition-binding-weapons">'+a.owned.filter(id=>A.GEAR[id].slot==='weapon').map(id=>'<article><strong>'+esc(A.GEAR[id].name)+'</strong><span>'+esc(G.RealmArsenal.weapon({...a,equipment:{...a.equipment,weapon:id}}).style)+'</span>'+button('Compare edge +2 attack','binding-preview',id,'data-kind="edge"')+button('Compare shelter +1 guard / +10 health','binding-preview',id,'data-kind="shelter"')+'</article>').join('')+'</div>';
  return html+'</section>';
 }
 tick(){
  // Restore the active outing once per character body. Subsequent manual tracker
  // selections stay deliberate, including an older pinned equipment project.
  if(this.owner!==this.sim){this.owner=this.sim;const e=this.sim.state.earthExpedition;if(e.story.accepted&&!e.story.claimed||e.patrol.active)this.rpg.quest='expedition';}
  const tracker=document.querySelector('.tracker-switch [data-id="expedition"]');if(tracker){tracker.hidden=!this.sim.state.earthExpedition.story.accepted;tracker.setAttribute('aria-pressed',String(this.rpg.quest==='expedition'));}
  if(this.rpg.quest!=='expedition')return;
  const s=this.sim.state.earthExpedition,p=E.progress(this.sim),patrol=!!p.patrol.active,progress=patrol?p.patrol:p.story;
  document.querySelector('#tracked-chapter').textContent=patrol?'ELDERWEALD · PATROL '+p.patrol.active.run:'ELDERWEALD · YOUR LIVING ROAD';
  document.querySelector('#tracked-title').textContent=patrol?E.patrol.title:E.definition.title;
  document.querySelector('#tracked-detail').textContent=progress.ready&&!(s.story.claimed&&!patrol)?'Return to Rill at the clearing camp to claim.':s.story.claimed&&!patrol?(this.sim.state.adventure.earthBinding.weapon?'The binding is complete. A new patrol or another project is yours to choose.':'Inspect your finite binding at the home workbench, or begin a new patrol.'):(progress.next[0]?.name||'Speak to Rill at the clearing camp west of Coastward.');
  document.querySelector('#tracked-progress').textContent=progress.done+' / '+progress.total+' · J expedition · M routes · V view';
 }
}
G.RealmEarthExpeditionUI={ExpeditionUI,comparison,at,routePoints,xpNote};if(typeof module!=='undefined')module.exports=G.RealmEarthExpeditionUI;
})(globalThis);
