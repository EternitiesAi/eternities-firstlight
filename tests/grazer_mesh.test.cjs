/* Validate the exported asset without trusting Blender's authoring report. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.join(__dirname,'../assets/source/moss-grazer'),payload=fs.readFileSync(path.join(dir,'GRAZER_BODY.json'),'utf8'),asset=JSON.parse(payload),report=JSON.parse(fs.readFileSync(path.join(dir,'AUTHORING_REPORT.json'),'utf8'));
const raw=asset.vertices,points=[],faces=[],ids=new Map();
for(let i=0;i<raw.length;i+=18){const f=[];for(let j=0;j<3;j++){const p=raw.slice(i+j*6,i+j*6+3),key=p.join(',');if(!ids.has(key)){ids.set(key,points.length);points.push(p);}f.push(ids.get(key));}faces.push(f);}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0);
test('baked asset is finite stride6, economical and precisely source-hashed',()=>{
 assert.equal(asset.kind,'earth-grazer-body-v1');assert.equal(asset.stride,6);assert.equal(raw.length%18,0);assert.ok(raw.every(Number.isFinite));
 assert.ok(faces.length>100&&faces.length<=1000);assert.equal(faces.length,report.triangles);
 assert.equal(crypto.createHash('sha256').update(payload).digest('hex'),report.jsonSha256);
 for(let i=0;i<raw.length;i+=6)assert.ok(Math.abs(Math.hypot(...raw.slice(i+3,i+6))-1)<2e-6,'normalized exported smooth normal');
});
test('exported torso is one closed consistently wound manifold with real volume',()=>{
 const edges=new Map(),adjacency=points.map(()=>new Set());let volume=0;
 for(const f of faces){assert.equal(new Set(f).size,3);const[a,b,c]=f.map(i=>points[i]),n=cross(sub(b,a),sub(c,a));assert.ok(Math.hypot(...n)>1e-9,'no degenerate exported triangle');volume+=dot(a,cross(b,c))/6;
  for(let i=0;i<3;i++){const a=f[i],b=f[(i+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');if(!edges.has(key))edges.set(key,[]);edges.get(key).push([a,b]);adjacency[a].add(b);adjacency[b].add(a);}
 }
 for(const uses of edges.values()){assert.equal(uses.length,2,'each edge belongs to exactly two faces');assert.equal(uses[0][0],uses[1][1]);assert.equal(uses[0][1],uses[1][0]);}
 const visited=new Set([0]),queue=[0];for(let i=0;i<queue.length;i++)for(const id of adjacency[queue[i]])if(!visited.has(id)){visited.add(id);queue.push(id);}assert.equal(visited.size,points.length,'no disconnected intersecting body islands');
 assert.ok(volume>.15&&volume<.8,'positive bounded torso volume');
});
test('actual asset retains the original body envelope without enlarging movement reserves',()=>{
 for(const p of points){assert.ok(p[0]>=-.40&&p[0]<=.40);assert.ok(p[1]>=.47&&p[1]<=1.20);assert.ok(p[2]>=-.92&&p[2]<=.67);}
 const min=axis=>Math.min(...points.map(p=>p[axis])),max=axis=>Math.max(...points.map(p=>p[axis]));
 assert.ok(max(2)-min(2)>1.4,'retains full long body');assert.ok(max(0)-min(0)>.68,'retains ribcage volume');
 assert.ok(max(1)-min(1)>.58,'retains full torso height');
});


const E=require('../src/engine.js'),body=require('../src/earth-grazer-body-shape.js');
const expected=new Float32Array(asset.vertices);
const PRIOR_GEOMETRY={box:'e8d0b82261a50b117086e715e953b7d62d49a4ae176177f501fd16ef318dd48d',round:'488a3d300bc25f8e50dc5586e63e3d7ebef6b5b193f8f82d542c210df42e2637',octa:'cbe34bc9f3e3bbcda121c484b16a0bc564d9e980bf43346204303d91b3b4e150',disc:'6a9b1c7d4b987b12bdd1a09904557efa69f926af47af26c5551be4659ee7ab6c','traveler-cloth':'0a6658d413ec6aeccf19558c42fd27663d73cadecdb481bded30aaa1c7b1b4b8','woodland-canopy':'6588f720421a3a3a2ed25777dc7dda85f9d433e1670f6baba1d8070531979d21'};
test('installed Engine consumes every exported position and smooth normal without a generic fallback',()=>{
 assert.deepEqual(E.geometry(body.kind),expected);assert.equal(E.meshStride(body.kind),6);
 for(const [kind,hash] of Object.entries(PRIOR_GEOMETRY))assert.equal(crypto.createHash('sha256').update(Buffer.from(E.geometry(kind).buffer)).digest('hex'),hash,'prior primitive bytes '+kind);
 const copy=body.geometry();copy.fill(0);assert.deepEqual(body.geometry(),expected,'caller cannot overwrite the baked source');
});
test('missing original mesh refuses instead of silently substituting another primitive',()=>{
 const live=globalThis.RealmEarthGrazerBodyShape;try{globalThis.RealmEarthGrazerBodyShape=undefined;assert.throws(()=>E.geometry(body.kind),/Load the original grazer/);}finally{globalThis.RealmEarthGrazerBodyShape=live;}
});
test('actual batch uploads one58,752-byte mesh with stride24 and retains non-solid transformed instances',()=>{
 let next=0;const calls=[],attributes=[];
 const gl={ARRAY_BUFFER:1,STATIC_DRAW:2,DYNAMIC_DRAW:3,FLOAT:4,createBuffer:()=>({id:++next}),createVertexArray:()=>({id:++next}),bindBuffer(){},bindVertexArray(){},enableVertexAttribArray(){},vertexAttribDivisor(){},vertexAttribPointer(...a){attributes.push(a);},bufferData(target,data,mode){calls.push({target,mode,data:new Float32Array(data)});}};
 const e=Object.create(E.Engine.prototype);Object.assign(e,{gl,meshes:new Map(),batches:[],dynamic:[]});
 const item={p:[-162,1.57,-79],s:[1,1,1],r:[0,.8,0],c:0x647982,rough:.96,cameraSolid:false,cutaway:false,appearanceOnly:true,grazerActor:'elderweald-moss-grazer-v1',grazerPart:'long-body'};
 const b=e.batch(body.kind,[item],true);
 assert.equal(b.geom.count,2448);assert.equal(b.geom.stride,6);assert.equal(calls[0].data.byteLength,58752);assert.deepEqual(calls[0].data,expected);
 assert.deepEqual(attributes.slice(0,2),[[0,3,gl.FLOAT,false,24,0],[1,3,gl.FLOAT,false,24,12]]);
 assert.equal(b.count,1);assert.equal(b.data.byteLength,96);assert.deepEqual(Array.from(b.data.slice(0,16)),Array.from(E.M.compose(...item.p,...item.s,...item.r)));assert.deepEqual(b.cameraSolids,[]);
 const second=e.batch(body.kind,[],true);assert.strictEqual(second.geom,b.geom);assert.equal(calls.filter(c=>c.data.length===expected.length).length,1,'shared mesh uploaded only once');
});

test('checked-in baked module reproduces from exact exported source without Blender',()=>{
 const source=fs.readFileSync(path.join(dir,'GRAZER_BODY.json'));
 assert.equal(fs.readFileSync(path.join(__dirname,'../src/earth-grazer-body-shape.js'),'utf8'),require('../tools/bake_grazer_body.cjs').bake(source));
});
