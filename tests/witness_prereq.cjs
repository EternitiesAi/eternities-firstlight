'use strict';
/* Heaven is finished before the drowned-witness doors open. This writes the claimed heaven campaign and the
 * claimed Broken Choir trail into a raw save, the way a finished save records them, and drops the saga so
 * validation infers the prophecy exactly as it does for an old save. Only fills what is missing. */
const HV=require('../src/heaven-campaign.js'),RT=require('../src/realm-trails.js');
function heavenFinished(raw){
 if(raw.heavenCampaign?.claimed!==true){
  raw.heavenCampaign={version:1,accepted:true,steps:HV.definition.steps.map(s=>s.id),choice:HV.definition.choices[0].id,claimed:true};
 }
 const d=RT.definition('heaven-broken-choir-v1'),r=raw.realmTrails.records[d.id];
 if(r?.claimed!==true)raw.realmTrails.records[d.id]={accepted:true,steps:d.steps.map(s=>s.id),settings:{},checkpoint:0,escortMode:'follow',assisted:false,claimed:true};
 delete raw.saga;
 return raw;
}
module.exports={heavenFinished};
