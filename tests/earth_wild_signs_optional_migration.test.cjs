'use strict';
/* Portable current-module CPU oracles. Historical inputs are read-only;
 * present-owner and receipt cases are labelled synthetic, not earned claims. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const ROOT=path.resolve(process.env.FIRSTLIGHT_ROOT||path.join(__dirname,'..'));
const C=require(path.join(ROOT,'src/core.js')),P=require(path.join(ROOT,'tools/earth-homecoming-journey/earned_common.cjs')),H=require(path.join(ROOT,'src/earth-homecoming.js'));
const FRESH=()=>({version:1,accepted:false,evidence:[],observed:false,resolution:null,cleared:false,claimed:false}),copy=structuredClone,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=name=>path.join(ROOT,'tests/fixtures/earth-homecoming-prerequisites',name),historical=()=>JSON.parse(fs.readFileSync(source('blade/ALL_TWELVE_PREREQUISITES_EARNED.json')));
test('genuine three historical worlds receive only the independently literal missing owner',()=>{
 for(const name of ['blade/ALL_TWELVE_PREREQUISITES_EARNED.json','bow/ALL_TWELVE_PREREQUISITES_EARNED.json','strongest/FINAL_WORLD.json']){
  const file=source(name),bytes=fs.readFileSync(file),raw=JSON.parse(bytes),before=copy(raw),m=C.validate(raw);
  assert.ok(!('earthWildSigns' in raw));assert.deepEqual(m.earthWildSigns,FRESH());
  const result=P.assertMigrationPreserved(m,raw);assert.ok(result===null||result==='exact-old-four-to-fresh-first-load');
  assert.deepEqual(raw,before);assert.ok(fs.readFileSync(file).equals(bytes));
 }
});
test('missing owner cannot be absent, malformed or acquire progress in migrated output',()=>{
 const raw=historical(),m=C.validate(raw);for(const [key,value] of [['version',2],['accepted',true],['evidence',['timber-gouge']],['observed',true],['resolution','signed-loop'],['cleared',true],['claimed',true],['extra',true]]){
  const changed=copy(m);changed.earthWildSigns[key]=value;assert.throws(()=>P.assertMigrationPreserved(changed,raw),/EVERY prior/);
 }
 const absent=copy(m);delete absent.earthWildSigns;assert.throws(()=>P.assertMigrationPreserved(absent,raw),/EVERY prior/);
});
test('present raw owners including invalid specimens are preserved exactly by the independent oracle',()=>{
 // This oracle does not bless invalid records; whole-Core validation is tested separately.
 const raw=historical(),base=C.validate(raw);for(const owner of [FRESH(),null,undefined,{...FRESH(),accepted:true},{...FRESH(),accepted:true,evidence:['timber-gouge','feeding-track'],observed:true},{...FRESH(),claimed:true}]){
  const before=copy(raw);before.earthWildSigns=copy(owner);const m=copy(base),unchanged=copy(before);m.earthWildSigns=copy(owner);
  P.assertMigrationPreserved(m,before);assert.deepEqual(before,unchanged);
  const erased=copy(m);delete erased.earthWildSigns;assert.throws(()=>P.assertMigrationPreserved(erased,before),/EVERY prior/);
  const changed=copy(m);changed.earthWildSigns={...FRESH(),observed:true};assert.throws(()=>P.assertMigrationPreserved(changed,before),/EVERY prior/);
 }
});
test('present paid facts cannot be reset to fresh and inherited or invalid owners never migrate',()=>{
 const raw=historical(),base=C.validate(raw),paid={...FRESH(),accepted:true,evidence:['timber-gouge','feeding-track','pest-scrape'],observed:true,resolution:'signed-loop',claimed:true};
 raw.earthWildSigns=paid;const m=copy(base);m.earthWildSigns=copy(paid);P.assertMigrationPreserved(m,raw);m.earthWildSigns=FRESH();assert.throws(()=>P.assertMigrationPreserved(m,raw));
 for(const owner of [undefined,null,{...FRESH(),version:2},{...FRESH(),extra:true}]){const w=historical();w.earthWildSigns=owner;assert.throws(()=>C.validate(w));}
 const inherited=Object.assign(Object.create({earthWildSigns:FRESH()}),historical());assert.throws(()=>C.validate(inherited),/inherited/);assert.throws(()=>P.assertMigrationPreserved(base,inherited));
});
test('optional allowance cannot hide equipment receipts balances other histories or old catalogue corruption',()=>{
 const raw=historical(),m=C.validate(raw);for(const edit of [w=>w.adventure.coins++,w=>w.adventure.xp++,w=>w.adventure.receipts.push({id:'SYNTHETIC-forged-receipt'}),w=>w.adventure.equipment={},w=>w.notes.push({text:'SYNTHETIC forged note',day:1}),w=>w.earthExpedition.story.claimed=false]){
  const changed=copy(m);edit(changed);assert.throws(()=>P.assertMigrationPreserved(changed,raw),/EVERY prior/);
 }
 const malformed=copy(raw),ids=Object.keys(malformed.localLife.records);malformed.localLife.records={[ids.join('|')]:{accepted:false,choice:null,steps:[],claimed:false},a:{},b:{},c:{}};assert.throws(()=>C.validate(malformed));assert.throws(()=>P.assertMigrationPreserved(m,malformed));
});
test('actual migration emits explicit missing-only receipt while keeping source bytes and existing owner',()=>{
 const base=process.env.FIRSTLIGHT_OPTIONAL_MIGRATION_TEST_OUTPUT||os.tmpdir();fs.mkdirSync(base,{recursive:true});
 for(const present of [false,true]){const folder=fs.mkdtempSync(path.join(base,'optional-wild-owner-')),raw=C.fresh();delete raw.earthHomecoming;if(!present)delete raw.earthWildSigns;
  const file=path.join(folder,'SYNTHETIC_SOURCE.json'),bytes=Buffer.from(JSON.stringify(raw)+'\n');fs.writeFileSync(file,bytes,{flag:'wx'});
  const receipt=P.migration(file,hash(bytes),folder);assert.equal(receipt.earthWildSignsMigration,present?null:'missing-to-fresh-earth-wild-signs-v1');
  assert.deepEqual(JSON.parse(fs.readFileSync(receipt.output.path)).earthWildSigns,FRESH());assert.ok(fs.readFileSync(file).equals(bytes));assert.equal(receipt.source.sha256,hash(bytes));
  assert.equal(JSON.parse(fs.readFileSync(path.join(folder,'MIGRATION_RECEIPT.json'))).earthWildSignsMigration,receipt.earthWildSignsMigration);
 }
});
