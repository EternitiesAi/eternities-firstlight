"""Verify the remote evidence commit as raw Git blobs, without running gameplay."""
from pathlib import Path
import hashlib, json, subprocess, sys

E = Path('D:/07-GAMES/Firstlight/authoring/local-life-evidence-20261003')
A = Path('D:/07-GAMES/Firstlight/artifacts/local-life-20261003')
prefix = 'docs/evidence/local-life-2026-10-03'
P = E/prefix
base = '27bdbe585f8970c7695e04b79c7ef171e3bd1055'
branch = 'evidence/local-life-20261003'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=E,text=True).strip()
assert head != base
remote = subprocess.check_output(['git','ls-remote','origin','refs/heads/'+branch],cwd=E,text=True).split()[0]
assert remote == head
subprocess.run(['git','fetch','--no-tags','origin',branch],cwd=E,check=True,capture_output=True)
fetched = subprocess.check_output(['git','rev-parse','FETCH_HEAD'],cwd=E,text=True).strip()
assert fetched == head
manifest = json.loads((P/'MANIFEST.json').read_text(encoding='utf-8'))
assert manifest['source_head'] == base
copied = json.loads((P/'COPY_RECEIPT.json').read_text(encoding='utf-8'))
assert sha(P/'COPY_RECEIPT.json') == sha(A/'PACKAGE_COPY_RECEIPT.json')
for name,row in copied.items():
    p=P/name
    assert p.stat().st_size == row['bytes'] and sha(p) == row['sha256'], ('edited copied receipt',name)
gate=json.loads((P/'fresh-remote-gate/FULL_GATE_RECEIPT.json').read_text(encoding='utf-8'))
assert gate['passed'] and gate['head'] == base
for suite in gate['browser_suites']:
    assert sha(P/'fresh-remote-gate/browser-reports'/(suite['suite']+'.json')) == suite['report_sha256']
rows = manifest['files'] + [{'file':'MANIFEST.json','bytes':(P/'MANIFEST.json').stat().st_size,'sha256':sha(P/'MANIFEST.json')}]
expected = {e['file'] for e in rows}
names = subprocess.check_output(['git','ls-tree','--name-only','-r',fetched,'--',prefix+'/'],cwd=E,text=True).splitlines()
actual = {n[len(prefix)+1:] for n in names}
assert actual == expected, {'extra':sorted(actual-expected),'missing':sorted(expected-actual)}
proc = subprocess.Popen(['git','cat-file','--batch'],cwd=E,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
checked = []
try:
    for row in rows:
        p = P/row['file']
        assert p.stat().st_size == row['bytes'] and sha(p) == row['sha256']
        spec = (fetched+':'+prefix+'/'+row['file']+'\n').encode('utf-8')
        proc.stdin.write(spec);proc.stdin.flush()
        header = proc.stdout.readline().decode('utf-8').strip().split()
        assert len(header) == 3 and header[1] == 'blob', header
        size = int(header[2]);remaining=size;digest=hashlib.sha256()
        while remaining:
            block = proc.stdout.read(min(1_048_576,remaining))
            assert block
            digest.update(block);remaining -= len(block)
        assert proc.stdout.read(1) == b'\n'
        assert size == row['bytes'] and digest.hexdigest() == row['sha256'], row['file']
        checked.append({'file':row['file'],'bytes':size,'sha256':digest.hexdigest()})
finally:
    proc.stdin.close();proc.stdout.close();proc.wait()
assert proc.returncode == 0
changes = subprocess.check_output(['git','diff','--name-only',base,head],cwd=E,text=True).splitlines()
allowed = {'.gitattributes','.gitignore','docs/playtests/LOCAL_LIFE_2026-10-03.md',
           'docs/development/LOCAL_LIFE_RESULTS_2026-10-03.md','docs/CURRENT_STATE.md',
           'docs/NEXT_TASK.md','docs/PLAYTEST_NOTES.md','docs/DECISIONS.md'}
assert all(n.startswith(prefix+'/') or n in allowed for n in changes), changes
receipt = {'passed':True,'source_head':base,'evidence_head':head,'remote_branch':branch,
           'verified_remote_blob_count':len(checked),'verified_remote_bytes':sum(r['bytes'] for r in checked),
           'manifest_sha256':sha(P/'MANIFEST.json'),'exact_membership':True,'changed_files':changes,
           'runtime_files_unchanged':True,'files':checked,
           'method':'Fetch pushed evidence ref; verify every raw Git blob and exact manifest membership. No gameplay rerun or second GPU claim.'}
(A/'PUSHED_PACKAGE_VERIFICATION.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:receipt[k] for k in receipt if k not in ('files','changed_files')},indent=2))
print('receipt_sha256='+sha(A/'PUSHED_PACKAGE_VERIFICATION.json'))
