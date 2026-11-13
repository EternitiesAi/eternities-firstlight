/* Boss contract for the main path. Act lanes read this table; the fight lane owns the formulas.
 * hp and damage rise along the path: hart, ram, herald, keeper, foundry warden, relay seraph, witness guardian, regent.
 * hart and ram keep their current adventure.js and road.js numbers; herald moves 27 to 29 so the path only rises. */
(function(G){'use strict';
const BOSSES={
 hart:{hp:240,damage:24,windup:1.05},
 ram:{hp:320,damage:28,windup:1.2},
 herald:{hp:350,damage:29,windup:1.05},
 keeper:{hp:410,damage:30,windup:1.05},
 foundryWarden:{hp:520,damage:34,windup:1.05},
 relaySeraph:{hp:620,damage:40,windup:1.05},
 witnessGuardian:{hp:720,damage:46,windup:1.05},
 regent:{hp:1200,damage:58,windup:.9,phases:[
  {hp:380,damage:50,patterns:['homecoming-line']},
  {hp:400,damage:54,patterns:['homecoming-line','homecoming-annulus']},
  {hp:420,damage:58,patterns:['homecoming-line','homecoming-annulus','false-shelter']}
 ]}
};
const copy=v=>JSON.parse(JSON.stringify(v));
// unknown ids return null so a story lane can fall back to its own numbers.
function boss(id){return Object.prototype.hasOwnProperty.call(BOSSES,id)?copy(BOSSES[id]):null;}
// phases in fight order; from and to are the boss's remaining hp at each edge of the phase.
function phases(def){
 if(!def||!Array.isArray(def.phases))return[];
 let left=def.phases.reduce((sum,p)=>sum+p.hp,0);
 return def.phases.map((p,i)=>{const from=left;left-=p.hp;return{index:i+1,hp:p.hp,damage:p.damage,patterns:[...p.patterns],from,to:left};});
}
const api={BOSSES,boss,phases};
G.RealmDifficulty=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
