#!/usr/bin/env python3
"""Original Heaven campaign footage from an earned watch checkpoint. Native
import, journal walking, keyboard combat and physical courier following run at
ordinary RAF speed. No test flags, commands, grants, simulation steps, actor
relocation or camera-state writes. Known-route automation is not human play.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse, hashlib, json, math, os, subprocess, threading, time, traceback
from browser_support import launch_kwargs

ROOT = Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--renderer', choices=['hardware', 'software'], default='hardware')
    parser.add_argument('--choice', choices=['accessible-assist', 'broadened-activation'], default='accessible-assist')
    args = parser.parse_args()
    out, source = args.output.resolve(), args.source.resolve()
    if not args.output.is_absolute() or os.name == 'nt' and out.drive.lower() != 'd:' or out.exists():
        parser.error('Use a fresh absolute output directory on D: on Windows.')
    seed = json.loads(source.read_text(encoding='utf-8-sig'))
    quest = seed.get('heavenCampaign', {})
    if not quest.get('accepted') or 'begin-watch' not in quest.get('steps', []) or 'beam-disabled' in quest.get('steps', []) or quest.get('claimed'):
        parser.error('Use the labelled command-earned watch checkpoint before apparatus combat.')
    out.mkdir(parents=True)
    (out / 'SOURCE_WORLD.json').write_bytes(source.read_bytes())
    profile = out / 'profile'
    profile.mkdir()
    files = [p for p in (ROOT / 'src').glob('*') if p.is_file()] + [ROOT / 'build.py', Path(__file__).resolve(), ROOT / 'index.html', ROOT / 'FIRSTLIGHT_VALLEY.html']
    hashes = {str(p.relative_to(ROOT)): sha(p) for p in files}
    report = {'status': 'running', 'method': __doc__, 'source': str(source), 'source_sha256': sha(source),
              'git_head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'git_status': subprocess.check_output(['git', 'status', '--short'], cwd=ROOT, text=True).splitlines(),
              'html_sha256': sha(ROOT / 'index.html'), 'source_hashes': hashes, 'checks': [], 'events': [], 'errors': [],
              'viewport': {'width': 1440, 'height': 900}, 'human_acceptance': False, 'performance_qualification': False}

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def log_message(self, *a):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = 'http://127.0.0.1:' + str(server.server_port)
    report['origin'] = origin
    from playwright.sync_api import sync_playwright
    started = time.monotonic()
    context = video = pw = None

    def check(name, ok, detail=None):
        report['checks'].append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok:
            raise AssertionError(name + ': ' + str(detail))

    try:
        pw = sync_playwright().start()
        context = pw.chromium.launch_persistent_context(str(profile), **launch_kwargs(args.renderer), viewport=report['viewport'], record_video_dir=str(out), record_video_size=report['viewport'])
        page = context.new_page()
        video = page.video
        for blank in context.pages:
            if blank != page:
                blank.close()
        context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(origin + '/') else route.abort())
        page.on('pageerror', lambda e: report['errors'].append(str(e)))
        response = page.goto(origin + '/index.html', wait_until='load')
        page.wait_for_function('()=>!!window.Realm')
        page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"')
        check('exact served build', hashlib.sha256(response.body()).hexdigest() == report['html_sha256'])
        check('ordinary production surface', page.evaluate('()=>typeof Realm.test==="undefined"'))
        state = lambda: page.evaluate('()=>Realm.state')
        diag = lambda: page.evaluate('()=>Realm.diagnostics')

        def click(selector):
            q = page.locator(selector)
            check('unique native selector ' + selector, q.count() == 1, q.count())
            q.click()

        def close():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'):
                click('#rpg-close')

        def workspace(tab='heaven-campaign'):
            close()
            page.keyboard.press('j')
            if tab == 'heaven-campaign':
                click('#rpg-content [data-rpg="heaven-campaign-open"]')
            else:
                click('#rpg-tabs [data-rpg="open"][data-id="' + tab + '"]')

        def mark(label):
            report['events'].append({'label': label, 'seconds': time.monotonic() - started, 'diagnostics': diag(), 'ledger': state()['heavenCampaign']})
            page.screenshot(path=str(out / (label + '.png')))

        def walk(identifier):
            workspace()
            click('#rpg-content [data-rpg="heaven-campaign-walk"][data-id="' + identifier + '"]')
            if identifier == 'claim':
                point = definition['giver']
            elif identifier == 'instrument':
                point = next(s for s in definition['steps'] if s['id'] == 'fit-arrival-assist')
            else:
                point = next(s for s in definition['steps'] if s['id'] == identifier)
            t0, last, stable = time.monotonic(), None, None
            while time.monotonic() - t0 < 140:
                position = diag()['adventure']['player']
                check('alive during native route ' + identifier, state()['adventure']['hp'] > 0)
                distance = math.hypot(position['x'] - point['x'], position['z'] - point['z'])
                motion = math.inf if last is None else math.hypot(position['x'] - last['x'], position['z'] - last['z'])
                if distance < 2.8 and motion < .015:
                    stable = stable or time.monotonic()
                    if time.monotonic() - stable > .3:
                        return
                else:
                    stable = None
                last = position
                page.wait_for_timeout(120)
            raise TimeoutError('Native journal walking failed ' + identifier)

        def key_toward(point, duration=150):
            d = diag()
            p, yaw = d['adventure']['player'], d['camera']['yaw']
            dx, dz = point['x'] - p['x'], point['z'] - p['z']
            x = dx * math.cos(yaw) - dz * math.sin(yaw)
            z = dx * math.sin(yaw) + dz * math.cos(yaw)
            key = ('d' if x > 0 else 'a') if abs(x) > abs(z) else ('s' if z > 0 else 'w')
            page.keyboard.down(key)
            page.wait_for_timeout(duration)
            page.keyboard.up(key)

        workspace('characters')
        with page.expect_file_chooser() as chooser:
            click('#rpg-content [data-rpg="chars-import"]')
        chooser.value.set_files(str(source))
        page.wait_for_selector('#rpg-content [data-rpg="chars-confirm-import"]')
        click('#rpg-content [data-rpg="chars-confirm-import"]')
        page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer')
        check('earned watch imported unchanged', state()['heavenCampaign'] == seed['heavenCampaign'])
        close()
        click('#settings')
        page.locator('#quality').select_option('balanced')
        page.locator('#setting-timeFlow').uncheck()
        click('#close-panel')
        d = diag()
        report['browser'] = context.new_cdp_session(page).send('Browser.getVersion')
        report['renderer'] = d['renderer']
        check('real WebGL2', d['mode'] == 'webgl2')
        check('requested hardware acceleration', args.renderer != 'hardware' or not any(s in d['renderer'].lower() for s in ['swiftshader', 'software', 'llvmpipe']))
        workspace('worlds')
        if page.locator('#rpg-content [data-rpg="world-list"]').count():
            click('#rpg-content [data-rpg="world-list"]')
        click('#rpg-content [data-rpg="world-select"][data-id="heaven"]')
        click('#rpg-content [data-rpg="world-preview"]')
        click('#rpg-content [data-rpg="world-confirm"]')
        page.wait_for_function('()=>Realm.diagnostics.scene==="world-heaven"')
        definition = page.evaluate('()=>RealmHeavenCampaign.definition')
        check('owned Heaven diagnostics present', bool(diag()['heaven']['escort']))
        mark('01_garden-entry')
        combats = []
        for enemy_def in definition['enemies']:
            walk(enemy_def['defeatStep'])
            close()
            click('#rpg-hud [data-rpg="camera"][data-id="adventure"]')
            for _ in range(8):
                page.keyboard.press('Tab')
                if diag()['adventure']['tactics']['target'] == enemy_def['id']:
                    break
            check('explicit actual apparatus target', diag()['adventure']['tactics']['target'] == enemy_def['id'])
            click('#target-framing')
            page.keyboard.press('1')
            t0, observations, guarded, swapped = time.monotonic(), [], 0, False
            mark('02_' + enemy_def['attack']['kind'] + '-fight')
            while time.monotonic() - t0 < 160 and enemy_def['defeatStep'] not in state()['heavenCampaign']['steps']:
                d, current = diag(), state()
                ad = d['adventure']
                enemy = next((e for e in ad['enemies'] if e['id'] == enemy_def['id']), None)
                check('alive in ordinary apparatus combat', current['adventure']['hp'] > 0)
                if enemy is None:
                    break
                observations.append({'seconds': time.monotonic() - t0, 'enemy': enemy, 'health': current['adventure']['hp'], 'hits': ad['tactics']['hits']})
                if enemy['mode'] == 'windup' and current['adventure']['elapsed'] >= ad['tactics']['cooldowns']['guard'] and current['adventure']['stamina'] >= 20:
                    page.keyboard.press('3')
                    guarded += 1
                if current['adventure']['hp'] < 45 and current['adventure']['tonics']:
                    page.keyboard.press('6')
                player = ad['player']
                if ad['weapon']['style'] == 'blade' and math.hypot(player['x'] - enemy['x'], player['z'] - enemy['z']) > 2.15:
                    key_toward(enemy)
                    # Ordinary manual movement correctly cancels stationary
                    # autoattack. Deliberately re-enable it after repositioning.
                    if not diag()['adventure']['tactics']['auto']:
                        page.keyboard.press('1')
                else:
                    if not ad['tactics']['auto']:
                        page.keyboard.press('1')
                    page.wait_for_timeout(100)
                if not swapped and enemy['mode'] == 'windup':
                    page.keyboard.press('v')
                    swapped = True
            check('actual ordinary defeat ' + enemy_def['id'], enemy_def['defeatStep'] in state()['heavenCampaign']['steps'])
            combats.append({'enemy': enemy_def['id'], 'seconds': time.monotonic() - t0, 'observations': observations, 'guard_commands': guarded, 'native_camera_exchange': swapped})
            mark('03_' + enemy_def['attack']['kind'] + '-disabled')
        report['combat'] = combats
        walk('secure-service-route')
        workspace()
        click('#rpg-content [data-rpg="heaven-campaign-step"][data-id="secure-service-route"]')
        walk('invite-wayfarer')
        workspace()
        click('#rpg-content [data-heaven-step="invite-wayfarer"] [data-rpg="heaven-campaign-invite"]')
        close()
        mark('04_actual-courier-invited')
        t0, trace, waypoints, switched = time.monotonic(), [], set(), False
        while time.monotonic() - t0 < 220 and 'wayfarer-arrived' not in state()['heavenCampaign']['steps']:
            d = diag()
            e = d['heaven']['escort']
            check('actual invited actor exists', e and e['id'] == definition['escort']['id'])
            check('courier walk traveller alive', state()['adventure']['hp'] > 0)
            index = e['routeIndex']
            waypoints.add(index)
            trace.append({'seconds': time.monotonic() - t0, 'escort': e, 'player': d['adventure']['player']})
            target = definition['escort']['route'][min(index, len(definition['escort']['route']) - 1)]
            dx, dz = target['x'] - e['x'], target['z'] - e['z']
            distance = math.hypot(dx, dz)
            ahead = min(3, distance)
            point = {'x': e['x'] + dx / (distance or 1) * ahead, 'z': e['z'] + dz / (distance or 1) * ahead}
            player = d['adventure']['player']
            if math.hypot(player['x'] - point['x'], player['z'] - point['z']) > .55:
                key_toward(point, 160)
            else:
                page.wait_for_timeout(120)
            if not switched and index >= 3:
                page.keyboard.press('v')
                switched = True
                mark('05_courier-service-loop')
        check('full actual courier arrived', 'wayfarer-arrived' in state()['heavenCampaign']['steps'] and diag()['heaven']['escort']['phase'] == 'arrived')
        report['escort'] = {'seconds': time.monotonic() - t0, 'route_indices': sorted(waypoints), 'observations': trace, 'native_camera_exchange': switched}
        mark('06_actual-arrival')
        walk('fit-arrival-assist')
        workspace()
        click('#rpg-content [data-rpg="heaven-campaign-step"][data-id="fit-arrival-assist"]')
        click('#rpg-content [data-rpg="heaven-campaign-review"][data-id="' + args.choice + '"]')
        check('arrangement preview grants nothing', state()['heavenCampaign']['choice'] is None)
        mark('07_arrangement-preview')
        click('#rpg-content [data-rpg="heaven-campaign-confirm"][data-id="' + args.choice + '"]')
        check('explicit arrangement saved', state()['heavenCampaign']['choice'] == args.choice)
        before = state()['heavenCampaign']
        click('#rpg-content [data-rpg="heaven-campaign-activate"]')
        check('deliberate transient welcome', diag()['heaven']['activation']['active'] and state()['heavenCampaign'] == before)
        mark('08_welcome-stroke')
        page.wait_for_timeout(1400)
        check('instrument returns quietly without progress', not diag()['heaven']['activation']['active'] and state()['heavenCampaign'] == before)
        walk('verify-welcome')
        workspace()
        click('#rpg-content [data-rpg="heaven-campaign-step"][data-id="verify-welcome"]')
        close()
        mark('09_verified-unpaid')
        walk('claim')
        workspace()
        before = state()
        click('#rpg-content [data-rpg="heaven-campaign-claim"]')
        paid = state()
        check('whole fixed fee paid once', paid['heavenCampaign']['claimed'] and paid['adventure']['coins'] - before['adventure']['coins'] == 16 and paid['adventure']['ore'] - before['adventure']['ore'] == 3)
        mark('10_paid-recognition')
        close()
        page.reload(wait_until='load')
        page.wait_for_function('()=>!!window.Realm')
        page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"')
        check('ordinary native reload retains exact campaign', state()['heavenCampaign'] == paid['heavenCampaign'])
        check('no browser errors', not report['errors'], report['errors'])
        check('frozen runtime and capture inputs', hashes == {str(p.relative_to(ROOT)): sha(p) for p in files})
        mark('11_native-reload')
        report['status'] = 'passed'
    except Exception:
        report['status'], report['failure'] = 'failed', traceback.format_exc()
    finally:
        try:
            if context:
                context.close()
            if video:
                report['raw_video'] = str(video.path())
        except Exception:
            report['cleanup_failure'] = traceback.format_exc()
            report['status'] = 'failed'
        finally:
            if pw:
                pw.stop()
        server.shutdown()
        server.server_close()
        report['wall_seconds'] = time.monotonic() - started
        (out / 'REPORT.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'status': report['status'], 'checks': len(report['checks']), 'seconds': report['wall_seconds'], 'video': report.get('raw_video'), 'failure': report.get('failure')}, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
