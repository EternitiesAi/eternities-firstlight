'use strict';
/* Pure projection and real installed-interface CPU tests. Completed histories,
 * equipment/XP and service poses below are labelled synthetic boundary fixtures,
 * never earned, native-event, pixel, browser or human acceptance receipts. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=fs.realpathSync(process.env.FIRSTLIGHT_ROOT||path.resolve(__dirname,'..')),STAGE=process.env.ROAD_ACCOUNT_STAGE||path.resolve(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),E=require(path.join(ROOT,'src/earth-expedition.js')),CD=require(path.join(ROOT,'src/earth-consignment-data.js')),D=require(path.join(ROOT,'src/earth-wild-signs-data.js')),W=require(path.join(ROOT,'src/world-foundations.js'));
require(path.join(ROOT,'src/earth-wild-signs.js'));require(path.join(ROOT,'src/earth-expedition-dialogue.js'));require(path.join(ROOT,'src/earth-fieldcraft-ui.js'));
const sha=text=>crypto.createHash('sha256').update(text).digest('hex'),copy=structuredClone;
function moduleUnderTest(){const file=process.env.ROAD_ACCOUNT_MODULE||path.join(ROOT,'src/earth-road-account.js');assert.ok(fs.existsSync(file),'the pure road-account projection is implemented');return require(file);}
function fixture(resolution='signed-loop',claimed=true){
 const raw=C.fresh();raw.adventure.started=true;
 raw.earthExpedition={version:1,story:{accepted:true,branch:'stormfall-recovery',steps:E.definition.steps.map(s=>s.id),claimed:true},patrol:{lastClaim:0,active:null}};
 raw.localLife.records[CD.ID]={accepted:true,choice:'south-stormfall',steps:CD.required('south-stormfall').slice(),claimed:true};
 raw.earthWildSigns={version:1,accepted:true,evidence:['timber-gouge','feeding-track','pest-scrape'],observed:true,resolution,cleared:resolution==='cleared-pocket',claimed};
 return C.validate(raw);
}
const all=(M,state)=>[M.reading('elderweald-sela',state),M.reading('elderweald-rill',state),M.reading('merren',state),M.notice(state),M.html('merren',state),M.noticeHTML(state)];

test('missing and unclaimed owners produce no public consequence and never backfill old worlds',()=>{
 const M=moduleUnderTest(),old=C.fresh();delete old.earthWildSigns;const inherited=Object.assign(Object.create({earthWildSigns:fixture().earthWildSigns}),copy(old));
 const worlds=[old,inherited,C.fresh(),fixture('signed-loop',false),fixture('cleared-pocket',false)];
 for(const world of worlds){const before=JSON.stringify(world);assert.deepEqual(all(M,world),[null,null,null,null,'','']);assert.equal(JSON.stringify(world),before);}
 assert.equal(Object.hasOwn(old,'earthWildSigns'),false);assert.equal(Object.hasOwn(inherited,'earthWildSigns'),false);
});

test('both canonical claimed outcomes have distinct practical responses at the three existing service IDs',()=>{
 const M=moduleUnderTest();for(const resolution of ['signed-loop','cleared-pocket']){const state=fixture(resolution),before=JSON.stringify(state);
  for(const id of ['elderweald-sela','elderweald-rill','merren']){const reading=M.reading(id,state);assert.equal(reading.personId,id);assert.equal(reading.resolution,resolution);assert.ok(reading.lines.length>=2);assert.ok(Object.isFrozen(reading)&&Object.isFrozen(reading.lines));assert.match(M.html(id,state),new RegExp('data-road-account-service="'+id+'"'));}
  assert.equal(M.notice(state).resolution,resolution);assert.ok(Object.isFrozen(M.notice(state).lines));assert.match(M.noticeHTML(state),/data-road-account-notice/);assert.equal(JSON.stringify(state),before);
 }
 assert.match(M.notice(fixture('signed-loop')).lines.join(' '),/bypass/);assert.match(M.notice(fixture('cleared-pocket')).lines.join(' '),/pocket.*clear/);
 assert.notDeepEqual(M.reading('merren',fixture('signed-loop')),M.reading('merren',fixture('cleared-pocket')));
 assert.equal(M.reading('elderweald-rill-impostor',fixture()),null);assert.equal(M.html('vessa',fixture()),'');
});

test('malformed, inherited, contradictory and future signs owners fail closed',()=>{
 const M=moduleUnderTest(),valid=fixture(),owners=[null,{}, {...valid.earthWildSigns,version:2},{...valid.earthWildSigns,future:true},{...valid.earthWildSigns,accepted:false},{...valid.earthWildSigns,observed:false},{...valid.earthWildSigns,evidence:['pest-scrape','feeding-track','timber-gouge']},{...valid.earthWildSigns,resolution:'future'},{...valid.earthWildSigns,cleared:true},Object.assign(Object.create(valid.earthWildSigns),{})];
 for(const owner of owners){const state=copy(valid);state.earthWildSigns=owner;const before=JSON.stringify(state);assert.deepEqual(all(M,state),[null,null,null,null,'','']);assert.equal(JSON.stringify(state),before);}
 const state=fixture('cleared-pocket');state.earthWildSigns.cleared=false;assert.equal(M.notice(state),null);
 const symbol=fixture();symbol.earthWildSigns[Symbol('future')]=true;assert.equal(M.notice(symbol),null);
});

test('a claimed-looking signs owner cannot publish without the actual claimed supplied-load provenance',()=>{
 const M=moduleUnderTest();for(const alter of [w=>w.localLife.records[CD.ID].claimed=false,w=>w.localLife.records[CD.ID].choice='future',w=>w.earthExpedition.story.claimed=false,w=>w.earthExpedition.story.branch='managed-coppice']){const state=fixture();alter(state);const before=JSON.stringify(state);assert.deepEqual(all(M,state),[null,null,null,null,'','']);assert.equal(JSON.stringify(state),before);}
});

test('blade, bow and veteran history receive the same account while every whole-world byte is retained',()=>{
 const M=moduleUnderTest(),base=fixture();let expected;
 for(const [weapon,xp]of [['trail_blade',1],['trail_bow',250],['trail_blade',9999]]){const raw=copy(base);raw.adventure.owned=[weapon];raw.adventure.equipment.weapon=weapon;raw.adventure.xp=xp;const state=C.validate(raw),before=JSON.stringify(state),readings=all(M,state);
  if(expected)assert.deepEqual(readings,expected);else expected=readings;assert.equal(JSON.stringify(state),before);assert.equal(state.adventure.xp,xp);assert.equal(state.adventure.equipment.weapon,weapon);
 }
});

test('witnessed feeding and separate pest evidence do not become a proven timber culprit or forest revelation',()=>{
 const M=moduleUnderTest();for(const resolution of ['signed-loop','cleared-pocket']){const notice=M.notice(fixture(resolution)),text=notice.lines.join(' ');assert.match(text,/feeding/);assert.match(text,/burrowing scrape/);assert.match(text,/unproven/);assert.match(text,/older stories/);assert.doesNotMatch(text,/grazer caused|skitter caused|all roads safe|forest.*fully cleared|Regent.*defeated|cosmic truth/);}
});

function patched(pathname){let text=fs.readFileSync(path.join(ROOT,pathname),'utf8');if(!process.env.ROAD_ACCOUNT_STAGE)return text;const file=path.join(STAGE,'interface-seams.json');assert.ok(fs.existsSync(file),'byte-bound interface seam recipe exists');const recipe=JSON.parse(fs.readFileSync(file)),entry=recipe.files.find(f=>f.path===pathname);assert.ok(entry,'declared interface seam');assert.equal(sha(text),entry.sourceSha256,'actual installed interface bytes match staging epoch');for(const edit of entry.edits){assert.equal(text.split(edit.before).length,2,'unique unchanged production seam');text=text.replace(edit.before,edit.after);}return text;}
function loadUI(file,globalName){const source=patched(file);return vm.compileFunction('const module={exports:{}};\n'+source+'\nreturn globalThis['+JSON.stringify(globalName)+'];',[],{filename:path.join(ROOT,file)})();}
function rpg(state,point){const sim=new C.Simulation(state);sim.room=D.ROOM;sim.state.player={x:point.x,z:point.z,yaw:0};return{sim,api:{},quest:'story',open(){},close(){},paint(){}};}

test('actual nearby Sela/Rill/Merren page seams append the account and keep the original advice and work',()=>{
 const M=moduleUnderTest();assert.equal(globalThis.RealmEarthRoadAccount,M);
 const World=loadUI('src/world-foundations-ui.js','RealmWorldFoundationsUI').WorldUI,Expedition=loadUI('src/earth-expedition-ui.js','RealmEarthExpeditionUI').ExpeditionUI,Bridge=loadUI('src/bridge-community-ui.js','RealmBridgeCommunityUI').BridgeCommunityUI;
 for(const resolution of ['signed-loop','cleared-pocket']){const state=fixture(resolution),before=JSON.stringify(state),definition=W.definition(D.ROOM);
  for(const id of ['elderweald-sela','elderweald-rill','merren']){const point=definition.points.find(p=>p.id===id);assert.ok(point);const host=rpg(copy(state),point),ui=Object.create(World.prototype);Object.assign(ui,{rpg:host,selected:'earthlands',reading:id,ticket:null});const worldBefore=JSON.stringify(host.sim.state),html=ui.page('worlds').html;assert.match(html,new RegExp('data-road-account-service="'+id+'"'));assert.match(html,/world-surveys/);assert.match(html,/world-return/);if(id!=='merren')assert.match(html,/expedition-dialogue/);assert.equal(JSON.stringify(host.sim.state),worldBefore);}
  const camp=rpg(copy(state),E.definition.giver),expedition=new Expedition(camp),expBefore=JSON.stringify(camp.sim.state),expHTML=expedition.page('expedition').html;assert.match(expHTML,/data-road-account-service="elderweald-rill"/);assert.match(expHTML,/expedition-patrol-accept/);assert.match(expHTML,/Inspect the workbench and binding/);assert.equal(JSON.stringify(camp.sim.state),expBefore);
  const giver=globalThis.RealmBridgeCommunity.definition.giver,workshop=rpg(copy(state),giver),bridge=new Bridge(workshop),bridgeBefore=JSON.stringify(workshop.sim.state),bridgeHTML=bridge.page('community').html;assert.match(bridgeHTML,/data-road-account-service="merren"/);assert.match(bridgeHTML,/community-accept/);assert.match(bridgeHTML,/Sheltered sorting bench/);assert.equal(JSON.stringify(workshop.sim.state),bridgeBefore);assert.equal(JSON.stringify(state),before);
 }
});

test('actual Sela retained panel shows the public notice while all earlier service actions stay reachable',()=>{
 moduleUnderTest();const Wild=loadUI('src/earth-wild-signs-ui.js','RealmEarthWildSignsUI').WildSignsUI;
 for(const resolution of ['signed-loop','cleared-pocket']){const host=rpg(fixture(resolution),D.giver),ui=new Wild(host),before=JSON.stringify(host.sim.state),html=ui.panel();assert.match(html,/data-road-account-service="elderweald-sela"/);assert.match(html,/data-road-account-notice/);for(const action of ['world-inspect','expedition-open','community-open','consignment-open'])assert.match(html,new RegExp('data-rpg="'+action+'"'));assert.match(html,/Sela paid you 4 sunmarks and 3 fibre/);assert.match(html,/Claimed once; no XP or ore/);assert.equal(JSON.stringify(host.sim.state),before);}
 const host=rpg(fixture('signed-loop',false),D.giver),ui=new Wild(host),html=ui.panel();assert.doesNotMatch(html,/data-road-account-notice|data-road-account-service/);assert.match(html,/wild-signs-claim/);
});

test('service response stays local and disappears at a different character or unclaimed history',()=>{
 moduleUnderTest();const World=loadUI('src/world-foundations-ui.js','RealmWorldFoundationsUI').WorldUI,point=W.definition(D.ROOM).points.find(p=>p.id==='merren'),host=rpg(fixture(),point),ui=Object.create(World.prototype);Object.assign(ui,{rpg:host,selected:'earthlands',reading:'merren',ticket:null});
 assert.match(ui.page('worlds').html,/data-road-account-service="merren"/);host.sim=new C.Simulation(C.fresh());host.sim.room=D.ROOM;host.sim.state.player={x:point.x,z:point.z,yaw:0};assert.doesNotMatch(ui.page('worlds').html,/data-road-account-service/);host.sim=new C.Simulation(fixture());host.sim.room=D.ROOM;host.sim.state.player={x:0,z:0,yaw:0};assert.doesNotMatch(ui.page('worlds').html,/data-road-account-service/);
});

test('authored HTML escapes its text and never incorporates arbitrary saved or requested markup',()=>{
 const M=moduleUnderTest(),state=fixture(),hostile='<script>alert("account")</script>&\'"';state.adventure.playerName=hostile;const before=JSON.stringify(state);
 assert.match(M.html('elderweald-sela',state),/Sela&#39;s/);assert.match(M.noticeHTML(state),/evidence &amp; road use/);
 for(const html of [M.html('elderweald-sela',state),M.noticeHTML(state)]){assert.doesNotMatch(html,/<script|alert\(|playerName/);assert.doesNotMatch(html,/evidence & road use/);}
 assert.equal(M.html(hostile,state),'');assert.equal(JSON.stringify(state),before);
});

test('inherited claimed prerequisites cannot lend another owner a road account',()=>{
 const M=moduleUnderTest();for(const alter of [w=>{const prior=w.localLife;delete w.localLife;Object.setPrototypeOf(w,{localLife:prior});},w=>{const prior=w.localLife.records;w.localLife.records=Object.create(prior);},w=>{const prior=w.earthExpedition;delete w.earthExpedition;Object.setPrototypeOf(w,{earthExpedition:prior});}]){
  const state=fixture();alter(state);const before=JSON.stringify(state);assert.deepEqual(all(M,state),[null,null,null,null,'','']);assert.equal(JSON.stringify(state),before);
 }
});

test('dedicated Rill and Merren readings stay nearby, dry and able to act',()=>{
 moduleUnderTest();const Expedition=loadUI('src/earth-expedition-ui.js','RealmEarthExpeditionUI').ExpeditionUI,Bridge=loadUI('src/bridge-community-ui.js','RealmBridgeCommunityUI').BridgeCommunityUI;
 for(const [UI,tab,giver]of [[Expedition,'expedition',E.definition.giver],[Bridge,'community',globalThis.RealmBridgeCommunity.definition.giver]]){
  for(const change of [s=>{s.state.player={x:0,z:0,yaw:0};},s=>{s.worldDive={active:true};},s=>{s.state.adventure.hp=0;},s=>{s.room='world-atlantis';}]){const host=rpg(fixture(),giver),ui=new UI(host);change(host.sim);const before=JSON.stringify(host.sim.state);assert.doesNotMatch(ui.page(tab).html,/data-road-account-service/);assert.equal(JSON.stringify(host.sim.state),before);}
 }
});

test('Source02 uses two practical role lines and two notice paragraphs without internal account explanations or actor promises',()=>{
 const M=moduleUnderTest();for(const resolution of ['signed-loop','cleared-pocket']){
  const state=fixture(resolution),before=JSON.stringify(state);
  for(const id of ['elderweald-sela','elderweald-rill','merren']){
   const r=M.reading(id,state);assert.equal(r.lines.length,2);assert.ok(r.lines.join(' ').split(/\s+/).length<=60);
   assert.doesNotMatch(r.lines.join(' '),/supplied load|settlement stock|separate accounts|second payment|adds no cargo|ledger|controller|owner lease|inspection circuit keep their own work/i);
  }
  assert.doesNotMatch(M.reading('elderweald-rill',state).lines.join(' '),/I(?: will|'ll|’ll) (?:walk|inspect|patrol)|follow me|I am heading/i);
  const notice=M.notice(state);assert.equal(notice.lines.length,2);assert.ok(notice.lines.join(' ').split(/\s+/).length<=65);
  for(const word of [/feeding/,/burrowing scrape/,/gouge.*unproven/,/older stories/])assert.match(notice.lines.join(' '),word);
  assert.equal(JSON.stringify(state),before);
 }
});

function retainedBlock(html){
 const start=html.indexOf('<section class="wild-signs-retained"');assert.ok(start>=0);const tail=html.slice(start);let depth=0;
 for(const tag of tail.matchAll(/<\/?section\b[^>]*>/g)){depth+=tag[0].startsWith('</')?-1:1;if(depth===0)return tail.slice(0,tag.index+tag[0].length);}
 assert.fail('Retained section must close');
}
// An attributed private old-panel control, not the installed producer.
// Reverse only the three reviewed Source02 copy seams. Require the exact
// original 04ee/376 preimage, and restore the current global registration.
const LEGACY_WILD_UI_SHA="42b2302370c5999cf518b21d48a4faf7169d997c5e8f5be6b7cf889949b41a46";
const LEGACY_WILD_UI_EDITS=[
  {
    "before": "  let html='<article class=\"wild-signs-panel\" data-wild-signs-panel aria-labelledby=\"wild-signs-title\"><header><h3 id=\"wild-signs-title\">'+esc(D.definition.title)+'</h3><p>A roadworker blames the moss-backed grazer for the scar in the roadside timber. Sela is not convinced. Bring her the marks and a witnessed account of the animal before the accusation becomes the village story.</p></header>'+\n",
    "after": "  let html='<article class=\"wild-signs-panel\" data-wild-signs-panel aria-labelledby=\"wild-signs-title\"><header><h3 id=\"wild-signs-title\">'+esc(D.definition.title)+'</h3><p>'+esc(r.claimed?\"Sela has revised the road notice. Your witnessed account leaves the grazer’s refuge undisturbed.\":\"A roadworker blames the moss-backed grazer for the scar in the roadside timber. Sela is not convinced. Bring her the marks and a witnessed account of the animal before the accusation becomes the village story.\")+'</p></header>'+\n"
  },
  {
    "before": "   '<p class=\"wild-signs-payment\"><strong>Separate payment:</strong> 4 sunmarks and 3 fibre, once from Sela after the chosen response. No acceptance cost, XP or ore. Earlier kits, repairs and payments retain their own accounts.</p>'+\n",
    "after": "   (r.claimed?'':'<p class=\"wild-signs-payment\"><strong>Separate payment:</strong> 4 sunmarks and 3 fibre, once from Sela after the chosen response. No acceptance cost, XP or ore. Earlier kits, repairs and payments retain their own accounts.</p>')+\n"
  },
  {
    "before": "   if(r.claimed)html+='<section class=\"wild-signs-retained\"><h4>Corrected account · paid once</h4><p>'+esc(r.resolution==='signed-loop'?'The supported bypass is recorded. The grazer’s refuge remains, and the separate pest account was resolved without that fight.':'The distinct pest pocket is recorded clear. The grazer remains harmless; that encounter granted no kill loot or XP.')+'</p><p>“I have changed the road notice,” Sela says. “The grazer feeds here; the burrowing marks belong to something else. Let the next traveller hear the right account.”</p><p>Sela already paid this separate 4-sunmark and 3-fibre account.</p></section>';\n",
    "after": "   if(r.claimed){\n    const publicNotice=G.RealmEarthRoadAccount?.noticeHTML(sim.state)||'';\n    html+=publicNotice?'<section class=\"wild-signs-retained\" data-road-account-service=\"'+esc(D.giver.id)+'\" data-road-account-outcome=\"'+esc(r.resolution)+'\">'+publicNotice+'<p class=\"wild-signs-payment\">Sela paid you 4 sunmarks and 3 fibre. Claimed once; no XP or ore.</p></section>':'<section class=\"wild-signs-retained\"><h4>Corrected account · paid once</h4><p>'+esc(r.resolution==='signed-loop'?'The supported bypass is recorded. The grazer’s refuge remains, and the separate pest account was resolved without that fight.':'The distinct pest pocket is recorded clear. The grazer remains harmless; that encounter granted no kill loot or XP.')+'</p><p>“I have changed the road notice,” Sela says. “The grazer feeds here; the burrowing marks belong to something else. Let the next traveller hear the right account.”</p><p>Sela already paid this separate 4-sunmark and 3-fibre account.</p></section>';\n   }\n"
  }
];
function legacyWildUI(){
 let source=fs.readFileSync(path.join(ROOT,'src/earth-wild-signs-ui.js'),'utf8');
 if(!process.env.ROAD_ACCOUNT_STAGE)for(const edit of LEGACY_WILD_UI_EDITS){
  assert.equal(source.split(edit.after).length,2,'Exactly one installed reviewed copy seam');
  source=source.replace(edit.after,edit.before);
 }
 assert.equal(sha(source),LEGACY_WILD_UI_SHA,'Exact attributed original UI baseline, not Updated compared with itself');
 const current=globalThis.RealmEarthWildSignsUI;
 try{return vm.compileFunction('const module={exports:{}};\n'+source+'\nreturn globalThis.RealmEarthWildSignsUI.WildSignsUI;',[],{filename:'private-original-wild-signs-ui.js'})();}
 finally{globalThis.RealmEarthWildSignsUI=current;}
}

test('Source02 claimed Sela panel carries one compact notice, a single exact paid receipt and unchanged real service controls',()=>{
 moduleUnderTest();const Updated=loadUI('src/earth-wild-signs-ui.js','RealmEarthWildSignsUI').WildSignsUI;
 const Original=legacyWildUI();
 for(const resolution of ['signed-loop','cleared-pocket']){
  const state=fixture(resolution),host=rpg(copy(state),D.giver),before=JSON.stringify(host.sim.state),html=new Updated(host).panel(),original=new Original(rpg(copy(state),D.giver)).panel(),block=retainedBlock(html);
  assert.equal((block.match(/<p\b/g)||[]).length,3);assert.equal((block.match(/data-road-account-notice/g)||[]).length,1);
  assert.doesNotMatch(block,/road-account-reading/);assert.match(block,/data-road-account-service="elderweald-sela"/);
  assert.equal((html.match(/4 sunmarks and 3 fibre/g)||[]).length,1);assert.match(block,/Sela paid you 4 sunmarks and 3 fibre\. Claimed once; no XP or ore/);
  assert.doesNotMatch(html,/A roadworker blames|Bring her the marks and a witnessed account/);assert.match(html,/Sela has revised the road notice/);
  assert.deepEqual(html.match(/<button\b[^>]*>.*?<\/button>/gs),original.match(/<button\b[^>]*>.*?<\/button>/gs),'Exact old labels, IDs, actions, order and button metadata');
  assert.equal(JSON.stringify(host.sim.state),before);
 }
});
test('Source02 keeps the actual unclaimed panel byte-identical and the original retained fallback when its projection is unavailable',()=>{
 const M=moduleUnderTest(),Updated=loadUI('src/earth-wild-signs-ui.js','RealmEarthWildSignsUI').WildSignsUI;
 const Original=legacyWildUI();
 for(const resolution of ['signed-loop','cleared-pocket']){
  const state=fixture(resolution,false);assert.equal(new Updated(rpg(copy(state),D.giver)).panel(),new Original(rpg(copy(state),D.giver)).panel(),'Original ready/unclaimed flow and terms unchanged');
  const completed=fixture(resolution);let html;
  try{globalThis.RealmEarthRoadAccount=undefined;html=new Updated(rpg(copy(completed),D.giver)).panel();}finally{globalThis.RealmEarthRoadAccount=M;}
  assert.equal(retainedBlock(html),retainedBlock(new Original(rpg(copy(completed),D.giver)).panel()));assert.doesNotMatch(retainedBlock(html),/data-road-account-service|data-road-account-notice/);
 }
});

test('private legacy panel control differs from the actual current producer without replacing it or its source',()=>{
 moduleUnderTest();const Updated=loadUI('src/earth-wild-signs-ui.js','RealmEarthWildSignsUI').WildSignsUI;
 const current=globalThis.RealmEarthWildSignsUI,before=fs.readFileSync(path.join(ROOT,'src/earth-wild-signs-ui.js'),'utf8'),Original=legacyWildUI();
 assert.notEqual(Updated.prototype.panel.toString(),Original.prototype.panel.toString());
 assert.equal(globalThis.RealmEarthWildSignsUI,current);
 assert.equal(fs.readFileSync(path.join(ROOT,'src/earth-wild-signs-ui.js'),'utf8'),before);
});
