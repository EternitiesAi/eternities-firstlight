/* The gate that remained open: the lower Garden's campaign after the Broken Choir. Heaven arrives in peace; the
 * envoy's reading comes first, and then a counterfeit relay turns the rescue corridors hostile. Step and choice ids
 * are saved, so they stay put even where the words change. Rules, the courier and the fights live in heaven-campaign.js. */
(function(G){'use strict';
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const step=(id,name,kind,x,z,requires,optional,text)=>({id,name,x,z,medium:'dry',kind,requires,optional,text});
const definition=freeze({
 id:'heaven-gate-remained-open-v1',title:'The Gate That Remained Open',
 room:'world-heaven',realm:'heaven',prerequisite:'heaven-broken-choir-v1',
 giver:{id:'heaven-rielle',name:'Rielle · bellwright',x:-14,z:5},
 reward:{xp:40,coins:16,ore:3,materials:{wood:4,fiber:3}},
 envoy:{name:'The envoy',x:-8,z:22,reading:'heaven'},
 summary:'The Broken Choir is mended, and its garden answer is true. Come up in peace: the bells are ringing and the beds are planted. The envoy keeps a house in this garden, and the envoy has a reading for you. Hear it first. Then a false rescue signal, borrowed from a relay, sends travellers up a road that is closed. Break the apparatus that guards it and the relay seraph behind it, then walk the bell courier home. Rielle closes the work when it is done.',
 danger:'The Glasswing approach construct has 110 health and a locked directed beam: 9 units of reach, a 0.65 half-width, a 1.2-second warning and a 1.7-second recovery. The supplied warning mirror adds 0.4 seconds to that warning only. The relay seraph has a radial pulse with a 5.5-unit reach, a 3.4-unit radius, a 1.4-second warning and a 2-second recovery, and it hits harder than anything else in the garden. Real opaque cover blocks the beam. Both can be hurt during every live phase. Use your blade or bow, move, Brace or retreat. Shape and text carry every warning with sound off. The road home stays open. The courier is a traveller to welcome, not an enemy. No class, technique or companion is required. The upper terrace stays closed.',
 completionText:'Calen keeps the corrected route beside the courier’s full account. The bell courier walked the marked road and reached the garden. The envoy’s reading is kept, and the counterfeit relay is silent. Rielle gives you 16 sunmarks, 3 ore, 4 timber and 3 fibre, and XP up to 40 within the stored cap. Those materials go toward a project you choose. No gear was fitted or granted. The Far Gates, the upper city and the Heaven trial stay separate.',
 steps:[
  step('witness-account','Hear the bell courier’s account','interact',-29,-69,[],false,
   'The bell courier followed a rescue signal that promised an open road up. It stopped when the directions contradicted the closed gate. Keep the whole account. Arriving is not an invasion, and tired hands are not a failure. Compare the makers’ marks on the ground. Nobody needs an oath or a perfect pitch to be believed.'),
  step('compare-arrival-marks','Compare the Arcade arrival marks','interact',-35,-31,['witness-account'],false,
   'The Ruby Arcade response plate has a true repair notch. The courier’s record has a repeated false mark beside it. Calen can explain what he saw, and the marks can be checked without a guide. Write down the difference. The old survey and the Broken Choir stay as they were.'),
  step('inspect-false-relay','Read the borrowed rescue signal','interact',0,-79,['compare-arrival-marks'],false,
   'At the Mirror Causeway plate, the promised rescue direction meets the closed upper road, and the two do not agree. The fault belongs to a borrowed signal, not to every traveller or to Heaven’s own source. An approach construct guards the signal, and the relay beyond it repeats the wrong route. Read both warnings before you begin the watch. The optional mirror can be grounded first.'),
  step('ground-mirror','Ground the warning mirror','interact',28,-17,['inspect-false-relay'],true,
   'Seat the mirror beside the lower service approach. It detunes the Glasswing’s beam charge and adds exactly 0.4 seconds to its warning. The seated fitting and its longer tell show the change. It changes neither health nor damage, and it touches no recovery and no relay pulse. No ordinary material is used.'),
  step('begin-watch','Face the Glasswing at the causeway','interact',0,-53,['inspect-false-relay'],false,
   'Begin the watch on the supported causeway. The construct locks its direction before it fires, and its beam stops at real opaque cover. Unlike the garden’s fittings, it can be hurt during any live phase. Break it with your blade or bow. Walking north, opening the map or reading this page never starts the fight by itself.'),
  step('beam-disabled','Break the Glasswing construct','defeat',0,-61,['begin-watch'],false,
   'Break the construct through the fight itself. It folds at zero stability. It is not a slain angel or a civilian. Its defeat grants no loot or XP, and it lets the relay wake. The way back to the garden stays open.'),
  step('relay-disabled','Break the relay seraph','defeat',7,-99,['beam-disabled'],false,
   'The relay seraph is the heart of the counterfeit route, and it now turns the rescue corridors hostile. Read its radial warning. Step beyond the marked circle, or use cover and Brace. Its defeat stops the repeating false signal and makes the waymarks trustworthy. No payout or passage comes from a button. Only the fight counts.'),
  step('secure-service-route','Mark the service walk','interact',-24,-76,['relay-disabled'],false,
   'Fit the route markers along the Arcade service walk now that both apparatuses are down. The markers name the supported western loop and the way back to the garden. They make no new floor or doorway. The courier can be invited from its waiting place. No ordinary material is spent.'),
  step('invite-wayfarer','Invite the bell courier onto the marked road','interact',-29,-69,['secure-service-route'],false,
   'Invite the courier to walk. Stay within 9 route units while it follows the whole loop; it waits if you wander off. Leaving or reloading resets an unfinished walk, and the invitation stays. You can invite it again from the same place to start over.'),
  step('wayfarer-arrived','Walk the courier home','escort',7,17,['invite-wayfarer'],false,
   'The courier must reach the garden by its own steps, beside Calen and you. Your arrival alone does not count, and an unfinished walk resets. There is no timer, and no button stands in for the walk. Keep the full account and the corrected signs.'),
  step('fit-arrival-assist','Fit the arrival assembly at the garden plate','interact',0,-1,['wayfarer-arrived'],false,
   'At the garden’s response plate, fit the supplied arrival assembly beside the return arm the Broken Choir gave back. It adds a public use; it does not repeat the old repair or its reward. The supplied parts cost nothing from your pack. Read both arrangements before you confirm one.'),
  step('arrangement','Choose how the garden welcomes visitors','choice',0,-1,['fit-arrival-assist'],false,
   'Read the two arrangements and confirm one. Preview and cancel keep the choice open. Both keep the garden open to everyone, the courier’s arrival and the true account. Neither assigns a class, changes your standing or grants an exclusive right. Both carry the same reward.'),
  step('verify-welcome','Check the welcome with Calen','interact',7,20,['arrangement'],false,
   'Return to Calen. Check the corrected signs, the courier’s arrival and the arrangement you chose. Calen names what he saw without pretending to know the whole counterfeit network. Rielle closes the work after that.')
 ],
 choices:[
  {id:'accessible-assist',name:'Accessible assist · keep the ceremony, add an easy lever',
   text:'Keep the three-notch ceremony and add a low lever with a request plate. Anyone who likes the ceremony keeps it. Anyone with tired hands uses the lever. The repaired stroke, the courier’s arrival and the true account all stay, and the garden stays open to everyone.',
   consequence:'The garden fitting keeps its notches and gains a low lever and a request plate. A deliberate press moves the assist stroke, and at rest it stays quiet. A small inscription invites visitors to ask. Rielle, Calen and the courier recognize it. It is kept for good. It grants no exclusive service, gear or class, and it passes no verdict on anyone.',
   recognition:[
    {name:'Rielle',text:'The familiar ceremony can stay. The low lever gives tired hands an easy way to ask.'},
    {name:'Calen',text:'The courier came up the marked road. I will keep the wrong signal in our account.'},
    {name:'Yselle',text:'The request plate leaves room for another pair of hands. The beds can stay planted.'},
    {name:'Wayfarer',text:'I reached the garden on the marked road. The lever lets me answer with tired hands, and I can keep the ceremony if I want it.'}
   ]},
  {id:'broadened-activation',name:'Broadened activation · make the broad plate ordinary',
   text:'Fit a broad plate that anyone can press. The ceremonial notches stay beside it as an optional sequence. Ordinary pressing no longer needs the sequence, though visitors may still do it by choice. The repaired stroke, the courier’s arrival and the true account all stay, and the garden stays open to everyone.',
   consequence:'The garden fitting shows a broad plate beside its retained notches. A deliberate press moves the plate, and at rest it stays quiet. A small inscription records that the plate is open to all. Rielle, Calen and the courier recognize it. It is kept for good. It grants no exclusive service, gear or class, and it passes no verdict on anyone.',
   recognition:[
    {name:'Rielle',text:'The broad plate answers an ordinary press. The old notches are still there for anyone who likes the sequence.'},
    {name:'Calen',text:'The courier came up the marked road. Our corrected route now ends at an open plate.'},
    {name:'Yselle',text:'A broad press leaves room for visitors who move differently. The beds can stay planted.'},
    {name:'Wayfarer',text:'I reached the garden on the marked road. I can use the broad plate now, and the old sequence is there when I want to learn it.'}
   ]}
 ],
 enemies:[
  {id:'heaven-glasswing-sentinel-v1',name:'Glasswing approach construct',kind:'sentinel',x:0,z:-61,hp:110,damage:12,radius:.55,damageWindow:'all-live-phases',spawnAfter:['begin-watch'],defeatStep:'beam-disabled',
   objective:'Break the apparatus that guards the false signal. Its defeat lets the relay wake; it pays no reward.',
   attack:{kind:'beam',reach:9,length:9,halfWidth:.65,windup:1.2,recovery:1.7,support:{step:'ground-mirror',windupBonus:.4}}},
  {id:'heaven-relay-seraph-v1',name:'Relay seraph',kind:'sentinel',x:7,z:-99,hp:620,damage:38,radius:.6,damageWindow:'all-live-phases',spawnAfter:['beam-disabled'],defeatStep:'relay-disabled',boss:'relaySeraph',
   objective:'Break the relay that repeats the false route, so the marked walk and the courier’s passage can be trusted.',
   attack:{kind:'pulse',reach:5.5,radius:3.4,windup:1.4,recovery:2}}
 ],
 escort:{id:'heaven-wayfarer-v1',name:'Wayfarer · bell courier',x:-29,z:-69,radius:.4,speed:2.2,followRange:9,arrivalRadius:1.25,startStep:'invite-wayfarer',arrivalStep:'wayfarer-arrived',route:[
  {x:-29,z:-69},{x:-24,z:-76},{x:-35,z:-55},{x:-35,z:-31},{x:-24,z:-7},{x:-9.6,z:2.4},{x:7,z:17}
 ]}
});
const api=freeze({definition});G.RealmHeavenCampaignData=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
