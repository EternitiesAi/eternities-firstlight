/* Firstlight after the Regent: the valley changes, the road segments they read, and the credits. A change is drawn when its
 * condition holds ('won' after the last hit, 'briar-home' when Briar came back) and, when it names endings, only in those
 * endings (open, answered, kept). The kind picks the drawing in epilogue-art.js. Every line is read from the story script
 * through the row's scene id, so the script owns the words; this file owns only the places and the conditions. */
(function(G){'use strict';
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const CHANGES=freeze([
 {id:'amphitheatre',kind:'stage-play',at:{x:0,z:-11.6},when:'won',scene:'epilogue.concert',place:'the little amphitheatre'},
 {id:'windbells',kind:'bells',at:{x:0,z:3},when:'won',scene:'epilogue.spring',place:'the spring'},
 {id:'spring-arch',kind:'arch',at:{x:0,z:0.4},when:'won',scene:'epilogue.spring',place:'the spring'},
 {id:'grey-roads',kind:'grey-road',when:'won',scene:'epilogue.pier',place:'the counterfeit roads'},
 {id:'lanterns',kind:'lantern',when:'won',ending:['open','answered'],scene:'epilogue.pier',place:'the true roads'},
 {id:'briar-curled',kind:'curled-fox',at:{x:11.6,z:9.4},when:'briar-home',ending:['open','answered'],scene:'epilogue.workshop',place:'the workshop'},
 {id:'briar-waiting',kind:'curled-fox',at:{x:42,z:5},when:'briar-home',ending:['kept'],scene:'epilogue.workshop',place:'past the last lantern'},
 {id:'engine',kind:'engine',at:{x:0,z:-18},when:'won',scene:'epilogue.bridge',place:'the Bellweather bridge'},
 {id:'keeper',kind:'keeper',at:{x:0,z:-19.5},when:'won',ending:['answered'],scene:'epilogue.bridge',place:'the Bellweather bridge'},
 {id:'wagon',kind:'wagon',at:{x:44,z:6},when:'won',scene:'epilogue.lookout',place:'the far-water lookout'},
 {id:'observatory',kind:'observatory',at:{x:9,z:-5.8},when:'won',scene:'epilogue.observatory',place:'the little observatory'},
 {id:'stair',kind:'stair',at:{x:-6,z:13},when:'won',scene:'epilogue.garden',place:'the common garden'}
]);
// road segments the feather's sight marks. keep these in step with the feather sight's lists at integration.
const ROADS=freeze({
 trueRoads:[{a:{x:-2,z:9},b:{x:-6,z:24}},{a:{x:2,z:8},b:{x:14,z:14}},{a:{x:-3,z:-2},b:{x:-16,z:-9}}],
 counterfeitRoads:[{a:{x:5,z:-2},b:{x:13,z:-14}},{a:{x:-8,z:8},b:{x:-18,z:16}}]
});
// the credits' cards. the first card's line is the script's epilogue.credits scene for the ending; the rest are fixed.
const CREDITS=freeze([
 {title:'Firstlight',scene:'epilogue.credits'},
 {title:'Story and code',lines:['Dom (Eternities), with Claude']},
 {title:'Postgame',lines:['The roads stay open. Walk them as long as you like.']}
]);
const api=freeze({CHANGES,ROADS,CREDITS});
G.RealmEpilogueData=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
