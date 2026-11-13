#!/bin/bash
# smoke: one 20 s instrumental clip, checked before any score is generated.
# outputs go to audio-out/smoke (the run folder, so fl-box.sh fetch can copy them).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/pins.env"
export ACE_MODEL_REV
W=/work/audio
export PYTHONPATH="$W/ace-step"
out=audio-out/smoke
mkdir -p "$out"
"$W/venv/bin/python" "$here/ace_generate.py" "$here/tracks.json" "$out" --only valley --smoke
wav="$out/valley.wav"
ffmpeg -hide_banner -loglevel error -y -i "$wav" -lavfi "showspectrumpic=s=1200x600:legend=1" "$out/spectrogram.png"
ffmpeg -hide_banner -loglevel error -y -i "$wav" -lavfi "showwavespic=s=1200x300" "$out/waveform.png"
"$W/fxvenv/bin/python" "$here/measure.py" "$wav" | tee "$out/measure.txt"
echo "smoke done"
