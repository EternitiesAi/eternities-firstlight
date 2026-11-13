#!/bin/bash
# set up ace-step for the score on the box: pinned repo, pinned model revision, a venv under /work/audio.
# why our own venv: the verifier's playwright venv (/opt/flv) must not take torch.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/pins.env"
W=/work/audio
mkdir -p "$W/out" "$W/raw" "$W/models"
cd "$W"
[ -d ace-step ] || git clone -q "$ACE_REPO" ace-step
git -C ace-step fetch -q origin
git -C ace-step checkout -q "$ACE_SHA"
[ "$(git -C ace-step rev-parse HEAD)" = "$ACE_SHA" ] || { echo "ace-step is not the pinned commit"; exit 1; }
cp ace-step/LICENSE "$W/out/ace-license.txt"
[ -x venv/bin/python ] || python3 -m venv venv
venv/bin/pip install -q --upgrade pip wheel
venv/bin/pip install -q "torch==$TORCH_VERSION" "torchaudio==$TORCH_VERSION" --index-url "$TORCH_INDEX"
venv/bin/pip install -q -r ace-step/requirements.txt
venv/bin/pip install -q huggingface_hub soundfile numpy
venv/bin/pip freeze > "$W/out/ace-freeze.txt"
venv/bin/python "$here/fetch_model.py" "$ACE_MODEL" "$ACE_MODEL_REV" "$W/models/ACE-Step-v1-3.5B"
# hash every model file, so the score can name the exact weights it came from.
(cd "$W/models/ACE-Step-v1-3.5B" && find . -type f -not -path '*/.cache/*' -print0 | sort -z | xargs -0 sha256sum) > "$W/out/model-sha256.txt"
grep -m1 -i '^license' "$W/models/ACE-Step-v1-3.5B/README.md" > "$W/out/model-license.txt" || true
echo "ace setup done: $(git -C ace-step rev-parse --short HEAD) model $ACE_MODEL_REV files $(wc -l < "$W/out/model-sha256.txt")"
