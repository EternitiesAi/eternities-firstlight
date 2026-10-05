/* CPU installed-host checks. Actual source bytes/owners run without module
 * overlays. DOM/renderer batches and unrelated UI lifecycle are
 * labelled sinks; actor poses, phase bounds and EH history are synthetic units.
 * No game checkout, browser/GPU, earned/native or pixel completion claim. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const P=require('./earth_homecoming_host_helpers.cjs'),{C,A,H,D,W,CS,E,T,ROOT,fixture,actor,synthetic,step,empty,copy}=P;
const all=o=>Object.values(o).flat(),commandPayload=f=>({quest:D.id,expectedActive:f.mem.store.active,expectedRevision:f.sim.state.adventure.revision});
function elements(f,type,id=''){const b=f.rpg.earthHomecoming.binding;return{dataset:{rpg:'earth-homecoming-'+type,id,binding:String(b.id),revision:String(b.revision)}};}
function windup(f,e,d=2){Object.assign(f.sim.state.player,{x:e.x,z:e.z+d});assert.ok(W.walkable(D.room,f.sim.state.player.x,f.sim.state.player.z,.31));f.sim.tick(.05);assert.equal(e.mode,'windup');assert.ok(Object.isFrozen(e.strike));return e.strike;}
function worldArt(f){const obj=Object.create(global.RealmArt.WorldArt.prototype);obj.room=f.sim.room;obj.e={camera:{projection:'perspective',eye:[0,10,0]},viewShelters:[]};obj.person=()=>{};obj.traveler=()=>{};for(const n of ['dynamicRound','dynamicBox','dynamicOcta','dynamicDisc'])obj[n]={items:[]};obj.update(f.sim,0,null);return{obj,parts:[...obj.dynamicRound.items,...obj.dynamicBox.items,...obj.dynamicOcta.items,...obj.dynamicDisc.items]};}

test('actual RPG constructor owns one EH component and retains old menu/tracker/weapon fields',()=>{
 const f=fixture(C.fresh());assert.ok(f.rpg.earthHomecoming instanceof global.RealmEarthHomecomingUI.EarthHomecomingUI);assert.equal(f.rpg.tab,'equipment');assert.equal(f.rpg.quest,'story');assert.equal(f.rpg.search,'');assert.equal(f.rpg.recipe,'trail_bow');assert.equal(f.rpg.previewYaw,.5);
 const source=P.overlay.read('rpg-ui.js');for(const s of ["button('Road home','track','earth-homecoming'", "['characters','Characters']", "['classes','Path']", "['atlas','Map']"])assert.ok(source.includes(s));
});
test('actual RPG read/close hands fresh ineligible interaction to original initial-kit and starter owners',()=>{
 const f=fixture(C.fresh());f.place(D.giver);const before=copy(f.sim.state);f.rpg.open('earth-homecoming');assert.match(f.nodes.get('#rpg-content').innerHTML,/Finish these accounts before accepting/);f.rpg.close();assert.deepEqual(f.sim.state,before);
 assert.equal(f.rpg.interact(),false);assert.equal(f.old.context(),'Take Oren’s expedition supplies');assert.equal(f.old.interact(),true);assert.equal(f.sim.state.adventure.started,true);assert.deepEqual(f.sim.state.earthHomecoming,H.fresh());
 assert.equal(f.rpg.interact(),true);assert.equal(f.rpg.tab,'starter');assert.equal(f.sim.state.earthHomecoming.accepted,false);
});
test('actual UI acceptance crosses captured app writer into real Character Store before live adoption',()=>{
 const f=fixture();f.place(D.giver);f.rpg.open('earth-homecoming');let savedBeforeAdopt=false;const original=f.mem.storage.setItem;
 f.mem.storage.setItem=(key,text)=>{savedBeforeAdopt=!f.sim.state.earthHomecoming.accepted&&JSON.parse(text).slots.find(s=>s.id===f.mem.store.active).world.earthHomecoming.accepted;original(key,text);};
 const balance=copy(f.sim.state.adventure.equipment);f.rpg.action(elements(f,'accept'));
 assert.ok(savedBeforeAdopt);assert.equal(f.sim.state.earthHomecoming.accepted,true);assert.equal(f.rpg.quest,'earth-homecoming');assert.deepEqual(f.sim.state.adventure.equipment,balance);assert.equal(JSON.parse(f.mem.values.get(CS.KEY)).slots[1].world.earthHomecoming.accepted,true);
});
test('ordinary UI host command refuses storage failure without UI fallback grants',()=>{
 const f=fixture();f.place(D.giver);f.rpg.open('earth-homecoming');const before=copy(f.sim.state);f.mem.storage.setItem=()=>{throw Error('labelled CPU storage refusal');};f.rpg.action(elements(f,'accept'));assert.deepEqual(f.sim.state,before);assert.ok(f.calls.some(s=>typeof s==='string'&&s.includes('save refused')));
});
test('bound EH exhaustion writer rejects changed sim/state/store/active before save',()=>{
 for(const change of [f=>{f.app.context.sim=new C.Simulation(C.fresh());},f=>{f.sim.state=copy(f.sim.state);},f=>{f.app.context.characterStore={...f.mem.store};},f=>{f.mem.store.record.active='character-1';}]){
  const f=fixture();const ctx=f.app.worldContext(),write=ctx.sim.earthHomecomingSave,native=f.mem.values.get(CS.KEY);change(f);assert.equal(write(f.sim.snapshot()).ok,false);assert.equal(f.mem.values.get(CS.KEY),native);
 }
});
test('bound UI writer rejects active/store switches during the actual synchronous save',()=>{
 for(const change of [f=>{f.mem.store.record.active='character-1';},f=>{f.app.context.characterStore={};}]){
  const f=fixture();f.place(D.giver);const save=f.mem.store.save.bind(f.mem.store);f.mem.store.save=s=>{const result=save(s);change(f);return result;};const r=f.app.command('accept',commandPayload(f));assert.equal(r.ok,false);assert.equal(f.sim.state.earthHomecoming.accepted,false);
 }
});
test('ordinary real Store revisions can advance without making the bound combat writer permanently stale',()=>{
 const f=fixture();const write=f.app.worldContext().sim.earthHomecomingSave,revision=f.mem.store.revision;f.sim.tick(.1);assert.ok(f.mem.store.save(f.sim.snapshot()).ok);assert.ok(f.mem.store.revision>revision);assert.ok(write(f.sim.snapshot()).ok);
});
test('changing workspace/closing/reset clears actual pending bindings without changing stored history or unrelated controls',()=>{
 const f=fixture();synthetic(f,'passage-secured');f.place(step('aftermath'));f.rpg.open('earth-homecoming');f.rpg.action(elements(f,'review','public-watch'));assert.ok(f.rpg.earthHomecoming.pending);const before=copy(f.sim.state);f.rpg.search='retained search';f.rpg.craftFilter='charms';f.rpg.recipe='long_bow';
 f.rpg.open('journal');assert.equal(f.rpg.earthHomecoming.pending,null);assert.equal(f.rpg.earthHomecoming.binding,null);assert.equal(f.rpg.search,'retained search');assert.equal(f.rpg.craftFilter,'charms');assert.equal(f.rpg.recipe,'long_bow');assert.deepEqual(f.sim.state,before);
 f.rpg.earthHomecoming.pending={synthetic:true};f.rpg.close();assert.equal(f.rpg.earthHomecoming.pending,null);f.rpg.earthHomecoming.binding={synthetic:true};f.rpg.reset();assert.equal(f.rpg.earthHomecoming.binding,null);assert.deepEqual(f.sim.state,before);
});
test('cancelled or stale UI submenu confirmation cannot adopt the junction aftermath',()=>{
 for(const action of ['cancel','switch-active','switch-tab']){
  const f=fixture();synthetic(f,'passage-secured');f.place(step('aftermath'));f.rpg.open('earth-homecoming');f.rpg.action(elements(f,'review','reviewed-custody'));assert.equal(f.sim.state.earthHomecoming.choice,null);const confirm=elements(f,'confirm','reviewed-custody');
  if(action==='cancel')f.rpg.action(elements(f,'cancel'));else if(action==='switch-active')f.mem.store.record.active='character-1';else f.rpg.open('journal');f.rpg.action(confirm);assert.equal(f.sim.state.earthHomecoming.choice,null);
 }
});

test('actual UI claim saves the complete fixed fee once and cold Store reload preserves both characters and chosen history',()=>{
 for(const choice of D.choices){
  const f=fixture();synthetic(f,'home-return',choice.id);f.place(D.claim);f.rpg.open('earth-homecoming');const prior=copy(f.sim.state),other=copy(f.mem.store.record.slots[0]);let writes=0;const write=f.mem.storage.setItem;
  f.mem.storage.setItem=(k,v)=>{writes++;assert.equal(f.sim.state.earthHomecoming.claimed,false,'fee is written before live adoption');write(k,v);};f.rpg.action(elements(f,'claim'));assert.equal(writes,1);assert.equal(f.sim.state.earthHomecoming.claimed,true);
  assert.equal(f.sim.state.adventure.xp-prior.adventure.xp,Math.min(D.reward.xp,9999-prior.adventure.xp));for(const k of ['coins','ore'])assert.equal(f.sim.state.adventure[k]-prior.adventure[k],D.reward[k]);for(const[k,n]of Object.entries(D.reward.materials))assert.equal(f.sim.state.sandbox.inventory[k]-prior.sandbox.inventory[k],n);
  for(const k of ['equipment','companion'])assert.deepEqual(f.sim.state.adventure[k],prior.adventure[k]);assert.equal(f.sim.state.adventure.hp,prior.adventure.hp);assert.equal(f.sim.state.adventure.stamina,prior.adventure.stamina);assert.deepEqual(f.mem.store.record.slots[0],other);
  const paid=copy(f.sim.state),native=f.mem.values.get(CS.KEY);assert.ok(f.app.command('claim',commandPayload(f)).duplicate);assert.equal(f.mem.values.get(CS.KEY),native);assert.deepEqual(f.sim.state,paid);
  const cold=new CS.Store(f.mem.storage),loaded=cold.load();assert.equal(loaded.status,'loaded');assert.equal(cold.active,f.mem.store.active);assert.deepEqual(cold.record.slots[0],other);assert.deepEqual(loaded.state,paid);
  const reloaded=fixture(loaded.state),before=copy(reloaded.sim.state);reloaded.rpg.open('earth-homecoming');assert.match(reloaded.nodes.get('#rpg-content').innerHTML,/paid|payment|complete/i);assert.deepEqual(reloaded.sim.state,before);
 }
});

test('actual UI whole-fee capacity refusal includes crystal and retains a ready unpaid account',()=>{
 const f=fixture();synthetic(f,'home-return');f.place(D.claim);f.sim.state.sandbox.inventory.crystal=global.RealmSandbox.MAX;f.rpg.open('earth-homecoming');const before=copy(f.sim.state),native=f.mem.values.get(CS.KEY);f.rpg.action(elements(f,'claim'));assert.deepEqual(f.sim.state,before);assert.equal(f.mem.values.get(CS.KEY),native);assert.equal(H.ready(f.sim.state),true);assert.equal(f.sim.state.earthHomecoming.claimed,false);assert.ok(f.calls.some(s=>typeof s==='string'&&/whole fee/.test(s)));assert.match(f.nodes.get('#rpg-content').innerHTML,/payment unclaimed/);
});

test('actual UI refused fee save never adopts partial materials, claimed flag or replay payout',()=>{
 const f=fixture();synthetic(f,'home-return','reviewed-custody');f.place(D.claim);f.rpg.open('earth-homecoming');const before=copy(f.sim.state),native=f.mem.values.get(CS.KEY);f.mem.storage.setItem=()=>{throw Error('labelled CPU payment-save refusal');};f.rpg.action(elements(f,'claim'));assert.deepEqual(f.sim.state,before);assert.equal(f.mem.values.get(CS.KEY),native);assert.equal(f.sim.state.earthHomecoming.claimed,false);assert.ok(f.calls.some(s=>typeof s==='string'&&/save refused/.test(s)));
});
test('actual world context, map markers and home route legend preserve explicit fresh journal accessibility',()=>{
 const f=fixture(C.fresh()),api=global.RealmWorldFoundationsUI;f.place(D.giver);f.rpg.tab='earth-homecoming';assert.equal(f.rpg.worlds.context(),null);assert.deepEqual(api.homecomingPoints(f.sim),[]);assert.equal(api.homecomingLegend(f.sim),'');f.rpg.open('journal');assert.match(f.nodes.get('#rpg-content').innerHTML,/earth-homecoming-open/);
 const g=fixture();g.accept();g.rpg.quest='earth-homecoming';g.place(step('bridge-record'));assert.match(g.rpg.worlds.context(),/Vessa|bridge|Bridge/);const svg=api.mapSVG(W.definition(D.room),g.sim);assert.ok(svg.includes('data-local-marker="bridge-record"'));assert.match(api.homecomingLegend(g.sim),/earth-homecoming-walk/);
 g.sim.room=null;assert.equal(api.homecomingPoints(g.sim)[0].kind,'travel');g.rpg.open('atlas');assert.match(g.nodes.get('#rpg-content').innerHTML,/The road home/);
});
test('actual tracker-open and EH last tracker projection expose unpaid work without stealing another active tracker',()=>{
 const f=fixture();f.accept();f.rpg.quest='homestead';f.rpg.earthHomecoming.tick();assert.equal(f.rpg.quest,'homestead');f.rpg.quest='earth-homecoming';f.rpg.earthHomecoming.tick();assert.equal(f.nodes.get('#tracked-title').textContent,D.title);f.nodes.get('#tracked-open').onclick();assert.equal(f.rpg.tab,'earth-homecoming');
});
test('actual Regent dispatch precedes sentinel fallback and draws the exact owned immutable warning',()=>{
 const f=fixture(),e=actor(f),strike=windup(f,e);f.sim.state.adventure.companion.bonded=false;f.sim.presentation={perspective:true};const out=empty();global.RealmAdventureArt.draw(out,f.sim,0);const actorParts=all(out).filter(p=>p.earthHomecomingActor===e.id),warnings=actorParts.filter(p=>p.earthHomecomingTelegraph);assert.ok(actorParts.length>=22);assert.equal(warnings.length,8);for(const p of warnings)assert.deepEqual(p.earthHomecomingStrike,strike);assert.ok(actorParts.every(p=>p.m));assert.equal(all(out).filter(p=>p.c===0xddc59b).length,0,'no generic sentinel orbit parts');
 // The staged preimage failure remains in its original evidence. This portable
 // regression loads the installed bytes in a second context, never old source.
 const independent={...Object.fromEntries(Object.entries(global).filter(([k])=>k.startsWith('Realm'))),document:global.document};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'src/adventure-art.js'),'utf8'),independent);const drawn=empty();independent.RealmAdventureArt.draw(drawn,f.sim,0);assert.deepEqual(all(drawn).filter(p=>p.earthHomecomingActor).map(p=>({part:p.earthHomecomingPart,m:Array.from(p.m)})),actorParts.map(p=>({part:p.earthHomecomingPart,m:Array.from(p.m)})));assert.equal(all(drawn).filter(p=>p.c===0xddc59b).length,0,'a fresh installed context also skips generic sentinel art');
});
test('actual physical AI cue renders broad/narrow/ring labels and recovery without undefined copy',()=>{
 for(const kind of ['claim-lane','false-shelter','closing-ring']){
  const f=fixture(),e=actor(f);if(kind==='false-shelter')windup(f,e,10.5);else if(kind==='closing-ring'){e.hp=40;windup(f,e,2);}else windup(f,e,2);assert.equal(e.strike.pattern,kind);T.runtime(f.sim).target=e.id;f.rpg.targetCue();const title=f.nodes.get('#target-cue-title').textContent;assert.match(title,kind==='claim-lane'?/claim lane/:kind==='false-shelter'?/false shelter/:/closing ring/);assert.match(f.nodes.get('#target-cue-detail').textContent,kind==='closing-ring'?/quiet centre/:/marked lane/);
  assert.doesNotMatch(f.nodes.get('#target-cue-detail').textContent,/cover/i);if(kind!=='closing-ring')assert.match(f.nodes.get('#target-cue-detail').textContent,/withdraw beyond his reach/);
  e.mode='recover';e.timer=.6;f.rpg.targetCue();assert.match(f.nodes.get('#target-cue-title').textContent,/Recovery opening/);
 }
});
test('click and perspective health projection use actual Regent foundation and crown height',()=>{
 const f=fixture(),e=actor(f),samples=[];f.api.project=(x,y,z)=>{samples.push([x,y,z]);return{x:x*10,y:y*10,depth:1,visible:true};};f.old.api.project=f.api.project;f.old.screenClick(-999,-999);const base=W.height(D.room,e.x,e.z);assert.ok(samples.some(p=>Math.abs(p[1]-(base+2.18))<1e-9));samples.length=0;f.sim.presentation={perspective:true};T.runtime(f.sim).target=e.id;f.rpg.worldHealth();assert.ok(samples.some(p=>Math.abs(p[1]-(base+2.3))<1e-9));
});
test('actual WorldArt update emits home trace only after saved physical home-return for both aftermaths',()=>{
 for(const choice of D.choices){const f=fixture();synthetic(f,'return-verified',choice.id);f.sim.room=null;f.sim.state.adventure.companion.bonded=false;assert.equal(worldArt(f).parts.filter(p=>p.earthHomecomingTrace==='home').length,0);synthetic(f,'home-return',choice.id);const out=worldArt(f);const home=out.parts.filter(p=>p.earthHomecomingTrace==='home');assert.ok(home.length>0);assert.ok(home.every(p=>p.earthHomecomingChoice===choice.id));const plate=home.find(p=>p.earthHomecomingPart==='independent-account-plate'),verts=[];for(let i=0,g=E.geometry('box');i<g.length;i+=6)verts.push(E.M.transform(plate.m,Array.from(g.slice(i,i+3))));assert.ok(Math.abs(Math.min(...verts.map(v=>v[1]))-2.13)<1e-6);assert.ok(verts.every(v=>v[0]>=12.3046&&v[0]<=12.6954&&v[2]>=8.3980&&v[2]<=8.702));}
});
test('actual road fixture draw and reset retain foreign scene/nonaccepted boundaries',()=>{
 const f=fixture(),before=JSON.stringify(f.sim.state);f.sim.room=D.room;assert.equal(worldArt(f).parts.filter(p=>p.earthHomecomingFixture).length,0);assert.equal(JSON.stringify(f.sim.state),before);f.sim.room=null;f.accept();f.place(step('bridge-record'));const road=worldArt(f).parts.filter(p=>p.earthHomecomingFixture);assert.ok(road.length>0);assert.equal(road.filter(p=>p.earthHomecomingTrace==='home').length,0);f.sim.room='world-heaven';assert.equal(worldArt(f).parts.filter(p=>p.earthHomecomingFixture).length,0);
});
test('app Realm diagnostics copy actual EH facts/runtime rather than expose mutable owner references',()=>{
 const f=fixture();f.accept();const app=P.overlay.read('app.js'),snippet=app.slice(app.indexOf('window.Realm={get state()'),app.indexOf('if(window.__ETERNITIES_TEST_MODE'));
 const ctx={...Object.fromEntries(Object.entries(global).filter(([k])=>k.startsWith('Realm'))),window:{},sim:f.sim,engine:null,errors:[],adventure:f.old,experience:null,rpg:f.rpg,art:null,sandbox:null,audio:{enabled:false,ctx:null,soundscape:null},camera:{},saveState:'saved',characterStore:f.mem.store,navigate:()=>{},sceneHeight:()=>1.3,worldDiveStatus:()=>null,fps:0};f.rpg.gathering.player={status:'idle'};vm.runInNewContext(snippet,ctx);const d=ctx.window.Realm.diagnostics;assert.equal(d.earthHomecoming.record.accepted,true);assert.equal(d.earthHomecoming.runtime.room,null);d.earthHomecoming.record.accepted=false;d.earthHomecoming.record.steps.push('invented');assert.equal(f.sim.state.earthHomecoming.accepted,true);assert.ok(!f.sim.state.earthHomecoming.steps.includes('invented'));
});
test('build/shell ordered tokens load data+rules before Core/Adventure and repaired UI/art/CSS exactly once',()=>{
 const shell=fs.readFileSync(path.join(ROOT,'src/shell.html'),'utf8'),build=fs.readFileSync(path.join(ROOT,'build.py'),'utf8');
 for(const[token,file]of [['EARTH_HOMECOMING_DATA','earth-homecoming-data.js'],['EARTH_HOMECOMING','earth-homecoming.js'],['EARTH_HOMECOMING_UI','earth-homecoming-ui.js'],['EARTH_HOMECOMING_ART','earth-homecoming-art.js'],['EARTH_HOMECOMING_STYLE','earth-homecoming.css']]){assert.equal(shell.split('/*__'+token+'__*/').length-1,1);assert.ok(build.includes("('"+file+"','"+token+"')"));}
 const at=s=>shell.indexOf('/*__'+s+'__*/');assert.ok(at('EARTH_HOMECOMING_DATA')<at('EARTH_HOMECOMING'));assert.ok(at('EARTH_HOMECOMING')<at('ADVENTURE'));assert.ok(at('EARTH_HOMECOMING')<at('CORE'));assert.ok(at('EARTH_HOMECOMING_UI')<at('RPG_UI'));assert.ok(at('EARTH_HOMECOMING_ART')<at('WORLD'));
 const known={'earth-homecoming-ui.js':'5e57a2367153e516bdab12837db82812de3124a32489b09987dd285be011159d','earth-homecoming-art.js':'57dfd7243e268fef8509448000260ca1be85a2dedebffcba8826ab3006bbdeff','earth-homecoming.css':'dbfeb49d20278ebeb9b9ae4c1d4d575acc3a806ca59898f20ebb9f8ca8f1661a'};for(const[n,h]of Object.entries(known))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'src',n))).digest('hex'),h);
});
