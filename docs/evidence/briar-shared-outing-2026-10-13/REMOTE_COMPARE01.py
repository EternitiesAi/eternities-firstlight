"""Read-only exact pushed source/build comparison of reused independent clone."""
from pathlib import Path
import hashlib,json,subprocess
AUTHOR=Path('D:/07-GAMES/Firstlight/authoring/atlantis-harbour-campaign-20261004')
REMOTE=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
OUT=Path('D:/07-GAMES/Firstlight/artifacts/briar-shared-outing-20261013/REMOTE_COMPARE01.json')
HEAD='dbc5874593afe2d18b06ab17817f4beae9d653d3'
def git(root,*args):return subprocess.check_output(['git','-c','maintenance.auto=false','-c','gc.auto=0','-C',str(root),*args],text=True).strip()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert not OUT.exists()
for root in (AUTHOR,REMOTE):
    assert git(root,'rev-parse','HEAD')==HEAD
    assert git(root,'status','--porcelain')==''
author={p.name:p for p in(AUTHOR/'src').iterdir()if p.is_file()}
remote={p.name:p for p in(REMOTE/'src').iterdir()if p.is_file()}
assert author.keys()==remote.keys()
runtime={name:{'sha256':sha(p),'bytes':p.stat().st_size}for name,p in author.items()}
for name,value in runtime.items():assert sha(remote[name])==value['sha256'],name
html=[root/name for root in (AUTHOR,REMOTE)for name in ('index.html','FIRSTLIGHT_VALLEY.html')]
assert all(p.read_bytes()==html[0].read_bytes()for p in html)
changed=git(AUTHOR,'diff','--name-only','b6b813ccaa7ae445fa233a1214ea1c144d1c2476',HEAD).splitlines()
for name in changed:assert(AUTHOR/name).read_bytes()==(REMOTE/name).read_bytes(),name
value={'status':'passed','head':HEAD,'root':str(AUTHOR),'independentClone':str(REMOTE),'freshlyCreatedClone':False,'method':'Fresh canonical HTTPS fetch of exact branch, clean detached checkout, actual build, then raw runtime/changed-file/four-HTML equality. Reused existing independent clone; no full-game copy.','runtimeFiles':len(runtime),'runtime':runtime,'changedFiles':len(changed),'html':{'bytes':html[0].stat().st_size,'sha256':sha(html[0]),'copies':4},'sourceVerifierExecuted':False,'nativeExecuted':False,'vmActions':False}
OUT.write_text(json.dumps(value,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in value.items()if k!='runtime'},indent=2))
