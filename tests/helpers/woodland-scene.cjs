'use strict';
// Portable installed-source CPU collector. No WebGL context, native event or
// gameplay facade. Only the old-crown comparison compiles a private painter.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'../..'));
const load=name=>require(path.join(ROOT,'src',name)),read=name=>fs.readFileSync(path.join(ROOT,name));
const C=load('core.js'),E=load('engine.js');load('creative.js');
for(const name of ['coastward-settlement-art.js','coastward-woodland-art.js','elderweald-trail-art.js','earth-grazer-motion.js','earth-grazer-habitat-art.js','earth-road.js','earth-road-art.js','world-foundations-art.js','world.js'])load(name);
const W=globalThis.RealmWorldFoundations,EW=globalThis.RealmElderwealdWorld,Art=globalThis.RealmArt.WorldArt;
const selected=Object.freeze(['elderweald-trunk-16','elderweald-trunk-17','elderweald-trunk-18','elderweald-trunk-31']);
const oldRoles=Object.freeze(['crown-branch','crown-lobe','upper-crown']);
const originalCrownCall="EW.parts({quality:context.sim?.state.settings.quality||'balanced',height})";
const installedCrownCall="woodlandShapes.replace("+originalCrownCall+",def,{quality:context.sim?.state.settings.quality||'balanced'})";
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function modules(){const O=load('earth-roadkeeper-motion.js'),A=load('woodland-shapes.js');assert.equal(O,globalThis.RealmEarthRoadkeeperMotion);assert.equal(A,globalThis.RealmWoodlandShapes);return{O,A};}
const stride=kind=>kind==='timber-panel'?8:6,triangles=kind=>E.geometry(kind).length/stride(kind)/3;
function tally(items){const byKind={};for(const p of items)byKind[p.kind]=(byKind[p.kind]||0)+1;return{instances:items.length,triangles:items.reduce((n,p)=>n+triangles(p.kind),0),byKind};}
const replaced=p=>selected.includes(p.opt?.solidId)&&oldRoles.includes(p.opt?.elderwealdPart);
function snapshot(value,seen=new Map()){
 if(!value||typeof value!=='object')return value;
 if(seen.has(value))return seen.get(value);
 if(value instanceof Date)return new Date(value);
 if(value instanceof ArrayBuffer)return value.slice(0);
 if(ArrayBuffer.isView(value))return value instanceof DataView?new DataView(value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength)):new value.constructor(value);
 const copy=value instanceof Map?new Map():value instanceof Set?new Set():Array.isArray(value)?[]:Object.create(Object.getPrototypeOf(value));seen.set(value,copy);
 if(value instanceof Map)for(const [k,v]of value)copy.set(snapshot(k,seen),snapshot(v,seen));
 if(value instanceof Set)for(const v of value)copy.add(snapshot(v,seen));
 for(const key of Reflect.ownKeys(value)){const d=Object.getOwnPropertyDescriptor(value,key);if(Object.hasOwn(d,'value'))d.value=snapshot(d.value,seen);Object.defineProperty(copy,key,d);}
 return copy;
}
function scene(quality){
 const batches=[],e={clear(){batches.length=0;},batch(kind,items,dynamic=false,options={}){const b={kind,items,dynamic,...options};batches.push(b);return b;}};
 const art=Object.create(Art.prototype);art.e=e;
 const sim=new C.Simulation(C.fresh());sim.room='world-earthlands';sim.state.adventure.started=true;sim.state.settings.quality=quality;
 sim.tick(0); // Real current-room Adventure roster, not a manufactured owner.
 const before=JSON.stringify(sim),graph=snapshot(sim),def=W.definition(sim.room),authority=JSON.stringify(def);
 globalThis.RealmWorldFoundationsArt.make(art,sim);
 assert.equal(JSON.stringify(sim),before,'Actual painter preserves complete Simulation, including real roster');
 assert.deepEqual(sim,graph,'Actual painter preserves the complete own object graph, including Map/Set/runtime contents');
 assert.equal(JSON.stringify(def),authority,'Actual painter preserves complete canonical ground/nav/service/enemy data');
 return{art,sim,batches};
}
const flatten=s=>s.batches.filter(b=>!b.dynamic).flatMap(b=>b.items.map(p=>({kind:b.kind,...p})));
function packed(items){
 const b={items,buf:null,dynamic:false};let uploads=0;
 const gl={ARRAY_BUFFER:1,STATIC_DRAW:2,bindBuffer(t){assert.equal(t,1);},bufferData(t,data,u){assert.equal(t,1);assert.equal(u,2);assert.ok(data instanceof Float32Array);uploads++;}};
 E.Engine.prototype.updateBatch.call({gl},b);assert.equal(uploads,1);
 return Buffer.from(b.data.buffer,b.data.byteOffset,b.data.byteLength);
}
function oldPainter(){
 // Attribution: reverse only the woodland-shapes01 crown-call seam in the
 // current installed decorator. Its original host painter at source668 was
 // SHA2566685a2da156f3b6d394b9dfef611fafb76d277df2d8a1c57e82746d276228665.
 // All other current painter code and canonical closure values remain actual.
 const painter=globalThis.RealmWorldAtlantisEarth,current=painter.decorate,source=current.toString();
 assert.equal(source.split(installedCrownCall).length,2,'One actual installed woodland crown call is required');
 const old=source.replace(installedCrownCall,originalCrownCall);
 return vm.runInNewContext('('+old+')',{G:globalThis,EW,GROUND:1.57,realms:painter.realms});
}
function compare(quality){
 const {A}=modules(),painter=globalThis.RealmWorldAtlantisEarth,current=painter.decorate;
 const next=scene(quality);let prior;
 try{painter.decorate=oldPainter();prior=scene(quality);}finally{painter.decorate=current;}
 assert.equal(painter.decorate,current,'Restore the actual installed painter');
 assert.equal(JSON.stringify(next.sim),JSON.stringify(prior.sim),'Exact complete world/roster');
 const before=flatten(prior),after=flatten(next),removed=p=>selected.includes(p.solidId)&&oldRoles.includes(p.elderwealdPart),added=p=>p.woodlandShapes===A.SEED;
 const oldOther=before.filter(p=>!removed(p)),newOther=after.filter(p=>!added(p));
 assert.equal(JSON.stringify(newOther),JSON.stringify(oldOther),'Exact other instance metadata');
 assert.deepEqual(packed(newOther),packed(oldOther),'Exact actual Engine packing for every other instance');
 assert.equal(JSON.stringify(after.filter(p=>p.worldSolid)),JSON.stringify(before.filter(p=>p.worldSolid)),'Exact physical/camera solids');
 assert.deepEqual(new Set(after.map(p=>p.kind)),new Set(before.map(p=>p.kind)),'No new draw kinds');
 assert.equal(after.filter(added).length,quality==='low'?8:20);
 const a=tally(after),b=tally(before);
 return{quality,before:b,after:a,delta:{instances:a.instances-b.instances,triangles:a.triangles-b.triangles,trianglePercent:(a.triangles-b.triangles)/b.triangles*100},
  otherPackedSHA256:sha(packed(newOther)),exactOtherMetadata:true,exactOtherPackedBytes:true,exactWorldSolids:true,exactCompleteSimulation:true,realCurrentPainterExecuted:true,cpuCollectorOnly:true};
}
function buildRAM(){
 // Run the actual installed builder and resource validation. Capture its two
 // HTML writes in memory; no generated file or source is written to the game.
 const source=read('build.py').toString('utf8'),reads={'src/shell.html':read('src/shell.html').toString('utf8')};
 const names=[...source.matchAll(/\('([^']+\.(?:js|css))','[A-Z_]+?'\)/g)].map(m=>m[1]);
 assert.ok(names.includes('woodland-shapes.js'),'Actual builder must declare the installed woodland module');
 for(const name of names)reads['src/'+name]=read('src/'+name).toString('utf8');
 const code=String.raw`from pathlib import Path, PurePosixPath
import hashlib,json,sys
q=json.load(sys.stdin);root=Path(q['root']);writes={}
class RAMPath:
 def __init__(self,p=''):self.p=PurePosixPath(p)
 def __truediv__(self,c):return RAMPath(self.p/c)
 def read_bytes(self):
  p=str(self.p)
  return q['reads'][p].encode('utf-8') if p in q['reads'] else (root/p).read_bytes()
 def read_text(self,encoding='utf-8'):return self.read_bytes().decode(encoding)
 def write_text(self,text,encoding='utf-8',newline=None):
  p=str(self.p);assert p in ('index.html','FIRSTLIGHT_VALLEY.html') and p not in writes
  raw=text.encode(encoding);writes[p]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
ns={'__name__':'woodland_installed_RAM_build','__file__':str(root/'build.py')}
exec(compile(q['source'],str(root/'build.py'),'exec'),ns)
html=ns['build'](RAMPath());assert len(writes)==2 and writes['index.html']==writes['FIRSTLIGHT_VALLEY.html']
assert html.count(q['reads']['src/woodland-shapes.js'])==1
assert html.count('G.RealmWoodlandShapes=api')==1
assert html.index('G.RealmEarthGrazerHabitatArt=api')<html.index('G.RealmWoodlandShapes=api')<html.index(q['reads']['src/app.js'][:100])
print(json.dumps({'actualBuilderExecuted':True,'outputs':writes,'moduleEmbeddedOnce':True,'gameTreeWrites':0}))`;
 const text=cp.execFileSync(process.env.FIRSTLIGHT_PYTHON||'python',['-B','-c',code],{input:JSON.stringify({root:ROOT,source,reads}),encoding:'utf8',maxBuffer:1024*1024,timeout:30000,
  env:{...process.env,PYTHONUTF8:'1',PYTHONDONTWRITEBYTECODE:'1'}});
 return JSON.parse(text.trim().split(/\r?\n/).at(-1));
}
module.exports={ROOT,load,read,C,E,W,EW,Art,modules,selected,oldRoles,scene,flatten,tally,stride,triangles,replaced,packed,compare,buildRAM,snapshot};
