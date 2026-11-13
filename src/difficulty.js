/* Main-path boss table. Story lanes read BOSSES by key; each entry is {hp, damage, windup} and boss(id) returns a copy.
 * The regent's three phases carry their own move sets; phases(def) is the multi-phase helper the finale calls. */
(function(G){'use strict';
const phase=(hp,damage,patterns)=>Object.freeze({hp,damage,patterns:Object.freeze(patterns.slice())});
const REGENT=Object.freeze([phase(380,46,['line','double']),phase(400,50,['line','double','bait']),phase(420,54,['double','bait','line'])]);
const entry=(hp,damage,windup)=>Object.freeze({hp,damage,windup});
const BOSSES=Object.freeze({
 hart:entry(240,24,1.05),
 ram:entry(320,28,1.2),
 herald:entry(350,29,1.35),
 keeper:entry(410,30,1.2),
 foundryWarden:entry(520,34,1.2),
 relaySeraph:entry(620,38,1.2),
 witnessGuardian:entry(720,42,1.35),
 // the regent's hp is the sum of its phases and its damage the highest phase, so a top-level reader sees the whole fight.
 regent:Object.freeze({hp:REGENT.reduce((n,p)=>n+p.hp,0),damage:Math.max(...REGENT.map(p=>p.damage)),windup:1.2,phases:REGENT})
});
// A copy per call: a caller changes its own view, never the table.
function get(id){if(!Object.hasOwn(BOSSES,id))throw Error('Unknown boss: '+id);return JSON.parse(JSON.stringify(BOSSES[id]));}
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
