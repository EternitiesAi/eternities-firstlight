/* Native optional gathering panel. Commands own progress; sound stays opt-in. */
(function(G){'use strict';
const Q=G.RealmGathering,M=G.RealmGatheringMusic,E=G.RealmEarth,$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,act,id='',disabled=false)=>'<button data-rpg="table-'+act+'" data-id="'+esc(id)+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
class GatheringUI{
 constructor(rpg){this.rpg=rpg;this.player=new M.Player();this.pending=null;this.caption='Sound is optional. Reading and silent completion are equally complete.';this.boundary=null;this.playRequest=0;this.lastAudioStatus='idle';
  this.stop=()=>{this.playRequest++;this.player.stop();};document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});window.addEventListener('blur',this.stop);window.addEventListener('pagehide',this.stop);
 }
 get sim(){return this.rpg.sim;}get state(){return this.sim.state.adventure.earthGathering;}
 reset(){this.stop();this.pending=null;this.caption='Sound is optional. Reading and silent completion are equally complete.';}
 interact(){if(!Q.point(this.sim))return false;this.rpg.open('gathering');return true;}
 invitation(){if(!Q.available(this.sim.state.adventure))return '';return '<section class="table-invitation"><small>OPTIONAL · LIFE AFTER THE DELIVERY</small><h3>A Table After the Rain</h3><p>'+(this.state.shared?'Your lantern, remembered arrangement and a place for the next traveler remain beside the north road.':'Fenna has put Nella’s basket beside the west-road table. There is time for a small gathering. The delivery payment and Mara’s question can both wait.')+'</p>'+button(this.state.accepted?'Return to the table':'Read the invitation','open')+'</section>';}
 walk(id){const p=id==='table'?Q.TABLE:Q.TASKS.find(t=>t.id===id);if(!p)return;if(this.sim.room!==E.ROOM){this.rpg.api.toast('Take the Hearthwater trail at the Firstlight lake. The table is beside the north-road handoff.');return;}this.rpg.close();this.rpg.api.walkLocal(p.x,p.z);}
 action(el){const act=el.dataset.rpg,id=el.dataset.id;if(!act?.startsWith('table-'))return false;
  if(act==='table-open'){this.rpg.open('gathering');return true;}
  if(act==='table-walk'){this.walk(id);return true;}
  if(act==='table-stop'){this.stop();this.caption='Music stopped. Your composed score has not changed.';this.rpg.paint();return true;}
  if(act==='table-play'){
   if(!Q.at(this.sim,Q.TABLE)||!Q.validVerse(id)||this.state.prepared.length!==Q.TASKS.length){this.rpg.api.toast('Approach the table to hear its instrument.');return true;}
   this.rpg.api.stopPersonalMusic?.();
   const owner=this.sim,audio=this.rpg.api.audio(),request=++this.playRequest;
   this.caption='Starting '+Q.VERSES[id].name+'… Sound is optional.';
   const eligible=()=>owner===this.sim&&this.rpg.dialog.open&&this.rpg.tab==='gathering'&&!document.hidden&&Q.at(this.sim,Q.TABLE)&&this.rpg.api.audio()===audio;
   this.player.play(id,audio,owner,eligible).then(started=>{
    if(request!==this.playRequest||owner!==this.sim)return;
    this.caption=started?Q.VERSES[id].name+' · original 26-second arrangement. '+Q.VERSES[id].description:'Sound is unavailable. Silent completion remains available.';
    if(this.rpg.dialog.open&&this.rpg.tab==='gathering')this.rpg.paint();
   });this.rpg.paint();return true;
  }
  if(act==='table-select'){
   if(!Q.validVerse(id)||!Q.at(this.sim,Q.TABLE)||this.state.verse||this.state.prepared.length!==Q.TASKS.length)return true;
   this.pending={id,sim:this.sim,revision:this.sim.state.adventure.revision};
   this.rpg.paint();$('#rpg-content [data-rpg="table-confirm"]')?.focus();return true;
  }
  if(act==='table-cancel'){const id=this.pending?.id;this.pending=null;this.rpg.paint();if(Q.validVerse(id))$('#rpg-content [data-rpg="table-select"][data-id="'+id+'"]')?.focus();return true;}
  if(act==='table-confirm'){
   const p=this.pending;this.pending=null;
   if(!p||p.sim!==this.sim||p.revision!==this.sim.state.adventure.revision||!Q.at(this.sim,Q.TABLE)){
    this.rpg.api.toast('The table preview changed. Review your arrangement again.');this.rpg.paint();return true;
   }
   this.rpg.run('gathering-verse',{verse:p.id});return true;
  }
  if(act==='table-accept')this.rpg.run('gathering-accept');
  else if(act==='table-prepare')this.rpg.run('gathering-prepare',{id});
  else if(act==='table-share')this.rpg.run('gathering-share');
  return true;
 }
 page(){const a=this.sim.state.adventure,s=this.state,near=Q.at(this.sim,Q.TABLE);let h='<article class="table-reading"><small>HEARTHWATER · A MOMENT YOU MAY KEEP</small><h2>A Table After the Rain</h2>';
  if(!Q.available(a))return h+'<p>First bring Fenna’s flour and apples safely through. The invitation follows the arrival, not the payment.</p></article>';
  h+='<blockquote>“Nella sent bowls. Oren sent that folding stand of his. Ilan said we could borrow a tune. Nobody asked us to make a ceremony of it.” <cite>Fenna, beside the north road</cite></blockquote>';
  if(!near)h+=this.sim.room===E.ROOM?button('Walk to the roadside table','walk','table'):'<p class="table-note">Enter Hearthwater from the Firstlight lake trail. Follow either route to the north-road handoff. This invitation does not teleport you or open Bellweather’s chapter gate.</p>';
  if(!s.accepted){h+='<div class="table-terms"><h3>A small invitation, not another bill</h3><p>Set out the cloth, collect the nearby lantern, open the stand and choose the table’s arrangement. No currency, inventory materials, XP, deadline or main-story choice. You may stop and return later.</p><p>Nella’s basket and Ilan’s written arrangements are here; neither character has been moved out of their own story or routine. Music is opt-in and never replaces your compositions.</p></div>'+button('Help prepare the table · no cost','accept','',!near);}
  else{
   h+='<ol class="table-tasks">'+Q.TASKS.map(t=>{const done=s.prepared.includes(t.id);return '<li><h3>'+(done?'✓ ':'')+t.name+'</h3><p>'+t.text+'</p>'+(done?'<span>Placed at the table</span>':Q.at(this.sim,t)?button(t.name,'prepare',t.id):button('Walk to this preparation','walk',t.id,this.sim.room!==E.ROOM))+'</li>';}).join('')+'</ol>';
   if(s.prepared.length===Q.TASKS.length){h+='<h3>One melody, three ways home</h3><p>The route you repaired suggests <strong>'+esc(Q.VERSES[a.earthStory.dispatch]?.name||'an arrangement')+'</strong>. You may choose any of the three. Previewing does not choose.</p><div class="table-verses">'+Object.entries(Q.VERSES).map(([id,v])=>'<section style="--verse:'+v.color+'"><h4>'+v.name+'</h4><p>'+v.description+'</p>'+button('Listen · optional','play',id,!near)+(!s.verse?button('Consider this arrangement','select',id,!near):s.verse===id?'<strong>Kept for this table</strong>':'')+'</section>').join('')+'</div>';
    h+='<div class="table-audio" role="status">'+esc(this.caption)+'</div>'+button('Stop music','stop');
    if(this.pending&&!s.verse)h+='<section class="table-confirm"><h3>Keep '+Q.VERSES[this.pending.id].name+'?</h3><p>This records the arrangement of your first gathering. It does not change the route, class, allegiance, stats or your own score. Other arrangements remain available to hear.</p>'+button('Keep this arrangement','confirm')+button('Keep looking','cancel')+'</section>';
    if(s.verse&&!s.shared)h+='<section class="table-ending"><h3>There is a place for you.</h3><p>You do not have to listen to the end. You do not have to turn on sound.</p>'+button('Share the evening · silent is welcome','share','',!near)+'</section>';
   }
   if(s.shared)h+='<section class="table-ending"><small>A LOCAL MEMORY · NOT AN ITEM REWARD</small><h3>A place kept.</h3><p>'+Q.VERSES[s.verse].reply+'</p><p>Fenna moves one bowl away from the rain dripping off the awning. The lantern catches the stitching in Nella’s cloth. A little melody is still here when you decide to leave.</p><p>The table’s colored pennant remembers your arrangement. No payment or XP was created. Your unfinished quests are still yours.</p></section>';
  }
  return h+'<p class="table-note">An authored single-player gathering. No online players, live AI, forced grief, offline neglect, or player-composed music is involved.</p></article>';
 }
 tick(){const sim=this.sim;
  if(this.player.owner&&(document.hidden||!this.rpg.dialog.open||this.rpg.tab!=='gathering'||this.rpg.api.panel()||this.player.owner!==sim||sim.room!==E.ROOM||!Q.at(sim,Q.TABLE)||!this.rpg.api.audio()?.enabled))this.stop();
  if(this.lastAudioStatus==='playing'&&this.player.status==='idle'){
   this.caption='Preview finished or stopped. Your arrangement and composed score are unchanged.';
   if(this.rpg.dialog.open&&this.rpg.tab==='gathering'){const status=$('#rpg-content .table-audio');if(status)status.textContent=this.caption;}
  }
  this.lastAudioStatus=this.player.status;
 }
}
function get(rpg){return rpg.gathering||(rpg.gathering=new GatheringUI(rpg));}
G.RealmGatheringUI={GatheringUI,get};
})(globalThis);
