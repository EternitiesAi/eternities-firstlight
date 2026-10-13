from pathlib import Path
import hashlib,json,shutil
ARC=Path(__file__).resolve().parent
ROOT=Path('D:/07-GAMES/Firstlight/authoring/atlantis-harbour-campaign-20261004')
HEAD='8bc49eb4ab66071213f7e6242abea9bc2894447d'
DEST=ROOT/'docs/evidence/pier-handheld-2026-10-13/qualification-8bc49eb'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
source=read(ARC/'REMOTE_SOURCE03_EXIT.json');native=read(ARC/'NATIVE02/REPORT.json');media=read(ARC/'VIDEO_DECODE02.json')
assert source['exitCode']==0 and source['sourceHead']==HEAD and source['headAfter']==HEAD and source['statusAfter']==[]
assert native['status']=='passed' and native['head']==HEAD and native['ownedBrowserDriverClosed'] and native['ownedServerClosed']
assert media['exitCode']==0 and media['head']==HEAD and media['decodedFrames']>0
assert not DEST.exists();DEST.mkdir(parents=True)
selected=[]
for p in ARC.iterdir():
 if p.is_file() and (p.suffix in ('.json','.log','.py','.ps1') or p.name=='REVIEW_NOTES.md'):selected.append((p,Path(p.name)))
for number in ('01','02','03'):
 folder=ARC/('REMOTE_SOURCE'+number)
 for name in ('rules.log','python.log','rules-command.json','whole-draft-earned.log','briar-outing-earned.log'):
  p=folder/name
  if p.is_file():selected.append((p,Path(folder.name)/name))
 for rel in ('whole-draft-earned/WHOLE_DRAFT_JOURNEY_REPORT.json','briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json'):
  p=folder/rel;selected.append((p,Path(folder.name)/rel))
selected.append((ARC/'NATIVE01/REPORT.json',Path('NATIVE01/REPORT.json')))
selected.append((ARC/'VIDEO_FRAMES01/03.20.png',Path('NATIVE01/BEFORE_LOW_SWEEP.png')))
for p in (ARC/'NATIVE02').iterdir():
 if p.is_file() and p.suffix in ('.json','.png'):selected.append((p,Path('NATIVE02')/p.name))
# Preserve the eight exact frames read by both reviewers; one short movie only.
for mode in ('adventure','follow'):
 for n in range(4):
  p=ARC/'VIDEO_FRAMES02'/('CAST_'+mode+'_'+str(n)+'.png');selected.append((p,Path('NATIVE02')/p.name))
selected.append((Path(native['ordinaryRecording']['path']),Path('NATIVE02/gameplay.webm')))
for src,rel in selected:
 assert src.is_file(),src
 dest=DEST/rel;dest.parent.mkdir(parents=True,exist_ok=True);assert not dest.exists();shutil.copyfile(src,dest)
(DEST/'.gitattributes').write_text('* -text\n',encoding='utf8')
files=[]
for p in sorted(DEST.rglob('*')):
 if p.is_file():files.append({'path':p.relative_to(DEST).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
manifest={'qualifiedHead':HEAD,'scope':'Selected exact source/native/media evidence. First two source epochs and Native01 are historical; Native02 and Source03 qualify final source. No browser profiles or complete game copies. One final short movie; earlier low-sweep movie remains local diagnostic evidence.','fileCount':len(files),'totalBytes':sum(f['bytes'] for f in files),'files':files}
(DEST/'MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8');print(json.dumps({k:v for k,v in manifest.items() if k!='files'},indent=2))
