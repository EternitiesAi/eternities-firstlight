"""Offline concept atlas in the real client: decoded assets, honest routes, no progression."""
from pathlib import Path
import hashlib,json,tempfile,traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence10/realm-atlas';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'checks':[],'errors':[],'browser_errors':[],'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
def check(name,value):
 report['checks'].append({'name':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
 if not value:raise AssertionError(name)
try:
 with tempfile.TemporaryDirectory(prefix='firstlight-atlas-') as profile,sync_playwright() as pw:
  ctx=pw.chromium.launch_persistent_context(profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
  page=ctx.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
  page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
  requests=[];page.on('request',lambda r:requests.append(r.url))
  response=page.goto((ROOT/'index.html').as_uri(),wait_until='load');page.wait_for_function('()=>!!window.Realm')
  check('identical standalone file-origin game loaded',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
  page.evaluate("()=>{Realm.test.quality('low');Realm.test.render()}")
  before=page.evaluate('()=>Realm.state');camera=page.evaluate('()=>Realm.diagnostics.camera.preset')
  page.locator('[data-rpg="open"][data-id="more"]').click();page.locator('[data-rpg="open"][data-id="realms"]').click()
  check('five readable realm choices',page.locator('.realm-choices button').count()==5)
  page.wait_for_function('()=>document.querySelector(".realm-board img").naturalWidth>0')
  check('embedded world raster decodes',page.locator('.realm-board img').evaluate('(e)=>e.complete&&e.naturalWidth>2000&&e.naturalHeight>700&&e.src.startsWith("data:image/webp;base64,")'))
  check('concept status is explicit','not gameplay footage' in page.locator('.realm-board figcaption').inner_text())
  for realm in ['earth','heaven','hell','atlantis','cosmos']:
   button=page.locator('[data-realm-art="'+realm+'"]');button.click()
   check(realm+' selection retains keyboard focus',button.evaluate('(e)=>e===document.activeElement'))
   text=page.locator('.realm-detail').inner_text()
   check(realm+' declares actual availability',('Playable' in text) if realm in ['earth','cosmos'] else 'Future realm' in text)
   check(realm+' grants no progression',page.evaluate('()=>Realm.state.adventure')==before['adventure'])
   check(realm+' has only an existing travel invitation',page.locator('.realm-travel').count()==(1 if realm in ['earth','cosmos'] else 0))
  page.locator('[data-realm-art="earth"]').click();page.locator('[data-realm-art="study"]').click()
  page.wait_for_function('()=>document.querySelector(".realm-study img").naturalWidth>0')
  check('embedded material reference decodes',page.locator('.realm-study img').evaluate('(e)=>e.complete&&e.naturalWidth>1400&&e.naturalHeight>1000'))
  page.keyboard.press('v');check('menu consumes camera shortcut',page.evaluate('()=>Realm.diagnostics.camera.preset')==camera)
  page.screenshot(path=str(OUT/'ATLAS_DESKTOP.png'))
  page.set_viewport_size({'width':390,'height':844})
  check('compact page fits width',page.locator('#rpg-content').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'))
  check('compact realm buttons remain usable',all(page.locator('[data-realm-art="'+r+'"]').bounding_box()['width']>65 for r in ['earth','heaven','hell','atlantis','cosmos']))
  page.screenshot(path=str(OUT/'ATLAS_COMPACT.png'));page.set_viewport_size({'width':1280,'height':800})
  for realm,action in [('earth','earth-invitation'),('cosmos','cosmos-invitation')]:
   page.locator('[data-realm-art="'+realm+'"]').click();page.locator('[data-rpg="'+action+'"]').click()
   check(realm+' opens disclosed existing journey',page.locator('#rpg-content').inner_text().lower().find('checkpoint')>=0)
   check(realm+' invitation does not teleport',page.evaluate('()=>Realm.diagnostics.scene')=='valley')
   page.locator('[data-rpg="open"][data-id="realms"]').click()
  after=page.evaluate('()=>Realm.state')
  check('notes score furnishings inventory and story unchanged',all(after[k]==before[k] for k in ['notes','score','retreat','adventure','sandbox']))
  check('no external asset requests',all(u.startswith(('file:','data:','blob:')) for u in requests))
  check('no mojibake in rendered copy',not any(x in page.locator('.realm-atlas').inner_text() for x in ['\u00c2','\u00e2','\ufffd']))
  page.locator('#rpg-close').click();page.keyboard.press('v');page.evaluate('()=>Realm.test.render()')
  check('camera swap still works after atlas',page.evaluate('()=>Realm.diagnostics.camera.preset')!=camera)
  check('no unhandled errors',not report['browser_errors']);ctx.close()
except Exception as e:
 report['errors'].append(str(e));traceback.print_exc()
finally:
 (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"Realm atlas browser: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors: {len(report['errors'])}",flush=True)
if report['errors'] or report['browser_errors']:raise SystemExit(1)
