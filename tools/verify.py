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


CLI_BROWSER_OUTPUTS = frozenset({'bridge_browser', 'earth_story_transactions_browser',
    'realm_givers_browser', 'realm_trails_north_browser',
    'coastward_bridge_posts_browser', 'practice_visibility_browser', 'hell_campaign_browser', 'heaven_campaign_browser', 'atlantis_campaign_browser', 'cosmos_campaign_browser'})
GUARDED_BROWSER_OUTPUTS = frozenset({'realm_givers_browser', 'realm_trails_north_browser',
    'coastward_bridge_posts_browser', 'practice_visibility_browser', 'hell_campaign_browser', 'heaven_campaign_browser', 'atlantis_campaign_browser', 'cosmos_campaign_browser'})
BROWSER_SOURCE_OUTPUTS = frozenset({'realm_trails_north_browser', 'practice_visibility_browser'})
ENV_BROWSER_OUTPUTS = {
    'bridge_community_browser': 'FIRSTLIGHT_BRIDGE_COMMUNITY_OUTPUT',
    'home_history_browser': 'FIRSTLIGHT_HOME_HISTORY_OUTPUT',
    'local_life_browser': 'FIRSTLIGHT_LOCAL_LIFE_OUTPUT',
    'earth_ground_material_browser': 'FIRSTLIGHT_EARTH_GROUND_OUTPUT',
    'camera_browser': 'FIRSTLIGHT_CAMERA_OUTPUT',
    'earth_expedition_browser': 'FIRSTLIGHT_EXPEDITION_OUTPUT',
    'coastward_scenery_browser': 'FIRSTLIGHT_SCENERY_OUTPUT',
    'realm_work_presentation_browser': 'FIRSTLIGHT_REALM_WORK_OUTPUT',
}


def browser_run_spec(suite, output, mode="guarded"):
    command = [sys.executable, f'tests/{suite}.py']
    extra_env = {}
    if mode not in ("guarded", "supported"):
        raise ValueError("Unknown browser output mode")
    if mode == "guarded" and suite not in GUARDED_BROWSER_OUTPUTS:
        return command, extra_env
    if output is not None:
        target = output / suite
        if suite in CLI_BROWSER_OUTPUTS:
            command += ['--output', str(target)]
            if suite in BROWSER_SOURCE_OUTPUTS:
                command += ['--sources', str(target / 'earned-sources')]
        elif suite in ENV_BROWSER_OUTPUTS:
            extra_env[ENV_BROWSER_OUTPUTS[suite]] = str(target)
    return command, extra_env


def reserve_browser_output(output):
    if output is not None:
        # Atomically claim a fresh root before any source/suite work can run.
        output.mkdir(parents=True, exist_ok=False)


