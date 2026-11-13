'use strict';
// The score for every story room and stage. The pure table is checked for each room and stage; a real sim is driven
// into each story state so the stage reads the actual night, saga, finale and feather state.
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const H=require('./helpers/footfall-audio.cjs');
for(const f of ['audio.js','core.js','adventure.js','combat.js','night.js','saga.js','feather-sight.js','story-audio.js'])require(path.join(H.ROOT,'src',f));
const RA=globalThis.RealmAudio,SA=globalThis.RealmStoryAudio,G=globalThis;
const track=input=>RA.sceneTrack(input);
const sim=(room='world-earthlands',x=-5,z=-48)=>H.actualSim(room,x,z);
let serial=0;
const addEnemy=(s,extra={})=>{const e={id:'t'+(++serial),hp:9,x:s.state.player.x+1,z:s.state.player.z,hidden:false,...extra};G.RealmAdventure.runtime(s).enemies.push(e);return e;};
test('every room maps to its score, and the place decides when no story stage or battle does',()=>{
 const rooms={'':'valley',riverbank:'valley',range:'valley',mine:'valley','world-earthlands':'valley','earth-hearthwater-approach':'valley',road:'road',crossing:'road','world-hell':'hell','world-heaven':'heaven','world-atlantis':'sea','cosmos-near-expanse':'cosmos'};
 for(const [room,expected] of Object.entries(rooms))assert.deepEqual(track({room}),{track:expected,level:1},room);
});
test('every story stage maps to its score; credits and the finale win over a battle, and the night and nearshore beat the place',()=>{
 assert.deepEqual(track({room:'world-hell',stage:'credits'}),{track:'credits',level:1});
 assert.deepEqual(track({room:'world-hell',stage:'credits',battle:true}),{track:'credits',level:1});
 assert.deepEqual(track({room:'world-heaven',stage:'finale',battle:true}),{track:'finale',level:1});
 assert.deepEqual(track({room:'road',stage:'night-claim'}),{track:'battle',level:1});
 assert.deepEqual(track({room:'road',stage:'night-quiet'}),{track:'valley',level:0.12});
 assert.deepEqual(track({room:'world-heaven',stage:'nearshore'}),{track:'sea',level:0.55});
 assert.deepEqual(track({room:'road',stage:'night-quiet',battle:true}),{track:'battle',level:1});
 assert.deepEqual(track({room:'world-hell',battle:true}),{track:'battle',level:1});
});
test('the night: wraiths up is a battle, the quiet after is near silence, and a lit night with no wraiths keeps the place',()=>{
 const s=sim('road',0,0);
 s.state.night={started:true,envoy:false,safe:[]};
 assert.equal(SA.stageOf(s),null);
 assert.deepEqual(track(SA.input(s)),{track:'road',level:1});
 const wraith=addEnemy(s,{nightClaim:true});
 assert.equal(SA.stageOf(s),'night-claim');
 assert.deepEqual(track(SA.input(s)),{track:'battle',level:1});
 wraith.hp=0;
 assert.equal(SA.stageOf(s),null);
 s.state.saga.beats.night={day:1};
 assert.equal(SA.stageOf(s),'night-quiet');
 assert.deepEqual(track(SA.input(s)),{track:'valley',level:0.12});
});
test('the nearshore is soft sea until Briar is home, and the finale owns the score through its three phases until it is won',()=>{
 const s=sim('world-heaven',0,0);
 s.state.saga.briar.state='nearshore';
 assert.deepEqual(track(SA.input(s)),{track:'sea',level:0.55});
 for(const phase of [1,2,3]){s.state.saga.finale.phase=phase;assert.deepEqual(track(SA.input(s)),{track:'finale',level:1},'phase '+phase);}
 s.state.saga.finale.won=true;
 assert.deepEqual(track(SA.input(s)),{track:'credits',level:1});
});
test('the credits and the epilogue play the credits track, and the postgame returns to the place',()=>{
 const s=sim('world-hell',0,0);
 s.state.saga.credits=true;
 assert.deepEqual(track(SA.input(s)),{track:'credits',level:1});
 s.state.saga.credits=false;
 assert.deepEqual(track(SA.input(s)),{track:'hell',level:1});
});
test('hell and heaven: a hostile near the player is a battle, a distant or missing one is not, and a target is a battle anywhere',()=>{
 const heaven=sim('world-heaven',0,0);
 assert.deepEqual(track(SA.input(heaven)),{track:'heaven',level:1});
 addEnemy(heaven,{x:30,z:0});
 assert.deepEqual(track(SA.input(heaven)),{track:'heaven',level:1});
 const near=addEnemy(heaven,{x:4,z:0});
 assert.deepEqual(track(SA.input(heaven)),{track:'battle',level:1});
 near.hp=0;
 assert.deepEqual(track(SA.input(heaven)),{track:'heaven',level:1});
 const hell=sim('world-hell',0,0);
 const target=addEnemy(hell,{x:6,z:0});
 G.RealmCombat.runtime(hell).target=target.id;
 assert.deepEqual(track(SA.input(hell)),{track:'battle',level:1});
});
test('the story cues fire once on their edge: Briar taken, a finale phase begins, the feather sight comes on',()=>{
 const seen={scenes:[],events:[]};
 globalThis.RealmAudio={scene:i=>seen.scenes.push(i),event:n=>seen.events.push(n)};
 try{
  const s=sim('road',0,0);
  s.state.saga.briar.state='with';SA.tick(s);
  s.state.saga.briar.state='taken';SA.tick(s);SA.tick(s);
  assert.deepEqual(seen.events,['briar-taken']);
  s.state.saga.finale.phase=1;SA.tick(s);SA.tick(s);
  assert.deepEqual(seen.events,['briar-taken','stinger']);
  s.sagaCommand=(id,type,payload)=>({ok:true});
  s.state.saga.feather.unlocked=true;
  G.RealmFeatherSight.hold(s,true);SA.tick(s);SA.tick(s);
  assert.deepEqual(seen.events,['briar-taken','stinger','shimmer']);
  G.RealmFeatherSight.hold(s,false);
  assert.equal(seen.scenes.length,7);
 }finally{globalThis.RealmAudio=RA;}
});
