"""Synthetic resource-ownership unit tests; no browser, Core or admission run.

Only the actual patched main/finally AST is executed. Admission, imports, server,
thread and native resource boundaries are explicitly mocked. No native report
is written or claimed. CPU fixture directories remain retained outside ROOT.
"""
from pathlib import Path
import argparse,ast,copy,hashlib,json,os,sys,tempfile,threading,traceback,types,unittest
from unittest import mock
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('FIRSTLIGHT_ROOT',str(HERE.parent))).resolve()
SOURCE=ROOT/'tools/road_account_browser.py'
OUTPUT=Path(os.environ.get('ROAD_ACCOUNT_STARTUP_CPU_OUTPUT',tempfile.gettempdir())).resolve()
assert OUTPUT.is_dir() and OUTPUT!=ROOT and ROOT not in OUTPUT.parents,'Owned CPU temporary output must stay outside the checkout'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
raw=SOURCE.read_bytes();text=raw.decode('utf-8').replace('\r\n','\n')
OUTSIDE_MAIN_AST_SHA='668b3fbe327fb221a0565215637e788ce2e9180f25df89cc3b0948248f5f6d5f'
PREFLIGHT_PREFIX_SHA='99d479249eee5ca765ac6b861e3e1ad49899640b7d026fbc0db941d6b13d3faa'
TREE=ast.parse(text);MAIN=next(n for n in TREE.body if isinstance(n,ast.FunctionDef) and n.name=='main')
TRY=next(n for n in MAIN.body if isinstance(n,ast.Try))
RECEIPTS=[]
def need(ok,message):
 if not ok:raise ValueError(message)
def fixture(mode):
 folder=Path(tempfile.mkdtemp(prefix='retained-startup-cpu-',dir=OUTPUT));root=folder/'UNUSED-SYNTHETIC-ROOT';out=folder/'output'
 events=[];reports=[];server=types.SimpleNamespace(server_port=12345);threads=[]
 def shutdown():
  events.append('shutdown')
  if mode in ('shutdown','run-and-shutdown'):raise RuntimeError('shutdown-sentinel')
  for t in threads:t.alive=False
 def close():
  events.append('server_close')
  if mode=='close':raise RuntimeError('close-sentinel')
 server.shutdown=shutdown;server.server_close=close;server.serve_forever=lambda:events.append('mock_serve_entry')
 def server_factory(*args):
  events.append('server_construct')
  if mode=='server':raise RuntimeError('server-sentinel')
  return server
 class Thread:
  def __init__(self,**kwargs):events.append('thread_construct');self.target=kwargs['target'];self.ident=None;self.alive=False;threads.append(self)
  def start(self):
   events.append('thread_start')
   if mode=='thread':raise RuntimeError('thread-sentinel')
   self.ident=1;self.alive=True
   if mode not in ('unentered','stalled'):self.target()
   if mode=='thread-partial':raise RuntimeError('thread-after-identity-sentinel')
  def is_alive(self):return self.alive
  def join(self,timeout):
   events.append('thread_join');assert timeout==5
   if mode=='unentered':self.target();self.alive=False
   elif mode!='stalled':self.alive=False
 class Native:
  def __init__(self,*args):events.append('native_construct')
  def run_account(self,*args):events.append('native_case');raise RuntimeError('native-case-sentinel')
  def finish(self):events.append('native_finish')
 class PW:
  def __enter__(self):events.append('playwright_enter');return object()
  def __exit__(self,*args):events.append('playwright_exit')
 def load(*args):
  events.append('helper_load')
  if mode=='helper':raise RuntimeError('helper-sentinel')
  def base(*args):
   events.append('base_load')
   if mode=='base':raise RuntimeError('base-sentinel')
   return object()
  return types.SimpleNamespace(load_base=base)
 def dump(path,value):
  events.append('report_attempt');reports.append((str(path),copy.deepcopy(value)))
  if mode=='write':raise OSError('write-sentinel')
 epoch={'head':'1'*40,'htmlSha256':'2'*64,'runtimeSources':{}}
 namespace={'__file__':str(SOURCE),'Path':Path,'argparse':argparse,'sys':sys,'json':json,'need':need,'sha':sha,'read':lambda p:{'schema':'road-account-native-checkpoints-v2','provenance':'synthetic-unit-preflight'},
  'admit_inputs':lambda *a:({'signed-loop':{},'cleared-pocket':{}},{},{'head':epoch['head'],'html_sha256':epoch['htmlSha256']}),
  'installed_epoch':lambda *a:epoch,'BUDGETS':{'caseSeconds':1800},'load':load,'driver_class':lambda *a:Native,
  'SimpleHTTPRequestHandler':object,'ThreadingHTTPServer':server_factory,'threading':types.SimpleNamespace(Thread=Thread,Event=threading.Event),
  'traceback':traceback,'dump':dump}
 exec(compile(ast.Module(body=[copy.deepcopy(MAIN)],type_ignores=[]),'actual-patched-main-only','exec'),namespace)
 modules={'playwright':types.ModuleType('playwright'),'playwright.sync_api':types.ModuleType('playwright.sync_api')}
 modules['playwright.sync_api'].sync_playwright=lambda:PW()
 if mode=='import':modules['playwright.sync_api']=None
 args=['--root',str(root),'--inputs',str(folder/'unit-inputs.json'),'--expectations',str(folder/'unit-expectations.json'),'--output',str(out),'--expected-head',epoch['head'],'--renderer','software']
 return types.SimpleNamespace(folder=folder,root=root,out=out,events=events,reports=reports,server=server,threads=threads,namespace=namespace,modules=modules,args=args)
