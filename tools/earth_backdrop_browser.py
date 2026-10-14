"""Bounded Hearthwater woodland visibility check, using an isolated local profile.

Oren's kit and Earth entry use visible controls; supported moveTo/.05s ticks
accelerate travel without body, gear or quest grants. V selects both cameras;
right-drag and wheel inspect the surroundings. Screenshots are actual software
WebGL with controlled frames and ordinary RAF disabled. A synchronous tree-only
ablation proves visible contribution and exact
restoration; it is a test control, not an alternate playable build. No movie,
personal storage, human enjoyment or hardware-performance claim.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import functools
import hashlib
import json
import os
import subprocess
import tempfile
import threading
import traceback

from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
OBSERVER = r'''() => {
 const proto=RealmArt.WorldArt.prototype, commit=proto.commit;
 let owner=null;
 proto.commit=function(...args){
  const result=commit.apply(this,args);
  if(this.room===RealmEarth.ROOM){owner=this;proto.commit=commit;}
  return result;
 };
 const clone=x=>JSON.parse(JSON.stringify(x));
 window.__woodland={
  ready:()=>!!owner&&proto.commit===commit,
  compare(){
   if(!this.ready())throw Error('Actual Earth renderer not observed');
   const e=owner.e,g=e.gl,saved=e.batches.filter(b=>b.items.some(i=>i.earthBackdropTree)).map(b=>({b,items:b.items,data:b.data,count:b.count}));
   const signature=()=>JSON.stringify({world:Realm.state,body:Realm.diagnostics.adventure.player,camera:e.camera,vp:Array.from(e.vp),solids:e.cameraSolids});
   const before=signature(),shadow=e.lastShadow,time=19,hour=Realm.state.hour,rain=Realm.state.weather==='rain';
   const frame=()=>{e.lastShadow=-1;e.render(time,hour,rain);const a=new Uint8Array(e.mainF.w*e.mainF.h*4);g.bindFramebuffer(g.FRAMEBUFFER,e.mainF.f);g.readPixels(0,0,e.mainF.w,e.mainF.h,g.RGBA,g.UNSIGNED_BYTE,a);g.bindFramebuffer(g.FRAMEBUFFER,null);return a;};
   const delta=(a,b)=>{let changedPixels=0,sumRGBDelta=0,maxRGBDelta=0;for(let j=0;j<a.length;j+=4){let d=0;for(let c=0;c<3;c++)d+=Math.abs(a[j+c]-b[j+c]);if(d>6)changedPixels++;sumRGBDelta+=d;maxRGBDelta=Math.max(maxRGBDelta,d);}return{changedPixels,sumRGBDelta,maxRGBDelta};};
   const restore=()=>{for(const s of saved){s.b.items=s.items;s.b.data=s.data;e.updateBatch(s.b);}};
   let removed=0;
   try{
    const original=frame();
    for(const s of saved){s.b.items=s.items.filter(i=>!i.earthBackdropTree);removed+=s.items.length-s.b.items.length;e.updateBatch(s.b);}
    const hidden=frame();restore();const restored=frame();
    return{removed,width:e.mainF.w,height:e.mainF.h,visible:delta(original,hidden),restoration:delta(original,restored),stateCameraCollisionUnchanged:signature()===before,batchesRestored:saved.every(s=>s.b.items===s.items&&s.b.data===s.data&&s.b.count===s.count),camera:clone(e.camera),metrics:clone(e.metrics),glError:g.getError(),treeRoots:saved.flatMap(s=>s.b.items.filter(i=>i.earthBackdropLayer===-1).map(i=>({id:i.earthBackdropTree,p:i.p,s:i.s})))};
   }finally{restore();e.lastShadow=shadow;}
  },
  dispose(){if(proto.commit!==commit)proto.commit=commit;delete window.__woodland;}
 };
}'''


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args(argv)
    out = args.output.resolve()
    if (not args.output.is_absolute() or out == Path(out.anchor)
            or out == ROOT or out.is_relative_to(ROOT) or ROOT.is_relative_to(out)
            or os.name == 'nt' and out.drive.upper() != 'D:'):
        parser.error('Use fresh bounded D evidence outside the game')
    out.mkdir(parents=True, exist_ok=False)
    files = sorted([*ROOT.glob('src/*.js'), *ROOT.glob('src/*.css'),
                    ROOT/'src/shell.html', ROOT/'build.py', Path(__file__).resolve(),
                    ROOT/'index.html', ROOT/'FIRSTLIGHT_VALLEY.html'])
    identity = lambda: {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    report = dict(method=__doc__, head=subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), source=identity(),
        checks=[], frames=[], errors=[], browser_errors=[], resources=dict(context_closed=False, server_closed=False),
        renderer='software', quality='low', viewport=[1280, 800], human_playtest=False)

    def check(name, ok):
        report['checks'].append(dict(name=name, passed=bool(ok)))
        print(('PASS ' if ok else 'FAIL ') + name, flush=True)
        if not ok:
            raise AssertionError(name)

    class Handler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    context = None
    try:
        with tempfile.TemporaryDirectory(prefix='firstlight-backdrop-') as profile, sync_playwright() as pw:
            context = pw.chromium.launch_persistent_context(profile, **launch_kwargs('software'), viewport=dict(width=1280, height=800))
            page = context.pages[0] if context.pages else context.new_page()
            page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
            page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
            response = page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='load')
            page.wait_for_function('!!window.Realm')
            check('served exact current HTML', hashlib.sha256(response.body()).hexdigest() == report['source']['index.html'])
            page.evaluate("Realm.test.quality('low');Realm.test.render()")
            page.evaluate(OBSERVER)

            def close():
                if page.locator('#rpg-window').evaluate('e=>e.open'):
                    page.locator('#rpg-close').click()

            def key(value):
                page.locator('#world').focus()
                page.keyboard.press(value)
                page.evaluate('Realm.test.render()')

            def walk(x, z):
                close()
                result = page.evaluate('''([x,z])=>{const r=Realm.test.move(x,z);if(!r.ok)return false;
                    for(let i=0;i<12000&&Realm.test.path.length;i++)Realm.test.step(.05);
                    const p=Realm.diagnostics.adventure.player;return Math.hypot(p.x-x,p.z-z)<.3;}''', [x,z])
                check(f'supported walk {x},{z}', result)
                page.evaluate('Realm.test.render()')

            check('fresh isolated character', not page.evaluate('Realm.state.adventure.started'))
            walk(11, 9)
            key('e')
            check('visible Oren interaction earns kit', page.evaluate('Realm.state.adventure.started'))
            walk(0, 23)
            key('e')
            page.locator('[data-rpg="earth-confirm"]').first.click()
            page.evaluate('Realm.test.render()')
            check('visible entry reaches actual Hearthwater', page.evaluate('Realm.diagnostics.scene===RealmEarth.ROOM&&__woodland.ready()'))
            walk(0, 10)
            walk(12, -26)
            close()
            key('p')
            for mode in ['diorama', 'third']:
                projection = 'orthographic' if mode == 'diorama' else 'perspective'
                if page.evaluate('Realm.diagnostics.camera.projection') != projection:
                    key('v')
                check(mode+' selected by visible V control', page.evaluate('Realm.diagnostics.camera.projection') == projection)
                for view in ['arrival', 'orbit']:
                    if view == 'orbit':
                        page.mouse.move(620, 420)
                        page.mouse.down(button='right')
                        page.mouse.move(820, 420, steps=12)
                        page.mouse.up(button='right')
                        if mode == 'diorama':
                            page.mouse.wheel(0, 420)
                    page.evaluate('Realm.test.render()')
                    result = page.evaluate('__woodland.compare()')
                    label = mode+'-'+view
                    report['frames'].append(dict(label=label, **result))
                    check(label+' ablates only thirty complete trees', result['removed'] == 120 and len(result['treeRoots']) == 30)
                    check(label+' exact image and state restoration', result['stateCameraCollisionUnchanged'] and result['batchesRestored'] and result['restoration']['sumRGBDelta'] == 0 and result['glError'] == 0)
                    page.screenshot(path=str(out/(label+'.png')))
            check('woodland contributes visible scene pixels', any(f['visible']['changedPixels'] > 0 for f in report['frames']))
            check('no unhandled browser errors', not report['browser_errors'])
            page.evaluate('__woodland.dispose()')
            context.close()
            context = None
            report['resources']['context_closed'] = True
    except Exception:
        report['errors'].append(traceback.format_exc())
    finally:
        if context is not None:
            try:
                context.close()
                report['resources']['context_closed'] = True
            except Exception as error:
                report['errors'].append('context cleanup: '+str(error))
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
        report['resources']['server_closed'] = not thread.is_alive()
        report['source_unchanged'] = identity() == report['source']
        report['passed'] = (bool(report['checks']) and all(c['passed'] for c in report['checks'])
                            and not report['errors'] and not report['browser_errors']
                            and report['source_unchanged'] and all(report['resources'].values()))
        with (out/'REPORT.json').open('x', encoding='utf-8') as stream:
            json.dump(report, stream, indent=2)
            stream.write('\n')
    print(json.dumps(dict(passed=report['passed'], checks=len(report['checks']), errors=report['errors'])), flush=True)
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
