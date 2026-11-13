#!/usr/bin/env python3
"""Story tour on the box GPU. Each scene loads a command-earned checkpoint (tools/story_tour_saves.cjs, indexed by
beats-index.json) through the page's own restore path, takes a third-person frame and a diorama frame through the page's
own camera buttons, and records 600 uncapped frame intervals. The run fails unless WebGL reads the NVIDIA L4.
usage: python3 tools/story_tour.py --saves <folder> --out <folder> [--frames 600]
"""
import argparse
import functools
import hashlib
import http.server
import json
import math
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from browser_support import launch_kwargs  # noqa: E402

# the frame distribution is measured without the display cap; the page's own loop runs as fast as the GPU lets it.
UNCAPPED = ["--disable-gpu-vsync", "--disable-frame-rate-limit"]

# scenes whose beat is a held key in the page. The feather's sight is hold z (src/feather-sight.js): true roads gold,
# counterfeit roads ash red. Each hold is the page's own feather-use saga command.
HOLD = {"feather": "z"}

SAMPLE_JS = """({n}) => new Promise((resolve, reject) => {
  const samples = []; let last; let raf; let done = false;
  const finish = (error) => { if (done) return; done = true; cancelAnimationFrame(raf); clearTimeout(timer); if (error) reject(error); else resolve(samples); };
  const timer = setTimeout(() => finish(new Error('sampling deadline')), 240000);
  function frame(t) {
    try {
      if (document.hidden) return finish(new Error('page hidden during sampling'));
      if (last !== undefined) samples.push(t - last);
      last = t;
      if (samples.length >= n) return finish(null);
      raf = requestAnimationFrame(frame);
    } catch (error) { finish(error); }
  }
  raf = requestAnimationFrame(frame);
})"""

WEBGL_JS = """() => {
  const canvas = document.querySelector('#world'), gl = canvas && canvas.getContext('webgl2');
  if (!gl) return null;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return { renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable', version: gl.getParameter(gl.VERSION) };
}"""


def percentile(values, fraction):
    ordered = sorted(values)
    return ordered[max(0, math.ceil(len(ordered) * fraction) - 1)]


def summary(intervals):
    return {
        "n": len(intervals),
        "p50": round(percentile(intervals, .5), 2),
        "p90": round(percentile(intervals, .9), 2),
        "p95": round(percentile(intervals, .95), 2),
        "p99": round(percentile(intervals, .99), 2),
        "max": round(max(intervals), 2),
        "mean": round(sum(intervals) / len(intervals), 2),
    }


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


CAMERA_JS = '''(mode) => {
  const el = document.querySelector('[data-rpg="camera"][data-id="' + mode + '"]');
  if (!el) return false;
  el.click();
  return true;
}'''


def camera(page, mode):
    # the page's own camera buttons, by their data-id (adventure = third person, follow = diorama). A DOM click runs the
    # page's own handler without pointer checks, so an overlay cannot turn the frame into a failed click.
    if not page.evaluate(CAMERA_JS, mode):
        raise RuntimeError("camera button missing: " + mode)


