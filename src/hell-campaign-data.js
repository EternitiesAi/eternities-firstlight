/* The stolen pattern: hell's campaign after the Open Cage rescue. The pattern that took Briar was cut in the
 * regent's foundry, and its outer gate is kept by Veyr. Step and choice ids are saved, so they stay put even
 * where the words change. Rules and the warden fight live in hell-campaign.js. */
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
 title:'The Stolen Pattern',
 room:'world-hell',realm:'hell',prerequisite:'hell-open-cage-v1',
 giver:{id:'hell-istra',name:'Istra · return keeper',x:-10,z:24},
 reward:{xp:45,coins:20,ore:4,materials:{wood:3,fiber:2}},
 regent:{x:0,z:-106},
 summary:'Neris’s record names the foundry. The pattern that took Briar was cut in its works, and its trail runs down to the outer gate. Read the foundry’s own measurements, face Veyr, who keeps the gate for the regent, take the pattern back, and decide what becomes of the people the writ still holds. Istra closes the road when it is done.',
 danger:'Veyr, the foundry’s warden, is the heaviest fight on this road so far. He has two locked attacks: a broad short sweep and a narrow line. Each has a 1.35-second warning and a 2.2-second recovery. Step beside the marked shape, use real cover or Brace (3), then strike while he recovers. The optional counterweight adds 0.6 seconds to sweep recovery, and the optional brace adds 0.6 seconds to line recovery. Below half health his order changes, and his strikes do not come faster. Sound is optional; shape and text carry the warning. The road home stays open before, during and after the fight. The inner foundry stays shut.',
 completionText:'Istra keeps the record beside Neris’s full measurements. The pattern is back in the valley’s hands, and Veyr no longer keeps the gate. The people the writ held have the road you chose for them, and the works remember it. The regent has seen you at the gate and said your name. The inner foundry and the rest of Hell are still to come.',
 steps:[
  step('witness-record','Hear Neris’s full record','interact',-12,27,[],false,
   'Neris is at the Kiln Refuge. Her record names the foundry. The pattern that took Briar was cut there, and the mark in its margin is the regent’s. Take the record to Tovan.'),
  step('tovan-account','Check Tovan’s rivets','interact',-15,16,['witness-record'],false,
   'Tovan knows the foundry’s pattern plates by their rivets, because he set some of them. Compare his count with Neris’s, then go to the outer gate.'),
  step('read-service-writ','Read the foundry’s outer gate','interact',-12,-95,['tovan-account'],false,
   'The pattern’s route runs out of the works through this gate and into the yard. The inner doors stay shut. Two preparations stand nearby, and neither is required. Read the warden’s terms before you knock.'),
  step('west-shunt','Set the west counterweight','interact',-18,-90,['read-service-writ'],true,
   'Set the counterweight beside the west approach. It adds exactly 0.6 seconds to Veyr’s recovery after a sweep. It changes neither his health nor his damage, and it does not touch the line recovery. No ordinary material is used.'),
  step('east-brace','Seat the east brace','interact',17,-90,['read-service-writ'],true,
   'Seat the brace beside the east approach. It adds exactly 0.6 seconds to Veyr’s recovery after a line strike. It changes neither his health nor his damage, and it does not touch the sweep recovery. No ordinary material is used.'),
  step('challenge-veyr','Challenge Veyr at the gate','interact',0,-91,['read-service-writ'],false,
   'Veyr keeps the open apron, and the fight begins there. Read the broad sweep and the narrow line as two different shapes, and find cover before you commit. The road south stays open.'),
  step('warden-resolved','Defeat Veyr, the foundry’s warden','defeat',0,-99,['challenge-veyr'],false,
   'Veyr falls at the gate, and the gate’s clamps let go. You beat him with ordinary strikes, and nothing else counted. The pattern can be reached now.'),
  step('stabilize-service-engine','Take the pattern back','interact',0,-105,['warden-resolved'],false,
   'Fit the stabilizer into the gate engine and draw the pattern out of it. It was never theirs, and it is yours to bring home. Behind the works, the smiling stranger from the beacon turns toward you. He was in the foundry, and he knows your name.'),
  step('disposition','Decide what happens to the people held here','choice',0,-105,['stabilize-service-engine'],false,
   'The people the writ holds are still inside the works. Decide what becomes of them. Unbind opens the gate, Divert takes a few out under a hood, and License hands their road to another overseer. Read each one before you confirm.'),
  step('verify-route','Check the gate and the road it leaves','interact',-12,-95,['disposition'],false,
   'The gate’s fitting shows what you chose: an open handle, a hooded marker or paired seals. Check it at the plate, then return to Istra to close the road.')
 ],
 choices:[
  {id:'unbind',name:'Unbind · open the gate for everyone held here',
   text:'Cut the writ that holds them and open the gate. They walk out owing nothing. Neris’s record stays whole, and the works keep their name. This frees the people held here. It does not dismantle the regent’s other works.',
   consequence:'The gate shows an open release handle. Istra, Tovan and Neris recognize what you did. The choice is kept for good, and the regent will remember it.'},
  {id:'divert',name:'Divert · take a few out under a hood',
   text:'Lead a few out under a hooded marker and leave the writ over the rest. The few walk free. The others stay where they are, and you will know exactly who they are. Neris stays safe and her record stays whole.',
   consequence:'The gate shows a hooded marker and the writ still standing. Istra, Tovan and Neris recognize the choice. It is kept for good, and no hidden road opens behind it.'},
  {id:'license',name:'License · hand their road to another overseer',
   text:'Give the held people’s road to a rival office under a named concession. Paired seals go on the gate, and the other writs stay where they are. Neris stays safe and her record stays whole. It is mercy on paper, and everyone knows whose paper it is.',
   consequence:'The gate shows paired seals and the licensing writ. Istra, Tovan and Neris recognize the concession and what it leaves in place. It is kept for good. The other offices keep their hold.'}
 ],
 enemy:{id:'hell-foundry-warden-v1',name:'Veyr, the foundry’s warden',kind:'sentinel',x:0,z:-99,hp:(G.RealmDifficulty?.boss?.('foundryWarden')?.hp??2080),damage:(G.RealmDifficulty?.boss?.('foundryWarden')?.damage??32),radius:.65,spawnAfter:['challenge-veyr'],defeatStep:'warden-resolved'}
});
const api=freeze({definition,patterns});
G.RealmHellCampaignData=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
