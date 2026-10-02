"""Actual Journal/Roads/map UI on an isolated native save origin in SwiftShader Chromium.
Coastward work is earned through production commands and accelerated supported walking.
No position/inventory/claim edits. This is not normal-time footage, a GPU test or human play.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/journey-usability-browser'
OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'checks':[],'browser_errors':[],'errors':[],
        'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
def check(name,ok):
 report['checks'].append({'name':name,'passed':bool(ok)})
 print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
try:
 with tempfile.TemporaryDirectory(prefix='firstlight-work-board-') as profile,sync_playwright() as pw:
  context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
  page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
  response=page.goto(url,wait_until='load');page.wait_for_function('()=>!!window.Realm')
  check('exact generated offline HTML loads',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
  ev=lambda js,arg=None:page.evaluate(js,arg)
  state=lambda:ev('Realm.state')
  def render():ev("()=>{Realm.test.quality('low');Realm.test.render()}")
  def close():
   if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
  def advance():
   r=ev('()=>{for(let i=0;i<16000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();return{finished:Realm.test.path.length===0,hp:Realm.state.adventure.hp}}')
   check('production walking finishes with traveler able to act',r['finished'] and r['hp']>0)
  def walk(x,z):
   close();r=ev('([x,z])=>Realm.test.move(x,z)',[x,z]);check(f'production route is supported at {x},{z}',r['ok']);advance()
   check(f'production route arrives at {x},{z}',ev('([x,z])=>Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.25',[x,z]))
  def journal():close();page.keyboard.press('j');render()
  def all_roads():
   journal();page.locator('.accepted-work-board [data-rpg="world-list"]').click();render()
  def enter_earth():
   all_roads();page.locator('[data-rpg="world-select"][data-id="earthlands"]').click();page.locator('[data-rpg="world-preview"]').click()
   before=state();page.locator('[data-rpg="world-confirm"]').click();render()
   check('deliberate crossing retains saved work and inventory',all(state()[k]==before[k] for k in ['realmTrails','journeys','adventure','sandbox']))
  def save_reload():
   close();before=state();check('earned world saves on native origin',ev('Realm.test.save()')['ok']);page.reload(wait_until='load');page.wait_for_function('()=>!!window.Realm');render()
   check('native reload retains earned trail, survey and earlier ownership',all(state()[k]==before[k] for k in ['realmTrails','journeys','adventure','sandbox']))
   check('native reload uses disclosed home checkpoint',ev('Realm.diagnostics.scene')=='valley')
  def return_home():
   close();page.locator('#world-home').click();render();check('free return reaches Firstlight',ev('Realm.diagnostics.scene')=='valley')
  def record_from_map(step):
   close();page.keyboard.press('m');render();route=page.locator('[data-trail-route="'+step+'"] [data-rpg="trail-walk"]')
   check(step+' is an available map action',route.count()==1 and route.is_visible());before=state()
   route.click();check(step+' map route closes menu and resumes focus',not page.locator('#rpg-window').evaluate('(e)=>e.open') and not ev('Realm.diagnostics.adventure.paused'))
   check(step+' route selection grants no work or reward',state()['realmTrails']==before['realmTrails'] and state()['journeys']==before['journeys'] and state()['sandbox']==before['sandbox'])
   advance();check(step+' route reaches actual interaction range',ev('step=>{const d=RealmTrails.definition("earthlands-coastward-materials-v1"),s=d.steps.find(s=>s.id===step);return RealmTrails.at(Realm.test.worldContext().sim,s)}',step))
   page.keyboard.press('e');render();page.locator('[data-rpg="trail-step"][data-id="'+step+'"]').click();render()
   check(step+' is recorded only by deliberate physical action',step in state()['realmTrails']['records']['earthlands-coastward-materials-v1']['steps'])
  render();before=state();journal()
  check('fresh Journal visibly explains empty accepted work',page.locator('.work-empty').is_visible() and 'speak to its work giver' in page.locator('.work-empty').inner_text())
  check('opening the Journal does not accept or grant',state()==before)
  check('earlier campaign remains below the new board',page.locator('.journal-layout').count()==1)
  all_roads();check('all five Roads cards declare their actual saved work status',page.locator('[data-road-work]').count()==5 and all('Trail not accepted' in t for t in page.locator('[data-road-work]').all_inner_texts()))
  walk(11,9);check('initial expedition kit earned through production command',ev("Realm.test.adventure('work-board-initial-kit','start')")['ok']);walk(18,6);enter_earth()
  d=ev('RealmTrails.definition("earthlands-coastward-materials-v1")');walk(d['giver']['x'],d['giver']['z']);page.keyboard.press('e');render()
  page.locator('[data-rpg="trail-accept"]').click();render()
  check('accepted but unfinished trail offers no premature claim',page.locator('[data-rpg="trail-claim"]').count()==0)
  survey_giver=ev('()=>{const d=RealmWorldFoundations.definition("earthlands");return d.points.find(p=>p.id===d.quest.giverId)}')
  walk(survey_giver['x'],survey_giver['z']);page.keyboard.press('e');render();page.locator('.world-surveys>summary').click();page.locator('[data-rpg="world-accept"]').click();render()
  check('routine first survey is separately accepted',state()['journeys']['realms']['earthlands']['active']['run']==1)
  check('unfinished survey also omits a premature turn-in control',page.locator('[data-rpg="world-claim"]').count()==0)
  journal();check('Journal distinguishes accepted trail from survey run',page.locator('[data-work-kind="trail"]').count()==1 and page.locator('[data-work-kind="survey"]').count()==1)
  check('accepted trail board has giver, exact material fee and eligible next work',all(t in page.locator('[data-work="'+d['id']+'"]').inner_text() for t in ['Vessa','6 wood','4 fiber','2 stone','Prepare the fallen coppice bough']) and 'Pack the three supplies' not in page.locator('[data-work="'+d['id']+'"]').inner_text())
  check('board exposes no accept, record, claim, fitting confirmation or crossing controls',page.locator('.accepted-work-board [data-rpg="trail-accept"],.accepted-work-board [data-rpg="trail-step"],.accepted-work-board [data-rpg="trail-claim"],.accepted-work-board [data-rpg="world-confirm"],.accepted-work-board [data-rpg="trail-fit-confirm"]').count()==0)
  page.screenshot(path=str(OUT/'accepted-work-desktop.png'))
  record_from_map('fallen-bough');return_home();save_reload();journal()
  check('partial trail remains visible at home after native reload','1/4 required actions' in page.locator('[data-work="'+d['id']+'"]').inner_text())
  check('off-realm Journal omits local-map shortcuts',page.locator('[data-work="'+d['id']+'"] [data-rpg="open"][data-id="atlas"]').count()==0)
  before=state();page.locator('[data-work="'+d['id']+'"] [data-rpg="world-select"]').click();render()
  check('reading saved work at home neither travels nor changes progress',ev('Realm.diagnostics.scene')=='valley' and state()==before)
  all_roads();check('Road card reports retained partial progress','1/4 required actions' in page.locator('[data-road-work="earthlands"]').inner_text())
  page.locator('[data-rpg="world-select"][data-id="earthlands"]').click();page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();render()
  for step in ['shore-reeds','shore-stone','road-pack']:record_from_map(step)
  journal();check('fully earned trail is visibly ready and unpaid',page.locator('[data-work="'+d['id']+'"]').get_attribute('data-work-status')=='ready' and 'Ready to return · unpaid' in page.locator('[data-work="'+d['id']+'"]').inner_text())
  check('all required actions can finish while survey objectives remain separate',state()['journeys']['realms']['earthlands']['active']['observed']==[] and not state()['realmTrails']['records'][d['id']]['claimed'])
  page.screenshot(path=str(OUT/'ready-unpaid-desktop.png'));return_home();save_reload();journal()
  check('unpaid completion survives native home reload',page.locator('[data-work="'+d['id']+'"]').get_attribute('data-work-status')=='ready')
  check('workshop remains locked before the deliberate trail claim','Claim any one trail to unlock' in page.locator('.workshop-status').inner_text())
  enter_earth();walk(d['giver']['x'],d['giver']['z']);page.keyboard.press('e');render();before=state()
  check('ready claim is offered at the actual work giver',page.locator('[data-rpg="trail-claim"]').count()==1)
  page.locator('[data-rpg="trail-claim"]').click();render();after=state()
  check('existing deliberate claim pays exact fee once',after['adventure']['coins']-before['adventure']['coins']==10 and all(after['sandbox']['inventory'][k]-before['sandbox']['inventory'][k]==n for k,n in d['reward']['materials'].items()))
  check('claim retains separate accepted survey and earlier loadout',after['journeys']==before['journeys'] and all(after['adventure'][k]==before['adventure'][k] for k in ['equipment','owned','arsenal','pursuit','starter','classPath']))
  journal();check('claimed trail moves into clearly labelled completed work',page.locator('.claimed-work>summary').is_visible() and page.locator('[data-work="'+d['id']+'"]').get_attribute('data-work-status')=='claimed')
  page.locator('.claimed-work>summary').click();check('claimed work displays once-only payment and no next actions',all(t in page.locator('[data-work="'+d['id']+'"]').inner_text() for t in ['Claimed once','no repeat payout','Declared fee, already claimed']) and 'Available next' not in page.locator('[data-work="'+d['id']+'"]').inner_text())
  check('workshop status declares unlocked fitting and current complete cost',all(t in page.locator('.workshop-status').inner_text() for t in ['unlocked','3 ore + 8 sunmarks','You have 0 ore and 10 sunmarks']))
  return_home();save_reload();journal();returning=state()
  page.locator('[data-rpg="open"][data-id="characters"]').click();page.locator('#chars-name').fill('Work board second character');page.keyboard.press('j')
  check('journal shortcut is consumed by character-name text field',page.locator('#chars-name').input_value().endswith('j') and page.locator('.chars-page').is_visible())
  page.locator('#chars-name').fill('Work board second character');page.locator('[data-rpg="chars-create"]').click();page.wait_for_function('()=>Realm.state.visitor.name==="Work board second character"');render();journal()
  check('new native character has its own empty work board',page.locator('[data-work]').count()==0 and state()['realmTrails']!=returning['realmTrails'])
  check('new character has no implicit class or soul choice',state()['adventure']['classPath']['choice'] is None and state()['adventure']['beacon']['soul']==returning['adventure']['beacon']['soul'])
  page.locator('[data-rpg="open"][data-id="characters"]').click();prior_id=page.locator('[data-rpg="chars-switch"]').get_attribute('data-id');page.locator('[data-rpg="chars-switch"]').click();page.wait_for_function('id=>Realm.diagnostics.characters.active===id',arg=prior_id);render();journal()
  check('switching back restores earned trail and original survey board',state()['realmTrails']==returning['realmTrails'] and state()['journeys']==returning['journeys'] and page.locator('[data-work-kind="survey"]').count()==1 and page.locator('[data-work-kind="trail"]').count()==1)
  projections=set()
  for i in range(2):
   close();prior=ev('Realm.diagnostics.camera.preset');page.keyboard.press('v');render();mode=ev('Realm.diagnostics.camera.preset');projections.add(ev('Realm.diagnostics.camera.projection'));journal()
   check(mode+' camera retains the same saved work through actual V shortcut',mode!=prior and page.locator('[data-work-kind="survey"]').count()==1 and state()['realmTrails']==returning['realmTrails'])
  check('both third-person and diorama projections were exercised',projections=={'perspective','orthographic'})
  page.set_viewport_size({'width':390,'height':844});render();journal();page.locator('.claimed-work>summary').click()
  check('compact Journal keeps accepted and completed work readable',page.locator('.accepted-work-board').is_visible() and page.locator('[data-work-kind="survey"]').is_visible() and page.locator('[data-work-kind="trail"]').is_visible())
  check('compact board has no horizontal overflow',page.locator('.accepted-work-board').evaluate('e=>e.scrollWidth<=e.clientWidth+1'))
  check('compact work navigation retains practical button targets',page.locator('.accepted-work-board [data-rpg="world-select"]').evaluate_all('els=>els.every(e=>e.getBoundingClientRect().height>=34)'))
  page.screenshot(path=str(OUT/'accepted-work-compact.png'))
  check('no runtime or browser errors',not report['browser_errors'] and not ev('Realm.diagnostics.errors'))
  report['status']='passed';report['command_earned_world']=state();context.close()
except Exception:
 report['status']='failed';report['errors'].append(traceback.format_exc());raise
finally:
 server.shutdown();server.server_close();(OUT/'REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
