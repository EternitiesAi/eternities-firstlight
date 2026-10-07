/* Interface, camera and local persistence. Nothing in this file calls a server.
 * Residents use explicit routines and authored dialogue, not a hidden AI API. */
(function(){'use strict';const C=RealmCore,X=RealmCreative,$=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui={canvas:$('#world'),map:$('#map-fallback'),drawer:$('#drawer'),body:$('#drawer-body'),title:$('#panel-title'),toast:$('#toast')};const characterStore=new RealmCharacters.Store({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)}),characterLock=new RealmCharacters.WriterLock();let characterImportPending=false;let loaded=characterStore.load(),sim=new C.Simulation(loaded.state),engine=null,art=null,experience=null,sandbox=null,adventure=null,arsenal=null,rpg=null,errors=[],scene=null,panel=null,lastFocus=null,selected=null,follow=null,commandCount=0,target=null,toastTimer=0,elapsed=0,lastFrame=0,frames=0,fps=0,fpsStart=performance.now(),lastUi=0,lastSave=0,saveState=['loaded','migrated'].includes(loaded.status)?'saved':'new',preserveExisting=!!loaded.preserveExisting;let camera={yaw:.22,elevation:.28,half:17,distance:7.5,actualDistance:7.5,fov:sim.state.settings.cameraFov,center:[sim.state.player.x,2.8,sim.state.player.z],overview:false,preset:sim.state.settings.cameraMode};
function error(e){errors.push(String(e.message||e));console.error(e);}window.addEventListener('error',e=>{error(e.error||e.message);$('#loading').classList.add('hidden');});window.addEventListener('unhandledrejection',e=>error(e.reason));
const toastHome=ui.toast.parentElement;
function restoreToast(){const host=ui.toast.parentElement;if(host!==toastHome)host?.classList.remove('has-dialog-notice');toastHome.append(ui.toast);ui.toast.classList.remove('dialog-notice');}
function toast(text){
 const dialog=[...document.querySelectorAll('dialog[open]')].at(-1),host=dialog||toastHome,oldHost=ui.toast.parentElement;
 if(oldHost!==host){oldHost?.classList.remove('has-dialog-notice');host.append(ui.toast);}
 ui.toast.classList.toggle('dialog-notice',!!dialog);dialog?.classList.add('has-dialog-notice');
 ui.toast.textContent=text;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{ui.toast.classList.remove('show');restoreToast();},4200);
}
document.addEventListener('close',e=>{if(e.target===ui.toast.parentElement)restoreToast();},true);
function fallback(reason){engine=null;art=null;ui.canvas.style.display='none';ui.map.style.display='block';$('#fallback-banner').style.display='block';$('#fallback-banner').textContent=reason||'3D is unavailable. Explore the same local world using this map.';document.getElementById('labels').replaceChildren();resize();}
try{engine=new RealmEngine.Engine(ui.canvas);engine.quality=sim.state.settings.quality;art=new RealmArt.WorldArt(engine);}catch(e){errors.push('Handled graphics fallback: '+e.message);fallback();}
function sceneHeight(x=sim.state.player.x,z=sim.state.player.z){if(RealmWorldFoundations.handles(sim.room))return sim.worldDive?RealmWorldFoundations.playerHeight(sim):RealmWorldFoundations.height(sim.room,x,z);return sim.room===RealmEarth.ROOM?RealmEarth.height(x,z):sim.room===RealmCosmos.ROOM?RealmCosmos.height(x,z):sim.room?1.57:1.3;}
function earthHomecomingWriter(){const owner=sim,state=owner.state,store=characterStore,active=store.active;
 const current=()=>sim===owner&&owner.state===state&&characterStore===store&&store.active===active;
 return candidate=>{if(!current())return{ok:false,error:'The homecoming writer no longer belongs to this character.'};const result=worldSave(candidate);return current()?result:{ok:false,error:'The character changed while saving the homecoming account.'};};
}
// Parent app owns this transient lease independently from the fitting lease.
let consignmentOwner=null;
function syncConsignmentOwner(force=false){
 const next=[sim,sim.state,sim.state.adventure,characterStore,characterStore.active,sim.room,sim.worldTrip,sim.earthTrip,sim.worldDive,JSON.stringify(sim.returnPos),JSON.stringify(sim.worldTrip),sim.state.adventure.deaths];
 if(force||!consignmentOwner||next.some((v,i)=>v!==consignmentOwner[i])){
  if(consignmentOwner){const outgoing=consignmentOwner[0];RealmEarthConsignmentMotion.reset(outgoing,'actual-app-owner-change');RealmEarthConsignmentArt.reset(outgoing);outgoing.consignmentOwnerLease=Object.freeze({});rpg?.civic?.carrier?.reset('owner');}
  sim.consignmentOwnerLease=Object.freeze({});consignmentOwner=next;
 }
 return sim.consignmentOwnerLease;
}
function consignmentThreat(query){
 const runtime=sim.adventureRuntime;
 if(!runtime||runtime.room!==sim.room||!Array.isArray(runtime.enemies)||!query?.from||!query?.to)return{clear:false,reason:'The local danger check is unavailable. The carrier will wait.'};
 const a=query.from,b=query.to,dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz;
 if(![a.x,a.z,b.x,b.z].every(Number.isFinite))return{clear:false,reason:'The load position could not be checked. The carrier will wait.'};
 for(const e of runtime.enemies){
  if(!(e.hp>0)||e.hidden)continue;
  if(!Number.isFinite(e.x)||!Number.isFinite(e.z))return{clear:false,reason:'A local threat position is unavailable. The carrier will wait.'};
  const t=n?Math.max(0,Math.min(1,((e.x-a.x)*dx+(e.z-a.z)*dz)/n)):0,reach=e.kind==='charger'?10:e.kind==='boss'?7:8.5;
  if(Math.hypot(e.x-a.x-t*dx,e.z-a.z-t*dz)<reach)return{clear:false,reason:'Nearby '+(e.name||'regional creature')+'. Make the route safe, or return with the carrier later.'};
 }
 return{clear:true};
}
function consignmentContext(){return{...worldContext(),ownerLease:syncConsignmentOwner(),definition:RealmEarthConsignmentData.definition,threat:consignmentThreat};}
function consignmentControl(type){const ctx=consignmentContext();return type==='continue'?RealmEarthConsignmentMotion.continue(ctx):type==='wait'?RealmEarthConsignmentMotion.wait(ctx):{ok:false,error:'Unknown supplied-carrier control.'};}
function consignmentPresentation(){
 const ctx=consignmentContext();sim.consignmentPresentationContext=ctx;sim.consignmentPresentation=RealmEarthConsignmentMotion.current(ctx);
}
function tickConsignment(dt){
 const ctx=consignmentContext(),r=sim.state.localLife.records[RealmEarthConsignmentData.ID];
 if(sim.room===RealmEarthConsignmentData.ROOM&&!sim.worldDive&&sim.state.adventure.hp>0&&r.accepted&&!r.claimed){const result=RealmEarthConsignmentMotion.update(ctx,dt);if(!result.ok)throw Error(result.error);}
 consignmentPresentation();
}

let fieldcraftOwner=null,fieldcraftFrame=null;
function syncFieldcraftOwner(force=false){
 const next=[sim,sim.state,sim.state.adventure,characterStore,characterStore.active,sim.room,sim.worldTrip,sim.earthTrip,JSON.stringify(sim.returnPos),JSON.stringify(sim.worldTrip),sim.state.adventure.deaths];
 if(force||!fieldcraftOwner||next.some((v,i)=>v!==fieldcraftOwner[i])){
  rpg?.expedition?.reset('owner');fieldcraftFrame=null;sim.fieldcraftOwnerLease=Object.freeze({});fieldcraftOwner=next;
 }
 return sim.fieldcraftOwnerLease;
}
function fieldcraftContext(){const ownerLease=syncFieldcraftOwner();return{...worldContext(),ownerLease};}
// Transient camera framing belongs to the current field-account owner below.
const GRAZER_LOOK_POINT=Object.freeze([-163.5,2.32,-78.5]);
let grazerCameraHalfHeld=false;
function clearGrazerFocus(){
 grazerFrame=null;
 if(grazerCameraHalfHeld&&camera.preset!=='adventure')camera.half=fitCameraHalf(camera.baseHalf,camera.zoom);
 grazerCameraHalfHeld=false;
}
function grazerLookContext(){
 const D=RealmEarthWildSignsData,ctx=wildSignsContext(),gc=ctx.grazerContext?.(),a=sim.state.adventure;
 const opaque=v=>!!v&&Object.isFrozen(v)&&Reflect.ownKeys(v).length===0&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
 if(!(sim instanceof C.Simulation)||ctx.sim!==sim||ctx.definition!==D.definition||ctx.active!==characterStore.active||!Number.isSafeInteger(ctx.revision)||ctx.revision<0||!opaque(ctx.ownerLease)||ctx.ownerLease!==sim.wildSignsOwnerLease||!gc||gc.sim!==sim||gc.active!==ctx.active||gc.revision!==ctx.revision||!opaque(gc.ownerLease)||gc.ownerLease!==sim.grazerOwnerLease||gc.ownerLease===ctx.ownerLease)throw Error('Use the current app-owned field account.');
 if(sim.room!==D.ROOM||sim.worldDive||!a.started||!Number.isFinite(a.hp)||a.hp<=0||!sim.worldTrip||sim.worldTrip.active!==ctx.active||sim.worldTrip.realm!=='earthlands'||JSON.stringify(sim.worldTrip.home)!==JSON.stringify(sim.returnPos))throw Error('Return to the living traveller’s original dry Earth outing.');
 const r=D.crossValidate(sim.state.earthWildSigns,sim.state);
 if(!Object.hasOwn(sim.state,'earthWildSigns')||!D.eligible(sim.state)||!r.accepted||r.observed||!['timber-gouge','feeding-track'].every(id=>r.evidence.includes(id))||!RealmEarthWildSigns.at(sim,D.overlook))throw Error('Read both marks and stand at the supported overlook before looking west.');
 return ctx;
}
function fitGrazerLook(){
 if(!engine||engine._contextLost||typeof engine.clearCameraDistance!=='function'||!['adventure','follow','tactical','wide'].includes(camera.preset)||!Number.isFinite(innerWidth)||!Number.isFinite(innerHeight)||innerWidth<=0||innerHeight<=0||!Number.isFinite(camera.fov)||camera.fov<45||camera.fov>80)throw Error('The current 3D view cannot frame this loop.');
 const perspective=camera.preset==='adventure',aspect=innerWidth/innerHeight,elevation=perspective?.28:.88;
 const direction=[Math.cos(elevation),Math.sin(elevation),0],right=[0,0,-1],up=[-Math.sin(elevation),Math.cos(elevation),0],tan=Math.tan(camera.fov*Math.PI/360);
 let distance=3.5;const corners=[];
 for(const p of RealmEarthGrazerMotion.PATH.points)for(const dx of[-1.4,1.4])for(const dy of[-.75,.70])for(const dz of[-1.4,1.4]){
  const delta=[p.x-GRAZER_LOOK_POINT[0]+dx,dy,p.z-GRAZER_LOOK_POINT[2]+dz],dot=v=>v.reduce((n,x,i)=>n+x*delta[i],0);corners.push({x:dot(right),y:dot(up)});
  if(perspective)distance=Math.max(distance,dot(direction)+Math.max(Math.abs(dot(right))/(tan*aspect*.75),Math.abs(dot(up))/(tan*.65)));
 }
 if(perspective){
  if(distance>20)throw Error('This viewport is too narrow to frame the complete loop at your chosen FOV.');
  const wanted=GRAZER_LOOK_POINT.map((n,i)=>n+direction[i]*distance),clear=engine.clearCameraDistance(GRAZER_LOOK_POINT,wanted);
  if(!Number.isFinite(clear)||clear<distance-1e-6)throw Error('Scenery obstructs the complete loop framing. Your view is retained.');
 }else if(corners.some(p=>Math.abs(p.x)>6*aspect*.75+1e-9||Math.abs(p.y)>6*.65+1e-9))throw Error('This viewport is too narrow for the complete loop diorama.');
 return{yaw:Math.PI/2,elevation,distance,perspective,lens:JSON.stringify([innerWidth,innerHeight,camera.fov,camera.preset])};
}
function applyGrazerLookFit(fit){
 camera.yaw=fit.yaw;camera.elevation=fit.elevation;
 if(fit.perspective){camera.distance=camera.actualDistance=fit.distance;grazerCameraHalfHeld=false;}
 else{camera.half=6;grazerCameraHalfHeld=true;} // Keep the already-valid stored zoom.
 grazerFrame.lens=fit.lens;grazerFrame.yaw=fit.yaw;grazerFrame.elevation=fit.elevation;
}
function frameGrazer(request){
 const canonical=RealmEarthWildSignsUI.LOOK_REQUEST;
 if(request!==canonical||!Object.isFrozen(canonical)||!Object.isFrozen(canonical.from))return{ok:false,error:'Use the explicit field-account Look control.'};
 try{
  const ctx=grazerLookContext(),fit=fitGrazerLook();
  clearGrazerFocus();fieldcraftFrame=null;
  grazerFrame={sim,state:sim.state,adventure:sim.state.adventure,engine,lease:ctx.ownerLease,grazerLease:sim.grazerOwnerLease,trip:sim.worldTrip,home:JSON.stringify(sim.returnPos),deaths:sim.state.adventure.deaths,preset:camera.preset,player:{x:sim.state.player.x,z:sim.state.player.z},point:GRAZER_LOOK_POINT};
  camera.tour=false;camera.overview=false;follow=null;applyGrazerLookFit(fit);camera.center=GRAZER_LOOK_POINT.slice();updateCamera(1);
  return{ok:true,text:'The whole browse loop is framed west in your current view. Watch outside the menu; movement or camera controls release this framing.'};
 }catch(e){return{ok:false,error:e.message};}
}
function grazerFocus(){
 if(!grazerFrame){if(grazerCameraHalfHeld)clearGrazerFocus();return null;}
 try{
  const f=grazerFrame,ctx=grazerLookContext();
  if(f!==grazerFrame||f.sim!==sim||f.state!==sim.state||f.adventure!==sim.state.adventure||f.engine!==engine||f.lease!==ctx.ownerLease||f.grazerLease!==sim.grazerOwnerLease||f.trip!==sim.worldTrip||f.home!==JSON.stringify(sim.returnPos)||f.deaths!==sim.state.adventure.deaths||f.preset!==camera.preset||Math.hypot(sim.state.player.x-f.player.x,sim.state.player.z-f.player.z)>.15||Math.abs(camera.yaw-f.yaw)>1e-9||Math.abs(camera.elevation-f.elevation)>1e-9){clearGrazerFocus();return null;}
  const fit=fitGrazerLook();if(f.lens!==fit.lens)applyGrazerLookFit(fit);
  return f.point;
 }catch{clearGrazerFocus();return null;}
}

