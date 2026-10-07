"""CPU checks of browser-driver oracles and embedded JS syntax.

AST-loaded actual helpers use labelled synthetic native-store/controller
fixtures. They do not execute Playwright or assert rendered/native acceptance.
"""
from pathlib import Path
import ast
import copy
import json
import re
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
BROWSER = ROOT / 'tests/earth_expedition_browser.py'
CAPTURE = ROOT / 'tools/capture_earth_expedition.py'


def load_helpers(names, namespace=None):
    tree = ast.parse(BROWSER.read_text(encoding='utf-8-sig'))
    selected = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in names]
    if {n.name for n in selected} != set(names):
        raise AssertionError('Actual browser helper missing')
    scope = {} if namespace is None else namespace
    exec(compile(ast.Module(body=selected, type_ignores=[]), str(BROWSER), 'exec'), scope)
    return scope


def synthetic_world():
    keys = ['equipment', 'owned', 'arsenal', 'pursuit', 'starter', 'realmCraft', 'classPath',
            'companion', 'defeated', 'drops', 'earthStory', 'earthNotes', 'earthGathering',
            'crossing', 'road', 'beacon', 'reward', 'relic', 'angelSeen']
    world = {'adventure': {k: {'old': k} for k in keys},
             'earthExpedition': {'version': 1, 'story': {'accepted': True, 'claimed': False,
                                 'branch': 'managed-coppice', 'steps': ['clear-root-pests']},
                                 'patrol': {'lastClaim': 0, 'active': None}},
             'sandbox': {'inventory': {'wood': 8, 'fiber': 9, 'stone': 7}}}
    world['adventure'].update(xp=4, coins=17, ore=3, earthBinding={'version': 1, 'weapon': None, 'kind': None})
    world.update({k: {'old': k} for k in ['notes', 'score', 'scoreRevision', 'retreat', 'visitor',
                                         'flowers', 'journeys', 'realmTrails']})
    return world


class SyntheticLocator:
    def __init__(self, count=1, title='Living Road'):
        self.n, self.title = count, title

    def count(self):
        return self.n

    def inner_text(self):
        return self.title


