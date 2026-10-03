"""Decode complete recorded streams and preserve their real timestamps in MP4.
This private receipt helper never generates game frames or a replacement score.
"""
from pathlib import Path
import argparse,array,hashlib,json,math,re,subprocess,datetime

def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--ffmpeg',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--mp4',type=Path)
    a=p.parse_args();src=a.source.resolve();out=a.output.resolve();exe=a.ffmpeg.resolve()
    if out.exists() and any(out.iterdir()):p.error('preserve prior decode receipts; output must be empty')
    if a.mp4 and a.mp4.exists():p.error('preserve prior encoded clips; MP4 already exists')
    out.mkdir(parents=True,exist_ok=True)
    report={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':str(src),'source_sha256':sha(src),'source_bytes':src.stat().st_size,'harness_sha256':sha(Path(__file__)),'ffmpeg_sha256':sha(exe),'ffmpeg_version':subprocess.check_output([str(exe),'-version'],text=True).splitlines()[0],'method':'Complete recorded video and mono48k audio decode. Optional H264/AAC MP4 retains native source timestamps with passthrough; no frame interpolation, synthetic game frames, replacement audio or event speed changes. Frame/audio duration is decoded media time, not browser wall time or throughput.','success':False}
    try:
        cmd=[str(exe),'-v','warning','-nostats','-threads','2','-i',str(src),'-map','0:v:0','-fps_mode','passthrough','-enc_time_base:v','1:1000','-progress','pipe:1','-f','null','-']
        v=subprocess.run(cmd,capture_output=True,text=True,timeout=300)
        (out/'VIDEO_DECODE.log').write_text(v.stderr,encoding='utf-8');(out/'VIDEO_PROGRESS.txt').write_text(v.stdout,encoding='utf-8')
        frames=re.findall(r'^frame=(\d+)$',v.stdout,re.M);times=re.findall(r'^out_time_us=(\d+)$',v.stdout,re.M)
        report['video']={'command':cmd,'exit':v.returncode,'decoded_frames':int(frames[-1]) if frames else 0,'decoded_seconds':int(times[-1])/1e6 if times else None,'warning_log':v.stderr}
        assert v.returncode==0 and report['video']['decoded_frames']>0,'Video decode failed'
        cmd=[str(exe),'-v','warning','-nostats','-threads','2','-i',str(src),'-map','0:a:0','-ac','1','-ar','48000','-f','f32le','pipe:1']
        count=0;energy=0.;peak=0.
        with (out/'AUDIO_DECODE.log').open('wb') as errors:
            proc=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=errors)
            tail=b''
            while True:
                raw=proc.stdout.read(1024*1024)
                if not raw:break
                raw=tail+raw;full=len(raw)//4*4;tail=raw[full:];values=array.array('f');values.frombytes(raw[:full]);count+=len(values)
                if values:
                    energy+=math.fsum(x*x for x in values);peak=max(peak,max(abs(x) for x in values))
            code=proc.wait(timeout=30)
        report['audio']={'command':cmd,'exit':code,'decoded_mono_samples':count,'sample_rate':48000,'decoded_seconds':count/48000,'rms':math.sqrt(energy/count) if count else None,'peak':peak,'warning_log':(out/'AUDIO_DECODE.log').read_text(encoding='utf-8',errors='replace')}
        assert code==0 and count>0 and peak>0 and not tail,'Actual audio decode failed or is empty'
        if a.mp4:
            a.mp4.parent.mkdir(parents=True,exist_ok=True)
            cmd=[str(exe),'-v','warning','-nostats','-n','-threads','2','-i',str(src),'-map','0:v:0','-map','0:a:0','-fps_mode','passthrough','-enc_time_base:v','1:1000','-c:v','libx264','-preset','medium','-crf','25','-threads','4','-c:a','aac','-b:a','128k','-movflags','+faststart',str(a.mp4)]
            enc=subprocess.run(cmd,capture_output=True,text=True,timeout=600);(out/'MP4_ENCODE.log').write_text(enc.stderr,encoding='utf-8')
            assert enc.returncode==0,'Portable encode failed'
            report['mp4']={'command':cmd,'exit':enc.returncode,'path':str(a.mp4),'bytes':a.mp4.stat().st_size,'sha256':sha(a.mp4),'warning_log':enc.stderr}
        assert sha(src)==report['source_sha256'],'Source recording changed'
        report['success']=True
    finally:
        (out/'DECODE.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'success':report['success'],'source':str(src),'frames':report['video']['decoded_frames'],'audio_seconds':report['audio']['decoded_seconds'],'mp4_bytes':report.get('mp4',{}).get('bytes')}))

if __name__=='__main__':main()
