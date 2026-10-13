"""CPU-only admission/dispatch tests. Fake allocations are not browser evidence."""
from pathlib import Path
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('firstlight_browser_budget', ROOT/'tools/browser_budget.py')
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)


class Admission(unittest.TestCase):
    def test_fresh_probe_before_each_allocation_even_with_reused_options(self):
        values = iter([B.MINIMUM_FREE_KIB, B.MINIMUM_FREE_KIB-1])
        events, calls = [], []
        gate = B.AllocationGate(lambda: next(values), events.append)
        sentinel = object()
        def original(*args, **kwargs):
            calls.append((args, kwargs)); return sentinel
        launch = gate.wrap(original, 'launch_persistent_context')
        options = dict(headless=True, args=['--use-angle=swiftshader'])
        self.assertIs(launch('task-profile', **options), sentinel)
        with self.assertRaises(B.MemoryAdmissionError): launch('task-profile', **options)
        self.assertEqual(calls, [(('task-profile',), options)])
        self.assertEqual([e['event'] for e in events], ['admission', 'allocated', 'admission'])
        self.assertTrue(events[0]['admitted']); self.assertFalse(events[-1]['admitted'])
        self.assertTrue(gate.failed)

    def test_unavailable_or_invalid_probe_never_calls_allocator(self):
        for value in (None, True, -1, float('nan'), '7000000'):
            with self.subTest(value=value):
                calls=[]; events=[]; gate=B.AllocationGate(lambda:value, events.append)
                with self.assertRaises(B.MemoryAdmissionError):
                    gate.wrap(lambda:calls.append(1),'launch')()
                self.assertFalse(calls); self.assertTrue(gate.failed)
                self.assertEqual(events[-1]['event'], 'probe-error')
        events=[]; gate=B.AllocationGate(lambda:(_ for _ in ()).throw(OSError('probe unavailable')), events.append)
        with self.assertRaises(B.MemoryAdmissionError): gate.wrap(lambda:self.fail('allocated'),'launch')()
        self.assertIn('probe unavailable', events[0]['error'])

    def test_original_launch_exception_is_preserved_and_marks_gate_failed(self):
        failure=RuntimeError('browser startup refused'); events=[]
        gate=B.AllocationGate(lambda:B.MINIMUM_FREE_KIB+1, events.append)
        with self.assertRaises(RuntimeError) as caught:
            gate.wrap(lambda:(_ for _ in ()).throw(failure),'launch')()
        self.assertIs(caught.exception, failure); self.assertTrue(gate.failed)
        self.assertEqual(events[-1]['event'], 'allocation-error')

    def test_unwritable_admission_receipt_prevents_allocation(self):
        calls=[]
        def emit(_):raise OSError('receipt unavailable')
        gate=B.AllocationGate(lambda:B.MINIMUM_FREE_KIB+1, emit)
        with self.assertRaises(OSError):gate.wrap(lambda:calls.append(1),'launch')()
        self.assertFalse(calls);self.assertTrue(gate.failed)

    def test_receipt_failure_after_allocation_closes_only_that_owned_result(self):
        class Owned:
            closed=False
            def close(self):self.closed=True
        owned=Owned();events=[]
        def emit(row):
            events.append(row)
            if row['event']=='allocated':raise OSError('post-launch receipt unavailable')
        gate=B.AllocationGate(lambda:B.MINIMUM_FREE_KIB,emit)
        with self.assertRaises(OSError):gate.wrap(lambda:owned,'launch')()
        self.assertTrue(owned.closed);self.assertTrue(gate.failed)

    def test_failed_owned_close_is_not_hidden_by_receipt_failure(self):
        class Owned:
            def close(self):raise RuntimeError('close also failed')
        def emit(row):
            if row['event']=='allocated':raise OSError('receipt unavailable')
        gate=B.AllocationGate(lambda:B.MINIMUM_FREE_KIB,emit)
        with self.assertRaisesRegex(RuntimeError,'owned close failed') as caught:
            gate.wrap(lambda:Owned(),'launch')()
        self.assertIn('close also failed',str(caught.exception.__cause__))
        self.assertTrue(gate.failed)

    def test_patches_only_the_two_local_sync_allocation_methods_and_restores(self):
        class BrowserType:
            def launch(self, **kwargs):return ('browser',kwargs)
            def launch_persistent_context(self, path, **kwargs):return (path,kwargs)
        original=BrowserType.launch; gate=B.AllocationGate(lambda:B.MINIMUM_FREE_KIB, lambda _:None)
        with B.patched_allocations(BrowserType,gate):
            self.assertEqual(BrowserType().launch(headless=True),('browser',{'headless':True}))
            self.assertEqual(BrowserType().launch_persistent_context('owned'),('owned',{}))
            self.assertIsNot(BrowserType.launch, original)
        self.assertIs(BrowserType.launch, original)

    def test_suite_cannot_hide_caught_receipt_failure_with_a_zero_exit(self):
        class BrowserType:
            def launch(self):raise AssertionError('must never allocate')
            def launch_persistent_context(self):raise AssertionError('must never allocate')
        def emit(_):raise OSError('receipt disk unavailable')
        gate=B.AllocationGate(lambda:B.MINIMUM_FREE_KIB,emit)
        def suite(*_):
            try:BrowserType().launch()
            except OSError:pass
        with patch.object(B,'execute_target',suite):
            result=B.run_suite('unused',[],browser_type=BrowserType,gate=gate,
                               root=ROOT,output=ROOT,run_id='cpu-fixture')
        self.assertEqual(result,3)

    def test_suite_preserves_nonzero_original_exit(self):
        class BrowserType:
            def launch(self):pass
            def launch_persistent_context(self):pass
        gate=B.AllocationGate(lambda:B.MINIMUM_FREE_KIB,lambda _:None)
        with patch.object(B,'execute_target',side_effect=SystemExit(9)):
            result=B.run_suite('unused',[],browser_type=BrowserType,gate=gate,
                               root=ROOT,output=ROOT,run_id='cpu-fixture')
        self.assertEqual(result,9)


