/* Actual canonical/Core/mesh CPU regressions. Movement worlds and map/authoring
 * adapters are synthetic fixtures; this does not admit native progress or pixels. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const C=require('../src/core.js'),W=require('../src/world-foundations.js'),E=require('../src/engine.js');
require('../src/coastward-settlement-art.js');require('../src/coastward-woodland-art.js');
require('../src/earth-grazer-motion.js');require('../src/earth-grazer-habitat-art.js');
require('../src/earth-road.js');require('../src/earth-road-art.js');
const Art=require('../src/world-foundations-art.js');require('../src/world-foundations-ui.js');
const UI=globalThis.RealmWorldFoundationsUI,d=W.definition('earthlands'),room=d.room,p=d.patches.find(p=>p.id==='shore-overlook');
const plain=v=>JSON.parse(JSON.stringify(v)),sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const outline=[[22,-28],[30,-30],[38,-30],[40,-28],[41,-20],[40,-12],[38,-10],[30,-10],[22,-12]],corners=[[22,-28],[38,-28],[38,-12],[22,-12]];
const oldInside=(x,z,q,r=0)=>Math.abs(x-q.x)<=q.w/2-r&&Math.abs(z-q.z)<=q.d/2-r;
const offsets=r=>[[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]];
const oldLand=(x,z,r=0)=>offsets(r).every(([dx,dz])=>d.patches.some(q=>oldInside(x+dx,z+dz,q)));
const area=v=>Math.abs(v.reduce((n,a,i)=>{const b=v[(i+1)%v.length];return n+a[0]*b[1]-b[0]*a[1];},0))/2;
// Independent odd/even ray oracle, not the production convex half-plane branch.
function polygon(x,z,v){let yes=false;for(let i=0,j=v.length-1;i<v.length;j=i++){const a=v[j],b=v[i],dx=b[0]-a[0],dz=b[1]-a[1],n=dx*dx+dz*dz,t=n?((x-a[0])*dx+(z-a[1])*dz)/n:-1;if(t>=0&&t<=1&&Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<1e-9)return true;if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function clipped(v,q){let a=v.map(p=>p.slice());for(const [axis,bound,greater]of [[0,q.x-q.w/2,true],[0,q.x+q.w/2,false],[1,q.z-q.d/2,true],[1,q.z+q.d/2,false]]){const b=[];for(let i=0;i<a.length;i++){const u=a[i],v=a[(i+1)%a.length],iu=greater?u[axis]>=bound:u[axis]<=bound,iv=greater?v[axis]>=bound:v[axis]<=bound;if(iu)b.push(u);if(iu!==iv){const t=(bound-u[axis])/(v[axis]-u[axis]);b.push(u.map((n,j)=>n+t*(v[j]-n)));}}a=b;}return a;}
function mesh(d,triangles,lo,hi){assert.equal(d.length,triangles*18);const edges=new Map(),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],tops=[];let volume=0;const key=p=>p.map(n=>Object.is(n,-0)?0:n).join(',');for(let i=0;i<d.length;i+=18){const ps=[0,6,12].map(j=>Array.from(d.slice(i+j,i+j+3))),n=Array.from(d.slice(i+3,i+6)),cross=E.cross(E.sub(ps[1],ps[0]),E.sub(ps[2],ps[0]));assert.ok([...ps.flat(),...n].every(Number.isFinite));assert.ok(Math.hypot(...cross)>1e-6);assert.ok(Math.abs(Math.hypot(...n)-1)<2e-6);assert.ok(E.dot(cross,n)>0);volume+=E.dot(ps[0],E.cross(ps[1],ps[2]))/6;for(const v of ps)for(let j=0;j<3;j++){min[j]=Math.min(min[j],v[j]);max[j]=Math.max(max[j],v[j]);}for(let j=0;j<3;j++){const a=key(ps[j]),b=key(ps[(j+1)%3]),k=[a,b].sort().join('|'),e=edges.get(k)||{count:0,orientation:0};e.count++;e.orientation+=a<b?1:-1;edges.set(k,e);}if(ps.every(v=>v[1]===Math.fround(p.y))){assert.ok(n[1]>.99);tops.push(ps.map(v=>[v[0],v[2]]));}}
 assert.deepEqual(min,lo.map(Math.fround));assert.deepEqual(max,hi.map(Math.fround));assert.ok(volume>0);for(const e of edges.values()){assert.equal(e.count,2);assert.equal(e.orientation,0);}return{tops,volume};}
test('one canonical convex shoreline continuously contains the old rectangle and preserves every other authority',()=>{
 assert.deepEqual(p.footprint,outline);const original=plain(d);delete original.patches.find(q=>q.id===p.id).footprint;
 assert.equal(sha(original),'8e8dbac0e7e487231ab54171f8335e8d3562c14a71fe715f5de32d682ec8618e','All old Earth patches, solids, routes, bounds, height metadata and work owners exact');
 for(const [id,h]of Object.entries({heaven:'4098836d80e30c47b131919a03acd82cf436c5c3844c615e64e02f51684f55db',hell:'f2e0a120d0b86083e51751272fdcc28d3b3b6df60e472227f2b4c8a910ab959b',atlantis:'4e22559592d448c1af40d213cde5b9f4f6ba21973995aca23110096de4987ccd',cosmos:'886ccbe45581f47339572e413085b92f459115129c824dc4d791779453195fbe'}))assert.equal(sha(W.definition(id)),h);
 for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%9],c=outline[(i+2)%9];assert.ok((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])>0);for(const q of corners)assert.ok((b[0]-a[0])*(q[1]-a[1])-(b[1]-a[1])*(q[0]-a[0])>=0,'Every old corner in every convex half-plane implies inclusion of the whole rectangle');}
 assert.equal(area(outline),348);assert.equal(p.w*p.d,256,'Original height-owner priority remains 256');
 for(const q of d.patches.filter(q=>q.id!==p.id)){const oldOverlap=Math.max(0,Math.min(38,q.x+q.w/2)-Math.max(22,q.x-q.w/2))*Math.max(0,Math.min(-12,q.z+q.d/2)-Math.max(-28,q.z-q.d/2));assert.equal(area(clipped(outline,q)),oldOverlap,'New apron cannot steal height priority from '+q.id);}
});
test('independent outline agrees with canonical support and all old body offsets retain height and walk support',()=>{
 for(let x=21;x<=42;x+=.5)for(let z=-31;z<=-9;z+=.5){assert.equal(W.patchContains(x,z,p),polygon(x,z,outline));for(const r of [0,.31,.6,2])if(oldLand(x,z,r)){assert.ok(W.land(room,x,z,r));const oldHeight=d.patches.filter(q=>oldInside(x,z,q)).sort((a,b)=>a.w*a.d-b.w*b.d)[0].y;assert.equal(W.height(room,x,z),oldHeight);if(!d.solids.some(q=>oldInside(x,z,q,-r)))assert.ok(W.walkable(room,x,z,r));}}
 for(const q of d.points){const height=d.patches.filter(p=>oldInside(q.x,q.z,p)).sort((a,b)=>a.w*a.d-b.w*b.d)[0]?.y??1.57;assert.equal(W.height(room,q.x,q.z),height);for(const r of [0,.31,.6])assert.equal(W.walkable(room,q.x,q.z,r),oldLand(q.x,q.z,r)&&!d.solids.some(p=>oldInside(q.x,q.z,p,-r)));}
 assert.equal(W.land(room,40,-29,0),false,'Bounding-box corner remains water');assert.ok(W.walkable(room,39,-20));for(const x of [-5,5])assert.equal(W.land(room,x,55,0),false,'Bridge wet openings unchanged');
});
test('actual Core movement, supported segments and picking reach real apron while refusing water and the existing stone',()=>{
 for(const end of [{x:39,z:-20},{x:36,z:-29},{x:36,z:-11}]){const start={x:30,z:-20},path=C.pathfind(start,end,{id:room});assert.ok(path);let a=start;for(const b of path){assert.ok(W.segment(room,a,b));a=b;}assert.deepEqual(W.pick(room,[end.x,6,end.z],[0,-1,0]),end);}
 assert.equal(C.pathfind({x:30,z:-20},{x:40,z:-29},{id:room}),null);assert.equal(W.pick(room,[40,6,-29],[0,-1,0]),null);assert.equal(W.segment(room,{x:32,z:-23},{x:39,z:-23}),false);
 const sim=new C.Simulation();sim.room=room;sim.state.player={x:30,z:-20,yaw:0};const before=JSON.stringify({...sim.state,player:null});assert.equal(sim.moveTo(39,-20).ok,true);for(let i=0;i<28;i++)sim.manual(1,0,.1);assert.ok(sim.state.player.x>38.9&&sim.state.player.x<39);assert.ok(W.walkable(room,sim.state.player.x,sim.state.player.z));assert.equal(JSON.stringify({...sim.state,player:null}),before,'Movement grants no quest, reward, ledger or equipment changes');
});
test('two actual packed shoreline meshes are closed, bounded and cover exactly canonical dry ground',()=>{
 const top=mesh(E.geometry('coastward-shore-apron'),52,[22,1.46,-30],[41,1.57,-10]);
 const outer=outline.map(([x,z])=>{const r=Math.hypot(x-30,z+20);return[x+.65*(x-30)/r,z+.65*(z+20)/r];});
 mesh(E.geometry('coastward-shore-bank'),60,[Math.min(...outer.map(v=>v[0])), -.5,Math.min(...outer.map(v=>v[1]))],[Math.max(...outer.map(v=>v[0])),1.46,Math.max(...outer.map(v=>v[1]))]);
 const cells=Art.partitions(d);for(let x=21;x<=42;x+=.5)for(let z=-31;z<=-9;z+=.5){const visibleTop=cells.some(q=>oldInside(x,z,q))||top.tops.some(t=>polygon(x,z,t));assert.equal(visibleTop,W.land(room,x,z,0),'No invisible land or unsupported top at '+x+','+z);}
 assert.equal(E.geometry('coastward-shore-apron').byteLength+E.geometry('coastward-shore-bank').byteLength,8064);
});
test('actual authoring submits two identity non-solid meshes and retains stable bank membership at every quality',()=>{
 const banks=Art.coastBanks(Art.rawPartitions(d));assert.equal(banks.length,67);for(const id of ['coast-bank-20','coast-bank-24','coast-bank-69'])assert.ok(!banks.some(q=>q.id===id));
 for(const quality of ['low','balanced','high']){const sim=new C.Simulation();sim.returnPos={...sim.state.player};sim.room=room;sim.state.player={...d.entry};sim.state.settings.quality=quality;const before=JSON.stringify(sim.state),items=[],writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,depth,c,opt={}){items.push({kind,p:[x,y,z],s:[w,h,depth],c,...opt});},box(...args){this.add('box',...args);}};Art.make(writer,sim);assert.equal(JSON.stringify(sim.state),before);const added=items.filter(q=>q.shorelineGround||q.shorelineBank);assert.equal(added.length,2);assert.deepEqual(added.map(q=>q.kind),['coastward-shore-apron','coastward-shore-bank']);for(const q of added){assert.deepEqual(q.p,[0,0,0]);assert.deepEqual(q.s,[1,1,1]);assert.equal(q.cameraSolid,false);assert.equal(q.cutaway,false);assert.equal(E.solidBounds(q.kind,q),null);assert.deepEqual(Array.from(E.M.compose(...q.p,...q.s)),[1,0,0,0,-0,1,0,0,0,-0,1,0,0,0,0,1],'Exact original compose identity including signed-zero cells');}}
});
test('actual Canvas and SVG maps use the same nine canonical points and still draw every unrelated rectangle',()=>{
 const sim=new C.Simulation();sim.room=room;const {x:ox,y:oy,scale:s}=UI.projection(d,420,500),points=outline.map(([x,z])=>(ox+x*s)+','+(oy+z*s)).join(' '),svg=UI.mapSVG(d,sim);assert.ok(svg.includes('<polygon data-world-ground="shore-overlook" points="'+points+'"'));
 for(const q of d.patches.filter(q=>q.id!==p.id))assert.ok(svg.includes('<rect x="'+(ox+(q.x-q.w/2)*s)+'" y="'+(oy+(q.z-q.d/2)*s)+'" width="'+q.w*s+'" height="'+q.d*s+'" fill="#889783"/>'));
 const calls=[],g={};for(const name of ['fillRect','beginPath','moveTo','lineTo','closePath','fill','stroke','setLineDash','arc','fillText'])g[name]=(...args)=>calls.push([name,...args]);UI.mapCanvas({width:420,height:500,getContext:()=>g},sim);const i=calls.findIndex(v=>v[0]==='moveTo'&&v[1]===ox+22*s&&v[2]===oy-28*s);assert.ok(i>=0);assert.deepEqual(calls.slice(i,i+9),outline.map(([x,z],j)=>[j?'lineTo':'moveTo',ox+x*s,oy+z*s]));assert.deepEqual(calls.slice(i+9,i+11),[['closePath'],['fill']]);for(const q of d.patches.filter(q=>q.id!==p.id))assert.ok(calls.some(v=>JSON.stringify(v)===JSON.stringify(['fillRect',ox+(q.x-q.w/2)*s,oy+(q.z-q.d/2)*s,q.w*s,q.d*s])));
});
test('mesh and independent outline contracts detect displaced, open, fallback and square-corner counterexamples',()=>{
 const d=E.geometry('coastward-shore-apron'),shift=d.slice();for(let i=0;i<shift.length;i+=6)shift[i]+=.5;assert.throws(()=>mesh(shift,52,[22,1.46,-30],[41,1.57,-10]));assert.throws(()=>mesh(d.slice(18),52,[22,1.46,-30],[41,1.57,-10]));assert.throws(()=>mesh(E.geometry('absent-coastward-shore'),52,[22,1.46,-30],[41,1.57,-10]));assert.equal(polygon(40,-29,outline),false);assert.equal(polygon(39,-20,corners),false);assert.equal(polygon(39,-20,outline),true);
});

test('new shoreline apron retains the exact original packed terrain material',()=>{
 // These are actual authoring and instance-packing functions. The CPU upload
 // adapter records bytes only; it creates no Engine, GL context or pixels.
 function packed(item){const uploads=[],gl={ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,bindBuffer(){},bufferData(target,data,usage){uploads.push({target,usage,data:Array.from(data)});}},batch={kind:item.kind,items:[item],buf:{},dynamic:false};
  E.Engine.prototype.updateBatch.call({gl},batch);assert.equal(uploads.length,1);assert.equal(uploads[0].target,gl.ARRAY_BUFFER);assert.equal(uploads[0].usage,gl.STATIC_DRAW);assert.equal(batch.count,1);assert.deepEqual(uploads[0].data,Array.from(batch.data));return Array.from(batch.data);
 }
 function material(apron,floor){const a=packed(apron),b=packed(floor);assert.equal(b[23],-1,'Existing real floor owns explicit terrain');assert.deepEqual(a.slice(16),b.slice(16),'Same palette, alpha, roughness, emission, wind and terrain tag at their shared top');assert.equal(apron.terrain,true);assert.equal(apron.cameraSolid,false);assert.equal(apron.cutaway,false);return a;}
 for(const quality of ['low','balanced','high']){const sim=new C.Simulation();sim.returnPos={...sim.state.player};sim.room=room;sim.state.player={...d.entry};sim.state.settings.quality=quality;const before=JSON.stringify(sim.snapshot()),items=[],writer={e:{},begin(){},commit(){},add(kind,x,y,z,w,h,depth,c,opt={}){items.push({kind,p:[x,y,z],s:[w,h,depth],c,...opt});},box(...args){this.add('box',...args);}};
  Art.make(writer,sim);assert.equal(JSON.stringify(sim.snapshot()),before);const apron=items.find(q=>q.shorelineGround===p.id),floor=items.find(q=>q.worldGround===p.id),bank=items.find(q=>q.shorelineBank===p.id);assert.ok(apron&&floor&&bank);const data=material(apron,floor);assert.deepEqual(data.slice(0,16),Array.from(E.M.compose(...apron.p,...apron.s)));assert.equal(bank.terrain,undefined,'Bank keeps the existing stone material');
  assert.throws(()=>material({...apron,terrain:undefined},floor),/Same palette/,'Missing terrain flag must detect the original seam');assert.throws(()=>material({...apron,rough:.5},floor),/Same palette/,'Different packed roughness must also fail');
 }
});
