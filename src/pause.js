/* pause menu: Esc opens it, Resume closes it. The world stays frozen while it is open and returns to its earlier pause state after. */
(function(G){'use strict';
let dialog=null,hooks=null,was=false;
function mount(h){
 hooks=h;
 dialog=document.createElement('dialog');dialog.id='pause-menu';dialog.setAttribute('aria-labelledby','pause-title');
 dialog.innerHTML='<div class="pause-panel"><p class="pause-kicker">Firstlight</p><h2 id="pause-title">Paused</h2><p class="pause-note">The valley waits. Your world is saved on this device.</p><div class="pause-buttons"><button type="button" id="pause-resume" class="pause-primary">Resume</button><button type="button" id="pause-settings">Settings</button><button type="button" id="pause-quit">Save and quit to title</button></div></div>';
 document.body.append(dialog);
 dialog.querySelector('#pause-resume').addEventListener('click',resume);
 dialog.querySelector('#pause-settings').addEventListener('click',()=>{dialog.close();hooks.settings();});
 dialog.querySelector('#pause-quit').addEventListener('click',quit);
 dialog.addEventListener('cancel',e=>{e.preventDefault();resume();});
}
function focusResume(){dialog.querySelector('#pause-resume').focus({preventScroll:true});}
function open(){
 if(!dialog||dialog.open||!hooks.canOpen())return false;
 const s=hooks.sim();was=s.paused;s.paused=true;hooks.enter();dialog.showModal();focusResume();return true;
}
// used after the settings drawer closes; the world is still paused from open().
function reopen(){if(!dialog||dialog.open)return;dialog.showModal();focusResume();}
function resume(){if(!dialog.open)return;dialog.close();hooks.sim().paused=was;hooks.resumed();}
function quit(){if(!dialog.open)return;hooks.save();dialog.close();hooks.sim().paused=was;hooks.quit();}
const api={mount,open,reopen,resume,visible:()=>!!dialog&&dialog.open};
G.RealmPause=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
