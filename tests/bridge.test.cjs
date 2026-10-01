/* Physical crossing, actual vault mesh and shared world/reflection sky rays. */
const{test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/earth.js'),R=require('../src/engine.js'),B=require('../src/bridge-art.js');
const capture=()=>{const parts=[];const a={box:(...v)=>a.add('box',...v),add:(kind,x,y,z,sx,sy,sz,color,options)=>parts.push({kind,p:[x,y,z],s:[sx,sy,sz],color,...options})};B.crossing(a);B.shoreline(a);B.mountains(a);return parts;};
test('bridge floor is a continuous narrow supported corridor; flanking water rejects movement and picking',()=>{
 for(let z=12.4;z<27;z+=.19){assert.ok(E.walkable(0,z));assert.equal(E.walkable(3,z),false);assert.equal(E.pick([3,20,z],[0,-1,0]),null);assert.ok(E.pick([0,20,z],[0,-1,0]));assert.equal(E.height(0,z),E.BRIDGE.deck);}
 assert.ok(E.segment({x:0,z:27.5},{x:0,z:10}));assert.equal(E.segment({x:0,z:24},{x:3,z:20}),false);
 assert.equal(E.walkable(1.5,20),false,'actor radius cannot penetrate the open rails');
 assert.ok(E.walkable(1.29,20));
});
test('fresh and returning movement crosses both banks and retains canonical ownership',()=>{
 for(const started of[false,true]){const sim=new C.Simulation(C.fresh());if(started){sim.state.player={x:11,z:9,yaw:0};assert.ok(sim.adventureCommand('kit','start').ok);}
  sim.state.player={x:0,z:23,yaw:0};const ctx={sim,active:'bridge-fixture',revision:1};assert.ok(E.enter(E.preview(ctx).ticket,ctx,{save:()=>({ok:true}),build:()=>{}}).ok);
  const before=structuredClone(sim.state.adventure);for(const z of[27.5,10,24]){assert.ok(sim.moveTo(0,z).ok);for(let i=0;i<3000&&sim.playerPath.length;i++){const p={...sim.state.player};sim.tick(.05);assert.ok(E.segment(p,sim.state.player));}assert.ok(Math.abs(sim.state.player.z-z)<.3);}
  for(const k of['xp','equipment','owned','arsenal','earthStory','earthGathering','starter','pursuit','classPath'])assert.deepEqual(sim.state.adventure[k],before[k]);
  assert.ok(E.leave(sim).ok);assert.equal(new C.Simulation(sim.snapshot()).room,null);
 }
});
test('bridge pieces respect finite budgets, floor, open rails and per-pier water contact',()=>{
 const parts=capture(),bridge=parts.filter(p=>p.bridgePart),mountains=parts.filter(p=>p.mountainPart);
 assert.ok(bridge.length<=420);assert.ok(mountains.length<=90);assert.equal(bridge.filter(p=>p.kind==='bridge-vault').length,4);
 for(const p of parts){assert.ok(p.p.concat(p.s).every(Number.isFinite));assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);}
 const deck=bridge[0];assert.equal(deck.p[1]+deck.s[1]/2,E.BRIDGE.deck);assert.equal(deck.s[2],E.BRIDGE.d);
 for(const z of E.BRIDGE.piers)assert.ok(bridge.some(p=>p.kind==='box'&&p.p[2]===z&&p.s[0]===3.7&&p.p[1]-p.s[1]/2<R.WATER_HEIGHT));
 for(const p of bridge.filter(p=>p.p[1]>E.BRIDGE.deck))assert.ok(Math.abs(p.p[0])>=1.6,'rail/sign blocks the player corridor');
});
test('vault is actual finite open elliptic geometry, not a filled box or floating ring',()=>{
 const mesh=R.geometry('bridge-vault');assert.equal(mesh.length/18,100);
 for(let i=0;i<mesh.length;i+=6){const[x,y,z,nx,ny,nz]=mesh.slice(i,i+6);assert.ok([x,y,z,nx,ny,nz].every(Number.isFinite));assert.ok(Math.abs(x)<=.5&&y>=-1e-7&&y<=1.270001&&Math.abs(z)<=1.875001);assert.ok(Math.hypot(nx,ny,nz)>.99);}
 // The center underside is above water while spring endpoints reach the pier.
 const verts=Array.from({length:mesh.length/6},(_,i)=>Array.from(mesh.slice(i*6,i*6+3)));
 assert.ok(verts.some(p=>Math.abs(p[2])<1e-5&&Math.abs(p[1]-1.1)<1e-5));assert.ok(verts.some(p=>Math.abs(p[2])>1.59&&Math.abs(p[1])<1e-5));
 let west=0,east=0,crown=0,inner=0;
 for(let i=0;i<mesh.length;i+=18){const p=Array.from(mesh.slice(i,i+3)),n=Array.from(mesh.slice(i+3,i+6));
  if(Math.abs(n[0])>.99){assert.equal(Math.sign(n[0]),Math.sign(p[0]));if(n[0]<0)west++;else east++;}
  else if(Math.abs(n[1])>.99&&Math.abs(p[1]-1.27)<1e-5){assert.ok(n[1]>0);crown++;}
  else if(Math.abs(n[1])>.2&&p[1]<1.11){assert.ok(n[1]<0,'inner arch/cap normal points into stone');inner++;}
 }
 assert.equal(west,24);assert.equal(east,24);assert.equal(crown,24);assert.ok(inner>=20);
});
test('Earth submits the bridge instead of terrain columns inside its water span',()=>{
 require('../src/drover-art.js');require('../src/millwright-art.js');require('../src/mill-gate-art.js');require('../src/earth-art.js');
 const parts=[],a={e:{},map:{},begin(){},commit(){},box:(...v)=>a.add('box',...v),beam(){},bench(){},add(kind,x,y,z,sx,sy,sz,c,opt={}){const p={kind,p:[x,y,z],s:[sx,sy,sz],c,...opt};parts.push(p);(this.map[kind]||(this.map[kind]=[])).push(p);}};
 globalThis.RealmEarthArt.make(a);
 assert.equal(parts.filter(p=>p.kind==='bridge-vault').length,4);
 for(const p of parts.filter(p=>p.kind==='box'&&p.s[1]===5))assert.ok(p.p[2]<=E.BRIDGE.from||p.p[2]>=E.BRIDGE.to,'filled ground plugs the water span');
 assert.equal(a.e.earthWater,E.BRIDGE);
 const solids=parts.filter(p=>p.kind==='box'&&p.p[2]>E.BRIDGE.from&&p.p[2]<E.BRIDGE.to&&p.p[1]-p.s[1]/2>E.BRIDGE.deck+.1);
 for(const p of solids)assert.ok(Math.abs(p.p[0])-p.s[0]/2+1e-7>=E.BRIDGE.walkWidth/2,'actual Earth marker/rail occupies the walking corridor');
 // Lowering the ridge silhouette exposes these older hill crowns. Each
 // smaller crown must intersect its actual parent mass rather than float.
 const crowns=parts.filter(p=>p.kind==='round'&&p.s[0]===7&&p.s[1]===4&&p.s[2]===7&&Math.hypot(p.p[0],p.p[2])>60);
 assert.equal(crowns.length,13);
 for(const crown of crowns){const parent=parts.find(p=>p.kind==='round'&&p.p[0]===crown.p[0]&&p.p[2]===crown.p[2]&&p.s[0]>=14&&p.s[1]>=8);assert.ok(parent);assert.ok(crown.p[1]-2<parent.p[1]+parent.s[1]/2,'distant hill crown floats above its parent');}
});
test('asymmetric mountain mesh is bounded finite original ground rather than cone peaks',()=>{
 const mesh=R.geometry('mountain-ridge');assert.equal(mesh.length/18,336);
 let peak=0;for(let i=0;i<mesh.length;i+=6){const[x,y,z]=mesh.slice(i,i+3);assert.ok(Number.isFinite(x+y+z));assert.ok(Math.abs(x)<=.5&&Math.abs(z)<=.5&&y>=0&&y<=1);peak=Math.max(peak,y);}
 assert.ok(peak>.65&&peak<1);
});
test('world cloud basis preserves the exact reflected VP horizontal handedness in both cameras',()=>{
 for(const projection of['perspective','orthographic'])for(const angle of[.2,1.5,3,4.7]){
  const camera={eye:[Math.sin(angle)*20,6,Math.cos(angle)*20],target:[0,1.5,0],projection,fov:60,half:10,aspect:1.77},a=R.skyFrame(camera),b=R.skyFrame(camera,true);
  for(const key of['right','up','forward'])for(let i=0;i<3;i++)assert.equal(b[key][i],i===1?-a[key][i]:a[key][i]);
  assert.equal(b.eye[1],2*R.WATER_HEIGHT-a.eye[1]);assert.ok(Math.abs(R.dot(a.forward,a.right))<1e-8);assert.ok(Math.abs(R.dot(a.forward,a.up))<1e-8);
  assert.equal(a.perspective,projection==='perspective');assert.equal(a.spread,b.spread);
 }
});
test('rock skirt has outward finite faces, a straight upper seam and submerged irregular lower edge',()=>{
 const mesh=R.geometry('bank-slope');assert.equal(mesh.length/18,72);
 let upper=0,lower=0;
 for(let i=0;i<mesh.length;i+=18){
  const n=Array.from(mesh.slice(i+3,i+6));assert.ok(n.every(Number.isFinite));assert.ok(Math.hypot(...n)>.99);
  if(Math.abs(n[2])>.99)assert.equal(Math.sign(n[2]),Math.sign(mesh[i+2]));else assert.ok(n[1]>0&&n[0]>0,'exposed surface points upward/outward');
  for(let j=i;j<i+18;j+=6){const[x,y,z]=mesh.slice(j,j+3);assert.ok(x>=0&&x<=1.141&&y>=-.030001&&y<=1&&Math.abs(z)<=.5);if(y===1){assert.equal(x,0);upper++;}if(y<0)lower++;}
 }
 assert.ok(upper>8&&lower>8);
});
test('actual shoreline world triangles leave vaults and supported walking floor clear without fake flat ground',()=>{
 const parts=capture().filter(p=>p.shorelinePart);assert.ok(parts.length>0&&parts.length<=100);
 const slopes=parts.filter(p=>p.kind==='bank-slope');assert.equal(slopes.length,7);
 for(const p of parts){
  const matrix=R.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),mesh=R.geometry(p.kind);
  assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);
  for(let i=0;i<mesh.length;i+=18){
   const vs=[0,6,12].map(o=>R.M.transform(matrix,Array.from(mesh.slice(i+o,i+o+3))));assert.ok(vs.flat().every(Number.isFinite));
   const bounds=axis=>[Math.min(...vs.map(v=>v[axis])),Math.max(...vs.map(v=>v[axis]))],x=bounds(0),y=bounds(1),z=bounds(2);
   assert.ok(y[1]<E.BRIDGE.deck-.03,'bank dressing extends above supported feet');
   assert.ok(x[1]<-E.BRIDGE.w/2||x[0]>E.BRIDGE.w/2||z[1]<=E.BRIDGE.from||z[0]>=E.BRIDGE.to||y[1]<=R.WATER_HEIGHT,'bank fills an actual open vault');
  }
 }
 for(const p of slopes){assert.ok(p.s[0]<=.85&&p.s[1]/p.s[0]>1.7);assert.equal(p.p[1],R.WATER_HEIGHT);assert.equal(p.p[1]+p.s[1],E.height(p.p[0],p.p[2])-.04);assert.ok(p.p[1]-.03*p.s[1]<R.WATER_HEIGHT);}
 // Decorative slopes are not secretly accepted land or click targets.
 for(const [x,z]of[[5.4,27.5],[-5.4,27.5],[0,28.4],[4,26.5],[4,12.5]]){assert.equal(E.walkable(x,z),false);assert.equal(E.pick([x,20,z],[0,-1,0]),null);}
 assert.ok(E.segment({x:0,z:10},{x:0,z:27.5}));
});
test('mountain spacing leaves three receding layers and fits the existing scenery budget',()=>{
 const mountains=capture().filter(p=>p.mountainPart);assert.equal(mountains.length,36);
 const fronts=[];for(let layer=0;layer<3;layer++){const parts=mountains.filter(p=>p.mountainLayer===layer);assert.equal(parts.length,12);fronts.push(Math.min(...parts.map(p=>p.p[0])));}
 assert.ok(fronts[1]>fronts[0]+30&&fronts[2]>fronts[1]+30);
});
