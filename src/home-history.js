/* Finite, deliberate traces of local work at home. No equipment power, free
 * duplicates, commission payout or storage owner lives in this module. */
(function(G){'use strict';
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;},clone=o=>JSON.parse(JSON.stringify(o));
const definitions=freeze([
 {id:'memory-cuttings',name:'Returned-cuttings tray',realm:'heaven',quest:'heaven-propagation-bed-v1',cost:{wood:2,fiber:2},w:1.2,d:.72,solid:true,glyph:'♧',color:'#9dbd8b',description:'A shallow slotted tray of separate cuttings, learned from Yselle’s nursery. These plants are decorative; public beds and your growing crops keep their own lives.'},
 {id:'memory-refuge',name:'Refuge hand-lamp',realm:'hell',quest:'hell-refuge-water-v1',cost:{stone:2,wood:1,fiber:1},w:.65,d:.65,solid:true,glyph:'◉',color:'#dca175',description:'A squat wick lamp with stone ballast, a timber handle and an open protective guard. A steady light to set beside a page or water jug, remembering practical refuge work.'},
 {id:'memory-bellglass',name:'Bellglass reading lamp',realm:'atlantis',quest:'atlantis-bellglass-lamp-v1',cost:{wood:2,crystal:1},w:.62,d:.62,solid:true,glyph:'◇',color:'#8dd4d2',description:'A tall keyed crystal instrument with a copper collar and directional hood, adapted from Sahra’s maintained visitor light.'},
 {id:'memory-farroad',name:'Farroad page stand',realm:'cosmos',quest:'cosmos-drawing-shelf-v1',cost:{wood:2,fiber:1},w:1.2,d:.8,solid:true,glyph:'▱',color:'#c1b5e2',description:'A braced writing surface with a tied travel folio. Anik’s shaped supports and the refuge’s room for a page return to ordinary life.'},
 {id:'memory-crossing',name:'Crossing route-board',realm:'earthlands',source:'bridgeCommunity',quest:'earthlands-bridge-community-v1',cost:{wood:2,fiber:1},w:.95,d:.65,solid:true,glyph:'≋',color:'#a9c1ad',description:'A standing timber chart with the channel crossing marked by a tied route line. Learned through Merren and Vessa’s practical community work; a deliberate trace of the road at home.'}
]);
const definition=id=>definitions.find(d=>d.id===id)||null;
const fresh=()=>({version:1,revision:0,owned:[],pinned:null});
function validate(raw){
 if(raw===undefined)return fresh();
 if(!raw||raw.version!==1||!Number.isSafeInteger(raw.revision)||raw.revision<0||raw.revision>1e8||!Array.isArray(raw.owned)||raw.owned.length>definitions.length||new Set(raw.owned).size!==raw.owned.length||raw.owned.some(id=>!definition(id))||raw.pinned!==null&&!definition(raw.pinned))throw Error('Invalid home history.');
 return{version:1,revision:raw.revision,owned:definitions.filter(d=>raw.owned.includes(d.id)).map(d=>d.id),pinned:raw.pinned};
}
const unlocked=(state,d)=>d.source==='bridgeCommunity'?state.bridgeCommunity?.claimed===true:state.localLife?.records?.[d.quest]?.claimed===true;
function validateLayout(home,ledger){
 const seen=new Set();for(const i of home.items)if(definition(i.kind)){if(!ledger.owned.includes(i.kind)||seen.has(i.kind))throw Error('An earned home piece must be owned and placed only once.');seen.add(i.kind);}return home;
}
function validateWorld(state){
 for(const id of state.homeHistory.owned)if(!unlocked(state,definition(id)))throw Error('Home craft without its claimed local commission.');
 validateLayout(state.retreat,state.homeHistory);return state;
}
const layoutAllowed=(home,ledger)=>{try{validateLayout(home,ledger);return true;}catch(_){return false;}};
const layoutAction=type=>['decorate','layout-undo','layout-redo'].includes(type);
function command(ctx,type,payload={},io){
 const sim=ctx?.sim,fail=error=>({ok:false,error});if(!sim)return fail('No current home owner.');
 const d=definition(payload.kind),current=sim.state.homeHistory;
 if(type==='craft'&&d&&current.owned.includes(d.id))return{ok:true,duplicate:true,text:'Your one '+d.name+' is already made. Remove and place it again without another cost.'};
 if(payload.expectedRevision!==(layoutAction(type)?sim.state.retreat.revision:current.revision))return fail('This home project or layout changed. Read the current state before trying again.');
 let candidate,trial,result,text;
 try{
  candidate=sim.snapshot();
  if(layoutAction(type)){
   trial=new G.RealmCore.Simulation(candidate);trial.room=sim.room;trial.returnPos=clone(sim.returnPos);trial.state.player=clone(sim.state.player);
   trial.homeUndo=clone(sim.homeUndo);trial.homeRedo=clone(sim.homeRedo);
   result=trial.act('home-layout',type,payload);if(!result.ok)return result;
   candidate=trial.snapshot();text=result.text;
  }else{
   if(current.revision>=1e8)return fail('Home project revision limit reached.');
   if(type==='pin'){
    if(payload.kind!==null&&!d)return fail('Choose a known home project.');
    if(current.pinned===payload.kind)return{ok:true,duplicate:true,text:'This home project is already tracked.'};
    candidate.homeHistory.pinned=payload.kind;text=d?'Home project pinned: '+d.name+'. Reading or pinning accepts no commission.':'Home project unpinned.';
   }else if(type==='craft'){
    if(!d||!unlocked(candidate,d))return fail('Finish and claim the matching local commission to learn this design.');
    if(sim.paused||sim.state.adventure.hp<=0||sim.room||!G.RealmSandbox.station(sim.state.sandbox,sim.state.player))return fail('Return to an existing outdoor workbench while able to work.');
    if(!G.RealmSandbox.checkCost(candidate.sandbox,d.cost))return fail('Gather the displayed materials first. Nothing was spent.');
    if(current.owned.length>=definitions.length)return fail('All finite home pieces are already owned.');
    for(const[k,n]of Object.entries(d.cost))candidate.sandbox.inventory[k]-=n;
    candidate.homeHistory.owned.push(d.id);text=d.name+' made once. Choose a retreat position deliberately; nothing was placed or replaced.';
   }else return fail('Unknown home action.');
   candidate.homeHistory.revision++;
   if(candidate.nextEvent>=Number.MAX_SAFE_INTEGER-1)return fail('Journal event limit reached.');
   candidate.journal.push({seq:candidate.nextEvent++,day:candidate.day,hour:candidate.hour,kind:'home-memory',text:text.slice(0,350)});if(candidate.journal.length>200)candidate.journal.shift();
   result={ok:true,text};
  }
  candidate=G.RealmCore.validate(candidate);
 }catch(e){return fail('Home transaction refused: '+e.message);}
 if(typeof io?.save!=='function')return fail('A synchronous home saver is required. Nothing changed.');
 let saved;try{saved=io.save(candidate);}catch(e){return fail('Home save refused: '+e.message);}
 if(saved?.then||saved?.ok!==true)return fail(saved?.error||'Home save refused. Costs, arrangement and history stay unchanged.');
 if(layoutAction(type)){sim.state.retreat=candidate.retreat;sim.homeUndo=trial.homeUndo;sim.homeRedo=trial.homeRedo;sim.playerPath=[];}
 else{sim.state.homeHistory=candidate.homeHistory;Object.assign(sim.state.sandbox.inventory,candidate.sandbox.inventory);sim.state.journal=candidate.journal;sim.state.nextEvent=candidate.nextEvent;}
 return result;
}
const api={definitions,definition,fresh,validate,validateLayout,validateWorld,unlocked,layoutAllowed,layoutAction,command};G.RealmHomeHistory=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
