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
