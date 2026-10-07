const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js');
const fresh=()=>new C.Simulation(C.fresh());
function step(s,t){for(let i=0;i<t*20;i++)s.tick(.05);}
function memory(){const data=new Map();return{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),data};}
test('fresh world is valid and round trips',()=>{assert.deepEqual(C.validate(C.fresh()),C.fresh());});
test('seeded world decoration is repeatable',()=>{let a=C.rng(8),b=C.rng(8);for(let i=0;i<500;i++)assert.equal(a(),b());});
test('water and nonfinite ground are not walkable',()=>{for(let p of[[90,0],[0,40],[NaN,1],[1,Infinity]])assert.equal(C.walkable(...p),false);});
test('buildings and the spring are obstacles',()=>{assert.equal(C.walkable(-11,-6),false);assert.equal(C.walkable(-1,-2.2),false);});
test('every landmark has walkable admission',()=>{for(let l of C.LANDMARKS)assert.ok(C.walkable(l.x,l.z),l.id);});
test('all 121 landmark routes exist and sampled segments avoid obstacles',()=>{for(let a of C.LANDMARKS)for(let b of C.LANDMARKS){let p=C.pathfind(a,b);assert.ok(p,`${a.id}->${b.id}`);let q=a;for(let n of p){assert.ok(C.segment(q,n),`${a.id}->${b.id}`);q=n;}}});
test('valley path checker rejects the actual sub-sample listening-room corner crossing',()=>{
 const a={x:-11,z:-1.6},b={x:-9,z:5.4};
 for(const t of [30/41,31/41])assert.ok(C.walkable(a.x+2*t,a.z+7*t),'old adjacent samples are clear');
 assert.equal(C.walkable(a.x+2*.75,a.z+7*.75),false);
 assert.equal(C.segment(a,b),false);assert.equal(C.segment(b,a),false);
 assert.equal(C.segment(a,b,{id:'outdoors',sandbox:C.fresh().sandbox}),false,'player outdoor planner uses the same valley solids');
});
test('all repaired landmark routes pass an independent one-centimetre walkability sweep',()=>{
 for(const a of C.LANDMARKS)for(const b of C.LANDMARKS){let prior=a;for(const p of C.pathfind(a,b)){
  const n=Math.max(1,Math.ceil(Math.hypot(p.x-prior.x,p.z-prior.z)/.01));
  for(let i=0;i<=n;i++)assert.ok(C.walkable(prior.x+(p.x-prior.x)*i/n,prior.z+(p.z-prior.z)*i/n),`${a.id}->${b.id} at ${i}/${n}`);prior=p;
 }}
});
test('island-to-pier sub-sample gap is refused in both directions and repaired outdoor travel arrives',()=>{
 const a={x:-1.8,z:19.8},b={x:-1.2,z:22.2};assert.equal(C.segment(a,b),false);assert.equal(C.segment(b,a),false);
 const s=fresh();s.moveTo(-11,-1.6);step(s,60);assert.ok(s.moveTo(0,27).ok);step(s,70);assert.ok(Math.hypot(s.state.player.x,s.state.player.z-27)<.1);assert.doesNotThrow(()=>s.snapshot());
});
test('support proof preserves authored outdoor bridge and frontier access with actual placed blockers',()=>{
 const S=require('../src/sandbox.js'),sandbox=S.fresh(),room={id:'outdoors',sandbox},a={x:0,z:-20.5},b={x:0,z:-40};
 assert.equal(C.segment(a,b,room),false);sandbox.bridge=true;const route=C.pathfind(a,b,room);assert.ok(route);
 let prior=a;for(const point of route){const n=Math.max(1,Math.ceil(Math.hypot(point.x-prior.x,point.z-prior.z)/.01));for(let i=0;i<=n;i++)assert.ok(C.walkable(prior.x+(point.x-prior.x)*i/n,prior.z+(point.z-prior.z)*i/n,room));prior=point;}
 sandbox.placed=[{id:1,kind:'wall',gx:0,gz:0,rotation:0}];assert.ok(S.blocks(sandbox,0,-40));assert.equal(C.segment({x:-2,z:-40},{x:2,z:-40},room),false);assert.equal(C.segment({x:-2,z:-38},{x:2,z:-38},room),true);
});
test('resident evening-to-Morning routes and later schedule changes remain valid without losing progress',()=>{
 const s=fresh(),ownership=()=>{const {elapsed:adventureTime,...adventure}=s.state.adventure,{elapsed:sandboxTime,...sandbox}=s.state.sandbox;return JSON.stringify({adventure,expedition:s.state.earthExpedition,notes:s.state.notes,score:s.state.score,sandbox});},owned=ownership();
 s.setTime(19);step(s,150);assert.ok(s.state.residents.every(r=>Math.hypot(r.x+11,r.z+1.6)<1e-9));
 for(const hour of [9,13,18.5,20.1,23,8]){s.setTime(hour);for(let i=0;i<1800;i++){s.tick(.05);for(const r of s.state.residents)assert.ok(C.walkable(r.x,r.z),`${r.id} at ${hour}, tick ${i}`);if(i%100===0)assert.doesNotThrow(()=>s.snapshot());}assert.doesNotThrow(()=>s.snapshot());}
 assert.ok(s.state.adventure.elapsed>0&&s.state.sandbox.elapsed>0,'legitimate live simulation time advances');assert.equal(ownership(),owned);
});
test('invalid segment endpoints are refused rather than skipping the sampler',()=>{
 for(const p of [{x:NaN,z:0},{x:0,z:Infinity},null]){assert.equal(C.segment(p,{x:0,z:3}),false);assert.equal(C.segment({x:0,z:3},p),false);}
});
test('click movement arrives without overshooting',()=>{let s=fresh();s.moveTo(-6,13);step(s,40);assert.ok(Math.hypot(s.state.player.x+6,s.state.player.z-13)<.1);});
test('manual motion is bounded at terrain edge',()=>{let s=fresh();for(let i=0;i<3000;i++)s.manual(1,0,.05);assert.ok(C.walkable(s.state.player.x,s.state.player.z));});
test('invalid move does not replace current route',()=>{let s=fresh();s.moveTo(0,3);let p=JSON.stringify(s.playerPath);assert.equal(s.moveTo(NaN,2).ok,false);assert.equal(JSON.stringify(s.playerPath),p);});
test('invalid tick cannot corrupt time',()=>{let s=fresh(),h=s.state.hour;s.tick(Infinity);s.tick(-1);assert.equal(s.state.hour,h);});
test('pause stops simulation',()=>{let s=fresh(),p=s.snapshot();s.paused=true;step(s,20);assert.deepEqual(s.snapshot(),p);});
test('time flow setting stops only the clock',()=>{let s=fresh(),h=s.state.hour;s.state.settings.timeFlow=false;s.moveTo(0,3);step(s,10);assert.equal(s.state.hour,h);assert.ok(Math.hypot(s.state.player.x,s.state.player.z-3)<.1);});
test('day rolls over with a new event',()=>{let s=fresh();s.state.hour=23.99999;s.tick(.1);assert.equal(s.state.day,2);assert.ok(s.state.hour<1);});
test('all three share home during supper',()=>{for(let p of C.PROFILES)assert.equal(C.schedule(p.id,19),'home');});
test('daytime projects have different destinations',()=>{assert.equal(new Set(C.PROFILES.map(p=>C.schedule(p.id,10))).size,3);});
test('routines travel to the shared house',()=>{let s=fresh();s.setTime(19);step(s,150);assert.ok([...s.runs.values()].every(r=>r.goal==='home'&&r.inside));});
test('enter requires proximity',()=>{let s=fresh();assert.equal(s.enter('home').ok,false);});
test('enter, save and leave preserve outside position',()=>{let s=fresh();s.moveTo(-11,-1.6);step(s,60);let p={...s.state.player};assert.equal(s.enter('home').ok,true);assert.deepEqual(s.snapshot().player,p);assert.equal(s.leave().ok,true);assert.deepEqual(s.state.player,p);});
test('interior table and walls collide',()=>{assert.equal(C.walkable(0,-1.5,'home'),false);assert.equal(C.walkable(6,0,'home'),false);assert.equal(C.walkable(0,3.5,'home'),true);});
test('non-interior locations cannot be entered',()=>{assert.equal(fresh().enter('shore').ok,false);});
test('planting requires being in the garden',()=>{assert.equal(fresh().act('a','plant').ok,false);});
test('twelve flowers are bounded and recoverable',()=>{let s=fresh();s.moveTo(-6,13);step(s,40);for(let i=0;i<12;i++)assert.equal(s.act(String(i),'plant').ok,true);assert.equal(s.act('full','plant').ok,false);assert.equal(C.validate(s.snapshot()).flowers.length,12);});
test('duplicate accepted command does not duplicate a note',()=>{let s=fresh();s.act('a','note',{text:'First evening'});assert.equal(s.act('a','note',{text:'First evening'}).duplicate,true);assert.equal(s.state.notes.length,1);});
test('same id with changed payload conflicts',()=>{let s=fresh();s.act('a','note',{text:'A'});assert.equal(s.act('a','note',{text:'B'}).ok,false);assert.equal(s.state.notes[0].text,'A');});
test('duplicate refusal remains refusal',()=>{let s=fresh();s.act('a','plant');s.moveTo(-6,13);step(s,40);assert.equal(s.act('a','plant').ok,false);assert.equal(s.state.flowers.length,0);});
test('notes are data, not markup',()=>{let s=fresh(),text='<img src=x onerror=alert(1)>';assert.equal(s.act('n','note',{text}).ok,true);assert.equal(s.state.notes[0].text,text);});
test('notebook enforces length and capacity',()=>{let s=fresh();assert.equal(s.act('bad','note',{text:'x'.repeat(1201)}).ok,false);for(let i=0;i<20;i++)s.act('n'+i,'note',{text:'Entry'});assert.equal(s.act('over','note',{text:'No room'}).ok,false);});
test('authored conversation records encounter without a network request',()=>{let s=fresh(),r=s.act('a','talk',{id:'ilan'});assert.equal(r.text,C.PROFILES[0].dialogue[0]);assert.equal(s.state.residents[0].conversations,1);});
test('unknown resident is rejected',()=>assert.equal(fresh().act('x','talk',{id:'ghost'}).ok,false));
test('journal retains 200 ordered entries',()=>{let s=fresh();for(let i=0;i<300;i++)s.event('test','Event');assert.equal(s.state.journal.length,200);assert.equal(s.state.journal[0].seq,101);assert.ok(C.validate(s.snapshot()));});
test('save and load accept acknowledged storage',()=>{let s=fresh(),m=memory();s.act('n','note',{text:'A note'});assert.equal(s.save(m).ok,true);assert.deepEqual(C.load(m).state,s.snapshot());});
test('quota refusal is not a saved success',()=>{assert.equal(fresh().save({setItem(){throw new Error('quota');}}).ok,false);});
test('corrupt storage is preserved rather than overwritten on load',()=>{let writes=0,r=C.load({getItem:()=>'{bad',setItem(){writes++;}});assert.equal(r.preserveExisting,true);assert.equal(writes,0);});
test('import rejects invalid locations and malformed versions',()=>{for(let update of[s=>s.version=900,s=>s.player.x=900,s=>s.hour=NaN]){let s=C.fresh();update(s);assert.throws(()=>C.validate(s));}});
test('import roster is exact and extra prototype properties are discarded',()=>{let s=C.fresh();s.extra='ignored';s.settings.__proto__={admin:true};assert.equal(C.validate(s).extra,undefined);assert.equal(C.validate(s).settings.admin,undefined);s.residents[1].id='ilan';assert.throws(()=>C.validate(s));});
test('import cannot enable audio and rejects invalid event sequence',()=>{let s=C.fresh();s.settings.sound=true;assert.equal(C.validate(s).settings.sound,false);s.journal=[{seq:-1,day:1,hour:3,kind:'x',text:'x'}];assert.throws(()=>C.validate(s));});
