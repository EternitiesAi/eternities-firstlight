#!/usr/bin/env bash
# the box run of the story tour, from the run's checkout: the collector writes saves/, then the browser tour writes
# frames-tour/ on the GPU. the tour runs even when a journey failed; the collector's record is saves/MANIFEST.json.
node tools/story_tour_saves.cjs saves
python3 tools/story_tour.py --saves saves --out frames-tour
