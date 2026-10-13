"""CPU checks for exclusive browser evidence routing; no browser imports or launches."""
import ast
from contextlib import contextmanager
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('tested_browser_output_support', ROOT / 'tests/browser_support.py')
support = importlib.util.module_from_spec(spec)
spec.loader.exec_module(support)

EXPECTED_LEGACY = frozenset({
    'characters_browser', 'classes_browser', 'combat_cue_browser',
    'companion_presentation_browser', 'cosmos_browser', 'crossing_browser',
    'cutaway_browser', 'earth_browser', 'earth_notes_browser', 'earth_story_browser',
    'gathering_browser', 'journey_usability_browser', 'native_origin_browser',
    'pursuit_browser', 'realm_atlas_browser', 'realm_trails_browser',
    'realm_trails_cosmos_browser', 'reflection_browser', 'regression09_browser',
    'skitter_presentation_browser', 'soundscape_browser', 'starter_browser',
    'timber_browser', 'traveler_browser', 'workshop_transactions_browser',
    'world_cutaway_browser',
})


@contextmanager
def configured(value=None):
    with patch.dict(os.environ):
        if value is None:
            os.environ.pop('FIRSTLIGHT_BROWSER_OUTPUT', None)
        else:
            os.environ['FIRSTLIGHT_BROWSER_OUTPUT'] = str(value)
        yield


class BrowserOutputRouting(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='firstlight-output-cpu-')
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)

    def route(self, default, **kwargs):
        helper = getattr(support, 'browser_output', None)
        self.assertTrue(callable(helper), 'browser_output must own fresh evidence routing')
        return helper(default, **kwargs)

    def test_missing_override_preserves_default_identity_without_reservation(self):
        default = self.folder / 'legacy' / 'evidence'
        with configured():
            self.assertIs(self.route(default), default)
            self.assertEqual(self.route('relative-legacy'), 'relative-legacy')
        self.assertFalse(default.exists())

    def test_configured_output_reserves_fresh_nested_directory_and_rejects_retry(self):
        output = self.folder / 'run' / 'suite'
        with configured(output):
            self.assertEqual(self.route(Path('unused-default'), windows=False), output.resolve())
            self.assertTrue(output.is_dir())
            (output / 'receipt.txt').write_text('retain exact prior evidence', encoding='utf8')
            with self.assertRaises(FileExistsError):
                self.route(Path('unused-default'), windows=False)
        self.assertEqual((output / 'receipt.txt').read_text(encoding='utf8'), 'retain exact prior evidence')
        self.assertEqual([p.name for p in output.iterdir()], ['receipt.txt'])

    def test_existing_file_cannot_be_replaced(self):
        output = self.folder / 'prior-receipt.json'
        output.write_bytes(b'original evidence')
        with configured(output), self.assertRaises(FileExistsError):
            self.route(Path('unused-default'), windows=False)
        self.assertEqual(output.read_bytes(), b'original evidence')

    def test_relative_empty_and_filesystem_root_overrides_are_refused(self):
        for value in ('relative-output', '', Path(self.folder.anchor)):
            with self.subTest(value=str(value)), configured(value), self.assertRaises(ValueError):
                self.route(Path('unused-default'), windows=False)

    def test_windows_override_must_stay_on_d_before_any_directory_is_created(self):
        output = self.folder / 'outside-d'
        with configured(output), self.assertRaises(ValueError):
            self.route(Path('unused-default'), windows=True)
        self.assertFalse(output.exists())

    def test_exact_legacy_membership_and_actual_suite_output_initializers(self):
        declared = getattr(support, 'LEGACY_BROWSER_OUTPUTS', None)
        self.assertIsInstance(declared, frozenset)
        self.assertEqual(declared, EXPECTED_LEGACY)
        helper = getattr(support, 'browser_output', None)
        self.assertTrue(callable(helper))
        for suite in EXPECTED_LEGACY:
            with self.subTest(suite=suite):
                tree = ast.parse((ROOT / 'tests' / (suite + '.py')).read_text(encoding='utf8'))
                calls = [n for n in ast.walk(tree) if isinstance(n, ast.Call)
                         and isinstance(n.func, ast.Name) and n.func.id == 'browser_output']
                self.assertEqual(len(calls), 1, 'each legacy suite must reserve exactly one output namespace')
                assignment = next(n for n in ast.walk(tree) if isinstance(n, ast.Assign)
                                  and n.value is calls[0])
                original = self.folder / 'unchanged-source-root'
                namespace = dict(ROOT=original, R=original, root=original,
                                 browser_output=lambda default: helper(default, windows=False))
                output = self.folder / 'routed' / suite
                with configured(output):
                    exec(compile(ast.Module(body=[assignment], type_ignores=[]), suite, 'exec'), namespace)
                self.assertEqual(namespace[assignment.targets[0].id], output.resolve())
                self.assertTrue(output.is_dir())
                self.assertEqual(namespace['ROOT'], original)
                self.assertFalse(original.exists(), 'output routing must not reserve the source root')

    def test_reflection_routes_both_real_output_paths_from_the_chosen_namespace(self):
        helper = getattr(support, 'browser_output', None)
        self.assertTrue(callable(helper))
        tree = ast.parse((ROOT / 'tests/reflection_browser.py').read_text(encoding='utf8'))
        expressions = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if node.func.attr == 'screenshot':
                    expressions.extend(k.value for k in node.keywords if k.arg == 'path')
                elif node.func.attr == 'write_text':
                    expressions.append(node.func.value)
        self.assertEqual(len(expressions), 2)
        output = self.folder / 'reflection'
        with configured(output):
            chosen = helper(Path('unused-default'), windows=False)
        namespace = dict(OUT=chosen, root=self.folder / 'source', str=str)
        actual = {Path(eval(compile(ast.Expression(e), 'reflection-output', 'eval'), namespace)) for e in expressions}
        self.assertEqual(actual, {chosen / 'REFLECTION_ORIENTATION_SPECIMEN.png',
                                  chosen / 'REFLECTION_TEST_REPORT.json'})


if __name__ == '__main__':
    unittest.main()
