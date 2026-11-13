#!/usr/bin/env bash
# the heaven art check on the box: the two heaven saves from the last full tour run, then the heaven frames at the spots.
set -e
SAVES=s3://media-lab-use1-4632/firstlight/out/look-tour-8/saves/heaven/fresh-blade
mkdir -p saves/heaven/fresh-blade
aws s3 cp "$SAVES/05_ACTUAL_COURIER_ARRIVAL.json" saves/heaven/fresh-blade/ --only-show-errors --region us-east-1
aws s3 cp "$SAVES/03_FALSE_SIGNAL_WATCH.json" saves/heaven/fresh-blade/ --only-show-errors --region us-east-1
python3 tools/heaven_art_frames.py --saves saves/heaven/fresh-blade --out frames-heaven
