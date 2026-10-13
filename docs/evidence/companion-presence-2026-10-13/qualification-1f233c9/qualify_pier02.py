"""Actual native controls, current earned import and one short ordinary-RAF clip.
Accelerated setup/first two cases are labelled. No direct state/pose/reward edits.
Only task-owned loopback server, D profile and browser/driver are created/closed.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys, json, threading, traceback, time
ROOT=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
ARC=Path(__file__).resolve().parent
OUT=ARC/'NATIVE02'
sys.path.insert(0,str(ROOT/'tools'))
import briar_outing_browser as N
from browser_support import launch_kwargs
from playwright.sync_api import sync_playwright

def main():
    gate=ARC/'REMOTE_SOURCE04_EXIT.json'
    cohort=ARC/'REMOTE_SOURCE04/briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json'
    accepted=N.cohort(cohort,N.sha(cohort),ROOT,'complete',gate)
    assert not OUT.exists()
    OUT.mkdir()
    report={'status':'running','head':accepted['head'],'htmlSha256':N.sha(ROOT/'index.html'),
      'callerSha256':N.sha(__file__),'checks':[],'errors':[],'browserErrors':[],'externalRequests':[],
      'admissions':[],'sourceGate':accepted['sourceGate'],'cohortSha256':accepted['reportSha256'],
      'method':__doc__,'performanceCertified':False,'humanAcceptance':False,
      'positionEdits':0,'actorPositionEdits':0,'inventoryGrants':0,'plantedQuestFacts':0}
    def check(name,ok,detail=None):
        report['checks'].append({'name':name,'passed':bool(ok),'detail':detail})
        print(('PASS ' if ok else 'FAIL ')+name,flush=True)
        if not ok:raise AssertionError(name+' '+repr(detail))
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT),**k)
        def log_message(self,*a):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_port}'
    profile=OUT/'task-owned-profile'
    pw=ctx=page=None
    def launch(normal=False):
        nonlocal pw,ctx,page
        assert ctx is None and pw is None
        pw=sync_playwright().start()
        report['admissions'].append(N.admission())
        opts=launch_kwargs('software')
        if normal:opts.update(record_video_dir=str(OUT/'video'),record_video_size={'width':1280,'height':800})
        ctx=pw.chromium.launch_persistent_context(str(profile),viewport={'width':1280,'height':800},**opts)
        ctx.add_init_script('window.__ETERNITIES_TEST_MODE=true;'+('' if normal else 'window.__ETERNITIES_CAPTURE_MODE=true;')+
          'window.__pierStartup=localStorage.getItem("eternities.realm10.characters.v1");')
        def route(r):
            if r.request.url.startswith(origin+'/'):r.continue_()
            else:report['externalRequests'].append(r.request.url);r.abort()
        ctx.route('**/*',route)
        page=ctx.pages[0] if ctx.pages else ctx.new_page()
        page.on('pageerror',lambda e:report['browserErrors'].append(str(e)))
        response=page.goto(origin+'/index.html',wait_until='load',timeout=60000)
        page.wait_for_function('()=>!!window.Realm&&getComputedStyle(document.querySelector("#loading")).opacity==="0"')
        check('served exact current HTML',N.sha(ROOT/'index.html')==__import__('hashlib').sha256(response.body()).hexdigest())
        check('actual software WebGL2',ev('()=>Realm.diagnostics.mode')=='webgl2' and any(x in (ev('()=>Realm.diagnostics.renderer') or '').lower() for x in ('swiftshader','software','llvmpipe')),ev('()=>Realm.diagnostics.renderer'))
        return page.video
    def close():
        nonlocal ctx,pw
        errors=[]
        try:
            if ctx is not None:ctx.close()
        except Exception as e:errors.append('owned context close: '+repr(e))
        finally:ctx=None
        try:
            if pw is not None:pw.stop()
        except Exception as e:errors.append('owned driver stop: '+repr(e))
        finally:pw=None
        if errors:
            report.setdefault('closureErrors',[]).extend(errors)
            raise RuntimeError('; '.join(errors))
    def ev(js,arg=None):return page.evaluate(js,arg)
    def state():return ev('()=>Realm.state')
    def fish():return ev('()=>Realm.diagnostics.fishing')
    def render():ev('()=>Realm.test.render()')
    def step(t=.2):ev('(t)=>{Realm.test.step(t);Realm.test.render();}',t)
    def click(s):
        q=page.locator(s);assert q.count()==1,s;q.click(timeout=15000)
    def walk(x,z):
        check('accepted supported walk',ev('([x,z])=>Realm.test.move(x,z)',[x,z]).get('ok'))
        for _ in range(400):
            step()
            p=state()['player']
            if __import__('math').hypot(p['x']-x,p['z']-z)<.12:step(1);return
        raise AssertionError('Player did not arrive')
    def open_choices():
        page.locator('#world').focus();page.keyboard.press('e')
        page.wait_for_function('()=>document.querySelector("#pier-fishing dialog").open')
    def cast():open_choices();click('[data-fish="cast"]');render();click('[data-fish="look"]');render()
    def snapshots(label):
        for _ in range(2):
            mode=state()['settings']['cameraMode'];click('[data-fish="look"]');render()
            page.screenshot(path=str(OUT/f'{label}_{mode}.png'))
            page.locator('#world').focus();page.keyboard.press('v');render()
    def land(normal=False):
        switches=0;start=time.monotonic()
        for _ in range(800):
            v=fish()
            if v['phase']=='caught':
                check('catch required multiple tension decisions',switches>=2,switches);return
            check_phase=v['phase']=='playing'
            if not check_phase:raise AssertionError('Unexpected fish phase '+repr(v))
            reel=True if v['tension']<.35 else False if v['tension']>.7 else v['reeling']
            if reel!=v['reeling']:click('[data-fish="primary"]');switches+=1
            if normal:page.wait_for_timeout(90)
            else:step()
            if time.monotonic()-start>65:raise AssertionError('Fishing exceeded bounded recording')
        raise AssertionError('Fish did not arrive')
    def preserved(a,b):
        check('economic story and creative owners unchanged',N.stable(a)==N.stable(b))
        check('shared moments unchanged',a['briarMoments']==b['briarMoments'])
        check('no fishing journal reward',a['journal']==b['journal'] and a['nextEvent']==b['nextEvent'])
    try:
        launch()
        click('#settings');page.locator('#quality').select_option('low');page.locator('#setting-timeFlow').uncheck();click('#close-panel');render()
        walk(0,27)
        check('fresh fishing requires no expedition or campaign',state()['adventure']['started'] is False)
        open_choices();before=state();click('[data-fish="rest"]');render()
        check('explicit original water rest still records once',state()['nextEvent']==before['nextEvent']+1 and fish() is None)
        before=state();cast();check('cast closes choices and opens live HUD',not page.locator('#pier-fishing dialog').evaluate('(e)=>e.open') and page.locator('.fish-hud').is_visible())
        check('old conflicting E context hidden',not page.locator('#context').is_visible())
        step(4);check('sustained bite available',fish()['phase']=='bite')
        p=state()['player'];page.locator('[data-fish="primary"]').focus();page.keyboard.press('Space');render()
        check('Space hooks native button without dodge',fish()['phase']=='playing' and state()['player']==p)
        hold=page.locator('[data-fish="hold"]');hold.focus();page.keyboard.down('Space');render();check('keyboard hold reels',fish()['reeling']);page.keyboard.up('Space');render();check('keyboard release eases',not fish()['reeling'])
        box=hold.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();render();check('pointer hold reels',fish()['reeling']);page.mouse.up();render();check('pointer release eases',not fish()['reeling'])
        click('#settings');render();frozen=fish();step(5);check('non-pausing settings cannot progress fish',fish()==frozen);click('#close-panel');render()
        snapshots('FRESH_FISHING');land();snapshots('FRESH_CAUGHT');preserved(before,state())
        click('[data-fish="primary"]');render();check('explicit release ends activity and restores context',fish() is None and page.locator('#context').is_visible())
        # Current whole-draft-derived Chapter IV bow; never personal state.
        row=accepted['rows']['earned-chapter-IV-blade-to-bow']
        page.keyboard.press('c');click('#rpg-tabs [data-rpg="open"][data-id="characters"]')
        with page.expect_file_chooser() as chooser:click('[data-rpg="chars-import"]')
        chooser.value.set_files(str(row['paths']['input']));click('[data-rpg="chars-confirm-import"]')
        page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer')
        click('#rpg-close');render();check('returning input preserves earned owners',N.stable(state())==N.stable(row['worlds']['input']))
        click('#settings');page.locator('#quality').select_option('low');page.locator('#setting-timeFlow').uncheck();click('#close-panel');walk(0,27)
        c=ev('()=>Realm.diagnostics.adventure.companion');p=state()['player'];check('actual peaceful companion remains outside player',__import__('math').hypot(c['x']-p['x'],c['z']-p['z'])>=1.05)
        before=state();cast();step(4);click('[data-fish="primary"]');land();snapshots('RETURNING_CAUGHT');preserved(before,state())
        click('[data-fish="primary"]');render()
        # A partial line is deliberately not save data.
        cast();step(1);check('partial before cold restart',fish()['phase']=='waiting')
        saved=ev('()=>Realm.test.save()');check('production save accepted',saved.get('ok') is True,saved)
        library=ev('()=>JSON.parse(localStorage.getItem("eternities.realm10.characters.v1"))')
        saved_world=next(s['world'] for s in library['slots'] if s['id']==library['active'])
        check('exact active world stored before close',saved_world==state())
        close()
        # Read only this task-created profile via next startup; no personal profile.
        video=launch(normal=True)
        startup=json.loads(ev('()=>window.__pierStartup'))
        check('cold startup contains exact saved world',next(s['world'] for s in startup['slots'] if s['id']==startup['active'])==saved_world)
        check('cold launch has no invented partial fish',fish() is None)
        check('earned story survives native restart',N.stable(state())==N.stable(before))
        recording_start=time.monotonic();cast();page.wait_for_function('()=>Realm.diagnostics.fishing?.phase==="bite"',timeout=20000)
        click('[data-fish="primary"]')
        page.locator('#world').focus();page.keyboard.press('p')
        page.wait_for_function('()=>document.querySelector("[data-fish=primary]").disabled')
        frozen=fish();page.wait_for_timeout(700);check('native P pauses ordinary fishing frames',fish()==frozen)
        page.keyboard.press('p');page.wait_for_function('()=>!document.querySelector("[data-fish=primary]").disabled')
        land(normal=True)
        page.screenshot(path=str(OUT/'NORMAL_CAUGHT.png'));page.locator('#world').focus();page.keyboard.press('v');page.wait_for_timeout(700)
        click('[data-fish="primary"]');page.wait_for_timeout(700)
        check('ordinary RAF explicit release',fish() is None)
        report['ordinaryRecording']={'secondsAfterReady':time.monotonic()-recording_start,'normalRAF':True,'setup':'current earned Chapter IV bow saved at pier; no accelerated ticks after cold launch','humanPlay':False}
        path=video.path()
        close()
        report['ordinaryRecording']['path']=str(path);report['ordinaryRecording']['bytes']=Path(path).stat().st_size
        check('no page errors or external requests',not report['browserErrors'] and not report['externalRequests'])
        check('source stayed exact',N.git(ROOT,'rev-parse','HEAD')==accepted['head'] and not N.git(ROOT,'status','--porcelain=v1','--untracked-files=all'))
        N.cohort(cohort,accepted['reportSha256'],ROOT,'complete',gate)
        check('native controller stayed exact',N.sha(__file__)==report['callerSha256'])
        report['status']='passed'
    except Exception:
        report['status']='failed';report['errors'].append(traceback.format_exc());print(report['errors'][-1],flush=True)
        if page is not None:
            try:page.screenshot(path=str(OUT/'FAILURE.png'))
            except Exception:pass
        raise
    finally:
        try:close();report['ownedBrowserDriverClosed']=not bool(report.get('closureErrors'))
        except Exception as e:report['closureError']=repr(e);report['status']='failed';report['ownedBrowserDriverClosed']=False
        server.shutdown();server.server_close();report['ownedServerClosed']=True
        N.write_new(OUT/'REPORT.json',report)

if __name__=='__main__':main()
