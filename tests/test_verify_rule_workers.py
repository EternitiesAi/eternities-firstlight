"""Actual verifier dispatch with tiny, explicitly synthetic transport inputs."""
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
VERIFY = ROOT / 'tools/verify.py'
spec = importlib.util.spec_from_file_location('actual_rule_worker_verifier', VERIFY)
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)


class RuleWorkers(unittest.TestCase):
    def dispatch(self, workers=None, outcome='success'):
        # Real parser, discovery, run(), log writes and failure handling; only
        # external subprocess transport is replaced. No gameplay is admitted.
        with tempfile.TemporaryDirectory(prefix='firstlight-rule-workers-') as name:
            base = Path(name); root = base / 'synthetic-root'; root.mkdir()
            (root / 'src').mkdir(); (root / 'tests').mkdir()
            (root / 'src/token.js').write_text('// synthetic discovery token')
            for index in reversed(range(142)):
                (root / f'tests/token-{index:03}.test.cjs').write_text('// synthetic token')
            for leaf in ('index.html', 'FIRSTLIGHT_VALLEY.html'):
                (root / leaf).write_bytes(b'synthetic equal page')
            logs = base / 'logs'; calls = []; stdout = io.StringIO(); stderr = io.StringIO()
            args = ['verify.py', '--output', str(logs)]
            if workers is not None: args += ['--rule-workers', str(workers)]
            marker = 'owned source-controller transport stop'

            def transport(command, **kwargs):
                calls.append((command, kwargs['timeout'], dict(kwargs['env'])))
                if command[:2] == ['node', '--test']:
                    if outcome == 'timeout': raise subprocess.TimeoutExpired(command, kwargs['timeout'])
                    if outcome == 'failure': return SimpleNamespace(returncode=9)
                if command[1:2] == ['tools/test_road_account_browser.py']:
                    raise RuntimeError(marker)
                return SimpleNamespace(returncode=0)

            with (patch.object(V, 'ROOT', root), patch.object(V.sys, 'argv', args),
                  patch.dict(V.os.environ, {'NODE_OPTIONS': '--no-warnings'}),
                  patch.object(V.shutil, 'which', return_value='node'),
                  patch.object(V.subprocess, 'check_output', return_value='v24.18.0'),
                  patch.object(V.subprocess, 'run', side_effect=transport),
                  contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr)):
                if outcome == 'success':
                    with self.assertRaisesRegex(RuntimeError, marker): V.main()
                else:
                    with self.assertRaises(SystemExit): V.main()
                self.assertEqual(V.os.environ.get('NODE_OPTIONS'), '--no-warnings')
            record = json.loads((logs / 'rules-command.json').read_text(encoding='utf-8'))
            self.assertIn(hashlib.sha256((logs / 'rules-command.json').read_bytes()).hexdigest(), stdout.getvalue())
            self.assertEqual(record['schema'], 'firstlight-rule-command/v1')
            self.assertEqual(record['verifierSha256'], hashlib.sha256(VERIFY.read_bytes()).hexdigest())
            self.assertEqual(record['root'], str(root))
            self.assertEqual(record['requestedWorkers'], workers)
            self.assertEqual(record['rulesTimeoutSeconds'], 180)
            self.assertEqual(record['pythonTimeoutSeconds'], 600)
            self.assertEqual(record['ruleFileCount'], 142)
            paths = [str(root / f'tests/token-{i:03}.test.cjs') for i in range(142)]
            prefix = ['node', '--test'] + ([] if workers is None else [f'--test-concurrency={workers}'])
            expected = prefix + ['--test-reporter=tap'] + paths
            rule_calls = [c for c in calls if c[0][:2] == ['node', '--test']]
            self.assertEqual(len(rule_calls), 1)
            self.assertEqual(rule_calls[0][0], expected)
            self.assertEqual(rule_calls[0][1], 180)
            self.assertEqual(record['command'], expected)
            self.assertEqual(record['ruleFiles'], [f'tests/token-{i:03}.test.cjs' for i in range(142)])
            for _, _, child_env in calls:
                self.assertEqual(child_env.get('NODE_OPTIONS'), '--no-warnings')
            return calls, stdout.getvalue(), stderr.getvalue()

    def test_omission_preserves_original_vector_and_python_budget(self):
        calls, _, _ = self.dispatch()
        units = [c for c in calls if 'unittest' in c[0]]
        self.assertEqual(len(units), 1); self.assertEqual(units[0][1], 600)

    def test_supported_caps_change_only_main_rules_and_preserve_complete_membership(self):
        for workers in (1, 2, 4):
            with self.subTest(workers=workers):
                calls, _, _ = self.dispatch(workers)
                self.assertEqual(sum(any('--test-concurrency=' in a for a in c[0]) for c in calls), 1)
                units = [c for c in calls if 'unittest' in c[0]]
                self.assertEqual(len(units), 1); self.assertEqual(units[0][1], 600)

    def test_invalid_caps_refuse_before_output_or_browser_allocation(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-rule-workers-refusal-') as name:
            base = Path(name)
            for value in ('0', '-1', '3', '8', '2.5', 'true', ''):
                with self.subTest(value=value):
                    args = ['verify.py', '--rule-workers', value, '--output', str(base/'logs'),
                            '--browser', '--browser-output', str(base/'browser')]
                    with patch.object(V.sys, 'argv', args), contextlib.redirect_stderr(io.StringIO()):
                        with self.assertRaises(SystemExit) as error: V.main()
                    self.assertEqual(error.exception.code, 2)
                    self.assertFalse((base/'logs').exists()); self.assertFalse((base/'browser').exists())

    def test_timeout_keeps_failure_and_stops_before_python(self):
        calls, stdout, stderr = self.dispatch(2, 'timeout')
        self.assertIn('FAILED: rules exceeded 180s', stderr)
        self.assertNotIn('PASS: rules', stdout)
        self.assertFalse(any('unittest' in c[0] for c in calls))

    def test_nonzero_exit_keeps_failure_and_stops_before_python(self):
        calls, stdout, stderr = self.dispatch(4, 'failure')
        self.assertNotIn('PASS: rules', stdout)
        self.assertFalse(any('unittest' in c[0] for c in calls))


if __name__ == '__main__': unittest.main(verbosity=2)
