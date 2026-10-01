/* Synthetic host for component tests. This is NOT Firstlight's Simulation,
 * renderer, persistence manager, delivery quest, or RPGUI implementation. */
'use strict';
const makeFixture=()=>({room:RealmEarth.ROOM,paused:false,state:{player:{...RealmGathering.TABLE},adventure:{revision:0,earthStory:{arrived:true,claimed:false,dispatch:'detour'},earthGathering:RealmGathering.fresh(),xp:95,coins:12,ore:7,equipment:{weapon:'fixture-blade'}},music:{title:'My personal composition',notes:[62,66,69]},journal:[]},event(kind,text){this.state.journal.push({kind,text});}});
let active=makeFixture(),message='',commandCount=0;
const audio={enabled:false,ctx:null,master:null,enable(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.3;this.master.connect(this.ctx.destination);}this.enabled=true;return true;}};
globalThis.RealmEarthStory={DESTINATION:{x:0,z:-43},at:(sim,p)=>sim.room===RealmEarth.ROOM&&RealmEarth.walkable(sim.state.player.x,sim.state.player.z)&&RealmEarth.near(sim,p,2.3)&&RealmEarth.line(sim.state.player,p)};
class HostRPG{
 constructor(){this.dialog=document.querySelector('#rpg-window');this.tab='gathering';this.api={audio:()=>audio,panel:()=>false,toast:t=>{message=t;},walkLocal:(x,z)=>{active.state.player={x,z};},sim:()=>active};
 this.gathering=new RealmGatheringUI.GatheringUI(this);this.dialog.addEventListener('cancel',()=>this.close());this.dialog.addEventListener('click',e=>{const button=e.target.closest('[data-rpg]');if(button)this.action(button);});}
 get sim(){return active;}
 open(tab='gathering'){if(tab!=='gathering')this.gathering.reset();this.tab=tab;if(!this.dialog.open)this.dialog.showModal();this.paint();}
 close(){this.gathering.reset();this.dialog.close();}
 reset(){this.gathering.reset();}
 paint(){document.querySelector('#rpg-heading').textContent='A Table After the Rain';document.querySelector('#rpg-content').innerHTML=this.tab==='gathering'?this.gathering.page():this.gathering.invitation();}
 action(el){this.gathering.action(el);}
 interact(){return this.gathering.interact();}
 tick(){this.gathering.tick();}
 run(type,payload){const r=RealmGathering.handle(active,type,payload);commandCount++;if(r.ok)active.state.adventure.revision++;this.api.toast(r.text||r.error);this.paint();return r;}
}
globalThis.RealmRPGUI={RPGUI:HostRPG};globalThis.RealmEarthArt={draw(){}};
globalThis.Component={makeFixture,setActive:s=>{active=s;},get active(){return active;},get audio(){return audio;},get message(){return message;},get commandCount(){return commandCount;},rpg:null};
