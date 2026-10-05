"""Portable Cosmos earned-source/native wrapper. Import has no side effects."""
from pathlib import Path
import argparse
import importlib.util
import os
import subprocess
import sys

sys.dont_write_bytecode = True
STAGE = Path(__file__).resolve().parents[1]
ROOT = Path(os.environ.get('FIRSTLIGHT_ROOT', STAGE)).resolve()


def storage_module():
    spec = importlib.util.spec_from_file_location('cosmos_native_guards', STAGE/'tools/cosmos_campaign_browser.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def plan_paths(output, sources=None, *, windows=None):
    guards = storage_module()
    output = guards.bounded(output, windows=windows)
    if output.exists():
        raise FileExistsError('Use a new native root; prior receipts are preserved.')
    if sources is not None:
        return (*guards.guard_paths(output, sources, windows=windows), False)
    sources = guards.bounded(output.with_name(output.name+'-sources'), windows=windows)
    if sources.exists():
        raise FileExistsError('Use a new earned source root or supply the completed current cohort.')
    return output, sources, True


def commands(output, sources, generate, renderer='software', root=ROOT):
    root = Path(root).resolve()
    earned = [['node', str(root/'tests/cosmos_campaign_journey.cjs'), '--root', str(root),
               '--output', str(sources), *flag] for flag in ([], ['--bow'], ['--veteran'])] if generate else []
    native = [sys.executable, str(STAGE/'tools/cosmos_campaign_browser.py'), '--root', str(root),
              '--output', str(output), '--sources', str(sources), '--renderer', renderer]
    return earned, native


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--output', type=Path, default=ROOT / 'evidence10/cosmos-campaign-native')
    parser.add_argument('--sources', type=Path)
    parser.add_argument('--renderer', choices=('software', 'hardware'), default='software')
    args = parser.parse_args(argv)
    try:
        output, sources, generate = plan_paths(args.output, args.sources)
    except (OSError, ValueError) as error:
        parser.error(str(error))
    earned, native = commands(output, sources, generate, args.renderer, args.root)
    for command in earned:
        subprocess.run(command, cwd=args.root, check=True)
    return subprocess.call(native, cwd=args.root)


if __name__ == '__main__':
    raise SystemExit(main())
