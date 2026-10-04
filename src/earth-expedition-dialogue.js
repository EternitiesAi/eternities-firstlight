/* Original local speech for the existing provisional Elderweald people.
 * ET11/ET12 supply the living-support and limited-allocation premise, not these
 * words or biographies. Reading saved facts never accepts, records or pays work.
 */
(function(G){'use strict';
const E=G.RealmEarthExpedition||(typeof require==='function'?require('./earth-expedition.js'):null);
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
const people=freeze({
 'elderweald-rill':{id:'elderweald-rill',name:'Rill · forestkeeper'},
 'elderweald-sela':{id:'elderweald-sela',name:'Sela · herbalist'}
});
const rill=freeze({
 fresh:{title:'Timber and an open channel',lines:[
  'The storm has loosened the road beside the wetland. I need supplies carried through while its watercourse stays open.',
  'We can recover fallen timber or prepare a limited managed-coppice allocation. Read the terms and choose the work you want.',
  'The old root carries part of this route. We can support its damaged connection without clearing the organism away.'
 ],hint:'Read the expedition terms, then accept here if you want the work. The camp load board is southwest of me.'},
 'assess-load':{title:'Read the load first',lines:[
  'Thank you for taking this on. The camp load board lists what the road and watercourse need.',
  'Read it before choosing a supply. We will keep the wetland open as we carry the load through.'
 ],hint:'Walk southwest to the load board. E opens the nearby work; choose its action there.'},
 'prepare-allocation':{title:'Your practical choice',lines:[
  'The board is read. Stormfall makes the larger timber bundle; managed coppice keeps more fibre in the allocation.',
  'Choose what suits your work. Both plans keep the standing shelter and the watercourse open.'
 ],hint:'The stormfall preparation is southwest of the board; the managed plot is north. Prepare one allocation at its own work point.'},
 'read-water':{title:'Leave room for the water',lines:[
  'Check the wetland before moving the load through. The shelter and its channel still need their space.',
  'This delivery is not paid yet. Carry the chosen plan through the whole circuit, then bring it back to me.'
 ],hint:'Follow the woodland route southwest to the wetland. Check the watercourse beside Sela; her advice is optional.'},
 'clear-crossing':{title:'The north-bank pocket',lines:[
  'The watercourse check is done. The first infestation is in the pocket beside the footbridge’s north bank.',
  'Leave room to move when the skitter commits. Keep the narrow bridge lane clear while you deal with it.'
 ],hint:'Walk to the crossing pocket. Tab selects; 1 starts stationary autoattack. Brace or move during the tell, and stop walking before attacking again.'},
 'read-root-load':{title:'What the living anchor carries',lines:[
  'You have cleared the crossing pocket. The living anchor is farther west, at the north mouth of the root passage.',
  'Read what the damaged connection carries before touching the brace. The organism stays in place.'
 ],hint:'Cross the footbridge down its middle. On the far bank, follow the route west to the reading point at the passage’s north mouth.'},
 'clear-root-pests':{title:'Keep your footing on the bank',lines:[
  'You have read the living anchor. The second infestation is on the open bank east of the root passage.',
  'The brute gives a long tell. Brace or step aside without crowding yourself against the passage walls.'
 ],hint:'Meet the brute in its bank pocket. Attack with a clear lane; the old root and passage walls are not the target.'},
 'brace-root-channel':{title:'A support beside the old root',lines:[
  'Both infestation pockets are clear. The alternate brace belongs beyond the southern end of the passage wall.',
  'Set it beside the damaged connection. We are changing its support, not cutting away the living anchor.'
 ],hint:'Go south through the root corridor. Past the wall ends, fit the brace on the east side at the marked work point.'},
 'deliver-allocation':{title:'Bring the allocation through',lines:[
  'The alternate brace is fitted. The old organism remains alive, with its damaged connection supported alongside it.',
  'Take your chosen allocation to the return glade. The path leads back toward the fields rather than restarting the repair.'
 ],hint:'Deliver at the return glade southeast of the passage, then come back to the clearing camp to claim your payment.'},
 ready:{title:'Your delivery is here',lines:[
  'You have delivered the allocation. The brace stays, and the old organism remains alive.',
  'Your payment is ready and still unpaid. Ask to collect it when you have room for the complete bundle.'
 ],hint:'Choose Claim here when you are ready. Your finished delivery remains waiting until you do.'}
});
const sela=freeze({
 fresh:{title:'Room for the water',lines:[
  'The channel needs room even when timber is scarce. The standing shelter belongs to this refuge too.',
  'Rill has two practical supply plans. You can read them at the camp without taking on an errand for me.'
 ],hint:'The clearing camp is northeast along the woodland route. Speak with Rill to read and explicitly accept the expedition.'},
 'assess-load':{title:'Before choosing a bundle',lines:[
  'Start with the camp load board. It tells you which connection needs support and which channel needs to stay open.',
  'A useful supply plan begins with that reading. You need no new profession to choose one.'
 ],hint:'Return northeast to the camp load board, read it there, then choose a physical preparation.'},
 'prepare-allocation':{title:'Two useful supplies',lines:[
  'Recovering stormfall keeps more timber in the bundle. The limited managed-coppice plan keeps more fibre.',
  'Either can support the same local brace. Pick the allocation you want to carry through.'
 ],hint:'Both preparations are beside the camp: fallen timber southwest of the load board, managed growth north of it.'},
 'read-water':{title:'The check beside the channel',lines:[
  'Check the watercourse here before taking the load onward. Keeping its drainage open is part of the work.',
  'The bridge is southwest from this wetland. Approach its north bank before crossing down the middle.'
 ],hint:'E opens the watercourse check nearby. Record that action first; talking with me does not replace it.'},
 'clear-crossing':{title:'Footing before the release',lines:[
  'The wetland check is done. The skitter’s open pocket is beside the bridge’s north bank.',
  'A blade needs close reach. A bow reaches farther, but its arrow still needs a clear lane and can miss a moving target.'
 ],hint:'Tab selects; 1 starts stationary autoattack. Stop to release, then Brace or move during the tell. Walking does not keep autoattack firing.'},
 'read-root-load':{title:'Cross through the middle',lines:[
  'The crossing pocket is clear. Use the middle of the footbridge; its rails are real boundaries.',
  'On the far bank, go west to the root passage’s north mouth and read the living anchor before changing its load.'
 ],hint:'Follow the supported route to the root reading point. The old organism is part of the support, not an encounter to clear.'},
 'clear-root-pests':{title:'Leave yourself a way out',lines:[
  'The root reading is done. The brute’s pocket is on the open bank east of the passage.',
  'Give yourself space for its tell. A bow needs a clear lane; a blade needs close reach. Neither benefits from backing into a wall.'
 ],hint:'Brace or move when the brute winds up. Settle your footing before the next attack; your road home remains open.'},
 'brace-root-channel':{title:'The alternate brace',lines:[
  'Both pockets are clear. Fit the alternate support beyond the south end of the passage walls.',
  'The old organism has carried this connection for a long time. Give the damaged connection another support beside it.'
 ],hint:'Use the open root corridor, then the brace work point east of its southern mouth. The living root stays alive.'},
 'deliver-allocation':{title:'A different return',lines:[
  'The separate brace is fitted. The old organism remains alive; the return does not undo that repair.',
  'The glade is southeast of the passage. Deliver your allocation there, then return to Rill at the camp.'
 ],hint:'Follow the glade route toward the fields. Rill collects the completed delivery at the camp; I do not collect or pay it.'},
 ready:{title:'Take your completed delivery home',lines:[
  'Your allocation has reached the glade and the separate brace is fitted. The living anchor remains alive.',
  'The delivery is still unpaid. Rill is waiting at the clearing camp; there is no further errand for me.'
 ],hint:'Return northeast through the woodland route to Rill and explicitly claim the complete payment there.'}
});
const patrolAdvice=freeze({
 'inspect-water':{line:'Check the wetland course again for this circuit. Its channel and the original brace stay in place.',hint:'Follow the woodland route to the wetland and record this patrol’s watercourse inspection.'},
 'clear-crossing':{line:'This circuit’s skitter is in the north-bank pocket. A clear lane matters for an arrow; a blade needs close reach.',hint:'Select this patrol’s crossing foe. Stop for stationary autoattack; Brace or move during the tell. An older cleared pocket does not finish this circuit.'},
 'inspect-root':{line:'The crossing pocket is clear for this circuit. Read the existing support at the root passage’s north mouth.',hint:'Cross down the footbridge’s middle, then follow the far-bank route west to inspect the supported root anchor.'},
 'clear-root-pests':{line:'This circuit’s brute is in the open bank pocket east of the root passage. Leave room to Brace or step aside.',hint:'Select this patrol’s bank foe. Use a clear attack lane, and keep your retreat away from the passage walls.'},
 'inspect-glade':{line:'Both pockets are clear for this circuit. Check the return glade without rebuilding the original brace.',hint:'Follow the return route southeast to the glade and record this circuit’s last inspection, then return to Rill.'}
});
function bindingRecord(raw,claimed){
 const b=raw===undefined?E.freshBinding():raw;
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).length!==3||!['version','weapon','kind'].every(k=>Object.hasOwn(b,k))||b.version!==1)return null;
 if(b.weapon===null&&b.kind===null)return{version:1,weapon:null,kind:null};
 if(!claimed||typeof b.weapon!=='string'||!['edge','shelter'].includes(b.kind))return null;
 const A=G.RealmAdventure||(typeof require==='function'?require('./adventure.js'):null),g=A?.GEAR[b.weapon];
 if(!g||!Object.hasOwn(A.GEAR,b.weapon)||g.slot!=='weapon'||g.style&&!['blade','bow'].includes(g.style))return null;
 return{version:1,weapon:b.weapon,kind:b.kind,name:g.name};
}
function recognition(branch){return branch==='stormfall-recovery'?'You chose recovered stormfall, keeping the standing shelter trees and a larger timber allocation.':'You chose the limited managed coppice, keeping more fibre in the allocation and the work inside its marked boundary.';}
function bindingLine(b){return b.weapon?'Your Trailward '+b.kind+' binding is already on '+b.name+'. It stays with that weapon.':null;}
function paidHint(r,b){
 if(r.patrol.lastClaim===E.MAX_RUN)return'The recorded inspection circuits are complete. Other work and your road home remain open.';
 if(b.weapon)return'Your binding is complete. If you want another inspection circuit, explicitly accept a new patrol with Rill at the camp.';
 return r.story.branch==='stormfall-recovery'?'Compare at the outdoor home bench: 3 ore, 8 sunmarks and 6 fibre. If you need two more fibre, gathering or one paid patrol supplies them.':'Compare the optional binding at the outdoor home bench. It needs 3 ore, 8 sunmarks and 6 fibre; choose one owned blade or bow.';
}
function reading(personId,ledger,binding){
 if(typeof personId!=='string'||!Object.hasOwn(people,personId)||!E)return null;
 let r;try{r=E.validate(ledger);}catch{return null;}
 const b=bindingRecord(binding,r.story.claimed);if(!b)return null;
 const speaker=people[personId].name,isRill=personId==='elderweald-rill',p=E.progress(r),bound=bindingLine(b);let title,lines,hint;
 if(r.story.claimed&&r.patrol.active){
  const run=r.patrol.active.run;title='Inspection circuit '+run;lines=[recognition(r.story.branch),'The first brace stays and the old organism remains alive. This patrol inspects the route; it does not repeat the repair.'];
  if(p.patrol.ready){lines.push('Circuit '+run+' is checked. Its payment is ready and still unpaid.');hint=isRill?'Choose Claim for this circuit here when you have room for its complete payment.':'Return to Rill at the clearing camp and explicitly claim this circuit’s payment.';}
  else{const id=p.patrol.next[0].id,next=patrolAdvice[id],work=E.returnWork(r);lines.push(id==='inspect-glade'?work.line:next.line);hint=id==='inspect-glade'?'Use the supplied checking kit at the return glade, then bring this circuit back to Rill.':next.hint;}
  if(bound)lines.push(bound);
 }else if(r.story.claimed){
  title=isRill?'Your allocation is remembered':'The root keeps its support';lines=[recognition(r.story.branch)];
  if(r.patrol.lastClaim){const q=E.patrol.reward;lines.push('Patrol '+r.patrol.lastClaim+' was paid: '+q.coins+' sunmarks, '+q.ore+' ore, '+q.materials.wood+' timber and '+q.materials.fiber+' fibre.');}
  else{const q=E.definition.reward,c=E.definition.steps[1].choices.find(c=>c.id===r.story.branch);lines.push('The delivery was paid: '+q.coins+' sunmarks, '+q.ore+' ore, '+c.materials.wood+' timber and '+c.materials.fiber+' fibre.');}
  lines.push('The separate brace remains fitted and the old organism remains alive. Using your supplies does not undo that work.');if(bound)lines.push(bound);hint=paidHint(r,b);
 }else{
  const key=!r.story.accepted?'fresh':p.story.ready?'ready':p.story.next[0].id,part=(isRill?rill:sela)[key];title=part.title;lines=[...part.lines];hint=part.hint;
  if(r.story.branch)lines.unshift(recognition(r.story.branch));
 }
 return freeze({speaker,title,lines,hint});
}
const api=freeze({people,reading});G.RealmEarthExpeditionDialogue=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
