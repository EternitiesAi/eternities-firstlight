/* Three job-supplied pieces. Transient geometry and command witnesses only;
 * the existing expedition ledger/saver remain the sole payout authority. */
(function(G){'use strict';
const ROOM='world-earthlands',STEP='inspect-glade',KIND='earth-patrol-carrier-v1';
const plans=new WeakMap(),tickets=new WeakMap(),views=new WeakMap(),claims=new WeakMap(),bySim=new WeakMap();
const fail=error=>({ok:false,error}),copy=v=>JSON.parse(JSON.stringify(v)),rad=n=>n*Math.PI/180;
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
const GEOMETRY=freeze({kind:KIND,room:ROOM,center:[-104.8,2.18,-104.2],workPoint:{x:-106,z:-105,y:1.57},
 tray:{halfX:.58,halfZ:.29,top:2.09},indicator:{minX:-.075,maxX:.075,minZ:.23,maxZ:.29},epsilon:2e-5,
 previewBounds:{x:{min:-.5,max:.5},z:{min:-.15,max:.15},yaw:{min:rad(-20),max:rad(20)}}});
const piece=(id,size,x,width,depth,tx,tz,yaw,initial)=>({id,receiverId:'carrier-'+id+'-receiver',size,target:{x,z:0,yaw:0},receiver:{width,depth},tolerance:{x:tx,z:tz,yaw:rad(yaw)},initial});
const DEFINITIONS=freeze({
 'stormfall-recovery':{branch:'stormfall-recovery',pieces:[-.36,0,.36].map((x,i)=>piece('billet-'+i,[.22,.18,.40],x,.30,.46,.025,.020,3,{x,z:(i-1)*.06,yaw:(i-1)*.15||.12}))},
 'managed-coppice':{branch:'managed-coppice',pieces:[
  piece('bundle',[.90,.18,.34],0,.96,.40,.015,.010,2,{x:.04,z:0,yaw:.10}),
  piece('lashing-left',[.07,.24,.40],-.26,.12,.42,.010,.005,3,{x:-.23,z:-.035,yaw:.10}),
  piece('lashing-right',[.07,.24,.40],.26,.12,.42,.010,.005,3,{x:.23,z:-.035,yaw:-.10})]}
});
const definition=branch=>typeof branch==='string'&&Object.hasOwn(DEFINITIONS,branch)?DEFINITIONS[branch]:null,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const opaque=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.isFrozen(v)&&Reflect.ownKeys(v).length===0&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
function ledger(sim){try{return G.RealmEarthExpedition.validate(sim?.state?.earthExpedition);}catch{return null;}}
function owner(ctx){
 const sim=ctx?.sim,a=sim?.state?.adventure,t=sim?.worldTrip;
 return !!sim&&typeof ctx.active==='string'&&ctx.active&&Number.isSafeInteger(ctx.revision)&&ctx.revision>=0&&
  opaque(ctx.ownerLease)&&sim.fieldcraftOwnerLease===ctx.ownerLease&&sim.room===ROOM&&!sim.worldDive&&
  a?.started&&Number.isFinite(a.hp)&&a.hp>0&&Number.isSafeInteger(a.revision)&&Number.isSafeInteger(a.deaths)&&
  t?.active===ctx.active&&t.realm==='earthlands'&&sim.returnPos&&[sim.returnPos.x,sim.returnPos.z,sim.returnPos.yaw].every(Number.isFinite)&&JSON.stringify(t.home)===JSON.stringify(sim.returnPos);
}
function at(sim){try{return G.RealmEarthExpedition.at(sim,GEOMETRY.workPoint);}catch{return false;}}
function validOwner(r,ctx){
 const s=ctx?.sim,a=s?.state?.adventure;
 return !!r&&!r.cancelled&&owner(ctx)&&r.sim===s&&r.state===s.state&&r.adventure===a&&r.active===ctx.active&&r.lease===ctx.ownerLease&&
  r.trip===s.worldTrip&&r.earthTrip===s.earthTrip&&r.home===JSON.stringify(s.returnPos)&&r.tripValue===JSON.stringify(s.worldTrip)&&r.deaths===a.deaths;
}
const remembered=r=>({sim:r.sim,active:r.active,revision:r.revision,ownerLease:r.lease});
function check(r,ctx,physical=false){
 if(!validOwner(r,ctx))return fail('This character or outing no longer owns the supplied kit. Recorded work stays.');
 const l=ledger(r.sim),p=l?.patrol;
 if(!l?.story.claimed||l.story.branch!==r.branch)return fail('Read the current remembered allocation.');
 if(r.phase==='paid'){
  if(p.lastClaim!==r.run||p.active!==null)return fail('This receiving scene belongs to its paid run only.');
 }else if(p?.lastClaim!==r.priorClaim||p.active?.run!==r.run||JSON.stringify(l)!==r.ledgerText)return fail('The accepted patrol changed. Read its current work.');
 if(r.phase==='fitting'&&r.sim.state.adventure.revision!==r.startRevision)return fail('The unfinished work context changed. Inspect the kit again.');
 if(physical&&!at(r.sim))return fail('Stand beside the supplied glade checking tray to handle its pieces.');
 return{ok:true};
}
function frame(r,p,pose){
 const bundle=r.definition.pieces[0].id==='bundle'&&p.id!=='bundle'?r.poses.get('bundle'):null;
 if(!bundle)return{x:pose.x,z:pose.z,yaw:pose.yaw};
 const c=Math.cos(bundle.yaw),s=Math.sin(bundle.yaw);return{x:bundle.x+c*pose.x+s*pose.z,z:bundle.z-s*pose.x+c*pose.z,yaw:bundle.yaw+pose.yaw};
}
function corners(r,p,pose){
 const f=frame(r,p,pose),m=G.RealmEngine.M.compose(GEOMETRY.center[0]+f.x,GEOMETRY.center[1],GEOMETRY.center[2]+f.z,...p.size,0,f.yaw,0),out=[];
 for(const x of[-.5,.5])for(const y of[-.5,.5])for(const z of[-.5,.5])out.push(G.RealmEngine.M.transform(m,[x,y,z]));return out;
}
function clearance(r,p,pose){
 const eps=GEOMETRY.epsilon,q=corners(r,p,pose).map(v=>({x:v[0]-GEOMETRY.center[0],z:v[2]-GEOMETRY.center[2]}));
 if(q.some(v=>Math.abs(v.x)>GEOMETRY.tray.halfX+eps||Math.abs(v.z)>GEOMETRY.tray.halfZ+eps))return false;
 const i=GEOMETRY.indicator,minX=Math.min(...q.map(v=>v.x)),maxX=Math.max(...q.map(v=>v.x)),minZ=Math.min(...q.map(v=>v.z)),maxZ=Math.max(...q.map(v=>v.z));
 return maxX<=i.minX+eps||minX>=i.maxX-eps||maxZ<=i.minZ+eps||minZ>=i.maxZ-eps;
}
function fits(r,p,pose){
 const eps=GEOMETRY.epsilon,t=p.target;
 if(Math.abs(pose.x-t.x)>p.tolerance.x+eps||Math.abs(pose.z-t.z)>p.tolerance.z+eps||Math.abs(wrap(pose.yaw))>p.tolerance.yaw+1e-12||!clearance(r,p,pose))return false;
 const f=frame(r,p,p.target),c=Math.cos(f.yaw),s=Math.sin(f.yaw),targetX=GEOMETRY.center[0]+f.x,targetZ=GEOMETRY.center[2]+f.z;
 const local=corners(r,p,pose).map(v=>{const x=v[0]-targetX,z=v[2]-targetZ;return{x:c*x-s*z,z:s*x+c*z};});
 if(local.some(v=>Math.abs(v.x)>p.receiver.width/2+eps||Math.abs(v.z)>p.receiver.depth/2+eps))return false;
 if(p.id.startsWith('lashing')){
  // Preserve the seated bundle frame; the transverse ends must extend past
  // both bundle faces. Intended bundle/strap overlap is not an obstruction.
  const ends=[-.20,.20].map(z=>[-.035,.035].map(x=>pose.z-Math.sin(pose.yaw)*x+Math.cos(pose.yaw)*z));
  if(Math.max(...ends[0])>-.185+eps||Math.min(...ends[1])<.185-eps)return false;
 }
 return true;
}
function diagnostics(r,p,pose){
 const eps=GEOMETRY.epsilon,t=p.target,f=frame(r,p,t),c=Math.cos(f.yaw),s=Math.sin(f.yaw),q=corners(r,p,pose);
 const local=q.map(v=>{const x=v[0]-GEOMETRY.center[0]-f.x,z=v[2]-GEOMETRY.center[2]-f.z;return{x:c*x-s*z,z:s*x+c*z};});
 const tray=q.map(v=>({x:v[0]-GEOMETRY.center[0],z:v[2]-GEOMETRY.center[2]})),i=GEOMETRY.indicator;
 const ends=[-.20,.20].map(z=>[-.035,.035].map(x=>pose.z-Math.sin(pose.yaw)*x+Math.cos(pose.yaw)*z));
 return{offset:{x:pose.x-t.x,z:pose.z-t.z,yaw:wrap(pose.yaw-t.yaw)},tolerance:{...p.tolerance},
  receiverOverhang:{x:Math.max(...local.map(v=>Math.abs(v.x)))-p.receiver.width/2,z:Math.max(...local.map(v=>Math.abs(v.z)))-p.receiver.depth/2},
  trayClear:tray.every(v=>Math.abs(v.x)<=GEOMETRY.tray.halfX+eps&&Math.abs(v.z)<=GEOMETRY.tray.halfZ+eps),
  tabClear:Math.max(...tray.map(v=>v.x))<=i.minX+eps||Math.min(...tray.map(v=>v.x))>=i.maxX-eps||Math.max(...tray.map(v=>v.z))<=i.minZ+eps||Math.min(...tray.map(v=>v.z))>=i.maxZ-eps,
  lashingEndsClear:!p.id.startsWith('lashing')||(Math.max(...ends[0])<=-.185+eps&&Math.min(...ends[1])>=.185-eps)};
}
function projection(plan){
 const r=plans.get(plan);if(!r||!check(r,remembered(r)).ok)return null;
 const active=r.phase==='fitting'?r.definition.pieces[r.seated.length]:null;
 const v=freeze({kind:KIND+'-projection',branch:r.branch,run:r.run,status:r.phase==='fitting'?(active?'fitting':'ready'):r.phase,
  activePiece:active?.id??null,complete:r.seated.length===3,
  pieces:r.definition.pieces.map(p=>{const pose=r.poses.get(p.id),f=frame(r,p,pose);return{id:p.id,size:[...p.size],pose:{...pose},position:[GEOMETRY.center[0]+f.x,GEOMETRY.center[1],GEOMETRY.center[2]+f.z],yaw:f.yaw,corners:corners(r,p,pose),seated:r.seated.includes(p.id),preview:p===active,fits:fits(r,p,pose),diagnostics:diagnostics(r,p,pose)};}),
  receivers:r.definition.pieces.map(p=>{const f=frame(r,p,p.target);return{id:p.receiverId,pieceId:p.id,target:{...p.target},position:[GEOMETRY.center[0]+f.x,GEOMETRY.center[1],GEOMETRY.center[2]+f.z],yaw:f.yaw,width:p.receiver.width,depth:p.receiver.depth,inspected:r.inspected.has(p.id),frame:p.id.startsWith('lashing')?'seated-bundle':'tray'};})});
 views.set(v,{r,epoch:r.epoch});return v;
}
function isProjection(v,l){const q=v&&typeof v==='object'?views.get(v):null;return !!q&&q.epoch===q.r.epoch&&(l===undefined||l===q.r.sim.state.earthExpedition)&&check(q.r,remembered(q.r)).ok;}
function current(sim){const p=bySim.get(sim);return p?projection(p):null;}
function begin(ctx){
 if(!owner(ctx)||!at(ctx.sim))return fail('Reach the glade tray with the current Earth outing and kit.');
 const l=ledger(ctx.sim),p=l?.patrol.active,d=definition(l?.story.branch);
 if(!d||!l.story.claimed||!p||p.steps.includes(STEP)||!G.RealmEarthExpedition.patrol.steps.slice(0,4).every(s=>p.steps.includes(s.id)))return fail('Complete this accepted patrol’s bank inspection before fitting its supplied kit.');
 const previous=bySim.get(ctx.sim);if(previous)cancel(previous);
 const s=ctx.sim,r={sim:s,state:s.state,adventure:s.state.adventure,active:ctx.active,lease:ctx.ownerLease,revision:ctx.revision,
  trip:s.worldTrip,earthTrip:s.earthTrip,home:JSON.stringify(s.returnPos),tripValue:JSON.stringify(s.worldTrip),deaths:s.state.adventure.deaths,
  startRevision:s.state.adventure.revision,branch:d.branch,run:p.run,priorClaim:l.patrol.lastClaim,ledgerText:JSON.stringify(l),definition:d,
  poses:new Map(d.pieces.map(p=>[p.id,{...p.initial}])),inspected:new Set(),seated:[],phase:'fitting',cancelled:false,ticket:null,epoch:0};
 const plan=Object.freeze({kind:KIND+'-plan'});plans.set(plan,r);bySim.set(s,plan);return{ok:true,plan,view:projection(plan)};
}
function active(ctx,plan,id){
 const r=plans.get(plan),c=check(r,ctx,true);if(!c.ok)return c;
 const p=r.phase==='fitting'?r.definition.pieces[r.seated.length]:null;
 if(!p||p.id!==id)return fail('Use this run’s current supplied piece; previous controls are stale.');r.revision=ctx.revision;return{ok:true,r,p};
}
function inspect(ctx,plan,id,receiver){const c=active(ctx,plan,id);if(!c.ok)return c;if(receiver!==c.p.receiverId)return fail('Inspect this piece’s assigned tray receiver.');c.r.inspected.add(id);c.r.epoch++;return{ok:true,view:projection(plan)};}
function adjust(ctx,plan,pose){
 const c=active(ctx,plan,pose?.pieceId);if(!c.ok)return c;const{r,p}=c,b=GEOMETRY.previewBounds;
 if(pose.receiverId!==p.receiverId||!['x','z','yaw'].every(k=>Number.isFinite(pose[k])&&pose[k]>=b[k].min&&pose[k]<=b[k].max))return fail('Use finite placement controls within the supplied tray bounds.');
 const next={x:pose.x,z:pose.z,yaw:pose.yaw},candidate={...r,poses:new Map(r.poses)};candidate.poses.set(p.id,next);
 // A bundle edit also transforms its waiting lashings. Keep the whole
 // projected supplied kit on the tray before accepting any changed pose.
 const obstructed=r.definition.pieces.find(q=>!clearance(candidate,q,candidate.poses.get(q.id)));
 if(obstructed)return fail('The '+obstructed.id+' would leave the tray or cover the inspection tab. Your last valid pose stays.');
 r.poses.set(p.id,next);r.epoch++;return{ok:true,view:projection(plan)};
}
function seat(ctx,plan,id){
 const c=active(ctx,plan,id);if(!c.ok)return c;const{r,p}=c;
 if(!r.inspected.has(id)||!fits(r,p,r.poses.get(id)))return fail('Inspect the receiver, align this supplied piece and leave its packing clearance before seating.');
 r.seated.push(id);r.epoch++;
 if(r.seated.length===3){r.ticket=Object.freeze({kind:KIND+'-fitting'});tickets.set(r.ticket,{r,used:false});}
 return{ok:true,view:projection(plan),...(r.ticket?{ticket:r.ticket}:{})};
}
function validate(ctx,ticket){const t=tickets.get(ticket);if(!t||t.used)return fail('Three current supplied pieces must be inspected and seated.');const c=check(t.r,ctx,true);if(!c.ok)return c;return t.r.seated.length===3&&t.r.definition.pieces.every(p=>fits(t.r,p,t.r.poses.get(p.id)))?{ok:true}:fail('Fit all three pieces before recording.');}
function consume(ticket,result){
 const t=tickets.get(ticket);if(!t||t.used)return fail('This fitting has already ended.');const r=t.r,s=r.sim,l=ledger(s),expected=JSON.parse(r.ledgerText);expected.patrol.active.steps.push(STEP);
 if(!validOwner(r,remembered(r))||!at(s)||s.state.adventure.revision!==r.startRevision+1||JSON.stringify(l)!==JSON.stringify(expected)||!G.RealmEarthExpedition.confirmed(result,s,'patrol-step',r.run,STEP))return fail('Only this run’s actual saved inspection can consume the fitting.');
 t.used=true;r.phase='checked';r.ledgerText=JSON.stringify(l);r.epoch++;return{ok:true};
}
function prepareClaim(ctx){
 const plan=bySim.get(ctx?.sim),r=plan?plans.get(plan):null;if(r?.phase!=='checked'||!check(r,ctx).ok)return null;
 const a=Object.freeze({kind:KIND+'-claim'});claims.set(a,{r,revision:ctx.sim.state.adventure.revision,used:false});return a;
}
function acknowledgeClaim(ticket,result){
 const t=claims.get(ticket);if(!t||t.used)return fail('No live receiving acknowledgement.');const r=t.r,s=r.sim,l=ledger(s);
 if(r.phase!=='checked'||!validOwner(r,remembered(r))||s.state.adventure.revision!==t.revision+1||l?.story.branch!==r.branch||l?.patrol.lastClaim!==r.run||l.patrol.active!==null||!G.RealmEarthExpedition.confirmed(result,s,'patrol-claim',r.run))return fail('Only the original saved payment can acknowledge this carrier.');
 t.used=true;r.phase='paid';r.epoch++;return{ok:true};
}
function cancel(plan){const r=plans.get(plan);if(!r)return fail('Unknown carrier plan.');r.cancelled=true;r.epoch++;if(r.ticket)tickets.get(r.ticket).used=true;return{ok:true};}
const api=Object.freeze({GEOMETRY,definition,begin,inspect,adjust,seat,validate,consume,prepareClaim,acknowledgeClaim,cancel,projection,isProjection,current});
G.RealmEarthPatrolCarrier=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
