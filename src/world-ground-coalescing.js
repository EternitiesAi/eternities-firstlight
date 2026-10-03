/* Exact appearance-cell coalescing, after canonical patch ownership is chosen.
 * This pure helper neither chooses owners nor changes physical realm data. */
(function(G){'use strict';
 const GEOMETRY=new Set(['x','z','w','d']);
 function copy(value,seen){
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='undefined')return value;
  if(typeof value==='number'){if(!Number.isFinite(value))throw TypeError('Ground metadata numbers must be finite.');return value;}
  if(typeof value!=='object'||seen.has(value))throw TypeError('Ground metadata must be acyclic plain data.');
  const proto=Object.getPrototypeOf(value);
  if(!Array.isArray(value)&&proto!==Object.prototype&&proto!==null)throw TypeError('Ground metadata must be plain data.');
  if(Object.getOwnPropertySymbols(value).length)throw TypeError('Symbol ground metadata is unsupported.');
  if(Object.getOwnPropertyNames(value).some(k=>!(Array.isArray(value)&&k==='length')&&!Object.getOwnPropertyDescriptor(value,k).enumerable))throw TypeError('Ground metadata must be enumerable plain data.');
  seen.add(value);const out=Array.isArray(value)?new Array(value.length):{};
  for(const k of Object.keys(value).sort()){
   const descriptor=Object.getOwnPropertyDescriptor(value,k);if(!('value'in descriptor))throw TypeError('Ground metadata accessors are unsupported.');
   Object.defineProperty(out,k,{value:copy(descriptor.value,seen),enumerable:true,writable:true,configurable:true});
  }
  seen.delete(value);return out;
 }
 function signature(v){
  if(v===undefined)return'u';if(v===null)return'n';
  if(typeof v==='number')return'd'+(Object.is(v,-0)?'-0':String(v));
  if(typeof v==='string')return's'+JSON.stringify(v);if(typeof v==='boolean')return v?'t':'f';
  return(Array.isArray(v)?'a':'o')+JSON.stringify(Object.keys(v).sort().map(k=>[k,signature(v[k])]))+(Array.isArray(v)?':'+v.length:'');
 }
 const textOrder=(a,b)=>a===b?0:a<b?-1:1;
 const order=(a,b)=>textOrder(a.key,b.key)||a.z0-b.z0||a.z1-b.z1||a.x0-b.x0||a.x1-b.x1;
 function coalesce(cells){
  if(!Array.isArray(cells))throw TypeError('Ground cells must be an array.');
  const prepared=cells.map(cell=>{
   if(!cell||typeof cell!=='object'||Array.isArray(cell))throw TypeError('Ground cells must be data records.');
   const descriptors=Object.getOwnPropertyDescriptors(cell);
   if(Object.getOwnPropertySymbols(cell).length||Object.values(descriptors).some(d=>!('value'in d)||!d.enumerable))throw TypeError('Ground cells must contain enumerable plain data values.');
   for(const k of ['x','z','w','d','y'])if(!Number.isFinite(descriptors[k]?.value))throw TypeError('Finite ground geometry and height are required.');
   if(cell.w<=0||cell.d<=0)throw RangeError('Ground extents must be positive.');
   const metadata={};for(const k of Object.keys(cell).sort())if(!GEOMETRY.has(k))Object.defineProperty(metadata,k,{value:copy(cell[k],new Set()),enumerable:true,writable:true,configurable:true});
   const x0=cell.x-cell.w/2,x1=cell.x+cell.w/2,z0=cell.z-cell.d/2,z1=cell.z+cell.d/2;
   if(![x0,x1,z0,z1].every(Number.isFinite)||x0>=x1||z0>=z1)throw RangeError('Ground cell boundaries must have finite positive span.');
   return{x0,x1,z0,z1,metadata,key:signature(metadata)};
  });
  // Canonical partitions are disjoint. Refuse ambiguous overlapping ownership
  // instead of silently dropping cells or deciding which metadata wins.
  for(let i=0;i<prepared.length;i++)for(let j=i+1;j<prepared.length;j++){
   const a=prepared[i],b=prepared[j];if(a.x0<b.x1&&a.x1>b.x0&&a.z0<b.z1&&a.z1>b.z0)throw RangeError('Ground cells must have disjoint interiors.');
  }
  let rectangles=prepared;
  for(;;){
   const before=rectangles.length;rectangles.sort(order);const rows=[];
   for(const p of rectangles){
    const last=rows.at(-1);
    if(last&&last.key===p.key&&last.z0===p.z0&&last.z1===p.z1&&last.x1===p.x0)last.x1=p.x1;
    else rows.push({...p});
   }
   rows.sort((a,b)=>textOrder(a.key,b.key)||a.x0-b.x0||a.x1-b.x1||a.z0-b.z0||a.z1-b.z1);
   const columns=[];
   for(const p of rows){
    const last=columns.at(-1);
    if(last&&last.key===p.key&&last.x0===p.x0&&last.x1===p.x1&&last.z1===p.z0)last.z1=p.z1;
    else columns.push({...p});
   }
   rectangles=columns;if(rectangles.length===before)break;
  }
  return rectangles.sort((a,b)=>a.x0-b.x0||a.z0-b.z0||a.x1-b.x1||a.z1-b.z1||textOrder(a.key,b.key)).map(p=>{
   const x=p.x0/2+p.x1/2,z=p.z0/2+p.z1/2,w=p.x1-p.x0,d=p.z1-p.z0;
   if(![x,z,w,d].every(Number.isFinite)||w<=0||d<=0)throw RangeError('Merged ground extents must remain finite and positive.');
   return{x,z,w,d,...copy(p.metadata,new Set())};
  });
 }
 const api=Object.freeze({coalesce});G.RealmWorldGroundCoalescing=api;
 if(typeof module!=='undefined')module.exports=api;
})(globalThis);
