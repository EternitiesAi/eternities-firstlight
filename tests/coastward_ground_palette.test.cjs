/* Actual Art.make and Engine instance packing with a CPU upload adapter.
 * Synthetic room fixtures confer no native progress, pixels or admission. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/world-foundations.js'),E=require('../src/engine.js');
require('../src/coastward-settlement-art.js');require('../src/coastward-woodland-art.js');
require('../src/earth-grazer-motion.js');require('../src/earth-grazer-habitat-art.js');
require('../src/earth-road.js');require('../src/earth-road-art.js');
const Art=require('../src/world-foundations-art.js');
const shoreOwners=new Set(['shore-spur','shore-overlook']),shoreColor=0x9b9e7c;
const plain=v=>JSON.parse(JSON.stringify(v));
function capture(realm,quality){
 const def=W.definition(realm),sim=new C.Simulation();sim.returnPos={...sim.state.player};sim.room=def.room;sim.state.player={...def.entry};sim.state.settings.quality=quality;
 const before=JSON.stringify(sim.snapshot()),items=[],writer={e:{quality},begin(){},commit(){},add(kind,x,y,z,w,h,d,c,opt={}){items.push({kind,p:[x,y,z],s:[w,h,d],c,...opt});},box(...args){this.add('box',...args);}};
 Art.make(writer,sim);assert.equal(JSON.stringify(sim.snapshot()),before,'Scene dressing cannot alter simulation or durable state');return{def,items};
}
function packed(items){
 const uploads=[],gl={ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,bindBuffer(){},bufferData(target,data,usage){uploads.push({target,usage,bytes:Buffer.from(data.buffer,data.byteOffset,data.byteLength)});}},batch={items,buf:{},dynamic:false};
 E.Engine.prototype.updateBatch.call({gl},batch);assert.equal(uploads.length,1);assert.equal(uploads[0].target,gl.ARRAY_BUFFER);assert.equal(uploads[0].usage,gl.STATIC_DRAW);assert.equal(batch.count,items.length);
 const bytes=Buffer.from(batch.data.buffer,batch.data.byteOffset,batch.data.byteLength);assert.deepEqual(uploads[0].bytes,bytes);return batch.data;
}
function floors(def,items,quality){
 const cells=Art.partitions(def),actual=items.filter(q=>Object.hasOwn(q,'worldGround'));assert.equal(actual.length,cells.length,'All original coalesced floor owners remain');
 const expected=cells.map(p=>({kind:'box',p:[p.x,p.y-.055,p.z],s:[p.w,.11,p.d],c:def.id==='earthlands'&&['balanced','high'].includes(quality)&&shoreOwners.has(p.source)?shoreColor:p.color,cameraSolid:false,cutaway:!!p.gallery,rough:.96,terrain:true,worldGround:p.source}));
 for(let i=0;i<actual.length;i++)assert.deepEqual(actual[i],expected[i],'Only the declared Balanced/High shore floor paint may differ from canonical partition colors: '+cells[i].source+' '+quality);
 assert.deepEqual(Array.from(packed(actual)),Array.from(packed(expected)),'All floor matrix, alpha, material and color words retain their declared owners');return actual;
}
test('Balanced and High floor submissions share the existing apron palette without changing canonical colors',()=>{
 const def=W.definition('earthlands'),before=JSON.stringify(def),spur=def.patches.find(p=>p.id==='shore-spur'),overlook=def.patches.find(p=>p.id==='shore-overlook');assert.equal(spur.color,0x8f9c73);assert.equal(overlook.color,shoreColor);
 for(const quality of ['balanced','high']){const {items}=capture('earthlands',quality),ground=floors(def,items,quality),selected=ground.filter(q=>shoreOwners.has(q.worldGround)),apron=items.find(q=>q.shorelineGround==='shore-overlook');assert.ok(selected.some(q=>q.worldGround==='shore-spur'));assert.ok(selected.some(q=>q.worldGround==='shore-overlook'));assert.ok(apron);for(const q of selected){assert.equal(q.c,apron.c);assert.deepEqual(Array.from(packed([q])).slice(16,19),[0x9b,0x9e,0x7c].map(n=>Math.fround(n/255)));}}
 assert.equal(JSON.stringify(def),before,'Canonical map/support colors and authority stay exact');
});
test('Low and every non-Coastward Foundations scene retain their canonical floor paint and packed material',()=>{
 floors(W.definition('earthlands'),capture('earthlands','low').items,'low');
 assert.equal(W.handles(W.definition('cosmos').room),false,'Cosmos retains its separate production scene owner');
 for(const realm of ['heaven','hell','atlantis'])for(const quality of ['low','balanced','high']){const {def,items}=capture(realm,quality);floors(def,items,quality);}
});
test('floor ownership guard detects the old mixed palette, Low leakage and a recolored foreign owner',()=>{
 const {def,items}=capture('earthlands','balanced'),old=plain(items);old.find(q=>q.worldGround==='shore-spur').c=0x8f9c73;assert.throws(()=>floors(def,old,'balanced'),/Only the declared/);
 const low=plain(capture('earthlands','low').items);low.find(q=>q.worldGround==='shore-spur').c=shoreColor;assert.throws(()=>floors(def,low,'low'),/Only the declared/);
 const foreign=plain(items),q=foreign.find(q=>q.worldGround&&!shoreOwners.has(q.worldGround)&&q.c!==shoreColor);assert.ok(q,'A distinct foreign paint owner must exist');q.c=shoreColor;assert.throws(()=>floors(def,foreign,'balanced'),/Only the declared/);
});
