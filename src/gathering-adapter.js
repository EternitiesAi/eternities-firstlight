/* Historical candidate import path. The normal adventure authority owns schema 10.
 * Retained for older development tools; the production build does not load it. */
(function(G){'use strict';
const A=G.RealmAdventure||(typeof require==='function'?require('./adventure.js'):null);
if(!A||A.VERSION!==10)throw Error('Gathering requires the integrated adventure schema 10.');
if(typeof module!=='undefined')module.exports=A;
})(globalThis);
