"""CPU terminal-report boundaries; never starts a browser or server."""
import ast, contextlib, io, json, tempfile, unittest
from types import SimpleNamespace
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
# Execute the exact installed pure terminal function without importing the
# browser SDK or changing global module resolution for other CPU suites.
source=ROOT/'tools/masterwork_browser.py'
tree=ast.parse(source.read_text(encoding='utf-8'))
functions=[node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='finish_report']
assert len(functions)==1
namespace={'json':json}
exec(compile(ast.Module(body=functions,type_ignores=[]),str(source),'exec'),namespace)
M=SimpleNamespace(finish_report=namespace['finish_report'])

class TerminalReport(unittest.TestCase):
    def fresh(self):
        return {'checks':[{'name':'actual check','passed':True}], 'errors':[],
                'browser_errors':[], 'source_unchanged':True,
                'resources':{'context_closed':True,'server_closed':True}}
    def test_complete_result_is_recorded_and_existing_evidence_cannot_be_replaced(self):
        with tempfile.TemporaryDirectory(prefix='masterwork-report-cpu-') as directory:
            p=Path(directory);report=self.fresh()
            with contextlib.redirect_stdout(io.StringIO()):M.finish_report(report,p)
            original=(p/'REPORT.json').read_bytes();self.assertTrue(json.loads(original)['passed'])
            with self.assertRaises(FileExistsError):M.finish_report(report,p)
            self.assertEqual((p/'REPORT.json').read_bytes(),original)
    def test_empty_failed_drifted_or_unclosed_proof_always_records_failure_and_raises(self):
        for defect in ('empty','check','exception','page','drift','context','server','missing-resources'):
            with self.subTest(defect=defect),tempfile.TemporaryDirectory(prefix='masterwork-report-cpu-') as directory:
                p=Path(directory);report=self.fresh()
                if defect=='empty':report['checks']=[]
                elif defect=='check':report['checks'][0]['passed']=False
                elif defect=='exception':report['errors'].append('actual failure')
                elif defect=='page':report['browser_errors'].append('page exception')
                elif defect=='drift':report['source_unchanged']=False
                elif defect=='missing-resources':report['resources']={}
                else:report['resources'][defect+'_closed']=False
                with contextlib.redirect_stdout(io.StringIO()),self.assertRaisesRegex(RuntimeError,'incomplete'):
                    M.finish_report(report,p)
                self.assertFalse(json.loads((p/'REPORT.json').read_text())['passed'])

if __name__=='__main__':unittest.main()
