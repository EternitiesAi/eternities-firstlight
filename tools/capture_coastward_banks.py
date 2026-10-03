"""Matched actual-GPU realm frames. Setup uses accelerated production walking;
these frozen views are geometry evidence, not normal-time gameplay or human taste.
No position edits, reward grants, private saves or old-preview process access.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, hashlib, json, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--html', type=Path, default=ROOT/'index.html')
    parser.add_argument('--focus', choices=['coastward','givers'], default='coastward')
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    out, html, source = args.output.resolve(), args.html.resolve(), args.source.resolve()
    if out.drive.lower() != 'd:' or not args.output.is_absolute(): parser.error('Heavy proof belongs on D')
    if out.exists() and any(out.iterdir()): parser.error('Preserve earlier candidates; choose an empty output')
    out.mkdir(parents=True, exist_ok=True)
    report = {'method': __doc__, 'html_sha256':sha(html), 'source_sha256':sha(source),
              'script_sha256':sha(Path(__file__)), 'focus':args.focus, 'viewport':{'width':1280,'height':800},
              'accelerated_setup':True,'human_acceptance':False,'frames':[],
              'browser_errors':[],'external_requests':[]}
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw): super().__init__(*a,directory=str(html.parent),**kw)
        def log_message(self,*a): pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_port}'
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(**launch_kwargs('hardware'))
            report['browser']=browser.version
            context=browser.new_context(viewport=report['viewport'])
            context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(origin+'/') else (report['external_requests'].append(route.request.url),route.abort()))
            page=context.new_page();page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
            page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
            response=page.goto(origin+'/'+html.name)
            page.wait_for_function('window.Realm')
            assert hashlib.sha256(response.body()).hexdigest()==report['html_sha256']
            ev=lambda js,arg=None:page.evaluate(js,arg)
            ev('(w)=>Realm.test.replace(w)',json.loads(source.read_text(encoding='utf-8')))
            ev('Realm.test.quality("balanced");Realm.test.setTime(17)')
            report['renderer']=ev('Realm.diagnostics.renderer')
            assert 'NVIDIA' in report['renderer'] and '3080' in report['renderer']
            def render(): ev('Realm.test.captureFrame(12)')
            def close():
                if page.locator('#rpg-window').evaluate('(e)=>e.open'):page.locator('#rpg-close').click()
            def walk(x,z):
                close();assert ev('([x,z])=>Realm.test.move(x,z)',[x,z])['ok']
                ev('()=>{for(let i=0;i<18000&&Realm.test.path.length;i++)Realm.test.step(.05)}')
                assert not ev('Realm.test.path.length')
                p=ev('Realm.diagnostics.adventure.player')
                assert ((p['x']-x)**2+(p['z']-z)**2)**.5<.3
                render()
            def enter(realm):
                walk(18,6);page.keyboard.press('j');page.locator('[data-rpg="open"][data-id="worlds"]').click()
                if page.locator('[data-rpg="world-list"]').count():page.locator('[data-rpg="world-list"]').click()
                page.locator('[data-rpg="world-select"][data-id="'+realm+'"]').click()
                page.locator('[data-rpg="world-preview"]').click();page.locator('[data-rpg="world-confirm"]').click();render()
                assert ev('Realm.diagnostics.scene')=='world-'+realm
            def shot(name,mode,yaw,half,distance=10):
                if (ev('Realm.diagnostics.camera.projection')=='orthographic')!=(mode=='diorama'):page.keyboard.press('v')
                ev('(v)=>Realm.test.view(v)',{'yaw':yaw,'elevation':.65 if mode=='diorama' else .2,'half':half,'distance':distance,'zoom':half/17.5,'overview':False})
                render();path=out/(name+'-'+mode+'.png');page.screenshot(path=str(path))
                d=ev('Realm.diagnostics')
                report['frames'].append({'name':name+'-'+mode,'path':str(path),'sha256':sha(path),'player':d['adventure']['player'],'camera':d['camera'],'metrics':d['metrics'],'paused':d['adventure']['paused']})
            if args.focus=='coastward':
                enter('earthlands')
                for name,x,z in [('arrival',0,100),('far-bank',0,16),('woodland',-10,-9),('settlement',-6,-68)]:
                    walk(x,z)
                    for mode in ['diorama','third']:shot(name,mode,1.0 if mode=='diorama' else .65,24 if name!='woodland' else 18)
            else:
                report['interactions']=[]
                for realm in ['heaven','hell','earthlands','atlantis']:
                    enter(realm)
                    people=ev('()=>RealmWorldFoundations.definition(Realm.diagnostics.scene).points.filter(p=>p.kind==="person")')
                    for person in people:
                        point=ev('p=>{const d=RealmWorldFoundations.definition(Realm.diagnostics.scene);return [[p.x-1.2,p.z-1.2],[p.x+1.7,p.z],[p.x,p.z-1.7],[p.x,p.z+1.7]].find(q=>RealmWorldFoundations.walkable(d.room,...q));}',person)
                        assert point is not None;walk(*point)
                        # A side orbit separates the player from the stationary
                        # giver; the earlier frontal take is retained on D.
                        for mode in ['third','diorama']:shot(person['id'],mode,1.8,5,4.5)
                        page.keyboard.press('e');render();assert page.locator('#rpg-window').evaluate('(e)=>e.open')
                        text=page.locator('#rpg-window').inner_text();assert person['name'] in text
                        report['interactions'].append({'id':person['id'],'name':person['name'],'actual_menu_open':True,'distance':((point[0]-person['x'])**2+(point[1]-person['z'])**2)**.5,'name_in_menu':True})
                        page.screenshot(path=str(out/(person['id']+'-actual-dialogue.png')));close();render()
                    page.locator('#world-home').click();render();assert ev('Realm.diagnostics.scene')=='valley'
            assert sha(html)==report['html_sha256'] and sha(source)==report['source_sha256']
            report['status']='passed';assert not report['browser_errors'] and not report['external_requests']
            context.close();browser.close()
    except Exception:
        report['status']='failed';report['exception']=traceback.format_exc();raise
    finally:
        server.shutdown();server.server_close()
        (out/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':report['status'],'output':str(out),'html_sha256':report['html_sha256'],'frames':len(report['frames']),'renderer':report['renderer']}))
if __name__=='__main__':main()
