"""Render the credits roll the epilogue passes (G.RealmEpilogueData.CREDITS) on a served build.

Run on the box from the build folder: python3 tools/credits_frames.py --root . --out credits-frames
Opens the page with #play (title skipped), calls RealmCredits.show with the epilogue sections exactly
as earth-homecoming-ui.js does, takes a frame mid-roll at 1280x800 and 390x844, checks the rolled text
names the score and effects sources, and checks that Esc skips the roll. Writes credits-frames.json.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import sys
import threading

sys.dont_write_bytecode = True
from browser_support import launch_kwargs  # tools/browser_support.py

VIEWPORTS = {'desktop': {'width': 1280, 'height': 800}, 'phone': {'width': 390, 'height': 844}}


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        return


def run(args):
    from playwright.sync_api import sync_playwright
    root = Path(args.root).resolve()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(root)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = 'http://127.0.0.1:%d/index.html#play' % server.server_port
    report = {'url': url, 'checks': [], 'errors': [], 'frames': []}

    def check(label, ok, detail=''):
        report['checks'].append({'label': label, 'ok': bool(ok), 'detail': detail})

    launch = launch_kwargs(args.renderer)
    report['launch_args'] = launch['args']
    with sync_playwright() as p:
        browser = p.chromium.launch(**launch)
        report['browser_version'] = browser.version
        for view, size in VIEWPORTS.items():
            phone = view == 'phone'
            context = browser.new_context(viewport=size, device_scale_factor=1, is_mobile=phone, has_touch=phone)
            page = context.new_page()
            page.set_default_timeout(30000)
            page.on('pageerror', lambda error, view=view: report['errors'].append(view + ': ' + str(error)))
            page.goto(url, wait_until='load', timeout=120000)
            page.wait_for_function('()=>!!window.RealmCredits&&!!window.RealmEpilogueData', timeout=60000)
            page.evaluate("()=>{RealmCredits.show(RealmEpilogueData.CREDITS,{onDone(){window.__creditsDone=true;}});}")
            page.wait_for_selector('#credits-screen[open]', timeout=10000)
            page.wait_for_timeout(9000)
            text = page.evaluate("()=>document.querySelector('.credits-track').innerText")
            sections = page.evaluate("()=>document.querySelectorAll('.credits-track .credits-section').length")
            page.screenshot(path=str(out / ('credits-epilogue-' + view + '.png')))
            report['frames'].append(view + '-credits-epilogue.png')
            check(view + ': the epilogue roll names the ACE-Step score sources', 'ACE-Step' in text, str(sections) + ' sections')
            check(view + ': the epilogue roll names the kenney effects sources', 'kenney' in text.lower())
            check(view + ': the roll keeps the epilogue sections', 'Postgame' in text and 'Firstlight' in text)
            page.keyboard.press('Escape')
            page.wait_for_function('()=>window.__creditsDone===true', timeout=10000)
            check(view + ': escape skips the roll and calls onDone', True)
            context.close()
        browser.close()
    server.shutdown()
    passed = sum(1 for c in report['checks'] if c['ok'])
    report['passed'] = passed
    report['total'] = len(report['checks'])
    (out / 'credits-frames.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'passed': passed, 'total': report['total'], 'page_errors': len(report['errors'])}))
    return 0 if passed == report['total'] and not report['errors'] else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--root', default=str(Path(__file__).resolve().parent.parent), help='folder holding index.html')
    parser.add_argument('--out', required=True, help='folder for PNGs and credits-frames.json')
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='hardware')
    return run(parser.parse_args())


if __name__ == '__main__':
    raise SystemExit(main())
