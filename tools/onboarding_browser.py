"""Small native onboarding regression, inert on import.

Run only when Root releases its browser slot and installs the repaired UI. One
new D profile, two ephemeral characters, no videos/imported progress. Native
Journal, keyboard/touch summary, kit E, travel/accept/track/create/switch controls
perform all actions. Only production moveTo and .05-second ticks accelerate
setup/observe continued tracker projection. No pose, HP, facts, reward, camera,
test replacement, forced mode, direct damage or character-storage writes.
"""
from pathlib import Path, PureWindowsPath
import argparse
import copy
import functools
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
import math
import os
import sys
import subprocess
import threading
import time
import traceback

sys.dont_write_bytecode = True
LOCKED_ACTIONS = ('earth-homecoming-open', 'cosmos-campaign-open',
                  'atlantis-campaign-open', 'heaven-campaign-open', 'hell-campaign-open')
MODULES = ('core.js', 'characters.js', 'app.js', 'rpg-ui.js', 'local-life-ui.js',
           'local-life.js', 'realm-trails-ui.js', 'world-foundations-ui.js',
           'earth-consignment-data.js', 'earth-consignment.js',
           'earth-consignment-motion.js', 'earth-consignment-art.js',
           'earth-consignment-ui.js')
STAGES = ('fresh-journal', 'keyboard-later-requests', 'touch-later-requests',
          'earned-kit', 'earned-trail-acceptance', 'earned-commission-acceptance',
          'manual-homestead', 'manual-story', 'actual-civic-track',
          'new-character', 'whole-browser-cold-defaults', 'old-character-preserved')
LEGACY_KEYS = ('eternities.realm09.save.v8', 'eternities.realm08.save.v7',
               'eternities.realm07.save.v6', 'eternities.realm06.save.v5')
INIT = """window.__ETERNITIES_TEST_MODE=true;
window.__onboardingStartup=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));"""
JOURNAL_OBSERVATION = """()=>{const c=document.querySelector('#rpg-content'),
 j=c.querySelector('.journal-layout .journal-title'),d=c.querySelector('details.future-work');
 return{title:j?.querySelector('h3')?.textContent,chapterBeforeLater:!!(j&&d&&(j.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_FOLLOWING)),
 laterClosed:!!d&&!d.open,lockedActions:d?Array.from(d.querySelectorAll('[data-rpg]')).map(b=>b.dataset.rpg):[]};}"""


def fresh_start_terms(world):
    return (world['adventure']['started'] is False and world['adventure']['xp'] == 0 and
            all(not r['accepted'] for r in world['realmTrails']['records'].values()) and
            all(not r['accepted'] for r in world['localLife']['records'].values()) and
            all(not world[k]['accepted'] for k in ('hellCampaign', 'heavenCampaign',
                'atlantisCampaign', 'cosmosCampaign', 'earthHomecoming')))


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_new(path, value):
    with Path(path).open('x', encoding='utf8', newline='\n') as f:
        json.dump(value, f, indent=2, ensure_ascii=False)
        f.write('\n')


def within(path, root):
    return path == root or root in path.parents


def bounded(path):
    p = Path(path).resolve()
    if p == Path(p.anchor):
        raise ValueError('Use a bounded evidence directory, never a drive root.')
    if os.name == 'nt' and PureWindowsPath(str(p)).drive.upper() != 'D:':
        raise ValueError('Use D for the new evidence and isolated profile.')
    return p


def guard_output(output, root):
    p, root = bounded(output), Path(root).resolve()
    if within(p, root) or within(root, p):
        raise ValueError('New evidence must be separate from the game checkout.')
    if p.exists():
        raise FileExistsError('Existing output is never reused or overwritten.')
    return p


def profile_path(output):
    p = bounded(bounded(output) / 'onboarding-isolated-profile')
    if not within(p, Path(output).resolve()) or p.exists():
        raise FileExistsError('The single profile must be a fresh child of the evidence root.')
    return p


