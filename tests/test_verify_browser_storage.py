"""Output routing preserves heavy-suite guards and command-earned fixture bytes."""
from pathlib import Path
import importlib.util,tempfile,unittest
SPEC=importlib.util.spec_from_file_location("firstlight_verifier",Path(__file__).resolve().parents[1]/"tools/verify.py")
V=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(V)
class BrowserStorage(unittest.TestCase):
    def test_evidence_root_is_claimed_once_without_overwriting_old_reports(self):
        with tempfile.TemporaryDirectory(prefix="firstlight-storage-root-") as tmp:
            output=Path(tmp)/"new-evidence"
            V.reserve_browser_output(output)
            prior=output/"existing-report.json";prior.write_bytes(b"prior")
            with self.assertRaises(FileExistsError):V.reserve_browser_output(output)
            self.assertEqual(prior.read_bytes(),b"prior")
    def test_default_output_mode_routes_only_suites_with_existing_windows_drive_guards(self):
        output=Path("/synthetic-evidence")
        guarded={"realm_givers_browser","realm_trails_north_browser","coastward_bridge_posts_browser","practice_visibility_browser","hell_campaign_browser","heaven_campaign_browser"}
        for suite in guarded:
            command,env=V.browser_run_spec(suite,output)
            self.assertIn("--output",command);self.assertEqual(env,{})
        for suite in ["bridge_browser","earth_story_transactions_browser",*V.ENV_BROWSER_OUTPUTS]:
            self.assertEqual(V.browser_run_spec(suite,output),([V.sys.executable,f"tests/{suite}.py"],{}))
    def test_default_commands_and_environment_remain_unchanged(self):
        command,env=V.browser_run_spec("realm_givers_browser",None)
        self.assertEqual(command,[V.sys.executable,"tests/realm_givers_browser.py"])
        self.assertEqual(env,{})
        self.assertIsNone(V.prepare_browser_sources(None))
    def test_explicit_output_uses_supported_cli_and_env_contracts(self):
        output=Path("/synthetic-evidence")
        for suite in V.CLI_BROWSER_OUTPUTS:
            command,env=V.browser_run_spec(suite,output,mode="supported")
            self.assertEqual(command[:2],[V.sys.executable,f"tests/{suite}.py"])
            self.assertEqual(command[command.index("--output")+1],str(output/suite))
            if suite in V.BROWSER_SOURCE_OUTPUTS:
                self.assertEqual(command[command.index("--sources")+1],str(output/suite/"earned-sources"))
            self.assertEqual(env,{})
        for suite,key in V.ENV_BROWSER_OUTPUTS.items():
            command,env=V.browser_run_spec(suite,output,mode="supported")
            self.assertEqual(command,[V.sys.executable,f"tests/{suite}.py"])
            self.assertEqual(env,{key:str(output/suite)})
        self.assertEqual(V.browser_run_spec("realm_atlas_browser",output),( [V.sys.executable,"tests/realm_atlas_browser.py"],{}))
    def test_earned_sources_copy_byte_exactly_without_overwriting_prior_evidence(self):
        with tempfile.TemporaryDirectory(prefix="firstlight-storage-test-") as tmp:
            root=Path(tmp)/"root";source=root/"evidence10/starter/fresh-blade";source.mkdir(parents=True)
            # Synthetic copy fixture; this test makes no command-earned gameplay claim.
            payload=b'{"synthetic":true}'+bytes([13,10]);(source/"SOURCE.json").write_bytes(payload)
            output=Path(tmp)/"evidence";dest=V.prepare_browser_sources(output,root=root)
            self.assertEqual((dest/"fresh-blade/SOURCE.json").read_bytes(),payload)
            self.assertEqual((source/"SOURCE.json").read_bytes(),payload)
            with self.assertRaises(FileExistsError):V.prepare_browser_sources(output,root=root)
            self.assertEqual((dest/"fresh-blade/SOURCE.json").read_bytes(),payload)
            with self.assertRaises(ValueError):V.prepare_browser_sources(root/"evidence10/starter/nested",root=root)
if __name__=="__main__":unittest.main()
