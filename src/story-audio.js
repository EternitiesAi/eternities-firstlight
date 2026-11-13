/* The score and the story cues, read from the realm's state each frame. The stage comes from the story
 * modules (night, saga, finale); the room and the battle come from the sim. Cues fire on edges only.
 * Reads only: no save, no command, and nothing here changes a story outcome. */
(function(G){'use strict';
const seen=new WeakMap();
const claimed=sim=>G.RealmAdventure.runtime(sim).enemies.some(e=>e.nightClaim&&e.hp>0);
const near=(sim,radius)=>{const p=sim.state.player;return G.RealmAdventure.runtime(sim).enemies.some(e=>e.hp>0&&!e.hidden&&Math.hypot(e.x-p.x,e.z-p.z)<radius);};
// one stage at a time: the finale and the epilogue own the score, then the night, then the nearshore.
function stageOf(sim){
 const s=sim.state.saga||{};
 if(s.credits||s.finale?.won)return'credits';
 if(s.finale?.phase>=1)return'finale';
 if(claimed(sim))return'night-claim';
 if(G.RealmNight.stage(sim.state)==='quiet')return'night-quiet';
 if(s.briar?.state==='nearshore')return'nearshore';
 return null;
}
// the input sceneTrack reads. a hostile in the hell or heaven campaign is a battle; elsewhere only a target is.
function input(sim){
 const room=sim.room||'',hostile=(room==='world-hell'||room==='world-heaven')&&near(sim,12);
 return{room,battle:!!G.RealmCombat.selected(sim)||hostile,stage:stageOf(sim)};
}
function tick(sim){
 const s=sim.state.saga||{},was=seen.get(sim)||{briar:null,phase:0,held:false};
 const phase=s.finale?.phase||0,held=G.RealmFeatherSight.held()===true;
 G.RealmAudio.scene(input(sim));
 if(s.briar?.state==='taken'&&was.briar!=='taken')G.RealmAudio.event('briar-taken');
 if(phase>was.phase)G.RealmAudio.event('stinger');
 if(held&&!was.held)G.RealmAudio.event('shimmer');
 seen.set(sim,{briar:s.briar?.state||null,phase,held});
}
G.RealmStoryAudio=Object.freeze({input,stageOf,tick});
if(typeof module!=='undefined'&&module.exports)module.exports=G.RealmStoryAudio;
})(typeof window!=='undefined'?window:globalThis);
