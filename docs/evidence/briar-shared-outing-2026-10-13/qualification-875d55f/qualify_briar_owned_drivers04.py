"""Current Native.run checks with a separately owned driver per whole launch.
No game rules, fixtures, checks, timeouts or memory threshold are overridden.
The retained failed shared-driver attempt remains failed.
"""
from pathlib import Path
import sys, threading, traceback
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
ROOT=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
ARC=Path(__file__).resolve().parent
OUT=ARC/'NATIVE_CONTEXT04'
sys.path.insert(0,str(ROOT/'tools'))
import briar_outing_browser as N
from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs
from types import SimpleNamespace

class OwnedDriverNative(N.Native):
    def start(self):
        assert self.context is None,'never stop a driver with an unclosed context'
        if self.pw is not None:
            self.pw.stop();self.pw=None
            self.row['ownedDriverStops']+=1
        self.pw=sync_playwright().start()
        self.row['ownedDriverStarts']+=1
        # Original start performs fresh admission after driver preparation and
        # before launching the whole persistent Chromium browser.
        return super().start()
    def finish(self):
        super().finish()
        if self.pw is not None:
            try:
                self.pw.stop();self.pw=None;self.row['ownedDriverStops']+=1
            except Exception as error:
                self.row['driverClosureError']=repr(error);self.row['closed']=False

def main():
    cohort=ARC/'REMOTE_SOURCE10/briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json'
    gate=ARC/'REMOTE_SOURCE10_EXIT.json'
    accepted=N.cohort(cohort,N.sha(cohort),ROOT,'complete',gate)
    assert N.git(ROOT,'status','--porcelain=v1','--untracked-files=all')==''
    assert not OUT.exists() and OUT.drive.lower()=='d:' and OUT.parent==ARC
    admitted=N.admission();OUT.mkdir()
    report={'status':'running','scope':'complete','head':accepted['head'],'htmlSha256':N.sha(ROOT/'index.html'),
            'callerSha256':N.sha(ROOT/'tools/briar_outing_browser.py'),'supportSha256':N.sha(ROOT/'tools/browser_support.py'),
            'brokerWrapperSha256':N.sha(__file__),'cohortSha256':accepted['reportSha256'],'sourceGate':accepted['sourceGate'],
            'admission':admitted,'cases':{},'browserErrors':[],'externalRequests':[],'errors':[],
            'execution':'accelerated-native-UI-whole-browser-restarts-with-owned-drivers',
            'normalRAF':False,'humanAcceptance':False,'performanceCertified':False,
            'method':__doc__,'nativeLabels':N.EARLY+[N.RETURNING[-1]],'cpuOnlyLabels':N.RETURNING[:-1]}
    args=SimpleNamespace(root=ROOT,output=OUT,support=SimpleNamespace(launch_kwargs=launch_kwargs))
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_port}';report['origin']=origin
    try:
        for label in report['nativeLabels']:
            h=OwnedDriverNative(None,args,report,origin,label)
            h.row['ownedDriverStarts']=0;h.row['ownedDriverStops']=0
            try:h.run(accepted['rows'][label])
            except Exception:
                h.retain_failure();raise
            finally:h.finish()
            assert h.row['closed'] and h.row['ownedDriverStarts']==h.row['ownedDriverStops'],'owned closure required before another case'
        N.cohort(cohort,accepted['reportSha256'],ROOT,'complete',gate)
        assert N.git(ROOT,'rev-parse','HEAD')==accepted['head'] and not N.git(ROOT,'status','--porcelain=v1','--untracked-files=all')
        assert N.sha(ROOT/'tools/briar_outing_browser.py')==report['callerSha256']
        assert N.sha(ROOT/'tools/browser_support.py')==report['supportSha256']
        assert N.sha(__file__)==report['brokerWrapperSha256']
        assert not report['browserErrors'] and not report['externalRequests']
        report['status']='passed'
    except Exception:
        report['status']='failed';report['errors'].append(traceback.format_exc());print(report['errors'][-1],flush=True)
    finally:
        server.shutdown();server.server_close();report['serverClosed']=True
        N.write_new(OUT/'BRIAR_NATIVE_REPORT.json',report)
    return 0 if report['status']=='passed' else 1
if __name__=='__main__':sys.exit(main())
