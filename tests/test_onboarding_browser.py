"""CPU preparation tests only; imports never launch browser/server/profile.

Boundary JSON is hand-authored test input, not an earned character fixture.
The source preflight case reads the actual installed Root when explicitly set.
"""
from pathlib import Path
import ast
import copy
import contextlib
import io
import inspect
import importlib.util
import json
import os
import subprocess
import tempfile
import threading
import unittest

HERE = Path(__file__).resolve().parent


def load_tool():
    tool = HERE / 'onboarding_browser.py'
    if not tool.is_file():
        tool = HERE.parent / 'tools/onboarding_browser.py'
    spec = importlib.util.spec_from_file_location('onboarding_browser', tool)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def boundary_world():
    return {'version': 9, 'seed': 2317, 'adventure': {'xp': 1, 'revision': 2,
            'elapsed': 0, 'equipment': {'weapon': 'trail_blade'},
            'arsenal': {'sockets': {}}, 'beacon': {'relic': 'sealed'}},
            'localLife': {'records': {'lamp': {'accepted': True, 'choice': 'approach', 'claimed': False}}},
            'homeHistory': {'version': 1, 'records': []},
            'settings': {'cameraViews': {'version': 1, 'profiles': {}}, 'cameraMode': 'adventure'},
            'journal': [], 'nextEvent': 1, 'notes': [], 'player': {'x': 2.5, 'z': 6}}


