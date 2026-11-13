/* Firstlight's finale tables: the clock, the three bodies, where each realm's chain stands, who comes to break
 * the chains, the route the Regent runs, and the interface words. The story lines are not here: finale.js reads them
 * from the story script (G.RealmStoryScript.scene), so the script owns every line the player hears. */
(function(G){'use strict';
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
// seconds of valley time; startRange and offerRange are metres from the spring.
// allyDps: what a freed ally takes off their chain each second once they arrive; the player's hits still do most of it.
// stillSeconds: standing in one spot this long near him earns the stamp. chase: the distance at which a body turns and pursues.
const TIMING=freeze({firstChain:1.5,chainGap:2.6,freedDelay:2.2,riseSeconds:7,speed:2.4,pause:1.4,startRange:9,offerRange:6,allyDps:5,stillSeconds:2.4,chase:9,chaseSpeed:2.9});
// used only when the boss table (G.RealmDifficulty) is missing or malformed.
const BODIES=freeze([{id:'chains',hp:380,damage:46},{id:'merged',hp:400,damage:50},{id:'offer',hp:420,damage:54}]);
// each realm's chain stands on the valley's own ground, near the spring junction. spring is the default chain.
const SITES=freeze({
 // every site stands on open ground, where an arrow can reach its chain (finale.test pins it).
 hell:{x:5,z:0,label:'the hell road'},
 heaven:{x:-7,z:3,label:'the heaven stair'},
 atlantis:{x:4,z:9,label:'the drowned harbour'},
 earth:{x:-4,z:9,label:'the Coastward bridge'},
 cosmos:{x:-4,z:-4,label:'the star field'},
 beacon:{x:0,z:-7,label:'the Sunward Beacon'},
 tessa:{x:6.5,z:4,label:'the lookout road'},
 device:{x:0,z:5,label:'your own pack'},
 nearshore:{x:0,z:12,label:'the pier road'},
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
 'cosmos-bounded':{name:'Avar',color:'#9a8fc4',line:'The stars heard it plainly, and so did I.'},
 'earth-watch':{name:'Vessa',color:'#b9a072',line:'The bridge is open both ways. Look.'},
 'beacon-sealed':{name:'Mara',color:'#7fa3a0',line:'Keep the road honest, then.'},
 'beacon-renounced':{name:'Mara',color:'#7fa3a0',line:'Keep the road honest, then.'},
 'tessa-refused':{name:'Tessa',color:'#c98f4f',line:'Keep the road honest, then.'},
 'tessa-hers':{name:'Tessa',color:'#c98f4f',line:'Keep the road honest, then.'},
 'device-open':{name:'Rowan',color:'#b08d57',line:'The bell is loud enough for everyone now.'},
 'device-sealed':{name:'Oren',color:'#a8794a',line:'It is in a box, and the box is labelled.'}
});
// the merged valley. the Regent runs this loop and stops at each turn to strike. waypoints that are not walkable are skipped.
const ROUTE=freeze([{x:0,z:3},{x:-6,z:2},{x:-6,z:-4},{x:-4,z:-10},{x:-7,z:-17},{x:-1,z:-23},{x:12,z:-21},{x:18,z:-4},{x:16,z:7},{x:4,z:14},{x:-6,z:10}]);
// interface words only: the phase titles, the break notice, and the offer's fallback labels. every story line is in the script.
const LINES=freeze({
 playerBreak:'You break the chain.',
 phaseTitle1:'Break the chains',
 phaseTitle2:'Strike him as he runs',
 phaseTitle3:'He offers you a gift',
 phaseDetail1:'Each chain is tied to a place you chose. The people you freed will break some of them for you.',
 phaseDetail2:'He stops at each turn of the valley to strike. Stand outside his lines and hit him while he runs.',
 phaseDetail3:'Answer his offer. Nothing he does lands while it waits.',
 wonDetail:'The valley is yours again. Walk it and see what changed.',
 postgameTitle:'Firstlight',
 postgameDetail:'The roads stay open. Walk them as long as you like. The side work stays open too: the gate, the tournament, the masterwork and the fishing.',
 postgameProgress:'Free roads · side work open'
});
const api=freeze({TIMING,BODIES,SITES,ALLY_CARDS,ROUTE,LINES});
G.RealmFinaleData=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
