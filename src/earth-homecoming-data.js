/* Firstlight's finale fight numbers: the Regent's strike patterns, the bands that pick them by his hit points, and the
 * vocabulary of the retired homecoming record that old saves still carry. The rules are in finale.js; the state and the
 * fight are in earth-homecoming.js. Reading this grants nothing. */
(function(G){'use strict';
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const definition=freeze({id:'firstlight-regent-finale-v1',title:'The Regent of Ash',room:null,spring:{x:0,z:3},
 summary:'He is waiting at the spring junction, wearing your choices like chains. Bring the people you freed.',
 completionText:'The valley is yours again. Walk it, and see what changed.'});
const patterns=freeze({
 'claim-lane':{kind:'line',reach:4.24,length:4,halfWidth:1.1,windup:1.45,contact:.18,recovery:2.4},
 'false-shelter':{kind:'line',reach:11.24,length:11,halfWidth:.55,windup:1.85,contact:.18,recovery:2.6},
 'closing-ring':{kind:'annulus',reach:3.44,innerRadius:1.5,outerRadius:3.2,windup:1.6,contact:.18,recovery:2.6}
});
// per body: the first band whose aboveHP the Regent is still over picks the strike order; the last band is the floor.
const bands=freeze({
 1:freeze([{id:'bound',aboveHP:0,order:['claim-lane']}]),
 2:freeze([{id:'flight',aboveHP:200,order:['claim-lane','false-shelter']},{id:'cornered',aboveHP:0,order:['closing-ring','false-shelter','claim-lane']}]),
 3:freeze([{id:'hold',aboveHP:280,order:['claim-lane','false-shelter']},{id:'last',aboveHP:0,order:['closing-ring','false-shelter','claim-lane']}])
});
// the retired homecoming's words. old saves keep them; nothing new is written with them.
const legacySteps=freeze(['bridge-record','register-record','inspect-claim','supplied-screen','west-relay-isolated','east-relay-isolated','challenge-regent','regent-repelled','passage-secured','aftermath','return-verified','home-return']);
const legacyChoices=freeze(['public-watch','reviewed-custody']);
const api=freeze({definition,patterns,bands,legacySteps,legacyChoices});
G.RealmEarthHomecomingData=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