class Preparation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m = load_tool()

    def test_01_import_is_inert(self):
        before = sorted(p.name for p in HERE.iterdir())
        threads = {t.ident for t in threading.enumerate()}
        module = load_tool()
        self.assertTrue(callable(module.main))
        self.assertEqual(before, sorted(p.name for p in HERE.iterdir()))
        self.assertEqual(threads, {t.ident for t in threading.enumerate()})
        self.assertNotIn('playwright.sync_api', module.__dict__)

    def test_02_valid_fresh_projection_contract(self):
        self.m.require_journal({'title': 'The Feather Beneath Wildwood', 'chapterBeforeLater': True,
            'laterClosed': True, 'lockedActions': ['earth-homecoming-open', 'cosmos-campaign-open',
                'atlantis-campaign-open', 'heaven-campaign-open', 'hell-campaign-open']})

    def test_03_later_work_cannot_precede_current_chapter(self):
        with self.assertRaises(AssertionError):
            self.m.require_journal({'title': 'The Feather Beneath Wildwood', 'chapterBeforeLater': False,
                'laterClosed': True, 'lockedActions': list(self.m.LOCKED_ACTIONS)})

    def test_04_missing_locked_read_control_is_not_hidden_success(self):
        with self.assertRaises(AssertionError):
            self.m.require_journal({'title': 'The Feather Beneath Wildwood', 'chapterBeforeLater': True,
                'laterClosed': True, 'lockedActions': ['earth-homecoming-open']})

    def test_05_collapsed_later_group_is_required_initially(self):
        with self.assertRaises(AssertionError):
            self.m.require_journal({'title': 'The Feather Beneath Wildwood', 'chapterBeforeLater': True,
                'laterClosed': False, 'lockedActions': list(self.m.LOCKED_ACTIONS)})

    def test_06_camera_save_metadata_does_not_fake_history_loss(self):
        before = boundary_world(); after = copy.deepcopy(before)
        after['settings']['cameraViews']['profiles']['adventure'] = {'yaw': .2}
        self.m.require_projection_preserved(before, after)

    def test_07_protected_choice_cannot_disappear(self):
        before = boundary_world(); after = copy.deepcopy(before)
        after['localLife']['records']['lamp']['choice'] = 'desk'
        with self.assertRaises(AssertionError):
            self.m.require_projection_preserved(before, after)

    def test_08_equipment_socket_cannot_be_added(self):
        before = boundary_world(); after = copy.deepcopy(before)
        after['adventure']['arsenal']['sockets']['trail_blade'] = 'amber'
        with self.assertRaises(AssertionError):
            self.m.require_projection_preserved(before, after)

    def test_09_xp_or_revision_mutation_is_not_metadata(self):
        for field in ('xp', 'revision'):
            before = boundary_world(); after = copy.deepcopy(before)
            after['adventure'][field] += 1
            with self.subTest(field=field), self.assertRaises(AssertionError):
                self.m.require_projection_preserved(before, after)

    def test_10_no_tracker_preference_can_be_saved(self):
        before = boundary_world(); after = copy.deepcopy(before)
        after['trackerSelection'] = 'homestead'
        with self.assertRaises(AssertionError):
            self.m.require_projection_preserved(before, after)

    def test_11_keys_are_protected_by_presence_and_value(self):
        self.m.require_old_keys({'old': 'kept', 'absent': None}, {'old': 'kept', 'absent': None})
        for after in ({'old': 'changed', 'absent': None}, {'old': 'kept', 'absent': 'injected'}):
            with self.assertRaises(AssertionError):
                self.m.require_old_keys({'old': 'kept', 'absent': None}, after)

    def test_12_native_library_revision_may_advance_without_game_change(self):
        before = {'version': 1, 'revision': 2, 'active': 'character-1',
                  'slots': [{'id': 'character-1', 'world': boundary_world()}]}
        after = copy.deepcopy(before); after['revision'] += 1
        self.m.require_same_slots(before, after)

    def test_13_inactive_slot_history_cannot_be_replaced(self):
        before = {'version': 1, 'revision': 2, 'active': 'character-1',
                  'slots': [{'id': 'character-1', 'world': boundary_world()}]}
        after = copy.deepcopy(before); after['slots'][0]['world']['journal'].append({'text': 'injected'})
        with self.assertRaises(AssertionError):
            self.m.require_same_slots(before, after)

    def test_14_existing_output_is_refused(self):
        with tempfile.TemporaryDirectory(dir=HERE) as t:
            root = Path(t) / 'root'; root.mkdir()
            existing = Path(t) / 'evidence'; existing.mkdir()
            with self.assertRaises(FileExistsError):
                self.m.guard_output(existing, root)

    def test_15_game_tree_and_parent_are_refused(self):
        with tempfile.TemporaryDirectory(dir=HERE) as t:
            root = Path(t) / 'root'; root.mkdir()
            with self.assertRaises(ValueError):
                self.m.guard_output(root / 'artifacts', root)
            with self.assertRaises((ValueError, FileExistsError)):
                self.m.guard_output(Path(t), root)

    def test_16_only_one_new_profile_child_is_allowed(self):
        with tempfile.TemporaryDirectory(dir=HERE) as t:
            p = self.m.profile_path(Path(t))
            self.assertEqual(p.parent, Path(t).resolve())
            p.mkdir()
            with self.assertRaises(FileExistsError):
                self.m.profile_path(Path(t))

    def test_17_source_drift_is_refused(self):
        with tempfile.TemporaryDirectory(dir=HERE) as t:
            p = Path(t) / 'input.txt'; p.write_text('before')
            frozen = {str(p): self.m.sha(p)}
            p.write_text('after')
            with self.assertRaises(AssertionError):
                self.m.require_frozen(frozen)

    def test_18_actual_installed_preflight_derives_current_epoch(self):
        root = os.environ.get('FIRSTLIGHT_ROOT')
        if not root:
            self.skipTest('Explicit actual checkout required; no private default.')
        frozen = self.m.source_inputs(Path(root))
        self.assertIn(str((Path(root) / 'src/rpg-ui.js').resolve()), frozen)
        self.assertEqual(frozen[str((Path(root) / 'index.html').resolve())],
                         frozen[str((Path(root) / 'FIRSTLIGHT_VALLEY.html').resolve())])
        self.m.require_frozen(frozen)

    def test_19_installed_browser_sdk_accepts_controller_arguments(self):
        # A misplaced positional argument would fail only after earning work.
        # Bind against the actual installed SDK without constructing Playwright.
        from playwright.sync_api import Page, BrowserContext, BrowserType
        tree = ast.parse(Path(self.m.__file__).read_text())
        types = {'self.page': Page, 'self.context': BrowserContext, 'self.pw.chromium': BrowserType}
        checked = 0
        for call in ast.walk(tree):
            if not isinstance(call, ast.Call) or not isinstance(call.func, ast.Attribute):
                continue
            owner = types.get(ast.unparse(call.func.value))
            if owner is None:
                continue
            signature = inspect.signature(getattr(owner, call.func.attr))
            try:
                signature.bind(None, *[object() for _ in call.args],
                               **{k.arg: object() for k in call.keywords if k.arg})
            except TypeError as e:
                self.fail('Actual SDK rejects controller call at line '+str(call.lineno)+': '+str(e))
            checked += 1
        self.assertGreater(checked, 10)

    def test_20_preflight_cli_cannot_create_evidence_or_start_threads(self):
        root = os.environ.get('FIRSTLIGHT_ROOT')
        if not root:
            self.skipTest('Explicit actual checkout required; no private default.')
        with tempfile.TemporaryDirectory(dir=HERE) as t:
            output = Path(t) / 'must-not-exist'
            threads = {thread.ident for thread in threading.enumerate()}
            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                result = self.m.main(['--root', root, '--output', str(output), '--preflight-only'])
            self.assertEqual(result, 0)
            self.assertFalse(output.exists())
            self.assertEqual(threads, {thread.ident for thread in threading.enumerate()})

    def test_21_live_ticks_do_not_ignore_payout_choice_or_inventory(self):
        before = boundary_world(); after = copy.deepcopy(before)
        after['adventure']['elapsed'] = 1
        self.assertEqual(self.m.living_signature(before), self.m.living_signature(after))
        after['adventure']['xp'] = 2
        self.assertNotEqual(self.m.living_signature(before), self.m.living_signature(after))
        after['adventure']['xp'] = 1
        after['localLife']['records']['lamp']['choice'] = 'desk'
        self.assertNotEqual(self.m.living_signature(before), self.m.living_signature(after))

    def test_22_saved_tracker_preferences_are_rejected_recursively(self):
        self.m.no_saved_preference({'slots': [{'world': boundary_world()}]})
        with self.assertRaises(AssertionError):
            self.m.no_saved_preference({'slots': [{'world': {'trackerSelection': 'homestead'}}]})

    def test_23_actual_core_fresh_has_zero_xp_and_old_progress_is_not_fresh(self):
        root = self.m.resolve_root()
        result = subprocess.run(['node', '-e',
            "console.log(JSON.stringify(require('./src/core.js').fresh()))"],
            cwd=root, capture_output=True, text=True, check=True)
        world = json.loads(result.stdout)
        self.assertTrue(self.m.fresh_start_terms(world))
        for name, mutate in (
            ('one prior XP', lambda w: w['adventure'].update(xp=1)),
            ('kit acquired', lambda w: w['adventure'].update(started=True)),
            ('accepted masterwork', lambda w: w['adventure']['earthMasterwork'].update(accepted=True)),
            ('accepted later work', lambda w: w['earthHomecoming'].update(accepted=True))):
            prior = copy.deepcopy(world); mutate(prior)
            with self.subTest(name=name): self.assertFalse(self.m.fresh_start_terms(prior))


    def resume_pair(self, legacy=False, historical=False):
        fixture = json.loads((HERE / 'fixtures/onboarding-resume-pair.json').read_text(encoding='utf8'))
        pair = copy.deepcopy(fixture['before']), copy.deepcopy(fixture['after'])
        # Labelled current boundary copies; the recorded historical file stays exact.
        for world in pair:
            world['briarMoments'] = {'version': 1, 'revision': 0, 'moments': []}
            world['earthWildSigns'] = {'version': 1, 'accepted': False, 'evidence': [],
                'observed': False, 'resolution': None, 'cleared': False, 'claimed': False}
        if not legacy:
            # The retained recorded fixture predates the fifth catalogue owner.
            # Current boundary input adds only its literal fresh record; no
            # historical file or accepted/paid facts are rewritten.
            for world in pair:
                world['localLife']['records']['earth-first-load-through-v1'] = {
                    'accepted': False, 'choice': None, 'steps': [], 'claimed': False}
        # Historical fresh +3 output remains a separate unchanged fixture/control.
        if not historical:
            pair = pair[0], self.production_tick(pair[0], .1)
        return pair

    def test_missing_wild_signs_owner_adds_only_literal_fresh_record(self):
        before,_=self.resume_pair();before.pop('earthWildSigns');original=copy.deepcopy(before)
        after=self.production_tick(before,.1)
        result=self.initial_resume(before,after)
        self.assertEqual(result['earthWildSignsMigration'],'missing-to-fresh-earth-wild-signs-v1')
        self.assertEqual(before,original)
        for defect in ('missing','observed','additional-field','old-history'):
            changed=copy.deepcopy(after)
            if defect=='missing':changed.pop('earthWildSigns')
            elif defect=='observed':changed['earthWildSigns']['observed']=True
            elif defect=='additional-field':changed['earthWildSigns']['unknown']=True
            else:changed['adventure']['xp']+=1
            with self.subTest(defect=defect),self.assertRaises(AssertionError):
                self.initial_resume(before,changed)

    def test_present_wild_signs_owner_is_preserved_without_default_allowance(self):
        before,_=self.resume_pair();after=self.production_tick(before,.1)
        result=self.initial_resume(before,after)
        self.assertIsNone(result['earthWildSignsMigration'])
        changed=copy.deepcopy(after);changed.pop('earthWildSigns')
        with self.assertRaises(AssertionError):self.initial_resume(before,changed)

    def test_briar_resume_disclosure_distinguishes_missing_default_from_existing_empty_owner(self):
        before,_=self.resume_pair();original=copy.deepcopy(before)
        self.assertIsNone(self.initial_resume(before,self.production_tick(before,.1))['briarMomentsMigration'])
        before.pop('briarMoments');missing=copy.deepcopy(before)
        after=self.production_tick(before,.1);result=self.initial_resume(before,after)
        self.assertEqual(result['briarMomentsMigration'],'missing-to-fresh-briar-moments-v1')
        self.assertEqual(before,missing)
        changed=copy.deepcopy(after);changed.pop('briarMoments')
        with self.assertRaises(AssertionError):self.initial_resume(before,changed)
        self.assertEqual(original['briarMoments'],{'version':1,'revision':0,'moments':[]})

    def initial_resume(self, before, after, seconds=.1):
        """Labelled synthetic tick metadata; actual installed Core is the oracle.

        Mutated output inputs are deliberate CPU faults, never native captures.
        The independently recorded modern fixture below uses its raw trace.
        """
        trace = {'version': 1, 'owner': 'character-1', 'finalOwner': 'character-1',
            'firstIndex': 0, 'first': copy.deepcopy(after), 'final': copy.deepcopy(after),
            'ticks': [{'dt': seconds, 'paused': False, 'beforeElapsed': 0, 'afterElapsed': seconds}],
            'activeSeconds': seconds, 'error': None, 'restored': True}
        return self.m.require_initial_resume(self.m.resolve_root(), before, after, trace, 'character-1')

    def production_tick(self, before, seconds, hydrated=True):
        # Actual installed owner, no validator/roster facade or saved-state writes.
        root = self.m.resolve_root()
        code = "const fs=require('node:fs'),C=require('./src/core.js');require('./src/combat.js');const q=JSON.parse(fs.readFileSync(0,'utf8'));const s=new C.Simulation(q.before,{hydrated:q.hydrated});s.tick(q.seconds);console.log(JSON.stringify(s.snapshot()));"
        result = subprocess.run(['node', '-e', code], cwd=root,
            input=json.dumps({'before': before, 'seconds': seconds, 'hydrated': hydrated}),
            capture_output=True, text=True, check=True, timeout=20)
        return json.loads(result.stdout)

    def test_24_recorded_whole_resume_pair_matches_actual_production_core(self):
        before, after = self.resume_pair(historical=True)
        predicted = self.production_tick(before, .1, hydrated=False)
        # Current-schema derivative of the old non-hydrated output only.
        # The captured historical file and all original events stay unchanged.
        after = self.literal_current_output(after)
        self.assertEqual(predicted['journal'], after['journal'])
        self.assertEqual(predicted['nextEvent'], after['nextEvent'])
        self.assertEqual(self.m.living_signature(predicted), self.m.living_signature(after))
        self.assertEqual(len(after['journal']), len(before['journal']) + 3)
        with self.assertRaisesRegex(AssertionError, 'complete old journal'):
            self.initial_resume(before, after)
        hydrated = self.production_tick(before, .1)
        result = self.initial_resume(before, hydrated)
        self.assertTrue(result['preserved']); self.assertEqual(result['tickSeconds'], .1)
        self.assertEqual(result['oldPrefixLength'], len(before['journal']))
        self.assertEqual(result['events'], [])
        self.assertEqual(before, self.resume_pair()[0])

    def test_25_resume_cannot_rewrite_or_drop_old_history(self):
        before, after = self.resume_pair()
        for name, mutate in (
            ('edited original entry', lambda w: w['journal'][0].update(text='forged old event')),
            ('dropped original entry', lambda w: w['journal'].pop(0))):
            bad = copy.deepcopy(after); mutate(bad)
            with self.subTest(name=name), self.assertRaises(AssertionError):
                self.initial_resume(before, bad)

    def test_26_resume_preserves_xp_equipment_socket_and_explicit_choice(self):
        before, after = self.resume_pair()
        for name, mutate in (
            ('XP', lambda w: w['adventure'].update(xp=1)),
            ('gear', lambda w: w['adventure']['equipment'].update(weapon=None)),
            ('socket', lambda w: w['adventure']['arsenal']['sockets'].update(trail_blade='amber')),
            ('choice', lambda w: w['localLife']['records']['atlantis-bellglass-lamp-v1'].update(choice='desk'))):
            bad = copy.deepcopy(after); mutate(bad)
            with self.subTest(name=name), self.assertRaises(AssertionError):
                self.initial_resume(before, bad)

    def test_27_resume_rejects_forged_routine_text_kind_or_order(self):
        before, after = self.resume_pair(); n = 0
        for name, mutate in (
            ('forged text', lambda w: w['journal'][n].update(text='Ilan received a quest payment.')),
            ('wrong kind', lambda w: w['journal'][n].update(kind='quest')),
            ('reordered people', lambda w: w['journal'].__setitem__(slice(n, n+2), list(reversed(w['journal'][n:n+2]))))):
            bad = copy.deepcopy(after); mutate(bad)
            with self.subTest(name=name), self.assertRaises(AssertionError):
                self.initial_resume(before, bad)

    def test_28_resume_rejects_sequence_or_next_event_forgery(self):
        before, after = self.resume_pair(); n = 0
        for name, mutate in (
            ('sequence jump', lambda w: w['journal'][n+1].update(seq=w['journal'][n+1]['seq']+1)),
            ('nextEvent extra', lambda w: w.update(nextEvent=w['nextEvent']+1))):
            bad = copy.deepcopy(after); mutate(bad)
            with self.subTest(name=name), self.assertRaises(AssertionError):
                self.initial_resume(before, bad)

    def test_29_resume_rejects_mixed_forged_future_or_invalid_clocks(self):
        import math
        before, after = self.resume_pair(); n = 0
        cases=[]
        for value in (float('nan'), float('inf'), True, before['hour']-.001):
            bad=copy.deepcopy(after); bad['journal'][n]['hour']=value; cases.append(('invalid first '+str(value),bad))
        bad=copy.deepcopy(after);bad['journal'][n+1]['hour']=math.nextafter(after['hour'], math.inf);cases.append(('one mixed clock',bad))
        bad=copy.deepcopy(after);bad['hour']=math.nextafter(after['hour'], math.inf);cases.append(('world clock inconsistent',bad))
        bad=copy.deepcopy(after);bad['journal'][n]['day']+=1;cases.append(('future day',bad))
        bad=copy.deepcopy(after)
        future=math.nextafter(before['hour']+.1*.0045,math.inf)
        bad['hour']=future
        for event in bad['journal'][n:]:event['hour']=future
        cases.append(('beyond actual clamped clock',bad))
        for name,bad in cases:
            with self.subTest(name=name),self.assertRaises(AssertionError):
                self.initial_resume(before, bad)

    def test_30_resume_does_not_allow_a_fourth_or_missing_event(self):
        before, after = self.resume_pair()
        bad=copy.deepcopy(after);extra=copy.deepcopy(bad['journal'][-1]);extra['seq']=bad['nextEvent'];bad['nextEvent']+=1;bad['journal'].append(extra)
        with self.assertRaises(AssertionError):self.initial_resume(before, bad)
        bad=copy.deepcopy(after);bad['journal'].pop();bad['nextEvent']-=1
        with self.assertRaises(AssertionError):self.initial_resume(before, bad)

    def test_31_actual_core_tick_clocks_allow_binary64_clamped_endpoint(self):
        before,_=self.resume_pair()
        for seconds in (0, .016, .05, .1):
            after=self.production_tick(before,seconds)
            result=self.initial_resume(before,after,seconds)
            with self.subTest(seconds=seconds):
                self.assertTrue(result['preserved']);self.assertLessEqual(result['tickSeconds'],.1)
                self.assertEqual(result['events'],after['journal'][len(before['journal']):])

    def test_32_normal_tracker_tick_history_comparison_remains_strict(self):
        before,after=self.resume_pair(historical=True)
        self.assertNotEqual(self.m.living_signature(before),self.m.living_signature(after))
        source=inspect.getsource(self.m.OnboardingBrowser.tick_tracker)
        self.assertIn('living_signature(before) == living_signature(after)',source)
        self.assertNotIn('require_initial_resume',source)


    def test_33_actual_core_other_owner_reset_is_outside_resume_allowance(self):
        before, _ = self.resume_pair()
        # Explicit synthetic settings boundary, not earned browser state. Core
        # deliberately disables sound on load; that is NOT folded into this
        # journal-only allowance or a generic tolerance for owner changes.
        before['settings']['sound'] = True
        after = self.production_tick(before, .1)
        self.assertFalse(after['settings']['sound'])
        self.assertEqual(len(after['journal']), len(before['journal']))
        with self.assertRaisesRegex(AssertionError, 'another protected owner'):
            self.initial_resume(before, after)

    def test_34_exact_legacy_catalogue_adds_only_literal_fresh_fifth_owner(self):
        before, _ = self.resume_pair(legacy=True)
        original = copy.deepcopy(before)
        after = self.production_tick(before, .1)
        expected = copy.deepcopy(before['localLife'])
        expected['records']['earth-first-load-through-v1'] = {
            'accepted': False, 'choice': None, 'steps': [], 'claimed': False}
        self.assertEqual(after['localLife'], expected)
        result = self.initial_resume(before, after)
        self.assertTrue(result['preserved'])
        self.assertEqual(result['localLifeCatalogueMigration'], 'exact-old-four-to-fresh-first-load')
        self.assertEqual(before, original)

    def test_35_legacy_migration_cannot_hide_missing_unknown_or_changed_old_facts(self):
        before, _ = self.resume_pair(legacy=True)
        after = self.production_tick(before, .1)
        cases = []
        bad = copy.deepcopy(after); bad['localLife']['records'].pop('cosmos-drawing-shelf-v1')
        cases.append(('missing original owner', before, bad))
        bad = copy.deepcopy(after); bad['localLife']['records']['unknown-job'] = {
            'accepted': False, 'choice': None, 'steps': [], 'claimed': False}
        cases.append(('unknown output owner', before, bad))
        bad = copy.deepcopy(after); bad['localLife']['records']['atlantis-bellglass-lamp-v1']['choice'] = 'desk'
        cases.append(('changed original arrangement', before, bad))
        for label, mutate in (
            ('partial old input', lambda w: w['localLife']['records'].pop('cosmos-drawing-shelf-v1')),
            ('unknown old input', lambda w: w['localLife']['records'].update(unknown={
                'accepted': False, 'choice': None, 'steps': [], 'claimed': False}))):
            bad = copy.deepcopy(before); mutate(bad); cases.append((label, bad, after))
        for label, source, output in cases:
            original_source, original_output = copy.deepcopy(source), copy.deepcopy(output)
            with self.subTest(label=label), self.assertRaises(AssertionError):
                self.initial_resume(source, output)
            self.assertEqual(source, original_source)
            self.assertEqual(output, original_output)

    def test_36_legacy_output_must_actually_contain_exact_fresh_fifth_record(self):
        before, _ = self.resume_pair(legacy=True)
        after = self.production_tick(before, .1)
        cases = []
        bad = copy.deepcopy(after); bad['localLife']['records'].pop('earth-first-load-through-v1')
        cases.append(('missing migrated owner', bad))
        for label, value in (
            ('accepted prefix', {'accepted': True, 'choice': 'south-stormfall', 'steps': [], 'claimed': False}),
            ('unaccepted arrival', {'accepted': False, 'choice': None, 'steps': ['arrive-meadow-stop'], 'claimed': False}),
            ('claimed', {'accepted': False, 'choice': None, 'steps': [], 'claimed': True}),
            ('extra record field', {'accepted': False, 'choice': None, 'steps': [], 'claimed': False, 'source': 'invented'})):
            bad = copy.deepcopy(after); bad['localLife']['records']['earth-first-load-through-v1'] = value
            cases.append((label, bad))
        for label, output in cases:
            original = copy.deepcopy(output)
            with self.subTest(label=label), self.assertRaises(AssertionError):
                self.initial_resume(before, output)
            self.assertEqual(output, original)

    def test_37_current_fifth_history_is_preserved_without_a_migration_allowance(self):
        arrivals = ['arrive-meadow-stop', 'arrive-field-return-stop',
            'arrive-field-gate-stop', 'arrive-settlement-approach', 'arrive-merren-receiving-bay']
        for label, steps, claimed in (
            ('loaded', [], False), ('one recorded stop', arrivals[:1], False),
            ('delivered unpaid', arrivals, False), ('paid once', arrivals, True)):
            before, _ = self.resume_pair()
            # Explicit synthetic valid-history boundary, never an earned cohort:
            # the original work must also be structurally complete for Core's
            # source cross-validation to accept the first-load owner.
            before['earthExpedition']['story'] = {'accepted': True,
                'branch': 'stormfall-recovery', 'steps': ['assess-load',
                    'prepare-allocation', 'read-water', 'clear-crossing',
                    'read-root-load', 'clear-root-pests', 'brace-root-channel',
                    'deliver-allocation'], 'claimed': True}
            before['localLife']['records']['earth-first-load-through-v1'] = {
                'accepted': True, 'choice': 'south-stormfall', 'steps': list(steps), 'claimed': claimed}
            original = copy.deepcopy(before)
            after = self.production_tick(before, .1)
            with self.subTest(label=label):
                result = self.initial_resume(before, after)
                self.assertTrue(result['preserved'])
                self.assertIsNone(result['localLifeCatalogueMigration'])
                self.assertEqual(after['localLife'], before['localLife'])
                bad = copy.deepcopy(after)
                bad['localLife']['records']['earth-first-load-through-v1'] = {
                    'accepted': False, 'choice': None, 'steps': [], 'claimed': False}
                with self.assertRaises(AssertionError):
                    self.initial_resume(before, bad)
                self.assertEqual(before, original)

    def test_38_catalogue_migration_is_not_allowed_in_ui_or_normal_live_ticks(self):
        before, _ = self.resume_pair(legacy=True)
        after = copy.deepcopy(before)
        after['localLife']['records']['earth-first-load-through-v1'] = {
            'accepted': False, 'choice': None, 'steps': [], 'claimed': False}
        self.assertNotEqual(self.m.living_signature(before), self.m.living_signature(after))
        with self.assertRaises(AssertionError):
            self.m.require_projection_preserved(before, after)
        before = after; after = copy.deepcopy(before)
        after['localLife']['records']['earth-first-load-through-v1'] = {
            'accepted': True, 'choice': 'south-stormfall', 'steps': ['arrive-meadow-stop'], 'claimed': False}
        self.assertNotEqual(self.m.living_signature(before), self.m.living_signature(after))
        with self.assertRaises(AssertionError):
            self.m.require_projection_preserved(before, after)

    def capture_actual_resume(self, before, ticks=None, fault=None):
        """Labelled JS frame/owner host; genuine installed Core executes ticks.

        This does not launch browser/native frames, load personal storage, or
        create gameplay facts. The capture source is the actual new driver JS.
        """
        code = r"""const fs=require('node:fs'),C=require('./src/core.js');require('./src/combat.js');
const q=JSON.parse(fs.readFileSync(0,'utf8'));global.window=globalThis;
let active='character-2',sim=new C.Simulation(C.fresh());
global.Realm={test:{worldContext:()=>({sim,active})},get diagnostics(){throw Error('CPU telemetry must not consult broad mutable diagnostics.');}};
const original=C.Simulation.prototype.tick,capture=eval('('+q.source+')');
const armed=capture('character-1');
// One real outgoing-owner tick is deliberately outside the incoming trace.
sim.tick(.016);active='character-1';sim=new C.Simulation(q.before,{hydrated:true});
const incoming=sim;
for(const [i,t]of q.ticks.entries()){
 sim.paused=t.paused;sim.tick(t.dt);
 if(q.fault==='owner'&&i===1){active='character-2';sim=new C.Simulation(C.fresh());}
}
if(q.fault==='prototype')C.Simulation.prototype.tick=function(){throw Error('CPU foreign tick tamper');};
if(q.fault==='scene')incoming.room='CPU-labelled-foreign-scene';
const trace=window.__onboardingResumeTrace.finish();
if(q.fault==='lateTick'){incoming.paused=false;incoming.tick(.05);}
const crypto=require('node:crypto'),path=require('node:path'),base=path.resolve('src')+path.sep;
const runtimeSources=Object.keys(require.cache).filter(p=>p.startsWith(base)).map(p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};});
console.log(JSON.stringify({trace,after:incoming.snapshot(),armed,runtimeSources,
 restored:C.Simulation.prototype.tick===original,removed:!Object.hasOwn(window,'__onboardingResumeTrace')}));"""
        ticks = ticks if ticks is not None else [
            {'dt': .1, 'paused': True}, {'dt': .1, 'paused': False},
            {'dt': .0334, 'paused': False}, {'dt': .1, 'paused': True}]
        result = subprocess.run(['node', '-e', code], cwd=self.m.resolve_root(),
            input=json.dumps({'before': before, 'source': self.m.RESUME_CAPTURE_JS,
                             'ticks': ticks, 'fault': fault}),
            capture_output=True, text=True, check=True, timeout=20)
        got = json.loads(result.stdout)
        owned = getattr(self.m, '_resume_cpu_runtime_sources', {})
        for entry in got['runtimeSources']:
            if entry['path'] in owned:
                self.assertEqual(owned[entry['path']], entry)
            owned[entry['path']] = entry
        self.m._resume_cpu_runtime_sources = owned
        return got

    def test_39_first_tick_oracle_still_rejects_later_native_style_snapshot(self):
        before, _ = self.resume_pair()
        got = self.capture_actual_resume(before)
        self.assertEqual(got['trace']['firstIndex'], 1)
        self.assertNotEqual(got['trace']['first']['hour'], got['after']['hour'])
        self.assertEqual(got['after']['journal'], got['trace']['first']['journal'])
        with self.assertRaisesRegex(AssertionError, 'one actual clamped tick'):
            self.initial_resume(before, got['after'])
        self.assertTrue(self.initial_resume(before, got['trace']['first'])['preserved'])

    def test_40_actual_capture_and_exact_core_sequence_preserve_complete_final_world(self):
        before, _ = self.resume_pair()
        original = copy.deepcopy(before); got = self.capture_actual_resume(before)
        self.assertTrue(got['restored']); self.assertTrue(got['removed'])
        self.assertEqual(got['trace']['activeSeconds'], .13340000000000002)
        self.assertEqual(got['trace']['ticks'][0]['beforeElapsed'], 0)
        result = self.m.require_resume_sequence(self.m.resolve_root(), before,
                    got['after'], got['trace'], 'character-1')
        self.assertTrue(result['preserved']); self.assertEqual(result['ticks'], 4)
        self.assertEqual(result['clockTolerance'], 0)
        self.assertFalse(result['additionalFutureEventsAllowed'])
        self.assertEqual(before, original)
        camera = copy.deepcopy(got['after'])
        camera['settings']['cameraViews']['profiles'] = {}
        trace = copy.deepcopy(got['trace']); trace['final'] = camera
        self.assertTrue(self.m.require_resume_sequence(self.m.resolve_root(), before, camera, trace, 'character-1')['preserved'])

    def test_41_resume_sequence_rejects_protected_history_equipment_xp_and_socket_changes(self):
        before, _ = self.resume_pair(); got = self.capture_actual_resume(before)
        for name, mutate in (
            ('old history', lambda w: w['journal'][0].update(text='forged old event')),
            ('XP', lambda w: w['adventure'].update(xp=w['adventure']['xp']+1)),
            ('equipment', lambda w: w['adventure']['equipment'].update(weapon='old_sword')),
            ('socket identity', lambda w: w['adventure']['arsenal']['sockets'].update(trail_blade='amber')),
            ('paid fifth history', lambda w: w['localLife']['records']['earth-first-load-through-v1'].update(claimed=True))):
            after = copy.deepcopy(got['after']); mutate(after)
            trace = copy.deepcopy(got['trace']); trace['final'] = after
            with self.subTest(name=name), self.assertRaises(AssertionError):
                self.m.require_resume_sequence(self.m.resolve_root(), before, after, trace, 'character-1')

    def test_42_resume_sequence_rejects_future_ticks_clocks_and_forged_initial_capture(self):
        before, _ = self.resume_pair(); got = self.capture_actual_resume(before)
        late = self.capture_actual_resume(before, fault='lateTick')
        self.assertGreater(late['after']['hour'], late['trace']['final']['hour'])
        for name in ('changed dt', 'unrecorded future tick', 'forged clock', 'forged first', 'first index', 'pause flag'):
            trace = copy.deepcopy(got['trace']); after = copy.deepcopy(got['after'])
            if name == 'changed dt':
                trace['ticks'][2]['dt'] = .04; trace['activeSeconds'] = .14
            elif name == 'unrecorded future tick':
                after = copy.deepcopy(late['after'])
            elif name == 'forged clock':
                after['hour'] += .0000001
            elif name == 'forged first':
                trace['first']['residents'][0]['x'] += .0001
            elif name == 'first index':
                trace['firstIndex'] = 2
            else:
                trace['ticks'][2]['paused'] = True; trace['activeSeconds'] = .1
            trace['final'] = after
            with self.subTest(name=name), self.assertRaises(AssertionError):
                self.m.require_resume_sequence(self.m.resolve_root(), before, after, trace, 'character-1')

    def test_43_resume_capture_rejects_actual_owner_change_and_prototype_tamper(self):
        before, _ = self.resume_pair()
        for fault in ('owner', 'prototype', 'scene'):
            got = self.capture_actual_resume(before, fault=fault)
            self.assertIsNotNone(got['trace']['error'])
            self.assertTrue(got['removed'])
            self.assertEqual(got['restored'], fault != 'prototype')
            with self.subTest(fault=fault), self.assertRaises(AssertionError):
                self.m.require_resume_sequence(self.m.resolve_root(), before, got['after'], got['trace'], 'character-1')
        got = self.capture_actual_resume(before)
        for key, value in (('owner', 'character-2'), ('finalOwner', 'character-2'), ('restored', False), ('error', 'tampered capture')):
            trace = copy.deepcopy(got['trace']); trace[key] = value
            with self.subTest(key=key), self.assertRaises(AssertionError):
                self.m.require_resume_sequence(self.m.resolve_root(), before, got['after'], trace, 'character-1')

    def test_44_resume_capture_keeps_finite_tick_and_active_time_bounds(self):
        before, _ = self.resume_pair()
        for name, ticks in (('tick count', [{'dt': .001, 'paused': False}] * 33),
                            ('active seconds', [{'dt': .1, 'paused': False}] * 17),
                            ('oversized dt', [{'dt': .2, 'paused': False}])):
            got = self.capture_actual_resume(before, ticks=ticks)
            self.assertIsNotNone(got['trace']['error']); self.assertTrue(got['restored'])
            self.assertLessEqual(len(got['trace']['ticks']), 32)
            with self.subTest(name=name), self.assertRaises(AssertionError):
                self.m.require_resume_sequence(self.m.resolve_root(), before, got['after'], got['trace'], 'character-1')

    def literal_current_output(self, world):
        result = copy.deepcopy(world)
        self.assertEqual(result['adventure']['version'], 12)
        self.assertNotIn('earthMasterwork', result['adventure'])
        result['adventure']['version'] = 14
        result['adventure']['earthTournament'] = {'version':1,'issued':0,'closed':0,'best':{'blade':None,'bow':None},'finished':{'blade':0,'bow':0}}
        result['adventure']['earthMasterwork'] = {'version': 1, 'accepted': False,
            'evidence': [], 'compared': False, 'participation': None,
            'resolution': None, 'weapon': None, 'enabled': False}
        return result

    def current_resume_capture(self):
        fixture = json.loads((HERE / 'fixtures/onboarding-hydrated-resume-capture.json').read_text(encoding='utf8'))
        self.assertEqual(fixture['sourceReport']['sha256'], '3527cd630b8bfefe3a37ef541fc8033392dcc2c80742b7469aed05ae6d957402')
        self.assertEqual(fixture['sourceHead'], '3aa1e0a440a465644410c3942f4277f755c6013a')
        self.assertIn('synthetic-owned native', fixture['scope'])
        # Current CPU boundary copies of retained historical observations. These
        # add only the independently specified empty owner; the old native bytes
        # and their source receipt remain historical and are never rewritten.
        for world in (fixture['before'], fixture['after'], fixture['capture']['first'], fixture['capture']['final']):
            self.assertNotIn('briarMoments', world)
            world['briarMoments'] = {'version': 1, 'revision': 0, 'moments': []}
        # Output-only Adventure14 derivative: exact literal empty commission and tournament.
        # This is CPU migration evidence, never a new native observation.
        fixture['after'] = self.literal_current_output(fixture['after'])
        for key in ('first', 'final'):
            fixture['capture'][key] = self.literal_current_output(fixture['capture'][key])
        return fixture['before'], fixture['after'], fixture['capture']

    def test_45_labelled_migration_derivative_of_hydrated_capture_matches_exact_sequence(self):
        before, after, capture = self.current_resume_capture()
        originals = copy.deepcopy((before, after, capture))
        initial = self.m.require_initial_resume(self.m.resolve_root(), before, capture['first'], capture, capture['owner'])
        result = self.m.require_resume_sequence(self.m.resolve_root(), before, after, capture, capture['owner'])
        self.assertTrue(initial['preserved']); self.assertEqual(initial['events'], [])
        self.assertEqual(initial['nextEventBefore'], initial['nextEventAfter'])
        self.assertTrue(result['preserved']); self.assertEqual(result['clockTolerance'], 0)
        self.assertEqual(result['ticks'], 3); self.assertEqual((before, after, capture), originals)

    def test_46_exact_capture_rejects_changed_dropped_reordered_or_extra_history(self):
        before, after, capture = self.current_resume_capture()
        for label in ('changed', 'dropped', 'reordered', 'extra', 'nextEvent'):
            changed = copy.deepcopy(after); trace = copy.deepcopy(capture)
            if label == 'changed': changed['journal'][0]['text'] += ' forged'
            elif label == 'dropped': changed['journal'].pop(0)
            elif label == 'reordered': changed['journal'][:2] = reversed(changed['journal'][:2])
            elif label == 'extra':
                event = copy.deepcopy(changed['journal'][-1]); event['seq'] = changed['nextEvent']; changed['nextEvent'] += 1; changed['journal'].append(event)
            else: changed['nextEvent'] += 1
            trace['final'] = changed
            with self.subTest(label=label), self.assertRaises(AssertionError):
                self.m.require_resume_sequence(self.m.resolve_root(), before, changed, trace, capture['owner'])

    def test_47_exact_capture_rejects_clock_reward_migration_and_tick_forgery(self):
        before, after, capture = self.current_resume_capture()
        for label in ('hour', 'day', 'adventure clock', 'sandbox clock', 'XP', 'coins', 'migration', 'tournament', 'dt', 'paused', 'dropped tick', 'elapsed'):
            changed = copy.deepcopy(after); trace = copy.deepcopy(capture)
            if label == 'hour': changed['hour'] += .000001
            elif label == 'day': changed['day'] += 1
            elif label == 'adventure clock': changed['adventure']['elapsed'] += .000001
            elif label == 'sandbox clock': changed['sandbox']['elapsed'] += .000001
            elif label == 'XP': changed['adventure']['xp'] += 1
            elif label == 'coins': changed['adventure']['coins'] += 1
            elif label == 'migration': changed['localLife']['records']['earth-first-load-through-v1']['accepted'] = True
            elif label == 'tournament': changed['adventure']['earthTournament'].update(issued=1,closed=1,best={'blade':6,'bow':None},finished={'blade':1,'bow':0})
            elif label == 'dt': trace['ticks'][1]['dt'] = .09; trace['activeSeconds'] -= .01
            elif label == 'paused': trace['ticks'][1]['paused'] = True; trace['activeSeconds'] -= .1
            elif label == 'dropped tick': trace['ticks'].pop(); trace['activeSeconds'] = sum(t['dt'] for t in trace['ticks'] if not t['paused'])
            else: trace['ticks'][1]['afterElapsed'] += .000001
            trace['final'] = changed
            with self.subTest(label=label), self.assertRaises(AssertionError):
                self.m.require_resume_sequence(self.m.resolve_root(), before, changed, trace, capture['owner'])


    def test_48_initial_oracle_rejects_unrecorded_small_offset_and_tick_owner_faults(self):
        before, after, capture = self.current_resume_capture()
        for label in ('small hour offset', 'adventure offset', 'sandbox offset', 'owner', 'index', 'first paused', 'first dt'):
            trace = copy.deepcopy(capture)
            if label == 'small hour offset': trace['first']['hour'] += .0000001
            elif label == 'adventure offset': trace['first']['adventure']['elapsed'] += .0000001
            elif label == 'sandbox offset': trace['first']['sandbox']['elapsed'] += .0000001
            elif label == 'owner': trace['owner'] = 'character-2'
            elif label == 'index': trace['firstIndex'] = 1
            elif label == 'first paused': trace['ticks'][0]['paused'] = True; trace['activeSeconds'] -= trace['ticks'][0]['dt']
            else: trace['ticks'][0]['dt'] += .0000001; trace['activeSeconds'] += .0000001
            with self.subTest(label=label), self.assertRaises(AssertionError):
                self.m.require_initial_resume(self.m.resolve_root(), before, trace['first'], trace, capture['owner'])

    def test_original_schema12_capture_cannot_be_presented_as_current_native_output(self):
        fixture = json.loads((HERE / 'fixtures/onboarding-hydrated-resume-capture.json').read_text(encoding='utf8'))
        original = copy.deepcopy(fixture)
        trace = fixture['capture']
        with self.assertRaises(AssertionError):
            self.m.require_initial_resume(self.m.resolve_root(), fixture['before'], trace['first'], trace, trace['owner'])
        self.assertEqual(fixture, original)

    def test_masterwork_migration_allows_only_literal_empty_record_and_exact_old_owners(self):
        before, after = self.resume_pair()
        self.assertEqual(before['adventure']['version'], 12)
        self.assertNotIn('earthMasterwork', before['adventure'])
        expected = {'version': 1, 'accepted': False, 'evidence': [],
            'compared': False, 'participation': None, 'resolution': None,
            'weapon': None, 'enabled': False}
        self.assertEqual(after['adventure']['earthMasterwork'], expected)
        self.assertEqual(self.initial_resume(before, after)['earthMasterworkMigration'],
                         'adventure12-to13-empty-masterwork1')
        for defect in ('missing', 'accepted', 'enabled', 'unknown', 'old-version', 'xp'):
            bad = copy.deepcopy(after)
            if defect == 'missing': bad['adventure'].pop('earthMasterwork')
            elif defect == 'old-version': bad['adventure']['version'] = 12
            elif defect == 'xp': bad['adventure']['xp'] += 1
            else: bad['adventure']['earthMasterwork'][defect] = True
            with self.subTest(defect=defect), self.assertRaises(AssertionError):
                self.initial_resume(before, bad)
        current = copy.deepcopy(after)
        next_world = self.production_tick(current, .1)
        self.assertIsNone(self.initial_resume(current, next_world)['earthMasterworkMigration'])
        present = copy.deepcopy(before)
        present['adventure']['earthMasterwork'] = copy.deepcopy(expected)
        present['adventure']['earthMasterwork']['accepted'] = True
        loaded = self.production_tick(present, .1)
        self.assertEqual(self.initial_resume(present, loaded)['earthMasterworkMigration'],
                         'adventure12-to13-preserved-masterwork1')
        bad = copy.deepcopy(loaded); bad['adventure']['earthMasterwork'] = expected
        with self.assertRaises(AssertionError): self.initial_resume(present, bad)

if __name__ == '__main__':
    unittest.main(verbosity=2)
