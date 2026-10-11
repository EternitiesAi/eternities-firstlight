'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),E=require('../src/engine.js'),W=require('../src/world-foundations.js'),B=require('../src/bridge-community.js');require('../src/traveler-art.js');const Art=require('../src/bridge-community-art.js');
const empty=()=>({box:[],round:[],octa:[],disc:[]}),all=o=>Object.values(o).flat();
function sim(choice){const s=new C.Simulation();s.room=B.definition.room;s.state.adventure.started=true;s.state.bridgeCommunity={version:1,accepted:true,choice,steps:['fittings','fit'],claimed:false};s.elapsed=5;return s;}
test('fitted fixtures, worker and record are read-only, seated and grounded',()=>{
 for(const choice of['shelter','river-lookout']){const s=sim(choice),before=JSON.stringify(s.state),o=empty();Art.draw(o,s);const ps=all(o),w=B.worker(s),record=ps.find(p=>p.communityPart==='worker-record');assert.equal(JSON.stringify(s.state),before);assert.ok(W.walkable(s.room,w.x,w.z));assert.equal(ps.filter(p=>p.communityPart==='road-worker').length,49);assert.equal(o['traveler-cloth'].filter(p=>p.communityPart==='road-worker').length,3,'all three cloth shapes retain worker ownership');assert.deepEqual(o['traveler-cloth'].map(p=>p.travelerPart),['jacket-waist','jacket-left-hem','jacket-right-hem']);
  const inverseContact=(p)=>{const dx=p[0]-record.p[0],dz=p[2]-record.p[2],c=Math.cos(w.yaw),sn=Math.sin(w.yaw);return[dx*c-dz*sn,p[1]-record.p[1],dx*sn+dz*c];};for(const p of record.handContacts){const q=inverseContact(p);assert.ok(Math.abs(q[0])<.216&&Math.abs(q[0])>.19);assert.ok(q[1]>-.111&&q[1]<.111&&Math.abs(q[2])<.018);}
  if(choice==='shelter'){const roof=ps.find(p=>p.communityPart==='shelter-canopy');assert.ok(roof.cutaway&&!roof.cameraSolid);assert.ok(w.x-.24>roof.p[0]-roof.s[0]/2&&w.x+.24<roof.p[0]+roof.s[0]/2&&w.z-.24>roof.p[2]-roof.s[2]/2&&w.z+.24<roof.p[2]+roof.s[2]/2);for(const post of ps.filter(p=>p.communityPart==='shelter-post'))assert.ok(Math.abs(post.p[1]+post.s[1]/2-(roof.p[1]-roof.s[1]/2))<1e-9);for(const brace of ps.filter(p=>p.communityPart==='matched-canopy-brace')){const m=E.M.compose(...brace.p,...brace.s,...brace.r);for(const[i,end]of brace.fixtureEnds.entries())assert.ok(Math.hypot(...E.M.transform(m,[0,i? .5:-.5,0]).map((n,j)=>n-end[j]))<1e-5);}}
  else {const table=ps.find(p=>p.communityPart==='lookout-board');const top=table.p[1]+table.s[1]/2+Math.sin(.13)*table.s[2]/2;assert.ok(record.p[1]-record.s[1]/2>top+.02,'held record clears the complete tilted tabletop');}if(choice==='river-lookout')for(const p of ps.filter(p=>p.communityPart==='chart-stream')){assert.ok(p.m);const normal=[p.m[4],p.m[5],p.m[6]];assert.ok(Math.abs(normal[2]/normal[1]-Math.tan(-.13))<1e-6);}
 }
});
test('working stop differs from resting stop and the supported actor loop freezes while paused',()=>{
 for(const choice of['shelter','river-lookout']){const s=sim(choice);for(let i=0;i<480;i++){s.elapsed=i/40;const w=B.worker(s);assert.ok(W.walkable(s.room,w.x,w.z));assert.equal(w.working,w.time%12>=3&&w.time%12<7);if(!w.working){const o=empty();Art.draw(o,s);assert.equal(all(o).filter(p=>p.communityPart==='worker-record').length,0);}}s.paused=true;const w=B.worker(s);assert.deepEqual(B.worker(s),w);}
});


test('public primitive output gains all newly created worker cloth parts across both fixtures',()=>{
 for(const choice of ['shelter','river-lookout']){const s=sim(choice),out=empty(),before=JSON.stringify(s.snapshot()),w=B.worker(s);assert.equal(out['traveler-cloth'],undefined);Art.draw(out,s);const body=Object.entries(out).flatMap(([kind,ps])=>ps.map(p=>({kind,...p}))).filter(p=>p.communityPart==='road-worker');
  assert.equal(body.length,49,'all shared body shapes across every primitive array');assert.equal(body.filter(p=>p.kind==='traveler-cloth').length,3);assert.equal(body.filter(p=>p.travelerPart==='ground-marker').length,1,'existing bridge marker behavior retained');assert.deepEqual(out['traveler-cloth'].map(p=>p.travelerPart),['jacket-waist','jacket-left-hem','jacket-right-hem']);
  for(const p of body){assert.equal(p.communityChoice,choice);assert.equal(p.appearanceOnly,true);assert.equal(p.cameraSolid,false);assert.equal(p.cutaway,false);assert.equal(E.solidBounds(p.kind,p),null);assert.ok([...p.m,...p.p,...p.s].every(Number.isFinite));}
  assert.equal(JSON.stringify(s.snapshot()),before);assert.deepEqual(B.worker(s),w);
 }
});

test('public primitive output preserves all preexisting foreign worker arrays and identities',()=>{
 for(const choice of ['shelter','river-lookout']){const s=sim(choice),out=empty(),foreign=Object.freeze({communityPart:'foreign-item',communityChoice:'foreign-choice',owner:'foreign-player'}),cloth=Object.freeze({travelerPart:'foreign-cloth',owner:'foreign-player'}),marker=Object.freeze({travelerPart:'ground-marker',owner:'foreign-player'});out.box.push(foreign);out.disc.push(marker);out['traveler-cloth']=[cloth];const arrays=[out.box,out.disc,out['traveler-cloth']],before=JSON.stringify(s.snapshot()),saved=JSON.stringify([foreign,marker,cloth]);Art.draw(out,s);
  assert.equal(out.box,arrays[0]);assert.equal(out.disc,arrays[1]);assert.equal(out['traveler-cloth'],arrays[2]);assert.equal(out.box[0],foreign);assert.equal(out.disc[0],marker);assert.equal(out['traveler-cloth'][0],cloth);assert.equal(JSON.stringify([foreign,marker,cloth]),saved);assert.equal(all(out).filter(p=>p.communityPart==='road-worker').length,49);assert.equal(out['traveler-cloth'].slice(1).filter(p=>p.communityPart==='road-worker').length,3);assert.equal(JSON.stringify(s.snapshot()),before);
 }
});
