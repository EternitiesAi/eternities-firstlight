"""Read frozen gate receipts without running or changing product code."""
from pathlib import Path
import argparse, ast, datetime, hashlib, json, os, re, subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, required=True)
args = parser.parse_args()
ROOT = args.root.resolve()
OUT = Path(__file__).resolve().parent
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
start = json.loads((OUT/'START_MANIFEST.json').read_text(encoding='utf-8'))
run = json.loads((OUT/'RUN.json').read_text(encoding='utf-8'))
started = datetime.datetime.fromisoformat(start['started']).timestamp()
console = (OUT/'FULL_VERIFY_CONSOLE.log').read_text(encoding='utf-8-sig')
passed = set(re.findall(r'^PASS: (.+)$', console, re.M))
tree = ast.parse((ROOT/'tools/verify.py').read_text(encoding='utf-8'))
suites = next([e.value for e in n.iter.elts] for n in ast.walk(tree)
              if isinstance(n, ast.For) and isinstance(n.target, ast.Name)
              and n.target.id == 'suite')
journeys = [n.args[0].value for n in ast.walk(tree)
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)
            and n.func.id == 'run' and n.args and isinstance(n.args[0], ast.Constant)
            and n.args[0].value not in ('build', 'rules', 'python')]
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
tracked = [p for p in subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0') if p]
changed = [p for p, h in start['tracked_sha256'].items()
           if not (ROOT/p).is_file() or sha(ROOT/p) != h]
membership_added = sorted(set(tracked)-set(start['tracked_sha256']))
membership_removed = sorted(set(start['tracked_sha256'])-set(tracked))
status = subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True)
html = {p: {'bytes': (ROOT/p).stat().st_size, 'sha256': sha(ROOT/p)}
        for p in ['index.html', 'FIRSTLIGHT_VALLEY.html']}
receipt = {
    'head': head, 'origin': start['origin'], 'run': run,
    'environment': start['environment'], 'collected_at': datetime.datetime.now().astimezone().isoformat(),
    'tracked_count': len(tracked), 'tracked_changed': changed,
    'tracked_added': membership_added, 'tracked_removed': membership_removed,
    'git_status': status, 'html': html,
    'locks': {'head_unchanged': head == start['head'], 'html_unchanged': html == start['html'],
              'tracked_hashes_unchanged': not changed,
              'membership_unchanged': not membership_added and not membership_removed,
              'git_clean': not status},
    'source_modules': len(list((ROOT/'src').glob('*.js'))),
    'rule_files': len(list((ROOT/'tests').glob('*.test.cjs'))),
    'syntax_passed': sum(n.startswith('syntax-') for n in passed),
    'earned_journeys': {n: n in passed for n in journeys},
    'browser_suites_expected': suites, 'browser_suites': [], 'collection_errors': [],
    'resource_authority': start['resource_authority'],
    'limits': ['Actual fresh HTTPS remote clone; one full Windows source and native software-browser gate.',
               'Automated browser checks do not establish human pacing, accessibility or sustained GPU performance.',
               'Hosted CI is separately inspected; local execution does not imply hosted success. No account/billing action taken.',
               'Failed source, harness, appearance, GPU and optional excerpt epochs remain separately preserved.']
}
logs = OUT/'commands'
rules_path = logs/'rules.log'
if rules_path.exists():
    rules = rules_path.read_text(encoding='utf-8')
    receipt['rules'] = {k: int(re.search(r'^# '+k+r' (\d+)$', rules, re.M).group(1))
                        for k in ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']}
py_path = logs/'python.log'
if py_path.exists():
    py = py_path.read_text(encoding='utf-8')
    skipped = [l for l in py.splitlines() if ' ... skipped ' in l]
    py_count = int(re.search(r'Ran (\d+) tests', py).group(1))
    summary = py.strip().splitlines()[-1]
    counts = {k: int(m.group(1)) if (m := re.search(k+r'=(\d+)', summary)) else 0
              for k in ['failures', 'errors']}
    clean = bool(re.fullmatch(r'OK(?: \(skipped=\d+\))?', summary)) and not any(counts.values())
    receipt['python'] = {'tests': py_count, 'passed': py_count-len(skipped) if clean else None,
                         **counts, 'clean_summary': clean,
                         'summary': summary, 'skipped_cases': skipped}

def evaluate(node, env):
    if isinstance(node, ast.Constant): return node.value
    if isinstance(node, ast.Name): return env[node.id]
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div):
        return Path(evaluate(node.left, env))/evaluate(node.right, env)
    if isinstance(node, ast.BoolOp) and isinstance(node.op, ast.Or):
        return next((v for n in node.values if (v := evaluate(n, env))), None)
    if isinstance(node, ast.Attribute) and node.attr == 'output':
        if isinstance(node.value, ast.Name) or (isinstance(node.value, ast.Call)
                and isinstance(node.value.func, ast.Attribute) and node.value.func.attr == 'parse_args'):
            return env['args.output']
    if isinstance(node, ast.Call):
        if isinstance(node.func, ast.Attribute) and node.func.attr == 'resolve':
            return Path(evaluate(node.func.value, env)).resolve()
        if isinstance(node.func, ast.Name) and node.func.id == 'Path':
            return Path(evaluate(node.args[0], env))
        if isinstance(node.func, ast.Attribute) and node.func.attr == 'get' and ast.unparse(node.func.value) == 'os.environ':
            return os.environ.get(evaluate(node.args[0], env), evaluate(node.args[1], env))
    raise ValueError(ast.unparse(node))

