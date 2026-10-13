"""Character library on a real loopback origin, isolated native browser profile.

The initial legacy world is a labelled command-earned pursuit checkpoint. UI
actions create/import/switch/delete characters. Boundary failures are explicitly
injected; accelerated simulation is not a human pacing or performance test.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import hashlib, json, tempfile, threading, traceback
from playwright.sync_api import sync_playwright
from browser_support import chromium_launch_kwargs, browser_output

ROOT = Path(__file__).resolve().parents[1]
OUT = browser_output(ROOT / 'evidence10' / 'characters-browser')
OUT.mkdir(parents=True, exist_ok=True)
KEY = 'eternities.realm10.characters.v1'
OLD = 'eternities.realm10.save.v9'
fixture_path = ROOT / 'docs/evidence/upgrade-hunt/run5_02_PARTIAL.json'
fixture = json.loads(fixture_path.read_text(encoding='utf8'))
report = {'method': __doc__, 'checks': [], 'errors': [], 'browser_errors': [],
          'html_sha256': hashlib.sha256((ROOT / 'index.html').read_bytes()).hexdigest(),
          'fixture': str(fixture_path.relative_to(ROOT)),
          'fixture_sha256': hashlib.sha256(fixture_path.read_bytes()).hexdigest()}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *_args):
        pass

def check(name, value):
    report['checks'].append({'name': name, 'passed': bool(value)})
    print(('PASS ' if value else 'FAIL ') + name, flush=True)
    if not value:
        try:
            page.screenshot(path=str(OUT / 'FAILURE.png'))
        except Exception:
            pass
        raise AssertionError(name)

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/index.html'
context = None
try:
    with tempfile.TemporaryDirectory(prefix='firstlight-characters-') as profile, sync_playwright() as pw:
        launch = chromium_launch_kwargs()
        def start():
            return pw.chromium.launch_persistent_context(profile, **launch, accept_downloads=True,
                viewport={'width': 1440, 'height': 960})
        context = start()
        def spawn(seed=None):
            page = context.new_page()
            page.on('pageerror', lambda e: report['browser_errors'].append(str(e)))
            page.add_init_script('window.__ETERNITIES_TEST_MODE=true;window.__ETERNITIES_CAPTURE_MODE=true;')
            if seed is not None:
                page.add_init_script(f"if(!localStorage.getItem({json.dumps(OLD)}))localStorage.setItem({json.dumps(OLD)},{json.dumps(json.dumps(seed))});")
            response = page.goto(url, wait_until='load')
            page.wait_for_function('() => !!window.Realm')
            check('Browser loads exact regenerated HTML', hashlib.sha256(response.body()).hexdigest() == report['html_sha256'])
            page.evaluate('() => {Realm.test.quality("low");Realm.test.render()}')
            return page
        page = spawn(fixture)
        ev = lambda js, arg=None: page.evaluate(js, arg)
        state = lambda: ev('() => Realm.state')
        diag = lambda: ev('() => Realm.diagnostics')
        raw = lambda: ev('(k) => localStorage.getItem(k)', KEY)
        def render():
            ev('() => Realm.test.render()')
        def close():
            if page.locator('#rpg-window').evaluate('(e) => e.open'):
                page.locator('#rpg-close').click()
            if page.locator('#drawer').evaluate('(e) => e.classList.contains("open")'):
                page.locator('#close-panel').click()
        def library():
            close()
            page.locator('[data-rpg="open"][data-id="more"]').click()
            page.locator('#rpg-content [data-rpg="open"][data-id="characters"]').click()
        def switch(identity):
            library()
            page.locator(f'[data-rpg="chars-switch"][data-id="{identity}"]').click()
            page.wait_for_function('(id) => Realm.diagnostics.characters.active===id', arg=identity)
            render()
        def keep_note(text):
            close()
            ev('() => Realm.test.openPanel("chronicle")')
            page.locator('#note-text').fill(text)
            page.locator('[data-action="note"]').click()
            close()
        def create(name, palette):
            library()
            page.locator('#chars-name').fill(name)
            page.locator(f'[data-rpg="chars-palette"][data-id="{palette}"]').click()
            page.locator('#chars-create-submit').click()
            page.wait_for_function('(name) => Realm.state.visitor.name===name', arg=name)
            render()

        check('Old single-character save remains the default until an explicit action', raw() is None and diag()['characters']['mode'] == 'legacy')
        check('Existing partial project loads from the accepted save', state()['adventure']['pursuit'] == fixture['adventure']['pursuit'])
        keep_note('Iris keeps the western sample.')
        rename = ev('() => Realm.test.act("roster-name","appearance",{visitor:{name:"Iris",skin:2,cloak:3,hair:4}})')
        check('Existing character appearance is set through accepted rules', rename['ok'])
        page.locator('[data-rpg="camera"][data-id="tactical"]').click()
        ev('() => Realm.test.save()')
        legacy_bytes = ev('(k) => localStorage.getItem(k)', OLD)
        original = state()
        library()
        check('Character library is discoverable from More and its own tab', page.locator('#rpg-tabs [data-id="characters"]').count() == 1 and page.locator('.chars-card').count() == 1)
        check('Existing card shows actual level, weapon, and pinned project', all(t in page.locator('.chars-card').inner_text() for t in ['Iris', 'Level 1', 'Trail blade', 'Copper-edged blade']))
        check('Empty name cannot create a character', page.locator('#chars-create-submit').is_disabled())
        check('Legacy library permits importing a separate character', page.locator('[data-rpg="chars-import"]').is_enabled())
        page.locator('#chars-name').fill('vR1 fresh')
        held = diag()
        page.keyboard.press('Tab')
        check('Naming and Tab focus do not fire attacks or change cameras', not diag()['adventure']['tactics']['auto'] and diag()['camera']['preset'] == held['camera']['preset'])
        check('Typing a valid name enables creation without losing the input', page.locator('#chars-create-submit').is_enabled())
        create('Rowan', 1)
        check('Explicit creation selects a second identity', diag()['characters']['active'] == 'character-2' and diag()['characters']['count'] == 2)
        check('New character has the selected real appearance', state()['visitor'] == {'name': 'Rowan', 'skin': 1, 'cloak': 1, 'hair': 1})
        fresh = state()
        check('New character receives no old gear, XP, notes, or project progress', not fresh['adventure']['started'] and not fresh['adventure']['owned'] and fresh['adventure']['xp'] == 0 and not fresh['notes'] and fresh['adventure']['pursuit']['claimed'] == 0)
        check('Creating a library leaves original browser save bytes intact', ev('(k) => localStorage.getItem(k)', OLD) == legacy_bytes)
        check('New character starts in third person independently of the prior tactical view', diag()['camera']['preset'] == 'adventure')
        check('Switch clears combat, build, selection, and music runtime', not diag()['adventure']['tactics']['auto'] and diag()['adventure']['tactics']['target'] is None and diag()['sandbox']['buildMode'] is None and not diag()['music']['playing'])
        keep_note('Rowan starts a different evening.')
        ev('() => Realm.test.openStudio()')
        page.locator('[data-music="cell"]').first.click()
        page.locator('#studio-close').click()
        rowan_score = state()['score']
        check('New character can edit its own real music score', rowan_score != original['score'])
        # Delay the export's real scheduling boundary, then change character.
        ev('() => Realm.test.openStudio()')
        ev('() => {window.originalTimeout=window.setTimeout;window.setTimeout=function(fn,ms,...args){if(ms===30){window.finishAudioExport=()=>{window.setTimeout=originalTimeout;fn(...args)};return 0;}return originalTimeout(fn,ms,...args)}}')
        late_downloads = []
        page.on('download', lambda d: late_downloads.append(d.suggested_filename))
        page.locator('[data-music="wav"]').click()
        page.wait_for_function('() => !!window.finishAudioExport')
        page.locator('#studio-close').click();switch('character-1')
        ev('() => window.finishAudioExport()')
        page.wait_for_function('() => /export/i.test(document.querySelector("#toast").textContent)')
        check('A delayed audio export cannot export the newly selected character by mistake', not late_downloads)
        switch('character-2')
        # A deliberately delayed file read must not import into a different character.
        ev('() => Realm.test.openStudio()')
        ev('() => {window.originalFileText=File.prototype.text;File.prototype.text=function(){const file=this;return new Promise(resolve=>{window.finishScoreRead=()=>originalFileText.call(file).then(resolve)})}}')
        imported_score = dict(rowan_score);imported_score['title'] = 'Delayed Rowan import'
        page.on('dialog', lambda d: d.accept())
        page.locator('#score-import').set_input_files({'name': 'slow-score.json', 'mimeType': 'application/json', 'buffer': json.dumps(imported_score).encode()})
        page.wait_for_function('() => !!window.finishScoreRead')
        page.locator('#studio-close').click()
        switch('character-1')
        ev('() => window.finishScoreRead()')
        page.wait_for_timeout(100)
        check('A pending score import cannot write into a newly selected character', state()['score'] == original['score'])
        ev('() => {File.prototype.text=window.originalFileText}')
        # The ordinary character file picker crosses the same asynchronous boundary.
        library();page.locator('[data-rpg="chars-import"]').click()
        ev('() => {window.originalCharacterText=File.prototype.text;File.prototype.text=function(){const file=this;return new Promise(resolve=>{window.finishCharacterRead=()=>originalCharacterText.call(file).then(resolve)})}}')
        page.locator('#import-file').set_input_files({'name':'slow-character.json','mimeType':'application/json','buffer':fixture_path.read_bytes()})
        page.wait_for_function('() => !!window.finishCharacterRead');switch('character-2')
        after_switch=state();after_switch_bytes=raw();ev('() => window.finishCharacterRead()');page.wait_for_timeout(100)
        check('A pending character import cannot open a preview after switching lives',page.locator('.chars-import-preview').count()==0 and 'Import refused' in page.locator('#toast').inner_text())
        check('Refused delayed character import retains the selected world and saved bytes',state()==after_switch and raw()==after_switch_bytes and diag()['characters']['active']=='character-2')
        ev('() => {File.prototype.text=window.originalCharacterText}');switch('character-1')
        check('Switch restores original partial survey and owned equipment exactly', state()['adventure'] == original['adventure'])
        check('Original notebook and score remain separate', state()['notes'] == original['notes'] and state()['score'] == original['score'])
        check('Original camera returns to tactical diorama', diag()['camera']['preset'] == 'tactical')
        # Enter the existing live project scene through legal movement, then switch.
        close()
        check('Character can walk to the existing riverbank entry', ev('() => Realm.test.move(15,7)')['ok'])
        ev('() => Realm.test.step(20)');page.keyboard.press('e');render()
        check('Prior character enters its real active survey scene', diag()['scene'] == 'riverbank')
        check('Practice target is selected through accepted combat rules', ev('() => Realm.test.adventure("roster-target","target-select",{id:"river-practice"})')['ok'])
        page.keyboard.press('1');render()
        check('Outgoing character has an actual active combat toggle before switching', diag()['adventure']['tactics']['auto'])
        switch('character-2')
        check('Second character keeps its authored note and music after return', any(n['text'].startswith('Rowan') for n in state()['notes']) and state()['score'] == rowan_score)
        check('Switching out of combat stops target, attacks, movement, and scene state', diag()['scene'] == 'valley' and not diag()['adventure']['tactics']['auto'] and diag()['adventure']['tactics']['target'] is None and not ev('() => Realm.test.path.length'))
        switch('character-1')
        check('Returning uses the existing safe outdoor checkpoint without losing the partial survey', diag()['scene'] == 'valley' and state()['adventure']['pursuit'] == original['adventure']['pursuit'])
        switch('character-2')
        # Force one storage failure at the actual localStorage boundary.
        library()
        before = state(); saved = raw(); active = diag()['characters']['active']
        ev('() => {window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===RealmCharacters.KEY)throw Error("labelled quota fixture");return originalSetItem.call(this,k,v)}}')
        page.locator('[data-rpg="chars-switch"][data-id="character-1"]').click()
        page.wait_for_function('() => document.querySelector("#toast").textContent.includes("quota fixture")')
        check('Quota-blocked UI switch keeps the active world and all persisted bytes', state() == before and raw() == saved and diag()['characters']['active'] == active)
        ev('() => {Storage.prototype.setItem=window.originalSetItem}')
        # A slower earlier file must not replace a later explicit preview.
        ev('() => {window.originalCharacterText=File.prototype.text;File.prototype.text=function(){if(this.name!=="first-slow.json")return originalCharacterText.call(this);const file=this;return new Promise(resolve=>{window.finishFirstCharacterRead=()=>originalCharacterText.call(file).then(resolve)})}}')
        first_import=json.loads(fixture_path.read_text(encoding='utf8'));first_import['visitor']['name']='Earlier file'
        latest_import=json.loads(fixture_path.read_text(encoding='utf8'));latest_import['visitor']['name']='Latest file'
        page.locator('[data-rpg="chars-import"]').click();page.locator('#import-file').set_input_files({'name':'first-slow.json','mimeType':'application/json','buffer':json.dumps(first_import).encode()})
        page.wait_for_function('() => !!window.finishFirstCharacterRead')
        page.locator('[data-rpg="chars-import"]').click();page.locator('#import-file').set_input_files({'name':'second-fast.json','mimeType':'application/json','buffer':json.dumps(latest_import).encode()})
        page.wait_for_selector('.chars-import-preview');ev('() => window.finishFirstCharacterRead()');page.wait_for_timeout(100)
        check('An earlier delayed file cannot replace the newer import preview',page.locator('.chars-import-preview h3').inner_text()=='Latest file')
        check('Overlapping file previews leave both existing worlds untouched',raw()==saved and state()==before)
        ev('() => {File.prototype.text=window.originalCharacterText}');page.locator('[data-rpg="chars-cancel-import"]').click()
        # Malformed import is refused before any preview or mutation.
        page.locator('[data-rpg="chars-import"]').click()
        page.locator('#import-file').set_input_files({'name': 'invalid.json', 'mimeType': 'application/json', 'buffer': b'{"version":999}'})
        page.wait_for_function('() => document.querySelector("#toast").textContent.includes("Import refused")')
        check('Invalid import leaves the current world and saved library unchanged', raw() == saved and state() == before and page.locator('.chars-import-preview').count() == 0)
        # A valid import is staged visibly and does not replace either existing slot.
        page.locator('[data-rpg="chars-import"]').click()
        page.locator('#import-file').set_input_files({'name': 'earned-pursuit.json', 'mimeType': 'application/json', 'buffer': fixture_path.read_bytes()})
        page.wait_for_selector('.chars-import-preview')
        check('Import preview requires a separate confirmation before storage changes', raw() == saved and diag()['characters']['count'] == 2)
        page.locator('[data-rpg="chars-cancel-import"]').click()
        check('Cancelled import preserves both worlds', raw() == saved and page.locator('.chars-import-preview').count() == 0)
        page.locator('[data-rpg="chars-import"]').click()
        page.locator('#import-file').set_input_files({'name': 'earned-pursuit.json', 'mimeType': 'application/json', 'buffer': fixture_path.read_bytes()})
        page.locator('[data-rpg="chars-confirm-import"]').click()
        page.wait_for_function('() => Realm.diagnostics.characters.active==="character-3"')
        check('Confirmed import gets its own identity and complete original quest state', diag()['characters']['count'] == 3 and state()['adventure']['pursuit'] == fixture['adventure']['pursuit'])
        library()
        check('Full library does not offer a fourth creation or import', page.locator('#chars-name').count() == 0 and page.locator('[data-rpg="chars-import"]').is_disabled())
        check('All names and imported equipment are visible in the roster', page.locator('.chars-card').count() == 3 and 'Rowan' in page.locator('.chars-grid').inner_text())
        render();page.screenshot(path=str(OUT / 'CHARACTER_LIBRARY.png'))
        page.set_viewport_size({'width': 390, 'height': 844});render()
        check('Character cards stay within the narrow viewport', page.locator('.chars-card').evaluate_all('(es) => es.every(e => e.getBoundingClientRect().left>=0 && e.getBoundingClientRect().right<=innerWidth)'))
        page.screenshot(path=str(OUT / 'CHARACTER_LIBRARY_NARROW.png'))
        page.set_viewport_size({'width': 1440, 'height': 960})
        # Exact-name deletion is inactive only, cancel remains lossless.
        saved = raw()
        check('Active character has no delete action', page.locator('[data-rpg="chars-delete"][data-id="character-3"]').count() == 0)
        page.locator('[data-rpg="chars-delete"][data-id="character-1"]').click()
        check('Delete is disabled until the exact target name is typed', page.locator('[data-rpg="chars-confirm-delete"]').is_disabled())
        page.locator('#chars-delete-name').fill('iris')
        check('Wrong case does not satisfy deletion confirmation', page.locator('[data-rpg="chars-confirm-delete"]').is_disabled())
        page.locator('#chars-delete-name').fill('Iris')
        check('Exact name enables deliberate deletion', page.locator('[data-rpg="chars-confirm-delete"]').is_enabled())
        page.locator('[data-rpg="chars-cancel-delete"]').click()
        check('Cancelling deletion leaves every saved byte intact', raw() == saved)
        # Export the inactive original as a plain compatible world before deletion.
        with page.expect_download() as download:
            page.locator('[data-rpg="chars-export"][data-id="character-1"]').click()
        exported = Path(download.value.path()).read_bytes()
        exported_world = json.loads(exported)
        check('Inactive export is a portable world with all original progression', all(exported_world['adventure'][k] == original['adventure'][k] for k in ['pursuit','equipment','owned','xp','starter','crossing','beacon','companion']) and exported_world['notes'] == original['notes'] and 'slots' not in exported_world)
        page.locator('[data-rpg="chars-delete"][data-id="character-1"]').click()
        page.locator('#chars-delete-name').fill('Iris')
        page.locator('[data-rpg="chars-confirm-delete"]').click()
        page.wait_for_function('() => Realm.diagnostics.characters.count===2')
        check('Confirmed deletion affects only the named inactive identity', json.loads(raw())['active'] == 'character-3' and {s['id'] for s in json.loads(raw())['slots']} == {'character-2', 'character-3'})
        check('Deleting the migrated slot does not erase its legacy recovery key', ev('(k) => localStorage.getItem(k)', OLD) == legacy_bytes)
        # A new ID is monotonic, not a reused deleted identity.
        create('Fern', 4)
        check('Creation after deletion uses a new monotonic identity', diag()['characters']['active'] == 'character-4')
        # Second live tab gets a read-only library. No profile or key mocks here.
        other = spawn()
        other.wait_for_function('() => !!Realm.diagnostics.characters.error')
        check('Only one real browser tab owns the editing lock', diag()['characters']['writer'] and not other.evaluate('() => Realm.diagnostics.characters.writer'))
        other.keyboard.press('c');other.locator('#rpg-tabs [data-id="characters"]').click()
        check('Second tab exposes export but disables character mutation', other.locator('[data-rpg="chars-export"]').first.is_enabled() and other.locator('[data-rpg="chars-switch"]').first.is_disabled())
        frozen = raw()
        second_save = other.evaluate('() => {Realm.test.act("second-tab-note","note",{text:"unsaved second tab"});return Realm.test.save()}')
        check('Second-tab autosave cannot overwrite the editing tab', not second_save['ok'] and raw() == frozen)
        other.close()
        close();switch('character-2')
        rowan_saved = state()
        context.close();context = start();page = spawn()
        page.wait_for_function('() => Realm.diagnostics.characters.writer')
        check('Whole browser restart restores the active identity and its score/notes', diag()['characters']['active'] == 'character-2' and state()['score'] == rowan_saved['score'] and state()['notes'] == rowan_saved['notes'])
        check('Deleted characters do not return from the retained old key on restart', {s['id'] for s in json.loads(raw())['slots']} == {'character-2', 'character-3', 'character-4'})
        # A foreign writer is detected from exact bytes, even when it bypasses Web Locks.
        foreign = context.new_page();foreign.goto(url);foreign.wait_for_function('() => !!window.Realm')
        foreign.evaluate('(k) => {const r=JSON.parse(localStorage.getItem(k));r.revision++;localStorage.setItem(k,JSON.stringify(r))}', KEY)
        page.wait_for_function('() => Realm.diagnostics.characters.mode==="blocked"')
        saved = raw()
        check('External storage revision blocks stale saves without discarding runtime', not ev('() => Realm.test.save()')['ok'] and raw() == saved and state()['notes'] == rowan_saved['notes'])
        foreign.close()
        library()
        with page.expect_download() as recovery:
            page.locator('[data-rpg="chars-recovery"]').click()
        recovery_data = json.loads(Path(recovery.value.path()).read_bytes())
        check('Recovery export retains exact saved storage without changing it', next(e['text'] for e in recovery_data['entries'] if e['key'] == KEY) == saved and raw() == saved)
        # Corrupt present library is a separate, labelled boundary fixture.
        ev('(k) => localStorage.setItem(k,"{labelled corrupt library")', KEY)
        page.reload();page.wait_for_function('() => !!window.Realm');render()
        check('Corrupt present library blocks fallback to the retained original world', diag()['characters']['mode'] == 'blocked' and not state()['adventure']['started'] and ev('(k) => localStorage.getItem(k)', OLD) == legacy_bytes)
        library()
        check('Corrupt storage disables creation and names the session as unsaved', page.locator('#chars-create-submit').is_disabled() and 'CURRENT SESSION' in page.locator('.chars-card').inner_text())
        with page.expect_download() as damaged:
            page.locator('[data-rpg="chars-recovery"]').click()
        damaged_data = json.loads(Path(damaged.value.path()).read_bytes())
        check('Unreadable library can be copied exactly for later repair', next(e['text'] for e in damaged_data['entries'] if e['key'] == KEY) == '{labelled corrupt library' and raw() == '{labelled corrupt library')
        context.close();context = None
        # A browser without Web Locks keeps the original playable save path but
        # cannot opt into managed character writes.
        browser = pw.chromium.launch(**launch)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        context.add_init_script('Object.defineProperty(navigator,"locks",{value:undefined});')
        page = spawn()
        saved_old = ev('(k) => localStorage.getItem(k)', OLD)
        library();page.locator('#chars-name').fill('Unavailable lock fixture');page.locator('#chars-create-submit').click()
        page.wait_for_function('() => /Web Locks/.test(document.querySelector("#toast").textContent)')
        check('Missing Web Locks refuses character creation without altering the old world', raw() is None and state()['visitor']['name'] == 'Visitor' and ev('(k) => localStorage.getItem(k)', OLD) == saved_old)
        close();keep_note('Legacy play can still be saved.')
        check('Original single-world saving remains available without the new library API', any(n['text'] == 'Legacy play can still be saved.' for n in json.loads(ev('(k) => localStorage.getItem(k)', OLD))['notes']))
        page.once('dialog', lambda d: d.accept())
        page.locator('#import-file').set_input_files({'name': 'legacy-import.json', 'mimeType': 'application/json', 'buffer': fixture_path.read_bytes()})
        page.wait_for_function('() => Realm.state.adventure.started')
        check('Explicit legacy import also remains available without Web Locks', raw() is None and state()['adventure']['pursuit'] == fixture['adventure']['pursuit'] and diag()['scene'] == 'valley')
        check('No unhandled browser errors', not report['browser_errors'])
        context.close();context = None;browser.close()
except Exception:
    report['errors'].append(traceback.format_exc())
    if context:
        try:
            page.screenshot(path=str(OUT / 'FAILURE.png'))
        except Exception:
            pass
    raise
finally:
    if context:
        try:
            context.close()
        except Exception:
            pass
    server.shutdown();server.server_close()
    report['passed'] = bool(report['checks']) and all(c['passed'] for c in report['checks']) and not report['errors'] and not report['browser_errors']
    (OUT / 'CHARACTERS_BROWSER_REPORT.json').write_text(json.dumps(report, indent=2), encoding='utf8')
    print('RESULT', sum(c['passed'] for c in report['checks']), report['passed'], flush=True)
