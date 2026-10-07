/* Expedition-owned fitting controller. Only the real rules move its
 * temporary assembly; the gated expedition command owns durable fastening. */
(function(G){'use strict';
const PREFIX='expedition-fieldcraft-',STEP='brace-root-channel';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const degrees=n=>n*180/Math.PI,radians=n=>n*Math.PI/180,format=n=>Number(n).toFixed(1);
const button=(label,type,extra='',disabled=false)=>'<button type="button" data-rpg="'+PREFIX+type+'" '+extra+(disabled?' disabled':'')+'>'+esc(label)+'</button>';
const feedback=view=>{
 const F=G.RealmEarthFieldcraft,g=F.GEOMETRY,section=view.sections.find(s=>s.id===view.activeSection);
 if(!section)return{ready:true,text:'Four sections seated. Fasten deliberately to record this repair.'};
 const target=g.sections.find(s=>s.id===section.id),gap=Math.hypot(...section.to.map((n,i)=>n-target.to[i]));
 const inspected=[target.receiverFrom,target.receiverTo].every(id=>view.receivers.find(r=>r.id===id)?.inspected);
 const ready=inspected&&gap<=g.endpointTolerance+1e-12&&Math.abs(view.yaw-g.targetYaw)<=g.yawTolerance+1e-12&&Math.abs(view.pitch-g.targetPitch)<=g.pitchTolerance+1e-12;
 return{ready,text:'Far socket gap '+(gap*100).toFixed(1)+' cm · needs '+(g.endpointTolerance*100).toFixed(1)+' cm or less. '+(ready?'Ready to seat.':inspected?'Correct the orientation before seating.':'Inspect both receiving sockets first.')};
};
class FieldcraftUI{
 #plan=null;#ticket=null;#owner=null;#lastPose=null;#notice='';
 constructor(rpg){this.rpg=rpg;}
 #context(){
  const ctx=this.rpg.api.fieldcraftContext?.();
  if(!ctx||ctx.sim!==this.rpg.sim)throw Error('The current fitting owner is unavailable. Reopen the expedition.');
  return ctx;
 }
 #drop(message,cancel=true){if(this.#plan&&cancel)G.RealmEarthFieldcraft?.cancel(this.#plan);this.#plan=null;this.#ticket=null;this.#owner=null;this.#lastPose=null;this.#notice=message;}
 #live(ctx){
  if(!this.#plan)return null;
  const owner=this.#owner,F=G.RealmEarthFieldcraft,view=F?.projection(this.#plan);
  if(!owner||owner.sim!==ctx.sim||owner.active!==ctx.active||owner.lease!==ctx.ownerLease||!F?.isProjection(view,ctx.sim.state.earthExpedition)){
   this.#drop('Unfinished fitting is no longer current. Inspect the supplied support again. Recorded work is kept.');return null;
  }
  return view;
 }
 #finish(result,paint=true){this.#notice=[result.text||result.error||'',result.warning||''].filter(Boolean).join(' ');if(this.#notice)this.rpg.api.toast?.(this.#notice);if(paint)this.rpg.paint();return true;}
 reset(reason='presentation'){
  // Closing/switching presentation preserves fitting. Parent explicitly names
  // real lifecycle events; rules also check the live owner every time.
  if(['cancel','restart','owner','travel','import','character','death','reload'].includes(reason))this.#drop(reason==='cancel'?'Unfastened fitting discarded. Recorded work is kept.':'Unfinished fitting ended. Inspect the supplied support again. Recorded work is kept.');
  else if(reason==='completed')this.#drop('',false);
 }
 panel(){
  const F=G.RealmEarthFieldcraft,E=G.RealmEarthExpedition;
  if(!F||!E)return'<p>Fitting controls are unavailable.</p>';
  let ctx,saved;try{ctx=this.#context();saved=E.validate(ctx.sim.state.earthExpedition);}catch(e){return'<p>'+esc(e.message)+'</p>';}
  if(saved.story.steps.includes(STEP)){if(this.#plan)this.reset('completed');return'<section data-fieldcraft-panel><h4>The alternate support is recorded</h4><p>The four-section brace remains. Future patrols inspect it.</p>'+(typeof this.rpg.api.frameFieldcraft==='function'?button('Look at the recorded receiving face','look'):'')+(this.#notice?'<p role="status">'+esc(this.#notice)+'</p>':'')+'</section>';}
  if(!saved.story.steps.includes('clear-root-pests'))return'';
  const view=this.#live(ctx),g=F.GEOMETRY;
  let html='<section data-fieldcraft-panel aria-label="Fit the supplied support"><h4>Four sections, one living-road support</h4><p>Use the east-wall sockets. The root passage and watercourse stay open.</p>';
  html+='<p data-fieldcraft-notice role="status" aria-live="polite">'+esc(this.#notice)+'</p>';
  if(!view)return html+'<p>Inspect the supplied kit at the supported work point to begin. Unfastened fitting is temporary; reloading returns it to the kit. Recorded repairs remain.</p>'+button('Inspect supplied support','begin')+'</section>';
  const section=g.sections.find(s=>s.id===view.activeSection),state=feedback(view),seated=view.sections.filter(s=>s.seated).length;
  if(typeof this.rpg.api.frameFieldcraft==='function')html+=button('Look at the receiving face','look');
  html+='<p>'+seated+' of 4 sections seated · '+(view.complete?'ready, not yet fastened':'section '+(section.index+1)+' of 4')+'</p><ol class="fieldcraft-receivers">'+view.receivers.map((r,i)=>'<li>East socket '+(i+1)+' · '+(r.inspected?'inspected':'not inspected')+'</li>').join('')+'</ol>';
  if(section){
   const meta='data-section="'+esc(section.id)+'"';
   html+='<p>Section '+(section.index+1)+' joins east sockets '+(section.index+1)+' and '+(section.index+2)+'. Receiver alignment: yaw '+format(degrees(g.targetYaw))+'°, pitch '+format(degrees(g.targetPitch))+'°.</p>'+button('Inspect these two sockets','inspect',meta);
   for(const axis of['yaw','pitch']){
    const bounds=g.previewBounds[axis],value=format(degrees(view[axis])),label=axis==='yaw'?'Yaw · swing east':'Pitch · lift toward the far socket',attrs=' data-rpg="'+PREFIX+'pose" data-fieldcraft-axis="'+axis+'" data-fieldcraft-section="'+esc(section.id)+'" min="'+degrees(bounds.min)+'" max="'+degrees(bounds.max)+'" step="0.1" value="'+value+'"';
    html+='<div class="fieldcraft-pose"><label for="fieldcraft-'+axis+'">'+label+'</label><input id="fieldcraft-'+axis+'" type="range"'+attrs+' aria-label="'+label+' in degrees"><label for="fieldcraft-'+axis+'-number">'+(axis==='yaw'?'Yaw':'Pitch')+' in degrees</label><input id="fieldcraft-'+axis+'-number" type="number"'+attrs+' inputmode="decimal"></div>';
   }
   if(this.#lastPose)html+=button('Use last seated orientation','reuse',meta);
   html+='<p data-fieldcraft-gap>'+esc(state.text)+'</p>'+button('Seat section '+(section.index+1),'seat',meta,!state.ready);
  }else html+='<p data-fieldcraft-gap>'+esc(state.text)+'</p>'+button('Fasten the four-section brace','fasten');
  return html+button('Restart fitting','restart')+button('Discard unfastened fitting','cancel')+'<p>Fastening records this repair. Rill’s payment stays separate. No extra materials are spent.</p></section>';
 }
 input(el){
  if(el?.dataset?.rpg!==PREFIX+'pose')return false;
  const F=G.RealmEarthFieldcraft,axis=el.dataset.fieldcraftAxis;let result,view;
  try{
   const ctx=this.#context();view=this.#live(ctx);
   if(!view||!['yaw','pitch'].includes(axis))throw Error('Inspect a current section before changing its pose.');
   const text=String(el.value??'').trim();if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))throw Error('Enter a finite angle in degrees.');
   result=F.adjust(ctx,this.#plan,{yaw:view.yaw,pitch:view.pitch,[axis]:radians(Number(text)),sectionId:el.dataset.fieldcraftSection});
   if(result.ok){view=result.view;this.#notice='';}else this.#notice=result.error;
  }catch(e){this.#notice=e.message;}
  // Update feedback in place: a range drag/number edit keeps its DOM and focus.
  const root=el.closest?.('[data-fieldcraft-panel]');
  if(root){const notice=root.querySelector('[data-fieldcraft-notice]');if(notice)notice.textContent=this.#notice;
   if(view){const state=feedback(view),gap=root.querySelector('[data-fieldcraft-gap]'),seat=root.querySelector('[data-rpg="'+PREFIX+'seat"]');if(gap)gap.textContent=state.text;if(seat)seat.disabled=!state.ready;
    for(const input of root.querySelectorAll('[data-fieldcraft-axis]'))if(input!==el&&['yaw','pitch'].includes(input.dataset.fieldcraftAxis))input.value=format(degrees(view[input.dataset.fieldcraftAxis]));
   }
  }
  return true;
 }
 action(el){
  const action=el?.dataset?.rpg;if(!action?.startsWith(PREFIX))return false;
  const type=action.slice(PREFIX.length),F=G.RealmEarthFieldcraft;
  if(type==='pose')return true; // Input/change owns pose edits; clicks only focus.
  try{
   if(!F)throw Error('Fitting rules are unavailable.');
   if(type==='cancel'){this.reset('cancel');return this.#finish({ok:true,text:this.#notice});}
   const ctx=this.#context();let view=this.#live(ctx),result;
   if(type==='look'&&ctx.sim.state.earthExpedition.story.steps.includes(STEP)){
    result=this.rpg.api.frameFieldcraft?.(null)||{ok:false,error:'Receiving-face framing is unavailable.'};
    if(result.ok){this.rpg.close?.();return this.#finish(result,false);}return this.#finish(result);
   }
   if(type==='begin'||type==='restart'){
    if(type==='begin'&&view)return this.#finish({ok:true,text:'This fitting is already open. Its seated sections are kept.'});
    if(type==='restart')this.reset('restart');result=F.begin(ctx);
    if(result.ok&&!result.duplicate){this.#plan=result.plan;this.#ticket=null;this.#lastPose=null;this.#owner={sim:ctx.sim,active:ctx.active,lease:ctx.ownerLease};}
   }else{
    if(!view)throw Error('Inspect the supplied support to begin a current fitting.');
    if(['inspect','reuse','seat'].includes(type)&&el.dataset.section!==view.activeSection)throw Error('That section control is stale. Read the current section.');
    if(type==='inspect')result=F.inspect(ctx,this.#plan);
    else if(type==='look'){if(typeof this.rpg.api.frameFieldcraft!=='function')throw Error('Receiving-face framing is unavailable.');result=this.rpg.api.frameFieldcraft(view)||{ok:false,error:'Receiving-face framing returned no confirmation.'};if(result.ok){this.rpg.close?.();return this.#finish(result,false);}}
    else if(type==='reuse'){if(!this.#lastPose)throw Error('Seat one section before reusing its orientation.');result=F.adjust(ctx,this.#plan,{...this.#lastPose,sectionId:view.activeSection});}
    else if(type==='seat'){result=F.seat(ctx,this.#plan);if(result.ok){this.#lastPose={yaw:view.yaw,pitch:view.pitch};if(result.ticket)this.#ticket=result.ticket;}}
    else if(type==='fasten'){
     const valid=F.validate(ctx,this.#ticket);if(!valid.ok)return this.#finish(valid);
     if(typeof this.rpg.api.expeditionCommand!=='function')throw Error('The durable expedition command is unavailable. Your fitting is kept.');
     result=this.rpg.api.expeditionCommand('step',{quest:G.RealmEarthExpedition.definition.id,step:STEP,fittingTicket:this.#ticket});
     if(result?.then)throw Error('Fastening did not return synchronous confirmation. Read the recorded support before retrying.');
     if(result?.ok){
      const recorded=G.RealmEarthExpedition.validate(ctx.sim.state.earthExpedition).story.steps.includes(STEP);
      if(recorded)this.reset('completed');else result={ok:false,error:'Fastening returned without a recorded repair. Your fitting is kept.'};
     }
    }else throw Error('Unknown fitting action.');
   }
   return this.#finish(result||{ok:false,error:'Fitting did not return confirmation.'});
  }catch(e){return this.#finish({ok:false,error:e.message});}
 }
}
const api=Object.freeze({FieldcraftUI});G.RealmEarthFieldcraftUI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
