/* Presents the nearshore. The arrival and the first-evening home are called from the frame when their
 * conditions hold; answering a fox is a physical interaction with the nearest one. Reading grants nothing:
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
  else if(!result.ok&&type==='choose')this.rpg.api.toast(result.error);
  if(result.ok&&!result.duplicate)this.rpg.paint();
  return result;
 }
 tick(){
  const sim=this.sim;if(!sim||sim.worldDive||!N()||!S())return;
  const now=sim.elapsed||0;if(now<this.nextTry)return;
  const s=sim.state.saga,p=sim.state.player,hour=sim.state.hour;
  const arrive=sim.room===null&&s.briar.state==='taken'&&S().done(sim.state,'witness')&&Math.hypot(p.x-N().PLACE.x,p.z-N().PLACE.z)<=N().NEAR;
  const evening=s.briar.state==='returned'&&s.briar.homeDay===null&&hour>=18&&hour<22&&sim.state.day>=s.briar.returnedDay;
  if(!arrive&&!evening)return;
  this.nextTry=now+1;
  this.run(arrive?'arrive':'home');
 }
 interact(){
  const sim=this.sim;if(!sim||!N()||!N().active(sim))return false;
  const fox=N().foxAt(sim);if(!fox)return false;
  this.run('choose',{fox});
  return true;
 }
 context(){const sim=this.sim;return sim&&N()&&N().active(sim)&&N().foxAt(sim)?'E · Answer the fox':null;}
 page(){return null;}
}
const api={NearshoreUI};G.RealmNearshoreUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
