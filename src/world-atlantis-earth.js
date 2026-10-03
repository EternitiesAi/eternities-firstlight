/* Original Earth/Atlantis foundations. Data and scenery only; shared world rules
 * own travel, movement, work, combat and persistence. No personal/save mutation. */
(function (G) {
 'use strict';
 const GROUND = 1.57;
 const earthPalette = {ground:0x839765,stone:0x938e78,trim:0x9b7952,sky:0xc2d0cd};
 const seaPalette = {ground:0xc1ba9b,stone:0x9ca8a0,trim:0xa28550,sky:0x82b4c0};
 const patch = (id,x,z,w,d,color) => ({id,x,z,w,d,y:GROUND,color});
 const solid = (id,x,z,w,d,h,color) => ({id,x,z,w,d,h,color});
 const trees = [[-12,5],[-8,-18],[-12,-28],[12,5],[17,-15],[12,-26],[-24,-39],[25,-43],[-22,-63],[23,-65]];
 const earth = {
  id:'earthlands',room:'world-earthlands',name:'Earth · Coastward Road',
  kicker:'Broader Earth foundation · provisional local geography',
  description:'A long channel bridge opens onto woodland lanes, working fields and a small roadside settlement. Coastward Road is a provisional extension; Hearthwater and its people retain their existing places and history.',
  sourceNotes:'Original opening inspired by Earth E02 Crownfields, E05 Reedmere and E08 Rainward. Coastward Road, Merren and Vessa are new provisional names, not recovered manuscript canon.',
  entry:{x:0,z:104,yaw:Math.PI},bounds:{minX:-42,maxX:42,minZ:-92,maxZ:115},
  patches:[
   patch('arrival-bank',0,102,26,24,0x809665),
   patch('channel-bridge',0,55,8,76,0x9b7952),
   patch('far-bank',0,23,34,20,0x829768),
   // A real connected woodland floor between the original lanes. Ground,
   // picking, paths and the visible partition all read this same definition.
   // Existing work, people, hazards and bridge footprints remain in place.
   patch('woodland-country',1,-8,42,48,0x81966a),
   patch('woodland-west',-10,-8,8,48,0x85966b),
   patch('woodland-east',14,-8,9,48,0x8c9c6e),
   patch('field-approach',1,-35,40,14,0x9d9673),
   patch('working-fields',0,-50,58,25,0x8d9e69),
   patch('roadside-settlement',0,-73,52,26,0xa49d80),
   patch('shore-spur',22,-19,20,8,0x8f9c73),
   patch('shore-overlook',30,-20,16,16,0x9b9e7c),
   patch('coppice-spur',-21,-15,20,8,0x7e9167),
   patch('coppice-pocket',-29,-17,16,22,0x7b8d64)
  ],
  solids:[
   solid('bridge-west-rail',-3.62,55,.25,76,1.05,0x685540),
   solid('bridge-east-rail',3.62,55,.25,76,1.05,0x685540),
   solid('field-sluice',-18,-46,1.5,3,.85,0x787d73),
   solid('produce-load',17,-54,3.2,3.2,1.4,0x92734f),
   solid('settlement-register',8,-72,3,1.4,1.15,0x8c7252),
   solid('west-house',-17,-77,9,9,4.2,0xc2b495),
   solid('east-house',16,-77,8,8,4,0xc1b795),
   solid('field-store',-7,-79,8,7,3.6,0xb0a48b),
   solid('roadside-bench',-9,-65,3,.7,.95,0x8b7355),
   solid('overlook-stone',35,-23,2.8,2.5,1.8,0x8d9589),
   ...trees.map(([x,z],i)=>solid('woodland-trunk-'+i,x,z,.65,.65,2.7,0x66553f))
  ],
  points:[
   {id:'home-road',name:'Return to Hearthwater',x:0,z:104,kind:'return',text:'The home road is always open.',detail:'Return through the shared journey service. This extension does not replace your home or its existing Earth stories.'},
   {id:'vessa',name:'Vessa · bridge keeper',x:-7,z:97,kind:'person',text:'A bridge is only impressive if the next person can cross it.',detail:'Vessa is an original provisional local. The channel crossing and both woodland lanes lead to the fields; the coppice branch is optional.'},
   {id:'channel-view',name:'The channel crossing',x:0,z:55,kind:'view',text:'A continuous timber crossing joins both banks.',detail:'The bridge is real supported ground with two solid rails. No swimming or boat control is implied.'},
   {id:'shore-view',name:'Rainward-facing overlook',x:30,z:-20,kind:'view',text:'Beyond the worked fields, the water opens toward the coast.',detail:'Rainward belongs to Earth. This is a local coastal outlook, not a completed port or the whole Earth map.'},
   {id:'merren',name:'Merren · field steward',x:-6,z:-68,kind:'person',text:'Check the water, pack the named load, then register it. I would rather have one dependable evening than a heroic story about ruined cabbages.',detail:'Merren is an original provisional local. The field-water and produce commission is ordinary work; it does not advance the prophecy or replace Fenna’s existing delivery.'},
   {id:'field-water',name:'Field-water catch',x:-15,z:-46,kind:'objective',text:'Check the catch and record the working field-water gauge.',detail:'The catch belongs to these fields. This is a bounded work interaction, not a fluid simulation or a repair of Ansel’s existing mill.'},
   {id:'produce-packing',name:'The evening produce load',x:13,z:-54,kind:'objective',text:'Pack the declared roadside produce load.',detail:'Work applies only to this commission. Decorative vegetables do not become free inventory or an unlimited harvest.'},
   {id:'delivery-register',name:'Roadside delivery register',x:8,z:-69,kind:'objective',text:'Enter the named load and its field-water check in the local register.',detail:'This register records the local work. It does not invent online trading or replay Bellweather’s existing story reward.'}
  ],
  quest:{id:'earthlands-opening-v1',title:'Water, fields and the evening load',giverId:'merren',
   objectives:[{id:'first',pointId:'field-water',text:'Check the field-water catch',kind:'interact'},
    {id:'second',pointId:'produce-packing',text:'Pack the evening produce load',kind:'interact'},
    {id:'third',pointId:'delivery-register',text:'Register the named load',kind:'interact'}],
   reward:{xp:28,coins:12,ore:2},completionText:'The local field-water check, produce packing and delivery record are complete. Merren can account for this evening’s work; the older Hearthwater delivery keeps its own history.'},
  enemies:[{id:'earthlands-coppice-skitter',name:'Coppice skitter',kind:'skitter',x:-29,z:-20,hp:72,damage:9,xp:0,ore:0,coins:0}],
  palette:earthPalette,theme:'earth',water:true,
  routes:[
   {id:'west-road',points:[[0,104],[0,92],[0,16],[-10,15],[-10,-34],[-6,-41],[-6,-68]]},
   {id:'east-road',points:[[0,104],[0,92],[0,16],[14,15],[14,-34],[4,-41],[4,-67],[-6,-68]]},
   {id:'work-loop',points:[[-6,-68],[-6,-62],[-15,-46],[13,-46],[13,-54],[8,-69],[-6,-68]]},
   {id:'shore-walk',points:[[14,-19],[30,-19],[30,-20]]},
   {id:'optional-coppice',points:[[-10,-15],[-29,-15],[-29,-20]]}
  ]
 };
 const atlantis = {
  id:'atlantis',room:'world-atlantis',name:'Atlantis · Farwake and Bellglass',
  kicker:'A continuing maritime civilization · one bounded visitor route',
  description:'A dry arrival pier leads to Farwake’s sheltered civic court. Beside the public causeway, a marked optional submerged gallery contains a small Bellglass visitor air court and a separate landing.',
  sourceNotes:'Farwake, Bellglass, Nereme and Sahra come from the recovered Atlantis proposal. This local civic check and gallery blockout are original bounded foundations; the Harbour Beneath the Harbour campaign remains unresolved.',
  entry:{x:0,z:39,yaw:Math.PI},bounds:{minX:-25,maxX:26,minZ:-52,maxZ:48},
  patches:[
   patch('arrival-pier',0,33,10,24,0x9d8c6c),
   patch('farwake-landing',0,20,26,16,0xc5be9f),
   patch('civic-approach',-6,4,14,20,0xbcb799),
   patch('farwake-civic-court',0,-12,28,22,0xc7c0a1),
   patch('tide-quay',8,-17,10,4,0xb6b7a1),
   patch('public-dry-causeway',-3,-31,6,28,0xb3ad8d),
   patch('gallery-exit-quay',8,-43,24,10,0xbdb89c)
  ],
  solids:[
   solid('pier-west-rail',-4.5,34,.22,18,.8,0x847049),
   solid('pier-east-rail',4.5,34,.22,18,.8,0x847049),
   solid('pilot-school',-9,23,6,7,3.3,0xc0b493),
   solid('farwake-court-back-west',-9,-21.8,8,.5,4.1,0xb9bda9),
   solid('farwake-court-back-east',6,-21.8,14,.5,4.1,0xb9bda9),
   solid('farwake-court-west',-13.5,-12,.5,16,4,0xaeb5a7),
   solid('farwake-court-east',13.5,-12,.5,16,4,0xaeb5a7),
   solid('instrument-bench',-8,-12,3,1.4,1.1,0x8e7757),
   solid('tide-dial-base',9.5,-12,1.5,1.5,1.25,0x9ba995),
   solid('court-registry',0,-20.4,3.2,.8,1.2,0x9c8966),
   solid('court-west-bench',-8,-18,3,.7,.9,0x9c8966),
   solid('dry-causeway-west-rail',-5.6,-32,.2,25,.75,0x8b7c56),
   solid('exit-quay-bollard',18,-44,1,1,1,0x8e9d97)
  ],
  points:[
   {id:'home-pier',name:'Free home passage',x:0,z:39,kind:'return',text:'Nereme keeps a dry route home available.',detail:'Return is independent of the work commission and optional gallery. No allegiance, dive or breath purchase is required.'},
   {id:'nereme',name:'Nereme · pilot',x:-3,z:22,kind:'person',text:'Arriving or returning? Either way, learn where the landing is before admiring the towers.',detail:'The civic court and far quay have a continuous dry route. The marked gallery is a bounded visitor dive with explicit depth controls; the public visitor protection has no drowning timer.'},
   {id:'sahra',name:'Sahra · instrument-maker',x:-5,z:-10,kind:'person',text:'A dial is useful when someone can compare it with what the water actually does.',detail:'Sahra’s workshop remains distinct from Oren’s. This local inspection does not resolve Vaelor, Damar, the Custodian or the larger regional campaign.'},
   {id:'route-lamp',name:'Public route lamp',x:-7,z:-6,kind:'objective',text:'Check the lamp marking the dry court approach.',detail:'Confirm the ordinary visitor route. Decorative distant lights are not travel gates.'},
   {id:'tide-dial',name:'Civic tide dial',x:7,z:-12,kind:'objective',text:'Compare the civic dial with its posted calibration mark.',detail:'This is a local instrument check. It does not establish the later harbour fraud or require joining a school.'},
   {id:'court-register',name:'Visitor route register',x:0,z:-18,kind:'objective',text:'Post the completed local visitor-route inspection.',detail:'The named public check can be recorded without descending. It grants no ancestry, class or allegiance.'},
   {id:'tide-steps',name:'Tide Steps · optional gallery entry',x:8,z:-16,kind:'dive',text:'Inspect the bounded gallery route and enter deliberately.',detail:'The protected entry transfers to the gallery beside the quay. Ascend and descend remain explicit; hold depth is available. The dry public road stays open.'},
   {id:'gallery-landing',name:'Gallery landing · dry exit',x:12,z:-40.1,kind:'dive',text:'Leave the visitor gallery at the marked far quay.',detail:'The landing is reachable from the wet east lane. The transfer returns to supported dry ground on the far quay.'},
   {id:'quay-view',name:'The harbour beneath the harbour',x:3,z:-43,kind:'view',text:'The lower court has benches and maintained lamps, not a tomb.',detail:'Only this small gallery and visitor air court are authored. Oristhal’s distant skyline is scenery and does not claim full-city access.'}
  ],
  quest:{id:'atlantis-opening-v1',title:'A visitor’s route through Farwake',giverId:'nereme',
   objectives:[{id:'first',pointId:'route-lamp',text:'Check the public route lamp',kind:'interact'},
    {id:'second',pointId:'tide-dial',text:'Compare the civic tide dial',kind:'interact'},
    {id:'third',pointId:'court-register',text:'Post the visitor-route inspection',kind:'interact'}],
   reward:{xp:24,coins:10,ore:1},completionText:'The ordinary Farwake visitor route is checked and recorded. The public dry passage remains available; the regional harbour story has not been settled.'},
  palette:seaPalette,theme:'earth',water:true,
  dive:{surfaceY:.01,minY:-2.7,maxY:-.25,entryId:'tide-steps',exitId:'gallery-landing',
   entry:{x:8,z:-19.5,y:-.5,yaw:Math.PI},exit:{x:8,z:-43,yaw:0},
   volume:{x:8,z:-29,w:10,d:22},
   dryCourts:[{id:'bellglass-air',x:8,z:-34,w:7,d:7,minY:-2.7,maxY:.5,floorY:-2.7}],
   solids:[
    {id:'bellglass-west-wall',x:4.62,z:-34,w:.24,d:7,y:-2.7,h:3.2,color:0xa3b6ac},
    {id:'bellglass-east-wall',x:11.38,z:-34,w:.24,d:7,y:-2.7,h:3.2,color:0xa3b6ac},
    {id:'bellglass-back-wall',x:8,z:-37.38,w:7,d:.24,y:-2.7,h:3.2,color:0x97aaa3},
    {id:'bellglass-entry-west',x:5.48,z:-30.62,w:1.72,d:.24,y:-2.7,h:3.2,color:0xa3b6ac},
    {id:'bellglass-entry-east',x:10.52,z:-30.62,w:1.72,d:.24,y:-2.7,h:3.2,color:0xa3b6ac},
    {id:'bellglass-entry-lintel',x:8,z:-30.62,w:3.52,d:.25,y:.35,h:.15,color:0xb09a66},
    {id:'bellglass-ceiling',x:8,z:-34,w:7,d:7,y:.5,h:.12,color:0xb4c4b6},
    {id:'bellglass-bench',x:6.5,z:-36.5,w:2.2,d:.6,y:-2.7,h:.8,color:0x927e5c},
    {id:'bellglass-west-lamp',x:5.2,z:-35,w:.2,d:.2,y:-2.7,h:1.9,color:0xa28550},
    {id:'bellglass-east-lamp',x:10.5,z:-35,w:.2,d:.2,y:-2.7,h:1.9,color:0xa28550}
   ],
   routes:[{id:'visitor-gallery',points:[[8,-.5,-19.5],[8,-1.8,-26],[8,-2.7,-29.5],[8,-2.7,-32],[9,-2.7,-35],[8,-2.7,-32],[8,-1.8,-29],[12,-1.8,-29],[12,-1.4,-39.3]]}]
  },
  routes:[
   {id:'public-dry-road',points:[[0,39],[0,20],[-3,12],[-6,0],[-3,-15],[-3,-40],[8,-43],[12,-40.1]]},
   {id:'court-work',points:[[-3,22],[-6,0],[-7,-6],[7,-6],[7,-12],[0,-18]]},
   {id:'tide-steps',points:[[-3,-15],[8,-16]]}
  ]
 };
 function freeze(value) {
  if(value && typeof value === 'object' && !Object.isFrozen(value)) {
   Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
 }
 const realms = freeze([earth,atlantis]);
 // Every shape is original procedural scenery. Shared WorldArt draws supplied
 // supported ground, ordinary/dive solids, dry-court floors and the gallery bed.
 // In particular scenery never grants swimming merely by displaying a floor.
 function decorate(art,def,context={}) {
  if(!realms.includes(def)) throw new TypeError('Use a canonical Earth/Atlantis realm definition.');
  if(!art || typeof art.add!=='function' || typeof art.box!=='function') throw new TypeError('A WorldArt geometry writer is required.');
  const height = typeof context.height==='function' ? context.height : ()=>GROUND;
  const claimed = context.sim?.state?.journeys?.realms?.[def.id]?.firstClaimed===true;
  let count=0;
  const add=(kind,x,y,z,w,h,d,color,options={})=>{
   art.add(kind,x,y,z,w,h,d,color,{cameraSolid:false,cutaway:false,rough:.92,...options});count++;
  };
  const box=(x,y,z,w,h,d,color,options={})=>{
   art.box(x,y,z,w,h,d,color,{cameraSolid:false,cutaway:false,rough:.92,...options});count++;
  };
  const lamp=(x,z,base=height(x,z),scale=1)=>{
   // Only the four existing channel-approach lamps share the foreground
   // aperture with the rails. Reflections/shadows and physical ground stay
   // whole; other realm lamps retain their current presentation contract.
   const opt=def.id==='earthlands'&&Math.abs(x)===7&&[19,98].includes(z)?{cutaway:true,coastwardApproachLamp:true}:{};
   add('cylinder',x,base,z,.12*scale,2.3*scale,.12*scale,def.palette.trim,opt);
   box(x,base+2.35*scale,z,.32*scale,.42*scale,.32*scale,0xffda9a,{...opt,em:.65});
   add('cone',x,base+2.6*scale,z,.62*scale,.26*scale,.62*scale,def.palette.trim,opt);
  };
  const roof=(id,x,z,w,d,h,color)=>{
   add('roof',x,height(x,z)+h,z,w,h*.28,d,color,{cutaway:true,structureId:id});
   box(x,height(x,z)+h+.06,z,w,.12,d,def.palette.trim,{cutaway:true,structureId:id});
  };
  if(def.id==='earthlands') {
   const bridge=def.patches.find(p=>p.id==='channel-bridge'),joints=[];
   for(let z=18;z<=92;z+=1.5) {
    joints.push(z);box(0,height(0,z)+.018,z,6.7,.025,.045,0x68563f,{bridgeJoint:true});
   }
   // Existing renderer/material pair, with separated face planes and the exact
   // existing joint gaps. The skins never extend or replace supported ground.
   for(let i=0;i<=joints.length;i++) {
    const lo=i?joints[i-1]+.0225:bridge.z-bridge.d/2;
    const hi=i<joints.length?joints[i]-.0225:bridge.z+bridge.d/2;
    add('timber-panel',0,height(0,(lo+hi)/2)+.013,(lo+hi)/2,6.7,.014,hi-lo,0x9b7952,{bridgeSkin:true,rough:.87});
   }
   for(let z=20;z<=90;z+=7) for(const x of [-3.62,3.62]) {
    box(x,height(x,z)+.67,z,.23,1.34,.23,0x786147,{cutaway:true,coastwardBridgePost:true,solidId:x<0?'bridge-west-rail':'bridge-east-rail'});
   }
   for(let z=23;z<=87;z+=16) for(const x of [-2.9,2.9]) {
    // Piers stop below the actual bridge surface; they add no supported shelf.
    box(x,-1.25,z,.65,5.5,.65,0x777c71);
   }
   for(const [x,z] of [[-7,98],[7,98],[-7,19],[7,19],[-4,-62],[4,-62]]) lamp(x,z);
   // Replacement exterior geometry derives from the existing parent solids.
   // No duplicate roof, new interior, collision footprint or stock entitlement.
   count+=G.RealmCoastwardSettlementArt.decorate(art,def,{height});
   const paths=[[[1,-36],[1,-42],[-6,-47],[-6,-62],[-6,-68],[8,-69]],
    [[-6,-47],[-15,-46]],[[1,-42],[13,-46],[13,-54]]];
   for(const path of paths) for(let i=1;i<path.length;i++) {
    const [ax,az]=path[i-1],[bx,bz]=path[i],length=Math.hypot(bx-ax,bz-az),x=(ax+bx)/2,z=(az+bz)/2;
    // Narrow inset seams; ends stop short of junctions to avoid coincident faces.
    box(x,height(x,z)+.007,z,.12,.012,length-.2,0xaea184,{pathSeam:true,r:[0,Math.atan2(bx-ax,bz-az),0]});
   }
   count+=G.RealmCoastwardWoodlandArt.decorate(art,def,{height});
   // Field rows leave the authored work-loop and settlement road entirely clear.
   for(const side of [-1,1]) for(let row=0;row<4;row++) for(let n=0;n<9;n++) {
    const x=side*(20+row*1.6),z=-41-n*1.9;
    add('leaf',x,height(x,z)+.035,z,.28,.66,.28,row%2?0xb4b172:0x95aa69,{wind:1});
   }
   box(-18,height(-18,-46)+1.04,-46,.12,.42,1.5,0x977b54,{solidId:'field-sluice',r:[0,0,claimed?.3:0]});
   for(const x of [16.3,17,17.7]) add('round',x,height(x,-54)+1.55,-54,.58,.3,.5,claimed?0xc9b58b:0xcab975,{solidId:'produce-load'});
   for(let i=0;i<4;i++) box(6.9+i*.7,height(8,-72)+1.2,-72,.55,.08,.7,0xd1c4a0,{solidId:'settlement-register'});
   add('mountain-ridge',-64,-.4,-132,80,37,54,0x78918c,{skyImage:true,vista:'northwest'});
   add('mountain-ridge',67,-.4,-125,72,31,50,0x8e9e94,{skyImage:true,vista:'northeast'});
   add('mountain-ridge',103,-.4,54,70,34,110,0x78998f,{skyImage:true,vista:'channel-east'});
  } else {
   for(let z=23;z<=42;z+=1.25) box(0,height(0,z)+.018,z,8.7,.025,.04,0x766947);
   for(const [x,z] of [[-3,25],[3,25],[-10,-4],[10,-4],[-3,-25],[-3,-39],[15,-43]]) lamp(x,z);
   roof('pilot-school',-9,23,6,7,3.3,0x658e88);
   // Open-front civic canopy; the three actual walls are supplied solids.
   box(0,height(0,-12)+4.1,-12,27,.2,19.7,0x839b90,{cutaway:true,structureId:'farwake-civic-canopy'});
   for(const x of [-13.5,13.5]) {
    const id=x<0?'farwake-court-west':'farwake-court-east';
    box(x,height(x,-12)+3.94,-12,.56,.12,16.02,0xb7a46e,{solidId:id,supportCap:id});
   }
   for(let x=-11;x<=11;x+=2.75) box(x,height(x,-21.8)+4.27,-21.8,1.8,.2,.65,0xbaa26b,{cutaway:true});
   for(const z of [-8,-14,-19.6]) for(const x of [-13.5,13.5]) {
    const id=x<0?'farwake-court-west':'farwake-court-east';
    box(x,height(x,z)+2,z,.5,4,.55,0x94a99d,{solidId:id,supportColumn:id});
   }
   add('ring',9.5,height(9.5,-12)+1.8,-12,1.25,1.25,.22,0xd6bc7a,{solidId:'tide-dial-base',r:[0,Math.PI/2,0]});
   box(9.5,height(9.5,-12)+1.8,-12,.07,.9,.12,claimed?0x77c6bb:0xc7cda2,{solidId:'tide-dial-base',em:.2});
   for(let i=0;i<4;i++) box(-1.05+i*.7,height(0,-20.4)+1.23,-20.4,.5,.06,.55,0xd4c8aa,{solidId:'court-registry'});
   // Bronze doorway trim belongs to the physical split entrance. Its center
   // stays open, including at the player's full body height.
   for(const x of [6.28,9.72]) box(x,-1.1,-30.62,.08,3.08,.25,0xac9460,{diveSolidId:x<8?'bellglass-entry-west':'bellglass-entry-east'});
   box(8,.43,-30.62,3.52,.08,.25,0xb09a66,{cutaway:true});
   lamp(5.2,-35,-2.7,.7); lamp(10.5,-35,-2.7,.7);
   for(const z of [-21.5,-25.5,-29]) for(const x of [1.8,14.2]) {
    add('cone',x,-3,z,.45,1.6,.45,0x6c9f8d,{wind:2});
    add('round',x,-2.8,z,.7,.4,.65,0x91ab92);
   }
   // Original skyline stays beyond the supported/dive region and is not a gate.
   for(let i=0;i<7;i++) {
    const x=-38+i*12,z=-82-(i%2)*5;
    box(x,2+i%3,z,6,10+i%3*3,7,0x65908d,{skyImage:true});
    add('cone',x,7+i%3*2.5,z,7,3.5,8,0x789b92,{skyImage:true});
   }
  }
  return {realmId:def.id,instances:count};
 }
 const api={realms,decorate};G.RealmWorldAtlantisEarth=api;
 if(typeof module!=='undefined') module.exports=api;
})(globalThis);
