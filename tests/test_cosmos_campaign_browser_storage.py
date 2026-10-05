"""CPU-only preflight/storage/controller tests; fixtures are synthetic schemas.

No browser import, Playwright, game execution or earned/native claim is made by
these tests. One read-only current-cohort test is enabled by explicit paths.
"""
from pathlib import Path
import ast
import contextlib
import importlib.util
import io
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
STAGE = Path(__file__).resolve().parents[1]


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


H = load(STAGE/'tools/cosmos_campaign_browser.py', 'cosmos_cpu_native')
WRAPPER = load(STAGE/'tests/cosmos_campaign_browser.py', 'cosmos_cpu_wrapper')


class Guards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        self = cls
        # Tests use only small disposable schema files on the stage's D drive.
        self.temp = tempfile.TemporaryDirectory(prefix='cpu-schema-', dir=STAGE)
        self.base = Path(self.temp.name)
        self.root = self.base/'fake-source-schema'
        (self.root/'src').mkdir(parents=True)
        (self.root/'src/example.js').write_text('synthetic source schema; never executed', encoding='utf8')
        for name in (*H.JOURNEY_DEPENDENCIES, 'tests/cosmos_campaign_journey.cjs', H.VETERAN_FIXTURE):
            p = self.root/name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text('synthetic byte owner; never executed', encoding='utf8')
        self.sources = self.base/'sources'
        self.sources.mkdir()
        for flag, (label, choice, supports) in H.VARIANTS.items():
            folder = self.sources/label
            folder.mkdir()
            seed = {'adventure': {'started': True}, 'realmTrails': {'records': {H.PREREQUISITE: {'claimed': True}}}, 'cosmosCampaign': H.FRESH}
            links = {}
            required = H.checkpoint_names(flag)
            for name in required:
                value = seed if name == '00_EARNED_SEED' else {'cosmosCampaign': {'claimed': True, 'opened': True, 'choice': choice}}
                H.write_new(folder/(name+'.json'), value)
                links[name] = H.sha(folder/(name+'.json'))
            epoch = H.source_epoch(self.root)
            proof = {'variant': label, 'seedSha256': links['00_EARNED_SEED'], 'prerequisite': H.PREREQUISITE,
                     'prerequisiteClaimed': True, 'sourceHashes': epoch, 'harnessSha256': H.sha(self.root/'tests/cosmos_campaign_journey.cjs'), **dict.fromkeys(H.INJECTIONS, 0)}
            fights = [{'enemy': e, 'style': 'bow' if flag == 'bow' else 'blade', 'arrows': flag == 'bow',
                       'weapons': [{'caller': 'production projectile impact'}], 'impacts': [{}], 'frames': [{}], 'contacts': [{}]}
                      for e in ('cosmos-optical-reclaimer-v1', 'cosmos-still-meridian-guardian-v1')]
            report = {**proof, 'status': 'passed', 'sourceDrift': False, 'campaignComplete': True,
                      'canonicalPreservation': True, 'finalHashes': epoch, 'plan': {'choice': choice, 'supports': [{'id': s, 'mode': m} for s,m in supports]},
                      'checkpoints': list(required), 'checkpointHashes': links, 'fights': fights, 'walks': [{}], 'saveCount': 1}
            if flag == 'veteran':
                fixture = self.root/H.VETERAN_FIXTURE
                proof.update(fixture=str(fixture), fixtureHash=H.sha(fixture))
                report['source'] = {'path': str(fixture), 'sha256': H.sha(fixture)}
            H.write_new(folder/'SEED_PROVENANCE.json', proof)
            H.write_new(folder/'COSMOS_CAMPAIGN_JOURNEY_REPORT.json', report)
        self.original_bytes = {p.relative_to(self.base): p.read_bytes() for p in self.base.rglob('*') if p.is_file()}

    def tearDown(self):
        # Reuse this small schema fixture and restore only changed files. This
        # avoids thousands of disposable writes during one bounded CPU suite.
        for p in self.base.rglob('*'):
            if p.is_file() and p.relative_to(self.base) not in self.original_bytes:
                p.unlink()
        for relative, original in self.original_bytes.items():
            p = self.base/relative
            if not p.exists() or p.read_bytes() != original:
                p.parent.mkdir(parents=True,exist_ok=True)
                p.write_bytes(original)

    @classmethod
    def tearDownClass(cls):
        self = cls
        self.temp.cleanup()

    def proof(self, flag='blade'):
        return H.read_provenance(self.sources, (flag,), self.root)

    def mutate(self, filename, function, flag='blade'):
        p = self.sources/H.VARIANTS[flag][0]/(filename+'.json')
        value = H.read_json(p)
        function(value)
        p.write_text(json.dumps(value), encoding='utf8')

    def test_complete_schema_accepts_three_families_and_freezes_all_inputs(self):
        result, hashes = H.read_provenance(self.sources, tuple(H.VARIANTS), self.root)
        self.assertEqual(len(result), 3)
        self.assertEqual(len(hashes), 52)  # 51 JSON plus canonical original bytes.

    def test_seed_only_is_refused(self):
        (self.sources/'fresh-blade/COSMOS_CAMPAIGN_JOURNEY_REPORT.json').unlink()
        with self.assertRaisesRegex(ValueError, 'Complete linked'):
            self.proof()

    def test_failure_or_source_drift_is_refused(self):
        for change in ({'status': 'failed'}, {'sourceDrift': True}, {'campaignComplete': False}):
            with self.subTest(change=change):
                p=self.sources/'fresh-blade/COSMOS_CAMPAIGN_JOURNEY_REPORT.json'; old=p.read_bytes()
                self.mutate('COSMOS_CAMPAIGN_JOURNEY_REPORT', lambda v: v.update(change))
                with self.assertRaises(ValueError): self.proof()
                p.write_bytes(old)

    def test_missing_bool_or_nonzero_injection_counter_refuses(self):
        for counter in H.INJECTIONS:
            for value in (None, False, 1):
                with self.subTest(counter=counter,value=value):
                    p=self.sources/'fresh-blade/SEED_PROVENANCE.json'; old=p.read_bytes()
                    self.mutate('SEED_PROVENANCE', lambda v: v.update({counter:value}))
                    with self.assertRaisesRegex(ValueError, 'integer zero'): self.proof()
                    p.write_bytes(old)

    def test_current_source_membership_and_harness_bytes_are_bound(self):
        p=self.root/'src/new-owner.js'; p.write_text('changed epoch',encoding='utf8')
        with self.assertRaisesRegex(ValueError, 'source epoch'): self.proof()
        p.unlink()
        (self.root/'tests/cosmos_campaign_journey.cjs').write_text('changed harness',encoding='utf8')
        with self.assertRaisesRegex(ValueError, 'harness'): self.proof()

    def test_every_later_checkpoint_byte_is_verified_not_only_seed(self):
        p=self.sources/'fresh-blade/CHECKPOINT_RELEASE_EAST_LIVE.json'
        p.write_text('{}',encoding='utf8')
        with self.assertRaisesRegex(ValueError, 'Checkpoint hash'): self.proof()

    def test_missing_duplicate_or_unlinked_checkpoint_refuses(self):
        p=self.sources/'fresh-blade/COSMOS_CAMPAIGN_JOURNEY_REPORT.json'; old=p.read_bytes()
        for mutate in (lambda v:v['checkpointHashes'].pop('09_LOCAL_APPARATUS_OPEN'), lambda v:v['checkpoints'].append('00_EARNED_SEED')):
            self.mutate('COSMOS_CAMPAIGN_JOURNEY_REPORT', mutate)
            with self.assertRaisesRegex(ValueError, 'unique linked'): self.proof()
            p.write_bytes(old)

    def test_bow_receipts_require_projectile_contact_in_both_fights(self):
        self.mutate('COSMOS_CAMPAIGN_JOURNEY_REPORT',lambda v:v['fights'][1].update(weapons=[{'caller':'direct fake success'}]),'bow')
        with self.assertRaisesRegex(ValueError, 'Bow requires'): self.proof('bow')

    def test_two_distinct_encounters_and_supports_are_required(self):
        self.mutate('COSMOS_CAMPAIGN_JOURNEY_REPORT',lambda v:v['fights'][1].update(enemy='cosmos-optical-reclaimer-v1'))
        with self.assertRaisesRegex(ValueError, 'Two distinct'): self.proof()

    def test_duplicate_support_plan_and_wrong_choice_refuse(self):
        self.mutate('COSMOS_CAMPAIGN_JOURNEY_REPORT',lambda v:v['plan']['supports'][1].update(id='material'))
        with self.assertRaisesRegex(ValueError, 'plan'): self.proof()

    def test_original_strongest_bytes_cannot_be_replaced(self):
        (self.root/H.VETERAN_FIXTURE).write_text('different original',encoding='utf8')
        with self.assertRaisesRegex(ValueError, 'Strongest provenance'): self.proof('veteran')

    def test_portable_root_keeps_canonical_fixture_identity_and_both_hashes(self):
        historical='D:/historical-qualified-root/'+H.VETERAN_FIXTURE
        self.mutate('SEED_PROVENANCE',lambda v:v.update(fixture=historical),'veteran')
        self.mutate('COSMOS_CAMPAIGN_JOURNEY_REPORT',lambda v:v['source'].update(path=historical),'veteran')
        self.proof('veteran')
        self.mutate('COSMOS_CAMPAIGN_JOURNEY_REPORT',lambda v:v['source'].update(path='D:/a-different-fixture.json'),'veteran')
        with self.assertRaisesRegex(ValueError,'Strongest provenance'): self.proof('veteran')

    def test_strongest_actual_after_exhaustion_feeds_and_zero_contact_are_honest(self):
        self.mutate('COSMOS_CAMPAIGN_JOURNEY_REPORT',lambda v:v['fights'][1].update(contacts=[]),'veteran')
        result,_=self.proof('veteran')
        self.assertEqual(result['returning-strongest']['journey']['fights'][1]['contacts'],[])
        self.assertIn('CHECKPOINT_release-east-feed',H.checkpoint_names('veteran'))
        self.assertNotIn('CHECKPOINT_RELEASE_EAST_LIVE',H.checkpoint_names('veteran'))

    def test_native_paths_reject_overlap_existing_and_drive_roots(self):
        with self.assertRaises(FileExistsError): H.guard_paths(self.sources,self.sources,windows=False)
        with self.assertRaises(ValueError): H.guard_paths(self.sources/'new-native',self.sources,windows=False)
        with self.assertRaises(ValueError): H.bounded(Path(self.base.anchor),windows=False)
        with self.assertRaises(ValueError): H.bounded('C:/not-a-native-root',windows=True)

    def test_exact_six_profiles_and_no_escaped_label(self):
        output=self.base/'native'
        labels=[v[0] for v in H.VARIANTS.values()]+['fresh-blade-SYNTHETIC-crystal-capacity','fresh-blade-SYNTHETIC-claim-write-refusal','returning-strongest-SYNTHETIC-old-save-migration']
        self.assertEqual(len({H.profile_path(output,l,windows=False) for l in labels}),6)
        with self.assertRaises(ValueError): H.profile_path(output,'../other',windows=False)
        with self.assertRaises(ValueError): H.profile_path(output,'fresh-bow-SYNTHETIC-crystal-capacity',windows=False)

    def test_wrapper_generates_complete_journeys_only_when_requested(self):
        output,sources,generate=WRAPPER.plan_paths(self.base/'native',self.sources,windows=False)
        self.assertFalse(generate)
        earned,native=WRAPPER.commands(output,sources,generate,root=self.root)
        self.assertEqual(earned,[])
        self.assertIn('--root',native)
        output,sources,generate=WRAPPER.plan_paths(self.base/'another',windows=False)
        earned,_=WRAPPER.commands(output,sources,generate,root=self.root)
        self.assertEqual(len(earned),3)
        self.assertTrue(all('--seed-only' not in command for command in earned))

    def test_cli_rejects_unsafe_paths_without_loading_browser(self):
        with patch.object(H,'load_base',side_effect=AssertionError('browser must not load')), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as result:
                H.main(['--output',str(self.sources),'--sources',str(self.sources),'--root',str(self.root)])
            self.assertEqual(result.exception.code,2)

    def test_import_launches_no_server_browser_or_fixture_generation(self):
        with patch('subprocess.run',side_effect=AssertionError('no subprocess')), patch('subprocess.call',side_effect=AssertionError('no subprocess')):
            before=set(STAGE.iterdir())
            load(STAGE/'tools/cosmos_campaign_browser.py','cosmos_repeat_import')
            load(STAGE/'tests/cosmos_campaign_browser.py','cosmos_repeat_wrapper_import')
            self.assertEqual(before,set(STAGE.iterdir()))
        self.assertNotIn('playwright.sync_api',sys.modules)

    def test_cosmos_entry_uses_existing_map_invitation_not_nonexistent_top_tab(self):
        # Small controller routing fixture; this is not a native DOM/play proof.
        clicked=[]
        class Locator:
            @property
            def first(self): return self
            def click(self): clicked.append(self.selector)
        class Page:
            class Keyboard:
                def press(self,key): clicked.append('key:'+key)
            keyboard=Keyboard()
            def locator(self,selector):
                result=Locator();result.selector=selector;return result
        controller=H.CosmosMixin();controller.page=Page()
        controller.close_workspace=lambda:None;controller.render=lambda:None
        controller.workspace('cosmos')
        self.assertEqual(clicked,['key:j','#rpg-tabs [data-rpg="open"][data-id="atlas"]','#rpg-content [data-rpg="cosmos-invitation"]'])

    def test_ast_has_no_native_earned_state_injection_or_recorded_video(self):
        text=(STAGE/'tools/cosmos_campaign_browser.py').read_text()
        ast.parse(text)
        self.assertNotIn('record_video_dir',text)
        self.assertNotIn('Realm.test.replace',text)
        self.assertNotIn('Realm.test.view',text)
        self.assertNotIn('e.hp=',text)
        self.assertNotIn('e.mode=',text.replace('e.mode===',''))
        self.assertNotIn('e.cosmosCycle=',text)
        self.assertNotIn('Realm.test.adventure(',text)


class CurrentEarnedEpoch(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('FIRSTLIGHT_ROOT') and os.environ.get('COSMOS_EARNED_SOURCES'),'explicit actual current-source paths required')
    def test_read_only_real_current_cohort_preflight(self):
        result, hashes=H.read_provenance(Path(os.environ['COSMOS_EARNED_SOURCES']),tuple(H.VARIANTS),Path(os.environ['FIRSTLIGHT_ROOT']))
        self.assertEqual(len(result),3)
        self.assertEqual(len(hashes),52)


if __name__ == '__main__':
    unittest.main()
