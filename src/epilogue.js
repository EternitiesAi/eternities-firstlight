/* Firstlight after the Regent: which valley changes are on for the ending, their script lines, and the credits. Every line
 * comes from the story script through the row's scene id; the art draws what this lists. */
(function(G){'use strict';
const DATA=()=>G.RealmEpilogueData||(typeof require==='function'?require('./epilogue-data.js'):null);
const FIN=()=>G.RealmFinale||(typeof require==='function'?require('./finale.js'):null);
const ENDINGS=['open','answered','kept'];
// the ending the valley shows: the saga's answer, or the open road when none was given yet.
const endingOf=world=>{const e=world?.saga?.finale?.ending;return ENDINGS.includes(e)?e:'open';};
function line(scene,world){const s=FIN()?.scene?.(scene,world);return s&&s.lines.length?s.lines.map(l=>l.text).join(' '):'';}
// a change is on after the last hit; a Briar change also needs her home; a row that names endings shows only in them.
function changes(world){
 const s=world?.saga;if(!s||!(s.finale?.won||s.credits))return[];
 const ending=endingOf(world);
 return DATA().CHANGES.filter(c=>(c.when==='won'||(c.when==='briar-home'&&s.briar?.state==='returned'))&&(!c.ending||c.ending.includes(ending)))
  .map(c=>({id:c.id,kind:c.kind,at:c.at,place:c.place,text:line(c.scene,world)}));
}
// the cards the credits roll: the first card's line is the script's line for the ending.
function credits(world){return DATA().CREDITS.map(c=>c.scene?{title:c.title,lines:[line(c.scene,world)].filter(Boolean)}:{title:c.title,lines:c.lines});}
const api={changes,credits,roads:()=>DATA().ROADS,endingOf};
G.RealmEpilogue=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
