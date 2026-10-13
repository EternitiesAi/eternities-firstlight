/* Native choices and world controls for an optional, transient pier activity. */
(function(G){'use strict';
const F=G.RealmPierFishing||(typeof require==='function'?require('./pier-fishing.js'):null);
class FishingUI{
 constructor(api){
  this.api=api;const host=document.createElement('div');host.id='pier-fishing';
  host.innerHTML='<dialog aria-labelledby="fishing-title"><button class="fish-close" aria-label="Close pier choices">×</button><small>FIRSTLIGHT · AN ORDINARY EVENING</small><h2 id="fishing-title">A line on the water</h2><p>A borrowed pier rod, the lake below, and nowhere you have to hurry.</p><p>Watch the float. Hook when a bite appears, then reel while the fish turns. Ease the line during a strong pull; too much tension or a slack line lets the fish escape.</p><p>Press E to switch between reel and ease, or hold the Reel button. Catch and release only: no bait cost, equipment requirement, XP, money or stored catches. Walking away puts the rod back.</p><div class="fish-choices"><button data-fish="cast">Cast a line</button><button data-fish="rest">Rest beside the water</button></div></dialog><section class="fish-hud" hidden aria-label="Fishing"><small>LANTERN PIER · CATCH & RELEASE</small><h3>Read the water</h3><p class="fish-message" role="status" aria-live="polite"></p><label>Line tension <span class="fish-tension-text"></span><meter class="fish-tension" min="0" max="100" low="12" high="80" optimum="45" value="28"></meter></label><label>Fish brought closer <span class="fish-progress-text"></span><progress max="100" value="0"></progress></label><div class="fish-choices"><button data-fish="primary">Watch the float</button><button data-fish="hold" hidden>Hold to reel</button><button data-fish="look">Look along the line</button><button data-fish="cancel">Put rod away</button></div><small class="fish-controls">E · choose / switch reel and ease · Esc · put away<br>V · change camera · P · pause</small></section>';
  document.body.append(host);this.host=host;this.dialog=host.querySelector('dialog');this.hud=host.querySelector('.fish-hud');
  host.querySelector('.fish-close').onclick=()=>this.close();
  this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});
  host.querySelector('[data-fish="cast"]').onclick=()=>this.cast();
  host.querySelector('[data-fish="rest"]').onclick=()=>{if(!this.modalCurrent())return this.close();this.close();api.rest();};
  host.querySelector('[data-fish="primary"]').onclick=()=>this.primary();
  host.querySelector('[data-fish="cancel"]').onclick=()=>this.act('cancel');
  host.querySelector('[data-fish="look"]').onclick=()=>api.look();
  const hold=host.querySelector('[data-fish="hold"]');
  hold.onpointerdown=e=>{e.preventDefault();hold.setPointerCapture(e.pointerId);this.act('reel');};
  hold.onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)this.act('reel');}};
  hold.onkeyup=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();this.act('ease',true);}};
  hold.addEventListener('blur',()=>this.act('ease',true));
  for(const name of ['pointerup','pointercancel','lostpointercapture'])hold.addEventListener(name,()=>this.act('ease',true));
  window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||api.menuOpen())return;if(this.key(e)){e.preventDefault();e.stopImmediatePropagation();}},true);
  window.addEventListener('blur',()=>this.act('cancel',true));
  window.addEventListener('pagehide',()=>this.act('cancel',true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.act('cancel',true);});
 }
 context(){return{sim:this.api.sim(),active:this.api.active(),current:()=>({sim:this.api.sim(),active:this.api.active()})};}
 active(){return F.current(this.context());}
 modalCurrent(){return this.modalOwner?.sim===this.api.sim()&&this.modalOwner?.state===this.api.sim().state&&this.modalOwner?.active===this.api.active();}
 open(){
  if(this.api.blocked()||!F.eligible(this.context()))return false;
  this.api.prepare();const sim=this.api.sim();this.modalOwner={sim,state:sim.state,active:this.api.active(),paused:sim.paused};
  sim.paused=true;this.dialog.showModal();return true;
 }
 close(){
  if(this.modalCurrent())this.api.sim().paused=this.modalOwner.paused;
  this.dialog.close();this.modalOwner=null;this.api.focus();
 }
 cast(){
  if(!this.modalCurrent()){this.close();return;}
  this.close();if(this.api.blocked())return;return this.act('cast');
 }
 act(type,quiet=false){
  const result=F.command(this.context(),type);
  if(!quiet&&(!result.ok||['release','cancel','cast'].includes(type)))this.api.toast(result.text||result.error);
  this.paint();return result;
 }
 primary(){
  const v=F.current(this.context());if(!v)return false;
  const action={bite:'hook',playing:'toggle',caught:'release',lost:'cast'}[v.phase];if(action)this.act(action);return true;
 }
 key(e){
  if(e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)||e.target?.isContentEditable)return false;
  if(!F.current(this.context()))return false;const k=e.key.toLowerCase();
  if(!['e','escape'].includes(k))return false;if(e.repeat)return true;
  if(k==='escape')this.act('cancel');else this.primary();return true;
 }
 interact(){if(this.primary())return true;return this.open();}
 tick(){
  const ctx=this.context();if(this.api.blocked())F.command(ctx,'cancel');F.tick(ctx,this.api.menuOpen());
  if(ctx.sim.paused||this.api.menuOpen())F.command(ctx,'ease');
  if(this.dialog.open&&!this.modalCurrent())this.close();
  this.paint();
 }
 paint(){
  if(!this.host)return;const ctx=this.context(),v=F.current(ctx),sim=ctx.sim;
  sim.presentation=sim.presentation||{};sim.presentation.fishing=v;
  this.hud.hidden=!v||this.api.menuOpen();document.body.classList.toggle('pier-fishing-active',!!v);if(!v)return;
  const q=s=>this.hud.querySelector(s),paused=sim.paused||this.api.menuOpen();
  const message=paused?'Paused · resume when you are ready.':v.message;
  if(q('.fish-message').textContent!==message)q('.fish-message').textContent=message;
  const tension=Math.round(v.tension*100),progress=Math.round(v.progress*100);
  q('.fish-tension-text').textContent=tension+'% · '+(v.reeling?'rising':'easing');q('.fish-tension').value=tension;
  q('.fish-progress-text').textContent=progress+'%';q('progress').value=progress;
  const primary=q('[data-fish="primary"]'),hold=q('[data-fish="hold"]');
  primary.textContent=({waiting:'Watch the float',bite:'Hook · E',playing:v.reeling?'Ease the line · E':'Reel gently · E',caught:'Release silverfin · E',lost:'Cast again · E'})[v.phase];
  primary.disabled=paused||v.phase==='waiting';hold.hidden=v.phase!=='playing';hold.disabled=paused;
  this.hud.dataset.phase=v.phase;this.hud.dataset.pulling=String(v.pulling);
 }
}
const api=Object.freeze({FishingUI});G.RealmPierFishingUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
