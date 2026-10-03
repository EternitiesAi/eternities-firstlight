/* Deliberate bridge framing only. Canonical ground owns eligibility; the caller
 * owns applying the fresh view, camera update and any ordinary preference save. */
(function(G){'use strict';
 const PRESETS=Object.freeze(['adventure','follow','tactical','wide']);
 const source=(name,file)=>G[name]||(typeof require==='function'?require('./'+file):null);
 const refuse=message=>({ok:false,error:message,message});
 const finite=Number.isFinite;
 function plan(input={}) {
  if(!input||typeof input!=='object'||Array.isArray(input))return refuse('Choose a supported bridge view.');
  const {scene,player,preset,diving=false,baseHalf}=input;
  if(!PRESETS.includes(preset))return refuse('Choose third person or a supported diorama view before framing the bridge.');
  if(!player||typeof player!=='object'||Array.isArray(player)||!finite(player.x)||!finite(player.z)||
   ['y','yaw'].some(k=>player[k]!==undefined&&!finite(player[k])))return refuse('A finite bridge position is required.');
  if(diving!==false)return refuse('Return to the dry bridge before framing the crossing.');
  if(baseHalf!==undefined&&(!finite(baseHalf)||baseHalf<=0))return refuse('A positive finite diorama base width is required.');
  if(preset!=='adventure'&&(!finite(baseHalf)||baseHalf<=0||!finite(9/baseHalf)||9/baseHalf<=0))
   return refuse('A positive finite diorama base width is required.');
  let bridge,walkable,message;
  try {
   const earth=source('RealmEarth','earth.js');
   if(earth&&scene===earth.ROOM) {
    const b=earth.BRIDGE;
    bridge=b&&{id:b.id,x:b.x,z:b.z,w:b.walkWidth,d:b.d};
    walkable=(x,z)=>earth.walkable(x,z);
    message='Step onto the Hearthwater bridge to frame the crossing.';
   } else if(scene==='world-earthlands') {
    const worlds=source('RealmWorldFoundations','world-foundations.js'),def=worlds?.definition(scene);
    const found=def?.id==='earthlands'&&def.room===scene&&Array.isArray(def.patches)?def.patches.filter(p=>p.id==='channel-bridge'):[];
    bridge=found.length===1?found[0]:null;
    walkable=(x,z)=>worlds.walkable(scene,x,z);
    message='Step onto the Coastward channel bridge to frame the crossing.';
   } else return refuse('This side view is available on the Hearthwater or Coastward bridge.');
   if(!bridge||typeof bridge.id!=='string'||!['x','z','w','d'].every(k=>finite(bridge[k]))||bridge.w<=0||bridge.d<=0)
    return refuse('The supported bridge definition is unavailable.');
   // Centre membership identifies this crossing, while canonical walkability
   // checks the complete supported foot envelope and actual solid/rail boxes.
   // Bank joins remain valid rather than inventing a shrunken longitudinal deck.
   if(Math.abs(player.x-bridge.x)>bridge.w/2||Math.abs(player.z-bridge.z)>bridge.d/2||!walkable(player.x,player.z))return refuse(message);
  } catch(_error) {return refuse('The supported bridge definition is unavailable.');}
  const view={yaw:Math.PI*1.5,elevation:preset==='adventure'?.14:.39,tour:false,overview:false};
  if(preset==='adventure'){view.distance=14.5;view.actualDistance=14.5;}
  else{view.half=9;view.zoom=9/baseHalf;}
  return{ok:true,scene,bridgeId:bridge.id,view,message:'Bridge side view · drag to orbit, V swaps styles, R resets.'};
 }
 const api=Object.freeze({plan});G.RealmBridgeMomentView=api;
 if(typeof module!=='undefined')module.exports=api;
})(globalThis);
