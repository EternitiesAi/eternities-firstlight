"""Walk the shell on a served build: title, new game, first steps, pause, settings, save and quit, continue, credits.

Run on the box from the build folder: python3 tools/shell_walk.py --root . --out shell-walk
The page is served on loopback and opened as a player would open it: no test mode, no #play hash,
so the title is the first thing on screen. One pass per viewport (1280x800 desktop, 390x844 phone),
a PNG per screen, shell-walk.json with every check and the renderer that drew the frames, and
exit 1 if any check or any page error fails.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import hashlib
import json
import sys
import threading

sys.dont_write_bytecode = True
from browser_support import launch_kwargs  # tools/browser_support.py: hardware means the real GPU on Linux hosts

VIEWPORTS = {'desktop': {'width': 1280, 'height': 800}, 'phone': {'width': 390, 'height': 844}}


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        return


def serve(root):
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(root)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def walk(page, view, out, check, report):
    def shot(name):
        page.screenshot(path=str(out / (view + '-' + name + '.png')))
        report['shots'].append(view + '-' + name + '.png')

    page.wait_for_selector('#title-screen[open]', timeout=60000)
    page.wait_for_timeout(1800)
    report['viewports'][view] = {'diagnostics': page.evaluate(
        "()=>{const d=Realm.diagnostics;return {mode:d.mode,renderer:d.renderer,tour:d.camera.tour,paused:d.adventure.paused,errors:d.errors}}")}
    tour = report['viewports'][view]['diagnostics']['tour']
    check(view + ': title opens over the drifting valley', tour is True and page.is_visible('#title-screen'), 'camera.tour=' + str(tour))
    shown = page.evaluate("()=>[...document.querySelectorAll('#title-screen .title-menu button')].filter(b=>!b.hidden).map(b=>b.textContent.trim()).join('|')")
    check(view + ': a new save shows no continue', shown == 'New game|Characters|Settings|Credits', shown)
    shot('01-title')

    page.click('#title-new')
    page.wait_for_selector('#rpg-window[open]', timeout=20000)
    page.fill('#chars-name', 'Walker')
    page.click('#chars-create-submit')
    page.wait_for_function("()=>!document.querySelector('#title-screen').open", timeout=20000)
    page.wait_for_selector('#first-run:not([hidden])', timeout=20000)
    page.wait_for_timeout(500)
    check(view + ': new game closes the title and shows four first steps',
          page.evaluate("()=>document.querySelectorAll('#first-run li').length") == 4)
    shot('02-first-steps')

    page.keyboard.down('w')
    page.wait_for_timeout(450)
    page.keyboard.up('w')
    page.keyboard.press('v')
    page.keyboard.press('e')
    page.wait_for_timeout(600)
    done = page.evaluate("()=>document.querySelectorAll('#first-run li.done').length")
    check(view + ': walking, turning the view and interacting tick their steps', done >= 3, 'done=' + str(done))
    announced = page.evaluate("()=>document.querySelector('#first-run-status').textContent")
    check(view + ': a ticked step is announced in words', announced.startswith('Done: '), repr(announced))
    shot('03-first-steps-ticked')

    page.keyboard.press('Escape')
    page.wait_for_selector('#pause-menu[open]', timeout=10000)
    paused = page.evaluate("()=>Realm.diagnostics.adventure.paused")
    check(view + ': escape opens the pause menu and freezes the world', paused is True, 'paused=' + str(paused))
    focus = page.evaluate("()=>document.activeElement&&document.activeElement.id")
    check(view + ': the pause menu takes focus on resume', focus == 'pause-resume', 'focus=' + str(focus))
    shot('04-pause')

    page.click('#pause-settings')
    page.wait_for_selector('#drawer.open', timeout=10000)
    page.wait_for_selector('#drawer .key-table', timeout=10000)
    keys = page.evaluate("()=>document.querySelectorAll('#drawer .key-table tbody tr').length")
    check(view + ': settings opens from the pause menu with the key table', keys >= 12, 'rows=' + str(keys))
    page.wait_for_timeout(300)
    shot('05-settings')
    if view == 'desktop':
        page.click('#drawer button[data-action="text-size"][data-id="largest"]')
        page.wait_for_timeout(400)
        zoom = page.evaluate("()=>document.documentElement.dataset.uiText")
        check(view + ': text size largest is applied', zoom == 'largest', 'uiText=' + str(zoom))
        shot('06-settings-largest')
        page.click('#drawer button[data-action="text-size"][data-id="standard"]')
    check(view + ': volume sliders exist for each bus',
          page.evaluate("()=>['music','effects','ambience','ui'].every(b=>document.querySelector('#volume-'+b))"))
    page.click('#close-panel')
    page.wait_for_selector('#pause-menu[open]', timeout=10000)
    check(view + ': closing settings returns to the pause menu', True)

    page.click('#pause-quit')
    page.wait_for_selector('#title-screen[open]', timeout=15000)
    page.wait_for_timeout(500)
    cont = page.evaluate("()=>!document.querySelector('#title-continue').hidden")
    check(view + ': save and quit returns to the title with continue', cont is True)
    shot('07-title-continue')

    page.click('#title-credits')
    page.wait_for_selector('#credits-screen[open]', timeout=10000)
    page.wait_for_timeout(2600)
    shot('08-credits')
    page.keyboard.press('Escape')
    page.wait_for_function("()=>!document.querySelector('#credits-screen').open", timeout=10000)
    check(view + ': escape skips the credits back to the title', page.is_visible('#title-screen'))

    page.click('#title-continue')
    page.wait_for_function("()=>!document.querySelector('#title-screen').open", timeout=15000)
    page.wait_for_timeout(400)
    check(view + ': continue returns to the valley with the first steps still open',
          page.is_visible('#first-run'))


def run(args):
    root = Path(args.root).resolve()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    from playwright.sync_api import sync_playwright
    server = serve(root)
    url = 'http://127.0.0.1:%d/index.html' % server.server_port
    report = {'url': url, 'html_sha256': sha(root / 'index.html'), 'checks': [], 'shots': [], 'errors': [], 'viewports': {}}

    def check(label, ok, detail=''):
        report['checks'].append({'label': label, 'ok': bool(ok), 'detail': detail})

    launch = launch_kwargs(args.renderer)
    report['renderer_requested'] = args.renderer
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
            try:
                walk(page, view, out, check, report)
            except Exception as error:
                check(view + ': the walk reaches the end', False, repr(error)[:400])
                page.screenshot(path=str(out / (view + '-failure.png')))
                report['shots'].append(view + '-failure.png')
            finally:
                context.close()
        browser.close()
    server.shutdown()
    passed = sum(1 for c in report['checks'] if c['ok'])
    report['passed'] = passed
    report['total'] = len(report['checks'])
    (out / 'shell-walk.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'passed': passed, 'total': report['total'], 'page_errors': len(report['errors'])}))
    return 0 if passed == report['total'] and not report['errors'] else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--root', default=str(Path(__file__).resolve().parent.parent), help='folder holding index.html')
    parser.add_argument('--out', required=True, help='folder for PNGs and shell-walk.json')
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='hardware', help='hardware reaches the GPU on Linux hosts; software is SwiftShader')
    return run(parser.parse_args())


if __name__ == '__main__':
    raise SystemExit(main())
