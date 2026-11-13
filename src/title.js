/* title screen over a slow drift of the valley. Buttons call hooks that app.js supplies; this file never touches the world. */
(function(G){'use strict';
const KEY_ROWS=[
 ['Move','<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or the arrow keys'],
 ['Walk','Click or tap the ground'],
 ['Interact','<kbd>E</kbd>, or tap the prompt at the bottom'],
 ['Strike','<kbd>F</kbd>, or tap Strike in a fight'],
 ['Auto-attack','<kbd>1</kbd> keeps striking your target'],
 ['Skills','<kbd>2</kbd> to <kbd>6</kbd> and <kbd>X</kbd> for your class skill, or tap the skill buttons'],
 ['Dodge','<kbd>Space</kbd>, or tap Dodge in a fight'],
 ['Target','<kbd>Tab</kbd> in a fight'],
 ['Turn the view','Drag, or scroll. Pinch on a touch screen'],
 ['Camera styles','<kbd>V</kbd> switches · <kbd>R</kbd> resets the view · <kbd>[</kbd> <kbd>]</kbd> turn it'],
 ['Character and inventory','<kbd>C</kbd> character · <kbd>I</kbd> inventory'],
 ['Journal, crafting, map','<kbd>J</kbd> journal · <kbd>K</kbd> crafting · <kbd>M</kbd> map'],
 ['Build and inhabitants','<kbd>B</kbd> construction · <kbd>O</kbd> inhabitants'],
 ['Pause','<kbd>Esc</kbd> opens the pause menu · <kbd>P</kbd> freezes the world'],
 ['Photo','<kbd>H</kbd> hides the interface']
];
const CREDITS=[
 {title:'Firstlight',lines:['A valley, a fox, and the road home.']},
 {title:'Made by',lines:['Eternities']},
 {title:'Built as',lines:['One offline page. Nothing is fetched from a server.']},
 {title:'Original work',lines:['Code and procedural assets for this game','Weathered timber texture, CC0 1.0']},
 {title:'Thank you',lines:['For walking the valley to its first light.']}
];
let dialog=null,hooks=null;
function keyTable(){return '<table class="key-table"><tbody>'+KEY_ROWS.map(([action,keys])=>'<tr><th scope="row">'+action+'</th><td>'+keys+'</td></tr>').join('')+'</tbody></table>';}
// keepWorld: settings opened from the title keeps the valley drifting behind the drawer.
function hide(keepWorld){
 if(dialog&&dialog.open)dialog.close();
 document.body.classList.remove('title-open');
 if(!keepWorld&&hooks)hooks.drift(false);
}
function show(){
 if(!dialog||!hooks)return;
 const cont=dialog.querySelector('#title-continue'),fresh=dialog.querySelector('#title-new');
 cont.hidden=!hooks.hasSave();
 if(!dialog.open)dialog.showModal();
 document.body.classList.add('title-open');
 (cont.hidden?fresh:cont).focus({preventScroll:true});
 hooks.drift(true);
}
function mount(h){
 hooks=h;
 dialog=document.createElement('dialog');dialog.id='title-screen';dialog.setAttribute('aria-labelledby','title-name');
 dialog.innerHTML='<div class="title-panel"><p class="title-studio">Eternities</p><h1 id="title-name">Firstlight</h1><p class="title-tag">Everything is already here.</p><nav class="title-menu" aria-label="Title menu"><button type="button" id="title-continue" class="title-primary">Continue</button><button type="button" id="title-new" class="title-primary">New game</button><button type="button" id="title-characters">Characters</button><button type="button" id="title-settings">Settings</button><button type="button" id="title-credits">Credits</button></nav><p class="title-foot">Saved on this device · Firstlight 1.0</p></div>';
 document.body.append(dialog);
 const on=(id,fn)=>dialog.querySelector('#'+id).addEventListener('click',fn);
 on('title-continue',()=>{hide();hooks.resume();});
 on('title-new',()=>hooks.newGame());
 on('title-characters',()=>hooks.characters());
 on('title-settings',()=>{hide(true);hooks.settings();});
 on('title-credits',()=>G.RealmCredits.show(CREDITS,{}));
 dialog.addEventListener('cancel',e=>e.preventDefault());
}
const api={KEY_ROWS,CREDITS,keyTable,mount,show,hide,visible:()=>!!dialog&&dialog.open};
G.RealmTitle=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
