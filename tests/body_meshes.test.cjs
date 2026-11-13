'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
// Packed human bodies: deterministic from the committed Blender source, budgeted, finite, unit normals.
const E=require('../src/engine.js');
const B=require('../src/body-meshes.js');
const {bake}=require('../tools/bake_bodies.cjs');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/source/human-bodies/BODY_PARTS.json'),'utf8');
const packed=fs.readFileSync(path.join(root,'src/body-meshes.js'),'utf8');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const BODY=['body-head','body-neck','body-torso','body-upper-arm','body-forearm','body-hand','body-thigh','body-shin'];
const OUTFIT=['body-coat','body-robe','body-wing-left','body-wing-right'];

test('the packed body module reproduces byte for byte from the committed Blender source',()=>{
 assert.equal(bake(source),packed,'src/body-meshes.js is the deterministic pack of assets/source/human-bodies/BODY_PARTS.json');
 assert.ok(packed.includes('Source SHA256 '+sha(source)+'.'),'the header names the exact source bytes');
 assert.equal(sha(packed),'b4269d88c5b6d5ac9278e59a8365d3531fb2b6f199946952a071d31d30eeea17','the generated module hash is pinned');
});

test('every body kind stays inside its triangle budget; the whole body is 2,500 triangles at most',()=>{
 // feet stay the rig's boot boxes: the baked foot read as a ball, so no foot kind is registered.
 for(const kind of BODY)assert.ok(B.triangles[kind]>0&&B.triangles[kind]<=(kind==='body-head'?650:350),kind+' '+B.triangles[kind]);
 assert.ok(B.triangles['body-head']>=500,'the head carries the face');
 assert.ok(BODY.reduce((sum,kind)=>sum+B.triangles[kind],0)<=2500,'whole body budget');
 for(const kind of OUTFIT)assert.ok(B.triangles[kind]>0&&B.triangles[kind]<=1100,kind+' '+B.triangles[kind]);
 assert.deepEqual([...B.kinds].sort(),[...BODY,...OUTFIT].sort(),'exactly the body and outfit kinds are registered');
});

test('every baked kind has finite positions and unit smooth normals, and the engine serves the same bytes',()=>{
 for(const kind of B.kinds){
  const g=B.geometry(kind);
  assert.equal(g.length%18,0,kind+' whole triangles');
  for(let i=0;i<g.length;i+=6){
   assert.ok([...g.slice(i,i+6)].every(Number.isFinite),kind+' finite vertex');
   assert.ok(Math.abs(Math.hypot(g[i+3],g[i+4],g[i+5])-1)<2e-3,kind+' unit normal');
  }
  assert.deepEqual(E.geometry(kind),g,kind+' is served by the engine geometry path');
  assert.equal(E.meshStride(kind),6,kind+' stride');
 }
});

test('the packed module stays inside the page budget',()=>{
 assert.ok(Buffer.byteLength(packed)<600*1024,'body module bytes '+Buffer.byteLength(packed));
});
