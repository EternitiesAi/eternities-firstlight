# Body sources

## Blender 5.3.0, headless (linux x64)

- file: `blender-5.3.0-linux-x64.tar.xz` (406,944,100 bytes)
- sha256: `dacb8264197a3f7fda6001285a5a506fc97ee943881261c2c3bd63c882f22e05`
- source: https://mirror.clarkson.edu/blender/release/Blender5.3/blender-5.3.0-linux-x64.tar.xz
- checked against: https://mirror.clarkson.edu/blender/release/Blender5.3/blender-5.3.0.sha256 (the mirror's own checksum file)
- installed on the build box only, under `/work/people/blender`; run as `blender -b`. Nothing installed on the workstation.

## Human Base Meshes bundle v1.4.1 (CC0)

- file: `human-base-meshes-bundle-v1.4.1.zip` (50,643,039 bytes)
- sha256: `811f43accbb31a88266d932f8f5563b2d13586fca0ba2693aad1f5fe582b3515` (recorded from the download; the mirror publishes no checksum for this file)
- source: https://mirror.clarkson.edu/blender/demo/asset-bundles/human-base-meshes/human-base-meshes-bundle-v1.4.1.zip
- licence: the `README` text in `human_base_meshes_bundle.blend` reads "All provided assets are public domain under the CC0 license." The same file also holds a "Rain Rig" licence line under CC BY 4.0 for an asset this lane does not use.
- objects used: `GEO-body_male_stylized` (decimated to 1,898 triangles), `GEO-head_stylized` (600), `Hand - Stylized` (90). Feet are not used: the rig's boot boxes stay. The bundle has no armature or vertex groups, so the body is split geometrically along the traveler rig's joints.

## Provenance caveat

download.blender.org and www.blender.org returned HTTP 403 to automated clients, both from the AWS build box and from the workstation. Both files above come from the mirror tree, which lists the same release and demo paths. The tarball is checked against the mirror's checksum file; the bundle's hash is recorded only.

## Derived files

- `tools/bodies/fetch_vendor.sh`: the fetch with the URLs above.
- `tools/bodies/export_rig_parts.cjs` writes `assets/source/human-bodies/RIG_PARTS.json` (the rig's 49 rest parts and limb joints).
- `tools/bodies/bake_bodies.py` (Blender) writes `assets/source/human-bodies/BODY_PARTS.json` and `BAKE_REPORT.json`.
- `tools/bake_bodies.cjs` packs the committed source into `src/body-meshes.js` without Blender; `--check` reproduces it byte for byte.
- `tools/bodies/smoke_bundle.py` lists the bundle objects and licence lines and renders one Cycles PNG.
