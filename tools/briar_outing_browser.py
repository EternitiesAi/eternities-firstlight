#!/usr/bin/env python3
"""Cohort-bound Briar UI and whole-Chromium persistence checks.

Imports only command-earned INPUT_WORLD through Characters. Accelerated test
ticks and accepted moveTo paths are explicit: this is not ordinary RAF, pacing,
GPU performance, human acceptance or a complete browser regression gate.
Import/preflight allocates no server, browser, profile or output directory.
"""
from pathlib import Path
import argparse
import ast
import hashlib
import importlib.util
import json
import math
import os
import re
import subprocess
import traceback

ROOT = Path(__file__).resolve().parents[1]
EARLY = ['early-rescued-blade', 'early-rescued-bow']
RETURNING = ['earned-chapter-I-blade', 'earned-chapter-IV-blade-to-bow', 'earned-both-sunward-caches']
ZERO = ('positionEdits', 'actorPositionEdits', 'inventoryGrants', 'healthGrants',
        'manualDamage', 'plantedDefeats', 'plantedQuestFacts')
FACTS = ['briar-cloth-home-v1', 'briar-commons-rest-v1']
EMBEDDED = {'core.js', 'characters.js', 'adventure.js', 'arsenal.js', 'rpg-ui.js',
            'app.js', 'companion-art.js', 'adventure-art.js', 'briar-moments.js', 'briar-outing.js'}
KEY = 'eternities.realm10.characters.v1'
MIN_FREE_KIB = 6291456
INITIALIZE = r"""(()=>{window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;
const key='eternities.realm10.characters.v1';window.__flStartup=localStorage.getItem(key);
const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const r=old.call(this,k,v);
if(k===key)console.debug('__FL_NATIVE_WRITE__'+String(v));return r;};})()"""


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write_new(path, value):
    with Path(path).open('x', encoding='utf8', newline='\n') as f:
        f.write(value if isinstance(value, str) else json.dumps(value, indent=2)+'\n')


def report_terms(report, scope):
    expected = EARLY if scope == 'early-only' else EARLY+RETURNING if scope == 'complete' else None
    if expected is None or report.get('status') != 'passed':
        raise ValueError('Explicit scope and passed earned report required')
    for key in ('acceleratedTicks', 'inMemoryProductionStore'):
        if report.get(key) is not True:
            raise ValueError('Missing earned CPU disclosure: '+key)
    for key in ('browserExecuted', 'nativePersistence', 'normalRAF', 'humanPacing'):
        if report.get(key) is not False:
            raise ValueError('CPU report cannot stand in for native evidence: '+key)
    for key in ZERO:
        if type(report.get(key)) is not int or report[key] != 0:
            raise ValueError('Missing strict zero injection disclosure: '+key)
    cases = report.get('cases')
    if not isinstance(cases, list) or [r.get('label') for r in cases] != expected:
        raise ValueError('Exact ordered unique earned labels required')
    return expected.copy()


def link(row, base):
    if not isinstance(row, dict):
        raise ValueError('Frozen checkpoint link required')
    p = Path(row.get('path', ''))
    p = (p if p.is_absolute() else Path(base)/p).resolve()
    base = Path(base).resolve()
    if base not in p.parents or not p.is_file():
        raise ValueError('Checkpoint must remain inside its earned namespace')
    if type(row.get('bytes')) is not int or row['bytes'] != p.stat().st_size or row.get('sha256') != sha(p):
        raise ValueError('Frozen checkpoint bytes or hash changed')
    return p


def source_epoch(root, frozen):
    root = Path(root).resolve()
    expected = [p.relative_to(root).as_posix() for p in (root/'src').iterdir() if p.is_file()]
    expected += ['build.py', 'index.html', 'FIRSTLIGHT_VALLEY.html',
                 'tests/briar_outing_journey.cjs', 'tools/whole_draft_readback.cjs']
    if not isinstance(frozen, dict) or set(frozen) != set(expected):
        raise ValueError('Exact full earned source membership required')
    actual = {name: sha(root/name) for name in sorted(expected)}
    if actual != frozen:
        raise ValueError('Earned source epoch differs; never rehash stale inputs')
    html = (root/'index.html').read_bytes()
    if html != (root/'FIRSTLIGHT_VALLEY.html').read_bytes():
        raise ValueError('HTML copies differ')
    for name in expected:
        # Every source file is hash-bound above. These actual untransformed
        # owners additionally have exact HTML embedding checks. The catalogue
        # includes unused adapters and asset-placeholder modules; those are
        # qualified by the unchanged full builder, not raw substring guesses.
        if name.startswith('src/') and Path(name).name in EMBEDDED:
            body = (root/name).read_bytes().replace(b'\r\n', b'\n')
            if body not in html.replace(b'\r\n', b'\n'):
                raise ValueError('Current JavaScript must be embedded: '+name)
    return actual


