'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../src/engine.js'),'utf8');

// These fixtures exercise loader ownership without pretending to decode images
// or compile GLSL. The browser gate supplies actual encoded maps and WebGL2.
function assets(){
 const h=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(h);h.writeUInt32BE(13,8);h.write('IHDR',12);h.writeUInt32BE(512,16);h.writeUInt32BE(512,20);h[24]=8;
 return {version:1,timber:{id:'earth-weathered-timber-v1',width:512,height:512,maps:{color:'data:image/jpeg;base64,/9j/AAAA',roughness:'data:image/png;base64,'+h.toString('base64')}}};
}
function harness(data=assets()){
 let sequence=0,currentBuffer=null,active='TEXTURE0';const bindings=new Map(),state=new Map(),uniforms=new Map(),images=[],listeners=new Map();
 const uploads=[],deleted=[],draws=[],buffers=new Map(),pointers=[];
 const gl=new Proxy({lost:false,uploadError:0,throwUpload:false,
  getParameter(p){if(p==='ACTIVE_TEXTURE')return active;if(p==='TEXTURE_BINDING_2D')return bindings.get(active)||null;if(p==='UNPACK_ALIGNMENT')return state.has(p)?state.get(p):4;return state.has(p)?state.get(p):false;},
  activeTexture(v){active=v;},bindTexture(t,v){bindings.set(active,v);},pixelStorei(p,v){state.set(p,v);},
  bindBuffer(t,b){currentBuffer=b;},bufferData(t,d){buffers.set(currentBuffer,Array.from(d));},vertexAttribPointer(...p){pointers.push(p);},
  texImage2D(...args){const im=args.at(-1);if(im?.testImage){uploads.push({args,texture:bindings.get(active)});if(this.throwUpload)throw new Error('Synthetic upload refusal');}},
  deleteTexture(v){deleted.push(v);},getError(){const e=this.uploadError;this.uploadError=0;return e;},isContextLost(){return this.lost;},
  getShaderParameter(){return true;},getProgramParameter(){return true;},getUniformLocation(p,n){return n;},
  uniform1f(n,v){uniforms.set(n,v);},uniform1i(n,v){uniforms.set(n,v);},uniform3fv(n,v){uniforms.set(n,Array.from(v));},
  drawArraysInstanced(...args){draws.push({args,timber:uniforms.get('uTimberOn'),cutaway:uniforms.get('uCutaway')});},
  NO_ERROR:0
 },{get(o,k){if(k in o)return o[k];if(k.startsWith('create'))return ()=>({resource:k,id:++sequence});if(k.toUpperCase()===k)return k;return ()=>{};}});
 class Image{
  constructor(){this.testImage=true;this.naturalWidth=512;this.naturalHeight=512;images.push(this);}
  load(w=512,h=512){this.naturalWidth=w;this.naturalHeight=h;this.onload?.();}
  fail(){this.onerror?.();}
  removeAttribute(){this.retired=true;this.src='';}
 }
 const canvas={style:{},width:400,height:300,clientWidth:400,clientHeight:300,getContext:()=>gl,addEventListener:(name,f)=>listeners.set(name,f)};
 const context=vm.createContext({RealmSurfaceAssets:data,Image,atob:s=>Buffer.from(s,'base64').toString('binary'),performance:{now:()=>++sequence},Float32Array,console});
 vm.runInContext(source,context);const e=new context.RealmEngine.Engine(canvas);
 return {e,gl,images,listeners,uploads,deleted,draws,buffers,pointers,uniforms,canvas};
}
const item={p:[1,3,2],s:[2.25,.16,.31],c:0x6d5538,rough:.87,wet:.2,cutaway:true};
function draw(h,reflection=false,depth=false){
 h.e.geometryPass(depth?h.e.depthP:h.e.program,h.e.vp,h.e.palette(16,false),0,h.e.camera.eye,reflection,depth);
 return h.draws.at(-1);
}

test('both decoded maps are required; scene clear neither cancels nor reloads engine maps',()=>{
 const h=harness();h.e.batch('timber-panel',[item]);assert.equal(h.images.length,2);assert.equal(h.e.surfaceMaterialInfo.status,'loading');
 h.images[0].load();assert.equal(h.uploads.length,0);assert.equal(draw(h).timber,0);
 h.e.clear();assert.equal(h.images.length,2);assert.equal(h.e.surfaceMaterialInfo.status,'loading');
 h.images[1].load();assert.equal(h.uploads.length,2);assert.equal(h.e.surfaceMaterialInfo.ready,true);
 assert.equal(h.e.surfaceMaterialInfo.totalTextureBytes,1747625);assert.equal(h.e.surfaceMaterialInfo.textureBytes,1310720);assert.equal(h.e.surfaceMaterialInfo.mipmapBytes,436905);
 assert.ok(h.e.surfaceMaterialInfo.decodeWallMs>0);assert.ok(h.e.surfaceMaterialInfo.uploadCpuMs>0);
 const color=h.uploads[0].texture,rough=h.uploads[1].texture;
 h.e.clear();h.e.initSurfaceMaterials();assert.equal(h.images.length,2);assert.equal(h.e.surfaceMaterialInfo.status,'ready');assert.ok(!h.deleted.includes(color)&&!h.deleted.includes(rough));
 h.e.batch('timber-panel',[item]);assert.equal(draw(h).timber,1);h.e.surfaceMaterialsEnabled=false;assert.equal(draw(h).timber,0);
});

