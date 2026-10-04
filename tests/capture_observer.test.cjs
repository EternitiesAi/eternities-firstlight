/* Explicit diagnostic fixture for the recorder's read-only RAF observer. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('recorder flight snapshots cannot acquire a later live arrow contact',()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'../tools/capture_earth_expedition.py'),'utf8'),code=source.match(/page\.add_init_script\('''([\s\S]+?)'''\)/)?.[1];assert.ok(code,'actual init observer source');
 const arrow={id:'actual-shape',x:1,z:2,age:.1,hit:[]},callbacks=[],watch={enemy:'accepted',samples:[]},Realm={diagnostics:{adventure:{tactics:{target:'accepted'},arrows:[arrow]}}},ctx={window:{Realm,__earthFlightWatch:watch},Realm,requestAnimationFrame:cb=>callbacks.push(cb)};vm.createContext(ctx);vm.runInContext(code,ctx);callbacks.shift()(16);
 assert.equal(watch.samples.length,1);assert.equal(watch.samples[0].arrows[0].x,1);arrow.x=7;arrow.hit.push('later-contact');assert.equal(watch.samples[0].arrows[0].x,1);assert.equal(watch.samples[0].arrows[0].hit.length,0,'frame snapshot must not retain live hit array');assert.equal(arrow.hit.length,1,'observer did not mutate actual diagnostic arrow');ctx.window.__earthFlightWatch=null;callbacks.shift()(32);assert.equal(watch.samples.length,1,'cleared watch captures nothing');
});
