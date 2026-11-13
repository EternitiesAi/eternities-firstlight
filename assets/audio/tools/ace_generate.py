"""Generate the instrumental score with ace-step at the pinned revision, one wav per track.

Each track is generated `seconds + LOOP_FADE` long; master_music.py blends the tail into the head so the loop
point is seamless and the file keeps its requested length. lyrics "[inst]" is ace-step's own instrumental tag.
Writes <out_dir>/<id>.wav and <out_dir>/<id>.json (prompt, seed, steps, guidance: the provenance record).
"""
import argparse
import json
import os
import shutil
import time

import torch
from acestep.pipeline_ace_step import ACEStepPipeline

MODEL = "/work/audio/models/ACE-Step-v1-3.5B"
LOOP_FADE = 3.0
GUIDANCE = {"infer_step": 60, "guidance_scale": 15.0, "scheduler_type": "euler", "cfg_type": "apg",
            "omega_scale": 10.0, "guidance_interval": 0.5, "guidance_interval_decay": 0.0,
            "min_guidance_scale": 3.0, "use_erg_tag": True, "use_erg_lyric": True, "use_erg_diffusion": True}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("out_dir")
    ap.add_argument("--only", default="")
    ap.add_argument("--smoke", action="store_true", help="20 s clip of the first wanted track, nothing else")
    args = ap.parse_args()
    tracks = json.load(open(args.spec, encoding="utf-8"))
    wanted = [t for t in tracks if not args.only or t["id"] in args.only.split(",")]
    if not wanted:
        raise SystemExit("no tracks selected")
    os.makedirs(args.out_dir, exist_ok=True)
    pipe = ACEStepPipeline(checkpoint_dir=MODEL, device_id=0, dtype="bfloat16", torch_compile=False,
                           cpu_offload=False, overlapped_decode=False)
    for track in wanted:
        target = os.path.join(args.out_dir, track["id"] + ".wav")
        if not args.smoke and os.path.exists(target) and os.path.exists(os.path.join(args.out_dir, track["id"] + ".json")):
            print("kept", track["id"], "(already generated)", flush=True)
            continue
        seconds = 20.0 if args.smoke else track["seconds"] + LOOP_FADE
        started = time.time()
        result = pipe(format="wav", audio_duration=seconds, prompt=track["prompt"], lyrics="[inst]",
                      manual_seeds=[track["seed"]], batch_size=1, **GUIDANCE)
        wavs = [p for p in result if str(p).endswith(".wav")]
        if len(wavs) != 1:
            raise SystemExit("expected one wav for %s, got %r" % (track["id"], result))
        target = os.path.join(args.out_dir, track["id"] + ".wav")
        shutil.move(wavs[0], target)
        record = {"id": track["id"], "seed": track["seed"], "prompt": track["prompt"], "lyrics": "[inst]",
                  "generated_seconds": seconds, "loop_fade_seconds": LOOP_FADE, "model": "ACE-Step/ACE-Step-v1-3.5B",
                  "model_revision": os.environ.get("ACE_MODEL_REV", ""), "guidance": GUIDANCE,
                  "elapsed_seconds": round(time.time() - started, 1), "gpu": torch.cuda.get_device_name(0)}
        with open(os.path.join(args.out_dir, track["id"] + ".json"), "w", encoding="utf-8", newline="\n") as f:
            json.dump(record, f, indent=2)
            f.write("\n")
        print("generated", track["id"], "in", record["elapsed_seconds"], "s ->", target, flush=True)


if __name__ == "__main__":
    main()
