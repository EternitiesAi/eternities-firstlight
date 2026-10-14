"""CPU verifier transport checks; no source gameplay or browser is executed."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('browser_budget_verifier', ROOT / 'tools/verify.py')
V = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(V)

# Independent expected membership: six direct native controllers, four campaign
# callers and the complete forty-two-suite loop, plus masterwork, tournament and Gate Captain.
# All three two-family gates are native controllers, not CPU preflights.
NATIVE_SUITES = frozenset('''gate_captain_browser tournament_browser masterwork_browser earth_homecoming_browser onboarding_browser
earth_consignment_browser earth_wild_signs_browser earth_wild_signs_boundaries_browser
road_account_browser cosmos_campaign_browser atlantis_campaign_browser
heaven_campaign_browser hell_campaign_browser earth_road_browser
bridge_community_browser home_history_browser local_life_browser
earth_ground_material_browser realm_givers_browser crossing_browser
regression09_browser cutaway_browser reflection_browser native_origin_browser
starter_browser camera_browser pursuit_browser characters_browser classes_browser
cosmos_browser earth_browser earth_story_browser earth_notes_browser gathering_browser
realm_atlas_browser timber_browser traveler_browser bridge_browser combat_cue_browser
world_foundations_browser world_cutaway_browser realm_trails_browser
realm_trails_north_browser realm_trails_cosmos_browser soundscape_browser
journey_usability_browser workshop_transactions_browser companion_presentation_browser
skitter_presentation_browser coastward_scenery_browser earth_story_transactions_browser
coastward_bridge_posts_browser practice_visibility_browser realm_work_presentation_browser
earth_expedition_browser'''.split())


class BrowserBudgetVerifier(unittest.TestCase):
    def storage_args(self, base, **overrides):
        args = dict(output=base / 'logs', browser_output=None,
                    browser_output_mode='supported', browser_temp=base)
        args.update(overrides)
        return SimpleNamespace(**args)

    def test_wrapper_preserves_literal_target_arguments_and_separate_admission_output(self):
        root = Path('D:/synthetic game')
        logs, temp = root / 'fresh logs', root / 'existing temp'
        original = [V.sys.executable, 'tests/reflection_browser.py', '--literal', 'a b;$(token)']
        command = V.browser_budget_run_spec(root, original, 'reflection_browser', logs, temp)
        self.assertEqual(command, [V.sys.executable, str(root / 'tools/browser_budget.py'),
            '--root', str(root), '--output', str(logs / 'browser-admission/reflection_browser'),
            '--temp-dir', str(temp), '--', *original[1:]])
        self.assertEqual(original[-1], 'a b;$(token)')

    def test_wrapper_refuses_cpu_commands_and_other_interpreters(self):
        for name, command in [('rules', ['node', '--test']),
                ('road-account-current-preflight', [V.sys.executable, 'tools/test_road_account_browser.py']),
                ('onboarding_browser', ['other-python', 'tools/onboarding_browser.py']),
                ('onboarding_browser', [])]:
            with self.subTest(name=name, command=command), self.assertRaises(ValueError):
                V.browser_budget_run_spec(ROOT, command, name, ROOT / 'logs', ROOT / 'temp')

    def test_default_storage_reserves_logs_and_nested_evidence_once(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-verify-browser-storage-') as tmp:
            base = Path(tmp).resolve()
            logs, evidence, temp = V.configure_browser_storage(self.storage_args(base), windows=False)
            self.assertEqual((logs, evidence, temp), (base / 'logs', base / 'logs/browser', base))
            self.assertTrue(logs.is_dir()); self.assertTrue(evidence.is_dir())
            sentinel = logs / 'prior.log'; sentinel.write_bytes(b'prior observation')
            with self.assertRaises((ValueError, FileExistsError)):
                V.configure_browser_storage(self.storage_args(base), windows=False)
            self.assertEqual(sentinel.read_bytes(), b'prior observation')

    def test_existing_evidence_refuses_before_creating_new_logs(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-verify-browser-refusal-') as tmp:
            base = Path(tmp).resolve(); evidence = base / 'evidence'; evidence.mkdir()
            sentinel = evidence / 'REPORT.json'; sentinel.write_bytes(b'prior evidence')
            with self.assertRaises((ValueError, FileExistsError)):
                V.configure_browser_storage(self.storage_args(base, browser_output=evidence), windows=False)
            self.assertFalse((base / 'logs').exists())
            self.assertEqual(sentinel.read_bytes(), b'prior evidence')

    def test_conflicting_roots_and_invalid_temp_refuse_without_reservation(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-verify-browser-validation-') as tmp:
            base = Path(tmp).resolve(); logs = base / 'logs'
            invalid = [dict(browser_output=logs), dict(browser_output=base / 'new-parent', output=base / 'new-parent/logs'),
                dict(browser_output=logs / 'browser-admission'),
                dict(browser_output=logs / 'browser-admission/nested'),
                dict(browser_temp=Path('relative')), dict(browser_temp=base / 'missing'),
                dict(browser_temp=Path(base.anchor)), dict(browser_output=Path(base.anchor)),
                dict(output=Path(base.anchor)), dict(browser_output_mode='guarded')]
            for overrides in invalid:
                with self.subTest(overrides=overrides), self.assertRaises((ValueError, FileExistsError)):
                    V.configure_browser_storage(self.storage_args(base, **overrides), windows=False)
                self.assertEqual(list(base.iterdir()), [])

    def test_windows_non_d_storage_refuses_before_any_write(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-verify-browser-drive-') as tmp:
            base = Path(tmp).resolve()
            with self.assertRaisesRegex(ValueError, 'D: on Windows'):
                V.configure_browser_storage(self.storage_args(base), windows=True)
            self.assertEqual(list(base.iterdir()), [])

    def test_atomic_log_reservation_refuses_a_directory_created_during_setup(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-verify-browser-race-') as tmp:
            base = Path(tmp).resolve(); logs = base / 'logs'; original = Path.mkdir
            def raced_mkdir(path, *args, **kwargs):
                if path == logs:
                    original(logs); (logs / 'sentinel').write_bytes(b'concurrent prior record')
                return original(path, *args, **kwargs)
            with patch.object(Path, 'mkdir', raced_mkdir), self.assertRaises(FileExistsError):
                V.configure_browser_storage(self.storage_args(base), windows=False)
            self.assertEqual((logs / 'sentinel').read_bytes(), b'concurrent prior record')
            self.assertFalse((logs / 'browser').exists())

    def dispatch(self, *, browser=True, refusal=None):
        # Run the real parser, suite discovery, run(), routing and failure path.
        # External transport and earned-source validators are explicit sinks;
        # the tiny source receipt below declares no gameplay qualification.
        with tempfile.TemporaryDirectory(prefix='firstlight-verify-browser-dispatch-') as tmp:
            base = Path(tmp).resolve(); root = base / 'synthetic-root'; root.mkdir()
            (root / 'src').mkdir(); (root / 'tests').mkdir()
            (root / 'src/token.js').write_text('// synthetic discovery token')
            (root / 'tests/token.test.cjs').write_text('// synthetic discovery token')
            for leaf in ('FIRSTLIGHT_VALLEY.html', 'index.html'):
                (root / leaf).write_bytes(b'synthetic equal pages')
            logs, temp = base / 'logs', base / 'temp'; temp.mkdir(); calls = []
            args = ['verify.py', '--output', str(logs)]
            if browser: args += ['--browser', '--browser-temp', str(temp)]
            def transport(command, **kwargs):
                calls.append((command, kwargs))
                kwargs['stdout'].write(b'synthetic transport: no command executed\n')
                if command[1:2] == ['tools/earth_homecoming_journey.cjs']:
                    cohort = Path(command[command.index('--output') + 1])
                    cohort.mkdir(parents=True)
                    (cohort / 'CONNECTED_EARTH_HOMECOMING_REPORT.json').write_bytes(b'{"scope":"synthetic"}')
                if refusal and len(command) > 1 and command[1] == str(root / 'tools/browser_budget.py'):
                    if refusal == 'timeout': raise subprocess.TimeoutExpired(command, kwargs['timeout'])
                    return SimpleNamespace(returncode=3)
                return SimpleNamespace(returncode=0)
            def native_spec(suite):
                return lambda *a: ([V.sys.executable, f'tools/{suite}.py', '--literal', 'same input'], {})
            def road_spec(*a):
                return ([V.sys.executable, 'tools/prepare_road_account_native_inputs.py'],
                    [V.sys.executable, 'tools/test_road_account_browser.py'],
                    [V.sys.executable, 'tools/road_account_browser.py', '--execute'],
                    {'ROAD_ACCOUNT_CPU_OUTPUT': str(base / 'road-cpu')})
            with contextlib.ExitStack() as stack:
                for owner, attribute, replacement in [
                        (V, 'ROOT', root), (V.sys, 'argv', args),
                        (V, 'os', SimpleNamespace(name='posix', environ=os.environ)),
                        (V.shutil, 'which', lambda *a: 'node'),
                        (V.subprocess, 'check_output', lambda *a, **k: 'v24.18.0'),
                        (V.subprocess, 'run', transport),
                        (V, 'prepare_browser_sources', lambda *a: None),
                        (V, 'road_account_browser_run_specs', road_spec)]:
                    stack.enter_context(patch.object(owner, attribute, replacement))
                for function, suite in [('earth_homecoming_browser_run_spec', 'earth_homecoming_browser'),
                        ('onboarding_browser_run_spec', 'onboarding_browser'),
                        ('consignment_browser_run_spec', 'earth_consignment_browser'),
                        ('wild_signs_browser_run_spec', 'earth_wild_signs_browser'),
                        ('wild_signs_boundaries_browser_run_spec', 'earth_wild_signs_boundaries_browser')]:
                    stack.enter_context(patch.object(V, function, native_spec(suite)))
                stack.enter_context(contextlib.redirect_stdout(io.StringIO()))
                stack.enter_context(contextlib.redirect_stderr(io.StringIO()))
                if refusal:
                    with self.assertRaises(SystemExit): V.main()
                else: V.main()
            return calls, root, logs, temp

    def test_actual_main_wraps_all_55_native_suites_and_no_cpu_or_preflight_calls(self):
        calls, root, logs, temp = self.dispatch()
        wrapped = [(c, k) for c, k in calls if c[1:2] == [str(root / 'tools/browser_budget.py')]]
        self.assertEqual(len(wrapped), 55)
        suites = [Path(c[c.index('--') + 1]).stem for c, _ in wrapped]
        self.assertEqual(len(suites), len(set(suites))); self.assertEqual(set(suites), NATIVE_SUITES)
        for command, kwargs in wrapped:
            suite = Path(command[command.index('--') + 1]).stem
            self.assertEqual(command[command.index('--root') + 1], str(root))
            self.assertEqual(command[command.index('--output') + 1], str(logs / 'browser-admission' / suite))
            self.assertEqual(command[command.index('--temp-dir') + 1], str(temp))
            if suite in ('masterwork_browser', 'tournament_browser', 'gate_captain_browser'):
                self.assertEqual(command[command.index('--') + 1:], ['tools/'+suite+'.py', '--both', '--output', str(logs / 'browser' / suite)])
            expected = {'earth_homecoming_browser': 1800, 'earth_consignment_browser': 7200,
                'earth_wild_signs_browser': 1800, 'earth_wild_signs_boundaries_browser': 1800,
                'road_account_browser': 3700}
            expected.update({s: 1200 for s in ['cosmos_campaign_browser', 'atlantis_campaign_browser',
                'heaven_campaign_browser', 'hell_campaign_browser', 'realm_givers_browser', 'local_life_browser']})
            self.assertEqual(kwargs['timeout'], expected.get(suite, 600))
        cpu = [(c, k) for c, k in calls if c[1:2] != [str(root / 'tools/browser_budget.py')]]
        python = [(c, k) for c, k in cpu if c[0] == V.sys.executable]
        self.assertTrue(any('unittest' in c for c, _ in python))
        for leaf in ['tools/test_road_account_browser.py', 'tools/prepare_road_account_native_inputs.py',
                'tests/test_earth_consignment_browser.py', 'tests/test_earth_wild_signs_browser.py',
                'tests/test_earth_homecoming_native.py', 'tests/test_capture_earth_homecoming.py']:
            self.assertTrue(any(c[1:2] == [leaf] for c, _ in python), leaf)
        self.assertTrue(any(c[0] == 'node' for c, _ in cpu))
        self.assertFalse(any(Path(c[1]).stem in NATIVE_SUITES for c, _ in cpu if len(c) > 1))

    def test_source_only_main_never_dispatches_budget_runner(self):
        calls, root, _, _ = self.dispatch(browser=False)
        self.assertFalse(any(c[1:2] == [str(root / 'tools/browser_budget.py')] for c, _ in calls))
        self.assertFalse(any(Path(c[1]).stem in NATIVE_SUITES for c, _ in calls if len(c) > 1))

    def test_guard_refusal_and_timeout_stop_before_later_native_suites(self):
        for refusal in ('nonzero', 'timeout'):
            with self.subTest(refusal=refusal):
                calls, root, _, _ = self.dispatch(refusal=refusal)
                wrapped = [c for c, _ in calls if c[1:2] == [str(root / 'tools/browser_budget.py')]]
                self.assertEqual(len(wrapped), 1)
                self.assertEqual(Path(wrapped[0][wrapped[0].index('--') + 1]).stem, 'gate_captain_browser')
                self.assertIn('--both', wrapped[0])


if __name__ == '__main__':
    unittest.main(verbosity=2)