class ChildDispatch(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='firstlight-budget-cpu-')
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name); (self.root/'tools').mkdir()
        self.child=self.root/'tools/child.py'; self.child.write_text('# synthetic CPU fixture\n')
        self.out=self.root/'receipts'

    def route(self, command, **kw):
        return B.python_child_command(command, cwd=kw.get('cwd', self.root), root=self.root,
                                      output=self.out, run_id='fixture-run')

    def test_node_and_git_commands_remain_exact(self):
        for command in (['node','tests/earned.cjs','--output','folder'],['git','rev-parse','HEAD']):
            self.assertEqual(self.route(command),command)

    def test_python_child_uses_same_interpreter_and_guard_with_original_arguments(self):
        original=[sys.executable,'-B',str(self.child),'--root',str(self.root),'--label','two words']
        routed=self.route(original)
        self.assertEqual(routed[:3],[sys.executable,'-B',str(B.RUNNER)])
        self.assertIn('--child-run',routed); self.assertIn('fixture-run',routed)
        self.assertEqual(routed[routed.index('--')+1:],original[2:])

    def test_relative_script_resolves_against_child_cwd(self):
        routed=self.route([sys.executable,'child.py','--x'],cwd=self.root/'tools')
        self.assertEqual(routed[routed.index('--')+1:],[str(self.child),'--x'])

    def test_unknown_python_shapes_outside_scripts_and_runner_recursion_refuse(self):
        for command in ([sys.executable,'-m','something'],[sys.executable,'-c','pass'],
                        [sys.executable,'-I',str(self.child)], [sys.executable,str(self.root.parent/'outside.py')],
                        [sys.executable,str(B.RUNNER)], 'python tools/child.py'):
            with self.subTest(command=command):
                with self.assertRaises(ValueError):self.route(command)

    def test_popen_forwarding_keeps_process_options_and_restores_original(self):
        calls=[]
        def original(*args,**kwargs):calls.append((args,kwargs)); return 'process'
        with patch.object(subprocess,'Popen',original):
            with B.patched_children(self.root,self.out,'fixture-run'):
                result=subprocess.Popen([sys.executable,str(self.child)],cwd=self.root,stdout=subprocess.PIPE)
                self.assertEqual(result,'process')
                with self.assertRaises(ValueError):subprocess.Popen('python whatever',shell=True)
            self.assertIs(subprocess.Popen,original)
        self.assertEqual(calls[0][1],dict(cwd=self.root,stdout=subprocess.PIPE))
        self.assertIn(str(B.RUNNER),calls[0][0][0])

    def test_caught_child_dispatch_refusal_is_retained_and_real_child_is_registered(self):
        refused=[]; children=[]; process=object()
        with patch.object(subprocess,'Popen',lambda *a,**k:process):
            with B.patched_children(self.root,self.out,'fixture-run',on_refusal=refused.append,children=children):
                with self.assertRaises(ValueError):subprocess.Popen([sys.executable,'-c','pass'])
                self.assertIs(subprocess.Popen([sys.executable,str(self.child)]),process)
                self.assertIs(subprocess.Popen(['node','earned.cjs']),process)
        self.assertEqual(len(refused),1);self.assertEqual(children,[process])


