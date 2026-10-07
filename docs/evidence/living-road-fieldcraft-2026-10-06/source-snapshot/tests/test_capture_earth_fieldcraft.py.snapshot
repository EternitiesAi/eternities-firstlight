"""CPU checks of the actual capture driver's guards and native input protocol.

Synthetic controller fixtures only; no Chromium, profiles, rendered claims or
command-earned gameplay are produced by these tests.
"""
from pathlib import Path
import copy
import importlib.util
import math
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / 'tools/capture_earth_expedition.py'
sys.path.insert(0, str(ROOT / 'tools'))
spec = importlib.util.spec_from_file_location('expedition_capture_cpu', TOOL)
CAPTURE = importlib.util.module_from_spec(spec)
spec.loader.exec_module(CAPTURE)


def synthetic_world():
    return {
        'earthExpedition': {'version': 1, 'story': {'accepted': True, 'branch': 'stormfall-recovery',
                            'steps': ['assess-load', 'prepare-allocation', 'read-root-load', 'clear-root-pests'],
                            'claimed': False}, 'patrol': {'lastClaim': 0, 'active': None}},
        'residents': [{'id': 'rill', 'conversations': ['old conversation']}],
        'adventure': {'elapsed': 5, 'revision': 3, 'hp': 40, 'stamina': 30,
                      'xp': 12, 'coins': 30, 'ore': 5, 'receipts': [],
                      'equipment': {'weapon': 'trail_blade'}, 'owned': ['trail_blade'],
                      'arsenal': {'sockets': {'trail_blade': ['old-ore']}},
                      'companion': {'mode': 'follow', 'id': 'reed'},
                      'earthBinding': {'version': 1, 'weapon': None, 'kind': None}},
        'sandbox': {'elapsed': 5, 'revision': 2, 'nodes': [],
                    'inventory': {'wood': 12, 'fiber': 10, 'stone': 8},
                    'placed': [{'id': 'bed-old', 'kind': 'bed'}]},
        'settings': {'quality': 'balanced', 'timeFlow': False, 'cameraMode': 'follow',
                     'cameraViews': {'profiles': {}}, 'sound': False},
        'notes': ['old note'], 'score': [1], 'retreat': {'revision': 1},
        'hour': 9, 'day': 2, 'journal': [], 'nextEvent': 1, 'visited': ['home'],
        'player': {'x': -145, 'z': -84, 'yaw': 0},
    }


class NativeInputProtocol:
    """Labelled synthetic locator protocol, never a rendered DOM substitute."""
    def __init__(self, focused=True):
        self.calls, self.focused = [], focused

    def locator(self, selector):
        self.calls.append(('locator', selector))
        return self

    def focus(self):
        self.calls.append(('focus',))

    def fill(self, value):
        self.calls.append(('fill', value))

    def press(self, value):
        self.calls.append(('press', value))

    def evaluate(self, source, selector):
        self.calls.append(('observe', selector))
        return self.focused


