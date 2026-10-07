/* The supplied load's UI reads canonical records and real motion. Reading,
 * map markers and walking cannot earn an arrival or its separate payment. */
(function(G){'use strict';
const D=G.RealmEarthConsignmentData,PREFIX='consignment-';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names=Object.freeze({'load-glade':'Elderweald return glade','meadow-stop':'Meadow road','field-return-stop':'Field return lane','field-gate-stop':'Field gate','settlement-approach':'Settlement approach','merren-receiving-bay':'Merren’s receiving bay','root-south-stop':'Southern root approach','root-mouth-stop':'Root passage mouth','wetland-south-stop':'Southern wetland lane','wetland-north-stop':'Northern wetland lane','wetland-check-stop':'Wetland check','camp-stop':'Woodland camp','north-pocket-bypass':'Northern clearing bypass','west-spur-join':'West spur','west-lane-north':'Northern west lane','west-lane-stop':'West settlement lane'});
const name=p=>names[p?.id]||p?.name||'Carrier stop';
const button=(label,action,id='')=>'<button type="button" data-rpg="'+PREFIX+action+'" data-job="'+D.ID+'" data-id="'+esc(id)+'">'+esc(label)+'</button>';
const record=sim=>{try{const source=G.RealmEarthExpedition.validate(sim.state.earthExpedition);return D.crossValidate(sim.state.localLife?.records?.[D.ID],source);}catch{return null;}};
const at=(sim,p)=>sim.room===D.ROOM&&!sim.worldDive&&G.RealmLocalLife.at(sim,p);
function routePoints(sim,ctx){
 const r=record(sim);if(!r||sim.room!==D.ROOM)return[];
 if(!r.accepted)return sim.state.adventure.started&&sim.state.earthExpedition.story.claimed?[{...D.definition.giver,kind:'giver',quest:D.ID,mark:'L1',name:'Read the supplied load at the glade'}]:[];
 if(r.claimed)return[];
 if(r.steps.length===D.required(r).length)return[{...D.definition.returner,kind:'giver',quest:D.ID,mark:'L1',name:'Merren · claim the separate load payment'}];
 const M=G.RealmEarthConsignmentMotion,view=ctx?.sim===sim&&typeof M?.current==='function'?M.current(ctx):null,p=view&&M?.isProjection?.(view,ctx)===true?view:D.checkpoint(r);
 return[{id:'carrier',x:p.x,z:p.z,y:1.57,medium:'dry',kind:'work',quest:D.ID,mark:'L1',name:'Supplied carrier · '+name(view?.ready?view.next:view?.checkpoint||D.checkpoint(r))}];
}
function routeLine(sim){
 const r=record(sim);if(!r?.accepted||r.claimed||sim.room!==D.ROOM)return[];
 const route=D.routes[D.choice(r.choice).route],points=[{x:route[0].x,z:route[0].z}],C=G.RealmCore,W=G.RealmWorldFoundations;
 for(let i=1;i<route.length;i++){
  let path;try{path=C.pathfind(route[i-1],route[i],{id:D.ROOM},false,.65);}catch{return[];}
  if(!Array.isArray(path)||!path.length||Math.hypot(path.at(-1).x-route[i].x,path.at(-1).z-route[i].z)>1e-9)return[];
  for(const p of path){if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||!W.segment(D.ROOM,points.at(-1),p,.65))return[];points.push({x:p.x,z:p.z});}
  if(points.length>512)return[];
 }
 return points;
}
function legend(sim){
 const points=routePoints(sim,sim.consignmentPresentationContext);if(!points.length)return'';
 const r=record(sim),heading=r.accepted?'The supplied load · chosen route':'Rill’s supplied load · read the board',detail=r.accepted?'The blue dotted course follows supported roads. L1 marks the supplied carrier or its receiving steward. Stay beside the carrier until it stops, then deliberately record that arrival.':'L1 marks Rill’s signed supply board. Read the two courses and the separate payment before choosing one; no load or course has been accepted.';
 return'<section class="local-life-map consignment-map"><h3>'+heading+'</h3><p>'+detail+'</p>'+points.map(p=>'<p><strong>'+esc(p.mark)+'</strong> · '+esc(p.name)+' '+button('Walk near this load work','walk',p.id==='first-load-board'?'giver':p.id==='merren'?'return':'carrier')+'</p>').join('')+button('Read this load, its route and separate payment','open')+'</section>';
}
class ConsignmentUI{
 #noticeOwner=null;
 constructor(rpg){this.rpg=rpg;this.notice='';}
 get sim(){return this.rpg.sim;}
 context(){const ctx=this.rpg.api.consignmentContext?.();return ctx?.sim===this.sim?ctx:null;}
 live(){const ctx=this.context(),M=G.RealmEarthConsignmentMotion,v=ctx&&typeof M?.current==='function'?M.current(ctx):null;return v&&M?.isProjection?.(v,ctx)===true?v:null;}
 point(){
  const r=record(this.sim);if(!r||r.claimed)return null;
  return routePoints(this.sim,this.context()).find(p=>at(this.sim,p))||null;
 }
 contextLabel(){const p=this.point();return p?'E · '+p.name:null;}
 interact(){if(!this.point())return false;this.rpg.civic.selected='earthlands';this.rpg.civic.tracked=D.ID;this.rpg.open('local-life');return true;}
 syncNoticeOwner(){const ctx=this.context(),next=[this.sim,this.sim.state,ctx?.active,ctx?.ownerLease,this.sim.state.adventure.deaths];if(this.#noticeOwner&&next.some((v,i)=>v!==this.#noticeOwner[i]))this.notice='';this.#noticeOwner=next;}
 reset(reason='presentation'){if(['owner','character','import','travel','death','reload'].includes(reason)){this.notice='';this.#noticeOwner=null;}}
 finish(result,paint=true){this.syncNoticeOwner();this.notice=[result?.text||result?.error||'',result?.warning||''].filter(Boolean).join(' ');if(this.notice)this.rpg.api.toast?.(this.notice);if(paint)this.rpg.paint();return true;}
 command(type,payload={}){
  if(typeof this.rpg.api.localLifeCommand!=='function')return{ok:false,error:'The durable load command is unavailable. No payment or arrival was adopted.'};
  const result=this.rpg.api.localLifeCommand(type,{...payload,quest:D.ID});
  if(result?.then)return{ok:false,error:'Load storage did not return synchronous confirmation. Read its saved checkpoint before retrying.'};
  if(result?.ok&&!result.duplicate&&['accept','step'].includes(type)&&record(this.sim)?.accepted){this.rpg.civic.tracked=D.ID;this.rpg.quest='local-life';}
  return result||{ok:false,error:'Load command returned no confirmation.'};
 }
 advance(continueRoute){
  const M=G.RealmEarthConsignmentMotion,ctx=this.context(),r=record(this.sim),v=this.live();
  if(!ctx||!r?.accepted||r.claimed||!v)return this.finish({ok:false,error:'Read the current accepted load and its carrier before continuing.'});
  let savedResult=null;
  if(v.ready){
   const step=D.required(r)[r.steps.length],proof=M.arrivalTicket(ctx);
   if(!proof.ok)return this.finish(proof);
   const result=this.command('step',{step,motionTicket:proof.ticket});if(!result.ok)return this.finish(result);
   const saved=record(this.sim);if(saved?.steps[r.steps.length]!==step||saved.steps.length!==r.steps.length+1)return this.finish({ok:false,error:'Arrival returned without its exact saved checkpoint. Read the load before continuing.'});
   if(!continueRoute||saved.steps.length===D.required(saved).length)return this.finish(result);savedResult=result;
  }else if(!continueRoute)return this.finish({ok:false,error:'Physically reach the marked stop with the carrier before recording arrival.'});
  // Dialogs pause the real world. Close presentation before requesting motion;
  // this preserves the app lease and obtains a fresh current context.
  this.rpg.close?.();
  const result=this.rpg.api.consignmentControl?.('continue')||{ok:false,error:'Carrier motion is unavailable.'};
  const moving=result.ok&&result.view?.status==='moving';
  const continuation=moving?'The carrier is continuing. Stay nearby until it stops at '+name(result.view.next)+'. The blue dotted course is on the map.':result.ok?'The carrier is waiting: '+(result.view?.detail||result.view?.reason||'read its current position before continuing')+'.':result.error||'The carrier could not continue.';
  // Saved arrival is already durable even if following motion/cleanup fails.
  // Preserve its truthful completion and warnings through the combined action.
  return this.finish(savedResult?{ok:true,text:savedResult.text+' '+continuation,warning:[savedResult.warning,result.warning].filter(Boolean).join(' ')}:result.ok?{...result,text:continuation}:result,false);
 }
 action(el){
  const action=el?.dataset?.rpg;if(!action?.startsWith(PREFIX))return false;
  if(el.dataset.job!==D.ID)return this.finish({ok:false,error:'That load control belongs to another commission.'});
  const type=action.slice(PREFIX.length),r=record(this.sim);
  if(type==='continue')return this.advance(true);
  if(type==='record')return this.advance(false);
  if(type==='wait'){const result=this.rpg.api.consignmentControl?.('wait')||{ok:false,error:'Carrier motion is unavailable.'};return this.finish(result.ok?{...result,text:'The carrier will wait here until you deliberately continue. Reload keeps the last recorded stop.'}:result);}
  if(type==='accept')return this.finish(this.command('accept',{choice:el.dataset.id}));
  if(type==='claim')return this.finish(this.command('claim'));
  if(type==='walk'){
   const id=el.dataset.id,p=id==='giver'?D.definition.giver:id==='return'?D.definition.returner:id==='carrier'?routePoints(this.sim,this.context())[0]:null;
   if(!p||this.sim.room!==D.ROOM||this.sim.worldDive)return this.finish({ok:false,error:'Visit dry Earthlands and read the current load route.'});
   const q=G.RealmTrailsUI.approach(this.sim,p);this.rpg.close?.();this.rpg.api.walkLocal(q.x,q.z);return true;
  }
  if(type==='open'){this.rpg.civic.selected='earthlands';this.rpg.open('local-life');return true;}
  return this.finish({ok:false,error:'Unknown supplied-load control.'});
 }
 panel(){
  this.syncNoticeOwner();
  const sim=this.sim,r=record(sim);if(!r)return'<article data-consignment-panel><p>This load’s source allocation cannot be validated. Existing work is retained.</p></article>';
  const here=sim.room===D.ROOM&&!sim.worldDive,paid=!!sim.state.earthExpedition.story.claimed,eligible=paid&&sim.state.adventure.started,branch=sim.state.earthExpedition.story.branch;
  let html='<article class="local-life-card" data-local-quest="'+D.ID+'" data-consignment-panel><small>COASTWARD · '+(r.claimed?'PAID ONCE':r.accepted?'ACCEPTED SUPPLIED LOAD':'OPTIONAL SUPPLIED LOAD')+'</small><h3>'+esc(D.definition.title)+'</h3><p>'+esc(D.definition.summary)+'</p><p><strong>Route and danger:</strong> Choose the southern meadow road or the longer northern root road. Stay near the carrier. Nearby living threats, leaving the area or your retreat make it wait. There is no deadline.</p><p><strong>Separate payment:</strong> 4 sunmarks · 2 timber · 2 meadow fibre · no XP. Claim once from Merren after delivery. Your kit, earlier payments and installed support remain yours.</p><p data-consignment-notice role="status" aria-live="polite">'+esc(this.notice)+'</p>';
  if(!r.accepted){
   html+='<p>'+(!sim.state.adventure.started?'Collect Oren’s initial expedition kit first.':!paid?'Finish and deliberately claim Rill’s original Living Road work first. This is a new supplied load; the earlier allocation is not spent again.':'A camp supplier has left '+(branch==='stormfall-recovery'?'four short timbers':'three binding-fibre bundles')+' with a carrier at the return glade. Choose one route there.')+'</p>';
   for(const c of D.choices.filter(c=>c.branch===branch)){
    html+='<div class="local-life-choice"><strong>'+esc(c.name)+'</strong><p>'+esc(c.route==='southern-meadow'?'Through meadow and fields to the receiving bay. Five arrival checkpoints.':'Through the root passage, wetland and woodland camp, then the west settlement lane. Twelve arrival checkpoints.')+'</p>';
    if(here&&eligible&&at(sim,D.definition.giver))html+=button('Accept this course','accept',c.id);html+='</div>';
   }
   if(here&&eligible&&!at(sim,D.definition.giver))html+=button('Walk to the consignment board','walk','giver');
  }else{
   const chosen=D.choice(r.choice),list=D.required(r),v=this.live(),route=D.routes[chosen.route];
   html+='<p><strong>Chosen course:</strong> '+esc(chosen.name)+'</p><p>Recorded stops: '+r.steps.length+' of '+list.length+'. Reload or leaving Earthlands resumes the last recorded stop; an unfinished leg returns there. Going home is free. Reading a dialog pauses the carrier at its current position.</p>';
   if(r.claimed)html+='<p class="local-life-complete">'+esc(D.definition.completionText)+'</p>';
   else if(r.steps.length===list.length)html+='<p><strong>Delivered · separate payment still unpaid.</strong> The actual load remains at the receiving bay. Return to Merren.</p>'+(here&&at(sim,D.definition.returner)?button('Claim 4 sunmarks, 2 timber and 2 fibre once','claim'):here?button('Walk to Merren','walk','return'):'');
   else if(here){
    const next=route[r.steps.length+1];html+='<p><strong>Next arrival:</strong> '+esc(name(next))+'.</p><p><strong>Carrier:</strong> '+esc(v?.ready?'At the next stop · arrival not recorded':v?.status==='moving'?'Walking to '+name(next):v?.status==='blocked'?'Waiting · '+(v.detail||v.reason):v?.status==='paused'?'Paused while you read':v?.detail||'Waiting at its current position')+'</p><div class="world-actions">';
    if(v?.ready&&at(sim,v))html+=button(r.steps.length===list.length-1?'Register delivery at this receiving bay':'Record this arrival and continue','continue');
    else if(v&&at(sim,v))html+=button('Continue with the carrier','continue')+button('Ask the carrier to wait here','wait');
    else html+=button('Walk to the supplied carrier','walk','carrier');
    html+='</div>';
   }else html+='<p>Revisit Coastward through its Road of Light or the Hearthwater road to continue this load.</p>';
   html+='<details><summary>Read the selected route</summary><ol>'+route.slice(1).map((p,i)=>'<li>'+esc(name(p))+(i<r.steps.length?' · recorded':i===r.steps.length?' · next':'')+'</li>').join('')+'</ol></details>';
   if(!r.claimed)html+='<button data-rpg="civic-track" data-id="'+D.ID+'">Track this supplied load</button>';
  }
  return html+'<p>Acceptance and recorded arrivals survive saving. No ordinary materials are spent or equipment auto-equipped. A full pouch or refused save leaves the payment unclaimed.</p><div class="world-actions"><button data-rpg="community-open">Read Merren’s separate bridge workshop</button><button data-rpg="expedition-open">Read Rill’s Living Road and patrol</button></div></article>';
 }
 tracker(){
  const r=record(this.sim);if(!r?.accepted||r.claimed)return null;
  const v=this.live(),route=D.routes[D.choice(r.choice).route],complete=r.steps.length===D.required(r).length;
  return{title:D.definition.title,detail:this.sim.room!==D.ROOM?'Revisit Coastward to resume the supplied load':complete?'Delivered · return to Merren for the separate payment':v?.ready?'E · record arrival at '+name(v.next):v?.status==='blocked'?'Carrier waiting · '+(v.detail||v.reason):v?.status==='moving'?'Stay nearby · '+name(v.next):'E · continue at the supplied carrier',progress:r.steps.length+'/'+D.required(r).length+' arrivals · J work · M route'};
 }
}
const api=Object.freeze({ConsignmentUI,routePoints,routeLine,legend,name});G.RealmEarthConsignmentUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
