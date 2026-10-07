'use strict';
/* Actual procedural vertices and canonical source validators. New commission
 * prefixes/runtime here are labelled synthetic visual specimens, not journeys. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const ROOT=path.resolve(__dirname,'..');
const C=require(path.join(ROOT,'src/core.js')),W=require(path.join(ROOT,'src/world-foundations.js')),EE=require(path.join(ROOT,'src/earth-expedition.js'));
const E=require(path.join(ROOT,'src/engine.js'));require(path.join(ROOT,'src/creative.js'));require(path.join(ROOT,'src/traveler-art.js'));
const D=require('../src/earth-consignment-data.js'),M=require('../src/earth-consignment-motion.js'),Art=require('../src/earth-consignment-art.js');
const empty=()=>({box:[],round:[],octa:[],disc:[],'timber-panel':[]}),all=o=>Object.entries(o).flatMap(([kind,ps])=>ps.map(p=>({kind,...p})));
const close=(a,b,why='')=>assert.ok(Math.abs(a-b)<2e-5,why+': '+a+' != '+b),copy=o=>JSON.parse(JSON.stringify(o));
function specimen(choice='south-stormfall',phase='origin'){
 const variant=choice.endsWith('coppice')?'fresh-bow':'fresh-blade';
 const source=require('./helpers/consignment-fixtures.cjs').load(variant);
 const sim=new C.Simulation(source),ctx0={sim,active:'synthetic-art-owner',revision:0},preview=W.preview(ctx0,'earthlands');assert.ok(preview.ok,preview.error);
 assert.ok(W.enter(preview.ticket,ctx0,{save:()=>({ok:true}),build:()=>{}}).ok);
 sim.state.player.x=-106;sim.state.player.z=-105;sim.state.localLife.records[D.ID]=phase==='unaccepted'?D.freshRecord():{accepted:true,choice,steps:phase==='complete'||phase==='claimed'?D.required(choice).slice():[],claimed:phase==='claimed'};
 sim.consignmentOwnerLease=Object.freeze({});const ctx=()=>({sim,active:ctx0.active,revision:0,ownerLease:sim.consignmentOwnerLease,definition:D.definition,threat:()=>({clear:true})});
 return{sim,ctx};
}
function render(h,live=true){const out=empty();h.sim.consignmentPresentationContext=h.ctx();h.sim.consignmentPresentation=live?M.current(h.ctx()):null;const before=JSON.stringify(h.sim.state);Art.draw(out,h.sim);assert.equal(JSON.stringify(h.sim.state),before,'presentation changes no saved state');return all(out);}
function vertices(p){const raw=E.geometry(p.kind),stride=p.kind==='timber-panel'?8:6,out=[];for(let i=0;i<raw.length;i+=stride)out.push(E.M.transform(p.m,raw.slice(i,i+3)));return out;}
function dimensions(p){const vs=vertices(p);return[0,4,8].map(i=>{const axis=Array.from(p.m.slice(i,i+3)),len=Math.hypot(...axis),v=vs.map(q=>q.reduce((n,x,j)=>n+x*axis[j]/len,0));return Math.max(...v)-Math.min(...v);});}
function bounds(p){const vs=vertices(p);return{min:[0,1,2].map(i=>Math.min(...vs.map(v=>v[i]))),max:[0,1,2].map(i=>Math.max(...vs.map(v=>v[i])))};}
const pieces=ps=>ps.filter(p=>p.consignmentPiece),worker=ps=>ps.filter(p=>p.consignmentActor),named=(ps,id)=>ps.filter(p=>p.consignmentPart===id);

test('locked, invalid allocation and other scenes show no new carrier or load',()=>{
 const h=specimen();h.sim.state.earthExpedition=EE.fresh();assert.deepEqual(render(h),[]);
 const q=specimen();q.sim.room='hearthwater';assert.deepEqual(render(q),[]);
 const r=specimen();r.sim.state.localLife.records[D.ID].choice='south-coppice';assert.deepEqual(render(r),[]);
});
test('unaccepted presentation refuses malformed original source even when raw flags look paid',()=>{
 const h=specimen('south-stormfall','unaccepted');h.sim.state.earthExpedition={version:1,story:{claimed:true,branch:'stormfall-recovery'}};assert.throws(()=>EE.validate(h.sim.state.earthExpedition));assert.deepEqual(render(h,false),[]);assert.equal(Art.snapshot(h.sim),null);
});
test('visible unaccepted supply is the new fixed four timber pieces and one worker, with no saved writes',()=>{
 const h=specimen('south-stormfall','unaccepted'),ps=render(h,false);assert.equal(pieces(ps).length,4);assert.equal(new Set(worker(ps).map(p=>p.consignmentActor)).size,1);
 assert.ok(pieces(ps).every(p=>p.consignmentSource==='new-supplier'));assert.equal(Art.snapshot(h.sim).cargoPieces.length,4);assert.equal(Art.snapshot(h.sim).arrived,false);
});
test('an intermediate accepted actor requires an exact live projection, not a cloned view',()=>{
 const h=specimen();assert.equal(pieces(render(h,false)).length,0);assert.equal(Art.snapshot(h.sim),null);
 const v=M.current(h.ctx());h.sim.consignmentPresentationContext=h.ctx();h.sim.consignmentPresentation=copy(v);const out=empty();Art.draw(out,h.sim);assert.equal(pieces(all(out)).length,0);
 assert.equal(pieces(render(h)).length,4);assert.equal(Art.snapshot(h.sim).x,-106);
});
test('different owner context and reset remove old branded intermediate presentation',()=>{
 const h=specimen(),q=specimen(),v=M.current(h.ctx());h.sim.consignmentPresentation=v;h.sim.consignmentPresentationContext=q.ctx();const out=empty();Art.draw(out,h.sim);assert.equal(pieces(all(out)).length,0);
 render(h);assert.ok(Art.snapshot(h.sim));M.reset(h.sim,'owner');Art.reset(h.sim);assert.equal(Art.snapshot(h.sim),null);assert.equal(M.isProjection(v),false);
});
for(const choice of['south-stormfall','north-coppice'])test(choice+' retains exact supplied dimensions/material and one final stock after payment',()=>{
 const supplied=pieces(render(specimen(choice))),done=specimen(choice,'complete'),paid=specimen(choice,'claimed'),received=pieces(render(done,false)),retained=pieces(render(paid,false));
 assert.equal(supplied.length,choice.endsWith('coppice')?3:4);assert.equal(received.length,supplied.length);assert.equal(retained.length,supplied.length);
 for(const p of supplied){const q=received.find(v=>v.consignmentPiece===p.consignmentPiece),r=retained.find(v=>v.consignmentPiece===p.consignmentPiece);assert.ok(q&&r);assert.equal(q.kind,p.kind);assert.deepEqual(q.c,p.c);assert.deepEqual(r.c,p.c);dimensions(p).forEach((v,i)=>close(v,dimensions(q)[i],'same physical supplier piece'));assert.deepEqual(Array.from(q.m),Array.from(r.m));}
 const snap=Art.snapshot(paid.sim);assert.equal(snap.x,5.8);assert.equal(snap.z,-69);assert.equal(snap.carrying,false);assert.deepEqual(snap.cargoPieces,[]);assert.equal(snap.stockPieces.length,supplied.length);
});
test('carried cargo stays inside the actual loaded support radius at the grounded worker',()=>{
 for(const choice of['south-stormfall','north-coppice']){const h=specimen(choice),ps=render(h),snap=Art.snapshot(h.sim);for(const p of pieces(ps))for(const v of vertices(p)){assert.ok(Math.hypot(v[0]-snap.x,v[2]-snap.z)<=.65+2e-5);assert.ok(v[1]>snap.base);}}
});
test('actual receiving vertices rest on the tray or the lower timber and remain on supported ground',()=>{
 for(const choice of['south-stormfall','south-coppice']){const ps=render(specimen(choice,'claimed'),false),tray=named(ps,'receiving-stock-tray')[0],tb=bounds(tray),stock=pieces(ps);for(const p of stock){const b=bounds(p);for(const v of vertices(p))assert.ok(W.walkable(D.ROOM,v[0],v[2],0));if(choice.endsWith('coppice'))close(b.min[1],tb.max[1],'fibre bottom on tray');else if(p.consignmentPiece==='short-timber-1'||p.consignmentPiece==='short-timber-2')close(b.min[1],tb.max[1],'lower timber on tray');else{const lower=stock.find(q=>q.consignmentPiece==='short-timber-'+(Number(p.consignmentPiece.slice(-1))-2));close(b.min[1],bounds(lower).max[1],'upper timber rests on lower timber');}assert.ok(b.min[0]>=tb.min[0]&&b.max[0]<=tb.max[0]&&b.min[2]>=tb.min[2]&&b.max[2]<=tb.max[2]);}}
});
test('one worker rig has finite matrices, no player tags/ground marker or collision authority',()=>{
 const h=specimen(),ps=render(h);assert.ok(worker(ps).length>10);for(const p of ps){assert.ok([...p.m,...p.p,...p.s].every(Number.isFinite));assert.ok(p.s.every(n=>n>0));assert.equal(p.travelerPart,undefined);assert.equal(p.travelerJoints,undefined);assert.equal(p.worldSolid,undefined);assert.equal(p.worldGround,undefined);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(p.appearanceOnly,true);assert.equal(E.solidBounds(p.kind,p),null);}assert.equal(named(ps,'carrier-ground-marker').length,0);
});
test('paused and reduced-motion presentation does not advance motion or checkpoint history',()=>{
 const h=specimen();render(h);const before=JSON.stringify(h.sim.state),v=M.current(h.ctx());h.sim.paused=true;h.sim.elapsed+=100;render(h);assert.equal(Art.snapshot(h.sim).walking,false);assert.equal(M.current(h.ctx()).x,v.x);assert.equal(JSON.stringify(h.sim.state),before);
 h.sim.state.settings.reducedMotion=true;render(h);assert.equal(Art.snapshot(h.sim).reducedMotion,true);assert.deepEqual(h.sim.state.localLife.records[D.ID].steps,[]);
});
