'use strict';
/* Portable catalogue/installed-support CPU checks, not command-earned play.
 * Actual installed data/World/Cosmos owners are loaded through FIRSTLIGHT_ROOT.
 * A byte-pinned original Cosmos fixture supplies historical contrast only.
 * Archived fiction attribution is checked against the frozen catalogue; this
 * portable run does not reread or copy recovered Markdown documents. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const test=require('node:test'),assert=require('node:assert/strict');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const DATA=path.join(ROOT,'src/cosmos-campaign-data.js'),PREIMAGE=path.join(ROOT,'tests/fixtures/cosmos-original/cosmos.js');
const D=require(DATA),d=D.definition,g=D.geometry;
const inputs=['src/cosmos-campaign-data.js','src/cosmos.js','src/world-foundations.js','src/realm-trails-cosmos.js','src/local-life.js'].map(p=>path.join(ROOT,p));inputs.push(PREIMAGE);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const epoch=Object.fromEntries(inputs.map(p=>[p,sha(p)]));
assert.equal(sha(DATA),'64e2605486bd499e5aafcf953f2f0e985896ad0c00343efe33e9c15f52e34069');
assert.equal(sha(PREIMAGE),'dc646ba254ad4c482685c58d342e50c696832f479c8a13526faeed089fe4d3c5');
const N=require(path.join(ROOT,'src/cosmos.js')),W=require(path.join(ROOT,'src/world-foundations.js'));
const baseline={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(PREIMAGE,'utf8'),baseline,{filename:PREIMAGE});const O=baseline.module.exports;
const patches=N.PATCHES,solids=N.SOLIDS;
const def=id=>d.steps.find(s=>s.id===id),inside=(p,r)=>Math.abs(p.x-r.x)<=r.w/2+1e-10&&Math.abs(p.z-r.z)<=r.d/2+1e-10;

function canRecord(history,id){
 const s=def(id),set=new Set(history);if(!s||set.has(id)||!s.requires.every(x=>set.has(x)))return false;
 const completed=D.completedSupports(history),configured=D.configuredSupports(history);
 if(s.requiresSupport&&!completed.includes(s.requiresSupport)||s.requiresSupports&&completed.length<s.requiresSupports||s.requiresConfiguredSupports&&configured.length<s.requiresConfiguredSupports)return false;
 const support=D.supports.find(v=>v.complete===id||v.assistance===id);
 return !support||!set.has(id===support.complete?support.assistance:support.complete);
}
function hypotheticalPath(selected,modes,choice='public-record'){
 const history=[];
 for(const s of d.steps){
  const support=D.supports.find(v=>[v.inspect,v.complete,v.assistance,v.configure].includes(s.id));
  if(support){
   if(!selected.includes(support.id))continue;
   const assisted=modes[support.id]==='assisted';
   if((s.id===support.assistance&&!assisted)||([support.inspect,support.complete].includes(s.id)&&assisted))continue;
  }
  assert.ok(canRecord(history,s.id),'abstract graph eligibility: '+s.id);history.push(s.id);
 }
 return{version:1,accepted:true,steps:history,choice,opened:true,claimed:false};
}
const pointRectDistance=(p,r)=>Math.hypot(Math.max(r.minX-p.x,0,p.x-r.maxX),Math.max(r.minZ-p.z,0,p.z-r.maxZ));
function pointSegmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);}
function segmentIntersects(a,b,r){
 let lo=0,hi=1;for(const[k,min,max]of[['x',r.minX,r.maxX],['z',r.minZ,r.maxZ]]){
  const v=b[k]-a[k];if(Math.abs(v)<1e-12){if(a[k]<min||a[k]>max)return false;}
  else{let u=(min-a[k])/v,t=(max-a[k])/v;if(u>t)[u,t]=[t,u];lo=Math.max(lo,u);hi=Math.min(hi,t);if(lo>hi)return false;}
 }return true;
}
function distanceToCell(a,b,r){
 if(segmentIntersects(a,b,r))return 0;
 return Math.min(pointRectDistance(a,r),pointRectDistance(b,r),...[[r.minX,r.minZ],[r.minX,r.maxZ],[r.maxX,r.minZ],[r.maxX,r.maxZ]].map(([x,z])=>pointSegmentDistance({x,z},a,b)));
}
function wholeCapsuleSupported(a,b,r,ground=patches){
 // Independent exact rectilinear-cell check of the continuous swept disc.
 // Every uncovered cell that
 // intersects the capsule interior rejects the route, including narrow gaps.
 const minX=Math.min(a.x,b.x)-r,maxX=Math.max(a.x,b.x)+r,minZ=Math.min(a.z,b.z)-r,maxZ=Math.max(a.z,b.z)+r;
 const xs=[minX,maxX],zs=[minZ,maxZ];
 for(const p of ground){for(const x of[p.x-p.w/2,p.x+p.w/2])if(x>minX&&x<maxX)xs.push(x);for(const z of[p.z-p.d/2,p.z+p.d/2])if(z>minZ&&z<maxZ)zs.push(z);}
 const unique=values=>[...new Set(values)].sort((x,y)=>x-y),xx=unique(xs),zz=unique(zs);
 for(let x=1;x<xx.length;x++)for(let z=1;z<zz.length;z++){
  const cell={minX:xx[x-1],maxX:xx[x],minZ:zz[z-1],maxZ:zz[z]},mid={x:(cell.minX+cell.maxX)/2,z:(cell.minZ+cell.maxZ)/2};
  if(!ground.some(p=>inside(mid,p))&&distanceToCell(a,b,cell)<r-1e-8)return false;
 }return true;
}
function clearRoute(points,r){for(let i=0;i<points.length;i++){
 assert.ok(W.walkable(d.room,points[i].x,points[i].z,r),'production whole-body point '+JSON.stringify(points[i]));
 assert.ok(wholeCapsuleSupported(points[i],points[i],r),'independent full disc at '+JSON.stringify(points[i]));
 if(i){assert.ok(W.segment(d.room,points[i-1],points[i],r),'production whole segment '+JSON.stringify(points.slice(i-1,i+1)));
 assert.ok(wholeCapsuleSupported(points[i-1],points[i],r),'independent full capsule '+JSON.stringify(points.slice(i-1,i+1)));}
}}

test('catalogue and all nested structures are frozen; import is data only',()=>{
 function check(o){if(o&&typeof o==='object'){assert.equal(Object.isFrozen(o),true);for(const v of Object.values(o))check(v);}}
 check(D);assert.equal(global.RealmCosmosCampaignData,D);
 assert.deepEqual(d.state,{version:1,accepted:false,steps:[],choice:null,opened:false,claimed:false});
 assert.equal(typeof D.command,'undefined');assert.equal(typeof D.render,'undefined');assert.equal(typeof D.damage,'undefined');
});
test('exact existing room/prerequisite/giver remain owned by the current source',()=>{
 const trails=require(path.join(ROOT,'src/realm-trails-cosmos.js')).definitions;
 assert.equal(d.room,N.ROOM);assert.equal(d.prerequisite,'cosmos-split-bearing-v1');assert.ok(trails.some(v=>v.id===d.prerequisite));
 const anik=N.POINTS.find(p=>p.id===d.giver.id);assert.equal(anik.x,d.giver.x);assert.equal(anik.z,d.giver.z);assert.ok(Math.abs(N.height(anik.x,anik.z)-d.giver.y)<1e-12,'1.57 + 3.2 uses ordinary floating arithmetic');
 assert.equal(d.entry.kit,'adventure.started');assert.equal(d.entry.prior,'claimed realmTrails record');
 assert.ok(fs.readFileSync(path.join(ROOT,'src/local-life.js'),'utf8').includes('cosmos-drawing-shelf-v1'));
});
test('all identifiers are finite and every dependency precedes its consumer',()=>{
 const ids=d.steps.map(s=>s.id);assert.equal(new Set(ids).size,ids.length);
 for(const s of d.steps){assert.match(s.id,/^[a-z0-9-]+$/);assert.ok(['interact','configure','defeat','choice'].includes(s.kind));
  assert.equal(s.medium,'dry');assert.equal(s.y,4.77);assert.ok([s.x,s.z].every(Number.isFinite));
  for(const before of s.requires)assert.ok(ids.indexOf(before)>=0&&ids.indexOf(before)<ids.indexOf(s.id),s.id+' requires '+before);
 }
});
test('any two DISTINCT supports suffice; two variants of one never qualify',()=>{
 assert.equal(D.supportRule.required,2);assert.deepEqual(D.supportRule.distinct,['material','living','observation']);
 assert.equal(D.completedSupports(['material-fit','assist-material']).length,1);
 assert.equal(canRecord(['read-local-cost','material-inspect','material-fit'],'assist-material'),false);
 assert.equal(canRecord(['read-local-cost','assist-material'],'test-service-route'),false);
 assert.equal(canRecord(['read-local-cost','assist-material','assist-living'],'test-service-route'),true);
 assert.equal(canRecord(['read-local-cost','assist-material','assist-living'],'material-fit'),false);
});
test('all three pairs and all four assistance combinations complete the abstract graph',()=>{
 let paths=0;for(const pair of[['material','living'],['material','observation'],['living','observation']])for(let mask=0;mask<4;mask++)for(const choice of d.choices){
  const modes=Object.fromEntries(pair.map((id,i)=>[id,mask&(1<<i)?'assisted':'authored']));
  const r=hypotheticalPath(pair,modes,choice.id);assert.equal(D.completedSupports(r.steps).length,2);assert.equal(D.configuredSupports(r.steps).length,2);
  assert.ok(d.steps.filter(s=>!s.optional).every(s=>r.steps.includes(s.id)));paths++;
 }assert.equal(paths,24);
});
test('all-three variants enrich the same graph without a larger fee or third-support gate',()=>{
 let paths=0;for(let mask=0;mask<8;mask++)for(const choice of d.choices){
  const ids=D.supportRule.distinct,modes=Object.fromEntries(ids.map((id,i)=>[id,mask&(1<<i)?'assisted':'authored']));
  const r=hypotheticalPath(ids,modes,choice.id);assert.equal(D.configuredSupports(r.steps).length,3);paths++;
 }assert.equal(paths,16);assert.equal(def('open-confluence').requiresConfiguredSupports,2);
});
test('supplied alternatives are explicit and require neither rare work nor payment',()=>{
 assert.equal(d.costs.normalInventoryCosts,false);assert.deepEqual(d.costs.accept,{});assert.deepEqual(d.costs.actions,{});assert.deepEqual(d.costs.claim,{});
 for(const s of D.supports){assert.deepEqual(def(s.assistance).requires,['read-local-cost']);assert.equal(def(s.assistance).alternativeTo,s.complete);assert.ok(s.supplied.length>30);}
 assert.match(d.summary,/disclosed supplied assistance/);assert.match(d.danger,/no deadline, material loss or hidden optional prerequisite/);
});
test('actual exhaustion, both physical feeds and central disable remain independent facts',()=>{
 const id='disable-central-link';assert.deepEqual(def(id).requires,['release-west-feed','release-east-feed','guardian-settled']);
 assert.equal(canRecord(['guardian-settled'],id),false);
 assert.equal(canRecord(['release-west-feed','release-east-feed'],id),false);
 assert.equal(canRecord(['release-west-feed','release-east-feed','guardian-settled'],id),true);
 for(const e of d.enemies){assert.equal(def(e.defeatStep).kind,'defeat');assert.match(def(e.defeatStep).text,/actual|Actual/);}
 assert.match(def('guardian-settled').text,/alone neither releases/);
});
test('physical reconfiguration of two PREPARED supports is required after accountability',()=>{
 const r=['read-local-cost','assist-material','assist-living','accountability'];
 assert.equal(canRecord(r,'configure-observation'),false);assert.equal(canRecord(r,'open-confluence'),false);
 r.push('configure-material');assert.equal(canRecord(r,'open-confluence'),false);
 r.push('configure-living');assert.equal(canRecord(r,'open-confluence'),true);
 assert.match(d.stateContract.claimed,/any two prepared AND reconfigured/);
});
test('finite version-one migration and open/account/claim facts have explicit boundaries',()=>{
 assert.equal(d.stateContract.field,'cosmosCampaign');assert.equal(d.stateContract.version,1);
 assert.match(d.stateContract.absent,/unaccepted/);assert.match(d.stateContract.opened,/exactly when open-confluence/);
 assert.match(d.stateContract.refusal,/candidate save before adopt/);assert.match(d.stateContract.claimed,/unpaid/);
 assert.match(d.stateContract.choice,/One lasting/);assert.equal(d.choices.length,2);
});
test('honest whole-payload fee is fixed, with no equipment grant or existing-curve change',()=>{
 assert.deepEqual(d.reward,{xp:50,coins:20,ore:5,materials:{wood:4,fiber:3,crystal:2}});
 assert.match(d.costs.fee,/full material\/currency payload/);assert.match(d.costs.fee,/only XP clips at 9999/);
 assert.match(d.completionText,/not a universal weapon upgrade/);assert.equal(d.reward.gear,undefined);
 assert.match(d.costs.fee,/No heal, refill, auto-equip, socket, level-curve or old-payment change/);
});
test('two prospective threat identities are distinct ordinary fixed bodies with safe retreat',()=>{
 assert.equal(d.enemies.length,2);assert.deepEqual(d.enemies.map(e=>[e.hp,e.damage,e.radius]),[[84,8,.65],[168,12,.95]]);
 assert.equal(new Set(d.enemies.map(e=>e.id)).size,2);
 for(const e of d.enemies){assert.equal(e.kind,'sentinel');assert.equal(e.anchored,true);assert.equal(e.reward,undefined);assert.ok(W.walkable(d.room,e.x,e.z,e.radius));}
 assert.match(D.patterns.rules.damage,/all live phases/);assert.match(D.patterns.rules.mobility,/hidden chase/);
});
test('both guardian attacks have distinct measurable safe regions',()=>{
 const ring=D.patterns.guardian.ring,cross=D.patterns.guardian.cross;
 assert.ok(ring.innerRadius>0&&ring.outerRadius>ring.innerRadius);assert.equal(ring.innerRadius,1.8);assert.equal(ring.outerRadius,4.6);
 assert.equal(cross.axes.length,2);assert.equal(cross.axes[1],Math.PI/2);assert.ok(cross.halfLength>cross.halfWidth);
 const bladeStandOff=1.4,playerRadius=.31;
 assert.ok(bladeStandOff>d.enemies[1].radius+playerRadius,'safe inner melee does not overlap the real declared bodies');
 assert.ok(bladeStandOff+playerRadius<ring.innerRadius,'the whole player fits inside the safe rim');
 assert.ok(4>ring.innerRadius&&4<ring.outerRadius);
 assert.ok(Math.abs(2)>cross.halfWidth&&Math.abs(2)>cross.halfWidth,'local locked-frame (2,2) is clear of both bars');
});
test('saved physical releases change future geometry rather than health/damage/timing',()=>{
 const ring=D.patterns.guardian.ring,cross=D.patterns.guardian.cross;
 assert.deepEqual(ring.afterEastRelease,{outerRadius:3.2});assert.deepEqual(cross.afterWestRelease,{axes:[0]});
 assert.ok(ring.afterEastRelease.outerRadius>ring.innerRadius&&ring.afterEastRelease.outerRadius<ring.outerRadius);
 assert.match(D.patterns.rules.frame,/subsequent frames only/);assert.match(def('release-west-feed').text,/current warning\/contact frame remains unchanged/);
});
test('prospective geometry stays within seven patches/eight STATIC solids and fixed height',()=>{
 assert.equal(g.patches.length,7);assert.equal(g.solids.length,8);assert.ok(g.patches.length<=8&&g.solids.length<=18);assert.equal(g.dynamicCollision,false);
 for(const p of g.patches)assert.equal(p.y,4.77);
 assert.equal(new Set(N.PATCHES.map(p=>p.id)).size,N.PATCHES.length);
 assert.equal(new Set(solids.map(p=>p.id)).size,solids.length);
 for(const s of g.solids){assert.ok(s.w>0&&s.d>0&&s.h>0);assert.equal(s.presentUntil,undefined);}
 assert.match(g.neutralTravel,/always supported\/open/);
});
test('extension meets the actual east service edge without a height seam',()=>{
 assert.ok(Math.abs(N.height(g.connection.x,g.connection.z)-g.height)<1e-12,'ordinary floating rounding does not create a geometric height seam');assert.equal(N.walkable(g.connection.x,g.connection.z,.31),true);
 clearRoute([{x:12,z:-40},g.connection,{x:18,z:-40},{x:22,z:-40}],.95);
 for(const p of g.patches){const minX=p.x-p.w/2,minZ=p.z-p.d/2,maxZ=p.z+p.d/2;
  if(minX<=14&&maxZ>=-53&&minZ<=-33)assert.ok(maxZ<=-32,'old slope only meets fixed slabs where it is already level');}
});
test('every declared whole route passes actual production W.segment and independent continuous support',()=>{
 for(const route of g.routes)clearRoute(route.points,route.radius);
});
test('all action/witness anchors fit whole bodies and every new action is connected to its service route',()=>{
 for(const s of d.steps){assert.equal(W.walkable(d.room,s.x,s.z,.31),true,s.id);assert.equal(wholeCapsuleSupported(s,s,.31),true,s.id);}
 for(const w of d.witnesses){assert.ok(W.walkable(d.room,w.x,w.z,.45));assert.ok(wholeCapsuleSupported(w,w,.45));assert.equal(N.POINTS.some(p=>p.id===w.id),false);}
 const endpoints=new Set(g.routes.flatMap(r=>r.points.map(p=>p.x+','+p.z)));
 for(const s of d.steps)assert.ok(endpoints.has(s.x+','+s.z)||s.id==='read-local-cost'||s.id==='challenge-reclaimer'||s.id==='accountability',s.id+' must be covered by the declared route endpoints');
 clearRoute([{x:30,z:-40},{x:33,z:-40},{x:36,z:-40}],.31);
 clearRoute([{x:47,z:-34},{x:45,z:-34},{x:45,z:-35}],.45);
});
test('full anchored ring/cross envelopes remain on the prospective arena floor at every yaw',()=>{
 const e=d.enemies[1],ring=D.patterns.guardian.ring,cross=D.patterns.guardian.cross;
 assert.ok(wholeCapsuleSupported(e,e,ring.outerRadius+.31));
 for(let i=0;i<64;i++)for(const axis of cross.axes){const yaw=i*Math.PI/32+axis,s=Math.sin(yaw),c=Math.cos(yaw);
  for(const end of[-cross.halfLength,cross.halfLength])for(const side of[-cross.halfWidth,cross.halfWidth]){
   const p={x:e.x+s*end+c*side,z:e.z+c*end-s*side};assert.ok(W.land(d.room,p.x,p.z,.31));
  }
 }
});
test('whole-body check rejects a genuine narrow gap despite supported endpoints',()=>{
 const p=[{x:-1,z:0,w:1.8,d:4},{x:1,z:0,w:1.8,d:4}],a={x:-1,z:0},b={x:1,z:0};
 assert.ok(p.some(r=>inside(a,r))&&p.some(r=>inside(b,r)));
 assert.equal(wholeCapsuleSupported(a,b,.31,p),false);
 assert.equal(wholeCapsuleSupported(a,b,.31,[{x:0,z:0,w:4,d:4}]),true);
});
test('byte-pinned original geometry lacks the extension; actual installed support supplies it',()=>{
 assert.equal(O.walkable(54,-44,.95),false);assert.notEqual(O.height(26,-27),g.height);
 assert.equal(O.PATCHES.some(p=>p.id==='confluence-guardian-court'),false);assert.equal(N.walkable(54,-44,.95),true);assert.equal(N.height(26,-27),g.height);
 assert.match(g.status,/prospective/);assert.match(d.scope,/provisional/);
});
test('byte-frozen attribution retains exact recovered-proposal anchors and bounded public/private scope',()=>{
 assert.equal(D.sources.filter(s=>s.status==='recovered-proposed-fiction').length,2);
 assert.deepEqual(D.sources.map(s=>[s.path,s.anchors]),[
  ['design/03_CAMPAIGN_AND_CHARACTERS.md',['2. Avar Senn and the Still Meridian','7. Movement Five — The Still Crown','8. Movement Six — The Open Confluence']],
  ['design/06_QUEST_AND_EVENT_ATLAS.md',['CT37','CT39','CT40']],
  ['src/cosmos.js',['ROOM','PATCHES','SOLIDS','POINTS','height','segment','pick']],
  ['src/world-foundations.js',['definitions','height','land','walkable','segment']],
  ['src/realm-trails-cosmos.js',['cosmos-split-bearing-v1','service-arm']],
  ['src/local-life.js',['cosmos-drawing-shelf-v1']]
 ]);
 assert.match(d.scope,/CT38/);assert.match(d.scope,/not implemented here/);
 for(const c of d.choices){assert.match(c.text,/public|Public/);assert.ok(c.recognition.some(r=>r.name==='Avar Senn'));}
});

test('all installed/preimage input bytes stay untouched after catalogue/support checks',()=>{
 assert.deepEqual(Object.fromEntries(inputs.map(p=>[p,sha(p)])),epoch);
 console.log('READ_ONLY_SOURCE_EPOCH_FILES '+inputs.length);
});
