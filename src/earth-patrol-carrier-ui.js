/* Expedition-owned controls; pose edits are temporary, final inspection uses
 * the actual gated expedition command. No DOM dataset is fitting authority. */
(function(G){'use strict';
const PREFIX='expedition-carrier-',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,extra='',disabled=false)=>'<button type="button" data-rpg="'+PREFIX+type+'" '+extra+(disabled?' disabled':'')+'>'+esc(label)+'</button>';
const names={'billet-0':'West stormfall billet','billet-1':'Middle stormfall billet','billet-2':'East stormfall billet',bundle:'Coppice test bundle','lashing-left':'West test lashing','lashing-right':'East test lashing'};
const unit=(axis,n)=>axis==='yaw'?n*180/Math.PI:n*100,fromUnit=(axis,n)=>axis==='yaw'?n*Math.PI/180:n/100;
let controllerSequence=0;
class CarrierUI{
 #plan=null;#ticket=null;#notice='';#controller=++controllerSequence;#generation=0;
 constructor(rpg){this.rpg=rpg;}
 #context(){const c=this.rpg.api.fieldcraftContext?.();if(!c||c.sim!==this.rpg.sim)throw Error('Read the supplied kit with the current character.');return c;}
 reset(reason){if(['owner','cancel','restart','travel','import','character','death','reload'].includes(reason)){if(this.#plan)G.RealmEarthPatrolCarrier?.cancel(this.#plan);this.#plan=null;this.#ticket=null;this.#generation++;this.#notice='Unrecorded fitting ended. Recorded patrol work stays.';}}
 #view(ctx){const P=G.RealmEarthPatrolCarrier,v=this.#plan?P?.projection(this.#plan):P?.current(ctx.sim);return P?.isProjection(v,ctx.sim.state.earthExpedition)?v:null;}
 #identity(ctx,view){const l=G.RealmEarthExpedition.validate(ctx.sim.state.earthExpedition);return{run:view?.run??l.patrol.active?.run,branch:l.story.branch,stamp:this.#controller+':'+this.#generation};}
 #meta(ctx,view){const i=this.#identity(ctx,view);return' data-carrier-run="'+i.run+'" data-carrier-prior="'+(i.run-1)+'" data-carrier-branch="'+esc(i.branch)+'" data-carrier-stamp="'+i.stamp+'" ';}
 #fence(el,ctx,view){const i=this.#identity(ctx,view),d=el?.dataset;if(!Number.isSafeInteger(i.run)||d?.carrierRun!==String(i.run)||d.carrierPrior!==String(i.run-1)||d.carrierBranch!==i.branch||d.carrierStamp!==i.stamp)throw Error('That supplied-kit control belongs to an older run or fitting. Read the current kit.');}
 #finish(result,paint=true){this.#notice=[result?.text||result?.error||'',result?.warning||''].filter(Boolean).join(' ');if(this.#notice)this.rpg.api.toast?.(this.#notice);if(paint)this.rpg.paint();return true;}
 panel(){
  const P=G.RealmEarthPatrolCarrier;let ctx;try{ctx=this.#context();}catch(e){return'<p>'+esc(e.message)+'</p>';}
  const projected=this.#view(ctx),view=!this.#plan&&['fitting','ready'].includes(projected?.status)?null:projected,l=G.RealmEarthExpedition.validate(ctx.sim.state.earthExpedition),meta=this.#meta(ctx,view);
  if(!l.patrol.active)return view?.status==='paid'?'<section data-carrier-panel><h4>Rill checks the returned kit</h4><p>Your fitted '+(view.branch==='stormfall-recovery'?'stormfall billets':'coppice bundle and lashings')+' are settled beside Rill. This patrol’s fixed payment was claimed once.</p></section>':'';
  if(l.patrol.active.steps.includes('inspect-glade'))return'<section data-carrier-panel><h4>The glade inspection is recorded</h4><p>'+esc(view?.status==='checked'?'Your fitted kit is ready for Rill to receive. Walk back and claim the separate patrol payment.':'The saved inspection remains complete. Return to Rill for its separate payment.')+'</p></section>';
  if(!P)return'<p>Supplied kit controls are unavailable.</p>';
  let html='<section data-carrier-panel aria-label="Fit the supplied glade kit"><h4>Three supplied pieces, one packing check</h4><p>Borrowed job parts cost none of your timber or fibre. Leave the tray tab and packing gaps clear.</p><p data-carrier-notice role="status" aria-live="polite">'+esc(this.#notice)+'</p>';
  if(!view)return html+'<p>Inspect the tray at the glade to begin. Unrecorded placement survives closing this panel or walking away in this outing; reloading, leaving Earth or changing character returns it to the loose kit. Recorded work stays.</p>'+button('Inspect the supplied checking kit','begin',meta)+'</section>';
  if(typeof this.rpg.api.frameCarrier==='function')html+=button('Look at the checking tray','look',meta);
  html+='<p>'+view.pieces.filter(p=>p.seated).length+' of 3 pieces seated.</p>';
  const p=view.pieces.find(p=>p.id===view.activePiece),r=view.receivers.find(r=>r.pieceId===view.activePiece);
  if(p){
   const extra=meta+'data-piece="'+esc(p.id)+'" data-receiver="'+esc(r.id)+'"';
   html+='<h5>'+esc(names[p.id])+'</h5><p>'+(r.frame==='seated-bundle'?'Place across your already seated bundle; its actual position is retained.':'Place within this piece’s guide on the tray.')+' Across '+unit('x',r.target.x).toFixed(1)+' cm · along '+unit('z',r.target.z).toFixed(1)+' cm · turn '+unit('yaw',r.target.yaw).toFixed(1)+'°.</p>'+button('Inspect this receiving guide','inspect',extra);
   for(const axis of['x','z','yaw']){
    const b=P.GEOMETRY.previewBounds[axis],label=axis==='x'?'Across':axis==='z'?'Along':'Turn',suffix=axis==='yaw'?'degrees':'centimetres',value=unit(axis,p.pose[axis]).toFixed(1),attrs=meta+' data-rpg="'+PREFIX+'pose" data-carrier-axis="'+axis+'" data-carrier-piece="'+esc(p.id)+'" min="'+unit(axis,b.min)+'" max="'+unit(axis,b.max)+'" step="0.1" value="'+value+'"';
    html+='<div class="fieldcraft-pose"><label for="carrier-'+axis+'">'+label+' in '+suffix+'</label><input id="carrier-'+axis+'" type="range"'+attrs+' aria-label="'+label+' in '+suffix+'"><label for="carrier-'+axis+'-number">'+label+' value</label><input id="carrier-'+axis+'-number" type="number"'+attrs+' aria-label="'+label+' value in '+suffix+'"></div>';
   }
   html+='<p data-carrier-feedback role="status">'+this.feedback(p,r)+'</p>'+button('Seat this supplied piece','seat',extra,!p.fits||!r.inspected);
  }else html+='<p>All three pieces are fitted. Nothing has been recorded or paid yet.</p>'+button('Record this patrol inspection','record',meta);
  return html+button('Return unrecorded pieces to the kit','cancel',meta)+'</section>';
 }
 feedback(p,r){return esc(!r.inspected?'Inspect this receiving guide first.':p.fits?'The actual piece fits its guide and clearance. Ready to seat.':'Correct the placement and turn until the piece fits its guide, packing gaps and tray tab.');}
 input(el){
  if(el?.dataset?.rpg!==PREFIX+'pose')return false;let view,result;
  try{
   const ctx=this.#context();view=this.#view(ctx);this.#fence(el,ctx,view);const axis=el.dataset.carrierAxis,p=view?.pieces.find(p=>p.id===view.activePiece),r=view?.receivers.find(r=>r.pieceId===view.activePiece),text=String(el.value??'').trim();
   if(!p||p.id!==el.dataset.carrierPiece||!['x','z','yaw'].includes(axis)||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))throw Error('Use the current piece’s finite placement controls.');
   result=G.RealmEarthPatrolCarrier.adjust(ctx,this.#plan,{...p.pose,[axis]:fromUnit(axis,Number(text)),pieceId:p.id,receiverId:r.id});this.#notice=result.error||'';if(result.ok)view=result.view;
  }catch(e){this.#notice=e.message;}
  const root=el.closest?.('[data-carrier-panel]');if(root){const notice=root.querySelector('[data-carrier-notice]');if(notice)notice.textContent=this.#notice;
   const p=view?.pieces.find(p=>p.id===view.activePiece),r=view?.receivers.find(r=>r.pieceId===view.activePiece);if(p&&r){const status=root.querySelector('[data-carrier-feedback]'),seat=root.querySelector('[data-rpg="'+PREFIX+'seat"]');if(status)status.textContent=this.feedback(p,r);if(seat)seat.disabled=!result?.ok||!p.fits||!r.inspected;
    // A number edit may temporarily be empty or contain only a minus sign.
    // Keep its DOM/focus/text so native typing can finish; rules keep the last
    // valid world pose and other controls display that pose until correction.
    for(const input of root.querySelectorAll('[data-carrier-axis]'))if(input!==el)input.value=unit(input.dataset.carrierAxis,p.pose[input.dataset.carrierAxis]).toFixed(1);
   }
  }return true;
 }
 action(el){
  const action=el?.dataset?.rpg;if(!action?.startsWith(PREFIX))return false;const type=action.slice(PREFIX.length),P=G.RealmEarthPatrolCarrier;if(type==='pose')return true;
  try{
   if(!P)throw Error('The supplied fitting rules are unavailable.');
   const ctx=this.#context();let view=this.#view(ctx),result;this.#fence(el,ctx,view);
   if(type==='cancel'){
    if(!view||!['fitting','ready'].includes(view.status))throw Error('This inspection is recorded. Unrecorded-piece controls cannot discard it.');
    this.reset('cancel');return this.#finish({ok:true,text:this.#notice});
   }
   if(type==='begin'){
    if(view&&this.#plan)return this.#finish({ok:true,text:'This kit is already open; your placed pieces stay.'});
    result=P.begin(ctx);if(result.ok){this.#plan=result.plan;this.#ticket=null;this.#generation++;}
   }else{
    if(!view)throw Error('Inspect this current patrol’s supplied kit first.');
    if(type==='look'){
     if(view.status==='paid')throw Error('The borrowed kit is settled with Rill; this old tray control has ended.');
     result=this.rpg.api.frameCarrier?.(view);
     if(!result||result.then||typeof result.ok!=='boolean')throw Error('Tray framing returned no synchronous confirmation.');
     if(result.ok){this.rpg.close?.();return this.#finish(result,false);}
    }
    else if(type==='inspect')result=P.inspect(ctx,this.#plan,el.dataset.piece,el.dataset.receiver);
    else if(type==='seat'){result=P.seat(ctx,this.#plan,el.dataset.piece);if(result.ticket)this.#ticket=result.ticket;}
    else if(type==='record'){
     const valid=P.validate(ctx,this.#ticket);if(!valid.ok)return this.#finish(valid);
     result=this.rpg.api.expeditionCommand('patrol-step',{quest:G.RealmEarthExpedition.patrol.id,run:view.run,priorClaim:view.run-1,step:'inspect-glade',carrierTicket:this.#ticket});
     if(result?.then)throw Error('Inspection did not return synchronous confirmation. Read the recorded patrol before retrying.');
    }else throw Error('Unknown supplied kit action.');
   }return this.#finish(result||{ok:false,error:'No fitting confirmation returned.'});
  }catch(e){return this.#finish({ok:false,error:e.message});}
 }
}
G.RealmEarthPatrolCarrierUI=Object.freeze({CarrierUI});if(typeof module!=='undefined')module.exports=G.RealmEarthPatrolCarrierUI;
})(globalThis);
