/* One finite community episode. Art and worker motion cannot grant its work. */
(function(G){'use strict';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const definition=freeze({id:'earthlands-bridge-community-v1',room:'world-earthlands',title:'A Place Beside the Road',
 giver:{id:'merren',name:'Merren',x:-6,z:-68},giverFittings:{id:'vessa',name:'Vessa',x:-7,z:97},
 sites:{shelter:{id:'shelter',name:'The settlement bench',x:-9,z:-63.5},'river-lookout':{id:'river-lookout',name:'The shore observation stand',x:30,z:-20}},
 reward:{coins:10,wood:2,fiber:4},steps:['fittings','fit','inspect']});
const fresh=()=>({version:1,accepted:false,choice:null,steps:[],claimed:false});
function validate(raw){
 if(raw===undefined)return fresh();const no=()=>{throw Error('Invalid bridge community history.');};
 if(!raw||raw.version!==1||typeof raw.accepted!=='boolean'||typeof raw.claimed!=='boolean'||!Array.isArray(raw.steps)||new Set(raw.steps).size!==raw.steps.length||raw.steps.some(s=>!definition.steps.includes(s)))no();
 if(!raw.accepted&&(raw.choice!==null||raw.steps.length||raw.claimed))no();
 if(raw.choice!==null&&!Object.hasOwn(definition.sites,raw.choice))no();
 if(raw.steps.includes('fit')!==Boolean(raw.choice)||raw.steps.includes('fit')&&!raw.steps.includes('fittings')||raw.steps.includes('inspect')&&!raw.steps.includes('fit')||raw.claimed&&!raw.steps.includes('inspect'))no();
 return{version:1,accepted:raw.accepted,choice:raw.choice,steps:definition.steps.filter(s=>raw.steps.includes(s)),claimed:raw.claimed};
}
function at(sim,p){const W=G.RealmWorldFoundations,player=sim?.state?.player;return !!sim&&!!p&&sim.room===definition.room&&!sim.worldDive&&sim.state.adventure.hp>0&&G.RealmTrails.at(sim,{...p,medium:'dry'})&&W.walkable(sim.room,p.x,p.z)&&Math.abs(W.height(sim.room,player.x,player.z)-W.height(sim.room,p.x,p.z))<.08&&W.segment(sim.room,player,p);}
function next(state){const r=state.bridgeCommunity;if(!r.accepted)return[{...definition.giver,id:'accept',name:'Ask Merren about a place beside the road'}];if(r.claimed)return[];
 if(!r.steps.includes('fittings'))return[{...definition.giverFittings,id:'fittings',name:'Collect Vessa’s labelled fittings'}];
 if(!r.steps.includes('fit'))return Object.entries(definition.sites).map(([choice,p])=>({...p,id:'fit-'+choice,choice,name:'Fit '+p.name}));
 if(!r.steps.includes('inspect'))return[{...definition.sites[r.choice],id:'inspect',name:'Inspect the worker’s fitted place'}];
 return[{...definition.giver,id:'claim',name:'Return to Merren · completed, unpaid'}];
}
function worker(sim){
 const r=sim.state.bridgeCommunity;if(sim.room!==definition.room||!r.steps.includes('fit'))return null;
 const site=definition.sites[r.choice],end={x:site.x+1.1,z:site.z+(r.choice==='shelter'?-.65:0)},start={x:end.x,z:end.z+1.45};
 const clock=Math.max(0,Number.isFinite(sim.elapsed)?sim.elapsed:0),t=clock%12,walking=t<3||t>=7&&t<10,forward=t<3,u=t<3?t/3:t<7?1:t<10?1-(t-7)/3:0;
 return{x:start.x,z:start.z+(end.z-start.z)*u,yaw:walking?(forward?Math.PI:0):r.choice==='shelter'?Math.PI:Math.PI/2,phase:(t<3?t/3:t<7?1:t<10?1+(t-7)/3:2)*1.45/1.35*Math.PI*2,walking,working:t>=3&&t<7,work:r.choice,time:clock,paused:sim.paused,reducedMotion:sim.state.settings.reducedMotion};
}
function command(ctx,type,payload={},io){
 const sim=ctx?.sim,fail=error=>({ok:false,error});if(!sim||sim.room!==definition.room||sim.worldDive||sim.state.adventure.hp<=0)return fail('Reach the dry Coastward road while able to act.');
 if(payload.quest!==undefined&&payload.quest!==definition.id)return fail('Unknown community episode.');
 if(payload.expectedRevision!==undefined&&payload.expectedRevision!==sim.state.adventure.revision)return fail('This character changed. Read the current work again.');
 const current=sim.state.bridgeCommunity;
 if(type==='accept'&&current.accepted||type==='claim'&&current.claimed)return{ok:true,duplicate:true,text:type==='claim'?'This community episode was already paid once.':'Your accepted community work is retained.'};
 const candidate=sim.snapshot(),r=candidate.bridgeCommunity;let text;
 if(type==='accept'){
  if(!sim.state.adventure.started||!at(sim,definition.giver))return fail('Collect the initial kit and speak to Merren.');
  r.accepted=true;text='A Place Beside the Road accepted. Vessa supplies the fittings. Choose the shelter or river stand after returning. Fee: 10 sunmarks, 2 timber, 4 meadow fibre; no XP or personal-material cost.';
 }else if(type==='fittings'){
  if(!r.accepted||r.claimed||!at(sim,definition.giverFittings))return fail('Take the accepted work to Vessa’s bridge-bank service point.');
  if(r.steps.includes('fittings'))return{ok:true,duplicate:true,text:'The labelled fittings are already carried.'};
  r.steps.push('fittings');text='Vessa’s labelled braces and ties are carried. These supplied job parts are separate from equipment and ordinary inventory.';
 }else if(type==='fit'){
  if(!r.accepted||r.claimed||!r.steps.includes('fittings')||!Object.hasOwn(definition.sites,payload.choice)||!at(sim,definition.sites[payload.choice]))return fail('Carry the fittings back to one of the two supported work sites.');
  if(r.steps.includes('fit'))return r.choice===payload.choice?{ok:true,duplicate:true,text:'This selected arrangement is already fitted.'}:fail('Your installed arrangement is retained.');
  if(payload.assembly!=='matched')return fail('The unequal braces need matching sockets. Crossed braces cannot support this work; nothing changed.');
  r.choice=payload.choice;r.steps.push('fit');text=r.choice==='shelter'?'The supplied canopy is fitted over the existing settlement bench. Inspect the worker’s sheltered sorting place.':'The supplied observation stand is fitted on the existing shore. Inspect the worker’s river-reading place.';
 }else if(type==='inspect'){
  if(!r.steps.includes('fit')||r.claimed||!at(sim,definition.sites[r.choice]))return fail('Inspect the selected fitted place on its supported approach.');
  if(r.steps.includes('inspect'))return{ok:true,duplicate:true,text:'This inspection is already recorded.'};
  r.steps.push('inspect');text='The matched braces are seated and the road worker has a usable place. Return to Merren for the declared fee.';
 }else if(type==='claim'){
  if(!r.accepted||!r.steps.includes('inspect')||!at(sim,definition.giver))return fail('Finish the physical inspection and return to Merren.');
  const a=candidate.adventure,inv=candidate.sandbox.inventory,fee=definition.reward;
  if(a.coins+fee.coins>9999||inv.wood+fee.wood>G.RealmSandbox.MAX||inv.fiber+fee.fiber>G.RealmSandbox.MAX)return fail('Make room for all 10 sunmarks, 2 timber and 4 meadow fibre. Completed work stays unpaid; nothing changed.');
  a.coins+=fee.coins;inv.wood+=fee.wood;inv.fiber+=fee.fiber;r.claimed=true;
  text='Merren recognizes your '+(r.choice==='shelter'?'sheltered sorting place':'river observation stand')+'. +10 sunmarks, +2 timber, +4 meadow fibre, paid once. The crossing route-board design is learned; craft and place it deliberately at home.';
 }else return fail('Unknown community action.');
 if(candidate.adventure.revision>=1e9||candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Record limit reached; export before continuing.');
 candidate.adventure.revision++;candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'bridge-community',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
 let checked,saved;try{checked=G.RealmCore.validate(candidate);saved=io?.save?.(checked);}catch(e){return fail('Community save refused: '+e.message);}
 if(saved?.then||saved?.ok!==true)return fail(saved?.error||'Community save refused. No work, fee or inventory was changed.');
 sim.state.bridgeCommunity=checked.bridgeCommunity;sim.state.adventure.coins=checked.adventure.coins;sim.state.adventure.revision=checked.adventure.revision;Object.assign(sim.state.sandbox.inventory,checked.sandbox.inventory);sim.state.journal=checked.journal;sim.state.nextEvent=checked.nextEvent;
 return{ok:true,text};
}
const api={definition,fresh,validate,at,next,worker,command};G.RealmBridgeCommunity=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
