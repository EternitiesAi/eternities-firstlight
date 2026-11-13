/* Firstlight after the Regent: which valley changes are on, and the credits. Pure: it reads the saga and the table in
 * epilogue-data.js, and the art draws what this lists. */
(function(G){'use strict';
const DATA=()=>G.RealmEpilogueData||(typeof require==='function'?require('./epilogue-data.js'):null);
// a change is on after the last hit, and a Briar change also needs her home. unknown conditions never count.
function changes(world){
 const s=world?.saga;if(!s||!(s.finale?.won||s.credits))return[];
 return DATA().CHANGES.filter(c=>c.when==='won'||(c.when==='briar-home'&&s.briar?.state==='returned')).map(({id,kind,at,place,text})=>({id,kind,at,place,text}));
}
const api={changes,credits:()=>DATA().CREDITS,roads:()=>DATA().ROADS};
G.RealmEpilogue=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
