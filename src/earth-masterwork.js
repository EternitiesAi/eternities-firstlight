/* ET06: one commission, explicit apprentice participation, one optional lesson.
 * No new inventory payout, resident mind, material collection or campaign gate. */
(function(G){'use strict';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;},copy=o=>JSON.parse(JSON.stringify(o));
const definition=freeze({id:'earth-masterwork-without-name-v1',title:'The Masterwork Without a Name',
 giver:{id:'workshop-apprentice',name:'Workshop apprentice',room:null,x:14.5,z:10.5},
 summary:'A new Hearthwater commission bears Oren’s workshop stamp, but the apprentice cut its interlocking pattern. Compare the maker’s marks with the quarry order and inscription, then help correct the credit in the way the apprentice chooses.',
 route:'Firstlight workshop → lake footbridge → Hearthwater’s eastern quarry road → workshop. Quiet supported roads; no required fight, fee or timed escort.',
 evidence:[
  {id:'tool-sample',name:'Inspect the apprentice’s tool sample',room:null,x:9.8,z:9.7,hint:'Examine the practice cutwork on the workshop table. Look for the maker’s finishing marks.',text:'Three stepped cuts meet a shallow hooked notch. The apprentice’s practice piece carries the same distinctive finishing mark as the commission. The workshop stamp identifies the seller; it does not name the hand that cut the pattern.'},
  {id:'commission-order',name:'Read the original quarry order',room:'earth-hearthwater-approach',x:12,z:-26,hint:'Read the commission’s original assignment beside Darric’s quarry, separate from the road-repair blocks.',text:'The order assigns the interlocking pattern to the workshop apprentice. Oren’s workshop supplied and guaranteed the work. Darric kept this order with the new commission, separate from the road-repair blocks.'},
  {id:'credited-plaque',name:'Inspect the credited commission',room:'earth-hearthwater-approach',x:15.2,z:-27.3,hint:'Compare the commissioned stone’s cutwork and the name on its credit plate.',text:'The hooked notch and three stepped cuts match the apprentice’s sample. The plate credits Oren alone. The later workshop stamp cannot establish who made the earlier cut marks.'}
 ],
 resolutions:[
  {id:'private-correction',name:'Correct the private commission record',text:'The signed order acknowledges the apprentice’s work. The public plate names the workshop as supplier without assigning the cutwork to Oren. The apprentice keeps their name private.'},
  {id:'public-correction',name:'Co-author a public correction',text:'With the apprentice’s recorded participation, attach a signed correction naming the apprentice’s cutwork and the workshop’s supply.'}
 ],
 reward:'One optional lesson on one already-owned blade or bow. Learning does not equip or enable it. Switch the learned weapon between its ordinary special and the lesson on 2/Q. No currency, materials, XP, new weapon or class is granted.'});
const fresh=()=>({version:1,accepted:false,evidence:[],compared:false,participation:null,resolution:null,weapon:null,enabled:false});
const exact=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const status=value=>value?.state?.adventure?.earthMasterwork||value?.earthMasterwork||value;
function validate(raw,a,gear){const bad=why=>{throw Error('Invalid Earth masterwork: '+why);};
 if(!exact(raw,Object.keys(fresh()))||raw.version!==1)bad('version or shape');
 if(['accepted','compared','enabled'].some(k=>typeof raw[k]!=='boolean'))bad('flags');
 if(!Array.isArray(raw.evidence)||raw.evidence.length>3||new Set(raw.evidence).size!==raw.evidence.length||raw.evidence.some(id=>!definition.evidence.some(e=>e.id===id)))bad('evidence');
 if(raw.participation!==null&&!['private','coauthor'].includes(raw.participation))bad('participation');
 if(raw.resolution!==null&&!definition.resolutions.some(r=>r.id===raw.resolution))bad('resolution');
 if(!raw.accepted&&(raw.evidence.length||raw.compared||raw.participation!==null||raw.resolution!==null||raw.weapon!==null||raw.enabled))bad('unaccepted history');
 if(raw.compared&&raw.evidence.length!==3||raw.participation!==null&&!raw.compared||raw.resolution!==null&&raw.participation===null||raw.resolution==='public-correction'&&raw.participation!=='coauthor')bad('unearned comparison or permission');
 if(raw.weapon!==null&&(!raw.resolution||typeof raw.weapon!=='string'||!a?.owned?.includes(raw.weapon)||!Object.hasOwn(gear||{},raw.weapon)||gear[raw.weapon].slot!=='weapon'||gear[raw.weapon].style&&!['blade','bow'].includes(gear[raw.weapon].style)))bad('weapon entitlement');
 if(raw.enabled&&raw.weapon===null||!a?.started&&raw.accepted)bad('entry or enablement');
 return{...raw,evidence:definition.evidence.filter(e=>raw.evidence.includes(e.id)).map(e=>e.id)};
}
function eligible(state){return state?.adventure?.started===true;}
function at(sim,p){const C=G.RealmCore,E=G.RealmEarth;
 if(!C||!(sim instanceof C.Simulation)||!p||sim.room!==p.room||sim.worldDive||![p.x,p.z,sim.state.player.x,sim.state.player.z].every(Number.isFinite)||Math.hypot(sim.state.player.x-p.x,sim.state.player.z-p.z)>2.4)return false;
 return p.room===null?C.walkable(p.x,p.z,sim.navRoom)&&C.walkable(sim.state.player.x,sim.state.player.z,sim.navRoom)&&C.segment(sim.state.player,p,sim.navRoom,.035):p.room===E.ROOM&&E.walkable(p.x,p.z)&&E.walkable(sim.state.player.x,sim.state.player.z)&&C.segment(sim.state.player,p,sim.navRoom,.035);
}
function next(value){const q=status(value);if(!q?.accepted)return definition.giver;if(!q.compared)return definition.evidence.find(e=>!q.evidence.includes(e.id))||{...definition.giver,name:'Compare the marks and original order'};return{...definition.giver,name:!q.participation?'Ask how the apprentice wants to participate':!q.resolution?'Choose the correction':!q.weapon?'Inspect the optional workshop lesson':'Commission recorded'};}
function command(ctx,type,payload={},io){const sim=ctx?.sim,C=G.RealmCore,fail=error=>({ok:false,error});
 if(!C||!(sim instanceof C.Simulation)||!payload||typeof payload!=='object'||Array.isArray(payload)||payload.quest!==definition.id)return fail('Read this exact workshop commission before acting.');
 if(typeof ctx.active!=='string'||!ctx.active||payload.expectedActive!==ctx.active||payload.expectedRevision!==sim.state.adventure.revision||typeof ctx.current!=='function'||ctx.current()!==true)return fail('The character or commission changed. Read the current terms again.');
 if(!eligible(sim.state)||sim.state.adventure.hp<=0||sim.worldDive||sim.paused&&type!=='enable')return fail('Take Oren’s expedition kit and resume the world while able to act.');
 let q;try{q=validate(sim.state.adventure.earthMasterwork,sim.state.adventure,G.RealmAdventure.GEAR);}catch(e){return fail(e.message);}
 const duplicate=text=>({ok:true,duplicate:true,text});let text;
 if(type==='enable'){
  if(!q.weapon||typeof payload.enabled!=='boolean')return fail('Learn a weapon lesson first, then explicitly choose its special.');
  if(q.enabled===payload.enabled)return duplicate('That special is already selected.');
  q.enabled=payload.enabled;text=payload.enabled?'The workshop lesson is selected for its bound weapon. Equipment and recovery remain unchanged.':'The weapon’s original special is selected. Its lesson remains learned.';
 }else if(type==='inspect'){
  const p=definition.evidence.find(e=>e.id===payload.evidence);if(!q.accepted||!p||!at(sim,p))return fail('Accept the commission and reach this actual evidence to inspect it.');
  if(q.evidence.includes(p.id))return duplicate('This evidence is already retained.');
  q.evidence.push(p.id);text=p.name+' · '+p.text;
 }else{
  if(!at(sim,definition.giver))return fail('Return to the apprentice beside Oren’s workshop.');
  if(type==='accept'){if(q.accepted)return duplicate('This commission is already accepted.');q.accepted=true;text='The Masterwork Without a Name accepted. Compare the tool sample, original order and credited plaque.';}
  else if(!q.accepted)return fail('Accept this commission before making changes.');
  else if(type==='compare'){
   if(q.evidence.length!==3)return fail('Inspect all three physical records first.');
   if(payload.finding!=='maker-before-stamp')return fail('The stamp identifies the supplying workshop. Compare the earlier cutting marks with the original assigned order to identify the maker.');
   if(q.compared)return duplicate('The maker’s marks and order are already compared.');q.compared=true;text='The earlier toolmarks and original order identify the apprentice’s cutwork. The later stamp identifies the supplying workshop.';
  }else if(type==='participation'){
   if(!q.compared||!['private','coauthor'].includes(payload.participation))return fail('Compare the evidence, then ask the apprentice about participation.');
   if(q.participation)return q.participation===payload.participation?duplicate('The apprentice’s participation is already recorded.'):fail('Keep the apprentice’s recorded participation.');
   q.participation=payload.participation;text=q.participation==='coauthor'?'The apprentice agrees to co-author a correction with the evidence. A private correction also remains available.':'The apprentice asks to keep their name private. Correct the private order and remove the false public attribution.';
  }else if(type==='resolve'){
   const r=definition.resolutions.find(r=>r.id===payload.resolution);if(!r||!q.compared||!q.participation||r.id==='public-correction'&&q.participation!=='coauthor')return fail('The correction needs compared evidence and the apprentice’s recorded participation.');
   if(q.resolution)return q.resolution===r.id?duplicate('This exact correction is already retained.'):fail('This commission’s correction is already retained.');
   q.resolution=r.id;text=r.text+' The workshop offers its optional weapon lesson; nothing is learned or equipped automatically.';
  }else if(type==='learn'){
   if(!q.resolution)return fail('Finish the agreed correction before choosing a workshop lesson.');
   const g=G.RealmAdventure.GEAR[payload.weapon];if(!Object.hasOwn(G.RealmAdventure.GEAR,payload.weapon)||g.slot!=='weapon'||!sim.state.adventure.owned.includes(payload.weapon)||g.style&&!['blade','bow'].includes(g.style))return fail('Choose one weapon you already own.');
   if(q.weapon)return q.weapon===payload.weapon?duplicate('This weapon lesson was already learned.'):fail('This finite lesson is already bound to '+G.RealmAdventure.GEAR[q.weapon].name+'.');
   q.weapon=payload.weapon;text='Lesson learned for '+g.name+'. Its original special stays selected until you enable the lesson explicitly.';
  }else return fail('Unknown commission action.');
 }
 if(typeof io?.save!=='function')return fail('A durable character saver is required; nothing was changed.');
 const state=sim.state,adventure=state.adventure,room=sim.room,before=JSON.stringify(state),active=ctx.active;
 if(adventure.revision>=1e9||state.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Export this character before extending its record.');
 let checked,saved;try{
  const candidate=sim.snapshot();candidate.adventure.earthMasterwork=q;candidate.adventure.revision++;
  candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'earth-masterwork',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
  checked=C.validate(candidate);if(JSON.stringify(checked.adventure.earthMasterwork)!==JSON.stringify(validate(q,adventure,G.RealmAdventure.GEAR)))throw Error('Save validator did not retain the commission.');
  const bytes=JSON.stringify(checked);saved=io.save(checked);if(JSON.stringify(checked)!==bytes)return fail('The writer changed the checked commission; nothing was adopted.');
 }catch(e){return fail('Commission save refused: '+e.message);}
 if(!saved?.ok||saved.adopted===false||typeof saved.then==='function')return fail(saved?.error||'The commission was not saved. Your work remains unchanged.');
 if(ctx.current()!==true||ctx.active!==active||sim.state!==state||state.adventure!==adventure||sim.room!==room||JSON.stringify(state)!==before)return fail('The character changed during saving. Reopen the current commission.');
 adventure.earthMasterwork=checked.adventure.earthMasterwork;adventure.revision=checked.adventure.revision;state.journal=checked.journal;state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
const api={definition,fresh,status,validate,eligible,at,next,command};G.RealmEarthMasterwork=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
