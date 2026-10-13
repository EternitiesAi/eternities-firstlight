/* Actual App save/character functions and real Store over labelled memory
 * storage; synthetic bond fixture, not browser persistence or earned play. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),A=require('../src/adventure.js'),B=require('../src/briar-outing.js'),CS=require('../src/characters.js');
const source=fs.readFileSync(require.resolve('../src/app.js'),'utf8');
const line=name=>source.split(/\r?\n/).find(s=>s.startsWith('function '+name+'('))||'';
const block=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)+start.length));
function fixture(managed=true,quarantine=true){
 const sim=new C.Simulation();sim.state.adventure.started=true;sim.state.adventure.companion.bonded=true;sim.state.player={...B.definition.home,yaw:0};A.syncScene(sim);
 const second=C.fresh(),values=new Map([[managed?CS.KEY:C.KEY,JSON.stringify(managed?{version:1,revision:1,nextId:3,active:'character-1',slots:[{id:'character-1',world:sim.snapshot()},{id:'character-2',world:second}]}:sim.snapshot())]]);
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},store=new CS.Store(storage);store.load();store.writer=true;
 const lease=Object.freeze({});sim.briarOwnerLease=lease;const ctx=()=>({sim,active:store.active,revision:store.revision,definition:B.definition,ownerLease:lease,current:ctx});sim.briarContext=ctx;
 assert.ok(B.command(ctx(),'start').ok);
 for(let i=0;B.current(ctx())?.phase!=='await-take'&&i<1000;i++){const fox=A.runtime(sim).companion;if(i%6===0)sim.moveTo(fox.x,fox.z);sim.tick(.05);}
 assert.equal(B.current(ctx()).phase,'await-take');
 const makeUnknown=()=>{const r=B.command(ctx(),'take',{}, {save:candidate=>{assert.ok(store.save(candidate).ok);throw Error('memory transport throws after real Store write');}});assert.equal(r.ok,false);};
 if(quarantine)makeUnknown();
 const env={sim,characterStore:store,RealmBriarOuting:B,preserveExisting:false,saveState:'loaded',rememberCamera(){},renderStatus(){},toast(){},applyWorld(){},characterLock:{manager:{request:true}},acquireCharacterWriter:async()=>true};
 vm.createContext(env);vm.runInContext([line('briarSaveGuard'),line('worldSave'),line('save'),block('async function replaceLegacyWorld(','async function characterAction('),block('async function characterAction(','function characterExport(')].join('\n'),env);
 return{sim,store,values,env,second,makeUnknown,bytes:()=>values.get(managed?CS.KEY:C.KEY)};
}
test('ordinary and transaction saving cannot overwrite a post-write unknown moment',()=>{
 for(const method of ['save','worldSave']){const f=fixture(),before=f.bytes();const r=method==='save'?f.env.save():f.env.worldSave(f.sim.snapshot());assert.equal(r.ok,false);assert.match(r.error,/uncertain/i);assert.equal(f.bytes(),before);}
});
test('all character mutations including inactive deletion preserve uncertain outgoing bytes',async()=>{
 for(const type of ['create','import','switch','delete']){
  const f=fixture(),before=f.bytes(),payload=type==='create'?{visitor:f.second.visitor}:type==='import'?{world:f.second}:type==='switch'?{id:'character-2'}:{id:'character-2',confirmName:f.second.visitor.name};
  const r=await f.env.characterAction(type,payload,f.store.revision);assert.equal(r.ok,false,type);assert.match(r.error,/uncertain/i);assert.equal(f.bytes(),before,type);
 }
});
test('legacy replacement refuses both before and after writer acquisition',async()=>{
 const f=fixture(false),before=f.bytes();let locks=0;f.env.acquireCharacterWriter=async()=>{locks++;return true;};
 await f.env.replaceLegacyWorld(f.sim.snapshot());assert.equal(locks,0);assert.equal(f.bytes(),before);
 const late=fixture(false,false);late.env.acquireCharacterWriter=async()=>{late.makeUnknown();return true;};await late.env.replaceLegacyWorld(late.sim.snapshot());assert.equal(B.saveAllowed(late.sim),false);assert.deepEqual(JSON.parse(late.bytes()).briarMoments.moments,['briar-cloth-home-v1']);
});
test('uncertainty arising during the editing-lock await blocks the later character write',async()=>{
 const f=fixture(true,false);f.env.acquireCharacterWriter=async()=>{f.makeUnknown();return true;};
 const r=await f.env.characterAction('delete',{id:'character-2',confirmName:f.second.visitor.name},f.store.revision);
 assert.equal(r.ok,false);assert.match(r.error,/uncertain/i);const library=JSON.parse(f.bytes());assert.equal(library.slots.length,2);assert.deepEqual(library.slots[0].world.briarMoments.moments,['briar-cloth-home-v1']);
});
