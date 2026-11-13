#!/usr/bin/env python3
"""Heaven art check: the heaven realm at its arrival, the envoy's house, the garden and the relay corridor, in third person
and diorama, with frame-interval timing at the arrival. It drives the page's own hooks (move, the realm entry) from the
tour's saves, the same way the tour does, and writes frames and a report under --out."""
import argparse
import functools
import hashlib
import http.server
import json
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

import story_tour as st  # the tour's own page helpers: camera buttons, the frame sampler, the renderer probe
from browser_support import launch_kwargs

ROAD_MARKER = (18, 6)
SPOTS = {"envoy": (-14.5, 25.0), "garden": (0.0, -6.0), "relay": (0.0, -44.0)}
# the arrival is the realm's own entry point. the relay spot needs the save where the counterfeit relay is still active.
CASES = [
    ("05_ACTUAL_COURIER_ARRIVAL.json", ["arrival", "envoy", "garden"]),
    ("03_FALSE_SIGNAL_WATCH.json", ["relay"]),
]


def walk(page, x, z):
    moved = page.evaluate("p => Realm.test.move(p[0], p[1])", [x, z])
    if not (isinstance(moved, dict) and moved.get("ok")):
        raise RuntimeError("walk to %s,%s refused: %s" % (x, z, json.dumps(moved)))
    for _ in range(400):
        if page.evaluate("Realm.test.path.length") == 0:
            break
        page.evaluate("Realm.test.step(5)")
    gap = page.evaluate(
        "p => Math.hypot(Realm.diagnostics.adventure.player.x - p[0], Realm.diagnostics.adventure.player.z - p[1])", [x, z])
    if gap >= 1.6:
        raise RuntimeError("walk to %s,%s ended %.1f units away" % (x, z, gap))


def shoot(page, out, name):
    page.wait_for_timeout(2500)
    path = out / (name + ".png")
    page.screenshot(path=str(path))
    return str(path.relative_to(out.parent))


def run_case(browser, origin, saves, save_name, spots, out, report):
    page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script("window.__ETERNITIES_TEST_MODE=true;")
    try:
        page.goto(origin + "?tour=1", wait_until="load")
        page.wait_for_function("window.Realm && window.Realm.test")
        page.evaluate("Realm.test.quality('balanced')")
        state = json.loads((saves / save_name).read_text(encoding="utf-8"))
        page.evaluate("state => Realm.test.replace(state)", state)
        page.evaluate("Realm.test.pause(false)")
        walk(page, *ROAD_MARKER)
        entered = page.evaluate("id => Realm.tour.enterRealm(id)", "heaven")
        if not (isinstance(entered, dict) and entered.get("ok")):
            raise RuntimeError("entering heaven was refused: " + json.dumps(entered))
        report["renderer"] = page.evaluate(st.WEBGL_JS)
        for name in spots:
            if name == "arrival":
                page.wait_for_timeout(2500)
                report["timing"] = st.summary(page.evaluate(st.SAMPLE_JS, {"n": 300}))
            else:
                walk(page, *SPOTS[name])
            st.camera(page, "adventure")
            report["frames"][name + "-third"] = shoot(page, out, "heaven-" + name + "-third")
            st.camera(page, "follow")
            report["frames"][name + "-diorama"] = shoot(page, out, "heaven-" + name + "-diorama")
            st.camera(page, "adventure")
    finally:
        report["page_errors"].extend(errors)
        page.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--saves", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    out = args.out / "heaven"
    out.mkdir(parents=True, exist_ok=True)
    html = st.ROOT / "FIRSTLIGHT_VALLEY.html"
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(st.Quiet, directory=str(st.ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = "http://127.0.0.1:%d/FIRSTLIGHT_VALLEY.html" % server.server_port
    report = {"html_sha256": hashlib.sha256(html.read_bytes()).hexdigest(), "frames": {}, "timing": None,
              "page_errors": [], "renderer": None}
    try:
        with sync_playwright() as pw:
            launch = launch_kwargs("hardware")
            launch["args"] = launch["args"] + st.UNCAPPED
            browser = pw.chromium.launch(**launch)
            report["browser_version"] = browser.version
            for save_name, spots in CASES:
                run_case(browser, origin, args.saves, save_name, spots, out, report)
            browser.close()
    finally:
        server.shutdown()
        (args.out / "heaven.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"frames": len(report["frames"]), "timing": report["timing"],
                      "page_errors": len(report["page_errors"])}), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
