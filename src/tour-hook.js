/* gate for Realm.tour: the harness global and the exact ?tour=1 flag. its own file so node can test it. */
(function(G){'use strict';
// exactly one tour flag, valued 1. a repeated or near-miss flag does not mount the hook.
const enabled=(win,search)=>{
 if(!win||!win.__ETERNITIES_TEST_MODE)return false;
 const flags=new URLSearchParams(search||'').getAll('tour');
 return flags.length===1&&flags[0]==='1';
};
G.RealmTourHook=Object.freeze({enabled});
})(typeof window!=='undefined'?window:globalThis);
if(typeof module!=='undefined')module.exports=globalThis.RealmTourHook;
