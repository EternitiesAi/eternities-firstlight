#!/bin/bash
# copy the finished audio and its provenance to the firstlight prefix on s3 (the lane's copy of record).
set -euo pipefail
B=s3://media-lab-use1-4632/firstlight/audio
R="aws s3 cp --only-show-errors --region us-east-1"
aws s3 sync /work/audio/out/fx "$B/fx" --only-show-errors --region us-east-1 --exclude "*" --include "*.ogg" --include "*.tsv"
aws s3 sync /work/audio/out/music "$B/music" --only-show-errors --region us-east-1 --exclude "*" --include "*.ogg" --include "*.json"
$R /work/audio/out/music/music-measure.json "$B/reports/music-measure.json"
$R /work/audio/out/fx/fx-measure.tsv "$B/reports/fx-measure.tsv"
for f in ace-freeze.txt ace-license.txt model-license.txt model-sha256.txt; do
  $R "/work/audio/out/$f" "$B/reports/$f"
done
aws s3 ls --recursive "$B/" --region us-east-1 | awk '{print $3, $4}' | sed 's#firstlight/audio/##'
echo "published"
