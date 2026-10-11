"""CPU-only storage routing; explicit tiny filesystem/transport fixtures."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[1]
VERIFY = Path(os.environ.get('FIRSTLIGHT_CPU_STORAGE_VERIFIER', str(ROOT/'tools/verify.py')))
spec = importlib.util.spec_from_file_location('actual_cpu_storage_verifier', VERIFY)
V = importlib.util.module_from_spec(spec)
spec.loader.exec_module(V)


class CpuStorage(unittest.TestCase):
    def test_default_does_not_override_original_child_environment(self):
        self.assertEqual(V.cpu_test_environment(None), {})

    def test_existing_explicit_directory_sets_all_cpu_temp_variables_without_writes(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-cpu-env-') as name:
            directory = Path(name).resolve()
            self.assertEqual(V.cpu_test_environment(directory),
                             {key:str(directory) for key in ('TMPDIR','TEMP','TMP')})
            self.assertEqual(list(directory.iterdir()), [])

    def test_invalid_cpu_directory_refuses_before_log_or_browser_output_allocation(self):
        with tempfile.TemporaryDirectory(prefix='firstlight-cpu-env-refusal-') as name:
            base = Path(name)
            for directory in (Path('relative-path'), base/'missing', base/'file'):
                if directory.name == 'file':directory.write_text('owned sentinel')
                with self.subTest(directory=directory):
                    with self.assertRaisesRegex(ValueError,'existing absolute'):
                        V.cpu_test_environment(directory)
            output, browser = base/'logs', base/'browser'
            args = ['verify.py','--cpu-temp',str(base/'missing'),
                    '--output',str(output),'--browser','--browser-output',str(browser)]
            with patch.object(V.sys,'argv',args), contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as caught:V.main()
            self.assertEqual(caught.exception.code,2)
            self.assertFalse(output.exists());self.assertFalse(browser.exists())

    def test_actual_main_routes_only_unit_child_and_retains_budget_and_other_environment(self):
        # No gameplay is earned or admitted. Stop the explicit transport after
        # source-controller dispatch; all run() filesystem/environment logic is real.
        with tempfile.TemporaryDirectory(prefix='firstlight-cpu-env-route-') as name:
            base = Path(name); root = base/'synthetic-route-root';root.mkdir()
            (root/'src').mkdir();(root/'tests').mkdir()
            (root/'src'/'token.js').write_text('// synthetic discovery token')
            (root/'tests'/'token.test.cjs').write_text('// synthetic discovery token')
            for leaf in ('index.html','FIRSTLIGHT_VALLEY.html'):(root/leaf).write_bytes(b'synthetic equal page')
            cpu=base/'cpu';cpu.mkdir(); logs=base/'logs';calls=[]
            args=['verify.py','--cpu-temp',str(cpu.resolve()),'--output',str(logs)]
            marker='owned source-controller transport stop'
            def fake_run(command,**kwargs):
                calls.append((command,kwargs))
                if command[1:2]==['tools/test_road_account_browser.py']:
                    raise RuntimeError(marker)
                return SimpleNamespace(returncode=0)
            with (patch.object(V,'ROOT',root),patch.object(V.sys,'argv',args),
                  patch.dict(os.environ,{'TMPDIR':'ORIGINAL_BROWSER_TEMP','TEMP':'ORIGINAL_BROWSER_TEMP','TMP':'ORIGINAL_BROWSER_TEMP'}),
                  patch.object(V.shutil,'which',return_value='node'),
                  patch.object(V.subprocess,'check_output',return_value='v24.18.0'),
                  patch.object(V.subprocess,'run',side_effect=fake_run),
                  contextlib.redirect_stdout(io.StringIO())):
                with self.assertRaisesRegex(RuntimeError,marker):V.main()
            unit=[(c,k) for c,k in calls if '-m' in c and 'unittest' in c]
            self.assertEqual(len(unit),1)
            self.assertEqual(unit[0][1]['timeout'],600)
            expected={key:str(cpu.resolve()) for key in ('TMPDIR','TEMP','TMP')}
            for command,kwargs in calls:
                for key in expected:
                    self.assertEqual(kwargs['env'][key],expected[key] if command==unit[0][0] else 'ORIGINAL_BROWSER_TEMP')
            self.assertEqual(list(cpu.iterdir()),[])


if __name__=='__main__':unittest.main(verbosity=2)