function fieldcraftFocus(){
 if(!fieldcraftFrame)return null;
 const f=fieldcraftFrame,g=RealmEarthFieldcraft.GEOMETRY;
 if(f.sim!==sim||f.lease!==syncFieldcraftOwner()||sim.room!==g.room||sim.worldDive||sim.state.adventure.hp<=0||Math.hypot(sim.state.player.x-f.player.x,sim.state.player.z-f.player.z)>.15||(!RealmEarthFieldcraft.current(sim)&&!sim.state.earthExpedition.story.steps.includes('brace-root-channel'))){fieldcraftFrame=null;return null;}
 return f.point;
}
function frameFieldcraft(view){
 const ctx=fieldcraftContext(),F=RealmEarthFieldcraft;
 const recorded=view===null&&sim.state.earthExpedition.story.steps.includes('brace-root-channel')&&sim.room===F.GEOMETRY.room&&!sim.worldDive&&sim.state.adventure.hp>0&&RealmEarthExpedition.at(sim,F.GEOMETRY.workPoint);
 if(!engine||!recorded&&!F.isProjection(view,sim.state.earthExpedition))return{ok:false,error:'Stand at the supported work point and inspect the current support before framing its receiving face.'};
 // Keep the focus outside the wall's existing .3 m camera clearance. A target
 // touching the wall would correctly pull the perspective eye down to .45 m.
 clearGrazerFocus();const g=F.GEOMETRY;fieldcraftFrame={sim,lease:ctx.ownerLease,player:{...sim.state.player},point:[g.from[0]+1,(g.from[1]+g.to[1])/2,(g.from[2]+g.to[2])/2]};
 const aspect=Math.max(.2,innerWidth/innerHeight),perspective=camera.preset==='adventure';
 camera.tour=false;camera.overview=false;follow=null;camera.yaw=perspective&&aspect<.75?.35:Math.PI/2;camera.elevation=perspective?.30:.50;
 if(perspective){
  const ce=Math.cos(camera.elevation),se=Math.sin(camera.elevation),sy=Math.sin(camera.yaw),cy=Math.cos(camera.yaw),direction=[sy*ce,se,cy*ce],right=[cy,0,-sy],up=[-sy*se,ce,-cy*se],tan=Math.tan(camera.fov*Math.PI/360);
  const points=[...g.receivers.map(r=>r.point),...(view?.sections||[]).filter(s=>s.seated||s.preview).flatMap(s=>[s.from,s.to])];let distance=10;
  for(const p of points)for(const dx of[-.22,.22])for(const dy of[-.22,.22])for(const dz of[-.22,.22]){const delta=[p[0]+dx-fieldcraftFrame.point[0],p[1]+dy-fieldcraftFrame.point[1],p[2]+dz-fieldcraftFrame.point[2]],dot=a=>a.reduce((n,v,i)=>n+v*delta[i],0);distance=Math.max(distance,dot(direction)+Math.max(Math.abs(dot(right))/(tan*aspect*.78),Math.abs(dot(up))/(tan*.60)));}
  camera.distance=camera.actualDistance=Math.min(20,distance);
 }else{camera.zoom=Math.max(.05,Math.max(6,(g.to[2]-g.from[2])/2+1.5)/Math.min(1,aspect)/camera.baseHalf);camera.half=fitCameraHalf(camera.baseHalf,camera.zoom);}
 camera.center=fieldcraftFrame.point.slice();updateCamera(1);save();return{ok:true,text:'Receiving face framed in your current view. Move or switch camera mode to return to following.'};
}
// Ordinary renderer acknowledgement is deliberately separate from photo/test rendering.
let wildSignsOwner=null,grazerFrame=null,grazerLastInspect=-Infinity,grazerLastVisibility=null;
const wildSignsNativeEvents=new WeakSet();
function syncWildSignsOwner(force=false){
 const next=[sim,sim.state,sim.state.adventure,characterStore,characterStore.active,sim.room,sim.worldTrip,sim.earthTrip,sim.worldDive,JSON.stringify(sim.returnPos),JSON.stringify(sim.worldTrip),sim.state.adventure.deaths];
 if(force||!wildSignsOwner||next.some((value,index)=>value!==wildSignsOwner[index])){
  if(wildSignsOwner){
   const outgoing=wildSignsOwner[0];
   RealmEarthGrazerMotion.reset(outgoing,'actual-app-owner-change');RealmEarthGrazerArt.reset(outgoing);
   outgoing.wildSignsOwnerLease=Object.freeze({});outgoing.grazerOwnerLease=Object.freeze({});
   delete outgoing.grazerPresentedFrame;delete outgoing.grazerNativeIntent;
   delete outgoing.grazerPresentation;delete outgoing.grazerPresentationContext;delete outgoing.grazerSubmission;
   outgoing.recordWildSignsClearance=()=>({ok:false,error:'The outgoing field encounter no longer belongs to the active traveller.'});
   rpg?.wildSigns?.reset('owner');
  }
  sim.wildSignsOwnerLease=Object.freeze({});sim.grazerOwnerLease=Object.freeze({});
  wildSignsOwner=next;grazerFrame=null;grazerLastInspect=-Infinity;grazerLastVisibility=null;
 }
 return sim.wildSignsOwnerLease;
}
function grazerContext(){
 const base=worldContext();syncWildSignsOwner();
 return{...base,ownerLease:sim.grazerOwnerLease};
}
function wildSignsContext(){
 const base=worldContext(),ownerLease=syncWildSignsOwner();
 return{...base,ownerLease,definition:RealmEarthWildSignsData.definition,grazerContext};
}
function bindWildSignsClearance(){
 const owner=sim,lease=syncWildSignsOwner();
 owner.recordWildSignsClearance=enemy=>{
  if(sim!==owner||syncWildSignsOwner()!==lease)return{ok:false,error:'The encounter owner changed before clearance saving.'};
  const context=wildSignsContext();context.sceneSignature=owner.adventureRuntime?.trailSignature;
  return RealmEarthWildSigns.recordClearance(context,enemy,{save:worldSave});
 };
}
function wildSignsCommand(type,payload){return RealmEarthWildSigns.command(wildSignsContext(),type,payload,{save:worldSave});}
function grazerPresentation(){
 const context=grazerContext();sim.grazerPresentationContext=context;
 sim.grazerPresentation=RealmEarthGrazerMotion.current(context);
 return sim.grazerPresentation;
}
function tickGrazer(dt){
 const context=grazerContext(),D=RealmEarthWildSignsData;
 if(sim.room===D.ROOM&&!sim.worldDive&&sim.state.adventure.hp>0&&D.eligible(sim.state)){
  if(!RealmEarthGrazerMotion.current(context)){
   const started=RealmEarthGrazerMotion.begin(context);if(!started.ok)throw Error(started.error);
  }else{
   const advanced=RealmEarthGrazerMotion.tick(context,dt);if(!advanced.ok)throw Error(advanced.error);
  }
 }
 grazerPresentation();
}
function grazerMenusOpen(){return!!panel||!!document.querySelector('dialog[open]');}
function acknowledgeOrdinaryGrazer(now){
 // Invoke only immediately after Engine.render in the private ordinary RAF.
 // An earlier clear result is never reused as positive frame authority.
 if(G_CAPTURE||document.hidden||sim.paused||grazerMenusOpen()||!engine||engine._contextLost||!['adventure','follow'].includes(camera.preset))return;
 const context=grazerContext(),submission=sim.grazerSubmission,view=sim.grazerPresentation;
 if(!view||view.observedBehavior||!sim.state.earthWildSigns.accepted||sim.state.earthWildSigns.observed||!RealmEarthGrazerMotion.isProjection(view,context)||!RealmEarthGrazerArt.isSubmission(submission,context))return;
 const marks=sim.state.earthWildSigns.evidence,player=sim.state.player;
 if(!['timber-gouge','feeding-track'].every(id=>marks.includes(id))||Math.hypot(player.x-view.x,player.z-view.z)>RealmEarthGrazerMotion.LIMITS.observeNear||!RealmWorldFoundations.segment(RealmEarthWildSignsData.ROOM,player,view,.04))return;
 if(!Number.isFinite(now)||now-grazerLastInspect<125)return;
 grazerLastInspect=now;
 const visibility=RealmEarthGrazerVisibility.inspect(engine,RealmEarthGrazerMotion.ID);
 grazerLastVisibility={...visibility,phase:view.phase,lower:view.lower,at:now};
 if(visibility.visible!==true)return;
 const presentedFrame=Object.freeze({});sim.grazerPresentedFrame=presentedFrame;
 const result=RealmEarthGrazerMotion.acknowledge({...context,presentedFrame,visible:true,hidden:false,menuOpen:false,camera:camera.preset},submission);
 if(result.ok&&result.observedBehavior)grazerPresentation();
}
function wildSignsNativeEvent(event,action){
 // Native keyboard activation also creates an actual trusted click MouseEvent.
 // Plain isTrusted lookalikes, dispatchEvent, expired events and reused events refuse.
 if(!(event instanceof MouseEvent)||event.type!=='click'||event.isTrusted!==true||event.eventPhase===Event.NONE||event.currentTarget!==rpg?.dialog||wildSignsNativeEvents.has(event)||document.hidden||!rpg.dialog.open||rpg.tab!=='wild-signs')return null;
 const target=event.target instanceof Element?event.target.closest('button[data-rpg]'):null;
 if(!target||!target.isConnected||target.disabled||target.dataset.rpg!=='wild-signs-'+action||target.dataset.quest!==RealmEarthWildSignsData.ID||!rpg.dialog.contains(target)||!document.getElementById('rpg-content')?.contains(target))return null;
 wildSignsNativeEvents.add(event);return target;
}
function wildSignsObserve(event){
 if(!wildSignsNativeEvent(event,'observe'))return{ok:false,error:'Use the active Observe button after watching the grazer in the live world.'};
 const context=grazerContext(),inputStamp=Object.freeze({});sim.grazerNativeIntent=inputStamp;
 const ticket=RealmEarthGrazerMotion.observationTicket({...context,inputStamp,hidden:false});
 if(!ticket)return{ok:false,error:'A complete visible browse, recovery and actual resumed walk are still needed.'};
 return RealmEarthWildSigns.command(wildSignsContext(),'observe',{quest:RealmEarthWildSignsData.ID,observationTicket:ticket},{save:worldSave});
}
function wildSignsRetryClearance(event){
 if(!wildSignsNativeEvent(event,'retry-clearance'))return{ok:false,error:'Use the active Retry clearance button for the actual defeated pest.'};
 wildSignsContext();return RealmAdventure.retryWildSignsClearance(sim);
}

// A prepared presentation copy, never proof issuance or Motion advancement.
let wildSignsDiagnosticFrame=null;
function wildSignsDiagnosticOwner(){
 return[sim,sim.state,sim.state.adventure,characterStore,characterStore.active,
  sim.room,sim.worldTrip,sim.earthTrip,sim.worldDive,sim.grazerOwnerLease,
  sim.wildSignsOwnerLease,sim.state.adventure.deaths,JSON.stringify(sim.returnPos),
  JSON.stringify(sim.worldTrip),JSON.stringify(sim.state.earthWildSigns)];
}
function prepareWildSignsDiagnostics(){
 const context=sim.grazerPresentationContext,view=sim.grazerPresentation;
 let safe=null;
 if(context?.sim===sim&&view&&RealmEarthGrazerMotion.isProjection(view,context)){
  safe={};
  for(const key of['actor','x','z','base','yaw','phase','phaseTime','lower','walking',
   'cycle','paused','reducedMotion','observedBehavior','observationReady','radius','height']){
   const value=view[key];if(typeof value==='string'||typeof value==='boolean'||
    typeof value==='number'&&Number.isFinite(value))safe[key]=value;
  }
 }
 wildSignsDiagnosticFrame={owner:wildSignsDiagnosticOwner(),view:safe};
}
function wildSignsDiagnostics(){
 // No context refresh, Motion call, scene sync, or opaque values in this getter.
 const frame=wildSignsDiagnosticFrame,current=wildSignsDiagnosticOwner(),live=!!frame&&
  frame.owner.length===current.length&&current.every((value,index)=>value===frame.owner[index]);
 let visibility=null;
 if(live&&grazerLastVisibility){
  const source=grazerLastVisibility;visibility={visible:source.visible===true};
  for(const key of['reason','phase','lower','at','parts','samples']){
   const value=source[key];if(typeof value==='string'||typeof value==='number'&&Number.isFinite(value))visibility[key]=value;
  }
  if(source.span&&Number.isFinite(source.span.width)&&Number.isFinite(source.span.height))visibility.span={width:source.span.width,height:source.span.height};
  if(Array.isArray(source.blocked))visibility.blockedCount=source.blocked.length;
 }
 const raw=sim.state.earthWildSigns;
 const record=raw?{version:raw.version,accepted:raw.accepted,evidence:Array.isArray(raw.evidence)?raw.evidence.slice():null,
  observed:raw.observed,resolution:raw.resolution,cleared:raw.cleared,claimed:raw.claimed}:null;
 return{record,view:live&&frame.view?{...frame.view}:null,visibility,
  prepared:live,renderer:!!engine&&!engine._contextLost};
}

