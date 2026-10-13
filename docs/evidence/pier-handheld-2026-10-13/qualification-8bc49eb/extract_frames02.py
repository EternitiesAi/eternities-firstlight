from pathlib import Path
import json,subprocess,hashlib
ARC=Path(__file__).resolve().parent
r=json.loads((ARC/'NATIVE02/REPORT.json').read_text(encoding='utf8'))
m=json.loads((ARC/'VIDEO_DECODE02.json').read_text(encoding='utf8'))
samples=json.loads((ARC/'NATIVE02/MOTION_SAMPLES.json').read_text(encoding='utf8'))
assert r['status']=='passed' and r['ownedBrowserDriverClosed'] and m['exitCode']==0
video=Path(r['ordinaryRecording']['path']);offset=m['durationSeconds']-r['ordinaryRecording']['secondsAfterReady']
out=ARC/'VIDEO_FRAMES02';out.mkdir(exist_ok=False)
ff='D:/07-GAMES/Firstlight/cache/ms-playwright-1.57/ffmpeg-1011/ffmpeg-win64.exe';rows=[]
for mode in ('adventure','follow'):
 q=next(q for q in samples if q['normalRAF'] and q['mode']==mode and q['view']['phase']=='waiting' and q['view']['time']<.85)
 start=offset+q['recordingSeconds']-q['view']['time']
 for n,dt in enumerate((.05,.3,.55,.8)):
  t=start+dt;p=out/('CAST_'+mode+'_'+str(n)+'.png')
  cmd=[ff,'-nostdin','-threads','1','-filter_threads','1','-ss',str(t),'-i',str(video),'-frames:v','1','-c:v','png','-f','image2',str(p)]
  x=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=20);assert x.returncode==0,x.stdout.decode('utf8','replace');assert p.is_file()
  rows.append({'mode':mode,'seconds':t,'approximateCastTime':dt,'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(ARC/'VIDEO_FRAMES02.json').write_text(json.dumps({'videoSha256':hashlib.sha256(video.read_bytes()).hexdigest(),'method':'Unmodified decoded frames from actual capture. Cast alignment approximated from the ordinary trace and clip duration, not an exact frame-clock claim.','frames':rows},indent=2)+'\n',encoding='utf8');print(json.dumps(rows,indent=2))
