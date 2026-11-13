#!/bin/bash
# kenney cc0 effects for firstlight: fetch the packs by kenney's own download flow, check each licence,
# then convert the listed files to short mono opus (fx-list.tsv names every file).
# kenney's page asks /download-link/<id> for a signed url; <id> is hex of "assets/<pack>".
# kenney refuses the default curl agent with 403, so the fetch uses a browser-style agent (recorded in SOURCES.md).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
W=/work/audio
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36"
mkdir -p "$W/fx-src" "$W/out/fx"
for pack in impact-sounds rpg-audio interface-sounds ui-audio digital-audio; do
  d="$W/fx-src/$pack"
  mkdir -p "$d"
  if [ ! -s "$d/pack.zip" ]; then
    id=$(printf 'assets/%s' "$pack" | od -An -tx1 | tr -d ' \n')
    url=$(curl -sf -A "$UA" -e "https://kenney.nl/assets/$pack" --max-time 60 "https://kenney.nl/download-link/$id" | python3 -c 'import json,sys; print(json.load(sys.stdin)["url"])')
    curl -sfL -A "$UA" --max-time 300 -o "$d/pack.zip" "$url"
  fi
  echo "$pack zip bytes $(stat -c %s "$d/pack.zip") sha256 $(sha256sum "$d/pack.zip" | cut -d' ' -f1)"
  # the zip keeps read-only directory modes; open them before clearing the last extract.
  chmod -R u+w "$d/x" 2>/dev/null || true
  rm -rf "$d/x"
  mkdir -p "$d/x"
  unzip -q "$d/pack.zip" -d "$d/x"
  licence=$(find "$d/x" -iname 'license*.txt' | head -1)
  grep -q 'CC0' "$licence" || { echo "licence is not cc0: $pack"; exit 1; }
done
# a small venv of its own, so the effects do not wait for the ace-step install.
[ -x "$W/fxvenv/bin/python" ] || python3 -m venv "$W/fxvenv"
"$W/fxvenv/bin/pip" install -q numpy soundfile
cd "$here"
"$W/fxvenv/bin/python" "$here/fx_convert.py" "$here/fx-list.tsv" "$W/fx-src" "$W/out/fx"