def resolve_root(argument=None):
    value = argument or os.environ.get('FIRSTLIGHT_ROOT')
    if value is None:
        candidate = Path(__file__).resolve().parents[1]
        value = candidate if (candidate / 'src/core.js').is_file() else None
    if value is None:
        raise ValueError('Supply --root or FIRSTLIGHT_ROOT for the actual installed game.')
    root = Path(value).resolve()
    if not (root / 'src/core.js').is_file():
        raise ValueError('An actual game checkout is required.')
    return root


def source_inputs(root):
    root = Path(root).resolve()
    files = sorted(p for p in (root / 'src').iterdir() if p.is_file())
    files += [root / n for n in ('build.py', 'index.html', 'FIRSTLIGHT_VALLEY.html', 'tools/browser_support.py')]
    if not all(p.is_file() and within(p.resolve(), root) for p in files):
        raise ValueError('Complete local source/build/pages/browser support required; links cannot escape Root.')
    if sha(root / 'index.html') != sha(root / 'FIRSTLIGHT_VALLEY.html'):
        raise ValueError('Both actual generated pages must be byte-identical.')
    html = (root / 'index.html').read_text(encoding='utf-8-sig')
    for name in MODULES:
        if (root / 'src' / name).read_text(encoding='utf-8-sig').strip() not in html:
            raise ValueError('Generated page does not embed actual caller: ' + name)
    files.append(Path(__file__).resolve())
    return {str(p.resolve()): sha(p) for p in files}


def require_frozen(inputs):
    for name, value in inputs.items():
        assert Path(name).is_file() and sha(name) == value, 'Frozen source changed: ' + name


def projection_signature(world):
    """Keep every save owner/key; normalize only remembered camera-view metadata.

    Pure UI probes are paused. Clock, adventure revision, payouts and journal
    remain protected. Root saves can remember camera views without quest consent.
    """
    result = copy.deepcopy(world)
    result.get('settings', {}).pop('cameraViews', None)
    return result


def living_signature(world):
    """Additional allowances only for explicitly advanced simulation time.

    No owner facts, choices, payouts, inventory, equipment, conversations or
    visited/history fields are omitted. The player must remain where they stand.
    """
    result = projection_signature(world)
    for key in ('day', 'hour'):
        result.pop(key, None)
    for key in ('elapsed', 'hp', 'stamina'):
        result.get('adventure', {}).pop(key, None)
    result.get('sandbox', {}).pop('elapsed', None)
    for resident in result.get('residents', []):
        for key in ('x', 'z', 'yaw', 'progress'):
            resident.pop(key, None)
    return result



RESUME_PREDICTOR = """const fs=require('node:fs'),C=require('./src/core.js');
require('./src/combat.js');
const q=JSON.parse(fs.readFileSync(0,'utf8'));
C.validate(q.after);
const sim=new C.Simulation(q.before);
sim.tick(q.seconds);
console.log(JSON.stringify(sim.snapshot()));"""


