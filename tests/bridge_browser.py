"""Actual bridge UI, supported walking, both cameras and GPU framebuffer effects.

Isolated software WebGL engineering coverage. Accelerated rule walking and
labelled command-earned returning fixtures are not human feel or RTX timing.
The separate ordinary-RAF walk selects Low through the real graphics control;
balanced effects are covered by independent framebuffer probes above it.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib,json,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/bridge-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(),'checks':[],'errors':[],'browser_errors':[]}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT),**k)
 def log_message(self,*a):pass
def check(name,value):
 report['checks'].append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(**chromium_launch_kwargs());c=b.new_context(viewport={'width':1280,'height':800});page=c.new_page()
  page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
  page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
  response=page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load');page.wait_for_function('window.Realm')
  check('exact generated build loads',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
  ev=lambda js,arg=None:page.evaluate(js,arg)
  state=lambda:ev('()=>Realm.state')
  def render():ev('()=>Realm.test.render()')
  def walk(x,z):
   r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<3500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();return{ok:Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.3}}',[x,z]);check('production walk reaches '+str((x,z)),r['ok'])
  def enter():
   walk(0,23);page.keyboard.press('e');render();check('entry remains explicit',page.locator('[data-rpg="earth-confirm"]').count()==1);page.locator('[data-rpg="earth-confirm"]').click();render()
  enter();before=state()['adventure'];walk(0,16);page.keyboard.press('e');render()
  check('bridge text and optional side framing are legible',page.locator('[data-rpg="earth-bridge-view"]').count()==1 and 'Four stone arches' in page.locator('#rpg-content').inner_text())
  mode=ev('()=>Realm.diagnostics.camera.preset');page.keyboard.press('v');render();check('camera shortcut is consumed inside marker dialog',ev('()=>Realm.diagnostics.camera.preset')==mode)
  page.locator('[data-rpg="earth-bridge-view"]').click();render()
  check('explicit framing keeps third-person style and closes ordinary pause dialog',ev('()=>Realm.diagnostics.camera.projection')=='perspective' and not page.locator('#rpg-window').evaluate('(e)=>e.open') and ev('()=>Realm.diagnostics.adventure.paused') is False)
  page.screenshot(path=str(OUT/'BRIDGE_SIDE_THIRD.png'))
  art=ev('()=>Realm.test.bridge()');report['submitted']=art
  check('four vaults are actually submitted above the physical water plane',sum(p['kind']=='bridge-vault' for p in art['parts'])==4 and art['waterHeight']==.01)
  check('bounded bridge and mountain pieces never block the camera or cut away',len([p for p in art['parts'] if p.get('bridgePart')])<=420 and all(not p['cameraSolid'] and not p['cutaway'] for p in art['parts']))
  check('actual submitted shoreline is bounded steep dressing, with no camera or cutaway authority',len([p for p in art['parts'] if p.get('shorelinePart')])==19 and all(p['s'][0]<=.85 for p in art['parts'] if p['kind']=='bank-slope'))
  check('flanking water has no navigation target',not ev('()=>Realm.test.move(3,20).ok'))
  walk(0,27.5);walk(0,10);walk(0,16)
  page.keyboard.press('v');render();page.keyboard.press('e');render();page.locator('[data-rpg="earth-bridge-view"]').click();render()
  check('same explicit framing retains diorama style',ev('()=>Realm.diagnostics.camera.projection')=='orthographic')
  page.screenshot(path=str(OUT/'BRIDGE_SIDE_DIORAMA.png'))
  # Independent framebuffer proof reuses the actual submitted bridge pieces.
  pixels=ev('''()=>{const canvas=document.createElement('canvas'),e=new RealmEngine.Engine(canvas);e.resize(512,320,1);e.clear();e.theme='earth';e.earthWater=RealmEarth.BRIDGE;e.quality='balanced';e.setCamera({eye:[-20,5,19.5],target:[0,2,19.5],projection:'perspective',fov:60,half:10,aspect:1.6});const parts=Realm.test.bridge().parts;for(const kind of new Set(parts.map(p=>p.kind)))e.batch(kind,parts.filter(p=>p.kind===kind));const g=e.gl,read=(f)=>{g.bindFramebuffer(g.FRAMEBUFFER,f.f);const a=new Uint8Array(f.w*f.h*4);g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},diff=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0);e.render(1,16,false);const main=read(e.mainF),ref=read(e.refF);e.cloudsEnabled=false;e.render(1,16,false);const cloudMain=diff(main,read(e.mainF)),cloudReflection=diff(ref,read(e.refF));const currentOn=read(e.mainF);e.earthCurrentEnabled=false;e.render(1,16,false);const earthCurrentPixels=diff(currentOn,read(e.mainF));e.earthCurrentEnabled=true;e.cloudsEnabled=true;e.render(3,16,false);const motion=diff(main,read(e.mainF));e.reducedMotion=true;e.render(4,16,false);const still=read(e.mainF);e.render(9,16,false);const frozen=diff(still,read(e.mainF));e.reducedMotion=false;e.quality='low';e.render(1,16,false);const low=read(e.mainF);const out={cloudMain,cloudReflection,earthCurrentPixels,motion,frozen,lowNonBlack:low.filter((v,i)=>i%4!==3&&v>10).length,glError:g.getError(),reflection:e.reflectionInfo,meshes:e.metrics};e.disposeSurfaceMaterials();g.getExtension("WEBGL_lose_context")?.loseContext();return out;}''')
  report['framebuffer']=pixels
  check('world cloud layer changes actual main framebuffer pixels',pixels['cloudMain']>3000)
  check('same cloud layer changes actual reflected framebuffer pixels',pixels['cloudReflection']>3000)
  check('isolated Earth current/wake toggle changes actual pixels with clouds disabled',pixels['earthCurrentPixels']>1000)
  check('combined current/cloud motion contributes actual pixels',pixels['motion']>1000)
  check('reduced-motion rendering freezes the added motion exactly',pixels['frozen']==0)
  check('low-quality water/cloud fallback remains rendered without GL errors',pixels['lowNonBlack']>10000 and pixels['glError']==0)
  optics=ev('''()=>{const e=new RealmEngine.Engine(document.createElement('canvas'));e.resize(512,320,1);e.clear();e.theme='earth';e.earthWater=RealmEarth.BRIDGE;e.quality='balanced';e.cloudsEnabled=false;const parts=Realm.test.bridge().parts;for(const kind of new Set(parts.map(p=>p.kind)))e.batch(kind,parts.filter(p=>p.kind===kind));const g=e.gl,read=f=>{g.bindFramebuffer(g.FRAMEBUFFER,f.f);const a=new Uint8Array(f.w*f.h*4);g.readPixels(0,0,f.w,f.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;},diff=(a,b)=>a.reduce((n,v,i)=>n+(v!==b[i]),0),views=[];
   for(const projection of['perspective','orthographic']){e.setCamera({eye:[projection==='perspective'?-20:-75,projection==='perspective'?5:24,19.5],target:[0,2,19.5],projection,fov:60,half:10,aspect:1.6});e.earthOpticsEnabled=true;e.mountainHazeEnabled=true;e.render(1,16,false);const on=read(e.mainF),ref=read(e.refF);e.earthOpticsEnabled=false;e.render(1,16,false);const water=diff(on,read(e.mainF));e.earthOpticsEnabled=true;e.mountainHazeEnabled=false;e.render(1,16,false);views.push({projection,waterPixels:water,mountainPixels:diff(on,read(e.mainF)),reflectedMountainPixels:diff(ref,read(e.refF))});}
   e.theme='valley';e.mountainHazeEnabled=true;e.earthOpticsEnabled=true;e.render(1,16,false);const outside=read(e.mainF);e.mountainHazeEnabled=false;e.earthOpticsEnabled=false;e.render(1,16,false);const out={views,nonEarthPixels:diff(outside,read(e.mainF)),glError:g.getError()};e.disposeSurfaceMaterials();g.getExtension('WEBGL_lose_context')?.loseContext();return out;}''')
  report['optical_profile']=optics
  for view in optics['views']:
   check(view['projection']+' Earth optical profile changes actual same-time water pixels',view['waterPixels']>1000)
   check(view['projection']+' authored mountain depth changes actual same-time main pixels',view['mountainPixels']>1000)
   check(view['projection']+' mountain depth also changes the actual reflected framebuffer',view['reflectedMountainPixels']>1000)
  check('Earth optics and mountain-only haze do not change non-Earth pixels or leak GL errors',optics['nonEarthPixels']==0 and optics['glError']==0)
  # Explicit reset and input/persistence keep the original contracts.
  page.keyboard.press('r');render();check('R resets current diorama style',ev('()=>Realm.diagnostics.camera.projection')=='orthographic' and abs(ev('()=>Realm.diagnostics.camera.yaw')-.76)<.001)
  page.keyboard.press('v');render();check('V returns to saved third-person side orbit',ev('()=>Realm.diagnostics.camera.projection')=='perspective' and abs(ev('()=>Realm.diagnostics.camera.yaw')-4.71238898)<.001)
  check('bridge sightseeing changes no XP, ownership, story or equipment',all(state()['adventure'][k]==before[k] for k in ['xp','owned','equipment','arsenal','starter','pursuit','classPath','earthStory','earthGathering']))
  ev('()=>Realm.test.save()');saved=state();page.reload();page.wait_for_function('window.Realm');render()
  check('reload resumes at acknowledged lake checkpoint preserving camera profiles',ev('()=>Realm.diagnostics.scene')=='valley' and state()['player']==saved['player'] and state()['settings']['cameraViews']==saved['settings']['cameraViews'])
  check('bridge diagnostic is absent outside Earth',ev('()=>Realm.test.bridge()') is None)
  source=ROOT/'docs/evidence/classes/HUNTER_SOURCE.json'
  returning=json.loads(source.read_text(encoding='utf-8'));report['returning_fixture']={'path':str(source.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'label':'command-earned bow checkpoint'}
  ev('(s)=>Realm.test.replace(s)',returning);render();prior=state()['adventure'];enter();walk(0,10);walk(0,24)
  check('command-earned returning bow crosses without reward/history changes',all(state()['adventure'][k]==prior[k] for k in prior if k!='elapsed'))
  check('all browser runtime errors remain visible and absent',not report['browser_errors'])
  c.close()
  # Separate storage/page with the ordinary app RAF loop, no accelerated ticks.
  normal=b.new_context(viewport={'width':1280,'height':800});np=normal.new_page()
  np.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
  np.add_init_script('window.__ETERNITIES_TEST_MODE=true;')
  np.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load',timeout=60000);np.wait_for_function('()=>!!window.Realm');np.bring_to_front()
  check('normal RAF page is visible',np.evaluate('document.visibilityState')=='visible')
  np.evaluate('()=>Realm.test.openPanel("settings")');np.locator('#quality').select_option('low');np.locator('#close-panel').click()
  check('ordinary RAF walking uses explicitly selected low graphics',np.evaluate('()=>Realm.state.settings.quality==="low"&&Realm.diagnostics.adventure.paused===false'))
  def real_walk(x,z):
   check('normal-time walk accepted '+str((x,z)),np.evaluate('([x,z])=>Realm.test.move(x,z).ok',[x,z]));np.wait_for_function('()=>!Realm.test.path.length',timeout=45000)
   check('normal-time walk arrives '+str((x,z)),np.evaluate('([x,z])=>Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.3',[x,z]))
  real_walk(0,23);np.keyboard.press('e');np.locator('[data-rpg="earth-confirm"]').click();real_walk(0,16)
  np.keyboard.press('e');np.locator('[data-rpg="earth-bridge-view"]').click()
  check('normal-time crossing move is accepted',np.evaluate('Realm.test.move(0,26.5).ok'))
  motion=np.evaluate('''()=>new Promise(resolve=>{const a=[];let start;function frame(stamp){if(start===undefined)start=stamp;const t=Realm.test.traveler();a.push({stamp,elapsed:stamp-start,z:Realm.diagnostics.adventure.player.z,phase:t.motion.phase,blend:t.motion.blend,time:t.motion.time,leftFoot:t.frame.joints.leftFoot.slice(),rightFoot:t.frame.joints.rightFoot.slice(),visible:document.visibilityState,paused:Realm.diagnostics.adventure.paused});if(a.length<30||stamp-start<400)requestAnimationFrame(frame);else resolve(a);}requestAnimationFrame(frame);})''')
  report['normal_raf']=motion
  check('actual visible app RAF advances bridge position and submitted stride',motion[-1]['z']>motion[0]['z']+.4 and motion[-1]['phase']!=motion[0]['phase'] and all(x['visible']=='visible' and x['paused'] is False for x in motion))
  check('submitted local leg joints change during ordinary crossing',any(x['leftFoot']!=motion[0]['leftFoot'] or x['rightFoot']!=motion[0]['rightFoot'] for x in motion[1:]))
  np.screenshot(path=str(OUT/'BRIDGE_RUNNING_THIRD.png'))
  np.keyboard.press('p');np.wait_for_timeout(100);paused=np.evaluate('()=>({p:Realm.diagnostics.adventure.player,motion:Realm.test.traveler().motion,paused:Realm.diagnostics.adventure.paused,visible:document.visibilityState})');np.wait_for_timeout(250)
  check('normal app pause preserves bridge position and stride',paused['paused'] is True and paused['visible']=='visible' and np.evaluate('()=>({p:Realm.diagnostics.adventure.player,motion:Realm.test.traveler().motion,paused:Realm.diagnostics.adventure.paused,visible:document.visibilityState})')==paused)
  np.keyboard.press('p');np.wait_for_function('()=>!Realm.test.path.length',timeout=45000)
  check('visible normal app resumes and reaches opposite bridge bank',np.evaluate('()=>Realm.diagnostics.adventure.paused===false&&document.visibilityState==="visible"&&Math.hypot(Realm.diagnostics.adventure.player.x,Realm.diagnostics.adventure.player.z-26.5)<.3'))
  np.evaluate('()=>Realm.test.openPanel("settings")');np.locator('[data-setting="reducedMotion"]').check();np.locator('#close-panel').click();np.wait_for_timeout(150)
  check('actual reduced-motion control reaches the bridge traveller',np.evaluate('Realm.test.traveler().frame.reducedMotion'))
  real_walk(0,19.5);check('normal and accelerated browser runtime errors are absent',not report['browser_errors']);normal.close();b.close()
except Exception as e:report['errors'].append(str(e));report['traceback']=traceback.format_exc()
finally:server.shutdown()
report['passed']=not report['errors'] and not report['browser_errors'] and all(x['passed'] for x in report['checks'])
(OUT/'REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='submitted'},indent=2))
raise SystemExit(0 if report['passed'] else 1)
