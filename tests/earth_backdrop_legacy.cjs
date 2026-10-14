'use strict';
const assert=require('node:assert/strict');
// Explicit PR78-to-backdrop comparison allowance. Only these thirty old tree
// origins are reconstructed; the old literal hash still covers every size,
// material, hill, foreground object, random sample and camera/terrain flag.
// Actual new root placement is verified against renderer triangles separately.
function legacyTreePlacement(parts){
 const seen=new Set();
 const result=parts.map(p=>{
  if(!Object.hasOwn(p,'earthBackdropTree'))return p;
  const id=p.earthBackdropTree,layer=p.earthBackdropLayer;
  assert.ok(Number.isInteger(id)&&id>=1&&id<=30);
  assert.ok(Number.isInteger(layer)&&layer>=-1&&layer<=2);
  assert.equal(p.kind,layer===-1?'cylinder':'cone');
  const key=id+':'+layer;assert.ok(!seen.has(key));seen.add(key);
  const i=id-1,side=i%2?1:-1,s=.75+(i%4)*.16;
  const out=structuredClone(p);delete out.earthBackdropTree;delete out.earthBackdropLayer;
  out.p=[side*(27+(i%5)*2.1),-.3+(layer<0?0:(1.45+layer*.86)*s),-48+Math.floor(i/2)*5.2];
  return out;
 });
 assert.equal(seen.size,120,'exactly thirty four-piece tree placements, no other scene allowance');
 return result;
}
module.exports={legacyTreePlacement};
