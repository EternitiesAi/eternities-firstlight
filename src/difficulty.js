/* Main-path boss table. Act lanes read hp, damage and xp from here, never a private copy.
 * phases(def) is the multi-phase helper for the finale: a phase ends when its hp is spent. */
(function(G){'use strict';
const boss=(hp,damage,xp)=>Object.freeze({hp,damage,xp});
const BOSSES=Object.freeze({
 hart:boss(240,24,90),
 ram:boss(320,28,55),
 herald:boss(350,29,0),
 keeper:boss(410,30,80),
 warden:boss(520,34,110),
 seraph:boss(620,38,140),
 witness:boss(720,42,170),
 regent:Object.freeze({xp:300,phases:Object.freeze([{hp:380,damage:46},{hp:400,damage:50},{hp:420,damage:54}].map(p=>Object.freeze(p)))})
});
function get(id){if(!Object.hasOwn(BOSSES,id))throw Error('Unknown boss: '+id);return BOSSES[id];}
// Ordered phases. index() reads damage dealt; the hook runs once per phase change, never on the same phase twice.
function phases(def){
 const list=def?.phases;
 if(!Array.isArray(list)||list.length<1||list.length>4)throw Error('Boss phases: give one to four.');
 let total=0;const bounds=list.map(p=>{if(!p||!Number.isSafeInteger(p.hp)||p.hp<1||!Number.isFinite(p.damage)||p.damage<1)throw Error('Boss phases: each phase needs hp and damage.');total+=p.hp;return total;});
 const index=dealt=>{const d=Math.min(total,Math.max(0,dealt));let i=0;while(i<bounds.length-1&&d>=bounds[i])i++;return i;};
 const of=e=>index(total-e.hp);
 return Object.freeze({count:list.length,total,bounds:Object.freeze(bounds),index,of,
  damage:e=>list[of(e)].damage,
  patterns:e=>list[of(e)].patterns||[],
  step(sim,e){const next=of(e),prev=e.phase??0;e.phase=next;if(next!==prev&&typeof def.onPhase==='function')def.onPhase(sim,e,next,prev);return next;}});
}
const api={BOSSES,boss:get,phases};G.RealmDifficulty=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
