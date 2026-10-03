'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/engine.js'),North=require('../src/world-heaven-hell.js'),South=require('../src/world-atlantis-earth.js');
const Art=require('../src/realm-givers-art.js');
const ids=['heaven-rielle','heaven-calen','heaven-yselle','hell-istra','hell-tovan','vessa','merren','nereme','sahra','elderweald-rill','elderweald-sela'];
const realms=[...North.realms,...South.realms],points=new Map(realms.flatMap(d=>d.points.filter(p=>p.kind==='person').map(p=>[p.id,{point:p,realm:d}])));
const empty=()=>({box:[],round:[],octa:[]}),items=out=>Object.entries(out).flatMap(([kind,list])=>list.map(p=>({kind,...p})));
// World matrices use Float32Array. At Vessa's z=97 one ULP is 7.63e-6m;
// a 1e-5m join tolerance covers that quantization, while floor checks stay tighter.
const near=(a,b,label,tolerance=1e-5)=>assert.ok(Math.hypot(...a.map((v,i)=>v-b[i]))<tolerance,label);
const mesh=new Map(['box','round','octa'].map(kind=>[kind,E.geometry(kind)]));
function vertices(p){const data=mesh.get(p.kind),out=[];for(let i=0;i<data.length;i+=6)out.push(E.M.transform(p.m,[data[i],data[i+1],data[i+2]]));return out;}
function bounds(p){const v=vertices(p);return {min:[0,1,2].map(i=>Math.min(...v.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...v.map(p=>p[i])))};}
function overlap(a,b,tolerance=.004){return [0,1,2].every(i=>a.min[i]<=b.max[i]+tolerance&&b.min[i]<=a.max[i]+tolerance);}
function draw(id,options={}){const out=empty(),frame=Art.draw(out,points.get(id).point,{base:1.57,...options});return {out,frame,parts:items(out)};}
function freeze(o){Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);return o;}

test('the pure API owns the nine retained points and two Elderweald residents, with unchanged names and deeply frozen profiles',()=>{
 assert.equal(globalThis.RealmGiversArt,Art);assert.deepEqual(Object.keys(Art),['profiles','parts','draw']);assert.deepEqual(Object.keys(Art.profiles),ids);
 for(const id of ids){const p=Art.profiles[id],data=points.get(id);assert.ok(data,id+' exists in the production catalogue');assert.equal(p.id,id);assert.equal(p.name,data.point.name);assert.equal(p.realm,data.realm.id);assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.palette));assert.equal(p.source,id.startsWith('elderweald-')?'original-elderweald-provisional':id==='merren'||id==='vessa'?'original-coastward-provisional':'recovered-'+(p.realm==='earthlands'?'earth':p.realm)+'-proposal');}
 for(const id of ['neris','cosmos-keeper','mara','oren','heaven-home'])assert.equal(Object.hasOwn(Art.profiles,id),false,'old NPC, escort and non-person ownership stays outside this module');
});

test('actual production mesh vertices are finite, supported and bounded through real ground height and yaw',()=>{
 for(const id of ids)for(const time of [0,1.9,14])for(const reducedMotion of [false,true])for(const yaw of [0,.7,Math.PI]){
  const base=time===14?-2:1.57,{frame,parts}=draw(id,{time,reducedMotion,yaw,base});
  assert.equal(frame.id,id);assert.equal(frame.instances,parts.length);assert.ok(parts.length<=45&&parts.length>=30);
  assert.equal(new Set(parts.map(p=>p.name)).size,parts.length,'every local part is named once');
  for(const p of parts){assert.ok(['box','round','octa'].includes(p.kind));assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.realmGiver,id);assert.ok(p.s.every(n=>Number.isFinite(n)&&n>0));assert.ok(Array.from(p.m).every(Number.isFinite));
   for(const v of vertices(p)){assert.ok(v.every(Number.isFinite));assert.ok(v[1]>=base-2e-6&&v[1]<base+1.83,p.name+' stays above support and below the body envelope');assert.ok(Math.hypot(v[0]-points.get(id).point.x,v[2]-points.get(id).point.z)<.65,p.name+' has a restrained physical footprint');}
  }
  for(const side of ['left','right'])assert.ok(Math.abs(bounds(parts.find(p=>p.name===side+'-sole')).min[1]-base)<2e-6,'sole vertices meet the supplied support plane');
 }
});

