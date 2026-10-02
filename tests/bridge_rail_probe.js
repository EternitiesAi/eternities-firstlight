/* Framebuffer probe of actual submitted bridge/traveller geometry. Test-only
 * leg-ID colors locate subject pixels; all counts use the original-color
 * clear-rail reference, with the original solid shadow held fixed. */
()=>{
 const e=new RealmEngine.Engine(document.createElement('canvas'));
 e.resize(800,600,1);e.clear();e.theme='earth';e.earthWater=RealmEarth.BRIDGE;
 e.quality='balanced';e.cloudsEnabled=false;e.waterStill=true;e.railCutawayActive=true;
 const parts=Realm.test.bridge().parts.filter(p=>p.bridgePart),body=Realm.test.traveler().parts;
 const rail=e.batch('box',parts.filter(p=>p.bridgeRail),false,{railCutaway:true});
 for(const kind of new Set(parts.map(p=>p.kind)))e.batch(kind,parts.filter(p=>p.kind===kind&&!p.bridgeRail));
 const actors=[];
 for(const kind of new Set(body.map(p=>p.kind)))actors.push(e.batch(kind,body.filter(p=>p.kind===kind)));
 const originalRails=rail.items,originalBody=actors.map(b=>b.items),g=e.gl;
 const read=f=>{g.bindFramebuffer(g.FRAMEBUFFER,f.f);const a=new Uint8Array(f.w*f.h*4);g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
 const diff=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0);
 // A color target encodes the existing depth texture for exact shadow checks.
 const vs=g.createShader(g.VERTEX_SHADER),fs=g.createShader(g.FRAGMENT_SHADER);
 g.shaderSource(vs,'#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}');g.compileShader(vs);
 g.shaderSource(fs,'#version 300 es\nprecision highp float;uniform sampler2D d;out vec4 c;void main(){float v=texelFetch(d,ivec2(gl_FragCoord.xy),0).r;c=vec4(v,fract(v*255.),fract(v*65025.),1.);}');g.compileShader(fs);
 const program=g.createProgram();g.attachShader(program,vs);g.attachShader(program,fs);g.linkProgram(program);
 if(!g.getProgramParameter(program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(program));
 const shadowTarget=g.createFramebuffer(),shadowColor=g.createTexture();g.bindTexture(g.TEXTURE_2D,shadowColor);g.texImage2D(g.TEXTURE_2D,0,g.RGBA8,e.shadowSize,e.shadowSize,0,g.RGBA,g.UNSIGNED_BYTE,null);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.NEAREST);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST);g.bindFramebuffer(g.FRAMEBUFFER,shadowTarget);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,shadowColor,0);
 const shadow=()=>{g.bindFramebuffer(g.FRAMEBUFFER,shadowTarget);g.viewport(0,0,e.shadowSize,e.shadowSize);g.disable(g.DEPTH_TEST);g.useProgram(program);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,e.shadowTex);g.uniform1i(g.getUniformLocation(program,'d'),0);g.bindVertexArray(e.emptyVAO);g.drawArrays(g.TRIANGLES,0,3);return read({f:shadowTarget,w:e.shadowSize,h:e.shadowSize});};
 const draw=()=>e.render(1,16,false),cases=[];
 // Translate the real submitted pose; no invented mannequin or gameplay grant.
 const origin=Realm.diagnostics.adventure.player;
 for(const projection of['perspective','orthographic'])for(const side of[-1,1])for(const x of[-1.29,0,1.29])for(const z of[19.5,20.65]){
  rail.items=originalRails;e.updateBatch(rail);
  actors.forEach((b,k)=>{b.items=originalBody[k].map(p=>{const q={...p,m:p.m?new Float32Array(p.m):undefined,p:p.p?.slice()};if(q.m){q.m[12]+=x-origin.x;q.m[14]+=z-origin.z;}else{q.p[0]+=x-origin.x;q.p[2]+=z-origin.z;}return q;});e.updateBatch(b);});
  const target=[x,RealmEarth.BRIDGE.deck+(projection==='perspective'?1.5:.5),z];
  const distance=projection==='perspective'?14.5:75,angle=projection==='perspective'?.14:.39;
  e.setCamera({eye:[x+side*Math.cos(angle)*distance,target[1]+Math.sin(angle)*distance,z],target,projection,fov:60,half:9,aspect:4/3});
  e.cutawayFocus=[x,RealmEarth.BRIDGE.deck+.88,z];e.cutaway=false;e.lastShadow=-1;draw();
  const off=read(e.mainF),refOff=read(e.refF),shadowOff=shadow();
  e.cutaway=true;e.lastShadow=-1;draw();const on=read(e.mainF),refOn=read(e.refF),shadowOn=shadow();
  rail.items=[];e.updateBatch(rail);draw();const clear=read(e.mainF);
  // ID coverage excludes other body parts by depth, and remains grounded in
  // the actual lower-leg meshes and transforms, not a screen rectangle guess.
  actors.forEach(b=>{b.items=b.items.map(p=>({...p,c:/-(shin|boot|boot-cuff)$/.test(p.part)?[1,0,1]:[0,0,0],em:/-(shin|boot|boot-cuff)$/.test(p.part)?2:0}));e.updateBatch(b);});e.noWater=true;draw();const id=read(e.mainF);e.noWater=false;
  let mask=0,before=0,after=0;
  for(let i=0;i<id.length;i+=4)if(id[i]>80&&id[i+2]>80&&id[i]>id[i+1]*3&&id[i+2]>id[i+1]*3){mask++;const matches=a=>Math.max(...[0,1,2].map(c=>Math.abs(a[i+c]-clear[i+c])))<=2;if(matches(off))before++;if(matches(on))after++;}
  cases.push({projection,side,x,z,legReferencePixels:mask,beforeLegPixels:before,afterLegPixels:after,revealed:after-before,missingBefore:mask-before,reflectionChanged:diff(refOff,refOn),shadowChanged:diff(shadowOff,shadowOn)});
 }
 actors.forEach((b,k)=>{b.items=originalBody[k];e.updateBatch(b);});
 rail.items=originalRails.filter(p=>p.p[0]>0);e.updateBatch(rail);
 // West-facing view: the eastern rail is behind the entire lower body.
 e.setCamera({eye:[-14.5,5,origin.z],target:[0,2.8,origin.z],projection:'perspective',fov:60,half:9,aspect:4/3});e.cutawayFocus=[0,RealmEarth.BRIDGE.deck+.88,origin.z];
 e.cutaway=false;e.lastShadow=-1;draw();const farOff=read(e.mainF);e.cutaway=true;e.lastShadow=-1;draw();const farRailChanged=diff(farOff,read(e.mainF));
 rail.items=originalRails;e.updateBatch(rail);e.railCutawayActive=false;e.cutaway=false;draw();const outsideOff=read(e.mainF);e.cutaway=true;draw();const outsideSpanChanged=diff(outsideOff,read(e.mainF));
 e.railCutawayActive=true;e.theme='valley';e.cutaway=false;draw();const realmOff=read(e.mainF);e.cutaway=true;draw();const nonEarthChanged=diff(realmOff,read(e.mainF));
 const result={method:'Original-color leg pixels match clear-rail reference; test-only ID color mask uses actual submitted shin/boot meshes. Translated actual pose is a synthetic boundary fixture, not player movement.',cases,farRailChanged,outsideSpanChanged,nonEarthChanged,glError:g.getError()};
 g.deleteFramebuffer(shadowTarget);g.deleteTexture(shadowColor);g.deleteProgram(program);g.deleteShader(vs);g.deleteShader(fs);e.disposeSurfaceMaterials();g.getExtension('WEBGL_lose_context')?.loseContext();return result;
}
