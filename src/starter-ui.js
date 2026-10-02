/* Oren's optional outing: projections and accepted commands in the existing workspace. */
(function(G){'use strict';
const Q=G.RealmStarter,A=G.RealmAdventure,AR=G.RealmArsenal,T=G.RealmCombat,$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,id='',disabled=false)=>'<button data-rpg="'+action+'" data-id="'+esc(id)+'" '+(disabled?'disabled':'')+'>'+text+'</button>';
function projection(w,h){return{scale:Math.min(w/28,h/39),x:w/2,y:h/2+2.5*Math.min(w/28,h/39)};}
function mapCanvas(canvas,sim){const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height,{scale:s,x:ox,y:oy}=projection(w,h);if(!g)return;
 const at=p=>[ox+p.x*s,oy+p.z*s];g.fillStyle='#122e32';g.fillRect(0,0,w,h);g.fillStyle='#506e54';g.fillRect(ox-12*s,oy-20*s,22*s,35*s);g.fillStyle='#659199';g.fillRect(ox+10*s,0,4*s,h);
 g.strokeStyle='#c4b28b';g.lineWidth=2*s;g.beginPath();[[0,12],[-7,3],[5,-3],[-5,-11],[-4,-15]].forEach(([x,z],i)=>i?g.lineTo(ox+x*s,oy+z*s):g.moveTo(ox+x*s,oy+z*s));g.stroke();
 for(const q of Q.OBSTACLES){g.fillStyle='#949b8b';g.beginPath();g.arc(...at(q),q.r*s,0,Math.PI*2);g.fill();}
 for(const q of Q.points(sim)){g.fillStyle=q.kind==='supplies'?'#eed5a1':'#8cbcaf';g.fillRect(at(q)[0]-2,at(q)[1]-2,4,4);}
 for(const e of A.runtime(sim).enemies.filter(e=>e.hp>0&&e.kind!=='practice')){g.fillStyle='#e0988c';g.beginPath();g.arc(...at(e),3,0,Math.PI*2);g.fill();}
 g.fillStyle='#fff3cf';g.beginPath();g.arc(...at(sim.state.player),4,0,Math.PI*2);g.fill();
}
function mapSVG(sim){const {scale:s,x:ox,y:oy}=projection(420,450),at=p=>({x:ox+p.x*s,y:oy+p.z*s}),points=Q.points(sim);let html='<rect width="420" height="450" rx="14" fill="#14353a"/><rect x="'+(ox-12*s)+'" y="'+(oy-20*s)+'" width="'+22*s+'" height="'+35*s+'" rx="20" fill="#4d6c54"/><path d="M '+(ox+11*s)+' 0 V450" stroke="#69979e" stroke-width="'+2*s+'"/>';
 const route=[[0,12],[-7,3],[5,-3],[-5,-11],[-4,-15]].map(([x,z])=>(ox+x*s)+','+(oy+z*s)).join(' ');html+='<polyline points="'+route+'" fill="none" stroke="#bbad8b" stroke-width="12" stroke-linejoin="round"/>';
 for(const o of Q.OBSTACLES){const p=at(o);html+='<circle cx="'+p.x+'" cy="'+p.y+'" r="'+o.r*s+'" fill="#879688"/>';}
 points.forEach((q,i)=>{const p=at(q);html+='<g role="button" tabindex="0" class="atlas-pin" data-rpg="starter-walk" data-id="'+q.id+'" aria-label="Walk to '+esc(q.name)+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="11" fill="#243f39" stroke="#efd49e"/><text x="'+p.x+'" y="'+(p.y+4)+'" text-anchor="middle" fill="#fff0ca">'+(i+1)+'</text></g>';});
 const p=at(sim.state.player);return '<svg id="starter-map" viewBox="0 0 420 450" role="img" aria-label="Riverbank route map">'+html+'<circle cx="'+p.x+'" cy="'+p.y+'" r="5" fill="#fff8db"/><text x="210" y="20" text-anchor="middle" fill="#d7d4b9">NORTH · RIVERBANK WORKSITE</text></svg>';
}
class StarterUI{
 constructor(rpg){this.rpg=rpg;this.temper=null;this.destination=null;this.lastSound=0;this.lastSoundScene=null;
  const track=document.createElement('button');track.dataset.rpg='track';track.dataset.id='starter';track.textContent='Riverbank';$('.tracker-switch').append(track);
  const labels=document.createElement('div');labels.id='starter-labels';labels.setAttribute('aria-hidden','true');$('#hud').append(labels);
  rpg.dialog.addEventListener('change',e=>{if(e.target.id==='starter-temper-weapon'){this.temper=e.target.value;rpg.paint();}});
  rpg.dialog.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-rpg="starter-walk"]')){e.preventDefault();this.action(e.target);}});
 }
 get sim(){return this.rpg.sim;}get a(){return this.rpg.state;}get q(){return this.a.starter;}
 run(type,p={}){return this.rpg.run(type,p);}
 context(){if(!this.a.started||this.a.hp<=0)return null;const sim=this.sim;
  if(sim.room===Q.ROOM){if(Q.near(sim,Q.ENTRY,2.8))return G.RealmEarth?.riverTrip(sim)?'E · Return to the orchard lane':'E · Return to Oren’s workshop';if(this.a.pursuit.active){const p=G.RealmPursuit.points(sim).find(p=>Q.near(sim,p,2.4));return p?'E · Record '+p.name:'M · Materials survey route';}const b=Q.BUNDLES.find(b=>this.q.accepted&&!this.q.bundles.includes(b.id)&&Q.near(sim,b,2.4));if(b)return'E · Recover '+b.name.toLowerCase();const e=A.roster(sim).find(e=>this.a.drops.includes(e.id)&&Q.near(sim,e));if(e)return'E · Collect '+e.name+' cache';return'M · Riverbank route';}
  if(sim.room)return null;if(Q.near(sim,Q.GATE,2.5))return'E · Take the riverbank path';if(Q.near(sim,Q.OREN))return'E · Oren: supplies, rewards & workbench';return null;
 }
 interact(){if(!this.context())return false;const sim=this.sim;
  if(sim.room===Q.ROOM){if(Q.near(sim,Q.ENTRY,2.8)){this.run('starter-leave');return true;}if(this.a.pursuit.active){const p=G.RealmPursuit.points(sim).find(p=>Q.near(sim,p,2.4));if(p)this.run('pursuit-sample',{run:this.a.pursuit.active.id,id:p.id});else this.rpg.open('atlas');return true;}const b=Q.BUNDLES.find(b=>this.q.accepted&&!this.q.bundles.includes(b.id)&&Q.near(sim,b,2.4));if(b){this.run('starter-pickup',{id:b.id});return true;}const e=A.roster(sim).find(e=>this.a.drops.includes(e.id)&&Q.near(sim,e));if(e){this.run('loot',{id:e.id});return true;}this.rpg.open('atlas');return true;}
  if(Q.near(sim,Q.GATE,2.5)){this.run('starter-enter');return true;}this.rpg.open(this.a.pursuit.active?'pursuit':'starter');return true;
 }
 action(el){const action=el.dataset.rpg,id=el.dataset.id;
  if(action==='starter-accept'){if(this.run('starter-accept').ok)this.rpg.quest='starter';this.rpg.paint();return true;}
  if(action==='starter-claim'){const payload=id==='temper'?{choice:id,weapon:this.temper||this.a.equipment.weapon}:{choice:id};this.run('starter-claim',payload);return true;}
  if(action==='starter-walk'){const p=Q.points(this.sim).find(p=>p.id===id);if(p){this.rpg.close();this.destination={...p,room:this.sim.room};this.rpg.api.walkLocal(p.x,p.z);}return true;}
  if(action==='starter-enter'||action==='starter-leave'){if(this.run(action).ok)this.rpg.close();return true;}
  if(action==='starter-practice'){this.rpg.close();const p=this.sim.room===Q.ROOM?Q.PRACTICE:Q.GATE;this.rpg.api.walkLocal(p.x,p.z);return true;}
  return false;
 }
 compare(choice,weapon){const a=this.a,current=A.stats(a),copy=JSON.parse(JSON.stringify(a));copy.equipment.weapon=weapon;const next=A.stats(copy);if(choice==='temper')next.attack+=2;const before=AR.weapon(a),after=AR.weapon(copy),socket=a.arsenal.sockets[weapon];
  const row=(name,old,n)=>'<tr><th>'+name+'</th><td>'+old+'</td><td>'+n+'</td></tr>';
  return '<table class="starter-compare"><caption>Currently equipped → reward equipped</caption><tbody>'+row('Attack',current.attack,next.attack)+row('Guard',current.defense,next.defense)+row('Maximum health',current.maxHP,next.maxHP)+row('Cooldown (seconds)',before.cooldown,after.cooldown)+row('Reach',before.reach,after.reach)+row('Stamina / strike',before.stamina,after.stamina)+row('Socket',esc(AR.activeGem(a)?.name||'Empty'),esc(socket?AR.GEMS[socket].name:'Empty'))+'</tbody></table>';
 }
 rewardCards(){const a=this.a,ready=Q.complete(a)&&!this.sim.room&&Q.near(this.sim,Q.OREN),owned=a.owned.filter(id=>A.GEAR[id].slot==='weapon');if(!owned.includes(this.temper))this.temper=a.equipment.weapon||owned[0];
  return '<div class="starter-rewards">'+['oren_sunblade','oren_reedbow','temper'].map(choice=>{const weapon=choice==='temper'?this.temper:choice,g=A.GEAR[weapon];if(!g)return'';const title=choice==='temper'?'One careful temper':g.name;
   return '<article class="starter-reward"><small>'+ (choice==='temper'?'ONE OWNED WEAPON · +2 ATTACK':'FIXED EARLY '+g.style.toUpperCase())+'</small><h3>'+esc(title)+'</h3>'+(choice==='temper'?'<label for="starter-temper-weapon">Weapon to improve</label><select id="starter-temper-weapon">'+owned.map(id=>'<option value="'+id+'" '+(id===weapon?'selected':'')+'>'+esc(A.GEAR[id].name)+'</option>').join('')+'</select><p>One +2 attack improvement, once for this outing. Identity, socket, range and cadence stay intact. An equipped selection changes immediately on confirmation.</p>':'<p>'+esc(g.desc)+' Equip it yourself; your old gear is kept. This does not move your current gem.</p>')+this.compare(choice,weapon)+button(ready?'Confirm '+(choice==='temper'?'temper':'this reward'):'Preview · return with both objectives','starter-claim',choice,!ready||(choice!=='temper'&&a.owned.includes(choice)))+'</article>';}).join('')+'</div>';
 }
 journal(){const a=this.a,q=this.q;return '<section class="starter-journal"><small>OPTIONAL · CLOSE TO HOME</small><h3>Oren’s riverbank supplies</h3><p>Recover three distinct bundles and drive away Old Bristle. The objectives share one route and can be done in either order after acceptance.</p><ol>'+Q.BUNDLES.map(b=>'<li class="'+(q.bundles.includes(b.id)?'done':'')+'">'+esc(b.name)+(q.bundles.includes(b.id)?' · secured':' · riverbank path')+'</li>').join('')+'<li class="'+(a.defeated.includes('river-old-bristle')?'done':'')+'">Old Bristle'+(a.defeated.includes('river-old-bristle')?' · driven away':' · the far canvas clearing')+'</li></ol>'+button(q.reward?'See Oren’s thanks':'Review outing and rewards','open','starter')+button('Track riverbank outing','track','starter')+'</section>';}
 page(tab){const a=this.a,q=this.q,sim=this.sim;
  if(tab==='atlas'&&sim.room===Q.ROOM)return{title:a.pursuit.active?'Riverbank survey · record and return':'Riverbank · the way out and home',html:'<div class="cross-atlas-layout"><section>'+mapSVG(sim)+'<p>'+(G.RealmEarth?.riverTrip(sim)?'The southern path returns to the orchard lane. From there, return to Firstlight and find Oren at the workshop.':'The southern path returns to Oren’s workshop.')+' Numbered routes walk through the actual terrain.</p></section><section class="cross-atlas-list">'+Q.points(sim).map((p,i)=>button('<b>'+String(i+1).padStart(2,'0')+'</b><span><strong>'+esc(p.name)+'</strong><small>'+Math.round(Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z))+' paces</small></span>','starter-walk',p.id)).join('')+this.journal()+'</section></div>'};
  if(tab!=='starter')return null;
  const path=G.RealmClasses.definition(a),pathLink='<section class="starter-path"><div><small>YOUR WAY TO FIGHT · OPTIONAL</small><p>'+(path?'Your '+esc(path.name)+' path keeps every weapon and soul choice available.':'Compare Hunter and Magician when you are ready. Your equipment and story remain your own.')+'</p></div>'+button(path?esc(path.name)+' · view technique':'Compare Hunter and Magician','open','classes')+'</section>';
  const reward=q.reward,near=!sim.room&&Q.near(sim,Q.OREN),intro=reward?'You brought the bundles home. Oren has stacked the supplies beside his workshop, ready for tomorrow’s repairs.':'“The rope, hand tools and canvas slipped from our load. Old Bristle has claimed the bank. Bring our supplies home, and I can put a better tool in your hands.”';
  return{title:'Oren · work worth coming home to',html:'<div class="starter-service"><small>THE NEARBY RIVERBANK · OPTIONAL OUTING</small><h2>'+ (reward?'A small job, properly finished.':'A familiar path. Useful work.')+'</h2><p class="starter-intro">'+intro+'</p>'+pathLink+'<p><strong>Route:</strong> the sign east of this workshop leads to the riverbank. Follow the rope, hand tools and canvas north; return by the southern path. <strong>Danger:</strong> two ordinary skitters and one stronger beast. Old Bristle marks where it will strike: Brace or move clear, then use its recovery.</p>'+(!q.accepted?button('Accept: recover three bundles and drive away Old Bristle','starter-accept','',!a.started||!near):this.journal())+(reward?'<article class="starter-thanks"><h3>'+esc(A.GEAR[reward.weapon].name)+(reward.choice==='temper'?' · tempered once':' · yours to equip')+'</h3><p>Six sunmarks and 25 XP were awarded once. Your other belongings and choices remain your own.</p>'+button('Inspect equipment','open','equipment')+(a.equipment.weapon!==reward.weapon?button('Equip '+esc(A.GEAR[reward.weapon].name),'equip',reward.weapon):'<p><strong>This weapon is equipped.</strong></p>')+button('Try it at the riverbank practice bundle','starter-practice')+'</article>':'<h3>Choose one reward when you return</h3><p>Six sunmarks and 25 XP accompany your choice. Existing copper weapons and Dawn’s edge remain stronger than the fixed early weapons. Compare every field; tempering offers a finite improvement for a weapon you already value.</p>'+this.rewardCards())+'<div class="starter-links">'+button('Field guide · equipment projects and repeat surveys','open','pursuit')+button('Workbench · bows, crafting and gems','open','craft')+button('Existing archery court','range')+button('Open map','open','atlas')+'</div></div>'};
 }
 tick(){const a=this.a,q=this.q,sim=this.sim;$('.tracker-switch [data-id="starter"]').hidden=!a.started;
  if(this.rpg.quest==='starter'){const next=!q.accepted?'Speak to Oren at the workshop':q.reward?'Try your reward, then choose another outing':Q.complete(a)?'Return to Oren and choose your reward':q.bundles.length<3?'Recover the riverbank supplies':'Drive away Old Bristle';$('#tracked-chapter').textContent='CLOSE TO HOME · OPTIONAL';$('#tracked-title').textContent=next;$('#tracked-detail').textContent=q.reward?'Your old equipment is kept. Character shows the real changes.':'M maps the route · J keeps all objectives';$('#tracked-progress').textContent=q.bundles.length+'/3 bundles · '+(a.defeated.includes('river-old-bristle')?'beast cleared':'beast remains');}
  const e=T.selected(sim);
  if(e?.id===Q.PRACTICE.id&&A.runtime(sim).training)$('#target-state').textContent='Last confirmed impact: '+A.runtime(sim).training.lastDamage+' · no XP or loot';
  const root=$('#starter-labels');root.replaceChildren();if(sim.room!==Q.ROOM||!sim.state.settings.labels||this.rpg.dialog.open)return;
  const perspective=sim.presentation?.perspective,shown=[],points=Q.points(sim).map(p=>({...p,d:Math.hypot(p.x-sim.state.player.x,p.z-sim.state.player.z)})).sort((a,b)=>a.d-b.d);
  for(const p of points){if(perspective&&(p.d<2.4||p.d>22||shown.length>=3))continue;const pos=this.rpg.api.project(p.x,p.kind==='practice'?3.5:2.5,p.z);if(!pos?.visible)continue;
   const width=Math.min(250,p.name.length*7+22);if(perspective&&shown.some(q=>Math.abs(q.x-pos.x)<(q.width+width)/2+8&&Math.abs(q.y-pos.y)<30))continue;
   const label=document.createElement('span');label.textContent=p.name;label.style.left=pos.x+'px';label.style.top=pos.y+'px';root.append(label);shown.push({...pos,width});}
 }
}
G.RealmStarterUI={StarterUI,mapCanvas,mapSVG,projection};
})(globalThis);
