/* rolling credits. Esc, a click or a key skips; reduced motion gets still text instead of a roll. */
(function(G){'use strict';
const PACE=36;// pixels per second
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function normalize(sections){
 return (Array.isArray(sections)?sections:[]).map(s=>({title:String(s&&s.title||'').trim(),lines:(Array.isArray(s&&s.lines)?s.lines:[]).map(l=>String(l).trim()).filter(Boolean)})).filter(s=>s.title||s.lines.length);
}
let dialog=null,finisher=null;
function ensure(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='credits-screen';dialog.setAttribute('aria-label','Credits');
 dialog.innerHTML='<div class="credits-roll"><div class="credits-track"></div></div><button type="button" class="credits-skip">Skip</button>';
 document.body.append(dialog);
 dialog.addEventListener('click',()=>finisher&&finisher());
 dialog.addEventListener('cancel',e=>{e.preventDefault();finisher&&finisher();});
 dialog.addEventListener('keydown',e=>{if(['Escape','Enter',' '].includes(e.key)){e.preventDefault();finisher&&finisher();}});
 return dialog;
}
function show(sections,opts={}){
 const d=ensure(),list=normalize(sections),track=d.querySelector('.credits-track');
 track.innerHTML=list.map(s=>'<section class="credits-section">'+(s.title?'<h2>'+esc(s.title)+'</h2>':'')+s.lines.map(l=>'<p>'+esc(l)+'</p>').join('')+'</section>').join('')+'<p class="credits-end">Thank you for playing.</p>';
 const still=!!opts.still||(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
 let raf=0,start=0,done=false;
 const finish=()=>{if(done)return;done=true;finisher=null;cancelAnimationFrame(raf);if(d.open)d.close();if(opts.onDone)opts.onDone();};
 finisher=finish;
 d.classList.toggle('still',still);
 if(!d.open)d.showModal();
 d.querySelector('.credits-skip').textContent=still?'Back':'Skip';
 if(still){track.style.transform='';d.querySelector('.credits-skip').focus({preventScroll:true});return{close:finish};}
 const H=d.clientHeight;
 const step=now=>{
  if(done)return;
  if(!start)start=now;
  const y=H-PACE*(now-start)/1000;
  track.style.transform='translate3d(0,'+y.toFixed(1)+'px,0)';
  if(y+track.offsetHeight<0)finish();else raf=requestAnimationFrame(step);
 };
 track.style.transform='translate3d(0,'+H+'px,0)';
 raf=requestAnimationFrame(step);
 return{close:finish};
}
const api={normalize,show};
G.RealmCredits=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
