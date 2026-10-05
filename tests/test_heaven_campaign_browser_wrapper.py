"""CPU wrapper/preflight contract; synthetic receipts, no earned-play or browser claim."""
from pathlib import Path
from unittest.mock import patch
import argparse
import ast
import contextlib
import hashlib
import importlib.util
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('heaven_browser_wrapper', ROOT / 'tests/heaven_campaign_browser.py')
WRAPPER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(WRAPPER)
LABELS = ('fresh-blade', 'fresh-bow', 'returning-strongest')


def native_preflight():
    """Run the actual current preflight, stopping before output/process/browser work.

    Loading the native module imports Playwright; its complete main launches a
    browser and invokes Git. This CPU regression compiles the unchanged prefix
    from its AST, up to the first output-creation try, with only stdlib globals.
    No validation condition is copied, replaced or bypassed.
    """
    path = ROOT / 'tools/heaven_campaign_browser.py'
    tree = ast.parse(path.read_text(encoding='utf-8'), filename=str(path))
    main = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'main')
    stop = next(i for i, n in enumerate(main.body) if isinstance(n, ast.Try))
    main.body = main.body[:stop] + [ast.Return(value=ast.Name(id='provenance', ctx=ast.Load()))]
    variants = next(n for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'VARIANTS' for t in n.targets))
    sha = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'sha')
    code = ast.fix_missing_locations(ast.Module(body=[variants, sha, main], type_ignores=[]))
    namespace = {'Path': Path, 'ROOT': ROOT, 'argparse': argparse, 'os': os, 'json': json, 'hashlib': hashlib}
    exec(compile(code, str(path), 'exec'), namespace)
    return namespace['main']


