/* The finale's panel. Reading the page performs no work. The offer is the only button that changes the story; it goes
 * through the same character command as every other action, bound to the revision the page was drawn for. */
(function(G){'use strict';
const H=()=>G.RealmEarthHomecoming,D=()=>H().definition,FIN=()=>G.RealmFinale,TAB='earth-homecoming',PREFIX='earth-homecoming-';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,id='',attrs='')=>'<button data-rpg="'+PREFIX+type+'" data-id="'+esc(id)+'" '+attrs+'>'+esc(label)+'</button>';
const phase=sim=>sim.state.saga?.finale?.phase??0;
const activeFinale=sim=>phase(sim)>=1&&phase(sim)<=3&&!sim.state.saga.finale.won&&!sim.state.saga.credits;
const offerPending=sim=>phase(sim)===3&&(sim.state.earthHomecoming?.finale?.offer??null)===null&&!sim.state.saga.finale.won;
const nearSpring=sim=>Math.hypot(sim.state.player.x-D().spring.x,sim.state.player.z-D().spring.z)<=FIN().timing().offerRange;
// the credits: the shell's own roll when it exists, otherwise a plain overlay that reads the same table.
function showCredits(onDone){
 const E=G.RealmEpilogueData;if(G.RealmCredits?.show){G.RealmCredits.show(E.CREDITS,{onDone});return;}
 const doc=G.document;if(!doc){onDone?.();return;}
 const box=doc.createElement('section');box.id='finale-credits';box.setAttribute('aria-label','Credits');
 box.style.cssText='position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:#111513f2;color:#f1e7cf;overflow:auto;padding:24px;text-align:center';
 box.innerHTML=E.CREDITS.map(s=>'<h2>'+esc(s.title)+'</h2>'+s.lines.map(l=>'<p>'+esc(l)+'</p>').join('')).join('')+button('Keep exploring','credits-done','','id="finale-credits-done"');
 doc.body.appendChild(box);
 box.querySelector('#finale-credits-done').onclick=()=>{box.remove();onDone?.();};
}
class EarthHomecomingUI{
 constructor(rpg){this.rpg=rpg;this.binding=null;this.opened=false;this.creditsShown=false;}
 get sim(){return this.rpg.sim;}
 reset(){this.binding=null;}
 owner(){const s=this.sim,c=this.rpg.api.worldContext();return{sim:s,state:s.state,active:c.active,revision:s.state.adventure.revision,room:s.room};}
 same(b){if(!b)return false;const c=this.owner();return b.sim===c.sim&&b.state===c.state&&b.active===c.active&&b.revision===c.revision&&b.room===c.room;}
 // a Regent in reach is the only interaction; the route and the walk are not part of the finale any more.
 point(){return this.sim&&activeFinale(this.sim)&&nearSpring(this.sim)?{x:D().spring.x,z:D().spring.z,name:D().title}:null;}
 context(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){if(!this.point())return false;this.open();return true;}
 open(){this.rpg.open(TAB);}
 action(el){
  const action=el.dataset.rpg;if(!action?.startsWith(PREFIX))return false;const type=action.slice(PREFIX.length),id=el.dataset.id,s=this.sim;
  if(type==='open'){this.open();return true;}
  if(type==='credits-done')return true;
  if(type!=='offer')return true;
  if(!this.same(this.binding)||!offerPending(s)||!nearSpring(s)){this.binding=null;this.rpg.api.toast('The Regent is not waiting on an answer here. Read the page again.');this.rpg.paint();return true;}
  const result=this.rpg.api.earthHomecomingCommand('offer',{quest:D().id,expectedActive:this.binding.active,expectedRevision:this.binding.revision,choice:id});
  this.binding=null;this.rpg.api.toast(result.text||result.error);this.rpg.paint();return true;
 }
 routePoints(){return[];}
 legend(){return'';}
 page(tab){return tab===TAB?this.panel():null;}
 panel(){
  const s=this.sim,d=D(),ph=phase(s),echo=G.RealmSaga.echoLedger(s.state),plan=H().plan(s),brokenIds=s.state.earthHomecoming?.finale?.broken||[];
  this.binding={...this.owner()};const attrs='data-binding="1"';
  const title=ph>=1&&ph<=3?FIN().text('phaseTitle'+ph):'';
  let html='<article class="earth-homecoming"><header><h2>'+esc(d.title)+'</h2><p>'+esc(d.summary)+'</p></header>';
  if(s.state.saga.finale.won)html+='<section class="earth-homecoming-recorded"><h3>The Regent is gone</h3><p>'+esc(d.completionText)+'</p></section>';
  else if(ph===0)html+='<section><h3>Not yet</h3><p>He is not at the spring yet. Finish the road home first.</p></section>';
  else{
   html+='<section><h3>'+esc(title)+'</h3><p>'+esc(FIN().text('phaseDetail'+ph))+'</p>';
   if(ph===1)html+='<p>'+esc(brokenIds.length)+' of '+esc(plan.chains.length)+' chains broken.</p>';
   html+='</section>';
   if(echo.coercive.length||echo.freeing.length){
    html+='<section><h3>What he holds of you</h3><ul class="earth-homecoming-echo">'+[...echo.coercive,...echo.freeing].map(e=>'<li>'+esc(e.line)+'</li>').join('')+'</ul></section>';
   }
   if(offerPending(s))html+='<section class="earth-homecoming-offer"><h3>'+esc(FIN().text('offer'))+'</h3>'+button(FIN().text('refuse'),'offer','refuse',attrs)+' '+button(FIN().text('take'),'offer','take',attrs)+'</section>';
  }
  return{title:d.title,html:html+'<p class="earth-homecoming-footer">Reading this page does nothing. The Regent answers only at the spring junction.</p></article>'};
 }
 tick(){
  const s=this.sim,r=H().runtime(s);
  if(offerPending(s)&&!this.opened){this.opened=true;this.open();}
  if(!offerPending(s))this.opened=false;
  if(r.credits&&!this.creditsShown){this.creditsShown=true;showCredits(()=>{r.creditsDone=true;});}
 }
}
const api={EarthHomecomingUI,routePoints:()=>[],legend:()=>'',nearSpring};
G.RealmEarthHomecomingUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
