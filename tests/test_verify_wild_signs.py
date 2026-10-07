"""Portable routing safeguards. Miniature preflight hosts never certify gameplay."""
from pathlib import Path
import importlib.util, os, subprocess, tempfile, unittest
HERE=Path(__file__).resolve().parent
def load():
 root=Path(os.environ.get('FIRSTLIGHT_ROOT',str(HERE.parent))).resolve()
 target=Path(os.environ.get('FIRSTLIGHT_VERIFY_MODULE',str(root/'tools/verify.py'))).resolve()
 spec=importlib.util.spec_from_file_location('wild_signs_verify_routing',target)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
class Routing(unittest.TestCase):
 def setUp(self):
  self.m=load();self.temp=tempfile.TemporaryDirectory(prefix='wild-signs-route-',dir=os.environ.get('TEMP'))
  self.base=Path(self.temp.name);self.root=self.base/'game';self.source=self.base/'earned';self.original=self.base/'original';self.out=self.base/'native'
  for p in (self.root/'tools',self.source,self.original):p.mkdir(parents=True)
  (self.source/'WILD_SIGNS_COHORT.json').write_text('{"label":"CPU routing miniature"}',encoding='utf8')
  (self.original/'FIRST_LOAD_COHORT.json').write_text('{"label":"CPU routing miniature"}',encoding='utf8')
  self.native=self.root/'tools/earth_wild_signs_browser.py'
  self.stub='''from pathlib import Path
def clean_source_tree(root):
    assert (root/'CPU_ROUTING_ONLY').read_text()=='miniature'
def preflight(root,cohort,original):
    assert cohort==root.parent/'earned/WILD_SIGNS_COHORT.json'
    assert original==root.parent/'original/FIRST_LOAD_COHORT.json'
    return [],{},{}
'''
  self.native.write_text(self.stub,encoding='utf8');(self.root/'CPU_ROUTING_ONLY').write_text('miniature',encoding='utf8')
  self.boundary=self.root/'tools/earth_wild_signs_boundaries_browser.py'
  self.boundary.write_text('CPU_ROUTING_MINIATURE=True\n',encoding='utf8')
  # A real, owned miniature Git tree tests committed-caller admission. It has
  # no game, validators, witnesses or inherited hooks. No global config changes.
  command=['git','-c','core.hooksPath='+str(self.root/'NO_HOOKS'),'-c','commit.gpgsign=false',
           '-c','user.name=Firstlight CPU Routing','-c','user.email=cpu-routing@example.invalid','-C',str(self.root)]
  self.git=command
  for args in (['init','-q'],['add','.'],['commit','-qm','Owned CPU routing specimen']):
   subprocess.run(command+args,check=True,capture_output=True)

 def tearDown(self):self.temp.cleanup()
 def route(self,out=None,windows=False):return self.m.wild_signs_browser_run_spec(self.root,self.source,self.original,out or self.out,windows=windows)
 def test_01_readonly_admission_routes_both_cohorts_and_software_without_output(self):
  before={p:p.read_bytes() for p in self.base.rglob('*') if p.is_file()}
  command,env=self.route();self.assertEqual(command[1],'tools/earth_wild_signs_browser.py');self.assertEqual(command[-2:],['--renderer','software'])
  self.assertEqual(command[command.index('--original-cohort')+1],str(self.original/'FIRST_LOAD_COHORT.json'));self.assertEqual(command[command.index('--cohort')+1],str(self.source/'WILD_SIGNS_COHORT.json'))
  self.assertEqual(env['FIRSTLIGHT_ROOT'],str(self.root));self.assertFalse(self.out.exists())
  self.assertEqual({p:p.read_bytes() for p in self.base.rglob('*') if p.is_file()},before)
 def test_02_missing_installed_native_or_either_invocation_cohort_refuses(self):
  for p in (self.native,self.source/'WILD_SIGNS_COHORT.json',self.original/'FIRST_LOAD_COHORT.json'):
   raw=p.read_bytes();p.unlink()
   with self.assertRaisesRegex(ValueError,'both current invocation cohorts'):self.route()
   p.write_bytes(raw)
  self.assertFalse(self.out.exists())
 def test_03_existing_overlapping_and_root_outputs_refuse_before_preflight(self):
  self.native.write_text("raise AssertionError('must refuse before import')",encoding='utf8')
  self.out.mkdir()
  for p in (self.out,self.root,self.root/'nested',self.source,self.source/'nested',self.original,self.original/'nested',self.base,Path(self.base.anchor)):
   with self.assertRaises(ValueError):self.route(p)
 def test_04_windows_heavy_paths_cannot_redirect_to_another_drive(self):
  from pathlib import PureWindowsPath
  if os.name=='nt':
   with self.assertRaisesRegex(ValueError,'stay on D'):self.route(Path('C:/wild-signs-route-must-not-create'),windows=True)
  else:
   with self.assertRaisesRegex(ValueError,'stay on D'):self.route(windows=True)
 def test_05_actual_preflight_refusal_propagates_without_starting_output(self):
  self.native.write_text("def clean_source_tree(root): pass\ndef preflight(*args): raise ValueError('CPU miniature stale cohort')\n",encoding='utf8')
  for args in (['add','.'],['commit','-qm','Committed CPU rejecting admission specimen']):
   subprocess.run(self.git+args,check=True,capture_output=True)
  with self.assertRaisesRegex(ValueError,'stale cohort'):self.route()
  self.assertFalse(self.out.exists())
if __name__=='__main__':unittest.main()
