"""Verifier routing boundaries only; miniature source stubs do not prove gameplay."""
import hashlib,json,os,tempfile,types,unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
if (ROOT/'tools/verify.py').is_file():
    import importlib.util
    spec=importlib.util.spec_from_file_location('actual_consignment_verifier',ROOT/'tools/verify.py');V=importlib.util.module_from_spec(spec);spec.loader.exec_module(V)
else:
    from wire_consignment_verifier import prepare
    V=types.ModuleType('proposed_consignment_verifier');V.__file__=str(ROOT/'tools/verify.py');exec(compile(prepare()['tools/verify.py'],V.__file__,'exec'),V.__dict__)
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()

class CurrentNativeRouting(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.base=Path(self.temp.name);self.root=self.base/'mini-game';self.source=self.base/'current-earned';self.output=self.base/'native-evidence'
        for p in (self.root/'tools',self.root/'tests',self.root/'src',self.source):p.mkdir(parents=True,exist_ok=True)
        (self.root/'tests/earth_expedition_journey.cjs').write_text('// miniature provenance caller',encoding='utf-8')
        (self.root/'src/sample.js').write_text('// miniature source',encoding='utf-8')
        (self.root/'index.html').write_text('<html>miniature</html>',encoding='utf-8')
        (self.root/'tools/earth_consignment_browser.py').write_text("import hashlib\nfrom pathlib import Path\ndef cohort(path,root=None): return {}\ndef build_epoch(root): return hashlib.sha256((Path(root)/'index.html').read_bytes()).hexdigest()\n",encoding='utf-8')
        self.epoch={'mode':'current-command-earned','htmlSha256':sha(self.root/'index.html'),'callerSha256':sha(self.root/'tests/earth_expedition_journey.cjs'),'runtimeSources':{'src/sample.js':sha(self.root/'src/sample.js')}};self.write()
    def tearDown(self):self.temp.cleanup()
    def write(self):
        (self.source/'FIRST_LOAD_COHORT.json').write_text(json.dumps({'schema':'first-load-native-cohort-v1','epoch':self.epoch}),encoding='utf-8')
    def run_spec(self,**kwargs):return V.consignment_browser_run_spec(self.root,self.source,self.output,windows=False,**kwargs)
    def test_current_read_only_spec_requires_exact_sources_and_does_not_create_output(self):
        command,env=self.run_spec();self.assertIn(str(self.source/'FIRST_LOAD_COHORT.json'),command);self.assertIn('--renderer',command);self.assertEqual(command[-1],'software');self.assertEqual(env['FIRSTLIGHT_ROOT'],str(self.root));self.assertFalse(self.output.exists())
    def test_historical_mode_or_absent_current_manifest_cannot_backfill(self):
        self.epoch['mode']='historical-native03';self.write()
        with self.assertRaises(ValueError):self.run_spec()
        (self.source/'FIRST_LOAD_COHORT.json').unlink()
        with self.assertRaises(ValueError):self.run_spec()
    def test_caller_drift_refuses_before_native_import(self):
        (self.root/'tests/earth_expedition_journey.cjs').write_text('// changed caller',encoding='utf-8')
        with self.assertRaises(ValueError):self.run_spec()
    def test_missing_added_or_modified_source_refuses(self):
        p=self.root/'src/sample.js';original=p.read_bytes();p.write_text('// changed',encoding='utf-8')
        with self.assertRaises(ValueError):self.run_spec()
        p.write_bytes(original);extra=self.root/'src/another.js';extra.write_text('// added',encoding='utf-8')
        with self.assertRaises(ValueError):self.run_spec()
        extra.unlink();p.unlink()
        with self.assertRaises(ValueError):self.run_spec()
    def test_path_escape_and_partial_membership_refuse(self):
        outside=self.base/'outside.js';outside.write_text('// outside',encoding='utf-8');self.epoch['runtimeSources']={'../outside.js':sha(outside)};self.write()
        with self.assertRaises(ValueError):self.run_spec()
        self.epoch['runtimeSources']={};self.write()
        with self.assertRaises(ValueError):self.run_spec()
    def test_build_drift_refuses_without_native_profile(self):
        (self.root/'index.html').write_text('<html>other</html>',encoding='utf-8')
        with self.assertRaises(ValueError):self.run_spec()
        self.assertFalse(self.output.exists())
    def test_prior_output_or_source_overlap_is_preserved(self):
        self.output.mkdir();keep=self.output/'failure.txt';keep.write_text('retain',encoding='utf-8')
        with self.assertRaises(ValueError):self.run_spec()
        self.assertEqual(keep.read_text(),'retain');self.output=self.source/'nested'
        with self.assertRaises(ValueError):self.run_spec()
    def test_windows_heavy_paths_require_data_drive(self):
        target=Path('C:/firstlight-guard-test')/self.base.name/'new-native'
        with self.assertRaisesRegex(ValueError,'stay on D on Windows'):
            V.consignment_browser_run_spec(self.root,self.source,target,windows=True)
        self.assertFalse(target.exists());self.assertFalse(self.output.exists())
    def test_windows_data_drive_spec_is_read_only_and_creates_no_output(self):
        if os.name!='nt' or self.base.drive.upper()!='D:':
            self.skipTest('Positive Windows D-drive guard needs a miniature fixture on D:')
        before={str(p.relative_to(self.base)):sha(p)for p in self.base.rglob('*')if p.is_file()}
        command,env=V.consignment_browser_run_spec(self.root,self.source,self.output,windows=True)
        self.assertEqual(command[command.index('--output')+1],str(self.output));self.assertEqual(env['FIRSTLIGHT_ROOT'],str(self.root))
        self.assertFalse(self.output.exists())
        self.assertEqual(before,{str(p.relative_to(self.base)):sha(p)for p in self.base.rglob('*')if p.is_file()})
    def test_browser_budget_and_current_prerequisite_command_membership(self):
        text=Path(V.__file__).read_text(encoding='utf-8')if Path(V.__file__).is_file()else __import__('wire_consignment_verifier').prepare()['tools/verify.py']
        self.assertIn("run('earth-consignment-cohort'",text);self.assertIn("run('earth-consignment-current-preflight'",text);self.assertIn("run('earth_consignment_browser', command, timeout=7200",text)
        self.assertEqual(text.count("'tests/earth_expedition_journey.cjs',"),3)

if __name__=='__main__':unittest.main()