def git(root, *args):
    return subprocess.check_output(['git', '-c', 'maintenance.auto=false', '-c', 'gc.auto=0', *args],
                                   cwd=root, text=True, encoding='utf8', timeout=30).strip()


def source_gate(path, root, head):
    """Require current clean complete-source success, not an old green footer."""
    path, root = Path(path).resolve(), Path(root).resolve()
    r = read(path)
    if type(r.get('exitCode')) is not int or r['exitCode'] != 0:
        raise ValueError('Complete source verifier failed or was not launched')
    if r.get('sourceHead') != head or r.get('headAfter') != head or r.get('statusAfter') != []:
        raise ValueError('Complete source receipt must preserve this clean exact head')
    command = r.get('command', [])
    if (not isinstance(command, list) or 'tools/verify.py' not in command or '--browser' in command
            or r.get('requestedRuleWorkers') != 4 or '--rule-workers' not in command
            or command.index('--rule-workers')+1 >= len(command)
            or command[command.index('--rule-workers')+1] != '4'
            or '--output' not in command or command.index('--output')+1 >= len(command)):
        raise ValueError('Original complete source command/four-worker policy required')
    output = Path(command[command.index('--output')+1]).resolve()
    console = link(r.get('console'), path.parent)
    rules_path = link(r.get('rulesCommand'), path.parent)
    if rules_path != output/'rules-command.json':
        raise ValueError('Rule inventory must be the verifier actual output')
    rules = read(rules_path)
    expected = sorted(p.relative_to(root).as_posix() for p in (root/'tests').glob('*.test.cjs'))
    if (Path(rules.get('root', '')).resolve() != root or rules.get('ruleFiles') != expected
            or rules.get('ruleFileCount') != len(expected) or rules.get('requestedWorkers') != 4
            or rules.get('verifierSha256') != sha(root/'tools/verify.py')
            or rules.get('rulesTimeoutSeconds') != 180 or rules.get('pythonTimeoutSeconds') != 600):
        raise ValueError('Current complete rule inventory/verifier/original deadlines required')
    text = console.read_text(encoding='utf-8-sig')
    runs = re.findall(r'^Running (.+)\.\.\.$', text, re.M)
    passes = re.findall(r'^PASS: (.+)$', text, re.M)
    required = {'build', 'rules', 'python', 'whole-draft-earned', 'briar-outing-earned'}
    tree = ast.parse((root/'tools/verify.py').read_text(encoding='utf8'))
    main = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'main')
    boundary = next(n.lineno for n in ast.walk(main) if isinstance(n, ast.If)
                    and isinstance(n.test, ast.Attribute) and n.test.attr == 'browser')
    for n in ast.walk(main):
        if (isinstance(n, ast.Call) and n.lineno < boundary and isinstance(n.func, ast.Name)
                and n.func.id == 'run' and n.args and isinstance(n.args[0], ast.Constant)
                and isinstance(n.args[0].value, str)):
            required.add(n.args[0].value)
    required |= {'syntax-'+p.stem for p in (root/'src').glob('*.js')}
    if (not runs or runs != passes or len(runs) != len(set(runs)) or not required.issubset(passes)
            or 'FAILED:' in text or not text.rstrip().endswith('Verification passed. Automated checks do not qualify human pacing or device performance.')):
        raise ValueError('Complete exact verifier command coverage did not finish')
    return {'path': str(path), 'sha256': sha(path), 'commandsPassed': len(passes),
            'ruleFiles': len(expected), 'head': head, 'output': str(output)}


