/* Installed-source art only, CPU. Historical prerequisite world is byte-bound;
 * physical command anchors, HP bands/contact times below are labelled unit
 * boundaries. Actual Core/Adventure/EH/engine geometry execute, no owner facade,
 * no GPU/pixel/earned-route claim and no changed game-checkout files. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),load=n=>require(path.join(ROOT,'src',n));
// Capture actual installed source bytes during this process, not a fixed private
// epoch or a candidate/preimage catalogue. Never modify the selected checkout.
const sourceFiles=fs.readdirSync(path.join(ROOT,'src')).filter(n=>fs.statSync(path.join(ROOT,'src',n)).isFile());
const freeze=Object.fromEntries(sourceFiles.map(n=>[n,sha(fs.readFileSync(path.join(ROOT,'src',n)))]));
const C=load('core.js'),A=load('adventure.js'),H=load('earth-homecoming.js'),E=load('engine.js'),W=load('world-foundations.js'),D=H.definition,ART=load('earth-homecoming-art.js');
const empty=()=>({box:[],octa:[],round:[],disc:[]}),parts=o=>Object.entries(o).flatMap(([kind,items])=>items.map(p=>({kind,p}))),all=o=>parts(o).map(v=>v.p);
const fixtureBytes=fs.readFileSync(path.join(ROOT,'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json'));
assert.equal(sha(fixtureBytes),'3b8e39f119e5eda83211f036b13f982961a96830d24235a1a86065ee32c99a93');
function fixture(){
 const sim=new C.Simulation(C.validate(JSON.parse(fixtureBytes))),ctx={sim,active:'labelled-art-unit-owner'};sim.state.adventure.companion.mode='stay';
 const place=p=>{sim.room=p.room;sim.returnPos=p.room?{x:11,z:9,yaw:0}:null;sim.state.player={x:p.x,z:p.z,yaw:0};sim.playerPath=[];assert.ok(H.at(sim,p));};
 const save=s=>{C.validate(s);return{ok:true};};sim.earthHomecomingSave=save;
 const command=(type,payload={})=>{const r=H.command(ctx,type,{quest:D.id,expectedActive:ctx.active,expectedRevision:sim.state.adventure.revision,...payload},{save});assert.ok(r.ok,r.error);};
 place(D.giver);command('accept');for(const id of['bridge-record','register-record','inspect-claim','west-relay-isolated','east-relay-isolated','challenge-regent']){place(D.steps.find(s=>s.id===id));command('step',{step:id});}
 A.syncScene(sim);const e=A.runtime(sim).enemies.find(e=>e.id===D.enemy.id);assert.ok(H.owned(sim,e));return{sim,e,place};
}
function draw(f){const out=empty();assert.ok(ART.drawEnemy(out,f.sim,f.e));return out;}
function vertices(kind,p){const g=E.geometry(kind),out=[];for(let i=0;i<g.length;i+=6)out.push(E.M.transform(p.m,Array.from(g.slice(i,i+3))));return out;}
const local=(s,v)=>{const x=v[0]-s.x,z=v[2]-s.z;return{x:x*Math.cos(s.yaw)-z*Math.sin(s.yaw),z:x*Math.sin(s.yaw)+z*Math.cos(s.yaw)};};
const part=(o,id)=>all(o).find(p=>p.earthHomecomingPart===id),luminance=c=>{const v=[(c>>16)&255,(c>>8)&255,c&255].map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;},contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};

test('installed public API and static fixtures retain actual consent/scene/history projection without writes',()=>{
 assert.deepEqual(Object.keys(ART),['draw','drawEnemy']);
 const fresh=new C.Simulation(C.validate(JSON.parse(fixtureBytes))),unaccepted=JSON.stringify(fresh.state),none=empty();ART.draw(none,fresh);assert.equal(all(none).length,0);assert.equal(JSON.stringify(fresh.state),unaccepted);
 const f=fixture(),before=JSON.stringify({state:f.sim.state,e:f.e}),out=empty();ART.draw(out,f.sim);
 assert.deepEqual(new Set(all(out).map(p=>p.earthHomecomingFixture)),new Set(['west-relay-isolated','east-relay-isolated','supplied-screen','portable-claim']));
 for(const id of['west-relay-isolated','east-relay-isolated'])assert.ok(all(out).filter(p=>p.earthHomecomingFixture===id).every(p=>p.earthHomecomingRecorded===true));
 assert.ok(all(out).some(p=>p.earthHomecomingPart==='folded-warning-signal'));assert.ok(!all(out).some(p=>p.earthHomecomingActor||p.earthHomecomingTrace));
 for(const{kind,p}of parts(out)){assert.equal(p.appearanceOnly,true);assert.equal(p.cameraSolid,false);assert.equal(E.solidBounds(kind,p),null);}
 assert.equal(JSON.stringify({state:f.sim.state,e:f.e}),before);
});
test('actual roster gives one owned fixed-stat anchored apparatus and art grants nothing',()=>{
 const f=fixture(),before=JSON.stringify({state:f.sim.state,e:f.e});draw(f);assert.equal(JSON.stringify({state:f.sim.state,e:f.e}),before);
 assert.deepEqual([f.e.x,f.e.z,f.e.maxHP,f.e.damage,f.e.radius,f.e.anchored],[1,-35,168,12,.65,true]);assert.deepEqual([f.e.xp,f.e.coins,f.e.ore],[0,0,0]);
});
test('every real procedural vertex stays grounded inside the old .65 radius and 2.17 height for all postures/headings',t=>{
 let maximumRadius=0,maximumHeight=0,count=0;
 for(const mode of['idle','windup','recover'])for(const elapsed of[10,10.10,10.20])for(let i=0;i<16;i++){
  const f=fixture();Object.assign(f.e,{mode,yaw:i*Math.PI/8,contactAt:10});f.sim.state.adventure.elapsed=elapsed;
  const out=draw(f);count=Math.max(count,all(out).length);let minimum=Infinity;
  for(const{kind,p}of parts(out))for(const v of vertices(kind,p)){
   minimum=Math.min(minimum,v[1]);const r=Math.hypot(v[0]-f.e.x,v[2]-f.e.z),h=v[1]-W.height(D.room,f.e.x,f.e.z);maximumRadius=Math.max(maximumRadius,r);maximumHeight=Math.max(maximumHeight,h);
   assert.ok(r<=.65+1e-5,JSON.stringify({mode,elapsed,part:p.earthHomecomingPart,r}));assert.ok(h>=-1e-5&&h<=2.17+1e-5);
  }assert.ok(Math.abs(minimum-1.57)<1e-5);assert.ok(all(out).length<30);
 }t.diagnostic(JSON.stringify({maximumRadius,maximumHeight,bodyInstances:count}));
});
test('an open gantry/raised captive seal replaces the humanoid stack while stable legacy control tags remain',()=>{
 const f=fixture();f.e.mode='windup';const o=draw(f),tags=new Set(all(o).map(p=>p.earthHomecomingPart));
 for(const name of['regent-grounded-sole','regent-grounded-boot','regent-connected-leg','regent-hip-brace','regent-connected-torso','regent-mantle-fold','regent-shoulder-seam','regent-connected-arm','regent-mantle-yoke','regent-neck-link','regent-split-face','regent-seizure-window','regent-crown-bridge','regent-split-crown','regent-held-claim','regent-claim-inscription'])assert.ok(tags.has(name),'stable causal tag '+name);
 assert.equal(parts(o).find(v=>v.p.earthHomecomingPart==='regent-connected-torso').kind,'octa');assert.equal(parts(o).find(v=>v.p.earthHomecomingPart==='regent-split-face').kind,'octa');
 // The central upper opening is not filled by the mantle/torso. Only narrow
 // captive piston occupies it; the old silhouette placed a solid face here.
 const at=all(o).filter(p=>Math.abs(p.p[0]-f.e.x)<.08&&p.p[1]-1.57>1.70&&p.p[1]-1.57<1.78);assert.ok(at.every(p=>p.s[0]<=.13));
 assert.equal(all(o).filter(p=>p.earthHomecomingPart==='claim-side-signal').length,2);
});
test('gantry, trim, signals, feed and registry remain physically attached to the actual convex meshes',()=>{
 const inside=(kind,p,point)=>{const g=E.geometry(kind);for(let i=0;i<g.length;i+=18){const a=E.M.transform(p.m,Array.from(g.slice(i,i+3))),b=E.M.transform(p.m,Array.from(g.slice(i+6,i+9))),c=E.M.transform(p.m,Array.from(g.slice(i+12,i+15))),u=b.map((n,j)=>n-a[j]),v=c.map((n,j)=>n-a[j]),normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const signed=normal.reduce((n,v,j)=>n+v*(point[j]-a[j]),0);if(signed>1e-5*Math.hypot(...normal))return false;
 }return true;};
 for(const mode of['idle','windup','recover'])for(const yaw of[0,.73,Math.PI/2]){
  const f=fixture();Object.assign(f.e,{mode,yaw,contactAt:10});f.sim.state.adventure.elapsed=10.1;const out=draw(f),ps=parts(out),root=E.M.compose(f.e.x,1.57,f.e.z,1,1,1,0,yaw,0),seal=part(out,'regent-split-face').p[1]-1.57,cap=seal+.19;
  const join=(a,b,anchor)=>{const v=E.M.transform(root,anchor),as=ps.filter(p=>p.p.earthHomecomingPart===a),bs=ps.filter(p=>p.p.earthHomecomingPart===b);assert.ok(as.some(p=>inside(p.kind,p.p,v)),a+' does not contain join '+JSON.stringify(anchor));assert.ok(bs.some(p=>inside(p.kind,p.p,v)),b+' does not contain join '+JSON.stringify(anchor));};
  for(const side of[-1,1]){
   join('regent-grounded-sole','regent-grounded-boot',[side*.26,.107,.015]);join('regent-grounded-boot','regent-connected-leg',[side*.23,.21,0]);join('regent-connected-leg','regent-connected-torso',[side*.255,.66,0]);
   join('regent-hip-brace','regent-mantle-fold',[side*.355,.94,-.04]);join('regent-mantle-fold','regent-shoulder-seam',[side*.355,1.4,.055]);join('regent-mantle-fold','regent-connected-arm',[side*.305,1.30,-.04]);
   join('regent-shoulder-seam','claim-signal-housing',[side*.355,1.09,.08]);join('claim-signal-housing','claim-side-signal',[side*.355,1.09,.128]);join('regent-mantle-yoke','regent-split-crown',[side*.29,1.89,-.04]);
  }
  join('regent-connected-torso','regent-hip-brace',[0,.90,0]);join('regent-hip-brace','claim-feed-bed',[0,.95,.12]);join('claim-feed-bed','regent-held-claim',[0,.984,.13]);
  join('regent-split-face','regent-crown-bridge',[0,cap-.02,-.02]);join('regent-crown-bridge','regent-neck-link',[0,cap+.02,-.04]);join('regent-neck-link','regent-mantle-yoke',[0,1.825,-.04]);join('regent-split-face','regent-seizure-window',[0,seal,.102]);
  join('regent-connected-torso','claim-registry-housing',[0,.59,.13]);join('claim-registry-housing','regent-claim-inscription',[0,.59,.19]);
 }
});
test('anticipation, actual contact and recovery are finite distinct read-only phases without ambient or power scaling',()=>{
 const f=fixture();f.sim.state.adventure.elapsed=10;f.e.mode='idle';const idle=draw(f);
 f.e.mode='windup';const hot=draw(f);assert.ok(part(hot,'regent-split-face').p[1]>part(idle,'regent-split-face').p[1]);assert.ok(part(hot,'regent-seizure-window').em>0);
 f.e.mode='recover';f.e.contactAt=10;const contact=draw(f);assert.ok(part(contact,'regent-split-face').p[1]<part(idle,'regent-split-face').p[1]);assert.notEqual(part(contact,'regent-seizure-window').c,part(hot,'regent-seizure-window').c);
 f.sim.state.adventure.elapsed=10.181;const recovery=draw(f);assert.equal(part(recovery,'regent-split-face').p[1],part(idle,'regent-split-face').p[1]);assert.equal(part(recovery,'regent-seizure-window').c,0xaec0b3);
 f.sim.state.adventure.elapsed=9;assert.equal(part(draw(f),'regent-seizure-window').c,0xaec0b3,'future contact stamp cannot flash');
 f.e.contactAt=NaN;assert.equal(part(draw(f),'regent-seizure-window').c,0xaec0b3,'missing contact cannot flash');
 f.e.mode='idle';const stable=draw(f);f.sim.state.adventure.elapsed=900;f.sim.state.adventure.xp=9999;assert.equal(JSON.stringify(draw(f)),JSON.stringify(stable));
});
test('actual production Simulation/AI contact drives the candidate anticipation/impact/recovery without phase writes',()=>{
 const f=fixture();assert.equal(f.e.mode,'idle');f.sim.tick(.05);assert.equal(f.e.mode,'windup');assert.ok(Object.isFrozen(f.e.strike));
 const raised=part(draw(f),'regent-split-face').p[1];assert.ok(raised>1.57+1.4);
 let ticks=0;while(!Number.isFinite(f.e.contactAt)&&ticks++<50)f.sim.tick(.05);assert.ok(Number.isFinite(f.e.contactAt));assert.equal(f.e.mode,'recover');
 const before=JSON.stringify({state:f.sim.state,e:f.e}),impact=draw(f);assert.equal(JSON.stringify({state:f.sim.state,e:f.e}),before);assert.ok(part(impact,'regent-split-face').p[1]<raised);assert.equal(part(impact,'regent-seizure-window').c,0xf19159);
 for(let i=0;i<5;i++)f.sim.tick(.05);assert.equal(f.e.mode,'recover');assert.equal(part(draw(f),'regent-seizure-window').c,0xaec0b3);
});
test('reduced motion keeps quiet phase poses and warnings; pause and both view settings do not change geometry',()=>{
 const f=fixture();f.e.mode='recover';f.e.contactAt=10;f.sim.state.adventure.elapsed=10.1;f.sim.state.settings.reducedMotion=true;const quiet=draw(f);
 assert.ok(Math.abs(part(quiet,'regent-split-face').p[1]-1.57-1.26)<1e-5);assert.equal(part(quiet,'regent-seizure-window').em,0);
 f.sim.paused=true;assert.equal(JSON.stringify(draw(f)),JSON.stringify(quiet));
 for(const view of['adventure','follow','tactical','wide']){f.sim.state.settings.cameraMode=view;assert.equal(JSON.stringify(draw(f)),JSON.stringify(quiet));}
 f.sim.paused=false;f.e.mode='idle';f.sim.state.player={x:1,z:-38,yaw:0};assert.ok(H.lock(f.sim,f.e));f.e.mode='windup';const a=draw(f);f.sim.state.settings.reducedMotion=false;assert.equal(JSON.stringify(draw(f)),JSON.stringify(a));
});
test('real broad/narrow locks and explicit clipped frames keep every transformed warning vertex within contact bounds',()=>{
 for(const distance of[3,10.5])for(const yaw of[0,.41,Math.PI/2,Math.PI]){
  const f=fixture();f.sim.state.player={x:f.e.x+Math.sin(yaw)*distance,z:f.e.z+Math.cos(yaw)*distance,yaw:0};const locked=H.lock(f.sim,f.e);assert.ok(locked);f.e.mode='windup';
  for(const length of[0,.001,.02,.04,.08,locked.length]){
   // Tiny clipped lengths are labelled synthetic frames; dimensions/yaw come
   // from an actual production lock, not a substitute contact owner.
   f.e.strike=Object.freeze({...locked,length});const out=draw(f),warn=parts(out).filter(v=>v.p.earthHomecomingTelegraph);assert.equal(warn.length,length?8:0);
   for(const{kind,p}of warn){assert.equal(p.earthHomecomingActor,f.e.id);assert.equal(p.earthHomecomingPattern,locked.pattern);assert.equal(JSON.stringify(p.earthHomecomingStrike),JSON.stringify(f.e.strike));for(const v of vertices(kind,p)){const l=local(locked,v);assert.ok(Math.abs(l.x)<=locked.halfWidth+1e-5);assert.ok(l.z>=-1e-5&&l.z<=length+1e-5);}}
  }
 }
});
test('actual annulus retains both paired rims, no filled quiet center and exact immutable strike',()=>{
 const f=fixture();f.e.hp=56;f.sim.state.player={x:1,z:-32,yaw:0};const s=H.lock(f.sim,f.e);assert.equal(s.kind,'annulus');f.e.mode='windup';const before=JSON.stringify(s),warn=parts(draw(f)).filter(v=>v.p.earthHomecomingTelegraph);assert.equal(warn.length,192);
 for(const{kind,p}of warn)for(const v of vertices(kind,p)){const r=Math.hypot(v[0]-s.x,v[2]-s.z);assert.ok(r>=s.innerRadius-1e-5&&r<=s.outerRadius+1e-5);}
 assert.equal(H.strikeContains(f.e,{x:1,z:-34}),false);assert.equal(JSON.stringify(s),before);assert.ok(Object.isFrozen(s));assert.equal(new Set(warn.map(v=>v.p.earthHomecomingPart.split('-').at(-1))).size,2);
});
test('normal warning inset has measurable width/contrast and preserves the actual causal suffix pairs',t=>{
 const f=fixture();f.sim.state.player={x:1,z:-38,yaw:0};H.lock(f.sim,f.e);f.e.mode='windup';const now=draw(f),p=part(now,'locked-lane-side-inlay'),edge=part(now,'locked-lane-side-border');
 assert.ok(p.s[0]>=.04,'normal inset must be at least .04 wide');assert.ok(p.em>=.5);assert.ok(contrast(p.c,edge.c)>8);
 const warnings=all(now).filter(p=>p.earthHomecomingTelegraph);assert.equal(warnings.filter(p=>p.earthHomecomingPart.endsWith('-inlay')).length,4);assert.equal(warnings.filter(p=>p.earthHomecomingPart.endsWith('-border')).length,4);
 for(const inlay of warnings.filter(p=>p.earthHomecomingPart.endsWith('-inlay'))){const name=inlay.earthHomecomingPart.replace(/-inlay$/,'-border'),border=warnings.find(p=>p.earthHomecomingPart===name&&Math.hypot(...p.p.map((n,i)=>i===1?0:n-inlay.p[i]))<1e-5);assert.ok(border,'every inset retains its spatially paired border');assert.ok(inlay.s[0]<border.s[0]&&inlay.s[2]<=border.s[2]);}
 t.diagnostic(JSON.stringify({inlayWidth:p.s[0],colorContrast:contrast(p.c,edge.c),claim:'Installed CPU geometry/color only; actual pixels remain separate'}));
});
test('all material/transform values are finite with positive scales and stable appearance-only controls',()=>{
 for(const mode of['idle','windup','recover']){const f=fixture();f.e.mode=mode;f.e.contactAt=0;const out=draw(f);for(const p of all(out)){
  assert.ok(p.p.every(Number.isFinite)&&p.s.every(v=>Number.isFinite(v)&&v>0)&&Array.from(p.m).every(Number.isFinite));assert.ok(Number.isInteger(p.c)&&p.c>=0&&p.c<=0xffffff);assert.ok(p.rough>=0&&p.rough<=1);assert.ok(!p.em||p.em>=0&&p.em<=1);
  assert.equal(p.appearanceOnly,true);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.earthHomecomingActor,f.e.id);
 }}
});
test('stale/copied actors, recorded repulse, dead and wrong scene never draw active art',()=>{
 const f=fixture();for(const e of[{...f.e},{...f.e,earthHomecoming:'foreign'}]){const out=empty();assert.equal(ART.drawEnemy(out,f.sim,e),false);assert.equal(all(out).length,0);}
 f.e.hp=0;assert.equal(ART.drawEnemy(empty(),f.sim,f.e),false);f.e.hp=168;f.sim.state.earthHomecoming.steps.push('regent-repelled');assert.equal(ART.drawEnemy(empty(),f.sim,f.e),false);
});
test('statics plus worst-case ring stay within unchanged instance/triangle/batch budgets',t=>{
 const f=fixture();f.e.hp=56;f.sim.state.player={x:1,z:-32,yaw:0};H.lock(f.sim,f.e);f.e.mode='windup';const o=empty();ART.draw(o,f.sim);ART.drawEnemy(o,f.sim,f.e);
 const triangles=parts(o).reduce((n,{kind})=>n+E.geometry(kind).length/18,0),batches=Object.values(o).filter(v=>v.length).length;
 assert.ok(all(o).length<=260);assert.ok(triangles<=3200);assert.ok(batches<=2);t.diagnostic(JSON.stringify({instances:all(o).length,triangles,batches}));
});
test('actual installed source membership and bytes stay unchanged during all CPU art checks',()=>{
 assert.deepEqual(fs.readdirSync(path.join(ROOT,'src')).filter(n=>fs.statSync(path.join(ROOT,'src',n)).isFile()),sourceFiles);
 for(const[n,hash]of Object.entries(freeze))assert.equal(sha(fs.readFileSync(path.join(ROOT,'src',n))),hash,n);
});