def scene_run(browser, origin, saves, row, out, frames, report):
    record = {"scene": row["scene"], "save": row["file"], "why": row["why"]}
    errors = []
    page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script("window.__ETERNITIES_TEST_MODE=true;")
    try:
        page.goto(origin, wait_until="load")
        page.wait_for_function("window.Realm && window.Realm.test")
        page.evaluate("Realm.test.quality('balanced')")
        state = json.loads((saves / row["file"]).read_text(encoding="utf-8"))
        record["replace"] = page.evaluate("state => Realm.test.replace(state)", state)
        # the scene's steps are the page's own commands (e.g. waystone-travel into the crossing), run after the home checkpoint.
        record["steps"] = [page.evaluate("s => Realm.test.act(s.act.id, s.act.type, s.act.payload)", step) for step in row.get("steps", [])]
        refused = [result for result in record["steps"] if not (isinstance(result, dict) and result.get("ok"))]
        if refused:
            raise RuntimeError("a scene step was refused: " + json.dumps(refused)[:400])
        page.evaluate("Realm.test.pause(false)")
        webgl = page.evaluate(WEBGL_JS)
        record["webgl"] = webgl
        if not webgl or "NVIDIA L4" not in webgl.get("renderer", ""):
            raise SystemExit("renderer is not the NVIDIA L4: " + json.dumps(webgl))
        page.wait_for_timeout(2500)
        record["room"] = page.evaluate("Realm.diagnostics.scene")
        record["hp"] = page.evaluate("Realm.state.adventure.hp")
        if row["scene"] == "credits":
            # the page's own credits screen, fed by the page's own epilogue data.
            page.evaluate("window.RealmCredits.show(window.RealmEpilogueData.CREDITS, {onDone: () => {}})")
            page.wait_for_timeout(2500)
        third = out / (row["scene"] + "-third.png")
        page.screenshot(path=str(third))
        record["third_person_frame"] = str(third.relative_to(out.parent))
        if row["scene"] in HOLD:
            # a held key is the page's own input; the feather's sight shows only while it is held.
            page.keyboard.down(HOLD[row["scene"]])
            page.wait_for_timeout(1800)
            sight = out / (row["scene"] + "-sight.png")
            page.screenshot(path=str(sight))
            page.keyboard.up(HOLD[row["scene"]])
            record["sight_frame"] = str(sight.relative_to(out.parent))
            page.wait_for_timeout(800)
        camera(page, "follow")
        page.wait_for_timeout(2500)
        diorama = out / (row["scene"] + "-diorama.png")
        page.screenshot(path=str(diorama))
        record["diorama_frame"] = str(diorama.relative_to(out.parent))
        camera(page, "adventure")
        page.wait_for_timeout(1500)
        intervals = page.evaluate(SAMPLE_JS, {"n": frames})
        record["fps_ms"] = summary(intervals)
        record["raw_intervals_ms"] = [round(v, 3) for v in intervals]
        record["paused_after"] = page.evaluate("Realm.diagnostics.adventure.paused")
        record["status"] = "reached"
    except SystemExit:
        raise
    except Exception as error:
        record["status"] = "failed"
        record["error"] = str(error)[:1500]
    record["page_errors"] = errors
    report["scenes"].append(record)
    print(json.dumps({k: record.get(k) for k in ("scene", "status", "fps_ms", "error")}), flush=True)
    page.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--saves", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--frames", type=int, default=600)
    args = ap.parse_args()
    if args.frames < 2:
        ap.error("--frames must be at least 2")
    index = json.loads((args.saves / "beats-index.json").read_text(encoding="utf-8"))
    html = ROOT / "FIRSTLIGHT_VALLEY.html"
    out = args.out / "tour"
    out.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = "http://127.0.0.1:%d/FIRSTLIGHT_VALLEY.html" % server.server_port
    report = {
        "html_sha256": hashlib.sha256(html.read_bytes()).hexdigest(),
        "saves_index_sha256": hashlib.sha256((args.saves / "beats-index.json").read_bytes()).hexdigest(),
        "quality": "balanced",
        "frames_per_scene": args.frames,
        "viewport": {"width": 1920, "height": 1080},
        "scenes": [],
    }
    try:
        with sync_playwright() as pw:
            launch = launch_kwargs("hardware")
            launch["args"] = launch["args"] + UNCAPPED
            browser = pw.chromium.launch(**launch)
            report["browser_version"] = browser.version
            for row in index:
                if not row["file"]:
                    report["scenes"].append({"scene": row["scene"], "status": "unreached", "why": row["why"]})
                    print("unreached " + row["scene"] + ": " + row["why"], flush=True)
                    continue
                scene_run(browser, origin, args.saves, row, out, args.frames, report)
            browser.close()
    finally:
        server.shutdown()
        (args.out / "tour.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    reached = [s for s in report["scenes"] if s.get("status") == "reached"]
    print(json.dumps({"reached": len(reached), "scenes": len(report["scenes"]), "report": str(args.out / "tour.json")}), flush=True)
    return 0 if all(s.get("status") in ("reached", "unreached") for s in report["scenes"]) else 1


if __name__ == "__main__":
    raise SystemExit(main())