class CaptureFieldcraftCPU(unittest.TestCase):
    def test_all_three_modules_are_required_and_currently_embedded(self):
        runtime = [s for s in CAPTURE.CORE_FILES if s.startswith('src/') and s.endswith('.js')]
        for name, consumer in [('earth-fieldcraft.js', 'earth-expedition.js'),
                               ('earth-fieldcraft-ui.js', 'earth-expedition-ui.js'),
                               ('earth-fieldcraft-art.js', 'earth-expedition-art.js')]:
            with self.subTest(module=name):
                self.assertLess(runtime.index('src/' + name), runtime.index('src/' + consumer))
                body = (ROOT / 'src' / name).read_bytes().replace(b'\r\n', b'\n').replace(b'\r', b'\n')
                html = (ROOT / 'index.html').read_bytes().replace(b'\r\n', b'\n').replace(b'\r', b'\n')
                self.assertIn(body, html)

    def test_selector_never_accepts_generic_progress_or_fitting_authority(self):
        self.assertEqual(CAPTURE.fieldcraft_selector('seat', 4),
                         '#rpg-content [data-rpg="expedition-fieldcraft-seat"][data-section="brace-4"]')
        self.assertIn('expedition-fieldcraft-fasten', CAPTURE.fieldcraft_selector('fasten'))
        for action, section in [('step', None), ('fittingTicket', None), ('pose', None), ('seat', None),
                                ('seat', 0), ('seat', 5), ('seat', True), ('seat', '1'), ('fasten', 1)]:
            with self.subTest(action=action, section=section):
                with self.assertRaises(ValueError):
                    CAPTURE.fieldcraft_selector(action, section)

    def test_bad_pose_inputs_are_rejected_before_any_native_event(self):
        for axis, value, control in [('roll', 0, 'number'), ('yaw', math.nan, 'number'),
                                     ('yaw', math.inf, 'number'), ('yaw', -0.1, 'number'),
                                     ('yaw', 20.1, 'number'), ('pitch', 35.1, 'number'),
                                     ('pitch', True, 'number'), ('pitch', '14.6', 'number'),
                                     ('pitch', 14.6, 'range'), ('yaw', 0, 'write-state')]:
            page = NativeInputProtocol()
            with self.subTest(axis=axis, value=value, control=control):
                with self.assertRaises(ValueError):
                    CAPTURE.fieldcraft_edit(page, axis, value, control)
                self.assertEqual(page.calls, [])

    def test_numeric_and_range_edits_use_native_events_after_focus(self):
        number = NativeInputProtocol()
        self.assertTrue(CAPTURE.fieldcraft_edit(number, 'pitch', 14.6))
        self.assertEqual(number.calls[:2], [('locator', '#fieldcraft-pitch-number'), ('focus',)])
        self.assertIn(('fill', '14.6'), number.calls)
        for value, key in [(0, 'Home'), (20, 'End')]:
            page = NativeInputProtocol()
            self.assertTrue(CAPTURE.fieldcraft_edit(page, 'yaw', value, 'range'))
            self.assertIn(('press', key), page.calls)
            self.assertFalse(any(c[0] == 'fill' for c in page.calls))

    def test_replaced_or_blurred_input_is_reported_as_failure(self):
        self.assertFalse(CAPTURE.fieldcraft_edit(NativeInputProtocol(False), 'pitch', 14.6))

    def test_temporary_fit_oracle_detects_ledger_payment_and_old_ownership_loss(self):
        before = synthetic_world()
        changes = [lambda s: s['earthExpedition']['story']['steps'].append('brace-root-channel'),
                   lambda s: s['earthExpedition']['story'].update(claimed=True),
                   lambda s: s['adventure'].update(coins=31),
                   lambda s: s['sandbox']['inventory'].update(wood=11),
                   lambda s: s['adventure']['owned'].clear(),
                   lambda s: s['adventure']['arsenal']['sockets'].clear(),
                   lambda s: s['adventure']['companion'].update(mode='stay'),
                   lambda s: s['sandbox']['placed'].clear(),
                   lambda s: s['notes'].clear()]
        for change in changes:
            after = copy.deepcopy(before)
            change(after)
            self.assertFalse(CAPTURE.fitting_unchanged(before, after))
        self.assertEqual(before, synthetic_world(), 'The oracle must not mutate its inputs')

    def test_camera_clock_and_normal_timer_observation_are_permitted(self):
        before, after = synthetic_world(), synthetic_world()
        after['hour'] = 17.2
        after['adventure']['elapsed'] += 0.4
        after['settings']['cameraMode'] = 'adventure'
        after['settings']['cameraViews'] = {'profiles': {'adventure': {'yaw': math.pi / 2}}}
        self.assertTrue(CAPTURE.fitting_unchanged(before, after))

    def test_import_is_inert_and_help_precedes_playwright(self):
        code = ('import sys,socket; socket.socket.bind=lambda *a,**k:(_ for _ in ()).throw(AssertionError("server on import"));'
                'sys.path.insert(0,' + repr(str(ROOT / 'tools')) + ');import capture_earth_expedition;'
                'assert "playwright" not in sys.modules')
        result = subprocess.run([sys.executable, '-B', '-c', code], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        help_result = subprocess.run([sys.executable, '-B', str(TOOL), '--help'], capture_output=True, text=True)
        self.assertEqual(help_result.returncode, 0, help_result.stderr)
        self.assertIn('--source', help_result.stdout)


if __name__ == '__main__':
    unittest.main()
