"""Strict restart-oracle CPU coverage using labelled external-browser doubles.

No browser/profile, valid game fixture, gameplay or persistence claim is made.
The real Native.restart/check/write_new/preserved methods run unchanged; only
external reads, browser close/start and their console delivery are controlled.
"""
from pathlib import Path
import copy
import hashlib
import importlib.util
import json
import tempfile
import unittest


SOURCE = Path(__file__).resolve().parents[1] / 'tools/earth_consignment_browser.py'
spec = importlib.util.spec_from_file_location('native_restart_evidence_driver', SOURCE)
H = importlib.util.module_from_spec(spec)
spec.loader.exec_module(H)
EXPECTED = '{"revision":25,"name":"é"}'
BEFORE = '{"revision":24}'
NEW_AUTOSAVE = '{"revision":26}'


def specimen_world():
    # Complete inputs of this oracle's projection; deliberately not a game save.
    world = {key: {} for key in (
        'journeys', 'realmTrails', 'earthExpedition', 'hellCampaign',
        'heavenCampaign', 'atlantisCampaign', 'cosmosCampaign', 'earthHomecoming',
        'bridgeCommunity', 'homeHistory', 'notes', 'score', 'scoreRevision',
        'retreat', 'visitor', 'flowers', 'seed', 'version', 'visited')}
    world['adventure'] = {'coins': 7, 'xp': 45, 'equipment': {'weapon': 'synthetic-blade'}}
    world['localLife'] = {'records': {key: {'claimed': True} for key in H.OLD_IDS}}
    world['sandbox'] = {'inventory': {'wood': 2}, 'version': 1}
    return world


