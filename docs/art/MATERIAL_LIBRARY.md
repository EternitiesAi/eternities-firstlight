# Firstlight material library and D-drive authoring

Prepared 2026-09-30 from gameplay head
`f85bd690466b6be9b2b438f4e06eddb264f3ec13`, PR #21. This separate authoring
branch stages a small material library and a Blender proof. The playable
renderer, generated HTML and save schemas are unchanged.

Read [executed results](MATERIAL_RESULTS_2026-09-30.md) for the inspected renders,
packed Blender scene, storage recovery and verification boundaries.

Dom authorized licensed asset acquisition and heavy storage on D:. The local
home is **`D:/07-GAMES/Firstlight`**. Use it for new source maps, Blender files,
authoring caches, renders, recording artifacts and independent verification
clones. The current active gameplay checkout and stable save origin remain
`C:/dev/firstlight-artifacts/living-world-2026-09-30/gameplay` and
`http://127.0.0.1:8780/`. Completed artifact leaves may move with verified C-path
junctions; do not move active linked worktrees, shared tool environments or
personal profiles merely to tidy the disk.

## Acquired selection

Powered by Poly Haven. Its texture maps are CC0, allowing commercial use,
modification and redistribution. This does not apply to its website example
renders or logos. The API has separate terms; the intake identifies Firstlight
and records source credit. [Asset license](https://polyhaven.com/license),
[API terms](https://github.com/Poly-Haven/Public-API/blob/master/ToS.md).

| Material | Source asset | Proposed Earth use |
|---|---|---|
| Weathered timber | [weathered_planks](https://polyhaven.com/a/weathered_planks) | Doors, boards and shelter surfaces; align grain with authored beams. |
| Pale stone | [rock_boulder_dry](https://polyhaven.com/a/rock_boulder_dry) | Surface on our rounded stone geometry. This is a boulder scan, not a riverstone wall. |
| Plaster | [white_plaster_02](https://polyhaven.com/a/white_plaster_02) | Quiet wall infill between timber. |
| Clay roof | [clay_roof_tiles_02](https://polyhaven.com/a/clay_roof_tiles_02) | Roof fields with rows aligned downhill; keep eaves/ridge geometry. |
| Worked ground | [brown_mud_02](https://polyhaven.com/a/brown_mud_02) | Small orchard/mill soil patches. |

Each material has 1k color JPG, OpenGL normal PNG and roughness JPG. The exact
15-file set totals **30,448,169 bytes**. The frozen manifest lists source URLs,
authors, file lengths, publisher MD5 and metadata hashes; the acquired receipt
records local SHA256 separately. All 15 passed size/MD5 checks. Replay reused
all 15 with zero downloads. These integrity checks are not a signed attestation.

Full maps live outside Git at `assets/sources/polyhaven` under the D home.
The checked-in [manifest](material-proof-2026-09-30/EARTH_MATERIALS_1K.json) and
[receipt](material-proof-2026-09-30/EARTH_MATERIALS_1K_RECEIPT.json) remain small.
No paid packs, add-ons, installers, EXR maps or acquired scripts are needed.

## Reproduce intake

```powershell
python tools/authoring/polyhaven_intake.py --root D:/07-GAMES/Firstlight --acquire
python tools/authoring/polyhaven_intake.py --root D:/07-GAMES/Firstlight
```

The first command acquires only the exact selection. The second verifies without
downloads once frozen membership exists. `--root` also accepts another platform's
storage directory. Existing mismatches refuse instead of overwriting; an
incomplete staging file stays visible for diagnosis. Keep the completed receipt
with the maps. A first acquisition checks current official metadata against the
reviewed count and byte total; metadata drift refuses for deliberate review.

## Authoring and integration boundary

The Blender study uses original authored house-corner geometry and these real
maps. Color is color data; roughness and OpenGL normals are non-color data.
Displacement stays disabled. Packed Blender scenes, full-resolution renders and
caches stay on D. Blender renders are material studies, not gameplay footage or
founder approval of the final art direction.

The current `src/engine.js` has position/normal vertices, instance color and scalar
roughness, plus procedural grain. It has no surface UV/tangent/material texture
pipeline. This library is ready for authoring; it is not automatically present
in the browser game. Next prove one useful timber panel through that renderer,
then evaluate stone/plaster. Keep instancing, collision ownership, offline
assembly, both cameras, low quality and reduced motion. Measure upload/decoded
memory and frame cost before expanding. Do not embed all raw PBR maps into HTML.

No gameplay state, stored XP, chapter history, sockets/fittings, character worlds,
companion, housing, music or personal saves change in this authoring branch.