function worldContext(){sim.earthHomecomingSave=earthHomecomingWriter();sim.cosmosCampaignSave=worldSave;sim.atlantisCampaignSave=worldSave;sim.heavenCampaignSave=worldSave;sim.hellCampaignSave=worldSave;sim.realmTrailSave=worldSave;sim.earthExpeditionSave=worldSave;bindWildSignsClearance();return{sim,active:characterStore.active,revision:characterStore.revision};}
function worldTravel(ticket){return RealmWorldFoundations.enter(ticket,worldContext(),{available:!!engine&&!!RealmWorldFoundationsArt,save,build:()=>switchScene(),restore:()=>{scene=Symbol('world-rollback');switchScene();}});}
function earthRoadTravel(ticket){return RealmEarthRoad.enter(ticket,worldContext(),{available:!!engine&&!!RealmEarthArt&&!!RealmWorldFoundationsArt,save:worldSave,build:()=>switchScene(),restore:()=>{scene=Symbol('earth-road-rollback');switchScene();}});}
function worldReturn(){if(sim.room===RealmCosmos.ROOM&&!sim.worldTrip)return cosmosReturn();const r=RealmWorldFoundations.leave(sim);if(r.ok){switchScene();save();toast('Back at your Firstlight checkpoint.');}return r;}
function worldSave(candidate){if(preserveExisting)return{ok:false,error:'Existing storage is preserved. Export before continuing.'};const r=characterStore.save(candidate);saveState=r.ok?'saved':'unavailable';renderStatus();return r;}
function worldCommand(type,payload){const r=RealmWorldFoundations.command(worldContext(),type,payload,{save:worldSave});if(r.ok&&!r.duplicate&&type==='claim'&&RealmWorldFoundations.handles(sim.room)&&engine)RealmWorldFoundationsArt.make(art,sim);if(r.ok&&!r.duplicate&&type==='observe'&&payload.realm==='heaven'&&audio.enabled)audio.note([261.63,329.63,392][RealmWorldFoundations.OBJECTIVES.indexOf(payload.objective)],audio.ctx.currentTime,.7,.035);return r;}
function homeCommand(type,payload){return RealmHomeHistory.command(worldContext(),type,payload,{save:worldSave});}
function earthHomecomingCommand(type,payload){const ctx=worldContext();return RealmEarthHomecoming.command(ctx,type,payload,{save:ctx.sim.earthHomecomingSave});}
function hellCampaignCommand(type,payload){return RealmHellCampaign.command(worldContext(),type,payload,{save:worldSave});}
function cosmosCampaignCommand(type,payload){return RealmCosmosCampaign.command(worldContext(),type,payload,{save:worldSave});}
function atlantisCampaignCommand(type,payload){return RealmAtlantisCampaign.command(worldContext(),type,payload,{save:worldSave});}
function heavenCampaignCommand(type,payload){return RealmHeavenCampaign.command(worldContext(),type,payload,{save:worldSave});}
function bridgeCommunityCommand(type,payload){return RealmBridgeCommunity.command(worldContext(),type,payload,{save:worldSave});}
function localLifeCommand(type,payload){const load=payload?.quest===RealmEarthConsignmentData.ID,ctx=load?consignmentContext():worldContext(),result=RealmLocalLife.command(ctx,type,payload,{save:worldSave});if(load)consignmentPresentation();return result;}
function trailCommand(type,payload){return RealmTrails.command(worldContext(),type,payload,{save:worldSave});}
function expeditionCommand(type,payload){return RealmEarthExpedition.command(fieldcraftContext(),type,payload,{save:worldSave});}
function earthBinding(weapon,kind){return RealmEarthExpedition.bindingCommand(worldContext(),weapon,kind,{save:worldSave});}
function trailAdjust(quest,step,value){return RealmTrails.adjust(worldContext(),quest,step,value);}
function realmFit(weapon){return RealmCraft.command(worldContext(),weapon,{save:worldSave});}
function workshopCommand(domain,id,type,payload){return RealmWorkshopTransactions.command(sim,domain,id,type,payload,{save:worldSave});}
function worldDiveEnter(){return RealmWorldFoundations.diveEnter(sim);}
function worldDiveExit(){return RealmWorldFoundations.diveExit(sim);}
function worldDiveStatus(){return RealmWorldFoundations.divingStatus(sim,engine?.camera.eye);}
function cosmosContext(){return{sim,active:characterStore.active,revision:characterStore.revision};}
function cosmosTravel(ticket){return RealmCosmos.enter(ticket,cosmosContext(),{available:!!engine&&!!RealmCosmosArt,save,build:()=>switchScene(),restore:()=>{scene=Symbol('travel-rollback');switchScene();}});}
function cosmosReturn(){const r=RealmCosmos.leave(sim);if(r.ok){switchScene();save();toast('Back at your Firstlight checkpoint.');}return r;}
function earthContext(){return{sim,active:characterStore.active,revision:characterStore.revision};}
function earthTravel(ticket){return RealmEarth.enter(ticket,earthContext(),{available:!!engine&&!!RealmEarthArt,save,build:()=>switchScene(),restore:()=>{scene=Symbol('travel-rollback');switchScene();}});}
function earthReturn(){const r=RealmEarth.leave(sim);if(r.ok){switchScene();save();toast('Back at your original Firstlight checkpoint.');}return r;}
function earthRiverReturn(){const p=RealmEarth.preview(earthContext());return p.ok?earthTravel(p.ticket):p;}
function cameraHalf(mode){
 const room=sim.room,inside=room&&!RealmWorldFoundations.handles(room)&&![RealmEarth.ROOM,RealmCosmos.ROOM,'riverbank','range','crossing','road','mine'].includes(room),aspect=innerWidth/innerHeight;
 if(mode==='wide'&&RealmWorldFoundations.handles(room)){const b=RealmWorldFoundations.definition(room).bounds;return Math.max((b.maxZ-b.minZ)/2+4,((b.maxX-b.minX)/2+4)/Math.max(.35,aspect));}
 if(mode==='wide')return room===RealmEarth.ROOM?Math.max(40,25/Math.max(.35,aspect)):room===RealmCosmos.ROOM?Math.max((RealmCosmos.BOUNDS.maxZ-RealmCosmos.BOUNDS.minZ)*.60,(RealmCosmos.BOUNDS.maxX-RealmCosmos.BOUNDS.minX)*.60/Math.max(.35,aspect)):room==='riverbank'?23:room==='range'?Math.max(19,17/Math.max(.35,aspect)):room==='crossing'?33:room==='road'?30:room==='mine'?17:inside?7:Math.max(36,39/Math.max(.55,aspect));
 if(mode==='tactical')return room==='mine'?16:room==='range'?17:inside?8:21;
 return room==='mine'?12:room==='range'?14:inside?7:17;
}
function fitCameraHalf(base,zoom){return Math.max(6,Math.min(Math.max(52,base),base*zoom));}
function rememberCamera(){
 if(!camera.ready||camera.tour)return;const views=sim.state.settings.cameraViews,yaw=((camera.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
 views.profiles[camera.preset]=camera.preset==='adventure'?{yaw,elevation:camera.elevation,distance:camera.distance}:{yaw,elevation:camera.elevation,zoom:camera.zoom};
}
function resize(){
 let w=innerWidth,h=innerHeight;if(engine)engine.resize(w,h,devicePixelRatio||1);ui.map.width=Math.round(w*(devicePixelRatio||1));ui.map.height=Math.round(h*(devicePixelRatio||1));
 if(camera.ready&&camera.preset!=='adventure'){camera.baseHalf=cameraHalf(camera.preset);camera.half=fitCameraHalf(camera.baseHalf,camera.zoom);}
 updateCamera(1);
}
function graphicsQuality(value){
 if(!['low','balanced','high'].includes(value))return{ok:false,error:'Choose Low, Balanced or High graphics.'};
 const changed=sim.state.settings.quality!==value;
 sim.state.settings.quality=value;
 if(engine){
  engine.quality=value;
  // Rebuild only this dry Earth scene, using its real existing art owner.
  // Keep the same camera, Simulation, travel and encounter leases.
  if(changed&&art&&sim.room===RealmEarthWildSignsData.ROOM&&!sim.worldDive)RealmWorldFoundationsArt.make(art,sim);
 }
 resize();return save();
}
function updateCamera(dt){
 if(!engine)return;if(camera.preset!=='adventure'||camera.tour){updateOrthographicCamera(dt);return;}
 const person=follow?sim.state.residents.find(r=>r.id===follow):sim.state.player,base=sceneHeight(person.x,person.z);
 const desired=grazerFocus()||fieldcraftFocus()||[person.x,base+1.5,person.z],still=sim.state.settings.reducedMotion,factor=still?1:1-Math.exp(-Math.max(dt,.001)*9);
 for(let i=0;i<3;i++)camera.center[i]+=(desired[i]-camera.center[i])*factor;
 const d=camera.distance,ce=Math.cos(camera.elevation),direction=[Math.sin(camera.yaw)*ce,Math.sin(camera.elevation),Math.cos(camera.yaw)*ce];
 const wanted=camera.center.map((v,i)=>v+direction[i]*d),clear=engine.clearCameraDistance(camera.center,wanted);
 // Pull in immediately; ease back out only after the obstruction has cleared.
 camera.actualDistance=clear<camera.actualDistance||still?clear:camera.actualDistance+(clear-camera.actualDistance)*(1-Math.exp(-Math.max(dt,.001)*5));
 const eye=camera.center.map((v,i)=>v+direction[i]*camera.actualDistance);eye[1]=Math.max(base+.45,eye[1]);
 engine.setCamera({eye,target:camera.center.slice(),projection:'perspective',fov:camera.fov,half:camera.half,aspect:innerWidth/innerHeight});
}
function updateOrthographicCamera(dt){if(!engine)return;let desired;const fittingFocus=grazerFocus()||fieldcraftFocus();if(fittingFocus)desired=fittingFocus;else if(camera.tour&&!sim.room){camera.tourTime=(camera.tourTime||0)+dt;let spots=[[0,1.7,2,23,.72],[14,1.8,3,19,.87],[33,2,1,17,1.05],[37,2,-1,14,1.23],[23,2,3,23,.85],[0,1.7,2,23,.72]],f=(camera.tourTime%60)/12,i=Math.min(4,Math.floor(f)),u=f-i;u=u*u*(3-2*u);let a=spots[i],b=spots[i+1];desired=a.slice(0,3).map((v,j)=>v+(b[j]-v)*u);camera.half=a[3]+(b[3]-a[3])*u;camera.yaw=a[4]+(b[4]-a[4])*u;}else if(RealmWorldFoundations.handles(sim.room)){const b=RealmWorldFoundations.definition(sim.room).bounds;desired=camera.overview?[(b.minX+b.maxX)/2,3,(b.minZ+b.maxZ)/2]:[sim.state.player.x,sceneHeight()+.6,sim.state.player.z];}else if(sim.room===RealmEarth.ROOM)desired=camera.overview?[0,3,-10]:[sim.state.player.x,sceneHeight()+.5,sim.state.player.z];else if(sim.room===RealmCosmos.ROOM)desired=camera.overview?[(RealmCosmos.BOUNDS.minX+RealmCosmos.BOUNDS.maxX)/2,4,(RealmCosmos.BOUNDS.minZ+RealmCosmos.BOUNDS.maxZ)/2]:[sim.state.player.x,sceneHeight()+.5,sim.state.player.z];else if(sim.room==='riverbank')desired=camera.overview?[0,2,-2.5]:[sim.state.player.x,2,sim.state.player.z];else if(sim.room==='range')desired=camera.overview?[0,2,0]:[sim.state.player.x,2,sim.state.player.z];else if(sim.room==='crossing')desired=camera.overview?[0,2,-1]:[sim.state.player.x,2,sim.state.player.z];else if(sim.room==='road')desired=camera.overview?[0,1.7,-3]:[sim.state.player.x,2,sim.state.player.z];else if(sim.room==='mine')desired=camera.overview?[0,2,-1]:[sim.state.player.x,2,sim.state.player.z];else if(sim.room)desired=[0,2,0];else if(camera.overview)desired=[10,1.7,-10];else{let p=follow?sim.state.residents.find(r=>r.id===follow):sim.state.player;desired=[p.x,1.9,p.z];}let factor=sim.state.settings.reducedMotion?1:1-Math.exp(-Math.max(dt,.001)*2.6);for(let i=0;i<3;i++)camera.center[i]+=(desired[i]-camera.center[i])*factor;let d=75,ce=Math.cos(camera.elevation),eye=[camera.center[0]+Math.sin(camera.yaw)*ce*d,camera.center[1]+Math.sin(camera.elevation)*d,camera.center[2]+Math.cos(camera.yaw)*ce*d];engine.setCamera({eye,target:camera.center.slice(),half:camera.half,aspect:innerWidth/innerHeight});}
function cameraPreset(mode='adventure',remember=true,reset=false){
 if(!['adventure','follow','tactical','wide'].includes(mode))return;
 clearGrazerFocus();fieldcraftFrame=null;if(remember)rememberCamera();const views=sim.state.settings.cameraViews,p=reset?null:views.profiles[mode];
 camera.tour=false;follow=null;camera.preset=mode;camera.overview=mode==='wide';
 if(mode==='adventure'){camera.yaw=p?.yaw??sim.state.player.yaw+Math.PI;camera.elevation=p?.elevation??.28;camera.distance=p?.distance??7.5;camera.actualDistance=camera.distance;camera.fov=sim.state.settings.cameraFov;}
 else{views.lastDiorama=mode;camera.yaw=p?.yaw??.76;camera.elevation=p?.elevation??(mode==='tactical'?1.08:.88);camera.baseHalf=cameraHalf(mode);camera.zoom=p?.zoom??1;camera.half=fitCameraHalf(camera.baseHalf,camera.zoom);}
 camera.ready=true;updateCamera(1);rpg?.cameraPaint(mode);
 const view=$('#camera-mode');if(view)view.value=mode;const fov=$('#camera-fov');if(fov)fov.disabled=mode!=='adventure';
 if(remember){sim.state.settings.cameraMode=mode;save();}
}
function toggleCamera(){cameraPreset(camera.preset==='adventure'?sim.state.settings.cameraViews.lastDiorama:'adventure');}
function resetCamera(){cameraPreset(camera.preset,true,true);}
function frameFoe(){
 if(!engine||sim.paused||sim.worldDive)return{ok:false,error:'Return to active dry play before framing a foe.'};
 const result=RealmCombatView.plan({preset:camera.preset,player:sim.state.player,enemy:RealmCombat.selected(sim),distance:camera.distance});
 if(!result.ok)return result;clearGrazerFocus();Object.assign(camera,result.view);follow=null;updateCamera(1);save();return result;
}
function bridgeView(){
 if(!engine)return{ok:false,error:'3D is unavailable for framing this crossing.'};
 const result=RealmBridgeMomentView.plan({scene:sim.room,player:sim.state.player,
  preset:camera.preset,diving:!!sim.worldDive,baseHalf:camera.baseHalf});
 if(!result.ok)return result;
 clearGrazerFocus();Object.assign(camera,result.view);follow=null;
 updateCamera(1);save();return result;
}
function switchScene(){syncFieldcraftOwner();bindWildSignsClearance();if(scene===sim.room)return;rememberCamera();scene=sim.room;camera.tour=false;if(engine){if(RealmWorldFoundations.handles(scene)){RealmWorldFoundationsArt.make(art,sim);engine.surfacePick=(start,ray,max)=>sim.worldDive?null:RealmWorldFoundations.pick(scene,start,ray,max);}else if(scene===RealmEarth.ROOM){RealmEarthArt.make(art,sim);engine.surfacePick=RealmEarth.pick;}else if(scene===RealmCosmos.ROOM){RealmCosmosArt.make(art,sim);engine.surfacePick=RealmCosmos.pick;}else if(scene==='riverbank')RealmStarterArt.make(art,sim);else if(scene==='crossing')RealmCrossingArt.make(art,sim);else if(scene==='range')RealmArsenalArt.court(art);else if(scene==='road')RealmRoadArt.make(art,sim);else if(scene==='mine')RealmAdventureArt.cave(art,sim);else if(scene)art.makeInterior(scene,sim.state.retreat);else art.makeExterior();}camera.center=[sim.state.player.x,sceneHeight()+1.5,sim.state.player.z];cameraPreset(camera.preset,false);target=null;follow=null;labelsRebuild();resize();}
function save(){rememberCamera();if(preserveExisting){saveState='preserved';renderStatus();return{ok:false,error:'Existing storage could not be read. Export a JSON backup; it has not been overwritten.'};}let r=characterStore.save(sim.snapshot());saveState=r.ok?'saved':'unavailable';renderStatus();return r;}
function renderStatus(){$('#save-status').innerHTML=characterStore.managed&&!characterStore.writer?'SAVING UNAVAILABLE · EXPORT TO KEEP':saveState==='saved'?'<i class="dot"></i>SAVED ON THIS DEVICE':saveState==='new'?'<i class="dot"></i>LOCAL WORLD':'MEMORY ONLY · EXPORT TO KEEP';}
function command(type,payload){if(RealmHomeHistory.layoutAction(type)){const r=homeCommand(type,{...payload,expectedRevision:payload?.expectedRevision??sim.state.retreat.revision});toast(r.text||r.error);return r;}let r=sim.act('ui-'+Date.now()+'-'+(++commandCount),type,payload);if(r.ok)save();if(r.text)toast(r.text);else if(r.error)toast(r.error);return r;}
function navigate(id){if(RealmAdventure.combatScene(sim)){toast('Use this area’s exit before choosing a valley destination.');return false;}adventure?.stopAuto();sandbox?.stopAuto();sandbox?.endBuild();camera.tour=false;let l=C.LANDMARKS.find(x=>x.id===id);if(!l)return false;if(sim.room){sim.leave();switchScene();}let r=sim.moveTo(l.x,l.z);if(r.ok){target={x:l.x,z:l.z};follow=null;camera.overview=false;toast('Walking to '+l.short.toLowerCase()+'.');}else toast(r.error);return r.ok;}
function action(id){if(RealmAdventure.combatScene(sim)){toast('Use this area’s exit before interacting with valley locations.');return;}let l=C.LANDMARKS.find(l=>l.id===id);if(!l)return;if(sim.room){sim.leave();switchScene();save();return;}if(Math.hypot(sim.state.player.x-l.x,sim.state.player.z-l.z)>3.4){navigate(id);toast('Walk closer, then interact at '+l.short.toLowerCase()+'.');return;}if(l.kind==='interior'){let r=sim.enter(id);if(r.ok){switchScene();save();closePanel();toast('Welcome inside. Press E or Escape to return.');}else toast(r.error);}else if(id==='garden'){command('plant');}else if(id==='stage'){if(sim.gathering){experience.open();return;}let r=command('gather');if(r.ok){let playing=experience.play();toast(playing?'Your piece is playing. Ilan, Mara and Oren are walking to the stage.':'The family is walking here. Enable sound to play your piece.');}}else if(id==='market'){sim.event('workshop','You inspected Oren’s portable music stand project.');save();openPanel('inhabitants');selectResident('oren');}else{sim.event('rest',id==='shore'?'You spent a quiet moment beside the water.':id==='commons'?'You rested under the Firstlight tree.':'You rested at '+l.name+'.');save();toast(id==='shore'?'The valley keeps its own small rhythm.':'There is nothing you have to finish right now.');}}
function closest(){let p=sim.state.player,b=null,d=3.4;for(let l of C.LANDMARKS){let dd=Math.hypot(p.x-l.x,p.z-l.z);if(dd<d){b=l;d=dd;}}return b;}
function interact(){if(rpg?.interact())return;if(adventure?.interact())return;if(sandbox?.interact())return;if(sim.room){sim.leave();switchScene();save();toast('Back beneath the open sky.');return;}let l=closest();if(l)action(l.id);else toast('Approach a doorway, garden, stage or pier. Explore lists every destination.');}
function openPanel(name){if(rpg?.intercept(name))return;if(rpg?.dialog.open)rpg.close();RealmCombat.stop(sim);adventure?.stopAuto();keys.clear();if(name!=='build')sandbox?.endBuild();if(experience?.dialog.open)experience.close();if(panel===name){closePanel();return;}lastFocus=document.activeElement;panel=name;ui.drawer.inert=false;ui.drawer.classList.add('open');document.body.classList.add('panel-open');for(let el of document.querySelectorAll('[data-panel]'))el.setAttribute('aria-pressed',el.dataset.panel===name?'true':'false');renderPanel();$('#close-panel').focus({preventScroll:true});}
function closePanel(){panel=null;ui.drawer.classList.remove('open');ui.drawer.inert=true;document.body.classList.remove('panel-open');for(let el of document.querySelectorAll('[data-panel]'))el.setAttribute('aria-pressed','false');if(lastFocus&&document.contains(lastFocus))lastFocus.focus({preventScroll:true});}
const button=(label,act,extra='')=>'<button data-action="'+act+'" '+extra+'>'+label+'</button>';
function renderPanel(){if(!panel)return;let s=sim.state,html='',custom=arsenal?.renderPanel(panel)??adventure?.renderPanel(panel)??sandbox?.renderPanel(panel)??experience?.renderPanel(panel);if(custom!==null&&custom!==undefined){ui.title.textContent=({armory:'The Bow & Gem',adventure:sim.state.adventure.reward?'The Sunward Road':'The Feather Beneath Wildwood',pack:'A little room to carry things',craft:'From gathered to made',build:'Your Wildwood homestead',journey:'A home beyond the valley',retreat:'A place of your own',visitor:'Your visitor'})[panel]||'Firstlight';ui.body.innerHTML=custom;return;}if(panel==='explore'){ui.title.textContent='Places to become';html='<div class="row"><button data-action="sb-open" data-id="journey">Wildwood field guide</button><button data-action="sb-open" data-id="armory">Bows & gems</button><button data-action="open-visitor">Visitor</button><button data-action="open-retreat">My room</button><button data-action="sb-open" data-id="inhabitants">Inhabitants</button><button data-action="sb-open" data-id="chronicle">Chronicle</button></div>'+'<p class="intro">Choose a path. The valley is walkable; the far mountains are scenery. Cross the eastern bridge to your retreat and the blossom garden. Four doors open into rendered interiors.</p>'+C.LANDMARKS.map(l=>'<article class="card"><div class="card-header"><h3>'+esc(l.short)+'</h3><span class="badge">'+(s.visited.includes(l.id)?'discovered':'unvisited')+'</span></div><p>'+esc(l.description)+'</p><div class="row">'+button('Walk here','walk','data-id="'+l.id+'"')+button(l.action,'place-action','data-id="'+l.id+'"')+'</div></article>').join('');}
 else if(panel==='inhabitants'){ui.title.textContent='Lives in the valley';html='<p class="intro">Ilan, Mara and Oren are an authored family simulation. Their routines, encounters and project counters persist locally. No Luna instance or language model is connected.</p>';if(selected){let p=C.PROFILES.find(p=>p.id===selected),r=s.residents.find(r=>r.id===selected),run=sim.runs.get(selected),l=C.LANDMARKS.find(x=>x.id===run.goal);html+='<div class="card"><div class="card-header"><span class="avatar" style="background:'+p.color+'44">'+p.name[0]+'</span><div><h3>'+p.name+'</h3><small>'+p.role+' · '+(run.inside?'At home':run.walking?'On the way':l.short)+'</small></div></div><p>'+esc(p.kin)+'. '+esc(p.description)+'</p><div class="project"><small>'+esc(p.projectKind)+'</small><strong>'+esc(p.project)+'</strong><div class="progress"><i style="width:'+Math.round(r.progress*100)+'%"></i></div><small>Local routine progress · not verified creative output</small></div>'+(p.tracks?'<p>'+p.tracks.map((t,i)=>(i+1)+'. '+esc(t)).join('<br>')+'</p>':'')+'<div id="dialogue-slot"></div><div class="row">'+button('Exchange a few words','talk','data-id="'+p.id+'"')+button(follow===p.id?'Stop following':'Follow','follow','data-id="'+p.id+'"')+button('Walk to their place','resident-walk','data-id="'+p.id+'"')+'</div></div>';}
 html+=C.PROFILES.filter(p=>p.id!==selected).map(p=>{let r=s.residents.find(x=>x.id===p.id),run=sim.runs.get(p.id),l=C.LANDMARKS.find(x=>x.id===run.goal);return'<article class="card"><div class="card-header"><span class="avatar" style="background:'+p.color+'44">'+p.name[0]+'</span><div><h3>'+p.name+'</h3><small>'+p.role+' · '+(run.inside?'At home':l.short)+'</small></div></div><p>'+esc(p.project)+'</p>'+button('Meet '+p.name,'select-resident','data-id="'+p.id+'"')+'</article>';}).join('');html+='<div class="notice">The small turquoise helper near the exchange is a looping service-agent visualization, not another resident.</div>';}
 else if(panel==='chronicle'){ui.title.textContent='Your small chronicle';html='<p class="intro">Your notes, discoveries and encounters live in this browser, not in a cloud account. Export a backup to carry them elsewhere.</p><div class="row">'+button('Export world JSON','export')+button('Import world JSON','import')+'</div><div class="section-label">Leave a note</div><textarea id="note-text" maxlength="1200" aria-label="Your local notebook entry" placeholder="Something you want to remember about this place…"></textarea><div class="row" style="margin-top:9px">'+button('Keep this note','note')+'<small class="muted">'+s.notes.length+' / 20 notes</small></div>';if(s.notes.length)html+='<div class="section-label">Notebook</div>'+s.notes.slice().reverse().map(n=>'<article class="card"><small class="muted">DAY '+n.day+'</small><div class="note">'+esc(n.text)+'</div></article>').join('');html+='<div class="section-label">Things that actually happened here</div>'+(s.journal.length?s.journal.slice().reverse().slice(0,50).map(j=>'<div class="journal-entry"><small>DAY '+j.day+' · '+formatHour(j.hour)+' · '+esc(j.kind)+'</small>'+esc(j.text)+'</div>').join(''):'<p class="intro">The page is still open. Go somewhere.</p>');}
 else if(panel==='settings'){ui.title.textContent='View, light & atmosphere';html='<p class="intro">Shape this local evening. Changing the clock changes the residents’ schedules. Pause stops simulation—not just animation.</p><div class="setting"><label for="time-slider">Time of day <span id="slider-hour">'+formatHour(s.hour)+'</span></label><input id="time-slider" type="range" min="0" max="23.9" step=".1" value="'+s.hour+'"></div><div class="row">'+button('Morning','time','data-hour="9"')+button('Golden hour','time','data-hour="17.2"')+button('Night','time','data-hour="21.5"')+'</div><div class="row"><button data-action="open-visitor">Visitor appearance</button><button data-action="open-retreat">My retreat</button></div><div class="section-label">Weather</div><div class="row">'+button('Clear','weather','data-weather="clear" aria-pressed="'+(s.weather==='clear')+'"')+button('Rain','weather','data-weather="rain" aria-pressed="'+(s.weather==='rain')+'"')+'</div><div class="divider"></div><div class="setting"><label for="camera-mode">Camera view</label><select id="camera-mode">'+[['adventure','Third person · Adventure'],['follow','Diorama · follow your character'],['tactical','Tactical · overhead'],['wide','Wide · whole area']].map(([id,label])=>'<option value="'+id+'" '+(camera.preset===id?'selected':'')+'>'+label+'</option>').join('')+'</select></div><div class="setting"><label for="camera-fov">Third-person field of view <span id="camera-fov-value">'+s.settings.cameraFov+'°</span></label><input id="camera-fov" type="range" min="45" max="80" step="1" value="'+s.settings.cameraFov+'" '+(camera.preset!=='adventure'?'disabled':'')+'></div><p class="intro">Both styles are yours: V swaps third person and your last diorama view. Drag to orbit and scroll to zoom; each view remembers its framing. R resets the current view. Third-person FOV widens the perspective; diorama uses zoom.</p><div class="setting"><label for="quality">Graphics</label><select id="quality"><option value="low" '+(s.settings.quality==='low'?'selected':'')+'>Low · no reflection/shadow pass</option><option value="balanced" '+(s.settings.quality==='balanced'?'selected':'')+'>Balanced · water reflections + shadows</option><option value="high" '+(s.settings.quality==='high'?'selected':'')+'>High · higher render resolution</option></select></div>'+[['timeFlow','Let the hours pass'],['labels','Place and inhabitant labels'],['reducedMotion','Reduced motion & camera smoothing'],['cameraCutaway','Cut away scenery hiding your character']].map(([k,label])=>'<div class="setting check"><label for="setting-'+k+'">'+label+'</label><input id="setting-'+k+'" data-setting="'+k+'" type="checkbox" '+(s.settings[k]?'checked':'')+'></div>').join('')+'<div class="row">'+button(sim.paused?'Resume time':'Pause time','pause')+button('Capture a photo','capture')+button('Hide interface','photo')+'</div><div class="divider"></div><p class="intro" id="help-text"><kbd>WASD / arrows</kbd> walk · <kbd>E</kbd> interact / leave<br><kbd>C</kbd> character · <kbd>I</kbd> inventory · <kbd>K</kbd> craft<br><kbd>J</kbd> journal · <kbd>Tab</kbd> target · <kbd>1</kbd> autoattack<br><kbd>2–6</kbd> skills · <kbd>Space</kbd> dodge<br><kbd>V</kbd> camera styles · <kbd>R</kbd> reset current view · <kbd>[ ]</kbd> rotate · <kbd>M</kbd> map<br><kbd>P</kbd> pause · <kbd>H</kbd> photo mode · <kbd>Escape</kbd> close / leave<br>Drag with either mouse button to orbit; scroll to zoom.<br>On touch: tap to walk, drag to orbit, pinch to zoom.</p><div class="notice">Authored scenery, surface textures and concept paintings are included with the game. Sound is procedural. Rendering and simulation run on your device. No assets, accounts, analytics or AI APIs are fetched.</div><div class="divider"></div>'+button('Start a fresh local world','reset','class="danger wide"')+'<p class="legal">This is a local exploration prototype. It does not contain a sentient resident, connect to Luna2, or implement multiplayer. Simulated routines are not evidence of inner experience.</p>';}
 ui.body.innerHTML=html;}
function selectResident(id){selected=id;if(panel!=='inhabitants'){panel=null;openPanel('inhabitants');}else renderPanel();}
ui.body.addEventListener('click',e=>{let b=e.target.closest('[data-action]');if(!b)return;if(arsenal?.action(b)||adventure?.action(b)||sandbox?.action(b)||experience?.action(b))return;let id=b.dataset.id;switch(b.dataset.action){case'open-visitor':openPanel('visitor');break;case'open-retreat':openPanel('retreat');break;case'walk':navigate(id);closePanel();break;case'place-action':action(id);break;case'select-resident':selectResident(id);break;case'talk':{let r=command('talk',{id});if(r.ok){let slot=$('#dialogue-slot');if(slot)slot.innerHTML='<div class="quote">“'+esc(r.text)+'”</div><small class="muted">Authored local dialogue · no model request</small>';}break;}case'follow':follow=follow===id?null:id;camera.overview=false;toast(follow?'Following '+C.PROFILES.find(p=>p.id===id).name+'. Movement is still yours.':'Camera returned to your visitor.');renderPanel();break;case'resident-walk':navigate(sim.runs.get(id).goal);closePanel();break;case'plant':command('plant');break;case'note':{let r=command('note',{text:$('#note-text').value});if(r.ok)renderPanel();break;}case'export':exportWorld();break;case'import':openImport();break;case'time':sim.setTime(+b.dataset.hour);renderPanel();save();break;case'weather':sim.state.weather=b.dataset.weather;renderPanel();save();break;case'pause':experience?.stop();sim.paused=!sim.paused;renderPanel();toast(sim.paused?'The local world is paused.':'The local world is moving again.');break;case'photo':closePanel();togglePhoto();break;case'capture':capture();break;case'reset':if(characterStore.managed){rpg.open('characters');toast('Create another character here. Your current world stays intact.');}else if(confirm('Start a new local world? Export your current world first to keep your notes and flowers.'))replaceLegacyWorld(C.fresh());break;}});
ui.body.addEventListener('input',e=>{if(e.target.id==='camera-fov'){camera.fov=sim.state.settings.cameraFov=Math.max(45,Math.min(80,+e.target.value));$('#camera-fov-value').textContent=camera.fov+'°';updateCamera(1);}if(e.target.id==='time-slider'){sim.setTime(+e.target.value);$('#slider-hour').textContent=formatHour(sim.state.hour);}});ui.body.addEventListener('change',e=>{if(e.target.id==='camera-mode')cameraPreset(e.target.value);if(e.target.id==='camera-fov')save();experience?.changed(e);if(e.target.id==='quality')graphicsQuality(e.target.value);if(e.target.dataset.setting){sim.state.settings[e.target.dataset.setting]=e.target.checked;if(e.target.dataset.setting==='reducedMotion'){document.body.classList.toggle('reduced',e.target.checked);if(engine)engine.reducedMotion=e.target.checked;}save();}if(e.target.id==='time-slider')save();});
function download(data,name,type){let url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportWorld(){download(JSON.stringify(sim.snapshot(),null,2),'Firstlight-Valley-day-'+sim.state.day+'.json','application/json');toast('World exported. Keep the JSON with your HTML.');}
function applyWorld(state){clearGrazerFocus();syncConsignmentOwner(true);syncFieldcraftOwner(true);syncWildSignsOwner(true);keys.clear();pointers.clear();gesture=null;document.body.classList.remove('photo-mode');rpg?.reset();adventure?.reset();sandbox?.endBuild();sandbox?.stopAuto();experience?.stop();if(experience){experience.scoreUndo=[];experience.scoreRedo=[];experience.selectedSlot='nw';experience.memories.pending=null;}if(experience?.dialog.open)experience.close();audio.disable();sim=new C.Simulation(state);state=sim.state;camera.ready=false;camera.preset=state.settings.cameraMode;camera.fov=state.settings.cameraFov;scene=Symbol('rebuild');switchScene();selected=null;follow=null;closePanel();document.body.classList.toggle('reduced',sim.state.settings.reducedMotion);if(engine)engine.quality=sim.state.settings.quality;resize();sandbox?.reset();if(rpg){rpg.quest=state.adventure.pursuit.pinned?'project':state.adventure.starter.accepted&&!state.adventure.starter.reward?'starter':'story';if(state.earthExpedition.story.accepted&&!state.earthExpedition.story.claimed||state.earthExpedition.patrol.active)rpg.quest='expedition';rpg.tick();}lastSave=elapsed;}
let importRead=0;
$('#import-file').addEventListener('click',()=>{importRead++;});
$('#import-file').addEventListener('change',async e=>{
 const f=e.target.files[0];if(!f)return;
 const request=++importRead,owner=sim,active=characterStore.active,revision=characterStore.revision,asCharacter=characterStore.managed||characterImportPending;
 try{
  if(f.size>1000000)throw Error('Save exceeds the 1 MB import limit.');
  const text=await f.text();if(request!==importRead)return;
  if(owner!==sim||active!==characterStore.active||revision!==characterStore.revision)throw Error('The character or saved library changed while this file was loading. Import it again.');
  const state=C.validate(JSON.parse(text));
  if(asCharacter){rpg.characters.previewImport(state);return;}
  if(!confirm('Replace this local world with the selected save? Export first to keep the current one.'))return;
  await replaceLegacyWorld(state);
 }catch(err){if(request===importRead)toast('Import refused: '+err.message);}
 finally{if(request===importRead){e.target.value='';characterImportPending=false;}}
});

async function acquireCharacterWriter(){
 const owned=await characterLock.acquire();characterStore.writer=owned;
 if(!owned)characterStore.error=characterLock.error;renderStatus();return owned;
}
async function replaceLegacyWorld(state){
 // Keep explicit single-world import/reset available in older browsers.
 // Managed character transactions always require the editing lock.
 if(characterLock.manager?.request&&!await acquireCharacterWriter()){toast(characterLock.error);return;}
 const result=characterStore.replaceLegacy(state);if(!result.ok){toast(result.error);return;}
 preserveExisting=false;applyWorld(result.state);saveState='saved';renderStatus();toast('World restored. Sound remains off until you enable it.');
}
async function characterAction(type,payload,expectedRevision){
 if(!await acquireCharacterWriter())return{ok:false,error:characterLock.error};
 rememberCamera();const result=characterStore.command(type,payload,sim.snapshot(),expectedRevision);
 if(!result.ok){toast(result.error);renderStatus();return result;}
 preserveExisting=false;saveState='saved';
 if(type!=='delete'){applyWorld(result.state);toast('Playing '+sim.state.visitor.name+'. Each character keeps its own world.');}
 else toast('Inactive character removed. Your current world is saved.');
 renderStatus();return{ok:true};
}
function characterExport(id){try{rememberCamera();const data=characterStore.export(id,sim.snapshot()),name=JSON.parse(data).visitor.name.replace(/[^a-z0-9_-]/gi,'-');download(data,'Firstlight-'+name+'.json','application/json');toast('Character world exported as a portable JSON save.');}catch(e){toast(e.message);}}
function characterRecovery(){try{const entries=[RealmCharacters.KEY,C.KEY,C.LEGACY_KEY].map(key=>({key,text:localStorage.getItem(key)})).filter(e=>e.text!==null);if(!entries.length)throw Error('No readable saved storage was found.');download(JSON.stringify({format:'firstlight-local-recovery',version:1,entries},null,2),'Firstlight-storage-recovery.json','application/json');toast('Original storage copied unchanged. Keep this recovery file for repair; it is not a single-character import.');}catch(e){toast('Recovery copy unavailable: '+e.message);}}
function openImport(asCharacter=false){characterImportPending=asCharacter;$('#import-file').click();}
function characterImport(){openImport(true);}
function characterReload(){if(confirm('Reload the saved character library? Export first to keep any play that could not be saved.'))location.reload();}
$('#import-file').addEventListener('cancel',()=>{importRead++;characterImportPending=false;});
window.addEventListener('storage',e=>{if(e.key===RealmCharacters.KEY||e.key===null){const r=characterStore.checkSource();if(!r.ok){saveState='unavailable';toast(r.error);renderStatus();if(rpg?.dialog.open&&rpg.tab==='characters')rpg.paint();}}});
function capture(){if(!engine){toast('Photo capture requires the 3D renderer; JSON export still works.');return;}try{syncFieldcraftOwner();consignmentPresentation();grazerPresentation();prepareWildSignsDiagnostics();art.update(sim,elapsed,target);engine.render(elapsed,sim.state.hour,sim.state.weather==='rain');ui.canvas.toBlob(blob=>{if(blob){download(blob,'Firstlight-Valley.png','image/png');toast('Your view captured as a PNG.');}else toast('The browser could not capture that frame.');},'image/png');}catch(e){toast('Photo unavailable: '+e.message);}}
function togglePhoto(){document.body.classList.toggle('photo-mode');if(document.body.classList.contains('photo-mode'))toast('Press H to return.');}
// Web Audio: one quiet soundscape and one original pentatonic motif; opt-in only.
const audio={ctx:null,master:null,enabled:false,soundscape:null,
 enable(){try{
  if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);}
  if(!this.soundscape||this.soundscape.disposed)this.soundscape=new RealmSoundscape.Soundscape(this.ctx,this.master,C.rng(73));
  this.ctx.resume().catch(()=>{});this.master.gain.setTargetAtTime(.55,this.ctx.currentTime,.3);this.enabled=true;this.tick(elapsed);this.paint();return true;
 }catch(e){this.enabled=false;toast('Audio unavailable in this browser.');return false;}},
 disable(){rpg?.gathering?.stop();experience?.stop();if(this.ctx&&this.master)this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.1);this.enabled=false;this.tick(elapsed);this.paint();},
 paint(){$('#sound').setAttribute('aria-pressed',String(this.enabled));$('#sound').setAttribute('aria-label',this.enabled?'Disable ambient sound':'Enable ambient sound');$('#sound').textContent=this.enabled?'♪':'♫';},
 toggle(){this.enabled?this.disable():this.enable();},
 note(freq,start,duration,level=.06){let c=this.ctx;if(!c)return;let o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(level,start+.025);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g).connect(this.master);o.start(start);o.stop(start+duration+.05);o.onended=()=>{o.disconnect();g.disconnect();};},
 melody(){if(!this.enabled)return;let t=this.ctx.currentTime+.1;[0,7,12,9,7,4,2,4,7,12,9,0].forEach((n,i)=>this.note(261.63*Math.pow(2,n/12),t+i*.37,1.3,.055));},
 tick(t){if(!this.soundscape||this.soundscape.disposed)return;const medium=sim.worldDive?RealmWorldFoundations.divingStatus(sim)?.body:null;
  const result=this.soundscape.update({room:sim.room,hour:sim.state.hour,hp:sim.state.adventure.started?sim.state.adventure.hp:1,paused:sim.paused||!this.enabled,hidden:document.hidden,medium},t);
  if(result.bird&&this.enabled){const now=this.ctx.currentTime;this.note(1700+Math.sin(t)*200,now,.12,.012);this.note(2200,now+.17,.18,.011);}
 }
};
document.addEventListener('visibilitychange',()=>audio.tick(elapsed));
window.addEventListener('pagehide',()=>audio.soundscape?.dispose());
window.addEventListener('pageshow',()=>{if(audio.enabled&&audio.soundscape?.disposed)audio.enable();});
experience=new RealmExperience.Experience({sim:()=>sim,command,homeCommand,openCommission:id=>{closePanel();if(id==='earthlands')rpg.open('community');else{rpg.civic.selected=id;rpg.open('local-life');}},seekMaterial:id=>sandbox.seek(id),save,saved:()=>saveState==='saved',toast,download,closePanel:()=>{rpg?.gathering?.stop();closePanel();},navigate,action,renderPanel,panel:()=>panel,audio:()=>audio,beforePlay:()=>rpg?.gathering?.stop(),clearKeys:()=>keys.clear(),redrawRoom:()=>{if(sim.room==='retreat'&&art){art.makeRetreat(sim.state.retreat);labelsRebuild();}}});
$('#now-playing').onclick=()=>experience.open();
function walkSandbox(x,z){if(RealmAdventure.combatScene(sim)){toast('Use the southern lantern exit first.');return false;}adventure?.stopAuto();camera.tour=false;if(sim.room){sim.leave();switchScene();}let result=sim.moveTo(x,z);if(result.ok){target={x,z};camera.overview=false;follow=null;}else toast(result.error);return result.ok;}
sandbox=new RealmSandboxUI.SandboxUI({workshopCommand,sim:()=>sim,sequence:{n:0},time:()=>elapsed,save,toast,openPanel,closePanel,renderPanel,panel:()=>panel,walk:walkSandbox});
function walkAdventure(x,z){camera.tour=false;follow=null;camera.overview=false;let r=sim.moveTo(x,z);if(r.ok)target={x,z};else toast(r.error);return r.ok;}
adventure=new RealmAdventureUI.AdventureUI({workshopCommand,earthRiverReturn,sim:()=>sim,save,toast,openPanel,closePanel,renderPanel,panel:()=>panel,navigate,walk:walkSandbox,walkLocal:walkAdventure,changed:switchScene,endBuild:()=>sandbox.endBuild(),clearKeys:()=>keys.clear(),audio:()=>audio,project:(x,y,z)=>engine?.project(x,y,z),direction:()=>{let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);return dx||dz?{dx:dx*Math.cos(camera.yaw)+dz*Math.sin(camera.yaw),dz:-dx*Math.sin(camera.yaw)+dz*Math.cos(camera.yaw)}:{dx:Math.sin(sim.state.player.yaw),dz:Math.cos(sim.state.player.yaw)};}});


