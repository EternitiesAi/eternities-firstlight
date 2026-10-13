"""CPU admission of the explicit current source epoch; not native qualification.

The actual frozen game, Git, helper files, App and pages are read. Negative byte
operands are explicitly synthetic RAM transports. No browser, server, profile,
earned checkpoint or full checkout is created and no validator is replaced.
"""
from contextlib import contextmanager
from pathlib import Path
import hashlib
import importlib.util
import json
import subprocess
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / 'tools/SOURCE_EXPECTATIONS04.json'
CANDIDATE = ROOT / 'tools/SOURCE_EXPECTATIONS05.json'
PINS = {
    'tools/earth_consignment_browser.py': '9212846db04bf76c1e12ac81219ca3b24ff2b8e85145fc071b986738cdad52bd',
    'tools/earth_wild_signs_browser.py': 'e8516952228fdd645ff7e92cb8983c93eb6f6e328d0c1a8962188d3b62e39e8a',
}
spec = importlib.util.spec_from_file_location('candidate_actual_road_driver', ROOT / 'tools/road_account_browser.py')
DRIVER = importlib.util.module_from_spec(spec)
spec.loader.exec_module(DRIVER)


@contextmanager
def synthetic_bytes(mapping):
    mapping = {p.resolve(): data for p, data in mapping.items()}
    original_bytes, original_text = Path.read_bytes, Path.read_text

    def read_bytes(p):
        return mapping[p.resolve()] if p.resolve() in mapping else original_bytes(p)

    def read_text(p, encoding=None, errors=None, **kwargs):
        if p.resolve() not in mapping:
            return original_text(p, encoding=encoding, errors=errors, **kwargs)
        return mapping[p.resolve()].decode(encoding or 'utf8', errors or 'strict').replace('\r\n', '\n')

    with patch.object(Path, 'read_bytes', read_bytes), patch.object(Path, 'read_text', read_text):
        yield


class ProspectiveEpoch(unittest.TestCase):
    def setUp(self):
        self.head = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip()

    def admit(self):
        return DRIVER.installed_epoch(ROOT, self.head, CANDIDATE)

    def test_only_two_reviewed_text_pins_and_provenance_change(self):
        before, after = json.loads(OLD.read_text()), json.loads(CANDIDATE.read_text())
        review = after.pop('source05Review')
        historical_blob = subprocess.check_output(['git', '-C', str(ROOT), 'show', 'HEAD:tools/SOURCE_EXPECTATIONS04.json'])
        self.assertEqual(review['previousRawSHA256'], hashlib.sha256(historical_blob).hexdigest())
        self.assertEqual(review['previousLFSHA256'], DRIVER.lf_sha(OLD))
        self.assertEqual(review['helperChanges'], ['42950a8d30bc0f1f907e24dab34e80213f6dea4c', '661e4bdeba2c7754f2af80e11abaa53bfd3e8310'])
        self.assertFalse(after['installationQualified'])
        for path, literal in PINS.items():
            self.assertEqual(after['helpersLF'][path], literal)
            self.assertEqual(DRIVER.lf_sha(ROOT / path), literal)
            after['helpersLF'][path] = before['helpersLF'][path]
        self.assertEqual(after, before, 'raw historical helpers/report/head/modules/App pins remain exact')

    def test_frozen_04_still_refuses_current_helpers(self):
        with self.assertRaisesRegex(ValueError, 'Actual original browser helper text changed'):
            DRIVER.installed_epoch(ROOT, self.head, OLD)

    def test_current_actual_files_admit_with_reviewed_epoch(self):
        epoch = self.admit()
        self.assertEqual(epoch['head'], self.head)
        self.assertEqual(epoch['htmlSha256'], DRIVER.sha(ROOT / 'index.html'))
        self.assertEqual(epoch['runtimeSources']['src/earth-roadkeeper-art.js'], DRIVER.sha(ROOT / 'src/earth-roadkeeper-art.js'))

    def test_wrong_installed_head_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Actual integration HEAD differs'):
            DRIVER.installed_epoch(ROOT, '0' * 40, CANDIDATE)

    def test_each_unreviewed_helper_mutation_is_rejected(self):
        for rel in PINS:
            with self.subTest(helper=rel):
                path = ROOT / rel
                with synthetic_bytes({path: path.read_bytes() + b'\n# Synthetic unreviewed change\n'}):
                    with self.assertRaisesRegex(ValueError, 'Actual original browser helper text changed'):
                        self.admit()

    def test_unknown_candidate_pin_is_rejected(self):
        altered = json.loads(CANDIDATE.read_text())
        altered['helpersLF']['tools/earth_consignment_browser.py'] = '0' * 64
        with synthetic_bytes({CANDIDATE: json.dumps(altered).encode()}):
            with self.assertRaisesRegex(ValueError, 'Actual original browser helper text changed'):
                self.admit()

    def test_different_generated_pages_are_rejected(self):
        path = ROOT / 'FIRSTLIGHT_VALLEY.html'
        with synthetic_bytes({path: path.read_bytes() + b'\n'}):
            with self.assertRaisesRegex(ValueError, 'Matching actual installed pages required'):
                self.admit()

    def test_matching_pages_with_reviewed_module_removed_are_rejected(self):
        module = (ROOT / 'src/earth-roadkeeper-art.js').read_text(encoding='utf-8-sig')
        html = (ROOT / 'index.html').read_text(encoding='utf-8-sig')
        self.assertIn(module, html)
        altered = html.replace(module, '// Synthetic removed reviewed module').encode()
        with synthetic_bytes({ROOT / name: altered for name in ('index.html', 'FIRSTLIGHT_VALLEY.html')}):
            with self.assertRaisesRegex(ValueError, 'Actual reviewed module is not embedded'):
                self.admit()

    def test_changed_reviewed_module_is_rejected(self):
        path = ROOT / 'src/earth-roadkeeper-art.js'
        with synthetic_bytes({path: path.read_bytes() + b'\n// Synthetic unreviewed module\n'}):
            with self.assertRaisesRegex(ValueError, 'Reviewed future runtime is not installed'):
                self.admit()

    def test_changed_actual_app_hook_is_rejected(self):
        path = ROOT / 'src/app.js'
        original = path.read_bytes()
        changed = original.replace(b'// BEGIN EARTH ROADKEEPER APP HOOKS', b'// BEGIN EARTH ROADKEEPER APP HOOKS\n// Synthetic unreviewed hook')
        self.assertNotEqual(original, changed)
        with synthetic_bytes({path: changed}):
            with self.assertRaisesRegex(ValueError, 'Actual App hook differs from reviewed source'):
                self.admit()


if __name__ == '__main__':
    unittest.main(verbosity=2)
