/* Pure CPU production-mesh checks. Progress snapshots and spatial probes below
 * are labelled synthetic; the command test uses real trail refusal/step/claim.
 * No GPU, DOM, native save persistence or human readability is certified. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const C=require('../src/core.js'),W=require('../src/world-foundations.js');
const R=require('../src/realm-trails.js'),A=require('../src/realm-trails-art.js'),E=require('../src/engine.js');
const RADIUS=.31,BODY=1.7,EPS=3e-5;
const copy=structuredClone,dFor=realm=>R.definitions().find(d=>d.realm===realm);
const matrix=p=>p.m||E.M.compose(...p.p,...p.s,...(p.r||[0,0,0]));
function vertices(p){const g=E.geometry(p.kind),m=matrix(p),vs=[];for(let i=0;i<g.length;i+=6)vs.push(E.M.transform(m,g.slice(i,i+3)));return vs;}
function bounds(p){const vs=vertices(p);return{min:[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),max:[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])))};}
function render(sim,time=0,api=A){const out={box:[],octa:[],disc:[],round:[]};api.draw(out,sim,time,{person(){}});return Object.entries(out).flatMap(([kind,pp])=>pp.map(p=>({kind,...p})));}
function snapshot(realm,accepted=false,steps=[],claimed=false){
 const sim=new C.Simulation(),d=dFor(realm);sim.room=W.definition(realm).room;
 Object.assign(sim.state.realmTrails.records[d.id],{accepted,steps:[...steps],claimed});
 R.validate(sim.state.realmTrails);return sim;
}
function states(realm){
 const d=dFor(realm),ss=[snapshot(realm)];
 for(let mask=0;mask<2**d.steps.length;mask++){
  const steps=d.steps.filter((s,i)=>mask&(1<<i)).map(s=>s.id);
  if(d.steps.some(s=>steps.includes(s.id)&&s.requires.some(id=>!steps.includes(id))))continue;
  ss.push(snapshot(realm,true,steps));
 }
 ss.push(snapshot(realm,true,d.steps.map(s=>s.id),true));return ss;
}
function segmentHits(a,b,bb){
 const lo=[bb.min[0]-RADIUS,bb.min[1]-BODY,bb.min[2]-RADIUS],hi=[bb.max[0]+RADIUS,bb.max[1],bb.max[2]+RADIUS];let first=0,last=1;
 for(let i=0;i<3;i++){const delta=b[i]-a[i];if(Math.abs(delta)<1e-10){if(a[i]<lo[i]||a[i]>hi[i])return false;}
 else{const p=(lo[i]-a[i])/delta,q=(hi[i]-a[i])/delta;first=Math.max(first,Math.min(p,q));last=Math.min(last,Math.max(p,q));if(first>last)return false;}}
 return true;
}
const work=pp=>pp.filter(p=>p.appearanceOnly),roles=(pp,id)=>pp.filter(p=>p.trailPart===id);

test('all legal Southern progress snapshots emit bounded supported kinds and finite positive production matrices',()=>{
 for(const realm of ['earthlands','atlantis'])for(const sim of states(realm)){
  const pp=render(sim);assert.ok(pp.length<=120,`${realm}: ${pp.length}`);
  for(const p of pp){
   assert.ok(['box','octa','disc'].includes(p.kind));assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(v=>Number.isFinite(v)&&v>0));
   const m=matrix(p);assert.equal(m.length,16);assert.ok([...m].every(Number.isFinite));assert.ok(vertices(p).flat().every(Number.isFinite));
   const cols=[0,4,8].map(i=>[m[i],m[i+1],m[i+2]]);assert.ok(E.dot(cols[0],E.cross(cols[1],cols[2]))>0,p.trailPart);
   assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(E.solidBounds(p.kind,p),null);
  }
 }
});
test('appearance projects acceptance and each true step; the packed job appears only after all supplies and packing',()=>{
 const d=dFor('earthlands'),raw=render(snapshot('earthlands'));
 assert.equal(roles(raw,'fallen-bough-bole').length,1);assert.equal(roles(raw,'fallen-bough-fork').length,2);
 assert.equal(roles(raw,'cut-reed-stem').length,6);assert.equal(roles(raw,'loose-shore-stone').length,5);assert.equal(roles(raw,'packed-bough-piece').length,0);
 assert.equal(roles(raw,'action-ring').length,0);assert.ok(work(raw).every(p=>p.workState==='unaccepted'));
 const accepted=render(snapshot('earthlands',true));assert.equal(roles(accepted,'action-ring').length,3);
 const supplies=render(snapshot('earthlands',true,d.steps.slice(0,3).map(s=>s.id)));
 assert.equal(roles(supplies,'prepared-bough-piece').length,6);assert.equal(roles(supplies,'reed-binding').length,2);
 assert.equal(roles(supplies,'sorted-shore-stone').length,2);assert.equal(roles(supplies,'packed-bough-piece').length,0);
 assert.equal(roles(supplies,'action-ring').length,1);
 const packed=render(snapshot('earthlands',true,d.steps.map(s=>s.id)));assert.equal(roles(packed,'packed-bough-piece').length,6);
 assert.equal(roles(packed,'packed-job-seal').length,1);assert.equal(roles(packed,'completed-record').length,0);
 const paid=render(snapshot('earthlands',true,d.steps.map(s=>s.id),true));assert.equal(roles(paid,'completed-record').length,1);
 assert.notEqual(roles(packed,'packed-job-seal')[0].c,roles(paid,'packed-job-seal')[0].c);
 // Explicit impossible synthetic history cannot paint successful work if not accepted.
 const invalid=snapshot('earthlands');invalid.state.realmTrails.records[d.id].steps=d.steps.map(s=>s.id);invalid.state.realmTrails.records[d.id].claimed=true;
 assert.equal(roles(render(invalid),'packed-bough-piece').length,0);assert.equal(roles(render(invalid),'completed-record').length,0);
});
test('Bellglass reveals separate recorded readings, corrected layered chart and fitted marker without erasing the older scale',()=>{
 const d=dFor('atlantis'),raw=render(snapshot('atlantis')),seen=render(snapshot('atlantis',true,['upper-gauge','lower-masonry']));
 assert.equal(roles(raw,'depth-scale-notch').length,4);assert.equal(roles(raw,'upper-reading-slip').length,0);
 assert.equal(roles(seen,'upper-reading-slip').length,1);assert.equal(roles(seen,'lower-reading-slip').length,1);
 assert.equal(roles(seen,'charted-depth-connection').length,0);assert.equal(roles(seen,'fitted-landing-plate').length,0);
 const chart=render(snapshot('atlantis',true,d.steps.slice(0,3).map(s=>s.id)));
 assert.equal(roles(chart,'charted-depth-connection').length,1);assert.equal(roles(chart,'charted-court-doorway').length,3);
 assert.equal(roles(chart,'fitted-landing-plate').length,0);
 const done=render(snapshot('atlantis',true,d.steps.map(s=>s.id)));
 assert.equal(roles(done,'fitted-landing-plate').length,1);assert.equal(roles(done,'modern-route-arrow').length,3);
 assert.deepEqual(roles(raw,'old-masonry-plate'),roles(done,'old-masonry-plate').map(p=>({...p,workState:'unaccepted'})));
 const arrow=roles(done,'modern-route-arrow').filter(p=>p.towardExit),exit=W.definition('atlantis').dive.exit;
 assert.ok(arrow.every(p=>(p.p[2]-d.steps[3].z)*(exit.z-d.steps[3].z)>0));
 const tips=arrow.map(p=>E.M.transform(matrix(p),[0,0,p.towardExit*.5]));
 assert.ok(tips.every(p=>Math.abs(p[1]-(d.steps[3].y+.7))<.001),'both branches meet at the forward arrow point');
 assert.ok(tips.every(p=>(p[2]-d.steps[3].z)*Math.sign(exit.z-d.steps[3].z)>.21));
});
test('actual Earth mesh feet stay on canonical ground and clear walking, task and giver body envelopes',()=>{
 const def=W.definition('earthlands'),d=dFor('earthlands'),routes=def.routes.flatMap(r=>r.points.slice(1).map((p,i)=>[r.points[i],p]));
 const anchors=[...def.points,...d.steps,d.giver];
 for(const sim of states('earthlands'))for(const p of work(render(sim))){
  const bb=bounds(p);assert.ok(bb.min[1]>=1.57-EPS,`${p.trailPart} below ground`);
  for(const v of vertices(p))assert.ok(def.patches.some(q=>Math.abs(v[0]-q.x)<=q.w/2+EPS&&Math.abs(v[2]-q.z)<=q.d/2+EPS),p.trailPart+' unsupported XZ');
  for(const [a,b]of routes)assert.equal(segmentHits([a[0],1.57,a[1]],[b[0],1.57,b[1]],bb),false,p.trailPart+' enters route');
  for(const a of anchors)assert.equal(segmentHits([a.x,1.57,a.z],[a.x,1.57,a.z],bb),false,p.trailPart+' enters '+(a.id||a.name));
  for(const s of def.solids){const floor=W.height(def.room,s.x,s.z),min=[s.x-s.w/2,floor,s.z-s.d/2],max=[s.x+s.w/2,floor+s.h,s.z+s.d/2];
   assert.ok([0,1,2].some(i=>bb.max[i]<=min[i]+EPS||bb.min[i]>=max[i]-EPS),p.trailPart+' intrudes into '+s.id);}
 }
 const raw=roles(render(snapshot('earthlands')),'fallen-bough-bole')[0];assert.ok(bounds(raw).min[1]<1.575,'fallen bole rests on ground');
 const packed=render(states('earthlands').at(-1)),tray=bounds(roles(packed,'packing-tray')[0]);
 for(const p of packed.filter(p=>p.trailStep==='road-pack'&&p.trailPart!=='packing-tray'&&p.trailPart!=='packing-tray-rim')){
  const bb=bounds(p);assert.ok(bb.min[0]>=tray.min[0]-EPS&&bb.max[0]<=tray.max[0]+EPS&&bb.min[2]>=tray.min[2]-EPS&&bb.max[2]<=tray.max[2]+EPS,p.trailPart+' overhangs load');
 }
});
test('actual Bellglass full meshes clear the complete XYZ visitor route, dive blockers and step bodies',()=>{
 const def=W.definition('atlantis'),d=dFor('atlantis'),routes=def.dive.routes.flatMap(r=>r.points.slice(1).map((p,i)=>[r.points[i],p]));
 for(const sim of states('atlantis'))for(const p of work(render(sim))){
  const bb=bounds(p),v=def.dive.volume;
  assert.ok(bb.min[0]>=v.x-v.w/2-EPS&&bb.max[0]<=v.x+v.w/2+EPS&&bb.min[2]>=v.z-v.d/2-EPS&&bb.max[2]<=v.z+v.d/2+EPS,p.trailPart+' outside gallery');
  for(const [a,b]of routes)assert.equal(segmentHits([a[0],a[1],a[2]],[b[0],b[1],b[2]],bb),false,p.trailPart+' enters XYZ visitor route');
  for(const a of d.steps)assert.equal(segmentHits([a.x,a.y,a.z],[a.x,a.y,a.z],bb),false,p.trailPart+' enters '+a.id);
  for(const r of def.routes)for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i];assert.equal(segmentHits([a[0],1.57,a[1]],[b[0],1.57,b[1]],bb),false,p.trailPart+' enters dry public route');}
  for(const s of def.dive.solids){const min=[s.x-s.w/2,s.y,s.z-s.d/2],max=[s.x+s.w/2,s.y+s.h,s.z+s.d/2];
   assert.ok([0,1,2].some(i=>bb.max[i]<=min[i]+EPS||bb.min[i]>=max[i]-EPS),p.trailPart+' intrudes into '+s.id);}
 }
});
test('desk, inclined layered chart, suspended gauge and bed-mounted feet meet their real supports',()=>{
 const pp=render(states('atlantis').at(-1)),court=W.definition('atlantis').dive.dryCourts[0];
 for(const p of pp.filter(p=>p.workSupport)){
  const bb=bounds(p);if(p.workSupport==='deck-underside')assert.ok(Math.abs(bb.max[1]-p.supportY)<EPS);
  else assert.ok(Math.abs(bb.min[1]-p.supportY)<EPS,p.trailPart+' foot');
 }
 const legs=roles(pp,'chart-desk-leg'),top=bounds(roles(pp,'chart-desk-top')[0]);
 assert.ok(legs.every(p=>bounds(p).max[1]>=top.min[1]));assert.ok(legs.every(p=>Math.abs(bounds(p).min[1]-court.floorY)<EPS));
 for(const p of pp.filter(p=>p.chartOffset!==undefined)){
  const expected=p.trailPart==='chart-board'?0:p.trailPart==='visitor-chart-paper'?.015:.03;
  assert.equal(p.chartOffset,expected);assert.ok(Math.abs(p.r[0]-.24)<EPS);
 }
 const props=roles(pp,'chart-board-prop'),board=roles(pp,'chart-board')[0];
 for(const p of props){const dz=-.31,underside=board.p[1]-Math.sin(.24)*dz-Math.cos(.24)*.0075;
  assert.ok(Math.abs(bounds(p).max[1]-underside)<EPS,'chart support reaches underside');assert.ok(Math.abs(bounds(p).min[1]-top.max[1])<EPS);}
 const beam=roles(pp,'gauge-suspension')[0],anchor=roles(pp,'deck-gauge-anchor')[0];assert.equal(beam.workTo[1],anchor.supportY);
 for(const p of pp.filter(p=>p.workFrom)){
  const m=matrix(p),a=E.M.transform(m,[0,-.5,0]),b=E.M.transform(m,[0,.5,0]);
  assert.ok(a.every((v,i)=>Math.abs(v-p.workFrom[i])<EPS));assert.ok(b.every((v,i)=>Math.abs(v-p.workTo[i])<EPS));
 }
});
test('bed, court and suspended-gauge support heights agree with the actual generic scene writer',()=>{
 const F=require('../src/world-foundations-art.js'),sim=snapshot('atlantis'),def=W.definition('atlantis'),staticParts=[];
 const writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,d,c,opt={}){staticParts.push({kind,p:[x,y,z],s:[w,h,d],c,...opt});},box(...args){this.add('box',...args);}};
 F.make(writer,sim);
 const bed=staticParts.find(p=>p.kind==='box'&&p.p[0]===def.dive.volume.x&&p.p[2]===def.dive.volume.z&&p.s[0]===def.dive.volume.w&&p.s[1]===.12&&p.s[2]===def.dive.volume.d);
 const court=def.dive.dryCourts[0],floor=staticParts.find(p=>p.kind==='box'&&!p.worldSolid&&p.p[0]===court.x&&p.p[2]===court.z&&p.s[0]===court.w&&p.s[1]===.12&&p.s[2]===court.d);
 assert.ok(bed);assert.ok(floor);
 for(const p of work(render(sim)).filter(p=>p.workSupport)){
  if(p.workSupport==='gallery-bed')assert.ok(Math.abs(p.supportY-bounds(bed).max[1])<EPS);
  else if(p.workSupport==='bellglass-air')assert.ok(Math.abs(p.supportY-bounds(floor).max[1])<EPS);
  else {const deck=staticParts.find(q=>q.worldGround&&Math.abs(p.p[0]-q.p[0])<=q.s[0]/2&&Math.abs(p.p[2]-q.p[2])<=q.s[2]/2);
   assert.ok(deck);assert.ok(Math.abs(p.supportY-bounds(deck).min[1])<EPS);}
 }
});
test('South work geometry is static across pause, time, reduced motion and both camera settings; all input data stays unchanged',()=>{
 for(const realm of ['earthlands','atlantis']){
  const sim=states(realm).at(-1),baseline=render(sim),definitionBefore=copy(W.definition(realm));
  for(const paused of [false,true])for(const reducedMotion of [false,true])for(const camera of ['adventure','diorama']){
   sim.paused=paused;sim.state.settings.reducedMotion=reducedMotion;sim.state.settings.camera=camera;
   const before=copy(sim.state);assert.deepEqual(render(sim,9999),baseline);assert.deepEqual(sim.state,before);
  }
  assert.deepEqual(W.definition(realm),definitionBefore);
  const mutated=render(sim);mutated[0].p[0]=1e6;assert.deepEqual(render(sim),baseline,'no shared mutable output');
 }
});
test('real trail commands leave the chart unconnected after wrong choice or refused save, then project a committed correction',()=>{
 const sim=new C.Simulation(),d=dFor('atlantis'),ctx={sim,active:'labelled-art-unit-character',revision:0},io={save:()=>({ok:true})};
 sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('work-art-kit','start').ok);
 sim.state.player={...W.GATE,yaw:0};const preview=W.preview(ctx,'atlantis');assert.ok(preview.ok);assert.ok(W.enter(preview.ticket,ctx,{...io,build(){}}).ok);
 sim.state.player={...d.giver,yaw:0};assert.ok(R.command(ctx,'accept',{quest:d.id},io).ok);
 for(const s of d.steps.slice(0,2)){sim.state.player={x:s.x,z:s.z,yaw:0};sim.worldDive={y:s.y,hold:true,surface:{x:8,z:-16,yaw:0}};assert.ok(R.command(ctx,'step',{quest:d.id,step:s.id},io).ok);}
 const chart=d.steps[2];sim.state.player={x:chart.x,z:chart.z,yaw:0};sim.worldDive.y=chart.y;
 const before=copy(sim.state),image=render(sim);
 assert.equal(R.command(ctx,'step',{quest:d.id,step:chart.id,choice:'one-flat-line'},io).ok,false);assert.deepEqual(sim.state,before);assert.deepEqual(render(sim),image);
 assert.equal(R.command(ctx,'step',{quest:d.id,step:chart.id,choice:chart.correctChoice},{save:()=>({ok:false,error:'synthetic quota refusal'})}).ok,false);assert.deepEqual(sim.state,before);assert.deepEqual(render(sim),image);
 assert.ok(R.command(ctx,'step',{quest:d.id,step:chart.id,choice:chart.correctChoice},io).ok);assert.equal(roles(render(sim),'charted-depth-connection').length,1);
 assert.deepEqual([sim.state.adventure.xp,sim.state.adventure.coins,sim.state.adventure.ore],[before.adventure.xp,before.adventure.coins,before.adventure.ore]);
});
test('six northern and Cosmos projections retain pinned base output without depending on Git history',()=>{
 // Generated from the unmodified writer at 2b2d27ca3a5fb1dd8e4b7faebc06ed5c9db32491,
 // time 4, fresh Core state and a deliberately empty person writer. These are
 // presentation baselines, not earned journeys or evidence of NPC rendering.
 const baseline={
  'heaven-false':'d2a7e4476a6c94be6f1d8ada6ba444a9d8103bdf12337ce48ea0d56285fc253e',
  'heaven-true':'093aa65b12fbe1b94a5f1d1e6e5d471084bcecb40b5769e331c4f0b5c2ed299d',
  'hell-false':'76d4ab09ea4e36c24aa339758e849d7e90317cb6ec41433f784f8a3d2732ece7',
  'hell-true':'76d4ab09ea4e36c24aa339758e849d7e90317cb6ec41433f784f8a3d2732ece7',
  'cosmos-false':'6d224f65f5752e9d3ac86fb2aa807e97bee0a5136d895b63cb9cc4949d448818',
  'cosmos-true':'f66b6347723af9d9a48503b8e81bd978fc26927bf10979c3cc9b30a3c6d5090b'
 };
 for(const realm of ['heaven','hell','cosmos'])for(const accepted of [false,true]){
  const actual=render(snapshot(realm,accepted),4);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(actual)).digest('hex'),baseline[realm+'-'+accepted],realm);
 }
});
test('browser global and CommonJS preserve the original interface and add no foreign global authority',()=>{
 const source=fs.readFileSync(require.resolve('../src/realm-trails-art.js'),'utf8'),sandbox={sentinel:17,module:{exports:{}}};vm.runInNewContext(source,sandbox);
 assert.equal(sandbox.module.exports,sandbox.RealmTrailsArt);assert.deepEqual(Object.keys(sandbox.module.exports),['draw']);assert.equal(sandbox.sentinel,17);assert.equal(Object.keys(sandbox).length,3);
});
