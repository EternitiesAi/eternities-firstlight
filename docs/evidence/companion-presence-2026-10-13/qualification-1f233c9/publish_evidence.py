"""Copy a bounded, explicit evidence set; preserve every original and profile."""
from pathlib import Path
import hashlib, json, shutil

ARC=Path(__file__).resolve().parent
ROOT=Path('D:/07-GAMES/Firstlight/authoring/atlantis-harbour-campaign-20261004')
HEAD='1f233c9c71c30161a8db105fa85d88187aa66a90'
OUT=ROOT/'docs/evidence/companion-presence-2026-10-13/qualification-1f233c9'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

gate=read(ARC/'REMOTE_SOURCE08_EXIT.json')
native=read(ARC/'NATIVE05/REPORT.json')
briar=read(ARC/'BRIAR_NATIVE02/BRIAR_NATIVE_REPORT.json')
assert gate['sourceHead']==HEAD and gate['headAfter']==HEAD and gate['exitCode']==0 and not gate['statusAfter']
assert native['status']==briar['status']=='passed' and native['head']==briar['head']==HEAD
assert native['ownedBrowserDriverClosed'] and native['ownedServerClosed'] and briar['serverClosed']
assert read(ARC/'VIDEO_DECODE02.json')['exitCode']==0
assert not OUT.exists()
selected=set()
for pattern in ('*.log','*ADMISSION*.json','REMOTE_SOURCE*_EXIT.json','RUN_REMOTE_SOURCE*.ps1','qualify_*.py','decode_video*.py'):
    selected.update(ARC.glob(pattern))
for p in (ARC/'REMOTE_SOURCE08').iterdir():
    if p.is_file() and p.stat().st_size:selected.add(p)
selected.update((ARC/p) for p in (
    'REMOTE_SOURCE02/rules.log',
    'REMOTE_SOURCE08/briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json',
    'REMOTE_SOURCE08/whole-draft-earned/WHOLE_DRAFT_JOURNEY_REPORT.json',
    'NATIVE01/REPORT.json','NATIVE01/FAILURE.png','NATIVE02/REPORT.json','NATIVE02/FAILURE.png',
    'NATIVE03/REPORT.json','NATIVE03/FAILURE.png','NATIVE04/REPORT.json','NATIVE04/FAILURE.png',
    'NATIVE05/REPORT.json','NATIVE05/FRESH_CAUGHT_follow.png','NATIVE05/RETURNING_CAUGHT_adventure.png',
    'NATIVE05/NORMAL_CAUGHT.png','BRIAR_NATIVE01/BRIAR_NATIVE_REPORT.json',
    'BRIAR_NATIVE01/early-rescued-blade/FAILURE.png','BRIAR_NATIVE01/early-rescued-blade/FAILURE_DIAGNOSTICS.json',
    'BRIAR_NATIVE02/BRIAR_NATIVE_REPORT.json','VIDEO_DECODE01.json','VIDEO_DECODE02.json'))
for row in briar['cases'].values():
    for sample in row.get('samples',[]):
        # One current native case, both carried/resting poses in both cameras.
        selected.add(Path(sample['path']))
selected.add(Path(native['ordinaryRecording']['path']))
selected.add(Path(__file__))
assert all(p.is_file() and p.is_relative_to(ARC) for p in selected)
total=sum(p.stat().st_size for p in selected)
assert total<25_000_000,('Review unexpectedly large evidence bundle before copying',total)
rows=[]
for p in sorted(selected):
    rel=p.relative_to(ARC);target=OUT/rel;target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(p,target);assert sha(p)==sha(target)
    rows.append({'path':str(rel).replace('\\','/'),'bytes':p.stat().st_size,'sha256':sha(p)})
manifest={'qualifiedSource':HEAD,'files':rows,'fileCount':len(rows),'bytes':total,
 'method':'Explicit bounded evidence copy; no full source copies, browser profiles or saved-world duplicates.',
 'scope':'Complete source gate plus targeted native fishing and one Briar case, not full current --browser gate.',
 'sourceRetained':str(ARC),'humanAcceptance':False,'performanceCertified':False}
(OUT/'MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
attributes=OUT.parent/'.gitattributes'
assert not attributes.exists()
attributes.write_text('* -text linguist-generated=true whitespace=cr-at-eol,-blank-at-eol,-blank-at-eof\n',encoding='utf-8')
print(json.dumps({'path':str(OUT),'files':len(rows),'bytes':total},indent=2))
