"""Read-only real installed source-epoch regressions; no native admission.

The negative cases transport one declared JSON/module byte change in RAM.
All other source/page/git reads use the ordinary production implementation.
No command-earned checkpoint, save, browser, profile or server is created.
"""
from contextlib import contextmanager
from pathlib import Path
import importlib.util
import json
import subprocess
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
EXPECTATIONS = ROOT / 'tools/SOURCE_EXPECTATIONS04.json'
ART = ROOT / 'src/earth-roadkeeper-art.js'
OLD_ART = '607b2714dbca0bc38c293ca6884706466bea80499382b49bacfb2e9b3a6b340e'
REVIEWED_ART = 'ea1fba39cd658a65487b88a05f1d51c2a45a1724ac6cad31ac9e57657e8eff2c'
spec = importlib.util.spec_from_file_location('roadkeeper_actual_source_epoch', ROOT / 'tools/road_account_browser.py')
DRIVER = importlib.util.module_from_spec(spec)
spec.loader.exec_module(DRIVER)


@contextmanager
def ram_bytes(mapping):
    """Explicit synthetic byte transport; never replaces a validator or git."""
    overrides = {path.resolve(): raw for path, raw in mapping.items()}
    original_bytes, original_text = Path.read_bytes, Path.read_text

    def read_bytes(path):
        raw = overrides.get(path.resolve())
        return original_bytes(path) if raw is None else raw

    def read_text(path, encoding=None, errors=None, **kwargs):
        raw = overrides.get(path.resolve())
        if raw is None:
            return original_text(path, encoding=encoding, errors=errors, **kwargs)
        return raw.decode(encoding or 'utf-8', errors or 'strict').replace('\r\n', '\n')

    with patch.object(Path, 'read_bytes', read_bytes), patch.object(Path, 'read_text', read_text):
        yield


class RoadkeeperSourceEpoch(unittest.TestCase):
    def setUp(self):
        self.head = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip()
        self.expectations = json.loads(EXPECTATIONS.read_text(encoding='utf-8-sig'))

    def epoch(self):
        return DRIVER.installed_epoch(ROOT, self.head, EXPECTATIONS)

    def test_reviewed_current_art_passes_real_installed_source_epoch(self):
        # Against the stale original file this actual call must refuse first.
        epoch = self.epoch()
        self.assertEqual(self.expectations['reviewedModulesLF']['earth-roadkeeper-art.js'], REVIEWED_ART)
        self.assertEqual(self.expectations['reviewedModules']['earth-roadkeeper-art.js'], OLD_ART)
        self.assertEqual(DRIVER.lf_sha(ART), REVIEWED_ART)
        self.assertEqual(epoch['head'], self.head)
        self.assertEqual(epoch['htmlSha256'], DRIVER.sha(ROOT / 'index.html'))
        self.assertEqual(epoch['runtimeSources']['src/earth-roadkeeper-art.js'], DRIVER.sha(ART))

    def test_stale_lf_art_pin_refuses_real_installed_source_epoch(self):
        self.expectations['reviewedModulesLF']['earth-roadkeeper-art.js'] = OLD_ART
        with ram_bytes({EXPECTATIONS: json.dumps(self.expectations).encode()}):
            with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed: earth-roadkeeper-art.js'):
                self.epoch()

    def test_unreviewed_lf_pin_is_not_accepted(self):
        self.expectations['reviewedModulesLF']['earth-roadkeeper-art.js'] = '0' * 64
        with ram_bytes({EXPECTATIONS: json.dumps(self.expectations).encode()}):
            with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed: earth-roadkeeper-art.js'):
                self.epoch()

    def test_unreviewed_changed_art_bytes_are_refused_by_the_hash_guard(self):
        altered = ART.read_bytes() + b'\n// Explicit synthetic unreviewed source-identity mutation.\n'
        with ram_bytes({ART: altered}):
            with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed: earth-roadkeeper-art.js'):
                self.epoch()

    def test_retained_historical_raw_fallback_is_not_a_second_accepted_hash(self):
        self.expectations.pop('reviewedModulesLF')
        with ram_bytes({EXPECTATIONS: json.dumps(self.expectations).encode()}):
            with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed: earth-roadkeeper-art.js'):
                self.epoch()


if __name__ == '__main__':
    unittest.main()
