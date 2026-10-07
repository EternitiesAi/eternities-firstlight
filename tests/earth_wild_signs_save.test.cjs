'use strict';
/* Installed-module CPU save boundaries. Paid/partial histories below are labelled
 * synthetic specimens; no native witness or command-earned reward is claimed. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),D=require(path.join(ROOT,'src/earth-wild-signs-data.js'));
const CH=require(path.join(ROOT,'src/characters.js')),CD=require(path.join(ROOT,'src/earth-consignment-data.js')),E=globalThis.RealmEarthExpedition;
const copy=v=>JSON.parse(JSON.stringify(v)),strip=v=>{const s=copy(v);delete s.earthWildSigns;return s;};
function storage(key,world){const m=new Map([[key,typeof world==='string'?world:JSON.stringify(world)]]);return{map:m,writes:0,attempts:0,refuse:false,getItem:k=>m.get(k)??null,setItem(k,v){this.attempts++;if(this.refuse)throw Error('SYNTHETIC quota');this.writes++;m.set(k,String(v));}};}
function paid(record=D.fresh()){
 const s=C.fresh();s.adventure.started=true;
 s.earthExpedition={version:1,story:{accepted:true,branch:'stormfall-recovery',steps:E.definition.steps.map(v=>v.id),claimed:true},patrol:{lastClaim:0,active:null}};
 s.localLife.records[CD.ID]={accepted:true,choice:'south-stormfall',steps:CD.required('south-stormfall').slice(),claimed:true};s.earthWildSigns=copy(record);return C.validate(s);
}
const complete=(resolution='signed-loop',cleared=false,claimed=false)=>({version:1,accepted:true,evidence:['feeding-track','timber-gouge','pest-scrape'],observed:true,resolution,cleared,claimed});
test('actual Core owns a separate fresh version1 account and retains all existing versions',()=>{
 const a=C.fresh(),b=C.fresh();assert.deepEqual(a.earthWildSigns,{version:1,accepted:false,evidence:[],observed:false,resolution:null,cleared:false,claimed:false});
 a.earthWildSigns.evidence.push('never-shared');assert.deepEqual(b.earthWildSigns.evidence,[]);assert.equal(C.VERSION,9);assert.equal(b.adventure.version,12);assert.equal(b.localLife.version,1);
});
test('missing owner adds only the literal fresh field to an otherwise canonical world',()=>{
 const old=strip(C.fresh());old.adventure.xp=9999;old.notes=[{text:'SYNTHETIC migration note',day:1}];const before=JSON.stringify(old),v=C.validate(old);
 assert.deepEqual(strip(v),old);assert.deepEqual(v.earthWildSigns,D.fresh());assert.equal(JSON.stringify(old),before);
});
test('historical command-earned blade bow and strongest fixtures preserve raw owners apart from literal prior and new missing-owner additions',()=>{
 for(const name of ['blade/ALL_TWELVE_PREREQUISITES_EARNED.json','bow/ALL_TWELVE_PREREQUISITES_EARNED.json','strongest/FINAL_WORLD.json']){
  const file=path.join(ROOT,'tests/fixtures/earth-homecoming-prerequisites',name),raw=fs.readFileSync(file),world=JSON.parse(raw),expected=copy(world);
  assert.ok(!Object.hasOwn(world,'earthWildSigns'),'Historical fixture really predates this owner.');
  if(Object.keys(expected.localLife.records).length===4)expected.localLife.records[CD.ID]={accepted:false,choice:null,steps:[],claimed:false};
  if(!Object.hasOwn(expected,'earthHomecoming'))expected.earthHomecoming={version:1,accepted:false,choice:null,steps:[],claimed:false};
  const next=C.validate(world);assert.deepEqual(strip(next),expected);assert.deepEqual(next.earthWildSigns,D.fresh());assert.ok(fs.readFileSync(file).equals(raw));
 }
});
test('explicit malformed inherited undefined future and contradictory owners are rejected',()=>{
 for(const value of [undefined,null,{}, {...D.fresh(),version:2},{...D.fresh(),extra:true},{...D.fresh(),accepted:true,observed:true},{...D.fresh(),evidence:['pest-scrape']},complete('signed-loop',true)]){
  const s=paid();s.earthWildSigns=value;assert.throws(()=>C.validate(s));
 }
 const old=strip(C.fresh()),inherited=Object.assign(Object.create({earthWildSigns:D.fresh()}),old);assert.throws(()=>C.validate(inherited),/inherited/);
});
test('accepted history requires the claimed exact fifth source and preserves every partial or paid record on snapshot',()=>{
 const partial=[{...D.fresh(),accepted:true},{...D.fresh(),accepted:true,evidence:['feeding-track']},{...D.fresh(),accepted:true,evidence:['feeding-track','timber-gouge'],observed:true},complete(),complete('cleared-pocket'),complete('cleared-pocket',true),complete('cleared-pocket',true,true),complete('signed-loop',false,true)];
 for(const r of partial){const s=paid(r),sim=new C.Simulation(s);assert.deepEqual(sim.snapshot(),s);sim.snapshot().earthWildSigns.evidence.reverse();assert.deepEqual(sim.state.earthWildSigns,r);}
 for(const change of [s=>s.localLife.records[CD.ID].claimed=false,s=>s.localLife.records[CD.ID].steps.pop(),s=>s.localLife.records[CD.ID].choice='south-coppice',s=>s.earthExpedition.story.claimed=false]){const s=paid(complete());change(s);assert.throws(()=>C.validate(s));}
});
test('current and legacy missing-owner loads are read-only and corrupt raw bytes remain untouched',()=>{
 for(const key of [C.KEY,C.LEGACY_KEY]){const old=strip(C.fresh());if(key===C.LEGACY_KEY)old.version=8;const raw=JSON.stringify(old),st=storage(key,raw),v=C.load(st);assert.equal(v.status,key===C.KEY?'loaded':'migrated');assert.deepEqual(v.state.earthWildSigns,D.fresh());assert.equal(st.writes,0);assert.equal(st.getItem(key),raw);}
 const bad=paid();bad.earthWildSigns=null;const st=storage(C.KEY,bad),before=st.getItem(C.KEY),v=C.load(st);assert.equal(v.status,'unavailable-or-corrupt');assert.equal(v.preserveExisting,true);assert.equal(st.getItem(C.KEY),before);assert.equal(st.writes,0);
});
test('malformed inactive character blocks the whole library and never rewrites its bytes',()=>{
 const a=paid(),b=paid();b.earthWildSigns.version=9;const st=storage(CH.KEY,{version:1,revision:1,nextId:3,active:'character-1',slots:[{id:'character-1',world:a},{id:'character-2',world:b}]}),before=st.getItem(CH.KEY),store=new CH.Store(st),loaded=store.load();assert.equal(loaded.preserveExisting,true);assert.equal(store.blocked,true);assert.equal(st.getItem(CH.KEY),before);assert.equal(st.writes,0);
});
test('actual Store validates malformed imports and quota refusals before adopting any current or inactive facts',()=>{
 const world=paid(complete('signed-loop',false,true)),st=storage(CH.KEY,{version:1,revision:4,nextId:2,active:'character-1',slots:[{id:'character-1',world}]}),store=new CH.Store(st),loaded=store.load();store.writer=true;const before=st.getItem(CH.KEY),record=JSON.stringify(store.record);
 const bad=copy(world);bad.earthWildSigns.observed=false;assert.equal(store.command('import',{world:bad},loaded.state,store.revision).ok,false);assert.equal(st.getItem(CH.KEY),before);assert.equal(JSON.stringify(store.record),record);
 st.refuse=true;const changed=copy(world);changed.notes.push({text:'SYNTHETIC refused write',day:world.day});assert.deepEqual(C.validate(changed),changed);const result=store.save(changed);assert.equal(result.ok,false);assert.match(result.error,/SYNTHETIC quota/);assert.equal(st.attempts,1,'Valid candidate actually reached the refused writer.');assert.equal(st.writes,0);assert.equal(st.getItem(CH.KEY),before);assert.equal(JSON.stringify(store.record),record);
});
