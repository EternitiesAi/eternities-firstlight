'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../src/engine.js'),C=require('../src/core.js'),E=require('../src/earth.js');
for(const name of ['drover-art','millwright-art','mill-gate-art','quarry-art','bridge-art','earth-shoulder-art','earth-art'])require('../src/'+name+'.js');
function scene(){const all=[],a={e:{},map:{},begin(){},commit(){},beam(){},bench(){},box(...v){this.add('box',...v);},add(kind,x,y,z,sx,sy,sz,c,opt={}){const p={kind,p:[x,y,z],s:[sx,sy,sz],c,...opt};all.push(p);(this.map[kind]||(this.map[kind]=[])).push(p);}};globalThis.RealmEarthArt.make(a);return all;}
// Independent vertical triangle intersection, using the actual renderer mesh.
// Moving trees back into the old water-only line must fail this contact check.
function surface(parts,x,z){let top=-Infinity;for(const p of parts){if(Math.abs(x-p.p[0])>p.s[0]/2||Math.abs(z-p.p[2])>p.s[2]/2)continue;const mesh=R.geometry(p.kind),m=p.m||R.M.compose(...p.p,...p.s,...(p.r||[0,0,0]));for(let i=0;i<mesh.length;i+=18){const a=R.M.transform(m,mesh.slice(i,i+3)),b=R.M.transform(m,mesh.slice(i+6,i+9)),c=R.M.transform(m,mesh.slice(i+12,i+15));const d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(d)<1e-10)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/d,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/d,w=1-u-v;if(Math.min(u,v,w)>=-1e-7)top=Math.max(top,u*a[1]+v*b[1]+w*c[1]);}}return top;}
const trunks=all=>all.filter(p=>p.kind==='cylinder'&&p.c===0x6d7155);
const hills=all=>all.filter(p=>p.kind==='round'&&p.rough===1&&[0x60755d,0x75846b,0x647858].includes(p.c));
test('every distant conifer takes root in an actual rendered hill above the water',()=>{
 const all=scene(),trees=trunks(all),ground=hills(all);assert.equal(trees.length,30);assert.equal(ground.length,39);
 for(const tree of trees){const [x,y,z]=tree.p,contact=surface(ground,x,z);assert.ok(Number.isFinite(contact),`Tree ${x},${z} has no rendered ground`);assert.ok(contact>R.WATER_HEIGHT+.15,`Tree ${x},${z} is submerged`);assert.ok(y<=contact+.002&&y>=contact-.08,`Tree root ${y} must touch the rendered surface ${contact}`);}
});
test('each relocated trunk retains all three attached crown layers',()=>{
 const all=scene();
 for(const trunk of trunks(all)){const layers=all.filter(p=>p.earthBackdropTree===trunk.earthBackdropTree&&p.kind==='cone');assert.equal(layers.length,3);const scale=trunk.s[0]/.28;for(let j=0;j<3;j++){const p=layers.find(p=>p.earthBackdropLayer===j);assert.ok(p);assert.equal(p.p[0],trunk.p[0]);assert.equal(p.p[2],trunk.p[2]);assert.ok(Math.abs(p.p[1]-trunk.p[1]-(1.45+j*.86)*scale)<1e-10);}}
});
test('distant woodland has no walking, picking or camera authority and changes no world state',()=>{
 const world=C.fresh(),before=structuredClone(world),definition=JSON.stringify([E.PATCHES,E.SOLIDS,E.POINTS]),all=scene();
 for(const tree of trunks(all)){const[x,,z]=tree.p;assert.equal(E.land(x,z,0),false);assert.equal(E.pick([x,40,z],[0,-1,0]),null);assert.equal(tree.cameraSolid,false);assert.equal(R.solidBounds(tree.kind,tree),null);}
 assert.equal(JSON.stringify([E.PATCHES,E.SOLIDS,E.POINTS]),definition);assert.deepEqual(world,before);assert.deepEqual(scene(),all);
});
