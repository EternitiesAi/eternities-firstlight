/* The Harbour Beneath the Harbour: the drowned witness, part one of the witness act.
 * Import grants no actor, collision, consent, pressure state, damage or reward. The root owns movement,
 * contact, persistence and callers. Ids, steps and tuning are the save contract; text is the story. */
(function(G){'use strict';
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const step=(id,name,kind,x,z,requires,optional,text,medium='dry',y)=>({id,name,x,z,medium,...(y===undefined?{}:{y}),kind,requires,optional,text});
// The witness guardian is the act's one boss. The difficulty table owns its numbers when it is loaded.
const boss=(()=>{const b=G.RealmDifficulty?.boss?.('witnessGuardian');return b&&Number.isFinite(b.hp)&&Number.isFinite(b.damage)?b:{hp:2860,damage:28};})();
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
 reward:{xp:148,coins:18,ore:4,materials:{wood:4,fiber:3,crystal:1}},
 summary:'Damar, a stranded carrier, went under the harbour when a counterfeit route took his load. Down there the drowned witness kept a daybook: forty-one people, written down by the man who kept them. Read Ilyra’s two receipts, keep an Upper or Lower reading, set the inlet, equalizer and outlet in order, then break the Guardian that keeps the record. Choose how the record is kept, and return to Sahra for your reward.',
 danger:'The repair can bring a 0.7-unit-per-second current into the marked shallow water band; ordinary swimming stays at 2.6 units per second. Descend to the quiet lower band, use the manual bypass or retreat. There is no breath timer and no material loss. Bellglass’s air court has no current and no combat. The Drowned Witness Guardian waits on the dry exit quay with '+boss.hp+' health, '+boss.damage+' damage and a 0.75 body radius. A 3.4-radius forward vane sector warns for 1.3 seconds and recovers for 1.9. An intake lane warns for 1.5 seconds, pulls for at most 1.2 seconds at 1.2 units per second, and recovers for 2.1; it is at most 5.5 long with a 1-unit half-width, actual support and opaque cover must clip the locked footprint. Move, Brace, use cover or retreat. Ordinary blade and bow damage remain valid during all live combat phases, with no recovery-only armor or equipment scaling. The warnings stay readable with sound off.',
 completionText:'Damar is safe. The Guardian is stilled, both releases are settled, and the drowned witness’s record is in your keeping. It names the Regent of Ash as the one who took the pattern from Damar’s hold. Sahra gives you 18 sunmarks, 4 ore, 4 timber, 3 fibre and 1 crystal, and up to 48 XP within your stored cap. The timber, fibre and crystal serve any ordinary crafting project you choose. The old Bellglass chart and lamp keep their own records.',
 witnesses:[
  {id:'atlantis-ilyra-v1',name:'Ilyra · records keeper',x:0,z:-18,appearsAfter:[]},
  {id:'atlantis-damar-v1',name:'Damar · the drowned witness',x:15,z:-40.5,appearsAfter:['outlet-set']}
 ],
 approaches:[
  {id:'upper',name:'Upper · read the marked shallow flow',requiredObservation:'upper-reading',
   text:'Keep the Upper approach and read the shallow gauge from its real water depth. The visible current is weaker than ordinary swimming. Hold depth deliberately, or use the manual bypass before you operate the repair. A lower reading still counts as evidence.'},
  {id:'lower',name:'Lower · follow the quiet old-road band',requiredObservation:'lower-reading',
   text:'Keep the Lower approach and read the old masonry mark from its real water depth. This band lies below the shallow current, so the public envelope covers it without a timer. An upper reading still counts as evidence.'}
 ],
 steps:[
  step('receipt-conflict','Compare Ilyra’s two receipts','interact',0,-18,[],false,
   'Ilyra keeps two receipts for Damar’s load: the earlier shipping seal, and a later instruction that sent the load to a destination he never chose. Read them side by side. The record under the sea was written by the same hand, and it names the stranger who took the pattern.'),
  step('choose-approach','Keep an Upper or Lower approach','approach',-5,-10,['receipt-conflict'],false,
   'Read both approaches and the manual bypass before you confirm. The first approach you keep names the depth reading the repair needs. The other reading stays open as evidence. The choice does not assign a class or an allegiance.'),
  step('upper-reading','Read the shallow flow gauge','interact',8,-22,['choose-approach'],true,
   'Read the upper gauge from this real water depth. It agrees with Sahra’s lamp and disagrees with the official destination setting. It is required when you keep Upper, and supporting evidence when you keep Lower.', 'water',-1.05),
  step('lower-reading','Read the quiet lower-road mark','interact',8,-28,['choose-approach'],true,
   'Read the older masonry at this real lower depth, below the marked shallow current. Its depth convention names the same redirected outlet. It is required when you keep Lower, and supporting evidence when you keep Upper. Leave the old mark as it is.', 'water',-2.55),
  step('diagnose-flow','Find the redirected depth setting','interact',8,-35,['choose-approach'],false,
   'At Bellglass’s dry visitor desk, use your kept reading to find the depth setting that was copied into the wrong destination record. The repair isolates the redirected inlet, matches the depth bands, then selects Damar’s outlet. Nothing else is needed.', 'court',-2.7),
  step('manual-bypass','Open the manual bypass','pressure',12,-29,['choose-approach'],true,
   'Operate the supplied manual bypass from the wet east lane. It stops only this repair’s shallow current, and the air court and the visitor supply stay on. The three required inlet, equalizer and outlet stages still need their own correct settings.', 'water',-1.8),
  step('inlet-set','Isolate the redirected inlet','pressure',8,-22,['diagnose-flow'],false,
   'Set isolate-redirect at the shallow inlet. This cuts the counterfeit destination and keeps the public supply running. It has to come first; an outlet setting cannot stand in for it. Wrong or early settings cost nothing and leave your work intact.', 'water',-1.05),
  step('equalizer-set','Match the two depth bands','pressure',8,-35,['inlet-set'],false,
   'Set match-depth-bands at the dry control desk, once the inlet is isolated. The reading you kept and the depth chart set the bands. Keep the public air supplied while you work.', 'court',-2.7),
  step('outlet-set','Select Damar’s outlet','pressure',12,-38.4,['equalizer-set'],false,
   'Set chosen-destination at the wet east outlet, after the bands match. The load now goes where it was meant to go, and the shallow current stops. Leave through the gallery landing for the dry waiting bay.', 'water',-1.4),
  step('secure-carrier','Sit with Damar in the waiting bay','interact',15,-40.5,['outlet-set'],false,
   'Damar waits at this dry service bay with his load accounted for. Hear his account. His boat was never the fault. He can wait here safely through a pause, a reload or a retreat.'),
  step('challenge-custodian','Face the Drowned Witness Guardian','interact',8,-44,['secure-carrier'],false,
   'Begin the fight on the dry exit quay. The Guardian is a service machine that still holds the witness’s ledger, and it stays anchored at its service foundation; it does not chase you. Read the locked vane sector and intake lane, then move, Brace or use cover.'),
  step('bearing-exposed','Still the Guardian','defeat',8,-44,['challenge-custodian'],false,
   'Bring the Guardian’s fixed health to zero with real blade or bow damage. It settles into a disabled state; it is not killed or exploded. A button press cannot do this for you.'),
  step('release-west','Stabilize the west release first','pressure',2,-44,['bearing-exposed'],false,
   'Stabilize the west release now that the Guardian is still. This is the first of two dry service operations, and the settled machine keeps the bay safe.'),
  step('release-east','Stabilize the east release second','pressure',15,-44,['release-west'],false,
   'Stabilize the east release after the west release is recorded. Both releases count toward this repair, whatever happened in the fight. Repeated or refused attempts cannot change the result.'),
  step('custodian-stable','Read the drowned witness’s record','interact',8,-44,['release-east'],false,
   'Verify both releases and the settled tools. With the Guardian stilled, the sealed record can be read. It is a daybook: forty-one names in one hand, and the road the stolen pattern took beside them.'),
  step('disposition','Choose what becomes of the record','choice',0,-18,['custodian-stable'],false,
   'Read Publish, Limited and License and their exact consequences before you choose. Preview and cancel keep the choice open. Each one keeps Damar safe and keeps his account whole.'),
  step('verify-passage','Verify the passage and hand the lens over','interact',12,-40.1,['disposition'],false,
   'At the dry landing, check the controls and the receipts against your choice. Record the supervised release of the lens consignment to Sahra, then return to Sahra for your reward.')
 ],
 choices:[
  {id:'publish',name:'Publish · show the record to the harbour',
   text:'Post the record where everyone in the harbour can read it: Damar’s account, both receipts and the Regent’s hand in them. Nothing is hidden, and nothing is decided for anyone else. Damar’s safety and the free home passage remain.',
   consequence:'The landing shows the posted record beside two checked outlet indicators. Sahra, Ilyra and Damar recognize it as a public record.',
   recognition:[
    {name:'Sahra',text:'The lamp and the posted passage record can now be checked against each other. The lens consignment has its supervised release record.'},
    {name:'Ilyra',text:'Both receipts remain visible beside the corrected outlet. Anyone can see which instruction redirected this load.'},
    {name:'Damar',text:'My chosen arrival and the false instruction are both on the public record. My account was not shortened to make the office look right.'}
   ]},
  {id:'limited',name:'Limited · keep the record in careful custody',
   text:'Keep the corrected manual passage open, and put the record in reviewed local custody under a hooded seal. The record is safe and it is not thrown open. Damar keeps his full account. Damar’s safety and the free home passage remain.',
   consequence:'The landing shows the hooded custody record beside an independent manual-passage indicator. Sahra, Ilyra and Damar recognize the arrangement.',
   recognition:[
    {name:'Sahra',text:'The supervised lens release is recorded beside the manual passage. The larger question is still there to be answered.'},
    {name:'Ilyra',text:'The conflicting receipts are in reviewed custody. Limited passage does not erase either record or decide the whole office dispute.'},
    {name:'Damar',text:'The manual passage secures this load and keeps my full account. I can wait safely without pretending every destination is now free.'}
   ]},
  {id:'license',name:'License · keep a disclosed personal permit',
   text:'Keep a personal permit for this load under the office’s disclosed terms, sealed beside the Regent’s mark. Refusing would never hold Damar or your way out hostage. His roads open to you, including the one the fox is on. Damar’s safety and the free home passage remain.',
   consequence:'The landing shows the permit seal beside the office’s marker. Sahra, Ilyra and Damar recognize the permit you chose and what it means.',
   recognition:[
    {name:'Sahra',text:'This lens release carries the personal permit you chose. The instrument records it as you chose it.'},
    {name:'Ilyra',text:'Your permit and the false destination instruction remain distinct records. This signature covers the declared local load.'},
    {name:'Damar',text:'I am safe and my account remains complete. The permit was your deliberate choice after the independent passage existed.'}
   ]}
 ],
 enemy:{id:'atlantis-breakwater-custodian-v1',name:'Drowned Witness Guardian',kind:'sentinel',x:8,z:-44,hp:boss.hp,damage:boss.damage,radius:.75,anchored:true,damageWindow:'all-live-phases',spawnAfter:['challenge-custodian'],defeatStep:'bearing-exposed'}
});
const api=freeze({definition,patterns,current,pressure});
G.RealmAtlantisCampaignData=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
