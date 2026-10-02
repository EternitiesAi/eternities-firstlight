"""Actual keyboard comparator UI and native reload in isolated software Chromium.
Physical routes use accelerated production movement; no human pacing/GPU claim.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import hashlib,json,tempfile,threading,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidence10/realm-trails-cosmos-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'checks':[],'browser_errors':[],'errors':[],'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
def check(name,ok):
 report['checks'].append({'name':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with tempfile.TemporaryDirectory(prefix='firstlight-comparator-') as profile,sync_playwright() as pw:
  context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)));page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
  response=page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load');page.wait_for_function('window.Realm')
  ev=lambda js,arg=None:page.evaluate(js,arg)
  state=lambda:ev('Realm.state')
  def render():ev('()=>{Realm.test.quality("low");Realm.test.render()}')
  def close():
   if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
  def walk(x,z):
   close();r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<12000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.25,hp:Realm.state.adventure.hp}}',[x,z]);check(f'physical comparator route {x},{z}',r.get('ok') and r.get('hp',0)>0)
  def local():close();page.locator('#tracked-open').click();render()
  def enter():
   walk(18,6);page.keyboard.press('j');page.locator('[data-rpg="open"][data-id="worlds"]').click()
   if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
   page.locator('[data-rpg="world-select"][data-id="cosmos"]').click();page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();render()
  def dial(step):
   inp=page.locator('[data-trail-dial="'+step['id']+'"]');inp.press('Home')
   for i in range(round(step['instrument']['target']*10)):inp.press('ArrowRight')
   return float(inp.input_value())
  check('exact rebuilt HTML response',hashlib.sha256(response.body()).hexdigest()==report['html_sha256']);render();walk(11,9)
  check('initial kit through accepted production command',ev('Realm.test.adventure("comparator-earned-kit","start")')['ok']);enter()
  d=ev('RealmTrails.definitions().find(d=>d.realm==="cosmos")');walk(d['giver']['x'],d['giver']['z']);local()
  text=page.locator('[data-trail="'+d['id']+'"]').inner_text();check('before acceptance route danger and complete reward are visible',all(t in text for t in ['Danger','25 XP','10 sunmarks','2 ore','initial kit']))
  before=state();page.locator('[data-rpg="trail-accept"]').click();render();check('explicit acceptance preserves original survey and inventory',state()['journeys']==before['journeys'] and state()['sandbox']==before['sandbox'])
  for index,s in enumerate([s for s in d['steps'] if s.get('instrument')]):
   if index==0:
    local();page.locator('[data-rpg="trail-walk"][data-id="'+s['id']+'"]').click()
    ev('()=>{for(let i=0;i<12000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
    p=ev('Realm.diagnostics.adventure.player');distance=((p['x']-s['x'])**2+(p['z']-s['z'])**2)**.5
    check('UI walks to a supported readable approach beside the instrument',1.5<distance<2 and ev('(p)=>RealmTrails.at(Realm.test.worldContext().sim,p)',s))
   else:walk(s['x'],s['z'])
   page.keyboard.press('m');render();check('map shows available real station',page.locator('[data-trail-marker="'+s['id']+'"]').count()==1);bounds=page.locator('.world-atlas svg').bounding_box();check('route map is a readable figure, not an icon',bounds['width']>200 and bounds['height']>230);page.screenshot(path=str(OUT/(s['id']+'-map.png')));close();page.keyboard.press('e');render()
   check('physical E opens keyboard-operable comparator',page.locator('[data-trail-dial="'+s['id']+'"]').is_visible())
   bounds=page.locator('.trail-instrument svg').bounding_box();check('comparator figure retains its actual readable dimensions',bounds['width']>=220 and bounds['height']>=135)
   before=state();page.locator('[data-rpg="trail-step"][data-id="'+s['id']+'"]').click();render();check('unaligned recording spends nothing and completes nothing',state()==before)
   value=dial(s);check('actual keyboard inputs align the local scale',abs(value-s['instrument']['target'])<=2 and 'split scale aligned' in page.locator('.trail-instrument output').inner_text())
   model=ev('Realm.test.traveler()');check('preview cannot mutate saved rewards or story history',state()==before)
   page.screenshot(path=str(OUT/(s['id']+'-aligned-ui.png')));page.locator('[data-rpg="trail-step"][data-id="'+s['id']+'"]').click();render()
   check('explicit aligned UI record saves the selected measurement',state()['realmTrails']['records'][d['id']]['settings'][s['id']]==value)
   close();page.screenshot(path=str(OUT/(s['id']+'-world.png')));saved=state();check('partial accepted state can save',ev('Realm.test.save()')['ok']);page.reload(wait_until='load');page.wait_for_function('window.Realm');render()
   check('native reload retains exact readings and original history',state()['realmTrails']==saved['realmTrails'] and state()['journeys']==saved['journeys']);enter()
  s=next(s for s in d['steps'] if not s.get('instrument'));walk(s['x'],s['z']);page.keyboard.press('e');render();page.locator('[data-rpg="trail-step"][data-id="'+s['id']+'"]').click();render()
  check('service arm follows two accepted measurements',s['id'] in state()['realmTrails']['records'][d['id']]['steps']);walk(d['giver']['x'],d['giver']['z']);local();before=state();page.locator('[data-rpg="trail-claim"]').click();render();after=state()
  check('explicit Cosmos reward pays exact quantities once',all(after['adventure'][k]-before['adventure'][k]==d['reward'][k] for k in ['xp','coins','ore']))
  check('changed request cannot duplicate calibration reward',ev('(q)=>Realm.test.trailCommand("claim",{quest:q,request:"changed"})',d['id']).get('duplicate'));page.screenshot(path=str(OUT/'two-stations-claimed.png'))
  close();ev('Realm.test.save()');page.reload(wait_until='load');page.wait_for_function('window.Realm');render();check('paid calibration survives native reload',state()['realmTrails']==after['realmTrails'])
  check('no browser or application errors',not report['browser_errors'] and not ev('Realm.diagnostics.errors'));report['status']='passed';report['command_earned_world']=state();context.close()
except Exception:
 report['status']='failed';report['errors'].append(traceback.format_exc());raise
finally:
 server.shutdown();server.server_close();(OUT/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
