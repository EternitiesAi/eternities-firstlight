'use strict';
/* Strict byte/chronology readback; it does not independently observe play. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ORDER=['original-I','original-II','original-III','original-IV','local-Earth','hell','heaven','atlantis','cosmos','Earth-homecoming'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function inspect(file,{report=JSON.parse(fs.readFileSync(file)),sourceRoot=report.root}={}){
 const root=fs.realpathSync(sourceRoot),base=fs.realpathSync(path.dirname(file));assert.equal(root,fs.realpathSync(report.root));
 const link=p=>{const resolved=fs.realpathSync(p.path),rel=path.relative(base,resolved);assert.ok(rel&&!path.isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+path.sep),'linked output stays inside this new cohort');assert.equal(sha(resolved),p.sha256,'linked output byte receipt');assert.equal(fs.statSync(resolved).size,p.bytes,'linked output byte count');return JSON.parse(fs.readFileSync(resolved));};
 assert.equal(report.status,'passed');assert.equal(report.sourceFrozen,true);assert.equal(report.historicalFixtureInputs,0);assert.equal(report.browserExecuted,false);assert.equal(report.nativePersistence,false);assert.equal(report.normalRAF,false);assert.equal(report.humanPacing,false);
 assert.deepEqual(report.results.map(r=>r.variant),['blade','blade-to-bow']);
 const source=report.sourceEpoch.actual;assert.ok(Object.keys(source).length>=150);
 for(const [p,h]of Object.entries(source)){const rel=path.normalize(p);assert.ok(!path.isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+path.sep),'only declared repository source');assert.equal(sha(path.join(root,rel)),h,'frozen actual input '+p);}
 const C=require(path.join(root,'src/core.js')),H=require(path.join(root,'src/earth-homecoming.js')),A=require(path.join(root,'src/adventure.js')),AR=require(path.join(root,'src/arsenal.js'));
 const P=require(path.join(root,'tools/earth-homecoming-journey/earned_common.cjs'));
 for(const r of report.results){assert.equal(r.status,'passed');assert.equal(r.historicalFixtureInputs,0);assert.deepEqual(r.chapters.map(e=>e.chapter),ORDER);assert.equal(r.chapters[0].input,null,'the first chapter starts fresh');
  let previous=null;for(const e of r.chapters){if(previous)assert.deepEqual(e.input,previous,'each full-world input is the previous exact output');const out=link(e.output),details=link(e.report);assert.equal(details.status,'passed');assert.deepEqual(C.validate(out),out,'actual Core accepts every saved chapter');previous=e.output;}
  assert.deepEqual(r.final,previous);const final=link(r.final),prior=link(r.chapters.at(-1).input);assert.deepEqual(H.missing(final),[]);assert.equal(final.earthHomecoming.claimed,true);assert.equal(final.earthHomecoming.steps.includes('home-return'),true);assert.equal(prior.earthHomecoming.accepted,false);assert.equal(prior.earthHomecoming.claimed,false);
  assert.equal(final.earthHomecoming.choice,r.variant==='blade'?'public-watch':'reviewed-custody');assert.equal(AR.weapon(final.adventure).style,r.variant==='blade'?'blade':'bow');
  assert.equal(final.adventure.xp-prior.adventure.xp,Math.min(H.definition.reward.xp,9999-prior.adventure.xp));for(const k of ['coins','ore'])assert.equal(final.adventure[k]-prior.adventure[k],H.definition.reward[k]);for(const[k,n]of Object.entries(H.definition.reward.materials))assert.equal(final.sandbox.inventory[k]-prior.sandbox.inventory[k],n);
  P.preserved(final,prior);assert.deepEqual(r.finalStats,A.stats(final.adventure));assert.equal(r.finalWeapon,final.adventure.equipment.weapon);
  for(const[k,v]of Object.entries(P.ZERO)){assert.equal(r[k],v);assert.equal(report[k],v);}
 }
 return {status:'passed',variants:2,chapterEdges:20,historicalFixtureInputs:0,scope:'Byte/source/chronology readback of accelerated CPU journeys; no new native or human claim.'};
}
module.exports={inspect,ORDER};
