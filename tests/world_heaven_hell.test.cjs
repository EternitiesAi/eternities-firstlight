'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {realms,decorate}=require('../src/world-heaven-hell.js');
const Engine=require('../src/engine.js');
const FLOOR=1.57,RADIUS=.7;
const inside=(p,x,z,r=0)=>Math.abs(x-p.x)<=p.w/2-r&&Math.abs(z-p.z)<=p.d/2-r;
const grounded=(def,x,z,r=0)=>def.patches.some(p=>inside(p,x,z,r));
const blocked=(def,x,z,r=RADIUS)=>def.solids.some(s=>Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r);
const clear=(def,x,z,r=RADIUS)=>grounded(def,x,z,r)&&!blocked(def,x,z,r);
function seeded(seed){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function scene(def,extra={}){
 const all=[],art={add(kind,x,y,z,sx,sy,sz,c,opt={}){all.push({kind,p:[x,y,z],s:[sx,sy,sz],c,...opt});},begin(){assert.fail('decorate cannot own scene begin');},commit(){assert.fail('decorate cannot own scene commit');}};
 const report=decorate(art,def,{height:()=>FLOOR,rng:seeded(7719),...extra});return{all,report};
}
function actualVertices(part){
 const mesh=Engine.geometry(part.kind),matrix=Engine.M.compose(...part.p,...part.s,...(part.r||[0,0,0])),out=[];
 for(let i=0;i<mesh.length;i+=6)out.push(Engine.M.transform(matrix,Array.from(mesh.slice(i,i+3))));
 return out;
}
function sampleSegment(def,a,b,r=RADIUS){const len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let i=0;i<=Math.ceil(len/.12);i++){const t=i/Math.max(1,Math.ceil(len/.12)),x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;assert.ok(clear(def,x,z,r),`${def.id}: blocked route at ${x.toFixed(3)},${z.toFixed(3)}`);}}
function flood(def,ignoreEnemies=true){
 const b=def.bounds,step=1,minX=Math.ceil(b.minX+RADIUS),maxX=Math.floor(b.maxX-RADIUS),minZ=Math.ceil(b.minZ+RADIUS),maxZ=Math.floor(b.maxZ-RADIUS),key=(x,z)=>x+','+z,visited=new Set(),queue=[];
 function legal(x,z){return x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ&&clear(def,x,z)&& (ignoreEnemies||!(def.enemies||[]).some(e=>Math.hypot(x-e.x,z-e.z)<11));}
 const sx=Math.round(def.entry.x),sz=Math.round(def.entry.z);assert.ok(legal(sx,sz));queue.push([sx,sz]);visited.add(key(sx,sz));
 for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz]of[[step,0],[-step,0],[0,step],[0,-step]]){const xx=x+dx,zz=z+dz,k=key(xx,zz);if(!visited.has(k)&&legal(xx,zz)&&clear(def,(x+xx)/2,(z+zz)/2)){visited.add(k);queue.push([xx,zz]);}}}
 return{visited,key};
}
for(const def of realms){
 test(def.id+': stable contract, finite geometry, pure bounded quest and readable anchors',()=>{
  assert.equal(def.room,'world-'+def.id);assert.equal(def.theme,'cosmos');assert.equal(def.water,false);assert.ok(def.name&&def.description&&def.kicker.includes('provisional'));
  assert.ok(Object.isFrozen(def)&&Object.isFrozen(def.solids)&&Object.isFrozen(def.quest.objectives));
  const ids=[...def.patches,...def.solids,...def.points,...(def.enemies||[])].map(p=>p.id);assert.equal(new Set(ids).size,ids.length);
  for(const p of def.patches){assert.ok([p.x,p.z,p.w,p.d,p.y].every(Number.isFinite));assert.ok(p.w>0&&p.d>0);assert.equal(p.y,FLOOR);assert.ok(p.x-p.w/2>=def.bounds.minX&&p.x+p.w/2<=def.bounds.maxX&&p.z-p.d/2>=def.bounds.minZ&&p.z+p.d/2<=def.bounds.maxZ);}
  for(const s of def.solids){assert.ok([s.x,s.z,s.w,s.d,s.h].every(Number.isFinite));assert.ok(s.w>0&&s.d>0&&s.h>0);assert.ok(Number.isInteger(s.color)&&s.color>=0&&s.color<=0xffffff);for(const x of[s.x-s.w/2,s.x+s.w/2])for(const z of[s.z-s.d/2,s.z+s.d/2])assert.ok(grounded(def,x,z),'solid footprint must have supporting land: '+s.id);}
  for(const p of def.points){assert.ok([p.x,p.z].every(Number.isFinite));assert.ok(['return','person','objective','view'].includes(p.kind));assert.ok(p.name&&p.text&&p.detail);assert.ok(clear(def,p.x,p.z),'blocked interaction anchor: '+p.id);}
  assert.ok(clear(def,def.entry.x,def.entry.z));assert.equal(def.points.filter(p=>p.kind==='return').length,1);
  assert.equal(def.quest.id,def.id+'-opening-v1');assert.deepEqual(def.quest.objectives.map(o=>o.id),['first','second','third']);
  assert.equal(def.points.find(p=>p.id===def.quest.giverId)?.kind,'person');
  for(const o of def.quest.objectives){assert.equal(o.kind,'interact');assert.equal(def.points.find(p=>p.id===o.pointId)?.kind,'objective');assert.ok(o.text);}
  for(const key of['xp','coins','ore'])assert.ok(Number.isSafeInteger(def.quest.reward[key])&&def.quest.reward[key]>=0&&def.quest.reward[key]<=30);
  assert.ok(def.quest.completionText);assert.ok(def.bounds.maxX-def.bounds.minX>=100&&def.bounds.maxZ-def.bounds.minZ===160);
 });
 test(def.id+': connected physical ground gives every point and enemy a body-width approach and return',()=>{
  const f=flood(def);for(const p of[...def.points,...(def.enemies||[])]){assert.ok(f.visited.has(f.key(Math.round(p.x),Math.round(p.z))),'unreachable physical anchor: '+p.id);}
  // Sample every supported cell, not just the declared endpoints. This catches
  // disconnected patches or a sealed region even if all named points are south.
  const b=def.bounds;for(let z=Math.ceil(b.minZ+1);z<b.maxZ;z++)for(let x=Math.ceil(b.minX+1);x<b.maxX;x++)if(clear(def,x,z))assert.ok(f.visited.has(f.key(x,z)),`${def.id}: isolated supported cell ${x},${z}`);
 });
 test(def.id+': submitted original art has finite transforms, matched cover, and a modest local instance/triangle budget',()=>{
  const s=scene(def);assert.equal(s.report.instances,s.all.length);assert.equal(s.report.localInstances+s.report.distantInstances,s.all.length);
  assert.ok(s.report.localInstances+def.solids.length+def.patches.length<1500);assert.ok(s.report.distantInstances<150);
  let triangles=0;for(const p of s.all){assert.ok([...p.p,...p.s,...(p.r||[])].every(Number.isFinite));assert.ok(p.s.every(v=>v>0));assert.equal(p.cameraSolid,false,'shared physical boxes retain camera ownership');
   const mesh=Engine.geometry(p.kind);assert.ok(mesh.length>0);if(!p.skyImage)triangles+=mesh.length/18;
   if(p.foliage||p.skyImage)assert.equal(p.cutaway,false);
   if(p.worldSolidId){const c=def.solids.find(s=>s.id===p.worldSolidId);assert.ok(c);assert.ok(Math.abs(p.p[0]-c.x)+p.s[0]/2<=c.w/2+.025+1e-6,'dress overstates physical width beyond the declared cosmetic margin: '+c.id);assert.ok(Math.abs(p.p[2]-c.z)+p.s[2]/2<=c.d/2+.025+1e-6,'dress overstates physical depth beyond the declared cosmetic margin: '+c.id);assert.ok(p.p[1]-p.s[1]/2>=FLOOR-1e-6&&p.p[1]+p.s[1]/2<=FLOOR+c.h+.025+1e-6);}
   if(p.paving){assert.ok(clear(def,p.p[0],p.p[2],1.4));assert.ok(Math.abs(p.p[1]-FLOOR-.014)<1e-6);assert.equal(p.s[1],.025);const matrix=Engine.M.compose(...p.p,...p.s,...(p.r||[0,0,0]));for(let i=0;i<mesh.length;i+=6){const v=Engine.M.transform(matrix,Array.from(mesh.slice(i,i+3)));assert.ok(grounded(def,v[0],v[2]),'paving implies unsupported walking ground');assert.ok(!blocked(def,v[0],v[2],0),'paving penetrates physical scenery');}}
   if(p.overhead){const matrix=Engine.M.compose(...p.p,...p.s,...(p.r||[0,0,0]));let bottom=Infinity;for(let i=0;i<mesh.length;i+=6)bottom=Math.min(bottom,Engine.M.transform(matrix,Array.from(mesh.slice(i,i+3)))[1]);assert.ok(bottom>FLOOR+3.9,'actual authored roof/lintel intrudes into the body corridor');}
   if(p.skyImage)assert.ok(p.p[2]<def.bounds.minZ-25,'vista masquerades as an advertised nearby destination');
  }
  assert.ok(triangles<45000,`${def.id}: ${triangles} local triangles`);
  const ids=s.all.filter(p=>p.markerId).map(p=>p.markerId);assert.deepEqual(ids,def.points.map(p=>p.id));
 });
 test(def.id+': decorating is deterministic, owns no scene lifecycle and leaves all source/simulation/inventory state unchanged',()=>{
  const sim={room:def.room,state:{player:{x:0,z:27},journeys:{version:1,realms:{[def.id]:{firstClaimed:false}}},adventure:{xp:219,coins:17,ore:4,owned:{weapon:'sentinel'},classPath:{selected:'hunter'},inventory:{gem:'ruby'}}}},before=structuredClone(sim),data=JSON.stringify(def);
  const a=scene(def,{sim});assert.deepEqual(sim,before);assert.equal(JSON.stringify(def),data);assert.deepEqual(scene(def,{sim}).all,a.all);
  assert.equal(a.all.filter(p=>p.surveyRecord).length,0);const claimed=structuredClone(sim);claimed.state.journeys.realms[def.id].firstClaimed=true;const old=structuredClone(claimed),b=scene(def,{sim:claimed});assert.deepEqual(claimed,old);assert.equal(b.all.filter(p=>p.surveyRecord).length,1);assert.deepEqual(b.all.filter(p=>!p.surveyRecord),a.all);
  assert.equal(a.all.filter(p=>p.actor||p.person||p.npc).length,0,'canonical person bodies belong to shared dynamic art');
 });
 test(def.id+': height supplied by the world caller shifts all local structures, routes and markers coherently',()=>{
  const a=scene(def).all.filter(p=>!p.skyImage),b=scene(def,{height:()=>FLOOR+2}).all.filter(p=>!p.skyImage);assert.equal(a.length,b.length);for(let i=0;i<a.length;i++){assert.ok(Math.abs(b[i].p[1]-a[i].p[1]-2)<1e-6);assert.deepEqual(b[i].p.filter((_,j)=>j!==1),a[i].p.filter((_,j)=>j!==1));assert.deepEqual(b[i].s,a[i].s);}
 });
}
test('Heaven: both actual causeway/arcade loops fit a traveller without stepping through instrument, columns or workshop',()=>{
 const def=realms[0],lines=[[[0,31],[0,17],[6,2],[6,-13],[0,-20],[0,-79],[0,-99]],[[-14,5],[-24,5],[-35,-10],[-35,-52],[-24,-76],[0,-89]]];
 for(const line of lines)for(let i=1;i<line.length;i++)sampleSegment(def,line[i-1],line[i]);assert.equal((def.enemies||[]).length,0);
});
test('Heaven: distinct narrow route inlays sit on supported paving and the fork remains flat and clear',()=>{
 const def=realms[0],all=scene(def).all,inlays=all.filter(p=>p.routeInlay),fork=all.filter(p=>p.routeFork),colors=new Map([['ruby-arcade',0x8f1538],['mirror-causeway',0x88b6c5]]);
 sampleSegment(def,[0,17],[-14,5]);
 for(const tag of colors.keys())assert.ok(inlays.filter(p=>p.routeInlay===tag).length>20,'readable route extent: '+tag);
 assert.deepEqual(fork.map(p=>p.routeFork),['ruby-arcade','mirror-causeway']);
 for(const p of [...inlays,...fork]){
  assert.equal(p.kind,'box');assert.equal(p.c,colors.get(p.routeInlay||p.routeFork));assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);
  assert.ok(p.s[0]<=.32,'modest narrow route accent');
  assert.ok(p.p[1]-p.s[1]/2>=FLOOR+.0265-1e-6&&p.p[1]+p.s[1]/2<=FLOOR+.04+1e-6,'cosmetic top stays within ground +.04');
  if(p.routeInlay){const backing=all.find(tile=>tile.paving&&tile.p[0]===p.p[0]&&tile.p[2]===p.p[2]&&JSON.stringify(tile.r)===JSON.stringify(p.r));assert.ok(backing,'inlay has native paving beneath it');assert.ok(p.s[0]<backing.s[0]&&p.s[2]<backing.s[2]);assert.ok(Math.abs(p.p[1]-p.s[1]/2-backing.p[1]-backing.s[1]/2)<1e-6);}
  const mesh=Engine.geometry(p.kind),matrix=Engine.M.compose(...p.p,...p.s,...(p.r||[0,0,0]));
  for(let i=0;i<mesh.length;i+=6){const v=Engine.M.transform(matrix,Array.from(mesh.slice(i,i+3)));assert.ok(grounded(def,v[0],v[2]),'route accent has native supported ground');assert.ok(!blocked(def,v[0],v[2],.31),'route accent avoids solid body intrusion');
   if(p.routeFork)assert.ok(all.some(tile=>{if(!tile.paving)return false;const angle=tile.r?.[1]||0,dx=v[0]-tile.p[0],dz=v[2]-tile.p[2],c=Math.cos(angle),s=Math.sin(angle);return Math.abs(c*dx-s*dz)<=tile.s[0]/2+1e-6&&Math.abs(s*dx+c*dz)<=tile.s[2]/2+1e-6;}),'fork chip has native paving beneath its whole footprint');
  }
 }
});
test('Heaven: the cultivated Ruby-fork band has actual native support and leaves routes, solids and interaction approaches clear',()=>{
 const def=realms[0],band=scene(def).all.filter(p=>p.gardenBand),beds=band.filter(p=>p.gardenPart==='soil');
 assert.equal(beds.length,3);assert.equal(band.length,207);assert.equal(band.filter(p=>p.gardenPart==='rim').length,12);
 const lines=[[[0,31],[0,17],[6,2],[6,-13],[0,-20],[0,-79],[0,-99]],[[0,17],[-14,5],[-24,5],[-35,-10],[-35,-52],[-24,-76],[0,-89]],[[0,17],[25,5],[29,-26],[27,-66],[0,-89]]];
 const routeDistance=(x,z)=>Math.min(...lines.flatMap(line=>line.slice(1).map((b,i)=>{const a=line[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);})));
 for(const p of band){
  assert.equal(p.gardenBand,'ruby-fork');assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.wind,0);
  assert.equal(p.worldSolidId,undefined);assert.equal(p.markerId,undefined);assert.equal(p.overhead,undefined);assert.equal(p.skyImage,undefined);
  assert.ok(['box','cylinder','leaf','octa'].includes(p.kind),'known production geometry kind');
  for(const v of actualVertices(p)){
   assert.ok(v.every(Number.isFinite));assert.ok(grounded(def,v[0],v[2]),'every actual vertex rests above native ground');
   assert.ok(!blocked(def,v[0],v[2],RADIUS),'botanical band retains body-width separation from existing solids');
   assert.ok(v[1]>=FLOOR-1e-6&&v[1]<=FLOOR+.46,'flowers remain low, rooted ground detail');
   assert.ok(routeDistance(v[0],v[2])>=1.9,'actual decorative footprint clears the 1.2-unit paving half-width plus .7-unit body corridor');
   for(const point of def.points)assert.ok(Math.hypot(v[0]-point.x,v[2]-point.z)>=3,'public interaction approach remains open: '+point.id);
  }
 }
 for(const bed of beds){const vs=actualVertices(bed);assert.ok(Math.abs(Math.min(...vs.map(v=>v[1]))-FLOOR)<1e-6,'soil base touches actual ground');assert.ok(Math.abs(Math.max(...vs.map(v=>v[1]))-FLOOR-.018)<1e-6);}
 for(const rim of band.filter(p=>p.gardenPart==='rim')){
  const bed=beds.find(p=>p.gardenBed===rim.gardenBed),yaw=bed.r[1],c=Math.cos(yaw),s=Math.sin(yaw);
  for(const v of actualVertices(rim)){const dx=v[0]-bed.p[0],dz=v[2]-bed.p[2];assert.ok(Math.abs(c*dx-s*dz)<=bed.s[0]/2+1e-6&&Math.abs(s*dx+c*dz)<=bed.s[2]/2+1e-6,'every edging vertex stays over its soil backing');assert.ok(v[1]<=FLOOR+.04);}
  assert.ok(rim.p[1]-rim.s[1]/2<FLOOR+.018,'edging overlaps soil instead of floating above it');
 }
});

