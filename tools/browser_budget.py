#!/usr/bin/env python3
"""Run an unchanged synchronous browser suite with recorded host RAM admission.

This is extra execution instrumentation, not a substitute for the suite's own
source, persistence, runtime-error or resource-closure checks. No browser/driver
is started here. The suite starts its normal driver; each allocation is then
admitted using a fresh host-only observation. Python children inherit this runner.
No VM, unrelated process, personal profile, or machine configuration is changed.
"""
from contextlib import contextmanager
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import os
import re
import runpy
import subprocess
import sys
import tempfile
import traceback
import uuid

RUNNER = Path(__file__).resolve()
MINIMUM_FREE_KIB = 6 * 1024 * 1024


class MemoryAdmissionError(RuntimeError):
    pass


def host_free_kib():
    if os.name == 'nt':
        # Same conservative CIM metric used by the desktop native controllers.
        result = subprocess.check_output(
            ['powershell', '-NoProfile', '-Command',
             '(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory'],
            text=True, timeout=30)
        return int(result.strip())
    if sys.platform.startswith('linux'):
        for line in Path('/proc/meminfo').read_text().splitlines():
            if line.startswith('MemAvailable:'):
                parts = line.split()
                if len(parts) == 3 and parts[2] == 'kB':
                    return int(parts[1])
    raise MemoryAdmissionError('No reviewed host-memory probe for this platform')


class AllocationGate:
    def __init__(self, probe, emit):
        self.probe, self.emit, self.failed = probe, emit, False

    def record(self, event):
        try:self.emit(event)
        except BaseException:
            self.failed=True
            raise

    def wrap(self, original, method):
        def admitted(*args, **kwargs):
            try:
                free = self.probe()
                if type(free) is not int or free < 0:
                    raise ValueError('Invalid available-memory observation')
            except Exception as error:
                self.failed = True
                self.record(dict(event='probe-error', method=method, error=repr(error)))
                raise MemoryAdmissionError('Host-memory probe unavailable; no browser allocated') from error
            accepted = free >= MINIMUM_FREE_KIB
            if not accepted:
                self.failed = True
            # Receipt failure also stops before allocation; never run unobserved.
            self.record(dict(event='admission', method=method, freeHostKiB=free,
                             minimumFreeKiB=MINIMUM_FREE_KIB, admitted=accepted))
            if not accepted:
                raise MemoryAdmissionError(
                    f'Host memory admission refused: {free}KiB < {MINIMUM_FREE_KIB}KiB; no browser allocated')
            try:
                result = original(*args, **kwargs)
            except BaseException as error:
                self.failed = True
                self.record(dict(event='allocation-error', method=method, error=repr(error)))
                raise
            try:self.record(dict(event='allocated', method=method))
            except BaseException:
                # The suite has not received this owned allocation yet. Close it
                # here if its receipt cannot be retained; do not strand it.
                try:result.close()
                except BaseException as close_error:
                    raise RuntimeError('Allocated browser receipt failed and owned close failed') from close_error
                raise
            return result
        return admitted


@contextmanager
def patched_allocations(browser_type, gate):
    names = ('launch', 'launch_persistent_context')
    originals = {name: getattr(browser_type, name) for name in names}
    try:
        for name, method in originals.items():
            setattr(browser_type, name, gate.wrap(method, name))
        yield
    finally:
        for name, method in originals.items():
            setattr(browser_type, name, method)


