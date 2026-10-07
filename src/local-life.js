/* Four finite civic commissions. Job supplies and arrangement choices have
 * their own ledger; old stories, equipment and inventory retain their owners. */
(function(G){'use strict';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const clone=o=>JSON.parse(JSON.stringify(o));
const site=(id,name,x,z,requires=[],extra={})=>({id,name,x,z,y:1.57,medium:'dry',requires,...extra});
const D=G.RealmEarthConsignmentData||(typeof require==='function'?require('./earth-consignment-data.js'):null);
const isConsignment=d=>d?.id===D.ID;
const legacyDefinitions=freeze([
 {
  id:'heaven-propagation-bed-v1',realm:'heaven',title:'A Harvest That Leaves a Garden',
  giver:{id:'heaven-yselle',name:'Yselle · gardener',x:25,z:5},prerequisite:'heaven-broken-choir-v1',
  summary:'Grow a separate set of cuttings instead of stripping the public flowers. Yselle supplies the tray, cuttings and small fittings for this accepted job.',
  danger:'Dry Garden paths only. The standing public beds and the older spillway repair remain unchanged. No growth timer or harvest grind is required.',
  choices:[{id:'channel',name:'Channel-fed nursery',text:'Inspect the service handle, then plant beside the east bed.'},{id:'wick',name:'Wick-fed cutting tray',text:'Inspect the Ruby Arcade work plate, then plant beside the west bed.'}],
  reward:{xp:20,coins:8,ore:0,materials:{fiber:4}},carry:{after:'prepare-tray',until:'plant-cuttings',name:'Supplied cutting tray'},
  steps:[
   site('inspect-source','Inspect the nursery supply',25,-15,[],{sites:{channel:{x:25,z:-15,name:'Inspect the service handle'},wick:{x:-35,z:-31,name:'Inspect the Ruby Arcade work plate'}},text:'Check the supplied nursery connection. It belongs to these new cuttings; the public planting keeps its existing water.'}),
   site('prepare-tray','Assemble Yselle’s cutting tray',23,5,['inspect-source'],{assembly:{correct:'seated',reason:'The slotted rails need seated crosspieces. A loose stack will not support the cuttings.',options:[{id:'seated',name:'Seat the crosspieces in both slotted rails'},{id:'loose',name:'Lay the crosspieces loose on the rim'}]},text:'The supplied tray is assembled and ready to carry. No ordinary timber, fibre or plants were taken.'}),
   site('plant-cuttings','Plant the separate propagation bed',24,13,['prepare-tray'],{sites:{channel:{x:24,z:13},wick:{x:-24,z:13}},text:'Root the supplied cuttings in their separate nursery. The public sage and pale blossoms remain planted.'})
  ],completionText:'Yselle keeps the new cuttings rooted in their own bed. “Useful things can grow without making the welcome garden poorer.”'
 },
 {
  id:'hell-refuge-water-v1',realm:'hell',title:'Water for the Living',
  giver:{id:'hell-tovan',name:'Tovan · riveter',x:-15,z:16},prerequisite:'hell-open-cage-v1',
  summary:'Inspect the service marks and restore a small clean-water point for Kiln Refuge. Tovan supplies the cartridge or isolated hand-filter assembly.',
  danger:'Use the existing dry service road around the industrial spine. This repair does not shut off downstream water, alter Neris’s safety or repair the entire works. Return home remains free.',
  choices:[{id:'cartridge',name:'Repair the filter cartridge',text:'Seat the supplied cartridge in the Refuge’s existing small filter.'},{id:'hand-filter',name:'Isolate the inlet and fit a hand-filter',text:'Close only the contaminated small inlet. The supplied hand-filter retains manual filling; downstream supply stays open.'}],
  reward:{xp:22,coins:9,ore:2},
  steps:[
   site('inspect-mark','Inspect the Moth Cut service mark',-31,-43,[],{text:'The grounded rivet marks distinguish this small Refuge branch from the main downstream supply.'}),
   site('inspect-cooling','Inspect the cooling handle',-34,-70,['inspect-mark'],{text:'Read the existing cooled service connection. Inspection records no new cooling, rescue or industrial claim.'}),
   site('fit-filter','Fit the chosen Refuge filter',-15,18,['inspect-cooling'],{assembly:{correct:'isolated',reason:'Keep the downstream port open. The small contaminated branch alone receives this fitting.',options:[{id:'isolated',name:'Fit the small Refuge branch; leave the downstream port open'},{id:'blocked',name:'Block the main downstream port'}]},text:'The selected small filter is fitted. The main supply stays open; the hand-filter option still needs manual filling.'}),
   site('verify-outlet','Verify the Refuge filling point',-14,25,['fit-filter'],{text:'Verify the small filling point before calling the work complete. This bounded fixture serves the Refuge; it does not certify the whole industrial water network.'})
  ],completionText:'Tovan recognizes the new filling point and the exact chosen repair. The supplied job parts remain installed, and the downstream route remains open.'
 },
 {
  id:'atlantis-bellglass-lamp-v1',realm:'atlantis',title:'A Lamp for the Next Visitor',
  giver:{id:'sahra',name:'Sahra · instrument-maker',x:-5,z:-10},
  summary:'Seat a supplied keyed cartridge and service the west lamp in Bellglass’s maintained visitor air court. Choose light toward the approach or a hooded light for the desk.',
  danger:'The existing gallery uses F to ascend and G to descend. The visitor protection has no breath timer. The court’s air does not depend on this job, and the earlier depth chart remains separate.',
  choices:[{id:'approach',name:'Approach-facing light',text:'A visible face toward the court approach.'},{id:'desk',name:'Hooded desk light',text:'A sheltered light directed at the working surface.'}],
  reward:{xp:25,coins:8,ore:0,materials:{wood:2,crystal:1}},carry:{after:'assemble-cartridge',until:'fit-court-lamp',name:'Supplied lamp cartridge'},
  steps:[
   site('assemble-cartridge','Seat the keyed lamp cartridge',-8,-10,[],{assembly:{correct:'keyed',reason:'The short key fits the collar notch. An inverted cartridge cannot seat.',options:[{id:'keyed',name:'Match the short key to the collar notch and turn it home'},{id:'inverted',name:'Invert the cartridge and force the collar'}]},text:'The keyed cartridge is seated and ready for the visitor-court lamp.'}),
   site('read-gallery-gauge','Check the upper visitor gauge',8,-22,['assemble-cartridge'],{y:-1.05,medium:'water',text:'Read this gauge at its real water depth before taking the cartridge through the maintained doorway. The old chart commission is neither advanced nor repaid.'}),
   site('fit-court-lamp','Service the Bellglass west lamp',6.2,-35,['read-gallery-gauge'],{y:-2.7,medium:'court',text:'Fit the cartridge and chosen shutter at the existing lamp. The approach or desk face remains visible after this work is recorded.'})
  ],completionText:'Sahra recognizes the serviced lamp and its chosen shutter. The next visitor has a maintained light; the older chart and harbour questions keep their own history.'
 },
 {
  id:'cosmos-drawing-shelf-v1',realm:'cosmos',title:'Room to Put the Page',
  giver:{id:'anik',name:'Anik · observer',x:3,z:-43},returner:{id:'lamps',name:'Teren · route keeper',x:3,z:7},
  summary:'Give the Farroad refuge a usable place to set a page. Inspect its sockets, assemble the supplied shaped supports at Anik’s service arm, then carry the board back.',
  danger:'Follow the existing grounded roads around the ridge. The sky remains a view, not a walking surface. This shelf does not relocate a family, open a district or measure celestial distance.',
  choices:[{id:'route',name:'Route-facing drawing shelf',text:'Set the board toward the grounded approach.'},{id:'sheltered',name:'Sheltered writing tray',text:'Keep the board beneath the refuge’s existing shelter.'}],
  reward:{xp:25,coins:8,ore:0,materials:{wood:2,fiber:1}},carry:{after:'assemble-board',until:'fit-shelf',name:'Supplied drawing board'},
  steps:[
   site('inspect-sockets','Inspect the Farroad bench sockets',-6,6,[],{text:'The short and long sockets need their matching supports. Keep the existing bench and refuge body route clear.'}),
   site('assemble-board','Assemble Anik’s supplied drawing board',-1,-43,['inspect-sockets'],{y:4.77,assembly:{correct:'matched',reason:'The unequal supports need their matching sockets; a crossed pair leaves the board unsupported.',options:[{id:'matched',name:'Match each shaped support to its socket and secure the board'},{id:'crossed',name:'Cross the unequal supports and leave the board loose'}]},text:'The matched job board is secured. Carry it down the grounded road to the refuge; ordinary inventory and equipment are unchanged.'}),
   site('fit-shelf','Fit the board at the Farroad refuge',-6,6,['assemble-board'],{text:'Fit the selected shelf or tray beside the existing bench. Teren can receive the completed work at Three Lamps.'})
  ],completionText:'Teren keeps the chosen shelf at Farroad, and Anik’s supplied board has a lasting use. There is room for an ordinary page beneath the extraordinary sky.'
 }
]);
const definitions=freeze([...legacyDefinitions,D.definition]);
const definition=id=>definitions.find(d=>d.id===id)||null;
const freshRecord=()=>({accepted:false,choice:null,steps:[],claimed:false});
const fresh=()=>({version:1,records:Object.fromEntries(definitions.map(d=>[d.id,freshRecord()]))});
function validate(raw,source){
 if(raw===undefined)return fresh();
 const no=s=>{throw Error('Invalid local life: '+s);};
 if(!raw||raw.version!==1||!raw.records||typeof raw.records!=='object'||Array.isArray(raw.records))no('version or catalogue');
 const ids=Object.keys(raw.records),hasNew=Object.hasOwn(raw.records,D.ID);
 if(ids.length!==(hasNew?5:4)||D.OLD_IDS.some(id=>!Object.hasOwn(raw.records,id))||ids.some(id=>!D.OLD_IDS.includes(id)&&id!==D.ID)||hasNew&&raw.records[D.ID]===undefined)no('version or catalogue');
 const out=fresh();
 for(const d of legacyDefinitions){
  const r=raw.records[d.id];if(!r||typeof r!=='object'||typeof r.accepted!=='boolean'||typeof r.claimed!=='boolean')no('record');
  if(!Array.isArray(r.steps)||new Set(r.steps).size!==r.steps.length||r.steps.some(id=>!d.steps.some(s=>s.id===id)))no('steps');
  if(r.accepted?!d.choices.some(c=>c.id===r.choice):r.choice!==null||r.steps.length||r.claimed)no('unaccepted choice or work');
  if(r.steps.some(id=>!d.steps.find(s=>s.id===id).requires.every(req=>r.steps.includes(req))))no('prerequisites');
  if(r.claimed&&!d.steps.every(s=>r.steps.includes(s.id)))no('unearned payment');
  out.records[d.id]=clone(r); // Keep validated original histories and their raw step order.
 }
 out.records[D.ID]=hasNew?(source===undefined?D.validateRecord(raw.records[D.ID]):D.crossValidate(raw.records[D.ID],source)):D.freshRecord();
 return out;
}
function stepSite(d,s,choice){return{...s,...(s.sites?.[choice]||{})};}
function available(state,d){if(isConsignment(d)){const r=D.validateRecord(state.localLife.records[D.ID]);if(!r.accepted||r.claimed||ready(state,d))return[];const q=D.routes[D.choice(r.choice).route][r.steps.length+1];return[{...q,id:'arrive-'+q.id,name:'Carrier arrival · '+q.id.replace(/-/g,' '),kind:'motion',medium:'dry',actor:'worker'}];}const r=state.localLife.records[d.id];return r.accepted&&!r.claimed?d.steps.filter(s=>!r.steps.includes(s.id)&&s.requires.every(id=>r.steps.includes(id))).map(s=>stepSite(d,s,r.choice)):[];}
function ready(state,d){if(isConsignment(d)){const r=D.validateRecord(state.localLife.records[D.ID]);return r.accepted&&r.steps.length===D.required(r).length;}return d.steps.every(s=>state.localLife.records[d.id].steps.includes(s.id));}
function carrying(state,d){if(isConsignment(d))return false;const r=state.localLife.records[d.id];return !!(r.accepted&&!r.claimed&&d.carry&&r.steps.includes(d.carry.after)&&!r.steps.includes(d.carry.until));}
function at(sim,p){return G.RealmTrails.at(sim,{medium:'dry',...p});}
function eligible(state,d){if(isConsignment(d)){try{if(!state.adventure.started||!G.RealmEarthExpedition.validate(state.earthExpedition).story.claimed)return false;const r=state.localLife?.records[D.ID];if(r?.accepted)D.crossValidate(r,state.earthExpedition);return true;}catch{return false;}}return state.adventure.started&&(!d.prerequisite||state.realmTrails.records[d.prerequisite]?.claimed===true);}
function commit(sim,candidate,io,text){
 const fail=error=>({ok:false,error});
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before continuing: record limit reached.');
 candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'local-life',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=G.RealmCore.validate(candidate);saved=io?.save?.(checked);}catch(e){return fail('Local work save refused: '+e.message);}
 if(!saved?.ok)return fail(saved?.error||'Local work save refused. Nothing was changed.');
 sim.state.localLife=checked.localLife;
 for(const k of['xp','coins','ore','revision'])sim.state.adventure[k]=checked.adventure[k];
 Object.assign(sim.state.sandbox.inventory,checked.sandbox.inventory);
 sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
function command(ctx,type,payload,io){
 if(payload?.quest===D.ID){const rules=G.RealmEarthConsignment||(typeof require==='function'?require('./earth-consignment.js'):null);return rules?.command?rules.command(ctx,type,payload,io):{ok:false,error:'The physical consignment rules are unavailable. No work was recorded.'};}
 const sim=ctx?.sim,d=definition(payload?.quest),fail=error=>({ok:false,error});
 if(!sim||!d||G.RealmWorldFoundations.definition(sim.room)?.id!==d.realm||sim.state.adventure.hp<=0)return fail('Reach this local commission’s realm while able to act.');
 const current=sim.state.localLife.records[d.id];
 if(type==='claim'&&current.claimed)return{ok:true,duplicate:true,text:'This local commission was already paid once.'};
 if(type==='accept'&&current.accepted)return{ok:true,duplicate:true,text:'Your accepted arrangement and work are retained.'};
 const candidate=sim.snapshot(),r=candidate.localLife.records[d.id],beforeLevel=G.RealmAdventure.level(sim.state.adventure);let text,reward=null;
 if(type==='accept'){
  if(!eligible(sim.state,d))return fail(d.prerequisite?'Claim the earlier local trail before accepting this separate commission.':'Collect the initial expedition kit before accepting local work.');
  if(!at(sim,d.giver)||!d.choices.some(c=>c.id===payload.choice))return fail('Speak to '+d.giver.name+' and deliberately select one offered arrangement.');
  r.accepted=true;r.choice=payload.choice;text=d.title+' accepted · '+d.choices.find(c=>c.id===r.choice).name+'. Supplied job parts stay separate from ordinary inventory.';
 }else if(type==='step'){
  const source=d.steps.find(s=>s.id===payload.step);
  if(!r.accepted||r.claimed||!source)return fail('Only unfinished accepted local work can be recorded.');
  if(r.steps.includes(source.id))return{ok:true,duplicate:true,text:'This physical work is already recorded.'};
  const s=stepSite(d,source,r.choice);
  if(!s.requires.every(id=>r.steps.includes(id))||!at(sim,s))return fail('Reach '+s.name+' and finish its stated preparations.');
  if(s.assembly&&payload.assembly!==s.assembly.correct)return fail(s.assembly.reason+' Nothing was changed.');
  r.steps.push(s.id);text=s.text;
 }else if(type==='claim'){
  if(!r.accepted||!ready(candidate,d)||!at(sim,d.returner||d.giver))return fail('Finish the accepted work and return to '+(d.returner||d.giver).name+'.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=d.reward;
  if(a.coins+fee.coins>9999||a.ore+fee.ore>9999||Object.entries(fee.materials||{}).some(([k,n])=>!Object.hasOwn(inv,k)||inv[k]+n>G.RealmSandbox.MAX))return fail('Make room for the whole declared payment. Completed work remains unpaid; nothing was changed.');
  reward={...fee,xp:Math.min(fee.xp,9999-a.xp)};a.xp+=reward.xp;a.coins+=fee.coins;a.ore+=fee.ore;for(const[k,n]of Object.entries(fee.materials||{}))inv[k]+=n;
  r.claimed=true;text=d.title+' complete · '+d.choices.find(c=>c.id===r.choice).name+' · +'+reward.xp+' XP, +'+fee.coins+' sunmarks'+(fee.ore?', +'+fee.ore+' ore':'')+Object.entries(fee.materials||{}).map(([k,n])=>', +'+n+' '+k).join('')+'. Claimed once.'+(reward.xp<fee.xp?' Stored XP stays at its existing 9999 cap.':'');
 }else return fail('Unknown local work action.');
 const result=commit(sim,candidate,io,text);if(result.ok&&reward){result.reward=reward;const level=G.RealmAdventure.level(sim.state.adventure);if(level>beforeLevel)G.RealmAdventure.notify(sim,'Level '+level+' · useful local work.');}return result;
}
const required=(d,r)=>isConsignment(d)?(r?.accepted?D.required(r):[]):d.steps.map(s=>s.id);
const api={definitions,definition,fresh,validate,required,stepSite,available,ready,carrying,at,eligible,command};
G.RealmLocalLife=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
