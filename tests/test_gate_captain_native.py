"""CPU refusal checks for native evidence completeness; no browser allocated."""
from pathlib import Path
import contextlib
import copy
import importlib.util
import io
import json
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('gate_native', ROOT/'tools/gate_captain_browser.py')
N = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(N)


class NativeReportContract(unittest.TestCase):
    def specimen(self):
        return dict(checks=[dict(name='synthetic contract specimen', passed=True)],
                    milestones={k: True for k in N.MILESTONES}, errors=[], browser_errors=[],
                    external_requests=[], source_unchanged=True, clean_source=True,
                    resources=dict(context_closed=True, server_closed=True, profile_removed=True))

    def test_each_missing_milestone_and_open_resource_refuses_completion(self):
        specimens=[]
        for key in N.MILESTONES:
            r=self.specimen();r['milestones'][key]=False;specimens.append(r)
        for key in self.specimen()['resources']:
            r=self.specimen();r['resources'][key]=False;specimens.append(r)
        for r in specimens:
            with tempfile.TemporaryDirectory(prefix='gate-report-cpu-') as folder:
                with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(RuntimeError):
                    N.finish_report(r,Path(folder))
                self.assertFalse(json.loads((Path(folder)/'REPORT.json').read_text())['passed'])

    def test_empty_checks_error_or_source_change_cannot_pass(self):
        for field,value in [('checks',[]),('errors',['synthetic failure']),('browser_errors',['synthetic exception']),
                            ('external_requests',['https://invalid.example']),('source_unchanged',False),('clean_source',False)]:
            r=self.specimen();r[field]=value
            with tempfile.TemporaryDirectory(prefix='gate-report-cpu-') as folder:
                with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(RuntimeError):
                    N.finish_report(r,Path(folder))

    def test_output_cannot_be_a_game_tree_or_relative_path(self):
        for target in [ROOT,ROOT/'evidence',ROOT.parent,Path('relative-evidence')]:
            with self.assertRaises(ValueError):N.output_path(target)


if __name__=='__main__':unittest.main()
