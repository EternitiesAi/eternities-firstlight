'use strict';
// Actual App function and Heaven decorator. Synthetic UI/engine/art/cache/save
// interfaces; no browser, graphics context, durable store or command earning.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const H=require('../src/world-heaven-hell.js'),D=require('../src/earth-wild-signs-data.js');
const app=globalThis.__heavenQualitySource||fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
const begin=app.indexOf('function graphicsQuality(value){'),end=app.indexOf('function updateCamera(dt){',begin);
assert.ok(begin>=0&&end>begin);assert.equal(app.split('function graphicsQuality(value){').length,2);
const fn=app.slice(begin,end),def=H.realms.find(r=>r.id==='heaven');
function boundary({room=def.room,quality='high',enginePresent=true,artPresent=true,dive=false}={}){
 const state={settings:{quality},history:['labelled synthetic sentinel'],xp:9999,sockets:{blade:'ruby'},claims:['synthetic-existing-claim']};
 const sim={room,worldDive:dive,state},engine=enginePresent?{quality}:null,art=artPresent?{identity:'same-static-art'}:null;
 const camera={projection:'perspective',yaw:.22},leases={travel:'same',encounter:'same'},calls={make:0,resize:0,save:0};
 let cached=[],saved=null;
 function decorate(){const out=[];H.decorate({add(kind,...a){out.push({kind,args:a});}},def,{height:()=>1.57,sim});cached=out;}
 if(room===def.room)decorate();
 const host={sim,engine,art,camera,leases,RealmEarthWildSignsData:D,RealmWorldFoundationsArt:{make(a,s){assert.equal(a,art);assert.equal(s,sim);calls.make++;if(room===def.room)decorate();}},resize(){calls.resize++;},save(){calls.save++;saved=structuredClone(state);return{ok:true};}};
 vm.runInNewContext(fn+'\nthis.graphicsQuality=graphicsQuality;',host);
 return{host,sim,engine,art,camera,leases,calls,read:()=>({cached:structuredClone(cached),saved:structuredClone(saved)}),change:v=>host.graphicsQuality(v)};
}
test('Heaven graphics quality: actual UI function refreshes cached canonical crowns in both directions and preserves state and owners',()=>{
 assert.equal(def.room,'world-heaven','realm ID is not a scene room');
 // The previously shipped nine flowers intentionally exist only at higher
 // tiers. Preserve all other ordered details while checking their full payload
 // separately through both actual UI transitions; never ignore arbitrary art.
 const planting=rows=>rows.filter(p=>typeof p.args[7]?.gardenPlanting==='string'),stable=rows=>rows.filter(p=>typeof p.args[7]?.gardenPlanting!=='string').map(p=>p.kind==='woodland-canopy'?{...p,kind:'round'}:p);
 const highPlants=planting(boundary({quality:'high'}).read().cached);
 assert.equal(highPlants.length,63);assert.equal(new Set(highPlants.map(p=>p.args[7].gardenDetailId)).size,63);assert.equal(new Set(highPlants.map(p=>p.args[7].gardenPlant)).size,9);assert.deepEqual(new Set(highPlants.map(p=>p.args[7].gardenPlanting)),new Set(['instrument-edge','east-garden','tree-east']));
 for(const [from,to,beforeKind,afterKind]of [['high','low','woodland-canopy','round'],['low','high','round','woodland-canopy']]){
  const b=boundary({quality:from}),before=b.read().cached,state=structuredClone(b.sim.state),camera=structuredClone(b.camera),leases=structuredClone(b.leases);
  assert.equal(before.filter(p=>p.kind===beforeKind&&p.args[7]?.wind===2).length,60);
  assert.deepEqual(planting(before),from==='high'?highPlants:[]);
  assert.equal(b.change(to).ok,true);const after=b.read();
  assert.deepEqual(b.calls,{make:1,resize:1,save:1});assert.equal(b.engine.quality,to);
  assert.equal(after.cached.filter(p=>p.kind===afterKind&&p.args[7]?.wind===2).length,60,'already-loaded crowns must immediately match UI quality');
  assert.deepEqual(stable(after.cached),stable(before));assert.deepEqual(planting(after.cached),to==='high'?highPlants:[]);
  assert.deepEqual(b.sim.state,{...state,settings:{quality:to}});assert.deepEqual(after.saved,b.sim.state);
  assert.deepEqual(b.camera,camera);assert.deepEqual(b.leases,leases);assert.equal(b.host.sim,b.sim);assert.equal(b.host.art,b.art);assert.equal(b.host.engine,b.engine);
 }
});
test('Heaven graphics quality: unchanged settings, absent owners, diving and other scene rooms retain their original no-rebuild boundary',()=>{
 const rows=[{quality:'low'}, {enginePresent:false}, {artPresent:false}, {dive:true}, {room:'heaven'}, {room:'world-hell'}, {room:'world-atlantis'}, {room:null}];
 for(const row of rows){const b=boundary(row);assert.equal(b.change('low').ok,true);assert.deepEqual(b.calls,{make:0,resize:1,save:1});assert.equal(b.sim.state.settings.quality,'low');if(b.engine)assert.equal(b.engine.quality,'low');}
});
test('Heaven graphics quality: both existing Earth transitions still use their original scene owner exactly once',()=>{
 for(const [from,to]of [['high','low'],['low','high']]){const b=boundary({room:D.ROOM,quality:from});assert.equal(b.change(to).ok,true);assert.deepEqual(b.calls,{make:1,resize:1,save:1});assert.equal(b.sim.state.settings.quality,to);assert.equal(b.engine.quality,to);}
});
test('Heaven graphics quality: rejected values leave cached art, settings, saves and engine untouched',()=>{
 for(const value of ['unsupported','HIGH',null,undefined,1]){const b=boundary(),before=b.read(),state=structuredClone(b.sim.state);assert.equal(b.change(value).ok,false);assert.deepEqual(b.calls,{make:0,resize:0,save:0});assert.deepEqual(b.read(),before);assert.deepEqual(b.sim.state,state);assert.equal(b.engine.quality,'high');}
});
