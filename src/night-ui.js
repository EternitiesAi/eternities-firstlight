/* Act III interface: the tracker's line through the night, Briar's skill while she is gone, the calls and the device prompt,
 * and the envoy at the spring. No interface grants anything; every change goes through the adventure command. */
(function(G){'use strict';const N=G.RealmNight,$=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
class NightUI{
 constructor(rpg){this.rpg=rpg;this.lines=null;}
 get sim(){return this.rpg.sim;}
 run(type,p={}){return this.rpg.run(type,p);}
 prompt(){
  const sim=this.sim,w=sim.state,st=N.stage(w),p=w.player;
  if(sim.room==='crossing'&&st==='lit'){
   if(!w.adventure.companion.bonded&&w.night.device==='found'&&!N.breakBlock(sim)&&dist(p,N.DEVICE)<=N.REACH)return{text:'E · Break the severing device',type:'night-break',payload:{}};
   const g=N.groupAt(sim);if(g)return{text:'E · Call '+N.GROUP_NAME[g],type:'night-call',payload:{group:g}};
  }
  if(sim.room===null&&st==='quiet'){const e=N.envoyPos(sim);if(e&&e.arrived&&dist(p,N.ENVOY)<=N.ENVOY_TALK)return{text:'E · Speak with the envoy',type:'night-envoy',payload:{}};}
  return null;
 }
 interact(){
  const q=this.prompt();if(!q)return false;
  const r=this.run(q.type,q.payload);
  if(r.ok&&q.type==='night-envoy'){this.lines=r.lines;this.rpg.open('night');return true;}
  this.rpg.api.toast(r.ok?r.text:r.error);this.rpg.tick();return true;
 }
 context(){const q=this.prompt();return q?q.text:null;}
 page(tab){
  if(tab!=='night'||!this.lines)return null;
  return{title:'The envoy at the spring',html:'<div class="cross-service"><div class="cross-portrait keeper">✦</div><div><small>ACT III · THE NIGHT THE WARNING FAILED</small>'+this.lines.map(l=>'<p>'+(l.speaker?'<b>'+esc(l.speaker)+'</b> ':'')+esc(l.text)+'</p>').join('')+'</div></div>'};
 }
 tick(){
  const sim=this.sim,w=sim.state;
  if(N.briarAway(sim)){const el=$('#skill-insight');if(el){el.disabled=true;el.title='Briar is gone.';el.setAttribute('aria-label','Briar · Briar is gone.');}}
  const o=N.objective(sim);
  if(o&&this.rpg.quest==='story'){$('#tracked-chapter').textContent='ACT III · THE NIGHT THE WARNING FAILED';$('#tracked-title').textContent=o.title;$('#tracked-detail').textContent=o.detail;$('#tracked-progress').textContent=o.progress;}
 }
}
G.RealmNightUI={NightUI};if(typeof module!=='undefined')module.exports=G.RealmNightUI;
})(globalThis);
