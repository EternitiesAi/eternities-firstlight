"""Production camera/UI checks on an isolated origin. Synthetic saves, real input.
Normal RAF is used for WASD and orbit; command walking is accelerated explicitly.
Software WebGL coverage is not a human comfort or GPU performance claim.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, math, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'evidence10/camera-browser';OUT.mkdir(parents=True,exist_ok=True)
report={'method':__doc__,'html_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(),'checks':[],'browser_errors':[]}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*_):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
def check(name,ok):
    report['checks'].append({'name':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    if not ok:raise AssertionError(name)
def same_framing(left,right,keys):
    # Equivalent whole-turn yaw values describe the same visible orientation.
    return all(abs((left[k]-right[k]+math.pi)%(2*math.pi)-math.pi)<.001 if k=='yaw' else math.isclose(left[k],right[k],abs_tol=.001) for k in keys)
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(**chromium_launch_kwargs());context=browser.new_context(viewport={'width':1280,'height':800})
        context.add_init_script('window.__ETERNITIES_TEST_MODE=true;');page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='load')
        page.evaluate('Realm.test.quality("low");Realm.test.pause(true);Realm.test.render()');page.wait_for_timeout(1400)
        def ev(code,arg=None):return page.evaluate(code,arg)
        def diag():return ev('Realm.diagnostics')
        def render():ev('Realm.test.render()')
        def view(**kw):ev('(v)=>Realm.test.view(v)',kw);render()
        def real_walk(axis):
            # Real keyboard + normal RAF: slow software renderers may not draw a
            # movement frame during a fixed wall-clock hold. Wait for displacement.
            origin=diag()['adventure']['player'];ev('Realm.test.pause(false)');page.keyboard.down('w')
            try:
                observed=ev('''([axis,origin])=>new Promise(resolve=>{
                    const begun=performance.now();let frames=0;
                    function poll(){frames++;const player=Realm.diagnostics.adventure.player;
                        const reached=Math.abs(player[axis]-origin)>=.3,elapsed_ms=performance.now()-begun;
                        if(reached||elapsed_ms>30000)resolve({player,frames,elapsed_ms,reached});
                        else requestAnimationFrame(poll);}
                    requestAnimationFrame(poll);})''',[axis,origin[axis]])
                report.setdefault('physical_walks',[]).append({'axis':axis,'origin':origin,**observed})
                if not observed['reached']:raise AssertionError(f'No real keyboard movement before timeout: {observed}')
            finally:
                page.keyboard.up('w');ev('Realm.test.pause(true)')
            return diag()['adventure']['player']
        def walk(x,z):
            check(f'Accepted route {x},{z}',ev('([x,z])=>Realm.test.move(x,z)',[x,z])['ok'])
            ev('()=>{for(let i=0;i<6000&&Realm.test.path.length;i++)Realm.test.step(.05);Realm.test.step(.05);Realm.test.pause(true);Realm.test.render()}')
        check('Fresh world defaults to true perspective',diag()['camera']['projection']=='perspective' and diag()['camera']['preset']=='adventure')
        check('Four visible camera choices',page.locator('.camera-presets button').count()==4)
        def check_camera_selection(label):
            mode=diag()['camera']['preset']
            controls=page.locator('.camera-presets [data-rpg="camera"]').evaluate_all('(els)=>els.map(el=>({id:el.dataset.id,pressed:el.getAttribute("aria-pressed"),hover:el.matches(":hover"),focus:el===document.activeElement}))')
            report.setdefault('camera_control_readings',[]).append({'label':label,'actual':mode,'controls':controls})
            check(label+' selected camera button follows actual view even with retained hover/focus',[c['id'] for c in controls if c['pressed']=='true']==[mode])
        check_camera_selection('Fresh view')
        before=diag()['adventure']['player'];yaw=diag()['camera']['yaw']
        page.mouse.move(800,380);page.mouse.down(button='right');page.mouse.move(925,395,steps=8);page.mouse.up(button='right');render()
        check('Right drag orbits without issuing movement',abs(diag()['camera']['yaw']-yaw)>.4 and not ev('Realm.test.path.length') and before==diag()['adventure']['player'])
        distance=diag()['camera']['distance'];page.mouse.wheel(0,450);render();check('Wheel changes distance without FOV pumping',diag()['camera']['distance']>distance and diag()['camera']['fov']==60)
        adventure_view=diag()['camera']
        page.locator('[data-rpg="camera"][data-id="follow"]').click();render()
        page.mouse.move(800,380);page.mouse.down(button='right');page.mouse.move(860,405,steps=2);page.mouse.up(button='right');page.mouse.wheel(0,-100);render();diorama_view=diag()['camera']
        page.keyboard.press('v');render()
        report['first_view_switch']={'adventure_before':adventure_view,'after':diag()['camera'],'profiles':ev('Realm.state.settings.cameraViews')}
        check('V switches diorama to the remembered third-person framing',diag()['camera']['preset']=='adventure' and same_framing(diag()['camera'],adventure_view,['yaw','elevation','distance']))
        check_camera_selection('V to third person')
        page.keyboard.press('v');render()
        check('V restores the diorama orbit and zoom',diag()['camera']['preset']=='follow' and same_framing(diag()['camera'],diorama_view,['yaw','elevation','half']))
        check_camera_selection('V to diorama')
        page.reload(wait_until='load');ev('Realm.test.pause(true);Realm.test.render()')
        check('Diorama framing survives an actual save reload',diag()['camera']['preset']=='follow' and same_framing(diag()['camera'],diorama_view,['yaw','elevation','half']))
        check_camera_selection('Native reloaded diorama')
        ev('Realm.test.openPanel("settings")');check('Diorama settings explain that FOV belongs to third person',page.locator('#camera-fov').is_disabled())
        held=diag()['camera'];page.locator('#close-panel').focus();page.keyboard.press('v');page.keyboard.press('r');render()
        check('Camera shortcuts do not leak through a settings menu',all(diag()['camera'][k]==held[k] for k in ['preset','yaw','elevation','half']));page.click('#close-panel')
        ev('Realm.test.openPanel("chronicle")');held=diag()['camera'];page.locator('#note-text').focus();page.keyboard.type('vr');render()
        check('Typing camera shortcut letters stays in the real notebook field',page.locator('#note-text').input_value()=='vr' and same_framing(diag()['camera'],held,['yaw','elevation','half']) and diag()['camera']['preset']==held['preset']);page.click('#close-panel')
        page.keyboard.press('r');render();check('R resets the current diorama without changing styles',diag()['camera']['preset']=='follow' and math.isclose(diag()['camera']['half'],17,abs_tol=.001))
        page.locator('[data-rpg="camera"][data-id="tactical"]').click();page.keyboard.press('v');page.keyboard.press('v');render()
        check('V remembers the selected tactical diorama variant',diag()['camera']['preset']=='tactical')
        page.keyboard.press('v');render()
        check('Third-person framing also survives reload and overhead reset',same_framing(diag()['camera'],adventure_view,['yaw','elevation','distance']))
        page.reload(wait_until='load');ev('Realm.test.pause(true);Realm.test.render()')
        check('Reloading directly into third person retains its orbit',same_framing(diag()['camera'],adventure_view,['yaw','elevation','distance']))
        view(yaw=0,elevation=.28,distance=7.5)
        after=real_walk('z')
        check('Real W input walks forward relative to the camera',after['z']<before['z']-.2 and abs(after['x']-before['x'])<.1)
        view(yaw=math.pi/2)
        side=real_walk('x')
        check('Orbit changes real WASD world direction',side['x']<after['x']-.2 and abs(side['z']-after['z'])<.1)
        view(yaw=0,elevation=.18);before=diag()['adventure']['player'];page.mouse.click(800,115);render()
        check('Sky click is ignored without an invalid path or error',not ev('Realm.test.path.length') and before==diag()['adventure']['player'] and not diag()['errors'])
        ev('Realm.test.openPanel("settings")');page.locator('#camera-fov').fill('78');page.locator('#camera-fov').dispatch_event('change');render()
        check('Visible FOV control changes production projection',diag()['camera']['fov']==78 and page.locator('#camera-fov-value').inner_text()=='78°')
        page.select_option('#camera-mode','tactical');check('Settings select retains overhead view',diag()['camera']['preset']=='tactical' and diag()['camera']['projection']=='orthographic')
        page.reload(wait_until='load');ev('Realm.test.pause(true);Realm.test.render()')
        check('Mode and FOV survive actual origin reload',diag()['camera']['preset']=='tactical' and ev('Realm.state.settings.cameraFov')==78)
        page.keyboard.press('r');render();check('R resets the selected tactical view without forcing third person',diag()['camera']['preset']=='tactical' and diag()['camera']['projection']=='orthographic')
        for mode in ['follow','wide','adventure']:
            page.locator(f'[data-rpg="camera"][data-id="{mode}"]').click();render();check(f'{mode} camera control works',diag()['camera']['preset']==mode)
        walk(-11,-1.6);view(yaw=math.pi,elevation=.12,distance=7.5)
        check('Actual house wall pulls the camera in before penetration',diag()['camera']['actualDistance']<2 and diag()['camera']['actualDistance']>=.45)
        # South faces the music room, another legitimate obstruction. West is clear.
        view(yaw=-math.pi/2,elevation=.28)
        check('Camera returns after the wall clears',diag()['camera']['actualDistance']>7)
        page.keyboard.press('e');render();check('House entry preserves perspective with a finite eye',diag()['scene']=='home' and diag()['camera']['projection']=='perspective' and all(math.isfinite(v) for v in diag()['camera']['eye']))
        page.screenshot(path=str(OUT/'HOME.png'));page.keyboard.press('e');render();check('House exit retains third person',diag()['scene']=='valley' and diag()['camera']['preset']=='adventure')
        page.locator('[data-rpg="camera"][data-id="follow"]').click();page.mouse.move(800,480);page.mouse.wheel(0,-160);render();outside=diag()['camera']
        page.keyboard.press('e');render();inside=diag()['camera']
        check('Diorama entry preserves orbit and respects the interior minimum zoom',diag()['scene']=='home' and inside['projection']=='orthographic' and same_framing(inside,outside,['yaw','elevation']) and math.isclose(inside['half'],6,abs_tol=.001))
        page.keyboard.press('e');render()
        check('Diorama exit restores the outdoor framing',diag()['scene']=='valley' and same_framing(diag()['camera'],outside,['yaw','elevation','half']));page.keyboard.press('v');render()
        ev('Realm.test.openPanel("settings")');page.check('#setting-reducedMotion');page.select_option('#camera-mode','adventure');page.click('#close-panel')
        walk(11,9);p=diag()['adventure']['player'];c=diag()['camera']['center'];check('Reduced motion removes camera follow interpolation',abs(c[0]-p['x'])<1e-8 and abs(c[2]-p['z'])<1e-8)
        ev('Realm.test.pause(false)');page.keyboard.press('e');render();check('Initial kit still obtained through visible interaction',ev('Realm.state.adventure.started'))
        page.keyboard.press('e');render();page.click('[data-rpg="starter-accept"]');page.click('#rpg-close');walk(15,7);ev('Realm.test.pause(false)');page.keyboard.press('e');render()
        check('Starter entry retains perspective and the saved FOV',diag()['scene']=='riverbank' and diag()['camera']['fov']==78)
        render();check('Third-person quest labels stay nearby and do not overlap',ev('''()=>{const labels=[...document.querySelectorAll('#starter-labels span')].map(e=>e.getBoundingClientRect());return labels.length<=3&&labels.every((a,i)=>labels.every((b,j)=>i===j||a.right<b.left||b.right<a.left||a.bottom<b.top||b.bottom<a.top));}'''))
        ev('Realm.test.openPanel("settings")');page.uncheck('#setting-labels');page.click('#close-panel');render();check('Quest label setting is respected',page.locator('#starter-labels span').count()==0)
        ev('Realm.test.openPanel("settings")');page.check('#setting-labels');page.click('#close-panel')
        walk(-7,3);view(yaw=0,elevation=.3,distance=7.5);ev('Realm.test.pause(false)');target=ev("Realm.diagnostics.adventure.enemies.find(e=>e.id==='river-skitter-west')")
        pt=ev('(e)=>Realm.project(e.x,2.4,e.z)',target);check('Projected enemy body is visible',pt['visible']);page.mouse.click(pt['x'],pt['y']);render()
        check('Clicking a visible body selects stationary autoattack',diag()['adventure']['tactics']['target']=='river-skitter-west' and diag()['adventure']['tactics']['auto'] and not ev('Realm.test.path.length'))
        ev('Realm.test.pause(true)');identity=ev('JSON.stringify({adventure:Realm.state.adventure,score:Realm.state.score,retreat:Realm.state.retreat,player:Realm.state.player})')
        page.keyboard.press('v');render()
        check('Switching to diorama preserves target and stationary attack intent',diag()['camera']['projection']=='orthographic' and diag()['adventure']['tactics']['target']=='river-skitter-west' and diag()['adventure']['tactics']['auto'] and not ev('Realm.test.path.length'))
        page.keyboard.press('v');render()
        check('Switching back leaves quest equipment and creative state unchanged',diag()['camera']['projection']=='perspective' and identity==ev('JSON.stringify({adventure:Realm.state.adventure,score:Realm.state.score,retreat:Realm.state.retreat,player:Realm.state.player})'));ev('Realm.test.pause(false)')
        ev('Realm.test.step(2);Realm.test.render()');enemy=next(e for e in diag()['adventure']['enemies'] if e['id']=='river-skitter-west')
        check('Combat still resolves through actual rules after selection',enemy['hp']<target['hp'])
        render();check('Perspective health indicators have bounded screen size',ev("[...document.querySelectorAll('.enemy-health')].every(e=>e.getBoundingClientRect().width<=58)"))
        page.keyboard.press('c');render();before=diag()['adventure']['player'];page.keyboard.press('w');page.keyboard.press('1');render()
        check('Modal equipment blocks walking and attacks',diag()['adventure']['player']==before and ev('Realm.diagnostics.adventure.paused'))
        held=diag()['camera'];page.keyboard.press('v');page.keyboard.press('r');render();check('Equipment dialogs also block camera shortcuts',same_framing(diag()['camera'],held,['yaw','elevation','distance']) and diag()['camera']['preset']==held['preset'])
        check('Rounded avatar renders in the equipment portrait',page.locator('#avatar-mount canvas').count()==1 and not diag()['errors']);page.click('#rpg-close')
        page.set_viewport_size({'width':390,'height':844});view(yaw=0,elevation=.28)
        check('Portrait aspect keeps a finite perspective camera',all(math.isfinite(v) for v in diag()['camera']['eye']) and diag()['camera']['projection']=='perspective')
        check('Camera choices stay inside the narrow viewport',page.locator('.camera-presets').evaluate('(e)=>e.getBoundingClientRect().right<=innerWidth'))
        page.screenshot(path=str(OUT/'NARROW.png'))
        check('No unhandled browser errors',not report['browser_errors'] and not diag()['errors']);report['passed']=True;report['browser']=browser.version;browser.close()
except Exception:
    report['passed']=False;report['failure']=traceback.format_exc();print(report['failure'],flush=True)
finally:
    server.shutdown();(OUT/'REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
raise SystemExit(0 if report['passed'] else 1)
