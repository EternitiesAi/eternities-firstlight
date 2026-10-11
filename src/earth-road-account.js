/* Authored readings for the existing provisional Earth people. The claimed
 * WildSigns owner selects words only: no quest, save, reward or routine owner.
 * ET09 supports a revised public claim; this timber-damage adaptation leaves
 * the gouge's maker and the older forest stories unresolved. */
(function(G){'use strict';
const D=G.RealmEarthWildSignsData;
if(typeof D?.crossValidate!=='function')throw Error('Load canonical Earth wild-signs data before the road account.');
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const people=freeze({
 'elderweald-sela':{speaker:'Sela · herbalist',title:"Sela's revised notice"},
 'elderweald-rill':{speaker:'Rill · forestkeeper',title:'A quieter way through'},
 merren:{speaker:'Merren · field steward',title:'The way along the lane'}
});
const observed=freeze([
 'The grazer was witnessed feeding. Its broad marks do not match the narrow timber gouge; a separate burrowing scrape was recorded. The gouge’s maker remains unproven. The older stories of the forest are still unanswered.'
]);
const responses=freeze({
 'signed-loop':{
  'elderweald-sela':['I have changed the notice. Let the next traveller see the marks before putting the blame on the grazer.','Take the signed bypass. We can leave the pest pocket alone, and the grazer can keep its refuge.'],
  'elderweald-rill':['Take the signed bypass when you inspect the lane. There is room for the grazer to feed without sending you through the pest pocket.','The brace still supports the living road. Keep an eye on it when you return; the older patrols still need their own checks.'],
  merren:['Use the signed bypass when you set out from the bench. Give the grazer room to feed.','The bench and the river work are still here when you need them.']
 },
 'cleared-pocket':{
  'elderweald-sela':['I have changed the notice. The grazer was feeding; the separate pest pocket was cleared.','That still leaves the timber gouge unanswered. Keep the refuge quiet, and do not mistake one cleared pocket for the whole forest.'],
  'elderweald-rill':['The separate pocket was cleared. You can check that stretch of lane while leaving the grazer and its refuge alone.','The brace still supports the living road. Keep an eye on it when you return; the older patrols still need their own checks.'],
  merren:['That pocket was cleared, but keep your eyes open along the rest of the lane. Leave the grazer’s refuge quiet.','The bench and the river work are still here when you need them.']
 }
});
function claimed(state){
 try{
  // Missing or inherited ownership stays unreadable; this projection never
  // asks a validator to manufacture the optional fresh owner for an old save.
  if(!state||typeof state!=='object'||!Object.hasOwn(state,'earthWildSigns')||
   !Object.hasOwn(state,'localLife')||!Object.hasOwn(state.localLife,'records')||
   !Object.hasOwn(state.localLife.records,G.RealmEarthConsignmentData?.ID)||
   !Object.hasOwn(state,'earthExpedition'))return null;
  const r=D.crossValidate(state.earthWildSigns,state);
  return r.claimed===true&&Object.hasOwn(responses,r.resolution)?r:null;
 }catch{return null;}
}
function reading(personId,state){
 if(typeof personId!=='string'||!Object.hasOwn(people,personId))return null;
 const r=claimed(state);if(!r)return null;
 return freeze({personId,speaker:people[personId].speaker,title:people[personId].title,resolution:r.resolution,
  lines:[...responses[r.resolution][personId]]});
}
function notice(state){
 const r=claimed(state);if(!r)return null;
 const practical=r.resolution==='signed-loop'?
  'Follow the signed bypass around the pest pocket. Leave the grazer’s refuge undisturbed; the route avoids that fight.':
  'This pest pocket is recorded clear. Leave the grazer’s refuge undisturbed, and keep watch elsewhere: other patrols and dangers remain.';
 return freeze({title:'Corrected field notice · evidence & road use',resolution:r.resolution,lines:[...observed,practical]});
}
function html(personId,state){
 const r=reading(personId,state);return r?'<section class="road-account-reading" data-road-account-service="'+esc(r.personId)+'" data-road-account-outcome="'+esc(r.resolution)+'"><small>'+esc(r.speaker)+'</small><h3>'+esc(r.title)+'</h3>'+r.lines.map(line=>'<p>'+esc(line)+'</p>').join('')+'</section>':'';
}
function noticeHTML(state){
 const r=notice(state);return r?'<section class="road-account-notice" data-road-account-notice data-road-account-outcome="'+esc(r.resolution)+'"><h4>'+esc(r.title)+'</h4>'+r.lines.map(line=>'<p>'+esc(line)+'</p>').join('')+'</section>':'';
}
const api=Object.freeze({reading,notice,html,noticeHTML});G.RealmEarthRoadAccount=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
