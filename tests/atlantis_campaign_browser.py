"""Portable entrypoint for complete earned Atlantis journeys and native proof.

No browser, subprocess or filesystem mutation occurs when this module imports.
Native execution needs an exclusive browser slot. Profiles stay in a fresh D
evidence tree on Windows; the wrapper never copies an existing profile or movie.
"""
from pathlib import Path
import argparse
import importlib.util
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def storage_module():
    spec = importlib.util.spec_from_file_location('firstlight_atlantis_storage_guards', ROOT / 'tools/atlantis_campaign_browser.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def plan_paths(output, sources=None, *, windows=None):
    guards = storage_module()
    output = guards.bounded(output, windows=windows)
    if output.exists():
        raise FileExistsError('Use a new native evidence root; prior receipts remain unchanged.')
    if sources is not None:
        return (*guards.guard_paths(output, sources, windows=windows), False)
    sources = guards.bounded(output.with_name(output.name + '-sources'), windows=windows)
    if sources.exists():
        raise FileExistsError('Use a new earned source root; prior source receipts remain unchanged.')
    if guards.within(output, sources) or guards.within(sources, output):
        raise ValueError('Earned sources and native profiles must have separate ownership.')
    return output, sources, True


def commands(output, sources, generate, renderer='software'):
    # Full journeys emit provenance, checkpoint hashes, actual combat and the
    # complete passed report; the native preflight refuses seed-only receipts.
    earned = [['node', str(ROOT / 'tests/atlantis_campaign_journey.cjs'),
               '--output', str(sources), *flag] for flag in ([], ['--bow'], ['--veteran'])] if generate else []
    native = [sys.executable, str(ROOT / 'tools/atlantis_campaign_browser.py'),
              '--output', str(output), '--sources', str(sources), '--renderer', renderer]
    return earned, native


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'evidence10/atlantis-campaign-native')
    parser.add_argument('--sources', type=Path)
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='software')
    args = parser.parse_args(argv)
    try:
        output, sources, generate = plan_paths(args.output, args.sources)
    except (ValueError, OSError) as error:
        parser.error(str(error))
    earned, native = commands(output, sources, generate, args.renderer)
    for command in earned:
        subprocess.run(command, cwd=ROOT, check=True)
    return subprocess.call(native, cwd=ROOT)


if __name__ == '__main__':
    raise SystemExit(main())
