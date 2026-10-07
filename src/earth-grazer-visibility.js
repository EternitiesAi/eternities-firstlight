/* Presentation inspection only. Actual app rendering and private actor receipts
 * remain the authority; this function cannot record progress or mint a ticket. */
(function(G){'use strict';
const E=G.RealmEngine||(typeof require==='function'?require('./engine.js'):null);
if(!E?.geometry||!E?.M)throw Error('Load the actual Engine before visibility inspection.');
const unitMeshes=new Map(),meshes=new WeakMap(),finite=a=>Array.isArray(a)&&a.every(Number.isFinite);
function unit(kind){
 if(!unitMeshes.has(kind)){
  const raw=E.geometry(kind),stride=kind==='timber-panel'?8:6,points=[];
  if(!raw.length||raw.length%(stride*3))throw Error('Unrecognised triangle mesh.');
  for(let i=0;i<raw.length;i+=stride)points.push(Array.from(raw.slice(i,i+3)));
  unitMeshes.set(kind,points);
 }return unitMeshes.get(kind);
}
function model(kind,item,packed){
 const m=Array.from(packed.slice(0,16)),wind=packed[22];
 if(m.length!==16||!Array.from(m).every(Number.isFinite))throw Error('Invalid actual primitive transform.');
 if(!Number.isFinite(wind))throw Error('Invalid actual packed wind parameter.');
 const signature=kind+'|'+m.join(',')+'|'+wind,old=meshes.get(item);
 if(old?.signature===signature)return old;
 const points=unit(kind).map(p=>E.M.transform(m,p)),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const p of points)for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}
 // Production VS wind amplitudes: .12/.075 times local Y for wind1,
 // .095/.05 for wind2. A swept box refuses ambiguous foliage visibility.
 if(wind>.5&&wind<1.5){const y=Math.max(...unit(kind).map(p=>Math.abs(p[1])));min[0]-=.12*y;max[0]+=.12*y;min[2]-=.075*y;max[2]+=.075*y;}
 if(wind>1.5&&wind<2.5){min[0]-=.095;max[0]+=.095;min[1]-=.05;max[1]+=.05;}
 const result={signature,points,min,max,swept:wind>.5&&wind<2.5};meshes.set(item,result);return result;
}
function intersectsBox(a,b,mesh){
 let lo=0,hi=1;
 for(let i=0;i<3;i++){
  const d=b[i]-a[i];if(Math.abs(d)<1e-12){if(a[i]<mesh.min[i]||a[i]>mesh.max[i])return false;}
  else{const u=(mesh.min[i]-a[i])/d,v=(mesh.max[i]-a[i])/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}
 }return hi>=lo&&hi>1e-5&&lo<1-1e-5;
}
function intersectsTriangle(a,b,p,q,r){
 const direction=E.sub(b,a),u=E.sub(q,p),v=E.sub(r,p),h=E.cross(direction,v),det=E.dot(u,h);
 if(Math.abs(det)<1e-9)return false;
 const inv=1/det,s=E.sub(a,p),t=inv*E.dot(s,h);if(t<0||t>1)return false;
 const j=inv*E.dot(direction,E.cross(s,u));if(j<0||t+j>1)return false;
 const distance=inv*E.dot(v,E.cross(s,u));return distance>1e-5&&distance<1-1e-5;
}
function inspect(engine,actor){
 try{
  if(!engine||engine._contextLost||typeof engine.project!=='function'||!finite(engine.camera?.eye)||
   !Number.isFinite(engine.canvas?.clientWidth)||!Number.isFinite(engine.canvas?.clientHeight)||
   engine.canvas.clientWidth<1||engine.canvas.clientHeight<1||typeof actor!=='string'||!actor)return{visible:false,reason:'renderer-unavailable'};
  const actual=[],parts=[];
  for(const batch of[...(engine.batches||[]),...(engine.dynamic||[])]){
   if(!Array.isArray(batch.items)||!Number.isSafeInteger(batch.count)||batch.count!==batch.items.length||
    !(batch.data instanceof Float32Array)||batch.data.length!==batch.count*24)throw Error('Actual packed submission and member counts must agree.');
   for(let i=0;i<batch.count;i++){
    const row={kind:batch.kind,item:batch.items[i],packed:batch.data.subarray(i*24,(i+1)*24)};actual.push(row);
    if((engine.dynamic||[]).includes(batch)&&row.item.grazerActor===actor)parts.push(row);
   }
  }
  const cues=['long-body','slender-head','feeding-muzzle','soft-nose'].map(id=>parts.find(p=>p.item.grazerPart===id));
  if(cues.some(p=>!p))return{visible:false,reason:'missing-actual-submission'};
  const bounds=parts.flatMap(p=>model(p.kind,p.item,p.packed).points.map(v=>engine.project(...v)));
  const width=engine.canvas.clientWidth,height=engine.canvas.clientHeight;
  if(bounds.some(p=>!p.visible||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<1||p.x>width-1||p.y<1||p.y>height-1))return{visible:false,reason:'clipped-actual-silhouette'};
  const span={width:Math.max(...bounds.map(p=>p.x))-Math.min(...bounds.map(p=>p.x)),height:Math.max(...bounds.map(p=>p.y))-Math.min(...bounds.map(p=>p.y))};
  if(span.width<16||span.height<12)return{visible:false,reason:'silhouette-too-small',span};
  const targets=cues.map(p=>{const q=model(p.kind,p.item,p.packed);return q.min.map((v,i)=>(v+q.max[i])/2);}),blocked=[];
  for(let index=0;index<targets.length;index++){
   const target=targets[index];let obstruction=null;
   outer:for(const {kind,item,packed}of actual){
    if(item.grazerActor===actor)continue;
    const mesh=model(kind,item,packed);if(!intersectsBox(engine.camera.eye,target,mesh))continue;
    if(mesh.swept){obstruction={kind,part:item.worldSolidId||item.grazerPart||null,swept:true};break outer;}
    for(let i=0;i<mesh.points.length;i+=3)if(intersectsTriangle(engine.camera.eye,target,...mesh.points.slice(i,i+3))){obstruction={kind,part:item.worldSolidId||null,swept:false};break outer;}
   }if(obstruction)blocked.push({sample:index,...obstruction});
  }
  return{visible:blocked.length===0,reason:blocked.length?'actual-mesh-obstructed':'clear-actual-mesh-samples',span,parts:parts.length,samples:targets.length,blocked};
 }catch(error){return{visible:false,reason:'invalid-actual-submission',error:String(error.message||error)};}
}
G.RealmEarthGrazerVisibility={inspect};if(typeof module!=='undefined')module.exports=G.RealmEarthGrazerVisibility;
})(typeof globalThis!=='undefined'?globalThis:this);
