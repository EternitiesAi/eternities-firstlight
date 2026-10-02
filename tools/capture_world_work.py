#!/usr/bin/env python3
"""Record one command-earned Coastward outing through production UI and real RAF.

The only imported source is the labelled initial expedition kit. Crossing,
acceptance, walking, three records, explicit payment and free return use the
ordinary UI. RPG workspaces pause normally while read; movement never advances
artificial time. Time, quality and camera setup are labelled presentation only.
This records playable progression, not human pacing or the complete Earth world.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import argparse
import copy
import hashlib
import json
import threading
import time
import traceback

from playwright.sync_api import sync_playwright
from browser_support import launch_kwargs

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'evidence10/world-foundations/journey/fresh-blade/00_INITIAL_KIT.json'
REWARD = {'xp': 28, 'coins': 12, 'ore': 2}
OBJECTIVES = ['first', 'second', 'third']
SOURCE_FILES = [
    'src/core.js', 'src/adventure.js', 'src/combat.js', 'src/arsenal.js',
    'src/world-atlantis-earth.js', 'src/world-foundations.js',
    'src/world-foundations-art.js', 'src/world-foundations-ui.js',
    'src/pursuit-ui.js', 'src/rpg-ui.js', 'src/world.js', 'src/engine.js',
    'src/app.js', 'tools/browser_support.py', 'tools/capture_world_work.py',
]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def balances(world):
    return {key: world['adventure'][key] for key in REWARD}


def preserved(world):
    """Everything except declared payout, outing state and normal presentation/time.

