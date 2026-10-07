/* Optional Earth investigation owner. Definitions/validation only;
 * no proof, actor, save, reward or movement authority lives in this module. */
(function(G){'use strict';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const ID='earth-beast-wrong-name-v1',ROOM='world-earthlands',VERSION=1;
const KEYS=['version','accepted','evidence','observed','resolution','cleared','claimed'];
const exact=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o))&&Reflect.ownKeys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const point=(id,name,x,z,text)=>({id,name,x,z,y:1.57,medium:'dry',text});
const giver=point('elderweald-sela','Sela · herbalist',-103,-23,'People blame the moss-backed grazer for the gouged roadside timber. Sela asks you to read the marks and watch the animal before the name sticks.');
const evidence=freeze([
 point('timber-gouge','Gouged roadside timber',-155.5,-66.1,'The abandoned timber has a narrow fresh gouge. Record the cut before naming its maker.'),
 point('feeding-track','Feeding marks',-155.8,-72,'Broad hoof marks and disturbed foliage lie beside the narrow gouge. They need separate explanations.'),
 point('pest-scrape','Burrowing scrape',-154.8,-85.1,'The grazer’s visible feeding action differs from this small fresh scrape. Record the distinction before choosing a response.')
]);
const overlook=freeze(point('grazer-overlook','Overlook · face west',-157.5,-78.5,'Face west and watch a complete visible turn, browse and recovery. Approach alone does not record an observation.'));
const bypass=freeze([{x:-148,z:-64},{x:-155.5,z:-66.1},{x:-155.8,z:-72},{x:-157.5,z:-78.5},{x:-154.8,z:-85.1},{x:-148,z:-86}]);
const resolutions=freeze([
 {id:'signed-loop',name:'Mark the supported walking loop',text:'Keep the animal’s refuge and mark the supported west-side bypass. This resolves the new pest account without fighting it.'},
 {id:'cleared-pocket',name:'Clear the separate pest pocket',text:'Deliberately begin one new skitter encounter in the south-west pocket. The grazer is harmless and never a combat target.'}
]);
const enemy=freeze({id:'earth-wild-signs-burrow-skitter-v1',name:'Root-margin skitter',kind:'skitter',x:-166,z:-94,radius:.48,hp:72,damage:9,xp:0,coins:0,ore:0});
const definition=freeze({id:ID,version:VERSION,realm:'earthlands',room:ROOM,title:'The Beast With the Wrong Name',giver,returner:giver,evidence,overlook,bypass,resolutions,enemy,
 reward:{xp:0,coins:4,ore:0,materials:{fiber:3}},
 summary:'After the supplied load is explicitly paid, inspect two different marks, witness the grazer and compare the fresh pest scrape. Choose a signed walking loop or a separate pest encounter, then return with an accurate account.',
 danger:'The new skitter has 72 health and 9 damage; it uses the existing anticipation, contact and recovery. Its optional pocket pays no kill loot or XP. Independent old patrols can still be present. The supported west-side loop and your original road home remain available.',
 completionText:'Sela retained the corrected field account and paid 4 sunmarks and 3 fibre once. The grazer, earlier work, stock and original choices keep their owners.'});
const fail=m=>{throw Error('Invalid Earth wild signs: '+m);};
const fresh=()=>({version:VERSION,accepted:false,evidence:[],observed:false,resolution:null,cleared:false,claimed:false});
const ready=r=>!!r?.accepted&&r.observed===true&&r.evidence?.length===3&&(r.resolution==='signed-loop'||r.resolution==='cleared-pocket'&&r.cleared===true);
function validate(raw){
 if(raw===undefined)return fresh();
 if(!exact(raw,KEYS)||raw.version!==VERSION||!['accepted','observed','cleared','claimed'].every(k=>typeof raw[k]==='boolean'))fail('version or exact record');
 const ids=raw.evidence;
 if(!Array.isArray(ids)||ids.length>3||Reflect.ownKeys(ids).length!==ids.length+1||new Set(ids).size!==ids.length)fail('evidence');
 for(let i=0;i<ids.length;i++)if(!Object.hasOwn(ids,i)||typeof ids[i]!=='string'||!evidence.some(p=>p.id===ids[i]))fail('evidence');
 if(raw.resolution!==null&&!resolutions.some(r=>r.id===raw.resolution))fail('resolution');
 if(!raw.accepted&&(ids.length||raw.observed||raw.resolution!==null||raw.cleared||raw.claimed))fail('unaccepted history');
 if(raw.observed&&!['timber-gouge','feeding-track'].every(id=>ids.includes(id)))fail('observation prerequisites');
 if(ids.includes('pest-scrape')&&(!raw.observed||ids.indexOf('pest-scrape')!==2))fail('scrape prerequisites');
 if(raw.resolution!==null&&(ids.length!==3||!raw.observed))fail('resolution prerequisites');
 if(raw.cleared&&raw.resolution!=='cleared-pocket')fail('clearance owner');
 if(raw.claimed&&!ready(raw))fail('unearned payment');
 return{version:VERSION,accepted:raw.accepted,evidence:ids.slice(),observed:raw.observed,resolution:raw.resolution,cleared:raw.cleared,claimed:raw.claimed};
}
function eligible(state){
 try{const C=G.RealmEarthConsignmentData;if(typeof C?.crossValidate!=='function')return false;return C.crossValidate(state?.localLife?.records?.[C.ID],state?.earthExpedition).claimed===true;}catch{return false;}
}
function crossValidate(raw,state){const r=validate(raw);if(r.accepted&&!eligible(state))fail('explicitly claimed supplied load prerequisite');return r;}
const api=freeze({ID,ROOM,VERSION,definition,giver,evidence,overlook,bypass,resolutions,enemy,fresh,validate,crossValidate,eligible,ready});
G.RealmEarthWildSignsData=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
