/* The Gate That Remained Open: one lower Garden-approach continuation.
 * Direction: recovered Heaven Story and Event Atlas hv.q21-23, Rielle/Calen,
 * World Bible H07 and Prototype Spec sections 7-8/10 (2026-09-14).
 * Those regional people and events are working proposals, not manuscript canon.
 * This courier, staging, finite tuning and choice effects are new adaptations.
 * Importing this catalogue grants no consent, history, actor, support or reward.
 * Root owns future rules, actual combat/escort, persistence and integration.
 */
(function(G){'use strict';
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const step=(id,name,kind,x,z,requires,optional,text)=>({id,name,x,z,medium:'dry',kind,requires,optional,text});
const definition=freeze({
 id:'heaven-gate-remained-open-v1',title:'The Gate That Remained Open',
 room:'world-heaven',realm:'heaven',prerequisite:'heaven-broken-choir-v1',
 giver:{id:'heaven-rielle',name:'Rielle · bellwright',x:-14,z:5},
 reward:{xp:40,coins:16,ore:3,materials:{wood:4,fiber:3}},
 summary:'The Broken Choir was repaired and claimed. Its Garden answer remains true. A waiting bell courier has followed a rescue signal that points toward the closed upper road. Compare the courier’s account with the Arcade and Causeway marks, deliberately begin the approach watch, disable two distinct apparatuses, and walk with the courier through the existing service loop. Add an arrival assembly to the repaired public instrument and choose how it welcomes the next visitor. Accept this separate finite campaign explicitly. Rielle pays one fixed fee after verification: up to 40 XP within the stored cap, 16 sunmarks, 3 ore, 4 timber and 3 fibre. These regional identities, local staging and exact effects are provisional authored adaptations.',
 danger:'The Glasswing approach construct has 110 health and a locked directed beam: 9-unit reach and length, 0.65 half-width, 1.2-second warning, 1.7-second recovery and 12 damage. The supplied grounded mirror adds exactly 0.4 seconds to that beam warning only. The borrowed-road relay has 75 health and a local radial pulse: 5.5-unit reach, 3.4-unit radius, 1.4-second warning, 2-second recovery and 9 damage. Real opaque cover blocks contact. Both apparatuses accept ordinary damage during all live phases; neither has recovery-only armor or equipment scaling. Use the owned blade or bow, move, Brace or retreat. Shape and text carry the warnings with sound off. The Road home remains free. The courier is a traveler to welcome, not an enemy or a live online participant. No class, soul technique or companion is mandatory. The upper terrace remains closed.',
 completionText:'Calen keeps the corrected route beside the courier’s full account. The actual courier arrival and selected instrument arrangement remain in local history. Rielle’s earlier Garden repair stays true; the beam construct and counterfeit relay stay disabled for this campaign. Rielle has paid the fixed 16 sunmarks, 3 ore, 4 timber and 3 fibre once; XP credits up to 40 within the existing stored cap. These materials contribute to a chosen project, not a promised upgrade for every veteran. No gear was fitted, equipped or granted. Public passage remains usable under either arrangement. The full Far Gates, upper city, original Heaven01 trial and protected sanctuary remain separate.',
 steps:[
  step('witness-account','Hear the waiting courier’s account','interact',-29,-69,[],false,
   'Meet the Wayfarer · bell courier beside the existing service walk. A rescue signal promised an open upper passage, but the courier stopped when its directions contradicted the closed road. Keep the whole account. Arrival is not an invasion, and tired hands are not a failure of worth. Compare the public maker’s marks rather than requiring an oath, a class or a perfect-pitch test.'),
  step('compare-arrival-marks','Compare the Arcade arrival marks','interact',-35,-31,['witness-account'],false,
   'Inspect the existing Ruby Arcade response plate and the courier’s recorded mark. Its truthful repair notch differs from the repeated false passage signal. Calen can explain his authored observations; the visible marks support independent inspection when no guide follows. Record the distinction without changing the old survey or Broken Choir payment.'),
  step('inspect-false-relay','Inspect the borrowed rescue signal','interact',0,-79,['compare-arrival-marks'],false,
   'At the existing Mirror Causeway plate, compare the promised rescue direction with the visible closed upper road. The mismatch belongs to a foreign signal apparatus, not to every traveler or to Heaven’s divine source. An approach construct guards that signal; the relay beyond it keeps repeating the incorrect route. Read their distinct warnings before beginning the watch. The optional supplied mirror can be grounded first.'),
  step('ground-mirror','Ground the supplied warning mirror','interact',28,-17,['inspect-false-relay'],true,
   'Seat the supplied mirror beside Yselle’s lower service approach. It detunes the Glasswing beam charge and adds exactly 0.4 seconds to its warning. Its seated fitting and longer visible tell show the change. It changes neither enemy health nor damage, no recovery interval, and no relay pulse. No ordinary inventory is spent. This new signal preparation does not repeat the earlier spillway or claim new water simulation.'),
  step('begin-watch','Begin the warned approach watch','interact',0,-53,['inspect-false-relay'],false,
   'Deliberately begin the Glasswing encounter on the supported Causeway. Its beam locks its direction before firing and stops at actual opaque cover. Unlike the earlier service core and Hell Warden, this construct can be damaged during any live phase. Disable the actual construct with the owned blade or bow. Walking north, opening a map or reading this account never starts combat by itself.'),
  step('beam-disabled','Disable the Glasswing approach construct','defeat',0,-61,['begin-watch'],false,
   'Resolve the real beam encounter through actual combat. The construct folds at zero stability; this is not a slain angel or civilian. Its defeat records this step, grants no independent loot or XP, and permits the separate borrowed-road relay encounter to activate. Ordinary damage remains valid during warning and recovery. The free route back to the Garden stays open.'),
  step('relay-disabled','Stop the counterfeit passage relay','defeat',7,-99,['beam-disabled'],false,
   'Disable the actual relay on the lower northern apron. Read its radial warning, step beyond the marked circle or use cover and Brace; it is distinct from the Glasswing’s directed beam. Its defeat stops the repeating false route signal and makes the supplied service waymarks trustworthy. No damage, payout or passage success comes from a journal button. The original closed terrace and retired Broken Choir service core retain their own state.'),
  step('secure-service-route','Secure the existing service passage','interact',-24,-76,['relay-disabled'],false,
   'Fit supplied route markers on the existing Arcade service walk after both apparatuses are disabled. The markers identify the actual supported western loop and the Garden return; they create no new floor, doorway or summit route. The courier can now be invited from the waiting place. This finite public work costs no ordinary materials and does not consume protected flowers.'),
  step('invite-wayfarer','Invite the courier onto the marked route','interact',-29,-69,['secure-service-route'],false,
   'At the waiting courier, explicitly invite the real authored traveler to walk. Stay within 9 route units while the courier follows the complete service loop; it waits if you move too far away. Leaving or reloading resets an unfinished walk while retaining the invitation. Return here and deliberately invite again to restart without another fee or material grant. The Wayfarer is one actor, separate from Calen, Rielle and Yselle.'),
  step('wayfarer-arrived','Welcome the courier beside Calen','escort',7,17,['invite-wayfarer'],false,
   'Only the owned courier actor’s actual complete supported-route arrival beside Calen and the player records this fact. The player reaching this point, elapsed time, reopening the journal or a manual completion button cannot substitute. Unfinished route progress is transient. There is no timer-shame, hidden assisted arrival or repeated rescue payment. Keep the complete account and corrected signs.'),
  step('fit-arrival-assist','Fit the public arrival assembly','interact',0,-1,['wayfarer-arrived'],false,
   'At the already repaired Garden response plate, fit the supplied arrival assembly. Preserve the complete return arm earned in The Broken Choir. This is an additional useful public function, not a replay of the old repair or reward. The supplied parts cost no ordinary gear or materials. Read both permanent instrument arrangements before deliberately confirming one.'),
  step('arrangement','Choose the instrument’s welcome arrangement','choice',0,-1,['fit-arrival-assist'],false,
   'Read and explicitly confirm Accessible assist or Broadened activation. Preview and cancel keep the choice undecided. Both preserve usable public service, actual courier arrival, truthful records and the free road home; their fitting, activation animation and inscription differ. Neither assigns a class or changes Grace, Cinder, renunciation, global allegiance, guild rights or online access. Both offer the same stated once-only fee.'),
  step('verify-welcome','Verify the route and selected welcome','interact',7,20,['arrangement'],false,
   'Return to Calen’s existing Garden anchor. Verify the corrected service signs, actual courier arrival and selected public instrument fitting. Calen names what he observed without pretending knowledge of the whole counterfeit network. Rielle can now pay the separate fixed fee at her existing west bench. Completed verification can remain safely unpaid if a full pouch or refused save prevents the whole claim.')
 ],
 choices:[
  {id:'accessible-assist',name:'Accessible assist · retain the ceremony with ordinary help',
   text:'Retain the three-notch ceremonial frame and add a lower assist lever plus a request plate. Visitors who enjoy the ceremony can use it; a visitor with tired hands can use an ordinary assisted activation instead. The complete repaired stroke, courier arrival and truthful account remain. This local arrangement keeps public service usable and does not gate anyone’s right to pass.',
   consequence:'The Garden fitting shows its ceremonial notches, lower lever and request plate. A deliberate activation briefly moves the assist stroke; at rest the fitting stays quiet. Its small inscription records the invitation to ask. Rielle, Calen and the courier recognize this permanent accessible-assist arrangement. The stated fee remains unchanged. No exclusive service, gear, class, guild permission or automatic moral verdict is granted.',
   recognition:[
    {name:'Rielle',text:'The familiar ceremony can stay. The lower lever gives tired hands an ordinary way to ask.'},
    {name:'Calen',text:'The courier reached us on the marked service loop. I will keep the old wrong signal in our account.'},
    {name:'Yselle',text:'The request plate leaves room for another pair of hands. Our public beds can stay planted.'},
    {name:'Wayfarer',text:'I reached the Garden on the marked service loop. The lower lever lets me answer with tired hands and keep the ceremony if I choose.'}
   ]},
  {id:'broadened-activation',name:'Broadened activation · make the broad plate ordinary',
   text:'Fit a broad activation plate and retain the ceremonial notches beside it as an optional sequence. Ordinary activation no longer requires that sequence; visitors may still perform it by choice. The complete repaired stroke, courier arrival and truthful account remain. This local arrangement keeps public service usable and does not gate anyone’s right to pass.',
   consequence:'The Garden fitting shows a broad plate beside retained ceremonial notches. A deliberate activation briefly moves the broad plate; at rest the fitting stays quiet. Its small inscription records the open activation. Rielle, Calen and the courier recognize this permanent broadened-activation arrangement. The stated fee remains unchanged. No exclusive service, gear, class, guild permission or automatic moral verdict is granted.',
   recognition:[
    {name:'Rielle',text:'The broad plate answers an ordinary press. The old notches are still there for anyone who enjoys the sequence.'},
    {name:'Calen',text:'The courier reached us on the marked service loop. Our corrected route now ends at an open activation.'},
    {name:'Yselle',text:'The broad press leaves room for visitors who move differently. Our public beds can stay planted.'},
    {name:'Wayfarer',text:'I reached the Garden on the marked service loop. I can use the broad plate now; the old sequence is there when I want to learn it.'}
   ]}
 ],
 enemies:[
  {id:'heaven-glasswing-sentinel-v1',name:'Glasswing approach construct',kind:'sentinel',x:0,z:-61,hp:110,damage:12,radius:.55,damageWindow:'all-live-phases',spawnAfter:['begin-watch'],defeatStep:'beam-disabled',
   objective:'Disable the apparatus guarding the false rescue signal; permit the separate relay encounter without paying an enemy reward.',
   attack:{kind:'beam',reach:9,length:9,halfWidth:.65,windup:1.2,recovery:1.7,support:{step:'ground-mirror',windupBonus:.4}}},
  {id:'heaven-counterfeit-relay-v1',name:'Borrowed-road relay',kind:'sentinel',x:7,z:-99,hp:75,damage:9,radius:.6,damageWindow:'all-live-phases',spawnAfter:['beam-disabled'],defeatStep:'relay-disabled',
   objective:'Stop the repeating false passage signal so the supplied western service waymarks and actual courier passage can be verified.',
   attack:{kind:'pulse',reach:5.5,radius:3.4,windup:1.4,recovery:2}}
 ],
 escort:{id:'heaven-wayfarer-v1',name:'Wayfarer · bell courier',x:-29,z:-69,radius:.4,speed:2.2,followRange:9,arrivalRadius:1.25,startStep:'invite-wayfarer',arrivalStep:'wayfarer-arrived',route:[
  {x:-29,z:-69},{x:-24,z:-76},{x:-35,z:-55},{x:-35,z:-31},{x:-24,z:-7},{x:-9.6,z:2.4},{x:7,z:17}
 ]}
});
const api=freeze({definition});G.RealmHeavenCampaignData=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