for suite in suites:
    try:
        source = ROOT/'tests'/f'{suite}.py'
        t = ast.parse(source.read_text(encoding='utf-8'))
        env = {n: ROOT for n in ['ROOT', 'R', 'root']}
        for n in ast.walk(t):
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == 'add_argument' and n.args and isinstance(n.args[0], ast.Constant) and n.args[0].value == '--output':
                env['args.output'] = next((evaluate(k.value, env) for k in n.keywords if k.arg == 'default'), None)
        for n in t.body:
            if isinstance(n, ast.Assign):
                for target in n.targets:
                    if isinstance(target, ast.Name) and target.id in ['OUT', 'O']:
                        env[target.id] = evaluate(n.value, env)
                    if isinstance(target, ast.Tuple) and any(isinstance(e, ast.Name) and e.id == 'OUT' for e in target.elts):
                        i = next(i for i, e in enumerate(target.elts) if isinstance(e, ast.Name) and e.id == 'OUT')
                        env['OUT'] = evaluate(n.value.elts[i], env)
        paths = []
        for n in ast.walk(t):
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == 'write_text' and isinstance(n.func.value, ast.BinOp) and isinstance(n.func.value.right, ast.Constant) and isinstance(n.func.value.right.value, str) and 'report' in n.func.value.right.value.lower():
                paths.append(evaluate(n.func.value, env))
        if not paths and suite == 'earth_ground_material_browser':
            # This wrapper launches the actual framebuffer tool; it owns the
            # nested report. Require that actual fresh report, not wrapper success.
            paths = [Path(env['OUT'])/'frames/REPORT.json']
        assert len(paths) == 1, (suite, paths)
        p = Path(paths[0])
        r = json.loads(p.read_text(encoding='utf-8'))
        checks = r.get('checks', [])
        assert isinstance(checks, list), (suite, type(checks))
        results = [c.get('passed') for c in checks]
        build_hashes = {k: r[k] for k in ['html_sha256', 'build_sha256'] if k in r}
        row = {'suite': suite, 'command_passed': suite in passed, 'report': str(p.relative_to(ROOT)),
               'report_sha256': sha(p), 'harness_sha256': sha(source),
               'fresh_report': p.stat().st_mtime >= started, 'checks': len(checks),
               'passed_checks': sum(v is True for v in results),
               'failed_checks': sum(v is False for v in results),
               'unknown_checks': sum(v is not True and v is not False for v in results),
               'report_passed': r.get('passed'), 'declared_head': r.get('head', r.get('source_head')),
               'declared_status': r.get('status'),
               'declared_failed': r.get('failed'),
               'declared_counts_consistent':
                    (type(r.get('passed')) is not int or r['passed'] == sum(v is True for v in results)) and
                    (type(r.get('failed')) is not int or r['failed'] == sum(v is False for v in results)) and
                    r.get('failed') is not True and
                    str(r.get('status', '')).lower() not in ('failed', 'failure', 'error', 'incomplete'),
               'declared_head_matches': all(r[k] == head for k in ['head','source_head'] if k in r),
               'report_errors': r.get('errors', []),
               'browser_errors': r.get('browser_errors', []), 'build_hashes': build_hashes,
               'build_hashes_match': all(v == html['index.html']['sha256'] for v in build_hashes.values()),
               'scope': r.get('scope'), 'detail_probe': r.get('detail_probe'),
               'required_scope_matches': (suite != 'realm_work_presentation_browser' or
                   (r.get('scope') == 'both' and r.get('detail_probe') == 'all')) and
                   (suite != 'realm_givers_browser' or
                    (r.get('scope') == 'all-givers-and-companion-labels' and
                     any(c.get('name') == 'all and only the eleven adopted giver profiles were qualified'
                         and c.get('passed') is True for c in checks))) and
                   (suite != 'local_life_browser' or
                    (r.get('scope') == 'all-three-earned-characters' and
                     set(r.get('variants', {})) == {'fresh-blade', 'fresh-bow', 'returning-strongest'})),
               'declared_skips': {k: r[k] for k in ['skip', 'skips', 'skipped'] if k in r}}
        receipt['browser_suites'].append(row)
    except Exception as e:
        receipt['collection_errors'].append({'suite': suite, 'error': str(e)})

package = ROOT/'docs/evidence/coastward-expedition-2026-10-03'
mpath = package/'MANIFEST.json'
declared = json.loads(mpath.read_text(encoding='utf-8'))['files']
mismatches = [e['file'] for e in declared if not (package/e['file']).is_file()
              or (package/e['file']).stat().st_size != e['bytes'] or sha(package/e['file']) != e['sha256']]
