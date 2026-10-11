'use strict';
// Installed-source transport checks. GL is a synthetic observer, not a renderer.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const engineSource=fs.readFileSync(path.join(ROOT,'src/engine.js'),'utf8');
const sceneTools=require(path.join(ROOT,'tests/helpers/woodland-scene.cjs'));

function observer({theme,channel=null,quality='balanced',projection='perspective',reducedMotion=false,noWater=false,interior=false}){
 let id=0,program=null;const calls=[],draws=[];
 const put=(name,value)=>calls.push({program,name,value});
 const gl=new Proxy({
  getShaderParameter:()=>true,getProgramParameter:()=>true,getUniformLocation:(p,n)=>n,
  useProgram:p=>{program=p.id;},uniform1f:put,uniform1i:put,
  uniform2fv:(n,v)=>put(n,Array.from(v)),uniform3fv:(n,v)=>put(n,Array.from(v)),uniform4fv:(n,v)=>put(n,Array.from(v)),
  uniformMatrix4fv:(n,t,v)=>put(n,Array.from(v)),drawArrays:(...args)=>draws.push(args),drawArraysInstanced:(...args)=>draws.push(args),
  getError:()=>0,getParameter:()=>null,isContextLost:()=>false,
 },{get(o,k){if(k in o)return o[k];if(k.startsWith('create'))return()=>({id:++id});if(k===k.toUpperCase())return k;return()=>{};}});
 const canvas={style:{},width:1,height:1,clientWidth:640,clientHeight:400,getContext:()=>gl,addEventListener(){}};
 const context={console,Float32Array,Uint8Array,performance:{now:()=>0}};
 vm.runInNewContext(engineSource,context);
 const e=new context.RealmEngine.Engine(canvas);
 Object.assign(e,{theme,earthWater:channel,quality,reducedMotion,noWater,isInterior:interior});
 e.setCamera({eye:[-20,5,19.5],target:[0,2,19.5],projection,fov:80,half:10,aspect:1.6});
 e.resize(640,400,1);e.render(2,16,false);
 const water=new Map(calls.filter(c=>c.program===e.waterP.id).map(c=>[c.name,c.value]));
 return{e,water,draws};
}
const channel={from:12,to:27,piers:[13.875,17.625,21.375,25.125]};

test('actual country transition clears a prior channel and retains supported banks and gameplay ownership',()=>{
 const {art,sim}=sceneTools.scene('balanced');
 art.e.earthWater=channel;globalThis.RealmWorldFoundationsArt.make(art,sim);
 assert.equal(art.e.theme,'earth');assert.equal(art.e.earthWater,null);
 assert.equal(art.e.noWater,false);assert.equal(art.e.isInterior,false);
 const h=observer({theme:art.e.theme,channel:art.e.earthWater});
 assert.equal(h.water.get('uEarthOpticsOn'),1);
 assert.equal(h.water.get('uEarth'),0);assert.equal(h.water.get('uPierCount'),0);
 assert.deepEqual(h.water.get('uEarthChannel'),[0,0,0,1]);
});

test('Earth appearance is independent of channel admission in both cameras and every quality',()=>{
 for(const quality of ['low','balanced','high'])for(const projection of ['perspective','orthographic'])for(const ch of [null,channel]){
  const h=observer({theme:'earth',channel:ch,quality,projection});
  assert.equal(h.water.get('uEarthOpticsOn'),1);
  assert.equal(h.water.get('uEarth'),ch?1:0);
  assert.equal(h.water.get('uPierCount'),ch?4:0);
  assert.deepEqual(h.water.get('uEarthChannel'),ch?[12,27,13.875,3.75]:[0,0,0,1]);
  assert.deepEqual(h.water.get('uEarthOptics'),[.62,4.5,.065,1]);
  assert.equal(h.water.get('uReflectionOn'),quality==='low'?0:1);
 }
});

test('other realms do not acquire Earth appearance or a stale channel',()=>{
 for(const theme of [null,'heaven','hell','cosmos','bellweather','sunward','underways']){
  const h=observer({theme,channel});
  assert.equal(h.water.get('uEarthOpticsOn'),0);assert.equal(h.water.get('uEarth'),0);
 }
});

test('reduced motion freezes water time and dry interiors never submit water uniforms',()=>{
 const h=observer({theme:'earth',reducedMotion:true});assert.equal(h.water.get('uTime'),0);
 for(const setting of [{noWater:true},{interior:true}]){
  assert.equal(observer({theme:'earth',...setting}).water.size,0);
 }
});