test('the exact actor meshes stay on current patches and clear authoritative nearby solid boxes',()=>{
 for(const id of ids){const {realm}=points.get(id),r=draw(id,{yaw:Math.PI,reducedMotion:true});
  for(const p of r.parts)for(const v of vertices(p)){
   assert.ok(realm.patches.some(s=>Math.abs(v[0]-s.x)<=s.w/2+1e-6&&Math.abs(v[2]-s.z)<=s.d/2+1e-6),id+' '+p.name+' does not invent reachable ground');
   assert.equal(realm.solids.some(s=>v[0]>s.x-s.w/2&&v[0]<s.x+s.w/2&&v[2]>s.z-s.d/2&&v[2]<s.z+s.d/2&&v[1]<1.57+s.h),false,id+' '+p.name+' avoids existing solid intrusion');
  }
 }
});

test('actual beam mesh endpoints connect the named limb and tool joints under root transforms',()=>{
 for(const id of ids)for(const yaw of [-.9,1.2]){
  const {frame,parts}=draw(id,{time:2.4,yaw,base:3.1});
  for(const p of parts.filter(p=>p.joins)){
   const half=p.kind==='octa'?.65:.5;
   near(E.M.transform(p.m,[0,-half,0]),E.M.transform(frame.root,p.joins[0]),id+' '+p.name+' start');
   near(E.M.transform(p.m,[0,half,0]),E.M.transform(frame.root,p.joins[1]),id+' '+p.name+' end');
  }
  for(const side of ['left','right']){
   near(parts.find(p=>p.name===side+'-hand').p,E.M.transform(frame.root,frame.joints[side+'Hand']),id+' skin at hand');
   const sleeve=parts.find(p=>p.name===side+'-sleeve'),forearm=parts.find(p=>p.name===side+'-forearm');
   near(E.M.transform(sleeve.m,[0,.5,0]),E.M.transform(forearm.m,[0,-.5,0]),id+' elbow has no gap');
  }
 }
});

test('each useful tool actually touches its holding palm and has a supported component graph',()=>{
 for(const id of ids)for(const yaw of [0,.8]){const {frame,parts}=draw(id,{time:3.3,yaw,base:2.2});assert.ok(frame.tools.length>=1);
  const toolParts=parts.filter(p=>p.tool),boxes=toolParts.map(bounds),connected=new Set();
  for(const grip of frame.tools){const p=toolParts.find(p=>p.name===grip.part);assert.ok(p,id+' submitted grip exists');near(E.M.transform(p.m,grip.partPoint),grip.gripWorld,id+' actual tool grip at hand');near(grip.gripWorld,E.M.transform(frame.root,frame.joints[grip.hand]),id+' tool uses the same palm anchor');connected.add(toolParts.indexOf(p));}
  // Conservative actual-mesh AABBs detect unattached small components; explicit
  // matrix joins above independently check the exact grip and shaft endpoints.
  for(let pass=0;pass<toolParts.length;pass++)for(let i=0;i<toolParts.length;i++)if(!connected.has(i)&&[...connected].some(j=>overlap(boxes[i],boxes[j])))connected.add(i);
  assert.equal(connected.size,toolParts.length,id+' has no floating tool component');
  const head=bounds(parts.find(p=>p.name==='head'));for(const p of toolParts)assert.equal(overlap(bounds(p),head,0),false,id+' '+p.name+' clears conservative head bounds');
 }
});

test('Calen alone has source-backed folded wings joined to the real cloak surface and clear of hands and head',()=>{
 for(const id of ids)if(id!=='heaven-calen')assert.equal(Art.parts(id).some(p=>p.wing),false,'no new wings on other people');
 for(const time of [0,2.3])for(const yaw of [0,.6,Math.PI]){
  const {frame,parts}=draw('heaven-calen',{time,yaw});const wings=parts.filter(p=>p.wing);assert.equal(wings.length,6);
  for(const p of wings){for(const v of vertices(p)){assert.ok(v[1]>1.57+.70&&v[1]<1.57+1.45);assert.ok(Math.hypot(v[0]-points.get('heaven-calen').point.x,v[2]-points.get('heaven-calen').point.z)<.47);}
   for(const other of parts.filter(p=>['head','left-hand','right-hand'].includes(p.name)))assert.equal(overlap(bounds(p),bounds(other),0),false,'folded wings clear '+other.name);
  }
  for(const p of wings.filter(p=>p.attachmentPoint)){
   const cloak=parts.find(q=>q.name===p.attachment),anchor=E.M.transform(cloak.m,p.attachmentPoint),tip=E.M.transform(p.m,[0,-.65,0]);near(tip,anchor,'real octa wing root touches the actual cloak back face');
   assert.equal(p.attachmentPoint[2],-.5);assert.ok(Math.abs(p.attachmentPoint[0])<=.5&&Math.abs(p.attachmentPoint[1])<=.5,'anchor lies within the renderer box face');
  }
  for(const sign of[-1,1]){const upper=parts.find(p=>p.name==='folded-wing-upper-'+sign),lower=parts.find(p=>p.name==='folded-wing-lower-'+sign);near(E.M.transform(upper.m,[0,.65,0]),E.M.transform(lower.m,[0,-.65,0]),'fold hinge actually connects');}
  assert.ok(frame.instances<=45);
 }
});

