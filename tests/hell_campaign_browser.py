"""Portable entrypoint for the earned Hell campaign/native-restart suite."""
from pathlib import Path
import argparse
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', type=Path, default=ROOT / 'evidence10/hell-campaign-native')
    p.add_argument('--sources', type=Path)
    args = p.parse_args()
    output = args.output.resolve()
    if output.exists():
        p.error('Use a new output root; prior evidence remains unchanged.')
    if os.name == 'nt' and output.drive.upper() != 'D:':
        p.error('Native profiles and evidence must remain on D: on Windows.')
    sources = args.sources.resolve() if args.sources else output.with_name(output.name + '-sources')
    if args.sources is None:
        if sources.exists():
            p.error('Use new output/source roots; prior earned evidence remains unchanged.')
        for flag in ([], ['--bow'], ['--veteran']):
            subprocess.run(['node', 'tests/hell_campaign_journey.cjs', '--seed-only',
                            '--output', str(sources), *flag], cwd=ROOT, check=True)
    return subprocess.call([sys.executable, str(ROOT / 'tools/hell_campaign_browser.py'),
                            '--output', str(output), '--sources', str(sources)], cwd=ROOT)


if __name__ == '__main__':
    raise SystemExit(main())
