/* Independent literal allowance for deliberately downgraded synthetic fixtures.
 * It may remove only the EXACT empty addition. Earned/history records refuse;
 * there is no wildcard field exclusion and no production default dependency. */
'use strict';
const assert=require('node:assert/strict');
function removeEmptyTournament(adventure){
 assert.deepEqual(adventure.earthTournament,{version:1,issued:0,closed:0,best:{blade:null,bow:null},finished:{blade:0,bow:0}});
 delete adventure.earthTournament;
}
module.exports={removeEmptyTournament};
