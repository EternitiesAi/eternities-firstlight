"""Portable onboarding verifier boundary/orchestration checks.

Synthetic receipts/source tokens exercise real validators; subprocess sinks
record orchestration only. No native gameplay/browser qualification is implied.
The existing Earth verifier's fixture supplies its actual source-boundary links.
"""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import test_verify_earth_homecoming as Earth

ROOT, ONBOARDING, V, Fixture, sha = Earth.ROOT, Earth.ONBOARDING, Earth.V, Earth.Fixture, Earth.sha

class OnboardingVerifier(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='firstlight-onboarding-verifier-cpu-')
        self.f=Fixture(Path(self.tmp.name));self.output=Path(self.tmp.name)/'browser'/'onboarding_browser'
    def tearDown(self):self.tmp.cleanup()
    def spec(self,root=None,output=None,**kw):
        return V.onboarding_browser_run_spec(root or self.f.root,output or self.output,windows=False,**kw)

    def test_required_command_has_current_root_fresh_child_and_software_no_seed_or_video_flags(self):
        c,e=self.spec()
        self.assertEqual(c,[sys.executable,'tools/onboarding_browser.py','--root',str(self.f.root),'--output',str(self.output),'--renderer','software'])
        self.assertEqual(e,{'FIRSTLIGHT_ROOT':str(self.f.root),'PYTHONDONTWRITEBYTECODE':'1'})
        self.assertFalse(self.output.exists())
        for forbidden in ('--sources','--source','--variant','--headed','--video'):self.assertNotIn(forbidden,c)

    def test_explicit_args_override_unrelated_root_output_environment(self):
        with patch.dict(os.environ,{'FIRSTLIGHT_ROOT':'wrong-unrelated-root','FIRSTLIGHT_ONBOARDING_OUTPUT':'old-output'}):
            c,e=self.spec()
        self.assertEqual(c[c.index('--root')+1],str(self.f.root));self.assertEqual(c[c.index('--output')+1],str(self.output))
        self.assertEqual(e['FIRSTLIGHT_ROOT'],str(self.f.root))

    def test_existing_output_preserves_payload_and_is_never_reused(self):
        self.output.mkdir(parents=True);old=self.output/'OLD_REPORT.json';old.write_bytes(b'preserve old report')
        with self.assertRaisesRegex(ValueError,'new bounded'):self.spec()
        self.assertEqual(old.read_bytes(),b'preserve old report')

    def test_game_output_ancestors_descendants_and_drive_root_are_refused(self):
        for target in (self.f.root,self.f.root/'new-evidence',Path(self.tmp.name),Path(self.tmp.name).anchor):
            with self.subTest(target=target),self.assertRaises(ValueError):self.spec(output=target)
        self.assertFalse((self.f.root/'new-evidence').exists())

    def test_windows_non_d_output_is_refused_without_coercing_path(self):
        with self.assertRaisesRegex(ValueError,'D: on Windows'):
            V.onboarding_browser_run_spec(self.f.root,Path(self.tmp.name)/'new-output',windows=True)
        self.assertFalse((Path(self.tmp.name)/'new-output').exists())

    def test_wrong_root_missing_tool_or_core_refuse_before_output(self):
        with self.assertRaisesRegex(ValueError,'Installed onboarding'):self.spec(root=Path(self.tmp.name)/'missing-game')
        (self.f.root/'src/core.js').unlink()
        with self.assertRaisesRegex(ValueError,'actual game checkout'):self.spec()
        self.assertFalse(self.output.exists())

    def test_actual_native_source_validator_refuses_unequal_pages(self):
        (self.f.root/'index.html').write_text('mutated synthetic page')
        with self.assertRaisesRegex(ValueError,'byte-identical'):self.spec()
        self.assertFalse(self.output.exists())

    def test_actual_native_source_validator_refuses_stale_caller_embedding(self):
        (self.f.root/'src/local-life-ui.js').write_text('// new unembedded synthetic caller')
        with self.assertRaisesRegex(ValueError,'embed actual caller'):self.spec()
        self.assertFalse(self.output.exists())

    def test_actual_native_preflight_is_inert_and_needs_no_renderer_dependencies(self):
        c,_=self.spec();spec=importlib.util.spec_from_file_location('actual_onboarding_for_inert_cli',self.f.root/'tools/onboarding_browser.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        with patch.object(module.OnboardingBrowser,'start',side_effect=AssertionError('no browser')),patch.object(module,'ThreadingHTTPServer',side_effect=AssertionError('no server')),contextlib.redirect_stdout(io.StringIO()) as stream:
            self.assertEqual(module.main([*c[2:],'--preflight-only']),0)
        value=json.loads(stream.getvalue());self.assertEqual(value['status'],'preflight-passed');self.assertFalse(value['browserExecuted']);self.assertTrue(value['inputs']);self.assertFalse(self.output.exists())

    def test_actual_current_game_source_readback_is_pure_without_browser_execution(self):
        # Actual installed caller bytes, not synthetic source tokens. This is
        # a source/hash readback only; repaired UI/native success is not implied.
        spec=importlib.util.spec_from_file_location('onboarding_actual_source_readback',ONBOARDING)
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        before={str(p):sha(p) for p in [*(ROOT/'src').glob('*'),ROOT/'build.py',ROOT/'index.html',ROOT/'FIRSTLIGHT_VALLEY.html'] if p.is_file()}
        values=module.source_inputs(ROOT)
        self.assertGreater(len(values),10);self.assertEqual(values[str(ROOT/'src/core.js')],before[str(ROOT/'src/core.js')])
        self.assertEqual(before,{name:sha(name)for name in before})
        self.assertEqual(len(module.STAGES),12)

    def main_requests(self,browser=True,onboarding_exit=0,capture_cpu_exit=0):
        calls=[]
        def fake_run(command,**kw):
            calls.append((command,kw));kw['stdout'].write(b'CPU orchestration sink only; no subprocess launched\n')
            code=0
            if len(command)>1 and command[1]=='tools/onboarding_browser.py':code=onboarding_exit
            if len(command)>1 and command[1]=='tests/test_capture_earth_homecoming.py':code=capture_cpu_exit
            return SimpleNamespace(returncode=code)
        target=Path(self.tmp.name)/'main-browser';args=['verify.py','--output',str(self.f.logs)]
        if browser:args+=['--browser','--browser-output',str(target),'--browser-output-mode','supported']
        with patch.object(V,'ROOT',self.f.root),patch.object(V,'os',SimpleNamespace(name='posix',environ=os.environ)),patch.object(V.sys,'argv',args),patch.object(V.shutil,'which',return_value='node'),patch.object(V.subprocess,'check_output',return_value='v24.18.0\n'),patch.object(V.subprocess,'run',side_effect=fake_run),patch.object(V,'prepare_browser_sources',return_value=None),contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()):
            V.main()
        return calls,target

    def test_main_preserves_all46_contracts_and_adds_required47th_after_same_invocation_earth(self):
        calls,target=self.main_requests();by={c[1]:(c,k)for c,k in calls if len(c)>1}
        onboarding=[(c,k)for c,k in calls if len(c)>1 and c[1]=='tools/onboarding_browser.py'];self.assertEqual(len(onboarding),1)
        c,k=onboarding[0];self.assertEqual(k['timeout'],600);self.assertEqual(c[c.index('--root')+1],str(self.f.root));self.assertEqual(c[c.index('--output')+1],str(target/'onboarding_browser'));self.assertEqual(c[c.index('--renderer')+1],'software')
        earth,ek=by['tools/earth_homecoming_browser.py'];self.assertEqual(ek['timeout'],1800);self.assertEqual(earth[earth.index('--cohort-sha')+1],self.f.cohort_sha);self.assertEqual(earth[earth.index('--sources')+1],str(self.f.sources))
        self.assertNotEqual(c[c.index('--output')+1],earth[earth.index('--output')+1])
        labels=[c[1]for c,k in calls if len(c)>1];self.assertLess(labels.index('tools/earth_homecoming_journey.cjs'),labels.index('tests/test_earth_homecoming_native.py'));self.assertLess(labels.index('tests/test_earth_homecoming_native.py'),labels.index('tools/earth_homecoming_browser.py'));self.assertLess(labels.index('tools/earth_homecoming_browser.py'),labels.index('tools/onboarding_browser.py'))
        existing=[(c,k)for c,k in calls if len(c)>1 and c[1].startswith('tests/') and c[1].endswith('_browser.py')];self.assertEqual(len(existing),45)
        for c,k in existing:
            suite=Path(c[1]).stem;want=1200 if suite in ('cosmos_campaign_browser','atlantis_campaign_browser','heaven_campaign_browser','hell_campaign_browser','realm_givers_browser','local_life_browser') else 600
            self.assertEqual(k['timeout'],want,suite);expected,env=V.browser_run_spec(suite,target,'supported');self.assertEqual(c,expected);self.assertTrue(env.items()<=k['env'].items())
        self.assertEqual(len(existing)+len(onboarding)+1,47);self.assertFalse((target/'onboarding_browser').exists());self.assertFalse(any(len(c)>1 and c[1].startswith('tools/capture_') for c,k in calls))

    def test_browser_gate_failure_is_not_swallowed_or_relabelled_as_optional(self):
        with self.assertRaisesRegex(SystemExit,'FAILED: onboarding_browser'):self.main_requests(onboarding_exit=1)

    def test_source_only_invocation_never_requests_onboarding_browser(self):
        calls,_=self.main_requests(browser=False)
        self.assertFalse(any(len(c)>1 and c[1]=='tools/onboarding_browser.py' for c,k in calls))

    def test_recording_cpu_uses_same_current_cohort_without_launching_a_take(self):
        calls,_=self.main_requests(browser=False)
        rows=[(c,k) for c,k in calls if len(c)>1 and c[1]=='tests/test_capture_earth_homecoming.py']
        self.assertEqual(len(rows),1);c,k=rows[0]
        self.assertEqual(k['timeout'],180)
        self.assertEqual(k['env']['FIRSTLIGHT_ROOT'],str(self.f.root))
        self.assertEqual(k['env']['FIRSTLIGHT_EARTH_CAPTURE_SOURCE'],str(self.f.sources/'blade/earth/02_RELAYS.json'))
        self.assertEqual(k['env']['FIRSTLIGHT_EARTH_CAPTURE_COHORT_SHA'],self.f.cohort_sha)
        self.assertEqual(k['env']['FIRSTLIGHT_EARTH_EARNED_CALLER_ROOT'],str(self.f.root/'tools/earth-homecoming-journey'))
        labels=[c[1] for c,k in calls if len(c)>1]
        self.assertLess(labels.index('tools/earth_homecoming_journey.cjs'),labels.index('tests/test_capture_earth_homecoming.py'))
        self.assertFalse(any(len(c)>1 and c[1].startswith('tools/capture_') for c,k in calls))

    def test_required_recording_cpu_failure_stops_the_invocation(self):
        with self.assertRaisesRegex(SystemExit,'FAILED: earth-recording-controller-preflight'):
            self.main_requests(capture_cpu_exit=1)

if __name__=='__main__':unittest.main(verbosity=2)
