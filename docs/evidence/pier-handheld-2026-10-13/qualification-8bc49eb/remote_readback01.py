from pathlib import Path
import datetime, hashlib, json, re, subprocess, sys, traceback

ROOT=Path('D:/07-GAMES/Firstlight/verification/current-qualified-game')
ARC=Path(__file__).resolve().parent
OUT=ARC/'REMOTE_READBACK01.json'
assert len(sys.argv)==2 and re.fullmatch('[0-9a-f]{40}',sys.argv[1])
EXPECTED=sys.argv[1]
QUALIFIED='8bc49eb4ab66071213f7e6242abea9bc2894447d'
BRANCH='gameplay/pier-handheld-animation-20261013'
PREFIX='docs/evidence/pier-handheld-2026-10-13/'
HTML='31a406704aee2438bcb022de565b7b6a5090770fad6ae2a266819c185df9a6a5'
assert not OUT.exists(),'Preserve existing remote readback'
def cmd(*args):return subprocess.run(args,cwd=ROOT,check=True,capture_output=True).stdout
def git(*args):return cmd('git',*args).decode().strip()
def sha(data):return hashlib.sha256(data).hexdigest()
report={'status':'running','expectedHead':EXPECTED,'qualifiedHead':QUALIFIED,'branch':BRANCH,
 'startedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'scope':'Reused remote qualification checkout, not a new clone; final delivery differs from qualified source only in documentation/evidence; two identical builds and retained Git-blob evidence hashes.',
 'errors':[]}
try:
    assert git('status','--porcelain=v1','--untracked-files=all')==''
    assert git('rev-parse','FETCH_HEAD')==EXPECTED,'Fetch must complete at expected head'
    remote=git('-c','http.version=HTTP/1.1','ls-remote','https://github.com/EternitiesAi/eternities-firstlight.git','refs/heads/'+BRANCH)
    assert remote.split()[0]==EXPECTED,'Remote branch drift'
    git('switch','--detach',EXPECTED)
    assert git('rev-parse','HEAD')==EXPECTED
    changed=git('diff','--name-only',QUALIFIED,EXPECTED).splitlines()
    assert changed and all(p=='AGENTS.md' or p.startswith('docs/') for p in changed)
    report['deliveryOnlyFiles']=changed;report['remoteHead']=remote.split()[0]
    report['builds']=[]
    for turn in range(2):
        row={'number':turn+1,'output':cmd(sys.executable,'-B','build.py').decode('utf-8'),'files':{}}
        for name in ('index.html','FIRSTLIGHT_VALLEY.html'):
            data=(ROOT/name).read_bytes()
            assert data==cmd('git','show',EXPECTED+':'+name)
            assert len(data)==3408067 and sha(data)==HTML
            row['files'][name]={'bytes':len(data),'sha256':sha(data)}
        report['builds'].append(row)
    report['evidence']=[]
    for label in ('qualification-8bc49eb',):
        folder=PREFIX+label
        manifest=json.loads(cmd('git','show',EXPECTED+':'+folder+'/MANIFEST.json'))
        total=0
        for entry in manifest['files']:
            data=cmd('git','show',EXPECTED+':'+folder+'/'+entry['path'])
            assert len(data)==entry['bytes'] and sha(data)==entry['sha256'],entry['path']
            total+=len(data)
        assert total==manifest['totalBytes'] and len(manifest['files'])==manifest['fileCount']
        report['evidence'].append({'bundle':label,'files':len(manifest['files']),'bytes':total,'blobHashesPassed':True})
    report['statusAfter']=git('status','--porcelain=v1','--untracked-files=all')
    assert report['statusAfter']==''
    report['status']='passed'
except Exception:
    report['status']='failed';report['errors'].append(traceback.format_exc())
finally:
    report['finishedUtc']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    OUT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='deliveryOnlyFiles'},indent=2))
sys.exit(0 if report['status']=='passed' else 1)
