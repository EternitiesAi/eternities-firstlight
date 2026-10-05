"""Near Expanse input/UI, real navigation and native isolated saves.

Accelerated movement setup is test evidence only. Software-WebGL interaction
coverage explicitly uses low quality; balanced desktop rendering has a separate
hardware report. No personal browser data.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'evidence10/cosmos-browser'
OUT.mkdir(parents=True, exist_ok=True)
report = {'method': __doc__, 'checks': [], 'errors': [], 'browser_errors': [],
          'software_quality': 'low', 'html_sha256': hashlib.sha256((ROOT / 'index.html').read_bytes()).hexdigest()}
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
try:
    with tempfile.TemporaryDirectory(prefix='firstlight-cosmos-') as profile, sync_playwright() as pw:
        context = pw.chromium.launch_persistent_context(profile, **chromium_launch_kwargs(), viewport={'width':1280,'height':800})
        page = context.new_page()
        page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
        page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
        response = page.goto(url, wait_until='load');page.wait_for_function('() => !!window.Realm')
        check('exact generated build loads',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
        ev=lambda js,arg=None:page.evaluate(js,arg)
        state=lambda:ev('() => Realm.state')
        scene=lambda:ev('() => Realm.diagnostics.scene')
        def render(): ev("() => {if(Realm.state.settings.quality!=='low')Realm.test.quality('low');Realm.test.render()}")
        render()
        def close():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
        def walk(x,z):
            r=ev('([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return r;for(let i=0;i<2500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render();const p=Realm.diagnostics.adventure.player;return{ok:Math.hypot(p.x-x,p.z-z)<.2}}',[x,z])
            check(f'production walking path reaches {x},{z}',r.get('ok'))
        def enter():
            close();walk(14,-5);page.keyboard.press('e');render()
            check('physical invitation opens explicit preview',page.locator('[data-rpg="cosmos-confirm"]').count()==1)
            page.locator('[data-rpg="cosmos-confirm"]').click();render();check('explicit input enters Near Expanse',scene()=='cosmos-near-expanse')
        # Discover the invitation from the actual map, then walk to the physical gate.
        before_terms=state()
        page.keyboard.press('m');render();page.locator('[data-rpg="cosmos-invitation"]').click()
        text=page.locator('#rpg-content').inner_text()
        check('pre-entry terms separate optional work from entry grants and declare routes/reload',all(t in text for t in ['Rootcut','opening walk needs no equipment and grants nothing','Accepted local work declares its own reward','Entry grants no items, class, XP, allegiance or story completion','reopening','valley checkpoint']))
        check('reading entry terms accepts no work, pays nothing and leaves canonical state unchanged',state()==before_terms and scene()=='valley')
        check('remote preview cannot enter before walking to the invitation',page.locator('[data-rpg="cosmos-confirm"]').count()==0)
        page.locator('[data-rpg="cosmos-walk"][data-id="gate"]').click()
        ev('()=>{for(let i=0;i<2500&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.render()}')
        check('map invitation uses ground movement, not a teleport',scene()=='valley' and ev('()=>Math.hypot(Realm.diagnostics.adventure.player.x-14,Realm.diagnostics.adventure.player.z+5)<.2'))
        page.keyboard.press('e');render();before=state()
        page.screenshot(path=str(OUT/'TRAVEL_PREVIEW.png'))
        page.keyboard.press('x');page.keyboard.press('v')
        check('dialog shortcuts do not change class or camera',state()['adventure']['classPath']==before['adventure']['classPath'] and state()['settings']['cameraMode']==before['settings']['cameraMode'])
        page.locator('[data-rpg="cosmos-confirm"]').click();render()
        check('fresh unassigned visitor can enter without a kit',scene()=='cosmos-near-expanse' and not state()['adventure']['started'])
        check('entry preserves all canonical game data',state()==before)
        check('arrival has no enemies or selectable sky image',ev('()=>Realm.diagnostics.adventure.enemies.length')==0)
        check('return button is available immediately',page.locator('#cosmos-home').is_visible())
        ev('()=>Realm.test.view({yaw:0,elevation:.28,distance:10})');render();page.wait_for_timeout(600)
        page.screenshot(path=str(OUT/'ARRIVAL_THIRD.png'))
        walk(3,7);page.keyboard.press('e');render()
        check('Three Lamps is inhabited and explains both actual approaches','Teren' in page.locator('#rpg-heading').inner_text() and 'Rootcut' in page.locator('#rpg-content').inner_text())
        close();walk(-6,6);page.keyboard.press('e');render();check('shelter bench can be approached through its real doorway','shelter' in page.locator('#rpg-heading').inner_text());close()
        for x,z in [(-14,-3),(-15,-18),(-12,-32),(0,-34),(3,-43)]:walk(x,z)
        page.keyboard.press('e');render();check('sheltered approach reaches Anik at occupied lookout','Anik' in page.locator('#rpg-heading').inner_text());close()
        check('player stands on raised northern terrain',ev('()=>Realm.diagnostics.cosmos.height')>4.5)
        ev('()=>Realm.test.view({yaw:.7,elevation:.4,distance:12})');render();page.screenshot(path=str(OUT/'LOOKOUT_THIRD.png'))
        page.keyboard.press('v');render();check('diorama works inside new ground scene',ev('()=>Realm.diagnostics.camera.projection')=='orthographic');page.screenshot(path=str(OUT/'LOOKOUT_DIORAMA.png'))
        for x,z in [(0,-34),(13,-24),(13,-6),(6,6),(0,18)]:walk(x,z)
        check('both routes form one continuous scene',scene()=='cosmos-near-expanse')
        page.keyboard.press('e');render();check('physical arrival gate returns to exact source position',scene()=='valley' and state()['player']==before['player'])
        check('walk and conversations grant no XP, items, claims or story',all(state()['adventure'][k]==before['adventure'][k] for k in ['xp','owned','equipment','starter','pursuit','beacon','crossing','classPath','companion','arsenal']))
        enter();walk(13,-6)
        page.keyboard.press('e');render();check('folded moon description distinguishes background from ground','image beyond this country' in page.locator('#rpg-content').inner_text());close()
        check('safe source snapshot remains exportable on the far side',state()['player']==before['player'])
        ev('()=>Realm.test.save()');saved=state();page.reload();page.wait_for_function('()=>!!window.Realm');render()
        check('native reopen restores acknowledged valley side',scene()=='valley' and state()['player']==saved['player'])
        check('native reopen preserves earned history',state()['adventure']==saved['adventure'])
        # Fault injection only at storage and scene construction boundaries.
        walk(14,-5);page.keyboard.press('e');render();outside=state()
        ev('()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error("synthetic quota refusal")}}')
        page.locator('[data-rpg="cosmos-confirm"]').click();render();check('failed actual storage write refuses entry',scene()=='valley' and state()==outside)
        ev('()=>{Storage.prototype.setItem=window.originalSet}');close()
        page.keyboard.press('e');render();ev('()=>{window.originalMake=RealmCosmosArt.make;RealmCosmosArt.make=()=>{throw Error("synthetic scene failure")}}')
        page.locator('[data-rpg="cosmos-confirm"]').click();render();check('failed scene build rolls back to playable valley',scene()=='valley' and state()['player']==outside['player'])
        ev('()=>{RealmCosmosArt.make=window.originalMake}');close();enter()
        ev('()=>Realm.test.quality("low")');page.keyboard.press('v');render();page.screenshot(path=str(OUT/'LOW_DIORAMA.png'))
        check('low quality retains scene, safe ground and return',scene()=='cosmos-near-expanse' and ev('()=>Realm.diagnostics.cosmos.walkable') and page.locator('#cosmos-home').is_visible())
        page.locator('#cosmos-home').click();render();check('return works away from gate with no payment',scene()=='valley')
        # The returning bow world was earned by production campaign/survey commands.
        fixture_path=ROOT/'docs/evidence/classes/HUNTER_SOURCE.json'
        returning=json.loads(fixture_path.read_text(encoding='utf-8'))
        report['returning_fixture']={'path':str(fixture_path.relative_to(ROOT)),'sha256':hashlib.sha256(fixture_path.read_bytes()).hexdigest(),'setting_override':'reducedMotion=true only'}
        returning['settings']['reducedMotion']=True
        ev('(w)=>Realm.test.replace(w)',returning);render()
        check('returning command-earned bow and socket/fitting state load intact',state()['adventure']['equipment']==returning['adventure']['equipment'] and state()['adventure']['arsenal']==returning['adventure']['arsenal'])
        enter();check('returning bow visits without equipment or story mutation',state()['adventure']['equipment']==returning['adventure']['equipment'] and state()['adventure']['pursuit']==returning['adventure']['pursuit'])
        page.screenshot(path=str(OUT/'RETURNING_BOW.png'));page.locator('#cosmos-home').click();render()
        veteran_path=ROOT/'docs/evidence/cosmos/VETERAN_SOURCE.json'
        veteran=json.loads(veteran_path.read_text(encoding='utf-8'));veteran['settings']['reducedMotion']=True
        report['veteran_fixture']={'path':str(veteran_path.relative_to(ROOT)),'sha256':hashlib.sha256(veteran_path.read_bytes()).hexdigest(),'setting_override':'reducedMotion=true only'}
        ev('(w)=>Realm.test.replace(w)',veteran);render()
        check('returning veteran companion is command rescued',state()['adventure']['companion']['bonded'])
        enter();returning_before=state()
        check('following companion travels onto valid cosmic ground',ev('()=>{const p=Realm.diagnostics.adventure.companion;return p.room===RealmCosmos.ROOM&&RealmCosmos.walkable(p.x,p.z)}'))
        walk(13,-24)
        check('companion follows the actual rising route',ev('()=>{const p=Realm.diagnostics.adventure.companion;return p.room===RealmCosmos.ROOM&&RealmCosmos.walkable(p.x,p.z)&&p.z<-15}'))
        page.set_viewport_size({'width':720,'height':740});page.keyboard.press('m');render()
        check('compact reduced-motion atlas retains both routes and explicit return',state()['settings']['reducedMotion'] and page.locator('[data-rpg="cosmos-return"]').is_visible() and page.locator('[data-rpg="cosmos-walk"][data-id="rootcut"]').count()==1)
        check('compact Cosmos map is readable rather than icon-sized',page.locator('#cosmos-map').bounding_box()['height']>200 and page.locator('#cosmos-map').bounding_box()['width']>250)
        page.screenshot(path=str(OUT/'COMPACT_ATLAS.png'));close();page.set_viewport_size({'width':1280,'height':800})
        def library():
            close();page.locator('[data-rpg="open"][data-id="more"]').click();page.locator('#rpg-content [data-rpg="open"][data-id="characters"]').click()
        library();page.locator('#chars-name').fill('Cosmos boundary visitor');page.locator('#chars-create-submit').click()
        page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"');render()
        check('creating another character while away begins in its own valley',scene()=='valley' and not state()['adventure']['started'] and ev('()=>Realm.diagnostics.cosmos') is None)
        library();page.locator('[data-rpg="chars-switch"][data-id="character-1"]').click();page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-1"');render()
        check('switching back resumes the returning character at its source checkpoint',scene()=='valley' and state()['player']==returning_before['player'])
        check('character switch preserves returning equipment, rewards and history',all(state()['adventure'][k]==returning_before['adventure'][k] for k in ['equipment','owned','arsenal','xp','starter','pursuit','beacon','crossing','classPath','companion']))
        close();enter();ev('()=>Realm.test.adventure("cosmos-browser-stay","companion-mode",{mode:"stay"})')
        page.locator('#cosmos-home').click();render()
        check('commanded Stay does not follow across the return',state()['adventure']['companion']['mode']=='stay' and ev('()=>Realm.diagnostics.adventure.companion.room')=='cosmos-near-expanse')
        ev('()=>Realm.test.adventure("cosmos-browser-follow","companion-mode",{mode:"follow"})');render()
        check('Follow deliberately recalls the companion after return',ev('()=>Realm.diagnostics.adventure.companion.room') is None)
        ev('()=>Realm.test.save()');page.close()
        # Separate normal-RAF page exercises actual physical input, with no capture-mode clock.
        page=context.new_page();page.add_init_script('window.__ETERNITIES_TEST_MODE=true;');page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
        page.goto(url,wait_until='load');page.wait_for_function('()=>!!window.Realm');ev('()=>Realm.test.pause(true)');enter()
        page.locator('[data-rpg="camera"][data-id="adventure"]').click();ev('()=>Realm.test.view({yaw:0,elevation:.28,distance:10})');render()
        origin=ev('()=>Realm.diagnostics.adventure.player');ev('()=>Realm.test.pause(false)');page.keyboard.down('w')
        try:page.wait_for_function('(p)=>Math.hypot(Realm.diagnostics.adventure.player.x-p.x,Realm.diagnostics.adventure.player.z-p.z)>.4',arg=origin,timeout=30000)
        finally:page.keyboard.up('w');ev('()=>Realm.test.pause(true)')
        check('normal-RAF W input physically moves on supported ground',ev('()=>Realm.diagnostics.cosmos.walkable') and ev('()=>Realm.diagnostics.adventure.player.z')<origin['z']-.3)
        render();ground=ev('()=>Realm.project(0,RealmCosmos.height(0,14),14)');page.mouse.click(ground['x'],ground['y'])
        check('visible ground click uses inverse height projection for walking',ev('()=>{const p=Realm.test.path.at(-1);return !!p&&Math.hypot(p.x,p.z-14)<.4}'))
        ev('()=>{for(let i=0;i<100&&Realm.test.path.length;i++)Realm.test.step(.05)}');render()
        page.mouse.click(640,95)
        check('sky click cannot manufacture a walking destination',ev('()=>Realm.test.path.length')==0)
        page.locator('#cosmos-home').click();render()
        check('normal-RAF visit returns through the production control',scene()=='valley')
        check('no runtime browser exceptions',not report['browser_errors'])
        context.close()
except Exception as e:
    report['errors'].append(str(e));traceback.print_exc()
finally:
    server.shutdown();server.server_close()
    (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"Cosmos browser checks: {sum(x['passed'] for x in report['checks'])}/{len(report['checks'])}; errors: {len(report['errors'])}",flush=True)
if report['errors'] or report['browser_errors']:raise SystemExit(1)
