/* Focused CPU checks of the actual production primitive vertices. Prefix
 * ledgers and fitting contexts here are synthetic visual fixtures, never an
 * earned expedition or evidence of browser/camera/save integration. */
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const ROOT=process.env.FIRSTLIGHT_SOURCE_ROOT||path.resolve(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js'));
const E=require(path.join(ROOT,'src/engine.js')),EE=require(path.join(ROOT,'src/earth-expedition.js'));
const EW=require(path.join(ROOT,'src/elderweald-world.js')),oldArt=require(path.join(ROOT,'src/earth-expedition-art.js'));
const F=require('../src/earth-fieldcraft.js'),Art=require('../src/earth-fieldcraft-art.js');
// Independent captured pre-section canonical beam, rather than deriving the
// dimensional/contact oracle from the new art being tested.
function legacyBrace(){const a=[-143.294,1.75,-78.9],b=[-143.294,3.78,-71.1],axis=b.map((v,i)=>v-a[i]),length=Math.hypot(...axis);for(let i=0;i<3;i++)axis[i]/=length;const ref=[1,0,0],dot=axis.reduce((n,v,i)=>n+v*ref[i],0),z=ref.map((v,i)=>v-axis[i]*dot),norm=Math.hypot(...z),zn=z.map(v=>v/norm),x=[axis[1]*zn[2]-axis[2]*zn[1],axis[2]*zn[0]-axis[0]*zn[2],axis[0]*zn[1]-axis[1]*zn[0]],p=a.map((v,i)=>(v+b[i])/2);return{kind:'timber-panel',p,s:[.16,length,.025],c:0x9a7953,opt:{m:[...x.map(v=>v*.16),0,...axis.map(v=>v*length),0,...zn.map(v=>v*.025),0,...p,1],anchorFrom:a,anchorTo:b}};}
const EPS=2e-5,g=F.GEOMETRY,world=W.definition('earthlands'),R=.31,BODY=1.7;
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),sub=(a,b)=>a.map((n,i)=>n-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>a.map(n=>n/Math.hypot(...a)),near=(a,b,why='')=>assert.ok(Math.abs(a-b)<EPS,why+': '+a+' != '+b);
function ledger(branch='managed-coppice',n=6,claimed=false){
 const p=EE.fresh();p.story.accepted=true;p.story.branch=n>=2?branch:null;p.story.steps=EE.definition.steps.slice(0,n).map(s=>s.id);p.story.claimed=claimed;return EE.validate(p);
}
const matrix=p=>p.opt.m||E.M.compose(...p.p,...p.s,...(p.opt.r||[0,0,0]));
function vertices(p){
 const raw=E.geometry(p.kind),stride=p.kind==='timber-panel'?8:6,m=matrix(p),out=[];
 for(let i=0;i<raw.length;i+=stride)out.push(E.M.transform(m,raw.slice(i,i+3)));return out;
}
function bounds(p){const vs=vertices(p);return{min:[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),max:[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])))};}
const range=(vs,axis)=>{const values=vs.map(v=>dot(v,axis));return[Math.min(...values),Math.max(...values)];};
function meshIntersects(a,b){
 const vs=[vertices(a),vertices(b)],hulls=vs.map(points=>{const normals=[],edges=[];for(let i=0;i<points.length;i+=3){const ab=sub(points[i+1],points[i]),ac=sub(points[i+2],points[i]);normals.push(cross(ab,ac));edges.push(ab,ac,sub(points[i+2],points[i+1]));}return{normals,edges};});
 for(const raw of [...hulls[0].normals,...hulls[1].normals,...hulls[0].edges.flatMap(a=>hulls[1].edges.map(b=>cross(a,b)))]){
  if(Math.hypot(...raw)<1e-9)continue;const axis=unit(raw),aa=range(vs[0],axis),bb=range(vs[1],axis);if(aa[1]<bb[0]-EPS||bb[1]<aa[0]-EPS)return false;
 }return true;
}
function dimensions(p){const m=matrix(p);return[0,4,8].map(i=>{const axis=unit(Array.from(m.slice(i,i+3))),r=range(vertices(p),axis);return r[1]-r[0];});}
function centerAtEnd(p,sign){return E.M.transform(matrix(p),[0,sign*.5,0]);}
function interval(a,b,lo,hi){let first=0,last=1;for(let i=0;i<3;i++){const d=b[i]-a[i];if(Math.abs(d)<1e-9){if(a[i]<lo[i]||a[i]>hi[i])return null;}else{const x=(lo[i]-a[i])/d,y=(hi[i]-a[i])/d;first=Math.max(first,Math.min(x,y));last=Math.min(last,Math.max(x,y));if(first>last)return null;}}return[first,last];}
function bodyClear(a,b,p){const q=bounds(p);return interval([a[0],g.floor+.03,a[1]],[b[0],g.floor+.03,b[1]],[q.min[0]-R,q.min[1]-BODY,q.min[2]-R],[q.max[0]+R,q.max[1],q.max[2]+R])===null;}
function context(){
 const sim=new C.Simulation();sim.room=g.room;sim.state.player.x=g.workPoint.x;sim.state.player.z=g.workPoint.z;sim.state.adventure.started=true;sim.state.adventure.hp=100;sim.state.earthExpedition=ledger();
 sim.returnPos={room:'hearthwater',x:12.3,z:-4.2,yaw:.4};sim.worldTrip={active:'synthetic-art-character',realm:'earthlands',home:{...sim.returnPos}};
 const ownerLease=Object.freeze({});sim.fieldcraftOwnerLease=ownerLease;
 return{sim,active:'synthetic-art-character',revision:0,ownerLease};
}
function start(){const ctx=context(),begun=F.begin(ctx);assert.equal(begun.ok,true,begun.error);assert.ok(F.isProjection(begun.view));return{ctx,plan:begun.plan,view:begun.view};}
function fit(ctx,plan){assert.equal(F.inspect(ctx,plan).ok,true);assert.equal(F.adjust(ctx,plan,{yaw:g.targetYaw,pitch:g.targetPitch}).ok,true);const p=F.seat(ctx,plan);assert.equal(p.ok,true,p.error);return p.view;}
const role=(ps,name)=>ps.filter(p=>p.opt.fieldcraftPart===name);
function finite(p){
 assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));assert.ok([...matrix(p)].every(Number.isFinite));
 const axes=[0,4,8].map(i=>Array.from(matrix(p).slice(i,i+3)));assert.ok(dot(axes[0],cross(axes[1],axes[2]))>0);
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)near(dot(axes[i],axes[j]),0,'orthogonal model columns');
 assert.ok(vertices(p).flat().every(Number.isFinite));assert.equal(p.opt.appearanceOnly,true);assert.equal(p.opt.cameraSolid,false);assert.equal(p.opt.cutaway,false);assert.equal(p.opt.worldSolid,undefined);assert.equal(p.opt.worldGround,undefined);assert.equal(E.solidBounds(p.kind,{p:p.p,s:p.s,...p.opt}),null);
}
function normalAgreement(p){
 const m=matrix(p),raw=E.geometry(p.kind),stride=p.kind==='timber-panel'?8:6,world=vertices(p),axes=[0,4,8].map(i=>Array.from(m.slice(i,i+3))),scales=axes.map(a=>dot(a,a));
 for(let i=0;i<world.length;i+=3){
  const actual=unit(cross(sub(world[i+1],world[i]),sub(world[i+2],world[i]))),source=Array.from(raw.slice(i*stride+3,i*stride+6));
  const shader=unit([0,1,2].map(j=>axes.reduce((n,a,k)=>n+a[j]*source[k]/scales[k],0)));
  near(dot(actual,shader),1,'native triangle and renderer normal agreement');
 }
}

