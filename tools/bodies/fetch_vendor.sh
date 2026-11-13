#!/usr/bin/env bash
# Fetch the pinned Blender tarball and the CC0 Human Base Meshes bundle for the body bake.
# download.blender.org and blender.org answer automated clients with 403 from the build box
# and from the workstation, so both come from mirror.clarkson.edu, which mirrors the same
# Blender release and demo trees. Integrity: the tarball is checked against the mirror's own
# .sha256 file; the bundle has no published hash on the mirror, so its sha256 is printed for
# the record in assets/bodies/SOURCES.md. Usage: fetch_vendor.sh <destination dir>
set -euo pipefail
DEST="${1:?destination directory}"
mkdir -p "$DEST"
cd "$DEST"
MIRROR=https://mirror.clarkson.edu/blender
BLENDER=blender-5.3.0-linux-x64.tar.xz
BUNDLE=human-base-meshes-bundle-v1.4.1.zip
curl -fsSL -o "$BLENDER" "$MIRROR/release/Blender5.3/$BLENDER"
curl -fsSL -o blender-5.3.0.sha256 "$MIRROR/release/Blender5.3/blender-5.3.0.sha256"
grep -F "$BLENDER" blender-5.3.0.sha256 | sha256sum -c -
curl -fsSL -o "$BUNDLE" "$MIRROR/demo/asset-bundles/human-base-meshes/$BUNDLE"
sha256sum "$BUNDLE"