class BrowserDriverCPU(unittest.TestCase):
    def test_embedded_javascript_compiles_without_running_any_client(self):
        strings = []
        for path in [BROWSER, CAPTURE]:
            tree = ast.parse(path.read_text(encoding='utf-8-sig'))
            for node in ast.walk(tree):
                if not isinstance(node, ast.Call) or not node.args:
                    continue
                name = node.func.attr if isinstance(node.func, ast.Attribute) else node.func.id if isinstance(node.func, ast.Name) else ''
                if name in {'evaluate', 'ev', 'wait_for_function', 'add_init_script'} and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str):
                    strings.append(node.args[0].value)
        compiler = 'const fs=require("fs"),s=JSON.parse(fs.readFileSync(0,"utf8"));for(const x of s)new Function(x);console.log(s.length);'
        result = subprocess.run(['node', '-e', compiler], input=json.dumps(strings), capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertGreater(int(result.stdout), 65)
        control = subprocess.run(['node', '-e', compiler], input=json.dumps(strings + ['()=>{unclosed(']), capture_output=True, text=True)
        self.assertNotEqual(control.returncode, 0, 'Syntax-error control must fail')
        self.assertIn('SyntaxError', control.stderr)

    def test_native_capture_has_no_fitting_progress_or_pose_backdoor(self):
        text = CAPTURE.read_text(encoding='utf-8-sig')
        banned = [r'Realm\.test\.\w+\s*\(', r'RealmEarthFieldcraft\.(?:begin|inspect|adjust|seat|consume|validate)\s*\(',
                  r'RealmEarthExpedition\.(?:command|acceptDefeat)\s*\(', r'__ETERNITIES_(?:TEST|CAPTURE)_MODE\s*=',
                  r'localStorage\.setItem\s*\(', r'\.dispatchEvent\s*\(', r'\.fieldcraftOwnerLease\s*=']
        for pattern in banned:
            with self.subTest(pattern=pattern):
                self.assertIsNone(re.search(pattern, text))

    def test_native_selector_refuses_ambiguous_or_missing_controls(self):
        for count in [0, 2]:
            scope = {'variant': 'synthetic', 'page': type('Page', (), {'locator': lambda self, selector: SyntheticLocator(count)})()}
            scope['check'] = lambda name, ok, evidence=None: self.assertTrue(ok, name)
            load_helpers(['fieldcraft_control'], scope)
            with self.assertRaises(AssertionError):
                scope['fieldcraft_control']('seat', 3)

    def test_temporary_fit_oracle_rejects_every_independent_durable_change(self):
        scope = load_helpers(['retained', 'ownership', 'fitting_unchanged'])
        before = synthetic_world()
        for change in [lambda w: w['earthExpedition']['story']['steps'].append('brace-root-channel'),
                       lambda w: w['adventure'].update(coins=18),
                       lambda w: w['adventure'].update(ore=4),
                       lambda w: w['sandbox']['inventory'].update(wood=7),
                       lambda w: w['adventure']['arsenal'].clear(),
                       lambda w: w['adventure']['companion'].clear(),
                       lambda w: w['journeys'].clear(), lambda w: w['realmTrails'].clear(),
                       lambda w: w['notes'].clear()]:
            after = copy.deepcopy(before)
            change(after)
            self.assertFalse(scope['fitting_unchanged'](before, after))
        self.assertEqual(before, synthetic_world())

    def restart_fixture(self, stored_change=None, cold_change=None, scene='valley', title='Living Road'):
        before, stored, after = synthetic_world(), synthetic_world(), synthetic_world()
        if stored_change:
            stored_change(stored)
        if cold_change:
            cold_change(after)
        events, snapshots = [], iter([before, after])
        def check(name, ok, evidence=None):
            events.append(name)
            if not ok:
                raise AssertionError(name)
        class Context:
            def close(self):
                events.append('context-closed')
        page = type('Page', (), {'locator': lambda self, selector: SyntheticLocator(title=title)})()
        scope = {'variant': 'synthetic', 'close': lambda: None, 'state': lambda: next(snapshots),
                 'saved_world': lambda: stored, 'check': check, 'context': Context(),
                 'start': lambda: Context(), 'spawn': lambda: page, 'diag': lambda: {'scene': scene},
                 'record': {'restarts': []}}
        load_helpers(['retained', 'ownership', 'balances', 'restart'], scope)
        return scope, events

    def test_uncertain_durable_ledger_or_balance_refuses_restart_before_close(self):
        for change in [lambda w: w['earthExpedition']['story']['steps'].clear(),
                       lambda w: w['adventure'].update(coins=18),
                       lambda w: w['sandbox']['inventory'].update(fiber=8)]:
            scope, events = self.restart_fixture(stored_change=change)
            with self.assertRaises(AssertionError):
                scope['restart']('partial support')
            self.assertNotIn('context-closed', events)

    def test_cold_ledger_binding_balance_or_original_history_loss_is_detected(self):
        for change in [lambda w: w['earthExpedition']['story'].update(claimed=True),
                       lambda w: w['adventure']['earthBinding'].update(kind='edge'),
                       lambda w: w['adventure'].update(xp=5),
                       lambda w: w['sandbox']['inventory'].update(wood=7),
                       lambda w: w['adventure']['arsenal'].clear(),
                       lambda w: w['notes'].clear()]:
            scope, events = self.restart_fixture(cold_change=change)
            with self.assertRaises(AssertionError):
                scope['restart']('partial support')
            self.assertIn('context-closed', events)
            self.assertEqual(scope['record']['restarts'], [])

    def test_expected_cold_checkpoint_and_deliberate_tracker_are_required(self):
        for scene, title in [('world-earthlands', 'Living Road'), ('valley', 'Forgotten')]:
            scope, _ = self.restart_fixture(scene=scene, title=title)
            with self.assertRaises(AssertionError):
                scope['restart']('partial support')
        scope, _ = self.restart_fixture()
        scope['restart']('partial support')
        self.assertEqual(scope['record']['restarts'], ['partial support'])


if __name__ == '__main__':
    unittest.main()
