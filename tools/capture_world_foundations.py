#!/usr/bin/env python3
"""Normal-time five-road tour in an isolated hardware Chromium profile.

Only setup imports a labelled command-earned save. Movement, held swim keys,
crossing and one accepted Heaven objective use production callers and real RAF.
Short RAF samples measure presentation cadence, not sustained GPU throughput.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, hashlib, json, statistics, threading, time, traceback
from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--variant', choices=['tour','bow-combat'], default='tour')
    args = parser.parse_args()
    out = args.output.resolve(); out.mkdir(parents=True, exist_ok=True)
    source = ROOT/('evidence10/world-foundations/journey/fresh-blade/00_INITIAL_KIT.json' if args.variant=='tour' else 'evidence10/pursuit/fresh-bow/02_SOURCE_READY.json')
    initial = json.loads(source.read_text(encoding='utf-8'))
    report = {'method': __doc__, 'variant':args.variant,'source': str(source.relative_to(ROOT)),
              'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'html_sha256': hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(),
              'viewport': {'width': 1280, 'height': 720}, 'quality': 'balanced',
              'events': [], 'samples': [], 'browser_errors': [],
              'human_acceptance': False, 'sustained_performance_qualification': False}
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw): super().__init__(*a, directory=str(ROOT), **kw)
        def log_message(self, *_): pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    start = time.monotonic()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(**launch_kwargs('hardware'))
            report['browser'] = browser.version
            context = browser.new_context(viewport=report['viewport'], record_video_dir=str(out), record_video_size=report['viewport'])
            page = context.new_page(); page.add_init_script('window.__ETERNITIES_TEST_MODE=true;')
            page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
            response = page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
            page.wait_for_function('()=>!!window.Realm')
            page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"')
            assert hashlib.sha256(response.body()).hexdigest() == report['html_sha256']
            page.evaluate('(w)=>Realm.test.replace(w)', initial)
            page.evaluate('Realm.test.quality("balanced");Realm.test.setTime(17)')
            report['renderer'] = page.evaluate('Realm.diagnostics.renderer')
            assert 'NVIDIA' in report['renderer'] and '3080' in report['renderer'], report['renderer']
            def mark(name):
                d = page.evaluate('Realm.diagnostics')
                event = {'name': name, 'seconds': time.monotonic()-start, 'scene': d['scene'], 'player': d['adventure']['player'], 'camera': d['camera'], 'dive': d['world']['dive'] if d['world'] else None}
                assert not d['adventure']['paused'] and not page.evaluate('document.hidden')
                report['events'].append(event); print(name, round(event['seconds'], 2), flush=True)
            def close():
                if page.locator('#rpg-window').evaluate('(e)=>e.open'): page.locator('#rpg-close').click()
            def walk(x,z):
                close(); assert page.evaluate('([x,z])=>Realm.test.move(x,z)', [x,z])['ok']
                page.evaluate('''async()=>{const start=performance.now();while(Realm.test.path.length){if(performance.now()-start>90000)throw Error('normal-time world walk timeout');await new Promise(r=>setTimeout(r,40));}}''')
                p=page.evaluate('Realm.diagnostics.adventure.player'); assert ((p['x']-x)**2+(p['z']-z)**2)**.5<.3
                mark(f'Normal accepted walk {x},{z}')
            def enter(id):
                close(); page.keyboard.press('j'); page.locator('[data-rpg="open"][data-id="worlds"]').click()
                if page.locator('[data-rpg="world-list"]').count(): page.locator('[data-rpg="world-list"]').click()
                page.locator('[data-rpg="world-select"][data-id="'+id+'"]').click(); page.locator('[data-rpg="world-preview"]').click(); page.locator('[data-rpg="world-confirm"]').click(); mark('Deliberate crossing '+id)
            def view(mode,yaw=0,elevation=.2,distance=11):
                if (page.evaluate('Realm.diagnostics.camera.projection')=='orthographic') != (mode=='diorama'): page.keyboard.press('v')
                page.evaluate('v=>Realm.test.view(v)', {'yaw':yaw,'elevation':.66 if mode=='diorama' else elevation,'half':16,'distance':distance,'zoom':16/17.5,'overview':False})
                page.wait_for_timeout(400); mark(mode+' view')
            def shot(name): page.screenshot(path=str(out/(name+'.png'))); mark('Screenshot '+name)
            def measure(label):
                data = page.evaluate('''async()=>{const xs=[],canvas=document.querySelector('#world');let prior=null;await new Promise(done=>{function frame(t){if(prior!==null)xs.push(t-prior);prior=t;if(xs.length<180)requestAnimationFrame(frame);else done();}requestAnimationFrame(frame);});const d=Realm.diagnostics;return{intervals_ms:xs,scene:d.scene,projection:d.camera.projection,renderer:d.renderer,hidden:document.hidden,paused:d.adventure.paused,quality:Realm.state.settings.quality,drawing_buffer:{width:canvas.width,height:canvas.height},metrics:{drawCalls:d.metrics.drawCalls,instances:d.metrics.instances,triangles:d.metrics.triangles}};}''')
                xs=sorted(data['intervals_ms']); assert len(xs)==180 and not data['paused'] and not data['hidden']
                data.update(label=label,median_ms=statistics.median(xs),p95_ms=xs[int(.95*(len(xs)-1))],maximum_ms=max(xs),over_33_333_ms=sum(x>33.333 for x in xs))
                report['samples'].append(data); mark('Short hardware RAF sample '+label)
            def home():
                page.locator('#world-home').click(); assert page.evaluate('Realm.diagnostics.scene')=='valley'; walk(18,6); mark('Free home return')
            def fight():
                style=page.evaluate('Realm.diagnostics.adventure.weapon.style');walk(44,-82);view('third',yaw=.12,elevation=.17,distance=8);walk(44,-90 if style=='bow' else -92.9)
                page.keyboard.press('Tab');assert page.evaluate('Realm.diagnostics.adventure.tactics.target')=='hell-salvage-sentinel';mark('Real Tab selects sentinel')
                page.wait_for_function('()=>Realm.diagnostics.adventure.enemies.find(e=>e.id==="hell-salvage-sentinel").mode==="windup"');health=page.evaluate('Realm.state.adventure.hp');page.keyboard.press('3');mark('Real Brace during sentinel tell')
                page.wait_for_function('(hp)=>Realm.state.adventure.hp<hp',arg=health);after=page.evaluate('Realm.state.adventure.hp');assert 0<health-after<=4
                report['combat']={'style':style,'health_before_guarded_hit':health,'health_after_guarded_hit':after,'enemy_id':'hell-salvage-sentinel','impact_events':[]};shot('hell-'+style+'-guarded-hit');page.keyboard.press('1');mark('Real stationary autoattack starts')
                prior=90;started=time.monotonic()
                while True:
                    d=page.evaluate('Realm.diagnostics');enemy=next(e for e in d['adventure']['enemies'] if e['id']=='hell-salvage-sentinel')
                    if enemy['hp']!=prior:report['combat']['impact_events'].append({'seconds':time.monotonic()-started,'hp_before':prior,'hp_after':enemy['hp'],'projectiles':len(d['adventure']['arrows'])});prior=enemy['hp']
                    if enemy['hp']==0:break
                    assert time.monotonic()-started<30 and page.evaluate('Realm.state.adventure.hp')>0;page.wait_for_timeout(40)
                assert page.evaluate('Realm.state.journeys.realms.hell.defeated')==['hell-salvage-sentinel'];mark('Actual sentinel defeat recorded');shot('hell-'+style+'-defeated')
            walk(18,6); report['footage_start_seconds']=time.monotonic()-start
            if args.variant=='bow-combat':
                enter('hell');fight();home()
            else:
                enter('earthlands'); view('third',yaw=.65); walk(0,91); shot('01-earth-bridge-approach'); walk(0,55); view('third',yaw=1.4,elevation=.16,distance=16); shot('02-earth-channel-third'); measure('Earth channel third person')
                view('diorama',yaw=1.5); walk(0,23); shot('03-earth-bridge-diorama'); home()
                enter('heaven'); view('third',yaw=.2); walk(-14,6.7); page.keyboard.press('e'); page.locator('[data-rpg="world-accept"]').click(); close(); walk(0,-1); page.keyboard.press('e'); page.locator('[data-rpg="world-observe"][data-id="first"]').click(); close(); mark('Heaven first objective accepted through UI'); walk(0,-25); shot('04-heaven-garden-third'); measure('Heaven garden third person'); view('diorama',yaw=.6); shot('05-heaven-garden-diorama'); home()
                enter('hell');view('diorama',yaw=.7);walk(-10,25.7);shot('hell-refuge-open-roof');view('third');walk(12,-8);shot('06-hell-industrial-road-third');measure('Hell industrial approach third person');view('diorama',yaw=.7);shot('07-hell-refuge-diorama');fight();home()
                enter('atlantis'); view('third'); walk(-6,0); shot('08-atlantis-civic-third'); walk(8,-16); page.keyboard.press('e'); page.locator('[data-rpg="world-dive"]').click(); view('third',yaw=0,elevation=.07,distance=3)
                page.keyboard.down('g'); page.wait_for_function('()=>Realm.test.worldDiveStatus().y<=-2.35'); page.keyboard.up('g')
                page.keyboard.down('w'); page.wait_for_function('()=>Realm.diagnostics.adventure.player.z<=-29'); page.keyboard.up('w'); shot('09-atlantis-underwater'); measure('Atlantis submerged gallery third person');view('diorama',yaw=.7);shot('atlantis-gallery-diorama');view('third',yaw=0,elevation=.07,distance=3)
                page.keyboard.down('g'); page.wait_for_function('()=>Realm.test.worldDiveStatus().y<=-2.65'); page.keyboard.up('g'); page.keyboard.down('w'); page.wait_for_function('()=>Realm.diagnostics.adventure.player.z<=-33.5'); page.keyboard.up('w'); view('third',yaw=0,elevation=.08,distance=2); page.wait_for_timeout(350)
                assert page.evaluate('Realm.test.worldDiveStatus().dryCourt')=='bellglass-air'; assert page.evaluate('Realm.test.worldDiveStatus().body')=='air'; assert page.evaluate('Realm.test.worldDiveStatus().camera')=='air'; shot('10-atlantis-air-court'); home()
                enter('cosmos'); view('third',yaw=.3); walk(0,0); shot('11-cosmos-three-lamps-third'); measure('Cosmos lamps third person'); view('diorama',yaw=.8); shot('12-cosmos-three-lamps-diorama'); home()
            final=page.evaluate('Realm.state')
            for k in ['owned','equipment','arsenal','starter','pursuit','classPath','reward','road','crossing','beacon','companion','defeated','drops','xp','ore','coins']: assert final['adventure'][k]==initial['adventure'][k],k
            for k in ['notes','score','scoreRevision','retreat','visitor']: assert final[k]==initial[k],k
            if args.variant=='tour':assert final['journeys']['realms']['heaven']['active']['observed']==['first']
            assert final['journeys']['realms']['hell']['defeated']==['hell-salvage-sentinel']
            assert not report['browser_errors']; report['canonical_ownership_preserved']=True; report['status']='passed'; report['normal_time_seconds']=time.monotonic()-start; report['footage_end_seconds']=time.monotonic()-start
            context.close(); report['video_path']=str(page.video.path()); browser.close()
    except Exception:
        report['status']='failed'; report['traceback']=traceback.format_exc(); raise
    finally:
        server.shutdown(); server.server_close(); (out/'REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')

if __name__ == '__main__': main()
