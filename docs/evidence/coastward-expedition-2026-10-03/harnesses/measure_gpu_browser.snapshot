"""Measure browser frame intervals with renderer provenance.

This reports frame times, never inferred FPS. It uses an isolated context and
loopback origin; set FIRSTLIGHT_CHROMIUM_EXECUTABLE to choose Chrome or Edge.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse, hashlib, json, threading, platform, subprocess, datetime, math

ROOT = Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *_args): pass

def percentile(values, fraction):
    """Nearest-rank percentile; retain raw samples beside each summary."""
    ordered = sorted(values)
    if not ordered or not 0 <= fraction <= 1:
        raise ValueError('A nonempty sample and fraction in [0, 1] are required')
    return ordered[max(0, math.ceil(len(ordered) * fraction) - 1)]

def main():
    from playwright.sync_api import sync_playwright
    from browser_support import launch_kwargs
    ap = argparse.ArgumentParser(); ap.add_argument("--frames", type=int, default=600); ap.add_argument("--quality", choices=("low", "balanced", "high"), default="balanced"); ap.add_argument("--renderer", choices=("software", "hardware"), default="software"); ap.add_argument("--fixture", type=Path, help="Labelled command-earned save, loaded through the app restore path"); ap.add_argument("--scenes", type=Path, help="JSON list of {name,expression} setup snippets; expressions may await accepted real-time walking"); ap.add_argument("--output", type=Path, default=Path("evidence10/gpu-frame-report.json")); args=ap.parse_args()
    if args.frames < 2: ap.error("--frames must be at least 2")
    html = ROOT / "FIRSTLIGHT_VALLEY.html"; expected = hashlib.sha256(html.read_bytes()).hexdigest()
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler); threading.Thread(target=server.serve_forever, daemon=True).start()
    result = {"measured_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "html_sha256": expected, "origin": f"http://127.0.0.1:{server.server_port}/FIRSTLIGHT_VALLEY.html", "quality": args.quality, "renderer_requested": args.renderer, "frames_requested": args.frames, "viewport": {"width":1920,"height":1080}, "platform":platform.platform(), "method":"Normal RAF intervals in isolated headless Chromium, device scale 1; 1.5-second setup warmup excluded. Nearest-rank percentiles. Every sampled frame checks that the page is visible, the simulation is unpaused and the scene stays fixed. No video capture or accelerated ticks during sampling. Browser-frame intervals are not GPU render time, monitor presentation timing or human qualification.", "browser_errors": [], "external_requests": [], "success": False}
    result['harness_sha256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    result['browser_support_sha256'] = hashlib.sha256((ROOT/'tools/browser_support.py').read_bytes()).hexdigest()
    result['method'] += ' Actual WebGL mode and the originally observed renderer must persist on every frame; per-frame diagnostics overhead is included. Traveler HP is checked before and after each sample, outside the timed RAF intervals; both must be positive.'
    if args.fixture:
        result["fixture"] = str(args.fixture)
        result["fixture_sha256"] = hashlib.sha256(args.fixture.read_bytes()).hexdigest()
    if args.scenes:
        result["scene_setup"] = str(args.scenes)
        result["scene_setup_sha256"] = hashlib.sha256(args.scenes.read_bytes()).hexdigest()
    try:
        result["nvidia_smi"] = subprocess.check_output(["nvidia-smi", "--query-gpu=name,driver_version,memory.total", "--format=csv,noheader,nounits"], text=True, timeout=10).strip()
    except (OSError, subprocess.SubprocessError) as error:
        result["nvidia_smi_unavailable"] = str(error)
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(**launch_kwargs(args.renderer)); result["browser_version"] = browser.version
            cdp = browser.new_browser_cdp_session(); result["cdp_system_info"] = cdp.send("SystemInfo.getInfo")
            page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
            origin = result['origin'].rsplit('/', 1)[0] + '/'
            def route(request):
                if request.request.url.startswith(origin): request.continue_()
                else:
                    result['external_requests'].append(request.request.url)
                    request.abort()
            page.route('**/*', route)
            page.on("pageerror", lambda error: result["browser_errors"].append(str(error))); page.add_init_script("window.__ETERNITIES_TEST_MODE=true;"); response = page.goto(result["origin"], wait_until="load"); result["response_sha256"] = hashlib.sha256(response.body()).hexdigest()
            page.wait_for_function("window.Realm")
            if args.fixture: page.evaluate("state => Realm.test.replace(state)", json.loads(args.fixture.read_text(encoding="utf-8")))
            page.wait_for_function("window.Realm"); page.evaluate(f'Realm.test.quality({json.dumps(args.quality)});Realm.test.render()')
            result["webgl"] = page.evaluate("""()=>{const c=document.querySelector('#world'),g=c&&c.getContext('webgl2');return g?{renderer:g.getExtension('WEBGL_debug_renderer_info')?g.getParameter(g.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL):'unavailable',vendor:g.getExtension('WEBGL_debug_renderer_info')?g.getParameter(g.getExtension('WEBGL_debug_renderer_info').UNMASKED_VENDOR_WEBGL):'unavailable',drawing_buffer:{width:g.drawingBufferWidth,height:g.drawingBufferHeight},device_pixel_ratio:devicePixelRatio,mode:Realm.diagnostics.mode}: {mode:'unavailable'} }""")
            result["hardware_renderer"] = result["webgl"].get("mode")=="webgl2" and bool(result["webgl"].get("renderer")) and result["webgl"].get("renderer")!="unavailable" and not any(x in result["webgl"].get("renderer", "").lower() for x in ("swiftshader", "llvmpipe", "software"))
            scenes = json.loads(args.scenes.read_text(encoding="utf-8")) if args.scenes else [{"name": page.evaluate("Realm.diagnostics.scene"), "expression": "Realm.test.render()"}]
            result["scenes"] = []
            for scene in scenes:
                setup = page.evaluate(scene["expression"]); page.wait_for_timeout(1500); before = page.evaluate("Realm.diagnostics")
                hp_before = page.evaluate("Realm.state.adventure.hp")
                assert hp_before > 0, 'Sampling requires a living traveler after setup'
                sampling = page.evaluate("""({n,renderer})=>new Promise((resolve,reject)=>{
                  const scene=Realm.diagnostics.scene,a=[];let last,raf,done=false;
                  const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);if(error)reject(error);else resolve({intervals:a,scene,visible_unpaused_webgl_checks:a.length+1});};
                  const visibility=()=>{if(document.hidden)finish(Error('Sampling interrupted by hidden page'));};
                  const timer=setTimeout(()=>finish(Error('Sampling exceeded bounded deadline')),Math.min(180000,Math.max(30000,n*500)));
                  document.addEventListener('visibilitychange',visibility);
                  function f(t){try{const d=Realm.diagnostics;if(document.hidden||d.adventure.paused||d.scene!==scene){finish(Error('Sampling interrupted by hidden page, pause or scene change'));return;}if(d.mode!=='webgl2'||d.renderer!==renderer){finish(Error('Sampling lost the original WebGL renderer'));return;}if(last!==undefined)a.push(t-last);last=t;if(a.length<n)raf=requestAnimationFrame(f);else finish();}catch(error){finish(error);}}
                  raf=requestAnimationFrame(f);
                })""", {'n':args.frames,'renderer':result['webgl']['renderer']})
                intervals = sampling['intervals']; pct=lambda p: percentile(intervals,p)
                hp_after = page.evaluate("Realm.state.adventure.hp")
                assert hp_after > 0, 'The traveler died during the measured sample'
                result["scenes"].append({"name":scene["name"],"setup_result":setup,"observed_scene":sampling['scene'],"visible_unpaused_webgl_checks":sampling['visible_unpaused_webgl_checks'],"samples":len(intervals),"seconds":sum(intervals)/1000,"hp_before":hp_before,"hp_after":hp_after,"before":before,"diagnostics":page.evaluate("Realm.diagnostics"),"frame_time_ms":{"p50":pct(.5),"p90":pct(.90),"p95":pct(.95),"p99":pct(.99),"max":max(intervals)},"intervals_over_33_333ms":sum(x>33.333 for x in intervals),"intervals_over_50ms":sum(x>50 for x in intervals),"raw_intervals_ms":intervals})
                args.output.parent.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(args.output.with_name(args.output.stem + "-" + str(len(result["scenes"])) + ".png")))
                print(json.dumps({"scene": scene["name"], "frame_time_ms": result["scenes"][-1]["frame_time_ms"]}), flush=True)
            assert result["response_sha256"]==expected, "Served HTML differs"
            assert hashlib.sha256(html.read_bytes()).hexdigest()==expected, 'HTML changed during measurement'
            if args.fixture: assert hashlib.sha256(args.fixture.read_bytes()).hexdigest()==result['fixture_sha256'], 'Fixture changed during measurement'
            if args.scenes: assert hashlib.sha256(args.scenes.read_bytes()).hexdigest()==result['scene_setup_sha256'], 'Setup changed during measurement'
            assert hashlib.sha256(Path(__file__).read_bytes()).hexdigest()==result['harness_sha256'], 'Measurement harness changed during run'
            assert hashlib.sha256((ROOT/'tools/browser_support.py').read_bytes()).hexdigest()==result['browser_support_sha256'], 'Browser launcher changed during run'
            if args.renderer=="hardware": assert result["hardware_renderer"], "Hardware acceleration not confirmed"
            assert not result["browser_errors"], result["browser_errors"]
            assert not result['external_requests'], result['external_requests']
            result["success"] = True
            browser.close()
    finally:
        server.shutdown(); args.output.parent.mkdir(parents=True, exist_ok=True); args.output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps({'success':result['success'], 'report':str(args.output), 'html_sha256':expected, 'scene_count':len(result['scenes'])})); return 0
if __name__ == '__main__': raise SystemExit(main())
