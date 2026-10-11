'use strict';
// Actual renderer packing/bounds through a synthetic GL call interface, never a GL context.
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/engine.js');
function host(fault=null){
 let serial=0,bound=null;const uploads=[];
 const gl={ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,FLOAT:4,
  createBuffer:()=>({buffer:++serial}),createVertexArray:()=>({vao:++serial}),
  bindBuffer:(target,buffer)=>{bound=buffer;},bindVertexArray:()=>{},enableVertexAttribArray:()=>{},
  vertexAttribPointer:()=>{},vertexAttribDivisor:()=>{},
  bufferData:(target,data,usage)=>{if(fault)throw fault;uploads.push({buffer:bound,data:Buffer.from(data.buffer,data.byteOffset,data.byteLength),usage});}};
 return Object.assign(Object.create(E.Engine.prototype),{gl,meshes:new Map(),batches:[],dynamic:[],cameraSolids:[],uploads});
}
function packed(items){
 const out=new Float32Array(items.length*24);
 items.forEach((it,i)=>{const o=i*24;out.set(it.m||E.M.compose(...it.p,...it.s,...(it.r||[0,0,0])),o);
  out.set([...E.hex(it.c),it.worldRoof?-1:it.cutaway?0:(it.alpha??1)],o+16);
  out.set([it.rough??.8,it.em??0,it.skyImage?3:(it.wind??0),it.terrain?-1:(it.wet??0)],o+20);});
 return Buffer.from(out.buffer);
}
function countCompose(run){
 const original=E.M.compose;let calls=0;
 E.M.compose=function(...args){calls++;return original.apply(this,args);};
 try{return {value:run(),calls};}finally{E.M.compose=original;}
}
function sample(){return [
 {p:[3,2,5],s:[4,2,.2],r:[.1,Math.PI/2,.03],c:0xa1b2c3,rough:.37,worldRoof:true},
 {p:[0,.5,0],s:[5,1,5],c:'#778899',terrain:true},
 {p:[-7,3,9],s:[2,4,3],c:[.125,.25,.5],cameraSolid:false,cutaway:true},
 {p:[8,3,-6],s:[2,3,2],c:0x664422,wind:2,alpha:.43,em:.13,wet:.4}
 ];}
test('ordinary static transforms are composed once and retain all packed bytes and eight-corner bounds',()=>{
 for(const kind of ['box','cylinder','octa','leaf']){
  const items=sample(),before=JSON.stringify(items),expected=packed(items),bounds=items.map(it=>E.solidBounds(kind,it)).filter(Boolean),h=host();
  const result=countCompose(()=>h.batch(kind,items,false,{railCutaway:true})),b=result.value;
  assert.equal(result.calls,items.length,'one compose per ordinary item, including excluded low/foliage');
  assert.deepEqual(Buffer.from(b.data.buffer),expected);assert.deepEqual(h.cameraSolids,bounds);
  assert.equal(b.railCutaway,true);assert.equal(b.items,items);assert.equal(h.batches[0],b);
  assert.equal(JSON.stringify(items),before);assert.ok(items.every(it=>!Object.hasOwn(it,'m')),'no matrix cache added to authored items');
 }
});
test('explicit Float32 and double matrices retain original upload quantization and original bounds precision',()=>{
 const first=E.M.compose(3,2,4,2,4,.3,.15,.7,.03),double=Array.from(first);
 double[12]=3.000000000001;double[14]=4.000000000003;
 const items=[{p:[99,99,99],s:[1,1,1],c:0x889977,m:first},{p:[88,88,88],s:[1,1,1],c:0x777777,m:double}],
  before=JSON.stringify(items),expected=packed(items),bounds=items.map(it=>E.solidBounds('box',it)),h=host();
 const result=countCompose(()=>h.batch('box',items));
 assert.equal(result.calls,0);assert.deepEqual(Buffer.from(result.value.data.buffer),expected);assert.deepEqual(h.cameraSolids,bounds);
 const quantized=E.solidBounds('box',{...items[1],m:new Float32Array(double)});
 assert.notDeepEqual(bounds[1],quantized,'fixture detects using packed Float32 values instead of the original explicit double matrix');
 assert.equal(items[0].m,first);assert.equal(items[1].m,double);assert.equal(JSON.stringify(items),before);
});
test('dynamic camera opt-in remains exact and rebuilds current bounds without a stale transform cache',()=>{
 const items=sample();items[0].cameraSolid=true;items[1].worldSolid=true;items[1].cameraSolid='truthy-original-opt-in';
 const h=host(),initial=packed(items),expected=items.filter(it=>it.cameraSolid).map(it=>E.solidBounds('box',it)).filter(Boolean),result=countCompose(()=>h.batch('box',items,true)),b=result.value;
 assert.equal(result.calls,items.length);assert.deepEqual(Buffer.from(b.data.buffer),initial);assert.deepEqual(b.cameraSolids,expected);assert.deepEqual(h.cameraSolids,[]);
 const oldBounds=JSON.stringify(b.cameraSolids);items[0].p[0]+=7;items[0].r[1]=.23;items.push({p:[1,3,-4],s:[.5,2,.6],c:0x887755,cameraSolid:true});
 const now=packed(items),nowBounds=items.filter(it=>it.cameraSolid).map(it=>E.solidBounds('box',it)).filter(Boolean),updated=countCompose(()=>h.updateBatch(b));
 assert.equal(updated.value,undefined);assert.equal(updated.calls,items.length);assert.deepEqual(Buffer.from(b.data.buffer),now);assert.deepEqual(b.cameraSolids,nowBounds);
 assert.notEqual(JSON.stringify(b.cameraSolids),oldBounds);assert.equal(b.count,items.length);assert.equal(h.dynamic.length,1);assert.deepEqual(h.cameraSolids,[]);
});
test('failed instance upload preserves original primary and publishes neither static nor dynamic new bounds',()=>{
 const failure=new Error('synthetic instance upload failure'),h=host();
 // An existing actual geometry entry isolates the original instance-upload boundary.
 h.meshes.set('box',{buffer:{existing:true},stride:6,count:36});h.cameraSolids=[{min:[-1,-1,-1],max:[1,1,1]}];
 h.gl.bufferData=()=>{throw failure;};const before=JSON.stringify(h.cameraSolids),items=sample();
 assert.throws(()=>h.batch('box',items),e=>e===failure);assert.equal(JSON.stringify(h.cameraSolids),before);assert.deepEqual(h.batches,[]);
 const dynamic={kind:'box',buf:{owned:true},items,dynamic:true,count:17,cameraSolids:[{min:[0,0,0],max:[2,2,2]}]},old=JSON.stringify(dynamic.cameraSolids);
 assert.throws(()=>h.updateBatch(dynamic),e=>e===failure);assert.equal(JSON.stringify(dynamic.cameraSolids),old);assert.equal(dynamic.count,17);
});