class RestartEvidenceCPU(unittest.TestCase):
    def driver(self, folder, startup, closed_raw=EXPECTED, changed_history=False):
        h = object.__new__(H.Native)
        h.case = 'SYNTHETIC-restart-observation'
        h.folder = folder
        h.row = {'checks': [], 'restarts': [], 'nativeWrites': 9}
        h.raw = BEFORE
        h.reopened = False
        before = specimen_world()
        after = copy.deepcopy(before)
        if changed_history:
            after['notes'] = {'synthetic-lost-history': True}
        h.close = lambda: None
        h.state = lambda: copy.deepcopy(after if h.reopened else before)
        h.stored = lambda: copy.deepcopy(before)
        h.diag = lambda: {'scene': 'valley'}

        def ev(js, arg=None):
            if js == '()=>({world:Realm.state,native:localStorage.getItem(RealmCharacters.KEY)})':
                return {'world':copy.deepcopy(after if h.reopened else before),
                        'native':NEW_AUTOSAVE if h.reopened else BEFORE}
            if js == '()=>window.__flStartup':
                return startup
            if js == '()=>localStorage.getItem(RealmCharacters.KEY)':
                return NEW_AUTOSAVE if h.reopened else BEFORE
            raise AssertionError('Unexpected external read: ' + js)

        def close_context():
            h.raw = closed_raw
            h.row['nativeWrites'] += 1

        def start():
            h.reopened = True
            h.raw = NEW_AUTOSAVE
            h.row['nativeWrites'] += 1

        h.ev = ev
        h.context = type('ControlledExternalContext', (), {
            'close': lambda context: close_context()})()
        h.start = start
        return h

    def comparison(self, h):
        rows = h.row.get('restartComparisons')
        self.assertIsInstance(rows, list, 'restart operands must survive a failed assertion')
        self.assertEqual(len(rows), 1)
        return rows[0]

    def test_terminal_write_and_new_autosave_do_not_replace_immutable_expectation(self):
        with tempfile.TemporaryDirectory(prefix='fl-restart-cpu-') as tmp:
            folder = Path(tmp)
            h = self.driver(folder, EXPECTED)
            h.restart('PARTIAL')
            row = self.comparison(h)
            self.assertTrue(row['matched'])
            self.assertEqual(row['expectedClose'], {
                'kind': 'string', 'utf8Bytes': len(EXPECTED.encode('utf-8')),
                'sha256': hashlib.sha256(EXPECTED.encode('utf-8')).hexdigest()})
            self.assertEqual(row['actualStartup'], row['expectedClose'])
            self.assertEqual(row['beforeClose']['sha256'], hashlib.sha256(BEFORE.encode()).hexdigest())
            self.assertEqual(row['observedWrites'], {'beforeClose': 9, 'afterClose': 10, 'afterStart': 11})
            self.assertEqual((folder / 'PARTIAL_CLOSED_NATIVE_BYTES.json').read_text(encoding='utf-8'), EXPECTED)
            self.assertFalse((folder / 'PARTIAL_STARTUP_NATIVE_BYTES.json').exists())
            self.assertEqual(h.row['restarts'], ['PARTIAL'])

    def test_one_byte_whitespace_mismatch_keeps_exact_refusal_and_both_operands(self):
        with tempfile.TemporaryDirectory(prefix='fl-restart-cpu-') as tmp:
            folder = Path(tmp)
            actual = EXPECTED + ' '
            self.assertEqual(json.loads(actual), json.loads(EXPECTED))
            h = self.driver(folder, actual)
            with self.assertRaisesRegex(AssertionError, 'startup reads exact final native bytes'):
                h.restart('PARTIAL')
            row = self.comparison(h)
            self.assertFalse(row['matched'])
            self.assertNotEqual(row['actualStartup']['sha256'], row['expectedClose']['sha256'])
            self.assertEqual(row['actualStartup']['utf8Bytes'], row['expectedClose']['utf8Bytes'] + 1)
            self.assertEqual((folder / 'PARTIAL_STARTUP_NATIVE_BYTES.json').read_text(encoding='utf-8'), actual)
            self.assertEqual(h.row['restarts'], [])

    def test_missing_startup_is_retained_as_null_not_empty_or_omitted(self):
        with tempfile.TemporaryDirectory(prefix='fl-restart-cpu-') as tmp:
            folder = Path(tmp)
            h = self.driver(folder, None)
            with self.assertRaisesRegex(AssertionError, 'startup reads exact final native bytes'):
                h.restart('PARTIAL')
            row = self.comparison(h)
            self.assertEqual(row['actualStartup'], {'kind': 'null', 'utf8Bytes': None, 'sha256': None})
            self.assertFalse(row['matched'])
            self.assertIsNone(json.loads((folder / 'PARTIAL_STARTUP_NATIVE_BYTES.json').read_text(encoding='utf-8')))
            self.assertEqual(h.row['restarts'], [])

    def test_missed_console_write_is_diagnosed_and_never_backfilled_to_pass(self):
        with tempfile.TemporaryDirectory(prefix='fl-restart-cpu-') as tmp:
            h = self.driver(Path(tmp), EXPECTED, closed_raw=BEFORE)
            with self.assertRaisesRegex(AssertionError, 'startup reads exact final native bytes'):
                h.restart('PARTIAL')
            row = self.comparison(h)
            self.assertEqual(row['expectedClose'], row['beforeClose'])
            self.assertNotEqual(row['actualStartup'], row['expectedClose'])
            self.assertFalse(row['matched'])
            self.assertEqual(h.row['restarts'], [])

    def test_capture_collision_preserves_file_and_original_mismatch_failure(self):
        with tempfile.TemporaryDirectory(prefix='fl-restart-cpu-') as tmp:
            folder = Path(tmp)
            target = folder / 'PARTIAL_STARTUP_NATIVE_BYTES.json'
            target.write_text('retained earlier evidence', encoding='utf-8')
            h = self.driver(folder, EXPECTED + ' ')
            with self.assertRaisesRegex(AssertionError, 'startup reads exact final native bytes'):
                h.restart('PARTIAL')
            row = self.comparison(h)
            self.assertIn('FileExistsError', row['startupEvidenceError'])
            self.assertEqual(target.read_text(encoding='utf-8'), 'retained earlier evidence')
            self.assertFalse(row['matched'])
            self.assertEqual(h.row['restarts'], [])

    def test_matching_bytes_cannot_hide_lost_owner_history_or_record_success(self):
        with tempfile.TemporaryDirectory(prefix='fl-restart-cpu-') as tmp:
            h = self.driver(Path(tmp), EXPECTED, changed_history=True)
            with self.assertRaisesRegex(AssertionError, 'whole browser restart preserves saved checkpoint and owner facts'):
                h.restart('PARTIAL')
            self.assertTrue(self.comparison(h)['matched'])
            self.assertEqual(h.row['restarts'], [])


if __name__ == '__main__':
    unittest.main()