arsenal=new RealmArsenalUI.ArsenalUI({sim:()=>sim,adventure:()=>adventure,openPanel,closePanel,renderPanel,panel:()=>panel,walk:walkAdventure,endBuild:()=>{sandbox?.endBuild();sandbox?.stopAuto();keys.clear();}});

rpg=new RealmRPGUI.RPGUI({wildSignsContext,wildSignsCommand,wildSignsObserve,wildSignsRetryClearance,consignmentContext,consignmentControl,fieldcraftContext,frameFieldcraft,frameGrazer,earthRoadTravel,frameFoe,canFrameFoe:()=>!!engine&&!sim.paused&&!sim.worldDive&&RealmCombatView.plan({preset:camera.preset,player:sim.state.player,enemy:RealmCombat.selected(sim),distance:camera.distance}).ok,earthHomecomingCommand,cosmosCampaignCommand,atlantisCampaignCommand,heavenCampaignCommand,hellCampaignCommand,bridgeCommunityCommand,localLifeCommand,workshopCommand,worldContext,expeditionCommand,earthBinding,worldTravel,worldReturn,worldCommand,trailCommand,trailAdjust,realmFit,worldDiveEnter,worldDiveExit,worldDiveStatus,earthContext,earthTravel,earthReturn,bridgeView,cosmosContext,cosmosTravel,cosmosReturn,sim:()=>sim,adventure:()=>adventure,closePanel,openPanel,endBuild:()=>{sandbox.endBuild();sandbox.stopAuto();},clearKeys:()=>keys.clear(),focusWorld:()=>ui.canvas.focus({preventScroll:true}),toast,save,exportWorld,characters:()=>characterStore.describe(sim.snapshot()),characterAction,characterExport,characterImport,characterReload,characterRecovery,panel:()=>panel,camera:cameraPreset,resetCamera,rotate:a=>{clearGrazerFocus();camera.yaw+=a;camera.tour=false;},direction:()=>adventure.api.direction(),music:()=>experience.open(),gather:id=>sandbox.seek(id),walkLocal:walkAdventure,stopPersonalMusic:()=>experience?.stop(),audio:()=>audio,project:(x,y,z)=>engine?.project(x,y,z)});
// Input distinguishes clicks from drags, with two-finger zoom on touch screens.
let pointers=new Map(),gesture=null,keys=new Set();function zoom(k){clearGrazerFocus();camera.tour=false;if(camera.preset==='adventure'){camera.distance=Math.max(3.5,Math.min(20,camera.distance*k));return;}camera.half=C.clamp?C.clamp(camera.half*k,6,52):Math.max(6,Math.min(52,camera.half*k));camera.zoom=camera.half/camera.baseHalf;camera.overview=false;}
function pointerDown(e){e.currentTarget.focus({preventScroll:true});camera.tour=false;if(e.button!==0&&e.button!==2&&e.pointerType!=='touch')return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,pinch:false,orbitOnly:e.button===2};else if(pointers.size===2){let p=[...pointers.values()];gesture.pinch=true;gesture.moved=true;gesture.distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}}
function pointerMove(e){if(sandbox?.build&&engine){const p=engine.groundAt(e.clientX,e.clientY,1.3);if(p)sandbox.cursor(p);}if(!pointers.has(e.pointerId)||!gesture)return;let before=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){let p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(gesture.distance>1&&d>1)zoom(gesture.distance/d);gesture.distance=d;return;}let distance=Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y);if(distance>6)gesture.moved=true;if(gesture.moved&&!gesture.pinch){clearGrazerFocus();camera.yaw-=(e.clientX-before.x)*.007;camera.elevation=Math.max(camera.preset==='adventure'?-.08:.39,Math.min(1.2,camera.elevation+(e.clientY-before.y)*.004));}}
function pointerUp(e){if(!pointers.has(e.pointerId)||!gesture)return;let click=!gesture.moved&&!gesture.pinch&&!gesture.orbitOnly;pointers.delete(e.pointerId);if(click){if(engine&&adventure?.screenClick(e.clientX,e.clientY)){if(!pointers.size)gesture=null;return;}let p=engine?engine.groundAt(e.clientX,e.clientY,sim.room?1.58:1.3):mapToWorld(e.clientX,e.clientY);if(!p){if(!pointers.size)gesture=null;return;}if(adventure?.worldClick(p)||sandbox?.worldClick(p,e.pointerType==='touch')){if(!pointers.size)gesture=null;return;}let r=sim.moveTo(p.x,p.z);if(r.ok){target=p;follow=null;camera.overview=false;}else toast('That point is outside the walkable ground. Choose a path or use Explore.');}if(!pointers.size)gesture=null;if(gesture===null){rememberCamera();save();}}
for(let canvas of[ui.canvas,ui.map]){canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);gesture=null;});canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(e.deltaY*.001));save();},{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());}
window.addEventListener('keydown',e=>{
 if(document.querySelector('dialog[open]'))return;
 if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 const k=e.key.toLowerCase();
 if(sim.worldDive&&['f','g'].includes(k)){if(!panel){e.preventDefault();keys.add(k);}return;}
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){
  if(!panel){e.preventDefault();keys.add(k);}return;
 }
 if(e.repeat){if(k==='tab'||/^[1-6]$/.test(k)||k===' ')e.preventDefault();return;}
 if(rpg?.key(e)){e.preventDefault();return;}
 if(adventure?.key(k)||sandbox?.key(k)){e.preventDefault();return;}
 if(k==='e'){e.preventDefault();interact();}
 if(k==='v'&&!panel){e.preventDefault();toggleCamera();}
 if(k==='m')audio.toggle();
 if(k==='p'){experience?.stop();RealmCombat.stop(sim);sim.paused=!sim.paused;toast(sim.paused?'Simulation paused.':'Simulation resumed.');}
 if(k==='h')togglePhoto();
 if(k==='escape'){if(document.body.classList.contains('photo-mode'))togglePhoto();else if(panel)closePanel();else if(RealmWorldFoundations.handles(sim.room)||sim.worldTrip)worldReturn();else if(sim.room===RealmEarth.ROOM)earthReturn();else if(sim.room===RealmCosmos.ROOM)cosmosReturn();else if(sim.room){sim.leave();switchScene();}}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();RealmCombat.stop(sim);adventure?.stopAuto();}});
