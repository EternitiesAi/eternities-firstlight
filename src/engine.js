/* Eternities Firstlight 04: dependency-free WebGL2 renderer. Original procedural
 * geometry, instancing, soft shadows, water reflection, fog and tone mapping. */
(function(G){'use strict';
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{let l=Math.hypot(...a)||1;return a.map(v=>v/l);},hex=h=>{if(Array.isArray(h))return h;h=typeof h==='string'?parseInt(h.replace('#',''),16):h;return[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];},blend=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const M={identity:()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),mul(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;},ortho(l,r,b,t,n,f){let o=M.identity();o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);return o;},look(eye,target,up=[0,1,0]){let z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);},compose(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){let a=Math.cos(rx),b=Math.sin(rx),c=Math.cos(ry),d=Math.sin(ry),e=Math.cos(rz),f=Math.sin(rz);return new Float32Array([c*e*sx,(a*f+b*d*e)*sx,(b*f-a*d*e)*sx,0,-c*f*sy,(a*e-b*d*f)*sy,(b*e+a*d*f)*sy,0,d*sz,-b*c*sz,a*c*sz,0,x,y,z,1]);},transform(m,p){let w=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15];return[(m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12])/w,(m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13])/w,(m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14])/w];}};
// Reflection is a world-space involution. A mirrored lookAt rebuild changes
// handedness and flips the horizontal basis; sampling it with ordinary screen UV
// produced the backwards lake in Realm 03. Use P * V * H instead.
const WATER_HEIGHT = 0.01;
M.perspective = function(fov,aspect,near=.1,far=420) {
 if(![fov,aspect,near,far].every(Number.isFinite)||fov<=0||fov>=Math.PI||aspect<=0||near<=0||far<=near)throw new TypeError('Invalid perspective frustum');
 const f=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m;
};
// Camera clearance uses the rendered static shapes, including rotated walls.
// Foliage moves/cuts away; it must not pump the camera through every leaf.
function solidBounds(kind,it){
 // Static opaque shapes participate by default; dynamic props opt in to avoid
 // treating characters and combat effects as walls. Authors can opt out explicitly.
 if(it.cameraSolid===false||it.wind||['leaf','disc','ring'].includes(kind))return null;
 const bottom=['cylinder','cone','roof'].includes(kind)?0:kind==='octa'?-.65:-.5,top=bottom===0?1:kind==='octa'?.65:.5;
 const m=it.m||M.compose(...it.p,...it.s,...(it.r||[0,0,0])),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const x of [-.5,.5])for(const y of [bottom,top])for(const z of [-.5,.5])M.transform(m,[x,y,z]).forEach((v,i)=>{min[i]=Math.min(min[i],v);max[i]=Math.max(max[i],v);});
 return max[1]<1.9?null:{min,max};
}
M.reflectY = function(height=WATER_HEIGHT) {
 if (!Number.isFinite(height)) throw new TypeError('Finite water height required');
 const h=M.identity(); h[5]=-1; h[13]=2*height; return h;
};
function reflectionVP(viewProjection,height=WATER_HEIGHT) {
 return M.mul(viewProjection,M.reflectY(height));
}
// Clouds and their reflection share world rays. Mirroring an already-derived
// basis preserves horizontal handedness, unlike rebuilding a mirrored lookAt.
function skyFrame(camera,reflected=false){
 const forward=norm(sub(camera.target,camera.eye)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward);
 const mirror=v=>v.map((n,i)=>i===1&&reflected?-n:n);
 return{eye:camera.eye.map((n,i)=>i===1&&reflected?2*WATER_HEIGHT-n:n),right:mirror(right),up:mirror(up),forward:mirror(forward),perspective:camera.projection==='perspective',spread:camera.projection==='perspective'?Math.tan(camera.fov*Math.PI/360):camera.half,aspect:camera.aspect};
}
function geometry(kind){let v=[],timber=kind==='timber-panel';function tri(a,b,c){let n=norm(cross(sub(b,a),sub(c,a)));for(let p of[a,b,c]){v.push(...p,...(kind==='round'?norm(p):n));if(timber){
 // One board strip, with grain along local X; end faces use local Z. Deriving
 // UVs from position keeps both triangles and opposite faces in phase.
 const along=Math.abs(n[0])>.5?p[2]:p[0],across=Math.abs(n[1])>.5?p[2]:p[1];v.push(.1+(across+.5)*.1,along+.5);
 }}}function q(a,b,c,d){tri(a,b,c);tri(a,c,d);}
 if(kind==='box'||timber){let n=-.5,p=.5;q([n,n,p],[p,n,p],[p,p,p],[n,p,p]);q([p,n,n],[n,n,n],[n,p,n],[p,p,n]);q([p,n,p],[p,n,n],[p,p,n],[p,p,p]);q([n,n,n],[n,n,p],[n,p,p],[n,p,n]);q([n,p,p],[p,p,p],[p,p,n],[n,p,n]);q([n,n,n],[p,n,n],[p,n,p],[n,n,p]);}
 else if(kind==='bridge-vault'){
  // Metre-sized ellipse/spandrel in Y/Z, unit-width extrusion in X. The open
  // underside reaches y=1.1; its flat crown meets the deck at y=1.27.
  const point=(i,x,outer)=>{const t=i/12*Math.PI;return[x,outer?1.27:Math.sin(t)*1.1,Math.cos(t)*(outer?1.875:1.595)];};
  for(let i=0;i<12;i++){
   q(point(i,.5,false),point(i+1,.5,false),point(i+1,.5,true),point(i,.5,true));
   q(point(i,-.5,true),point(i+1,-.5,true),point(i+1,-.5,false),point(i,-.5,false));
   q(point(i+1,-.5,false),point(i+1,.5,false),point(i,.5,false),point(i,-.5,false));
   q(point(i,.5,true),point(i+1,.5,true),point(i+1,-.5,true),point(i,-.5,true));
  }
  q(point(0,.5,false),point(0,.5,true),point(0,-.5,true),point(0,-.5,false));
  q(point(12,-.5,false),point(12,-.5,true),point(12,.5,true),point(12,.5,false));
 }
 else if(kind==='bank-slope'){
  // Upper X=0 seam follows supported land; exposed rock falls steeply into
  // water at X~1. No horizontal cap or collision authority in this mesh.
  const ys=[1,.91,.57,.16,-.03];
  const p=(i,j)=>{const t=i/4,z=j/8-.5,rock=i>0&&i<4?.055*Math.sin(j*2.3+i*1.7):0;return[t*(1+.14*Math.sin(z*19)*t),ys[i]+rock,z];};
  for(let i=0;i<4;i++)for(let j=0;j<8;j++)q(p(i,j),p(i,j+1),p(i+1,j+1),p(i+1,j));
  for(let i=0;i<4;i++){
   tri([0,-.03,-.5],p(i,0),p(i+1,0));
   tri([0,-.03,.5],p(i+1,8),p(i,8));
  }
 }
 else if(kind==='mountain-ridge'){
  // Original bounded height mesh: asymmetric ridges, saddles and rock facets.
  // No texture/asset/importer; unlike cones the silhouette has multiple peaks.
  const p=(i,j)=>{const x=i/14-.5,z=j/12-.5,u=x*2,w=z*2;
   const ridge=Math.max(.94*Math.exp(-((u+.28)**2/.30+(w-.12)**2/.8)),.78*Math.exp(-((u-.36)**2/.18+(w+.36)**2/.25)),.64*Math.exp(-((u+.04)**2/.1+(w+.55)**2/.18)));
   const edge=Math.pow(Math.max(0,(1-Math.abs(u))*(1-Math.abs(w))),.28),rock=.88+.075*Math.sin(u*18+w*8)+.045*Math.sin(u*35-w*15);
   return[x,ridge*edge*rock,z];
  };
  for(let i=0;i<14;i++)for(let j=0;j<12;j++)q(p(i,j),p(i,j+1),p(i+1,j+1),p(i+1,j));
 }
 else if(kind==='round'){let n=16,m=10,p=(i,j)=>{let a=i/n*Math.PI*2,b=-Math.PI/2+j/m*Math.PI;return[Math.cos(a)*Math.cos(b)*.5,Math.sin(b)*.5,Math.sin(a)*Math.cos(b)*.5];};for(let i=0;i<n;i++)for(let j=0;j<m;j++)q(p(i,j),p(i,j+1),p(i+1,j+1),p(i+1,j));}
 else if(kind==='ring'){let n=24,m=6,p=(i,j)=>{let a=i/n*Math.PI*2,b=j/m*Math.PI*2,r=.44+.055*Math.cos(b);return[Math.cos(a)*r,Math.sin(a)*r,Math.sin(b)*.055];};for(let i=0;i<n;i++)for(let j=0;j<m;j++)q(p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1));}
 else if(kind==='roof'){let a=[-.5,0,-.5],b=[.5,0,-.5],c=[.5,0,.5],d=[-.5,0,.5],e=[0,1,-.5],f=[0,1,.5];tri(a,e,b);tri(d,c,f);q(a,d,f,e);q(b,e,f,c);q(a,b,c,d);}
 else if(kind==='leaf'){tri([-.32,0,0],[.14,1,0],[.32,0,0]);tri([.32,0,0],[.14,1,0],[-.32,0,0]);}
 else if(kind==='octa'){let top=[0,.65,0],bot=[0,-.65,0],p=[[.5,0,0],[0,0,.5],[-.5,0,0],[0,0,-.5]];for(let i=0;i<4;i++){tri(p[i],top,p[(i+1)%4]);tri(p[(i+1)%4],bot,p[i]);}}
 else{let n=kind==='cone'?12:16;for(let i=0;i<n;i++){let a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,lo=[Math.cos(a)*.5,0,Math.sin(a)*.5],lb=[Math.cos(b)*.5,0,Math.sin(b)*.5],hi=[lo[0],1,lo[2]],hb=[lb[0],1,lb[2]];if(kind==='cone')tri(lo,[0,1,0],lb);else if(kind==='disc')tri([0,0,0],lb,lo);else{q(lo,hi,hb,lb);tri([0,1,0],hb,hi);tri([0,0,0],lo,lb);}}}return new Float32Array(v);}
