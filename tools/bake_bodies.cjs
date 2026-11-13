/* Deterministic packing of the human body source. No Blender, network or browser needed.
 * Reads assets/source/human-bodies/BODY_PARTS.json (written by tools/bodies/bake_bodies.py)
 * and writes src/body-meshes.js: per-kind base64 float32 vertices and uint16 indices. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'assets/source/human-bodies/BODY_PARTS.json'),target=path.join(root,'src/body-meshes.js');
// only the outfit shells that story figures place over capsule bodies; the full bodies stay off the build.
const KEEP=['body-coat','body-robe','body-feather'];
const scalar=v=>Object.is(v,-0)?'-0':String(v);
function bake(bytes){
 const body=JSON.parse(bytes);
 assert.equal(body.kind,'human-bodies-v1');assert.equal(body.stride,6);
 for(const kind of KEEP)assert.ok(body.kinds[kind],kind+' is in the source');
 const kinds=[...KEEP].sort(),packed={};
 for(const kind of kinds){
  const {vertices,indices}=body.kinds[kind];
  assert.equal(vertices.length%6,0,kind+' vertices are whole stride-6 tuples');
  assert.equal(indices.length%3,0,kind+' indices are whole triangles');
  assert.ok(vertices.every(Number.isFinite),kind+' vertices are finite');
  assert.ok(indices.every(i=>Number.isInteger(i)&&i>=0),kind+' indices are integers');
  // Dedupe exact position/normal tuples in first-seen order; the Blender order is kept.
  const seen=new Map(),unique=[],remap=[];
  for(let i=0;i<vertices.length;i+=6){
   const tuple=vertices.slice(i,i+6),key=tuple.map(scalar).join(',');
   if(!seen.has(key)){seen.set(key,unique.length/6);unique.push(...tuple);}
   remap.push(seen.get(key));
  }
  assert.ok(unique.length/6<=65535,kind+' fits uint16 indices');
  const packedIndices=indices.map(i=>remap[i]);
  packed[kind]={vertexCount:unique.length/6,triangles:packedIndices.length/3,
   v:Buffer.from(Float32Array.from(unique).buffer).toString('base64'),
   i:Buffer.from(Uint16Array.from(packedIndices).buffer).toString('base64')};
 }
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 const lines=kinds.map(kind=>" '"+kind+"':{vertexCount:"+packed[kind].vertexCount+",triangles:"+packed[kind].triangles+
  ",size:"+JSON.stringify(body.kinds[kind].size||null)+",v:'"+packed[kind].v+"',i:'"+packed[kind].i+"'}");
 return "/* Original human bodies: CC0 Human Base Meshes bundle v1.4.1, baked by Blender 5.3.0 (tools/bodies). Source SHA256 "+hash+".\n"+
  " * Exact position/normal tuples, deduplicated; regenerate with tools/bake_bodies.cjs (no Blender needed). */\n"+
  "(function(G){'use strict';\nconst kinds=Object.freeze({\n"+lines.join(',\n')+"\n});\n"+
  "function bytes(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}\n"+
  "function geometry(kind){const k=kinds[kind];if(!k)throw Error('Unknown body kind '+kind);const v=new Float32Array(bytes(k.v).buffer),ix=new Uint16Array(bytes(k.i).buffer),out=new Float32Array(ix.length*6);let p=0;for(const index of ix)for(let c=0;c<6;c++)out[p++]=v[index*6+c];return out;}\n"+
  "const api=Object.freeze({kind:'human-bodies-v1',stride:6,kinds:Object.freeze(Object.keys(kinds)),triangles:Object.freeze(Object.fromEntries(Object.keys(kinds).map(k=>[k,kinds[k].triangles]))),sizes:Object.freeze(Object.fromEntries(Object.keys(kinds).map(k=>[k,kinds[k].size]))),geometry});\n"+
  "G.RealmBodyMeshes=api;if(typeof module!=='undefined')module.exports=api;\n})(globalThis);\n";
}
if(require.main===module){
 const text=bake(fs.readFileSync(source,'utf8'));
 if(process.argv.includes('--check')){
  assert.equal(fs.readFileSync(target,'utf8'),text,'checked-in body module reproduces from the source');
  console.log('body module reproduces from source, SHA256 '+crypto.createHash('sha256').update(text).digest('hex'));
 }else{
  fs.writeFileSync(target,text);
  console.log('wrote '+path.relative(root,target)+' ('+text.length+' bytes)');
 }
}
module.exports={bake};
