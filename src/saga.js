/* The main story's spine. One world-level owner, state.saga: the beats of the main path, the regent's sightings, the
 * prophecy, the feather's sight, briar's absence and return, the echo ledger and the finale. Derived beats are read
 * live from the chapter and campaign owners; only what the saga itself witnesses is stored here. */
(function(G){'use strict';
const VERSION=1,MAX_DAY=100000,MAX_COUNT=1e6,MAX_PLACES=32,HABIT_RADIUS=3,HABIT_SECONDS=4,PLACE_ID=/^[a-z0-9][a-z0-9-]{0,39}$/;
const Core=()=>G.RealmCore||(typeof require==='function'?require('./core.js'):null);
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const ACTS=freeze({1:'the valley',2:'the road',3:'the night the warning failed',4:'the stolen pattern',5:'firstlight'});
const ROMAN=freeze({1:'I',2:'II',3:'III',4:'IV',5:'V'});
const GATE_PLACE={room:null,x:18,z:6,label:'The world gate'};
const BEATS=freeze([
 {id:'kit',act:1,title:'Oren’s kit',detail:'Oren has packed you a blade, a lantern and three tonics. Collect them at his workshop.',place:{room:null,x:11,z:9,label:'Oren’s workshop'}},
 {id:'hart',act:1,title:'The Hollow Hart',detail:'Something old sleeps under the north wood. Go down into the rootbound underways and free the guardian.',place:{room:null,x:0,z:-48,label:'The rootbound underways'}},
 {id:'envoy',act:1,title:'The envoy at the spring',detail:'Carry the feather to the spring. Someone has come a long way to meet you there.',place:{room:null,x:0,z:3,label:'The spring'}},
 {id:'feather',act:1,title:'The feather’s sight',detail:'The envoy wants to show you what the feather sees. Stay by the spring and listen.',place:{room:null,x:0,z:3,label:'The spring'}},
 {id:'road',act:2,title:'The sunward road',detail:'Take the road past the far-water lookout. Tessa’s caravan is stuck out there, and something with horns keeps the bridge.',place:{room:null,x:44,z:6,label:'The far-water lookout'}},
 {id:'beacon',act:2,title:'The beacon',detail:'Light the beacon on the north ridge and hold it. Watch who comes to stand beside Tessa.',place:{room:'road',x:0,z:-24,label:'The Sunward Beacon'}},
 {id:'bellweather',act:2,title:'Rowan’s bell',detail:'The bell at Bellweather has gone quiet, and the keeper with it. Find out what silenced them.',place:{room:'crossing',x:0,z:-18.5,label:'Bellweather crossing'}},
 {id:'night',act:3,title:'The night the warning failed',detail:'Night has come down wrong over the crossing. Get the travellers out, and keep Briar close.',place:{room:'crossing',x:0,z:24,label:'Bellweather, at night'}},
 {id:'hell',act:4,title:'The stolen pattern',detail:'Whoever took Briar used a pattern that was never theirs. Follow its trail down to the regent’s foundry.',place:{...GATE_PLACE,label:'The world gate · Hell'}},
 {id:'heaven',act:4,title:'The envoy’s home',detail:'Go up to Heaven in peace. The envoy’s people may read the prophecy better than we did.',place:{...GATE_PLACE,label:'The world gate · Heaven'}},
 {id:'witness',act:4,title:'The drowned witness',detail:'Under the sea there is someone who saw the pattern stolen, and past the stars a cure that needs no master key.',place:{...GATE_PLACE,label:'The world gate · the sea and the stars'}},
 {id:'nearshore',act:4,title:'The nearshore',detail:'The regent says he has Briar. He will offer you one that never strays. You know her better than that.',alone:'The regent waits on the lantern pier with a fox that never strays. He thinks you came all this way for a companion.',place:{room:null,x:0,z:27,label:'The nearshore'}},
 {id:'finale',act:5,title:'The Regent of Ash',detail:'He is waiting at the spring junction, wearing your choices like chains. Bring the people you freed.',place:{room:null,x:0,z:3,label:'The spring junction'}},
 {id:'epilogue',act:5,title:'Firstlight',detail:'It is over. Walk the valley and see what changed. Ilan has something to play for you.',place:{room:null,x:0,z:-11.6,label:'The little amphitheatre'}}
]);
const IDS=BEATS.map(b=>b.id),REGENT=freeze(['beacon','foundry','confluence']),PROPHECY=freeze(['spring','heaven']),BRIAR=freeze(['with','taken','nearshore','returned']);
const PROPHECY_LINES=freeze({spring:'The first light will not descend from heaven. It will rise from below.',heaven:'Rise from below: from the ones who were taken, not from the deep.'});
const REGENT_LINES=freeze({beacon:'A smiling stranger offered Tessa a road that never breaks.',foundry:'The smiling stranger was in the foundry, and he knew your name.',confluence:'The Regent of Ash watched you from across the confluence.'});
const GATES=freeze({night:'bellweather',hell:'night',heaven:'hell',atlantis:'heaven',cosmos:'heaven',nearshore:'witness',finale:'nearshore'});
// Echo ledger: each disposition the player chose, as the regent will quote it. Owners that rename a choice id update this table.
const ECHO=freeze([
 {id:'hell-unbind',source:['hellCampaign','choice'],value:'unbind',kind:'freeing',ally:'Neris',line:'You broke the writ in Hell and let them walk out with nothing owed.'},
 {id:'hell-divert',source:['hellCampaign','choice'],value:'divert',kind:'coercive',line:'You hid a few under a hood and left the writ standing over the rest.'},
 {id:'hell-license',source:['hellCampaign','choice'],value:'license',kind:'coercive',line:'You handed their road to another office and called it mercy.'},
 {id:'heaven-assist',source:['heavenCampaign','choice'],value:'accessible-assist',kind:'freeing',ally:'Rielle',line:'You gave tired hands a lever in Heaven, and the gate stayed open for them.'},
 {id:'heaven-broadened',source:['heavenCampaign','choice'],value:'broadened-activation',kind:'freeing',ally:'Rielle',line:'You made the open gate ordinary, and the ceremony a choice.'},
 {id:'atlantis-publish',source:['atlantisCampaign','choice'],value:'publish',kind:'freeing',ally:'Damar',line:'You put the false bearing where everyone in the harbour could read it.'},
 {id:'atlantis-limited',source:['atlantisCampaign','choice'],value:'limited',kind:'freeing',ally:'Damar',line:'You kept a passage under the sea that no office can close.'},
 {id:'atlantis-license',source:['atlantisCampaign','choice'],value:'license',kind:'coercive',line:'You kept a permit for yourself and left the office’s marker standing.'},
 {id:'cosmos-public',source:['cosmosCampaign','choice'],value:'public-record',kind:'freeing',ally:'Anik',line:'You told the stars plainly how the feed was turned against them.'},
 {id:'cosmos-bounded',source:['cosmosCampaign','choice'],value:'bounded-account',kind:'freeing',ally:'Avar',line:'You let Avar speak for himself and still told the truth about the feed.'},
 {id:'earth-watch',source:['earthHomecoming','choice'],value:'public-watch',kind:'freeing',ally:'Vessa',line:'You left the quiet engine out in the open where the valley can watch it.'},
 {id:'earth-custody',source:['earthHomecoming','choice'],value:'reviewed-custody',kind:'coercive',line:'You sealed my engine in a box at the bridge. Just in case, you said.'},
 {id:'beacon-cinder',source:['adventure','beacon','relic'],value:'accepted',kind:'coercive',line:'You took the herald’s cinder when it was offered, and it felt good.'},
 {id:'beacon-sealed',source:['adventure','beacon','relic'],value:'sealed',kind:'freeing',ally:'Mara',line:'You sealed the herald’s cinder away and kept the road honest.'},
 {id:'beacon-renounced',source:['adventure','beacon','relic'],value:'renounced',kind:'freeing',ally:'Mara',line:'You held the cinder once, and then you let it go.'},
 {id:'tessa-refused',source:['saga','choices','tessa'],value:'refused',kind:'freeing',ally:'Tessa',line:'You told Tessa to tear up my road, and she did.'},
 {id:'tessa-hers',source:['saga','choices','tessa'],value:'hers',kind:'freeing',ally:'Tessa',line:'You left Tessa her own road to choose.'},
 {id:'tessa-signed',source:['saga','choices','tessa'],value:'signed',kind:'coercive',line:'You told Tessa to sign my road.'},
 {id:'device-open',source:['saga','choices','device'],value:'open',kind:'freeing',ally:'Rowan',line:'You hung my engine under the bell where anyone can see it.'},
 {id:'device-sealed',source:['saga','choices','device'],value:'sealed',kind:'freeing',ally:'Oren',line:'You locked my engine away and gave the keys to two people.'},
 {id:'device-carried',source:['saga','choices','device'],value:'carried',kind:'coercive',line:'You carried my engine so you would always know where it was.'},
 {id:'nearshore-false',source:['saga','briar','falseTrusted'],value:true,kind:'coercive',line:'On the pier you told the quiet one to come home.'}
]);
const ECHO_IDS=ECHO.map(e=>e.id);
// BRANCHES.md 2.1: the lasting choices, the three hearings and the three endings.
const CHOICES=freeze({tessa:['refused','hers','signed'],device:['open','sealed','carried']}),ENDINGS=freeze(['open','kept','answered']);
const CHOICE_SCENES=freeze({tessa:'beacon.stranger.answer',device:'night.device'});
const Script=()=>G.RealmStoryScript||(typeof require==='function'?(()=>{try{return require('./story-script.js');}catch{return null;}})():null);
// The first line a scene speaks for this world, or null when the script is absent. The table lines above are fallbacks.
function scriptLine(id,world){try{return Script()?.scene?.(id,world)?.lines?.[0]?.text||null;}catch{return null;}}
const offerOf=w=>w?.earthHomecoming?.finale?.offer??null;
const read=(o,path)=>path.reduce((v,k)=>v?.[k],o);
const own=Object.hasOwn,isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v),day=v=>Number.isSafeInteger(v)&&v>=1&&v<=MAX_DAY;
function fresh(){return{version:VERSION,beats:{},regent:[],prophecy:[],feather:{unlocked:false,uses:0},briar:{state:'with',habit:{},takenDay:null,returnedDay:null,homeDay:null,falseTrusted:false},choices:{tessa:null,device:null},heard:{beacon:null,foundry:null,confluence:null},echo:{coercive:[],freeing:[]},finale:{phase:0,won:false,ending:null},credits:false,postgame:false};}
function clone(s){return{version:VERSION,beats:Object.fromEntries(IDS.filter(id=>own(s.beats,id)).map(id=>[id,{day:s.beats[id].day}])),regent:REGENT.filter(id=>s.regent.includes(id)),prophecy:PROPHECY.filter(id=>s.prophecy.includes(id)),feather:{unlocked:s.feather.unlocked,uses:s.feather.uses},briar:{state:s.briar.state,habit:{...s.briar.habit},takenDay:s.briar.takenDay,returnedDay:s.briar.returnedDay??null,homeDay:s.briar.homeDay??null,falseTrusted:s.briar.falseTrusted===true},choices:{tessa:s.choices?.tessa??null,device:s.choices?.device??null},heard:{beacon:s.heard?.beacon??null,foundry:s.heard?.foundry??null,confluence:s.heard?.confluence??null},echo:{coercive:s.echo.coercive.slice(),freeing:s.echo.freeing.slice()},finale:{phase:s.finale.phase,won:s.finale.won,ending:s.finale.ending??null},credits:s.credits,postgame:s.postgame};}
// Live predicates over the rest of the world; `s` is the saga record being judged.
const DERIVE=freeze({
 kit:w=>w?.adventure?.started===true,
 hart:w=>w?.adventure?.relic===true,
 envoy:(w,s)=>w?.adventure?.angelSeen===true&&s.prophecy.includes('spring'),
 feather:(w,s)=>s.feather.unlocked,
 road:w=>w?.adventure?.road?.reported===true,
 beacon:(w,s)=>w?.adventure?.beacon?.complete===true&&s.regent.includes('beacon'),
 bellweather:w=>w?.adventure?.crossing?.complete===true,
 night:(w,s)=>own(s.beats,'night'),
 hell:(w,s)=>w?.hellCampaign?.claimed===true&&s.regent.includes('foundry'),
 heaven:(w,s)=>w?.heavenCampaign?.claimed===true&&s.prophecy.includes('heaven'),
 witness:(w,s)=>w?.atlantisCampaign?.claimed===true&&w?.cosmosCampaign?.claimed===true&&s.regent.includes('confluence'),
 // BRANCHES.md 6: Briar brought home, or (never bonded) the beat marked at the pier while she was never taken.
 nearshore:(w,s)=>s.briar.state==='returned'||own(s.beats,'nearshore')&&s.briar.state==='with',
 finale:(w,s)=>s.finale.won,
 epilogue:(w,s)=>s.credits
});
function sagaOf(world){return world?.saga||fresh();}
function doneWith(world,s,id){return own(DERIVE,id)&&(own(s.beats,id)||DERIVE[id](world,s));}
function done(world,id){return doneWith(world,sagaOf(world),id);}
function priorDone(world,s,id){const i=IDS.indexOf(id);return IDS.slice(0,i).every(b=>doneWith(world,s,b));}
// What the world already holds: a save past a gate is never blocked from what it did.
const ALREADY=freeze({
 night:(w,s)=>own(s.beats,'night')||s.briar.state!=='with',
 hell:w=>w?.hellCampaign?.accepted===true,
 heaven:w=>w?.heavenCampaign?.accepted===true,
 atlantis:w=>w?.atlantisCampaign?.accepted===true,
 cosmos:w=>w?.cosmosCampaign?.accepted===true,
 nearshore:(w,s)=>s.briar.state==='nearshore'||s.briar.state==='returned',
 finale:(w,s)=>s.finale.phase>0||s.finale.won
});
function allowed(world,gate){if(!own(GATES,gate))return false;const s=sagaOf(world);return doneWith(world,s,GATES[gate])||ALREADY[gate](world,s);}
// What a sighting or a reading needs from the world when it happens. Once witnessed it stays part of the story.
const REGENT_NEEDS=freeze({beacon:w=>w?.adventure?.beacon?.introduced===true,foundry:w=>w?.hellCampaign?.accepted===true,confluence:w=>w?.cosmosCampaign?.accepted===true});
const PROPHECY_NEEDS=freeze({spring:w=>w?.adventure?.angelSeen===true,heaven:w=>w?.heavenCampaign?.accepted===true});
function validate(raw,world){
 const no=f=>{throw Error('Invalid saga: '+f);},exact=(o,keys)=>isObj(o)&&Object.keys(o).length===keys.length&&keys.every(k=>own(o,k));
 const KEYS=['version','beats','regent','prophecy','feather','briar','echo','finale','credits','postgame'];
 if(!isObj(raw)||!KEYS.every(k=>own(raw,k))||Object.keys(raw).some(k=>!KEYS.includes(k)&&k!=='choices'&&k!=='heard'))no('shape');
 if(raw.version!==VERSION)no('version');
 if(!isObj(raw.beats)||Object.keys(raw.beats).some(id=>!IDS.includes(id)))no('beats');
 for(const id of Object.keys(raw.beats)){const b=raw.beats[id];if(!exact(b,['day'])||!day(b.day))no('beat '+id);}
 const list=(v,allowedIds,f)=>{if(!Array.isArray(v)||v.length>allowedIds.length||new Set(v).size!==v.length||v.some(id=>!allowedIds.includes(id)))no(f);return v;};
 list(raw.regent,REGENT,'regent');list(raw.prophecy,PROPHECY,'prophecy');
 const f=raw.feather;if(!exact(f,['unlocked','uses'])||typeof f.unlocked!=='boolean'||!Number.isSafeInteger(f.uses)||f.uses<0||f.uses>MAX_COUNT||f.uses>0&&!f.unlocked)no('feather');
 const b=raw.briar;if(!isObj(b)||!['state','habit','takenDay'].every(k=>own(b,k))||Object.keys(b).some(k=>!['state','habit','takenDay','returnedDay','homeDay','falseTrusted'].includes(k))||!BRIAR.includes(b.state))no('briar');
 if(!isObj(b.habit)||Object.keys(b.habit).length>MAX_PLACES||Object.entries(b.habit).some(([k,v])=>!PLACE_ID.test(k)||!Number.isSafeInteger(v)||v<1||v>MAX_COUNT))no('briar habit');
 if(b.takenDay!==null&&!day(b.takenDay)||(b.state==='with')!==(b.takenDay===null))no('briar taken day');
 // returned and home days are optional on old saves (absent = null); home needs a return first.
 const rd=b.returnedDay??null,hd=b.homeDay??null;
 if(rd!==null&&!day(rd)||(b.state==='returned')!==(rd!==null))no('briar returned day');
 if(hd!==null&&(!day(hd)||rd===null||hd<rd||b.state!=='returned'))no('briar home day');
 if(own(b,'falseTrusted')&&typeof b.falseTrusted!=='boolean'||b.falseTrusted===true&&!['nearshore','returned'].includes(b.state))no('briar false trust');
 if(own(raw,'choices')){const c=raw.choices;if(!exact(c,['tessa','device'])||Object.keys(CHOICES).some(k=>c[k]!==null&&!CHOICES[k].includes(c[k]))||c.tessa!==null&&!raw.regent.includes('beacon')||c.device!==null&&!own(raw.beats,'night'))no('choices');}
 if(own(raw,'heard')){const h=raw.heard;if(!exact(h,REGENT)||REGENT.some(k=>![null,true,false].includes(h[k])||h[k]!==null&&!raw.regent.includes(k)))no('heard');}
 const e=raw.echo;if(!exact(e,['coercive','freeing']))no('echo');
 list(e.coercive,ECHO_IDS,'echo coercive');list(e.freeing,ECHO_IDS,'echo freeing');
 if(e.coercive.some(id=>ECHO.find(x=>x.id===id).kind!=='coercive')||e.freeing.some(id=>ECHO.find(x=>x.id===id).kind!=='freeing'))no('echo kind');
 const fin=raw.finale;if(!isObj(fin)||!own(fin,'phase')||!own(fin,'won')||Object.keys(fin).some(k=>!['phase','won','ending'].includes(k))||!Number.isInteger(fin.phase)||fin.phase<0||fin.phase>3||typeof fin.won!=='boolean'||fin.won&&fin.phase!==3)no('finale');
 if((e.coercive.length||e.freeing.length)&&fin.phase<1)no('echo before finale');
 if(typeof raw.credits!=='boolean'||raw.credits&&!fin.won)no('credits');
 if(typeof raw.postgame!=='boolean'||raw.postgame!==raw.credits)no('postgame');
 if(own(fin,'ending')&&fin.ending!==null&&(!ENDINGS.includes(fin.ending)||!fin.won))no('finale ending');
 const s=clone(raw);
 // a save that won before the ending existed reads it from the offer (BRANCHES.md 2.1)
 if(s.finale.won&&s.finale.ending===null)s.finale.ending=offerOf(world)==='taken'?'kept':'open';
 if(world){
  // only a stored ending is checked against the offer; one read in from an old won save never fails
  const en=fin.ending??null;if(en!==null&&(en==='kept'?offerOf(world)!=='taken':offerOf(world)!=='refused'||en==='answered'&&!REGENT.every(k=>s.heard[k]===true)))no('finale ending');
  if(s.feather.unlocked&&!s.prophecy.includes('spring'))no('feather before prophecy');
  if(s.briar.state!=='with'&&(world.adventure?.companion?.bonded!==true||!doneWith(world,s,'bellweather')))no('briar taken before bellweather');
  if(['nearshore','returned'].includes(s.briar.state)&&!doneWith(world,s,'witness'))no('briar nearshore before witness');
  if(fin.phase>0&&!doneWith(world,s,'nearshore'))no('finale before nearshore');
  for(const id of Object.keys(s.beats))if(!DERIVE[id](world,s)||!priorDone(world,s,id))no('beat order '+id);
 }
 return s;
}
// Old saves: read where the player already is from the chapter and campaign owners. Nothing is invented past the night.
function infer(world){
 const s=fresh(),a=world?.adventure||{};
 if(a.angelSeen===true){s.prophecy.push('spring');s.feather.unlocked=true;}
 if(world?.heavenCampaign?.claimed===true)s.prophecy.push('heaven');
 if(a.beacon?.complete===true)s.regent.push('beacon');
 if(world?.hellCampaign?.claimed===true)s.regent.push('foundry');
 if(world?.atlantisCampaign?.claimed===true&&world?.cosmosCampaign?.claimed===true)s.regent.push('confluence');
 return s;
}
function current(world){
 const s=sagaOf(world),b=BEATS.find(x=>!doneWith(world,s,x.id));if(!b)return null;
 return{id:b.id,act:b.act,actName:ACTS[b.act],actLabel:'Act '+ROMAN[b.act]+' · '+ACTS[b.act],title:b.title,detail:b.alone&&world?.adventure?.companion?.bonded!==true&&s.briar.state==='with'?b.alone:b.detail,place:{...b.place}};
}
function act(id){const b=BEATS.find(x=>x.id===id);return b?b.act:null;}
const yes=(text,extra)=>({ok:true,text,...extra}),fail=error=>({ok:false,error});
function saga(sim){if(!sim?.state?.saga)throw Error('A simulation with a saga is required.');return sim.state.saga;}
function mark(sim,beatId){
 const s=saga(sim),w=sim.state;if(!own(DERIVE,beatId))return fail('Unknown story beat.');
 if(beatId==='nearshore'&&!own(s.beats,beatId)&&(w.adventure?.companion?.bonded===true||s.briar.state!=='with'))return fail('The nearshore ends with Briar home.');
 if(own(s.beats,beatId))return yes('Already part of your story.',{already:true});
 if(!priorDone(w,s,beatId))return fail('That part of the story has not come yet.');
 const candidate={...s,beats:{...s.beats,[beatId]:{day:w.day}}};if(!DERIVE[beatId](w,candidate))return fail('That part of the story is not finished yet.');
 s.beats[beatId]={day:w.day};const b=BEATS.find(x=>x.id===beatId);sim.event('saga',b.title+'.');return yes(b.title+'.');
}
function regentSeen(sim,id){
 const s=saga(sim);if(!REGENT.includes(id))return fail('Unknown sighting.');if(s.regent.includes(id))return yes('You have seen him there before.',{already:true});
 if(!REGENT_NEEDS[id](sim.state))return fail('He is not there yet.');s.regent=REGENT.filter(x=>x===id||s.regent.includes(x));sim.event('saga',REGENT_LINES[id]);return yes(REGENT_LINES[id]);
}
function prophecyHeard(sim,id){
 const s=saga(sim);if(!PROPHECY.includes(id))return fail('Unknown reading.');if(s.prophecy.includes(id))return yes(PROPHECY_LINES[id],{already:true});
 if(!PROPHECY_NEEDS[id](sim.state))return fail('No one is here to read it to you.');s.prophecy=PROPHECY.filter(x=>x===id||s.prophecy.includes(x));sim.event('saga',PROPHECY_LINES[id]);return yes(PROPHECY_LINES[id]);
}
function unlockFeather(sim){
 const s=saga(sim);if(s.feather.unlocked)return yes('The feather already sees for you.',{already:true});
 if(!s.prophecy.includes('spring'))return fail('Hear the envoy out first.');s.feather.unlocked=true;sim.event('saga','The feather shows true roads in gold and false ones in ash red.');return yes('Hold the feather up to see the roads as they are.');
}
function featherUse(sim){const s=saga(sim);if(!s.feather.unlocked)return fail('The feather has not opened its sight to you yet.');if(s.feather.uses<MAX_COUNT)s.feather.uses++;return yes('The roads show themselves.',{uses:s.feather.uses});}
// Kept for callers of 'refuse-companion': the never-bonded nearshore is the beat marked at the pier (BRANCHES.md 6).
function refuseCompanion(sim){if(own(saga(sim).beats,'nearshore'))return yes('You already told him no.',{already:true});return mark(sim,'nearshore');}
function briarTaken(sim){
 const s=saga(sim),w=sim.state;if(s.briar.state==='taken')return yes('Briar is gone.',{already:true});if(s.briar.state!=='with')return fail('Briar is not with you to be taken.');
 if(w.adventure?.companion?.bonded!==true||!doneWith(w,s,'bellweather'))return fail('Not yet.');if(own(s.beats,'nearshore'))return fail('The nearshore is behind you. Briar stays with you.');
 s.briar.state='taken';s.briar.takenDay=w.day;if(sim.sagaRuntime)sim.sagaRuntime.place=null;sim.event('saga','Briar was pulled into the counterfeit road.');return yes('Briar is gone.');
}
function briarAtNearshore(sim){
 const s=saga(sim);if(s.briar.state==='nearshore')return yes('Briar is close. You can feel it.',{already:true});if(s.briar.state!=='taken')return fail('Briar is not lost.');
 if(!doneWith(sim.state,s,'witness'))return fail('You do not know where to look yet.');s.briar.state='nearshore';sim.event('saga','The trail of the counterfeit road ends at the nearshore.');return yes('The trail ends at the nearshore.');
}
function briarReturned(sim){
 const s=saga(sim);if(s.briar.state==='returned')return yes('Briar is home.',{already:true});if(!['taken','nearshore'].includes(s.briar.state))return fail('Briar was never taken.');
 if(!doneWith(sim.state,s,'witness'))return fail('You do not know where to look yet.');s.briar.state='returned';s.briar.returnedDay=sim.state.day;sim.event('saga','Briar came home beside you. Her habits are where she left them.');return yes('Briar is home.');
}
// Briar goes back to her old spot by the door on the first evening after she returns. Habits are untouched.
function briarHome(sim){
 const s=saga(sim),w=sim.state;if(s.briar.state!=='returned')return fail('Briar is not with you yet.');if(s.briar.homeDay!==null)return yes('Briar is in her old spot.',{already:true});
 if(!(w.hour>=18&&w.hour<22)||w.day<s.briar.returnedDay)return fail('Briar waits for the evening.');
 s.briar.homeDay=w.day;sim.event('saga','That evening Briar settled in her old spot by the door, beside her bowl.');return yes('Briar is in her old spot.');
}
function recordHabit(sim,placeId){
 const s=saga(sim);if(typeof placeId!=='string'||!PLACE_ID.test(placeId))return fail('Unknown place.');if(s.briar.state!=='with'||sim.state.adventure?.companion?.bonded!==true)return fail('Briar is not beside you.');
 const h=s.briar.habit;if(!own(h,placeId)&&Object.keys(h).length>=MAX_PLACES)return fail('Briar already has favourite places enough.');h[placeId]=Math.min(MAX_COUNT,(h[placeId]||0)+1);return yes('Briar settles beside you.',{count:h[placeId]});
}
function habitPlace(world){
 const h=sagaOf(world).briar.habit,order=(Core()?.LANDMARKS||[]).map(l=>l.id);let best=null;
 for(const[k,v]of Object.entries(h)){if(!best||v>h[best]||v===h[best]&&rank(order,k)<rank(order,best))best=k;}
 return best||'commons';
}
function rank(order,id){const i=order.indexOf(id);return i<0?order.length+id.charCodeAt(0):i;}
function echoLedger(world){
 const s=sagaOf(world),frozen=s.finale.phase>0,out={coercive:[],freeing:[]};
 for(const e of ECHO){const chosen=frozen?s.echo[e.kind].includes(e.id):read(e.source[0]==='saga'?{saga:s}:world,e.source)===e.value;if(!chosen)continue;
  const line=scriptLine((e.kind==='freeing'?'finale.ally.':'finale.chain.')+e.id,world)||e.line;out[e.kind].push(e.kind==='freeing'?{id:e.id,ally:e.ally,line}:{id:e.id,line});}
 return out;
}
function finalePhase(sim,phase){
 const s=saga(sim),w=sim.state;if(!Number.isInteger(phase)||phase<1||phase>3)return fail('Unknown phase.');if(s.finale.phase>=phase)return yes('Already past that.',{already:true});
 if(phase!==s.finale.phase+1)return fail('One thing at a time.');if(!doneWith(w,s,'nearshore'))return fail('Briar is not home yet.');
 if(phase===1){const ledger=echoLedger(w);s.echo={coercive:ledger.coercive.map(e=>e.id),freeing:ledger.freeing.map(e=>e.id)};}
 s.finale.phase=phase;sim.event('saga',['','The Regent of Ash rises at the spring junction.','The valley comes apart into every world at once.','He offers you a life that cannot be hurt.'][phase]);return yes('Phase '+phase+'.');
}
function finaleWon(sim,want){
 const s=saga(sim),w=sim.state;if(s.finale.won)return yes('He is gone.',{already:true,ending:s.finale.ending});if(s.finale.phase!==3)return fail('He is not finished with you yet.');
 const end=want===undefined||want===null?(offerOf(w)==='taken'?'kept':'open'):want;
 if(!ENDINGS.includes(end))return fail('Unknown ending.');
 if(end==='kept'?offerOf(w)!=='taken':offerOf(w)!=='refused')return fail(end==='kept'?'You did not sign.':'Answer his offer first.');
 if(end==='answered'&&!REGENT.every(k=>s.heard[k]===true))return fail('You never heard him out.');
 s.finale.won=true;s.finale.ending=end;
 sim.event('saga',scriptLine('finale.ending',{...w,saga:s})||'The Regent of Ash came apart in the morning light.');return yes('He is gone.',{ending:end});
}
function ending(world){return sagaOf(world).finale.ending??null;}
// BRANCHES.md 2.2: a lasting choice, asked once. The same answer replays; a different one is refused.
function choose(sim,key,value){
 const s=saga(sim);if(!own(CHOICES,key))return fail('Unknown choice.');if(!CHOICES[key].includes(value))return fail('Unknown answer.');
 if(s.choices[key]!==null)return s.choices[key]===value?yes('Already chosen.',{already:true}):fail('That is done, and it stays done.');
 if(key==='tessa'&&!s.regent.includes('beacon'))return fail('Nobody has asked you yet.');
 if(key==='device'&&!own(s.beats,'night'))return fail('Nobody has asked you yet.');
 s.choices[key]=value;let label=value;try{label=Script()?.scene?.(CHOICE_SCENES[key],sim.state)?.choice?.options?.find(o=>o.id===value)?.label||value;}catch{}
 sim.event('saga',label+'.');return yes(label+'.');
}
function regentHeard(sim,id,heard){
 const s=saga(sim);if(!REGENT.includes(id))return fail('Unknown sighting.');if(typeof heard!=='boolean')return fail('Heard him out, or not.');
 if(s.heard[id]!==null)return s.heard[id]===heard?yes('Already answered.',{already:true}):fail('That is done, and it stays done.');
 if(!s.regent.includes(id))return fail('He is not there yet.');
 s.heard[id]=heard;return yes(heard?'You let him finish.':'You cut him off.');
}
function briarFalse(sim){
 const s=saga(sim);if(s.briar.falseTrusted)return yes('She came when you called.',{already:true});
 // only on the pier: validate holds falseTrusted to nearshore or returned (BRANCHES.md 2.1)
 if(s.briar.state!=='nearshore'||!doneWith(sim.state,s,'witness'))return fail('There is no other fox to call.');
 s.briar.falseTrusted=true;sim.event('saga','You told the fox at your heel to come home.');return yes('She came when you called.');
}
function rollCredits(sim){
 const s=saga(sim);if(s.credits)return yes('The story is told.',{already:true});if(!s.finale.won)return fail('The story is not over.');
 s.credits=true;s.postgame=true;const line=scriptLine('epilogue.credits',sim.state)||'Firstlight. The roads stay open.';sim.event('saga',line);return yes(line);
}
const COMMANDS=freeze({mark:(sim,p)=>mark(sim,p.beat),regent:(sim,p)=>regentSeen(sim,p.id),prophecy:(sim,p)=>prophecyHeard(sim,p.id),'feather-unlock':unlockFeather,'feather-use':featherUse,'briar-taken':briarTaken,'briar-nearshore':briarAtNearshore,'briar-returned':briarReturned,'briar-home':briarHome,'refuse-companion':refuseCompanion,habit:(sim,p)=>recordHabit(sim,p.place),'finale-phase':(sim,p)=>finalePhase(sim,p.phase),'finale-won':(sim,p)=>finaleWon(sim,p.ending),choose:(sim,p)=>choose(sim,p.key,p.value),'regent-heard':(sim,p)=>regentHeard(sim,p.id,p.heard),'briar-false':briarFalse,credits:rollCredits});
// Same command-identity rule as the adventure: a reused id with the same content replays its result; different content is refused.
function command(sim,id,type,payload={}){
 if(typeof id!=='string'||!id||id.length>100||!isObj(payload))return fail('Invalid command envelope.');
 let fp;try{fp=JSON.stringify([type,payload]);}catch{return fail('Invalid command content.');}if(fp.length>500)return fail('Command too large.');
 const seen=sim.sagaCommands||(sim.sagaCommands=new Map()),prior=seen.get(id);if(prior)return prior.fp===fp?{...prior.result,duplicate:true}:fail('Command identity reused with different terms.');
 if(!own(COMMANDS,type))return fail('Unsupported story action.');
 const result=COMMANDS[type](sim,payload);seen.set(id,{fp,result});if(seen.size>300)seen.delete(seen.keys().next().value);return result;
}
// The habit recorder: a landmark counts once per visit when you stand within reach of it for a few seconds outdoors with Briar following.
function tick(sim,dt){
 const s=sim?.state?.saga;if(!s||!Number.isFinite(dt)||dt<=0)return;
 const r=sim.sagaRuntime||(sim.sagaRuntime={place:null,t:0,counted:false}),a=sim.state.adventure,p=sim.state.player,c=sim.adventureRuntime?.companion;
 const ready=!sim.room&&!sim.worldDive&&s.briar.state==='with'&&a?.started&&a.companion?.bonded&&a.companion.mode==='follow'&&a.hp>0&&(!c||(c.room??null)===(sim.room??null)&&Math.hypot(c.x-p.x,c.z-p.z)<6);
 const l=ready?(Core()?.LANDMARKS||[]).find(x=>Math.hypot(p.x-x.x,p.z-x.z)<HABIT_RADIUS):null;
 if(!l){r.place=null;r.t=0;r.counted=false;return;}
 if(r.place!==l.id){r.place=l.id;r.t=0;r.counted=false;}
 r.t+=dt;if(!r.counted&&r.t>=HABIT_SECONDS){r.counted=true;recordHabit(sim,l.id);}
}
const api=freeze({VERSION,ACTS,BEATS,GATES,ECHO,REGENT,PROPHECY,PROPHECY_LINES,HABIT_RADIUS,HABIT_SECONDS,fresh,validate,infer,done,act,current,allowed,mark,regentSeen,prophecyHeard,unlockFeather,featherUse,briarTaken,briarAtNearshore,briarReturned,briarHome,refuseCompanion,recordHabit,habitPlace,echoLedger,finalePhase,finaleWon,ending,choose,regentHeard,briarFalse,CHOICES,ENDINGS,rollCredits,command,tick});
G.RealmSaga=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
