"""Actual native controls, current earned import and one short ordinary-RAF clip.
Accelerated setup and all three initial cases are labelled. No direct state/pose/reward edits.
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
    gate=ARC/'REMOTE_SOURCE03_EXIT.json'
    cohort=ARC/'REMOTE_SOURCE03/briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json'
    accepted=N.cohort(cohort,N.sha(cohort),ROOT,'complete',gate)
    assert not N.git(ROOT,'status','--porcelain=v1','--untracked-files=all'),'Native requires current clean checkout'
    assert N.git(ROOT,'rev-parse','HEAD')==accepted['head']
    native_pins={str(Path(N.__file__).resolve()):N.sha(N.__file__),str(ROOT/'tools/browser_support.py'):N.sha(ROOT/'tools/browser_support.py')}
    assert not OUT.exists()
    OUT.mkdir()
    report={'status':'running','head':accepted['head'],'htmlSha256':N.sha(ROOT/'index.html'),
      'nativeModulePins':native_pins,'callerSha256':N.sha(__file__),'checks':[],'errors':[],'browserErrors':[],'externalRequests':[],
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
    normal_clock=False
    recording_start=None
    def launch(normal=False):
        nonlocal pw,ctx,page,normal_clock
        assert ctx is None and pw is None
        normal_clock=normal
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
    def render():
        if normal_clock:page.wait_for_timeout(40)
        else:ev('()=>Realm.test.render()')
    def step(t=.2):ev('(t)=>{Realm.test.step(t);Realm.test.render();}',t)
    def click(s):
        q=page.locator(s);q.wait_for(state="visible",timeout=15000);assert q.count()==1,s;q.click(timeout=15000)
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
    def cast():
        open_choices();before=state();click('[data-fish="cast"]');render()
        check('cast preserves physical facing and saved camera',state()['player']==before['player'] and state()['settings']==before['settings'])
        click('[data-fish="look"]');render()
    def snapshots(label):
        for _ in range(2):
            mode=state()['settings']['cameraMode'];click('[data-fish="look"]');render()
            page.screenshot(path=str(OUT/f'{label}_{mode}.png'))
            page.locator('#world').focus();page.keyboard.press('v');render()
    samples=[]
    def sample(normal=False):
        q=ev("""()=>{const t=Realm.test.traveler(),v=Realm.diagnostics.fishing;
        if(!v||!t?.frame.fishing)return null;
        const m=t.frame.root,w=p=>[0,1,2].map(i=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]);
        return {view:v,mode:Realm.state.settings.cameraMode,head:w(t.frame.joints.head),
         right:w(t.frame.joints.rightHand),left:w(t.frame.joints.leftHand),
         parts:t.parts.filter(p=>p.fishingPart).map(p=>({id:p.fishingPart,p:p.p,segment:p.segment,width:p.s[0]}))};}""")
        if q:q['normalRAF']=normal;q['recordingSeconds']=time.monotonic()-recording_start if normal and recording_start is not None else None;samples.append(q)
        return q
    def hand_checks(label):
        q=sample();check(label+' actual held frame',q is not None)
        import math
        by={p['id']:p for p in q['parts']}
        check(label+' grip follows resolved right hand',math.dist(q['right'],by['rod-grip']['p'])<.00001)
        check(label+' crank follows resolved left hand',math.dist(q['left'],by['reel-handle']['p'])<.00001)
        check(label+' no old rod holder', 'rod-holder' not in by)
        return q
    def land(normal=False):
        switches=0;view_changes=0;start=time.monotonic()
        for _ in range(800):
            v=fish()
            if normal:sample(normal=True)
            if v['phase']=='caught':
                check('catch required multiple tension decisions',switches>=2,switches);return
            check_phase=v['phase']=='playing'
            if not check_phase:raise AssertionError('Unexpected fish phase '+repr(v))
            if normal and not v['pulling'] and view_changes<2 and v['fightTime']>=(view_changes+1)*3:
                page.locator('#world').focus();page.keyboard.press('v');click('[data-fish="look"]');view_changes+=1
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
        click('#rpg-hud [data-rpg="open"][data-id="more"]');click('#rpg-content [data-rpg="panel"][data-id="explore"]');click('[data-action="place-action"][data-id="shore"]')
        page.wait_for_function('()=>document.querySelector("#pier-fishing dialog").open')
        check('Explore shore action opens explicit choices',fish() is None)
        before=state();click('[data-fish="rest"]');render()
        check('explicit original water rest still records once',state()['nextEvent']==before['nextEvent']+1 and fish() is None)
        before=state();cast();hand_checks('Fresh cast');check('cast closes choices and opens live HUD',not page.locator('#pier-fishing dialog').evaluate('(e)=>e.open') and page.locator('.fish-hud').is_visible())
        check('old conflicting E context hidden',not page.locator('#context').is_visible())
        for dt in [.15,.15,.25,.30]:step(dt);sample()
        step(4);check('sustained bite available',fish()['phase']=='bite')
        p=state()['player'];page.locator('[data-fish="primary"]').focus();page.keyboard.press('Space');render()
        check('Space hooks native button without dodge',fish()['phase']=='playing' and state()['player']==p)
        hold=page.locator('[data-fish="hold"]');hold.focus();page.keyboard.down('Space');render();check('keyboard hold reels',fish()['reeling']);page.keyboard.up('Space');render();check('keyboard release eases',not fish()['reeling'])
        box=hold.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();render();check('pointer hold reels',fish()['reeling']);page.mouse.up();render();check('pointer release eases',not fish()['reeling'])
        click('#settings');render();frozen=fish();step(5);check('non-pausing settings cannot progress fish',fish()==frozen);click('#close-panel');render()
        page.locator('#world').focus();page.keyboard.press('h');render();frozen=fish();step(4)
        check('photo mode suspends the hidden fishing controls',fish()==frozen and not page.locator('.fish-hud').is_visible())
        page.keyboard.press('e');check('global E cannot change a hidden fishing line',fish()==frozen)
        page.keyboard.press('Escape');render();check('Escape returns from photo without cancelling fish',not ev('()=>document.body.classList.contains("photo-mode")') and fish()==frozen)
        hand_checks('Fresh hooked');snapshots('FRESH_FISHING');land();snapshots('FRESH_CAUGHT');preserved(before,state())
        click('[data-fish="primary"]');render();check('explicit release ends activity and restores context',fish() is None and page.locator('#context').is_visible())
        # Command-earned starter blade through the same visible import owner.
        blade=accepted['rows']['early-rescued-blade']
        page.keyboard.press('c');click('#rpg-tabs [data-rpg="open"][data-id="characters"]')
        with page.expect_file_chooser() as chooser:click('[data-rpg="chars-import"]')
        chooser.value.set_files(str(blade['paths']['input']));click('[data-rpg="chars-confirm-import"]')
        page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer')
        if page.locator('#rpg-window').evaluate('(e)=>e.open'):click('#rpg-close')
        render();check('blade input preserves earned owners',N.stable(state())==N.stable(blade['worlds']['input']))
        click('#settings');page.locator('#quality').select_option('low');page.locator('#setting-timeFlow').uncheck();click('#close-panel');walk(0,27)
        before=state();cast();step(4);click('[data-fish="primary"]');hand_checks('Earned blade hooked');land();snapshots('BLADE_CAUGHT');preserved(before,state())
        click('[data-fish="primary"]');render()
        # Current whole-draft-derived Chapter IV bow; never personal state.
        row=accepted['rows']['earned-chapter-IV-blade-to-bow']
        page.keyboard.press('c');click('#rpg-tabs [data-rpg="open"][data-id="characters"]')
        with page.expect_file_chooser() as chooser:click('[data-rpg="chars-import"]')
        chooser.value.set_files(str(row['paths']['input']));click('[data-rpg="chars-confirm-import"]')
        page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-3"&&Realm.diagnostics.characters.writer')
        if page.locator('#rpg-window').evaluate('(e)=>e.open'):click('#rpg-close')
        render();check('returning input preserves earned owners',N.stable(state())==N.stable(row['worlds']['input']))
        click('#settings');page.locator('#quality').select_option('low');page.locator('#setting-timeFlow').uncheck();click('#close-panel');walk(0,27)
        c=ev('()=>Realm.diagnostics.adventure.companion');p=state()['player'];check('actual peaceful companion remains outside player',__import__('math').hypot(c['x']-p['x'],c['z']-p['z'])>=1.05)
        before=state();cast();step(4);click('[data-fish="primary"]');hand_checks('Earned bow hooked');land();snapshots('RETURNING_CAUGHT');preserved(before,state())
        click('[data-fish="primary"]');render()
        # Accepted short return step leaves the body facing away from the water,
        # so ordinary capture also exercises a large cast-facing transition.
        walk(0,26.6)
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
        check('cold startup preserves active identity and inactive slots',startup['active']==library['active'] and [s for s in startup['slots'] if s['id']!=startup['active']]==[s for s in library['slots'] if s['id']!=library['active']])
        check('cold launch has no invented partial fish',fish() is None)
        check('earned story survives native restart',N.stable(state())==N.stable(before))
        recording_start=time.monotonic();cast()
        while fish()['phase']=='waiting':
            sample(normal=True);page.wait_for_timeout(70)
            if time.monotonic()-recording_start>20:raise AssertionError('Bite timeout')
        check('ordinary cast reaches actual bite',fish()['phase']=='bite')
        click('[data-fish="primary"]')
        page.locator('#world').focus();page.keyboard.press('p')
        page.wait_for_function('()=>document.querySelector("[data-fish=primary]").disabled')
        frozen=fish();page.wait_for_timeout(700);check('native P pauses ordinary fishing frames',fish()==frozen)
        page.keyboard.press('p');page.wait_for_function('()=>!document.querySelector("[data-fish=primary]").disabled')
        hand_checks('Ordinary hooked');land(normal=True)
        page.screenshot(path=str(OUT/'NORMAL_CAUGHT.png'));page.locator('#world').focus();page.keyboard.press('v');page.wait_for_timeout(700)
        click('[data-fish="primary"]');page.wait_for_timeout(700)
        check('ordinary RAF explicit release',fish() is None)
        # A second brief cast captures acquisition/descent in the other view.
        cast();second_cast=time.monotonic()
        while time.monotonic()-second_cast<1.2:
            sample(normal=True);page.wait_for_timeout(70)
        click('[data-fish="cancel"]');page.wait_for_timeout(400)
        check('ordinary second-view cast deliberately put away',fish() is None)
        report['ordinaryRecording']={'secondsAfterReady':time.monotonic()-recording_start,'normalRAF':True,'setup':'current earned Chapter IV bow saved at pier; no accelerated ticks after cold launch','humanPlay':False}
        path=video.path()
        close()
        report['ordinaryRecording']['path']=str(path);report['ordinaryRecording']['bytes']=Path(path).stat().st_size
        check('no page errors or external requests',not report['browserErrors'] and not report['externalRequests'])
        check('source stayed exact',N.git(ROOT,'rev-parse','HEAD')==accepted['head'] and not N.git(ROOT,'status','--porcelain=v1','--untracked-files=all'))
        import math
        maximum=0
        minimum=99
        for q in samples:
            parts={p['id']:p for p in q['parts']}
            maximum=max(maximum,math.dist(q['right'],parts['rod-grip']['p']),math.dist(q['left'],parts['reel-handle']['p']))
            for p in q['parts']:
                if p['id'] not in ('rod-grip','rod-lower','rod-tip'):continue
                a,b=p['segment'];d=[b[i]-a[i] for i in range(3)];den=sum(x*x for x in d)
                u=max(0,min(1,sum(d[i]*(q['head'][i]-a[i]) for i in range(3))/den))
                minimum=min(minimum,math.dist(q['head'],[a[i]+d[i]*u for i in range(3)])-math.sqrt(2)*p['width']/2)
        check('sampled render hand connections continuous',maximum<.00001,maximum)
        check('sampled rod clears conservative head sphere',minimum>.19,minimum)
        moving=[q for q in samples if q['normalRAF'] and q['view']['phase']=='playing' and q['view']['reeling']]
        check('ordinary samples include visible crank travel',len(moving)>4 and max(q['view']['reelTime'] for q in moving)-min(q['view']['reelTime'] for q in moving)>.5,len(moving))
        check('ordinary cast onset sampled in both modes',len({q['mode'] for q in samples if q['normalRAF'] and q['view']['phase']=='waiting' and q['view']['time']<.85})==2)
        check('ordinary reeling observed in both camera modes',len({q['mode'] for q in moving})==2,sorted({q['mode'] for q in moving}))
        crank_heights=[q['left'][1]-q['right'][1] for q in moving]
        check('ordinary submitted crank geometry actually travels',max(crank_heights)-min(crank_heights)>.05,max(crank_heights)-min(crank_heights))
        check('native module pins stayed exact',all(N.sha(p)==h for p,h in native_pins.items()))
        N.write_new(OUT/'MOTION_SAMPLES.json',samples)
        report['motion']={'samples':len(samples),'maximumHandErrorMetres':maximum,'minimumRodHeadClearanceMetres':minimum}
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
        if not report['ownedBrowserDriverClosed']:raise RuntimeError('Owned browser/driver closure failed; inspect report')

if __name__=='__main__':main()
