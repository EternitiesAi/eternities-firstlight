/* Presents the nearshore. The pier, the arrival, the never-bonded plain scene and the first-evening home are called
 * from the frame when their conditions hold. A fox is a physical interaction: E on the real fox answers at once;
 * E on the fox at your heel opens the story dialog's take-or-wait prompt (BRANCHES 3.8). Reading grants nothing;
 * every saved change is a command with the revision and owner the caller read. */
(function(G){'use strict';
const N=()=>G.RealmNearshore,S=()=>G.RealmSaga;
class NearshoreUI{
 constructor(rpg){this.rpg=rpg;this.nextTry=0;}
 get sim(){return this.rpg.sim;}
 reset(){this.nextTry=0;}
 run(type,extra={}){
  const sim=this.sim,c=this.rpg.api.worldContext();
  const result=this.rpg.api.nearshoreCommand(type,{expectedRevision:sim.state.adventure.revision,expectedActive:c.active,...extra});
  if(result.ok&&result.text)this.rpg.api.toast(result.text);
  else if(!result.ok&&(type==='choose'||type==='heel-answer'))this.rpg.api.toast(result.error);
  if(result.ok&&!result.duplicate)this.rpg.paint();
  return result;
 }
 tick(){
  const sim=this.sim;if(!sim||sim.worldDive||!N()||!S())return;
  const now=sim.elapsed||0;if(now<this.nextTry)return;
  const s=sim.state.saga,p=sim.state.player,hour=sim.state.hour,near=Math.hypot(p.x-N().PLACE.x,p.z-N().PLACE.z)<=N().NEAR;
  const arrive=sim.room===null&&s.briar.state==='taken'&&S().done(sim.state,'witness')&&near;
  const plain=sim.room===null&&sim.state.adventure.companion?.bonded!==true&&s.briar.state==='with'&&S().done(sim.state,'witness')&&!Object.hasOwn(s.beats,'nearshore')&&near;
  const evening=s.briar.state==='returned'&&s.briar.homeDay===null&&hour>=18&&hour<22&&sim.state.day>=s.briar.returnedDay;
  if(!arrive&&!plain&&!evening)return;
  this.nextTry=now+1;
  this.run(arrive?'arrive':plain?'plain':'home');
 }
 lone(){const sim=this.sim;return !!sim&&!!N()?.refusable?.(sim)&&Math.hypot(sim.state.player.x-N().PLACE.x,sim.state.player.z-N().PLACE.z)<=N().REACH+1;}
 // The heel prompt: take or wait. Only take reaches the saga (briar-false) through the heel-answer command.
 heel(r){
  const dlg=typeof document!=='undefined'?document.getElementById('story-dialog'):null;if(!dlg||!Array.isArray(r.options))return;
  document.getElementById('story-speaker').textContent='THE FOX AT YOUR HEEL';
  document.getElementById('story-title').textContent=r.prompt;
  document.getElementById('story-body').textContent=r.text;
  const box=document.getElementById('story-buttons');box.innerHTML='';
  for(const o of r.options){const b=document.createElement('button');b.textContent=o.label;b.onclick=()=>{dlg.close();this.run('heel-answer',{take:o.id==='take'});};box.appendChild(b);}
  dlg.showModal();
 }
 interact(){
  const sim=this.sim;if(this.lone()){const r=this.run('refuse');if(!r.ok)this.rpg.api.toast(r.error);return true;}
  if(!sim||!N()||!N().active(sim))return false;
  const fox=N().foxAt(sim);if(!fox)return false;
  const r=this.run('choose',{fox});
  if(r.ok&&r.heel)this.heel(r);
  return true;
 }
 context(){const sim=this.sim;if(this.lone())return 'E · Refuse the Regent';return sim&&N()&&N().active(sim)&&N().foxAt(sim)?'E · Answer the fox':null;}
 page(){return null;}
}
const api={NearshoreUI};G.RealmNearshoreUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