def cohort(path, digest, root, scope, gate=None):
    path, root = Path(path).resolve(), Path(root).resolve()
    if not re.fullmatch('[0-9a-f]{64}', digest or '') or sha(path) != digest:
        raise ValueError('Explicit frozen earned report digest required')
    report = read(path)
    labels = report_terms(report, scope)
    if Path(report.get('root', '')).resolve() != root:
        raise ValueError('Native root must be the earned report actual root')
    epoch = source_epoch(root, report.get('sourceEpoch'))
    rows = {}
    for row in report['cases']:
        if (row.get('status') != 'passed' or row.get('currentAppOwnershipFunctions') is not True
                or type(row.get('storeWrites')) is not int or row['storeWrites'] != 2):
            raise ValueError('Actual App-hook two-write earned continuation required')
        expected_style = 'bow' if row['label'] in (EARLY[1], RETURNING[1]) else 'blade'
        if row.get('weaponStyle') != expected_style:
            raise ValueError('The labelled blade/bow family must be its actual canonical weapon')
        for key in ('nativePersistence', 'normalRAF', 'humanPacing'):
            if row.get(key) is not False:
                raise ValueError('Earned case cannot claim unobserved native/human evidence: '+key)
        for key in ZERO:
            if type(row.get(key)) is not int or row[key] != 0:
                raise ValueError('Case injection disclosure changed: '+key)
        checkpoints = row.get('checkpoints', {})
        if set(checkpoints) != {'input', 'partial', 'returned', 'remembered', 'final'}:
            raise ValueError('All five exact earned checkpoints required')
        paths = {k: link(v, path.parent) for k, v in checkpoints.items()}
        worlds = {k: read(v) for k, v in paths.items()}
        for stage, facts in [('input', []), ('partial', []), ('returned', FACTS[:1]),
                             ('remembered', FACTS), ('final', FACTS)]:
            if worlds[stage].get('briarMoments') != {'version': 1, 'revision': len(facts), 'moments': facts}:
                raise ValueError('Wrong earned checkpoint fact prefix: '+stage)
        rows[row['label']] = {'row': row, 'paths': paths, 'worlds': worlds}
    # Core and canonical weapon inspection are real executable checks, not tiny
    # synthetic unit receipts. Never executes acquired or archive code.
    inspect = "const fs=require('fs'),assert=require('assert/strict'),path=require('path');const root=process.argv[1],rows=JSON.parse(process.argv[2]);const C=require(path.join(root,'src/core.js')),AR=require(path.join(root,'src/arsenal.js'));for(const r of rows){for(const p of r.paths){const w=JSON.parse(fs.readFileSync(p));assert.deepEqual(C.validate(w),w);}const w=JSON.parse(fs.readFileSync(r.paths[0]));assert.equal(AR.weapon(w.adventure).style,r.style);}"
    subprocess.run(['node', '-e', inspect, str(root), json.dumps([
        {'paths': [str(v['paths'][s]) for s in ('input', 'partial', 'returned', 'remembered', 'final')],
         'style': v['row']['weaponStyle']} for v in rows.values()])], check=True, timeout=180, cwd=root)
    head = git(root, 'rev-parse', 'HEAD')
    full = None
    if scope == 'complete':
        whole = report.get('wholeDraft')
        if not isinstance(whole, dict):
            raise ValueError('Complete scope requires current whole-draft provenance')
        wp = Path(whole.get('path', '')).resolve()
        if path.parent.parent not in wp.parents or sha(wp) != whole.get('sha256'):
            raise ValueError('Frozen sibling whole-draft report required')
        subprocess.run(['node', '-e', "require(process.argv[1]).inspect(process.argv[2],{sourceRoot:process.argv[3]});",
                        str(root/'tools/whole_draft_readback.cjs'), str(wp), str(root)],
                       check=True, timeout=180, cwd=root)
        whole_report = read(wp)
        for label, variant, chapter in zip(RETURNING, ['blade', 'blade-to-bow', 'blade'], ['original-I', 'original-IV', 'original-II']):
            producer = next(r for r in whole_report['results'] if r['variant'] == variant)
            edge = next(e for e in producer['chapters'] if e['chapter'] == chapter)['output']
            source = rows[label]['row']['inputProvenance']
            if source != edge or read(Path(edge['path'])) != rows[label]['worlds']['input']:
                raise ValueError('Exact original chapter edge must be native input')
        old = rows[RETURNING[-1]]['worlds']['input']['adventure']['road']
        if sorted(old['claimed']) != ['cart-latch', 'old-surveyor'] or rows[RETURNING[-1]]['worlds']['final']['adventure']['road'] != old:
            raise ValueError('Both original caches must remain honestly claimed')
        if gate is None:
            raise ValueError('Complete native qualification requires complete current source success')
        full = source_gate(gate, root, head)
        output = Path(full['output'])
        if path != output/'briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json' or wp != output/'whole-draft-earned/WHOLE_DRAFT_JOURNEY_REPORT.json':
            raise ValueError('Native must consume this successful verifier invocation exact cohorts')
    if sha(path) != digest or source_epoch(root, epoch) != epoch:
        raise ValueError('Consumed cohort/source changed during preparation')
    return {'labels': labels, 'rows': rows, 'sourceEpoch': epoch, 'head': head, 'sourceGate': full,
            'reportPath': str(path), 'reportSha256': digest, 'scope': scope}


