"""Convert the listed kenney effects to short mono opus, each peak-set to its row's level.

Writes one ogg per row plus fx-measure.tsv (source hashes, output hash, seconds, peaks, loudness, the
estimated fundamental for bells so the game can tune them to the watch-bell notes).
"""
import glob
import hashlib
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

from measure import stats

RATE = 48000
BITRATE = "48k"


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def pitch_hz(x):
    # strongest bin between 150 and 2000 hz over the first 1.2 s.
    seg = x[: int(1.2 * RATE)] * np.hanning(min(len(x), int(1.2 * RATE)))
    size = 1 << 18
    spec = np.abs(np.fft.rfft(seg, n=size))
    freqs = np.fft.rfftfreq(size, 1.0 / RATE)
    band = (freqs >= 150) & (freqs <= 2000)
    return float(freqs[band][np.argmax(spec[band])])


def main(list_path, src_root, out_dir):
    tmp = os.path.join(os.path.dirname(os.path.abspath(out_dir)), "tmp")
    os.makedirs(tmp, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    rows = []
    with open(list_path, encoding="utf-8") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                rows.append(line.rstrip("\n").split("\t"))
    zips = {}
    report = ["file\tcue\tvariant\tpack\tsource\tseconds\tsample_peak_dbfs\tlufs\ttrue_peak_dbtp\tf0_hz\tzip_sha256\tsource_sha256\tout_sha256"]
    for cue, variant, pack, source, peak_db in rows:
        hits = glob.glob(os.path.join(src_root, pack, "x", "**", source + ".ogg"), recursive=True)
        if len(hits) != 1:
            raise SystemExit("source missing or not unique: %s/%s (%d)" % (pack, source, len(hits)))
        src = hits[0]
        decoded = os.path.join(tmp, cue + "-" + variant + ".wav")
        ffmpeg("-i", src, "-ac", "1", "-ar", str(RATE), "-c:a", "pcm_f32le", decoded)
        x, rate = sf.read(decoded, dtype="float32")
        if rate != RATE or len(x) < 0.05 * RATE:
            raise SystemExit("unusable decode: " + source)
        peak = float(np.max(np.abs(x)))
        if peak <= 0:
            raise SystemExit("silent source: " + source)
        x = x * np.float32(10 ** (float(peak_db) / 20) / peak)
        fade_in, fade_out = int(0.002 * RATE), int(0.012 * RATE)
        x[:fade_in] *= np.linspace(0, 1, fade_in, dtype=np.float32)
        x[-fade_out:] *= np.linspace(1, 0, fade_out, dtype=np.float32)
        sf.write(decoded, x, RATE, subtype="FLOAT")
        out = os.path.join(out_dir, cue + "-" + variant + ".ogg")
        ffmpeg("-i", decoded, "-c:a", "libopus", "-b:a", BITRATE, "-application", "audio",
               "-ac", "1", "-ar", str(RATE), "-map_metadata", "-1", out)
        s = stats(out)
        if s["sample_peak_dbfs"] > -0.5:
            raise SystemExit("clipping risk in " + os.path.basename(out) + ": " + str(s["sample_peak_dbfs"]))
        if pack not in zips:
            zips[pack] = sha256(os.path.join(src_root, pack, "pack.zip"))
        report.append("\t".join([
            os.path.basename(out), cue, variant, pack, source, str(s["seconds"]), str(s["sample_peak_dbfs"]),
            str(s["lufs"]), str(s["true_peak_dbtp"]), "%.1f" % pitch_hz(x), zips[pack], sha256(src), sha256(out)]))
        print(report[-1], flush=True)
    with open(os.path.join(out_dir, "fx-measure.tsv"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(report) + "\n")
    print("effects written:", len(rows), "into", out_dir)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
