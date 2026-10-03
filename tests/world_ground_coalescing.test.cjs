/* Exact CPU union/ownership controls, not rendered-pixel parity evidence. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../src/world-ground-coalescing.js'),South=require('../src/world-atlantis-earth.js'),EW=require('../src/elderweald-world.js'),North=require('../src/world-heaven-hell.js');
const E=require('../src/engine.js'),Art=require('../src/world-foundations-art.js');
const source=fs.readFileSync(require.resolve('../src/world-ground-coalescing.js'),'utf8');
const actual=South.realms[0],ids=new Set(EW.extension.patches.map(p=>p.id));
const old={...actual,patches:actual.patches.filter(p=>!ids.has(p.id))},earth={...actual,patches:[...old.patches,...EW.extension.patches]};
const rawPartitions=Art.rawPartitions||Art.partitions;
const gallery=(def,c)=>{const v=def.dive?.volume;return!!(v&&Math.abs(c.x-v.x)<v.w/2&&Math.abs(c.z-v.z)<v.d/2);};
// The source-only fixture supplies the required caller-owned classification.
// Once Root installs rawPartitions, its actual tagging is asserted separately.
const canonical=def=>rawPartitions(def).map(c=>({...c,gallery:gallery(def,c)}));
const raw=canonical(earth),merged=M.coalesce(raw);
// Cosmos has its separate scene/height owner and never uses this art caller.
const definitions=[old,earth,South.realms[1],...North.realms];
const rect=c=>({x0:c.x-c.w/2,x1:c.x+c.w/2,z0:c.z-c.d/2,z1:c.z+c.d/2});
const contains=(c,x,z)=>{const p=rect(c);return x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1;};
const metadata=c=>Object.fromEntries(Object.keys(c).filter(k=>!['x','z','w','d'].includes(k)).sort().map(k=>[k,c[k]]));
const area=cells=>cells.reduce((sum,c)=>sum+c.w*c.d,0);
const cell=(x,z,w=1,d=1,extra={})=>({x,z,w,d,y:1.57,color:7,source:'land',...extra});
function exactUnion(a,b){
 const xs=[...new Set([...a,...b].flatMap(c=>{const p=rect(c);return[p.x0,p.x1];}))].sort((a,b)=>a-b);
 const zs=[...new Set([...a,...b].flatMap(c=>{const p=rect(c);return[p.z0,p.z1];}))].sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
  const x=xs[i-1]/2+xs[i]/2,z=zs[j-1]/2+zs[j]/2,aa=a.filter(c=>contains(c,x,z)),bb=b.filter(c=>contains(c,x,z));
  assert.equal(aa.length,bb.length,'exact elementary-cell coverage '+x+','+z);assert.ok(bb.length<=1,'no duplicate floor interiors');
  if(aa.length)assert.deepEqual(metadata(aa[0]),metadata(bb[0]),'exact source/color/height/metadata at '+x+','+z);
 }
 assert.ok(Math.abs(area(a)-area(b))<1e-8);
 const byOwner=cells=>{const values=new Map();for(const c of cells){const k=JSON.stringify(metadata(c));values.set(k,(values.get(k)||0)+c.w*c.d);}return [...values].sort(([a],[b])=>a<b?-1:a>b?1:0);};
 const before=byOwner(a),after=byOwner(b);assert.equal(before.length,after.length);for(let i=0;i<before.length;i++){assert.equal(before[i][0],after[i][0]);assert.ok(Math.abs(before[i][1]-after[i][1])<1e-8,'per-owner area');}
}

test('isolated IIFE and CommonJS expose only one frozen pure function',()=>{
 const sandbox={module:{exports:{}},sentinel:9};vm.runInNewContext(source,sandbox);assert.equal(sandbox.module.exports,sandbox.RealmWorldGroundCoalescing);assert.equal(sandbox.sentinel,9);assert.equal(Object.keys(sandbox).length,3);
 assert.deepEqual(Object.keys(M),['coalesce']);assert.ok(Object.isFrozen(M));assert.equal(global.RealmWorldGroundCoalescing,M);
});
test('actual 955-cell expanded Earth partition reduces to 64 exact rectangles',()=>{
 assert.equal(raw.length,955);assert.equal(merged.length,64);assert.equal(area(raw),18379.5);assert.equal(area(merged),18379.5);
 assert.ok(merged.length<raw.length*.1);exactUnion(raw,merged);
 if(Art.rawPartitions)assert.deepEqual(Art.partitions(earth),merged,'installed partitions must apply the exact helper to raw canonical owners');
});
test('every shared world-ground caller and old Coastward retain exact floor area, owner, color and height',()=>{
 for(const d of definitions){const a=canonical(d),b=M.coalesce(a);assert.ok(b.length<=a.length,d.id);exactUnion(a,b);
  if(Art.rawPartitions){assert.deepEqual(Art.rawPartitions(d),a,'installed raw cells must tag gallery classification');assert.deepEqual(Art.partitions(d),b,'installed caller must preserve the exact coalesced output');}}
});
test('real bridge source boundaries and river void remain separate from bank masses',()=>{
 for(const source of ['channel-bridge','elderweald-footbridge']){
  const a=raw.filter(c=>c.source===source),b=merged.filter(c=>c.source===source);assert.ok(a.length&&b.length);exactUnion(a,b);assert.equal(b.length,1,'one exact bridge rectangle '+source);
 }
 for(const x of [-131,-119])for(const z of [-47.25,-49,-50.75])assert.equal(merged.some(c=>contains(c,x,z)),false,'true river hole '+x+','+z);
 assert.equal(merged.filter(c=>contains(c,-125,-49)).length,1);
 assert.equal(merged.find(c=>contains(c,-125,-49)).source,'elderweald-footbridge');
 const mass=cells=>cells.filter(c=>!/bridge/.test(c.source));exactUnion(mass(raw),mass(merged));
});
test('Atlantis gallery edge partitions remain exact and no cell crosses camera-medium boundary',()=>{
 const d=South.realms[1],a=canonical(d),b=M.coalesce(a),v=d.dive.volume;
 const wet=c=>Math.abs(c.x-v.x)<v.w/2&&Math.abs(c.z-v.z)<v.d/2;
 // Gallery status is a caller-owned input classification, not an inference
 // this realm-independent helper can make from source/color alone.
 for(const c of b){const r=rect(c),crossesX=r.x0<v.x-v.w/2&&r.x1>v.x-v.w/2||r.x0<v.x+v.w/2&&r.x1>v.x+v.w/2;
  const crossesZ=r.z0<v.z-v.d/2&&r.z1>v.z-v.d/2||r.z0<v.z+v.d/2&&r.z1>v.z+v.d/2;
  const overlapsX=r.x1>v.x-v.w/2&&r.x0<v.x+v.w/2,overlapsZ=r.z1>v.z-v.d/2&&r.z0<v.z+v.d/2;
  assert.equal(crossesX&&overlapsZ||crossesZ&&overlapsX,false,'gallery classification cannot change within one rectangle');}
 exactUnion(a.filter(wet),b.filter(wet));exactUnion(a.filter(c=>!wet(c)),b.filter(c=>!wet(c)));
});
test('a labelled untagged Atlantis control demonstrates why caller-owned gallery metadata is required',()=>{
 const d=South.realms[1],a=canonical(d),untagged=a.map(c=>{const {gallery,...plain}=c;return plain;}),bad=M.coalesce(untagged);
 const crosses=c=>{const p=rect(c),v=d.dive.volume,loX=v.x-v.w/2,hiX=v.x+v.w/2,loZ=v.z-v.d/2,hiZ=v.z+v.d/2;
  return((p.x0<loX&&p.x1>loX||p.x0<hiX&&p.x1>hiX)&&p.z1>loZ&&p.z0<hiZ)||((p.z0<loZ&&p.z1>loZ||p.z0<hiZ&&p.z1>hiZ)&&p.x1>loX&&p.x0<hiX);};
 assert.ok(bad.some(crosses),'same-owner untagged merges would cross the gallery edge');assert.equal(M.coalesce(a).some(crosses),false,'explicit classification retains the exact edge');
});
test('only complete shared edges merge; holes, corners, tiny gaps and differing metadata remain',()=>{
 assert.equal(M.coalesce([cell(0,0),cell(1,0),cell(0,1),cell(1,1)]).length,1);
 for(const cells of [[cell(0,0),cell(1,1)],[cell(0,0),cell(1+1e-10,0)],
  [cell(0,0,1,2),cell(1,.5)]]){exactUnion(cells,M.coalesce(cells));assert.equal(M.coalesce(cells).length,cells.length);}
 for(const extra of [{source:'other'},{color:8},{y:1.6},{gallery:true},{bridge:true},{medium:'water'},{marker:{side:'east'}},{present:undefined}]){
  const cells=[cell(0,0),cell(1,0,1,1,extra)];assert.equal(M.coalesce(cells).length,2);exactUnion(cells,M.coalesce(cells));}
 const ring=[cell(0,0),cell(1,0),cell(2,0),cell(0,1),cell(2,1),cell(0,2),cell(1,2),cell(2,2)];const result=M.coalesce(ring);exactUnion(ring,result);assert.equal(result.some(c=>contains(c,1,1)),false);
});
test('metadata values and arrays are deep-fresh, order-independent and never aliases',()=>{
 const nested={arr:[1,{tag:'a'}],empty:new Array(3)},input=[cell(0,0,1,1,{meta:nested}),cell(1,0,1,1,{meta:{empty:new Array(3),arr:[1,{tag:'a'}]}})];
 const before=JSON.stringify(input),out=M.coalesce(input);assert.equal(out.length,1);assert.equal(JSON.stringify(input),before);assert.notEqual(out[0].meta,nested);assert.notEqual(out[0].meta.arr,nested.arr);assert.equal(out[0].meta.empty.length,3);
 out[0].meta.arr[1].tag='changed';assert.equal(nested.arr[1].tag,'a');assert.equal(M.coalesce(input)[0].meta.arr[1].tag,'a');
 assert.equal(M.coalesce([cell(0,0,1,1,{meta:undefined}),cell(1,0)]).length,2);
});
test('empty input, input permutations and repeated coalescing are deterministic and fresh',()=>{
 assert.deepEqual(M.coalesce([]),[]);assert.notEqual(M.coalesce([]),M.coalesce([]));
 assert.deepEqual(M.coalesce([...raw].reverse()),merged);assert.deepEqual(M.coalesce(merged),merged);
 const untouched=JSON.stringify(raw),a=M.coalesce(raw),b=M.coalesce(raw);assert.notEqual(a,b);assert.notEqual(a[0],b[0]);a[0].x=999;assert.equal(JSON.stringify(raw),untouched);assert.deepEqual(M.coalesce(raw),b);
 const mixed=[cell(0,.5,1,2),cell(1,0),cell(1,1)],joined=M.coalesce(mixed);assert.equal(joined.length,1,'vertical merge may enable a following horizontal pass');assert.deepEqual(M.coalesce(joined),joined);exactUnion(mixed,joined);
});
test('invalid, overlapping, accessor or nondata records refuse before input mutation',()=>{
 const valid=cell(0,0),invalid=[null,{},[valid],{...valid,w:0},{...valid,d:-1},{...valid,x:NaN},{...valid,y:Infinity},{...valid,z:1e308,d:Number.MAX_VALUE}, {...valid,meta:()=>1},{...valid,meta:new Date()}];
 for(const bad of invalid)assert.throws(()=>M.coalesce([valid,bad]));assert.throws(()=>M.coalesce(null));assert.throws(()=>M.coalesce({}));assert.throws(()=>M.coalesce([valid,{...valid}]));assert.throws(()=>M.coalesce([valid,cell(.5,0)]));
 const cyclic={};cyclic.self=cyclic;assert.throws(()=>M.coalesce([cell(0,0,1,1,{cyclic})]));
 let reads=0;const accessor={...valid};Object.defineProperty(accessor,'tag',{enumerable:true,get(){reads++;return'bad';}});assert.throws(()=>M.coalesce([accessor]));assert.equal(reads,0);
 const hidden={...valid};Object.defineProperty(hidden,'tag',{value:'bad'});assert.throws(()=>M.coalesce([hidden]));assert.deepEqual(valid,cell(0,0));
});
test('actual submitted vertices stay finite and terrain draw work falls without dropping area',()=>{
 const work=cells=>({floor:cells.length,mass:cells.filter(c=>!/bridge/.test(c.source)).length});
 const before=work(raw),after=work(merged);assert.ok(after.floor+after.mass<(before.floor+before.mass)*.12);
 for(const c of merged){assert.ok([c.x,c.z,c.w,c.d,c.y].every(Number.isFinite));assert.ok(c.w>0&&c.d>0);
  for(const [y,h] of [[c.y-.055,.11],[(c.y-.11-.5)/2,c.y-.11+.5]]){const m=E.M.compose(c.x,y,c.z,c.w,h,c.d);assert.ok([...m].every(Number.isFinite));const mesh=E.geometry('box');for(let i=0;i<mesh.length;i+=6)assert.ok(E.M.transform(m,mesh.slice(i,i+3)).every(Number.isFinite));}}
});
