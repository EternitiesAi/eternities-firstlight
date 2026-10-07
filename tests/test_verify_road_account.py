"""CPU routing admission with labelled synthetic receipts; no browser launches."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('road_account_verify', ROOT / 'tools/verify.py')
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)
HEAD = 'a' * 40


class Routing(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='road-account-routing-', dir=os.environ.get('TEMP'))
        self.base = Path(self.temp.name)
        self.root, self.primary, self.boundary, self.out = [self.base / n for n in ('game', 'primary', 'boundary', 'aftermath')]
        (self.root / 'tools').mkdir(parents=True)
        self.primary.mkdir(); self.boundary.mkdir()
        for name in ('index.html', 'FIRSTLIGHT_VALLEY.html'):
            (self.root / name).write_bytes(b'Synthetic routing-only matching page\n')
        self.reports = []
        for folder, report, caller, cases in (
                (self.primary, 'WILD_SIGNS_NATIVE_REPORT.json', 'earth_wild_signs_browser.py',
                 ['blade-signed-loop', 'bow-cleared-pocket', 'veteran-signed-loop']),
                (self.boundary, 'WILD_SIGNS_BOUNDARIES_REPORT.json', 'earth_wild_signs_boundaries_browser.py',
                 ['ready-observe-switch-import', 'genuine-death-clearance-switch', 'SYNTHETIC-fiber999-signed-capacity-retry'])):
            helper = self.root / 'tools' / caller
            helper.write_bytes(b'CPU routing-only caller identity\n')
            value = dict(status='passed', head=HEAD, html_sha256=self.sha(self.root / 'index.html'),
                         harnessSha256=self.sha(helper), serverClosed=True,
                         execution='ordinary-RAF/original-native-input', errors=[], browserErrors=[], externalRequests=[],
                         admittedInputs={str(helper): self.sha(helper)},
                         cases={c: dict(contextClosed=True, checks=[dict(passed=True, name='synthetic routing assertion')]) for c in cases})
            file = folder / report
            self.put(file, value); self.reports.append(file)
        self.git = patch.object(V.subprocess, 'check_output', return_value=HEAD + '\n')
        self.git.start()
        self.addCleanup(self.git.stop); self.addCleanup(self.temp.cleanup)

    @staticmethod
    def sha(file):
        return hashlib.sha256(file.read_bytes()).hexdigest()

    @staticmethod
    def put(file, value):
        file.write_text(json.dumps(value), encoding='utf-8')

    def run_spec(self, output=None, **kwargs):
        return V.road_account_browser_run_specs(self.root, self.primary, self.boundary,
                                               output or self.out, windows=kwargs.pop('windows', False), **kwargs)

    def test_exact_current_closed_gates_transport_all_three_commands_without_writes(self):
        before = {p: self.sha(p) for p in self.base.rglob('*') if p.is_file()}
        prepare, cpu, native, env = self.run_spec()
        self.assertEqual(prepare[1], 'tools/prepare_road_account_inputs.py')
        self.assertEqual(cpu[1], 'tools/test_road_account_browser.py')
        self.assertEqual(native[1], 'tools/road_account_browser.py')
        self.assertEqual(native[-3:], ['--renderer', 'software', '--execute'])
        self.assertEqual(native[native.index('--expected-head') + 1], HEAD)
        self.assertEqual(prepare[prepare.index('--report') + 1], str(self.reports[0]))
        self.assertEqual(env['ROAD_ACCOUNT_NATIVE_INPUTS'], str(self.base / 'aftermath-inputs.json'))
        self.assertEqual(env['ROAD_ACCOUNT_CPU_OUTPUT'], str(self.base / 'aftermath-cpu'))
        self.assertEqual(before, {p: self.sha(p) for p in self.base.rglob('*') if p.is_file()})
        self.assertFalse(self.out.exists())

    def test_each_unclosed_failed_historical_or_error_report_refuses_before_output(self):
        for file in self.reports:
            original = json.loads(file.read_text())
            for key, value in [('status', 'running'), ('head', 'b' * 40), ('html_sha256', '0' * 64),
                               ('serverClosed', False), ('errors', ['failure']), ('browserErrors', ['failure']),
                               ('externalRequests', ['request']), ('execution', 'synthetic-frame'),
                               ('harnessSha256', '0' * 64)]:
                with self.subTest(file=file.name, field=key):
                    self.put(file, {**original, key: value})
                    with self.assertRaises(ValueError): self.run_spec()
                    self.assertFalse(self.out.exists())
            self.put(file, original)

    def test_missing_case_failed_check_or_unclosed_context_is_required(self):
        file = self.reports[1]; original = json.loads(file.read_text())
        for mutate in (lambda v: v['cases'].pop(next(iter(v['cases']))),
                       lambda v: v['cases'][next(iter(v['cases']))].update(contextClosed=False),
                       lambda v: v['cases'][next(iter(v['cases']))].update(checks=[]),
                       lambda v: v['cases'][next(iter(v['cases']))]['checks'][0].update(passed=False)):
            value = copy.deepcopy(original); mutate(value); self.put(file, value)
            with self.assertRaises(ValueError): self.run_spec()
            self.assertFalse(self.out.exists())

    def test_current_pinned_bytes_drift_or_missing_membership_refuses(self):
        file = self.reports[0]; original = json.loads(file.read_text())
        for pins in ({}, {'relative.py': '0' * 64}, {str(self.root / 'missing.py'): '0' * 64},
                     {str(self.root / 'tools/earth_wild_signs_browser.py'): '0' * 64}):
            self.put(file, {**original, 'admittedInputs': pins})
            with self.assertRaises(ValueError): self.run_spec()
            self.assertFalse(self.out.exists())

    def test_new_output_cannot_overwrite_game_input_or_prior_evidence(self):
        for output in (self.root / 'new', self.primary / 'new', self.boundary / 'new', self.base):
            with self.assertRaises(ValueError): self.run_spec(output)
        self.out.mkdir(); marker = self.out / 'old-report.json'; marker.write_bytes(b'retain')
        with self.assertRaises(ValueError): self.run_spec()
        self.assertEqual(marker.read_bytes(), b'retain')

    def test_manifest_and_cpu_derivatives_cannot_be_reused(self):
        for target in (self.base / 'aftermath-inputs.json', self.base / 'aftermath-cpu'):
            target.write_bytes(b'retain')
            with self.assertRaises(ValueError): self.run_spec()
            self.assertEqual(target.read_bytes(), b'retain')

    def test_both_installed_pages_must_match_current_native_report(self):
        (self.root / 'index.html').write_bytes(b'drift')
        with self.assertRaises(ValueError): self.run_spec()

    def test_windows_non_d_evidence_refuses_without_creation(self):
        # This suite itself deliberately uses D TEMP on the development host.
        # An explicit C candidate tests the refusal rather than rejecting D.
        candidate = Path('C:/firstlight-routing-no-create') / self.base.name / 'native'
        with self.assertRaisesRegex(ValueError, 'D: on Windows'):
            self.run_spec(candidate, windows=True)
        self.assertFalse(candidate.exists()); self.assertFalse(self.out.exists())


if __name__ == '__main__':
    unittest.main()
