"""Independent synthetic framebuffer test of the camera cutaway, not game progress.
Flagged foreground geometry must expose a known blue subject in the MAIN image;
the corresponding water reflection must remain pixel-identical. No FPS claim.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs, read_utf8, browser_output
import json,hashlib
R=Path(__file__).resolve().parents[1];O=browser_output(R/'evidence10');O.mkdir(parents=True,exist_ok=True);rep={'method':__doc__,'engine_sha256':hashlib.sha256((R/'src/engine.js').read_bytes()).hexdigest(),'checks':[]}
with sync_playwright() as pw:
 b=pw.chromium.launch(**chromium_launch_kwargs())
 ctx=b.new_context(viewport={'width':800,'height':600},offline=True);p=ctx.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
 p.set_content('<canvas id="c"></canvas><script>'+read_utf8(R/'src/engine.js')+'</script>')
 rep.update(p.evaluate('''()=>{const e=new RealmEngine.Engine(document.querySelector('canvas'));e.resize(800,600,1);e.quality='balanced';e.waterStill=true;e.cutawayFocus=[0,2,0];e.setCamera({eye:[0,18,24],target:[0,2,0],half:10,aspect:4/3});const wall={p:[0,5,4],s:[7,8,1],c:[1,.02,.02],em:.5,cutaway:true};const bat=e.batch('box',[wall,{p:[0,2,0],s:[1.6,3,1.6],c:[.01,.05,1],em:.8}]);const g=e.gl,read=f=>{g.bindFramebuffer(g.FRAMEBUFFER,f.f);let a=new Uint8Array(f.w*f.h*4);g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},dif=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n;},blue=a=>{let n=0;for(let y=245;y<355;y++)for(let x=360;x<440;x++){let i=4*(y*e.mainF.w+x);if(a[i+2]>a[i]*1.6&&a[i+2]>60)n++;}return n;};
 e.cutaway=false;e.render(1,16,false);let off=read(e.mainF),refOff=read(e.refF);e.cutaway=true;e.lastShadow=-1;e.render(1,16,false);let on=read(e.mainF),refOn=read(e.refF);let checks=[{name:'Flagged foreground occluder reveals subject pixels',passed:blue(on)>blue(off)+100,beforeBlue:blue(off),afterBlue:blue(on)},{name:'Main image changes',passed:dif(off,on)>100,changedChannels:dif(off,on)},{name:'Water reflection stays pixel-identical',passed:dif(refOff,refOn)===0,changedChannels:dif(refOff,refOn)}];
 wall.cutaway=false;e.updateBatch(bat);e.cutaway=false;e.lastShadow=-1;e.render(1,16,false);let solidOff=read(e.mainF);e.cutaway=true;e.lastShadow=-1;e.render(1,16,false);let solidOn=read(e.mainF);checks.push({name:'Unflagged actors and geometry never cut away',passed:dif(solidOff,solidOn)===0,changedChannels:dif(solidOff,solidOn)});
 wall.cutaway=true;wall.p=[0,3,-4];e.updateBatch(bat);e.cutaway=false;e.lastShadow=-1;e.render(1,16,false);let backOff=read(e.mainF);e.cutaway=true;e.lastShadow=-1;e.render(1,16,false);let backOn=read(e.mainF);checks.push({name:'Geometry behind focus remains unchanged',passed:dif(backOff,backOn)===0,changedChannels:dif(backOff,backOn)},{name:'No WebGL errors',passed:g.getError()===g.NO_ERROR});return{checks};}'''))
 rep['browser_errors']=errs;rep['passed']=not errs and all(c['passed'] for c in rep['checks']);b.close()
(O/'CUTAWAY_BROWSER_REPORT.json').write_text(json.dumps(rep,indent=2));print(json.dumps(rep,indent=2));raise SystemExit(0 if rep['passed'] else 1)
