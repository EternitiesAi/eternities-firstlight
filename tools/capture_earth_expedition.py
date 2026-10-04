#!/usr/bin/env python3
"""Record an earned Earth expedition using native UI and ordinary RAF.

No test/capture flags, scripted simulation steps, direct game commands, grants,
teleports or camera-state writes are used. Playwright records a silent viewport
WebM. This is an automated known-route outing, not human pacing or a performance
qualification. Failed recordings, snapshots and receipts are retained.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import copy
import hashlib
import json
import math
import os
import subprocess
import tempfile
import threading
import time
import traceback

from browser_support import launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
VIEWPORT = {'width': 1440, 'height': 900}
ROOM = 'world-earthlands'
CORE_FILES = [
    'src/combat-view.js', 'src/core.js', 'src/adventure.js', 'src/combat.js', 'src/arsenal.js',
    'src/characters.js', 'src/characters-ui.js', 'src/earth-expedition.js',
    'src/earth-expedition-ui.js', 'src/earth-expedition-dialogue.js',
    'src/earth-expedition-art.js', 'src/earth-expedition-beast-art.js',
    'src/elderweald-world.js', 'src/elderweald-trail-art.js',
    'src/world-foundations.js', 'src/world-foundations-ui.js',
    'src/world-foundations-art.js', 'src/world-atlantis-earth.js',
    'src/traveler-art.js', 'src/traveler-equipment-art.js',
    'src/sandbox.js', 'src/rpg-ui.js', 'src/pursuit-ui.js', 'src/app.js', 'src/world.js',
    'src/engine.js', 'src/shell.html', 'tools/browser_support.py',
    'tools/capture_earth_expedition.py', 'build.py',
]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def hashes(path):
    raw = path.read_bytes()
    return {'bytes': len(raw), 'sha256': digest(raw),
            'lf_sha256': digest(raw.replace(b'\r\n', b'\n').replace(b'\r', b'\n'))}


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def wallet(world):
    a = world['adventure']
    inv = world['sandbox']['inventory']
    return {**{k: a[k] for k in ['xp', 'coins', 'ore']},
            **{k: inv[k] for k in ['wood', 'fiber']}}


def preservation(world):
    """Compare ownership, old quests, sockets, housing, composition and identity.

    Normal time, physical position, resident schedules, bounded journals/command
    receipts, combat health/stamina, declared currency/materials, new ledger and
    native presentation preferences are checked separately rather than frozen.
    Node regrowth and crop ripening have separate exact timer checks.
"""
    s = copy.deepcopy(world)
    for key in ['player', 'hour', 'day', 'journal', 'nextEvent', 'visited', 'earthExpedition']:
        s.pop(key, None)
    s['residents'] = [{'id': p['id'], 'conversations': p['conversations']} for p in s['residents']]
    for key in ['elapsed', 'revision', 'hp', 'stamina', 'xp', 'coins', 'ore', 'receipts', 'earthBinding']:
        s['adventure'].pop(key, None)
    s['sandbox'].pop('elapsed', None)
    s['sandbox'].pop('nodes', None)
    s['sandbox'].pop('revision', None)
    # A planted crop can ripen during ordinary time without changing ownership.
    for placed in s['sandbox']['placed']:
        if placed.get('crop'):
            placed['crop'].pop('stage', None)
    for key in ['wood', 'fiber']:
        s['sandbox']['inventory'].pop(key)
    for key in ['quality', 'timeFlow', 'cameraMode', 'cameraViews']:
        s['settings'].pop(key)
    return s


def natural_sandbox(before, after, catalogue):
    """Only production timer-driven regrowth/ripening may change these fields."""
    expected = copy.deepcopy(before['sandbox']['nodes'])
    for node in expected:
        if node['hp'] == 0 and after['sandbox']['elapsed'] >= node['readyAt']:
            kind = next(n['kind'] for n in catalogue['nodes'] if n['id'] == node['id'])
            node['hp'], node['readyAt'] = catalogue['hp'][kind], 0
    assert after['sandbox']['nodes'] == expected, 'Unexpected resource-node change'
    placed = copy.deepcopy(before['sandbox']['placed'])
    for p in placed:
        crop = p.get('crop')
        if crop and crop['stage'] == 'watered' and after['sandbox']['elapsed'] >= crop['readyAt']:
            crop['stage'] = 'ripe'
    assert after['sandbox']['placed'] == placed, 'Unexpected housing or crop change'
    assert after['sandbox']['revision'] >= before['sandbox']['revision']


def bounded_history(before, after):
    """Keep old entries verbatim except the production rings' oldest eviction."""
    old_next = before['nextEvent']
    added = after['nextEvent'] - old_next
    assert added >= 0
    retained = [j for j in after['journal'] if j['seq'] < old_next]
    capacity = max(0, 200 - added)
    expected = before['journal'][-capacity:] if capacity else []
    assert retained == expected, 'Old chronicle entries changed beyond bounded eviction'
    old = {r['id']: r for r in before['adventure']['receipts']}
    current = after['adventure']['receipts']
    new = [r for r in current if r['id'] not in old]
    surviving = [r for r in current if r['id'] in old]
    capacity = 100 - len(new)
    expected = before['adventure']['receipts'][-capacity:] if capacity else []
    assert surviving == expected, 'Old command receipts changed beyond bounded eviction'
    allowed = {'target-cycle', 'target-clear', 'auto-toggle', 'guard', 'attack',
               'starter-enter', 'starter-leave'}
    assert all(json.loads(r['fp'])[0] in allowed for r in new), 'Unexpected new Adventure command'
    assert set(before['visited']).issubset(after['visited']), 'An old visited place was lost'
    return {'new_chronicle_events': added, 'old_chronicle_entries_retained': len(retained),
            'old_command_receipts_retained': len(surviving), 'new_retained_command_receipts': len(new),
            'new_visited_places': [p for p in after['visited'] if p not in before['visited']]}