test('Heaven: all low blossoms attach to rooted stems and fit their shallow planting beds',()=>{
 const band=scene(realms[0]).all.filter(p=>p.gardenBand),beds=band.filter(p=>p.gardenPart==='soil'),stems=band.filter(p=>p.gardenPart==='stem');
 assert.equal(stems.length,24);assert.equal(new Set(stems.map(p=>p.gardenPlant)).size,24);
 assert.equal(new Set(band.filter(p=>p.gardenPart==='petal').map(p=>p.c)).size,3,'sage garden has pale, straw and muted ruby blossoms');
 for(const stem of stems){
  const parts=band.filter(p=>p.gardenPlant===stem.gardenPlant),bed=beds.find(p=>p.gardenBed===stem.gardenBed),yaw=bed.r[1],c=Math.cos(yaw),s=Math.sin(yaw);
  assert.equal(parts.length,8);assert.equal(parts.filter(p=>p.gardenPart==='leaf').length,2);assert.equal(parts.filter(p=>p.gardenPart==='petal').length,4);assert.equal(parts.filter(p=>p.gardenPart==='heart').length,1);
  assert.ok(Math.abs(stem.p[1]-FLOOR-.018)<1e-6,'stem root touches soil surface');
  const top=stem.p[1]+stem.s[1];
  for(const part of parts){
   assert.equal(part.foliage,true);assert.equal(part.p[0],stem.p[0]);assert.equal(part.p[2],stem.p[2],'leaf/petal origins join their stem');
   if(['petal','heart'].includes(part.gardenPart))assert.equal(part.p[1],top,'bloom joins the stem tip');
   for(const v of actualVertices(part)){const dx=v[0]-bed.p[0],dz=v[2]-bed.p[2];assert.ok(Math.abs(c*dx-s*dz)<=bed.s[0]/2+1e-6&&Math.abs(s*dx+c*dz)<=bed.s[2]/2+1e-6,'actual foliage footprint has soil beneath it');assert.ok(v[1]>=FLOOR+.018-1e-6);}
  }
 }
});

