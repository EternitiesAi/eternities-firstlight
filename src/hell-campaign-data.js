/* The Last Unclaimed Road: a finite exterior continuation of The Open Cage.
 * Attributed direction: the 2026-09-14 Hell design package, Story and Event
 * Atlas Q08 and Prototype Spec beats E-G. Those documents label the cast and
 * regional story as original proposals, not recovered manuscript canon.
 * These coordinates, fixed values and service-engine adaptation are original
 * implementation terms. Loading this catalogue grants no history or property.
 * Root's campaign/combat owners validate actions, damage, persistence and claim.
 */
(function (G) {
'use strict';
function freeze(value) {
 if (value && typeof value === 'object') {
  Object.values(value).forEach(freeze);
  Object.freeze(value);
 }
 return value;
}
const step=(id,name,kind,x,z,requires,optional,text)=>({id,name,x,z,medium:'dry',kind,requires,optional,text});
const patterns=freeze({
 sweep:{reach:5.5,length:3.8,halfWidth:2,windup:1.35,recovery:2.2,support:'west-shunt'},
 line:{reach:7,length:6,halfWidth:.65,windup:1.35,recovery:2.2,support:'east-brace'}
});
const definition=freeze({
 id:'hell-last-unclaimed-road-v1',
 title:'The Last Unclaimed Road',
 room:'world-hell',realm:'hell',prerequisite:'hell-open-cage-v1',
 giver:{id:'hell-istra',name:'Istra · return keeper',x:-10,z:24},
 reward:{xp:45,coins:20,ore:4,materials:{wood:3,fiber:2}},
 summary:'Neris is already safe. Her preserved measurements identify a compulsory claim still attached to the Bell Yard service fixture. Hear her full record, compare Tovan’s account with the grounded writ, then deliberately challenge Tithe-Warden Veyr. Stabilize the exterior engine and choose who may use this local release. Accept this separate finite campaign explicitly. Its once-only fee is 45 XP, 20 sunmarks, 4 ore, 3 timber and 2 fibre, claimed from Istra after verification. The cast labels, exterior engine and exact outcomes remain provisional authored adaptations.',
 danger:'Veyr has 120 health and deals 12 damage through two distinct locked attacks: a broad short sweep and a narrow longer writ-line. Each has a 1.35-second warning and 2.2-second recovery. Step beside the marked shape, use actual cover or Brace (3), then respond with your owned blade or bow. The optional west shunt adds 0.6 seconds to sweep recovery; the optional east brace adds 0.6 seconds to line recovery. Below half health the order varies without raising damage or speed. Sound is optional; shape and text carry the warning. Your free road home remains available before, during and after the fight. Neris’s earlier safety is retained, and the inner foundry remains closed.',
 completionText:'Istra keeps the verified local disposition beside Neris’s complete measurements. Veyr’s authority over this exterior fixture is resolved; this records a victory, not a claim that he was killed. The selected release fitting and Bell Yard plate retain their outcome. Istra has paid the fixed 20 sunmarks, 4 ore, 3 timber and 2 fibre once; XP credits up to 45 within the existing stored cap. These existing materials are a contribution to a chosen project, not a promised upgrade for every veteran. No equipment was fitted or equipped. The inner foundry, wider infernal country and future patron or restitution services remain ahead.',
 steps:[
  step('witness-record','Hear Neris’s complete route record','interact',-12,27,[],false,
   'Speak to Neris at her saved Kiln Refuge arrival. Neris: “Keep the measurements as they are, including the ones I once helped conceal.” Her safe return remains true whether it was walked or explicitly assisted. This account does not pronounce her innocent or ask her to repeat the rescue. Take the full record to Tovan.'),
  step('tovan-account','Compare Tovan’s maintenance account','interact',-15,16,['witness-record'],false,
   'Tovan identifies the Bell Yard service plate and acknowledges his earlier work on its compulsory claim. Compare his account with Neris’s measurements before operating the fixture. Tovan: “Knowing the rivets is useful. Leaving my own name out would make it a worse record.” The original Refuge water job retains its separate state.'),
  step('read-service-writ','Read the Bell Yard service writ','interact',-12,-95,['tovan-account'],false,
   'At the existing grounded Bell Yard plate, compare the named crew’s measured route with its imposed departure claim. The contradiction concerns this exterior service fixture; the inner foundry doors remain closed. Two optional preparations are nearby: the west shunt lengthens sweep recovery, and the east brace lengthens writ-line recovery. Neither is required. Read the warning before deliberately challenging Veyr.'),
  step('west-shunt','Set the west recovery shunt','interact',-18,-90,['read-service-writ'],true,
   'Set the supplied shunt beside the west Bell Yard approach. It adds exactly 0.6 seconds to Veyr’s recovery after a sweep. It changes neither his health nor damage, and it does not extend the writ-line recovery. No ordinary material is consumed. This preparation belongs to the accepted campaign and does not repeat the old rescue cooling or clamps.'),
  step('east-brace','Seat the east writ-line brace','interact',17,-90,['read-service-writ'],true,
   'Seat the supplied brace beside the east Bell Yard approach. It adds exactly 0.6 seconds to Veyr’s recovery after a writ-line. It changes neither his health nor damage, and it does not extend sweep recovery. No ordinary material is consumed. The eastern salvage sentinel keeps its own identity and is unrelated to this preparation.'),
  step('challenge-veyr','Challenge Veyr on the open apron','interact',0,-91,['read-service-writ'],false,
   'Veyr: “An escape is a restraint I have not finished.” Explicitly begin the warned encounter on the supported Bell Yard exterior. You may inspect the site, prepare either support or retreat before choosing this action. Read the broad sweep and narrow writ-line as distinct locked shapes. The road south remains open; no combat door closes behind you.'),
  step('warden-resolved','Resolve the Warden’s local authority','defeat',0,-99,['challenge-veyr'],false,
   'Defeat the actual Tithe-Warden Veyr encounter through ordinary confirmed weapon impacts. A journal action cannot substitute for combat. His fixed health and damage do not scale with your equipment; below half health only the pattern order varies. The recorded fact is warden_resolved, not killed. This enemy grants no independent loot or payment. Stabilize the separate exterior service engine after the victory.'),
  step('stabilize-service-engine','Stabilize the exterior service engine','interact',0,-105,['warden-resolved'],false,
   'Fit the supplied stabilizer at the service fixture on the open side of the closed works. This is an exterior adaptation of the Writ Engine story, not entry into the sealed full foundry. The local release can now hold a chosen configuration. Your actual home passage was already free and remains independent of the disposition. No ordinary timber, fibre, ore or equipment is spent here.'),
  step('disposition','Choose the local passage disposition','choice',0,-105,['stabilize-service-engine'],false,
   'Deliberately choose Unbind, Divert or License after stabilization. Read the exact local consequence before confirming. Each retains Neris’s safety and truthful measurements, pays the same stated campaign fee and records a lasting local deed. This choice does not assign a class or change Grace, Cinder, renunciation or global allegiance. Future patron and restitution services remain pending.'),
  step('verify-route','Verify the selected release at the plate','interact',-12,-95,['disposition'],false,
   'Return to the Bell Yard plate and verify that its fitting matches the retained disposition: an open release handle for Unbind, a hooded service marker for Divert, or paired named-crew seals for License. This records the actual chosen local configuration; it does not certify the whole claim network. Return to Istra and explicitly claim the separate fixed fee. Completed verification can remain safely unpaid.')
 ],
 choices:[
  {id:'unbind',name:'Unbind · open this local release',
   text:'Remove this exterior fixture’s compulsory departure claim and fit an open release handle. The Refuge supports passage through this local release without a named patron docket. Neris’s full record remains. This is a bounded local unbinding; it does not dissolve Hell’s other claims or complete the larger saga.',
   consequence:'The exterior engine and Bell Yard plate show the open release handle. Istra, Tovan and Neris recognize the local unbinding. The campaign records Unbind permanently; the stated fee remains unchanged. Any later patron advantage or restitution route needs its own implemented contract.'},
  {id:'divert',name:'Divert · shelter a limited service release',
   text:'Isolate a limited Refuge service release and fit a hooded marker. The named crew can use this service arrangement while the outer compulsory writ remains in place. Neris stays safe; her preserved record is neither shortened nor sold. This secures a local concession while retaining responsibility for what was left intact.',
   consequence:'The exterior engine and Bell Yard plate show the hooded service marker and retained outer writ. Istra, Tovan and Neris recognize the limited arrangement. The campaign records Divert permanently; the stated fee remains unchanged. No hidden route, new corridor or salvage economy is granted by this choice.'},
  {id:'license',name:'License · transfer the named-crew docket',
   text:'Transfer this exterior fixture’s route docket to a rival office under a disclosed named-crew concession. Fit paired crew seals; other compulsory claims remain. Neris stays safe and her truthful record remains available. This knowingly preserves a coercive local institution for a limited concession; it is not an automatic global oath.',
   consequence:'The exterior engine and Bell Yard plate show paired named-crew seals and the retained licensing writ. Istra, Tovan and Neris recognize the concession and its recorded responsibility. The campaign records License permanently; the stated fee remains unchanged. Future patron services or renunciation and restitution branches are pending.'}
 ],
 enemy:{id:'hell-tithe-warden-v1',name:'Tithe-Warden Veyr',kind:'sentinel',x:0,z:-99,hp:120,damage:12,radius:.65,spawnAfter:['challenge-veyr'],defeatStep:'warden-resolved'}
});
const api=freeze({definition,patterns});
G.RealmHellCampaignData=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