names = {e['file'] for e in declared}
actual_files = {p.relative_to(package).as_posix() for p in package.rglob('*') if p.is_file()}
receipt['portable'] = {'manifest_sha256': sha(mpath), 'declared_files': len(declared),
                       'mismatches': mismatches, 'extra_files': sorted(actual_files-names-{'MANIFEST.json'}),
                       'missing_files': sorted(names-actual_files),
                       'manifest_sha_unchanged': sha(mpath) == start['portable']['manifest_sha256'],
                       'videos': [{'path': p.relative_to(package).as_posix(), 'bytes': p.stat().st_size,
                                   'sha256': sha(p), 'under_100MB': p.stat().st_size < 100_000_000}
                                  for p in sorted(package.rglob('*.mp4'))]}
receipt['browser_count'] = len(receipt['browser_suites'])
receipt['browser_checks'] = sum(s['checks'] for s in receipt['browser_suites'])
receipt['browser_failed_checks'] = sum(s['failed_checks'] for s in receipt['browser_suites'])
receipt['browser_unknown_checks'] = sum(s['unknown_checks'] for s in receipt['browser_suites'])
receipt['earned_journeys_passed'] = sum(receipt['earned_journeys'].values())
receipt['artifacts'] = {str(p.relative_to(OUT)): {'bytes': p.stat().st_size, 'sha256': sha(p)}
                        for p in [OUT/'START_MANIFEST.json', OUT/'RUN.json', OUT/'FULL_VERIFY_CONSOLE.log',
                                  OUT/'REMOTE_CLONE_LOG.txt', Path(__file__), *sorted(logs.glob('*.log'))]}
receipt['passed'] = (run['exit_code'] == 0 and 'Verification passed.' in console
    and all(receipt['locks'].values()) and receipt['syntax_passed'] == receipt['source_modules']
    and receipt.get('rules', {}).get('fail') == 0 and all(receipt['earned_journeys'].values())
    and receipt.get('python', {}).get('clean_summary') is True
    and not receipt['collection_errors'] and receipt['browser_count'] == len(suites)
    and all(s['command_passed'] and s['fresh_report'] and s['checks'] > 0 and s['failed_checks'] == 0
            and s['unknown_checks'] == 0 and s['report_passed'] is not False
            and s['declared_counts_consistent']
            and not s['report_errors'] and not s['browser_errors'] and s['build_hashes_match']
            and s['declared_head_matches']
            and s['required_scope_matches']
            for s in receipt['browser_suites'])
    and not mismatches and not receipt['portable']['extra_files']
    and not receipt['portable']['missing_files'] and receipt['portable']['manifest_sha_unchanged']
    and len(receipt['portable']['videos']) == 4 and all(v['under_100MB'] for v in receipt['portable']['videos']))
(OUT/'FULL_GATE_RECEIPT.json').write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
lines = ['# Final remote gate — exact 27bdbe5', '',
         f"Result: {'PASS' if receipt['passed'] else 'INCOMPLETE/FAIL'}. HEAD `{head}`.",
         f"Actual run: {run['started_at']} to {run['ended_at']}; exit {run['exit_code']}.",
         f"HTML: {html['index.html']['bytes']:,} bytes; SHA-256 `{html['index.html']['sha256']}`.",
         f"Tracked files: {len(tracked)}; all locks: {receipt['locks']}.",
         f"Syntax {receipt['syntax_passed']}/{receipt['source_modules']}; rules {receipt.get('rules')}; Python {receipt.get('python')}.",
         f"Earned journeys: {receipt['earned_journeys_passed']}/{len(journeys)}.",
         f"Browsers: {receipt['browser_count']}/{len(suites)}; checks {receipt['browser_checks']}; failed {receipt['browser_failed_checks']}; unknown {receipt['browser_unknown_checks']}.",
         f"Portable files: {len(declared)}; mismatches: {len(mismatches)}; four MP4 files all under 100 MB.", '',
         '| Browser suite | Checks | Failed | Fresh | Report SHA-256 |',
         '| --- | ---: | ---: | --- | --- |']
for r in receipt['browser_suites']:
    lines.append(f"| {r['suite']} | {r['checks']} | {r['failed_checks']} | {r['fresh_report']} | `{r['report_sha256']}` |")
lines += ['', f"Receipt SHA-256: `{sha(OUT/'FULL_GATE_RECEIPT.json')}`.",
          f"Console SHA-256: `{sha(OUT/'FULL_VERIFY_CONSOLE.log')}`.", '', *receipt['limits'],
          '', 'No source changes, unrelated process cleanup, main merge or deployment performed.']
(OUT/'SUMMARY.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print(json.dumps({k: receipt[k] for k in ['passed', 'head', 'syntax_passed', 'rules', 'python',
     'earned_journeys_passed', 'browser_count', 'browser_checks', 'browser_failed_checks',
     'browser_unknown_checks', 'locks', 'collection_errors']}, indent=2))
print('receipt_sha256='+sha(OUT/'FULL_GATE_RECEIPT.json'))
print('summary_sha256='+sha(OUT/'SUMMARY.md'))
