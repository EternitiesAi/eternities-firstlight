"""Portable entrypoint for the earned Heaven campaign/native-restart suite."""
from pathlib import Path
import argparse
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'evidence10/heaven-campaign-native')
    parser.add_argument('--sources', type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.exists():
        parser.error('Use a new output root; prior evidence remains unchanged.')
    if os.name == 'nt' and output.drive.upper() != 'D:':
        parser.error('Native profiles and evidence must remain on D: on Windows.')
    sources = args.sources.resolve() if args.sources else output.with_name(output.name + '-sources')
    if args.sources is None:
        if sources.exists():
            parser.error('Use new output/source roots; prior earned evidence remains unchanged.')
        # Native preflight requires the complete earned journey report beside
        # each seed/provenance pair; seed-only output cannot qualify this suite.
        for flag in ([], ['--bow'], ['--veteran']):
            subprocess.run(['node', 'tests/heaven_campaign_journey.cjs',
                            '--output', str(sources), *flag], cwd=ROOT, check=True)
    return subprocess.call([sys.executable, str(ROOT / 'tools/heaven_campaign_browser.py'),
                            '--output', str(output), '--sources', str(sources)], cwd=ROOT)


if __name__ == '__main__':
    raise SystemExit(main())
