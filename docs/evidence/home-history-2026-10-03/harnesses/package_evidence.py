"""Bounded byte-preserving evidence intake. Synthetic exports only; no profiles."""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess

A=Path('D:/07-GAMES/Firstlight/artifacts/home-remembers-20261003')
F=Path('D:/07-GAMES/Firstlight/artifacts/final-home-history-remote-4240d9e-20261003')
R=Path('D:/07-GAMES/Firstlight/authoring/home-history-remote-4240d9e-20261003')
E=Path('D:/07-GAMES/Firstlight/authoring/home-history-evidence-20261003')
P=E/'docs/evidence/home-history-2026-10-03'
HEAD='4240d9eaefb81d492040295b5b2b70e08e4245c8'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
parser=argparse.ArgumentParser()
parser.add_argument('--finalize',action='store_true')
args=parser.parse_args()
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=E,text=True).strip()==HEAD
assert subprocess.check_output(['git','branch','--show-current'],cwd=E,text=True).strip()=='evidence/home-history-20261003'
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()==HEAD
P.mkdir(parents=True,exist_ok=True)
rp=A/'PACKAGE_COPY_RECEIPT.json'
rows=json.loads(rp.read_text(encoding='utf-8')) if rp.exists() else {}

def copy(source,relative):
    source=Path(source);relative=Path(relative).as_posix();target=P/relative
    assert source.is_file() and source.stat().st_size<100_000_000,source
    assert target.resolve().is_relative_to(P.resolve())
    assert not any('profile' in part.lower() or part in ('personal-saves','save-backups') for part in Path(relative).parts)
    row={'original':str(source),'bytes':source.stat().st_size,'sha256':sha(source)}
    if relative in rows: assert row==rows[relative],('original receipt changed after intake',relative)
    if target.exists(): assert sha(target)==row['sha256'],('refuse edited receipt',target)
    else:
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(source,target)
    assert target.stat().st_size==row['bytes'] and sha(target)==row['sha256']
    rows[relative]=row

media=json.loads((A/'normal-ui-rtx-01/MEDIA_RECEIPT.json').read_text(encoding='utf-8'))
assert media['exact_source_head']==HEAD
assert sha(A/'normal-ui-rtx-01/REPORT.json')==media['original_report_sha256']
assert sha(R/'tools/capture_home_history.py')==media['harness_sha256']
fixture=A/'native-05/journeys/earned-local-work/fresh-blade/FINAL_WORLD.json'
assert sha(fixture)==media['fixture_sha256']
copy(fixture,'normal-ui-rtx-01/EARNED_RECORDING_FIXTURE.json')
for source in sorted((A/'normal-ui-rtx-01').iterdir()):
    if source.is_file() and source.suffix in ('.json','.png','.mp4','.webm','.log'):
        copy(source,'normal-ui-rtx-01/'+source.name)
for name in ('HOSTED_JOBS_4240d9e.json','HOSTED_ANNOTATIONS_4240d9e.json'):
    copy(A/name,name)
for source in sorted((A/'source-gate-02').glob('*.log')):
    copy(source,'authoring-source-gate-02/'+source.name)
for epoch in ('native-01','native-02','native-03','native-04'):
    for name in ('REPORT.json','FAILURE.png'):
        if (A/epoch/name).is_file():copy(A/epoch/name,'earlier-epochs/'+epoch+'/'+name)
    for source in sorted((A/epoch).glob('*.log')):
        copy(source,'earlier-epochs/'+epoch+'/'+source.name)
for source in sorted((A/'native-05').iterdir()):
    if source.is_file() and source.suffix in ('.json','.png','.log'):
        copy(source,'authoring-native-05/'+source.name)
for source in sorted((A/'journeys-01').rglob('*.log')):
    copy(source,'earlier-epochs/journeys-01/'+source.relative_to(A/'journeys-01').as_posix())
for source in ('tools/capture_home_history.py','tests/home_history_browser.py','tests/home_history_journey.cjs','tests/home_history.test.cjs'):
    copy(R/source,'harnesses/'+Path(source).name)
for source in ('docs/development/HOME_THAT_REMEMBERS_2026-10-03.md','docs/development/HOME_HISTORY_RESULTS_2026-10-03.md','docs/playtests/HOME_THAT_REMEMBERS_2026-10-03.md'):
    label='HOME_PLAY_GUIDE_2026-10-03.md' if '/playtests/' in source else Path(source).name
    copy(R/source,'source-records/'+label)
for name in ('encode_media.py','run_remote_gate.py','package_evidence.py','verify_pushed_package.py','finalize_records.py'):
    copy(A/name,'harnesses/'+name)
copy(A.parent/'local-life-20261003/encode_and_verify.py','harnesses/encode_and_verify_local_life.py')
if args.finalize:
    g=json.loads((F/'FULL_GATE_RECEIPT.json').read_text(encoding='utf-8'))
    assert g['passed'] and g['head']==HEAD and g['browser_count']==40
    assert g['html']['index.html']['sha256']==media['html_sha256']
    for name in ('START_MANIFEST.json','RUN.json','FULL_VERIFY_CONSOLE.log','REMOTE_CLONE_LOG.txt','FULL_GATE_RECEIPT.json','SUMMARY.md','collect_full_gate.py'):
        copy(F/name,'fresh-remote-gate/'+name)
    for source in sorted((F/'commands').glob('*.log')):
        copy(source,'fresh-remote-gate/commands/'+source.name)
    for suite in g['browser_suites']:
        source=R/suite['report']
        assert sha(source)==suite['report_sha256']
        copy(source,'fresh-remote-gate/browser-reports/'+suite['suite']+'.json')
    home=R/'evidence10/home-history-browser'
    for source in sorted(home.glob('*.png')):
        copy(source,'fresh-remote-gate/home-captures/'+source.name)

rp.write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
(P/'COPY_RECEIPT.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'copied_files':len(rows),'bytes':sum(r['bytes'] for r in rows.values()),'finalized':args.finalize,'package':str(P)},indent=2))
