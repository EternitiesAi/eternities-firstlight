"""Visible optional class choice and real combat on isolated native HTTP storage.

Fresh worlds earn their kit through the production command. A separate labelled
command-earned bow world exercises Hunter. Accelerated ticks are engineering
checks, not measurements of human pacing or GPU performance.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs, browser_output

ROOT = Path(__file__).resolve().parents[1]
OUT = browser_output(ROOT / 'evidence10/classes-browser')
OUT.mkdir(parents=True, exist_ok=True)
report = {'method': __doc__, 'checks': [], 'errors': [], 'browser_errors': [],
          'html_sha256': hashlib.sha256((ROOT / 'index.html').read_bytes()).hexdigest()}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kw): super().__init__(*args, directory=str(ROOT), **kw)
    def log_message(self, *_args): pass
def check(name, value):
    report['checks'].append({'name': name, 'passed': bool(value)})
    print(('PASS ' if value else 'FAIL ') + name, flush=True)
    if not value: raise AssertionError(name)
server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'
context = None
try:
    with tempfile.TemporaryDirectory(prefix='firstlight-classes-') as profile, sync_playwright() as pw:
        context = pw.chromium.launch_persistent_context(profile, **chromium_launch_kwargs(), viewport={'width':1280,'height':800})
        page = context.new_page()
        page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
        page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
        response = page.goto(url, wait_until='load')
        page.wait_for_function('() => !!window.Realm')
        check('Browser loaded the exact generated build',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
        ev=lambda js,arg=None:page.evaluate(js,arg)
        state=lambda:ev('() => Realm.state')
        def render(): ev('() => Realm.test.render()')
        def close():
            if page.locator('#rpg-window').evaluate('(e) => e.open'): page.locator('#rpg-close').click()
            if page.locator('#drawer').evaluate('(e) => e.classList.contains("open")'): page.locator('#close-panel').click()
        def path_ui():
            close();page.keyboard.press('c');page.locator('#rpg-tabs [data-id="classes"]').click()
        serial=0
        def cmd(kind,payload=None):
            global serial
            serial+=1
            result=ev('(q) => Realm.test.adventure(q.id,q.kind,q.payload)',{'id':f'class-browser-{serial}','kind':kind,'payload':payload or {}})
            check('Accepted production command: '+kind,result.get('ok'))
            render();return result
        def walk(x,z):
            result=ev('([x,z]) => {const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<7000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();return {ok:Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.3}}',[x,z])
            # Realm.test.walk itself follows the accepted path in current test API.
            if not result.get('ok'):
                result=ev('([x,z]) => {for(let i=0;i<7000&&Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)>.3;i++)Realm.test.step(.05);Realm.test.render();return {ok:Math.hypot(Realm.diagnostics.adventure.player.x-x,Realm.diagnostics.adventure.player.z-z)<.3}}',[x,z])
            check(f'Walked actual route to {x},{z}',result.get('ok'))
        ev('() => {Realm.test.quality("low");Realm.test.render()}')
        check('Fresh character has no assigned class',state()['adventure']['classPath']['choice'] is None)
        path_ui()
        text=page.locator('#rpg-content').inner_text()
        check('Both identities, one-time choice and workshop route are visible',all(t in text for t in ['Hunter','Magician','once-per-character','Oren']))
        page.locator('[data-rpg="class-preview"][data-id="magician"]').click()
        check('No-kit character can compare but cannot confirm',page.locator('[data-rpg="class-confirm"]').is_disabled())
        close();walk(11,9);cmd('start')
        before=state()['adventure'];page.keyboard.press('e');render();check('Oren offers a direct optional class path',page.locator('.starter-path [data-id="classes"]').count()==1);page.locator('.starter-path [data-id="classes"]').click();text=page.locator('#rpg-content').inner_text()
        check('Choice screen shows exact initial blade spell and mark values',all(t in text for t in ['20 damage','+8 damage','15 stamina','25 stamina','8s','10s']))
        page.locator('[data-rpg="class-preview"][data-id="magician"]').click()
        check('Preview alone leaves identity and story unchosen',state()['adventure']['classPath']['choice'] is None)
        page.locator('[data-rpg="class-cancel"]').click()
        check('Cancelling retains unassigned state',state()['adventure']['classPath']['choice'] is None)
        page.locator('[data-rpg="class-preview"][data-id="magician"]').click()
        page.screenshot(path=str(OUT/'CLASS_CHOICE.png'))
        page.locator('[data-rpg="class-confirm"]').click();render()
        a=state()['adventure']
        check('Explicit confirmation chooses Magician',a['classPath']['choice']=='magician')
        check('Choice retains gear, XP, soul, companion and project history',all(a[k]==before[k] for k in ['owned','equipment','xp','beacon','companion','pursuit','starter','arsenal']))
        check('Chosen path offers the existing practice route and equipment guide',page.locator('[data-rpg="pursuit-route"][data-id="practice"]').count()==1 and page.locator('#rpg-content [data-rpg="open"][data-id="pursuit"]').count()==1)
        check('Chosen view names actual technique and has no second choice', 'Arcane flare' in page.locator('#rpg-content').inner_text() and page.locator('[data-rpg="class-confirm"]').count()==0)
        page.locator('[data-rpg="pursuit-route"][data-id="practice"]').click();ev('() => {for(let i=0;i<7000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}');check('Practice link walks to the real sign without teleporting',ev('() => Realm.diagnostics.scene')=='valley' and ev('() => Math.hypot(Realm.diagnostics.adventure.player.x-15,Realm.diagnostics.adventure.player.z-7)<.3'));page.keyboard.press('e');render();check('E enters riverbank after the practice walk',ev('() => Realm.diagnostics.scene')=='riverbank');path_ui();page.locator('[data-rpg="pursuit-route"][data-id="practice"]').click();ev('() => {for(let i=0;i<7000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}');check('Practice link inside the scene follows the actual route',ev('() => Math.hypot(Realm.diagnostics.adventure.player.x+5,Realm.diagnostics.adventure.player.z-11.5)<.3'));cmd('target-select',{'id':'river-practice'})
        check('New technique has its own visible X button',page.locator('#skill-class').is_visible() and 'X' in page.locator('#skill-class').inner_text())
        before=state()['adventure'];page.keyboard.press('x');render()
        check('X invokes actual spell damage on practice',ev('() => Realm.diagnostics.adventure.tactics.hits.at(-1)?.n')==20)
        check('Spell spends exact stamina and records cooldown',state()['adventure']['stamina']==before['stamina']-25 and state()['adventure']['classPath']['readyAt']>state()['adventure']['elapsed'])
        check('Cooldown disables visible technique button',page.locator('#skill-class').is_disabled())
        page.screenshot(path=str(OUT/'MAGICIAN_PRACTICE.png'))
        cooldown=state()['adventure']['classPath']['readyAt'];ev('() => Realm.test.save()');page.reload();page.wait_for_function('() => !!window.Realm');render()
        check('Native reload preserves class and paid cooldown',state()['adventure']['classPath']=={'version':1,'choice':'magician','readyAt':cooldown})
        old_mode=state()['settings']['cameraMode'];page.keyboard.press('v');render();check('Both camera styles remain switchable with chosen identity',state()['settings']['cameraMode']!=old_mode)
        path_ui();held=state()['adventure']['classPath'];page.keyboard.press('x');render()
        check('X inside class menu cannot fire a technique',state()['adventure']['classPath']==held)
        page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'CLASS_NARROW.png'))
        check('Class page stays within narrow viewport',ev('() => {const d=document.querySelector("#rpg-window"),c=document.querySelector("#rpg-content");return d.getBoundingClientRect().right<=innerWidth&&c.scrollWidth<=c.clientWidth+1}'))
        close();ev('() => Realm.test.openPanel("chronicle")');page.locator('#note-text').fill('a quiet x in my notebook');page.locator('#note-text').press('x');render()
        check('Typing X stays in notebook and does not use class stamina',state()['adventure']['classPath']==held)
        close();page.set_viewport_size({'width':1280,'height':800})
        page.locator('[data-rpg="open"][data-id="more"]').click();page.locator('#rpg-content [data-id="characters"]').click();page.locator('#chars-name').fill('Another life');page.locator('#chars-create-submit').click();page.wait_for_function('() => Realm.diagnostics.characters.active==="character-2"');render()
        check('New roster character stays unassigned',state()['adventure']['classPath']['choice'] is None)
        close();page.keyboard.press('c');page.locator('#rpg-tabs [data-id="characters"]').click();page.locator('[data-rpg="chars-switch"][data-id="character-1"]').click();page.wait_for_function('() => Realm.diagnostics.characters.active==="character-1"');render()
        check('Switching restores original Magician identity',state()['adventure']['classPath']['choice']=='magician')
        close();page.keyboard.press('c');render();check('Equipment identifies the chosen class independently of weapon', 'MAGICIAN' in page.locator('.character-name').inner_text());page.locator('#rpg-tabs [data-id="characters"]').click();check('Roster shows each saved life with its own class',page.locator('[data-slot="character-1"] .chars-path').inner_text()=='Magician' and page.locator('[data-slot="character-2"] .chars-path').inner_text()=='Unassigned path');page.screenshot(path=str(OUT/'CLASS_ROSTER.png'))
        context.close();context=None
        # Separate earned bow fixture: no browser-profile access or inventory grant.
        with tempfile.TemporaryDirectory(prefix='firstlight-hunter-') as hunter_profile:
            context=pw.chromium.launch_persistent_context(hunter_profile,**chromium_launch_kwargs(),viewport={'width':1280,'height':800})
            page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
            fixture=ROOT/'docs/evidence/classes/HUNTER_SOURCE.json'
            report['hunter_fixture']={'path':str(fixture.relative_to(ROOT)),'sha256':hashlib.sha256(fixture.read_bytes()).hexdigest()}
            seed=json.loads(fixture.read_text(encoding='utf8'))
            page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
            page.add_init_script('if(!localStorage.getItem("eternities.realm10.save.v9"))localStorage.setItem("eternities.realm10.save.v9",'+json.dumps(json.dumps(seed))+');')
            page.goto(url,wait_until='load');page.wait_for_function('() => !!window.Realm');ev('() => {Realm.test.quality("low");Realm.test.render()}')
            walk(11,9);path_ui();page.locator('[data-rpg="class-preview"][data-id="hunter"]').click();page.locator('[data-rpg="class-confirm"]').click();close()
            check('Earned bow character chooses Hunter without weapon substitution',state()['adventure']['classPath']['choice']=='hunter' and state()['adventure']['equipment']==seed['adventure']['equipment'])
            cmd('pursuit-start',{'after':seed['adventure']['pursuit']['claimed']});check('Active survey counts appear once with useful route guidance',page.locator('#quest-tracker').inner_text().count('0/2 threats')==1 and 'sign' in page.locator('#tracked-detail').inner_text());walk(15,7);cmd('starter-enter');check('Inside survey HUD keeps one objective tally and map guidance',page.locator('#quest-tracker').inner_text().count('0/2 threats')==1 and 'M shows' in page.locator('#tracked-detail').inner_text());walk(-5,6);cmd('target-select',{'id':'river-practice'});page.keyboard.press('x');render()
            check('Hunter mark appears before any new impact', 'Quarry marked' in page.locator('#combat-help').inner_text())
            cmd('attack',{'target':'river-practice'});ev('() => {Realm.test.step(.3);Realm.test.render()}')
            attack=ev('() => RealmAdventure.stats(Realm.state.adventure).attack');expected=attack+min(24,int(attack*.5+.5))
            check('Real travelling bow impact consumes mark with correct bonus',ev('() => Realm.diagnostics.adventure.tactics.hits.at(-1)?.n')==expected and 'Quarry marked' not in page.locator('#combat-help').inner_text())
            page.screenshot(path=str(OUT/'HUNTER_BOW.png'))
            page.set_viewport_size({'width':390,'height':844});render()
            check('Eight combat buttons stay within narrow screen',ev('() => [...document.querySelectorAll("#skillbar .skill")].filter(e=>!e.hidden).every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})'))
            check('No unhandled browser errors',not report['browser_errors'])
            context.close();context=None
        report['passed']=True
except Exception:
    report['passed']=False;report['errors'].append(traceback.format_exc())
    try: page.screenshot(path=str(OUT/'FAILURE.png'))
    except Exception: pass
    print(report['errors'][-1],flush=True)
finally:
    if context:
        try: context.close()
        except Exception: pass
    server.shutdown();server.server_close()
    (OUT/'CLASSES_BROWSER_REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('RESULT',len(report['checks']),report.get('passed'),flush=True)
if not report.get('passed'): raise SystemExit(1)
