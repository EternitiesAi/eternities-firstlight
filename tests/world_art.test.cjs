/* Production geometry submission checks. No screenshot or GPU claims. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/world-foundations.js'),E=require('../src/engine.js');
require('../src/coastward-settlement-art.js');
require('../src/coastward-woodland-art.js');
require('../src/earth-grazer-motion.js');require('../src/earth-grazer-habitat-art.js');
const Art=require('../src/world-foundations-art.js');
const KINDS=new Set(['box','timber-panel','bridge-vault','bank-slope','coast-bank','mountain-ridge','round','ring','roof','leaf','octa','cone','disc','cylinder']);
function submission(id){const d=W.definition(id),items=[],writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,depth,color,opt={}){items.push({kind,p:[x,y,z],s:[w,h,depth],color,...opt});},box(x,y,z,w,h,depth,color,opt){this.add('box',x,y,z,w,h,depth,color,opt);}},sim=new C.Simulation();sim.room=d.room;sim.state.player={...d.entry};Art.make(writer,sim);return{d,items,writer};}
function bounds(it){const m=E.M.compose(...it.p,...it.s,...(it.r||[0,0,0])),mesh=E.geometry(it.kind),stride=it.kind==='timber-panel'?8:6,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.length;i+=stride){const p=E.M.transform(m,[mesh[i],mesh[i+1],mesh[i+2]]);for(let j=0;j<3;j++){min[j]=Math.min(min[j],p[j]);max[j]=Math.max(max[j],p[j]);}}return{min,max};}
test('all new static scenery uses supported finite meshes instead of silent cylinder fallback',()=>{for(const id of W.IDS.filter(id=>id!=='cosmos')){const {items}=submission(id);assert.ok(items.length>40&&items.length<4000,'bounded original scene');for(const it of items){assert.ok(KINDS.has(it.kind),id+' unknown mesh '+it.kind);assert.ok([...it.p,...it.s].every(Number.isFinite));assert.ok(it.s.every(n=>n>0));assert.ok([...E.geometry(it.kind)].every(Number.isFinite));}}});
test('visible solid boxes match canonical body collision footprints and heights',()=>{for(const id of W.IDS.filter(id=>id!=='cosmos')){const {d,items}=submission(id);for(const p of [...d.solids,...(d.dive?.solids||[])]){const boxes=items.filter(it=>it.worldSolid&&it.worldSolidId===p.id);assert.equal(boxes.length,1,p.id+' one authoritative visible solid');const it=boxes[0],base=p.y??W.height(d.room,p.x,p.z);assert.deepEqual(it.p,[p.x,base+p.h/2,p.z]);assert.deepEqual(it.s,[p.w,p.h,p.d]);assert.equal(it.cameraSolid,true);}}});
test('submitted opaque geometry leaves the actual 3D gallery body route clear',()=>{const {d,items}=submission('atlantis'),path=d.dive.routes[0].points,near=items.map(it=>({...it,b:bounds(it)})).filter(it=>it.b.max[0]>=3&&it.b.min[0]<=13&&it.b.max[2]>=-41&&it.b.min[2]<=-18&&it.b.max[1]>-2.7+.061&&it.b.min[1]<1.45-.061);for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(...a.map((v,j)=>b[j]-v))*20);for(let k=0;k<=n;k++){const p=a.map((v,j)=>v+(b[j]-v)*k/n);assert.ok(W.swimClear(d.dive,p[0],p[1],p[2]),'canonical 3D route body fits');for(const it of near){const q=it.b,overlap=q.min[0]<p[0]+.31&&q.max[0]>p[0]-.31&&q.min[2]<p[2]+.31&&q.max[2]>p[2]-.31&&q.min[1]<p[1]+1.7-.061&&q.max[1]>p[1]+.061;assert.equal(overlap,false,'opaque '+it.kind+' at '+it.p+' intrudes above cosmetic surface tolerance at '+p);}}}});
test('wet volume under the civic deck retains actual head clearance',()=>{const {items,d}=submission('atlantis'),upper=items.filter(it=>it.worldGround&&it.p[0]>=3&&it.p[0]<=13&&it.p[2]>=-40&&it.p[2]<=-18);assert.ok(upper.length>0);for(const it of upper)assert.ok(it.p[1]-it.s[1]/2>d.dive.maxY+1.7,'deck underside clears the highest permitted body');});

test('only the two exact Atlantis shelter roofs receive preference-controlled roof reveal',()=>{
 const {items,d}=submission('atlantis'),roofs=items.filter(it=>it.worldRoof);
 assert.equal(roofs.length,2);assert.deepEqual(roofs.map(p=>p.worldRoof).sort(),['atlantis-air-court','farwake-civic-canopy']);const roof=roofs.find(p=>p.worldRoof==='atlantis-air-court'),solid=d.dive.solids.find(p=>p.id==='bellglass-ceiling');
 assert.equal(roof.worldRoof,'atlantis-air-court');assert.equal(roof.worldSolidId,solid.id);
 assert.equal(roof.worldSolid,true);assert.equal(roof.cameraSolid,true);assert.equal(roof.cutaway,true);
 assert.deepEqual(roof.p,[solid.x,solid.y+solid.h/2,solid.z]);assert.deepEqual(roof.s,[solid.w,solid.h,solid.d]);
 const canopy=roofs.find(p=>p.worldRoof==='farwake-civic-canopy');assert.equal(canopy.structureId,'farwake-civic-canopy');assert.equal(canopy.cutaway,true);assert.equal(canopy.cameraSolid,false);assert.deepEqual(canopy.p,[0,W.height(d.room,0,-12)+4.1,-12]);assert.deepEqual(canopy.s,[27,.2,19.7]);
 for(const id of ['earthlands','heaven'])assert.equal(submission(id).items.some(it=>it.worldRoof),false);
});