window.addEventListener('blur',()=>{keys.clear();RealmCombat.stop(sim);adventure?.stopAuto();});
for(let el of document.querySelectorAll('[data-panel]'))el.addEventListener('click',()=>openPanel(el.dataset.panel));$('#settings').onclick=()=>openPanel('settings');$('#close-panel').onclick=closePanel;$('#sound').onclick=()=>audio.toggle();$('#tour').onclick=()=>{if(sim.room){toast('The cinematic tour begins outside. Leave this room first.');return;}camera.tour=!camera.tour;camera.tourTime=0;toast(camera.tour?'A slow camera tour. Click, drag or walk to take back the view.':'Tour stopped.');};$('#overview').onclick=toggleCamera;$('#overview').setAttribute('aria-label','Switch third person and diorama (V)');$('#interact').onclick=interact;$('#context').onclick=()=>{if(rpg?.crossing.context()?.startsWith('M · '))rpg.open('atlas');else interact();};$('#photo').onclick=()=>{openPanel('settings');};$('#photo-exit').onclick=togglePhoto;$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){toast('Fullscreen is not available in this preview. Open the saved HTML in a full browser.');}};
function formatHour(h){let m=Math.floor(h*60);return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
let labelNodes=[];function labelsRebuild(){let c=$('#labels');c.replaceChildren();labelNodes=[];if(!engine)return;if(!sim.room){for(let l of C.LANDMARKS){let e=document.createElement('span');e.className='world-label';e.textContent=l.short;c.appendChild(e);labelNodes.push({e,l});}}for(let p of C.PROFILES){let e=document.createElement('span');e.className='world-label resident';e.textContent=p.name;c.appendChild(e);labelNodes.push({e,id:p.id});}}
function updateLabels(){if(!engine)return;$('#labels').style.display=sim.state.settings.labels?'block':'none';for(let n of labelNodes){let p,show=true;if(n.l)p=engine.project(n.l.x,n.l.kind==='interior'?5.8:2.4,n.l.z-1);else{let r=sim.state.residents.find(r=>r.id===n.id),run=sim.runs.get(n.id);if(sim.room){let i=C.PROFILES.findIndex(p=>p.id===n.id),pos=[[-3.1,1.1],[3.2,1.1],[2,3.2]][i];if(sim.room==='home'&&run.inside)p=engine.project(pos[0],3.45,pos[1]);else if((sim.room==='atelier'&&n.id==='ilan'&&run.goal==='atelier')||(sim.room==='observatory'&&n.id==='mara'&&run.goal==='observatory'))p=engine.project(2.5,3.45,1.1);else show=false;}else{p=engine.project(r.x,3.25,r.z);show=!run.inside;}}if(!p||!show||!p.visible){n.e.style.display='none';continue;}n.e.style.display='flex';n.e.style.left=p.x+'px';n.e.style.top=p.y+'px';}}
function mapDraw(canvas,full=false){if(RealmWorldFoundations.handles(sim.room))return RealmWorldFoundationsUI.mapCanvas(canvas,sim,rpg?.quest==='wild-signs');if(sim.room===RealmEarth.ROOM)return RealmEarthUI.mapCanvas(canvas,sim);if(sim.room===RealmCosmos.ROOM)return RealmCosmosUI.mapCanvas(canvas,sim);if(sim.room==='riverbank'){RealmStarterUI.mapCanvas(canvas,sim);return;}if(sim.room==='crossing')return RealmCrossingUI.mapCanvas(canvas,sim,full);if(sim.room==='range')return mapRange(canvas,full);if(sim.room==='road'){mapRoad(canvas,full);return;}if(sim.room==='mine'){mapMine(canvas,full);return;}let g=canvas.getContext('2d');if(!g)return;let w=canvas.width,h=canvas.height,scale=sim.room?(full?Math.min(w,h)/17:w/16):(full?Math.min(w,h)/108:w/108),centerX=sim.room?w/2:w/2-10*scale,centerY=full?h*.53:h*.48;g.clearRect(0,0,w,h);g.fillStyle=full?'#233f49':'#19363c';g.fillRect(0,0,w,h);let tx=x=>centerX+x*scale,tz=z=>centerY+(z+(sim.room?0:10))*scale;g.fillStyle='#647e66';g.beginPath();if(sim.room){g.rect(tx(-5.5),tz(-4.5),11*scale,9*scale);}else{for(let i=0;i<=100;i++){let a=i/100*Math.PI*2,r=C.landRadius(Math.cos(a),Math.sin(a));let x=tx(Math.cos(a)*r),z=tz(Math.sin(a)*r);i?g.lineTo(x,z):g.moveTo(x,z);} }g.fill();if(!sim.room){g.beginPath();g.ellipse(tx(37),tz(2),12.1*scale,11.6*scale,0,0,Math.PI*2);g.fill();g.fillRect(tx(20),tz(.3),9*scale,3.4*scale);g.beginPath();g.ellipse(tx(0),tz(-40),11.4*scale,12.4*scale,0,0,Math.PI*2);g.fill();if(sim.state.sandbox.bridge)g.fillRect(tx(-1.4),tz(-30.6),2.8*scale,8*scale);}if(sim.room){g.fillStyle='#9c875e';g.fillRect(tx(-5.3),tz(-4.2),10.6*scale,8.4*scale);g.fillStyle='#665545';if(sim.room==='retreat'){for(let i of sim.state.retreat.items){let o=X.obstacles({...sim.state.retreat,items:[i]})[0];if(o)g.fillRect(tx(o.x-o.w/2),tz(o.z-o.d/2),o.w*scale,o.d*scale);}}else g.fillRect(tx(-1.4),tz(-2.45),2.8*scale,1.9*scale);}else{g.strokeStyle='#b3b69a80';g.lineWidth=full?6:2;for(let l of C.LANDMARKS){g.beginPath();g.moveTo(tx(l.x>25?28:0),tz(l.x>25?2:3));g.lineTo(tx(l.x),tz(l.z));g.stroke();}g.fillStyle='#ad9d77';g.fillRect(tx(-1.5),tz(20),3*scale,9*scale);g.fillStyle='#3b594c';for(let o of C.OBSTACLES){if(o.r){g.beginPath();g.arc(tx(o.x),tz(o.z),o.r*scale,0,Math.PI*2);g.fill();}else g.fillRect(tx(o.x-o.w/2),tz(o.z-o.d/2),o.w*scale,o.d*scale);}for(let l of C.LANDMARKS){g.fillStyle=sim.state.visited.includes(l.id)?'#ddc489':'#a9bba4';g.beginPath();g.arc(tx(l.x),tz(l.z),full?5:2.8,0,Math.PI*2);g.fill();if(full){g.fillStyle='#e9e9cf';g.font=Math.max(11,w/95)+'px system-ui';g.textAlign='center';g.fillText(l.short,tx(l.x),tz(l.z)-12);}}}
 if(!sim.room){for(let n of RealmSandbox.NODES){g.fillStyle=RealmSandbox.ITEMS[n.kind].color;g.fillRect(tx(n.x)-2,tz(n.z)-2,4,4);}for(let p of sim.state.sandbox.placed){let w=RealmSandbox.worldCell(p.gx,p.gz);g.fillStyle=RealmSandbox.ITEMS[p.kind].color;g.fillRect(tx(w.x)-2,tz(w.z)-2,4,4);}}
 if(!sim.room)for(let r of sim.state.residents){g.fillStyle=C.PROFILES.find(p=>p.id===r.id).color;g.beginPath();g.arc(tx(r.x),tz(r.z),full?6:3.5,0,Math.PI*2);g.fill();}let p=sim.state.player;g.fillStyle='#f9df9b';g.beginPath();g.arc(tx(p.x),tz(p.z),full?7:4.5,0,Math.PI*2);g.fill();g.strokeStyle='#faf1c6';g.lineWidth=1;g.beginPath();g.arc(tx(p.x),tz(p.z),full?11:7,0,Math.PI*2);g.stroke();}
function mapRange(canvas,full){const g=canvas.getContext('2d');if(!g)return;const w=canvas.width,h=canvas.height,sc=(full?Math.min(w,h):w)/36,tx=x=>w/2+x*sc,tz=z=>h/2+z*sc;g.fillStyle='#28483e';g.fillRect(0,0,w,h);g.fillStyle='#b4b493';g.fillRect(tx(-14),tz(-13),28*sc,26*sc);for(const o of RealmArsenal.RANGE.pillars){g.fillStyle='#6d765e';g.beginPath();g.arc(tx(o.x),tz(o.z),o.r*sc,0,Math.PI*2);g.fill();}for(const e of RealmAdventure.runtime(sim).enemies){g.fillStyle='#c68764';g.beginPath();g.arc(tx(e.x),tz(e.z),.7*sc,0,Math.PI*2);g.fill();if(full){g.fillStyle='#24382e';g.font='13px sans-serif';g.textAlign='center';g.fillText(e.name,tx(e.x),tz(e.z)-12);}}for(const q of RealmArsenal.runtime(sim).arrows){g.strokeStyle='#d4857e';g.beginPath();g.moveTo(tx(q.x),tz(q.z));g.lineTo(tx(q.x-q.dx*.7),tz(q.z-q.dz*.7));g.stroke();}const p=sim.state.player;g.fillStyle='#fff8d2';g.beginPath();g.arc(tx(p.x),tz(p.z),5,0,Math.PI*2);g.fill();}
function mapRoad(canvas,full){
 const g=canvas.getContext('2d');if(!g)return;const w=canvas.width,h=canvas.height,sc=(full?Math.min(w,h):w)/65,ox=w/2,oy=h/2+3*sc,tx=x=>ox+x*sc,tz=z=>oy+z*sc;g.fillStyle='#214c55';g.fillRect(0,0,w,h);
 for(let x=-18;x<=18;x+=.8)for(let z=-29;z<=23;z+=.8)if(RealmRoad.walkable(x,z,0)){g.fillStyle='#849a70';g.fillRect(tx(x),tz(z),.83*sc,.83*sc);}
 const dot=(p,color,size)=>{g.fillStyle=color;g.beginPath();g.arc(tx(p.x),tz(p.z),size,0,Math.PI*2);g.fill();};for(const p of[RealmRoad.ENTRY,RealmRoad.MERCHANT,RealmRoad.BEACON])dot(p,'#e8cca0',4);for(const e of RealmAdventure.runtime(sim).enemies)if(e.hp>0&&!e.hidden)dot(e,'#d69b9b',4);for(const c of RealmRoad.CACHES)if(sim.state.adventure.road.revealed.includes(c.id)&&!sim.state.adventure.road.claimed.includes(c.id))dot(c,'#dfdba8',4);const f=RealmAdventure.runtime(sim).companion;if(sim.state.adventure.companion.bonded&&f.room===sim.room)dot(f,'#d6a677',3);dot(sim.state.player,'#fff0bd',5);
}
function mapMine(canvas,full){let g=canvas.getContext('2d');if(!g)return;let w=canvas.width,h=canvas.height,scale=(full?Math.min(w,h):w)/36,ox=w/2,oy=h/2;g.fillStyle='#162d37';g.fillRect(0,0,w,h);let a=sim.state.adventure;for(let x=-7;x<=7;x++)for(let z=-7;z<=7;z++){g.fillStyle=RealmAdventure.isFloor(a,x,z)?'#788b79':RealmAdventure.mineral(x,z)?'#9a8068':'#334e57';g.fillRect(ox+(x*2-1)*scale,oy+(z*2-1)*scale,2*scale-1,2*scale-1);}for(let e of RealmAdventure.runtime(sim).enemies){if(e.hp<=0)continue;g.fillStyle='#dba59e';g.beginPath();g.arc(ox+e.x*scale,oy+e.z*scale,full?5:3,0,Math.PI*2);g.fill();}g.fillStyle='#f4d9a3';g.beginPath();g.arc(ox+sim.state.player.x*scale,oy+sim.state.player.z*scale,full?6:4,0,Math.PI*2);g.fill();}
function mapToWorld(x,y){if(RealmWorldFoundations.handles(sim.room)){const p=RealmWorldFoundationsUI.projection(RealmWorldFoundations.definition(sim.room),innerWidth,innerHeight);return{x:(x-p.x)/p.scale,z:(y-p.y)/p.scale};}if(sim.room===RealmEarth.ROOM){const p=RealmEarthUI.projection(innerWidth,innerHeight);return{x:(x-p.x)/p.scale,z:(y-p.y)/p.scale};}if(sim.room===RealmCosmos.ROOM){const p=RealmCosmosUI.projection(innerWidth,innerHeight);return{x:(x-p.x)/p.scale,z:(y-p.y)/p.scale};}if(sim.room==='riverbank'){const p=RealmStarterUI.projection(innerWidth,innerHeight);return{x:(x-p.x)/p.scale,z:(y-p.y)/p.scale};}if(sim.room==='crossing'){let sc=Math.min(innerWidth,innerHeight)/68;return{x:(x-innerWidth/2)/sc,z:(y-innerHeight/2)/sc-1};}if(sim.room==='range'){let sc=Math.min(innerWidth,innerHeight)/36;return{x:(x-innerWidth/2)/sc,z:(y-innerHeight/2)/sc};}if(sim.room==='road'){let sc=Math.min(innerWidth,innerHeight)/65;return{x:(x-innerWidth/2)/sc,z:(y-innerHeight/2)/sc-3};}if(sim.room==='mine'){let sc=Math.min(innerWidth,innerHeight)/36;return{x:(x-innerWidth/2)/sc,z:(y-innerHeight/2)/sc};}let w=innerWidth,h=innerHeight,sc=Math.min(w,h)/(sim.room?17:108);return{x:(x-w/2)/sc+(sim.room?0:10),z:(y-h*.53)/sc-(sim.room?0:10)};}$('#minimap').onclick=()=>rpg.open('atlas');

function refreshUI(){let s=sim.state;$('#tour').setAttribute('aria-pressed',String(!!camera.tour));$('#time-display').textContent=formatHour(s.hour);$('#day-display').textContent='DAY '+String(s.day).padStart(2,'0')+' · '+(sim.paused?'PAUSED':s.weather==='rain'?'RAIN':s.hour>20||s.hour<6?'NIGHT':s.hour>16?'GOLDEN HOUR':'DAYLIGHT');$('#fps').textContent=engine?Math.round(fps)+' FPS · '+s.settings.quality.toUpperCase():'MAP VIEW';$('#discovery').textContent=s.visited.length+' / '+C.LANDMARKS.length+' PLACES DISCOVERED';let l=RealmWorldFoundations.handles(sim.room)?{short:RealmWorldFoundations.definition(sim.room).name,description:RealmWorldFoundations.definition(sim.room).description}:sim.room===RealmEarth.ROOM?{short:'Hearthwater Vale',description:'A lake road. Orchard lanes. Bellweather on the horizon.'}:sim.room===RealmCosmos.ROOM?{short:'The Near Expanse',description:'Three lamps. Two roads. An inhabited horizon.'}:sim.room==='riverbank'?{short:'Oren’s riverbank worksite',description:'A nearby path. Useful supplies. A reason to come home.'}:sim.room==='crossing'?{short:'Bellweather Crossing',description:'A village to meet. A silence to break. A road home.'}:sim.room==='range'?{short:'The Archery Court',description:'Take a breath. Find your distance. Let the arrow travel.'}:sim.room==='road'?{short:'The Sunward Road',description:'A traveller to help. A trail to follow. A light to bring home.'}:sim.room==='mine'?{short:'The Rootbound Underways',description:'Copper in the walls. A heartbeat beneath the roots.'}:sim.room?C.LANDMARKS.find(l=>l.id===sim.room):closest(),sbContext=rpg?.worlds.context()||rpg?.earth.context()||rpg?.cosmos.context()||rpg?.starter.context()||rpg?.crossing.context()||(RealmBeacon.near(sim)&&sim.state.adventure.road.beaconLit?(RealmBeacon.runtime(sim).phase==='assault'?'Repair ward · E · 20 stamina':'The envoy at the beacon · E'):null)||adventure?.context()||sandbox?.context();$('#place-name').textContent=sim.room?l.short:sim.state.player.z<-29?'Wildwood Reach':'Firstlight Valley';$('#place-kicker').textContent=RealmWorldFoundations.handles(sim.room)?RealmWorldFoundations.definition(sim.room).kicker:sim.room===RealmEarth.ROOM?'EARTH · HEARTHWATER VALE · CONNECTED APPROACH':sim.room===RealmCosmos.ROOM?'COSMOS · THE MOON BENEATH THE ROAD':sim.room==='riverbank'?'CLOSE TO HOME · THE RIVERBANK':sim.room==='crossing'?'THE BELL ROAD · CHAPTER IV':sim.room==='range'?'THE PRACTICE COURT · A NEW DISCIPLINE':sim.room==='road'?(s.adventure.beacon.introduced?'THE BEACON ANSWERS · CHAPTER III':'BEYOND THE VALLEY · CHAPTER II'):sim.room==='mine'?'BENEATH WILDWOOD · CHAPTER I':sim.room?'A PRIVATE PLACE · LOCAL INTERIOR':'THE REALM · FIRST INHABITED DISTRICT';$('#place-description').textContent=sim.room?l.description:'Gather. Make. Grow. A new shore to call your own.';$('#context').style.display=(l||sbContext)&&!sandbox?.build?'flex':'none';let contextKey=sbContext?.match(/^([A-Z0-9]+) · /)?.[1]||'E';$('#context kbd').textContent=contextKey;$('#context-text').textContent=(sim.room===RealmEarth.ROOM||sim.room===RealmCosmos.ROOM)?sbContext?.replace(/^([A-Z0-9]+) · /,''):RealmAdventure.combatScene(sim)?sbContext?.replace(/^([A-Z0-9]+) · /,''):sim.room?(sbContext?.replace(/^([A-Z0-9]+) · /,'')||'Return to the valley'):sbContext|| (l?l.action:'');mapDraw($('#minimap'));renderStatus();}
function frame(now){let dt=lastFrame?Math.min((now-lastFrame)/1000,.1):.016;lastFrame=now;frames++;if(now-fpsStart>1500){fps=frames*1000/(now-fpsStart);frames=0;fpsStart=now;}if(!document.hidden){let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(sim.worldDive&&!sim.paused){RealmWorldFoundations.swim(sim,dx*Math.cos(camera.yaw)+dz*Math.sin(camera.yaw),-dx*Math.sin(camera.yaw)+dz*Math.cos(camera.yaw),(keys.has('f')?1:0)-(keys.has('g')?1:0),dt);camera.overview=false;}else if((dx||dz)&&!sim.paused){sandbox?.stopAuto();adventure?.stopAuto();camera.tour=false;sim.manual(dx*Math.cos(camera.yaw)+dz*Math.sin(camera.yaw),-dx*Math.sin(camera.yaw)+dz*Math.cos(camera.yaw),dt);camera.overview=false;follow=null;target=null;sim.walking=true;}bindWildSignsClearance();sim.tick(dt);tickConsignment(dt);tickGrazer(dt);if((dx||dz)&&!sim.paused)sim.walking=true;elapsed+=sim.paused?0:dt;if(!sim.playerPath.length)target=null;switchScene();updateCamera(dt);experience?.tick();sandbox?.tick();adventure?.tick();arsenal?.tick();rpg?.tick();if(engine){if(sim.room==='retreat'&&art.layoutRevision!==sim.state.retreat.revision)art.makeRetreat(sim.state.retreat);engine.reducedMotion=sim.state.settings.reducedMotion;syncFieldcraftOwner();consignmentPresentation();grazerPresentation();prepareWildSignsDiagnostics();art.update(sim,elapsed,target);engine.render(elapsed,sim.state.hour,sim.state.weather==='rain');acknowledgeOrdinaryGrazer(now);updateLabels();}else mapDraw(ui.map,true);audio.tick(elapsed);if(now-lastUi>350){refreshUI();lastUi=now;}if(elapsed-lastSave>6){save();lastSave=elapsed;}}if(!G_CAPTURE)requestAnimationFrame(frame);}
// Keep a read-only-ish diagnostics surface for inspection; this local prototype is not a security boundary.
const G_CAPTURE=!!window.__ETERNITIES_CAPTURE_MODE;
window.Realm={get state(){return sim.snapshot();},get diagnostics(){let g=engine?.gl,dbg=g?.getExtension('WEBGL_debug_renderer_info');return{version:'10.0.0',mode:engine?'webgl2':'map',scene:sim.room||'valley',world:RealmWorldFoundations.definition(sim.room)?{id:RealmWorldFoundations.definition(sim.room).id,height:sceneHeight(),dive:worldDiveStatus(),journey:JSON.parse(JSON.stringify(sim.state.journeys.realms[RealmWorldFoundations.definition(sim.room).id]))}:null,wildSigns:wildSignsDiagnostics(),consignment:sim.room===RealmEarthConsignmentData.ROOM?JSON.parse(JSON.stringify({view:RealmEarthConsignmentMotion.current(consignmentContext()),frame:RealmEarthConsignmentArt.snapshot(sim),parts:engine?.dynamic.flatMap(b=>b.items.filter(i=>i.consignmentPart).map(i=>({kind:b.kind,...i,m:i.m?Array.from(i.m):null})))||[]})):null,atlantis:sim.room===RealmAtlantisCampaign.definition.room?JSON.parse(JSON.stringify({current:RealmAtlantisCampaign.currentStatus(sim),motion:{currentDistance:RealmAtlantisCampaign.runtime(sim).currentDistance,pullDistance:RealmAtlantisCampaign.runtime(sim).pullDistance},witnesses:RealmAtlantisCampaign.runtime(sim).witnesses})):null,heaven:sim.room===RealmHeavenCampaign.definition.room?JSON.parse(JSON.stringify({escort:RealmHeavenCampaign.runtime(sim).escort,activation:RealmHeavenCampaign.runtime(sim).activation,status:RealmHeavenCampaign.escortStatus(sim)})):null,earthHomecoming:JSON.parse(JSON.stringify({record:sim.state.earthHomecoming,runtime:[null,RealmEarthHomecoming.definition.room].includes(sim.room)?RealmEarthHomecoming.runtime(sim):null,missing:RealmEarthHomecoming.missing(sim.state),ready:RealmEarthHomecoming.ready(sim.state)})),earth:sim.room===RealmEarth.ROOM?{trip:sim.earthTrip,height:sceneHeight(),walkable:RealmEarth.walkable(sim.state.player.x,sim.state.player.z)}:null,cosmos:sim.room===RealmCosmos.ROOM?{trip:sim.cosmosTrip,height:sceneHeight(),walkable:RealmCosmos.walkable(sim.state.player.x,sim.state.player.z),campaign:JSON.parse(JSON.stringify(RealmCosmosCampaign.runtime(sim)))}:null,networkDependencies:0,liveAI:false,multiplayer:false,adventure:{tactics:JSON.parse(JSON.stringify(RealmCombat.runtime(sim))),beacon:JSON.parse(JSON.stringify(RealmBeacon.runtime(sim))),crossing:JSON.parse(JSON.stringify(RealmCrossing.runtime(sim))),player:{...sim.state.player},paused:sim.paused,intent:adventure?.intent||null,stats:RealmAdventure.stats(sim.state.adventure),weapon:RealmArsenal.weapon(sim.state.adventure),arrows:RealmArsenal.runtime(sim).arrows.map(a=>({...a})),range:{...RealmArsenal.runtime(sim).range},enemies:RealmAdventure.runtime(sim).enemies.map(e=>({id:e.id,x:e.x,z:e.z,hp:e.hp,maxHP:e.maxHP,hidden:!!e.hidden,eventEnemy:!!e.eventEnemy,kind:e.kind,earthHomecoming:e.earthHomecoming||null,ringMode:e.ringMode,custom:e.custom,mode:e.mode,timer:e.timer,aim:e.aim,yaw:e.yaw,strike:e.strike||null,contactAt:e.contactAt??null,contactHit:e.contactHit??null})),companion:{...RealmAdventure.runtime(sim).companion}},sandbox:{bridge:sim.state.sandbox.bridge,objects:sim.state.sandbox.placed.length,elapsed:sim.state.sandbox.elapsed,autoGather:sandbox?.auto||null,buildMode:sandbox?.build||null},saveState,characters:{mode:characterStore.blocked?'blocked':characterStore.managed?'managed':'legacy',active:characterStore.active,revision:characterStore.revision,count:characterStore.record?.slots.length||1,writer:characterStore.writer,error:characterStore.error},fps,errors:errors.slice(),camera:{...camera,projection:engine?.camera.projection||'orthographic',eye:engine?.camera.eye,target:engine?.camera.target},metrics:engine?.metrics||null,reflection:engine?.reflectionInfo||null,cutaway:{enabled:!!engine?.cutaway,focus:engine?.cutawayFocus||null},renderer:dbg?g.getParameter(dbg.UNMASKED_RENDERER_WEBGL):null,music:{playing:experience?.playing||false,scoreRevision:sim.state.scoreRevision,playingRevision:experience?.playingRevision,step:experience?.step},gathering:sim.gathering?{...sim.gathering}:null,layoutRevision:sim.state.retreat.revision,roadsideGathering:{status:rpg?.gathering?.player.status||'idle',playing:!!rpg?.gathering?.player.source,pending:!!rpg?.gathering?.pending},audio:{enabled:audio.enabled,state:audio.ctx?.state||'not-created',soundscape:audio.soundscape?.snapshot()||null}};},navigate,export:()=>JSON.stringify(sim.snapshot(),null,2),project:(x,y,z)=>engine?.project(x,y,z)};
if(window.__ETERNITIES_TEST_MODE||location.search.includes('test'))window.Realm.test={consignmentContext,consignmentControl,consignment:()=>({view:RealmEarthConsignmentMotion.current(consignmentContext()),frame:RealmEarthConsignmentArt.snapshot(sim),parts:engine?.dynamic.flatMap(b=>b.items.filter(i=>i.consignmentPart).map(i=>({kind:b.kind,...i,m:i.m?Array.from(i.m):null})))||[]}),fieldcraftContext,frameFieldcraft,fieldcraft:()=>({view:RealmEarthFieldcraft.current(sim),parts:engine?.dynamic.flatMap(b=>b.items.filter(i=>i.fieldcraftPart).map(i=>({kind:b.kind,...i,m:i.m?Array.from(i.m):null})))||[]}),earthRoad:()=>({route:RealmEarthRoad.endpoint(sim.room),parts:engine?.batches.flatMap(b=>b.items.filter(i=>i.earthRoadPart||i.worldSolidId==='hearthwater-fingerpost').map(i=>({kind:b.kind,...i,m:i.m?Array.from(i.m):null})))||[]}),earthRoadTravel,earthHomecomingCommand,homeCommand,cosmosCampaignCommand,atlantisCampaignCommand,heavenCampaignCommand,hellCampaignCommand,bridgeCommunityCommand,localLifeCommand,bridgeView,workshopCommand,worldContext,expeditionCommand,earthBinding,worldTravel,worldReturn,worldCommand,trailCommand,trailAdjust,realmFit,worldDiveEnter,worldDiveExit,worldDiveStatus,worldSwim:(...a)=>RealmWorldFoundations.swim(sim,...a),step(seconds){let p=sim.paused;sim.paused=false;for(let t=0;t<seconds;t+=.05){bindWildSignsClearance();sim.tick(.05);tickConsignment(.05);tickGrazer(.05);adventure?.tick();arsenal?.tick();rpg?.tick();}sim.paused=p;elapsed+=seconds;switchScene();refreshUI();},setTime:h=>sim.setTime(h),enter:id=>{let r=sim.enter(id);switchScene();return r;},leave:()=>{let r=sim.leave();switchScene();return r;},act:(...args)=>sim.act(...args),save,replace:applyWorld,pause:v=>{sim.paused=v;},weather:v=>{sim.state.weather=v;},layout:()=>sim.state.retreat,openStudio:()=>experience.open(),openPanel,bridge:()=>sim.room===RealmEarth.ROOM?JSON.parse(JSON.stringify({definition:RealmEarth.BRIDGE,waterHeight:RealmEngine.WATER_HEIGHT,railCutaway:{eligible:engine?.railCutawayActive===true,enabled:engine?.cutaway===true},parts:engine?.batches.flatMap(b=>b.items.filter(i=>i.bridgePart||i.mountainPart||i.shorelinePart).map(i=>({kind:b.kind,railBatch:b.railCutaway===true,...i,m:i.m?Array.from(i.m):null})))||[]})):null,traveler:()=>art?.travelerSnapshot()||null,companion:()=>RealmAdventureArt.companionSnapshot(sim),skitters:()=>RealmAdventureArt.skitterSnapshot(sim),drover:()=>sim.room===RealmEarth.ROOM&&art?.droverFrame?JSON.parse(JSON.stringify({frame:{...art.droverFrame,root:Array.from(art.droverFrame.root),coilRoot:Array.from(art.droverFrame.coilRoot)},parts:engine.dynamic.flatMap(b=>b.items.filter(i=>i.droverPart).map(i=>({kind:b.kind,...i,m:Array.from(i.m)})))})):null,earthShoulder:()=>sim.room===RealmEarth.ROOM?JSON.parse(JSON.stringify({frame:art?.earthShoulderFrame,parts:engine?.batches.flatMap(b=>b.items.filter(i=>i.quarryShoulder||i.terrain).map(i=>({kind:b.kind,...i,m:i.m?Array.from(i.m):null})))||[]})):null,quarry:()=>sim.room===RealmEarth.ROOM&&art?.quarryFrame?JSON.parse(JSON.stringify({frame:{actor:{...art.quarryFrame.actor,root:Array.from(art.quarryFrame.actor.root),toolRoot:Array.from(art.quarryFrame.actor.toolRoot)},works:art.quarryFrame.works},parts:engine.dynamic.flatMap(b=>b.items.filter(i=>i.stoneworkerPart||i.quarryPart).map(i=>({kind:b.kind,...i,m:i.m?Array.from(i.m):null})))})):null,millwright:()=>sim.room===RealmEarth.ROOM&&art?.millwrightFrame?JSON.parse(JSON.stringify({frame:{...art.millwrightFrame,root:Array.from(art.millwrightFrame.root),toolRoot:Array.from(art.millwrightFrame.toolRoot)},parts:engine.dynamic.flatMap(b=>b.items.filter(i=>i.millwrightPart).map(i=>({kind:b.kind,...i,m:Array.from(i.m)})))})):null,millGate:()=>sim.room===RealmEarth.ROOM&&art?.millGateFrame?JSON.parse(JSON.stringify({gate:art.millGateFrame,parts:[...engine.batches,...engine.dynamic].flatMap(b=>b.items.filter(i=>i.millPart).map(i=>({kind:b.kind,...i,m:i.m?Array.from(i.m):null}))),wheel:art.dynamicBox.items.filter(i=>i.p[0]===3.55&&i.p[1]===2.71)})):null,surfaceMaterials:v=>{if(engine){engine.surfaceMaterialsEnabled=!!v;return {...engine.surfaceMaterialInfo};}return null;},quality:v=>{sim.state.settings.quality=v;if(engine)engine.quality=v;resize();},render(){experience?.tick();sandbox?.tick();adventure?.tick();arsenal?.tick();rpg?.tick();if(engine){if(sim.room==='retreat'&&art.layoutRevision!==sim.state.retreat.revision)art.makeRetreat(sim.state.retreat);updateCamera(1);syncFieldcraftOwner();consignmentPresentation();grazerPresentation();prepareWildSignsDiagnostics();art.update(sim,elapsed,target);engine.render(elapsed,sim.state.hour,sim.state.weather==='rain');updateLabels();}else mapDraw(ui.map,true);refreshUI();},captureFrame(t,yaw){elapsed=t;if(yaw!==undefined)camera.yaw=yaw;this.render();return ui.canvas.toDataURL('image/png');},view(v){Object.assign(camera,v);updateCamera(1);},sandbox:(id,type,payload)=>sim.sandboxCommand(id,type,payload),adventure:(id,type,payload)=>{let r=sim.adventureCommand(id,type,payload);switchScene();return r;},move:(x,z)=>sim.moveTo(x,z),sandboxPanel:()=>sandbox.paint(),presentation:()=>JSON.parse(JSON.stringify(sim.presentation||{})),get path(){return sim.playerPath;}};
window.addEventListener('resize',resize);window.addEventListener('pagehide',()=>{save();characterStore.writer=false;characterLock.release();});window.addEventListener('pageshow',e=>{if(e.persisted&&characterStore.managed)acquireCharacterWriter().then(()=>save());});ui.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('Graphics context lost. Your local state is intact; use the map and export a backup.');toast('Graphics paused; world state preserved.');});document.body.classList.toggle('reduced',sim.state.settings.reducedMotion);cameraPreset(sim.state.settings.cameraMode,false);if(camera.preset==='adventure'&&!sim.state.settings.cameraViews.profiles.adventure)camera.yaw=.22;labelsRebuild();resize();refreshUI();if(characterStore.managed){acquireCharacterWriter().then(ok=>{if(ok)save();else{saveState='unavailable';toast(characterLock.error);renderStatus();}});}else save();if(loaded.status==='migrated')toast('Your earlier world was copied into Realm 10. The original save was not changed.');setTimeout(()=>$('#loading').classList.add('hidden'),400);if(G_CAPTURE){if(window.Realm.test)window.Realm.test.render();}else requestAnimationFrame(frame);
})();
