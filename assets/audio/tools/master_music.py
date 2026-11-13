"""Master the raw score for the page: loop crossfade, loudness target, true-peak ceiling, mono opus.

The raw clip is seconds + LOOP_FADE long. Its last LOOP_FADE seconds are blended into its first (equal power), so
the loop point is seamless and the file keeps the requested length. Gain goes to the loudness target and is pulled
down only if true peak would pass the ceiling. Every output is decoded again and measured.
"""
import glob
import hashlib
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

from measure import ebur, stats

RATE = 48000
LOOP_FADE = 3.0
LUFS_TARGET = -20.0
TRUE_PEAK_CEILING = -1.5
# 48k measured at 53 kbps on this material (6.32 MB for 950 s), which put the page past 12 MB once base64 is added.
BITRATE = "40k"


def pick_cut(x, fold):
    # the joint goes on a near-still sample: within one second of the fold point, the cut with the smallest step wins.
    base = len(x) - int(round(fold * RATE))
    seg = x[base - RATE - 1:base + RATE + 1]
    return base - RATE + int(np.argmin(np.abs(np.diff(seg))))


def loop(x, cut):
    fade = len(x) - cut
    theta = np.linspace(0.0, np.pi / 2, fade, dtype=np.float32)
    y = x[:cut].copy()
    y[:fade] = x[cut:] * np.cos(theta) + x[:fade] * np.sin(theta)
    return y


def seam_ratio(y):
    # the loop joint should be one ordinary sample step, not a jump.
    step = np.median(np.abs(np.diff(y))) + 1e-9
    return float(abs(float(y[-1]) - float(y[0])) / step)


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def master(raw_path, out_dir, track_id, fold, joint):
    x, rate = sf.read(raw_path, dtype="float32", always_2d=True)
    if rate != RATE:
        raise SystemExit("unexpected rate %d in %s" % (rate, raw_path))
    mono = x.mean(axis=1)
    cut = pick_cut(mono, fold) if joint == "search" else len(mono) - int(round(fold * RATE))
    y = loop(mono, cut)
    tmp = os.path.join(out_dir, "..", "tmp", track_id + ".wav")
    os.makedirs(os.path.dirname(tmp), exist_ok=True)
    sf.write(tmp, y, RATE, subtype="FLOAT")
    integrated, true_peak = ebur(tmp)
    gain_db = LUFS_TARGET - integrated
    if true_peak + gain_db > TRUE_PEAK_CEILING:
        gain_db = TRUE_PEAK_CEILING - true_peak
    y = (y * np.float32(10 ** (gain_db / 20))).astype(np.float32)
    sf.write(tmp, y, RATE, subtype="FLOAT")
    ogg = os.path.join(out_dir, track_id + ".ogg")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", tmp, "-c:a", "libopus",
                    "-b:a", BITRATE, "-application", "audio", "-ac", "1", "-ar", str(RATE),
                    "-map_metadata", "-1", ogg], check=True)
    decoded = os.path.join(out_dir, "..", "tmp", track_id + "-decoded.wav")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", ogg, "-c:a", "pcm_f32le",
                    decoded], check=True)
    measured = stats(decoded)
    measured.update({"id": track_id, "fold_seconds": fold, "joint": joint, "cut_seconds": round(cut / RATE, 3), "gain_db": round(gain_db, 2), "seam_ratio": round(seam_ratio(y), 3),
                     "ogg_bytes": os.path.getsize(ogg), "ogg_sha256": sha256(ogg),
                     "raw_sha256": sha256(raw_path), "target_lufs": LUFS_TARGET,
                     "ceiling_dbtp": TRUE_PEAK_CEILING})
    return measured


def main():
    raw_dir, out_dir = sys.argv[1], sys.argv[2]
    spec = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "tracks.json"), encoding="utf-8"))
    folds = {t["id"]: float(t.get("fold", LOOP_FADE)) for t in spec}
    joints = {t["id"]: t.get("joint", "fold") for t in spec}
    os.makedirs(out_dir, exist_ok=True)
    rows = []
    for raw in sorted(glob.glob(os.path.join(raw_dir, "*.wav"))):
        track_id = os.path.splitext(os.path.basename(raw))[0]
        if track_id.startswith("smoke"):
            continue
        row = master(raw, out_dir, track_id, folds.get(track_id, LOOP_FADE), joints.get(track_id, "fold"))
        rows.append(row)
        meta_src = os.path.join(raw_dir, track_id + ".json")
        if os.path.exists(meta_src):
            with open(meta_src, encoding="utf-8") as f:
                meta = json.load(f)
            with open(os.path.join(out_dir, track_id + ".json"), "w", encoding="utf-8", newline="\n") as f:
                json.dump(meta, f, indent=2)
                f.write("\n")
        print(json.dumps(row), flush=True)
    total = sum(r["ogg_bytes"] for r in rows)
    print("tracks", len(rows), "ogg bytes total", total, flush=True)
    with open(os.path.join(out_dir, "music-measure.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(rows, f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
