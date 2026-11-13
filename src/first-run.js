/* first steps for a new world. The flags live in core.js (sim.act 'first-run'); this module only shows them. */
(function(G){'use strict';
// touch players get the taps for the same intent; a key cap they cannot press would be a dead instruction.
const KEYS=[['move','Walk with W A S D, or click the ground.'],['camera','Turn the view: drag it, scroll, or press V.'],['attack','Strike a foe with F, or press 1 to keep striking.'],['interact','Use what is in front of you with E.']];
const TOUCH=[['move','Tap the ground to walk.'],['camera','Drag to turn the view. Pinch to zoom.'],['attack','Tap Strike when a foe is near.'],['interact','Tap the prompt at the bottom to use what is in front of you.']];
const visible=f=>!!f&&!f.dismissed;
const rows=(f,touch)=>(touch?TOUCH:KEYS).map(([id,text])=>({id,text,done:!!f[id]}));
function mount(onSkip){
 const el=document.createElement('aside');el.id='first-run';el.setAttribute('aria-label','First steps');el.hidden=true;
 el.dataset.touch=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches?'1':'0';
 el.innerHTML='<p class="first-run-kicker">First steps</p><ol class="first-run-steps"></ol><button id="first-run-skip" type="button">Skip these steps</button>';
 el.querySelector('#first-run-skip').addEventListener('click',onSkip);
 document.querySelector('#hud').append(el);
 return el;
}
// repaint only when a flag changed; refreshUI calls this several times a second.
function paint(el,f){
 if(!el||!f)return;
 const touch=el.dataset.touch==='1',show=visible(f),sig=show?rows(f,touch).map(r=>r.done?1:0).join(''):'hidden';
 if(el.dataset.sig===sig)return;
 el.dataset.sig=sig;el.hidden=!show;
 if(!show)return;
 el.querySelector('ol').innerHTML=rows(f,touch).map(r=>'<li class="'+(r.done?'done':'')+'"><span class="first-run-mark" aria-hidden="true">'+(r.done?'✓':'')+'</span><span>'+r.text+'</span><span class="sr-only">'+(r.done?'Done':'To do')+'</span></li>').join('');
}
const api={KEYS,TOUCH,visible,rows,mount,paint};
G.RealmFirstRun=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