test('missing maps and incompatible contracts stay usable with untextured fallback',()=>{
 for(const mutate of [a=>{a.version=2;},a=>{a.timber.width=1024;},a=>{a.timber.maps.color='https://example.invalid/map.jpg';},a=>{a.timber.maps.roughness=a.timber.maps.color;},a=>{a.timber.maps.color='data:image/jpeg;base64,a===';},a=>{a.timber.calibration={crop:[0,1,0,1],stripMeanLinearRGB:[.1,.1,.1]};}]){
  const a=assets();mutate(a);const h=harness(a);assert.equal(h.e.surfaceMaterialInfo.status,'error');assert.equal(h.e.surfaceMaterialInfo.ready,false);assert.equal(h.images.length,0);h.e.batch('timber-panel',[item]);assert.equal(draw(h).timber,0);
 }
 const missing=harness(null);assert.equal(missing.e.surfaceMaterialInfo.status,'unavailable');assert.equal(missing.images.length,0);
});

test('PNG payload type and grayscale header are checked before decoding',()=>{
 const a=assets(),h=Buffer.from(a.timber.maps.roughness.split(',')[1],'base64');h[25]=2;
 a.timber.maps.roughness='data:image/png;base64,'+h.toString('base64');const out=harness(a);
 assert.equal(out.images.length,0);assert.match(out.e.surfaceMaterialInfo.error,/grayscale PNG/);
});

test('decode errors and wrong decoded dimensions cancel peers and stale completions',()=>{
 for(const finish of [image=>image.fail(),image=>image.load(1,1)]){
  const h=harness(),late=h.images[1].onload;finish(h.images[0]);
  assert.equal(h.e.surfaceMaterialInfo.status,'error');assert.ok(h.e.surfaceMaterialInfo.error);assert.equal(h.e.surfaceMaterialInfo.ready,false);assert.ok(h.images.every(i=>i.retired));
  late();assert.equal(h.uploads.length,0);assert.equal(h.e.surfaceMaterialInfo.status,'error');
 }
});

test('failed uploads free temporary maps and restore shared texture/unpack state',()=>{
 for(const error of ['exception','gl-error']){
  const h=harness(),other={external:true};h.gl.activeTexture('TEXTURE3');h.gl.bindTexture('TEXTURE_2D',other);h.gl.activeTexture('TEXTURE2');
  h.gl.pixelStorei('UNPACK_FLIP_Y_WEBGL',true);h.gl.pixelStorei('UNPACK_PREMULTIPLY_ALPHA_WEBGL',true);h.gl.pixelStorei('UNPACK_COLORSPACE_CONVERSION_WEBGL','BROWSER_DEFAULT_WEBGL');h.gl.pixelStorei('UNPACK_ALIGNMENT',8);
  if(error==='exception')h.gl.throwUpload=true;else h.gl.uploadError=1282;
  h.images[0].load();h.images[1].load();assert.equal(h.e.surfaceMaterialInfo.status,'error');assert.equal(h.e.surfaceMaterialInfo.totalTextureBytes,0);assert.equal(h.e._surfaceTextures,null);
  assert.ok(h.uploads.every(u=>h.deleted.includes(u.texture)));assert.ok(!h.deleted.includes(other));
  assert.equal(h.gl.getParameter('ACTIVE_TEXTURE'),'TEXTURE2');h.gl.activeTexture('TEXTURE3');assert.equal(h.gl.getParameter('TEXTURE_BINDING_2D'),other);
  for(const [k,v]of [['UNPACK_FLIP_Y_WEBGL',true],['UNPACK_PREMULTIPLY_ALPHA_WEBGL',true],['UNPACK_COLORSPACE_CONVERSION_WEBGL','BROWSER_DEFAULT_WEBGL'],['UNPACK_ALIGNMENT',8]])assert.equal(h.gl.getParameter(k),v);
 }
});

test('map-only disposal invalidates in-flight completions and deletes only owned ready textures',()=>{
 const pending=harness(),callbacks=pending.images.map(i=>i.onload);pending.e.disposeSurfaceMaterials();callbacks.forEach(f=>f());
 assert.equal(pending.uploads.length,0);assert.equal(pending.e.surfaceMaterialInfo.status,'disposed');
 const ready=harness();ready.images.forEach(i=>i.load());const owned=ready.uploads.map(u=>u.texture);ready.e.disposeSurfaceMaterials();
 assert.deepEqual(ready.deleted,owned);assert.equal(ready.e.surfaceMaterialInfo.ready,false);assert.equal(ready.e.surfaceMaterialInfo.totalTextureBytes,0);
 ready.e.batch('timber-panel',[item]);assert.equal(draw(ready).timber,0);ready.e.disposeSurfaceMaterials();assert.deepEqual(ready.deleted,owned);
});

