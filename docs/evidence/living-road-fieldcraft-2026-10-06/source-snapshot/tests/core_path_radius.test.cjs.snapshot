'use strict';
/* Pure production navigation checks. Core executes in an isolated VM with
 * actual repository geometry/dependencies. Segment observers only forward
 * calls and read stacks; no game, actor, save, earned or native claim is made. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const portableRoot=path.resolve(__dirname,'..');
const root=fs.realpathSync(process.env.FIRSTLIGHT_ROOT||(fs.existsSync(path.join(portableRoot,'src/cosmos.js'))?portableRoot:path.join(portableRoot,'atlantis-harbour-campaign-20261004')));
const candidateFile=path.resolve(process.env.FIRSTLIGHT_CORE_CANDIDATE||path.join(__dirname,fs.existsSync(path.join(__dirname,'src/core.js'))?'src/core.js':'../src/core.js'));
const code=fs.readFileSync(candidateFile,'utf8'),actualCore=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
const load=file=>require(path.join(root,'src',file));
const N=load('cosmos.js'),E=load('earth.js'),W=load('world-foundations.js');
const oldSegment='function segment(a,b,room){if(W.handles(room?.id))return W.segment(room.id,a,b);if(room?.id===N.ROOM)return N.segment(a,b);if(room?.id===E.ROOM)return E.segment(a,b);let d=Math.hypot(a.x-b.x,a.z-b.z),n=Math.ceil(d/.18);for(let i=0;i<=n;i++){let t=n?i/n:0;if(!walkable(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,room))return false;}return true;}';
const segmentStart=code.indexOf('function segment('),segmentEnd=code.indexOf('class Heap',segmentStart);
assert.ok(segmentStart>=0&&segmentEnd>segmentStart,'current segment boundary must be explicit');
const newSegment=code.slice(segmentStart,segmentEnd);
const oldLink='line=(a,b)=>W.handles(room?.id)?W.segment(room.id,a,b,radius):segment(a,b,room)',newLink='line=(a,b)=>segment(a,b,room,radius)';
// In this stage the comparison is the actual frozen Core. After integration,
// reproduce only its old connector in isolation, clearly not a game fallback.
const baselineCode=actualCore.includes(oldSegment)&&actualCore.includes(oldLink)?actualCore:code.replace(newSegment,oldSegment+'\n').replace(newLink,oldLink);
assert.ok(baselineCode.includes(oldSegment)&&baselineCode.includes(oldLink),'known connector preimage must be reproducible');
const clone=v=>JSON.parse(JSON.stringify(v)),lineOf=(source,token)=>source.slice(0,source.indexOf(token)).split('\n').length;
function core(source=code,{trace=false,cosmos=N}={}){
 const calls=[],phaseLines={direct:lineOf(source,'function pathfind('),grid:lineOf(source,'let s=nearby(start)'),smoothing:lineOf(source,'if(!found)return')};
 const observe=(geometry,realm)=>({...geometry,segment(...args){
  const result=geometry.segment(...args);
  if(trace){const stack=Error().stack,match=stack.match(/at (?:Object\.)?pathfind \(.*:(\d+):\d+\)/),line=match?Number(match[1]):null;
   const phase=stack.includes('at nearby (')?'nearby':Object.keys(phaseLines).find(k=>phaseLines[k]===line)||'external';
   calls.push({realm,args:args.map(a=>a&&typeof a==='object'?{...a}:a),phase,result});}
  return result;
 }});
 const sandbox={module:{exports:{}},RealmCosmos:observe(cosmos,'cosmos'),RealmEarth:observe(E,'earth'),RealmWorldFoundations:observe(W,'world'),
  require:relative=>{assert.match(relative,/^\.\//);return load(relative.slice(2));}};
 vm.runInNewContext(source,sandbox,{filename:'isolated-production-core.js'});
 return{C:sandbox.module.exports,calls};
}
const fixtures=[
 {name:'Cosmos road cover',geometry:N,room:{id:N.ROOM},a:{x:9.15,z:-12},b:{x:9.15,z:-22},solid:'road-cover'},
 {name:'Earth quarry cover',geometry:E,room:{id:E.ROOM},a:{x:9.55,z:-14},b:{x:9.55,z:-22},solid:'quarry-stack'}
];
function wholePath(C,fixture,radius){
 const {a,b,room,geometry}=fixture;assert.ok(geometry.walkable(a.x,a.z,radius));assert.ok(geometry.walkable(b.x,b.z,radius));
 const route=C.pathfind(a,b,room,false,radius);assert.ok(route?.length,fixture.name+' has a supported detour for this body');let previous=a;
 for(const point of route){assert.ok(geometry.segment(previous,point,radius),fixture.name+' complete returned link respects radius');assert.ok(C.segment(previous,point,room,radius));previous=point;}
 assert.deepEqual(clone(previous),b);return route;
}
function sampleIntersects(a,b,solid,radius){
 // Independent bounded sample for these broad, non-tangent counterexamples.
 const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.01);for(let i=0;i<=n;i++){const t=i/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
  if(Math.abs(x-solid.x)<=solid.w/2+radius&&Math.abs(z-solid.z)<=solid.d/2+radius)return true;
 }return false;
}
test('actual preimage returns unsafe direct links despite clear large-body endpoints',()=>{
 const {C}=core(baselineCode);
 for(const fixture of fixtures)for(const radius of [.65,.95]){
  assert.ok(fixture.geometry.walkable(fixture.a.x,fixture.a.z,radius));assert.ok(fixture.geometry.walkable(fixture.b.x,fixture.b.z,radius));
  const solid=fixture.geometry.SOLIDS.find(s=>s.id===fixture.solid);assert.ok(solid);
  assert.equal(sampleIntersects(fixture.a,fixture.b,solid,.31),false);assert.equal(sampleIntersects(fixture.a,fixture.b,solid,radius),true);
  assert.equal(C.segment(fixture.a,fixture.b,fixture.room,radius),true,'old segment drops requested radius');
  const old=C.pathfind(fixture.a,fixture.b,fixture.room,false,radius);assert.equal(old.length,1,'old direct shortcut is incorrectly accepted');
  assert.equal(fixture.geometry.segment(fixture.a,old[0],radius),false,'actual geometry rejects the complete old link');
 }
});
test('new direct tests reject the cover shortcut and every complete .65/.95 detour is clear',()=>{
 const {C}=core();for(const fixture of fixtures)for(const radius of [.65,.95]){
  assert.equal(C.segment(fixture.a,fixture.b,fixture.room,radius),false);assert.ok(wholePath(C,fixture,radius).length>1);
 }
});
test('actual segment observers prove radius reaches direct, nearby, grid and smoothing links',()=>{
 for(const fixture of fixtures){const {C,calls}=core(code,{trace:true});wholePath(C,fixture,.95);
  const targetCalls=calls.filter(c=>c.realm===(fixture.geometry===N?'cosmos':'earth'));assert.ok(targetCalls.length>8);
  for(const call of targetCalls)assert.equal(call.args[2],.95,'every actual physical segment gets the selected radius');
  const phases=new Set(targetCalls.map(c=>c.phase));for(const phase of ['direct','nearby','grid','smoothing'])assert.ok(phases.has(phase),'observed '+fixture.name+' '+phase);
 }
});
test('smaller permitted body can cross the actual observatory gap without being forced to .31',()=>{
 const a={x:0,z:-48.4},b={x:6,z:-48.4},room={id:N.ROOM};assert.ok(N.walkable(a.x,a.z,.2)&&N.walkable(b.x,b.z,.2));
 assert.ok(N.segment(a,b,.2));assert.equal(N.segment(a,b,.31),false);assert.equal(core(baselineCode).C.segment(a,b,room,.2),false);
 const {C}=core();assert.equal(C.segment(a,b,room,.2),true);assert.deepEqual(clone(C.pathfind(a,b,room,false,.2)),[b]);
});
test('actual bridge support accepts player/body radii and refuses a body wider than its deck',()=>{
 const a={x:0,z:13},b={x:0,z:23},room={id:E.ROOM},{C}=core();
 for(const radius of [.31,.65,.95])assert.ok(E.segment(a,b,radius)&&C.segment(a,b,room,radius));
 assert.equal(E.segment(a,b,1.7),false);assert.equal(C.segment(a,b,room,1.7),false);assert.equal(C.pathfind(a,b,room,false,1.7),null);
});
test('generic sampled room links also use requested radius instead of its player default',()=>{
 const a={x:3,z:-2.8},b={x:1.9,z:2},room={id:'atelier'},{C}=core();
 assert.ok(C.walkable(a.x,a.z,room,.95)&&C.walkable(b.x,b.z,room,.95));assert.ok(core(baselineCode).C.segment(a,b,room,.95));
 assert.ok(C.segment(a,b,room,.31));assert.equal(C.segment(a,b,room,.95),false);const route=C.pathfind(a,b,room,false,.95);assert.ok(route?.length>1);
 let p=a;for(const q of route){assert.ok(C.segment(p,q,room,.95));p=q;}
});
test('WorldFoundation branch remains radius-qualified through the unified line helper',()=>{
 const {C,calls}=core(code,{trace:true}),a={x:-22,z:-94},b={x:-29,z:-97},room={id:'world-hell'};
 assert.ok(W.walkable(room.id,a.x,a.z,.65)&&W.walkable(room.id,b.x,b.z,.65));const route=C.pathfind(a,b,room,false,.65);assert.ok(route?.length);let p=a;
 for(const q of route){assert.ok(W.segment(room.id,p,q,.65));p=q;}
 assert.ok(calls.length);for(const call of calls.filter(c=>c.realm==='world'))assert.equal(call.args[3],.65);
});
test('default .31 complete paths and explicit .31 paths remain exactly compatible with preimage',()=>{
 const current=core().C,prior=core(baselineCode).C;
 const cases=[...fixtures,{room:{id:N.ROOM},a:{x:0,z:18},b:{x:3,z:-43}},{room:{id:E.ROOM},a:{x:0,z:24},b:{x:7,z:2}},
  {room:{id:'atelier'},a:{x:3,z:-2.8},b:{x:1.9,z:2}},{room:{id:'world-hell'},a:{x:-22,z:-94},b:{x:-29,z:-97}},
  {room:null,a:{x:0,z:3},b:{x:7,z:2}}];
 for(const f of cases){assert.deepEqual(clone(current.pathfind(f.a,f.b,f.room)),clone(prior.pathfind(f.a,f.b,f.room)));
  assert.deepEqual(clone(current.pathfind(f.a,f.b,f.room)),clone(current.pathfind(f.a,f.b,f.room,false,.31)));
  assert.equal(current.segment(f.a,f.b,f.room),prior.segment(f.a,f.b,f.room));assert.equal(current.segment(f.a,f.b,f.room),current.segment(f.a,f.b,f.room,.31));}
});
test('both APIs reject invalid radii, permit bounded zero/two, and do not query geometry on invalid input',()=>{
 const {C,calls}=core(code,{trace:true}),a={x:0,z:15},b={x:0,z:18},room={id:N.ROOM};
 for(const radius of [NaN,Infinity,-Infinity,-.01,2.01,'0',null]){assert.equal(C.segment(a,b,room,radius),false);assert.equal(C.pathfind(a,b,room,false,radius),null);}
 assert.equal(calls.length,0);for(const radius of [0,2]){assert.ok(C.segment(a,b,room,radius));assert.ok(C.pathfind(a,b,room,false,radius));}
});
test('installed Cosmos extension uses the actual body-qualified Core and permanent geometry',()=>{
 const geometry=N,{C}=core(code);
 for(const radius of [.31,.65,.95])for(const [a,b]of [[{x:3,z:-43},{x:36,z:-40}],[{x:32.5,z:-29},{x:54,z:-48}],[{x:49,z:-49},{x:59,z:-39}]]){
  wholePath(C,{name:'installed public service loop',geometry,room:{id:geometry.ROOM},a,b},radius);
 }
});
