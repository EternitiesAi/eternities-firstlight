/* ET02 completed shared moments. Unfinished activity is never stored here.
 * This is a new optional owner, not an extension to old cache/reward ledgers. */
(function(G){'use strict';
const VERSION=1,CLOTH_HOME='briar-cloth-home-v1',COMMONS_REST='briar-commons-rest-v1';
const ORDER=Object.freeze([CLOTH_HOME,COMMONS_REST]);
function fresh(){return{version:VERSION,revision:0,moments:[]};}
function invalid(why){throw Error('Invalid Briar moments: '+why);}
function validate(raw,state){
 if(raw===undefined)return fresh();
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||![Object.prototype,null].includes(Object.getPrototypeOf(raw)))invalid('record');
 const keys=Reflect.ownKeys(raw);
 if(keys.length!==3||!['version','revision','moments'].every(k=>Object.hasOwn(raw,k)))invalid('fields');
 if(raw.version!==VERSION)invalid('version; retain an export and use a compatible build');
 if(!Array.isArray(raw.moments)||raw.moments.length>ORDER.length||Reflect.ownKeys(raw.moments).length!==raw.moments.length+1)invalid('moment list');
 if(!Number.isSafeInteger(raw.revision)||raw.revision!==raw.moments.length||!ORDER.slice(0,raw.moments.length).every((id,i)=>Object.hasOwn(raw.moments,String(i))&&raw.moments[i]===id))invalid('completed order');
 if(raw.moments.length&&(state?.adventure?.started!==true||state.adventure.companion?.bonded!==true))invalid('unearned shared history');
 return{version:VERSION,revision:raw.revision,moments:raw.moments.slice()};
}
function fromWorld(state,validatedState=state){
 if(!state||typeof state!=='object'||Array.isArray(state))invalid('world');
 if(!Object.hasOwn(state,'briarMoments')){
  if('briarMoments'in state)invalid('inherited owner');
  return fresh();
 }
 if(state.briarMoments===undefined)invalid('own undefined owner');
 return validate(state.briarMoments,validatedState);
}
const api=Object.freeze({VERSION,CLOTH_HOME,COMMONS_REST,fresh,validate,fromWorld});
G.RealmBriarMoments=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