test('Heaven: cultivated detail has a bounded geometry cost and is identical with reduced motion enabled',()=>{
 const sim={state:{settings:{reducedMotion:false},journeys:{realms:{heaven:{firstClaimed:false}}}}},before=structuredClone(sim),all=scene(realms[0],{sim}).all,band=all.filter(p=>p.gardenBand);
 assert.deepEqual(sim,before);const quiet=structuredClone(sim);quiet.state.settings.reducedMotion=true;
 assert.deepEqual(scene(realms[0],{sim:quiet}).all.filter(p=>p.gardenBand),band);
 assert.ok(band.length<=220);assert.equal(band.reduce((sum,p)=>sum+Engine.geometry(p.kind).length/18,0),2196);
 assert.equal(scene(realms[1]).all.some(p=>p.gardenBand),false,'Hell decoration is outside this polish scope');
});

test('Hell: only the existing Refuge roof slab and patched ribs carry the bounded reveal tag',()=>{
 const tagged=scene(realms[1]).all.filter(p=>p.worldRoof);
 assert.equal(tagged.length,7,'existing slab plus six roof ribs');assert.equal(tagged.filter(p=>p.s[0]===24&&p.s[2]===19).length,1,'complete roof remains authored');
 assert.equal(scene(realms[0]).all.some(p=>p.worldRoof),false);
 for(const p of tagged){
  assert.equal(p.worldRoof,'hell-refuge');assert.equal(p.kind,'box');assert.equal(p.overhead,true);assert.equal(p.cutaway,true);assert.equal(p.cameraSolid,false);assert.equal(p.skyImage,undefined);assert.equal(p.worldSolidId,undefined);
  const mesh=Engine.geometry(p.kind),matrix=Engine.M.compose(...p.p,...p.s,...(p.r||[0,0,0]));
  for(let i=0;i<mesh.length;i+=6){const v=Engine.M.transform(matrix,Array.from(mesh.slice(i,i+3)));assert.ok(v[0]>=-22-1e-6&&v[0]<=2+1e-6&&v[2]>=9.5-1e-6&&v[2]<=28.5+1e-6,'tag never escapes the shelter roof footprint');assert.ok(v[1]>=FLOOR+4.2-1e-6&&v[1]<=FLOOR+4.65+1e-6,'tag denotes actual overhead roof surfaces');}
 }
});
test('Hell: distinct east/west approaches and the free home path avoid the optional sentinel even within an eleven-unit threat pocket',()=>{
 const def=realms[1],lines=[[[0,35],[0,24],[14,9],[24,-4],[24,-35],[20,-38],[20,-53],[24,-65],[16,-80],[-12,-95]],[[0,24],[-10,24],[-10,32],[-29,32],[-31,4],[-31,-15],[-27,-37],[-27,-54],[-31,-70],[-31,-82],[-15,-82],[-12,-95]]];
 for(const line of lines)for(let i=1;i<line.length;i++)sampleSegment(def,line[i-1],line[i]);
 const safe=flood(def,false);for(const p of def.points.filter(p=>p.id!=='hell-watch-pocket'))assert.ok(safe.visited.has(safe.key(Math.round(p.x),Math.round(p.z))));
 assert.equal(def.enemies.length,1);const e=def.enemies[0];assert.equal(e.kind,'sentinel');assert.ok(clear(def,e.x,e.z));assert.equal(e.xp+e.ore+e.coins,0);assert.ok(e.hp>0&&e.damage>0);assert.ok(Math.hypot(e.x-def.points[1].x,e.z-def.points[1].z)>100);
 sampleSegment(def,[30,-93],[44,-104]);sampleSegment(def,[44,-104],[44,-94]);
});
test('Module exposes the browser/CommonJS contract and rejects unknown decoration without touching the caller',()=>{
 assert.equal(globalThis.RealmWorldHeavenHell.realms,realms);assert.equal(globalThis.RealmWorldHeavenHell.decorate,decorate);
 assert.deepEqual(decorate({add(){assert.fail('unknown realm adds no art');}},{id:'unknown'}),{realmId:null,instances:0,distantInstances:0});
});