def prepare_browser_sources(output, *, root=ROOT):
    if output is None:
        return None
    source = root / 'evidence10/starter'
    target = output / 'practice_visibility_browser/earned-sources'
    if target.resolve().is_relative_to(source.resolve()):
        raise ValueError('Browser evidence must not recursively copy its source.')
    # The successful source gate has just generated these command-earned cases.
    # Use the browser suite's supported external-source contract, byte-preserved.
    # Never overwrite a prior evidence destination on retry.
    shutil.copytree(source, target)
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', action='store_true', help='Also run the current browser suites including starter progression and native persistence (requires requirements-dev.txt and Chromium).')
    parser.add_argument('--output', type=Path, default=ROOT / 'verification', help='Directory for fresh command logs.')
    parser.add_argument('--browser-output', type=Path, help='Route suites with existing output contracts to a separate evidence directory (D: on Windows); requires --browser. Legacy small screenshots keep their defaults.')
    parser.add_argument('--browser-output-mode', choices=('guarded', 'supported'), default='guarded', help='guarded routes only the four suites requiring D: on Windows; supported routes every existing output contract.')
    args = parser.parse_args()
    if args.browser_output is not None:
        if not args.browser:
            parser.error('--browser-output requires --browser')
        args.browser_output = args.browser_output.resolve()
        if os.name == 'nt' and args.browser_output.drive.upper() != 'D:':
            parser.error('--browser-output must stay on D: on Windows')
        try:
            reserve_browser_output(args.browser_output)
        except FileExistsError:
            parser.error('--browser-output must name a new directory; prior evidence stays untouched')
    if not shutil.which('node'):
        parser.error('Node.js is required for development checks. Install Node 22 or 24.')
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    env = {**os.environ, 'PYTHONUTF8': '1'}
    print(f'Python: {sys.version.split()[0]}; Node: {subprocess.check_output(["node", "--version"], text=True).strip()}', flush=True)
    print(f'Logs: {output}', flush=True)

    def run(name, command, timeout=180, extra_env=None):
        print(f'Running {name}...', flush=True)
        log = output / (name + '.log')
        with log.open('wb') as stream:
            try:
                result = subprocess.run(command, cwd=ROOT, env={**env, **(extra_env or {})}, stdout=stream,
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
    # The wrapper cases execute complete command-earned journeys. Allow for
    # their measured disk work on Windows while retaining a bounded failure.
    run('python', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py', '-v'], timeout=600)
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
    run('earth-expedition-blade', ['node', 'tests/earth_expedition_journey.cjs'])
    run('earth-expedition-bow', ['node', 'tests/earth_expedition_journey.cjs', '--bow'])
    run('earth-expedition-veteran', ['node', 'tests/earth_expedition_journey.cjs', '--veteran'])
    run('local-life-blade', ['node', 'tests/local_life_journey.cjs'])
    run('local-life-bow', ['node', 'tests/local_life_journey.cjs', '--bow'])
    run('local-life-veteran', ['node', 'tests/local_life_journey.cjs', '--veteran'])
    run('home-history-blade', ['node', 'tests/home_history_journey.cjs'])
    run('home-history-bow', ['node', 'tests/home_history_journey.cjs', '--bow'])
    run('home-history-veteran', ['node', 'tests/home_history_journey.cjs', '--veteran'])
    run('bridge-community-blade', ['node', 'tests/bridge_community_journey.cjs'])
    run('bridge-community-bow', ['node', 'tests/bridge_community_journey.cjs', '--bow'])
    run('bridge-community-veteran', ['node', 'tests/bridge_community_journey.cjs', '--veteran'])
    run('hell-campaign-blade', ['node', 'tests/hell_campaign_journey.cjs'])
    run('hell-campaign-bow', ['node', 'tests/hell_campaign_journey.cjs', '--bow'])
    run('hell-campaign-veteran', ['node', 'tests/hell_campaign_journey.cjs', '--veteran'])
    # Small canonical source JSON may stay in a C checkout. Explicit new D
    # log roots also own their new earned-source cohort; never replace one.
    heaven_output = output / 'heaven-campaign-earned'
    if os.name == 'nt' and heaven_output.drive.upper() != 'D:':
        heaven_output = ROOT / 'evidence10/heaven-campaign-earned'
    run('heaven-campaign-blade', ['node', 'tests/heaven_campaign_journey.cjs', '--output', str(heaven_output)])
    run('heaven-campaign-bow', ['node', 'tests/heaven_campaign_journey.cjs', '--output', str(heaven_output), '--bow'])
    run('heaven-campaign-veteran', ['node', 'tests/heaven_campaign_journey.cjs', '--output', str(heaven_output), '--veteran'])
    atlantis_output = output / 'atlantis-campaign-earned'
    if os.name == 'nt' and atlantis_output.drive.upper() != 'D:':
        atlantis_output = ROOT / 'evidence10/atlantis-campaign-earned'
    run('atlantis-campaign-blade', ['node', 'tests/atlantis_campaign_journey.cjs', '--output', str(atlantis_output)])
    run('atlantis-campaign-bow', ['node', 'tests/atlantis_campaign_journey.cjs', '--output', str(atlantis_output), '--bow'])
    run('atlantis-campaign-veteran', ['node', 'tests/atlantis_campaign_journey.cjs', '--output', str(atlantis_output), '--veteran'])
    cosmos_output = output / 'cosmos-campaign-earned'
    if os.name == 'nt' and cosmos_output.drive.upper() != 'D:':
        cosmos_output = ROOT / 'evidence10/cosmos-campaign-earned'
    run('cosmos-campaign-blade', ['node', 'tests/cosmos_campaign_journey.cjs', '--output', str(cosmos_output)])
    run('cosmos-campaign-bow', ['node', 'tests/cosmos_campaign_journey.cjs', '--output', str(cosmos_output), '--bow'])
    run('cosmos-campaign-veteran', ['node', 'tests/cosmos_campaign_journey.cjs', '--output', str(cosmos_output), '--veteran'])
    # One portable cohort earns all three Earth continuations and then checks
    # its exact checkpoints. Historical prerequisite worlds are labelled;
    # this does not claim a new beginning-to-ending or native-browser run.
    homecoming_output = output / 'earth-homecoming-earned'
    if os.name == 'nt' and homecoming_output.drive.upper() != 'D:':
        homecoming_output = ROOT / 'evidence10/earth-homecoming-earned'
    run('earth-homecoming-earned', ['node', 'tools/earth_homecoming_journey.cjs', '--output', str(homecoming_output)], timeout=600)
    cohort_path = homecoming_output / 'CONNECTED_EARTH_HOMECOMING_REPORT.json'
    run('earth-homecoming-native-preflight', [sys.executable, 'tests/test_earth_homecoming_native.py', '-v'], timeout=180,
        extra_env={'FIRSTLIGHT_ROOT': str(ROOT), 'EARTH_EARNED_SOURCES': str(homecoming_output),
                   'EARTH_EARNED_COHORT_SHA': hashlib.sha256(cohort_path.read_bytes()).hexdigest(),
                   'EARTH_EARNED_CALLER_ROOT': str(ROOT / 'tools/earth-homecoming-journey')})
    whole_draft_output = output / 'whole-draft-earned'
    if os.name == 'nt' and whole_draft_output.drive.upper() != 'D:':
        whole_draft_output = ROOT / 'evidence10/whole-draft-earned'
    run('whole-draft-earned', ['node', 'tools/whole_draft_journey.cjs', '--output', str(whole_draft_output)], timeout=600)
    if args.browser:
        prepare_browser_sources(args.browser_output)
        command, extra_env = browser_run_spec('cosmos_campaign_browser', args.browser_output, mode=args.browser_output_mode)
        run('cosmos_campaign_browser', command, timeout=1200, extra_env=extra_env)
        command, extra_env = browser_run_spec('atlantis_campaign_browser', args.browser_output, mode=args.browser_output_mode)
        run('atlantis_campaign_browser', command, timeout=1200, extra_env=extra_env)
        command, extra_env = browser_run_spec('heaven_campaign_browser', args.browser_output, mode=args.browser_output_mode)
        run('heaven_campaign_browser', command, timeout=1200, extra_env=extra_env)
        command, extra_env = browser_run_spec('hell_campaign_browser', args.browser_output, mode=args.browser_output_mode)
        run('hell_campaign_browser', command, timeout=1200, extra_env=extra_env)
        # Qualify the recently extended Earth presentation and native giver
        # route first; fail promptly while retaining every default suite.
        for suite in ['bridge_community_browser', 'home_history_browser', 'local_life_browser', 'earth_ground_material_browser', 'realm_givers_browser', 'crossing_browser', 'regression09_browser', 'cutaway_browser', 'reflection_browser', 'native_origin_browser', 'starter_browser', 'camera_browser', 'pursuit_browser', 'characters_browser', 'classes_browser', 'cosmos_browser', 'earth_browser', 'earth_story_browser', 'earth_notes_browser', 'gathering_browser', 'realm_atlas_browser', 'timber_browser', 'traveler_browser', 'bridge_browser', 'combat_cue_browser', 'world_foundations_browser', 'world_cutaway_browser', 'realm_trails_browser', 'realm_trails_north_browser', 'realm_trails_cosmos_browser', 'soundscape_browser', 'journey_usability_browser', 'workshop_transactions_browser', 'companion_presentation_browser', 'skitter_presentation_browser', 'coastward_scenery_browser', 'earth_story_transactions_browser', 'coastward_bridge_posts_browser', 'practice_visibility_browser', 'realm_work_presentation_browser', 'earth_expedition_browser']:
            # Giver coverage walks eleven actors and companion near/far controls.
            # Local life restarts all Chromium 48 times across three earned cases.
            # Keep the complete routes/assertions in a bounded 20-minute window.
            command, extra_env = browser_run_spec(suite, args.browser_output, mode=args.browser_output_mode)
            run(suite, command, timeout=1200 if suite in ('realm_givers_browser', 'local_life_browser') else 600, extra_env=extra_env)
    print('Verification passed. Automated checks do not qualify human pacing or device performance.', flush=True)


if __name__ == '__main__':
    main()