def require_initial_resume(root, before, after):
    """One whole-body reload's initial routine tick, never general live ticks.

    Protect the entire old journal prefix and every living_signature owner.
    An exact legacy four-job catalogue may gain only the independently declared
    literal fresh fifth record. Existing fifth-record progress is never reset.
    Only three events reproduced by actual installed Core may be appended.
    The snapshot clock must equal this first event clock: later ticks/events
    are not silently allowed. Stored event clocks are compared exactly.
    """
    old, journal = before['journal'], after['journal']
    assert journal[:len(old)] == old, 'Resume changed the old journal prefix.'
    assert len(journal) == len(old) + 3, 'Resume must append exactly the three initial routine events.'
    events = journal[len(old):]
    for value in (before['hour'], after['hour'], events[0]['hour']):
        assert isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value), 'Resume clock must be finite.'
    clock = events[0]['hour']
    assert before['day'] == after['day'] == events[0]['day'], 'Initial resume cannot invent a later day.'
    assert after['hour'] == clock, 'Resume snapshot is not at its one initial event clock.'
    # Check the actual binary64 clock ceiling, not an arbitrary epsilon on
    # history. Inverting the rounded .1 tick can give .10000000000016; Core
    # clamps it back to .1 and must still reproduce the exact stored clock.
    assert before['hour'] <= clock <= before['hour'] + .1 * .0045, 'Resume event clock exceeds one actual clamped tick.'
    derived_seconds = (clock - before['hour']) / .0045
    seconds = min(derived_seconds, .1)
    root = resolve_root(root)
    result = subprocess.run(['node', '-e', RESUME_PREDICTOR], cwd=root,
        input=json.dumps({'before': before, 'after': after, 'seconds': seconds}),
        capture_output=True, text=True, timeout=20)
    assert result.returncode == 0, 'Actual Core resume validation/prediction failed: ' + result.stderr.strip()
    predicted = json.loads(result.stdout)
    assert len(predicted['journal']) == len(old) + 3, 'Actual Core produced another event; this narrow resume contract does not cover it.'
    assert all(e['kind'] == 'routine' for e in predicted['journal'][len(old):]), 'Actual Core did not produce only the initial routines.'
    expected = living_signature(before)
    expected['journal'] = predicted['journal']
    expected['nextEvent'] = predicted['nextEvent']
    # Core now conditionally expands this exact legacy catalogue on load. Keep
    # the four raw histories and every other owner protected; do not derive the
    # allowance from Core's output or use its fresh-record builder as an oracle.
    catalogue = expected.get('localLife')
    legacy_ids = {'heaven-propagation-bed-v1', 'hell-refuge-water-v1',
                  'atlantis-bellglass-lamp-v1', 'cosmos-drawing-shelf-v1'}
    catalogue_migration = None
    if (isinstance(catalogue, dict) and set(catalogue) == {'version', 'records'} and
            type(catalogue['version']) is int and catalogue['version'] == 1 and
            isinstance(catalogue['records'], dict) and set(catalogue['records']) == legacy_ids):
        catalogue['records']['earth-first-load-through-v1'] = {
            'accepted': False, 'choice': None, 'steps': [], 'claimed': False}
        catalogue_migration = 'exact-old-four-to-fresh-first-load'
    assert expected == living_signature(predicted), 'Actual Core changed another protected owner; this contract does not allow it.'
    assert expected == living_signature(after), 'Resume changed an owner/history or forged an initial event.'
    assert predicted['day'] == after['day'] and predicted['hour'] == after['hour'], 'Actual Core clock prediction disagrees.'
    return {'preserved': True, 'method': 'Read-only installed Core.Simulation(before).tick(event-clock-derived seconds).snapshot()',
            'tickSeconds': seconds, 'derivedSecondsBeforeCoreClamp': derived_seconds,
             'oldPrefixLength': len(old), 'events': predicted['journal'][len(old):],
             'nextEventBefore': before['nextEvent'], 'nextEventAfter': predicted['nextEvent'],
             'coreSha256': sha(root / 'src/core.js'), 'additionalFutureEventsAllowed': False,
             'localLifeCatalogueMigration': catalogue_migration}


def require_projection_preserved(before, after):
    assert projection_signature(before) == projection_signature(after), 'UI changed saved owners, choices, history or non-camera metadata.'


def require_old_keys(before, after):
    assert all(k in after and before[k] == after[k] for k in before), 'An old storage key/value changed.'


def require_same_slots(before, after):
    # Native library revision can advance on a normal save. Slot membership,
    # selected identity and each complete semantic world stay explicit.
    for key in ('version', 'active', 'nextId'):
        assert before.get(key) == after.get(key), 'Library identity changed: ' + key
    old = {s['id']: projection_signature(s['world']) for s in before['slots']}
    new = {s['id']: projection_signature(s['world']) for s in after['slots']}
    assert old == new, 'A complete stored character world or membership changed.'


def require_journal(observation):
    assert observation.get('title') == 'The Feather Beneath Wildwood', 'Fresh current Chapter I missing.'
    assert observation.get('chapterBeforeLater') is True, 'Later requests precede the current chapter.'
    assert observation.get('laterClosed') is True, 'Later requests must start as a closed native group.'
    assert set(LOCKED_ACTIONS).issubset(observation.get('lockedActions', [])), 'A locked request lost its retained Read control.'


