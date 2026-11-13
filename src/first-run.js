/* first steps for a new world. The flags live in core.js (sim.act 'first-run'); this module only shows them. */
(function(G){'use strict';
const STEPS=[['move','Walk with W A S D, or click the ground.'],['camera','Turn the view: drag it, scroll, or press V.'],['attack','Strike a foe with F, or press 1 to keep striking.'],['interact','Use what is in front of you with E.']];
const visible=f=>!!f&&!f.dismissed;
const rows=f=>STEPS.map(([id,text])=>({id,text,done:!!f[id]}));
function mount(onSkip){
 const el=document.createElement('aside');el.id='first-run';el.setAttribute('aria-label','First steps');el.hidden=true;
 el.innerHTML='<p class="first-run-kicker">First steps</p><ol class="first-run-steps"></ol><button id="first-run-skip" type="button">Skip these steps</button>';
 el.querySelector('#first-run-skip').addEventListener('click',onSkip);
 document.querySelector('#hud').append(el);
 return el;
}
// repaint only when a flag changed; refreshUI calls this several times a second.
function paint(el,f){
 if(!el||!f)return;
 const show=visible(f),sig=show?rows(f).map(r=>r.done?1:0).join(''):'hidden';
 if(el.dataset.sig===sig)return;
 el.dataset.sig=sig;el.hidden=!show;
 if(!show)return;
 el.querySelector('ol').innerHTML=rows(f).map(r=>'<li class="'+(r.done?'done':'')+'"><span class="first-run-mark" aria-hidden="true">'+(r.done?'✓':'')+'</span><span>'+r.text+'</span><span class="sr-only">'+(r.done?'Done':'To do')+'</span></li>').join('');
}
const api={STEPS,visible,rows,mount,paint};
G.RealmFirstRun=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
