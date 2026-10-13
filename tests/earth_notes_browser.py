"""Mara's field notes through production UI, isolated storage and command-earned sources.
Walking is accelerated for coverage. This does not measure human pacing or enjoyment.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs, browser_output

ROOT=Path(__file__).resolve().parents[1]
OUT=browser_output(ROOT/'evidence10/earth-notes-browser');OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'checks':[],'errors':[],'browser_errors':[],'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
    def log_message(self,*_args):pass
def check(name,value):
    report['checks'].append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
    if not value:raise AssertionError(name)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
  with tempfile.TemporaryDirectory(prefix='firstlight-notes-') as profile,sync_playwright() as pw:
    context=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
    page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
    page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
    response=page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='load');page.wait_for_function('()=>!!window.Realm')
    check('exact generated build loaded',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
    ev=lambda js,arg=None:page.evaluate(js,arg)
    state=lambda:ev('()=>Realm.state')
    def render():ev("()=>{Realm.test.quality('low');Realm.test.render()}")
    def close():
      if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
    def walk(x,z):
      close();r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.3}}',[x,z]);check(f'physical walk reaches {x},{z}',r.get('ok'))
    def click(action,id=None):
      page.locator(f'[data-rpg="notes-{action}"]'+(f'[data-id="{id}"]' if id else '')).click();render()
    def table():
      close()
      if ev('()=>Realm.diagnostics.scene')=='earth-hearthwater-approach':page.locator('#earth-home').click();render()
      if ev('()=>Realm.diagnostics.scene')=='valley':walk(9,-5.8);page.keyboard.press('e');render()
      check('observatory entered through its existing door',ev('()=>Realm.diagnostics.scene')=='observatory');walk(-2,0);page.keyboard.press('e');render()
    def enter():
      close()
      if ev('()=>Realm.diagnostics.scene')=='observatory':page.keyboard.press('Escape');render()
      walk(0,23);page.keyboard.press('e');render();page.locator('[data-rpg="earth-confirm"]').click();render()
    def reload():
      close();ev('()=>Realm.test.save()');before=state();page.reload();page.wait_for_function('()=>!!window.Realm');render();check('canonical reload retains observations and delivery entitlement',state()['adventure']['earthNotes']==before['adventure']['earthNotes'] and state()['adventure']['earthStory']==before['adventure']['earthStory'])
    for variant in ['fresh-blade-detour','fresh-bow-quarry','veteran-mill']:
      close();fixture=json.loads((ROOT/'docs/evidence/marks-beneath-the-rain'/f'{variant}_01_SOURCE.json').read_text(encoding='utf-8'));ev('(w)=>Realm.test.replace(w)',fixture);render();before=state();table();content=page.locator('#rpg-content').inner_text()
      check(variant+' invitation declares route, comparison and honest non-power reward',all(t in content for t in ['western track','lasting chart','No items, currency or XP','no materials','observatory']))
      check(variant+' reading does not accept or claim unpaid delivery',not state()['adventure']['earthNotes']['accepted'] and not state()['adventure']['earthStory']['claimed'])
      camera=ev('()=>Realm.diagnostics.camera.preset');page.keyboard.press('v');render();check('field-note dialog consumes camera shortcut',ev('()=>Realm.diagnostics.camera.preset')==camera)
      if variant=='fresh-blade-detour':page.screenshot(path=str(OUT/'INVITATION.png'))
      click('accept');check(variant+' accepts at field table',state()['adventure']['earthNotes']['accepted']);reload();enter()
      for i,(id,x,z) in enumerate([('orchard-stone',-13,-6),('bank-footing',-13,-16),('shelter-mark',-13,-21)]):
        close();page.locator('#tracked-open').click();render();click('walk',id);ev('()=>{for(let i=0;i<4500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}');check('notebook navigation follows real ground to '+id,ev('([x,z])=>Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.3',[x,z]));page.keyboard.press('e');render();click('observe',id);check('one accepted rubbing for '+id,id in state()['adventure']['earthNotes']['marks']);close();camera=ev('()=>Realm.diagnostics.camera.preset');page.keyboard.press('v');render();check('camera styles swap while keeping observation',camera!=ev('()=>Realm.diagnostics.camera.preset') and id in state()['adventure']['earthNotes']['marks'])
        if i==1 and variant=='fresh-blade-detour':
          page.locator('[data-rpg="camera"][data-id="follow"]').click();render();page.screenshot(path=str(OUT/'BANK_STONE_DIORAMA.png'));page.locator('[data-rpg="camera"][data-id="adventure"]').click();render();page.screenshot(path=str(OUT/'BANK_STONE_THIRD.png'))
        if i==0:reload();enter()
      reload();table();check('tracing is a readable diagram rather than an icon',page.locator('.notes-tracing svg').evaluate('(e)=>e.getBoundingClientRect().width>200 && e.getBoundingClientRect().height>150'));prior=state();click('compare');check('wrong tracing bearing leaves durable state untouched',state()==prior);check('incorrect alignment explains north-south axis','north–south axis' in page.locator('#toast').inner_text())
      if variant=='fresh-blade-detour':
        page.set_viewport_size({'width':390,'height':844});render();check('compact notebook has no horizontal overflow',page.locator('#rpg-content').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'));page.screenshot(path=str(OUT/'COMPACT_NOTEBOOK.png'));page.set_viewport_size({'width':1280,'height':800})
      turns=8 if variant=='fresh-bow-quarry' else 4
      for _ in range(turns):click('turn','right' if variant=='fresh-bow-quarry' else 'left')
      check('tracing rotates through actual controls to valid axis',page.locator('#notes-bearing').inner_text()==('180°' if variant=='fresh-bow-quarry' else '0°'))
      click('compare');check(variant+' comparison succeeds',state()['adventure']['earthNotes']['compared']);reload();table()
      interpretation='waterworks' if variant=='fresh-bow-quarry' else 'old-road';click('record',interpretation);after=state();check(variant+' explicit tentative interpretation persists',after['adventure']['earthNotes']['interpretation']==interpretation)
      check('response keeps hypothesis separate from established observation','hypothesis' in page.locator('#rpg-content').inner_text().lower() and 'purpose of the stones remains an open question' in page.locator('#rpg-content').inner_text())
      check(variant+' no payout, gear, XP or campaign changes',all(after['adventure'][k]==before['adventure'][k] for k in ['ore','coins','xp','equipment','owned','arsenal','pursuit','starter','classPath','earthStory','road','beacon','crossing','companion']))
      check(variant+' personal notebook, music, house and inventory preserved',all(after[k]==before[k] for k in ['notes','score','retreat']) and after['sandbox']['inventory']==before['sandbox']['inventory'])
      close();snapshot=state();result=ev('()=>Realm.test.adventure("new-request-no-repeat","earth-notes-record",{interpretation:"old-road"})');check('changed request cannot record twice',not result['ok'] and state()==snapshot);reload();table();check('completed chart can be reviewed after reload','A question worth keeping' in page.locator('#rpg-content').inner_text())
      if variant=='fresh-blade-detour':
        page.screenshot(path=str(OUT/'COMPARISON_COMPLETE.png'));close();ev('()=>Realm.test.view({yaw:1.3,elevation:.3,distance:8})');render();page.screenshot(path=str(OUT/'OBSERVATORY_CHART.png'))
    close();old=state();original=ev('()=>Realm.diagnostics.characters.active')
    def library():
      close();page.locator('[data-rpg="open"][data-id="more"]').first.click();page.locator('#rpg-content [data-rpg="open"][data-id="characters"]').click()
    library();page.locator('#chars-name').fill('Field-note witness');page.locator('#chars-create-submit').click();page.wait_for_function('(id)=>Realm.diagnostics.characters.active!==id',arg=original);render();check('new character inherits no notes or delivery',not state()['adventure']['earthNotes']['accepted'] and not state()['adventure']['earthStory']['arrived'])
    restored='character-1' if original=='legacy' else original;library();page.locator(f'[data-rpg="chars-switch"][data-id="{restored}"]').click();page.wait_for_function('(id)=>Realm.diagnostics.characters.active===id',arg=restored);render();check('original character retains its own chart',state()['adventure']['earthNotes']==old['adventure']['earthNotes'])
    check('no runtime errors',not report['browser_errors']);context.close()
except Exception as e:
  report['errors'].append(str(e));traceback.print_exc()
finally:
  server.shutdown();server.server_close();(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"Field-note browser checks: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors: {len(report['errors'])}",flush=True)
if report['errors'] or report['browser_errors']:raise SystemExit(1)
