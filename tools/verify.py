#!/usr/bin/env python3
"""Rebuild and test Firstlight without shell-specific globs or runtime packages."""
from pathlib import Path
import argparse
import hashlib
import os
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', action='store_true', help='Also run the current browser suites including starter progression and native persistence (requires requirements-dev.txt and Chromium).')
    parser.add_argument('--output', type=Path, default=ROOT / 'verification', help='Directory for fresh command logs.')
    args = parser.parse_args()
    if not shutil.which('node'):
        parser.error('Node.js is required for development checks. Install Node 22 or 24.')
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    env = {**os.environ, 'PYTHONUTF8': '1'}
    print(f'Python: {sys.version.split()[0]}; Node: {subprocess.check_output(["node", "--version"], text=True).strip()}', flush=True)
    print(f'Logs: {output}', flush=True)

    def run(name, command, timeout=180):
        print(f'Running {name}...', flush=True)
        log = output / (name + '.log')
        with log.open('wb') as stream:
            try:
                result = subprocess.run(command, cwd=ROOT, env=env, stdout=stream,
                                        stderr=subprocess.STDOUT, timeout=timeout)
            except subprocess.TimeoutExpired:
                print(f'FAILED: {name} exceeded {timeout}s; see {log}', file=sys.stderr)
                raise SystemExit(1)
        if result.returncode:
            print(log.read_text(encoding='utf-8', errors='replace')[-6000:], file=sys.stderr)
            raise SystemExit(f'FAILED: {name} (exit {result.returncode}); see {log}')
        print(f'PASS: {name}', flush=True)

    html = [ROOT / 'FIRSTLIGHT_VALLEY.html', ROOT / 'index.html']
    before = [p.read_bytes() if p.exists() else None for p in html]
    run('build', [sys.executable, 'build.py'])
    after = [p.read_bytes() for p in html]
    if before != after:
        raise SystemExit('FAILED: checked-in HTML was stale or missing. Review the rebuilt HTML, then run verification again.')
    if after[0] != after[1]:
        raise SystemExit('FAILED: the two HTML outputs differ.')
    print(f'HTML: {len(after[0])} bytes; SHA-256 {hashlib.sha256(after[0]).hexdigest()}', flush=True)

    modules = sorted((ROOT / 'src').glob('*.js'))
    rules = sorted((ROOT / 'tests').glob('*.test.cjs'))
    if not modules or not rules:
        raise SystemExit('FAILED: source modules or rule tests are missing.')
    for module in modules:
        run('syntax-' + module.stem, ['node', '--check', str(module)])
    run('rules', ['node', '--test', '--test-reporter=tap', *map(str, rules)])
    print('\n'.join((output / 'rules.log').read_text(encoding='utf-8').splitlines()[-9:]), flush=True)
    run('python', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py', '-v'])
    print('\n'.join((output / 'python.log').read_text(encoding='utf-8').splitlines()[-5:]), flush=True)
    run('crossing-blade', ['node', 'tests/crossing_journey.cjs'])
    run('crossing-bow', ['node', 'tests/crossing_journey.cjs', '--bow'])
    run('starter-blade', ['node', 'tests/starter_journey.cjs'])
    run('starter-bow', ['node', 'tests/starter_journey.cjs', '--bow'])
    run('starter-veteran', ['node', 'tests/starter_veteran.cjs'])
    run('pursuit-blade', ['node', 'tests/pursuit_journey.cjs'])
    run('pursuit-bow', ['node', 'tests/pursuit_journey.cjs', '--bow'])
    run('pursuit-veteran', ['node', 'tests/pursuit_journey.cjs', '--veteran'])
    run('characters-journey', ['node', 'tests/characters_journey.cjs', '--sources-ready'])
    run('classes-journey', ['node', 'tests/classes_journey.cjs', '--sources-ready'])
    run('cosmos-journey', ['node', 'tests/cosmos_journey.cjs', '--sources-ready'])
    run('earth-journey', ['node', 'tests/earth_journey.cjs', '--sources-ready'])
    run('earth-outing-blade', ['node', 'tests/pursuit_journey.cjs', '--earth'])
    run('earth-outing-bow', ['node', 'tests/pursuit_journey.cjs', '--earth', '--bow'])
    run('earth-outing-veteran', ['node', 'tests/pursuit_journey.cjs', '--earth', '--veteran'])
    run('earth-story-blade', ['node', 'tests/earth_story_journey.cjs'])
    run('earth-story-bow', ['node', 'tests/earth_story_journey.cjs', '--bow'])
    run('earth-story-veteran', ['node', 'tests/earth_story_journey.cjs', '--veteran', '--sources-ready'])
    run('earth-notes-blade', ['node', 'tests/earth_notes_journey.cjs', '--sources-ready'])
    run('earth-notes-bow', ['node', 'tests/earth_notes_journey.cjs', '--bow', '--sources-ready'])
    run('earth-notes-veteran', ['node', 'tests/earth_notes_journey.cjs', '--veteran', '--sources-ready'])
    run('gathering-blade', ['node', 'tests/gathering_journey.cjs', '--sources-ready'])
    run('gathering-bow', ['node', 'tests/gathering_journey.cjs', '--bow', '--sources-ready'])
    run('gathering-veteran', ['node', 'tests/gathering_journey.cjs', '--veteran', '--sources-ready'])
    run('world-foundations-blade', ['node', 'tests/world_foundations_journey.cjs'])
    run('world-foundations-bow', ['node', 'tests/world_foundations_journey.cjs', '--bow'])
    run('world-foundations-veteran', ['node', 'tests/world_foundations_journey.cjs', '--veteran'])
    run('realm-trails-blade', ['node', 'tests/realm_trails_journey.cjs'])
    run('realm-trails-bow', ['node', 'tests/realm_trails_journey.cjs', '--bow'])
    run('realm-trails-south-blade', ['node', 'tests/realm_trails_south_journey.cjs'])
    run('realm-trails-south-bow', ['node', 'tests/realm_trails_south_journey.cjs', '--bow'])
    run('realm-comparator-blade', ['node', 'tests/realm_trails_cosmos_journey.cjs'])
    run('realm-comparator-bow', ['node', 'tests/realm_trails_cosmos_journey.cjs', '--bow'])
    run('realm-comparator-veteran', ['node', 'tests/realm_trails_cosmos_journey.cjs', '--veteran'])
    if args.browser:
        for suite in ['crossing_browser', 'regression09_browser', 'cutaway_browser', 'reflection_browser', 'native_origin_browser', 'starter_browser', 'camera_browser', 'pursuit_browser', 'characters_browser', 'classes_browser', 'cosmos_browser', 'earth_browser', 'earth_story_browser', 'earth_notes_browser', 'gathering_browser', 'realm_atlas_browser', 'timber_browser', 'traveler_browser', 'bridge_browser', 'combat_cue_browser', 'world_foundations_browser', 'world_cutaway_browser', 'realm_trails_browser', 'realm_trails_north_browser', 'realm_trails_cosmos_browser', 'soundscape_browser', 'journey_usability_browser', 'workshop_transactions_browser', 'companion_presentation_browser', 'skitter_presentation_browser', 'coastward_scenery_browser', 'realm_givers_browser', 'earth_story_transactions_browser']:
            run(suite, [sys.executable, f'tests/{suite}.py'], timeout=600)
    print('Verification passed. Automated checks do not qualify human pacing or device performance.', flush=True)


if __name__ == '__main__':
    main()