class ChildFinalization(unittest.TestCase):
    class Child:
        pid=12345
        def __init__(self, code=None, timeouts=0, fail_cleanup=False):
            self.code=code;self.timeouts=timeouts;self.fail_cleanup=fail_cleanup;self.calls=[]
        def poll(self):return self.code
        def wait(self,timeout):
            self.calls.append(('wait',timeout))
            if self.timeouts:
                self.timeouts-=1
                raise subprocess.TimeoutExpired('owned fixture',timeout)
            self.code=0;return self.code
        def terminate(self):
            self.calls.append(('terminate',))
            if self.fail_cleanup:raise OSError('owned cleanup failed')
        def kill(self):self.calls.append(('kill',))

    def test_completed_children_keep_original_status_without_cleanup(self):
        for code in (0,1):
            child=self.Child(code);rows=[]
            self.assertEqual(B.finish_children([child],rows.append),code!=0)
            self.assertEqual(child.calls,[]);self.assertEqual(rows[0]['exitCode'],code)

    def test_unfinished_owned_child_is_bounded_and_never_counts_as_pass(self):
        child=self.Child(timeouts=2);rows=[]
        self.assertTrue(B.finish_children([child],rows.append))
        self.assertEqual(child.calls,[('wait',5),('terminate',),('wait',5),('kill',),('wait',5)])
        self.assertTrue(rows[0]['unfinishedAtSuiteExit'])
        self.assertEqual(rows[0]['cleanupExitCode'],0)

    def test_receipt_or_cleanup_failure_does_not_abandon_later_owned_child(self):
        first=self.Child(timeouts=1,fail_cleanup=True);second=self.Child(timeouts=1)
        rows=[]
        def emit(row):rows.append(row);raise OSError('receipt failed')
        self.assertTrue(B.finish_children([first,second],emit))
        self.assertIn('owned cleanup failed',rows[0]['cleanupError'])
        self.assertIn(('terminate',),second.calls);self.assertEqual(second.code,0)


class TargetAndLedger(unittest.TestCase):
    def test_target_has_own_main_file_parent_path_cwd_and_argv(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-target-cpu-') as temp:
            base=Path(temp); target=base/'target.py'; marker=base/'result.json'
            target.write_text('import json,sys,os\nfrom pathlib import Path\n'
                              'Path(sys.argv[1]).write_text(json.dumps([__name__,__file__,sys.path[0],sys.argv[1:],os.getcwd()]))\n')
            before_argv=sys.argv[:]; before_path=sys.path[:]; cwd=Path.cwd()
            B.execute_target(target,[str(marker),'two words'])
            result=json.loads(marker.read_text())
            self.assertEqual(result,['__main__',str(target),str(base),[str(marker),'two words'],str(cwd)])
            self.assertEqual(sys.argv,before_argv); self.assertEqual(sys.path,before_path)

    def test_ledger_requires_all_started_processes_finished_without_refusal(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-ledger-cpu-') as temp:
            base=Path(temp); p=base/'process-one.jsonl'
            def write(events):p.write_text(''.join(json.dumps(e)+'\n' for e in events))
            start=dict(event='process-start',runId='fixture-run')
            end=dict(event='process-finish',runId='fixture-run',exitCode=0)
            write([start,end]);self.assertEqual(B.audit_process_logs(base,'fixture-run'),1)
            for events in ([start], [start,{**end,'exitCode':3}],
                           [start,dict(event='admission',admitted=False),end],
                           [start,dict(event='allocation-error'),end],
                           [start,{**end,'runId':'different'}]):
                write(events)
                with self.assertRaises(ValueError):B.audit_process_logs(base,'fixture-run')

    def test_temp_environment_is_bounded_and_set_before_dependency_import(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-env-cpu-') as temp:
            base=Path(temp)/'owned'; base.mkdir()
            with patch.dict(B.os.environ,{},clear=True):
                B.configure_temp(base,windows=False)
                for key in ('TEMP','TMP','TMPDIR'):self.assertEqual(B.os.environ[key],str(base))
                with self.assertRaises(ValueError):B.configure_temp(Path(temp)/'missing',windows=False)
                with self.assertRaises(ValueError):B.configure_temp(Path('relative'),windows=False)
                with self.assertRaises(ValueError):B.configure_temp(Path(base.anchor),windows=False)


if __name__=='__main__':unittest.main(verbosity=2)
