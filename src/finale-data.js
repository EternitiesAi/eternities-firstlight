/* Firstlight's finale tables: the clock, the three bodies, where each realm's chain stands, who comes to break
 * the chains, the route the Regent runs, and every line the finale says. The rules read these tables (finale.js,
 * earth-homecoming.js); the story script replaces them at integration. The dialogue here is a working draft. */
(function(G){'use strict';
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
// seconds of valley time; startRange and offerRange are metres from the spring.
const TIMING=freeze({firstChain:1.5,chainGap:2.6,freedDelay:2.2,riseSeconds:7,speed:2.4,pause:1.4,startRange:9,offerRange:6});
// used only when the boss table (G.RealmDifficulty) is missing or malformed.
const BODIES=freeze([{id:'chains',hp:380,damage:46},{id:'merged',hp:400,damage:50},{id:'offer',hp:420,damage:54}]);
// each realm's chain stands on the valley's own ground, near the spring junction. spring is the default chain.
const SITES=freeze({
 hell:{x:6,z:1,label:'the hell road'},
 heaven:{x:-7,z:3,label:'the heaven stair'},
 atlantis:{x:4,z:9,label:'the drowned harbour'},
 earth:{x:-4,z:9,label:'the Coastward bridge'},
 cosmos:{x:-4,z:-4,label:'the star field'},
 beacon:{x:0,z:-7,label:'the Sunward Beacon'},
 spring:{x:0,z:7,label:'the spring'}
});
// the people who break the chains, keyed by the freeing echo entry. an entry with no card gets the saga's name.
const ALLY_CARDS=freeze({
 'hell-unbind':{name:'Neris',color:'#8f6a5a',line:'Nothing is owed here. Go on.'},
 'heaven-assist':{name:'Rielle',color:'#e8dcc0',line:'The gate stays open. Hold it with me.'},
 'heaven-broadened':{name:'Rielle',color:'#e8dcc0',line:'The gate stays open. Hold it with me.'},
 'atlantis-publish':{name:'Damar',color:'#4f7f8c',line:'The bearing is public now. It cannot lie to the harbour.'},
 'atlantis-limited':{name:'Damar',color:'#4f7f8c',line:'The bearing is public now. It cannot lie to the harbour.'},
 'cosmos-public':{name:'Anik',color:'#7d6fa0',line:'The stars heard it plainly, and so did I.'},
 'cosmos-bounded':{name:'Anik',color:'#7d6fa0',line:'The stars heard it plainly, and so did I.'},
 'earth-watch':{name:'Vessa',color:'#b9a072',line:'The bridge is open both ways. Look.'},
 'beacon-sealed':{name:'Tessa',color:'#c98f4f',line:'Keep the road honest, then.'},
 'beacon-renounced':{name:'Tessa',color:'#c98f4f',line:'Keep the road honest, then.'}
});
// the merged valley. the Regent runs this loop and stops at each turn to strike. waypoints that are not walkable are skipped.
const ROUTE=freeze([{x:0,z:3},{x:-6,z:2},{x:-6,z:-4},{x:-4,z:-10},{x:-7,z:-17},{x:-1,z:-23},{x:12,z:-21},{x:18,z:-4},{x:16,z:7},{x:4,z:14},{x:-6,z:10}]);
// every line the finale says. keys are read by name; a missing key reads as empty, never as a stand-in.
const LINES=freeze({
 begin:'The Regent of Ash rises at the spring junction.',
 chainPrefix:'Regent of Ash · ',
 defaultChain:'You never once handed me a chain, so I will hang my own on the spring.',
 playerBreak:'You break the chain.',
 allyBreakSuffix:' breaks the chain.',
 allyArrivePrefix:' · ',
 runs:'The last chain falls. He runs for the far side of the valley.',
 down:'He falls back to the spring, and offers you a gift.',
 offer:'He offers you a life that cannot be hurt.',
 refuse:'Refuse him',
 take:'Take the gift',
 refused:'You refused him. He stands in the spring light.',
 taken:'You took his gift. Nothing will reach you now.',
 won:'The Regent of Ash came apart in the morning light.',
 credits:'Firstlight. The roads stay open.',
 noOffer:'He has no offer waiting.',
 phaseTitle1:'Break the chains',
 phaseTitle2:'Strike him as he runs',
 phaseTitle3:'He offers you a gift',
 phaseDetail1:'Each chain is tied to a place you chose. The people you freed will break some of them for you.',
 phaseDetail2:'He stops at each turn of the valley to strike. Stand outside his lines and hit him while he runs.',
 phaseDetail3:'Refuse him and fight on as you are, or take the gift and nothing he does can reach you.',
 wonDetail:'The valley is yours again. Walk it and see what changed.'
});
// the three bodies, read from the boss table when present; the fallback keeps the brief's numbers.
const api=freeze({TIMING,BODIES,SITES,ALLY_CARDS,ROUTE,LINES});
G.RealmFinaleData=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