const VS=`#version 300 es
precision highp float;layout(location=0)in vec3 aPos;layout(location=1)in vec3 aNor;layout(location=2)in mat4 aModel;layout(location=6)in vec4 aColor;layout(location=7)in vec4 aParams;layout(location=8)in vec2 aUV;uniform mat4 uVP;uniform mat4 uLight;uniform float uTime;out vec3 vPos;out vec3 vNor;out vec4 vColor;out vec4 vParams;out vec4 vShadow;out vec2 vUV;
void main(){vec4 w=aModel*vec4(aPos,1.);float wind=aParams.z;if(wind>.5&&wind<1.5){w.x+=sin(w.x*.62+w.z*.39+uTime*1.25)*.12*aPos.y;w.z+=cos(w.x*.45+uTime)*.075*aPos.y;}if(wind>1.5&&wind<2.5){w.x+=sin(uTime*.8+w.z*.4)*.095;w.y+=cos(uTime+w.x*.4)*.05;}vec3 ss=vec3(dot(aModel[0].xyz,aModel[0].xyz),dot(aModel[1].xyz,aModel[1].xyz),dot(aModel[2].xyz,aModel[2].xyz));vNor=normalize(mat3(aModel)*(aNor/max(ss,vec3(.00001))));vPos=w.xyz;vColor=aColor;vParams=aParams;vUV=aUV;vShadow=uLight*vec4(w.xyz+vNor*.04,1.);gl_Position=uVP*w;}`;
const FS=`#version 300 es
precision highp float;in vec3 vPos;in vec3 vNor;in vec4 vColor;in vec4 vParams;in vec4 vShadow;in vec2 vUV;uniform sampler2D uShadow;uniform sampler2D uTimberColor;uniform sampler2D uTimberRoughness;uniform vec3 uTimberReference;uniform float uTimberOn;uniform vec3 uEye;uniform vec3 uSun;uniform vec3 uSunColor;uniform vec3 uFog;uniform float uSunPower;uniform float uAmbient;uniform float uShadowSize;uniform float uShadowOn;uniform float uWet;uniform float uNight;uniform float uClip;uniform vec3 uTorch;uniform float uTorchPower;uniform vec3 uFocus;uniform float uCutaway,uMountainHaze;uniform vec2 uMountainDepth;out vec4 frag;
float terrainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);vec2 k=vec2(127.1,311.7);float a=fract(sin(dot(i,k))*43758.5453),b=fract(sin(dot(i+vec2(1.,0.),k))*43758.5453),c=fract(sin(dot(i+vec2(0.,1.),k))*43758.5453),d=fract(sin(dot(i+1.,k))*43758.5453);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float shadow(vec3 n){if(uShadowOn<.5)return 1.;vec3 sc=vShadow.xyz/vShadow.w*.5+.5;if(sc.x<0.||sc.y<0.||sc.x>1.||sc.y>1.||sc.z>1.)return 1.;float b=max(.0030*(1.-dot(n,uSun)),.00135),s=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(uShadow,sc.xy+vec2(x,y)/uShadowSize).r;s+=sc.z-b>d?.25:1.;}return s/9.;}
void main(){if(uClip>.5&&vPos.y<.025)discard;
 // Camera-only cutaway. Collision, enemies, reflection and shadow stay unchanged.
 if(uCutaway>.5&&vColor.a<.5){vec3 delta=vPos-uFocus,axis=normalize(uEye-uFocus);float along=dot(delta,axis);float radial=length(delta-axis*along);if(along>.65&&radial<1.7){float keep=mix(.12,1.,smoothstep(.9,1.7,radial));float pattern=mod(floor(gl_FragCoord.x)+2.*mod(floor(gl_FragCoord.y),2.),4.)/4.;if(pattern>=keep)discard;}}
 vec3 n=normalize(vNor),V=normalize(uEye-vPos),color=vColor.rgb;float rough=clamp(vParams.x,0.,1.),wet=vParams.w*uWet;
 // SRGB8_ALPHA8 decodes the JPEG to linear before filtering. Roughness is R8
 // non-color data. The bounded reference modulation is an artistic calibration
 // to the existing vertex palette, not a new physically based lighting model.
 if(uTimberOn>.5){color*=clamp(texture(uTimberColor,vUV).rgb/uTimberReference,vec3(.45),vec3(1.65));rough=texture(uTimberRoughness,vUV).r;}
 float grain=fract(sin(dot(floor(vPos.xyz*27.),vec3(127.1,73.4,311.7)))*43758.5453);color*=.99+.02*grain;if(n.y>.8&&vPos.y>1.16&&vPos.y<1.57&&rough>.84)color*=.88+.18*terrainNoise(vPos.xz*.8)+.065*terrainNoise(vPos.xz*4.);if(vParams.w<-.5&&n.y>.8)color*=.87+.2*terrainNoise(vPos.xz*.8)+.06*terrainNoise(vPos.xz*4.);if(vParams.z>2.5)color*=.86+.17*terrainNoise(vPos.xy*.095);float sh=shadow(n),ndl=max(dot(n,uSun),0.);vec3 lit=color*(uAmbient*(.60+.40*max(n.y,0.))*vec3(.83,.96,1.03)+uSunColor*ndl*sh*uSunPower);lit*=.9+clamp((vPos.y-.9)*.11,0.,.12);float spec=pow(max(dot(n,normalize(uSun+V)),0.),mix(12.,145.,clamp((1.-rough)+wet*.20,0.,1.)));lit+=uSunColor*spec*sh*uSunPower*(.07+wet*.38+(1.-rough)*.16);lit+=color*vParams.y*(.5+uNight*.7);vec2 p[11];p[0]=vec2(-5.,4.);p[1]=vec2(5.,4.);p[2]=vec2(-5.,-4.);p[3]=vec2(5.,-4.);p[4]=vec2(0.,13.);p[5]=vec2(-11.,-2.);p[6]=vec2(11.,2.);p[7]=vec2(0.,-12.);p[8]=vec2(37.,1.);p[9]=vec2(33.,7.);p[10]=vec2(25.,3.7);for(int i=0;i<11;i++){float d=length(vPos-vec3(p[i].x,2.7,p[i].y));lit+=color*vec3(1.,.53,.18)*max(0.,1.-d/5.)*.75*(.25+.75*uNight);}float td=length(vPos-uTorch);lit+=color*vec3(1.,.73,.43)*uTorchPower*max(0.,1.-td/8.)*(.40+max(0.,dot(n,normalize(uTorch-vPos))));float fog=clamp(pow(max(0.,min(min(length(vPos.xz)-24.,length(vPos.xz-vec2(37.,2.))-13.),length(vPos.xz-vec2(0.,-40.))-13.))/85.,1.25),0.,.94);if(vParams.z>2.5)fog=0.;
 // Only the mountain batch uses authored world-depth haze. Projection and
 // reflected-eye offsets do not change the atmosphere of the same ridge.
 if(uMountainHaze>.5){float haze=mix(.22,.74,smoothstep(uMountainDepth.x,uMountainDepth.y,vPos.x));lit=mix(lit,color*(uAmbient*.8+uSunPower*.18),haze*.65);fog=haze;}
 lit=mix(lit,uFog,fog);frag=vec4(lit,1.);}`;
