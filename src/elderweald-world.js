/* Original bounded Elderweald-facing country, appended to Coastward Earth.
 * Geography is authority data; parts() is appearance only. No quest/save work. */
(function(G){'use strict';
 const FLOOR=1.57,TAU=Math.PI*2;
 const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
 const patch=(id,x,z,w,d,color=0x68755c)=>({id,x,z,w,d,y:FLOOR,color});
 const solid=(id,x,z,w,d,h,color=0x685844)=>({id,x,z,w,d,h,color});
 const point=(id,name,x,z,kind,text,detail)=>({id,name,x,z,y:FLOOR,kind,text,detail});
 // Leave an actual clearing around the keeper and packing area. These two
 // stands belong at its edges, clear of both ordinary and low diorama rays.
 const trees=[[-46,-10],[-53,-24],[-82,4],[-73,4],[-88,1],[-45,1],
  [-94,-13],[-62,-31],[-84,-39],[-100,-40],[-103,-10],[-120,-14],
  [-128,-32],[-112,-41],[-140,-55],[-116,-64],[-152,-58],[-160,-70],
  [-161,-88],[-132,-86],[-156,-100],[-130,-109],[-116,-94],[-98,-114],
  [-86,-101],[-82,-77],[-62,-91],[-60,-70],[-45,-56],[-40,-68],
  [-108,-17],[-139,-91]];
 const main=[[-29,-15],[-52,-15],[-70,-8],[-109,-28],[-125,-44],[-125,-49],[-125,-57],
  [-137,-62],[-148,-64],[-148,-75],[-148,-86],[-139,-100],[-110,-108],
  [-68,-99],[-54,-65],[-26,-61.5]];
 const extension=freeze({
  id:'elderweald-facing-country',realm:'earthlands',room:'world-earthlands',groundY:FLOOR,
  name:'The Elderweald-facing circuit',provisional:true,
  bounds:{minX:-170,maxX:-24,minZ:-118,maxZ:7},
  patches:[patch('elderweald-north-junction',-43,-15,32,14),
   patch('elderweald-tended-edge',-63,-10,46,34,0x728064),
   patch('elderweald-clearing-country',-80,-20,60,54,0x748168),
   patch('elderweald-wetland-rim',-108,-26,46,42,0x596f60),
   patch('elderweald-footbridge',-125,-49,6,8,0x81705a),
   patch('elderweald-south-bank',-133,-65,42,28,0x5e7057),
   patch('elderweald-root-country',-145,-86,50,44,0x586752),
   patch('elderweald-return-moor',-109,-104,64,28,0x747b60),
   patch('elderweald-meadow-return',-71,-83,42,54,0x7b8669),
   patch('elderweald-field-return',-40,-62,32,18,0x818669)],
  solids:[solid('elderweald-bridge-west-rail',-127.65,-49,.22,7,.85),
   solid('elderweald-bridge-east-rail',-122.35,-49,.22,7,.85),
   solid('elderweald-root-west-wall',-152,-75,1.4,14,2.35,0x737969),
   solid('elderweald-root-east-wall',-144,-75,1.4,14,2.35,0x737969),
   ...[-1,1].flatMap(a=>[-1,1].map(b=>solid('elderweald-camp-post-'+a+'-'+b,-74+a*1.7,-8+b*2.1,.24,.24,2.5))),
   ...trees.map(([x,z],i)=>solid('elderweald-trunk-'+i,x,z,.78+(i%3)*.1,.78+(i%3)*.1,4.3+(i%4)*.45,i%2?0x655844:0x574c3d))],
  routes:[{id:'elderweald-country-out-and-back',points:main},
   {id:'elderweald-camp-invitation',points:[[-70,-8],[-67,-4]]},
   {id:'elderweald-preparation-approach',points:[[-70,-8],[-70,-12],[-76,-12]]},
   {id:'elderweald-stormfall-approach',points:[[-76,-12],[-82,-18]]},
   {id:'elderweald-managed-approach',points:[[-76,-12],[-80,-8],[-78,-2]]},
   {id:'elderweald-herbalist-approach',points:[[-109,-28],[-103,-23]]},
   {id:'elderweald-crossing-side-pocket',points:[[-125,-44],[-119,-44]]},
   {id:'elderweald-root-side-pocket',points:[[-137,-62],[-134,-70]]},
   {id:'elderweald-support-approach',points:[[-148,-86],[-145,-84]]},
   {id:'elderweald-return-delivery-approach',points:[[-110,-108],[-106,-105]]},
   {id:'elderweald-coastward-loop-closure',points:[[-26,-61.5],[-6,-61.5],[-6,-41],[-10,-34],[-10,-15],[-29,-15]]}],
  points:[point('elderweald-rill','Rill · forestkeeper',-67,-4,'person',
   'The road stays open. Take a look at the load before choosing what to carry.',
   'A local keeper at an ordinary working camp. The work is offered; entering the country accepts nothing.'),
   point('elderweald-sela','Sela · herbalist',-103,-23,'person',
    'The reeds mark wet ground. Keep the walking line firm and leave the living beds alone.',
    'A quiet stop beside the wetland edge; no new harvesting or allegiance follows this conversation.'),
   point('elderweald-preparation','Camp preparation',-76,-12,'objective','Read the load before choosing material.','An open packing space beside the camp.'),
   point('elderweald-stormfall','Stormfall stock',-82,-18,'objective','Storm-fallen timber lies beside the track.','This original set dressing is distinct from an inventory grant.'),
   point('elderweald-managed-growth','Managed growth',-78,-2,'objective','A marked working stand offers a different allocation.','An ordinary designated work area; standing scenery is not harvestable.'),
   point('elderweald-wetland-check','Wetland edge',-109,-28,'objective','Read the wet ground before placing a support.','The river gap has one supported footbridge; the reeds are scenery.'),
   point('elderweald-root-reading','Root-channel load',-148,-66,'objective','Look down the open root channel before entering.','The route passes between the original masonry flanks. Its overhead roots clear a standing traveller.'),
   point('elderweald-alternate-support','Root-channel support',-145,-84,'objective','A support station stands beyond the passage.','The open working space is south of both flank walls.'),
   point('elderweald-return-glade','Return glade delivery',-106,-105,'objective','The return track opens into a packing glade.','A local delivery point; the ordinary road continues back to Coastward.')],
  landmarks:[{id:'elderweald-clearing-camp',name:'Clearing camp',x:-70,z:-8,y:FLOOR},
   {id:'elderweald-wetland',name:'Wetland rim',x:-109,z:-28,y:FLOOR},
   {id:'elderweald-river-crossing',name:'River footbridge',x:-125,z:-49,y:FLOOR},
   {id:'elderweald-root-channel',name:'Ancient root channel',x:-148,z:-75,y:FLOOR},
   {id:'elderweald-return-clearing',name:'Return glade',x:-110,z:-108,y:FLOOR}],
  encounterClearings:[{id:'elderweald-crossing-clearing',x:-119,z:-44,y:FLOOR},
   {id:'elderweald-root-clearing',x:-134,z:-70,y:FLOOR}],
  artBudget:620
 });
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 function parts(options={}){
  if(!options||typeof options!=='object'||Array.isArray(options))throw TypeError('Elderweald art options are required.');
  const quality=options.quality??'balanced';if(!['low','balanced','high'].includes(quality))throw RangeError('Unknown Elderweald art quality.');
  const height=options.height??(()=>FLOOR);if(typeof height!=='function')throw TypeError('Height must be a function.');
  // Validate every actual authority parent before generating any appearance.
  for(const p of [...extension.solids,...extension.points,...extension.landmarks]){
   const y=height(p.x,p.z);if(!Number.isFinite(y)||Math.abs(y-FLOOR)>1e-6)throw RangeError('Elderweald support must remain at its canonical 1.57m floor.');
  }
  const out=[],meta=(role,parent,extra={})=>({appearanceOnly:true,cameraSolid:false,cutaway:false,
   rough:.96,elderwealdPart:role,...(parent?{solidId:parent,worldSolidId:parent,structureId:parent}:{}),...extra});
  const add=(kind,p,s,c,role,parent,extra={})=>out.push({kind,p,s,c,opt:meta(role,parent,extra)});
  const beam=(a,b,w,d,c,role,parent,extra={},reference=[0,1,0])=>{
   const delta=b.map((v,i)=>v-a[i]),length=Math.hypot(...delta),axis=unit(delta);
   const ref=Math.abs(dot(reference,axis))>.95?[1,0,0]:reference;
   const up=unit(ref.map((v,i)=>v-axis[i]*dot(ref,axis))),side=cross(axis,up);
   const p=a.map((v,i)=>(v+b[i])/2),s=[length,w,d];
   const m=[...axis.map(v=>v*length),0,...up.map(v=>v*w),0,...side.map(v=>v*d),0,...p,1];
   add('timber-panel',p,s,c,role,parent,{m,anchorFrom:a,anchorTo:b,...extra});
  };
  const treeSolids=extension.solids.filter(s=>s.id.startsWith('elderweald-trunk-'));
  for(const [i,t] of treeSolids.entries()){
   const {x,z,w,d,h,id}=t,wood=t.color,spread=1+(i%3)*.12;
   const greens=[0x344f40,0x446047,0x526951],arms=quality==='low'?2:3;
   for(const side of [-1,1]){
    beam([x,FLOOR+.06,z+side*(d/2+.005)],[x,FLOOR+h-.05,z+side*(d/2+.005)],w-.03,.018,wood,'bark-face',id,{},[1,0,0]);
    if(quality!=='low')beam([x+side*(w/2+.005),FLOOR+.06,z],[x+side*(w/2+.005),FLOOR+h-.05,z],d-.03,.018,wood,'bark-face',id,{},[0,0,1]);
   }
   for(let arm=0;arm<arms;arm++){
    const a=i*.67+arm*TAU/arms,dx=Math.cos(a),dz=Math.sin(a);
    const from=[x,FLOOR+h*.8,z],to=[x+dx*2.1*spread,FLOOR+h+.65,z+dz*2.1*spread];
    beam(from,to,.26,.29,wood,'crown-branch',id,{branchIndex:arm,cutaway:true});
    const kind=(i+arm)%3===0&&quality!=='low'?'round':'octa';
    add(kind,[to[0],to[1]+1.1,to[2]],[6.1*spread,3.7,5.8*spread],greens[(i+arm)%3],'crown-lobe',id,
     {branchIndex:arm,foliage:true,wind:2,cutaway:true,restAnchor:to});
    if(quality==='high'){
     const radius=Math.min(w,d)/2+.055;
     beam([x,FLOOR+.17,z],[x+dx*radius,FLOOR+.075,z+dz*radius],.105,.105,wood,'buttress-root',id,{lowRoot:true});
    }
   }
   add('octa',[x,FLOOR+h+2.1,z],[7.8*spread,4.1,7.5*spread],greens[(i+1)%3],'upper-crown',id,{foliage:true,wind:2,cutaway:true});
  }
  // A timber skin lies within 3cm of the authoritative bridge, with open ends.
  for(let i=0;i<8;i++)add('timber-panel',[-125,FLOOR+.012,-52.5+i],[5.02,.024,.94],i%2?0x8a775a:0x78654e,'bridge-plank',null);
  for(const side of [-1,1]){
   const x=-125+side*2.65,id=side<0?'elderweald-bridge-west-rail':'elderweald-bridge-east-rail';
   beam([x,FLOOR+.84,-52.4],[x,FLOOR+.84,-45.6],.14,.25,0x544735,'bridge-hand-rail',id);
   for(const z of [-51.8,-49,-46.2])add('timber-panel',[x,FLOOR+.43,z],[.24,.86,.24],0x65533d,'bridge-post',id);
  }
  // A real open-sided working shelter: existing posts own all ground collision.
  for(const z of [-10.1,-5.9])beam([-75.7,FLOOR+2.42,z],[-72.3,FLOOR+2.42,z],.18,.2,0x554734,'camp-tie-beam',null,{cutaway:true});
  for(const side of [-1,1])beam([-74,FLOOR+3.12,-8],[-74+side*2.05,FLOOR+2.5,-8],.08,5,
   0x6a5b43,'camp-roof',null,{cutaway:true});
  for(const z of [-10.2,-8,-5.8]){
   beam([-76,FLOOR+2.42,z],[-74,FLOOR+3.04,z],.12,.16,0x4c402f,'camp-rafter',null,{cutaway:true});
   beam([-74,FLOOR+3.04,z],[-72,FLOOR+2.42,z],.12,.16,0x4c402f,'camp-rafter',null,{cutaway:true});
  }
  // Packed props stay off invitation/preparation body and walking envelopes.
  for(let i=0;i<3;i++)add('timber-panel',[-72.5,FLOOR+.23+i*.11,-10.9],[1.6,.2,.55],0x786346,'camp-stock',null);
  for(let i=0;i<3;i++)add('octa',[-83.3+i*.43,FLOOR+.16,-19.55],[.7,.23,.55],0x787868,'stormfall-stones',null);
  for(let i=0;i<3;i++)beam([-83.2,FLOOR+.24+i*.13,-19],[-80.4,FLOOR+.24+i*.13,-19],.24,.25,0x78634c,'stormfall-log',null);
  // Ancient retained masonry is tied to the authority flanks; the overhead
  // arch/root mass begins above a standing actor, not inside the passage.
  for(const side of [-1,1]){
   const x=-148+side*4,id=side<0?'elderweald-root-west-wall':'elderweald-root-east-wall';
   for(let i=0;i<7;i++)add('box',[x,FLOOR+2.44,-81+i*2],[1.48,.18,1.92],i%2?0x89907a:0x78816e,'masonry-cap',id);
   for(const z of [-80,-70])beam([x,FLOOR+2.28,z],[-148,FLOOR+3.52,z],.42,.52,0x5b4d39,'root-arch',id,{cutaway:true});
  }
  for(const z of [-80,-70])beam([-148,FLOOR+3.52,z-1],[-148,FLOOR+3.52,z+1],.68,.68,0x514331,'root-keystone',null,{cutaway:true});
  // Reeds indicate the river edge; none occupy the bridge or interaction line.
  const reeds=quality==='low'?12:24;
  for(let i=0;i<reeds;i++){
   const north=i%2===0,x=-130+(i%12)*.75,z=north?-46.3:-51.7;
   if(Math.abs(x+125)<3.2)continue;
   add('octa',[x,FLOOR+.45+(i%3)*.08,z],[.22,.65,.25],i%3?0x7c8c54:0x9a9b60,'wetland-reed',null);
  }
  // Two ordinary glade packing racks remain south of the delivery position.
  for(const x of [-112,-110.7])add('timber-panel',[x,FLOOR+.28,-110.3],[1.08,.5,.7],0x867153,'glade-stock',null);
  for(const z of [-106,-102])add('octa',[-143,FLOOR+.22,z],[1.35,.33,1.1],0x767b67,'root-country-stone',null);
  if(out.length>extension.artBudget)throw RangeError('Elderweald art instance budget exceeded.');
  return out;
 }
 const api=Object.freeze({extension,parts});G.RealmElderwealdWorld=api;
 if(typeof module!=='undefined')module.exports=api;
})(globalThis);
