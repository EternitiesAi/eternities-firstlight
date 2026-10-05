"""Focused CPU regression, synthetic poses + actual production swim geometry.

This does not run browsers or game suites and does not qualify actual RAF play.
"""
import ast
import json
import math
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/capture_atlantis_campaign.py'
TREE = ast.parse(SOURCE.read_text(encoding='utf-8'))
FUNCTION = next(n for n in TREE.body if isinstance(n, ast.FunctionDef) and n.name == 'swim_keys')
NAMESPACE = {'math': math}
exec(compile(ast.fix_missing_locations(ast.Module(body=[FUNCTION], type_ignores=[])), str(SOURCE), 'exec'), NAMESPACE)
swim_keys = NAMESPACE['swim_keys']

HERE = Path(__file__).resolve().parent
REPORT = HERE / 'fixtures/atlantis_capture_controller_boundary.json'


def old_key(point, snapshot):
    p, yaw = snapshot['adventure']['player'], snapshot['camera']['yaw']
    dx, dz = point['x'] - p['x'], point['z'] - p['z']
    x, z = dx * math.cos(yaw) - dz * math.sin(yaw), dx * math.sin(yaw) + dz * math.cos(yaw)
    return ['d' if x > 0 else 'a'] if abs(x) > abs(z) else ['s' if z > 0 else 'w']


class ProductionGeometry(unittest.TestCase):
    def setUp(self):
        self.report = json.loads(REPORT.read_text(encoding='utf-8'))
        self.process = subprocess.Popen(['node', str(HERE / 'atlantis_capture_swim_probe.cjs')], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')

    def tearDown(self):
        self.process.stdin.close()
        self.process.wait(timeout=10)
        error = self.process.stderr.read()
        self.process.stdout.close()
        self.process.stderr.close()
        self.assertEqual(self.process.returncode, 0, error)

    def send(self, command):
        self.process.stdin.write(json.dumps(command) + '\n')
        self.process.stdin.flush()
        result = json.loads(self.process.stdout.readline())
        self.assertNotIn('error', result)
        self.assertTrue(result['clear'], 'actual production body clearance')
        return result

    def start(self, p, y, yaw=.76):
        return self.send({'init': {'x': p['x'], 'z': p['z'], 'y': y}, 'yaw': yaw})

    def navigate(self, snapshot, target, policy, max_seconds=90):
        elapsed = 0
        while elapsed < max_seconds:
            p, dy = snapshot['adventure']['player'], target[1] - snapshot['dive']['y']
            distance = math.hypot(target[0] - p['x'], target[2] - p['z'])
            if distance < .14 and abs(dy) < .075:
                return snapshot, True, elapsed
            keys = policy({'x': target[0], 'z': target[2]}, snapshot) if distance >= .14 else []
            if abs(dy) >= .075:
                keys.append('f' if dy > 0 else 'g')
            amount = int(min(110, max(40, 1000 * max(distance if distance >= .14 else 0, abs(dy) if abs(dy) >= .075 else 0) / 2.6)))
            snapshot = self.send({'keys': keys, 'milliseconds': amount})
            elapsed += amount / 1000
        return snapshot, False, elapsed

    def test_recorded_failure_four_direction_step_is_correctly_blocked(self):
        failure = self.report['failure_diagnostics']
        s = self.start(failure['adventure']['player'], failure['world']['dive']['y'], failure['camera']['yaw'])
        keys = old_key({'x': 12, 'z': -38.4}, s)
        self.assertEqual(keys, ['w'])
        t = self.send({'keys': keys, 'milliseconds': 110})
        self.assertEqual(t['adventure']['player']['x'], s['adventure']['player']['x'])
        self.assertEqual(t['adventure']['player']['z'], s['adventure']['player']['z'])

    def test_actual_normalized_chord_moves_safely_from_recorded_failure(self):
        failure = self.report['failure_diagnostics']
        s = self.start(failure['adventure']['player'], failure['world']['dive']['y'], failure['camera']['yaw'])
        keys = swim_keys({'x': 12, 'z': -38.4}, s)
        self.assertEqual(set(keys), {'w', 'd'})
        t = self.send({'keys': keys, 'milliseconds': 110})
        self.assertGreater(t['adventure']['player']['x'], s['adventure']['player']['x'])
        self.assertLess(t['adventure']['player']['z'], s['adventure']['player']['z'])

    def test_four_direction_policy_reproduces_stall_but_eight_direction_reaches(self):
        observation = next(o for o in self.report['observations'] if o['label'] == 'east_outlet_route_12_-29')['trace'][-1]
        s = self.start(observation['player'], observation['feet_y'])
        _, reached, _ = self.navigate(s, (12, -1.4, -38.4), old_key)
        self.assertFalse(reached, 'red control must reproduce a collision stall')
        s = self.start(observation['player'], observation['feet_y'])
        final, reached, elapsed = self.navigate(s, (12, -1.4, -38.4), swim_keys)
        self.assertTrue(reached, 'same actual geometry and tolerances')
        self.assertLess(elapsed, 15)

    def test_all_remaining_ordinary_key_waypoints_keep_actual_clearance(self):
        event = next(e for e in self.report['events'] if e['label'] == 'actual_equalizer_recorded')['diagnostics']
        s = self.start(event['adventure']['player'], event['world']['dive']['y'], event['camera']['yaw'])
        for target in ((8, -2.7, -32), (8, -2.7, -29.5), (8, -1.8, -29), (12, -1.8, -29), (12, -1.4, -38.4), (12, -1.4, -39.3)):
            s, reached, elapsed = self.navigate(s, target, swim_keys)
            self.assertTrue(reached, str(target))
            self.assertLess(elapsed, 15)


if __name__ == '__main__':
    unittest.main(verbosity=2)
