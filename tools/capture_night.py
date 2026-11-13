"""Night set-piece frames on the box GPU, in the adventure and wide cameras. The saves come from tools/night_frames_save.cjs
and pass the real validators. Each frame is written as a PNG for a person to look at, next to a report of the renderer,
the night state and the saga's view of Briar at that moment. Chromium is launched with the hardware GPU arguments; the
report says whether the renderer really is the NVIDIA GPU, so a SwiftShader run cannot pass as hardware."""
import argparse
import functools
import http.server
import json
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from browser_support import launch_kwargs  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    handler = functools.partial(Quiet, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f'http://127.0.0.1:{server.server_port}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='frames')
    args = ap.parse_args()
    out = Path(args.out)
    frames = out / 'frames'
    frames.mkdir(parents=True, exist_ok=True)
    saves = out / 'saves'
    subprocess.run(['node', str(ROOT / 'tools/night_frames_save.cjs'), str(saves)], check=True)
    report = {'renderer': None, 'browser': None, 'browser_errors': [], 'frames': []}
    server, origin = serve()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(**launch_kwargs('hardware'))
            report['browser'] = browser.version
            page = browser.new_page(viewport={'width': 1280, 'height': 800})
            page.add_init_script('window.__ETERNITIES_TEST_MODE=true;')
            page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
            page.goto(origin + '/index.html')
            page.wait_for_function('()=>!!window.Realm')
            report['renderer'] = page.evaluate('Realm.diagnostics.renderer')
            ev = lambda js, arg=None: page.evaluate(js, arg)

            def walk(x, z, limit=60):
                ev('([x,z])=>Realm.test.move(x,z)', [x, z])
                t0 = time.monotonic()
                while time.monotonic() - t0 < limit:
                    p = ev('()=>Realm.state.adventure.player ?? Realm.state.player')
                    if ((p['x'] - x) ** 2 + (p['z'] - z) ** 2) ** 0.5 < 1.3:
                        return
                    time.sleep(0.5)

            def shot(name, mode):
                state = ev('()=>({night:Realm.state.night,briar:Realm.state.saga.briar,room:Realm.state.player})')
                page.screenshot(path=str(frames / f'{name}-{mode}.png'))
                report['frames'].append({'name': name, 'camera': mode, 'night': state['night'], 'briar': state['briar']})

            for mode in ['adventure', 'wide']:
                # The lit crossing: the night has begun on arrival; Briar runs to the device and the travellers wait.
                save = json.loads((saves / 'night-lit.json').read_text(encoding='utf-8'))
                save['settings']['cameraMode'] = mode
                ev('(w)=>Realm.test.replace(w)', save)
                walk(0, 3)
                ev('()=>Realm.test.adventure("night-frame-travel","waystone-travel",{id:"bellweather"})')
                t0 = time.monotonic()
                while time.monotonic() - t0 < 30 and not ev('()=>Realm.state.night.started'):
                    time.sleep(0.5)
                walk(11.8, 19.0)
                time.sleep(12)
                shot('night-lit', mode)
                # The quiet after the bite: the device is broken, Briar is gone, the bridge is quiet.
                save = json.loads((saves / 'night-quiet.json').read_text(encoding='utf-8'))
                save['settings']['cameraMode'] = mode
                ev('(w)=>Realm.test.replace(w)', save)
                walk(0, 3)
                ev('()=>Realm.test.adventure("night-frame-travel-q","waystone-travel",{id:"bellweather"})')
                time.sleep(2)
                walk(11.8, 19.0)
                time.sleep(2)
                shot('night-quiet-bridge', mode)
                walk(0, 17)
                ev('()=>Realm.test.adventure("night-frame-leave","waystone-travel",{id:"commons"})')
                time.sleep(2)
                walk(1.5, 6)
                time.sleep(5)
                shot('night-quiet-envoy', mode)
            browser.close()
    finally:
        server.shutdown()
    report['nvidia'] = bool(report['renderer']) and 'NVIDIA' in report['renderer']
    report['browser_errors'] = report['browser_errors'][:20]
    (out / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'renderer': report['renderer'], 'nvidia': report['nvidia'], 'frames': len(report['frames']),
                      'browser_errors': len(report['browser_errors'])}))


if __name__ == '__main__':
    main()
