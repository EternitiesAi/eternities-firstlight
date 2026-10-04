/* Explicit close-foe framing. No combat, follow target, or save authority. */
(function(G){'use strict';
function plan(i={}){
 const no=error=>({ok:false,error}),p=i?.player,e=i?.enemy;
 if(i?.preset!=='adventure')return no('Frame foe is available in third person. Diorama keeps its own framing.');
 if(!p||!e||typeof e.id!=='string'||!e.id||e.hidden||!Number.isFinite(e.hp)||e.hp<=0||![p.x,p.z,e.x,e.z,i.distance].every(Number.isFinite)||i.distance<3.5||i.distance>20)return no('Select a living visible nearby foe before framing.');
 const range=Math.hypot(p.x-e.x,p.z-e.z);if(range<.05||range>12)return no('Frame foe needs a selected target between 0.05 and 12 metres away.');
 const distance=Math.max(range<1.5?14:8.5,i.distance);
 return{ok:true,view:{yaw:Math.atan2(p.x-e.x,p.z-e.z),elevation:.55,distance,actualDistance:distance,tour:false,overview:false}};
}
const api=Object.freeze({plan});G.RealmCombatView=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
