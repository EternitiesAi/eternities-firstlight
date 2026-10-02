"""Gathering through the complete generated game and native isolated save origin.
Command-earned blade/bow/veteran sources; accelerated walking is coverage only.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import hashlib,json,tempfile,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/gathering-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'checks':[],'errors':[],'browser_errors':[],'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
 def log_message(self,*args):pass
def check(name,value):
 report['checks'].append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with tempfile.TemporaryDirectory(prefix='firstlight-table-') as profile,sync_playwright() as pw:
  context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
  page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
  response=page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load');page.wait_for_function('()=>!!window.Realm')
  check('exact generated game loaded',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
  ev=lambda js,arg=None:page.evaluate(js,arg)
  report['browser_version']=context.browser.version;report['renderer']=ev('()=>Realm.diagnostics.renderer');report['render_mode']=ev('()=>Realm.diagnostics.mode');report['fixtures']={}
  state=lambda:ev('()=>Realm.state')
  render=lambda:ev("()=>{Realm.test.quality('low');Realm.test.render()}")
  def close():
   if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
  def walk(x,z):
   close();r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.3}}',[x,z]);check(f'physical walk reaches {x},{z}',r.get('ok'))
  def click(act,id=None):
   page.locator('[data-rpg="table-'+act+'"]'+('[data-id="'+id+'"]' if id else '')).click();render()
  def enter():
   close();walk(0,23);page.keyboard.press('e');render();page.locator('[data-rpg="earth-confirm"]').click();render()
  def reload():
   close();ev('()=>Realm.test.save()');before=state();page.reload();page.wait_for_function('()=>!!window.Realm');render();check('native reload preserves gathering and unpaid delivery',state()['adventure']['earthGathering']==before['adventure']['earthGathering'] and state()['adventure']['earthStory']==before['adventure']['earthStory']);enter()
  check('normal client owns current adventure schema',state()['adventure']['version']==11)
  for variant in ['fresh-blade-detour','fresh-bow-quarry','veteran-mill']:
   close();source=ROOT/'docs/evidence/living-world'/(variant+'_SOURCE.json');report['fixtures'][variant]={'path':str(source.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'kind':'command-earned source'};fixture=json.loads(source.read_text(encoding='utf-8'));ev('(w)=>Realm.test.replace(w)',fixture);render();before=state();enter()
   walk(0,-43);page.keyboard.press('e');render();check(variant+' unpaid delivery prompt remains accessible',page.locator('[data-rpg="rain-claim"]').count()==1);close()
   walk(4,-42.5);page.keyboard.press('e');render();check(variant+' nearby keyboard interaction opens actual gathering UI',page.locator('[data-rpg="table-accept"]').count()==1)
   check('reading does not accept or turn on sound',not state()['adventure']['earthGathering']['accepted'] and not ev('()=>Realm.diagnostics.audio.enabled'))
   cam=ev('()=>Realm.diagnostics.camera.preset');page.keyboard.press('v');render();check('table dialog consumes camera shortcuts',ev('()=>Realm.diagnostics.camera.preset')==cam)
   walk(4,-43.5);page.keyboard.press('e');render();check('visible tabletop is inside rule reach and opens invitation',ev('()=>Math.hypot(Realm.diagnostics.adventure.player.x-RealmGathering.TABLE.x,Realm.diagnostics.adventure.player.z-RealmGathering.TABLE.z)<1.75') and page.locator('[data-rpg="table-accept"]').count()==1);click('accept');reload()
   for id,x,z in [('cloth',-3,-40.5),('lantern',-5.8,-35),('stand',4,-42.5)]:
    walk(x,z);page.keyboard.press('e');render();click('prepare',id);check('actual game prepares '+id,id in state()['adventure']['earthGathering']['prepared'])
   walk(4,-42.5);page.keyboard.press('e');render();check('all arrangements require a separate choice',page.locator('[data-rpg="table-select"]').count()==3 and state()['adventure']['earthGathering']['verse'] is None)
   click('select','mill');check('consideration focuses explicit confirmation',ev('()=>document.activeElement.dataset.rpg==="table-confirm"'));click('cancel');check('cancel restores arrangement focus',ev('()=>document.activeElement.dataset.rpg==="table-select"&&document.activeElement.dataset.id==="mill"'))
   if variant=='fresh-blade-detour':
    click('select','mill');ev('()=>Realm.test.adventure("invalidate-table-confirmation","target-clear")');click('confirm');check('real adventure revision change refuses stale arrangement confirmation',state()['adventure']['earthGathering']['verse'] is None and 'preview changed' in page.locator('#toast').inner_text())
    click('select','mill');saved=state();ev('(w)=>Realm.test.replace(w)',saved);render();check('normal world restore clears pending arrangement',state()['adventure']['earthGathering']['verse'] is None and not ev('()=>Realm.diagnostics.roadsideGathering.pending'));enter();walk(4,-42.5);page.keyboard.press('e');render()
   verse='mill' if variant=='veteran-mill' else 'quarry' if variant=='fresh-bow-quarry' else 'detour';click('select',verse);page.keyboard.press('Enter');render();check(variant+' keyboard confirms selected arrangement',state()['adventure']['earthGathering']['verse']==verse)
   click('share');check('silent sharing leaves sound disabled',state()['adventure']['earthGathering']['shared'] and not ev('()=>Realm.diagnostics.audio.enabled'))
   after=state();check('no XP money equipment campaign or delivery reward',all(after['adventure'][k]==before['adventure'][k] for k in ['ore','coins','xp','equipment','owned','arsenal','pursuit','starter','classPath','earthStory','earthNotes','road','beacon','crossing','companion']))
   check('personal notes music home and inventory preserved',all(after[k]==before[k] for k in ['notes','score','retreat']) and after['sandbox']['inventory']==before['sandbox']['inventory']);reload();walk(4,-42.5);page.keyboard.press('e');render();check('kept memory is readable after native reload','A place kept.' in page.locator('#rpg-content').inner_text())
   if variant=='fresh-blade-detour':
    page.set_viewport_size({'width':390,'height':844});render();check('compact table page has no horizontal overflow',page.locator('#rpg-content').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'));page.screenshot(path=str(OUT/'SILENT_GATHERING_COMPACT.png'));page.set_viewport_size({'width':1280,'height':800});close()
    for mode in ['follow','adventure']:
     page.locator(f'[data-rpg="camera"][data-id="{mode}"]').click();ev('()=>Realm.test.view({yaw:.35,elevation:.32,distance:8})');render();page.screenshot(path=str(OUT/('TABLE_'+mode.upper()+'.png')));check('rendered gathering preserves '+mode+' view',ev('()=>Realm.diagnostics.camera.preset')==mode)
  # Actual Player/UI/application lifecycle. Permission-delay injections below
  # retain real audio services and explicitly model a browser resume boundary.
  close();page.locator('#earth-home').click();render();score=state()['score'];score_revision=state()['scoreRevision']
  page.locator('[data-rpg="open"][data-id="more"]').click();page.locator('[data-rpg="music"]').click();page.locator('[data-music="play"]').click();page.wait_for_function('()=>Realm.diagnostics.music.playing');page.locator('#studio-close').click();render();check('personal composition continues after its desk closes',ev('()=>Realm.diagnostics.music.playing'))
  enter();walk(4,-42.5);page.keyboard.press('e');render();check('native Earth travel preserves the already playing personal composition',ev('()=>Realm.diagnostics.music.playing'))
  click('play','detour');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="playing"');render();check('explicit roadside listening hands off from the personal composition and survives a frame',ev('()=>Realm.diagnostics.roadsideGathering.playing&&!Realm.diagnostics.music.playing') and state()['score']==score and state()['scoreRevision']==score_revision)
  close();page.locator('[data-rpg="open"][data-id="more"]').click();page.locator('[data-rpg="music"]').click();page.locator('[data-music="play"]').click();render();check('explicit personal Play takes back audio and leaves the roadside preview stopped',ev('()=>Realm.diagnostics.music.playing&&!Realm.diagnostics.roadsideGathering.playing') and state()['score']==score and state()['scoreRevision']==score_revision);page.locator('[data-music="play"]').click();page.locator('#studio-close').click();render()
  close();page.keyboard.press('j');render();check('remembered gathering remains reachable from the normal journal',page.locator('[data-rpg="table-open"]').count()==1);click('open')
  kept=state()['adventure']['earthGathering']['verse'];click('play','detour');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="playing"');check('explicit listening starts real Web Audio without changing kept choice',ev('()=>Realm.diagnostics.audio.enabled&&Realm.diagnostics.audio.state==="running"') and state()['adventure']['earthGathering']['verse']==kept)
  click('stop');check('stop releases actual preview',not ev('()=>Realm.diagnostics.roadsideGathering.playing'))
  click('play','quarry');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="playing"');page.keyboard.press('Escape');render();check('Escape closes game panel and releases preview',not page.locator('#rpg-window').evaluate('(e)=>e.open') and not ev('()=>Realm.diagnostics.roadsideGathering.playing'))
  page.keyboard.press('e');render();click('play','mill');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="playing"');page.locator('[data-rpg="open"][data-id="journal"]').last.click();render();check('normal menu change releases preview',not ev('()=>Realm.diagnostics.roadsideGathering.playing'));click('open')
  click('play','mill');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="playing"');ev('()=>window.dispatchEvent(new Event("blur"))');check('window blur releases actual preview',not ev('()=>Realm.diagnostics.roadsideGathering.playing'))
  click('play','mill');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="playing"');ev('()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));delete document.hidden;}');check('hidden document releases actual preview',not ev('()=>Realm.diagnostics.roadsideGathering.playing'))
  click('play','mill');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="playing"');ev('()=>document.querySelector("#sound").click()');check('application mute immediately releases actual preview',not ev('()=>Realm.diagnostics.roadsideGathering.playing') and not ev('()=>Realm.diagnostics.audio.enabled'))
  ev('''()=>{window.tableResumeFixture={state:Object.getOwnPropertyDescriptor(AudioContext.prototype,'state'),resume:AudioContext.prototype.resume,releases:[]};const f=window.tableResumeFixture;Object.defineProperty(AudioContext.prototype,'state',{configurable:true,get(){return 'suspended';}});AudioContext.prototype.resume=function(){return new Promise(resolve=>f.releases.push(resolve));};}''')
  click('play','mill');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="starting"');close();page.locator('#earth-home').click();render();ev('''()=>{const f=window.tableResumeFixture;if(f.state)Object.defineProperty(AudioContext.prototype,'state',f.state);else delete AudioContext.prototype.state;AudioContext.prototype.resume=f.resume;f.releases.forEach(resolve=>resolve());delete window.tableResumeFixture;}''');page.wait_for_timeout(30);check('departure during pending resume cannot start late audio',ev('()=>Realm.diagnostics.roadsideGathering.status==="idle"&&!Realm.diagnostics.roadsideGathering.playing'))
  enter();walk(4,-42.5);page.keyboard.press('e');render();click('play','mill');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="playing"')
  original=ev('()=>Realm.diagnostics.characters.active');old=state()
  ev('''()=>{window.tableResumeFixture={state:Object.getOwnPropertyDescriptor(AudioContext.prototype,'state'),resume:AudioContext.prototype.resume,releases:[]};const f=window.tableResumeFixture;Object.defineProperty(AudioContext.prototype,'state',{configurable:true,get(){return 'suspended';}});AudioContext.prototype.resume=function(){return new Promise(resolve=>f.releases.push(resolve));};}''')
  click('play','quarry');page.wait_for_function('()=>Realm.diagnostics.roadsideGathering.status==="starting"');page.locator('[data-rpg="open"][data-id="characters"]').click();render();check('character menu cancels pending outgoing preview',ev('()=>Realm.diagnostics.roadsideGathering.status==="idle"&&!Realm.diagnostics.roadsideGathering.playing'));page.locator('#chars-name').fill('Table witness');page.locator('#chars-create-submit').click();page.wait_for_function('(id)=>Realm.diagnostics.characters.active!==id',arg=original);render()
  ev('''()=>{const f=window.tableResumeFixture;if(f.state)Object.defineProperty(AudioContext.prototype,'state',f.state);else delete AudioContext.prototype.state;AudioContext.prototype.resume=f.resume;f.releases.forEach(resolve=>resolve());delete window.tableResumeFixture;}''');page.wait_for_timeout(30);check('character switch during pending resume refuses late outgoing audio',ev('()=>Realm.diagnostics.roadsideGathering.status==="idle"&&!Realm.diagnostics.roadsideGathering.playing&&!Realm.diagnostics.audio.enabled'));check('new character has no inherited gathering or delivery',not state()['adventure']['earthGathering']['accepted'] and not state()['adventure']['earthStory']['arrived'])
  close();page.keyboard.press('c');render();page.locator('[data-rpg="open"][data-id="characters"]').click();restored='character-1' if original=='legacy' else original;page.locator(f'[data-rpg="chars-switch"][data-id="{restored}"]').click();page.wait_for_function('(id)=>Realm.diagnostics.characters.active===id',arg=restored);render();check('native character switch restores its own table notebook and score',state()['adventure']['earthGathering']==old['adventure']['earthGathering'] and all(state()[k]==old[k] for k in ['notes','score','retreat']) and not ev('()=>Realm.diagnostics.roadsideGathering.playing'))
  check('no unhandled browser errors',not report['browser_errors']);context.close()
except Exception as e:
 report['errors'].append(str(e));traceback.print_exc()
finally:
 server.shutdown();server.server_close();(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(f"Gathering browser checks: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors: {len(report['errors'])}",flush=True)
if report['errors'] or report['browser_errors']:raise SystemExit(1)
