#!/bin/bash
# the score: generate the nine tracks (a finished track is kept on rerun), master them, make review pngs,
# then publish the finished files and their provenance to s3 (publish.sh).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/pins.env"
export ACE_MODEL_REV
export PYTHONPATH=/work/audio/ace-step
W=/work/audio
mkdir -p "$W/raw" "$W/out/music" audio-out/review
"$W/venv/bin/python" "$here/ace_generate.py" "$here/tracks.json" "$W/raw"
"$W/fxvenv/bin/python" "$here/master_music.py" "$W/raw" "$W/out/music"
for f in "$W/out/music"/*.ogg; do
  id=$(basename "$f" .ogg)
  ffmpeg -hide_banner -loglevel error -y -i "$f" -lavfi "showspectrumpic=s=900x360:legend=0" "audio-out/review/$id-spectrogram.png"
done
bash "$here/publish.sh"
echo "score done"
