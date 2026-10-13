from pathlib import Path
import hashlib, json, subprocess
from datetime import datetime, timezone

arc=Path(__file__).resolve().parent
ff=Path('C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
out=arc/'MEDIA_VALIDATE01.json'
if out.exists():raise SystemExit('Preserve prior media receipt')
rows=[]
for label,path in [('original',arc/'CLIP01/ACTUAL_FIELDCRAFT.webm'),('mobile',arc/'RECEIVING_CLIP03.mp4')]:
    command=[str(ff),'-hide_banner','-nostdin','-loglevel','warning','-threads','1','-i',str(path),'-map','0:v:0','-an','-threads','1','-fps_mode','passthrough','-enc_time_base:v','1/1000','-f','framehash','-']
    p=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60)
    (arc/f'DECODE_{label}_MEDIA01.log').write_bytes(p.stderr)
    (arc/f'FRAMES_{label}_MEDIA01.txt').write_bytes(p.stdout)
    frames=[line.split(',') for line in p.stdout.decode().splitlines() if line and not line.startswith('#')]
    pts=[int(f[2].strip()) for f in frames]
    if p.returncode or p.stderr or not pts or any(a>=b for a,b in zip(pts,pts[1:])):raise SystemExit(label+' decode or monotonic timestamp gate failed')
    rows.append({'label':label,'path':str(path),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'decodeExit':p.returncode,'decodeWarnings':[],'frames':len(frames),'timebase':'1/1000','ptsMs':pts,'firstMs':pts[0],'lastMs':pts[-1]})
if rows[0]['ptsMs']!=rows[1]['ptsMs']:raise SystemExit('Media conversion changed frame count/timing')
report={'observedUtc':datetime.now(timezone.utc).isoformat(),'status':'passed','sourceHead':'3269dd308f44f2ea9dc47c68f72aefc5eac5e0a1','rows':rows,'conversion':'H264 Main level4.1 yuv420p VFR, no B frames, faststart; actual timestamps and frame count conserved. Nominal demux metadata is not achieved game FPS. Original and first failed conversions retained. No interpolated/smoothed gameplay frames or retake.','humanMobilePlayback':'not performed','captureWindowMs':18500.7}
out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='rows'}))
print(json.dumps([{k:v for k,v in r.items()if k!='ptsMs'} for r in rows]))
