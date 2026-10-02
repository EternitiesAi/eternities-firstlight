/* One deliberate finite fitting. Canonical weapon identity and prior work survive. */
(function(G){'use strict';
const COST=Object.freeze({ore:3,coins:8}),BONUS=3;
const fresh=()=>({version:1,weapon:null});
function validate(raw,a,gear){
 if(!raw||raw.version!==1||!(raw.weapon===null||typeof raw.weapon==='string'&&a.owned.includes(raw.weapon)&&gear[raw.weapon]?.slot==='weapon'))throw Error('Invalid realm fitting');
 return{version:1,weapon:raw.weapon};
}
function bonus(a,id){return a.realmCraft?.weapon===id?BONUS:0;}
function command(ctx,weapon,io){
 const sim=ctx.sim,A=G.RealmAdventure,R=G.RealmTrails,a=sim.state.adventure;
 const fail=error=>({ok:false,error});
 if(sim.room||sim.worldDive||!G.RealmSandbox.station(sim.state.sandbox,sim.state.player)||a.hp<=0)return fail('Use an outdoor workbench in Firstlight for this fitting.');
 if(!R.definitions().some(d=>sim.state.realmTrails.records[d.id].claimed))return fail('Complete and claim a realm trail before fitting its workshop lesson.');
 if(a.realmCraft.weapon)return fail('This character’s one realm fitting is already on '+A.GEAR[a.realmCraft.weapon].name+'.');
 if(typeof weapon!=='string'||!Object.hasOwn(A.GEAR,weapon)||A.GEAR[weapon].slot!=='weapon'||!a.owned.includes(weapon))return fail('Choose an owned blade or bow.');
 if(a.ore<COST.ore||a.coins<COST.coins)return fail('The fitting needs 3 ore and 8 sunmarks. Nothing was spent.');
 const candidate=sim.snapshot();candidate.adventure.ore-=COST.ore;candidate.adventure.coins-=COST.coins;candidate.adventure.realmCraft={version:1,weapon};
 return R.commit(sim,candidate,io,'Realm fitting applied to '+A.GEAR[weapon].name+' · +3 attack. Identity, socket and earlier work retained.');
}
const api={COST,BONUS,fresh,validate,bonus,command};G.RealmCraft=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
