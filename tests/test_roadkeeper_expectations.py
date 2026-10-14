"""Read-only ART boundary regressions with a declared helper fixture view.

The frozen native expectations still refuse the later reviewed helpers. ART
cases transport a copy with two literal declared helper pins in RAM;
their negative cases change one further declared JSON/module byte operand.
All validators and other source/page/git reads remain production. These
synthetic declarations are not native/source admission or a new native epoch.
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
HELPER = ROOT / 'tools/earth_consignment_browser.py'
# Independent actual-diff review, PR74: follow_sample retains yaw and adds the
# actual heading in the same turn; native follow consumes it with legacy fallback.
# The frozen SOURCE_EXPECTATIONS04 stays unchanged and still refuses this helper.
# Never derive an accepted pin from unknown current source bytes.
# PR78 adds only the declared current-cohort Adventure12-to13 predicate.
# SOURCE_EXPECTATIONS07 additionally declares only the 13-to14 predicate.
# Parent review of that diff is explicit; independent review remains pending.
DECLARED_CURRENT_HELPER = '6f3c12a17c616dd011578fbdf89913c84bf4f842712e174fcf0ac9692c8ea597'
WILD_SIGNS_HELPER = ROOT / 'tools/earth_wild_signs_browser.py'
REVIEWED_WILD_SIGNS_HELPER = 'e8516952228fdd645ff7e92cb8983c93eb6f6e328d0c1a8962188d3b62e39e8a'
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

    def synthetic_expectation_epoch(self):
        with ram_bytes({EXPECTATIONS: json.dumps(self.expectations).encode()}):
            return DRIVER.installed_epoch(ROOT, self.head, EXPECTATIONS)

    def select_declared_helper_view(self):
        self.expectations['helpersLF']['tools/earth_consignment_browser.py'] = DECLARED_CURRENT_HELPER
        self.expectations['helpersLF']['tools/earth_wild_signs_browser.py'] = REVIEWED_WILD_SIGNS_HELPER

    def test_frozen_original_still_refuses_the_newer_helper(self):
        with self.assertRaisesRegex(ValueError, 'Actual original browser helper text changed: tools/earth_consignment_browser.py'):
            DRIVER.installed_epoch(ROOT, self.head, EXPECTATIONS)

    def test_unreviewed_changed_helper_is_refused_in_the_selected_view(self):
        self.select_declared_helper_view()
        altered = HELPER.read_bytes() + b'\n# Explicit synthetic unreviewed helper mutation.\n'
        with ram_bytes({HELPER: altered}):
            with self.assertRaisesRegex(ValueError, 'Actual original browser helper text changed: tools/earth_consignment_browser.py'):
                self.synthetic_expectation_epoch()

    def test_unreviewed_helper_pin_is_refused_in_the_selected_view(self):
        self.select_declared_helper_view()
        self.expectations['helpersLF']['tools/earth_consignment_browser.py'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'Actual original browser helper text changed: tools/earth_consignment_browser.py'):
            self.synthetic_expectation_epoch()

    def test_reviewed_current_art_passes_with_selected_synthetic_expectations(self):
        self.select_declared_helper_view()
        self.assertEqual(DRIVER.lf_sha(HELPER), DECLARED_CURRENT_HELPER)
        self.assertEqual(DRIVER.lf_sha(WILD_SIGNS_HELPER), REVIEWED_WILD_SIGNS_HELPER)
        epoch = self.synthetic_expectation_epoch()
        self.assertEqual(self.expectations['reviewedModulesLF']['earth-roadkeeper-art.js'], REVIEWED_ART)
        self.assertEqual(self.expectations['reviewedModules']['earth-roadkeeper-art.js'], OLD_ART)
        self.assertEqual(DRIVER.lf_sha(ART), REVIEWED_ART)
        self.assertEqual(epoch['head'], self.head)
        self.assertEqual(epoch['htmlSha256'], DRIVER.sha(ROOT / 'index.html'))
        self.assertEqual(epoch['runtimeSources']['src/earth-roadkeeper-art.js'], DRIVER.sha(ART))

    def test_unreviewed_wild_signs_bytes_are_refused_in_the_selected_view(self):
        self.select_declared_helper_view()
        altered = WILD_SIGNS_HELPER.read_bytes() + b'\n# Explicit synthetic unreviewed helper mutation.\n'
        with ram_bytes({WILD_SIGNS_HELPER: altered}):
            with self.assertRaisesRegex(ValueError, 'Actual original browser helper text changed: tools/earth_wild_signs_browser.py'):
                self.synthetic_expectation_epoch()

    def test_stale_lf_art_pin_refuses_with_selected_synthetic_expectations(self):
        self.select_declared_helper_view()
        self.expectations['reviewedModulesLF']['earth-roadkeeper-art.js'] = OLD_ART
        with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed: earth-roadkeeper-art.js'):
            self.synthetic_expectation_epoch()

    def test_unreviewed_lf_pin_is_not_accepted(self):
        self.select_declared_helper_view()
        self.expectations['reviewedModulesLF']['earth-roadkeeper-art.js'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed: earth-roadkeeper-art.js'):
            self.synthetic_expectation_epoch()

    def test_unreviewed_changed_art_bytes_are_refused_by_the_hash_guard(self):
        self.select_declared_helper_view()
        altered = ART.read_bytes() + b'\n// Explicit synthetic unreviewed source-identity mutation.\n'
        with ram_bytes({ART: altered}):
            with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed: earth-roadkeeper-art.js'):
                self.synthetic_expectation_epoch()

    def test_retained_historical_raw_fallback_is_not_a_second_accepted_hash(self):
        self.select_declared_helper_view()
        self.expectations.pop('reviewedModulesLF')
        with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed: earth-roadkeeper-art.js'):
            self.synthetic_expectation_epoch()


if __name__ == '__main__':
    unittest.main()
