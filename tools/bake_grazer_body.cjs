/* Deterministic offline mesh packing. No Blender, network or browser needed. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=path.join(root,'assets/source/moss-grazer/GRAZER_BODY.json'),target=path.join(root,'src/earth-grazer-body-shape.js');
function bake(bytes){
 const body=JSON.parse(bytes);assert.equal(body.kind,'earth-grazer-body-v1');assert.equal(body.stride,6);
 assert.equal(body.vertices.length,14688);assert.ok(body.vertices.every(Number.isFinite));
 // Preserve Blender's negative zero as well as its positions and smooth normals.
 const scalar=v=>Object.is(v,-0)?'-0':String(v),vertices=[],indices=[],seen=new Map();
 for(let i=0;i<body.vertices.length;i+=6){const vertex=body.vertices.slice(i,i+6),key=vertex.map(scalar).join(',');if(!seen.has(key)){seen.set(key,vertices.length/6);vertices.push(...vertex);}indices.push(seen.get(key));}
 assert.equal(vertices.length/6,410);assert.equal(indices.length,2448);
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 return "/* Original Blender grazer torso. Baked asset SHA256 "+hash+".\n * Exact indexed position/normal tuples; regenerate with tools/bake_grazer_body.cjs. */\n(function(G){'use strict';\nconst vertices=Object.freeze(["+vertices.map(scalar).join(',')+"]),indices=Object.freeze("+JSON.stringify(indices)+");\nfunction geometry(){const out=new Float32Array(indices.length*6);let p=0;for(const index of indices)for(let k=0;k<6;k++)out[p++]=vertices[index*6+k];return out;}\nconst api=Object.freeze({kind:'earth-grazer-body-v1',stride:6,geometry});\nG.RealmEarthGrazerBodyShape=api;if(typeof module!=='undefined')module.exports=api;\n})(globalThis);\n";
}
if(require.main===module){
 const mode=process.argv[2];if(!['--check','--write'].includes(mode)||process.argv.length!==3)throw Error('Use node tools/bake_grazer_body.cjs --check or --write');
 const bytes=Buffer.from(bake(fs.readFileSync(source)));
 if(mode==='--write')fs.writeFileSync(target,bytes);else assert.deepEqual(fs.readFileSync(target),bytes,'Checked-in mesh must match the original export');
 console.log(JSON.stringify({status:'passed',mode,sourceBytes:fs.statSync(source).size,bakedBytes:bytes.length,vertices:410,triangles:816,gpuBytes:58752}));
}
module.exports={bake};