def admission():
    if os.name != 'nt':
        raise ValueError('This desktop qualification requires its Windows host memory admission')
    value = subprocess.check_output(['powershell', '-NoProfile', '-Command',
                                    '(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory'],
                                   text=True, timeout=30)
    free = int(value.strip())
    if free < MIN_FREE_KIB:
        raise ValueError(f'Host memory admission refused: {free}KiB < {MIN_FREE_KIB}KiB; no VM/unrelated action')
    return {'freeHostKiB': free, 'minimumFreeKiB': MIN_FREE_KIB}


def stable(world):
    # Only clocks, actual movement/discovery, current health/stamina and the new
    # exact fact/journal writes are excluded. All economic/story/creative owners
    # remain compared, including inactive library slots separately at restart.
    w = json.loads(json.dumps(world))
    for key in ('player', 'visited', 'journal', 'nextEvent', 'day', 'hour', 'weather', 'briarMoments'):
        w.pop(key, None)
    for key in ('quality', 'timeFlow', 'cameraMode', 'cameraViews'):
        w.get('settings', {}).pop(key, None)
    for key in ('elapsed', 'hp', 'stamina', 'revision'):
        w['adventure'].pop(key, None)
    w['sandbox'].pop('elapsed', None)
    for resident in w.get('residents', []):
        for key in ('x', 'z', 'yaw', 'progress'):
            resident.pop(key, None)
    return w


def fact_boundary(before, after, fact):
    """The live explicit action changes only the declared fact and journal."""
    expected = json.loads(json.dumps(before))
    record = expected['briarMoments']
    record['moments'].append(fact)
    record['revision'] += 1
    expected['adventure']['revision'] += 1
    expected['nextEvent'] += 1
    journal = after.get('journal', [])
    if (not journal or journal[-1].get('kind') != 'briar-moment'
            or journal[-1].get('seq') != before['nextEvent']
            or journal[-1].get('day') != before['day'] or journal[-1].get('hour') != before['hour']):
        return False
    expected['journal'].append(journal[-1])
    expected['journal'] = expected['journal'][-200:]
    return after == expected


