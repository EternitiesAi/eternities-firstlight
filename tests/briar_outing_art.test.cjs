/* Actual CPU production meshes; these do not prove rendered legibility. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/companion-art.js'),E=require('../src/engine.js');
const placement={x:3,z:7,base:1.3,yaw:.7,bonded:true};
test('actual carrying adds a restrained cloth attached to the same articulated mouth frame',()=>{
 const normal=A.parts(placement,A.pose({bonded:true,time:2})),carried=A.parts(placement,A.pose({bonded:true,time:2,carrying:true}));
 assert.equal(normal.length,33);assert.equal(carried.length,35);
 const cloth=carried.find(p=>p.companionPart==='outing-cloth-main'),nose=carried.find(p=>p.companionPart==='nose');assert.ok(cloth);
 for(const i of [0,4,8]){const axis=p=>{const v=p.m.slice(i,i+3),n=Math.hypot(...v);return v.map(x=>x/n);};axis(cloth).forEach((v,j)=>assert.ok(Math.abs(v-axis(nose)[j])<1e-8));}
 assert.ok(carried.every(p=>p.appearanceOnly===true&&p.cameraSolid===false&&p.cutaway===false));
});
test('the settled bonded rig is visibly lower, complete and supported',()=>{
 const normal=A.pose({bonded:true}),rest=A.pose({bonded:true,resting:true,reducedMotion:true});
 assert.ok(rest.bodyY<normal.bodyY-.15);assert.equal(rest.bonded,true);assert.equal(rest.blend,0);
 const parts=A.parts(placement,rest);assert.equal(parts.length,33);assert.ok(parts.some(p=>p.companionPart==='bond-collar-front'));
 for(const part of parts){assert.ok(part.m.every(Number.isFinite));assert.ok(part.s.every(v=>Number.isFinite(v)&&v>0));
  const g=E.geometry(part.kind);for(let i=0;i<g.length;i+=6)assert.ok(E.M.transform(part.m,g.slice(i,i+3))[1]>=placement.base-1e-7,part.companionPart+' below support');
 }
 for(const id of ['leftFront','rightFront','leftHind','rightHind'])assert.ok(parts.some(p=>p.companionPart===id+'-paw'));
});
test('unbonded and default rigs cannot fabricate an outing pose',()=>{
 const p={...placement,bonded:false},posed=A.pose({bonded:false,carrying:true,resting:true});
 assert.equal(A.parts(p,posed).length,30);assert.equal(A.parts(placement,A.pose({bonded:true})).length,33);
});
test('the actual shallow bowl has a supported inset and contained rim above the doorstep ground',()=>{
 const C=require('../src/core.js'),B=require('../src/briar-outing.js'),M=require('../src/briar-moments.js');require('../src/adventure-art.js');
 const sim=new C.Simulation();sim.state.adventure.started=true;sim.state.adventure.companion.bonded=true;sim.state.briarMoments={version:1,revision:1,moments:[M.CLOTH_HOME]};
 // Match the actual WorldArt dynamic output buckets; permissive proxies hide
 // unsupported primitive submissions before they reach the real renderer.
 const out={box:[],octa:[],disc:[],round:[],'timber-panel':[],'traveler-cloth':[]};global.RealmAdventureArt.draw(out,sim,0);
 const parts=Object.entries(out).flatMap(([kind,items])=>items.filter(p=>p.briarOutingPart?.startsWith('bowl')).map(p=>({kind,...p}))),body=parts.find(p=>p.briarOutingPart==='bowl'),inner=parts.find(p=>p.briarOutingPart==='bowl-inner'),rims=parts.filter(p=>p.briarOutingPart.startsWith('bowl-rim'));
 assert.equal(body?.kind,'box','A flat supporting base prevents the inset hovering above an ellipsoid');assert.equal(inner?.kind,'disc');assert.equal(rims.length,4);assert.equal(parts.length,6);
 const vertices=p=>{const g=E.geometry(p.kind),m=E.M.compose(...p.p,...p.s,...(p.r||[0,0,0])),v=[];for(let i=0;i<g.length;i+=6)v.push(E.M.transform(m,g.slice(i,i+3)));return v;};
 const ground=global.RealmAdventureArt.supportHeight(sim,B.definition.rest.x,B.definition.rest.z),b=vertices(body),top=Math.max(...b.map(q=>q[1])),innerPoints=vertices(inner),rimPoints=rims.flatMap(vertices);
 for(const p of parts){assert.ok(p.appearanceOnly&&p.cameraSolid===false&&p.cutaway===false);assert.ok(vertices(p).every(q=>q[1]>=ground-1e-6));}
 for(const q of [...innerPoints,...rimPoints])for(const i of [0,2])assert.ok(Math.abs(q[i]-body.p[i])<=body.s[i]/2+1e-6,'Every submitted inset/rim vertex has base below it');
 assert.ok(innerPoints.every(q=>q[1]>=top&&q[1]<=top+.002));assert.ok(Math.min(...rimPoints.map(q=>q[1]))<top);assert.ok(Math.max(...rimPoints.map(q=>q[1]))>innerPoints[0][1]);
 assert.ok(parts.reduce((n,p)=>n+E.geometry(p.kind).length/18,0)<=400,'The small object keeps a bounded triangle budget');
});
