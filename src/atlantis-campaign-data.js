/* The Harbour Beneath the Harbour: a bounded Farwake/Bellglass adaptation.
 * Recovered direction: Atlantis Draft A, AT05 and First Prototype sections
 * 2-3/7-12 (2026-09-14). They identify proposed fiction, not manuscript canon.
 * This service bay, coordinates, depth bands and finite tuning are new terms.
 * Import grants no actor, collision, consent, pressure state, damage or fee.
 * Root owns future rules, actual movement/contact, persistence and callers.
 */
(function(G){'use strict';
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const step=(id,name,kind,x,z,requires,optional,text,medium='dry',y)=>({id,name,x,z,medium,...(y===undefined?{}:{y}),kind,requires,optional,text});
const patterns=freeze({
 sweep:{kind:'sweep',reach:3.6,radius:3.4,halfAngle:Math.PI/3,windup:1.3,contact:.18,recovery:1.9},
 intake:{kind:'intake',reach:6,length:5.5,halfWidth:1,windup:1.5,active:1.2,recovery:2.1,pullSpeed:1.2,stopRadius:1.2}
});
const current=freeze({
 x:8,z:-25,w:2.4,d:7,minY:-1.6,maxY:-.9,direction:{dx:0,dz:-1},speed:.7,
 startStep:'choose-approach',stopSteps:['manual-bypass','outlet-set']
});
const pressure=freeze({
 stages:['inlet-set','equalizer-set','outlet-set'],bypassStep:'manual-bypass',
 correct:[
  {step:'inlet-set',setting:'isolate-redirect'},
  {step:'equalizer-set',setting:'match-depth-bands'},
  {step:'outlet-set',setting:'chosen-destination'}
 ]
});
const definition=freeze({
 id:'atlantis-harbour-beneath-v1',title:'The Harbour Beneath the Harbour',
 room:'world-atlantis',realm:'atlantis',prerequisite:'atlantis-bellglass-chart-v1',
 giver:{id:'sahra',name:'Sahra · instrument-maker',x:-5,z:-10},
 reward:{xp:48,coins:18,ore:4,materials:{wood:4,fiber:3,crystal:1}},
 summary:'The Bellglass depth chart has been completed and claimed. Sahra’s calibrated lamp and Ilyra’s arrival receipts disagree: Damar is recorded as received at a destination he did not choose. Explicitly accept this separate finite repair, retain an Upper or Lower investigation approach, diagnose the depth-dependent flow, and set the inlet, equalizer and outlet in order. A supplied manual bypass offers a safe current-free alternative. Secure Damar’s local waiting bay, expose the counterfeit bearing through actual Custodian combat, stabilize two releases sequentially, then choose how this local passage and its evidence are kept. Verify the supervised handoff record before returning to Sahra for one fixed fee: up to 48 XP within the existing stored cap, 18 sunmarks, 4 ore, 4 timber, 3 fibre and 1 crystal. The cast comes from recovered proposals; these coordinates, service-bay staging and exact effects are provisional authored adaptations.',
 danger:'The accepted repair can introduce a visible 0.7-unit-per-second current only in the marked shallow water band; existing swimming remains 2.6 units per second. Descend to the quiet lower band, use the supplied manual bypass, or retreat. There is no breath timer, hidden timing penalty or material loss. Bellglass’s air court has no current and no combat. Fight the floor-clamped Breakwater Custodian only on the dry exit quay: fixed 128 health, 10 damage and 0.75 body radius. A 3.4-radius forward vane sector warns for 1.3 seconds and recovers for 1.9; an intake lane warns for 1.5 seconds, pulls for at most 1.2 seconds at 1.2 units per second, and recovers for 2.1. Intake length is at most 5.5 with 1-unit half-width; actual support and opaque cover must clip the locked footprint. Ordinary blade and bow damage remain valid during all live combat phases, with no recovery-only armor or equipment scaling. Use movement, Brace, cover or retreat. Warning shapes and text remain usable with sound off. The free home passage and public visitor protection do not depend on any disposition. No class, soul technique or companion is mandatory.',
 completionText:'Damar’s local waiting bay is safe, the Custodian is stabilized, and the selected passage record matches its local controls. Sahra’s supervised lens consignment and the nursery-custody receipt are accounted for; this does not claim a simulated voyage to an unbuilt nursery. Sahra has paid the fixed 18 sunmarks, 4 ore, 4 timber, 3 fibre and 1 crystal once; XP credits up to 48 within the existing stored cap. These materials support a chosen ordinary crafting or already-unlocked home project, not a universal weapon upgrade. The old visitor survey, Bellglass chart and lamp, realm fitting, equipment and socket history retain their owners. The wider counterfeit-passage plot, full lower lockworks and Tideglass Fitting remain pending. Original Heaven01 and the protected sanctuary remain separate.',
 witnesses:[
  {id:'atlantis-ilyra-v1',name:'Ilyra · records keeper',x:0,z:-18,appearsAfter:[]},
  {id:'atlantis-damar-v1',name:'Damar · stranded carrier',x:15,z:-40.5,appearsAfter:['outlet-set']}
 ],
 approaches:[
  {id:'upper',name:'Upper · read the marked shallow flow',requiredObservation:'upper-reading',
   text:'Retain the Upper approach and read the upper gauge from its actual water depth. The visible shallow current is weaker than ordinary swimming. Hold depth deliberately, or use the supplied manual bypass before operating the repair. A lower reading remains optional evidence with no second fee.'},
  {id:'lower',name:'Lower · follow the quiet old-road band',requiredObservation:'lower-reading',
   text:'Retain the Lower approach and read the lower masonry mark from its actual water depth. This band stays below the accepted shallow current. The public envelope covers it without a timer or a new class. An upper reading remains optional evidence with no second fee.'}
 ],
 steps:[
  step('receipt-conflict','Compare Ilyra’s two arrival receipts','interact',0,-18,[],false,
   'Ilyra distinguishes Damar’s earlier shipping receipt from Lock Prefect Vaelor’s later destination instruction: the earlier-issued seal gives the redirected destination authority. His record says received, but his chosen arrival never happened. Preserve both records and his account. This is a concrete routing convention, not proof that every institution lies.'),
  step('choose-approach','Retain an Upper or Lower investigation approach','approach',-5,-10,['receipt-conflict'],false,
   'Read both depth approaches and the supplied manual bypass before confirming. The first confirmed Upper or Lower choice is retained. Its named observation is required for diagnosis; the other observation remains optional evidence. Preview and cancel grant no consent or progress. This choice does not assign a class or allegiance.'),
  step('upper-reading','Read the shallow flow gauge','interact',8,-22,['choose-approach'],true,
   'Read the upper gauge from this real water depth. It agrees with Sahra’s lamp but disagrees with the official destination setting. This is required only when Upper was retained; for Lower it is optional supporting evidence. No fee, material or earlier-chart progress is granted.', 'water',-1.05),
  step('lower-reading','Read the quiet lower-road mark','interact',8,-28,['choose-approach'],true,
   'Read the older masonry at this real lower depth, below the marked shallow current. Its depth convention identifies the same redirected outlet. This is required only when Lower was retained; for Upper it is optional supporting evidence. Keep the old mark and earlier chart intact.', 'water',-2.55),
  step('diagnose-flow','Diagnose the redirected depth setting','interact',8,-35,['choose-approach'],false,
   'At Bellglass’s dry visitor desk, use the retained approach’s actual reading to identify the depth setting copied into the wrong destination record. The other reading is welcome but unnecessary. The correct repair isolates the redirected inlet, matches the depth bands, then selects the carrier’s chosen outlet. No occult initiation or unseen timer is required.', 'court',-2.7),
  step('manual-bypass','Open the supplied safe manual bypass','pressure',12,-29,['choose-approach'],true,
   'Operate the supplied manual bypass from the wet east lane. It stops only this accepted repair’s shallow current; the public air court and downstream visitor supply remain maintained. The three required inlet, equalizer and outlet stages still need their own correct operations. There is no hidden timing penalty, material loss, enemy-stat change or extra fee.', 'water',-1.8),
  step('inlet-set','Isolate the redirected service inlet','pressure',8,-22,['diagnose-flow'],false,
   'Set isolate-redirect at the shallow inlet. Isolate the counterfeit destination branch while retaining public visitor supply. This is the first required pressure stage; an outlet action cannot substitute. The safe manual bypass remains available. Incorrect or premature settings spend no materials and leave accepted work intact.', 'water',-1.05),
  step('equalizer-set','Match the two rated depth bands','pressure',8,-35,['inlet-set'],false,
   'Set match-depth-bands at Bellglass’s dry control desk after inlet isolation. The chosen reading and maintained depth chart establish the bands. Keep the public air volume supplied. This is the second required pressure stage, with no timing penalty or forced simultaneous switches.', 'court',-2.7),
  step('outlet-set','Select Damar’s chosen outlet','pressure',12,-38.4,['equalizer-set'],false,
   'Set chosen-destination at the wet east outlet after equalization. The corrected local outlet stops the accepted shallow current and permits a safe supervised handoff. Neither this setting nor the earlier optional marker pays a reward. Leave through the existing gallery landing for the dry waiting bay.', 'water',-1.4),
  step('secure-carrier','Secure Damar’s local waiting bay','interact',15,-40.5,['outlet-set'],false,
   'Damar waits at this supported dry service bay with his load accounted for. Record his actual account and the isolated local hold. His boat and skill were never the fault. He can remain safely here through pause, reload or retreat; no traveling escort or real-time deadline is required. The unbuilt full lower hold is not opened by this adaptation.'),
  step('challenge-custodian','Begin the dry-quay Custodian release','interact',8,-44,['secure-carrier'],false,
   'Deliberately begin work on the quay-mounted Breakwater Custodian. It is a municipal service construct running a counterfeit schedule. Its body stays floor-clamped on the supported dry quay. Read the locked vane sector and intake lane; move, Brace or use actual cover. The machine carries no independent XP, loot or gear fee.'),
  step('bearing-exposed','Expose the counterfeit Custodian bearing','defeat',8,-44,['challenge-custodian'],false,
   'Only actual damage exhausting the owned Custodian’s fixed combat health establishes this fact. A manual completion button cannot substitute. The machine settles into a disabled service state; it is not killed or exploded. This exhaustion grants no independent loot or XP and does not stabilize the two releases or pay the campaign fee.'),
  step('release-west','Stabilize the west release first','pressure',2,-44,['bearing-exposed'],false,
   'Stabilize the west release after the actual bearing exhaustion. This is the first of two sequential dry service operations. The settled machine and secured bay remain safe; no second player, timed appointment or simultaneous switch is required.'),
  step('release-east','Stabilize the east release second','pressure',15,-44,['release-west'],false,
   'Stabilize the east release after the west release is recorded. The two release facts belong to this campaign, independently of combat exhaustion. Retried, remote or refused-save operations cannot manufacture stabilization or another payment.'),
  step('custodian-stable','Verify the settled municipal Custodian','interact',8,-44,['release-east'],false,
   'Verify both sequential releases and the settled tools. The municipal Custodian remains part of this local service bay. Damar’s safety and your independent home passage already exist before a disposition. This is a bounded restoration; the full drydock, city circulation and distant lockworks remain unavailable.'),
  step('disposition','Choose the local passage and evidence disposition','choice',0,-18,['custodian-stable'],false,
   'Read Publish, Limited or License and their exact local consequences before confirming. Preview and cancel keep the disposition undecided. Each keeps Damar safe, preserves his account and pays the same fixed fee. License is a deliberate personal record for this local load; no choice changes Grace, Cinder, renunciation, class or global allegiance. Future patron privileges and wider political access remain pending.'),
  step('verify-passage','Verify the selected record and supervised handoff','interact',12,-40.1,['disposition'],false,
   'At the supported dry landing, verify the local controls and receipt fixture against the saved disposition. Record the supervised lens-consignment release to Sahra and feed-frame release into named nursery custody here. This is an authored local handoff, not a simulated voyage to a nursery or evidence that Pelan witnessed a delivery. Return to Sahra and explicitly claim the fixed fee; verified work can remain safely unpaid.')
 ],
 choices:[
  {id:'publish',name:'Publish · keep a checked public passage record',
   text:'Post the false bearing evidence, Damar’s full account and the checked local routing record for public inspection. Fit two checked outlet indicators. This bounded public record makes the office’s conflicting instruction visible; citywide removal from office and future closed-patron business are not implemented. Damar’s safety and the free home passage remain.',
   consequence:'The registry and landing show the posted evidence and paired checked outlet indicators. Sahra, Ilyra and Damar recognize the permanent local public record. The stated fee remains unchanged. The wider political dispute and future services remain pending.',
   recognition:[
    {name:'Sahra',text:'The lamp and the posted passage record can now be checked against each other. The lens consignment has its supervised release record.'},
    {name:'Ilyra',text:'Both receipts remain visible beside the corrected outlet. Anyone can see which instruction redirected this load.'},
    {name:'Damar',text:'My chosen arrival and the false instruction are both on the public record. My account was not shortened to make the office look right.'}
   ]},
  {id:'limited',name:'Limited · keep an independent manual passage',
   text:'Keep the corrected independent manual passage and place the false bearing evidence in reviewed local custody. Fit a hooded custody record beside a manual-bypass indicator. This secures the resolved load while leaving the broad dispute open. Restricted deep districts are unbuilt; their access is not granted or revoked here. Damar’s safety and the free home passage remain.',
   consequence:'The registry and landing show the hooded custody record and independent manual-passage indicator. Sahra, Ilyra and Damar recognize the permanent local custody arrangement. The stated fee remains unchanged. No hidden corridor, deep access or future business privilege is granted.',
   recognition:[
    {name:'Sahra',text:'The supervised lens release is recorded beside the manual passage. The broader claim is still there to be answered.'},
    {name:'Ilyra',text:'The conflicting receipts are in reviewed custody. Limited passage does not erase either record or decide the whole office dispute.'},
    {name:'Damar',text:'The manual passage secures this load and keeps my full account. I can wait safely without pretending every destination is now free.'}
   ]},
  {id:'license',name:'License · retain a disclosed personal permit',
   text:'Knowingly retain a personal permit for this resolved local load under the office’s disclosed claim terms. Fit a permit seal and retain the outer claim marker. The independently safe passage already exists, so refusal never holds emergency air, Damar or your exit hostage. This local record does not pledge a party, class, soul or real-world user. Future patron privileges are not implemented. Damar’s safety and the free home passage remain.',
   consequence:'The registry and landing show the personal permit seal beside the retained outer claim marker. Sahra, Ilyra and Damar recognize the permanent local licence and its responsibility. The stated fee remains unchanged. Future patron services, renunciation or restitution routes need their own implemented contracts.',
   recognition:[
    {name:'Sahra',text:'This lens release carries the personal permit you chose. The instrument records it without calling the remaining claims harmless.'},
    {name:'Ilyra',text:'Your permit and the false destination instruction remain distinct records. This signature covers the declared local load.'},
    {name:'Damar',text:'I am safe and my account remains complete. The permit was your deliberate choice after the independent passage existed.'}
   ]}
 ],
 enemy:{id:'atlantis-breakwater-custodian-v1',name:'Breakwater Custodian',kind:'sentinel',x:8,z:-44,hp:128,damage:10,radius:.75,damageWindow:'all-live-phases',spawnAfter:['challenge-custodian'],defeatStep:'bearing-exposed'}
});
const api=freeze({definition,patterns,current,pressure});
G.RealmAtlantisCampaignData=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
