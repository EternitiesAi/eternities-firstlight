"""Documented recipe, not an execution receipt. Raw movie remains local only.

Use a deliberately new destination; this refuses to overwrite either output.
Encoder output identity can vary with ffmpeg build; verify the retained final
clip against CLIP_PROVENANCE.json instead of treating this recipe as a hash proof.
"""
import argparse
from pathlib import Path
import subprocess

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--ffmpeg',type=Path,required=True)
    p.add_argument('--raw',type=Path,required=True)
    p.add_argument('--clip',type=Path,required=True)
    p.add_argument('--decode-last-frame',type=Path,required=True)
    a=p.parse_args()
    if not a.ffmpeg.is_file() or not a.raw.is_file():
        p.error('Use the retained local raw recording and installed ffmpeg.')
    if a.clip.exists() or a.decode_last_frame.exists():
        p.error('Choose new output paths; do not overwrite retained evidence.')
    subprocess.run([str(a.ffmpeg),'-nostdin','-n','-ss','20','-i',str(a.raw),
                    '-t','44','-an','-c:v','libvpx','-b:v','900k',
                    '-deadline','realtime','-cpu-used','8','-threads','1',str(a.clip)],check=True)
    # Every frame is decoded; only the final one-pixel diagnostic is retained.
    subprocess.run([str(a.ffmpeg),'-nostdin','-y','-threads','1','-i',str(a.clip),
                    '-vf','scale=1:1','-c:v','png','-f','image2','-update','1',
                    str(a.decode_last_frame)],check=True)

if __name__=='__main__':
    main()
