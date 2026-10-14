/* ET08 finite proposed records. This module neither moves actors nor spends,
 * saves or awards anything; the live command owner must verify physical proof. */
(function(G){'use strict';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const ROOM='earth-hearthwater-approach',point=(id,x,z)=>({id,x,z});
const definition=freeze({id:'earth-gate-captains-choice-v1',title:'The Gate Captain’s Choice',room:ROOM,
 group:'hearthwater-east-road-arrivals-v1',radius:.30,speed:1.8,maxDt:.1,followDistance:10,
 giver:{id:'hearthwater-gate-captain',name:'Gate captain',room:ROOM,x:-5,z:-32},
 actors:[{id:'east-road-cart-carrier',name:'Cart carrier',offset:-.75},
  {id:'east-road-weaver',name:'Weaver',offset:0},{id:'east-road-older-traveller',name:'Older traveller',offset:.75}],
 summary:'Two transport manifests bear the same seal. Three travellers need somewhere safe while the captain checks the discrepancy. Inspect the records and shelter, then lead this group through a prepared inspection lane or to a repaired weather screen.',
 uncertainty:'A repeated seal warrants checking the cart and records. It does not establish who altered either copy or make the travellers guilty.',
 reward:{xp:15,coins:8},xpCap:9999,coinCap:9999,
 evidence:[
  {id:'arrival-register',name:'The captain’s arrival register',room:ROOM,x:-5,z:-34,
   text:'The register lists three arrivals and two manifests with the same seal. The head count agrees. The duplicate seal remains unexplained.'},
  {id:'sealed-waybill',name:'The cart’s sealed waybill',room:ROOM,x:-6,z:6,
   text:'The cart carries ordinary household bundles. Its waybill repeats the disputed seal; that identifies a paperwork discrepancy, not a guilty person.'},
  {id:'shelter-screen',name:'The old shelter’s weather screen',room:ROOM,x:-12,z:-22.2,
   text:'The roof and grounded entrance are sound. Four timber and two fibre can repair the missing screen without blocking the door or closing the road.'}],
 plans:{
  'inspection-lane':{id:'inspection-lane',name:'Prepare the inspection lane',outcome:'admitted',cost:{},
   prepare:{room:ROOM,x:-5,z:-32},
   text:'Use the captain’s supplied lane guides. Escort the three travellers around the old shelter to the staffed inspection point. No personal materials are charged.',
   route:[point('camp',-6,6),point('orchard-turn',-13,6),point('west-track',-13,-14),
    point('shelter-west',-16.7,-18),point('shelter-north',-16.7,-28),point('inspection-point',-6,-32)]},
  'temporary-shelter':{id:'temporary-shelter',name:'Repair the temporary shelter',outcome:'sheltered',cost:{wood:4,fiber:2},
   prepare:{room:ROOM,x:-12,z:-22.2},
   text:'Spend exactly 4 timber and 2 fibre to repair the screen. Escort the three travellers into the maintained shelter while the manifests are checked. This records shelter, not a later admission.',
   route:[point('camp',-6,6),point('orchard-turn',-13,6),point('shelter-approach',-13,-15),
    point('shelter-door',-12,-20.5),point('shelter-inside',-12,-22.2)]}
 }});
const KEYS=['version','accepted','evidence','plan','prepared','checkpoint','outcome','claimed'];
const fail=error=>({ok:false,error}),copy=o=>JSON.parse(JSON.stringify(o));
function fresh(){return{version:1,accepted:false,evidence:[],plan:null,prepared:false,checkpoint:'camp',outcome:null,claimed:false};}
function route(plan){if(typeof plan!=='string'||!Object.hasOwn(definition.plans,plan))throw TypeError('Choose a declared gate plan.');return definition.plans[plan].route;}
function validate(raw){
 const no=message=>{throw Error('Invalid gate captain record: '+message);};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||![Object.prototype,null].includes(Object.getPrototypeOf(raw))||Reflect.ownKeys(raw).length!==KEYS.length||
  !KEYS.every(k=>{const d=Object.getOwnPropertyDescriptor(raw,k);return d&&d.enumerable&&Object.hasOwn(d,'value');}))no('schema');
 if(raw.version!==1||!['accepted','prepared','claimed'].every(k=>typeof raw[k]==='boolean'))no('version or flags');
 if(!Array.isArray(raw.evidence)||Reflect.ownKeys(raw.evidence).length!==raw.evidence.length+1||new Set(raw.evidence).size!==raw.evidence.length||
  raw.evidence.some(id=>typeof id!=='string'||!definition.evidence.some(e=>e.id===id)))no('evidence');
 if(raw.plan!==null&&(typeof raw.plan!=='string'||!Object.hasOwn(definition.plans,raw.plan)))no('plan');
 if(raw.outcome!==null&&!['admitted','sheltered'].includes(raw.outcome))no('outcome');
 if(!raw.accepted&&(raw.evidence.length||raw.plan!==null||raw.prepared||raw.checkpoint!=='camp'||raw.outcome!==null||raw.claimed))no('unaccepted progress');
 if(raw.plan!==null&&raw.evidence.length!==definition.evidence.length)no('plan before inspection');
 if(raw.prepared&&raw.plan===null)no('preparation without plan');
 if(typeof raw.checkpoint!=='string'||(raw.plan===null?raw.checkpoint!=='camp':!route(raw.plan).some(p=>p.id===raw.checkpoint)))no('checkpoint');
 if(!raw.prepared&&(raw.checkpoint!=='camp'||raw.outcome!==null||raw.claimed))no('unprepared escort');
 const terminal=raw.prepared&&raw.checkpoint===route(raw.plan).at(-1).id;
 if(terminal?raw.outcome!==definition.plans[raw.plan].outcome:raw.outcome!==null)no('arrival outcome');
 if(raw.claimed&&!terminal)no('unearned fee');
 return{version:1,accepted:raw.accepted,evidence:raw.evidence.slice(),plan:raw.plan,prepared:raw.prepared,checkpoint:raw.checkpoint,outcome:raw.outcome,claimed:raw.claimed};
}
function transition(raw,type,payload={}){
 let q;try{q=validate(raw);}catch(e){return fail(e.message);}
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return fail('Use an explicit gate action.');
 const done=(extra={})=>({ok:true,state:validate(q),...extra}),duplicate=()=>done({duplicate:true});
 if(type==='accept'){if(q.accepted)return duplicate();q.accepted=true;return done();}
 if(!q.accepted)return fail('Read and accept the captain’s terms before progressing this group.');
 if(type==='read'){
  if(!definition.evidence.some(e=>e.id===payload.evidence))return fail('Inspect one of this outing’s physical records.');
  if(q.evidence.includes(payload.evidence))return duplicate();q.evidence.push(payload.evidence);return done();
 }
 if(type==='choose'){
  if(typeof payload.plan!=='string'||!Object.hasOwn(definition.plans,payload.plan)||q.evidence.length!==definition.evidence.length)return fail('Inspect all three records before choosing a declared plan.');
  if(q.plan===payload.plan)return duplicate();if(q.prepared)return fail('The prepared destination is retained for this group.');q.plan=payload.plan;return done();
 }
 if(type==='prepare'){
  if(!q.plan)return fail('Choose the destination after inspecting all three records.');
  if(q.prepared)return duplicate();q.prepared=true;return done({cost:copy(definition.plans[q.plan].cost)});
 }
 if(type==='checkpoint'){
  if(!q.prepared)return fail('Prepare the chosen destination before leading this group.');
  const points=route(q.plan),index=points.findIndex(p=>p.id===q.checkpoint);
  if(payload.checkpoint===q.checkpoint)return duplicate();
  if(index===points.length-1||points[index+1].id!==payload.checkpoint)return fail('The next physical group checkpoint must be reached in order.');
  q.checkpoint=payload.checkpoint;if(index+1===points.length-1)q.outcome=definition.plans[q.plan].outcome;
  return done();
 }
 if(type==='claim'){
  if(!q.outcome)return fail('Bring the group to its prepared destination before claiming the fee.');
  if(q.claimed)return duplicate();q.claimed=true;return done({reward:copy(definition.reward)});
 }
 return fail('Unknown gate captain action.');
}
const api=Object.freeze({definition,fresh,route,validate,transition});G.RealmEarthGateModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
