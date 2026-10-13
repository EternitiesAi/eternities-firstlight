"""Current Native.run checks with a separately owned driver per whole launch.
The resting sample waits for actual arrival/yield recovery before original pose checks. No game rules, fixtures, pose checks or memory threshold are overridden.
Reuses the previously reviewed arrival wait; all current original oracles run.
Additional submitted-geometry projection checks observe the actual arriving camera before view cycling.
"""
from pathlib import Path
import sys, threading, traceback
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
ROOT=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
ARC=Path(__file__).resolve().parent
OUT=ARC/'BRIAR02'
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
    def action(self, kind):
        if kind=='rest' and not getattr(self,'rest_camera_selected',False):
            self.close()
            self.click('#rpg-hud [data-rpg="camera"][data-id="adventure"]')
            self.render()
            self.row['restRouteInitialCamera']=self.diag()['camera']
            self.rest_camera_selected=True
        return super().action(kind)
    def samples(self,label,pose):
        if pose=='resting':
            for _ in range(240):
                v=self.diag()['briar']['view']
                if v and v['resting'] and v['readyToRemember']:break
                self.advance()
            else:raise AssertionError('Accepted house approach did not reach supported resting readiness')
            self.check('supported rest ready after real approach and yielding',True,self.diag()['briar']['view'])
            # Observe the arriving camera before any preset reset or deliberate
            # orbit. Production rendering and actual submitted parts own this.
            sample=self.ev(r'''()=>{
              const traveler=Realm.test.traveler(),fox=Realm.test.companion(),canvas=document.querySelector('#world');
              function projectParts(parts,key,names){
                const selected=parts.filter(p=>names.includes(p[key]));
                if(selected.length!==names.length||new Set(selected.map(p=>p[key])).size!==names.length)throw Error('Exact submitted part membership required');
                return selected.map(p=>{
                  if(!Array.isArray(p.m)||p.m.length!==16||!p.m.every(Number.isFinite))throw Error('Finite submitted matrix required');
                  const points=[];
                  for(const x of[-.5,.5])for(const y of[-.5,.5])for(const z of[-.5,.5]){
                    const world=RealmEngine.M.transform(p.m,[x,y,z]),screen=Realm.project(...world);
                    points.push({world,screen,inside:screen.visible&&Number.isFinite(screen.x)&&Number.isFinite(screen.y)&&screen.x>=0&&screen.x<=canvas.clientWidth&&screen.y>=0&&screen.y<=canvas.clientHeight});
                  }
                  return{name:p[key],kind:p.kind,matrix:p.m,points};
                });
              }
              const player=projectParts(traveler.parts,'part',['head','hair-crown','left-boot','right-boot','left-sole','right-sole']);
              const companion=projectParts(fox.parts,'companionPart',['body','haunch','head']);
              const ys=player.flatMap(p=>p.points.map(q=>q.screen.y));
              return{camera:Realm.diagnostics.camera,player,companion,width:canvas.clientWidth,height:canvas.clientHeight,playerHeight:Math.max(...ys)-Math.min(...ys)};
            }''')
            picture=self.folder/'REST_UNFRAMED_ARRIVAL.png'
            self.page.screenshot(path=str(picture))
            self.row['doorstepProjection']={**sample,'picture':str(picture),'pictureSha256':N.sha(picture),
                'method':'Selected actual body-part corner envelopes; explicit canvas bounds; pixels still require occlusion/legibility review.'}
            self.check('arrival remains in the selected third-person view',sample['camera']['preset']=='adventure')
            self.check('unframed rest retains readable camera distance',sample['camera']['actualDistance']>=3.4)
            self.check('actual player head and boots remain inside canvas',all(q['inside'] for part in sample['player'] for q in part['points']))
            self.check('actual player silhouette remains bounded',sample['playerHeight']<sample['height']*.75)
            self.check('actual fox body and head remain inside canvas',all(q['inside'] for part in sample['companion'] for q in part['points']))
        # All installed original pose/camera/persistence assertions still run.
        return N.Native.samples(self,label,pose)
    def finish(self):
        super().finish()
        if self.pw is not None:
            try:
                self.pw.stop();self.pw=None;self.row['ownedDriverStops']+=1
            except Exception as error:
                self.row['driverClosureError']=repr(error);self.row['closed']=False

def main():
    cohort=ARC/'REMOTE_SOURCE06/briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json'
    gate=ARC/'REMOTE_SOURCE06_EXIT.json'
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
            'method':__doc__,'nativeLabels':N.EARLY[:1],'cpuOnlyLabels':N.EARLY[1:]+N.RETURNING}
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



