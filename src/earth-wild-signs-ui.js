/* Field-account controller. UI reads real owners and delegates explicit
 * actions; only the app's actual event/render owner can issue observation proof. */
(function(G){'use strict';
const D=G.RealmEarthWildSignsData,R=G.RealmEarthWildSigns;
if(!D||!R)throw Error('Load WildSigns Data/Rules before its field-account interface.');
const TAB='wild-signs',PREFIX='wild-signs-',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const LOOK_REQUEST=freeze({id:'earth-wild-signs-grazer-look-v1',room:D.ROOM,from:{x:D.overlook.x,z:D.overlook.z},yaw:Math.PI/2});
const CONTACT=freeze({id:'wild-signs-pest-contact',name:'Separate pest pocket',x:-164.4,z:-92.8,y:1.57,medium:'dry'});
const button=(text,action,id='',disabled=false)=>'<button type="button" data-rpg="'+PREFIX+action+'" data-quest="'+D.ID+'" data-id="'+esc(id)+'"'+(disabled?' disabled':'')+'>'+esc(text)+'</button>';
const readRecord=sim=>{try{return Object.hasOwn(sim.state,'earthWildSigns')?D.crossValidate(sim.state.earthWildSigns,sim.state):null;}catch{return null;}};
const here=sim=>sim.room===D.ROOM&&!sim.worldDive&&sim.state.adventure.started&&sim.state.adventure.hp>0;
const at=(sim,p)=>here(sim)&&R.at(sim,p);
const outcome=id=>D.resolutions.find(p=>p.id===id);
const readyForObservation=r=>r?.accepted&&!r.observed&&['timber-gouge','feeding-track'].every(id=>r.evidence.includes(id));
function nextPoints(sim){
 const r=readRecord(sim);if(!r||!D.eligible(sim.state)||r.claimed)return[];
 if(!r.accepted||D.ready(r))return[{...D.giver,mark:'S',role:'giver'}];
 const missing=D.evidence.slice(0,2).filter(p=>!r.evidence.includes(p.id));
 if(missing.length)return missing.map(p=>({...p,mark:p.id==='timber-gouge'?'W1':'W2',role:'read'}));
 if(!r.observed)return[{...D.overlook,mark:'W3',role:'observe'}];
 if(!r.evidence.includes('pest-scrape')||r.resolution===null)return[{...D.evidence[2],mark:'W4',role:'read'}];
 return r.resolution==='cleared-pocket'&&!r.cleared?[{...CONTACT,mark:'P',role:'encounter'}]:[];
}
function routePoints(sim,tracked=false){return tracked===true&&here(sim)?nextPoints(sim):[];}
function routeLine(sim,tracked=false){
 const r=readRecord(sim),W=G.RealmWorldFoundations;
 if(tracked!==true||!here(sim)||!r?.accepted||r.resolution!=='signed-loop'||
  !D.bypass.every(p=>W.walkable(D.ROOM,p.x,p.z,.65))||!D.bypass.slice(1).every((p,i)=>W.segment(D.ROOM,D.bypass[i],p,.65)))return[];
 return D.bypass.map(p=>({x:p.x,z:p.z}));
}
function legend(sim,tracked=false){
 const ps=routePoints(sim,tracked),line=routeLine(sim,tracked);if(!ps.length&&!line.length)return'';const r=readRecord(sim);
 return'<section class="wild-signs-map" aria-label="Tracked field account"><h3>Sela’s field account</h3><p>'+esc(r.claimed?'The chosen green bypass remains recorded. Payment was claimed once; no new objective markers are added. Independent patrols remain.':r.resolution==='signed-loop'?'The green course is the chosen supported bypass. Other accepted patrols keep their own creatures.':'Only your next field marks are labelled. Walking and map reading record no evidence.')+'</p><ul>'+ps.map(p=>'<li><strong>'+p.mark+'</strong> '+esc(p.name)+' '+button('Walk near '+p.name,'walk',p.id)+'</li>').join('')+'</ul>'+button('Read this field account','open')+'</section>';
}
function preservedLinks(sim){
 const C=G.RealmEarthConsignmentData;
 return'<nav class="wild-signs-services" aria-label="Existing Earth work">'+(sim.room===D.ROOM?'<button type="button" data-rpg="world-inspect" data-id="elderweald-sela">Read Sela’s earlier wetland advice</button>':'')+
 '<button type="button" data-rpg="expedition-open">Read Rill’s Living Road and patrol</button><button type="button" data-rpg="community-open">Read Merren’s bridge workshop</button>'+
 (C?'<button type="button" data-rpg="consignment-open" data-job="'+C.ID+'" data-id="">Read the separate supplied load</button>':'')+
 '<button type="button" data-rpg="open" data-id="atlas">Local map</button><button type="button" data-rpg="open" data-id="journal">Journal</button>'+
 (sim.room===D.ROOM?'<button type="button" data-rpg="world-return">Return to Firstlight</button>':'<button type="button" data-rpg="world-select" data-id="earthlands">Read the Earth crossing</button>')+'</nav>';
}
class WildSignsUI{
 #owner=null;
 constructor(rpg){this.rpg=rpg;this.notice='';}
 get sim(){return this.rpg.sim;}
 context(){try{const c=this.rpg.api.wildSignsContext?.();return c?.sim===this.sim&&c.definition===D.definition?c:null;}catch{return null;}}
 view(){try{const c=this.context(),gc=c?.grazerContext?.(),O=G.RealmEarthGrazerMotion;if(!gc||gc.sim!==this.sim||gc.active!==c.active||gc.revision!==c.revision)return null;const v=O?.current(gc);return v&&O?.isProjection(v,gc)===true?v:null;}catch{return null;}}
 pendingClearance(){
  // Presentation only. The explicit app callback retains actual private combat
  // provenance and the durable save guard; a runtime lookalike grants no fact.
  try{
   const sim=this.sim,r=readRecord(sim),c=this.context(),rt=sim.adventureRuntime,d=D.enemy,W=G.RealmWorldFoundations,t=sim.worldTrip,h=sim.returnPos,lease=c?.ownerLease;
   if(!here(sim)||!r?.accepted||!r.observed||r.resolution!=='cleared-pocket'||r.cleared||r.claimed||!c||!Number.isSafeInteger(c.revision)||c.revision<0||!lease||typeof lease!=='object'||!Object.isFrozen(lease)||Reflect.ownKeys(lease).length||![Object.prototype,null].includes(Object.getPrototypeOf(lease))||lease!==sim.wildSignsOwnerLease||!t||t.realm!=='earthlands'||t.active!==c.active||typeof c.active!=='string'||!c.active||!h||!['x','z','yaw'].every(k=>Number.isFinite(h[k])&&t.home?.[k]===h[k])||!W?.walkable(D.ROOM,sim.state.player.x,sim.state.player.z,.31)||!rt||rt.room!==D.ROOM||typeof rt.genericTrailSignature!=='string'||rt.trailSignature!==rt.genericTrailSignature+'|'+R.signature(sim)||!Array.isArray(rt.enemies))return null;
   const es=rt.enemies.filter(e=>e?.id===d.id),e=es[0];
   if(es.length!==1||e.hp!==0||e.wildSignsQuest!==D.ID||e.wildSignsOwnerLease!==lease||e.kind!==d.kind||e.radius!==d.radius||e.maxHP!==d.hp||e.damage!==d.damage||e.xp!==0||e.coins!==0||e.ore!==0||e.originX!==d.x||e.originZ!==d.z||e.home?.x!==d.x||e.home?.z!==d.z||!Number.isFinite(e.x)||!Number.isFinite(e.z)||!W.walkable(D.ROOM,e.x,e.z,d.radius))return null;
   const result=rt.wildSignsClearanceResult;
   return{detail:[result?.error||'',result?.warning||''].filter(Boolean).join(' ')};
  }catch{return null;}
 }
 syncOwner(){const c=this.context(),n=[this.sim,this.sim.state,c?.active,c?.ownerLease,this.sim.state.adventure.deaths];if(this.#owner&&n.some((v,i)=>v!==this.#owner[i]))this.notice='';this.#owner=n;}
 reset(reason='presentation'){if(['owner','character','import','travel','death','reload'].includes(reason)){this.notice='';this.#owner=null;}}
 finish(result,paint=true){
  this.syncOwner();this.notice=[result?.text||result?.error||'No confirmation was returned.',result?.warning||''].filter(Boolean).join(' ');
  this.rpg.api.toast?.(this.notice);if(paint)this.rpg.paint();return true;
 }
 verified(result,type,payload){
  if(result?.then!==undefined)return{ok:false,error:'Storage did not return synchronous confirmation. Read the saved account before retrying.'};
  if(result?.ok!==true||result.adopted===false)return result||{ok:false,error:'The field action returned no confirmation.'};
  const r=readRecord(this.sim),retained=r&&(type==='accept'?r.accepted:type==='read'?r.evidence.includes(payload.evidence):type==='observe'?r.observed:type==='choose'?r.resolution===payload.resolution:type==='claim'?r.claimed:type==='clearance'?r.resolution==='cleared-pocket'&&r.cleared:false);
  return retained?result:{ok:false,error:'The action returned without its recorded field fact. Reopen this account before retrying.',warning:result.warning};
 }
 command(type,payload={}){
  if(typeof this.rpg.api.wildSignsCommand!=='function')return{ok:false,error:'This field account’s durable action is unavailable. Existing evidence and payment are retained.'};
  return this.verified(this.rpg.api.wildSignsCommand(type,{quest:D.ID,...payload}),type,payload);
 }
 point(){
  const r=readRecord(this.sim);if(!r||!D.eligible(this.sim.state))return null;
  const ps=[D.giver,...nextPoints(this.sim)].filter(p=>at(this.sim,p));return ps.sort((a,b)=>Math.hypot(a.x-this.sim.state.player.x,a.z-this.sim.state.player.z)-Math.hypot(b.x-this.sim.state.player.x,b.z-this.sim.state.player.z))[0]||null;
 }
 contextLabel(){const p=this.point();return p?'E · '+(p.id===D.giver.id?'Read Sela’s field account':p.id===D.overlook.id?'Read the grazer observation':p.name):null;}
 interact(){if(!this.point())return false;this.rpg.open(TAB);return true;}
 action(el,event){
  const a=el?.dataset?.rpg;if(typeof a!=='string'||!a.startsWith(PREFIX))return false;
  if(el.dataset.quest!==D.ID)return this.finish({ok:false,error:'That control belongs to another field account.'});
  if(el.disabled===true)return true;
  const type=a.slice(PREFIX.length),id=el.dataset.id,r=readRecord(this.sim);
  try{
   if(type==='open'){this.rpg.open(TAB);return true;}
   if(type==='track'){if(!r?.accepted)throw Error('Accept Sela’s account before pinning its next field action.');this.rpg.quest=TAB;this.rpg.paint();return true;}
   if(type==='resume'){this.rpg.close();return true;}
   if(type==='walk'){
    const p=[D.giver,...D.evidence,D.overlook,CONTACT].find(p=>p.id===id);
    if(!p||!here(this.sim)||!D.eligible(this.sim.state))throw Error('Visit dry Earthlands and read this account before walking.');
    const q=G.RealmTrailsUI?.approach(this.sim,p),W=G.RealmWorldFoundations;
    if(!q||!W.walkable(D.ROOM,q.x,q.z,.31)||!W.segment(D.ROOM,q,p,.31)||typeof this.rpg.api.walkLocal!=='function')throw Error('The supported approach is unavailable. Read the local map.');
    this.rpg.close();if(this.rpg.api.walkLocal(q.x,q.z)!==true)return this.finish({ok:false,error:'Walking to this field action was refused. No evidence was recorded.'},false);return true;
   }
   if(type==='look'){
    if(!readyForObservation(r)||!at(this.sim,D.overlook))throw Error('Read both marks and reach the overlook before looking west.');
    if(typeof this.rpg.api.frameGrazer!=='function')throw Error('Grazer framing is unavailable. Your current view and evidence are retained.');
    const result=this.rpg.api.frameGrazer(LOOK_REQUEST);
    if(result?.then!==undefined||result?.ok!==true)return this.finish(result?.ok===false?result:{ok:false,error:'Framing returned no synchronous confirmation.'});
    this.rpg.close();return this.finish(result,false); // Keep actual watching possible; no repaint/reopen.
   }
   if(type==='observe'){
    if(r?.observed)return this.finish({ok:true,text:'The witnessed grazer behavior is already recorded.'});
    if(!readyForObservation(r)||!at(this.sim,D.overlook)||this.view()?.observationReady!==true)throw Error('Watch a complete visible browse outside the menu, then read this account at the overlook.');
    if(!event||typeof this.rpg.api.wildSignsObserve!=='function')throw Error('Use the actual Observe control after watching. The observation action is unavailable.');
    // Forward the original native event by identity. The app owns trusted-event
    // validation, fresh input stamp, opaque ticket and the actual command.
    return this.finish(this.verified(this.rpg.api.wildSignsObserve(event),type,{}));
   }
   if(type==='retry-clearance'){
    if(!this.pendingClearance())throw Error('No current defeated pest is ready for this account’s clearance retry.');
    if(!event||typeof this.rpg.api.wildSignsRetryClearance!=='function')throw Error('Use the actual Retry clearance control. Synchronous clearance saving is unavailable.');
    // Original event only; the app owns event validation and A.retry. UI never
    // changes HP, records clearance, issues tickets or automatically retries.
    return this.finish(this.verified(this.rpg.api.wildSignsRetryClearance(event),'clearance',{}));
   }
   if(type==='accept'){
    if(!r||!D.eligible(this.sim.state)||!r.accepted&&!at(this.sim,D.giver))throw Error('Read Sela’s invitation at her actual position before accepting.');
    return this.finish(this.command('accept'));
   }
   if(type==='read'){
    const p=D.evidence.find(p=>p.id===id);
    if(!r?.accepted||r.claimed||!p||!r.evidence.includes(id)&&(!at(this.sim,p)||id==='pest-scrape'&&!r.observed))throw Error('Reach this current field mark before recording it; the separate scrape follows observation.');
    return this.finish(this.command('read',{evidence:id}));
   }
   if(type==='choose'){
    if(!r?.accepted||r.claimed||!outcome(id)||!r.observed||r.evidence.length!==3||r.resolution===null&&!at(this.sim,D.evidence[2]))throw Error('Compare the three recorded marks at the scrape before choosing a response.');
    return this.finish(this.command('choose',{resolution:id}));
   }
   if(type==='claim'){
    if(!r||!r.claimed&&(!D.ready(r)||!at(this.sim,D.giver)))throw Error('Resolve the chosen response and return to Sela before claiming.');
    return this.finish(this.command('claim'));
   }
   throw Error('Unknown field-account control.');
  }catch(e){return this.finish({ok:false,error:e.message});}
 }
 panel(){
  this.syncOwner();const sim=this.sim,r=readRecord(sim),eligible=D.eligible(sim.state),nearSela=at(sim,D.giver),links=preservedLinks(sim);
  if(!r)return'<article class="wild-signs-panel" data-wild-signs-panel><h3>Sela’s field account</h3><p>This account cannot be read from the current save. Existing work remains retained.</p>'+links+'</article>';
  const c=G.RealmEarthConsignmentData?.choice(sim.state.localLife?.records?.[G.RealmEarthConsignmentData.ID]?.choice),observed=r.observed;
  let html='<article class="wild-signs-panel" data-wild-signs-panel aria-labelledby="wild-signs-title"><header><h3 id="wild-signs-title">'+esc(D.definition.title)+'</h3><p>A roadworker blames the moss-backed grazer for the scar in the roadside timber. Sela is not convinced. Bring her the marks and a witnessed account of the animal before the accusation becomes the village story.</p></header>'+
   '<p class="wild-signs-payment"><strong>Separate payment:</strong> 4 sunmarks and 3 fibre, once from Sela after the chosen response. No acceptance cost, XP or ore. Earlier kits, repairs and payments retain their own accounts.</p>'+
   '<p class="wild-signs-notice" data-wild-signs-notice role="status" aria-live="polite">'+esc(this.notice)+'</p>';
  if(!r.accepted){
   html+='<section aria-label="Sela’s invitation"><h4>Read before accepting</h4><p>'+esc(eligible?'The supplier-owned load is delivered and explicitly paid. The repaired road remains usable. Sela asks for an accurate account, not a new cargo allocation.':'First deliver the supplied load and explicitly claim its separate payment from Merren. Sela’s investigation remains optional.')+'</p>'+
    '<p>Inspect two different marks, witness the harmless grazer, compare the separate pest scrape and choose a signed walking loop or one new pest encounter. Return to Sela to claim.</p>'+
    '<p class="wild-signs-danger">The new skitter has 72 health and 9 damage, with no kill loot or XP. The signed loop resolves this account without that fight. Independent earlier patrols remain; the northern approach can meet them. The longer southern approach through the return glade remains available.</p>';
   if(eligible&&here(sim))html+=nearSela?button('Accept Sela’s investigation','accept'):button('Walk to Sela','walk',D.giver.id);
   html+='</section>';
  }else{
   html+='<p class="wild-signs-source">'+esc(c?c.branch==='stormfall-recovery'?'Your original stormfall choice and delivered short timber remain recorded.':'Your original managed-coppice choice and delivered fibre remain recorded.':'The earlier supplied load retains its own record.')+'</p>';
   if(r.claimed)html+='<section class="wild-signs-retained"><h4>Corrected account · paid once</h4><p>'+esc(r.resolution==='signed-loop'?'The supported bypass is recorded. The grazer’s refuge remains, and the separate pest account was resolved without that fight.':'The distinct pest pocket is recorded clear. The grazer remains harmless; that encounter granted no kill loot or XP.')+'</p><p>“I have changed the road notice,” Sela says. “The grazer feeds here; the burrowing marks belong to something else. Let the next traveller hear the right account.”</p><p>Sela already paid this separate 4-sunmark and 3-fibre account.</p></section>';
   else if(D.ready(r)){
    const max=G.RealmSandbox?.MAX,full=sim.state.adventure.coins+4>9999||!Number.isSafeInteger(max)||sim.state.sandbox.inventory.fiber+3>max;
    html+='<section><h4>Response recorded · payment unclaimed</h4><p>'+esc(outcome(r.resolution)?.name)+'. Return physically to Sela. '+(full?'Make room for all 4 sunmarks and 3 fibre; completed work stays ready.':'Collect the complete payment once, when you choose.')+'</p>'+
     (here(sim)?nearSela?button('Claim 4 sunmarks and 3 fibre once','claim'):button('Walk back to Sela','walk',D.giver.id):'')+'</section>';
   }else{
    const marks='<ol>'+D.evidence.slice(0,2).map(p=>'<li><strong>'+esc(p.name)+'</strong><p>'+esc(p.text)+'</p>'+(r.evidence.includes(p.id)?'<span class="wild-signs-kept">Recorded</span>':here(sim)?at(sim,p)?button('Read and record this mark','read',p.id):button('Walk to '+p.name,'walk',p.id):'')+'</li>').join('')+'</ol>';
    html+=D.evidence.slice(0,2).every(p=>r.evidence.includes(p.id))?'<details class="wild-signs-evidence"><summary>Read the two recorded marks</summary>'+marks+'</details>':'<section class="wild-signs-evidence"><h4>Your next field marks</h4>'+marks+'</section>';
    if(readyForObservation(r)){
     const v=this.view(),near=at(sim,D.overlook),ready=near&&v?.observationReady===true,canObserve=typeof this.rpg.api.wildSignsObserve==='function';
     html+='<section class="wild-signs-observation"><h4>Watch before naming the animal</h4><p>From the overlook, face west toward the moss-backed grazer. See it lower its head, browse, recover and resume walking. A clear view matters; approach alone records nothing.</p><p>V swaps third person and diorama. The default diorama direction may hide it behind canopy. Look west deliberately; your camera style stays yours.</p>'+
      (here(sim)?near?button('Look west toward the grazer','look')+button('Resume watching outside this menu','resume')+button('Observe and record this behavior','observe','',!ready||!canObserve):button('Walk to the west-side overlook','walk',D.overlook.id):'')+
      '<p data-wild-signs-readiness>'+esc(ready&&canObserve?'A complete visible browse was witnessed. Opening this menu kept it ready; use Observe to record it.':ready?'Observation recording is unavailable. Your witnessed browse remains ready.':!v?'Observation controls are unavailable. Your saved evidence is retained.':'This menu pauses the world. Close it to watch the complete action; E reopens this account. P controls your own pause.')+'</p></section>';
    }else if(observed){
     const p=D.evidence[2];html+='<section><h4>Compare the separate scrape</h4><p>The witnessed broad feeding action differs from the narrow fresh gouge. '+esc(p.text)+'</p>'+(r.evidence.includes(p.id)?'<p class="wild-signs-kept">All three marks are recorded.</p>':here(sim)?at(sim,p)?button('Read and record the pest scrape','read',p.id):button('Walk to the pest scrape','walk',p.id):'')+'</section>';
     if(r.evidence.length===3&&r.resolution===null){html+='<fieldset class="wild-signs-outcomes"><legend>Choose a response at the scrape</legend><p>The recorded choice stays fixed. Both responses return to Sela for the same separate payment.</p>'+D.resolutions.map(p=>'<section><h4>'+esc(p.name)+'</h4><p>'+esc(p.text)+'</p>'+button(p.id==='signed-loop'?'Mark the supported walking loop':'Choose the separate pest encounter','choose',p.id,!at(sim,D.evidence[2]))+'</section>').join('')+(here(sim)&&!at(sim,D.evidence[2])?button('Walk back to the comparison point','walk',D.evidence[2].id):'')+'</fieldset>';}
     if(r.resolution==='cleared-pocket'&&!r.cleared){
      const pending=this.pendingClearance();
      html+=pending?'<section class="wild-signs-danger"><h4>Pest is down · clearance unsaved</h4><p>The actual current pest is defeated, but this account has no saved clearance. No kill loot or XP was granted. Retry explicitly while this outing and owner remain current; opening this account does not retry.</p><p>'+esc(pending.detail)+'</p>'+button('Retry clearance save','retry-clearance','',typeof this.rpg.api.wildSignsRetryClearance!=='function')+'<p>If you reload or leave this outing before recording clearance, only the unsaved encounter may restart. Sela’s separate payment remains unclaimed.</p></section>':'<section class="wild-signs-danger"><h4>Chosen response · separate pest still uncleared</h4><p>Deliberately approach the marked south-west pocket. Tab selects; 1 toggles ordinary autoattack. Move or brace during its tell. The actual new skitter defeat records this response; old defeats do not. The grazer is never a combat target.</p>'+(here(sim)?button('Walk near the separate pest pocket','walk',CONTACT.id):'')+'</section>';
     }
    }
   }
   html+=button('Pin this field account','track');
  }
  if(!here(sim))html+='<p>Revisit dry Earthlands to continue at the recorded field action. Your original home checkpoint remains available.</p>';
  return html+'<details class="wild-signs-recovery"><summary>Saved work and watching</summary><p>Accepted work, recorded evidence, outcome and payment survive saving. Menus pause the current browse without recording it. Leaving Earthlands, switching characters or reloading ends an unfinished observation; revisit the overlook to watch again. A refused save keeps recorded work and an already prepared observation ready for retry. Going home is free.</p></details>'+links+'</article>';
 }
 page(tab){return tab===TAB?{title:'Sela’s field account',html:this.panel()}:null;}
 tracker(){
  const r=readRecord(this.sim);if(!r?.accepted)return null;
  const v=readyForObservation(r)?this.view():null,p=nextPoints(this.sim)[0];
  return{title:D.definition.title,detail:r.claimed?'Paid once · read the retained account':!here(this.sim)?'Revisit dry Earthlands to continue':D.ready(r)?'Response recorded · return to Sela for payment':v?.observationReady?'Browse witnessed · E opens Observe at the overlook':r.resolution==='cleared-pocket'?(this.pendingClearance()?'Pest down · clearance unsaved · use explicit Retry':'Separate new pest still uncleared'):p?.id===D.overlook.id?'Look west · watch the complete browse':p?.name||'Compare the three marks at the pest scrape',progress:r.evidence.length+'/3 marks · '+(r.observed?'behavior recorded':'behavior unrecorded')+' · J account · M map · V view'};
 }
 journal(){const r=readRecord(this.sim);return'<section class="wild-signs-journal"><h3>'+esc(D.definition.title)+'</h3><p>'+esc(!r?'Current field account unavailable. Existing work is retained.':r.claimed?'Corrected account paid once. The chosen response and older work remain.':r.accepted?this.tracker().detail:D.eligible(this.sim.state)?'The delivered load leaves time to inspect the marks beside the repaired road. Speak to Sela; acceptance stays deliberate.':'First deliver and explicitly claim the supplied load from Merren.')+'</p>'+button('Read Sela’s account','open')+(r?.accepted?button('Pin this account','track'):'')+'</section>';}
 tick(){
  if(typeof document==='undefined')return;const r=readRecord(this.sim),control=document.querySelector('.tracker-switch [data-id="'+TAB+'"]');
  if(control){control.hidden=!r?.accepted;control.setAttribute('aria-pressed',String(this.rpg.quest===TAB));}
  if(this.rpg.quest!==TAB)return;const t=this.tracker();if(!t)return;
  for(const[id,text]of[['tracked-chapter','Sela’s field account'],['tracked-title',t.title],['tracked-detail',t.detail],['tracked-progress',t.progress]]){const el=document.querySelector('#'+id);if(el)el.textContent=text;}
 }
}
const api=Object.freeze({WildSignsUI,LOOK_REQUEST,CONTACT,routePoints,routeLine,legend});G.RealmEarthWildSignsUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
