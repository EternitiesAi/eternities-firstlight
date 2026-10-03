from pathlib import Path
from fractions import Fraction
import hashlib,json,re,subprocess,datetime

BASE=Path(__file__).parent
PLAN=json.loads((BASE/'PLAN_ATLANTIS.json').read_text())
EXE=PLAN['ffmpeg']

def frames(path, dest):
    cmd=[EXE,'-hide_banner','-v','info','-threads','2','-i',str(path),'-map','0:v:0','-vf','showinfo','-fps_mode','passthrough','-f','null','-']
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=300)
    dest.write_text(p.stderr,encoding='utf-8')
    assert p.returncode==0, 'complete showinfo decode failed'
    tb=re.search(r'config in time_base:\s*(\d+/\d+)',p.stderr)
    assert tb, 'missing source timebase'
    rate=Fraction(tb.group(1))
    rows=[(int(n),int(pts),Fraction(int(pts))*rate) for n,pts in re.findall(r'\bn:\s*(\d+)\s+pts:\s*(-?\d+)\s+pts_time:',p.stderr)]
    assert rows and [n for n,_,_ in rows]==list(range(len(rows)))
    return rows,{'command':cmd,'exit':p.returncode,'timebase':str(rate),'frames':len(rows),'log':str(dest)}

report={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Every decoded showinfo frame integerPTS multiplied by decoder timebase; exact rational comparison, no forcedfps/resize/mock. Output-null is downstream of showinfo and its timebase cannot change observed decodedPTS.','clips':[]}
try:
    for entry in PLAN['clips']:
        name=entry['name'];folder=BASE/'frame-pts-atlantis'/name;folder.mkdir(parents=True,exist_ok=True)
        print('PTS '+name,flush=True)
        s,sm=frames(Path(entry['source']),folder/'SOURCE_SHOWINFO.log')
        e,em=frames(Path(entry['mp4']),folder/'MP4_SHOWINFO.log')
        delta=[b[2]-a[2] for a,b in zip(s,e)]
        offset=delta[0]
        changing=[i for i,v in enumerate(delta) if v!=offset]
        data={'name':name,'source':sm,'mp4':em,'frame_counts_equal':len(s)==len(e),'initial_mux_offset_seconds_exact':str(offset),'nonconstant_frames':len(changing),'first_nonconstant_indices':changing[:12],'max_deviation_from_initial_offset_seconds':float(max(abs(v-offset) for v in delta)),'source_frame_pts_hash':hashlib.sha256(json.dumps([(n,pts,str(t)) for n,pts,t in s]).encode()).hexdigest(),'mp4_frame_pts_hash':hashlib.sha256(json.dumps([(n,pts,str(t)) for n,pts,t in e]).encode()).hexdigest(),'source_pts_strictly_increasing':all(b[2]>a[2] for a,b in zip(s,s[1:])),'mp4_pts_strictly_increasing':all(b[2]>a[2] for a,b in zip(e,e[1:]))}
        (folder/'FRAME_PTS.json').write_text(json.dumps({'source':[(n,pts,str(t)) for n,pts,t in s],'mp4':[(n,pts,str(t)) for n,pts,t in e],'comparison':data},indent=2)+'\n')
        report['clips'].append(data)
        print(json.dumps(data),flush=True)
finally:
    (BASE/'ATLANTIS_ALL_FRAME_PTS_REVIEW.json').write_text(json.dumps(report,indent=2)+'\n')
