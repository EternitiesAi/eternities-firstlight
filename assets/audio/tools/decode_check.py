"""Real-browser check of the shipped audio on the box: headless chromium decodes every embedded cue through
RealmAudio, a score track decodes and starts, and a cue and a pitched bell play. Launch flags follow the door note:
linux uses the vulkan angle path so the page reads the gpu, not swiftshader.
Usage: /opt/flv/bin/python decode_check.py <path to index.html> <json out>
"""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ARGS = ["--use-angle=vulkan", "--enable-gpu", "--enable-features=Vulkan", "--ignore-gpu-blocklist",
        "--autoplay-policy=no-user-gesture-required"]
FX_TOTAL = 37
TRACK = "valley"

page_path = Path(sys.argv[1]).resolve()
out_path = Path(sys.argv[2])
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(args=ARGS, headless=True)
    page = browser.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    page.goto(page_path.as_uri(), wait_until="load", timeout=120000)
    gpu = page.evaluate("""() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2');
      if (!g) return 'no webgl2'; const d = g.getExtension('WEBGL_debug_renderer_info');
      return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'renderer hidden'; }""")
    result = page.evaluate("""async (track) => {
      const A = window.RealmAudio;
      const enabled = A.enable();
      const started = Date.now();
      let snap = A.snapshot();
      while (Date.now() - started < 60000 && Object.keys(snap.loaded).filter(k => k.startsWith('fx/')).length < 37) {
        await new Promise(r => setTimeout(r, 100));
        snap = A.snapshot();
      }
      const fxLoaded = Object.keys(snap.loaded).filter(k => k.startsWith('fx/')).length;
      A.music(track);
      const musicStarted = Date.now();
      while (Date.now() - musicStarted < 60000 && A.snapshot().music !== track) {
        await new Promise(r => setTimeout(r, 100));
      }
      const cue = A.cue('hit') !== null;
      const bell = A.event('bell', { pitch: 440 }) !== null;
      await new Promise(r => setTimeout(r, 300));
      const final = A.snapshot();
      return { enabled, context: final.state, fxLoaded, music: final.music, cue, bell,
               loaded: final.loaded, voices: final.voices };
    }""", TRACK)
    browser.close()

report = {"gpu": gpu, "errors": errors, **result, "fx_total": FX_TOTAL}
report["ok"] = (result["enabled"] is True and result["fxLoaded"] == FX_TOTAL and result["music"] == TRACK
                and result["cue"] and result["bell"] and result["context"] == "running" and not errors
                and "NVIDIA" in str(gpu))
out_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in report.items() if k != "loaded"}, indent=2))
print("loaded seconds:", json.dumps({k: v for k, v in result["loaded"].items() if k.startswith("music/")}))
sys.exit(0 if report["ok"] else 1)