def no_saved_preference(value):
    if isinstance(value, dict):
        assert not {'trackerSelection', 'trackerSelecting', '_quest'} & value.keys(), 'Transient tracker preference leaked into native storage.'
        for child in value.values():
            no_saved_preference(child)
    elif isinstance(value, list):
        for child in value:
            no_saved_preference(child)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


class OnboardingBrowser:
    def __init__(self, root, output, report, renderer, headed=False):
        self.root, self.output, self.report = root, output, report
        self.renderer, self.headed = renderer, headed
        self.context = self.page = self.server = self.pw = None
        self.profile = profile_path(output)

    def check(self, name, ok, detail=None):
        row = {'name': name, 'passed': bool(ok)}
        if detail is not None:
            row['detail'] = detail
        self.report['checks'].append(row)
        print(('PASS ' if ok else 'FAIL ') + name, flush=True)
        if not ok:
            raise AssertionError(name)

    def stage(self, name):
        self.report['current_stage'] = name
        self.report['reached_stages'].append(name)

    def complete(self, name):
        self.report['completed_stages'].append(name)

    def ev(self, code, argument=None):
        return self.page.evaluate(code, argument)

    def state(self):
        return self.ev('Realm.state')

    def diag(self):
        return self.ev('Realm.diagnostics')

    def old_keys(self):
        return self.ev('keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]))', list(LEGACY_KEYS))

    def raw_library(self):
        raw = self.ev('localStorage.getItem(RealmCharacters.KEY)')
        return json.loads(raw) if raw is not None else None

    def start_server(self):
        handler = functools.partial(QuietHandler, directory=str(self.root))
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = f'http://127.0.0.1:{self.server.server_port}/'

    def start(self):
        spec = importlib.util.spec_from_file_location('onboarding_browser_support', self.root / 'tools/browser_support.py')
        support = importlib.util.module_from_spec(spec); spec.loader.exec_module(support)
        options = support.launch_kwargs(self.renderer)
        options['headless'] = not self.headed
        self.context = self.pw.chromium.launch_persistent_context(str(self.profile),
            **options, viewport={'width': 1280, 'height': 800}, has_touch=True)
        self.context.add_init_script(INIT)
        self.context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(self.url) else r.abort())
        self.page = self.context.new_page()
        for blank in self.context.pages:
            if blank != self.page:
                blank.close()
        self.page.on('pageerror', lambda e: self.report['browser_errors'].append(str(e)))
        self.page.on('console', lambda m: self.report['console_errors'].append(m.text) if m.type == 'error' else None)
        response = self.page.goto(self.url, wait_until='load', timeout=30000)
        self.page.wait_for_function('()=>!!window.Realm?.test', timeout=30000)
        self.page.wait_for_selector('#loading.hidden', timeout=30000)
        self.check('exact frozen HTML served', response is not None and hashlib.sha256(response.body()).hexdigest() == self.report['html_sha256'])
        self.check('actual WebGL2 is available', self.diag()['mode'] == 'webgl2', self.diag()['renderer'])
        actual = (self.diag()['renderer'] or '').lower()
        self.check('requested renderer is observed', ('swiftshader' in actual) if self.renderer == 'software' else bool(actual) and not any(v in actual for v in ('swiftshader', 'llvmpipe', 'software')), actual)
        self.page.wait_for_function('()=>Realm.diagnostics.characters.mode!=="blocked"&&(Realm.diagnostics.characters.mode==="legacy"||Realm.diagnostics.characters.writer)', timeout=30000)

    def close_workspace(self):
        if self.page.locator('#rpg-window').evaluate('(e)=>e.open'):
            self.page.locator('#rpg-close').click()
        if self.page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):
            self.page.locator('#close-panel').click()

    def workspace(self, tab='journal'):
        self.close_workspace()
        self.page.locator('#world').focus()
        self.page.keyboard.press('j')
        if tab != 'journal':
            self.page.locator(f'#rpg-tabs [data-rpg="open"][data-id="{tab}"]').click()
        self.page.wait_for_selector('#rpg-window[open]', timeout=10000)

    def shot(self, name):
        path = self.output / (name + '.png')
        if path.exists():
            raise FileExistsError('Screenshot evidence cannot be overwritten.')
        self.page.screenshot(path=str(path), timeout=30000)
        self.report['screenshots'].append({'path': str(path), 'sha256': sha(path)})

    def walk(self, point, name):
        self.close_workspace()
        result = self.ev('p=>Realm.test.move(p.x,p.z)', {'x': point['x'], 'z': point['z']})
        self.check('production planner accepts ' + name, result.get('ok'), result)
        result = self.ev("""p=>{let frames=0;while(Realm.test.path.length&&frames<12000){Realm.test.step(.05);frames++;}
         const q=Realm.diagnostics.adventure.player;return{frames,remaining:Realm.test.path.length,player:q,hp:Realm.state.adventure.hp,distance:Math.hypot(q.x-p.x,q.z-p.z)};}""", point)
        self.check('actual movement arrives ' + name, result['remaining'] == 0 and result['frames'] < 12000 and result['distance'] <= 2.8 and result['hp'] > 0, result)
        self.report['movement'].append({'caller': 'Realm.test.move -> actual Simulation.moveTo; .05-second production ticks', 'name': name, **result})

    def tick_tracker(self, want, heading):
        before = self.state()
        self.ev('Realm.test.step(.4)')
        after = self.state()
        self.check('simulation time preserves all work owners while observing ' + want, living_signature(before) == living_signature(after))
        self.check('actual selected tracker remains ' + want,
            self.page.locator(f'.tracker-switch [data-rpg="track"][data-id="{want}"]').get_attribute('aria-pressed') == 'true'
            and self.page.locator('#tracked-chapter').inner_text().startswith(heading), self.page.locator('#tracked-title').inner_text())
        self.report['tracker_observations'].append({'selection': want, 'heading': self.page.locator('#tracked-chapter').inner_text(), 'title': self.page.locator('#tracked-title').inner_text(), 'productionTickSeconds': .4})

    def manual(self, which, heading):
        self.workspace()
        before = self.state()
        self.page.locator(f'#rpg-content .journal-title [data-rpg="track"][data-id="{which}"]').click()
        require_projection_preserved(before, self.state())
        self.tick_tracker(which, heading)
        self.close_workspace()
        self.page.locator('#tracked-open').click()
        self.check('manual ' + which + ' tracker opens Journal in local realm',
            self.page.locator('#rpg-tabs [data-id="journal"]').get_attribute('aria-current') == 'page')

    def run(self):
        self.stage('fresh-journal'); self.workspace()
        fresh = self.state()
        self.check('genuinely fresh world has no kit, claims or accepted local work', fresh_start_terms(fresh))
        initial_old = self.old_keys(); require_journal(self.ev(JOURNAL_OBSERVATION))
        self.shot('01-fresh-journal'); self.complete('fresh-journal')

        self.stage('keyboard-later-requests')
        summary = self.page.locator('#rpg-content details.future-work > summary')
        summary.focus(); summary.press('Enter')
        self.check('native Enter expands later requests', self.page.locator('details.future-work').evaluate('(e)=>e.open'))
        for action in LOCKED_ACTIONS:
            self.check('expanded locked Read control visible ' + action, self.page.locator(f'details.future-work [data-rpg="{action}"]').is_visible())
        summary.press('Tab')
        focused = self.ev('document.activeElement?.dataset.rpg')
        self.check('native Tab reaches retained locked Read control', focused in LOCKED_ACTIONS, focused)
        self.page.keyboard.press('Enter')
        self.check('keyboard Read opens a retained request workspace', self.page.locator('#rpg-window').evaluate('(e)=>e.open') and self.page.locator('#rpg-heading').inner_text() != 'Your journal')
        require_projection_preserved(fresh, self.state()); self.complete('keyboard-later-requests')

        self.stage('touch-later-requests'); self.workspace()
        summary = self.page.locator('details.future-work > summary'); summary.tap()
        self.check('native touch expands later requests', self.page.locator('details.future-work').evaluate('(e)=>e.open'))
        self.page.locator('details.future-work [data-rpg="hell-campaign-open"]').tap()
        self.check('native touch Read opens Hell request', self.page.locator('#rpg-heading').inner_text() == 'The Last Unclaimed Road')
        require_projection_preserved(fresh, self.state()); require_old_keys(initial_old, self.old_keys())
        self.shot('02-locked-read'); self.complete('touch-later-requests')

        self.stage('earned-kit')
        self.walk(self.ev('RealmCore.LANDMARKS.find(p=>p.id==="market")'), 'Oren')
        self.page.locator('#world').focus(); self.page.keyboard.press('e')
        self.check('native E receives actual Oren kit', self.state()['adventure']['started'] is True)
        self.complete('earned-kit')

        self.stage('earned-trail-acceptance')
        self.walk(self.ev('RealmWorldFoundations.GATE'), 'Roads of Light')
        self.workspace('worlds'); self.page.locator('[data-rpg="world-select"][data-id="atlantis"]').click()
        self.page.locator('[data-rpg="world-preview"][data-id="atlantis"]').click()
        self.page.locator('[data-rpg="world-confirm"]').click()
        self.check('native crossing enters Atlantis', self.diag()['scene'] == 'world-atlantis')
        d = self.ev('RealmTrails.definition("atlantis-bellglass-chart-v1")')
        self.walk(d['giver'], 'Sahra'); self.workspace('worlds')
        self.page.locator('[data-rpg="trail-accept"]').click()
        self.check('native UI accepts existing Bellglass trail', self.state()['realmTrails']['records'][d['id']]['accepted'] is True)
        self.complete('earned-trail-acceptance')

        self.stage('earned-commission-acceptance'); self.workspace()
        self.page.locator('[data-rpg="civic-open"][data-id="atlantis"]').click()
        self.page.locator('[data-rpg="civic-accept"][data-id="approach"]').click()
        record = self.state()['localLife']['records']['atlantis-bellglass-lamp-v1']
        self.check('native deliberate commission choice retained unpaid', record['accepted'] and record['choice'] == 'approach' and not record['claimed'])
        self.complete('earned-commission-acceptance')

        self.stage('manual-homestead'); self.manual('homestead', 'FIELD GUIDE · OPTIONAL')
        self.shot('03-manual-homestead'); self.complete('manual-homestead')
        self.stage('manual-story'); self.manual('story', 'CHAPTER 1')
        self.complete('manual-story')

        self.stage('actual-civic-track'); self.manual('homestead', 'FIELD GUIDE · OPTIONAL')
        self.page.locator('[data-rpg="civic-open"][data-id="atlantis"]').click()
        before = self.state()
        self.page.locator('[data-rpg="civic-track"][data-id="atlantis-bellglass-lamp-v1"]').click()
        require_projection_preserved(before, self.state()); self.tick_tracker('local-life', 'LOCAL LIFE')
        self.check('actual commission title replaces Homestead', self.page.locator('#tracked-title').inner_text() == 'A Lamp for the Next Visitor')
        self.close_workspace(); self.page.locator('#tracked-open').click()
        self.check('commission tracker opens retained local-work page', self.page.locator('.local-life-page').is_visible())
        self.shot('04-civic-track'); self.complete('actual-civic-track')

        self.stage('new-character')
        self.workspace(); self.page.locator('#rpg-content .journal-title [data-rpg="track"][data-id="homestead"]').click()
        self.page.locator('#rpg-tabs [data-id="characters"]').click()
        first = self.state(); legacy_before = self.ev('localStorage.getItem(RealmCore.KEY)')
        self.report['first_character_before_create'] = first
        self.page.locator('#chars-name').fill('ONBOARDING · fresh reset')
        self.page.locator('[data-rpg="chars-create"]').click()
        self.page.wait_for_function('()=>Realm.diagnostics.characters.count===2&&Realm.state.visitor.name==="ONBOARDING · fresh reset"', timeout=15000)
        self.workspace()
        library = self.raw_library(); active = library['active']
        old = next(s for s in library['slots'] if s['id'] != active)
        require_projection_preserved(first, old['world'])
        self.check('native new Simulation ignores previous manual Homestead', self.page.locator('#tracked-chapter').inner_text() == 'CHAPTER 1' and self.page.locator('.tracker-switch [data-id="story"]').get_attribute('aria-pressed') == 'true')
        self.check('only two ephemeral native characters exist', len(library['slots']) == 2)
        self.check('new character has no accepted local work', not self.state()['adventure']['started'] and all(not r['accepted'] for r in self.state()['localLife']['records'].values()))
        self.check('original legacy save remains byte-identical after managed creation', self.ev('localStorage.getItem(RealmCore.KEY)') == legacy_before)
        self.report['character_labels'] = [{'slot': old['id'], 'label': 'fresh automatic world; kit/trail/lamp acceptance through native UI'}, {'slot': active, 'label': 'native-created fresh reset character; no imported facts'}]
        self.complete('new-character')

        self.stage('whole-browser-cold-defaults')
        self.page.locator('#rpg-content .journal-title [data-rpg="track"][data-id="homestead"]').click()
        self.check('fresh second character has deliberately selected Homestead', self.page.locator('.tracker-switch [data-id="homestead"]').get_attribute('aria-pressed') == 'true')
        expected = self.raw_library()
        next(s for s in expected['slots'] if s['id'] == active)['world'] = self.state()
        no_saved_preference(expected)
        self.page.close(run_before_unload=True); self.context.close(); self.context = self.page = None
        self.report['whole_browser_restarts'] += 1
        self.start()
        startup = self.ev('window.__onboardingStartup')
        cold = json.loads(startup[self.ev('RealmCharacters.KEY')])
        require_same_slots(expected, cold); no_saved_preference(cold)
        self.workspace()
        self.check('cold actual UI uses Story default, no persisted manual Homestead', self.page.locator('#tracked-chapter').inner_text() == 'CHAPTER 1' and self.page.locator('.tracker-switch [data-id="story"]').get_attribute('aria-pressed') == 'true')
        self.check('whole browser loads same selected second character', self.diag()['characters']['active'] == active and self.diag()['characters']['count'] == 2)
        self.check('legacy key unchanged across whole-browser restart', self.ev('localStorage.getItem(RealmCore.KEY)') == legacy_before)
        self.shot('05-cold-story-default'); self.complete('whole-browser-cold-defaults')

        self.stage('old-character-preserved'); self.workspace('characters')
        self.page.locator(f'[data-rpg="chars-switch"][data-id="{old["id"]}"]').click()
        self.page.wait_for_function('id=>Realm.diagnostics.characters.active===id', arg=old['id'], timeout=15000)
        self.workspace()
        self.check('switch resumes the accepted unpaid commission and chosen arrangement', self.state()['localLife']['records']['atlantis-bellglass-lamp-v1'] == first['localLife']['records']['atlantis-bellglass-lamp-v1'])
        self.report['first_character_after_switch'] = self.state()
        resume = require_initial_resume(self.root, first, self.report['first_character_after_switch'])
        self.report['initial_resume_contract'] = resume
        self.check('switch retains all old quest/equipment/history owners', resume['preserved'])
        self.check('old defaults choose pending Local life rather than old Homestead preference', self.page.locator('.tracker-switch [data-id="local-life"]').get_attribute('aria-pressed') == 'true')
        require_old_keys(initial_old, self.old_keys())
        self.report['final_native_library'] = self.raw_library()
        no_saved_preference(self.report['final_native_library'])
        self.complete('old-character-preserved')

    def stop(self):
        if self.context is not None:
            self.context.close(); self.context = self.page = None
        if self.server is not None:
            self.server.shutdown(); self.server.server_close(); self.server = None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, help='Actual installed game; defaults to FIRSTLIGHT_ROOT or installed tool parent.')
    parser.add_argument('--output', type=Path, default=os.environ.get('FIRSTLIGHT_ONBOARDING_OUTPUT'), help='New bounded D evidence root; or FIRSTLIGHT_ONBOARDING_OUTPUT.')
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='software')
    parser.add_argument('--headed', action='store_true', help='Expose the same owned test window; no human-pacing claim.')
    parser.add_argument('--preflight-only', action='store_true', help='Hash/read current inputs without server, browser, profile or output creation.')
    args = parser.parse_args(argv)
    try:
        root = resolve_root(args.root); inputs = source_inputs(root)
        if args.preflight_only:
            print(json.dumps({'status': 'preflight-passed', 'inputs': inputs, 'browserExecuted': False}, indent=2)); return 0
        if args.output is None:
            raise ValueError('Explicit new --output or FIRSTLIGHT_ONBOARDING_OUTPUT is required.')
        output = guard_output(args.output, root)
    except (ValueError, OSError) as e:
        parser.error(str(e))
    output.mkdir(parents=True, exist_ok=False)
    report = {'status': 'running', 'method': __doc__, 'source_hashes': inputs,
        'html_sha256': sha(root / 'index.html'), 'checks': [], 'planned_stages': list(STAGES),
        'reached_stages': [], 'completed_stages': [], 'movement': [], 'tracker_observations': [],
        'screenshots': [], 'browser_errors': [], 'console_errors': [], 'errors': [],
        'profile_limit': 1, 'character_limit': 2, 'whole_browser_restarts': 0,
        'videos_recorded': 0, 'renderer_requested': args.renderer, 'headed': args.headed,
        'nativeExecuted': False, 'acceleratedSetup': True, 'tickSeconds': .05,
        'noInjection': {'positionEdits': 0, 'hpGrants': 0, 'progressFlags': 0, 'inventoryGrants': 0,
                        'manualDamage': 0, 'replacementWorlds': 0, 'storageWritesByHarness': 0},
        'humanPacing': False, 'performanceClaim': False}
    harness = None; pw = None; began = time.monotonic()
    try:
        # Lazy import and explicit start keep CPU import/preflight completely inert.
        from playwright.sync_api import sync_playwright
        pw = sync_playwright().start()
        harness = OnboardingBrowser(root, output, report, args.renderer, args.headed)
        harness.profile.mkdir(exist_ok=False); harness.pw = pw; harness.start_server(); harness.start()
        report['nativeExecuted'] = True
        harness.run()
        require_frozen(inputs)
        harness.check('source epoch is unchanged', True)
        harness.check('no browser/console errors hidden', not report['browser_errors'] and not report['console_errors'])
        report['status'] = 'passed'
    except Exception:
        report['status'] = 'failed'; report['errors'].append(traceback.format_exc())
        if harness and harness.page is not None:
            try:
                report['failure_world'] = harness.state(); report['failure_diagnostics'] = harness.diag()
                harness.shot('FAILURE')
            except Exception:
                report['errors'].append('Failure capture: ' + traceback.format_exc())
    finally:
        # Playwright stays alive until the context closes and evidence is captured.
        if harness:
            try:
                harness.stop()
            except Exception:
                report['status'] = 'failed'; report['errors'].append('Cleanup: ' + traceback.format_exc())
        if pw:
            try:
                pw.stop()
            except Exception:
                report['status'] = 'failed'; report['errors'].append('Playwright cleanup: ' + traceback.format_exc())
        report['final_source_hashes'] = {p: sha(p) if Path(p).is_file() else None for p in inputs}
        report['source_drift'] = report['final_source_hashes'] != inputs
        if report['source_drift']:
            report['status'] = 'failed'
        report['durationSeconds'] = time.monotonic() - began
        report['counts'] = {'checks': len(report['checks']), 'passed': sum(r['passed'] for r in report['checks']),
            'failed': sum(not r['passed'] for r in report['checks']), 'reachedStages': len(report['reached_stages']),
            'completedStages': len(report['completed_stages']), 'plannedStages': len(STAGES)}
        write_new(output / 'REPORT.json', report)
    print(json.dumps({'status': report['status'], 'counts': report['counts'], 'output': str(output)}, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
