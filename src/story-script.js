/* Firstlight's story script: every main-path scene's dialogue as data. Scenes are keyed `<beat>.<scene>` in story
 * order. A line is {speaker, text, when?}; a choice option is {id, label, sets, when?}. `when` is small data over the
 * branch facts in FACTS (docs/1.0/BRANCHES.md defines every one); `sets` names the saved field an option writes.
 * Pure: scene(id, state) reads a world (or a plain facts object) and returns the lines that hold. It writes nothing. */
(function(G){'use strict';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const own=Object.hasOwn;
const CAST=freeze({
 narrator:{name:''},
 oren:{name:'Oren'},mara:{name:'Mara'},ilan:{name:'Ilan'},briar:{name:'Briar'},fenna:{name:'Fenna'},
 envoy:{name:'The envoy'},stranger:{name:'A smiling stranger'},regent:{name:'The Regent of Ash'},
 tessa:{name:'Tessa'},rowan:{name:'Rowan'},
 istra:{name:'Istra'},neris:{name:'Neris'},tovan:{name:'Tovan'},veyr:{name:'Veyr'},
 rielle:{name:'Rielle'},calen:{name:'Calen'},yselle:{name:'Yselle'},courier:{name:'The bell courier'},
 sahra:{name:'Sahra'},ilyra:{name:'Ilyra'},damar:{name:'Damar'},witness:{name:'The drowned witness'},
 anik:{name:'Anik'},avar:{name:'Avar'},vessa:{name:'Vessa'}
});
// Branch facts and every value each can take. The first value is the one a fresh story starts with.
const FACTS=freeze({
 bonded:[true,false],
 cinder:[null,'accepted','sealed','renounced'],
 tessa:[null,'refused','hers','signed'],
 device:[null,'open','sealed','carried'],
 hell:[null,'unbind','divert','license'],
 heaven:[null,'accessible-assist','broadened-activation'],
 sea:[null,'publish','limited','license'],
 stars:[null,'public-record','bounded-account'],
 heardBeacon:[false,true],heardFoundry:[false,true],heardConfluence:[false,true],
 falseFirst:[false,true],
 offer:[null,'refused','taken'],
 ending:[null,'open','kept','answered']
});
// Counted facts and the facts they are counted from.
const DERIVED=freeze({
 heard:['heardBeacon','heardFoundry','heardConfluence'],
 chains:['cinder','tessa','device','hell','sea','falseFirst'],
 freed:['cinder','tessa','device','hell','heaven','sea','stars']
});
const SETS=freeze(['adventure.beacon.relic','saga.choices.tessa','saga.choices.device','saga.heard.beacon','saga.heard.foundry','saga.heard.confluence','saga.briar.falseTrusted','hellCampaign.choice','heavenCampaign.choice','atlantisCampaign.choice','cosmosCampaign.choice','earthHomecoming.finale.offer','saga.finale.ending']);
const l=(speaker,text,when)=>when?{speaker,text,when}:{speaker,text};
const n=(text,when)=>l('narrator',text,when);
const o=(id,label,sets,when)=>when?{id,label,sets,when}:{id,label,sets};
const FREE=['open','answered',null],REFUSED=['refused',null];
const SCENES=freeze({
 // ---- Act I · the valley ----
 'kit.workshop':{beat:'kit',where:'Oren’s workshop',lines:[
  l('oren','There you are. Blade, lantern, three tonics. The blade’s sharper than it looks and the lantern’s duller, so that evens out.'),
  l('oren','Something’s been at the supplies on the riverbank. Old Bristle, most likely. He isn’t clever, but he’s committed.'),
  l('oren','Bring back what you can. And bring back yourself. I can remake the rest.')]},
 'hart.descent':{beat:'hart',where:'The rootbound underways',lines:[
  l('mara','I’ve been meaning to map this stair for nine years. Mind every seventh step. Somebody cut a mark there.'),
  n('The mark is a small road with both ends open. It is on every seventh step, all the way down, older than the wood above it.'),
  l('mara','I don’t know what it means. That’s a real answer. Write it down.')]},
 'hart.briar':{beat:'hart',where:'The western alcove',lines:[
  n('A fox, in the alcove, with a skitter’s barb through her hind leg. She does not growl. She watches your hands.'),
  n('You use the salve Oren packed. She lets you. That is the whole negotiation.'),
  n('When you leave, she comes along. Not at heel. A little wide, a little ahead, stopping to disapprove of things.')]},
 'hart.fallen':{beat:'hart',where:'The Hollow Hart’s hall',lines:[
  n('The Hollow Hart folds onto its knees like something finally allowed to. Where its heart should be there is only the stair mark: a road, both ends open.'),
  n('On the dais behind it lies a white feather as long as your forearm. It is warm.'),
  n('{briar} sniffs it once and sneezes.',{bonded:true})]},
 'hart.home':{beat:'hart',where:'Oren’s workshop',lines:[
  l('oren','That’s a fox.',{bonded:true}),
  l('oren','That’s a fox in my workshop, holding my glove.',{bonded:true}),
  l('ilan','She’s got taste. That’s your good glove.',{bonded:true}),
  l('mara','A briarfox. They don’t follow people. I’d like it noted that I’m surprised.',{bonded:true}),
  l('oren','She’ll want a bowl. I’ll find something that isn’t a paint tin.',{bonded:true}),
  l('oren','You went down a stair nobody’s finished mapping and came back with a feather. Sit. Eat. Then tell it in order.',{bonded:false})]},
 'envoy.arrival':{beat:'envoy',where:'The spring',lines:[
  n('Someone is standing in the spring without disturbing it. Bone white and gold, wings folded like a closed book.'),
  n('{briar} goes straight to her, which {briar} does not do.',{bonded:true}),
  l('envoy','I was told I would find a fortress. An army. Someone prepared. Instead, I found someone who knows how to begin.'),
  l('envoy','Forgive me. I have delivered this message many times, and I have never before had to revise the opening.'),
  l('envoy','Heaven is under attack. Hell is breaking the passages between our worlds, and this land lies along their path. The anchor beneath your forest has answered you.')]},
 'envoy.prophecy':{beat:'envoy',where:'The spring',lines:[
  l('envoy','There is a saying older than my office. I was taught it as a comfort. I have begun to suspect it is an instruction.'),
  l('envoy','The first light will not descend from heaven. It will rise from below.'),
  l('envoy','I do not yet know what it is asking. I know that it was not asking me.')]},
 'feather.sight':{beat:'feather',where:'The spring',lines:[
  l('envoy','Hold the feather up. Not like a torch. Like a question.'),
  n('The valley goes quiet and pale, and the roads light. The path to the workshop is gold. The lane to the little stage is gold.'),
  n('The track {briar} has worn to the door of the shared house is gold too, and thin as a hair.',{bonded:true}),
  l('envoy','A true road lets go at both ends. You may leave it, and you may come back. Remember what that looks like.'),
  l('envoy','There is another kind. It burns the red of a coal under ash. Your valley has none. The world beyond it has more every season.')]},
 'feather.gift':{beat:'feather',where:'The spring',lines:[
  l('envoy','Do not abandon what you have made here. It is why the journey matters. Others will bear this light as well.'),
  l('envoy','Choose a gift, and when the road is ready, we will walk it together.')]},
 // ---- Act II · the road ----
 'road.gate':{beat:'road',where:'The far-water lookout',lines:[
  n('The Sunward Road starts at the lookout and does not slow down for anyone.'),
  n('{briar} stops at the stone bridge. All four feet. She looks at the water, then at you, as if the bridge were your idea.',{bonded:true}),
  n('It is the one place she will not go ahead. You cross first. She follows low and fast, not looking down, and shakes herself on the far side as though she had swum it.',{bonded:true})]},
 'road.tessa':{beat:'road',where:'Tessa’s caravan',lines:[
  l('tessa','If you’re bandits, I should tell you the cart’s broken, the stock’s wet and I’m in a mood.'),
  l('tessa','Not bandits. Good. Then you’re either help or audience, and I don’t charge for either.'),
  l('tessa','Latch sheared clean off. I’ve buried two drivers on this road. Good ones. You’d think it would at least leave the carts alone.')]},
 'road.mended':{beat:'road',where:'Tessa’s caravan',lines:[
  l('tessa','It holds. Look at that. I’m going to overcharge you on principle and then give it all back.'),
  l('tessa','The beacon on the ridge has been dark since my mother drove this road. Something with horns keeps the way up.')]},
 'road.spot':{beat:'road',where:'The valley',lines:[
  n('{briar} is already at {habit} when you get there, lying down, put upon, as if you were late. This is her spot now. Nobody was consulted.')]},
 'road.ram':{beat:'road',where:'The ridge road',lines:[
  n('The Sunscar Ram goes down across the road it guarded. Up close it is all scar and no malice. Something kept it angry for a very long time.'),
  l('tessa','I’ve paid tolls to worse. Go on up. I’ll bring the cart round.')]},
 'beacon.stranger':{beat:'beacon',where:'The Sunward Beacon',lines:[
  l('tessa','Stand with us a moment. This gentleman came up the east spur and says he can help me with the road.'),
  n('He is tall and grey-coated, somewhere past forty and in no hurry. He has already done her sums, and he is sorry about them.'),
  l('stranger','Good evening. Two drivers on the high road, one cart on the low, and a beacon that wants a hero every generation. I can offer something duller.'),
  l('stranger','A road that never breaks. Nothing lost on it, ever. I keep the road, and you keep your people. One signature.'),
  l('tessa','And what does it cost?'),
  l('stranger','Nothing you would miss.')],
  choice:{id:'listen-beacon',prompt:'He looks at you, pleasantly, waiting to see if he may go on.',options:[
   o('hear','Let him finish',{'saga.heard.beacon':true}),
   o('cut','That is enough',{'saga.heard.beacon':false})]}},
 'beacon.stranger.answer':{beat:'beacon',where:'The Sunward Beacon',lines:[
  l('stranger','I kept a crossing once. Smaller than this. I know what it is to count heads at dusk and come up short.',{heardBeacon:true}),
  l('stranger','I do not come up short anymore. That is all I am selling.',{heardBeacon:true}),
  l('stranger','Of course. You have had a long climb, and I am told I go on.',{heardBeacon:false}),
  n('He does not stop smiling. He does write something down.',{heardBeacon:false}),
  n('You raise the feather. The east spur he came up is the red of a coal under ash, all the way down the ridge.'),
  l('tessa','You’ve known me for one cart repair. Tell me anyway. Would you sign?')],
  choice:{id:'tessa',prompt:'Tessa is holding the waybill. It is grey, and beautifully written.',options:[
   o('refused','I would tear it up',{'saga.choices.tessa':'refused'}),
   o('hers','It is your road. You decide',{'saga.choices.tessa':'hers'}),
   o('signed','I would sign. You have buried enough',{'saga.choices.tessa':'signed'})]}},
 'beacon.tessa':{beat:'beacon',where:'The Sunward Beacon',lines:[
  l('tessa','Hm. That’s what my gut said. My gut has never met a payroll.',{tessa:'refused'}),
  n('She looks at the paper a while longer. Then she tears it in half herself and hands him both pieces. He thanks her, and pockets them.',{tessa:'refused'}),
  l('tessa','That’s an annoying answer.',{tessa:'hers'}),
  l('tessa','It’s also the first time tonight anyone’s asked me instead of told me. I’m keeping the paper. I’m not signing it. Yet.',{tessa:'hers'}),
  l('tessa','Two drivers. You’re right. I’m tired of being brave about it.',{tessa:'signed'}),
  n('She signs. The ink dries grey. He folds the paper as if it were alive.',{tessa:'signed'}),
  l('stranger','Light your beacon. When the herald falls it will leave you a small warm thing. Keep it. It is yours, and nothing is owed.'),
  n('When you look again there is only the spur, and on the spur, no footprints.')]},
 'beacon.door':{beat:'beacon',where:'The Sunward Beacon',lines:[
  n('The fire takes. The light does not go out across the hills. It goes up.'),
  l('mara','It isn’t a lighthouse. It never was. It’s a door.'),
  l('envoy','And you have just knocked. They will have heard it below as well. Hold the ward. I will hold the door.'),
  l('oren','I can mend the ward as fast as they crack it. Probably. Ilan, play something with a pulse.'),
  l('ilan','I only write slow songs.'),
  l('oren','Then play one fast.'),
  n('{briar} has Oren’s other glove. Nobody saw her take it. He mends the ward one-handed and does not ask for it back.',{bonded:true})]},
 'beacon.herald':{beat:'beacon',where:'The Sunward Beacon',lines:[
  n('The Chainbound Herald comes apart link by link. The last link does not fall. It sits in the ash and glows, patient as a cat.'),
  n('It is the size of a plum and warm as a hand. It would hit like a falling tree. You can feel what it would take each time: a little, and gladly.'),
  l('mara','I can seal it in glass. I can’t promise it’ll stay bored in there.')],
  choice:{id:'cinder',prompt:'The herald’s cinder. The stranger said it was yours.',options:[
   o('accept','Keep the cinder',{'adventure.beacon.relic':'accepted'}),
   o('seal','Seal it away',{'adventure.beacon.relic':'sealed'})]}},
 'beacon.cinder':{beat:'beacon',where:'The Sunward Beacon',lines:[
  n('It settles in your pack against the tonics, warm through the leather.',{cinder:'accepted'}),
  n('{briar} moves to your other side, and stays there.',{cinder:'accepted',bonded:true}),
  l('mara','Good. It goes on my shelf, labelled, between the wasp nest and the thing I’m not sure is a fossil.',{cinder:'sealed'}),
  n('You set the cinder back on the cold beacon stone. It takes a long moment to let go of your hand. Then it is only a coal.',{cinder:'renounced'}),
  l('mara','You put it down. Do you know how rarely I get to observe that?',{cinder:'renounced'}),
  l('envoy','The door is open, and it is ours. Tell the spring. Then rest. Doors like this one do not stay unanswered.')]},
 'bellweather.rowan':{beat:'bellweather',where:'Bellweather square',lines:[
  l('rowan','The road is open. Now we need a voice to call the lost home.'),
  l('rowan','She’s not rung since before my grandfather kept her. I oil her anyway. You can keep a thing ready a long time on stubbornness.'),
  l('rowan','Something sits in the watch-bell court and likes the quiet. Find her clapper. We’ll see who’s louder.'),
  n('You raise the feather out of habit. A faint red road runs through the square to the bridge, old as the flagstones. Nobody here has ever not walked on it.'),
  l('rowan','And leave that coal outside my court. Bronze goes flat around it. So do people.',{cinder:'accepted'}),
  l('rowan','Mara says you jarred the coal. Good. Bring nothing into my court you wouldn’t ring in front of.',{cinder:'sealed'})]},
 'bellweather.clapper':{beat:'bellweather',where:'The old charcoal track',lines:[
  n('{briar} goes rigid, nose to the wind, then up the charcoal track without a backward look. By the time you catch up she is sitting on the place, waiting for you to be useful.',{bonded:true}),
  n('The clapper is under a root, wrapped in a child’s coat gone soft as moss.'),
  n('Nobody lost this. Somebody small hid it, a long time ago, so the bell could never call anyone again.')]},
 'bellweather.keeper':{beat:'bellweather',where:'The watch-bell court',lines:[
  n('The Hushbound Keeper does not fall so much as stop insisting. The quiet in the court thins out like breath on glass.'),
  n('Under where it stood, scratched into the flagstone by hand: short lines in rows of five. You count them twice. Forty-one.')]},
 'bellweather.bell':{beat:'bellweather',where:'The watch-bell court',lines:[
  n('{briar}’s ears go up a full breath before the first note, and stay up until the last one is gone.',{bonded:true}),
  n('Leaf, then Wave, then Sun. The third note goes out over the river and keeps going.'),
  l('rowan','There she is.'),
  l('rowan','Grandfather said the last keeper before us rang her once, in a flood, and never again. Nobody’d tell me why. I took it for a sad story. It usually is.'),
  l('rowan','I’ll hang a set of small ones at Oren’s shop. A workshop ought to know when the wind changes.')]},
 // ---- Act III · the night the warning failed ----
 'night.fall':{beat:'night',where:'Bellweather, at night',lines:[
  n('The sky over the crossing goes red all at once, like a lid coming down. The river is over the lower piles and still rising. Rowan is already at the rope.'),
  l('rowan','There’s folk on the far side and the water’s coming. I’m ringing them in.'),
  l('tessa','The sky went red all at once. Five of us are on this side, and the bridge is the only way over.'),
  n('You raise the feather. The old red road through the square is bright now, and moving, laying itself over the bridge plank by plank. The planks it has not reached are still gold.'),
  l('tessa','I’ve a second wagon out on his low road tonight, with Pell driving. It’s the only one I’m not worried about. I hate that.',{tessa:'signed'}),
  l('tessa','I had the pencil out, you know. When the sky went. I had his paper on my knee.',{tessa:'hers'}),
  l('tessa','My second wagon’s at the ford, on the honest road, in this. Don’t say anything.',{tessa:'refused'})]},
 'night.found':{beat:'night',where:'The bridge',lines:[
  n('{briar} is on the bridge before you can stop her. Alone, low and fast, not looking down. She has never crossed one ahead of you. Not once.',{bonded:true}),
  n('She stops over the middle of the span with her hackles up, standing on something, and will not come back.',{bonded:true}),
  l('tessa','There is something on the bridge. It was not there before dark.',{bonded:false})]},
 'night.across':{beat:'night',where:'The near bank',lines:[
  l('tessa','Five. That’s all five. Count them again for me, I like hearing it.'),
  l('tessa','And the old bridge held. This time. I felt it think about it.'),
  l('tessa','Pell’s still out on the low road. Sent word he’s fine, the road’s dry, and he’ll come in when he feels like it. He has never once felt like anything.',{tessa:'signed'}),
  l('tessa','The second wagon went in at the ford. Stock and all. Nobody on it, thank the bell. That’s the honest road for you.',{tessa:'refused'}),
  l('tessa','I’ve put the pencil away. For now. Ask me again when I’ve slept.',{tessa:'hers'}),
  l('rowan','Then I can stop ringing.'),
  n('He does. In the quiet after the bell you can hear what she is standing on. It is ticking.',{bonded:true}),
  n('He does. In the quiet after the bell you can hear something out on the bridge, ticking.',{bonded:false})]},
 'night.bridge':{beat:'night',where:'The bridge',lines:[
  n('It is bolted to the middle of the span: iron, ember-seamed, the size of a millstone. A road has two ends. This is a thing for tying one of them shut.'),
  n('{briar} looks at you once, the way she does when she has decided where you are both going.',{bonded:true}),
  n('She bites through the ember seam. The device stops. The red goes out of the bridge like water out of a cloth, and it takes her with it.',{bonded:true}),
  n('There is no sound. There is a place on the planks the shape of a fox, and then there is not.',{bonded:true}),
  n('It comes apart in your hands, hot and then cold. The red goes out of the bridge like water out of a cloth.',{bonded:false}),
  l('tessa','It is quiet now. I do not like how quiet it is.',{bonded:false})]},
 'night.receipt':{beat:'night',where:'The bridge',lines:[
  n('Where the device was bolted, the ash has settled into neat lines. It is handwriting.'),
  n('Received in good order: one fox, answering to {briar}. Kept safe. Nothing owed.',{bonded:true}),
  n('Five travellers, not received. A pity. They would have been kept safe.',{bonded:false})]},
 'night.envoy':{beat:'night',where:'The spring',lines:[
  l('envoy','You brought them across. I watched it from the spring, and I could not step onto the road to help you.'),
  l('envoy','I came to tell you what was on that bridge. I reached the spring as the sky turned. I was late. I would rather you heard that from me.'),
  l('envoy','I did not come here to make a bargain, and I will not make one tonight.'),
  l('envoy','There is no task you must finish before I help. There is no price. I am saying it slowly because someone else will say the opposite, very kindly.',{bonded:true}),
  l('envoy','I will help you find her. A road goes somewhere. That is all a road is. We will find where.',{bonded:true}),
  l('envoy','His roads are not grown. They are stamped, yard by yard, from one pattern, in a foundry under the world. The pattern was never his. Take it back, and we can read where his roads go.'),
  l('envoy','I cannot walk you down. Hell does not open to my kind without a war. Go as what you are: someone who mends things. It is the one disguise they have never learned to see through.'),
  l('envoy','Not tonight. Go home. Her bowl is still beside the door, and the valley should see you walk in.',{bonded:true}),
  l('envoy','The road will try again. Keep the people you saved close. Not tonight. Go home. The valley should see you walk in.',{bonded:false})]},
 'night.quiet':{beat:'night',where:'The shared house',lines:[
  n('Her bowl is beside the door. Someone has filled it.',{bonded:true}),
  l('oren','I made her a second one. For the workshop. Pear wood. I hadn’t told you yet.',{bonded:true}),
  n('He stands there holding it. He does not seem to know where to put it down.',{bonded:true}),
  l('mara','I don’t know where she is. I’ve three theories and they’re all bad. I’m not going to tell you it’ll be all right. I’m going to find out.',{bonded:true}),
  l('ilan','I tried to play something. There’s nothing in the guitar. I checked.',{bonded:true}),
  l('fenna','I heard. I brought bread.',{bonded:true}),
  l('oren','All five across. You did that. Sit down before you fall down.',{bonded:false}),
  l('mara','A road that closes behind people. I’ve three theories and they’re all bad.',{bonded:false})]},
 'night.device':{beat:'night',where:'The bridge, in the morning',lines:[
  n('In daylight the device is only iron. Cracked through, cold, heavier than it should be.'),
  n('There are tooth marks in the seam.',{bonded:true}),
  l('rowan','Hang it under the bell. Let everyone who crosses see what was on their bridge.'),
  l('mara','Or give it to me. Two locks, in the observatory. I want to know how it works before the next one turns up.'),
  n('Or neither. It took her. Some part of you wants to know where it is at all times.',{bonded:true}),
  n('Or neither. Some part of you wants to know where it is at all times.',{bonded:false})],
  choice:{id:'device',prompt:'The quiet engine. It is yours to place.',options:[
   o('open','Hang it under the bell, in the open',{'saga.choices.device':'open'}),
   o('sealed','Lock it in the observatory',{'saga.choices.device':'sealed'}),
   o('carried','Carry it yourself',{'saga.choices.device':'carried'})]}},
 'night.device.after':{beat:'night',where:'The bridge, in the morning',lines:[
  l('rowan','Then it hangs under her. Every time she rings, it’ll hear what it failed to stop.',{device:'open'}),
  l('mara','Two locks. I keep one key and Oren the other. That’s not distrust. That’s method.',{device:'sealed'}),
  n('It goes into your pack. It weighs about what a fox weighs.',{device:'carried'}),
  l('mara','I won’t argue. I’ll check on you.',{device:'carried'}),
  l('rowan','I rang her and they came to the sound, the way they’re meant to. Straight to the bridge. I keep turning that over.')]},
 // ---- Act IV · the stolen pattern: Hell ----
 'hell.arrival':{beat:'hell',where:'The Kiln Refuge',lines:[
  n('Hell is not on fire. It is at work. Chimneys, shift whistles, and roads so straight and smooth they look poured.'),
  l('istra','You’re the one from the valley. Sit, before you fall. Nobody gets here rested.'),
  l('istra','Your envoy told you Hell was breaking the roads, I expect. Hell’s a place. He’s a man. We’d like our name back.'),
  l('istra','The foundry stamps his road, a hundred yards a shift. Every yard’s held down by a name. A person’s own way home, signed over and hammered flat.'),
  l('istra','Nobody’s beaten. Write that down, it’s true. They’re fed, they’re warm, and they can’t leave. Veyr holds the gate for the landlords. Neris kept the books till she couldn’t. Start with her.'),
  l('istra','And keep that coal covered. Half the yard would follow it like a lamp.',{cinder:'accepted'})]},
 'hell.neris':{beat:'hell',where:'The Kiln Refuge',lines:[
  l('neris','Keep the measurements as they are, including the ones I once helped conceal.'),
  l('neris','I was good at it. I want that written down as well. I could make a missing person look like a rounding error.'),
  l('neris','Four hundred and twelve names hold the road between here and your hill country. Every one of them signed. Most of them thanked him.'),
  l('neris','One of the newest is a carter. Tessa. The ink on hers is still grey.',{tessa:'signed'}),
  l('neris','A carter’s name was pencilled at the foot of the last page and struck out. Tessa. Somebody tore that one up.',{tessa:['refused','hers']}),
  l('neris','I logged eleven severing engines out of that yard. One went to a bridge in the hill country. I did not ask what for.'),
  l('neris','You have it in your pack. I can hear it. They tick a little, even broken. That one was mine. I am sorry.',{device:'carried'}),
  l('neris','They say you hung it under a bell. I would like to see that before I die.',{device:'open'}),
  l('neris','They say a scholar has it under two locks. Tell her the seam is the hinge. She will get there, but tell her.',{device:'sealed'})]},
 'hell.tovan':{beat:'hell',where:'The Tithe Mile',lines:[
  l('tovan','Knowing the rivets is useful. Leaving my own name out would make it a worse record.'),
  l('tovan','West counterweight sticks. East brace was mine. Fitted it badly on purpose, fourteen years back, then lost my nerve. Lean on it.')]},
 'hell.gate':{beat:'hell',where:'The foundry’s outer gate',lines:[
  n('Past the gate the stamps come down in rows, and every one prints the same small mark: a road with one end open and one end shut.'),
  n('You raise the feather. A thousand marks glow ash red. One, on the master die above the line, is gold under the soot.'),
  n('It is the mark from the stair under your forest. Someone has filed a single stroke of it closed.')]},
 'hell.veyr':{beat:'hell',where:'The yard',lines:[
  l('veyr','An escape is a restraint I have not finished.'),
  l('veyr','Everyone who came for the pattern left it in my yard. Come and try.'),
  l('veyr','You carry my herald’s last link. Then you are already on the payroll. Report to the line.',{cinder:'accepted'}),
  l('veyr','You put my herald’s last link in a jar. I have had worse wardens than a jar.',{cinder:'sealed'})]},
 'hell.veyr-down':{beat:'hell',where:'The yard',lines:[
  n('Veyr goes down still reaching for his book. The stamps falter, miss a beat, and stop.'),
  n('In the quiet, four hundred people look up from the line at the same time. None of them runs. Nobody has told them the door is a door.')]},
 'hell.pattern':{beat:'hell',where:'The master die',lines:[
  n('The master die comes free in your hands. It is not iron. It is a roadkeeper’s stamp, bone white under the soot, as old as the stair at home.'),
  n('Behind the works, someone has been waiting for the noise to stop.'),
  l('stranger','There you are. I hoped it would be you and not an army. Armies do not listen.'),
  l('stranger','I should say first: she is safe. Fed, warm, unhurt. She sleeps a great deal. I want you to have that before anything else.',{bonded:true}),
  l('stranger','She crossed my road, and my road kept her. That is all it does. It is all it has ever done.',{bonded:true}),
  l('stranger','I should say first: nobody on my roads was hurt that night. Nobody ever is. That is the whole of what I make.',{bonded:false})],
  choice:{id:'listen-foundry',prompt:'He knows your name. He has not said how.',options:[
   o('hear','Let him talk',{'saga.heard.foundry':true}),
   o('cut','I am not here to listen',{'saga.heard.foundry':false})]}},
 'hell.regent':{beat:'hell',where:'The master die',lines:[
  l('stranger','I kept a bell at a crossing. When the river rose, I rang it. That was the whole job. Ring, and they come to the bridge, and the bridge takes them over.',{heardFoundry:true}),
  l('stranger','They came. Forty-one of them, at a run, because they trusted my bell. The bridge was the thing that was failing.',{heardFoundry:true}),
  l('stranger','The warning did not fail because it came late. It worked. That is the part I could not carry.',{heardFoundry:true}),
  l('stranger','Someone down here offered me a road that keeps what crosses it. I have not lost a traveller since. Not one. Ask your envoy for Heaven’s number.',{heardFoundry:true}),
  l('stranger','You let me finish at the beacon as well. Nobody does that. I wrote it down.',{heardFoundry:true,heardBeacon:true}),
  n('While he talks, a clerk at the far desk slides a grey paper across to a woman with a child on her hip. She signs. The stamp comes down. One more.',{heardFoundry:true}),
  l('stranger','No. You are here for the die. Take it. It was never mine either.',{heardFoundry:false}),
  l('stranger','But you will hear it sometime. I would rather it came from me than from a wall.',{heardFoundry:false}),
  l('stranger','Now. Those people on the line. You will want to do something about them. Everyone does. I am curious which thing.'),
  n('He steps back among the stamps, and he is one more grey coat in a yard full of them.')]},
 'hell.choice':{beat:'hell',where:'The foundry gate',lines:[
  n('The gate, the writ, and four hundred and twelve names. Veyr’s book lies open on the anvil.',{heardFoundry:false}),
  n('The gate, the writ, four hundred and twelve names, and the one you stood and watched go on. Veyr’s book lies open on the anvil.',{heardFoundry:true}),
  l('istra','Cut the writ and they all walk. And his road from here to your valley goes dark under whoever’s standing on it tonight.'),
  l('neris','Or take out the forty I can vouch for, under a hood. Nobody is stranded. Nobody else is freed.'),
  l('tovan','Or sign the lot over to the Ninth Office. Shorter shifts, better bread. Road stays up, nobody’s stranded. They’d still be names on a road.')],
  choice:{id:'hell',prompt:'Decide what happens to the people held here.',options:[
   o('unbind','Cut the writ. Everyone walks',{'hellCampaign.choice':'unbind'}),
   o('divert','Take the forty out quietly',{'hellCampaign.choice':'divert'}),
   o('license','Sign them over to the Ninth Office',{'hellCampaign.choice':'license'})]}},
 'hell.after':{beat:'hell',where:'The foundry gate',lines:[
  n('The writ parts like wet paper. Everyone on the line stands very still. Then one of them laughs, and then the gate is not wide enough.',{hell:'unbind'}),
  l('istra','Gate’s open. Nobody on this road owes the writ a thing now.',{hell:'unbind'}),
  l('neris','The road is dark from here to the hill country. There are people on it tonight, in the open, wondering where it went. You did that as well. I would still have cut it.',{hell:'unbind'}),
  l('neris','The carter’s name went with the rest. She is nobody’s now. Her driver is standing on a hillside in the dark, asking the road what happened.',{hell:'unbind',tessa:'signed'}),
  n('Forty people go out under a grey hood, quick and quiet, and do not look back at the line. The line looks at them.',{hell:'divert'}),
  l('tovan','A few walked. Don’t call the rest a repair.',{hell:'divert'}),
  l('neris','I chose the forty. I have chosen who counts before. It felt exactly the same.',{hell:'divert'}),
  n('The Ninth Office sends a clerk with a softer voice and a newer book. The stamps start again before you reach the gate.',{hell:'license'}),
  l('istra','They’ll eat better. I’ll write that down, because it’s true. I’ll write down the rest as well.',{hell:'license'}),
  l('neris','It is mercy on paper. Everyone here can read whose paper.',{hell:'license'}),
  n('The die is warm in your pack. It wants reading, and nobody down here can read it.')]},
 // ---- Act IV · Heaven ----
 'heaven.arrival':{beat:'heaven',where:'The Garden of Voices',lines:[
  n('The road comes up into morning. Terraces the white of old bone, gold in the joints, a ruby set wherever two paths meet. Water somewhere. Bells, far off, in no hurry.'),
  n('Nobody stops you. Nobody asks what you are for. A gardener looks up, nods as if you were expected next week and are welcome early, and goes back to the beans.'),
  l('courier','You came up the long way. Sit. No, sit. The first hour here is for sitting. It is practically the law.'),
  l('yselle','These beds stay planted whatever happens at the walls. That isn’t hope. Somebody has to eat.'),
  n('{briar} would have hated the fountains and been into the beans by now. You keep looking for her at the edge of things.',{bonded:true})]},
 'heaven.garden':{beat:'heaven',where:'The Garden of Voices',lines:[
  l('rielle','A public instrument must answer someone with tired hands as readily as a practiced musician.'),
  l('rielle','You’re the one with the die. Later. Nobody reads anything properly before they’ve eaten.'),
  l('calen','There’s people at the garden gate. Four hundred, give or take, soot on all of them. Say someone cut a writ. They keep asking, very politely, if this is real.',{hell:'unbind'}),
  l('calen','Forty came up to the garden gate under a hood last night. They keep counting each other.',{hell:'divert'}),
  l('calen','Letter came up for you from below. Thanks, from an office. Rielle carried it in with two fingers.',{hell:'license'})]},
 'heaven.home':{beat:'heaven',where:'The house by the garden gate',lines:[
  l('envoy','You came up in peace, and that is the right way to come.'),
  n('The envoy’s house is two rooms. A table, one chair, and a second chair that has clearly just been carried in. A shelf of sealed letters, hundreds of them, each addressed in the same exact hand.'),
  l('envoy','Warnings. My copies of the ones that came too late. I keep them. I am told this is morbid.'),
  l('envoy','I have made tea. I understand mortals take it hot. I have never seen the appeal of waiting for a drink to stop hurting you.'),
  l('envoy','He told you to ask me for Heaven’s number. It is on that shelf. One letter each. I have never needed a book to remember it.',{heardFoundry:true}),
  l('envoy','You let him speak, in the foundry. Good. I did not, once. I read him my message, and I left.',{heardFoundry:true}),
  l('envoy','You did not let him speak, in the foundry. I understand. I did not either, once.',{heardFoundry:false}),
  l('envoy','You have brought his engine into my house. No, keep it by you. But notice how often your hand goes to it. He began with something he could not put down.',{device:'carried'}),
  l('envoy','Mara has written to me about her two locks. Four pages, with a diagram. I like her.',{device:'sealed'}),
  l('envoy','I can hear the bell at your crossing from here. It has a second sound under it now, like a cup with a crack. Rowan says that is the engine, listening.',{device:'open'})]},
 'heaven.reading':{beat:'heaven',where:'The house by the garden gate',lines:[
  l('rielle','It’s our own stamp. A roadkeeper’s die. A true road lets go at both ends, see, here and here. Someone’s filed one stroke shut.'),
  l('rielle','That’s all he changed. One stroke. Nine hundred years a bellwright and I couldn’t have done it so neatly.'),
  l('envoy','Then read the old saying with me again. I have been reading it wrong.'),
  l('envoy','I thought below meant your valley. Then I thought it meant the deep, and that we must go down and seize it.'),
  l('envoy','Rise from below: from the ones who were taken, not from the deep.'),
  l('envoy','It was never asking us to send a light down. It was telling us who would bring one up.')]},
 'heaven.turn':{beat:'heaven',where:'The Mirror Causeway',lines:[
  n('The far bells change. One note, then all of them, the way a choir changes key.'),
  l('calen','The rescue corridors. They’re answering to someone else. Everyone we sent out to bring people home is walking back in on his road.'),
  n('You raise the feather. The white causeway is ash red to the horizon.'),
  l('envoy','I told you Heaven was under attack. You pictured the walls. This is what it looks like here: every road still standing, and none of them ours.'),
  l('envoy','Those are my roads. I walk those. I cannot set foot on one of them now. You can.')]},
 'heaven.seraph':{beat:'heaven',where:'The Mirror Causeway',lines:[
  n('The relay seraph was never an angel. It is a mirror in the shape of one, and when it breaks the causeway goes white again, one flagstone at a time.'),
  l('courier','I was on that road. I could feel it deciding to keep me. It was not cruel about it. I was tired, and it was so even underfoot.')]},
 'heaven.choice':{beat:'heaven',where:'The garden gate',lines:[
  n('The garden gate opens to a three-note ceremony most of Heaven learned as children. The relay knew it too.'),
  l('calen','Keep the ceremony and put a keeper on a request plate. Anyone who doesn’t know the notes asks, and a person answers. Slower. Nobody walks in wearing someone else’s face.'),
  l('rielle','Or a broad plate anyone can press. No asking. Tired hands, strange hands, soot on them or not. It’ll let the next counterfeit in as easily as the next child.'),
  l('yselle','Four hundred people are standing at that gate right now, and not one of them knows three notes.',{hell:'unbind'}),
  l('envoy','I will not advise you. I once lost a morning at a gate very like this one, over a point of ceremony. I am not impartial.')],
  choice:{id:'heaven',prompt:'Choose how the garden welcomes visitors.',options:[
   o('accessible-assist','Keep the ceremony. A keeper answers those who ask',{'heavenCampaign.choice':'accessible-assist'}),
   o('broadened-activation','A broad plate. Anyone may press',{'heavenCampaign.choice':'broadened-activation'})]}},
 'heaven.after':{beat:'heaven',where:'The garden gate',lines:[
  l('calen','I’ll take first watch on the plate. If I’m going to make people ask, I can at least be the one who has to look at them.',{heaven:'accessible-assist'}),
  n('It takes Calen until dusk to bring the four hundred through, one question at a time. Nobody complains. Several of them cry at being asked their names.',{heaven:'accessible-assist',hell:'unbind'}),
  l('rielle','There. A gate with no opinion. I’ve built finer things. I haven’t built many better.',{heaven:'broadened-activation'}),
  n('The four hundred come through in a quarter of an hour, like a held breath let go. Somebody’s child presses the plate a dozen more times to hear it.',{heaven:'broadened-activation',hell:'unbind'}),
  l('envoy','The die was taken from a harbour that is under the sea now. Someone there wrote down the night it happened. And past the stars there is a place where all his roads are tied to one knot.'),
  l('envoy','Take them in either order. I am coming with you as far as the water. I should have gone to that harbour a long time ago.')]},
 // ---- Act IV · the drowned witness: the sea and the stars, in either order ----
 'witness.harbour':{beat:'witness',where:'Bellglass',lines:[
  n('Bellglass was a harbour before the sea came in over it. Now it keeps its air in domes, and its records in the one room the water was never allowed.'),
  l('sahra','Mind the depth marks. The old one keeps its place and the new one says what’s safe today.'),
  l('damar','Sixteen days I have waited in this bay, with a load addressed to two places. One address is false. I should like to know which.'),
  l('ilyra','Two receipts, one hand. The office calls the second a correction. A correction doesn’t usually come with a different road attached.'),
  l('damar','Half the carriers in this bay were on his low roads when they went dark. They walked in on foot, furious, and free. I have never heard such complaining.',{hell:'unbind'}),
  l('damar','The courier says the garden gate asks your name now. Good. I like to be asked.',{heaven:'accessible-assist'}),
  l('damar','The courier says the garden gate simply opens now. Good. I have had my fill of counters.',{heaven:'broadened-activation'})]},
 'witness.guardian':{beat:'witness',where:'The drowned witness’s record',lines:[
  n('The Drowned Witness Guardian goes still with its lamps on. It was never guarding the harbour from you. It was guarding one shelf from the sea.')]},
 'witness.record':{beat:'witness',where:'The drowned witness’s record',lines:[
  n('The record is a keeper’s daybook, sealed in bell glass. The last entry is the harbour’s own roadkeeper, writing fast.'),
  l('witness','A man came to us from the hill crossings, half drowned, asking to see the die. We knew him. A bell keeper, and a good one. We let him in as a friend.'),
  l('witness','He said his bridge had taken forty-one who came to his bell. He said the warning from above reached him the morning after.'),
  l('witness','He sat with the die all night. In the morning it was gone, and so was he. He left his list on our table: forty-one names. I am writing his beside them so that it is somewhere. Hollis Wick, keeper at Bellweather.'),
  n('The envoy has read ahead of you. She is standing very straight.'),
  l('envoy','I was the warning.'),
  l('envoy','They sent me to Bellweather with word of the river. I was held at a gate over a point of ceremony. I arrived the morning after, to a bell rope tied off and a man who would not look at me.'),
  l('envoy','I read him the message anyway. All of it. That was the office. I have known who he is since the beacon, and I did not tell you. I am telling you now.'),
  l('envoy','He told you he could not carry that it worked. I could not carry that I was late. We have each built a great deal on one sentence, he and I.',{heardFoundry:true})]},
 'witness.choice':{beat:'witness',where:'The drowned witness’s record',lines:[
  l('ilyra','It’s your find. Post it on the harbour wall, and by the next tide every dome knows his name and the forty-one. A copy goes up the river road to their bell.'),
  l('sahra','Or it’s kept for the ones who need it. Three readers, a signed book. A name’s a heavy thing to nail up, even his.'),
  l('damar','The office has a third proposal. A permit for you, under his mark. His roads would open to you. All of them. Including, I should think, the one your fox is on.',{bonded:true}),
  l('damar','The office has a third proposal. A permit for you, under his mark. His roads would open to you. All of them, and no questions at any gate.',{bonded:false})],
  choice:{id:'sea',prompt:'Choose what becomes of the record.',options:[
   o('publish','Post it on the harbour wall',{'atlantisCampaign.choice':'publish'}),
   o('limited','Keep it for those who need it',{'atlantisCampaign.choice':'limited'}),
   o('license','Take the permit',{'atlantisCampaign.choice':'license'})]}},
 'witness.sea.after':{beat:'witness',where:'Bellglass',lines:[
  l('damar','My account and his, on the same wall. He will hate that. So should I, in his place. Leave it up.',{sea:'publish'}),
  l('ilyra','Under a hooded seal, then. Three readers and a signed book. If that sounds like his way of doing things, well. We’ll watch ourselves.',{sea:'limited'}),
  n('The permit is grey and beautifully written. Your name looks at home on it.',{sea:'license'}),
  l('damar','I will not tell you it was wrong. I will stand a little further off.',{sea:'license'}),
  l('envoy','I will wait for you at your own shore. I have somewhere to be on time.')]},
 'witness.stars':{beat:'witness',where:'The near expanse',lines:[
  n('Past the last lamp the sky has a floor. Glass plains, slow lights, and over all of it one great still wheel that everything else keeps time to.'),
  l('anik','Somebody kept the lamps lit. That was me. I only say so because nobody else will.'),
  l('anik','Avar built the wheel. One setting, every branch, all in step. It stopped the shaking. It also starves the garden branch on the hour, every hour, so the rest can run smooth.'),
  l('avar','It was the only arrangement in which nothing fell. I checked. I am still right about that.'),
  n('Across the gap where the branches meet, a man in a grey coat sits with a book on his knee. He raises one hand, the way you would to a neighbour.')]},
 'witness.meridian':{beat:'witness',where:'The Still Meridian court',lines:[
  n('The Still Meridian stops. For one breath nothing keeps time at all, and every branch of the sky begins to drift.'),
  l('anik','Now it’s on the anchors you set. You’re standing at one. Raven’s at the other, round the curve. Don’t go and check hers. You’ll want to. Don’t.'),
  n('You hold your anchor and cannot see hers. The whole sky is a few people not letting go, each trusting someone they cannot check.'),
  n('It holds. It shakes, which it never did under the wheel, and it holds.'),
  l('avar','It is worse. It wobbles. Any one of you could be tired, or late, or wrong.'),
  l('avar','And no one of you can starve the garden. Yes. I see it. Allow me a moment to resent it.')]},
 'witness.avar':{beat:'witness',where:'The Still Meridian court',lines:[
  l('anik','The marks go up in public either way. What the wheel cost, and who paid. That isn’t in question.'),
  l('anik','The question’s him. He wants to add a few words of his own. Some here would rather the marks stood without his voice in them.')],
  choice:{id:'stars',prompt:'Decide how the wheel is remembered.',options:[
   o('public-record','Let the marks speak',{'cosmosCampaign.choice':'public-record'}),
   o('bounded-account','Let Avar say his piece',{'cosmosCampaign.choice':'bounded-account'})]}},
 'witness.stars.after':{beat:'witness',where:'The Still Meridian court',lines:[
  n('The marks go up beside the stopped wheel, where anyone crossing the plain can read them.'),
  l('anik','Then the marks speak. He can read them along with everyone else.',{stars:'public-record'}),
  l('avar','That is fair. I would have preferred kind. I see that was the trouble.',{stars:'public-record'}),
  l('avar','I held the only key, and I told myself that was the same as holding everyone up. It was not. That is all of it. I had a longer one.',{stars:'bounded-account'}),
  l('anik','Put it beside the marks. Not over them.',{stars:'bounded-account'})]},
 'witness.confluence':{beat:'witness',where:'The Open Confluence',lines:[
  n('Where the branches meet, the roads show their undersides. Every ash red line in every world runs to one knot. He is sitting beside it.'),
  l('regent','Below, they call me Regent. It only means the one who minds a thing until its owner comes back. Nobody has come back.'),
  l('regent','And Ash is what is left when the fire has finished taking. It cannot be burned twice. I chose that part myself.'),
  l('regent','A hundred keepers. A hundred keys. Every one of them a person who can be tired, or late, or wrong. I was one of those. You are building a world out of my worst night, and calling it a cure.'),
  l('regent','There is a daybook under the sea with my name in it. Read it before you decide what I am.',{sea:null}),
  l('regent','My name is on a harbour wall. I kept that quiet for a very long time. You have no idea how strange it is to be called anything.',{sea:'publish'}),
  l('regent','You know my name, and you put it under seal. That is very nearly my kind of care.',{sea:'limited'}),
  l('regent','You carry my permit. I did not think you would. I am not gloating. I am noting it.',{sea:'license'}),
  l('regent','You took Avar’s key, and then you gave him a hearing. I notice I have not been offered one.',{stars:'bounded-account'}),
  l('regent','You nailed Avar’s sums to a wall and never asked him why. Efficient. I would at least have kept him.',{stars:'public-record'})],
  choice:{id:'listen-confluence',prompt:'The Regent of Ash closes the book on one finger, to keep his place.',options:[
   o('hear','Then say it. I am listening',{'saga.heard.confluence':true}),
   o('cut','You have had your hearings',{'saga.heard.confluence':false})]}},
 'witness.regent':{beat:'witness',where:'The Open Confluence',lines:[
  l('regent','Then hear the whole of it. I do not want to own them. I want to stop counting. Every road I keep is one dusk where the number comes out right.',{heardConfluence:true}),
  l('regent','You will get her back, I think. You are that sort. And one day you will stand at a door and count, and come up short, and remember that I offered.',{heardConfluence:true,bonded:true}),
  l('regent','One day you will stand at a door and count, and come up short, and remember that I offered.',{heardConfluence:true,bonded:false}),
  n('He is not smiling. You have never seen his face at rest before. He looks like someone who has been holding a door for a hundred years.',{heard:{min:3}}),
  l('regent','No. Fair. I have had a great many, and all of them were with myself.',{heardConfluence:false}),
  l('regent','She is at the nearshore. The near side of my book, by your own lantern pier. Come and see how well she has been kept.',{bonded:true}),
  l('regent','I will come to your valley myself, after this. It loses too much. I think you know that now.',{bonded:false})]},
 'witness.trail':{beat:'witness',where:'The Open Confluence',lines:[
  l('anik','With the anchors held, the knot shows its threads. That thin one. Gold all the way down, and wrapped in grey.'),
  l('anik','It ends at a pier with lanterns on it. Yours? Then go. We can hold this without you. That’s rather the point.',{sea:['publish','limited','license']}),
  l('anik','It runs under the sea first. There’s a harbour down there that keeps its records dry. Read what it kept. Then follow this home.',{sea:null})]},
 // ---- Act IV · the nearshore ----
 'nearshore.pier':{beat:'nearshore',where:'The lantern pier',lines:[
  l('vessa','Every lantern on the pier’s lit. If she’s out there, she’ll see which way is home. That’s all a lantern is for.'),
  l('vessa','And when he tells you she’s his: a bridge belongs to its crossings, not to whoever can hold a chain across it.'),
  l('envoy','I can tell a living soul from an echo. I cannot tell you which one is yours. Heaven does not know that. Only you do.'),
  n('His road opened for you all the way down the shore. Nobody stopped you. Nobody had to. The permit is warm in your pocket.',{sea:'license'})]},
 'nearshore.offer':{beat:'nearshore',where:'The nearshore',lines:[
  l('regent','I kept her for you. She never strays now.'),
  n('Two foxes stand on the boards. The same scar on the hind leg. The same torn ear. One comes to your left heel at once and sits, perfectly, looking up.'),
  n('The other one is looking past you.'),
  n('You raise the feather. Both of them are gold. He has learned.'),
  l('regent','The one at your heel will never cross a bridge without you. Never run ahead. Never be anywhere you cannot find her. I mended everything that got her taken.'),
  l('regent','The other is just as she was. She will leave you again one day. They do. I am only asking which of those you can live with.'),
  l('regent','Or use the engine in your pack and cut both roads. I would understand. It is what I would have done, once.',{device:'carried'}),
  l('regent','You came in on my permit. You are already a little bit kept. It suits you.',{sea:'license'}),
  l('regent','You have heard me out. So you know I mean it. I wish I did not.',{heard:{min:2}}),
  n('The second fox turns, unhurried, and trots off toward {habit}. She does not check whether you are following. She never did.')]},
 'nearshore.heel':{beat:'nearshore',where:'The nearshore',lines:[
  n('The fox at your heel has not moved. She is the right warmth. She is looking up at you with her whole attention, which the other one never once gave anybody.')],
  choice:{id:'heel',prompt:'The fox at your heel is waiting to be told.',options:[
   o('take','Take her home',{'saga.briar.falseTrusted':true}),
   o('wait','Not yet',{'saga.briar.falseTrusted':false})]}},
 'nearshore.false':{beat:'nearshore',where:'The nearshore',lines:[
  n('You put your hand on her. She leans exactly as hard as you would want.'),
  n('She does not steal your glove. She does not look at the water. You wait for her to do one wrong thing, and she does not, and she goes cold under your hand and comes apart like ash on water.'),
  l('regent','Ah. For a moment, though, you wanted mine. I will not hold it against you. I will only write it down.')]},
 'nearshore.real':{beat:'nearshore',where:'The nearshore',lines:[
  n('She is at {habit}, in her spot, facing the way you always come from. She lets you get all the way there before she bothers to stand.'),
  n('She sniffs your hand. She sneezes. Then she leans into your leg, harder than is comfortable. Back on the pier, Vessa laughs out loud, once.'),
  l('regent','You chose the one that leaves.'),
  l('regent','I will keep her place open. I always do.'),
  l('envoy','She is whole. I checked twice. I am permitted to be thorough.'),
  n('{briar} gives the ash on the boards one long look, and then you, and decides not to make a thing of it.',{falseFirst:true})]},
 'nearshore.plain':{beat:'nearshore',where:'The lantern pier',lines:[
  l('regent','Five travellers, a carter and a bell keeper. I had places ready for all of them. You brought every one across yourself, on a bridge that was thinking about it.'),
  l('regent','I am not angry. I am asking how many nights you think you can do that.'),
  l('envoy','As many as there are. That is the answer. It has always been the answer. It is only very tiring.')]},
 'nearshore.home':{beat:'nearshore',where:'The shared house',lines:[
  n('That evening she walks the whole house, room by room, as if taking an inventory. Then she goes to the door and lies down beside her bowl.'),
  l('oren','Two bowls, now. She can choose. I’m not going to pretend the pear wood isn’t better.'),
  l('ilan','I found the last song. It was under where I kept not looking. It’s got a rest in it now, about a fox long. I’m keeping the rest.'),
  n('{briar} steals Oren’s glove. Nobody stops her.')]},
 // ---- Act V · firstlight ----
 'finale.eve':{beat:'finale',where:'The shared house',lines:[
  l('mara','He’s coming here. The spring’s the junction. Every true road you’ve reopened runs through our duck pond.'),
  l('oren','Then we meet him at the pond. I’ve mended everything in this valley at least once. I know where it’s weak.'),
  l('fenna','Cart’s outside. Somebody’ll want carrying after.'),
  l('envoy','He will not come to burn it. He will come to keep it. Prepare for that. It is much harder to fight.')]},
 'finale.rise':{beat:'finale',where:'The spring junction',lines:[
  n('He is standing in the spring, and the spring has stopped. The book is under his arm. Behind him the roads of five worlds lie over your valley like ribs.'),
  l('regent','We have not really spoken. You saw to that. So I will let your own decisions do the talking. I wrote them down as you made them.',{heard:{max:0}}),
  l('regent','You listened to me, a little. More than most. So I will be fair, and use only your own decisions.',{heard:{min:1,max:2}}),
  l('regent','You heard all of it. Three times you let me finish. I want you to know I am sorry it is you.',{heard:{min:3}}),
  l('regent','This valley loses things. A cart. A song. A fox. I am going to keep it. You may stand in it with me, or you may stand in the way.'),
  l('regent','Look how many. You have been keeping roads my way all along.',{chains:{min:3}}),
  l('regent','One or two. Everyone has one or two. It is how I know we could have understood each other.',{chains:{min:1,max:2}}),
  l('regent','Nothing. Not one. Do you know how rare that is? Then I will hang my own on the spring.',{chains:{max:0}})]},
 'finale.chain.hell-divert':{beat:'finale',where:'the hell road',lines:[l('regent','In Hell you chose forty and left the writ on the rest. You chose who counts. I do that every dusk.')]},
 'finale.chain.hell-license':{beat:'finale',where:'the hell road',lines:[l('regent','You signed four hundred people over to a gentler office and called it mercy. It is. That is what I call mine.')]},
 'finale.chain.atlantis-license':{beat:'finale',where:'the drowned harbour',lines:[l('regent','You took my permit in the drowned harbour, and you used it. Your name sits very well beside my mark.')]},
 'finale.chain.beacon-cinder':{beat:'finale',where:'the Sunward Beacon',lines:[l('regent','You kept the herald’s cinder when it was offered. It felt good. It is meant to.')]},
 'finale.chain.tessa-signed':{beat:'finale',where:'the lookout road',lines:[
  l('regent','Tessa asked what you would do, and you sent her to me. She is on page ninety. It is a good page.',{hell:['divert','license',null]}),
  l('regent','Tessa asked what you would do, and you sent her to me. A clerk in Hell cut her loose. You did not.',{hell:'unbind'})]},
 'finale.chain.device-carried':{beat:'finale',where:'your own pack',lines:[l('regent','You carried my engine beside your tonics so you would always know where it was. That one I need not anchor. You brought it.')]},
 'finale.chain.nearshore-false':{beat:'finale',where:'the pier road',lines:[l('regent','And on the pier you told the quiet one to come home. You had to say it out loud. For one breath, you wanted her kept.')]},
 'finale.chain.earth-custody':{beat:'finale',where:'the Coastward bridge',lines:[l('regent','You sealed my engine in a box at the bridge. Just in case, you said.')]},
 'finale.chain.spring':{beat:'finale',where:'the spring',lines:[l('regent','You never once handed me a chain. So this one is mine, and it is the oldest I have.')]},
 'finale.allies':{beat:'finale',where:'The spring junction',lines:[
  n('There are people coming down every road into the valley. Soot on some. Salt on some. One of them is carrying a toolbag.'),
  l('envoy','From the ones who were taken. Look at them.')]},
 'finale.ally.hell-unbind':{beat:'finale',where:'the hell road',lines:[l('neris','Every name on that writ walked out owing nothing. I counted them through the gate. I am here to count one more.')]},
 'finale.ally.heaven-assist':{beat:'finale',where:'the heaven stair',lines:[l('rielle','The gate asks your name, and then it opens. Every time. Mind out, I’ve brought tools.')]},
 'finale.ally.heaven-broadened':{beat:'finale',where:'the heaven stair',lines:[l('rielle','The gate’s got no opinion about who you are. Neither have I. Where do you want me?')]},
 'finale.ally.atlantis-publish':{beat:'finale',where:'the drowned harbour',lines:[l('damar','It is on the wall, Hollis. My account and yours. You may stop keeping it.')]},
 'finale.ally.atlantis-limited':{beat:'finale',where:'the drowned harbour',lines:[l('damar','Three readers and a signed book, and none of the three is you. I walked here to say so.')]},
 'finale.ally.cosmos-public':{beat:'finale',where:'the star field',lines:[l('anik','The sky holds without a wheel. It wobbles. Come and see sometime.')]},
 'finale.ally.cosmos-bounded':{beat:'finale',where:'the star field',lines:[l('avar','I held a master key once. I know exactly where this arrangement is weak. It is weak where he is standing.')]},
 'finale.ally.beacon-sealed':{beat:'finale',where:'the Sunward Beacon',lines:[l('mara','It’s on my shelf between a wasp nest and a fossil. It’s never been so bored. I brought the jar, in case he wants to see.')]},
 'finale.ally.beacon-renounced':{beat:'finale',where:'the Sunward Beacon',lines:[l('mara','You put it down once. I watched you. I’ve been wanting to cite that.')]},
 'finale.ally.tessa-refused':{beat:'finale',where:'the lookout road',lines:[l('tessa','I asked, they answered, and I tore it up myself. Cost me a wagon. I’d do it again, and I kept the pieces to prove it.')]},
 'finale.ally.tessa-hers':{beat:'finale',where:'the lookout road',lines:[l('tessa','I read your terms. All of them. Took me a month. Nobody told me to. That’s the whole point of me.')]},
 'finale.ally.device-open':{beat:'finale',where:'the bell road',lines:[
  l('rowan','It hangs under my bell where the whole crossing can see it. Forty-one, Hollis. The list came up the river road. I’ve been ringing them by name.',{sea:'publish'}),
  l('rowan','It hangs under my bell where the whole crossing can see it. Forty-one, keeper. I’ve been ringing them one by one.',{sea:['limited','license',null]})]},
 'finale.ally.device-sealed':{beat:'finale',where:'the little observatory',lines:[l('oren','Two locks, two keys, and I’ve never once wanted to open it. That’s how you know it’s the right box. Now. Where’s it weak?')]},
 'finale.ally.earth-watch':{beat:'finale',where:'the Coastward bridge',lines:[l('vessa','The bridge is open both ways. Look.')]},
 'finale.runs':{beat:'finale',where:'The spring junction',lines:[
  n('The last chain parts. For the first time he looks at the valley as if it might not agree with him.'),
  n('He turns and walks, fast, and the valley folds to let him. A stair of bone white stone across the garden. An iron road through the beans. The sea standing up in the low field.'),
  l('envoy','Go. I will hold the spring.'),
  n('She steps down off the water onto the road. Onto the dirt. Her wings come open for the first time since you have known her. They are not for flying. They are for standing in the way.'),
  l('envoy','I have been late to a great many things. Not this.'),
  n('{briar} is already ahead of you, nose down, on a trail no feather can show.'),
  n('She looks back once, to be sure that you are following her and not something quieter.',{falseFirst:true})]},
 'finale.merged.stair':{beat:'finale',where:'the heaven stair',lines:[
  l('calen','Name? No. Thought not. This stair’s for people who can be asked.',{heaven:'accessible-assist'}),
  n('He takes the heaven stair three steps at a time. So do the people coming down it to help you.',{heaven:['broadened-activation',null]})]},
 'finale.merged.road':{beat:'finale',where:'The merged valley',lines:[
  l('tessa','Road’s closed. Company vote. It went five to one against and I lost, and here I am anyway.',{tessa:'hers'}),
  n('His own low road opens for you without being asked. The permit. You cut the corner he meant to lose you on, and you do not feel clever about it.',{sea:'license'}),
  l('regent','You could have kept all of this still.')]},
 'finale.merged.briar':{beat:'finale',where:'The merged valley',lines:[
  n('He doubles back along a road that is not there. {briar} is sitting on it when he arrives, put upon, as if he were late.')]},
 'finale.offer':{beat:'finale',where:'The spring junction',lines:[
  n('He is back at the spring, on one knee, the book open. The valley is every world at once, and all of it is shaking the way the sky shook when the wheel stopped. You get your breath. He lets you.'),
  l('regent','Enough. Look at it. Everything you love is in reach of everything that can hurt it. You did that. You opened every door.'),
  l('regent','So here is the last page I have. A life that cannot be hurt. Yours, the fox’s, everyone in this valley. One signature. I keep the road, and you keep your people.'),
  l('regent','It is what I offered Tessa. You told her what you would do. I am only asking you to take your own advice.',{tessa:'signed'}),
  l('regent','You told Tessa you would tear it up. It is easy to be brave with someone else’s paper. This one is yours.',{tessa:'refused'}),
  l('regent','You have reached for the kept one once already. On the pier. I am not asking you for anything new.',{falseFirst:true}),
  l('envoy','He is not lying. I checked. I wish I had not.')],
  choice:{id:'offer',prompt:'He holds out the pen. The page has your name at the top, in his hand.',options:[
   o('refuse','Refuse him',{'earthHomecoming.finale.offer':'refused'}),
   o('take','Sign',{'earthHomecoming.finale.offer':'taken'})]}},
 'finale.answer':{beat:'finale',where:'The spring junction',lines:[
  n('You shake your head. It costs more than you expected.',{offer:REFUSED}),
  l('regent','Then you will bleed for every yard. I want you to remember that I offered.',{offer:REFUSED}),
  n('{briar} leans against your leg. She is shaking too. She stays.',{offer:REFUSED}),
  n('You sign. The ink dries grey. The shaking stops. The wind stops. You can no longer feel the fox against your leg.',{offer:'taken'}),
  l('regent','There. Nothing can be taken from you now. Thank you. I mean that.',{offer:'taken'}),
  l('regent','You have been practising for this since the beacon.',{offer:'taken',chains:{min:2}}),
  l('regent','You, of all people. Well. Everyone has a night.',{offer:'taken',chains:{max:1}})]},
 'finale.last':{beat:'finale',where:'The spring junction',lines:[
  n('He is down. The book has fallen open at its first page. Forty-one names in a young man’s hand, and after them, a hundred years of everyone else.')],
  choice:{id:'ending',prompt:'The last blow is yours.',options:[
   o('open','End it',{'saga.finale.ending':'open'},{offer:REFUSED}),
   o('answered','Read him his first page',{'saga.finale.ending':'answered'},{offer:REFUSED,heard:{min:3}})]}},
 'finale.ending':{beat:'finale',where:'The spring junction',lines:[
  n('You bring it down on the book. The spine goes. Every page comes loose at once, and they do not fall. They rise.',{ending:['open',null]}),
  l('regent','They will get lost. All of them. You understand that. You are letting them get lost.',{ending:['open',null]}),
  n('Then the pages are roads, gold, letting go at both ends, and the Regent of Ash comes apart in the morning light like something finally allowed to.',{ending:['open',null]}),
  n('The view lifts. The spring, the workshop, the beans, the bridge, the pier. Every lamp you lit. It is all still here, and none of it is safe, and all of it is yours to walk.',{ending:['open',null]}),
  n('He closes the book, gently, on your name. He stands. He looks better. He looks like a man whose count came out right.',{ending:'kept'}),
  n('Received in good order: one traveller, one fox, one valley. Kept safe. Nothing owed.',{ending:'kept'}),
  n('The view lifts. The valley is whole and bright and perfectly still. Nothing will ever be lost here again. He will see to it.',{ending:'kept'}),
  l('envoy','I will not bargain with him for you. I will come to the edge of his road every evening and say your name. I have learned to arrive.',{ending:'kept'}),
  n('You do not bring it down. You pick the book up, and you read him his first page. Forty-one names. You are not good at it. You go slowly.',{ending:'answered'}),
  l('regent','Do not.',{ending:'answered'}),
  n('Behind you someone joins in, a line late. Then someone else. Then the whole road, because the list was on a wall, and they had read it.',{ending:'answered',sea:'publish'}),
  n('Nobody else on the road knows the names. It is only your voice, and then the envoy’s, a line behind you.',{ending:'answered',sea:['limited','license',null]}),
  l('envoy','Hollis. I was late. I have never said it to your face. The river rose, and I was late, and it was not your bell that failed them.',{ending:'answered'}),
  l('neris','And every name on your writ after them. You will read those too. Every dusk. I will bring the book.',{ending:'answered',hell:'unbind'}),
  n('Nobody on the road forgives him. Nobody was asked to.',{ending:'answered'}),
  l('regent','Then who counts them.',{ending:'answered'}),
  l('envoy','Everyone. Badly. Together.',{ending:'answered'}),
  n('He closes the book without marking his place. The ash goes out of his coat like water out of a cloth, and the pages lift, gold, letting go at both ends. What is left sitting in the spring is a bell keeper, somewhere past forty, getting his boots wet.',{ending:'answered'}),
  n('The view lifts. Every lamp you lit. The spring has started again, and the light on the water comes up from underneath.',{ending:'answered'})]},
 // ---- the epilogue: walk the valley ----
 'epilogue.workshop':{beat:'epilogue',where:'Oren’s workshop',lines:[
  l('oren','I’ve mended the arch twice already and it’s a week old. Good. A thing you never have to mend isn’t yours.',{ending:FREE}),
  n('{briar} is curled by the workshop door between two bowls. She has chosen the pear wood. Oren has not mentioned it more than twice.',{ending:FREE,bonded:true}),
  l('oren','Nothing’s broken all week. Not a hinge. I keep picking up the hammer and putting it down.',{ending:'kept'}),
  n('{briar} is not by the workshop door. She is out past the last lantern, at the edge of the valley, lying down, put upon, waiting. The way she waits anywhere she has decided you are going.',{ending:'kept',bonded:true})]},
 'epilogue.spring':{beat:'epilogue',where:'The spring',lines:[
  n('A new arch stands over the spring. The windbells on it are out of tune. Oren is leaving them: a valley should know when the wind changes, not be flattered about it.',{ending:FREE}),
  l('envoy','Envoys are not given names for the people we are sent to. Only for the ones we come back to.',{ending:FREE}),
  l('envoy','Mine is Liora. You may use it. I would like to hear it said by someone who is not filing a report.',{ending:FREE}),
  n('The arch over the spring is flawless, and the windbells on it ring true whatever the wind does. At dusk someone stands at the edge of the valley road and says your name. You can almost hear it.',{ending:'kept'})]},
 'epilogue.bridge':{beat:'epilogue',where:'Bellweather bridge',lines:[
  l('rowan','She rings forty-one at dusk now. Then one more, for whoever’s still out. That thing hangs under her and hears every one.',{device:'open',ending:FREE}),
  l('rowan','She rings forty-one at dusk. There’s never anyone still out to ring for, now. I ring the one more anyway.',{device:'open',ending:'kept'}),
  l('mara','I took it apart in the end. It’s a hinge. That’s all. A hinge that only closes. Forty pages, and that’s the summary.',{device:'sealed'}),
  n('You bury the engine under the spring arch, at last, with your own hands. It weighs nothing at all.',{device:'carried',ending:FREE}),
  n('The engine is still in your pack. It has stopped ticking. Everything has.',{device:'carried',ending:'kept'}),
  l('rowan','Bridge holds. I walk it every dusk and count. That’s a keeper’s habit, they tell me. I’m trying to do it kindly.',{device:null}),
  n('There is a new man on the bridge at Bellweather. Every dusk he reads the foundry’s names aloud, every one, and then forty-one. Then he counts whoever crosses, and lets them go. It takes him until dark. Nobody has told him he can stop.',{ending:'answered'}),
  l('rowan','Worst assistant I ever had. He’s not to be replaced.',{ending:'answered'})]},
 'epilogue.lookout':{beat:'epilogue',where:'The far-water lookout',lines:[
  l('tessa','New wagon. Paid for it myself, on the long road, in the dark. Named it after you. It pulls to the left.',{tessa:'refused'}),
  l('tessa','The Honest Road Company. Six carters, one vote each, and I lose most of them. Best thing I ever put my name to.',{tessa:'hers'}),
  l('tessa','My name came off his book when the writ went. Pell walked in the same week, on foot, swearing. Never been so glad to be sworn at.',{tessa:'signed',hell:'unbind'}),
  l('tessa','My page went up with the rest. Pell came down off the wagon the same hour. Says he felt like it.',{tessa:'signed',hell:['divert','license',null],ending:FREE}),
  l('tessa','Still on the book. The road’s very smooth. I hear you’re on it too now. I’d say sorry, but I only did what you said you’d do.',{tessa:'signed',hell:['divert','license',null],ending:'kept'}),
  l('tessa','Road’s open, stock’s dry, and nobody’s offered me a miracle all week. I could get used to it.',{tessa:null})]},
 'epilogue.observatory':{beat:'epilogue',where:'The little observatory',lines:[
  l('mara','The cinder went out the same morning he did. I’m keeping the jar. A null result is still a result.',{cinder:'sealed'}),
  n('The cinder in your pack is only a coal now. You still reach for it when you are frightened.',{cinder:'accepted'}),
  l('mara','The beacon stone’s got a scorch the shape of a plum. I’ve labelled it. It says: put down.',{cinder:'renounced'}),
  l('mara','I’ve started a map of the true roads. It’ll never be finished. Turns out I don’t mind.',{cinder:null}),
  l('avar','Your Mara permits me to hold one end of her survey chain. One end. I am told that is the entire lesson.',{stars:'bounded-account'}),
  l('mara','Avar’s diagram hangs by the door. He hasn’t written. Anik says he reads the marks every day and corrects his own sums in the margin.',{stars:'public-record'})]},
 'epilogue.pier':{beat:'epilogue',where:'The lantern pier',lines:[
  l('vessa','I light them every dusk anyway. Somebody’s always still out.',{ending:FREE}),
  l('vessa','I light them every dusk. Nobody’s ever out now. I light them anyway.',{ending:'kept'}),
  n('A copy of the daybook page is nailed to the pier post. The children have made a skipping rhyme of the forty-one. They get three of them wrong, and nobody corrects it.',{sea:'publish'}),
  l('vessa','Letter from Ilyra every season. Same three readers, book signed every time. She sounds almost let down.',{sea:'limited'}),
  n('The permit still opens any gate under the sea. You have not used it since. You have not thrown it away.',{sea:'license'})]},
 'epilogue.garden':{beat:'epilogue',where:'The common garden',lines:[
  n('The beans came in early this year. Nobody can explain it. Yselle sent down a note that says only: told you.'),
  n('A white stair still comes down to the garden some mornings. There is a chair at the foot of it, and someone in the chair who asks your name.',{heaven:'accessible-assist'}),
  n('A white stair still comes down to the garden some mornings. Nobody minds it. The beans have started up the rail.',{heaven:'broadened-activation'}),
  l('neris','I keep the valley’s book now. Births, carts, weather. Nobody in it owes anything. It is the dullest record I have ever kept, and I check it twice.',{hell:'unbind'}),
  l('neris','Forty came out. I write to the line every week. Some weeks the letters come back opened, and that is something.',{hell:'divert'}),
  n('A grey letter comes at each new moon from the Ninth Office, reporting that conditions are much improved. You have a drawer of them.',{hell:'license'})]},
 'epilogue.concert':{beat:'epilogue',where:'The little amphitheatre',lines:[
  l('ilan','This is the last song. I changed it one more time. It’s got a rest in it, about a fox long, and you’ll all please be quiet for the whole of it.'),
  n('From down the valley, faint, a man’s voice is reading names. Ilan waits for him to finish the page. Then he plays.',{ending:'answered'}),
  n('He plays. At the rest, nobody breathes. Then, from the back row, in a silence exactly a fox long, {briar} sneezes.',{ending:FREE,bonded:true}),
  n('Ilan laughs so hard he has to start the bar again.',{ending:FREE,bonded:true}),
  n('He plays. At the rest, nobody breathes, and the valley holds the silence with him.',{ending:FREE,bonded:false}),
  n('He plays it without a mistake. At the rest, nothing happens. The silence is exactly as long as it was written.',{ending:'kept'}),
  l('ilan','Huh. That’s how it was written.',{ending:'kept'})]},
 'epilogue.credits':{beat:'epilogue',where:'Firstlight',lines:[
  n('Firstlight. The roads stay open.',{ending:['open',null]}),
  n('Firstlight. The roads stay open, and somebody is counting.',{ending:'answered'}),
  n('Firstlight. Nothing is lost here.',{ending:'kept'})]}
});
// Which scene speaks for a lane's own step, scene key or (marked in BRANCHES.md) a new hook. Lanes call forStep(owner, step, state).
const STEPS=freeze({
 adventure:{start:'kit.workshop',enter:'hart.descent',rescue:'hart.briar',hart:'hart.fallen',home:'hart.home',envoy:'envoy.arrival','envoy-prophecy':'envoy.prophecy','envoy-feather':'feather.sight',reward:'feather.gift','road-enter':'road.gate',tessa:'road.tessa','cart-repair':'road.mended',habit:'road.spot','road-ram':'road.ram'},
 beacon:{sighting:'beacon.stranger','sighting-answer':'beacon.stranger.answer','sighting-tessa':'beacon.tessa',answer:'beacon.door',herald:'beacon.herald',relic:'beacon.cinder'},
 crossing:{met:'bellweather.rowan',clapper:'bellweather.clapper',keeper:'bellweather.keeper',complete:'bellweather.bell'},
 night:{begin:'night.fall','found-briar':'night.found','found-tessa':'night.found','all-safe':'night.across','broken-briar':'night.bridge','broken-you':'night.bridge',receipt:'night.receipt',envoy:'night.envoy',bowl:'night.quiet',device:'night.device','device-after':'night.device.after'},
 hell:{arrive:'hell.arrival','witness-record':'hell.neris','tovan-account':'hell.tovan','read-service-writ':'hell.gate','challenge-veyr':'hell.veyr','warden-resolved':'hell.veyr-down','stabilize-service-engine':'hell.pattern',sighting:'hell.regent',disposition:'hell.choice','verify-route':'hell.after'},
 heaven:{arrive:'heaven.arrival','witness-account':'heaven.garden',envoy:'heaven.home',reading:'heaven.reading','inspect-false-relay':'heaven.turn','relay-disabled':'heaven.seraph',arrangement:'heaven.choice','verify-welcome':'heaven.after'},
 atlantis:{'receipt-conflict':'witness.harbour','bearing-exposed':'witness.guardian','custodian-stable':'witness.record',disposition:'witness.choice','verify-passage':'witness.sea.after'},
 cosmos:{'read-local-cost':'witness.stars','disable-central-link':'witness.meridian',accountability:'witness.avar',recognition:'witness.stars.after','open-confluence':'witness.confluence',sighting:'witness.regent','verify-open-bearings':'witness.trail'},
 nearshore:{pier:'nearshore.pier',arrive:'nearshore.offer',heel:'nearshore.heel',false:'nearshore.false',real:'nearshore.real',plain:'nearshore.plain',home:'nearshore.home'},
 finale:{eve:'finale.eve',begin:'finale.rise',allies:'finale.allies',runs:'finale.runs',stair:'finale.merged.stair',road:'finale.merged.road',briar:'finale.merged.briar',down:'finale.offer',offer:'finale.offer',refused:'finale.answer',taken:'finale.answer',last:'finale.last',won:'finale.ending'},
 epilogue:{'briar-curled':'epilogue.workshop',windbells:'epilogue.spring','spring-arch':'epilogue.spring',engine:'epilogue.bridge',keeper:'epilogue.bridge',wagon:'epilogue.lookout',observatory:'epilogue.observatory',lanterns:'epilogue.pier',stair:'epilogue.garden',amphitheatre:'epilogue.concert',credits:'epilogue.credits'}
});
const get=(obj,path)=>path.split('.').reduce((v,k)=>v==null?undefined:v[k],obj);
const pick=(v,allowed)=>allowed.includes(v)?v:allowed[0];
const isFacts=s=>!!s&&typeof s==='object'&&!own(s,'saga')&&!own(s,'adventure')&&Object.keys(s).some(k=>own(FACTS,k));
// The ledger as the finale will hold it: one chain per kept thing chosen, one freed hand per open one. BRANCHES.md 2.3.
function chainsOf(f){return(f.cinder==='accepted')+(f.tessa==='signed')+(f.device==='carried')+(f.hell==='divert'||f.hell==='license')+(f.sea==='license')+(f.falseFirst===true);}
function freedOf(f){return(f.cinder==='sealed'||f.cinder==='renounced')+(f.tessa==='refused'||f.tessa==='hers')+(f.device==='open'||f.device==='sealed')+(f.hell==='unbind')+(f.heaven!==null)+(f.sea==='publish'||f.sea==='limited')+(f.stars!==null);}
function habitLabel(world){
 let id=null;try{id=G.RealmSaga?.habitPlace?.(world)??null;}catch{id=null;}
 const mark=(G.RealmCore?.LANDMARKS||[]).find(x=>x.id===id),name=mark?.name||mark?.label;
 return typeof name==='string'&&name?name[0].toLowerCase()+name.slice(1):'her old spot';
}
// Read the branch facts from a world save. Fields a save does not carry yet read as their starting value.
function facts(state){
 const f={};
 if(isFacts(state)){for(const k of Object.keys(FACTS))f[k]=own(state,k)?pick(state[k],FACTS[k]):FACTS[k][0];f.briarName=typeof state.briarName==='string'&&state.briarName?state.briarName:'Briar';f.habit=typeof state.habit==='string'&&state.habit?state.habit:'her old spot';}
 else{
  const w=state||{},s=w.saga||{},heard=s.heard||{},name=get(w,'adventure.companion.name');
  f.bonded=get(w,'adventure.companion.bonded')!==false;
  f.cinder=pick(get(w,'adventure.beacon.relic')??null,FACTS.cinder);
  f.tessa=pick(get(s,'choices.tessa')??null,FACTS.tessa);
  f.device=pick(get(s,'choices.device')??null,FACTS.device);
  f.hell=pick(get(w,'hellCampaign.choice')??null,FACTS.hell);
  f.heaven=pick(get(w,'heavenCampaign.choice')??null,FACTS.heaven);
  f.sea=pick(get(w,'atlantisCampaign.choice')??null,FACTS.sea);
  f.stars=pick(get(w,'cosmosCampaign.choice')??null,FACTS.stars);
  f.heardBeacon=heard.beacon===true;f.heardFoundry=heard.foundry===true;f.heardConfluence=heard.confluence===true;
  f.falseFirst=get(s,'briar.falseTrusted')===true;
  f.offer=pick(get(w,'earthHomecoming.finale.offer')??null,FACTS.offer);
  f.ending=pick(get(s,'finale.ending')??null,FACTS.ending);
  f.briarName=typeof name==='string'&&name.trim()?name.trim():'Briar';
  f.habit=habitLabel(w);
 }
 f.heard=(f.heardBeacon===true)+(f.heardFoundry===true)+(f.heardConfluence===true);
 f.chains=chainsOf(f);f.freed=freedOf(f);
 return f;
}
function holds(when,f){
 if(!when)return true;
 return Object.keys(when).every(k=>{
  const want=when[k],v=f[k];
  if(Array.isArray(want))return want.includes(v);
  if(want&&typeof want==='object')return(want.min===undefined||v>=want.min)&&(want.max===undefined||v<=want.max);
  return v===want;
 });
}
const fill=(text,f)=>text.replace(/\{briar\}/g,f.briarName).replace(/\{habit\}/g,f.habit);
function resolveId(id){
 if(typeof id!=='string')return null;if(own(SCENES,id))return id;
 const hits=[...new Set(Object.values(STEPS).filter(m=>own(m,id)).map(m=>m[id]))];
 return hits.length===1?hits[0]:null;
}
// The resolved scene: {id, beat, where, lines:[{who, speaker, text}], choice|null}. Unknown ids return null.
function scene(id,state){
 const key=resolveId(id);if(!key)return null;
 const s=SCENES[key],f=facts(state);
 const lines=s.lines.filter(x=>holds(x.when,f)).map(x=>({who:x.speaker,speaker:CAST[x.speaker].name,text:fill(x.text,f)}));
 const options=s.choice?s.choice.options.filter(x=>holds(x.when,f)).map(x=>({id:x.id,label:x.label,sets:{...x.sets}})):[];
 return{id:key,beat:s.beat,where:s.where,lines,choice:options.length?{id:s.choice.id,prompt:fill(s.choice.prompt,f),options}:null};
}
function forStep(owner,step,state){const key=STEPS[owner]?.[step];return key?scene(key,state):null;}
const ids=()=>Object.keys(SCENES);
const beatScenes=beat=>ids().filter(id=>SCENES[id].beat===beat);
const api=freeze({CAST,FACTS,DERIVED,SETS,SCENES,STEPS,facts,holds,scene,forStep,ids,beatScenes});
G.RealmStoryScript=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
