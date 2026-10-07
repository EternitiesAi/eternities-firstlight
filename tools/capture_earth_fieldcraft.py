#!/usr/bin/env python3
"""Bounded actual fieldcraft movie from a labelled command-earned root-clear save.

Native character import, travel, work controls and ordinary RAF only. Recording
starts at the worksite, uses the actual WebGL canvas, and lasts at most90 seconds.
The silent canvas movie excludes DOM controls/HUD; separate screenshots preserve
those. This is an automated known solution, not human pacing or FPS certification.
Failure evidence and isolated profiles remain in the fresh D-drive output.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
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

from browser_support import launch_kwargs
from capture_earth_expedition import fieldcraft_selector, fieldcraft_edit, fitting_unchanged

ROOT = Path(__file__).resolve().parents[1]
VIEWPORT = {'width':1440, 'height':960}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def validate_source(world):
    # Fixed existing IDs; a declared earned prefix, never invented completion.
    expected = ['assess-load','prepare-allocation','read-water','clear-crossing','read-root-load','clear-root-pests']
    ledger = world.get('earthExpedition', {})
    story = ledger.get('story', {})
    if world.get('version') !=9 or world.get('adventure', {}).get('version') !=12:
        raise ValueError('Current world9/adventure12 command-earned snapshot required')
    if not story.get('accepted') or story.get('claimed') or story.get('steps') != expected:
        raise ValueError('Use the exact command-earned 02A_ROOT_CLEAR snapshot before fitting')
    if ledger.get('patrol') != {'lastClaim':0,'active':None} or story.get('branch') not in ['stormfall-recovery','managed-coppice']:
        raise ValueError('Unpaid original story prefix required')
    a = world['adventure']
    if not a.get('started') or a.get('hp',0)<=0 or a.get('equipment', {}).get('weapon') not in a.get('owned', []):
        raise ValueError('Alive character with earned owned equipment required')
    return expected

def percentile(values, fraction):
    if not values:return None
    return sorted(values)[min(len(values)-1, int((len(values)-1)*fraction))]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--renderer',choices=['hardware','software'],required=True)
    args=parser.parse_args(); source=args.source.resolve(); out=args.output.resolve()
    if not args.output.is_absolute() or os.name=='nt' and out.drive.lower()!='d:':parser.error('Fresh absolute D-drive output required')
    if out.exists() or not source.is_file():parser.error('Output must be new and source must exist')
    initial=json.loads(source.read_text(encoding='utf-8-sig')); validate_source(initial)
    from playwright.sync_api import sync_playwright
    out.mkdir(parents=True); (out/'SOURCE_WORLD.json').write_bytes(source.read_bytes())
    report={'status':'running','method':__doc__,'source':{'path':str(source),'sha256':sha(source)},
            'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
            'html_sha256':sha(ROOT/'index.html'),'viewport':VIEWPORT,'renderer_requested':args.renderer,
            'checks':[],'events':[],'browser_errors':[],'external_requests':[],
            'human_acceptance':False,'context_closed':False,'server_closed':False}
    sources={p.relative_to(ROOT).as_posix():sha(p) for p in (ROOT/'src').rglob('*') if p.is_file()};report['sources_sha256']=sources
    def check(label,condition,detail=None):
        report['checks'].append({'name':label,'ok':bool(condition),'detail':detail})
        if not condition:raise AssertionError(label+': '+repr(detail))
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
        def log_message(self,*_):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
    origin='http://127.0.0.1:'+str(server.server_port);report['origin']=origin
    profile=Path(tempfile.mkdtemp(prefix='fieldcraft-',dir=out));report['profile']=str(profile)
    context=page=None;started=time.monotonic();video=out/'ACTUAL_FIELDCRAFT.webm'
    try:
        check('Identical checked-in HTML',sha(ROOT/'FIRSTLIGHT_VALLEY.html')==report['html_sha256'])
        with sync_playwright() as pw:
            try:
                context=pw.chromium.launch_persistent_context(str(profile),**launch_kwargs(args.renderer),viewport=VIEWPORT,accept_downloads=True)
                report['browser_version']=context.browser.version if context.browser else None
                def route(r):
                    if r.request.url.startswith(origin+'/'):r.continue_()
                    else:report['external_requests'].append(r.request.url);r.abort()
                context.route('**/*',route);page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
                def retain_movie(download):
                    if download.suggested_filename!='ACTUAL_FIELDCRAFT.webm':raise ValueError('Unexpected recording download')
                    if video.exists():raise ValueError('A retained take cannot be overwritten')
                    download.save_as(str(video))
                    report['download_retained']=True
                page.on('download',retain_movie)
                def wait_retained():
                    deadline=time.monotonic()+15
                    while not report.get('download_retained'):
                        if time.monotonic()>=deadline:raise TimeoutError('Recorder download was not confirmed retained')
                        page.wait_for_timeout(100)
                response=page.goto(origin+'/index.html',wait_until='load');page.wait_for_function('()=>!!window.Realm&&getComputedStyle(document.querySelector("#loading")).opacity==="0"')
                check('Production page without test controls',page.evaluate('()=>typeof Realm.test==="undefined"'))
                check('Exact served build',hashlib.sha256(response.body()).hexdigest()==report['html_sha256'])
                def state():return page.evaluate('()=>Realm.state')
                def close():
                    if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
                def click(selector):
                    loc=page.locator(selector);check('Unique native control '+selector,loc.count()==1);loc.click()
                def workspace(tab):
                    close();page.keyboard.press('j');click('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]')
                def observe(label,picture=False):
                    w=state();d=page.evaluate('()=>Realm.diagnostics');report['events'].append({'label':label,'seconds':time.monotonic()-started,'camera':d['camera'],'steps':w['earthExpedition']['story']['steps']})
                    if picture:page.screenshot(path=str(out/(label+'.png')))
                    return w
                workspace('characters');legacy=page.evaluate('()=>localStorage.getItem(RealmCore.KEY)')
                with page.expect_file_chooser() as chooser:click('#rpg-content [data-rpg="chars-import"]')
                chooser.value.set_files(str(source));page.wait_for_selector('[data-rpg="chars-confirm-import"]');click('[data-rpg="chars-confirm-import"]')
                page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer===true')
                base=state();check('Native import preserves exact earned prefix',base['earthExpedition']==initial['earthExpedition'])
                check('Legacy storage untouched',page.evaluate('()=>localStorage.getItem(RealmCore.KEY)')==legacy)
                close();click('#settings');page.locator('#quality').select_option('balanced');page.locator('#setting-timeFlow').uncheck();click('#close-panel')
                d=page.evaluate('()=>Realm.diagnostics');report['renderer']=d['renderer'];check('Actual WebGL2',d['mode']=='webgl2')
                software=any(s in d['renderer'].lower() for s in ['swiftshader','llvmpipe','software'])
                check('Requested renderer verified',software==(args.renderer=='software'),d['renderer'])
                workspace('worlds')
                if page.locator('[data-rpg="world-list"]').count():click('[data-rpg="world-list"]')
                click('[data-rpg="world-select"][data-id="earthlands"]');click('[data-rpg="world-preview"]');click('[data-rpg="world-confirm"]')
                page.wait_for_function('()=>Realm.diagnostics.scene==="world-earthlands"')
                workspace('expedition');click('[data-rpg="expedition-walk"][data-id="brace-root-channel"]')
                walking=time.monotonic();stable=None;previous=None
                while time.monotonic()-walking<240:
                    d=page.evaluate('()=>Realm.diagnostics');p=d['adventure']['player']
                    motion=math.hypot(p['x']-previous['x'],p['z']-previous['z']) if previous else math.inf
                    if not d['adventure']['paused'] and math.hypot(p['x']+145,p['z']+84)<2.8 and motion<.01:
                        stable=stable if stable is not None else time.monotonic()
                        if time.monotonic()-stable>=.3:break
                    else:stable=None
                    previous=p;page.wait_for_timeout(120)
                else:raise TimeoutError('Native worksite route did not settle')
                report['worksite_arrival']={'player':p,'walk_seconds':time.monotonic()-walking,'stable_seconds':time.monotonic()-stable}
                close();page.keyboard.press('e');page.wait_for_selector('#rpg-window[open]')
                check('Native fitting entry at actual worksite',page.locator(fieldcraft_selector('begin')).count()==1)
                click(fieldcraft_selector('begin'))
                check('Native fitting controls at actual worksite',page.locator(fieldcraft_selector('inspect',1)).count()==1)
                before=state();observe('WORKSPACE_BEFORE',True)
                close()
                # Recording instrumentation only: no gameplay or renderer changes.
                page.evaluate('''()=>{const c=document.querySelector('#world'),stream=c.captureStream(30),chunks=[],mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp8')?'video/webm;codecs=vp8':'video/webm',rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000});window.__fieldcraftMovie={rec,stream,chunks,intervals:[],previous:null,start:performance.now(),done:false};rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onstop=async()=>{const s=__fieldcraftMovie,blob=new Blob(chunks,{type:mime}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ACTUAL_FIELDCRAFT.webm';a.click();s.stream.getTracks().forEach(t=>t.stop());s.done=true;};requestAnimationFrame(function sample(t){const s=__fieldcraftMovie;if(s.done)return;if(s.previous!==null)s.intervals.push(t-s.previous);s.previous=t;requestAnimationFrame(sample)});rec.start(1000);setTimeout(()=>{if(rec.state==='recording'){__fieldcraftMovie.stopped=performance.now();rec.stop()}},90000)}''')
                def look(mode,label):
                    close();click('#rpg-hud [data-rpg="camera"][data-id="'+mode+'"]');workspace('expedition');click(fieldcraft_selector('look'));page.wait_for_timeout(1800);observe(label)
                    check(label+' workspace closed for visible work',not page.locator('#rpg-window').evaluate('(e)=>e.open'))
                look('follow','WRONG_DIORAMA');look('adventure','WRONG_THIRD')
                for n in range(1,5):
                    workspace('expedition');click(fieldcraft_selector('inspect',n))
                    if n==1:
                        check('Native yaw edit retains focus',fieldcraft_edit(page,'yaw',0));check('Native pitch edit retains focus',fieldcraft_edit(page,'pitch',14.6))
                        check('Temporary correction changes no ownership or ledger',fitting_unchanged(before,state()))
                        look('adventure','CORRECT_THIRD');look('follow','CORRECT_DIORAMA');workspace('expedition')
                    else:click(fieldcraft_selector('reuse',n))
                    click(fieldcraft_selector('seat',n));observe('SEATED_'+str(n));close();page.wait_for_timeout(550)
                check('Four seats remain unpaid and unrecorded',fitting_unchanged(before,state()))
                look('follow','READY_DIORAMA');workspace('expedition');click(fieldcraft_selector('fasten'))
                after=state();check('Fastening records only original brace',after['earthExpedition']['story']['steps']==before['earthExpedition']['story']['steps']+['brace-root-channel'] and after['earthExpedition']['patrol']==before['earthExpedition']['patrol'])
                for key in ['xp','coins','ore','owned','equipment','arsenal','earthBinding']:check('Fastening preserves '+key,after['adventure'][key]==before['adventure'][key])
                check('Fastening preserves normal material ownership',after['sandbox']['inventory']==before['sandbox']['inventory'])
                look('follow','PERMANENT_DIORAMA');page.screenshot(path=str(out/'PERMANENT_DIORAMA.png'));look('adventure','PERMANENT_THIRD');page.screenshot(path=str(out/'PERMANENT_THIRD.png'))
                page.evaluate('()=>{if(__fieldcraftMovie.rec.state!=="recording")throw Error("Capture exceeded bounded duration");__fieldcraftMovie.stopped=performance.now();__fieldcraftMovie.rec.stop()}')
                page.wait_for_function('()=>__fieldcraftMovie.done');wait_retained()
                movie=page.evaluate('()=>({intervals:__fieldcraftMovie.intervals,elapsed:__fieldcraftMovie.stopped-__fieldcraftMovie.start})')
                intervals=movie['intervals'];report['raf_observation']={'scope':'Additional ordinary RAF callback intervals while recording; encoding and automation overhead included, not rendered FPS','callbacks':len(intervals),'elapsed_ms':movie['elapsed'],'p50_ms':percentile(intervals,.5),'p95_ms':percentile(intervals,.95),'p99_ms':percentile(intervals,.99),'max_ms':max(intervals) if intervals else None,'over50ms':sum(t>50 for t in intervals)}
                report['video']={'path':video.name,'bytes':video.stat().st_size,'sha256':sha(video),'audio':False,'surface':'Actual WebGL canvas only; DOM HUD and controls excluded','requested_capture_fps':30}
                check('Short recording retained',video.stat().st_size>10000 and movie['elapsed']<90000)
                check('No runtime errors',not report['browser_errors'] and not page.evaluate('()=>Realm.diagnostics.errors'))
                check('Runtime sources unchanged',all(sha(ROOT/p)==h for p,h in sources.items()))
                check('HTML unchanged',sha(ROOT/'index.html')==report['html_sha256'])
                (out/'FINAL_WORLD.json').write_text(json.dumps(state(),indent=2)+'\n',encoding='utf-8')
                report['status']='passed'
            finally:
                if page and not page.is_closed():
                    try:
                        recording=page.evaluate('()=>typeof __fieldcraftMovie!=="undefined"')
                        if recording:
                            page.evaluate('()=>{if(__fieldcraftMovie.rec.state==="recording"){__fieldcraftMovie.stopped=performance.now();__fieldcraftMovie.rec.stop()}}')
                            page.wait_for_function('()=>__fieldcraftMovie.done',timeout=15000);wait_retained()
                        if video.exists():
                            report['video']={**report.get('video',{}),'path':video.name,'bytes':video.stat().st_size,'sha256':sha(video),'partial':report['status']!='passed','audio':False,'surface':'Actual WebGL canvas only; DOM HUD and controls excluded'}
                    except Exception:report['recording_cleanup_error']=traceback.format_exc()
                if context:context.close();report['context_closed']=True
    except Exception:report['status']='failed';report['error']=traceback.format_exc();print(report['error'])
    finally:
        server.shutdown();server.server_close();report['server_closed']=True;report['wall_seconds']=time.monotonic()-started
        (out/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:report.get(k) for k in ['status','renderer','video','raf_observation','wall_seconds']},indent=2))
    return 0 if report['status']=='passed' else 1

if __name__=='__main__':raise SystemExit(main())
