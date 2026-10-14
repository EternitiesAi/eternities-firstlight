# An original connected body for the moss grazer

Branch `gameplay/blender-moss-grazer-20261014` starts from PR80's current
`d47587c1acaaf25e26a4d4f3157e69f0325c952d`. Reuse the integrated checkout and
qualification station; no new full copy. This is an art implementation milestone
within the unfinished production game, not a new realm, species rule or canon
claim. Original concept work guided the silhouette; it is not gameplay footage.

The original Blender loft gives the animal one continuous rump, ribcage, tucked
waist and shoulder. A slimmer head, bent legs and lower irregular moss replace
the old rounded assembly. Keep `elderweald-moss-grazer-v1`, its existing browse
behavior and four observation cues. The new render geometry ID is
`earth-grazer-body-v1`; it is not a new encounter or persistent identity.

## Source and ownership

- `assets/source/moss-grazer` retains the small original editable Blender file,
  exact exported geometry and provenance. No external textures or licensed packs.
- `tools/bake_grazer_body.cjs` deterministically packs the existing exported
  vertices/normals, preserving negative zero. Normal builds require no Blender.
- Engine adds one explicit geometry branch and a Node entry dependency. The
  offline shell loads the same baked module before Engine. Existing primitive
  float32 bytes remain unchanged.
- WorldArt creates the extra body batch only in Earthlands and binds actual
  per-frame GrazerArt output. It releases instances on scene exit. Art keeps its
  private submission receipt, canonical observation cues and non-solid status.
- Motion, path reserves, visibility admission, frame witnesses, commands,
  rewards, character storage and all save schemas keep their existing owners.
  There is no migration, XP change, new payout or consent backfill.

## Measured CPU results and next acceptance

The source asset has 410 unique position/normal tuples, 816 triangles and a
58,752-byte expanded vertex buffer. The complete low-quality animal changes
from 29 parts / 4,344 triangles to 26 / 3,864; balanced/high changes from
31 / 4,360 to 28 / 3,880. One extra mesh batch is required. Fewer triangles do
not prove faster frames; native cost remains to measure.

`GRAZER_INTEGRATED_CPU01.log` passes 54 checks with one Node worker. These include
independent manifold/winding/normal/byte validation; actual Engine upload and
instance packing; all prior observation/save boundary tests in the selected
files; ground/height/radius clearance across 240 synthetic poses; true WorldArt
binding, missing-body refusal, scene release and a fresh renderer's buffer.
The fixture's prior paid work and initial pose are explicitly synthetic. The
recording GL host supplies no pixels and is not a native gameplay claim.

Two existing unit-test output arrays and the command-earned wildlife caller now
declare the real new mesh channel. All previous assertions remain. SOURCE01
correctly refused that caller's missing channel; d13d067 repairs it and checks
one actual connected body per CPU presentation receipt. The four new WorldArt
checks reuse the existing fixture within its test file, without source scraping
or a validator facade.

The complete source gate passed at `d13d067f54e0cb32f176ec246afbdde0ae766119` in
the clean exact fetched qualification checkout: 238 commands, Node2,355 passed /
zero failed / two skipped, Python551 run / zero failed / eight skipped, and all
current command-earned journeys. This reused checkout is not a new fresh clone.
See `../evidence/connected-grazer-2026-10-14/FULL_SOURCE_QUALIFICATION.json` for
counts, skips, exact commands and retained failure identities.

The checked-in authoring script was also run in factory-startup Blender5.2.1LTS
with one CPU thread and no rendering. Its generated file was reopened in a
separate Blender process. All816 triangles match the checked-in export exactly
as float32 values, including signed zero; no external library or image remains.
Raw JSON differs only by line endings. The original checked-in asset was not
overwritten. The authoring receipt preserves Blender's factory brush warning
and the actual reopened dependency inspection.

Current native appearance remains open. GRAZER_NATIVE02 refused the outer RAM
check; GRAZER_NATIVE03 refused after Playwright driver startup at6,021,544KiB
against the unchanged6,291,456KiB floor. No browser was allocated. The server
closed and both attempts are terminal. Keep the original1800s suite and actual
launch guard. Ordinary-frame mesh visibility, both-camera appearance, frame cost
and human judgment cannot be inferred from the source or Blender passes.

Earlier staging and failures remain under
`D:/07-GAMES/Firstlight/staging/moss-grazer-refinement-20261014`. Current evidence
belongs under the existing `next-gate` artifact directory. Keep RAM admission,
serial browsers and original verifier deadlines. No VM/Claude/personal-profile
access, unrelated process shutdown, paid work, public deployment or main merge.

The separate exhibition film remains unfinished. RAIN_FILM03 exposed a missing
native Journal open in the capture script (fixed at d47587c); RAIN_FILM04 then
exposed that the Hearthwater invitation lives in Map, not Journal. This branch
corrects that selector path. Those are capture-tool defects, not a completed
recording or a reason to alter game controls. Preserve both terminal failures.
