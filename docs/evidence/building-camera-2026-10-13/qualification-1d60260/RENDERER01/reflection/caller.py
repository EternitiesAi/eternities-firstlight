"""Render orientation controls at four orbits; read actual reflection FBO pixels.
These asymmetric color samples would be reversed by Realm 03's lookAt method.
No external requests, no game performance claim.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs, read_utf8
import json,hashlib
root=Path('D:\\07-GAMES\\Firstlight\\verification\\current-qualified-game');report={'checks':[],'mode':'Offline Chromium/WebGL2 reflection framebuffer readback'}
Path('D:\\07-GAMES\\Firstlight\\artifacts\\building-camera-20261013\\RENDERER01\\reflection').mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(**chromium_launch_kwargs())
 c=b.new_context(viewport={'width':1000,'height':700},offline=True);page=c.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content('<canvas id="canvas"></canvas><script>'+ read_utf8(root/'src/engine.js')+'</script>')
 page.evaluate('''()=>{const e=window.e=new RealmEngine.Engine(document.querySelector('canvas'));e.quality='high';e.resize(1000,700,1);e.waterStill=true;e.reflectionStrength=4; e.clear();
 e.batch('box',[{p:[-5,3,-2],s:[2,6,2],c:[1,.02,.02],em:.3},{p:[5,3,2],s:[2,6,2],c:[.02,1,.02],em:.3}]);}''')
 for angle in [.3,1.4,2.8,4.6]:
  samples=page.evaluate('''(a)=>{const E=RealmEngine,e=window.e; e.setCamera({eye:[Math.sin(a)*40,30,Math.cos(a)*40],target:[0,0,0],half:15,aspect:1000/700});e.lastShadow=-1;e.render(1,16,false);const g=e.gl;g.bindFramebuffer(g.FRAMEBUFFER,e.refF.f);let out=[];
 for(let [name,p]of [['red',[-5,3,-2]],['green',[5,3,2]]]){
  // Independent expected physical image: mirror the WORLD point then use the NORMAL camera.
  const q=E.M.transform(e.vp,[p[0],2*E.WATER_HEIGHT-p[1],p[2]]),x=Math.round((q[0]*.5+.5)*e.refF.w),y=Math.round((q[1]*.5+.5)*e.refF.h),pixel=new Uint8Array(4);
  g.readPixels(x,y,1,1,g.RGBA,g.UNSIGNED_BYTE,pixel);out.push({name,x,y,pixel:Array.from(pixel)});
 }g.bindFramebuffer(g.FRAMEBUFFER,null);return out;}''',angle)
  for s in samples:
   pix=s['pixel'];ok=pix[0]>pix[1]*2 if s['name']=='red' else pix[1]>pix[0]*2
   report['checks'].append({'orbit_radians':angle,**s,'passed':ok})
   if not ok:raise AssertionError(s)
  if angle==.3:page.screenshot(path=str(Path('D:\\07-GAMES\\Firstlight\\artifacts\\building-camera-20261013\\RENDERER01\\reflection\\REFLECTION_ORIENTATION_SPECIMEN.png')))
 report['browser_errors']=errs;report['passed']=not errs and all(s['passed'] for s in report['checks']);report['engine_sha256']=hashlib.sha256((root/'src/engine.js').read_bytes()).hexdigest();b.close()
(Path('D:\\07-GAMES\\Firstlight\\artifacts\\building-camera-20261013\\RENDERER01\\reflection\\REFLECTION_TEST_REPORT.json')).write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
raise SystemExit(0 if report['passed'] else 1)