class Native:
    def __init__(self, pw, args, report, origin, label):
        self.pw, self.args, self.report, self.origin, self.label = pw, args, report, origin, label
        self.context = self.page = None
        self.raw = None
        self.folder = args.output/label
        self.folder.mkdir()
        self.profile = self.folder/'synthetic-native-profile'
        self.row = {'profile': str(self.profile), 'checks': [], 'restarts': [], 'samples': [], 'nativeWrites': 0}
        report['cases'][label] = self.row

    def check(self, name, ok, detail=None):
        self.row['checks'].append({'name': name, 'passed': bool(ok), 'detail': detail})
        print(('PASS ' if ok else 'FAIL ')+self.label+' '+name, flush=True)
        if not ok:
            raise AssertionError(name+' '+repr(detail))

    def ev(self, js, arg=None):
        return self.page.evaluate(js, arg)

    def state(self):
        return self.ev('()=>Realm.state')

    def diag(self):
        return self.ev('()=>Realm.diagnostics')

    def render(self):
        self.ev('()=>Realm.test.render()')

    def click(self, selector):
        loc = self.page.locator(selector)
        self.check('unique native '+selector, loc.count() == 1)
        loc.click(timeout=15000)

    def close(self):
        if self.page.locator('#rpg-window').evaluate('(e)=>e.open'):
            self.click('#rpg-close')
        if self.page.locator('#drawer').evaluate('(e)=>e.classList.contains("open")'):
            self.click('#close-panel')

    def panel(self, tab='companion'):
        self.close()
        self.page.keyboard.press('c')
        self.click('#rpg-tabs [data-rpg="open"][data-id="'+tab+'"]')

    def action(self, kind):
        self.panel()
        self.click('#rpg-content .briar-outing [data-rpg="briar"][data-id="'+kind+'"]')
        self.render()

    def start(self):
        self.row.setdefault('admissions', []).append(admission())
        self.context = self.pw.chromium.launch_persistent_context(str(self.profile), **self.args.support.launch_kwargs('software'),
                                                                  viewport={'width':1440, 'height':960})
        self.context.add_init_script(INITIALIZE)
        def route(r):
            if r.request.url.startswith(self.origin+'/'):
                r.continue_()
            else:
                self.report['externalRequests'].append(r.request.url)
                r.abort()
        self.context.route('**/*', route)
        self.page = self.context.pages[0] if self.context.pages else self.context.new_page()
        def console(msg):
            if msg.text.startswith('__FL_NATIVE_WRITE__'):
                self.raw = msg.text[len('__FL_NATIVE_WRITE__'):]
                self.row['nativeWrites'] += 1
        self.page.on('console', console)
        self.page.on('pageerror', lambda e: self.report['browserErrors'].append(str(e)))
        response = self.page.goto(self.origin+'/index.html', wait_until='load', timeout=60000)
        self.page.wait_for_function('()=>!!window.Realm&&getComputedStyle(document.querySelector("#loading")).opacity==="0"')
        self.check('exact served HTML bytes', hashlib.sha256(response.body()).hexdigest() == self.report['htmlSha256'])
        self.render()
        d = self.diag()
        self.check('actual software WebGL2', d['mode'] == 'webgl2' and any(s in (d['renderer'] or '').lower() for s in ('swiftshader','software','llvmpipe')), d['renderer'])
        self.row['browser'] = self.context.browser.version if self.context.browser else 'persistent Chromium'
        self.check('accelerated production test controls', self.ev('()=>typeof Realm.test.step==="function"&&typeof Realm.test.move==="function"'))

    def walk(self, point, near=.7):
        self.close()
        r = self.ev('(p)=>Realm.test.move(p.x,p.z)', point)
        self.check('accepted supported player move', bool(r.get('ok')) if isinstance(r, dict) else r is True, r)
        for _ in range(1400):
            p = self.state()['player']
            if math.hypot(p['x']-point['x'], p['z']-point['z']) <= near:
                self.render()
                return
            self.advance()
        raise AssertionError('Supported player route did not arrive')

    def advance(self):
        if self.diag()['adventure']['paused'] is not False:
            self.check('advance begins genuinely unpaused', False)
        self.ev('()=>Realm.test.step(.05)')
        self.render()
        self.row['acceptedTickSegments'] = self.row.get('acceptedTickSegments', 0)+1

    def accompany(self, phase):
        self.close()
        for n in range(1800):
            d = self.diag()
            v = d['briar']['view']
            if v and v['phase'] == phase:
                self.check('physical phase '+phase, v['distanceTravelled'] > 0, v)
                return
            if v is None:
                self.check('outing still owns actual fox', False, v)
            if n % 8 == 0:
                c = d['adventure']['companion']
                r = self.ev('(p)=>Realm.test.move(p.x,p.z)', {'x':c['x'], 'z':c['z']})
                if not (isinstance(r, dict) and r.get('ok') is True):
                    self.check('accepted accompaniment route', False, r)
            self.advance()
        raise AssertionError('Briar physical phase did not arrive: '+phase)

    def samples(self, label, pose):
        self.close()
        for view in ('adventure', 'follow'):
            self.click('#rpg-hud [data-rpg="camera"][data-id="'+view+'"]')
            self.render()
            sample = self.ev('()=>({frame:Realm.test.companion(),diagnostics:Realm.diagnostics})')
            frame, d = sample['frame'], sample['diagnostics']
            self.check('requested camera '+view, d['camera']['preset'] == view)
            c = d['adventure']['companion']
            self.check('model follows physical fox', math.hypot(c['x']-frame['placement']['x'], c['z']-frame['placement']['z']) < 1e-8)
            self.check('actual submitted '+pose+' pose', frame['pose'][pose] is True)
            cloth = [p for p in frame['parts'] if p.get('companionPart', '').startswith('outing-cloth-')]
            self.check('correct cloth parts', len(cloth) == (2 if pose == 'carrying' else 0))
            if pose == 'resting':
                self.check('lowered supported rest', abs(frame['pose']['bodyY']-.30) < 1e-8)
            p = self.folder/(label+'_'+view+'.png')
            self.page.screenshot(path=str(p))
            self.row['samples'].append({'label':label, 'camera':view, 'path':str(p), 'sha256':sha(p),
                                        'frame':frame, 'visibility':'Actual screenshot retained; submitted geometry is not human legibility approval'})

    def stored(self):
        return self.ev('()=>RealmCharacters.validate(JSON.parse(localStorage.getItem(RealmCharacters.KEY)))')

    def durable_action(self, label, world, writes_before):
        # Read before pagehide, autosave, another command or restart can heal a
        # button which changed memory but failed to durably save its candidate.
        saved = self.stored()
        actual = next(s['world'] for s in saved['slots'] if s['id'] == saved['active'])
        self.check(label+' immediate active native bytes match live candidate', actual == world)
        self.check(label+' actual save completed immediately', self.diag()['saveState'] == 'saved'
                   and self.row['nativeWrites'] == writes_before+1)

    def restart(self, label, facts):
        self.close()
        before = self.state()
        library = self.stored()
        self.context.close()
        self.context = None
        self.check('native close write observed', isinstance(self.raw, str))
        expected = self.raw
        write_new(self.folder/(label+'_CLOSED_NATIVE_BYTES.json'), expected)
        self.start()
        startup = self.ev('()=>window.__flStartup')
        self.row['restarts'].append({'label':label, 'matched':startup == expected,
                                     'closedSha256':hashlib.sha256(expected.encode()).hexdigest(),
                                     'startupSha256':hashlib.sha256(startup.encode()).hexdigest() if isinstance(startup,str) else None})
        if startup != expected:
            write_new(self.folder/(label+'_FAILED_STARTUP_BYTES.json'), startup)
        self.check('exact closed bytes read before startup writes', startup == expected)
        self.check('completed facts survive whole browser', self.state()['briarMoments'] == {'version':1,'revision':len(facts),'moments':facts})
        self.check('no fabricated transient activity', self.diag()['briar']['view'] is None)
        self.check('all old owners survive browser', stable(self.state()) == stable(before))
        after = self.stored()
        self.check('inactive characters unchanged', [s for s in library['slots'] if s['id'] != library['active']] ==
                   [s for s in after['slots'] if s['id'] != after['active']])

    def run(self, origin):
        self.start()
        self.panel('characters')
        with self.page.expect_file_chooser() as chooser:
            self.click('[data-rpg="chars-import"]')
        chooser.value.set_files(str(origin['paths']['input']))
        self.page.wait_for_selector('[data-rpg="chars-confirm-import"]')
        self.click('[data-rpg="chars-confirm-import"]')
        self.page.wait_for_function('()=>Realm.diagnostics.characters.active==="character-2"&&Realm.diagnostics.characters.writer===true')
        self.close()
        self.check('input imported without economic/story changes', stable(self.state()) == stable(origin['worlds']['input']))
        self.click('#settings')
        self.page.locator('#setting-timeFlow').uncheck()
        self.page.locator('#quality').select_option('low')
        self.click('#close-panel')
        self.render()
        baseline = self.state()
        self.check('native Low quality selected', baseline['settings']['quality'] == 'low')
        self.walk({'x':2,'z':8})
        self.action('start')
        self.check('Start closes workspace', not self.page.locator('#rpg-window').evaluate('(e)=>e.open'))
        self.accompany('returning')
        self.samples('CARRY', 'carrying')
        if self.label == EARLY[0]:
            self.restart('PARTIAL', [])
            self.walk({'x':2,'z':8})
            self.action('start')
        self.accompany('await-take')
        self.walk({'x':2,'z':8})
        before = self.state()
        writes_before = self.row['nativeWrites']
        self.action('take')
        after = self.state()
        self.check('Take saves exactly one fact', after['briarMoments'] == {'version':1,'revision':1,'moments':FACTS[:1]})
        self.check('Take changes no old owner', stable(after) == stable(before))
        self.check('Take factual journal appended', after['journal'][-1]['kind'] == 'briar-moment')
        self.check('Take exact atomic live boundary', fact_boundary(before, after, FACTS[0]))
        self.durable_action('Take', after, writes_before)
        self.restart('TAKEN', FACTS[:1])
        self.walk({'x':2,'z':8})
        self.action('rest')
        self.accompany('settled')
        self.walk({'x':-11,'z':-1.6})
        self.samples('REST', 'resting')
        before = self.state()
        writes_before = self.row['nativeWrites']
        self.action('remember')
        self.check('Remember saves exact second fact', self.state()['briarMoments'] == {'version':1,'revision':2,'moments':FACTS})
        self.check('Remember changes no old owner', stable(self.state()) == stable(before))
        self.check('Remember exact atomic live boundary', fact_boundary(before, self.state(), FACTS[1]))
        self.durable_action('Remember', self.state(), writes_before)
        self.restart('REMEMBERED', FACTS)
        self.check('all input ownership preserved across outing', stable(self.state()) == stable(baseline))
        self.panel()
        for kind in ('start','take','remember'):
            self.check('cold completed '+kind+' cannot replay', self.page.locator(
                '#rpg-content .briar-outing [data-rpg="briar"][data-id="'+kind+'"]').is_disabled())
        self.page.screenshot(path=str(self.folder/'COLD_COMPLETED.png'))
        self.check('completed moments visible in real panel', 'kept' in self.page.locator('#rpg-content .briar-outing').inner_text().lower())
        if self.label == EARLY[0]:
            self.walk({'x':2,'z':8})
            writes_before = self.row['nativeWrites']
            self.action('rest')
            self.accompany('rested')
            self.panel()
            self.check('deliberate repeated rest has no second recording control', self.page.locator(
                '#rpg-content .briar-outing [data-rpg="briar"][data-id="remember"]').is_disabled())
            self.check('repeated rest does not write a second fact', self.row['nativeWrites'] == writes_before
                       and self.state()['briarMoments'] == {'version':1,'revision':2,'moments':FACTS})
            self.close()
        write_new(self.folder/'FINAL_WORLD.json', self.state())

    def finish(self):
        if self.context:
            try:
                self.context.close()
            except Exception as e:
                self.row['closed'] = False
                self.row['closureError'] = repr(e)
                return
            self.context = None
        self.row['closed'] = True

    def retain_failure(self):
        # Capture before pagehide can autosave or destroy the failing pose.
        # Every source is read independently; a disconnected page remains an
        # honest capture error and never replaces the original assertion.
        self.row['failureEvidence'], self.row['captureErrors'] = [], []
        if self.page is None:
            self.row['captureErrors'].append('No page was allocated')
            return
        for name, observe in [('WORLD', self.state), ('DIAGNOSTICS', self.diag),
                              ('NATIVE_BYTES', lambda: self.ev('()=>localStorage.getItem(RealmCharacters.KEY)'))]:
            try:
                path = self.folder/('FAILURE_'+name+'.json')
                write_new(path, observe())
                self.row['failureEvidence'].append({'path':str(path), 'sha256':sha(path), 'beforeClose':True})
            except Exception as e:
                self.row['captureErrors'].append(name+': '+repr(e))
        try:
            path = self.folder/'FAILURE.png'
            self.page.screenshot(path=str(path), timeout=3000)
            self.row['failureEvidence'].append({'path':str(path), 'sha256':sha(path), 'beforeClose':True})
        except Exception as e:
            self.row['captureErrors'].append('SCREENSHOT: '+repr(e))


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root', type=Path, default=ROOT)
    p.add_argument('--cohort', type=Path, required=True)
    p.add_argument('--cohort-sha', required=True)
    p.add_argument('--scope', choices=('complete','early-only'), default='complete')
    p.add_argument('--source-gate', type=Path)
    p.add_argument('--output', type=Path)
    p.add_argument('--preflight-only', action='store_true')
    args = p.parse_args(argv)
    args.root = args.root.resolve()
    admitted = cohort(args.cohort, args.cohort_sha, args.root, args.scope, args.source_gate)
    support_path = args.root/'tools/browser_support.py'
    support_sha = sha(support_path)
    if args.preflight_only:
        print(json.dumps({'status':'passed','scope':args.scope,'labels':admitted['labels'],
                          'reportSha256':admitted['reportSha256'],'head':admitted['head'],
                          'callerSha256':sha(__file__),'supportSha256':support_sha,
                          'browserExecuted':False,'nativePersistence':False,'profilesAllocated':0}))
        return
    if args.output is None or not args.output.is_absolute():
        p.error('Fresh absolute D output required')
    args.output = args.output.resolve()
    if (os.name != 'nt' or args.output.drive.lower() != 'd:' or args.output.exists()
            or args.root == args.output or args.root in args.output.parents
            or args.cohort.resolve().parent == args.output or args.cohort.resolve().parent in args.output.parents):
        p.error('Separate fresh D output outside source and earned namespace required')
    if git(args.root, 'status', '--porcelain=v1', '--untracked-files=all'):
        p.error('Native launch requires clean committed source and caller')
    if Path(__file__).resolve() != args.root/'tools/briar_outing_browser.py':
        p.error('Execute the installed caller from its actual earned root')
    spec = importlib.util.spec_from_file_location('briar_browser_support', support_path)
    args.support = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(args.support)
    from playwright.sync_api import sync_playwright
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
    import threading
    initial = admission()  # Final read after all preparation, before allocation.
    args.output.mkdir()
    report = {'status':'running','scope':args.scope,'head':admitted['head'],'htmlSha256':sha(args.root/'index.html'),
              'callerSha256':sha(__file__),'supportSha256':support_sha,'cohortSha256':args.cohort_sha,
              'sourceGate':admitted['sourceGate'],'admission':initial,'cases':{},'browserErrors':[],
              'externalRequests':[],'execution':'accelerated-native-UI-whole-browser-restarts',
              'normalRAF':False,'humanAcceptance':False,'performanceCertified':False,'errors':[]}
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(args.root), **kw)
        def log_message(self, *a):
            pass
    server = ThreadingHTTPServer(('127.0.0.1',0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = 'http://127.0.0.1:'+str(server.server_port)
    report['origin'] = origin
    selected = EARLY+([RETURNING[-1]] if args.scope == 'complete' else [])
    report['nativeLabels'], report['cpuOnlyLabels'] = selected, [s for s in admitted['labels'] if s not in selected]
    h = None
    try:
        with sync_playwright() as pw:
            for label in selected:
                h = Native(pw, args, report, origin, label)
                try:
                    h.run(admitted['rows'][label])
                except Exception:
                    h.retain_failure()
                    raise
                finally:
                    h.finish()
                if not h.row.get('closed'):
                    raise AssertionError('Owned context closure unconfirmed; no next browser admitted')
        cohort(args.cohort, args.cohort_sha, args.root, args.scope, args.source_gate)
        if git(args.root, 'rev-parse','HEAD') != admitted['head'] or git(args.root,'status','--porcelain=v1','--untracked-files=all'):
            raise AssertionError('Clean source head changed during native run')
        if sha(__file__) != report['callerSha256'] or sha(support_path) != support_sha:
            raise AssertionError('Native caller/support changed during run')
        if report['browserErrors'] or report['externalRequests'] or any(not r.get('closed') for r in report['cases'].values()):
            raise AssertionError('Browser errors or unexpected requests retained')
        report['status'] = 'passed'
    except Exception:
        report['status'] = 'failed'
        report['errors'].append(traceback.format_exc())
        raise
    finally:
        server.shutdown()
        server.server_close()
        report['serverClosed'] = True
        write_new(args.output/'BRIAR_NATIVE_REPORT.json', report)


if __name__ == '__main__':
    main()
