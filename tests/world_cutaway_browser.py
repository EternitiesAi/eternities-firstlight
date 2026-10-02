"""Synthetic framebuffer proof of gallery/shelter visibility, not game progress.

Known blue subjects lie behind a flagged civic deck plus surface water, and
under a tagged shelter roof. Main-view changes must preserve reflection bytes
and respect the existing cutaway preference. Actual traveler captures are separate.

Shelter regression: the earlier noWater=True setup skipped reflection rendering
and compared the previous gallery texture. Every shelter frame now renders its
reflection freshly, with an empty-scene control proving geometry reaches it.
"""
from pathlib import Path
import hashlib, json
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs, read_utf8
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/world-cutaway-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'engine_sha256':hashlib.sha256((ROOT/'src/engine.js').read_bytes()).hexdigest(),'checks':[]}
with sync_playwright() as pw:
 browser=pw.chromium.launch(**chromium_launch_kwargs());context=browser.new_context(viewport={'width':800,'height':600},offline=True);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<canvas id="c"></canvas><script>'+read_utf8(ROOT/'src/engine.js')+'</script>')
 report.update(page.evaluate('''()=>{
 const e=new RealmEngine.Engine(document.querySelector('canvas'));e.resize(800,600,1);e.quality='balanced';e.waterStill=true;
 const g=e.gl,checks=[],read=f=>{g.bindFramebuffer(g.FRAMEBUFFER,f.f);const a=new Uint8Array(f.w*f.h*4);g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},difference=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0),blue=a=>{let n=0;for(let i=0;i<a.length;i+=4)if(a[i+2]>a[i]*2&&a[i+2]>a[i+1]*2&&a[i+2]>120)n++;return n;},render=()=>{e.lastShadow=-1;e.render(1,16,false);return{main:read(e.mainF),reflection:read(e.refF)};},check=(name,passed,data={})=>checks.push({name,passed,...data});
 e.cutawayFocus=[0,-1.8,0];e.galleryFocus=[0,-1.8,0];e.setCamera({eye:[0,18,24],target:[0,-1.8,0],half:10,aspect:4/3});
 e.batch('box',[{p:[0,1.515,0],s:[9,.11,9],c:[.8,.75,.6],cutaway:true,terrain:true,cameraSolid:false},{p:[0,-1.8,0],s:[1,2,.5],c:[.01,.05,1],em:.8,cameraSolid:false}]);
 e.cutaway=false;const off=render();e.cutaway=true;const on=render();
 check('Above-water diorama exposes known submerged subject through deck and water',blue(on.main)>blue(off.main)+100,{beforeBlue:blue(off.main),afterBlue:blue(on.main)});
 check('Gallery aperture leaves actual reflected framebuffer identical',difference(off.reflection,on.reflection)===0,{changedChannels:difference(off.reflection,on.reflection)});
 e.galleryFocus=null;const noGallery=render();check('Ordinary water retains its opaque surface without a visited gallery',blue(noGallery.main)<blue(on.main)-100,{ordinaryBlue:blue(noGallery.main)});
 e.galleryFocus=[0,-1.8,0];e.cutaway=false;const disabled=render();check('Disabled cutaway retains the original main image',difference(off.main,disabled.main)===0,{changedChannels:difference(off.main,disabled.main)});
 e.clear();e.noWater=false;e.galleryFocus=null;e.cutawayFocus=[0,2,0];e.setCamera({eye:[0,18,24],target:[0,2,0],half:10,aspect:4/3});
 e.cutaway=true;e.worldRoofOpen=false;const emptyShelter=render();
 e.batch('box',[{p:[0,5.5,0],s:[12,.2,10],c:[.4,.4,.4],cutaway:true,worldRoof:'synthetic-shelter'},{p:[3,2,0],s:[1,2,.5],c:[.01,.05,1],em:.8,cameraSolid:false}]);
 e.cutaway=true;e.worldRoofOpen=false;const covered=render();e.worldRoofOpen=true;const open=render();check('Visited shelter reveals a resident away from the narrow traveler aperture',blue(open.main)>blue(covered.main)+100,{beforeBlue:blue(covered.main),afterBlue:blue(open.main)});
 const emptyChangedChannels=difference(emptyShelter.reflection,covered.reflection),galleryChangedChannels=difference(disabled.reflection,covered.reflection);check('Fresh shelter reflection contains geometry distinct from empty and prior gallery scenes',emptyChangedChannels>100&&galleryChangedChannels>100,{emptyChangedChannels,galleryChangedChannels});
 check('Shelter main-view reveal leaves reflected geometry identical',difference(covered.reflection,open.reflection)===0,{changedChannels:difference(covered.reflection,open.reflection)});
 e.cutaway=false;e.worldRoofOpen=false;const solid=render();e.worldRoofOpen=true;const stillSolid=render();check('Disabled cutaway preserves the complete shelter roof',difference(solid.main,stillSolid.main)===0,{changedChannels:difference(solid.main,stillSolid.main)});
 check('No WebGL error',g.getError()===g.NO_ERROR);return{checks};
 }'''))
 report['browser_errors']=errors;report['passed']=not errors and all(c['passed'] for c in report['checks']);browser.close()
(OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
for c in report['checks']:print(('PASS ' if c['passed'] else 'FAIL ')+c['name'])
print(json.dumps(report,indent=2));raise SystemExit(0 if report['passed'] else 1)
