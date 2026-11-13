/* Act III interface: the tracker's line through the night, Briar's skill while she is gone, the calls, the device and
 * the bowl prompts, the envoy at the spring, and the scenes the night queues while play goes on. The lines are the
 * story script's; no interface here grants anything, every change goes through an adventure command. */
(function(G){'use strict';const N=G.RealmNight,$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const btn=(text,act,id)=>'<button data-rpg="'+act+'" data-id="'+esc(id)+'">'+esc(text)+'</button>';
class NightUI{
 constructor(rpg){this.rpg=rpg;this.view=null;}
 get sim(){return this.rpg.sim;}
 run(type,p={}){return this.rpg.run(type,p);}
 prompt(){
  const sim=this.sim,w=sim.state,st=N.stage(w),p=w.player;
  if(sim.room==='crossing'&&st==='lit'){
   if(w.adventure.companion.bonded===false&&w.night.device==='found'&&!N.breakBlock(sim)&&dist(p,N.DEVICE)<=N.REACH)return{text:'E · Break the severing device',type:'night-break',payload:{}};
   const g=N.groupAt(sim);if(g)return{text:'E · Call '+N.GROUP_NAME[g],type:'night-call',payload:{group:g}};
  }
  if(N.deviceReady(sim))return{text:'E · The quiet engine',type:'view-device',payload:{}};
  if(N.bowlNear(sim))return{text:'E · Her bowl',type:'view-bowl',payload:{}};
  if(sim.room===null&&st==='quiet'){const e=N.envoyPos(sim);if(e&&e.arrived&&dist(p,N.ENVOY)<=N.ENVOY_TALK)return{text:'E · Speak with the envoy',type:'night-envoy',payload:{}};}
  return null;
 }
 interact(){
  const q=this.prompt();if(!q)return false;
  if(q.type==='view-device'){this.show({title:'The quiet engine',where:'The bridge, in the morning',scene:N.sceneOf('device',this.sim.state)});return true;}
  if(q.type==='view-bowl'){this.show({title:'The shared house door',where:'The shared house',scene:N.sceneOf('bowl',this.sim.state)});return true;}
  const r=this.run(q.type,q.payload);
  if(r.ok&&q.type==='night-envoy'){this.show({title:'The envoy at the spring',where:'The spring',scene:N.sceneOf('envoy',this.sim.state)});return true;}
  this.rpg.api.toast(r.ok?r.text:r.error);this.rpg.tick();return true;
 }
 // Opens a scene's dialogue; the choice, when the scene has one, is offered as buttons.
 show(view){this.view={title:view.title,where:view.where,scene:view.scene};this.rpg.open('night');}
 action(el){
  if(el.dataset.rpg!=='night-place')return false;
  const r=this.run('night-device',{value:el.dataset.id});
  this.rpg.api.toast(r.ok?r.text:r.error);
  if(r.ok){this.view=null;this.rpg.close();}
  this.rpg.tick();return true;
 }
 page(tab){
  if(tab!=='night'||!this.view)return null;
  const sc=this.view.scene;if(!sc)return null;
  const lines=sc.lines.map(l=>'<p>'+(l.speaker?'<b>'+esc(l.speaker)+'</b> ':'')+esc(l.text)+'</p>').join('');
  const choice=sc.choice?'<p class="muted">'+esc(sc.choice.prompt)+'</p><div class="button-row">'+sc.choice.options.map(o=>btn(o.label,'night-place',o.id)).join('')+'</div>':'';
  return{title:this.view.title,html:'<div class="cross-service"><div class="cross-portrait keeper">✦</div><div><small>ACT III · '+esc(this.view.where)+'</small>'+lines+choice+'</div></div>'};
 }
 context(){const q=this.prompt();return q?q.text:null;}
 tick(){
  const sim=this.sim,w=sim.state;
  if(N.briarAway(sim)){const el=$('#skill-insight');if(el){el.disabled=true;el.title='Briar is gone.';el.setAttribute('aria-label','Briar · Briar is gone.');}}
  // A scene the night queued during play opens once the player is not already reading something.
  if(N.hasPending(sim)&&!this.rpg.dialog?.open){const next=N.takePending(sim);if(next)this.show({title:'The night the warning failed',where:next.scene.where,scene:next.scene});}
  const o=N.objective(sim);
  if(o&&this.rpg.quest==='story'){$('#tracked-chapter').textContent='ACT III · THE NIGHT THE WARNING FAILED';$('#tracked-title').textContent=o.title;$('#tracked-detail').textContent=o.detail;$('#tracked-progress').textContent=o.progress;}
 }
}
G.RealmNightUI={NightUI};if(typeof module!=='undefined')module.exports=G.RealmNightUI;
})(globalThis);
