'use strict';
/* CPU projection/navigation boundary. Historical quest completion and scene
 * placement are explicitly synthetic; terrain, matrix/mesh, transient witness
 * membership and the path planner are the actual installed owners. This does
 * not qualify native visibility or command-earned play. */
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),N=require('../src/cosmos.js'),R=require('../src/realm-trails.js');
const H=require('../src/cosmos-campaign.js'),D=require('../src/cosmos-campaign-data.js'),E=require('../src/engine.js');
const Art=require('../src/cosmos-campaign-art.js');
function fixture(){
 const raw=C.fresh(),prior=R.definition(H.definition.prerequisite);
 raw.adventure.started=true;
 const p=raw.realmTrails.records[prior.id];p.accepted=true;p.claimed=true;p.steps=R.required(prior);
 if(prior.escort)p.checkpoint=prior.escort.route.length-1;
 for(const s of prior.steps.filter(s=>s.instrument&&p.steps.includes(s.id)))p.settings[s.id]=s.instrument.target;
 const chosen=['material-inspect','material-fit','living-inspect','living-fit','configure-material','configure-living'];
 raw.cosmosCampaign={...H.fresh(),accepted:true,steps:H.definition.steps.filter(s=>!s.optional||chosen.includes(s.id)).map(s=>s.id),choice:'public-record',opened:true,claimed:true};
 const sim=new C.Simulation(C.validate(raw));sim.room=N.ROOM;
 return sim;
}
const vertices=(kind,p)=>{const mesh=E.geometry(kind),out=[];for(let i=0;i<mesh.length;i+=6)out.push(E.M.transform(p.m,Array.from(mesh.slice(i,i+3))));return out;};
test('both actual witness models have wholly supported footprints and grounded feet',()=>{
 const sim=fixture(),before=JSON.stringify(sim.snapshot()),out={box:[],round:[],disc:[],octa:[]};Art.draw(out,sim);
 assert.deepEqual(H.runtime(sim).witnesses.map(w=>w.id),D.definition.witnesses.map(w=>w.id));
 for(const w of D.definition.witnesses){
  assert.ok(N.walkable(w.x,w.z,.31),w.name+' body center is supported');
  const parts=Object.entries(out).flatMap(([kind,ps])=>ps.filter(p=>p.cosmosCampaignWitness===w.id).map(p=>({kind,p})));
  assert.ok(parts.length>10,'actual model is emitted');
  for(const {kind,p}of parts)for(const v of vertices(kind,p))assert.ok(N.walkable(v[0],v[2],0),w.name+' model footprint remains on real support');
  const feet=parts.filter(({p})=>p.cosmosCampaignPart==='witness-grounded-foot');assert.equal(feet.length,2);
  for(const {kind,p}of feet)assert.ok(Math.abs(Math.min(...vertices(kind,p).map(v=>v[1]))-N.height(w.x,w.z))<1e-5,'feet rest on the actual surface');
 }
 assert.equal(JSON.stringify(sim.snapshot()),before,'rendering records no quest progress');
});
test('each witness has a full-body viewing approach reached through the actual planner',()=>{
 const start=D.definition.steps.find(s=>s.id==='disable-central-link'),sim=fixture();
 for(const w of D.definition.witnesses){
  const approaches=[{x:w.x-1.2,z:w.z},{x:w.x+1.2,z:w.z},{x:w.x,z:w.z-1.2},{x:w.x,z:w.z+1.2}];
  const supported=approaches.filter(p=>N.walkable(p.x,p.z,.31));assert.ok(supported.length>0,w.name+' has a supported approach');
  const paths=supported.map(p=>C.pathfind(start,p,sim.navRoom)).filter(Boolean);assert.ok(paths.length>0,w.name+' can actually be reached');
  for(const path of paths){let a=start;for(const b of path){assert.ok(N.segment(a,b,.31),'every full-body path leg is supported');a=b;}}
 }
});
test('Avar left-side gap stays impassable while the right-side approach is supported',()=>{
 const w=D.definition.witnesses.find(w=>w.id==='cosmos-avar-senn-v1');
 assert.equal(N.walkable(w.x-1.2,w.z,.31),false,'native02 approached the actual gap');
 assert.equal(N.walkable(w.x+1.2,w.z,.31),true,'the existing court supports the alternate approach');
});