const FULL=`#version 300 es
precision highp float;out vec2 vUV;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);vUV=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const SKY=`#version 300 es
precision highp float;in vec2 vUV;out vec4 frag;
uniform vec3 uTop,uBottom,uSkyEye,uSkyRight,uSkyUp,uSkyForward;
uniform float uNight,uTime,uEarthClouds,uSkyPerspective;uniform vec2 uSkySpread;
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);vec2 k=vec2(127.1,311.7);return mix(mix(fract(sin(dot(i,k))*43758.5453),fract(sin(dot(i+vec2(1.,0.),k))*43758.5453),f.x),mix(fract(sin(dot(i+vec2(0.,1.),k))*43758.5453),fract(sin(dot(i+1.,k))*43758.5453),f.x),f.y);}
float cloud(vec2 p){return noise(p)*.53+noise(p*2.03+13.1)*.27+noise(p*4.07+31.7)*.13+noise(p*8.11)*.07;}
void main(){
 vec3 c=mix(uBottom,uTop,pow(clamp(vUV.y,0.,1.),.65));
 vec2 st=floor(vUV*vec2(600.,340.));float s=step(.9982,fract(sin(dot(st,vec2(127.1,311.7)))*43758.5453));vec2 sp=fract(vUV*vec2(600.,340.))-.5;c+=s*exp(-dot(sp,sp)*22.)*uNight*.6;
 if(uEarthClouds>.5){
  vec2 ndc=vUV*2.-1.,offset=ndc*uSkySpread.x*vec2(uSkySpread.y,1.);
  vec3 ray=normalize(uSkyForward+(uSkyRight*offset.x+uSkyUp*offset.y)*uSkyPerspective);
  vec3 origin=uSkyEye+(uSkyRight*offset.x+uSkyUp*offset.y)*(1.-uSkyPerspective);
  c=mix(uBottom,uTop,pow(max(ray.y,0.),.45));
  if(ray.y>.015){
   vec2 p=(origin.xz+ray.xz*(85.-origin.y)/ray.y)*.012+vec2(uTime*.003,0.);
   float n=cloud(p),mask=smoothstep(.34,.61,n)*smoothstep(.015,.08,ray.y);
   vec3 shade=mix(vec3(.46,.53,.55),vec3(.94,.93,.86),smoothstep(.37,.66,n));
   shade=mix(shade,vec3(.12,.17,.24),uNight*.84);
   c=mix(c,shade,mask*.92);
  }
 }
 frag=vec4(c,1.);
}`;
const WV=`#version 300 es
precision highp float;
layout(location=0)in vec3 aPos;
uniform mat4 uVP;
uniform mat4 uReflectionVP;
out vec3 vPos;
out vec4 vReflect;
void main(){vPos=aPos;vReflect=uReflectionVP*vec4(aPos,1.);gl_Position=uVP*vec4(aPos,1.);}`;
const WF=`#version 300 es
precision highp float;
in vec3 vPos;in vec4 vReflect;out vec4 frag;
uniform sampler2D uReflect;
uniform vec3 uEye,uSun,uSunColor,uFog;
uniform float uTime,uSunPower,uNight,uReflectionOn,uCelestial,uReflectionStrength,uWaterStill,uRoad,uCrossing,uEarth,uEarthCurrent,uPierCount;
uniform vec4 uEarthChannel,uEarthOptics;
uniform vec2 uReflectionTexel;
float coast(vec2 p){if(uEarth>.5)return min(abs(p.y-uEarthChannel.x),abs(p.y-uEarthChannel.y));if(uCrossing>.5)return max(max(abs(p.x)-21.,abs(p.y+1.)-29.),1.5-abs(p.x-16.-sin(p.y*.13)*.6));if(uRoad>.5)return max((length(vec2(p.x,p.y+3.)/vec2(18.,26.))-1.)*18.,1.8-abs(p.y-sin(p.x*.13)*.6));float a=atan(p.y,p.x);float r=23.4+sin(3.*a+.3)*1.25+sin(7.*a)*.6;float first=length(p)-r;float second=length((p-vec2(37.,2.))*vec2(.95,1.))-11.6;float third=length((p-vec2(0.,-40.))*vec2(1.,.92))-11.4;return min(min(first,second),third);}
void main(){
 vec2 p=vPos.xz;
 float a=dot(p,vec2(.58,.23))+uTime*.75;
 float b=dot(p,vec2(-.29,1.13))-uTime*.51;
 float c=dot(p,vec2(1.41,.72))+uTime*.29;
 vec2 slope=(vec2(.58,.23)*cos(a)*.05+vec2(-.29,1.13)*cos(b)*.024+vec2(1.41,.72)*cos(c)*.009)*(1.-uWaterStill);
 // Earth current has layered short ripples; it remains a surface approximation,
 // with the same physical reflection plane, rather than a fluid simulation.
 if(uEarth>.5&&uEarthCurrent>.5)slope+=(vec2(3.7,.9)*cos(dot(p,vec2(3.7,.9))-uTime*2.2)*.007+vec2(-1.8,6.1)*cos(dot(p,vec2(-1.8,6.1))-uTime*1.7)*.003)*(1.-uWaterStill);
 vec3 N=normalize(vec3(-slope.x,1.,-slope.y)),V=normalize(uEye-vPos);
 // Project into the SAME reflected VP used to render the texture. Do not flip x or y.
 vec2 uv=vReflect.xy/vReflect.w*.5+.5;
 vec2 drift=slope*(uEarth>.5?uEarthOptics.z:.017);
 vec2 sampleUV=uv+drift;
 float edge=smoothstep(0.,.018,min(min(sampleUV.x,sampleUV.y),min(1.-sampleUV.x,1.-sampleUV.y)));
 vec3 ref=texture(uReflect,clamp(sampleUV,vec2(.001),vec2(.999))).rgb;
 vec2 blur=uReflectionTexel*(.45+length(uEye-vPos)*.004+(uEarth>.5?uEarthOptics.y:0.))*(1.-uWaterStill);
 ref=ref*.60+(texture(uReflect,clamp(sampleUV+vec2(blur.x,0.),vec2(.001),vec2(.999))).rgb+texture(uReflect,clamp(sampleUV-vec2(blur.x,0.),vec2(.001),vec2(.999))).rgb+texture(uReflect,clamp(sampleUV+vec2(0.,blur.y),vec2(.001),vec2(.999))).rgb+texture(uReflect,clamp(sampleUV-vec2(0.,blur.y),vec2(.001),vec2(.999))).rgb)*.10;
 float shore=coast(p);
 vec3 deep=mix(vec3(.032,.135,.165),vec3(.012,.035,.073),uNight);
 vec3 shallow=mix(vec3(.14,.32,.29),vec3(.03,.085,.12),uNight);
 vec3 base=mix(deep,shallow,exp(-max(shore,0.)*.22));
 base=mix(base,vec3(.36,.54,.55),uCelestial);
 if(uEarth>.5)base+=mix(vec3(.045,.075,.065),vec3(.008,.012,.015),uNight)*uEarthOptics.w;
 float fresnel=.13+.66*pow(1.-clamp(dot(N,V),0.,1.),3.);
 vec3 col=mix(base,ref,clamp(fresnel*uReflectionOn*edge*uReflectionStrength*(uEarth>.5?uEarthOptics.x:1.),0.,.86));
 float spark=pow(max(dot(N,normalize(V+uSun)),0.),170.);
 col+=uSunColor*spark*uSunPower*.38;
 float wave=.5+.5*sin(shore*8.-uTime*1.3+sin(p.x*.4)*.6);
 float foam=exp(-max(shore,0.)*2.4)*smoothstep(-.12,.32,shore)*pow(wave,5.);
 if(uEarth>.5){
  foam*=1.-smoothstep(14.,25.,abs(p.x));
  float dx=max(0.,p.x-2.05),wake=0.;
  for(int i=0;i<8;i++){if(float(i)>=uPierCount)break;float z=uEarthChannel.z+float(i)*uEarthChannel.w;float width=.15+dx*.13;float trail=exp(-pow((p.y-z)/width,2.))*exp(-dx*.29)*smoothstep(0.,.5,p.x-2.05);wake=max(wake,trail);}
  foam+=wake*(.45+.35*sin(p.x*6.3-p.y*4.1-uTime*2.))*uEarthCurrent;
 }
 col+=mix(vec3(.13,.22,.19),vec3(.05,.10,.13),uNight)*foam*(1.-uCelestial);
 // Small surface variation, not the opaque parallel stripes of the old water.
 col+=vec3(.012,.022,.023)*pow(max(0.,sin(a+b*.4)),18.)*(.2+uSunPower*.3);
 float fog=clamp(pow(max(min(length(p)-30.,length(p-vec2(37.,2.))-14.),0.)/85.,1.2),0.,.95);
 frag=vec4(mix(col,uFog,fog),1.);
}`;
const PV=`#version 300 es
precision highp float;layout(location=0)in vec4 aPoint;uniform mat4 uVP;uniform float uTime;uniform float uSize;out float vAlpha;void main(){vec3 p=aPoint.xyz;p.x+=sin(uTime*.3+aPoint.w*17.)*.7;p.y+=sin(uTime*.7+aPoint.w*5.)*.35;p.z+=cos(uTime*.4+aPoint.w*8.)*.5;gl_Position=uVP*vec4(p,1.);gl_PointSize=uSize*(.5+aPoint.w);vAlpha=.5+.5*sin(uTime+aPoint.w*14.);}`;
const PF=`#version 300 es
precision highp float;in float vAlpha;uniform float uNight;out vec4 frag;void main(){vec2 d=gl_PointCoord-.5;float a=exp(-dot(d,d)*16.)*vAlpha*.65;if(a<.015)discard;frag=vec4(mix(vec3(.78,.94,.6),vec3(.44,.84,1.),uNight),a);}`;
const POST=`#version 300 es
precision highp float;in vec2 vUV;out vec4 frag;uniform sampler2D uColor;uniform vec2 uResolution;uniform float uBloom;uniform float uTime;float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}void main(){vec2 t=1./uResolution;vec3 c=texture(uColor,vUV).rgb,l=texture(uColor,vUV-vec2(t.x,0)).rgb,r=texture(uColor,vUV+vec2(t.x,0)).rgb,d=texture(uColor,vUV-vec2(0,t.y)).rgb,u=texture(uColor,vUV+vec2(0,t.y)).rgb;float e=max(abs(lum(l)-lum(r)),abs(lum(d)-lum(u)));c=mix(c,(c*2.+l+r+d+u)/6.,clamp(e*1.3,0.,.48));vec3 b=vec3(0.);for(int i=0;i<8;i++){float a=float(i)*.785398;vec3 v=texture(uColor,vUV+vec2(cos(a),sin(a))*t*6.).rgb;b+=max(v-vec3(.7),vec3(0.));}c+=b*.07*uBloom;c=pow(vec3(1.)-exp(-c*1.47),vec3(.94));c=mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,1.19);vec2 q=(vUV-.5)*vec2(1.,.85);c*=1.-.28*dot(q,q);frag=vec4(c,1.);}`;
const surfaceNow=()=>G.performance?.now?G.performance.now():Date.now();
// The fallback reference was measured from the committed 512 JPEG's .10..20
// strip after the standard sRGB transfer. An asset may supply the same measured
// reference explicitly; both keep the authored instance colors useful.
const TIMBER_REFERENCE=[.08197384378316076,.057887511954654886,.044554639163410466];
function surfaceSource(uri,type){
 const prefix='data:image/'+type+';base64,';
 if(typeof uri!=='string'||!uri.startsWith(prefix)||uri.length>2*1024*1024)throw new Error('Timber '+type+' must be a bounded embedded base64 image.');
 const body=uri.slice(prefix.length);
 if(!body.length||body.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(body))throw new Error('Malformed timber '+type+' data.');
 const h=G.atob(body.slice(0,type==='png'?44:4)),bytes=Array.from(h,c=>c.charCodeAt(0));
 if(type==='jpeg'){if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw new Error('Timber color must contain JPEG bytes.');}
 else{
  if(bytes.length<33||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)||h.slice(12,16)!=='IHDR'||bytes[24]!==8||bytes[25]!==0)throw new Error('Timber roughness must contain an 8-bit grayscale PNG.');
  const dimension=o=>bytes[o]*16777216+bytes[o+1]*65536+bytes[o+2]*256+bytes[o+3];
  if(dimension(16)!==512||dimension(20)!==512)throw new Error('Timber roughness must be 512 by 512.');
 }
 return uri;
}
class Engine{
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'});if(!this.gl)throw new Error('WebGL 2 is unavailable. The map view remains usable.');let g=this.gl;this.meshes=new Map();this.batches=[];this.dynamic=[];this.cache=new Map();this.quality='balanced';this.isInterior=false;this.reducedMotion=false;this.program=this.programOf(VS,FS);this.depthP=this.programOf(VS,'#version 300 es\nprecision highp float;in vec4 vParams;void main(){if(vParams.z>2.5)discard;}');this.skyP=this.programOf(FULL,SKY);this.waterP=this.programOf(WV,WF);this.particleP=this.programOf(PV,PF);this.postP=this.programOf(FULL,POST);this.emptyVAO=g.createVertexArray();this.shadowSize=2048;this.createShadow();this.mainF=this.framebuffer(1,1);this.refF=this.framebuffer(1,1);this.lastShadow=-1;this.lightVP=M.identity();this.camera={eye:[37,32,37],target:[0,1,0],half:22,aspect:1};this.setCamera(this.camera);this.metrics={drawCalls:0,instances:0,triangles:0};this.waterVAO=this.singleVAO(new Float32Array([-180,.01,-180,-180,.01,180,180,.01,-180,180,.01,-180,-180,.01,180,180,.01,180]),3);let pts=new Float32Array(140*4),seed=53;let random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<140;i++){pts[i*4]=(random()-.5)*40;pts[i*4+1]=1.6+random()*5;pts[i*4+2]=(random()-.5)*40;pts[i*4+3]=random();}this.particleVAO=this.singleVAO(pts,4);this.initSurfaceMaterials();}
 initSurfaceMaterials(){
  if(this._surfaceInitialized)return;this._surfaceInitialized=true;
  this.surfaceMaterialsEnabled=true;this._surfaceGeneration=0;this._surfaceLoads=[];this._surfaceTextures=null;this._contextLost=false;
  this.surfaceMaterialInfo={version:1,id:'earth-weathered-timber-v1',status:'unavailable',ready:false,error:null,width:512,height:512,colorFormat:'SRGB8_ALPHA8',roughnessFormat:'R8',textureBytes:0,mipmapBytes:0,totalTextureBytes:0,decodedImageBytes:0,decodeWallMs:0,uploadCpuMs:0,timingScope:'CPU wall-clock; decode includes asynchronous wait; upload excludes GPU completion',memoryScope:'Estimated texture storage; excludes driver overhead; decodedImageBytes is peak RGBA decoder storage, released after upload'};
  this._onSurfaceContextLost=()=>{this._contextLost=true;this.cancelSurfaceMaterials('context-lost');};
  this.canvas.addEventListener?.('webglcontextlost',this._onSurfaceContextLost);
  const start=surfaceNow(),generation=this._surfaceGeneration;
  try{
   const assets=G.RealmSurfaceAssets;if(assets==null)return;
   const a=assets.timber;if(assets.version!==1||!a||a.id!=='earth-weathered-timber-v1'||a.width!==512||a.height!==512)throw new Error('Unsupported timber material contract.');
   const sources={color:surfaceSource(a.maps?.color,'jpeg'),roughness:surfaceSource(a.maps?.roughness,'png')};
   let reference=TIMBER_REFERENCE.slice();
   if(a.calibration!==undefined){
    const r=a.calibration.stripMeanLinearRGB,c=a.calibration.crop;
    if(!Array.isArray(r)||r.length!==3||!r.every(v=>Number.isFinite(v)&&v>=.0001&&v<=1)||!Array.isArray(c)||c.length!==4||!c.every((v,i)=>v===[.1,.2,0,1][i]))throw new Error('Invalid timber strip calibration.');
    reference=r.slice();
   }
   if(typeof G.Image!=='function')throw new Error('Timber image decoding is unavailable.');
   this._surfaceReference=reference;this.surfaceMaterialInfo.status='loading';
   const decoded={};
   const current=()=>generation===this._surfaceGeneration&&!this._contextLost;
   const fail=message=>{if(current()){this.surfaceMaterialInfo.decodeWallMs=surfaceNow()-start;this.cancelSurfaceMaterials('error',message);}};
   for(const name of ['color','roughness']){
    const image=new G.Image();this._surfaceLoads.push(image);
    image.onerror=()=>fail('Timber '+name+' image could not be decoded.');
    image.onload=()=>{
     if(!current())return;
     if(image.naturalWidth!==512||image.naturalHeight!==512){fail('Timber '+name+' must decode to 512 by 512.');return;}
     decoded[name]=image;image.onload=null;image.onerror=null;
     if(!decoded.color||!decoded.roughness)return;
     this.surfaceMaterialInfo.decodeWallMs=surfaceNow()-start;this.surfaceMaterialInfo.decodedImageBytes=2*512*512*4;
     try{
      if(this.gl.isContextLost()){this._onSurfaceContextLost();return;}
      const upload=surfaceNow();try{this._surfaceTextures=this.uploadSurfaceMaterials(decoded);}finally{this.surfaceMaterialInfo.uploadCpuMs=surfaceNow()-upload;}
      // 4 color bytes + 1 scalar roughness byte per texel, including the full
      // 512..1 mip chain. This is a storage estimate, not measured GPU memory.
      Object.assign(this.surfaceMaterialInfo,{status:'ready',ready:true,textureBytes:1310720,mipmapBytes:436905,totalTextureBytes:1747625});
      this.releaseSurfaceImages();
     }catch(e){fail(e.message||'Timber texture upload failed.');}
    };
    image.src=sources[name];
   }
  }catch(e){this.surfaceMaterialInfo.decodeWallMs=surfaceNow()-start;this.cancelSurfaceMaterials('error',e.message||'Timber material could not be loaded.');}
 }
 releaseSurfaceImages(){
  for(const image of this._surfaceLoads){image.onload=null;image.onerror=null;try{image.removeAttribute('src');}catch(e){/* A retired detached decoder must not affect rendering. */}}
  this._surfaceLoads=[];
 }
 cancelSurfaceMaterials(status,error=null){
  this._surfaceGeneration++;this.releaseSurfaceImages();
  if(this._surfaceTextures&&!this._contextLost)for(const texture of Object.values(this._surfaceTextures))this.gl.deleteTexture(texture);
  this._surfaceTextures=null;
  Object.assign(this.surfaceMaterialInfo,{status,ready:false,error,textureBytes:0,mipmapBytes:0,totalTextureBytes:0,decodedImageBytes:0});
 }
 disposeSurfaceMaterials(){this.cancelSurfaceMaterials('disposed');}
 uploadSurfaceMaterials(images){
  const g=this.gl,active=g.getParameter(g.ACTIVE_TEXTURE);g.activeTexture(g.TEXTURE3);
  const binding=g.getParameter(g.TEXTURE_BINDING_2D),flip=g.getParameter(g.UNPACK_FLIP_Y_WEBGL),premultiply=g.getParameter(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL),conversion=g.getParameter(g.UNPACK_COLORSPACE_CONVERSION_WEBGL),alignment=g.getParameter(g.UNPACK_ALIGNMENT),textures={};
  try{
   g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);g.pixelStorei(g.UNPACK_COLORSPACE_CONVERSION_WEBGL,g.NONE);g.pixelStorei(g.UNPACK_ALIGNMENT,1);
   for(const [name,internal,format]of [['color',g.SRGB8_ALPHA8,g.RGBA],['roughness',g.R8,g.RED]]){
    const texture=g.createTexture();if(!texture)throw new Error('Timber texture allocation failed.');textures[name]=texture;g.bindTexture(g.TEXTURE_2D,texture);
    g.texImage2D(g.TEXTURE_2D,0,internal,format,g.UNSIGNED_BYTE,images[name]);
    g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);
    for(const wrap of [g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T])g.texParameteri(g.TEXTURE_2D,wrap,g.CLAMP_TO_EDGE);
    g.generateMipmap(g.TEXTURE_2D);
   }
   const error=g.getError();if(error!==g.NO_ERROR)throw new Error('WebGL reported an error during timber upload ('+error+').');
   return textures;
  }catch(e){for(const texture of Object.values(textures))g.deleteTexture(texture);throw e;}
  finally{g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,flip);g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL,premultiply);g.pixelStorei(g.UNPACK_COLORSPACE_CONVERSION_WEBGL,conversion);g.pixelStorei(g.UNPACK_ALIGNMENT,alignment);g.bindTexture(g.TEXTURE_2D,binding);g.activeTexture(active);}
 }
 singleVAO(data,n){let g=this.gl,v=g.createVertexArray(),b=g.createBuffer();g.bindVertexArray(v);g.bindBuffer(g.ARRAY_BUFFER,b);g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);g.enableVertexAttribArray(0);g.vertexAttribPointer(0,n,g.FLOAT,false,n*4,0);g.bindVertexArray(null);return v;}
 programOf(vs,fs){let g=this.gl;function c(type,s){let o=g.createShader(type);g.shaderSource(o,s);g.compileShader(o);if(!g.getShaderParameter(o,g.COMPILE_STATUS))throw new Error(g.getShaderInfoLog(o));return o;}let p=g.createProgram(),v=c(g.VERTEX_SHADER,vs),f=c(g.FRAGMENT_SHADER,fs);g.attachShader(p,v);g.attachShader(p,f);g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw new Error(g.getProgramInfoLog(p));g.deleteShader(v);g.deleteShader(f);return p;}
 uni(p,n,t,v){let g=this.gl,c=this.cache.get(p);if(!c){c=new Map();this.cache.set(p,c);}if(!c.has(n))c.set(n,g.getUniformLocation(p,n));let l=c.get(n);if(l===null)return;if(t==='m')g.uniformMatrix4fv(l,false,v);else if(t==='4')g.uniform4fv(l,v);else if(t==='3')g.uniform3fv(l,v);else if(t==='2')g.uniform2fv(l,v);else if(t==='i')g.uniform1i(l,v);else g.uniform1f(l,v);}
 framebuffer(w,h){let g=this.gl,f=g.createFramebuffer(),tex=g.createTexture(),depth=g.createRenderbuffer();g.bindTexture(g.TEXTURE_2D,tex);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,w,h,0,g.RGBA,g.UNSIGNED_BYTE,null);for(let p of[g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_2D,p,g.LINEAR);for(let p of[g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T])g.texParameteri(g.TEXTURE_2D,p,g.CLAMP_TO_EDGE);g.bindRenderbuffer(g.RENDERBUFFER,depth);g.renderbufferStorage(g.RENDERBUFFER,g.DEPTH_COMPONENT16,w,h);g.bindFramebuffer(g.FRAMEBUFFER,f);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,tex,0);g.framebufferRenderbuffer(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.RENDERBUFFER,depth);g.bindFramebuffer(g.FRAMEBUFFER,null);return{f,tex,depth,w,h};}
 resizeFB(f,w,h){if(f.w===w&&f.h===h)return;let g=this.gl;f.w=w;f.h=h;g.bindTexture(g.TEXTURE_2D,f.tex);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,w,h,0,g.RGBA,g.UNSIGNED_BYTE,null);g.bindRenderbuffer(g.RENDERBUFFER,f.depth);g.renderbufferStorage(g.RENDERBUFFER,g.DEPTH_COMPONENT16,w,h);}
 createShadow(){let g=this.gl;this.shadowF=g.createFramebuffer();this.shadowTex=g.createTexture();g.bindTexture(g.TEXTURE_2D,this.shadowTex);g.texImage2D(g.TEXTURE_2D,0,g.DEPTH_COMPONENT24,this.shadowSize,this.shadowSize,0,g.DEPTH_COMPONENT,g.UNSIGNED_INT,null);for(let p of[g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_2D,p,g.NEAREST);for(let p of[g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T])g.texParameteri(g.TEXTURE_2D,p,g.CLAMP_TO_EDGE);g.bindFramebuffer(g.FRAMEBUFFER,this.shadowF);g.framebufferTexture2D(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.TEXTURE_2D,this.shadowTex,0);g.drawBuffers([g.NONE]);g.readBuffer(g.NONE);g.bindFramebuffer(g.FRAMEBUFFER,null);}
 resize(w,h,dpr=1){let s=this.quality==='low'?.85:Math.min(dpr,this.quality==='high'?1.65:1.25);this.canvas.width=Math.max(1,Math.round(w*s));this.canvas.height=Math.max(1,Math.round(h*s));this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.resizeFB(this.mainF,this.canvas.width,this.canvas.height);let rw=this.quality==='high'?1280:768;this.resizeFB(this.refF,rw,Math.max(200,Math.round(rw*h/w)));this.camera.aspect=w/h;this.setCamera(this.camera);}
 setCamera(c){if(c.projection!==this.camera?.projection)this.lastShadow=-1;this.camera=c;this.projection=c.projection==='perspective'?M.perspective(c.fov*Math.PI/180,c.aspect,.1,420):M.ortho(-c.half*c.aspect,c.half*c.aspect,-c.half,c.half,.1,420);this.vp=M.mul(this.projection,M.look(c.eye,c.target));this.right=norm(cross([0,1,0],norm(sub(c.eye,c.target))));this.up=norm(cross(norm(sub(c.eye,c.target)),this.right));this.forward=norm(sub(c.target,c.eye));}
 project(x,y,z){const depth=dot(sub([x,y,z],this.camera.eye),this.forward),p=M.transform(this.vp,[x,y,z]);return{x:(p[0]*.5+.5)*this.canvas.clientWidth,y:(-.5*p[1]+.5)*this.canvas.clientHeight,depth,visible:depth>.1&&p.every(Number.isFinite)&&p[2]>-1&&p[2]<1&&Math.abs(p[0])<1.15&&Math.abs(p[1])<1.15};}
 groundAt(x,y,height=1.3){
  if(![x,y,height].every(Number.isFinite))return null;
  const c=this.camera,perspective=c.projection==='perspective',half=perspective?Math.tan(c.fov*Math.PI/360):c.half,nx=(x/this.canvas.clientWidth*2-1)*half*c.aspect,ny=(1-y/this.canvas.clientHeight*2)*half;
  const offset=this.right.map((v,i)=>v*nx+this.up[i]*ny),start=perspective?c.eye:c.eye.map((v,i)=>v+offset[i]),ray=perspective?norm(this.forward.map((v,i)=>v+offset[i])):this.forward;
  if(this.surfacePick)return this.surfacePick(start,ray);
  if(ray[1]>=-.0001)return null;const t=(height-start[1])/ray[1];if(t<=0||t>420)return null;return{x:start[0]+t*ray[0],z:start[2]+t*ray[2]};
 }
 clearCameraDistance(focus,eye){
  const delta=sub(eye,focus),length=Math.hypot(...delta);if(length<.001)return length;
  let fraction=1;const solids=[...(this.cameraSolids||[])];for(const b of this.dynamic||[])solids.push(...(b.cameraSolids||[]));
  for(const box of solids){let lo=0,hi=1;for(let i=0;i<3;i++){const a=box.min[i]-.3,b=box.max[i]+.3;if(Math.abs(delta[i])<1e-7){if(focus[i]<a||focus[i]>b){hi=-1;break;}}else{let u=(a-focus[i])/delta[i],v=(b-focus[i])/delta[i];lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}}
   // A focus inside geometry can occur in an old furnished save. Keep a small,
   // usable eye offset and let cutaway expose the character instead of inverting.
   if(hi>=lo&&hi>=0)fraction=Math.min(fraction,lo);
  }return Math.max(.45,Math.min(length,length*fraction-.02*(fraction<1)));
 }
 batch(kind,items,dynamic=false){let g=this.gl,geom=this.meshes.get(kind);if(!geom){let data=geometry(kind),buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);geom={buffer,stride:kind==='timber-panel'?8:6,count:data.length/(kind==='timber-panel'?8:6)};this.meshes.set(kind,geom);}let vao=g.createVertexArray(),buf=g.createBuffer();g.bindVertexArray(vao);g.bindBuffer(g.ARRAY_BUFFER,geom.buffer);for(let i=0;i<2;i++){g.enableVertexAttribArray(i);g.vertexAttribPointer(i,3,g.FLOAT,false,geom.stride*4,i*12);}if(kind==='timber-panel'){g.enableVertexAttribArray(8);g.vertexAttribPointer(8,2,g.FLOAT,false,32,24);}g.bindBuffer(g.ARRAY_BUFFER,buf);for(let i=0;i<4;i++){g.enableVertexAttribArray(i+2);g.vertexAttribPointer(i+2,4,g.FLOAT,false,96,i*16);g.vertexAttribDivisor(i+2,1);}for(let i=6;i<8;i++){g.enableVertexAttribArray(i);g.vertexAttribPointer(i,4,g.FLOAT,false,96,i===6?64:80);g.vertexAttribDivisor(i,1);}g.bindVertexArray(null);let b={kind,vao,buf,geom,items,dynamic,count:items.length};this.updateBatch(b);if(!dynamic){this.cameraSolids=this.cameraSolids||[];this.cameraSolids.push(...items.map(it=>solidBounds(kind,it)).filter(Boolean));}(dynamic?this.dynamic:this.batches).push(b);return b;}
 updateBatch(b){let g=this.gl;if(!b.data||b.data.length!==b.items.length*24)b.data=new Float32Array(b.items.length*24);for(let i=0;i<b.items.length;i++){let it=b.items[i],o=i*24;b.data.set(it.m||M.compose(...it.p,...it.s,...(it.r||[0,0,0])),o);b.data.set([...hex(it.c),it.cutaway?0:(it.alpha??1)],o+16);b.data.set([it.rough??.8,it.em??0,it.skyImage?3:(it.wind??0),it.terrain?-1:(it.wet??0)],o+20);}g.bindBuffer(g.ARRAY_BUFFER,b.buf);g.bufferData(g.ARRAY_BUFFER,b.data,b.dynamic?g.DYNAMIC_DRAW:g.STATIC_DRAW);b.count=b.items.length;if(b.dynamic)b.cameraSolids=b.items.filter(it=>it.cameraSolid).map(it=>solidBounds(b.kind,it)).filter(Boolean);}
 clear(){let g=this.gl;for(let b of[...this.batches,...this.dynamic]){g.deleteBuffer(b.buf);g.deleteVertexArray(b.vao);}this.batches=[];this.dynamic=[];this.cameraSolids=[];this.lastShadow=-1;}
 sky(pal,t,reflected=false){let g=this.gl,p=this.skyP;const frame=skyFrame(this.camera,reflected);g.useProgram(p);this.uni(p,'uEarthClouds','f',this.theme==='earth'&&this.cloudsEnabled!==false?1:0);this.uni(p,'uSkyPerspective','f',frame.perspective?1:0);this.uni(p,'uSkySpread','2',[frame.spread,frame.aspect]);for(const [n,v]of[['uSkyEye',frame.eye],['uSkyRight',frame.right],['uSkyUp',frame.up],['uSkyForward',frame.forward]])this.uni(p,n,'3',v);g.disable(g.DEPTH_TEST);g.depthMask(false);g.useProgram(p);this.uni(p,'uTop','3',pal.top);this.uni(p,'uBottom','3',pal.fog);this.uni(p,'uNight','f',this.theme==='cosmos'?0:pal.night);this.uni(p,'uTime','f',this.reducedMotion?0:t);g.bindVertexArray(this.emptyVAO);g.drawArrays(g.TRIANGLES,0,3);g.enable(g.DEPTH_TEST);g.depthMask(true);}
 geometryPass(p,vp,pal,t,eye,ref=false,depth=false){if(this._contextLost)return;let g=this.gl;g.useProgram(p);this.uni(p,'uVP','m',vp);this.uni(p,'uLight','m',this.lightVP);this.uni(p,'uTime','f',this.reducedMotion?0:t);if(!depth){this.uni(p,'uCutaway','f',!ref&&this.cutaway?1:0);this.uni(p,'uFocus','3',this.cutawayFocus||this.camera.target);this.uni(p,'uTorch','3',this.torch||[0,0,0]);this.uni(p,'uTorchPower','f',this.theme==='underways'?1.8:0);for(let [n,v]of[['uEye',eye],['uSun',pal.sun],['uSunColor',pal.sunColor],['uFog',pal.fog]])this.uni(p,n,'3',v);for(let[n,v]of[['uSunPower',pal.power],['uAmbient',this.ambientOverride??(this.isInterior?.62:pal.ambient)],['uShadowSize',this.shadowSize],['uShadowOn',this.quality==='low'?0:1],['uWet',pal.wet],['uNight',pal.night],['uClip',ref?1:0]])this.uni(p,n,'f',v);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.shadowTex);this.uni(p,'uShadow','i',0);this.uni(p,'uTimberColor','i',3);this.uni(p,'uTimberRoughness','i',4);this.uni(p,'uTimberReference','3',this._surfaceReference||TIMBER_REFERENCE);if(this._surfaceTextures){g.activeTexture(g.TEXTURE3);g.bindTexture(g.TEXTURE_2D,this._surfaceTextures.color);g.activeTexture(g.TEXTURE4);g.bindTexture(g.TEXTURE_2D,this._surfaceTextures.roughness);}}for(let b of[...this.batches,...this.dynamic]){if(depth&&b.kind==='leaf')continue;if(!depth){const textured=b.kind==='timber-panel'&&this.surfaceMaterialsEnabled!==false&&this.surfaceMaterialInfo.ready;this.uni(p,'uTimberOn','f',textured?1:0);this.uni(p,'uMountainHaze','f',b.kind==='mountain-ridge'&&this.theme==='earth'&&this.mountainHazeEnabled!==false?1:0);this.uni(p,'uMountainDepth','2',[62,138]);if(textured&&b.count){this.texturedCalls=(this.texturedCalls||0)+1;if(!ref)this.texturedInstances=(this.texturedInstances||0)+b.count;}}g.bindVertexArray(b.vao);g.drawArraysInstanced(g.TRIANGLES,0,b.geom.count,b.count);this.calls++;}}
 palette(hour,rain){let n=hour>=20||hour<5.5?1:hour<7?(7-hour)/1.5:hour>18?(hour-18)/2:0,w=hour>15&&hour<20?Math.max(0,1-Math.abs(hour-17.6)/2.5):.16,top=blend(hex(0x718e9a),hex(0x111c37),n),fog=blend(blend(hex(0xa8b5ac),hex(0xe0c297),w*.55),hex(0x1c304a),n);if(rain){top=blend(top,hex(0x3d5568),.48);fog=blend(fog,hex(0x667f88),.46);}return{night:n,top,fog,sun:norm([-.55,.9,.52]),sunColor:blend(hex(0xffecd0),hex(0xb0d0ff),n),power:(1.28-n*.99)*(rain?.55:1),ambient:(.50-n*.16)*(rain?.88:1),wet:rain?1:.4};}
 render(time,hour,rain){let g=this.gl,pal=this.palette(hour,rain);if(this._contextLost)return pal;if(this.siege){pal={...pal,top:blend(pal.top,hex(0x4b2d48),this.siege*.5),fog:blend(pal.fog,hex(0xa0798a),this.siege*.25)};}if(this.theme==='underways'){pal={...pal,top:hex(0x101d30),fog:hex(0x152e3b),night:.8,power:.24,ambient:.34,sunColor:hex(0xb7d4d4),wet:.7};}if(this.theme==='cosmos'){pal={...pal,top:hex(0x111c38),fog:hex(0x44455f),night:.62,power:.72,ambient:.55,sun: norm([-.4,.75,.35]),sunColor:hex(0xf0dcc2),wet:0};}this.calls=0;this.texturedCalls=0;this.texturedInstances=0;for(let b of this.dynamic)this.updateBatch(b);g.enable(g.DEPTH_TEST);g.depthFunc(g.LEQUAL);g.disable(g.CULL_FACE);g.disable(g.BLEND);let close=this.camera.projection==='perspective',focus=close?this.camera.target.map(v=>Math.round(v*16)/16):this.isInterior?[0,0,0]:[12,0,0],le=pal.sun.map((v,i)=>v*85+focus[i]);if(this.quality!=='low'&&(time-this.lastShadow>(close?.08:.18)||this.lastShadow<0)){this.lightVP=M.mul(M.ortho(close?-24:-52,close?24:52,close?-24:-43,close?24:43,1,210),M.look(le,focus));g.bindFramebuffer(g.FRAMEBUFFER,this.shadowF);g.viewport(0,0,this.shadowSize,this.shadowSize);g.clear(g.DEPTH_BUFFER_BIT);g.colorMask(false,false,false,false);g.enable(g.POLYGON_OFFSET_FILL);g.polygonOffset(1.2,2.0);this.geometryPass(this.depthP,this.lightVP,pal,time,le,false,true);g.disable(g.POLYGON_OFFSET_FILL);g.colorMask(true,true,true,true);this.lastShadow=time;}
 let reflection=!this.isInterior&&!this.noWater&&this.quality!=='low';if(reflection){g.bindFramebuffer(g.FRAMEBUFFER,this.refF.f);g.viewport(0,0,this.refF.w,this.refF.h);g.clearColor(...pal.fog,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);this.sky(pal,time,true);let eye=[this.camera.eye[0],2*WATER_HEIGHT-this.camera.eye[1],this.camera.eye[2]];this.reflectionMatrix=reflectionVP(this.vp);this.reflectionInfo={method:'world-plane P*V*H',height:WATER_HEIGHT,horizontalFlip:false};this.geometryPass(this.program,this.reflectionMatrix,pal,time,eye,true);}
 g.bindFramebuffer(g.FRAMEBUFFER,this.mainF.f);g.viewport(0,0,this.mainF.w,this.mainF.h);g.clearColor(...pal.fog,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);this.sky(pal,time);this.geometryPass(this.program,this.vp,pal,time,this.camera.eye);
 if(!this.isInterior&&!this.noWater){let p=this.waterP;g.useProgram(p);this.uni(p,'uVP','m',this.vp);this.uni(p,'uReflectionVP','m',reflectionVP(this.vp));this.uni(p,'uReflectionTexel','2',[1/this.refF.w,1/this.refF.h]);this.uni(p,'uCelestial','f',this.theme==='heaven'?1:0);this.uni(p,'uRoad','f',this.theme==='sunward'?1:0);this.uni(p,'uCrossing','f',this.theme==='bellweather'?1:0);this.uni(p,'uReflectionStrength','f',this.reflectionStrength??1);this.uni(p,'uWaterStill','f',this.waterStill?1:0);const channel=this.earthWater;this.uni(p,'uEarth','f',this.theme==='earth'&&channel?1:0);this.uni(p,'uEarthCurrent','f',this.earthCurrentEnabled===false?0:1);this.uni(p,'uEarthOptics','4',this.earthOpticsEnabled===false?[1,1.4,.055,0]:[.62,4.5,.065,1]);this.uni(p,'uEarthChannel','4',channel?[channel.from,channel.to,channel.piers[0],channel.piers[1]-channel.piers[0]]:[0,0,0,1]);this.uni(p,'uPierCount','f',channel?channel.piers.length:0);for(let[n,v]of[['uEye',this.camera.eye],['uSun',pal.sun],['uSunColor',pal.sunColor],['uFog',pal.fog]])this.uni(p,n,'3',v);for(let[n,v]of[['uTime',this.reducedMotion?0:time],['uSunPower',pal.power],['uNight',pal.night],['uReflectionOn',reflection?1:0]])this.uni(p,n,'f',v);g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.refF.tex);this.uni(p,'uReflect','i',1);g.bindVertexArray(this.waterVAO);g.drawArrays(g.TRIANGLES,0,6);this.calls++;p=this.particleP;g.useProgram(p);this.uni(p,'uVP','m',this.vp);this.uni(p,'uTime','f',this.reducedMotion?0:time);this.uni(p,'uSize','f',this.canvas.width/500*3);this.uni(p,'uNight','f',pal.night);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE);g.depthMask(false);g.bindVertexArray(this.particleVAO);g.drawArrays(g.POINTS,0,140);g.depthMask(true);g.disable(g.BLEND);}
 g.bindFramebuffer(g.FRAMEBUFFER,null);g.viewport(0,0,this.canvas.width,this.canvas.height);g.disable(g.DEPTH_TEST);g.useProgram(this.postP);g.activeTexture(g.TEXTURE2);g.bindTexture(g.TEXTURE_2D,this.mainF.tex);this.uni(this.postP,'uColor','i',2);this.uni(this.postP,'uResolution','2',[this.canvas.width,this.canvas.height]);this.uni(this.postP,'uBloom','f',this.quality==='low'?0:1);this.uni(this.postP,'uTime','f',time);g.bindVertexArray(this.emptyVAO);g.drawArrays(g.TRIANGLES,0,3);g.bindVertexArray(null);this.metrics={drawCalls:this.calls,texturedDrawCalls:this.texturedCalls,texturedInstances:this.texturedInstances,surfaceMaterials:{...this.surfaceMaterialInfo,enabled:this.surfaceMaterialsEnabled!==false},instances:[...this.batches,...this.dynamic].reduce((s,b)=>s+b.count,0),triangles:[...this.batches,...this.dynamic].reduce((s,b)=>s+b.count*b.geom.count/3,0)};return pal;}
}
G.RealmEngine={Engine,M,hex,blend,norm,sub,dot,cross,reflectionVP,WATER_HEIGHT,solidBounds,skyFrame,geometry};if(typeof module!=='undefined')module.exports=G.RealmEngine;})(globalThis);
