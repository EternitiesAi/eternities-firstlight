"""Actual bridge UI, supported walking, both cameras and GPU framebuffer effects.

Isolated software WebGL engineering coverage. Accelerated rule walking and
labelled command-earned returning fixtures are not human feel or RTX timing.
The separate ordinary-RAF walk selects Low through the real graphics control;
balanced effects are covered by independent framebuffer probes above it.
Coastward adds native optional side-view clicks from an unassigned, earned
Chapter I save. Real-path setup is accelerated; its later stride uses app RAF.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse,hashlib,json,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,default=ROOT/'evidence10/bridge-browser');args=parser.parse_args()
OUT=args.output.resolve();OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'harness_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(),'checks':[],'errors':[],'browser_errors':[]}
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
  check('bridge and mountain pieces retain camera-collision and generic-cutaway opt-outs',len([p for p in art['parts'] if p.get('bridgePart')])<=420 and all(not p['cameraSolid'] and not p['cutaway'] for p in art['parts']))
  check('production world enables the local aperture on the accepted span',art['railCutaway']['eligible'] and art['railCutaway']['enabled'])
  check('only the 44 eligible rail boxes occupy the dedicated production batch',sum(p.get('bridgeRail',False) for p in art['parts'])==44 and all(bool(p.get('railBatch'))==bool(p.get('bridgeRail')) for p in art['parts']))
  rail_probe=ev((ROOT/'tests/bridge_rail_probe.js').read_text(encoding='utf-8'));report['rail_visibility']=rail_probe
  for case in rail_probe['cases']:
   label=f"{case['projection']} side{case['side']} x{case['x']} z{case['z']}"
   check(label+' reveals actual lower-leg pixels where the rail obscures them',case['legReferencePixels']>10 and case['afterLegPixels']>=max(case['beforeLegPixels'],case['legReferencePixels']*.7) and (case['missingBefore']<=10 or case['revealed']>=case['missingBefore']*.35))
   check(label+' preserves the exact reflection',case['reflectionChanged']==0)
   check(label+' preserves the encoded solid shadow',case['shadowChanged']==0)
  check('far rail stays pixel-identical behind the subject',rail_probe['farRailChanged']==0)
  check('local rail effect stays off outside the span and Earth without GL errors',rail_probe['outsideSpanChanged']==0 and rail_probe['nonEarthChanged']==0 and rail_probe['glError']==0)
  check('actual submitted shoreline is bounded steep dressing, with no camera or cutaway authority',len([p for p in art['parts'] if p.get('shorelinePart')])==19 and all(p['s'][0]<=.85 for p in art['parts'] if p['kind']=='bank-slope'))
  check('flanking water has no navigation target',not ev('()=>Realm.test.move(3,20).ok'))
  walk(0,27.5);walk(0,10)
  check('production world disables the local aperture on the bank',not ev('()=>Realm.test.bridge().railCutaway.eligible'))
  walk(0,16)
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
  saved_views=state()['settings']['cameraViews'];saved_adv=state()['adventure']
  ev('()=>Realm.test.openPanel("settings")');page.locator('[data-setting="cameraCutaway"]').uncheck();page.locator('#close-panel').click();render()
  check('actual saved cutaway control can disable the local rail effect',state()['settings']['cameraCutaway'] is False)
  page.reload(wait_until='load');page.wait_for_function('window.Realm');render()
  check('cutaway-off and both camera memories survive a whole-page reload',state()['settings']['cameraCutaway'] is False and state()['settings']['cameraViews']==saved_views)
  enter();walk(0,19.5)
  check('saved cutaway-off reaches the actual on-span renderer after reload',ev('()=>Realm.test.bridge().railCutaway.eligible&&!Realm.test.bridge().railCutaway.enabled'))
  check('reload preserves returning equipment and story owners',all(state()['adventure'][k]==saved_adv[k] for k in saved_adv if k!='elapsed'))
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
  real_walk(0,19.5);check('normal and accelerated browser runtime errors are absent',not report['browser_errors']);normal.close()
  # New Coastward coverage restores a legitimate, unassigned Chapter I save.
  # Setup walking uses the real rule/path commands with labelled accelerated
  # ticks. The subsequent bridge stride uses only the ordinary visible app RAF.
  coast=b.new_context(viewport={'width':1280,'height':800});cp=coast.new_page()
  cp.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
  cp.add_init_script('window.__ETERNITIES_TEST_MODE=true;')
  coast_origin=f'http://127.0.0.1:{server.server_port}/'
  report['coastward']={'method':'Native isolated loopback; unassigned command-earned Chapter I restore; accelerated real-path setup, real reading/menu clicks, ordinary visible app RAF bridge stride; no position edits or grants.','external_requests':[]}
  def coast_route(route):
   if route.request.url.startswith(coast_origin):route.continue_()
   else:report['coastward']['external_requests'].append(route.request.url);route.abort()
  coast.route('**/*',coast_route)
  coast_response=cp.goto(coast_origin,wait_until='load',timeout=60000);cp.wait_for_function('()=>!!window.Realm')
  check('Coastward native page loads the exact generated source',hashlib.sha256(coast_response.body()).hexdigest()==report['html_sha256'])
  cev=lambda js,arg=None:cp.evaluate(js,arg)
  chapter_path=ROOT/'examples/CHAPTER_COMPLETED_EARNED.json';chapter_bytes=chapter_path.read_bytes();chapter=json.loads(chapter_bytes)
  report['coastward']['fixture']={'path':str(chapter_path.relative_to(ROOT)),'sha256':hashlib.sha256(chapter_bytes).hexdigest(),'label':'command-earned Chapter I completed, no assigned class'}
  check('Coastward fixture is the exact recorded earned Chapter I source',report['coastward']['fixture']['sha256']=='27cb70f57c3584f7de69f667544c8215c6fbc5f7f3d45d7fb7bc241f1cabce49')
  cev('(s)=>Realm.test.replace(s)',chapter)
  def coast_close():
   if cp.locator('#rpg-window').evaluate('(e)=>e.open'):cp.locator('#rpg-close').click()
  def coast_render():cev('()=>Realm.test.render()')
  def coast_walk(x,z):
   coast_close();r=cev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<6000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:!Realm.test.path.length&&Math.hypot(p.x-x,p.z-z)<.3,player:p}}',[x,z])
   check('Coastward real supported setup walk reaches '+str((x,z)),r['ok'])
  def coast_owned():
   return cev('()=>{const s=Realm.state,a=s.adventure;return{adventure:Object.fromEntries(["xp","coins","ore","owned","equipment","arsenal","starter","pursuit","classPath","earthStory","earthGathering","companion","soul","beacon","road","crossing","reward"].map(k=>[k,a[k]??null])),inventory:s.sandbox.inventory,journeys:s.journeys,realmTrails:s.realmTrails,retreat:s.retreat,score:s.score,notes:s.notes,visitor:s.visitor}}')
  def coast_enter(realm):
   coast_walk(18,6);cp.keyboard.press('j');cp.locator('[data-rpg="world-list"]').first.click();cp.locator('[data-rpg="world-select"][data-id="'+realm+'"]').click();cp.locator('[data-rpg="world-preview"]').click();cp.locator('[data-rpg="world-confirm"]').click();coast_render()
   check('deliberate native Roads crossing enters '+realm,cev('Realm.diagnostics.world.id')==realm)
  def coast_refusal(name):
   owned=coast_owned();probe=cev('()=>{const read=()=>({camera:Realm.diagnostics.camera,player:Realm.diagnostics.adventure.player,paused:Realm.diagnostics.adventure.paused,dive:Realm.diagnostics.world?.dive??null});const before=read(),result=Realm.test.bridgeView(),after=read();return{before,result,after}}')
   check(name+' actual bridge-view callback refuses without changing camera, position, pause or depth',probe['result']['ok'] is False and probe['after']==probe['before'])
   check(name+' refusal preserves every protected progression and item owner',coast_owned()==owned)
  coast_render();coast_baseline=coast_owned()
  check('new Coastward source retains unassigned class and genuine earned reward',coast_baseline['adventure']['classPath']['choice'] is None and coast_baseline['adventure']['reward']==chapter['adventure']['reward'])
  cev('()=>Realm.test.openPanel("settings")');cp.locator('#quality').select_option('low');cp.locator('#camera-mode').select_option('adventure');cp.locator('#camera-fov').press('End')
  for _ in range(13):cp.locator('#camera-fov').press('ArrowLeft')
  cp.locator('#close-panel').click();coast_render()
  check('native camera settings establish a nondefault 67 degree perspective FOV',cev('Realm.diagnostics.camera.fov')==67)
  coast_refusal('outside both bridge scenes');coast_enter('earthlands');coast_refusal('arrival bank beyond the actual Coastward bridge extent')
  cp.keyboard.press('m');cp.locator('[data-rpg="world-walk"][data-id="channel-view"]').click()
  check('native Coastward channel route starts an actual supported path',cev('()=>Realm.test.path.length>0&&!Realm.diagnostics.adventure.paused'))
  cev('()=>{for(let i=0;i<6000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
  channel=cev('()=>RealmWorldFoundations.definition("earthlands").points.find(p=>p.id==="channel-view")')
  check('channel reading is reached through actual walking diagnostics',cev('(p)=>{const q=Realm.diagnostics.adventure.player;return Math.hypot(q.x-p.x,q.z-p.z)<.3}',channel))
  cp.keyboard.press('e');coast_render()
  check('physical channel reading offers one visible optional side-view action',cp.locator('[data-rpg="world-bridge-view"]').count()==1 and cp.locator('[data-rpg="world-bridge-view"]').is_visible() and 'continuous timber crossing' in cp.locator('#rpg-content').inner_text())
  first_player=cev('Realm.diagnostics.adventure.player');first_owned=coast_owned();first_preset=cev('Realm.diagnostics.camera.preset');first_fov=cev('Realm.diagnostics.camera.fov')
  cp.keyboard.press('v');check('Coastward reading dialog consumes camera exchange shortcut',cev('Realm.diagnostics.camera.preset')==first_preset)
  cp.locator('[data-rpg="world-bridge-view"]').click();coast_render();camera=cev('Realm.diagnostics.camera')
  check('explicit Coastward framing keeps perspective preset and chosen FOV',camera['preset']==first_preset=='adventure' and camera['projection']=='perspective' and camera['fov']==first_fov==67)
  check('actual Coastward perspective side orbit uses the reviewed framing',abs(camera['yaw']-4.71238898038469)<.001 and abs(camera['elevation']-.14)<.001 and abs(camera['distance']-14.5)<.001)
  check('actual Coastward perspective camera retains finite submitted eye and target',cev('()=>[...Realm.diagnostics.camera.eye,...Realm.diagnostics.camera.target].every(Number.isFinite)'))
  check('Coastward framing closes its deliberate pause and keeps player fixed',not cp.locator('#rpg-window').evaluate('(e)=>e.open') and not cev('Realm.diagnostics.adventure.paused') and cev('Realm.diagnostics.adventure.player')==first_player)
  check('Coastward side view grants no progression, equipment, inventory or class choice',coast_owned()==first_owned==coast_baseline)
  cp.screenshot(path=str(OUT/'COASTWARD_SIDE_THIRD.png'));report['coastward']['third_camera']=camera
  cp.keyboard.press('v');coast_render();diorama_before=cev('Realm.diagnostics.camera');cp.keyboard.press('e');cp.locator('[data-rpg="world-bridge-view"]').click();coast_render();diorama=cev('Realm.diagnostics.camera')
  check('same Coastward action retains the exchanged diorama preset and FOV',diorama['preset']==diorama_before['preset'] and diorama['projection']=='orthographic' and diorama['fov']==67)
  check('actual Coastward diorama side orbit uses the reviewed framing',abs(diorama['yaw']-4.71238898038469)<.001 and abs(diorama['elevation']-.39)<.001 and abs(diorama['half']-9)<.001)
  check('actual Coastward diorama camera retains finite submitted eye and target',cev('()=>[...Realm.diagnostics.camera.eye,...Realm.diagnostics.camera.target].every(Number.isFinite)'))
  check('diorama framing keeps genuine progression and unassigned class intact',coast_owned()==coast_baseline)
  cp.screenshot(path=str(OUT/'COASTWARD_SIDE_DIORAMA.png'));report['coastward']['diorama_camera']=diorama
  cp.keyboard.press('r');coast_render();reset=cev('Realm.diagnostics.camera')
  check('R resets only the Coastward diorama using the existing camera defaults',reset['preset']==diorama['preset'] and reset['projection']=='orthographic' and abs(reset['yaw']-.76)<.001 and reset['fov']==67)
  cp.keyboard.press('v');coast_render();exchanged=cev('Realm.diagnostics.camera')
  check('V restores the retained Coastward third-person side profile and chosen FOV',exchanged['preset']=='adventure' and exchanged['projection']=='perspective' and abs(exchanged['yaw']-4.71238898038469)<.001 and abs(exchanged['distance']-14.5)<.001 and exchanged['fov']==67)
  check('ordinary Coastward bridge movement is accepted after the side-view choice',cev('(z)=>Realm.test.move(0,z).ok',channel['z']-8))
  normal_stride=cev('''()=>new Promise(resolve=>{const samples=[];let start;function f(stamp){if(start===undefined)start=stamp;const t=Realm.test.traveler();samples.push({stamp,player:Realm.diagnostics.adventure.player,motion:t.motion,visible:document.visibilityState,paused:Realm.diagnostics.adventure.paused});if(samples.length<12||stamp-start<400)requestAnimationFrame(f);else resolve(samples);}requestAnimationFrame(f);})''')
  report['coastward']['ordinary_stride']=normal_stride
  check('visible ordinary app RAF still moves and articulates the Coastward traveler',normal_stride[-1]['player']['z']<normal_stride[0]['player']['z']-.3 and normal_stride[-1]['motion']['phase']!=normal_stride[0]['motion']['phase'] and all(s['visible']=='visible' and s['paused'] is False for s in normal_stride))
  cp.wait_for_function('()=>!Realm.test.path.length',timeout=60000)
  check('ordinary bridge route arrives without changing its camera preset or earned owners',cev('(z)=>Math.abs(Realm.diagnostics.adventure.player.z-z)<.3',channel['z']-8) and cev('Realm.diagnostics.camera.preset')=='adventure' and coast_owned()==coast_baseline)
  coast_walk(0,14);cp.keyboard.press('m');coast_render()
  check('off-span Coastward map offers no sightseeing action',cp.locator('[data-rpg="world-bridge-view"]').count()==0);coast_close();coast_refusal('far bank outside the full-supported Coastward bridge')
  cp.locator('#world-home').click();coast_render();coast_refusal('returned home outside both bridge scenes')
  coast_enter('atlantis');tide=cev('()=>RealmWorldFoundations.definition("atlantis").points.find(p=>p.id==="tide-steps")');coast_walk(tide['x'],tide['z']);cp.keyboard.press('e');cp.locator('[data-rpg="world-dive"]').click();coast_render()
  check('diving refusal uses genuine deliberate Atlantis gallery entry',cev('Realm.diagnostics.world.dive') is not None)
  coast_refusal('real Atlantis gallery while diving');cp.keyboard.press('m');coast_render()
  check('real gallery map offers no bridge side-view action',cp.locator('[data-rpg="world-bridge-view"]').count()==0)
  check('Coastward and Atlantis sightseeing retain all earlier choices and items',coast_owned()==coast_baseline)
  check('new bridge workflow stays loopback-only with all runtime errors absent',not report['coastward']['external_requests'] and not report['browser_errors'])
  coast.close();b.close()
except Exception as e:report['errors'].append(str(e));report['traceback']=traceback.format_exc()
finally:server.shutdown()
report['passed']=not report['errors'] and not report['browser_errors'] and all(x['passed'] for x in report['checks'])
(OUT/'REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='submitted'},indent=2))
raise SystemExit(0 if report['passed'] else 1)
