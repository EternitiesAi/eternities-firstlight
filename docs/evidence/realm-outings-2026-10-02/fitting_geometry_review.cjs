'use strict';
// Bounded CPU-only review: synthetic ownership/history, actual rig and submitted art.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||'D:/07-GAMES/Firstlight/authoring/bridge-moment');
const hashFile=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const keyFiles=['src/traveler-equipment-art.js','src/traveler-art.js','src/engine.js','tests/traveler_equipment.test.cjs'];
const keysBefore=Object.fromEntries(keyFiles.map(p=>[p,hashFile(path.join(root,p))]));
const C=require(path.join(root,'src/core.js')),A=require(path.join(root,'src/adventure.js')),AR=require(path.join(root,'src/arsenal.js')),H=require(path.join(root,'src/pursuit.js')),Q=require(path.join(root,'src/starter.js')),RC=require(path.join(root,'src/realm-craft.js')),{M}=require(path.join(root,'src/engine.js')),T=require(path.join(root,'src/traveler-art.js')),Art=require(path.join(root,'src/traveler-equipment-art.js'));
const files=[...new Set([...Object.keys(require.cache).filter(p=>p.startsWith(root+path.sep)),...keyFiles.map(p=>path.join(root,p))])].sort();
const epoch=()=>Object.fromEntries(files.map(p=>[path.relative(root,p).replaceAll('\\','/'),hashFile(p)]));
const initial=epoch();for(const [p,h]of Object.entries(keysBefore))assert.equal(initial[p],h,'key source changed while loading');
const add=(a,b)=>a.map((n,i)=>n+b[i]),sub=(a,b)=>a.map((n,i)=>n-b[i]),scale=(a,n)=>a.map(v=>v*n),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>scale(a,1/Math.hypot(...a));
const empty=()=>({box:[],round:[],octa:[],disc:[]});
function shape(center,axis,width,length,depth){const y=unit(axis),reference=Math.abs(y[2])<.85?[0,0,1]:[1,0,0],x=unit(cross(y,reference)),z=cross(x,y);return {center,axes:[x,y,z],half:[width/2,length/2,depth/2]};}
function resized(box,center,width,length,depth){return {center,axes:box.axes,half:[width/2,length/2,depth/2]};}
function obb(p){const cols=[0,4,8].map(i=>[p.m[i],p.m[i+1],p.m[i+2]]),size=cols.map(c=>Math.hypot(...c));return {center:[p.m[12],p.m[13],p.m[14]],axes:cols.map(unit),half:size.map(n=>n/2)};}
// SAT uses the six submitted face axes plus non-degenerate nine cross axes.
// Negative maximum gap means positive-volume OBB intersection; epsilon 1e-6.
function gap(a,b){const axes=[...a.axes,...b.axes,...a.axes.flatMap(x=>b.axes.map(y=>cross(x,y))).filter(x=>Math.hypot(...x)>1e-9).map(unit)],delta=sub(a.center,b.center);return Math.max(...axes.map(axis=>Math.abs(dot(delta,axis))-a.axes.reduce((sum,x,i)=>sum+Math.abs(dot(x,axis))*a.half[i],0)-b.axes.reduce((sum,x,i)=>sum+Math.abs(dot(x,axis))*b.half[i],0)));}
function near(a,b,label){assert.ok(Math.hypot(...sub(a,b))<3e-6,label);}
const bowWidths={trail_bow:.066,copper_bow:.088,oren_reedbow:.072};
const stats={cases:0,bowCases:0,bladeCases:0,oldPartUnchangedCases:0,stateUnchangedCases:0,minProtectedMarkerSATClearance:Infinity,minBowProtectedMarkerSATClearance:Infinity,minBowSegmentLength:Infinity,minBowEndMargin:Infinity,maxBodyAxisError:0,maxTrimJoinError:0,oldNode2Proposal:{cases:0,intersectingPairs:0,worstSATGap:Infinity},intentionalBowTipBounds:{intersectingPairs:0,worstSATGap:Infinity},samples:{}};
for(const [id,gear]of Object.entries(A.GEAR).filter(([,g])=>g.slot==='weapon'))for(const combatScene of [true,false])for(const phase of ['idle','anticipate','recover'])for(const progress of [0,.5,1])for(const guarded of [true,false])for(const reducedMotion of [true,false]){
 const sim=new C.Simulation(),a=sim.state.adventure;a.started=true;if(!a.owned.includes(id))a.owned.push(id);a.equipment.weapon=id;a.pursuit.fittings[id]=2;
 a.starter.accepted=true;a.starter.bundles=Q.BUNDLES.map(b=>b.id);if(!a.defeated.includes('river-old-bristle'))a.defeated.push('river-old-bristle');a.starter.reward={choice:'temper',weapon:id};a.arsenal.sockets[id]='moonstone';
 const d=globalThis.RealmTrails.definition('earthlands-coastward-materials-v1'),record=sim.state.realmTrails.records[d.id];record.accepted=true;record.steps=d.steps.filter(s=>!s.optional).map(s=>s.id);record.claimed=true;
 const f=T.draw(empty(),{x:7,z:-3,base:2.4,yaw:.83},T.pose({style:gear.style||'blade',combatScene,combatPhase:phase,combatProgress:progress,guarded,reducedMotion}));
 const beforeOut=empty();Art.draw(beforeOut,sim,f);const before=Object.values(beforeOut).flat();
 a.realmCraft.weapon=id;const snap=JSON.stringify(sim.snapshot()),fitOut=empty(),summary=Art.draw(fitOut,sim,f),parts=Object.values(fitOut).flat();
 assert.equal(summary.realmFitting,3);assert.equal(JSON.stringify(sim.snapshot()),snap);stats.stateUnchangedCases++;
 assert.deepEqual(parts.filter(p=>!p.weaponPart.startsWith('realm-fitting')),before);stats.oldPartUnchangedCases++;
 const bodies=parts.filter(p=>p.weaponPart==='realm-fitting'),trims=parts.filter(p=>p.weaponPart==='realm-fitting-trim');assert.equal(bodies.length,1);assert.equal(trims.length,2);assert.equal(bodies[0].c,0xa997cc);assert.ok(trims.every(p=>p.c===0xd1b06b));
 const body=obb(bodies[0]),collars=[body,...trims.map(obb)],old=parts.filter(p=>['fitting','temper','socket','socket-mount'].includes(p.weaponPart));assert.equal(old.length,5);
 for(const band of collars)for(const p of old){const separation=gap(band,obb(p));assert.ok(separation>1e-6,id+' protected marker overlap');stats.minProtectedMarkerSATClearance=Math.min(stats.minProtectedMarkerSATClearance,separation);if(gear.style==='bow')stats.minBowProtectedMarkerSATClearance=Math.min(stats.minBowProtectedMarkerSATClearance,separation);}
 const bow=gear.style==='bow',expectedOffset=bow?.0325:.0575,expectedBodyLength=bow?.05:.09,expectedTrimLength=bow?.015:.025;
 assert.ok(Math.abs(body.half[1]*2-expectedBodyLength)<3e-6);const ends=trims.map(obb).map(p=>dot(sub(p.center,body.center),body.axes[1])).sort((a,b)=>a-b);assert.ok(Math.abs(ends[0]+expectedOffset)<3e-6&&Math.abs(ends[1]-expectedOffset)<3e-6);
 for(const trim of trims.map(obb)){near(trim.axes[1],body.axes[1],'trim axis');const join=Math.abs(Math.abs(dot(sub(trim.center,body.center),body.axes[1]))-body.half[1]-trim.half[1]);stats.maxTrimJoinError=Math.max(stats.maxTrimJoinError,join);assert.ok(join<3e-6);assert.ok(Math.abs(trim.half[1]*2-expectedTrimLength)<3e-6);}
 if(bow){
  const limb=parts.find(p=>p.weaponPart==='bow-limb'&&p.limbSide===1&&p.limbSegment===3),arm=obb(limb);near(body.center,arm.center,'upper limb midpoint');near(body.axes[1],arm.axes[1],'upper limb axis');stats.maxBodyAxisError=Math.max(stats.maxBodyAxisError,Math.hypot(...sub(body.axes[1],arm.axes[1])));const length=arm.half[1]*2;stats.minBowSegmentLength=Math.min(stats.minBowSegmentLength,length);stats.minBowEndMargin=Math.min(stats.minBowEndMargin,(length-.08)/2);assert.ok(length>.08+1e-6);
  const priorArm=obb(parts.find(p=>p.weaponPart==='bow-limb'&&p.limbSide===1&&p.limbSegment===2)),width=bowWidths[id],proposal=[resized(priorArm,priorArm.center,width+.04,.09,.095),...[-1,1].map(sign=>resized(priorArm,add(priorArm.center,scale(priorArm.axes[1],sign*.0575)),width+.06,.025,.11))];
  for(const band of proposal)for(const p of old){const separation=gap(band,obb(p));stats.oldNode2Proposal.worstSATGap=Math.min(stats.oldNode2Proposal.worstSATGap,separation);if(separation< -1e-6)stats.oldNode2Proposal.intersectingPairs++;}
  stats.oldNode2Proposal.cases++;
  for(const band of collars)for(const tip of parts.filter(p=>p.weaponPart==='bow-tip')){const separation=gap(band,obb(tip));stats.intentionalBowTipBounds.worstSATGap=Math.min(stats.intentionalBowTipBounds.worstSATGap,separation);if(separation< -1e-6)stats.intentionalBowTipBounds.intersectingPairs++;}
  stats.bowCases++;
 }else{
  const shaft=obb(parts.find(p=>p.weaponPart===(combatScene?'blade':'scabbard')));near(body.axes[1],shaft.axes[1],'blade shaft axis');const grip=summary.gripWorld;near(body.center,add(grip,scale(body.axes[1],.54)),'blade axis .54');stats.bladeCases++;
 }
 stats.cases++;
 if(!stats.samples[id])stats.samples[id]={combatScene,phase,progress,guarded,reducedMotion,body:{p:bodies[0].p,s:bodies[0].s,c:bodies[0].c,m:Array.from(bodies[0].m)},trims:trims.map(p=>({p:p.p,s:p.s,c:p.c,m:Array.from(p.m)}))};
}
const final=epoch();assert.deepEqual(final,initial,'reviewed sources changed during bounded run');assert.ok(stats.oldNode2Proposal.intersectingPairs>0,'regression specimen must detect earlier proposal');
const output={status:'passed',generatedAtUTC:new Date().toISOString(),sourceRoot:root,sourceFilesUnchangedDuringProbe:true,reviewedSourceFiles:initial,observedHTML:{path:'index.html',sha256:hashFile(path.join(root,'index.html')),bytes:fs.statSync(path.join(root,'index.html')).size,scope:'Observed existing build, not proof that reviewed pending art edits were rebuilt into this HTML.'},stats,bladeMath:{riverStage2:[.3095,.3705],body:[.495,.585],brass:[ [.47,.495],[.585,.61] ],clearance:.0995},scope:['Synthetic started/owned weapons, prior rewards, claimed South trail and realm fitting; not command-earned progression evidence.','Production Traveler.pose/draw and TravelerEquipmentArt.draw, all seven canonical weapons, held/stowed, three phases, three progress values, guard on/off, reduced motion on/off; actual submitted matrices at yaw .83, base 2.4.','SAT of three new collar boxes against two River bands, temper, socket and mount. Socket octa OBB is a conservative enclosure.','No browser/GPU, visual acceptance, suite, animation video, reload or native-storage checks.','Bow tip is a round cap; its OBB intersections are bounds evidence, not a blanket claim of exact solid-volume intersection. Original tip geometry/colors are proven unchanged in this run. Intentional ornamental joining accepted by Root.','On-disk source hashes equal before/after this short probe. No inference that later builds or captures use these bytes.']};
console.log(JSON.stringify(output,null,2));