class HeavenBrowserWrapperContract(unittest.TestCase):
    def setUp(self):
        parent = Path('D:/07-GAMES/Firstlight/artifacts') if os.name == 'nt' else None
        if parent is not None and not parent.is_dir():
            self.skipTest('The Windows D: artifact directory is unavailable; no C: substitute.')
        self.temporary = tempfile.TemporaryDirectory(prefix='heaven-wrapper-cpu-', dir=parent)
        self.root = Path(self.temporary.name).resolve()
        if parent is not None:
            self.assertEqual(self.root.parent, parent.resolve())
        self.addCleanup(self.temporary.cleanup)
        self.output = self.root / 'native'
        self.sources = self.root / 'native-sources'
        self.preflight = native_preflight()

    def invoke(self, *extra):
        with patch.object(sys, 'argv', ['heaven_campaign_browser.py', '--output', str(self.output), *extra]):
            return WRAPPER.main()

    def test_default_generation_satisfies_actual_complete_journey_preflight_for_all_variants(self):
        # Substitute only the subprocess boundaries. The synthetic CLI fixture
        # mirrors the real journey's report side effect: --seed-only writes
        # seed/provenance and returns before the complete journey report.
        commands = []
        result = {}

        def journey(command, *, cwd, check):
            self.assertEqual(cwd, ROOT)
            self.assertTrue(check)
            self.assertEqual(command[:2], ['node', 'tests/heaven_campaign_journey.cjs'])
            commands.append(command)
            label = 'fresh-bow' if '--bow' in command else 'returning-strongest' if '--veteran' in command else 'fresh-blade'
            sources = Path(command[command.index('--output') + 1])
            folder = sources / label
            folder.mkdir(parents=True, exist_ok=False)
            seed = folder / '00_EARNED_SEED.json'
            seed.write_text(json.dumps({'synthetic_cpu_contract': label}), encoding='utf-8')
            proof = {'variant': label, 'seedSha256': hashlib.sha256(seed.read_bytes()).hexdigest(), 'sourceHashes': {'synthetic-cpu-fixture': 'not-runtime-proof'}}
            (folder / 'SEED_PROVENANCE.json').write_text(json.dumps(proof), encoding='utf-8')
            if '--seed-only' not in command:
                report = {'status': 'passed', 'sourceHashes': proof['sourceHashes'], 'method': 'synthetic CPU contract fixture',
                          'positionEdits': 0, 'inventoryGrants': 0, 'manualDamage': 0, 'forcedModes': 0, 'plantedDefeats': 0}
                (folder / 'HEAVEN_CAMPAIGN_JOURNEY_REPORT.json').write_text(json.dumps(report), encoding='utf-8')
            return subprocess.CompletedProcess(command, 0)

        def native(command, *, cwd):
            self.assertEqual(cwd, ROOT)
            self.assertEqual(command[:2], [sys.executable, str(ROOT / 'tools/heaven_campaign_browser.py')])
            with patch.object(sys, 'argv', command[1:]), contextlib.redirect_stderr(io.StringIO()) as error:
                try:
                    result['provenance'] = self.preflight()
                    return 0
                except SystemExit as failure:
                    result['error'] = error.getvalue()
                    return failure.code

        with patch.object(WRAPPER.subprocess, 'run', side_effect=journey), patch.object(WRAPPER.subprocess, 'call', side_effect=native):
            code = self.invoke()
        self.assertEqual(code, 0, result.get('error', 'native preflight did not accept full receipts'))
        self.assertEqual(tuple(result['provenance']), LABELS)
        self.assertEqual(len(commands), 3)
        for command, label, flag in zip(commands, LABELS, (None, '--bow', '--veteran')):
            self.assertNotIn('--seed-only', command)
            self.assertEqual(Path(command[command.index('--output') + 1]), self.sources)
            self.assertEqual('--bow' in command, flag == '--bow')
            self.assertEqual('--veteran' in command, flag == '--veteran')
            self.assertTrue((self.sources / label / 'HEAVEN_CAMPAIGN_JOURNEY_REPORT.json').is_file())

    def test_supplied_sources_are_reused_without_generating_or_replacing_evidence(self):
        self.sources.mkdir()
        prior = self.sources / 'prior-receipt.json'
        prior.write_bytes(b'prior immutable receipt')
        commands = []

        def native(command, *, cwd):
            commands.append(command)
            self.assertEqual(cwd, ROOT)
            return 7

        with patch.object(WRAPPER.subprocess, 'run', side_effect=AssertionError('supplied sources must not be regenerated')), patch.object(WRAPPER.subprocess, 'call', side_effect=native):
            self.assertEqual(self.invoke('--sources', str(self.sources)), 7)
        self.assertEqual(commands, [[sys.executable, str(ROOT / 'tools/heaven_campaign_browser.py'), '--output', str(self.output), '--sources', str(self.sources)]])
        self.assertEqual(prior.read_bytes(), b'prior immutable receipt')

    def test_existing_output_or_default_sources_refuse_before_any_process_and_preserve_prior_bytes(self):
        for folder in (self.output, self.sources):
            folder.mkdir()
            prior = folder / 'prior.json'
            prior.write_bytes(b'prior immutable receipt')
            with patch.object(WRAPPER.subprocess, 'run', side_effect=AssertionError('must not run')), patch.object(WRAPPER.subprocess, 'call', side_effect=AssertionError('must not run')), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as failure:
                    self.invoke()
            self.assertEqual(failure.exception.code, 2)
            self.assertEqual(prior.read_bytes(), b'prior immutable receipt')
            # Only this labelled fixture is removed, retaining its prior bytes
            # until their preservation assertion has run.
            prior.unlink()
            folder.rmdir()

    def test_failed_journey_stops_before_native_launch_and_keeps_its_failure_receipt(self):
        def journey(command, **_):
            self.sources.mkdir()
            (self.sources / 'FAILURE.json').write_bytes(b'synthetic journey failure')
            raise subprocess.CalledProcessError(1, command)

        with patch.object(WRAPPER.subprocess, 'run', side_effect=journey), patch.object(WRAPPER.subprocess, 'call', side_effect=AssertionError('failed generation must not launch native suite')):
            with self.assertRaises(subprocess.CalledProcessError):
                self.invoke()
        self.assertEqual((self.sources / 'FAILURE.json').read_bytes(), b'synthetic journey failure')


if __name__ == '__main__':
    unittest.main()
