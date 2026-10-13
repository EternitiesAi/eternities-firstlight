"""One bounded ordinary-RAF engineering tour, not human or GPU qualification.
Imports a hash-bound command-earned character with the real Characters UI.
All movement is actual WASD input; no test/capture hook or game-state injection.
"""
from pathlib import Path
import hashlib, importlib.util, json, math, shutil, subprocess, sys, tempfile, threading, time, traceback
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
ARC=Path(__file__).resolve().parent
OUT=ARC/'NORMAL_UI02'
sys.path.insert(0,str(ROOT/'tools'))
import briar_outing_browser as N
from browser_support import launch_kwargs
from playwright.sync_api import sync_playwright

def main():
    gate=ARC/'REMOTE_SOURCE10_EXIT.json'
    cohort=ARC/'REMOTE_SOURCE10/briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json'
    native=N.read(ARC/'NATIVE_CONTEXT04/BRIAR_NATIVE_REPORT.json')
    admitted=N.cohort(cohort,N.sha(cohort),ROOT,'complete',gate)
    assert native['status']=='passed' and native['head']==admitted['head']
    assert not OUT.exists() and OUT.drive.lower()=='d:' and ARC==OUT.parent
    origin=admitted['rows'][N.EARLY[0]] if isinstance(admitted['rows'],dict) else None
    assert origin is not None
    fixture=origin['paths']['input']
    admission=N.admission()
    OUT.mkdir()
    report={'status':'running','method':__doc__,'head':admitted['head'],'sourceGateSha256':N.sha(gate),
            'cohortSha256':N.sha(cohort),'nativeReportSha256':N.sha(ARC/'NATIVE_CONTEXT04/BRIAR_NATIVE_REPORT.json'),
            'harnessSha256':N.sha(__file__),'htmlSha256':N.sha(ROOT/'index.html'),'inputSha256':N.sha(fixture),
            'admission':admission,'normalRAF':True,'humanPacing':False,'humanAcceptance':False,
            'gpuPerformanceCertified':False,'acceleratedTicks':0,'positionEdits':0,'actorPositionEdits':0,
            'inventoryGrants':0,'healthGrants':0,'plantedQuestFacts':0,'checks':[],'controls':[],
            'browserErrors':[],'externalRequests':[],'errors':[],'snapshots':[]}
    profile=Path(tempfile.mkdtemp(prefix='briar-normal-owned-',dir=OUT))
    report['ownedProfile']=str(profile)
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{server.server_port}/index.html'
    context=None;page=None;video=None;closed=False;start=time.monotonic()
    def check(label,ok,evidence=None):
        report['checks'].append({'name':label,'passed':bool(ok),'evidence':evidence})
        print(('PASS ' if ok else 'FAIL ')+label,flush=True)
        if not ok:raise AssertionError(label)
    def ev(js,arg=None):return page.evaluate(js,arg)
    def state():return ev('()=>Realm.state')
    def diag():return ev('()=>Realm.diagnostics')
    def guard():
        assert time.monotonic()-start<150,'bounded recording wall time'
        check('no test/capture hooks',ev('()=>!Realm.test&&!window.__ETERNITIES_TEST_MODE&&!window.__ETERNITIES_CAPTURE_MODE')) if not report.get('hooksChecked') else None
        report['hooksChecked']=True
    def close_panels():
        if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
        if page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):page.locator('#close-panel').click()
        page.locator('#world').focus()
    def panel(tab='companion'):
        close_panels();page.keyboard.press('c')
        page.locator('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]').click()
    def action(kind):
        panel();loc=page.locator('#rpg-content .briar-outing [data-rpg="briar"][data-id="'+kind+'"]')
        check('unique enabled '+kind,loc.count()==1 and loc.is_enabled())
        loc.click();report['controls'].append({'kind':'Companion button','action':kind});close_panels()
    def keys_toward(point):
        guard();d=diag();p=d['adventure']['player'];dx,dz=point['x']-p['x'],point['z']-p['z']
        distance=math.hypot(dx,dz)
        if distance<1.0:page.wait_for_timeout(200);return distance
        yaw=d['camera']['yaw'];lx=dx*math.cos(yaw)-dz*math.sin(yaw);lz=dx*math.sin(yaw)+dz*math.cos(yaw)
        keys=[]
        if abs(lx)/distance>.3:keys.append('d' if lx>0 else 'a')
        if abs(lz)/distance>.3:keys.append('s' if lz>0 else 'w')
        assert keys
        for key in keys:page.keyboard.down(key)
        try:page.wait_for_timeout(220)
        finally:
            for key in keys:page.keyboard.up(key)
        report['controls'].append({'kind':'actual WASD','keys':keys,'before':p,'target':point})
        return distance
    def accompany(phase):
        while True:
            guard();d=diag();view=d['briar']['view'];assert view is not None,'current owned outing'
            if view['phase']==phase:return
            fox=d['adventure']['companion'];keys_toward({'x':fox['x'],'z':fox['z']})
    def reach(point):
        while keys_toward(point)>1.1:pass
    def shot(label):
        page.screenshot(path=str(OUT/(label+'.png')))
        report['snapshots'].append({'label':label,'sha256':N.sha(OUT/(label+'.png')),'diagnostics':diag()})
    def camera(view):
        page.locator('#rpg-hud [data-rpg="camera"][data-id="'+view+'"]').click()
        page.wait_for_function('(v)=>Realm.diagnostics.camera.preset===v',arg=view)
        report['controls'].append({'kind':'visible camera control','camera':view})
        page.wait_for_timeout(700)
    try:
        with sync_playwright() as pw:
            # The final admission is after preparation and before this whole launch.
            report['launchAdmission']=N.admission()
            context=pw.chromium.launch_persistent_context(str(profile),**launch_kwargs('software'),
                viewport={'width':1280,'height':800},record_video_dir=str(OUT),record_video_size={'width':1280,'height':800})
            page=context.pages[0] if context.pages else context.new_page();video=page.video
            context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(url.rsplit('/',1)[0]+'/') else (report['externalRequests'].append(route.request.url),route.abort()))
            page.on('pageerror',lambda error:report['browserErrors'].append(str(error)))
            response=page.goto(url,wait_until='load',timeout=60000)
            page.wait_for_function('()=>!!window.Realm&&getComputedStyle(document.querySelector("#loading")).opacity==="0"')
            check('exact served HTML',hashlib.sha256(response.body()).hexdigest()==report['htmlSha256'])
            guard();report['renderer']=diag()['renderer'];report['browser']=ev('()=>navigator.userAgent')
            check('software WebGL2',diag()['mode']=='webgl2' and 'swiftshader' in report['renderer'].lower())
            panel('characters')
            with page.expect_file_chooser() as chooser:page.locator('[data-rpg="chars-import"]').click()
            chooser.value.set_files(str(fixture));page.locator('[data-rpg="chars-confirm-import"]').click()
            page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer===true')
            close_panels();page.locator('#settings').click();page.locator('#setting-timeFlow').uncheck();page.locator('#quality').select_option('low');page.locator('#close-panel').click()
            baseline=state();check('real earned input owners retained',N.stable(baseline)==N.stable(origin['worlds']['input']))
            ev('()=>{const e=document.createElement("div");e.textContent="ACTUAL GAMEPLAY · NORMAL TIME · SCRIPTED INPUT · SOFTWARE WEBGL";e.style="position:fixed;bottom:5px;right:8px;background:#173635e8;color:#fff;padding:5px;z-index:10000;font:10px sans-serif;pointer-events:none";document.body.append(e)}')
            camera('follow');reach({'x':2,'z':8});action('start');accompany('returning');shot('01_CARRY_DIOrama')
            camera('adventure');shot('02_CARRY_THIRD_PERSON');accompany('await-take');reach({'x':2,'z':8})
            check('Take context visible',page.locator('#context').is_visible() and 'take' in page.locator('#context').inner_text().lower())
            page.keyboard.press('e');page.wait_for_function('()=>Realm.state.briarMoments.revision===1')
            check('Take retained valley',diag()['scene']=='valley');action('rest');accompany('settled');reach({'x':-11,'z':-1.6})
            shot('03_REST_THIRD_PERSON');camera('follow');shot('04_REST_DIORAMA')
            page.locator('#context').click();page.wait_for_function('()=>Realm.state.briarMoments.revision===2')
            check('Remember did not enter house',diag()['scene']=='valley')
            check('both facts saved',state()['briarMoments']=={'version':1,'revision':2,'moments':N.FACTS})
            check('old economic/story owners preserved',N.stable(state())==N.stable(baseline))
            panel();shot('05_KEPT_MOMENTS');page.wait_for_timeout(900);close_panels()
            check('no browser errors or external requests',not report['browserErrors'] and not report['externalRequests'])
            N.cohort(cohort,admitted['reportSha256'],ROOT,'complete',gate)
            check('recording caller remained frozen',N.sha(__file__)==report['harnessSha256'])
            check('native proof remained frozen',N.sha(ARC/'NATIVE_CONTEXT04/BRIAR_NATIVE_REPORT.json')==report['nativeReportSha256'])
            N.write_new(OUT/'FINAL_WORLD.json',state());report['status']='passed'
            with page.expect_event('close'):page.close(run_before_unload=True)
            generated=Path(video.path()).resolve();assert generated.parent==OUT and generated.is_file()
            final=OUT/'BRIAR_NORMAL_UI.webm';assert not final.exists();generated.rename(final)
            report['video']={'path':str(final),'bytes':final.stat().st_size,'sha256':N.sha(final)}
            context.close();context=None;closed=True
    except Exception:
        report['status']='failed';report['errors'].append(traceback.format_exc());print(report['errors'][-1],flush=True)
        if page and not page.is_closed():
            try:shot('FAILURE');N.write_new(OUT/'FAILURE_WORLD.json',state())
            except Exception as error:report['errors'].append('Capture '+repr(error))
    finally:
        if context:
            try:context.close();closed=True
            except Exception as error:report['errors'].append('Unknown close '+repr(error))
        server.shutdown();server.server_close()
        report['closed']=closed;report['wallSeconds']=time.monotonic()-start
        if report['status']=='passed' and closed:
            assert profile.parent==OUT and profile.name.startswith('briar-normal-owned-')
            shutil.rmtree(profile);report['ownedProfileRetired']=True
        N.write_new(OUT/'REPORT.json',report)
    return 0 if report['status']=='passed' and closed else 1

if __name__=='__main__':sys.exit(main())
