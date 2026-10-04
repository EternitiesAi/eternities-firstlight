"""Copy bounded, immutable review receipts. Never include browser profiles or personal saves."""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess

A = Path('D:/07-GAMES/Firstlight/artifacts/local-life-20261003')
F = Path('D:/07-GAMES/Firstlight/artifacts/final-local-life-remote-27bdbe5-20261003')
R = Path('D:/07-GAMES/Firstlight/authoring/local-life-remote-27bdbe5-20261003')
E = Path('D:/07-GAMES/Firstlight/authoring/local-life-evidence-20261003')
P = E/'docs/evidence/local-life-2026-10-03'
HEAD = '27bdbe585f8970c7695e04b79c7ef171e3bd1055'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
parser = argparse.ArgumentParser()
parser.add_argument('--finalize', action='store_true')
args = parser.parse_args()
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=E,text=True).strip() == HEAD
assert subprocess.check_output(['git','branch','--show-current'],cwd=E,text=True).strip() == 'evidence/local-life-20261003'
P.mkdir(parents=True,exist_ok=True)
rows_path = A/'PACKAGE_COPY_RECEIPT.json'
rows = json.loads(rows_path.read_text(encoding='utf-8')) if rows_path.exists() else {}

def copy(source, relative):
    source = Path(source)
    assert source.is_file(), source
    target = P/relative
    assert target.resolve().is_relative_to(P.resolve())
    assert not any('profile' in part.lower() or part in ('personal-saves','save-backups') for part in Path(relative).parts)
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():
        assert sha(target) == sha(source), ('refuse changed receipt',target)
    else:
        shutil.copyfile(source,target)
    assert sha(target) == sha(source)
    rows[str(relative)] = {'original': str(source),'bytes':source.stat().st_size,'sha256':sha(source)}

for source in sorted((A/'normal-ui-rtx-03').iterdir()):
    if source.is_file() and source.suffix in ('.json','.png','.mp4','.webm','.log'):
        copy(source,'normal-ui-rtx-03/'+source.name)
for name in ('BOUNDED_SOURCE_REVIEW.md','HOSTED_JOBS_27bdbe5.json','HOSTED_ANNOTATIONS_27bdbe5.json','DESKTOP_ADAPTERS_20261003.json'):
    copy(A/name,name)
for source in sorted((A/'source-gate-01').iterdir()):
    if source.is_file() and source.suffix in ('.log','.json'):
        copy(source,'authoring-source-gate/'+source.name)
for epoch in ('native-01','native-02','native-03','native-04','native-05','native-06','native-07','native-08','native-09','native-10-returning-reset','diagnostic-11-hell-cosmos','normal-ui-rtx-01','normal-ui-rtx-02'):
    for name in ('REPORT.json','FAILURE.png'):
        source = A/epoch/name
        if source.exists(): copy(source,'earlier-epochs/'+epoch+'/'+name)
    # An interrupted epoch has no final report. Copy only bounded top-level logs,
    # not an abandoned native profile, nor later synthesize a passing report.
    for source in sorted((A/epoch).glob('*.log')):
        copy(source,'earlier-epochs/'+epoch+'/'+source.name)
    if (A/(epoch+'.log')).exists():
        copy(A/(epoch+'.log'),'earlier-epochs/'+epoch+'/CONSOLE.log')

fixture = A/'native-09/earned-seeds/fresh-blade/00_EARNED_REGIONAL_HISTORY.json'
media = json.loads((A/'normal-ui-rtx-03/MEDIA_RECEIPT.json').read_text(encoding='utf-8'))
assert sha(fixture) == media['fixture_sha256']
copy(fixture,'normal-ui-rtx-03/EARNED_RECORDING_FIXTURE.json')
assert sha(R/'tools/capture_local_life.py') == media['harness_sha256']
copy(R/'tools/capture_local_life.py','harnesses/capture_local_life.py')
copy(A/'encode_and_verify.py','harnesses/encode_and_verify.py')
copy(A/'run_remote_gate.py','harnesses/run_remote_gate.py')
copy(A/'package_evidence.py','harnesses/package_evidence.py')
copy(A/'verify_pushed_package.py','harnesses/verify_pushed_package.py')
copy(A/'finalize_records.py','harnesses/finalize_records.py')
for source in ('tests/local_life_browser.py','tests/local_life_journey.cjs','tests/local_life.test.cjs'):
    copy(R/source,'harnesses/'+Path(source).name)
for source in ('docs/development/LOCAL_LIFE_2026-10-03.md','docs/development/LOCAL_LIFE_RESULTS_2026-10-03.md','docs/playtests/LOCAL_LIFE_2026-10-03.md'):
    label = 'LOCAL_LIFE_PLAY_GUIDE_2026-10-03.md' if '/playtests/' in source else Path(source).name
    copy(R/source,'source-records/'+label)

if args.finalize:
    gate = json.loads((F/'FULL_GATE_RECEIPT.json').read_text(encoding='utf-8'))
    assert gate['passed'] and gate['head'] == HEAD
    for name in ('START_MANIFEST.json','RUN.json','FULL_VERIFY_CONSOLE.log','REMOTE_CLONE_LOG.txt','FULL_GATE_RECEIPT.json','SUMMARY.md','collect_full_gate.py'):
        copy(F/name,'fresh-remote-gate/'+name)
    for source in sorted((F/'commands').glob('*.log')):
        copy(source,'fresh-remote-gate/commands/'+source.name)
    for suite in gate['browser_suites']:
        source = R/suite['report']
        assert sha(source) == suite['report_sha256']
        copy(source,'fresh-remote-gate/browser-reports/'+suite['suite']+'.json')
    native = R/'evidence10/local-life-browser'
    local = json.loads((native/'REPORT.json').read_text(encoding='utf-8'))
    assert local['scope'] == 'all-three-earned-characters'
    for source in sorted(native.iterdir()):
        # Retain installed-view and counterfactual images in both cameras,
        # all terms/payments and only labelled command-earned boundary exports.
        if source.is_file() and source.suffix in ('.png','.json','.log') and source.name != 'REPORT.json':
            copy(source,'fresh-remote-gate/local-life-captures/'+source.name)
    for variant in ('fresh-blade','fresh-bow','returning-strongest'):
        seed = native/'earned-seeds'/variant
        for source in sorted(seed.glob('*.json')):
            copy(source,'fresh-remote-gate/local-life-seeds/'+variant+'/'+source.name)

rows_path.write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
(P/'COPY_RECEIPT.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'prepared_files':len(rows),'copied_bytes':sum(x['bytes'] for x in rows.values()),'finalized':args.finalize,'package':str(P)},indent=2))
