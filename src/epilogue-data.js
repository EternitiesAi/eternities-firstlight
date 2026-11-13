/* Firstlight after the Regent: the valley changes, the road segments they read, and the credits. A change is drawn only
 * when its condition holds: 'won' after the last hit, 'briar-home' when Briar came back. The kind picks the drawing in
 * epilogue-art.js; a kind that art does not know is not drawn and not counted. The dialogue is a working draft. */
(function(G){'use strict';
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const CHANGES=freeze([
 {id:'amphitheatre',kind:'stage-play',at:{x:0,z:-11.6},when:'won',place:'the little amphitheatre',text:'Ilan plays on the little stage.'},
 {id:'windbells',kind:'bells',at:{x:0,z:3},when:'won',place:'the spring',text:'The windbells ring over the spring.'},
 {id:'spring-arch',kind:'arch',at:{x:0,z:0.4},when:'won',place:'the spring',text:'A new arch stands over the spring.'},
 {id:'grey-roads',kind:'grey-road',when:'won',place:'the counterfeit roads',text:'The counterfeit roads have gone grey.'},
 {id:'lanterns',kind:'lantern',when:'won',place:'the true roads',text:'Lanterns line the true roads.'},
 {id:'briar-curled',kind:'curled-fox',at:{x:11.6,z:9.4},when:'briar-home',place:'the workshop',text:'Briar is curled up by the workshop.'}
]);
// road segments the feather's sight marks. keep these in step with the feather sight's lists at integration.
const ROADS=freeze({
 trueRoads:[{a:{x:-2,z:9},b:{x:-6,z:24}},{a:{x:2,z:8},b:{x:14,z:14}},{a:{x:-3,z:-2},b:{x:-16,z:-9}}],
 counterfeitRoads:[{a:{x:5,z:-2},b:{x:13,z:-14}},{a:{x:-8,z:8},b:{x:-18,z:16}}]
});
const CREDITS=freeze([
 {title:'Firstlight',lines:['made by Dom (Eternities) with Claude']},
 {title:'Story and code',lines:['Dom (Eternities), with Claude']},
 {title:'Postgame',lines:['The roads stay open. Walk them as long as you like.']}
]);
const api=freeze({CHANGES,ROADS,CREDITS});
G.RealmEpilogueData=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
