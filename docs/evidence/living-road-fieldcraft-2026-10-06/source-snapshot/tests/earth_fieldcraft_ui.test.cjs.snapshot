/* Integrated CPU controller tests. Prefix histories, owner leases and DOM nodes
 * are labelled synthetic. Rule operations, Core/E.command/Store validators
 * and original ExpeditionUI dispatch are real. No browser/earned claim. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),CH=require(path.join(ROOT,'src/characters.js'));
require(path.join(ROOT,'src/world-foundations.js'));const Existing=require(path.join(ROOT,'src/earth-expedition-ui.js'));
const F=require('../src/earth-fieldcraft.js'),Art=require('../src/earth-fieldcraft-art.js'),{FieldcraftUI}=require('../src/earth-fieldcraft-ui.js');
const E=require('../src/earth-expedition.js');
const PREFIX='expedition-fieldcraft-',STEP='brace-root-channel',copy=o=>JSON.parse(JSON.stringify(o));
function fixture(){
 const sim=new C.Simulation();sim.state.adventure.started=true;sim.state.adventure.owned=['trail_blade','travel_coat'];sim.state.adventure.equipment.weapon='trail_blade';sim.state.adventure.equipment.armor='travel_coat';
 sim.state.earthExpedition.story={accepted:true,branch:'managed-coppice',steps:E.definition.steps.slice(0,6).map(s=>s.id),claimed:false};
 sim.returnPos={...sim.state.player};sim.room=F.GEOMETRY.room;sim.state.player={x:-145,z:-84,yaw:0};
 const f={sim,lease:Object.freeze({}),commands:[],saves:[],toasts:[],permitSave:true,ctxCalls:0};
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 storage.setItem(CH.KEY,JSON.stringify({version:1,revision:1,nextId:2,active:'character-1',slots:[{id:'character-1',world:sim.snapshot()}]}));
 f.store=new CH.Store(storage);f.store.load();f.store.writer=true;sim.worldTrip={active:f.store.active,realm:'earthlands',home:copy(sim.returnPos)};sim.fieldcraftOwnerLease=f.lease;
 f.ctx=()=>{f.ctxCalls++;return{sim:f.sim,active:f.store.active,revision:f.store.revision,ownerLease:f.lease};};
 f.save=state=>{if(!f.permitSave)return{ok:false,error:'Labelled synthetic storage refusal <quota>'};const r=f.store.save(state);if(r.ok)f.saves.push(C.validate(state));return r;};
 f.rpg={get sim(){return f.sim;},paints:0,paint(){this.paints++;},api:{fieldcraftContext:f.ctx,toast:t=>f.toasts.push(t),expeditionCommand(type,payload){
  f.commands.push({type,payload});const ctx=f.ctx();
  return f.result=E.command(ctx,type,payload,{save:f.save});
 }}};
 f.ui=new FieldcraftUI(f.rpg);f.existing=new Existing.ExpeditionUI(f.rpg);
 f.route=el=>f.ui.action(el)||f.existing.action(el);return f;
}
function attributes(text){return Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));}
function dataset(attrs){return Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));}
function nodes(html,kind){return[...html.matchAll(new RegExp('<'+kind+'\\b([^>]*)>','g'))].map(m=>{const a=attributes(m[1]);return{tagName:kind.toUpperCase(),dataset:dataset(a),value:a.value??'',disabled:/\bdisabled(?:\s|$)/.test(m[1]),id:a.id};});}
function click(f,type){const el=nodes(f.ui.panel(),'button').find(n=>n.dataset.rpg===PREFIX+type);assert.ok(el,'actual rendered '+type+' control');assert.equal(f.route(el),true);return f.result;}
function poseNode(f,axis,value){const node=nodes(f.ui.panel(),'input').find(n=>n.dataset.fieldcraftAxis===axis);assert.ok(node);node.value=String(value);return node;}
function pose(f,axis,value){assert.equal(f.ui.input(poseNode(f,axis,value)),true);}
function begin(f){click(f,'begin');assert.ok(F.current(f.sim));}
function fitOne(f,{reuse=false}={}){click(f,'inspect');if(reuse)click(f,'reuse');else{pose(f,'yaw',0);pose(f,'pitch',14.6);}click(f,'seat');}
function ready(f){begin(f);for(let i=0;i<4;i++)fitOne(f,{reuse:i>0});assert.equal(F.current(f.sim).complete,true);}
const durable=f=>JSON.stringify(f.sim.state);
function controlsRoot(f){
 const inputs=nodes(f.ui.panel(),'input'),notice={textContent:''},gap={textContent:''},seat=nodes(f.ui.panel(),'button').find(n=>n.dataset.rpg===PREFIX+'seat');
 const root={querySelector:s=>s==='[data-fieldcraft-notice]'?notice:s==='[data-fieldcraft-gap]'?gap:seat,querySelectorAll:()=>inputs};
 inputs.forEach(n=>n.closest=s=>{assert.equal(s,'[data-fieldcraft-panel]');return root;});return{inputs,notice,gap,seat};
}

test('rendered child routing begins real transient fitting and keeps expedition authority separate',()=>{
 const f=fixture(),before=durable(f);assert.equal(f.ui.action({dataset:{rpg:'world-return'}}),false);assert.equal(f.ui.action({dataset:{rpg:'expedition-step'}}),false);
 assert.equal(nodes(f.ui.panel(),'button').length,1);begin(f);assert.equal(F.current(f.sim).activeSection,'brace-1');assert.equal(f.commands.length,0);assert.equal(durable(f),before);assert.equal(f.saves.length,0);
 const p=F.current(f.sim),input=poseNode(f,'yaw',4);assert.equal(f.route(input),true);assert.ok(F.isProjection(p),'range click only focuses; input event owns mutation');
 assert.equal(f.ui.action({dataset:{rpg:PREFIX+'invented'}}),true);assert.equal(f.commands.length,0);assert.equal(durable(f),before);
});
test('wrong fits, missing inspection, stale section controls and illegal numeric poses grant no progress',()=>{
 const f=fixture();begin(f);const before=durable(f);click(f,'seat');assert.equal(F.current(f.sim).sections.filter(s=>s.seated).length,0);
 click(f,'inspect');pose(f,'yaw',2);pose(f,'pitch',14);click(f,'seat');assert.match(f.toasts.at(-1),/Correct yaw and pitch/);
 const savedView=F.current(f.sim),savedParts=Art.parts(f.sim.state.earthExpedition,savedView);
 for(const value of['','NaN','Infinity','-1','20.1']){pose(f,'yaw',value);assert.deepEqual(Art.parts(f.sim.state.earthExpedition,F.current(f.sim)),savedParts);}
 const wrong={dataset:{rpg:PREFIX+'seat',section:'brace-4'}};f.route(wrong);assert.match(f.toasts.at(-1),/stale/);assert.equal(durable(f),before);assert.equal(f.commands.length,0);
});
test('native-style input routing updates feedback and counterpart controls in place without repaint',()=>{
 const f=fixture();begin(f);click(f,'inspect');const {inputs,gap,notice,seat}=controlsRoot(f),yaw=inputs.find(n=>n.dataset.fieldcraftAxis==='yaw'),pitch=inputs.find(n=>n.dataset.fieldcraftAxis==='pitch'),paints=f.rpg.paints;
 yaw.value='0';f.ui.input(yaw);pitch.value='14.6';f.ui.input(pitch);assert.equal(f.rpg.paints,paints);assert.match(gap.textContent,/Ready to seat/);assert.match(gap.textContent,/0\.0 cm/);assert.equal(seat.disabled,false);assert.equal(inputs.find(n=>n.id==='fieldcraft-pitch-number').value,'14.6');
 const view=F.current(f.sim);pitch.value='36';f.ui.input(pitch);assert.match(notice.textContent,/0-35 degrees/);assert.ok(F.isProjection(view),'refused input does not clamp or advance the preview');assert.equal(f.rpg.paints,paints);
});
test('four real sections require deliberate inspect and seat; reuse changes only orientation',()=>{
 const f=fixture(),before=durable(f);begin(f);fitOne(f);assert.equal(F.current(f.sim).sections.filter(s=>s.seated).length,1);
 click(f,'reuse');const view=F.current(f.sim);assert.equal(view.sections.filter(s=>s.seated).length,1);assert.equal(view.receivers.find(r=>r.id==='east-joint-2').inspected,false);click(f,'seat');assert.equal(F.current(f.sim).sections.filter(s=>s.seated).length,1);
 for(let i=1;i<4;i++)fitOne(f,{reuse:true});assert.equal(F.current(f.sim).complete,true);assert.equal(durable(f),before);assert.equal(f.saves.length,0);assert.equal(f.commands.length,0);
 assert.equal(nodes(f.ui.panel(),'button').filter(n=>n.dataset.rpg===PREFIX+'fasten').length,1);assert.ok(!f.ui.panel().includes('earth-fieldcraft-v1-fitting'),'opaque completion ticket never enters DOM');assert.equal(Object.keys(f.ui).includes('ticket'),false);
});
test('save refusal preserves ready ticket; explicit retry commits real expedition once and consumes after success',()=>{
 const f=fixture();ready(f);const before=durable(f);f.permitSave=false;click(f,'fasten');assert.equal(f.result.ok,false);assert.equal(durable(f),before);assert.equal(F.current(f.sim).complete,true);assert.match(f.ui.panel(),/&lt;quota&gt;/);const ticket=f.commands[0].payload.fittingTicket;assert.ok(F.validate(f.ctx(),ticket).ok);
 f.permitSave=true;click(f,'fasten');assert.equal(f.result.ok,true);assert.equal(f.commands[1].payload.fittingTicket,ticket);assert.equal(f.saves.length,1);assert.equal(F.validate(f.ctx(),ticket).ok,false);assert.ok(f.sim.state.earthExpedition.story.steps.includes(STEP));assert.equal(F.current(f.sim),null);assert.equal(nodes(f.ui.panel(),'button').length,0);
 const after=copy(f.sim.state),prior=JSON.parse(before);for(const field of['coins','ore','xp','hp','equipment','owned','earthBinding'])assert.deepEqual(after.adventure[field],prior.adventure[field]);assert.deepEqual(after.sandbox,prior.sandbox);assert.equal(after.adventure.revision,prior.adventure.revision+1);
 f.ui.action({dataset:{rpg:PREFIX+'fasten'}});assert.equal(f.commands.length,2,'old fasten DOM has no ticket after accepted repair');
});
test('controller refuses unconfirmed free success and thrown saver without discarding current fitting',()=>{
 const f=fixture();ready(f);const before=durable(f);f.rpg.api.expeditionCommand=()=>({ok:true,text:'incorrect unrecorded success'});click(f,'fasten');assert.match(f.toasts.at(-1),/without a recorded repair/);assert.equal(F.current(f.sim).complete,true);assert.equal(durable(f),before);
 f.rpg.api.expeditionCommand=()=>{throw Error('Labelled synthetic throwing saver');};click(f,'fasten');assert.equal(F.current(f.sim).complete,true);assert.equal(durable(f),before);
});
test('confirmed saved completion keeps a distinct postcommit warning visible without offering another fasten',()=>{
 const f=fixture();ready(f);const real=f.rpg.api.expeditionCommand;f.rpg.api.expeditionCommand=(...args)=>({...real(...args),warning:'Synthetic postcommit cleanup warning <retained>'});click(f,'fasten');assert.ok(f.sim.state.earthExpedition.story.steps.includes(STEP));assert.equal(f.saves.length,1);assert.match(f.toasts.at(-1),/cleanup warning/);assert.match(f.ui.panel(),/warning &lt;retained&gt;/);assert.equal(nodes(f.ui.panel(),'button').length,0);assert.match(f.ui.panel(),/support is recorded/);
});
test('real managed Store observation/camera/time saves and menu resets retain fitting with fresh context',()=>{
 const f=fixture();begin(f);fitOne(f);const beforeSteps=copy(f.sim.state.earthExpedition),revision=f.store.revision,calls=f.ctxCalls;
 for(const reason of[undefined,'presentation','menu','camera','time','close','tab'])f.ui.reset(reason);
 f.sim.state.settings.cameraFov=66;assert.ok(f.store.save(f.sim.snapshot()).ok);f.sim.setTime(11);assert.ok(f.store.save(f.sim.snapshot()).ok);f.sim.state.weather='rain';assert.ok(f.store.save(f.sim.snapshot()).ok);
 assert.ok(f.store.revision>revision);f.ui.panel();click(f,'inspect');click(f,'reuse');assert.equal(F.current(f.sim).sections.filter(s=>s.seated).length,1);assert.deepEqual(f.sim.state.earthExpedition,beforeSteps);assert.ok(f.ctxCalls>calls,'all operations re-fetch actual current owner data');click(f,'seat');assert.equal(F.current(f.sim).sections.filter(s=>s.seated).length,2);
});
test('explicit cancel/restart discard only transient work and invalidate previous branded views',()=>{
 const f=fixture(),before=durable(f);begin(f);fitOne(f);const previous=F.current(f.sim);click(f,'restart');assert.equal(F.isProjection(previous),false);assert.equal(F.current(f.sim).sections.filter(s=>s.seated).length,0);
 const restarted=F.current(f.sim);click(f,'cancel');assert.equal(F.isProjection(restarted),false);assert.equal(F.current(f.sim),null);assert.equal(durable(f),before);assert.equal(f.commands.length,0);assert.match(f.ui.panel(),/Recorded work is kept/);
});
test('real owner, scene, death, imported state and work-range expiry reject final action and revoke old art',()=>{
 const changes=[f=>{f.lease=Object.freeze({});f.sim.fieldcraftOwnerLease=f.lease;},f=>f.sim.room='world-atlantis',f=>f.sim.state.adventure.deaths++,f=>f.sim.state=copy(f.sim.state),f=>f.sim.state.player.x+=10,f=>f.sim.worldTrip={...f.sim.worldTrip}];
 for(const change of changes){const f=fixture();ready(f);const view=F.current(f.sim);change(f);const before=durable(f);f.ui.action({dataset:{rpg:PREFIX+'fasten'}});assert.equal(f.commands.length,0);assert.equal(F.isProjection(view),false);assert.equal(durable(f),before);assert.match(f.toasts.at(-1),/current fitting/);}
 for(const reason of['owner','travel','import','character','death','reload']){const f=fixture();begin(f);const view=F.current(f.sim);f.ui.reset(reason);assert.equal(F.isProjection(view),false);assert.equal(F.current(f.sim),null);}
});
test('generic ExpeditionUI step cannot bypass the integrated proof gate or use child DOM as proof',()=>{
 const f=fixture(),before=durable(f);f.route({dataset:{rpg:'expedition-step',id:STEP}});assert.equal(f.result.ok,false);assert.equal(f.commands.length,1);assert.equal(durable(f),before);
 begin(f);f.route({dataset:{rpg:PREFIX+'fasten',fittingTicket:'forged DOM text'}});assert.equal(f.commands.length,1);assert.equal(durable(f),before);
});
test('old completed/paid histories expose retained repair and cold partial reload exposes fresh supplied kit',()=>{
 for(const claimed of[false,true]){const f=fixture();f.sim.state.earthExpedition.story.steps=E.definition.steps.slice(0,claimed?8:7).map(s=>s.id);f.sim.state.earthExpedition.story.claimed=claimed;const before=durable(f);assert.match(f.ui.panel(),/support is recorded/);assert.equal(nodes(f.ui.panel(),'button').length,0);assert.equal(durable(f),before);}
 const f=fixture();begin(f);fitOne(f);const saved=f.sim.snapshot(),restored=new C.Simulation(saved);restored.room=F.GEOMETRY.room;restored.state.player={x:-145,z:-84,yaw:0};restored.returnPos={...f.sim.returnPos};restored.worldTrip={...f.sim.worldTrip,home:{...f.sim.returnPos}};f.sim=restored;f.lease=Object.freeze({});restored.fieldcraftOwnerLease=f.lease;f.ui=new FieldcraftUI(f.rpg);assert.equal(F.current(restored),null);assert.match(f.ui.panel(),/Inspect supplied support/);assert.ok(!restored.state.earthExpedition.story.steps.includes(STEP));
});
test('optional receiving-face action only delegates a real branded view and never chooses camera or seats work',()=>{
 const f=fixture();begin(f);assert.equal(nodes(f.ui.panel(),'button').some(n=>n.dataset.rpg===PREFIX+'look'),false);let calls=0;
 f.rpg.close=()=>{f.closed=(f.closed||0)+1;};f.rpg.api.frameFieldcraft=view=>{calls++;assert.ok(F.isProjection(view,f.sim.state.earthExpedition));return{ok:true,text:'Synthetic callback receipt only'};};const before=durable(f),view=F.current(f.sim),paints=f.rpg.paints;click(f,'look');assert.equal(calls,1);assert.equal(f.closed,1);assert.equal(f.rpg.paints,paints,'successful look closes without repainting/reopening the workspace');assert.ok(F.isProjection(view));assert.equal(durable(f),before);assert.equal(f.commands.length,0);assert.equal(F.current(f.sim).sections.filter(s=>s.seated).length,0);
});
test('unconfirmed receiving-face callback fails closed and leaves workspace/fitting current',()=>{
 const f=fixture();begin(f);f.rpg.close=()=>{f.closed=(f.closed||0)+1;};f.rpg.api.frameFieldcraft=()=>undefined;
 const before=durable(f),view=F.current(f.sim);click(f,'look');assert.match(f.toasts.at(-1),/no confirmation/);assert.equal(f.closed,undefined);assert.ok(F.isProjection(view));assert.equal(durable(f),before);assert.equal(f.commands.length,0);assert.equal(f.saves.length,0);
});
test('recorded-support look delegates null only to the supplied framing owner and closes on confirmation',()=>{
 const f=fixture();f.sim.state.earthExpedition.story.steps=E.definition.steps.slice(0,7).map(s=>s.id);
 f.rpg.close=()=>{f.closed=(f.closed||0)+1;};let calls=0;f.rpg.api.frameFieldcraft=view=>{calls++;assert.strictEqual(view,null);return{ok:true,text:'Synthetic recorded framing receipt only'};};
 const before=durable(f),paints=f.rpg.paints;click(f,'look');assert.equal(calls,1);assert.equal(f.closed,1);assert.equal(f.rpg.paints,paints);assert.equal(durable(f),before);assert.equal(f.commands.length,0);assert.equal(F.current(f.sim),null);
});
