"""One short, silent recording of the actual rain exhibition canvas.

An explicit current command-earned initial-kit checkpoint supplies setup only.
Native import, menu walking, keys and ordinary RAF own the filmed play. No test
API, time scaling, planted score or scripted participants. Twenty seconds show
part of one practice attempt, not a completed quest or human/performance proof.
The canvas excludes DOM HUD; separate screenshots preserve the visible controls.
Run serially through browser_budget.py, with a fresh D-drive output.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import argparse
import hashlib
import json
import math
import os
import subprocess
import tempfile
import threading
import time
import traceback

ROOT = Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    out = args.output.resolve()
    if (not args.output.is_absolute() or out == Path(out.anchor) or out.exists()
            or out.is_relative_to(ROOT) or ROOT.is_relative_to(out)
            or os.name == 'nt' and out.drive.upper() != 'D:'):
        parser.error('Fresh bounded absolute D output outside the game required')
    if subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).strip():
        raise ValueError('Commit the exact source before recording')
    if (ROOT/'index.html').read_bytes() != (ROOT/'FIRSTLIGHT_VALLEY.html').read_bytes():
        raise ValueError('Generated pages differ')
    files = [ROOT/'build.py', ROOT/'index.html', ROOT/'FIRSTLIGHT_VALLEY.html',
             ROOT/'tests/tournament_journey.cjs', Path(__file__).resolve(), *ROOT.glob('src/*')]
    identity = lambda: {str(p.relative_to(ROOT)): sha(p) for p in files if p.is_file()}
    report = dict(method=__doc__, source=identity(), head=subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), checks=[], errors=[],
        browser_errors=[], external_requests=[], ordinaryRAF=True, testAPI=False,
        humanAcceptance=False, contextClosed=False, serverClosed=False, status='running')
    out.mkdir()
    def check(name, ok):
        report['checks'].append(dict(name=name, passed=bool(ok)))
        print(('PASS ' if ok else 'FAIL ')+name, flush=True)
        if not ok:
            raise AssertionError(name)
    # Re-run the installed legitimate producer. The recorded source is its actual
    # initial-kit checkpoint, not its later accelerated scored journey.
    subprocess.run(['node', '-e',
        "const j=require('./tests/tournament_journey.cjs');j.run({output:process.argv[1]});",
        str(out/'earned-setup')], cwd=ROOT, check=True, timeout=120)
    source = out/'earned-setup/blade/01_EARNED_ENTRY.json'
    producer = out/'earned-setup/blade/REPORT.json'
    report['setup'] = dict(source=str(source), sha256=sha(source), producer=str(producer),
                         producerSha256=sha(producer), initialKitOmittedFromFilm=True)
    initial = json.loads(source.read_text(encoding='utf-8'))
    check('earned kit checkpoint has no issued bout or fabricated reward',
          initial['adventure']['started'] and initial['adventure']['earthTournament'] ==
          dict(version=1, issued=0, closed=0, best=dict(blade=None, bow=None), finished=dict(blade=0, bow=0)))
    from playwright.sync_api import sync_playwright
    from browser_support import launch_kwargs
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
        def log_message(self, *_): pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = 'http://127.0.0.1:'+str(server.server_port)
    context = None
    try:
        with tempfile.TemporaryDirectory(prefix='firstlight-rain-film-') as profile, sync_playwright() as pw:
            try:
                context = pw.chromium.launch_persistent_context(profile, **launch_kwargs('software'),
                    viewport=dict(width=1280, height=800), accept_downloads=True)
                def local_only(route):
                    if urlsplit(route.request.url).scheme in ('data', 'blob') or urlsplit(route.request.url).netloc == urlsplit(origin).netloc:
                        route.continue_()
                    else:
                        report['external_requests'].append(route.request.url); route.abort()
                context.route('**/*', local_only)
                page = context.pages[0] if context.pages else context.new_page()
                page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
                response = page.goto(origin+'/', wait_until='load')
                page.wait_for_function('!!window.Realm&&getComputedStyle(document.querySelector("#loading")).pointerEvents==="none"')
                check('actual committed HTML and ordinary production entry', response.ok and
                      hashlib.sha256(response.body()).hexdigest() == report['source']['index.html'] and
                      page.evaluate('typeof Realm.test==="undefined"'))
                ev = lambda s, arg=None: page.evaluate(s, arg)
                click = lambda selector: page.locator(selector).click()
                def close():
                    if page.locator('#rpg-window').evaluate('e=>e.open'): click('#rpg-close')
                def workspace(tab):
                    close(); click('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]')
                def wait_near(x, z, distance=2.4):
                    page.wait_for_function('([x,z,d])=>{const a=Realm.diagnostics.adventure,p=a.player;return !a.paused&&Math.hypot(p.x-x,p.z-z)<d}', arg=[x,z,distance], timeout=180000)
                workspace('characters')
                with page.expect_file_chooser() as chooser: click('[data-rpg="chars-import"]')
                chooser.value.set_files(str(source))
                click('[data-rpg="chars-confirm-import"]')
                page.wait_for_function('Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer===true')
                close(); click('#settings'); page.locator('#quality').select_option('low')
                page.locator('#camera-mode').select_option('adventure'); click('#close-panel')
                report['renderer'] = ev('Realm.diagnostics.renderer')
                check('software WebGL capture is labelled honestly', ev('Realm.diagnostics.mode') == 'webgl2' and 'SwiftShader' in report['renderer'])
                workspace('journal'); click('[data-rpg="earth-invitation"]'); click('[data-rpg="earth-walk"][data-id="gate"]'); wait_near(0,23)
                page.locator('#world').focus(); page.keyboard.press('e'); click('[data-rpg="earth-confirm"]')
                page.wait_for_function('Realm.diagnostics.scene==="earth-hearthwater-approach"')
                workspace('journal'); click('[data-rpg="tournament-open"]'); click('[data-rpg="tournament-walk"]'); wait_near(5,-27.6, 1.4)
                # Native camera-relative walking, with read-only diagnostics.
                start=time.monotonic(); held=()
                try:
                    while time.monotonic()-start < 25:
                        d=ev('Realm.diagnostics'); p=d['adventure']['player']; dx,dz=5-p['x'],-29.8-p['z']
                        if math.hypot(dx,dz)<.2: break
                        yaw=d['camera'].get('heading',d['camera']['yaw']); x,z=dx*math.cos(yaw)-dz*math.sin(yaw),dx*math.sin(yaw)+dz*math.cos(yaw)
                        keys=max([( ('w',),0,-1),(('w','d'),1,-1),(('d',),1,0),(('s','d'),1,1),(('s',),0,1),(('s','a'),-1,1),(('a',),-1,0),(('w','a'),-1,-1)],key=lambda row:(x*row[1]+z*row[2])/math.hypot(row[1],row[2]))[0]
                        for k in set(held)-set(keys): page.keyboard.up(k)
                        for k in set(keys)-set(held): page.keyboard.down(k)
                        held=keys; page.wait_for_timeout(50)
                    check('native body reached a supported blade position', math.hypot(dx,dz)<.2)
                finally:
                    for k in held: page.keyboard.up(k)
                page.keyboard.press('e'); click('[data-rpg="tournament-enter"]')
                page.locator('#world').focus(); page.keyboard.press('Tab')
                check('actual own exhibition selected without automatic fire', ev('Realm.diagnostics.adventure.tactics.auto') is False)
                page.evaluate("""()=>{const stream=document.querySelector('#world').captureStream(30),chunks=[],rec=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:1600000});
                    window.__rainFilm={rec,stream,start:performance.now(),done:false};rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
                    rec.onstop=()=>{const s=__rainFilm;s.duration=performance.now()-s.start;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));a.download='RAIN_EXHIBITION.webm';a.click();stream.getTracks().forEach(t=>t.stop());s.done=true};rec.start(1000);setTimeout(()=>{if(rec.state==='recording')rec.stop()},22000)}""")
                guards=set(); replies=set(); events=[]
                with page.expect_download(timeout=30000) as movie:
                    start=time.monotonic()
                    while time.monotonic()-start<20:
                        v=ev('Realm.diagnostics.earthTournament')
                        if not v: raise RuntimeError('Actual bout unexpectedly lost')
                        key=(v['index'],v['phase'])
                        if not events or events[-1]['phase']!=list(key): events.append(dict(seconds=time.monotonic()-start,phase=list(key),score=v['score']))
                        if v['phase']=='tell' and v['index'] not in guards: page.keyboard.press('3'); guards.add(v['index'])
                        if v['phase']=='opening' and v['index'] not in replies: page.keyboard.press('f'); replies.add(v['index'])
                        page.wait_for_timeout(60)
                    page.evaluate('if(__rainFilm.rec.state==="recording")__rainFilm.rec.stop()')
                movie.value.save_as(str(out/'RAIN_EXHIBITION.webm'))
                page.screenshot(path=str(out/'ACTUAL_HUD.png'))
                report['film'] = dict(path='RAIN_EXHIBITION.webm', bytes=(out/'RAIN_EXHIBITION.webm').stat().st_size,
                    sha256=sha(out/'RAIN_EXHIBITION.webm'), durationMs=ev('__rainFilm.duration'), audio=False,
                    surface='actual WebGL canvas; HUD excluded', requestedCaptureFps=30, events=events,
                    finalBout=ev('Realm.diagnostics.earthTournament'))
                check('one short actual recording with visible exchanges', report['film']['bytes']>10000 and
                      report['film']['durationMs']<25000 and len(events)>1)
                check('no external requests, page errors or test API', not report['browser_errors'] and not report['external_requests'] and ev('typeof Realm.test==="undefined"'))
                check('recording preserves the current source', identity()==report['source'])
                report['status']='passed'
            finally:
                if context is not None: context.close(); context=None; report['contextClosed']=True
    except BaseException:
        report['errors'].append(traceback.format_exc())
    finally:
        server.shutdown(); server.server_close(); thread.join(timeout=5); report['serverClosed']=not thread.is_alive()
        with (out/'REPORT.json').open('x',encoding='utf-8') as f: json.dump(report,f,indent=2);f.write('\n')
    if report['status']!='passed': raise RuntimeError('Capture incomplete; retained report contains the failure')


if __name__=='__main__': main()
