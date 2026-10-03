/* Actual AdventureArt source in a VM; pure module runs normally. Accepted
 * histories/selection/combat samples below are synthetic in-memory fixtures,
 * while entity terms and qualified story/patrol IDs come from real rosters. */
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),A=require('../src/adventure.js'),E=require('../src/engine.js'),W=require('../src/world-foundations.js'),EE=require('../src/earth-expedition.js'),B=require('../src/earth-expedition-beast-art.js');
require('../src/skitter-art.js');require('../src/companion-art.js');
const source=fs.readFileSync(require.resolve('../src/adventure-art.js'),'utf8');
const clone=v=>JSON.parse(JSON.stringify(v)),empty=()=>({box:[],round:[],octa:[]});
const flat=out=>Object.entries(out).flatMap(([kind,ps])=>ps.map(p=>({kind,...p}))),brute=out=>flat(out).filter(p=>p.expeditionBeastPart);
const near=(a,b,e=2e-8)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`),vnear=(a,b)=>a.forEach((n,i)=>near(n,b[i]));
function fresh(room='world-earthlands'){
 const sim=new C.Simulation();sim.room=room;sim.state.adventure.started=true;sim.state.adventure.elapsed=10;sim.presentation={perspective:true};return sim;
}
function story(patrol=false){
 const sim=fresh(),r=EE.fresh();r.story.accepted=true;r.story.branch='managed-coppice';r.story.steps=EE.definition.steps.slice(0,patrol?8:5).map(s=>s.id);r.story.claimed=patrol;
 if(patrol)r.patrol.active={run:1,steps:EE.patrol.steps.slice(0,3).map(s=>s.id)};
 sim.state.earthExpedition=EE.validate(r);A.syncScene(sim);const e=A.runtime(sim).enemies.find(e=>e.expeditionQuest===(patrol?EE.patrol.id:EE.definition.id)&&e.defeatStep==='clear-root-pests');assert.ok(e,'actual qualified roster actor');return{sim,e};
}
function render(sim,e,options={}){
 const r=A.runtime(sim);r.enemies=[e];r.fx=[];sim.state.settings.reducedMotion=options.reducedMotion??false;sim.paused=options.paused??false;sim.presentation={perspective:options.perspective??true,attackTarget:options.target?e.id:null};
 const calls=[],context={RealmCore:global.RealmCore,RealmEngine:E,RealmAdventure:A,RealmWorldFoundations:W,RealmEarthExpedition:options.omitTerms?undefined:EE,RealmClasses:global.RealmClasses,RealmSkitterArt:global.RealmSkitterArt,RealmCompanionArt:global.RealmCompanionArt,
  RealmEarthExpeditionBeastArt:{...B,draw(out,args){calls.push(clone(args));return B.draw(out,args);}}};
 vm.runInNewContext(source,context);const state=JSON.stringify(sim.state),actor=JSON.stringify(e),out=empty();context.RealmAdventureArt.draw(out,sim,options.t??1.2);assert.equal(JSON.stringify(sim.state),state,'art caller changed durable state');assert.equal(JSON.stringify(e),actor,'art caller changed enemy');return{out,calls,art:context.RealmAdventureArt};
}
const sort=ps=>clone(ps).sort((a,b)=>a.expeditionBeastPart.localeCompare(b.expeditionBeastPart));
function standard(e,extra={}){return{...e,x:8,z:-3,maxHP:e.hp,yaw:.7,mode:'idle',timer:0,flash:0,aim:null,...extra};}
function generic(out){return out.octa.filter(p=>p.rough===.25||p.s.every((n,i)=>n===[.2,.65,.2][i]));}
/* Five original submissions captured from actual 13e0a0e67063fc3b412de9cbb5ff2656ba4387bb
 * AdventureArt at t1.2, elapsed10, actor(8,-3), yaw.7, idle/no hit. Source blob
 * SHA256 ddc502723d24b1f1639b76a315622288bb08cfc72881dfa4685c20ed7759e886.
 * Fixed data only; no pasted renderer implementation or Git-history dependency. */
const GOLDEN=[
 {p:[8,2.816393684509016,-3],s:[1.2,1.9,1.2],c:0x9e92b8,r:[0,1,0],rough:.25},
 {p:[8.896292760083876,2.6,-2.918395537982121],s:[.2,.65,.2],c:0xddc59b,em:.9,r:[0,.7,0]},
 {p:[8.082318178009194,2.6,-3.8962274920851545],s:[.2,.65,.2],c:0xddc59b,em:.9,r:[0,.7,0]},
 {p:[7.10383834424398,2.6,-3.083031841799561],s:[.2,.65,.2],c:0xddc59b,em:.9,r:[0,.7,0]},
 {p:[7.91625454706358,2.6,-2.1039047488617775],s:[.2,.65,.2],c:0xddc59b,em:.9,r:[0,.7,0]}
];
function checkGolden(ps){assert.equal(ps.length,5);for(let i=0;i<5;i++){vnear(ps[i].p,GOLDEN[i].p);assert.deepEqual(clone({...ps[i],p:GOLDEN[i].p}),GOLDEN[i]);}}

test('production first-story and patrol roster actors from synthetic histories dispatch exactly once',()=>{
 for(const patrol of [false,true]){const{sim,e}=story(patrol);const{out,calls}=render(sim,e);assert.equal(calls.length,1);assert.equal(brute(out).length,41);assert.equal(generic(out).length,0);assert.equal(e.hp,136);assert.equal(e.damage,11);assert.equal(e.windup,1.35);assert.equal(e.recovery,2.3);
  assert.deepEqual(sort(brute(out)),sort(B.parts(calls[0])));assert.equal(calls[0].base,W.height(sim.room,e.x,e.z));assert.equal(calls[0].yaw,e.yaw);assert.equal(calls[0].timer,e.timer);assert.equal(calls[0].time,sim.state.adventure.elapsed);
 }
});
test('unrelated actual mine and world sentinels retain the five-part original golden control',()=>{
 const mine=fresh('mine'),prism=A.roster(mine).find(e=>e.id==='sentinel');assert.ok(prism);const m=render(mine,standard(prism));assert.equal(m.calls.length,0);assert.equal(brute(m.out).length,0);checkGolden(generic(m.out));
 const hell=fresh('world-hell');A.syncScene(hell);const salvage=A.runtime(hell).enemies.find(e=>e.id==='hell-salvage-sentinel');assert.ok(salvage,'actual world roster sentinel');assert.equal(salvage.worldRealm,'hell');
 const h=render(hell,standard(salvage));assert.equal(h.calls.length,0);assert.equal(brute(h.out).length,0);checkGolden(generic(h.out));
});
test('wrong step, missing/unknown/prefixed/suffixed quest, wrong kind and absent terms do not dispatch',()=>{
 const negative=[{defeatStep:'clear-crossing'},{defeatStep:undefined},{expeditionQuest:undefined},{expeditionQuest:'other-quest'},{expeditionQuest:'prefix-'+EE.definition.id},{expeditionQuest:EE.definition.id+'-suffix'},{kind:'skitter'}];
 for(const changed of negative){const{sim,e}=story(),actor=standard(e,changed),r=render(sim,actor);assert.equal(r.calls.length,0,JSON.stringify(changed));assert.equal(brute(r.out).length,0);if(actor.kind==='sentinel')checkGolden(generic(r.out));else assert.equal(flat(r.out).filter(p=>p.skitterPart).length,26);}
 const{sim,e}=story(),r=render(sim,standard(e),{omitTerms:true});assert.equal(r.calls.length,0);checkGolden(generic(r.out));
});
test('dead root actor keeps existing dead suppression without warning or target emissions',()=>{
 for(const hp of [0,-1]){const{sim,e}=story();e.hp=hp;e.mode='windup';e.timer=.5;e.aim={x:-130,z:-71};const r=render(sim,e,{target:true,perspective:false});assert.equal(r.calls.length,0);assert.deepEqual(flat(r.out),[]);}
});
test('nonzero yaw, support height and actual confirmed-hit recoil are submitted exactly once',()=>{
 for(const yaw of [.73,Math.PI*1.5])for(const age of [0,.09,.179]){const{sim,e}=story();Object.assign(e,{yaw,mode:'windup',timer:.4,aim:{x:-130,z:-68},hitAt:10-age,hitFrom:{x:e.x-3,z:e.z-4}});
  const r=render(sim,e),args=r.calls[0],amount=(1-age/.18)*.12;assert.equal(r.calls.length,1);near(args.x,e.x+.6*amount);near(args.z,e.z+.8*amount);near(args.yaw,yaw);near(args.base,1.57);assert.deepEqual(sort(brute(r.out)),sort(B.parts(args)),'generic post-transform must not rotate/scale/recoil world matrices again');
  const nose=brute(r.out).find(p=>p.expeditionBeastPart==='nose');vnear(nose.p,nose.m.slice(12,15));assert.equal(nose.r,undefined);
 }
});
test('future, missing, expired and reduced-motion hit samples add no recoil',()=>{
 for(const extra of [{hitAt:10.01},{hitAt:undefined},{hitAt:9.82},{hitAt:9},{hitAt:9.91,reducedMotion:true},{hitAt:9.91,hitFrom:null}]){
  const{sim,e}=story();Object.assign(e,{yaw:.63,hitFrom:{x:e.x-1,z:e.z},...extra});const r=render(sim,e,{reducedMotion:extra.reducedMotion});near(r.calls[0].x,e.x);near(r.calls[0].z,e.z);assert.deepEqual(sort(brute(r.out)),sort(B.parts(r.calls[0])));
 }
});
test('actual flash lifetime recolors only the selected beast geometry',()=>{
 for(const flash of [0,10,10.1]){const{sim,e}=story();e.flash=flash;const r=render(sim,e);assert.equal(r.calls[0].flash,flash>10);assert.ok(brute(r.out).every(p=>p.confirmedFlash===(flash>10)));if(flash>10)assert.ok(brute(r.out).every(p=>p.c===0xf8e4b9));else assert.ok(brute(r.out).some(p=>p.c!==0xf8e4b9));}
});
test('aim-centered warning rings and actor-centered selected-target ring remain outside body transforms',()=>{
 for(const reducedMotion of [false,true]){const{sim,e}=story();Object.assign(e,{yaw:1.1,mode:'windup',timer:.675,aim:{x:e.x+3,z:e.z-2},hitAt:9.91,hitFrom:{x:e.x-1,z:e.z}});const{out}=render(sim,e,{target:true,reducedMotion});
  for(const[c,center,radius]of [[0xf1d29a,e,.8],[0xd098c8,e.aim,1.2],[0xe0bad4,e.aim,.6]]){const ps=out.box.filter(p=>p.c===c);assert.equal(ps.length,reducedMotion&&c===0xe0bad4?0:36);if(!ps.length)continue;const outer=ps.filter(p=>p.em===.75);assert.equal(outer.length,32);for(const p of outer)near(Math.hypot(p.p[0]-center.x,p.p[2]-center.z),radius);vnear(outer[0].p,[center.x,c===0xe0bad4?1.6:1.58,center.z+radius]);}
 }
});
test('root-only diorama health bar follows actual ground while generic bar retains its original height',()=>{
 const{sim,e}=story();const b=render(sim,e,{perspective:false}).out.box.filter(p=>p.c===0x273743||p.c===0xd1ba8d);assert.equal(b.length,2);near(b[0].p[1],W.height(sim.room,e.x,e.z)+1.18);near(b[1].p[1],b[0].p[1]+.008);
 const ordinary=standard(e,{expeditionQuest:undefined}),g=render(sim,ordinary,{perspective:false}).out.box.filter(p=>p.c===0x273743||p.c===0xd1ba8d);assert.equal(g.length,2);near(g[0].p[1],3.9);near(g[1].p[1],3.908);
 const third=render(sim,e,{perspective:true});assert.equal(third.out.box.filter(p=>p.c===0x273743||p.c===0xd1ba8d).length,0);
});
test('actual paused caller ignores unrelated render time and preserves source state and timer-driven posture',()=>{
 for(const mode of ['idle','pursue','return','windup','recover']){const{sim,e}=story();Object.assign(e,{mode,timer:.4,aim:{x:-130,z:-71},yaw:.7});const a=render(sim,e,{paused:true,t:1}),b=render(sim,e,{paused:true,t:100});assert.deepEqual(brute(a.out),brute(b.out));assert.equal(a.calls[0].paused,true);assert.equal(a.calls[0].mode,mode);assert.equal(a.calls[0].windup,e.windup);assert.equal(a.calls[0].recovery,e.recovery);assert.deepEqual(a.calls[0].aim,e.aim);}
});
