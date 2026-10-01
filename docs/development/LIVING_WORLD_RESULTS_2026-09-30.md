# Living world: executed results

Branch `gameplay/living-world-art-direction`, stacked on PR20 `gameplay/a-table-after-the-rain`. Base 7434c950b8801a03217af2d6ad82e4caffc0c033. Newer candidate work was preserved and integrated in an isolated worktree. See task, CURRENT_STATE, art direction and checked-in evidence. PR records the exact pushed head and fresh remote clone receipt.

## Implemented behavior

Normal runtime now includes A Table After the Rain, not a separate candidate HTML. After Fenna's arrival, including unpaid arrival, explicitly accept at the roadside table, physically prepare cloth/lantern/stand, compare three separate authored arrangements, confirm one and share in silence or listen. Durable gathering memory remains per character. It grants no items, currency, XP or chapter advancement. Oren/Fenna rewards stay separate. Audio yields between explicit personal and roadside Play actions; it cancels on lifecycle/owner changes and preserves the personal score.

Firstlight/Earth have heavier timber frames, riverstone, varied roof shingles, workshop tools, more substantial orchard silhouettes, reeds, shelter dressing and a repaired-state mill wheel. Camera bench overlap, Earth height-aware cutaways and visual-table proximity are repaired. Existing navigation solids remain. Earth rendered geometry increased 1410 to2615 instances and 69288 to110662 triangles; balanced draw calls 29 with shadow reuse/42 with refresh, low 15. These counts are not hardware timings.

Realms tab contains an offline five-world concept board and Hearthwater material study generated from preserved references. Earth/Cosmos buttons open existing invitations; Heaven/Hell/Atlantis have no travel action. Rasters/provenance and compressed runtime derivatives are committed. Concepts are aspirational, not game screenshots or founder-approved final architecture.

## Compatibility

World/storage keys 9 unchanged. Adventure 9 migrates to 10 with required earthGathering 1 fresh and unaccepted. Current malformed or forward data refuses, preserving storage. Boundary checks include XP 0/29/30/79/80/149/150/259/260/9999; no cap/curve/reset/rescale. Complete character worlds retain unpaid claims, owned/equipped identities, sockets/fittings, companion, chapters/soul choices, crops/inventory/construction, furnishings, scores/exports and notes. No personal saves were used.

Both generated HTML files are identical: 2,054,945 bytes; SHA256 `adc2137a2635a5302276a021cfa8f33781f8ad9559eb5b4c2275fc59fafcd0c8`. Build remains Python stdlib only. Embedded WebP files total 972906 bytes; no network dependency was added. The original PNGs remain in docs/art; normal build reads committed WebP.

## Local full verification

Executed `python tools/verify.py --browser` using Python 3.13.15 and Node 24.18.0 with the existing Playwright environment. Final complete run passed 51 JavaScript syntax checks, 607/607 Node tests, 26 Python passes plus 1 existing Windows symlink skip (27 total), 24 command-earned journeys and 1297 assertions across 16 browser suites. Gathering 118/118 and offline atlas 37/37 are included. Separate historical component browser 31/31 also passed, but is not counted as a full-game suite. Browser regression uses Chromium 143/software WebGL; exact per-suite counts are in BROWSER_COUNTS.json.

Journeys actually navigate and issue six native gathering commands each; snapshots reload at every durable stage. Blade/bow/strong veteran sources are earned through prior rules. The veteran preserves Dawn's edge and XP 563. Browser coverage exercises full UI, native storage, both cameras, compact layout, stale confirmation, silent participation, actual Web Audio/mute/hidden/blur/stop and delayed resume cancellation across departure/character switch. Atlas loads from file origin, decodes both embedded assets and proves inspection changes no durable progression.

Independent cross-review of the other agent's implementation was bounded to save/authority and scenery/CSP/lifecycle; self-review is labelled separately. Root integrated and ran the full gate. Human fun, beauty, accessibility and comfort remain pending.

## Hardware sample

Normal RAF sample on actual RTX 3080 10GB, driver 610.74, Chrome 154.0.8037.58, ANGLE/D3D11 hardware acceleration confirmed. 1920x1080 drawing buffer, balanced quality, 6 representative Firstlight/orchard/mill/shelter scene-camera cases, 240 intervals per case after warmup. P50 about 6.9ms, P95 7.0ms, P99 about7.1ms; worst 7.3ms; zero intervals above 33.333ms or 50ms across 1440 samples. GPU_REPORT contains raw intervals/setup/driver/render details. This is a short headless browser-frame sample, not GPU render time, monitor presentation timing, a 60 FPS claim or human qualification.

## Failures retained and corrected

The earlier staged-only component proof was insufficient; this pass uses the real app. Source gate initially found an old scenery test mock missing the newly used renderer/map/beam interface; the fixture now supplies those while keeping the same hill/camera-clearance assertions. First Crossing browser check still expected adventure 9; it now strictly expects 10 with world 9 unchanged. Their failure logs are preserved in the local verification directory.

Cross-review found the visible table outside rule reach and the shelter bench collapsing follow camera. Actual geometry/keyboard checks now cover repaired locations. Personal music-loop/roadside-preview conflict reproduced red in full UI, then passed after pure getters and explicit mutual exclusion; AUDIO_HANDOFF_RED preserves that negative run. Initial GPU setup chose a point inside the existing shed; canonical navigation refused it. A valid orchard waypoint was chosen without changing navigation; the failed setup receipt remains local.

Hosted PR20 run 36014640389 reported account locked due to billing; jobs had zero executed steps. This is not a code-test result. New PR hosted status and fresh pushed-clone results must be read in the PR receipt, not inferred from these local checks.

## Actual gameplay footage

`docs/evidence/living-world/LIVING_WORLD_GAMEPLAY.mp4`: 73.32seconds, 1280x720, 1833 encoded frames (25 fps encoding), 37 normal-RAF UI/navigation actions on Chrome 154/RTX 3080. The command-earned strongest-gear source physically enters Earth, accepts/prepares/chooses/shares the table, swaps both cameras and browses the five-realm atlas. Final native gathering is accepted, three preparations complete, mill arrangement kept and shared. Browser errors 0; no progress grants, scene teleports or accelerated stepping. The video is silent and is not a FPS measurement. GAMEPLAY_REPORT records source/hash/actions/final state and video SHA2560227f986247d149e1d57dfb3dc3e7fce119601667c0386dc653832ba2149eae7.

## Remaining limits

Full five-realm game, final character animation/materials, mesh-import compatibility, controller qualification, multiplayer/trading and larger campaign are future work. Paintings do not close those gates. Dom has not yet human-tested this milestone. Uncertain founder economics/construction/rare-pet/offline-loss decisions remain unresolved. No main merge, public deployment, paid external generation or engine rewrite.
