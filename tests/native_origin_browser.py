"""Native loopback-origin persistence smoke test.

This is a bounded browser smoke test, not a device or performance test. It uses
an isolated temporary Chromium profile and a deliberately labelled synthetic
state change solely to exercise the production save path.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs, read_utf8, browser_output

ROOT = Path(__file__).resolve().parents[1]
OUT = browser_output(ROOT / "evidence10" / "native")
OUT.mkdir(parents=True, exist_ok=True)
HTML = read_utf8(ROOT / "FIRSTLIGHT_VALLEY.html")
EXPECTED_HASH = hashlib.sha256(HTML.encode("utf-8")).hexdigest()
report = {"method": __doc__, "checks": [], "errors": [], "browser_errors": [], "html_sha256": EXPECTED_HASH}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *_args):
        pass

def check(name, passed, **details):
    item = {"name": name, "passed": bool(passed), **details}
    report["checks"].append(item)
    print(("PASS " if passed else "FAIL ") + name, flush=True)
    if not passed:
        raise AssertionError(name)

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{server.server_port}/FIRSTLIGHT_VALLEY.html"
report["origin"] = url

try:
    with tempfile.TemporaryDirectory(prefix="firstlight-native-") as profile:
        with sync_playwright() as pw:
            launch = chromium_launch_kwargs()
            launch["headless"] = True
            context = pw.chromium.launch_persistent_context(profile, **launch, accept_downloads=True, viewport={"width": 1280, "height": 800})
            page = context.new_page()
            page.on("pageerror", lambda error: report["browser_errors"].append(str(error)))
            page.add_init_script("window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=false;")
            response = page.goto(url, wait_until="load")
            check("Loopback response matches exact current HTML", hashlib.sha256(response.body()).hexdigest() == EXPECTED_HASH)
            page.wait_for_function("window.Realm")
            report["browser_user_agent"] = page.evaluate("navigator.userAgent")
            page.evaluate('Realm.test.quality("low");Realm.test.render()')
            check("Loopback page loads exact current HTML", page.url == url and page.locator("canvas").count() > 0)
            check("Rendered gameplay canvas is visible", page.locator("canvas").first.is_visible())
            page.locator("body").focus()
            page.keyboard.press("m")
            page.wait_for_timeout(100)
            check("M opens Map on native origin", page.locator("#rpg-window").evaluate("e => e.open") and page.locator('#rpg-tabs [aria-current="page"][data-id="atlas"]').count() == 1)
            page.keyboard.press("Escape")
            page.keyboard.press("c")
            page.wait_for_timeout(100)
            check("C opens Character on native origin", page.locator("#rpg-window").evaluate("e => e.open") and page.locator('#rpg-tabs [aria-current="page"][data-id="equipment"]').count() == 1)
            page.keyboard.press("Escape")
            # Synthetic fixture change, then invoke the real production save path.
            marker = "native-origin-command-smoke-marker"
            accepted = page.evaluate("(marker) => Realm.test.act('native-note-1','note',{text: marker})", marker)
            check("Synthetic notebook command is accepted", accepted.get("ok") is True)
            page.evaluate("Realm.test.save();Realm.test.render()")
            stored = page.evaluate("localStorage.getItem('eternities.realm10.save.v9')")
            check("Production save writes real loopback localStorage", any(n.get("text") == marker for n in json.loads(stored or "{}").get("notes", [])), fixture="synthetic accepted-command Chronicle note")
            page.screenshot(path=str(OUT / "NATIVE_ORIGIN_GAMEPLAY.png"))
            context.close()
            context = pw.chromium.launch_persistent_context(profile, **launch, accept_downloads=True, viewport={"width": 1280, "height": 800})
            page = context.new_page()
            page.on("pageerror", lambda error: report["browser_errors"].append(str(error)))
            page.add_init_script("window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=false;")
            page.goto(url, wait_until="load")
            page.wait_for_function("window.Realm")
            persisted = page.evaluate("localStorage.getItem('eternities.realm10.save.v9')")
            check("Fresh browser relaunch retains loopback localStorage", any(n.get("text") == marker for n in json.loads(persisted or "{}").get("notes", [])))
            check("Realm state reload retains authored note", any(n.get("text") == marker for n in page.evaluate("Realm.state.notes")))
            check("Relaunched page still renders gameplay", page.locator("canvas").first.is_visible())
            context.close()
            check("No unhandled browser errors", not report["browser_errors"])
except Exception:
    report["errors"].append(traceback.format_exc())
    raise
finally:
    server.shutdown()
    server.server_close()
    report["passed"] = len(report["checks"]) == 11 and all(item["passed"] for item in report["checks"]) and not report["errors"] and not report["browser_errors"]
    (OUT / "NATIVE_ORIGIN_REPORT.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("RESULT", len([x for x in report["checks"] if x["passed"]]), report["passed"], flush=True)
