"""CPU refusal/report checks. Importing the caller starts no SDK, server or browser."""
import contextlib
import io
import json
from pathlib import Path
import runpy
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
CALLER = runpy.run_path(str(ROOT/'tools/tournament_browser.py'))


class TournamentEvidenceBoundary(unittest.TestCase):
    def report(self):
        return dict(checks=[dict(name='observed control', passed=True)],
                    milestones={name: True for name in CALLER['MILESTONES']},
                    errors=[], browser_errors=[], external_requests=[],
                    source_unchanged=True, clean_source=True,
                    resources=dict(context_closed=True, server_closed=True, profile_removed=True))

    def test_complete_evidence_can_pass_once_and_never_replace_an_earlier_receipt(self):
        with tempfile.TemporaryDirectory(prefix='rain-cpu-') as directory:
            output = Path(directory)
            with contextlib.redirect_stdout(io.StringIO()):
                CALLER['finish_report'](self.report(), output)
            original = (output/'REPORT.json').read_bytes()
            self.assertIs(json.loads(original)['passed'], True)
            with self.assertRaises(FileExistsError):
                CALLER['finish_report'](self.report(), output)
            self.assertEqual((output/'REPORT.json').read_bytes(), original)

    def test_partial_success_drift_and_unclosed_resources_never_certify_a_journey(self):
        for defect in ('empty', 'failed-check', 'truthy-check', 'missing-gold', 'missing-restart',
                       'exception', 'page-error', 'external', 'dirty', 'drift',
                       'context', 'server', 'profile'):
            with self.subTest(defect=defect), tempfile.TemporaryDirectory(prefix='rain-cpu-') as directory:
                report = self.report()
                if defect == 'empty': report['checks'] = []
                elif defect == 'failed-check': report['checks'][0]['passed'] = False
                elif defect == 'truthy-check': report['checks'][0]['passed'] = 1
                elif defect == 'missing-gold': del report['milestones']['gold']
                elif defect == 'missing-restart': del report['milestones']['cold_result']
                elif defect == 'exception': report['errors'].append('actual exception')
                elif defect == 'page-error': report['browser_errors'].append('actual browser exception')
                elif defect == 'external': report['external_requests'].append('https://external.invalid/')
                elif defect == 'dirty': report['clean_source'] = False
                elif defect == 'drift': report['source_unchanged'] = False
                elif defect == 'profile': report['resources']['profile_removed'] = False
                else: report['resources'][defect+'_closed'] = False
                with contextlib.redirect_stdout(io.StringIO()), self.assertRaisesRegex(RuntimeError, 'incomplete'):
                    CALLER['finish_report'](report, Path(directory))
                self.assertIs(json.loads((Path(directory)/'REPORT.json').read_text(encoding='utf-8'))['passed'], False)

    def test_relative_game_parent_and_existing_outputs_are_refused_without_mutation(self):
        for path in (Path('relative-evidence'), ROOT, ROOT/'inside', ROOT.parent, Path(ROOT.anchor)):
            with self.subTest(path=path), self.assertRaises(ValueError):
                CALLER['output_path'](path)
        # ROOT is on D on the production Windows host. A neighbouring existing
        # directory avoids the host's legitimate C-temp browser-output refusal.
        existing = ROOT.parent.parent
        with self.assertRaises((ValueError, FileExistsError)):
            CALLER['output_path'](existing)


if __name__ == '__main__':
    unittest.main()