def python_child_command(command, *, cwd, root, output, run_id):
    if not isinstance(command, (list, tuple)) or not command:
        raise ValueError('Browser children require explicit argv; shell strings are not admitted')
    name = Path(str(command[0])).name.lower()
    if not re.fullmatch(r'python(?:\d+(?:\.\d+)*)?w?(?:\.exe)?', name):
        return command
    if Path(command[0]).resolve() != Path(sys.executable).resolve():
        raise ValueError('Python browser children must use the current verified interpreter')
    rest = list(command[1:]); flags = []
    while rest and rest[0] in ('-B', '-u'):
        flags.append(rest.pop(0))
    if not rest or str(rest[0]).startswith('-'):
        raise ValueError('Python browser children require an explicit reviewed script, not -m/-c')
    script = Path(rest[0])
    script = (Path(cwd) / script).resolve() if not script.is_absolute() else script.resolve()
    if script == RUNNER or not script.is_relative_to(Path(root).resolve()) or script.suffix != '.py' or not script.is_file():
        raise ValueError('Child must be an existing game script, never a runner recursion or external script')
    return [sys.executable, *flags, str(RUNNER), '--root', str(root), '--output', str(output),
            '--temp-dir', os.environ.get('TEMP', tempfile.gettempdir()), '--child-run', run_id,
            '--', str(script), *rest[1:]]


@contextmanager
def patched_children(root, output, run_id, *, on_refusal=None, children=None):
    original = subprocess.Popen
    def dispatch(args, *rest, **kwargs):
        try:
            if kwargs.get('shell') or kwargs.get('executable') is not None:
                raise ValueError('Browser child shell/executable overrides are not admitted')
            command = python_child_command(args, cwd=kwargs.get('cwd') or Path.cwd(),
                                           root=root, output=output, run_id=run_id)
            process = original(command, *rest, **kwargs)
        except BaseException as error:
            if on_refusal is not None:on_refusal(error)
            raise
        # No receipt I/O between successful spawn and returning ownership to the
        # suite. The child writes its own process-start receipt. Keep the exact
        # handle for finalization even if the suite does not wait for it.
        if command != args and children is not None:children.append(process)
        return process
    try:
        subprocess.Popen = dispatch
        yield
    finally:
        subprocess.Popen = original


def finish_children(children, emit):
    """Retain failed/unfinished children; clean up only handles spawned here.

    Normal reviewed callers synchronously wait for their Python child. A live
    child at suite exit is a failure, even if this bounded cleanup succeeds.
    This does not certify descendant browser/driver closure.
    """
    failed = False
    for child in children:
        row = dict(event='child-observed-exit', childPid=child.pid)
        try:
            code = child.poll()
            row['exitCode'] = code
            if code is None:
                failed = True
                row['unfinishedAtSuiteExit'] = True
                try:child.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    child.terminate();row['terminatedOwnedChild'] = True
                    try:child.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        child.kill();row['killedOwnedChild'] = True
                        child.wait(timeout=5)
                row['cleanupExitCode'] = child.poll()
            elif code != 0:
                failed = True
        except BaseException as error:
            failed = True
            row['cleanupError'] = repr(error)
            traceback.print_exc()
        # A failed disk must not prevent cleanup of another exact owned child.
        try:emit(row)
        except BaseException:
            failed = True
            traceback.print_exc()
    return failed


def configure_temp(directory, *, windows=None):
    path = Path(directory)
    if not path.is_absolute() or not path.is_dir():
        raise ValueError('Browser temporary directory must be existing and absolute')
    path = path.resolve()
    if path == Path(path.anchor) or ((os.name == 'nt' if windows is None else windows) and path.drive.upper() != 'D:'):
        raise ValueError('Use a bounded D-drive temporary directory on Windows')
    for key in ('TEMP', 'TMP', 'TMPDIR'):
        os.environ[key] = str(path)
    # A suite may use TemporaryDirectory before starting its driver.
    tempfile.tempdir = None


def execute_target(script, arguments):
    script = Path(script).resolve()
    old_argv, old_path = sys.argv[:], sys.path[:]
    try:
        sys.argv[:] = [str(script), *arguments]
        sys.path.insert(0, str(script.parent))
        runpy.run_path(str(script), run_name='__main__')
    finally:
        sys.argv[:] = old_argv
        sys.path[:] = old_path


