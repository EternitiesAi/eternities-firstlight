"""Measure one audio file: seconds, channels, sample peak, rms, integrated loudness and true peak.

Loudness and true peak come from ffmpeg's ebur128 filter (ebu r128, true peak on), so the
numbers match what a loudness meter would show. Used by the effects and score pipelines.
"""
import re
import subprocess
import sys

import numpy as np
import soundfile as sf


def ebur(path):
    run = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True, check=True)
    summary = run.stderr.split("Summary:")[-1]
    integrated = float(re.search(r"I:\s+(-?[\d.]+)\s+LUFS", summary).group(1))
    true_peak = float(re.search(r"True peak:\s*\n\s*Peak:\s+(-?[\d.]+)", summary).group(1))
    return integrated, true_peak


def db(value):
    return 20.0 * np.log10(max(float(value), 1e-9))


def stats(path):
    data, rate = sf.read(path, always_2d=True)
    mono = data.mean(axis=1)
    integrated, true_peak = ebur(path)
    return {
        "seconds": round(len(mono) / rate, 3),
        "rate": rate,
        "channels": data.shape[1],
        "sample_peak_dbfs": round(db(np.max(np.abs(data))), 2),
        "rms_dbfs": round(db(np.sqrt(np.mean(mono ** 2))), 2),
        "lufs": round(integrated, 2),
        "true_peak_dbtp": round(true_peak, 2),
    }


if __name__ == "__main__":
    for path in sys.argv[1:]:
        print(path, stats(path))
