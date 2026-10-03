/* CPU interface qualification, not a browser/DOM or earned-combat harness.
 * Real pages/actions/rules/Store are used. DOM nodes and event datasets are
 * explicit stubs; planted valid histories/positions attack consent boundaries.
 * Optional --earned-sources reads the separate command-earned journey receipts.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),C=require('../src/core.js'),A=require('../src/adventure.js'),E=require('../src/earth-expedition.js'),W=require('../src/world-foundations.js');
const AR=require('../src/arsenal.js'),R=require('../src/realm-trails.js'),CH=require('../src/characters.js');
const UI=require('../src/earth-expedition-ui.js');require('../src/world-foundations-ui.js');require('../src/realm-trails-ui.js');require('../src/rpg-ui.js');
const WUI=globalThis.RealmWorldFoundationsUI,TUI=globalThis.RealmTrailsUI,RPG=globalThis.RealmRPGUI;
const args=process.argv.slice(2),arg=n=>{const i=args.indexOf(n);return i<0?null:args[i+1];},copy=x=>JSON.parse(JSON.stringify(x)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const results=[],evidence=[];let serial=0;
function test(name,body){try{body();results.push({name,ok:true});console.log('PASS '+name);}catch(e){results.push({name,ok:false,error:e.stack});console.error('FAIL '+name+'\n'+e.stack);}}
function fixture({steps=[],claimed=false,branch=null,patrol=null,xp=0}={}){
 const sim=new C.Simulation();assert.ok(sim.moveTo(11,9).ok);while(sim.playerPath.length)sim.tick(.05);assert.ok(sim.adventureCommand('ui-kit-'+(++serial),'start').ok);
 sim.returnPos={...sim.state.player};sim.room='world-earthlands';sim.state.player={x:E.definition.giver.x,z:E.definition.giver.z+1.7,yaw:0};
 if(steps.length||claimed){sim.state.earthExpedition.story={accepted:true,steps:[...steps],claimed,branch};}
 if(patrol)sim.state.earthExpedition.patrol=copy(patrol);sim.state.adventure.xp=xp;C.validate(sim.snapshot());
 const f={sim,active:'labelled-ui-fixture',revision:1,saves:[],commands:[],walks:[],toasts:[],boundCalls:0};
 f.save=value=>{f.saves.push(C.validate(value));return{ok:true};};sim.earthExpeditionSave=f.save;
 f.context=()=>({sim:f.sim,active:f.active,revision:f.revision});
 f.rpg={get sim(){return f.sim;},get state(){return f.sim.state.adventure;},quest:'story',dialog:{open:false},open(tab){this.opened=tab;},close(){this.closed=true;},paint(){this.paints=(this.paints||0)+1;},api:{worldContext:f.context,toast:s=>f.toasts.push(s),project:()=>({visible:false}),walkLocal:(x,z)=>{f.walks.push({x,z});return f.sim.moveTo(x,z);},expeditionCommand:(type,payload)=>{f.commands.push({type,payload});return f.result=E.command(f.context(),type,payload,{save:f.save});},earthBinding:(weapon,kind)=>{f.boundCalls++;return f.result=E.bindingCommand(f.context(),weapon,kind,{save:f.save});}}};
 f.ui=new UI.ExpeditionUI(f.rpg);f.rpg.expedition=f.ui;A.syncScene(sim);return f;
}
const paid=()=>({steps:E.definition.steps.map(s=>s.id),claimed:true,branch:'managed-coppice'});
const event=(type,id='',extra={})=>({dataset:{rpg:'expedition-'+type,id,...extra}});
function buttons(html){return[...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(m=>({dataset:Object.fromEntries([...m[1].matchAll(/data-([\w-]+)="([^"]*)"/g)].map(a=>[a[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),a[2]])),label:m[2]}));}
function choose(f,type,id='',extra={}){assert.equal(f.ui.action(event(type,id,extra)),true);return f.result;}
function locate(f,p){const q=[[0,1.7],[1.7,0],[-1.7,0],[0,-1.7],[0,0]].map(([dx,dz])=>({x:p.x+dx,z:p.z+dz})).find(q=>W.walkable(f.sim.room,q.x,q.z)&&W.segment(f.sim.room,q,p));assert.ok(q,'supported labelled physical fixture '+p.id);f.sim.state.player={...q,yaw:0};}
function literalFunction(source,name){const line=source.split(/\r?\n/).find(l=>l.startsWith('function '+name+'('));assert.ok(line,'actual app function '+name);return line;}
class NodeStub{
 constructor(){this.textContent='';this.hidden=false;this.innerHTML='';this.dataset={};this.style={setProperty(){}};this.classList={toggle(){},remove(){},add(){}};this.children=new Map();}
 querySelector(s){if(!this.children.has(s))this.children.set(s,new NodeStub());return this.children.get(s);}
 setAttribute(){}replaceChildren(){}append(){}
}
function documentStub(){const root=new NodeStub();return{body:new NodeStub(),querySelector:s=>root.querySelector(s),querySelectorAll:()=>[],createElement:()=>new NodeStub()};}

test('fresh invitation exposes both exact allocations, fixed danger, binding cost and deliberate consent',()=>{
 const f=fixture(),before=f.sim.snapshot(),html=f.ui.page('expedition').html;
 for(const text of['45 XP · 18 sunmarks · 3 ore','8 timber · 4 fibre','4 timber · 8 fibre','Two more fibre','supplies the six fibre','64 / 136','9 / 11','1.35-second','2.3-second','3 ore, 8 sunmarks and 6 fibre'])assert.ok(html.includes(text),text);
 assert.ok(buttons(html).some(b=>b.dataset.rpg==='expedition-accept'));assert.equal(f.ui.page('other'),null);assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.saves.length,0);
 assert.equal(f.ui.interact(),true);assert.equal(f.rpg.opened,'expedition');assert.equal(f.sim.state.earthExpedition.story.accepted,false);
 f.sim.room=null;const outside=f.ui.page('expedition').html;assert.ok(outside.includes('data-rpg="world-select"'));assert.equal(buttons(outside).some(b=>b.dataset.rpg==='expedition-accept'),false);
});

test('actual RPG dispatch gives near expedition priority and closing clears an unspent preview',()=>{
 const f=fixture(),before=f.sim.snapshot();for(const name of['trails','worlds'])f.rpg[name]={reset(){},interact(){throw Error('legacy interaction must not steal Rill');},action(){throw Error('legacy action must not steal expedition');}};
 assert.equal(RPG.RPGUI.prototype.interact.call(f.rpg),true);assert.equal(f.rpg.opened,'expedition');assert.deepEqual(f.sim.snapshot(),before);RPG.RPGUI.prototype.action.call(f.rpg,event('accept'));assert.ok(f.result.ok);assert.equal(f.commands.length,1);assert.equal(f.commands[0].payload.quest,E.definition.id);choose(f,'binding-preview','trail_blade',{kind:'edge'});RPG.RPGUI.prototype.close.call(f.rpg);assert.equal(f.ui.pending,null);assert.equal(f.boundCalls,0);
});

test('missing optional ledger migrates to read-only fresh UI while malformed/current/future records never reach it',()=>{
 const f=fixture(),legacy=f.sim.snapshot();legacy.adventure.version=11;delete legacy.adventure.earthBinding;delete legacy.earthExpedition;const restored=new C.Simulation(legacy);assert.equal(restored.state.adventure.version,12);assert.deepEqual(restored.state.earthExpedition,E.fresh());f.sim=restored;f.sim.room='world-earthlands';const before=f.sim.snapshot();assert.ok(f.ui.page('expedition').html.includes('Accept this expedition'));assert.deepEqual(UI.routePoints(f.sim),[]);assert.deepEqual(f.sim.snapshot(),before);
 const current=copy(before);delete current.adventure.earthBinding;assert.throws(()=>C.validate(current));for(const raw of[null,{}, {...E.fresh(),version:2}]){const bad=copy(before);bad.earthExpedition=raw;assert.throws(()=>C.validate(bad));}const future=copy(before);future.adventure.version=13;assert.throws(()=>C.validate(future));
});

test('real UI delegates acceptance and physical branch work; remote, premature and forged defeat clicks grant nothing',()=>{
 const f=fixture();assert.ok(choose(f,'accept').ok);assert.equal(f.rpg.quest,'expedition');let before=f.sim.snapshot();assert.equal(choose(f,'step','assess-load').ok,false);assert.deepEqual(f.sim.snapshot(),before);
 locate(f,E.definition.steps[0]);assert.ok(choose(f,'step','assess-load').ok);before=f.sim.snapshot();assert.equal(choose(f,'step','read-water').ok,false);assert.deepEqual(f.sim.snapshot(),before);
 const c=E.definition.steps[1].choices[0];locate(f,c);assert.ok(choose(f,'step','prepare-allocation',{choice:c.id}).ok);assert.equal(f.sim.state.earthExpedition.story.branch,c.id);const allocation=f.sim.snapshot(),other=E.definition.steps[1].choices[1];locate(f,other);const moved=f.sim.snapshot();assert.ok(choose(f,'step','prepare-allocation',{choice:other.id}).duplicate);assert.deepEqual(f.sim.snapshot(),moved);assert.equal(f.sim.state.earthExpedition.story.branch,allocation.earthExpedition.story.branch,'old alternative button cannot replace accepted allocation');
 locate(f,E.definition.steps[2]);assert.ok(choose(f,'step','read-water').ok);const runtime=A.runtime(f.sim),enemy=runtime.enemies.find(e=>e.expeditionQuest===E.definition.id);assert.ok(enemy&&enemy.hp===64);
 locate(f,E.definition.steps[3]);before=f.sim.snapshot();assert.equal(choose(f,'step','clear-crossing').ok,false);assert.deepEqual(f.sim.snapshot(),before);assert.equal(enemy.hp,64);assert.equal(runtime.enemies.includes(enemy),true);
 const html=f.ui.page('expedition').html;assert.ok(html.includes('actual defeat records'));assert.equal(buttons(html).some(b=>b.dataset.rpg==='expedition-step'&&b.dataset.id==='clear-crossing'),false);
});

test('all valid story stages expose only current DAG routes; legend never performs remote work',()=>{
 for(let n=0;n<=E.definition.steps.length;n++){
  const f=fixture({steps:E.definition.steps.slice(0,n).map(s=>s.id),branch:n>=2?'managed-coppice':null});if(n===0)f.sim.state.earthExpedition.story.accepted=true;
  const before=f.sim.snapshot(),points=UI.routePoints(f.sim),next=E.progress(f.sim).story.next;
  const expected=n===E.definition.steps.length?[E.definition.giver.id]:next.flatMap(s=>s.choices?s.choices.map(c=>c.id):[s.id]);assert.deepEqual(points.map(p=>p.id),expected);
  assert.deepEqual(WUI.expeditionPoints(f.sim),points);const legend=WUI.expeditionLegend(f.sim),map=WUI.mapSVG(W.definition(f.sim.room),f.sim);
  assert.deepEqual(buttons(legend).filter(b=>b.dataset.rpg!=='expedition-open').map(b=>b.dataset.rpg),points.map(()=> 'expedition-walk'));
  for(const p of points){assert.ok(legend.includes('data-expedition-route="'+p.id+'"'));assert.ok(map.includes('data-expedition-marker="'+p.id+'"'));assert.ok([p.x,p.z].every(Number.isFinite));}
  assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.saves.length,0);
 }
 const f=fixture();assert.deepEqual(UI.routePoints(f.sim),[]);assert.equal(WUI.expeditionLegend(f.sim),'');f.sim.room=null;assert.deepEqual(UI.routePoints(f.sim),[]);
});

test('walk dispatch is current-route filtered, physically supported and never grants objective credit',()=>{
 const f=fixture();choose(f,'accept');const before=copy(f.sim.state.earthExpedition),saves=f.saves.length;
 choose(f,'walk','brace-root-channel');assert.equal(f.walks.length,0);choose(f,'walk','assess-load');assert.equal(f.walks.length,1);const q=f.walks[0];assert.ok(W.walkable(f.sim.room,q.x,q.z));assert.ok(W.segment(f.sim.room,q,E.definition.steps[0],.04));assert.ok(Math.abs(Math.hypot(q.x-E.definition.steps[0].x,q.z-E.definition.steps[0].z)-1.7)<1e-9);
 assert.deepEqual(f.sim.state.earthExpedition,before);assert.equal(f.saves.length,saves);assert.ok(f.sim.playerPath.length);f.sim.room=null;choose(f,'walk','giver');assert.equal(f.walks.length,1);
});

test('ready UI requires explicit local claim and preserves complete reward on save refusal',()=>{
 const f=fixture({...paid(),claimed:false}),before=f.sim.snapshot(),html=f.ui.page('expedition').html;
 assert.ok(html.includes('Work complete · payment ready'));assert.ok(html.includes('remains unclaimed'));assert.ok(buttons(html).some(b=>b.dataset.rpg==='expedition-claim'));assert.deepEqual(f.sim.snapshot(),before);
 f.save=()=>({ok:false,error:'labelled refused UI save'});assert.equal(choose(f,'claim').ok,false);assert.deepEqual(f.sim.snapshot(),before);assert.ok(f.ui.page('expedition').html.includes('payment ready'));
 f.save=value=>{f.saves.push(C.validate(value));return{ok:true};};assert.ok(choose(f,'claim').ok);assert.deepEqual(f.result.reward,{xp:45,coins:18,ore:3,materials:{wood:4,fiber:8}});assert.equal(f.sim.state.earthExpedition.story.claimed,true);
 const after=f.sim.snapshot();assert.ok(choose(f,'claim').duplicate);assert.deepEqual(f.sim.snapshot(),after);assert.ok(f.ui.page('expedition').html.includes('PAYMENT CLAIMED'));
});

test('rendered patrol metadata fences stale accept/work/claim including missing and malformed run fields',()=>{
 const f=fixture(paid()),accept=buttons(f.ui.page('expedition').html).find(b=>b.dataset.rpg==='expedition-patrol-accept');assert.deepEqual([accept.dataset.run,accept.dataset.priorClaim],['1','0']);f.ui.action(accept);assert.ok(f.result.ok);
 let before=f.sim.snapshot();for(const extra of[{}, {run:'x',priorClaim:'0'},{run:'2',priorClaim:'1'}]){choose(f,'patrol-step','inspect-water',extra);assert.equal(f.result.ok,false);assert.deepEqual(f.sim.snapshot(),before);}
 const rendered=buttons(f.ui.page('expedition').html).find(b=>b.dataset.rpg==='expedition-patrol-step');assert.deepEqual([rendered.dataset.run,rendered.dataset.priorClaim],['1','0']);locate(f,E.patrol.steps[0]);f.ui.action(rendered);assert.ok(f.result.ok);assert.equal(f.commands.at(-1).payload.run,1);
 // Planted valid completed run tests stale DOM contracts, not earned combat.
 f.sim.state.earthExpedition.patrol.active.steps=E.patrol.steps.map(s=>s.id);C.validate(f.sim.snapshot());locate(f,E.definition.giver);const oldClaim=buttons(f.ui.page('expedition').html).find(b=>b.dataset.rpg==='expedition-patrol-claim');assert.deepEqual([oldClaim.dataset.run,oldClaim.dataset.priorClaim],['1','0']);f.ui.action(oldClaim);assert.ok(f.result.ok);
 const next=buttons(f.ui.page('expedition').html).find(b=>b.dataset.rpg==='expedition-patrol-accept');assert.deepEqual([next.dataset.run,next.dataset.priorClaim],['2','1']);f.ui.action(next);assert.ok(f.result.ok);before=f.sim.snapshot();f.ui.action(oldClaim);assert.ok(f.result.duplicate);assert.deepEqual(f.sim.snapshot(),before);f.ui.action(accept);assert.equal(f.result.ok,false);assert.deepEqual(f.sim.snapshot(),before);f.ui.action(rendered);assert.equal(f.result.ok,false);assert.deepEqual(f.sim.snapshot(),before);
 assert.deepEqual(UI.routePoints(f.sim).map(p=>[p.id,p.run]),[['inspect-water',2]]);
});

test('production comparison retains bow behavior, socket, current XP and earlier fits without auto-equipping',()=>{
 const source=path.join(ROOT,'docs/evidence/world-production-2026-10-03/captures/returning-fit-final-01/FINAL_WORLD.json'),s=C.validate(JSON.parse(fs.readFileSync(source))),a=s.adventure;
 // A migrated earned veteran is the basis; added bow ownership/socket and cap
 // are labelled preview-only adversarial fixtures, not an earned bow claim.
 if(!a.owned.includes('trail_bow'))a.owned.push('trail_bow');a.arsenal.sockets.trail_bow='ruby';a.xp=9999;A.validate(a);const before=copy(a);
 for(const id of['dawn_edge','trail_bow'])for(const kind of['edge','shelter']){
  const c=UI.comparison(a,id,kind),selected={...a,equipment:{...a.equipment,weapon:id}};assert.deepEqual(c.equipped,A.stats(a));assert.deepEqual(c.before,A.stats(selected));assert.deepEqual(c.weapon,AR.weapon(selected));
  assert.equal(c.after.attack-c.before.attack,kind==='edge'?2:0);assert.equal(c.after.defense-c.before.defense,kind==='shelter'?1:0);assert.equal(c.after.maxHP-c.before.maxHP,kind==='shelter'?10:0);
  assert.deepEqual(c.weapon,id==='trail_bow'?{style:'bow',reach:11,cooldown:.75,stamina:6,primary:'Loose arrow',special:'Piercing light'}:{style:'blade',reach:2.65,cooldown:.52,stamina:0,primary:'Sunstrike',special:'Dawn sweep'});
 }
 assert.deepEqual(a,before);assert.equal(UI.comparison(a,'dawn_edge','edge').before.attack,51);assert.equal(a.xp,9999);assert.equal(a.realmCraft.weapon,'dawn_edge');assert.equal(a.pursuit.fittings.dawn_edge,2);assert.equal(a.reward,'dawn_edge');
 const noSocket=copy(a);delete noSocket.arsenal.sockets.trail_bow;assert.equal(UI.comparison(a,'trail_bow','edge').before.attack-UI.comparison(noSocket,'trail_bow','edge').before.attack,4,'selected bow ruby remains active');const noRealmFit=copy(a);noRealmFit.realmCraft.weapon=null;assert.equal(UI.comparison(a,'dawn_edge','edge').before.attack-UI.comparison(noRealmFit,'dawn_edge','edge').before.attack,3,'prior realm fitting remains counted');
 const f=fixture(paid());f.sim.state.adventure=a;choose(f,'binding-preview','trail_bow',{kind:'shelter'});const html=f.ui.fitting();for(const text of['Equipped now','Selected weapon','After binding','11 m reach','0.75 s ordinary recovery','6 ordinary stamina','socket are retained','XP fixed'])assert.ok(html.includes(text),text);assert.deepEqual(a,before);
});

test('binding preview refuses changed character, simulation, adventure revision and weapon; cancellation spends nothing',()=>{
 const changes=[f=>f.active='other-character',f=>f.sim=new C.Simulation(f.sim.snapshot()),f=>f.sim.state.adventure.revision++];
 for(const change of changes){const f=fixture(paid());choose(f,'binding-preview','trail_blade',{kind:'edge'});change(f);const before=f.sim.snapshot();choose(f,'binding-confirm','trail_blade');assert.equal(f.boundCalls,0);assert.equal(f.ui.pending,null);assert.deepEqual(f.sim.snapshot(),before);assert.ok(f.toasts.at(-1).includes('character changed'));}
 const f=fixture(paid());choose(f,'binding-preview','trail_blade',{kind:'shelter'});const before=f.sim.snapshot();choose(f,'binding-confirm','dawn_edge');assert.equal(f.boundCalls,0);assert.deepEqual(f.sim.snapshot(),before);choose(f,'binding-preview','trail_blade',{kind:'edge'});choose(f,'binding-cancel');assert.equal(f.ui.pending,null);assert.equal(f.boundCalls,0);assert.deepEqual(f.sim.snapshot(),before);
});

test('real CharacterStore saver refuses an external write between binding preview and confirmation atomically',()=>{
 const f=fixture(paid());f.sim.room=null;f.sim.state.player={x:11,z:9,yaw:0};f.sim.state.adventure.ore=3;f.sim.state.adventure.coins=8;f.sim.state.sandbox.inventory.fiber=6;C.validate(f.sim.snapshot());
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},store=new CH.Store(storage);store.load();store.writer=true;assert.ok(store.command('import',{world:f.sim.snapshot()},C.fresh(),store.revision).ok);f.active=store.active;f.revision=store.revision;
 f.save=candidate=>store.save(candidate);choose(f,'binding-preview','trail_blade',{kind:'edge'});const before=f.sim.snapshot(),external=copy(store.record);external.revision++;values.set(CH.KEY,JSON.stringify(external));choose(f,'binding-confirm','trail_blade');assert.equal(f.boundCalls,1);assert.equal(f.result.ok,false);assert.match(f.result.error,/Another tab changed/);assert.deepEqual(f.sim.snapshot(),before);assert.equal(f.ui.pending.weapon,'trail_blade');assert.equal(JSON.parse(values.get(CH.KEY)).revision,external.revision);
});

test('explicit binding confirmation spends once at actual station, leaves equipment/HP/XP and socket intact',()=>{
 const f=fixture(paid());f.sim.room=null;f.sim.state.player={x:11,z:9,yaw:0};f.sim.state.adventure.ore=5;f.sim.state.adventure.coins=10;f.sim.state.sandbox.inventory.fiber=8;f.sim.state.adventure.arsenal.sockets.trail_blade='moonstone';C.validate(f.sim.snapshot());const before=f.sim.snapshot(),stats=A.stats(before.adventure);
 choose(f,'binding-preview','trail_blade',{kind:'shelter'});assert.deepEqual(f.sim.snapshot(),before);choose(f,'binding-confirm','trail_blade');assert.ok(f.result.ok,f.result.error);assert.equal(f.ui.pending,null);assert.deepEqual(f.sim.state.adventure.earthBinding,{version:1,weapon:'trail_blade',kind:'shelter'});assert.equal(f.sim.state.adventure.ore,before.adventure.ore-3);assert.equal(f.sim.state.adventure.coins,before.adventure.coins-8);assert.equal(f.sim.state.sandbox.inventory.fiber,before.sandbox.inventory.fiber-6);assert.equal(f.sim.state.adventure.hp,before.adventure.hp);assert.equal(f.sim.state.adventure.xp,before.adventure.xp);assert.deepEqual(f.sim.state.adventure.equipment,before.adventure.equipment);assert.deepEqual(f.sim.state.adventure.arsenal,before.adventure.arsenal);assert.equal(A.stats(f.sim.state.adventure).maxHP,stats.maxHP+10);assert.equal(A.stats(f.sim.state.adventure).defense,stats.defense+1);assert.ok(f.ui.fitting().includes('once')||f.ui.fitting().includes('carries the shelter binding'));
 const after=f.sim.snapshot();choose(f,'binding-preview','trail_blade',{kind:'edge'});choose(f,'binding-confirm','trail_blade');assert.equal(f.result.ok,false);assert.deepEqual(f.sim.snapshot(),after);
});

test('capped and near-cap acceptance cards disclose actual credit and real claim agrees',()=>{
 for(const xp of[9999,9990]){const fresh=fixture({xp}),preaccept=fresh.ui.page('expedition').html,f=fixture({...paid(),claimed:false,xp}),html=f.ui.page('expedition').html,credit=Math.min(45,9999-xp),text=credit===0?'payment adds 0 XP':'can add '+credit+' of its 45 XP';assert.ok(preaccept.includes(text),'honest preaccept XP credit at '+xp);assert.ok(html.includes(text),'honest ready XP credit at '+xp);assert.ok(choose(f,'claim').ok);assert.equal(f.result.reward.xp,credit);assert.equal(f.sim.state.adventure.xp,9999);const patrol=f.ui.page('expedition').html;assert.ok(patrol.includes('payment adds 0 XP'),'patrol cap disclosed');}
});

test('actual RPG tick leaves expedition ready/paid/patrol tracker last over concurrent survey and trail',()=>{
 const doc=documentStub(),prior=globalThis.document;globalThis.document=doc;
 try{for(const mode of['ready','paid','patrol-ready']){
  const f=fixture({...paid(),claimed:mode!=='ready',patrol:mode==='patrol-ready'?{lastClaim:0,active:{run:1,steps:E.patrol.steps.map(s=>s.id)}}:null});
  const d=R.definitions().find(d=>d.realm==='earthlands');f.sim.state.realmTrails.records[d.id].accepted=true;C.validate(f.sim.snapshot());f.rpg.quest='expedition';f.rpg.api.adventure=()=>({intent:null,sound(){}});f.rpg.targetCue=f.rpg.numbers=f.rpg.worldHealth=()=>{};
  for(const name of['crossing','starter','pursuit','cosmos','earth','gathering'])f.rpg[name]={tick(){}};f.rpg.dialog.addEventListener=()=>{};f.rpg.worlds=new WUI.WorldUI(f.rpg);f.rpg.trails=new TUI.TrailsUI(f.rpg);RPG.RPGUI.prototype.tick.call(f.rpg);
  assert.equal(doc.querySelector('#tracked-title').textContent,mode==='patrol-ready'?E.patrol.title:E.definition.title);assert.equal(doc.querySelector('#tracked-detail').textContent.includes('Return to Rill'),mode!=='paid');assert.ok(doc.querySelector('#tracked-chapter').textContent.startsWith('ELDERWEALD'));
 }}finally{globalThis.document=prior;}
});

test('actual app applyWorld restore selects accepted or ready expedition and active patrol without losing history',()=>{
 const p=path.resolve(arg('--app-source')||path.join(ROOT,'src/app.js')),source=fs.readFileSync(p,'utf8'),trackerFailures=[];evidence.push({appSource:p,sha256:hash(p)});
 for(const mode of['accepted','ready','patrol']){
  const f=fixture(mode==='accepted'?{steps:['assess-load']}:mode==='ready'?{...paid(),claimed:false}:{...paid(),patrol:{lastClaim:0,active:{run:1,steps:[]}}}),input=f.sim.snapshot();
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},store=new CH.Store(storage);store.load();store.writer=true;const imported=store.command('import',{world:input},C.fresh(),store.revision);assert.ok(imported.ok,imported.error);
  const rpg={quest:'project',reset(){},tick(){this.seen=this.quest;}},context={C,sim:f.sim,keys:new Set(),pointers:new Map(),gesture:null,document:documentStub(),rpg,adventure:null,sandbox:null,experience:null,audio:{disable(){}},camera:{},scene:null,switchScene(){},selected:null,follow:null,closePanel(){},engine:null,resize(){},lastSave:0,elapsed:42};
  vm.createContext(context);vm.runInContext(literalFunction(source,'applyWorld'),context);context.input=imported.state;vm.runInContext('applyWorld(input);',context);if(rpg.seen!=='expedition')trackerFailures.push(mode+' imported tracker = '+rpg.seen);assert.deepEqual(context.sim.state.earthExpedition,input.earthExpedition);assert.deepEqual(context.sim.state.adventure.earthBinding,input.adventure.earthBinding);assert.equal(context.lastSave,42);
  const other=store.command('switch',{id:'character-1'},context.sim.snapshot(),store.revision);assert.ok(other.ok,other.error);context.input=other.state;vm.runInContext('applyWorld(input);',context);assert.equal(rpg.seen,'story');const back=store.command('switch',{id:imported.active},context.sim.snapshot(),store.revision);assert.ok(back.ok,back.error);context.input=back.state;vm.runInContext('applyWorld(input);',context);if(rpg.seen!=='expedition')trackerFailures.push(mode+' switched tracker = '+rpg.seen);assert.deepEqual(context.sim.state.earthExpedition,input.earthExpedition);
 }
 assert.deepEqual(trackerFailures,[],'actual accepted/ready/patrol import and switch tracker');
});

test('actual app worldContext installs synchronous savers on fresh restored Sim before active expedition combat',()=>{
 const p=path.resolve(arg('--app-source')||path.join(ROOT,'src/app.js')),source=fs.readFileSync(p,'utf8'),f=fixture({steps:E.definition.steps.slice(0,3).map(s=>s.id),branch:'managed-coppice'});
 const sim=new C.Simulation(f.sim.snapshot());sim.room='world-earthlands';const saved=[],context={sim,worldSave:c=>{saved.push(C.validate(c));return{ok:true};},characterStore:{active:'restored-character',revision:4}};vm.createContext(context);vm.runInContext(literalFunction(source,'worldContext')+'\nresult=worldContext();',context);assert.strictEqual(context.result.sim,sim);assert.strictEqual(sim.earthExpeditionSave,context.worldSave);assert.strictEqual(sim.realmTrailSave,context.worldSave);assert.equal(context.result.active,'restored-character');assert.equal(context.result.revision,4);
 A.syncScene(sim);assert.ok(A.runtime(sim).enemies.some(e=>e.expeditionQuest===E.definition.id));const candidate=sim.snapshot();assert.ok(E.commit(sim,candidate,{save:sim.earthExpeditionSave},'Labelled saver installation probe.').ok);assert.equal(saved.length,1);
 // Native import/switch starts at its saved home checkpoint and travels through
 // worldTravel(worldContext()). Direct test-only room injection is not that path.
 assert.ok(/RealmWorldFoundations\.enter\(ticket,worldContext\(\)/.test(source),'actual travel caller installs saver');assert.ok(/applyWorld\(result\.state\)/.test(source),'actual character result restores through applyWorld');
});

if(arg('--earned-sources'))test('separate command-earned snapshots render accepted/partial/ready/paid/bound and two exact patrol histories',()=>{
 const base=path.resolve(arg('--earned-sources'));for(const variant of['fresh-blade','fresh-bow','veteran']){
  const dir=path.join(base,variant),reportPath=path.join(dir,'EARTH_EXPEDITION_JOURNEY_REPORT.json'),report=JSON.parse(fs.readFileSync(reportPath));assert.equal(report.status,'passed');assert.equal(report.sourceDrift,false);assert.equal(report.manualDamage,0);assert.equal(report.plantedDefeats,0);assert.equal(report.inventoryGrants,0);assert.equal(report.positionEdits,0);evidence.push({variant,reportPath,sha256:hash(reportPath),method:report.method});
  for(const name of['00_COMMAND_EARNED_SOURCE','01_ACCEPTED','02_PARTIAL','03_READY_UNPAID','04_FIRST_CLAIMED','PATROL_1_PARTIAL','PATROL_1_READY','PATROL_1_CLAIMED','PATROL_2_PARTIAL','PATROL_2_READY','PATROL_2_CLAIMED','05_BOUND_RELOADED','06_BOUND_ACTUAL_IMPACT_RELOADED']){
   const p=path.join(dir,name+'.json'),s=C.validate(JSON.parse(fs.readFileSync(p))),f=fixture();f.sim=new C.Simulation(s);f.sim.room='world-earthlands';const before=f.sim.snapshot(),html=f.ui.page('expedition').html,points=UI.routePoints(f.sim),prog=E.progress(f.sim);assert.ok(html.includes(E.definition.title));assert.deepEqual(f.sim.snapshot(),before);if(prog.patrol.active)assert.ok(points.every(p=>p.run===prog.patrol.active.run));else if(prog.story.claimed)assert.equal(points.length,0);if(name==='03_READY_UNPAID')assert.ok(html.includes('payment ready'));if(name==='04_FIRST_CLAIMED')assert.ok(html.includes('PAYMENT CLAIMED'));if(name==='PATROL_2_CLAIMED')assert.equal(s.earthExpedition.patrol.lastClaim,2);evidence.push({variant,snapshot:name,sha256:hash(p)});
  }
 }
});

const report={method:'CPU production page/action/rule/Store qualification; explicit DOM/event/position/history stubs. Not native browser, new earned combat, RAF, hardware or human acceptance.',head:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),harnessSha256:hash(__filename),sourceHashes:Object.fromEntries(['src/earth-expedition-ui.js','src/world-foundations-ui.js','src/rpg-ui.js','src/app.js','src/earth-expedition.js','src/core.js','src/adventure.js','src/characters.js'].map(p=>[p,hash(path.join(ROOT,p))])),cases:results.length,passed:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length,results,evidence};
if(arg('--output')){const out=path.resolve(arg('--output'));if(process.platform==='win32')assert.match(out,/^D:/i,'local heavy output belongs on D');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'EARTH_EXPEDITION_UI_REPORT.json'),JSON.stringify(report,null,2)+'\n');}
console.log('Earth expedition CPU UI: '+report.passed+'/'+report.cases+' cases passed; '+report.failed+' failed.');if(report.failed)process.exitCode=1;
