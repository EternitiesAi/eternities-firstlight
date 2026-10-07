#!/usr/bin/env python3
"""Prepared 17-second silent supplied-load canvas capture; no browser at import.

Requires a PASSED current normal-RAF native report and explicitly hash-bound
SUPPLIED world. Native import/travel/Continue and actual WASD only. No arrival,
position or reward edits. Two cameras and at most three stills. Recorder RAF
observations are separate from displayed FPS and certify neither pacing nor FPS.
All evidence/profiles remain in fresh external D output; no cleanup deletion.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from types import SimpleNamespace
import argparse
import hashlib
import importlib.util
import json
import math
import os
import re
import subprocess
import sys
import threading
import time
import traceback

ROOT=Path(__file__).resolve().parents[1]
MOVIE='ACTUAL_FIRST_LOAD.webm'
SECONDS=17.0
CASES={v+'-'+r for v in ('blade','bow','veteran') for r in ('south','north')}
BOUNDARIES={'SYNTHETIC-capacity','SYNTHETIC-quota'}
START_RECORDER=r'''()=>{if(window.__consignmentMovie)throw Error('Recorder already exists');const c=document.querySelector('#world');if(!c||typeof c.captureStream!=='function'||typeof MediaRecorder==='undefined')throw Error('Canvas recorder unavailable');const stream=c.captureStream(30);if(stream.getAudioTracks().length)throw Error('Silent canvas stream required');const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp8')?'video/webm;codecs=vp8':'video/webm',chunks=[],rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000}),s=window.__consignmentMovie={rec,stream,chunks,mime,intervals:[],previous:null,start:performance.now(),done:false};rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onstop=()=>{try{const blob=new Blob(chunks,{type:mime}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='ACTUAL_FIRST_LOAD.webm';a.hidden=true;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){s.error=String(e);}finally{stream.getTracks().forEach(t=>t.stop());s.done=true;}};requestAnimationFrame(function sample(t){if(s.done)return;if(s.previous!==null)s.intervals.push(t-s.previous);s.previous=t;requestAnimationFrame(sample)});rec.start(1000);setTimeout(()=>{if(rec.state==='recording'){s.stopped=performance.now();s.timedOut=true;rec.stop();}},22000);return{mime,requestedCaptureFps:30,audioTracks:stream.getAudioTracks().length};}'''
STOP_RECORDER=r'''()=>{if(!window.__consignmentMovie)return false;const s=__consignmentMovie;if(s.rec.state==='recording'){s.stopped=performance.now();s.rec.stop();}return true;}'''
READ_RECORDER=r'''()=>{const s=__consignmentMovie;return{intervals:s.intervals,elapsed_ms:s.stopped-s.start,timedOut:!!s.timedOut,error:s.error||null,mime:s.mime};}'''


def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write_new(p,value):
    with Path(p).open('x',encoding='utf-8',newline='\n') as f:f.write(value if isinstance(value,str) else json.dumps(value,indent=2)+'\n')
def load_native(root):
    p=root/'tools/earth_consignment_browser.py'
    if not p.is_file():raise ValueError('Install the reviewed native helper before capture')
    s=importlib.util.spec_from_file_location('first_load_capture_native',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def normalize_paths(values):return {k.replace('\\','/'):v for k,v in values.items()}


def validate_report(report,epoch,native_sha,cohort_sha):
    if report.get('status')!='passed' or report.get('execution')!='ordinary-RAF-native-input' or report.get('cohortProvenance')!='current-command-earned':raise ValueError('PASSED current actual native first-load report required')
    if any(report.get(k)!=[] for k in ('browserErrors','externalRequests','errors')):raise ValueError('Native errors/requests cannot be waived')
    if report.get('serverClosed') is not True or report.get('humanAcceptance') is not False or report.get('performanceCertified') is not False:raise ValueError('Native shutdown/qualification labels required')
    if report.get('head')!=epoch['head'] or report.get('html_sha256')!=epoch['htmlSha256'] or normalize_paths(report.get('sources',{}))!=epoch['runtimeSources']:raise ValueError('Native HTML/runtime epoch changed')
    if report.get('harness_sha256')!=native_sha or report.get('cohort_sha256')!=cohort_sha:raise ValueError('Native driver/cohort changed')
    rows=report.get('cases',{})
    if set(rows)!=CASES|BOUNDARIES:raise ValueError('All six native routes and both refusal cases must pass')
    for name,row in rows.items():
        if row.get('contextClosed') is not True or row.get('boundary') is not (name in BOUNDARIES) or not row.get('checks') or any(c.get('passed') is not True for c in row['checks']):raise ValueError('Native case not completely passed/closed: '+name)
        if any(k in row for k in ('closeEvidenceError','contextCloseError')):raise ValueError('Native case cleanup failed: '+name)


def validate_supplied(world,store,case,row,original,H):
    r=world.get('localLife',{}).get('records',{}).get(H.JOB)
    suffix=original['suffix'];expected=case.split('-')[-1]+'-'+suffix
    if r!={'accepted':True,'choice':expected,'steps':[],'claimed':False} or r.get('accepted') is not True or r.get('claimed') is not False:raise ValueError('Exact accepted, zero-arrival SUPPLIED record required')
    if world.get('version')!=9 or world.get('adventure',{}).get('version')!=12 or world['adventure'].get('hp',0)<=0:raise ValueError('Living current supplied world required')
    before=original['world']
    if H.preserved(world)!=H.preserved(before) or world['sandbox']['inventory']!=before['sandbox']['inventory'] or world['adventure']['coins']!=before['adventure']['coins']:raise ValueError('Supplied input changed original owned facts/materials/payment')
    if store.get('version')!=1 or store.get('active')!='character-2':raise ValueError('Exact native imported owner bytes required')
    slots=[v for v in store.get('slots',[]) if v.get('id')==store['active']]
    if len(slots)!=1:raise ValueError('Native supplied owner is ambiguous')
    saved=slots[0]['world']
    if saved.get('localLife')!=world['localLife'] or H.preserved(saved)!=H.preserved(world) or saved['sandbox']['inventory']!=world['sandbox']['inventory'] or saved['adventure']['coins']!=world['adventure']['coins']:raise ValueError('SUPPLIED world differs from native saved bytes')
    origin=row.get('origin',{})
    expected_origin={'sha256':H.sha(original['source']),'journey_sha256':H.sha(original['journey']),'producerSourceHashes':original['receipt']['sourceHashes'],'provenance':'current-command-earned','prerequisitesReplayedByDriver':False,'currentCallerMatched':True}
    if any(origin.get(k)!=v for k,v in expected_origin.items()) or Path(origin.get('source','')).resolve()!=original['source'].resolve() or Path(origin.get('journey','')).resolve()!=original['journey'].resolve():raise ValueError('Selected native original cohort provenance differs')


def preflight(a):
    if not re.fullmatch('[0-9a-f]{64}',a.source_sha256) or not re.fullmatch('[0-9a-f]{64}',a.native_report_sha256):raise ValueError('Explicit sealed lowercase SHA256 values required')
    if sha(a.source)!=a.source_sha256 or sha(a.native_report)!=a.native_report_sha256:raise ValueError('Sealed native input/report bytes changed; no rehash fallback')
    H=load_native(a.root);rows=H.current_preflight(a.cohort,a.root);epoch=H.current_epoch(a.root)
    report=read(a.native_report);validate_report(report,epoch,sha(a.root/'tools/earth_consignment_browser.py'),sha(a.cohort))
    if a.case not in CASES:raise ValueError('Choose one passed positive native case')
    if a.native_report.name!='FIRST_LOAD_NATIVE_REPORT.json' or a.source.parent!=a.native_report.parent/a.case or a.source.name not in ('SUPPLIED_follow_WORLD.json','SUPPLIED_adventure_WORLD.json'):raise ValueError('Use the exact selected native SUPPLIED artifact')
    row=report['cases'][a.case]
    if Path(row['profile']).resolve().parent!=a.source.parent:raise ValueError('Native source/profile ownership differs')
    for mode in ('follow','adventure'):
        if not any(c.get('name')=='SUPPLIED actual projected '+mode+' pixels' and c.get('passed') is True for c in row['checks']):raise ValueError('Native supplied two-camera pixels not passed')
    store=a.source.with_name(a.source.name.replace('_WORLD.json','_NATIVE_STORE.json'))
    world=read(a.source);variant=a.case.rsplit('-',1)[0];validate_supplied(world,read(store),a.case,row,rows[variant],H)
    return H,world,epoch,{'source':{'path':str(a.source),'sha256':a.source_sha256},'nativeReport':{'path':str(a.native_report),'sha256':a.native_report_sha256},'nativeStore':{'path':str(store),'sha256':sha(store)},'cohort':{'path':str(a.cohort),'sha256':sha(a.cohort)},'case':a.case,'provenance':'PASSED-current-native-SUPPLIED','originalPrerequisitesReplayed':False}


def hardware_rtx(d):
    r=d.get('renderer');return d.get('mode')=='webgl2' and isinstance(r,str) and 'nvidia' in r.lower() and re.search(r'\brtx\b',r.lower()) is not None and not any(s in r.lower() for s in ('swiftshader','llvmpipe','software'))
def valid_movie(value):return value.get('error') is None and value.get('timedOut') is False and 15000<=value.get('elapsed_ms',0)<=20000
def percentile(xs,f):return sorted(xs)[int((len(xs)-1)*f)] if xs else None


def saved_facts_match(raw,initial,H):
    try:
        store=json.loads(raw);slots=[s for s in store['slots'] if s['id']==store['active']]
        if store['active']!='character-2' or len(slots)!=1:return False
        world=slots[0]['world']
        return world['localLife']==initial['localLife'] and H.preserved(world)==H.preserved(initial) and world['sandbox']['inventory']==initial['sandbox']['inventory'] and world['adventure']['coins']==initial['adventure']['coins']
    except (KeyError,TypeError,ValueError):return False


def follow_until(h,H,deadline,report,clock=time.monotonic):
    """Bounded real native controls; test seams do not advance a real simulation."""
    h.close();h.page.locator('#world').focus()
    if h.ev('()=>document.activeElement===document.querySelector("#world")') is not True:raise AssertionError('Native canvas focus unavailable')
    prefix=list(h.record()['steps']);start=h.view();walking=False;samples=0;last_sample=-math.inf
    while clock()<deadline:
        d=h.diag();v=d['consignment']['view'];p=d['adventure']['player']
        if h.record()['steps']!=prefix:raise AssertionError('Short capture cannot auto-record an arrival')
        if h.state()['adventure']['hp']<=0 or v['status']=='blocked':raise AssertionError('Actual death/threat/support interrupted capture')
        if v['ready'] or v['status']!='moving' or d['adventure']['paused']:raise AssertionError('Real carrier movement stopped before bounded clip end')
        frame=d['consignment']['frame'];walking=walking or bool(frame and frame['walking']);samples+=1
        if clock()-last_sample>=.5:
            report['motionSamples'].append({'player':p,'worker':{'x':v['x'],'z':v['z']},'status':v['status'],'walking':bool(frame and frame['walking']),'camera':d['camera']['preset']});last_sample=clock()
        keys=H.native_keys(p,v,d['camera']['yaw'])
        try:
            for key in keys:h.page.keyboard.down(key)
            h.page.wait_for_timeout(min(110 if keys else 80,max(1,(deadline-clock())*1000)))
        finally:
            for key in keys:h.page.keyboard.up(key)
    end=h.view()
    if not walking or samples<2 or H.distance(start,end)<1:raise AssertionError('No real walking carrier motion in this camera interval')
    return {'initial':start,'final':end,'samples':samples,'walkingObserved':walking}


def close_owned(h,server,report,retain):
    """Receipt failure must not prevent attempting both owned resource closes."""
    try:
        try:retain()
        except Exception:report['cleanupErrors'].append({'phase':'retain','error':traceback.format_exc()})
    finally:
        try:
            if h and h.context:
                try:h.context.close();h.context=None;report['contextClosed']=True
                except Exception:report['cleanupErrors'].append({'phase':'context','error':traceback.format_exc()})
            elif h:report['contextClosed']=True
        finally:
            if server:
                try:server.shutdown()
                except Exception:report['cleanupErrors'].append({'phase':'server shutdown','error':traceback.format_exc()})
                finally:
                    try:server.server_close();report['serverClosed']=True
                    except Exception:report['cleanupErrors'].append({'phase':'server close','error':traceback.format_exc()})


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('root','cohort','native-report','source','output'):p.add_argument('--'+name,type=Path,required=name!='root',default=ROOT if name=='root' else None)
    p.add_argument('--case',required=True);p.add_argument('--source-sha256',required=True);p.add_argument('--native-report-sha256',required=True);a=p.parse_args(argv)
    absolute=a.output.is_absolute();a.root=a.root.resolve();a.output=a.output.resolve()
    for name in ('cohort','native_report','source'):setattr(a,name,getattr(a,name).resolve())
    if not absolute or (os.name=='nt' and a.output.drive.lower()!='d:') or a.output.exists():p.error('New absolute external D output required; no reuse or deletion')
    protected=(a.root,a.native_report.parent,a.cohort.parent)
    if any(a.output==q or a.output.is_relative_to(q) or q.is_relative_to(a.output) for q in protected):p.error('Capture output must be separate from ROOT and retained input evidence')
    H,initial,epoch,intake=preflight(a)
    from playwright.sync_api import sync_playwright
    a.output.mkdir(parents=True);write_new(a.output/'SOURCE_WORLD.json',a.source.read_text(encoding='utf-8-sig'));write_new(a.output/'SOURCE_NATIVE_STORE.json',Path(intake['nativeStore']['path']).read_text(encoding='utf-8-sig'))
    report={'status':'running','method':__doc__,'intake':intake,'epoch':epoch,'captureHarnessSha256':sha(__file__),'nativeHelperSha256':sha(a.root/'tools/earth_consignment_browser.py'),'browserSupportSha256':sha(a.root/'tools/browser_support.py'),'rendererRequested':'hardware','checks':[],'cases':{},'browserErrors':[],'externalRequests':[],'html_sha256':epoch['htmlSha256'],'cleanupErrors':[],'errors':[],'motionSamples':[],'stills':[],'contextClosed':False,'serverClosed':False,'humanAcceptance':False,'performanceCertified':False}
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*args,**kw):super().__init__(*args,directory=str(a.root),**kw)
        def log_message(self,*args):pass
    server=h=None;video=a.output/MOVIE;download_retained=False;download_error=None
    def retain_movie(download):
        nonlocal download_retained,download_error
        try:
            if download.suggested_filename!=MOVIE or video.exists():raise ValueError('One exact recording download required; never overwrite')
            download.save_as(str(video));download_retained=True
        except Exception:download_error=traceback.format_exc()
    def stop_movie():
        if not h or not h.page or h.page.is_closed() or h.ev('()=>typeof __consignmentMovie!=="undefined"') is not True:return
        h.ev(STOP_RECORDER);h.page.wait_for_function('()=>__consignmentMovie.done',timeout=15000)
        deadline=time.monotonic()+15
        while not download_retained:
            if download_error:raise RuntimeError(download_error)
            if time.monotonic()>=deadline:raise TimeoutError('Actual recorder download not retained')
            h.page.wait_for_timeout(100)
        if download_error:raise RuntimeError(download_error)
        value=h.ev(READ_RECORDER);xs=value.pop('intervals')
        report['recorder']={**value,'callbacks':len(xs),'p50_ms':percentile(xs,.5),'p95_ms':percentile(xs,.95),'max_ms':max(xs) if xs else None,'requestedCaptureFps':30,'scope':'Additional ordinary RAF callbacks until recorder onstop; encoding/controller overhead included. Not displayed FPS or a rendered FPS certification.'}
        report['movie']={'path':video.name,'bytes':video.stat().st_size,'sha256':sha(video),'audio':False,'surface':'actual WebGL canvas; DOM/HUD excluded','partial':report['status']!='passed'}
    def still(label):
        if len(report['stills'])>=3:raise ValueError('At most three stills permitted')
        target=a.output/(label+'.png')
        if target.exists():raise ValueError('Never overwrite a retained still')
        entry={'path':target.name,'status':'attempted'};report['stills'].append(entry)
        try:
            h.page.screenshot(path=str(target));d=h.diag();entry.update(status='retained',bytes=target.stat().st_size,sha256=sha(target),diagnostics=d['consignment'],displayedFps=d.get('fps'))
        except Exception:entry['error']=traceback.format_exc();raise
    def retain():
        try:stop_movie()
        finally:
            if video.is_file():
                try:report['movie']={**report.get('movie',{}),'path':video.name,'bytes':video.stat().st_size,'sha256':sha(video),'audio':False,'surface':'actual WebGL canvas; DOM/HUD excluded','partial':report['status']!='passed','downloadConfirmed':download_retained}
                except Exception:report['cleanupErrors'].append({'phase':'partial movie hash','error':traceback.format_exc()})
            if h and h.page and not h.page.is_closed():
                for label,call in [('FINAL_WORLD.json',h.state),('FINAL_NATIVE_STORE.json',lambda:h.ev('()=>localStorage.getItem(RealmCharacters.KEY)'))]:
                    try:write_new(a.output/label,call())
                    except Exception:report['cleanupErrors'].append({'phase':label,'error':traceback.format_exc()})
                if report['status']!='passed' and len(report['stills'])<3:
                    try:still('FAILURE')
                    except Exception:report['cleanupErrors'].append({'phase':'failure still','error':traceback.format_exc()})
    try:
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();origin='http://127.0.0.1:'+str(server.server_port);report['origin']=origin
        with sync_playwright() as pw:
            class Chromium:
                def launch_persistent_context(self,*args,**kw):kw['accept_downloads']=True;return pw.chromium.launch_persistent_context(*args,**kw)
            args=SimpleNamespace(root=a.root,output=a.output,renderer='hardware');h=H.Native(SimpleNamespace(chromium=Chromium()),args,report,origin,'SHORT')
            try:
                h.start();h.page.on('download',retain_movie)
                if h.context.browser:report['browserVersion']=h.context.browser.version
                else:
                    session=h.context.new_cdp_session(h.page)
                    try:report['browserVersion']=session.send('Browser.getVersion')
                    finally:session.detach()
                d=h.diag();report['rendererActual']=d['renderer'];h.check('Actual hardware NVIDIA RTX renderer',hardware_rtx(d),d['renderer'])
                h.import_world(a.source);h.check('Native import retains supplied record, previous owners and economy',h.record()==initial['localLife']['records'][H.JOB] and H.import_preserved(initial,h.state()))
                h.enter();h.walk_work('carrier');h.action('wait');h.close();h.click('#rpg-hud [data-rpg="camera"][data-id="adventure"]');h.page.keyboard.press('r');h.action('continue')
                before=h.state();h.check('Explicit native Continue starts actual carrier',h.view()['status']=='moving')
                report['recorderStart']=h.ev(START_RECORDER);started=time.monotonic();report['cameraIntervals']=[]
                report['cameraIntervals'].append({'camera':'adventure',**follow_until(h,H,started+7.5,report)});still('THIRD_PERSON')
                h.click('#rpg-hud [data-rpg="camera"][data-id="follow"]');h.page.keyboard.press('r')
                report['cameraIntervals'].append({'camera':'follow',**follow_until(h,H,started+SECONDS,report)});stop_movie();still('DIORAMA')
                after=h.state();h.check('Short movie retains acceptance with no arrival/payment/inventory change',h.record()==initial['localLife']['records'][H.JOB] and H.preserved(after)==H.preserved(before) and after['sandbox']['inventory']==before['sandbox']['inventory'] and after['adventure']['coins']==before['adventure']['coins'])
                h.check('Silent actual canvas recording is 15 to 20 seconds',valid_movie(report['recorder']) and report['movie']['bytes']>10000,report['recorder'])
                h.check('Both camera intervals show actual carrier walking',len(report['cameraIntervals'])==2 and all(v['walkingObserved'] for v in report['cameraIntervals']))
                h.check('No app/browser/external request errors',not report['browserErrors'] and not report['externalRequests'] and not h.diag()['errors'])
                h.check('Current runtime/build/caller/native inputs unchanged',H.current_epoch(a.root)==epoch and sha(a.root/'tools/earth_consignment_browser.py')==report['nativeHelperSha256'] and sha(a.root/'tools/browser_support.py')==report['browserSupportSha256'] and sha(a.source)==a.source_sha256 and sha(a.native_report)==a.native_report_sha256 and all(sha(v['path'])==v['sha256'] for v in intake.values() if isinstance(v,dict)))
                report['status']='passed'
            except Exception:report['status']='failed';report['errors'].append(traceback.format_exc())
            finally:
                close_owned(h,server,report,retain);server=None
                if h.raw:
                    try:
                        target=a.output/'FINAL_CLOSED_NATIVE_BYTES.json';write_new(target,h.raw);report['finalNativeBytes']={'path':target.name,'bytes':target.stat().st_size,'sha256':sha(target),'ownedFactsPreserved':saved_facts_match(h.raw,initial,H)}
                        if report['finalNativeBytes']['ownedFactsPreserved'] is not True:raise ValueError('Closed native bytes changed supplied progress/owned facts')
                    except Exception:report['cleanupErrors'].append({'phase':'closed native bytes','error':traceback.format_exc()})
                elif report['status']=='passed':report['cleanupErrors'].append({'phase':'closed native bytes','error':'No successful native character write was observed'})
    except Exception:report['status']='failed';report['errors'].append(traceback.format_exc())
    finally:
        if server:close_owned(h,server,report,retain)
        if download_error:report['downloadError']=download_error;report['status']='failed'
        if report['cleanupErrors'] or not report['contextClosed'] or not report['serverClosed']:report['status']='failed'
        if report.get('movie'):report['movie']['partial']=report['status']!='passed'
        try:write_new(a.output/'REPORT.json',report)
        except Exception:report['status']='failed';report['reportWriteError']=traceback.format_exc()
        print(json.dumps({k:report.get(k) for k in ('status','rendererActual','movie','contextClosed','serverClosed','cleanupErrors','reportWriteError')},indent=2))
    return 0 if report['status']=='passed' else 1


if __name__=='__main__':raise SystemExit(main())
