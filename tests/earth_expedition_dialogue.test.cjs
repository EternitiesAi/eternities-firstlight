/* Pure presentation checks. Valid planted ledgers exercise wording boundaries;
 * they are not claims of earned work, live combat or native conversation. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../src/core.js'),E=require('../src/earth-expedition.js'),A=require('../src/adventure.js'),W=require('../src/world-foundations.js'),D=require('../src/earth-expedition-dialogue.js');
const copy=o=>JSON.parse(JSON.stringify(o)),people=Object.keys(D.people);let cases=0,readings=0;
function test(name,body){body();cases++;console.log('PASS '+name);}
function freeze(o){if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
function check(r,b=E.freshBinding()){
 const before=JSON.stringify({r,b});freeze(r);freeze(b);
 for(const id of people){const a=D.reading(id,r,b),again=D.reading(id,r,b);assert.ok(a);assert.notStrictEqual(a,again);assert.deepEqual(a,again);assert.deepEqual(Object.keys(a).sort(),['hint','lines','speaker','title']);assert.equal(a.speaker,D.people[id].name);assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.lines));assert.ok(a.lines.length>=2&&a.lines.length<=4);for(const line of a.lines){assert.equal(typeof line,'string');assert.ok(line.length>0&&line.length<=180,line);assert.equal(line.trim(),line);}assert.ok(a.title.length>0&&a.title.length<=80);assert.ok(a.hint.length>0&&a.hint.length<=240);assert.throws(()=>a.lines.push('A false completion.'));assert.throws(()=>{a.hint='A false grant.';});assert.doesNotMatch(JSON.stringify(a),/\b(?:XP|9999|save|ledger|schema|version|backfill|premium|Romance|classPath|allegiance)\b/);readings++;}
 assert.equal(JSON.stringify({r,b}),before,'inputs remain byte-identical');
}
function state(n,{branch='stormfall-recovery',claimed=false,lastClaim=0,patrolSteps=null}={}){const r=E.fresh();r.story={accepted:true,steps:E.definition.steps.slice(0,n).map(s=>s.id),branch:n>=2?branch:null,claimed};r.patrol={lastClaim,active:patrolSteps===null?null:{run:lastClaim+1,steps:E.patrol.steps.slice(0,patrolSteps).map(s=>s.id)}};E.validate(r);return r;}
const speech=(id,r,b)=>{const s=D.reading(id,r,b);assert.ok(s);return[s.title,...s.lines,s.hint].join('\n');};

test('only existing exact person identities and frozen API are exported',()=>{
 assert.ok(Object.isFrozen(D)&&Object.isFrozen(D.people));assert.deepEqual(people,['elderweald-rill','elderweald-sela']);assert.equal(globalThis.RealmEarthExpeditionDialogue,D);const world=W.definition('world-earthlands');
 for(const id of people){assert.ok(Object.isFrozen(D.people[id]));const p=world.points.find(p=>p.id===id);assert.ok(p&&p.kind==='person');assert.equal(D.people[id].name,p.name);assert.equal(D.people[id].id,p.id);assert.ok(W.walkable(world.room,p.x,p.z));}
 assert.equal(D.people[E.definition.giver.id].name,E.definition.giver.name);
});

test('unknown people refuse without aliasing protected/old residents or deriving a speaker from input',()=>{
 for(const id of['rill','sela','oren','mara','neris','elderweald-rill-extra','__proto__','constructor','',null,undefined,1,{},Symbol('Rill')])assert.equal(D.reading(id,E.fresh()),null);
 const source=fs.readFileSync(path.join(__dirname,'../src/earth-expedition-dialogue.js'),'utf8');assert.doesNotMatch(source,/RealmCore|Simulation|\.command\(|\.commit\(|\.event\(|localStorage|Date\.|Math\.random|fetch\(|setTimeout|document\.|\bXP\b/);
});

test('fresh optional presentation neither accepts work nor assumes a prior visit or repair',()=>{
 const r=E.fresh();check(r);assert.deepEqual(D.reading(people[0],undefined),D.reading(people[0],r));const a=speech(people[0],r),b=speech(people[1],r);assert.match(a,/Read the expedition terms.*accept here/);assert.match(b,/without taking on an errand for me/);for(const text of[a,b])assert.doesNotMatch(text,/was paid|have delivered|brace is fitted|have cleared|is already on/);assert.deepEqual(r,E.fresh());
});

test('every accepted story stage and both retained choices have short deterministic quiet readings',()=>{
 for(const branch of['stormfall-recovery','managed-coppice'])for(let n=0;n<=E.definition.steps.length;n++){
  const r=state(n,{branch});check(r);for(const id of people){const text=speech(id,r);assert.doesNotMatch(text,/was paid|binding is already on|Patrol \d+ was paid/);if(n>=2)assert.match(text,branch==='stormfall-recovery'?/You chose recovered stormfall/:/You chose the limited managed coppice/);else assert.doesNotMatch(text,/You chose/);if(n>=7)assert.match(text,/brace is fitted|brace stays|brace is fitted|separate brace is fitted/);else assert.doesNotMatch(text,/brace is fitted|brace stays/);if(n===8)assert.match(text,/still unpaid/);}
 }
});

test('all story subsets reject false prerequisite, allocation and claim histories before composing speech',()=>{
 for(let mask=0;mask<1<<E.definition.steps.length;mask++)for(const claimed of[false,true]){
  const r=E.fresh();r.story={accepted:true,steps:E.definition.steps.filter((s,i)=>mask&(1<<i)).map(s=>s.id),branch:mask&2?'managed-coppice':null,claimed};let valid=true;try{E.validate(r);}catch{valid=false;}
  for(const id of people){const got=D.reading(id,r);if(valid){assert.ok(got);if(!claimed)assert.doesNotMatch(got.lines.join(' '),/was paid/);}else assert.equal(got,null);}
 }
 for(const raw of[null,{},[],0,{...E.fresh(),version:2},{...E.fresh(),unknown:true}])for(const id of people)assert.equal(D.reading(id,raw),null);
});

test('unpaid deliveries recognize the actual allocation and require a separate explicit camp claim',()=>{
 for(const branch of['stormfall-recovery','managed-coppice']){const r=state(8,{branch});check(r);const a=speech(people[0],r),b=speech(people[1],r);assert.match(a,/payment is ready and still unpaid/);assert.match(a,/Choose Claim here/);assert.match(b,/delivery is still unpaid/);assert.match(b,/Rill.*explicitly claim/);for(const t of[a,b])assert.doesNotMatch(t,/18 sunmarks|3 ore|8 timber|4 timber|was paid/);}
});

test('only claimed stories recognize exact paid currency/materials and existing support, without guessing XP or current balance',()=>{
 for(const branch of['stormfall-recovery','managed-coppice']){const r=state(8,{branch,claimed:true});check(r);for(const id of people){const t=speech(id,r);assert.match(t,/The delivery was paid: 18 sunmarks, 3 ore/);assert.match(t,branch==='stormfall-recovery'?/8 timber and 4 fibre/:/4 timber and 8 fibre/);assert.match(t,/old organism remains alive/);assert.match(t,/Using your supplies does not undo/);assert.doesNotMatch(t,/You have \d|you can afford|\bXP\b|claimed.*again/);assert.match(t,/outdoor home bench/);if(branch==='stormfall-recovery')assert.match(t,/If you need two more fibre/);}}
});

test('active and ready patrol readings preserve first repair, allocation and exact run without claiming new payment',()=>{
 for(const branch of['stormfall-recovery','managed-coppice'])for(const lastClaim of[0,1,17,E.MAX_RUN-1])for(let n=0;n<=E.patrol.steps.length;n++){
  const r=state(8,{branch,claimed:true,lastClaim,patrolSteps:n});check(r);for(const id of people){const t=speech(id,r);assert.match(t,new RegExp('Inspection circuit '+(lastClaim+1)));assert.match(t,/first brace stays.*old organism remains alive/);assert.match(t,/does not repeat the repair/);assert.doesNotMatch(t,/was paid|Fit the alternate|fit the brace|cut.*organism|reset/);if(n===5){assert.match(t,/payment is ready and still unpaid/);assert.match(t,id===people[0]?/Choose Claim for this circuit here/:/Return to Rill.*explicitly claim/);}else assert.doesNotMatch(t,/payment is ready/);}
 }
});

test('paid patrol and finite record boundary do not promise another repair or an unavailable next circuit',()=>{
 for(const lastClaim of[1,17,E.MAX_RUN]){const r=state(8,{claimed:true,lastClaim});check(r);for(const id of people){const t=speech(id,r);assert.match(t,new RegExp('Patrol '+lastClaim+' was paid: 4 sunmarks, 3 ore, 2 timber and 2 fibre'));assert.match(t,/separate brace remains fitted/);assert.doesNotMatch(t,/payment is ready|rebuild|reset|repair.*again/);if(lastClaim===E.MAX_RUN)assert.match(t,/recorded inspection circuits are complete/);}}
 const stale=state(8,{claimed:true,lastClaim:1,patrolSteps:0});stale.patrol.active.run=1;for(const id of people)assert.equal(D.reading(id,stale),null);
});

test('binding recognition follows canonical committed record, never equipment, inventory or a granted new option',()=>{
 for(const branch of['stormfall-recovery','managed-coppice'])for(const weapon of Object.keys(A.GEAR).filter(id=>A.GEAR[id].slot==='weapon'))for(const kind of['edge','shelter']){
  const b={version:1,weapon,kind};for(const r of[state(8,{branch,claimed:true}),state(8,{branch,claimed:true,lastClaim:1}),state(8,{branch,claimed:true,patrolSteps:3})]){check(r,b);for(const id of people){const t=speech(id,r,b);assert.ok(t.includes('Your Trailward '+kind+' binding is already on '+A.GEAR[weapon].name));assert.match(t,/stays with that weapon/);assert.doesNotMatch(t,/currently equipped|you are wielding|health restored|you received|spend.*again/);}}
 }
 for(const b of[null,{},[],{version:2,weapon:null,kind:null},{version:1,weapon:null,kind:'edge'},{version:1,weapon:'trail_blade',kind:null},{version:1,weapon:'trail_blade',kind:'flight'},{version:1,weapon:'travel_coat',kind:'edge'},{version:1,weapon:'unowned_invented_weapon',kind:'edge'},{version:1,weapon:'__proto__',kind:'edge'},{...E.freshBinding(),extra:true}])for(const id of people)assert.equal(D.reading(id,state(8,{claimed:true}),b),null);
 for(const id of people)assert.equal(D.reading(id,state(8),{version:1,weapon:'trail_blade',kind:'edge'}),null,'unclaimed story cannot imply binding completion');
});

test('specific route and encounter advice matches current anchors and distinct real weapon constraints',()=>{
 const rillText=n=>speech(people[0],state(n)),selaText=n=>speech(people[1],state(n));
 assert.match(rillText(1),/southwest of the board.*managed plot is north/);assert.ok(E.definition.steps[1].choices[0].x<E.definition.steps[0].x&&E.definition.steps[1].choices[0].z<E.definition.steps[0].z);assert.ok(E.definition.steps[1].choices[1].z>E.definition.steps[0].z);
 assert.match(selaText(3),/blade needs close reach.*bow reaches farther/);assert.match(selaText(3),/miss a moving target/);assert.match(selaText(3),/Walking does not keep autoattack firing/);assert.match(selaText(5),/bow needs a clear lane.*blade needs close reach/);assert.match(selaText(5),/Brace or move/);assert.match(selaText(4),/middle of the footbridge.*rails are real boundaries/);assert.match(rillText(6),/Past the wall ends.*east side/);assert.match(rillText(7),/return glade southeast/);
 const a=A.fresh();a.equipment.weapon='trail_blade';const blade=globalThis.RealmArsenal.weapon(a);a.equipment.weapon='trail_bow';const bow=globalThis.RealmArsenal.weapon(a);assert.equal(blade.reach,2.65);assert.equal(bow.reach,11);assert.ok(bow.reach>blade.reach);
 const steps=E.definition.steps,root=steps.find(s=>s.id==='read-root-load'),brace=steps.find(s=>s.id==='brace-root-channel'),glade=steps.find(s=>s.id==='deliver-allocation');assert.ok(brace.x>root.x&&brace.z<root.z);assert.ok(glade.x>brace.x&&glade.z<brace.z);
});

test('presentation leaves an entire production world and its accepted/paid/bound records byte-identical',()=>{
 const world=C.fresh();world.adventure.started=true;world.adventure.owned=['trail_blade','travel_coat'];world.adventure.equipment={weapon:'trail_blade',armor:'travel_coat',charm:null};world.earthExpedition=state(8,{claimed:true,lastClaim:3,patrolSteps:2});world.adventure.earthBinding={version:1,weapon:'trail_blade',kind:'shelter'};const checked=C.validate(world),sim=new C.Simulation(checked),before=JSON.stringify(sim.snapshot());freeze(sim.state.earthExpedition);freeze(sim.state.adventure.earthBinding);
 for(let n=0;n<50;n++)for(const id of people)assert.ok(D.reading(id,sim.state.earthExpedition,sim.state.adventure.earthBinding));assert.equal(JSON.stringify(sim.snapshot()),before);assert.equal(sim.state.earthExpedition.patrol.active.run,4);assert.equal(sim.state.adventure.hp,100);
});

test('browser IIFE and CommonJS return identical pure readings with no DOM or runtime globals',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/earth-expedition-dialogue.js'),'utf8'),ctx={RealmEarthExpedition:E,RealmAdventure:A};vm.createContext(ctx);vm.runInContext(source,ctx);assert.ok(ctx.RealmEarthExpeditionDialogue);assert.equal(ctx.module,undefined);for(const r of[E.fresh(),state(3),state(8,{claimed:true,lastClaim:2,patrolSteps:1})])for(const id of people){assert.equal(JSON.stringify(ctx.RealmEarthExpeditionDialogue.reading(id,r)),JSON.stringify(D.reading(id,r)));if(r.story.claimed){const b={version:1,weapon:'trail_blade',kind:'edge'};assert.equal(JSON.stringify(ctx.RealmEarthExpeditionDialogue.reading(id,r,b)),JSON.stringify(D.reading(id,r,b)));}}assert.equal(ctx.RealmEarthExpeditionDialogue.reading('old-resident',E.fresh()),null);const early={RealmEarthExpedition:E};vm.createContext(early);vm.runInContext(source,early);assert.equal(early.RealmEarthExpeditionDialogue.reading(people[0],state(8,{claimed:true}),{version:1,weapon:'trail_blade',kind:'edge'}),null,'browser without canonical registry fails closed');
});
test('CommonJS canonical lookup remains pure when the already-loaded Adventure global is absent',()=>{
 const original=globalThis.RealmAdventure;try{delete globalThis.RealmAdventure;check(state(8,{claimed:true}),{version:1,weapon:'trail_blade',kind:'shelter'});assert.equal(globalThis.RealmAdventure,undefined,'cached module lookup does not rewrite the caller global');}finally{globalThis.RealmAdventure=original;}
});
console.log('Earth expedition dialogue: '+cases+' focused cases passed; '+readings+' frozen output checks. Synthetic presentation fixtures, not native dialogue or earned progression.');
