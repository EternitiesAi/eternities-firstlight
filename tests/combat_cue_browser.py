"""Earned riverbank phases on actual UI; synthetic owner boundaries labelled separately.
Accelerated setup/tactics on isolated software WebGL are not human pacing or GPU proof.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, math, threading, traceback, subprocess
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidence10/combat-cue-browser'
OUT.mkdir(parents=True, exist_ok=True)
report = {'method': __doc__, 'html_sha256': hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(), 'checks': [], 'browser_errors': []}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
    def log_message(self, *_): pass
server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
def check(name, ok):
    report['checks'].append({'name': name, 'passed': bool(ok)})
    print(('PASS ' if ok else 'FAIL ') + name, flush=True)
    if not ok: raise AssertionError(name)
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(**chromium_launch_kwargs())
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
        page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
        response = page.goto(f'http://127.0.0.1:{server.server_port}/index.html', wait_until='load')
        page.wait_for_function('window.Realm')
        def ev(js, arg=None): return page.evaluate(js, arg)
        def render(): ev('Realm.test.quality("low");Realm.test.render()')
        def walk(x, z):
            r = ev('([x,z])=>Realm.test.move(x,z)', [x,z]); check(f'Accepted walk {x},{z}', r['ok'])
            ev('()=>{for(let i=0;i<7000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
            p = ev('Realm.diagnostics.adventure.player'); check(f'Reached {x},{z}', math.hypot(p['x']-x,p['z']-z)<.25)
        serial = 0
        def command(kind, payload=None):
            global serial
            serial += 1
            r = ev('([id,t,p])=>Realm.test.adventure(id,t,p)', [f'cue-ui-{serial}',kind,payload or {}])
            check('Accepted ' + kind, r['ok']); render()
        # Capture this isolated simulation via its existing UI owner; no production API added.
        ev('()=>{const p=RealmRPGUI.RPGUI.prototype,paint=p.targetCue;p.targetCue=function(){window.cueSim=this.sim;return paint.call(this)};Realm.test.render();p.targetCue=paint}')
        render(); check('Served build identity', hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
        walk(11,9); page.keyboard.press('e'); render(); check('Kit earned via E', ev('Realm.state.adventure.started'))
        page.keyboard.press('c'); page.locator('#rpg-tabs [data-id="pursuit"]').click()
        page.locator('[data-rpg="pursuit-start"]').click(); page.click('#rpg-close'); render()
        check('Survey accepted from visible field guide', ev('Realm.state.adventure.pursuit.active.id')=='riverbank-survey/1')
        walk(15,7); page.keyboard.press('e'); render(); walk(5,-3)
        command('target-select', {'id':'riverbank-survey/1:east'})
        check('Accepted close approach', ev('Realm.test.move(5,-4.5)')['ok'])
        ev("""()=>{for(let i=0;i<200;i++){const e=Realm.diagnostics.adventure.enemies.find(e=>e.id.endsWith(':east'));if(e.mode==='windup')break;Realm.test.step(.05);}Realm.test.render()}""")
        def phase(): return ev('({phase:document.querySelector("#target-cue").dataset.phase,title:document.querySelector("#target-cue-title").textContent,detail:document.querySelector("#target-cue-detail").textContent,state:document.querySelector("#target-state").textContent,hidden:document.querySelector("#target-cue").hidden})')
        original = ev('Realm.state'); check('Actual Reedback warning visible', phase()['phase']=='windup' and 'Marked strike' in phase()['title'])
        check('HP and player readiness retained', phase()['state'].startswith('56 / 56 · ') and 'Brace (3)' in phase()['detail'])
        timer = ev('Realm.diagnostics.adventure.enemies.find(e=>e.id.endsWith(":east")).timer')
        check('Countdown follows real positive timer', phase()['title'].endswith(f'{math.ceil(timer*10)/10:.1f}s'))
        page.screenshot(path=str(OUT/'01-earned-warning-third-person.png'))
        page.keyboard.press('v'); render(); check('Diorama retains live cue', ev('Realm.state.settings.cameraMode')=='follow' and phase()['phase']=='windup')
        page.screenshot(path=str(OUT/'02-earned-warning-diorama.png'))
        page.keyboard.press('p'); render(); check('Pause clears cue and retains Paused readiness', phase()['hidden'] and 'Paused' in phase()['state'])
        # test.step deliberately bypasses pause; exercise the real Simulation.tick instead.
        ev('cueSim.tick(1);Realm.test.render()'); check('Pause freezes actual enemy timer', ev('Realm.diagnostics.adventure.enemies.find(e=>e.id.endsWith(":east")).timer')==timer)
        page.keyboard.press('p'); render(); check('Resume restores same actual warning', phase()['phase']=='windup')
        page.keyboard.press('3'); render(); check('Accepted UI Brace gives honest active defense copy', 'Braced' in phase()['detail'])
        ev("""()=>{for(let i=0;i<100;i++){if(Realm.diagnostics.adventure.enemies.find(e=>e.id.endsWith(':east')).mode==='recover')break;Realm.test.step(.05);}Realm.test.render()}""")
        check('Actual recovery opening visible', phase()['phase']=='recover' and 'Recovery opening' in phase()['title'] and 'if ready' in phase()['detail'])
        check('Warning/recovery projection does not award or equip', ev('Realm.state.adventure.pursuit')==original['adventure']['pursuit'] and ev('Realm.state.adventure.equipment')==original['adventure']['equipment'])
        page.screenshot(path=str(OUT/'03-earned-opening-diorama.png'))
        command('target-clear'); check('Cleared selection removes stale cue', phase()['hidden'] and not phase()['title'])
        # Synthetic transient owner states test shared presentation, not campaign completion.
        report['synthetic_owner_boundaries'] = True
        ev("""()=>{const s=cueSim,r=RealmAdventure.runtime(s);window.cueEnemy=r.enemies.find(e=>e.id.endsWith(':east'));RealmCombat.runtime(s).target=cueEnemy.id;cueEnemy.mode='windup';cueEnemy.timer=1.2;cueEnemy.aim={x:cueEnemy.x,z:cueEnemy.z};s.state.adventure.stamina=0;RealmCombat.runtime(s).guardUntil=0;} """)
        for kind, fields, title, detail in [
            ('bellwarden', {'custom':'bell','ringMode':'outer'}, 'Wide ring', 'quiet center'),
            ('bellwarden', {'custom':'bell','ringMode':'inner'}, 'Inner strike', 'out of the circle'),
            ('siegeboss', {'custom':None,'eventEnemy':True,'aimWard':True}, 'Beacon strike', 'targets the ward'),
            ('charger', {'eventEnemy':False,'mode':'charge','chargeLeft':3}, 'Charging', 'Brace unavailable')
        ]:
            ev('([kind,fields])=>Object.assign(cueEnemy,{kind},fields)', [kind,fields]); render()
            check('Synthetic owner copy '+title, title in phase()['title'] and detail in phase()['detail'])
            check('Owner cue retains actual HP/readiness '+title, '56 / 56 · ' in phase()['state'])
        check('Live charge does not invent countdown', 's' not in phase()['title'])
        ev("Object.assign(cueEnemy,{kind:'skitter',custom:null,mode:'windup',timer:.001,chargeLeft:0});Realm.test.render()")
        check('Positive last fraction never shows zero deadline', phase()['title'].endswith('0.1s'))
        page.set_viewport_size({'width':390,'height':844}); render()
        box = page.locator('#target-frame').bounding_box(); cb = page.locator('#target-cue').bounding_box()
        check('Compact target panel stays inside screen', box['x']>=0 and box['x']+box['width']<=390 and cb['x']+cb['width']<=390)
        check('Compact cue has no text overflow', ev('(()=>{const e=document.querySelector("#target-cue");return e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight})()'))
        page.screenshot(path=str(OUT/'04-synthetic-compact-warning.png'))
        # Force only ward-panel visibility for a labelled responsive-layout boundary.
        # This does not accept a defense or mutate campaign progression.
        for width in [390,820]:
            page.set_viewport_size({'width':width,'height':844});render()
            page.locator('#beacon-tracker').evaluate('(e)=>{e.hidden=false;e.querySelector("#beacon-phase").textContent="Breach 3 / 3"}')
            page.wait_for_timeout(150)
            target=page.locator('#target-frame').bounding_box();ward=page.locator('#beacon-tracker').bounding_box()
            page.screenshot(path=str(OUT/f'ward-layout-{width}.png'))
            check(f'Synthetic visible ward clears target at {width}',target['y']+target['height']+8<=ward['y'])
        ev('cueSim.state.settings.reducedMotion=true;Realm.test.render()')
        check('Reduced motion retains static legible cue', phase()['phase']=='windup' and ev('getComputedStyle(document.querySelector("#target-cue")).animationName')=='none')
        ev('cueSim.state.adventure.hp=0;Realm.test.render()'); check('Death removes cue immediately', phase()['hidden'])
        # Legitimately earned ranged/veteran sources, without granting their equipment here.
        page.set_viewport_size({'width':1440,'height':900})
        for variant, flag in [('fresh-bow','--bow'),('veteran','--veteran')]:
            subprocess.run(['node','tests/pursuit_journey.cjs',flag],cwd=ROOT,check=True,capture_output=True)
            source=ROOT/f'evidence10/pursuit/{variant}/run1_01_STARTED.json'
            fixture=json.loads(source.read_text(encoding='utf-8'))
            report.setdefault('earned_sources',[]).append({'variant':variant,'path':str(source.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
            ev('(s)=>Realm.test.replace(s)',fixture);render();walk(15,7);page.keyboard.press('e');render();walk(5,-3)
            command('target-select',{'id':'riverbank-survey/1:east'})
            check(variant+' accepted close approach',ev('Realm.test.move(5,-4.5)')['ok'])
            ev("""()=>{for(let i=0;i<200;i++){if(Realm.diagnostics.adventure.enemies.find(e=>e.id.endsWith(':east')).mode==='windup')break;Realm.test.step(.05);}Realm.test.render()}""")
            check(variant+' actual warning with original equipped family',phase()['phase']=='windup' and ev('Realm.state.adventure.equipment.weapon')==fixture['adventure']['equipment']['weapon'])
            page.keyboard.press('3');render()
            ev("""()=>{for(let i=0;i<100;i++){if(Realm.diagnostics.adventure.enemies.find(e=>e.id.endsWith(':east')).mode==='recover')break;Realm.test.step(.05);}Realm.test.render()}""")
            hp=ev('Realm.diagnostics.adventure.enemies.find(e=>e.id.endsWith(":east")).hp')
            check(variant+' actual opening keeps HP and readiness',phase()['phase']=='recover' and phase()['state'].startswith(f'{math.ceil(hp)} / 56 · '))
            check(variant+' owns no extra reward from viewing phases',ev('Realm.state.adventure.pursuit')==fixture['adventure']['pursuit'])
            page.screenshot(path=str(OUT/f'05-earned-{variant}-opening.png'))
            command('target-clear');check(variant+' leaves no stale opening',phase()['hidden'])
        check('No browser errors', not report['browser_errors'])
        report['status']='passed'; browser.close()
except Exception:
    report['status']='failed'; report['traceback']=traceback.format_exc(); raise
finally:
    server.shutdown(); (OUT/'REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
