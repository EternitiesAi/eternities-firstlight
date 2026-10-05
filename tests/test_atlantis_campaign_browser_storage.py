"""Import-safe receipt/storage boundary tests; synthetic JSON is unit data.

These tests never launch Chromium, Playwright, a server, GPU or an earned game.
They verify the preflight rejects false evidence, not native gameplay itself.
"""
from pathlib import Path
import ast
import copy
import contextlib
import importlib.util
import io
import json
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


NATIVE = load(ROOT / 'tools/atlantis_campaign_browser.py', 'atlantis_native_unit')
WRAPPER = load(ROOT / 'tests/atlantis_campaign_browser.py', 'atlantis_wrapper_unit')


class AtlantisBrowserStorageTests(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(prefix='atlantis-storage-unit-')
        self.addCleanup(self.scratch.cleanup)
        self.base = Path(self.scratch.name)
        self.root = self.base / 'synthetic-source'
        (self.root / 'src').mkdir(parents=True)
        (self.root / 'tests').mkdir()
        for relative in ('src/example.js', 'build.py', 'index.html', 'tests/atlantis_campaign_journey.cjs', 'tests/realm_trails_journey.cjs'):
            (self.root / relative).write_text('labelled synthetic unit input: ' + relative, encoding='utf-8')
        self.sources = self.base / 'synthetic-earned-receipts'
        self.sources.mkdir()
        fixture = self.root / NATIVE.VETERAN_FIXTURE
        fixture.parent.mkdir(parents=True)
        fixture.write_bytes(b'labelled synthetic veteran unit fixture, not game proof')
        self.epoch = NATIVE.source_epoch(self.root)
        for flag in NATIVE.VARIANTS:
            self.make_family(flag)

    def dump(self, path, value):
        path.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')

    def make_family(self, flag):
        label, approach, choice = NATIVE.VARIANTS[flag]
        folder = self.sources / label
        folder.mkdir()
        seed = {'adventure': {'started': True},
                'realmTrails': {'records': {NATIVE.PREREQUISITE: {'claimed': True}}},
                'atlantisCampaign': {'version': 1, 'accepted': False, 'steps': [], 'approach': None, 'choice': None, 'claimed': False}}
        for name in NATIVE.CHECKPOINTS:
            state = copy.deepcopy(seed)
            if name == 'FINAL_WORLD':
                state['atlantisCampaign'].update(accepted=True, claimed=True, approach=approach, choice=choice)
            self.dump(folder / (name + '.json'), state)
        proof = {'variant': label, 'prerequisite': NATIVE.PREREQUISITE,
                 'seedSha256': NATIVE.sha(folder / '00_EARNED_SEED.json'), 'sourceHashes': self.epoch,
                 **{key: 0 for key in NATIVE.INJECTIONS}}
        report = {'variant': label, 'status': 'passed', 'sourceDrift': False,
                  'sourceHashes': self.epoch, 'finalHashes': self.epoch,
                  'approach': approach, 'choice': choice, 'canonicalPreservation': True,
                  'checkpoints': list(NATIVE.CHECKPOINTS),
                  'checkpointHashes': {name: NATIVE.sha(folder / (name + '.json')) for name in NATIVE.CHECKPOINTS},
                  'combat': {'style': 'bow' if flag == 'bow' else 'blade', 'arrows': flag == 'bow',
                             'weaponImpacts': [{'caller': 'production projectile impact' if flag == 'bow' else 'production blade attack caller'}],
                             'impacts': [{'before': 128, 'hp': 0}]},
                  'swims': [{'label': 'synthetic unit receipt, not gameplay proof'}],
                  **{key: 0 for key in NATIVE.INJECTIONS}}
        if flag == 'veteran':
            identity = {'fixture': str(self.root / NATIVE.VETERAN_FIXTURE), 'fixtureHash': NATIVE.sha(self.root / NATIVE.VETERAN_FIXTURE)}
            proof.update(identity)
            report.update(identity)
        self.dump(folder / 'SEED_PROVENANCE.json', proof)
        self.dump(folder / 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT.json', report)

    def mutate(self, flag, receipt, update):
        path = self.sources / NATIVE.VARIANTS[flag][0] / (receipt + '.json')
        value = NATIVE.read_json(path)
        update(value)
        self.dump(path, value)

    def preflight(self, flags=('blade', 'bow', 'veteran')):
        return NATIVE.read_provenance(self.sources, flags, self.root)

    def test_imports_are_browser_server_and_subprocess_free(self):
        with patch('subprocess.run', side_effect=AssertionError('unexpected subprocess')), patch('subprocess.call', side_effect=AssertionError('unexpected subprocess')):
            before = set(sys.modules)
            load(ROOT / 'tools/atlantis_campaign_browser.py', 'atlantis_native_import_again')
            load(ROOT / 'tests/atlantis_campaign_browser.py', 'atlantis_wrapper_import_again')
        self.assertFalse(any(name.startswith('playwright') for name in set(sys.modules) - before))

    def test_d_drive_guard_refuses_relative_c_and_unc_targets(self):
        self.assertTrue(NATIVE.on_d(r'D:\Firstlight\proof'))
        self.assertTrue(NATIVE.on_d('d:/Firstlight/proof'))
        for path in (r'D:proof', r'C:\Firstlight\proof', r'\\server\share\proof', '/tmp/proof'):
            self.assertFalse(NATIVE.on_d(path), path)
        with self.assertRaises(ValueError):
            NATIVE.bounded(self.base / 'not-d', windows=True)

    def test_roots_are_refused_and_actual_containment_is_component_based(self):
        with self.assertRaises(ValueError):
            NATIVE.bounded(Path(self.base.anchor), windows=False)
        self.assertTrue(NATIVE.within(self.sources / 'fresh-blade', self.sources))
        self.assertFalse(NATIVE.within(self.sources.with_name(self.sources.name + '-outside'), self.sources))

    def test_native_sources_and_output_are_distinct_and_never_overwritten(self):
        output = self.base / 'new-native'
        self.assertEqual(NATIVE.guard_paths(output, self.sources, windows=False), (output, self.sources))
        self.assertFalse(output.exists())
        for nested in (self.sources / 'native', self.base):
            with self.assertRaises((ValueError, FileExistsError)):
                NATIVE.guard_paths(nested, self.sources, windows=False)
        NATIVE.reserve_output(output)
        sentinel = output / 'prior.json'
        sentinel.write_bytes(b'valuable prior receipt')
        with self.assertRaises(FileExistsError):
            NATIVE.guard_paths(output, self.sources, windows=False)
        with self.assertRaises(FileExistsError):
            NATIVE.reserve_output(output)
        self.assertEqual(sentinel.read_bytes(), b'valuable prior receipt')

    def test_profiles_have_exact_family_membership_and_new_owned_paths(self):
        output = self.base / 'new-native'
        output.mkdir()
        for name in ('fresh-blade', 'fresh-bow', 'returning-strongest', 'fresh-blade-SYNTHETIC-crystal-capacity'):
            profile = NATIVE.profile_path(output, name, windows=False)
            self.assertEqual(profile.parent, output)
            profile.mkdir()
            with self.assertRaises(FileExistsError):
                NATIVE.profile_path(output, name, windows=False)
        for name in ('../personal', 'fresh-blade/elsewhere', 'Default', 'fresh-bow-SYNTHETIC-hp-grant'):
            with self.assertRaises(ValueError):
                NATIVE.profile_path(output, name, windows=False)

    def test_new_json_receipts_refuse_existing_bytes(self):
        target = self.base / 'receipt.json'
        NATIVE.write_new(target, {'name': 'Sahra · crystal'})
        original = target.read_bytes()
        with self.assertRaises(FileExistsError):
            NATIVE.write_new(target, {'replacement': True})
        self.assertEqual(target.read_bytes(), original)
        self.assertEqual(NATIVE.read_json(target), {'name': 'Sahra · crystal'})

    def test_complete_current_cohort_freezes_all_receipt_bytes(self):
        before = {str(p): p.read_bytes() for p in self.sources.rglob('*.json')}
        before[str(self.root / NATIVE.VETERAN_FIXTURE)] = (self.root / NATIVE.VETERAN_FIXTURE).read_bytes()
        provenance, frozen = self.preflight()
        self.assertEqual(set(provenance), {variant[0] for variant in NATIVE.VARIANTS.values()})
        self.assertEqual(set(frozen), set(before))
        self.assertTrue(all(frozen[path] == NATIVE.sha(path) for path in before))
        self.assertEqual(before, {path: Path(path).read_bytes() for path in before})

    def test_seed_only_cannot_qualify_native_play(self):
        (self.sources / 'fresh-blade' / 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT.json').unlink()
        with self.assertRaisesRegex(ValueError, 'complete journey'):
            self.preflight(('blade',))

    def test_every_injection_counter_is_present_integer_zero_in_both_receipts(self):
        for receipt in ('SEED_PROVENANCE', 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT'):
            for key in NATIVE.INJECTIONS:
                path = self.sources / 'fresh-blade' / (receipt + '.json')
                original = path.read_bytes()
                for invalid in (None, False, 1, 0.0, '0'):
                    with self.subTest(receipt=receipt, key=key, invalid=invalid):
                        self.mutate('blade', receipt, lambda value, key=key, invalid=invalid: value.pop(key) if invalid is None else value.update({key: invalid}))
                        with self.assertRaisesRegex(ValueError, 'explicit integer zero'):
                            self.preflight(('blade',))
                        path.write_bytes(original)

    def test_cli_refuses_incomplete_provenance_before_output_or_browser_loading(self):
        self.mutate('blade', 'SEED_PROVENANCE', lambda value: value.pop('forcedModes'))
        output = self.base / 'must-not-create-native-output'
        with patch.object(NATIVE, 'guard_paths', return_value=(output, self.sources)), \
                patch.object(NATIVE, 'load_base', side_effect=AssertionError('browser helpers must not load')), \
                contextlib.redirect_stderr(io.StringIO()) as error:
            with self.assertRaises(SystemExit) as raised:
                NATIVE.main(['--output', str(output), '--sources', str(self.sources), '--variant', 'blade'])
        self.assertEqual(raised.exception.code, 2)
        self.assertIn('explicit integer zero', error.getvalue())
        self.assertFalse(output.exists())

    def test_stale_changed_or_added_source_membership_is_rejected(self):
        source = self.root / 'src/example.js'
        original = source.read_bytes()
        source.write_bytes(b'changed source')
        with self.assertRaisesRegex(ValueError, 'source epoch'):
            self.preflight()
        source.write_bytes(original)
        added = self.root / 'src/new-module.js'
        added.write_bytes(b'new source member')
        with self.assertRaisesRegex(ValueError, 'source epoch'):
            self.preflight()

    def test_unlinked_or_tampered_checkpoint_bytes_are_rejected(self):
        self.mutate('blade', 'CHECKPOINT_INLET', lambda value: value.update(unearned=True))
        with self.assertRaisesRegex(ValueError, 'checkpoint bytes'):
            self.preflight(('blade',))

    def test_required_checkpoint_hashes_cannot_be_omitted(self):
        self.mutate('blade', 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT', lambda value: value['checkpointHashes'].pop('CHECKPOINT_INLET'))
        with self.assertRaisesRegex(ValueError, 'linked byte hash'):
            self.preflight(('blade',))

    def test_checkpoint_identity_cannot_escape_family(self):
        self.mutate('blade', 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT', lambda value: value['checkpointHashes'].update({'../other': 'abc'}))
        with self.assertRaisesRegex(ValueError, 'checkpoint identity'):
            self.preflight(('blade',))

    def test_no_current_pass_claim_without_complete_branches_or_preservation(self):
        changes = ({'status': 'failed'}, {'sourceDrift': True}, {'approach': 'lower'}, {'choice': 'license'},
                   {'canonicalPreservation': False}, {'checkpoints': ['00_EARNED_SEED']}, {'finalHashes': {}})
        path = self.sources / 'fresh-blade/ATLANTIS_CAMPAIGN_JOURNEY_REPORT.json'
        original = path.read_bytes()
        for change in changes:
            with self.subTest(change=change):
                self.mutate('blade', 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT', lambda value: value.update(change))
                with self.assertRaises(ValueError):
                    self.preflight(('blade',))
                path.write_bytes(original)

    def test_earned_seed_requires_real_kit_claimed_chart_and_empty_campaign(self):
        path = self.sources / 'fresh-blade/00_EARNED_SEED.json'
        original = path.read_bytes()
        for change in (lambda value: value['adventure'].update(started=False),
                       lambda value: value['realmTrails']['records'][NATIVE.PREREQUISITE].update(claimed=False),
                       lambda value: value['atlantisCampaign'].update(accepted=True)):
            change_value = NATIVE.read_json(path)
            change(change_value)
            self.dump(path, change_value)
            self.mutate('blade', 'SEED_PROVENANCE', lambda value: value.update(seedSha256=NATIVE.sha(path)))
            self.mutate('blade', 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT', lambda value: value['checkpointHashes'].update({'00_EARNED_SEED': NATIVE.sha(path)}))
            with self.assertRaisesRegex(ValueError, 'earned kit/chart'):
                self.preflight(('blade',))
            path.write_bytes(original)

    def test_bow_requires_projectile_callers_not_aggregate_hp_loss(self):
        self.mutate('bow', 'ATLANTIS_CAMPAIGN_JOURNEY_REPORT', lambda value: value['combat'].update(weaponImpacts=[{'caller': 'aggregate companion HP loss'}]))
        with self.assertRaisesRegex(ValueError, 'projectile contact'):
            self.preflight(('bow',))

    def test_veteran_canonical_fixture_bytes_and_both_identity_receipts_are_linked(self):
        path = self.root / NATIVE.VETERAN_FIXTURE
        original = path.read_bytes()
        path.write_bytes(b'changed original fixture')
        with self.assertRaisesRegex(ValueError, 'canonical byte receipt'):
            self.preflight(('veteran',))
        path.write_bytes(original)
        self.mutate('veteran', 'SEED_PROVENANCE', lambda value: value.update(fixture='different fixture'))
        with self.assertRaisesRegex(ValueError, 'canonical byte receipt'):
            self.preflight(('veteran',))

    def test_malformed_nonobject_json_cannot_be_receipt(self):
        path = self.sources / 'fresh-blade/ATLANTIS_CAMPAIGN_JOURNEY_REPORT.json'
        for text in ('[]', 'null', '{broken'):
            path.write_text(text, encoding='utf-8')
            with self.assertRaises((ValueError, json.JSONDecodeError)):
                self.preflight(('blade',))

    def test_wrapper_plans_three_complete_journeys_without_launching(self):
        output = self.base / 'wrapper-native'
        actual, sources, generate = WRAPPER.plan_paths(output, windows=False)
        self.assertEqual(actual, output)
        self.assertTrue(generate)
        self.assertFalse(actual.exists())
        self.assertFalse(sources.exists())
        earned, native = WRAPPER.commands(actual, sources, generate, 'hardware')
        self.assertEqual(len(earned), 3)
        self.assertTrue(all('--seed-only' not in command for command in earned))
        self.assertNotIn('--bow', earned[0])
        self.assertIn('--bow', earned[1])
        self.assertIn('--veteran', earned[2])
        self.assertEqual(native[-2:], ['--renderer', 'hardware'])
        self.assertEqual(WRAPPER.commands(actual, self.sources, False)[0], [])

    def test_wrapper_refuses_existing_source_and_profile_targets(self):
        output = self.base / 'wrapper-native'
        output.with_name(output.name + '-sources').mkdir()
        with self.assertRaises(FileExistsError):
            WRAPPER.plan_paths(output, windows=False)
        self.assertFalse(output.exists())
        self.assertFalse(WRAPPER.plan_paths(output, self.sources, windows=False)[2])

    def test_prior_history_guard_allows_real_resource_time_but_detects_gear_and_home_edits(self):
        owner_keys = ('journeys', 'realmTrails', 'earthExpedition', 'hellCampaign', 'heavenCampaign',
                      'bridgeCommunity', 'localLife', 'homeHistory', 'notes', 'score', 'scoreRevision',
                      'retreat', 'visitor', 'flowers', 'seed', 'version', 'visited')
        world = {key: {} for key in owner_keys}
        world.update(adventure={'owned': {'dawn_edge': {'socket': 'moonstone'}}, 'equipment': {'weapon': 'dawn_edge'},
                                'elapsed': 0, 'tonics': 2, 'hp': 100, 'stamina': 100, 'xp': 142, 'coins': 30, 'ore': 8, 'revision': 4, 'receipts': []},
                     sandbox={'placed': [{'id': 'bench1', 'x': 2}], 'nextId': 2, 'stats': {}, 'milestones': [],
                              'bridge': True, 'recentCommands': [], 'nodes': [{'hp': 0}], 'elapsed': 0, 'revision': 0, 'inventory': {'crystal': 1}})
        baseline = NATIVE.ownership(world)
        after = copy.deepcopy(world)
        after['sandbox'].update(nodes=[{'hp': 10}], elapsed=200, revision=1)
        after['adventure'].update(elapsed=200, hp=70, tonics=1)
        self.assertEqual(NATIVE.ownership(after), baseline)
        after['adventure']['owned']['dawn_edge']['socket'] = 'sunstone'
        self.assertNotEqual(NATIVE.ownership(after), baseline)
        after['adventure'] = copy.deepcopy(world['adventure'])
        after['sandbox']['placed'][0]['x'] = 3
        self.assertNotEqual(NATIVE.ownership(after), baseline)
        after['sandbox'] = copy.deepcopy(world['sandbox'])
        after['heavenCampaign'] = {'choice': 'silently overwritten'}
        self.assertNotEqual(NATIVE.ownership(after), baseline)

    def test_earned_browser_methods_use_native_controls_without_pose_hp_or_fact_writes(self):
        tree = ast.parse((ROOT / 'tools/atlantis_campaign_browser.py').read_text(encoding='utf-8-sig'))
        methods = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == 'AtlantisMixin')
        earned_names = ('run_variant', 'action', 'confirmation', 'swim', 'intake_probes', 'fight', 'until_warning', 'finish_phase', 'claim_fee')
        strings = '\n'.join(node.value for method in methods.body if isinstance(method, ast.FunctionDef) and method.name in earned_names
                            for node in ast.walk(method) if isinstance(node, ast.Constant) and isinstance(node.value, str))
        forbidden = r'\b(?:sim\.state(?:\.[A-Za-z_]\w*)+|e\.(?:hp|x|z|mode|timer)|sim\.worldDive(?:\.\w+)?)\s*=(?!=)'
        self.assertIsNone(re.search(forbidden, strings))
        self.assertIn('Realm.test.worldSwim', strings)
        self.assertIn('atlantis-campaign-claim', strings)
        source = ast.get_source_segment((ROOT / 'tools/atlantis_campaign_browser.py').read_text(encoding='utf-8-sig'),
                                        next(method for method in methods.body if isinstance(method, ast.FunctionDef) and method.name == 'fight'))
        self.assertIn("keyboard.press('f')", source)
        self.assertIn("keyboard.press('Tab')", source)
        self.assertIn('production projectile contact', source)

    def test_embedded_native_expressions_compile_without_execution(self):
        tree = ast.parse((ROOT / 'tools/atlantis_campaign_browser.py').read_text(encoding='utf-8-sig'))
        expressions = [node.args[0].value for node in ast.walk(tree) if isinstance(node, ast.Call)
                       and isinstance(node.func, ast.Attribute) and node.func.attr == 'ev' and node.args
                       and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str)]
        self.assertGreater(len(expressions), 20)
        script = "const vm=require('node:vm'),fs=require('node:fs');const xs=JSON.parse(fs.readFileSync(0,'utf8'));for(let i=0;i<xs.length;i++)new vm.Script(xs[i],{filename:'native-expression-'+i});console.log(xs.length);"
        result = subprocess.run(['node', '-e', script], input=json.dumps(expressions), capture_output=True, text=True, cwd=ROOT)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(int(result.stdout), len(expressions))

    def test_all_eight_whole_browser_checkpoint_callers_remain_in_earned_path(self):
        tree = ast.parse((ROOT / 'tools/atlantis_campaign_browser.py').read_text(encoding='utf-8-sig'))
        method = next(node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef) and node.name == 'run_variant')
        labels = [node.args[0].value for node in ast.walk(method) if isinstance(node, ast.Call)
                  and isinstance(node.func, ast.Attribute) and node.func.attr == 'restart'
                  and node.args and isinstance(node.args[0], ast.Constant)]
        self.assertEqual(labels, ['accepted', 'retained-approach', 'partial-inlet-pressure', 'actual-bearing-exposed',
                                  'independent-safety-before-disposition', 'retained-disposition', 'verified-unpaid', 'paid-once'])


if __name__ == '__main__':
    unittest.main()
