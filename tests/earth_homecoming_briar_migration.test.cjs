'use strict';
/* Actual historical input and Core validation; present-memory variants are
 * labelled synthetic migration boundaries, not newly earned gameplay. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const P=require('../tools/earth-homecoming-journey/earned_common.cjs');
const original=path.join(P.ROOT,'tests/fixtures/earth-homecoming-prerequisites/blade/ALL_TWELVE_PREREQUISITES_EARNED.json');
function migrate(t,edit){
 const base=fs.realpathSync(os.tmpdir()),dir=fs.mkdtempSync(path.join(base,'firstlight-homecoming-briar-'));
 assert.equal(path.dirname(dir),base);
 t.after(()=>{assert.equal(path.dirname(dir),base);fs.rmSync(dir,{recursive:true,force:true});});
 const bytes=fs.readFileSync(original),raw=JSON.parse(bytes);assert.equal(Object.hasOwn(raw,'briarMoments'),false);
 if(edit)edit(raw);
 const input=path.join(dir,'INPUT.json');fs.writeFileSync(input,JSON.stringify(raw));const before=fs.readFileSync(input),sha=P.sha(input);
 const receipt=P.migration(input,sha,dir),output=JSON.parse(fs.readFileSync(receipt.output.path));
 assert.deepEqual(fs.readFileSync(input),before,'source bytes unchanged');assert.deepEqual(fs.readFileSync(original),bytes,'repository historical input unchanged');
 return{raw,receipt,output};
}
test('historical missing Briar owner receives only the declared empty owner and an honest migration receipt',t=>{
 const {raw,receipt,output}=migrate(t);
 assert.equal(receipt.briarMomentsMigration,'missing-to-fresh-briar-moments-v1');
 assert.deepEqual(output.briarMoments,{version:1,revision:0,moments:[]});
 assert.match(receipt.method,/missing-only literal fresh Briar moments/);
 assert.equal(Object.hasOwn(raw,'briarMoments'),false);
});
test('synthetic existing empty owner is preserved without a missing-owner migration claim',t=>{
 const {raw,receipt,output}=migrate(t,w=>{w.briarMoments={version:1,revision:0,moments:[]};});
 assert.equal(receipt.briarMomentsMigration,null);assert.deepEqual(output.briarMoments,raw.briarMoments);
});
test('synthetic completed shared memories retain identity and order through the actual historical migration',t=>{
 const {raw,receipt,output}=migrate(t,w=>{
  assert.equal(w.adventure.started,true);assert.equal(w.adventure.companion.bonded,true);
  w.briarMoments={version:1,revision:2,moments:['briar-cloth-home-v1','briar-commons-rest-v1']};
 });
 assert.equal(receipt.briarMomentsMigration,null);assert.deepEqual(output.briarMoments,raw.briarMoments);
 for(const k of ['owned','equipment','arsenal','crossing','companion','xp','defeated','drops'])assert.deepEqual(output.adventure[k],raw.adventure[k]);
});