def audit_process_logs(output, run_id, *, exclude=None):
    paths = [p for p in Path(output).glob('process-*.jsonl') if p != exclude]
    for path in paths:
        rows = [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines()]
        if (not rows or rows[0].get('event') != 'process-start' or rows[-1].get('event') != 'process-finish'
                or rows[0].get('runId') != run_id or rows[-1].get('runId') != run_id
                or rows[-1].get('exitCode') != 0
                or any(r.get('event') in ('probe-error', 'allocation-error', 'child-dispatch-error') or
                       r.get('event') == 'admission' and r.get('admitted') is not True for r in rows)):
            raise ValueError('Unfinished, refused or failed browser-budget process: '+str(path))
    return len(paths)


def run_suite(script, arguments, *, browser_type, gate, root, output, run_id):
    """Run one suite and retain failures even if its own code catches them."""
    code = 0
    children = []
    def child_refused(error):
        gate.failed = True
        gate.record(dict(event='child-dispatch-error', error=repr(error)))
    try:
        with patched_allocations(browser_type, gate), patched_children(
                root, output, run_id, on_refusal=child_refused, children=children):
            execute_target(script, arguments)
    except SystemExit as error:
        code = error.code if isinstance(error.code, int) else (0 if error.code is None else 1)
        if code:traceback.print_exc()
    except BaseException:
        traceback.print_exc();code = 1
    finally:
        if gate.failed and code == 0:code = 3
        if finish_children(children, gate.record):code = 1
    return code


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--temp-dir', type=Path, required=True)
    parser.add_argument('--child-run', help=argparse.SUPPRESS)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    root, output = args.root.resolve(), args.output.resolve()
    if not command:
        parser.error('A target script is required after --')
    script = Path(command[0]).resolve()
    if not root.is_dir() or not script.is_file() or not script.is_relative_to(root) or script == RUNNER:
        parser.error('The target must be an existing script inside the declared game root')
    if script == root/'tools/verify.py':
        parser.error('Dispatch individual native suites here; the verifier owns separate CPU checks.')
    if output == Path(output.anchor) or os.name == 'nt' and output.drive.upper() != 'D:':
        parser.error('Browser admission evidence must use a bounded D directory on Windows')
    configure_temp(args.temp_dir)
    runner_sha = hashlib.sha256(RUNNER.read_bytes()).hexdigest()
    if args.child_run:
        session = json.loads((output/'SESSION.json').read_text(encoding='utf-8'))
        if session['runId'] != args.child_run or session['root'] != str(root) or session['runnerSHA256'] != runner_sha:
            raise ValueError('Parent browser-budget session identity drift')
        run_id = args.child_run
    else:
        output.mkdir(parents=True, exist_ok=False)
        run_id = uuid.uuid4().hex
        session = dict(schema='firstlight-browser-budget/v1', runId=run_id, root=str(root),
                       runnerSHA256=runner_sha, minimumFreeKiB=MINIMUM_FREE_KIB,
                       tempDirectory=os.environ['TEMP'], target=str(script), arguments=command[1:],
                       sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),
                       scope='Fresh host-only admission before each sync Playwright browser allocation; not suite success or closure evidence')
        with (output/'SESSION.json').open('x',encoding='utf-8') as stream:
            json.dump(session,stream,indent=2);stream.write('\n')
    logfile = output/f'process-{os.getpid()}-{uuid.uuid4().hex}.jsonl'
    def emit(event):
        with logfile.open('a',encoding='utf-8') as stream:
            stream.write(json.dumps(dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                                        pid=os.getpid(),runId=run_id,**event))+'\n')
    emit(dict(event='process-start',script=str(script),parentPid=os.getppid()))
    gate = AllocationGate(host_free_kib,emit); code=0
    try:
        # Import only after TEMP is fixed. Never preload either browser_support.
        from playwright.sync_api import BrowserType
        code=run_suite(script,command[1:],browser_type=BrowserType,gate=gate,
                       root=root,output=output,run_id=run_id)
    except BaseException:
        traceback.print_exc();code=1
    finally:
        if not args.child_run:
            try:audit_process_logs(output,run_id,exclude=logfile)
            except Exception:
                traceback.print_exc();code=1
        emit(dict(event='process-finish',exitCode=code,guardFailed=gate.failed))
    return code


if __name__=='__main__':
    raise SystemExit(main())