class Startup(unittest.TestCase):
 def test_readonly_preflight_never_imports_starts_resources_or_creates_output(self):
  f=fixture('import')
  with mock.patch.dict(sys.modules,f.modules),mock.patch('sys.stdout'):f.namespace['main'](f.args)
  self.assertFalse(f.out.exists());self.assertEqual(f.events,[]);self.assertEqual(f.reports,[])
 def test_output_creation_failure_preserves_original_error_without_claiming_report(self):
  for race in (False,True):
   with self.subTest(racedOtherOwner=race):
    f=fixture('output-race' if race else 'output');original=Path.mkdir
    def mkdir(p,*args,**kwargs):
     if p==f.out:
      if race:original(p,*args,**kwargs);raise FileExistsError('other-owner-sentinel')
      raise OSError('output-sentinel')
     return original(p,*args,**kwargs)
    with mock.patch.dict(sys.modules,f.modules),mock.patch.object(Path,'mkdir',mkdir),self.assertRaisesRegex(OSError,'other-owner-sentinel' if race else 'output-sentinel'):f.namespace['main'](f.args+['--execute'])
    self.assertEqual(f.out.is_dir(),race);self.assertEqual(f.reports,[]);self.assertEqual(f.events,[])
 def test_each_execute_startup_failure_is_reported_when_output_exists_and_closes_partial_server(self):
  for mode,stage,marker in [('import','playwright-import',None),('helper','original-helper-load','helper-sentinel'),('base','original-helper-load','base-sentinel'),('server','server-construction','server-sentinel'),('thread','server-thread','thread-sentinel'),('thread-partial','server-thread','thread-after-identity-sentinel'),('run','native-cases','native-case-sentinel'),('unentered','native-cases','native-case-sentinel'),('stalled','native-cases','native-case-sentinel')]:
   with self.subTest(mode=mode):
    f=fixture(mode)
    with mock.patch.dict(sys.modules,f.modules),self.assertRaises(Exception) as raised:f.namespace['main'](f.args+['--execute'])
    if marker:self.assertIn(marker,str(raised.exception))
    self.assertTrue(f.out.is_dir());self.assertEqual(len(f.reports),1);report=f.reports[0][1]
    self.assertEqual(report['status'],'failed');self.assertEqual(report['startupStage'],stage);self.assertTrue(report['errors']);self.assertEqual(report['serverClosed'],mode!='stalled')
    if mode=='thread':self.assertIn('server_close',f.events);self.assertNotIn('shutdown',f.events);self.assertFalse(report['serverStarted'])
    elif mode=='thread-partial':self.assertTrue(report['serverStarted']);self.assertIn('shutdown',f.events);self.assertIn('thread_join',f.events)
    elif mode=='run':self.assertTrue(report['serverStarted']);self.assertIn('shutdown',f.events);self.assertIn('native_finish',f.events);self.assertIn('playwright_exit',f.events)
    elif mode in ('unentered','stalled'):
     self.assertNotIn('shutdown',f.events);self.assertIn('server_close',f.events);self.assertIn('thread_join',f.events);self.assertTrue(report['serverSocketClosed']);self.assertEqual(report['serverThreadClosed'],mode=='unentered')
     if mode=='stalled':self.assertIn('did not close within 5 seconds',report['errors'][-1])
    else:self.assertNotIn('server_close',f.events);self.assertFalse(report['serverAllocated'])
    RECEIPTS.append({'mockStage':stage,'mode':mode,'sentinel':marker,'status':report['status'],'serverAllocated':report['serverAllocated'],'serverStarted':report['serverStarted'],'serverClosed':report['serverClosed'],'events':f.events,'reportCapturedOnly':True})
 def test_run_error_survives_shutdown_error_and_socket_close_is_still_attempted(self):
  f=fixture('run-and-shutdown')
  with mock.patch.dict(sys.modules,f.modules),self.assertRaisesRegex(RuntimeError,'native-case-sentinel'):f.namespace['main'](f.args+['--execute'])
  report=f.reports[0][1];self.assertEqual(report['status'],'failed');self.assertEqual(len(report['errors']),2);self.assertIn('native-case-sentinel',report['errors'][0]);self.assertIn('shutdown-sentinel',report['errors'][1]);self.assertIn('server_close',f.events)
 def test_run_error_survives_failed_report_write_with_stderr_evidence(self):
  f=fixture('write')
  with mock.patch.dict(sys.modules,f.modules),mock.patch('sys.stderr') as stderr,self.assertRaisesRegex(RuntimeError,'native-case-sentinel'):f.namespace['main'](f.args+['--execute'])
  self.assertIn('server_close',f.events);self.assertTrue(stderr.write.called);self.assertEqual(len(f.reports),1)
 def test_actual_finally_raises_closure_only_failure_after_capturing_failed_report(self):
  for mode,marker in [('shutdown','shutdown-sentinel'),('close','close-sentinel')]:
   with self.subTest(mode=mode):
    f=fixture(mode);f.out.mkdir();report={'status':'passed','errors':[]}
    fn=ast.FunctionDef(name='close_only',args=ast.arguments(posonlyargs=[],args=[ast.arg(arg=x) for x in ['server','server_started','failure','report','a','server_thread','serve_entered','stop_requested','output_owned']],kwonlyargs=[],kw_defaults=[],defaults=[]),body=copy.deepcopy(TRY.finalbody),decorator_list=[])
    tree=ast.fix_missing_locations(ast.Module(body=[fn],type_ignores=[]));exec(compile(tree,'actual-finally-only','exec'),f.namespace)
    t=f.namespace['threading'].Thread(target=lambda:None);t.ident=1;t.alive=True;entered=threading.Event();entered.set()
    with self.assertRaisesRegex(RuntimeError,marker):f.namespace['close_only'](f.server,True,None,report,types.SimpleNamespace(output=f.out),t,entered,threading.Event(),True)
    self.assertEqual(len(f.reports),1);self.assertEqual(f.reports[0][1]['status'],'failed');self.assertIn('server_close',f.events)
    if mode=='close':self.assertFalse(f.reports[0][1]['serverClosed'])
 def test_patch_changes_only_main_and_retains_exact_readonly_prefix_native_methods_and_probes(self):
  outside=ast.dump(ast.Module(body=[x for x in TREE.body if not isinstance(x,ast.FunctionDef) or x.name!='main'],type_ignores=[]),include_attributes=False)
  self.assertEqual(hashlib.sha256(outside.encode()).hexdigest(),OUTSIDE_MAIN_AST_SHA)
  prefix=text.split(' # Resource ownership starts')[0]
  self.assertEqual(hashlib.sha256(prefix.encode()).hexdigest(),PREFLIGHT_PREFIX_SHA)
  self.assertIn('if output_owned and a.output.is_dir():',text)
  self.assertIn('serve_entered.wait(timeout=1)',text);self.assertIn('server_thread.join(timeout=5)',text)
if __name__=='__main__':
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Startup))
 # Direct calls also preserve earlier CPU receipts in a shared external TEMP.
 with tempfile.NamedTemporaryFile(mode='w',prefix='retained-startup-cpu-receipt-',suffix='.json',dir=OUTPUT,delete=False,encoding='utf-8') as receipt:
  receipt.write(json.dumps({'cpuOnly':True,'mockedResourceOwnershipOnly':True,'actualCoreExecuted':False,'browserExecuted':False,'driverAdmissionExecuted':False,'nativeReportWritten':False,'tests':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skips':len(result.skipped),'observedDriverTextSHA256':hashlib.sha256(text.encode()).hexdigest(),'mockStartupRows':RECEIPTS},indent=2)+'\n')
 sys.exit(not result.wasSuccessful())