def validate_source(source, variant):
    a = source['adventure']
    assert a['version'] == 12 and a['started'], 'Use a current command-earned source'
    assert source['earthExpedition'] == {
        'version': 1, 'story': {'accepted': False, 'branch': None, 'steps': [], 'claimed': False},
        'patrol': {'lastClaim': 0, 'active': None}}, 'Source must precede this expedition'
    assert a['earthBinding'] == {'version': 1, 'weapon': None, 'kind': None}
    expected = {'fresh-blade': 'trail_blade', 'fresh-bow': 'trail_bow', 'veteran': 'dawn_edge'}[variant]
    assert a['equipment']['weapon'] == expected and expected in a['owned']
    assert a['hp'] > 0
    assert math.hypot(source['player']['x'] - 18, source['player']['z'] - 6) <= 2.8, 'Source must be earned at the Roads gate'
    return expected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--variant', choices=['fresh-blade', 'fresh-bow', 'veteran'], required=True)
    parser.add_argument('--source', type=Path, required=True, help='Labelled command-earned 00 JSON, imported through Characters')
    parser.add_argument('--output', type=Path, required=True, help='Fresh absolute evidence directory; D: on Windows')
    parser.add_argument('--renderer', choices=['hardware', 'software'], required=True)
    args = parser.parse_args()
    source_path, out = args.source.resolve(), args.output.resolve()
    if not args.output.is_absolute() or os.name == 'nt' and out.drive.lower() != 'd:':
        parser.error('--output must be absolute and on D: on Windows')
    if out.exists():
        parser.error('--output must not exist; failed and previous takes are preserved')
    if not source_path.is_file():
        parser.error('--source must name an existing earned JSON')
    initial_source = json.loads(source_path.read_text(encoding='utf-8-sig'))
    weapon = validate_source(initial_source, args.variant)
    branch = 'stormfall-recovery' if args.variant == 'fresh-blade' else 'managed-coppice'
    binding = 'shelter' if args.variant == 'fresh-bow' else 'edge'
    # Imports and launch occur only after --help/argument validation.
    from playwright.sync_api import sync_playwright

    out.mkdir(parents=True)
    profiles = out / 'temporary-profile'
    profiles.mkdir()
    files = sorted(set(CORE_FILES + [p.relative_to(ROOT).as_posix()
                                    for p in (ROOT / 'src').rglob('*') if p.is_file()]))
    missing = [name for name in CORE_FILES if not (ROOT / name).is_file()]
    html = (ROOT / 'index.html').read_bytes()
    html_lf = html.replace(b'\r\n', b'\n').replace(b'\r', b'\n')
    source_hashes = {name: hashes(ROOT / name) for name in files if (ROOT / name).is_file()}
    embedded = {}
    for name in CORE_FILES:
        if name.startswith('src/') and name.endswith('.js'):
            if (ROOT / name).is_file():
                body = (ROOT / name).read_bytes().replace(b'\r\n', b'\n').replace(b'\r', b'\n')
                embedded[name] = body in html_lf
    report = {
        'status': 'running', 'method': __doc__, 'variant': args.variant,
        'source': {'path': str(source_path), 'retained_file': 'SOURCE_WORLD.json', **hashes(source_path),
                   'provenance': 'Caller-supplied command-earned initial snapshot; this driver does not earn the inherited kit/campaign.'},
        'git_head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'git_status': subprocess.check_output(['git', 'status', '--short'], cwd=ROOT, text=True).splitlines(),
        'html': {'path': 'index.html', **hashes(ROOT / 'index.html')},
        'source_hashes': source_hashes, 'missing_required_files': missing, 'embedded_modules': embedded,
        'viewport': VIEWPORT, 'requested_renderer': args.renderer,
        'video_audio': 'Silent Playwright viewport WebM; no captured or replacement audio.',
        'branch': branch, 'binding_kind': binding, 'intentional_patrols': 1 if args.variant != 'veteran' else 0,
        'presentation': ['Native balanced quality', 'Native timeFlow disabled; inherited hour retained',
                         'Native camera controls and actual V exchange; no camera-state writes'],
        'simulation': 'Ordinary RAF throughout. RPG workspaces pause through production UI; no accelerated/test simulation.',
        'human_acceptance': False, 'sustained_performance_qualification': False,
        'events': [], 'walks': [], 'combats': [], 'payouts': [], 'ui_readings': [], 'checks': [],
        'browser_errors': [], 'diagnostic_errors': [], 'console_errors': [], 'external_requests': [],
        'context_closed': False, 'loopback_closed': False,
    }
    (out / 'SOURCE_WORLD.json').write_bytes(source_path.read_bytes())
    started = time.monotonic()
    context = page = None
    video = None
    failure = None

    def check(name, ok, detail=None):
        report['checks'].append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok:
            raise AssertionError(name + ': ' + repr(detail))

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = 'http://127.0.0.1:' + str(server.server_port)
    report['origin'] = origin
    try:
        check('Every required source file exists', not missing, missing)
        check('Frozen HTML copies agree', digest(html) == hashes(ROOT / 'FIRSTLIGHT_VALLEY.html')['sha256'])
        check('Every listed runtime module is embedded in the actual HTML', all(embedded.values()), embedded)
        with sync_playwright() as pw:
            # The context closes inside both Playwright and TemporaryDirectory lifetimes.
            with tempfile.TemporaryDirectory(prefix='earth-', dir=profiles) as profile:
                try:
                    context = pw.chromium.launch_persistent_context(
                        profile, **launch_kwargs(args.renderer), accept_downloads=True,
                        viewport=VIEWPORT, record_video_dir=str(out), record_video_size=VIEWPORT)
                    report['browser_version'] = context.browser.version if context.browser else None

                    def route(r):
                        if r.request.url.startswith(origin + '/'):
                            r.continue_()
                        else:
                            report['external_requests'].append(r.request.url)
                            r.abort()

                    context.route('**/*', route)
                    page = context.new_page()
                    for blank in context.pages:
                        if blank is not page:
                            blank.close()
                    video = page.video
                    page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
                    page.on('console', lambda msg: report['console_errors'].append(msg.text) if msg.type == 'error' else None)
                    # Observation only. No Firstlight test/capture flag is installed.
                    page.add_init_script('''window.__earthCaptureRaf={frames:0,first:null,last:null};
                      requestAnimationFrame(function count(t){const r=window.__earthCaptureRaf;
                        r.frames++;if(r.first===null)r.first=t;r.last=t;requestAnimationFrame(count);});''')
                    response = page.goto(origin + '/index.html', wait_until='load')
                    page.wait_for_function('()=>!!window.Realm')
                    page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"')
                    check('Served HTML equals frozen build', response is not None and digest(response.body()) == report['html']['sha256'])
                    check('Production mode has no test surface', page.evaluate('()=>typeof Realm.test==="undefined"'))

                    def state():
                        return page.evaluate('()=>Realm.state')

                    def diag():
                        return page.evaluate('()=>Realm.diagnostics')

                    def close():
                        if page.locator('#rpg-window').evaluate('(el)=>el.open'):
                            page.locator('#rpg-close').click()

                    def click(selector):
                        loc = page.locator(selector)
                        check('Unique native selector ' + selector, loc.count() == 1, loc.count())
                        loc.click()

                    def workspace(tab):
                        close()
                        page.keyboard.press('j')
                        click('#rpg-tabs [data-rpg="open"][data-id="' + tab + '"]')

                    def reading(label):
                        text = page.locator('#rpg-content').inner_text()
                        report['ui_readings'].append({'label': label, 'seconds': time.monotonic() - started, 'text': text})
                        return text

                    def mark(label, picture=True):
                        w, d = state(), diag()
                        controls = page.evaluate('''()=>[...document.querySelectorAll('#rpg-hud [data-rpg="camera"]')].map(el=>({
                          mode:el.dataset.id,pressed:el.getAttribute('aria-pressed'),
                          focused:document.activeElement===el,hovered:el.matches(':hover')}))''')
                        selected = [c['mode'] for c in controls if c['pressed'] == 'true']
                        check(label + ' actual camera agrees with native selected control', selected == [d['camera']['preset']], controls)
                        i = len(report['events'])
                        filename = f'{i:02d}_{label}_STATE.json'
                        write_json(out / filename, w)
                        diagnostic_file = f'{i:02d}_{label}_DIAGNOSTICS.json'
                        write_json(out / diagnostic_file, d)
                        report['events'].append({
                            'label': label, 'seconds': time.monotonic() - started, 'state_file': filename,
                            'diagnostics_file': diagnostic_file,
                            'scene': d['scene'], 'player': d['adventure']['player'], 'camera': d['camera'],
                            'paused': d['adventure']['paused'], 'wallet': wallet(w),
                            'stats': d['adventure']['stats'], 'weapon': d['adventure']['weapon'],
                            'render_metrics': d.get('metrics'), 'reflection': d.get('reflection'),
                            'camera_controls': controls,
                            'characters': d['characters'], 'music': d['music'], 'audio': d.get('audio'),
                            'raf': page.evaluate('()=>window.__earthCaptureRaf'),
                        })
                        check(label + ' tab is visible', not page.evaluate('()=>document.hidden'))
                        check(label + ' imported music remains stopped and master sound stays off',
                              not d['music']['playing'] and not d['audio']['enabled'])
                        if picture:
                            page.screenshot(path=str(out / (label + '.png')))
                        print(label, round(time.monotonic() - started, 2), flush=True)
                        return w

                    def wait_near(target, label, maximum=240):
                        t0, stable, last = time.monotonic(), None, None
                        samples = []
                        while time.monotonic() - t0 < maximum:
                            d = diag()
                            p = d['adventure']['player']
                            check(label + ' traveler remains alive', state()['adventure']['hp'] > 0)
                            check(label + ' outdoors remains unpaused', not d['adventure']['paused'])
                            dist = math.hypot(p['x'] - target['x'], p['z'] - target['z'])
                            samples.append({'seconds': time.monotonic() - t0, 'x': p['x'], 'z': p['z'], 'distance': dist})
                            motion = math.inf if last is None else math.hypot(p['x'] - last['x'], p['z'] - last['z'])
                            if dist <= 2.8 and motion < .015:
                                stable = stable if stable is not None else time.monotonic()
                                if time.monotonic() - stable >= .3:
                                    report['walks'].append({'label': label, 'target': target, 'seconds': time.monotonic() - t0,
                                                            'player': p, 'distance': dist, 'samples': samples})
                                    return p
                            else:
                                stable = None
                            last = p
                            page.wait_for_timeout(120)
                        report['walks'].append({'label': label, 'target': target, 'failed': True, 'samples': samples})
                        raise TimeoutError('Native route did not reach ' + label)

                    def walk(id, target, label):
                        before = state()['earthExpedition']
                        workspace('expedition')
                        click('#rpg-content [data-rpg="expedition-walk"][data-id="' + id + '"]')
                        wait_near(target, label)
                        check(label + ' walking alone grants no work', state()['earthExpedition'] == before)

                    def interact():
                        close()
                        page.keyboard.press('e')
                        page.wait_for_selector('#rpg-window[open]')

                    def camera(mode, label):
                        close()
                        click('#rpg-hud [data-rpg="camera"][data-id="' + mode + '"]')
                        page.wait_for_function('(mode)=>Realm.diagnostics.camera.preset===mode', arg=mode)
                        page.wait_for_timeout(500)
                        mark(label)

                    workspace('characters')
                    legacy_key = page.evaluate('()=>localStorage.getItem(RealmCore.KEY)')
                    with page.expect_file_chooser() as chooser:
                        click('#rpg-content [data-rpg="chars-import"]')
                    chooser.value.set_files(str(source_path))
                    page.wait_for_selector('#rpg-content [data-rpg="chars-confirm-import"]')
                    reading('Native character import confirmation')
                    mark('import-confirmation')
                    click('#rpg-content [data-rpg="chars-confirm-import"]')
                    page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer===true')
                    base = mark('imported-earned-source')
                    sandbox_catalogue = page.evaluate('()=>({nodes:RealmSandbox.NODES,hp:RealmSandbox.HP})')
                    check('Native import preserves earned ownership', preservation(base) == preservation(initial_source))
                    check('Native import preserves exact earned balances and fresh new ledger',
                          wallet(base) == wallet(initial_source) and base['earthExpedition'] == initial_source['earthExpedition'] and
                          base['adventure']['earthBinding'] == initial_source['adventure']['earthBinding'])
                    report['initial_stats'] = diag()['adventure']['stats']
                    check('Native import leaves original legacy key unchanged', page.evaluate('()=>localStorage.getItem(RealmCore.KEY)') == legacy_key)
                    check('Native import creates a separate second character', diag()['characters']['count'] == 2)
                    close()
                    click('#settings')
                    page.locator('#quality').select_option('balanced')
                    page.locator('#setting-timeFlow').uncheck()
                    click('#close-panel')
                    check('Native presentation settings applied', state()['settings']['quality'] == 'balanced' and not state()['settings']['timeFlow'])
                    d = diag()
                    report['renderer'] = d['renderer']
                    report['renderer_mode'] = d['mode']
                    check('Actual WebGL2 renderer', d['mode'] == 'webgl2')
                    if args.renderer == 'software':
                        check('Requested software renderer is actually software', 'swiftshader' in d['renderer'].lower(), d['renderer'])
                    else:
                        check('Hardware request did not fall back to software', not any(s in d['renderer'].lower() for s in ['swiftshader', 'llvmpipe', 'software']), d['renderer'])
                    home_checkpoint = d['adventure']['player']
                    camera('follow', 'home-kit-diorama')
                    camera('adventure', 'home-kit-third')
                    workspace('worlds')
                    list_button = page.locator('#rpg-content [data-rpg="world-list"]')
                    if list_button.count():
                        click('#rpg-content [data-rpg="world-list"]')
                    click('#rpg-content [data-rpg="world-select"][data-id="earthlands"]')
                    reading('Crossing description before consent')
                    click('#rpg-content [data-rpg="world-preview"]')
                    reading('Explicit Earth crossing terms')
                    mark('earth-crossing-terms')
                    click('#rpg-content [data-rpg="world-confirm"]')
                    page.wait_for_function('()=>Realm.diagnostics.scene==="world-earthlands"')
                    definition = page.evaluate('()=>RealmEarthExpedition.definition')
                    patrol = page.evaluate('()=>RealmEarthExpedition.patrol')
                    write_json(out / 'DEFINITIONS.json', {'story': definition, 'patrol': patrol})
                    workspace('expedition')
                    text = reading('Story invitation and exact two allocations')
                    check('Visible terms include fixed danger, payment, both allocations and binding cost',
                          all(t in text for t in ['64 health / 9 damage', '136 health / 11 damage', '2.6 m', '3.1 m', '45 XP', '18 sunmarks', '3 ore', '8 timber', '8 fibre', '+2 attack', '6 fibre']))
                    check('Reading does not accept the story', not state()['earthExpedition']['story']['accepted'])
                    mark('expedition-terms')
                    page.wait_for_timeout(1800)
                    giver = definition['giver']
                    walk('giver', giver, 'Rill acceptance approach')
                    interact()
                    reading('Rill invitation at actual proximity')
                    click('#rpg-content [data-rpg="expedition-accept"]')
                    check('Explicit accepted story', state()['earthExpedition']['story']['accepted'])
                    mark('story-accepted')
                    close()

                    def steps_for(run):
                        ledger = state()['earthExpedition']
                        return ledger['story']['steps'] if run is None else ledger['patrol']['active']['steps']

                    def fight(step, catalogue, run=None):
                        close()
                        # Use native controls: crossings remain a diorama, while
                        # named root encounters show the real third-person pose.
                        mode = 'adventure' if step['id'] == 'clear-root-pests' else 'follow'
                        click('#rpg-hud [data-rpg="camera"][data-id="' + mode + '"]')
                        page.wait_for_function('(mode)=>Realm.diagnostics.camera.preset===mode', arg=mode)
                        term = next(e for e in catalogue['enemies'] if e['defeatStep'] == step['id'])
                        enemy_id = term['id'] if run is None else catalogue['id'] + '-run-' + str(run) + '-' + term['id']
                        before, d = state(), diag()
                        enemy = next((e for e in d['adventure']['enemies'] if e['id'] == enemy_id), None)
                        # A retained following Briar may already strike while we approach.
                        # Never disable/move him or reset the actor to manufacture full HP.
                        check('Accepted actual actor exists ' + enemy_id, enemy is not None and 0 < enemy['hp'] <= term['hp'])
                        selected = False
                        for _ in range(12):
                            page.keyboard.press('Tab')
                            page.wait_for_timeout(70)
                            if diag()['adventure']['tactics']['target'] == enemy_id:
                                selected = True
                                break
                        check('Native Tab selects accepted actor ' + enemy_id, selected)
                        if step['id'] == 'clear-root-pests':
                            click('#rpg-hud [data-rpg="camera"][data-id="adventure"]')
                            click('#target-framing')
                            mark(('patrol-' + str(run) + '-' if run else 'story-') + 'explicit-frame-foe')
                        begun, samples, guards, saw_arrow, first_guard = time.monotonic(), [], 0, False, False
                        side_escape = None
                        saw_release = False
                        # Wait for an actual tell before initiating damage, even with veteran gear.
                        while time.monotonic() - begun < 20:
                            d = diag()['adventure']
                            actor = next((e for e in d['enemies'] if e['id'] == enemy_id), None)
                            check('Traveler survives waiting for tell', state()['adventure']['hp'] > 0)
                            if actor and actor['mode'] == 'windup' and actor['timer'] > .2:
                                if step['id'] == 'clear-root-pests' and run is None and side_escape is None:
                                    if actor['timer'] < .85:
                                        page.wait_for_timeout(80)
                                        continue
                                    frozen = dict(actor['strike'])
                                    yaw = diag()['camera']['yaw']
                                    right = (math.cos(frozen['yaw']), -math.sin(frozen['yaw']))
                                    directions = {'d': (math.cos(yaw), -math.sin(yaw)), 'a': (-math.cos(yaw), math.sin(yaw)),
                                                  's': (math.sin(yaw), math.cos(yaw)), 'w': (-math.sin(yaw), -math.cos(yaw))}
                                    key = max(directions, key=lambda k: sum(a*b for a,b in zip(directions[k], right)))
                                    hp_before = state()['adventure']['hp']
                                    mark('story-bank-sweep-before-native-side-step', picture=False)
                                    page.keyboard.down(key)
                                    try:
                                        page.wait_for_timeout(700)
                                    finally:
                                        page.keyboard.up(key)
                                    pos = diag()['adventure']['player']
                                    lateral = (pos['x']-frozen['x'])*right[0] + (pos['z']-frozen['z'])*right[1]
                                    check('Native movement reaches the side of the locked lane', abs(lateral) > 1.24, {'key': key, 'lateral': lateral, 'player': pos})
                                    page.wait_for_function('(id)=>Realm.diagnostics.adventure.enemies.find(e=>e.id===id)?.mode==="recover"', arg=enemy_id)
                                    contact = next(e for e in diag()['adventure']['enemies'] if e['id']==enemy_id)
                                    side_escape = {'key': key, 'frame': frozen, 'lateral': lateral, 'hpBefore': hp_before,
                                                   'hpAfter': state()['adventure']['hp'], 'contactAt': contact['contactAt'], 'contactHit': contact['contactHit']}
                                    check('Native side-step avoids actual contact with frame retained', side_escape['hpBefore']==side_escape['hpAfter'] and contact['strike']==frozen and contact['contactHit'] is False, side_escape)
                                    mark('story-bank-sweep-native-side-step-opening')
                                    continue
                                page.keyboard.press('3')
                                first_guard = diag()['adventure']['tactics']['guardUntil'] > state()['adventure']['elapsed']
                                guards += int(first_guard)
                                check('Actual Brace arms during real tell', first_guard)
                                mark(('patrol-' + str(run) + '-' if run else 'story-') + step['id'] + '-guarded-tell')
                                break
                            page.wait_for_timeout(80)
                        check('Actual tell occurred before autoattack', first_guard)
                        page.keyboard.press('1')
                        check('Native 1 enables stationary autoattack', diag()['adventure']['tactics']['auto'])
                        low = enemy['hp']
                        while time.monotonic() - begun < 150:
                            d, w = diag()['adventure'], state()
                            actor = next((e for e in d['enemies'] if e['id'] == enemy_id), None)
                            check('Traveler survives actual fight ' + enemy_id, w['adventure']['hp'] > 0)
                            saw_arrow = saw_arrow or bool(d['arrows'])
                            motion = d['tactics'].get('motion')
                            saw_release = saw_release or bool(motion and motion['at'] >= before['adventure']['elapsed'])
                            if actor:
                                low = min(low, actor['hp'])
                                samples.append({'seconds': time.monotonic() - begun, 'hp': actor['hp'],
                                                'mode': actor['mode'], 'timer': actor['timer'], 'player_hp': w['adventure']['hp'],
                                                'guard_until': d['tactics']['guardUntil'], 'arrows': len(d['arrows']),
                                                'hits': d['tactics']['hits']})
                                if (actor['mode'] == 'windup' and actor['timer'] > .2 and
                                        w['adventure']['stamina'] >= 20 and w['adventure']['elapsed'] >= d['tactics']['cooldowns']['guard']):
                                    page.keyboard.press('3')
                                    guards += 1
                            if step['id'] in steps_for(run):
                                break
                            page.wait_for_timeout(35 if args.variant == 'fresh-bow' else 90)
                        after = state()
                        check('Real accepted defeat records the step ' + enemy_id, step['id'] in steps_for(run))
                        check('Observed actual actor damage ' + enemy_id, low < term['hp'], low)
                        check('Observed an accepted actual weapon release ' + enemy_id, saw_release)
                        check('Combat pays no old currency/drop/defeat reward ' + enemy_id,
                              all(after['adventure'][k] == before['adventure'][k] for k in ['xp', 'coins', 'ore', 'drops', 'defeated']))
                        if args.variant == 'fresh-bow':
                            check('Actual bow projectile observed ' + enemy_id, saw_arrow)
                        report['combats'].append({'enemy_id': enemy_id, 'step': step['id'], 'run': run,
                                                   'seconds': time.monotonic() - begun, 'side_escape': side_escape, 'guards': guards,
                                                   'saw_actual_arrow': saw_arrow, 'initial_hp': term['hp'],
                                                   'hp_at_approach': enemy['hp'], 'saw_actual_weapon_release': saw_release,
                                                   'companion_mode_retained': before['adventure']['companion']['mode'],
                                                   'lowest_observed_hp': low, 'player_hp_before': before['adventure']['hp'],
                                                   'player_hp_after': after['adventure']['hp'], 'samples': samples})
                        mark(('patrol-' + str(run) + '-' if run else 'story-') + step['id'] + '-defeated')
                        if page.locator('#target-clear').is_visible():
                            click('#target-clear')

                    def objective(step, catalogue, run=None):
                        walk(step['id'], step, step['name'])
                        if step['kind'] == 'defeat':
                            fight(step, catalogue, run)
                        else:
                            if run and step['id'] == 'inspect-glade':
                                camera('follow', 'supplied-kit-pending-diorama')
                                camera('adventure', 'supplied-kit-pending-third')
                            interact()
                            reading(step['name'] + ' at physical work point')
                            action = 'patrol-step' if run else 'step'
                            click('#rpg-content [data-rpg="expedition-' + action + '"][data-id="' + step['id'] + '"]')
                            check('Native field action records ' + step['id'], step['id'] in steps_for(run))
                            mark(('patrol-' + str(run) + '-' if run else 'story-') + step['id'])
                            close()
                            if run and step['id'] == 'inspect-glade':
                                camera('follow', 'supplied-kit-checked-diorama')
                                camera('adventure', 'supplied-kit-checked-third')
                            if step['id'] == 'brace-root-channel':
                                camera('adventure', 'installed-root-brace-third')
                                camera('follow', 'installed-root-brace-diorama')

                    objective(definition['steps'][0], definition)
                    choice = next(c for c in definition['steps'][1]['choices'] if c['id'] == branch)
                    walk(branch, choice, choice['name'])
                    interact()
                    reading('Deliberate physical supply choice')
                    click('#rpg-content [data-rpg="expedition-step"][data-choice="' + branch + '"]')
                    check('Selected allocation recorded', state()['earthExpedition']['story']['branch'] == branch)
                    mark('chosen-allocation')
                    close()
                    # Actual V exchange midway through the route, without manipulating camera fields.
                    page.keyboard.press('v')
                    page.wait_for_function('()=>Realm.diagnostics.camera.preset==="follow"')
                    mark('woodland-diorama-v-exchange')
                    for step in definition['steps'][2:]:
                        objective(step, definition)
                    mark('story-complete-unpaid-outdoors')

                    def claim(catalogue, run=None):
                        walk('giver', giver, 'Rill explicit payment return')
                        interact()
                        text = reading('Completed unpaid story' if run is None else 'Completed unpaid patrol ' + str(run))
                        check('UI keeps complete work unpaid until deliberate claim', 'Work complete' in text and 'unclaimed' in text)
                        before = mark('story-unpaid' if run is None else 'patrol-' + str(run) + '-unpaid')
                        action = 'claim' if run is None else 'patrol-claim'
                        click('#rpg-content [data-rpg="expedition-' + action + '"]')
                        after = mark('story-paid' if run is None else 'patrol-' + str(run) + '-paid')
                        reward = catalogue['reward']
                        materials = choice['materials'] if run is None else reward['materials']
                        expected = {'xp': min(reward['xp'], 9999 - before['adventure']['xp']),
                                    'coins': reward['coins'], 'ore': reward['ore'], **materials}
                        delta = {k: wallet(after)[k] - wallet(before)[k] for k in expected}
                        check('Explicit claim credits exact package', delta == expected, {'expected': expected, 'actual': delta})
                        check('Payment retains old ownership', preservation(after) == preservation(before))
                        if run is None:
                            check('Story is claimed', after['earthExpedition']['story']['claimed'])
                        else:
                            check('Patrol identity paid and closed', after['earthExpedition']['patrol'] == {'lastClaim': run, 'active': None})
                        report['payouts'].append({'quest': catalogue['id'], 'run': run, 'before': wallet(before), 'after': wallet(after), 'delta': delta})
                        close()
                        interact()
                        reading('Rill recognizes actually claimed allocation or patrol')
                        mark('rill-recognition' if run is None else 'rill-patrol-recognition')
                        close()

                    claim(definition)
                    camera('adventure', 'paid-rill-third')
                    camera('follow', 'paid-rill-diorama')
                    if args.variant != 'veteran':
                        walk('giver', giver, 'Rill intentional patrol acceptance')
                        interact()
                        reading('Declared intentional patrol payment; no acceptance fee')
                        before = wallet(state())
                        button = page.locator('#rpg-content [data-rpg="expedition-patrol-accept"]')
                        check('Rendered patrol owns next run identity', button.get_attribute('data-run') == '1' and button.get_attribute('data-prior-claim') == '0')
                        click('#rpg-content [data-rpg="expedition-patrol-accept"]')
                        check('Patrol acceptance spends no fee', wallet(state()) == before)
                        check('Patrol run 1 accepted', state()['earthExpedition']['patrol']['active'] == {'run': 1, 'steps': []})
                        mark('patrol-1-accepted')
                        close()
                        for step in patrol['steps']:
                            objective(step, patrol, 1)
                        claim(patrol, 1)

                    # Optional person's reading has no work/reward authority.
                    # Ordinary authored stops are walk buttons on the local atlas,
                    # whereas the Roads reading page exposes survey/trail actions.
                    workspace('atlas')
                    before_sela = state()['earthExpedition']
                    click('#rpg-content [data-rpg="world-walk"][data-id="elderweald-sela"]')
                    wait_near({'x': -103, 'z': -23}, 'Optional Sela conversation')
                    interact()
                    text = reading('Sela optional wetland advice at actual proximity')
                    check('Sela is visibly identified', 'Sela' in text)
                    check('Optional dialogue adds no credit', state()['earthExpedition'] == before_sela)
                    mark('sela-optional-reading')
                    close()
                    mark('paid-world-before-free-return')
                    click('#world-home')
                    page.wait_for_function('()=>Realm.diagnostics.scene==="valley"')
                    p = diag()['adventure']['player']
                    check('Free return restores exact crossing checkpoint', all(abs(p[k] - home_checkpoint[k]) < 1e-6 for k in ['x', 'z', 'yaw']), {'before': home_checkpoint, 'after': p})
                    mark('free-home-return')
                    workspace('pursuit')
                    reading('Existing item and recipe field guide retained')
                    # This existing survey section always offers the real outdoor Oren route when away.
                    click('#rpg-content .guide-survey [data-rpg="pursuit-route"][data-id="oren"]')
                    bench = page.evaluate('()=>RealmStarter.OREN')
                    wait_near(bench, 'Outdoor home workbench')

                    def practice(label):
                        """Actual UI round trip and confirmed dummy impacts, no reward."""
                        close()
                        check(label + ' starts at home', diag()['scene'] == 'valley')
                        before_trip = state()
                        workspace('pursuit')
                        reading(label + ' native field-guide practice route')
                        click('#rpg-content .guide-detail [data-rpg="pursuit-route"][data-id="practice"]')
                        gate = page.evaluate('()=>RealmStarter.GATE')
                        wait_near(gate, label + ' riverbank sign')
                        page.keyboard.press('e')
                        page.wait_for_function('()=>Realm.diagnostics.scene==="riverbank"')
                        workspace('pursuit')
                        click('#rpg-content .guide-detail [data-rpg="pursuit-route"][data-id="practice"]')
                        target = page.evaluate('()=>RealmStarter.PRACTICE')
                        style = diag()['adventure']['weapon']['style']
                        stand = {'x': target['x'], 'z': 6 if style == 'bow' else 11.5}
                        wait_near(stand, label + ' accepted practice approach')
                        for _ in range(12):
                            page.keyboard.press('Tab')
                            page.wait_for_timeout(60)
                            if diag()['adventure']['tactics']['target'] == target['id']:
                                break
                        check(label + ' native Tab selects the practice bundle',
                              diag()['adventure']['tactics']['target'] == target['id'])
                        impacts = []
                        for mode in ['adventure', 'follow']:
                            click('#rpg-hud [data-rpg="camera"][data-id="' + mode + '"]')
                            page.wait_for_function('(mode)=>Realm.diagnostics.camera.preset===mode', arg=mode)
                            page.wait_for_timeout(350)
                            before_hit, before_d = state(), diag()['adventure']
                            old_ids = {h['id'] for h in before_d['tactics']['hits']}
                            actor = next(e for e in before_d['enemies'] if e['id'] == target['id'])
                            check(label + ' actual practice actor has 100 HP', actor['hp'] == 100)
                            check(label + ' practice begins with autoattack off', not before_d['tactics']['auto'])
                            page.keyboard.press('1')
                            check(label + ' native 1 enables actual practice autoattack', diag()['adventure']['tactics']['auto'])
                            began, packet, saw_arrow, samples = time.monotonic(), None, False, []
                            while time.monotonic() - began < 12:
                                d = diag()['adventure']
                                saw_arrow = saw_arrow or bool(d['arrows'])
                                packets = [h for h in d['tactics']['hits'] if h['id'] not in old_ids and h['at'] >= before_hit['adventure']['elapsed']]
                                samples.append({'seconds': time.monotonic() - began, 'arrows': len(d['arrows']),
                                                'motion': d['tactics'].get('motion'), 'hits': packets})
                                if packets:
                                    packet = packets[-1]
                                    break
                                page.wait_for_timeout(25)
                            check(label + ' actual confirmed practice impact ' + mode, packet is not None, samples)
                            # Stop through the same actual toggle, keeping the
                            # selected actor and its confirmed-impact HUD visible.
                            page.keyboard.press('1')
                            check(label + ' native toggle stops practice autoattack', not diag()['adventure']['tactics']['auto'])
                            expected_damage = before_d['stats']['attack']
                            check(label + ' practice confirms production attack damage ' + mode, packet['n'] == expected_damage, packet)
                            if style == 'bow':
                                check(label + ' real practice projectile observed ' + mode, saw_arrow)
                            page.wait_for_function('(n)=>document.querySelector("#target-state").textContent==="Last confirmed impact: "+n+" · no XP or loot"', arg=packet['n'])
                            after_hit = mark(label + '-actual-impact-' + mode)
                            after_d = diag()['adventure']
                            after_actor = next(e for e in after_d['enemies'] if e['id'] == target['id'])
                            check(label + ' practice keeps actual actor and traveler HP',
                                  after_actor['hp'] == 100 and after_hit['adventure']['hp'] == before_hit['adventure']['hp'])
                            check(label + ' practice grants no XP, loot, work or inventory',
                                  wallet(after_hit) == wallet(before_hit) and after_hit['earthExpedition'] == before_hit['earthExpedition'] and
                                  after_hit['adventure']['earthBinding'] == before_hit['adventure']['earthBinding'] and
                                  preservation(after_hit) == preservation(before_hit))
                            impacts.append({'mode': mode, 'style': style, 'damage': packet['n'], 'packet': packet,
                                            'saw_actual_arrow': saw_arrow, 'samples': samples,
                                            'ui': page.locator('#target-frame').inner_text(), 'stats': before_d['stats']})
                        click('#target-clear')
                        workspace('atlas')
                        click('#rpg-content .cross-atlas-list [data-rpg="starter-walk"][data-id="river-exit"]')
                        exit_point = page.evaluate('()=>RealmStarter.ENTRY')
                        wait_near(exit_point, label + ' actual southern exit')
                        page.keyboard.press('e')
                        page.wait_for_function('()=>Realm.diagnostics.scene==="valley"')
                        workspace('pursuit')
                        click('#rpg-content .guide-survey [data-rpg="pursuit-route"][data-id="oren"]')
                        wait_near(bench, label + ' return to outdoor Oren bench')
                        after_trip = state()
                        check(label + ' whole practice round trip preserves ownership, balances and work',
                              preservation(after_trip) == preservation(before_trip) and wallet(after_trip) == wallet(before_trip) and
                              after_trip['earthExpedition'] == before_trip['earthExpedition'] and
                              after_trip['adventure']['earthBinding'] == before_trip['adventure']['earthBinding'])
                        report.setdefault('practice', []).append({'label': label, 'impacts': impacts,
                                                                  'before_wallet': wallet(before_trip), 'after_wallet': wallet(after_trip)})
                        return impacts

                    baseline_impacts = practice('before-binding-practice')
                    workspace('craft')
                    before_bind = state()
                    before_stats = diag()['adventure']['stats']
                    before_weapon = diag()['adventure']['weapon']
                    click('#rpg-content [data-rpg="expedition-binding-preview"][data-id="' + weapon + '"][data-kind="' + binding + '"]')
                    reading('Finite binding comparison and explicit cost')
                    mark('binding-explicit-preview')
                    check('Preview spends nothing', wallet(state()) == wallet(before_bind) and state()['adventure']['earthBinding'] == before_bind['adventure']['earthBinding'])
                    page.wait_for_timeout(1800)
                    click('#rpg-content [data-rpg="expedition-binding-confirm"][data-id="' + weapon + '"]')
                    fitted = mark('binding-paid')
                    check('Binding costs exactly 3 ore, 8 coins and 6 fibre',
                          {k: wallet(fitted)[k] - wallet(before_bind)[k] for k in wallet(fitted)} == {'xp': 0, 'coins': -8, 'ore': -3, 'wood': 0, 'fiber': -6})
                    check('Exactly one selected canonical binding recorded', fitted['adventure']['earthBinding'] == {'version': 1, 'weapon': weapon, 'kind': binding})
                    check('Binding preserves old ownership, equipment and sockets', preservation(fitted) == preservation(before_bind))
                    check('Binding does not heal or refill', fitted['adventure']['hp'] == before_bind['adventure']['hp'] and fitted['adventure']['stamina'] == before_bind['adventure']['stamina'])
                    after_stats = diag()['adventure']['stats']
                    expected_stats = {**before_stats, 'attack': before_stats['attack'] + (2 if binding == 'edge' else 0),
                                      'defense': before_stats['defense'] + (1 if binding == 'shelter' else 0),
                                      'maxHP': before_stats['maxHP'] + (10 if binding == 'shelter' else 0)}
                    check('Actual production stats add only chosen effect', after_stats == expected_stats, {'before': before_stats, 'after': after_stats})
                    check('Binding retains actual cadence, reach and stamina', diag()['adventure']['weapon'] == before_weapon)
                    report['binding'] = {'weapon': weapon, 'kind': binding, 'before_stats': before_stats, 'after_stats': after_stats,
                                         'before_wallet': wallet(before_bind), 'after_wallet': wallet(fitted), 'weapon_behavior': before_weapon}
                    close()
                    camera('adventure', 'bound-weapon-third')
                    page.keyboard.press('v')
                    page.wait_for_function('()=>Realm.diagnostics.camera.preset==="follow"')
                    page.wait_for_timeout(600)
                    mark('bound-weapon-diorama-v-exchange')
                    fitted_impacts = practice('after-binding-practice')
                    expected_damage_delta = 2 if binding == 'edge' else 0
                    check('Actual before/after practice impact matches the chosen binding',
                          all(after['damage'] - before['damage'] == expected_damage_delta
                              for before, after in zip(baseline_impacts, fitted_impacts)),
                          {'before': [r['damage'] for r in baseline_impacts], 'after': [r['damage'] for r in fitted_impacts],
                           'expected_delta': expected_damage_delta})
                    final = state()
                    check('Whole outing preserves original ownership and histories', preservation(final) == preservation(base))
                    natural_sandbox(base, final, sandbox_catalogue)
                    check('Normal resource regrowth and crop ripening follow actual timers', True,
                          {'before_nodes': base['sandbox']['nodes'], 'after_nodes': final['sandbox']['nodes']})
                    expected_wallet = wallet(base)
                    expected_wallet['xp'] = min(9999, expected_wallet['xp'] + 45 + (5 if args.variant != 'veteran' else 0))
                    expected_wallet['coins'] += 18 + (4 if args.variant != 'veteran' else 0) - 8
                    expected_wallet['ore'] += 3 + (3 if args.variant != 'veteran' else 0) - 3
                    expected_wallet['wood'] += choice['materials']['wood'] + (2 if args.variant != 'veteran' else 0)
                    expected_wallet['fiber'] += choice['materials']['fiber'] + (2 if args.variant != 'veteran' else 0) - 6
                    check('Final balance contains only declared payouts and one binding cost', wallet(final) == expected_wallet, {'expected': expected_wallet, 'actual': wallet(final)})
                    check('Only the intentionally requested patrol was paid',
                          final['earthExpedition']['patrol'] == {'lastClaim': 1 if args.variant != 'veteran' else 0, 'active': None})
                    check('All story work is paid without a new acceptance',
                          final['earthExpedition']['story'] == {'accepted': True, 'branch': branch,
                                                               'steps': [s['id'] for s in definition['steps']], 'claimed': True})
                    check('Normal elapsed time advanced without acceleration',
                          0 < final['adventure']['elapsed'] - base['adventure']['elapsed'] <= time.monotonic() - started + 2)
                    before_reload = mark('before-native-reload')
                    report['raf_before_native_reload'] = page.evaluate('()=>window.__earthCaptureRaf')
                    saved = page.evaluate('''()=>{const r=JSON.parse(localStorage.getItem(RealmCharacters.KEY));
                      return r.slots.find(s=>s.id===r.active).world;}''')
                    write_json(out / 'NATIVE_SAVED_WORLD.json', saved)
                    check('Actual native store already contains ledger, binding and balances',
                          saved['earthExpedition'] == before_reload['earthExpedition'] and
                          saved['adventure']['earthBinding'] == before_reload['adventure']['earthBinding'] and wallet(saved) == wallet(before_reload))
                    page.reload(wait_until='load')
                    page.wait_for_function('()=>!!window.Realm&&Realm.diagnostics.characters.writer===true')
                    page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"')
                    reloaded = mark('native-reload-paid-and-bound')
                    check('Native reload retains paid ledger, binding, balances and original ownership',
                          reloaded['earthExpedition'] == before_reload['earthExpedition'] and
                          reloaded['adventure']['earthBinding'] == before_reload['adventure']['earthBinding'] and
                          wallet(reloaded) == wallet(before_reload) and preservation(reloaded) == preservation(base))
                    write_json(out / 'FINAL_WORLD.json', reloaded)
                    final_d = diag()
                    natural_sandbox(base, reloaded, sandbox_catalogue)
                    report['bounded_history'] = bounded_history(base, reloaded)
                    report['diagnostic_errors'] = final_d.get('errors', [])
                    report['actual_raf'] = page.evaluate('()=>window.__earthCaptureRaf')
                    report['normal_adventure_elapsed_seconds'] = reloaded['adventure']['elapsed'] - base['adventure']['elapsed']
                    check('No browser or game diagnostic errors', not report['browser_errors'] and not report['diagnostic_errors'],
                          {'browser': report['browser_errors'], 'diagnostic': report['diagnostic_errors']})
                    check('No browser console errors', not report['console_errors'], report['console_errors'])
                    check('No external requests attempted', not report['external_requests'], report['external_requests'])
                    check('Source file unchanged during capture', hashes(source_path)['sha256'] == report['source']['sha256'])
                    check('Frozen HTML unchanged during capture', hashes(ROOT / 'index.html')['sha256'] == report['html']['sha256'] and
                          hashes(ROOT / 'FIRSTLIGHT_VALLEY.html')['sha256'] == report['html']['sha256'])
                    check('Every recorded source hash unchanged', all(hashes(ROOT / name) == old for name, old in source_hashes.items()))
                    report['status'] = 'passed'
                except Exception:
                    failure = traceback.format_exc()
                    report['status'] = 'failed'
                    report['failure'] = failure
                    if page is not None:
                        try:
                            write_json(out / 'FAILURE_WORLD.json', page.evaluate('()=>Realm.state'))
                            write_json(out / 'FAILURE_DIAGNOSTICS.json', page.evaluate('()=>Realm.diagnostics'))
                            report['last_visible_ui'] = page.locator('body').inner_text()
                            page.screenshot(path=str(out / 'FAILURE_FRAME.png'))
                        except Exception as e:
                            report['failure_inspection_error'] = repr(e)
                finally:
                    if context is not None:
                        try:
                            context.close()
                            context = None
                            report['context_closed'] = True
                            if video is not None:
                                video_path = Path(video.path())
                                report['video'] = {'path': video_path.name, **hashes(video_path), 'audio': False}
                        except Exception as e:
                            report['status'] = 'failed'
                            report['context_close_error'] = repr(e)
                            failure = failure or repr(e)
                            # Make a final in-lifetime close attempt before the
                            # profile manager and Playwright themselves exit.
                            try:
                                if context is not None and context.browser is not None:
                                    context.browser.close()
                                    report['context_closed'] = True
                                    context = None
                            except Exception as second:
                                report['browser_close_error'] = repr(second)
    except Exception:
        failure = failure or traceback.format_exc()
        report['status'] = 'failed'
        report['failure'] = failure
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
        report['loopback_closed'] = not thread.is_alive()
        report['wall_seconds'] = time.monotonic() - started
        report['check_count'] = len(report['checks'])
        report['failed_checks'] = [c for c in report['checks'] if not c['ok']]
        write_json(out / 'REPORT.json', report)
    print(json.dumps({'status': report['status'], 'checks': report['check_count'], 'output': str(out),
                      'wall_seconds': report['wall_seconds'], 'video': report.get('video')}, indent=2), flush=True)
    if report['status'] != 'passed':
        raise SystemExit(failure or 'Capture failed; see preserved REPORT.json')


if __name__ == '__main__':
    main()