Full gear, legacy progress, resource ownership, music, notes and creative data
remain here. Journal append and the five work revisions are checked separately.
Resident location/progress follows normal schedules; identity/conversations stay.
"""
    result = copy.deepcopy(world)
    for key in ['player', 'hour', 'day', 'journal', 'nextEvent', 'journeys']:
        result.pop(key)
    result['residents'] = [
        {'id': person['id'], 'conversations': person['conversations']}
        for person in result['residents']
    ]
    for key in ['elapsed', 'revision', 'xp', 'coins', 'ore']:
        result['adventure'].pop(key)
    result['sandbox'].pop('elapsed')
    for key in ['quality', 'cameraMode', 'cameraViews']:
        result['settings'].pop(key)
    return result


def validate_source(world):
    a = world['adventure']
    assert a['started'] and a['equipment'] == {
        'weapon': 'trail_blade', 'armor': 'travel_coat', 'charm': None,
    }
    assert a['owned'] == ['trail_blade', 'travel_coat']
    assert balances(world) == {'xp': 0, 'coins': 0, 'ore': 0}
    assert a['hp'] == 100 and a['deaths'] == 0
    assert any(r['id'] == 'earned-world-kit' and r['fp'] == '["start",{}]'
               and r['ok'] for r in a['receipts'])
    assert all(r == {'counter': 0, 'lastClaim': 0, 'firstClaimed': False,
                     'active': None, 'defeated': []}
               for r in world['journeys']['realms'].values())


def validate_final(initial, final):
    assert preserved(final) == preserved(initial), 'Canonical ownership changed'
    delta = {key: balances(final)[key] - balances(initial)[key] for key in REWARD}
    assert delta == REWARD, delta
    assert final['journeys']['version'] == initial['journeys']['version']
    assert final['journeys']['realms']['earthlands'] == {
        'counter': 1, 'lastClaim': 1, 'firstClaimed': True,
        'active': None, 'defeated': [],
    }
    for realm, old in initial['journeys']['realms'].items():
        if realm != 'earthlands':
            assert final['journeys']['realms'][realm] == old, realm
    assert final['adventure']['revision'] == initial['adventure']['revision'] + 5
    assert final['journal'][:len(initial['journal'])] == initial['journal']
    added = final['journal'][len(initial['journal']):]
    assert len([event for event in added if event['kind'] == 'realm-work']) == 5
    assert all(event['kind'] in {'realm-work', 'routine', 'discovery'} for event in added)
    assert final['nextEvent'] == initial['nextEvent'] + len(added)
    assert final['adventure']['elapsed'] > initial['adventure']['elapsed']
    assert abs((final['adventure']['elapsed'] - initial['adventure']['elapsed']) -
               (final['sandbox']['elapsed'] - initial['sandbox']['elapsed'])) < 1e-6
    return delta


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    out = args.output.resolve()
    if not args.output.is_absolute() or out.drive.lower() != 'd:':
        parser.error('--output must be an absolute path on D:')
    if out.exists() and any(out.iterdir()):
        parser.error('--output must be empty; existing recordings are preserved')
    initial = json.loads(SOURCE.read_text(encoding='utf-8'))
    validate_source(initial)
    out.mkdir(parents=True, exist_ok=True)
    report = {
        'method': __doc__, 'source': str(SOURCE.relative_to(ROOT)),
        'source_sha256': sha(SOURCE), 'html_sha256': sha(ROOT / 'index.html'),
        'sources_sha256': {name: sha(ROOT / name) for name in SOURCE_FILES},
        'viewport': {'width': 1280, 'height': 720}, 'quality': 'balanced',
        'presentation_setup': ['Import labelled command-earned initial kit',
                               'Balanced quality; evening hour 17',
                               'Camera framing only; V exchanges actual modes'],
        'events': [], 'walks': [], 'ui_readings': [], 'browser_errors': [],
        'external_requests': [], 'human_acceptance': False,
        'sustained_performance_qualification': False,
        'workspace_pause': 'Production RPG panels pause; outdoor walking uses ordinary RAF',
    }
    assert sha(ROOT / 'FIRSTLIGHT_VALLEY.html') == report['html_sha256']

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_port}'
    report['origin'] = origin
    started = time.monotonic()
    context = browser = page = None
    failure = None
    try:
        with sync_playwright() as pw:
            try:
                browser = pw.chromium.launch(**launch_kwargs('hardware'))
                report['browser'] = browser.version
                context = browser.new_context(
                    viewport=report['viewport'], record_video_dir=str(out),
                    record_video_size=report['viewport'],
                )

                def route(request):
                    if request.request.url.startswith(origin + '/'):
                        request.continue_()
                    else:
                        report['external_requests'].append(request.request.url)
                        request.abort()

                context.route('**/*', route)
                page = context.new_page()
                page.add_init_script('''window.__ETERNITIES_TEST_MODE=true;
                    window.__worldWorkRaf={frames:0,first:null,last:null};
                    requestAnimationFrame(function count(t){const r=window.__worldWorkRaf;
                      r.frames++;if(r.first===null)r.first=t;r.last=t;requestAnimationFrame(count);});''')
                page.on('pageerror', lambda error: report['browser_errors'].append(str(error)))
                response = page.goto(origin + '/index.html')
                page.wait_for_function('()=>!!window.Realm')
                page.wait_for_function('()=>getComputedStyle(document.querySelector("#loading")).opacity==="0"')
                assert hashlib.sha256(response.body()).hexdigest() == report['html_sha256']
                page.evaluate('(world)=>Realm.test.replace(world)', initial)
                page.evaluate('Realm.test.quality("balanced");Realm.test.setTime(17)')
                report['renderer'] = page.evaluate('Realm.diagnostics.renderer')
                assert 'NVIDIA' in report['renderer'] and '3080' in report['renderer'], report['renderer']
                base = page.evaluate('Realm.state')
                assert preserved(base) == preserved(initial)
                home_checkpoint = page.evaluate('Realm.diagnostics.adventure.player')

                def state():
                    return page.evaluate('Realm.state')

                def close():
                    if page.locator('#rpg-window').evaluate('(element)=>element.open'):
                        page.locator('#rpg-close').click()

                def mark(name, paused=False):
                    d = page.evaluate('Realm.diagnostics')
                    assert d['adventure']['paused'] == paused, name
                    assert not page.evaluate('document.hidden'), name
                    w = state()
                    number = len(report['events'])
                    filename = f'{number:02d}_STATE.json'
                    (out / filename).write_text(json.dumps(w, indent=2) + '\n', encoding='utf-8')
                    event = {
                        'name': name, 'seconds': time.monotonic() - started,
                        'state_file': filename, 'scene': d['scene'],
                        'player': d['adventure']['player'], 'camera': d['camera'],
                        'paused_by_workspace': paused, 'balances': balances(w),
                        'journey': w['journeys']['realms']['earthlands'],
                        'music': d['music'], 'audio': d['audio'],
                        'characters': d['characters'], 'raf': page.evaluate('window.__worldWorkRaf'),
                    }
                    assert not d['music']['playing'] and not d['audio']['enabled']
                    report['events'].append(event)
                    print(name, round(event['seconds'], 2), flush=True)
                    return w

                def shot(name, paused=False):
                    page.wait_for_timeout(650)
                    page.screenshot(path=str(out / (name + '.png')))
                    mark('Screenshot ' + name, paused)

                def reading(name):
                    text = page.locator('#rpg-content').inner_text()
                    report['ui_readings'].append({'name': name, 'text': text,
                                                 'seconds': time.monotonic() - started})
                    return text

                def view(mode, yaw=.4, elevation=.2, distance=10):
                    close()
                    desired = 'orthographic' if mode == 'diorama' else 'perspective'
                    if page.evaluate('Realm.diagnostics.camera.projection') != desired:
                        page.keyboard.press('v')
                        page.wait_for_function('(value)=>Realm.diagnostics.camera.projection===value', arg=desired)
                        mark('Actual V exchange to ' + mode)
                    page.evaluate('(value)=>Realm.test.view(value)', {
                        'yaw': yaw, 'elevation': .66 if mode == 'diorama' else elevation,
                        'half': 16, 'distance': distance, 'zoom': 16 / 17.5,
                        'overview': False,
                    })
                    page.wait_for_timeout(400)
                    mark('Presentation framing ' + mode)

                def open_world():
                    close()
                    page.keyboard.press('j')
                    page.locator('#rpg-tabs [data-rpg="open"][data-id="worlds"]').click()

                def wait_walk(name, target, person=False, before=None):
                    before = before or {'world': state(), 'time': time.monotonic(),
                                        'raf': page.evaluate('window.__worldWorkRaf.frames')}
                    assert page.evaluate('Realm.test.path.length') > 0, name
                    page.wait_for_function('()=>Realm.test.path.length===0', polling='raf', timeout=120000)
                    d = page.evaluate('Realm.diagnostics')
                    p = d['adventure']['player']
                    distance = ((p['x'] - target['x']) ** 2 + (p['z'] - target['z']) ** 2) ** .5
                    assert 1.5 <= distance <= 1.9 if person else distance < .3, (name, p, distance)
                    after = state()
                    elapsed = after['adventure']['elapsed'] - before['world']['adventure']['elapsed']
                    frames = page.evaluate('window.__worldWorkRaf.frames') - before['raf']
                    assert elapsed > .1 and frames > 0
                    report['walks'].append({'name': name, 'target': target, 'endpoint': p,
                                           'endpoint_distance': distance, 'raf_frames': frames,
                                           'wall_seconds': time.monotonic() - before['time'],
                                           'ordinary_simulation_seconds': elapsed,
                                           'caller': 'production UI walkLocal → Simulation.moveTo'})
                    mark(name)

                def walk_point(point):
                    open_world()
                    before = {'world': state(), 'time': time.monotonic(),
                              'raf': page.evaluate('window.__worldWorkRaf.frames')}
                    page.locator('[data-rpg="world-walk"][data-id="' + point['id'] + '"]').click()
                    wait_walk('Normal accepted walk to ' + point['name'], point,
                              point['kind'] == 'person', before)

                def art_projection():
                    # Read-only production decoration projection, not a draw-buffer claim.
                    return page.evaluate('''()=>{const def=RealmWorldAtlantisEarth.realms.find(d=>d.id==='earthlands'),items=[];
                      const write=(kind,x,y,z,w,h,d,c,options={})=>{if(['field-sluice','produce-load'].includes(options.solidId))items.push({kind,p:[x,y,z],s:[w,h,d],c,...options});};
                      RealmWorldAtlantisEarth.decorate({add:write,box:(...a)=>write('box',...a)},def,
                        {height:(x,z)=>RealmWorldFoundations.height(def.room,x,z),sim:{state:Realm.state}});return items;}''')

                mark('Imported command-earned initial kit at home road')
                assert page.evaluate('Realm.diagnostics.scene') == 'valley'
                assert ((home_checkpoint['x'] - 18) ** 2 + (home_checkpoint['z'] - 6) ** 2) ** .5 < .1
                open_world()
                if page.locator('[data-rpg="world-list"]').count():
                    page.locator('[data-rpg="world-list"]').click()
                page.locator('[data-rpg="world-select"][data-id="earthlands"]').click()
                terms = reading('Declared travel and first payout terms')
                assert all(text in terms for text in ['28 XP', '12 sunmarks', '2 ore', 'free', 'allegiance'])
                page.locator('.world-work p').filter(has_text='Declared payout:').scroll_into_view_if_needed()
                shot('01-travel-and-reward-terms', True)
                page.locator('[data-rpg="world-preview"]').click()
                assert 'saved home checkpoint' in reading('Explicit crossing confirmation')
                shot('02-crossing-confirmation', True)
                page.locator('[data-rpg="world-confirm"]').click()
                assert page.evaluate('Realm.diagnostics.scene') == 'world-earthlands'
                mark('Explicit crossing with saved home checkpoint')
                definition = page.evaluate('RealmWorldFoundations.definition("earthlands")')
                assert definition['quest']['reward'] == REWARD
                points = {p['id']: p for p in definition['points']}
                giver = points[definition['quest']['giverId']]
                view('third', yaw=.4, distance=11)
                shot('03-coastward-before-work')
                walk_point(giver)
                view('third', yaw=.1, distance=8)
                shot('04-merren-readable-approach')
                page.keyboard.press('e')
                assert 'Merren' in reading('Merren first invitation')
                shot('05-merren-acceptance', True)
                page.locator('[data-rpg="world-accept"]').click()
                accepted = mark('Explicit acceptance; no reward paid', True)
                assert balances(accepted) == balances(initial)
                assert accepted['journeys']['realms']['earthlands']['active'] == {
                    'run': 1, 'kind': 'opening', 'observed': [],
                }
                close()
                report['work_art_before'] = art_projection()
                for index, objective in enumerate(definition['quest']['objectives']):
                    point = points[objective['pointId']]
                    walk_point(point)
                    view('third', yaw=.65 if index == 0 else -.45, distance=8)
                    shot(f'06-{index + 1}-objective-before-record')
                    page.keyboard.press('e')
                    reading('Objective ' + objective['id'])
                    shot(f'07-{index + 1}-objective-record-ui', True)
                    page.locator('[data-rpg="world-observe"][data-id="' + objective['id'] + '"]').click()
                    recorded = mark('Explicitly recorded objective ' + objective['id'], True)
                    assert recorded['journeys']['realms']['earthlands']['active']['observed'] == OBJECTIVES[:index + 1]
                    assert balances(recorded) == balances(initial)
                    close()
                walk_point(giver)
                page.keyboard.press('e')
                unpaid = mark('All three complete; explicitly unpaid at Merren', True)
                assert unpaid['journeys']['realms']['earthlands']['active']['observed'] == OBJECTIVES
                assert balances(unpaid) == balances(initial)
                assert page.locator('#tracked-progress').inner_text().startswith('3/3')
                reading('Completed run ready for deliberate turn-in')
                page.locator('[data-rpg="world-claim"]').scroll_into_view_if_needed()
                shot('08-completed-unpaid', True)
                page.locator('[data-rpg="world-claim"]').click()
                paid = mark('Explicit claim of 28 XP, 12 sunmarks and 2 ore', True)
                delta = {key: balances(paid)[key] - balances(unpaid)[key] for key in REWARD}
                assert delta == REWARD
                report['actual_reward_delta'] = delta
                assert paid['journeys']['realms']['earthlands']['active'] is None
                persisted = page.evaluate('''()=>{const raw=localStorage.getItem(RealmCharacters.KEY);
                  if(raw){const record=RealmCharacters.validate(JSON.parse(raw)),slot=record.slots.find(s=>s.id===record.active);
                    return{mode:'managed',revision:record.revision,active:record.active,world:slot.world};}
                  const legacy=localStorage.getItem(RealmCore.KEY);if(!legacy)throw Error('Paid outing has no saved world');
                  return{mode:'legacy',world:RealmCore.validate(JSON.parse(legacy))};}''')
                assert balances(persisted['world']) == balances(paid)
                assert persisted['world']['journeys'] == paid['journeys']
                assert preserved(persisted['world']) == preserved(paid)
                report['paid_persistence'] = {
                    'mode': persisted['mode'], 'revision': persisted.get('revision'),
                    'active': persisted.get('active'), 'balances': balances(persisted['world']),
                    'journey': persisted['world']['journeys']['realms']['earthlands'],
                    'method': 'Read actual localStorage record after production explicit claim; no reload',
                }
                (out / 'PAID_SAVED_WORLD.json').write_text(json.dumps(persisted['world'], indent=2) + '\n', encoding='utf-8')
                shot('09-explicit-payment', True)
                close()
                page.keyboard.press('c')
                assert '28' in page.locator('.character-stats').inner_text()
                assert '12 sunmarks' in page.locator('.bag-heading').inner_text()
                assert 'Copper ore' in page.locator('[data-rpg="item"][data-id="supply:ore"]').inner_text()
                reading('Earned balances and retained trail blade/travel coat')
                shot('09b-earned-balances-and-kept-equipment', True)
                close()
                page.keyboard.press('e')
                assert definition['quest']['completionText'] in reading('Merren recognizes this paid outing')
                shot('10-giver-recognition', True)
                close()
                report['work_art_after'] = art_projection()
                before_lever = next(i for i in report['work_art_before'] if i['solidId'] == 'field-sluice')
                after_lever = next(i for i in report['work_art_after'] if i['solidId'] == 'field-sluice')
                assert before_lever['r'] == [0, 0, 0] and after_lever['r'] == [0, 0, .3]
                assert report['work_art_before'] != report['work_art_after']
                view('diorama', yaw=.6)
                shot('11-paid-settlement-diorama')
                for point_id, name in [('produce-packing', '12-paid-produce-work'),
                                       ('field-water', '13-paid-field-water-work')]:
                    walk_point(points[point_id])
                    view('third', yaw=.65 if point_id == 'field-water' else -.45, distance=8)
                    shot(name)
                before_home = state()
                page.locator('#world-home').click()
                assert page.evaluate('Realm.diagnostics.scene') == 'valley'
                p = page.evaluate('Realm.diagnostics.adventure.player')
                assert p == home_checkpoint
                assert balances(state()) == balances(before_home)
                mark('Free home return retains paid work and exact balances')
                shot('14-free-home-with-earned-progress')
                open_world()
                page.locator('#rpg-content [data-rpg="open"][data-id="pursuit"]').click()
                page.locator('#rpg-content .guide-detail [data-rpg="pursuit-route"][data-id="oren"]').click()
                oren = page.evaluate('RealmStarter.OREN')
                wait_walk('Normal accepted walk to Oren workbench', oren)
                page.keyboard.press('j')
                page.locator('#rpg-tabs [data-rpg="open"][data-id="worlds"]').click()
                page.locator('#rpg-content [data-rpg="open"][data-id="pursuit"]').click()
                guide_before = state()
                for weapon, name in [('copper_blade', '15-home-blade-guide'),
                                     ('trail_bow', '16-home-bow-guide')]:
                    page.locator('#rpg-content .guide-catalogue [data-rpg="pursuit-select"][data-id="' + weapon + '"]').click()
                    detail = page.locator('.guide-detail[data-weapon="' + weapon + '"]')
                    text = detail.inner_text()
                    assert all(s in text for s in ['Equipped now', 'Materials', 'Costs are spent together'])
                    assert detail.locator('[data-rpg="pursuit-recipe"]').is_disabled()
                    reading('Read existing ' + weapon + ' costs and comparison; no craft')
                    shot(name, True)
                    assert balances(state()) == balances(guide_before)
                    assert preserved(state()) == preserved(guide_before)
                close()
                final = mark('Finished at home with unchanged gear and music')
                report['actual_reward_delta'] = validate_final(initial, final)
                report['canonical_ownership_preserved'] = True
                report['active_simulation_seconds'] = final['adventure']['elapsed'] - base['adventure']['elapsed']
                report['normal_time_seconds'] = time.monotonic() - started
                report['raf_observer'] = page.evaluate('window.__worldWorkRaf')
                assert report['raf_observer']['frames'] > 0
                assert report['active_simulation_seconds'] < report['normal_time_seconds'] + 1
                assert not report['browser_errors'] and not report['external_requests']
                assert not page.evaluate('Realm.diagnostics.errors')
                assert sha(ROOT / 'index.html') == report['html_sha256'], 'Build changed during recording'
                assert all(sha(ROOT / name) == digest for name, digest in report['sources_sha256'].items())
                (out / 'FINAL_WORLD.json').write_text(json.dumps(final, indent=2) + '\n', encoding='utf-8')
                report['status'] = 'passed'
            except Exception:
                report['status'] = 'failed'
                report['traceback'] = traceback.format_exc()
                failure = report['traceback']
            finally:
                if context:
                    context.close()
                    if page and page.video:
                        report['video_path'] = str(page.video.path())
                if browser:
                    browser.close()
    except Exception:
        report['status'] = 'failed'
        report['traceback'] = traceback.format_exc()
        failure = report['traceback']
    finally:
        server.shutdown()
        server.server_close()
        (out / 'REPORT.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    if failure:
        raise RuntimeError(failure)
    print(json.dumps({'status': report['status'], 'reward': report['actual_reward_delta'],
                      'walks': len(report['walks']), 'output': str(out)}, indent=2))


if __name__ == '__main__':
    main()