test('material combinations, clothing silhouettes and tools are distinct without assigning game classes or ancestry',()=>{
 assert.equal(new Set(ids.map(id=>JSON.stringify(Art.profiles[id].palette))).size,ids.length);
 assert.equal(new Set(ids.map(id=>Art.profiles[id].tool)).size,9);
 assert.equal(new Set(ids.map(id=>JSON.stringify(Art.parts(id,{reducedMotion:true}).map(p=>[p.kind,p.name,p.s,Array.from(p.m)])))).size,ids.length);
 const rielle=Art.parts('heaven-rielle'),ruby=rielle.filter(p=>p.c===Art.profiles['heaven-rielle'].palette.trim);assert.equal(ruby.length,1);assert.equal(ruby[0].name,'ruby-cuff','the recovered single ruby cuff stays singular');
 const yselle=Art.parts('heaven-yselle');assert.ok(yselle.some(p=>p.name==='red-tool-cord'));assert.ok(yselle.some(p=>p.name==='working-apron'&&p.c===Art.profiles['heaven-yselle'].palette.layer));
 for(const id of ids)for(const field of ['ancestry','class','allegiance','xp','coins','ore','hp','damage','quest','history'])assert.equal(Object.hasOwn(Art.profiles[id],field),false);
});

test('repeated time samples are pure, idle never walks or works, and pause/reduced motion are quiet',()=>{
 for(const id of ids){const a=Art.parts(id,{time:1.1}),b=Art.parts(id,{time:3.7});assert.deepEqual(Art.parts(id,{time:1.1}),a);
  for(const p of a){const av=vertices(p),bv=vertices(b.find(q=>q.name===p.name));for(let i=0;i<av.length;i++)assert.ok(Math.hypot(...av[i].map((n,j)=>n-bv[i][j]))<=.00601,'idle stays within the declared 3mm breathing amplitude');}
  for(const p of a.filter(p=>/sole|boot|thigh|shin/.test(p.name)))assert.deepEqual(p,b.find(q=>q.name===p.name),'stationary feet never animate a stride');
  for(const flag of ['paused','reducedMotion'])assert.deepEqual(Art.parts(id,{time:1.1,[flag]:true}),Art.parts(id,{time:93,[flag]:true}));
  assert.deepEqual(Art.parts(id,{time:1.1,claimed:true,working:true}),a,'arbitrary story/work inputs cannot pretend progress');
  const options=freeze({base:1.57,yaw:.4,time:2.7,reducedMotion:false}),point=points.get(id).point,before=JSON.stringify({point,options,profiles:Art.profiles}),r=draw(id,options);
  assert.ok(r.frame.instances);assert.equal(JSON.stringify({point,options,profiles:Art.profiles}),before);assert.ok(Object.isFrozen(point));
  assert.deepEqual(draw(id,{...options,cameraMode:'third'}),draw(id,{...options,cameraMode:'diorama'}),'both cameras receive the same world geometry');
 }
});

test('unknown people, invalid anchors or output refuse before any partial mutation',()=>{
 const point=points.get('heaven-rielle').point;
 for(const candidate of [null,{...point,id:'neris'},{...point,id:'constructor'},{...point,kind:'objective'},{...point,x:NaN},{...point,z:Infinity},{...point,yaw:NaN}]){
  const out=empty(),before=JSON.stringify(out),result=Art.draw(out,candidate,{base:1.57});assert.equal(result.instances,0);assert.equal(result.id,null);assert.equal(JSON.stringify(out),before);
 }
 for(const options of [null,[],{base:NaN},{base:Infinity},{base:'1.57'},{base:1.57,time:NaN},{base:1.57,realm:'hell'},{base:1.57,yaw:Infinity}]){
  const out=empty(),before=JSON.stringify(out);assert.equal(Art.draw(out,point,options).instances,0);assert.equal(JSON.stringify(out),before);
 }
 for(const out of [{box:[],round:[]},{box:[],round:[],octa:null},{box:Object.freeze([]),round:[],octa:[]},{box:[],round:Object.seal([]),octa:[]}]){const before=JSON.stringify(out);assert.equal(Art.draw(out,point,{base:1.57}).instances,0);assert.equal(JSON.stringify(out),before);}
 for(const options of [null,[],{time:NaN},{time:Infinity}])assert.deepEqual(Art.parts('heaven-rielle',options),[]);
 assert.deepEqual(Art.parts('unknown'),[]);
});
