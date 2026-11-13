'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
// Packed outfit shells: deterministic from the committed Blender source, budgeted, finite, unit normals.
const E=require('../src/engine.js');
const B=require('../src/body-meshes.js');
const {bake}=require('../tools/bake_bodies.cjs');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/source/human-bodies/BODY_PARTS.json'),'utf8');
const packed=fs.readFileSync(path.join(root,'src/body-meshes.js'),'utf8');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const OUTFIT=['body-coat','body-robe']; // the only baked kinds the build packs; the full bodies stay on the lane

test('the packed body module reproduces byte for byte from the committed Blender source',()=>{
 assert.equal(bake(source),packed,'src/body-meshes.js is the deterministic pack of assets/source/human-bodies/BODY_PARTS.json');
 assert.ok(packed.includes('Source SHA256 '+sha(source)+'.'),'the header names the exact source bytes');
 assert.equal(sha(packed),'96d24871370cbde3cc20fe405d9962b13fc49765e11b8c7d352e73b2a2ba6913','the generated module hash is pinned');
});

test('every outfit kind stays inside its triangle budget, and the module registers only the outfit kinds',()=>{
 for(const kind of OUTFIT)assert.ok(B.triangles[kind]>0&&B.triangles[kind]<=1100,kind+' '+B.triangles[kind]);
 assert.deepEqual([...B.kinds].sort(),[...OUTFIT].sort(),'exactly the outfit kinds are registered');
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

test('the outfit module adds under 40 KB to the page',()=>{
 assert.ok(Buffer.byteLength(packed)<40*1024,'outfit module bytes '+Buffer.byteLength(packed));
});
