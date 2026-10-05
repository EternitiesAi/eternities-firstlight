#!/usr/bin/env python3
"""Original-speed Atlantis footage from a command-earned inlet checkpoint.

Native import, realm menus, journal Walk links, WASD/F/G, combat and explicit
physical confirmations run on ordinary requestAnimationFrame. No test mode,
simulation stepping, direct game commands, actor relocation or camera-state
writes. Read-only diagnostics guide known-route keyboard automation. Polling
observations are not independent tests, human acceptance or FPS qualification.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import hashlib
import json
import math
import os
import threading
import time
import traceback
from browser_support import launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
OWNER_KEYS = ('journeys', 'realmTrails', 'earthExpedition', 'hellCampaign', 'heavenCampaign',
              'bridgeCommunity', 'localLife', 'homeHistory', 'notes', 'score', 'scoreRevision',
              'retreat', 'visitor', 'flowers')
ADVENTURE_KEYS = ('owned', 'equipment', 'arsenal', 'starter', 'pursuit', 'realmCraft', 'earthBinding',
                  'classPath', 'companion', 'beacon', 'crossing', 'road', 'earthStory', 'earthNotes',
                  'earthGathering', 'defeated', 'drops', 'reward', 'relic', 'angelSeen')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inputs():
    return [*sorted(p for p in (ROOT / 'src').iterdir() if p.is_file()), ROOT / 'build.py',
            ROOT / 'index.html', ROOT / 'FIRSTLIGHT_VALLEY.html', Path(__file__).resolve(),
            ROOT / 'tools/browser_support.py', ROOT / 'tests/atlantis_campaign_journey.cjs']


def epoch():
    return {str(p.relative_to(ROOT)): sha(p) for p in inputs()}


def wallet(world):
    return {k: world['adventure'][k] for k in ('xp', 'coins', 'ore')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True, help='Command-earned CHECKPOINT_INLET.json beside its successful full journey report.')
    parser.add_argument('--output', type=Path, required=True, help='A NEW absolute D: capture directory on Windows.')
    parser.add_argument('--renderer', choices=('hardware', 'software'), default='hardware')
    parser.add_argument('--choice', choices=('publish', 'limited', 'license'), default='publish')
    args = parser.parse_args()
    source, out = args.source.resolve(), args.output.resolve()
    if not args.output.is_absolute() or out == Path(out.anchor) or out.exists():
        parser.error('Use a new absolute capture directory; existing evidence is preserved.')
    if os.name == 'nt' and (out.drive.upper() != 'D:' or source.drive.upper() != 'D:'):
        parser.error('The source, persistent profile and capture evidence must stay on D:.')
    proof_path = source.with_name('SEED_PROVENANCE.json')
    journey_path = source.with_name('ATLANTIS_CAMPAIGN_JOURNEY_REPORT.json')
    initial_path = source.with_name('00_EARNED_SEED.json')
    if any(not p.is_file() for p in (source, proof_path, journey_path, initial_path)):
        parser.error('The inlet checkpoint needs its original seed, provenance and complete journey report.')
    seed = json.loads(source.read_text(encoding='utf-8-sig'))
    proof = json.loads(proof_path.read_text(encoding='utf-8-sig'))
    journey = json.loads(journey_path.read_text(encoding='utf-8-sig'))
    quest = seed.get('atlantisCampaign', {})
    done = quest.get('steps', [])
    if not quest.get('accepted') or 'inlet-set' not in done or any(s in done for s in ('equalizer-set', 'outlet-set', 'challenge-custodian', 'manual-bypass')) or quest.get('claimed') or quest.get('choice') is not None:
        parser.error('Use the earned inlet checkpoint before equalizer/outlet/combat, with the repair current still available.')
    if journey.get('status') != 'passed' or journey.get('sourceDrift') is not False or source.stem not in journey.get('checkpoints', []):
        parser.error('The exact labelled checkpoint must belong to a successful frozen full journey.')
    if journey.get('checkpointHashes', {}).get(source.stem) != sha(source):
        parser.error('The inlet checkpoint bytes do not match the successful journey receipt.')
    if proof.get('seedSha256') != sha(initial_path) or proof.get('sourceHashes') != journey.get('sourceHashes'):
        parser.error('The original earned seed or source provenance does not match its journey.')
    if any(journey.get(k) != 0 or proof.get(k) != 0 for k in ('positionEdits', 'inventoryGrants', 'manualDamage', 'forcedModes', 'plantedDefeats')):
        parser.error('The source provenance does not retain the required command-earned caller boundaries.')
    if any(not (ROOT / p).is_file() or sha(ROOT / p) != value for p, value in proof['sourceHashes'].items()):
        parser.error('Journey source hashes differ from this capture epoch; use fresh frozen earned evidence.')
    out.mkdir(parents=True, exist_ok=False)
    for p, name in ((source, 'SOURCE_WORLD.json'), (proof_path, 'SOURCE_PROVENANCE.json'),
                    (journey_path, 'SOURCE_JOURNEY_REPORT.json'), (initial_path, 'SOURCE_INITIAL_SEED.json')):
        (out / name).write_bytes(p.read_bytes())
    hashes = epoch()
    report = {'status': 'running', 'method': __doc__, 'source': str(source), 'source_sha256': sha(source),
              'source_receipts': {str(p): sha(p) for p in (source, proof_path, journey_path, initial_path)},
              'html_sha256': sha(ROOT / 'index.html'), 'source_hashes': hashes,
              'renderer_requested': args.renderer, 'choice_requested': args.choice,
              'viewport': {'width': 1440, 'height': 900}, 'observations': [], 'events': [], 'screenshots': [],
              'errors': [], 'console_errors': [], 'condition_evaluations': [], 'inputs': [],
              'normal_time_footage': True, 'accelerated_ticks': False, 'test_mode': False,
              'direct_game_commands': 0, 'actor_position_writes': 0, 'camera_state_writes': 0,
              'human_acceptance': False, 'performance_qualification': False, 'fps_claim': False,
              'condition_scope': 'Capture completion/safety observations; repeated polling is not an independent test count.',
              'damage_attribution': 'Observed owned enemy health and production target/auto controls; no weapon-only attribution is inferred from generic hit counters.',
              'settings_scope': 'Native balanced quality, time-flow toggle and camera controls only, in this new isolated profile.'}
    (out / 'RUN_INPUTS.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    started = time.monotonic()
    server = context = page = video = pw = None
    held = set()

    def check(name, ok, detail=None):
        report['condition_evaluations'].append({'name': name, 'ok': bool(ok), 'detail': detail, 'seconds': time.monotonic() - started})
        if not ok:
            raise AssertionError(name + ': ' + str(detail))

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def log_message(self, *a):
            pass

    try:
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        origin = 'http://127.0.0.1:' + str(server.server_port)
        report['origin'] = origin
        from playwright.sync_api import sync_playwright
        pw = sync_playwright().start()
        context = pw.chromium.launch_persistent_context(str(out / 'profile'), **launch_kwargs(args.renderer),
                   viewport=report['viewport'], record_video_dir=str(out), record_video_size=report['viewport'])
        page = context.new_page()
        video = page.video
        for blank in context.pages:
            if blank != page:
                blank.close()
        context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(origin + '/') else route.abort())
        page.on('pageerror', lambda error: report['errors'].append(str(error)))
        page.on('console', lambda message: report['console_errors'].append(message.text) if message.type == 'error' else None)

        def ready():
            page.wait_for_function('()=>!!window.Realm')
            page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"')

        response = page.goto(origin + '/index.html', wait_until='load')
        ready()
        check('exact served HTML', hashlib.sha256(response.body()).hexdigest() == report['html_sha256'])
        check('assembled HTML copies identical', sha(ROOT / 'FIRSTLIGHT_VALLEY.html') == report['html_sha256'])
        check('ordinary production interface', page.evaluate('()=>!Reflect.has(Realm,"test")'))
        state = lambda: page.evaluate('()=>Realm.state')
        diag = lambda: page.evaluate('()=>{const d=Realm.diagnostics;return{scene:d.scene,mode:d.mode,renderer:d.renderer,world:d.world,atlantis:d.atlantis,adventure:d.adventure,characters:d.characters,camera:{preset:d.camera.preset,yaw:d.camera.yaw,projection:d.camera.projection},saveState:d.saveState,errors:d.errors};}')

        def click(selector):
            locator = page.locator(selector)
            check('unique native control ' + selector, locator.count() == 1, locator.count())
            report['inputs'].append({'click': selector, 'seconds': time.monotonic() - started})
            locator.click()

        def press(key):
            report['inputs'].append({'key': key, 'seconds': time.monotonic() - started})
            page.keyboard.press(key)

        def hold(keys, milliseconds):
            report['inputs'].append({'hold': keys, 'milliseconds': milliseconds, 'seconds': time.monotonic() - started})
            try:
                for key in keys:
                    page.keyboard.down(key)
                    held.add(key)
                page.wait_for_timeout(milliseconds)
            finally:
                for key in keys:
                    page.keyboard.up(key)
                    held.discard(key)

        def close():
            if page.locator('#rpg-window').evaluate('(e)=>e.open'):
                click('#rpg-close')

        def workspace(tab='atlantis-campaign'):
            close()
            press('j')
            if tab == 'atlantis-campaign':
                click('#rpg-content [data-rpg="atlantis-campaign-open"]')
            else:
                click('#rpg-tabs [data-rpg="open"][data-id="' + tab + '"]')

        def mark(label):
            name = str(len(report['screenshots']) + 1).zfill(2) + '_' + label + '.png'
            report['events'].append({'label': label, 'seconds': time.monotonic() - started, 'diagnostics': diag(), 'campaign': state()['atlantisCampaign']})
            path = out / name
            page.screenshot(path=str(path))
            report['screenshots'].append({'path': str(path), 'sha256': sha(path)})

        def movement_key(point, snapshot):
            player, yaw = snapshot['adventure']['player'], snapshot['camera']['yaw']
            dx, dz = point['x'] - player['x'], point['z'] - player['z']
            x, z = dx * math.cos(yaw) - dz * math.sin(yaw), dx * math.sin(yaw) + dz * math.cos(yaw)
            return ('d' if x > 0 else 'a') if abs(x) > abs(z) else ('s' if z > 0 else 'w')

        def still_near(point, label, timeout=150):
            start, prior, stable = time.monotonic(), None, None
            while time.monotonic() - start < timeout:
                d = diag()
                p = d['adventure']['player']
                check('alive during native route ' + label, state()['adventure']['hp'] > 0)
                distance = math.hypot(p['x'] - point['x'], p['z'] - point['z'])
                motion = math.inf if prior is None else math.hypot(p['x'] - prior['x'], p['z'] - prior['z'])
                if distance < 2.75 and motion < .015:
                    stable = stable or time.monotonic()
                    if time.monotonic() - stable > .35:
                        return
                else:
                    stable = None
                prior = p
                page.wait_for_timeout(120)
            raise TimeoutError('Native Walk link did not reach ' + label)

        def walk(identifier):
            workspace()
            if identifier == 'entry':
                click('#rpg-content [data-rpg="atlantis-campaign-entry"]')
                point = {'x': 8, 'z': -16}
            else:
                click('#rpg-content [data-rpg="atlantis-campaign-walk"][data-id="' + identifier + '"]')
                point = definition['giver'] if identifier == 'claim' else steps[identifier]
            still_near(point, identifier)

        def swim_to(x, y, z, label):
            close()
            start, trace = time.monotonic(), []
            while time.monotonic() - start < 90:
                d = diag()
                dive = d['world']['dive'] if d.get('world') else None
                check('actual gallery mode during ' + label, bool(dive), d['scene'])
                check('alive during native swim ' + label, state()['adventure']['hp'] > 0)
                p, dy = d['adventure']['player'], y - dive['y']
                distance = math.hypot(x - p['x'], z - p['z'])
                trace.append({'seconds': time.monotonic() - start, 'player': p, 'feet_y': dive['y'], 'body': dive['body'], 'court': dive.get('dryCourt')})
                if distance < .14 and abs(dy) < .075:
                    report['observations'].append({'label': label, 'target': {'x': x, 'y': y, 'z': z}, 'seconds': time.monotonic() - start, 'trace': trace})
                    return
                keys = []
                if distance >= .14:
                    keys.append(movement_key({'x': x, 'z': z}, d))
                if abs(dy) >= .075:
                    keys.append('f' if dy > 0 else 'g')
                amount = min(110, max(40, 1000 * max(distance if distance >= .14 else 0, abs(dy) if abs(dy) >= .075 else 0) / 2.6))
                hold(keys, int(amount))
            raise TimeoutError('Ordinary keyboard swimming did not reach ' + label)

        def physical(kind, identifier):
            workspace()
            click('#rpg-content [data-atlantis-step="' + identifier + '"] [data-rpg="atlantis-campaign-' + kind + '"][data-id="' + identifier + '"]')
            check('native physical action saved ' + identifier, identifier in state()['atlantisCampaign']['steps'])
            close()

        initial_character = diag()['characters']
        workspace('characters')
        with page.expect_file_chooser() as chooser:
            click('#rpg-content [data-rpg="chars-import"]')
        chooser.value.set_files(str(source))
        page.wait_for_selector('#rpg-content [data-rpg="chars-confirm-import"]')
        click('#rpg-content [data-rpg="chars-confirm-import"]')
        page.wait_for_function('prior=>Realm.diagnostics.characters.writer&&Realm.diagnostics.characters.active!==prior.active&&Realm.diagnostics.characters.count===prior.count+1', arg=initial_character)
        check('earned inlet history imported unchanged', state()['atlantisCampaign'] == quest)
        imported = state()
        close()
        click('#settings')
        page.locator('#quality').select_option('balanced')
        page.locator('#setting-timeFlow').uncheck()
        click('#close-panel')
        d = diag()
        report['browser'] = context.new_cdp_session(page).send('Browser.getVersion')
        report['renderer'] = d['renderer']
        check('actual WebGL2 surface', d['mode'] == 'webgl2')
        check('requested hardware renderer', args.renderer != 'hardware' or not any(s in (d['renderer'] or '').lower() for s in ('swiftshader', 'software', 'llvmpipe')))
        workspace('worlds')
        if page.locator('#rpg-content [data-rpg="world-list"]').count():
            click('#rpg-content [data-rpg="world-list"]')
        click('#rpg-content [data-rpg="world-select"][data-id="atlantis"]')
        if not page.locator('#rpg-content [data-rpg="world-preview"]').count():
            click('#rpg-content [data-rpg="world-road"]')
            still_near({'x': 18, 'z': 6}, 'home five-light marker')
            workspace('worlds')
            click('#rpg-content [data-rpg="world-select"][data-id="atlantis"]')
        click('#rpg-content [data-rpg="world-preview"]')
        click('#rpg-content [data-rpg="world-confirm"]')
        page.wait_for_function('()=>Realm.diagnostics.scene==="world-atlantis"')
        definition = page.evaluate('()=>RealmAtlantisCampaign.definition')
        steps = {s['id']: s for s in definition['steps']}
        mark('earned_inlet_returned_to_farwake')
        walk('entry')
        workspace()
        click('#rpg-content [data-rpg="world-dive"]')
        page.wait_for_function('()=>!!Realm.diagnostics.world?.dive')
        click('#rpg-hud [data-rpg="camera"][data-id="adventure"]')
        swim_to(8, -1.05, -25, 'actual_shallow_band')
        check('accepted repair current active', diag()['atlantis']['current']['active'])
        before_flow = diag()
        page.wait_for_timeout(750)
        after_flow = diag()
        report['current_observation'] = {'before': before_flow, 'after': after_flow, 'wall_wait_ms': 750}
        check('ordinary current displaced the actual player', after_flow['atlantis']['motion']['currentDistance'] > before_flow['atlantis']['motion']['currentDistance'] and after_flow['adventure']['player']['z'] < before_flow['adventure']['player']['z'])
        mark('shallow_flow_and_depth_controls')
        swim_to(8, -2.55, -28, 'quiet_lower_depth')
        before_quiet = diag()
        page.wait_for_timeout(650)
        after_quiet = diag()
        check('actual lower band stays quiet', before_quiet['adventure']['player'] == after_quiet['adventure']['player'] and before_quiet['world']['dive']['y'] == after_quiet['world']['dive']['y'])
        press('v')
        mark('quiet_lower_band_diorama')
        for x, y, z in ((8, -2.7, -29.5), (8, -2.7, -32), (8, -2.7, -35)):
            swim_to(x, y, z, 'air_court_inbound_' + str(z))
        check('actual quiet Bellglass air court', bool(diag()['world']['dive']['dryCourt']) and diag()['world']['dive']['body'] == 'air')
        mark('bellglass_breathable_court')
        physical('pressure', 'equalizer-set')
        mark('actual_equalizer_recorded')
        for x, y, z in ((8, -2.7, -32), (8, -2.7, -29.5), (8, -1.8, -29), (12, -1.8, -29), (12, -1.4, -38.4)):
            swim_to(x, y, z, 'east_outlet_route_' + str(x) + '_' + str(z))
        physical('pressure', 'outlet-set')
        check('actual outlet stops only this repair current', not diag()['atlantis']['current']['active'])
        mark('actual_outlet_and_carrier_bay')
        swim_to(12, -1.4, -39.3, 'actual_far_gallery_landing')
        press('e')
        page.wait_for_function('()=>Realm.diagnostics.world&&!Realm.diagnostics.world.dive')
        mark('physical_dry_landing_exit')
        walk('secure-carrier')
        physical('step', 'secure-carrier')
        walk('challenge-custodian')
        physical('step', 'challenge-custodian')
        walk('bearing-exposed')
        close()
        click('#rpg-hud [data-rpg="camera"][data-id="adventure"]')
        for _ in range(8):
            press('Tab')
            if diag()['adventure']['tactics']['target'] == definition['enemy']['id']:
                break
        check('native target is actual anchored Custodian', diag()['adventure']['tactics']['target'] == definition['enemy']['id'])
        click('#target-framing')
        before_combat = state()
        start, trace, warning_views, guards, motion_inputs = time.monotonic(), [], set(), 0, 0
        auto_started = False
        while time.monotonic() - start < 180 and 'bearing-exposed' not in state()['atlantisCampaign']['steps']:
            d, world = diag(), state()
            ad = d['adventure']
            enemy = next((e for e in ad['enemies'] if e['id'] == definition['enemy']['id']), None)
            check('alive during ordinary Custodian fight', world['adventure']['hp'] > 0)
            if enemy is None:
                break
            check('actual municipal body stays anchored', math.hypot(enemy['x'] - definition['enemy']['x'], enemy['z'] - definition['enemy']['z']) < 1e-6)
            trace.append({'seconds': time.monotonic() - start, 'enemy': enemy, 'player': ad['player'], 'health': world['adventure']['hp'], 'auto': ad['tactics']['auto'], 'motion': d['atlantis']['motion']})
            if enemy['mode'] == 'windup' and enemy.get('strike'):
                view = (enemy['strike']['kind'], d['camera']['preset'])
                if view not in warning_views:
                    warning_views.add(view)
                    mark('locked_' + view[0] + '_' + view[1])
                if world['adventure']['elapsed'] >= ad['tactics']['cooldowns']['guard'] and world['adventure']['stamina'] >= 20:
                    press('3')
                    guards += 1
            # Observe both canonical warns in both native views before deliberately
            # starting weapon autoattack. The anchored unit does not chase retreat.
            if not auto_started and {('sweep', 'adventure'), ('intake', 'adventure')}.issubset(warning_views) and d['camera']['preset'] == 'adventure':
                press('v')
            if not auto_started and all((kind, view) in warning_views for kind in ('sweep', 'intake') for view in ('adventure', 'diorama')):
                press('1')
                auto_started = True
            if world['adventure']['hp'] < 45 and world['adventure']['tonics']:
                press('6')
            if auto_started:
                distance = math.hypot(ad['player']['x'] - enemy['x'], ad['player']['z'] - enemy['z'])
                if ad['weapon']['style'] == 'blade' and distance > 2.15:
                    hold([movement_key(enemy, d)], 140)
                    motion_inputs += 1
                if not diag()['adventure']['tactics']['auto']:
                    press('1')
            page.wait_for_timeout(100)
        after_combat = state()
        check('actual owned bearing exhausted through ordinary combat', 'bearing-exposed' in after_combat['atlantisCampaign']['steps'])
        check('both real locked warnings recorded in both cameras', all((kind, view) in warning_views for kind in ('sweep', 'intake') for view in ('adventure', 'diorama')), sorted(warning_views))
        check('ordinary Brace or movement used', guards > 0 or motion_inputs > 0)
        check('Custodian grants no separate fee', wallet(after_combat) == wallet(before_combat))
        report['combat_observation'] = {'seconds': time.monotonic() - start, 'trace': trace, 'warning_views': sorted(warning_views), 'native_guard_inputs': guards, 'native_movement_inputs': motion_inputs}
        mark('actual_bearing_exposed_no_fee')
        for identifier in ('release-west', 'release-east'):
            walk(identifier)
            physical('pressure', identifier)
            mark('actual_' + identifier)
        walk('custodian-stable')
        physical('step', 'custodian-stable')
        walk('disposition')
        workspace()
        before_choice = state()['atlantisCampaign']
        click('#rpg-content [data-atlantis-step="disposition"] [data-rpg="atlantis-campaign-review"][data-id="' + args.choice + '"]')
        check('disposition preview grants no consent or progress', state()['atlantisCampaign'] == before_choice)
        mark('deliberate_disposition_preview')
        click('#rpg-content .atlantis-campaign-confirm [data-rpg="atlantis-campaign-confirm"][data-id="' + args.choice + '"]')
        check('explicit saved local disposition', state()['atlantisCampaign']['choice'] == args.choice)
        close()
        mark('saved_registry_disposition')
        walk('verify-passage')
        physical('step', 'verify-passage')
        check('local handoff verified and still unpaid', 'verify-passage' in state()['atlantisCampaign']['steps'] and not state()['atlantisCampaign']['claimed'])
        mark('verified_local_handoff_unpaid')
        walk('claim')
        workspace()
        before_fee = state()
        click('#rpg-content [data-rpg="atlantis-campaign-claim"]')
        paid = state()
        fee = definition['reward']
        check('whole fixed fee deliberately claimed', paid['atlantisCampaign']['claimed'] and paid['adventure']['xp'] - before_fee['adventure']['xp'] == min(fee['xp'], 9999 - before_fee['adventure']['xp']) and all(paid['adventure'][k] - before_fee['adventure'][k] == fee[k] for k in ('coins', 'ore')) and all(paid['sandbox']['inventory'][k] - before_fee['sandbox']['inventory'][k] == n for k, n in fee['materials'].items()))
        check('all other prior saved owners retained', all(paid[k] == imported[k] for k in OWNER_KEYS) and all(paid['adventure'][k] == imported['adventure'][k] for k in ADVENTURE_KEYS))
        mark('paid_local_recognition')
        close()
        page.reload(wait_until='load')
        ready()
        check('ordinary native reload retains exact campaign', state()['atlantisCampaign'] == paid['atlantisCampaign'])
        check('ordinary native reload retains the whole fee', wallet(state()) == wallet(paid) and state()['sandbox']['inventory'] == paid['sandbox']['inventory'])
        check('reopening uses the home checkpoint', diag()['scene'] == 'valley')
        mark('native_reload_preserved_home_checkpoint')
        check('no browser or GL console errors', not report['errors'] and not report['console_errors'], {'page': report['errors'], 'console': report['console_errors']})
        check('frozen source, capture and source receipts', epoch() == hashes and all(sha(Path(p)) == value for p, value in report['source_receipts'].items()))
        report['status'] = 'passed'
    except Exception:
        report['status'], report['failure'] = 'failed', traceback.format_exc()
        if page:
            try:
                page.screenshot(path=str(out / 'FAILURE.png'))
                report['failure_diagnostics'] = page.evaluate('()=>{const d=Realm.diagnostics;return{scene:d.scene,world:d.world,atlantis:d.atlantis,adventure:d.adventure,camera:{preset:d.camera.preset,yaw:d.camera.yaw}};}')
            except Exception:
                report['failure_capture_error'] = traceback.format_exc()
    finally:
        if page:
            for key in tuple(held):
                try:
                    page.keyboard.up(key)
                except Exception:
                    report.setdefault('key_release_failures', []).append(traceback.format_exc())
        try:
            if context:
                context.close()
            if video:
                path = Path(video.path())
                report['raw_video'] = {'path': str(path), 'sha256': sha(path), 'speed': 'original unretimed recorder output'}
        except Exception:
            report['cleanup_failure'] = traceback.format_exc()
            report['status'] = 'failed'
        finally:
            if pw:
                try:
                    pw.stop()
                except Exception:
                    report['playwright_stop_failure'] = traceback.format_exc()
                    report['status'] = 'failed'
            if server:
                server.shutdown()
                server.server_close()
        if 'raw_video' not in report:
            # Retain recorder files even if a browser disconnect made its video
            # handle unavailable during cleanup; no transcoding or retiming.
            report['retained_raw_video_files'] = [{'path': str(p), 'sha256': sha(p)} for p in out.glob('*.webm') if p.is_file()]
        try:
            report['final_source_hashes'] = epoch()
            report['source_frozen'] = report['final_source_hashes'] == hashes
            if not report['source_frozen']:
                report['status'] = 'failed'
        except Exception:
            report['final_hash_failure'] = traceback.format_exc()
            report['status'] = 'failed'
        report['wall_seconds'] = time.monotonic() - started
        (out / 'REPORT.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'status': report['status'], 'condition_evaluations': len(report['condition_evaluations']), 'observations_are_tests': False, 'seconds': report['wall_seconds'], 'video': report.get('raw_video'), 'failure': report.get('failure')}, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
