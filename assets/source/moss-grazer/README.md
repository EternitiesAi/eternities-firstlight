# Original moss-grazer body

This asset was authored for Firstlight in Blender 5.2.1 LTS from a nine-ring,
12-sided loft with one Catmull-Clark subdivision. The shoulder, ribcage, waist
and rump form one closed surface. No purchased model, extracted asset, external
texture, linked Blender library or live service is required.

`GRAZER_BODY.blend` is the editable, portable source. `GRAZER_BODY.json` is the
exact exported position/smooth-normal triangle stream in metres, using game
axes X-right/Y-up/Z-forward. Blender axes are X/-Y/Z. The adjacent authoring and
portability reports describe the original export; their historical filenames
refer to staging. The checked-in Blender file is the portable target, renamed
here to `GRAZER_BODY.blend`.

The runtime stores 410 unique position/normal tuples and 2,448 indices. Engine
expands them to 816 triangles (58,752 float32 bytes) in one mesh upload. Only an
Earthlands renderer creates the extra dynamic batch. This is a presentation
mesh: existing path reserves, collision, movement, observation ownership,
rewards and save schemas remain authoritative.

Check or regenerate the compact runtime source from the export:

```text
node tools/bake_grazer_body.cjs --check
node tools/bake_grazer_body.cjs --write
python build.py
```

The packer preserves negative zero and every exported float32 value. Ordinary
builds need neither Blender nor an asset download. To regenerate the authoring
study, run `author.py` only in a separate factory-startup background Blender
process with `--threads 1`, then pass `-- --output <fresh-directory-on-D>`.
The script refuses existing output. It performs no rendering.

Original exported JSON SHA256:
`6b89390775d4e41024ee855a201c2e90cdbb77072daabfee84c3a3cf3aefedd8`.
Native appearance, camera visibility and frame cost must be qualified after
integration; topology and CPU tests alone do not establish those properties.
