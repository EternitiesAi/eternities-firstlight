/* The two north doors: the Broken Choir into Heaven and the Open Cage into Hell. Each is the way in to its campaign,
 * and the saga decides when it opens (gate). Shared trail rules in realm-trails.js own acceptance, proximity,
 * combat windows, escort movement, persistence and every explicit claim. Loading this file starts nothing. */
(function(G){'use strict';
const FLOOR=1.57;
const step=(id,name,kind,x,z,requires,optional,text)=>({id,name,kind,x,z,y:FLOOR,medium:'dry',requires,optional,text});
const definitions=[{
 id:'heaven-broken-choir-v1',realm:'heaven',title:'The Broken Choir · a garden answer',
 gate:'heaven',gateText:'The garden gate stays shut until the foundry is finished.',
 summary:'Rielle: “The public instrument still misses its last stroke. Three grounded relays will isolate the foreign bearing. Set them, break the service core, then fit the garden return arm.” Accept the repair. Rielle gives you 30 XP, 12 sunmarks and 2 ore once the work is done. Your first finished trail also opens a workshop fitting: 3 ore and 8 sunmarks for +3 attack on your blade or bow.',
 danger:'The core wakes only after the three relays are set. It is a malfunctioning maintenance construct, not a civilian. Its pulse has a visible windup and a locked direction. Move or Brace, then strike the exposed bearing during its recovery. Strikes outside the recovery do nothing to it. The optional spillway adds 0.8 seconds to each recovery. Sound is optional; shape and text carry the cues. The road home stays free before, during and after.',
 giver:{id:'heaven-rielle',name:'Rielle · bellwright',x:-14,z:5},
 reward:{xp:30,coins:12,ore:2},
 completionText:'Rielle: “A full return stroke. Someone with tired hands can use it now.” The garden instrument answers with a complete stroke and a restored fitting. The service core stays disabled. Rielle gives you 30 XP, 12 sunmarks and 2 ore. If this was your first finished trail, the workshop fitting is yours too. The summit and the maker’s older history are still to come.',
 steps:[
  step('spillway','Set Yselle’s service spillway','interact',25,-15,[],true,
   'Optional. Yselle: “Send the return pressure into the side basin. The bearing will take longer to rise.” Operate the marked handle east of the garden. It costs nothing and adds 0.8 seconds to the core’s recovery. You can skip it and still finish. Continue north to the three relay handles.'),
  step('relay-west','Set the west relay','interact',-8,-88,[],false,
   'Operate the west handle on the broad apron beyond the Mirror Causeway. Its single notch marks the first support. Set the east and crown relays in either order. All three must be set before the service core wakes. The west Arcade walk is another way back to the garden.'),
  step('relay-east','Set the east relay','interact',8,-88,[],false,
   'Operate the east handle opposite the west relay. Its two notches mark it. Set the west and crown relays if either is still unset. The bearing is isolated only when all three supports are recorded.'),
  step('relay-crown','Set the crown relay','interact',0,-102,[],false,
   'Operate the three-notch handle on the northern apron, south of the closed terrace. Finish any relay you missed. When the third is set, the service core on the apron wakes. The summit road stays closed and the route south stays open.'),
  step('disable-core','Break the imposed bearing','defeat',0,-95,['relay-west','relay-east','relay-crown'],false,
   'Target the Crownkeeper service core with ordinary combat. Its stability falls only during its recovery after a real pulse. Move or Brace through the telegraphed attack, then strike the exposed bearing with your blade or bow. The spillway adds 0.8 seconds to that window. At zero stability it folds. Walk south to the garden return arm.'),
  step('garden-repair','Fit the garden return arm','interact',0,-1,['disable-core'],false,
   'At the garden response plate, fit the released return arm. Rielle: “Leave the hinge where the next pair of hands can reach it.” The repair stops at this instrument; it opens no summit ground. Return to Rielle at the west bench to finish the work.')
 ],
 enemy:{id:'heaven-choir-core-v1',name:'Crownkeeper service core',kind:'sentinel',x:0,z:-95,hp:90,damage:9,
  spawnAfter:['relay-west','relay-east','relay-crown'],defeatStep:'disable-core',openingBonusStep:'spillway'}
},{
 id:'hell-open-cage-v1',realm:'hell',title:'The Open Cage · a return that holds',
 gate:'hell',gateText:'The way down stays shut until the night at Bellweather is behind you.',
 summary:'Istra: “Neris can leave the open cell. The route is what she does not trust. Hear her account, cool the service branch and set both return clamps. Then break the route Reeve and walk her home to this Refuge.” Accept the rescue. Istra gives you 35 XP, 14 sunmarks and 3 ore once Neris reaches safety. Her measurements name the foundry, and that is where the road goes next. Your first finished trail also opens a workshop fitting: 3 ore and 8 sunmarks for +3 attack on your blade or bow.',
 danger:'A route Reeve wakes near the west return leg once contact, cooling and both clamps are done. It is not the salvage sentinel in the east pocket, and it drops nothing. Read its windup and direction, then move or Brace and strike during its recovery. No fight seals your road home, and it stays free. Neris waits when you are more than 10 route units away; walk back to her to go on. If the route fails, an assisted extraction is open to you once she is safe. It brings her in by the door, and the record says so. It must never pretend she walked a route she did not.',
 giver:{id:'hell-istra',name:'Istra · return keeper',x:-10,z:24},
 reward:{xp:35,coins:14,ore:3},
 completionText:'Neris: “Keep the measurements as they are, including the ones I once helped conceal.” Istra records her safe arrival at the Kiln Refuge. Safety is not a verdict on her earlier complicity. Istra gives you 35 XP, 14 sunmarks and 3 ore. If this was your first finished trail, the workshop fitting is yours too. Neris’s measurements name the foundry, and the pattern that took Briar was cut there. Any allegiance or restitution choice is still to come.',
 steps:[
  step('contact-neris','Hear Neris at the open cell','interact',-36,-102,[],false,
   'Neris: “The door is open. The route still records me as theirs. Check it before you ask me to run.” Her measurements name a cooling handle and two return clamps. Start with the cooling handle. She will wait here.'),
  step('cooling','Cool the return service branch','interact',-34,-70,['contact-neris'],false,
   'Operate the marked cooling handle beside Moth Cut’s dry service route. Tovan’s measurement sets a safe pressure, and this is required preparation, not an optional steam effect. Then set the west clamp and the east clamp, in either order.'),
  step('clamp-west','Set the west return clamp','interact',-30,-86,['contact-neris','cooling'],false,
   'Seat the west clamp’s paired pins at the approach to Bell Yard. One clamp is not enough, so check the east clamp as well. When both are set after the cooling, the route Reeve wakes. The open western road stays behind you. No door closes.'),
  step('clamp-east','Set the east return clamp','interact',14,-100,['contact-neris','cooling'],false,
   'Seat the east clamp on the Bell Yard’s loading apron. If the west clamp is still unset, go back across the open yard to it. With both clamps and the cooling done, the Reeve must be broken before Neris is asked to follow.'),
  step('disable-reeve','Break the route Reeve','defeat',-35,-90,['contact-neris','cooling','clamp-west','clamp-east'],false,
   'Strike the newly awake route Reeve with your blade or bow. Read its windup, move or Brace, and strike during its recovery. It drops nothing. After it folds, go back to Neris and ask her to follow.'),
  step('escort-start','Invite Neris onto the verified route','interact',-36,-102,['contact-neris','cooling','clamp-west','clamp-east','disable-reeve'],false,
   'Neris: “Two clamps, cooling, and the inspector quiet. I can try that road with you.” Ask her to follow only when the safety work is done. Walk south along Moth Cut, around the culvert and down the western service road, then enter the Refuge by its open south side. She moves at 2.5 route units per second and waits beyond 10. Stay close, or walk back for her. The explicit assisted-extraction fallback is open after this checkpoint if the route fails.'),
  step('refuge-arrival','Bring Neris into Kiln Refuge','escort',-12,27,['escort-start'],false,
   'Only Neris’s own arrival beside Istra inside the Refuge completes this. Your arrival alone does not count. If she has waited, go back along the service path to her. If the route has failed, the assisted extraction is open, and the record will say she did not walk it. Then speak to Istra to finish the rescue. Your own road home stays free all the while.')
 ],
 enemy:{id:'hell-return-reeve-v1',name:'Route Reeve',kind:'sentinel',x:-35,z:-90,hp:90,damage:9,
  spawnAfter:['contact-neris','cooling','clamp-west','clamp-east'],defeatStep:'disable-reeve'},
 escort:{startStep:'escort-start',arrivalStep:'refuge-arrival',route:[
  {x:-36,z:-102},{x:-31,z:-83},{x:-31,z:-58},{x:-31,z:-15},{x:-29,z:32},{x:-12,z:27}
 ],name:'Neris',waitDistance:10,speed:2.5}
}];
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const api=freeze({definitions});
G.RealmTrailsNorth=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