test('actual four-section timber exactly covers the legacy support without a dimension or material change',()=>{
 const supplied=role(Art.parts(ledger()),'supplied-section'),installed=role(Art.parts(ledger('managed-coppice',7)),'installed-section');
 assert.equal(supplied.length,4);assert.equal(installed.length,4);
 const original=legacyBrace(),originalDims=dimensions(original);
 near(originalDims[1],Math.hypot(2.03,7.8));
 for(let i=0;i<4;i++){
  const sd=dimensions(supplied[i]),id=dimensions(installed[i]);
  for(const d of[sd,id]){near(d[0],originalDims[0],'physical section width');near(d[1],originalDims[1]/4,'physical section length');near(d[2],originalDims[2],'physical section depth');}
  assert.equal(supplied[i].kind,'timber-panel');assert.equal(installed[i].kind,'timber-panel');assert.equal(supplied[i].c,original.c);assert.equal(installed[i].c,original.c);
  const a=centerAtEnd(installed[i],-1),b=centerAtEnd(installed[i],1);a.forEach((n,j)=>near(n,g.sections[i].from[j]));b.forEach((n,j)=>near(n,g.sections[i].to[j]));
  for(const start of[0,4,8])for(let j=0;j<3;j++)near(matrix(installed[i])[start+j],matrix(original)[start+j]*(start===4?.25:1),'canonical permanent orientation unchanged');
  if(i)centerAtEnd(installed[i-1],1).forEach((n,j)=>near(n,a[j],'no joint gap'));
 }
 const axis=unit(sub(g.to,g.from)),oldSpan=range(vertices(original),axis),newSpan=range(installed.flatMap(vertices),axis);
 near(newSpan[0],oldSpan[0]);near(newSpan[1],oldSpan[1]);
});
test('supplied members each lie flat in supported soil without intersections or buried corners',()=>{
 const ps=role(Art.parts(ledger()),'supplied-section');
 for(const p of ps){const b=bounds(p);near(b.min[1],g.floor,'floor contact');near(b.max[1],g.floor+.025,'thin member laid flat');for(const v of vertices(p))assert.ok(W.land(g.room,v[0],v[2],0));finite(p);}
 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)assert.equal(meshIntersects(ps[i],ps[j]),false,'staged members are visibly separate');
});
test('supplied collar kits rest on soil and preserve the same real plate dimensions when fitted',()=>{
 const supplied=Art.parts(ledger()),installed=Art.parts(ledger('managed-coppice',7));
 for(let i=1;i<4;i++){
  const flat=role(supplied,'supplied-joint-collar').filter(p=>p.opt.jointIndex===i),fitted=role(installed,'joint-collar').filter(p=>p.opt.jointIndex===i);assert.equal(flat.length,4);
  for(const p of flat){const q=fitted.find(q=>q.opt.collarFace===p.opt.collarFace);dimensions(p).forEach((n,j)=>near(n,dimensions(q)[j],'same physical collar plate'));}
  const bottom=flat.find(p=>p.opt.collarFace==='wall');near(bounds(bottom).min[1],g.floor,'real collar kit on soil');
  for(const p of flat.filter(p=>p!==bottom))assert.ok(flat.some(q=>q!==p&&meshIntersects(p,q)),'all staged plates are connected');
  assert.ok(meshIntersects(role(supplied,'supplied-scarf-seam').find(p=>p.opt.jointIndex===i),flat.find(p=>p.opt.collarFace==='outer')),'staged scarf seam attaches to real collar');
 }
});
test('real collars contact both adjacent sections, have open timber centres and visible attached scarf seams',()=>{
 const ps=Art.parts(ledger('managed-coppice',7)),timbers=role(ps,'installed-section');
 for(let i=1;i<4;i++){
  const collars=role(ps,'joint-collar').filter(p=>p.opt.jointIndex===i);assert.equal(collars.length,4);
  for(const p of collars){assert.ok(meshIntersects(p,timbers[i-1]),'collar contacts previous section');assert.ok(meshIntersects(p,timbers[i]),'collar contacts next section');finite(p);}
  const point=g.receivers[i].point;
  assert.ok(collars.every(p=>{const b=bounds(p);return point.some((n,j)=>n<b.min[j]-EPS||n>b.max[j]+EPS);}),'metal ring leaves the timber centre open');
  const seam=role(ps,'scarf-seam').find(p=>p.opt.jointIndex===i),outer=collars.find(p=>p.opt.collarFace==='outer');assert.ok(meshIntersects(seam,outer),'scarf line contacts its collar face');
 }
});
test('actual permanent receivers and members attach only to the east wall outer face',()=>{
 const ps=Art.parts(ledger('managed-coppice',7)),wall=world.solids.find(s=>s.id==='elderweald-root-east-wall'),face=wall.x+wall.w/2;
 const wallMesh={kind:'box',p:[wall.x,g.floor+wall.h/2,wall.z],s:[wall.w,wall.h,wall.d],opt:{}};
 for(const p of role(ps,'installed-section')){const b=bounds(p);assert.ok(b.min[0]<=face+EPS&&b.max[0]>face);assert.ok(b.min[0]>wall.x);assert.ok(b.min[2]>=wall.z-wall.d/2&&b.max[2]<=wall.z+wall.d/2);}
 for(const p of role(ps,'receiver')){assert.ok(meshIntersects(p,wallMesh),'receiving plate contacts real wall');assert.ok(role(ps,'installed-section').some(s=>meshIntersects(p,s)),'receiving plate attaches actual timber');}
});
test('real-mesh contact oracle rejects separated collars and diagonally separated boxes',()=>{
 const ps=Art.parts(ledger('managed-coppice',7)),section=role(ps,'installed-section')[0],collar=role(ps,'joint-collar')[0];
 assert.ok(meshIntersects(section,collar));const separated=structuredClone(collar);separated.opt.m[12]+=.10;assert.equal(meshIntersects(section,separated),false,'10cm float cannot pass a contacting-band assertion');
 const rotated={kind:'box',p:[0,0,0],s:[1,.1,.1],opt:{r:[0,0,Math.PI/4]}},corner={kind:'box',p:[.28,-.28,0],s:[.1,.1,.1],opt:{}};
 const a=bounds(rotated),b=bounds(corner);assert.ok(a.min.every((n,i)=>n<=b.max[i]&&a.max[i]>=b.min[i]),'bounding boxes overlap in negative control');assert.equal(meshIntersects(rotated,corner),false,'mesh oracle rejects an unoccupied AABB corner');
});
test('production normal transform agrees with actual transformed triangle normals in each physical pose',()=>{
 const {ctx,view}=start(),states=[Art.parts(ledger()),Art.parts(ledger('managed-coppice',7)),Art.parts(ctx.sim.state.earthExpedition,view)];
 for(const p of states.flat())normalAgreement(p);
});
test('ledger authority and old completed or paid patrol histories produce the same permanent support',()=>{
 assert.deepEqual(Art.parts(undefined),[]);assert.deepEqual(Art.parts(ledger('managed-coppice',5)),[]);
 const fake=EE.fresh();fake.story.steps=['clear-root-pests','brace-root-channel'];assert.deepEqual(Art.parts(fake),[],'shape-valid-looking unearned steps are rejected');
 for(const branch of['managed-coppice','stormfall-recovery']){
  const completed=ledger(branch,7),completedBefore=JSON.stringify(completed),expected=Art.parts(completed),paid=ledger(branch,8,true),before=JSON.stringify(paid);
  assert.deepEqual(Art.parts(paid),expected);assert.equal(JSON.stringify(paid),before,'old paid history untouched by projection');paid.patrol={lastClaim:2,active:{run:3,steps:['inspect-water','clear-crossing','inspect-root','clear-root-pests']}};const patrolBefore=JSON.stringify(paid);assert.deepEqual(Art.parts(EE.validate(paid)),expected);assert.equal(JSON.stringify(paid),patrolBefore);
  assert.ok(expected.every(p=>!p.opt.temporary));assert.equal(role(expected,'supplied-section').length,0);assert.equal(JSON.stringify(completed),completedBefore);
 }
 const a=Art.parts(ledger());a[0].p[0]=999;a[0].opt.m[0]=999;assert.notEqual(Art.parts(ledger())[0].p[0],999);assert.notEqual(Art.parts(ledger())[0].opt.m[0],999);
});
test('only real live projections move supplied members, and ready fitting remains temporary before saved fastening',()=>{
 const {ctx,plan,view}=start(),saved=JSON.stringify(ctx.sim.state),plain=Art.parts(ctx.sim.state.earthExpedition);
 assert.deepEqual(Art.parts(ctx.sim.state.earthExpedition,JSON.parse(JSON.stringify(view))),plain,'serialized or forged progress has no authority');
 assert.deepEqual(Art.parts(ledger(),view),plain,'another character or copied ledger cannot borrow this live preview');
 const initial=Art.parts(ctx.sim.state.earthExpedition,view),active=role(initial,'preview-section');assert.equal(active.length,1);assert.equal(role(initial,'supplied-section').length,3);assert.equal(active[0].opt.sectionId,'brace-1');
 const wrong=dimensions(active[0]);near(wrong[1],g.sectionLength);assert.ok(Math.hypot(...sub(centerAtEnd(active[0],1),g.sections[0].to))>.055,'wrong pose is really visible in transformed mesh');
 let current=view;
 for(let i=0;i<4;i++){
  current=fit(ctx,plan);const ps=Art.parts(ctx.sim.state.earthExpedition,current),temporary=role(ps,'preview-section');
  assert.equal(temporary.filter(p=>p.opt.seated).length,i+1);assert.equal(temporary.filter(p=>p.opt.active).length,i===3?0:1);
  assert.equal(role(ps,'installed-section').length,0,'ready projection cannot claim saved installation');
  const ids=[...role(ps,'supplied-section'),...temporary].map(p=>p.opt.sectionId);assert.equal(new Set(ids).size,4);assert.equal(ids.length,4,'no duplicate supplied section');
  const collarIds=[...role(ps,'supplied-joint-collar'),...role(ps,'preview-joint-collar')].map(p=>p.opt.jointIndex);for(const joint of[1,2,3])assert.equal(collarIds.filter(id=>id===joint).length,4,'no duplicated or invented collar plates');
  for(const p of temporary.filter(p=>p.opt.seated)){const s=g.sections.find(s=>s.id===p.opt.sectionId);centerAtEnd(p,1).forEach((n,j)=>near(n,s.to[j]));}
  for(const p of ps)finite(p);
 }
 assert.equal(current.complete,true);assert.equal(role(Art.parts(ctx.sim.state.earthExpedition,current),'preview-joint-collar').length,12);assert.equal(JSON.stringify(ctx.sim.state),saved,'preview/seat art cannot mutate durable data');
 assert.deepEqual(Art.parts(ctx.sim.state.earthExpedition,view),plain,'old preview epoch is rejected');F.cancel(plan);assert.deepEqual(Art.parts(ctx.sim.state.earthExpedition,current),plain);
});
test('cached preview loses display authority on scene, state, death, revision and work-point changes',()=>{
 const changes=[ctx=>ctx.sim.room='world-atlantis',ctx=>ctx.sim.state={...ctx.sim.state},ctx=>ctx.sim.state.adventure.deaths++,ctx=>ctx.sim.state.adventure.revision++,ctx=>ctx.sim.state.player.x+=10,ctx=>ctx.sim.worldTrip={...ctx.sim.worldTrip,active:'another-character'},ctx=>ctx.sim.fieldcraftOwnerLease=Object.freeze({}),ctx=>ctx.sim.fieldcraftOwnerLease={}];
 for(const change of changes){const {ctx,view}=start();change(ctx);assert.deepEqual(Art.parts(ctx.sim.state.earthExpedition,view),Art.parts(ctx.sim.state.earthExpedition));}
});
test('real stamped lease preserves art across fresh save revisions and rejects missing, copied or invalid owners',()=>{
 const {ctx,plan,view}=start(),before=Art.parts(ctx.sim.state.earthExpedition,view);
 ctx.revision+=3;assert.equal(F.inspect(ctx,plan).ok,true,'same stamped lease survives fresh managed-save revision');const current=F.projection(plan);assert.ok(F.isProjection(current,ctx.sim.state.earthExpedition));assert.equal(role(Art.parts(ctx.sim.state.earthExpedition,current),'preview-section').length,1);
 assert.deepEqual(Art.parts(ctx.sim.state.earthExpedition,view),Art.parts(ctx.sim.state.earthExpedition),'rule epoch still rejects earlier view');assert.ok(before.some(p=>p.opt.temporary));
 assert.deepEqual(Art.parts(structuredClone(ctx.sim.state.earthExpedition),current),Art.parts(ctx.sim.state.earthExpedition),'copied ledger cannot borrow view');
 for(const lease of[undefined,{},Object.freeze({invented:true}),Object.freeze({})]){const {ctx:other}=start();other.ownerLease=lease;assert.equal(F.begin(other).ok,false,'unstamped or non-empty lease rejects');}
});
test('legal wrong-pose extrema keep each actual active section above soil and at the outer wall flank',()=>{
 const {yaw,pitch}=g.previewBounds;near(yaw.min,0);near(yaw.max,20*Math.PI/180);near(pitch.min,0);near(pitch.max,35*Math.PI/180);
 const wall=world.solids.find(s=>s.id==='elderweald-root-east-wall'),face=wall.x+wall.w/2;
 const original=legacyBrace(),allowedMinX=bounds(original).min[0];
 const anchors=[EE.definition.giver,...EE.definition.steps,...EE.definition.steps.flatMap(s=>s.choices||[]),...EE.definition.enemies,...EW.extension.points];
 let specimens=0;
 for(let index=0;index<4;index++){
  const {ctx,plan}=start();for(let i=0;i<index;i++)fit(ctx,plan);
  for(const y of[yaw.min,yaw.max/2,yaw.max])for(const p of[pitch.min,g.targetPitch,pitch.max/2,pitch.max]){
   const adjusted=F.adjust(ctx,plan,{yaw:y,pitch:p});assert.equal(adjusted.ok,true,adjusted.error);const ps=Art.parts(ctx.sim.state.earthExpedition,adjusted.view),active=role(ps,'preview-section').find(p=>p.opt.active),b=bounds(active);assert.equal(active.opt.sectionId,g.sections[index].id);finite(active);normalAgreement(active);
   assert.ok(b.min[1]>=g.floor-EPS,'wrong pose never buries timber');assert.ok(b.min[0]>=allowedMinX-EPS,'wrong pose has at most legacy6.5mm face contact');assert.ok(b.max[0]>face,'actual timber includes an exposed outer surface');assert.ok(b.min[0]>wall.x,'no swing into corridor-facing wall half');
   const d=dimensions(active);near(d[0],.16);near(d[1],g.sectionLength);near(d[2],.025);near(matrix(active)[0],0,'stable roll keeps width inYZ plane');
   if([yaw.min,yaw.max].includes(y)&&[pitch.min,pitch.max].includes(p))assert.ok(Math.hypot(...sub(centerAtEnd(active,1),g.sections[index].to))>g.endpointTolerance,'wrong extreme really misses the receiving socket');
   for(const q of ps){finite(q);assert.ok(bounds(q).min[1]>=g.floor-EPS);for(const v of vertices(q))assert.ok(W.land(g.room,v[0],v[2],0),q.opt.fieldcraftPart+' unsupported');for(const route of EW.extension.routes)for(let i=1;i<route.points.length;i++)assert.ok(bodyClear(route.points[i-1],route.points[i],q),route.id+' / '+q.opt.fieldcraftPart);for(const a of anchors)assert.ok(bodyClear([a.x,a.z],[a.x,a.z],q),a.id+' / '+q.opt.fieldcraftPart);}
   specimens++;
  }
  const extremum=F.adjust(ctx,plan,{yaw:yaw.max,pitch:pitch.max}),active=role(Art.parts(ctx.sim.state.earthExpedition,extremum.view),'preview-section').find(p=>p.opt.active);
  // Independent old generic roll is a deliberate negative control. It turns
  // the broad face throughX at this legal extreme and must fail the same cap.
  const bad=structuredClone(active),axis=unit(sub(active.opt.anchorTo,active.opt.anchorFrom)),ref=[0,0,1],normal=unit(ref.map((n,i)=>n-axis[i]*dot(axis,ref))),across=cross(axis,normal);
  bad.opt.m=[...across.map(n=>n*.16),0,...axis.map(n=>n*g.sectionLength),0,...normal.map(n=>n*.025),0,...active.p,1];
  assert.ok(bounds(bad).min[0]<allowedMinX-.05,'old rolling frame violates real outer-face intrusion cap');assert.ok(bounds(active).min[0]>=allowedMinX-EPS,'new preview satisfies unchanged cap');
 }
 assert.equal(specimens,48);
});
test('all supplied, fitting and permanent actual meshes keep root routes, full bodies and original work anchors clear',()=>{
 const {ctx,plan,view}=start(),states=[Art.parts(ledger()),Art.parts(ledger('managed-coppice',7)),Art.parts(ctx.sim.state.earthExpedition,view)];
 for(let i=0;i<4;i++)states.push(Art.parts(ctx.sim.state.earthExpedition,fit(ctx,plan)));
 const anchors=[EE.definition.giver,...EE.definition.steps,...EE.definition.steps.flatMap(s=>s.choices||[]),...EE.definition.enemies,...EW.extension.points];
 for(const ps of states)for(const p of ps){finite(p);const b=bounds(p);assert.ok(b.min[1]>=g.floor-EPS,'no buried '+p.opt.fieldcraftPart);for(const v of vertices(p))assert.ok(W.land(g.room,v[0],v[2],0),p.opt.fieldcraftPart+' unsupported');
  for(const route of EW.extension.routes)for(let i=1;i<route.points.length;i++)assert.ok(bodyClear(route.points[i-1],route.points[i],p),route.id+' / '+p.opt.fieldcraftPart);
  for(const a of anchors)assert.ok(bodyClear([a.x,a.z],[a.x,a.z],p),a.id+' / '+p.opt.fieldcraftPart);
 }
 assert.ok(Math.max(...states.map(p=>p.length))<=29,'bounded per-state geometry budget');
});
