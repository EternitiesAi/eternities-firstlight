'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../tools/whole_draft_readback.cjs'),file=process.env.WHOLE_DRAFT_REPORT;
if(!file){test('explicit fresh whole-draft cohort is required',{skip:'Run tools/whole_draft_journey.cjs; no whole-draft cohort was supplied to this generic rules invocation.'},()=>{});}else{
 const original=JSON.parse(fs.readFileSync(file)),changed=edit=>{const r=structuredClone(original);edit(r);return r;};
 test('two fresh characters bind all twenty exact chapter edges and the complete fixed home payment',()=>{const r=R.inspect(file);assert.equal(r.chapterEdges,20);assert.equal(r.historicalFixtureInputs,0);});
 test('a missing or reordered campaign cannot claim draft completion',()=>{assert.throws(()=>R.inspect(file,{report:changed(r=>r.results[0].chapters.splice(5,1))}));assert.throws(()=>R.inspect(file,{report:changed(r=>r.results[1].chapters.reverse())}));});
 test('a transplanted or changed input cannot enter the next chapter',()=>{assert.throws(()=>R.inspect(file,{report:changed(r=>r.results[0].chapters[2].input.sha256='0'.repeat(64))}),/previous exact output/);});
 test('changed saved output bytes refuse a successful readback',()=>{assert.throws(()=>R.inspect(file,{report:changed(r=>r.results[0].chapters[0].output.sha256='0'.repeat(64))}),/byte receipt/);});
 test('an external save path cannot substitute for a cohort output',()=>{assert.throws(()=>R.inspect(file,{report:changed(r=>r.results[0].chapters[0].output.path=path.join(r.root,'src/core.js'))}),/stays inside this new cohort/);});
 test('old fixture and native-play claims cannot be relabelled as this fresh CPU journey',()=>{assert.throws(()=>R.inspect(file,{report:changed(r=>r.historicalFixtureInputs=1)}));assert.throws(()=>R.inspect(file,{report:changed(r=>r.nativePersistence=true)}));});
 test('a changed source byte receipt is refused before replay qualification',()=>{assert.throws(()=>R.inspect(file,{report:changed(r=>r.sourceEpoch.actual['src/core.js']='0'.repeat(64))}),/frozen actual input/);});
}
