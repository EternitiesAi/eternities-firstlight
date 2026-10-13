from pathlib import Path
import datetime, hashlib, json, re, subprocess
arc=Path(__file__).resolve().parent
report=json.loads((arc/'NATIVE05/REPORT.json').read_text())
assert report['status']=='passed' and report['ownedBrowserDriverClosed']
video=Path(report['ordinaryRecording']['path'])
receipt=arc/'VIDEO_DECODE01.json';log=arc/'VIDEO_DECODE01.log'
assert not receipt.exists() and not log.exists()
cmd=['D:/07-GAMES/Firstlight/cache/ms-playwright-1.57/ffmpeg-1011/ffmpeg-win64.exe',
     '-nostdin','-threads','1','-filter_threads','1','-i',str(video),'-map','0:v:0','-an','-f','null','-']
r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=90)
log.write_bytes(r.stdout);text=r.stdout.decode('utf-8','replace')
duration=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',text)
frames=re.findall(r'frame=\s*(\d+)',text)
result={'head':report['head'],'observedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'command':cmd,'exitCode':r.returncode,'path':str(video),'bytes':video.stat().st_size,
 'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),
 'durationSeconds':sum(float(v)*m for v,m in zip(duration.groups(),[3600,60,1])) if duration else None,
 'decodedFrames':max(map(int,frames)) if frames else None,
 'note':'Encoded movie duration and full media decode; not measured render FPS, RTX qualification or human play.'}
receipt.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
assert r.returncode==0 and result['decodedFrames'] and result['durationSeconds']