test('two engines independently own their decoders and uploaded maps',()=>{
 const h=harness(),second=new h.e.constructor(h.canvas);assert.equal(h.images.length,4);
 h.images.slice(0,2).forEach(i=>i.load());assert.equal(h.e.surfaceMaterialInfo.ready,true);assert.equal(second.surfaceMaterialInfo.ready,false);
 h.images.slice(2).forEach(i=>i.load());assert.equal(second.surfaceMaterialInfo.ready,true);assert.equal(h.uploads.length,4);
 h.e.disposeSurfaceMaterials();assert.ok(h.uploads.slice(0,2).every(u=>h.deleted.includes(u.texture)));assert.ok(h.uploads.slice(2).every(u=>!h.deleted.includes(u.texture)));assert.equal(second.surfaceMaterialInfo.ready,true);
});

test('context loss invalidates images and maps with no restoration or later upload',()=>{
 const h=harness(),callbacks=h.images.map(i=>i.onload);h.gl.lost=true;h.listeners.get('webglcontextlost')();callbacks.forEach(f=>f());
 assert.equal(h.e.surfaceMaterialInfo.status,'context-lost');assert.equal(h.uploads.length,0);assert.equal(h.e._surfaceTextures,null);
 h.e.render(1,16,false);assert.equal(h.draws.length,0);h.gl.lost=false;h.e.initSurfaceMaterials();callbacks.forEach(f=>f());assert.equal(h.uploads.length,0);assert.equal(h.e.surfaceMaterialInfo.status,'context-lost');
 const ready=harness();ready.images.forEach(i=>i.load());ready.gl.lost=true;ready.listeners.get('webglcontextlost')();assert.equal(ready.e._surfaceTextures,null);assert.equal(ready.e.surfaceMaterialInfo.ready,false);assert.equal(ready.e.surfaceMaterialInfo.totalTextureBytes,0);
});

test('timber shares exact box geometry and collision extent with complete grain-oriented face UVs',()=>{
 const h=harness(null),box=h.e.batch('box',[item]),timber=h.e.batch('timber-panel',[item]),positions=h.buffers.get(box.geom.buffer),uv=h.buffers.get(timber.geom.buffer);
 assert.equal(box.geom.count,36);assert.equal(timber.geom.count,36);assert.equal(uv.length,36*8);
 for(let vertex=0;vertex<36;vertex++){
  assert.deepEqual(uv.slice(vertex*8,vertex*8+6),positions.slice(vertex*6,vertex*6+6));
  const u=uv[vertex*8+6],v=uv[vertex*8+7];assert.ok(u>=.0999&&u<=.2001);assert.ok(v===0||v===1);
 }
 const bounds=h.e.cameraSolids;assert.deepEqual(bounds[0],bounds[1]);assert.deepEqual(Array.from(box.data),Array.from(timber.data));
 assert.ok(h.pointers.some(p=>p[0]===8&&p[1]===2&&p[4]===32&&p[5]===24));
 // The top's grain coordinate follows X and strip coordinate follows Z, not
 // individual triangle winding; diagonal vertices therefore share exact UVs.
 const top=[];for(let o=0;o<uv.length;o+=8)if(uv[o+4]===1)top.push(uv.slice(o,o+8));
 for(const p of top){assert.ok(Math.abs(p[7]-(p[0]+.5))<1e-6);assert.ok(Math.abs(p[6]-(.1+.1*(p[2]+.5)))<1e-6);}
});

test('material flags stay per batch; reflection uses material while depth and cutaway retain their scope',()=>{
 const h=harness();h.images.forEach(i=>i.load());h.e.cutaway=true;h.e.batch('timber-panel',[item]);h.e.batch('box',[item]);
 draw(h);assert.deepEqual(h.draws.slice(-2).map(d=>d.timber),[1,0]);assert.deepEqual(h.draws.slice(-2).map(d=>d.cutaway),[1,1]);
 draw(h,true);assert.deepEqual(h.draws.slice(-2).map(d=>d.timber),[1,0]);assert.deepEqual(h.draws.slice(-2).map(d=>d.cutaway),[0,0]);
 const before=h.e.texturedCalls;draw(h,false,true);assert.equal(h.e.texturedCalls,before);
 h.e.render(1,16,false);assert.equal(h.e.metrics.texturedInstances,1);assert.equal(h.e.metrics.texturedDrawCalls,2);assert.equal(h.e.metrics.instances,2);assert.equal(h.e.metrics.triangles,24);
 h.e.quality='low';h.e.render(2,16,false);assert.equal(h.e.metrics.texturedDrawCalls,1);assert.equal(h.e.metrics.texturedInstances,1);
 h.e.surfaceMaterialsEnabled=false;h.e.render(3,16,false);assert.equal(h.e.metrics.texturedDrawCalls,0);assert.equal(h.e.metrics.texturedInstances,0);assert.equal(h.e.metrics.surfaceMaterials.enabled,false);
});
