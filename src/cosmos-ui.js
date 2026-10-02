/* A quiet journey in the existing workspace. Looking never writes a quest or reward. */
(function(G){'use strict';const N=G.RealmCosmos,$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(s,act,id='')=>'<button data-rpg="'+act+'" data-id="'+id+'">'+s+'</button>';
function projection(w,h){const scale=Math.min(w/42,h/82);return{scale,x:w/2,y:h/2+15*scale};}
function mapCanvas(canvas,sim){const g=canvas.getContext('2d');if(!g)return;const w=canvas.width,h=canvas.height,{scale:s,x:ox,y:oy}=projection(w,h);
 g.fillStyle='#171d32';g.fillRect(0,0,w,h);g.fillStyle='#697369';for(const p of N.PATCHES)g.fillRect(ox+(p.x-p.w/2)*s,oy+(p.z-p.d/2)*s,p.w*s,p.d*s);
 g.fillStyle='#363b47';for(const p of N.SOLIDS)g.fillRect(ox+(p.x-p.w/2)*s,oy+(p.z-p.d/2)*s,p.w*s,p.d*s);
 for(const p of N.POINTS){g.fillStyle=p.kind==='return'?'#eacb8f':'#ccd5c6';g.beginPath();g.arc(ox+p.x*s,oy+p.z*s,2.5,0,Math.PI*2);g.fill();}
 g.fillStyle='#fff3c5';g.beginPath();g.arc(ox+sim.state.player.x*s,oy+sim.state.player.z*s,4,0,Math.PI*2);g.fill();
}
function mapSVG(sim){const {scale:s,x:ox,y:oy}=projection(420,530);let html='<rect width="420" height="530" rx="18" fill="#171d32"/>';
 for(const p of N.PATCHES)html+='<rect x="'+(ox+(p.x-p.w/2)*s)+'" y="'+(oy+(p.z-p.d/2)*s)+'" width="'+p.w*s+'" height="'+p.d*s+'" fill="#697369"/>';
 for(const p of N.SOLIDS)html+='<rect x="'+(ox+(p.x-p.w/2)*s)+'" y="'+(oy+(p.z-p.d/2)*s)+'" width="'+p.w*s+'" height="'+p.d*s+'" fill="#363b47"/>';
 for(const [i,p]of N.POINTS.entries())html+='<circle cx="'+(ox+p.x*s)+'" cy="'+(oy+p.z*s)+'" r="10" fill="#273a3c" stroke="#e4cd9e"/><text x="'+(ox+p.x*s)+'" y="'+(oy+p.z*s+4)+'" text-anchor="middle" fill="#fff0d3">'+(i+1)+'</text>';
 const p=sim.state.player;return '<svg id="cosmos-map" viewBox="0 0 420 530" role="img" aria-label="Near Expanse: two ground approaches join at the observatory">'+html+'<circle cx="'+(ox+p.x*s)+'" cy="'+(oy+p.z*s)+'" r="4" fill="white"/><text x="210" y="19" text-anchor="middle" fill="#e4cd9e">NORTH · OCCUPIED OBSERVATORY</text></svg>';
}
const WORDS={
 lamps:{title:'Teren · the road is open',text:'“Three lamps for three things: a road out, shelter, and a road home. Rootcut Lane follows the stone on your left. The open road climbs on your right. Both reach Anik’s observatory.”',detail:'Choose either approach. You can walk the other on your return. This opening visit has no quest reward or hostile encounters.'},
 bench:{title:'A little shelter, a long way from home',text:'The bench is worn smooth. Someone has mended its crossbar with warm bronze, and left room for another traveller.',detail:'The refuge is part of the same ground. Rest here for a moment, or continue to the first horizon. Your own music remains available in More.'},
 rise:{title:'The moon beneath the road',text:'A pale disk appears below the raised road. The brass marker names it a folded view: a distant moon seen from another bearing.',detail:'The moon is an image beyond this country, not a floor or a portal. The marked road under your feet continues north to the observatory. Turn around to find the three warm lamps.'},
 anik:{title:'Anik · someone kept the lamps lit',text:'“You found us. Teren’s lamps are easy to lose in all that sky. There is a cup on the bench if you want to stay, and a clear way home when you are ready.”',detail:'This overlook is inhabited. Its instruments and later field work are still being prepared. You have reached the end of this first walking visit; try the other approach on the way back.'}
};
class CosmosUI{
 constructor(rpg){this.rpg=rpg;this.ticket=null;this.reading=null;const root=document.createElement('div');root.id='cosmos-labels';root.setAttribute('aria-hidden','true');$('#hud').append(root);
  const home=document.createElement('button');home.id='cosmos-home';home.hidden=true;home.textContent='Return to Firstlight';home.onclick=()=>this.returnHome();$('#rpg-hud').append(home);
 }
 get sim(){return this.rpg.sim;}
 reset(){N.cancel(this.ticket);this.ticket=null;this.reading=null;}
 context(){if(this.sim.room===N.ROOM){const p=N.POINTS.find(p=>N.near(this.sim,p));return p?(p.kind==='return'?'E · Return to Firstlight':WORDS[p.id]?'E · '+p.name:'E · Read the local route'):'M · Near Expanse routes';}return !this.sim.room&&N.near(this.sim,N.GATE)?'E · Near Expanse invitation':null;}
 interact(){if(!this.context())return false;if(this.sim.room===N.ROOM){const p=N.POINTS.find(p=>N.near(this.sim,p));if(p?.kind==='return'){this.returnHome();return true;}this.reading=WORDS[p?.id]?p.id:null;this.rpg.open(this.reading?'cosmos':'atlas');}else{this.reset();this.rpg.open('cosmos');}return true;}
 returnHome(){const r=this.rpg.api.cosmosReturn();if(r.ok){this.rpg.close();this.reset();}else this.rpg.api.toast(r.error);}
 action(el){const act=el.dataset.rpg,id=el.dataset.id;
  if(act==='cosmos-confirm'){const r=this.rpg.api.cosmosTravel(this.ticket);this.ticket=null;if(r.ok){this.rpg.close();this.rpg.api.toast('Near Expanse · choose the sheltered lane or open road. Return is always available.');}else{this.rpg.api.toast(r.error);this.rpg.paint();}return true;}
  if(act==='cosmos-return'){this.returnHome();return true;}
  if(act==='cosmos-invitation'){this.reset();this.rpg.open('cosmos');return true;}
  if(act==='cosmos-walk'){const p=id==='gate'&&!this.sim.room?N.GATE:this.sim.room===N.ROOM?N.POINTS.find(p=>p.id===id):null;if(p){this.rpg.close();this.rpg.api.walkLocal(p.x,p.z);}return true;}
  return false;
 }
 invitation(){return '<section class="cosmos-invitation"><small>OPTIONAL JOURNEY · PROTOTYPE OPENING</small><h3>A road under an extraordinary sky</h3><p>Beside the valley observatory, an invitation leads to Three Lamps and a walk through the Near Expanse.</p>'+button('Read the travel invitation','cosmos-invitation')+'</section>';}
 page(tab){
  if(tab==='atlas'&&this.sim.room===N.ROOM)return{title:'Near Expanse · the road out and home',html:'<div class="cosmos-atlas"><section>'+mapSVG(this.sim)+'<p>Solid ground, two approaches. The dark middle is impassable. The moon belongs to the distant view.</p></section><section><small>ONE CONNECTED PLACE</small><h2>Pick a bearing.</h2><p>These destinations use the real walking paths. No teleport is needed between them.</p>'+N.POINTS.map((p,i)=>button('<b>'+String(i+1).padStart(2,'0')+'</b> '+esc(p.name),'cosmos-walk',p.id)).join('')+button('Return to the valley now','cosmos-return')+'<p class="cosmos-note">Saving, reopening or switching characters resumes at your valley checkpoint. This first visit has no reward or story claim.</p></section></div>'};
  if(tab!=='cosmos')return null;
  if(this.sim.room===N.ROOM){const word=WORDS[this.reading]||WORDS.lamps;return{title:word.title,html:'<article class="cosmos-reading"><small>THE NEAR EXPANSE</small><h2>'+word.title+'</h2><p class="cosmos-quote">'+word.text+'</p><p>'+word.detail+'</p><div class="cosmos-actions">'+button('See both ground routes','open','atlas')+button('Return to Firstlight','cosmos-return')+'</div><p class="cosmos-note">A local conversation in the prototype. No class, allegiance or personal story choice is made here.</p></article>'};}
  const near=!this.sim.room&&N.near(this.sim,N.GATE);
  if(near&&!this.ticket){const r=N.preview(this.rpg.api.cosmosContext());if(r.ok)this.ticket=r.ticket;}
  return{title:'Near Expanse · travel invitation',html:'<article class="cosmos-reading"><small>OPTIONAL JOURNEY · FIRST WALKING VISIT</small><h2>A road under an extraordinary sky.</h2><p class="cosmos-quote">Three warm lamps. Two roads through unfamiliar country. Someone still tending an observatory beneath a folded moon.</p><div class="cosmos-terms"><section><h3>Your route</h3><p>Arrive at Three Lamps. Take sheltered Rootcut Lane or the rising open road to Anik’s overlook. Both approaches join on actual ground.</p></section><section><h3>Your way home</h3><p>Return is available from the start and from anywhere on the route. Saving and reopening, or switching characters, resumes at this valley checkpoint.</p></section><section><h3>This opening visit</h3><p>No combat or rewards yet. No equipment is required. Entry grants no items, class, XP, allegiance or story completion. Your existing equipment projects remain yours.</p></section></div><p><strong>Traveller:</strong> '+esc(this.sim.state.visitor.name)+' · <strong>Return:</strong> beside the Firstlight observatory.</p><div class="cosmos-actions">'+(near&&this.ticket?button('Save checkpoint & enter Near Expanse','cosmos-confirm'):button('Walk to the invitation beside the observatory','cosmos-walk','gate'))+'</div><p class="cosmos-note">No save migration is required for this visit. Both camera styles stay available: V swaps them.</p></article>'};
 }
 tick(){const inside=this.sim.room===N.ROOM,adopted=inside&&this.rpg.worlds?.local()===true;$('#cosmos-home').hidden=!inside||adopted;document.body.classList.toggle('in-cosmos',inside);const root=$('#cosmos-labels');root.replaceChildren();if(adopted)return;
  if(inside){$('#tracked-chapter').textContent='NEAR EXPANSE · FIRST WALK';$('#tracked-title').textContent=this.sim.state.player.z<-37?'The observatory is inhabited':'Find the occupied observatory';$('#tracked-detail').textContent='Sheltered lane west · open road east';$('#tracked-progress').textContent='M · routes and return · no reward in this visit';}
  if((this.sim.room&&!inside)||!this.sim.state.settings.labels||this.rpg.dialog.open)return;
  const points=inside?N.POINTS:[{...N.GATE,name:'Near Expanse · invitation'}],player=this.sim.state.player,shown=[];
  for(const p of points.map(p=>({...p,d:Math.hypot(p.x-player.x,p.z-player.z)})).sort((a,b)=>a.d-b.d)){
   if(p.d>24||p.d<2.5||shown.length>=3)continue;const q=this.rpg.api.project(p.x,(inside?N.height(p.x,p.z):1.3)+2.6,p.z);if(!q?.visible||shown.some(v=>Math.abs(v.x-q.x)<190&&Math.abs(v.y-q.y)<34))continue;
   const label=document.createElement('span');label.textContent=p.name;label.style.left=q.x+'px';label.style.top=q.y+'px';root.append(label);shown.push(q);
  }
 }
}
G.RealmCosmosUI={CosmosUI,mapCanvas,mapSVG,projection};})(globalThis);
