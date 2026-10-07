/* Canonical bounded consignment catalogue. No runtime authority or world writes. */
(function(G){'use strict';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const ID='earth-first-load-through-v1',ROOM='world-earthlands';
const OLD_IDS=freeze(['heaven-propagation-bed-v1','hell-refuge-water-v1','atlantis-bellglass-lamp-v1','cosmos-drawing-shelf-v1']);
const p=(id,x,z)=>({id,x,z}),glade=p('load-glade',-106,-105),bay=p('merren-receiving-bay',5.8,-69);
const routes=freeze({
 'southern-meadow':[glade,p('meadow-stop',-68,-99),p('field-return-stop',-54,-65),p('field-gate-stop',-26,-61.5),p('settlement-approach',-6,-61.5),bay],
 'northern-root':[glade,p('root-south-stop',-148,-86),p('root-mouth-stop',-148,-64),p('wetland-south-stop',-125,-57),p('wetland-north-stop',-125,-44),p('wetland-check-stop',-109,-28),p('camp-stop',-70,-8),p('north-pocket-bypass',-29,-9),p('west-spur-join',-20.4,-15),p('west-lane-north',-10,-15),p('west-lane-stop',-10,-34),p('settlement-approach',-6,-61.5),bay]
});
const timber={id:'first-load-consignment-v1',kind:'supplier-short-timber',quantity:4},fibre={id:'first-load-consignment-v1',kind:'supplier-binding-fibre',quantity:3};
const choices=freeze([
 {id:'south-stormfall',name:'Southern meadow · supplied short timber',route:'southern-meadow',branch:'stormfall-recovery',cargo:timber},
 {id:'north-stormfall',name:'Northern root road · supplied short timber',route:'northern-root',branch:'stormfall-recovery',cargo:timber},
 {id:'south-coppice',name:'Southern meadow · supplied binding fibre',route:'southern-meadow',branch:'managed-coppice',cargo:fibre},
 {id:'north-coppice',name:'Northern root road · supplied binding fibre',route:'northern-root',branch:'managed-coppice',cargo:fibre}
]);
const choice=id=>choices.find(c=>c.id===id)||null;
const lists=freeze(Object.fromEntries(choices.map(c=>[c.id,routes[c.route].slice(1).map(q=>'arrive-'+q.id)])));
const definition=freeze({id:ID,kind:'earth-consignment-motion-v1',realm:'earthlands',room:ROOM,title:'The first load through',
 giver:{id:'first-load-board',name:'Rill-signed consignment board',x:glade.x,z:glade.z,y:1.57,medium:'dry'},
 returner:{id:'merren',name:'Merren · field steward',x:-6,z:-68,y:1.57,medium:'dry'},workerId:'first-load-carrier-v1',cargoId:'first-load-consignment-v1',
 choices,routes,reward:{xp:0,coins:4,ore:0,materials:{wood:2,fiber:2}},
 summary:'Guide a new camp-supplied load from the return glade to Coastward. The old allocation, installed brace, checking kit and your ordinary materials keep their owners.',
 danger:'Supported Earth roads only. The northern course passes the woodland route; actual living patrol threats can make the carrier wait. There is no chase deadline or worker health system.',
 completionText:'Merren registers this supplied consignment once. The load remains at its receiving bay, and its separate payment is retained.'});
const fail=message=>{throw Error('Invalid Earth consignment: '+message);};
const freshRecord=()=>({accepted:false,choice:null,steps:[],claimed:false});
function required(value){const id=typeof value==='string'?value:value?.choice;if(!choice(id))fail('choice');return lists[id];}
function validateRecord(raw){
 if(raw===undefined)return freshRecord();
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==4||!['accepted','choice','steps','claimed'].every(k=>Object.hasOwn(raw,k))||typeof raw.accepted!=='boolean'||typeof raw.claimed!=='boolean'||!Array.isArray(raw.steps))fail('record');
 if(!raw.accepted){if(raw.choice!==null||raw.steps.length||raw.claimed)fail('unaccepted history');return freshRecord();}
 const list=required(raw);if(raw.steps.length>list.length)fail('contiguous arrivals');
 for(let i=0;i<raw.steps.length;i++)if(raw.steps[i]!==list[i])fail('contiguous arrivals');
 if(raw.claimed&&raw.steps.length!==list.length)fail('unearned payment');
 return{accepted:true,choice:raw.choice,steps:raw.steps.slice(),claimed:raw.claimed};
}
function crossValidate(raw,source){
 const r=validateRecord(raw);if(!r.accepted)return r;const E=G.RealmEarthExpedition;
 if(typeof E?.validate!=='function')fail('original source validator unavailable');
 const ee=E.validate(source);if(!ee.story.claimed||ee.story.branch!==choice(r.choice).branch)fail('paid original allocation provenance');return r;
}
function checkpoint(raw){const r=validateRecord(raw);return r.accepted?routes[choice(r.choice).route][r.steps.length]:glade;}
const api=freeze({ID,ROOM,OLD_IDS,routes,choices,definition,choice,required,checkpoint,freshRecord,validateRecord,crossValidate});
G.RealmEarthConsignmentData=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
