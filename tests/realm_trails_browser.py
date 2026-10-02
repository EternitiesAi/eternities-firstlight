"""Real UI, command-earned southern outings and fitting in isolated software Chromium.
Movement/depth are accelerated production calls, not human pacing or a GPU benchmark.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/realm-trails-browser'
OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'checks':[],'browser_errors':[],'errors':[],
        'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
def check(name,ok):
 report['checks'].append({'name':name,'passed':bool(ok)})
 print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
earth_route=[[-7,97],[0,97],[0,92],[0,16],[-10,15],[-10,-12],[-25,-12],[-25,-11],[-25,-12],[-10,-12],[-10,-34],[1,-35],[14,-34],[14,-19],[28,-19],[28,-16],[30,-25],[28,-19],[14,-19],[14,15],[0,16],[0,92],[0,97],[-3,97],[-7,97]]
gallery_route=[[8,-.5,-19.5],[8,-1.05,-22],[8,-2.55,-28],[8,-2.7,-29.5],[8,-2.7,-32],[8,-2.7,-35],[8,-2.7,-32],[8,-2.7,-29.5],[8,-1.8,-29],[12,-1.8,-29],[12,-1.4,-38.4],[12,-1.4,-39.3]]
try:
 with tempfile.TemporaryDirectory(prefix='firstlight-trails-ui-') as profile,sync_playwright() as pw:
  context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
  page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
  response=page.goto(url,wait_until='load');page.wait_for_function('window.Realm')
  check('exact regenerated offline build',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
  ev=lambda js,arg=None:page.evaluate(js,arg)
  state=lambda:ev('Realm.state')
  def render():ev("()=>{Realm.test.quality('low');Realm.test.render()}")
  def close():
   if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
  def walk(x,z):
   close();r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<12000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.25,hp:Realm.state.adventure.hp}}',[x,z]);check(f'production walk {x},{z}',r.get('ok') and r.get('hp',0)>0)
  def open_local():
   close();page.locator('#tracked-open').click();render()
  def enter(realm):
   close();walk(18,6);page.keyboard.press('j');page.locator('[data-rpg="open"][data-id="worlds"]').click()
   if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
   page.locator('[data-rpg="world-select"][data-id="'+realm+'"]').click()
   page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();render()
  def act(step,choice=None):
   open_local();page.locator('[data-rpg="trail-step"][data-id="'+step+(':'+choice if choice else '')+'"]').click();render()
  render();walk(11,9);check('initial kit earned through production command',ev("Realm.test.adventure('trail-ui-kit','start')")['ok']);walk(18,6)
  enter('earthlands');d=ev('RealmTrails.definition("earthlands-coastward-materials-v1")');walk(d['giver']['x'],d['giver']['z']);open_local()
  text=page.locator('[data-trail="'+d['id']+'"]').inner_text()
  check('trail terms show exact materials, kit eligibility, danger and separate surveys',all(t in text for t in ['6 wood','4 fiber','2 stone','initial kit','Danger','surveys remain separate']))
  before=state();page.locator('[data-rpg="trail-accept"]').click();render()
  check('explicit UI acceptance changes no inventory and no older survey history',state()['realmTrails']['records'][d['id']]['accepted'] and state()['sandbox']==before['sandbox'] and state()['journeys']==before['journeys'])
  for x,z in earth_route:
   walk(x,z)
   step=next((s for s in d['steps'] if s['x']==x and s['z']==z and s['id'] not in state()['realmTrails']['records'][d['id']]['steps']),None)
   if step:act(step['id']);check('Earth UI records '+step['id'],step['id'] in state()['realmTrails']['records'][d['id']]['steps'])
  open_local();before=state();page.locator('[data-rpg="trail-claim"]').click();render();after=state()
  check('Earth explicit claim gives exact existing recipe materials',all(after['sandbox']['inventory'][k]-before['sandbox']['inventory'][k]==n for k,n in d['reward']['materials'].items()))
  check('materials quest retains loadout, sockets and old survey ledger',all(after['adventure'][k]==before['adventure'][k] for k in ['owned','equipment','arsenal','pursuit','starter']) and after['journeys']==before['journeys'])
  check('changed request cannot pay the same story twice',ev('(q)=>Realm.test.trailCommand("claim",{quest:q,request:"changed-ui-id"})',d['id']).get('duplicate'))
  page.screenshot(path=str(OUT/'coastward-claimed-ui.png'));close();ev('Realm.test.worldReturn()');walk(11,9)
  page.keyboard.press('k');page.locator('[data-rpg="craft"][data-id="trail_bow"]').click();render()
  check('declared supplies really craft existing bow through UI','trail_bow' in state()['adventure']['owned'])
  close();page.keyboard.press('c');page.locator('[data-rpg="item"][data-id="gear:trail_bow"]').click();page.locator('[data-rpg="equip"][data-id="trail_bow"]').click();render()
  check('earned bow is deliberately equipped and canonically ranged',state()['adventure']['equipment']['weapon']=='trail_bow' and ev('RealmArsenal.weapon(Realm.state.adventure).style')=='bow')
  close();enter('atlantis');d=ev('RealmTrails.definition("atlantis-bellglass-chart-v1")');walk(d['giver']['x'],d['giver']['z']);open_local();page.locator('[data-rpg="trail-accept"]').click();render();close()
  # Read the accepted wet job away from its realm, including a cold home reload.
  # The inspected realm owns depth text; the current room must not supply it.
  def inspect_accepted_chart():
   close();page.keyboard.press('j');page.locator('[data-rpg="open"][data-id="worlds"]').click()
   if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
   page.locator('[data-rpg="world-select"][data-id="atlantis"]').click();render()
   check('accepted Atlantis work remains readable outside its realm','Bellglass' in page.locator('[data-trail="'+d['id']+'"]').inner_text())
   check('off-realm reading has no physical grant controls',page.locator('[data-trail="'+d['id']+'"] [data-rpg="trail-step"]').count()==0)
  close();ev('Realm.test.worldReturn()');inspect_accepted_chart();close();ev('Realm.test.save()');page.reload(wait_until='load');page.wait_for_function('window.Realm');render();inspect_accepted_chart()
  check('accepted unpaid chart survives native home reload',state()['realmTrails']['records'][d['id']]['accepted'] and not state()['realmTrails']['records'][d['id']]['claimed'])
  enter('earthlands');inspect_accepted_chart();close();ev('Realm.test.worldReturn()');enter('atlantis')
  landing=ev('RealmWorldFoundations.definition("atlantis").points.find(p=>p.id==="tide-steps")');walk(landing['x'],landing['z']);page.keyboard.press('e');check('gallery invitation distinguishes dry survey from submerged chart work',all(t in page.locator('#rpg-window').inner_text() for t in ['routine visitor survey stays on dry civic ground','Bellglass chart trail uses two submerged depths and the air court']));page.locator('[data-rpg="world-dive"]').click();render()
  for target in gallery_route:
   close();r=ev('target=>{for(let i=0;i<2000;i++){const p=Realm.diagnostics.adventure.player,v=Realm.test.worldDiveStatus(),dx=target[0]-p.x,dz=target[2]-p.z,dy=target[1]-v.y;if(Math.hypot(dx,dz)<.015&&Math.abs(dy)<.015){Realm.test.render();return true;}const h=Math.hypot(dx,dz),dt=h>.005?Math.min(.05,h/2.6):Math.min(.05,Math.abs(dy)/2.6),step=dt*2.6;Realm.test.worldSwim(h>.005?dx:0,h>.005?dz:0,step?dy/step:0,dt);}return false}',target)
   check('actual swim reaches '+str(target),r)
   step=next((s for s in d['steps'] if [s['x'],s['y'],s['z']]==target and s['id'] not in state()['realmTrails']['records'][d['id']]['steps']),None)
   if step:
    open_local();check('wet trail omits impossible dry walking controls',page.locator('[data-trail="'+d['id']+'"] [data-rpg="trail-walk"]').count()==0)
    if step.get('choices'):
     before=state();page.locator('[data-rpg="trail-step"][data-id="depth-chart:one-flat-line"]').click();render();check('wrong chart leaves save and supplies unchanged',state()==before)
     check('actual air court is dry body medium',ev('Realm.test.worldDiveStatus().body')=='air')
     page.screenshot(path=str(OUT/'bellglass-chart-choice.png'))
    page.locator('[data-rpg="trail-step"][data-id="'+step['id']+(':'+step['correctChoice'] if step.get('correctChoice') else '')+'"]').click();render()
    check('physical depth action records '+step['id'],step['id'] in state()['realmTrails']['records'][d['id']]['steps'])
    close();page.keyboard.press('v');render();page.screenshot(path=str(OUT/(step['id']+'-diorama.png')));page.keyboard.press('v');render();page.screenshot(path=str(OUT/(step['id']+'-third.png')))
  close();check('actual far landing exits gallery',ev('Realm.test.worldDiveExit()')['ok']);walk(d['giver']['x'],d['giver']['z']);open_local();before=state();page.locator('[data-rpg="trail-claim"]').click();render();after=state()
  check('Atlantis pays exact fixed reward once without replacing earlier history',after['adventure']['ore']-before['adventure']['ore']==2 and after['adventure']['coins']-before['adventure']['coins']==12 and after['journeys']==before['journeys'])
  # Earn the remaining ore through the separate original dry visitor survey.
  opening=ev('RealmWorldFoundations.definition("atlantis")');giver=next(p for p in opening['points'] if p['id']==opening['quest']['giverId']);walk(giver['x'],giver['z']);open_local();page.locator('[data-rpg="world-accept"]').click();render();close()
  for o in opening['quest']['objectives']:
   p=next(p for p in opening['points'] if p['id']==o['pointId']);walk(p['x'],p['z']);open_local();page.locator('[data-rpg="world-observe"][data-id="'+o['id']+'"]').click();render()
  walk(giver['x'],giver['z']);open_local();page.locator('[data-rpg="world-claim"]').click();render();close();ev('Realm.test.worldReturn()');walk(11,9);page.keyboard.press('k');render()
  page.locator('[data-rpg="trail-fit-preview"][data-id="trail_bow"]').click();render();text=page.locator('.realm-fitting').inner_text()
  check('fitting inspection compares actual attack, reach, cooldown, stamina and complete cost',all(s in text for s in ['→','11 reach','0.75 s','6 stamina','3 ore','8 sunmarks']))
  page.screenshot(path=str(OUT/'earned-bow-fitting-preview.png'));before=state();attack=ev('RealmAdventure.stats(Realm.state.adventure).attack')
  page.locator('[data-rpg="trail-fit-confirm"][data-id="trail_bow"]').click();render();after=state()
  check('explicit fitting spends exactly complete cost and adds three attack',before['adventure']['ore']-after['adventure']['ore']==3 and before['adventure']['coins']-after['adventure']['coins']==8 and ev('RealmAdventure.stats(Realm.state.adventure).attack')==attack+3)
  check('fitting preserves bow identity, socket and prior work',all(before['adventure'][k]==after['adventure'][k] for k in ['equipment','owned','arsenal','pursuit','starter']))
  close();render();model=ev('Realm.test.traveler()')
  check('actual carried weapon model has new fitting material band',model['equipment']['realmFitting']==3 and any(p['weaponPart']=='realm-fitting' for p in model['parts']))
  page.keyboard.press('v');render();page.screenshot(path=str(OUT/'fitted-bow-diorama.png'));page.keyboard.press('v');render();page.screenshot(path=str(OUT/'fitted-bow-third.png'))
  check('second fitting with new request cannot spend again',not ev('Realm.test.realmFit("trail_blade")')['ok'])
  before=state();check('complete earned world saves',ev('Realm.test.save()')['ok']);page.reload(wait_until='load');page.wait_for_function('window.Realm');render();after=state()
  check('native-origin reload retains claimed stories, fitting and equipment',all(after[k]==before[k] for k in ['realmTrails','journeys','sandbox']) and all(after['adventure'][k]==before['adventure'][k] for k in ['realmCraft','equipment','owned','arsenal','pursuit','starter','coins','ore','xp']))
  page.set_viewport_size({'width':390,'height':844});page.keyboard.press('k');render();page.screenshot(path=str(OUT/'fitting-compact.png'))
  check('compact menu can still read completed fitting',page.locator('.realm-fitting').is_visible() and 'Ashwood trail bow' in page.locator('.realm-fitting').inner_text())
  check('no browser runtime errors',not report['browser_errors'] and not ev('Realm.diagnostics.errors'))
  report['status']='passed';report['command_earned_world']=state();context.close()
except Exception:
 report['status']='failed';report['errors'].append(traceback.format_exc());raise
finally:
 server.shutdown();server.server_close();(OUT/'REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
