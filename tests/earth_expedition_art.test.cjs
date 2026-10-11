/* CPU production-mesh/caller controls. Saved-stage and complete equipment
 * histories below are synthetic visual fixtures, never earned progress. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core.js'),W=require('../src/world-foundations.js'),E=require('../src/engine.js'),EE=require('../src/earth-expedition.js'),EA=require('../src/earth-expedition-art.js'),EW=require('../src/elderweald-world.js');
require('../src/coastward-settlement-art.js');require('../src/coastward-woodland-art.js');
require('../src/earth-grazer-motion.js');require('../src/earth-grazer-habitat-art.js');
const WA=require('../src/world-foundations-art.js'),F=1.57,R=.31,BODY=1.7,EPS=2e-5;
const Trail=require('../src/elderweald-trail-art.js'),A=require('../src/adventure.js'),AR=require('../src/arsenal.js'),Rig=require('../src/traveler-art.js'),Equipment=require('../src/traveler-equipment-art.js');
require('../src/realm-givers-art.js');require('../src/world.js');require('../src/earth-road.js');require('../src/earth-road-art.js');
const Fieldcraft=require('../src/earth-fieldcraft.js'),FieldcraftArt=require('../src/earth-fieldcraft-art.js');
const d=W.definition('earthlands'),empty=()=>({box:[],round:[],octa:[],disc:[],'timber-panel':[]});
function ledger(branch='managed-coppice',n=EE.definition.steps.length,claimed=false){const r=EE.fresh();r.story.accepted=true;r.story.steps=EE.definition.steps.slice(0,n).map(s=>s.id);r.story.branch=n>=2?branch:null;r.story.claimed=claimed;return EE.validate(r);}
const matrix=p=>p.opt?.m||p.m||E.M.compose(...p.p,...p.s,...(p.opt?.r||p.r||[0,0,0]));
function vertices(p){const g=E.geometry(p.kind),stride=p.kind==='timber-panel'?8:6,out=[];for(let i=0;i<g.length;i+=stride)out.push(E.M.transform(matrix(p),g.slice(i,i+3)));return out;}
function bounds(p){const v=vertices(p),min=[0,1,2].map(i=>Math.min(...v.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...v.map(p=>p[i])));if((p.opt?.wind??p.wind)===1){min[0]-=.078;max[0]+=.078;min[2]-=.04875;max[2]+=.04875;}return{min,max};}
const overlap=(a,b,eps=EPS)=>a.min.every((v,i)=>v<=b.max[i]+eps&&a.max[i]>=b.min[i]-eps);
const flatten=out=>Object.entries(out).flatMap(([kind,ps])=>ps.map(p=>({kind,...p})));
function interval(a,b,lo,hi){let first=0,last=1;for(let i=0;i<3;i++){const n=b[i]-a[i];if(Math.abs(n)<1e-9){if(a[i]<lo[i]||a[i]>hi[i])return null;}else{const x=(lo[i]-a[i])/n,y=(hi[i]-a[i])/n;first=Math.max(first,Math.min(x,y));last=Math.min(last,Math.max(x,y));if(first>last)return null;}}return[first,last];}
function clear(a,b,p){const q=bounds(p);return interval([a[0],F+.03,a[1]],[b[0],F+.03,b[1]],[q.min[0]-R,q.min[1]-BODY,q.min[2]-R],[q.max[0]+R,q.max[1],q.max[2]+R])===null;}
const near=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<EPS,`${v} != ${b[i]}`));
function finiteMesh(p){assert.ok(['box','octa','round','timber-panel'].includes(p.kind));assert.ok(p.p.every(Number.isFinite));assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));const m=matrix(p),axes=[0,4,8].map(i=>Array.from(m.slice(i,i+3)));assert.ok([...m].every(Number.isFinite));assert.ok(E.dot(axes[0],E.cross(axes[1],axes[2]))>0);for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.abs(E.dot(axes[i],axes[j]))<EPS);assert.ok(vertices(p).flat().every(Number.isFinite));}
function obbIntersects(a,b){
 const edge=p=>[0,4,8].map((i,j)=>Array.from(matrix(p).slice(i,i+3)).map(n=>n*(p.kind==='octa'&&j===1?.65:.5))),aa=edge(a),bb=edge(b),am=matrix(a),bm=matrix(b),delta=[12,13,14].map(i=>am[i]-bm[i]);
 for(const raw of [...aa,...bb,...aa.flatMap(a=>bb.map(b=>E.cross(a,b)))]){const len=Math.hypot(...raw);if(len<1e-9)continue;const axis=raw.map(n=>n/len),radius=[...aa,...bb].reduce((n,a)=>n+Math.abs(E.dot(axis,a)),0);if(Math.abs(E.dot(axis,delta))>radius+EPS)return false;}return true;
}
const hulls=new WeakMap();
function hull(p){
 if(hulls.has(p))return hulls.get(p);const vs=vertices(p),normals=[],edges=[],seen=new Set();
 const direction=(raw,target,label)=>{const len=Math.hypot(...raw);if(len<1e-9)return;let u=raw.map(n=>n/len);if(u.find(n=>Math.abs(n)>1e-8)<0)u=u.map(n=>-n);const key=label+u.map(n=>Math.round(n*1e6)).join(',');if(!seen.has(key)){seen.add(key);target.push(u);}};
 for(let i=0;i<vs.length;i+=3){const a=vs[i],b=vs[i+1],c=vs[i+2],ab=b.map((n,j)=>n-a[j]),ac=c.map((n,j)=>n-a[j]);direction(E.cross(ab,ac),normals,'n');direction(ab,edges,'e');direction(ac,edges,'e');direction(c.map((n,j)=>n-b[j]),edges,'e');}
 const out={vs,normals,edges};hulls.set(p,out);return out;
}
function meshIntersects(a,b){
 if(!obbIntersects(a,b))return false;const aa=hull(a),bb=hull(b);
 for(const axis of [...aa.normals,...bb.normals,...aa.edges.flatMap(a=>bb.edges.map(b=>E.cross(a,b)))]){if(Math.hypot(...axis)<1e-9)continue;const pa=aa.vs.map(p=>E.dot(axis,p)),pb=bb.vs.map(p=>E.dot(axis,p));if(Math.max(...pa)<Math.min(...pb)-1e-7||Math.max(...pb)<Math.min(...pa)-1e-7)return false;}return true;
}
function staticSubmission(quality='balanced'){
 const sim=new C.Simulation();sim.room=d.room;sim.state.settings.quality=quality;const before=JSON.stringify(sim.state),items=[],writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,depth,c,opt={}){items.push({kind,p:[x,y,z],s:[w,h,depth],c,...opt});},box(...p){this.add('box',...p);}};
 WA.make(writer,sim);assert.equal(JSON.stringify(sim.state),before);return items;
}

test('installed brace actually contacts the east wall outer face and clears the open passage',()=>{
 const parts=EA.parts(ledger()),sections=parts.filter(p=>p.opt.fieldcraftPart==='installed-section'),wall=d.solids.find(s=>s.id==='elderweald-root-east-wall'),face=wall.x+wall.w/2;
 assert.equal(sections.length,4);for(const p of sections){const b=bounds(p);
  assert.ok(b.min[0]<=face+EPS&&b.max[0]>face,'actual section mesh touches wall face');
  assert.ok(b.min[0]>wall.x,'section remains outside corridor-facing half');assert.ok(b.min[2]>=wall.z-wall.d/2&&b.max[2]<=wall.z+wall.d/2);
 }
 for(const receiver of parts.filter(p=>p.opt.fieldcraftPart==='receiver'))assert.ok(sections.some(p=>overlap(bounds(receiver),bounds(p))),'each receiver contacts an actual section end');
 for(const collar of parts.filter(p=>p.opt.fieldcraftPart==='joint-collar'))assert.ok(sections.some(p=>overlap(bounds(collar),bounds(p))),'collar touches actual sections');
});
test('delivered boards rest on the real glade rack and stack without unsupported gaps',()=>{
 const rack=staticSubmission().find(p=>p.elderwealdPart==='glade-stock'&&Math.abs(p.p[0]+110.7)<EPS),rb=bounds(rack);
 for(const branch of ['stormfall-recovery','managed-coppice']){
  const p=EA.parts(ledger(branch)),stocks=p.filter(p=>p.opt.expeditionPart==='delivered-stock').sort((a,b)=>a.p[1]-b.p[1]);assert.equal(stocks.length,3);let top=rb.max[1];
  for(const q of stocks){const b=bounds(q);assert.ok(Math.abs(b.min[1]-top)<EPS,'real rack/board support gap '+(b.min[1]-top));assert.ok(b.min[0]>=rb.min[0]-EPS&&b.max[0]<=rb.max[0]+EPS&&b.min[2]>=rb.min[2]-EPS&&b.max[2]<=rb.max[2]+EPS,'board footprint stays on rack');top=b.max[1];}
  for(const band of p.filter(p=>p.opt.expeditionPart==='delivery-binding'))assert.ok(stocks.some(stock=>overlap(bounds(band),bounds(stock))),'binding attaches to delivered stock');
 }
});
test('managed allocation material rests on ground and connects its prepared bands',()=>{
 const p=EA.parts(ledger('managed-coppice',2)),stock=p.filter(p=>p.opt.expeditionPart==='prepared-coppice-bundle');assert.equal(stock.length,2,'prepared managed bands require material, not floating blocks');
 stock.sort((a,b)=>a.p[1]-b.p[1]);assert.ok(Math.abs(bounds(stock[0]).min[1]-F)<EPS);assert.ok(Math.abs(bounds(stock[1]).min[1]-bounds(stock[0]).max[1])<EPS);
 for(const band of p.filter(p=>p.opt.expeditionPart==='prepared-allocation-band')){assert.ok(Math.abs(bounds(band).min[1]-F)<EPS);assert.ok(stock.some(s=>overlap(bounds(band),bounds(s))));}
});
test('both shape-valid allocation histories project only their recorded steps and explicit claim',()=>{
 assert.deepEqual(EA.parts(undefined),[]);let maximum=0;
 for(const branch of ['stormfall-recovery','managed-coppice'])for(let n=0;n<=EE.definition.steps.length;n++)for(const claimed of n===EE.definition.steps.length?[false,true]:[false]){
  const r=ledger(branch,n,claimed),before=JSON.stringify(r),p=EA.parts(r),again=EA.parts(EE.validate(JSON.parse(before)));assert.deepEqual(p,again);assert.equal(JSON.stringify(r),before);maximum=Math.max(maximum,p.filter(q=>!q.opt.fieldcraftPart).length);assert.ok(p.filter(q=>q.opt.fieldcraftPart).length<=29,'separate sectional fitting budget');
  const roles=p.map(p=>p.opt.expeditionPart),has=role=>roles.includes(role);
  assert.equal(has('prepared-allocation-band'),n>=2);assert.equal(has('installed-section'),n>=7);assert.equal(has('delivered-stock'),n>=8);assert.equal(has('claimed-board-seal'),claimed);assert.equal(has('claimed-board-mark'),claimed);
  if(n>=2)assert.ok(p.filter(p=>p.opt.allocation).every(p=>p.opt.allocation===branch));
  for(const q of p){finiteMesh(q);assert.equal(q.opt.appearanceOnly,true);assert.equal(q.opt.cameraSolid,false);assert.equal(q.opt.cutaway,false);assert.equal(q.opt.worldSolid,undefined);assert.equal(E.solidBounds(q.kind,{p:q.p,s:q.s,...q.opt}),null);}
 }
 assert.ok(maximum<=27,'unchanged non-fitting field components stay bounded');const r=ledger(),a=EA.parts(r);a[0].p[0]=999;assert.notEqual(EA.parts(r)[0].p[0],999);
 const completed=ledger('managed-coppice',8,true),old=EA.parts(completed);completed.patrol={lastClaim:2,active:{run:3,steps:['inspect-water']}};const enduring=ps=>ps.filter(p=>p.opt.patrolRun===undefined&&!['story-clear-tag','patrol-clear-tag','patrol-check-tag','clearance-check'].includes(p.opt.expeditionPart));assert.deepEqual(enduring(EA.parts(EE.validate(completed))),enduring(old),'patrol does not undo or replay first repair art');
});
test('worksite actual mesh stays supported and full-body routes/choice/work/foe anchors remain clear',()=>{
 const anchors=[EE.definition.giver,...EE.definition.steps,...EE.definition.steps.flatMap(s=>s.choices||[]),...EE.definition.enemies];
 for(const branch of ['stormfall-recovery','managed-coppice'])for(const n of [5,6,7,8])for(const p of EA.parts(ledger(branch,n,n===8))){
  const b=bounds(p);assert.ok(b.min[1]>=F-EPS,'no work mesh below floor');for(const v of vertices(p))assert.ok(W.land(d.room,v[0],v[2],0),p.opt.expeditionPart+' unsupported');
  for(const r of EW.extension.routes)for(let i=1;i<r.points.length;i++)assert.ok(clear(r.points[i-1],r.points[i],p),r.id+' '+p.opt.expeditionPart);
  for(const a of anchors)assert.ok(clear([a.x,a.z],[a.x,a.z],p),a.id+' '+p.opt.expeditionPart);
 }
});
test('grounded board/posts and shallow readable record layers keep connected construction',()=>{
 for(const claimed of [false,true]){const p=EA.parts(ledger('managed-coppice',8,claimed)),board=p.find(p=>p.opt.expeditionPart==='load-board'),bb=bounds(board);
  for(const post of p.filter(p=>p.opt.expeditionPart==='load-board-post')){assert.ok(Math.abs(bounds(post).min[1]-F)<EPS);assert.ok(overlap(bounds(post),bb));}
  for(const paper of p.filter(p=>p.opt.expeditionPart==='load-board-record')){const pb=bounds(paper);assert.ok(pb.min[2]>=bb.max[2]&&pb.min[2]-bb.max[2]<.004);assert.ok(pb.min[0]>=bb.min[0]&&pb.max[0]<=bb.max[0]);}
  if(claimed){const seal=p.find(p=>p.opt.expeditionPart==='claimed-board-seal'),mark=p.find(p=>p.opt.expeditionPart==='claimed-board-mark');assert.ok(overlap(bounds(seal),bounds(mark)));assert.ok(p.filter(p=>p.opt.expeditionPart==='load-board-record').some(p=>overlap(bounds(seal),bounds(p),.0021)),'thin seal layer rests within2.1mm of actual paper');}
 }
});
test('actual static caller emits coalesced floor, unchanged seventy banks and one box per physical solid',()=>{
 const crowns=require('../src/woodland-shapes.js');
 for(const quality of ['low','balanced','high']){
  // Retain the original scene budget while accounting for the four deliberately
  // replaced crowns. Every ground, bank and physical-solid assertion stays exact.
  const items=staticSubmission(quality),originalBase={low:1135,balanced:1267,high:1363}[quality];
  const replaced=EW.parts({quality,height:(x,z)=>W.height(d.room,x,z)}).filter(p=>crowns.IDS.includes(p.opt.solidId)&&crowns.ROLES.includes(p.opt.elderwealdPart));
  const replacement=items.filter(p=>p.woodlandShapes===crowns.SEED),trail=items.filter(p=>p.elderwealdTrail);
  assert.equal(replaced.length,quality==='low'?20:28);assert.equal(replacement.length,quality==='low'?8:20);
  const base=originalBase-replaced.length+replacement.length;
  assert.equal(items.filter(p=>!p.elderwealdTrail&&!p.earthRoadPart&&!p.habitatPart).length,base);assert.ok(trail.length<=280,'explicit trail factory budget');assert.equal(items.filter(p=>p.earthRoadPart==='post').length,1,'new canonical road post is separately owned');assert.equal(items.filter(p=>p.earthRoadPart==='fingerpost').length,16,'real road factory is present');const habitat=items.filter(p=>p.habitatPart);assert.equal(habitat.length,quality==='low'?64:128,'separately owned finite clearing dressing');assert.ok(items.length<=base+297+habitat.length);assert.equal(items.filter(p=>p.worldGround).length,64);assert.equal(items.filter(p=>p.coastBank).length,70);
  for(const s of d.solids){const ps=items.filter(p=>p.worldSolid&&p.worldSolidId===s.id);assert.equal(ps.length,1);assert.deepEqual(ps[0].p,[s.x,F+s.h/2,s.z]);assert.deepEqual(ps[0].s,[s.w,s.h,s.d]);assert.equal(ps[0].cameraSolid,true);}
  for(const p of items)assert.ok([...p.p,...p.s,...(p.m||[])].every(Number.isFinite));
 }
 assert.deepEqual(WA.coastBanks(WA.rawPartitions(d)),staticSubmission().filter(p=>p.coastBank).map(p=>{const{c,kind,p:position,s,...opt}=p;return{kind,p:position,s,c,...opt};}));
});
test('worn path quads use actual support and undergrowth intersects soil without blocking bodies',()=>{
 for(const quality of ['low','balanced','high']){const ps=Trail.parts(d,quality);assert.ok(ps.length<=280);assert.deepEqual(ps,Trail.parts(d,quality));for(const p of ps){finiteMesh(p);assert.equal(p.opt.appearanceOnly,true);assert.equal(p.opt.cameraSolid,false);assert.equal(p.opt.cutaway,false);
   for(const v of vertices(p))assert.ok(W.land(d.room,v[0],v[2],0),quality+' '+p.opt.elderwealdTrail+' unsupported mesh');const b=bounds(p);
   if(p.opt.elderwealdTrail==='worn-path'){assert.ok(b.min[1]>=F&&b.max[1]<=F+.014+EPS);assert.ok(!d.patches.some(q=>/bridge/.test(q.id)&&Math.abs(p.p[0]-q.x)<=q.w/2&&Math.abs(p.p[2]-q.z)<=q.d/2));}
   else{assert.ok(b.min[1]<=F&&b.max[1]>F,'true octa root intersects soil');for(const r of EW.extension.routes)for(let i=1;i<r.points.length;i++)assert.ok(clear(r.points[i-1],r.points[i],p),quality+' '+r.id+' understory');for(const a of [...EW.extension.points,...EW.extension.encounterClearings])assert.ok(clear([a.x,a.z],[a.x,a.z],p),a.id+' understory');}
  }}
 assert.deepEqual(Trail.parts(W.definition('atlantis')),[]);assert.throws(()=>Trail.parts(d,'ultra'),RangeError);
});
function equipped(id){const sim=new C.Simulation(),a=sim.state.adventure;a.started=true;a.owned.push(...Object.keys(A.GEAR).filter(k=>A.GEAR[k].slot==='weapon'&&!a.owned.includes(k)));a.equipment.weapon=id;a.arsenal.sockets[id]='ruby';a.pursuit.fittings[id]=2;a.starter.reward={choice:'temper',weapon:id};a.realmCraft.weapon=id;return sim;}
test('binding attaches to actual production rig across every weapon/carry/combat/reduced-motion phase and preserves older parts',()=>{
 const gem={kind:'octa',p:[0,0,0],s:[1,1,1]},inside={kind:'box',p:[0,0,0],s:[.1,.1,.1]},corner={kind:'box',p:[.45,.55,.45],s:[.05,.05,.05]};assert.equal(meshIntersects(gem,inside),true,'convex SAT detects a real overlap');assert.equal(obbIntersects(gem,corner),true);assert.equal(meshIntersects(gem,corner),false,'octa bounding corner is not occupied mesh');
 const ids=Object.keys(A.GEAR).filter(id=>A.GEAR[id].slot==='weapon');assert.ok(ids.includes('dawn_edge')&&ids.includes('oren_reedbow')&&ids.includes('oren_sunblade'));let specimens=0,maxParts=0;
 for(const id of ids){const sim=equipped(id),a=sim.state.adventure;for(const held of [false,true])for(const yaw of [0,1.3])for(const reducedMotion of [false,true])for(const phase of ['idle','anticipate','recover'])for(const guarded of [false,true])for(const kind of ['edge','shelter']){
  const posed=Rig.pose({style:AR.weapon(a).style,combatScene:held,combatPhase:phase,combatProgress:phase==='recover'?.38:1,guarded,reducedMotion}),frame=Rig.draw(empty(),{x:-67,z:-4,base:F,yaw,profile:sim.state.visitor},posed);
  a.earthBinding={version:1,weapon:null,kind:null};const old=empty();Equipment.draw(old,sim,frame);a.earthBinding={version:1,weapon:id,kind};const before=JSON.stringify(sim.state),out=empty(),summary=Equipment.draw(out,sim,frame),all=flatten(out),bound=all.filter(p=>p.weaponPart.startsWith('earth-binding'));
  assert.equal(bound.length,4);assert.equal(summary.earthBinding,kind);assert.equal(JSON.stringify(sim.state),before);assert.deepEqual(all.filter(p=>!p.weaponPart.startsWith('earth-binding')),flatten(old),'existing equipment/socket/temper/River/realm geometry unchanged');
  const grip=all.find(p=>p.weaponPart==='grip');near(grip.p,E.M.transform(frame.root,summary.gripLocal));near(summary.gripWorld,grip.p);for(const p of all){assert.ok([...p.p,...p.s,...p.m].every(Number.isFinite));assert.equal(p.weaponId,id);}for(const p of bound){finiteMesh(p);assert.equal(p.earthBinding,kind);if(p.weaponPart==='earth-binding-wrap')assert.ok(overlap(bounds(p),bounds(grip)),'wrap intersects real grip');}
  const pin=bound.find(p=>p.weaponPart==='earth-binding-pin');assert.ok(bound.filter(p=>p.weaponPart==='earth-binding-wrap').some(p=>overlap(bounds(pin),bounds(p))),'pin attaches to real wrap');
  for(const p of bound)for(const old of all.filter(p=>['socket','socket-mount','fitting','temper','realm-fitting','realm-fitting-trim'].includes(p.weaponPart)))assert.equal(meshIntersects(p,old),false,id+' '+p.weaponPart+' covers old '+old.weaponPart);
  maxParts=Math.max(maxParts,all.length);specimens++;
 }}assert.equal(specimens,672);assert.ok(maxParts<=48,maxParts+' equipment budget');
});
test('binding presentation belongs only to an actual selected owned item, never another character or equipped item',()=>{
 const sim=equipped('trail_blade'),frame=Rig.draw(empty(),{base:F},Rig.pose({style:'blade',combatScene:true}));sim.state.adventure.earthBinding={version:1,weapon:'copper_bow',kind:'edge'};let out=empty();Equipment.draw(out,sim,frame);assert.equal(flatten(out).some(p=>p.weaponPart.startsWith('earth-binding')),false);
 sim.state.adventure.earthBinding={version:1,weapon:'trail_blade',kind:'shelter'};sim.state.adventure.owned=sim.state.adventure.owned.filter(id=>id!=='trail_blade');out=empty();Equipment.draw(out,sim,frame);assert.deepEqual(flatten(out),[]);
 out=empty();Equipment.draw(out,equipped('trail_blade'),frame);assert.equal(flatten(out).some(p=>p.weaponPart.startsWith('earth-binding')),false);
});
test('actual WorldArt dynamic timber caller submits recorded work and resets scene/fog ownership',()=>{
 const engine={camera:{eye:[-67,12,-4],target:[-67,F,-4],projection:'orthographic'},clear(){this.batches=[];},batch(kind,items,dynamic=false){const b={kind,items,dynamic};this.batches.push(b);return b;},batches:[]};
 const art=Object.create(global.RealmArt.WorldArt.prototype);art.e=engine;const sim=new C.Simulation();sim.room=d.room;sim.state.earthExpedition=ledger('managed-coppice',8,true);const state=JSON.stringify(sim.state);
 WA.make(art,sim);A.syncScene(sim);assert.equal(art.dynamicTimber.kind,'timber-panel');art.update(sim,1,null);assert.equal(JSON.stringify(sim.state),state);assert.deepEqual(engine.worldFogCenter,[sim.state.player.x,sim.state.player.z]);
 const submitted=engine.batches.filter(b=>b.dynamic).flatMap(b=>b.items.map(p=>({kind:b.kind,...p}))).filter(p=>p.expeditionPart),expected=EA.parts(sim.state.earthExpedition).map(p=>({kind:p.kind,p:p.p,s:p.s,c:p.c,...p.opt}));assert.deepEqual(submitted.sort((a,b)=>a.expeditionPart.localeCompare(b.expeditionPart)),expected.sort((a,b)=>a.expeditionPart.localeCompare(b.expeditionPart)));
 const out=empty(),elsewhere={...sim,room:'world-atlantis'};EA.draw(out,elsewhere);assert.deepEqual(flatten(out),[]);
 art.begin('world-atlantis');assert.equal(engine.worldFog,null);assert.equal(engine.worldFogCenter,null);art.commit();assert.equal(art.dynamicTimber,null);
});
test('production fog frame has finite translation-relative focus, no non-Earth ownership and strict guards',()=>{
 const profile={clear:30,span:130},focus=[-70,-8],translated=[130,-108],a=E.fogFrame(focus,profile),b=E.fogFrame(translated,profile);assert.deepEqual(a,[-70,-8,30,130]);assert.deepEqual(b,[130,-108,30,130]);
 const sample=[-100,-30],moved=[sample[0]+200,sample[1]-100];assert.equal(Math.hypot(sample[0]-a[0],sample[1]-a[1]),Math.hypot(moved[0]-b[0],moved[1]-b[1]));assert.deepEqual(E.fogFrame([NaN],null),[0,0,0,0]);
 for(const [p,f] of [[[NaN,0],profile],[[0,0],{clear:-1,span:130}],[[0,0],{clear:30,span:0}],[[0,0,0],profile]])assert.throws(()=>E.fogFrame(p,f),RangeError);
 for(const realm of ['heaven','hell','atlantis']){const sim=new C.Simulation();sim.room=W.definition(realm).room;const writer={e:{worldFog:profile},begin(){},commit(){},add(){},box(){}};WA.make(writer,sim);assert.equal(writer.e.worldFog,null,realm+' fog owner');}
 const uniforms=[],renderer={gl:{useProgram(){},activeTexture(){},bindTexture(){}},uni(p,name,type,value){uniforms.push({name,value});},camera:{eye:[-70,12,-8],target:[-70,2,-8],projection:'orthographic'},batches:[],dynamic:[],worldFog:profile,worldFogCenter:focus,lightVP:E.M.identity(),quality:'balanced',theme:'earth',cutaway:false,surfaceMaterialInfo:{ready:false}};
 const pal={sun:[1,1,1],sunColor:[1,1,1],fog:[.5,.5,.5],power:1,ambient:.7,night:0,wet:0};for(const reflection of [false,true])E.Engine.prototype.geometryPass.call(renderer,{},E.M.identity(),pal,0,renderer.camera.eye,reflection,false);
 assert.deepEqual(uniforms.filter(p=>p.name==='uWorldFog').map(p=>p.value),[a,a],'main/reflection receive the actual translation-relative profile');
 const src=fs.readFileSync(require.resolve('../src/engine.js'),'utf8');assert.ok(src.includes('length(vPos.xz-uWorldFog.xy)'));assert.ok(src.includes('length(p-uWorldFog.xy)'));
});

test('borrowed kit belongs to exact active inspection, restores its checked form and never backfills paid runs',()=>{
 for(const branch of ['stormfall-recovery','managed-coppice']){
  const r=ledger(branch,8,true),permanent=EA.parts(r);r.patrol.lastClaim=7;assert.deepEqual(EA.parts(EE.validate(r)),permanent);
  r.patrol.active={run:8,steps:[]};const pending=EA.parts(EE.validate(r)).filter(p=>p.opt.patrolRun===8&&!p.opt.expeditionPart.includes('tag')); assert.ok(pending.some(p=>p.opt.expeditionPart==='patrol-kit-pending'));const marker=pending.find(p=>p.opt.expeditionPart==='patrol-kit-pending'),tray=pending.find(p=>p.opt.expeditionPart==='patrol-kit-tray');assert.ok(Math.abs(bounds(marker).min[1]-bounds(tray).max[1])<EPS,'marker rests on tray');
  for(const p of pending){finiteMesh(p);const b=bounds(p);assert.ok(W.walkable('world-earthlands',p.p[0],p.p[2]));assert.ok(b.min[1]>=F-EPS);assert.ok(b.min[0]>=-105.4-EPS&&b.max[0]<=-104.2+EPS&&b.min[2]>=-104.5-EPS&&b.max[2]<=-103.9+EPS);for(const [dx,dz] of[[0,1.7],[1.7,0],[-1.7,0],[0,-1.7],[0,0]])assert.ok(clear([-106+dx,-105+dz],[-106+dx,-105+dz],p),'approach body clear');}
  r.patrol.active.steps=EE.patrol.steps.map(s=>s.id);const checked=EA.parts(EE.validate(r)).filter(p=>p.opt.patrolRun===8);assert.ok(checked.some(p=>p.opt.expeditionPart==='patrol-kit-checked'));assert.ok(checked.some(p=>p.opt.expeditionPart===(branch==='managed-coppice'?'patrol-lashing-seated':'patrol-billet-squared')));assert.notDeepEqual(checked,pending);assert.deepEqual(EA.parts(EE.validate(JSON.parse(JSON.stringify(r)))),EA.parts(r));r.patrol={lastClaim:8,active:null};assert.deepEqual(EA.parts(EE.validate(r)),permanent);
 }
});
