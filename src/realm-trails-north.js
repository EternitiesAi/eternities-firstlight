/* Original, bounded adaptations of the 2026-09-14 Heaven/Hell designs.
 * These provisional names are game-fiction proposals, not founder-ratified
 * manuscript identities. Shared trail rules own acceptance, proximity,
 * combat windows, escort movement, persistence and every explicit claim.
 * Loading this catalogue never starts a task, grants property or changes a
 * survey. The existing upper terraces and inner foundry remain closed. */
(function(G){'use strict';
const FLOOR=1.57;
const step=(id,name,kind,x,z,requires,optional,text)=>({id,name,kind,x,z,y:FLOOR,medium:'dry',requires,optional,text});
const definitions=[{
 id:'heaven-broken-choir-v1',realm:'heaven',title:'The Broken Choir · a garden answer',
 summary:'Rielle: “The public instrument still misses its last stroke. Three grounded relays will isolate the foreign bearing. Disable the service core, then fit the Garden return arm.” Accept this bounded repair explicitly. Its once-only fee is 30 XP, 12 coins and 2 ore, claimed from Rielle after the physical repair. Any first trail claim opens the separate, once-per-character workshop fitting: 3 ore and 8 coins for +3 attack on your selected owned blade or bow. Regional names and this compressed maintenance encounter remain provisional.',
 danger:'The core wakes only after this accepted task’s three relays are set. It is a malfunctioning maintenance construct, not a civilian. Its pulse has a visible windup and locked direction; move or Brace, then strike the exposed bearing during its real recovery. Attacks outside recovery do not damage the bearing. The optional spillway extends each recovery opening by 0.8 seconds. Sound is optional; shape and text carry the cues. The road home remains free before, during and after the encounter.',
 giver:{id:'heaven-rielle',name:'Rielle · bellwright',x:-14,z:5},
 reward:{xp:30,coins:12,ore:2},
 completionText:'Rielle: “A full return stroke. Someone with tired hands can use it now.” The Garden instrument answers with a complete visible stroke and a modest restored fitting. The service core stays disabled for this story. Claim the declared 30 XP, 12 coins and 2 ore explicitly from Rielle; the separate finite workshop fitting is now available if this is your first trail claim. The summit, maker’s larger history and full Crownkeeper expedition remain ahead.',
 steps:[
  step('spillway','Set Yselle’s service spillway','interact',25,-15,[],true,
   'Optional preparation. Yselle: “Send the return pressure into the side basin; the bearing will take longer to rise.” Operate the marked service handle east of the Garden. This costs no material and extends the core’s actual recovery opening by 0.8 seconds. You can omit it and still finish; continue north to the three relay handles.'),
  step('relay-west','Set the west relay','interact',-8,-88,[],false,
   'Operate the west handle on the broad grounded apron beyond the Mirror Causeway. Its single notch marks the first isolated support. Set the east and crown relays in either order; all three are required before the service core wakes. The west Arcade service walk remains another way back to the Garden.'),
  step('relay-east','Set the east relay','interact',8,-88,[],false,
   'Operate the east handle opposite the west relay. Its two notches identify it without pitch or color alone. Set the west and crown relays if either is still unset. The bearing is isolated only when all three supports have been recorded for this accepted repair.'),
  step('relay-crown','Set the crown relay','interact',0,-102,[],false,
   'Operate the three-notch handle on the grounded northern apron, south of the closed terrace. Complete any remaining west/east relay. When the third handle is set, the service core at (0, -95) becomes the declared encounter; the summit road stays closed and the route south stays open.'),
  step('disable-core','Disable the imposed bearing','defeat',0,-95,['relay-west','relay-east','relay-crown'],false,
   'Target the Crownkeeper service core through ordinary combat controls. Its stability falls only during its recovery after a real pulse. Move or Brace through the telegraphed attack, then use your owned blade or bow on the exposed bearing. The optional spillway adds 0.8 seconds to that window. At zero stability the construct folds; return south to the Garden return arm.'),
  step('garden-repair','Fit the Garden return arm','interact',0,-1,['disable-core'],false,
   'At the Garden response plate, physically fit the released return arm. Rielle: “Leave the hinge where the next pair of hands can reach it.” The repair stops at this useful local instrument; it opens no summit terrain. Return to Rielle at the nearby west bench and choose the explicit claim for the stated fee.')
 ],
 enemy:{id:'heaven-choir-core-v1',name:'Crownkeeper service core',kind:'sentinel',x:0,z:-95,hp:90,damage:9,
  spawnAfter:['relay-west','relay-east','relay-crown'],defeatStep:'disable-core',openingBonusStep:'spillway'}
},{
 id:'hell-open-cage-v1',realm:'hell',title:'The Open Cage · a return that holds',
 summary:'Istra: “Neris can leave the open cell. The claim-marked route is what she does not trust. Hear her account, cool the service branch and set both return clamps. Then disable the route Reeve and walk with her to this Refuge.” Accept this bounded rescue explicitly. Its once-only fee is 35 XP, 14 coins and 3 ore, claimed from Istra only after Neris reaches safety. Any first trail claim opens the separate, once-per-character workshop fitting: 3 ore and 8 coins for +3 attack on your selected owned blade or bow. Names and the compressed route adaptation remain provisional.',
 danger:'A separate route Reeve activates near the west return leg only after contact, cooling and both clamps. It is not the optional eastern salvage sentinel, and disabling it grants no enemy loot. Its windup, direction and recovery use ordinary combat cues. No fight seals the player’s free road home. Neris waits when you are more than 10 route units away; walk back to her to continue. After safety is established, an explicitly labelled assisted extraction is a fallback if escort routing fails; it must bring Neris into the Refuge and never pretend she walked a route she did not.',
 giver:{id:'hell-istra',name:'Istra · return keeper',x:-10,z:24},
 reward:{xp:35,coins:14,ore:3},
 completionText:'Neris: “Keep the measurements as they are, including the ones I once helped conceal.” Istra records her safe arrival at the Kiln Refuge. Safety is not a verdict on her earlier complicity. Claim the declared 35 XP, 14 coins and 3 ore explicitly from Istra; the separate finite workshop fitting is now available if this is your first trail claim. The witness remains safe for this completed story. Veyr, the Writ Engine and any allegiance or restitution choice remain unresolved.',
 steps:[
  step('contact-neris','Hear Neris at the open cell','interact',-36,-102,[],false,
   'Reach Neris on the west Bell Yard apron, outside the closed foundry wall. Neris: “The door is open. The route still records me as theirs. Check it before asking me to run.” Her preserved measurements identify a cooling handle and two return clamps. Leave her here while you establish safety; first operate cooling at (-34, -70).'),
  step('cooling','Cool the return service branch','interact',-34,-70,['contact-neris'],false,
   'Operate the marked cooling handle beside Moth Cut’s dry service route. Tovan’s measurement sets a finite safe pressure state; this is required route preparation, not an optional steam effect or a new water-diversion choice. Continue to the west clamp at (-30, -86) and east clamp at (14, -100), in either order.'),
  step('clamp-west','Set the west return clamp','interact',-30,-86,['contact-neris','cooling'],false,
   'Seat the west clamp’s paired pins at the service approach to Bell Yard. One set clamp is insufficient: inspect the east clamp as well. When both are set after cooling, the route Reeve at (-35, -90) activates visibly. Keep the open western road behind you; no door closes.'),
  step('clamp-east','Set the east return clamp','interact',14,-100,['contact-neris','cooling'],false,
   'Seat the east clamp on the Bell Yard’s grounded loading apron. Return across the open yard to the west clamp if it remains unset. Both verified clamps and cooling make the rescue route usable; the Reeve at (-35, -90) must then be disabled before Neris is asked to follow.'),
  step('disable-reeve','Disable the route Reeve','defeat',-35,-90,['contact-neris','cooling','clamp-west','clamp-east'],false,
   'Target the newly activated route Reeve with ordinary blade or bow combat. Read its windup, move or Brace, and attack during its recovery. This local machine grants no separate XP, coins, ore or drop. The eastern salvage sentinel is unrelated. After the Reeve folds, return to Neris at (-36, -102) and explicitly ask her to follow.'),
  step('escort-start','Invite Neris onto the verified route','interact',-36,-102,['contact-neris','cooling','clamp-west','clamp-east','disable-reeve'],false,
   'Neris: “Two clamps, cooling, and the inspector quiet. I can try that road with you.” Ask her to follow only after all declared safety work is complete. Walk south along Moth Cut, around the culvert and down the western service road, then enter the Refuge by its open south side. She moves at 2.5 route units per second and waits beyond 10; stay close or walk back. The explicit assisted-extraction fallback is available after this safety checkpoint if the route fails.'),
  step('refuge-arrival','Bring Neris into Kiln Refuge','escort',-12,27,['escort-start'],false,
   'Automatic only when Neris herself reaches the marked safe arrival beside Istra inside the Refuge. Your arrival alone cannot complete the rescue. If she has waited, return along the service path to her; if routing has failed, use the explicitly labelled assisted extraction and verify her actual Refuge arrival. Then speak to Istra and choose the explicit claim. Your own road home remains free even while this work is unfinished.')
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
